/**
 * EKIPMAN, MASA USTU ESYALARI ve DUVAR ELEMANLARI
 * Ekipmanlarin pos degerleri ODA koordinatlarindadir (yerel degil);
 * taban kotu onTop ile referans verilen mobilyanin ust kotundan alinir.
 */
import * as THREE from 'three';
import { palette, room, partition, wallUnits } from '../config/room.js';
import { mat } from '../lib/materials.js';
import { box, boxAt, roundedBox, cyl, sphere, plane, group, cm } from '../lib/geom.js';

/* ============================================================== MONITOR */
export function monitor(it) {
  const g = group(`${it.id} ${it.name}`, { layer: 'equipment', label: it.name, item: it });
  const { w, h } = it;
  const blk = mat.plastic('#1b1d21', 0.42);
  // ayak
  g.add(roundedBox(24, 16, 1.8, 3, blk, { x: w / 2 - 12, y: 2, z: 0 }));
  g.add(box(6, 5, 14, blk, { x: w / 2 - 3, y: 8, z: 1.8 }));
  g.add(box(9, 3, 5, blk, { x: w / 2 - 4.5, y: 9, z: 15 }));
  // panel
  const panel = group('panel');
  panel.add(roundedBox(w, 2.6, h - 16, 0.8, blk, { x: -w / 2, y: -1.3, z: 0, name: 'kasa' }));
  // Ekran +Y yonune bakar (kullanici masanin +Y tarafinda oturur)
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(cm(w - 2.4), cm(h - 16 - 4.6)), mat.screenOff());
  scr.position.set(0, cm((h - 16) / 2 + 0.6), cm(1.5));
  panel.add(scr);
  // alt cerceve + logo
  panel.add(box(w, 1.2, 2.2, mat.plastic('#25272b', 0.4), { x: -w / 2, y: 0.7, z: 0.6 }));
  panel.position.set(cm(w / 2), cm(15), cm(5));
  panel.rotation.x = 0.06;
  panel.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  g.add(panel);
  return g;
}

/* ============================================================ PC KASASI */
export function pcTower(it) {
  const g = group(`${it.id} ${it.name}`, { layer: 'equipment', label: it.name, item: it });
  const { w, d, h } = it;
  const blk = mat.plastic('#181a1d', 0.5);
  g.add(box(w, d, h, blk, { x: 0, y: 0, z: 0, name: 'kasa' }));
  // on panel
  g.add(box(0.8, d - 2, h - 2, mat.plastic('#232529', 0.42), { x: -0.8, y: 1, z: 1 }));
  // optik surucu
  g.add(box(1.2, d - 8, 2.4, mat.plastic('#2b2d31', 0.4), { x: -1.2, y: 4, z: h - 9 }));
  g.add(box(1.2, d - 8, 2.4, mat.plastic('#2b2d31', 0.4), { x: -1.2, y: 4, z: h - 14 }));
  // guc dugmesi + led
  g.add(cyl(1.1, 1.1, 1.2, mat.plastic('#3a3d42', 0.4), { x: -1.4, y: d - 8, z: h - 20, rotZ: Math.PI / 2 }));
  const led = box(0.6, 1.4, 1.4, mat.emissive(0x37d6a0, 1.4), { x: -1.6, y: d - 14, z: h - 20 });
  led.castShadow = false;
  g.add(led);
  // havalandirma
  for (let i = 0; i < 7; i++) g.add(box(0.6, d - 12, 0.7, mat.plastic('#0e0f11', 0.8), { x: -1.5, y: 6, z: 6 + i * 2.2 }));
  // ust yesil etiket (foto 01)
  g.add(box(w - 6, 5, 0.4, mat.plain('#7fbf3f', 0.6), { x: 3, y: d - 12, z: h }));
  return g;
}

