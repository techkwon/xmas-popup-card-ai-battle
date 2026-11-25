// Printed sheets that are not pictures from the art set: the letter that carries the message (an air-mail sheet glued
// in the sky), the cover sheet around cover.png, and the table top. Everything here is paper, ink and a few borders.
import * as P2 from 'papercraft/lib/paperkit-2d.js';
import { wrapLines } from '../../kit/message.js';

export const INK = { navy: '#1b2a4c', cranberry: '#a5313a', cream: '#fbf3e0', gold: '#e8b54a', sage: '#5d8b6c', sky: '#12233b' };
const FONT = '"Nanum Pen Script", "Nanum Brush Script", "Apple SD Gothic Neo", "Malgun Gothic", cursive';

/** Draw an image into a y-up print: its top-left at (x, y + h), w x h units. */
export function drawImg(g, img, x, y, w, h) {
  g.save(); g.imageSmoothingQuality = 'high'; g.translate(x, y + h); g.scale(w / img.width, -h / img.height); g.drawImage(img, 0, 0); g.restore();
}

/** A four-point sparkle (the art's own little stars), y-up units. */
export function sparkle(g, x, y, r, waist = 0.24) {
  g.beginPath();
  for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2 + Math.PI / 2, rr = i % 2 ? r * waist : r; g[i ? 'lineTo' : 'moveTo'](x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
  g.closePath();
}

/** Rounded rectangle outline standing on y = 0 (a cut sheet). */
export function sheetOutline(w, h, r = 0.25, n = 5) {
  const pts = [], corner = (cx, cy, a0) => { for (let i = 0; i <= n; i++) { const a = a0 + (i / n) * Math.PI / 2; pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); } };
  corner(w / 2 - r, r, -Math.PI / 2); corner(w / 2 - r, h - r, 0); corner(-w / 2 + r, h - r, Math.PI / 2); corner(-w / 2 + r, r, Math.PI);
  return pts;
}

/**
 * The letter: cream air-mail paper with a striped border, a little star stamp and a postmark, and the message in
 * handwriting. Long messages wrap and shrink until they fit; the three parts never leave the sheet.
 */
