#!/usr/bin/env node
/**
 * OLCU FOYU
 * Yerinde olculecek degerleri, uzerinde numarali plan olan tek sayfada verir.
 * Yanina alip elle doldurulacak sekilde: her satirda bos bir kutu var.
 * Kullanim: npm run foy   ->  docs/drawings/olcu-foyu.svg
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  room, partition, door, furniture, windows, radiators, wallUnits, meta,
} from '../src/config/room.js';
import { footprint, hingeX, leafWidth } from '../src/lib/analysis.js';

const OUT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../docs/drawings');
const SCALE = 1 / 45;
const MM = (c) => c * 10 * SCALE;
const C = { ink: '#14161a', mid: '#5d6570', thin: '#a8aeb6', acc: '#b8860b', box: '#c8ccd2' };
const F = 'font-family="Helvetica,Arial,sans-serif"';
const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const line = (x1, y1, x2, y2, c = C.mid, w = 0.25, e = '') =>
  `<line x1="${x1.toFixed(2)}" y1="${y1.toFixed(2)}" x2="${x2.toFixed(2)}" y2="${y2.toFixed(2)}" stroke="${c}" stroke-width="${w}" ${e}/>`;
const rect = (x, y, w, h, st = C.mid, sw = 0.25, fl = 'none', e = '') =>
  `<rect x="${x.toFixed(2)}" y="${y.toFixed(2)}" width="${w.toFixed(2)}" height="${h.toFixed(2)}" fill="${fl}" stroke="${st}" stroke-width="${sw}" ${e}/>`;
const text = (x, y, t, s = 2.6, a = 'start', c = C.ink, e = '') =>
  `<text x="${x.toFixed(2)}" y="${y.toFixed(2)}" font-size="${s}" fill="${c}" text-anchor="${a}" ${e}>${esc(t)}</text>`;
const circle = (x, y, r, st, sw = 0.3, fl = 'none') =>
  `<circle cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" r="${r.toFixed(2)}" fill="${fl}" stroke="${st}" stroke-width="${sw}"/>`;

/** numarali balon */
const tag = (x, y, n) =>
  circle(x, y, 3.4, C.acc, 0.4, '#fffdf3') + text(x, y + 1.15, String(n), 2.9, 'middle', '#7a5c05', 'font-weight="700"');

/* -------------------------------------------------- olculecekler listesi */
const W = windows[0], R = radiators[0];
const P = partition.panels;
const D1 = furniture.find((f) => f.id === 'D1');
const A1 = furniture.find((f) => f.id === 'A1');

const ITEMS = [
  { n: 1,  grup: 'Pencere', ad: 'Denizlik üst kotu (döşemeden denizliğin üstüne)', kabul: `${W.sill} cm`, kritik: true },
  { n: 2,  grup: 'Pencere', ad: 'Kasa dış yüksekliği (denizlik üstünden kasa üstüne)', kabul: `${W.height} cm` },
  { n: 3,  grup: 'Pencere', ad: 'Kasa dış genişliği', kabul: `${W.width} cm` },
  { n: 4,  grup: 'Pencere', ad: 'Kasanın sol duvara mesafesi', kabul: `${W.u} cm` },
  { n: 5,  grup: 'Kapı duvarı', ad: 'Sol duvar ile kapı kasası arası (sarı panel)', kabul: `${P[0].width} cm` },
  { n: 6,  grup: 'Kapı duvarı', ad: 'Yeşil düşey şerit genişliği', kabul: `${P[2].width} cm` },
  { n: 7,  grup: 'Kapı duvarı', ad: 'Kapı kasası ile sağ duvar arası (sarı panel)', kabul: `${P[3].width} cm` },
  { n: 8,  grup: 'Dolap', ad: 'Dolap hangi duvara dayalı? (sol / ön) + o duvardan mesafesi', kabul: 'sol duvar' },
  { n: 9,  grup: 'Dolap', ad: 'Aynanın sol duvara mesafesi ve genişliği', kabul: '58 cm / 34 cm' },
  { n: 10, grup: 'Tezgâh', ad: 'Sağ duvar tezgâhının uzunluğu × derinliği', kabul: `${A1.w}×${A1.d} cm` },
  { n: 11, grup: 'Tezgâh', ad: 'Tezgâhın ön duvara mesafesi', kabul: `${Math.round(A1.pos[1] - A1.w / 2)} cm` },
  { n: 12, grup: 'Radyatör', ad: 'Radyatör genişliği ve dilim sayısı', kabul: `${R.width} cm / ${R.sections}` },
  { n: 13, grup: 'Radyatör', ad: 'Radyatörün sol duvara mesafesi', kabul: `${R.u} cm` },
  { n: 14, grup: 'Genel', ad: 'Net kat yüksekliği (döşemeden asma tavana)', kabul: `${room.height} cm`, kritik: true },
  { n: 15, grup: 'Genel', ad: 'Ankastre dolap bankosu alt kotu / derinliği', kabul: `${wallUnits.zBottom} cm / ${wallUnits.depth} cm` },
];

