/**
 * ============================================================================
 *  ODA VERI TABANI  /  ROOM DATA MODEL
 * ============================================================================
 *  Bu dosya projenin TEK dogruluk kaynagidir (single source of truth).
 *  3B model, teknik cizimler (plan/gorunus) ve mahal listesi hepsi buradan
 *  uretilir. Bir olcuyu degistirmek icin sadece bu dosyayi duzenleyin.
 *
 *  BIRIM: santimetre (cm). Kot (Z) dosemeden yukari pozitif.
 *
 *  KOORDINAT SISTEMI
 *  -----------------
 *      +Y (arka duvar / back wall, y = D)
 *       ^
 *       |   +-------------------------------+
 *       |   |                               |
 *       |   | SOL                       SAG |
 *       |   | (x=0)                   (x=W) |
 *       |   |                               |
 *       |   +---------[ KAPI ]--------------+
 *       |   ON DUVAR (y=0)  -- boluntu / partition
 *       +---------------------------------------> +X
 *      (0,0) = on-sol ic kose  /  front-left inside corner
 *
 *  ONEMLI: Olculerin kaynagi ve guven duzeyi icin docs/roleve.md dosyasina
 *  bakin. "src" alani her olcunun nereden geldigini soyler:
 *     'kroki'  -> el krokisinden okundu (yuksek guven)
 *     'foto'   -> fotograflardan oranlanarak tahmin edildi (orta guven)
 *     'tipik'  -> sektor standardi kabul edildi (dogrulanmali)
 * ============================================================================
 */

/* ---------------------------------------------------------------- 1. KABUK */

export const room = {
  name: 'Ofis / Idari Oda',
  // Ic net olculer
  width: 370,   // X  - kapi duvari boyunca  | kroki: 20 + 350
  depth: 270,   // Y  - kapi duvarina dik    | kroki: 270
  height: 290,  // Z  - doseme ust kotu -> asma tavan alt kotu | foto (tahmin)

  wallThickness: 10,      // sivali bolme duvar (sol/arka) | tipik
  partitionThickness: 8,  // aluminyum profilli boluntu (on duvar) | foto
  slabToCeiling: 35,      // asma tavan ustu bosluk (tesisat) | tipik
};

/* -------------------------------------------------- 2. DUVAR KOMPOZISYONU */
/**
 * On duvar (y = 0): aluminyum profilli boluntu.
 *   Z 0    -> 205  : dolu panel (sari / yesil seritli) + kapi
 *   Z 205  -> 272  : telli/buzlu cam vasistas (transom)
 *   Z 272  -> 290  : yesil boyali bant
 * X ekseni boyunca panel dizilimi asagida tanimli (toplam = room.width).
 */
export const partition = {
  sillHeight: 205,      // vasistas alt kotu = kapi kasa ust kotu | foto
  transomTop: 272,      // vasistas ust kotu                      | foto
  bandHeight: 18,       // tavan birlesimindeki yesil bant        | foto
  frameWidth: 5,        // aluminyum dikme/kayit genisligi         | foto
  baseHeight: 12,       // gri metal supurgelik / kick plate       | foto

  /**
   * Sol koseden (x=0) baslayarak panel dizilimi. Toplam room.width olmali.
   *
   * ⚠ KROKI CELISKISI: krokinin UST kenarinda kapinin iki yanina "120cm" ve
   * "150cm" yaziyor. 120 + 120 (kapi) + 150 = 390, oysa ALT kenar 20 + 350 = 370.
   * 20 cm'lik fark el krokisinde bir kaydirma. Model 370'i ve 120 cm kapiyi esas
   * aldi; farki panel genisliklerine dagitti (P1 95 / P2 35 / P3 120). Yani bu
   * uc deger krokiden DOGRUDAN okunmus degil - yerinde olculmeli.
   */
  panels: [
    { id: 'P1', kind: 'solid', width: 95,  color: 'yellow' },  // aynanin oldugu panel
    { id: 'D1', kind: 'door',  width: 120 },                   // kroki: "120cm kapi"
    { id: 'P2', kind: 'solid', width: 35,  color: 'green'  },  // saatin oldugu yesil serit
    { id: 'P3', kind: 'solid', width: 120, color: 'yellow' },  // tablonun oldugu panel
  ],
};

