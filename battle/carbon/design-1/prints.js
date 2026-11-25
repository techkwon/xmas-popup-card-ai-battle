// design-1/prints.js
// Procedural layered-paper illustrations for Design 1: "별빛 산타 공방의 크리스마스 이브"
// Palette derived for warm Christmas Eve workshop: cranberry crimson, spruce moss, honey oak, antique gold, ivory cream.
import * as P2 from 'papercraft/lib/paperkit-2d.js';
import { wrapLines } from '../../kit/message.js';

const { shade, mix, rgba, fillLeaf, fillLimb, scallopTiles, roughen, draw2: D } = P2;

export const PAL = {
  crimson: '#9c2624',
  crimsonDark: '#6e1818',
  berry: '#c9382e',
  spruce: '#2e583d',
  spruceLight: '#497553',
  spruceDark: '#1d3c29',
  gold: '#e0a436',
  goldPale: '#f7df9c',
  oak: '#a86834',
  oakDark: '#6d3e1c',
  cream: '#f7efe0',
  parchment: '#f3e5cb',
  snow: '#eef2f7',
  snowShade: '#cbd6e6',
  skyTop: '#242947',
  skyMid: '#3c3354',
  windowGlow: '#ffd26e',
  ink: '#361e12',
};

function drawStar(g, cx, cy, rOut, rIn, points = 5, rot = -Math.PI / 2) {
  g.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? rOut : rIn;
    const a = rot + (i * Math.PI) / points;
    const x = cx + Math.cos(a) * r;
    const y = cy + Math.sin(a) * r;
    if (i === 0) g.moveTo(x, y); else g.lineTo(x, y);
  }
  g.closePath();
  g.fill();
}

function drawHollyCluster(g, cx, cy, size, rot = 0) {
  g.save();
  g.translate(cx, cy);
  g.rotate(rot);
  for (const ang of [-0.65, 0.65, 2.5]) {
    g.fillStyle = ang > 1 ? PAL.spruceDark : PAL.spruce;
    fillLeaf(g, 0, 0, size, ang, 0.34);
  }
  g.fillStyle = PAL.berry;
  for (const [bx, by] of [[0, 0], [size * 0.16, size * 0.12], [-size * 0.14, size * 0.14]]) {
    g.beginPath();
    g.arc(bx, by, size * 0.14, 0, Math.PI * 2);
    g.fill();
  }
  g.restore();
}

/** Warm walnut wooden tabletop canvas with planks, knots, and subtle grain. */
export function makeTableCanvas(W = 1024, H = 1024, seed = 19) {
  const r = P2.rng(seed);
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const g = c.getContext('2d');
  g.fillStyle = '#4a2e1d';
  g.fillRect(0, 0, W, H);
  const planks = 7, ph = H / planks;
  for (let p = 0; p < planks; p++) {
    const y0 = p * ph;
    const base = p % 2 === 0 ? '#543522' : '#492c1b';
    const gr = g.createLinearGradient(0, y0, 0, y0 + ph);
    gr.addColorStop(0, shade(base, 0.06));
    gr.addColorStop(0.5, base);
    gr.addColorStop(1, shade(base, -0.08));
    g.fillStyle = gr;
    g.fillRect(0, y0, W, ph);
    // woodgrain ribbons
    for (let i = 0; i < 28; i++) {
      const yy = y0 + (i + 0.5) * (ph / 28);
      g.strokeStyle = i % 3 === 0 ? 'rgba(32,16,8,0.22)' : 'rgba(120,80,48,0.14)';
      g.lineWidth = 1.2 + r() * 2.2;
      g.beginPath();
      const phs = r() * 6.28;
      for (let x = 0; x <= W; x += 24) {
        const wy = yy + Math.sin(x * 0.012 + phs) * 4 + Math.sin(x * 0.037 + i) * 1.8;
        if (x === 0) g.moveTo(x, wy); else g.lineTo(x, wy);
      }
      g.stroke();
    }
    // plank seam
    g.fillStyle = 'rgba(24,11,5,0.55)';
    g.fillRect(0, y0, W, 2.5);
  }
  return c;
}

/** Outer front cover of the closed 90° greeting card (printed rotated 180° in back-print space so it reads upright when closed!). */
export function paintOuterCover(W, D) {
  return (P) => {
    const { g } = P;
    P.fill(PAL.crimson);
    P.felt(0.75);
    g.save();
    // Remember: on makeCard's back face, printCard mirrors X, and folding down by +90° inverts X & Y:
    // specifically, x_back = -x_world and y_back = y_local (0 at spine = top of screen, D at fore-edge = bottom of screen).
    // Wait: let's check! In makeCard:
    // backPrint calls printCard(pts.map(([x,y]) => [-x, y]), paint: backPaint) and faceMat(backPrint, flip=true).
    // With flip=true: vertex at x_local (-W/2 left .. +W/2 right) samples x_backPrint = -x_local!
    // Wait: let's check! front.box has x0 = -W/2, x1 = +W/2.
    // faceMat(flip=true): repeat.x = -1/W, offset.x = (W/2)/W = 0.5 -> u(x_local) = 0.5 - x_local/W.
    // In backPrint, canvas u=0 is x=-W/2, u=1 is x=+W/2 -> x_drawn = -W/2 + u*W = -x_local!
    // When coverPivot has rotation.x = +PI/2 (closed):
    //   world X = +x_local (left is -W/2, right is +W/2) -> so x_drawn = -worldX! (mirrored!)
    //   world Z = zSpine + y_local (spine at top of screen has y_local=0; fore-edge at bottom of screen has y_local=D)!
    //   In printCard, +y_drawn is UP (toward y_local=D = bottom of screen!).
    // Therefore: x_drawn = -worldX, y_drawn increases toward BOTTOM of screen!
    // So g.translate(0, D); g.scale(-1, -1); makes +X go RIGHT on screen and +Y go UP on screen!!
    g.translate(0, D);
    g.scale(-1, -1);

    // Rich crimson radial vignette
    const bg = g.createRadialGradient(0, D * 0.5, 1, 0, D * 0.5, W * 0.65);
    bg.addColorStop(0, '#b3302c');
    bg.addColorStop(1, '#701818');
    g.fillStyle = bg;
    g.fillRect(-W / 2, 0, W, D);

    // Subtle damask snowflakes/dots
    g.fillStyle = 'rgba(247, 223, 156, 0.14)';
    const rr = P2.rng(44);
    for (let i = 0; i < 48; i++) {
      const sx = (rr() - 0.5) * (W - 3.2);
      const sy = 1.6 + rr() * (D - 3.2);
      drawStar(g, sx, sy, 0.16 + rr() * 0.14, 0.06, 6, rr());
    }

    // Double gold foil border
    g.strokeStyle = PAL.gold;
    g.lineWidth = 0.22;
    g.strokeRect(-W / 2 + 1.0, 1.0, W - 2.0, D - 2.0);
    g.strokeStyle = PAL.goldPale;
    g.lineWidth = 0.08;
    g.setLineDash([0.35, 0.22]);
    g.strokeRect(-W / 2 + 1.48, 1.48, W - 2.96, D - 2.96);
    g.setLineDash([]);

    // Corner holly clusters
    for (const [cx, cy, rot] of [
      [-W / 2 + 2.2, 2.2, 0.6],
      [W / 2 - 2.2, 2.2, -0.6],
      [-W / 2 + 2.2, D - 2.2, 2.4],
      [W / 2 - 2.2, D - 2.2, -2.4],
    ]) {
      drawHollyCluster(g, cx, cy, 1.35, rot);
    }

    // Central cream scalloped medallion
    const cy = D * 0.52;
    g.fillStyle = 'rgba(42, 12, 8, 0.32)';
    g.beginPath();
    g.arc(0.18, cy - 0.18, 5.55, 0, Math.PI * 2);
    g.fill();

    g.fillStyle = PAL.gold;
    drawStar(g, 0, cy, 5.65, 5.25, 24, 0);
    g.fillStyle = PAL.cream;
    g.beginPath();
    g.arc(0, cy, 5.05, 0, Math.PI * 2);
    g.fill();

    // Evergreen wreath inside medallion
    const wr = 3.92;
    for (let i = 0; i < 28; i++) {
      const a = (i / 28) * Math.PI * 2;
      const wx = Math.cos(a) * wr, wy = cy + Math.sin(a) * wr;
      g.fillStyle = i % 2 === 0 ? PAL.spruce : PAL.spruceLight;
      fillLeaf(g, wx, wy, 1.3, a + Math.PI * 0.58, 0.31);
      fillLeaf(g, wx, wy, 1.05, a + Math.PI * 0.35, 0.27);
    }
    // Red berries & gold baubles on wreath
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2 + 0.2;
      g.fillStyle = i % 3 === 0 ? PAL.gold : PAL.berry;
      g.beginPath();
      g.arc(Math.cos(a) * wr, cy + Math.sin(a) * wr, i % 3 === 0 ? 0.23 : 0.17, 0, Math.PI * 2);
      g.fill();
    }
    // Big red bow at bottom of wreath
    g.fillStyle = PAL.berry;
    fillLeaf(g, -0.1, cy - wr + 0.1, 1.65, Math.PI * 1.15, 0.42);
    fillLeaf(g, 0.1, cy - wr + 0.1, 1.65, -Math.PI * 0.15, 0.42);
    fillLeaf(g, -0.15, cy - wr - 0.1, 1.45, -Math.PI * 0.68, 0.24);
    fillLeaf(g, 0.15, cy - wr - 0.1, 1.45, -Math.PI * 0.32, 0.24);
    g.fillStyle = PAL.gold;
    g.beginPath();
    g.arc(0, cy - wr + 0.1, 0.32, 0, Math.PI * 2);
    g.fill();

    // Top star inside wreath
    g.fillStyle = PAL.gold;
    drawStar(g, 0, cy + 1.95, 0.72, 0.31, 5);

    // Cover calligraphy (comfortably inside the cream center of the wreath!)
    g.save();
    g.translate(0, cy - 0.12);
    g.scale(1, -1);
    g.fillStyle = PAL.crimsonDark;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.font = '700 1.04px "Nanum Pen Script", Georgia, serif';
    g.fillText('Merry Christmas', 0, -0.4);
    g.fillStyle = PAL.spruceDark;
    g.font = '0.77px "Nanum Pen Script", sans-serif';
    g.fillText('별빛 산타 공방의 성탄절', 0, 0.62);
    g.restore();

    g.restore();
  };
}

