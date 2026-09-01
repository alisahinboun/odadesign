/**
 * MOBILYA URETECLERI
 * Her uretec, yerel orijini (0,0,0) elemanin SOL-ON-ALT kosesinde olan bir
 * THREE.Group dondurur. Boyutlar yerel +X(w) / +Y(d) / +Z(h) yonundedir.
 * Konumlandirma ve donme src/model/index.js icindeki place() ile yapilir.
 */
import * as THREE from 'three';
import { palette, wallUnits, room } from '../config/room.js';
import { mat } from '../lib/materials.js';
import { box, boxAt, roundedBox, cyl, sphere, plane, group, cm } from '../lib/geom.js';

/* ------------------------------------------------------------- yardimci */
const BOOK_COLORS = [
  '#33507d', '#7d3535', '#356043', '#6f6033', '#433569', '#2b3a45',
  '#7d5f35', '#4f4f52', '#8d6a4a', '#2f5a5e', '#6b3050', '#3f5230',
];

/**
 * Bir rafi dosya/kitapla doldurur. Duz duran ciltler, yana yatmis birkac kitap,
 * yatay istifler ve bos araliklar karisik olarak yerlestirilir - hepsi ayni
 * kalinlikta dizilmis "levha" gorunumunden kacinmak icin.
 */
function books(g, { x, y, z, len, depth, height, seedN = 1 }) {
  let s = seedN * 7919 + 13;
  const r = () => ((s = (s * 1103515245 + 12345) % 2147483648) / 2147483648);
  const col = () => BOOK_COLORS[Math.floor(r() * BOOK_COLORS.length)];
  let cx = x + 1;
  const end = x + len - 1;

  while (cx < end - 3) {
    const roll = r();

    if (roll < 0.10) {                       // bos aralik
      cx += 3 + r() * 9;
      continue;
    }
    if (roll < 0.24) {                       // yatay istif (yan yatmis kitaplar)
      const w = 14 + r() * 10;
      if (cx + w > end) break;
      let sz = z;
      const n = 2 + Math.floor(r() * 3);
      for (let i = 0; i < n && sz < z + height - 3; i++) {
        const t = 2.2 + r() * 1.6;
        g.add(box(w - r() * 2, depth * (0.8 + r() * 0.15), t, mat.plain(col(), 0.78),
          { x: cx + r() * 1.5, y: y + r() * 1.5, z: sz }));
        sz += t + 0.15;
      }
      cx += w + 1.5;
      continue;
    }
    if (roll < 0.34) {                       // arsiv kutusu / genis klasor
      const w = 7 + r() * 3;
      if (cx + w > end) break;
      const h = height * (0.86 + r() * 0.1);
      g.add(box(w, depth * 0.94, h, mat.plain(r() < 0.5 ? '#3b4250' : '#5c4a3a', 0.82), { x: cx, y, z }));
      g.add(box(w - 2, 0.5, 3.2, mat.plain('#efece4', 0.85), { x: cx + 1, y: y + depth * 0.94, z: z + h * 0.66 }));
      cx += w + 0.5;
      continue;
    }

    // duz duran cilt
    const w = 1.3 + r() * 3.4;
    if (cx + w > end) break;
    const h = height * (0.58 + r() * 0.34);
    const d2 = depth * (0.70 + r() * 0.24);
    const b = box(w, d2, h, mat.plain(col(), 0.72 + r() * 0.12), { x: cx, y: y + r() * 1.2, z });
    if (r() < 0.10) { b.rotation.z = (r() - 0.5) * 0.20; b.position.y -= cm(0.4); }
    g.add(b);
    cx += w + (r() < 0.12 ? 1.2 + r() * 3 : 0.35);
  }
}

/** Basit tutamak (mobilya kulpu) */
function handle(g, { x, y, z, w = 9, vertical = false }) {
  const m = mat.metal('steelDark', 0.35);
  const r = 0.5;
  const bar = new THREE.Mesh(new THREE.CapsuleGeometry(cm(r), cm(w), 3, 8), m);
  bar.rotation.z = vertical ? 0 : Math.PI / 2;
  bar.position.set(cm(x), cm(z), cm(y));
  g.add(bar);
  for (const o of [-w / 2, w / 2]) {
    const st = new THREE.Mesh(new THREE.CylinderGeometry(cm(0.45), cm(0.45), cm(2.2), 8), m);
    st.rotation.x = Math.PI / 2;
    st.position.set(cm(x + (vertical ? 0 : o)), cm(z + (vertical ? o : 0)), cm(y - 1.1));
    g.add(st);
  }
}

