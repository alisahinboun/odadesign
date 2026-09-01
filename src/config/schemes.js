/**
 * ============================================================================
 *  TASARIM SEMALARI  /  DESIGN SCHEMES
 * ============================================================================
 *  S-0 mevcut durumdur (roleve). Diger semalar bunun uzerine FARK olarak
 *  tanimlanir: sadece degisen renk, mobilya ve donati yazilir.
 *
 *  Bir semayi uygulamak:
 *    - arayuzden: sag panel -> Tasarim semasi
 *    - cizimlerde: npm run drawings -- --sema=s2
 *    - listede:    npm run schedule -- --sema=s2
 *
 *  Yeni sema eklemek icin bu listeye bir nesne ekleyin; 3B model, kotalar,
 *  teknik cizimler ve metraj listesi otomatik olarak o semayla uretilir.
 * ============================================================================
 */

export const schemes = [
  /* ---------------------------------------------------------------- S-0 */
  {
    id: 's0',
    code: 'Ş-0',
    name: 'Mevcut durum',
    kind: 'roleve',
    summary: 'Fotoğraf ve krokiden çıkarılan mevcut hâl. Karşılaştırma tabanı.',
    rationale:
      'Okul boyası paleti (sarı panel + yeşil şerit), mobilya olduğu yerde. '
      + 'Kapı kanadı S2 sandalyesine çarptığı için ~109° açılıyor; masanın arkasında '
      + '60 cm ölü alan var ve kullanıcı girişe sırtı dönük oturuyor.',
    palette: {},
    furniture: {},
    wallUnitPattern: null,
  },

  /* ---------------------------------------------------------------- S-1 */
  {
    id: 's1',
    code: 'Ş-1',
    name: 'Sakin palet',
    kind: 'oneri',
    summary: 'Yerleşim aynı, yalnızca yüzey renkleri değişiyor. En düşük maliyetli müdahale.',
    rationale:
      'Oda penceresiz; ışığı vasistastan ödünç alıyor. Doygun sarı ve yeşil hem '
      + 'ışığı yutuyor hem 10 m²lik hacmi daraltıyor. Panel yüzeyleri sıcak kırık '
      + 'beyaza alınıyor, yeşil TEK vurgu olarak kalıyor ama okul kimliğini koruyacak '
      + 'şekilde adaçayı tonuna çekiliyor. Mobilya, kapı kanadı ve ankastre dolap '
      + 'gövdesi yerinde kalır — sadece boya ve kapak yenilenir.',
    palette: {
      yellow:      { hex: '#e7e1d5', label: 'Bölüntü panel — sıcak kırık beyaz', ral: 'RAL 9001 yakını' },
      green:       { hex: '#4f7a63', label: 'Düşey vurgu şeridi — adaçayı',      ral: 'RAL 6021 koyu' },
      greenLight:  { hex: '#7d9c87', label: 'Tavan bandı — açık adaçayı',        ral: 'RAL 6021' },
      lilac:       { hex: '#dcd7ce', label: 'Duvar boyası — sıcak nötr',         ral: 'RAL 9002' },
      offwhite:    { hex: '#efebe3', label: 'Dolap kapağı — açık',               ral: 'RAL 9010' },
      plasticGrey: { hex: '#b9bcbe', label: 'Gri plastik',                        ral: '-' },
    },
    wallUnitPattern: ['offwhite', 'yellow', 'offwhite', 'offwhite', 'yellow', 'offwhite'],
    furniture: {},
    metrajNote: 'Boya: bölüntü panelleri + 3 sıvalı duvar + tavan bandı. '
      + 'Ankastre dolap kapakları yeniden kaplama. Mobilya alımı yok.',
  },

  /* ---------------------------------------------------------------- S-2 */
  {
    id: 's2',
    code: 'Ş-2',
    name: 'Yeniden yerleşim',
    kind: 'oneri',
    summary: 'Ş-1 paleti + mobilya yeniden konumlanıyor. Kapı tam açılıyor, kullanıcı girişi görüyor.',
    rationale:
      'Modelin ortaya çıkardığı üç sorunu birden çözer: (1) kapı süpürme yayı '
      + 'tamamen boşaltılır, kanat 175°ye kadar açılır; (2) masa arkaya alınıp '
      + 'kullanıcı girişe dönük oturur — idari bir odada gelen kişiyi görmek gerekir; '
      + '(3) kapı ile masa arasında net bir ziyaretçi alanı oluşur. Depolama sol ve '
      + 'arka duvarda toplanır, yazıcı mevcut ankastre dolabın altına alınır. '
      + 'Ankastre dolap bankosu ve kapı yerinde kalır — taşınmaz.',
    palette: null,          // Ş-1 paletini devralir
    inherits: 's1',
    wallUnitPattern: null,  // inherits
    furniture: {
      // Masa arkaya alindi; kullanici -Y yonune, yani kapiya bakarak oturuyor.
      // Sol uc kapi supurme yayindan 7 cm disarida (denetim: npm run check --sema=s2).
      M1: { pos: [258, 130], rot: 0 },
      S1: { pos: [258, 200], rot: 180 },
      W1: { pos: [225, 138], rot: 0 },
      // Ziyaretci sandalyesi masanin onunde, giris ile masa arasindaki alanda
      S2: { pos: [258,  55], rot: 0 },
      // Depolama sol ve arka duvarda toplandi; D1'in kanat acilma payi 60+ cm
      D1: { pos: [ 28, 180], rot: -90 },
      K2: { pos: [ 95, 250], rot: 180 },
      // Yazici, mevcut ankastre dolabin altina - kullanici sandalyeden donerek erisir
      A1: { pos: [345, 215], rot:  90 },
      // Portmanto giris kosesinde: gelen kisi paltosunu kapida birakiyor
      C1: { pos: [340,  30], rot:   0 },
    },
    // Masaustu duzeni yeni masaya gore; monitor +Y yonune (kullaniciya) bakar
    equipment: {
      E1: { pos: [268, 112], rot: 0 },
      E2: { pos: [200, 120], rot: 0 },
      E3: { pos: [268, 148], rot: 0 },
      E4: { pos: [300, 150], rot: 0 },
      E5: { pos: [320, 145], rot: -6 },
      E6: { pos: [228, 108], rot: 0 },
      E7: { pos: [222, 128], rot: 0 },
      E8: { pos: [242, 132], rot: 0 },
      E9: { pos: [345, 215], rot: 90 },
    },
    // Dolap ustu esyalar dolapla birlikte tasindi; girisi tikayan yer esyalari
    // arka kose duzenine alindi
    clutter: {
      X1: { pos: [ 10, 161], rot: 4 },
      X2: { pos: [ 29, 165], rot: -6 },
      X3: { pos: [ 29, 199], rot: 102 },
      X4: { pos: [ 42, 252], rot: 0 },
      X5: { pos: [ 30, 232], rot: 0 },
    },
    wallItems: {
      T3: { u: 75, z: 152 },
      T2: { u: 300, z: 198 },
    },
    metrajNote: 'Ş-1 boya kalemleri + mobilya taşıma/montaj. Yeni mobilya alımı yok; '
      + 'mevcut parçalar yeniden konumlanır. Priz konumları gözden geçirilmeli '
      + '(masa arkaya alındığı için arka duvarda priz gerekiyor — röleve eksiği).',
  },
];

export const defaultScheme = 's0';
export const getScheme = (id) => schemes.find((s) => s.id === id) || schemes[0];

/** Bir semanin efektif (kalitim cozulmus) icerigini dondurur */
export function resolveScheme(id) {
  const s = getScheme(id);
  if (!s.inherits) return s;
  const base = getScheme(s.inherits);
  return {
    ...s,
    palette: { ...(base.palette || {}), ...(s.palette || {}) },
    wallUnitPattern: s.wallUnitPattern || base.wallUnitPattern,
    furniture: { ...(base.furniture || {}), ...(s.furniture || {}) },
    equipment: { ...(base.equipment || {}), ...(s.equipment || {}) },
    clutter: { ...(base.clutter || {}), ...(s.clutter || {}) },
    wallItems: { ...(base.wallItems || {}), ...(s.wallItems || {}) },
  };
}
