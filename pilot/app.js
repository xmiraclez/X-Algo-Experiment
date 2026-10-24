(() => {
'use strict';

/* ============================== Константы ============================== */
const TOTAL = 30, BASELINE = 6;
const H = 3600e3, MIN = 60e3, DAY = 86400e3;

const SRC = {
  repo: ['https://github.com/xai-org/x-algorithm', 'код xai-org/x-algorithm'],
  smf: ['https://www.smfclearinghouse.com/blog/2026-08-14-x-for-you-algorithm-rank-then-visibility/', 'SMF Clearinghouse'],
  best: ['https://www.bestblogs.dev/en/explore/topics/grok-xai-summer-2026', 'BestBlogs'],
  postory: ['https://postory.io/blog/x-algorithm-2026', 'Postory'],
  sp: ['https://www.socialpilot.co/blog/twitter-algorithm', 'SocialPilot'],
  osfy: ['https://www.opensourceforu.com/2026/08/x-open-sources-its-ranking-algorithm/', 'Open Source For You'],
  rules: ['https://help.x.com/en/rules-and-policies/authenticity', 'правила X'],
};

const INSIGHTS = [
  ['пост старше 48 часов вообще не попадает в ленту «Для вас».', 'repo'],
  ['уже просмотренный пост повторно не покажут — за этим следят два фильтра.', 'repo'],
  ['каждый следующий пост того же автора в выдаче получает понижение.', 'repo'],
  ['посты от тех, на кого вы не подписаны, получают множитель меньше 1.', 'repo'],
  ['у авторов с небольшим числом показов есть буст «нового автора».', 'repo'],
  ['лента собирается из двух источников: подписки и поиск по всем постам.', 'repo'],
  ['кандидатов ищет двухбашенная модель: эмбеддинг зрителя против поста.', 'repo'],
  ['модель предсказывает 25 действий, включая «пролистал, не задержавшись».', 'repo'],
  ['модель отдельно предсказывает, отправите ли вы пост в личку.', 'repo'],
  ['модель предсказывает даже, сколько вы пробудете в профиле автора.', 'repo'],
  ['репорт весит в 468 раз больше лайка. Но это вес вероятности, не счёт.', 'repo'],
  ['часть постов X намеренно скрывает от части людей: это holdout-фильтры.', 'repo'],
  ['у новых аккаунтов посты вне подписок проходят только выше порога реакций.', 'repo'],
  ['из одного обсуждения в ленту попадает одна ветка, остальные скрыты.', 'repo'],
  ['после ранжирования фильтр видимости может убрать даже топовый пост.', 'repo'],
  ['реклама встраивается уже после ранжирования и может сдвинуть посты.', 'repo'],
  ['ответ около 5, лайк около 0,5: это вес вероятности, не обменный курс.', 'smf'],
  ['с июля 2026 в ленте больше постов от взаимных подписок.', 'sp'],
  ['у «скрыть автора» вес −58.8, у лайка — +0.5.', 'best'],
  ['ответ от взаимного подписчика получает дополнительный буст.', 'smf'],
  ['реакции от неподписанных учитываются со скидкой около 25%.', 'best'],
  ['каждый пост оценивает VLM-модель на «бэнгерность»: порог 0.4 из 1.', 'postory'],
  ['у той же модели есть отдельная оценка «слопа» — шаблонности.', 'postory'],
  ['Grok оценивает качество ответов от 0 до 3; ответ-эмодзи — почти 0.', 'postory'],
  ['ответы аккаунтов до 1K подписчиков проходят доп. проверку на спам.', 'postory'],
  ['текст, картинки и видео получают общие мультимодальные эмбеддинги.', 'postory'],
  ['модель читает ваши последние ~128 действий как последовательность.', 'sp'],
  ['лента «Подписки» с ноября 2025 тоже ранжируется, а не идёт по времени.', 'sp'],
  ['в настройках есть «Under the Hood» — выгрузка меток вашего аккаунта.', 'osfy'],
  ['повтор одинаковых постов правила X считают спамом. Мой меняется.', 'rules'],
];

const L2 = [
  'Публикую этот пост каждый день и смотрю, что с ним делает алгоритм X.',
  'Каждый день выкладываю этот пост и записываю, как его раздаёт X.',
  'Ежедневный замер: как алгоритм X распространяет этот формат.',
];

const FACT_NAMES = { A: 'Картинка-график', B: 'Вопрос-прогноз', C: 'Быстрые ответы' };
const MONTHS = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];
const WD = ['воскресенье','понедельник','вторник','среда','четверг','пятница','суббота'];
const WD_S = ['вс','пн','вт','ср','чт','пт','сб'];
const W_VIEWS = ['просмотр','просмотра','просмотров'];
const W_LIKES = ['лайк','лайка','лайков'];
const W_REPL = ['ответ','ответа','ответов'];

/* ============================== Утилиты ============================== */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function NOW() {
  const m = location.hash.match(/now=([0-9T:\-]+)/);
  if (m) { const d = new Date(m[1]); if (!isNaN(d)) return d; }
  return new Date();
}
const pad = (n) => String(n).padStart(2, '0');
const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parseYmd = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const atTime = (day, hhmm) => { const [h, mi] = hhmm.split(':').map(Number); return new Date(day.getFullYear(), day.getMonth(), day.getDate(), h, mi, 0, 0); };
const addDays = (d, n) => { const r = new Date(d); r.setDate(r.getDate() + n); return r; };
const sod = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const sameDay = (a, b) => ymd(a) === ymd(b);
const hm = (d) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
const dm = (d) => `${d.getDate()} ${MONTHS[d.getMonth()]}`;
const toLocalInput = (d) => `${ymd(d)}T${hm(d)}`;
function whenLabel(d, ref = NOW()) {
  if (sameDay(d, ref)) return `сегодня в ${hm(d)}`;
  if (sameDay(d, addDays(ref, 1))) return `завтра в ${hm(d)}`;
  return `${dm(d)} в ${hm(d)}`;
}
const fmtN = (n) => (n == null || isNaN(n) ? '—' : Math.round(n).toLocaleString('ru-RU'));
const fmtX = (x, digits = 2) => x.toFixed(digits).replace('.', ',');
function plural(n, f) {
  const a = Math.abs(Math.round(n)) % 100, b = a % 10;
  if (a > 10 && a < 20) return f[2];
  if (b > 1 && b < 5) return f[1];
  if (b === 1) return f[0];
  return f[2];
}
function parseNum(s) {
  if (s == null) return null;
  let t = String(s).trim().toLowerCase().replace(/[\s\u00a0\u202f]/g, '').replace(',', '.');
  if (!t) return null;
  let mult = 1;
  if (/(к|k|тыс\.?)$/.test(t)) { mult = 1000; t = t.replace(/(к|k|тыс\.?)$/, ''); }
  else if (/(м|m|млн)$/.test(t)) { mult = 1e6; t = t.replace(/(м|m|млн)$/, ''); }
  const v = parseFloat(t);
  return isFinite(v) && v >= 0 ? Math.round(v * mult) : null;
}
function parseList(s) {
  const str = String(s || '').trim();
  if (!str) return [];
  const parts = /[\n,;]/.test(str) ? str.split(/[\n,;]+/) : str.split(/\s+/);
  return parts.map(parseNum).filter((v) => v != null && v > 0);
}
function parseForecasts(s) {
  const out = [];
  for (const line of String(s || '').split('\n')) {
    const m = line.match(/@?([A-Za-z0-9_]{1,30})[^0-9]*([0-9][0-9\s.,]*\s*(?:к|k|тыс)?)/i);
    if (!m) continue;
    const v = parseNum(m[2]);
    if (v && v > 0) out.push({ h: m[1], v });
  }
  return out;
}
const median = (a) => { if (!a.length) return null; const s = [...a].sort((x, y) => x - y); const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
const mean = (a) => (a.length ? a.reduce((s, v) => s + v, 0) / a.length : null);
const sd = (a) => { if (a.length < 2) return null; const m = mean(a); return Math.sqrt(a.reduce((s, v) => s + (v - m) ** 2, 0) / (a.length - 1)); };
const clen = (s) => [...s].length;

function mulberry32(a) { return function () { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function shuffle(arr, rnd) { for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; }
function randSalt() { const abc = 'abcdefghijkmnpqrstuvwxyz23456789'; let s = ''; for (let i = 0; i < 10; i++) s += abc[Math.floor(Math.random() * abc.length)]; return s; }

// SHA-256 (UTF-8)
function sha256(str) {
  const K = [0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2];
  const bytes = new TextEncoder().encode(str);
  const l = bytes.length, withOne = l + 1, total = Math.ceil((withOne + 8) / 64) * 64;
  const buf = new Uint8Array(total); buf.set(bytes); buf[l] = 0x80;
  const dv = new DataView(buf.buffer);
  dv.setUint32(total - 4, (l * 8) >>> 0); dv.setUint32(total - 8, Math.floor((l * 8) / 4294967296));
  let h = [0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19];
  const w = new Uint32Array(64);
  const rotr = (x, n) => (x >>> n) | (x << (32 - n));
  for (let off = 0; off < total; off += 64) {
    for (let i = 0; i < 16; i++) w[i] = dv.getUint32(off + i * 4);
    for (let i = 16; i < 64; i++) { const s0 = rotr(w[i-15],7) ^ rotr(w[i-15],18) ^ (w[i-15] >>> 3); const s1 = rotr(w[i-2],17) ^ rotr(w[i-2],19) ^ (w[i-2] >>> 10); w[i] = (w[i-16] + s0 + w[i-7] + s1) >>> 0; }
    let [a, b, c, d, e, f, g, hh] = h;
    for (let i = 0; i < 64; i++) {
      const S1 = rotr(e,6) ^ rotr(e,11) ^ rotr(e,25); const ch = (e & f) ^ (~e & g); const t1 = (hh + S1 + ch + K[i] + w[i]) >>> 0;
      const S0 = rotr(a,2) ^ rotr(a,13) ^ rotr(a,22); const mj = (a & b) ^ (a & c) ^ (b & c); const t2 = (S0 + mj) >>> 0;
      hh = g; g = f; f = e; e = (d + t1) >>> 0; d = c; c = b; b = a; a = (t1 + t2) >>> 0;
    }
    h = [h[0]+a, h[1]+b, h[2]+c, h[3]+d, h[4]+e, h[5]+f, h[6]+g, h[7]+hh].map((x) => x >>> 0);
  }
  return h.map((x) => x.toString(16).padStart(8, '0')).join('');
}

/* ============================== Состояние и сервер ============================== */
const API = (() => {
  const raw = window.__API_BASE__ || '';
  const unresolved = raw.startsWith('__PORT_');
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname);
  if (unresolved && !local) return null;
  if (unresolved) return location.port === '5055' ? '' : 'http://localhost:5055';
  return raw;
})();

let S = null, CODE = null, TAB = 'today', EDIT_DAY = null;
let saveTimer = null, saving = false, dirty = false, lastSaved = null, saveError = false;

async function api(path, opts = {}) {
  const res = await fetch(`${API}${path}`, { credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, ...opts });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) { const e = new Error(data.error || res.status); e.status = res.status; throw e; }
  return data;
}

function freshState() {
  return {
    v: 1,
    setup: { done: false, step: 0, handle: '', followers: null, history: [], historyRaw: '', postTime: '19:00', day0Date: null,
      seed: Math.floor(Math.random() * 2 ** 31), salt: randSalt(), insights: INSIGHTS.map(([t, s]) => ({ t, s })) },
    day0: {}, days: {}, weeks: {}, final: {}, paused: false, log: [],
  };
}

function save() {
  dirty = true;
  clearTimeout(saveTimer);
  saveTimer = setTimeout(flush, 350);
  renderSaveState();
}
async function flush() {
  if (saving || !dirty || !CODE) return;
  saving = true; dirty = false; renderSaveState();
  try {
    await api(`/api/state?code=${CODE}`, { method: 'PUT', body: JSON.stringify(S) });
    lastSaved = new Date(); saveError = false;
  } catch (e) { saveError = true; dirty = true; }
  saving = false; renderSaveState();
  if (dirty && !saveError) flush();
}
window.addEventListener('pagehide', () => {
  if ((!dirty && !saving) || !CODE) return;
  dirty = false;
  fetch(`${API}/api/state?code=${CODE}`, {
    method: 'PUT', body: JSON.stringify(S), keepalive: true,
    headers: { 'Content-Type': 'application/json' },
  }).catch(() => {});
});
function renderSaveState() {
  const el = $('#savestate'); if (!el) return;
  el.classList.toggle('err', saveError);
  if (saveError) el.innerHTML = 'Не сохранилось · <button class="btn-link" data-action="retry-save" style="border:0;background:none;color:inherit;text-decoration:underline;cursor:pointer;padding:0">повторить</button>';
  else if (saving || dirty) el.textContent = 'Сохраняю…';
  else if (lastSaved) el.textContent = `Сохранено в ${hm(lastSaved)}`;
  else el.textContent = CODE ? `Код ${CODE}` : '';
}
function log(text) { S.log.push({ t: new Date().toISOString(), text }); if (S.log.length > 400) S.log.shift(); }

function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove('show'), 2600);
}

