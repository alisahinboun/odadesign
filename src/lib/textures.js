/**
 * Prosedurel doku ureteci - hicbir dis dosya/asset gerektirmez.
 * Hepsi <canvas> uzerinde cizilir, THREE.CanvasTexture olarak dondurulur.
 */
import * as THREE from 'three';

const cache = new Map();
function memo(key, fn) {
  if (!cache.has(key)) cache.set(key, fn());
  return cache.get(key);
}

/** Palet degistiginde dokular yeniden cizilmeli */
export function clearTextureCache() { cache.clear(); }

function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return { c, g: c.getContext('2d') };
}

function finish(c, { repeat = [1, 1], srgb = true, aniso = 8 } = {}) {
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeat[0], repeat[1]);
  t.anisotropy = aniso;
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.needsUpdate = true;
  return t;
}

/* pseudo-random, deterministik */
let _s = 1337;
function rnd() { _s = (_s * 1664525 + 1013904223) % 4294967296; return _s / 4294967296; }
function seed(v) { _s = v; }

/* --------------------------------------------------------------- DOSEME */
/** Gri serpantinli terrazzo/granit karo - 33x33 cm, ince taneli */
export function floorTexture(px = 1024) {
  return memo('floor' + px, () => {
    const { c, g } = makeCanvas(px, px);
    seed(4711);
    g.fillStyle = '#989ca0'; g.fillRect(0, 0, px, px);
    // taneler
    for (let i = 0; i < 42000; i++) {
      const x = rnd() * px, y = rnd() * px, r = 0.6 + rnd() * 2.1;
      const v = rnd();
      g.fillStyle = v < 0.34 ? `rgba(60,64,70,${0.25 + rnd() * 0.5})`
                 : v < 0.66 ? `rgba(240,242,245,${0.2 + rnd() * 0.45})`
                            : `rgba(150,158,150,${0.15 + rnd() * 0.35})`;
      g.beginPath(); g.arc(x, y, r, 0, 6.284); g.fill();
    }
    // hafif leke/asinma
    for (let i = 0; i < 26; i++) {
      const x = rnd() * px, y = rnd() * px, r = 40 + rnd() * 150;
      const gr = g.createRadialGradient(x, y, 0, x, y, r);
      gr.addColorStop(0, `rgba(120,124,128,${0.05 + rnd() * 0.06})`);
      gr.addColorStop(1, 'rgba(120,124,128,0)');
      g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2);
    }
    // 2x2 karo derzi (doku 66x66 cm alani kaplar)
    g.strokeStyle = 'rgba(112,117,122,0.85)'; g.lineWidth = px / 340;
    for (const p of [0, px / 2, px]) {
      g.beginPath(); g.moveTo(p, 0); g.lineTo(p, px); g.stroke();
      g.beginPath(); g.moveTo(0, p); g.lineTo(px, p); g.stroke();
    }
    g.strokeStyle = 'rgba(255,255,255,0.20)'; g.lineWidth = px / 700;
    for (const p of [px / 2 + px / 300, px / 300]) {
      g.beginPath(); g.moveTo(p, 0); g.lineTo(p, px); g.stroke();
      g.beginPath(); g.moveTo(0, p); g.lineTo(px, p); g.stroke();
    }
    return c;
  });
}

/* ---------------------------------------------------------------- TAVAN */
/** Mineral asma tavan plakasi - 60x60, ince delikli/desenli yuzey */
export function ceilingTexture(px = 512) {
  return memo('ceil' + px, () => {
    const { c, g } = makeCanvas(px, px);
    seed(2029);
    g.fillStyle = '#efe9dc'; g.fillRect(0, 0, px, px);
    // desenli "yaprak" izleri (fotoda gorulen soluk motif)
    for (let i = 0; i < 260; i++) {
      const x = rnd() * px, y = rnd() * px, r = 6 + rnd() * 16;
      g.save(); g.translate(x, y); g.rotate(rnd() * 6.284);
      g.fillStyle = `rgba(206,196,178,${0.18 + rnd() * 0.2})`;
      g.beginPath(); g.ellipse(0, 0, r, r * 0.55, 0, 0, 6.284); g.fill();
      g.restore();
    }
    // ince gozenek
    for (let i = 0; i < 9000; i++) {
      g.fillStyle = `rgba(180,172,156,${0.1 + rnd() * 0.25})`;
      g.beginPath(); g.arc(rnd() * px, rnd() * px, 0.5 + rnd() * 1.2, 0, 6.284); g.fill();
    }
    // tasiyici profil (T24) - plaka kenari
    g.strokeStyle = 'rgba(198,192,180,1)'; g.lineWidth = px / 90;
    g.strokeRect(0, 0, px, px);
    g.strokeStyle = 'rgba(255,255,255,0.55)'; g.lineWidth = px / 200;
    g.strokeRect(px / 180, px / 180, px - px / 90, px - px / 90);
    return c;
  });
}