/* ================================================================= MASA */
export function desk(it) {
  const g = group(`${it.id} ${it.name}`, { layer: 'furniture', label: `${it.tag} ${it.w}x${it.d}x${it.h}`, item: it });
  const { w, d, h } = it;
  const tt = it.topThickness ?? 2.5;

  // tabla (on kenari yuvarlatilmis)
  g.add(roundedBox(w, d, tt, 1.2, mat.wood('beech', w, d, 0.55), { x: 0, y: 0, z: h - tt, name: 'masa-tabla' }));

  // tabla alti gizli sasi
  g.add(box(w - 24, 8, 4, mat.metal('steelLight', 0.45), { x: 12, y: d / 2 - 4, z: h - tt - 5, name: 'sasi' }));

  // T-ayaklar
  for (const ex of [7, w - 7 - 7]) {
    g.add(box(6, d - 28, h - tt - 6, mat.metal('steelDark', 0.5), { x: ex, y: 14, z: 4.5, name: 'ayak-dikme' }));
    g.add(box(11, d - 6, 4.5, mat.metal('steelLight', 0.42), { x: ex - 2, y: 3, z: 0, name: 'ayak-taban' }));
    // siyah plastik ayak kapaklari
    for (const ey of [3, d - 3 - 6]) {
      g.add(box(13, 6, 5, mat.plastic('#222429', 0.65), { x: ex - 3, y: ey, z: 0, name: 'ayak-kapak' }));
    }
  }
  // kablo kanali
  g.add(box(w - 40, 5, 6, mat.metal('steelDark', 0.6), { x: 20, y: d - 9, z: h - tt - 10, name: 'kablo-kanali' }));
  return g;
}

/* =============================================================== DOLAP */
export function wardrobe(it) {
  const g = group(`${it.id} ${it.name}`, { layer: 'furniture', label: `${it.tag} ${it.w}x${it.d}x${it.h}`, item: it });
  const { w, d, h } = it;
  const pl = it.plinth ?? 4, cw = 1.8;
  const body = mat.wood('beech', w, h, 0.5);

  g.add(box(w - 6, d - 6, pl, mat.plastic('#2a2c30', 0.7), { x: 3, y: 3, z: 0, name: 'kaide' }));
  // govde: yanlar, ust, alt, arka
  g.add(box(cw, d, h - pl, body, { x: 0, y: 0, z: pl, name: 'yan-sol' }));
  g.add(box(cw, d, h - pl, body, { x: w - cw, y: 0, z: pl, name: 'yan-sag' }));
  g.add(box(w, d, cw, body, { x: 0, y: 0, z: h - cw, name: 'ust' }));
  g.add(box(w - 2 * cw, d, cw, body, { x: cw, y: 0, z: pl, name: 'alt' }));
  g.add(box(w - 2 * cw, 0.6, h - pl - cw, mat.wood('beechDark', w, h, 0.3), { x: cw, y: 0.2, z: pl, name: 'arka' }));

  // kanatlar (on yuz = +Y)
  const n = it.doors ?? 2;
  const dw = (w - 2 * cw - (n - 1) * 0.4) / n;
  for (let i = 0; i < n; i++) {
    const x = cw + i * (dw + 0.4);
    g.add(box(dw, cw, h - pl - cw * 2, mat.wood('beech', dw, h, 0.5), { x, y: d - cw, z: pl + cw, name: `kanat-${i + 1}` }));
  }
  // kilit + iki kucuk siyah dugme (foto 01/03)
  const midX = w / 2;
  g.add(box(3.4, 1.4, 3.4, mat.metal('steelDark', 0.4), { x: midX - 4.6, y: d, z: h * 0.52, name: 'kilit' }));
  g.add(box(3.4, 1.4, 3.4, mat.metal('steelDark', 0.4), { x: midX + 1.2, y: d, z: h * 0.52, name: 'dugme' }));
  g.add(box(2.2, 1.2, 2.2, mat.metal('steelDark', 0.4), { x: midX - 1.1, y: d, z: h * 0.52 + 4.6, name: 'dugme2' }));
  return g;
}