export const walls = {
  left:  { id: 'D-SOL',  finish: 'lilac',    note: 'Sivali + plastik boya (lila). Dolap ve misafir sandalyesi bu duvarda.' },
  back:  { id: 'D-ARKA', finish: 'green',    note: 'Tamami yesil boyali; buyuk pencere ve altinda dilimli radyator (foto 05).' },
  right: { id: 'D-SAG',  finish: 'offwhite', note: 'Ust kotta ankastre dolap bankosu (sari/krem kapaklar).' },
  front: { id: 'D-ON',   finish: 'partition', note: 'Aluminyum profilli boluntu + 120 cm kapi + vasistas.' },
};

/* ----------------------------------------------------------------- 3. KAPI */

export const door = {
  id: 'K1',
  width: 120,          // kroki
  height: 205,         // foto
  leafThickness: 4.2,  // tipik
  frameDepth: 12,      // tipik
  frameFace: 4,        // tipik
  hinge: 'left',       // ic taraftan bakildiginda sol menteselidir
  swing: 'in',         // odaya dogru acilir (foto 02/03)
  openAngle: 95,       // varsayilan gosterim acisi (derece). Pratik azami ~150 (masa sinirliyor)
  // NOT: kanadin carpmadan acilabildigi azami aci src/lib/analysis.js ->
  //      doorSwingLimit() ile mobilya yerlesiminden HESAPLANIR, elle yazilmaz.
  handleHeight: 105,   // tipik
  kickPlate: 22,       // alt metal koruma sacinin yuksekligi | foto
  letterSlot: { height: 112, w: 22, h: 9 }, // kapaktaki metal yazi/kilit plakasi | foto
  face: 'greyLaminate',
  edgeStrip: 'beech',  // kapak kenarindaki acik ahsap fitil | foto
};

/* ---------------------------------------------------- 3b. PENCERELER */
/**
 * Pencereler. Duvar yuzeyi boyunca u ekseninden konumlanir; her duvarin
 * u ekseni src/model/equipment.js -> wallFrame() ile ayni tanimi kullanir:
 *   front: u = x     back: u = x     left: u = y     right: u = y
 *
 * ⚠ TUM PENCERE OLCULERI FOTOGRAF 05'TEN ORANLANDI - YERINDE OLCULMELI.
 * Fotograf ultra genis acili oldugu icin dusey olculerde belirsizlik yuksek.
 * Kesin olcu icin gereken 4 deger docs/roleve.md bolum 9'da listeli.
 */
export const windows = [
  {
    id: 'P1', name: 'Pencere (ortadaki kanat açılır)',
    wall: 'back',
    u: 58,            // duvarin sol ucundan (x=0 kosesinden) uzaklik  | foto - TAHMIN
    width: 285,       // kasa dis genisligi                            | foto - TAHMIN
    sill: 80,         // denizlik ust kotu                             | foto - TAHMIN
    height: 130,      // kasa dis yuksekligi (ust kot 210)             | foto - TAHMIN
    frameWidth: 5,    // kasa/kanat profil genisligi                   | tipik
    frameDepth: 7,
    sillBoard: { depth: 22, thickness: 4, overhang: 3 }, // ic denizlik | foto
    reveal: 14,       // duvar kalinligindaki pervaz derinligi
    /**
     * Bolumler soldan saga (odadan bakinca), toplam = width.
     * kind: 'fixed' sabit cam | 'sash' acilir kanat (koyu cerceve, foto 05)
     */
    // Soldan (x kucuk) saga. Foto 05'te perdenin arkasi gorunmuyor; oradaki iki
    // bolum simetri varsayimiyla sabit cam kabul edildi.
    divisions: [
      { kind: 'fixed', width: 48 },
      { kind: 'fixed', width: 48 },
      { kind: 'fixed', width: 56 },
      { kind: 'sash',  width: 81 },
      { kind: 'fixed', width: 52 },
    ],
    curtain: {                    // tul perde - pencerenin sol ucunu ortuyor (foto 05)
      from: -2, to: 100,          // pencere u ekseninde
      drop: 122, headroom: 3,
      hem: 8,                     // alt agirlik bandi (fotoda koyu serit)
    },
    note: 'Foto 05: ortadaki koyu cerceveli kanat acilir, yanlar sabit. '
        + 'Sag ucta tul perde toplanmis duruyor. Olculer oranlama - yerinde teyit sart.',
  },
];

