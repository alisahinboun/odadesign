/**
 * PENCERE, RADYATOR ve DIS BAGLAM
 *
 * Pencereli duvar tek bir kutu olarak kurulamaz; bosluk cevresinde dort parcaya
 * ayrilir (alt kusak, ust kusak, iki yan dolgu). buildWallWithWindows() bunu
 * yapar ve pencere takimini (kasa, kayitlar, cam, denizlik, pervaz, perde)
 * ayni gruba ekler.
 */
import * as THREE from 'three';
import { room, windows, radiators, context, palette } from '../config/room.js';
import { mat } from '../lib/materials.js';
import { box, cyl, group, cm } from '../lib/geom.js';
import { facadeTexture } from '../lib/textures.js';

/** Duvar yuzeyi -> dunya donusumu. u ekseni wallFrame() ile ayni tanimda. */
function wallAxes(side) {
  const { width: W, depth: D, wallThickness: T } = room;
  switch (side) {
    // origin: duvarin u=0 kosesi, ic yuzeyde. ux: u yonu, n: odaya bakan normal
    case 'back':  return { len: W, ux: [1, 0], n: [0, -1], base: [0, D], thick: T };
    case 'front': return { len: W, ux: [1, 0], n: [0, 1],  base: [0, 0], thick: room.partitionThickness };
    case 'left':  return { len: D, ux: [0, 1], n: [1, 0],  base: [0, 0], thick: T };
    case 'right': return { len: D, ux: [0, 1], n: [-1, 0], base: [W, 0], thick: T };
    default:      return { len: W, ux: [1, 0], n: [0, -1], base: [0, D], thick: T };
  }
}

/** (u, odaya-dogru ofset) -> plan [x, y]. out>0 = odanin icine dogru. */
function toXY(ax, u, out = 0) {
  return [
    ax.base[0] + ax.ux[0] * u + ax.n[0] * out,
    ax.base[1] + ax.ux[1] * u + ax.n[1] * out,
  ];
}

/**
 * Duvar yuzeyine yerlesen kutu.
 *   u,w : duvar boyunca konum ve genislik
 *   t   : kalinlik
 *   off : ic yuzeyden ODAYA dogru olcum (cm). off=0 -> kutu tam ic yuzeyde
 *         baslar ve odaya dogru t kadar cikar. Negatif deger duvarin ICINE girer,
 *         yani off = -t kutuyu tamamen duvar govdesine gomer.
 * Bu isaret kurali onemli: radyator/perde odaya CIKMALI, duvar govdesi ve kasa
 * ise duvarin icinde KALMALI.
 */
function wallBox(ax, u, w, t, h, z, m, name, off = 0) {
  const horiz = ax.ux[0] !== 0;
  const [x, y] = toXY(ax, u, 0);
  // n odaya bakan normal. Kutunun plan baslangici, normal yonune gore kayar.
  if (horiz) {
    // duvar y ekseninde kalin; n[1] = -1 (arka duvar) veya +1 (on duvar)
    const y0 = ax.n[1] < 0 ? y - off - t : y + off;
    return box(w, t, h, m, { x, y: y0, z, name });
  }
  const x0 = ax.n[0] < 0 ? x - off - t : x + off;
  return box(t, w, h, m, { x: x0, y, z, name });
}

