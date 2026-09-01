/**
 * ISLEME HATTI (render pipeline)
 * Varsayilan olarak GTAO (ground-truth ambient occlusion) devrede: kose ve
 * birlesim yerlerindeki yumusak golgeler mekani "plastik" gorunmekten cikarir
 * ve ic mimari sunumlarda derinlik hissini verir.
 *
 * Zayif ekran kartlarinda arayuzden kapatilabilir; kapaliyken dogrudan
 * renderer.render() kullanilir (ek maliyet yok).
 */
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { GTAOPass } from 'three/examples/jsm/postprocessing/GTAOPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader.js';

export function createPipeline(renderer, scene, camera) {
  const size = new THREE.Vector2();
  renderer.getSize(size);

  const composer = new EffectComposer(renderer);
  composer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  composer.setSize(size.x, size.y);

  const renderPass = new RenderPass(scene, camera);
  composer.addPass(renderPass);

  const gtao = new GTAOPass(scene, camera, size.x, size.y);
  gtao.output = GTAOPass.OUTPUT.Default;
  // Kucuk bir mekan (3.7 x 2.7 m): yaricap kucuk tutulur, aksi halde
  // golgeler mobilyanin altindan tasar.
  gtao.updateGtaoMaterial({
    radius: 0.30,
    distanceExponent: 1.0,
    thickness: 0.25,
    scale: 1.0,
    samples: 16,
    distanceFallOff: 1.0,
    screenSpaceRadius: false,
  });
  gtao.updatePdMaterial({ lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 4, radiusExponent: 1, rings: 2, samples: 16 });
  gtao.blendIntensity = 0.85;
  composer.addPass(gtao);

  const fxaa = new ShaderPass(FXAAShader);
  const setFxaa = (w, h) => fxaa.material.uniforms.resolution.value.set(1 / w, 1 / h);
  setFxaa(size.x * composer.getPixelRatio(), size.y * composer.getPixelRatio());
  composer.addPass(fxaa);

  composer.addPass(new OutputPass());

  return {
    composer, gtao, renderPass,
    setSize(w, h) {
      composer.setSize(w, h);
      gtao.setSize(w, h);
      setFxaa(w * composer.getPixelRatio(), h * composer.getPixelRatio());
    },
    setCamera(cam) { renderPass.camera = cam; gtao.camera = cam; },
    setIntensity(v) { gtao.blendIntensity = v; },
  };
}