/* ============================== Модель эксперимента ============================== */
const schedCache = {};
function schedule() {
  const seed = S.setup.seed;
  if (schedCache[seed]) return schedCache[seed];
  const rnd = mulberry32(seed);
  const days = [];
  for (let d = 1; d <= BASELINE; d++) days.push({ d, phase: 'baseline', block: 0, A: 0, B: 0, C: 1 });
  const combos = []; for (const A of [0, 1]) for (const B of [0, 1]) for (const C of [0, 1]) combos.push({ A, B, C });
  for (let b = 1; b <= 3; b++) shuffle(combos.slice(), rnd).forEach((c) => days.push({ d: days.length + 1, phase: 'randomized', block: b, ...c }));
  const ins = shuffle([...Array(30).keys()], rnd);
  days.forEach((x, i) => (x.ins = ins[i]));
  return (schedCache[seed] = days);
}
const cond = (d) => schedule()[d - 1];
const commitString = () => schedule().map((x) => `${x.A}${x.B}${x.C}`).join(' ') + ' ' + S.setup.salt;
const rec = (d) => S.days[d] || (S.days[d] = {});
const getRec = (d) => S.days[d] || {};
const factOf = (d) => { const r = getRec(d); if (r.fact) return r.fact; const i = S.setup.insights[cond(d).ins]; return i ? i.t : ''; };
const factSrc = (d) => { const i = S.setup.insights[cond(d).ins]; return SRC[i?.s] || SRC.repo; };
const postedAt = (idx) => { const v = idx === 0 ? S.day0.postedAt : getRec(idx).postedAt; return v ? new Date(v) : null; };
function lastPosted() {
  if (!S.day0.postedAt) return -1;
  let n = 0; for (let d = 1; d <= TOTAL; d++) { if (getRec(d).postedAt) n = d; else break; }
  return n;
}
function nextPost(t = NOW()) {
  const n = lastPosted(); if (n >= TOTAL) return null;
  const idx = n + 1;
  const base = idx === 0 ? atTime(parseYmd(S.setup.day0Date), S.setup.postTime) : atTime(addDays(sod(postedAt(idx - 1)), 1), S.setup.postTime);
  let sched = base, shifted = false;
  while (t - sched > 4 * H) { sched = addDays(sched, 1); shifted = true; }
  return { idx, sched, shifted };
}
const baseMedian = () => median(S.setup.history) || 0;
const viralThreshold = () => Math.max(1000, Math.round(baseMedian() * 10));
function historyStats(arr) {
  const v = arr.filter((x) => x > 0);
  if (v.length < 5) return null;
  const logs = v.map(Math.log);
  const sigma = sd(logs);
  const mde = Math.exp(2.8 * sigma * Math.sqrt(4 / 24));
  return { n: v.length, med: median(v), sigma, mde };
}
function resultsDate() {
  if (S.day0.resultsDate) return parseYmd(S.day0.resultsDate);
  return addDays(parseYmd(S.setup.day0Date), 32);
}
const forecastDeadline = (d) => { const p = postedAt(d); const np = nextPost(); const base = p || (np && np.idx === d ? np.sched : NOW()); return new Date(base.getTime() + 2 * H); };

/* ============================== Тексты постов ============================== */
function dataLine(d, compact) {
  if (d === 1) return 'Это первая точка: данных пока нет.';
  const p = getRec(d - 1).h24;
  const lead = compact ? `День ${d - 1}` : `Вчера, день ${d - 1}`;
  if (!p) return `${lead}: …`;
  return `${lead}: ${fmtN(p.impr)} ${plural(p.impr, W_VIEWS)} · ${fmtN(p.likes)} ${plural(p.likes, W_LIKES)} · ${fmtN(p.replies)} ${plural(p.replies, W_REPL)}`;
}
function postText(d) {
  const c = cond(d), r = getRec(d);
  const build = (compact) => {
    let t = `День ${d}/30. ${L2[r.variant || 0]}\n\n${dataLine(d, compact)}\nФакт дня: ${factOf(d)}`;
    if (c.B) t += `\n\nСколько просмотров будет за сутки? Пишите прогноз до ${hm(forecastDeadline(d))}.`;
    return t;
  };
  let t = build(false);
  if (clen(t) > 280) t = build(true);
  return t;
}
function day0Text(due) {
  const d0 = due ? sod(due) : parseYmd(S.setup.day0Date);
  const start = addDays(d0, 1);
  const res = S.day0.resultsDate ? parseYmd(S.day0.resultsDate) : addDays(d0, 32);
  return `X открыл код своей рекомендательной системы. Хочу проверить снаружи, работает ли она так, как написано.\n\n30 дней подряд публикую пост одного формата, по случайному расписанию меняю в нём три вещи и показываю все цифры.\n\nСтарт — ${dm(start)}, итоги — ${dm(res)}.`;
}
function day0Thread() {
  return [
    'Что меняется по расписанию:\n— картинка или только текст;\n— вопрос к вам или без него;\n— отвечаю на комментарии сразу или через 3 часа.\n\nВремя, длина и формат каждый день одинаковые.',
    'Что проверяю: падают ли просмотры, когда формат повторяется, и помогают ли картинка, вопрос и быстрые ответы.\n\nГлавная метрика — просмотры за первые 24 часа. Выводы — только в конце, без подглядывания.',
    `Расписание составлено до старта. Его SHA-256:\n${S.setup.hash}\n\nВ конце опубликую расписание и соль — любой сможет проверить, что я ничего не подгонял.`,
  ];
}
function leaderboard(maxDay = TOTAL) {
  const by = {};
  for (let d = 1; d <= maxDay; d++) {
    const r = getRec(d); if (!r.h24 || !r.forecasts) continue;
    for (const f of r.forecasts) { const k = f.h.toLowerCase(); (by[k] ||= { h: f.h, e: [] }).e.push(Math.abs(Math.log(f.v / r.h24.impr))); }
  }
  return Object.values(by).map((x) => ({ h: x.h, n: x.e.length, err: mean(x.e) })).sort((a, b) => a.err - b.err || b.n - a.n);
}
function digestText(k) {
  const a = 7 * k - 6, b = 7 * k;
  const vals = []; for (let d = a; d <= b; d++) { const r = getRec(d); if (r.h24) vals.push(r.h24.impr); }
  const lb = leaderboard(b).slice(0, 3);
  let t = `Неделя ${k} эксперимента с алгоритмом X — дни ${a}–${b}.\n\n`;
  if (vals.length) t += `Просмотры за первые сутки: медиана ${fmtN(median(vals))}, от ${fmtN(Math.min(...vals))} до ${fmtN(Math.max(...vals))}.\n`;
  if (lb.length) t += `Точнее всех угадывали: ${lb.map((x) => '@' + x.h).join(', ')}.\n`;
  t += '\nЧто работает, а что нет, скажу только в конце: если подглядывать по ходу, легко «найти» эффект, которого нет.';
  return t;
}

/* ============================== Статистика ============================== */
function invert(A) {
  const n = A.length; const M = A.map((r, i) => [...r, ...Array.from({ length: n }, (_, j) => (i === j ? 1 : 0))]);
  for (let i = 0; i < n; i++) {
    let p = i; for (let r = i + 1; r < n; r++) if (Math.abs(M[r][i]) > Math.abs(M[p][i])) p = r;
    if (Math.abs(M[p][i]) < 1e-12) return null;
    [M[i], M[p]] = [M[p], M[i]];
    const pv = M[i][i]; for (let j = 0; j < 2 * n; j++) M[i][j] /= pv;
    for (let r = 0; r < n; r++) if (r !== i) { const f = M[r][i]; if (f) for (let j = 0; j < 2 * n; j++) M[r][j] -= f * M[i][j]; }
  }
  return M.map((r) => r.slice(n));
}
function ols(X, y) {
  const n = X.length, k = X[0].length;
  const XtX = Array.from({ length: k }, () => Array(k).fill(0)), Xty = Array(k).fill(0);
  for (let i = 0; i < n; i++) for (let a = 0; a < k; a++) { Xty[a] += X[i][a] * y[i]; for (let b = 0; b < k; b++) XtX[a][b] += X[i][a] * X[i][b]; }
  const inv = invert(XtX); if (!inv) return null;
  const beta = inv.map((r) => r.reduce((s, v, j) => s + v * Xty[j], 0));
  let rss = 0; for (let i = 0; i < n; i++) { const f = X[i].reduce((s, v, j) => s + v * beta[j], 0); rss += (y[i] - f) ** 2; }
  const dof = Math.max(n - k, 1), s2 = rss / dof;
  return { beta, se: inv.map((r, i) => Math.sqrt(Math.max(r[i] * s2, 0))), sigma: Math.sqrt(s2), dof };
}
function lgamma(z) { const g = 7, c = [0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7]; if (z < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * z)) - lgamma(1 - z); z -= 1; let x = c[0]; for (let i = 1; i < g + 2; i++) x += c[i] / (z + i); const t = z + g + 0.5; return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(x); }
function tcdfAbs(t, v) { // P(|T| <= t)
  const k = Math.exp(lgamma((v + 1) / 2) - lgamma(v / 2)) / Math.sqrt(v * Math.PI);
  const f = (x) => k * Math.pow(1 + (x * x) / v, -(v + 1) / 2);
  const n = 600, h = t / n; let sum = f(0) + f(t);
  for (let i = 1; i < n; i++) sum += f(i * h) * (i % 2 ? 4 : 2);
  return Math.min(1, 2 * (sum * h) / 3);
}
const tpval = (t, v) => Math.max(0, 1 - tcdfAbs(Math.abs(t), Math.max(v, 1)));
function tcrit(dof) { let lo = 1, hi = 20; for (let i = 0; i < 50; i++) { const m = (lo + hi) / 2; if (tcdfAbs(m, Math.max(dof, 1)) < 0.95) lo = m; else hi = m; } return (lo + hi) / 2; }
function designRows(rows) { const md = mean(rows.map((r) => r.d)); return rows.map((r) => [1, r.d - md, r.A, r.B, r.C]); }

function analyze(withPerm = false) {
  const rows = [];
  for (let d = 1; d <= TOTAL; d++) { const r = getRec(d); if (r.h24 && r.h24.impr > 0) rows.push({ d, ...cond(d), y: Math.log(r.h24.impr), r }); }
  const out = { rows, n: rows.length };
  const views = rows.map((x) => x.r.h24.impr);
  out.total = views.reduce((s, v) => s + v, 0); out.med = median(views); out.max = views.length ? Math.max(...views) : null;
  out.maxDay = rows.find((x) => x.r.h24.impr === out.max)?.d;
  out.follows = rows.reduce((s, x) => s + (x.r.h24.follows || 0), 0);
  const base = rows.filter((x) => x.phase === 'baseline');
  if (base.length >= 3) {
    const f = ols(base.map((x) => [1, x.d]), base.map((x) => x.y));
    if (f) { const t = tcrit(f.dof); out.fatigue = { pct: (Math.exp(f.beta[1]) - 1) * 100, lo: (Math.exp(f.beta[1] - t * f.se[1]) - 1) * 100, hi: (Math.exp(f.beta[1] + t * f.se[1]) - 1) * 100, n: base.length }; }
  }
  const rand = rows.filter((x) => x.phase === 'randomized');
  if (rand.length >= 10) {
    const y = rand.map((x) => x.y);
    const f = ols(designRows(rand), y);
    if (f) {
      const t = tcrit(f.dof);
      out.sigma = f.sigma; out.nRand = rand.length;
      out.mde = Math.exp(2.8 * f.sigma * Math.sqrt(4 / rand.length));
      out.effects = ['A', 'B', 'C'].map((k, i) => ({ k, name: FACT_NAMES[k], x: Math.exp(f.beta[2 + i]), lo: Math.exp(f.beta[2 + i] - t * f.se[2 + i]), hi: Math.exp(f.beta[2 + i] + t * f.se[2 + i]), p: tpval(f.beta[2 + i] / f.se[2 + i], f.dof) }));
      const avg = (k, v, field) => mean(rand.filter((x) => x[k] === v).map((x) => x.r.h24[field]).filter((z) => z != null));
      out.repliesB = { on: avg('B', 1, 'replies'), off: avg('B', 0, 'replies') };
    }
  }
  const fc = rows.filter((x) => x.r.forecasts && x.r.forecasts.length);
  if (fc.length) out.crowd = Math.exp(mean(fc.map((x) => Math.abs(Math.log(median(x.r.forecasts.map((f) => f.v)) / x.r.h24.impr)))));
  const my = rows.filter((x) => x.r.myForecast > 0);
  if (my.length) out.mine = Math.exp(mean(my.map((x) => Math.abs(Math.log(x.r.myForecast / x.r.h24.impr)))));
  out.nCrowd = fc.length; out.nMine = my.length;
  out.leaders = leaderboard();
  return out;
}

