#!/usr/bin/env node
/**
 * 2B TEKNIK CIZIM URETECI
 * src/config/room.js verisinden olculendirilmis SVG cizimler uretir:
 *   plan.svg            1:25  - yerlesim plani, kotalar, poz numaralari
 *   gorunus-on.svg      1:25  - A gorunusu (kapi duvari / boluntu)
 *   gorunus-sag.svg     1:25  - B gorunusu (ankastre dolap bankosu)
 *   gorunus-arka.svg    1:25  - C gorunusu
 *   gorunus-sol.svg     1:25  - D gorunusu
 *   tavan-plani.svg     1:25  - asma tavan plaka bolumu + armatur yerlesimi
 *   doseme-plani.svg    1:25  - doseme karo bolumu
 * Ciktilar docs/drawings/ altina yazilir. Kullanim: npm run drawings
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  room, partition, door, furniture, equipment, wallItems, wallUnits,
  ceiling as ceilCfg, floor as floorCfg, palette, meta, windows, radiators, isVisible, applyScheme,
} from '../src/config/room.js';
import { footprint, doorSwingLimit, metrics, hingeX, leafWidth } from '../src/lib/analysis.js';
import { palettes, layouts, resolveDesign, getPalette, getLayout } from '../src/config/design.js';

/* ---------------------------------------------------------- secim */
/** node scripts/X.mjs --palet=p2 --yerlesim=y3   (varsayilan p1/y1) */
const arg = (k, d) => (process.argv.find((a) => a.startsWith(`--${k}=`)) || '').split('=')[1] || d;
const PID = arg('palet', 'p1'), LID = arg('yerlesim', 'y1');
if (!palettes.some((x) => x.id === PID)) { console.error(`Bilinmeyen palet: ${PID}`); process.exit(2); }
if (!layouts.some((x) => x.id === LID)) { console.error(`Bilinmeyen yerlesim: ${LID}`); process.exit(2); }
const PAL = getPalette(PID), LAY = getLayout(LID);
const SEMA = { code: `${PAL.code}${LAY.code}`, name: `${PAL.name} + ${LAY.name}`,
  kind: (PAL.kind === 'mevcut' && LAY.kind === 'mevcut') ? 'roleve' : 'oneri',
  summary: LAY.summary, rationale: LAY.why, metrajNote: [PAL.is, LAY.is].filter(Boolean).join(' ') };
applyScheme(resolveDesign(PID, LID));
const SUFFIX = (PID === 'p1' && LID === 'y1') ? '' : `-${PID}${LID}`;


const OUT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../docs/drawings');
fs.mkdirSync(OUT, { recursive: true });

/* ------------------------------------------------------------- cizim ayarlari */
const SCALE = 1 / 25;             // 1:25
const MM = (cmVal) => cmVal * 10 * SCALE;   // cm -> cizim mm
const PAD = 55;                   // kenar payi (mm)
const C = {
  cut:   '#111318',   // kesit cizgisi (kalin)
  view:  '#5a626e',   // gorunus cizgisi
  thin:  '#98a0ab',   // ince / mobilya ici
  dim:   '#1b4f7a',   // kota
  hatch: '#c9ced6',
  fill:  '#f3f1ec',
  txt:   '#111318',
  acc:   '#b8860b',
};
const F = 'font-family="Helvetica,Arial,sans-serif"';

function svg(wMM, hMM, title, body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${wMM}mm" height="${hMM}mm"
  viewBox="0 0 ${wMM} ${hMM}" ${F}>
<title>${title}</title>
<rect width="${wMM}" height="${hMM}" fill="#ffffff"/>
${body}
</svg>`;
}

/** Sema paletinden alinan renkleri cizim icin acar (baski okunurlugu) */
function tint(key, mix = 0.78) {
  const hex = (palette[key] || palette.yellow).hex.replace('#', '');
  const n = parseInt(hex, 16);
  const r = (n >> 16) & 255, g2 = (n >> 8) & 255, b2 = n & 255;
  const f = (c) => Math.round(c + (255 - c) * mix).toString(16).padStart(2, '0');
  return `#${f(r)}${f(g2)}${f(b2)}`;
}

const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const line = (x1, y1, x2, y2, c = C.view, w = 0.25, extra = '') =>
  `<line x1="${x1.toFixed(2)}" y1="${y1.toFixed(2)}" x2="${x2.toFixed(2)}" y2="${y2.toFixed(2)}" stroke="${c}" stroke-width="${w}" ${extra}/>`;
const rect = (x, y, w, h, stroke = C.view, sw = 0.25, fill = 'none', extra = '') =>
  `<rect x="${x.toFixed(2)}" y="${y.toFixed(2)}" width="${w.toFixed(2)}" height="${h.toFixed(2)}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" ${extra}/>`;
const text = (x, y, t, size = 2.6, anchor = 'middle', c = C.txt, extra = '') =>
  `<text x="${x.toFixed(2)}" y="${y.toFixed(2)}" font-size="${size}" fill="${c}" text-anchor="${anchor}" ${extra}>${esc(t)}</text>`;
const circle = (x, y, r, stroke = C.view, sw = 0.25, fill = 'none') =>
  `<circle cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" r="${r.toFixed(2)}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`;

/** Yatay kota zinciri */
function dimH(x1, x2, y, label, flip = 1) {
  const t = 1.4;
  return [
    line(x1, y - t * flip, x1, y + t * flip, C.dim, 0.18),
    line(x2, y - t * flip, x2, y + t * flip, C.dim, 0.18),
    line(x1, y, x2, y, C.dim, 0.18),
    line(x1 - 1.0, y + 1.0 * flip, x1 + 1.0, y - 1.0 * flip, C.dim, 0.3),
    line(x2 - 1.0, y + 1.0 * flip, x2 + 1.0, y - 1.0 * flip, C.dim, 0.3),
    text((x1 + x2) / 2, y - 1.1 * flip, label, 2.5, 'middle', C.dim),
  ].join('');
}
/** Dusey kota zinciri */
function dimV(y1, y2, x, label, flip = 1) {
  const t = 1.4;
  return [
    line(x - t * flip, y1, x + t * flip, y1, C.dim, 0.18),
    line(x - t * flip, y2, x + t * flip, y2, C.dim, 0.18),
    line(x, y1, x, y2, C.dim, 0.18),
    line(x - 1.0, y1 - 1.0, x + 1.0, y1 + 1.0, C.dim, 0.3),
    line(x - 1.0, y2 - 1.0, x + 1.0, y2 + 1.0, C.dim, 0.3),
    `<text x="${(x - 1.2 * flip).toFixed(2)}" y="${((y1 + y2) / 2).toFixed(2)}" font-size="2.5" fill="${C.dim}"
       text-anchor="middle" transform="rotate(-90 ${(x - 1.2 * flip).toFixed(2)} ${((y1 + y2) / 2).toFixed(2)})">${esc(label)}</text>`,
  ].join('');
}

