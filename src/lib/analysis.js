/**
 * GEOMETRIK DENETIM (tarayici ve Node tarafindan paylasilir)
 * Ayak izleri, cakismalar, kapi supurme acisi ve dolasim kontrolleri.
 * Hem src/main.js (arayuz) hem scripts/check.mjs bu modulu kullanir; boylece
 * arayuzde gorunen deger ile denetim raporu her zaman ayni hesaptan gelir.
 */
import { room, partition, door, furniture } from '../config/room.js';

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
  const rects = furniture.filter((f) => !ignore.includes(f.id)).map(footprint);
  for (let a = 1; a <= 178; a++) {
    const t = (a * Math.PI) / 180;
    for (let s = 8; s <= R; s += 1.5) {
      const px = hx + sign * s * Math.cos(t);
      const py = s * Math.sin(t) * (door.swing === 'in' ? 1 : -1);
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
    doluAlan: furniture.reduce((a, f) => {
      const r = footprint(f);
      return a + ((r.x1 - r.x0) * (r.y1 - r.y0)) / 10000;
    }, 0),
  };
}
