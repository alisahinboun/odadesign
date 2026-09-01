/**
 * MODEL DERLEYICI
 * src/config/room.js icindeki veriyi gezilebilir bir THREE sahnesine cevirir.
 * Donen kok grup, gorsellestiricinin katman anahtarlari icin
 * userData.layer etiketli alt gruplar icerir.
 */
import * as THREE from 'three';
import {
  room, furniture, equipment, clutter, wallItems, ceiling as ceilCfg, wallUnits, meta,
} from '../config/room.js';
import { place, group, cm } from '../lib/geom.js';
import * as shell from './shell.js';
import { builders, buildWallUnits } from './furniture.js';
import { equipBuilders, buildWallItem } from './equipment.js';

/** Bir mobilyanin ust kotu (ekipmanlarin uzerine oturmasi icin) */
function topOf(id) {
  const f = furniture.find((x) => x.id === id);
  return f ? f.h : 0;
}

export const LAYERS = [
  { key: 'floor',      label: 'Doseme',                on: true },
  { key: 'ceiling',    label: 'Asma tavan + armatur',  on: true },
  { key: 'partition',  label: 'On boluntu (kapi duvari)', on: true },
  { key: 'door',       label: 'Kapi kanadi',           on: true },
  { key: 'wallLeft',   label: 'Sol duvar',             on: true },
  { key: 'wallBack',   label: 'Arka duvar',            on: true },
  { key: 'wallRight',  label: 'Sag duvar',             on: true },
  { key: 'greenBand',  label: 'Tavan yesil bandi',     on: true },
  { key: 'wallUnits',  label: 'Ankastre ust dolaplar', on: true },
  { key: 'furniture',  label: 'Mobilya',               on: true },
  { key: 'equipment',  label: 'Ekipman / masa ustu',   on: true },
  { key: 'wallItems',  label: 'Duvar elemanlari',      on: true },
  { key: 'clutter',    label: 'Dagınık esya',          on: true },
  { key: 'corridor',   label: 'Koridor (baglam)',      on: true },
  { key: 'lights',     label: 'Isik kaynaklari',       on: true },
];

export function buildRoom() {
  const root = group('ODA', { meta });

  /* --- kabuk --- */
  root.add(
    shell.buildFloor(),
    shell.buildCeiling(),
    shell.buildLeftWall(),
    shell.buildBackWall(),
    shell.buildRightWall(),
    shell.buildPartition(),
    shell.buildCeilingBand(),
    shell.buildDoor(),
    shell.buildCorridor(),
  );

  /* --- ankastre ust dolaplar --- */
  root.add(buildWallUnits());

  /* --- mobilya --- */
  const fg = group('Mobilya', { layer: 'furniture', label: 'Mobilya' });
  for (const it of furniture) {
    const b = builders[it.type];
    if (!b) { console.warn('Bilinmeyen mobilya tipi:', it.type); continue; }
    const g = b(it);
    g.userData = { ...g.userData, layer: 'furniture', item: it };
    fg.add(place(g, it));
  }
  root.add(fg);

  /* --- ekipman (mobilya ustune oturur) --- */
  const eg = group('Ekipman', { layer: 'equipment', label: 'Ekipman' });
  for (const it of equipment) {
    const b = equipBuilders[it.type];
    if (!b) { console.warn('Bilinmeyen ekipman tipi:', it.type); continue; }
    const g = b(it);
    g.userData = { ...g.userData, layer: 'equipment', item: it };
    eg.add(place(g, { ...it, z: it.onTop ? topOf(it.onTop) : (it.z || 0) }));
  }
  root.add(eg);

  /* --- dagınık esya --- */
  const cg = group('Esya', { layer: 'clutter', label: 'Dagınık esya' });
  for (const it of clutter) {
    const b = equipBuilders[it.type];
    if (!b) continue;
    const g = b(it);
    g.userData = { ...g.userData, layer: 'clutter', item: it };
    cg.add(place(g, { ...it, z: it.onTop ? topOf(it.onTop) : (it.z || 0) }));
  }
  root.add(cg);

  /* --- duvar elemanlari --- */
  const wg = group('Duvar-Elemanlari', { layer: 'wallItems', label: 'Duvar elemanlari' });
  for (const it of wallItems) wg.add(buildWallItem(it));
  root.add(wg);

  return root;
}

/* ====================================================== AYDINLATMA RIGI */
export function buildLights(scene) {
  const g = group('Aydinlatma', { layer: 'lights', label: 'Isik kaynaklari' });

  const hemi = new THREE.HemisphereLight(0xd2dcea, 0x6f685d, 0.34);
  hemi.position.set(cm(room.width / 2), cm(room.height + 100), cm(room.depth / 2));
  g.add(hemi);

  // Tavan armaturleri -> yumusak spot
  ceilCfg.luminaires.forEach((l, i) => {
    const sp = new THREE.SpotLight(0xffeecf, 19, cm(520), Math.PI / 2.15, 1.0, 1.7);
    sp.position.set(cm(l.pos[0]), cm(room.height - 8), cm(l.pos[1]));
    sp.target.position.set(cm(l.pos[0]), 0, cm(l.pos[1]));
    sp.castShadow = i === 0;
    if (sp.castShadow) {
      sp.shadow.mapSize.set(2048, 2048);
      sp.shadow.bias = -0.0012;
      sp.shadow.normalBias = 0.02;
      sp.shadow.camera.near = 0.2;
      sp.shadow.camera.far = 8;
    }
    g.add(sp, sp.target);
  });

  // Koridordan (kapi + vasistas) gelen gunisigi sizmasi
  const sun = new THREE.DirectionalLight(0xfff4e0, 0.85);
  sun.position.set(cm(60), cm(320), cm(-420));
  sun.target.position.set(cm(room.width * 0.55), cm(70), cm(room.depth * 0.5));
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  const dc = sun.shadow.camera;
  dc.left = -4; dc.right = 4; dc.top = 4; dc.bottom = -4; dc.near = 0.5; dc.far = 16;
  sun.shadow.bias = -0.0008;
  sun.shadow.normalBias = 0.02;
  g.add(sun, sun.target);

  // Dolgu (golgeleri yumusatir)
  const fill = new THREE.PointLight(0xf2ece0, 3.2, cm(400), 2.0);
  fill.position.set(cm(room.width * 0.72), cm(200), cm(room.depth * 0.72));
  g.add(fill);

  const fill2 = new THREE.PointLight(0xe8ecf2, 2.0, cm(360), 2.0);
  fill2.position.set(cm(60), cm(210), cm(room.depth * 0.7));
  g.add(fill2);

  scene.add(g);
  return { group: g, sun, hemi, fill, fill2 };
}

/** Oda hacmi / alan ozeti - arayuzde ve mahal listesinde kullanilir */
export function roomMetrics() {
  const a = (room.width * room.depth) / 10000;
  const v = a * (room.height / 100);
  const perim = 2 * (room.width + room.depth) / 100;
  const wallArea = perim * (room.height / 100);
  return {
    alan: a, hacim: v, cevre: perim, duvarAlani: wallArea,
    netYuk: room.height / 100,
  };
}
