// design-2/main.js
// "고요한 밤, 숲속 호수의 성탄 회전목마" — 180° Hardcover Pop-up Book Spread with True Rigid V-Folds & Carousel Pavilion
import * as THREE from 'three';
import * as P2 from 'papercraft/lib/paperkit-2d.js';
import {
  paperTextures,
  paperMaterial,
  makeCard,
  crossCard,
  paperLights,
  enableSoftShadows,
  PaperPost,
  PAPER_LIGHT,
} from 'papercraft/lib/paperkit-3d.js';
import { createLife } from 'papercraft/lib/paper-life.js';
import { windSway } from 'papercraft/lib/paper-motion.js';
import { getMessage, loadMessageFont, mountMessageUI } from '../../kit/message.js';
import {
  PAL2,
  makeNordicTableCanvas,
  paintBookFrontCover,
  paintSpreadPage,
  buildVFoldMountainWing,
  buildMoonVolvelle,
  buildCarouselSpindleCard,
  buildCarouselDeer,
  buildNordicChapel,
  buildIceSkater,
  buildFrostedTealPine,
  buildLanternArch,
  buildHangingStarLantern,
  buildSolsticeMessageCard,
  buildPondSnowRim,
} from './prints.js';

const T0 = performance.now();
const Q = new URLSearchParams(location.search);
const CAPTURE = Q.has('capture');
const SIZE_PARAM = (() => {
  const m = /^(\d+)x(\d+)$/i.exec(Q.get('size') || '');
  return m ? [Number(m[1]), Number(m[2])] : null;
})();

if (CAPTURE) document.getElementById('hint')?.remove();

