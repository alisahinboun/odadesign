/**
 * Geometri yardimcilari.
 * TUM girdiler CM cinsindendir; uretilen mesh'ler METRE olceginde olur
 * (glTF standardi 1 birim = 1 m). cm() donusturucusunu kullanin.
 */
import * as THREE from 'three';

export const S = 0.01;                 // cm -> m
export const cm = (v) => v * S;

/** Merkezi degil, SOL-ON-ALT kosesi verilen kutu (plan koordinatlariyla calisir) */
export function box(w, d, h, mats, { x = 0, y = 0, z = 0, name = '' } = {}) {
  const g = new THREE.BoxGeometry(cm(w), cm(h), cm(d));
  const m = new THREE.Mesh(g, mats);
  m.position.set(cm(x + w / 2), cm(z + h / 2), cm(y + d / 2));
  m.castShadow = true; m.receiveShadow = true;
  if (name) m.name = name;
  return m;
}

/** Merkez konumu verilen kutu */
export function boxAt(w, d, h, mats, { x = 0, y = 0, z = 0, name = '' } = {}) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(cm(w), cm(h), cm(d)), mats);
  m.position.set(cm(x), cm(z), cm(y));
  m.castShadow = true; m.receiveShadow = true;
  if (name) m.name = name;
  return m;
}

/** Kenarlari yuvarlatilmis kutu (mobilya kenar bandi hissi icin) */
export function roundedBox(w, d, h, r, mats, opts = {}) {
  const rr = Math.min(r, w / 2 - 0.01, d / 2 - 0.01, h / 2 - 0.01);
  const shape = new THREE.Shape();
  const W = cm(w), D = cm(d), R = cm(rr);
  shape.moveTo(-W / 2 + R, -D / 2);
  shape.lineTo(W / 2 - R, -D / 2);
  shape.quadraticCurveTo(W / 2, -D / 2, W / 2, -D / 2 + R);
  shape.lineTo(W / 2, D / 2 - R);
  shape.quadraticCurveTo(W / 2, D / 2, W / 2 - R, D / 2);
  shape.lineTo(-W / 2 + R, D / 2);
  shape.quadraticCurveTo(-W / 2, D / 2, -W / 2, D / 2 - R);
  shape.lineTo(-W / 2, -D / 2 + R);
  shape.quadraticCurveTo(-W / 2, -D / 2, -W / 2 + R, -D / 2);
  const g = new THREE.ExtrudeGeometry(shape, {
    depth: cm(h), bevelEnabled: true, bevelSize: R * 0.28, bevelThickness: R * 0.28, bevelSegments: 2, curveSegments: 4,
  });
  // Extrude +Z yonunde uretilir; rotateX(-90) bunu +Y (yukari) cevirir, yani
  // geometri zaten 0..cm(h) araligini kaplar - ek oteleme YAPILMAZ.
  g.rotateX(-Math.PI / 2);
  g.computeBoundingBox();
  const m = new THREE.Mesh(g, mats);
  const { x = 0, y = 0, z = 0, name = '' } = opts;
  m.position.set(cm(x + w / 2), cm(z), cm(y + d / 2));
  m.castShadow = true; m.receiveShadow = true;
  if (name) m.name = name;
  return m;
}

export function cyl(rTop, rBot, h, mats, { x = 0, y = 0, z = 0, seg = 24, name = '', rotX = 0, rotZ = 0 } = {}) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(cm(rTop), cm(rBot), cm(h), seg), mats);
  m.position.set(cm(x), cm(z), cm(y));
  m.rotation.x = rotX; m.rotation.z = rotZ;
  m.castShadow = true; m.receiveShadow = true;
  if (name) m.name = name;
  return m;
}

export function sphere(r, mats, { x = 0, y = 0, z = 0, name = '' } = {}) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(cm(r), 28, 20), mats);
  m.position.set(cm(x), cm(z), cm(y));
  m.castShadow = true; m.receiveShadow = true;
  if (name) m.name = name;
  return m;
}

/** Duz dortgen levha (tablo yuzeyi, poster vb.) - varsayilan olarak XZ duzleminde */
export function plane(w, h, mats, { x = 0, y = 0, z = 0, name = '', rotY = 0 } = {}) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(cm(w), cm(h)), mats);
  m.position.set(cm(x), cm(z), cm(y));
  m.rotation.y = rotY;
  m.receiveShadow = true;
  if (name) m.name = name;
  return m;
}

/**
 * Bir elemani plan MERKEZINDEN konumlandirir ve merkezi etrafinda dondurur.
 * config icindeki pos = [x, y] daima elemanin plan merkezidir; boylece bir
 * mobilyayi dondurdugunuzde yeri kaymaz (ic mimar icin en sezgisel davranis).
 */
export function place(inner, item) {
  const g = new THREE.Group();
  g.name = item.id ? item.id + '-yer' : 'yer';
  g.position.set(cm(item.pos[0]), cm(item.z || 0), cm(item.pos[1]));
  g.rotation.y = -(item.rot || 0) * Math.PI / 180;   // plan +rot = saat yonu tersi
  inner.position.set(cm(-item.w / 2), 0, cm(-item.d / 2));
  g.add(inner);
  g.userData = { ...inner.userData };
  return g;
}

/** Elemanin plan ayak izi sol-on kosesi (pos merkez oldugu icin basit cikarma) */
export function cornerOf(item) {
  return [item.pos[0] - item.w / 2, item.pos[1] - item.d / 2];
}

export function group(name, userData = {}) {
  const g = new THREE.Group();
  g.name = name;
  g.userData = userData;
  return g;
}
