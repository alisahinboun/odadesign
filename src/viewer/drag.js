/**
 * EŞYA TAŞIMA / DÜZENLEME
 *
 * Ic mimarin modeli sadece izlemesi degil, denemesi icin: bir mobilyayi fareyle
 * suruklemek, dondurmek ve sonucun gecerli olup olmadigini ANINDA gormek.
 *
 * Tasima sirasinda her karede denetim calisir (oda siniri, cakisma, kapi supurme
 * yayi, pencere onu, radyator onu). Sonuc secim cercevesinin rengine yansir:
 *   yesil = gecerli   ·   kirmizi = sorunlu
 *
 * Bir mobilya tasindiginda uzerindeki ekipman (monitor, yazici, kupa...) ayni
 * kadar kayar - masayi cekince monitor de gelir.
 */
import * as THREE from 'three';
import {
  room, furniture, equipment, clutter, windows, radiators, door, isVisible,
} from '../config/room.js';
import { footprint, overlap, doorSwingLimit } from '../lib/analysis.js';
import { cm } from '../lib/geom.js';

/** Ayni anda hareket eden ana eleman + uzerindekiler */
function dependents(id) {
  return [...equipment, ...clutter].filter((e) => e.onTop === id && isVisible(e));
}

/**
 * Yerlesimin gecerliligini olcer. Denetim scriptiyle ayni kurallar.
 * @returns {{ok:boolean, msgs:string[]}}
 */
export function validate(movedId) {
  const msgs = [];
  // Masa ustundeki bir esya tasindiysa: tek kural, tasiyicidan tasmasin
  const eq = [...equipment, ...clutter].find((e) => e.id === movedId);
  if (eq && eq.onTop) {
    const host = furniture.find((f) => f.id === eq.onTop);
    if (host) {
      const hr = footprint(host), er = footprint(eq);
      const o = overlap(hr, er);
      const area = (er.x1 - er.x0) * (er.y1 - er.y0);
      const on = Math.max(0, o.x) * Math.max(0, o.y);
      if (on < area * 0.92) msgs.push(`${host.id} üstünden taşıyor`);
    }
    return { ok: msgs.length === 0, msgs };
  }
  const vis = furniture.filter(isVisible);
  const rects = vis.map(footprint);
  const me = rects.find((r) => r.id === movedId);
  if (!me) return { ok: true, msgs };

  // 1) oda siniri
  if (me.x0 < -0.5 || me.x1 > room.width + 0.5 || me.y0 < -0.5 || me.y1 > room.depth + 0.5) {
    msgs.push('oda dışına taşıyor');
  }
  // 2) cakisma. Sandalyenin masaya cekilmesi ve kovanin masa altina girmesi normal.
  const SEATS = new Set(['stackChair', 'officeChair']);
  const TABLES = new Set(['desk', 'roundTable', 'credenza']);
  const tOf = (id) => (furniture.find((f) => f.id === id) || {}).type;
  const intended = (a, b) => {
    const ta = tOf(a), tb = tOf(b);
    if ((SEATS.has(ta) && TABLES.has(tb)) || (SEATS.has(tb) && TABLES.has(ta))) return true;
    return ta === 'bin' || tb === 'bin';
  };
  for (const r of rects) {
    if (r.id === movedId) continue;
    const o = overlap(me, r);
    if (o.x > 1 && o.y > 1 && !intended(me.id, r.id)) msgs.push(`${r.id} ile çakışıyor`);
  }
  // 3) kapi supurme yayi
  const sw = doorSwingLimit();
  if (sw.blocker === movedId && sw.angle < 85) msgs.push(`kapıyı ${sw.angle}°de durduruyor`);
  // 4) pencere onu
  const it = furniture.find((f) => f.id === movedId);
  for (const w of windows.filter((x) => x.wall === 'back')) {
    const nearWall = room.depth - me.y1 < 12;
    const across = me.x1 > w.u && me.x0 < w.u + w.width;
    if (nearWall && across && it.h > w.sill) msgs.push(`${w.id} penceresini kapatıyor`);
  }
  // 5) radyator onu
  for (const r of radiators.filter((x) => x.wall === 'back')) {
    if (me.x1 > r.u && me.x0 < r.u + r.width && me.y1 > room.depth - 40) {
      msgs.push(`${r.id} radyatörünün önünü kapatıyor`);
    }
  }
  return { ok: msgs.length === 0, msgs };
}

