// game.js — Minigames integrator
// Usa seus módulos em ./minigames/* e o firebase.js já existente.
// Coloque este arquivo na mesma pasta do index.html

import { db, ref, set, onValue, push, remove, onDisconnect } from "./firebase.js";

// IMPORT dos minigames (os módulos que te enviei)
import { createTimeTrial } from "./minigames/timeTrial.js";
import { createTag } from "./minigames/tag.js";
import { createCTF } from "./minigames/ctf.js";
import { createSurvival } from "./minigames/survival.js";

/* ===== UI ===== */
const openMinigames = document.getElementById("openMinigames");
const minigameMenu = document.getElementById("minigameMenu");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const logEl = document.getElementById("log");
const nickInputTop = document.getElementById("nickInputTop");
const roomCodeInput = document.getElementById("roomCodeInput");

const joinBtn = document.getElementById("joinBtn");
const startBtn = document.getElementById("startBtn");
const leaveBtn = document.getElementById("leaveBtn");
const backMenuBtn = document.getElementById("backMenuBtn");
const mgState = document.getElementById("mgState");

openMinigames.onclick = () => {
  minigameMenu.style.display = minigameMenu.style.display === "block" ? "none" : "block";
};

backMenuBtn.onclick = () => { minigameMenu.style.display = "none"; };

function log(...t){
  const row = document.createElement("div");
  row.textContent = `[${new Date().toLocaleTimeString()}] ${t.join(" ")}`;
  logEl.appendChild(row);
  logEl.scrollTop = logEl.scrollHeight;
}

/* ===== Canvas resize ===== */
function resize(){ canvas.width = innerWidth; canvas.height = Math.round(innerHeight * 0.6); }
window.addEventListener("resize", resize);
resize();

/* ===== player identity ===== */
const playerId = "p_" + Math.floor(Math.random()*999999);
let nick = localStorage.getItem("rk_nick") || (`Player${playerId.slice(-4)}`);
nickInputTop.value = nick;
nickInputTop.addEventListener("change", ()=> {
  nick = nickInputTop.value.trim() || nick;
  localStorage.setItem("rk_nick", nick);
});

/* ===== minigame state ===== */
let currentMG = null;   // 'timeTrial' | 'tag' | 'ctf' | 'survival'
let mgInstance = null;  // module instance returned by create*
let mgRoom = null;      // chosen room code

// map of buttons in menu (Entrar)
document.querySelectorAll('[data-mg]').forEach(btn=>{
  btn.onclick = (e) => {
    currentMG = btn.getAttribute('data-mg');
    log(`Selecionado minigame: ${currentMG}`);
    // show selected in UI
    mgState.innerHTML = `Selecionado <b>${currentMG}</b>. Insira room (ou deixe vazio) e clique Join.`;
  };
});

/* ===== join / start / leave handlers ===== */
joinBtn.onclick = async () => {
  if(!currentMG){ log("Escolha um minigame primeiro."); return; }

  mgRoom = roomCodeInput.value.trim() || (`${currentMG}_room`);
  const room = mgRoom;
  log(`Entrando em room: ${room} como ${nick} (${playerId})`);

  // create instance based on chosen MG
  if(mgInstance) { // cleanup previous
    try{ mgInstance.destroy(); }catch(e){}
    mgInstance = null;
  }

  if(currentMG === "timeTrial"){
    mgInstance = createTimeTrial(room);
    mgInstance.join(playerId, { nick });
    mgInstance.onUpdate((s)=> onMGUpdate(s));
  } else if(currentMG === "tag"){
    mgInstance = createTag(room);
    mgInstance.join(playerId, { nick });
    mgInstance.onUpdate(s => onMGUpdate(s));
  } else if(currentMG === "ctf"){
    mgInstance = createCTF(room);
    mgInstance.join(playerId, "red", { nick });
    mgInstance.onUpdate(s => onMGUpdate(s));
  } else if(currentMG === "survival"){
    mgInstance = createSurvival(room);
    mgInstance.join(playerId, { nick });
    mgInstance.onUpdate(s => onMGUpdate(s));
  }

  // show some in-canvas status
  drawOverlay(`Minigame: ${currentMG} — Room: ${room}\nNick: ${nick}`);
};

