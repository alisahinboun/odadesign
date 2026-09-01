/**
 * GORSELLESTIRICI
 * Ic mimar kullanimina yonelik etkilesimli 3B goruntuleyici:
 *   - foto ile birebir karsilastirma icin kamera onayarlari
 *   - katman ac/kapa, otomatik "bebek evi" kesiti
 *   - olcu kotalari + tikla-olc araci
 *   - mahal/donati listesi (tikla -> odakla)
 *   - GLB / OBJ / PNG ihracati
 *   - birinci sahis yurume modu
 */
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

import {
  room, furniture, equipment, wallItems, palette, viewPresets, meta, door,
  partition, wallUnits, ceiling as ceilCfg, floor as floorCfg, clutter,
  windows, radiators,
} from './config/room.js';
import { buildRoom, buildLights, LAYERS, roomMetrics } from './model/index.js';
import { buildPlanDimensions, buildElevationDimensions } from './viewer/dimensions.js';
import { exportGLB, exportOBJ, exportPNG, downloadsNS } from './export/gltf.js';
import { createPipeline } from './viewer/render.js';
import { createDragController } from './viewer/drag.js';
import { cm } from './lib/geom.js';
import { doorSwingLimit, metrics, deskClearance, doorSight } from './lib/analysis.js';
import { palettes, layouts, resolveDesign, defaultPalette, defaultLayout, getPalette, getLayout } from './config/design.js';
import { applyScheme, userHidden } from './config/room.js';
import { clearMaterialCache } from './lib/materials.js';

/* ===================================================== SAHNE KURULUMU */
/**
 * Telefon / tablet kipi. Iki sey degisir:
 *   - Panel sag serit yerine alt sayfa (bottom sheet) olur ve KAPALI baslar,
 *     yoksa kucuk ekranda odayi hic gormeden aciliyor.
 *   - Isleme yuku dusurulur: GTAO golgelemesi ve yuksek piksel orani
 *     telefon GPU'sunda kareyi 10 fps'e dusuruyor.
 * Parmakla kullanim (dokunmatik) ekran genisliginden ayri bir olcut.
 */
const TOUCH = matchMedia('(pointer: coarse)').matches;
const SMALL = matchMedia('(max-width: 820px)').matches;
const MOBILE = SMALL || TOUCH;

const app = document.getElementById('app');
const renderer = new THREE.WebGLRenderer({ antialias: !MOBILE, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, MOBILE ? 1.5 : 2));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.90;
renderer.outputColorSpace = THREE.SRGBColorSpace;
app.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0f1216);

// Ortam haritasi (krom, ayna, cila icin)
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

const camera = new THREE.PerspectiveCamera(62, innerWidth / innerHeight, 0.03, 220);
const orthoCam = new THREE.OrthographicCamera(-3, 3, 3, -3, 0.01, 200);
let activeCam = camera;

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.075;
controls.maxPolarAngle = Math.PI * 0.98;
controls.minDistance = 0.25;
controls.maxDistance = 26;
controls.target.set(cm(room.width / 2), cm(120), cm(room.depth / 2));

/* ========================================================= MODELI KUR */
let curPalette = defaultPalette;
let curLayout = defaultLayout;
applyScheme(resolveDesign(curPalette, curLayout));

let modelRoot = buildRoom();
scene.add(modelRoot);
const lights = buildLights(scene);

/** Bir Object3D agacinin GPU kaynaklarini birakir */
function disposeTree(node) {
  node.traverse((o) => {
    if (!o.isMesh && !o.isSprite && !o.isLine) return;
    o.geometry?.dispose?.();
    const mats = Array.isArray(o.material) ? o.material : [o.material];
    for (const m of mats) { m?.map?.dispose?.(); m?.dispose?.(); }
  });
}

/* --------------------------------------------------- isleme hatti (AO) */
let pipeline = null;
let useAO = !MOBILE;   // telefonda kapali baslar, panelden acilabilir
try {
  pipeline = createPipeline(renderer, scene, camera);
} catch (e) {
  console.warn('GTAO baslatilamadi, duz isleme kullanilacak:', e);
  useAO = false;
}

let dimPlan = buildPlanDimensions();
let dimElev = buildElevationDimensions();
dimPlan.visible = false; dimElev.visible = false;
scene.add(dimPlan, dimElev);

/* ------------------------------------------------- esya tasima kontrolcusu */
let editMode = false;
let editStatus = { ok: true, msgs: [] };
const dragger = createDragController({
  renderer,
  camera,
  getActiveCam: () => activeCam,
  modelRootRef: () => modelRoot,
  onChange: (st) => {
    editStatus = st;
    selBox.material.color.setHex(st.ok ? 0x6cc248 : 0xd4553a);
    if (selected?.item) selBox.setFromObject(dragGroupOf(selected.item.id) || selected.host);
    updateReadout();
  },
});
function dragGroupOf(id) {
  let f = null;
  modelRoot.traverse((o) => { if (!f && o.name === `${id}-yer`) f = o; });
  return f;
}

/* Katman kayitlari: layer -> [Object3D] */
let layerMap = new Map();
/** id -> o esyaya ait sahne nesneleri (tek tek gizleyip acmak icin) */
let itemMap = new Map();
function indexLayers(node) {
  node.traverse((o) => {
    const l = o.userData?.layer;
    if (l) {
      if (!layerMap.has(l)) layerMap.set(l, []);
      layerMap.get(l).push(o);
    }
    const id = o.userData?.item?.id;
    if (id) {
      if (!itemMap.has(id)) itemMap.set(id, []);
      itemMap.get(id).push(o);
    }
  });
}
indexLayers(modelRoot);
indexLayers(lights.group);
layerMap.set('dimPlan', [dimPlan]);
layerMap.set('dimElev', [dimElev]);

const layerState = {};
for (const l of LAYERS) layerState[l.key] = l.on;
layerState.dimPlan = false;
layerState.dimElev = false;

function applyLayers() {
  for (const [key, objs] of layerMap) {
    const on = layerState[key] !== false;
    for (const o of objs) o.visible = on;
  }
  applyCutaway();
  applyItemVisibility();
}

/**
 * Kullanicinin tek tek kapattigi esyalar. Katman gorunurlugunden SONRA
 * uygulanir, yoksa katman anahtari kapatilan esyayi geri acar.
 * Bu yalnizca GORUNTUYU etkiler - olculer, denetim ve metraj degismez
 * (analysis.js inRoom() kullanir).
 */
function applyItemVisibility() {
  for (const [id, objs] of itemMap) {
    if (userHidden.has(id)) for (const o of objs) o.visible = false;
  }
}
function setItemHidden(id, off) {
  if (off) userHidden.add(id); else userHidden.delete(id);
  applyLayers();
}

/* ============================================ OTOMATIK KESIT (BEBEK EVI) */
let cutaway = true;
const WALL_KEYS = {
  partition: { n: new THREE.Vector3(0, 0, -1), p: new THREE.Vector3(cm(room.width / 2), 0, 0) },
  wallBack:  { n: new THREE.Vector3(0, 0, 1),  p: new THREE.Vector3(cm(room.width / 2), 0, cm(room.depth)) },
  wallLeft:  { n: new THREE.Vector3(-1, 0, 0), p: new THREE.Vector3(0, 0, cm(room.depth / 2)) },
  wallRight: { n: new THREE.Vector3(1, 0, 0),  p: new THREE.Vector3(cm(room.width), 0, cm(room.depth / 2)) },
  ceiling:   { n: new THREE.Vector3(0, 1, 0),  p: new THREE.Vector3(cm(room.width / 2), cm(room.height), cm(room.depth / 2)) },
};
function applyCutaway() {
  if (!cutaway) return;
  const camPos = activeCam.position;
  for (const [key, w] of Object.entries(WALL_KEYS)) {
    if (layerState[key] === false) continue;
    const outside = camPos.clone().sub(w.p).dot(w.n) > 0.02;
    for (const o of layerMap.get(key) || []) o.visible = !outside;
    if (key === 'partition') {
      for (const o of layerMap.get('door') || []) o.visible = layerState.door !== false && !outside;
      // Koridor sadece odanin ICINDEN bakilirken anlamli; bebek evi / plan
      // gorunumunde gorseli bozdugu icin otomatik gizlenir.
      const cx = camPos.x, cz = camPos.z;
      const camOut = cx < -0.05 || cx > cm(room.width) + 0.05 || cz < -0.05 || cz > cm(room.depth) + 0.05;
      const showCorr = layerState.corridor !== false && !camOut && activeCam !== orthoCam;
      for (const o of layerMap.get('corridor') || []) o.visible = showCorr;
    }
    if (key === 'wallRight') {
      for (const o of layerMap.get('wallUnits') || []) o.visible = layerState.wallUnits !== false;
    }
  }
}