/** Isitma - pencere altindaki dilimli radyator (foto 05) */
export const radiators = [
  {
    id: 'R1', name: 'Dilimli radyatör',
    wall: 'back',
    u: 173,           // duvarin sol ucundan | foto - TAHMIN
    width: 59,        // ~8 dilim            | foto - TAHMIN
    height: 50,       // foto - TAHMIN
    depth: 11,
    floorGap: 10,     // dosemeden yukseklik
    sections: 8,
    note: 'Pencere ekseninin biraz solunda. Onune mobilya konulmamali.',
  },
];

/**
 * Pencereden gorunen dis baglam. Roleve degeri yok, yalnizca isik ve
 * derinlik hissi icin: foto 05'te karsida cephesi tasli, seritli pencereli
 * bir bina var.
 */
export const context = {
  facadeDistance: 900,     // karsi binaya yaklasik mesafe (cm)
  facadeHeight: 1400,
  skyColor: '#c3d2e0',
  note: 'Baglam - olculendirilmemistir.',
};

/* ------------------------------------------------------------- 4. DONATIM */
/**
 * Her eleman:
 *   pos: [x, y]  -> elemanin OTURMA ALANI sol-on kosesi (plan koordinati)
 *   rot: derece  -> +Z etrafinda saat yonunun tersi
 *   Olculer: w (genislik, yerel X), d (derinlik, yerel Y), h (yukseklik)
 *   z: taban kotu (varsayilan 0)
 */
