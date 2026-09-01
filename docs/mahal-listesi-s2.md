# Mahal ve Donatı Listesi — Ş-2 Yeniden yerleşim

**Oda Tasarimi / Room Design** · R00 · 2026-09-01

> **Ş-2 · Yeniden yerleşim** — Ş-1 paleti + mobilya yeniden konumlanıyor. Kapı tam açılıyor, kullanıcı girişi görüyor.
> Modelin ortaya çıkardığı dört sorunu birden çözer: (1) kapı süpürme yayı tamamen boşaltılır, kanat neredeyse tam açılır; (2) masa arkaya alınıp kullanıcı girişe dönük oturur — idari bir odada gelen kişiyi görmek gerekir; (3) kapı ile masa arasında net bir ziyaretçi alanı oluşur; (4) masa pencereye yakın ama ekran pencereye PARALEL duruyor: ne ekranda pencere yansıması ne de kullanıcının gözünde karşıdan gelen parlama oluşuyor. Depolama sol ve arka duvarda toplanır, radyatörün önü boş bırakılır. Ankastre dolap bankosu, pencere ve kapı yerinde kalır — taşınmaz.
>
> **Metraj notu:** Ş-1 boya kalemleri + mobilya taşıma/montaj. Yeni mobilya alımı yok; mevcut parçalar yeniden konumlanır. Tül perde pencere boyunca tamamlanır (ekran yansımasını keser). Priz konumları gözden geçirilmeli: masa arkaya alındığı için arka duvarda / döşemede priz gerekiyor.

Bu dosya `src/config/room.js` verisinden **otomatik üretilir** (`npm run schedule`). Elle düzenlemeyin.

## 1. Mahal metrikleri

| | |
|---|---|
| Net ölçüler | 370 × 270 × 290 cm |
| Net alan | **9.99 m²** |
| Net hacim | 28.97 m³ |
| Çevre | 12.80 m |
| Brüt duvar yüzeyi | 37.12 m² |
| Mobilya ayak izi | 3.20 m² (%32) |
| Serbest dolaşım alanı | 6.79 m² |
| Kapı kanadı azami açıklık | ~178° |

## 2. Yüzey metrajı

| Poz | İş kalemi | Miktar | Birim |
|---|---|---:|---|
| Y‑01 | Döşeme kaplaması (terrazzo, 33×33) | 9.99 | m² |
| Y‑02 | Asma tavan (60×60 mineral plaka, T24) | 9.99 | m² |
| Y‑03 | Sıvalı duvar boyası (sol + sağ + arka) | 26.39 | m² |
| Y‑04 | Bölüntü dolu panel — sarı | 4.41 | m² |
| Y‑05 | Bölüntü dolu panel — yeşil şerit | 0.72 | m² |
| Y‑06 | Vasistas camı (telli/buzlu) + alüminyum çerçeve | 2.48 | m² |
| Y‑07 | Tavan yeşil bandı (boya) | 0.67 | m² |
| Y‑08 | Kapı K1 (120×205), kasa + kanat + donanım | 1 | ad |
| Y‑09 | Ankastre üst dolap bankosu AD1 (ön yüz) | 2.86 | m² |
| Y‑10 | Ankastre üst dolap bankosu — uzunluk | 2.70 | m |
| Y‑11 | Tavan armatürü (Sivaalti floresan armatur 60x60) | 2 | ad |

Bölüntü dolu panel toplamı: 5.13 m² · Kapı boşluğu: 2.46 m²

## 3. Donatı listesi

| Poz | Ad | Tip | G×D×Y (cm) | Konum (x,y) | Açı | Ayak izi m² |
|---|---|---|---|---|---|---:|
| **M1** | Calisma masasi | Mobilya | 160×75×75 | (265, 130) | 0° | 1.20 |
| **D1** | Cift kanatli elbise/evrak dolabi | Mobilya | 80×55×185 | (28, 148) | -90° | 0.44 |
| **K2** | 80 cm rafli modul (kitaplik kabul edildi) | Mobilya | 80×35×185 | (23, 230) | -90° | 0.28 |
| **S1** | Yonetici calisma koltugu | Mobilya | 62×62×112 | (265, 197) | 180° | 0.38 |
| **S2** | Misafir sandalyesi (istiflenebilir) | Mobilya | 48×54×82 | (265, 55) | 0° | 0.26 |
| **A1** | Yazici altligi / alcak dolap | Mobilya | 90×45×62 | (345, 215) | 90° | 0.41 |
| **C1** | Ayakli askilik | Mobilya | 38×38×178 | (340, 30) | 0° | 0.14 |
| **W1** | Pedalli cop kovasi | Mobilya | 30×30×42 | (230, 138) | 0° | 0.09 |
| **E1** | 24" monitor | Ekipman | 55×20×42 | (275, 112) | 0° | 0.11 |
| **E2** | Masaustu bilgisayar | Ekipman | 20×45×42 | (205, 120) | 0° | 0.09 |
| **E3** | Klavye | Ekipman | 44×15×3 | (275, 148) | 0° | 0.07 |
| **E4** | Mouse | Ekipman | 7×11×4 | (312, 150) | 0° | 0.01 |
| **E5** | Klasor / not defteri | Ekipman | 24×32×3 | (325, 145) | -6° | 0.09 |
| **E6** | Kalemlik (hasir) | Ekipman | 11×11×20 | (235, 110) | 0° | 0.01 |
| **E7** | Zimba / kutu | Ekipman | 12×7×4 | (228, 130) | 0° | 0.01 |
| **E8** | Bardak altligi | Ekipman | 11×11×1 | (244, 134) | 0° | 0.01 |
| **E9** | Fotokopi / yazici | Ekipman | 58×42×44 | (345, 215) | 90° | 0.24 |
| **X1** | Mavi klasor | Esya | 8×30×32 | (10, 129) | 4° | 0.03 |
| **X2** | Eski CRT monitor | Esya | 34×32×28 | (29, 133) | -6° | 0.13 |
| **X3** | Kutu oyunu | Esya | 30×22×6 | (29, 167) | 102° | 0.09 |
| **X4** | Futbol topu | Esya | 22×22×22 | (46, 86) | 0° | 0.05 |
| **X5** | Karton rulo | Esya | 38×12×12 | (30, 66) | 0° | 0.05 |

