// design-2/prints.js
// Procedural layered-paper illustrations for Design 2: "고요한 밤, 숲속 호수의 성탄 회전목마"
// Distinct cool moonlit Nordic Christmas palette: Midnight Indigo, Frosted Spruce Teal, Winterberry Rose, Silver-Champagne & Birch Cream.
import * as P2 from 'papercraft/lib/paperkit-2d.js';
import { wrapLines } from '../../kit/message.js';

const { shade, mix, rgba, fillLeaf, scallopTiles, roughen, draw2: D } = P2;

export const PAL2 = {
  indigo: '#1b2d4d',
  indigoDeep: '#101d35',
  indigoMid: '#2d4673',
  teal: '#285d66',
  tealLight: '#45838c',
  tealDark: '#193d44',
  rose: '#b8385c',
  roseLight: '#de6685',
  champagne: '#ebd089',
  silver: '#dce6f5',
  ice: '#b5d0e6',
  iceDeep: '#7aa6c7',
  snow: '#eef4fc',
  snowMid: '#ccd9ec',
  birch: '#f6f1e7',
  timber: '#5a4650',
  candle: '#ffd87a',
  ink: '#1d243b',
};

function drawStar(g, cx, cy, rOut, rIn, points = 6, rot = -Math.PI / 2) {
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

function drawSnowflakeMotif(g, cx, cy, rad, lw = 0.09) {
  g.save();
  g.translate(cx, cy);
  g.lineWidth = lw;
  g.lineCap = 'round';
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI) / 3;
    const ca = Math.cos(a), sa = Math.sin(a);
    g.beginPath();
    g.moveTo(0, 0);
    g.lineTo(ca * rad, sa * rad);
    for (const f of [0.52, 0.78]) {
      const bx = ca * rad * f, by = sa * rad * f, br = rad * 0.24;
      g.moveTo(bx, by);
      g.lineTo(bx + Math.cos(a + 0.65) * br, by + Math.sin(a + 0.65) * br);
      g.moveTo(bx, by);
      g.lineTo(bx + Math.cos(a - 0.65) * br, by + Math.sin(a - 0.65) * br);
    }
    g.stroke();
  }
  g.restore();
}

function drawWinterberrySprig(g, cx, cy, size, rot = 0) {
  g.save();
  g.translate(cx, cy);
  g.rotate(rot);
  for (const ang of [-0.7, 0.7, 2.45]) {
    g.fillStyle = ang > 1 ? PAL2.tealDark : PAL2.teal;
    fillLeaf(g, 0, 0, size, ang, 0.28);
  }
  g.fillStyle = PAL2.rose;
  for (const [bx, by] of [[0, 0], [size * 0.16, size * 0.14], [-size * 0.15, size * 0.12]]) {
    g.beginPath();
    g.arc(bx, by, size * 0.13, 0, Math.PI * 2);
    g.fill();
  }
  g.restore();
}

/** Cool Nordic slate-ash wooden & woven table canvas. */
export function makeNordicTableCanvas(W = 1024, H = 1024, seed = 33) {
  const r = P2.rng(seed);
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const g = c.getContext('2d');
  g.fillStyle = '#252f42';
  g.fillRect(0, 0, W, H);
  const planks = 8, ph = H / planks;
  for (let p = 0; p < planks; p++) {
    const y0 = p * ph;
    const base = p % 2 === 0 ? '#2d394f' : '#263145';
    const gr = g.createLinearGradient(0, y0, 0, y0 + ph);
    gr.addColorStop(0, shade(base, 0.05));
    gr.addColorStop(0.5, base);
    gr.addColorStop(1, shade(base, -0.07));
    g.fillStyle = gr;
    g.fillRect(0, y0, W, ph);
    for (let i = 0; i < 24; i++) {
      const yy = y0 + (i + 0.5) * (ph / 24);
      g.strokeStyle = i % 3 === 0 ? 'rgba(12,18,28,0.26)' : 'rgba(160,185,220,0.08)';
      g.lineWidth = 1.2 + r() * 2.0;
      g.beginPath();
      const phs = r() * 6.28;
      for (let x = 0; x <= W; x += 24) {
        const wy = yy + Math.sin(x * 0.01 + phs) * 3.5;
        if (x === 0) g.moveTo(x, wy); else g.lineTo(x, wy);
      }
      g.stroke();
    }
    g.fillStyle = 'rgba(10,15,24,0.5)';
    g.fillRect(0, y0, W, 2.2);
  }
  return c;
}

