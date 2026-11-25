// A 90-degree Christmas pop-up card: the cover lifts and stops upright as the back wall (a night sky with a moon), and
// every piece rides a parallel fold between the floor and the wall: it stands parallel to the wall at its own depth and
// lies flat, face down, when the card closes. Santa's sleigh rides an arc slot in the sky (a hidden volvelle), skaters
// glide in slots on the pond, smoke curls from the chimneys, snow falls, and the message is written on a paper sign at
// the front. The pieces are Codex illustrations cut out along their outlines (art.js); built with the papercraft kit (MIT).
import * as THREE from 'three';
import * as P2 from 'papercraft/lib/paperkit-2d.js';
import { paperTextures, makeCard, paperLights, enableSoftShadows, PaperPost, PAPER_LIGHT, paperMaterial } from 'papercraft/lib/paperkit-3d.js';
import { createLife } from 'papercraft/lib/paper-life.js';
import { loadArt, artPiece } from 'papercraft/art.js';
import { getMessage, loadMessageFont, mountMessageUI } from 'papercraft/message.js';
import { signPiece } from 'papercraft/sign.js';

const T0 = performance.now();
const Q = new URLSearchParams(location.search);
if (Q.has('capture')) document.getElementById('hint')?.remove();
const SIZE = (Q.get('size') || '').match(/^(\d+)x(\d+)$/);
const W0 = SIZE ? +SIZE[1] : innerWidth, H0 = SIZE ? +SIZE[2] : innerHeight;
const MSG = getMessage();
const FONT = 'Nanum Pen Script';
const [ART] = await Promise.all([
  loadArt(['tree', 'pine-a', 'pine-b', 'house-a', 'house-b', 'house-c', 'santa', 'reindeer', 'snowman', 'skater-a', 'skater-b', 'sleigh', 'gifts', 'lamp'], window.ART_BASE || './codex/art/', window.ART_EXT || 'png'),
  loadMessageFont(FONT),
]);
const A = (n, h) => artPiece(ART[n], h, { name: n });

// ---- card dimensions: the floor is 2*PW wide (x) and PD deep (z, toward the viewer); the wall is WH tall ----------
const PW = 13, PD = 16, WH = 16, TH = 0.09;

const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance', preserveDrawingBuffer: true });
renderer.setPixelRatio(SIZE ? 1 : Math.min(devicePixelRatio, 2));
renderer.setSize(W0, H0);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.BasicShadowMap;
document.body.appendChild(renderer.domElement);
const scene = new THREE.Scene(); scene.background = new THREE.Color('#1e1410');
const camera = new THREE.PerspectiveCamera(26, W0 / H0, 5, 600);
const paper = paperTextures(renderer, { color: '#f4f2ee', unitsPerTile: 6 });
let seedN = 900;
const card = (pts, paint, o = {}) => makeCard(pts, { paint, paper, seed: seedN++, thickness: 0.08, edgeWidth: 0.07, pxPerUnit: 48, ...o });
const glowers = [];
const rect = (x0, x1, y0, y1) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
const B = (...v) => new THREE.Matrix4().makeBasis(...v.map((a) => new THREE.Vector3(...a)));

// ---- the table -----------------------------------------------------------------------------------------------------
{
  const c = document.createElement('canvas'); c.width = 2048; c.height = 1536; const g = c.getContext('2d'), r = P2.rng(5);
  g.fillStyle = '#3e271c'; g.fillRect(0, 0, 2048, 1536);
  for (let i = 0; i < 260; i++) { const y = r() * 1536, a = 0.05 + r() * 0.12; g.strokeStyle = r() < 0.5 ? `rgba(20,10,6,${a})` : `rgba(120,78,50,${a})`; g.lineWidth = 1 + r() * 5; g.beginPath(); g.moveTo(0, y); for (let x = 0; x <= 2048; x += 64) g.lineTo(x, y + Math.sin(x * 0.004 + i) * 8 + Math.sin(x * 0.013 + i * 3) * 3); g.stroke(); }
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(140, 100), paperMaterial({ map: tex, normalMap: paper.normalMap.clone(), normalScale: 0.3 }));
  m.rotation.x = -Math.PI / 2; m.position.set(0, -TH, 6); m.receiveShadow = true; scene.add(m);
}