/** Inside Back Wall of the 90° greeting card (with arched window hole for Celestial Volvelle). */
export function paintInsideBackWall(W, dep, holeCenter = [-4.2, 10.2], holeR = 2.5) {
  return (P) => {
    const { r } = P;
    // Cream outer card margin, deep starry twilight sky inset
    P.fill(PAL.cream);
    P.felt(0.55);

    const pad = 0.85;
    P.draw((g) => {
      g.save();
      g.beginPath();
      g.rect(-W / 2 + pad, pad, W - pad * 2, dep - pad * 2);
      g.clip();

      const gr = g.createLinearGradient(0, dep - pad, 0, pad);
      gr.addColorStop(0, '#192240');
      gr.addColorStop(0.55, '#2e2b52');
      gr.addColorStop(1, '#584162');
      g.fillStyle = gr;
      g.fillRect(-W / 2 + pad, pad, W - pad * 2, dep - pad * 2);

      // Soft warm aurora glow behind workshop
      const aur = g.createRadialGradient(2.2, 8.2, 0.5, 2.2, 8.2, 10.5);
      aur.addColorStop(0, 'rgba(255, 214, 130, 0.28)');
      aur.addColorStop(0.6, 'rgba(220, 120, 95, 0.12)');
      aur.addColorStop(1, 'rgba(30, 36, 66, 0)');
      g.fillStyle = aur;
      g.fillRect(-W / 2, 0, W, dep);

      for (let i = 0; i < 70; i++) {
        const sx = -W / 2 + 1.5 + r() * (W - 3);
        const sy = 4.6 + r() * (dep - 5.8);
        if (Math.hypot(sx - holeCenter[0], sy - holeCenter[1]) < holeR + 0.7) continue;
        g.fillStyle = i % 5 === 0 ? PAL.goldPale : '#fff8e8';
        if (i % 6 === 0) drawStar(g, sx, sy, 0.22 + r() * 0.12, 0.08, 4, 0);
        else {
          g.beginPath();
          g.arc(sx, sy, 0.06 + r() * 0.07, 0, Math.PI * 2);
          g.fill();
        }
      }
      g.restore();
    });

    // Gold decorative bezel around the Celestial Volvelle cutout hole
    P.layer((g) => {
      const [hx, hy] = holeCenter;
      g.fillStyle = PAL.gold;
      g.beginPath();
      g.arc(hx, hy, holeR + 0.48, 0, Math.PI * 2);
      g.fill();
    }, PAL.gold, { rim: 0.6, lip: 0.9, depth: 0.9 });

    // Distant snowy pine hills layered along bottom of back wall
    P.layer((g) => {
      g.fillStyle = '#536884';
      g.beginPath();
      g.moveTo(-W / 2 + pad, 0.8);
      for (let x = -W / 2 + pad; x <= W / 2 - pad + 0.1; x += 0.6) {
        const y = 4.6 + Math.sin(x * 0.28 + 0.6) * 1.15 + Math.cos(x * 0.65) * 0.45;
        g.lineTo(x, y);
      }
      g.lineTo(W / 2 - pad, 0.8);
      g.closePath();
      g.fill();
    }, '#536884', { rim: 0.7, lip: 0.7, depth: 0.8 });

    P.layer((g) => {
      g.fillStyle = '#dce6f2';
      g.beginPath();
      g.moveTo(-W / 2 + pad, 0.6);
      for (let x = -W / 2 + pad; x <= W / 2 - pad + 0.1; x += 0.5) {
        const y = 3.0 + Math.cos(x * 0.32 - 0.5) * 0.85 + Math.sin(x * 0.8) * 0.28;
        g.lineTo(x, y);
      }
      g.lineTo(W / 2 - pad, 0.6);
      g.closePath();
      g.fill();
    }, '#dce6f2', { rim: 0.6, lip: 0.8, depth: 0.8 });

    // Festive crimson & holly corner swags at top of back wall
    P.layer((g) => {
      for (const sd of [-1, 1]) {
        g.fillStyle = PAL.spruce;
        for (let k = 0; k < 6; k++) {
          const x = sd * (W / 2 - 1.4 - k * 1.15);
          const y = dep - 1.15 - Math.sin((k / 5) * Math.PI) * 0.65;
          fillLeaf(g, x, y, 1.35, -Math.PI / 2 + sd * 0.55, 0.3);
        }
      }
    }, PAL.spruce, { lip: 0.8, depth: 0.8 });

    P.layer((g) => {
      for (const sd of [-1, 1]) {
        g.fillStyle = PAL.berry;
        for (let k = 0; k < 4; k++) {
          const x = sd * (W / 2 - 1.8 - k * 1.45);
          const y = dep - 1.3 - Math.sin((k / 3) * Math.PI) * 0.55;
          g.beginPath();
          g.arc(x, y, 0.2, 0, Math.PI * 2);
          g.fill();
        }
      }
    }, PAL.berry, { lip: 0.8, depth: 0.6 });

    // Gold stitched border frame
    P.draw((g) => {
      g.strokeStyle = PAL.gold;
      g.lineWidth = 0.14;
      g.strokeRect(-W / 2 + pad, pad, W - pad * 2, dep - pad * 2);
    });
  };
}

