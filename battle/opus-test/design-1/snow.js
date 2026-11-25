// snow.js — falling paper snowflakes as a pure function of time (seeded, no state: restart(); step(T) always gives the
// same frame). Each flake is a small six-armed die-cut card that tumbles down, drifts with a light air, lands flat on
// whatever surface lies under it (the card's floor, the page or the table) and stays there. Flakes spawn above the
// frame, so none pops into view; each one only reaches the card well after it has opened.
import * as THREE from 'three';
import { paperMaterial } from 'papercraft/lib/paperkit-3d.js';

function hash(i, k) { let h = (i * 374761393 + k * 668265263) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16; return (h >>> 0) / 4294967296; }

function flakeTexture() {
  const S = 128, c = document.createElement('canvas'); c.width = c.height = S;
  const g = c.getContext('2d');
  g.translate(S / 2, S / 2); g.fillStyle = '#ffffff'; g.lineCap = 'round';
  for (let k = 0; k < 6; k++) {
    g.save(); g.rotate(k * Math.PI / 3);
    g.fillRect(-4, -2, 58, 8);
    for (const s of [22, 38]) { g.save(); g.translate(s, 2); g.rotate(-0.95); g.fillRect(-3, -3, s === 22 ? 20 : 14, 6); g.restore(); g.save(); g.translate(s, 2); g.rotate(0.95); g.fillRect(-3, -3, s === 22 ? 20 : 14, 6); g.restore(); }
    g.restore();
  }
  g.beginPath(); g.arc(0, 0, 10, 0, Math.PI * 2); g.fill();
  g.fillStyle = 'rgba(150,165,205,0.55)';   // a printed hairline that reads as the cut's thickness
  g.beginPath(); g.arc(0, 0, 4, 0, Math.PI * 2); g.fill();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return t;
}

/**
 * createSnow({ scene, count, region: { x0, x1, z0, z1 }, top, fall: [min, max], size: [min, max], wind, avoidZ: [[z, half], ...],
 *   groundAt(x, z) -> y, start: [t0, t1], lie }) -> { mesh, update(t) }
 */
export function createSnow({ scene, count = 120, region, top = 31, fall = [1.9, 2.7], size = [0.38, 0.72], wind = 0.22, avoid = () => false, groundAt = () => 0, start = [0, 12], lie = 26, color = '#ffffff', seed = 3 }) {
  const mat = paperMaterial({ color, map: flakeTexture(), side: THREE.DoubleSide });
  mat.alphaTest = 0.5;
  const mesh = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), mat, count);
  mesh.frustumCulled = false; mesh.castShadow = false; mesh.receiveShadow = true; mesh.name = 'snow';
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  scene.add(mesh);
  const F = [];
  const pickXZ = (i, k) => {
    for (let a = 0; a < 40; a++) {
      const x = region.x0 + (region.x1 - region.x0) * hash(i * 7 + a, k * 13 + seed), z = region.z0 + (region.z1 - region.z0) * hash(i * 11 + a, k * 17 + seed + 1);
      if (!avoid(x, z)) return [x, z];
    }
    return [region.x0 - 50, region.z0];   // nowhere free: parked far away
  };
  for (let i = 0; i < count; i++) {
    const r = (s) => hash(i, s * 31 + seed);
    F.push({ t0: start[0] + (start[1] - start[0]) * r(1), v: fall[0] + (fall[1] - fall[0]) * r(2), s: size[0] + (size[1] - size[0]) * r(3) ** 1.4,
      ax: 0.35 + 0.5 * r(4), w: 1.1 + 0.9 * r(5), ph: r(6) * 6.28, spin: (r(7) - 0.5) * 3.2, tum: 1.2 + 1.6 * r(8), y0: top + 3 * r(9) });
  }
  const _m = new THREE.Matrix4(), _p = new THREE.Vector3(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _s = new THREE.Vector3();
  function update(t) {
    for (let i = 0; i < count; i++) {
      const f = F[i];
      let tau = t - f.t0, k = 0;
      if (tau < 0) { mesh.setMatrixAt(i, _m.makeScale(0, 0, 0)); continue; }
      const sway = (tt) => f.ax * Math.sin(f.w * tt + f.ph);
      const landY = (x0, z0) => { let tt = f.y0 / f.v, y = 0; for (let it = 0; it < 3; it++) { y = groundAt(x0 + wind * tt + sway(tt), z0 + 0.22 * Math.sin(0.7 * f.w * tt + f.ph * 1.3)); tt = (f.y0 - y) / f.v; } return y; };
      const [bx, bz] = pickXZ(i, 0);
      const g0 = landY(bx, bz), tf = (f.y0 - g0) / f.v, cycle = tf + lie + 1.5 + 4 * hash(i, 77);
      k = Math.floor(tau / cycle); tau -= k * cycle;
      const [x0, z0] = k ? pickXZ(i, k) : [bx, bz];
      const gy = k ? landY(x0, z0) : g0, tfall = (f.y0 - gy) / f.v;
      if (tau < tfall) {
        _p.set(x0 + wind * tau + sway(tau), f.y0 - f.v * tau, z0 + 0.22 * Math.sin(0.7 * f.w * tau + f.ph * 1.3));
        _e.set(f.tum * tau + f.ph, f.spin * tau, 0.6 * Math.sin(f.tum * 0.7 * tau)); _q.setFromEuler(_e); _s.setScalar(f.s);
      } else {
        const lay = tau - tfall, melt = Math.max(0, Math.min(1, (lie + 1.5 - lay) / 1.5));
        _p.set(x0 + wind * tfall + sway(tfall), gy + 0.012, z0 + 0.22 * Math.sin(0.7 * f.w * tfall + f.ph * 1.3));
        _e.set(-Math.PI / 2, 0, f.spin * tfall); _q.setFromEuler(_e); _s.setScalar(f.s * melt);
      }
      mesh.setMatrixAt(i, _m.compose(_p, _q, _s));
    }
    mesh.instanceMatrix.needsUpdate = true;
  }
  update(0);
  return { mesh, update };
}