function finalThread(R) {
  const posts = [];
  posts.push(`30 дней подряд выходил пост одного формата, чтобы проверить алгоритм X снаружи. Итоги — в треде.\n\nВсего ${fmtN(R.total)} ${plural(R.total, W_VIEWS)} за первые сутки постов, медиана — ${fmtN(R.med)} в день.`);
  if (R.fatigue) {
    const f = R.fatigue, s = (v) => (v > 0 ? '+' : '') + fmtX(v, 1);
    let v = 'Однозначного затухания за эти дни не видно.';
    if (f.hi < 0) v = 'Затухание есть: одинаковый формат постепенно теряет охват.';
    else if (f.lo > 0) v = 'Наоборот, просмотры росли — похоже, люди начали следить за серией.';
    posts.push(`1. Надоедает ли повтор?\nПервые ${f.n} дней пост выходил в одном и том же виде. Просмотры менялись в среднем на ${s(f.pct)}% в день (95% интервал: от ${s(f.lo)}% до ${s(f.hi)}%).\n\n${v}`);
  }
  if (R.effects) {
    R.effects.forEach((e, i) => {
      let v;
      if (e.lo > 1) v = 'Эффект заметный и в плюс.';
      else if (e.hi < 1) v = 'Эффект заметный, но в минус.';
      else v = `Отличить от шума не получилось: при ${R.nRand} днях надёжно видны эффекты примерно от ×${fmtX(R.mde, 1)}.`;
      let extra = '';
      if (e.k === 'B' && R.repliesB.on != null && R.repliesB.off != null) extra = `\nОтветов в дни с вопросом: в среднем ${fmtX(R.repliesB.on, 1)} против ${fmtX(R.repliesB.off, 1)}.`;
      posts.push(`${i + 2}. ${e.name}: ×${fmtX(e.x)} к просмотрам за сутки (95% интервал ×${fmtX(e.lo)}–×${fmtX(e.hi)}).\n\n${v}${extra}`);
    });
  }
  if (R.crowd && R.mine && R.nCrowd >= 3) {
    const top = R.leaders.slice(0, 3).map((x) => '@' + x.h).join(', ');
    posts.push(`${posts.length}. Кто лучше угадывает алгоритм?\nМедиана ваших прогнозов ошибалась в среднем в ${fmtX(R.crowd, 1)} раза, мои прогнозы — в ${fmtX(R.mine, 1)} раза.${top ? `\n\nТочнее всех: ${top}. Спасибо, что играли.` : ''}`);
  }
  posts.push(`Проверка честности. Расписание по дням (картинка, вопрос, быстрые ответы; 1 — да) и соль:\n\n${commitString()}\n\nSHA-256 этой строки совпадает с хешем из анонса.`);
  const ratios = Object.values(S.weeks || {}).map((w) => w && w.ratio).filter((x) => x != null);
  if (ratios.length) {
    const pct = (x) => Math.round(x * 100);
    posts.push(`Обычные посты во время серии набирали от ${pct(Math.min(...ratios))}% до ${pct(Math.max(...ratios))}% нормы до старта.\n\nТревожный порог — ниже 70% две недели подряд. Это проверка, не навредил ли эксперимент аккаунту.`);
  }
  posts.push('Ограничения: один аккаунт, 30 точек, аудитория знала об эксперименте. Интервалы — t-тест логарифма просмотров. Это не закон природы, а аккуратный замер.\n\nХотите повторить у себя — напишите, поделюсь протоколом и таблицей.');
  return posts;
}

/* ============================== Картинки ============================== */
const chartCache = new Map();
function chartData(maxDay) {
  const pts = []; for (let d = 1; d <= TOTAL; d++) { const r = getRec(d); pts.push(d <= maxDay && r.h24 ? r.h24.impr : null); }
  return pts;
}
function niceMax(v) { if (v <= 0) return 10; const p = 10 ** Math.floor(Math.log10(v)); const m = v / p; const n = [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10].find((x) => m <= x); return n * p; }
function compact(n) { const t = (x) => (Math.abs(x - Math.round(x)) < 0.05 ? String(Math.round(x)) : fmtX(x, 1)); if (n >= 1e6) return t(n / 1e6) + ' млн'; if (n >= 1e4) return Math.round(n / 1e3) + ' тыс'; if (n >= 1e3) return t(n / 1e3) + ' тыс'; return String(Math.round(n)); }
function drawChart(pts, { title, sub, foot }) {
  const W = 1200, Hh = 675, c = document.createElement('canvas'); c.width = W; c.height = Hh;
  const g = c.getContext('2d');
  const ink = '#1e1c18', muted = '#6b675e', grid = '#e6e2d8', bar = '#2d47b8', bg = '#fbfaf6';
  g.fillStyle = bg; g.fillRect(0, 0, W, Hh);
  g.fillStyle = ink; g.font = '700 40px "Golos Text", sans-serif'; g.textBaseline = 'alphabetic'; g.fillText(title, 64, 92);
  g.fillStyle = muted; g.font = '400 24px "Golos Text", sans-serif'; g.fillText(sub, 64, 132);
  const L = 120, R = 48, T = 180, B = 84, pw = W - L - R, ph = Hh - T - B;
  const vals = pts.filter((v) => v != null); const ymax = niceMax((Math.max(10, ...vals) * 1.08) / 4) * 4;
  g.font = '400 18px "JetBrains Mono", monospace'; g.textAlign = 'right';
  for (let i = 0; i <= 4; i++) {
    const y = T + ph - (ph * i) / 4; g.strokeStyle = grid; g.lineWidth = 1; g.beginPath(); g.moveTo(L, y + 0.5); g.lineTo(W - R, y + 0.5); g.stroke();
    g.fillStyle = muted; g.fillText(compact((ymax * i) / 4), L - 14, y + 6);
  }
  const slot = pw / pts.length, bw = Math.max(6, slot * 0.64);
  const maxV = vals.length ? Math.max(...vals) : null; let lastIdx = -1; pts.forEach((v, i) => { if (v != null) lastIdx = i; });
  pts.forEach((v, i) => {
    const x = L + slot * i + (slot - bw) / 2;
    if (v == null) { g.fillStyle = grid; g.fillRect(x, T + ph - 3, bw, 3); return; }
    const h = (v / ymax) * ph; g.fillStyle = bar; g.globalAlpha = i === lastIdx ? 1 : 0.78;
    const r = Math.min(6, bw / 2); const y = T + ph - h;
    g.beginPath(); g.moveTo(x, T + ph); g.lineTo(x, y + r); g.quadraticCurveTo(x, y, x + r, y); g.lineTo(x + bw - r, y); g.quadraticCurveTo(x + bw, y, x + bw, y + r); g.lineTo(x + bw, T + ph); g.closePath(); g.fill();
    g.globalAlpha = 1;
    if (i === lastIdx || v === maxV) { g.fillStyle = ink; g.font = '600 18px "JetBrains Mono", monospace'; const lbl = compact(v); const lw = g.measureText(lbl).width; let lx = x + bw / 2; lx = Math.min(Math.max(lx, L + lw / 2), W - R - lw / 2 + 20); g.textAlign = 'center'; g.fillText(lbl, lx, y - 10); }
  });
  g.textAlign = 'center'; g.fillStyle = muted; g.font = '400 16px "JetBrains Mono", monospace';
  pts.forEach((_, i) => { if (pts.length <= 30 || i % 2 === 0) g.fillText(String(i + 1), L + slot * i + slot / 2, T + ph + 28); });
  g.textAlign = 'left'; g.font = '500 20px "Golos Text", sans-serif'; g.fillStyle = muted; g.fillText(foot.left, 64, Hh - 22);
  g.textAlign = 'right'; g.fillText(foot.right, W - R, Hh - 22);
  return c;
}
function chartFor(key, maxDay, kind) {
  const pts = chartData(maxDay);
  const sig = key + '|' + pts.join(',') + '|' + (S.setup.handle || '');
  if (chartCache.has(sig)) return chartCache.get(sig);
  const handle = S.setup.handle ? '@' + S.setup.handle.replace(/^@/, '') : 'Эксперимент с алгоритмом X';
  const c = drawChart(pts, {
    title: kind === 'final' ? 'Итоги: 30 дней с алгоритмом X' : 'Эксперимент с алгоритмом X',
    sub: 'Просмотры каждого поста серии за первые 24 часа',
    foot: { left: handle, right: kind === 'post' ? `данные до дня ${maxDay} · 30 дней` : `дни 1–${maxDay}` },
  });
  chartCache.set(sig, c);
  return c;
}
function hydrateCharts() {
  $$('img[data-chart]').forEach((img) => {
    const [key, maxDay, kind] = img.dataset.chart.split(':');
    try { img.src = chartFor(key, Number(maxDay), kind).toDataURL('image/png'); } catch (e) { img.alt = 'Не удалось нарисовать картинку'; }
  });
}
function downloadBlob(blob, name) {
  const url = URL.createObjectURL(blob); const a = document.createElement('a');
  a.href = url; a.download = name; document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 2000);
}
async function copyText(text) {
  try { await navigator.clipboard.writeText(text); return true; } catch (e) { /* fallback */ }
  const ta = document.createElement('textarea'); ta.value = text; ta.style.position = 'fixed'; ta.style.top = '-1000px'; document.body.appendChild(ta); ta.select();
  let ok = false; try { ok = document.execCommand('copy'); } catch (e) { ok = false; } ta.remove(); return ok;
}

/* ============================== Движок «что делать сегодня» ============================== */
function buildTasks(t = NOW()) {
  const tasks = [];
  const add = (o) => tasks.push(o);
  if (!S.paused) {
    const np = nextPost(t);
    if (np) add({ kind: np.idx === 0 ? 'day0' : 'post', d: np.idx, due: np.sched, openAt: new Date(np.sched - 2 * H), shifted: np.shifted, id: 'post' + np.idx });
  }
  if (S.day0.postedAt && !S.day0.complete) add({ kind: 'day0', d: 0, due: postedAt(0), openAt: postedAt(0), id: 'post0', after: true });
  for (let d = 1; d <= TOTAL; d++) {
    const pt = postedAt(d); if (!pt) break;
    const r = getRec(d), c = cond(d);
    if (!r.repliesDone) {
      if (c.C) add({ kind: 'replies', d, due: pt, deadline: new Date(+pt + 30 * MIN), id: 'rep' + d });
      else add({ kind: 'replies', d, due: new Date(+pt + 3 * H), hold: true, deadline: new Date(+pt + 3 * H), id: 'rep' + d });
    }
    if (r.h1 == null) add({ kind: 'h1', d, due: new Date(+pt + H), id: 'h1_' + d });
    if (!r.h24) add({ kind: 'h24', d, due: new Date(+pt + 24 * H), openAt: new Date(+pt + 24 * H - 45 * MIN), id: 'h24_' + d });
    if (r.h48 == null) add({ kind: 'h48', d, due: new Date(+pt + 48 * H), openAt: new Date(+pt + 48 * H - 60 * MIN), id: 'h48_' + d });
    if (r.d7 == null && !S.final.done) add({ kind: 'd7', d, due: new Date(+pt + 7 * DAY), openAt: new Date(+pt + 7 * DAY - 3 * H), id: 'd7_' + d });
  }
  for (let k = 1; k <= 4; k++) {
    const pt = postedAt(7 * k + 1);
    if (pt && !(S.weeks[k] && S.weeks[k].done)) add({ kind: 'digest', k, due: new Date(+pt + 3 * H), id: 'dig' + k });
  }
  const p30 = postedAt(TOTAL);
  if (p30 && !S.final.done) add({ kind: 'final', due: new Date(+p30 + 48 * H), openAt: new Date(+p30 + 47 * H), id: 'final' });

  const eod = addDays(sod(t), 1);
  const pr = { h24: 0, day0: 1, post: 1, replies: 2, h1: 3, digest: 4, h48: 5, d7: 6, final: 7 };
  tasks.forEach((x) => { const o = x.openAt || x.due; x.status = t >= o ? 'now' : (o < eod || o - t < 6 * H) ? 'later' : 'future'; });
  const key = (x) => +(x.kind === 'h24' ? new Date(+x.due - H) : x.due);
  tasks.sort((a, b) => key(a) - key(b) || pr[a.kind] - pr[b.kind]);
  return tasks;
}

/* ============================== Рендер: общие куски ============================== */
const icCheck = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>';
const ext = (url, label) => `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(label)}</a>`;
function condChips(d) {
  const c = cond(d);
  return `<div class="conds">
    <span class="chip ${c.A ? 'on' : ''}">${c.A ? 'С картинкой' : 'Только текст'}</span>
    <span class="chip ${c.B ? 'on' : ''}">${c.B ? 'С вопросом-прогнозом' : 'Без вопроса'}</span>
    <span class="chip ${c.C ? 'on' : ''}">${c.C ? 'Отвечать сразу' : 'Отвечать через 3 часа'}</span>
    ${c.phase === 'baseline' ? '<span class="chip">Базовые дни</span>' : ''}
  </div>`;
}
function timeChip(task, t = NOW()) {
  const late = task.status === 'now' && t - task.due > 2 * H && ['h1', 'h24', 'h48', 'post', 'day0'].includes(task.kind);
  return `<span class="time ${late ? 'late' : task.status === 'now' ? 'now' : ''}">${late ? 'просрочено · ' : ''}${hm(task.due)}</span>`;
}
function step(ok, title, body) { return `<li class="step ${ok ? 'ok' : ''}"><div class="step-title">${title}</div>${body ? `<div class="step-body">${body}</div>` : ''}</li>`; }
function copyBlock(id, text, rows = 8) {
  const n = clen(text);
  return `<textarea class="post" id="${id}" readonly rows="${rows}">${esc(text)}</textarea>
  <div class="btn-row" style="margin-top:var(--space-2)"><button class="btn btn-primary" data-action="copy" data-target="${id}">Скопировать</button><span class="charcount ${n > 280 ? 'bad' : ''}">${n} / 280 знаков</span></div>`;
}
function numField(name, label, val, { req = false, hint = '' } = {}) {
  return `<label class="field"><span class="field-label ${req ? 'req' : ''}">${label}</span><input type="text" inputmode="numeric" class="num" name="${name}" value="${val == null ? '' : esc(val)}" autocomplete="off" />${hint ? `<span class="field-hint">${hint}</span>` : ''}</label>`;
}

