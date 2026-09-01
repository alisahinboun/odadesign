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

  // Sol koseden (x=0) baslayarak panel dizilimi. Toplam 370 olmali.
  panels: [
    { id: 'P1', kind: 'solid', width: 95,  color: 'yellow' },  // aynanin oldugu panel
    { id: 'D1', kind: 'door',  width: 120 },                   // kroki: "120cm kapi"
    { id: 'P2', kind: 'solid', width: 35,  color: 'green'  },  // saatin oldugu yesil serit
    { id: 'P3', kind: 'solid', width: 120, color: 'yellow' },  // tablonun oldugu panel
  ],
};

export const walls = {
  left:  { id: 'D-SOL',  finish: 'lilac',    note: 'Sivali + plastik boya (lila). Dolap ve misafir sandalyesi bu duvarda.' },
  back:  { id: 'D-ARKA', finish: 'lilac',    note: 'ROLEVE EKSIK - fotograflarda gorunmuyor, sol duvarla ayni kabul edildi.' },
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
    id: 'M1', tag: 'Masa', name: 'Calisma masasi',
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
    id: 'D1', tag: 'Dolap', name: 'Cift kanatli elbise/evrak dolabi',
    type: 'wardrobe',
    w: 80, d: 55, h: 185,          // kroki: "Dolap = 80"
    pos: [28, 45], rot: -90,       // sirti SOL duvarda, on yuzu +X (odaya bakar)
    doors: 2, plinth: 4,
    materials: { body: 'beech', front: 'beech', handle: 'steelDark' },
    note: 'Sirti sol duvarda. Boylece on duvardaki sari panelin (x 55-95) ustu bos '
        + 'kalir ve foto 03teki ayna oraya asilir.',
  },
  {
    id: 'K2', tag: 'Modul', name: '80 cm rafli modul (kitaplik kabul edildi)',
    type: 'bookcase',
    w: 80, d: 35, h: 185,          // kroki: ucuncu satir "... = 80"
    pos: [23, 202], rot: -90,      // arka-sol kose, sirti sol duvarda
    shelves: 5,
    materials: { body: 'beech', back: 'beechDark' },
    note: 'KROKI OKUNAMADI: ucuncu satirdaki 80 cm lik eleman. Kitaplik kabul edildi; '
        + 'farkli ise type ("wardrobe" | "bookcase" | "credenza") ve name alanlarini degistirin.',
  },
  {
    id: 'S1', tag: 'Koltuk', name: 'Yonetici calisma koltugu',
    type: 'officeChair',
    w: 62, d: 62, h: 112,
    pos: [290, 148], rot: 180,     // masaya donuk (-Y), masanin altina itilmis
    materials: { upholstery: 'blackLeather', base: 'chrome' },
  },
  {
    id: 'S2', tag: 'Sandalye', name: 'Misafir sandalyesi (istiflenebilir)',
    type: 'stackChair',
    w: 48, d: 54, h: 82,
    pos: [33, 120], rot: -90,      // sol duvarda, odaya donuk
    materials: { upholstery: 'blackFabric', frame: 'steelDark' },
  },
  {
    id: 'A1', tag: 'Alt dolap', name: 'Yazici altligi / alcak dolap',
    type: 'credenza',
    w: 90, d: 45, h: 62,
    pos: [345, 210], rot: 90,      // sag duvarda, odaya donuk (-X)
    materials: { body: 'beech', top: 'beechDark' },
    note: 'Arka-sag kosede, uzerinde fotokopi/yazici var (foto 01 sag kenar).',
  },
  {
    id: 'C1', tag: 'Portmanto', name: 'Ayakli askilik',
    type: 'coatStand',
    w: 38, d: 38, h: 178,
    pos: [300, 24], rot: 0,        // masa ile on duvar arasi, tablonun onunde
    materials: { frame: 'steelBlack' },
  },
  {
    id: 'W1', tag: 'Cop kovasi', name: 'Pedalli cop kovasi',
    type: 'bin',
    w: 30, d: 30, h: 42,
    pos: [243, 100], rot: 0,       // masa altinda
    materials: { body: 'plasticGrey' },
  },
];

/** Sag duvardaki ankastre ust dolap bankosu (foto 01/02 - sari + krem kapaklar) */
export const wallUnits = {
  id: 'AD1', name: 'Ankastre ust dolap bankosu',
  wall: 'right',
  zBottom: 182,          // foto
  zTop: 288,             // foto
  depth: 35,             // tipik
  yStart: 0, yEnd: 270,  // duvarin tamami
  moduleWidth: 60,       // kapak modulu | foto
  frontPattern: ['yellow', 'yellow', 'offwhite', 'yellow', 'offwhite', 'offwhite'],
  gap: 0.4,
};

/* ----------------------------------------------- 5. EKIPMAN / MASA USTU */

