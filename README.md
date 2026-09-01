# Oda Tasarımı — Parametrik 3B Model

Fotoğraflar ve el krokisinden yeniden kurulmuş, **iç mimarın doğrudan
kullanabileceği** bir oda modeli: tarayıcıda gezilebilen 3B görselleştirici,
ölçülendirilmiş 2B teknik çizimler, mahal/metraj listesi ve
SketchUp / Blender / 3ds Max'e aktarım.

**Oda:** ofis / idari oda · 370 × 270 × 290 cm · net 9,99 m²
Arka duvarda 285 cm genişliğinde pencere ve altında dilimli radyatör; giriş duvarı
alüminyum bölüntü (120 cm kapı + vasistas); sağ duvarda ankastre üst dolap bankosu.

<!-- kapak -->
| | |
|---|---|
| **3B görselleştirici** | `npm run dev` → tarayıcıda etkileşimli model |
| **Renk + yerleşim seçenekleri** | 4 renk × 3 yerleşim, panelden bağımsız seçilir → [`docs/secenekler.md`](docs/secenekler.md) |
| **Eşyaları taşı** | Sürükle‑bırak; her hareket sonrası anında denetim |
| **2B çizimler** | `npm run drawings` → `docs/drawings/*.svg` (plan, 4 görünüş, **2 kesit**, tavan, döşeme) |
| **Metraj / mahal listesi** | `npm run schedule` → `docs/mahal-listesi.md` + `.csv` |
| **Model denetimi** | `npm run check` → çakışma, sınır, kapı süpürme ve ergonomi kontrolü |
| **Dışa aktarım** | Görselleştiriciden **GLB / OBJ / PNG** |

---

## Hızlı başlangıç

```bash
npm install
npm run dev        # http://localhost:5173
```

Diğer komutlar:

```bash
npm run check        # modeli denetle (her ölçü değişikliğinden sonra çalıştırın)
npm run drawings     # 2B teknik çizimleri üret
npm run schedule     # mahal ve donatı listesini üret
npm run all          # üçünü birden
npm run all:schemes  # üçünü, TÜM tasarım şemaları için
npm run build        # tek dosyalık dağıtım (dist/index.html) — paylaşılabilir
```

Belirli bir şema için:

```bash
npm run check    -- --sema=s2
npm run drawings -- --sema=s2      # docs/drawings/*-s2.svg
```

`npm run build` çıktısı **tek bir HTML dosyasıdır**; sunucu gerekmeden
e‑posta ile gönderilebilir veya USB'den açılabilir.

---

## Modeli nasıl değiştirirsiniz

Tüm proje **tek bir dosyadan** beslenir:

### 👉 `src/config/room.js`

Bir ölçüyü orada değiştirdiğinizde 3B model, kotalar, teknik çizimler ve metraj
listesi **birlikte** güncellenir. Örnekler:

```js
// Oda 20 cm daha derin olsun:
export const room = { width: 370, depth: 290, height: 290, … };

// Masayı 20 cm sağa kaydır (pos = elemanın PLAN MERKEZİ):
{ id: 'M1', …, pos: [303, 97], rot: 0 }

// Dolabı 90° çevir (merkez etrafında döner, yeri kaymaz):
{ id: 'D1', …, rot: 0 }

// Kapıyı genişlet — bölüntü panelleri toplamı oda genişliğine eşit kalmalı:
panels: [ {id:'P1', kind:'solid', width: 85,  color:'yellow'},
          {id:'D1', kind:'door',  width: 130},
          {id:'P2', kind:'solid', width: 35,  color:'green' },
          {id:'P3', kind:'solid', width: 120, color:'yellow'} ]
```

Değişiklikten sonra:

```bash
npm run check && npm run drawings && npm run schedule
```

`npm run check` panel toplamını, oda sınırını, mobilya çakışmalarını, ekipmanın
taşıyıcı üstünde durup durmadığını, **kapı kanadının çarpmadan kaç derece
açıldığını** ve dolaşım boşluklarını denetler.