/** Poz balonu */
function bubble(x, y, id) {
  return circle(x, y, 3.1, C.acc, 0.3, '#fffdf5') + text(x, y + 0.95, id, 2.5, 'middle', '#7a5c05', 'font-weight="700"');
}

/** Antet */
function titleBlock(wMM, hMM, name, no, scaleTxt = '1:25') {
  const bw = 94, bh = 30, x = wMM - PAD - bw, y = hMM - PAD - bh + 26;
  return [
    rect(x, y, bw, bh, C.cut, 0.4, '#ffffff'),
    line(x, y + 8, x + bw, y + 8, C.cut, 0.25),
    line(x, y + 15.5, x + bw, y + 15.5, C.view, 0.18),
    line(x, y + 22, x + bw, y + 22, C.view, 0.18),
    text(x + 3, y + 5.6, meta.project, 3.2, 'start', C.txt, 'font-weight="700"'),
    text(x + 3, y + 13, name, 2.9, 'start'),
    text(x + 3, y + 19.6, `Olcek ${scaleTxt}  ·  Olculer cm  ·  Pafta ${no}`, 2.3, 'start', C.view),
    // Sema adi uzun olabiliyor ("Sakin yesil + Tezgahla L kur"); proje adiyla ayni
    // satirda cakisiyordu, kendi satirina alindi.
    text(x + bw - 3, y + 13, `${SEMA.code} ${SEMA.name}`, 2.5, 'end',
      SEMA.kind === 'roleve' ? C.view : C.acc, 'font-weight="700"'),
    text(x + 3, y + 26.5, `${meta.revision}  ${meta.date}  ·  parametrik model: src/config/room.js`, 2.1, 'start', C.view),
  ].join('');
}

/** Kuzey / bakis oku */
function viewMark(x, y, label) {
  return circle(x, y, 4, C.cut, 0.3, '#fff') + text(x, y + 1.2, label, 3.4, 'middle', C.cut, 'font-weight="700"');
}