// ---- the floor: snow, a frozen pond with two skater slots, a trodden path, a gold border -----------------------------
// floor shape: x -> world x, shape y -> world -z (shape y runs -PD..0, so world z runs 0..PD toward the viewer)
const POND = { x: -8.2, y: -10.2, rx: 4.2, ry: 1.9 };
const SLOTS = [{ x0: -11.4, x1: -5.0, z: 9.5 }, { x0: -11.0, x1: -4.6, z: 11.1 }];
const floorPaint = (P) => {
  const { g, r, box } = P;
  P.gradient('#eef0f5', '#dde1ea', 0.2); P.felt(0.35);
  for (let i = 0; i < 36; i++) { const x = box.x0 + r() * box.w, y = box.y0 + r() * box.h, rr = 1 + r() * 3; const gr = g.createRadialGradient(x, y, 0, x, y, rr); gr.addColorStop(0, 'rgba(196,204,226,0)'); gr.addColorStop(0.8, 'rgba(196,204,226,0.26)'); gr.addColorStop(1, 'rgba(196,204,226,0)'); g.fillStyle = gr; g.fillRect(x - rr, y - rr, rr * 2, rr * 2); }
  // the path from the front toward the cottages
  const path = [[6, -16], [5.4, -12.5], [3.6, -9], [2.2, -6.2], [1.4, -3.5]];
  g.strokeStyle = '#cfd5e2'; g.lineWidth = 1.8; g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath(); path.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.stroke();
  P.layer((gg) => { gg.beginPath(); for (let i = 0; i <= 60; i++) { const a = i / 60 * Math.PI * 2, w = 1 + 0.06 * Math.sin(a * 3) + 0.04 * Math.sin(a * 7); gg.lineTo(POND.x + Math.cos(a) * POND.rx * w, POND.y + Math.sin(a) * POND.ry * w); } gg.closePath(); gg.fill(); }, '#bcd0e4', { lip: 0.8, shade: 0.6, depth: 0.8 });
  P.draw((gg) => {
    gg.strokeStyle = 'rgba(255,255,255,0.75)'; gg.lineWidth = 0.07; for (let k = 0; k < 6; k++) { gg.beginPath(); gg.ellipse(POND.x + (k - 3) * 0.6, POND.y + Math.sin(k) * 0.4, 1.0 + k * 0.3, 0.35 + k * 0.08, 0.15 * k, 0, 4.5); gg.stroke(); }
    gg.fillStyle = '#3a3048'; for (const s of SLOTS) gg.fillRect(s.x0, -s.z - 0.07, s.x1 - s.x0, 0.14);
    gg.strokeStyle = '#c99a3c'; gg.lineWidth = 0.12; gg.strokeRect(box.x0 + 0.7, box.y0 + 0.7, box.w - 1.4, box.h - 1.4);
    const gr = gg.createLinearGradient(0, 0, 0, -1.6); gr.addColorStop(0, 'rgba(85,96,158,0.25)'); gr.addColorStop(1, 'rgba(85,96,158,0)'); gg.fillStyle = gr; gg.fillRect(box.x0, -1.6, box.w, 1.6);
  });
};
const floor = card(rect(-PW, PW, -PD, 0), floorPaint, { pxPerUnit: 56, edgeWidth: 0.05, folds: () => false, contact: null, back: 'kraft' });
floor.quaternion.setFromRotationMatrix(B([1, 0, 0], [0, 0, -1], [0, 1, 0])); floor.position.y = -TH / 2; scene.add(floor);