### Koordinat sistemi

```
        +Y (arka duvar, y = 270)
         ^
         |   +-------------------------------+
         |   |                               |
         |   | SOL (x=0)          SAĞ (x=370)|
         |   |                               |
         |   +---------[ KAPI ]--------------+
         |   ÖN DUVAR (y=0) — alüminyum bölüntü
         +-----------------------------------------> +X
        (0,0) = ön‑sol iç köşe · birim: cm · Z yukarı
```

- `pos: [x, y]` daima elemanın **plan merkezi**
- `rot` derece, **saat yönünün tersi**, merkez etrafında
- Bir mobilyanın “ön yüzü” yerel **+Y** yönüdür; `rot: -90` onu **+X**'e çevirir

---

## Görselleştirici

| Özellik | Nasıl |
|---|---|
| Fotoğraflarla karşılaştırma | Üst bardaki **Foto 01 / 02 / 03** ön ayarları — kapı da o fotoğraftaki gibi açılır |
| Katmanlar | Sağ panelden döşeme, tavan, her duvar, mobilya, ekipman… ayrı ayrı kapatılır |
| Otomatik kesit | Kameraya bakan duvar kendiliğinden gizlenir (“bebek evi” görünümü) |
| Ölçü kotaları | Katmanlar → *ÖLÇÜ: plan kotaları* / *düşey kotalar* |
| Nokta‑nokta ölçme | **M** tuşu, ardından iki noktaya tıklayın → cm cinsinden gerçek mesafe |
| Parça bilgisi | Herhangi bir parçaya tıklayın → poz no, ölçü, konum, röleve notu |
| Odada yürüme | **G** tuşu · W A S D + fare · **Shift** koş · **Esc** çık (göz kotu 165 cm) |
| Kapı açıklığı | Sağ panelden kaydırıcı; çarpmadan azami açı yanında yazar |
| Aydınlatma | Pozlama ve koridordan gelen gün ışığı ayarlanabilir |
| Dışa aktarım | GLB · OBJ · PNG (1× ve 4×) |
| Tasarım şeması | Sağ panelden Ş‑0 / Ş‑1 / Ş‑2 arası geçiş — kamera açısı korunur |
| Ortam gölgelemesi | GTAO; köşelerde ve mobilya altında yumuşak gölge, kapatılabilir |

---

## Renk ve yerleşim seçenekleri

Oda bir **rehber öğretmen odası** olacak. Öneriler buna göre seçildi: öğrenci
masanın karşısına değil, ~90° açıyla oturmalı; renkler sakin olmalı; kapıdan
bakınca öğrenci doğrudan görünmemeli.

**Renk** (hiçbir şey taşınmaz, sadece boya): Şu anki · Sakin yeşil ·
Açık mavi‑gri · Toprak tonları
**Yerleşim** (boya değişmez): Şu anki · Görüşme köşesi · Kapı dışa açılsın

İkisi bağımsız — istediğiniz gibi eşleştirin. Ayrıntı ve gerekçeler:
[`docs/secenekler.md`](docs/secenekler.md)

```bash
npm run check    -- --palet=p2 --yerlesim=y3
npm run drawings -- --palet=p2 --yerlesim=y3
npm run all:schemes                     # anlamlı 5 kombinasyon, hepsi
npm run foy                             # yazdırılabilir ölçü föyü
```

---

## Dışa aktarım ve diğer programlar

**GLB** (önerilen) — görselleştiricideki *İhracat → GLB indir*:
ölçek **1 birim = 1 metre** (glTF standardı), malzemeler ve dokular gömülü.

| Program | Açma yolu |
|---|---|
| Blender | `File → Import → glTF 2.0 (.glb)` |
| SketchUp | 2021+ sürümlerde `File → Import`, eski sürümlerde glTF eklentisi |
| 3ds Max | `File → Import` (2023+ yerleşik glTF) |
| Rhino / Twinmotion / Enscape / D5 | Doğrudan `.glb` içe aktarımı |
| Revit | glTF importer eklentisi |
| Unreal / Unity | Sürükle bırak |

