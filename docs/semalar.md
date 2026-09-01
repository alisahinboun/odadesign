# Tasarım Şemaları

**Proje:** Ofis / idari oda, 370 × 270 × 290 cm, net 9,99 m²
**Revizyon:** R00 · 2026‑09‑01

Şemalar `src/config/schemes.js` içinde tanımlıdır. Ş‑0 mevcut durumdur; diğerleri
onun üzerine **fark** olarak yazılır — yalnızca değişen renk ve konum belirtilir.

Her şema için ayrı çizim seti ve metraj üretilir:

```bash
npm run check    -- --sema=s2      # denetim
npm run drawings -- --sema=s2      # docs/drawings/*-s2.svg
npm run schedule -- --sema=s2      # docs/mahal-listesi-s2.md
npm run all:schemes                # üçünü de, hepsi için
npm run compare                    # karşılaştırma paftası (Ş-0 vs Ş-2)
node scripts/karsilastirma.mjs s0 s1
```

**Sunum paftası:** `docs/drawings/karsilastirma-s0-s2.svg` — iki planı yan yana,
kapı süpürme sektörü taralı, altında ölçülebilir fark tablosu. ▲ iyileşme,
▼ gerileme (kabul edilebilir sınırlar içinde), işaretsiz fark yok.

Görselleştiricide sağ paneldeki **Tasarım şeması** bölümünden anında geçilir;
kamera açısı korunur, böylece iki şema aynı bakıştan karşılaştırılabilir.

---

## Ş‑0 · Mevcut durum · röleve

Fotoğraf ve krokiden çıkarılan hâl. Karşılaştırma tabanı.

Okul boyası paleti (RAL 1023 sarı panel + RAL 6018 yeşil şerit), mobilya olduğu yerde.

**Denetim sonucu:** 0 hata, 1 uyarı.

---

## Ş‑1 · Sakin palet · öneri

**Yerleşim aynı, yalnızca yüzey renkleri değişir. En düşük maliyetli müdahale.**

### Gerekçe
> **Düzeltme (R01):** Bu şemanın ilk gerekçesi "oda penceresiz" varsayımına
> dayanıyordu. Foto 05 bunu çürüttü — arka duvarda 285 cm genişliğinde bir pencere
> var. Gerekçe aşağıdaki gibi yeniden yazıldı.

Odanın asıl ışık kaynağı arka duvardaki pencere. Sorun ışığın yokluğu değil:
**pencerenin bulunduğu duvarın tamamı doygun yeşile boyalı**, yani gelen ışığın
büyük bölümü daha odaya yayılmadan bu yüzeyde yutuluyor, yansıyan az ışık da
yeşile boyanıyor. Karşıda bina yakın olduğu için zaten difüz ve az ışık geliyor.

Öneri, ışığın çarptığı ve yansıdığı yüzeyleri açık nötre almak; yeşil **tek vurgu**
olarak kalıyor ama okul kimliğini koruyacak şekilde adaçayı tonuna çekiliyor.

### Değişen yüzeyler

| Yüzey | Mevcut | Öneri |
|---|---|---|
| Bölüntü panelleri | `#f2c11c` RAL 1023 | `#e7e1d5` sıcak kırık beyaz |
| Düşey vurgu şeridi | `#3faa35` RAL 6018 | `#4f7a63` adaçayı |
| Tavan bandı | `#7cc623` | `#7d9c87` açık adaçayı |
| Sıvalı duvarlar (sol) | `#bdb5c9` lila | `#dcd7ce` sıcak nötr |
| **Arka (pencere) duvarı** | `#3faa35` doygun yeşil | `#4f7a63` adaçayı — ışık yutmayı azaltır |
| Ankastre dolap kapakları | sarı + krem | iki nötr ton |

### Kapsam
Boya: bölüntü panelleri + sol/sağ duvar + **arka (pencere) duvarı** + tavan bandı.
Ankastre dolap kapakları yeniden kaplama. Pencere doğraması ve radyatör yerinde
kalır. **Mobilya alımı yok, taşıma yok.**

**Denetim sonucu:** 0 hata, 1 uyarı (kapı hâlâ ~109° açılıyor — yerleşim değişmedi).

---

## Ş‑2 · Yeniden yerleşim · öneri

**Ş‑1 paleti + mobilya yeniden konumlanır.**

### Gerekçe
Modelin ortaya çıkardığı üç sorunu birden çözer:

1. **Kapı süpürme yayı tamamen boşaltılır.** Mevcut durumda S2 misafir sandalyesi
   kanadı ~109°de durduruyor; Ş‑2'de yayda hiç mobilya kalmıyor (hesaplanan
   azami açıklık 178°, yani kanat pratikte tam açılıyor).
2. **Kullanıcı girişe dönük oturur.** Masa arkaya alınır; idari bir odada gelen
   kişinin görülmesi beklenir. Mevcut durumda kullanıcı girişe sırtı dönük.
