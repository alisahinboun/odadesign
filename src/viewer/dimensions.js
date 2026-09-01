/**
 * OLCU KOTALARI (3B)
 * Plan ve gorunus kotalari; iç mimarin modeli olcu kontrolu icin kullanabilmesi
 * amaciyla gercek geometriden turetilir.
 */
import * as THREE from 'three';
import { room, partition, door, furniture } from '../config/room.js';
import { partitionLayout } from '../model/shell.js';
import { cm, group } from '../lib/geom.js';

const LINE = 0x1b3a5c, TEXT = '#12314e';

function label(text, sizeCm = 16) {
  const pad = 8, fs = 44;
  const c = document.createElement('canvas');
  const g = c.getContext('2d');
  g.font = `600 ${fs}px ui-sans-serif, system-ui, sans-serif`;
  const w = Math.ceil(g.measureText(text).width) + pad * 2;
  c.width = w; c.height = fs + pad * 2;
  const g2 = c.getContext('2d');
  g2.font = `600 ${fs}px ui-sans-serif, system-ui, sans-serif`;
  g2.fillStyle = 'rgba(255,255,255,0.92)';
  g2.strokeStyle = 'rgba(27,58,92,0.55)';
  g2.lineWidth = 3;
  const r = 10;
  g2.beginPath();
  g2.moveTo(r, 0); g2.lineTo(c.width - r, 0);
  g2.quadraticCurveTo(c.width, 0, c.width, r); g2.lineTo(c.width, c.height - r);
  g2.quadraticCurveTo(c.width, c.height, c.width - r, c.height); g2.lineTo(r, c.height);
  g2.quadraticCurveTo(0, c.height, 0, c.height - r); g2.lineTo(0, r);
  g2.quadraticCurveTo(0, 0, r, 0);
  g2.fill(); g2.stroke();
  g2.fillStyle = TEXT;
  g2.textBaseline = 'middle';
  g2.fillText(text, pad, c.height / 2 + 2);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false, depthWrite: false }));
  const s = cm(sizeCm);
  sp.scale.set(s * (c.width / c.height), s, 1);
  sp.renderOrder = 999;
  return sp;
}

function seg(a, b, mat) {
  const g = new THREE.BufferGeometry().setFromPoints([a, b]);
  const l = new THREE.Line(g, mat);
  l.renderOrder = 998;
  return l;
}

function tick(p, dir, mat, len = 6) {
  const d = dir.clone().normalize().multiplyScalar(cm(len) / 2);
  return seg(p.clone().sub(d), p.clone().add(d), mat);
}

/**
 * Iki nokta arasi kota (3B). p1/p2 THREE.Vector3 (metre).
 * off: kota cizgisinin kaydirma yonu ve mesafesi (metre).
 */
function dimension(p1, p2, offDir, offLen, mat, text, labelSize = 15) {
  const g = new THREE.Group();
  const o = offDir.clone().normalize().multiplyScalar(offLen);
  const a = p1.clone().add(o), b = p2.clone().add(o);
  g.add(seg(a, b, mat));
  g.add(seg(p1, a, mat), seg(p2, b, mat));
  const axis = b.clone().sub(a).normalize();
  const perp = new THREE.Vector3().crossVectors(axis, offDir.clone().normalize()).normalize();
  if (perp.lengthSq() < 0.001) perp.set(0, 1, 0);
  g.add(tick(a, axis.clone().add(perp).normalize(), mat, 7));
  g.add(tick(b, axis.clone().add(perp).normalize(), mat, 7));
  const mid = a.clone().add(b).multiplyScalar(0.5).add(offDir.clone().normalize().multiplyScalar(cm(9)));
  const sp = label(text, labelSize);
  sp.position.copy(mid);
  g.add(sp);
  return g;
}

