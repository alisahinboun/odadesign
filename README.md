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

Belirli bir renk + yerleşim için:

```bash
npm run check    -- --palet=p3 --yerlesim=y3
npm run drawings -- --palet=p3 --yerlesim=y3   # docs/drawings/*-p3y3.svg
npm run secenekler                             # docs/secenekler.md'yi modelden üretir
```

`npm run build` çıktısı **tek bir HTML dosyasıdır**; sunucu gerekmeden
e‑posta ile gönderilebilir veya USB'den açılabilir.

---

## Başkasıyla paylaşmak — Netlify

`dist/index.html` **tek başına çalışan** bir dosya: dışarıdan sadece yazı
tipini çekiyor, onu da çekemezse yedek yazı tipiyle açılıyor. Sunucu tarafında
hiçbir şey gerekmiyor.

**En hızlısı (2 dakika):**

1. `npm install && npm run build`
2. [app.netlify.com/drop](https://app.netlify.com/drop) adresini açın
3. `dist` klasörünü sayfaya sürükleyin

Adres hemen çıkar (`rastgele-isim.netlify.app`). Hesap açmadan da olur ama
hesap açarsanız adres kalıcı olur ve adı değiştirilebilir.

**Depoya bağlamak (her push'ta kendi güncellensin):** Netlify'de
*Add new site → Import an existing project* → bu depoyu seçin. Ayar sormaz;
[`netlify.toml`](netlify.toml) komutu (`npm run build`) ve klasörü (`dist`)
zaten söylüyor. Yalnızca hangi daldan yayınlanacağını seçin.

**Netlify'de neler çalışır:** hepsi. Üstelik iki şey claude.ai'deki gömülü
sürümden daha iyi çalışır:

| | Gömülü sayfa | Netlify |
|---|---|---|
| Eşya taşıma, ölçme, renk/yerleşim, gizle‑göster | ✅ | ✅ |
| Resim indirme (PNG) | ✅ onay kutusuyla | ✅ doğrudan |
| **3B model indirme (GLB / OBJ)** | ❌ tarayıcı izin vermiyor | ✅ |
| **Odada yürüme (G) — fare kilidi** | kısıtlı | ✅ tam |

### Eşyaları çevirme

Taşıma kipinde bir eşya seçtiğiniz anda ekranda **çevirme çubuğu** çıkar:
`⟲ 90° · ⟲ 15° · 15° ⟳ · 90° ⟳`. Klavyede **R** sağa, **Shift+R** sola çevirir.
Dokunmatik cihazlarda R tuşu olmadığı için çubuk tek yoldur; telefonda tam
genişlikte, parmak boyutunda görünür. Masayı çevirirseniz üstündeki ekran,
klavye ve diğer eşyalar onunla birlikte döner; her adımda denetim yeniden
çalışır (çakışma, kapı yayı, pencere ve radyatör önü).

### Dolaba duvar kâğıdı

Sağ duvardaki dolap kapaklarına tropik bir duvar kâğıdı kaplanmış hâli
panelden **açılıp kapatılabilir** (Dolaba duvar kâğıdı bölümü).

Desen iki kaynaktan gelebilir:

1. **Gerçek görsel (tercih edilen).** Bir görseli base64 olarak HTML'e gömün:
   ```bash
   npm run duvar-kagidi -- reference/duvar-kagidi.jpg
   npm run build
   ```
   Komut görseli 2048 px'e ölçekler, JPEG'e sıkıştırır ve
   `src/assets/wallpaper.js` dosyasını yeniden yazar. Dış dosya kalmaz; tek
   dosyalık dağıtım bozulmaz (dist yaklaşık 300–600 kB büyür).
2. **Çizilmiş desen (yedek).** Gömülü görsel yoksa `src/lib/textures.js →
   muralTexture()` içinde `<canvas>` üzerine çizilen prosedürel tropik desen
   kullanılır. Yani görsel olmadan da her şey çalışır. Kâğıt tekrar etmez:
270 × 213 cm'lik dolap yüzeyi boyunca tek parça akar, her kapak kendi dilimini
gösterir (`mat.mural(u0, v0, du, dv)`), gerçekte de duvar kâğıdı böyle kesilir.
Kapatınca kapaklar sarı-beyaz hâline döner; ölçüler, yerleşim ve denetim
sonuçları değişmez. B görünüşü paftası da açık/kapalı hâli yansıtır.

### Telefonda

Arayüz telefon ve tablette ayrı çalışır:

- Sağdaki panel **alt sayfaya** döner ve kapalı başlar — önce odayı görürsünüz,
  **Seçenekler** düğmesiyle açılır, **✕** ile kapanır.
- Görünüş düğmeleri alt kenarda tek satırda, yana kaydırılır; adları kısalır.
- Tek parmak döndürür, iki parmak yakınlaştırıp kaydırır, dokunmak eşya seçer.
  Eşya taşıma ve ölçme parmakla çalışır.
- Ekran yüksekliği ve GPU sınırlı olduğu için **GTAO gölgelemesi kapalı** başlar
  ve piksel oranı 1,5 ile sınırlanır; panelden açabilirsiniz.
- "Odada yürü" klavye (WASD) ve fare kilidi istediği için dokunmatikte gizlenir.

**Dikkat:** Netlify adresi **herkese açıktır**; adresi bilen görür. Arama
motorlarına düşmesini istemiyorsanız `dist/` içine `robots.txt` koyun
(`User-agent: *` / `Disallow: /`); gerçek şifre koruması ücretli planda.

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

Oda bir **rehber öğretmen odası** olacak. İki kısıt var: **yeni eşya alınmıyor**
ve **kapı içeri açılıyor** (dışa çevrilemiyor). Öneriler buna göre seçildi:
öğrenci masanın karşısına değil ~90° açıyla oturmalı, oturunca kapı görülmeli,
ekrana pencereden yansıma gelmemeli.

**Renk** (hiçbir şey taşınmaz, sadece boya): Şu anki · Sakin yeşil ·
Açık mavi‑gri · Toprak tonları
**Yerleşim** (boya değişmez, **yeni eşya alınmaz**): Şu anki · Masayı geri çek ·
Tezgâhla L kur · Masayı çek + dolabı arkaya al

İkisi bağımsız — istediğiniz gibi eşleştirin. Ayrıntı ve gerekçeler:
[`docs/secenekler.md`](docs/secenekler.md)

```bash
npm run check    -- --palet=p3 --yerlesim=y3
npm run drawings -- --palet=p3 --yerlesim=y3
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
    furniture.js        masa, dolap, koltuklar, tezgâh, portmanto…
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