/* ======================================================= KAMERA GECISI */
let tween = null;
function flyTo(pos, target, fov, ms = 780) {
  const from = { p: camera.position.clone(), t: controls.target.clone(), f: camera.fov };
  const to = { p: new THREE.Vector3(cm(pos[0]), cm(pos[2]), cm(pos[1])), t: new THREE.Vector3(cm(target[0]), cm(target[2]), cm(target[1])), f: fov ?? camera.fov };
  const t0 = performance.now();
  tween = () => {
    const k = Math.min(1, (performance.now() - t0) / ms);
    const e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
    camera.position.lerpVectors(from.p, to.p, e);
    controls.target.lerpVectors(from.t, to.t, e);
    camera.fov = from.f + (to.f - from.f) * e;
    camera.updateProjectionMatrix();
    if (k >= 1) tween = null;
  };
}

/** Kapi kanadi acisini ayarla (kaydirici ve onayarlar ayni yolu kullanir) */
const doorPivot = () => modelRoot.getObjectByName('K1-pivot');
let doorAngle = door.openAngle;
function setDoorAngle(a) {
  doorAngle = a;
  const pv = doorPivot();
  if (pv) {
    const sign = door.hinge === 'left' ? 1 : -1;
    const dir = door.swing === 'in' ? 1 : -1;
    pv.rotation.y = -sign * dir * (a * Math.PI / 180);
  }
  const sl = document.getElementById('dr');
  if (sl) { sl.value = a; const lb = document.getElementById('dv'); if (lb) lb.textContent = Math.round(a) + '°'; }
}

function usePreset(p) {
  if (p.doorAngle !== undefined) setDoorAngle(p.doorAngle);
  if (p.ortho) {
    setOrtho(true);
    orthoCam.position.set(cm(p.pos[0]), cm(p.pos[2]), cm(p.pos[1]));
    orthoCam.up.set(0, 0, -1);
    orthoCam.lookAt(cm(p.target[0]), cm(p.target[2]), cm(p.target[1]));
    fitOrtho();
  } else {
    setOrtho(false);
    flyTo(p.pos, p.target, p.fov);
  }
}

function setOrtho(on) {
  if (on === (activeCam === orthoCam)) return;
  activeCam = on ? orthoCam : camera;
  controls.object = activeCam;
  controls.enabled = !on;
  if (!on) { camera.up.set(0, 1, 0); controls.enabled = true; }
  onResize();
}
function fitOrtho() {
  const a = innerWidth / innerHeight;
  // Oda + kota paylari sigacak sekilde (her yonde ~70 cm pay)
  const need = Math.max(cm(room.depth + 140) / 2, cm(room.width + 160) / 2 / a);
  const h = need, w = h * a;
  orthoCam.left = -w; orthoCam.right = w; orthoCam.top = h; orthoCam.bottom = -h;
  orthoCam.updateProjectionMatrix();
}

/* ============================================== BIRINCI SAHIS (YURUME) */
const walk = { on: false, yaw: -Math.PI / 2, pitch: 0, eye: 165, keys: new Set(), vel: new THREE.Vector3() };
function setWalk(on) {
  walk.on = on;
  controls.enabled = !on && activeCam === camera;
  if (on) {
    setOrtho(false);
    camera.position.set(cm(room.width * 0.55), cm(walk.eye), cm(room.depth * 0.78));
    walk.yaw = -Math.PI / 2 - 0.35; walk.pitch = -0.06;
    camera.fov = 72; camera.updateProjectionMatrix();
    renderer.domElement.requestPointerLock?.();
  } else {
    document.exitPointerLock?.();
    camera.fov = 62; camera.updateProjectionMatrix();
  }
  buildUI();
}
/**
 * ESYA TASIMA KIPI.
 *
 * ⚠ Bu fonksiyon eksikti: "Eşyaları taşı" dügmesi ve E tusu
 * `setEditMode is not defined` firlatiyor, ustelik drag.js'in state.enabled
 * bayragi hicbir yerde acilmiyordu. Yani tasima ozelligi arayuzden HIC
 * calismiyordu. Ikisi de burada duzeltildi.
 */
function setEditMode(on) {
  editMode = !!on;
  dragger.setEnabled(editMode);
  if (editMode) {
    // Olcum ve yurume kipi ayni tiklamayi kullaniyor; biri acilinca digeri kapanir.
    if (measure.on) {
      measure.on = false; measure.pts = []; measure.hover = null;
      renderer.domElement.style.cursor = '';
      drawMeasure();
    }
    if (walk.on) setWalk(false);
  } else {
    dragger.end();
    dragger.select(null);
    selected = null;
    selBox.visible = false;
    editStatus = { ok: true, msgs: [] };
  }
  controls.enabled = activeCam === camera && !walk.on;
  buildUI();
  updateReadout();
}

addEventListener('keydown', (e) => {
  if (e.code === 'KeyW' || e.code === 'KeyA' || e.code === 'KeyS' || e.code === 'KeyD' ||
      e.code === 'ArrowUp' || e.code === 'ArrowDown' || e.code === 'ArrowLeft' || e.code === 'ArrowRight' ||
      e.code === 'ShiftLeft' || e.code === 'Space') walk.keys.add(e.code);
  if (e.code === 'Escape' && walk.on) setWalk(false);
  if (e.code === 'KeyG' && !e.metaKey && !e.ctrlKey) setWalk(!walk.on);
  if (e.code === 'KeyM') { setMeasure(!measure.on); }
  if (e.code === 'Escape' && measure.on) {
    measure.pts.length ? (measure.pts = [], measure.hover = null, drawMeasure(), updateReadout())
                       : setMeasure(false);
  }
  if (e.code === 'KeyE' && !e.metaKey && !e.ctrlKey) setEditMode(!editMode);
  if (e.code === 'KeyR' && editMode && selected?.item) {
    dragger.rotate(e.shiftKey ? -15 : 15);
    if (selected.host) selBox.setFromObject(dragGroupOf(selected.item.id) || selected.host);
    buildUI();
  }
});
addEventListener('keyup', (e) => walk.keys.delete(e.code));
/**
 * Yurume modunda bakis. Pointer lock varsa fare serbest hareketle bakar;
 * gomulu (iframe) gosterimde pointer lock engellenebildigi icin sol tusa
 * basili surukleyerek bakma da desteklenir.
 */
let dragLook = false;
let mHoverT = 0;
renderer.domElement.addEventListener('pointermove', (e) => {
  if (editMode && dragger.state.dragging) { dragger.move(e); return; }
  if (measure.on) {
    // her karede raycast pahali; 40 ms'de bir yeter
    const now = performance.now();
    if (now - mHoverT < 40) return;
    mHoverT = now;
    const h = pick(e);
    const np = h ? snapPoint(h) : null;
    const snapped = !!(h && np && np.distanceTo(h.point) > 1e-6);
    renderer.domElement.style.cursor = snapped ? 'cell' : 'crosshair';
    if (measure.pts.length === 1) { measure.hover = np; drawMeasure(); updateReadout(); }
  }
});
addEventListener('pointerup', () => {
  if (dragger.end()) { controls.enabled = activeCam === camera && !walk.on; buildUI(); }
});

renderer.domElement.addEventListener('mousemove', (e) => {
  if (!walk.on) return;
  const locked = document.pointerLockElement === renderer.domElement;
  if (!locked && !dragLook) return;
  const mx = locked ? e.movementX : e.movementX || 0;
  const my = locked ? e.movementY : e.movementY || 0;
  walk.yaw -= mx * 0.0022;
  walk.pitch = Math.max(-1.35, Math.min(1.35, walk.pitch - my * 0.0022));
});
renderer.domElement.addEventListener('mousedown', (e) => {
  if (walk.on && e.button === 0) {
    dragLook = true;
    if (!document.pointerLockElement) renderer.domElement.requestPointerLock?.();
  }
});
addEventListener('mouseup', () => { dragLook = false; });