export const furniture = [
  {
    id: 'M1', tag: 'Masa', name: 'Çalışma masası',
    type: 'desk',
    w: 160, d: 75, h: 75,          // kroki: "Masa = 160*75"
    pos: [283, 97], rot: 0,        // on-sag bolge, on duvara paralel
    topThickness: 2.5,
    materials: { top: 'beech', frame: 'steelDark', leg: 'steelLight' },
    note: 'Kroki notu: Masa = 160x75. On duvara paralel, kullanici +Y tarafinda oturur. '
        + 'ONEMLI: masanin sol ucu kapi kanadinin acilma yayina 1-2 cm mesafede; kapi '
        + 'pratikte ~150 dereceden fazla acilamaz (bkz. docs/roleve.md, tespit T-3).',
  },
  {
    id: 'D1', tag: 'Dolap', name: 'Çift kanatlı dolap',
    type: 'wardrobe',
    w: 80, d: 55, h: 185,          // kroki: "Dolap = 80"
    pos: [28, 45], rot: -90,       // sirti SOL duvarda, on yuzu +X (odaya bakar)
    doors: 2, plinth: 4,
    materials: { body: 'beech', front: 'beech', handle: 'steelDark' },
    note: 'Sirti sol duvarda. Boylece on duvardaki sari panelin (x 55-95) ustu bos '
        + 'kalir ve foto 03teki ayna oraya asilir.',
  },
  {
    id: 'S1', tag: 'Koltuk', name: 'Çalışma koltuğu',
    type: 'officeChair',
    w: 62, d: 62, h: 112,
    pos: [275, 150], rot: 180,     // masaya donuk (-Y); A1 tezgahinin onunu kapatmaz, masanin altina itilmis
    materials: { upholstery: 'blackLeather', base: 'chrome' },
  },
  {
    id: 'S2', tag: 'Sandalye', name: 'Misafir sandalyesi',
    type: 'stackChair',
    w: 48, d: 54, h: 82,
    pos: [33, 120], rot: -90,      // sol duvarda, odaya donuk
    materials: { upholstery: 'blackFabric', frame: 'steelDark' },
  },
  {
    id: 'A1', tag: 'Tezgah', name: 'Sağ duvar tezgâhı',
    type: 'credenza',
    w: 130, d: 60, h: 72,
    pos: [340, 205], rot: 90,      // sag duvar boyunca, pencere duvarina kadar
    materials: { body: 'beech', top: 'beechDark' },
    note: 'Foto 05: alcak bir kredenza degil, MASA YUKSEKLIGINDE surekli bir tezgah. '
        + 'On ucunda fotokopi/yazici, pencere ucunda kupa ve ustunde mantar pano var. '
        + 'M1 masasi ile birlikte L olusturur; ikisi arasinda 5 cm bosluk birakildi. '
        + 'Uzunluk fotograftan oranlandi - yerinde olculmeli.',
  },
  {
    id: 'C1', tag: 'Portmanto', name: 'Ayaklı askılık (portmanto)',
    type: 'coatStand',
    w: 38, d: 38, h: 178,
    pos: [300, 24], rot: 0,        // masa ile on duvar arasi, tablonun onunde
    materials: { frame: 'steelBlack' },
  },
  {
    id: 'W1', tag: 'Cop kovasi', name: 'Pedallı çöp kovası',
    type: 'bin',
    w: 30, d: 30, h: 42,
    pos: [243, 100], rot: 0,       // masa altinda
    materials: { body: 'plasticGrey' },
  },
];

/**
 * Sag duvardaki ankastre dolap duvari (foto 01/02 - sari + krem kapaklar).
 *
 * ⚠ KULLANICI DUZELTMESI: Bu dolaplar dar bir UST BANT degil; duvarin
 * tamamini kapliyor ve genislik boyunca UC panel var. Buna gore 270 cm'lik
 * duvar 3 x 90 cm modul olarak modellendi.
 *
 * ⚠ zBottom (dolabin alt kotu) hala TAHMIN. Foto 01'de saga dogru tezgahin
 * (A1, ust kot 72) hemen ustunden basliyor gibi duruyor; 75 cm alindi.
 * Dolap dosemeye kadar iniyorsa bu deger 0 yapilmali - yerinde olculmeli.
 */
export const wallUnits = {
  id: 'AD1', name: 'Ankastre dolap duvarı',
  wall: 'right',
  zBottom: 75,           // foto - TAHMIN (tezgah ustu)
  zTop: 288,             // foto
  depth: 35,             // tipik
  yStart: 0, yEnd: 270,  // duvarin tamami
  moduleWidth: 90,       // 270 / 3 panel | kullanici
  /**
   * Kapak renkleri. Dis dizi SIRALARI verir: [0] alt sira, [1] ust sira.
   * Ic dizi soldan saga, yani on duvardan (y=0) arka duvara (y=270) dogru.
   * Kullanici teyidi (foto 01): ust sira tamamen sari; alt sirada birinci
   * kutu sari, ikinci ve ucuncu beyaz.
   */
  doors: [
    ['yellow', 'offwhite', 'offwhite'],  // alt sira
    ['yellow', 'yellow',   'yellow'],    // ust sira
  ],
  gap: 0.4,
  /**
   * Kapaklara tropik duvar kagidi kaplanmis hali. Arayuzden acilip kapatilir
   * (Renkler bolumu). Acikken kapak renkleri devre disi kalir; desen 3 panel
   * boyunca TEK PARCA akar, her kapak kendi dilimini gosterir.
   */
  mural: false,
};

/* ----------------------------------------------- 5. EKIPMAN / MASA USTU */