/* ==================================================================== PLAN */
function drawPlan() {
  const W = MM(room.width), D = MM(room.depth), TW = MM(room.wallThickness), PT = MM(room.partitionThickness);
  const wMM = W + PAD * 2 + 96, hMM = D + PAD * 2 + 130;
  const ox = PAD + 40, oy = PAD + 74;          // ic sol-on kose
  const X = (cx) => ox + MM(cx);
  const Y = (cy) => oy + D - MM(cy);           // plan: +Y yukari
  const p = [];

  // doseme
  p.push(rect(X(0), Y(room.depth), W, D, 'none', 0, C.fill));

  // duvarlar (kesit - kalin + tarama)
  p.push(`<defs><pattern id="h" width="1.6" height="1.6" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
    <line x1="0" y1="0" x2="0" y2="1.6" stroke="${C.hatch}" stroke-width="0.5"/></pattern></defs>`);
  const wall = (x, y, w, h) => rect(x, y, w, h, C.cut, 0.5, 'url(#h)');
  p.push(wall(X(0) - TW, Y(room.depth), TW, D));                 // sol
  p.push(wall(X(room.width), Y(room.depth), TW, D));             // sag
  p.push(wall(X(0) - TW, Y(room.depth) - TW, W + TW * 2, TW));   // arka

  // on boluntu: panel panel
  let cx = 0;
  for (const pan of partition.panels) {
    const x0 = X(cx), w = MM(pan.width);
    if (pan.kind === 'door') {
      // kasa
      p.push(rect(x0, Y(0), MM(door.frameFace), PT, C.cut, 0.5, C.hatch));
      p.push(rect(x0 + w - MM(door.frameFace), Y(0), MM(door.frameFace), PT, C.cut, 0.5, C.hatch));
      // kanat + supurme yayi
      const hx = X(hingeX()), R = MM(leafWidth());
      const lim = doorSwingLimit();
      const a = Math.min(lim.angle, 90) * Math.PI / 180;   // kanat 90 derecede cizilir
      const am = lim.angle * Math.PI / 180;                // supurme yayi pratik azamiye kadar
      p.push(line(hx, Y(0), hx + R * Math.cos(a), Y(0) - R * Math.sin(a), C.cut, 0.6));
      const big = lim.angle > 180 ? 1 : 0;
      p.push(`<path d="M ${(hx + R).toFixed(2)} ${Y(0).toFixed(2)} A ${R.toFixed(2)} ${R.toFixed(2)} 0 ${big} 0 ${(hx + R * Math.cos(am)).toFixed(2)} ${(Y(0) - R * Math.sin(am)).toFixed(2)}"
        fill="none" stroke="${C.thin}" stroke-width="0.22" stroke-dasharray="1.6 1.2"/>`);
      p.push(line(hx, Y(0), hx + R * Math.cos(am), Y(0) - R * Math.sin(am), C.acc, 0.3, 'stroke-dasharray="2 1.5"'));
      // aci etiketi yayin uzerinde, oda icinde kalacak sekilde
      const la = (lim.angle * 0.55) * Math.PI / 180;
      p.push(text(hx + R * 0.74 * Math.cos(la), Y(0) - R * 0.74 * Math.sin(la), `azami ${lim.angle}°`, 2.3, 'middle', C.acc));
    } else {
      p.push(rect(x0, Y(0), w, PT, C.cut, 0.5, tint(pan.color)));
    }
    cx += pan.width;
  }

  // --- pencereler (kesit duzleminde, duvar icinde) ---
  for (const w of windows) {
    if (w.wall !== 'back') continue;
    const x0 = X(w.u), ww = MM(w.width);
    p.push(rect(x0, Y(room.depth), ww, TW, C.cut, 0.5, '#ffffff'));
    // cam cizgisi ve bolum kayitlari
    p.push(line(x0, Y(room.depth) + TW * 0.45, x0 + ww, Y(room.depth) + TW * 0.45, C.view, 0.45));
    p.push(line(x0, Y(room.depth) + TW * 0.62, x0 + ww, Y(room.depth) + TW * 0.62, C.view, 0.45));
    let du = w.u;
    for (const d of w.divisions) {
      p.push(line(X(du), Y(room.depth), X(du), Y(room.depth) + TW, C.cut, 0.35));
      if (d.kind === 'sash') {
        // acilir kanat: ic tarafa acilma isareti
        p.push(rect(X(du), Y(room.depth) + TW * 0.40, MM(d.width), TW * 0.26, C.cut, 0.45, '#e8e8e6'));
        p.push(text(X(du + d.width / 2), Y(room.depth) - 4.5, 'açılır', 2.0, 'middle', C.acc));
      }
      du += d.width;
    }
    p.push(line(X(du), Y(room.depth), X(du), Y(room.depth) + TW, C.cut, 0.35));
    // ic denizlik
    p.push(rect(x0 - MM(4), Y(room.depth) - MM(w.sillBoard.depth - room.wallThickness), ww + MM(8),
      MM(w.sillBoard.depth - room.wallThickness), C.thin, 0.28, 'none', 'stroke-dasharray="2 1.2"'));
    const wy = Y(room.depth) - TW - 36;      // mobilya kota satirlarinin ustunde
    p.push(dimH(X(0), x0, wy, `${w.u}`, 1));
    p.push(dimH(x0, x0 + ww, wy, `${w.width}`, 1));
    p.push(dimH(x0 + ww, X(room.width), wy, `${room.width - w.u - w.width}`, 1));
    p.push(text(x0 + ww / 2, wy - 5.5, `${w.id}  denizlik +${w.sill}  ·  üst kot ${w.sill + w.height}`,
      2.4, 'middle', C.acc, 'font-weight="700"'));
  }
  // --- radyatorler ---
  for (const r of radiators) {
    if (r.wall !== 'back') continue;
    p.push(rect(X(r.u), Y(room.depth) - MM(r.depth), MM(r.width), MM(r.depth), C.view, 0.4, '#eef1f3'));
    for (let i = 1; i < r.sections; i++) {
      p.push(line(X(r.u + (r.width / r.sections) * i), Y(room.depth) - MM(r.depth),
        X(r.u + (r.width / r.sections) * i), Y(room.depth), C.thin, 0.18));
    }
    p.push(text(X(r.u + r.width / 2), Y(room.depth) - MM(r.depth) - 3, r.id, 2.2, 'middle', C.acc));
  }

  // ankastre ust dolap bankosu (kesik cizgi - kesit duzlemi ustunde)
  p.push(rect(X(room.width - wallUnits.depth), Y(wallUnits.yEnd), MM(wallUnits.depth), MM(wallUnits.yEnd - wallUnits.yStart),
    C.thin, 0.3, 'none', 'stroke-dasharray="3 1.6"'));
  p.push(text(X(room.width - wallUnits.depth / 2), Y(wallUnits.yEnd / 2), wallUnits.id, 2.1, 'middle', C.thin,
    `transform="rotate(-90 ${X(room.width - wallUnits.depth / 2).toFixed(2)} ${Y(wallUnits.yEnd / 2).toFixed(2)})"`));

  // mobilya
  for (const it of furniture.filter(isVisible)) {
    const r = footprint(it);
    const rx = X(r.x0), ry = Y(r.y1), rw = MM(r.x1 - r.x0), rh = MM(r.y1 - r.y0);
    p.push(rect(rx, ry, rw, rh, C.view, 0.4, '#ffffff'));
    // yon isareti: on yuz cizgisi
    const rad = -(it.rot || 0) * Math.PI / 180;
    const fx = Math.round(-Math.sin(rad)), fy = Math.round(Math.cos(rad)); // yerel +Y dunya yonu
    if (fy === 1) p.push(line(rx, ry, rx + rw, ry, C.thin, 0.9));
    if (fy === -1) p.push(line(rx, ry + rh, rx + rw, ry + rh, C.thin, 0.9));
    if (fx === 1) p.push(line(rx + rw, ry, rx + rw, ry + rh, C.thin, 0.9));
    if (fx === -1) p.push(line(rx, ry, rx, ry + rh, C.thin, 0.9));
    p.push(bubble(X(it.pos[0]), Y(it.pos[1]), it.id));
  }
  // masa ustu ekipman (ince)
  for (const it of equipment.filter(isVisible)) {
    const r = footprint(it);
    p.push(rect(X(r.x0), Y(r.y1), MM(r.x1 - r.x0), MM(r.y1 - r.y0), C.thin, 0.18, 'none', 'stroke-dasharray="1.2 1"'));
  }
  // tavan armaturleri (nokta-kesik)
  for (const l of ceilCfg.luminaires) {
    p.push(rect(X(l.pos[0] - l.w / 2), Y(l.pos[1] + l.d / 2), MM(l.w), MM(l.d), C.thin, 0.2, 'none', 'stroke-dasharray="0.8 0.8"'));
  }

  // ---- kotalar ----
  const dy1 = Y(0) + PT + 10, dy2 = dy1 + 9;
  let cxx = 0;
  for (const pan of partition.panels) {
    p.push(dimH(X(cxx), X(cxx + pan.width), dy1, `${pan.width}`));
    cxx += pan.width;
  }
  p.push(dimH(X(0), X(room.width), dy2, `${room.width}`));
  p.push(dimV(Y(room.depth), Y(0), X(room.width) + TW + 11, `${room.depth}`, -1));

  // Mobilya konum kotalari:
  //   ust kenar  -> on duvara oturan elemanlarin sol duvardan uzakligi
  //   sol kenar  -> sol duvara oturan elemanlarin on duvardan uzakligi
  const topRow = Y(room.depth) - TW - 9;
  let tk = 0;
  for (const id of ['M1', 'C1', 'A1']) {
    const it = furniture.find((f) => f.id === id); if (!it) continue;
    const r = footprint(it);
    const yy = topRow - tk * 8;                 // her eleman kendi kota satirinda
    p.push(dimH(X(0), X(r.x0), yy, `${Math.round(r.x0)}`, 1));
    p.push(dimH(X(r.x0), X(r.x1), yy, `${Math.round(r.x1 - r.x0)}`, 1));
    p.push(text(X(r.x1) + 5, yy + 0.9, it.id, 2.3, 'start', C.acc, 'font-weight="700"'));
    tk++;
  }
  let lk = 0;
  for (const id of ['D1', 'S2', 'K2']) {
    const it = furniture.find((f) => f.id === id); if (!it) continue;
    const r = footprint(it);
    const xx = X(0) - TW - 8 - lk * 8;
    p.push(dimV(Y(r.y1), Y(0), xx, `${Math.round(r.y1)}`, 1));
    p.push(text(xx, Y(r.y1) - 3, it.id, 2.3, 'middle', C.acc, 'font-weight="700"'));
    lk++;
  }

  // kesme cizgileri (1-1 enine, 2-2 boyuna)
  const cutLine = (a, b, c, d2, lab) => [
    line(a, b, c, d2, C.cut, 0.5, 'stroke-dasharray="9 2.5 2 2.5"'),
    circle(a, b, 3.4, C.cut, 0.4, '#fff'), text(a, b + 1.1, lab, 2.4, 'middle', C.cut, 'font-weight="700"'),
    circle(c, d2, 3.4, C.cut, 0.4, '#fff'), text(c, d2 + 1.1, lab, 2.4, 'middle', C.cut, 'font-weight="700"'),
  ].join('');
  p.push(cutLine(X(-26), Y(110), X(room.width + 26), Y(110), '1'));
  p.push(cutLine(X(300), Y(-26), X(300), Y(room.depth + 26), '2'));

  // gorunus isaretleri
  p.push(viewMark(X(room.width / 2), Y(0) + PT + 26, 'A'));
  p.push(viewMark(X(room.width) + TW + 26, Y(room.depth / 2), 'B'));
  p.push(viewMark(X(room.width / 2), Y(room.depth) - TW - 54, 'C'));
  p.push(viewMark(X(0) - TW - 32, Y(room.depth / 2), 'D'));

  // kuzey oku benzeri: giris yonu
  p.push(text(X(room.width / 2), Y(0) + PT + 34, 'GIRIS', 2.4, 'middle', C.cut));

  const M = metrics();
  p.push(text(ox - 20, oy - 64, `OFIS / IDARI ODA   ${room.width}x${room.depth} cm   Net alan ${M.alan.toFixed(2)} m²   Net yuk. ${room.height} cm`, 3.0, 'start', C.txt, 'font-weight="700"'));
  p.push(titleBlock(wMM, hMM, 'Yerlesim plani', 'M-01'));
  return svg(wMM, hMM, 'Yerlesim plani', p.join('\n'));
}

