// admin.js
import { db, ref, push, onValue } from "./firebase.js";

export const effects = []; // efeitos locais (shared)
let _room = null;
let _playerId = null;
let _effectsRef = null;

let _isAdmin = false;
let _pdfEnabled = false;

const ADMIN_PASSWORD = "RikcatADM!2025"; // altere se quiser

export function isAdmin() { return _isAdmin; }
export function pdfEnabled() { return _pdfEnabled; }

/** Inicializa a UI de admin e o listener de efeitos (chame initAdmin(room, playerId) no game.js) */
export function initAdmin(room, playerId) {
  _room = room;
  _playerId = playerId;
  _effectsRef = ref(db, `rooms/${_room}/effects`);

  setupUI();
  // listen DB effects
  onValue(_effectsRef, snap => {
    const data = snap.val() || {};
    // adiciona novos effects do DB ao array local (sem duplicar)
    for (const k in data) {
      const e = data[k];
      if (!e || !e.id) continue;
      if (!effects.find(x => x.id === e.id)) {
        effects.push(e);
      }
    }
    // note: TTL removals serão feitas pelo cliente renderizador (game.js)
  });
}

function setupUI() {
  const adminBtn = document.getElementById("adminBtn");
  const adminScreen = document.getElementById("adminScreen");
  const adminPass = document.getElementById("adminPass");
  const adminSubmit = document.getElementById("adminSubmit");
  const adminCancel = document.getElementById("adminCancel");
  const fireBtn = document.getElementById("fireBtn");

  if (adminBtn) adminBtn.addEventListener("click", () => {
    if (adminScreen) adminScreen.style.display = "flex";
    if (adminPass) adminPass.value = "";
  });

  if (adminCancel) adminCancel.addEventListener("click", () => {
    if (adminScreen) adminScreen.style.display = "none";
  });

  if (adminSubmit) adminSubmit.addEventListener("click", () => {
    const v = adminPass?.value || "";
    if (v === ADMIN_PASSWORD) {
      _isAdmin = true;
      if (adminScreen) adminScreen.style.display = "none";
      alert("Comandos de ADM ligados");
    } else {
      alert("Senha incorreta");
    }
  });
}

/** ativa o /PDF (mostra o botão de fogo) — chamado pelo game.js quando admin digita /PDF */
export function enablePdfLocal() {
  _pdfEnabled = true;
  const fireBtn = document.getElementById("fireBtn");
  if (fireBtn) fireBtn.style.display = _isAdmin ? "block" : "none";
}

/** Gera um efeito local e envia ao Firebase (para que outros clientes vejam) */
export function spawnEffect(x, y, dir, len = 700, duration = 700) {
  const id = "e_" + Math.floor(Math.random()*9999999) + "_" + Date.now();
  const ef = { id, x, y, dir, len, duration, createdAt: Date.now(), owner: _playerId || "local" };
  effects.push(ef);
  // push to firebase (best-effort)
  if (_effectsRef) {
    try {
      push(_effectsRef, ef);
    } catch (err) {
      console.warn("spawnEffect: push failed", err);
    }
  }
  return ef;
}