export function createDragController({ renderer, camera, getActiveCam, modelRootRef, onChange }) {
  const ray = new THREE.Raycaster();
  const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  const hitPt = new THREE.Vector3();

  const state = {
    enabled: false,
    item: null,          // suruklenen config kaydi
    groups: [],          // [{ item, group, startPos }]
    grabOffset: [0, 0],  // tiklama noktasi ile elemanin merkezi arasindaki fark
    dragging: false,
    moved: new Set(),    // degistirilen poz kimlikleri
    snap: 1,             // cm
    wallSnap: 6,         // duvara bu mesafede yapisir
  };

  /** id -> yerlestirme grubu (place() '<id>-yer' adiyla olusturur) */
  function groupOf(id) {
    let found = null;
    modelRootRef().traverse((o) => { if (!found && o.name === `${id}-yer`) found = o; });
    return found;
  }

  function screenToFloor(ev) {
    const r = renderer.domElement.getBoundingClientRect();
    const m = new THREE.Vector2(
      ((ev.clientX - r.left) / r.width) * 2 - 1,
      -((ev.clientY - r.top) / r.height) * 2 + 1,
    );
    ray.setFromCamera(m, getActiveCam());
    return ray.ray.intersectPlane(plane, hitPt) ? [hitPt.x / 0.01, hitPt.z / 0.01] : null;
  }

  /** Elemani (ve uzerindekileri) verilen plan merkezine tasir */
  function moveTo(item, nx, ny) {
    const dx = nx - item.pos[0], dy = ny - item.pos[1];
    if (!dx && !dy) return;
    for (const rec of state.groups) {
      rec.item.pos = [rec.item.pos[0] + dx, rec.item.pos[1] + dy];
      if (rec.group) {
        rec.group.position.x = cm(rec.item.pos[0]);
        rec.group.position.z = cm(rec.item.pos[1]);
      }
    }
    state.moved.add(item.id);
  }

  /** Secili elemani dondurur (adim derece) */
  function rotate(step) {
    const it = state.item;
    if (!it) return false;
    it.rot = (((it.rot || 0) + step) % 360 + 360) % 360;
    const g = groupOf(it.id);
    if (g) g.rotation.y = -it.rot * Math.PI / 180;
    // ustundekiler ana elemanin merkezi etrafinda doner
    const rad = step * Math.PI / 180;
    const [cx, cy] = it.pos;
    for (const rec of state.groups) {
      if (rec.item === it) continue;
      const dx = rec.item.pos[0] - cx, dy = rec.item.pos[1] - cy;
      const nx = cx + dx * Math.cos(-rad) - dy * Math.sin(-rad);
      const ny = cy + dx * Math.sin(-rad) + dy * Math.cos(-rad);
      rec.item.pos = [Math.round(nx * 10) / 10, Math.round(ny * 10) / 10];
      rec.item.rot = (((rec.item.rot || 0) + step) % 360 + 360) % 360;
      if (rec.group) {
        rec.group.position.x = cm(nx);
        rec.group.position.z = cm(ny);
        rec.group.rotation.y = -rec.item.rot * Math.PI / 180;
      }
    }
    state.moved.add(it.id);
    onChange?.(validate(it.id));
    return true;
  }

  function select(item) {
    state.item = item || null;
    state.groups = [];
    if (!item) return;
    state.groups.push({ item, group: groupOf(item.id) });
    for (const d of dependents(item.id)) state.groups.push({ item: d, group: groupOf(d.id) });
  }

  function begin(ev) {
    if (!state.enabled || !state.item) return false;
    const p = screenToFloor(ev);
    if (!p) return false;
    state.grabOffset = [p[0] - state.item.pos[0], p[1] - state.item.pos[1]];
    state.dragging = true;
    return true;
  }

  function move(ev) {
    if (!state.dragging || !state.item) return false;
    const p = screenToFloor(ev);
    if (!p) return false;
    const it = state.item;
    let nx = p[0] - state.grabOffset[0];
    let ny = p[1] - state.grabOffset[1];

    // 1 cm adim
    nx = Math.round(nx / state.snap) * state.snap;
    ny = Math.round(ny / state.snap) * state.snap;

    const r = footprint({ ...it, pos: [nx, ny] });
    const hw = (r.x1 - r.x0) / 2, hd = (r.y1 - r.y0) / 2;

    const host = it.onTop ? furniture.find((f) => f.id === it.onTop) : null;
    if (host) {
      // Masa ustundeki esya masanin disina cikamaz
      const hr = footprint(host);
      nx = Math.max(hr.x0 + hw, Math.min(hr.x1 - hw, nx));
      ny = Math.max(hr.y0 + hd, Math.min(hr.y1 - hd, ny));
    } else {
      // oda icinde tut + duvara yapistir
      nx = Math.max(hw, Math.min(room.width - hw, nx));
      ny = Math.max(hd, Math.min(room.depth - hd, ny));
      if (nx - hw < state.wallSnap) nx = hw;
      if (room.width - (nx + hw) < state.wallSnap) nx = room.width - hw;
      if (ny - hd < state.wallSnap) ny = hd;
      if (room.depth - (ny + hd) < state.wallSnap) ny = room.depth - hd;
    }

    moveTo(it, nx, ny);
    onChange?.(validate(it.id));
    return true;
  }

  function end() {
    if (!state.dragging) return false;
    state.dragging = false;
    return true;
  }

  /** Degistirilen elemanlarin config satirlarini uretir (kopyala-yapistir) */
  function snippet() {
    if (!state.moved.size) return '';
    const lines = [];
    const all = [...furniture, ...equipment, ...clutter];
    for (const id of [...state.moved].sort()) {
      const it = all.find((f) => f.id === id);
      if (!it) continue;
      lines.push(`  ${id}: { pos: [${Math.round(it.pos[0])}, ${Math.round(it.pos[1])}], rot: ${Math.round(it.rot || 0)} },`);
      for (const d of dependents(id)) {
        lines.push(`  ${d.id}: { pos: [${Math.round(d.pos[0])}, ${Math.round(d.pos[1])}], rot: ${Math.round(d.rot || 0)} },`);
      }
    }
    return lines.join('\n');
  }

  return {
    state,
    setEnabled(v) { state.enabled = v; if (!v) { state.dragging = false; } },
    select, begin, move, end, rotate, snippet, validate,
    clearMoved() { state.moved.clear(); },
    get movedCount() { return state.moved.size; },
  };
}
