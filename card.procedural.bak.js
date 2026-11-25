// A 180-degree Christmas pop-up card: the cover turns over like a book page, a V-fold village tree rises from the
// gutter with the real V-fold kinematics, the flaps on both pages stand up as the spread flattens, and once open the
// world inside moves: Santa's sleigh swings across on a paper arm, skaters glide in a slot on the pond, the snowman
// waves, smoke curls from the chimneys and snow falls. Built with the papercraft kit (MIT); every piece's art is ours.
import * as THREE from 'three';
import * as P2 from 'papercraft/lib/paperkit-2d.js';
import { paperTextures, makeCard, paperLights, enableSoftShadows, PaperPost, PAPER_LIGHT, paperMaterial } from 'papercraft/lib/paperkit-3d.js';
import { createLife } from 'papercraft/lib/paper-life.js';
import { C, D, dots, star, villageTree, snowPine, snowman, gift, reindeer, sled, banner, holly, winPane, lampPost } from './pieces.js';

const T0 = performance.now();
const Q = new URLSearchParams(location.search);
if (Q.has('capture')) document.getElementById('hint')?.remove();
const SIZE = (Q.get('size') || '').match(/^(\d+)x(\d+)$/);
const W0 = SIZE ? +SIZE[1] : innerWidth, H0 = SIZE ? +SIZE[2] : innerHeight;

// ---- card dimensions (units ~ cm of card; the figures ~3-4 units tall) ------------------------------------------
const PW = 18, PD = 24, TH = 0.09;             // one page: PW wide (x), PD deep (z); card thickness
const ALPHA = 40 * Math.PI / 180, GAMMA = 70 * Math.PI / 180;   // V-fold: glue lines 40 deg off the spine, crease 70 deg off the glue lines
const TREE_Z = 0.5;                            // where the V-fold's crease meets the gutter

// ---- renderer, camera, paper ------------------------------------------------------------------------------------
const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance', preserveDrawingBuffer: true });
renderer.setPixelRatio(SIZE ? 1 : Math.min(devicePixelRatio, 2));
renderer.setSize(W0, H0);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.BasicShadowMap;
document.body.appendChild(renderer.domElement);
const scene = new THREE.Scene(); scene.background = new THREE.Color('#1e1410');
const camera = new THREE.PerspectiveCamera(26, W0 / H0, 5, 600);
const paper = paperTextures(renderer, { color: '#f4f2ee', unitsPerTile: 6 });
let seedN = 500;
const card = (pts, paint, o = {}) => makeCard(pts, { paint, paper, seed: seedN++, thickness: 0.08, edgeWidth: 0.07, pxPerUnit: 48, ...o });
const glowers = [];

// ---- the table: dark walnut with a grain --------------------------------------------------------------------------
{
  const c = document.createElement('canvas'); c.width = 2048; c.height = 1536; const g = c.getContext('2d'), r = P2.rng(5);
  g.fillStyle = '#3e271c'; g.fillRect(0, 0, 2048, 1536);
  for (let i = 0; i < 260; i++) { const y = r() * 1536, a = 0.05 + r() * 0.12; g.strokeStyle = r() < 0.5 ? `rgba(20,10,6,${a})` : `rgba(120,78,50,${a})`; g.lineWidth = 1 + r() * 5; g.beginPath(); g.moveTo(0, y); for (let x = 0; x <= 2048; x += 64) g.lineTo(x, y + Math.sin(x * 0.004 + i) * 8 + Math.sin(x * 0.013 + i * 3) * 3); g.stroke(); }
  for (let i = 0; i < 6; i++) { const x = r() * 2048, y = r() * 1536; g.strokeStyle = 'rgba(25,12,6,0.25)'; g.lineWidth = 3; for (let k = 1; k < 8; k++) { g.beginPath(); g.ellipse(x, y, k * 14, k * 5, 0, 0, 7); g.stroke(); } }
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(120, 90), paperMaterial({ map: tex, normalMap: paper.normalMap.clone(), normalScale: 0.3 }));
  m.rotation.x = -Math.PI / 2; m.position.set(0, -TH, 4); m.receiveShadow = true; scene.add(m);
}