/* ============================== Карточки задач ============================== */
function cardPost(task) {
  const d = task.d, c = cond(d), r = getRec(d), t = NOW();
  const quietFrom = new Date(+task.due - 2 * H), quietTo = new Date(+task.due + 2 * H);
  const needPrev = d >= 2 && !getRec(d - 1).h24;
  const [srcUrl, srcLabel] = factSrc(d);
  const factOk = !!r.factChecked && !!r.factScore;
  const steps = [];
  steps.push(step(r.myForecast > 0, 'Запишите свой прогноз',
    `<p>До публикации, не заглядывая в аналитику: сколько просмотров наберёт этот пост за первые 24 часа? Это нужно для сравнения «вы против аудитории» в итогах.</p>
     <div style="max-width:220px">${numField('myForecast', 'Мой прогноз, просмотров', r.myForecast)}</div>
     <button class="btn btn-ghost" data-action="save-forecast" data-d="${d}">Сохранить прогноз</button>`));
  steps.push(step(factOk, 'Проверьте факт дня',
    `<div class="quote">Факт дня: ${esc(factOf(d))}</div>
     <p>Источник: ${ext(srcUrl, srcLabel)}. Откройте и убедитесь, что факт всё ещё актуален: код и правила X обновляются.</p>
     <label class="check"><input type="checkbox" data-action="toggle" data-path="days.${d}.factChecked" ${r.factChecked ? 'checked' : ''}/> Проверил, факт актуален</label>
     <details><summary class="small" style="cursor:pointer">Изменить формулировку факта</summary>
       <div style="margin-top:var(--space-2)"><textarea name="fact" rows="2" maxlength="90">${esc(factOf(d))}</textarea>
       <div class="btn-row" style="margin-top:var(--space-2)"><button class="btn btn-ghost" data-action="save-fact" data-d="${d}">Сохранить формулировку</button></div></div></details>
     <div><span class="field-label">Насколько этот факт интересен, по-вашему? (1 — так себе, 5 — огонь)</span>
       <div class="seg">${[1, 2, 3, 4, 5].map((v) => `<button data-action="set" data-path="days.${d}.factScore" data-value="${v}" aria-pressed="${r.factScore === v}">${v}</button>`).join('')}</div></div>`));
  if (c.A) {
    const maxDay = d - 1;
    steps.push(step(!!r.imgSaved, 'Скачайте картинку',
      `<p>Сегодня пост с картинкой: график просмотров по дням. Прикрепите её к посту.</p>
       <img class="chart-img" alt="График просмотров по дням эксперимента" data-chart="post:${maxDay}:post" />
       <div class="btn-row"><button class="btn btn-primary" data-action="dl-chart" data-chart="post:${maxDay}:post" data-name="den-${d}.png" data-mark="days.${d}.imgSaved">Скачать PNG</button>
       <span class="xs muted">Если скачивание не сработало: нажмите на картинку правой кнопкой (на телефоне — долгим нажатием) и сохраните.</span></div>`));
  }
  steps.push(step(!!r.copied && !needPrev, 'Скопируйте текст поста',
    needPrev ? `<div class="note warn"><strong>Сначала внесите цифры вчерашнего поста.</strong> Карточка «Сутки после поста дня ${d - 1}» откроется ${whenLabel(new Date(+postedAt(d - 1) + 24 * H - 45 * MIN), t)} — ровно через сутки после него. Остальные шаги можно сделать уже сейчас.</div>` :
    copyBlock('post' + d, postText(d), c.B ? 9 : 7) + (clen(postText(d)) > 280 ? '<div class="note warn">Текст длиннее 280 знаков. Сократите формулировку факта в шаге «Проверьте факт дня».</div>' : '') +
    `<details><summary class="xs muted" style="cursor:pointer">X пишет, что пост похож на недавний?</summary><div class="small" style="margin-top:var(--space-2)"><p>Такое бывает, если рамка повторяется. Нажмите кнопку — я поменяю вторую строку на другую формулировку и отмечу это в заметках дня.</p><div class="btn-row"><button class="btn btn-ghost" data-action="variant" data-d="${d}">Другая формулировка</button></div></div></details>`));
  steps.push(step(!!r.postedAt, `Опубликуйте ${sameDay(task.due, t) ? 'сегодня' : dm(task.due)} в ${hm(task.due)}`,
    `<ul class="plain">
       <li>Отклонение до 15 минут — нормально.</li>
       <li>${c.A ? 'Прикрепите картинку из шага выше. Больше ничего не добавляйте.' : 'Без картинок, ссылок и хештегов.'}</li>
       <li>С ${hm(quietFrom)} до ${hm(quietTo)} не публикуйте других постов.</li>
       <li>После публикации ничего не редактируйте.</li>
     </ul>
     <label class="field"><span class="field-label">Ссылка на опубликованный пост</span><input type="url" name="url" placeholder="https://x.com/…/status/…" value="${esc(r.url || '')}" /></label>
     <div style="max-width:240px">${numField('followersNow', 'Подписчиков сейчас', r.followersAtPost, { hint: 'Цифра в профиле, в момент публикации.' })}</div>
     <div class="btn-row"><button class="btn btn-primary" data-action="mark-posted" data-d="${d}" ${needPrev ? 'disabled' : ''}>Опубликовал</button><span class="xs muted">Время публикации запишется автоматически.</span></div>`));
  return `<article class="card now">
    <div class="card-head"><div><div class="card-title">Пост дня ${d} из 30</div><div class="card-sub">Подготовка займёт 5–10 минут.</div></div>${timeChip(task)}</div>
    ${task.shifted ? '<div class="note warn" style="margin-top:var(--space-3)">Плановое время уже прошло больше чем на 4 часа, слот перенесён. Номер дня тот же. Не публикуйте два поста серии в один день.</div>' : ''}
    ${condChips(d)}
    <ol class="steps">${steps.join('')}</ol>
  </article>`;
}

function cardDay0(task) {
  const posted = !!S.day0.postedAt, thread = day0Thread();
  const steps = [];
  steps.push(step(!!S.day0.copied, 'Скопируйте текст анонса', copyBlock('d0text', day0Text(task.due), 8)));
  steps.push(step(posted, `Опубликуйте в ${hm(task.due)}`,
    `<p>Без картинки, ссылок и хештегов.</p>
     <label class="field"><span class="field-label">Ссылка на опубликованный пост</span><input type="url" name="url" placeholder="https://x.com/…/status/…" value="${esc(S.day0.url || '')}" /></label>
     <div class="btn-row"><button class="btn btn-primary" data-action="mark-posted" data-d="0" ${posted ? 'disabled' : ''}>${posted ? 'Опубликовано' : 'Опубликовал'}</button></div>`));
  steps.push(step(!!S.day0.threadDone, 'Сразу допишите три ответа к своему анонсу',
    `<p>Ответьте на собственный пост тремя сообщениями подряд, по порядку. Получится цепочка с деталями.</p>
     ${thread.map((x, i) => `<div><span class="field-label">Ответ ${i + 1}</span>${copyBlock('d0r' + i, x, 6)}</div>`).join('')}
     <label class="check"><input type="checkbox" data-action="toggle" data-path="day0.threadDone" ${S.day0.threadDone ? 'checked' : ''} ${posted ? '' : 'disabled'}/> Все три ответа опубликованы</label>`));
  steps.push(step(!!S.day0.pinned, 'Закрепите анонс в профиле',
    `<p>Откройте пост → «…» → «Закрепить в профиле». Так новые люди сразу поймут, что происходит.</p>
     <label class="check"><input type="checkbox" data-action="toggle" data-path="day0.pinned" ${S.day0.pinned ? 'checked' : ''} ${posted ? '' : 'disabled'}/> Закрепил</label>`));
  steps.push(step(!!S.day0.complete, 'Вечером отвечайте на комментарии к анонсу',
    `<p>Как обычно: по существу, своими словами. Если спрашивают расписание — отвечайте, что оно раскроется в конце, иначе эксперимент потеряет смысл.</p>
     <div class="btn-row"><button class="btn btn-ghost" data-action="day0-complete" ${posted && S.day0.threadDone && S.day0.pinned ? '' : 'disabled'}>Всё сделано</button></div>`));
  return `<article class="card now">
    <div class="card-head"><div><div class="card-title">Анонс эксперимента</div><div class="card-sub">День 0. Завтра — первый пост серии.</div></div>${timeChip(task)}</div>
    ${task.shifted ? '<div class="note warn" style="margin-top:var(--space-3)">Плановое время прошло больше 4 часов назад, поэтому анонс переносится. Даты в тексте пересчитаны.</div>' : ''}
    <ol class="steps">${steps.join('')}</ol>
  </article>`;
}

const REPLY_TIPS = `<ul class="plain">
  <li>Отвечайте на каждый содержательный комментарий: по существу, 1–2 предложения, своими словами.</li>
  <li>Хорошо работает встречный вопрос или уточнение по ML.</li>
  <li>Не отвечайте одним эмодзи или «спасибо» — такие ответы почти ничего не значат для алгоритма.</li>
  <li>Если человек оставил прогноз, достаточно короткого «Записал, посмотрим завтра».</li>
</ul>`;
function cardReplies(task) {
  const d = task.d, pt = postedAt(d);
  const title = task.hold ? `Теперь ответьте на комментарии к посту дня ${d}` : `Ответьте на комментарии к посту дня ${d} — сразу`;
  const sub = task.hold ? 'Три часа прошли. Ответьте всем, кто написал, — и дальше отвечайте как обычно.' : `Сегодняшнее условие — быстрые ответы. До ${hm(task.deadline)} ответьте всем, кто уже написал, и дальше отвечайте на новые комментарии в течение 30 минут.`;
  return `<article class="card now">
    <div class="card-head"><div><div class="card-title">${title}</div><div class="card-sub">${sub}</div></div>${timeChip(task)}</div>
    <div class="step-body" style="margin-top:var(--space-4)">${REPLY_TIPS}</div>
    <div class="btn-row"><button class="btn btn-primary" data-action="replies-done" data-d="${d}">Ответил всем</button></div>
  </article>`;
}

function cardH1(task) {
  const d = task.d, r = getRec(d);
  return `<article class="card now">
    <div class="card-head"><div><div class="card-title">Час после поста дня ${d}: запишите просмотры</div><div class="card-sub">Число просмотров видно прямо под постом, рядом с иконкой графика.</div></div>${timeChip(task)}</div>
    <div style="max-width:240px;margin-top:var(--space-4)">${numField('v', 'Просмотров сейчас', r.h1, { req: true })}</div>
    <div class="btn-row"><button class="btn btn-primary" data-action="save-snap" data-field="h1" data-d="${d}">Сохранить</button></div>
  </article>`;
}
function cardSnap(task, field, title, sub) {
  const d = task.d, r = getRec(d);
  return `<article class="card now">
    <div class="card-head"><div><div class="card-title">${title}</div><div class="card-sub">${sub}</div></div>${timeChip(task)}</div>
    <div style="max-width:240px;margin-top:var(--space-4)">${numField('v', 'Просмотров', r[field], { req: true })}</div>
    <div class="btn-row"><button class="btn btn-primary" data-action="save-snap" data-field="${field}" data-d="${d}">Сохранить</button></div>
  </article>`;
}
function cardH24(task) {
  const d = task.d, r = getRec(d), c = cond(d), h = r.h24 || {};
  const pt = postedAt(d);
  const fc = c.B ? `<div class="divider"></div>
    <label class="field"><span class="field-label">Прогнозы из ответов</span>
    <textarea name="forecasts" rows="5" placeholder="@ivan 1500&#10;@maria 2,3к">${esc(r.forecastsRaw || '')}</textarea>
    <span class="field-hint">Учитывайте только прогнозы, оставленные до ${hm(new Date(+pt + 2 * H))}: после этого счётчик просмотров уже виден. По одному на строку: ник и число. Можно пропустить, если прогнозов нет.</span></label>` : '';
  return `<article class="card now">
    <div class="card-head"><div><div class="card-title">Сутки после поста дня ${d}: внесите цифры</div><div class="card-sub">Откройте пост → иконка графика («Посмотреть аналитику поста»). Обязательны три поля; остальное — если видно.</div></div>${timeChip(task)}</div>
    <div class="grid3" style="margin-top:var(--space-4)">
      ${numField('impr', 'Просмотры', h.impr, { req: true })}
      ${numField('likes', 'Лайки', h.likes, { req: true })}
      ${numField('replies', 'Ответы', h.replies, { req: true })}
      ${numField('reposts', 'Репосты', h.reposts)}
      ${numField('quotes', 'Цитаты', h.quotes)}
      ${numField('bookmarks', 'Закладки', h.bookmarks)}
      ${numField('profile', 'Переходы в профиль', h.profile)}
      ${numField('follows', 'Подписки с поста', h.follows)}
      ${numField('expands', 'Раскрытия', h.expands)}
    </div>
    <div style="max-width:240px;margin-top:var(--space-3)">${numField('followers', 'Ваших подписчиков сейчас', r.followersAfter, { hint: 'Видно в профиле.' })}</div>
    ${fc}
    <div class="btn-row"><button class="btn btn-primary" data-action="save-h24" data-d="${d}">Сохранить цифры</button></div>
  </article>`;
}

