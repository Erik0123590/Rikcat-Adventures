// admin.js
import { ref, push, set, onValue } from "./firebase.js";

// change this to whatever admin password you want
const ADMIN_PASSWORD = "rikcatADM"; // <- altere se quiser

export const effects = []; // local cache of effects

let _isAdminLocal = false;
let _effectsRef = null;

export function initAdmin(room, playerId) {
  // set up ref to effects
  _effectsRef = ref(window.__firebase_db || (console.warn && undefined)); // fallback (we will set it properly in game)
  // Note: game.js will call initAdmin again with proper effectsRef if needed.
}

// utility to wire effectsRef from game
export function wireEffectsRef(effectsRef) {
  _effectsRef = effectsRef;
  if (!_effectsRef) return;
  onValue(_effectsRef, snap => {
    const data = snap.val() || {};
    // normalize to array
    const arr = Object.values(data || {}).map(e => e).filter(Boolean);
    // replace contents
    effects.length = 0;
    arr.forEach(it => effects.push(it));
  });
}

export function isAdmin() {
  return !!_isAdminLocal;
}

export function tryPassword(pass) {
  if (pass === ADMIN_PASSWORD) {
    _isAdminLocal = true;
    return true;
  }
  return false;
}

export function enablePdfLocal() {
  // locally enable the PDF power (for showing fire button)
  _isAdminLocal = true;
}

// spawn effect locally and in DB (if effectsRef provided)
export function spawnEffect(x, y, dir = 1, len = 500, duration = 700) {
  const ef = { x, y, dir, len, duration, createdAt: Date.now() };
  effects.push(ef);
  if (_effectsRef) {
    // push to DB:
    push(_effectsRef, ef).catch(()=>{});
  }
  // also remove locally after duration + small buffer
  setTimeout(() => {
    const i = effects.indexOf(ef);
    if (i !== -1) effects.splice(i, 1);
  }, duration + 400);
}