// ---- the wall: a night sky, the moon, stars, far snowy hills, the arc slot the sleigh rides ---------------------------
const ARC = { cx: 0, cy: 3.2, L: 9.6, a0: 0.78 };   // the volvelle's pivot (hidden behind the wall), radius, sweep
const wallPaint = (P) => {
  const { g, r, box } = P;
  const gr = g.createLinearGradient(0, box.y1, 0, box.y0); gr.addColorStop(0, '#141a3e'); gr.addColorStop(0.6, '#2a3570'); gr.addColorStop(1, '#4a5a98'); g.fillStyle = gr; g.fillRect(box.x0, box.y0, box.w, box.h);
  P.felt(0.5);
  const stars = []; for (let i = 0; i < 90; i++) stars.push([box.x0 + r() * box.w, 5 + r() * (box.h - 5), 0.03 + r() * 0.07]);
  P.draw((gg) => { gg.fillStyle = '#fff6dc'; for (const [x, y, s] of stars) { gg.beginPath(); gg.arc(x, y, s, 0, 7); gg.fill(); } });
  P.layer((gg) => { for (const [x, y, s] of [[-9.5, 13.2, 0.34], [-4.2, 15.0, 0.26], [5.4, 15.2, 0.3], [11.2, 9.8, 0.24], [-11.6, 8.6, 0.22]]) { gg.beginPath(); for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + k * Math.PI / 5, rr = k % 2 ? s * 0.42 : s; gg.lineTo(x + Math.cos(a) * rr, y - Math.sin(a) * rr); } gg.closePath(); gg.fill(); } }, '#f3d27a', { lip: 0.8, shadow: 0.8 });
  P.layer((gg) => { gg.beginPath(); gg.arc(8.6, 12.6, 1.7, 0, 7); gg.fill(); }, '#f6ecd0', { lip: 0.9, shadow: 1.1 });
  P.draw((gg) => { gg.fillStyle = 'rgba(200,184,150,0.55)'; for (const [x, y, s] of [[8.1, 13.1, 0.32], [9.2, 12.2, 0.22], [8.4, 11.9, 0.16]]) { gg.beginPath(); gg.arc(x, y, s, 0, 7); gg.fill(); } });
  // far hills: two pale scalloped layers along the bottom
  P.layer((gg) => { gg.beginPath(); gg.moveTo(box.x0, 0); for (let x = box.x0; x <= box.x1; x += 0.5) gg.lineTo(x, 4.6 + Math.sin(x * 0.35) * 0.9 + Math.sin(x * 0.9) * 0.25); gg.lineTo(box.x1, 0); gg.closePath(); gg.fill(); }, '#8f9cc8', { lip: 0.7, shadow: 1 });
  P.layer((gg) => { gg.beginPath(); gg.moveTo(box.x0, 0); for (let x = box.x0; x <= box.x1; x += 0.5) gg.lineTo(x, 3.0 + Math.sin(x * 0.28 + 2) * 0.8 + Math.sin(x * 1.1) * 0.2); gg.lineTo(box.x1, 0); gg.closePath(); gg.fill(); }, '#c3cbe4', { lip: 0.7, shadow: 1 });
  P.draw((gg) => { gg.strokeStyle = 'rgba(10,12,30,0.75)'; gg.lineWidth = 0.13; gg.lineCap = 'round'; gg.beginPath(); for (let i = 0; i <= 50; i++) { const a = -ARC.a0 - 0.08 + (2 * ARC.a0 + 0.16) * i / 50; gg.lineTo(ARC.cx - Math.sin(a) * ARC.L, ARC.cy + Math.cos(a) * ARC.L); } gg.stroke(); });
  P.draw((gg) => { gg.save(); gg.translate(-2.2, 14.9); gg.scale(0.01, -0.01); gg.textAlign = 'center'; gg.textBaseline = 'middle'; gg.font = `italic 700 96px Georgia, serif`; gg.fillStyle = '#f2c766'; gg.fillText('Merry Christmas', 0, 0); gg.restore(); });
  P.draw((gg) => { gg.strokeStyle = '#c99a3c'; gg.lineWidth = 0.1; gg.strokeRect(box.x0 + 0.6, box.y0 + 0.6, box.w - 1.2, box.h - 1.2); });
  P.glow((gc) => { for (const [x, y, s] of stars) { gc.globalAlpha = 0.5; gc.beginPath(); gc.arc(x, y, s, 0, 7); gc.fill(); } gc.globalAlpha = 0.45; gc.beginPath(); gc.arc(8.6, 12.6, 1.7, 0, 7); gc.fill(); });
};
const coverPaint = (P) => {
  const { box, g } = P;
  P.gradient('#b8382f', '#8a2a26', 0.3); P.felt(0.6);
  P.layer((gg) => { gg.beginPath(); gg.rect(box.x0 + 0.8, box.y0 + 0.8, box.w - 1.6, box.h - 1.6); gg.rect(box.x0 + 1.15, box.y0 + 1.15, box.w - 2.3, box.h - 2.3); gg.fill('evenodd'); }, '#d9a441', { lip: 0.9 });
  const cx = 0, by = box.y0 + 3.4;
  P.layer((gg) => { for (let i = 0; i < 4; i++) { const hw = 3.6 - i * 0.8, yb = by + i * 1.7; gg.beginPath(); gg.moveTo(cx - hw, yb); gg.lineTo(cx + hw, yb); gg.lineTo(cx, yb + 2.7); gg.closePath(); gg.fill(); } }, '#2f5a46', { lip: 0.8, shadow: 1.2 });
  P.layer((gg) => { gg.beginPath(); for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + k * Math.PI / 5, rr = k % 2 ? 0.36 : 0.85; gg.lineTo(cx + Math.cos(a) * rr, by + 3 * 1.7 + 2.9 - Math.sin(a) * rr); } gg.closePath(); gg.fill(); }, '#f0c050', { lip: 1 });
  P.draw((gg) => { gg.save(); gg.translate(cx, box.y0 + 1.9); gg.scale(0.01, -0.01); gg.textAlign = 'center'; gg.textBaseline = 'middle'; gg.font = `italic 700 170px Georgia, serif`; gg.fillStyle = '#5a1a16'; gg.fillText('Merry Christmas', 6, 8); gg.fillStyle = '#f2c766'; gg.fillText('Merry Christmas', 0, 0); gg.restore(); });
  P.innerShade('#3a0c08', { alpha: 0.35, blurPx: 14 });
};
const wallPivot = new THREE.Group(); scene.add(wallPivot);            // rotates about the spine (the x axis)
const wall = card(rect(-PW, PW, 0, WH), wallPaint, { pxPerUnit: 56, edgeWidth: 0.05, folds: () => false, contact: null, back: false });
wall.position.z = 0; wallPivot.add(wall); glowers.push(wall);
{ // the cover glued behind the wall: upright from the front while the card lies closed
  const cov = card(rect(-PW, PW, -WH, 0), coverPaint, { pxPerUnit: 48, edgeWidth: 0.05, folds: () => false, contact: null, back: false });
  cov.quaternion.setFromRotationMatrix(B([1, 0, 0], [0, -1, 0], [0, 0, -1])); cov.position.z = -TH; wallPivot.add(cov);
}