/* =============================================================== KLAVYE */
export function keyboard(it) {
  const g = group(`${it.id} ${it.name}`, { layer: 'equipment', label: it.name, item: it });
  const { w, d, h } = it;
  const blk = mat.plastic('#1c1e22', 0.55);
  g.add(roundedBox(w, d, h * 0.6, 0.5, blk, { x: 0, y: 0, z: 0, name: 'govde' }));
  // tus bloklari
  const keys = mat.plastic('#2b2e33', 0.7);
  const rows = 6, cols = 22;
  const kw = (w - 4) / cols, kh = (d - 3) / rows;
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    if (r === 1 && c > 17) continue;
    const kk = box(kw * 0.82, kh * 0.78, 0.7, keys, { x: 2 + c * kw, y: 1.5 + r * kh, z: h * 0.6 });
    kk.castShadow = false;
    g.add(kk);
  }
  return g;
}

export function mouse(it) {
  const g = group(`${it.id} ${it.name}`, { layer: 'equipment', label: it.name, item: it });
  const m = new THREE.Mesh(new THREE.SphereGeometry(cm(it.w / 2), 18, 12), mat.plastic('#1c1e22', 0.45));
  m.scale.set(1, it.h / (it.w / 2) * 0.9, it.d / it.w * 2);
  m.position.set(cm(it.w / 2), 0, cm(it.d / 2));
  m.castShadow = true;
  g.add(m);
  g.add(box(1.2, it.d * 0.45, 0.6, mat.plastic('#3a3d42', 0.5), { x: it.w / 2 - 0.6, y: 1.5, z: it.h - 0.4 }));
  return g;
}

/* ================================================== MASA USTU KUCUK ESYA */
export function binder(it) {
  const g = group(`${it.id} ${it.name}`, { layer: 'equipment', label: it.name, item: it });
  g.add(roundedBox(it.w, it.d, it.h, 0.4, mat.plain('#f4f2ec', 0.8), { x: 0, y: 0, z: 0, name: 'defter' }));
  g.add(box(it.w, 1.4, it.h + 0.3, mat.plain('#d8d4c8', 0.8), { x: 0, y: 0, z: 0, name: 'sirt' }));
  return g;
}

export function penPot(it) {
  const g = group(`${it.id} ${it.name}`, { layer: 'equipment', label: it.name, item: it });
  const r = it.w / 2;
  g.add(cyl(r, r * 0.85, it.h * 0.55, mat.plain('#a9773f', 0.85), { x: r, y: r, z: it.h * 0.275, seg: 18 }));
  g.add(cyl(r + 0.4, r + 0.4, 1.2, mat.plain('#8d5f2e', 0.85), { x: r, y: r, z: it.h * 0.55, seg: 18 }));
  const cols = ['#1b1d20', '#c0392b', '#2a5fa8', '#1b1d20', '#d4a017'];
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    const p = new THREE.Mesh(new THREE.CylinderGeometry(cm(0.4), cm(0.4), cm(14), 7), mat.plain(cols[i], 0.5));
    p.position.set(cm(r + Math.cos(a) * r * 0.45), cm(it.h * 0.55 + 5), cm(r + Math.sin(a) * r * 0.45));
    p.rotation.z = Math.cos(a) * 0.22; p.rotation.x = -Math.sin(a) * 0.22;
    p.castShadow = true;
    g.add(p);
  }
  return g;
}

export function smallBox(it) {
  const g = group(`${it.id} ${it.name}`, { layer: 'equipment', label: it.name, item: it });
  g.add(roundedBox(it.w, it.d, it.h, 0.4, mat.plain('#e9e6df', 0.6), { x: 0, y: 0, z: 0 }));
  g.add(box(it.w - 2, it.d - 2, 0.5, mat.plain('#b8b4ac', 0.5), { x: 1, y: 1, z: it.h }));
  return g;
}

export function coaster(it) {
  const g = group(`${it.id} ${it.name}`, { layer: 'equipment', label: it.name, item: it });
  g.add(cyl(it.w / 2, it.w / 2, it.h, mat.plain('#2f2a26', 0.7), { x: it.w / 2, y: it.w / 2, z: it.h / 2, seg: 24 }));
  return g;
}

