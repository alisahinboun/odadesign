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
      'Okul boyası paleti (sarı panel + yeşil şerit + tamamı yeşil pencere duvarı), '
      + 'mobilya olduğu yerde. Kapı kanadı S2 sandalyesine çarptığı için ~109° '
      + 'açılıyor ve kullanıcı girişe sırtı dönük oturuyor. Krokide istenen 80 cm\'lik '
      + 'raflı modül (K2) odada YOK — mevcut durumda gösterilmez.',
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
    summary: 'Yerleşim aynı, yalnızca yüzey renkleri. En düşük maliyetli müdahale — ışığı geri kazandırır.',
    rationale:
      'Odanın asıl ışık kaynağı arka duvardaki 268 cm genişliğindeki pencere '
      + '(foto 05). Sorun şu: pencerenin bulunduğu duvarın TAMAMI doygun yeşile '
      + 'boyalı, yani gelen ışığın büyük bölümü daha odaya yayılmadan bu yüzeyde '
      + 'yutuluyor; yansıyan az ışık da yeşile boyanıyor. Karşıda bina yakın olduğu '
      + 'için zaten difüz ve az ışık geliyor. Öneri, ışığın çarptığı ve yansıdığı '
      + 'yüzeyleri açık nötre almak; yeşil TEK vurgu olarak kalıyor ama okul '
      + 'kimliğini koruyacak şekilde adaçayı tonuna çekiliyor. Mobilya, kapı kanadı, '
      + 'pencere doğraması ve ankastre dolap gövdesi yerinde kalır — sadece boya.',
    palette: {
      yellow:      { hex: '#e7e1d5', label: 'Bölüntü panel — sıcak kırık beyaz', ral: 'RAL 9001 yakını' },
      green:       { hex: '#4f7a63', label: 'Düşey vurgu şeridi — adaçayı',      ral: 'RAL 6021 koyu' },
      greenLight:  { hex: '#7d9c87', label: 'Tavan bandı — açık adaçayı',        ral: 'RAL 6021' },
      lilac:       { hex: '#dcd7ce', label: 'Duvar boyası — sıcak nötr',         ral: 'RAL 9002' },
      radiator:    { hex: '#f4f2ee', label: 'Radyatör (beyaz)',                  ral: 'RAL 9016' },
      curtain:     { hex: '#efe9dd', label: 'Tül perde',                          ral: '-' },
      offwhite:    { hex: '#efebe3', label: 'Dolap kapağı — açık',               ral: 'RAL 9010' },
      plasticGrey: { hex: '#b9bcbe', label: 'Gri plastik',                        ral: '-' },
    },
    wallUnitPattern: ['offwhite', 'yellow', 'offwhite', 'offwhite', 'yellow', 'offwhite'],
    furniture: {},
    metrajNote: 'Boya: bölüntü panelleri + sol/sağ duvar + ARKA (pencere) DUVARI + '
      + 'tavan bandı. Ankastre dolap kapakları yeniden kaplama. Pencere doğraması ve '
      + 'radyatör, tezgâh ve mantar pano yerinde kalır. Mobilya alımı yok.',
  },

  /* ---------------------------------------------------------------- S-2 */
  {
    id: 's2',
    code: 'Ş-2',
    name: 'Yeniden yerleşim',
    kind: 'oneri',
    summary: 'Ş-1 paleti + mobilya yeniden konumlanıyor. Kapı tam açılıyor, kullanıcı girişi görüyor.',
    rationale:
      'Modelin ortaya çıkardığı dört sorunu birden çözer: (1) kapı süpürme yayı '
      + 'tamamen boşaltılır, kanat neredeyse tam açılır; (2) masa arkaya alınıp '
      + 'kullanıcı girişe dönük oturur — idari bir odada gelen kişiyi görmek gerekir; '
      + '(3) kapı ile masa arasında net bir ziyaretçi alanı oluşur; (4) masa pencereye '
      + 'yakın ama ekran pencereye PARALEL duruyor: ne ekranda pencere yansıması ne de '
      + 'kullanıcının gözünde karşıdan gelen parlama oluşuyor. Depolama sol ve arka '
      + 'duvarda toplanır, radyatörün önü boş bırakılır. Ankastre dolap bankosu, '
      + 'pencere ve kapı yerinde kalır — taşınmaz.',
    palette: null,          // Ş-1 paletini devralir
    inherits: 's1',
    wallUnitPattern: null,  // inherits
    furniture: {
      // Masa arkaya alindi; kullanici -Y yonune, yani kapiya bakarak oturuyor.
      // Sol uc kapi supurme yayindan disarida (denetim: npm run check -- --sema=s2).
      M1: { pos: [265, 130], rot: 0 },
      S1: { pos: [265, 197], rot: 180 },
      W1: { pos: [230, 138], rot: 0 },
      // Ziyaretci sandalyesi masanin onunde, giris ile masa arasindaki alanda
      S2: { pos: [265,  55], rot: 0 },
      // Depolama SOL duvarda toplandi. K2 arka duvara konulamaz: odanin tek
      // penceresini kapatir (denetim bunu yakaladi).
      D1: { pos: [ 28, 148], rot: -90 },
      K2: { pos: [ 23, 230], rot: -90 },
      // Tezgah 130 -> 90 cm kisaltiliyor. Masa arkaya alindigi icin sag duvarin
      // orta bolumu bosalmali; bu, kucuk bir marangozluk kalemi (metraja yazildi).
      // Yazici tezgahin uzerinde kaliyor, kullanici sandalyeden donerek erisir.
      A1: { pos: [340, 225], rot:  90, w: 90, d: 60, h: 72 },
      C1: { pos: [340,  30], rot:   0 },
    },
    // Masaustu duzeni yeni masaya gore; monitor +Y yonune (kullaniciya) bakar
    equipment: {
      E1: { pos: [275, 112], rot: 0 },
      E2: { pos: [205, 120], rot: 0 },
      E3: { pos: [275, 148], rot: 0 },
      E4: { pos: [312, 150], rot: 0 },
      E5: { pos: [325, 145], rot: -6 },
      E6: { pos: [235, 110], rot: 0 },
      E7: { pos: [228, 130], rot: 0 },
      E8: { pos: [244, 134], rot: 0 },
      E9: { pos: [340, 208], rot: 90 },
      E10: { pos: [340, 258], rot: 0 },
    },
    clutter: {
      X1: { pos: [ 10, 129], rot: 4 },
      X2: { pos: [ 29, 133], rot: -6 },
      X3: { pos: [ 29, 167], rot: 102 },
      X4: { pos: [ 46,  86], rot: 0 },
      X5: { pos: [ 30,  66], rot: 0 },
    },
    wallItems: {
      T3: { u: 75, z: 152 },
      T2: { u: 300, z: 198 },
    },
    /* ---------------------- ARKA (PENCERE) DUVARI TASARIMI ----------------------
     * Odanin en degerli yuzeyi bu duvar: tek isik kaynagi burada. Uc mudahale,
     * hicbiri dogramaya veya radyatore dokunmuyor:
     *
     *  1) Duvar acik notre boyaniyor (S-1 paletinden gelir). Isik artik yutulmuyor.
     *  2) Ic denizlik 22 -> 38 cm derinlestiriliyor: pencere alti KULLANILABILIR
     *     bir raf/tezgah oluyor. Yer kaplamiyor, yalnizca denizlik tahtasi
     *     yenileniyor. Radyator denizligin altinda kaldigi icin isi yayilimi
     *     engellenmiyor (denizlik radyatorun onune sarkmiyor: 38 cm < parapet
     *     derinligi degil, duvardan olculuyor ve radyator 11 cm derinlikte).
     *  3) Tul perde pencere boyunca tamamlaniyor - ekran yansimasini kesiyor,
     *     perde zaten var, ek maliyeti yok.
     *
     * Duvarin onune HICBIR yuksek eleman konulmuyor; denetim bunu kontrol eder.
     */
    windows: {
      P1: {
        curtain:   { from: -2, to: 287, drop: 122, headroom: 3, hem: 8 },
        sillBoard: { depth: 38, thickness: 4, overhang: 3 },
      },
    },
    // Krokide istenen 80 cm lik modul YENI eleman olarak devreye giriyor,
    // pencereyi kapatmayacak sekilde sol duvara yerlesiyor.
    show: ['K2'],
    metrajNote: 'Ş-1 boya kalemleri + mobilya taşıma/montaj. Yeni mobilya: krokide '
      + 'istenen 1 × 80 cm raflı modül (K2). Marangozluk: sağ duvar tezgâhı 130 → 90 cm '
      + 'kısaltılır (masanın arkaya alınabilmesi için) ve iç denizlik 38 cm derinliğinde '
      + 'yenilenir. Tül perde pencere boyunca tamamlanır (ekran yansımasını keser). '
      + 'Priz konumları gözden geçirilmeli: masa arkaya alındığı için arka duvarda / '
      + 'döşemede priz gerekiyor.',
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
    windows: { ...(base.windows || {}), ...(s.windows || {}) },
    show: [...(base.show || []), ...(s.show || [])],
    hide: [...(base.hide || []), ...(s.hide || [])],
  };
}