const BOUNDS = { x0: 22, x1: room.width - 22, y0: 22, y1: room.depth - 22 };
function stepWalk(dt) {
  camera.quaternion.setFromEuler(new THREE.Euler(walk.pitch, walk.yaw, 0, 'YXZ'));
  const fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion); fwd.y = 0; fwd.normalize();
  const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion); right.y = 0; right.normalize();
  const spd = (walk.keys.has('ShiftLeft') ? 2.3 : 1.15) * dt;
  const d = new THREE.Vector3();
  if (walk.keys.has('KeyW') || walk.keys.has('ArrowUp')) d.add(fwd);
  if (walk.keys.has('KeyS') || walk.keys.has('ArrowDown')) d.sub(fwd);
  if (walk.keys.has('KeyD') || walk.keys.has('ArrowRight')) d.add(right);
  if (walk.keys.has('KeyA') || walk.keys.has('ArrowLeft')) d.sub(right);
  if (d.lengthSq() > 0) d.normalize().multiplyScalar(spd);
  walk.vel.lerp(d, 0.35);
  camera.position.add(walk.vel);
  camera.position.x = Math.max(cm(BOUNDS.x0), Math.min(cm(BOUNDS.x1), camera.position.x));
  camera.position.z = Math.max(cm(BOUNDS.y0), Math.min(cm(BOUNDS.y1), camera.position.z));
  camera.position.y = cm(walk.eye);
}

/* ================================================= OLCME + SECME ARACI */
const ray = new THREE.Raycaster();
const measure = { on: false, pts: [], hover: null, group: new THREE.Group() };
scene.add(measure.group);
/** Olcum etiketleri (HTML) - 3B noktalar her karede ekrana yansitilir */
const mLabels = document.createElement('div');
mLabels.id = 'mlab';
document.body.appendChild(mLabels);
let selected = null;
const selBox = new THREE.BoxHelper(new THREE.Object3D(), 0xf2c11c);
selBox.visible = false; selBox.material.depthTest = false; selBox.material.linewidth = 2;
scene.add(selBox);

function pick(ev) {
  const r = renderer.domElement.getBoundingClientRect();
  const m = new THREE.Vector2(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1);
  ray.setFromCamera(m, activeCam);
  const hits = ray.intersectObjects([modelRoot], true).filter((h) => {
    let o = h.object;
    while (o) { if (o.visible === false) return false; o = o.parent; }
    return h.object.isMesh;
  });
  return hits[0] || null;
}

renderer.domElement.addEventListener('pointerdown', (ev) => {
  if (walk.on || ev.button !== 0) return;
  const hit = pick(ev);
  if (!hit) return;
  // Duzenleme modunda: tiklanan mobilyayi sec ve suruklemeye basla
  if (editMode && !measure.on) {
    let o = hit.object, item = null, host = null;
    while (o) { if (o.userData?.item) { item = o.userData.item; host = o; break; } o = o.parent; }
    const movable = item && [...furniture, ...equipment, ...clutter].some((f) => f.id === item.id);
    if (movable) {
      selected = { item, host: dragGroupOf(item.id) || host, name: item.name };
      dragger.select(item);
      selBox.setFromObject(selected.host);
      selBox.visible = true;
      if (dragger.begin(ev)) { controls.enabled = false; updateReadout(); return; }
    }
  }
  if (measure.on) {
    if (measure.pts.length >= 2) measure.pts = [];
    measure.pts.push(snapPoint(hit));
    drawMeasure();
    updateReadout();
  } else {
    // en yakin "item" tasiyan ustu bul
    let o = hit.object, item = null, host = null;
    while (o) { if (o.userData?.item) { item = o.userData.item; host = o; break; } o = o.parent; }
    selected = item ? { item, host, name: host.name } : { item: null, host: hit.object, name: hit.object.name || '(isimsiz yuzey)' };
    selBox.setFromObject(selected.host);
    selBox.visible = true;
    updateReadout();
  }
});

/**
 * Tiklanan noktayi carptigi parcanin en yakin KOSESINE cekiyoruz. Serbest elle
 * bir yuzeyin tam kenarini tutturmak imkansiza yakin; 10 cm icindeki kose
 * yakalanirsa olcu "141.7" degil "140" cikiyor.
 */
function snapPoint(hit) {
  const p = hit.point.clone();
  const o = hit.object;
  if (!o.geometry) return p;
  o.geometry.computeBoundingBox();
  const bb = o.geometry.boundingBox;
  if (!bb) return p;
  let best = null, bd = cm(10);
  for (let i = 0; i < 8; i++) {
    const c = new THREE.Vector3(
      i & 1 ? bb.max.x : bb.min.x,
      i & 2 ? bb.max.y : bb.min.y,
      i & 4 ? bb.max.z : bb.min.z,
    ).applyMatrix4(o.matrixWorld);
    const dd = c.distanceTo(p);
    if (dd < bd) { bd = dd; best = c; }
  }
  return best || p;
}

const MEAS_COL = 0xffd23f;
function mDot(p, n) {
  const g = new THREE.Group();
  const s = new THREE.Mesh(new THREE.SphereGeometry(cm(2.4), 16, 12),
    new THREE.MeshBasicMaterial({ color: MEAS_COL, depthTest: false, toneMapped: false }));
  s.renderOrder = 999; g.add(s);
  // koyu halka: acik zeminde de gorunsun
  const r = new THREE.Mesh(new THREE.SphereGeometry(cm(3.4), 16, 12),
    new THREE.MeshBasicMaterial({ color: 0x1d1b22, depthTest: false, toneMapped: false,
      transparent: true, opacity: 0.55, side: THREE.BackSide }));
  r.renderOrder = 998; g.add(r);
  g.position.copy(p);
  g.userData.labelText = String(n);
  return g;
}
/** Iki nokta arasina KALIN boru - THREE.Line her zaman 1 piksel kalir, gorunmuyor */
function mTube(a, b, col = MEAS_COL, rad = 0.7) {
  const dir = new THREE.Vector3().subVectors(b, a);
  const len = dir.length();
  if (len < 1e-6) return null;
  const geo = new THREE.CylinderGeometry(cm(rad), cm(rad), len, 8, 1, true);
  const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: col, depthTest: false, toneMapped: false }));
  m.position.copy(a).add(b).multiplyScalar(0.5);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
  m.renderOrder = 999;
  return m;
}

function drawMeasure() {
  measure.group.clear();
  measure.group.userData.labels = [];
  if (!measure.on) { syncMeasureLabels(); return; }
  measure.pts.forEach((p, i) => {
    const dot = mDot(p, i + 1);
    measure.group.add(dot);
    measure.group.userData.labels.push({ p: p.clone(), text: String(i + 1), kind: 'no' });
  });
  // ikinci nokta konmadiysa imlece kadar sonuk bir kilavuz cizgi
  if (measure.pts.length === 1 && measure.hover) {
    const t = mTube(measure.pts[0], measure.hover, 0x8f8a7a, 0.35);
    if (t) { t.material.transparent = true; t.material.opacity = 0.75; measure.group.add(t); }
    const d = measure.pts[0].distanceTo(measure.hover) * 100;
    measure.group.userData.labels.push({
      p: measure.pts[0].clone().add(measure.hover).multiplyScalar(0.5),
      text: d.toFixed(1) + ' cm', kind: 'pre',
    });
  }
  if (measure.pts.length === 2) {
    const [a, b] = measure.pts;
    const t = mTube(a, b);
    if (t) measure.group.add(t);
    const d = a.distanceTo(b) * 100;
    measure.group.userData.labels.push({
      p: a.clone().add(b).multiplyScalar(0.5), text: d.toFixed(1) + ' cm', kind: 'dist',
    });
  }
  syncMeasureLabels();
}

/** 3B noktalari ekran koordinatina cevirip HTML etiketleri yerlestirir */
function syncMeasureLabels() {
  const list = (measure.on && measure.group.userData.labels) || [];
  while (mLabels.children.length > list.length) mLabels.lastChild.remove();
  while (mLabels.children.length < list.length) {
    const e = document.createElement('div');
    mLabels.appendChild(e);
  }
  const w = renderer.domElement.clientWidth, h = renderer.domElement.clientHeight;
  list.forEach((l, i) => {
    const el2 = mLabels.children[i];
    el2.className = 'ml ' + l.kind;
    el2.textContent = l.text;
    const v = l.p.clone().project(activeCam);
    const vis = v.z < 1;
    el2.style.display = vis ? 'block' : 'none';
    el2.style.left = ((v.x * 0.5 + 0.5) * w).toFixed(1) + 'px';
    el2.style.top = ((-v.y * 0.5 + 0.5) * h).toFixed(1) + 'px';
  });
}

