# Röleve Notları ve Varsayımlar

**Proje:** Ofis / idari oda — 3B model
**Kaynak:** 3 adet fotoğraf + 1 adet el krokisi (bkz. `reference/`)
**Revizyon:** R00 · 2026‑09‑01

> **Bu bir yerinde röleve değildir.** Model, elde bulunan görsellerden çıkarılmıştır.
> Aşağıda her ölçünün nereden geldiği ve güven düzeyi ayrı ayrı belirtilmiştir.
> **İmalata girmeden önce ⚠️ işaretli tüm ölçüler yerinde kontrol edilmelidir.**

---

## 1. Kaynak belgeler

| Dosya | İçerik |
|---|---|
| `reference/01-genel-gorunum.jpg` | Geniş açı, arka‑sağ köşeden ön duvara bakış. Kapı kapalı. |
| `reference/02-kapi-acik.jpg` | Arka‑sol köşeden sağ duvara bakış. Kapı açık, koridor görünüyor. |
| `reference/03-sol-kose-dolap.jpg` | Sol duvar ve ön‑sol köşe. Dolap, misafir sandalyesi, ayna, top ve rulo. |
| `reference/04-el-krokisi.jpg` | Elle çizilmiş plan krokisi + donatı ölçüleri. |
| `reference/05-arka-duvar-pencere.jpg` | **Arka duvar.** Büyük pencere, tül perde, altında dilimli radyatör. Sağdan sola: sağ duvarın dolap bankosu, pencere duvarı, sol duvar. |

## 2. El krokisinden okunanlar — **yüksek güven**

| Okunan | Değer | Modeldeki karşılığı |
|---|---|---|
| Alt kenar | `20 cm + 350 cm` = **370 cm** | `room.width` |
| Sol kenar | **270 cm** | `room.depth` |
| Kapı notu | `(120 cm kapı)` | `door.width` |
| Üst kenar | `120 cm` + eleman + `150 cm` | 370 cm ile tutarlı |
| `Masa = 160*75` | **160 × 75 cm** | `M1` |
| `Dolap = 80` | **80 cm** | `D1` |
| Üçüncü satır `… = 80` | **80 cm** ⚠️ | `K2` — *aşağıya bakınız* |

### ⚠️ Krokide okunamayan satır — ve bu elemanın odada olmadığı
Krokinin üçüncü donatı satırındaki kelime el yazısından çözülemedi (“Kanturi /
Kitaplık / Konsol” okumaları mümkün). Model bunu 80 cm genişliğinde açık raflı bir
modül (kitaplık) olarak kabul etti.

**Bu eleman odada YOK.** Hiçbir fotoğrafta görünmüyor; arka tarafta da olmadığı
teyit edildi. Model bunu **tasarım programı kalemi** olarak tutuyor:
`proposedOnly: true` ile işaretli, mevcut durum (Ş‑0) ve boya‑only önerisinde (Ş‑1)
**gizli**, yeniden yerleşim önerisinde (Ş‑2) **yeni eleman** olarak görünür.

Bu, krokinin ne olduğu konusunda bir okuma daha getiriyor: kroki büyük ihtimalle
sadece bir röleve değil, **kısmen bir tasarım programı** — masa ve dolap zaten var,
üçüncü 80 cm'lik kalem ise istenen yeni eleman. Doğru tür farklıysa `src/config/room.js`
içinde `K2` kaydının `type` alanını değiştirmek yeterli.

## 3. Fotoğraflardan çıkarılanlar — **orta güven** ⚠️

Aşağıdaki değerler kapı yüksekliği (≈205 cm) referans alınarak orantıyla tahmin edildi.