// ---- page prints ------------------------------------------------------------------------------------------------
// a page card lies flat: shape x -> world x, shape y -> world -z (the top of the print is the back of the page), front up
const flat = (mesh, y = -TH / 2) => { mesh.matrixAutoUpdate = true; mesh.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 0, -1), new THREE.Vector3(0, 1, 0))); mesh.position.y = y; return mesh; };
const rect = (x0, x1, y0, y1) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
const snowPage = (x0, x1, extra) => (P) => {
  const { g, r, box } = P;
  P.gradient('#f1f2f5', '#dde1ea', 0.25); P.felt(0.35);
  for (let i = 0; i < 40; i++) { const x = x0 + r() * (x1 - x0), y = -PD / 2 + r() * PD, rr = 1 + r() * 3.5; const gr = g.createRadialGradient(x, y, 0, x, y, rr); gr.addColorStop(0, 'rgba(200,206,226,0.0)'); gr.addColorStop(0.8, 'rgba(196,204,226,0.28)'); gr.addColorStop(1, 'rgba(196,204,226,0)'); g.fillStyle = gr; g.fillRect(x - rr, y - rr, rr * 2, rr * 2); }
  P.draw((gg) => { for (let i = 0; i < 70; i++) { const x = x0 + r() * (x1 - x0), y = -PD / 2 + r() * PD, l = 0.4 + r() * 0.9; gg.strokeStyle = `rgba(150,162,200,${0.25 + r() * 0.25})`; gg.lineWidth = 0.07; gg.beginPath(); gg.moveTo(x - l, y); gg.quadraticCurveTo(x, y + 0.18, x + l, y); gg.stroke(); } });
  if (extra) extra(P);
  // a printed gold border with holly sprigs at the corners: it is a greeting card
  P.draw((gg) => { gg.strokeStyle = '#c99a3c'; gg.lineWidth = 0.12; gg.strokeRect(box.x0 + 0.7, box.y0 + 0.7, box.w - 1.4, box.h - 1.4); gg.lineWidth = 0.05; gg.strokeRect(box.x0 + 0.95, box.y0 + 0.95, box.w - 1.9, box.h - 1.9); });
  const outer = x0 < 0 ? box.x0 + 0.7 : box.x1 - 0.7;
  P.layer((gg) => { for (const y of [box.y0 + 0.7, box.y1 - 0.7]) for (const a of [0.3, 1.2, 2.0]) { gg.beginPath(); gg.ellipse(outer + Math.cos(a) * 0.5 * (x0 < 0 ? 1 : -1), y + Math.sin(a) * 0.3 * (y > 0 ? -1 : 1), 0.55, 0.22, a, 0, 7); gg.fill(); } }, C.spruceB, { lip: 0.7, depth: 0.6 });
  P.layer((gg) => { for (const y of [box.y0 + 0.7, box.y1 - 0.7]) for (const [dx, dy] of [[0, 0], [0.22, 0.12], [-0.08, 0.24]]) { gg.beginPath(); gg.arc(outer + dx * (x0 < 0 ? 1 : -1), y + dy * (y > 0 ? -1 : 1), 0.16, 0, 7); gg.fill(); } }, C.red, { lip: 0.8, depth: 0.6 });
  // the gutter: a soft shade where the page meets the fold
  P.draw((gg) => { const gx = x0 < 0 ? x1 : x0, gr = gg.createLinearGradient(gx, 0, gx + (x0 < 0 ? -1.6 : 1.6), 0); gr.addColorStop(0, 'rgba(85,96,158,0.22)'); gr.addColorStop(1, 'rgba(85,96,158,0)'); gg.fillStyle = gr; gg.fillRect(Math.min(gx, gx + (x0 < 0 ? -1.6 : 1.6)), box.y0, 1.6, box.h); });
};
// right page: a trodden path to the cottages, footprints
const rightExtra = (P) => { const { g, r } = P;
  const path = [[10.5, -12], [10, -8], [8.6, -4], [7.4, 0], [6.5, 4], [6.2, 7.6]];
  g.strokeStyle = '#cfd5e2'; g.lineWidth = 2.2; g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath(); path.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.stroke();
  g.strokeStyle = 'rgba(255,255,255,0.7)'; g.lineWidth = 0.12; g.stroke();
  g.fillStyle = 'rgba(150,160,196,0.45)'; for (let i = 0; i < 26; i++) { const t = i / 26, k = Math.min(path.length - 2, Math.floor(t * (path.length - 1))), u = t * (path.length - 1) - k, x = path[k][0] + (path[k + 1][0] - path[k][0]) * u + (i % 2 ? 0.3 : -0.3), y = path[k][1] + (path[k + 1][1] - path[k][1]) * u; g.beginPath(); g.ellipse(x, y, 0.13, 0.22, 0.2, 0, 7); g.fill(); }
};
// left page: a frozen pond with a slot the skaters glide in
const POND = { x: -9.5, y: -3.2, rx: 5.6, ry: 3.0 };
const SLOTS = [{ x0: -13.6, x1: -6.0, y: -1.7 }, { x0: -13.0, x1: -5.4, y: -4.7 }];
const leftExtra = (P) => {
  P.layer((gg) => { gg.beginPath(); for (let i = 0; i <= 60; i++) { const a = i / 60 * Math.PI * 2, w = 1 + 0.06 * Math.sin(a * 3) + 0.04 * Math.sin(a * 7); gg.lineTo(POND.x + Math.cos(a) * POND.rx * w, POND.y + Math.sin(a) * POND.ry * w); } gg.closePath(); gg.fill(); }, '#bcd0e4', { lip: 0.8, shade: 0.6, depth: 0.8 });
  P.draw((gg) => { gg.strokeStyle = 'rgba(255,255,255,0.75)'; gg.lineWidth = 0.08; for (let k = 0; k < 7; k++) { gg.beginPath(); gg.ellipse(POND.x + (k - 3) * 0.6, POND.y + Math.sin(k) * 0.6, 1.2 + k * 0.3, 0.5 + k * 0.1, 0.2 * k, 0, 4.5); gg.stroke(); }
    gg.strokeStyle = 'rgba(120,140,180,0.5)'; gg.lineWidth = 0.05; for (let k = 0; k < 5; k++) { gg.beginPath(); gg.moveTo(POND.x - 3 + k * 1.5, POND.y - 2); gg.lineTo(POND.x - 2.4 + k * 1.3, POND.y - 0.8); gg.lineTo(POND.x - 2.8 + k * 1.4, POND.y + 0.2); gg.stroke(); }
    gg.fillStyle = '#3a3048'; for (const sl of SLOTS) gg.fillRect(sl.x0, sl.y - 0.07, sl.x1 - sl.x0, 0.14); });   // the slot the skaters ride in
};
const coverPaint = (P) => {
  const { box, g } = P;
  P.gradient('#b8382f', '#8a2a26', 0.3); P.felt(0.6);
  P.marks('dot', { color: '#f3d9a0', alpha: 0.25, size: 0.02, density: 0.5 });
  P.layer((gg) => { gg.beginPath(); gg.rect(box.x0 + 0.8, box.y0 + 0.8, box.w - 1.6, box.h - 1.6); gg.rect(box.x0 + 1.15, box.y0 + 1.15, box.w - 2.3, box.h - 2.3); gg.fill('evenodd'); }, C.gold, { lip: 0.9 });
  const cx = (box.x0 + box.x1) / 2, by = box.y0 + box.h * 0.36;
  P.layer((gg) => { for (let i = 0; i < 4; i++) { const hw = 4.2 - i * 0.95, yb = by + i * 2.1; gg.beginPath(); gg.moveTo(cx - hw, yb); gg.lineTo(cx + hw, yb); gg.lineTo(cx, yb + 3.2); gg.closePath(); gg.fill(); } }, '#2f5a46', { lip: 0.8, shadow: 1.2 });
  P.layer((gg) => gg.fillRect(cx - 0.5, by - 1.0, 1.0, 1.05), C.trunk, { lip: 0.6 });
  P.layer((gg) => { const s = []; for (let i = 0; i < 4; i++) { const hw = 4.2 - i * 0.95, yb = by + i * 2.1; s.push([cx - hw * 0.55, yb + 0.5], [cx + hw * 0.5, yb + 0.7], [cx + hw * 0.05, yb + 1.3]); } dots(gg, s, 0.28); }, C.gold, { lip: 0.9 });
  P.layer((gg) => star(gg, cx, by + 3 * 2.1 + 3.4, 0.95), '#f0c050', { lip: 1 });
  P.layer((gg) => { for (const [x, y, rr] of [[box.x0 + 3, box.y1 - 3, 0.6], [box.x1 - 3.2, box.y1 - 4, 0.45], [box.x0 + 3.6, by + 4, 0.35], [box.x1 - 2.6, by + 1.5, 0.5]]) { for (let k = 0; k < 3; k++) { gg.save(); gg.translate(x, y); gg.rotate(k * Math.PI / 3); gg.fillRect(-rr, -0.05, rr * 2, 0.1); gg.restore(); } } }, '#f3ede0', { lip: 0.4, shadow: 0.6 });
  P.draw((gg) => { gg.save(); gg.translate(cx, box.y0 + box.h * 0.17); gg.scale(0.01, -0.01); gg.textAlign = 'center'; gg.textBaseline = 'middle'; gg.font = `italic 700 200px Georgia, 'Times New Roman', serif`; gg.fillStyle = '#5a1a16'; gg.fillText('Merry Christmas', 6, 8); gg.fillStyle = '#f2c766'; gg.fillText('Merry Christmas', 0, 0); gg.restore(); });
  P.innerShade('#3a0c08', { alpha: 0.35, blurPx: 14 });
};

