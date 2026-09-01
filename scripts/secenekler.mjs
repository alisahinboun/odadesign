#!/usr/bin/env node
/**
 * docs/secenekler.md dosyasini design.js'ten URETIR.
 * Metindeki her sayi (kapi acisi, oturma boslugu, bakis acisi) modelden
 * hesaplanir; elle yazilmaz, boylece yerlesim degisince metin de degisir.
 * Kullanim: npm run secenekler
 */
import fs from 'node:fs';
import { palettes, layouts, resolveDesign } from '../src/config/design.js';
import { applyScheme, room, meta } from '../src/config/room.js';
import { doorSwingLimit, deskClearance, doorSight, metrics } from '../src/lib/analysis.js';

const rows = [];
for (const L of layouts) {
  applyScheme(resolveDesign('p1', L.id));
  const sw = doorSwingLimit();
  const cl = deskClearance();
  const si = doorSight();
  const me = metrics();
  rows.push({ L, sw, cl, si, bos: me.alan - me.doluAlan });
}

const t = (n) => Math.round(n);
let md = `# Renk ve Yerleşim Seçenekleri — Rehber Öğretmen Odası

**Oda:** ${room.width} × ${room.depth} × ${room.height} cm · net ${((room.width * room.depth) / 10000).toFixed(2)} m² · ${meta.revision} · ${meta.date}

> Bu dosya \`npm run secenekler\` ile **otomatik üretilir**. Tablodaki sayılar
> modelden hesaplanır — elle düzenlemeyin.

İki ayrı liste var, istediğiniz gibi eşleştirebilirsiniz:

- **Renk** — hiçbir şey taşınmaz, sadece boyanır
- **Yerleşim** — boya değişmez, eşyalar yer değiştirir

Görüntüleyicide sağ panelden ikisini ayrı ayrı seçin; bakış açınız korunur,
böylece aynı köşeden karşılaştırabilirsiniz.

---

## Kurallar

1. **Yeni eşya alınmıyor.** Bütün öneriler odada bugün ne varsa onunla kuruluyor.
2. **Kapı içeri açılıyor.** Dışa çevrilmesi mümkün değil; bütün öneriler bunu
   veri kabul ediyor.
3. Oda bir **rehberlik odası** olacağı için üç şey belirleyici oldu:
   öğrencinin masanın tam karşısına değil ucuna oturması, oturunca kapının
   görülebilmesi, ve ekrana pencereden yansıma gelmemesi.

---

## Renk seçenekleri

| | Ad | Ne değişiyor | Neden |
|---|---|---|---|
`;
for (const P of palettes) {
  md += `| ${P.code} | **${P.name}** | ${P.summary} | ${P.why.replace(/\s+/g, ' ')} |\n`;
}
md += `
Hepsinde kapsam aynı: bölüntü panelleri + üç duvar + pencere duvarı + tavan bandı
boyanır, dolap kapakları yeniden kaplanır. **Mobilya alımı ve taşıma yok.**

---

## Yerleşim seçenekleri — karşılaştırma

Bütün sayılar modelden hesaplandı.

| | Yerleşim | Kapı kaç derece açılıyor | Kanadı ne durduruyor | Oturma tarafında boşluk | Oturunca kapı |
|---|---|---|---|---|---|
`;
for (const r of rows) {
  md += `| ${r.L.code} | **${r.L.name}** | ${r.sw.angle}° | ${r.sw.blocker || '—'} | ${t(r.cl.cm)} cm | ${r.si.kind === 'onunde' ? `karşınızda (${r.si.deg}°)` : r.si.kind === 'yandan' ? `yanınızda (${r.si.deg}°)` : `arkanızda (${r.si.deg}°)`} |\n`;
}
md += `
*Kapının fiziksel sınırı **152°**'dir: menteşe duvardan 99 cm içeride, kanat 112 cm,
yani kanat o açıda sol duvara değiyor. 152° gören bir satırda kapıyı artık hiçbir
eşya engellemiyor demektir.*

---

`;
for (const r of rows) {
  const L = r.L;
  md += `### ${L.code} · ${L.name}${L.kind === 'mevcut' ? '  *(bugünkü hâli)*' : ''}\n\n`;
  md += `${L.summary}\n\n${L.why.replace(/\s+/g, ' ')}\n\n`;
  md += `**Modelden okunan:** kapı ${r.sw.angle}° açılıyor`;
  md += r.sw.blocker === 'duvar' ? ' (fiziksel sınır)' : ` — kanadı **${r.sw.blocker}** durduruyor`;
  md += `; oturma tarafında **${t(r.cl.cm)} cm** boşluk var (ilk engel: ${r.cl.by}); `;
  md += `boş döşeme **${r.bos.toFixed(1)} m²**.\n\n`;
  if (L.is) md += `**Ne yapılacak:** ${L.is.replace(/\s+/g, ' ')}\n\n`;
  md += '---\n\n';
}
md += `## Paftalar

Her kombinasyonun planı, görünüşleri ve kesitleri \`docs/drawings/\` altında.
Liste: \`docs/drawings/00-pafta-listesi.md\`.
`;
fs.writeFileSync('docs/secenekler.md', md);
console.log(`  ✓ docs/secenekler.md  (${palettes.length} renk, ${layouts.length} yerleşim)`);
