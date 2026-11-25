// stage.js: the photo set for a pop-up card on a table.
// Renderer, key / fill light with soft shadows, the macro lens (PaperPost), a fixed-step simulation clock, the capture
// contract (window.__papercraft), a printed wooden table, and paper life (falling paper snow, smoke puffs).
import * as THREE from 'three';
import * as P2 from 'papercraft/lib/paperkit-2d.js';
import { paperTextures, paperMaterial, paperLights, enableSoftShadows, PaperPost, PAPER_LIGHT } from 'papercraft/lib/paperkit-3d.js';

export { THREE, P2 };

const clamp01 = (x) => Math.min(1, Math.max(0, x));
export const smooth = (a, b, x) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };
export const smoother = (a, b, x) => { const t = clamp01((x - a) / (b - a)); return t * t * t * (t * (t * 6 - 15) + 10); };
export const lerp = (a, b, t) => a + (b - a) * t;

export function createStage({ bg = '#2a1c16', fov = 26, stock = '#f6efe2', light = {}, lens = {}, leak = '#a0602c' } = {}) {
  const built = performance.now();
  const Q = new URLSearchParams(location.search), CAPTURE = Q.has('capture');
  const sm = /^(\d+)x(\d+)$/i.exec(Q.get('size') || ''), SIZE = sm ? [Number(sm[1]), Number(sm[2])] : null;

  const renderer = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.BasicShadowMap;          // the PCSS patch replaces the BASIC path
  const canvas = renderer.domElement;
  document.body.appendChild(canvas);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(bg);
  const camera = new THREE.PerspectiveCamera(fov, 16 / 9, 6, 420);
  const paper = paperTextures(renderer, { color: stock, unitsPerTile: 7 });

  const L = { key: '#ffdcb2', keyIntensity: 3.0, keyDir: [-0.62, 1.0, 0.6], fill: '#f2dcc2', fillIntensity: 0.85, fillDir: [0.35, 0.55, 1.0],
    sky: '#fff0da', ground: '#b39a78', skyIntensity: 0.42, target: [0, 3, 3], shadowExtent: 30, softness: 0.22, maxPenumbra: 1.3, ...light };
  const lights = paperLights(scene, { ...L, target: new THREE.Vector3(...L.target), mapSize: 4096, distance: 90 });
  enableSoftShadows(lights.key, { softness: L.softness, maxPenumbra: L.maxPenumbra, sheet: 0.25 });
  PAPER_LIGHT.leak.value.set(leak);

  const post = new PaperPost(renderer, scene, camera, {
    focusBand: 0.56, ramp: 0.5, maxBlur: 9, nearGain: 1.3, farGain: 1.0, depthWeight: 0.85,
    ao: 1.0, aoRadius: 1.1, aoBias: 0.05, hazeAmount: 0, falloff: 0.1, falloffTint: 0.05,
    exposure: 0.84, contrast: 1.14, saturation: 1.0, greenDesat: 0.1, vignette: 0.1, grain: 0.011, ...lens,
  });

  // ---- the frame: ?size=WxH renders exactly that many pixels at pixel ratio 1; otherwise the window. The view is
  // authored for 16:9: a narrower window widens the lens so the whole card stays in frame.
  const frame = { w: 0, h: 0, fovY: fov };
  function resize() {
    let w, h, pr;
    if (SIZE) {
      [w, h] = SIZE; pr = 1;
      const k = Math.min(1, innerWidth / w, innerHeight / h);
      canvas.style.width = `${w * k}px`; canvas.style.height = `${h * k}px`;
    } else {
      w = Math.max(2, innerWidth); h = Math.max(2, innerHeight); pr = Math.min(devicePixelRatio || 1, 2);
      canvas.style.width = `${w}px`; canvas.style.height = `${h}px`;
    }
    renderer.setPixelRatio(pr);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    const half = Math.tan(THREE.MathUtils.degToRad(fov / 2));
    camera.fov = THREE.MathUtils.radToDeg(2 * Math.atan(half * Math.max(1, (16 / 9) / camera.aspect)));
    camera.updateProjectionMatrix();
    post.setSize(w, h);
    frame.w = w; frame.h = h; frame.fovY = camera.fov;
  }
  addEventListener('resize', () => { resize(); if (!auto) render(); });

  // ---- fixed-step clock: every moving thing is advanced in steps of 1/120 s (ticks) and posed once per frame
  const H = 1 / 120;
  let time = 0, acc = 0, stepAcc = 0, auto = true, last = performance.now();
  const ticks = [], poses = [], restarts = [];
  const advance = (n) => { for (let i = 0; i < n; i++) { for (const f of ticks) f(H, time); time += H; } };
  function render() { for (const f of poses) f(time); post.render(time); }
  function restart() { time = 0; acc = 0; stepAcc = 0; last = performance.now(); for (const f of restarts) f(); render(); return 0; }
  function step(sec = 1 / 30) {
    auto = false;
    stepAcc += Math.max(0, Number(sec) || 0);
    const n = Math.floor(stepAcc / H + 1e-6);
    stepAcc -= n * H;
    advance(n); render();
    return time;
  }
  function resume() { auto = true; last = performance.now(); acc = 0; }

  /** Call once the scene is built: first frame, the live loop, the capture hook. */
  function start({ pieces = 0, extra = {} } = {}) {
    resize();
    renderer.compile(scene, camera);
    restart();
    renderer.setAnimationLoop((now) => {
      if (!auto) return;
      const dt = Math.min(0.05, Math.max(0, (now - last) / 1000)); last = now;   // a negative step would run the springs backwards
      acc += dt; const n = Math.floor(acc / H); acc -= n * H;
      advance(n); render();
    });
    canvas.addEventListener('click', () => { restart(); resume(); });
    window.__papercraft = { ready: true, buildMs: Math.round(performance.now() - built), pieces, restart, step, resume, frame,
      scene, camera, post, get time() { return time; }, ...extra };
  }

  return { THREE, renderer, scene, camera, paper, lights, post, frame, Q, CAPTURE, SIZE,
    onTick: (f) => ticks.push(f), onPose: (f, first = false) => (first ? poses.unshift(f) : poses.push(f)), onRestart: (f) => restarts.push(f),
    start, restart, step, render, get time() { return time; } };
}

