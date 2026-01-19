// game.js — FO3 UNIFICADO

import { db, ref, set, push, onValue, onDisconnect, update } from "./firebase.js";
import { drawRikcat } from "./rikcat.js";
import { drawPolvo } from "./polvo.js";

/* ================= CANVAS ================= */
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

function resize(){
  canvas.width = innerWidth;
  canvas.height = innerHeight;
}
resize();
addEventListener("resize", resize);

/* ================= ESTADO ================= */
let estado = "menu"; // menu | solo | multi

/* ================= PLAYER ================= */
const player = {
  id: null,
  x: 100,
  y: 0,
  w: 40,
  h: 40,
  vx: 0,
  vy: 0,
  onGround: false,
  skin: "rikcat",
  color: "#FFB000",
  nick: "Convidado"
};

/* ================= CONSTANTES ================= */
const GRAVITY = 0.9;
const JUMP = -16;
const SPEED = 5;

/* ================= INPUT ================= */
const keys = {};
addEventListener("keydown", e => keys[e.key] = true);
addEventListener("keyup", e => keys[e.key] = false);

/* ================= MOBILE ================= */
function bindTouch(id, key){
  const el = document.getElementById(id);
  if(!el) return;
  el.addEventListener("touchstart", e=>{
    e.preventDefault(); keys[key]=true;
  }, {passive:false});
  el.addEventListener("touchend", e=>{
    e.preventDefault(); keys[key]=false;
  }, {passive:false});
}
bindTouch("left","ArrowLeft");
bindTouch("right","ArrowRight");
bindTouch("jump"," ");

/* ================= UI ================= */
const menu = document.getElementById("menu");
const soloBtn = document.getElementById("soloBtn");
const multiBtn = document.getElementById("multiBtn");
const configBtn = document.getElementById("configBtn");

const configScreen = document.getElementById("configScreen");
const saveConfig = document.getElementById("saveConfig");
const nickInput = document.getElementById("nickInput");
const skinSelect = document.getElementById("skinSelect");
const colorSelect = document.getElementById("colorSelect");

/* ================= CONFIG ================= */
configBtn.onclick = ()=>{
  configScreen.style.display = "flex";
};

saveConfig.onclick = ()=>{
  player.nick = nickInput.value || player.nick;
  player.skin = skinSelect.value;
  player.color = colorSelect.value;
  configScreen.style.display = "none";

  if(estado === "multi" && playerRef){
    update(playerRef,{
      nick: player.nick,
      skin: player.skin,
      color: player.color
    });
  }
};

/* ================= CHAT ================= */
const openChatBtn = document.getElementById("openChatBtn");
const chatBar = document.getElementById("chatBar");
const messages = document.getElementById("messages");
const chatInput = document.getElementById("chatInput");

const chatRef = ref(db,"rooms/fo3/chat");
let chatAberto = false;

onValue(chatRef, snap=>{
  messages.innerHTML="";
  Object.values(snap.val()||{}).slice(-40).forEach(m=>{
    const d=document.createElement("div");
    d.innerHTML=`<b>${m.sender}:</b> ${m.text}`;
    messages.appendChild(d);
  });
  messages.scrollTop = messages.scrollHeight;
});

openChatBtn.onclick = ()=>{
  chatAberto = !chatAberto;
  chatBar.style.display = chatAberto ? "block" : "none";
  if(chatAberto) chatInput.focus();
};

chatInput.onkeydown = e=>{
  if(e.key==="Enter" && chatInput.value.trim()){
    push(chatRef,{
      sender: player.nick,
      text: chatInput.value,
      time: Date.now()
    });
    chatInput.value="";
  }
};

/* ================= MULTIPLAYER ================= */
let playerRef = null;
let playersDBRef = null;
let outros = {};
let sendInterval = null;

function conectarMultiplayer(){
  estado = "multi";
  menu.style.display="none";
  openChatBtn.style.display="flex";

  playersDBRef = ref(db,"rooms/fo3/players");
  playerRef = push(playersDBRef);
  player.id = playerRef.key;

  set(playerRef,{
    id: player.id,
    x: player.x,
    y: player.y,
    skin: player.skin,
    color: player.color,
    nick: player.nick
  });

  onDisconnect(playerRef).remove();

  onValue(playersDBRef, snap=>{
    outros = {};
    const data = snap.val() || {};
    for(const id in data){
      if(id !== player.id){
        outros[id] = data[id];
      }
    }
  });

  if(sendInterval) clearInterval(sendInterval);
  sendInterval = setInterval(()=>{
    if(playerRef){
      update(playerRef,{ x: player.x, y: player.y });
    }
  },100);
}

/* ================= SOLO ================= */
function startSolo(){
  estado = "solo";
  menu.style.display="none";
  openChatBtn.style.display="flex";
}

/* ================= BOTÕES ================= */
soloBtn.onclick = startSolo;
multiBtn.onclick = conectarMultiplayer;

/* ================= FÍSICA ================= */
function groundY(){
  return canvas.height - 80;
}

/* ================= LOOP ================= */
function loop(){
  if(estado !== "menu"){
    if(keys["ArrowLeft"]) player.vx = -SPEED;
    else if(keys["ArrowRight"]) player.vx = SPEED;
    else player.vx *= 0.85;

    if((keys[" "] || keys["ArrowUp"]) && player.onGround){
      player.vy = JUMP;
      player.onGround = false;
    }

    player.vy += GRAVITY;
    player.x += player.vx;
    player.y += player.vy;

    const g = groundY();
    if(player.y + player.h >= g){
      player.y = g - player.h;
      player.vy = 0;
      player.onGround = true;
    }
  }

  /* DRAW */
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle="#87CEEB";
  ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle="#654321";
  ctx.fillRect(0,groundY(),canvas.width,80);

  for(const id in outros){
    const p = outros[id];
    if(p.skin==="polvo") drawPolvo(ctx,p);
    else drawRikcat(ctx,p);
  }

  if(player.skin==="polvo") drawPolvo(ctx,player);
  else drawRikcat(ctx,player);

  requestAnimationFrame(loop);
}

loop();