startBtn.onclick = async () => {
  if(!mgInstance){ log("Entre em um minigame primeiro."); return; }
  // call the common start (modules used 'start' naming for TimeTrial/Survival; Tag/CTF control via setIt/pickup)
  try{
    if(currentMG === "timeTrial"){
      await mgInstance.start(3); // 3s countdown
      log("TimeTrial: start pedido.");
    } else if(currentMG === "survival"){
      // example wave spawn
      await mgInstance.startNextWave({ waveNum: 1, spawns: [{type:"grunt", x:400, y:200, delay:2000}] });
      log("Survival: next wave iniciado.");
    } else {
      log("Start não aplicável — use ações específicas (Tag/CTF manual).");
    }
  }catch(e){
    log("Erro ao pedir start:", e.message || e);
  }
};

leaveBtn.onclick = () => {
  if(!mgInstance){ log("Nada para sair."); return; }
  try{
    mgInstance.leave(playerId);
    if(mgInstance.destroy) mgInstance.destroy();
  }catch(e){}
  mgInstance = null;
  currentMG = null;
  mgRoom = null;
  mgState.innerHTML = "Saída concluída.";
  drawOverlay("Você saiu do minigame.");
};

/* ===== helper for displaying state updates coming from DB ===== */
function onMGUpdate(state){
  // pretty print partial state in UI
  try{
    mgState.innerHTML = `<pre style="color:#fff;max-height:140px;overflow:auto">${JSON.stringify(state, null, 2)}</pre>`;
    log("Update do minigame recebido.");
  }catch(e){
    mgState.textContent = "Erro ao mostrar estado.";
  }
}

/* ===== quick action buttons drawn on canvas for testing (manual triggers) ===== */
function drawOverlay(text){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle = "#2b7bd6";
  ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";
  ctx.font = "18px sans-serif";
  const lines = (text||"").split("\n");
  let y = 40;
  for(const line of lines){
    ctx.fillText(line, canvas.width/2, y);
    y += 26;
  }

  // draw simple control hints
  ctx.font = "14px sans-serif";
  ctx.fillText("Use o menu de Minigames → selecione → Join → Start/Leave", canvas.width/2, canvas.height - 20);
}

/* ===== simple loop to keep canvas responsive ===== */
function tick(){
  requestAnimationFrame(tick);
  // nothing heavy, overlay drawn on events
}
tick();

/* ===== small helpers for manual mg actions (developer convenience) ===== */
window.__MG = {
  join: () => joinBtn.click(),
  start: () => startBtn.click(),
  leave: () => leaveBtn.click(),
  // tag specific helper (invokes setIt on server)
  tagSetIt: async (targetId) => {
    if(currentMG !== "tag" || !mgInstance) { log("Tag não ativo."); return; }
    try{ await mgInstance.setIt(targetId || playerId); log("setIt chamado"); }catch(e){ log("erro setIt", e); }
  },
  ctfPickup: async (color) => {
    if(currentMG !== "ctf" || !mgInstance) { log("CTF não ativo."); return; }
    try{ const ok = await mgInstance.pickupFlag(color, playerId); log("pickupFlag ->", ok); }catch(e){ log(e); }
  },
  ctfCapture: async () => {
    if(currentMG !== "ctf" || !mgInstance) { log("CTF não ativo."); return; }
    try{ const ok = await mgInstance.captureFlag(playerId); log("captureFlag ->", ok); }catch(e){ log(e); }
  },
  survivalKill: async (spawnId) => {
    if(currentMG !== "survival" || !mgInstance) { log("Survival não ativo."); return; }
    try{ mgInstance.removeSpawn(spawnId); log("removeSpawn chamado"); }catch(e){ log(e); }
  },
  timeTrialFinish: async (elapsedMs) => {
    if(currentMG !== "timeTrial" || !mgInstance) { log("TimeTrial não ativo."); return; }
    try{ mgInstance.reportFinish(playerId, typeof elapsedMs === "number" ? elapsedMs : 12345); log("reportFinish enviado"); }catch(e){ log(e); }
  }
};

drawOverlay("Abra o menu 🎮 Minigames e escolha um minigame para entrar.");

log(`PlayerId: ${playerId} pronto. Nick default: ${nick}`);