/* ----------------------------------------------------------------- AHSAP */
/** Kayin/ceviz melamin - yatay damarli */
export function woodTexture(base = '#c98b4b', px = 1024, streak = 0.5) {
  return memo('wood' + base + px + streak, () => {
    const { c, g } = makeCanvas(px, px / 2);
    const h = px / 2;
    seed(915);
    g.fillStyle = base; g.fillRect(0, 0, px, h);
    // damarlar
    for (let i = 0; i < 190; i++) {
      const y = rnd() * h;
      const amp = 1.5 + rnd() * 7;
      const dark = rnd() < 0.55;
      g.strokeStyle = dark
        ? `rgba(96,54,20,${(0.05 + rnd() * 0.16) * streak * 2})`
        : `rgba(255,220,170,${(0.04 + rnd() * 0.12) * streak * 2})`;
      g.lineWidth = 0.6 + rnd() * 3.2;
      g.beginPath();
      for (let x = 0; x <= px; x += 12) {
        const yy = y + Math.sin((x / px) * (2 + rnd() * 0.02) * 6.284 + i) * amp;
        x === 0 ? g.moveTo(x, yy) : g.lineTo(x, yy);
      }
      g.stroke();
    }
    // budak
    for (let i = 0; i < 4; i++) {
      const x = rnd() * px, y = rnd() * h;
      for (let k = 0; k < 9; k++) {
        g.strokeStyle = `rgba(90,50,18,${0.10 - k * 0.01})`;
        g.lineWidth = 1.2;
        g.beginPath(); g.ellipse(x, y, 4 + k * 4.5, 2 + k * 1.7, 0, 0, 6.284); g.stroke();
      }
    }
    return c;
  });
}

/* --------------------------------------------------------- BOYALI DUVAR */
/** Plastik boya - cok hafif portakal kabugu dokusu + leke */
export function paintTexture(hex, px = 512, wear = 0.5) {
  return memo('paint' + hex + px + wear, () => {
    const { c, g } = makeCanvas(px, px);
    seed(77 + hex.length * 31);
    g.fillStyle = hex; g.fillRect(0, 0, px, px);
    for (let i = 0; i < 16000; i++) {
      const a = (rnd() - 0.5) * 0.10 * wear;
      g.fillStyle = a > 0 ? `rgba(255,255,255,${a})` : `rgba(0,0,0,${-a})`;
      g.fillRect(rnd() * px, rnd() * px, 1 + rnd() * 2, 1 + rnd() * 2);
    }
    for (let i = 0; i < 14; i++) {
      const x = rnd() * px, y = rnd() * px, r = 30 + rnd() * 110;
      const gr = g.createRadialGradient(x, y, 0, x, y, r);
      gr.addColorStop(0, `rgba(90,80,70,${0.03 * wear})`);
      gr.addColorStop(1, 'rgba(90,80,70,0)');
      g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2);
    }
    return c;
  });
}

/* -------------------------------------------------------------- TELLI CAM */
/** Vasistas camlari - telli/buzlu, arkasi belirsiz gorunur */
export function wiredGlassTexture(px = 512) {
  return memo('wglass' + px, () => {
    const { c, g } = makeCanvas(px, px);
    g.fillStyle = 'rgba(158,168,170,1)'; g.fillRect(0, 0, px, px);
    seed(51);
    for (let i = 0; i < 3000; i++) {
      g.fillStyle = `rgba(255,255,255,${rnd() * 0.25})`;
      g.fillRect(rnd() * px, rnd() * px, 2 + rnd() * 9, 2 + rnd() * 9);
    }
    // tel kafes ~12 mm
    g.strokeStyle = 'rgba(120,126,128,0.55)'; g.lineWidth = px / 340;
    const n = 26, s = px / n;
    for (let i = 0; i <= n; i++) {
      g.beginPath(); g.moveTo(i * s, 0); g.lineTo(i * s, px); g.stroke();
      g.beginPath(); g.moveTo(0, i * s); g.lineTo(px, i * s); g.stroke();
    }
    return c;
  });
}