// ---- the two pages ----------------------------------------------------------------------------------------------
const right = new THREE.Group(); scene.add(right);
right.add(flat(card(rect(0, PW, -PD / 2, PD / 2), snowPage(0, PW, rightExtra), { pxPerUnit: 56, edgeWidth: 0.05, folds: () => false, contact: null, back: 'kraft' })));
const leftPivot = new THREE.Group(); scene.add(leftPivot);       // rotates about the spine (the z axis)
const left = new THREE.Group(); leftPivot.add(left);
left.add(flat(card(rect(-PW, 0, -PD / 2, PD / 2), snowPage(-PW, 0, leftExtra), { pxPerUnit: 56, edgeWidth: 0.05, folds: () => false, contact: null, back: false })));
{ // the cover, glued under the left page: its print reads from above when the card is closed
  const cov = card(rect(0, PW, -PD / 2, PD / 2), coverPaint, { pxPerUnit: 56, edgeWidth: 0.05, folds: () => false, contact: null, back: false });
  cov.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(new THREE.Vector3(-1, 0, 0), new THREE.Vector3(0, 0, -1), new THREE.Vector3(0, -1, 0)));
  cov.position.y = -TH * 1.5; left.add(cov);
}

// ---- pieces ------------------------------------------------------------------------------------------------------
// a flap: a card standing on a hinge line parallel to the page's x, folding flat toward the back of the page
const flaps = [];
function flap([pts, paint], { page = right, x, z, scale = 1, at = 0.5, glow = false, name = '' }) {
  const hinge = new THREE.Group(); hinge.position.set(x, 0.01 + flaps.length * 0.004, z); page.add(hinge);
  const m = card(pts, paint, { pxPerUnit: 48 / scale }); m.scale.setScalar(scale); m.name = name; hinge.add(m);
  if (glow) { m.userData.setGlow?.(0.3); glowers.push(m); }
  const f = { hinge, mesh: m, at, x: 0, v: 0 }; flaps.push(f); return f;
}
const houseCard = ({ w = 5, wallH = 3.6, roofH = 2.6, wall = C.wallA, windows = 2 } = {}) => {
  const ov = 0.45, cw = w * 0.14;
  const art = (g, ink) => {
    g.fillStyle = ink('#9a4a34'); D.rect(g, -w * 0.3, wallH + roofH * 0.2, cw, roofH * 0.85);
    g.fillStyle = ink(wall); D.rect(g, -w / 2, 0, w, wallH + 0.05);
    g.fillStyle = ink(C.roof); D.poly(g, [[-w / 2 - ov, wallH - 0.1], [w / 2 + ov, wallH - 0.1], [0, wallH + roofH]]);
    g.fillStyle = ink('#f8f7f3'); D.poly(g, [[-w / 2 - ov + 0.25, wallH + 0.15], [w / 2 + ov - 0.25, wallH + 0.15], [0, wallH + roofH + 0.12]]);
    g.fillStyle = ink('#f8f7f3'); D.rect(g, -w * 0.3 - 0.06, wallH + roofH * 1.0, cw + 0.12, 0.22, 0.1);
  };
  const pts = P2.fromDrawing((g) => art(g, () => '#000'), { w: w + 2 * ov + 0.4, h: wallH + roofH + 0.6, name: 'house' });
  const paint = (P) => {
    P.parts(art);
    P.marks('brick', { color: P2.shade(wall, -0.3), alpha: 0.16, size: 0.06, region: { x0: -w / 2, x1: w / 2, y0: 0, y1: wallH } });
    P.marks('scallop', { color: '#b8c0d4', alpha: 0.35, size: 0.07, region: { x0: -w / 2, x1: w / 2, y0: wallH + 0.4, y1: wallH + roofH } });
    const ww = w * 0.17, wh = wallH * 0.3, xs = windows === 1 ? [-w * 0.22] : [-w * 0.3, w * 0.3], dx = windows === 1 ? w * 0.2 : 0, dw = w * 0.2, dh = wallH * 0.52;
    for (const x of xs) winPane(P, x, wallH * 0.42, ww, wh, '#5a3424');
    P.layer((g) => { g.beginPath(); g.moveTo(dx - dw / 2, 0); g.lineTo(dx - dw / 2, dh - dw / 2); g.arc(dx, dh - dw / 2, dw / 2, Math.PI, 0, true); g.lineTo(dx + dw / 2, 0); g.closePath(); g.fill(); }, C.door, { lip: 0.8 });
    P.layer((g) => { g.beginPath(); g.arc(dx, dh * 0.72, dw * 0.3, 0, 7); g.arc(dx, dh * 0.72, dw * 0.17, 0, 7, true); g.fill(); }, C.spruceB, { lip: 0.9 });
    const bulbs = []; for (let i = 0; i <= 9; i++) bulbs.push([-w / 2 + w * (0.06 + 0.88 * i / 9), wallH * 0.9 - Math.sin(i / 9 * Math.PI * 3) ** 2 * 0.15]);
    P.draw((g) => { g.strokeStyle = '#2e2230'; g.lineWidth = 0.04; g.beginPath(); bulbs.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.stroke(); ['#ff6a50', '#ffd25a', '#8fe0b0'].forEach((c, j) => { g.fillStyle = c; bulbs.filter((_, i) => i % 3 === j).forEach(([x, y]) => { g.beginPath(); g.arc(x, y - 0.1, 0.09, 0, 7); g.fill(); }); }); });
    P.glow((gc) => bulbs.forEach(([x, y]) => { gc.beginPath(); gc.arc(x, y - 0.1, 0.1, 0, 7); gc.fill(); }));
    P.innerShade('#2a1a20', { alpha: 0.25, blurPx: 8 });
  };
  return { pts, paint, chimney: [-w * 0.3 + cw / 2, wallH + roofH * 1.05 + 0.2] };
};
const santaCard = (h = 3.5) => { const k = h / 3.5; return P2.drawnPiece((g, ink) => {
  g.fillStyle = ink('#c9ac7a'); D.ell(g, -0.85 * k, 2.0 * k, 0.75 * k, 0.9 * k);             // the sack over his shoulder
  g.fillStyle = ink(C.red); D.rect(g, -1.0 * k, 2.6 * k, 0.3 * k, 0.4 * k, 0.05); g.fillStyle = ink(C.spruceB); D.rect(g, -0.7 * k, 2.7 * k, 0.3 * k, 0.35 * k, 0.05);
  g.fillStyle = ink('#2e2226'); D.rect(g, -0.42 * k, 0, 0.36 * k, 0.32 * k, 0.08); D.rect(g, 0.06 * k, 0, 0.36 * k, 0.32 * k, 0.08);
  g.fillStyle = ink('#b8342e'); D.rect(g, -0.34 * k, 0.25 * k, 0.28 * k, 0.6 * k); D.rect(g, 0.06 * k, 0.25 * k, 0.28 * k, 0.6 * k);
  D.rect(g, -0.55 * k, 0.75 * k, 1.1 * k, 1.35 * k, 0.3 * k);
  D.poly(g, [[0.4 * k, 1.85 * k], [0.95 * k, 2.55 * k], [1.12 * k, 2.42 * k], [0.55 * k, 1.65 * k]]);   // his waving arm
  g.fillStyle = ink('#f4eee2'); D.rect(g, -0.58 * k, 0.72 * k, 1.16 * k, 0.2 * k, 0.1); D.rect(g, -0.08 * k, 0.8 * k, 0.16 * k, 1.25 * k, 0.06);
  g.fillStyle = ink('#2e2226'); D.rect(g, -0.55 * k, 1.25 * k, 1.1 * k, 0.16 * k);
  g.fillStyle = ink(C.door); D.ell(g, 1.08 * k, 2.55 * k, 0.15 * k, 0.15 * k);
  g.fillStyle = ink('#f6f2ea'); D.ell(g, 0, 2.15 * k, 0.42 * k, 0.4 * k);
  g.fillStyle = ink('#f1d3b4'); D.ell(g, 0, 2.48 * k, 0.32 * k, 0.26 * k);
  g.fillStyle = ink('#b8342e'); D.poly(g, [[-0.36 * k, 2.68 * k], [0.36 * k, 2.68 * k], [0.3 * k, 3.0 * k], [0.62 * k, 3.15 * k], [0.55 * k, 3.25 * k], [0.05 * k, 3.25 * k]]);
  g.fillStyle = ink('#f4eee2'); D.rect(g, -0.4 * k, 2.64 * k, 0.8 * k, 0.16 * k, 0.08); D.ell(g, 0.62 * k, 3.2 * k, 0.13 * k, 0.12 * k);
  g.fillStyle = ink(C.gold, 'print'); D.rect(g, -0.1 * k, 1.25 * k, 0.2 * k, 0.16 * k);
  g.fillStyle = ink('#2a1608', 'print'); dots(g, [[-0.11 * k, 2.52 * k], [0.11 * k, 2.52 * k]], 0.04 * k);
  g.fillStyle = ink('#e59a86', 'print'); dots(g, [[0, 2.42 * k]], 0.05 * k);
  g.fillStyle = ink('#f6f2ea', 'print'); D.ell(g, -0.1 * k, 2.36 * k, 0.13 * k, 0.05 * k); D.ell(g, 0.1 * k, 2.36 * k, 0.13 * k, 0.05 * k);
}, { w: 3.0 * k, h: 3.6 * k, name: 'santa' }); };
const skater = (coat, scarf, flip = false) => { const s = flip ? -1 : 1; return P2.drawnPiece((g, ink) => {
  g.fillStyle = ink('#9aa4b8'); D.rect(g, -0.4, 0, 0.8, 0.07, 0.03);
  g.fillStyle = ink('#3a2a30'); D.rect(g, -0.28, 0.05, 0.22, 0.22, 0.05); D.rect(g, 0.06, 0.05, 0.22, 0.22, 0.05);
  g.fillStyle = ink('#3b4a6a'); D.poly(g, [[-0.22, 0.25], [-0.06, 0.25], [0.02, 0.9], [-0.18, 0.9]]); D.poly(g, [[0.06, 0.25], [0.22, 0.25], [0.18, 0.9], [-0.02, 0.9]]);
  g.fillStyle = ink(coat); D.rect(g, -0.3, 0.85, 0.6, 0.75, 0.18); D.poly(g, [[0.2 * s, 1.5], [0.95 * s, 1.3], [0.98 * s, 1.42], [0.25 * s, 1.62]]); D.poly(g, [[-0.2 * s, 1.5], [-0.8 * s, 1.75], [-0.75 * s, 1.86], [-0.2 * s, 1.62]]);
  g.fillStyle = ink(scarf); D.rect(g, -0.22, 1.5, 0.44, 0.13, 0.06); D.poly(g, [[-0.1 * s, 1.55], [-0.5 * s, 1.35], [-0.45 * s, 1.27], [0.0, 1.5]]);
  g.fillStyle = ink('#f1d3b4'); D.ell(g, 0, 1.85, 0.22, 0.22);
  g.fillStyle = ink(scarf); D.rect(g, -0.23, 1.95, 0.46, 0.18, 0.09); D.ell(g, 0, 2.16, 0.08, 0.08);
  g.fillStyle = ink('#2a1608', 'print'); dots(g, [[-0.07, 1.86], [0.07, 1.86]], 0.025);
}, { w: 2.1, h: 2.3, name: 'skater' }); };
const sleighCard = () => P2.drawnPiece((g, ink) => {
  g.fillStyle = ink('#6a4a30'); D.rect(g, -0.2, 0.75, 5.2, 0.14);                               // the harness pole
  for (const rx of [2.4, 4.4]) { // two reindeer leaping, legs tucked
    g.fillStyle = ink(P2.shade(C.trunk, -0.1)); D.poly(g, [[rx + 0.75, 1.65], [rx + 0.9, 2.15], [rx + 0.82, 2.18], [rx + 1.05, 2.0], [rx + 1.1, 2.08], [rx + 0.85, 1.65]]);
    g.fillStyle = ink(C.deer); D.ell(g, rx, 1.0, 0.75, 0.3, 0.12); D.poly(g, [[rx + 0.4, 1.05], [rx + 0.7, 1.7], [rx + 0.95, 1.6], [rx + 0.75, 0.95]]); D.ell(g, rx + 0.92, 1.68, 0.24, 0.15, -0.3);
    D.poly(g, [[rx - 0.5, 0.95], [rx - 1.0, 0.55], [rx - 0.92, 0.48], [rx - 0.35, 0.85]]); D.poly(g, [[rx + 0.45, 0.9], [rx + 0.95, 0.58], [rx + 1.0, 0.66], [rx + 0.55, 1.0]]);
    g.fillStyle = ink(C.cream); D.ell(g, rx - 0.05, 0.86, 0.45, 0.1);
    g.fillStyle = ink(C.red, 'print'); dots(g, [[rx + 1.12, 1.62]], 0.06);
  }
  g.fillStyle = ink('#c9ac7a'); D.ell(g, -0.6, 1.55, 0.55, 0.5);
  g.fillStyle = ink('#b8342e'); D.ell(g, 0.2, 1.5, 0.35, 0.42); g.fillStyle = ink('#f1d3b4'); D.ell(g, 0.22, 1.95, 0.2, 0.18); g.fillStyle = ink('#f6f2ea'); D.ell(g, 0.25, 1.78, 0.22, 0.18);
  g.fillStyle = ink('#b8342e'); D.poly(g, [[0.0, 2.05], [0.45, 2.05], [0.1, 2.45]]);
  g.fillStyle = ink(C.red); D.poly(g, [[-1.3, 0.55], [0.9, 0.55], [1.15, 0.95], [0.9, 1.3], [-1.0, 1.3], [-1.35, 1.65], [-1.55, 1.4]]);
  g.fillStyle = ink(C.gold); D.rect(g, -1.6, 0.25, 2.7, 0.12, 0.06); D.rect(g, -1.0, 0.3, 0.1, 0.3); D.rect(g, 0.5, 0.3, 0.1, 0.3); D.ell(g, 1.15, 0.45, 0.12, 0.2);
  g.fillStyle = ink(C.gold, 'print'); D.rect(g, -1.1, 0.85, 1.9, 0.05);
}, { w: 11.8, h: 2.7, name: 'sleigh' });