**OBJ** — geometri + UV, malzemesiz; eski iş akışları için.
**SVG çizimler** — `docs/drawings/*.svg` dosyaları AutoCAD, Illustrator, Affinity
ve Inkscape ile açılır; 1:25 ölçekte (karşılaştırma paftası 1:40), ölçüler cm.
Hangi paftanın ne içerdiği: [`docs/drawings/00-pafta-listesi.md`](docs/drawings/00-pafta-listesi.md)

---

## Dizin yapısı

```
src/
  config/
    room.js             ⭐ TEK DOĞRULUK KAYNAĞI — tüm ölçüler burada
    design.js           renk ve yerleşim seçenekleri
  lib/
    analysis.js         ayak izi, çakışma, kapı süpürme açısı, metrikler
    geom.js             cm→m dönüşümü, kutu/silindir/yuvarlatılmış kutu üreticileri
    materials.js        malzeme kütüphanesi
    textures.js         prosedürel dokular (hiç dış dosya yok)
  model/
    shell.js            döşeme, duvarlar, bölüntü, kapı, asma tavan, koridor
    furniture.js        masa, dolap, kitaplık, koltuklar, kredenza, portmanto…
    equipment.js        monitör, PC, yazıcı, duvar elemanları (saat, tablo, ayna…)
    index.js            derleyici + aydınlatma rigi
  viewer/
    dimensions.js       3B ölçü kotaları
    render.js           GTAO ortam gölgelemesi + FXAA işleme hattı
    drag.js             eşya taşıma + anlık denetim
  export/gltf.js        GLB / OBJ / PNG ihracatı
  main.js               görselleştirici arayüzü
scripts/
  check.mjs             model denetimi
  drawings.mjs          2B teknik çizim üreteci (plan · 4 görünüş · 2 kesit · tavan · döşeme)
  schedule.mjs          mahal ve donatı listesi üreteci
  build-all.mjs         tüm şemalar için denetim + çizim + metraj
  karsilastirma.mjs     iki seçeneği yan yana koyan sunum paftası
  olcu-foyu.mjs         yazdırılıp yanınıza alınacak ölçü listesi + numaralı plan
docs/
  roleve.md             ⚠️ röleve notları, varsayımlar, yerinde kontrol listesi
  secenekler.md         renk ve yerleşim seçenekleri: gerekçe ve karşılaştırma
  mahal-listesi.md      metraj + donatı listesi (üretilen)
  donati-listesi.csv    Excel için (üretilen)
  drawings/
    00-pafta-listesi.md indeks: hangi pafta ne içeriyor (üretilen)
    *.svg               şema başına 9 pafta + 2 karşılaştırma paftası (üretilen)
reference/              5 kaynak fotoğraf + el krokisi
                        05 = arka duvar (pencere, perde, radyatör)
```

---

## ⚠️ Önemli uyarı

Bu model **yerinde röleve değildir**; 3 fotoğraf ve 1 el krokisinden çıkarılmıştır.
Krokiden okunan ölçüler (370 × 270, kapı 120, masa 160×75, dolap 80) yüksek
güvenilirliktedir; **yükseklikler, kot değerleri ve mobilya konumları
fotoğraf yorumudur.**

Arka duvar hiçbir fotoğrafta görünmemektedir ve röleve eksiktir.
Krokideki üçüncü 80 cm'lik elemanın adı okunamamıştır.

Arka duvar ilk turda hiç görünmüyordu; sonradan gelen fotoğrafla pencere ve
radyatör modele girdi, ancak **pencere ölçüleri hâlâ fotoğraf oranlamasıdır.**
Geniş açı nedeniyle düşey ölçülerde belirsizlik yüksek — `docs/roleve.md` bölüm 8
yerinde alınması gereken 4 ölçüyü listeler.

**İmalata girmeden önce [`docs/roleve.md`](docs/roleve.md) içindeki kontrol
listesini yerinde doğrulayın.**
