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
    wallUnitPattern: ['offwhite', 'yellow', 'offwhite', 'offwhite', 'yellow', 'offwhite'],
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
    wallUnitPattern: ['offwhite', 'offwhite', 'yellow', 'offwhite', 'offwhite', 'yellow'],
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
    wallUnitPattern: ['yellow', 'offwhite', 'yellow', 'offwhite', 'yellow', 'offwhite'],
    is: 'Boya: bölüntü panelleri + üç duvar + pencere duvarı + tavan bandı. '
      + 'Dolap kapakları yeniden kaplanır. Mobilya alımı yok.',
  },
];

/* ============================================================ YERLESIMLER */
export const layouts = [
  {
    id: 'y1', code: '1', name: 'Şu anki hâli', kind: 'mevcut',
    summary: 'Eşyalar bugünkü yerlerinde.',
    why: 'Karşılaştırma tabanı. Bu hâlde kapı ancak ~109° açılıyor, masaya oturunca '
       + 'kapıya sırtınız dönük oluyor ve görüşme için ayrı bir oturma alanı yok — '
       + 'öğrenci masanın karşısına oturmak zorunda.',
    furniture: {}, equipment: {}, clutter: {}, windows: {},
  },

  {
    id: 'y2', code: '2', name: 'Görüşme köşesi', kind: 'oneri',
    summary: 'Masa yerinde kalıyor; arka-sol köşede iki sandalye ve küçük sehpadan '
           + 'oluşan ayrı bir görüşme alanı kuruluyor.',
    why: 'Rehberlik görüşmesinde en önemli şey öğrencinin masanın KARŞISINA '
       + 'oturmamasıdır — karşılıklı oturmak sorgu hissi verir. Odanın arka-sol köşesi '
       + 'kapıdan doğrudan görünmüyor; öğrenci orada kendini daha rahat hissediyor. '
       + 'Masa çalışma için yerinde kalıyor, görüşme ayrı bir alanda yapılıyor.',
    furniture: {
      D1: { pos: [28, 45], rot: -90 },        // dolap on-sol kosede, kilitli evrak icin
      S2: { pos: [105, 148], rot: 0 },        // ogrenci sandalyesi
      S3: { pos: [38, 205], rot: -90 },       // ikinci sandalye (90 derece acili)
      Y1: { pos: [100, 205], rot: 0 },        // aralarindaki sehpa
      S1: { pos: [275, 150], rot: 180 },
      M1: { pos: [283, 97], rot: 0 },
      A1: { pos: [340, 205], rot: 90 },
      C1: { pos: [300, 24], rot: 0 },
      W1: { pos: [243, 100], rot: 0 },
    },
    show: ['Y1', 'S3'],
    windows: { P1: { curtain: { from: -2, to: 287, drop: 122, headroom: 3, hem: 8 } } },
    is: 'Yeni alım: 1 küçük yuvarlak sehpa (Ø70) + 1 sandalye. '
      + 'Tül perde boydan boya çekilir. Diğer her şey yerinde.',
  },

  {
    id: 'y3', code: '3', name: 'Kapı dışa açılsın', kind: 'oneri',
    summary: 'Kapı koridora doğru açılacak şekilde çevriliyor. Bu tek değişiklik '
           + 'odanın ortasında ~2 m² kullanılabilir alan açıyor.',
    why: 'Şu anda kapı içeri açıldığı için, menteşenin 112 cm çevresindeki alana '
       + 'hiçbir şey konulamıyor — 10 m²lik odada bu çok büyük bir kayıp. Kapıyı '
       + 'koridora çevirmek menteşe ve kasa işi; yangın yönetmeliği açısından da '
       + 'kaçış yönüne açılması zaten tercih edilir. Açılan alanla masa duvara '
       + 'dayanabiliyor, görüşme köşesi rahatlıyor ve oda gerçekten iki kişilik oluyor.',
    door: { swing: 'out', openAngle: 95 },
    furniture: {
      M1: { pos: [283, 45], rot: 0 },         // masa artik duvara dayanabiliyor
      S1: { pos: [275, 118], rot: 180 },
      W1: { pos: [240, 52], rot: 0 },
      C1: { pos: [150, 22], rot: 0 },         // portmanto kapinin yanina
      S2: { pos: [95,  98], rot: 0 },
      S3: { pos: [30, 148], rot: -90 },
      Y1: { pos: [95, 150], rot: 0 },         // sehpa, dolabin kanat payini kapatmayacak kadar onde
      D1: { pos: [28, 230], rot: -90 },       // dolap arka-sol koseye
      A1: { pos: [340, 205], rot: 90 },
    },
    equipment: {
      E1: { pos: [318, 30], rot: 0 },
      E2: { pos: [350, 38], rot: 0 },
      E3: { pos: [300, 64], rot: -8 },
      E4: { pos: [338, 68], rot: -8 },
      E5: { pos: [237, 55], rot: -6 },
      E6: { pos: [268, 21], rot: 0 },
      E7: { pos: [249, 23], rot: -8 },
      E8: { pos: [243, 45], rot: 0 },
    },
    clutter: {
      X1: { pos: [10, 211], rot: 4 }, X2: { pos: [29, 215], rot: -6 }, X3: { pos: [29, 249], rot: 102 },
      X4: { pos: [200, 250], rot: 0 }, X5: { pos: [230, 258], rot: 0 },
    },
    show: ['Y1', 'S3'],
    windows: { P1: { curtain: { from: -2, to: 287, drop: 122, headroom: 3, hem: 8 } } },
    is: 'Kapı kanadı ve kasası koridora açılacak şekilde çevrilir (marangoz işi). '
      + 'Yeni alım: 1 yuvarlak sehpa + 1 sandalye. Tül perde boydan boya çekilir.',
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
    door: L.door || null,
    show: L.show || [],
    hide: L.hide || [],
  };
}