/* ------------------------------------------------------------------ plan */
const PW = MM(room.width), PD = MM(room.depth);
const MARGIN = 18;
const PLAN_X = MARGIN + 16, PLAN_Y = MARGIN + 26;
const X = (c) => PLAN_X + MM(c);
const Y = (c) => PLAN_Y + PD - MM(c);
const TW = MM(room.wallThickness);

const g = [];
g.push(rect(X(0), Y(room.depth), PW, PD, 'none', 0, '#f7f7f5'));
for (const [x, y, w, h] of [
  [X(0) - TW, Y(room.depth), TW, PD], [X(room.width), Y(room.depth), TW, PD],
]) g.push(rect(x, y, w, h, C.ink, 0.5, '#e8eaec'));
// arka duvar + pencere
g.push(rect(X(0) - TW, Y(room.depth) - TW, PW + TW * 2, TW, C.ink, 0.5, '#e8eaec'));
g.push(rect(X(W.u), Y(room.depth) - TW, MM(W.width), TW, C.ink, 0.5, '#ffffff'));
g.push(line(X(W.u), Y(room.depth) - TW * 0.5, X(W.u + W.width), Y(room.depth) - TW * 0.5, C.mid, 0.4));
// radyator
g.push(rect(X(R.u), Y(room.depth) - MM(R.depth) - TW + TW, MM(R.width), MM(R.depth), C.mid, 0.35, '#eef1f3'));
// on duvar panelleri + kapi
let cx = 0;
for (const pan of P) {
  if (pan.kind === 'door') {
    const hx = X(hingeX()), Rr = MM(leafWidth());
    g.push(line(hx, Y(0), hx, Y(0) - Rr, C.ink, 0.5));
    g.push(`<path d="M ${(hx + Rr).toFixed(2)} ${Y(0).toFixed(2)} A ${Rr.toFixed(2)} ${Rr.toFixed(2)} 0 0 0 ${hx.toFixed(2)} ${(Y(0) - Rr).toFixed(2)}" fill="none" stroke="${C.thin}" stroke-width="0.22" stroke-dasharray="1.6 1.2"/>`);
  } else {
    g.push(rect(X(cx), Y(0), MM(pan.width), MM(room.partitionThickness), C.ink, 0.5,
      pan.color === 'green' ? '#e3f0dd' : '#fdf6dc'));
  }
  cx += pan.width;
}
// mobilya
for (const it of furniture) {
  const r = footprint(it);
  g.push(rect(X(r.x0), Y(r.y1), MM(r.x1 - r.x0), MM(r.y1 - r.y0), C.thin, 0.3, '#ffffff'));
  g.push(text(X(it.pos[0]), Y(it.pos[1]) + 0.9, it.id, 2.2, 'middle', C.thin));
}
// numaralar
const MARKS = [
  [3, X(W.u + W.width / 2), Y(room.depth) + 7],
  [4, X(W.u / 2), Y(room.depth) + 7],
  [13, X(R.u + R.width / 2), Y(room.depth) - 9],
  [5, X(P[0].width / 2), Y(0) - 8],
  [6, X(P[0].width + P[1].width + P[2].width / 2), Y(0) - 8],
  [7, X(room.width - P[3].width / 2), Y(0) - 8],
  [8, X(D1.pos[0]) - 9, Y(D1.pos[1])],
  [10, X(A1.pos[0]) + 9, Y(A1.pos[1])],
];
for (const [n, x, y] of MARKS) g.push(tag(x, y, n));
g.push(text(X(room.width / 2), Y(0) + 13, 'GİRİŞ', 2.6, 'middle', C.mid));
g.push(text(X(room.width / 2), Y(room.depth) - 15, 'PENCERE DUVARI', 2.6, 'middle', C.mid));
g.push(text(X(0) - TW - 3, Y(room.depth / 2), 'SOL', 2.4, 'middle', C.mid,
  `transform="rotate(-90 ${(X(0) - TW - 3).toFixed(2)} ${Y(room.depth / 2).toFixed(2)})"`));
