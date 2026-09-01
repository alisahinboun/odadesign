#!/usr/bin/env node
/**
 * Bir gorseli src/assets/wallpaper.js icine base64 olarak gomer.
 * Kullanim:  npm run duvar-kagidi -- reference/duvar-kagidi.jpg
 *
 * Olceklendirme ve sikistirma tarayicida (Chromium) yapilir; projede ayrica
 * bir goruntu kutuphanesi bulundurmamak icin. Cikti JPEG - duvar kagidi
 * fotografik bir desen, PNG gereksiz yere 4-5 kat buyuk oluyor.
 */
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const src = process.argv[2];
const MAXW = Number(process.argv[3] || 2048);
const Q = Number(process.argv[4] || 0.82);
if (!src) { console.error('Kullanim: node scripts/embed-wallpaper.mjs <gorsel> [genislik] [kalite]'); process.exit(2); }
if (!fs.existsSync(src)) { console.error('Dosya yok:', src); process.exit(2); }

const ext = path.extname(src).slice(1).toLowerCase();
const mime = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
const inDataUri = `data:${mime};base64,${fs.readFileSync(src).toString('base64')}`;

const b = await chromium.launch({
  executablePath: process.env.CHROME_PATH || undefined,
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
});
const p = await b.newPage();
const out = await p.evaluate(async ({ uri, maxw, q }) => {
  const img = new Image();
  img.src = uri;
  await img.decode();
  const w = Math.min(maxw, img.naturalWidth);
  const h = Math.round(img.naturalHeight * (w / img.naturalWidth));
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d');
  g.imageSmoothingQuality = 'high';
  g.drawImage(img, 0, 0, w, h);
  return { uri: c.toDataURL('image/jpeg', q), w, h, ow: img.naturalWidth, oh: img.naturalHeight };
}, { uri: inDataUri, maxw: MAXW, q: Q });
await b.close();

const bytes = Math.round((out.uri.length - out.uri.indexOf(',') - 1) * 3 / 4);
const file = `/**
 * ============================================================================
 *  DUVAR KAGIDI GORSELI  (base64, HTML'e gomulu)  -  OTOMATIK URETILDI
 * ============================================================================
 *  Kaynak : ${path.basename(src)}  (${out.ow} x ${out.oh} px)
 *  Gomulu : ${out.w} x ${out.h} px, JPEG kalite ${Q}, ~${(bytes / 1024).toFixed(0)} kB
 *  Komut  : npm run duvar-kagidi -- ${src}
 *
 *  Bu dosyayi ELLE DUZENLEMEYIN. Gorseli degistirmek icin komutu yeniden
 *  calistirin. Deger null ise src/lib/textures.js icindeki CIZILMIS desen
 *  kullanilir, yani gorsel olmadan da her sey calisir.
 * ============================================================================
 */

/** @type {string|null} */
export const wallpaperDataURI = '${out.uri}';

export const wallpaperInfo = {
  source: ${JSON.stringify(path.basename(src))},
  px: [${out.w}, ${out.h}],
  bytes: ${bytes},
};
`;
fs.writeFileSync('src/assets/wallpaper.js', file);
console.log(`  ✓ src/assets/wallpaper.js  ${out.ow}x${out.oh} -> ${out.w}x${out.h}, ~${(bytes / 1024).toFixed(0)} kB base64`);
console.log('    Simdi: npm run build');
