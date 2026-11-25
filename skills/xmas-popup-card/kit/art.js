// Illustrations as paper cards: a transparent PNG is trimmed to its silhouette, the cut follows its alpha outline
// (P2.fromDrawing), the print is the picture itself with a little paper grain and inner shade, and its warm bright
// pixels (lit windows, lanterns, the star) become the card's glow map.
import * as P2 from 'papercraft/lib/paperkit-2d.js';

export async function loadArt(names, base = './codex/art/', ext = 'png') {
  const out = {};
  await Promise.all(names.map(async (n) => {
    const img = new Image(); img.src = `${base}${n}.${ext}`;
    try { await img.decode(); out[n] = prep(img, n); } catch (e) { console.warn(`art ${n}: ${e.message}`); }
  }));
  return out;
}

function prep(img, name) {
  const W = img.naturalWidth, H = img.naturalHeight;
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(img, 0, 0);
  const id = g.getImageData(0, 0, W, H), d = id.data;
  // an opaque background (all four corners solid): key it out by flooding from the border through near-corner colours
  const corners = [0, W - 1, (H - 1) * W, H * W - 1];
  if (corners.every((i) => d[i * 4 + 3] > 200)) {
    const c0 = [0, 1, 2].map((k) => corners.reduce((s, i) => s + d[i * 4 + k], 0) / 4);
    const near = (i) => Math.abs(d[i * 4] - c0[0]) + Math.abs(d[i * 4 + 1] - c0[1]) + Math.abs(d[i * 4 + 2] - c0[2]) < 60;
    const seen = new Uint8Array(W * H), stack = [];
    for (let x = 0; x < W; x++) stack.push(x, (H - 1) * W + x);
    for (let y = 0; y < H; y++) stack.push(y * W, y * W + W - 1);
    while (stack.length) {
      const p = stack.pop(); if (seen[p] || !near(p)) continue; seen[p] = 1; d[p * 4 + 3] = 0;
      const x = p % W, y = (p - x) / W;
      if (x > 0) stack.push(p - 1); if (x < W - 1) stack.push(p + 1); if (y > 0) stack.push(p - W); if (y < H - 1) stack.push(p + W);
    }
    console.warn(`art ${name}: opaque background keyed out`);
  }
  let x0 = W, y0 = H, x1 = -1, y1 = -1;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = (y * W + x) * 4;
    if (d[i + 3] < 24) d[i + 3] = 0;
    if (d[i + 3] > 127) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  }
  g.putImageData(id, 0, 0);
  const cw = x1 - x0 + 1, ch = y1 - y0 + 1;
  const crop = document.createElement('canvas'); crop.width = cw; crop.height = ch;
  crop.getContext('2d').drawImage(c, x0, y0, cw, ch, 0, 0, cw, ch);
  // glow: warm, bright pixels (window light #ffc35a and kin), never the duller gold ink
  const glow = document.createElement('canvas'); glow.width = cw; glow.height = ch;
  const gg = glow.getContext('2d'), gd = gg.createImageData(cw, ch); let lit = 0;
  const src = crop.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, cw, ch).data;
  const cl = (v) => Math.min(1, Math.max(0, v));
  for (let i = 0; i < cw * ch; i++) {
    const r = src[i * 4], gr = src[i * 4 + 1], b = src[i * 4 + 2], a = src[i * 4 + 3];
    const k = a > 127 ? cl((r - 228) / 22) * cl((gr - 150) / 40) * cl((190 - b) / 60) * cl((r - b - 70) / 40) : 0;
    const v = Math.round(255 * k); gd.data[i * 4] = gd.data[i * 4 + 1] = gd.data[i * 4 + 2] = v; gd.data[i * 4 + 3] = 255; if (k > 0.3) lit++;
  }
  gg.putImageData(gd, 0, 0);
  // the highest point away from the middle (a chimney on a cottage), as fractions of the trimmed picture
  let best = { u: 0.25, v: 0.9, top: ch };
  for (let x = 0; x < cw; x++) {
    const u = x / cw; if (u > 0.35 && u < 0.65) continue;
    for (let y = 0; y < ch; y++) if (src[(y * cw + x) * 4 + 3] > 127) { if (y < best.top) best = { u, v: 1 - y / ch, top: y }; break; }
  }
  return { canvas: crop, glow: lit > cw * ch * 0.0005 ? glow : null, w: cw, h: ch, aspect: cw / ch, peak: best };
}

/** [pts, paint] for makeCard: the picture `a` (from loadArt) as a card `h` units tall, standing on y = 0, centred on x = 0. */
export function artPiece(a, h, { name = '', shade = 0.22, felt = 0.2 } = {}) {
  const w = h * a.aspect;
  const put = (g, src) => { g.save(); g.imageSmoothingQuality = 'high'; g.translate(-w / 2, h); g.scale(w / a.w, -h / a.h); g.drawImage(src, 0, 0); g.restore(); };
  const pts = P2.fromDrawing((g) => put(g, a.canvas), { w: w + 0.3, h: h + 0.15, res: Math.max(40, Math.min(110, 700 / Math.max(w, h))), name });
  const paint = (P) => {
    P.draw((g) => put(g, a.canvas));
    P.felt(felt);
    P.innerShade('#2a1a20', { alpha: shade, blurPx: 8 });
    if (a.glow) P.glow((gc) => put(gc, a.glow));
  };
  const piece = [pts, paint];
  piece.w = w; piece.h = h; piece.chimney = [(a.peak.u - 0.5) * w, a.peak.v * h + 0.15];
  return piece;
}