export const equipment = [
  { id: 'E1', name: '24" ekran',          type: 'monitor',  w: 55, d: 20, h: 42, pos: [296,  76], rot: -10, onTop: 'M1' },
  { id: 'E2', name: 'Masaüstü bilgisayar',  type: 'pcTower',  w: 20, d: 45, h: 42, pos: [345,  88], rot: 4,   onTop: 'M1' },
  { id: 'E3', name: 'Klavye',               type: 'keyboard', w: 44, d: 15, h: 3,  pos: [292, 116], rot: -8,  onTop: 'M1' },
  { id: 'E4', name: 'Mouse',                type: 'mouse',    w: 7,  d: 11, h: 4,  pos: [330, 120], rot: -8,  onTop: 'M1' },
  { id: 'E5', name: 'Klasör / not defteri', type: 'binder',   w: 24, d: 32, h: 3,  pos: [237, 107], rot: -6,  onTop: 'M1' },
  { id: 'E6', name: 'Kalemlik',     type: 'penPot',   w: 11, d: 11, h: 20, pos: [268,  73], rot: 0,   onTop: 'M1' },
  { id: 'E7', name: 'Zımba / kutu',         type: 'smallBox', w: 12, d: 7,  h: 4,  pos: [249,  75], rot: -8,  onTop: 'M1' },
  { id: 'E8', name: 'Bardak altlığı',       type: 'coaster',  w: 11, d: 11, h: 1,  pos: [243,  97], rot: 0,   onTop: 'M1' },
  { id: 'E9', name: 'Fotokopi / yazıcı',    type: 'printer',  w: 58, d: 42, h: 44, pos: [340, 175], rot: 90,  onTop: 'A1' },
  // Foto 05: tezgahin pencere ucunda duran kupa
  { id: 'E10', name: 'Kupa (ödül)',         type: 'trophy',   w: 13, d: 13, h: 27, pos: [340, 250], rot: 0,   onTop: 'A1' },
];

/** Dolap ustundeki esyalar (foto 01/03) */
export const clutter = [
  // D1 dolabinin ustu (dolap -90 donuk oldugu icin ust yuzey x 0.5-55.5, y 5-85)
  { id: 'X1', name: 'Mavi klasör',      type: 'binder3d',  w: 8,  d: 30, h: 32, pos: [ 10,  26], rot: 4  , onTop: 'D1' },
  { id: 'X2', name: 'Eski CRT ekran', type: 'crt',       w: 34, d: 32, h: 28, pos: [ 29,  30], rot: -6 , onTop: 'D1' },
  { id: 'X3', name: 'Kutu oyunu',       type: 'boardGame', w: 30, d: 22, h: 6,  pos: [ 29,  64], rot: 102, onTop: 'D1' },
  // Doseme uzerinde, sari panelin dibinde (foto 01/03)
  { id: 'X4', name: 'Futbol topu',      type: 'ball',      w: 22, d: 22, h: 22, pos: [ 78, 36], rot: 0 },
  { id: 'X5', name: 'Karton rulo',      type: 'tube',      w: 38, d: 12, h: 12, pos: [ 76, 11], rot: 4 },
];

/* --------------------------------------------------- 6. DUVAR ELEMANLARI */
/**
 * wall : 'front' | 'back' | 'left' | 'right'
 * u    : duvar yuzeyi boyunca yatay konum (merkez), duvarin kendi baslangicindan
 * z    : merkez kotu
 */