/* =============================================== SEMA DEGISTIRME */
/**
 * Semayi uygular ve modeli bastan kurar. Malzeme/doku onbellegi temizlenir,
 * boylece yeni palet gercekten gorunur. Kamera, katman durumu ve kapi acisi
 * korunur - iki semayi ayni bakis acisindan karsilastirabilmek icin.
 */
function setDesign(pId, lId) {
  if (pId === curPalette && lId === curLayout) return;
  curPalette = pId; curLayout = lId;
  applyScheme(resolveDesign(pId, lId));
  rebuildModel();
}

/**
 * Modeli bastan kurar. Palet/yerlesim degisiminde ve dolap kapaklarina
 * duvar kagidi acilip kapanirken kullanilir. Kamera, katman durumu ve kapi
 * acisi korunur - iki hali ayni bakis acisindan karsilastirabilmek icin.
 */
function rebuildModel() {
  // Once eski agac sahneden cikarilip serbest birakilir, SONRA malzeme/doku
  // onbellegi temizlenir - boylece hicbir malzeme kullanimdayken atilmaz.
  scene.remove(modelRoot, dimPlan, dimElev);
  disposeTree(modelRoot); disposeTree(dimPlan); disposeTree(dimElev);
  clearMaterialCache();

  modelRoot = buildRoom();
  dimPlan = buildPlanDimensions();
  dimElev = buildElevationDimensions();
  dimPlan.visible = layerState.dimPlan !== false;
  dimElev.visible = layerState.dimElev !== false;
  scene.add(modelRoot, dimPlan, dimElev);

  layerMap = new Map();
  itemMap = new Map();
  indexLayers(modelRoot);
  indexLayers(lights.group);
  layerMap.set('dimPlan', [dimPlan]);
  layerMap.set('dimElev', [dimElev]);

  // Konsoldan/testten erisim: modelRoot her kurulusta YENI bir nesne, global
  // guncellenmezse eski agaca bakilir (daha once yanlis sonuca yol acti).
  window.modelRoot = modelRoot;

  SWING = doorSwingLimit();
  MET = metrics();
  selected = null; selBox.visible = false;
  dragger.clearMoved(); dragger.select(null);
  measure.pts = []; drawMeasure();
  applyLayers();
  setDoorAngle(Math.min(doorAngle, SWING.angle));
  buildUI();
  updateHead();
  updateReadout();
}

/* ========================================================== ARAYUZ */
const el = {
  topbar: document.getElementById('topbar'),
  scroll: document.getElementById('scroll'),
  readout: document.getElementById('readout'),
  hint: document.getElementById('hint'),
  panel: document.getElementById('panel'),
  toggle: document.getElementById('toggle'),
  sub: document.getElementById('subhead'),
};
el.close = document.getElementById('close');
const setPanel = (open) => {
  el.panel.classList.toggle('hidden', !open);
  document.body.classList.toggle('panel-open', open);
  el.toggle.textContent = MOBILE ? 'Seçenekler' : '☰';
};
el.toggle.onclick = () => setPanel(true);
el.close.onclick = () => setPanel(false);
// Telefonda oda once gorunsun; panel kullanici isteyince acilsin.
setPanel(!MOBILE);

let M = roomMetrics();
let SWING = doorSwingLimit();
let MET = metrics();
function updateHead() {
  const P = getPalette(curPalette), L = getLayout(curLayout);
  el.sub.innerHTML = `${room.width} × ${room.depth} cm  ·  ${M.alan.toFixed(2)} m²  ·  `
    + `<b style="color:var(--acc)">${P.name}</b> + <b style="color:var(--acc)">${L.name}</b>`;
}
updateHead();

function updateReadout() {
  if (measure.on) {
    const [a, b] = measure.pts;
    if (a && b) {
      const d = a.distanceTo(b) * 100;
      // sahne metre; X/Z plan ekseni, Y kot
      const dx = Math.abs(a.x - b.x) * 100, dz = Math.abs(a.z - b.z) * 100, dy = Math.abs(a.y - b.y) * 100;
      el.readout.style.borderColor = '';
      el.readout.innerHTML = `<div class="big">${d.toFixed(1)} cm</div>
        <div class="sm">yatay ${Math.hypot(dx, dz).toFixed(1)} · yükseklik farkı ${dy.toFixed(1)} cm</div>
        <div class="sm w" style="margin-top:5px">Yeni ölçü için tekrar tıklayın ·
          <kbd>Esc</kbd> temizler</div>`;
    } else if (a) {
      el.readout.innerHTML = '<div class="nm">1. nokta kondu</div>'
        + '<div class="sm w">Şimdi ikinci noktaya tıklayın.</div>';
    } else {
      el.readout.innerHTML = '<div class="nm">Ölçüm açık</div>'
        + '<div class="sm w">Başlangıç noktasına tıklayın. İmleç bir köşeye '
        + 'yaklaşınca oraya yapışır.</div>';
    }
    el.readout.style.display = 'block';
    return;
  }
  if (editMode && selected?.item) {
    const it = selected.item;
    const bad = !editStatus.ok;
    el.readout.style.borderColor = bad ? '#d4553a' : '#6cc248';
    el.readout.innerHTML = `<div class="nm"><span class="poz">${it.id}</span>${it.name}</div>
      <div class="big" style="font-size:15px;color:${bad ? '#e0916a' : '#8fd46a'}">
        (${Math.round(it.pos[0])}, ${Math.round(it.pos[1])}) · ${Math.round(it.rot || 0)}°</div>
      <div class="sm">${it.w}×${it.d}×${it.h} cm</div>
      <div class="sm ${bad ? 'w' : ''}" style="margin-top:5px;color:${bad ? '#e0916a' : '#8a8398'}">
        ${bad ? '⚠ ' + editStatus.msgs.join(' · ') : 'yerleşim geçerli'}</div>`;
    el.readout.style.display = 'block';
    return;
  }
  if (selected) {
    el.readout.style.borderColor = '';
    const it = selected.item;
    el.readout.innerHTML = it
      ? `<div class="nm"><span class="poz">${it.id}</span>${it.name}</div>
         <div class="sm">${it.w}×${it.d}×${it.h} cm${it.pos ? `   ·   (${it.pos[0]}, ${it.pos[1]})   ·   ${it.rot || 0}°` : ''}</div>
         ${it.note ? `<div class="sm w" style="margin-top:6px">${it.note}</div>` : ''}`
      : `<div class="sm">${selected.name}</div>`;
    el.readout.style.display = 'block';
    return;
  }
  el.readout.style.display = 'none';
}

function setMeasure(on) {
  if (on && editMode) setEditMode(false);   // once tasima kipini kapat
  measure.on = on;
  measure.pts = []; measure.hover = null;
  if (!on) renderer.domElement.style.cursor = '';
  drawMeasure(); updateReadout(); buildUI();
}