/* ---------------------------------------------------------------- KUMAS */
export function fabricTexture(hex = '#33343a', px = 256) {
  return memo('fab' + hex + px, () => {
    const { c, g } = makeCanvas(px, px);
    seed(303);
    g.fillStyle = hex; g.fillRect(0, 0, px, px);
    for (let y = 0; y < px; y += 3) {
      for (let x = 0; x < px; x += 3) {
        const a = rnd() * 0.22;
        g.fillStyle = ((x + y) / 3) % 2 ? `rgba(255,255,255,${a})` : `rgba(0,0,0,${a})`;
        g.fillRect(x, y, 3, 3);
      }
    }
    return c;
  });
}

/* ----------------------------------------------------------------- DERI */
export function leatherTexture(hex = '#26262a', px = 512) {
  return memo('lth' + hex + px, () => {
    const { c, g } = makeCanvas(px, px);
    seed(808);
    g.fillStyle = hex; g.fillRect(0, 0, px, px);
    for (let i = 0; i < 2600; i++) {
      const x = rnd() * px, y = rnd() * px, r = 3 + rnd() * 9;
      g.strokeStyle = `rgba(255,255,255,${0.02 + rnd() * 0.05})`;
      g.lineWidth = 1;
      g.beginPath();
      g.moveTo(x, y);
      for (let k = 0; k < 4; k++) g.lineTo(x + (rnd() - 0.5) * r * 2, y + (rnd() - 0.5) * r * 2);
      g.stroke();
    }
    return c;
  });
}

/* ------------------------------------------------------- SANAT / TABLOLAR */
/** Fotolardaki manzara tablosu - kir evi, servi agaclari, kirmizi cicekli tarla */
export function landscapeArt(px = 512) {
  return memo('art-land' + px, () => {
    const { c, g } = makeCanvas(px, px);
    seed(1904);
    // gokyuzu
    let gr = g.createLinearGradient(0, 0, 0, px * 0.42);
    gr.addColorStop(0, '#b9d3e6'); gr.addColorStop(1, '#e6ecec');
    g.fillStyle = gr; g.fillRect(0, 0, px, px * 0.45);
    // uzak daglar
    g.fillStyle = '#8fa0a8';
    g.beginPath(); g.moveTo(0, px * 0.42);
    for (let x = 0; x <= px; x += 24) g.lineTo(x, px * (0.36 + Math.sin(x / 90) * 0.035));
    g.lineTo(px, px * 0.48); g.lineTo(0, px * 0.48); g.fill();
    // yesil bant
    g.fillStyle = '#6d8a4a'; g.fillRect(0, px * 0.44, px, px * 0.14);
    // kir evi
    g.fillStyle = '#f0ece0'; g.fillRect(px * 0.56, px * 0.40, px * 0.20, px * 0.12);
    g.fillStyle = '#a4543a';
    g.beginPath(); g.moveTo(px * 0.54, px * 0.40); g.lineTo(px * 0.66, px * 0.33); g.lineTo(px * 0.78, px * 0.40); g.fill();
    // servi agaclari
    for (const [cx, hh] of [[0.20, 0.22], [0.27, 0.17], [0.83, 0.19], [0.90, 0.14]]) {
      g.fillStyle = '#2f4a24';
      g.beginPath();
      g.ellipse(px * cx, px * (0.50 - hh / 2), px * 0.026, px * hh / 2, 0, 0, 6.284); g.fill();
    }
    // cicekli tarla
    gr = g.createLinearGradient(0, px * 0.56, 0, px);
    gr.addColorStop(0, '#7d8f45'); gr.addColorStop(1, '#5c6b33');
    g.fillStyle = gr; g.fillRect(0, px * 0.56, px, px * 0.44);
    for (let i = 0; i < 5200; i++) {
      const y = px * 0.56 + rnd() * px * 0.44;
      const t = (y - px * 0.56) / (px * 0.44);
      g.fillStyle = rnd() < 0.4 ? `rgba(198,52,44,${0.5 + rnd() * 0.5})` : `rgba(120,140,60,${0.3 + rnd() * 0.5})`;
      const s = 1.4 + t * 4;
      g.fillRect(rnd() * px, y, s, s);
    }
    // yol
    g.fillStyle = 'rgba(206,190,158,0.85)';
    g.beginPath(); g.moveTo(px * 0.62, px * 0.56); g.lineTo(px * 0.74, px * 0.56);
    g.lineTo(px * 1.02, px); g.lineTo(px * 0.52, px); g.fill();
    return c;
  });
}

