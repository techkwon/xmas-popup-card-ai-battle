// The message sign: a cream paper card with a scalloped top, a gold frame, holly at the corners, and the message
// written in a handwriting font ("To." top left, the message in the middle, "From." bottom right). Returns
// [outline, paint] for makeCard with .w / .h, standing on y = 0 and centred on x = 0.
import { wrapLines } from './message.js';

export function signPiece(MSG, { w = 12.6, h = 3.4, font = 'Nanum Pen Script', paper = ['#fbf4e4', '#efe3c8'], ink = '#2e2230', accent = '#7a2a22', frame = '#c99a3c', holly = true } = {}) {
  const top = []; for (let i = 0; i <= 40; i++) { const x = -w / 2 + w * i / 40; top.push([x, h - 0.12 * Math.abs(Math.sin(i / 40 * Math.PI * 8))]); }
  const outline = [[-w / 2, 0], [w / 2, 0], ...top.reverse()];
  const k = h / 3.4;                       // type sizes follow the sign's height
  const paint = (P) => {
    P.gradient(paper[0], paper[1], 0); P.felt(0.4);
    P.draw((g) => { g.strokeStyle = frame; g.lineWidth = 0.06; g.strokeRect(-w / 2 + 0.25, 0.25, w - 0.5, h - 0.6); });
    if (holly) {
      P.layer((g) => { for (const sx of [-1, 1]) for (const a of [0.4, 1.3, 2.1]) { g.beginPath(); g.ellipse(sx * (w / 2 - 0.55) + Math.cos(a) * 0.35 * -sx, h - 0.6 + Math.sin(a) * 0.2, 0.36, 0.15, a, 0, 7); g.fill(); } }, '#2f5a46', { lip: 0.7, depth: 0.5 });
      P.layer((g) => { for (const sx of [-1, 1]) for (const [dx, dy] of [[0, 0], [0.16, 0.1], [-0.06, 0.18]]) { g.beginPath(); g.arc(sx * (w / 2 - 0.55) + dx, h - 0.75 + dy, 0.11, 0, 7); g.fill(); } }, '#b23a32', { lip: 0.8, depth: 0.5 });
    }
    P.draw((g) => {
      g.save(); g.scale(0.01, -0.01); g.textBaseline = 'middle';
      g.fillStyle = accent; g.textAlign = 'left'; g.font = `${Math.round(62 * k)}px "${font}", cursive`; g.fillText(`To. ${MSG.to}`, (-w / 2 + 1.25) * 100, -(h - 0.72 * k) * 100);
      g.fillStyle = ink; g.textAlign = 'center';
      const maxW = (w - 2.0) * 100; let size = Math.round(74 * k); g.font = `${size}px "${font}", cursive`; while (size > 46 * k && wrapLines(g, MSG.msg, maxW, 99).length > 2) { size -= 3; g.font = `${size}px "${font}", cursive`; }   // shrink until it fits on two lines
      const lines = wrapLines(g, MSG.msg, maxW, 2);
      const cy = h * 0.47, lh = size * 0.0108; lines.forEach((l, i) => g.fillText(l, 0, -(cy + (lines.length - 1) * lh / 2 - i * lh) * 100));
      g.fillStyle = accent; g.textAlign = 'right'; g.font = `${Math.round(58 * k)}px "${font}", cursive`; g.fillText(`From. ${MSG.from}`, (w / 2 - 0.9) * 100, -0.62 * k * 100);
      g.restore();
    });
    P.innerShade('#3a2010', { alpha: 0.2, blurPx: 8 });
  };
  const piece = [outline, paint]; piece.w = w; piece.h = h; return piece;
}
