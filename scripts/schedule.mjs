#!/usr/bin/env node
/**
 * MAHAL VE DONATI LISTESI
 * config'ten metraj + donati listesi uretir (Markdown ve CSV).
 * Kullanim: npm run schedule
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  room, partition, door, furniture, equipment, clutter, wallItems, wallUnits,
  ceiling as ceilCfg, floor as floorCfg, palette, meta,
} from '../src/config/room.js';
import { footprint, metrics, doorSwingLimit } from '../src/lib/analysis.js';
import { schemes, resolveScheme } from '../src/config/schemes.js';
import { applyScheme } from '../src/config/room.js';

/* ------------------------------------------------------------- sema secimi */
/** node scripts/X.mjs --sema=s2   (varsayilan s0 = mevcut durum) */
const argSema = (process.argv.find((a) => a.startsWith('--sema=')) || '').split('=')[1] || 's0';
const SEMA = schemes.find((x) => x.id === argSema);
if (!SEMA) {
  console.error(`Bilinmeyen sema: ${argSema}. Secenekler: ${schemes.map((x) => x.id).join(', ')}`);
  process.exit(2);
}
applyScheme(resolveScheme(argSema));
const SUFFIX = argSema === 's0' ? '' : `-${argSema}`;


const OUT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../docs');
const M = metrics();
const swing = doorSwingLimit();

const doorArea = (door.width * door.height) / 10000;
const transomArea = (room.width * (partition.transomTop - partition.sillHeight)) / 10000;
const bandArea = (room.width * (room.height - partition.transomTop)) / 10000;
const partSolid = partition.panels.filter((p) => p.kind !== 'door')
  .reduce((a, p) => a + (p.width * partition.sillHeight) / 10000, 0);
const yellowArea = partition.panels.filter((p) => p.color === 'yellow')
  .reduce((a, p) => a + (p.width * partition.sillHeight) / 10000, 0);
const greenArea = partition.panels.filter((p) => p.color === 'green')
  .reduce((a, p) => a + (p.width * partition.sillHeight) / 10000, 0);
const plasterWalls = ((room.depth * 2 + room.width) * room.height) / 10000;
const wuLen = (wallUnits.yEnd - wallUnits.yStart) / 100;
const wuFront = (wuLen * (wallUnits.zTop - wallUnits.zBottom)) / 100;

const rows = (arr, kind) => arr.map((it) => {
  const r = footprint(it);
  return {
    poz: it.id, ad: it.name, tip: kind,
    olcu: `${it.w}×${it.d}×${it.h}`,
    konum: `(${it.pos[0]}, ${it.pos[1]})`,
    aci: `${it.rot || 0}°`,
    ayak: (((r.x1 - r.x0) * (r.y1 - r.y0)) / 10000).toFixed(2),
    not: it.note ? it.note.replace(/\s+/g, ' ') : '',
  };
});
const all = [...rows(furniture, 'Mobilya'), ...rows(equipment, 'Ekipman'), ...rows(clutter, 'Esya')];

