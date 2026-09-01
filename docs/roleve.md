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
| `reference/05-arka-duvar-pencere.jpg` | **Arka duvar.** Büyük pencere, tül perde, altında dilimli radyatör. Karenin **solu = odanın sağ duvarı** (tezgâh, yazıcı, mantar pano, kupa, üstte ankastre dolap bankosu ve çerçeveli belge); **sağı = odanın sol duvarı** (lila, sandalye). |

## 2. El krokisinden okunanlar — **yüksek güven**

| Okunan | Değer | Modeldeki karşılığı |
|---|---|---|
| Alt kenar | `20 cm + 350 cm` = **370 cm** | `room.width` |
| Sol kenar | **270 cm** | `room.depth` |
| Kapı notu | `(120 cm kapı)` | `door.width` |
| Üst kenar | `120 cm` + eleman + `150 cm` | 370 cm ile tutarlı |
| `Masa = 160*75` | **160 × 75 cm** | `M1` |
| `Dolap = 80` | **80 cm** | `D1` |
| Üçüncü satır `… = 80` | *modelde yok* | *aşağıya bakınız* |

### Krokide okunamayan satır — modele alınmadı
Krokinin üçüncü donatı satırındaki kelime el yazısından çözülemedi (“Kanturi /
Kitaplık / Konsol” okumaları mümkün). Bir dönem 80 cm'lik raflı bir modül (`K2`)
olarak modele girmişti.

**Bu eleman odada yok ve artık modelde de yok.** Hiçbir fotoğrafta görünmüyor,
kullanıcı da olmadığını teyit etti; yerleşim önerilerinin hiçbirinde **yeni eşya
alınmıyor**, bu yüzden `K2` (ve önerilen sehpa `Y1`, ikinci sandalye `S3`) modelden
tamamen kaldırıldı. Kroki bu satırıyla bir istek belirtiyor olabilir; ileride
alınırsa `src/config/room.js` içine yeni bir kayıt eklemek yeterli.

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
| Dolap duvarı alt kotu | 75 cm ⚠️ | Foto 01, tezgâhın (72 cm) hemen üstü — **ölçülmeli** |
| Dolap duvarı üst kotu | 288 cm | Tavana yakın, ince gölge boşluğu var |
| Dolap duvarı derinliği | 35 cm | Tipik dolap derinliği |
| Panel sayısı | **3** | Kullanıcı teyidi: duvarın tamamı üç panelle kaplı (3 × 90 cm) |
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
- [ ] Dolap duvarının **alt kotu** (döşemeye kadar mı iniyor, tezgâhta mı bitiyor) ve derinliği
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

## 8. Beş fotoğrafın topluca yeniden okunması (R01 denetimi)

Tüm fotoğraflar birlikte tekrar karşılaştırıldı. Bulgular:

### Düzeltilen — gerçek hata
**Sağ duvardaki eleman alçak bir kredenza değil, masa yüksekliğinde sürekli bir
tezgâh.** Model onu 90 × 45 × 62 cm'lik bir "yazıcı altlığı" olarak tutuyordu.
Fotoğraf 05 net gösteriyor: sağ duvar boyunca **masa yüksekliğinde (≈72 cm) bir
tezgâh** var, ön ucunda fotokopi/yazıcı, pencere ucunda kupa, altında açık raflarda
dosya/dergi, üstünde mantar pano. **130 × 60 × 72** olarak düzeltildi; M1 masası ile
birlikte L oluşturuyor.

### Eklenen — modelde hiç yoktu
| Poz | Eleman | Kaynak |
|---|---|---|
| **T8** | Mantar pano (70 × 52), tezgâhın üzerinde | Foto 05 |
| **E10** | Kupa/ödül, tezgâhın pencere ucunda | Foto 05 |
| — | Tezgâhın altındaki açık raf ve içindeki dosyalar | Foto 05 |

