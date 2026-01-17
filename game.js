// game.js — FO1 integrado (solo + multiplayer)
import { db, ref, set, push, onValue, onDisconnect } from "./firebase.js";
import { drawRikcat } from "./rikcat.js";
import { drawPolvo } from "./polvo.js";
import { pedirSenhaADM, admLigado } from "./admin.js";
import { enemies, spawnEnemy } from "./enemies.js";

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

function resize(){ canvas.width = innerWidth; canvas.height = innerHeight; }
resize(); addEventListener("resize", resize);

/* constantes */
const GRAVITY = 0.9;
const JUMP = -16;
const SPEED = 5;

/* estado local */
const player = {
  x: 100, y: 0, w: 40, h: 40,
  vx: 0, vy: 0, onGround: false,
  skin: "rikcat", color: "#FFB000", nick: "Convidado"
};

let modo = "solo";
let playerRef = null;
let outros = {};
let playersDBRef = null;
let sendInterval = null;

/* elementos UI */
const menu = document.getElementById("menu");
const configScreen = document.getElementById("configScreen");
const soloBtn = document.getElementById("soloBtn");
const multiBtn = document.getElementById("multiBtn");
const configBtn = document.getElementById("configBtn");
const saveConfig = document.getElementById("saveConfig");
const nickInput = document.getElementById("nickInput");
const skinSelect = document.getElementById("skinSelect");
const colorSelect = document.getElementById("colorSelect");
const openChatBtn = document.getElementById("openChatBtn");
const chatBar = document.getElementById("chatBar");
const messages = document.getElementById("messages");
const chatInput = document.getElementById("chatInput");
const adminBtn = document.getElementById("adminBtn");
const openAdminBtn = document.getElementById("openAdminBtn");

/* input */
const keys = {};
addEventListener("keydown", e=>{ keys[e.key]=true; });
addEventListener("keyup", e=>{ keys[e.key]=false; });

/* mobile buttons binding */
function bindTouch(id, key){
  const el = document.getElementById(id);
  if(!el) return;
  el.addEventListener("touchstart", e=>{ e.preventDefault(); keys[key]=true; }, {passive:false});
  el.addEventListener("touchend", e=>{ e.preventDefault(); keys[key]=false; }, {passive:false});
}
bindTouch("left","ArrowLeft");
bindTouch("right","ArrowRight");
bindTouch("jump"," ");

/* chat DB */
const chatRef = ref(db, "rooms/fo1/chat");
onValue(chatRef, snap=>{
  messages.innerHTML = "";
  const data = snap.val() || {};
  Object.values(data).slice(-60).forEach(m=>{
    const div = document.createElement("div");
    div.innerHTML = `<b>${m.sender}:</b> ${m.text}`;
    messages.appendChild(div);
  });
  messages.scrollTop = messages.scrollHeight;
});

/* functions */
function groundY(){ return canvas.height - 80; }

function conectarMultiplayer(){
  modo = "multi";
  // reference to players list
  playersDBRef = ref(db, "rooms/fo1/players");
  playerRef = push(playersDBRef);
  set(playerRef, player);
  onDisconnect(playerRef).remove();

  // listen all players
  onValue(playersDBRef, snap=>{
    const data = snap.val() || {};
    outros = {};
    Object.keys(data).forEach(k=>{
      if(k !== playerRef.key) outros[k] = data[k];
    });
  });

  // periodic send
  if(sendInterval) clearInterval(sendInterval);
  sendInterval = setInterval(()=>{
    if(playerRef) set(playerRef, player);
  }, 120);
}

function startSolo(){
  modo = "solo";
  menu.style.display = "none";
  chatBar.style.display = "block";
}

function startMulti(){
  menu.style.display = "none";
  chatBar.style.display = "block";
  conectarMultiplayer();
}

/* UI wiring */
if(soloBtn) soloBtn.addEventListener("click", startSolo);
if(multiBtn) multiBtn.addEventListener("click", startMulti);
if(configBtn) configBtn.addEventListener("click", ()=>{ configScreen.style.display = "flex"; });
if(saveConfig) saveConfig.addEventListener("click", ()=>{
  player.nick = nickInput.value.trim() || player.nick;
  player.skin = skinSelect.value || player.skin;
  player.color = colorSelect.value || player.color;
  configScreen.style.display = "none";
  // immediately push update if multiplayer
  if(modo === "multi" && playerRef) set(playerRef, player);
});
if(openChatBtn) openChatBtn.addEventListener("click", ()=>{ chatBar.style.display = chatBar.style.display === "none" ? "block" : "none"; });
if(chatInput){
  chatInput.addEventListener("keydown", e=>{
    if(e.key === "Enter" && chatInput.value.trim()){
      const text = chatInput.value.trim();
      push(chatRef, { sender: player.nick || "Convidado", text, time: Date.now() });
      chatInput.value = "";
    }
  });
}
if(openAdminBtn) openAdminBtn.addEventListener("click", ()=> pedirSenhaADM());
if(adminBtn) adminBtn.addEventListener("click", ()=> {
  if(admLigado()){
    // sample placeholder effect — spawn enemy or log
    alert("Poder ADM acionado (placeholder)");
  } else {
    alert("ADM não ativado");
  }
});

/* ensure chat button visible when in multi */
function setOpenChatVisible(v){
  if(openChatBtn) openChatBtn.style.display = v ? "flex" : "none";
}

/* main loop */
function update(){
  // movement (keyboard or touch)
  if(keys["ArrowLeft"]) player.vx = -SPEED;
  else if(keys["ArrowRight"]) player.vx = SPEED;
  else player.vx *= 0.85;

  if((keys[" "] || keys["Space"] || keys["ArrowUp"]) && player.onGround){
    player.vy = JUMP; player.onGround = false;
  }

  // physics
  player.vy += GRAVITY;
  player.x += player.vx;
  player.y += player.vy;

  // ground collision
  const g = groundY();
  if(player.y + player.h >= g){
    player.y = g - player.h;
    player.vy = 0;
    player.onGround = true;
  }

  // clamp X
  if(player.x < 0) player.x = 0;
  if(player.x > canvas.width - player.w) player.x = canvas.width - player.w;

  // draw
  ctx.clearRect(0,0,canvas.width,canvas.height);
  // sky
  ctx.fillStyle = "#87CEEB"; ctx.fillRect(0,0,canvas.width,canvas.height);
  // ground
  ctx.fillStyle = "#654321"; ctx.fillRect(0, g, canvas.width, 80);

  // draw others
  if(modo === "multi"){
    for(const id in outros){
      const p = outros[id];
      if(p.skin === "polvo") drawPolvo(ctx, p);
      else drawRikcat(ctx, p);
    }
  }

  // draw local player last
  if(player.skin === "polvo") drawPolvo(ctx, player);
  else drawRikcat(ctx, player);

  // admin UI show
  if(admLigado()){
    adminBtn.style.display = "block";
  }

  requestAnimationFrame(update);
}

/* init */
setOpenChatVisible(false);
update();

/* expose small globals for debugging in console */
window.__PLAYER = player;
window.__OUTROS = outros;
window.__CONN = conectarMultiplayer;