/* ============================================================== GORUNUSLER */
/**
 * @param {'front'|'right'|'back'|'left'} side
 */
function drawElevation(side, code, name) {
  const H = MM(room.height);
  const len = (side === 'front' || side === 'back') ? room.width : room.depth;
  const L = MM(len);
  const wMM = L + PAD * 2 + 72, hMM = H + PAD * 2 + 96;
  const ox = PAD + 22, oy = PAD + 34;
  const U = (u) => ox + MM(u);            // duvar boyunca
  const Z = (z) => oy + H - MM(z);        // kot
  const p = [];

  // duvar yuzeyi
  p.push(rect(U(0), Z(room.height), L, H, C.cut, 0.5, '#ffffff'));
  // doseme ve tavan cizgisi
  p.push(line(U(-8), Z(0), U(len + 8), Z(0), C.cut, 0.8));
  p.push(line(U(-8), Z(room.height), U(len + 8), Z(room.height), C.cut, 0.5));

  if (side === 'front') {
    let cx = 0;
    for (const pan of partition.panels) {
      const x0 = U(cx), w = MM(pan.width);
      if (pan.kind === 'door') {
        p.push(rect(x0, Z(door.height), w, MM(door.height), C.cut, 0.5, '#f6f6f4'));
        p.push(rect(x0 + MM(door.frameFace), Z(door.height - door.frameFace), w - MM(door.frameFace * 2), MM(door.height - door.frameFace), C.view, 0.35, '#ececeb'));
        // acilma yonu (V)
        p.push(line(x0 + MM(door.frameFace), Z(0), x0 + w - MM(door.frameFace), Z(door.height / 2), C.thin, 0.22, 'stroke-dasharray="2.5 1.5"'));
        p.push(line(x0 + MM(door.frameFace), Z(door.height), x0 + w - MM(door.frameFace), Z(door.height / 2), C.thin, 0.22, 'stroke-dasharray="2.5 1.5"'));
        // kol + koruma saci
        p.push(circle(x0 + w - MM(door.frameFace + 12), Z(door.handleHeight), 1.1, C.view, 0.3));
        p.push(rect(x0 + MM(door.frameFace), Z(door.kickPlate), w - MM(door.frameFace * 2), MM(door.kickPlate), C.view, 0.25, '#e2e4e6'));
        p.push(text(x0 + w / 2, Z(door.height / 2) + 8, `${door.id}`, 3.2, 'middle', C.txt, 'font-weight="700"'));
        p.push(text(x0 + w / 2, Z(door.height / 2) + 12.5, `${door.width}/${door.height}`, 2.3, 'middle', C.view));
      } else {
        p.push(rect(x0, Z(partition.sillHeight), w, MM(partition.sillHeight), C.cut, 0.4,
          tint(pan.color)));
        p.push(rect(x0, Z(partition.baseHeight), w, MM(partition.baseHeight), C.view, 0.3, '#e2e4e6'));
      }
      cx += pan.width;
    }
    // vasistas
    p.push(rect(U(0), Z(partition.transomTop), L, MM(partition.transomTop - partition.sillHeight), C.cut, 0.4, '#eef2f3'));
    for (let x = 95; x < len; x += 95) p.push(line(U(x), Z(partition.transomTop), U(x), Z(partition.sillHeight), C.view, 0.3));
    // capraz tarama = cam
    for (let x = 4; x < len; x += 9) {
      p.push(line(U(x), Z(partition.sillHeight), U(Math.min(x + 22, len)), Z(partition.transomTop), '#cfd8db', 0.18));
    }
    p.push(text(U(len - 30), Z((partition.sillHeight + partition.transomTop) / 2), 'telli cam', 2.2, 'middle', C.view));
    // yesil bant
    p.push(rect(U(0), Z(room.height), L, MM(room.height - partition.transomTop), C.cut, 0.4, '#d9f0b8'));
    // dusey kotalar
    p.push(dimV(Z(door.height), Z(0), U(len) + 12, `${door.height}`, -1));
    p.push(dimV(Z(partition.transomTop), Z(partition.sillHeight), U(len) + 12, `${partition.transomTop - partition.sillHeight}`, -1));
    p.push(dimV(Z(room.height), Z(partition.transomTop), U(len) + 12, `${room.height - partition.transomTop}`, -1));
    p.push(dimV(Z(room.height), Z(0), U(len) + 24, `${room.height}`, -1));
    let cxx = 0;
    for (const pan of partition.panels) { p.push(dimH(U(cxx), U(cxx + pan.width), Z(0) + 11, `${pan.width}`)); cxx += pan.width; }
    p.push(dimH(U(0), U(len), Z(0) + 20, `${len}`));
  }

  if (side === 'right') {
    // ankastre dolap bankosu
    const zb = wallUnits.zBottom, zt = wallUnits.zTop;
    p.push(rect(U(wallUnits.yStart), Z(zt), MM(wallUnits.yEnd - wallUnits.yStart), MM(zt - zb), C.cut, 0.5, '#ffffff'));
    const n = Math.max(1, Math.round((wallUnits.yEnd - wallUnits.yStart) / wallUnits.moduleWidth));
    const mw = (wallUnits.yEnd - wallUnits.yStart) / n;
    const nr = wallUnits.doors.length;
    for (let i = 0; i < n; i++) {
      for (let r = 0; r < nr; r++) {
        const row = wallUnits.doors[r];
        const cName = row[i % row.length];
        const rh = (zt - zb - 3.6) / nr;
        const zz = zb + 1.8 + r * rh;
        p.push(rect(U(wallUnits.yStart + i * mw + 1), Z(zz + rh - 0.4), MM(mw - 2), MM(rh - 0.4),
          C.view, 0.3, tint(cName)));
      }
      p.push(text(U(wallUnits.yStart + i * mw + mw / 2), Z(zt) + 4.5, `${Math.round(mw)}`, 2.0, 'middle', C.view));
    }
    p.push(dimH(U(wallUnits.yStart), U(wallUnits.yEnd), Z(zb) + 7, `${wallUnits.yEnd - wallUnits.yStart}`, -1));
    p.push(dimV(Z(zt), Z(zb), U(len) + 12, `${zt - zb}`, -1));
    p.push(dimV(Z(zb), Z(0), U(len) + 12, `${zb}`, -1));
    p.push(dimV(Z(room.height), Z(0), U(len) + 24, `${room.height}`, -1));
    p.push(dimH(U(0), U(len), Z(0) + 12, `${len}`));
  }

  if (side === 'back') {
    // duvar yuzeyi yesil
    p.push(rect(U(0), Z(room.height), L, H, C.cut, 0.5, tint('green')));
    for (const w of windows.filter((x) => x.wall === 'back')) {
      // C gorunusunde u ekseni ters (arka duvara odadan bakiliyor)
      const u0 = len - (w.u + w.width);
      p.push(rect(U(u0), Z(w.sill + w.height), MM(w.width), MM(w.height), C.cut, 0.55, '#ffffff'));
      // bolumler saga dogru ters siralanir
      let du = u0 + w.width;
      for (const d of [...w.divisions]) {
        du -= d.width;
        const isSash = d.kind === 'sash';
        p.push(rect(U(du) + MM(w.frameWidth), Z(w.sill + w.height - w.frameWidth), MM(d.width - w.frameWidth),
          MM(w.height - w.frameWidth * 2), isSash ? C.cut : C.view, isSash ? 0.5 : 0.3, '#eef3f5'));
        if (isSash) {
          // acilma yonu (V) - ic tarafa acilir
          p.push(line(U(du + w.frameWidth), Z(w.sill + w.frameWidth), U(du + d.width),
            Z(w.sill + w.height / 2), C.thin, 0.22, 'stroke-dasharray="2.5 1.5"'));
          p.push(line(U(du + w.frameWidth), Z(w.sill + w.height - w.frameWidth), U(du + d.width),
            Z(w.sill + w.height / 2), C.thin, 0.22, 'stroke-dasharray="2.5 1.5"'));
          p.push(text(U(du + d.width / 2), Z(w.sill + w.height / 2) + 6, 'AÇILIR', 2.3, 'middle', C.acc, 'font-weight="700"'));
        }
        p.push(text(U(du + d.width / 2), Z(w.sill) - 3.2, `${d.width}`, 2.1, 'middle', C.view));
      }
      // ic denizlik
      p.push(rect(U(u0) - MM(4), Z(w.sill), MM(w.width + 8), MM(w.sillBoard.thickness), C.cut, 0.4, '#e6e8ea'));
      // perde tarama
      const c = w.curtain;
      if (c) {
        const cu0 = len - (w.u + c.to), cu1 = len - (w.u + c.from);
        for (let x = cu0; x < cu1; x += 4) {
          p.push(line(U(x), Z(w.sill + w.height - c.headroom), U(x),
            Z(w.sill + w.height - c.headroom - c.drop), '#b9c2c6', 0.22));
        }
        p.push(text(U((cu0 + cu1) / 2), Z(w.sill + w.height - c.headroom) + 4.5,
          `tül perde ${Math.round(c.to - c.from)} cm`, 2.2, 'middle', C.view));
      }
      p.push(dimH(U(u0), U(u0 + w.width), Z(0) + 11, `${w.width}`));
      p.push(dimH(U(0), U(u0), Z(0) + 11, `${Math.round(u0)}`));
      p.push(dimH(U(u0 + w.width), U(len), Z(0) + 11, `${Math.round(len - u0 - w.width)}`));
      p.push(dimV(Z(w.sill), Z(0), U(len) + 12, `${w.sill}`, -1));
      p.push(dimV(Z(w.sill + w.height), Z(w.sill), U(len) + 12, `${w.height}`, -1));
      p.push(text(U(u0 + w.width / 2), Z(w.sill + w.height) - 3, `${w.id} ${w.name}`, 2.5, 'middle', C.acc, 'font-weight="700"'));
    }
    for (const r of radiators.filter((x) => x.wall === 'back')) {
      const u0 = len - (r.u + r.width);
      p.push(rect(U(u0), Z(r.floorGap + r.height), MM(r.width), MM(r.height), C.cut, 0.45, '#f2f3f4'));
      for (let i = 1; i < r.sections; i++) {
        p.push(line(U(u0 + (r.width / r.sections) * i), Z(r.floorGap + r.height),
          U(u0 + (r.width / r.sections) * i), Z(r.floorGap), C.view, 0.2));
      }
      p.push(text(U(u0 + r.width / 2), Z(r.floorGap + r.height) - 2.6, `${r.id} ${r.sections} dilim`, 2.2, 'middle', C.acc));
      p.push(dimV(Z(r.floorGap + r.height), Z(0), U(u0) - 8, `${r.floorGap + r.height}`, 1));
    }
    p.push(dimV(Z(room.height), Z(0), U(len) + 24, `${room.height}`, -1));
    p.push(dimH(U(0), U(len), Z(0) + 20, `${len}`));
    p.push(text(ox - 14, PAD + 14,
      '⚠ Pencere ölçüleri fotoğraf oranlamasıdır — yerinde ölçülmelidir (docs/roleve.md §9).',
      2.4, 'start', '#a4552f'));
  }

  if (side === 'left') {
    p.push(dimV(Z(room.height), Z(0), U(len) + 12, `${room.height}`, -1));
    p.push(dimH(U(0), U(len), Z(0) + 12, `${len}`));
  }

  // bu duvarin onundeki mobilya (gorunus)
  const proj = { front: (r) => [r.x0, r.x1, r.y0], back: (r) => [len - r.x1, len - r.x0, room.depth - r.y1],
                 left: (r) => [r.y0, r.y1, r.x0], right: (r) => [room.depth - r.y1, room.depth - r.y0, room.width - r.x1] };
  const items = furniture.filter(isVisible).sort((a, b) => {
    const ra = footprint(a), rb = footprint(b);
    return proj[side](rb)[2] - proj[side](ra)[2];
  });
  for (const it of items) {
    const r = footprint(it);
    const [u0, u1, dist] = proj[side](r);
    if (dist > 90) continue;                      // sadece duvara yakin olanlar
    p.push(rect(U(u0), Z(it.h), MM(u1 - u0), MM(it.h), C.view, 0.4, '#fbfaf8'));
    p.push(bubble(U((u0 + u1) / 2), Z(it.h) - 5, it.id));
    // gorunuste okunan genislik (donmus elemanda derinlik olabilir) x yukseklik
    p.push(text(U((u0 + u1) / 2), Z(it.h / 2), `${Math.round(u1 - u0)}x${it.h}`, 2.1, 'middle', C.thin));
  }

  // Bu duvardaki elemanlar. Kot degeri, cizimi kirletmemek icin kota zinciri
  // yerine elemanin yanina "+kot" olarak yazilir (montaj kotu, doseme ustunden).
  const wis = wallItems.filter((x) => x.wall === side);
  for (const wi of wis) {
    const w = wi.w || wi.dia || 10, h = wi.h || wi.dia || 10;
    if (wi.type === 'clock') {
      p.push(circle(U(wi.u), Z(wi.z), MM(wi.dia / 2), C.view, 0.4, '#ffffff'));
      p.push(line(U(wi.u), Z(wi.z), U(wi.u), Z(wi.z + wi.dia * 0.32), C.view, 0.25));
    } else {
      p.push(rect(U(wi.u - w / 2), Z(wi.z + h / 2), MM(w), MM(h), C.view, 0.4, '#ffffff'));
    }
    p.push(text(U(wi.u), Z(wi.z + h / 2) - 2.2, `${wi.id}  +${wi.z}`, 2.1, 'middle', C.acc));
  }
  if (wis.length) {
    // Eleman listesi paftanin altina, olcu zincirinin altina yazilir
    p.push(text(U(0), Z(0) + (side === 'front' ? 30 : 22),
      'Duvar elemanları:  ' + wis.map((x) => `${x.id} ${x.name} (+${x.z})`).join('   ·   '),
      2.1, 'start', C.view));
  }

  p.push(text(ox - 14, PAD + 8, `${code} GORUNUSU — ${name}`, 3.2, 'start', C.txt, 'font-weight="700"'));
  p.push(titleBlock(wMM, hMM, `${code} gorunusu — ${name}`, `M-${code === 'A' ? '02' : code === 'B' ? '03' : code === 'C' ? '04' : '05'}`));
  return svg(wMM, hMM, `${code} gorunusu`, p.join('\n'));
}