/** Cerceveli belge/berat + Turk bayragi (foto 01 sag ust kose) */
export function certificateArt(px = 512) {
  return memo('art-cert' + px, () => {
    const { c, g } = makeCanvas(px, Math.round(px * 1.28));
    const H = Math.round(px * 1.28);
    seed(1923);
    g.fillStyle = '#f4f1e8'; g.fillRect(0, 0, px, H);
    // bayrak
    const fw = px * 0.42, fh = fw * 0.62, fx = px * 0.29, fy = H * 0.05;
    g.fillStyle = '#e30a17'; g.fillRect(fx, fy, fw, fh);
    g.fillStyle = '#fff';
    g.beginPath(); g.arc(fx + fw * 0.40, fy + fh * 0.5, fh * 0.24, 0, 6.284); g.fill();
    g.fillStyle = '#e30a17';
    g.beginPath(); g.arc(fx + fw * 0.455, fy + fh * 0.5, fh * 0.19, 0, 6.284); g.fill();
    g.fillStyle = '#fff';
    g.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      const r = i % 2 ? fh * 0.055 : fh * 0.13;
      const x = fx + fw * 0.60 + Math.cos(a) * r, y = fy + fh * 0.5 + Math.sin(a) * r;
      i === 0 ? g.moveTo(x, y) : g.lineTo(x, y);
    }
    g.closePath(); g.fill();
    // metin bloklari
    g.fillStyle = '#3a3a3a';
    let y = fy + fh + H * 0.06;
    g.fillRect(px * 0.18, y, px * 0.64, H * 0.012); y += H * 0.045;
    for (let i = 0; i < 22; i++) {
      const w = px * (0.62 + (i % 5) * 0.045);
      g.fillStyle = `rgba(70,70,70,${0.55 + (i % 3) * 0.1})`;
      g.fillRect(px * 0.11, y, Math.min(w, px * 0.78), H * 0.0075);
      y += H * 0.0245;
    }
    return c;
  });
}

/** Koridor posteri (kapi aciklarindan gorunen) */
export function corridorPoster(px = 384) {
  return memo('poster' + px, () => {
    const { c, g } = makeCanvas(px, Math.round(px * 1.35));
    const H = Math.round(px * 1.35);
    seed(66);
    g.fillStyle = '#f2f0e9'; g.fillRect(0, 0, px, H);
    g.fillStyle = '#2c6ea8'; g.fillRect(0, 0, px, H * 0.10);
    for (let r = 0; r < 5; r++) for (let k = 0; k < 4; k++) {
      const x = px * (0.045 + k * 0.238), y = H * (0.14 + r * 0.168);
      g.fillStyle = `hsl(${rnd() * 360},45%,${55 + rnd() * 20}%)`;
      g.fillRect(x, y, px * 0.21, H * 0.115);
      g.fillStyle = 'rgba(40,40,40,0.7)';
      g.fillRect(x, y + H * 0.122, px * 0.16, H * 0.012);
    }
    return c;
  });
}

/* ------------------------------------------------------- KARSI BINA CEPHESI */
/** Foto 05'te pencereden gorunen bina: tasli/seritli cephe, koyu pencereler */
export function facadeTexture(px = 1024) {
  return memo('facade' + px, () => {
    const { c, g } = makeCanvas(px, px);
    seed(3311);
    g.fillStyle = '#b9b3a8'; g.fillRect(0, 0, px, px);
    // yatay kat seritleri
    const floors = 7, fh = px / floors;
    for (let f = 0; f < floors; f++) {
      const y = f * fh;
      // parapet bandi (tas kaplama)
      g.fillStyle = f % 2 ? '#c3bdb1' : '#aca69b';
      g.fillRect(0, y, px, fh * 0.34);
      for (let i = 0; i < 220; i++) {
        g.fillStyle = `rgba(${120 + rnd() * 70 | 0},${115 + rnd() * 65 | 0},${105 + rnd() * 60 | 0},${0.25 + rnd() * 0.4})`;
        g.fillRect(rnd() * px, y + rnd() * fh * 0.34, 3 + rnd() * 22, 2 + rnd() * 7);
      }
      // pencere seridi
      const wy = y + fh * 0.36, wh = fh * 0.5;
      const cols = 9, cw = px / cols;
      for (let i = 0; i < cols; i++) {
        const wx = i * cw + cw * 0.10, ww = cw * 0.80;
        g.fillStyle = '#6d7a80';
        g.fillRect(wx, wy, ww, wh);
        // cam yansimasi
        const gr = g.createLinearGradient(wx, wy, wx + ww, wy + wh);
        gr.addColorStop(0, 'rgba(226,236,240,.85)');
        gr.addColorStop(0.45, 'rgba(150,168,178,.65)');
        gr.addColorStop(1, 'rgba(96,110,118,.85)');
        g.fillStyle = gr;
        g.fillRect(wx + 1.5, wy + 1.5, ww - 3, wh - 3);
        // dogramada dusey kayit
        g.fillStyle = 'rgba(60,66,70,.85)';
        g.fillRect(wx + ww / 2 - 1, wy, 2, wh);
        // bazi pencerelerde perde / jaluzi
        if (rnd() < 0.45) {
          g.fillStyle = `rgba(232,228,214,${0.5 + rnd() * 0.4})`;
          g.fillRect(wx + 2, wy + 2, ww - 4, wh * (0.25 + rnd() * 0.5));
        }
      }
      // kat arasi golge
      g.fillStyle = 'rgba(70,66,60,.16)';
      g.fillRect(0, y + fh * 0.86, px, fh * 0.14);
    }
    // kirmizi tabela lekesi (foto 05te gorunen)
    g.fillStyle = 'rgba(190,42,38,.9)';
    g.fillRect(px * 0.40, px * 0.34, px * 0.05, px * 0.10);
    // genel hava perspektifi
    const hz = g.createLinearGradient(0, 0, 0, px);
    hz.addColorStop(0, 'rgba(200,214,226,.30)');
    hz.addColorStop(1, 'rgba(200,214,226,.05)');
    g.fillStyle = hz; g.fillRect(0, 0, px, px);
    return c;
  });
}