async function init() {
  await loadMessageFont('Nanum Pen Script');
  const message = getMessage();

  const renderer = new THREE.WebGLRenderer({
    antialias: false,
    preserveDrawingBuffer: true,
    powerPreference: 'high-performance',
  });
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.BasicShadowMap;
  document.body.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#182234');

  const FOV_BASE = 27;
  const camera = new THREE.PerspectiveCamera(FOV_BASE, 16 / 9, 4, 260);

  // Cool silver-cream paper stock so moonlit snow stays crisp & luminous (never muddy beige!)
  const paper = paperTextures(renderer, {
    color: '#eef2f9',
    seed: 14,
    unitsPerTile: 5.5,
    fibres: 1.2,
    mottle: 0.055,
    normalStrength: 2.5,
  });

  // Moonlit Nordic Solstice lighting + warm candle practicals
  PAPER_LIGHT.wrap.value = 0.36;
  PAPER_LIGHT.leak.value.set('#38538c');
  PAPER_LIGHT.trans.value = 0.24;
  PAPER_LIGHT.transTint.value.set('#ffd688');

  const lights = paperLights(scene, {
    key: '#eef2ff',
    keyIntensity: 2.65,
    keyDir: [-0.72, 1.02, 0.62],
    fill: '#8faae0',
    fillIntensity: 0.92,
    fillDir: [0.46, 0.56, 1.0],
    sky: '#bcd0f5',
    ground: '#324264',
    skyIntensity: 0.55,
    target: new THREE.Vector3(0, 2.2, 0.4),
    shadowExtent: 23,
    mapSize: 2048,
    distance: 68,
  });
  enableSoftShadows(lights.key, { softness: 0.25, maxPenumbra: 1.1 });

  // Warm golden candlelight pools at the Carousel & Nordic Chapel (constant light count!)
  const carouselLamp = new THREE.PointLight('#ffcf75', 0, 16, 1.0);
  carouselLamp.position.set(0, 4.2, -0.2);
  const chapelLamp = new THREE.PointLight('#ffc96b', 0, 12, 1.0);
  chapelLamp.position.set(-6.5, 3.2, -1.5);
  scene.add(carouselLamp, chapelLamp);

  const post = new PaperPost(renderer, scene, camera, {
    focusBand: 0.5,
    ramp: 0.38,
    maxBlur: 10,
    nearGain: 1.45,
    farGain: 0.95,
    depthWeight: 0.65,
    ao: 1.05,
    aoRadius: 1.3,
    aoBias: 0.07,
    aoTint: '#1b2c52',
    exposure: 0.88,
    tint: [0.99, 1.0, 1.03],
    saturation: 1.02,
    contrast: 1.14,
    greenDesat: 0.06, // Preserve frosted teal spruce hues!
    shadowTint: '#131e3d',
    shadowLift: 0.03,
    haze: '#23324d',
    hazeStart: 48,
    hazeEnd: 120,
    hazeAmount: 0.2,
    vignette: 0.1,
    vignetteColor: '#0d1426',
    grain: 0.01,
    sharpen: 0.28,
  });

  // -------------------------------------------------------------------------
  // 3. Nordic Ash-Slate Table + Silver Ribbon Trim
  // -------------------------------------------------------------------------
  const tableTex = new THREE.CanvasTexture(makeNordicTableCanvas(1024, 1024, 33));
  tableTex.colorSpace = THREE.SRGBColorSpace;
  tableTex.wrapS = tableTex.wrapT = THREE.RepeatWrapping;
  tableTex.repeat.set(3.2, 3.2);
  tableTex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  const tableMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(180, 140),
    paperMaterial({ map: tableTex, normalMap: paper.normalMap, normalScale: 0.42 }),
  );
  tableMesh.rotation.x = -Math.PI / 2;
  tableMesh.receiveShadow = true;
  scene.add(tableMesh);

  // Decorative cut-paper Champagne Star Snowflake & Rose Berry Ornament on the slate table
  {
    const [tPts, tPaint] = P2.drawnPiece((g, ink) => {
      g.fillStyle = ink(PAL2.champagne);
      g.beginPath();
      for (let i = 0; i < 12; i++) {
        const r = i % 2 === 0 ? 1.05 : 0.44;
        const a = (i * Math.PI) / 6;
        const x = Math.cos(a) * r, y = 1.15 + Math.sin(a) * r;
        if (i === 0) g.moveTo(x, y); else g.lineTo(x, y);
      }
      g.closePath();
      g.fill();
      g.fillStyle = ink(PAL2.rose);
      P2.draw2.ell(g, 0, 1.15, 0.3, 0.3);
    }, { w: 2.8, h: 2.6, name: 'tableTag' });
    const tag = makeCard(tPts, { paint: tPaint, paper, thickness: 0.06, pxPerUnit: 38, folds: [] });
    tag.rotation.x = -Math.PI / 2;
    tag.rotation.z = -0.25;
    tag.position.set(15.2, 0.04, 6.2);
    scene.add(tag);
  }

  // -------------------------------------------------------------------------
  // 4. Physical 180° Hardcover Pop-up Book Spread (Spine along Z-axis!)
  // -------------------------------------------------------------------------
  const PAGE_W = 13.0;
  const BOOK_H = 17.6; // z in [-8.8, +8.8]
  const Y_SPINE = 0.26;
  let pieceCount = 4;

  const bookRoot = new THREE.Group();
  scene.add(bookRoot);

  const rectSpan = (x0, x1, y0, y1) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];

  // ---- RIGHT HALF (Base Board + Cream Page Block, x in [0, +PAGE_W]) ------
  const rightPivot = new THREE.Group();
  rightPivot.position.set(0, Y_SPINE, 0);
  bookRoot.add(rightPivot);

  const rightBoard = makeCard(rectSpan(-0.2, PAGE_W + 0.42, -BOOK_H / 2 - 0.32, BOOK_H / 2 + 0.32), {
    paper,
    thickness: 0.16,
    edgeWidth: 0.06,
    pxPerUnit: 22,
    effects: 0,
    folds: ['left'],
    paint: (P) => { P.fill(PAL2.indigoDeep); P.felt(0.7); },
  });
  rightBoard.rotation.x = -Math.PI / 2;
  rightBoard.position.y = -0.14;
  rightPivot.add(rightBoard);

  // Page block stack (thick cream sheets) + printed Right Spread Page
  const rightPage = makeCard(rectSpan(0, PAGE_W, -BOOK_H / 2, BOOK_H / 2), {
    paper,
    thickness: 0.16,
    edgeWidth: 0.06,
    edgeColor: '#e8e2d5',
    pxPerUnit: 42,
    folds: ['left'],
    paint: paintSpreadPage(PAGE_W, BOOK_H, 'right'),
  });
  rightPage.rotation.x = -Math.PI / 2;
  rightPivot.add(rightPage);

  // ---- LEFT HALF + FRONT HARDCOVER (swings 180° around Z-spine!) ----------
  // At open (beta = OPEN_BETA ~ 0.97*PI): leftCoverPivot.rotation.z ≈ 0 (slightly cradled +0.04 rad)
  // At closed (beta = 0): leftCoverPivot.rotation.z = -Math.PI (folded up and over onto +X right page!)
  const leftCoverPivot = new THREE.Group();
  leftCoverPivot.position.set(0, Y_SPINE, 0);
  bookRoot.add(leftCoverPivot);

  const leftPage = makeCard(rectSpan(-PAGE_W, 0, -BOOK_H / 2, BOOK_H / 2), {
    paper,
    thickness: 0.16,
    edgeWidth: 0.06,
    edgeColor: '#e8e2d5',
    pxPerUnit: 42,
    folds: ['right'],
    paint: paintSpreadPage(PAGE_W, BOOK_H, 'left'),
  });
  leftPage.rotation.x = -Math.PI / 2;
  leftCoverPivot.add(leftPage);

  // Front Hardcover Board: wrapped in flipZ (rotation.z = +PI) so when leftCoverPivot.rotation.z = -PI (CLOSED at t=0),
  // their Z rotations cancel to 0 and paintBookFrontCover faces STRAIGHT UP (+Y) un-mirrored and right-side-up!!
  const coverFlipZ = new THREE.Group();
  coverFlipZ.rotation.z = Math.PI;
  coverFlipZ.position.y = -0.15; // Below leftPage when open (-Y); ABOVE rightPage when closed (+Y)!
  leftCoverPivot.add(coverFlipZ);

  const frontHardcover = makeCard(P2.shape.rect(PAGE_W + 0.45, BOOK_H + 0.64), {
    paper,
    thickness: 0.16,
    edgeWidth: 0.07,
    pxPerUnit: 48,
    folds: ['left'],
    paint: paintBookFrontCover(PAGE_W + 0.45, BOOK_H + 0.64),
  });
  frontHardcover.rotation.x = -Math.PI / 2;
  frontHardcover.position.set((PAGE_W + 0.25) / 2, 0, (BOOK_H + 0.64) / 2);
  coverFlipZ.add(frontHardcover);

  // Rounded dark-indigo cloth spine strip along x = 0
  const spineStrip = makeCard(P2.shape.rect(0.95, BOOK_H + 0.64), {
    paper,
    thickness: 0.14,
    edgeWidth: 0.04,
    pxPerUnit: 20,
    effects: 0,
    folds: ['left', 'right'],
    paint: (P) => { P.fill('#0f1c33'); P.felt(0.7); },
  });
  spineStrip.rotation.x = -Math.PI / 2;
  spineStrip.position.set(0, Y_SPINE - 0.22, (BOOK_H + 0.64) / 2);
  bookRoot.add(spineStrip);

  // -------------------------------------------------------------------------
  // 5. Cross-Gutter Symmetry Bisector Frame (True Rigid V-Folds & Central Carousel!)
  // -------------------------------------------------------------------------
  const bisectorGroup = new THREE.Group();
  bisectorGroup.position.set(0, Y_SPINE + 0.12, 0);
  bookRoot.add(bisectorGroup);

  // ---- 5A. TRUE RIGID V-FOLD NORDIC MOUNTAIN ARCH (at spine z0 = -4.6) ----
  // Wide 100° panoramic opening so both mountain wings & the rotating Moon Volvelle face the viewer broadly!
  const VF_GAMMA = THREE.MathUtils.degToRad(50); // page hinge angle from +Z spine
  const VF_ETA_OPEN = THREE.MathUtils.degToRad(68); // ridge elevation from +Z when open
  const VF_COS_PHI = Math.cos(VF_ETA_OPEN) * Math.cos(VF_GAMMA);

  const vFoldRoot = new THREE.Group();
  vFoldRoot.position.set(0, 0.04, -5.05);
  bisectorGroup.add(vFoldRoot);

  const rightWingData = buildVFoldMountainWing(7.7, 6.65, 1);
  const leftWingData = buildVFoldMountainWing(7.7, 6.65, -1);

  const vWingRHolder = new THREE.Group();
  vWingRHolder.matrixAutoUpdate = false;
  const vWingRCard = makeCard(rightWingData.pts, {
    paper,
    thickness: 0.08,
    edgeWidth: 0.06,
    pxPerUnit: 46,
    folds: ['bottom', 'left'],
    holes: [rightWingData.hole],
    paint: rightWingData.paint,
  });
  vWingRHolder.add(vWingRCard);

  // Mechanism #3: Starry Moon & Constellation Volvelle mounted on silver brad behind right V-wing cutout!
  const [mVolPts, mVolPaint] = buildMoonVolvelle(2.05);
  const moonVolvelle = makeCard(mVolPts, {
    paper,
    thickness: 0.06,
    edgeWidth: 0.04,
    pxPerUnit: 46,
    folds: [],
    paint: mVolPaint,
    glow: 1.55,
  });
  moonVolvelle.position.set(rightWingData.holeCenter[0], rightWingData.holeCenter[1], -0.11);
  vWingRHolder.add(moonVolvelle);

  // Thin dark backing pocket behind volvelle so back stays neat
  const volPocket = makeCard(P2.shape.radial(P2.rng(3), { rx: 2.15, ry: 2.15, lobes: 12, depth: 0.02 }), {
    paper,
    thickness: 0.05,
    edgeWidth: 0.03,
    pxPerUnit: 20,
    effects: 0,
    folds: [],
    paint: (P) => P.fill('#13213c'),
  });
  volPocket.position.set(rightWingData.holeCenter[0], rightWingData.holeCenter[1], -0.19);
  vWingRHolder.add(volPocket);

  const vWingLHolder = new THREE.Group();
  vWingLHolder.matrixAutoUpdate = false;
  const vWingLCard = makeCard(leftWingData.pts, {
    paper,
    thickness: 0.08,
    edgeWidth: 0.06,
    pxPerUnit: 46,
    folds: ['bottom', 'right'],
    paint: leftWingData.paint,
  });
  vWingLHolder.add(vWingLCard);
  vFoldRoot.add(vWingRHolder, vWingLHolder);
  pieceCount += 4;

  // Helper to update rigid V-fold wing basis matrices for any half-opening angle psi in [0.02, PI/2]
  const _u = new THREE.Vector3(), _v = new THREE.Vector3(), _n = new THREE.Vector3();
  const _rVec = new THREE.Vector3(), _hVec = new THREE.Vector3(), _mat = new THREE.Matrix4();
  function updateRigidVFold(psi) {
    const sg = Math.sin(VF_GAMMA), cg = Math.cos(VF_GAMMA);
    const A = sg * Math.cos(psi), B = cg;
    const Rab = Math.hypot(A, B) || 1;
    const eta = Math.atan2(A, B) + Math.acos(THREE.MathUtils.clamp(VF_COS_PHI / Rab, -1, 1));
    _rVec.set(0, Math.sin(eta), Math.cos(eta)).normalize();

    // Right wing: local +Y along central ridge _rVec, local +X in wing plane toward _hR!
    _hVec.set(sg * Math.sin(psi), sg * Math.cos(psi), cg).normalize();
    _v.copy(_rVec);
    _u.copy(_hVec).addScaledVector(_v, -_hVec.dot(_v)).normalize();
    _n.crossVectors(_u, _v).normalize();
    _mat.makeBasis(_u, _v, _n);
    // Tiny stack separation when nearly closed so left & right wings never z-fight
    _mat.setPosition(0.05 * (1 - Math.sin(psi)), 0, 0);
    vWingRHolder.matrix.copy(_mat);

    // Left wing: local +Y along central ridge _rVec, local -X in wing plane toward _hL!
    _hVec.set(-sg * Math.sin(psi), sg * Math.cos(psi), cg).normalize();
    _u.copy(_hVec).addScaledVector(_v, -_hVec.dot(_v)).normalize().negate(); // so local -X points along _hL!
    _n.crossVectors(_u, _v).normalize();
    _mat.makeBasis(_u, _v, _n);
    _mat.setPosition(-0.05 * (1 - Math.sin(psi)), 0, 0);
    vWingLHolder.matrix.copy(_mat);
  }

  // ---- 5B. CENTRAL CROSS-GUTTER CHRISTMAS CAROUSEL PAVILION + MECHANISM #1 (Rotating Carousel!) ----
  const carouselRoot = new THREE.Group();
  carouselRoot.position.set(0, 0.06, 0.55);
  bisectorGroup.add(carouselRoot);

  // Crossed Carousel Pavilion (turns into Y_b-Z_b plane X_b = 0 when book closes so ZERO part pokes through cover!)
  const [carPts, carPaint] = buildCarouselSpindleCard();
  const carouselCross = crossCard(carPts, {
    paper,
    paint: carPaint,
    thickness: 0.09,
    edgeWidth: 0.06,
    pxPerUnit: 50,
    angle: 88,
    glow: 1.65,
    seed: 17,
  });
  carouselRoot.add(carouselCross);
  pieceCount += 3;

  // Rotating Carousel Ring carrying 4 Prancing Paper Reindeer around the central spindle!
  const carouselSpinner = new THREE.Group();
  carouselSpinner.position.set(0, 2.35, 0);
  carouselRoot.add(carouselSpinner);

  const deerArms = [];
  const deerAccents = [PAL2.rose, PAL2.teal, PAL2.rose, PAL2.teal];
  for (let i = 0; i < 4; i++) {
    const arm = new THREE.Group();
    const [dPts, dPaint] = buildCarouselDeer(deerAccents[i]);
    const deerCard = makeCard(dPts, {
      paper,
      paint: dPaint,
      thickness: 0.07,
      edgeWidth: 0.04,
      pxPerUnit: 48,
      back: 'mirror',
      folds: [],
      seed: 120 + i,
    });
    arm.add(deerCard);
    carouselSpinner.add(arm);
    deerArms.push({ arm, deerCard, baseAngle: (i * Math.PI) / 2 });
    pieceCount++;
  }

  // -------------------------------------------------------------------------
  // 6. Left & Right Page Pop-ups (fold flat onto their page inside margins when closed!)
  // -------------------------------------------------------------------------
  // Page-top surface frames: +X right, +Y up from page, +Z toward viewer!
  const leftSurface = new THREE.Group();
  leftSurface.position.y = 0.1;
  leftCoverPivot.add(leftSurface);

  const rightSurface = new THREE.Group();
  rightSurface.position.y = 0.1;
  rightPivot.add(rightSurface);

  const pageFlaps = [];
  function addPageFlap(surface, node, {
    x = 0,
    z = 0,
    foldDir = 1, // +1 folds forward toward +Z (for z < 0); -1 folds backward toward -Z (for z > 0)
    yawOpen = 0,
    leanOpen = 0,
    swayAmp = 0,
    stackY = 0.04,
    lag = 0.1,
  } = {}) {
    const pivot = new THREE.Group();
    pivot.position.set(x, stackY, z);
    const yawG = new THREE.Group();
    yawG.add(node);
    pivot.add(yawG);
    surface.add(pivot);
    pieceCount++;
    const item = { pivot, yawG, node, x, z, foldDir, yawOpen, leanOpen, swayAmp, lag };
    pageFlaps.push(item);
    return item;
  }

  // ---- LEFT PAGE POP-UPS (`x in [-12.2, -1.2]`) ---------------------------
  // L1. Nordic Stave Chapel (`x = -6.8, z = -2.8`, H = 8.4 -> folds forward to z = +5.6 < 8.4!)
  const chapelData = buildNordicChapel();
  const chapelCard = makeCard(chapelData.pts, {
    paper,
    paint: chapelData.paint,
    thickness: 0.09,
    edgeWidth: 0.06,
    pxPerUnit: 48,
    glow: 1.6,
    seed: 201,
  });
  const chapelChimneyAnchor = new THREE.Object3D();
  chapelChimneyAnchor.position.set(chapelData.chimney[0], chapelData.chimney[1], 0);
  chapelCard.add(chapelChimneyAnchor);
  addPageFlap(leftSurface, chapelCard, {
    x: -6.8,
    z: -2.8,
    foldDir: 1,
    yawOpen: 0.16,
    stackY: 0.05,
    lag: 0.12,
  });

  // L2. Frosted Timber Arch + Mechanism #4 (Pendulum-Swinging Golden Star Lantern!)
  const archGroup = new THREE.Group();
  {
    const [aPts, aPaint] = buildLanternArch();
    archGroup.add(makeCard(aPts, {
      paper,
      paint: aPaint,
      thickness: 0.08,
      edgeWidth: 0.05,
      pxPerUnit: 46,
      seed: 209,
    }));
  }
  const lanternPivot = new THREE.Group();
  lanternPivot.position.set(0, 3.55, 0.14);
  {
    const [slPts, slPaint] = buildHangingStarLantern();
    const slCard = makeCard(slPts, {
      paper,
      paint: slPaint,
      thickness: 0.07,
      edgeWidth: 0.04,
      pxPerUnit: 48,
      folds: [],
      glow: 1.8,
      seed: 211,
    });
    slCard.position.y = -1.65;
    lanternPivot.add(slCard);
  }
  archGroup.add(lanternPivot);
  pieceCount++;
  addPageFlap(leftSurface, archGroup, {
    x: -2.9,
    z: 1.2,
    foldDir: 1, // 1.2 + 4.4 = 5.6 < 8.4!
    yawOpen: 0.12,
    stackY: 0.08,
    lag: 0.16,
  });

  // L3. Winter Solstice Greeting Note Easel Card (`x = -6.5, z = +5.6`, H = 5.2 -> folds backward to z = +0.4 > -8.4!)
  {
    const [msgPts, msgPaint] = buildSolsticeMessageCard(message);
    const msgCard = makeCard(msgPts, {
      paper,
      paint: msgPaint,
      thickness: 0.09,
      edgeWidth: 0.06,
      pxPerUnit: 64, // High DPI for crisp Korean handwriting!
      seed: 220,
    });
    addPageFlap(leftSurface, msgCard, {
      x: -6.4,
      z: 5.5,
      foldDir: -1, // Folds backward toward -Z so it stays 100% inside [-8.8, +8.8] when closed!
      yawOpen: 0.12,
      leanOpen: -0.08, // Tilted slightly up toward camera like an easel card!
      stackY: 0.11,
      lag: 0.18,
    });
  }

  // L4. Left Frosted Spruce Cross-Trees
  for (const [tx, tz, tw, th, fdir, yaw, sd] of [
    [-10.4, -4.4, 3.4, 6.4, 1, 0.35, 231],
    [-10.6, 1.8, 3.0, 5.4, 1, -0.32, 237],
  ]) {
    const [pPts, pPaint] = buildFrostedTealPine(tw, th, sd);
    const tc = crossCard(pPts, {
      paper,
      paint: pPaint,
      thickness: 0.08,
      edgeWidth: 0.05,
      pxPerUnit: 42,
      angle: 78,
      seed: sd,
    });
    addPageFlap(leftSurface, tc, { x: tx, z: tz, foldDir: fdir, yawOpen: yaw, swayAmp: 1.2, stackY: 0.07, lag: 0.15 });
  }

  // ---- RIGHT PAGE POP-UPS (`x in [+1.2, +12.2]`) --------------------------
  // R1. Frozen Mirror-Ice Pond + Mechanism #2 (Oval Slot-Track Gliding Winter Ice Skaters!)
  // Pond center on rightPage is at x = 6.9, y_2d = -1.6 -> world z = +1.6!
  const rinkGroup = new THREE.Group();
  rinkGroup.position.set(6.9, 0.04, 1.6);
  rightSurface.add(rinkGroup);

  // Raised translucent-ice oval track ring with real cut slot (lies flat on pond, never clips when closed!)
  {
    const outer = Array.from({ length: 40 }, (_, i) => {
      const a = (i / 40) * Math.PI * 2;
      return [Math.cos(a) * 3.05, Math.sin(a) * 1.88];
    });
    const inner = Array.from({ length: 40 }, (_, i) => {
      const a = (i / 40) * Math.PI * 2;
      return [Math.cos(a) * 2.25, Math.sin(a) * 1.32];
    });
    const trackRing = makeCard(outer, {
      paper,
      thickness: 0.06,
      edgeWidth: 0.04,
      pxPerUnit: 36,
      holes: [inner],
      folds: [],
      paint: (P) => {
        P.fill('#d7e9f7');
        P.felt(0.4);
      },
    });
    trackRing.rotation.x = -Math.PI / 2;
    trackRing.position.y = 0.03;
    rinkGroup.add(trackRing);
    pieceCount++;
  }

  // Two Ice Skaters hinged on sliding/turning cam shoes along the oval slot (fold flat when closed, stand & skate when open!)
  const skaters = [];
  for (const [idx, coat, scarf, ph0] of [
    [0, PAL2.rose, PAL2.champagne, 0],
    [1, PAL2.teal, PAL2.birch, Math.PI],
  ]) {
    const carrier = new THREE.Group();
    const standPivot = new THREE.Group();
    const [skPts, skPaint] = buildIceSkater(coat, scarf);
    const skCard = makeCard(skPts, {
      paper,
      paint: skPaint,
      thickness: 0.07,
      edgeWidth: 0.04,
      pxPerUnit: 50,
      back: 'mirror',
      folds: ['bottom'],
      seed: 250 + idx,
    });
    standPivot.add(skCard);
    carrier.add(standPivot);
    rinkGroup.add(carrier);
    skaters.push({ carrier, standPivot, skCard, phase0: ph0 });
    pieceCount++;
  }

  // R2. Snowy Pond Rim Cards + Right Frosted Spruce Cross-Trees
  {
    const [rPts, rPaint] = buildPondSnowRim(6.2, 1.45, 261);
    const rimCard = makeCard(rPts, { paper, paint: rPaint, thickness: 0.08, edgeWidth: 0.05, pxPerUnit: 44, seed: 261 });
    addPageFlap(rightSurface, rimCard, { x: 6.9, z: 5.0, foldDir: -1, yawOpen: -0.06, stackY: 0.06, lag: 0.18 });
  }

  for (const [tx, tz, tw, th, fdir, yaw, sd] of [
    [10.2, -3.2, 3.6, 6.6, 1, -0.36, 271],
    [4.2, -2.6, 2.9, 5.2, 1, 0.3, 277],
    [10.6, 4.6, 3.1, 5.2, -1, -0.28, 283],
  ]) {
    const [pPts, pPaint] = buildFrostedTealPine(tw, th, sd);
    const tc = crossCard(pPts, {
      paper,
      paint: pPaint,
      thickness: 0.08,
      edgeWidth: 0.05,
      pxPerUnit: 42,
      angle: 78,
      seed: sd,
    });
    addPageFlap(rightSurface, tc, { x: tx, z: tz, foldDir: fdir, yawOpen: yaw, swayAmp: 1.25, stackY: 0.07, lag: 0.15 });
  }

  // -------------------------------------------------------------------------
  // 7. Ambient Paper Life (Snowflakes, Golden Starlight Motes & Chapel Smoke)
  // -------------------------------------------------------------------------
  const life = createLife({
    scene,
    camera,
    heroHeight: 3.6,
    seed: 42,
    wind: [0.35, 0.2],
    box: { w: 8.6, d: 6.4, h: 5.0 },
  });
  const snowKind = life.fallers({
    count: 145,
    cut: 'flake',
    colors: ['#ffffff', '#e8f2ff', '#f7e6b5'],
    size: [0.065, 0.125],
    fall: [0.7, 1.2],
    sway: 0.28,
    tumble: 1.3,
    land: 2.4,
    ground: Y_SPINE + 0.12,
  });
  const moteKind = life.motes({
    count: 28,
    colors: ['#ffe28a', '#ffd068'],
    size: [0.045, 0.075],
    speed: [0.18, 0.38],
    height: [0.4, 2.3],
    rise: 0.05,
    glow: 1.8,
  });
  life.puffs({
    at: [{ object: chapelChimneyAnchor, offset: [0, 0, 0] }],
    perEmitter: 3,
    life: 3.8,
    rise: 0.45,
    size: [0.11, 0.25],
    drift: 0.22,
    wobble: 0.05,
    colors: ['#e9f0fa', '#dce6f5'],
  });
  const lifeCenter = new THREE.Vector3(0, 0, 0.5);

  // -------------------------------------------------------------------------
  // 8. Deterministic 180° Spread Kinematics, Mechanisms & Camera Choreography
  // -------------------------------------------------------------------------
  const FIXED_DT = 1 / 120;
  let simTime = 0;

  const smooth = (a, b, x) => {
    const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
    return t * t * (3 - 2 * t);
  };

  function openProgressAt(t) {
    if (t <= 0.08) return 0;
    const u = Math.min(1, (t - 0.08) / 3.05);
    const base = u * u * (3 - 2 * u);
    const tail = Math.max(0, t - 2.85);
    const settle = tail > 0 ? 0.016 * Math.exp(-4.2 * tail) * Math.sin(tail * 12.0) : 0;
    return Math.max(0, base + settle);
  }

  const camTarget = new THREE.Vector3();
  const focusPos = new THREE.Vector3();

  function applyPoseAtTime(t) {
    const openP = openProgressAt(t);
    const clampedOpen = Math.min(1, openP);

    // Center the closed book at x = 0 when t = 0, and glide spine to x = 0 as it opens to 180°!
    bookRoot.position.x = -PAGE_W * 0.5 * Math.pow(1 - clampedOpen, 1.15);

    // 180° spread opening angle beta: 0.02 rad (closed with stack clearance) -> 0.968 * PI (174° book cradle!)
    const beta = 0.02 + clampedOpen * (Math.PI * 0.948);

    // Left cover swings up & over through +Y (-PI -> -0.032*PI) and lifts slightly at beta=0 for stack thickness
    leftCoverPivot.position.y = Y_SPINE + 0.52 * Math.pow(1 - clampedOpen, 1.6);
    leftCoverPivot.rotation.z = -(Math.PI - beta);
    rightPivot.rotation.z = 0.035 * clampedOpen; // subtle 2° book-cradle lift on right board too

    // Bisector group tracks exact symmetry plane between left & right pages!
    const psiEff = 0.02 + clampedOpen * (Math.PI / 2 - 0.02);
    bisectorGroup.position.y = Y_SPINE + 0.14 + 0.08 * (1 - clampedOpen);
    bisectorGroup.rotation.z = psiEff - Math.PI / 2;

    // Update True Rigid V-Fold Nordic Mountain Arch
    updateRigidVFold(psiEff);

    // CRITICAL FOLD-FLAT ALIGNMENT:
    // At clampedOpen = 0, carouselRoot rotates to Math.PI/2 so its main card lies in Y_b-Z_b (X_b = 0, flat between pages!).
    // As the book opens, it unfolds smoothly to 0.36 rad (4-winged 3D Carousel Pavilion)!
    const unfoldK = smooth(0.14, 0.88, clampedOpen);
    carouselCross.userData.follow(unfoldK);
    carouselRoot.rotation.y = THREE.MathUtils.lerp(Math.PI / 2, 0.36, unfoldK);

    // Carousel reindeer arms fold flat into carouselRoot's XY plane when closed, then expand radially & spin when open!
    const mechActive = smooth(1.65, 3.25, t);
    const mt = Math.max(0, t - 1.5);
    const spinAngle = mt * 0.72 * mechActive;
    const armRadius = 2.32 * unfoldK;
    for (let i = 0; i < deerArms.length; i++) {
      const d = deerArms[i];
      const ang = d.baseAngle + spinAngle;
      // Note: inside carouselRoot, when unfoldK = 0, carouselRoot.rotation.y = PI/2, so local X maps to -Z_b (flat along spine!)
      // and local Z maps to +X_b (page thickness: must be 0 when closed!). Multiplying local Z by unfoldK guarantees X_b = 0 when closed!
      d.arm.position.set(
        Math.cos(ang) * (1.2 * (1 - unfoldK) + armRadius * unfoldK),
        Math.sin(mt * 2.8 + i * 1.57) * 0.22 * mechActive,
        Math.sin(ang) * armRadius * unfoldK,
      );
      d.arm.rotation.y = (-ang + Math.PI / 2) * unfoldK;
    }

    // Update Left & Right Page Strap-Driven Pop-up Flaps
    for (const f of pageFlaps) {
      const fp = smooth(f.lag, 0.94, clampedOpen);
      const sway = f.swayAmp > 0 && fp > 0.75
        ? windSway(t, f.x, f.z, { amp: f.swayAmp * smooth(0.75, 1.0, fp), heroHeight: 3.6 })
        : 0;
      f.pivot.rotation.x = f.foldDir * (Math.PI / 2) * (1 - fp) + f.leanOpen * fp - sway;
      f.yawG.rotation.y = f.yawOpen * smooth(0.3, 0.95, fp);
      if (f.node.userData.follow) f.node.userData.follow(fp);
    }

    // Mechanism #2: Two Winter Ice Skaters gliding along the oval cut slot on the Right Page Pond!
    const skateStand = smooth(0.35, 0.92, clampedOpen);
    for (let i = 0; i < skaters.length; i++) {
      const sk = skaters[i];
      const th = sk.phase0 + mt * 0.95 * mechActive;
      const rx = 2.65, rz = 1.6;
      const px = Math.cos(th) * rx;
      const pz = Math.sin(th) * rz;
      const vx = -Math.sin(th) * rx;
      const vz = Math.cos(th) * rz;
      sk.carrier.position.set(px, 0.05, pz);
      // Fold flat onto pond when closed; stand upright & bank into curves when open!
      sk.standPivot.rotation.x = (Math.PI / 2) * (1 - skateStand);
      sk.skCard.rotation.y = Math.atan2(vz, vx) * 0.25 * skateStand;
      sk.skCard.scale.x = vx >= 0 ? 1 : -1; // Paper flip so skater always faces camera cleanly, never edge-on!
      sk.skCard.rotation.z = Math.sin(th * 2) * 0.08 * mechActive;
    }

    // Mechanism #3: Moon & Constellation Volvelle turning behind V-Fold Mountain cutout!
    moonVolvelle.rotation.z = mt * 0.38 * mechActive;

    // Mechanism #4: Pendulum-Swinging Golden Star Lantern under Frost Arch!
    lanternPivot.rotation.z = Math.sin(mt * 2.35) * 0.22 * mechActive;

    // Warm practical lights glow inside the opened book
    const glowK = smooth(0.3, 0.92, clampedOpen);
    carouselLamp.intensity = 4.2 * glowK;
    chapelLamp.intensity = 2.8 * glowK;

    // Snowflakes & golden starlight motes appear once book opens
    const lifeShare = smooth(1.2, 2.7, t);
    snowKind.mesh.visible = lifeShare > 0.02;
    moteKind.mesh.visible = lifeShare > 0.02;
    if (snowKind.mesh.visible) snowKind.mesh.count = Math.round(145 * lifeShare);
    if (moteKind.mesh.visible) moteKind.mesh.count = Math.round(28 * lifeShare);

    // Camera choreography: keeps 100% of closed hardcover AND opened 26x17.6 spread inside 16:9 frame!
    const camEase = smooth(0.45, 3.45, t);
    const idleT = Math.max(0, t - 3.3);
    const driftYaw = Math.sin(idleT * 0.38) * 2.4 * smooth(3.3, 4.8, t);
    const driftPitch = Math.sin(idleT * 0.29 + 0.9) * 0.8 * smooth(3.3, 4.8, t);

    const pitchDeg = THREE.MathUtils.lerp(54.0, 35.5, camEase) + driftPitch;
    const yawDeg = THREE.MathUtils.lerp(0.0, 3.5, camEase) + driftYaw;
    const dist = THREE.MathUtils.lerp(45.5, 48.0, camEase);

    camTarget.set(
      THREE.MathUtils.lerp(0.0, -0.15, camEase),
      THREE.MathUtils.lerp(0.3, 2.85, camEase),
      THREE.MathUtils.lerp(0.2, 0.55, camEase),
    );
    const pit = THREE.MathUtils.degToRad(pitchDeg);
    const yaw = THREE.MathUtils.degToRad(yawDeg);
    camera.position.set(
      camTarget.x + Math.sin(yaw) * Math.cos(pit) * dist,
      camTarget.y + Math.sin(pit) * dist,
      camTarget.z + Math.cos(yaw) * Math.cos(pit) * dist,
    );
    camera.lookAt(camTarget);
    camera.updateMatrixWorld();

    focusPos.set(
      THREE.MathUtils.lerp(0, -1.2, camEase),
      THREE.MathUtils.lerp(0.3, 2.4, camEase),
      THREE.MathUtils.lerp(0.2, 2.2, camEase),
    );
    post.focus.copy(focusPos);
  }

  // -------------------------------------------------------------------------
  // 9. Resize, Capture Contract & Live Loop
  // -------------------------------------------------------------------------
  const frame = { w: 1920, h: 1080, fovY: FOV_BASE };

  function resize() {
    let w, h, pr;
    if (SIZE_PARAM) {
      [w, h] = SIZE_PARAM;
      pr = 1;
    } else {
      w = Math.max(2, window.innerWidth);
      h = Math.max(2, window.innerHeight);
      pr = Math.min(window.devicePixelRatio || 1, 2);
    }
    const aspect = w / h;
    const fovY = aspect >= 16 / 9
      ? FOV_BASE
      : THREE.MathUtils.radToDeg(2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(FOV_BASE / 2)) * ((16 / 9) / aspect)));

    renderer.setPixelRatio(pr);
    renderer.setSize(w, h, false);
    const el = renderer.domElement;
    el.style.width = `${w}px`;
    el.style.height = `${h}px`;

    camera.aspect = aspect;
    camera.fov = fovY;
    camera.updateProjectionMatrix();
    post.setSize(w, h);

    frame.w = w;
    frame.h = h;
    frame.fovY = fovY;
  }

  window.addEventListener('resize', () => {
    if (!SIZE_PARAM) {
      resize();
      renderFrame();
    }
  });
  resize();

  function renderFrame() {
    post.render(simTime);
  }

  function advanceSubstep(dt) {
    simTime += dt;
    applyPoseAtTime(simTime);
    scene.updateMatrixWorld(true);
    life.update(dt, lifeCenter);
  }

  let auto = !CAPTURE;
  let acc = 0;
  let lastNow = performance.now();

  function restart() {
    simTime = 0;
    acc = 0;
    life.reset(lifeCenter);
    applyPoseAtTime(0);
    scene.updateMatrixWorld(true);
    life.update(0, lifeCenter);
    snowKind.mesh.visible = false;
    moteKind.mesh.visible = false;
    renderFrame();
  }

  function step(sec) {
    auto = false;
    const dur = Math.max(0, Number(sec) || 0);
    if (dur > 0) {
      const n = Math.max(1, Math.round(dur / FIXED_DT));
      const dt = dur / n;
      for (let i = 0; i < n; i++) advanceSubstep(dt);
    }
    renderFrame();
    return simTime;
  }

  restart();

  renderer.domElement.addEventListener('click', () => {
    restart();
    lastNow = performance.now();
    auto = true;
  });

  mountMessageUI();

  const buildMs = Math.round(performance.now() - T0);
  window.__papercraft = {
    ready: true,
    buildMs,
    pieces: pieceCount,
    restart,
    step,
    resume() {
      lastNow = performance.now();
      auto = true;
    },
    frame,
  };

  renderer.setAnimationLoop((now) => {
    if (!auto) return;
    const dt = Math.min(0.05, Math.max(0, (now - lastNow) / 1000));
    lastNow = now;
    acc += dt;
    let guard = 0;
    while (acc >= FIXED_DT && guard++ < 24) {
      advanceSubstep(FIXED_DT);
      acc -= FIXED_DT;
    }
    renderFrame();
  });
}

init();
