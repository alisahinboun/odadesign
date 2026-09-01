#!/usr/bin/env node
/**
 * KARSILASTIRMA PAFTASI
 * Iki semanin planini yan yana, altinda olculebilir farklarla birlikte tek
 * sayfada verir. Teknik pafta degil SUNUM paftasidir: kota yerine sema
 * paletinin gercek renkleri, poz balonlari ve fark tablosu.
 *
 * Kullanim:  node scripts/karsilastirma.mjs [solSema] [sagSema]
 *            npm run compare                 (varsayilan s0 vs s2)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  room, partition, door, furniture, palette, wallUnits, meta, applyScheme, isVisible, windows,
} from '../src/config/room.js';
import { palettes, layouts, resolveDesign, getPalette, getLayout } from '../src/config/design.js';
import { footprint, doorSwingLimit, metrics, hingeX, leafWidth } from '../src/lib/analysis.js';

const OUT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../docs/drawings');
/** node scripts/karsilastirma.mjs [solPalet solYerlesim sagPalet sagYerlesim] */
const [lp = 'p1', ll = 'y1', rp = 'p2', rl = 'y2'] = process.argv.slice(2);
for (const id of [lp, rp]) if (!palettes.some((x) => x.id === id)) { console.error(`Bilinmeyen palet: ${id}`); process.exit(2); }
for (const id of [ll, rl]) if (!layouts.some((x) => x.id === id)) { console.error(`Bilinmeyen yerlesim: ${id}`); process.exit(2); }
const SIDE = (pi, li) => ({
  id: `${pi}${li}`,
  code: `${getPalette(pi).code}${getLayout(li).code}`,
  name: `${getPalette(pi).name} + ${getLayout(li).name}`,
  kind: (getPalette(pi).kind === 'mevcut' && getLayout(li).kind === 'mevcut') ? 'roleve' : 'oneri',
  summary: getLayout(li).summary,
  metrajNote: [getPalette(pi).is, getLayout(li).is].filter(Boolean).join(' '),
});

const SCALE = 1 / 40;                 // sunum paftasi 1:40
const MM = (cm) => cm * 10 * SCALE;
const C = {
  cut: '#14161a', view: '#5d6570', thin: '#a2a9b2', dim: '#1b4f7a',
  acc: '#b8860b', pos: '#2e7d4f', hatch: '#ccd1d8', paper: '#ffffff',
};
const F = 'font-family="Helvetica,Arial,sans-serif"';
const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const line = (x1, y1, x2, y2, c = C.view, w = 0.25, e = '') =>
  `<line x1="${x1.toFixed(2)}" y1="${y1.toFixed(2)}" x2="${x2.toFixed(2)}" y2="${y2.toFixed(2)}" stroke="${c}" stroke-width="${w}" ${e}/>`;
const rect = (x, y, w, h, st = C.view, sw = 0.25, fl = 'none', e = '') =>
  `<rect x="${x.toFixed(2)}" y="${y.toFixed(2)}" width="${w.toFixed(2)}" height="${h.toFixed(2)}" fill="${fl}" stroke="${st}" stroke-width="${sw}" ${e}/>`;
const text = (x, y, t, s = 2.6, a = 'middle', c = C.cut, e = '') =>
  `<text x="${x.toFixed(2)}" y="${y.toFixed(2)}" font-size="${s}" fill="${c}" text-anchor="${a}" ${e}>${esc(t)}</text>`;
const circle = (x, y, r, st = C.view, sw = 0.25, fl = 'none') =>
  `<circle cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" r="${r.toFixed(2)}" fill="${fl}" stroke="${st}" stroke-width="${sw}"/>`;

/** Semanin paletinden acilmis dolgu rengi */
function tint(key, mix = 0.62) {
  const hex = (palette[key] || palette.yellow).hex.replace('#', '');
  const n = parseInt(hex, 16);
  const f = (c) => Math.round(c + (255 - c) * mix).toString(16).padStart(2, '0');
  return `#${f((n >> 16) & 255)}${f((n >> 8) & 255)}${f(n & 255)}`;
}