export { finish };

/* ============================================================ DUVAR KAGIDI */
/**
 * TROPIK DUVAR KAGIDI (mural).
 *
 * Tek bir HTML dosyasi olarak dagitildigi icin hicbir dis gorsel kullanilamaz;
 * desen burada <canvas> uzerine cizilir. Bir duvar kagidi TEKRAR ETMEZ, duvar
 * boyunca tek parca akar - bu yuzden doku tum dolap yuzeyini (270 x 213 cm)
 * kaplar ve her kapak kendi dilimini gosterir (bkz. materials.js -> mat.mural).
 *
 * Cizim AYNALI yapilir: dokunun u ekseni oda planinda +Y yonunde ilerliyor,
 * yani duvara bakan kisi icin sag-sol ters donuyordu.
 */
const MP = {
  bg:    '#efe3c9',
  teal:  ['#89b6a8', '#6ea495', '#528c7e', '#3f7668'],
  deep:  ['#3f7d4f', '#2c6a41', '#1f5836'],
  olive: ['#93924a', '#7b793c', '#a9a45c', '#666735'],
  rose:  ['#dda3a1', '#c98a8b', '#b56f76', '#a15b65'],
  burg:  '#8d4b53',
  coral: '#e8655d',
  ochre: ['#ddbc61', '#c9a74d', '#e6cd85'],
  paper: '#fdfcf8',
  ink:   '#39393a',
  red:   '#cc2b2b',
  beak:  '#e0913c',
};

/** Muz yapragi: sivri uclu, orta damarli, kenari dilimli */
function muzYapragi(g, { x, y, len, wid, ang, bend = 0.25, fill, vein, dilim = true, sap = 0, sapRenk }) {
  g.save();
  g.translate(x, y);
  g.rotate(ang);
  if (sap > 0) {
    // Referanstaki gibi: yaprak ayasi uzun ince bir sapin ucunde durur
    g.strokeStyle = sapRenk || vein;
    g.lineCap = 'round';
    g.lineWidth = Math.max(1.5, wid * 0.13);
    g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(sap * 0.5, bend * wid * 0.35, sap, bend * wid * 0.8); g.stroke();
    g.translate(sap, bend * wid * 0.8);
  }
  const N = 44;
  const half = (t) => wid * Math.sin(Math.PI * Math.pow(t, 0.72));
  const off = (t) => bend * wid * t * t * 2.2;      // uca dogru kivrilma
  const pts = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    let h = half(t);
    if (dilim && i > 3 && i < N - 3 && i % 5 === 0) h *= 0.74;   // yirtik kenar
    pts.push([len * t, off(t) - h]);
  }
  for (let i = N; i >= 0; i--) {
    const t = i / N;
    let h = half(t);
    if (dilim && i > 3 && i < N - 3 && (i + 2) % 5 === 0) h *= 0.74;
    pts.push([len * t, off(t) + h]);
  }
  g.beginPath();
  g.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]);
  g.closePath();
  g.fillStyle = fill; g.fill();

  // orta damar
  g.strokeStyle = vein; g.lineCap = 'round';
  g.lineWidth = Math.max(1.2, wid * 0.055);
  g.beginPath();
  g.moveTo(0, 0);
  for (let i = 1; i <= 16; i++) { const t = i / 16; g.lineTo(len * t, off(t)); }
  g.stroke();

  // yan damarlar
  g.lineWidth = Math.max(0.7, wid * 0.02);
  g.globalAlpha = 0.45;
  for (let i = 2; i <= 17; i++) {
    const t = i / 19, bx = len * t, by = off(t), h = half(t) * 0.60;
    for (const s of [-1, 1]) {
      g.beginPath();
      g.moveTo(bx, by);
      g.quadraticCurveTo(bx + len * 0.05, by + s * h * 0.5, bx + len * 0.085, by + s * h);
      g.stroke();
    }
  }
  g.globalAlpha = 1;
  g.restore();
}