export const wallItems = [
  { id: 'T1', name: 'Duvar saati',       type: 'clock',   wall: 'front', u: 232, z: 228, dia: 30, note: 'Yesil serit uzerinde (foto 01/02)' },
  { id: 'T2', name: 'Manzara tablosu',          type: 'picture', wall: 'front', u: 300, z: 198, w: 46, h: 40, art: 'landscape' },
  { id: 'T3', name: 'Ayna',       type: 'mirror',  wall: 'front', u:  75, z: 152, w: 34, h: 40, note: 'Dolap ile kapi kasasi arasindaki bos sari panelde (foto 03)' },
  { id: 'T4', name: 'Çerçeveli belge + bayrak', type: 'picture', wall: 'right', u:  35, z: 248, w: 52, h: 66, art: 'certificate' },
  { id: 'T5', name: 'Işık anahtarı',     type: 'switch',  wall: 'front', u: 237, z: 122, w: 8,  h: 8 },
  { id: 'T6', name: 'Priz',                     type: 'socket',  wall: 'right', u: 140, z:  40, w: 8,  h: 8 },
  { id: 'T7', name: 'Priz',                     type: 'socket',  wall: 'left',  u:  90, z:  40, w: 8,  h: 8 },
  { id: 'T8', name: 'Mantar pano',              type: 'pinboard', wall: 'right', u: 195, z: 150, w: 70, h: 52, note: 'Tezgahin uzerinde, pencereye yakin (foto 05)' },
];

/* ------------------------------------------- 7. TAVAN / DOSEME / TESISAT */

export const ceiling = {
  type: 'suspended',                 // tasiyicili mineral asma tavan
  tile: [60, 60],                    // plaka olcusu | foto
  finish: 'acousticTile',
  gridColor: '#cfc9bd',
  luminaires: [
    { id: 'L1', name: 'Sivaalti floresan armatur 60x60', type: 'panel60', pos: [95, 100],  w: 60, d: 60 },
    { id: 'L2', name: 'Sivaalti floresan armatur 60x60', type: 'panel60', pos: [250, 100], w: 60, d: 60 },
  ],
};

export const floor = {
  finish: 'terrazzo',                // gri serpantinli karo | foto
  tile: [33, 33],
  groutColor: '#8f9296',
  skirting: null,                    // fotograflarda supurgelik yok
};

/* ----------------------------------------------------- 8. MALZEME PALETI */
/** Fotograflardan okunan renkler. Teklif/metraj icin RAL karsiliklari not edildi. */
export const palette = {
  yellow:      { hex: '#f2c11c', label: 'Boluntu panel sarisi',  ral: 'RAL 1023 benzeri' },
  green:       { hex: '#3d9b2f', label: 'Yesil (serit + arka duvar)', ral: 'RAL 6018 benzeri' },
  curtain:     { hex: '#e8e2d4', label: 'Tul perde',               ral: '-' },
  radiator:    { hex: '#f0efec', label: 'Radyator (beyaz)',         ral: 'RAL 9016' },
  greenLight:  { hex: '#7cc623', label: 'Tavan yesil bandi',      ral: 'RAL 6018 acik' },
  lilac:       { hex: '#bdb5c9', label: 'Duvar boyasi (lila)',    ral: 'RAL 7035 mor tonlu' },
  offwhite:    { hex: '#ded8cc', label: 'Krem dolap kapagi',      ral: 'RAL 9001' },
  beech:       { hex: '#c98b4b', label: 'Kayin/ceviz melamin',    ral: '-' },
  beechDark:   { hex: '#8d5a2b', label: 'Koyu melamin',           ral: '-' },
  greyLaminate:{ hex: '#adaaa4', label: 'Kapi kanadi gri laminat', ral: 'RAL 7038' },
  floorGrey:   { hex: '#989ca0', label: 'Doseme karosu',          ral: '-' },
  ceilingTile: { hex: '#e9e2d3', label: 'Asma tavan plakasi',     ral: '-' },
  blackLeather:{ hex: '#26262a', label: 'Koltuk suni deri',       ral: '-' },
  blackFabric: { hex: '#33343a', label: 'Sandalye kumasi',        ral: '-' },
  steelDark:   { hex: '#3a3c40', label: 'Metal aksam (koyu)',     ral: '-' },
  steelLight:  { hex: '#a7abb0', label: 'Metal aksam (acik)',     ral: '-' },
  chrome:      { hex: '#c8ccd2', label: 'Krom',                   ral: '-' },
  aluminium:   { hex: '#9ea3a8', label: 'Aluminyum profil',       ral: '-' },
  plasticGrey: { hex: '#b4b8bb', label: 'Gri plastik',            ral: '-' },
};