/* ============================================================== YAZICI */
/** Ofis tipi cok fonksiyonlu yazici: govde + kagit cikis yuvasi + tarayici + ADF */
export function printer(it) {
  const g = group(`${it.id} ${it.name}`, { layer: 'equipment', label: it.name, item: it });
  const { w, d, h } = it;
  const shell = mat.plain('#dcd7cd', 0.62);
  const shell2 = mat.plain('#cbc6bb', 0.62);
  const dark = mat.plain('#3a3c40', 0.5);

  const hBody = h * 0.46;      // alt govde (kaset + mekanik)
  const hSlot = h * 0.16;      // kagit cikis yuvasi (icerlek)
  const hScan = h * 0.24;      // tarayici govdesi
  const hLid = h * 0.14;       // ADF / kapak

  // alt govde + kagit kaseti
  g.add(roundedBox(w, d, hBody, 1.4, shell, { x: 0, y: 0, z: 0, name: 'govde' }));
  g.add(box(w - 8, 2.0, hBody * 0.52, shell2, { x: 4, y: -2.0, z: hBody * 0.16, name: 'kagit-kaseti' }));
  g.add(box(w * 0.34, 0.8, 1.4, dark, { x: w * 0.33, y: -2.6, z: hBody * 0.16 + hBody * 0.52 * 0.42 }));

  // icerlek kagit cikis yuvasi (govde ile tarayici arasi)
  g.add(box(w - 7, d - 7, hSlot, mat.plain('#8f8b84', 0.75), { x: 3.5, y: 3.5, z: hBody, name: 'cikis-yuvasi' }));
  g.add(box(w - 14, d - 16, 1.2, shell2, { x: 7, y: 8, z: hBody + 1.0, name: 'cikis-tepsisi' }));

  // tarayici govdesi
  g.add(roundedBox(w, d - 3, hScan, 1.2, shell, { x: 0, y: 1.5, z: hBody + hSlot, name: 'tarayici' }));
  // ADF kapagi (arkaya dogru menteseli, hafif aralikli)
  g.add(roundedBox(w - 3, d - 10, hLid, 1.0, shell2, { x: 1.5, y: 5, z: hBody + hSlot + hScan, name: 'adf-kapak' }));
  g.add(box(w - 12, d - 22, 1.6, mat.plain('#b9b4ab', 0.7), { x: 6, y: 10, z: hBody + hSlot + hScan + hLid, name: 'adf-tepsi' }));

  // kontrol paneli (on sag)
  const pz = hBody + hSlot + hScan * 0.86;
  g.add(box(w * 0.36, 9, 1.6, dark, { x: w * 0.58, y: d - 11, z: pz, name: 'kontrol-paneli' }));
  const scr = box(w * 0.20, 5, 0.5, mat.plain('#6d8f7a', 0.32), { x: w * 0.62, y: d - 9.5, z: pz + 1.6 });
  scr.castShadow = false;
  g.add(scr);
  for (let i = 0; i < 4; i++) {
    g.add(cyl(0.7, 0.7, 0.7, mat.plain('#5c5f63', 0.5), { x: w * 0.86, y: d - 9.5 + i * 1.8, z: pz + 1.6, seg: 10 }));
  }
  // marka seridi
  g.add(box(w * 0.22, 0.5, 1.6, mat.plain('#8a8680', 0.6), { x: w * 0.08, y: d - 1.5, z: hBody + hSlot + hScan * 0.35 }));
  return g;
}

/** Kupa / odul - foto 05, tezgahin pencere ucunda */
export function trophy(it) {
  const g = group(`${it.id} ${it.name}`, { layer: 'equipment', label: it.name, item: it });
  const { w, h } = it;
  const gold = mat.metal('steelLight', 0.18);
  const goldM = new THREE.MeshStandardMaterial({ color: 0xc9a227, roughness: 0.22, metalness: 0.95, envMapIntensity: 1.5 });
  const base = mat.wood('beechDark', 12, 6, 0.35);
  const cx = w / 2, cy = w / 2;
  g.add(box(w, w, h * 0.16, base, { x: 0, y: 0, z: 0, name: 'kaide' }));
  g.add(cyl(w * 0.16, w * 0.22, h * 0.22, goldM, { x: cx, y: cy, z: h * 0.16 + h * 0.11, seg: 16 }));
  // kase
  const cup = new THREE.Mesh(new THREE.CylinderGeometry(cm(w * 0.42), cm(w * 0.16), cm(h * 0.40), 20, 1, true), goldM);
  cup.position.set(cm(cx), cm(h * 0.38 + h * 0.20), cm(cy));
  cup.castShadow = true;
  g.add(cup);
  g.add(cyl(w * 0.42, w * 0.42, 1.2, goldM, { x: cx, y: cy, z: h * 0.78, seg: 20 }));
  // kulplar
  for (const sx of [-1, 1]) {
    const hd = new THREE.Mesh(new THREE.TorusGeometry(cm(w * 0.18), cm(0.6), 6, 14, Math.PI), goldM);
    hd.position.set(cm(cx + sx * w * 0.42), cm(h * 0.60), cm(cy));
    hd.rotation.y = Math.PI / 2;
    hd.rotation.z = sx > 0 ? -Math.PI / 2 : Math.PI / 2;
    g.add(hd);
  }
  return g;
}