// pieces.js keeps one seeded stream: the order of the calls below fixes every variant
// right page (x > 0): cottages and pines at the back, reindeer, gifts, the sled and Santa, the greeting at the front
const chimneys = [];
const house = (page, x, z, o, at) => { const h = houseCard(o), f = flap([h.pts, h.paint], { page, x, z, at, glow: true, name: 'house' }); chimneys.push({ object: f.mesh, offset: [h.chimney[0], h.chimney[1], 0] }); return f; };
house(right, 6.2, -8.2, { w: 5.4, wall: C.wallA }, 0.42);
house(right, 13.2, -6.4, { w: 4.4, wallH: 3.1, roofH: 2.3, wall: C.wallB, windows: 1 }, 0.46);
flap(snowPine(7.5), { x: 16.4, z: -9.6, at: 0.4 }); flap(snowPine(6.2), { x: 9.6, z: -10.6, at: 0.38 }); flap(snowPine(5.2), { x: 16.6, z: -2.2, at: 0.5 });
flap(reindeer(3.0), { x: 10.2, z: -0.6, at: 0.55, name: 'reindeer' });
flap(gift(1.25, 0), { x: 4.3, z: 3.2, at: 0.62 }); flap(gift(1.0, 3), { x: 5.7, z: 3.9, at: 0.64 }); flap(gift(0.9, 2), { x: 3.4, z: 4.6, at: 0.66 });
flap(sled(1.3), { x: 13.6, z: 3.6, at: 0.6 }); const santa = flap(santaCard(3.5), { x: 10.4, z: 4.4, at: 0.62, name: 'santa' });
flap(holly(), { x: 16.2, z: 6.2, at: 0.7, scale: 0.9 });
flap(banner(10, 1.9, 0.9), { x: 9.4, z: 8.6, at: 0.74, name: 'banner' });
// left page (x < 0): a cottage and pines at the back, the pond with skaters, the snowman, holly at the front
house(left, -6.4, -8.6, { w: 5, wall: C.wallD, windows: 2 }, 0.42);
flap(snowPine(7.8), { page: left, x: -13.8, z: -8.8, at: 0.38 }); flap(snowPine(6.4), { page: left, x: -16.4, z: -5.4, at: 0.44 }); flap(snowPine(5.6), { page: left, x: -2.6, z: -10.4, at: 0.36 });
const skaters = [flap(skater('#c8452d', C.cream), { page: left, x: -11.5, z: -SLOTS[0].y, at: 0.6, name: 'skater 1' }), flap(skater('#3f6a8a', C.red, true), { page: left, x: -7.4, z: -SLOTS[1].y, at: 0.62, name: 'skater 2' })];
const sman = flap(snowman(3.4), { page: left, x: -2.9, z: 5.4, at: 0.66, name: 'snowman' });
flap(gift(1.1, 1), { page: left, x: -5.0, z: 6.6, at: 0.68 }); flap(gift(0.8, 4), { page: left, x: -4.1, z: 7.4, at: 0.7 });
flap(lampPost(4.2), { page: left, x: -15.2, z: 1.2, at: 0.6, glow: true }); flap(snowPine(3.8), { page: left, x: -12.2, z: 9.4, at: 0.74 }); flap(snowPine(3.2), { page: left, x: -6.6, z: 9.8, at: 0.76 });
flap(lampPost(4.2), { x: 4.0, z: -2.6, at: 0.5, glow: true }); flap(snowPine(3.6), { x: 3.2, z: 8.2, at: 0.74 }); flap(gift(0.9, 1), { x: 15.6, z: 0.6, at: 0.58 });
flap(holly(), { page: left, x: -14.6, z: 5.8, at: 0.7, scale: 0.9 }); flap(holly(), { page: left, x: -9.2, z: 8.6, at: 0.72, scale: 0.8 });

