// game.js
alert("GAME.JS CARREGOU");

import { db, ref, set, onValue, onDisconnect, push, remove } from "./firebase.js";
import { drawRikcat } from "./rikcat.js";
import { initAdmin, effects as adminEffects, spawnEffect as adminSpawnEffect, initAdmin as __initAdmin, enablePdfLocal, isAdmin, initAdmin as _initAdmin } from "./admin.js";
// NOTE: we import admin.js functions below via initAdmin(...) call

// (we will actually call initAdmin(room, playerId) after room/playerId are set below)
import * as adminModule from "./admin.js";

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

function resize(){ canvas.width = innerWidth; canvas.height = innerHeight; }
window.addEventListener("resize", resize, { passive:true });
resize();

/* config */
const GRAVITY = 0.6;
const JUMP = -12;
const SPEED = 5;

const room = "online_salas_1";
const playerId = "p_" + Math.floor(Math.random() * 999999);

const myRef = ref(db, `rooms/${room}/players/${playerId}`);
const playersRef = ref(db, `rooms/${room}/players`);
const chatRef = ref(db, `rooms/${room}/chat`);
const effectsRef = ref(db, `rooms/${room}/effects`);

/* player state */
const me = {
  x: 100, y:100, vx:0, vy:0, w:32, h:32,
  onGround:false, facing:1, nick:"Convidado", skin:"rikcat", color:"#FFB000"
};

let playing=false, online=false;
let camX = 0;
const others = {};
const effects = adminModule.effects; // shared array (admin.js pushes to this via DB)
/* init admin module (wires admin UI + effect DB listener) */
adminModule.initAdmin(room, playerId);

/* INPUT */
const keys = {};
window.addEventListener("keydown", e => keys[e.code] = true);
window.addEventListener("keyup", e => keys[e.code] = false);

// mobile buttons
function bindTouch(elId, keyName){
  const el = document.getElementById(elId);
  if(!el) return;
  el.addEventListener("touchstart", e=>{ e.preventDefault(); keys[keyName]=true; }, {passive:false});
  el.addEventListener("touchend", e=>{ e.preventDefault(); keys[keyName]=false; }, {passive:false});
}
bindTouch("left","ArrowLeft");
bindTouch("right","ArrowRight");
bindTouch("jump","Space");

/* CHAT UI */
const chatBox = document.getElementById("chatBox");
const chatInput = document.getElementById("chatInput");
const chatBtn = document.getElementById("openChatBtn");
const chatContainer = document.getElementById("chatContainer");
let chatOpen = false;

if (chatBtn) chatBtn.addEventListener("click", () => {
  chatOpen = !chatOpen;
  chatContainer.style.display = chatOpen ? "flex" : "none";
  if(chatOpen) chatInput.focus();
});

if (chatInput) {
  chatInput.addEventListener("keydown", e => {
    if (e.key === "Enter" && chatInput.value.trim()) {
      const txt = chatInput.value.trim();
      // command /PDF
      if (txt === "/PDF") {
        if (!adminModule.isAdmin()) {
          alert("Você precisa da senha ADM para ativar comandos.");
        } else {
          adminModule.enablePdfLocal();
          alert("Poder /PDF ativado — botão de raio disponível.");
        }
        chatInput.value = "";
        return;
      }
      push(chatRef, { sender: me.nick, text: txt, time: Date.now() });
      chatInput.value = "";
    }
  });
}

// chat listener
onValue(chatRef, snap => {
  if(!chatBox) return;
  chatBox.innerHTML = "";
  const data = snap.val() || {};
  Object.values(data).slice(-40).forEach(m=>{
    const d = document.createElement("div");
    d.innerHTML = `<b>${m.sender}:</b> ${m.text}`;
    chatBox.appendChild(d);
  });
  chatBox.scrollTop = chatBox.scrollHeight;
});

/* PLATFORMS */
const platforms = [
  { x:0, y:()=>canvas.height-40, w:3000, h:40 },
  { x:250, y:()=>canvas.height-120, w:140, h:20 },
  { x:500, y:()=>canvas.height-200, w:140, h:20 }
];

/* PLAYERS DB */
onValue(playersRef, snap => {
  const data = snap.val() || {};
  // update others
  for (const k in others) if (!data[k]) delete others[k];
  Object.assign(others, data);
});

/* fire button (admin) */
const fireBtn = document.getElementById("fireBtn");
if (fireBtn) {
  fireBtn.addEventListener("click", () => {
    // only works if admin enabled locally
    if (!adminModule.isAdmin()) return;
    // spawn in front of player
    const sx = me.x + (me.facing === 1 ? me.w : 0);
    const sy = me.y + me.h/2;
    adminModule.spawnEffect(sx, sy, me.facing, 700, 700);
  });
}

