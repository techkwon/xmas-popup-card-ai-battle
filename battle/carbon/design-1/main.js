// design-1/main.js
// "별빛 산타 공방의 크리스마스 이브" — 90° Stage-Back Christmas Pop-up Greeting Card
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
  PAL,
  makeTableCanvas,
  paintOuterCover,
  paintInsideBackWall,
  paintInsideBasePage,
  buildCelestialVolvelle,
  buildWorkshopFacade,
  buildClockworkWheel,
  buildSleighSkyArch,
  buildSantaSleighPiece,
  buildGrandXmasTree,
  buildSnowPine,
  buildTrainViaduct,
  buildToyTrainPiece,
  buildPullTabStrip,
  buildMessageStand,
  buildSnowmanAndGifts,
  buildRockingHorse,
  buildStreetLamp,
  buildSnowdriftCard,
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
  // 1. Wait for handwriting font before printing message on paper
  await loadMessageFont('Nanum Pen Script');
  const message = getMessage();

  // 2. Renderer & Scene (preserveDrawingBuffer: true per capture contract)
  const renderer = new THREE.WebGLRenderer({
    antialias: false,
    preserveDrawingBuffer: true,
    powerPreference: 'high-performance',
  });
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.BasicShadowMap;
  document.body.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#2c1b12');

  const FOV_BASE = 27;
  const camera = new THREE.PerspectiveCamera(FOV_BASE, 16 / 9, 4, 260);

  // Shared paper stock
  const paper = paperTextures(renderer, {
    color: '#f9f2e6',
    seed: 9,
    unitsPerTile: 5.5,
    fibres: 1.25,
    mottle: 0.06,
    normalStrength: 2.6,
  });

  // Warm Christmas Eve lighting + contact-hardening soft shadows
  PAPER_LIGHT.wrap.value = 0.32;
  PAPER_LIGHT.leak.value.set('#8d4c2a');
  PAPER_LIGHT.trans.value = 0.26;
  PAPER_LIGHT.transTint.value.set('#ffba74');

  const lights = paperLights(scene, {
    key: '#ffdab0',
    keyIntensity: 3.1,
    keyDir: [-0.75, 0.98, 0.68],
    fill: '#dcd4ee',
    fillIntensity: 0.88,
    fillDir: [0.48, 0.52, 1.0],
    sky: '#fff2dc',
    ground: '#7d5035',
    skyIntensity: 0.48,
    target: new THREE.Vector3(0, 3.0, 1.5),
    shadowExtent: 23,
    mapSize: 2048,
    distance: 68,
  });
  enableSoftShadows(lights.key, { softness: 0.24, maxPenumbra: 1.1 });

  // Warm practical hearth/workshop light inside the card (constant light count, modulated by card opening!)
  const warmLamp = new THREE.PointLight('#ffb866', 0, 18, 1.0);
  warmLamp.position.set(-1.5, 4.5, 1.2);
  scene.add(warmLamp);

  // Macro lens post-processing
  const post = new PaperPost(renderer, scene, camera, {
    focusBand: 0.48,
    ramp: 0.38,
    maxBlur: 10,
    nearGain: 1.45,
    farGain: 0.95,
    depthWeight: 0.65,
    ao: 1.1,
    aoRadius: 1.35,
    aoBias: 0.07,
    aoTint: '#4d2612',
    exposure: 0.85,
    tint: [1.025, 0.99, 0.975],
    saturation: 0.98,
    contrast: 1.15,
    greenDesat: 0.18,
    shadowTint: '#2b160c',
    shadowLift: 0.028,
    haze: '#4a2e1e',
    hazeStart: 48,
    hazeEnd: 120,
    hazeAmount: 0.18,
    vignette: 0.09,
    vignetteColor: '#1f1008',
    grain: 0.01,
    sharpen: 0.28,
  });

  // -------------------------------------------------------------------------
  // 3. Wooden Table + Festive Desk Dressing
  // -------------------------------------------------------------------------
  const tableTex = new THREE.CanvasTexture(makeTableCanvas(1024, 1024, 19));
  tableTex.colorSpace = THREE.SRGBColorSpace;
  tableTex.wrapS = tableTex.wrapT = THREE.RepeatWrapping;
  tableTex.repeat.set(3.2, 3.2);
  tableTex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  const tableMat = paperMaterial({ map: tableTex, normalMap: paper.normalMap, normalScale: 0.45 });
  const tableMesh = new THREE.Mesh(new THREE.PlaneGeometry(180, 140), tableMat);
  tableMesh.rotation.x = -Math.PI / 2;
  tableMesh.receiveShadow = true;
  scene.add(tableMesh);

  // Festive cut-paper Gold Star Ornament & Holly Sprig resting on the walnut table
  {
    const [ribPts, ribPaint] = P2.drawnPiece((g, ink) => {
      g.fillStyle = ink(PAL.spruce);
      P2.fillLeaf(g, 0, 1.05, 1.2, 0.35, 0.32);
      P2.fillLeaf(g, 0, 1.05, 1.2, 2.65, 0.32);
      g.fillStyle = ink(PAL.gold);
      g.beginPath();
      for (let i = 0; i < 10; i++) {
        const r = i % 2 === 0 ? 0.92 : 0.42;
        const a = -Math.PI / 2 + (i * Math.PI) / 5;
        const x = Math.cos(a) * r, y = 1.1 + Math.sin(a) * r;
        if (i === 0) g.moveTo(x, y); else g.lineTo(x, y);
      }
      g.closePath();
      g.fill();
      g.fillStyle = ink(PAL.berry);
      P2.draw2.ell(g, 0, 1.1, 0.22, 0.22);
    }, { w: 3.4, h: 2.8, name: 'tableSprig' });
    const sprig = makeCard(ribPts, { paint: ribPaint, paper, thickness: 0.06, pxPerUnit: 38, folds: [] });
    sprig.rotation.x = -Math.PI / 2;
    sprig.rotation.z = 0.28;
    sprig.position.set(-15.5, 0.04, 5.4);
    scene.add(sprig);
  }

  // -------------------------------------------------------------------------
  // 4. Physical 90° Greeting Card Construction & Parallelogram Pop-up Tiers
  // -------------------------------------------------------------------------
  const CARD_W = 26.0;
  const CARD_D = 15.6;
  const Z_SPINE = -6.8;
  const Y_BASE = 0.14;

  const cardRoot = new THREE.Group();
  scene.add(cardRoot);

  // Outer crimson backing board under the base page (so edges & rim show real layered card thickness!)
  const outerBaseBoard = makeCard(P2.shape.rect(CARD_W + 0.36, CARD_D + 0.24), {
    paper,
    thickness: 0.12,
    edgeWidth: 0.06,
    pxPerUnit: 24,
    effects: 0,
    folds: ['top'],
    paint: (P) => { P.fill(PAL.crimsonDark); P.felt(0.6); },
  });
  outerBaseBoard.rotation.x = -Math.PI / 2;
  outerBaseBoard.position.set(0, 0.06, Z_SPINE + CARD_D + 0.12);
  cardRoot.add(outerBaseBoard);

  // Inside Base Page (y_local = 0 at front edge Z_SPINE + CARD_D; y_local = CARD_D at Z_SPINE)
  const basePage = makeCard(P2.shape.rect(CARD_W, CARD_D), {
    paper,
    thickness: 0.09,
    edgeWidth: 0.06,
    pxPerUnit: 42,
    folds: ['top'],
    paint: paintInsideBasePage(CARD_W, CARD_D),
  });
  basePage.rotation.x = -Math.PI / 2;
  basePage.position.set(0, Y_BASE, Z_SPINE + CARD_D);
  cardRoot.add(basePage);

  // Top Leaf / Back Wall + Outer Cover (hinged at spine Z_SPINE)
  // Cutout circle in the back wall for Mechanism #1 (Celestial Volvelle)!
  const holeCx = -4.2, holeCy = 10.2, holeR = 2.45;
  const wallHole = Array.from({ length: 36 }, (_, i) => {
    const a = (i / 36) * Math.PI * 2;
    return [holeCx + Math.cos(a) * holeR, holeCy + Math.sin(a) * holeR];
  });

  const coverPivot = new THREE.Group();
  coverPivot.position.set(0, Y_BASE + 0.08, Z_SPINE);
  cardRoot.add(coverPivot);

  const topLeaf = makeCard(P2.shape.rect(CARD_W, CARD_D), {
    paper,
    thickness: 0.12,
    edgeWidth: 0.07,
    pxPerUnit: 46,
    backRes: 0.95, // crisp front cover when closed!
    folds: ['bottom'],
    holes: [wallHole],
    paint: paintInsideBackWall(CARD_W, CARD_D, [holeCx, holeCy], holeR),
    back: paintOuterCover(CARD_W, CARD_D),
  });
  coverPivot.add(topLeaf);

  // Outer pocket backing behind the Celestial Volvelle hole so when closed at t=0, no hole shows on the cover!
  const coverOuterCap = makeCard(P2.shape.rect(CARD_W + 0.36, CARD_D + 0.2), {
    paper,
    thickness: 0.09,
    edgeWidth: 0.06,
    pxPerUnit: 44,
    backRes: 0.95,
    folds: ['bottom'],
    paint: (P) => { P.fill('#18203c'); P.felt(0.5); },
    back: paintOuterCover(CARD_W + 0.36, CARD_D + 0.2),
  });
  coverOuterCap.position.z = -0.22; // space between back wall and outer cover pocket holds the volvelle wheel!
  coverPivot.add(coverOuterCap);

  // Mechanism #1: Celestial Volvelle Disc sandwiched inside the back-wall pocket on a brass brad!
  const [volPts, volPaint] = buildCelestialVolvelle(3.15);
  const volvelleMesh = makeCard(volPts, {
    paper,
    thickness: 0.06,
    edgeWidth: 0.04,
    pxPerUnit: 46,
    folds: [],
    paint: volPaint,
    glow: 1.5,
  });
  volvelleMesh.position.set(holeCx, holeCy, -0.11);
  coverPivot.add(volvelleMesh);

  // Track all parallelogram pop-up risers:
  // Each riser sits at z = Z_SPINE + d (with d + cardHeight <= CARD_D - 0.45 so it tucks 100% inside when closed!).
  const risers = [];
  let pieceCount = 4;

  function addRiser(node, {
    x = 0,
    d = 5.0,
    stackLayer = 1,
    yawOpen = 0,
    leanOpen = 0,
    strutH = 0,
    strutW = 1.6,
    strutColor = PAL.cream,
    swayAmp = 0,
    lag = 0,
  } = {}) {
    const pivot = new THREE.Group();
    pivot.position.set(x, Y_BASE + 0.05 + stackLayer * 0.038, Z_SPINE + d);
    const yawHolder = new THREE.Group();
    yawHolder.add(node);
    pivot.add(yawHolder);
    cardRoot.add(pivot);

    // Optional physical horizontal parallelogram paper strut connecting riser to back wall!
    let strutPivot = null;
    if (strutH > 0) {
      strutPivot = new THREE.Group();
      strutPivot.position.set(0, strutH, -0.05);
      const strutCard = makeCard(P2.shape.rect(strutW, d), {
        paper,
        thickness: 0.06,
        edgeWidth: 0.04,
        pxPerUnit: 28,
        effects: 0,
        folds: ['bottom', 'top'],
        paint: (P) => {
          P.fill(strutColor);
          P.felt(0.5);
          P.innerShade('#4a301c', { alpha: 0.2, blurPx: 6 });
        },
      });
      // y_local in [0, d]: when strutPivot.rotation.x = -PI/2 - pivot.rotation.x, +Y_local points toward -Z (back to the spine)!
      strutPivot.add(strutCard);
      pivot.add(strutPivot);
      pieceCount++;
    }

    pieceCount++;
    const entry = { pivot, yawHolder, node, x, d, stackLayer, yawOpen, leanOpen, strutPivot, swayAmp, lag };
    risers.push(entry);
    return entry;
  }

  // ---- TIER 1: Back Scenic Layer (d = 2.8 .. 4.0) -------------------------
  // 1A. Sky Sleigh Arch + Mechanism #2 (Curved-Slot Gliding Santa's Sleigh & Reindeer)
  const skyArchData = buildSleighSkyArch(); // H = 10.4, d = 2.8 -> 2.8 + 10.4 = 13.2 < 16.5!
  const skyArchGroup = new THREE.Group();
  const skyArchCard = makeCard(skyArchData.pts, {
    paper,
    thickness: 0.08,
    edgeWidth: 0.06,
    pxPerUnit: 44,
    holes: [skyArchData.slot],
    paint: skyArchData.paint,
  });
  skyArchGroup.add(skyArchCard);

  // Rocker arm pivoting behind the arch + Sleigh riding in front of the cut slot!
  const sleighPivot = new THREE.Group();
  sleighPivot.position.set(0, skyArchData.pivotY, 0);
  skyArchGroup.add(sleighPivot);

  // Paper slider arm behind the arch + visible tab coming through the slot
  const sleighArm = makeCard(P2.shape.rect(0.55, skyArchData.radius), {
    paper,
    thickness: 0.05,
    edgeWidth: 0.03,
    pxPerUnit: 24,
    effects: 0,
    folds: ['bottom'],
    paint: (P) => { P.fill('#d8c8b0'); },
  });
  sleighArm.position.z = -0.11;
  sleighPivot.add(sleighArm);

  const [sleighPts, sleighPaint] = buildSantaSleighPiece();
  const sleighHolder = new THREE.Group();
  sleighHolder.position.set(0, skyArchData.radius - 0.65, 0.14);
  const sleighCard = makeCard(sleighPts, {
    paper,
    thickness: 0.08,
    edgeWidth: 0.05,
    pxPerUnit: 52,
    folds: [],
    paint: sleighPaint,
  });
  sleighCard.position.y = -0.45;
  sleighHolder.add(sleighCard);
  sleighPivot.add(sleighHolder);
  pieceCount += 2;

  addRiser(skyArchGroup, {
    x: 4.3,
    d: 2.5,
    stackLayer: 1,
    yawOpen: -0.05,
    strutH: 2.2,
    strutW: 0.9,
    strutColor: '#364666',
    lag: 0.06,
  });

  // 1B. Santa's Toy Workshop + Clocktower + Mechanism #3 (Spinning Clockwork Wheel)
  const wsData = buildWorkshopFacade(); // H = 11.2, d = 3.5 -> 3.5 + 11.2 = 14.7 < 15.2!
  const workshopGroup = new THREE.Group();
  const workshopCard = makeCard(wsData.pts, {
    paper,
    thickness: 0.09,
    edgeWidth: 0.06,
    pxPerUnit: 48,
    paint: wsData.paint,
    glow: 1.45,
  });
  workshopGroup.add(workshopCard);

  // Clockwork Windwheel Spinner on clocktower gable
  const [wheelPts, wheelPaint] = buildClockworkWheel(1.12);
  const clockWheel = makeCard(wheelPts, {
    paper,
    thickness: 0.07,
    edgeWidth: 0.04,
    pxPerUnit: 48,
    folds: [],
    paint: wheelPaint,
  });
  clockWheel.position.set(wsData.pin[0], wsData.pin[1], 0.15);
  workshopGroup.add(clockWheel);
  pieceCount++;

  // Chimney smoke emitter anchor
  const chimneyAnchor = new THREE.Object3D();
  chimneyAnchor.position.set(wsData.chimney[0], wsData.chimney[1], 0);
  workshopGroup.add(chimneyAnchor);

  addRiser(workshopGroup, {
    x: -5.0,
    d: 3.5,
    stackLayer: 2,
    yawOpen: 0.07,
    strutH: 3.4,
    strutW: 1.0,
    strutColor: PAL.oakDark,
    lag: 0.1,
  });

  // 1C. Flanking Volumetric Snow-Spruce Cross-Trees (fold flat at p=0, open to 3D cross at p=1!)
  const crossNodes = [];
  for (const [tx, td, tw, th, yaw, sd, layer] of [
    [-10.4, 4.1, 3.8, 7.0, 0.36, 21, 2],
    [10.3, 4.2, 3.7, 6.8, -0.38, 29, 2],
    [-9.8, 7.6, 3.2, 5.6, -0.34, 37, 4],
    [10.6, 8.0, 3.1, 5.4, 0.32, 43, 4],
  ]) {
    const [pPts, pPaint] = buildSnowPine(tw, th, sd);
    const treeCross = crossCard(pPts, {
      paper,
      paint: pPaint,
      thickness: 0.08,
      edgeWidth: 0.05,
      pxPerUnit: 42,
      angle: 78,
      seed: sd,
    });
    crossNodes.push(treeCross);
    addRiser(treeCross, {
      x: tx,
      d: td,
      stackLayer: layer,
      yawOpen: yaw,
      swayAmp: 1.3,
      lag: 0.12 + layer * 0.02,
    });
  }

  // ---- TIER 2: Mid-Stage Hero Layer (d = 5.8 .. 7.8) ----------------------
  // 2A. Grand Decorated Christmas Tree Centrepiece (3D slotted cross!)
  {
    const [gtPts, gtPaint] = buildGrandXmasTree(5.0, 8.5, 7); // 5.8 + 8.5 = 14.3 < 15.2!
    const grandTree = crossCard(gtPts, {
      paper,
      paint: gtPaint,
      thickness: 0.09,
      edgeWidth: 0.06,
      pxPerUnit: 48,
      angle: 82,
      glow: 1.6,
      seed: 7,
    });
    crossNodes.push(grandTree);
    addRiser(grandTree, {
      x: 0.5,
      d: 5.8,
      stackLayer: 3,
      yawOpen: 0.35,
      strutH: 2.2,
      strutW: 0.7,
      strutColor: PAL.spruceDark,
      swayAmp: 0.9,
      lag: 0.14,
    });
  }

  // 2B. VintageGlowing Streetlamps
  for (const [lx, ld, lyaw, sd] of [[-8.2, 6.0, 0.14, 61], [7.8, 6.1, -0.16, 67]]) {
    const [lPts, lPaint] = buildStreetLamp();
    const lampCard = makeCard(lPts, {
      paper,
      paint: lPaint,
      thickness: 0.08,
      edgeWidth: 0.05,
      pxPerUnit: 46,
      glow: 1.7,
      seed: sd,
    });
    addRiser(lampCard, { x: lx, d: ld, stackLayer: 3, yawOpen: lyaw, swayAmp: 0.35, lag: 0.16 });
  }

  // 2C. Toy Train Viaduct + Mechanism #4 (Horizontal Slot-Sliding Toy Steam Train + Pull-Tab!)
  const viaData = buildTrainViaduct();
  const viaductGroup = new THREE.Group();
  const viaductCard = makeCard(viaData.pts, {
    paper,
    thickness: 0.09,
    edgeWidth: 0.05,
    pxPerUnit: 48,
    holes: [viaData.slot],
    paint: viaData.paint,
  });
  viaductGroup.add(viaductCard);

  const trainData = buildToyTrainPiece();
  const trainGroup = new THREE.Group();
  const trainCard = makeCard(trainData.pts, {
    paper,
    thickness: 0.08,
    edgeWidth: 0.05,
    pxPerUnit: 52,
    folds: [],
    paint: trainData.paint,
  });
  // Back slider pin showing behind slot
  const trainPin = makeCard(P2.shape.rect(0.7, 0.5), {
    paper,
    thickness: 0.06,
    edgeWidth: 0.03,
    pxPerUnit: 20,
    effects: 0,
    folds: [],
    paint: (P) => P.fill(PAL.oak),
  });
  trainPin.position.set(0, 0.72, -0.14);
  trainGroup.add(trainCard, trainPin);
  trainGroup.position.set(0, 0.78, 0.14);
  viaductGroup.add(trainGroup);

  const trainFunnelAnchor = new THREE.Object3D();
  trainFunnelAnchor.position.set(trainData.funnel[0], trainData.funnel[1], 0);
  trainGroup.add(trainFunnelAnchor);
  pieceCount++;

  addRiser(viaductGroup, {
    x: -3.2,
    d: 7.7,
    stackLayer: 4,
    yawOpen: 0.03,
    lag: 0.18,
  });

  // Visible flat paper pull-tab strip sliding along the left margin of the base page!
  const [tabPts, tabPaint] = buildPullTabStrip();
  const pullTabMesh = makeCard(tabPts, {
    paper,
    thickness: 0.07,
    edgeWidth: 0.04,
    pxPerUnit: 40,
    folds: [],
    paint: tabPaint,
  });
  pullTabMesh.rotation.x = -Math.PI / 2;
  pullTabMesh.rotation.z = Math.PI; // arrow pointing outward on left edge
  pullTabMesh.position.set(-11.4, Y_BASE + 0.07, Z_SPINE + 7.9);
  cardRoot.add(pullTabMesh);
  pieceCount++;

  // ---- TIER 3: Foreground Message Stand, Snowman & Rocking Horse (d = 9.4 .. 10.2) ----
  // 3A. Festive Message Board & Santa Postbox (H = 5.5, d = 9.4 -> 9.4 + 5.5 = 14.9 < 15.3!)
  {
    const [msgPts, msgPaint] = buildMessageStand(message);
    const msgCard = makeCard(msgPts, {
      paper,
      paint: msgPaint,
      thickness: 0.09,
      edgeWidth: 0.06,
      pxPerUnit: 64, // High DPI for super crisp Korean handwriting!
      seed: 88,
    });
    addRiser(msgCard, {
      x: 5.4,
      d: 9.4,
      stackLayer: 5,
      yawOpen: -0.1,
      leanOpen: -0.04,
      lag: 0.2,
    });
  }

  // 3B. Cheerful Snowman, Gifts & Mechanism #5 (Pendulum Rocking Dala Horse)
  const fgLeftGroup = new THREE.Group();
  {
    const [smPts, smPaint] = buildSnowmanAndGifts();
    const smCard = makeCard(smPts, {
      paper,
      paint: smPaint,
      thickness: 0.08,
      edgeWidth: 0.05,
      pxPerUnit: 50,
      seed: 91,
    });
    fgLeftGroup.add(smCard);
  }

  const horsePivot = new THREE.Group();
  horsePivot.position.set(2.55, 1.12, 0.16); // brad pin pivot!
  {
    const [rhPts, rhPaint] = buildRockingHorse();
    const rhCard = makeCard(rhPts, {
      paper,
      paint: rhPaint,
      thickness: 0.08,
      edgeWidth: 0.05,
      pxPerUnit: 50,
      folds: [],
      seed: 95,
    });
    rhCard.position.set(0, -1.12, 0);
    horsePivot.add(rhCard);
  }
  fgLeftGroup.add(horsePivot);
  pieceCount++;

  addRiser(fgLeftGroup, {
    x: -5.8,
    d: 10.1,
    stackLayer: 6,
    yawOpen: 0.11,
    lag: 0.22,
  });

  // ---- TIER 4: Front Edge Snowdrifts & Peeking Fox (d = 12.5) -------------
  for (const [sx, sw, sh, fox, sd] of [
    [-8.4, 5.8, 1.55, false, 101],
    [-1.5, 5.6, 1.5, true, 105],
    [9.4, 4.6, 1.4, false, 109],
  ]) {
    const [sPts, sPaint] = buildSnowdriftCard(sw, sh, fox, sd);
    const sCard = makeCard(sPts, {
      paper,
      paint: sPaint,
      thickness: 0.08,
      edgeWidth: 0.05,
      pxPerUnit: 44,
      seed: sd,
    });
    addRiser(sCard, { x: sx, d: 12.5, stackLayer: 7, yawOpen: 0, lag: 0.24 });
  }

  // -------------------------------------------------------------------------
  // 5. Ambient Paper Life (Snowflakes + Chimney & Locomotive Smoke Puffs)
  // -------------------------------------------------------------------------
  const life = createLife({
    scene,
    camera,
    heroHeight: 3.6,
    seed: 25,
    wind: [0.42, 0.18],
    box: { w: 8.5, d: 6.2, h: 5.2 },
  });
  const snowKind = life.fallers({
    count: 135,
    cut: 'flake',
    colors: ['#ffffff', '#f5f8ff', '#fff6e4'],
    size: [0.065, 0.125],
    fall: [0.75, 1.25],
    sway: 0.25,
    tumble: 1.4,
    land: 2.2,
    ground: Y_BASE + 0.06,
  });
  life.puffs({
    at: [
      { object: chimneyAnchor, offset: [0, 0, 0] },
      { object: trainFunnelAnchor, offset: [0, 0, 0] },
    ],
    perEmitter: 4,
    life: 3.6,
    rise: 0.52,
    size: [0.11, 0.28],
    drift: 0.24,
    wobble: 0.05,
    colors: ['#f8efe0', '#efe4d0'],
  });
  const lifeCenter = new THREE.Vector3(0, 0, 1.5);

  // -------------------------------------------------------------------------
  // 6. Deterministic Opening Kinematics, Mechanisms & Camera Choreography
  // -------------------------------------------------------------------------
  const FIXED_DT = 1 / 120;
  let simTime = 0;

  const smooth = (a, b, x) => {
    const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
    return t * t * (3 - 2 * t);
  };

  // Opening curve: flat closed at t = 0, begins cracking open gently by t = 0.5, fully open & settled by t = 3.4s
  function openProgressAt(t) {
    if (t <= 0.08) return 0;
    const u = Math.min(1, (t - 0.08) / 3.05);
    const base = u * u * (3 - 2 * u);
    const tail = Math.max(0, t - 2.85);
    const quiver = tail > 0 ? 0.02 * Math.exp(-4.0 * tail) * Math.sin(tail * 13.0) : 0;
    return Math.max(0, base + quiver);
  }

  const camTarget = new THREE.Vector3();
  const focusPos = new THREE.Vector3();

  function applyPoseAtTime(t) {
    const openP = openProgressAt(t);
    const clampedOpen = Math.min(1, openP);

    // Back wall opens from alpha = 0 (lying flat over base page) to ~93° (Math.PI * 0.517)
    // When closed, coverPivot lifts slightly (0.44 units) to enclose the flat stack of pop-ups cleanly!
    const alphaWall = openP * (Math.PI * 0.518);
    coverPivot.position.y = Y_BASE + 0.08 + 0.44 * Math.pow(1 - clampedOpen, 1.6);
    coverPivot.rotation.x = Math.PI / 2 - alphaWall;

    // Warm workshop practical light wakes up inside the card as it opens
    warmLamp.intensity = 3.8 * smooth(0.25, 0.92, clampedOpen);

    // Update each parallelogram pop-up riser
    for (const r of risers) {
      const rp = Math.max(0, Math.min(1.04, (openP - r.lag * (1 - clampedOpen)) / (1 - r.lag * 0.15)));
      const pClamped = Math.min(1, rp);
      const sway = r.swayAmp > 0 && pClamped > 0.7
        ? windSway(t, r.x, r.d, { amp: r.swayAmp * smooth(0.7, 1.0, pClamped), heroHeight: 3.6 })
        : 0;
      // Parallelogram angle: 0 when closed (flat toward +Z), PI/2 when open (upright +Y)
      const alphaRiser = Math.min(Math.PI * 0.505, rp * (Math.PI / 2)) - r.leanOpen * pClamped + sway;
      r.pivot.rotation.x = Math.PI / 2 - alphaRiser;
      r.yawHolder.rotation.y = r.yawOpen * smooth(0.25, 0.95, pClamped);

      if (r.strutPivot) {
        // Keep horizontal roof/stage strut level with base page!
        r.strutPivot.rotation.x = -Math.PI / 2 - r.pivot.rotation.x;
      }
      if (r.node.userData.follow) {
        r.node.userData.follow(pClamped);
      }
    }

    // Continuous Paper Mechanisms (ramp up smoothly once the card opens so nothing clips while flat!)
    const mechActive = smooth(1.6, 3.2, t);
    const mt = Math.max(0, t - 1.4);

    // Mechanism #1: Celestial Star-Wheel Volvelle behind arched cutout
    volvelleMesh.rotation.z = mt * 0.34 * mechActive;

    // Mechanism #2: Santa's Sleigh & Reindeer gliding back & forth along curved sky slot
    const sleighSwing = Math.sin(mt * 1.15) * 0.34 * mechActive;
    sleighPivot.rotation.z = sleighSwing;
    sleighCard.rotation.z = Math.cos(mt * 2.3) * 0.05 * mechActive; // gentle galloping pitch!

    // Mechanism #3: Peppermint Clockwork Windwheel on Workshop Gable
    clockWheel.rotation.z = -mt * 1.35 * mechActive;

    // Mechanism #4: Toy Christmas Train sliding in horizontal viaduct slot + linked Pull-Tab!
    const trainSlide = Math.sin(mt * 1.05 - 0.4) * 2.15 * mechActive;
    trainGroup.position.x = trainSlide;
    pullTabMesh.position.x = -11.6 + trainSlide * 0.45;
    pullTabMesh.visible = clampedOpen > 0.35;

    // Mechanism #5: Pendulum Rocking Dala Horse on brad pin
    horsePivot.rotation.z = Math.sin(mt * 2.6) * 0.19 * mechActive;

    // Snow visibility: snow falls gently into the open card once cover lifts!
    const snowShare = smooth(1.1, 2.6, t);
    snowKind.mesh.visible = snowShare > 0.02;
    if (snowKind.mesh.visible) {
      snowKind.mesh.count = Math.round(135 * snowShare);
    }

    // Camera choreography: keeps 100% of the physical card (including top of back wall!) inside 16:9 from t=0..10s!
    const camEase = smooth(0.15, 3.35, t);
    const idleT = Math.max(0, t - 3.3);
    const driftYaw = Math.sin(idleT * 0.42) * 2.1 * smooth(3.3, 4.8, t);
    const driftPitch = Math.sin(idleT * 0.31 + 1.1) * 0.7 * smooth(3.3, 4.8, t);

    const pitchDeg = THREE.MathUtils.lerp(51.5, 30.2, camEase) + driftPitch;
    const yawDeg = THREE.MathUtils.lerp(-2.5, -4.2, camEase) + driftYaw;
    const dist = THREE.MathUtils.lerp(46.0, 54.4, camEase);

    camTarget.set(
      THREE.MathUtils.lerp(0.0, 0.15, camEase),
      THREE.MathUtils.lerp(0.4, 6.35, camEase),
      THREE.MathUtils.lerp(0.9, 0.8, camEase),
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
      THREE.MathUtils.lerp(0, 1.2, camEase),
      THREE.MathUtils.lerp(0.4, 3.8, camEase),
      THREE.MathUtils.lerp(1.3, 4.2, camEase),
    );
    post.focus.copy(focusPos);
  }

  // -------------------------------------------------------------------------
  // 7. Resize, Capture Contract & Live Loop
  // -------------------------------------------------------------------------
  const frame = { w: 1920, h: 1080, fovY: FOV_BASE };

  function resize() {
    let w, h, pr;
    if (SIZE_PARAM) {
      [w, h] = SIZE_PARAM;
      pr = 1; // Exact ?size=WxH at pixel ratio 1 per capture contract
    } else {
      w = Math.max(2, window.innerWidth);
      h = Math.max(2, window.innerHeight);
      pr = Math.min(window.devicePixelRatio || 1, 2);
    }
    const aspect = w / h;
    // Keep 16:9 lens framing safe even on narrower browser windows
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
    // Re-hide snow at exact t = 0 closed state
    snowKind.mesh.visible = false;
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

  // Initial closed state at t = 0
  restart();

  // Click on scene restarts the opening in live mode
  renderer.domElement.addEventListener('click', () => {
    restart();
    lastNow = performance.now();
    auto = true;
  });

  // Mount "✉ 메시지 쓰기" UI (auto-skips in ?capture)
  mountMessageUI();

  // Warm-up compile & expose capture contract
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
