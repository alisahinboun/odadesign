/**
 * MODEL DERLEYICI
 * src/config/room.js icindeki veriyi gezilebilir bir THREE sahnesine cevirir.
 * Donen kok grup, gorsellestiricinin katman anahtarlari icin
 * userData.layer etiketli alt gruplar icerir.
 */
import * as THREE from 'three';
import {
  room, furniture, equipment, clutter, wallItems, ceiling as ceilCfg, wallUnits, meta,
  windows, radiators,
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
  { key: 'floor',      label: 'Döşeme',                on: true },
  { key: 'ceiling',    label: 'Asma tavan + armatür',  on: true },
  { key: 'partition',  label: 'Ön bölüntü (kapı duvarı)', on: true },
  { key: 'door',       label: 'Kapı kanadı',           on: true },
  { key: 'wallLeft',   label: 'Sol duvar',             on: true },
  { key: 'wallBack',   label: 'Arka duvar',            on: true },
  { key: 'wallRight',  label: 'Sağ duvar',             on: true },
  { key: 'greenBand',  label: 'Tavan yeşil bandı',     on: true },
  { key: 'wallUnits',  label: 'Ankastre üst dolaplar', on: true },
  { key: 'furniture',  label: 'Mobilya',               on: true },
  { key: 'equipment',  label: 'Ekipman / masa üstü',   on: true },
  { key: 'wallItems',  label: 'Duvar elemanları',      on: true },
  { key: 'clutter',    label: 'Dağınık eşya',          on: true },
  { key: 'windows',    label: 'Pencere + perde',       on: true },
  { key: 'radiator',   label: 'Radyatör',              on: true },
  { key: 'corridor',   label: 'Koridor (bağlam)',      on: true },
  { key: 'context',    label: 'Pencere manzarası',     on: true },
  { key: 'lights',     label: 'Işık kaynakları',       on: true },
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
    shell.buildContext(),
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
  const cg = group('Esya', { layer: 'clutter', label: 'Dağınık eşya' });
  for (const it of clutter) {
    const b = equipBuilders[it.type];
    if (!b) continue;
    const g = b(it);
    g.userData = { ...g.userData, layer: 'clutter', item: it };
    cg.add(place(g, { ...it, z: it.onTop ? topOf(it.onTop) : (it.z || 0) }));
  }
  root.add(cg);

  /* --- duvar elemanlari --- */
  const wg = group('Duvar-Elemanlari', { layer: 'wallItems', label: 'Duvar elemanları' });
  for (const it of wallItems) wg.add(buildWallItem(it));
  root.add(wg);

  return root;
}

/* ====================================================== AYDINLATMA RIGI */
/**
 * Odanin isik kaynagi artik iki tane:
 *   1) arka duvardaki BUYUK PENCERE  -> baskin gunisigi (foto 05)
 *   2) asma tavandaki iki floresan armatur
 * Foto 05'te karsi bina yakin ve dogrudan gunes girmiyor; bu yuzden gunisigi
 * yumusak ve difuz, hafif soguk. Pencere hizasindaki dikey yayilim icin
 * pencere agzina bir alan isigi (RectAreaLight yerine yonlu + dolgu) konur.
 */
export function buildLights(scene) {
  const g = group('Aydinlatma', { layer: 'lights', label: 'Isik kaynaklari' });
  const win = windows.find((w) => w.wall === 'back');

  const hemi = new THREE.HemisphereLight(0xcfdbe9, 0x5d564c, 0.22);
  hemi.position.set(cm(room.width / 2), cm(room.height + 100), cm(room.depth / 2));
  g.add(hemi);

  /* --- 1. Pencereden gelen gunisigi --- */
  const daylight = new THREE.DirectionalLight(0xdfe9f5, 1.15);
  if (win) {
    const cx = win.u + win.width / 2;
    const cz = win.sill + win.height / 2;
    daylight.position.set(cm(cx + 40), cm(cz + 180), cm(room.depth + 320));
    daylight.target.position.set(cm(cx - 30), cm(60), cm(room.depth * 0.20));
  } else {
    daylight.position.set(cm(room.width / 2), cm(300), cm(room.depth + 300));
    daylight.target.position.set(cm(room.width / 2), cm(60), cm(0));
  }
  daylight.castShadow = true;
  daylight.shadow.mapSize.set(2048, 2048);
  {
    const c = daylight.shadow.camera;
    c.left = -3.2; c.right = 3.2; c.top = 3.2; c.bottom = -3.2; c.near = 0.4; c.far = 16;
  }
  daylight.shadow.bias = -0.0006;
  daylight.shadow.normalBias = 0.022;
  g.add(daylight, daylight.target);

  // pencere agzinda difuz dolgu: gunisigini oda derinligine tasir
  const winFill = [];
  if (win) {
    const n = 3;
    for (let i = 0; i < n; i++) {
      const u = win.u + (win.width / (n + 1)) * (i + 1);
      // Pencere agzinin bir miktar ICERISINDE: pencere duvarini yikamasin,
      // isigi oda derinligine tasisin.
      const pl = new THREE.PointLight(0xe6eef8, 2.4, cm(520), 1.9);
      pl.position.set(cm(u), cm(win.sill + win.height * 0.62), cm(room.depth - 75));
      g.add(pl);
      winFill.push(pl);
    }
  }

  /* --- 2. Tavan armaturleri --- */
  const lamps = [];
  ceilCfg.luminaires.forEach((l) => {
    const sp = new THREE.SpotLight(0xffeecf, 11, cm(520), Math.PI / 2.15, 0.95, 1.7);
    sp.position.set(cm(l.pos[0]), cm(room.height - 8), cm(l.pos[1]));
    sp.target.position.set(cm(l.pos[0]), 0, cm(l.pos[1]));
    sp.castShadow = true;
    sp.shadow.mapSize.set(1536, 1536);
    sp.shadow.bias = -0.0012;
    sp.shadow.normalBias = 0.02;
    sp.shadow.camera.near = 0.2;
    sp.shadow.camera.far = 8;
    g.add(sp, sp.target);
    lamps.push(sp);
  });

  /* --- 3. Koridordan sizan isik (kapi + vasistas) --- */
  const corridor = new THREE.DirectionalLight(0xfff4e0, 0.35);
  corridor.position.set(cm(60), cm(300), cm(-380));
  corridor.target.position.set(cm(room.width * 0.5), cm(80), cm(room.depth * 0.4));
  g.add(corridor, corridor.target);

  /* --- 4. Yumusatici dolgu --- */
  const fill = new THREE.PointLight(0xf2ece0, 1.0, cm(400), 2.0);
  fill.position.set(cm(room.width * 0.72), cm(200), cm(room.depth * 0.35));
  g.add(fill);

  scene.add(g);
  return { group: g, sun: daylight, corridor, hemi, fill, lamps, winFill };
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