/** Sivri uclu palmiye/dracaena tepesi */
function tepeDemeti(g, { x, y, r, n, fill, vein, spread = Math.PI * 1.25 }) {
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const a = -Math.PI / 2 - spread / 2 + spread * t;
    const L = r * (0.62 + 0.38 * Math.sin(Math.PI * t));
    muzYapragi(g, {
      x, y, len: L, wid: L * 0.17, ang: a,
      bend: 0.35, fill: i % 2 ? fill[1] : fill[0], vein, dilim: false,
    });
  }
}

/** Heliconia: kirmizi/mercan zikzak brakteler */
function heliconia(g, { x, y, h, w, fill }) {
  g.save(); g.translate(x, y);
  g.strokeStyle = MP.olive[3]; g.lineWidth = w * 0.16; g.lineCap = 'round';
  g.beginPath(); g.moveTo(0, 0); g.lineTo(0, -h * 0.55); g.stroke();
  const n = 6;
  for (let i = 0; i < n; i++) {
    const s = i % 2 ? 1 : -1;
    const yy = -h * 0.5 - (i * h * 0.09);
    const ww = w * (1 - i * 0.11);
    g.beginPath();
    g.moveTo(0, yy);
    g.quadraticCurveTo(s * ww * 0.9, yy - h * 0.02, s * ww, yy - h * 0.075);
    g.quadraticCurveTo(s * ww * 0.35, yy - h * 0.05, 0, yy - h * 0.055);
    g.closePath();
    g.fillStyle = fill; g.fill();
  }
  g.restore();
}

/** Ince bordo dal + kucuk yaprakciklar */
function inceDal(g, { x, y, h, fill }) {
  g.save(); g.translate(x, y);
  g.strokeStyle = fill; g.lineCap = 'round';
  g.lineWidth = h * 0.012;
  g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(h * 0.05, -h * 0.5, 0, -h); g.stroke();
  for (let i = 3; i <= 20; i++) {
    const t = i / 21, yy = -h * t, xx = Math.sin(Math.PI * t) * h * 0.05;
    const L = h * 0.055 * (1 - t * 0.55);
    for (const s of [-1, 1]) {
      g.beginPath();
      g.ellipse(xx + s * L * 0.9, yy, L, L * 0.42, s * -0.5, 0, Math.PI * 2);
      g.fillStyle = fill; g.fill();
    }
  }
  g.restore();
}

/** Ucan turna */
function turna(g, { x, y, s, ang = 0 }) {
  g.save(); g.translate(x, y); g.rotate(ang); g.scale(s, s);
  g.lineJoin = 'round';
  // kanatlar (once arka)
  const kanat = (yo, sc, tip) => {
    g.beginPath();
    g.moveTo(2, yo);
    g.quadraticCurveTo(-14 * sc, yo - 26 * sc, -30 * sc, yo - 30 * sc);
    g.quadraticCurveTo(-16 * sc, yo - 12 * sc, -6 * sc, yo + 2);
    g.closePath();
    g.fillStyle = MP.paper; g.fill();
    g.strokeStyle = MP.ink; g.lineWidth = 0.9; g.stroke();
    if (tip) {   // uc tuyler koyu
      g.beginPath();
      g.moveTo(-22 * sc, yo - 26 * sc);
      g.quadraticCurveTo(-27 * sc, yo - 30 * sc, -30 * sc, yo - 30 * sc);
      g.quadraticCurveTo(-26 * sc, yo - 24 * sc, -22 * sc, yo - 22 * sc);
      g.closePath();
      g.fillStyle = MP.ink; g.globalAlpha = 0.85; g.fill(); g.globalAlpha = 1;
    }
  };
  kanat(-1, 0.82, true);
  // govde
  g.beginPath(); g.ellipse(0, 0, 15, 5.2, -0.06, 0, Math.PI * 2);
  g.fillStyle = MP.paper; g.fill();
  g.strokeStyle = MP.ink; g.lineWidth = 0.9; g.stroke();
  // kuyruk tuyleri
  g.beginPath();
  g.moveTo(-13, -1); g.lineTo(-25, -4); g.lineTo(-24, 1); g.closePath();
  g.fillStyle = MP.ink; g.globalAlpha = 0.8; g.fill(); g.globalAlpha = 1;
  // boyun + kafa
  g.beginPath();
  g.moveTo(11, -1.5); g.quadraticCurveTo(24, -7, 33, -8.5);
  g.strokeStyle = MP.paper; g.lineWidth = 3.6; g.stroke();
  g.strokeStyle = MP.ink; g.lineWidth = 0.85;
  g.beginPath(); g.moveTo(11, -3.4); g.quadraticCurveTo(24, -9, 33, -10.2); g.stroke();
  g.beginPath(); g.moveTo(11, 0.3); g.quadraticCurveTo(24, -5, 33, -6.9); g.stroke();
  // gaga
  g.beginPath(); g.moveTo(33, -8.6); g.lineTo(43, -9.6);
  g.strokeStyle = MP.beak; g.lineWidth = 1.5; g.stroke();
  // kirmizi tepe
  g.beginPath(); g.arc(32, -11.4, 2.1, 0, Math.PI * 2);
  g.fillStyle = MP.red; g.fill();
  // bacaklar
  g.beginPath(); g.moveTo(-8, 3); g.lineTo(-27, 7);
  g.strokeStyle = MP.beak; g.lineWidth = 1.2; g.stroke();
  // on kanat
  kanat(-2.5, 1, true);
  g.restore();
}