const md = `# Mahal ve Donatı Listesi — ${SEMA.code} ${SEMA.name}

**${meta.project}** · ${meta.revision} · ${meta.date}

> **${SEMA.code} · ${SEMA.name}** — ${SEMA.summary}
> ${SEMA.rationale}
${SEMA.metrajNote ? `>\n> **Metraj notu:** ${SEMA.metrajNote}` : ''}
Bu dosya \`src/config/room.js\` verisinden **otomatik üretilir** (\`npm run schedule\`). Elle düzenlemeyin.

## 1. Mahal metrikleri

| | |
|---|---|
| Net ölçüler | ${room.width} × ${room.depth} × ${room.height} cm |
| Net alan | **${M.alan.toFixed(2)} m²** |
| Net hacim | ${M.hacim.toFixed(2)} m³ |
| Çevre | ${M.cevre.toFixed(2)} m |
| Brüt duvar yüzeyi | ${M.duvarAlani.toFixed(2)} m² |
| Mobilya ayak izi | ${M.doluAlan.toFixed(2)} m² (%${((M.doluAlan / M.alan) * 100).toFixed(0)}) |
| Serbest dolaşım alanı | ${(M.alan - M.doluAlan).toFixed(2)} m² |
| Kapı kanadı azami açıklık | ~${swing.angle}°${swing.blocker ? ` (sınırlayan: ${swing.blocker})` : ''} |

## 2. Yüzey metrajı

| Poz | İş kalemi | Miktar | Birim |
|---|---|---:|---|
| Y‑01 | Döşeme kaplaması (${floorCfg.finish}, ${floorCfg.tile[0]}×${floorCfg.tile[1]}) | ${M.alan.toFixed(2)} | m² |
| Y‑02 | Asma tavan (${ceilCfg.tile[0]}×${ceilCfg.tile[1]} mineral plaka, T24) | ${M.alan.toFixed(2)} | m² |
| Y‑03 | Sıvalı duvar boyası (sol + sağ + arka) | ${plasterWalls.toFixed(2)} | m² |
| Y‑04 | Bölüntü dolu panel — sarı | ${yellowArea.toFixed(2)} | m² |
| Y‑05 | Bölüntü dolu panel — yeşil şerit | ${greenArea.toFixed(2)} | m² |
| Y‑06 | Vasistas camı (telli/buzlu) + alüminyum çerçeve | ${transomArea.toFixed(2)} | m² |
| Y‑07 | Tavan yeşil bandı (boya) | ${bandArea.toFixed(2)} | m² |
| Y‑08 | Kapı ${door.id} (${door.width}×${door.height}), kasa + kanat + donanım | 1 | ad |
| Y‑09 | Ankastre üst dolap bankosu ${wallUnits.id} (ön yüz) | ${wuFront.toFixed(2)} | m² |
| Y‑10 | Ankastre üst dolap bankosu — uzunluk | ${wuLen.toFixed(2)} | m |
| Y‑11 | Tavan armatürü (${ceilCfg.luminaires[0]?.name || '—'}) | ${ceilCfg.luminaires.length} | ad |

Bölüntü dolu panel toplamı: ${partSolid.toFixed(2)} m² · Kapı boşluğu: ${doorArea.toFixed(2)} m²

## 3. Donatı listesi

| Poz | Ad | Tip | G×D×Y (cm) | Konum (x,y) | Açı | Ayak izi m² |
|---|---|---|---|---|---|---:|
${all.map((r) => `| **${r.poz}** | ${r.ad} | ${r.tip} | ${r.olcu} | ${r.konum} | ${r.aci} | ${r.ayak} |`).join('\n')}

> Konum değerleri elemanın **plan merkezini** verir; dönme de merkez etrafındadır.

## 4. Duvar elemanları

| Poz | Ad | Duvar | Yatay konum (u) | Montaj kotu | Ölçü |
|---|---|---|---|---|---|
${wallItems.map((w) => `| **${w.id}** | ${w.name} | ${({ front: 'A / ön', right: 'B / sağ', back: 'C / arka', left: 'D / sol' })[w.wall]} | ${w.u} cm | +${w.z} cm | ${w.dia ? `Ø${w.dia}` : `${w.w}×${w.h}`} cm |`).join('\n')}

## 5. Renk / malzeme paleti

| Anahtar | Yüzey | Hex | RAL (yaklaşık) |
|---|---|---|---|
${Object.entries(palette).map(([k, v]) => `| \`${k}\` | ${v.label} | \`${v.hex}\` | ${v.ral} |`).join('\n')}

## 6. Notlar

${all.filter((r) => r.not).map((r) => `- **${r.poz}** — ${r.not}`).join('\n')}

---
Ölçülerin kaynağı ve güven düzeyi için: [\`docs/roleve.md\`](./roleve.md)
`;

fs.writeFileSync(path.join(OUT, `mahal-listesi${SUFFIX}.md`), md);

const csv = ['poz;ad;tip;genislik_cm;derinlik_cm;yukseklik_cm;x_cm;y_cm;aci_derece;ayak_izi_m2',
  ...[...furniture, ...equipment, ...clutter].map((it) => {
    const r = footprint(it);
    const kind = furniture.includes(it) ? 'Mobilya' : equipment.includes(it) ? 'Ekipman' : 'Esya';
    return [it.id, it.name, kind, it.w, it.d, it.h, it.pos[0], it.pos[1], it.rot || 0,
      (((r.x1 - r.x0) * (r.y1 - r.y0)) / 10000).toFixed(3)].join(';');
  })].join('\n');
fs.writeFileSync(path.join(OUT, `donati-listesi${SUFFIX}.csv`), csv + '\n');

console.log(`  ✓ docs/mahal-listesi${SUFFIX}.md   (${SEMA.code} ${SEMA.name} · ${all.length} donati)`);
console.log(`  ✓ docs/donati-listesi${SUFFIX}.csv (Excel icin ; ayracli)`);