/** Largest |x| and |y| (in frame halves: 1 = the frame edge) reached by the corners of the meshes under `root`. */
export function frameExtent(root, camera) {
  root.updateMatrixWorld(true); camera.updateMatrixWorld(true);
  const v = new THREE.Vector3(); let mx = 0, my = 0, top = -9, bottom = 9;
  root.traverse((o) => {
    if (!o.isMesh || !o.visible || o.userData.noFit) return;
    if (!o.geometry.boundingBox) o.geometry.computeBoundingBox();
    const b = o.geometry.boundingBox;
    for (let i = 0; i < 8; i++) {
      v.set(i & 1 ? b.max.x : b.min.x, i & 2 ? b.max.y : b.min.y, i & 4 ? b.max.z : b.min.z).applyMatrix4(o.matrixWorld).project(camera);
      mx = Math.max(mx, Math.abs(v.x)); my = Math.max(my, Math.abs(v.y)); top = Math.max(top, v.y); bottom = Math.min(bottom, v.y);
    }
  });
  return { x: +mx.toFixed(3), y: +my.toFixed(3), top: +top.toFixed(3), bottom: +bottom.toFixed(3) };
}

// ---------------------------------------------------------------------------------------------------------------
// the table: one printed sheet of wood (planks, grain, knots), far bigger than the frame
// ---------------------------------------------------------------------------------------------------------------
export function woodTable(stage, { size = 132, px = 3072, tones = ['#7a5238', '#6d4730', '#855a3c'], gap = '#3a2418', grainDark = '#3d2616', grainLight = '#b98a62',
  plank = 10.5, seed = 11, y = 0, center = [0, 4], along = 'x' } = {}) {
  const c = document.createElement('canvas'); c.width = c.height = px;
  const g = c.getContext('2d'), r = P2.rng(seed), k = px / size;       // k: px per unit
  g.fillStyle = tones[0]; g.fillRect(0, 0, px, px);
  if (along === 'z') { g.translate(px, 0); g.rotate(Math.PI / 2); }
  let v = -r() * plank;
  while (v < size) {
    const w = plank * (0.86 + r() * 0.28);
    let u = -r() * 60;
    while (u < size) {
      const len = 44 + r() * 46, tone = P2.mix(tones[Math.floor(r() * tones.length)], r() < 0.5 ? grainDark : grainLight, r() * 0.1);
      const x0 = u * k, y0 = v * k, W = len * k, Hh = w * k;
      g.save(); g.beginPath(); g.rect(x0, y0, W, Hh); g.clip();
      const gr = g.createLinearGradient(0, y0, 0, y0 + Hh);
      gr.addColorStop(0, P2.shade(tone, 0.05)); gr.addColorStop(0.5, tone); gr.addColorStop(1, P2.shade(tone, -0.07));
      g.fillStyle = gr; g.fillRect(x0, y0, W, Hh);
      // grain: long shallow waves that bend round a knot or two
      const knots = []; for (let i = 0, n = r() < 0.45 ? 1 : r() < 0.2 ? 2 : 0; i < n; i++) knots.push([x0 + r() * W, y0 + (0.25 + 0.5 * r()) * Hh, (0.5 + r() * 0.8) * k]);
      const lines = Math.round(w * 4.2);
      for (let i = 0; i < lines; i++) {
        const yy = y0 + (i + r()) / lines * Hh, a = (r() - 0.5) * 0.9 * k, ph = r() * 6.28, wl = (18 + r() * 30) * k;
        g.strokeStyle = r() < 0.62 ? P2.rgba(grainDark, 0.05 + r() * 0.13) : P2.rgba(grainLight, 0.04 + r() * 0.1);
        g.lineWidth = (0.03 + r() * 0.09) * k;
        g.beginPath();
        for (let x = x0 - 4; x <= x0 + W + 4; x += 0.5 * k) {
          let yv = yy + a * Math.sin(x / wl * 6.28 + ph);
          for (const [kx, ky, kr] of knots) { const dx = (x - kx) / (kr * 5), dy = (yv - ky) / (kr * 2.2), d2 = dx * dx + dy * dy; yv += Math.sign(yv - ky || 1) * kr * 1.3 * Math.exp(-d2); }
          if (x <= x0 - 4) g.moveTo(x, yv); else g.lineTo(x, yv);
        }
        g.stroke();
      }
      for (const [kx, ky, kr] of knots) {
        for (let q = 3; q >= 0; q--) { g.fillStyle = P2.rgba(grainDark, 0.16 + 0.1 * (3 - q)); g.beginPath(); g.ellipse(kx, ky, kr * (0.5 + q * 0.38), kr * (0.3 + q * 0.2), 0, 0, 6.3); g.fill(); }
      }
      g.restore();
      g.fillStyle = P2.rgba(gap, 0.55); g.fillRect(x0 + W - 0.07 * k, y0, 0.14 * k, Hh);      // the butt joint
      u += len;
    }
    g.fillStyle = P2.rgba(gap, 0.7); g.fillRect(0, (v + w) * k - 0.07 * k, px, 0.15 * k);       // the gap between boards
    g.fillStyle = P2.rgba(grainLight, 0.16); g.fillRect(0, (v + w) * k + 0.08 * k, px, 0.07 * k);
    v += w;
  }
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = stage.renderer.capabilities.getMaxAnisotropy();
  const nrm = stage.paper.normalMap.clone(); nrm.repeat.set(size / 9, size / 9); nrm.needsUpdate = true;
  const mat = paperMaterial({ map: tex, normalMap: nrm, normalScale: 0.35 });
  const top = new THREE.Mesh(new THREE.PlaneGeometry(size, size), mat);
  top.rotation.x = -Math.PI / 2; top.position.set(center[0], y, center[1]); top.receiveShadow = true; top.userData.noFit = true;
  const far = new THREE.Mesh(new THREE.PlaneGeometry(1400, 1400), paperMaterial({ color: P2.shade(tones[0], -0.06) }));
  far.rotation.x = -Math.PI / 2; far.position.set(center[0], y - 0.05, center[1]); far.receiveShadow = true; far.userData.noFit = true;
  stage.scene.add(top, far);
  return top;
}