| Öğe | Kabul edilen değer | Dayanak |
|---|---|---|
| Net kat yüksekliği | 290 cm | Kapı 205 + vasistas 67 + yeşil bant 18 |
| Vasistas alt kotu (denizlik) | 205 cm | Kapı kasası üst kotu ile aynı hizada (foto 02) |
| Vasistas üst kotu | 272 cm | Yeşil bandın alt kenarı |
| Tavan yeşil bandı | 18 cm | Foto 01/02 |
| Yeşil düşey şerit genişliği | 35 cm | Saat çapı (≈30) ile karşılaştırma |
| Bölüntü kalınlığı | 8 cm | Alüminyum profilli sistem, tipik |
| Ankastre üst dolap alt kotu | 182 cm | Foto 02, kapı üst kotunun biraz altı |
| Ankastre üst dolap üst kotu | 288 cm | Tavana yakın, ince gölge boşluğu var |
| Ankastre dolap derinliği | 35 cm | Tipik üst dolap derinliği |
| Döşeme karosu | 33 × 33 cm | Foto 03, derz aralığı |
| Asma tavan plakası | 60 × 60 cm | Standart T24 taşıyıcılı sistem |
| Tüm mobilya konumları | — | Fotoğraf perspektifinden yorum |

## 4. Ön bölüntü panel dizilimi (A görünüşü)

Soldan sağa, toplam 370 cm:

| Poz | Tip | Genişlik | Not |
|---|---|---|---|
| P1 | Sarı dolu panel | 95 cm | Ayna (T3) bu panelde |
| D1 | Kapı | **120 cm** | Krokiden. Sol menteşeli, odaya açılır |
| P2 | Yeşil düşey şerit | 35 cm | Saat (T1) ve aydınlatma anahtarı (T5) |
| P3 | Sarı dolu panel | 120 cm | Manzara tablosu (T2) |

Panel toplamı `npm run check` ile her seferinde doğrulanır.

## 5. Tasarım tespitleri (modelden çıkan bulgular)

Bunlar fotoğrafta görülmeyen, ancak model üzerinde ölçülebilen sonuçlardır.

> Bu tespitler tasarım önerilerinin çıkış noktasıdır; hangi önerinin hangisini
> çözdüğü [`semalar.md`](./semalar.md) içinde ölçülebilir olarak karşılaştırılmıştır.

**T‑1 · Kapı kanadı tam açılamıyor.**
Kanat, çarpmadan **yaklaşık 109°** açılabiliyor; sınırlayan eleman sol duvardaki
misafir sandalyesi **S2**. Fotoğraf 02 ve 03'te kanadın duvara tam yaslanmamış olması
bu tespiti doğruluyor. Değer `src/lib/analysis.js → doorSwingLimit()` içinde
yerleşimden hesaplanır; mobilyayı kaydırdığınızda kendiliğinden güncellenir.

**T‑2 · Masanın sol ucu kapı süpürme yayına çok yakın.**
`M1` masasının sol‑ön köşesi menteşe ekseninden ≈120 cm uzakta; kanat yarıçapı 112 cm.
Yani pay yalnızca ~8 cm. Masa 15 cm daha sola kaydırılırsa kapı kanadına çarpar.

**T‑3 · Dolabın konumu, aynanın yerini belirliyor.**
`D1` dolabı ön duvara değil **sol duvara** sırtını verecek şekilde modellendi.
Fotoğraf 03'te dolap ile kapı kasası arasında sarı panelin boş kaldığı ve aynanın
oraya asıldığı görülüyor; dolap ön duvarda olsaydı (95 cm'lik panelin 80 cm'ini
kapatırdı) aynaya yer kalmazdı. Bu, dolabın konumu için en tutarlı okuma.

**T‑4 · Serbest dolaşım alanı dar.**
9,99 m² net alanın ≈3,2 m²'sini mobilya ayak izi kaplıyor; geriye ≈6,8 m² kalıyor.
Masa arkası çalışma boşluğu 135 cm (koltuk + geçiş için yeterli, sınırda).

**T‑5 · Arka duvar — foto 05 ile kısmen kapandı, ölçüler hâlâ tahmin.**
Arka duvar artık biliniyor: **tamamı yeşil boyalı**, ortasında büyük bir pencere ve
altında dilimli radyatör var. Bu, ilk röleve kabulünü (sol duvarla aynı, lila, sağır)
tamamen geçersiz kıldı — model buna göre yeniden kuruldu.

Ancak pencere ve radyatör ölçüleri fotoğraf oranlamasından çıkarıldı. Fotoğraf
ultra geniş açılı olduğu için **düşey ölçülerde belirsizlik yüksek**: aynı kareden
denizlik kotu için 59–85 cm arası okumalar çıkıyor. Model 80 cm kabul etti.