// the snowman's waving arm: its own card on a pin at the shoulder (a spinner: motion.md section 11)
const armPivot = new THREE.Group(); armPivot.position.set(0.55, 1.75, 0.07); sman.mesh.add(armPivot);
{ const [pts, paint] = P2.drawnPiece((g, ink) => { g.fillStyle = ink(C.trunk); D.poly(g, [[0, 0.08], [1.0, 0.4], [0.98, 0.52], [0, 0.22]]); D.poly(g, [[0.7, 0.35], [0.95, 0.7], [0.86, 0.75], [0.62, 0.4]]); g.fillStyle = ink(C.red); D.ell(g, 0.05, 0.15, 0.12, 0.12); }, { w: 2.4, h: 1.0, name: 'arm' });
  const m = card(pts, paint, { pxPerUnit: 64, folds: [] }); armPivot.add(m); }

// the V-fold village tree in the gutter: two half-cards, each glued along a line on its own page
const treeArt = villageTree(11.5);
const cot = 1 / Math.tan(GAMMA);
const clip = (pts, f) => { const out = []; for (let i = 0; i < pts.length; i++) { const a = pts[i], b = pts[(i + 1) % pts.length], fa = f(a), fb = f(b); if (fa >= 0) out.push(a); if ((fa >= 0) !== (fb >= 0)) { const t = fa / (fa - fb); out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]); } } return out; };
const halfR = clip(clip(treeArt[0], ([x]) => x), ([x, y]) => y - x * cot), halfL = clip(clip(treeArt[0], ([x]) => -x), ([x, y]) => y + x * cot);
const treeR = card(treeArt[0], treeArt[1], { geomPts: halfR, pxPerUnit: 56, folds: [], back: 'mirror' });
const treeL = card(treeArt[0], treeArt[1], { geomPts: halfL, pxPerUnit: 56, folds: [], back: 'mirror', materials: treeR.material });
treeR.name = 'tree right'; treeL.name = 'tree left'; scene.add(treeR, treeL); glowers.push(treeR, treeL);
const S = new THREE.Vector3(0, 0, -1);   // the spine, pointing away from the viewer: the V's ridge faces the camera