// ---- parallel folds: a face parallel to the wall at depth d, a deck tab at height ht glued to the wall -------------
const folds = [];
function pfold(piece, { x, d, ht = piece.h * 0.55, name = '', glow = false, tab = 0.9 }) {
  const face = card(piece[0], piece[1], { pxPerUnit: 64 }); face.name = name; scene.add(face);
  const deck = card(rect(-tab / 2, tab / 2, 0, d), (P) => { P.gradient('#ebe6dc', '#d9d2c4', 0); P.felt(0.3); }, { pxPerUnit: 24, folds: [], contact: null });
  deck.visible = false; scene.add(deck);   // the deck tab hides behind the face in a real card: kept for the mechanism, not drawn
  if (glow) glowers.push(face);
  const f = { face, deck, x, d, ht, lift: 0.012 + folds.length * 0.004, piece }; folds.push(f); return f;
}
const chimneys = [];
const house = (n, h, x, d) => { const p = A(n, h), f = pfold(p, { x, d, name: n, glow: true, ht: h * 0.5 }); chimneys.push({ object: f.face, offset: [p.chimney[0], p.chimney[1], 0] }); return f; };
// back row: pines and the big tree; then the cottages; then the villagers
pfold(A('pine-b', 6.4), { x: -11.3, d: 1.0, name: 'pine' });
pfold(A('pine-a', 8.4), { x: -3.8, d: 0.8, name: 'pine' });
pfold(A('pine-a', 7.4), { x: 4.4, d: 0.8, name: 'pine' });
house('house-c', 6.4, 10.6, 1.6);
pfold(A('tree', 11), { x: 0, d: 1.9, name: 'tree', glow: true, ht: 6 });
house('house-a', 6.2, -7.4, 3.2);
house('house-b', 5.0, 6.3, 3.6);
pfold(A('lamp', 4.6), { x: -2.4, d: 5.4, name: 'lamp', glow: true, ht: 3.4 });
pfold(A('lamp', 4.6), { x: 11.6, d: 6.2, name: 'lamp', glow: true, ht: 3.4 });
const sman = pfold(A('snowman', 3.6), { x: -10.2, d: 6.4, name: 'snowman' });
pfold(A('santa', 3.8), { x: 3.6, d: 6.8, name: 'santa' });
pfold(A('reindeer', 3.2), { x: 7.8, d: 7.2, name: 'reindeer' });
pfold(A('gifts', 1.9), { x: -4.4, d: 7.4, name: 'gifts', ht: 1.2 });
pfold(A('pine-b', 3.4), { x: 11.8, d: 10.8, name: 'pine' });

