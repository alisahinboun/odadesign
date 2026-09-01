/** Malzeme kutuphanesi. Tum renkler src/config/room.js -> palette icinden gelir. */
import * as THREE from 'three';
import { palette } from '../config/room.js';
import * as T from './textures.js';
import { clearTextureCache } from './textures.js';

const cache = new Map();
const CM = 100; // 1 three.js birimi = 1 m, config cm -> repeat hesabinda kullanilir

/** Bir yuzey icin doku tekrar sayisi: yuzey olcusu (cm) / doku kapsama (cm) */
function rep(tex, wCm, hCm, coverCm) {
  const t = tex.clone();
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(wCm / coverCm, hCm / coverCm);
  t.needsUpdate = true;
  return t;
}

function tx(canvas, { repeat = [1, 1], srgb = true } = {}) {
  const t = new THREE.CanvasTexture(canvas);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(...repeat);
  t.anisotropy = 8;
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function M(key, fn) {
  if (!cache.has(key)) cache.set(key, fn());
  return cache.get(key);
}

/** Sema degistiginde cagrilir: malzemeler ve dokular yeniden uretilir. */
export function clearMaterialCache() {
  for (const m of cache.values()) {
    if (m.map) m.map.dispose();
    m.dispose?.();
  }
  cache.clear();
  clearTextureCache();
}

/* -------------------------------------------------------------- KABUK */

export const mat = {
  floor: (wCm, dCm) => M(`floor${wCm}x${dCm}`, () => new THREE.MeshStandardMaterial({
    map: tx(T.floorTexture(), { repeat: [wCm / 66, dCm / 66] }),
    roughness: 0.34, metalness: 0.02, envMapIntensity: 0.75,
  })),

  ceiling: (wCm, dCm) => M(`ceil${wCm}x${dCm}`, () => new THREE.MeshStandardMaterial({
    map: tx(T.ceilingTexture(), { repeat: [wCm / 60, dCm / 60] }),
    roughness: 0.95, metalness: 0,
  })),

  paint: (name, wCm = 200, hCm = 200, wear = 0.5) =>
    M(`paint${name}${Math.round(wCm)}x${Math.round(hCm)}x${wear}`, () => new THREE.MeshStandardMaterial({
      map: tx(T.paintTexture(palette[name].hex, 512, wear), { repeat: [wCm / 140, hCm / 140] }),
      roughness: 0.72, metalness: 0,
    })),

  wood: (name = 'beech', wCm = 100, hCm = 100, streak = 0.5) =>
    M(`wood${name}${Math.round(wCm)}x${Math.round(hCm)}x${streak}`, () => new THREE.MeshStandardMaterial({
      map: tx(T.woodTexture(palette[name].hex, 1024, streak), { repeat: [wCm / 120, hCm / 60] }),
      roughness: 0.40, metalness: 0.02, envMapIntensity: 0.85,
    })),

  wiredGlass: (wCm = 100, hCm = 60) => M(`wg${Math.round(wCm)}x${Math.round(hCm)}`, () =>
    new THREE.MeshPhysicalMaterial({
      map: tx(T.wiredGlassTexture(), { repeat: [wCm / 60, hCm / 60] }),
      transparent: true, opacity: 0.80, roughness: 0.42, metalness: 0,
      transmission: 0.22, thickness: 0.6, side: THREE.DoubleSide,
    })),

  mirror: () => M('mirror', () => new THREE.MeshPhysicalMaterial({
    color: 0xdfe6e8, roughness: 0.06, metalness: 0.92, envMapIntensity: 1.6,
  })),

  /* ------------------------------------------------------- METAL / PLASTIK */
  metal: (name = 'steelDark', rough = 0.38) => M(`met${name}${rough}`, () =>
    new THREE.MeshStandardMaterial({ color: palette[name].hex, roughness: rough, metalness: 0.85, envMapIntensity: 1.0 })),

  chrome: () => M('chr', () => new THREE.MeshStandardMaterial({
    color: palette.chrome.hex, roughness: 0.14, metalness: 1.0, envMapIntensity: 1.5 })),

  alu: () => M('alu', () => new THREE.MeshStandardMaterial({
    color: palette.aluminium.hex, roughness: 0.42, metalness: 0.7, envMapIntensity: 0.9 })),

  plastic: (hex = palette.plasticGrey.hex, rough = 0.55) => M(`pl${hex}${rough}`, () =>
    new THREE.MeshStandardMaterial({ color: hex, roughness: rough, metalness: 0.03 })),

  /* --------------------------------------------------------- DOSEMELIK */
  leather: () => M('lth', () => new THREE.MeshStandardMaterial({
    map: tx(T.leatherTexture(palette.blackLeather.hex), { repeat: [2, 2] }),
    roughness: 0.44, metalness: 0.04, envMapIntensity: 0.8 })),

  fabric: () => M('fab', () => new THREE.MeshStandardMaterial({
    map: tx(T.fabricTexture(palette.blackFabric.hex), { repeat: [4, 4] }),
    roughness: 0.92, metalness: 0 })),

  /* ------------------------------------------------------------- EKRAN */
  screenOff: () => M('scr', () => new THREE.MeshStandardMaterial({
    color: 0x121417, roughness: 0.22, metalness: 0.35, envMapIntensity: 1.2 })),

  /* ------------------------------------------------------------ SANAT */
  art: (kind) => M('art' + kind, () => {
    const canvas = kind === 'certificate' ? T.certificateArt()
                 : kind === 'poster' ? T.corridorPoster()
                 : T.landscapeArt();
    return new THREE.MeshStandardMaterial({ map: tx(canvas), roughness: 0.8, metalness: 0 });
  }),

  plain: (hex, rough = 0.7, metal = 0) => M(`p${hex}${rough}${metal}`, () =>
    new THREE.MeshStandardMaterial({ color: hex, roughness: rough, metalness: metal })),

  emissive: (hex = 0xffffff, i = 2.4) => M(`em${hex}${i}`, () =>
    new THREE.MeshStandardMaterial({ color: hex, emissive: hex, emissiveIntensity: i, roughness: 1 })),
};

export { rep, tx, CM };
