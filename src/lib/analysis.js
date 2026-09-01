/**
 * GEOMETRIK DENETIM (tarayici ve Node tarafindan paylasilir)
 * Ayak izleri, cakismalar, kapi supurme acisi ve dolasim kontrolleri.
 * Hem src/main.js (arayuz) hem scripts/check.mjs bu modulu kullanir; boylece
 * arayuzde gorunen deger ile denetim raporu her zaman ayni hesaptan gelir.
 */
import { room, partition, door, furniture, inRoom } from '../config/room.js';

/** Donme sonrasi eksene paralel cevreleyen dikdortgen (plan) */
export function footprint(it) {
  const r = (((it.rot || 0) % 360) + 360) % 360;
  let bw, bd;
  if (r % 90 === 0) {
    const swap = r === 90 || r === 270;
    bw = swap ? it.d : it.w;
    bd = swap ? it.w : it.d;
  } else {
    const a = (r * Math.PI) / 180;
    bw = Math.abs(it.w * Math.cos(a)) + Math.abs(it.d * Math.sin(a));
    bd = Math.abs(it.w * Math.sin(a)) + Math.abs(it.d * Math.cos(a));
  }
  return {
    id: it.id,
    x0: it.pos[0] - bw / 2, x1: it.pos[0] + bw / 2,
    y0: it.pos[1] - bd / 2, y1: it.pos[1] + bd / 2,
    approx: r % 90 !== 0,
  };
}

export function overlap(a, b) {
  return {
    x: Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0),
    y: Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0),
  };
}

/** Kapi kanadi mentese ekseninin plan x degeri */
export function hingeX() {
  let x = 0;
  for (const p of partition.panels) {
    if (p.kind === 'door') {
      return door.hinge === 'left' ? x + door.frameFace : x + p.width - door.frameFace;
    }
    x += p.width;
  }
  return 0;
}

/** Kanat genisligi = supurme yaricapi */
export const leafWidth = () => door.width - 2 * door.frameFace;

/**
 * Kanat carpmadan kac dereceye kadar aciliyor?
 * @returns {{angle:number, blocker:string|null}}
 */
export function doorSwingLimit(ignore = ['W1'], tol = 2.0) {
  const hx = hingeX();
  const R = leafWidth();
  const sign = door.hinge === 'left' ? 1 : -1;
  const rects = furniture.filter((f) => inRoom(f) && !ignore.includes(f.id)).map(footprint);
  for (let a = 1; a <= 178; a++) {
    const t = (a * Math.PI) / 180;
    for (let s = 8; s <= R; s += 1.5) {
      const px = hx + sign * s * Math.cos(t);
      const py = s * Math.sin(t) * (door.swing === 'in' ? 1 : -1);
      // Kanadin ucu once DUVARA carpabilir: mentese x=hingeX, kanat R uzunlugunda;
      // 180 dereceye giderken uc sol duvari asar. Bu fiziksel sinir mobilyadan
      // once gelebildigi icin ayrica kontrol edilir.
      if (px < 0.5 || px > room.width - 0.5 || py < -0.5 || py > room.depth - 0.5) {
        return { angle: a - 1, blocker: 'duvar' };
      }
      for (const o of rects) {
        if (px >= o.x0 - tol && px <= o.x1 + tol && py >= o.y0 - tol && py <= o.y1 + tol) {
          return { angle: a - 1, blocker: o.id };
        }
      }
    }
  }
  return { angle: 178, blocker: null };
}

/** Mahal metrikleri */
export function metrics() {
  const alan = (room.width * room.depth) / 10000;
  const cevre = (2 * (room.width + room.depth)) / 100;
  return {
    alan,
    hacim: alan * (room.height / 100),
    cevre,
    duvarAlani: cevre * (room.height / 100),
    // net dolasim alani = alan - mobilya ayak izi
    doluAlan: furniture.filter(inRoom).reduce((a, f) => {
      const r = footprint(f);
      return a + ((r.x1 - r.x0) * (r.y1 - r.y0)) / 10000;
    }, 0),
  };
}