/* ================================================ DOLAP USTU / YER ESYASI */
export function binder3d(it) {
  const g = group(`${it.id} ${it.name}`, { layer: 'clutter', label: it.name, item: it });
  g.add(box(it.w, it.d, it.h, mat.plain('#2a5aa0', 0.72), { x: 0, y: 0, z: 0, name: 'klasor' }));
  g.add(box(it.w - 1.5, it.d - 2, it.h - 3, mat.plain('#f0ece0', 0.85), { x: 0.4, y: 1, z: 1.5 }));
  g.add(box(it.w + 0.4, 6, 3, mat.plain('#f6f4ee', 0.8), { x: -0.2, y: it.d * 0.2, z: it.h * 0.68, name: 'etiket' }));
  return g;
}

export function crt(it) {
  const g = group(`${it.id} ${it.name}`, { layer: 'clutter', label: it.name, item: it });
  const { w, d, h } = it;
  const body = mat.plastic('#2a2c2e', 0.6);
  g.add(roundedBox(w, d, h, 1.5, body, { x: 0, y: 0, z: 0, name: 'kasa' }));
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(cm(w - 6), cm(h - 7)), mat.screenOff());
  scr.position.set(cm(w / 2), cm(h / 2 + 0.5), cm(d + 0.2));
  g.add(scr);
  return g;
}

export function boardGame(it) {
  const g = group(`${it.id} ${it.name}`, { layer: 'clutter', label: it.name, item: it });
  g.add(box(it.w, it.d, it.h, mat.plain('#c9532f', 0.7), { x: 0, y: 0, z: 0, name: 'kutu' }));
  g.add(box(it.w - 4, it.d - 5, 0.4, mat.plain('#f2e6c8', 0.7), { x: 2, y: 2.5, z: it.h }));
  return g;
}

export function ball(it) {
  const g = group(`${it.id} ${it.name}`, { layer: 'clutter', label: it.name, item: it });
  const r = it.w / 2;
  const b = sphere(r, mat.plain('#cfcac2', 0.62), { x: r, y: r, z: r });
  g.add(b);
  // dikis/pentagon izleri
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2, e = ((i % 3) - 1) * 0.7;
    const p = new THREE.Mesh(new THREE.CircleGeometry(cm(r * 0.30), 5), mat.plain('#8d8880', 0.7));
    const dir = new THREE.Vector3(Math.cos(a) * Math.cos(e), Math.sin(e), Math.sin(a) * Math.cos(e));
    p.position.copy(dir.clone().multiplyScalar(cm(r * 1.005))).add(new THREE.Vector3(cm(r), cm(r), cm(r)));
    p.lookAt(p.position.clone().add(dir));
    g.add(p);
  }
  return g;
}

export function tube(it) {
  const g = group(`${it.id} ${it.name}`, { layer: 'clutter', label: it.name, item: it });
  const r = it.h / 2;
  const t = cyl(r, r, it.w, mat.plain('#b9895a', 0.85), { x: it.w / 2, y: r, z: r, seg: 20, rotZ: Math.PI / 2 });
  g.add(t);
  return g;
}