export const equipment = [
  { id: 'E1', name: '24" monitor',          type: 'monitor',  w: 55, d: 20, h: 42, pos: [296,  76], rot: -10, onTop: 'M1' },
  { id: 'E2', name: 'Masaustu bilgisayar',  type: 'pcTower',  w: 20, d: 45, h: 42, pos: [345,  88], rot: 4,   onTop: 'M1' },
  { id: 'E3', name: 'Klavye',               type: 'keyboard', w: 44, d: 15, h: 3,  pos: [292, 116], rot: -8,  onTop: 'M1' },
  { id: 'E4', name: 'Mouse',                type: 'mouse',    w: 7,  d: 11, h: 4,  pos: [330, 120], rot: -8,  onTop: 'M1' },
  { id: 'E5', name: 'Klasor / not defteri', type: 'binder',   w: 24, d: 32, h: 3,  pos: [237, 107], rot: -6,  onTop: 'M1' },
  { id: 'E6', name: 'Kalemlik (hasir)',     type: 'penPot',   w: 11, d: 11, h: 20, pos: [268,  73], rot: 0,   onTop: 'M1' },
  { id: 'E7', name: 'Zimba / kutu',         type: 'smallBox', w: 12, d: 7,  h: 4,  pos: [249,  75], rot: -8,  onTop: 'M1' },
  { id: 'E8', name: 'Bardak altligi',       type: 'coaster',  w: 11, d: 11, h: 1,  pos: [243,  97], rot: 0,   onTop: 'M1' },
  { id: 'E9', name: 'Fotokopi / yazici',    type: 'printer',  w: 58, d: 42, h: 44, pos: [345, 210], rot: 90,  onTop: 'A1' },
];

/** Dolap ustundeki esyalar (foto 01/03) */
export const clutter = [
  // D1 dolabinin ustu (dolap -90 donuk oldugu icin ust yuzey x 0.5-55.5, y 5-85)
  { id: 'X1', name: 'Mavi klasor',      type: 'binder3d',  w: 8,  d: 30, h: 32, pos: [ 10,  26], rot: 4  , onTop: 'D1' },
  { id: 'X2', name: 'Eski CRT monitor', type: 'crt',       w: 34, d: 32, h: 28, pos: [ 29,  30], rot: -6 , onTop: 'D1' },
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
  { id: 'T1', name: 'Duvar saati (OSYM)',       type: 'clock',   wall: 'front', u: 232, z: 228, dia: 30, note: 'Yesil serit uzerinde (foto 01/02)' },
  { id: 'T2', name: 'Manzara tablosu',          type: 'picture', wall: 'front', u: 300, z: 198, w: 46, h: 40, art: 'landscape' },
  { id: 'T3', name: 'Ayna (sari askili)',       type: 'mirror',  wall: 'front', u:  75, z: 152, w: 34, h: 40, note: 'Dolap ile kapi kasasi arasindaki bos sari panelde (foto 03)' },
  { id: 'T4', name: 'Cerceveli belge + bayrak', type: 'picture', wall: 'right', u:  35, z: 248, w: 52, h: 66, art: 'certificate' },
  { id: 'T5', name: 'Anahtar (aydinlatma)',     type: 'switch',  wall: 'front', u: 237, z: 122, w: 8,  h: 8 },
  { id: 'T6', name: 'Priz',                     type: 'socket',  wall: 'right', u: 140, z:  40, w: 8,  h: 8 },
  { id: 'T7', name: 'Priz',                     type: 'socket',  wall: 'left',  u:  90, z:  40, w: 8,  h: 8 },
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
  green:       { hex: '#3faa35', label: 'Yesil dusey serit',      ral: 'RAL 6018 benzeri' },
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
export const viewPresets = [
  { id: 'foto01', label: 'Foto 01 - Genel gorunum',  pos: [352, 262, 160], target: [120,  40, 120], fov: 88, doorAngle: 0 },
  { id: 'foto02', label: 'Foto 02 - Kapi acik',      pos: [ 40, 250, 155], target: [300,  30, 115], fov: 74, doorAngle: 105 },
  { id: 'foto03', label: 'Foto 03 - Sol kose',       pos: [300, 240, 150], target: [ 20,  30, 105], fov: 68, doorAngle: 105 },
  { id: 'masa',   label: 'Calisma alani',            pos: [150, 232, 138], target: [330,  80,  85], fov: 50, doorAngle: 0 },
  { id: 'kus',    label: 'Kus bakisi (aksonometri)', pos: [770, 710, 570], target: [185, 135,  55], fov: 34, doorAngle: 100 },
  { id: 'plan',   label: 'Plan (tepeden)',           pos: [185, 135, 780], target: [185, 135,   0], fov: 30, ortho: true, doorAngle: 95 },
];

export const meta = {
  project: 'Oda Tasarimi / Room Design',
  drawnBy: 'Parametrik model - src/config/room.js',
  scaleNote: 'Tum olculer cm. glTF/GLB ihracatinda 1 birim = 1 metre (glTF standardi).',
  revision: 'R00',
  date: '2026-09-01',
};