/* ------------------------------------------------------------------------ */
/**
 * Bir mobilyanin KULLANICI TARAFI (masada oturulan yon), plan birim vektoru.
 * rot 0 -> +Y, 90 -> -X, 180 -> -Y, 270 -> +X. Bu, geom.place() ile ayni
 * kabuldur: rot 0'da esyanin on yuzu +Y'ye bakar.
 */
export function frontDir(rot) {
  const r = (((rot || 0) % 360) + 360) % 360;
  const a = (r * Math.PI) / 180;
  const v = [-Math.sin(a), Math.cos(a)];
  return v.map((n) => (Math.abs(n) < 1e-9 ? 0 : n));
}

/**
 * Masanin kullanici tarafinda kalan serbest derinlik (cm).
 * Masa dondugunde "masa arkasi" artik arka duvar demek degildir; bu yuzden
 * yon masanin kendi rotasyonundan turetilir ve onundeki ilk engele
 * (duvar veya baska mobilya) olan mesafe olculur. Koltuk ve cop kovasi
 * hesaba katilmaz - onlar zaten o boslugun icinde durur.
 */
export function deskClearance(id = 'M1', ignore = ['S1', 'W1']) {
  const it = furniture.filter(inRoom).find((f) => f.id === id);
  if (!it) return null;
  const r = footprint(it);
  const [dx, dy] = frontDir(it.rot);
  const horiz = Math.abs(dx) > Math.abs(dy);           // yon X ekseninde mi
  const pos = horiz ? dx > 0 : dy > 0;                 // pozitif yone mi bakiyor
  const face = horiz ? (pos ? r.x1 : r.x0) : (pos ? r.y1 : r.y0);
  const wall = horiz ? (pos ? room.width : 0) : (pos ? room.depth : 0);
  /**
   * Sadece KISININ OTURDUGU serit onemlidir. Masanin ucuna denk gelen bir
   * dolap "masa arkasi bosluk" degildir; bu yuzden serit calisma koltugunun
   * (yoksa masanin) ekseninde +-35 cm alinir.
   */
  const chair = furniture.filter(inRoom).find((f) => f.type === 'officeChair');
  const c = chair ? footprint(chair) : r;
  const mid = horiz ? (c.y0 + c.y1) / 2 : (c.x0 + c.x1) / 2;
  const lo = horiz ? r.y0 : r.x0, hi = horiz ? r.y1 : r.x1;
  const span = [Math.max(lo, mid - 35), Math.min(hi, mid + 35)];
  let free = Math.abs(wall - face);
  let by = 'duvar';
  for (const o of furniture.filter(inRoom).map(footprint)) {
    if (o.id === id || ignore.includes(o.id)) continue;
    const os = horiz ? [o.y0, o.y1] : [o.x0, o.x1];
    if (os[1] <= span[0] + 1 || os[0] >= span[1] - 1) continue;
    const d = horiz ? (pos ? o.x0 - face : face - o.x1) : (pos ? o.y0 - face : face - o.y1);
    if (d >= 0 && d < free) { free = d; by = o.id; }
  }
  return { cm: free, by, dir: [dx, dy] };
}

/**
 * Masaya oturan kisi kapiyi gorur mu?
 * Bakis yonu = kullanici tarafinin TERSI (kisi masaya doner).
 * @returns {{deg:number, kind:'onunde'|'yandan'|'arkada'}}
 */
export function doorSight(id = 'M1') {
  const it = furniture.filter(inRoom).find((f) => f.id === id);
  if (!it) return null;
  const [fx, fy] = frontDir(it.rot);
  const view = [-fx, -fy];                                   // kisinin baktigi yon
  const seat = [it.pos[0] + fx * (it.d / 2 + 35), it.pos[1] + fy * (it.d / 2 + 35)];
  const dc = [hingeX() + leafWidth() / 2 - seat[0], 0 - seat[1]];  // kapi ortasi
  const L = Math.hypot(dc[0], dc[1]) || 1;
  const cos = (view[0] * dc[0] + view[1] * dc[1]) / L;
  const deg = Math.round((Math.acos(Math.max(-1, Math.min(1, cos))) * 180) / Math.PI);
  return { deg, kind: deg <= 60 ? 'onunde' : deg <= 100 ? 'yandan' : 'arkada' };
}
