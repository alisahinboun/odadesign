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

export { finish };