/* ================================================================ KESIT */
/**
 * Dusey kesit. Plan duzlemini bir cizgiyle keser ve o cizginin arkasinda
 * kalanlari gorunus olarak cizer.
 *   axis 'y' -> yatay kesme cizgisi, ON duvara bakis  (enine kesit)
 *   axis 'x' -> dusey kesme cizgisi,  SAG duvara bakis (boyuna kesit)
 * Plan/gorunuslerde okunmayan seyleri gosterir: asma tavan ustu tesisat
 * boslugu, kaba doseme, boluntu konstruksiyonu, ankastre dolabin derinligi.
 */
function drawSection(axis, at, code, name) {
  const H = MM(room.height);
  const VOID = MM(room.slabToCeiling);          // asma tavan ustu bosluk
  const SLAB = MM(22);                          // kaba doseme kalinligi (temsili)
  const len = axis === 'y' ? room.width : room.depth;
  const L = MM(len);
  const wMM = L + PAD * 2 + 104, hMM = H + VOID + SLAB * 2 + PAD * 2 + 96;
  const ox = PAD + 38, oy = PAD + 34 + SLAB + VOID;   // ust kaba dosemeye yer birak
  const U = (u) => ox + MM(u);                  // kesit boyunca yatay
  const Z = (z) => oy + H - MM(z);              // kot
  const p = [];

  p.push(`<defs>
    <pattern id="hs" width="1.6" height="1.6" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
      <line x1="0" y1="0" x2="0" y2="1.6" stroke="${C.hatch}" stroke-width="0.55"/></pattern>
    <pattern id="hc" width="1.1" height="1.1" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
      <line x1="0" y1="0" x2="0" y2="1.1" stroke="#b9bec6" stroke-width="0.45"/></pattern>
  </defs>`);

  // --- kesilen yapi elemanlari (kalin cizgi + tarama) ---
  const TW = MM(room.wallThickness);
  // kaba doseme
  p.push(rect(U(-room.wallThickness) - 6, Z(0), L + TW * 2 + 12, SLAB, C.cut, 0.6, 'url(#hc)'));
  // yan duvarlar (kesitte)
  p.push(rect(U(0) - TW, Z(room.height) - VOID, TW, H + VOID, C.cut, 0.6, 'url(#hs)'));
  p.push(rect(U(len), Z(room.height) - VOID, TW, H + VOID, C.cut, 0.6, 'url(#hs)'));
  // ust kaba doseme
  p.push(rect(U(-room.wallThickness) - 6, Z(room.height) - VOID - SLAB, L + TW * 2 + 12, SLAB, C.cut, 0.6, 'url(#hc)'));
  // asma tavan plakasi (kesitte ince) + askilar
  p.push(rect(U(0), Z(room.height), L, MM(3), C.cut, 0.45, '#e9e4d8'));
  for (let x = 45; x < len; x += 60) {
    p.push(line(U(x), Z(room.height), U(x), Z(room.height) - VOID, C.thin, 0.2, 'stroke-dasharray="1.4 1.2"'));
    p.push(line(U(x) - 1.6, Z(room.height) - VOID, U(x) + 1.6, Z(room.height) - VOID, C.thin, 0.35));
  }
  // doseme kaplamasi
  p.push(rect(U(0), Z(0), L, MM(3), C.cut, 0.45, '#dcdee1'));
  // tesisat boslugu etiketi
  p.push(text(U(len * 0.5), Z(room.height) - VOID / 2 + 1,
    `asma tavan üstü tesisat boşluğu  ${room.slabToCeiling} cm`, 2.3, 'middle', C.view));

  // --- kesit duzleminin ARKASINDA kalanlar (gorunus) ---
  const back = axis === 'y' ? 0 : room.width;    // bakis yonundeki duvar
  if (axis === 'y') {
    // on boluntu gorunuste
    let cx = 0;
    for (const pan of partition.panels) {
      const x0 = U(cx), w = MM(pan.width);
      if (pan.kind === 'door') {
        p.push(rect(x0, Z(door.height), w, MM(door.height), C.view, 0.35, '#f2f2f0'));
        p.push(text(x0 + w / 2, Z(door.height / 2), door.id, 3.0, 'middle', C.view, 'font-weight="700"'));
      } else {
        p.push(rect(x0, Z(partition.sillHeight), w, MM(partition.sillHeight), C.view, 0.3,
          tint(pan.color, 0.5)));
      }
      cx += pan.width;
    }
    p.push(rect(U(0), Z(partition.transomTop), L, MM(partition.transomTop - partition.sillHeight), C.view, 0.3, '#eff3f4'));
    p.push(rect(U(0), Z(room.height), L, MM(room.height - partition.transomTop), C.view, 0.3, '#e2f2ce'));
  } else {
    // Sag duvar gorunuste: ankastre dolap bankosu modul modul, altinda bos duvar.
    // Kesit boyunca u ekseni arka duvardan (u=0) on duvara (u=derinlik) gider.
    p.push(rect(U(0), Z(room.height), L, H, C.view, 0.25, '#fcfcfb'));
    const wu = wallUnits;
    const n = Math.max(1, Math.round((wu.yEnd - wu.yStart) / wu.moduleWidth));
    const mw = (wu.yEnd - wu.yStart) / n;
    p.push(rect(U(0), Z(wu.zTop), L, MM(wu.zTop - wu.zBottom), C.view, 0.45, '#ffffff'));
    for (let i = 0; i < n; i++) {
      const uStart = room.depth - (wu.yStart + (i + 1) * mw);   // y -> u cevrimi
      const nr = wu.doors.length;
      for (let r = 0; r < nr; r++) {
        const row = wu.doors[r];
        const cName = row[i % row.length];
        const rh = (wu.zTop - wu.zBottom - 3.6) / nr;
        const zz = wu.zBottom + 1.8 + r * rh;
        p.push(rect(U(uStart + 1), Z(zz + rh - 0.4), MM(mw - 2), MM(rh - 0.4), C.view, 0.28,
          tint(cName)));
      }
    }
    p.push(text(U(room.depth / 2), Z(wu.zBottom) + 5, `${wu.id} — ${n} modül × ${Math.round(mw)} cm`, 2.4, 'middle', C.acc));
    p.push(dimV(Z(wu.zTop), Z(wu.zBottom), U(len) + TW + 12, `${wu.zTop - wu.zBottom}`, -1));
    p.push(dimV(Z(wu.zBottom), Z(0), U(len) + TW + 12, `${wu.zBottom}`, -1));
    // sag duvardaki elemanlar
    for (const wi of wallItems.filter((x) => x.wall === 'right')) {
      const w = wi.w || wi.dia || 10, h = wi.h || wi.dia || 10;
      const uu = room.depth - wi.u;
      p.push(rect(U(uu - w / 2), Z(wi.z + h / 2), MM(w), MM(h), C.view, 0.4, '#ffffff'));
      p.push(text(U(uu), Z(wi.z - h / 2) + 4.2, `${wi.id} +${wi.z}`, 2.1, 'middle', C.acc));
    }
  }

  // ankastre dolap: y kesitinde KESILIR, x kesitinde gorunuste kalir
  if (axis === 'y') {
    const wu = wallUnits;
    const x0 = U(len - wu.depth);
    p.push(rect(x0, Z(wu.zTop), MM(wu.depth), MM(wu.zTop - wu.zBottom), C.cut, 0.6, '#ffffff'));
    const rows = 2, rh = (wu.zTop - wu.zBottom - 3.6) / rows;
    for (let r = 0; r < rows; r++) {
      p.push(line(x0, Z(wu.zBottom + 1.8 + r * rh), x0 + MM(wu.depth), Z(wu.zBottom + 1.8 + r * rh), C.view, 0.25));
      // raf
      p.push(line(x0 + 1, Z(wu.zBottom + 1.8 + r * rh + rh / 2), x0 + MM(wu.depth) - 1,
        Z(wu.zBottom + 1.8 + r * rh + rh / 2), C.thin, 0.22));
    }
    p.push(text(x0 - 3, Z((wu.zBottom + wu.zTop) / 2), wu.id, 2.4, 'end', C.acc, 'font-weight="700"'));
    p.push(dimV(Z(wu.zTop), Z(wu.zBottom), U(len) + TW + 12, `${wu.zTop - wu.zBottom}`, -1));
    p.push(dimV(Z(wu.zBottom), Z(0), U(len) + TW + 12, `${wu.zBottom}`, -1));
  }

  // --- mobilya: kesme cizgisini kesenler KESITTE, arkada kalanlar gorunuste ---
  const items = furniture.filter(isVisible).map((it) => ({ it, r: footprint(it) }));
  const beyond = [], cut = [];
  for (const o of items) {
    if (axis === 'y') {
      if (o.r.y0 <= at && o.r.y1 >= at) cut.push(o);
      else if (o.r.y1 < at) beyond.push(o);
    } else {
      if (o.r.x0 <= at && o.r.x1 >= at) cut.push(o);
      else if (o.r.x0 > at) beyond.push(o);
    }
  }
  const uOf = (r) => axis === 'y' ? [r.x0, r.x1] : [room.depth - r.y1, room.depth - r.y0];
  // once arkadakiler (acik), sonra kesilenler (koyu)
  for (const { it, r } of beyond) {
    const [u0, u1] = uOf(r);
    p.push(rect(U(u0), Z(it.h), MM(u1 - u0), MM(it.h), C.thin, 0.28, '#fbfbfa'));
    p.push(text(U((u0 + u1) / 2), Z(it.h) - 3, it.id, 2.2, 'middle', C.thin));
  }
  for (const { it, r } of cut) {
    const [u0, u1] = uOf(r);
    p.push(rect(U(u0), Z(it.h), MM(u1 - u0), MM(it.h), C.cut, 0.55, 'url(#hc)'));
    p.push(bubble(U((u0 + u1) / 2), Z(it.h) - 5.5, it.id));
    p.push(text(U((u0 + u1) / 2), Z(it.h / 2), `${it.h}`, 2.3, 'middle', C.cut));
  }

  // --- kot isaretleri ---
  const lvl = (z, label) => {
    const x = U(-room.wallThickness) - 14;
    return [
      line(x, Z(z), U(0) - TW, Z(z), C.dim, 0.16, 'stroke-dasharray="3 2"'),
      `<path d="M ${(x + 3).toFixed(2)} ${Z(z).toFixed(2)} l -2.4 -2.4 l -2.4 2.4 z" fill="${C.dim}"/>`,
      text(x + 4, Z(z) - 1.6, label, 2.4, 'start', C.dim),
    ].join('');
  };
  p.push(lvl(0, '±0.00'));
  p.push(lvl(room.height, `+${(room.height / 100).toFixed(2)} asma tavan`));
  p.push(lvl(room.height + room.slabToCeiling, `+${((room.height + room.slabToCeiling) / 100).toFixed(2)} kaba tavan`));

  // --- kotalar ---
  p.push(dimV(Z(room.height), Z(0), U(0) - TW - 10, `${room.height} net`, 1));
  p.push(dimV(Z(room.height + room.slabToCeiling), Z(room.height), U(0) - TW - 10, `${room.slabToCeiling}`, 1));
  p.push(dimH(U(0), U(len), Z(0) + 13, `${len}`));

  p.push(text(ox - 30, PAD + 8, `${code} KESITI — ${name}`, 3.2, 'start', C.txt, 'font-weight="700"'));
  p.push(text(ox - 30, PAD + 14,
    axis === 'y' ? `Kesme duzlemi y = ${at} cm, on duvara bakis` : `Kesme duzlemi x = ${at} cm, sag duvara bakis`,
    2.4, 'start', C.view));
  p.push(titleBlock(wMM, hMM, `${code} kesiti — ${name}`, code === '1-1' ? 'M-08' : 'M-09'));
  return svg(wMM, hMM, `${code} kesiti`, p.join('\n'));
}