/** Bir semanin durumunu olcer (sema zaten uygulanmis olmali) */
function snapshot(scheme) {
  const M = metrics();
  const sw = doorSwingLimit();
  const desk = furniture.find((f) => f.id === 'M1');
  const behind = Math.round(room.depth - (desk.pos[1] + desk.d / 2));
  const gap = Math.round(Math.hypot(desk.pos[0] - desk.w / 2 - hingeX(), desk.pos[1] - desk.d / 2) - leafWidth());
  return {
    scheme,
    swing: sw.angle, blocker: sw.blocker,
    dolu: M.doluAlan, serbest: M.alan - M.doluAlan,
    behind, gap,
    facesDoor: (desk.rot || 0) === 0 && desk.pos[1] > room.depth * 0.4,
    rects: furniture.filter(isVisible).map((f) => ({ it: { ...f }, r: footprint(f) })),
    sillDepth: windows[0]?.sillBoard?.depth ?? 0,
    curtainCover: windows[0] ? Math.min(100, Math.round(((windows[0].curtain.to - windows[0].curtain.from) / windows[0].width) * 100)) : 0,
    panels: partition.panels.map((p) => ({ ...p, fill: p.kind === 'door' ? null : tint(p.color === 'green' ? 'green' : 'yellow') })),
    wallFill: tint('lilac', 0.55),
  };
}

/** Kucuk sunum plani */
function miniPlan(snap, ox, oy) {
  const W = MM(room.width), D = MM(room.depth), TW = MM(room.wallThickness);
  const X = (cx) => ox + MM(cx);
  const Y = (cy) => oy + D - MM(cy);
  const p = [];

  p.push(rect(X(0), Y(room.depth), W, D, 'none', 0, '#f7f6f3'));
  const wall = (x, y, w, h) => rect(x, y, w, h, C.cut, 0.55, snap.wallFill);
  p.push(wall(X(0) - TW, Y(room.depth), TW, D));
  p.push(wall(X(room.width), Y(room.depth), TW, D));
  p.push(wall(X(0) - TW, Y(room.depth) - TW, W + TW * 2, TW));

  // on boluntu, sema renkleriyle
  let cx = 0;
  const PT = MM(room.partitionThickness);
  for (const pan of snap.panels) {
    if (pan.kind !== 'door') p.push(rect(X(cx), Y(0), MM(pan.width), PT, C.cut, 0.55, pan.fill));
    else {
      p.push(rect(X(cx), Y(0), MM(door.frameFace), PT, C.cut, 0.55, C.hatch));
      p.push(rect(X(cx + pan.width - door.frameFace), Y(0), MM(door.frameFace), PT, C.cut, 0.55, C.hatch));
    }
    cx += pan.width;
  }
  // kapi kanadi + supurme yayi
  const hx = X(hingeX()), R = MM(leafWidth());
  const a = Math.min(snap.swing, 90) * Math.PI / 180;
  const am = snap.swing * Math.PI / 180;
  p.push(`<path d="M ${(hx + R).toFixed(2)} ${Y(0).toFixed(2)} A ${R.toFixed(2)} ${R.toFixed(2)} 0 ${snap.swing > 180 ? 1 : 0} 0 ${(hx + R * Math.cos(am)).toFixed(2)} ${(Y(0) - R * Math.sin(am)).toFixed(2)} L ${hx.toFixed(2)} ${Y(0).toFixed(2)} Z"
    fill="${snap.swing >= 170 ? 'rgba(46,125,79,.10)' : 'rgba(184,134,11,.13)'}" stroke="none"/>`);
  p.push(line(hx, Y(0), hx + R * Math.cos(a), Y(0) - R * Math.sin(a), C.cut, 0.55));
  p.push(line(hx, Y(0), hx + R * Math.cos(am), Y(0) - R * Math.sin(am),
    snap.swing >= 170 ? C.pos : C.acc, 0.35, 'stroke-dasharray="2 1.5"'));
  p.push(text(hx + R * 0.62 * Math.cos(am * 0.55), Y(0) - R * 0.62 * Math.sin(am * 0.55),
    `${snap.swing}°`, 2.6, 'middle', snap.swing >= 170 ? C.pos : C.acc, 'font-weight="700"'));

  // ankastre dolap
  p.push(rect(X(room.width - wallUnits.depth), Y(wallUnits.yEnd), MM(wallUnits.depth),
    MM(wallUnits.yEnd - wallUnits.yStart), C.thin, 0.28, 'none', 'stroke-dasharray="2.4 1.4"'));

  // mobilya + yon isareti
  for (const { it, r } of snap.rects) {
    const rx = X(r.x0), ry = Y(r.y1), rw = MM(r.x1 - r.x0), rh = MM(r.y1 - r.y0);
    p.push(rect(rx, ry, rw, rh, C.view, 0.4, '#ffffff'));
    const rad = -(it.rot || 0) * Math.PI / 180;
    const fx = Math.round(-Math.sin(rad)), fy = Math.round(Math.cos(rad));
    if (fy === 1) p.push(line(rx, ry, rx + rw, ry, C.cut, 0.9));
    if (fy === -1) p.push(line(rx, ry + rh, rx + rw, ry + rh, C.cut, 0.9));
    if (fx === 1) p.push(line(rx + rw, ry, rx + rw, ry + rh, C.cut, 0.9));
    if (fx === -1) p.push(line(rx, ry, rx, ry + rh, C.cut, 0.9));
    p.push(circle(X(it.pos[0]), Y(it.pos[1]), 2.7, C.acc, 0.28, '#fffdf5'));
    p.push(text(X(it.pos[0]), Y(it.pos[1]) + 0.85, it.id, 2.2, 'middle', '#7a5c05', 'font-weight="700"'));
  }
  return { svg: p.join('\n'), w: W, h: D };
}

