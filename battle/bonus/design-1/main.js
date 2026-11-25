// 북극성 우체국의 크리스마스이브: a 90-degree pop-up greeting card on a table.
// This file is the stage: renderer, light, lens, the table, the camera's one glide, the fixed clock and the capture
// hook. The card itself is card.js (structure and mechanisms), letter.js (the printed sheets), life.js (snow, smoke).
//
// PAPER SPEC
// SUBJECT  a post-office village on Christmas Eve inside a 32 x 20 x 20 card; first read: the lit village and the letter
// STOCK    heavy matte cardstock, quiet fibre; pictures printed on both faces of every die-cut
// LIGHT    one warm desk-lamp key from the upper left front (44 deg up), cool frontal fill, lilac-blue shadow leak
// LENS     25 deg, 27 deg down on the open card (57 deg on the closed cover), whole card sharp, the table falls off
// MOTION   wall on an eased pull + spring (3 deg overshoot), cards flutter 4.3 Hz, front rows a beat later
// LIFE     snow from above, chimney smoke, windows catching one by one, the sleigh on its rail, the snowman on the pond
const T0 = performance.now();
import * as THREE from 'three';
import { paperTextures, paperMaterial, paperLights, enableSoftShadows, PaperPost, PAPER_LIGHT } from 'papercraft/lib/paperkit-3d.js';
import { loadArt } from 'papercraft/art.js';
import { getMessage, loadMessageFont, mountMessageUI } from '../../kit/message.js';
import { buildCard, CARD, PIECE_NAMES, openAt } from './card.js';
import { woodCanvas } from './letter.js';
import { makeSnow, makeSmoke } from './life.js';

const Q = new URLSearchParams(location.search);
const CAPTURE = Q.has('capture');
const sizeM = /^(\d+)x(\d+)$/i.exec(Q.get('size') || '');
const SIZE = sizeM ? [Math.max(16, +sizeM[1]), Math.max(16, +sizeM[2])] : null;
const DEG = Math.PI / 180, FOV = 25, REF = 16 / 9;
const lerp = (a, b, t) => a + (b - a) * t;
const smoother = (t) => { t = Math.min(1, Math.max(0, t)); return t * t * t * (t * (t * 6 - 15) + 10); };

if (CAPTURE) document.getElementById('hint')?.remove();

const loadImage = (src) => new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = () => rej(new Error(`그림을 불러오지 못했어요: ${src}`)); im.src = src; });

