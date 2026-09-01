#!/usr/bin/env node
/**
 * MODEL DENETIMI
 * config/room.js icindeki veriyi geometrik ve ergonomik olarak kontrol eder.
 * Bir olcu degistirdiginizde ilk bunu kosun:  npm run check
 *
 * Kontroller
 *  1. Boluntu panel toplami = oda genisligi
 *  2. Mobilya oda siniri icinde mi
 *  3. Mobilyalar birbiriyle cakisiyor mu (bilinen istisnalar haric)
 *  4. Ekipmanlar tasiyici mobilyanin ustunde mi
 *  5. Kapi kanadinin pratik azami acilma acisi (carpmadan)
 *  6. TS/genel kabul dolasim genislikleri
 */
import {
  room, partition, door, furniture, equipment, clutter, wallItems, wallUnits, ceiling,
} from '../src/config/room.js';
import { footprint as rect, overlap, doorSwingLimit, metrics } from '../src/lib/analysis.js';

let errs = 0, warns = 0;
const bad = (m) => { console.log('  \x1b[31m✗\x1b[0m ' + m); errs++; };
const warn = (m) => { console.log('  \x1b[33m!\x1b[0m ' + m); warns++; };
const ok = (m) => console.log('  \x1b[32m✓\x1b[0m ' + m);
const head = (m) => console.log('\n\x1b[1m' + m + '\x1b[0m');

/* --- 1 --- */
head('1. Boluntu panel dizilimi');
const psum = partition.panels.reduce((a, b) => a + b.width, 0);
psum === room.width
  ? ok(`Panel toplami ${psum} cm = oda genisligi ${room.width} cm`)
  : bad(`Panel toplami ${psum} cm, oda genisligi ${room.width} cm. Fark ${psum - room.width} cm.`);
const dpanel = partition.panels.find((p) => p.kind === 'door');
dpanel
  ? (dpanel.width === door.width
      ? ok(`Kapi paneli ${dpanel.width} cm = door.width`)
      : bad(`Kapi paneli ${dpanel.width} cm, door.width ${door.width} cm - uyusmuyor.`))
  : bad('Boluntude kapi paneli tanimli degil.');
door.height > partition.sillHeight && bad(`Kapi yuksekligi ${door.height} > vasistas alt kotu ${partition.sillHeight}.`);
partition.transomTop > room.height && bad(`Vasistas ust kotu ${partition.transomTop} > net yukseklik ${room.height}.`);

/* --- 2 --- */
head('2. Oda siniri');
const rects = furniture.map(rect);
let outside = 0;
for (const r of rects) {
  if (r.x0 < -0.6 || r.x1 > room.width + 0.6 || r.y0 < -0.6 || r.y1 > room.depth + 0.6) {
    bad(`${r.id} oda sinirini asiyor: x ${r.x0.toFixed(1)}..${r.x1.toFixed(1)}, y ${r.y0.toFixed(1)}..${r.y1.toFixed(1)}`);
    outside++;
  }
}
outside === 0 && ok(`${rects.length} mobilya da oda siniri icinde`);
for (const f of furniture) {
  if (f.h > room.height) bad(`${f.id} yuksekligi ${f.h} > net yukseklik ${room.height}`);
}

/* --- 3 --- */
head('3. Mobilya cakismalari');
// Bilinen ve kasitli ic ice gecmeler (mobilya altina giren elemanlar)
const ALLOWED = new Set(['M1|W1', 'M1|S1']);
let clash = 0;
for (let i = 0; i < rects.length; i++) {
  for (let j = i + 1; j < rects.length; j++) {
    const a = rects[i], b = rects[j];
    const o = overlap(a, b);
    if (o.x > 0.5 && o.y > 0.5) {
      const key = [a.id, b.id].sort().join('|');
      if (ALLOWED.has(key)) { ok(`${a.id} / ${b.id} ic ice (kasitli: altina/onune giriyor)`); continue; }
      bad(`${a.id} ve ${b.id} cakisiyor (${o.x.toFixed(1)} x ${o.y.toFixed(1)} cm)`);
      clash++;
    }
  }
}
clash === 0 && ok('Istenmeyen cakisma yok');

