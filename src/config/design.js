/**
 * ============================================================================
 *  TASARIM SECENEKLERI  —  REHBER ÖĞRETMEN ODASI
 * ============================================================================
 *  Iki ayri eksen var, istediginiz gibi eslestirebilirsiniz:
 *
 *    PALET     duvar renkleri        (hicbir sey tasinmaz, sadece boya)
 *    YERLESIM  esyalarin yeri        (boya degismez, esyalar tasinir)
 *
 *  Oda bir rehberlik odasi olacagi icin oneriler su uc seye gore secildi:
 *    1. Ogrenci masanin KARSISINA degil, YANINA/ACILI oturmali. Karsilikli
 *       oturmak sorgu hissi verir; acili oturma gorusmeyi rahatlatir.
 *    2. Renkler sakin olmali. Doygun sari ve yesil uyarici; rehberlik
 *       odasinda tam tersi isteniyor.
 *    3. Kapidan iceri bakildiginda ogrenci dogrudan gorunmemeli.
 * ============================================================================
 */

/* ============================================================== PALETLER */
export const palettes = [
  {
    id: 'p1', code: '1', name: 'Şu anki renkler', kind: 'mevcut',
    summary: 'Okul boyası: doygun sarı paneller, yeşil şerit, tamamı yeşil pencere duvarı.',
    why: 'Karşılaştırma için. Bu palet canlı ve uyarıcı — sınıf koridoru için uygun, '
       + 'ama görüşme odası için ters yönde çalışıyor.',
    palette: {},
    wallUnitPattern: null,
  },
  {
    id: 'p2', code: '2', name: 'Sakin yeşil', kind: 'oneri',
    summary: 'Okulun yeşilini koruyor ama doygunluğu düşürüyor. Duvarlar sıcak kırık beyaz.',
    why: 'Binanın kimliğini bozmadan sakinleştirir. Pencere duvarının tamamı doygun '
       + 'yeşil olduğu için gelen ışığın çoğu orada yutuluyordu; açık nötre alınınca '
       + 'oda belirgin şekilde aydınlanıyor. Yeşil tek vurgu olarak kapı şeridinde kalıyor.',
    palette: {
      yellow:      { hex: '#e9e4d8', label: 'Bölüntü paneli — sıcak kırık beyaz', ral: 'RAL 9001' },
      green:       { hex: '#5b8367', label: 'Vurgu — adaçayı yeşili',            ral: 'RAL 6021' },
      greenLight:  { hex: '#87a892', label: 'Tavan bandı',                        ral: 'RAL 6021 açık' },
      lilac:       { hex: '#ddd8cf', label: 'Duvarlar — sıcak nötr',              ral: 'RAL 9002' },
      offwhite:    { hex: '#f0ece4', label: 'Dolap kapağı',                       ral: 'RAL 9010' },
      curtain:     { hex: '#efe9dd', label: 'Tül perde',                          ral: '-' },
      radiator:    { hex: '#f4f2ee', label: 'Radyatör',                           ral: 'RAL 9016' },
    },
    wallUnitPattern: ['offwhite', 'yellow', 'offwhite'],
    is: 'Boya: bölüntü panelleri + üç duvar + pencere duvarı + tavan bandı. '
      + 'Dolap kapakları yeniden kaplanır. Mobilya alımı yok.',
  },
  {
    id: 'p3', code: '3', name: 'Açık mavi-gri', kind: 'oneri',
    summary: 'Soluk mavi-gri pencere duvarı, kırık beyaz diğer duvarlar. En sakin seçenek.',
    why: 'Mavi tonlar gerginliği düşürdüğü için sağlık ve danışmanlık mekânlarında '
       + 'yaygın. Kayın mobilyanın sıcaklığıyla dengeleniyor, soğuk/klinik durmuyor. '
       + 'Okul yeşilinden tamamen kopar — kimlik açısından bilinçli bir tercih.',
    palette: {
      yellow:      { hex: '#e7e6e2', label: 'Bölüntü paneli — kırık beyaz',  ral: 'RAL 9010' },
      green:       { hex: '#6d8a99', label: 'Vurgu — soluk mavi-gri',        ral: 'RAL 7001 yakını' },
      greenLight:  { hex: '#9fb4be', label: 'Tavan bandı',                   ral: 'RAL 7001 açık' },
      lilac:       { hex: '#dcdedd', label: 'Duvarlar — açık gri',           ral: 'RAL 9018' },
      offwhite:    { hex: '#eeeeec', label: 'Dolap kapağı',                  ral: 'RAL 9016' },
      curtain:     { hex: '#eef0f0', label: 'Tül perde',                     ral: '-' },
      radiator:    { hex: '#f6f7f7', label: 'Radyatör',                      ral: 'RAL 9016' },
    },
    wallUnitPattern: ['offwhite', 'yellow', 'offwhite'],
    is: 'Boya: bölüntü panelleri + üç duvar + pencere duvarı + tavan bandı. '
      + 'Dolap kapakları yeniden kaplanır. Mobilya alımı yok.',
  },
  {
    id: 'p4', code: '4', name: 'Toprak tonları', kind: 'oneri',
    summary: 'Kum ve kil tonları. Mevcut kayın mobilyayla en uyumlu, en "ev gibi" seçenek.',
    why: 'Odadaki mobilyanın hepsi kayın. Toprak tonları bu sıcaklığı destekler ve '
       + 'mekânı kurumsal olmaktan çıkarır — bir öğrencinin rahat konuşabileceği ortam '
       + 'için en etkili seçenek. Vurgu kilden, kapı şeridinde kullanılıyor.',
    palette: {
      yellow:      { hex: '#e6ddcd', label: 'Bölüntü paneli — kum',      ral: 'RAL 1013 yakını' },
      green:       { hex: '#a9764f', label: 'Vurgu — kil',               ral: 'RAL 8024 açık' },
      greenLight:  { hex: '#c3a183', label: 'Tavan bandı',               ral: '-' },
      lilac:       { hex: '#e0d8cb', label: 'Duvarlar — açık kum',       ral: 'RAL 1015' },
      offwhite:    { hex: '#f2ece1', label: 'Dolap kapağı',              ral: 'RAL 9001' },
      curtain:     { hex: '#f0e8da', label: 'Tül perde',                 ral: '-' },
      radiator:    { hex: '#f5f2ec', label: 'Radyatör',                  ral: 'RAL 9016' },
    },
    wallUnitPattern: ['yellow', 'offwhite', 'yellow'],
    is: 'Boya: bölüntü panelleri + üç duvar + pencere duvarı + tavan bandı. '
      + 'Dolap kapakları yeniden kaplanır. Mobilya alımı yok.',
  },
];