/** Inside Base Page (horizontal stage floor of the 90° greeting card).
 *  Note: y = 0 is the front edge near the viewer; y = dep is the spine at the back! */
export function paintInsideBasePage(W, dep) {
  return (P) => {
    const { r } = P;
    P.fill(PAL.cream);
    P.felt(0.65);

    const pad = 0.85;
    // Pale winter snowfield inset
    P.draw((g) => {
      const gr = g.createLinearGradient(0, dep - pad, 0, pad);
      gr.addColorStop(0, '#c8d6ea');
      gr.addColorStop(0.55, '#dde7f3');
      gr.addColorStop(1, '#edf3fa');
      g.fillStyle = gr;
      g.fillRect(-W / 2 + pad, pad, W - pad * 2, dep - pad * 2);
    });

    // Soft snowdrift patches with torn-like scalloped contours
    P.layer((g) => {
      g.fillStyle = '#f8fbff';
      D.ell(g, -6.5, dep - 6.5, 5.2, 2.8, 0.12);
      D.ell(g, 6.2, dep - 6.0, 5.4, 2.6, -0.15);
      D.ell(g, -5.8, 4.2, 5.5, 2.4, -0.08);
    }, '#f8fbff', { rim: 0.6, lip: 0.7, depth: 0.6 });

    // Curving warm cobblestone courtyard lane from workshop (-5.2, y = dep-3.8) to message stand (+5.2, y = dep-10.6) & front
    P.layer((g) => {
      g.fillStyle = '#d4b894';
      g.beginPath();
      const ctrl = [
        [-5.2, dep - 3.2],
        [-3.6, dep - 6.2],
        [0.4, dep - 8.5],
        [4.2, dep - 11.2],
        [2.2, 1.3],
      ];
      const line = P2.pathLine(ctrl, { step: 0.35 }).pts;
      const L = [], R = [];
      line.forEach(([x, y], i) => {
        const [ax, ay] = line[Math.max(0, i - 1)], [bx, by] = line[Math.min(line.length - 1, i + 1)];
        const tx = bx - ax, ty = by - ay, len = Math.hypot(tx, ty) || 1;
        const hw = 1.45 + 0.35 * (i / line.length) + Math.sin(i * 0.7) * 0.08;
        L.push([x - (ty / len) * hw, y + (tx / len) * hw]);
        R.push([x + (ty / len) * hw, y - (tx / len) * hw]);
      });
      const poly = [...L, ...R.reverse()];
      poly.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
      g.closePath();
      g.fill();
    }, '#d4b894', { rim: 0.9, lip: 0.7, rimColor: '#fff9ec', depth: 0.75 });

    // Cobblestones & warm golden lantern spill on the courtyard
    P.draw((g) => {
      for (const [gx, gy, rad] of [[-5.0, dep - 4.8, 3.6], [0.2, dep - 6.8, 3.2], [5.2, dep - 11.0, 3.0]]) {
        const wg = g.createRadialGradient(gx, gy, 0.2, gx, gy, rad);
        wg.addColorStop(0, 'rgba(255, 206, 108, 0.42)');
        wg.addColorStop(1, 'rgba(255, 206, 108, 0)');
        g.fillStyle = wg;
        g.beginPath();
        g.arc(gx, gy, rad, 0, Math.PI * 2);
        g.fill();
      }
      // Little stones along lane
      for (let i = 0; i < 36; i++) {
        const t = i / 36;
        const lx = -4.8 + t * 8.2 + Math.sin(t * 5.2) * 1.4 + (r() - 0.5) * 1.6;
        const ly = (dep - 3.8) * (1 - t) + 1.8 * t + (r() - 0.5) * 0.8;
        g.fillStyle = i % 2 ? 'rgba(138, 96, 62, 0.38)' : 'rgba(255, 246, 228, 0.55)';
        D.ell(g, lx, ly, 0.26 + r() * 0.14, 0.16 + r() * 0.08, (r() - 0.5) * 0.6);
      }

      // Authentic score-lines & kraft glue tabs where pop-ups attach!
      for (const [hx, hy, hw] of [
        [-5.2, dep - 3.8, 7.6],
        [3.6, dep - 2.8, 8.6],
        [0.2, dep - 6.4, 4.4],
        [-3.8, dep - 8.0, 9.6],
        [5.4, dep - 10.6, 8.6],
        [-5.8, dep - 11.0, 6.2],
      ]) {
        g.fillStyle = 'rgba(214, 186, 145, 0.55)';
        D.rect(g, hx - hw / 2, hy - 0.18, hw, 0.36, 0.08);
        g.strokeStyle = 'rgba(120, 88, 56, 0.35)';
        g.lineWidth = 0.05;
        g.setLineDash([0.22, 0.16]);
        g.beginPath();
        g.moveTo(hx - hw / 2, hy);
        g.lineTo(hx + hw / 2, hy);
        g.stroke();
        g.setLineDash([]);
      }

      // Gold stitched border + corner holly
      g.strokeStyle = PAL.gold;
      g.lineWidth = 0.14;
      g.strokeRect(-W / 2 + pad, pad, W - pad * 2, dep - pad * 2);
      drawHollyCluster(g, -W / 2 + 1.6, 1.6, 0.95, 0.5);
      drawHollyCluster(g, W / 2 - 1.6, 1.6, 0.95, -0.5);
    });
  };
}

/** Mechanism #1: Rotating Celestial Volvelle Disc behind the arched back-wall cutout. */
export function buildCelestialVolvelle(rad = 3.2) {
  const pts = P2.shape.radial(P2.rng(12), { cx: 0, cy: 0, rx: rad, ry: rad, lobes: 16, depth: 0.06, wobble: 0.01 });
  const paint = (P) => {
    P.fill('#1a2346');
    P.felt(0.6);
    P.layer((g) => {
      g.fillStyle = PAL.gold;
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        const rMid = rad * 0.62;
        if (i % 3 === 0) {
          // Crescent moon / big star alternating
          drawStar(g, Math.cos(a) * rMid, Math.sin(a) * rMid, 0.55, 0.22, 5, a);
        } else {
          drawStar(g, Math.cos(a) * rMid, Math.sin(a) * rMid, 0.3, 0.12, 4, a);
        }
      }
      // Inner compass starburst
      drawStar(g, 0, 0, 1.05, 0.42, 8, 0);
    }, PAL.gold, { lip: 0.9, depth: 0.8 });

    P.draw((g) => {
      g.strokeStyle = rgba(PAL.goldPale, 0.65);
      g.lineWidth = 0.07;
      g.setLineDash([0.2, 0.16]);
      g.beginPath();
      g.arc(0, 0, rad * 0.62, 0, Math.PI * 2);
      g.stroke();
      g.setLineDash([]);
    });
    P.glow((gc) => {
      for (let i = 0; i < 12; i += 3) {
        const a = (i / 12) * Math.PI * 2;
        drawStar(gc, Math.cos(a) * rad * 0.62, Math.sin(a) * rad * 0.62, 0.48, 0.2, 5, a);
      }
    });
  };
  return [pts, paint];
}