function buildUI() {
  /* ---- ust bar ---- */
  el.topbar.innerHTML = '';
  for (const p of viewPresets) {
    const b = document.createElement('button');
    b.textContent = MOBILE ? (p.short || p.label) : p.label;
    b.onclick = () => { usePreset(p); };
    el.topbar.appendChild(b);
  }
  const sp = document.createElement('div'); sp.className = 'sep'; el.topbar.appendChild(sp);
  // Odada yurume klavye (WASD) + fare kilidi istiyor; dokunmatikte ikisi de yok.
  if (!TOUCH) {
    const bw = document.createElement('button');
    bw.textContent = walk.on ? 'Yürümeyi bitir  Esc' : 'Odada yürü  G';
    bw.className = walk.on ? 'act' : '';
    bw.onclick = () => setWalk(!walk.on);
    el.topbar.appendChild(bw);
  }

  const be = document.createElement('button');
  be.textContent = MOBILE ? (editMode ? 'Taşıma açık' : 'Eşyaları taşı')
                          : (editMode ? 'Düzenleme açık  E' : 'Eşyaları taşı  E');
  be.className = editMode ? 'act' : '';
  be.onclick = () => setEditMode(!editMode);
  el.topbar.appendChild(be);

  const bm = document.createElement('button');
  bm.textContent = MOBILE ? (measure.on ? 'Ölçüm açık' : 'Ölç') : (measure.on ? 'Ölçüm açık  M' : 'Ölç  M');
  bm.className = measure.on ? 'act' : '';
  bm.onclick = () => setMeasure(!measure.on);
  if (measure.on) {
    const bc = document.createElement('button');
    bc.textContent = 'Temizle';
    bc.onclick = () => { measure.pts = []; measure.hover = null; drawMeasure(); updateReadout(); };
    el.topbar.appendChild(bc);
  }
  el.topbar.appendChild(bm);

  if (editMode) {
    el.hint.innerHTML = 'Bir mobilyaya <b>tıklayıp sürükleyin</b> · <kbd>R</kbd> 15° çevir '
      + '(<kbd>Shift+R</kbd> ters) · duvara yaklaşınca <b>yapışır</b> · '
      + 'çerçeve <b style="color:#6cc248">yeşilse</b> yerleşim geçerli, '
      + '<b style="color:#d4553a">kırmızıysa</b> sorunlu · <kbd>E</kbd> çık';
  } else if (measure.on) {
    el.hint.innerHTML = 'İki noktaya <b>tıklayın</b> · imleç köşelere <b>yapışır</b> '
      + '(imleç <b>▣</b> olur) · <kbd>Esc</kbd> temizler · <kbd>M</kbd> kapatır';
  } else el.hint.innerHTML = walk.on
    ? '<kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> yürü · <kbd>Shift</kbd> koş · fare ile (veya sol tuşa basılı sürükleyerek) bak · <kbd>Esc</kbd> çık'
    : measure.on
      ? '<b>İki noktaya tıklayın</b> — aradaki gerçek mesafe cm olarak okunur. <kbd>M</kbd> ile kapatın.'
      : 'Sol tuş <b>döndür</b> · tekerlek <b>yakınlaş</b> · sağ tuş <b>kaydır</b> · bir parçaya <b>tıklayın</b> ölçüsünü görün · <kbd>G</kbd> odada yürü · <kbd>M</kbd> ölç';

  /* ---- yan panel ---- */
  el.scroll.innerHTML = '';
  if (MOBILE) el.scroll.appendChild(secTouchHelp());
  if (editMode) el.scroll.appendChild(secEdit());
  el.scroll.appendChild(secLayouts());
  el.scroll.appendChild(secPalettes());
  el.scroll.appendChild(secFindings());
  el.scroll.appendChild(secMetrics());
  el.scroll.appendChild(secLayers());
  el.scroll.appendChild(secTools());
  el.scroll.appendChild(secSchedule());
  el.scroll.appendChild(secMural());
  el.scroll.appendChild(secFinishes());
  el.scroll.appendChild(secExport());
  el.scroll.appendChild(secNotes());
}

function sec(title, open = false) {
  const d = document.createElement('details');
  d.className = 'sec'; d.open = open;
  const s = document.createElement('summary'); s.textContent = title;
  const b = document.createElement('div'); b.className = 'body';
  d.append(s, b);
  d.body = b;
  return d;
}

/**
 * Mahal bilgileri. Her satirin yaninda olcunun KAYNAGI rozet olarak durur:
 *   K = el krokisinden okundu (yuksek guven)
 *   F = fotograftan oranlandi (orta guven - yerinde dogrulanmali)
 *   T = sektor kabulu / hesaplanan
 * Ic mimarin hangi sayiya guvenebilecegini tek bakista gormesi icin.
 */
const SRC = { k: ['k', 'ölçülü'], f: ['f', 'tahmin'], t: ['t', 'hesap'] };
const badge = (kind) => `<span class="src ${SRC[kind][0]}" title="${
  kind === 'k' ? 'Elle çizdiğiniz krokiden okundu — güvenilir'
  : kind === 'f' ? 'Fotoğraftan tahmin edildi — metreyle ölçerseniz düzeltirim'
  : 'Diğer ölçülerden hesaplandı'}">${SRC[kind][1]}</span>`;

function secMetrics() {
  const d = sec('Oda ölçüleri');
  const r = (label, val, kind, hi) =>
    `<tr class="${hi ? 'hi' : ''}"><td>${label}${kind ? badge(kind) : ''}</td><td>${val}</td></tr>`;
  d.body.innerHTML = `<table class="kv">
    ${r('Oda', `${room.width}×${room.depth}`, 'k')}
    ${r('Tavan yüksekliği', `${room.height} cm`, 'f')}
    ${r('Alan', `${M.alan.toFixed(2)} m²`, 't', true)}
    ${r('Hacim', `${M.hacim.toFixed(2)} m³`, 't')}
    ${r('Duvar uzunluğu (toplam)', `${M.cevre.toFixed(2)} m`, 't')}
    ${r('Eşyaların kapladığı yer', `${MET.doluAlan.toFixed(2)} m²`, 't')}
    ${r('Boş kalan yer', `${(M.alan - MET.doluAlan).toFixed(2)} m²`, 't', true)}
    ${r('Kapı', `${door.width}×${door.height} cm`, 'k')}
    ${r('Kapı ne kadar açılıyor', `${SWING.angle}°`, 't', true)}
    ${r('Kapı üstü cam', `${partition.transomTop - partition.sillHeight} cm`, 'f')}
    ${r('Duvar dolapları (yükseklik)', `${wallUnits.zBottom}–${wallUnits.zTop}`, 'f')}
    ${r('Yer karosu', `${floorCfg.tile[0]}×${floorCfg.tile[1]}`, 'f')}
    ${r('Tavan plakası', `${ceilCfg.tile[0]}×${ceilCfg.tile[1]}`, 't')}
  </table>
  <div class="callout"><p class="note"><b>Ölçülerin bir kısmı tahmin.</b>
  Model 5 fotoğraf ve krokinizden çıkarıldı. <span class="src f">tahmin</span>
  yazan satırları metreyle ölçüp bana söylerseniz modeli düzeltirim.</p></div>`;
  return d;
}

/* ---------------------------------------------------- duzenleme */
function secEdit() {
  const d = sec('Eşyaları taşı', true);
  const n = dragger.movedCount;
  const info = document.createElement('div');
  info.innerHTML = `<p class="note">Bir mobilyaya tıklayıp sürükleyin. <b>R</b> ile 15° çevirin.
    Masayı taşırsanız üzerindeki monitör, klavye ve diğer eşyalar birlikte gelir.</p>
    <p class="note">Her hareket sonrası <b>denetim</b> çalışır: oda sınırı, çakışma,
    kapı süpürme yayı, pencere önü ve radyatör önü. Sonuç seçim çerçevesinin
    renginde ve sağ üstteki okumada görünür.</p>
    <p class="note"><b>${n}</b> eleman taşındı.</p>`;
  d.body.appendChild(info);

  const g2 = document.createElement('div');
  g2.className = 'grid2';
  g2.innerHTML = `<button class="btn" id="ed-rot">Çevir 15°</button>
    <button class="btn" id="ed-reset">Yerleşimi geri al</button>`;
  d.body.appendChild(g2);
  g2.querySelector('#ed-rot').onclick = () => {
    if (!selected?.item) return;
    dragger.rotate(15);
    selBox.setFromObject(dragGroupOf(selected.item.id) || selected.host);
    buildUI();
  };
  g2.querySelector('#ed-reset').onclick = () => {
    dragger.clearMoved();
    const pl = curPalette, ly = curLayout;
    curLayout = null;                  // zorla yeniden kur
    setDesign(pl, ly);
    setEditMode(true);
  };

  if (n) {
    const out = document.createElement('div');
    out.innerHTML = `<p class="note" style="margin-top:10px"><b>Yeni konumlar</b> —
      <code>src/config/room.js</code> veya bir şemanın <code>furniture</code> bloğuna yapıştırın:</p>
      <textarea readonly style="width:100%;height:104px;background:var(--sink);color:var(--txt-2);
        border:1px solid var(--line);border-radius:4px;font:400 10.5px/1.5 var(--mono);
        padding:7px;resize:vertical">${dragger.snippet()}</textarea>`;
    d.body.appendChild(out);
  }
  return d;
}