function cardDigest(task) {
  const k = task.k, w = S.weeks[k] || {}, b = 7 * k;
  const others = w.others || [];
  const ratio = others.length >= 2 && baseMedian() ? median(others) / baseMedian() : null;
  const prev = S.weeks[k - 1];
  const prevBad = prev && prev.ratio != null && prev.ratio < 0.7;
  let safety = '';
  if (ratio != null) {
    if (ratio < 0.7 && prevBad) safety = `<div class="note err"><strong>Обычные посты вторую неделю подряд набирают меньше 70% от нормы.</strong> Это стоп-правило: после сводки поставьте эксперимент на паузу (Настройки → Пауза) и выдохните неделю.</div>`;
    else if (ratio < 0.7) safety = `<div class="note warn">Обычные посты сейчас набирают ${Math.round(ratio * 100)}% от вашей нормы. Пока не страшно — проверим через неделю.</div>`;
    else safety = `<div class="note ok">Обычные посты в норме: ${Math.round(ratio * 100)}% от вашей типичной медианы. Эксперимент аккаунту не вредит.</div>`;
  }
  const uthBad = w.uth === 'yes';
  return `<article class="card now">
    <div class="card-head"><div><div class="card-title">Сводка недели ${k}</div><div class="card-sub">Отдельный пост с картинкой. Плюс проверка, что эксперимент не вредит аккаунту.</div></div>${timeChip(task)}</div>
    <ol class="steps">
      ${step(others.length >= 2, 'Проверьте обычные посты', `<p>Впишите просмотры трёх последних ваших обычных постов (не из серии, не ответов).</p>
        <div class="grid3">${[0, 1, 2].map((i) => numField('o' + i, `Пост ${i + 1}`, others[i])).join('')}</div>
        <button class="btn btn-ghost" data-action="save-others" data-k="${k}">Сохранить</button>${safety}`)}
      ${step(!!w.uth, 'Проверьте «Under the Hood»', `<p>В настройках X найдите раздел «Under the Hood» — выгрузку меток аккаунта. Есть ли там новые ограничительные метки? Если раздела нет, выберите «Не смотрел».</p>
        <div class="seg">${[['no', 'Нет меток'], ['yes', 'Есть метки'], ['skip', 'Не смотрел']].map(([v, l]) => `<button data-action="set" data-path="weeks.${k}.uth" data-value="${v}" aria-pressed="${w.uth === v}" style="font-family:var(--font-body)">${l}</button>`).join('')}</div>
        ${uthBad ? '<div class="note err"><strong>Стоп-правило.</strong> Опубликуйте сводку, а потом поставьте эксперимент на паузу в настройках. Ничего не удаляйте. Через неделю проверьте метки снова.</div>' : ''}`)}
      ${step(!!w.imgSaved, 'Скачайте картинку', `<img class="chart-img" alt="График просмотров за неделю" data-chart="week${k}:${b}:week" />
        <div class="btn-row"><button class="btn btn-primary" data-action="dl-chart" data-chart="week${k}:${b}:week" data-name="nedelya-${k}.png" data-mark="weeks.${k}.imgSaved">Скачать PNG</button></div>`)}
      ${step(!!w.copied, 'Скопируйте текст сводки', copyBlock('dig' + k, digestText(k), 8))}
      ${step(!!w.done, `Опубликуйте в ${hm(task.due)}`, `<p>С картинкой. Это обычный пост, не ответ в серии.</p>
        <div class="btn-row"><button class="btn btn-primary" data-action="digest-done" data-k="${k}">Опубликовал</button></div>`)}
    </ol>
  </article>`;
}

function cardFinal(task) {
  const R = analyze(true);
  const posts = finalThread(R);
  return `<article class="card now">
    <div class="card-head"><div><div class="card-title">Итоги эксперимента</div><div class="card-sub">Финальный тред. Цифры посчитаны, формулировки аккуратные: где данных мало, так и написано.</div></div>${timeChip(task)}</div>
    <ol class="steps">
      ${step(false, 'Проверьте, что все цифры внесены', `<p>Откройте раздел «Дни»: у каждого дня должны быть просмотры за 24 часа. Если какой-то день пропущен — это нормально, он просто не попадёт в расчёт.</p><p>Подробности расчёта — в разделе «Итоги».</p>`)}
      ${step(!!S.final.imgSaved, 'Скачайте картинку для первого поста', `<img class="chart-img" alt="График всех 30 дней" data-chart="final:30:final" />
        <div class="btn-row"><button class="btn btn-primary" data-action="dl-chart" data-chart="final:30:final" data-name="itogi.png" data-mark="final.imgSaved">Скачать PNG</button></div>`)}
      ${step(false, 'Опубликуйте тред', `<p>Первый пост — с картинкой. Каждый следующий — ответом на предыдущий, по порядку.</p>
        ${posts.map((p, i) => `<div><span class="field-label">Пост ${i + 1} из ${posts.length}</span>${copyBlock('fin' + i, p, 7)}</div>`).join('')}`)}
      ${step(!!S.final.done, 'Закрепите тред вместо анонса', `<p>Профиль → первый пост треда → «…» → «Закрепить в профиле».</p>
        <div class="btn-row"><button class="btn btn-primary" data-action="final-done">Тред опубликован</button></div>`)}
    </ol>
  </article>`;
}

function laterRow(task) {
  const map = {
    post: () => [`Пост дня ${task.d}`, `Подготовка откроется в ${hm(task.openAt)}. С ${hm(task.openAt)} до ${hm(new Date(+task.due + 2 * H))} других постов не публикуем.`],
    day0: () => ['Анонс эксперимента', `Подготовка откроется в ${hm(task.openAt)}.`],
    replies: () => task.hold ? [`Ответить на комментарии к посту дня ${task.d}`, `До этого времени не отвечайте и не лайкайте комментарии: сегодня условие «ответы через 3 часа».`] : [`Ответить на комментарии к посту дня ${task.d}`, ''],
    h1: () => [`Записать просмотры поста дня ${task.d} через час`, ''],
    h24: () => [`Цифры поста дня ${task.d} за сутки`, ''],
    h48: () => [`Просмотры поста дня ${task.d} за двое суток`, ''],
    d7: () => [`Просмотры поста дня ${task.d} за неделю`, ''],
    digest: () => [`Сводка недели ${task.k}`, 'Отдельный пост с картинкой.'],
    final: () => ['Итоговый тред', ''],
  };
  const [title, sub] = map[task.kind]();
  return `<div class="later-row"><span class="time">${hm(task.openAt || task.due)}</span><div class="txt">${esc(title)}${sub ? `<small>${esc(sub)}</small>` : ''}</div></div>`;
}

function renderCard(task) {
  switch (task.kind) {
    case 'post': return cardPost(task);
    case 'day0': return cardDay0(task);
    case 'replies': return cardReplies(task);
    case 'h1': return cardH1(task);
    case 'h24': return cardH24(task);
    case 'h48': return cardSnap(task, 'h48', `Двое суток после поста дня ${task.d}`, 'Запишите число просмотров под постом. Это почти весь срок жизни поста в ленте.');
    case 'd7': return cardSnap(task, 'd7', `Неделя после поста дня ${task.d}`, 'Последний замер для этого поста: число просмотров под ним.');
    case 'digest': return cardDigest(task);
    case 'final': return cardFinal(task);
  }
  return '';
}

/* ============================== Экраны ============================== */
function viewToday() {
  const t = NOW();
  const tasks = buildTasks(t);
  const now = tasks.filter((x) => x.status === 'now');
  const later = tasks.filter((x) => x.status === 'later');
  const future = tasks.filter((x) => x.status === 'future').sort((a, b) => (a.openAt || a.due) - (b.openAt || b.due));
  const isCatchup = (x) => x.kind === 'h48' || x.kind === 'd7' || (x.kind === 'h1' && t - x.due > 6 * H) || (x.kind === 'replies' && t - (x.deadline || x.due) > 12 * H);
  const primary = now.filter((x) => !isCatchup(x));
  const catchup = now.filter((x) => isCatchup(x));
  const lp = lastPosted();
  const doneToday = S.log.filter((x) => sameDay(new Date(x.t), t));
  const bar = Array.from({ length: TOTAL }, (_, i) => `<span class="${i + 1 <= lp ? 'done' : i + 1 === lp + 1 ? 'cur' : ''}"></span>`).join('');
  const dayLabel = lp < 0 ? 'Подготовка: анонс ещё не опубликован' : lp === 0 ? 'Анонс опубликован, впереди день 1' : lp >= TOTAL ? 'Все 30 постов опубликованы' : `Опубликовано постов: ${lp} из 30`;

  let html = `<div class="page-head">
    <div class="eyebrow">${WD[t.getDay()]}, ${dm(t)}</div>
    <h1 class="page-title">${primary.length === 1 ? 'Сейчас одно дело' : primary.length ? `Сейчас дел: ${primary.length}` : catchup.length ? 'Срочного ничего нет' : 'Сейчас ничего делать не нужно'}</h1>
    <div class="progress" aria-hidden="true">${bar}</div>
    <div class="progress-meta"><span>${dayLabel}</span><span>итоги — ${dm(resultsDate())}</span></div>
  </div>`;

  // Вирусность
  for (let d = Math.max(1, lp - 2); d <= lp; d++) {
    const r = getRec(d); const v = Math.max(r.h24?.impr || 0, r.h48 || 0);
    if (v > viralThreshold() && !r.viralAck) {
      html += `<div class="note info" style="margin-bottom:var(--space-4)"><strong>Пост дня ${d} пошёл вирусно: ${fmtN(v)} ${plural(v, W_VIEWS)} — больше вашего порога ${fmtN(viralThreshold())}.</strong> Это само по себе результат эксперимента. Ничего не меняйте в плане, отвечайте на комментарии по правилу того дня, ничего не добавляйте в пост. <button class="btn btn-ghost" data-action="set" data-path="days.${d}.viralAck" data-value="true" style="margin-top:var(--space-2)">Понятно</button></div>`;
    }
  }
  if (S.paused) {
    html += `<article class="card now"><div class="card-title">Эксперимент на паузе</div>
      <p class="card-sub" style="margin-top:var(--space-2)">Новые посты серии не публикуем. Цифры уже опубликованных постов по-прежнему вносим — они ниже. Когда будете готовы продолжить (например, через неделю, если меток больше нет), нажмите «Продолжить»: следующий пост выйдет в обычное время, номер дня сохранится.</p>
      <div class="btn-row"><button class="btn btn-primary" data-action="unpause">Продолжить эксперимент</button></div></article>`;
  }

  if (primary.length) html += `<section class="section"><h2 class="section-title">Сделать сейчас <span class="count">${primary.length}</span></h2>${primary.map(renderCard).join('')}</section>`;
  else if (!catchup.length) {
    const nx = later[0] || future[0];
    let msg = 'Все задачи выполнены.';
    if (S.final.done) msg = 'Эксперимент завершён. Спасибо — это была аккуратная работа.';
    else if (nx) msg = `Следующее действие — ${whenLabel(nx.openAt || nx.due, t)}.`;
    const np = nextPost(t);
    html += `<article class="card calm"><div class="card-title">${esc(msg)}</div>
      <p class="card-sub" style="margin-top:var(--space-2)">${S.final.done ? 'Загляните в «Итоги» — там все расчёты. Идеи для продолжения — в «Правилах».' : `До этого можно спокойно публиковать обычные посты про ML${np && !S.paused ? ` — кроме окна тишины ${whenLabel(new Date(+np.sched - 2 * H), t).replace(/ в (\d)/, ' $1')}–${hm(new Date(+np.sched + 2 * H))}` : ''}. Откройте эту страницу в указанное время.`}</p></article>`;
  }
  if (catchup.length) html += `<section class="section"><h2 class="section-title">Дописать, когда будет минута <span class="count">${catchup.length}</span></h2><p class="small muted">Эти цифры сегодняшний пост не блокируют. Внесите их из аналитики поста, когда откроете её.</p>${catchup.map(renderCard).join('')}</section>`;
  if (later.length) html += `<section class="section"><h2 class="section-title">Позже сегодня <span class="count">${later.length}</span></h2>${later.map(laterRow).join('')}</section>`;
  if (doneToday.length) html += `<section class="section"><h2 class="section-title">Сделано сегодня</h2>${doneToday.map((x) => `<div class="done-row">${icCheck}<span><span class="mono xs">${hm(new Date(x.t))}</span> · ${esc(x.text)}</span></div>`).join('')}</section>`;
  if (!now.length && future.length && !later.length) {
    html += `<section class="section"><h2 class="section-title">Дальше</h2>${future.slice(0, 3).map((x) => laterRow(x).replace(/<span class="time">[^<]*<\/span>/, `<span class="time">${esc(whenLabel(x.openAt || x.due, t).replace(/^сегодня в /, ''))}</span>`)).join('')}</section>`;
  }
  return html;
}