export function paintLetter(P, { to, msg, from }, W, H) {
  const B = 0.36;                                   // border band
  P.fill(INK.cream);
  P.draw((g) => {                                   // air-mail chevrons round the edge, clipped to the band
    g.save();
    g.beginPath(); g.rect(-W / 2, 0, W, H); g.rect(-W / 2 + B, B, W - 2 * B, H - 2 * B); g.clip('evenodd');
    const step = 0.62;
    for (let i = -Math.ceil(H / step) - 2; i < (W + H) / step + 2; i++) {
      g.fillStyle = i % 2 ? INK.cranberry : '#3f6491';
      g.beginPath(); const x = -W / 2 + i * step;
      g.moveTo(x, 0); g.lineTo(x + step * 0.56, 0); g.lineTo(x + step * 0.56 + H, H); g.lineTo(x + H, H); g.closePath(); g.fill();
    }
    g.restore();
    g.strokeStyle = 'rgba(60,40,30,0.22)'; g.lineWidth = 0.035; g.strokeRect(-W / 2 + B, B, W - 2 * B, H - 2 * B);
  });
  // the stamp (top right): a pale sheet with a cranberry field and a gold star, and a postmark of rings and waves
  const sw = 1.05, sh = 1.36, sx = W / 2 - B - 0.42 - sw, sy = H - B - 0.3 - sh;
  P.layer((g) => {
    g.fillStyle = '#fffaf0'; g.beginPath(); g.rect(sx, sy, sw, sh); g.fill();
    for (let i = 0; i <= 5; i++) for (const [px, py] of [[sx + (i / 5) * sw, sy], [sx + (i / 5) * sw, sy + sh]]) { g.beginPath(); g.arc(px, py, 0.075, 0, 7); g.fill(); }
    for (let i = 0; i <= 6; i++) for (const [px, py] of [[sx, sy + (i / 6) * sh], [sx + sw, sy + (i / 6) * sh]]) { g.beginPath(); g.arc(px, py, 0.075, 0, 7); g.fill(); }
  }, '#fffaf0', { depth: 0.5 });
  P.draw((g) => {
    g.fillStyle = INK.cranberry; g.fillRect(sx + 0.12, sy + 0.12, sw - 0.24, sh - 0.24);
    g.fillStyle = '#f6d98a'; sparkle(g, sx + sw / 2, sy + sh / 2 + 0.04, 0.36, 0.3); g.fill();
    g.fillStyle = '#fff6dc'; for (const [dx, dy] of [[-0.26, 0.38], [0.27, -0.36], [0.25, 0.42]]) { g.beginPath(); g.arc(sx + sw / 2 + dx, sy + sh / 2 + dy, 0.04, 0, 7); g.fill(); }
    g.strokeStyle = 'rgba(27,42,76,0.45)'; g.lineWidth = 0.045; g.lineCap = 'round';
    const cx = sx - 0.42, cy = sy + sh * 0.46;
    g.beginPath(); g.arc(cx, cy, 0.58, 0, 7); g.stroke(); g.beginPath(); g.arc(cx, cy, 0.4, 0, 7); g.stroke();
    g.fillStyle = 'rgba(27,42,76,0.45)'; sparkle(g, cx, cy, 0.21, 0.36); g.fill();
    for (let k = 0; k < 3; k++) { g.beginPath(); for (let i = 0; i <= 24; i++) { const x = cx + 0.44 + (i / 24) * 1.5, y = cy + (k - 1) * 0.23 + Math.sin(i * 0.8) * 0.05; g[i ? 'lineTo' : 'moveTo'](x, y); } g.stroke(); }
  });
  // the words, laid out in print pixels (canvas text wants pixel sizes): "to" shares the top band with the stamp,
  // "from" signs off at the bottom right, and the message takes the biggest size whose wrapped lines fit between them
  P.draw((g) => {
    const ppu = 1 / P.px, X = (x) => (x - P.box.x0) * ppu, Y = (y) => (P.box.y1 - y) * ppu;
    g.setTransform(1, 0, 0, 1, 0, 0);
    const padX = B + 0.62, x0 = -W / 2 + padX, x1 = W / 2 - padX, top = H - B - 0.3, bot = B + 0.3, band = sy - 0.1, maxW = x1 - x0;
    const font = (u) => { g.font = `${u * ppu}px ${FONT}`; };
    const fitOne = (text, u, w) => { font(u); while (u > 0.5 && g.measureText(text).width > w * ppu) { u -= 0.03; font(u); } return u; };
    const put = (text, x, y, u, color, align) => {
      font(u); g.textAlign = align; g.textBaseline = 'alphabetic'; g.fillStyle = color; g.strokeStyle = color; g.lineJoin = 'round';
      g.lineWidth = u * ppu * 0.022; g.strokeText(text, X(x), Y(y)); g.fillText(text, X(x), Y(y));
    };
    let u = 1.5, lines = [], uTo = 1, uFrom = 1, y0 = bot, y1 = band;
    for (; u >= 0.5; u -= 0.025) {
      const side = Math.min(1.12, Math.max(0.74, u * 0.95));              // to / from never outshout the message
      uTo = to ? fitOne(to, side, sx - 1.25 - x0) : 0; uFrom = from ? fitOne(from, side, maxW * 0.8) : 0;
      y0 = bot + (from ? uFrom * 0.96 : 0); y1 = band;
      font(u); lines = wrapLines(g, msg, maxW * ppu, 9);
      const widest = Math.max(0, ...lines.map((l) => g.measureText(l).width));
      if (lines.length * u * 1.04 <= y1 - y0 && widest <= maxW * ppu + 1 && !(lines.length === 9 && lines[8].endsWith('…'))) break;
    }
    if (to) put(to, x0, (top + band) / 2 - uTo * 0.3, uTo, INK.cranberry, 'left');
    if (from) put(from, x1, bot + uFrom * 0.22, uFrom, INK.cranberry, 'right');
    const lh = u * 1.04, yTop = (y0 + y1) / 2 + (lines.length * lh) / 2;
    lines.forEach((l, i) => put(l, (x0 + x1) / 2, yTop - i * lh - u * 0.76, u, INK.navy, 'center'));
    P.layout = { u, lines: lines.length, uTo, uFrom };
  });
  P.innerShade('#6a4a2a', { alpha: 0.16, blurPx: 14 });
  return P.layout;
}

/**
 * The cover sheet (the outside of the back wall): cover.png sits in the middle of a navy sheet of its own colour, with a
 * fine double border and a few cut-paper sparkles in the margins. Painted turned by 180 deg, so it reads upright when
 * the card lies closed with its fold away from the viewer.
 */