/* ================================================== DUVAR ELEMANLARI */
/** Duvar yuzeyine dik yerlesim icin donusum: (wall, u, z) -> [x, y, rotY, normal] */
export function wallFrame(wall) {
  switch (wall) {
    case 'front': return { toXY: (u) => [u, 0], rotY: 0, n: [0, 1] };
    case 'back':  return { toXY: (u) => [room.width - u, room.depth], rotY: Math.PI, n: [0, -1] };
    case 'left':  return { toXY: (u) => [0, u], rotY: Math.PI / 2, n: [1, 0] };
    case 'right': return { toXY: (u) => [room.width, u], rotY: -Math.PI / 2, n: [-1, 0] };
    default: return { toXY: (u) => [u, 0], rotY: 0, n: [0, 1] };
  }
}


/**
 * Duvar yuzeyine paralel levha. Yerel eksenler: X = genislik, Y = yukseklik,
 * Z = duvardan disa dogru kalinlik. Merkez (0,0,0)'dir.
 */
function plate(w, h, t, material, outZ = 0) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(cm(w), cm(h), cm(t)), material);
  m.position.set(0, 0, cm(outZ + t / 2));
  m.castShadow = true; m.receiveShadow = true;
  return m;
}
function plateAt(w, h, t, material, x, y, outZ = 0) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(cm(w), cm(h), cm(t)), material);
  m.position.set(cm(x), cm(y), cm(outZ + t / 2));
  m.castShadow = true; m.receiveShadow = true;
  return m;
}