function viewDays() {
  const rows = [];
  rows.push(`<tr><td>0</td><td>${S.day0.postedAt ? dm(postedAt(0)) : dm(parseYmd(S.setup.day0Date))}</td><td>Анонс</td><td class="n" colspan="6">${S.day0.url ? ext(S.day0.url, 'открыть') : ''}</td><td><button class="btn btn-ghost" data-action="edit-day" data-d="0" style="padding:2px 10px">Изменить</button></td></tr>`);
  for (let d = 1; d <= TOTAL; d++) {
    const c = cond(d), r = getRec(d), pt = postedAt(d);
    rows.push(`<tr>
      <td>${d}</td><td>${pt ? `${WD_S[pt.getDay()]}, ${dm(pt)}` : '<span class="muted">—</span>'}</td>
      <td>${(pt || getRec(TOTAL).h24 || S.final.done) ? `<span class="mini" title="картинка · вопрос · быстрые ответы"><i class="${c.A ? 'on' : ''}"></i><i class="${c.B ? 'on' : ''}"></i><i class="${c.C ? 'on' : ''}"></i></span>` : '<span class="muted">после публикации</span>'}</td>
      <td class="n">${fmtN(r.h1)}</td><td class="n">${fmtN(r.h24?.impr)}</td><td class="n">${fmtN(r.h48)}</td><td class="n">${fmtN(r.d7)}</td>
      <td class="n">${fmtN(r.h24?.likes)}</td><td class="n">${fmtN(r.h24?.replies)}</td>
      <td>${pt ? `<button class="btn btn-ghost" data-action="edit-day" data-d="${d}" style="padding:2px 10px">Изменить</button>` : ''}</td></tr>`);
  }
  let editor = '';
  if (EDIT_DAY != null) editor = dayEditor(EDIT_DAY);
  return `<div class="page-head"><div class="eyebrow">Журнал</div><h1 class="page-title">Все дни эксперимента</h1>
    <p class="lead">Квадратики — условия уже опубликованных дней: картинка, вопрос, быстрые ответы. Будущие дни скрыты до публикации, иначе эксперимент можно подстроить. Цифры опубликованных дней здесь можно поправить.</p></div>
    ${editor}
    <div class="table-wrap"><table><thead><tr><th>День</th><th>Дата</th><th>Условия</th><th class="n">1 ч</th><th class="n">24 ч</th><th class="n">48 ч</th><th class="n">7 дн</th><th class="n">Лайки</th><th class="n">Ответы</th><th></th></tr></thead><tbody>${rows.join('')}</tbody></table></div>`;
}
function dayEditor(d) {
  if (d === 0) {
    return `<article class="card now" style="margin-bottom:var(--space-6)"><div class="card-head"><div class="card-title">Анонс (день 0)</div><button class="btn btn-ghost" data-action="close-edit">Закрыть</button></div>
      <div class="grid2" style="margin-top:var(--space-4)">
        <label class="field"><span class="field-label">Время публикации</span><input type="datetime-local" name="postedAt" value="${S.day0.postedAt ? toLocalInput(postedAt(0)) : ''}" /></label>
        <label class="field"><span class="field-label">Ссылка</span><input type="url" name="url" value="${esc(S.day0.url || '')}" /></label>
      </div><div class="btn-row"><button class="btn btn-primary" data-action="save-edit" data-d="0">Сохранить</button></div></article>`;
  }
  const r = getRec(d), h = r.h24 || {};
  return `<article class="card now" style="margin-bottom:var(--space-6)"><div class="card-head"><div><div class="card-title">День ${d}</div>${condChips(d)}</div><button class="btn btn-ghost" data-action="close-edit">Закрыть</button></div>
    <div class="grid2" style="margin-top:var(--space-4)">
      <label class="field"><span class="field-label">Время публикации</span><input type="datetime-local" name="postedAt" value="${r.postedAt ? toLocalInput(postedAt(d)) : ''}" /></label>
      <label class="field"><span class="field-label">Ссылка</span><input type="url" name="url" value="${esc(r.url || '')}" /></label>
    </div>
    <div class="grid3" style="margin-top:var(--space-3)">
      ${numField('h1', 'Просмотры за 1 ч', r.h1)}${numField('impr', 'Просмотры за 24 ч', h.impr)}${numField('h48', 'Просмотры за 48 ч', r.h48)}
      ${numField('d7', 'Просмотры за 7 дн', r.d7)}${numField('likes', 'Лайки', h.likes)}${numField('replies', 'Ответы', h.replies)}
      ${numField('reposts', 'Репосты', h.reposts)}${numField('quotes', 'Цитаты', h.quotes)}${numField('bookmarks', 'Закладки', h.bookmarks)}
      ${numField('profile', 'Переходы в профиль', h.profile)}${numField('follows', 'Подписки с поста', h.follows)}${numField('expands', 'Раскрытия', h.expands)}
      ${numField('myForecast', 'Мой прогноз', r.myForecast)}
    </div>
    <label class="field" style="margin-top:var(--space-3)"><span class="field-label">Прогнозы аудитории (@ник число)</span><textarea name="forecasts" rows="3">${esc(r.forecastsRaw || '')}</textarea></label>
    <label class="field" style="margin-top:var(--space-3)"><span class="field-label">Заметки</span><textarea name="notes" rows="2">${esc(r.notes || '')}</textarea></label>
    <div class="btn-row"><button class="btn btn-primary" data-action="save-edit" data-d="${d}">Сохранить</button></div></article>`;
}

function viewResults() {
  const R = analyze(false);
  const finished = !!getRec(TOTAL).h24;
  const Rp = finished ? analyze(true) : R;
  let html = `<div class="page-head"><div class="eyebrow">Аналитика</div><h1 class="page-title">Итоги</h1>
    <p class="lead">${finished ? 'Эксперимент завершён — ниже все оценки.' : 'Пока идёт эксперимент, здесь только описательные цифры. Оценки эффектов откроются после дня 30 — чтобы не было соблазна подглядывать и менять план.'}</p></div>`;
  html += `<div class="kpis">
    <div class="kpi"><div class="kpi-label">Постов с данными</div><div class="kpi-val">${R.n} / 30</div></div>
    <div class="kpi"><div class="kpi-label">Медиана за 24 ч</div><div class="kpi-val">${fmtN(R.med)}</div></div>
    <div class="kpi"><div class="kpi-label">Лучший день</div><div class="kpi-val">${R.maxDay ? `${fmtN(R.max)} <span class="xs muted">· д. ${R.maxDay}</span>` : '—'}</div></div>
    <div class="kpi"><div class="kpi-label">Подписки с постов</div><div class="kpi-val">${fmtN(R.follows)}</div></div>
    <div class="kpi"><div class="kpi-label">Ваша норма до старта</div><div class="kpi-val">${fmtN(baseMedian())}</div></div>
  </div>`;
  if (R.n) html += `<div class="section"><img class="chart-img" alt="График просмотров по дням" data-chart="res:30:week" /></div>`;
  if (finished && Rp.effects) {
    const lo = 0.33, hi = 3, pos = (x) => ((Math.log(Math.min(Math.max(x, lo), hi)) - Math.log(lo)) / (Math.log(hi) - Math.log(lo))) * 100;
    html += `<section class="section"><h2 class="section-title">Эффекты факторов</h2><div class="card">
      <p class="small muted">Множитель к просмотрам за сутки с учётом общего тренда. Полоса — 95% интервал, вертикальная линия — «без эффекта» (×1). p — t-тест коэффициента регрессии (p < 0,05 ⇔ интервал не задевает ×1). При таком шуме надёжно видны эффекты примерно от ×${fmtX(Rp.mde, 1)}.</p>
      ${Rp.effects.map((e) => `<div class="effect"><div>${e.name}</div><div class="effect-bar"><span class="one" style="left:${pos(1)}%"></span><span class="ci" style="left:${pos(e.lo)}%;width:${pos(e.hi) - pos(e.lo)}%"></span><span class="pt" style="left:${pos(e.x)}%"></span></div><div class="effect-val">×${fmtX(e.x)} <span class="xs muted">p${e.p < 0.01 ? '<0,01' : '=' + fmtX(e.p, 2)}</span></div></div>`).join('')}
    </div></section>`;
  }
  if (finished && Rp.fatigue) html += `<section class="section"><h2 class="section-title">Затухание в базовой неделе</h2><div class="card small">В среднем ${fmtX(Rp.fatigue.pct, 1)}% в день (95% интервал: ${fmtX(Rp.fatigue.lo, 1)}% … ${fmtX(Rp.fatigue.hi, 1)}%), по ${Rp.fatigue.n} дням.</div></section>`;
  if (R.leaders.length) html += `<section class="section"><h2 class="section-title">Лидеры прогнозов</h2><div class="table-wrap"><table><thead><tr><th>#</th><th>Ник</th><th class="n">Прогнозов</th><th class="n">Средняя ошибка</th></tr></thead><tbody>${R.leaders.slice(0, 10).map((x, i) => `<tr><td>${i + 1}</td><td>@${esc(x.h)}</td><td class="n">${x.n}</td><td class="n">в ${fmtX(Math.exp(x.err), 2)} раза</td></tr>`).join('')}</tbody></table></div></section>`;
  if (finished) html += `<section class="section"><h2 class="section-title">Проверка честности</h2><div class="card stack small"><p>Строка расписания с солью:</p><div class="hash">${esc(commitString())}</div><p>Её SHA-256:</p><div class="hash">${sha256(commitString())}</div><p class="muted">Совпадает с хешем из анонса: ${sha256(commitString()) === S.setup.hash ? 'да' : 'нет — проверьте, не меняли ли настройки'}.</p></div></section>`;
  return html;
}

function viewRules() {
  const faq = [
    ['Пропустил день — что теперь?', '<p>Ничего страшного. Следующий пост выйдет в обычное время на следующий день, номер дня сохранится. Не публикуйте два поста серии в один день, чтобы «догнать».</p>'],
    ['Опоздал с публикацией', '<p>До 4 часов опоздания — публикуйте сразу, помощник это учтёт. Если опоздание больше — лучше перенести на завтра в обычное время: одинаковое время важнее.</p>'],
    ['X пишет, что пост похож на недавний', '<p>В карточке поста нажмите «Другая формулировка» — поменяется вторая строка. Остальное не трогайте.</p>'],
    ['Пост завирусился', '<p>Отлично, это результат. Ничего не меняйте: не дописывайте, не добавляйте ссылок, отвечайте по правилу того дня. Помощник сам покажет, что пост превысил порог.</p>'],
    ['Спрашивают, какие условия сегодня', '<p>Отвечайте честно: «Расписание раскрою в конце, иначе эксперимент сломается. Хеш расписания — в закреплённом посте».</p>'],
    ['Можно ли публиковать обычные посты?', '<p>Да и нужно — в обычном для вас темпе. Только не в окно за 2 часа до и 2 часа после поста серии. Помощник показывает это окно.</p>'],
    ['Можно попросить друзей поддержать?', `<p>Нет. Договорные лайки и репосты нарушают ${ext(SRC.rules[0], 'правила X')} и портят данные: вы будете измерять друзей, а не алгоритм.</p>`],
    ['Не вижу аналитики поста', '<p>Число просмотров видно под каждым постом. Лайки, ответы и репосты — тоже. Этого достаточно; остальные поля необязательны.</p>'],
    ['Хочу остановиться', '<p>Настройки → «Поставить на паузу». Ничего не удаляйте. Данные сохранятся, продолжить можно в любой момент.</p>'],
    ['Что делать после эксперимента', '<p>Идеи для продолжения: опубликовать данные и протокол, чтобы другие ML-авторы повторили эксперимент у себя; провести версию 2 на английском; сравнить в посте ваши данные с простой симуляцией ленты.</p>'],
  ];
  return `<div class="page-head"><div class="eyebrow">Памятка</div><h1 class="page-title">Правила эксперимента</h1><p class="lead">Помощник сам говорит, что делать. Здесь — то, что важно держать в голове всегда.</p></div>
  <div class="card"><ul class="plain">
    <li><strong>Одно и то же время</strong> каждый день — ${S.setup.postTime}.</li>
    <li><strong>Не правьте и не удаляйте</strong> посты серии после публикации.</li>
    <li><strong>Никаких призывов</strong> «лайкните», «репостните», «помогите завируситься» — это накрутка, и она портит данные.</li>
    <li><strong>Никаких внешних ссылок и хештегов</strong> в постах серии.</li>
    <li><strong>Окно тишины:</strong> за 2 часа до и 2 часа после поста серии других постов не публикуем.</li>
    <li><strong>Условие ответов</strong> соблюдаем строго: «сразу» — значит в первые 30 минут; «через 3 часа» — значит до этого не отвечаем и не лайкаем комментарии.</li>
    <li><strong>Расписание</strong> не раскрываем до конца.</li>
    <li><strong>Выводы</strong> — только в итоговом треде. В сводках — только цифры.</li>
  </ul></div>
  <section class="section"><h2 class="section-title">Что значат условия</h2><div class="card small stack">
    <p><span class="chip on">С картинкой</span> — к посту прикрепляется график просмотров, который готовит помощник. <span class="chip">Только текст</span> — без вложений.</p>
    <p><span class="chip on">С вопросом-прогнозом</span> — в конце поста просьба угадать просмотры за сутки. Прогнозы принимаются 2 часа.</p>
    <p><span class="chip on">Отвечать сразу</span> — на комментарии в первые 30 минут. <span class="chip">Отвечать через 3 часа</span> — первые 3 часа не отвечаем.</p>
    <p class="muted">Первые 6 дней условия одинаковые — так мы измеряем, надоедает ли повтор. Дальше 24 дня условия меняются по заранее составленному случайному расписанию.</p>
  </div></section>
  <section class="section"><h2 class="section-title">Частые вопросы</h2>${faq.map(([q, a]) => `<details class="faq"><summary>${q}</summary><div>${a}</div></details>`).join('')}</section>`;
}