/** Santa's Toy Workshop & Clocktower Facade (rich multi-layer collage + glowing windows). */
export function buildWorkshopFacade() {
  const W = 8.4, H = 11.2;
  const pts = P2.fromDrawing((g) => {
    // Main workshop body + steep gable + right clocktower spire + left chimney
    D.rect(g, -4.0, 0, 8.0, 5.4);
    D.poly(g, [[-4.35, 5.1], [2.2, 5.1], [-1.05, 9.2]]);
    // Clocktower on right
    D.rect(g, 1.1, 0, 2.7, 7.6);
    D.poly(g, [[0.85, 7.3], [4.05, 7.3], [2.45, 11.0]]);
    // Chimney on left slope
    D.rect(g, -3.45, 6.2, 1.05, 3.1);
    D.rect(g, -3.6, 9.0, 1.35, 0.42);
  }, { w: W + 0.8, h: H + 0.6, name: 'workshop' });

  const paint = (P) => {
    P.gradient('#a92f29', '#7f1d1b', 0.4);
    P.felt(0.85);

    // Stone plinth & timber framing
    P.layer((g) => {
      g.fillStyle = '#8b7b6e';
      D.rect(g, -4.05, 0, 8.1, 1.15);
      g.fillStyle = PAL.oakDark;
      D.rect(g, -4.0, 1.1, 8.0, 0.25);
      for (const tx of [-3.85, -1.1, 1.15, 3.65]) D.rect(g, tx, 1.1, 0.26, 6.2);
      D.rect(g, 1.1, 5.1, 2.75, 0.26);
    }, PAL.oakDark, { lip: 0.7, depth: 0.8 });

    // Cream plaster upper clocktower panel
    P.layer((g) => {
      g.fillStyle = PAL.cream;
      D.rect(g, 1.38, 4.3, 2.14, 2.85, 0.12);
    }, PAL.cream, { rim: 0.7, lip: 0.8, depth: 0.75 });

    // Chimney bricks + snow cap
    P.layer((g) => {
      g.fillStyle = '#8f3828';
      D.rect(g, -3.45, 6.4, 1.05, 2.7);
      g.fillStyle = PAL.snow;
      D.rect(g, -3.62, 8.95, 1.38, 0.46, 0.16);
    }, PAL.snow, { lip: 0.9, depth: 0.8 });

    // Scalloped shingle roofs + thick snow eaves
    scallopTiles(P, { x0: -4.2, x1: 1.9, y0: 5.2, y1: 8.8 }, { color: PAL.spruceDark, rows: 5 });
    scallopTiles(P, { x0: 0.95, x1: 3.95, y0: 7.35, y1: 10.8 }, { color: PAL.oakDark, rows: 5 });

    P.layer((g) => {
      g.fillStyle = PAL.snow;
      // Left roof snow ridge
      g.beginPath();
      g.moveTo(-4.35, 5.15);
      g.lineTo(-1.05, 9.2);
      g.lineTo(2.05, 5.15);
      g.lineTo(1.55, 4.88);
      g.lineTo(-1.05, 8.45);
      g.lineTo(-3.95, 4.88);
      g.closePath();
      g.fill();
      // Tower roof snow cap
      g.beginPath();
      g.moveTo(0.85, 7.35);
      g.lineTo(2.45, 11.0);
      g.lineTo(4.05, 7.35);
      g.lineTo(3.6, 7.12);
      g.lineTo(2.45, 10.15);
      g.lineTo(1.3, 7.12);
      g.closePath();
      g.fill();
    }, PAL.snow, { rim: 0.7, lip: 0.9, depth: 0.9 });

    // Arched Spruce Door + Toyshop Bay Window
    P.layer((g) => {
      // Door frame
      g.fillStyle = PAL.cream;
      g.beginPath();
      g.moveTo(-3.35, 0);
      g.lineTo(-3.35, 2.5);
      g.arc(-2.5, 2.5, 0.85, Math.PI, 0, true);
      g.lineTo(-1.65, 0);
      g.closePath();
      g.fill();
      // Toyshop bay window frame
      D.rect(g, -1.05, 1.55, 2.05, 2.15, 0.14);
      // Tower lower window frame
      D.rect(g, 1.72, 1.75, 1.45, 1.75, 0.14);
    }, PAL.cream, { lip: 0.85, depth: 0.8 });

    P.layer((g) => {
      g.fillStyle = PAL.spruce;
      g.beginPath();
      g.moveTo(-3.18, 0);
      g.lineTo(-3.18, 2.45);
      g.arc(-2.5, 2.45, 0.68, Math.PI, 0, true);
      g.lineTo(-1.82, 0);
      g.closePath();
      g.fill();
      // Shutters
      D.rect(g, -1.42, 1.6, 0.34, 2.05, 0.06);
      D.rect(g, 1.04, 1.6, 0.34, 2.05, 0.06);
    }, PAL.spruce, { lip: 0.7, depth: 0.7 });

    // Warm lit window panes + sign ("TOYS / 산타 공방")
    P.draw((g) => {
      for (const [wx, wy, ww, wh] of [[-0.88, 1.72, 1.7, 1.8], [1.88, 1.92, 1.12, 1.42]]) {
        const gr = g.createRadialGradient(wx + ww / 2, wy + wh / 2, 0.1, wx + ww / 2, wy + wh / 2, ww * 0.8);
        gr.addColorStop(0, '#fff7cf');
        gr.addColorStop(1, PAL.windowGlow);
        g.fillStyle = gr;
        g.fillRect(wx, wy, ww, wh);
        // Mullions
        g.fillStyle = PAL.oakDark;
        g.fillRect(wx + ww / 2 - 0.05, wy, 0.1, wh);
        g.fillRect(wx, wy + wh / 2 - 0.05, ww, 0.1);
      }
      // Door wreath & brass knob
      g.fillStyle = PAL.gold;
      g.beginPath();
      g.arc(-2.02, 1.35, 0.1, 0, Math.PI * 2);
      g.fill();
      drawHollyCluster(g, -2.5, 2.35, 0.52, 0);

      // Workshop wooden signboard
      g.fillStyle = PAL.oak;
      D.rect(g, -2.55, 4.0, 3.05, 0.78, 0.14);
      g.strokeStyle = PAL.goldPale;
      g.lineWidth = 0.06;
      g.strokeRect(-2.45, 4.08, 2.85, 0.62);
      g.save();
      g.translate(-1.02, 4.38);
      g.scale(1, -1);
      g.fillStyle = '#fff8e6';
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.font = '700 0.56px "Nanum Pen Script", sans-serif';
      g.fillText('산타 장난감 공방', 0, 0);
      g.restore();
    });

    P.glow((gc) => {
      gc.fillRect(-0.88, 1.72, 1.7, 1.8);
      gc.fillRect(1.88, 1.92, 1.12, 1.42);
    });
    P.innerShade('#2e130b', { alpha: 0.28, blurPx: 10 });
  };

  return { pts, paint, chimney: [-2.92, 9.35], pin: [2.45, 5.75] };
}

/** Mechanism #3: Peppermint & Gold Windwheel Spinner on Workshop Clocktower (mounted on a visible brass brad). */
export function buildClockworkWheel(rad = 1.18) {
  const pts = P2.shape.radial(P2.rng(31), { cx: 0, cy: 0, rx: rad, ry: rad, lobes: 8, depth: 0.22, wobble: 0.02 });
  const paint = (P) => {
    P.fill(PAL.cream);
    P.felt(0.5);
    P.layer((g) => {
      for (let i = 0; i < 8; i++) {
        const a0 = (i / 8) * Math.PI * 2;
        const a1 = a0 + Math.PI / 8;
        g.fillStyle = i % 2 === 0 ? PAL.berry : PAL.gold;
        g.beginPath();
        g.moveTo(0, 0);
        g.arc(0, 0, rad * 0.92, a0, a1);
        g.closePath();
        g.fill();
      }
    }, PAL.berry, { lip: 0.7, depth: 0.65 });
    // Brass paper brad in center
    P.layer((g) => {
      g.fillStyle = PAL.gold;
      g.beginPath();
      g.arc(0, 0, 0.28, 0, Math.PI * 2);
      g.fill();
    }, PAL.gold, { rim: 0.5, lip: 0.9, depth: 0.7 });
  };
  return [pts, paint];
}

