/**
 * KABUK: doseme, duvarlar, on boluntu (kapi + vasistas), asma tavan, koridor.
 * Her ana parca kendi THREE.Group'unda ve userData.layer ile etiketli;
 * gorsellestiricideki katman anahtarlari bunlari kullanir.
 */
import * as THREE from 'three';
import { room, partition, door, walls, floor as floorCfg, ceiling as ceilCfg, palette } from '../config/room.js';
import { mat } from '../lib/materials.js';
import { box, boxAt, plane, group, cm } from '../lib/geom.js';
import { buildWallWithWindows, buildContext } from './openings.js';

const W = room.width, D = room.depth, H = room.height;
const TW = room.wallThickness, PT = room.partitionThickness;

/* ------------------------------------------------------------------ DOSEME */
export function buildFloor() {
  const g = group('Doseme', { layer: 'floor', label: 'Doseme (33x33 karo)' });
  const f = box(W, D, 3, mat.floor(W, D), { x: 0, y: 0, z: -3, name: 'doseme-karo' });
  f.castShadow = false;
  g.add(f);
  return g;
}

/* ---------------------------------------------------------------- TAVAN */
export function buildCeiling() {
  const g = group('Tavan', { layer: 'ceiling', label: 'Asma tavan (60x60 plaka)' });
  const c = box(W, D, 3, mat.ceiling(W, D), { x: 0, y: 0, z: H, name: 'asma-tavan' });
  c.castShadow = false;
  g.add(c);

  // Armaturler
  for (const l of ceilCfg.luminaires) {
    const fr = box(l.w, l.d, 6, mat.alu(), { x: l.pos[0] - l.w / 2, y: l.pos[1] - l.d / 2, z: H - 6, name: l.id + '-kasa' });
    const lens = box(l.w - 6, l.d - 6, 1.6, mat.emissive(0xfff4e0, 1.6),
      { x: l.pos[0] - l.w / 2 + 3, y: l.pos[1] - l.d / 2 + 3, z: H - 6.5 });
    lens.castShadow = false;
    g.add(fr, lens);
  }
  return g;
}

/* --------------------------------------------------- SIVALI DUVARLAR */
function paintedWall(id, label, layer, { w, d, h, x, y, z, colorName, wear }) {
  const g = group(id, { layer, label, wall: true });
  g.add(box(w, d, h, mat.paint(colorName, Math.max(w, d), h, wear), { x, y, z, name: id }));
  return g;
}

export function buildLeftWall() {
  return paintedWall('Duvar-Sol', walls.left.note, 'wallLeft',
    { w: TW, d: D + TW, h: H + 3, x: -TW, y: 0, z: 0, colorName: 'lilac', wear: 0.85 });
}

/**
 * Arka duvar. Foto 05 ile roleve tamamlandi: tamami yesil boyali, buyuk
 * pencere ve altinda dilimli radyator var. Bosluk cevresinde parcali kurulur.
 */
export function buildBackWall() {
  const g = group('Duvar-Arka', { layer: 'wallBack', label: walls.back.note, wall: true });
  g.add(buildWallWithWindows('back', 'green', 0.55));
  // duvarin kose donusleri (yan duvarlarla birlesim)
  g.add(box(TW, TW, H + 3, mat.paint('green', TW, H, 0.55), { x: -TW, y: D, z: 0, name: 'kose-sol' }));
  g.add(box(TW, TW, H + 3, mat.paint('green', TW, H, 0.55), { x: W, y: D, z: 0, name: 'kose-sag' }));
  return g;
}

export function buildRightWall() {
  return paintedWall('Duvar-Sag', walls.right.note, 'wallRight',
    { w: TW, d: D + TW, h: H + 3, x: W, y: 0, z: 0, colorName: 'offwhite', wear: 0.5 });
}

/* ------------------------------------------------ ON BOLUNTU (y = 0) */
/** Panel dizilimini x baslangic/bitis degerlerine cozer */
export function partitionLayout() {
  let x = 0;
  return partition.panels.map((p) => {
    const seg = { ...p, x0: x, x1: x + p.width };
    x += p.width;
    return seg;
  });
}

export const doorSegment = () => partitionLayout().find((p) => p.kind === 'door');