export function paintCover(P, img, W, H) {
  const navy = '#12233b';
  P.fill(navy);
  P.draw((g) => {
    g.translate(0, H / 2); g.rotate(Math.PI);                         // upright frame: origin at the centre, y toward the fold
    const ih = H * 1.04, iw = ih * img.width / img.height;
    drawImg(g, img, -iw / 2, -ih / 2, iw, ih);
    for (const s of [-1, 1]) {                                        // feather the picture's side edges into the sheet
      const gr = g.createLinearGradient(s * (iw / 2 - 0.3), 0, s * (iw / 2 + 0.02), 0);
      gr.addColorStop(0, 'rgba(18,35,59,0)'); gr.addColorStop(1, 'rgba(18,35,59,1)');
      g.fillStyle = gr; g.fillRect(Math.min(s * (iw / 2 - 0.3), s * (iw / 2 + 0.05)), -H / 2, 0.35, H);
    }
    // a fine double border, just outside the wreath's bow and ribbon tails
    g.strokeStyle = '#ecdcae'; g.lineJoin = 'round';
    g.lineWidth = 0.1; g.strokeRect(-W / 2 + 0.6, -H / 2 + 0.6, W - 1.2, H - 1.2);
    g.lineWidth = 0.04; g.strokeRect(-W / 2 + 0.84, -H / 2 + 0.84, W - 1.68, H - 1.68);
    g.fillStyle = '#ecdcae';
    for (const s of [-1, 1]) {
      for (const [x, y, r] of [[11.7, 4.6, 0.82], [10.3, -1.9, 0.44], [13.3, -5.4, 0.58], [12.9, 0.7, 0.3], [10.6, 7.2, 0.3], [11.4, -6.9, 0.26], [13.8, 6.6, 0.4]]) { sparkle(g, s * x, y, r); g.fill(); }
      for (const [x, y] of [[9.7, 2.4], [13.9, 3.1], [12.2, -3.6], [9.9, -5.0], [12.6, 8.2], [14.0, -1.6]]) { g.beginPath(); g.arc(s * x, y, 0.09, 0, 7); g.fill(); }
    }
  });
  P.innerShade('#050a16', { alpha: 0.35, blurPx: 22 });
}

/** A walnut table top, tileable: boards along x with long grain, a few joints. Returns a canvas. */
export function woodCanvas(S = 1024, boards = 5) {
  const c = document.createElement('canvas'); c.width = c.height = S;
  const g = c.getContext('2d'), r = P2.rng(41), bh = S / boards;
  for (let b = 0; b < boards; b++) {
    const y = b * bh, k = (r() - 0.5) * 0.16;
    g.save(); g.beginPath(); g.rect(0, y, S, bh); g.clip();
    g.fillStyle = P2.shade(P2.mix('#6b4530', '#7a5136', r()), k); g.fillRect(0, y, S, bh);
    for (let i = 0; i < 70; i++) {                                      // grain: long lines that wrap in x
      const yy = y + r() * bh, amp = 1 + r() * 5, f = 1 + Math.floor(r() * 2), ph = r() * 6.28, dark = r() < 0.7;
      g.strokeStyle = dark ? `rgba(38,20,10,${0.05 + r() * 0.13})` : `rgba(255,214,170,${0.03 + r() * 0.06})`; g.lineWidth = 0.6 + r() * 2.2;
      g.beginPath();
      for (let x = 0; x <= S; x += 8) { const a = (x / S) * Math.PI * 2; const py = yy + amp * Math.sin(a * f + ph) + amp * 0.35 * Math.sin(a * (f * 3 + 1) + ph * 2); g[x ? 'lineTo' : 'moveTo'](x, py); }
      g.stroke();
    }
    if (r() < 0.7) {                                                    // a knot
      const kx = r() * S, ky = y + bh * (0.3 + r() * 0.4);
      for (let i = 5; i > 0; i--) { g.strokeStyle = `rgba(34,17,8,${0.06 + 0.03 * (6 - i)})`; g.lineWidth = 1.4; g.beginPath(); g.ellipse(kx, ky, i * 7, i * 3.2, 0, 0, 7); g.stroke(); }
    }
    const jx = r() * S; g.fillStyle = 'rgba(20,10,5,0.6)'; g.fillRect(jx, y, 2.2, bh); g.fillStyle = 'rgba(255,220,180,0.07)'; g.fillRect(jx + 2.2, y, 1.4, bh);
    g.restore();
    g.fillStyle = 'rgba(16,8,4,0.75)'; g.fillRect(0, y, S, 2.6); g.fillStyle = 'rgba(255,220,180,0.08)'; g.fillRect(0, y + 2.6, S, 1.4);
  }
  return c;
}