g.push(text(X(room.width) + TW + 3, Y(room.depth / 2), 'SAĞ', 2.4, 'middle', C.mid,
  `transform="rotate(90 ${(X(room.width) + TW + 3).toFixed(2)} ${Y(room.depth / 2).toFixed(2)})"`));

/* ------------------------------------------------------------- tablo */
const TX = PLAN_X + PW + 26;
const ROW = 8.6;
const tableW = 108;
let ty = PLAN_Y + 4;
const t = [];
t.push(text(TX, ty - 6, 'ÖLÇÜ FÖYÜ', 5.0, 'start', C.ink, 'font-weight="700" letter-spacing="0.4"'));
t.push(text(TX, ty - 0.5, `${meta.project} · ofis odası · ölçüler cm · ${meta.date}`, 2.5, 'start', C.mid));
ty += 6;
t.push(line(TX, ty, TX + tableW, ty, C.ink, 0.4));
ty += 4.6;
t.push(text(TX + 8, ty, 'Ne ölçülecek', 2.4, 'start', C.mid, 'font-weight="700"'));
t.push(text(TX + tableW - 34, ty, 'modeldeki kabul', 2.2, 'start', C.mid));
t.push(text(TX + tableW - 9, ty, 'ölçülen', 2.2, 'middle', C.mid));
ty += 2.4;
t.push(line(TX, ty, TX + tableW, ty, C.mid, 0.22));

let lastGroup = '';
for (const it of ITEMS) {
  if (it.grup !== lastGroup) {
    ty += 5.4;
    t.push(text(TX, ty, it.grup.toUpperCase(), 2.3, 'start', C.acc, 'font-weight="700" letter-spacing="0.3"'));
    lastGroup = it.grup;
    ty += 1.2;
  }
  ty += ROW;
  t.push(tag(TX + 3.4, ty - 1.0, it.n));
  t.push(text(TX + 8.5, ty, it.ad, 2.45, 'start', it.kritik ? C.ink : '#33383f',
    it.kritik ? 'font-weight="700"' : ''));
  t.push(text(TX + tableW - 34, ty, it.kabul, 2.3, 'start', C.mid));
  t.push(rect(TX + tableW - 20, ty - 4.2, 20, 5.8, C.box, 0.35, '#ffffff'));
  if (it.kritik) t.push(text(TX + tableW - 22.5, ty, '★', 2.4, 'end', C.acc));
  t.push(line(TX, ty + 2.2, TX + tableW, ty + 2.2, '#e8eaec', 0.18));
}
ty += 9;
t.push(text(TX, ty, '★ En kritik ikisi: denizlik kotu (1) ve net kat yüksekliği (14).', 2.4, 'start', C.acc));
ty += 4.6;
t.push(text(TX, ty, 'Bu değerler src/config/room.js içinde tek yerde tanımlı. Girildiğinde plan,', 2.3, 'start', C.mid));
ty += 3.8;
t.push(text(TX, ty, 'görünüşler, kesitler, 3B model ve metraj birlikte güncellenir.', 2.3, 'start', C.mid));

const wMM = TX + tableW + MARGIN;
const hMM = Math.max(PLAN_Y + PD + 24, ty + MARGIN);
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${wMM}mm" height="${hMM}mm" viewBox="0 0 ${wMM} ${hMM}" ${F}>
<title>Olcu foyu</title>
<rect width="${wMM}" height="${hMM}" fill="#ffffff"/>
${g.join('\n')}
${t.join('\n')}
</svg>`;

fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, 'olcu-foyu.svg'), svg);
console.log(`  ✓ docs/drawings/olcu-foyu.svg  (${ITEMS.length} ölçü, ${(svg.length / 1024).toFixed(1)} kB)`);