export function buildPartition() {
  const g = group('Boluntu-On', { layer: 'partition', label: walls.front.note, wall: true });
  const segs = partitionLayout();
  const { sillHeight: SILL, transomTop: TT, bandHeight: BH, frameWidth: FW, baseHeight: BASE } = partition;
  const y0 = -PT;           // boluntu y araligi: -PT .. 0
  const railH = 5;          // yatay aluminyum kayit

  // --- dolu paneller
  for (const s of segs) {
    if (s.kind === 'door') continue;
    const colorName = s.color === 'green' ? 'green' : 'yellow';
    const iw = s.x1 - s.x0;
    // gri metal supurgelik
    g.add(box(iw, PT, BASE, mat.metal('steelLight', 0.55), { x: s.x0, y: y0, z: 0, name: `${s.id}-supurgelik` }));
    // boyali panel
    g.add(box(iw, PT, SILL - BASE, mat.paint(colorName, iw, SILL, 0.75),
      { x: s.x0, y: y0, z: BASE, name: `${s.id}-panel-${s.color}` }));
  }

  // --- kapi kasasi
  const dseg = segs.find((s) => s.kind === 'door');
  if (dseg) {
    const fd = Math.max(door.frameDepth, PT);
    const fy = -fd + (fd - PT) / 2 * 0; // kasa boluntu kalinligini asar
    const frameMat = mat.paint('greyLaminate', 40, 220, 0.4);
    g.add(box(door.frameFace, fd, door.height, frameMat, { x: dseg.x0, y: -fd, z: 0, name: 'K1-kasa-sol' }));
    g.add(box(door.frameFace, fd, door.height, frameMat, { x: dseg.x1 - door.frameFace, y: -fd, z: 0, name: 'K1-kasa-sag' }));
    g.add(box(dseg.width, fd, door.frameFace, frameMat, { x: dseg.x0, y: -fd, z: door.height - door.frameFace, name: 'K1-kasa-ust' }));
    // kapi ustu ile vasistas arasi dolgu
    if (SILL > door.height) {
      g.add(box(dseg.width, PT, SILL - door.height, mat.alu(), { x: dseg.x0, y: y0, z: door.height, name: 'K1-ust-dolgu' }));
    }
  }

  // --- dusey aluminyum dikmeler
  const posts = new Set([0, W]);
  segs.forEach((s) => { posts.add(s.x0); posts.add(s.x1); });
  for (const px of posts) {
    const x = Math.min(Math.max(px - FW / 2, 0), W - FW);
    g.add(box(FW, PT + 0.6, TT, mat.alu(), { x, y: y0 - 0.3, z: 0, name: `dikme-${Math.round(px)}` }));
  }

  // --- vasistas denizligi (yatay kayit)
  g.add(box(W, PT + 1.2, railH, mat.alu(), { x: 0, y: y0 - 0.6, z: SILL, name: 'vasistas-denizlik' }));

  // --- vasistas camlari (telli cam) + ara kayitlar
  const gz0 = SILL + railH, gz1 = TT;
  const gh = gz1 - gz0;
  const bounds = [...posts].sort((a, b) => a - b);
  for (let i = 0; i < bounds.length - 1; i++) {
    let a = bounds[i], b = bounds[i + 1];
    const span = b - a;
    if (span < 8) continue;
    // genis aciklikta ara kayit (~her 95 cm)
    const n = Math.max(1, Math.round(span / 95));
    for (let k = 0; k < n; k++) {
      const ga = a + (span / n) * k + (k === 0 ? FW / 2 : FW / 2);
      const gb = a + (span / n) * (k + 1) - FW / 2;
      const gw = gb - ga;
      if (gw <= 2) continue;
      const glass = box(gw, 1.0, gh - 1.5, mat.wiredGlass(gw, gh), { x: ga, y: -PT / 2 - 0.5, z: gz0 + 0.75, name: 'vasistas-cam' });
      glass.castShadow = false;
      g.add(glass);
      if (k < n - 1) g.add(box(FW, PT, gh, mat.alu(), { x: gb, y: y0, z: gz0, name: 'ara-kayit' }));
    }
  }

  // --- ust kayit + tavan yesil bandi
  g.add(box(W, PT + 1.2, 2.5, mat.alu(), { x: 0, y: y0 - 0.6, z: TT - 2.5, name: 'ust-kayit' }));
  g.add(box(W, PT, H - TT, mat.paint('greenLight', W, BH, 0.35), { x: 0, y: y0, z: TT, name: 'yesil-bant' }));

  return g;
}

/** Tavan birlesimindeki yesil bant sol/sag/arka duvarlarda da devam ediyor (foto 02/03) */
export function buildCeilingBand() {
  const g = group('Yesil-Bant', { layer: 'greenBand', label: 'Tavan cevresi yesil bant' });
  const m = mat.paint('greenLight', 400, partition.bandHeight, 0.35);
  const z = H - partition.bandHeight;
  // Sag duvarda ankastre dolap bankosu oldugu icin orada bant yok (foto 01/02).
  g.add(box(0.7, D, partition.bandHeight, m, { x: 0, y: 0, z, name: 'bant-sol' }));
  g.add(box(W, 0.7, partition.bandHeight, m, { x: 0, y: D - 0.7, z, name: 'bant-arka' }));
  return g;
}

