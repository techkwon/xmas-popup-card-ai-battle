// art.js: small drawing helpers for the prints (shape units, y up), and the handwriting.
import { wrapLines } from '../../kit/message.js';

export const TAU = Math.PI * 2;
const K = 100;                                   // font px per shape unit while drawing text
const FALLBACK = '"Apple SD Gothic Neo", "Malgun Gothic", "Noto Sans KR", sans-serif';

export const fontOf = (family, weight = 400) => `${weight} ${K}px "${family}", ${FALLBACK}`;

/** Upright text in a y-up print: (x, y) is the anchor on the baseline, size = em height in shape units. */
export function text(g, str, x, y, { size = 1, family = 'Nanum Pen Script', weight = 400, align = 'center', baseline = 'alphabetic', color = null, rot = 0, stroke = null, strokeW = 0 } = {}) {
  g.save();
  g.translate(x, y); if (rot) g.rotate(rot);
  g.scale(size / K, -size / K);
  g.font = fontOf(family, weight); g.textAlign = align; g.textBaseline = baseline;
  if (color) g.fillStyle = color;
  if (stroke) { g.strokeStyle = stroke; g.lineWidth = strokeW * K / size; g.lineJoin = 'round'; g.strokeText(str, 0, 0); }
  g.fillText(str, 0, 0);
  g.restore();
}

/** Width of a string in shape units at the given size. */
export function textWidth(g, str, { size = 1, family = 'Nanum Pen Script', weight = 400 } = {}) {
  g.save(); g.font = fontOf(family, weight); const w = g.measureText(str).width; g.restore();
  return w * size / K;
}

/** Wrap and shrink: the largest size (max .. min) at which `str` fits w x h in at most maxLines lines. */
export function fitText(g, str, { w, h, max = 1, min = 0.4, lead = 1.12, maxLines = 4, family = 'Nanum Pen Script', weight = 400 } = {}) {
  g.save(); g.font = fontOf(family, weight);
  let out = null;
  for (let size = max; size >= min - 1e-6; size -= 0.02) {
    const lines = wrapLines(g, str, (w / size) * K, 99);
    if (lines.length <= maxLines && lines.length * size * lead <= h) { out = { size, lines }; break; }
  }
  if (!out) { const n = Math.max(1, Math.min(maxLines, Math.floor(h / (min * lead)))); out = { size: min, lines: wrapLines(g, str, (w / min) * K, n) }; }
  g.restore();
  return { ...out, lead };
}

export function circlePts(cx, cy, r, n = 40) { const p = []; for (let i = 0; i < n; i++) { const a = (i / n) * TAU; p.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); } return p; }
export function starPts(cx, cy, R, r, n = 5, rot = Math.PI / 2) { const p = []; for (let i = 0; i < n * 2; i++) { const a = rot + (i / (n * 2)) * TAU, q = i % 2 ? r : R; p.push([cx + Math.cos(a) * q, cy + Math.sin(a) * q]); } return p; }
export function poly(g, pts) { g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); g.fill(); }
export function disc(g, x, y, r) { g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); }
export function ell(g, x, y, rx, ry, rot = 0) { g.beginPath(); g.ellipse(x, y, rx, ry, rot, 0, TAU); g.fill(); }
export function rrect(g, x, y, w, h, r = 0) { g.beginPath(); g.roundRect(x, y, w, h, Math.min(r, w / 2, h / 2)); g.fill(); }
export function star(g, x, y, R, r = R * 0.45, n = 5, rot = Math.PI / 2) { poly(g, starPts(x, y, R, r, n, rot)); }
/** A four-point sparkle with pinched sides. */
export function sparkle(g, x, y, R, pinch = 0.22) {
  g.beginPath(); g.moveTo(x, y + R);
  g.quadraticCurveTo(x + R * pinch, y + R * pinch, x + R, y); g.quadraticCurveTo(x + R * pinch, y - R * pinch, x, y - R);
  g.quadraticCurveTo(x - R * pinch, y - R * pinch, x - R, y); g.quadraticCurveTo(x - R * pinch, y + R * pinch, x, y + R);
  g.fill();
}
/** A six-armed snowflake as fat strokes (set strokeStyle / lineWidth first). */
export function snowflake(g, x, y, R, twigs = true) {
  g.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * TAU + Math.PI / 2, c = Math.cos(a), s = Math.sin(a);
    g.moveTo(x - c * R, y - s * R * 0); g.moveTo(x, y); g.lineTo(x + c * R, y + s * R);
    if (twigs) for (const sd of [-1, 1]) { const b = a + sd * 0.9, k = 0.58; g.moveTo(x + c * R * k, y + s * R * k); g.lineTo(x + c * R * k + Math.cos(b) * R * 0.3, y + s * R * k + Math.sin(b) * R * 0.3); }
  }
  g.stroke();
}
/** A snow line: a scalloped lower or upper edge between x0 and x1 (appends to the current path; call after moveTo). */
export function scallops(g, x0, x1, y, n, depth) {
  const w = (x1 - x0) / n;
  for (let i = 0; i < n; i++) g.quadraticCurveTo(x0 + w * (i + 0.5), y + depth * 2, x0 + w * (i + 1), y);
}
/** A tiered fir as one filled silhouette: tiers of scalloped skirts on a stub trunk. Base on y, centred on x. */
export function firTier(g, x, yb, hw, top, n = 3, sag = 0.16) {
  const w = (hw * 2) / n;
  g.beginPath(); g.moveTo(x - hw, yb + hw * sag);
  for (let i = 0; i < n; i++) g.quadraticCurveTo(x - hw + w * (i + 0.5), yb - hw * sag, x - hw + w * (i + 1), yb + hw * sag);
  g.lineTo(x, top); g.closePath(); g.fill();
}
export function fir(g, x, y, w, h, tiers = 3, trunk = true) {
  const th = h * 0.1;
  if (trunk) g.fillRect(x - w * 0.07, y, w * 0.14, th + h * 0.1);
  for (let k = 0; k < tiers; k++) {
    const yb = y + th + (h - th) * (k / tiers) * 0.82, hw = (w / 2) * (1 - (k / tiers) * 0.6);
    firTier(g, x, yb, hw, k === tiers - 1 ? y + h : yb + (h - th) / tiers * 1.5, Math.max(2, 4 - k));
  }
}
/** Seeded helpers. */
export const pick = (r, a) => a[Math.floor(r() * a.length) % a.length];
export const rand = (r, a, b) => a + (b - a) * r();
