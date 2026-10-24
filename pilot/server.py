#!/usr/bin/env python3
"""Локальный сервер «Пилота эксперимента». Только стандартная библиотека Python 3."""

from __future__ import annotations

import argparse
import json
import secrets
import threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

ROOT = Path(__file__).resolve().parent
DATA = ROOT / "data"
SESSIONS = DATA / "sessions.json"
ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
CODE_RE_PARTS = 3
MAX_BODY = 2_000_000
STATIC = {
    "/": "index.html",
    "/index.html": "index.html",
    "/style.css": "style.css",
    "/app.js": "app.js",
}
TYPES = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
}

LOCK = threading.Lock()


def make_code() -> str:
    def chunk() -> str:
        return "".join(secrets.choice(ALPHABET) for _ in range(4))

    return f"{chunk()}-{chunk()}-{chunk()}"


def valid_code(code: str) -> bool:
    parts = code.split("-")
    return (
        len(parts) == CODE_RE_PARTS
        and all(len(part) == 4 and all(ch in ALPHABET for ch in part) for part in parts)
    )


def state_path(code: str) -> Path:
    return DATA / f"{code}.json"


def read_json(path: Path, default):
    if not path.exists():
        return default
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, obj) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(path.suffix + ".tmp")
    tmp.write_text(json.dumps(obj, ensure_ascii=False, indent=2), encoding="utf-8")
    tmp.replace(path)


def load_sessions() -> dict:
    data = read_json(SESSIONS, {})
    return data if isinstance(data, dict) else {}


def save_sessions(sessions: dict) -> None:
    write_json(SESSIONS, sessions)


class Handler(BaseHTTPRequestHandler):
    server_version = "Pilot/1.0"

    def log_message(self, fmt: str, *args) -> None:
        print(f"{self.address_string()} {fmt % args}")

    def cookie_sid(self) -> str | None:
        raw = self.headers.get("Cookie", "")
        for part in raw.split(";"):
            name, _, value = part.strip().partition("=")
            if name == "sid" and value:
                return value
        return None

    def send_json(self, obj, status: int = 200, cookie: str | None = None, clear_cookie: bool = False) -> None:
        body = json.dumps(obj, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        if cookie:
            self.send_header("Set-Cookie", f"sid={cookie}; Path=/; HttpOnly; SameSite=Lax")
        if clear_cookie:
            self.send_header("Set-Cookie", "sid=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0")
        self.end_headers()
        self.wfile.write(body)

    def read_body(self):
        length = int(self.headers.get("Content-Length", "0") or "0")
        if length < 0 or length > MAX_BODY:
            raise ValueError("слишком большое тело запроса")
        raw = self.rfile.read(length) if length else b""
        if not raw:
            return {}
        return json.loads(raw.decode("utf-8"))

    def do_GET(self) -> None:
        parsed = urlparse(self.path)
        if parsed.path == "/api/session":
            self.handle_session()
            return
        if parsed.path == "/api/state":
            self.handle_state_get(parse_qs(parsed.query))
            return
        self.serve_static(parsed.path)

    def do_POST(self) -> None:
        parsed = urlparse(self.path)
        try:
            body = self.read_body()
        except (ValueError, json.JSONDecodeError):
            self.send_json({"error": "не удалось прочитать запрос"}, 400)
            return
        if parsed.path == "/api/new":
            self.handle_new()
        elif parsed.path == "/api/link":
            self.handle_link(body)
        elif parsed.path == "/api/logout":
            self.handle_logout()
        else:
            self.send_json({"error": "не найдено"}, 404)

    def do_PUT(self) -> None:
        parsed = urlparse(self.path)
        if parsed.path != "/api/state":
            self.send_json({"error": "не найдено"}, 404)
            return
        try:
            body = self.read_body()
        except (ValueError, json.JSONDecodeError):
            self.send_json({"error": "не удалось прочитать запрос"}, 400)
            return
        self.handle_state_put(parse_qs(parsed.query), body)

    def handle_new(self) -> None:
        code = make_code()
        sid = secrets.token_hex(16)
        with LOCK:
            write_json(state_path(code), {})
            sessions = load_sessions()
            sessions[sid] = code
            save_sessions(sessions)
        self.send_json({"code": code}, cookie=sid)

    def handle_link(self, body) -> None:
        code = str(body.get("code") or "").strip().upper()
        if not valid_code(code) or not state_path(code).exists():
            self.send_json({"error": "код не найден"}, 404)
            return
        sid = secrets.token_hex(16)
        with LOCK:
            sessions = load_sessions()
            sessions[sid] = code
            save_sessions(sessions)
        self.send_json({"code": code}, cookie=sid)

    def handle_logout(self) -> None:
        sid = self.cookie_sid()
        if sid:
            with LOCK:
                sessions = load_sessions()
                sessions.pop(sid, None)
                save_sessions(sessions)
        self.send_json({"ok": True}, clear_cookie=True)

    def handle_session(self) -> None:
        sid = self.cookie_sid()
        code = None
        if sid:
            with LOCK:
                code = load_sessions().get(sid)
            if code and not state_path(code).exists():
                code = None
        self.send_json({"code": code})

    def handle_state_get(self, query) -> None:
        code = (query.get("code") or [""])[0].strip().upper()
        if not valid_code(code):
            self.send_json({"error": "код не найден"}, 404)
            return
        path = state_path(code)
        if not path.exists():
            self.send_json({"error": "код не найден"}, 404)
            return
        with LOCK:
            data = read_json(path, {})
        self.send_json(data)

    def handle_state_put(self, query, body) -> None:
        code = (query.get("code") or [""])[0].strip().upper()
        if not valid_code(code) or not state_path(code).exists():
            self.send_json({"error": "код не найден"}, 404)
            return
        if not isinstance(body, dict):
            self.send_json({"error": "ожидался объект"}, 400)
            return
        with LOCK:
            write_json(state_path(code), body)
        self.send_json({"ok": True})

    def serve_static(self, path: str) -> None:
        name = STATIC.get(path)
        if not name:
            self.send_error(404, "not found")
            return
        file = ROOT / name
        data = file.read_bytes()
        self.send_response(200)
        self.send_header("Content-Type", TYPES[file.suffix])
        self.send_header("Content-Length", str(len(data)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(data)


def main() -> None:
    parser = argparse.ArgumentParser(description="Локальный пилот эксперимента с алгоритмом X")
    parser.add_argument("--host", default="127.0.0.1", help="127.0.0.1 только этот компьютер; 0.0.0.0 ещё и телефон в домашней сети")
    parser.add_argument("--port", type=int, default=5055)
    args = parser.parse_args()
    DATA.mkdir(parents=True, exist_ok=True)
    httpd = ThreadingHTTPServer((args.host, args.port), Handler)
    where = "http://127.0.0.1" if args.host in ("127.0.0.1", "localhost") else "http://" + args.host
    print(f"Пилот эксперимента: {where}:{args.port}", flush=True)
    print(f"Данные: {DATA}", flush=True)
    print("Остановка: Ctrl+C", flush=True)
    if args.host == "0.0.0.0":
        print("Сервер слушает сеть. Код эксперимента — это пароль. Не пробрасывайте порт в интернет.", flush=True)
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nОстановлен.")
    finally:
        httpd.server_close()


if __name__ == "__main__":
    main()