**T‑7 · Oda penceresiz değilmiş — Ş‑1'in gerekçesi düzeltildi.**
İlk tasarım önerisi "oda penceresiz, ışığını vasistastan ödünç alıyor" varsayımına
dayanıyordu. Foto 05 bunu çürüttü. Gerekçe yeniden yazıldı: sorun ışığın yokluğu
değil, **ışığın geldiği duvarın tamamının doygun yeşile boyalı olması** — gelen ışık
daha odaya yayılmadan yutuluyor ve yansıyan az ışık yeşile boyanıyor.

**T‑6 · Ekranda pencere yansıması (Ş‑2'de ortaya çıktı).**
Kullanıcı kapıya dönük oturduğunda pencere arkasında kalıyor ve ekranda yansıma
yapıyor. Foto 05'te tül perde tek uca toplanmış, pencerenin ancak 1/3'ünü örtüyor.
Ş‑2 perdeyi pencere boyunca tamamlıyor — **ek maliyeti yok**, perde zaten var.

## 6. Yerinde kontrol edilecekler (kontrol listesi)

- [ ] Net kat yüksekliği (asma tavan alt kotu) — kabul: 290 cm
- [ ] Asma tavan üstü tesisat boşluğu ve kaba döşeme kotu
- [ ] Kapı kasası dış ölçüsü (kabul: 120 × 205) ve menteşe yönü
- [ ] Vasistas alt/üst kotları ve cam tipi (telli mi buzlu mu)
- [ ] Ankastre üst dolapların gerçek derinliği ve modül genişliği
- [ ] Arka duvar bitişi — kabul: tamamı yeşil (foto 05 ile doğrulandı ✓)
- [ ] Priz / anahtar / veri prizi konumları (modeldekiler temsilîdir)
- [ ] Radyatör veya klima var mı (fotoğraflarda görünmüyor)
- [ ] Aydınlatma armatürlerinin gerçek tipi ve konumu
- [ ] Renk numuneleri — palet fotoğraftan okunmuştur, RAL karşılıkları yaklaşıktır

## 7. Renk paleti (fotoğraftan okuma) ⚠️

| Yüzey | Hex | Yaklaşık RAL |
|---|---|---|
| Bölüntü panel sarısı | `#f2c11c` | RAL 1023 benzeri |
| Yeşil düşey şerit | `#3faa35` | RAL 6018 benzeri |
| Tavan yeşil bandı | `#7cc623` | RAL 6018 açık |
| Duvar boyası (lila) | `#bdb5c9` | RAL 7035 mor tonlu |
| Krem dolap kapağı | `#ded8cc` | RAL 9001 |
| Kapı kanadı gri laminat | `#adaaa4` | RAL 7038 |

Ekran renkleri ile boya renkleri birebir örtüşmez; teklif öncesi fiziksel numune
karşılaştırması yapılmalıdır.

## 8. ⚠️ Yerinde alınması gereken 4 ölçü (pencere)

Bu dört değer alınırsa `src/config/room.js → windows[0]` içinde güncellenir ve
plan, C görünüşü, kesitler, 3B model ve metraj birlikte düzelir.

| # | Ölçü | Modeldeki kabul | Nasıl ölçülür |
|---|---|---:|---|
| 1 | **Denizlik üst kotu** (döşemeden) | 80 cm | Döşeme kaplamasından iç denizliğin üst yüzüne |
| 2 | **Kasa dış yüksekliği** | 130 cm | Denizlik üstünden kasa üst dış kenarına |
| 3 | **Kasa dış genişliği** | 285 cm | Yatay, kasa dış kenarından dış kenarına |
| 4 | **Sol duvara mesafe** | 58 cm | Sol duvar (D görünüşü) iç yüzünden kasa sol kenarına |

Bonus (varsa): kanat bölüm genişlikleri, radyatör dilim sayısı ve genişliği,
radyatörün sol duvara mesafesi (kabul: 173 cm).

## 9. Sonraki adım

Röleve tamamlandı; tasarım önerileri [`semalar.md`](./semalar.md) içinde.
Yerinde ölçüm yapıldıktan sonra `src/config/room.js` güncellenir ve
`npm run all:schemes` ile bütün çizim ve metraj seti yeniden üretilir.