/* ============================================================ KITAPLIK */
export function bookcase(it) {
  const g = group(`${it.id} ${it.name}`, { layer: 'furniture', label: `${it.tag} ${it.w}x${it.d}x${it.h}`, item: it });
  const { w, d, h } = it;
  const cw = 1.8, pl = 4, n = it.shelves ?? 5;
  const body = mat.wood('beech', w, h, 0.5);

  g.add(box(w - 6, d - 6, pl, mat.plastic('#2a2c30', 0.7), { x: 3, y: 3, z: 0 }));
  g.add(box(cw, d, h - pl, body, { x: 0, y: 0, z: pl, name: 'yan-sol' }));
  g.add(box(cw, d, h - pl, body, { x: w - cw, y: 0, z: pl, name: 'yan-sag' }));
  g.add(box(w, d, cw, body, { x: 0, y: 0, z: h - cw, name: 'ust' }));
  g.add(box(w - 2 * cw, 0.8, h - pl, mat.wood('beechDark', w, h, 0.3), { x: cw, y: 0.2, z: pl, name: 'arka' }));

  const inner = h - pl - cw;
  const bay = inner / (n + 1);
  for (let i = 0; i <= n; i++) {
    const z = pl + bay * i;
    g.add(box(w - 2 * cw, d - 1.2, cw, body, { x: cw, y: 1.0, z, name: `raf-${i}` }));
    books(g, { x: cw + 1, y: 3, z: z + cw, len: w - 2 * cw - 2, depth: d - 6, height: bay - cw - 2, seedN: i + 3 });
  }
  return g;
}

/* ======================================================= CALISMA KOLTUGU */
export function officeChair(it) {
  const g = group(`${it.id} ${it.name}`, { layer: 'furniture', label: `${it.tag} - yonetici koltugu`, item: it });
  const { w, d } = it;
  const cx = w / 2, cy = d / 2;
  const lth = mat.leather(), chr = mat.chrome(), blk = mat.plastic('#1e2024', 0.55);

  // 5 kollu krom yildiz ayak + tekerler
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 + 0.4;
    const arm = new THREE.Mesh(new THREE.BoxGeometry(cm(30), cm(2.6), cm(4.2)), chr);
    arm.position.set(cm(cx + Math.cos(a) * 15), cm(5.5), cm(cy + Math.sin(a) * 15));
    arm.rotation.y = -a;
    arm.castShadow = true;
    g.add(arm);
    const cs = new THREE.Mesh(new THREE.CylinderGeometry(cm(2.6), cm(2.6), cm(2.2), 14), blk);
    cs.rotation.z = Math.PI / 2;
    cs.position.set(cm(cx + Math.cos(a) * 28), cm(2.6), cm(cy + Math.sin(a) * 28));
    cs.rotation.y = -a;
    g.add(cs);
  }
  g.add(cyl(3.2, 3.2, 6, chr, { x: cx, y: cy, z: 8 }));
  g.add(cyl(2.4, 2.4, 22, chr, { x: cx, y: cy, z: 19 }));     // gaz pistonu
  g.add(box(20, 26, 5, blk, { x: cx - 10, y: cy - 13, z: 30, name: 'mekanizma' }));

  // oturak
  g.add(roundedBox(50, 48, 9, 5, lth, { x: cx - 25, y: cy - 24, z: 35, name: 'oturak' }));
  g.add(roundedBox(46, 44, 3, 4, blk, { x: cx - 23, y: cy - 22, z: 33.5 }));

  // sirtlik (hafif geriye yatik) - yuksek sirt + bas destegi
  const back = group('sirtlik');
  back.add(roundedBox(46, 8, 56, 5, lth, { x: -23, y: -4, z: 0, name: 'sirt-minder' }));
  back.add(roundedBox(44, 4, 15, 5, lth, { x: -22, y: -2, z: 54, name: 'bas-destegi' }));
  back.add(roundedBox(42, 3, 52, 4, blk, { x: -21, y: 3.4, z: 2 }));
  back.position.set(cm(cx), cm(41), cm(cy - 20));
  back.rotation.x = 0.16;
  back.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  g.add(back);

  // kolcaklar
  for (const s of [-1, 1]) {
    g.add(box(4, 22, 20, blk, { x: cx + s * 26 - 2, y: cy - 12, z: 38, name: 'kolcak-dikme' }));
    g.add(roundedBox(7, 26, 3.5, 1.6, lth, { x: cx + s * 26 - 3.5, y: cy - 15, z: 58, name: 'kolcak-ust' }));
  }
  return g;
}