/* --------------------------------------- palet ve yerlesim secicileri */
function pickerRow(list, currentId, onPick) {
  const wrap = document.createElement('div');
  wrap.className = 'schemes';
  for (const o of list) {
    const b = document.createElement('button');
    b.className = 'scheme' + (o.id === currentId ? ' on' : '');
    b.innerHTML = `<span class="code">${o.code}</span><span class="nm">${o.name}</span>
                   <span class="kind">${o.kind === 'mevcut' ? 'şu an' : 'öneri'}</span>`;
    b.onclick = () => onPick(o.id);
    wrap.appendChild(b);
  }
  return wrap;
}

function secPalettes() {
  const d = sec('Renk seçenekleri', true);
  d.body.appendChild(pickerRow(palettes, curPalette, (id) => setDesign(id, curLayout)));
  const P = getPalette(curPalette);
  const info = document.createElement('div');
  info.innerHTML = `<p class="note" style="margin-top:2px"><b>${P.summary}</b></p>
    <p class="note">${P.why}</p>
    ${P.is ? `<p class="note callout-inline"><b>Ne gerekiyor:</b> ${P.is}</p>` : ''}`;
  d.body.appendChild(info);
  return d;
}

/**
 * Telefonda alt kenardaki ipucu seridi (#hint) gizleniyor - yerini burasi
 * aliyor. Parmakla kullanim masaustundekinden farkli oldugu icin ayri yazildi.
 */
function secTouchHelp() {
  const d = sec('Nasıl kullanılır', true);
  d.body.innerHTML = `<p class="note" style="line-height:1.75">
    <b>Tek parmak</b> sürükle → odayı döndürür<br>
    <b>İki parmak</b> → yakınlaş / uzaklaş ve kaydır<br>
    <b>Dokun</b> → o eşyanın ölçüsünü gösterir<br><br>
    <b>Eşya taşımak:</b> alttaki <b>Eşyaları taşı</b> düğmesine basın, sonra
    eşyayı parmağınızla sürükleyin. Çerçeve yeşilse yerleşim uygun, kırmızıysa
    bir yere çarpıyor ve nedenini yazar.<br><br>
    <b>Ölçmek:</b> <b>Ölç</b> düğmesine basıp iki noktaya dokunun.<br><br>
    Bu paneli kapatmak için sağ üstteki <b>✕</b>, tekrar açmak için sağ alttaki
    <b>Seçenekler</b> düğmesi.</p>`;
  return d;
}

function secLayouts() {
  const d = sec('Yerleşim seçenekleri', true);
  d.body.appendChild(pickerRow(layouts, curLayout, (id) => setDesign(curPalette, id)));
  const L = getLayout(curLayout);
  const info = document.createElement('div');
  info.innerHTML = `<p class="note" style="margin-top:2px"><b>${L.summary}</b></p>
    <p class="note">${L.why}</p>
    ${L.is ? `<p class="note callout-inline"><b>Ne gerekiyor:</b> ${L.is}</p>` : ''}`;
  d.body.appendChild(info);
  return d;
}

/**
 * Modelden cikan tasarim tespitleri. Her tespit aktif semaya gore
 * "acik" veya "cozuldu" olarak isaretlenir - bir onerinin neyi duzelttigi
 * boylece iddia degil, olculebilir sonuc olur.
 */
function secFindings() {
  const d = sec('Nelere dikkat etmeli', true);
  const desk = furniture.find((f) => f.id === 'M1');
  const CLR = deskClearance() || { cm: 0, by: '-' };
  const SIGHT = doorSight() || { deg: 180, kind: 'arkada' };
  const behind = Math.round(CLR.cm);

  const items = [
    { no: '1', title: 'Kapı tam açılıyor mu',
      ok: SWING.angle >= 170,
      body: SWING.angle >= 170
        ? `Kapı <b>${SWING.angle}°</b> açılıyor, önünde hiçbir şey yok.`
        : `Kapı ancak <b>${SWING.angle}°</b> açılıyor, sonra <b>${SWING.blocker || '—'}</b> engelliyor.
           Fotoğraflarda da kapının duvara tam yaslanmadığı görülüyor.` },
    { no: '2', title: 'Kapıyı ne engelliyor',
      ok: SWING.angle >= 150,
      body: SWING.blocker === 'duvar'
        ? `Kanadı artık hiçbir eşya değil, <b>sol duvar</b> durduruyor —
           bu kapının fiziksel sınırı, daha fazlası mümkün değil.`
        : `Kanadı <b>${SWING.blocker || '—'}</b> durduruyor. O eşyayı kapının
           süpürdüğü alanın dışına alırsanız kapı ${'' + 152}° açılır.` },
    { no: '3', title: 'Oturunca kapıyı görüyor musunuz',
      ok: SIGHT.kind !== 'arkada',
      body: SIGHT.kind === 'onunde'
        ? `Kapı tam karşınızda (<b>${SIGHT.deg}°</b>) — içeri gireni doğrudan görüyorsunuz.`
        : SIGHT.kind === 'yandan'
          ? `Kapı yan tarafınızda (<b>${SIGHT.deg}°</b>) — göz ucuyla fark ediyorsunuz.`
          : `Kapı arkanızda kalıyor (<b>${SIGHT.deg}°</b>). İçeri gireni görmek için
             dönmeniz gerekiyor.` },
    { no: '4', title: 'Hareket alanı yeterli mi',
      ok: behind >= 100 && (M.alan - MET.doluAlan) >= 6.4,
      body: `Eşyalar <b>${MET.doluAlan.toFixed(1)} m²</b> kaplıyor, <b>${(M.alan - MET.doluAlan).toFixed(1)} m²</b>
             boş kalıyor. Oturduğunuz tarafta sandalyeyi çekip geçebilmek için
             <b>${behind} cm</b> var (en az 100 cm iyi olur; ilk engel:
             <b>${CLR.by === 'duvar' ? 'duvar' : CLR.by}</b>).` },
    { no: '5', title: 'Pencere ölçüleri tahmin',
      ok: false,
      body: (() => {
        const w = windows[0];
        return `Pencere <b>${w.width} cm</b> genişliğinde modellendi, altında radyatör var.
                Ama bu ölçüler fotoğraftan <b>tahmin</b>; özellikle yükseklikler şüpheli.
                Metreyle ölçüp söylerseniz düzeltirim.`;
      })() },
    { no: '6', title: 'Ekrana güneş vuruyor mu',
      ok: (() => {
        const w = windows.find((x) => x.wall === 'back'); if (!w) return true;
        const mon = equipment.find((e) => e.id === 'E1'); if (!mon) return true;
        // ekran +Y'ye bakiyorsa (rot ~0) normali pencere duvarina donuktur
        const facesWindow = Math.abs(((mon.rot || 0) % 360 + 360) % 360) < 45;
        const covered = w.curtain && (w.curtain.to - w.curtain.from) > w.width * 0.85;
        return !facesWindow || covered;
      })(),
      body: (() => {
        const w = windows.find((x) => x.wall === 'back');
        const mon = equipment.find((e) => e.id === 'E1');
        const facesWindow = Math.abs(((mon?.rot || 0) % 360 + 360) % 360) < 45;
        const cov = w?.curtain ? Math.round(((w.curtain.to - w.curtain.from) / w.width) * 100) : 0;
        if (!facesWindow) return 'Ekran pencereye dönük değil, yansıma sorunu yok.';
        return `Ekran pencereye dönük duruyor. Perde pencerenin <b>%${cov}</b>'ini kapatıyor.
                ${cov > 85
                  ? 'Perde boydan boya çekildiği için ekranda yansıma olmuyor.'
                  : 'Fotoğrafta perde tek kenara toplanmış — boydan boya çekerseniz '
                    + 'ekrandaki yansıma biter. Hiçbir masrafı yok.'}`;
      })() },
  ];
  for (const f of items) {
    const el2 = document.createElement('div');
    el2.className = 'find' + (f.ok ? ' ok' : '');
    el2.innerHTML = `<h4><span>${f.no}</span>${f.title}
      <em class="state">${f.ok ? 'iyi' : 'sorun'}</em></h4><p>${f.body}</p>`;
    d.body.appendChild(el2);
  }
  return d;
}