// Santa's sleigh on a paper arm pinned at the back of the gutter: it folds flat with the card and, open, swings
const armHinge = new THREE.Group(); armHinge.position.set(0, 0.02, -PD / 2 + 0.6); right.add(armHinge);
const armSwing = new THREE.Group(); armHinge.add(armSwing);
{ const L = 8.2; const strip = card(rect(-0.16, 0.16, 0, L), (P) => { P.gradient('#e9e2d2', '#cfc6b4', 0); P.felt(0.4); }, { pxPerUnit: 32, folds: ['bottom'] }); armSwing.add(strip);
  const [pts, paint] = sleighCard(); const sl = card(pts, paint, { pxPerUnit: 56 }); sl.position.set(-1.6, L - 1.1, 0.1); armSwing.add(sl); }
const armFlap = { hinge: armHinge, at: 0.82, x: 0, v: 0 };

// ---- light and lens: Christmas Eve indoors, warm key from the left, cool fill -----------------------------------
const target = new THREE.Vector3(0, 0, 0);
const lights = paperLights(scene, { target: new THREE.Vector3(0, 0, -1), key: '#ffc9a0', keyIntensity: 3.1, keyDir: [-0.85, 0.62, 0.45], fill: '#8a92c8', fillIntensity: 1.1, fillDir: [0.45, 0.5, 1.0],
  sky: '#b4b8de', ground: '#5a4038', skyIntensity: 0.9, shadowExtent: 30, distance: 90, mapSize: 4096 });