/** Front Hardcover of the 180° Pop-up Book (visible closed at t = 0: x in [-W/2, W/2], y in [0, H]). */
export function paintBookFrontCover(W, H) {
  return (P) => {
    P.gradient('#21365c', '#13223d', 0.5);
    P.felt(0.8);

    // Cloth spine band along the left edge (x near -W/2)
    P.layer((g) => {
      g.fillStyle = '#0e1a30';
      D.rect(g, -W / 2, 0, 1.35, H);
      g.fillStyle = PAL2.champagne;
      D.rect(g, -W / 2 + 1.32, 0, 0.14, H);
    }, '#0e1a30', { lip: 0.6, depth: 0.7 });

    // Ornate inset silver-blue panel
    const cx = 0.45, cy = H * 0.52;
    P.layer((g) => {
      g.fillStyle = '#182b4c';
      D.rect(g, cx - 4.7, 1.35, 9.4, H - 2.7, 0.4);
    }, '#182b4c', { rim: 0.85, rimColor: PAL2.champagne, lip: 0.8, depth: 0.85 });

    // Central Nordic Snowflake & Carousel Medallion
    P.layer((g) => {
      g.fillStyle = PAL2.champagne;
      drawStar(g, cx, cy + 0.6, 3.85, 3.45, 16, 0);
      g.fillStyle = PAL2.birch;
      g.beginPath();
      g.arc(cx, cy + 0.6, 3.25, 0, Math.PI * 2);
      g.fill();
    }, PAL2.birch, { lip: 0.9, depth: 0.9 });

    // Layered miniature teal carousel silhouette & rose winterberries inside medallion
    P.layer((g) => {
      g.fillStyle = PAL2.teal;
      D.poly(g, [[cx - 2.1, cy + 0.9], [cx + 2.1, cy + 0.9], [cx, cy + 2.65]]);
      D.rect(g, cx - 1.85, cy - 1.15, 3.7, 0.42, 0.1);
      for (const px of [-1.4, 0, 1.4]) D.rect(g, px + cx - 0.1, cy - 0.8, 0.2, 1.75);
      g.fillStyle = PAL2.rose;
      for (let i = -2; i <= 2; i++) D.ell(g, cx + i * 0.78, cy + 0.88, 0.4, 0.22);
    }, PAL2.teal, { lip: 0.8, depth: 0.75 });

    P.draw((g) => {
      // Foil snowflakes & corner stars
      g.strokeStyle = PAL2.champagne;
      for (const [sx, sy, sr] of [
        [cx - 3.5, H - 2.6, 0.62],
        [cx + 3.5, H - 2.6, 0.62],
        [cx - 3.5, 2.6, 0.62],
        [cx + 3.5, 2.6, 0.62],
      ]) {
        drawSnowflakeMotif(g, sx, sy, sr, 0.08);
      }
      drawWinterberrySprig(g, cx - 2.2, cy - 1.85, 0.85, 0.4);
      drawWinterberrySprig(g, cx + 2.2, cy - 1.85, 0.85, -0.4);

      // Book Title Banner below medallion
      g.fillStyle = PAL2.champagne;
      D.rect(g, cx - 4.15, 2.55, 8.3, 2.15, 0.25);
      g.fillStyle = '#162746';
      D.rect(g, cx - 3.99, 2.71, 7.98, 1.83, 0.2);

      g.save();
      g.translate(cx, 3.62);
      g.scale(1, -1);
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillStyle = PAL2.champagne;
      g.font = '700 1.04px "Nanum Pen Script", serif';
      g.fillText('고요한 성탄의 밤', 0, -0.3);
      g.fillStyle = PAL2.silver;
      g.font = '0.67px "Nanum Pen Script", sans-serif';
      g.fillText('숲속 호수와 회전목마 팝업북', 0, 0.46);
      g.restore();
    });
  };
}