/** Sky Cloud-and-Pine Arch with REAL curved cut-through slot (`holes`) for Santa's Sleigh! */
export function buildSleighSkyArch() {
  const W = 10.2, H = 9.8;
  const pts = P2.fromDrawing((g) => {
    D.rect(g, -W / 2, 0, W, 3.6);
    D.ell(g, -2.9, 4.6, 2.3, 2.2);
    D.ell(g, 0, 6.4, 4.3, 3.1);
    D.ell(g, 3.0, 4.7, 2.2, 2.1);
  }, { w: W + 1.8, h: H + 1.4, name: 'skyArch' });

  // Curved slot outline (clockwise/counter-clockwise closed ribbon) centered around (0, 2.2) with radius R = 5.4
  const R = 5.4, cy = 2.0, halfW = 0.26;
  const slot = [];
  for (let i = 0; i <= 24; i++) {
    const a = Math.PI * 0.26 + (Math.PI * 0.48 * i) / 24;
    slot.push([Math.cos(a) * (R + halfW), cy + Math.sin(a) * (R + halfW)]);
  }
  for (let i = 24; i >= 0; i--) {
    const a = Math.PI * 0.26 + (Math.PI * 0.48 * i) / 24;
    slot.push([Math.cos(a) * (R - halfW), cy + Math.sin(a) * (R - halfW)]);
  }

  const paint = (P) => {
    P.gradient('#394b70', '#24314f', 0);
    P.felt(0.75);
    // Moonlit cloud bank at top + snowy spruce ridge below slot
    P.layer((g) => {
      g.fillStyle = '#e7edf6';
      D.ell(g, -2.8, 3.5, 2.9, 1.5);
      D.ell(g, 0.4, 3.9, 3.2, 1.7);
      D.ell(g, 3.2, 3.4, 2.7, 1.45);
      D.rect(g, -W / 2, 0, W, 3.2);
    }, '#e7edf6', { rim: 0.7, lip: 0.85, depth: 0.85 });

    // Little spruce tree silhouettes along bottom
    P.layer((g) => {
      g.fillStyle = PAL.spruce;
      for (const [tx, th] of [[-4.1, 3.2], [-2.2, 2.8], [0.2, 3.4], [2.4, 2.9], [4.2, 3.3]]) {
        D.poly(g, [[tx - 0.85, 0.4], [tx + 0.85, 0.4], [tx, th]]);
        D.poly(g, [[tx - 0.68, 1.2], [tx + 0.68, 1.2], [tx, th + 0.55]]);
      }
    }, PAL.spruce, { lip: 0.75, depth: 0.7 });

    // Tiny golden stars near top of arch
    P.draw((g) => {
      g.fillStyle = PAL.goldPale;
      for (const [sx, sy] of [[-2.4, 8.2], [0.1, 9.1], [2.5, 8.3], [-3.8, 6.2], [3.8, 6.3]]) {
        drawStar(g, sx, sy, 0.24, 0.09, 4, 0);
      }
    });
    P.innerShade('#182038', { alpha: 0.25, blurPx: 10 });
  };

  return { pts, slot, paint, pivotY: cy, radius: R };
}

/** Mechanism #2: Cut-paper Santa's Sleigh & Two Reindeer riding the curved sky slot! */
export function buildSantaSleighPiece() {
  return P2.drawnPiece((g, ink) => {
    // Connecting paper ribbon bar behind/under sleigh + two reindeer
    g.fillStyle = ink(PAL.gold);
    D.rect(g, -2.15, 0.32, 4.3, 0.22, 0.08);
    // Sleigh runners
    D.rect(g, -2.35, 0.06, 1.95, 0.16, 0.06);
    D.ell(g, -0.35, 0.28, 0.22, 0.22);

    // Sleigh crimson body
    g.fillStyle = ink(PAL.crimson);
    D.poly(g, [[-2.3, 0.2], [-0.55, 0.2], [-0.35, 0.95], [-1.35, 0.85], [-2.35, 1.25]]);

    // Toy sack & Santa
    g.fillStyle = ink(PAL.oak);
    D.ell(g, -1.9, 1.25, 0.42, 0.38);
    g.fillStyle = ink(PAL.berry);
    D.ell(g, -1.18, 1.18, 0.38, 0.42);
    // Santa beard & face & hat
    g.fillStyle = ink('#fde5cf');
    D.ell(g, -1.08, 1.58, 0.24, 0.22);
    g.fillStyle = ink('#ffffff');
    D.ell(g, -0.98, 1.44, 0.22, 0.18);
    D.ell(g, -1.35, 1.86, 0.13, 0.13);
    g.fillStyle = ink(PAL.berry);
    D.poly(g, [[-1.3, 1.66], [-0.9, 1.68], [-1.32, 1.92]]);

    // Two leaping reindeer!
    for (const ox of [0.35, 1.55]) {
      g.fillStyle = ink(PAL.oak);
      D.ell(g, ox, 0.72, 0.52, 0.28, 0.12); // body
      D.rect(g, ox + 0.22, 0.75, 0.24, 0.48, 0.08); // neck
      D.ell(g, ox + 0.42, 1.22, 0.26, 0.17, -0.1); // head
      // Legs
      D.rect(g, ox - 0.42, 0.24, 0.16, 0.45, 0.06);
      D.rect(g, ox + 0.2, 0.24, 0.16, 0.45, 0.06);
      // Antlers
      g.fillStyle = ink(PAL.cream);
      D.rect(g, ox + 0.32, 1.32, 0.12, 0.34, 0.04);
      D.rect(g, ox + 0.24, 1.5, 0.28, 0.1, 0.04);
      // Red collar & Rudolph nose on lead deer
      g.fillStyle = ink(PAL.berry, 'print');
      D.rect(g, ox + 0.2, 0.82, 0.26, 0.1);
      if (ox > 1) D.ell(g, ox + 0.66, 1.22, 0.09, 0.09);
    }
  }, { w: 5.4, h: 2.3, name: 'santaSleigh' });
}