/* ======================================================== TAVAN / DOSEME */
function drawGridPlan(kind) {
  const isCeil = kind === 'ceiling';
  const tile = isCeil ? ceilCfg.tile : floorCfg.tile;
  const W = MM(room.width), D = MM(room.depth);
  const wMM = W + PAD * 2 + 40, hMM = D + PAD * 2 + 40;
  const ox = PAD + 18, oy = PAD + 14;
  const X = (cx) => ox + MM(cx), Y = (cy) => oy + D - MM(cy);
  const p = [];
  p.push(rect(X(0), Y(room.depth), W, D, C.cut, 0.6, '#fbfbf9'));
  for (let x = tile[0]; x < room.width; x += tile[0]) p.push(line(X(x), Y(0), X(x), Y(room.depth), C.thin, 0.18));
  for (let y = tile[1]; y < room.depth; y += tile[1]) p.push(line(X(0), Y(y), X(room.width), Y(y), C.thin, 0.18));
  const nx = Math.floor(room.width / tile[0]), ny = Math.floor(room.depth / tile[1]);
  const rx = room.width - nx * tile[0], ry = room.depth - ny * tile[1];

  if (isCeil) {
    for (const l of ceilCfg.luminaires) {
      p.push(rect(X(l.pos[0] - l.w / 2), Y(l.pos[1] + l.d / 2), MM(l.w), MM(l.d), C.cut, 0.5, '#fff8dc'));
      p.push(line(X(l.pos[0] - l.w / 2), Y(l.pos[1] + l.d / 2), X(l.pos[0] + l.w / 2), Y(l.pos[1] - l.d / 2), C.view, 0.25));
      p.push(line(X(l.pos[0] - l.w / 2), Y(l.pos[1] - l.d / 2), X(l.pos[0] + l.w / 2), Y(l.pos[1] + l.d / 2), C.view, 0.25));
      p.push(text(X(l.pos[0]), Y(l.pos[1]) - 8, l.id, 2.4, 'middle', C.acc));
      p.push(dimH(X(0), X(l.pos[0]), Y(room.depth) - 7, `${l.pos[0]}`));
      p.push(dimV(Y(l.pos[1]), Y(0), X(room.width) + 8, `${l.pos[1]}`, -1));
    }
    p.push(text(ox, oy - 6, `ASMA TAVAN PLANI — ${tile[0]}x${tile[1]} plaka, T24 tasiyici, alt kot +${room.height} cm`, 3.0, 'start', C.txt, 'font-weight="700"'));
  } else {
    p.push(text(ox, oy - 6, `DOSEME KAPLAMA PLANI — ${tile[0]}x${tile[1]} karo (${floorCfg.finish})`, 3.0, 'start', C.txt, 'font-weight="700"'));
    for (const it of furniture.filter(isVisible)) {
      const r = footprint(it);
      p.push(rect(X(r.x0), Y(r.y1), MM(r.x1 - r.x0), MM(r.y1 - r.y0), C.thin, 0.2, 'none', 'stroke-dasharray="2 1.4"'));
    }
  }
  p.push(dimH(X(0), X(room.width), Y(0) + 11, `${room.width}`));
  p.push(dimV(Y(room.depth), Y(0), X(room.width) + 18, `${room.depth}`, -1));
  p.push(text(ox, oy + D + 20, `Tam plaka: ${nx} x ${ny} adet  ·  kenar kesim: ${rx.toFixed(0)} cm (X) / ${ry.toFixed(0)} cm (Y)`, 2.5, 'start', C.view));
  p.push(titleBlock(wMM, hMM, isCeil ? 'Asma tavan plani' : 'Doseme kaplama plani', isCeil ? 'M-06' : 'M-07'));
  return svg(wMM, hMM, isCeil ? 'Tavan plani' : 'Doseme plani', p.join('\n'));
}