3. **Net bir ziyaretçi alanı oluşur.** Kapı ile masa arasında ~92 cm derinliğinde,
   misafir sandalyesini alan bir bölge.
4. **Ekran yansıması kesiliyor.** Kullanıcı kapıya dönünce pencere arkasında kalıyor;
   mevcut tül perde (foto 05'te tek uca toplanmış) pencere boyunca tamamlanıyor.
   Ek maliyeti yok — perde zaten var.

> **Denetim iki hata yakaladı ve yerleşim düzeltildi.** İlk taslakta K2 modülü arka
> duvara konulmuştu — odanın **tek penceresini kapatıyordu**. Ayrıca koltuk
> radyatörün önüne geliyordu. İkisi de sol duvara taşınarak çözüldü.

### Yerleşim değişikliği

| Poz | Mevcut (Ş‑0) | Öneri (Ş‑2) | Neden |
|---|---|---|---|
| M1 masa | (283, 97) 0° | **(265, 130) 0°** | Arkaya alındı; süpürme yayından dışarıda |
| S1 koltuk | (290, 148) 180° | **(265, 197) 180°** | Kullanıcı kapıya bakıyor; radyatörün önü boş |
| S2 sandalye | (33, 120) −90° | **(265, 55) 0°** | Ziyaretçi alanına, masanın karşısına |
| D1 dolap | (28, 45) −90° | **(28, 148) −90°** | Sol duvarda; kapı süpürme yayının dışında |
| K2 modül | **odada yok** | **(23, 230) −90°** | Krokide istenen 80 cm'lik yeni eleman. Arka duvara konamaz (pencereyi kapatır) |
| A1 alt dolap | (345, 210) 90° | **(345, 215) 90°** | Yerinde; yazıcıya koltuktan dönerek erişim |
| C1 portmanto | (300, 24) 0° | **(340, 30) 0°** | Giriş köşesine — palto kapıda bırakılır |

Ankastre dolap bankosu (AD1), **pencere (P1)**, **radyatör (R1)** ve kapı **taşınmaz**.

### Arka (pencere) duvarı tasarımı

Odanın en değerli yüzeyi bu duvar — tek ışık kaynağı burada. Üç müdahale, hiçbiri
doğramaya veya radyatöre dokunmuyor:

| # | Müdahale | Neden | Maliyet |
|---|---|---|---|
| 1 | Duvar açık nötre boyanıyor | Işık artık yüzeyde yutulmuyor, odaya yayılıyor | boya |
| 2 | İç denizlik 22 → **38 cm** derinleştiriliyor | Pencere altı kullanılabilir bir raf/tezgâh oluyor; yer kaplamıyor | denizlik tahtası |
| 3 | Tül perde pencere boyunca tamamlanıyor | Ekran yansımasını kesiyor | **yok** — perde zaten var |

Duvarın önüne hiçbir yüksek eleman konulmuyor; `npm run check` bunu denetler.
Denizlik radyatörün önüne sarkmıyor (odaya çıkıntısı 28 cm, radyatör derinliği
11 cm) — ısı yayılımı engellenmiyor.

### Kapsam
Ş‑1 boya kalemleri + iç denizlik yenileme + mobilya taşıma/montaj.
**Yeni mobilya:** krokide istenen 1 × 80 cm raflı modül (K2). Diğer parçalar mevcut.

> ⚠️ **Priz konumları gözden geçirilmeli.** Masa arkaya alındığı için arka duvarda
> priz gerekiyor; arka duvar röleve dışı (bkz. `roleve.md`, T‑5).

### Ölçülebilir sonuç

| | Ş‑0 | Ş‑2 |
|---|---:|---:|
| Kapı azami açıklık | 109° | **178°** |
| Masa – süpürme yayı payı | 1 cm | **7 cm** |
| Masa arkası çalışma boşluğu | 136 cm | 103 cm |
| Kullanıcı girişi görüyor mu | hayır | **evet** |
| Pencerenin önü açık mı | evet | **evet** |
| Ekran yansıması kontrol altında mı | hayır | **evet** (perde tamamlanır) |
| Serbest dolaşım alanı | 6,79 m² | 6,79 m² |
| Denetim | 0 hata, 1 uyarı | **0 hata, 0 uyarı** |

---

## Yeni şema eklemek

`src/config/schemes.js` içindeki listeye bir nesne ekleyin:

```js
{
  id: 's3', code: 'Ş-3', name: 'Adı', kind: 'oneri',
  summary: 'Tek cümle özet',
  rationale: 'Neden böyle yapıldığı',
  inherits: 's1',                  // isteğe bağlı, palet devralır
  palette:   { yellow: { hex: '#…', label: '…', ral: '…' } },
  furniture: { M1: { pos: [x, y], rot: 0 } },
  equipment: { E1: { pos: [x, y], rot: 0 } },
  metrajNote: 'Kapsam notu',
}
```

Sonra `npm run all:schemes` — denetim, 9 pafta çizim ve metraj listesi otomatik
üretilir, görselleştiricide de yeni düğme çıkar.
