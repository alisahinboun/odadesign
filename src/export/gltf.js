/**
 * IHRACAT: GLB (glTF binary) ve OBJ.
 * GLB, SketchUp / Blender / 3ds Max / Revit / Twinmotion tarafindan okunur.
 * Olcek: 1 birim = 1 metre (glTF standardi).
 */
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { OBJExporter } from 'three/examples/jsm/exporters/OBJExporter.js';

/**
 * Dosya kaydetme iki yoldan yurur:
 *   1. Yayinlanan sayfa (claude.ai artifact) icinde tarayici <a download>
 *      baglantisini calistirmaz; oradaki tek yol `downloads` yetenegidir.
 *      Kullaniciya bir onay kutusu cikar, reddedebilir.
 *   2. Yerelde (npm run dev / dist/index.html) klasik indirme baglantisi.
 * Yetenek yalnizca su uzantilari kabul eder:
 *   gif png jpg jpeg webp mp4 webm txt json md docx pptx epub csv ttf html svg pdf
 * GLB ve OBJ listede yok; orada `rejected_extension` doner (arayuz bunu
 * onceden bilip dugmeyi kapatir).
 */
let dlProbe = null;
export function downloadsNS() {
  if (dlProbe) return dlProbe;
  dlProbe = (async () => {
    for (let i = 0; i < 40; i++) {
      if (window.claude && typeof window.claude.use === 'function') break;
      await new Promise((r) => setTimeout(r, 50));
    }
    if (!(window.claude && typeof window.claude.use === 'function')) return null;
    try { return await window.claude.use('downloads'); } catch { return null; }
  })();
  return dlProbe;
}

async function download(blob, filename) {
  const ns = await downloadsNS();
  if (ns) { await ns.save({ filename, data: blob }); return filename; }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
  return filename;
}

export function exportGLB(object, filename = 'oda-model.glb') {
  return new Promise((resolve, reject) => {
    new GLTFExporter().parse(
      object,
      (buf) => { download(new Blob([buf], { type: 'model/gltf-binary' }), filename).then(resolve, reject); },
      (err) => reject(err),
      { binary: true, onlyVisible: false, truncateDrawRange: true, embedImages: true },
    );
  });
}

export function exportGLTF(object, filename = 'oda-model.gltf') {
  return new Promise((resolve, reject) => {
    new GLTFExporter().parse(
      object,
      (json) => { download(new Blob([JSON.stringify(json, null, 1)], { type: 'model/gltf+json' }), filename).then(resolve, reject); },
      (err) => reject(err),
      { binary: false, onlyVisible: false, embedImages: true },
    );
  });
}

export function exportOBJ(object, filename = 'oda-model.obj') {
  const text = new OBJExporter().parse(object);
  return download(new Blob([text], { type: 'text/plain' }), filename);
}

/** Yuksek cozunurluklu goruntu alma (sunum paftasi icin) */
export function exportPNG(renderer, scene, camera, filename = 'oda-render.png', scale = 2) {
  const el = renderer.domElement;
  const w = el.clientWidth, h = el.clientHeight;
  const prevPR = renderer.getPixelRatio();
  renderer.setPixelRatio(Math.min(scale * prevPR, 4));
  renderer.setSize(w, h, false);
  renderer.render(scene, camera);
  return new Promise((resolve, reject) => {
    el.toBlob((blob) => {
      // Once cozunurlugu geri al ki bir sonraki kare bozulmasin.
      renderer.setPixelRatio(prevPR);
      renderer.setSize(w, h, false);
      renderer.render(scene, camera);
      if (!blob) { reject(new Error('goruntu alinamadi')); return; }
      download(blob, filename).then(resolve, reject);
    }, 'image/png');
  });
}

export { download };
