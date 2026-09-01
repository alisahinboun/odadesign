#!/usr/bin/env node
/** Tum semalar icin denetim + cizim + metraj uretir. Kullanim: npm run all:schemes */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { schemes } from '../src/config/schemes.js';
import { meta } from '../src/config/room.js';

let fail = 0;
for (const s of schemes) {
  console.log(`\n\x1b[1m\x1b[33m━━ ${s.code} · ${s.name} ━━\x1b[0m`);
  for (const script of ['check.mjs', 'drawings.mjs', 'schedule.mjs']) {
    try {
      const out = execFileSync(process.execPath, [`scripts/${script}`, `--sema=${s.id}`], { encoding: 'utf8' });
      if (script === 'check.mjs') {
        const last = out.trim().split('\n').filter((l) => l.includes('SONUC')).pop() || '';
        console.log('  ' + last.replace(/\x1b\[[0-9;]*m/g, '').trim());
        if (!/0 hata/.test(last)) fail++;
      } else {
        console.log(out.trim().split('\n').filter((l) => l.includes('✓')).map((l) => '  ' + l.trim()).join('\n'));
      }
    } catch (e) {
      // Hatanin kendisi yazdirilmali; sadece "hata verdi" demek sorunu gizliyor.
      console.log(`  \x1b[31m✗ ${script} HATA\x1b[0m`);
      const out = ((e.stdout || '') + '\n' + (e.stderr || '')).trim();
      console.log(out.split('\n').slice(0, 6).map((l) => '      ' + l).join('\n'));
      fail++;
    }
  }
}
/* karsilastirma paftalari */
console.log(`\n\x1b[1m\x1b[33m━━ Karsilastirma paftalari ━━\x1b[0m`);
for (const s2 of schemes.filter((x) => x.kind !== 'roleve')) {
  const out = execFileSync(process.execPath, ['scripts/karsilastirma.mjs', 's0', s2.id], { encoding: 'utf8' });
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
for (const sc of schemes) {
  const sfx = sc.id === 's0' ? '' : `-${sc.id}`;
  md += `## ${sc.code} · ${sc.name}\n\n${sc.summary}\n\n| Pafta | Ad | İçerik | Dosya |\n|---|---|---|---|\n`;
  for (const [base, no, ad, ic] of SHEETS) {
    const f = `${base}${sfx}.svg`;
    if (fs.existsSync(path.join(DIR, f))) md += `| ${no} | ${ad} | ${ic} | [\`${f}\`](./${f}) |\n`;
  }
  md += '\n';
}
md += `## Sunum paftaları\n\n| Ad | İçerik | Dosya |\n|---|---|---|\n`;
for (const sc of schemes.filter((x) => x.kind !== 'roleve')) {
  const f = `karsilastirma-s0-${sc.id}.svg`;
  if (fs.existsSync(path.join(DIR, f))) {
    md += `| Ş-0 / ${sc.code} karşılaştırma | İki plan yan yana + ölçülebilir fark tablosu | [\`${f}\`](./${f}) |\n`;
  }
}
md += `\n---\n\nSVG dosyaları AutoCAD, Illustrator, Affinity Designer ve Inkscape ile açılır.\n`
   + `Ölçüler cm. Tüm paftalar \`src/config/room.js\` + \`src/config/schemes.js\` verisinden üretilir.\n`;
fs.writeFileSync(path.join(DIR, '00-pafta-listesi.md'), md);
const n = fs.readdirSync(DIR).filter((f) => f.endsWith('.svg')).length;
console.log(`\n  ✓ docs/drawings/00-pafta-listesi.md  (${n} pafta)`);

console.log(fail === 0 ? '\n\x1b[32mTum semalar temiz.\x1b[0m\n' : `\n\x1b[31m${fail} adimda sorun var - yukaridaki HATA satirlarina bakin.\x1b[0m\n`);
process.exit(fail ? 1 : 0);