function viewSettings() {
  const st = historyStats(S.setup.history);
  return `<div class="page-head"><div class="eyebrow">Настройки</div><h1 class="page-title">Эксперимент и данные</h1></div>
  <div class="card stack">
    <div><div class="field-label">Ваш код эксперимента</div><div class="code-box">${CODE}</div>
    <p class="small muted" style="margin-top:var(--space-2)">Запишите его. В другом браузере на этом компьютере откройте страницу и выберите «У меня есть код». Телефон в той же сети увидит данные, только если сервер запущен с --host 0.0.0.0.</p></div>
  </div>
  <section class="section"><h2 class="section-title">Параметры</h2><div class="card stack">
    <div class="grid2">
      <label class="field"><span class="field-label">Время публикации</span><input type="time" name="postTime" value="${S.setup.postTime}" /><span class="field-hint">Меняйте только в крайнем случае: одинаковое время важно для чистоты данных.</span></label>
      <label class="field"><span class="field-label">Ник в X (для подписи на картинках)</span><input type="text" name="handle" value="${esc(S.setup.handle || '')}" placeholder="без @" /></label>
    </div>
    <div class="btn-row"><button class="btn btn-primary" data-action="save-settings">Сохранить</button></div>
    <p class="small muted">Ваша норма до старта: медиана ${fmtN(baseMedian())} просмотров${st ? `, разброс σ = ${fmtX(st.sigma, 2)}, эксперимент заметит эффекты примерно от ×${fmtX(st.mde, 1)}` : ''}. Порог «вирусности» — ${fmtN(viralThreshold())}.</p>
    <div><div class="field-label">Хеш расписания</div><div class="hash">${S.setup.hash || '—'}</div></div>
  </div></section>
  <section class="section"><h2 class="section-title">Резервная копия</h2><div class="card stack">
    <p class="small">Данные лежат на этом компьютере, в папке data рядом с программой. Раз в неделю скачивайте копию.</p>
    <div class="btn-row" style="margin-top:0"><button class="btn btn-ghost" data-action="backup">Скачать копию (JSON)</button>
    <label class="btn btn-ghost" style="cursor:pointer">Восстановить из файла<input type="file" accept="application/json,.json" data-action="restore" hidden /></label>
    <button class="btn btn-ghost" data-action="export-csv">Скачать таблицу (CSV)</button></div>
  </div></section>
  <section class="section"><h2 class="section-title">Пауза и сброс</h2><div class="card stack">
    <div class="btn-row" style="margin-top:0">
      ${S.paused ? '<button class="btn btn-primary" data-action="unpause">Продолжить эксперимент</button>' : '<button class="btn btn-ghost" data-action="pause">Поставить на паузу</button>'}
      <button class="btn btn-ghost" data-action="logout">Выйти на этом устройстве</button>
      <button class="btn btn-danger" data-action="reset">Начать заново</button>
    </div>
    <p class="xs muted">«Начать заново» стирает все данные этого эксперимента. Сначала скачайте копию.</p>
  </div></section>`;
}

/* ============================== Мастер настройки ============================== */
function day0Options() {
  const t = NOW(), opts = [];
  for (let i = 0; i < 8 && opts.length < 4; i++) {
    const day = addDays(sod(t), i);
    if (i === 0 && atTime(day, S.setup.postTime) - t < 90 * MIN) continue;
    opts.push(ymd(day));
  }
  return opts;
}
function viewSetup() {
  const st = S.setup, step = st.step || 0, steps = 5;
  const prog = `<div class="wizard-progress">${Array.from({ length: steps }, (_, i) => `<span class="${i <= step ? 'on' : ''}"></span>`).join('')}</div>`;
  const nav = (canNext, nextLabel = 'Дальше') => `<div class="btn-row">${step > 0 ? '<button class="btn btn-ghost" data-action="wiz-back">Назад</button>' : ''}<button class="btn btn-primary" data-action="wiz-next" ${canNext ? '' : 'disabled'}>${nextLabel}</button></div>`;
  let body = '';
  if (step === 0) {
    body = `<div class="eyebrow">Шаг 1 из ${steps}</div><h1 class="page-title">Как это будет работать</h1>
    <div class="card stack" style="margin-top:var(--space-6)">
      <p>Каждый день открываете эту страницу — и видите, что сделать прямо сейчас: какой пост опубликовать, когда отвечать на комментарии, какие цифры записать.</p>
      <p>Тексты, картинки и расписание готовлю я. От вас — скопировать, опубликовать и вписать несколько чисел. Это 10–15 минут в день.</p>
      <p>Всего: анонс, 30 постов, 4 недельные сводки и итоговый тред. Около пяти недель.</p>
      <div class="note"><strong>Ваш код эксперимента: <span class="mono">${CODE}</span>.</strong> Запишите его на бумаге. По нему данные открываются в другом браузере на этом компьютере. Файл с данными также лежит в папке data.</div>
    </div>${nav(true, 'Начать настройку')}`;
  } else if (step === 1) {
    body = `<div class="eyebrow">Шаг 2 из ${steps}</div><h1 class="page-title">Ваш аккаунт</h1>
    <div class="card stack" style="margin-top:var(--space-6)">
      <label class="field"><span class="field-label">Ник в X</span><input type="text" name="handle" value="${esc(st.handle || '')}" placeholder="без @" /><span class="field-hint">Нужен только для подписи на картинках. Можно оставить пустым.</span></label>
      <div style="max-width:260px">${numField('followers', 'Сколько у вас подписчиков сейчас', st.followers, { req: true })}</div>
    </div>${nav(true)}`;
  } else if (step === 2) {
    const s = historyStats(parseList(st.historyRaw));
    body = `<div class="eyebrow">Шаг 3 из ${steps}</div><h1 class="page-title">Ваша норма просмотров</h1>
    <p class="lead">Это нужно, чтобы понимать, что для вас «много», и следить, не вредит ли эксперимент аккаунту.</p>
    <div class="card stack" style="margin-top:var(--space-6)">
      <p class="small">Откройте свой профиль и выпишите число просмотров у последних 10–15 обычных постов: не ответов и не репостов. Число видно под каждым постом.</p>
      <label class="field"><span class="field-label req">Просмотры, по одному на строку или через запятую</span><textarea name="historyRaw" rows="6" data-live="history" placeholder="1200&#10;860&#10;3 400&#10;…">${esc(st.historyRaw || '')}</textarea></label>
      <div id="history-preview">${historyPreview(s)}</div>
    </div>${nav(!!s)}`;
  } else if (step === 3) {
    const times = ['09:00', '12:00', '15:00', '18:00', '19:00', '20:00', '21:00'];
    body = `<div class="eyebrow">Шаг 4 из ${steps}</div><h1 class="page-title">Время публикации</h1>
    <p class="lead">Каждый день пост серии будет выходить в одно и то же время. Выберите час, когда ваша аудитория обычно активна. Если не знаете — возьмите время, в которое вы обычно публикуете.</p>
    <div class="card stack" style="margin-top:var(--space-6)">
      <div class="seg">${times.map((x) => `<button data-action="set-time" data-value="${x}" aria-pressed="${st.postTime === x}">${x}</button>`).join('')}</div>
      <label class="field" style="max-width:200px"><span class="field-label">Или своё время</span><input type="time" name="postTimeCustom" data-live="time" value="${st.postTime}" /></label>
      <p class="small muted">Выбирайте время, когда вы стабильно у телефона ещё 30 минут после публикации: в половине дней нужно будет быстро ответить на комментарии.</p>
    </div>${nav(!!st.postTime)}`;
  } else if (step === 4) {
    const opts = day0Options();
    if (!st.day0Date || !opts.includes(st.day0Date)) st.day0Date = opts[0];
    const d0 = parseYmd(st.day0Date);
    body = `<div class="eyebrow">Шаг 5 из ${steps}</div><h1 class="page-title">Когда начинаем</h1>
    <p class="lead">Сначала анонс (день 0), на следующий день — первый пост серии.</p>
    <div class="card stack" style="margin-top:var(--space-6)">
      <div class="seg">${opts.map((x) => { const d = parseYmd(x); return `<button data-action="set-day0" data-value="${x}" aria-pressed="${st.day0Date === x}" style="font-family:var(--font-body)">${sameDay(d, NOW()) ? 'Сегодня' : sameDay(d, addDays(NOW(), 1)) ? 'Завтра' : WD_S[d.getDay()]}, ${dm(d)}</button>`; }).join('')}</div>
      <div class="note"><ul class="plain">
        <li>Анонс — ${WD[d0.getDay()]}, ${dm(d0)} в ${st.postTime}</li>
        <li>День 1 — ${dm(addDays(d0, 1))}, день 30 — ${dm(addDays(d0, 30))}</li>
        <li>Итоговый тред — ${dm(addDays(d0, 32))}</li>
      </ul></div>
      <p class="small muted">После запуска я составлю случайное расписание условий и посчитаю его хеш — он пойдёт в анонс, чтобы потом любой мог проверить, что вы ничего не подгоняли.</p>
    </div>${nav(true, 'Запустить эксперимент')}`;
  }
  return `<div>${prog}${body}</div>`;
}
function historyPreview(s) {
  if (!s) return '<p class="small muted">Нужно хотя бы 5 чисел.</p>';
  let note = '';
  if (s.mde > 2.2) note = '<div class="note warn" style="margin-top:var(--space-2)">У вас большой разброс просмотров. Эксперимент всё равно имеет смысл, но заметит только сильные эффекты. Так и скажем в итогах — честно.</div>';
  return `<div class="note ok">Чисел: ${s.n}. Ваш обычный пост набирает около <strong>${fmtN(s.med)}</strong> просмотров. Порог «вирусности» для эксперимента — ${fmtN(s.med * 10)}. При таком разбросе эксперимент надёжно заметит эффекты примерно от ×${fmtX(s.mde, 1)}.</div>${note}`;
}

function viewWelcome(err) {
  return `<div>
    <div class="eyebrow">Добро пожаловать</div>
    <h1 class="page-title">Помощник эксперимента «30 дней с алгоритмом X»</h1>
    <p class="lead">Каждый день он говорит, что сделать сегодня, готовит тексты и картинки и считает результаты. Ваша задача — просто делать, что написано.</p>
    <div class="card stack" style="margin-top:var(--space-6)">
      <button class="btn btn-primary" data-action="new" style="width:100%">Начать новый эксперимент</button>
      <div class="divider" style="margin:var(--space-2) 0"></div>
      <label class="field"><span class="field-label">У меня есть код</span><input type="text" name="code" placeholder="XXXX-XXXX-XXXX" autocomplete="off" style="font-family:var(--font-mono);text-transform:uppercase" /></label>
      <button class="btn btn-ghost" data-action="link">Открыть мой эксперимент</button>
      ${err ? `<div class="note err">${esc(err)}</div>` : ''}
    </div></div>`;
}

/* ============================== Рендер ============================== */
function render() {
  const app = $('#app'), tabs = $('#tabs');
  if (API === null) { tabs.hidden = true; app.innerHTML = '<div class="note err">Сервер помощника недоступен. Обновите страницу через минуту.</div>'; return; }
  if (!CODE || !S) { tabs.hidden = true; app.innerHTML = viewWelcome(render.err); return; }
  if (!S.setup.done) { tabs.hidden = true; app.innerHTML = viewSetup(); return; }
  tabs.hidden = false;
  $$('.tab', tabs).forEach((b) => b.setAttribute('aria-current', b.dataset.tab === TAB ? 'page' : 'false'));
  const views = { today: viewToday, days: viewDays, results: viewResults, rules: viewRules, settings: viewSettings };
  app.innerHTML = views[TAB]();
  hydrateCharts();
  renderSaveState();
}

/* ============================== Действия ============================== */
function setPath(path, value) {
  const keys = path.split('.'); let o = S;
  for (let i = 0; i < keys.length - 1; i++) o = o[keys[i]] || (o[keys[i]] = {});
  o[keys[keys.length - 1]] = value;
}
function getPath(path) { return path.split('.').reduce((o, k) => (o ? o[k] : undefined), S); }
const card = (el) => el.closest('.card') || el.closest('main');
const val = (scope, name) => { const el = scope.querySelector(`[name="${name}"]`); return el ? el.value : ''; };