// the message sign at the front: cream paper on a parallel fold, written in the card's handwriting font
const SIGN = { w: 12.6, h: 3.4, x: 3.6, d: 12.2 };
pfold(signPiece(MSG, { w: SIGN.w, h: SIGN.h, font: FONT }), { ...SIGN, name: 'message', ht: 1.6, tab: 1.6 });

// skaters: floor flaps standing in the pond's slots, sliding once the card is open
const flaps = [];
function flap(piece, { x, z, at = 0.6, name = '' }) {
  const hinge = new THREE.Group(); hinge.position.set(x, 0.01 + flaps.length * 0.004, z); scene.add(hinge);
  const m = card(piece[0], piece[1], { pxPerUnit: 64 }); m.name = name; hinge.add(m);
  const f = { hinge, mesh: m, at, x: 0, v: 0 }; flaps.push(f); return f;
}
const skaters = [flap(A('skater-a', 2.5), { x: -8.2, z: SLOTS[0].z, at: 0.55, name: 'skater 1' }), flap(A('skater-b', 2.5), { x: -7.8, z: SLOTS[1].z, at: 0.6, name: 'skater 2' })];

// Santa's sleigh: on the hidden volvelle's arm, it pokes through the arc slot and flies across the sky
const sleigh = new THREE.Group(); wall.add(sleigh);
{ const p = A('sleigh', 2.7), m = card(p[0], p[1], { pxPerUnit: 72, folds: [] }); m.position.set(0, -p.h * 0.45, 0.14); sleigh.add(m); }

// ---- light and lens ------------------------------------------------------------------------------------------------
const lights = paperLights(scene, { target: new THREE.Vector3(0, 4, 4), key: '#ffc9a0', keyIntensity: 3.0, keyDir: [-0.7, 0.75, 0.85], fill: '#8a92c8', fillIntensity: 1.1, fillDir: [0.6, 0.45, 1.0],
  sky: '#b4b8de', ground: '#5a4038', skyIntensity: 0.9, shadowExtent: 26, distance: 80, mapSize: 4096 });