// ---------------------------------------------------------------------------------------------------------------
// paper life: every particle is a pure function of the simulated time (restart() needs no state)
// ---------------------------------------------------------------------------------------------------------------

/** Falling paper snow: small cut flakes tumbling down over the card. Nothing is in the air at t = 0; they drift in from
 *  above once the card begins to open. */
export function makeSnow(stage, { count = 130, x = [-30, 30], z = [-16, 15], top = 24, start = 0.5, size = [0.15, 0.3], fall = [3.4, 5.6],
  colors = ['#fffdf6', '#eef3fb', '#fff6e2'], seed = 5, floor = 0.12 } = {}) {
  const pts = []; for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2, rr = i % 2 ? 0.26 : 0.5; pts.push(new THREE.Vector2(Math.cos(a) * rr, Math.sin(a) * rr)); }
  const mat = paperMaterial({ color: '#ffffff', side: THREE.DoubleSide });
  const mesh = new THREE.InstancedMesh(new THREE.ShapeGeometry(new THREE.Shape(pts)), mat, count);
  mesh.frustumCulled = false; mesh.castShadow = false; mesh.receiveShadow = false; mesh.userData.noFit = true;
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  const r = P2.rng(seed), F = [], col = new THREE.Color();
  for (let i = 0; i < count; i++) {
    const v = lerp(fall[0], fall[1], r());
    F.push({ x: lerp(x[0], x[1], r()), z: lerp(z[0], z[1], r()), v, T: top / v, delay: start + r() * (top / fall[0]) * 0.9, s: lerp(size[0], size[1], r()),
      ph: r() * 6.28, sw: 0.5 + r() * 0.9, w1: 0.7 + r() * 0.8, w2: 0.9 + r() * 1.1, ax: r() * 6.28, sp: (r() < 0.5 ? -1 : 1) * (0.8 + r() * 1.6) });
    mesh.setColorAt(i, col.set(colors[i % colors.length]));
  }
  stage.scene.add(mesh);
  const M = new THREE.Matrix4(), p = new THREE.Vector3(), q = new THREE.Quaternion(), e = new THREE.Euler(), s = new THREE.Vector3();
  stage.onPose((t) => {
    for (let i = 0; i < count; i++) {
      const f = F[i], age = t - f.delay;
      if (age < 0) { s.setScalar(0); p.set(0, -50, 0); mesh.setMatrixAt(i, M.compose(p, q, s)); continue; }
      const a = age % f.T, y = top - f.v * a;
      p.set(f.x + f.sw * Math.sin(a * f.w1 + f.ph) + 0.25 * a, y, f.z + 0.6 * f.sw * Math.cos(a * f.w2 + f.ph));
      e.set(f.ax + a * f.sp, f.ph + a * f.sp * 0.7, a * f.sp * 0.4); q.setFromEuler(e);
      s.setScalar(f.s * smooth(floor, floor + 1.2, y));
      mesh.setMatrixAt(i, M.compose(p, q, s));
    }
    mesh.instanceMatrix.needsUpdate = true;
  });
  return mesh;
}