/* --- 4 --- */
head('4. Ekipman tasiyicilari');
let hostBad = 0;
for (const e of [...equipment, ...clutter]) {
  if (!e.onTop) continue;
  const host = furniture.find((f) => f.id === e.onTop);
  if (!host) { bad(`${e.id} tasiyicisi ${e.onTop} bulunamadi`); continue; }
  const h = rect(host), r = rect(e);
  const o = overlap(h, r);
  const area = (r.x1 - r.x0) * (r.y1 - r.y0);
  const inside = Math.max(0, o.x) * Math.max(0, o.y);
  if (inside < area * 0.92) {
    bad(`${e.id} (${e.name}) tasiyici ${host.id} ustunden tasiyor - sadece %${((inside / area) * 100).toFixed(0)} oturuyor`);
    hostBad++;
  }
}
hostBad === 0 && ok('Tum ekipmanlar tasiyicilarinin uzerinde');

/* --- 5 --- */
head('5. Kapi kanadi acilma acisi');
const swing = doorSwingLimit();
if (swing.blocker) {
  warn(`Kanat carpmadan en fazla ~${swing.angle} derece aciliyor; sinirlayan eleman: ${swing.blocker}.`);
  if (door.openAngle > swing.angle) {
    bad(`Gosterim acisi door.openAngle = ${door.openAngle} > pratik azami ${swing.angle}. Kanat mobilyanin icinden geciyor.`);
  } else {
    ok(`Gosterim acisi ${door.openAngle} derece, pratik azaminin (${swing.angle}) altinda.`);
  }
  if (swing.angle < 85) bad(`Kanat 85 dereceden az aciliyor - gecis genisligi yetersiz. Mobilyayi kaydirin.`);
} else ok('Kanat serbest aciliyor (178 dereceye kadar engel yok).');

/* --- 6 --- */
head('6. Dolasim ve ergonomi');
const R2 = (id) => rects.find((r) => r.id === id);
function gapCheck(aId, bId, axis, min, what) {
  const a = R2(aId), b = R2(bId);
  if (!a || !b) return;
  const g = axis === 'x' ? Math.max(b.x0 - a.x1, a.x0 - b.x1) : Math.max(b.y0 - a.y1, a.y0 - b.y1);
  if (g < min) warn(`${what}: ${aId}-${bId} arasi ${g.toFixed(0)} cm (< ${min} cm onerilen)`);
  else ok(`${what}: ${aId}-${bId} arasi ${g.toFixed(0)} cm`);
}
// masa arkasi calisma/gecis bosluğu
const desk = R2('M1');
if (desk) {
  const behind = room.depth - desk.y1;
  behind < 100
    ? warn(`Masa arkasi calisma bosluğu ${behind.toFixed(0)} cm (koltuk + gecis icin en az 100-110 cm onerilir)`)
    : ok(`Masa arkasi calisma bosluğu ${behind.toFixed(0)} cm`);
}
gapCheck('D1', 'S2', 'y', 0, 'Sol duvar sirasi');
gapCheck('S2', 'K2', 'y', 0, 'Sol duvar sirasi');
// dolap kanatlarinin acilmasi
const wr = R2('D1');
if (wr) {
  const clear = Math.min(...rects.filter((r) => r.id !== 'D1' && r.y0 < wr.y1 && r.y1 > wr.y0).map((r) => r.x0 - wr.x1).filter((v) => v > 0), 999);
  clear < 60 && clear < 900
    ? warn(`D1 kanat acilmasi icin onunde ${clear.toFixed(0)} cm var (en az 60 cm gerekir)`)
    : ok('D1 kanatlari serbest aciliyor');
}
// ust dolap alt kotu - carpma riski
wallUnits.zBottom < 175
  ? warn(`Ust dolap alt kotu ${wallUnits.zBottom} cm - kafa carpma riski (>=175 cm onerilir)`)
  : ok(`Ust dolap alt kotu ${wallUnits.zBottom} cm`);
// tavan armatur sayisi / alan
const areaM2 = (room.width * room.depth) / 10000;
const nlum = ceiling.luminaires.length;
ok(`Alan ${areaM2.toFixed(2)} m², ${nlum} adet armatur (~${(areaM2 / nlum).toFixed(1)} m²/armatur)`);
// duvar elemanlari kot kontrolu
for (const w of wallItems) {
  if (w.z > room.height) bad(`${w.id} kotu ${w.z} > net yukseklik ${room.height}`);
  if (w.type === 'switch' && (w.z < 90 || w.z > 140)) warn(`${w.id} anahtar kotu ${w.z} cm (90-140 arasi olagan)`);
  if (w.type === 'socket' && (w.z < 25 || w.z > 120)) warn(`${w.id} priz kotu ${w.z} cm`);
}

console.log(`\n\x1b[1mSONUC:\x1b[0m ${errs} hata, ${warns} uyari\n`);
process.exit(errs > 0 ? 1 : 0);