/* ------------------------------------------------------ 9. KAMERA ONAYARI */
/** Fotograflarla birebir karsilastirma icin bakis noktalari. */
/**
 * Kamera onayarlari. pos/target = [x, y, z] plan koordinatlari (cm).
 * doorAngle: o gorunumde kapinin gosterilecegi aci (foto ile ayni durum).
 */
/** label: genis ekran · short: telefonda (komut seridi tek satirda kaysin diye) */
export const viewPresets = [
  { id: 'foto01', label: 'Foto 01 · Genel görünüm', short: 'Genel',   pos: [318, 244, 158], target: [122,  40, 118], fov: 76, doorAngle: 0 },
  { id: 'foto02', label: 'Foto 02 · Kapı açık',     short: 'Kapı',    pos: [ 52, 238, 155], target: [300,  35, 115], fov: 70, doorAngle: 105 },
  { id: 'foto03', label: 'Foto 03 · Sol köşe',      short: 'Sol köşe', pos: [288, 226, 150], target: [ 26,  35, 108], fov: 66, doorAngle: 105 },
  { id: 'masa',   label: 'Çalışma alanı',           short: 'Masa',    pos: [150, 232, 138], target: [330,  80,  85], fov: 50, doorAngle: 0 },
  { id: 'foto05', label: 'Foto 05 · Pencere duvarı', short: 'Pencere', pos: [186,  36, 152], target: [200, 262, 118], fov: 78, doorAngle: 0 },
  { id: 'kus',    label: 'Kuş bakışı', short: 'Kuş bakışı', pos: [770, 710, 570], target: [185, 135,  55], fov: 34, doorAngle: 100 },
  { id: 'plan',   label: 'Plan',       short: 'Plan',       pos: [185, 135, 780], target: [185, 135,   0], fov: 30, ortho: true, doorAngle: 95 },
];

export const meta = {
  project: 'Oda Tasarimi / Room Design',
  drawnBy: 'Parametrik model - src/config/room.js',
  scaleNote: 'Tum olculer cm. glTF/GLB ihracatinda 1 birim = 1 metre (glTF standardi).',
  revision: 'R00',
  date: '2026-09-01',
};

/* ================================================== 10. SEMA UYGULAMA */
/**
 * Bir tasarim semasini config'e UYGULAR. Palet, mobilya/ekipman konumlari ve
 * dolap kapak deseni yerinde degistirilir; boylece bu modulu okuyan her sey
 * (3B model, kotalar, teknik cizimler, metraj) ayni semayi gorur.
 *
 * Once mevcut duruma (S-0) donulur, sonra sema farki uygulanir - semalar
 * arasinda gecis yaparken birikme olmaz.
 */
/** Semaya gore gizlenen elemanlar. buildRoom, denetim, cizim ve metraj bunu okur. */
export const hidden = new Set();
/**
 * Kullanicinin arayuzden tek tek kapattigi kalemler. `hidden`den ayri tutulur:
 * `hidden` semanin karari (sema degisince sifirlanir), `userHidden` kullanicinin
 * karari (sema degisse de kalir). Ikisi de yalnizca GORUNURLUGU etkiler.
 */
export const userHidden = new Set();
export const isVisible = (it) => !hidden.has(it.id) && !userHidden.has(it.id);
/** Denetim/metraj icin: kullanici gizlese de eleman odada durmaya devam eder. */
export const inRoom = (it) => !hidden.has(it.id);
/** Yalnizca aktif semada bulunan mobilyalar */
export const activeFurniture = () => furniture.filter(isVisible);