/** Plan kotalari - dosemenin biraz uzerinde, tepeden okunur */
export function buildPlanDimensions() {
  const g = group('Kota-Plan', { layer: 'dimPlan', label: 'Plan olculeri' });
  const mat = new THREE.LineBasicMaterial({ color: LINE, transparent: true, opacity: 0.95, depthTest: false });
  const z = cm(2);
  const W = room.width, D = room.depth;

  // Toplam genislik ve derinlik
  g.add(dimension(new THREE.Vector3(0, z, cm(D)), new THREE.Vector3(cm(W), z, cm(D)),
    new THREE.Vector3(0, 0, 1), cm(45), mat, `${W} cm`, 13));
  g.add(dimension(new THREE.Vector3(cm(W), z, 0), new THREE.Vector3(cm(W), z, cm(D)),
    new THREE.Vector3(1, 0, 0), cm(45), mat, `${D} cm`, 13));

  // Boluntu panel dizilimi (kapi dahil)
  let off = cm(-28);
  for (const s of partitionLayout()) {
    const t = s.kind === 'door' ? `KAPI ${s.width}` : `${s.width}`;
    g.add(dimension(new THREE.Vector3(cm(s.x0), z, 0), new THREE.Vector3(cm(s.x1), z, 0),
      new THREE.Vector3(0, 0, -1), Math.abs(off), mat, t, 9));
  }

  // Mobilya kotalari + poz etiketleri (pos = plan merkezi)
  for (const it of furniture) {
    const rad = -(it.rot || 0) * Math.PI / 180;
    const ux = new THREE.Vector3(Math.cos(rad), 0, Math.sin(rad));   // yerel +X
    const uy = new THREE.Vector3(-Math.sin(rad), 0, Math.cos(rad));  // yerel +Y
    const c = new THREE.Vector3(cm(it.pos[0]), cm(it.h + 3), cm(it.pos[1]));
    const corner = c.clone()
      .add(ux.clone().multiplyScalar(cm(-it.w / 2)))
      .add(uy.clone().multiplyScalar(cm(-it.d / 2)));
    const pW = corner.clone().add(ux.clone().multiplyScalar(cm(it.w)));
    const pD = corner.clone().add(uy.clone().multiplyScalar(cm(it.d)));
    g.add(dimension(corner, pW, uy.clone().negate(), cm(13), mat, `${it.w}`, 8));
    g.add(dimension(corner, pD, ux.clone().negate(), cm(13), mat, `${it.d}`, 8));
    const tg = label(`${it.id} ${it.tag}`, 9);
    tg.position.copy(c); tg.position.y = cm(it.h + 18);
    g.add(tg);
  }
  return g;
}

/** Gorunus kotalari - on boluntu duzleminde dusey olculer */
export function buildElevationDimensions() {
  const g = group('Kota-Gorunus', { layer: 'dimElev', label: 'Gorunus (dusey) olculeri' });
  const mat = new THREE.LineBasicMaterial({ color: LINE, transparent: true, opacity: 0.95, depthTest: false });
  const y = cm(-38);   // boluntunun on tarafinda (koridor tarafi)
  const xs = cm(room.width) + cm(30);

  const stack = [
    [0, door.height, `Kapi ${door.height}`],
    [partition.sillHeight, partition.transomTop, `Vasistas ${partition.transomTop - partition.sillHeight}`],
    [partition.transomTop, room.height, `Bant ${room.height - partition.transomTop}`],
  ];
  let k = 0;
  for (const [z0, z1, t] of stack) {
    g.add(dimension(new THREE.Vector3(xs, cm(z0), y), new THREE.Vector3(xs, cm(z1), y),
      new THREE.Vector3(1, 0, 0), cm(18 + k * 26), mat, t, 14));
    k++;
  }
  // net kat yuksekligi
  g.add(dimension(new THREE.Vector3(xs, 0, y), new THREE.Vector3(xs, cm(room.height), y),
    new THREE.Vector3(1, 0, 0), cm(18 + k * 26), mat, `Net yuk. ${room.height}`, 18));

  // sol duvarda yukseklik kotasi
  g.add(dimension(new THREE.Vector3(cm(-6), 0, cm(room.depth * 0.75)),
    new THREE.Vector3(cm(-6), cm(room.height), cm(room.depth * 0.75)),
    new THREE.Vector3(-1, 0, 0), cm(24), mat, `${room.height} cm`, 18));
  return g;
}

export { label };