> Konum değerleri elemanın **plan merkezini** verir; dönme de merkez etrafındadır.

## 4. Duvar elemanları

| Poz | Ad | Duvar | Yatay konum (u) | Montaj kotu | Ölçü |
|---|---|---|---|---|---|
| **T1** | Duvar saati (OSYM) | A / ön | 232 cm | +228 cm | Ø30 cm |
| **T2** | Manzara tablosu | A / ön | 300 cm | +198 cm | 46×40 cm |
| **T3** | Ayna (sari askili) | A / ön | 75 cm | +152 cm | 34×40 cm |
| **T4** | Cerceveli belge + bayrak | B / sağ | 35 cm | +248 cm | 52×66 cm |
| **T5** | Anahtar (aydinlatma) | A / ön | 237 cm | +122 cm | 8×8 cm |
| **T6** | Priz | B / sağ | 140 cm | +40 cm | 8×8 cm |
| **T7** | Priz | D / sol | 90 cm | +40 cm | 8×8 cm |

## 5. Renk / malzeme paleti

| Anahtar | Yüzey | Hex | RAL (yaklaşık) |
|---|---|---|---|
| `yellow` | Bölüntü panel — sıcak kırık beyaz | `#e7e1d5` | RAL 9001 yakını |
| `green` | Düşey vurgu şeridi — adaçayı | `#4f7a63` | RAL 6021 koyu |
| `curtain` | Tül perde | `#efe9dd` | - |
| `radiator` | Radyatör (beyaz) | `#f4f2ee` | RAL 9016 |
| `greenLight` | Tavan bandı — açık adaçayı | `#7d9c87` | RAL 6021 |
| `lilac` | Duvar boyası — sıcak nötr | `#dcd7ce` | RAL 9002 |
| `offwhite` | Dolap kapağı — açık | `#efebe3` | RAL 9010 |
| `beech` | Kayin/ceviz melamin | `#c98b4b` | - |
| `beechDark` | Koyu melamin | `#8d5a2b` | - |
| `greyLaminate` | Kapi kanadi gri laminat | `#adaaa4` | RAL 7038 |
| `floorGrey` | Doseme karosu | `#989ca0` | - |
| `ceilingTile` | Asma tavan plakasi | `#e9e2d3` | - |
| `blackLeather` | Koltuk suni deri | `#26262a` | - |
| `blackFabric` | Sandalye kumasi | `#33343a` | - |
| `steelDark` | Metal aksam (koyu) | `#3a3c40` | - |
| `steelLight` | Metal aksam (acik) | `#a7abb0` | - |
| `chrome` | Krom | `#c8ccd2` | - |
| `aluminium` | Aluminyum profil | `#9ea3a8` | - |
| `plasticGrey` | Gri plastik | `#b9bcbe` | - |

## 6. Notlar

- **M1** — Kroki notu: Masa = 160x75. On duvara paralel, kullanici +Y tarafinda oturur. ONEMLI: masanin sol ucu kapi kanadinin acilma yayina 1-2 cm mesafede; kapi pratikte ~150 dereceden fazla acilamaz (bkz. docs/roleve.md, tespit T-3).
- **D1** — Sirti sol duvarda. Boylece on duvardaki sari panelin (x 55-95) ustu bos kalir ve foto 03teki ayna oraya asilir.
- **K2** — KROKI OKUNAMADI: ucuncu satirdaki 80 cm lik eleman. Kitaplik kabul edildi; farkli ise type ("wardrobe" | "bookcase" | "credenza") ve name alanlarini degistirin.
- **A1** — Arka-sag kosede, uzerinde fotokopi/yazici var (foto 01 sag kenar).

---
Ölçülerin kaynağı ve güven düzeyi için: [`docs/roleve.md`](./roleve.md)