function secLayers() {
  const d = sec('Göster / gizle');
  const all = [...LAYERS,
    { key: 'dimPlan', label: 'Ölçüleri göster (üstten)', on: false },
    { key: 'dimElev', label: 'Ölçüleri göster (yükseklik)', on: false }];
  const wrap = document.createElement('div'); wrap.className = 'rows';
  for (const l of all) {
    const r = document.createElement('div'); r.className = 'row';
    const id = 'ly-' + l.key;
    r.innerHTML = `<input type="checkbox" id="${id}" ${layerState[l.key] !== false ? 'checked' : ''}>
      <label for="${id}">${l.label}</label>`;
    r.querySelector('input').onchange = (e) => { layerState[l.key] = e.target.checked; applyLayers(); };
    wrap.appendChild(r);
  }
  d.body.appendChild(wrap);
  const r2 = document.createElement('div'); r2.className = 'row';
  r2.innerHTML = `<input type="checkbox" id="cut" ${cutaway ? 'checked' : ''}>
    <label for="cut"><b>Öndeki duvarı gizle</b> — odanın içini görmek için</label>`;
  r2.querySelector('input').onchange = (e) => { cutaway = e.target.checked; applyLayers(); };
  d.body.appendChild(r2);
  return d;
}

function secTools() {
  const d = sec('Kapı ve ışık');
  d.body.innerHTML = `
    <div class="row"><label>Kapı ne kadar açık: <b id="dv">${Math.round(doorAngle)}°</b></label></div>
    <input type="range" id="dr" min="0" max="170" value="${Math.round(doorAngle)}">
    <p class="note" style="margin:2px 0 0">Bu yerleşimde kapı en fazla
    <b>${SWING.angle}°</b> açılabiliyor${SWING.blocker ? ` — <b>${SWING.blocker}</b> engelliyor` : ''}.</p>
    <div class="row" style="margin-top:10px"><label>Parlaklık: <b id="ev">0.90</b></label></div>
    <input type="range" id="er" min="40" max="180" value="90">
    <div class="row" style="margin-top:10px"><label>Pencereden gelen ışık: <b id="sv">1.15</b></label></div>
    <input type="range" id="sr" min="0" max="300" value="115">
    <div class="row" style="margin-top:10px"><label>Tavan lambaları: <b id="lv">11</b></label></div>
    <input type="range" id="lr" min="0" max="35" value="11">
    <div class="row" style="margin-top:12px">
      <input type="checkbox" id="ao" ${useAO ? 'checked' : ''}>
      <label for="ao"><b>Yumuşak gölgeler</b> — köşelerde daha gerçekçi görünüm</label>
    </div>
    <p class="note">Bilgisayarınız zorlanıyorsa kapatın; ölçüler değişmez.</p>`;
  d.body.querySelector('#dr').oninput = (e) => setDoorAngle(+e.target.value);
  d.body.querySelector('#er').oninput = (e) => {
    renderer.toneMappingExposure = +e.target.value / 100;
    d.body.querySelector('#ev').textContent = (+e.target.value / 100).toFixed(2);
  };
  d.body.querySelector('#sr').oninput = (e) => {
    const v = +e.target.value / 100;
    lights.sun.intensity = v;
    for (const f of lights.winFill) f.intensity = v * 2.6;
    d.body.querySelector('#sv').textContent = v.toFixed(2);
  };
  d.body.querySelector('#lr').oninput = (e) => {
    const v = +e.target.value;
    for (const l of lights.lamps) l.intensity = v;
    d.body.querySelector('#lv').textContent = v;
  };
  const aoBox = d.body.querySelector('#ao');
  if (aoBox) aoBox.onchange = (e) => { useAO = e.target.checked && !!pipeline; };
  return d;
}

function secSchedule() {
  const d = sec('Odadaki eşyalar');
  const groups = [
    ['Mobilya', furniture],
    ['Masa üstü', equipment],
    ['Dağınık eşya', clutter],
  ];
  const n = document.createElement('p');
  n.className = 'note';
  n.innerHTML = 'Satıra tıklayın — kamera o eşyaya döner. Soldaki kutucuğu '
    + 'kapatırsanız eşya <b>sadece görüntüden</b> kalkar; ölçüler ve uyarılar '
    + 'değişmez.';
  d.body.appendChild(n);

  const t = document.createElement('table');
  t.className = 'sch';
  t.innerHTML = '<thead><tr><th class="eye"></th><th>Eşya</th><th>en×boy×yükseklik</th></tr></thead>';
  const tb = document.createElement('tbody');
  for (const [gname, arr] of groups) {
    if (!arr.length) continue;
    const gh = document.createElement('tr');
    gh.className = 'grp';
    gh.innerHTML = `<td colspan="3">${gname}</td>`;
    tb.appendChild(gh);
    for (const r of arr) {
      const tr = document.createElement('tr');
      const off = userHidden.has(r.id);
      if (off) tr.classList.add('off');
      tr.innerHTML = `<td class="eye"><input type="checkbox" ${off ? '' : 'checked'} title="göster / gizle"></td>
                      <td><span class="poz">${r.id}</span>${r.name}</td>
                      <td class="n">${r.w}×${r.d}×${r.h}</td>`;
      const cb = tr.querySelector('input');
      cb.onclick = (e) => e.stopPropagation();
      cb.onchange = (e) => { setItemHidden(r.id, !e.target.checked); tr.classList.toggle('off', !e.target.checked); };
      tr.onclick = () => focusItem(r);
      tb.appendChild(tr);
    }
  }
  t.appendChild(tb);
  d.body.appendChild(t);

  const all = document.createElement('button');
  all.className = 'btn';
  all.style.marginTop = '8px';
  all.textContent = 'Hepsini göster';
  all.onclick = () => { userHidden.clear(); applyLayers(); buildUI(); };
  d.body.appendChild(all);

  const wu = document.createElement('p');
  wu.className = 'note';
  wu.innerHTML = `<b>${wallUnits.id}</b> ${wallUnits.name} — sağ duvar boyunca,
    kot ${wallUnits.zBottom}–${wallUnits.zTop} cm, derinlik ${wallUnits.depth} cm.<br>
    <b>Duvar elemanları:</b> ${wallItems.map((w) => w.id).join(', ')}`;
  d.body.appendChild(wu);
  return d;
}

/**
 * Bir esyaya odaklan.
 *
 * place() MERKEZ tabanli calisir, yani it.pos zaten esyanin ortasidir - eskiden
 * buraya ayrica yari en/boy ekleniyordu ve kamera yanlis noktaya bakiyordu.
 * Kamera, esyadan ODANIN MERKEZINE dogru cekilir; boylece duvara dayali bir
 * esyaya her zaman odanin icinden bakilir. Mesafe esyanin buyuklugune gore
 * hesaplanir (kucuk esyada burnunu dayamaz, buyuk esyada disarida kalmaz);
 * kamera oda disina cikabilir - onundeki duvar otomatik gizlenir.
 */
function focusItem(it) {
  const cxp = it.pos[0], cyp = it.pos[1];
  const cz = (it.h || 80) * 0.5;
  const FOV = 45;
  const r = Math.max(it.w || 60, it.d || 60, it.h || 60) / 2;
  const dist = Math.max(140, Math.min(340, (r / Math.tan((FOV * Math.PI) / 360)) * 1.35));
  let dx = room.width / 2 - cxp, dy = room.depth / 2 - cyp;
  const len = Math.hypot(dx, dy);
  if (len < 30) { dx = 0; dy = -1; } else { dx /= len; dy /= len; }
  // ~32 derece yukaridan bakilir: onunde duran alcak esyalarin (masa, sandalye)
  // uzerinden gorunur. Duz karsidan bakinca kucuk odada surekli baska bir
  // esyanin arkasinda kaliyordu.
  const cam = [cxp + dx * dist, cyp + dy * dist, Math.max(90, Math.min(272, cz + dist * 0.62))];
  setOrtho(false);
  flyTo(cam, [cxp, cyp, cz], FOV);
  if (userHidden.has(it.id)) { userHidden.delete(it.id); applyLayers(); buildUI(); }
  const host = dragGroupOf(it.id);
  selected = { item: it, host: host || null, name: it.name };
  if (host) { selBox.setFromObject(host); selBox.visible = true; } else selBox.visible = false;
  updateReadout();
}

/**
 * Sag duvardaki dolap kapaklarina tropik duvar kagidi. Acilip kapanabilir;
 * secili palet ve yerlesimden bagimsiz calisir, yani her kombinasyonla
 * denenebilir.
 */