/** Inside Spread Page Print (`side`: 'left' spans x in [-W, 0], 'right' spans x in [0, +W], y in [-H/2, +H/2]). */
export function paintSpreadPage(W, H, side = 'right') {
  return (P) => {
    const { r } = P;
    const x0 = side === 'left' ? -W : 0;
    const x1 = side === 'left' ? 0 : W;
    const pad = 0.75;
    const rx0 = side === 'left' ? x0 + pad : x0;
    const rx1 = side === 'left' ? x1 : x1 - pad;

    P.fill(PAL2.birch);
    P.felt(0.6);

    // Moonlit snow ground wash
    P.layer((g) => {
      const gr = g.createLinearGradient(0, H / 2 - pad, 0, -H / 2 + pad);
      gr.addColorStop(0, '#b7cae2');
      gr.addColorStop(0.5, '#d2e0f2');
      gr.addColorStop(1, '#e7f0fa');
      g.fillStyle = gr;
      D.rect(g, rx0, -H / 2 + pad, rx1 - rx0, H - pad * 2, 0.25);
    }, '#d2e0f2', { rim: 0.4, lip: 0.5, depth: 0.65 });

    // Soft snowdrift islands
    P.layer((g) => {
      g.fillStyle = '#f4f8ff';
      if (side === 'left') {
        D.ell(g, -7.2, 2.2, 4.4, 2.6, 0.15);
        D.ell(g, -6.4, -4.2, 4.8, 2.5, -0.1);
      } else {
        D.ell(g, 7.6, 3.8, 4.2, 2.3, -0.15);
        D.ell(g, 4.5, -5.8, 3.8, 1.8, 0.1);
      }
    }, '#f4f8ff', { rim: 0.6, lip: 0.8, depth: 0.65 });

    // Winding lantern-lit snowy footpath crossing the central gutter from left chapel to right frozen lake!
    P.layer((g) => {
      g.fillStyle = '#e8dcc8';
      const ctrl = side === 'left'
        ? [[-10.2, 1.8], [-6.8, 0.4], [-3.2, -1.2], [0.2, -0.8]]
        : [[-0.2, -0.8], [2.4, -1.1], [4.6, -2.4]];
      const line = P2.pathLine(ctrl, { step: 0.3 }).pts;
      const L = [], R = [];
      line.forEach(([x, y], i) => {
        const [ax, ay] = line[Math.max(0, i - 1)], [bx, by] = line[Math.min(line.length - 1, i + 1)];
        const tx = bx - ax, ty = by - ay, len = Math.hypot(tx, ty) || 1;
        const hw = 1.05 + Math.sin(i * 0.6) * 0.08;
        L.push([x - (ty / len) * hw, y + (tx / len) * hw]);
        R.push([x + (ty / len) * hw, y - (tx / len) * hw]);
      });
      g.beginPath();
      [...L, ...R.reverse()].forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
      g.closePath();
      g.fill();
    }, '#e8dcc8', { rim: 0.85, rimColor: '#ffffff', lip: 0.7, depth: 0.7 });

    // On RIGHT page: Frozen Mirror-Ice Pond (`x ~ 6.8, y ~ -1.8`, which in world Z is +1.8 foreground-right!)
    if (side === 'right') {
      P.layer((g) => {
        g.fillStyle = '#ffffff';
        D.ell(g, 6.9, -1.6, 4.55, 3.15, -0.08);
      }, '#ffffff', { rim: 0.6, lip: 0.9, depth: 0.7 });

      P.layer((g) => {
        const igr = g.createRadialGradient(6.7, -1.5, 0.4, 6.9, -1.6, 4.2);
        igr.addColorStop(0, '#78abc9');
        igr.addColorStop(0.7, '#9ac3dc');
        igr.addColorStop(1, '#c3ddef');
        g.fillStyle = igr;
        D.ell(g, 6.9, -1.6, 4.15, 2.78, -0.08);
      }, '#9ac3dc', { lip: 0.6, depth: 0.6 });

      // Crisp white ice-skate tracks & frost cracks on the pond
      P.draw((g) => {
        g.strokeStyle = 'rgba(255, 255, 255, 0.78)';
        g.lineWidth = 0.07;
        g.setLineDash([0.32, 0.18]);
        g.beginPath();
        g.ellipse(6.9, -1.6, 2.75, 1.65, -0.08, 0, Math.PI * 2);
        g.stroke();
        g.beginPath();
        g.ellipse(6.9, -1.6, 1.85, 1.05, 0.12, 0, Math.PI * 2);
        g.stroke();
        g.setLineDash([]);
      });
    }

    // Gutter shadow, golden light pools, corner snowflake filigree & borders
    P.draw((g) => {
      // Soft gutter crease shading along x = 0
      const ggr = g.createLinearGradient(side === 'left' ? -1.1 : 0, 0, side === 'left' ? 0 : 1.1, 0);
      if (side === 'left') {
        ggr.addColorStop(0, 'rgba(32, 48, 82, 0)');
        ggr.addColorStop(1, 'rgba(32, 48, 82, 0.22)');
        g.fillStyle = ggr;
        g.fillRect(-1.1, -H / 2 + pad, 1.1, H - pad * 2);
      } else {
        ggr.addColorStop(0, 'rgba(32, 48, 82, 0.22)');
        ggr.addColorStop(1, 'rgba(32, 48, 82, 0)');
        g.fillStyle = ggr;
        g.fillRect(0, -H / 2 + pad, 1.1, H - pad * 2);
      }

      // Warm candle pools around carousel & chapel
      const pools = side === 'left' ? [[-6.8, 2.4, 3.0], [-0.4, 0.6, 3.2]] : [[0.4, 0.6, 3.2]];
      for (const [px, py, pr] of pools) {
        const wg = g.createRadialGradient(px, py, 0.2, px, py, pr);
        wg.addColorStop(0, 'rgba(255, 218, 128, 0.36)');
        wg.addColorStop(1, 'rgba(255, 218, 128, 0)');
        g.fillStyle = wg;
        g.beginPath();
        g.arc(px, py, pr, 0, Math.PI * 2);
        g.fill();
      }

      // Printed paper pop-up fold tabs across the central gutter
      g.fillStyle = 'rgba(235, 208, 137, 0.55)';
      for (const gy of [-4.2, 0.5, 4.6]) {
        D.rect(g, side === 'left' ? -1.4 : 0, gy - 0.24, 1.4, 0.48, 0.08);
      }

      // Outer border rule (open across the gutter!)
      g.strokeStyle = PAL2.champagne;
      g.lineWidth = 0.12;
      g.beginPath();
      if (side === 'left') {
        g.moveTo(0, H / 2 - pad);
        g.lineTo(-W + pad, H / 2 - pad);
        g.lineTo(-W + pad, -H / 2 + pad);
        g.lineTo(0, -H / 2 + pad);
      } else {
        g.moveTo(0, H / 2 - pad);
        g.lineTo(W - pad, H / 2 - pad);
        g.lineTo(W - pad, -H / 2 + pad);
        g.lineTo(0, -H / 2 + pad);
      }
      g.stroke();

      // Corner winterberry & snowflake accents
      const cxCorner = side === 'left' ? -W + 1.55 : W - 1.55;
      drawWinterberrySprig(g, cxCorner, -H / 2 + 1.55, 0.85, side === 'left' ? 0.5 : -0.5);
      g.strokeStyle = rgba(PAL2.indigoMid, 0.45);
      drawSnowflakeMotif(g, cxCorner, H / 2 - 1.55, 0.52, 0.06);

      // Sparse snow sparkles
      for (let i = 0; i < 24; i++) {
        const sx = rx0 + 0.8 + r() * (rx1 - rx0 - 1.6);
        const sy = -H / 2 + 1.2 + r() * (H - 2.4);
        g.fillStyle = 'rgba(255,255,255,0.75)';
        g.beginPath();
        g.arc(sx, sy, 0.07 + r() * 0.05, 0, Math.PI * 2);
        g.fill();
      }
    });
  };
}