### ⚠️ Krokide aritmetik tutmuyor
Krokinin **üst** kenarında kapının iki yanına `120cm` ve `150cm` yazıyor:
120 + 120 (kapı) + 150 = **390**. Krokinin **alt** kenarı ise 20 + 350 = **370**.
Arada **20 cm** fark var — el krokisinde bir kaydırma.

Model 370'i ve 120 cm kapıyı esas aldı, farkı panel genişliklerine dağıttı
(P1 95 / P2 35 / P3 120). Yani **bu üç panel genişliği krokiden doğrudan okunmuş
değil** — aşağıdaki listeye eklendi.

### Çözülemeyen — fotoğraflar çelişiyor
**Dolabın hangi duvara dayandığı ve aynanın önündeki boşluk.**
Foto 01 ve 02'de dolap ile kapı kasası arasında geniş bir sarı panel var ve ayna
oraya asılı. Ölçeklenmiş okuma ~100 cm veriyor; modeldeki yerleşim (dolap sol
duvarda, sırtı x=0'da) yalnızca 40 cm bırakıyor. İki fotoğraf da ultra geniş açılı
ve dolap kare kenarında kaldığı için gerilmiş. **Dolabın sol duvara mı yoksa ön
duvara mı dayandığı bu kareden kesin çıkarılamıyor.**

Bu, D görünüşünü ve aynanın konumunu etkiliyor. Aşağıdaki listeye eklendi.

## 9. ⚠️ Yerinde alınması gereken ölçüler

Bu dört değer alınırsa `src/config/room.js → windows[0]` içinde güncellenir ve
plan, C görünüşü, kesitler, 3B model ve metraj birlikte düzelir.

| # | Ölçü | Modeldeki kabul | Nasıl ölçülür |
|---|---|---:|---|
| 1 | **Denizlik üst kotu** (döşemeden) | 80 cm | Döşeme kaplamasından iç denizliğin üst yüzüne |
| 2 | **Kasa dış yüksekliği** | 130 cm | Denizlik üstünden kasa üst dış kenarına |
| 3 | **Kasa dış genişliği** | 285 cm | Yatay, kasa dış kenarından dış kenarına |
| 4 | **Sol duvara mesafe** | 58 cm | Sol duvar (D görünüşü) iç yüzünden kasa sol kenarına |

**Ön duvar (bölüntü) — kroki çelişkisi yüzünden:**

| # | Ölçü | Modeldeki kabul |
|---|---|---:|
| 5 | Sol duvar ile kapı kasası arası sarı panel (P1) | 95 cm |
| 6 | Yeşil düşey şerit genişliği (P2) | 35 cm |
| 7 | Kapı kasası ile sağ duvar arası sarı panel (P3) | 120 cm |

**Dolap ve ayna:**

| # | Ölçü | Modeldeki kabul |
|---|---|---:|
| 8 | Dolap hangi duvara dayanıyor + sol/ön duvara mesafesi | sol duvar, ön duvardan 5 cm |
| 9 | Aynanın sol duvara mesafesi ve genişliği | 58–92 cm, 34 cm |

**Sağ duvar tezgâhı:**

| # | Ölçü | Modeldeki kabul |
|---|---|---:|
| 10 | Tezgâh uzunluğu ve derinliği | 130 × 60 cm |
| 11 | Tezgâhın ön duvara mesafesi | 140 cm |

**Sağ duvar dolabı:**

| # | Ölçü | Modeldeki kabul |
|---|---|---:|
| 15 | **Dolabın alt kotu** — döşemeye kadar mı iniyor? | 75 cm ⚠️ |
| 16 | Dolap derinliği / bir panelin genişliği | 35 cm / 90 cm |

Bonus: pencere kanat bölüm genişlikleri, radyatör dilim sayısı, radyatörün sol
duvara mesafesi (kabul: 173 cm).

## 10. Sonraki adım

Röleve tamamlandı; tasarım önerileri [`secenekler.md`](./secenekler.md) içinde.
Yerinde ölçüm yapıldıktan sonra `src/config/room.js` güncellenir ve
`npm run all:schemes` ile bütün çizim ve metraj seti yeniden üretilir.