/* ------------------------------------------------------------------ yaz */
const files = [
  ['plan.svg', drawPlan()],
  ['gorunus-A-on.svg', drawElevation('front', 'A', 'On boluntu / kapi duvari')],
  ['gorunus-B-sag.svg', drawElevation('right', 'B', 'Sag duvar / ankastre dolap')],
  ['gorunus-C-arka.svg', drawElevation('back', 'C', 'Arka duvar — pencere ve radyatör')],
  ['gorunus-D-sol.svg', drawElevation('left', 'D', 'Sol duvar')],
  ['kesit-1-1.svg', drawSection('y', 110, '1-1', 'Enine kesit — kapı duvarına bakış')],
  ['kesit-2-2.svg', drawSection('x', 300, '2-2', 'Boyuna kesit — sağ duvara bakış')],
  ['tavan-plani.svg', drawGridPlan('ceiling')],
  ['doseme-plani.svg', drawGridPlan('floor')],
];
for (const [n, c] of files) {
  const name = n.replace(/\.svg$/, `${SUFFIX}.svg`);
  fs.writeFileSync(path.join(OUT, name), c);
  console.log(`  ✓ docs/drawings/${name}  (${(c.length / 1024).toFixed(1)} kB)`);
}
console.log(`\n${files.length} pafta uretildi — ${SEMA.code} ${SEMA.name}. Olcek 1:25.`);