PAPER_LIGHT.leak.value.set('#55609e');
enableSoftShadows(lights.key, { softness: 0.26, maxPenumbra: 1.2 });
for (const [x, y, z] of [[-7.4, 2.4, 4.6], [6.3, 2.0, 5.0], [10.6, 2.4, 3.0], [0, 5, 3.2]]) { const p = new THREE.PointLight('#ffb070', 5, 9, 1.0); p.position.set(x, y, z); scene.add(p); }
const post = new PaperPost(renderer, scene, camera, { haze: '#2a1c18', hazeStart: 30, hazeEnd: 90, hazeAmount: 0.2, focusBand: 0.5, ramp: 0.34, maxBlur: 10,
  tint: [1.0, 0.98, 1.02], saturation: 0.98, greenDesat: 0.2, exposure: 1.0, contrast: 1.12, vignette: 0.18, vignetteColor: '#140c08', shadowTint: '#2a3060', aoTint: '#3a3a6a' });
post.setSize(W0, H0);

// ---- life ----------------------------------------------------------------------------------------------------------
const lifeCenter = new THREE.Vector3(0, 0, 6);
const life = createLife({ scene, camera, heroHeight: 3.6, seed: 43, wind: [0.4, 0.15], box: { w: 8, d: 5, h: 4.4 } });
life.fallers({ count: 110, cut: 'flake', colors: ['#ffffff', '#f6f4ee', '#e6ecf6'], size: [0.16, 0.26], fall: [0.35, 0.6], sway: 0.6, tumble: 1.0, land: 6 });
life.puffs({ at: chimneys, perEmitter: 3, life: 4.5, rise: 0.45, size: [0.16, 0.3], colors: ['#eceaf0', '#e0dfe8'] });
life.setNight(0.5);

