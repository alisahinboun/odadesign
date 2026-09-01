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
  windows, radiators,
} from '../src/config/room.js';
import { footprint as rect, overlap, doorSwingLimit, metrics, deskClearance, doorSight } from '../src/lib/analysis.js';
import { inRoom as isVisible } from '../src/config/room.js';
import { resolveDesign, palettes, layouts, getPalette, getLayout } from '../src/config/design.js';
import { applyScheme } from '../src/config/room.js';

/* Secim:  node scripts/check.mjs --palet=p2 --yerlesim=y3   (varsayilan p1/y1) */
const arg = (k, d) => (process.argv.find((a) => a.startsWith(`--${k}=`)) || '').split('=')[1] || d;
const PID = arg('palet', 'p1'), LID = arg('yerlesim', 'y1');
if (!palettes.some((x) => x.id === PID)) { console.error(`Bilinmeyen palet: ${PID}`); process.exit(2); }
if (!layouts.some((x) => x.id === LID)) { console.error(`Bilinmeyen yerlesim: ${LID}`); process.exit(2); }
const PAL = getPalette(PID), LAY = getLayout(LID);
applyScheme(resolveDesign(PID, LID));
console.log(`\n\x1b[1m\x1b[33mPalet ${PAL.code} ${PAL.name}  ·  Yerlesim ${LAY.code} ${LAY.name}\x1b[0m`);

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
const VIS = furniture.filter(isVisible);
const rects = VIS.map(rect);
let outside = 0;
for (const r of rects) {
  if (r.x0 < -0.6 || r.x1 > room.width + 0.6 || r.y0 < -0.6 || r.y1 > room.depth + 0.6) {
    bad(`${r.id} oda sinirini asiyor: x ${r.x0.toFixed(1)}..${r.x1.toFixed(1)}, y ${r.y0.toFixed(1)}..${r.y1.toFixed(1)}`);
    outside++;
  }
}
outside === 0 && ok(`${rects.length} mobilya da oda siniri icinde` + (furniture.length - VIS.length ? ` (${furniture.length - VIS.length} eleman bu semada yok)` : ''));
for (const f of VIS) {
  if (f.h > room.height) bad(`${f.id} yuksekligi ${f.h} > net yukseklik ${room.height}`);
}

/* --- 3 --- */
head('3. Mobilya cakismalari');
/**
 * Kasitli ic ice gecmeler. Iki kural:
 *  1. Sandalye/koltuk bir masaya CEKILEBILIR - bu cakisma degil.
 *  2. Cop kovasi masanin ALTINA girer.
 */
const SEATS = new Set(['stackChair', 'officeChair']);
const TABLES = new Set(['desk', 'roundTable', 'credenza']);
const typeOf = (id) => (furniture.find((f) => f.id === id) || {}).type;
function intended(aId, bId) {
  const ta = typeOf(aId), tb = typeOf(bId);
  if ((SEATS.has(ta) && TABLES.has(tb)) || (SEATS.has(tb) && TABLES.has(ta))) return true;
  if (ta === 'bin' || tb === 'bin') return true;
  return false;
}
let clash = 0;
for (let i = 0; i < rects.length; i++) {
  for (let j = i + 1; j < rects.length; j++) {
    const a = rects[i], b = rects[j];
    const o = overlap(a, b);
    if (o.x > 0.5 && o.y > 0.5) {
      if (intended(a.id, b.id)) { ok(`${a.id} / ${b.id} ic ice (sandalye masaya cekilmis / kova masa altinda)`); continue; }
      bad(`${a.id} ve ${b.id} cakisiyor (${o.x.toFixed(1)} x ${o.y.toFixed(1)} cm)`);
      clash++;
    }
  }
}
clash === 0 && ok('Istenmeyen cakisma yok');