/* ------------------------------------------------------------------ pafta */
applyScheme(resolveDesign(lp, ll));
const A = snapshot(SIDE(lp, ll));
applyScheme(resolveDesign(rp, rl));
const B = snapshot(SIDE(rp, rl));

const ROWS = 10;
const PW = MM(room.width), PD = MM(room.depth);
const GAP = 26, MARGIN = 22;
const wMM = MARGIN * 2 + PW * 2 + GAP;
const TABLE_TOP = MARGIN + 34 + PD + 20;
const hMM = TABLE_TOP + 34 + ROWS * 7.4;
const oxA = MARGIN, oxB = MARGIN + PW + GAP, oy = MARGIN + 34;

const body = [];
body.push(`<rect width="${wMM}" height="${hMM}" fill="${C.paper}"/>`);
body.push(text(MARGIN, MARGIN + 6, 'TASARIM KARŞILAŞTIRMASI', 5.4, 'start', C.cut, 'font-weight="700" letter-spacing="0.5"'));
body.push(text(MARGIN, MARGIN + 13, `${meta.project} · ofis / idari oda ${room.width}×${room.depth} cm · net ${(room.width * room.depth / 10000).toFixed(2)} m² · ölçek 1:40`, 3.0, 'start', C.view));
body.push(line(MARGIN, MARGIN + 17, wMM - MARGIN, MARGIN + 17, C.cut, 0.5));

for (const [snap, ox] of [[A, oxA], [B, oxB]]) {
  const isOn = snap.scheme.kind !== 'roleve';
  body.push(text(ox, oy - 11, `${snap.scheme.code}  ${snap.scheme.name}`, 4.2, 'start', isOn ? C.acc : C.cut, 'font-weight="700"'));
  body.push(text(ox, oy - 5.5, snap.scheme.summary, 2.5, 'start', C.view));
  body.push(miniPlan(snap, ox, oy).svg);
}

/* fark tablosu */
/**
 * Satirlar. Ucuncu deger: 1 = B daha iyi (yesil ok), 0 = fark yok/notr,
 * -1 = B daha kotu (kirmizi isaret). Yalnizca GERCEKTEN iyilesen satir yesil
 * isaretlenir; "kabul edilebilir ama gerileme" olan satir notr birakilir.
 */