// ---- the clock -----------------------------------------------------------------------------------------------------
const OPEN0 = 0.6, OPEN1 = 3.2, TH0 = 0.035;
let t = 0;
const ease = (x) => x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
const smooth = (a, b, x) => { const u = Math.min(1, Math.max(0, (x - a) / (b - a))); return u * u * u * (u * (u * 6 - 15) + 10); };
function openAngle(t) {   // the angle between floor and wall: ~0 closed, PI/2 open; one small slap as it lands upright
  if (t < OPEN0) return TH0;
  const p = (t - OPEN0) / (OPEN1 - OPEN0);
  if (p < 1) return TH0 + (Math.PI / 2 - TH0) * ease(p);
  const s = t - OPEN1; return Math.PI / 2 - 0.035 * Math.exp(-s * 7) * Math.abs(Math.sin(s * 14));
}
const _m = new THREE.Matrix4();
const flatQ = new THREE.Quaternion().setFromRotationMatrix(B([1, 0, 0], [0, 0, -1], [0, 1, 0]));
const CAM = { from: { tx: 0, ty: 0, tz: 7.5, pitch: 64, dist: 60 }, to: { tx: 0, ty: 6.2, tz: 5.6, pitch: 19, dist: 50 } };
function placeCamera(t) {
  const k = ease(Math.min(1, Math.max(0, (t - 0.3) / 3.8))), L = (a, b) => a + (b - a) * k, f = CAM.from, e = CAM.to;
  const tall = Math.max(1, (16 / 9) / camera.aspect);
  const pitch = L(f.pitch, e.pitch) * Math.PI / 180, dist = L(f.dist, e.dist) * (1 + (tall - 1) * 0.75) * (1 + 0.012 * Math.sin(t * 0.35)), yaw = Math.sin(t * 0.23) * 0.05 * k;
  const target = new THREE.Vector3(L(f.tx, e.tx), L(f.ty, e.ty), L(f.tz, e.tz));
  camera.position.set(target.x + Math.sin(yaw) * Math.cos(pitch) * dist, target.y + Math.sin(pitch) * dist, target.z + Math.cos(yaw) * Math.cos(pitch) * dist);
  camera.lookAt(target);
}
function update(dt) {
  t += dt;
  const theta = openAngle(t), a = Math.PI / 2 - theta, open = theta / (Math.PI / 2), s = Math.sin(theta), c = Math.cos(theta);
  wallPivot.rotation.x = a; wallPivot.position.y = 0.5 * (1 - smooth(0, 0.3, open));
  for (const f of folds) {   // the parallelogram: face parallel to the wall from the floor at depth d, deck level at height ht
    f.face.rotation.set(a, 0, 0); f.face.position.set(f.x, f.lift, f.d);
    f.deck.quaternion.copy(flatQ); f.deck.position.set(f.x, f.ht * s + f.lift - 0.03, f.d + f.ht * c);
  }
  for (const f of flaps) {
    const a0 = 0.5 + (f.at - 0.4) * 0.5, goal = smooth(a0, Math.min(1, a0 + 0.25), open);
    f.v += (220 * (goal - f.x) - 17 * f.v) * dt; f.x += f.v * dt;
    f.hinge.rotation.x = -(Math.PI / 2) * (1 - Math.min(1.12, f.x));
  }
  const live = smooth(OPEN1 - 0.2, OPEN1 + 1.2, t);
  // the sleigh: one sweep left to right across the sky, then it hovers with a little bob (loops every 16 s)
  const tt = (t - OPEN1 + 0.4) % 16, sweep = ease(Math.min(1, Math.max(0, tt / 6.2))), phi = (ARC.a0 - 2 * ARC.a0 * sweep) * (t < OPEN1 - 0.4 ? 1 : 1);
  sleigh.position.set(ARC.cx - Math.sin(phi) * ARC.L, ARC.cy + Math.cos(phi) * ARC.L + Math.sin(t * 2.4) * 0.08 * live, 0);
  sleigh.rotation.z = phi * 0.9 + Math.sin(t * 2.4 + 1) * 0.03;
  skaters.forEach((sk, i) => { const sl = SLOTS[i], u = (t - OPEN1) * 0.6 + i * 1.6, mid = (sl.x0 + sl.x1) / 2, half = (sl.x1 - sl.x0) / 2 - 1.0; sk.hinge.position.x = mid + Math.sin(u) * half * (i ? -1 : 1) * live; sk.mesh.rotation.z = Math.cos(u) * 0.07 * live; });
  sman.face.rotation.z = Math.sin(t * 1.7) * 0.04 * live;
  const glow = 0.25 + 1.15 * smooth(OPEN1 - 0.4, OPEN1 + 0.6, t);
  for (const m of glowers) m.userData.setGlow?.(glow * (m === wall ? 0.6 : 1) * (0.92 + 0.08 * Math.sin(t * 5 + m.id)));
  life.update(dt, lifeCenter);
}
function render() { placeCamera(t); post.focus.set(0, 4, 6); post.render(t); }
function restart() { t = 0; for (const f of flaps) { f.x = 0; f.v = 0; } life.reset(lifeCenter); update(0); }
function step(sec) { const n = Math.max(1, Math.round(sec * 240)), dt = sec / n; for (let i = 0; i < n; i++) update(dt); render(); }

restart(); render();
mountMessageUI();
let manual = false, last = performance.now();
renderer.domElement.addEventListener('pointerdown', () => restart());
addEventListener('resize', () => { if (SIZE) return; renderer.setSize(innerWidth, innerHeight); post.setSize(innerWidth, innerHeight); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); });
(function loop(now) { requestAnimationFrame(loop); if (manual) return; const dt = Math.min(0.05, Math.max(0, (now - last) / 1000)); last = now; step(dt); })(performance.now());
window.__papercraft = {
  ready: true, buildMs: Math.round(performance.now() - T0), pieces: folds.length + flaps.length + 2,
  restart: () => { manual = true; restart(); render(); }, step: (s) => { manual = true; step(s); }, resume: () => { manual = false; last = performance.now(); },
  frame: { w: W0, h: H0, fovY: camera.fov }, scene, camera, post, get t() { return t; },
};