/** Grand Decorated Christmas Spruce Tree (for crossCard / hero centrepiece). */
export function buildGrandXmasTree(W = 5.4, H = 8.8, seed = 7) {
  const r = P2.rng(seed);
  const tiers = 5, trunkW = 0.76, trunkH = 0.85;
  const tierH = (H - trunkH - 0.7) / tiers;
  const right = [[trunkW / 2, 0], [trunkW / 2, trunkH]];
  for (let i = 0; i < tiers; i++) {
    const hw = (W / 2) * (1 - (i / tiers) * 0.68);
    const yb = trunkH + i * tierH * 0.88;
    right.push([hw, yb]);
    if (i < tiers - 1) right.push([hw * 0.56, yb + tierH * 0.92]);
  }
  // Star top
  const starY = H - 0.55;
  right.push([0.32, starY - 0.32], [0.72, starY - 0.1], [0.36, starY + 0.18], [0, H]);
  const left = right.slice(0, -1).reverse().map(([x, y]) => [-x, y]);
  const pts = roughen([...right, ...left], r, { amp: 0.012, step: 0.08 }).map(([x, y]) => [x, y < 0.03 ? 0 : y]);

  const paint = (P) => {
    const { r: pr } = P;
    P.fill(PAL.spruceDark);
    P.felt(0.85);
    // Trunk
    P.layer((g) => {
      g.fillStyle = PAL.oakDark;
      D.rect(g, -trunkW * 0.55, 0, trunkW * 1.1, trunkH + 0.4);
    }, PAL.oakDark, { lip: 0.7, depth: 0.8 });

    // 5 scalloped tiers with snow fringes
    for (let i = 0; i < tiers; i++) {
      const hw = (W / 2) * (1 - (i / tiers) * 0.68) * 1.04;
      const yb = trunkH + i * tierH * 0.88;
      const yt = yb + tierH * 1.25;
      const col = i % 2 === 0 ? PAL.spruce : PAL.spruceLight;
      P.layer((g) => {
        g.fillStyle = col;
        g.beginPath();
        g.moveTo(-hw, yb + 0.18);
        const n = 5 - Math.floor(i / 2), sw = (hw * 2) / n;
        for (let k = 0; k < n; k++) {
          const x0 = -hw + k * sw;
          g.quadraticCurveTo(x0 + sw * 0.5, yb - 0.22, x0 + sw, yb + 0.18);
        }
        g.lineTo(0, yt);
        g.closePath();
        g.fill();
      }, col, { rim: 0.85, lip: 0.8, depth: 0.9 });

      // Snow tips & gold garland arc per tier
      P.layer((g) => {
        g.strokeStyle = PAL.goldPale;
        g.lineWidth = 0.11;
        g.beginPath();
        g.moveTo(-hw * 0.78, yb + 0.48);
        g.quadraticCurveTo(0, yb + 0.08, hw * 0.78, yb + 0.48);
        g.stroke();
        // Ornaments
        for (let k = 0; k < 4 - Math.floor(i / 2); k++) {
          const u = (k + 0.5) / (4 - Math.floor(i / 2)) - 0.5;
          const ox = u * hw * 1.35, oy = yb + 0.35 + pr() * 0.35;
          g.fillStyle = (i + k) % 2 === 0 ? PAL.berry : PAL.gold;
          g.beginPath();
          g.arc(ox, oy, 0.21, 0, Math.PI * 2);
          g.fill();
        }
      }, PAL.berry, { lip: 0.85, depth: 0.7 });
    }

    // Glowing Star Topper + Candle lights
    P.layer((g) => {
      g.fillStyle = PAL.gold;
      drawStar(g, 0, starY, 0.75, 0.32, 5);
    }, PAL.gold, { rim: 0.6, lip: 1.0, depth: 0.9 });

    P.glow((gc) => {
      drawStar(gc, 0, starY, 0.65, 0.28, 5);
      for (let i = 0; i < 4; i++) {
        const yb = trunkH + 0.5 + i * tierH * 0.88;
        const hw = (W / 2) * (1 - (i / tiers) * 0.68) * 0.55;
        gc.beginPath(); gc.arc(-hw, yb, 0.14, 0, Math.PI * 2); gc.fill();
        gc.beginPath(); gc.arc(hw, yb, 0.14, 0, Math.PI * 2); gc.fill();
      }
    });
    P.innerShade('#13281b', { alpha: 0.28, blurPx: 10 });
  };
  return [pts, paint];
}

/** Smaller snowy spruce tree for flanking woods. */
export function buildSnowPine(W = 3.6, H = 6.4, seed = 21) {
  const r = P2.rng(seed);
  const tiers = 4, trunkW = 0.54, trunkH = 0.65;
  const tierH = (H - trunkH) / tiers;
  const right = [[trunkW / 2, 0], [trunkW / 2, trunkH]];
  for (let i = 0; i < tiers; i++) {
    const hw = (W / 2) * (1 - (i / tiers) * 0.68);
    const yb = trunkH + i * tierH * 0.88;
    right.push([hw, yb]);
    if (i < tiers - 1) right.push([hw * 0.55, yb + tierH * 0.9]);
  }
  right.push([0, H]);
  const pts = roughen([...right, ...right.slice(0, -1).reverse().map(([x, y]) => [-x, y])], r, { amp: 0.014 });

  const paint = (P) => {
    P.fill(PAL.spruceDark);
    P.felt(0.8);
    P.layer((g) => { g.fillStyle = PAL.oakDark; D.rect(g, -trunkW * 0.55, 0, trunkW * 1.1, trunkH + 0.3); }, PAL.oakDark);
    for (let i = 0; i < tiers; i++) {
      const hw = (W / 2) * (1 - (i / tiers) * 0.68) * 1.04;
      const yb = trunkH + i * tierH * 0.88, yt = yb + tierH * 1.2;
      P.layer((g) => {
        g.fillStyle = i % 2 ? PAL.spruce : PAL.spruceLight;
        D.poly(g, [[-hw, yb], [hw, yb], [0, yt]]);
      }, PAL.spruce, { rim: 0.8, lip: 0.8, depth: 0.8 });
      P.layer((g) => {
        g.fillStyle = PAL.snow;
        D.ell(g, -hw * 0.48, yb + 0.16, hw * 0.42, 0.18);
        D.ell(g, hw * 0.48, yb + 0.16, hw * 0.42, 0.18);
      }, PAL.snow, { lip: 0.9, depth: 0.6 });
    }
    P.innerShade('#13281b', { alpha: 0.28, blurPx: 8 });
  };
  return [pts, paint];
}

/** Toy Train Stone Viaduct with real horizontal cut slot (`holes`) + Toy Steam Locomotive! */
export function buildTrainViaduct() {
  const W = 10.2, H = 2.55;
  const pts = P2.fromDrawing((g) => {
    D.rect(g, -W / 2, 0, W, 2.25, 0.12);
    // Scalloped snow coping
    for (let x = -4.4; x <= 4.41; x += 1.1) D.ell(g, x, 2.25, 0.66, 0.24);
  }, { w: W + 0.5, h: H + 0.4, name: 'viaduct' });

  // Horizontal slot cut right through the viaduct card for the toy train slider pin!
  const slot = [[-3.7, 1.32], [3.7, 1.32], [3.7, 1.66], [-3.7, 1.66]];

  const paint = (P) => {
    P.gradient('#9d8f82', '#7d6e62', 0);
    P.felt(0.8);
    // Masonry arches printed below the slot
    P.layer((g) => {
      g.fillStyle = '#52443a';
      for (const ax of [-3.3, -1.1, 1.1, 3.3]) {
        g.beginPath();
        g.moveTo(ax - 0.68, 0);
        g.lineTo(ax - 0.68, 0.65);
        g.arc(ax, 0.65, 0.68, Math.PI, 0, true);
        g.lineTo(ax + 0.68, 0);
        g.closePath();
        g.fill();
      }
    }, '#52443a', { rim: 0.7, lip: 0.6, depth: 0.7 });

    // Snow cap along parapet
    P.layer((g) => {
      g.fillStyle = PAL.snow;
      D.rect(g, -W / 2, 2.02, W, 0.45, 0.14);
    }, PAL.snow, { lip: 0.9, depth: 0.8 });

    // Festive holly garlands between arches
    P.draw((g) => {
      for (const hx of [-2.2, 0, 2.2]) drawHollyCluster(g, hx, 0.92, 0.48, 0);
    });
    P.innerShade('#2c1e14', { alpha: 0.28, blurPx: 8 });
  };
  return { pts, slot, paint };
}

