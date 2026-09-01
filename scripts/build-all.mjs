#!/usr/bin/env node
/** Tum semalar icin denetim + cizim + metraj uretir. Kullanim: npm run all:schemes */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { palettes, layouts } from '../src/config/design.js';
import { meta } from '../src/config/room.js';

let fail = 0;
/**
 * Uretilecek kombinasyonlar. Tum 4x3 = 12 kombinasyon gereksiz kalabalik yapar;
 * anlamli olanlar uretilir: mevcut hal + her paletin onerilen yerlesimle esi.
 */
const COMBOS = [
  ['p1', 'y1'],   // su anki hali
  ['p2', 'y1'],   // sadece boya degisirse
  ['p2', 'y2'],   // sakin yesil + gorusme kosesi
  ['p3', 'y2'],   // acik mavi-gri + gorusme kosesi
  ['p4', 'y3'],   // toprak tonlari + kapi disa acilan yerlesim
];

for (const [pid, lid] of COMBOS) {
  const P = palettes.find((x) => x.id === pid), L = layouts.find((x) => x.id === lid);
  console.log(`\n\x1b[1m\x1b[33m━━ ${P.name}  +  ${L.name} ━━\x1b[0m`);
  for (const script of ['check.mjs', 'drawings.mjs', 'schedule.mjs']) {
    try {
      const out = execFileSync(process.execPath,
        [`scripts/${script}`, `--palet=${pid}`, `--yerlesim=${lid}`], { encoding: 'utf8' });
      if (script === 'check.mjs') {
        const last = out.trim().split('\n').filter((l) => l.includes('SONUC')).pop() || '';
        console.log('  ' + last.replace(/\x1b\[[0-9;]*m/g, '').trim());
        if (!/0 hata/.test(last)) fail++;
      } else {
        console.log(out.trim().split('\n').filter((l) => l.includes('✓')).map((l) => '  ' + l.trim()).join('\n'));
      }
    } catch (e) {
      console.log(`  \x1b[31m✗ ${script} HATA\x1b[0m`);
      const o = ((e.stdout || '') + '\n' + (e.stderr || '')).trim();
      console.log(o.split('\n').slice(0, 6).map((l) => '      ' + l).join('\n'));
      fail++;
    }
  }
}

/* karsilastirma paftalari */
console.log(`\n\x1b[1m\x1b[33m━━ Karsilastirma paftalari ━━\x1b[0m`);
for (const [pid, lid] of COMBOS.slice(1)) {
  const out = execFileSync(process.execPath, ['scripts/karsilastirma.mjs', 'p1', 'y1', pid, lid], { encoding: 'utf8' });
  console.log('  ' + out.trim());
}

/* pafta listesi - klasorde ne oldugu her uretimde guncellenir */
const DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../docs/drawings');
const SHEETS = [
  ['plan', 'M-01', 'Yerleşim planı', 'Mobilya konumları, poz numaraları, kapı süpürme yayı, kesme çizgileri'],
  ['gorunus-A-on', 'M-02', 'A görünüşü — ön bölüntü', 'Kapı, vasistas, panel dizilimi, duvar elemanları'],
  ['gorunus-B-sag', 'M-03', 'B görünüşü — sağ duvar', 'Ankastre üst dolap bankosu, modül genişlikleri'],
  ['gorunus-C-arka', 'M-04', 'C görünüşü — arka duvar', 'RÖLEVE EKSİK — yerinde ölçüm gerekiyor'],
  ['gorunus-D-sol', 'M-05', 'D görünüşü — sol duvar', 'Dolap ve misafir sandalyesi'],
  ['tavan-plani', 'M-06', 'Asma tavan planı', '60×60 plaka bölümü, armatür konumları'],
  ['doseme-plani', 'M-07', 'Döşeme kaplama planı', '33×33 karo bölümü, kenar kesim ölçüleri'],
  ['kesit-1-1', 'M-08', '1-1 kesiti — enine', 'Kaba döşeme, asma tavan + askı, tesisat boşluğu'],
  ['kesit-2-2', 'M-09', '2-2 kesiti — boyuna', 'Ankastre dolap bankosu görünüşte, kot işaretleri'],
];
let md = `# Pafta Listesi\n\n**${meta.project}** · ${meta.revision} · ${meta.date} · ölçek 1:25 (karşılaştırma 1:40)\n\n`
  + `Bu dosya \`npm run all:schemes\` ile **otomatik üretilir**. Elle düzenlemeyin.\n\n`;
for (const [pid, lid] of COMBOS) {
  const P = palettes.find((x) => x.id === pid), L = layouts.find((x) => x.id === lid);
  const sfx = (pid === 'p1' && lid === 'y1') ? '' : `-${pid}${lid}`;
  md += `## ${P.name} + ${L.name}\n\n${L.summary}\n\n| Pafta | Ad | İçerik | Dosya |\n|---|---|---|---|\n`;
  for (const [base, no, ad, ic] of SHEETS) {
    const f = `${base}${sfx}.svg`;
    if (fs.existsSync(path.join(DIR, f))) md += `| ${no} | ${ad} | ${ic} | [\`${f}\`](./${f}) |\n`;
  }
  md += '\n';
}
md += `## Sunum paftaları\n\n| Ad | İçerik | Dosya |\n|---|---|---|\n`;
for (const [pid, lid] of COMBOS.slice(1)) {
  const P = palettes.find((x) => x.id === pid), L = layouts.find((x) => x.id === lid);
  const f = `karsilastirma-p1y1-${pid}${lid}.svg`;
  if (fs.existsSync(path.join(DIR, f))) {
    md += `| Şu anki hâli / ${P.name} + ${L.name} | İki plan yan yana + ölçülebilir fark tablosu | [\`${f}\`](./${f}) |\n`;
  }
}
if (fs.existsSync(path.join(DIR, 'olcu-foyu.svg'))) {
  md += `| Ölçü föyü | Yerinde ölçülecekler, numaralı plan + boş kutular | [\`olcu-foyu.svg\`](./olcu-foyu.svg) |\n`;
}
md += `\n---\n\nSVG dosyaları AutoCAD, Illustrator, Affinity Designer ve Inkscape ile açılır.\n`
   + `Ölçüler cm. Tüm paftalar \`src/config/room.js\` + \`src/config/design.js\` verisinden üretilir.\n`;
fs.writeFileSync(path.join(DIR, '00-pafta-listesi.md'), md);
const n = fs.readdirSync(DIR).filter((f) => f.endsWith('.svg')).length;
console.log(`\n  ✓ docs/drawings/00-pafta-listesi.md  (${n} pafta)`);

console.log(fail === 0 ? '\n\x1b[32mTum semalar temiz.\x1b[0m\n' : `\n\x1b[31m${fail} adimda sorun var - yukaridaki HATA satirlarina bakin.\x1b[0m\n`);
process.exit(fail ? 1 : 0);