PAPER_LIGHT.leak.value.set('#55609e');
enableSoftShadows(lights.key, { softness: 0.26, maxPenumbra: 1.2 });
for (const [x, y, z] of [[6.2, 1.6, -6.6], [13.2, 1.4, -4.9], [-6.4, 1.6, -7.0], [0, 4, 2.5]]) { const p = new THREE.PointLight('#ffb070', 5, 9, 1.0); p.position.set(x, y, z); scene.add(p); }
const post = new PaperPost(renderer, scene, camera, { haze: '#2a1c18', hazeStart: 30, hazeEnd: 90, hazeAmount: 0.25, focusBand: 0.42, ramp: 0.34, maxBlur: 12,
  tint: [1.0, 0.98, 1.02], saturation: 0.98, greenDesat: 0.25, exposure: 1.0, contrast: 1.14, vignette: 0.18, vignetteColor: '#140c08', shadowTint: '#2a3060', aoTint: '#3a3a6a' });
post.setSize(W0, H0);

// ---- life: snow over the card, smoke from the chimneys ----------------------------------------------------------
const lifeCenter = new THREE.Vector3(0, 0, 0);
const life = createLife({ scene, camera, heroHeight: 3.6, seed: 41, wind: [0.4, 0.15], box: { w: 10, d: 6.7, h: 4 } });
life.fallers({ count: 120, cut: 'flake', colors: ['#ffffff', '#f6f4ee', '#e6ecf6'], size: [0.16, 0.26], fall: [0.35, 0.6], sway: 0.6, tumble: 1.0, land: 6 });
life.puffs({ at: chimneys, perEmitter: 3, life: 4.5, rise: 0.45, size: [0.2, 0.42], colors: ['#eceaf0', '#e0dfe8'] });
life.setNight(0.5);