const actions = {
  async new() {
    try { const r = await api('/api/new', { method: 'POST', body: '{}' }); CODE = r.code; S = freshState(); await api(`/api/state?code=${CODE}`, { method: 'PUT', body: JSON.stringify(S) }); render(); }
    catch (e) { render.err = 'Не получилось создать эксперимент. Попробуйте ещё раз.'; render(); }
  },
  async link(el) {
    const code = val(card(el), 'code').trim().toUpperCase();
    try { const r = await api('/api/link', { method: 'POST', body: JSON.stringify({ code }) }); CODE = r.code; await loadState(); render.err = null; render(); }
    catch (e) { render.err = 'Код не найден. Проверьте, что он введён полностью, например ABCD-EFGH-JKLM.'; render(); }
  },
  'wiz-back'() { S.setup.step = Math.max(0, S.setup.step - 1); save(); render(); },
  'wiz-next'(el) {
    const st = S.setup, c = card(el.closest('main'));
    if (st.step === 1) { st.handle = val(document, 'handle').trim().replace(/^@/, ''); const f = parseNum(val(document, 'followers')); if (f == null) { toast('Впишите число подписчиков'); return; } st.followers = f; }
    if (st.step === 2) { st.historyRaw = val(document, 'historyRaw'); st.history = parseList(st.historyRaw); if (!historyStats(st.history)) { toast('Нужно хотя бы 5 чисел'); return; } }
    if (st.step === 3) { const t = val(document, 'postTimeCustom'); if (t) st.postTime = t; }
    if (st.step === 4) {
      st.hash = sha256(commitString()); st.done = true; st.startedAt = new Date().toISOString();
      log('Эксперимент настроен'); save(); TAB = 'today'; render(); window.scrollTo(0, 0); return;
    }
    st.step++; save(); render(); window.scrollTo(0, 0);
  },
  'set-time'(el) { S.setup.postTime = el.dataset.value; save(); render(); },
  'set-day0'(el) { S.setup.day0Date = el.dataset.value; save(); render(); },
  set(el) { let v = el.dataset.value; if (/^\d+$/.test(v)) v = Number(v); if (v === 'true') v = true; setPath(el.dataset.path, v); save(); render(); },
  toggle(el) { setPath(el.dataset.path, el.checked); save(); render(); },
  async copy(el) {
    const ta = document.getElementById(el.dataset.target); if (!ta) return;
    const ok = await copyText(ta.value);
    if (!ok) { ta.focus(); ta.select(); toast('Скопируйте вручную: текст выделен'); return; }
    toast('Скопировано');
    const id = el.dataset.target;
    if (/^post\d+$/.test(id)) rec(Number(id.slice(4))).copied = true;
    if (id === 'd0text') S.day0.copied = true;
    if (/^dig\d$/.test(id)) (S.weeks[id.slice(3)] ||= {}).copied = true;
    save(); render();
  },
  'dl-chart'(el) {
    const [key, maxDay, kind] = el.dataset.chart.split(':');
    const c = chartFor(key, Number(maxDay), kind);
    c.toBlob((b) => { if (b) downloadBlob(b, el.dataset.name); });
    if (el.dataset.mark) { setPath(el.dataset.mark, true); save(); setTimeout(render, 300); }
  },
  'save-forecast'(el) { const d = +el.dataset.d; const v = parseNum(val(card(el), 'myForecast')); if (!v) { toast('Впишите число'); return; } rec(d).myForecast = v; log(`Прогноз на день ${d}: ${fmtN(v)}`); save(); render(); },
  'save-fact'(el) { const d = +el.dataset.d; const t = val(el.closest('details'), 'fact').trim(); if (t) { rec(d).fact = t; save(); render(); toast('Формулировка сохранена'); } },
  variant(el) { const d = +el.dataset.d; const r = rec(d); r.variant = ((r.variant || 0) + 1) % L2.length; r.notes = ((r.notes || '') + ' Формулировка изменена: X отклонил похожий пост.').trim(); save(); render(); toast('Вторая строка изменена'); },
  'mark-posted'(el) {
    const d = +el.dataset.d; const url = val(card(el), 'url').trim(); const t = NOW();
    const np = nextPost(t);
    if (np && np.idx === d && np.sched - t > 15 * MIN && !confirm(`Плановое время — ${hm(np.sched)}. Пост уже опубликован? Если нет, нажмите «Отмена» и опубликуйте ровно в ${hm(np.sched)}.`)) return;
    if (d === 0) { S.day0.postedAt = t.toISOString(); S.day0.url = url; S.day0.resultsDate = ymd(addDays(sod(t), 32)); log('Анонс опубликован'); }
    else { const r = rec(d); const followers = parseNum(val(card(el), 'followersNow')); r.postedAt = t.toISOString(); r.url = url; if (followers != null) r.followersAtPost = followers; log(`Пост дня ${d} опубликован`); }
    save(); render(); window.scrollTo({ top: 0, behavior: 'smooth' });
  },
  'day0-complete'() { S.day0.complete = true; log('Анонс: всё сделано'); save(); render(); },
  'replies-done'(el) { const d = +el.dataset.d; rec(d).repliesDone = NOW().toISOString(); log(`Ответы на комментарии ко дню ${d}`); save(); render(); },
  'save-snap'(el) {
    const d = +el.dataset.d, f = el.dataset.field; const v = parseNum(val(card(el), 'v'));
    if (v == null) { toast('Впишите число просмотров'); return; }
    rec(d)[f] = v; rec(d)[f + 'At'] = NOW().toISOString();
    log(`День ${d}: ${{ h1: '1 час', h48: '48 часов', d7: '7 дней' }[f]} — ${fmtN(v)}`); save(); render();
  },
  'save-h24'(el) {
    const d = +el.dataset.d, c = card(el), r = rec(d);
    const g = (n) => parseNum(val(c, n));
    const h = { impr: g('impr'), likes: g('likes'), replies: g('replies'), reposts: g('reposts'), quotes: g('quotes'), bookmarks: g('bookmarks'), profile: g('profile'), follows: g('follows'), expands: g('expands') };
    if (h.impr == null || h.likes == null || h.replies == null) { toast('Заполните просмотры, лайки и ответы'); return; }
    r.h24 = h; r.h24At = NOW().toISOString(); r.followersAfter = g('followers');
    if (cond(d).B) { r.forecastsRaw = val(c, 'forecasts'); r.forecasts = parseForecasts(r.forecastsRaw); }
    log(`День ${d}: сутки — ${fmtN(h.impr)} ${plural(h.impr, W_VIEWS)}`); save(); render();
    if (h.impr > viralThreshold()) toast('Пост превысил порог вирусности');
  },
  'save-others'(el) { const k = el.dataset.k; const c = card(el); const o = [0, 1, 2].map((i) => parseNum(val(c, 'o' + i))).filter((v) => v > 0); const w = (S.weeks[k] ||= {}); w.others = o; w.ratio = o.length >= 2 && baseMedian() ? median(o) / baseMedian() : null; save(); render(); },
  'digest-done'(el) { const k = el.dataset.k; (S.weeks[k] ||= {}).done = NOW().toISOString(); log(`Сводка недели ${k} опубликована`); save(); render(); },
  'final-done'() { S.final.done = NOW().toISOString(); log('Итоговый тред опубликован'); save(); render(); },
  'edit-day'(el) { EDIT_DAY = +el.dataset.d; render(); window.scrollTo({ top: 0, behavior: 'smooth' }); },
  'close-edit'() { EDIT_DAY = null; render(); },
  'save-edit'(el) {
    const d = +el.dataset.d, c = card(el);
    const pa = val(c, 'postedAt'); const url = val(c, 'url').trim();
    if (d === 0) { S.day0.postedAt = pa ? new Date(pa).toISOString() : S.day0.postedAt; S.day0.url = url; }
    else {
      const r = rec(d), g = (n) => parseNum(val(c, n));
      if (pa) r.postedAt = new Date(pa).toISOString();
      r.url = url; r.h1 = g('h1'); r.h48 = g('h48'); r.d7 = g('d7'); r.myForecast = g('myForecast');
      const h = { impr: g('impr'), likes: g('likes'), replies: g('replies'), reposts: g('reposts'), quotes: g('quotes'), bookmarks: g('bookmarks'), profile: g('profile'), follows: g('follows'), expands: g('expands') };
      r.h24 = h.impr != null ? { ...h, likes: h.likes ?? 0, replies: h.replies ?? 0 } : null;
      r.forecastsRaw = val(c, 'forecasts'); r.forecasts = parseForecasts(r.forecastsRaw); r.notes = val(c, 'notes');
    }
    EDIT_DAY = null; save(); render(); toast('Сохранено');
  },
  'save-settings'(el) { const c = card(el); const t = val(c, 'postTime'); if (t) S.setup.postTime = t; S.setup.handle = val(c, 'handle').trim().replace(/^@/, ''); save(); render(); toast('Сохранено'); },
  backup() { downloadBlob(new Blob([JSON.stringify(S, null, 2)], { type: 'application/json' }), `x-eksperiment-${CODE}-${ymd(new Date())}.json`); },
  'export-csv'() {
    const cols = ['day', 'posted_at', 'followers_at_post', 'A_media', 'B_question', 'C_fast_replies', 'phase', 'block', 'impressions_1h', 'impressions_24h', 'impressions_48h', 'impressions_7d', 'likes_24h', 'replies_24h', 'reposts_24h', 'quotes_24h', 'bookmarks_24h', 'profile_visits_24h', 'follows_24h', 'detail_expands_24h', 'my_forecast', 'crowd_median_forecast', 'crowd_n', 'fact_score', 'url', 'notes'];
    const lines = [cols.join(',')];
    for (let d = 1; d <= TOTAL; d++) {
      const c = cond(d), r = getRec(d), h = r.h24 || {};
      const fc = r.forecasts || [];
      const row = [d, r.postedAt || '', r.followersAtPost ?? '', c.A, c.B, c.C, c.phase, c.block, r.h1 ?? '', h.impr ?? '', r.h48 ?? '', r.d7 ?? '', h.likes ?? '', h.replies ?? '', h.reposts ?? '', h.quotes ?? '', h.bookmarks ?? '', h.profile ?? '', h.follows ?? '', h.expands ?? '', r.myForecast ?? '', fc.length ? median(fc.map((x) => x.v)) : '', fc.length, r.factScore ?? '', r.url || '', (r.notes || '').replace(/"/g, '""')];
      lines.push(row.map((v, i) => (i === row.length - 1 ? `"${v}"` : v)).join(','));
    }
    downloadBlob(new Blob(['\ufeff' + lines.join('\n')], { type: 'text/csv;charset=utf-8' }), `x-eksperiment-${ymd(new Date())}.csv`);
  },
  pause() { S.paused = true; log('Эксперимент на паузе'); save(); TAB = 'today'; render(); },
  unpause() { S.paused = false; log('Эксперимент продолжен'); save(); render(); },
  async logout() { if (!confirm('Выйти в этом браузере? Данные останутся в папке data, войти можно по коду.')) return; await api('/api/logout', { method: 'POST', body: '{}' }).catch(() => {}); CODE = null; S = null; render(); },
  reset() { if (!confirm('Стереть все данные эксперимента и начать заново? Это нельзя отменить.')) return; S = freshState(); save(); TAB = 'today'; render(); },
  'retry-save'() { saveError = false; flush(); },
};

document.addEventListener('click', (e) => {
  const tab = e.target.closest('[data-tab]');
  if (tab) { TAB = tab.dataset.tab; EDIT_DAY = null; render(); window.scrollTo(0, 0); return; }
  const el = e.target.closest('[data-action]');
  if (!el || el.tagName === 'INPUT' && el.type === 'file') return;
  if (el.tagName === 'INPUT' && el.type === 'checkbox') return; // handled on change
  const fn = actions[el.dataset.action];
  if (fn) { e.preventDefault(); fn(el); }
});
document.addEventListener('change', (e) => {
  const el = e.target;
  if (el.matches('input[type=checkbox][data-action="toggle"]')) actions.toggle(el);
  if (el.matches('input[type=file][data-action="restore"]')) {
    const f = el.files[0]; if (!f) return;
    f.text().then((txt) => { try { const obj = JSON.parse(txt); if (!obj.setup) throw new Error(); S = obj; save(); render(); toast('Данные восстановлены'); } catch { toast('Файл не похож на копию эксперимента'); } });
  }
});
document.addEventListener('input', (e) => {
  const el = e.target;
  if (el.dataset.live === 'history') {
    S.setup.historyRaw = el.value; const s = historyStats(parseList(el.value));
    $('#history-preview').innerHTML = historyPreview(s);
    const nx = $('[data-action="wiz-next"]'); if (nx) nx.disabled = !s;
  }
  if (el.dataset.live === 'time' && el.value) { S.setup.postTime = el.value; $$('[data-action="set-time"]').forEach((b) => b.setAttribute('aria-pressed', b.dataset.value === el.value)); }
});

// Время идёт — обновляем экран «Сегодня», если пользователь ничего не вводит
setInterval(() => {
  if (!S || !S.setup.done || TAB !== 'today') return;
  const a = document.activeElement;
  if (a && ['INPUT', 'TEXTAREA', 'SELECT'].includes(a.tagName)) return;
  if (document.querySelector('#app details[open]')) return;
  render();
}, 60 * 1000);
window.addEventListener('hashchange', render);

async function loadState() {
  const data = await api(`/api/state?code=${CODE}`);
  S = data && data.setup ? data : freshState();
  S.day0 ||= {}; S.days ||= {}; S.weeks ||= {}; S.final ||= {}; S.log ||= [];
}

async function init() {
  if (API === null) { render(); return; }
  try {
    const s = await api('/api/session');
    if (s.code) { CODE = s.code; await loadState(); }
  } catch (e) { render.err = 'Сервер не ответил. Обновите страницу через минуту.'; }
  if (document.fonts) { try { await Promise.race([new Promise((r) => setTimeout(r, 2500)), (async () => { await Promise.all(['700 40px "Golos Text"', '400 24px "Golos Text"', '500 20px "Golos Text"', '400 18px "JetBrains Mono"', '600 18px "JetBrains Mono"'].map((f) => document.fonts.load(f))); await document.fonts.ready; })()]); } catch (e) { /* ignore */ } }
  render();
}
init();
})();