/* ------------------------------------------------------- PENCERE TAKIMI */
function buildWindow(w, ax) {
  const g = group(`${w.id} ${w.name}`, { layer: 'windows', label: `${w.id} ${w.width}x${w.height} · denizlik +${w.sill}`, item: w });
  const horiz = ax.ux[0] !== 0;
  const T = ax.thick;
  const fw = w.frameWidth, fd = w.frameDepth;
  const inner = { u0: w.u + fw, u1: w.u + w.width - fw, z0: w.sill + fw, z1: w.sill + w.height - fw };

  const alu = mat.alu();
  const dark = mat.plastic('#26282b', 0.42);          // acilir kanadin koyu cercevesi (foto 05)
  const revealMat = mat.paint('offwhite', 60, 60, 0.5);

  // --- pervaz / duvar kalinligindaki dograma boslugu
  const rv = Math.min(w.reveal, T);
  // Kasa, pervaz ve cam duvarin ICINDE; denizlik ve perde odaya CIKAR.
  const put = (u, wd, t, h, z, m, name, off = -t) => g.add(wallBox(ax, u, wd, t, h, z, m, name, off));
  put(w.u, w.width, T, 3, w.sill + w.height, revealMat, `${w.id}-lento-alti`);
  put(w.u, 3, T, w.height, w.sill, revealMat, `${w.id}-yan-pervaz-sol`);
  put(w.u + w.width - 3, 3, T, w.height, w.sill, revealMat, `${w.id}-yan-pervaz-sag`);
  const fOff = -(T - rv) - fd;   // dograma duvarin dis yarisinda oturur

  // --- kasa
  put(w.u, w.width, fd, fw, w.sill, alu, `${w.id}-kasa-alt`, fOff);
  put(w.u, w.width, fd, fw, w.sill + w.height - fw, alu, `${w.id}-kasa-ust`, fOff);
  put(w.u, fw, fd, w.height, w.sill, alu, `${w.id}-kasa-sol`, fOff);
  put(w.u + w.width - fw, fw, fd, w.height, w.sill, alu, `${w.id}-kasa-sag`, fOff);

  // --- bolumler: dusey kayitlar + cam + acilir kanat
  let u = inner.u0;
  const glassH = inner.z1 - inner.z0;
  w.divisions.forEach((d, i) => {
    const dw = d.width - (i === 0 ? 0 : 0);
    const isSash = d.kind === 'sash';
    const gw = dw - (i === w.divisions.length - 1 ? 0 : fw);
    if (isSash) {
      // acilir kanat: koyu profil cercevesi + ici cam
      const kf = 5.5;
      const sOff = fOff + 0.6;
      put(u, dw, fd + 1.2, kf, inner.z0, dark, `${w.id}-kanat-alt`, sOff);
      put(u, dw, fd + 1.2, kf, inner.z1 - kf, dark, `${w.id}-kanat-ust`, sOff);
      put(u, kf, fd + 1.2, glassH, inner.z0, dark, `${w.id}-kanat-sol`, sOff);
      put(u + dw - kf, kf, fd + 1.2, glassH, inner.z0, dark, `${w.id}-kanat-sag`, sOff);
      // ispanyolet kolu
      const [hx, hy] = toXY(ax, u + dw - kf / 2, -(T - rv) + 2);
      const handle = new THREE.Mesh(new THREE.CapsuleGeometry(cm(0.9), cm(9), 4, 10), mat.metal('steelLight', 0.3));
      handle.position.set(cm(hx), cm(w.sill + w.height / 2 - 6), cm(hy));
      handle.rotation.x = horiz ? 0 : Math.PI / 2;
      g.add(handle);
      const glass = wallBox(ax, u + kf, dw - kf * 2, 0.8, glassH - kf * 2, inner.z0 + kf,
        mat.windowGlass(dw, glassH), `${w.id}-cam-kanat`, fOff - 2.6);
      glass.castShadow = false;
      g.add(glass);
    } else {
      const glass = wallBox(ax, u, gw, 0.8, glassH, inner.z0, mat.windowGlass(gw, glassH), `${w.id}-cam-${i + 1}`, fOff - 2.6);
      glass.castShadow = false;
      g.add(glass);
      if (i < w.divisions.length - 1) put(u + gw, fw, fd, glassH, inner.z0, alu, `${w.id}-dusey-kayit-${i + 1}`, fOff);
    }
    u += d.width;
  });

  // --- ic denizlik
  const sb = w.sillBoard;
  put(w.u - 4, w.width + 8, sb.depth, sb.thickness, w.sill - sb.thickness,
    mat.paint('offwhite', w.width, sb.depth, 0.6), `${w.id}-denizlik`,
    -(T - rv) + sb.overhang);

  // --- tul perde: pilili, degisken derinlikte kivrimlar + agirlik bandi
  if (w.curtain) {
    const c = w.curtain;
    const cz = w.sill + w.height - c.headroom - c.drop;
    const span = c.to - c.from;
    const n = Math.max(8, Math.round(span / 7));
    const step = span / n;
    for (let i = 0; i < n; i++) {
      const cu = w.u + c.from + i * step;
      // kivrim derinligi: sinus + hafif rastgelelik, duz panel gorunumunu kirar
      const depth = 3.4 + Math.sin(i * 2.1) * 2.2 + Math.sin(i * 0.7) * 1.1;
      const wdt = step * (0.86 + (i % 3) * 0.05);
      const fold = wallBox(ax, cu, wdt, 1.6, c.drop - c.hem, cz + c.hem, mat.curtain(),
        `${w.id}-perde-${i}`, depth);
      fold.castShadow = false;
      g.add(fold);
      // alt agirlik bandi (fotoda koyu yatay serit)
      const hem = wallBox(ax, cu, wdt, 1.9, c.hem, cz, mat.plain('#cfc7b6', 0.9),
        `${w.id}-perde-etek-${i}`, depth - 0.2);
      hem.castShadow = false;
      g.add(hem);
    }
    // kornis
    g.add(wallBox(ax, w.u + c.from - 4, span + 8, 2.2, 2.2, w.sill + w.height - 3,
      mat.metal('steelLight', 0.45), `${w.id}-kornis`, 5));
  }
  return g;
}

