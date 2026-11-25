// Ambient life as paper, every bit a pure function of the card's clock (so restart(); step(T) always repeats):
// snow flakes cut from white card that fall in once the card stands open, rest a moment and shrink away, and chimney
// smoke as cream discs with a spiral cut that grow from nothing above each chimney.
import * as THREE from 'three';
import { paperMaterial } from 'papercraft/lib/paperkit-3d.js';

const hash = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
const sm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

function flakeGeo() {
  const s = new THREE.Shape();
  for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2, r = i % 2 ? 0.24 : 0.5; s[i ? 'lineTo' : 'moveTo'](Math.cos(a) * r, Math.sin(a) * r); }
  return new THREE.ShapeGeometry(s);
}

/** Snow: `count` flakes over the card and the table round it. groundAt(x, z) -> the height they come to rest on. */
export function makeSnow(scene, { count = 150, start = 1.9, top = 27, box = { x0: -27, x1: 27, z0: 1.2, z1: 30 }, groundAt = () => 0 } = {}) {
  const mat = paperMaterial({ color: '#fffdf8', side: THREE.DoubleSide });
  const mesh = new THREE.InstancedMesh(flakeGeo(), mat, count);
  mesh.frustumCulled = false; mesh.castShadow = false; mesh.receiveShadow = false; mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  scene.add(mesh);
  const P = new THREE.Vector3(), Q = new THREE.Quaternion(), S = new THREE.Vector3(), E = new THREE.Euler(), M = new THREE.Matrix4();
  const REST = 1.8;
  function update(t) {
    for (let i = 0; i < count; i++) {
      const v = 1.5 + hash(i * 3.1) * 1.5, size = 0.17 + hash(i * 5.3) * 0.2, t0 = start + hash(i * 7.7) * 1.3;
      let tau = t - t0, k = 0;
      if (tau < 0) { S.setScalar(0); mesh.setMatrixAt(i, M.compose(P.set(0, -50, 0), Q, S)); continue; }
      // the first fall starts somewhere in the air (a flake already on its way), later ones from above the frame
      let x = box.x0 + hash(i * 11.3) * (box.x1 - box.x0), z = box.z0 + hash(i * 13.9) * (box.z1 - box.z0);
      let y0 = 5 + hash(i * 17.1) * (top - 5), g = groundAt(x, z), T = (y0 - g) / v + REST, grow = sm(0, 0.45, tau);
      if (tau >= T) {
        tau -= T; const Tn = (top - g) / v + REST; k = 1 + Math.floor(tau / (Tn + 0.001)); tau -= (k - 1) * Tn;
        x = box.x0 + hash(i * 11.3 + k * 4.7) * (box.x1 - box.x0); z = box.z0 + hash(i * 13.9 + k * 9.1) * (box.z1 - box.z0);
        y0 = top; g = groundAt(x, z); T = (y0 - g) / v + REST; grow = 1;
        if (tau >= T) tau = T - 1e-3;
      }
      const fall = (y0 - g) / v, ph = hash(i * 19.9) * 6.28;
      if (tau < fall) {
        const y = y0 - v * tau;
        P.set(x + 0.55 * Math.sin(tau * 1.15 + ph) - 0.22 * tau, y, z + 0.3 * Math.cos(tau * 0.9 + ph));
        E.set(tau * (0.7 + hash(i) * 1.2) + ph, tau * 0.9 + ph * 2, tau * 0.5); Q.setFromEuler(E); S.setScalar(size * grow);
      } else {                                            // resting on the page, shrinking away
        const u = (tau - fall) / REST;
        P.set(x + 0.55 * Math.sin(fall * 1.15 + ph) - 0.22 * fall, g + 0.02, z + 0.3 * Math.cos(fall * 0.9 + ph));
        E.set(-Math.PI / 2, 0, ph); Q.setFromEuler(E); S.setScalar(size * grow * (1 - sm(0.35, 1, u)));
      }
      mesh.setMatrixAt(i, M.compose(P, Q, S));
    }
    mesh.instanceMatrix.needsUpdate = true;
  }
  return { mesh, update };
}

function puffTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, 128, 128);
  g.strokeStyle = '#c9c2b6'; g.lineWidth = 5; g.lineCap = 'round'; g.beginPath();
  for (let a = 0; a <= 9.5; a += 0.2) { const r = (0.07 + a * 0.062) / 0.9 * 64, x = 64 + Math.cos(a) * r, y = 64 + Math.sin(a) * r; if (a === 0) g.moveTo(x, y); else g.lineTo(x, y); }
  g.stroke();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

/**
 * Chimney smoke. emitters: [{ object, offset: [x, y, z], start }] (a point on a standing card; it puffs from `start`).
 * Each puff is a cream disc with a spiral cut, turned to the camera: it grows from nothing, rises, drifts and shrinks.
 */
export function makeSmoke(scene, camera, emitters, { per = 4, life = 3.4, rise = 1.25, drift = -0.5, size = [0.42, 1.25] } = {}) {
  const n = emitters.length * per;
  const mat = paperMaterial({ color: '#efe7d8', map: puffTexture(), side: THREE.DoubleSide });
  const mesh = new THREE.InstancedMesh(new THREE.CircleGeometry(0.5, 24), mat, Math.max(1, n));
  mesh.frustumCulled = false; mesh.castShadow = false; mesh.receiveShadow = false; mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  scene.add(mesh);
  const W = new THREE.Vector3(), P = new THREE.Vector3(), Q = new THREE.Quaternion(), QZ = new THREE.Quaternion(), S = new THREE.Vector3(), M = new THREE.Matrix4(), Z = new THREE.Vector3(0, 0, 1);
  function update(t) {
    let shown = 0;
    emitters.forEach((e, ei) => {
      e.object.updateWorldMatrix(true, false);
      W.set(...e.offset).applyMatrix4(e.object.matrixWorld);
      for (let k = 0; k < per; k++) {
        const tau = t - e.start - (k / per) * life - hash(ei * 3.3 + k) * 0.25;
        if (tau < 0) continue;
        const age = (tau % life) / life, a = age * life, id = ei * per + k;
        P.set(W.x + drift * a * (0.6 + 0.4 * age) + Math.sin(a * 1.7 + id) * 0.16, W.y + rise * a, W.z + 0.25 + Math.cos(a * 1.3 + id) * 0.1);
        const s = (size[0] + (size[1] - size[0]) * age) * sm(0, 0.14, age) * (1 - sm(0.62, 1, age)) * (0.85 + 0.3 * hash(id * 2.2));
        Q.copy(camera.quaternion).multiply(QZ.setFromAxisAngle(Z, 0.5 * a + id * 2.1));
        mesh.setMatrixAt(shown++, M.compose(P, Q, S.setScalar(s)));
      }
    });
    mesh.count = shown; mesh.instanceMatrix.needsUpdate = true;
  }
  return { mesh, update };
}