/* ======================================================= MISAFIR SANDALYESI */
/** Klasik ISO/istiflenebilir sandalye: siyah boru iskelet + kumas minderler */
export function stackChair(it) {
  const g = group(`${it.id} ${it.name}`, { layer: 'furniture', label: `${it.tag} - istiflenebilir`, item: it });
  const { w, d } = it;
  const tube = mat.metal('steelDark', 0.4), fab = mat.fabric();
  const seatZ = 45, backTop = 82, legR = 1.15;
  const xL = 3.5, xR = w - 3.5;          // yan cerceve eksenleri
  const yF = 5, yB = d - 5;              // on / arka ayak eksenleri

  for (const x of [xL, xR]) {
    // on ayak (dik)
    g.add(cyl(legR, legR, seatZ, tube, { x, y: yF, z: seatZ / 2 }));
    // arka ayak, sirtlik dikmesi olarak devam eder
    g.add(cyl(legR, legR, backTop, tube, { x, y: yB, z: backTop / 2 }));
    // yan kayit (oturak altinda, on-arka baglanti)
    const rail = new THREE.Mesh(new THREE.CylinderGeometry(cm(legR), cm(legR), cm(yB - yF), 10), tube);
    rail.rotation.x = Math.PI / 2;
    rail.position.set(cm(x), cm(seatZ - 4), cm((yF + yB) / 2));
    rail.castShadow = true;
    g.add(rail);
    // ayak kapaklari
    for (const y of [yF, yB]) g.add(cyl(1.5, 1.5, 1.5, mat.plastic('#15171a', 0.7), { x, y, z: 0.75 }));
  }
  // on/arka yatay kayitlar (alt ve oturak alti)
  for (const [y, z] of [[yF, 14], [yB, 14], [yF, seatZ - 4], [yB, seatZ - 4]]) {
    const r = new THREE.Mesh(new THREE.CylinderGeometry(cm(legR), cm(legR), cm(xR - xL), 10), tube);
    r.rotation.z = Math.PI / 2;
    r.position.set(cm((xL + xR) / 2), cm(z), cm(y));
    r.castShadow = true;
    g.add(r);
  }
  // oturak minderi
  g.add(roundedBox(w - 3, d - 12, 5.5, 2.2, fab, { x: 1.5, y: 6, z: seatZ, name: 'oturak' }));
  g.add(box(w - 8, d - 18, 1.4, mat.plastic('#1a1c1f', 0.7), { x: 4, y: 9, z: seatZ - 1.4 }));

  // sirtlik minderi - arka dikmelere sabit, hafif geriye yatik
  const back = group('sirtlik');
  back.add(roundedBox(w - 6, 5.5, 27, 2.2, fab, { x: -(w - 6) / 2, y: -2.75, z: -13.5, name: 'sirt-minder' }));
  back.position.set(cm(w / 2), cm(backTop - 15), cm(yB - 1.5));
  back.rotation.x = -0.12;
  back.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  g.add(back);
  return g;
}

/* ============================================================= KREDENZA */
export function credenza(it) {
  const g = group(`${it.id} ${it.name}`, { layer: 'furniture', label: `${it.tag} ${it.w}x${it.d}x${it.h}`, item: it });
  const { w, d, h } = it;
  const cw = 1.8, pl = 5;
  const body = mat.wood('beech', w, h, 0.5);
  g.add(box(w - 6, d - 6, pl, mat.plastic('#2a2c30', 0.7), { x: 3, y: 3, z: 0 }));
  g.add(box(w, d, cw, mat.wood('beechDark', w, d, 0.4), { x: 0, y: 0, z: h - cw, name: 'ust-tabla' }));
  g.add(box(cw, d, h - pl - cw, body, { x: 0, y: 0, z: pl }));
  g.add(box(cw, d, h - pl - cw, body, { x: w - cw, y: 0, z: pl }));
  g.add(box(w, 0.8, h - pl - cw, body, { x: 0, y: 0.2, z: pl }));
  // Foto 05: bir bolumu kapakli, bir bolumu ACIK RAF (dosya/dergi duruyor)
  const n = Math.max(2, Math.round(w / 65));
  const dw = (w - 2 * cw - (n - 1) * 0.4) / n;
  for (let i = 0; i < n; i++) {
    const x = cw + i * (dw + 0.4);
    if (i % 2 === 0) {
      g.add(box(dw, cw, h - pl - cw * 2, mat.wood('beech', dw, h, 0.5), { x, y: d - cw, z: pl + cw, name: `kanat-${i + 1}` }));
      handle(g, { x: x + dw - 8, y: d + 0.6, z: h - 18, w: 9 });
    } else {
      // acik raf + icinde dosyalar
      const mid = pl + (h - pl - cw) / 2;
      g.add(box(dw, d - 2, cw, mat.wood('beech', dw, d, 0.5), { x, y: 1, z: mid, name: `raf-${i + 1}` }));
      books(g, { x: x + 1, y: 4, z: mid + cw, len: dw - 2, depth: d - 10, height: h - mid - cw - 4, seedN: 40 + i });
      books(g, { x: x + 1, y: 4, z: pl + cw, len: dw - 2, depth: d - 10, height: mid - pl - cw - 3, seedN: 60 + i });
    }
  }
  return g;
}

