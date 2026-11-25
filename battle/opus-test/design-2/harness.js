// harness.js — a paper greeting card lying on a table, seen through a macro lens.
// Renderer + output frame (?size=WxH renders exactly that many pixels at pixel ratio 1), paper stock, key / fill light
// with contact-hardening soft shadows, the PaperPost lens, a FIXED-STEP clock (restart / step), a camera that is
// fitted to the card at every moment of the opening (so the whole card stays in frame), and the capture hook
// window.__papercraft. The scene supplies pose(t) (every moving thing is a pure function of time), hull() (world points
// that must stay in frame), view(t) (camera yaw / pitch in degrees) and focus(t).
import * as THREE from 'three';
import { paperTextures, paperLights, enableSoftShadows, PaperPost, PAPER_LIGHT } from 'papercraft/lib/paperkit-3d.js';

const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

export function createHarness(o = {}) {
  const T0 = performance.now();
  const Q = new URLSearchParams(location.search);
  const CAPTURE = Q.has('capture');
  const sm = /^(\d+)x(\d+)$/i.exec(Q.get('size') || '');
  const SIZE = sm ? [Number(sm[1]), Number(sm[2])] : null;
  if (CAPTURE) document.getElementById('hint')?.remove();

  const renderer = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.BasicShadowMap;           // the kit's PCSS patch replaces the BASIC path
  document.body.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(o.background || '#1d140e');
  const camera = new THREE.PerspectiveCamera(o.fov ?? 30, 16 / 9, 2, 900);
  const paper = paperTextures(renderer, { color: o.stock || '#f7f0e2', seed: 4, unitsPerTile: 5, fibres: 1.4, mottle: 0.07, normalStrength: 2.6 });

  const H = { THREE, scene, renderer, camera, paper, CAPTURE, SIZE, steps: [], restarts: [],
    onStep(fn) { H.steps.push(fn); }, onRestart(fn) { H.restarts.push(fn); }, start, time: 0 };

  function start({ pose, hull, view, focus, margin = () => 0.06, lightOpts = {}, lensOpts = {}, leak = '#7a6aa0', wrap = 0.3, trans = 0.25, transTint = '#ffd0a0', pieces = 0, onReady = null }) {
    // ---- light: one warm key from the side and a little toward the camera, a frontal fill, a hemisphere -------------
    const L = { target: new THREE.Vector3(0, 4, 8), keyDir: [-0.72, 0.9, 0.5], key: '#ffdcb2', keyIntensity: 3.0, fill: '#e8dccb', fillIntensity: 0.8,
      fillDir: [0.4, 0.45, 1.0], sky: '#fff0da', ground: '#6a5040', skyIntensity: 0.42, shadowExtent: 42, distance: 120, mapSize: 4096, softness: 0.22, maxPenumbra: 1.4, ...lightOpts };
    const lights = paperLights(scene, L);
    lights.key.shadow.bias = -0.0003; lights.key.shadow.normalBias = 0.015;
    PAPER_LIGHT.leak.value.set(leak); PAPER_LIGHT.wrap.value = wrap; PAPER_LIGHT.trans.value = trans; PAPER_LIGHT.transTint.value.set(transTint);
    enableSoftShadows(lights.key, { softness: L.softness, maxPenumbra: L.maxPenumbra });
    const post = new PaperPost(renderer, scene, camera, { focusBand: 0.56, ramp: 0.42, maxBlur: 10, depthWeight: 0.7, nearGain: 1.4,
      tint: [1.03, 0.985, 0.98], saturation: 0.97, greenDesat: 0.12, exposure: 0.84, contrast: 1.14, vignette: 0.16, vignetteColor: '#1a0f08',
      hazeAmount: 0, ao: 1.0, aoRadius: 1.1, aoBias: 0.05, aoTint: '#4a3020', edgeLine: 0.25, grain: 0.01, sharpen: 0.3, ...lensOpts });

    // ---- the output frame ------------------------------------------------------------------------------------------
    const frame = { w: 0, h: 0, fovY: camera.fov };
    function frameBox() {
      if (SIZE) { const k = Math.min(1, innerWidth / SIZE[0], innerHeight / SIZE[1]); return { w: SIZE[0], h: SIZE[1], cw: SIZE[0] * k, ch: SIZE[1] * k, pr: 1 }; }
      return { w: innerWidth, h: innerHeight, cw: innerWidth, ch: innerHeight, pr: Math.min(2, devicePixelRatio || 1) };
    }

    // ---- the camera: authored yaw / pitch, position fitted so every hull point stays inside the frame -----------------
    const _m = new THREE.Matrix4(), _o = new THREE.Vector3(), _up = new THREE.Vector3(0, 1, 0);
    const quatFor = (yawDeg, pitchDeg) => {
      const y = THREE.MathUtils.degToRad(yawDeg), p = THREE.MathUtils.degToRad(pitchDeg);
      const eye = new THREE.Vector3(Math.sin(y) * Math.cos(p), Math.sin(p), Math.cos(y) * Math.cos(p));
      return new THREE.Quaternion().setFromRotationMatrix(_m.lookAt(eye, _o, _up));
    };
    const basis = (q) => [new THREE.Vector3(1, 0, 0).applyQuaternion(q), new THREE.Vector3(0, 1, 0).applyQuaternion(q), new THREE.Vector3(0, 0, -1).applyQuaternion(q)];
    // closed form: for a fixed orientation the camera positions that keep a point inside the frustum are half-spaces;
    // the nearest camera that keeps all of them, centred on both axes
    function fit(pts, q, aspect, mg) {
      const [r, u, f] = basis(q), ty = Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2);
      const ky = ty * (1 - mg), kx = ty * aspect * (1 - mg * 0.8);
      let A1 = -Infinity, A2 = -Infinity, B1 = -Infinity, B2 = -Infinity;
      for (const p of pts) {
        const pr = r.dot(p), pu = u.dot(p), pf = f.dot(p);
        A1 = Math.max(A1, pr - kx * pf); A2 = Math.max(A2, -pr - kx * pf); B1 = Math.max(B1, pu - ky * pf); B2 = Math.max(B2, -pu - ky * pf);
      }
      const cr = (A1 - A2) / 2, cu = (B1 - B2) / 2, cf = Math.min(-(A1 + A2) / (2 * kx), -(B1 + B2) / (2 * ky));
      return r.multiplyScalar(cr).add(u.multiplyScalar(cu)).add(f.multiplyScalar(cf));
    }
    // how far camera C must back off along -f so every point fits
    function backoff(C, pts, q, aspect, mg) {
      const [r, u, f] = basis(q), ty = Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2), ky = ty * (1 - mg), kx = ty * aspect * (1 - mg * 0.8);
      let e = 0; const d = new THREE.Vector3();
      for (const p of pts) { d.subVectors(p, C); const z = f.dot(d); e = Math.max(e, Math.abs(r.dot(d)) / kx - z, Math.abs(u.dot(d)) / ky - z); }
      return e;
    }
    const PATH_DT = 1 / 30, PATH_END = 6.5, BLEND0 = 4.6, BLEND1 = 5.8;
    let path = null;
    function buildPath(aspect) {
      const S = [];
      for (let i = 0; i * PATH_DT <= PATH_END + 1e-9; i++) {
        const t = i * PATH_DT; pose(t); scene.updateMatrixWorld(true);
        const pts = hull().map((p) => p.clone()), v = view(t), q = quatFor(v.yaw, v.pitch), mg = margin(t);
        S.push({ t, q, pts, mg, C: fit(pts, q, aspect, mg) });
      }
      const n = S.length, gauss = (sig, get) => S.map((_, i) => {
        let w = 0; const acc = get(S[i]).clone().multiplyScalar(0);
        for (let j = Math.max(0, i - 40); j < Math.min(n, i + 41); j++) { const k = Math.exp(-(((j - i) * PATH_DT) ** 2) / (2 * sig * sig)); acc.addScaledVector(get(S[j]), k); w += k; }
        return acc.multiplyScalar(1 / w);
      });
      const avg = gauss(0.38, (s) => s.C);
      const e = S.map((s, i) => backoff(avg[i], s.pts, s.q, aspect, s.mg));
      const env = e.map((_, i) => { let m = 0; for (let j = Math.max(0, i - 12); j < Math.min(n, i + 13); j++) m = Math.max(m, e[j]); return m; });
      const es = env.map((_, i) => { let a = 0, w = 0; for (let j = Math.max(0, i - 8); j < Math.min(n, i + 9); j++) { const k = Math.exp(-(((j - i) * PATH_DT) ** 2) / (2 * 0.12 * 0.12)); a += env[j] * k; w += k; } return Math.max(a / w, e[i]); });
      path = S.map((s, i) => { const f = basis(s.q)[2]; return avg[i].clone().addScaledVector(f, -es[i]); });
    }
    const camAt = (t, aspect) => {
      const v = view(t), q = quatFor(v.yaw, v.pitch);
      let C;
      if (t < BLEND1) {
        const x = Math.min(path.length - 1.001, t / PATH_DT), i = Math.floor(x), k = x - i;
        C = path[i].clone().lerp(path[i + 1], k);
      }
      if (t > BLEND0) {
        const live = fit(hull(), q, aspect, margin(t));
        C = C ? C.lerp(live, smooth(BLEND0, BLEND1, t)) : live;
      }
      camera.position.copy(C); camera.quaternion.copy(q); camera.updateMatrixWorld();
    };

    function resize() {
      const b = frameBox(), el = renderer.domElement;
      renderer.setPixelRatio(b.pr);
      renderer.setSize(b.w, b.h, false);
      Object.assign(el.style, { position: 'absolute', width: b.cw + 'px', height: b.ch + 'px', left: (innerWidth - b.cw) / 2 + 'px', top: (innerHeight - b.ch) / 2 + 'px' });
      camera.aspect = b.w / b.h; camera.updateProjectionMatrix();
      post.setSize(b.w, b.h);
      Object.assign(frame, { w: b.w, h: b.h, fovY: camera.fov });
      buildPath(camera.aspect);
      render();
    }

    // ---- the fixed-step clock ----------------------------------------------------------------------------------------
    const SUB = 1 / 120;
    let time = 0, auto = !CAPTURE, last = performance.now();
    function advance(sec) {
      const T = time + Math.max(0, sec);
      while (time < T - 1e-9) { const h = Math.min(SUB, T - time); time += h; for (const fn of H.steps) fn(time, h); }
      H.time = time;
    }
    function render() {
      pose(time); scene.updateMatrixWorld(true);
      camAt(time, camera.aspect);
      post.focus.copy(focus(time));
      post.render(time);
    }
    function restart() { time = 0; H.time = 0; for (const fn of H.restarts) fn(); render(); }
    function step(sec) { auto = false; advance(sec); render(); return time; }

    addEventListener('resize', resize);
    resize();
    renderer.setAnimationLoop((now) => {
      if (!auto) { last = now; return; }
      const dt = Math.min(0.05, Math.max(0, (now - last) / 1000)); last = now;   // clamp: a negative step runs time backwards
      advance(dt); render();
    });
    if (!CAPTURE) {
      renderer.domElement.addEventListener('pointerdown', () => { restart(); auto = true; last = performance.now(); });
    }

    // frame check (development): the worst NDC extent of the hull over the first seconds
    function frameCheck(t1 = 10, dt = 0.1) {
      const keep = time, out = [];
      for (let t = 0; t <= t1 + 1e-9; t += dt) {
        pose(t); scene.updateMatrixWorld(true); camAt(t, camera.aspect);
        let mx = 0, my = 0; const v = new THREE.Vector3();
        for (const p of hull()) { v.copy(p).project(camera); mx = Math.max(mx, Math.abs(v.x)); my = Math.max(my, Math.abs(v.y)); }
        out.push([+t.toFixed(2), +mx.toFixed(3), +my.toFixed(3)]);
      }
      time = keep; render();
      return out;
    }

    const buildMs = Math.round(performance.now() - T0);
    restart();
    window.__papercraft = { ready: true, buildMs, pieces, restart, step, frame,
      resume() { auto = true; last = performance.now(); }, frameCheck, scene, camera, post, lights, get time() { return time; } };
    if (onReady) onReady();
    return { post, lights };
  }
  return H;
}