const cmp = (a, b, higherBetter = true) => {
  if (a === b) return 0;
  return (higherBetter ? b > a : b < a) ? 1 : -1;
};
const rows = [
  ['Kapı kanadı azami açıklık',
   `${A.swing}°${A.blocker ? ` (${A.blocker} sınırlıyor)` : ''}`,
   `${B.swing}°${B.blocker ? ` (${B.blocker} sınırlıyor)` : ''}`, cmp(A.swing, B.swing)],
  ['Masa – süpürme yayı payı', `${A.gap} cm`, `${B.gap} cm`, cmp(A.gap, B.gap)],
  ['Kullanıcı girişi görüyor mu', A.facesDoor ? 'evet' : 'hayır', B.facesDoor ? 'evet' : 'hayır',
   cmp(A.facesDoor ? 1 : 0, B.facesDoor ? 1 : 0)],
  ['Masa arkası çalışma boşluğu',
   `${A.behind} cm`, `${B.behind} cm${B.behind >= 100 ? '' : '  ⚠'}`, cmp(A.behind, B.behind)],
  ['Mobilya ayak izi', `${A.dolu.toFixed(2)} m²`, `${B.dolu.toFixed(2)} m²`, cmp(A.dolu, B.dolu, false)],
  ['Serbest dolaşım alanı', `${A.serbest.toFixed(2)} m²`, `${B.serbest.toFixed(2)} m²`, cmp(A.serbest, B.serbest)],
  ['Pencere önü açık mı', 'evet', 'evet', 0],
  ['Tül perde pencereyi kapatma', `%${A.curtainCover}`, `%${B.curtainCover}`, cmp(A.curtainCover, B.curtainCover)],
  ['İç denizlik derinliği', `${A.sillDepth} cm`, `${B.sillDepth} cm${B.sillDepth > A.sillDepth ? ' (raf)' : ''}`, cmp(A.sillDepth, B.sillDepth)],
  ['Yeni mobilya alımı', '—', B.scheme.kind === 'roleve' ? '—' : '1 × 80 cm modül', 0],
];
body.push(text(MARGIN, TABLE_TOP - 5, 'ÖLÇÜLEBİLİR FARK', 3.2, 'start', C.cut, 'font-weight="700" letter-spacing="0.4"'));
const cw = [wMM * 0.34, wMM * 0.26, wMM * 0.26];
const cx0 = MARGIN, cx1 = MARGIN + cw[0], cx2 = MARGIN + cw[0] + cw[1];
body.push(line(MARGIN, TABLE_TOP, wMM - MARGIN, TABLE_TOP, C.cut, 0.4));
body.push(text(cx1, TABLE_TOP + 5, A.scheme.code, 2.8, 'start', C.view, 'font-weight="700"'));
body.push(text(cx2, TABLE_TOP + 5, B.scheme.code, 2.8, 'start', B.scheme.kind === 'roleve' ? C.view : C.acc, 'font-weight="700"'));
body.push(line(MARGIN, TABLE_TOP + 7.5, wMM - MARGIN, TABLE_TOP + 7.5, C.view, 0.25));
rows.forEach((r, i) => {
  const y = TABLE_TOP + 13.5 + i * 7.4;
  body.push(text(cx0, y, r[0], 2.7, 'start', C.view));
  body.push(text(cx1, y, r[1], 2.8, 'start', C.cut));
  const col = r[3] === 1 ? C.pos : r[3] === -1 ? '#a4552f' : C.cut;
  body.push(text(cx2, y, r[2], 2.8, 'start', col, r[3] === 1 ? 'font-weight="700"' : ''));
  if (r[3] === 1) body.push(text(cx2 - 4.5, y, '▲', 2.4, 'start', C.pos));
  if (r[3] === -1) body.push(text(cx2 - 4.5, y, '▼', 2.4, 'start', '#a4552f'));
  body.push(line(MARGIN, y + 2.6, wMM - MARGIN, y + 2.6, '#e6e8ea', 0.2));
});
const yEnd = TABLE_TOP + 13.5 + rows.length * 7.4 + 6;
body.push(text(MARGIN, yEnd - 5.5, '▲ iyileşme     ▼ gerileme (kabul edilebilir sınırlar içinde)     işaretsiz: fark yok',
  2.3, 'start', C.thin));
body.push(text(MARGIN, yEnd, `Kapsam — ${B.scheme.code}: ${B.scheme.metrajNote || '—'}`, 2.5, 'start', C.view));
body.push(text(MARGIN, yEnd + 5, `Ölçüler modelden hesaplanmıştır (src/config/room.js + schemes.js). ${meta.revision} · ${meta.date} · ölçüler cm.`, 2.3, 'start', C.thin));

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${wMM}mm" height="${hMM}mm" viewBox="0 0 ${wMM} ${hMM}" ${F}>
<title>Tasarim karsilastirmasi ${A.scheme.code} / ${B.scheme.code}</title>
${body.join('\n')}
</svg>`;

const name = `karsilastirma-${lp}${ll}-${rp}${rl}.svg`;
fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, name), svg);
console.log(`  ✓ docs/drawings/${name}  (${(svg.length / 1024).toFixed(1)} kB)  —  ${A.scheme.code} vs ${B.scheme.code}`);
