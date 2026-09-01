/**
 * IHRACAT: GLB (glTF binary) ve OBJ.
 * GLB, SketchUp / Blender / 3ds Max / Revit / Twinmotion tarafindan okunur.
 * Olcek: 1 birim = 1 metre (glTF standardi).
 */
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { OBJExporter } from 'three/examples/jsm/exporters/OBJExporter.js';

function download(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export function exportGLB(object, filename = 'oda-model.glb') {
  return new Promise((resolve, reject) => {
    new GLTFExporter().parse(
      object,
      (buf) => { download(new Blob([buf], { type: 'model/gltf-binary' }), filename); resolve(filename); },
      (err) => reject(err),
      { binary: true, onlyVisible: false, truncateDrawRange: true, embedImages: true },
    );
  });
}

export function exportGLTF(object, filename = 'oda-model.gltf') {
  return new Promise((resolve, reject) => {
    new GLTFExporter().parse(
      object,
      (json) => { download(new Blob([JSON.stringify(json, null, 1)], { type: 'model/gltf+json' }), filename); resolve(filename); },
      (err) => reject(err),
      { binary: false, onlyVisible: false, embedImages: true },
    );
  });
}

export function exportOBJ(object, filename = 'oda-model.obj') {
  const text = new OBJExporter().parse(object);
  download(new Blob([text], { type: 'text/plain' }), filename);
  return filename;
}

/** Yuksek cozunurluklu goruntu alma (sunum paftasi icin) */
export function exportPNG(renderer, scene, camera, filename = 'oda-render.png', scale = 2) {
  const el = renderer.domElement;
  const w = el.clientWidth, h = el.clientHeight;
  const prevPR = renderer.getPixelRatio();
  renderer.setPixelRatio(Math.min(scale * prevPR, 4));
  renderer.setSize(w, h, false);
  renderer.render(scene, camera);
  el.toBlob((blob) => {
    download(blob, filename);
    renderer.setPixelRatio(prevPR);
    renderer.setSize(w, h, false);
    renderer.render(scene, camera);
  }, 'image/png');
  return filename;
}

export { download };