/** Mechanism #4: Christmas Toy Steam Train + Gift Tender! */
export function buildToyTrainPiece() {
  const [pts, paint] = P2.drawnPiece((g, ink) => {
    // Coupling bar & chassis
    g.fillStyle = ink('#3b2820');
    D.rect(g, -1.85, 0.24, 3.7, 0.28, 0.08);
    // Wheels
    g.fillStyle = ink(PAL.gold);
    for (const wx of [-1.45, -0.75, 0.25, 0.95, 1.55]) D.ell(g, wx, 0.28, 0.26, 0.26);

    // Gift tender car (left)
    g.fillStyle = ink(PAL.spruce);
    D.rect(g, -1.85, 0.46, 1.45, 0.78, 0.1);
    // Stacked gifts in tender
    g.fillStyle = ink(PAL.berry);
    D.rect(g, -1.68, 1.18, 0.55, 0.52, 0.06);
    g.fillStyle = ink(PAL.goldPale);
    D.rect(g, -1.08, 1.18, 0.52, 0.44, 0.06);

    // Locomotive cab & boiler (right)
    g.fillStyle = ink(PAL.crimson);
    D.rect(g, -0.12, 0.46, 0.95, 1.32, 0.1); // cab
    D.rect(g, 0.72, 0.46, 1.12, 0.86, 0.12); // boiler
    // Roof & smokestack & cowcatcher
    g.fillStyle = ink(PAL.gold);
    D.rect(g, -0.22, 1.72, 1.15, 0.18, 0.06);
    D.rect(g, 1.32, 1.24, 0.34, 0.56, 0.06);
    D.ell(g, 1.49, 1.82, 0.25, 0.12);
    D.poly(g, [[1.8, 0.24], [2.15, 0.24], [1.8, 0.68]]);
    // Lit cab window
    g.fillStyle = ink(PAL.windowGlow, 'print');
    D.rect(g, 0.12, 1.05, 0.48, 0.48, 0.06);
  }, { w: 4.6, h: 2.2, name: 'toyTrain' });
  return { pts, paint, funnel: [1.49, 1.92] };
}

/** Visible Red-and-Gold Paper Pull-Tab Strip that slides in/out at the card edge with the train! */
export function buildPullTabStrip() {
  return P2.drawnPiece((g, ink) => {
    g.fillStyle = ink(PAL.cream);
    D.rect(g, -1.8, 0, 3.6, 0.85, 0.16);
    g.fillStyle = ink(PAL.crimson);
    D.rect(g, 0.6, 0.08, 1.1, 0.69, 0.12);
    g.fillStyle = ink(PAL.gold, 'print');
    D.poly(g, [[0.95, 0.42], [1.45, 0.62], [1.45, 0.22]]);
  }, { w: 3.9, h: 1.05, name: 'pullTab' });
}

