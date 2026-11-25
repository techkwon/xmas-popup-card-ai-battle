// The card's message: read from the link's fragment (#to=&msg=&from=, never sent to the web server; ?to=&msg=&from= in
// the query still works for older links and the capture tools), a small "write a message" panel that reloads the card
// with the new words, and a share link that carries them. Nothing is stored or sent anywhere by this code.
const LIMIT = { to: 24, msg: 90, from: 24 };
export const DEFAULT_MESSAGE = { to: '소중한 너에게', msg: '메리 크리스마스! 올해도 정말 고마웠어. 따뜻하고 행복한 연말 보내!', from: '산타가' };

export function getMessage(search = location.search, hash = location.hash) {
  const q = new URLSearchParams(search), h = new URLSearchParams(hash.replace(/^#/, '')), out = {};
  for (const k of ['to', 'msg', 'from']) {
    const v = h.has(k) ? h.get(k) : q.get(k);
    out[k] = (v === null ? DEFAULT_MESSAGE[k] : v).replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, LIMIT[k]);
  }
  return out;
}

/** Wait for the handwriting font before printing words on paper (canvas text never waits by itself). */
export async function loadMessageFont(family = 'Nanum Pen Script') {
  try { await Promise.race([document.fonts.load(`64px "${family}"`, '가나다 Merry'), new Promise((r) => setTimeout(r, 4000))]); } catch (e) { /* print with the fallback */ }
}

/** Break text into at most maxLines lines that fit maxW (measured with the context's current font). */
export function wrapLines(g, text, maxW, maxLines = 2) {
  const words = text.split(/(\s+)/), lines = []; let cur = '';
  const push = (s) => { lines.push(s.trim()); };
  for (const w of words) {
    if (g.measureText(cur + w).width <= maxW) { cur += w; continue; }
    if (cur.trim()) { push(cur); cur = ''; }
    if (g.measureText(w).width <= maxW) { cur = w.trimStart(); continue; }
    for (const ch of w) { if (g.measureText(cur + ch).width > maxW) { push(cur); cur = ''; } cur += ch; }
  }
  if (cur.trim()) push(cur);
  if (lines.length > maxLines) { lines.length = maxLines; lines[maxLines - 1] = lines[maxLines - 1].replace(/.$/, '…'); }
  return lines;
}

/** The "write a message" button and panel (hidden in capture mode). Applying reloads the card with the words in the URL. */
export function mountMessageUI() {
  if (new URLSearchParams(location.search).has('capture')) return;
  const m = getMessage();
  const css = document.createElement('style');
  css.textContent = `
  .msg-btn{position:fixed;right:16px;bottom:16px;z-index:10;border:0;border-radius:999px;padding:10px 16px;font:600 15px/1 system-ui,sans-serif;
    background:#fff6e6;color:#7a2a22;box-shadow:0 4px 14px rgba(0,0,0,.35);cursor:pointer}
  .msg-panel{position:fixed;right:16px;bottom:64px;z-index:10;width:min(340px,calc(100vw - 32px));background:#fffaf0;color:#3a2a22;border-radius:14px;
    padding:16px;box-shadow:0 10px 30px rgba(0,0,0,.45);font:14px/1.4 system-ui,sans-serif;display:none}
  .msg-panel.open{display:block}
  .msg-panel label{display:block;margin:8px 0 4px;font-weight:600}
  .msg-panel input,.msg-panel textarea{width:100%;box-sizing:border-box;border:1px solid #d9c9b0;border-radius:8px;padding:8px;font:15px/1.4 system-ui,sans-serif;background:#fff}
  .msg-panel textarea{height:70px;resize:none}
  .msg-row{display:flex;gap:8px;margin-top:12px}
  .msg-row button{flex:1;border:0;border-radius:8px;padding:10px;font:600 14px/1 system-ui,sans-serif;cursor:pointer}
  .msg-apply{background:#b23a32;color:#fff}.msg-copy{background:#2f5a46;color:#fff}
  .msg-note{margin-top:8px;font-size:12px;color:#8a7a6a}`;
  document.head.appendChild(css);
  const btn = document.createElement('button'); btn.className = 'msg-btn'; btn.type = 'button'; btn.textContent = '✉ 메시지 쓰기';
  const panel = document.createElement('div'); panel.className = 'msg-panel';
  const field = (label, key, tag = 'input') => {
    const l = document.createElement('label'); l.textContent = label;
    const el = document.createElement(tag); el.maxLength = LIMIT[key]; el.value = m[key]; el.dataset.key = key;
    panel.append(l, el); return el;
  };
  const fTo = field('받는 사람', 'to'), fMsg = field('메시지', 'msg', 'textarea'), fFrom = field('보내는 사람', 'from');
  const row = document.createElement('div'); row.className = 'msg-row';
  const apply = document.createElement('button'); apply.className = 'msg-apply'; apply.type = 'button'; apply.textContent = '카드에 적기';
  const copy = document.createElement('button'); copy.className = 'msg-copy'; copy.type = 'button'; copy.textContent = '링크 복사';
  const note = document.createElement('div'); note.className = 'msg-note'; note.textContent = '메시지는 링크의 # 뒷부분에만 담겨 서버로 보내지지 않고, 어디에도 저장되지 않아요. 링크를 받은 사람은 누구나 볼 수 있으니 비밀 이야기는 적지 마세요.';
  row.append(apply, copy); panel.append(row, note);
  // the share link keeps the page's own options (such as ?art=codex) but drops capture settings and any message in the query
  const linkFor = () => {
    const u = new URL(location.href);
    for (const k of ['to', 'msg', 'from', 'size', 'capture']) u.searchParams.delete(k);
    u.hash = new URLSearchParams({ to: fTo.value, msg: fMsg.value, from: fFrom.value }).toString();
    return u.toString();
  };
  btn.addEventListener('click', (e) => { e.stopPropagation(); panel.classList.toggle('open'); });
  panel.addEventListener('pointerdown', (e) => e.stopPropagation());
  apply.addEventListener('click', () => { history.replaceState(null, '', linkFor()); location.reload(); });
  copy.addEventListener('click', async () => {
    const url = linkFor();
    try { await navigator.clipboard.writeText(url); copy.textContent = '복사했어요!'; } catch (e) { prompt('이 링크를 복사하세요', url); }
    setTimeout(() => { copy.textContent = '링크 복사'; }, 1600);
  });
  btn.addEventListener('pointerdown', (e) => e.stopPropagation());
  document.body.append(btn, panel);
}