/* ================================================== GORUSME SEHPASI */
/** Kucuk yuvarlak sehpa: iki sandalye arasinda, gorusmeyi resmiyetten cikarir */
export function roundTable(it) {
  const g = group(`${it.id} ${it.name}`, { layer: 'furniture', label: `${it.tag} Ø${it.w}`, item: it });
  const r = it.w / 2, h = it.h;
  const top = mat.wood('beech', it.w, it.w, 0.5);
  const met = mat.metal('steelDark', 0.4);
  // tabla (kenari pahli)
  g.add(cyl(r, r, 3, top, { x: r, y: r, z: h - 1.5, seg: 40 }));
  g.add(cyl(r - 0.8, r - 0.8, 1.4, top, { x: r, y: r, z: h - 3.6, seg: 40 }));
  // merkez ayak + taban
  g.add(cyl(3.2, 3.2, h - 4, met, { x: r, y: r, z: (h - 4) / 2 + 1.5, seg: 18 }));
  g.add(cyl(r * 0.62, r * 0.62, 2.2, met, { x: r, y: r, z: 1.1, seg: 30 }));
  g.add(cyl(r * 0.20, r * 0.20, 2, met, { x: r, y: r, z: h - 5, seg: 16 }));
  return g;
}

/* =========================================================== PORTMANTO */
export function coatStand(it) {
  const g = group(`${it.id} ${it.name}`, { layer: 'furniture', label: `${it.tag} - ayakli askilik`, item: it });
  const { w, d, h } = it;
  const cx = w / 2, cy = d / 2;
  const m = mat.metal('steelDark', 0.35);
  // 3 ayak
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2;
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(cm(0.9), cm(0.9), cm(20), 10), m);
    leg.position.set(cm(cx + Math.cos(a) * 8), cm(3.2), cm(cy + Math.sin(a) * 8));
    leg.rotation.z = Math.cos(a) * 0.55;
    leg.rotation.x = -Math.sin(a) * 0.55;
    g.add(leg);
    g.add(cyl(1.4, 1.4, 1.4, mat.plastic('#15171a', 0.7), { x: cx + Math.cos(a) * 15, y: cy + Math.sin(a) * 15, z: 0.7 }));
  }
  g.add(cyl(1.6, 2.4, h - 12, m, { x: cx, y: cy, z: (h - 12) / 2 + 2 }));
  // ust askilar
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + 0.6;
    const peg = new THREE.Mesh(new THREE.CylinderGeometry(cm(0.8), cm(0.8), cm(16), 8), m);
    peg.position.set(cm(cx + Math.cos(a) * 5.5), cm(h - 9), cm(cy + Math.sin(a) * 5.5));
    peg.rotation.z = -Math.cos(a) * 0.8;
    peg.rotation.x = Math.sin(a) * 0.8;
    g.add(peg);
    g.add(sphere(1.3, m, { x: cx + Math.cos(a) * 12, y: cy + Math.sin(a) * 12, z: h - 3 }));
  }
  // orta seviye askilar
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2;
    const peg = new THREE.Mesh(new THREE.CylinderGeometry(cm(0.7), cm(0.7), cm(11), 8), m);
    peg.position.set(cm(cx + Math.cos(a) * 4), cm(h - 42), cm(cy + Math.sin(a) * 4));
    peg.rotation.z = -Math.cos(a) * 0.9;
    peg.rotation.x = Math.sin(a) * 0.9;
    g.add(peg);
  }
  g.add(cyl(2.6, 2.6, 3, m, { x: cx, y: cy, z: h - 1.5 }));
  return g;
}