/**
 * Duvar kagidi dokusu. Oran dolap yuzeyi ile ayni: 270 x 213 cm.
 * @param {number} px doku genisligi (piksel)
 */
export function muralTexture(px = 2048) {
  return memo('mural' + px, () => {
    const W = px, H = Math.round(px * 213 / 270);
    const { c, g } = makeCanvas(W, H);
    seed(20260901);
    const u = W / 2000;                      // olcek katsayisi

    /* --- zemin: sicak bej keten --- */
    g.fillStyle = MP.bg; g.fillRect(0, 0, W, H);
    g.save();
    g.globalAlpha = 0.05;
    for (let i = 0; i < 5200; i++) {
      const x = rnd() * W, y = rnd() * H;
      g.fillStyle = rnd() > 0.5 ? '#ffffff' : '#b9a880';
      g.fillRect(x, y, 2.2 * u, 1.1 * u);
    }
    g.restore();
    // hafif kose golgesi (kagidin dokusu)
    const vg = g.createRadialGradient(W * 0.5, H * 0.42, H * 0.15, W * 0.5, H * 0.5, W * 0.72);
    vg.addColorStop(0, 'rgba(255,255,255,0.06)');
    vg.addColorStop(1, 'rgba(150,130,95,0.09)');
    g.fillStyle = vg; g.fillRect(0, 0, W, H);

    // Aynalama: doku u ekseni plan +Y yonunde; odadan bakan kisi icin duzelt
    g.translate(W, 0); g.scale(-1, 1);

    const B = H * 1.02;                      // yapraklarin ciktigi taban kotu
    const X = (f) => W * f;

    /* --- 1. katman: soluk cam gogu yapraklari (en arka) ---
       Yapraklar KUCUK ve COK: 90 cm'lik bir kapak dokunun ucte birini
       gosterdigi icin buyuk yapraklar asiri yakin duruyordu. */
    const arka = [
      [0.03, 0.60, -1.32], [0.09, 0.70, -1.72], [0.15, 0.52, -1.06],
      [0.21, 0.66, -1.55], [0.27, 0.56, -1.90], [0.33, 0.72, -1.24],
      [0.40, 0.58, -1.68], [0.47, 0.68, -1.10], [0.54, 0.54, -1.62],
      [0.60, 0.70, -1.86], [0.67, 0.60, -1.18], [0.74, 0.66, -1.74],
      [0.81, 0.52, -1.08], [0.87, 0.68, -1.58], [0.94, 0.62, -1.82],
      [0.99, 0.56, -1.30],
    ];
    for (const [fx, fl, a] of arka) {
      const L = H * fl;
      muzYapragi(g, {
        x: X(fx), y: B, len: L * 0.62, wid: L * 0.115, ang: a,
        bend: 0.22 + rnd() * 0.18, fill: MP.teal[1], vein: MP.teal[3],
        sap: L * 0.42, sapRenk: MP.teal[2],
      });
    }
    for (const [fx, fl, a] of arka) {
      const L = H * fl * 0.82;
      muzYapragi(g, {
        x: X(fx + 0.025), y: B, len: L * 0.60, wid: L * 0.105, ang: a + 0.38,
        bend: 0.3, fill: MP.teal[0], vein: MP.teal[2], sap: L * 0.40, sapRenk: MP.teal[2],
      });
    }

    /* --- 2. katman: ortada hardal/haki tepe demetleri --- */
    tepeDemeti(g, { x: X(0.30), y: B * 0.44, r: H * 0.26, n: 11, fill: [MP.olive[0], MP.olive[1]], vein: MP.olive[3] });
    tepeDemeti(g, { x: X(0.70), y: B * 0.50, r: H * 0.24, n: 11, fill: [MP.olive[1], MP.olive[0]], vein: MP.olive[3] });
    tepeDemeti(g, { x: X(0.50), y: B * 0.62, r: H * 0.22, n: 9, fill: [MP.olive[2], MP.olive[0]], vein: MP.olive[3] });
    for (const fx of [0.12, 0.27, 0.44, 0.58, 0.75, 0.90]) {
      tepeDemeti(g, { x: X(fx), y: B * 1.00, r: H * 0.15, n: 7, fill: [MP.ochre[0], MP.ochre[2]], vein: MP.olive[3], spread: Math.PI * 0.85 });
    }

    /* --- 3. katman: pembe/gul yapraklar --- */
    const pembe = [
      [0.05, 0.52, -1.18], [0.12, 0.60, -1.80], [0.19, 0.46, -1.28],
      [0.26, 0.56, -1.92], [0.34, 0.50, -1.10], [0.42, 0.58, -1.72],
      [0.56, 0.54, -1.22], [0.63, 0.48, -1.86], [0.70, 0.58, -1.30],
      [0.78, 0.50, -1.90], [0.86, 0.56, -1.14], [0.93, 0.48, -1.76],
      [0.98, 0.54, -1.44],
    ];
    for (const [fx, fl, a] of pembe) {
      const L = H * fl;
      muzYapragi(g, {
        x: X(fx), y: B, len: L * 0.60, wid: L * 0.135, ang: a,
        bend: 0.26, fill: MP.rose[0], vein: MP.rose[2], sap: L * 0.42, sapRenk: MP.rose[2],
      });
      muzYapragi(g, {
        x: X(fx + 0.012), y: B, len: L * 0.46, wid: L * 0.115, ang: a - 0.46,
        bend: 0.3, fill: MP.rose[1], vein: MP.rose[3], sap: L * 0.34, sapRenk: MP.rose[3],
      });
    }

    /* --- 4. katman: koyu yesil on yapraklar --- */
    const on = [
      [0.02, 0.38, -1.32], [0.10, 0.32, -1.94], [0.18, 0.36, -1.12],
      [0.27, 0.34, -1.96], [0.37, 0.32, -1.10], [0.46, 0.38, -1.88],
      [0.58, 0.34, -1.24], [0.67, 0.36, -1.92], [0.77, 0.32, -1.14],
      [0.88, 0.38, -1.84], [0.96, 0.34, -1.38],
    ];
    for (const [fx, fl, a] of on) {
      const L = H * fl;
      muzYapragi(g, {
        x: X(fx), y: B, len: L * 0.66, wid: L * 0.21, ang: a,
        bend: 0.2, fill: MP.deep[0], vein: MP.deep[2], dilim: false,
        sap: L * 0.34, sapRenk: MP.deep[1],
      });
    }

    /* --- aksanlar: mercan cicekler ve ince dallar --- */
    for (const fx of [0.06, 0.17, 0.30, 0.42, 0.54, 0.65, 0.78, 0.88, 0.96]) {
      heliconia(g, { x: X(fx), y: B, h: H * 0.34, w: H * 0.030, fill: MP.coral });
    }
    for (const fx of [0.13, 0.25, 0.37, 0.61, 0.72, 0.85, 0.94]) {
      inceDal(g, { x: X(fx), y: B, h: H * 0.40, fill: MP.burg });
    }

    /* --- turnalar --- */
    g.save();
    g.scale(u * 1.55, u * 1.55);
    const iw = W / (u * 1.15), ih = H / (u * 1.15);
    turna(g, { x: iw * 0.22, y: ih * 0.09, s: 0.80, ang: -0.10 });
    turna(g, { x: iw * 0.31, y: ih * 0.14, s: 0.70, ang: 0.05 });
    turna(g, { x: iw * 0.66, y: ih * 0.06, s: 0.78, ang: -0.06 });
    turna(g, { x: iw * 0.74, y: ih * 0.09, s: 0.66, ang: 0.02 });
    turna(g, { x: iw * 0.81, y: ih * 0.14, s: 0.56, ang: -0.03 });
    turna(g, { x: iw * 0.48, y: ih * 0.05, s: 0.60, ang: 0.04 });
    g.restore();

    return c;
  });
}