/** Festive Holiday Message Board & Santa Postbox (legible Korean handwriting in 1920x1080!). */
export function buildMessageStand({ to, msg, from }) {
  const W = 9.8, H = 5.6;
  const pts = P2.fromDrawing((g) => {
    // Two sturdy oak posts + ornate sign frame + red postbox on left
    D.rect(g, -3.4, 0, 0.62, 1.2);
    D.rect(g, 3.1, 0, 0.62, 1.2);
    D.rect(g, -4.3, 0.82, 8.9, 4.45, 0.35);
    // Scalloped snow crest at top
    D.ell(g, 0.15, 5.22, 2.2, 0.32);
    // Santa postbox standing beside left post
    D.rect(g, -4.75, 0, 1.15, 2.55, 0.22);
    D.ell(g, -4.18, 2.55, 0.62, 0.28);
  }, { w: W + 0.6, h: H + 0.5, name: 'messageStand' });

  const paint = (P) => {
    // Outer oak signboard frame
    P.fill(PAL.oakDark);
    P.felt(0.65);

    // Inner warm ivory parchment note card
    const bx = -3.65, by = 1.12, bw = 7.9, bh = 3.85;
    P.layer((g) => {
      g.fillStyle = '#fffaf0';
      D.rect(g, bx, by, bw, bh, 0.24);
    }, '#fffaf0', { rim: 0.6, lip: 0.9, depth: 0.85 });

    // Red Santa Postbox on the left
    P.layer((g) => {
      g.fillStyle = PAL.berry;
      D.rect(g, -4.72, 0, 1.12, 2.52, 0.18);
      g.fillStyle = PAL.snow;
      D.ell(g, -4.16, 2.56, 0.62, 0.24);
    }, PAL.berry, { lip: 0.85, depth: 0.8 });

    // Decorative gold border, holly header & wax seal, AND legible message text!
    P.draw((g) => {
      // Postbox mail slot & gold horn
      g.fillStyle = '#2b120d';
      D.rect(g, -4.5, 1.88, 0.68, 0.14, 0.04);
      g.fillStyle = PAL.gold;
      D.ell(g, -4.16, 1.28, 0.22, 0.18);

      // Gold inner rule on parchment
      g.strokeStyle = PAL.gold;
      g.lineWidth = 0.07;
      g.strokeRect(bx + 0.22, by + 0.22, bw - 0.44, bh - 0.44);

      // Holly sprig at top-center & wax seal bottom-left of parchment
      drawHollyCluster(g, bx + bw / 2, by + bh - 0.12, 0.62, 0);
      g.fillStyle = PAL.crimson;
      g.beginPath();
      g.arc(bx + 0.65, by + 0.62, 0.3, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = PAL.goldPale;
      drawStar(g, bx + 0.65, by + 0.62, 0.16, 0.07, 5);

      // Render { to, msg, from } in crisp high-res pixel space so wrapLines measures accurately!
      const S = 100;
      g.save();
      g.translate(bx + bw / 2, by + bh / 2);
      g.scale(1 / S, -1 / S);

      const maxTextW = (bw - 0.9) * S;
      const topY = -(bh / 2 - 0.64) * S;
      const botY = (bh / 2 - 0.56) * S;

      // TO (받는 사람)
      g.textAlign = 'left';
      g.textBaseline = 'middle';
      g.fillStyle = PAL.crimsonDark;
      g.font = `700 ${Math.round(0.54 * S)}px "Nanum Pen Script", cursive, sans-serif`;
      g.fillText(to || '', -maxTextW / 2 + 12, topY);

      // MSG (본문 — auto-fit font size & line count up to 4 lines so even 90-char messages never truncate!)
      let fontPx = 56;
      let lines = [];
      for (const [tryPx, maxLn] of [[56, 2], [50, 3], [43, 3], [35, 4], [31, 4]]) {
        fontPx = tryPx;
        g.font = `400 ${fontPx}px "Nanum Pen Script", cursive, sans-serif`;
        lines = wrapLines(g, msg || '', maxTextW, maxLn);
        if (!lines.length || !lines[lines.length - 1].endsWith('…') || tryPx === 31) break;
      }
      g.fillStyle = '#2d180e';
      g.textAlign = 'center';
      const lineH = fontPx * 1.13;
      const midY = (topY + botY) * 0.5 + 3;
      const startY = midY - ((lines.length - 1) * lineH) / 2;
      lines.forEach((ln, idx) => {
        g.fillText(ln, 0, startY + idx * lineH);
      });

      // FROM (보내는 사람)
      g.textAlign = 'right';
      g.fillStyle = PAL.spruceDark;
      g.font = `700 ${Math.round(0.52 * S)}px "Nanum Pen Script", cursive, sans-serif`;
      g.fillText(from || '', maxTextW / 2 - 8, botY);

      g.restore();
    });
    P.innerShade('#3b2010', { alpha: 0.2, blurPx: 7 });
  };

  return [pts, paint];
}

/** Cheerful Snowman & Stacked Gift Boxes (foreground left group). */
export function buildSnowmanAndGifts() {
  return P2.drawnPiece((g, ink) => {
    // Snow base mound (kept strictly y >= 0 so fromDrawing never clips at bottom!)
    g.fillStyle = ink(PAL.snow);
    D.ell(g, -0.15, 0.44, 2.2, 0.36);
    D.rect(g, -2.15, 0.02, 4.1, 0.36);

    // Gift boxes on left
    g.fillStyle = ink(PAL.crimson);
    D.rect(g, -2.0, 0.25, 1.12, 1.05, 0.08);
    g.fillStyle = ink(PAL.gold);
    D.rect(g, -1.53, 0.25, 0.18, 1.05);
    D.ell(g, -1.44, 1.38, 0.28, 0.14);

    g.fillStyle = ink(PAL.spruce);
    D.rect(g, -0.92, 0.25, 0.9, 0.82, 0.08);
    g.fillStyle = ink(PAL.berry);
    D.rect(g, -0.54, 0.25, 0.15, 0.82);

    // Snowman body & head on right
    g.fillStyle = ink('#f9fbff');
    D.ell(g, 0.88, 1.05, 0.96, 0.86);
    D.ell(g, 0.88, 2.22, 0.7, 0.64);
    D.ell(g, 0.88, 3.12, 0.5, 0.46);

    // Top hat
    g.fillStyle = ink('#2c2228');
    D.rect(g, 0.22, 3.48, 1.32, 0.18, 0.06);
    D.rect(g, 0.46, 3.6, 0.84, 0.68, 0.08);
    g.fillStyle = ink(PAL.berry, 'print');
    D.rect(g, 0.46, 3.65, 0.84, 0.16);

    // Striped scarf
    g.fillStyle = ink(PAL.berry);
    D.rect(g, 0.34, 2.62, 1.08, 0.26, 0.08);
    D.rect(g, 1.12, 2.0, 0.28, 0.7, 0.08);

    // Carrot nose, coal eyes & buttons
    g.fillStyle = ink('#e06d28', 'print');
    D.poly(g, [[0.88, 3.16], [1.34, 3.08], [0.88, 3.02]]);
    g.fillStyle = ink('#2a1810', 'print');
    D.ell(g, 0.72, 3.24, 0.06, 0.06);
    D.ell(g, 1.04, 3.24, 0.06, 0.06);
    for (const by of [2.38, 2.08, 1.78]) D.ell(g, 0.88, by, 0.07, 0.07);
  }, { w: 5.8, h: 5.2, name: 'snowmanGifts' });
}

/** Mechanism #5: Pendulum-Rocking Red Dala Toy Horse mounted on a visible brad pin! */
export function buildRockingHorse() {
  return P2.drawnPiece((g, ink) => {
    // Curved wooden rocker runner
    g.fillStyle = ink(PAL.gold);
    g.beginPath();
    g.arc(0, 1.65, 1.55, Math.PI * 1.18, Math.PI * 1.82);
    g.arc(0, 1.65, 1.32, Math.PI * 1.82, Math.PI * 1.18, true);
    g.closePath();
    g.fill();

    // Red wooden horse legs, body, neck & head
    g.fillStyle = ink(PAL.berry);
    D.rect(g, -0.68, 0.22, 0.28, 0.85, 0.06);
    D.rect(g, 0.38, 0.22, 0.28, 0.85, 0.06);
    D.ell(g, -0.02, 1.12, 0.72, 0.42);
    D.poly(g, [[0.25, 1.15], [0.68, 1.15], [0.82, 1.92], [0.42, 1.95]]);
    D.ell(g, 0.78, 1.88, 0.34, 0.22, -0.2);
    // Tail & saddle blanket
    g.fillStyle = ink(PAL.cream);
    D.ell(g, -0.78, 1.22, 0.24, 0.36, 0.35);
    g.fillStyle = ink(PAL.spruce);
    D.rect(g, -0.28, 1.05, 0.52, 0.44, 0.08);
    // Brass pin dot in middle
    g.fillStyle = ink(PAL.goldPale, 'print');
    D.ell(g, 0, 1.12, 0.11, 0.11);
  }, { w: 3.1, h: 2.35, name: 'rockingHorse' });
}

/** Glowing Vintage Holiday Streetlamp. */
export function buildStreetLamp() {
  const [pts, paint0] = P2.drawnPiece((g, ink) => {
    g.fillStyle = ink('#2b3238');
    D.rect(g, -0.42, 0, 0.84, 0.32, 0.08);
    D.rect(g, -0.18, 0.25, 0.36, 3.6);
    D.rect(g, -0.58, 3.2, 1.16, 0.18, 0.06); // crossbar
    // Lantern housing
    D.poly(g, [[-0.48, 3.78], [0.48, 3.78], [0.62, 4.72], [-0.62, 4.72]]);
    D.poly(g, [[-0.72, 4.68], [0.72, 4.68], [0, 5.28]]);
    // Glowing glass pane
    g.fillStyle = ink(PAL.windowGlow);
    D.rect(g, -0.36, 3.92, 0.72, 0.68, 0.06);
    // Red wreath bow on crossbar
    g.fillStyle = ink(PAL.berry);
    D.ell(g, 0, 3.28, 0.34, 0.22);
  }, { w: 1.8, h: 5.55, name: 'streetLamp' });

  const paint = (P) => {
    paint0(P);
    P.glow((gc) => { gc.fillRect(-0.36, 3.92, 0.72, 0.68); });
  };
  return [pts, paint];
}

/** Foreground scalloped snowdrift with holly & peeking red fox! */
export function buildSnowdriftCard(w = 6.2, h = 1.85, withFox = false, seed = 55) {
  const r = P2.rng(seed);
  const pts = P2.fromDrawing((g) => {
    D.rect(g, -w / 2, 0, w, h * 0.55);
    for (let i = 0; i < 5; i++) {
      const x = -w * 0.38 + (i / 4) * w * 0.76;
      D.ell(g, x, h * 0.55, w * 0.22, h * (0.34 + (i % 2) * 0.12));
    }
    if (withFox) {
      D.ell(g, 0.8, h * 0.95, 0.45, 0.42);
      D.poly(g, [[0.48, h * 1.15], [0.68, h * 1.15], [0.52, h * 1.48]]);
      D.poly(g, [[0.92, h * 1.15], [1.12, h * 1.15], [1.08, h * 1.48]]);
    }
  }, { w: w * 1.38 + 1.2, h: h * (withFox ? 2.1 : 1.55) + 0.8, name: 'snowdrift' });

  const paint = (P) => {
    P.gradient('#f7faff', '#cdd9ea', 0);
    P.felt(0.65);
    P.layer((g) => {
      drawHollyCluster(g, -w * 0.26, h * 0.48, 0.68, 0.25);
      if (!withFox) drawHollyCluster(g, w * 0.24, h * 0.44, 0.58, -0.3);
    }, PAL.spruce, { lip: 0.8, depth: 0.7 });

    if (withFox) {
      P.layer((g) => {
        g.fillStyle = '#cf5a28';
        D.ell(g, 0.8, h * 0.95, 0.44, 0.4);
        D.poly(g, [[0.48, h * 1.15], [0.68, h * 1.15], [0.52, h * 1.46]]);
        D.poly(g, [[0.92, h * 1.15], [1.12, h * 1.15], [1.08, h * 1.46]]);
        g.fillStyle = PAL.cream;
        D.ell(g, 0.8, h * 0.85, 0.28, 0.2);
      }, '#cf5a28', { lip: 0.8, depth: 0.7 });
      P.draw((g) => {
        g.fillStyle = '#26140c';
        D.ell(g, 0.68, h * 0.98, 0.05, 0.05);
        D.ell(g, 0.92, h * 0.98, 0.05, 0.05);
        D.ell(g, 0.8, h * 0.86, 0.06, 0.05);
      });
    }
    P.innerShade('#8da0be', { alpha: 0.24, blurPx: 8 });
  };
  return [pts, paint];
}