/** Bir duvar elemanini olusturup dogru duvara yerlestirir */
export function buildWallItem(it) {
  const g = group(`${it.id} ${it.name}`, { layer: 'wallItems', label: it.name, item: it });
  const wf = wallFrame(it.wall);
  const offset = it.wall === 'right' && it.z > wallUnits.zBottom ? wallUnits.depth : 0;

  const inner = group('inner');
  switch (it.type) {
    case 'clock': {
      const r = it.dia / 2;
      inner.add(cyl(r, r, 3.4, mat.plain('#f2f0ea', 0.6), { x: 0, y: 0, z: 0, seg: 40, rotX: Math.PI / 2 }));
      const face = new THREE.Mesh(new THREE.CircleGeometry(cm(r - 1.2), 40), mat.plain('#fbfaf6', 0.5));
      face.position.set(0, 0, cm(1.8));
      inner.add(face);
      // rakamlar / cizgiler
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        const tick = new THREE.Mesh(new THREE.BoxGeometry(cm(0.7), cm(i % 3 === 0 ? 2.6 : 1.7), cm(0.2)), mat.plain('#22242a', 0.6));
        tick.position.set(cm(Math.sin(a) * (r - 3.3)), cm(Math.cos(a) * (r - 3.3)), cm(1.9));
        tick.rotation.z = -a;
        inner.add(tick);
      }
      // akrepler (fotodaki ~09:07)
      const hh = new THREE.Mesh(new THREE.BoxGeometry(cm(0.9), cm(r * 0.55), cm(0.3)), mat.plain('#1b1d22', 0.5));
      hh.position.set(cm(Math.sin(-1.6) * r * 0.27), cm(Math.cos(-1.6) * r * 0.27), cm(2.05));
      hh.rotation.z = 1.6; inner.add(hh);
      const mh = new THREE.Mesh(new THREE.BoxGeometry(cm(0.7), cm(r * 0.82), cm(0.3)), mat.plain('#1b1d22', 0.5));
      mh.position.set(cm(Math.sin(0.73) * r * 0.41), cm(Math.cos(0.73) * r * 0.41), cm(2.2));
      mh.rotation.z = -0.73; inner.add(mh);
      inner.add(cyl(0.9, 0.9, 0.6, mat.plain('#e08a1e', 0.5), { x: 0, y: 0, z: 2.3, seg: 12, rotX: Math.PI / 2 }));
      break;
    }
    case 'picture': {
      const fw = it.w, fh = it.h;
      const back = 1.6;            // arka kapak kalinligi
      const mb = 3.0;              // cerceve profil genisligi
      const prof = 1.8;            // profilin duvardan cikintisi
      const wood = mat.wood('beechDark', fw, fh, 0.4);
      // arka kapak
      inner.add(plate(fw, fh, back, mat.plain('#8a7a66', 0.85)));
      // gorsel - arka kapagin ONUNDE
      const art = new THREE.Mesh(new THREE.PlaneGeometry(cm(fw - mb * 2), cm(fh - mb * 2)), mat.art(it.art || 'landscape'));
      art.position.set(0, 0, cm(back + 0.05));
      inner.add(art);
      // cam parlamasi
      const gl = new THREE.Mesh(new THREE.PlaneGeometry(cm(fw - mb * 2), cm(fh - mb * 2)),
        new THREE.MeshPhysicalMaterial({ transparent: true, opacity: 0.09, roughness: 0.04, metalness: 0, color: 0xffffff }));
      gl.position.set(0, 0, cm(back + 0.35));
      inner.add(gl);
      // 4 kenar cerceve profili
      inner.add(plateAt(fw, mb, back + prof, wood, 0, (fh - mb) / 2));
      inner.add(plateAt(fw, mb, back + prof, wood, 0, -(fh - mb) / 2));
      inner.add(plateAt(mb, fh - mb * 2, back + prof, wood, (fw - mb) / 2, 0));
      inner.add(plateAt(mb, fh - mb * 2, back + prof, wood, -(fw - mb) / 2, 0));
      break;
    }
    case 'mirror': {
      const fw = it.w, fh = it.h;
      inner.add(plate(fw, fh, 2.0, mat.metal('steelLight', 0.3)));
      const m = new THREE.Mesh(new THREE.PlaneGeometry(cm(fw - 3), cm(fh - 3)), mat.mirror());
      m.position.set(0, 0, cm(2.1));
      inner.add(m);
      // sari aski kayisi (foto 03)
      inner.add(plateAt(4, 34, 0.8, mat.plain(palette.yellow.hex, 0.75), 0, fh / 2 + 16));
      break;
    }
    case 'pinboard': {
      // Mantar pano: acik ahsap cerceve + mantar yuzey + birkac not (foto 05)
      const bw = it.w, bh = it.h, fr = 3.0, t = 2.4;
      inner.add(plate(bw, bh, t, mat.wood('beech', bw, bh, 0.4)));
      inner.add(plate(bw - fr * 2, bh - fr * 2, t + 0.8, mat.plain('#c9a978', 0.95)));
      const notes = [[-0.22, 0.18, 16, 11], [0.14, 0.06, 13, 9], [-0.05, -0.22, 18, 8]];
      for (const [nx, ny, nw, nh] of notes) {
        inner.add(plateAt(nw, nh, 0.3, mat.plain('#f6f4ec', 0.9), nx * bw, ny * bh, t + 0.8));
      }
      break;
    }
    case 'switch': {
      inner.add(plate(it.w, it.h, 1.0, mat.plain('#f2f1ee', 0.5)));
      inner.add(plate(it.w - 2.4, it.h - 2.4, 0.6, mat.plain('#e6e5e1', 0.4), 1.0));
      break;
    }
    case 'socket': {
      inner.add(plate(it.w, it.h, 1.0, mat.plain('#f2f1ee', 0.5)));
      const c1 = new THREE.Mesh(new THREE.CircleGeometry(cm(2.0), 20), mat.plain('#d8d6d0', 0.5));
      c1.position.set(0, 0, cm(1.05)); inner.add(c1);
      for (const s of [-1, 1]) {
        const p = new THREE.Mesh(new THREE.CircleGeometry(cm(0.45), 10), mat.plain('#2a2c2e', 0.5));
        p.position.set(cm(s * 0.95), 0, cm(1.1)); inner.add(p);
      }
      break;
    }
    default: break;
  }

  const [x, y] = wf.toXY(it.u);
  inner.rotation.y = wf.rotY;
  g.position.set(cm(x + wf.n[0] * offset), cm(it.z), cm(y + wf.n[1] * offset));
  inner.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  g.add(inner);
  return g;
}

export const equipBuilders = {
  monitor, pcTower, keyboard, mouse, binder, penPot, smallBox, coaster, printer, trophy,
  binder3d, crt, boardGame, ball, tube,
};