async function boot() {
  const stage = document.getElementById('stage');
  const renderer = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.BasicShadowMap;
  stage.appendChild(renderer.domElement);

  const [art, backdrop, ground, cover] = await Promise.all([
    loadArt(PIECE_NAMES, '../art/'), loadImage('../art/backdrop.png'), loadImage('../art/ground.png'), loadImage('../art/cover.png'), loadMessageFont(),
  ]);
  const missing = PIECE_NAMES.filter((n) => !art[n]);
  if (missing.length) throw new Error(`그림이 없어요: ${missing.join(', ')}`);

  const scene = new THREE.Scene(); scene.background = new THREE.Color('#0d0a09');
  const camera = new THREE.PerspectiveCamera(FOV, REF, 8, 900);
  const paper = paperTextures(renderer, { color: '#fbf7ee', unitsPerTile: 7, seed: 9 });

  // ---- the table: walnut boards, running past every edge of the frame ----
  const wood = new THREE.CanvasTexture(woodCanvas());
  wood.colorSpace = THREE.SRGBColorSpace; wood.wrapS = wood.wrapT = THREE.RepeatWrapping; wood.anisotropy = renderer.capabilities.getMaxAnisotropy();
  wood.repeat.set(700 / 84, 700 / 84); wood.rotation = 0.05; wood.offset.set(0.13, 0.31);
  const table = new THREE.Mesh(new THREE.PlaneGeometry(700, 700), paperMaterial({ map: wood }));
  table.rotation.x = -Math.PI / 2; table.position.set(0, -CARD.T, 0); table.receiveShadow = true; scene.add(table);

  // ---- the card ----
  const card = buildCard({ art, images: { backdrop, ground, cover }, paper, message: getMessage() });
  scene.add(card.root);
  const snow = makeSnow(scene, { count: 150, start: 1.95, groundAt: (x, z) => (Math.abs(x) <= CARD.W / 2 && z >= 0 && z <= CARD.D ? 0.01 : -CARD.T + 0.01) });
  const smoke = makeSmoke(scene, camera, card.emitters, { per: 5, life: 3.4, rise: 1.1, size: [0.34, 1.0] });

  // ---- light: a warm lamp from the upper left front, a cool frontal fill; shadows fall right and back, in view ----
  PAPER_LIGHT.wrap.value = 0.32; PAPER_LIGHT.leak.value.set('#5a66a6'); PAPER_LIGHT.trans.value = 0.1; PAPER_LIGHT.transTint.value.set('#ffd2a0');
  const lights = paperLights(scene, { key: '#ffe6c6', keyIntensity: 2.75, keyDir: [-0.58, 0.9, 0.72], fill: '#b9c6ee', fillIntensity: 0.62, fillDir: [0.3, 0.45, 1.0],
    sky: '#cfd6f2', ground: '#6a5140', skyIntensity: 0.36, target: new THREE.Vector3(0, 5, 9), shadowExtent: 31, mapSize: 4096, distance: 90 });
  enableSoftShadows(lights.key, { softness: 0.2, maxPenumbra: 1.5, minPenumbra: 0.03, sheet: 0.3 });

  // ---- lens: the whole card sharp, the table softly out of focus and falling into the dark ----
  const post = new PaperPost(renderer, scene, camera, {
    focusBand: 0.62, ramp: 0.5, maxBlur: 7, nearGain: 1.2, farGain: 1.0, depthWeight: 0.85,
    falloff: 0.08, falloffTint: 0.04, edgeLine: 0.22, edgeLineColor: '#b6b2c6',
    ao: 1.0, aoRadius: 1.9, aoBias: 0.09, aoTint: '#2c3158',
    exposure: 0.86, tint: [1.01, 1.0, 0.99], saturation: 1.03, contrast: 1.08, greenDesat: 0, shadowTint: '#141a3a', shadowLift: 0.02,
    haze: '#0b0908', hazeStart: 30, hazeEnd: 120, hazeAmount: 0.9, vignette: 0.2, vignetteColor: '#07060a', grain: 0.011, chroma: 0.4, sharpen: 0.28,
  });

  // ---- the frame: ?size=WxH renders exactly that many pixels at pixel ratio 1; otherwise the window ----
  const frame = { w: 0, h: 0, fovY: FOV };
  let back = 1;
  function resize() {
    const w = SIZE ? SIZE[0] : Math.max(16, innerWidth), h = SIZE ? SIZE[1] : Math.max(16, innerHeight);
    renderer.setPixelRatio(SIZE ? 1 : Math.min(devicePixelRatio || 1, 2, Math.sqrt(4.2e6 / (w * h))));   // a big window keeps its frame rate
    renderer.setSize(w, h, false);
    const k = SIZE ? Math.min(innerWidth / w, innerHeight / h, 1) || 1 : 1, el = renderer.domElement;
    el.style.width = `${Math.round(w * k)}px`; el.style.height = `${Math.round(h * k)}px`;
    const a = w / h;                                       // a frame narrower than 16:9 steps back, so the card's width stays in view
    camera.aspect = a; camera.fov = FOV; camera.updateProjectionMatrix(); back = Math.max(1, REF / a);
    post.setSize(w, h);
    Object.assign(frame, { w, h, fovY: camera.fov });
  }
  addEventListener('resize', () => { resize(); if (!auto) draw(); });

  // ---- camera: looks down on the closed cover, glides once to the front of the open card, then only drifts ----
  const tgt = new THREE.Vector3();
  function placeCamera(t) {
    // it comes down to the front early, while the cover is still low: the wall then rises toward the lens like a stage
    // flat and the village is seen from the front as it stands up (never from above, where the cards show their backs)
    const s = smoother((t - 0.3) / 1.5), up = Math.sin(Math.min(1, openAt(t)) * Math.PI / 2);     // up: how tall the card stands now
    const pitch = lerp(55, 27, s) * DEG, yaw = smoother((t - 1.2) / 2.2) * 4.2 * DEG * Math.sin(2 * Math.PI * (t - 6.5) / 14);
    const ea = Math.pow(up, 1.3), dist = lerp(52.5, 73, Math.pow(up, 0.8)) * (1 - 0.01 * s * Math.sin(2 * Math.PI * (t - 3) / 19)) * back;
    tgt.set(lerp(0, -0.2, s), lerp(0.3, 7.8, ea), lerp(11.2, 8.3, ea));               // the frame follows the card as it grows
    camera.position.set(tgt.x + dist * Math.sin(yaw) * Math.cos(pitch), tgt.y + dist * Math.sin(pitch), tgt.z + dist * Math.cos(yaw) * Math.cos(pitch));
    camera.lookAt(tgt);
    post.focus.set(0, lerp(0.2, 6, ea), lerp(10, 8.5, ea));
    post.o.focusBand = lerp(0.95, 0.62, s);
  }

  // ---- the clock: one time value; every pose is a pure function of it ----
  let time = 0, auto = true, last = performance.now();
  function draw() { card.pose(time); snow.update(time); placeCamera(time); smoke.update(time); post.render(time); }
  function restart() { time = 0; card.pose(0); }
  function step(sec) { auto = false; time += Math.max(0, +sec || 0); draw(); return time; }
  renderer.setAnimationLoop((now) => {
    if (!auto) return;
    time += Math.min(0.05, Math.max(0, (now - last) / 1000)); last = now;      // a slow build must never run the clock backwards
    draw();
  });
  renderer.domElement.addEventListener('pointerdown', () => { restart(); last = performance.now(); auto = true; });

  resize(); restart(); draw();
  renderer.compile(scene, camera);
  mountMessageUI();
  const loading = document.getElementById('loading');
  if (CAPTURE) loading?.remove(); else { loading?.classList.add('done'); setTimeout(() => loading?.remove(), 700); }

  /** Design check: the card's corners in the frame through the whole clip (max |ndc|; must stay under 1). */
  function fit(t0 = 0, t1 = 10, dt = 0.1) {
    const v = new THREE.Vector3(), W2 = CARD.W / 2; let mx = 0, my = 0, at = 0;
    const keep = time;
    for (let t = t0; t <= t1 + 1e-6; t += dt) {
      card.pose(t); placeCamera(t); camera.updateMatrixWorld(); card.root.updateMatrixWorld(true);
      const pts = [[-W2, 0, 0], [W2, 0, 0], [-W2, 0, CARD.D], [W2, 0, CARD.D]].map((p) => new THREE.Vector3(...p));
      for (const sx of [-W2, W2]) pts.push(new THREE.Vector3(sx, CARD.WH, 0).applyMatrix4(card.wallPivot.matrixWorld));
      for (const p of pts) { v.copy(p).project(camera); if (Math.abs(v.x) > mx) mx = Math.abs(v.x); if (Math.abs(v.y) > my) { my = Math.abs(v.y); at = t; } }
    }
    time = keep; draw();
    return { maxX: +mx.toFixed(3), maxY: +my.toFixed(3), atY: +at.toFixed(2) };
  }

  window.__papercraft = {
    ready: true, buildMs: Math.round(performance.now() - T0), pieces: card.count, step,
    restart() { auto = false; restart(); draw(); return time; },
    resume() { last = performance.now(); auto = true; },
    frame, fit, check: card.check, open: openAt, scene, camera, post,
    get time() { return time; },
  };
}

boot().catch((e) => {
  console.error(e);
  const el = document.getElementById('loading'); if (el) { el.classList.remove('done'); el.textContent = '카드를 펼치지 못했어요. 새로 고쳐 주세요.'; }
});