/* --- 4 --- */
head('4. Ekipman tasiyicilari');
let hostBad = 0;
for (const e of [...equipment, ...clutter].filter(isVisible)) {
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

/* --- 5b --- */
head('5b. Pencereler ve radyator');
for (const w of windows) {
  const wallLen = (w.wall === 'front' || w.wall === 'back') ? room.width : room.depth;
  const dsum = w.divisions.reduce((a, d) => a + d.width, 0);
  dsum === w.width
    ? ok(`${w.id} bolum toplami ${dsum} cm = kasa genisligi`)
    : bad(`${w.id} bolum toplami ${dsum} cm, kasa genisligi ${w.width} cm - uyusmuyor.`);
  (w.u >= 0 && w.u + w.width <= wallLen)
    ? ok(`${w.id} duvara sigiyor (${w.u}..${w.u + w.width} / ${wallLen} cm)`)
    : bad(`${w.id} duvar sinirini asiyor: ${w.u}..${w.u + w.width} > ${wallLen}`);
  const top = w.sill + w.height;
  if (top > room.height) bad(`${w.id} ust kotu ${top} > net yukseklik ${room.height}`);
  else ok(`${w.id} ust kot ${top} cm, denizlik +${w.sill} cm`);
  if (w.sillBoard.depth > room.wallThickness + 6) {
    const proj = w.sillBoard.depth - room.wallThickness;
    const rad = radiators.find((r) => r.wall === w.wall);
    const radProj = rad ? rad.depth + 4 : 0;
    proj >= radProj
      ? ok(`${w.id} ic denizlik ${w.sillBoard.depth} cm (odaya ${proj} cm cikinti) - raf olarak kullanilabilir`)
      : ok(`${w.id} ic denizlik ${w.sillBoard.depth} cm`);
    if (rad && proj > radProj + 14) {
      warn(`${w.id} denizligi radyatorun ${(proj - radProj).toFixed(0)} cm onune sarkiyor - isi yayilimini kisitlar`);
    }
  }
  if (w.sill < 40) warn(`${w.id} denizlik kotu ${w.sill} cm - olagan disi dusuk, yerinde olculmeli`);
  if (w.sill > 110) warn(`${w.id} denizlik kotu ${w.sill} cm - olagan disi yuksek`);
  // pencerenin onunu kapatan mobilya
  for (const f of VIS) {
    const r = rect(f);
    const along = w.wall === 'back' || w.wall === 'front' ? [r.x0, r.x1] : [r.y0, r.y1];
    const dist = w.wall === 'back' ? room.depth - r.y1 : w.wall === 'front' ? r.y0 : 0;
    if (w.wall !== 'back') continue;
    const overlaps = along[1] > w.u && along[0] < w.u + w.width;
    if (overlaps && dist < 12 && f.h > w.sill) {
      warn(`${f.id} pencerenin (${w.id}) onunu kapatiyor - yukseklik ${f.h} > denizlik ${w.sill}`);
    }
  }
}
for (const r of radiators) {
  const w = windows.find((x) => x.wall === r.wall);
  const topZ = r.floorGap + r.height;
  if (w && topZ > w.sill) bad(`${r.id} ust kotu ${topZ} > denizlik ${w.sill} - radyator pencereye giriyor.`);
  else ok(`${r.id} ust kot ${topZ} cm, denizligin altinda`);
  if (w && (r.u < w.u - 10 || r.u + r.width > w.u + w.width + 10)) {
    warn(`${r.id} pencere aciklığinin disina tasiyor - yerinde kontrol edin`);
  }
  // radyator onu bos mu (isi yayilimi + vana erisimi)
  const rr = { x0: r.u, x1: r.u + r.width, y0: room.depth - 40, y1: room.depth };
  let blocked = null;
  for (const f of VIS) {
    const fr = rect(f);
    if (fr.x1 > rr.x0 && fr.x0 < rr.x1 && fr.y1 > rr.y0) blocked = f.id;
  }
  blocked
    ? warn(`${r.id} onunde ${blocked} var - radyator onu 40 cm bos birakilmali`)
    : ok(`${r.id} onunde 40 cm serbest`);
}

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
const dcl = deskClearance();
if (dcl) {
  dcl.cm < 100
    ? warn(`Masanin oturma tarafinda ${dcl.cm.toFixed(0)} cm var (${dcl.by}); koltuk + gecis icin 100-110 cm onerilir`)
    : ok(`Masanin oturma tarafinda ${dcl.cm.toFixed(0)} cm serbest (ilk engel: ${dcl.by})`);
}
const ds = doorSight();
if (ds) {
  ds.kind === 'arkada'
    ? warn(`Masaya oturunca kapi arkada kaliyor (bakis acisiyla ${ds.deg}deg) - iceri gireni gormezsiniz`)
    : ok(`Masaya oturunca kapi ${ds.kind === 'onunde' ? 'onunuzde' : 'yaninizda'} (${ds.deg}deg)`);
}
// dolap kanatlarinin acilmasi
const wr = R2('D1');
if (wr) {
  const clear = Math.min(...rects.filter((r) => r.id !== 'D1' && r.y0 < wr.y1 && r.y1 > wr.y0).map((r) => r.x0 - wr.x1).filter((v) => v > 0), 999);
  clear < 60 && clear < 900
    ? warn(`D1 kanat acilmasi icin onunde ${clear.toFixed(0)} cm var (en az 60 cm gerekir)`)
    : ok('D1 kanatlari serbest aciliyor');
}
// ust dolap alt kotu - carpma riski
// Kafa carpma riski yalnizca ASILI bir ust dolapta anlamli. Duvarin tamamini
// kaplayan (alt kotu tezgah/doseme seviyesinde olan) bir dolap duvari degil.
wallUnits.zBottom >= 120 && wallUnits.zBottom < 175
  ? warn(`Ust dolap alt kotu ${wallUnits.zBottom} cm - kafa carpma riski (>=175 cm onerilir)`)
  : ok(`Dolap duvari alt kotu ${wallUnits.zBottom} cm, ${Math.round((wallUnits.yEnd - wallUnits.yStart) / wallUnits.moduleWidth)} panel`);
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