const BASE = {
  palette: JSON.parse(JSON.stringify(palette)),
  furniture: furniture.map((f) => ({ pos: [...f.pos], rot: f.rot || 0, w: f.w, d: f.d, h: f.h })),
  equipment: equipment.map((f) => ({ pos: [...f.pos], rot: f.rot || 0 })),
  clutter: clutter.map((f) => ({ pos: [...f.pos], rot: f.rot || 0 })),
  wallItems: wallItems.map((w) => ({ u: w.u, z: w.z })),
  wallUnitDoors: wallUnits.doors.map((r) => [...r]),
  wallUnitMural: wallUnits.mural,
  doorSwing: door.swing,
  doorOpenAngle: door.openAngle,
  windows: windows.map((w) => ({ curtain: { ...w.curtain }, sillBoard: { ...w.sillBoard } })),
};

export let activeScheme = 's0';

export function applyScheme(resolved) {
  // 1) mevcut duruma don
  for (const [k, v] of Object.entries(BASE.palette)) palette[k] = { ...v };
  furniture.forEach((f, i) => {
    const b = BASE.furniture[i];
    f.pos = [...b.pos]; f.rot = b.rot; f.w = b.w; f.d = b.d; f.h = b.h;
  });
  equipment.forEach((f, i) => { f.pos = [...BASE.equipment[i].pos]; f.rot = BASE.equipment[i].rot; });
  clutter.forEach((f, i) => { f.pos = [...BASE.clutter[i].pos]; f.rot = BASE.clutter[i].rot; });
  wallItems.forEach((w, i) => { w.u = BASE.wallItems[i].u; w.z = BASE.wallItems[i].z; });
  wallUnits.doors = BASE.wallUnitDoors.map((r) => [...r]);
  wallUnits.mural = BASE.wallUnitMural;
  windows.forEach((w, i) => { w.curtain = { ...BASE.windows[i].curtain }; w.sillBoard = { ...BASE.windows[i].sillBoard }; });
  // varsayilan: yalnizca odada GERCEKTEN olanlar gorunur
  hidden.clear();
  for (const f of [...furniture, ...equipment, ...clutter]) if (f.proposedOnly) hidden.add(f.id);

  // 2) sema farkini uygula
  if (!resolved) { activeScheme = 's0'; return; }
  for (const [k, v] of Object.entries(resolved.palette || {})) palette[k] = { ...palette[k], ...v };
  const patch = (arr, over) => {
    for (const [id, d] of Object.entries(over || {})) {
      const it = arr.find((x) => x.id === id);
      if (!it) continue;
      if (d.pos) it.pos = [...d.pos];
      if (d.rot !== undefined) it.rot = d.rot;
      // olcu degisikligi (semaya ozel imalat kalemi olur - metraja yazilmali)
      for (const k of ['w', 'd', 'h']) if (d[k] !== undefined) it[k] = d[k];
      if (d.u !== undefined) it.u = d.u;
      if (d.z !== undefined) it.z = d.z;
    }
  };
  patch(furniture, resolved.furniture);
  patch(equipment, resolved.equipment);
  patch(clutter, resolved.clutter);
  patch(wallItems, resolved.wallItems);
  // Yerlesim kapinin acilma yonunu degistirebilir (disa acilan kapi ~2 m2 kazandirir)
  door.swing = resolved.door?.swing || BASE.doorSwing;
  door.openAngle = resolved.door?.openAngle ?? BASE.doorOpenAngle;
  for (const [id, d] of Object.entries(resolved.windows || {})) {
    const w = windows.find((x) => x.id === id);
    if (!w) continue;
    if (d.curtain) w.curtain = { ...w.curtain, ...d.curtain };
    if (d.sillBoard) w.sillBoard = { ...w.sillBoard, ...d.sillBoard };
  }
  for (const id of resolved.show || []) hidden.delete(id);
  for (const id of resolved.hide || []) hidden.add(id);
  if (resolved.wallUnitDoors) wallUnits.doors = resolved.wallUnitDoors.map((r) => [...r]);
  if (resolved.wallUnitMural !== undefined) wallUnits.mural = !!resolved.wallUnitMural;
  activeScheme = resolved.id;
}
