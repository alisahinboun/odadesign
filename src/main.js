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
import { exportGLB, exportOBJ, exportPNG } from './export/gltf.js';
import { createPipeline } from './viewer/render.js';
import { createDragController } from './viewer/drag.js';
import { cm } from './lib/geom.js';
import { doorSwingLimit, metrics } from './lib/analysis.js';
import { palettes, layouts, resolveDesign, defaultPalette, defaultLayout, getPalette, getLayout } from './config/design.js';
import { applyScheme } from './config/room.js';
import { clearMaterialCache } from './lib/materials.js';

/* ===================================================== SAHNE KURULUMU */
const app = document.getElementById('app');
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
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
let useAO = true;
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
function indexLayers(node) {
  node.traverse((o) => {
    const l = o.userData?.layer;
    if (l) {
      if (!layerMap.has(l)) layerMap.set(l, []);
      layerMap.get(l).push(o);
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
addEventListener('keydown', (e) => {
  if (e.code === 'KeyW' || e.code === 'KeyA' || e.code === 'KeyS' || e.code === 'KeyD' ||
      e.code === 'ArrowUp' || e.code === 'ArrowDown' || e.code === 'ArrowLeft' || e.code === 'ArrowRight' ||
      e.code === 'ShiftLeft' || e.code === 'Space') walk.keys.add(e.code);
  if (e.code === 'Escape' && walk.on) setWalk(false);
  if (e.code === 'KeyG' && !e.metaKey && !e.ctrlKey) setWalk(!walk.on);
  if (e.code === 'KeyM') { measure.on = !measure.on; measure.pts = []; updateReadout(); buildUI(); }
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
renderer.domElement.addEventListener('pointermove', (e) => {
  if (editMode && dragger.state.dragging) { dragger.move(e); }
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
const measure = { on: false, pts: [], group: new THREE.Group() };
scene.add(measure.group);
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
    measure.pts.push(hit.point.clone());
    if (measure.pts.length > 2) measure.pts = [hit.point.clone()];
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

function drawMeasure() {
  measure.group.clear();
  const mat = new THREE.LineBasicMaterial({ color: 0xf2c11c, depthTest: false });
  for (const p of measure.pts) {
    const s = new THREE.Mesh(new THREE.SphereGeometry(cm(1.6), 12, 8),
      new THREE.MeshBasicMaterial({ color: 0xf2c11c, depthTest: false }));
    s.position.copy(p); s.renderOrder = 999;
    measure.group.add(s);
  }
  if (measure.pts.length === 2) {
    const l = new THREE.Line(new THREE.BufferGeometry().setFromPoints(measure.pts), mat);
    l.renderOrder = 999;
    measure.group.add(l);
  }
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
  indexLayers(modelRoot);
  indexLayers(lights.group);
  layerMap.set('dimPlan', [dimPlan]);
  layerMap.set('dimElev', [dimElev]);

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
el.toggle.onclick = () => el.panel.classList.remove('hidden');

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
    if (measure.pts.length === 2) {
      const d = measure.pts[0].distanceTo(measure.pts[1]) * 100;
      const dx = Math.abs(measure.pts[0].x - measure.pts[1].x) * 100;
      const dy = Math.abs(measure.pts[0].y - measure.pts[1].y) * 100;
      const dz = Math.abs(measure.pts[0].z - measure.pts[1].z) * 100;
      el.readout.innerHTML = `<div class="big">${d.toFixed(1)} cm</div>
        <div class="sm">ΔX ${dx.toFixed(1)} · ΔY(kot) ${dy.toFixed(1)} · ΔZ ${dz.toFixed(1)} cm</div>`;
    } else {
      el.readout.innerHTML = '<div class="sm w">Ölçmek için iki noktaya tıklayın.</div>';
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

function buildUI() {
  /* ---- ust bar ---- */
  el.topbar.innerHTML = '';
  for (const p of viewPresets) {
    const b = document.createElement('button');
    b.textContent = p.label;
    b.onclick = () => { usePreset(p); };
    el.topbar.appendChild(b);
  }
  const sp = document.createElement('div'); sp.className = 'sep'; el.topbar.appendChild(sp);
  const bw = document.createElement('button');
  bw.textContent = walk.on ? 'Yürümeyi bitir  Esc' : 'Odada yürü  G';
  bw.className = walk.on ? 'act' : '';
  bw.onclick = () => setWalk(!walk.on);
  el.topbar.appendChild(bw);

  const be = document.createElement('button');
  be.textContent = editMode ? 'Düzenleme açık  E' : 'Eşyaları taşı  E';
  be.className = editMode ? 'act' : '';
  be.onclick = () => setEditMode(!editMode);
  el.topbar.appendChild(be);

  const bm = document.createElement('button');
  bm.textContent = measure.on ? 'Ölçüm açık  M' : 'Ölç  M';
  bm.className = measure.on ? 'act' : '';
  bm.onclick = () => { measure.on = !measure.on; measure.pts = []; drawMeasure(); updateReadout(); buildUI(); };
  el.topbar.appendChild(bm);

  if (editMode) {
    el.hint.innerHTML = 'Bir mobilyaya <b>tıklayıp sürükleyin</b> · <kbd>R</kbd> 15° çevir '
      + '(<kbd>Shift+R</kbd> ters) · duvara yaklaşınca <b>yapışır</b> · '
      + 'çerçeve <b style="color:#6cc248">yeşilse</b> yerleşim geçerli, '
      + '<b style="color:#d4553a">kırmızıysa</b> sorunlu · <kbd>E</kbd> çık';
  } else el.hint.innerHTML = walk.on
    ? '<kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> yürü · <kbd>Shift</kbd> koş · fare ile (veya sol tuşa basılı sürükleyerek) bak · <kbd>Esc</kbd> çık'
    : measure.on
      ? '<b>İki noktaya tıklayın</b> — aradaki gerçek mesafe cm olarak okunur. <kbd>M</kbd> ile kapatın.'
      : 'Sol tuş <b>döndür</b> · tekerlek <b>yakınlaş</b> · sağ tuş <b>kaydır</b> · bir parçaya <b>tıklayın</b> ölçüsünü görün · <kbd>G</kbd> odada yürü · <kbd>M</kbd> ölç';

  /* ---- yan panel ---- */
  el.scroll.innerHTML = '';
  if (editMode) el.scroll.appendChild(secEdit());
  el.scroll.appendChild(secLayouts());
  el.scroll.appendChild(secPalettes());
  el.scroll.appendChild(secFindings());
  el.scroll.appendChild(secMetrics());
  el.scroll.appendChild(secLayers());
  el.scroll.appendChild(secTools());
  el.scroll.appendChild(secSchedule());
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
  const behind = Math.round(room.depth - (desk.pos[1] + desk.d / 2));
  const deskLeft = desk.pos[0] - desk.w / 2;
  const deskFront = desk.pos[1] - desk.d / 2;
  const hingeGap = Math.round(Math.hypot(deskLeft - 99, deskFront) - (door.width - 2 * door.frameFace));
  const facesDoor = (desk.rot || 0) === 0 && desk.pos[1] > room.depth * 0.4;

  const items = [
    { no: '1', title: 'Kapı tam açılıyor mu',
      ok: SWING.angle >= 170,
      body: SWING.angle >= 170
        ? `Kapı <b>${SWING.angle}°</b> açılıyor, önünde hiçbir şey yok.`
        : `Kapı ancak <b>${SWING.angle}°</b> açılıyor, sonra <b>${SWING.blocker || '—'}</b> engelliyor.
           Fotoğraflarda da kapının duvara tam yaslanmadığı görülüyor.` },
    { no: '2', title: 'Masa kapıya ne kadar yakın',
      ok: hingeGap >= 20,
      body: `Masanın sol köşesi ile kapının açılma yayı arasında <b>${hingeGap} cm</b> var.
             ${hingeGap >= 20 ? 'Rahat.' : 'Masayı birkaç cm sola kaydırırsanız kapı çarpar.'}` },
    { no: '3', title: 'Oturunca kapıyı görüyor musunuz',
      ok: facesDoor,
      body: facesDoor
        ? 'Masanın arkasında, kapıya dönük oturuyorsunuz — içeri gireni görüyorsunuz.'
        : 'Kapıya sırtınız dönük oturuyorsunuz. İçeri gireni görmüyorsunuz.' },
    { no: '4', title: 'Hareket alanı yeterli mi',
      ok: behind >= 100 && (M.alan - MET.doluAlan) >= 6.4,
      body: `Eşyalar <b>${MET.doluAlan.toFixed(1)} m²</b> kaplıyor, <b>${(M.alan - MET.doluAlan).toFixed(1)} m²</b>
             boş kalıyor. Masanın arkasında sandalyeyi çekip geçebilmek için
             <b>${behind} cm</b> var (en az 100 cm iyi olur).` },
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
  const rows = [
    ...furniture.map((f) => ({ ...f, grp: 'Mobilya' })),
    ...equipment.map((f) => ({ ...f, tag: 'Ekipman', grp: 'Ekipman' })),
    ...clutter.map((f) => ({ ...f, tag: 'Eşya', grp: 'Eşya' })),
  ];
  const t = document.createElement('table');
  t.className = 'sch';
  t.innerHTML = '<thead><tr><th>Eşya</th><th>en×boy×yükseklik</th></tr></thead>';
  const tb = document.createElement('tbody');
  for (const r of rows) {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td><span class="poz">${r.id}</span>${r.name}</td>
                    <td class="n">${r.w}×${r.d}×${r.h}</td>`;
    tr.onclick = () => focusItem(r);
    tb.appendChild(tr);
  }
  t.appendChild(tb);
  d.body.appendChild(t);

  const wu = document.createElement('p');
  wu.className = 'note';
  wu.innerHTML = `<b>${wallUnits.id}</b> ${wallUnits.name} — sağ duvar boyunca,
    kot ${wallUnits.zBottom}–${wallUnits.zTop} cm, derinlik ${wallUnits.depth} cm.<br>
    <b>Duvar elemanları:</b> ${wallItems.map((w) => w.id).join(', ')}`;
  d.body.appendChild(wu);
  return d;
}

function focusItem(it) {
  const rad = -(it.rot || 0) * Math.PI / 180;
  const cxp = it.pos[0] + (it.w / 2) * Math.cos(rad) - (it.d / 2) * Math.sin(rad);
  const cyp = it.pos[1] + (it.w / 2) * Math.sin(rad) + (it.d / 2) * Math.cos(rad);
  const dist = Math.max(it.w, it.d, it.h) * 2.3 + 90;
  const cx = Math.max(30, Math.min(room.width - 30, cxp + dist * 0.5));
  const cy = Math.max(30, Math.min(room.depth - 30, cyp + dist * 0.55));
  setOrtho(false);
  flyTo([cx, cy, (it.h || 80) * 0.75 + 60], [cxp, cyp, (it.h || 80) * 0.45], 55);
  selected = { item: it, host: null, name: it.name };
  selBox.visible = false;
  updateReadout();
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
  if (window.self !== window.top) {
    // Gomulu (iframe) gosterimde tarayici indirmeyi engeller; olu dugme
    // birakmamak icin butonlar devre disi birakilir ve nedeni yazilir.
    for (const b of wrap.querySelectorAll('.btn')) {
      b.disabled = true;
      b.style.opacity = '.45';
      b.style.cursor = 'not-allowed';
      b.title = 'Gömülü görünümde tarayıcı indirmeye izin vermiyor';
    }
    const w = document.createElement('div');
    w.className = 'callout';
    w.innerHTML = '<p class="note"><b>Gömülü görünümde indirme çalışmaz.</b> '
      + 'GLB / OBJ / PNG almak için projeyi klonlayıp <code>npm install &amp;&amp; npm run dev</code> '
      + 'ile kendi tarayıcınızda açın.</p>';
    d.body.appendChild(w);
  }
  d.body.appendChild(wrap);
  wrap.querySelector('#ex-glb').onclick = async (e) => {
    e.target.textContent = 'Hazırlanıyor…';
    try { await exportGLB(modelRoot, 'oda-model.glb'); e.target.textContent = 'İndi ✓'; }
    catch (err) { console.error(err); e.target.textContent = 'Hata!'; }
    setTimeout(() => { e.target.textContent = '3B model (GLB)'; }, 2200);
  };
  wrap.querySelector('#ex-obj').onclick = (e) => {
    exportOBJ(modelRoot, 'oda-model.obj');
    e.target.textContent = 'İndi ✓';
    setTimeout(() => { e.target.textContent = '3B model (OBJ)'; }, 2200);
  };
  wrap.querySelector('#ex-png').onclick = () => exportPNG(renderer, scene, activeCam, 'oda-render.png', 2);
  wrap.querySelector('#ex-png4').onclick = () => exportPNG(renderer, scene, activeCam, 'oda-render-4x.png', 4);
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