/* ============================================================ YERLESIMLER */
/**
 * KURAL: Bu yerlesimlerin HICBIRINDE yeni esya yok. Odada bugun ne varsa
 * (masa, dolap, koltuk, sandalye, tezgah, portmanto, kova) sadece yeri
 * degisiyor. Kapi da ICERI aciliyor - disa acilmasi mumkun degil.
 *
 * Kapinin sureklu bosta kalmasi gereken alan: mentese x=99'da, kanat 112 cm.
 * Yani x 99..211 / y 0..112 dortgeninin icindeki CEYREK DAIRE hep bos kalmali.
 */
export const layouts = [
  {
    id: 'y1', code: '1', name: 'Şu anki hâli', kind: 'mevcut',
    summary: 'Eşyalar bugünkü yerlerinde.',
    why: 'Karşılaştırma tabanı. Bu hâlde kapı tam açılmıyor — kanadı sol duvardaki '
       + 'misafir sandalyesi durduruyor. Öğrencinin oturacağı tek yer masanın tam '
       + 'karşısı ve bilgisayar ekranı doğrudan pencereye dönük.',
    furniture: {}, equipment: {}, clutter: {}, windows: {},
  },

  {
    id: 'y2', code: '2', name: 'Masayı geri çek', kind: 'oneri',
    summary: 'Masa 53 cm sola, 55 cm arkaya kayıyor; sağ ucu tezgâha dayanıyor.',
    why: 'En ucuz çözüm: tek başına masayı itmek, hiçbir şeyi taşımadan. Kapının '
       + 'önü boşalıyor ve kapı ile masa arasında bir giriş alanı oluşuyor — '
       + 'içeri giren kişi doğrudan masaya çarpmıyor. Öğrenci sandalyesi masanın '
       + 'karşısına değil SOL UCUNA geçiyor; böylece 90 derece açıyla oturuluyor, '
       + 'karşılıklı sorgu hissi kalkıyor. AMA kapı yine tam açılmıyor: kanadı '
       + 'artık masa değil, ön-sol köşedeki dolap durduruyor (109° yerine 115°). '
       + 'Tam açılması için Y-4\'e bakın.',
    furniture: {
      M1: { pos: [230, 152], rot: 0 },    // sag ucu tezgahin on yuzune (x=310) dayanir
      S1: { pos: [230, 197], rot: 180 },   // radyatorun 40 cm serbest seridine girmeyecek kadar onde
      S2: { pos: [125, 155], rot: -90 },  // ogrenci masanin sol ucunda, 90 derece
      W1: { pos: [180, 150], rot: 0 },
      C1: { pos: [236,  26], rot: 0 },
      D1: { pos: [ 28,  45], rot: -90 },
      A1: { pos: [340, 205], rot: 90 },
    },
    equipment: {
      E1: { pos: [243, 131] }, E2: { pos: [292, 143] }, E3: { pos: [239, 171] },
      E4: { pos: [277, 175] }, E5: { pos: [184, 162] }, E6: { pos: [215, 128] },
      E7: { pos: [196, 130] }, E8: { pos: [190, 152] },
    },
    windows: { P1: { curtain: { from: -2, to: 287, drop: 122, headroom: 3, hem: 8 } } },
    is: 'Yeni alım yok. Masa arkaya itilir, misafir sandalyesi masanın ucuna alınır, '
      + 'portmanto kapının sağına geçer. Tül perde boydan boya çekilir.',
  },

  {
    id: 'y3', code: '3', name: 'Tezgâhla L kur', kind: 'oneri',
    summary: 'Masa 90° çevrilip sağ duvardaki tezgâha dayanıyor; ikisi kesintisiz '
           + 'bir L çalışma yüzeyi oluyor.',
    why: 'Odanın en iyi çözümü. Üç şeyi birden düzeltiyor: (1) Ekran artık pencereye '
       + 'dönük değil, pencere solda kalıyor — camdan gelen ışık ekrana vurmuyor, '
       + 'yansıma bitiyor. (2) Yazıcı kolun uzandığı yere geliyor; kalkmadan '
       + 'dönüp alıyorsunuz. (3) Odanın sol yarısı tek parça boş kalıyor — '
       + 'kapı sonuna kadar açılıyor ve 179 × 188 cm kesintisiz boş döşeme '
       + 'kalıyor (tekerlekli sandalye rahat dönüyor). Öğrenci masanın ön ucuna, '
       + '90 derece açıyla oturuyor; kapı ekseninin sağında kaldığı için '
       + 'koridordan geçen biri onu görmüyor — ancak tam kapı boşluğunda duran '
       + 'biri görebilir. Bedeli şu: masa döndüğü için oturduğunuzda kapı '
       + 'arkanızda kalıyor, içeri gireni görmek için dönmeniz gerekiyor. '
       + 'Bu sizi rahatsız ederse Y-4.',
    furniture: {
      M1: { pos: [272, 185], rot: 90 },   // 160 boy Y'de, arkasi tezgahin on yuzune (x=310) dayali
      S1: { pos: [210, 185], rot: -90 },  // calisma koltugu, +X'e (masaya) donuk
      S2: { pos: [272,  78], rot: 0 },    // ogrenci, masanin on ucunda 90 derece
      W1: { pos: [222, 120], rot: 0 },
      C1: { pos: [236,  26], rot: 0 },
      D1: { pos: [ 28, 228], rot: -90 },  // dolap arka-sol koseye: kapinin yayi boşalir
      A1: { pos: [340, 205], rot: 90 },
    },
    clutter: {
      X1: { pos: [10, 209] }, X2: { pos: [29, 213] }, X3: { pos: [29, 247] },
      X4: { pos: [30, 150] }, X5: { pos: [22, 172] },
    },
    equipment: {
      E1: { pos: [285, 185], rot: 90 },   // ekran kullaniciya (-X) donuk
      E2: { pos: [297, 130], rot: 0 },
      E3: { pos: [255, 185], rot: 90 },
      E4: { pos: [255, 152], rot: 90 },
      E5: { pos: [262, 240], rot: 90 },
      E6: { pos: [300, 210], rot: 0 },
      E7: { pos: [298, 228], rot: 90 },
      E8: { pos: [252, 210], rot: 0 },
    },
    windows: { P1: { curtain: { from: -2, to: 287, drop: 122, headroom: 3, hem: 8 } } },
    is: 'Yeni alım yok. Masa 90° çevrilip tezgâha dayanır, dolap arka-sol köşeye '
      + 'taşınır. Masa tablası 75, tezgâh 72 cm — aralarında 3 cm kot farkı kalır; '
      + 'rahatsız ederse masanın ayakları kısaltılabilir. Tül perde boydan boya çekilir.',
  },

  {
    id: 'y4', code: '4', name: 'Masayı çek + dolabı arkaya al', kind: 'oneri',
    summary: 'Y-2 ile aynı masa düzeni, üstüne dolap ön-sol köşeden arka-sol '
           + 'köşeye taşınıyor.',
    why: 'Kapının sonuna kadar açılmasını engelleyen tek şey dolap. Dolabı arka '
       + 'köşeye alınca kapı 115°den 152°ye çıkıyor — yani duvara dayanana kadar '
       + 'açılıyor. Üstelik kapıdan girer girmez 185 cm yüksekliğinde bir dolapla '
       + 'karşılaşmıyorsunuz; göz doğrudan pencereye gidiyor ve oda olduğundan '
       + 'geniş görünüyor. Aynanın olduğu sarı panel de serbest kalıyor. '
       + 'Dolap pencerenin soluna (x 0–55) denk geldiği için ışığı kesmiyor. '
       + 'Masa dönmediği için oturduğunuzda kapı tam karşınızda kalıyor; '
       + 'karşılığında ekran pencereye dönük kalıyor — tül perdenin boydan boya '
       + 'çekilmesi şart.',
    furniture: {
      M1: { pos: [230, 152], rot: 0 },
      S1: { pos: [230, 197], rot: 180 },
      S2: { pos: [125, 155], rot: -90 },
      W1: { pos: [180, 150], rot: 0 },
      C1: { pos: [236,  26], rot: 0 },
      D1: { pos: [ 28, 228], rot: -90 },  // arka-sol kose; pencere x=58'de basliyor
      A1: { pos: [340, 205], rot: 90 },
    },
    equipment: {
      E1: { pos: [243, 131] }, E2: { pos: [292, 143] }, E3: { pos: [239, 171] },
      E4: { pos: [277, 175] }, E5: { pos: [184, 162] }, E6: { pos: [215, 128] },
      E7: { pos: [196, 130] }, E8: { pos: [190, 152] },
    },
    clutter: {
      X1: { pos: [10, 209] }, X2: { pos: [29, 213] }, X3: { pos: [29, 247] },
      X4: { pos: [30, 100] }, X5: { pos: [22, 128] },
    },
    windows: { P1: { curtain: { from: -2, to: 287, drop: 122, headroom: 3, hem: 8 } } },
    is: 'Yeni alım yok. Masa itilir, dolap boşaltılıp arka-sol köşeye taşınır '
      + '(iki kişilik iş); üstündeki eşyalar da onunla gider. Tül perde boydan '
      + 'boya çekilir.',
  },
];

export const defaultPalette = 'p1';
export const defaultLayout = 'y1';
export const getPalette = (id) => palettes.find((p) => p.id === id) || palettes[0];
export const getLayout = (id) => layouts.find((l) => l.id === id) || layouts[0];

/** Palet + yerlesimi tek bir "sema" nesnesinde birlestirir (applyScheme bunu bekler) */
export function resolveDesign(paletteId, layoutId) {
  const P = getPalette(paletteId);
  const L = getLayout(layoutId);
  return {
    id: `${P.id}-${L.id}`,
    paletteId: P.id, layoutId: L.id,
    palette: P.palette || {},
    wallUnitPattern: P.wallUnitPattern || null,
    furniture: L.furniture || {},
    equipment: L.equipment || {},
    clutter: L.clutter || {},
    wallItems: L.wallItems || {},
    windows: L.windows || {},
  };
}