/** Wing of the True Rigid V-Fold Nordic Mountain & Starry Sky Arch!
 *  `side`: +1 (right wing, x in [0, wingW]) or -1 (left wing, x in [-wingW, 0]). */
export function buildVFoldMountainWing(wingW = 7.4, ridgeH = 8.4, side = 1) {
  const s = side;
  // Polygon with vertical central crease at x = 0 (from y = 0 to ridgeH) and bottom page hinge along y = 0!
  const raw = [
    [0, 0],
    [s * wingW, 0],
    [s * wingW, 2.2],
    [s * wingW * 0.78, 4.6],
    [s * wingW * 0.52, 5.8],
    [s * wingW * 0.28, 7.6],
    [0, ridgeH],
  ];
  const pts = s > 0 ? raw : raw.slice().reverse();

  // Right wing gets a circular cutout hole for Mechanism #3 (Starry Moon Volvelle)!
  const holeCx = s * 3.5, holeCy = 3.8, holeR = 1.65;
  const hole = s > 0
    ? Array.from({ length: 32 }, (_, i) => {
        const a = (i / 32) * Math.PI * 2;
        return [holeCx + Math.cos(a) * holeR, holeCy + Math.sin(a) * holeR];
      })
    : null;

  const paint = (P) => {
    P.gradient('#253c66', '#162645', 0.3 * s);
    P.felt(0.75);

    // Snow-capped mountain peak & ridges
    P.layer((g) => {
      g.fillStyle = '#dce8f7';
      D.poly(g, [
        [0, ridgeH],
        [s * wingW * 0.28, 7.6],
        [s * wingW * 0.42, 6.2],
        [s * wingW * 0.22, 5.5],
        [0, 6.3],
      ]);
      // Lower frosted ridge
      g.fillStyle = PAL2.teal;
      for (let k = 0; k < 4; k++) {
        const tx = s * (1.2 + k * 1.55);
        const th = 2.6 + (3 - k) * 0.45;
        D.poly(g, [[tx - 0.75, 0], [tx + 0.75, 0], [tx, th]]);
      }
    }, '#dce8f7', { rim: 0.7, lip: 0.85, depth: 0.85 });

    if (s > 0) {
      // Champagne ring bezel around the Moon Volvelle hole!
      P.layer((g) => {
        g.fillStyle = PAL2.champagne;
        g.beginPath();
        g.arc(holeCx, holeCy, holeR + 0.32, 0, Math.PI * 2);
        g.fill();
      }, PAL2.champagne, { lip: 0.9, depth: 0.8 });
    } else {
      // Left wing carries silver Nordic constellation & northern-lights arcs
      P.draw((g) => {
        g.strokeStyle = rgba(PAL2.champagne, 0.75);
        g.lineWidth = 0.06;
        const stars = [[-1.6, 5.2], [-2.8, 4.6], [-3.9, 3.8], [-2.5, 3.4], [-4.8, 2.9]];
        g.beginPath();
        stars.forEach(([sx, sy], i) => (i ? g.lineTo(sx, sy) : g.moveTo(sx, sy)));
        g.stroke();
        g.fillStyle = PAL2.champagne;
        for (const [sx, sy] of stars) drawStar(g, sx, sy, 0.24, 0.09, 4, 0);
      });
    }
    P.innerShade('#0d172b', { alpha: 0.28, blurPx: 10 });
  };

  return { pts, hole, paint, holeCenter: [holeCx, holeCy] };
}