// ---- the clock: one fixed-step simulation drives everything (captures repeat exactly) ----------------------------
const OPEN0 = 0.6, OPEN1 = 3.4, TH0 = 0.07;          // the cover lifts at OPEN0 and lands at OPEN1
let t = 0;
const ease = (x) => x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
const smooth = (a, b, x) => { const u = Math.min(1, Math.max(0, (x - a) / (b - a))); return u * u * u * (u * (u * 6 - 15) + 10); };
function openAngle(t) {   // the angle between the pages: ~0 closed, PI flat open; lands with one small slap
  if (t < OPEN0) return TH0;
  const p = (t - OPEN0) / (OPEN1 - OPEN0);
  if (p < 1) return TH0 + (Math.PI - TH0) * ease(p);
  const s = t - OPEN1; return Math.PI - 0.05 * Math.exp(-s * 7) * Math.abs(Math.sin(s * 14));
}
const _m = new THREE.Matrix4(), _ex = new THREE.Vector3(), _ez = new THREE.Vector3(), _up = new THREE.Vector3(), _c = new THREE.Vector3(), _g = new THREE.Vector3();
function placeTree(theta, phi) {
  const pR = new THREE.Vector3(1, 0, 0), pL = new THREE.Vector3(-Math.cos(phi), -Math.sin(phi), 0);
  _up.copy(pR).add(pL); if (_up.lengthSq() < 1e-6) _up.set(0, 1, 0); _up.normalize();
  const A = Math.cos(ALPHA), B = Math.sin(ALPHA) * pR.dot(_up), R = Math.hypot(A, B), psi = Math.atan2(B, A) + Math.acos(Math.min(1, Math.cos(GAMMA) / R));
  _c.copy(S).multiplyScalar(Math.cos(psi)).addScaledVector(_up, Math.sin(psi));
  for (const [mesh, p, sgn] of [[treeR, pR, 1], [treeL, pL, -1]]) {
    _g.copy(S).multiplyScalar(Math.cos(ALPHA)).addScaledVector(p, Math.sin(ALPHA));
    _ex.copy(_g).addScaledVector(_c, -Math.cos(GAMMA)).normalize().multiplyScalar(sgn);
    _ez.crossVectors(_ex, _c);
    _m.makeBasis(_ex, _c, _ez); mesh.quaternion.setFromRotationMatrix(_m);
    mesh.position.set(0, 0.03, TREE_Z).addScaledVector(_ez, 0.05);
  }
}
const CAM = { from: { tx: 9, ty: 0, tz: -0.3, pitch: 66, dist: 54 }, to: { tx: 0, ty: 3.6, tz: -1.0, pitch: 40, dist: 56 } };
function placeCamera(t) {
  const k = ease(Math.min(1, Math.max(0, (t - 0.3) / 3.6))), L = (a, b) => a + (b - a) * k, f = CAM.from, e = CAM.to;
  const tall = Math.max(1, (16 / 9) / camera.aspect);   // a frame narrower than 16:9 steps back to keep the spread
  const pitch = L(f.pitch, e.pitch) * Math.PI / 180, dist = L(f.dist, e.dist) * (1 + (tall - 1) * 0.75) * (1 + 0.012 * Math.sin(t * 0.35)), yaw = Math.sin(t * 0.21) * 0.025 * k;
  target.set(L(f.tx, e.tx), L(f.ty, e.ty), L(f.tz, e.tz));
  camera.position.set(target.x + Math.sin(yaw) * Math.cos(pitch) * dist, target.y + Math.sin(pitch) * dist, target.z + Math.cos(yaw) * Math.cos(pitch) * dist);
  camera.lookAt(target);
}
function update(dt) {
  t += dt;
  const theta = openAngle(t), phi = -(Math.PI - theta), open = theta / Math.PI;
  leftPivot.rotation.z = phi; leftPivot.position.y = 0.45 * (1 - smooth(0, 0.35, open));   // the closed stack's thickness at the spine
  placeTree(theta, phi);
  // flaps: each stands up over its own stretch of the opening, on a spring (a small overshoot and quiver, still by ~1 s)
  for (const f of [...flaps, armFlap]) {
    const a0 = 0.55 + (f.at - 0.36) * 0.6, goal = smooth(a0, Math.min(1, a0 + 0.2), open);   // nothing stands before the cover has passed upright
    f.v += (220 * (goal - f.x) - 17 * f.v) * dt; f.x += f.v * dt;
    f.hinge.rotation.x = -(Math.PI / 2) * (1 - Math.min(1.12, f.x));
  }
  // the world moves once the card lies open
  const live = smooth(OPEN1 - 0.2, OPEN1 + 1.4, t);
  armSwing.rotation.z = Math.sin((t - OPEN1) * 0.9) * 0.62 * live;
  skaters.forEach((s, i) => { const sl = SLOTS[i], u = (t - OPEN1) * 0.55 + i * 1.3, mid = (sl.x0 + sl.x1) / 2, half = (sl.x1 - sl.x0) / 2 - 1.1; s.hinge.position.x = mid + Math.sin(u) * half * (i ? -1 : 1) * live + (i ? 2.1 : -2.1) * (1 - live); s.mesh.rotation.z = Math.cos(u) * 0.08 * live; });
  armPivot.rotation.z = (0.2 + Math.sin(t * 3.2) * 0.4) * live;
  const glow = 0.25 + 1.15 * smooth(OPEN1 - 0.4, OPEN1 + 0.6, t);
  for (const m of glowers) m.userData.setGlow?.(glow * (0.92 + 0.08 * Math.sin(t * 5 + m.id)));
  life.update(dt, lifeCenter);
}
function render() { placeCamera(t); post.focus.set(0, 3.5, 0.5); post.render(t); }
function restart() { t = 0; for (const f of [...flaps, armFlap]) { f.x = 0; f.v = 0; } life.reset(lifeCenter); update(0); }
function step(sec) { const n = Math.max(1, Math.round(sec * 240)), dt = sec / n; for (let i = 0; i < n; i++) update(dt); render(); }

restart(); render();
let manual = false, last = performance.now();
renderer.domElement.addEventListener('pointerdown', () => restart());
(function loop(now) { requestAnimationFrame(loop); if (manual) return; const dt = Math.min(0.05, Math.max(0, (now - last) / 1000)); last = now; step(dt); })(performance.now());
window.__papercraft = {
  ready: true, buildMs: Math.round(performance.now() - T0), pieces: flaps.length + 3,
  restart: () => { manual = true; restart(); render(); }, step: (s) => { manual = true; step(s); }, resume: () => { manual = false; last = performance.now(); },
  frame: { w: W0, h: H0, fovY: camera.fov }, scene, camera, post, get t() { return t; },
};