/* ------------------------------------------------------------------ KAPI */
export function buildDoor() {
  const dseg = doorSegment();
  const g = group('Kapi-K1', { layer: 'door', label: `${door.id} - ${door.width}x${door.height} cm, odaya acilir` });
  if (!dseg) return g;

  const leafW = dseg.width - door.frameFace * 2;
  const leafH = door.height - door.frameFace;
  const t = door.leafThickness;

  // Mentese ekseni (ic taraftan sol) -> pivot grubu
  const pivot = group('K1-pivot');
  const hingeX = door.hinge === 'left' ? dseg.x0 + door.frameFace : dseg.x1 - door.frameFace;
  pivot.position.set(cm(hingeX), 0, 0);
  const sign = door.hinge === 'left' ? 1 : -1;
  const dir = door.swing === 'in' ? 1 : -1;
  pivot.rotation.y = -sign * dir * (door.openAngle * Math.PI / 180);

  const faceMat = mat.paint('greyLaminate', leafW, leafH, 0.35);
  const edgeMat = mat.wood('beech', leafH, 6, 0.35);

  // kanat govdesi (yerel x: 0 -> sign*leafW)
  const lx = door.hinge === 'left' ? 0 : -leafW;
  pivot.add(box(leafW, t, leafH, faceMat, { x: lx, y: -t / 2, z: 0, name: 'K1-kanat' }));
  // kanat serbest kenarindaki acik ahsap fitil (foto 02/03)
  const freeX = door.hinge === 'left' ? leafW - 1.6 : -leafW;
  pivot.add(box(1.6, t + 0.4, leafH, edgeMat, { x: freeX, y: -t / 2 - 0.2, z: 0, name: 'K1-kenar-fitil' }));
  // alt koruma saci
  pivot.add(box(leafW, t + 0.5, door.kickPlate, mat.metal('steelLight', 0.5),
    { x: lx, y: -t / 2 - 0.25, z: 0, name: 'K1-koruma-saci' }));
  // kilit / yazi plakasi
  const ls = door.letterSlot;
  pivot.add(box(ls.w, t + 0.6, ls.h, mat.metal('steelLight', 0.35),
    { x: lx + leafW * 0.55, y: -t / 2 - 0.3, z: ls.height, name: 'K1-plaka' }));
  // kol + rozet (iki yuzde)
  const hx = door.hinge === 'left' ? lx + leafW - 8 : lx + 8;
  for (const s of [1, -1]) {
    const rz = new THREE.Mesh(new THREE.CylinderGeometry(cm(2.6), cm(2.6), cm(1.0), 20), mat.chrome());
    rz.rotation.x = Math.PI / 2;
    rz.position.set(cm(hx), cm(door.handleHeight), s * cm(t / 2 + 0.5));
    pivot.add(rz);
    const arm = new THREE.Mesh(new THREE.CapsuleGeometry(cm(1.1), cm(11), 4, 12), mat.chrome());
    arm.rotation.z = Math.PI / 2;
    arm.position.set(cm(hx - (door.hinge === 'left' ? 6 : -6)), cm(door.handleHeight), s * cm(t / 2 + 2.2));
    pivot.add(arm);
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(cm(1.1), cm(1.1), cm(2.6), 12), mat.chrome());
    stem.rotation.x = Math.PI / 2;
    stem.position.set(cm(hx), cm(door.handleHeight), s * cm(t / 2 + 1.4));
    pivot.add(stem);
  }
  // menteseler
  for (const hz of [22, door.height / 2, door.height - 30]) {
    const h = new THREE.Mesh(new THREE.CylinderGeometry(cm(1.1), cm(1.1), cm(9), 12), mat.metal('steelLight', 0.3));
    h.position.set(0, cm(hz), 0);
    pivot.add(h);
  }
  pivot.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  g.add(pivot);
  return g;
}

/* ------------------------------------------------------ KORIDOR (baglam) */
/** Kapi acikken ardinda gorunen koridor - sadece baglam icin, olcu degeri yok. */
export function buildCorridor() {
  const g = group('Koridor', { layer: 'corridor', label: 'Koridor (baglam - roleve disi)' });
  const CD = 200, CW = W + 200;
  g.add(box(CW, CD, 3, mat.floor(CW, CD), { x: -100, y: -CD - PT, z: -3, name: 'koridor-doseme' }));
  g.add(box(CW, TW, 300, mat.paint('offwhite', CW, 300, 0.6), { x: -100, y: -CD - PT - TW, z: 0, name: 'koridor-arka-duvar' }));
  g.add(box(CW, CD, 3, mat.ceiling(CW, CD), { x: -100, y: -CD - PT, z: 295, name: 'koridor-tavan' }));
  // koridor posterleri
  const dseg = doorSegment();
  for (const [u, w, h, z] of [[dseg.x0 + 20, 60, 84, 100], [dseg.x0 + 95, 60, 84, 100]]) {
    const p = plane(w, h, mat.art('poster'), { x: u, y: -CD - PT + 1, z: z + h / 2 });
    g.add(p);
  }
  // koridor floresan
  const cl = box(120, 20, 8, mat.emissive(0xf6f2e2, 1.2), { x: dseg.x0 + 10, y: -CD / 2, z: 286 });
  cl.castShadow = false;
  g.add(cl);
  return g;
}

export { buildContext };
export const shellDims = { W, D, H, TW, PT };