/* ========================================================== COP KOVASI */
export function bin(it) {
  const g = group(`${it.id} ${it.name}`, { layer: 'furniture', label: `${it.tag}`, item: it });
  const { w, h } = it;
  const r = w / 2;
  const body = mat.plastic(palette.plasticGrey.hex, 0.5);
  g.add(cyl(r, r * 0.82, h - 4, body, { x: r, y: r, z: (h - 4) / 2, seg: 28 }));
  g.add(cyl(r + 0.8, r + 0.8, 3, mat.plastic('#9ea2a6', 0.45), { x: r, y: r, z: h - 2.5, seg: 28 }));
  g.add(cyl(r * 0.78, r * 0.78, 1.6, mat.plastic('#3a3d40', 0.6), { x: r, y: r, z: h - 4.4, seg: 24 }));
  // etiket
  const lab = new THREE.Mesh(new THREE.PlaneGeometry(cm(14), cm(9)), mat.plain('#3f6ea8', 0.7));
  lab.position.set(cm(r), cm(h * 0.42), cm(r + r * 0.94));
  g.add(lab);
  return g;
}

/* ================================================ ANKASTRE UST DOLAPLAR */
/** Sag duvar boyunca, tavana yakin dolap bankosu (foto 01/02) */
export function buildWallUnits() {
  const u = wallUnits;
  const g = group(`${u.id} ${u.name}`, { layer: 'wallUnits', label: `${u.name} (kot ${u.zBottom}-${u.zTop})` });
  const h = u.zTop - u.zBottom;
  const len = u.yEnd - u.yStart;
  const x0 = room.width - u.depth;
  const cw = 1.8;

  // govde (alt ve ust yatay tabla)
  g.add(box(u.depth, len, cw, mat.plain('#d8d4cb', 0.75), { x: x0, y: u.yStart, z: u.zBottom, name: 'banko-alt' }));
  g.add(box(u.depth, len, cw, mat.plain('#d8d4cb', 0.75), { x: x0, y: u.yStart, z: u.zTop - cw, name: 'banko-ust' }));
  // tavan ile arasindaki ince golge boslugu (foto 02de koyu serit olarak gorunur)
  if (room.height > u.zTop) {
    g.add(box(u.depth - 4, len, room.height - u.zTop, mat.plain('#6b665e', 0.92),
      { x: x0 + 4, y: u.yStart, z: u.zTop, name: 'ust-golge-boslugu' }));
  }

  const n = Math.max(1, Math.round(len / u.moduleWidth));
  const mw = len / n;
  // u.doors[r][i] : r=0 alt sira, i=0 on duvara en yakin modul
  const rows = u.doors.length;
  for (let i = 0; i < n; i++) {
    const y = u.yStart + i * mw;
    // dikey ayirici
    g.add(box(u.depth, cw, h - cw * 2, mat.plain('#cfcbc2', 0.8), { x: x0, y, z: u.zBottom + cw, name: `ayirici-${i}` }));
    const rh = (h - cw * 2 - (rows - 1) * u.gap) / rows;
    for (let r = 0; r < rows; r++) {
      const row = u.doors[r];
      const cName = row[i % row.length];
      const z = u.zBottom + cw + r * (rh + u.gap);
      const dw = mw - cw - u.gap;            // kapak genisligi (plan Y boyunca)
      const face = u.mural
        ? mat.plain('#e7e0d2', 0.8)          // duvar kagidi ayri bir yuzey olarak gelir
        : mat.paint(cName, mw, rh, 0.45);
      g.add(box(cw, dw, rh, face,
        { x: x0 - cw, y: y + cw, z, name: `kapak-${i}-${r}-${u.mural ? 'kagit' : cName}` }));
      if (u.mural) {
        /**
         * Duvar kagidi kapagin ONUNE ince bir yuzey olarak konur. Kutunun
         * yuzune kaplamak da mumkun ama BoxGeometry'nin -X yuzundeki UV yonu
         * ters; ayri bir duzlemde eslestirme birebir kontrol edilebiliyor.
         * Dilim: dokunun sol-alt kosesi dolap yuzeyinin on-alt kosesidir.
         */
        g.add(plane(dw, rh, mat.mural(
          (y + cw - u.yStart) / len, (z - u.zBottom) / h, dw / len, rh / h,
        ), {
          x: x0 - cw - 0.25,
          y: y + cw + dw / 2,
          z: z + rh / 2,
          rotY: -Math.PI / 2,
          name: `kagit-${i}-${r}`,
        }));
      }
      // parmak kanali (kulp yok, foto'da kulp gorunmuyor)
      g.add(box(0.9, dw - 6, 1.2, mat.plain('#8f8b83', 0.8), { x: x0 - cw - 1.15, y: y + cw + 3, z: z + (r === 0 ? rh - 2.4 : 1.2) }));
    }
  }
  return g;
}

export const builders = { desk, wardrobe, bookcase, officeChair, stackChair, credenza, coatStand, bin, roundTable };
