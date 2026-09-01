# Renk ve Yerleşim Seçenekleri — Rehber Öğretmen Odası

**Oda:** 370 × 270 × 290 cm · net 9,99 m² · R01 · 2026‑09‑01

İki ayrı liste var, istediğiniz gibi eşleştirebilirsiniz:

- **Renk** — hiçbir şey taşınmaz, sadece boyanır
- **Yerleşim** — boya değişmez, eşyalar yer değiştirir

Görselleştiricide sağ panelden ikisini ayrı ayrı seçin; bakış açınız korunur,
böylece aynı köşeden karşılaştırabilirsiniz.

---

## Neden bu öneriler?

Oda bir **rehberlik odası** olacağı için üç şey belirleyici oldu:

1. **Öğrenci masanın karşısına oturmamalı.** Karşılıklı oturmak sorgu hissi verir.
   Rehberlik görüşmesinde önerilen, iki kişinin ~90° açıyla oturmasıdır.
2. **Renkler sakin olmalı.** Doygun sarı ve yeşil uyarıcı renkler; koridor için
   uygun ama görüşme odasında ters yönde çalışıyor.
3. **Kapıdan bakınca öğrenci doğrudan görünmemeli.**

---

## Renk seçenekleri

| | Ad | Ne değişiyor | Neden |
|---|---|---|---|
| 1 | **Şu anki renkler** | — | Karşılaştırma tabanı |
| 2 | **Sakin yeşil** | Paneller kırık beyaz, yeşil adaçayına çekilir | Okulun kimliğini korur ama sakinleştirir. Pencere duvarı açık nötr olunca oda belirgin aydınlanır |
| 3 | **Açık mavi‑gri** | Vurgu soluk mavi‑gri, duvarlar açık gri | Mavi gerginliği düşürür; danışmanlık mekânlarında yaygın. Kayın mobilya soğukluğu dengeler |
| 4 | **Toprak tonları** | Kum ve kil tonları | Mevcut kayın mobilyayla en uyumlu, en "ev gibi" seçenek. Öğrencinin rahat konuşması için en etkilisi |

Hepsinde kapsam aynı: bölüntü panelleri + üç duvar + pencere duvarı + tavan bandı
boyanır, dolap kapakları yeniden kaplanır. **Mobilya alımı ve taşıma yok.**

---

## Yerleşim seçenekleri

### 1 · Şu anki hâli
Karşılaştırma tabanı. Bu hâlde kapı ancak **~109°** açılıyor, masaya oturunca
kapıya sırtınız dönük ve görüşme için ayrı bir alan yok — öğrenci masanın
karşısına oturmak zorunda.

### 2 · Görüşme köşesi
Masa yerinde kalıyor; **arka‑sol köşede** iki sandalye ve küçük yuvarlak sehpadan
oluşan ayrı bir görüşme alanı kuruluyor. Sandalyeler birbirine ~90° açıyla duruyor.

Bu köşe kapıdan doğrudan görünmüyor. Masa çalışma için kalıyor, görüşme ayrı
alanda yapılıyor.

**Gerekenler:** 1 küçük yuvarlak sehpa (Ø70) + 1 sandalye. Tül perde boydan boya
çekilir. Diğer her şey yerinde.

### 3 · Kapı dışa açılsın
Kapı koridora doğru açılacak şekilde çevriliyor. **Bu tek değişiklik odanın
ortasında ~2 m² kullanılabilir alan açıyor.**

Şu anda kapı içeri açıldığı için menteşenin 112 cm çevresine hiçbir şey
konulamıyor — 10 m²'lik odada çok büyük bir kayıp. Açılan alanla masa duvara
dayanabiliyor, görüşme köşesi rahatlıyor.

Yangın yönetmeliği açısından da kapının kaçış yönüne (dışa) açılması zaten
tercih edilir.

**Gerekenler:** Kapı kanadı ve kasası çevrilir (marangoz işi). 1 yuvarlak sehpa +
1 sandalye. Tül perde boydan boya çekilir.

---

## Ölçülebilir fark

| | Şu anki | Görüşme köşesi | Kapı dışa |
|---|---:|---:|---:|
| Kapı ne kadar açılıyor | 109° | 115° | **178°** |
| Ayrı görüşme alanı | yok | **var** | **var** |
| Öğrenci masanın karşısında mı | evet | **hayır** | **hayır** |
| Oturunca kapıyı görüyor musunuz | hayır | hayır | hayır |
| Yeni alım | — | sehpa + sandalye | sehpa + sandalye |
| Marangoz işi | — | — | kapı çevirme |

Karşılaştırma paftaları: `docs/drawings/karsilastirma-p1y1-*.svg`

---

## Kendiniz denemek isterseniz

Görselleştiricide **"Eşyaları taşı"** düğmesine basın (ya da **E** tuşu):

- Bir mobilyaya tıklayıp sürükleyin
- **R** ile 15° çevirin
- Duvara yaklaşınca kendiliğinden yapışır
- Masayı taşırsanız üzerindeki monitör, klavye ve diğer eşyalar birlikte gelir
- Çerçeve **yeşilse** yerleşim geçerli, **kırmızıysa** bir sorun var (çakışma,
  kapıyı engelleme, pencerenin veya radyatörün önünü kapatma)
- Beğendiğiniz yerleşimin sayıları panelde çıkar; `src/config/design.js` içine
  yapıştırırsanız kalıcı seçenek olur

---

## Yeni seçenek eklemek

`src/config/design.js` içindeki `palettes` veya `layouts` listesine bir nesne
ekleyin; 3B model, çizimler ve listeler otomatik olarak onu da üretir.
