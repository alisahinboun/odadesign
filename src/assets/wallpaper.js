/**
 * ============================================================================
 *  DUVAR KAGIDI GORSELI  (base64, HTML'e gomulu)
 * ============================================================================
 *  Proje TEK bir HTML dosyasi olarak dagitiliyor (dist/index.html). Bu yuzden
 *  duvar kagidi gorseli ayri bir dosya olarak degil, base64 veri adresi (data
 *  URI) olarak buraya gomulur ve derlemede HTML'in icinde kalir.
 *
 *  GOMMEK ICIN:
 *      npm run duvar-kagidi -- /yol/gorsel.jpg
 *
 *  Komut gorseli 2048 px genislige olceklendirir, JPEG olarak sikistirir ve bu
 *  dosyayi yeniden yazar. Dosya boyutu asagida `note` alaninda tutulur.
 *
 *  DEGER null ISE: src/lib/textures.js icindeki CIZILMIS desen kullanilir
 *  (prosedurel tropik mural). Yani gorsel olmadan da her sey calisir.
 * ============================================================================
 */

/** @type {string|null} data:image/jpeg;base64,... */
export const wallpaperDataURI = null;

/** Gomulu gorselin kaynagi ve olcusu - metrajda/notlarda gosterilir */
export const wallpaperInfo = {
  source: null,      // dosya adi
  px: null,          // [w, h]
  bytes: 0,
};