/** Paper smoke: small cream discs with a spiral cut, rising from emitters. emitters: [{ at(tBirth) -> Vector3 | null,
 *  every, life, rise, drift: [x, z], size: [a, b], from }] (from: no puff is born before that time). */
export function makePuffs(stage, emitters, { colors = ['#f6eedd', '#e9e1d2'] } = {}) {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, 128, 128);
  g.strokeStyle = '#c9c1b4'; g.lineWidth = 6; g.lineCap = 'round'; g.beginPath();
  for (let a = 0; a <= 9.5; a += 0.2) { const rr = (0.07 + a * 0.062) / 0.9 * 64, x = 64 + Math.cos(a) * rr, y = 64 + Math.sin(a) * rr; if (a === 0) g.moveTo(x, y); else g.lineTo(x, y); }
  g.stroke();
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.offset.set(0.5, 0.5);
  const pts = []; for (let i = 0; i < 26; i++) { const a = (i / 26) * Math.PI * 2; pts.push(new THREE.Vector2(Math.cos(a) * 0.5, Math.sin(a) * 0.5)); }
  const slots = emitters.map((e) => Math.ceil(e.life / e.every) + 1), total = slots.reduce((a, b) => a + b, 0);
  const mesh = new THREE.InstancedMesh(new THREE.ShapeGeometry(new THREE.Shape(pts)), paperMaterial({ map: tex, side: THREE.DoubleSide }), total);
  mesh.frustumCulled = false; mesh.castShadow = false; mesh.receiveShadow = false; mesh.userData.noFit = true;
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  const col = new THREE.Color(); for (let i = 0; i < total; i++) mesh.setColorAt(i, col.set(colors[i % colors.length]));
  stage.scene.add(mesh);
  const M = new THREE.Matrix4(), p = new THREE.Vector3(), q = new THREE.Quaternion(), qz = new THREE.Quaternion(), s = new THREE.Vector3(), Z = new THREE.Vector3(0, 0, 1);
  stage.onPose((t) => {
    let n = 0;
    emitters.forEach((e, ei) => {
      const k0 = Math.floor(t / e.every);
      for (let j = 0; j < slots[ei]; j++) {
        const k = k0 - j, birth = k * e.every + (e.phase || 0), age = t - birth;
        if (age < 0 || age >= e.life || birth < (e.from || 0)) continue;
        const o = e.at(birth); if (!o) continue;
        const u = age / e.life, wob = Math.sin(age * 2.1 + k * 1.7) * 0.22 * u;
        p.set(o.x + (e.drift?.[0] || 0) * age + wob, o.y + e.rise * age * (1 - 0.25 * u), o.z + (e.drift?.[1] || 0) * age + 0.15);
        q.copy(stage.camera.quaternion).multiply(qz.setFromAxisAngle(Z, age * 0.7 + k * 2.1));
        s.setScalar(lerp(e.size[0], e.size[1], u) * smooth(0, 0.14, u) * (1 - smooth(0.7, 1, u)));
        mesh.setMatrixAt(n++, M.compose(p, q, s));
      }
    });
    mesh.count = n; mesh.instanceMatrix.needsUpdate = true;
  });
  return mesh;
}