function secMural() {
  const d = sec('Dolaba duvar kâğıdı', wallUnits.mural);
  const r = document.createElement('div');
  r.className = 'row';
  r.innerHTML = `<input type="checkbox" id="mural" ${wallUnits.mural ? 'checked' : ''}>
    <label for="mural"><b>Kapaklara duvar kâğıdı kapla</b></label>`;
  d.body.appendChild(r);
  r.querySelector('input').onchange = (e) => {
    wallUnits.mural = e.target.checked;
    rebuildModel();
  };
  const n = document.createElement('p');
  n.className = 'note';
  n.innerHTML = `Masanın sağındaki sarı-beyaz dolap kapaklarını tropik desenle
    kaplar. Desen <b>tek parça</b> akar: 3 panel boyunca kesintisiz devam eder,
    her kapak kendi bölümünü gösterir — gerçekte de duvar kâğıdı böyle kesilir.
    Kapak araları ve parmak kanalları görünmeye devam eder.<br>
    Kapatınca kapaklar sarı-beyaz hâline döner; ölçüler ve yerleşim değişmez.`;
  d.body.appendChild(n);
  return d;
}

function secFinishes() {
  const d = sec('Renkler');
  for (const [k, v] of Object.entries(palette)) {
    const s = document.createElement('div'); s.className = 'sw';
    s.innerHTML = `<i style="background:${v.hex}"></i><b>${v.label}</b><em>${v.hex}</em>`;
    s.title = `${k} · ${v.ral}`;
    d.body.appendChild(s);
  }
  const n = document.createElement('p');
  n.className = 'note';
  n.textContent = 'RAL karşılıkları için imleci renk üzerinde bekletin. Renkler fotoğraflardan okunmuştur, yerinde numune ile teyit edilmelidir.';
  d.body.appendChild(n);
  return d;
}

function secExport() {
  const d = sec('İndir');
  const wrap = document.createElement('div');
  wrap.innerHTML = `<div class="grid2">
      <button class="btn pri" id="ex-png">Resmini kaydet</button>
      <button class="btn" id="ex-png4">Büyük resim</button>
      <button class="btn" id="ex-glb">3B model (GLB)</button>
      <button class="btn" id="ex-obj">3B model (OBJ)</button>
    </div>
    <p class="note"><b>Resmini kaydet</b> — odanın görüntüsünü PNG olarak indirir.<br>
    <b>3B model</b> — bir mimara veya mobilyacıya vermek isterseniz; SketchUp,
    Blender gibi programlarla açılır.<br>
    Yazdırılabilir plan ve ölçü föyü proje klasöründe: <code>docs/drawings/</code></p>`;
  d.body.appendChild(wrap);

  const kilit = (btn, sebep) => {
    btn.disabled = true; btn.style.opacity = '.45';
    btn.style.cursor = 'not-allowed'; btn.title = sebep;
  };
  // Gomulu (iframe) gosterimde tarayici <a download> baglantisini calistirmaz.
  // Yayinlanan sayfada bunun yerine `downloads` yetenegi devreye girer; o da
  // yalnizca resim/metin turlerini kabul ettigi icin GLB ve OBJ kapali kalir.
  const gomulu = window.self !== window.top;
  if (gomulu) for (const b of wrap.querySelectorAll('.btn')) kilit(b, 'Kontrol ediliyor…');
  downloadsNS().then((ns) => {
    const w = document.createElement('div');
    w.className = 'callout';
    if (ns) {
      for (const id of ['#ex-png', '#ex-png4']) {
        const b = wrap.querySelector(id);
        b.disabled = false; b.style.opacity = ''; b.style.cursor = ''; b.title = '';
      }
      for (const id of ['#ex-glb', '#ex-obj'])
        kilit(wrap.querySelector(id), 'Tarayıcı bu dosya türünü buradan kaydetmiyor');
      w.innerHTML = '<p class="note"><b>Resim indirme çalışıyor</b> — tarayıcı bir onay '
        + 'kutusu gösterir. <b>3B model (GLB / OBJ) burada inmiyor</b>; onun için projeyi '
        + 'bilgisayarınızda <code>npm install &amp;&amp; npm run dev</code> ile açın.</p>';
    } else if (gomulu) {
      for (const b of wrap.querySelectorAll('.btn')) kilit(b, 'Gömülü görünümde indirme kapalı');
      w.innerHTML = '<p class="note"><b>Gömülü görünümde indirme çalışmaz.</b> '
        + 'GLB / OBJ / PNG almak için projeyi klonlayıp <code>npm install &amp;&amp; npm run dev</code> '
        + 'ile kendi tarayıcınızda açın.</p>';
    } else return;
    d.body.insertBefore(w, wrap);
  });

  // Yetenek yolunda kullanici onayi reddedebilir; her dugme sonucu yazar.
  const bas = (btn, etiket, isi) => {
    btn.onclick = async () => {
      const eski = btn.textContent;
      btn.textContent = 'Hazırlanıyor…';
      try { await isi(); btn.textContent = 'İndi ✓'; }
      catch (err) {
        const kod = err && err.code;
        btn.textContent = kod === 'declined' ? 'Vazgeçildi'
          : kod === 'rejected_extension' ? 'Bu tür inmiyor'
          : kod === 'too_large' ? 'Dosya çok büyük' : 'Olmadı';
        if (!kod) console.error(err);
      }
      setTimeout(() => { btn.textContent = etiket; }, 2600);
    };
  };
  bas(wrap.querySelector('#ex-glb'), '3B model (GLB)', () => exportGLB(modelRoot, 'oda-model.glb'));
  bas(wrap.querySelector('#ex-obj'), '3B model (OBJ)', () => exportOBJ(modelRoot, 'oda-model.obj'));
  bas(wrap.querySelector('#ex-png'), 'Resmini kaydet',
    () => exportPNG(renderer, scene, activeCam, 'oda-render.png', 2));
  bas(wrap.querySelector('#ex-png4'), 'Büyük resim',
    () => exportPNG(renderer, scene, activeCam, 'oda-render-4x.png', 4));
  return d;
}

function secNotes() {
  const d = sec('Bu model nereden çıktı');
  d.body.innerHTML = `<p class="note">
    Model, gönderdiğiniz <b>5 fotoğraf</b> ve <b>el krokinizden</b> kuruldu.
    Ölçülerin yanındaki etiket kaynağını gösterir:
    <span class="src k">ölçülü</span> krokiden okundu ·
    <span class="src f">tahmin</span> fotoğraftan çıkarıldı ·
    <span class="src t">hesap</span> diğerlerinden hesaplandı.</p>
  <p class="note"><b>Krokiden gelenler:</b> oda 370×270 · kapı 120 cm · masa 160×75 ·
    dolap 80 cm.</p>
  <p class="note"><b>Tahmin olanlar:</b> tavan yüksekliği, pencere ölçüleri, dolapların
    yükseklikleri ve eşyaların tam yerleri. Metreyle ölçüp söylerseniz düzeltirim —
    proje klasöründeki <code>docs/drawings/olcu-foyu.svg</code> yazdırıp yanınıza
    alabileceğiniz bir liste.</p>`;
  return d;
}

/* ============================================================ DONGU */
function onResize() {
  const w = innerWidth, h = innerHeight;
  renderer.setSize(w, h);
  camera.aspect = w / h; camera.updateProjectionMatrix();
  fitOrtho();
  pipeline?.setSize(w, h);
}
addEventListener('resize', onResize);

let last = performance.now();
function loop() {
  const now = performance.now();
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (tween) tween();
  if (walk.on) stepWalk(dt);
  else if (activeCam === camera) controls.update();
  applyCutaway();
  if (selected?.host && selBox.visible) selBox.update();
  if (measure.on) syncMeasureLabels();
  if (useAO && pipeline) {
    pipeline.setCamera(activeCam);
    pipeline.composer.render();
  } else {
    renderer.render(scene, activeCam);
  }
  requestAnimationFrame(loop);
}

applyLayers();
buildUI();
usePreset(viewPresets[0]);
loop();

setTimeout(() => {
  const l = document.getElementById('loading');
  l.style.opacity = '0';
  setTimeout(() => l.remove(), 420);
}, 260);

// Gelistirme kolayligi: konsoldan erisim
Object.assign(window, { THREE, scene, camera, modelRoot, layerState, applyLayers, room, pipeline: () => pipeline, GTAOOut: null });