/* DRAW / RENDER EFFECTS */
function renderEffects() {
  const now = Date.now();
  for (let i = effects.length - 1; i >= 0; i--) {
    const ef = effects[i];
    if (!ef) { effects.splice(i,1); continue; }
    const age = now - (ef.createdAt || 0);
    if (age > (ef.duration || 700) + 300) {
      effects.splice(i,1);
      continue;
    }
    const alpha = Math.max(0, 1 - (age / (ef.duration || 700)));
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.lineWidth = 12;
    ctx.strokeStyle = "rgba(255,140,0,0.95)";
    const startX = (ef.x - camX);
    const startY = (ef.y);
    const endX = startX + (ef.len || 400) * (ef.dir || 1);
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, startY);
    ctx.stroke();
    // highlight
    ctx.lineWidth = 2;
    ctx.strokeStyle = `rgba(255,255,200,${0.5*alpha})`;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, startY);
    ctx.stroke();
    ctx.restore();
  }
}

/* DRAW PLAYER wrapper */
function drawPlayerWrapper(p) {
  // p may come from DB as plain object — ensure defaults
  const proto = {
    x: p.x || 0, y: p.y || 0, vx: p.vx||0, vy:p.vy||0,
    w: p.w||32, h:p.h||32, onGround: !!p.onGround, facing: p.facing||1,
    nick: p.nick || "Convidado", skin: p.skin||"rikcat", color: p.color||"#FFB000"
  };
  if (proto.skin === "rikcat") drawRikcat(ctx, proto, camX);
  else {
    const x = proto.x - camX + proto.w/2;
    const y = proto.y + proto.h/2;
    ctx.font = "32px Arial"; ctx.textAlign = "center"; ctx.fillStyle = "white";
    ctx.fillText("🐙", x, y);
    ctx.fillStyle = "white"; ctx.font = "12px Arial"; ctx.fillText(proto.nick, x, proto.y - 12);
  }
}

/* MAIN LOOP */
function loop() {
  if (!playing) return;
  requestAnimationFrame(loop);

  const typing = chatOpen && document.activeElement === chatInput;
  if (!typing) {
    if (keys["ArrowLeft"]) { me.vx = -SPEED; me.facing = -1; }
    else if (keys["ArrowRight"]) { me.vx = SPEED; me.facing = 1; }
    else me.vx *= 0.8;

    if (keys["Space"] && me.onGround) {
      me.vy = JUMP;
      me.onGround = false;
    }
  }

  me.vy += GRAVITY;
  me.x += me.vx;
  me.y += me.vy;

  // collisions
  me.onGround = false;
  for (const p of platforms) {
    const py = p.y();
    if (me.x < p.x + p.w && me.x + me.w > p.x &&
        me.y + me.h > py && me.y + me.h < py + p.h && me.vy > 0) {
      me.y = py - me.h;
      me.vy = 0;
      me.onGround = true;
    }
  }

  // camera
  camX = Math.max(0, me.x - canvas.width / 2);

  // clear
  ctx.fillStyle = "#6aa5ff";
  ctx.fillRect(0,0,canvas.width,canvas.height);

  // draw platforms
  ctx.fillStyle = "#8b4513";
  platforms.forEach(pl => ctx.fillRect(pl.x - camX, pl.y(), pl.w, pl.h));

  // effects (draw before players to be behind, or after to be ahead)
  renderEffects();

  // online sync & draw others
  if (online) {
    // send basic state
    set(myRef, {
      x: me.x, y: me.y, vx: me.vx, vy: me.vy,
      w: me.w, h: me.h, onGround: me.onGround,
      facing: me.facing, nick: me.nick, skin: me.skin, color: me.color
    });
    // draw others (exclude self id if present)
    for (const id in others) {
      if (id === playerId) continue;
      drawPlayerWrapper(others[id]);
    }
  }

  // draw local player on top
  drawPlayerWrapper(me);
}

/* START / UI wiring */
function start(isOnline) {
  online = isOnline;
  playing = true;
  document.getElementById("titleScreen").style.display = "none";
  document.getElementById("game").style.display = "block";
  // ensure canvas size
  resize();

  if (online) {
    document.getElementById("openChatBtn").style.display = "flex";
    onDisconnect(myRef).remove();
    onValue(playersRef, snap => {
      const data = snap.val() || {};
      for (const k in others) if (!data[k]) delete others[k];
      Object.assign(others, data);
    });
  } else {
    document.getElementById("openChatBtn").style.display = "none";
  }

  // init admin UI (already called inside admin.js when imported, but call again to ensure)
  adminModule.initAdmin(room, playerId);

  loop();
}

/* UI Buttons */
document.getElementById("soloBtn").onclick = () => start(false);
document.getElementById("multiBtn").onclick = () => start(true);

/* config save */
document.getElementById("closeConfig").onclick = () => {
  const n = document.getElementById("nickInput").value.trim();
  if (n) me.nick = n;
  const skin = document.getElementById("skinSelect").value;
  if (skin) me.skin = skin;
  const col = document.getElementById("colorSelect").value;
  if (col) me.color = col;
  document.getElementById("configScreen").style.display = "none";
};

/* show config */
document.getElementById("configBtn").onclick = () => {
  document.getElementById("configScreen").style.display = "flex";
};

/* initial size */
resize();

// expose for testing
window.__ME = me;
window.__START = start;