/* --------------------------------------------------------- RADYATOR */
function buildRadiator(r, ax) {
  const g = group(`${r.id} ${r.name}`, { layer: 'radiator', label: `${r.id} ${r.width}x${r.height} · +${r.floorGap}`, item: r });
  const m = mat.plain(palette.radiator.hex, 0.45);
  const pipe = mat.metal('steelLight', 0.4);
  const secW = r.width / r.sections;
  for (let i = 0; i < r.sections; i++) {
    const u = r.u + i * secW;
    g.add(wallBox(ax, u + secW * 0.12, secW * 0.76, r.depth, r.height, r.floorGap, m, `${r.id}-dilim-${i + 1}`, 4));
  }
  // ust ve alt kolektor
  g.add(wallBox(ax, r.u, r.width, r.depth * 0.55, 3, r.floorGap + r.height - 3, m, `${r.id}-ust-kolektor`, 4));
  g.add(wallBox(ax, r.u, r.width, r.depth * 0.55, 3, r.floorGap, m, `${r.id}-alt-kolektor`, 4));
  // baglanti borulari + vana
  for (const [u, h] of [[r.u - 3, r.floorGap + r.height - 4], [r.u + r.width + 1, r.floorGap + 2]]) {
    const [x, y] = toXY(ax, u, 6);
    const pp = new THREE.Mesh(new THREE.CylinderGeometry(cm(1.1), cm(1.1), cm(h), 12), pipe);
    pp.position.set(cm(x), cm(h / 2), cm(y));
    pp.castShadow = true;
    g.add(pp);
  }
  const [vx, vy] = toXY(ax, r.u - 3, 6);
  g.add(cyl(2.2, 2.2, 4, pipe, { x: vx, y: vy, z: r.floorGap + r.height - 2 }));
  return g;
}

/* -------------------------------- PENCERELI DUVAR (bosluk cevresi dolgu) */
export function buildWallWithWindows(side, colorName, wear = 0.6) {
  const ax = wallAxes(side);
  const layer = { back: 'wallBack', left: 'wallLeft', right: 'wallRight', front: 'partition' }[side];
  const g = group(`Duvar-${side}`, { layer, label: `${side} duvar`, wall: true });
  const wins = windows.filter((w) => w.wall === side);
  const H = room.height + 3;
  const T = ax.thick;
  // Her dolgu parcasi KENDI olcusune gore dokulanir; aksi halde parcalar arasi
  // doku yogunlugu farkli olur ve duvarda gorunmez olmasi gereken ekler cikar.
  const m = (w, h) => mat.paint(colorName, w, h, wear);

  if (!wins.length) {
    g.add(wallBox(ax, 0, ax.len, T, H, 0, m(ax.len, H), `duvar-${side}`, -T));
    return g;
  }
  // u ekseninde bosluklarin disinda kalan dolu parcalar
  const sorted = [...wins].sort((a, b) => a.u - b.u);
  let cursor = 0;
  for (const w of sorted) {
    if (w.u > cursor) g.add(wallBox(ax, cursor, w.u - cursor, T, H, 0, m(w.u - cursor, H), `duvar-${side}-dolu`, -T));
    // alt kusak (denizlik alti) ve ust kusak (lento)
    g.add(wallBox(ax, w.u, w.width, T, w.sill, 0, m(w.width, w.sill), `duvar-${side}-parapet`, -T));
    const top = w.sill + w.height;
    g.add(wallBox(ax, w.u, w.width, T, H - top, top, m(w.width, H - top), `duvar-${side}-lento`, -T));
    cursor = w.u + w.width;
  }
  if (cursor < ax.len) g.add(wallBox(ax, cursor, ax.len - cursor, T, H, 0, m(ax.len - cursor, H), `duvar-${side}-dolu`, -T));

  // pencere takimlari ve o duvardaki radyatorler
  for (const w of sorted) g.add(buildWindow(w, ax));
  for (const r of radiators.filter((x) => x.wall === side)) g.add(buildRadiator(r, ax));
  return g;
}

/* ------------------------------------------------- DIS BAGLAM (manzara) */
/** Pencereden gorunen karsi bina + gokyuzu. Roleve degeri yoktur. */
export function buildContext() {
  const g = group('Dis-Baglam', { layer: 'context', label: 'Pencere manzarasi (röleve dışı)' });
  const d = context.facadeDistance, h = context.facadeHeight;
  const wide = room.width + 1400;

  // gokyuzu / arka fon
  const sky = box(wide + 800, 6, h + 900, mat.plain(context.skyColor, 1.0),
    { x: -(wide + 800 - room.width) / 2, y: room.depth + d + 420, z: -260 });
  sky.castShadow = false; sky.receiveShadow = false;
  g.add(sky);

  // karsi bina cephesi
  const fac = box(wide, 40, h, mat.facade(wide, h),
    { x: -(wide - room.width) / 2, y: room.depth + d, z: -240, name: 'karsi-bina' });
  fac.castShadow = false;
  g.add(fac);
  return g;
}