/** Mechanism #3: Moon & Constellation Volvelle Disc behind right V-fold mountain wing! */
export function buildMoonVolvelle(rad = 2.05) {
  const pts = P2.shape.radial(P2.rng(73), { cx: 0, cy: 0, rx: rad, ry: rad, lobes: 14, depth: 0.05, wobble: 0.01 });
  const paint = (P) => {
    P.fill('#101d38');
    P.felt(0.55);
    P.layer((g) => {
      g.fillStyle = PAL2.champagne;
      // Crescent moon on one side, big North Star opposite, smaller stars around
      g.beginPath();
      g.arc(0, rad * 0.56, 0.48, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = '#101d38';
      g.beginPath();
      g.arc(0.18, rad * 0.62, 0.4, 0, Math.PI * 2);
      g.fill();

      g.fillStyle = PAL2.champagne;
      drawStar(g, 0, -rad * 0.56, 0.52, 0.2, 6, 0);
      for (const a of [0.8, 2.3, -0.8, -2.3]) {
        drawStar(g, Math.cos(a) * rad * 0.56, Math.sin(a) * rad * 0.56, 0.28, 0.11, 5, a);
      }
      drawStar(g, 0, 0, 0.45, 0.18, 8, 0);
    }, PAL2.champagne, { lip: 0.9, depth: 0.75 });

    P.glow((gc) => {
      gc.beginPath(); gc.arc(-0.08, rad * 0.54, 0.36, 0, Math.PI * 2); gc.fill();
      drawStar(gc, 0, -rad * 0.56, 0.46, 0.18, 6, 0);
    });
  };
  return [pts, paint];
}

/** Central Cross-Gutter Christmas Tree & Carousel Canopy Structure + Prancing Reindeer! */
export function buildCarouselSpindleCard() {
  const W = 6.2, H = 9.2;
  const pts = P2.fromDrawing((g) => {
    // Ornate base plinth + central festive spruce column + scalloped carousel pavilion canopy + star finial!
    D.rect(g, -2.4, 0, 4.8, 1.05, 0.18);
    D.rect(g, -0.55, 0.9, 1.1, 5.4);
    // Lush spruce boughs around center column
    D.poly(g, [[-2.1, 1.6], [2.1, 1.6], [0, 4.2]]);
    D.poly(g, [[-1.7, 3.1], [1.7, 3.1], [0, 5.5]]);
    // Scalloped carousel roof canopy
    D.poly(g, [[-3.0, 5.55], [3.0, 5.55], [0, 8.15]]);
    for (let i = -2; i <= 2; i++) D.ell(g, i * 1.15, 5.52, 0.62, 0.28);
    // Star topper
    D.ell(g, 0, 8.55, 0.58, 0.58);
  }, { w: W + 0.6, h: H + 0.5, name: 'carouselMain' });

  const paint = (P) => {
    P.fill(PAL2.indigo);
    P.felt(0.75);

    // Base drum in winterberry rose & champagne stripes
    P.layer((g) => {
      g.fillStyle = PAL2.rose;
      D.rect(g, -2.4, 0, 4.8, 1.02, 0.15);
      g.fillStyle = PAL2.champagne;
      for (let x = -2.0; x <= 2.01; x += 0.8) D.rect(g, x - 0.12, 0.12, 0.24, 0.78, 0.05);
    }, PAL2.rose, { rim: 0.7, lip: 0.85, depth: 0.8 });

    // Frosted teal spruce tree tiers in center of carousel
    for (const [hw, yb, yt, col] of [
      [2.05, 1.6, 4.15, PAL2.teal],
      [1.65, 3.05, 5.45, PAL2.tealLight],
    ]) {
      P.layer((g) => {
        g.fillStyle = col;
        D.poly(g, [[-hw, yb], [hw, yb], [0, yt]]);
      }, col, { rim: 0.8, lip: 0.85, depth: 0.85 });
    }

    // Carousel pavilion tent canopy (alternating champagne, rose & indigo stripes)
    P.layer((g) => {
      const cols = [PAL2.indigoMid, PAL2.champagne, PAL2.rose, PAL2.champagne, PAL2.indigoMid];
      for (let i = 0; i < 5; i++) {
        const xL = -3.0 + i * 1.2, xR = xL + 1.2;
        g.fillStyle = cols[i];
        D.poly(g, [[xL, 5.55], [xR, 5.55], [0, 8.15]]);
        D.ell(g, (xL + xR) / 2, 5.5, 0.62, 0.26);
      }
    }, PAL2.champagne, { rim: 0.75, lip: 0.9, depth: 0.9 });

    // Glowing Star Finial & Carousel Lights
    P.layer((g) => {
      g.fillStyle = PAL2.champagne;
      drawStar(g, 0, 8.55, 0.64, 0.26, 6, 0);
    }, PAL2.champagne, { lip: 1.0, depth: 0.9 });

    P.draw((g) => {
      g.fillStyle = PAL2.candle;
      for (let i = -2; i <= 2; i++) {
        g.beginPath();
        g.arc(i * 1.15, 5.55, 0.13, 0, Math.PI * 2);
        g.fill();
      }
    });

    P.glow((gc) => {
      drawStar(gc, 0, 8.55, 0.56, 0.22, 6, 0);
      for (let i = -2; i <= 2; i++) {
        gc.beginPath(); gc.arc(i * 1.15, 5.55, 0.14, 0, Math.PI * 2); gc.fill();
      }
    });
    P.innerShade('#0e1a32', { alpha: 0.25, blurPx: 9 });
  };
  return [pts, paint];
}

/** Miniature Carousel Prancing Reindeer suspended from brass rod! */
export function buildCarouselDeer(accent = PAL2.rose) {
  return P2.drawnPiece((g, ink) => {
    // Vertical brass carousel pole
    g.fillStyle = ink(PAL2.champagne);
    D.rect(g, -0.09, 0.6, 0.18, 2.65);
    // White/birch Nordic horse/reindeer body
    g.fillStyle = ink(PAL2.birch);
    D.ell(g, 0, 1.35, 0.68, 0.36, 0.08);
    D.poly(g, [[0.26, 1.35], [0.62, 1.35], [0.78, 2.08], [0.42, 2.1]]);
    D.ell(g, 0.72, 2.05, 0.3, 0.19, -0.15);
    // Prancing legs
    D.rect(g, -0.58, 0.78, 0.18, 0.58, 0.06);
    D.rect(g, 0.38, 0.82, 0.18, 0.58, 0.06);
    // Antlers & saddle blanket
    g.fillStyle = ink(PAL2.champagne);
    D.rect(g, 0.58, 2.16, 0.12, 0.38, 0.04);
    g.fillStyle = ink(accent);
    D.rect(g, -0.24, 1.24, 0.46, 0.44, 0.08);
  }, { w: 2.5, h: 4.0, name: 'carouselDeer' });
}

/** Nordic Timber & Glass Stave Chapel (Left Page Landmark, warm candlelit lancet windows!). */
export function buildNordicChapel() {
  const W = 6.2, H = 8.4;
  const pts = P2.fromDrawing((g) => {
    D.rect(g, -2.7, 0, 5.4, 3.6);
    D.poly(g, [[-3.0, 3.4], [3.0, 3.4], [0, 6.2]]);
    // Upper tier & spire
    D.rect(g, -1.35, 4.6, 2.7, 1.8);
    D.poly(g, [[-1.6, 6.2], [1.6, 6.2], [0, 8.2]]);
    // Small chimney
    D.rect(g, -2.2, 4.4, 0.68, 1.6);
  }, { w: W + 0.6, h: H + 0.5, name: 'nordicChapel' });

  const paint = (P) => {
    P.gradient('#344c72', '#223452', 0.4);
    P.felt(0.8);

    // Cream birch wainscot & timber beams
    P.layer((g) => {
      g.fillStyle = PAL2.birch;
      D.rect(g, -2.5, 0.55, 5.0, 2.8, 0.12);
      g.fillStyle = '#5c4654';
      D.rect(g, -2.7, 0, 5.4, 0.6);
    }, PAL2.birch, { lip: 0.8, depth: 0.8 });

    // Scalloped slate shingles + snow eaves
    scallopTiles(P, { x0: -2.85, x1: 2.85, y0: 3.45, y1: 5.95 }, { color: PAL2.tealDark, rows: 4 });
    scallopTiles(P, { x0: -1.5, x1: 1.5, y0: 6.22, y1: 8.0 }, { color: PAL2.rose, rows: 3 });

    P.layer((g) => {
      g.fillStyle = PAL2.snow;
      D.poly(g, [[-3.0, 3.42], [0, 6.22], [3.0, 3.42], [2.55, 3.2], [0, 5.65], [-2.55, 3.2]]);
      D.poly(g, [[-1.6, 6.22], [0, 8.22], [1.6, 6.22], [1.22, 6.04], [0, 7.68], [-1.22, 6.04]]);
    }, PAL2.snow, { lip: 0.95, depth: 0.85 });

    // Arched rose door & glowing stained-glass lancet windows
    P.layer((g) => {
      g.fillStyle = PAL2.rose;
      g.beginPath();
      g.moveTo(-0.58, 0);
      g.lineTo(-0.58, 1.55);
      g.arc(0, 1.55, 0.58, Math.PI, 0, true);
      g.lineTo(0.58, 0);
      g.closePath();
      g.fill();
    }, PAL2.rose, { rim: 0.7, lip: 0.8, depth: 0.75 });

    P.draw((g) => {
      for (const wx of [-1.62, 1.62]) {
        g.fillStyle = PAL2.candle;
        g.beginPath();
        g.moveTo(wx - 0.42, 1.05);
        g.lineTo(wx - 0.42, 2.25);
        g.arc(wx, 2.25, 0.42, Math.PI, 0, true);
        g.lineTo(wx + 0.42, 1.05);
        g.closePath();
        g.fill();
        g.strokeStyle = '#3c2b36';
        g.lineWidth = 0.08;
        g.stroke();
      }
      // Rose window in spire
      g.fillStyle = PAL2.candle;
      g.beginPath();
      g.arc(0, 5.35, 0.42, 0, Math.PI * 2);
      g.fill();
      drawWinterberrySprig(g, 0, 1.65, 0.45, 0);
    });

    P.glow((gc) => {
      for (const wx of [-1.62, 1.62]) gc.fillRect(wx - 0.36, 1.1, 0.72, 1.35);
      gc.beginPath(); gc.arc(0, 5.35, 0.38, 0, Math.PI * 2); gc.fill();
    });
    P.innerShade('#131d33', { alpha: 0.26, blurPx: 9 });
  };
  return { pts, paint, chimney: [-1.86, 6.08] };
}

/** Mechanism #2: Winter Ice Skater Character (gliding along the oval ice-pond slot!). */
export function buildIceSkater(coatColor = PAL2.rose, scarfColor = PAL2.champagne) {
  return P2.drawnPiece((g, ink) => {
    // Silver skate blades & base tab
    g.fillStyle = ink(PAL2.silver);
    D.rect(g, -0.52, 0, 1.04, 0.16, 0.05);
    // Legs
    g.fillStyle = ink(PAL2.indigo);
    D.rect(g, -0.28, 0.12, 0.22, 0.68, 0.06);
    D.rect(g, 0.08, 0.18, 0.22, 0.65, 0.06);
    // Flared winter coat
    g.fillStyle = ink(coatColor);
    D.poly(g, [[-0.62, 0.72], [0.58, 0.72], [0.32, 1.68], [-0.32, 1.68]]);
    // Trailing scarf & knit pom-pom hat
    g.fillStyle = ink(scarfColor);
    D.rect(g, -0.78, 1.48, 1.12, 0.24, 0.08);
    // Head
    g.fillStyle = ink('#fce6d4');
    D.ell(g, 0.02, 1.92, 0.28, 0.26);
    // Pom-pom beanie
    g.fillStyle = ink(coatColor);
    D.poly(g, [[-0.28, 2.04], [0.32, 2.04], [0.02, 2.52]]);
    g.fillStyle = ink('#ffffff');
    D.ell(g, 0.02, 2.56, 0.14, 0.14);
  }, { w: 1.85, h: 2.8, name: 'iceSkater' });
}

/** Frosted Silver-Teal Spruce Tree (for crossCard groves on left & right pages). */
export function buildFrostedTealPine(W = 3.5, H = 6.2, seed = 41) {
  const r = P2.rng(seed);
  const tiers = 4, trunkW = 0.52, trunkH = 0.6;
  const tierH = (H - trunkH) / tiers;
  const right = [[trunkW / 2, 0], [trunkW / 2, trunkH]];
  for (let i = 0; i < tiers; i++) {
    const hw = (W / 2) * (1 - (i / tiers) * 0.68);
    const yb = trunkH + i * tierH * 0.88;
    right.push([hw, yb]);
    if (i < tiers - 1) right.push([hw * 0.54, yb + tierH * 0.9]);
  }
  right.push([0, H]);
  const pts = roughen([...right, ...right.slice(0, -1).reverse().map(([x, y]) => [-x, y])], r, { amp: 0.013 });

  const paint = (P) => {
    P.fill(PAL2.tealDark);
    P.felt(0.8);
    P.layer((g) => { g.fillStyle = '#4e3c46'; D.rect(g, -trunkW * 0.55, 0, trunkW * 1.1, trunkH + 0.3); }, '#4e3c46');
    for (let i = 0; i < tiers; i++) {
      const hw = (W / 2) * (1 - (i / tiers) * 0.68) * 1.04;
      const yb = trunkH + i * tierH * 0.88, yt = yb + tierH * 1.22;
      const col = i % 2 === 0 ? PAL2.teal : PAL2.tealLight;
      P.layer((g) => {
        g.fillStyle = col;
        D.poly(g, [[-hw, yb], [hw, yb], [0, yt]]);
      }, col, { rim: 0.8, lip: 0.85, depth: 0.8 });
      P.layer((g) => {
        g.fillStyle = PAL2.snow;
        D.ell(g, -hw * 0.45, yb + 0.16, hw * 0.42, 0.18);
        D.ell(g, hw * 0.45, yb + 0.16, hw * 0.42, 0.18);
      }, PAL2.snow, { lip: 0.95, depth: 0.6 });
    }
    // Winterberry accents
    P.draw((g) => {
      g.fillStyle = PAL2.roseLight;
      for (let i = 0; i < 5; i++) {
        g.beginPath();
        g.arc((i % 2 ? 0.45 : -0.45) * (1 - i * 0.14), 1.4 + i * 0.95, 0.13, 0, Math.PI * 2);
        g.fill();
      }
    });
    P.innerShade('#0e2429', { alpha: 0.28, blurPx: 8 });
  };
  return [pts, paint];
}

/** Frosted Timber Lantern Arch + Mechanism #4 (Pendulum-Swinging Star Lantern). */
export function buildLanternArch() {
  const W = 4.6, H = 4.4;
  const pts = P2.fromDrawing((g) => {
    D.rect(g, -2.05, 0, 0.52, 3.8);
    D.rect(g, 1.53, 0, 0.52, 3.8);
    D.rect(g, -2.25, 3.45, 4.5, 0.55, 0.15);
    D.ell(g, 0, 4.02, 1.5, 0.3);
  }, { w: W + 0.4, h: H + 0.35, name: 'lanternArch' });

  const paint = (P) => {
    P.fill('#4d3e4c');
    P.felt(0.75);
    P.layer((g) => {
      g.fillStyle = PAL2.snow;
      D.rect(g, -2.25, 3.82, 4.5, 0.32, 0.14);
      drawWinterberrySprig(g, -1.75, 3.55, 0.58, 0.3);
      drawWinterberrySprig(g, 1.75, 3.55, 0.58, -0.3);
    }, PAL2.snow, { lip: 0.9, depth: 0.75 });
    P.innerShade('#1d1622', { alpha: 0.26, blurPx: 8 });
  };
  return [pts, paint];
}

export function buildHangingStarLantern() {
  const [pts, paint0] = P2.drawnPiece((g, ink) => {
    g.fillStyle = ink(PAL2.champagne);
    D.rect(g, -0.07, 0.95, 0.14, 0.75);
    drawStar(g, 0, 0.65, 0.68, 0.32, 5);
    g.fillStyle = ink(PAL2.candle, 'print');
    drawStar(g, 0, 0.65, 0.42, 0.2, 5);
  }, { w: 1.55, h: 1.85, name: 'starLantern' });

  const paint = (P) => {
    paint0(P);
    P.glow((gc) => drawStar(gc, 0, 0.65, 0.44, 0.2, 5));
  };
  return [pts, paint];
}

/** Handmade Winterberry & Silver Greeting Note Easel Card (Left Foreground Page, legible at 1920x1080!). */
export function buildSolsticeMessageCard({ to, msg, from }) {
  const W = 9.4, H = 5.2;
  const pts = P2.fromDrawing((g) => {
    // Scalloped winterberry-and-indigo backing mat on two birch feet
    D.rect(g, -3.5, 0, 0.65, 0.75);
    D.rect(g, 2.85, 0, 0.65, 0.75);
    D.rect(g, -4.5, 0.45, 9.0, 4.45, 0.34);
    D.ell(g, 0, 4.9, 1.9, 0.26);
  }, { w: W + 0.5, h: H + 0.4, name: 'solsticeMsg' });

  const paint = (P) => {
    P.fill(PAL2.indigo);
    P.felt(0.65);

    // Champagne foil mat layer
    P.layer((g) => {
      g.fillStyle = PAL2.champagne;
      D.rect(g, -4.26, 0.68, 8.52, 4.0, 0.26);
    }, PAL2.champagne, { lip: 0.9, depth: 0.75 });

    // Warm Birch Ivory Note Sheet
    const bx = -4.08, by = 0.84, bw = 8.16, bh = 3.68;
    P.layer((g) => {
      g.fillStyle = '#fbf7ef';
      D.rect(g, bx, by, bw, bh, 0.2);
    }, '#fbf7ef', { lip: 0.9, depth: 0.7 });

    P.draw((g) => {
      // Corner winterberry sprigs (bottom-left & top-right so "소중한 너에게" has 100% clean ivory space!)
      drawWinterberrySprig(g, bx + 0.55, by + 0.52, 0.56, 2.3);
      drawWinterberrySprig(g, bx + bw - 0.55, by + bh - 0.45, 0.56, -0.6);
      g.fillStyle = PAL2.rose;
      drawStar(g, 0, by + bh + 0.02, 0.34, 0.14, 6, 0);

      // Crisp Korean handwriting in pixel-scaled space so wrapLines measures accurately!
      const S = 100;
      g.save();
      g.translate(bx + bw / 2, by + bh / 2);
      g.scale(1 / S, -1 / S);

      const maxTextW = (bw - 0.95) * S;
      const topY = -(bh / 2 - 0.64) * S;
      const botY = (bh / 2 - 0.54) * S;

      // TO
      g.textAlign = 'left';
      g.textBaseline = 'middle';
      g.fillStyle = PAL2.rose;
      g.font = `700 ${Math.round(0.55 * S)}px "Nanum Pen Script", cursive, sans-serif`;
      g.fillText(to || '', -maxTextW / 2 + 8, topY);

      // MSG (auto-wrap & auto-shrink up to 4 lines so even 90-char messages fit without truncation!)
      let fontPx = 56;
      let lines = [];
      for (const [tryPx, maxLn] of [[56, 2], [50, 3], [43, 3], [35, 4], [31, 4]]) {
        fontPx = tryPx;
        g.font = `400 ${fontPx}px "Nanum Pen Script", cursive, sans-serif`;
        lines = wrapLines(g, msg || '', maxTextW, maxLn);
        if (!lines.length || !lines[lines.length - 1].endsWith('…') || tryPx === 31) break;
      }
      g.fillStyle = PAL2.indigoDeep;
      g.textAlign = 'center';
      const lineH = fontPx * 1.13;
      const midY = (topY + botY) * 0.5 + 3;
      const startY = midY - ((lines.length - 1) * lineH) / 2;
      lines.forEach((ln, idx) => {
        g.fillText(ln, 0, startY + idx * lineH);
      });

      // FROM
      g.textAlign = 'right';
      g.fillStyle = PAL2.tealDark;
      g.font = `700 ${Math.round(0.53 * S)}px "Nanum Pen Script", cursive, sans-serif`;
      g.fillText(from || '', maxTextW / 2, botY);

      g.restore();
    });
    P.innerShade('#15223d', { alpha: 0.2, blurPx: 7 });
  };
  return [pts, paint];
}

/** Low Ice-Pond Rim Snowbank + Arctic Owl/Fox Accent! */
export function buildPondSnowRim(w = 6.4, h = 1.45, seed = 82) {
  const pts = P2.fromDrawing((g) => {
    D.rect(g, -w / 2, 0, w, h * 0.55);
    for (let i = 0; i < 5; i++) {
      D.ell(g, -w * 0.36 + (i / 4) * w * 0.72, h * 0.55, w * 0.21, h * (0.34 + (i % 2) * 0.1));
    }
  }, { w: w * 1.38 + 1.2, h: h * 1.85 + 0.7, name: 'pondRim' });

  const paint = (P) => {
    P.gradient('#f6faff', '#c4d5eb', 0);
    P.felt(0.6);
    P.layer((g) => {
      drawWinterberrySprig(g, -w * 0.25, h * 0.45, 0.56, 0.3);
      drawWinterberrySprig(g, w * 0.25, h * 0.42, 0.52, -0.25);
    }, PAL2.teal, { lip: 0.85, depth: 0.65 });
    P.innerShade('#7c94b8', { alpha: 0.22, blurPx: 7 });
  };
  return [pts, paint];
}
