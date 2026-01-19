import { db, ref, push, onValue } from "./firebase.js";
import { drawRikcat } from "./rikcat.js";
import { drawPolvo } from "./polvo.js";

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

function resize(){
  canvas.width = innerWidth;
  canvas.height = innerHeight;
}
resize();
addEventListener("resize", resize);

/* ESTADO */
let estado = "menu";

/* PLAYER */
const player = {
  x:100, y:0, w:40, h:40,
  vx:0, vy:0, onGround:false,
  skin:"rikcat", color:"#FFB000", nick:"Convidado"
};

/* FÍSICA */
const GRAVITY = 0.9;
const JUMP = -16;
const SPEED = 5;

/* INPUT */
const keys = {};
addEventListener("keydown", e=> keys[e.key]=true);
addEventListener("keyup", e=> keys[e.key]=false);

/* MOBILE */
function bindTouch(id, key){
  const el = document.getElementById(id);
  if(!el) return;
  el.addEventListener("touchstart", e=>{ e.preventDefault(); keys[key]=true; });
  el.addEventListener("touchend", e=>{ e.preventDefault(); keys[key]=false; });
}
bindTouch("left","ArrowLeft");
bindTouch("right","ArrowRight");
bindTouch("jump"," ");

/* UI */
const menu = document.getElementById("menu");
const soloBtn = document.getElementById("soloBtn");
const multiBtn = document.getElementById("multiBtn");
const configBtn = document.getElementById("configBtn");
const configScreen = document.getElementById("configScreen");
const saveConfig = document.getElementById("saveConfig");

/* CONFIG */
saveConfig.onclick = ()=>{
  player.nick = document.getElementById("nickInput").value || player.nick;
  player.skin = document.getElementById("skinSelect").value;
  player.color = document.getElementById("colorInput").value;
  configScreen.style.display = "none";
};

configBtn.onclick = ()=> configScreen.style.display = "flex";

/* CHAT */
const openChatBtn = document.getElementById("openChatBtn");
const chatBar = document.getElementById("chatBar");
const messages = document.getElementById("messages");
const chatInput = document.getElementById("chatInput");

const chatRef = ref(db, "rooms/fo1/chat");
let chatAberto = false;

onValue(chatRef, snap=>{
  messages.innerHTML = "";
  Object.values(snap.val()||{}).slice(-40).forEach(m=>{
    const d = document.createElement("div");
    d.innerHTML = `<b>${m.sender}:</b> ${m.text}`;
    messages.appendChild(d);
  });
  messages.scrollTop = messages.scrollHeight;
});

openChatBtn.onclick = ()=>{
  chatAberto = !chatAberto;
  chatBar.style.display = chatAberto ? "block" : "none";
};

chatInput.onkeydown = e=>{
  if(e.key==="Enter" && chatInput.value.trim()){
    push(chatRef,{ sender:player.nick, text:chatInput.value, time:Date.now() });
    chatInput.value="";
  }
};

/* INICIAR JOGO */
function iniciarJogo(){
  estado="jogo";
  menu.style.display="none";
  openChatBtn.style.display="flex";
}

soloBtn.onclick = iniciarJogo;
multiBtn.onclick = iniciarJogo;

/* JOGO */
function groundY(){ return canvas.height - 80; }

function update(){
  if(estado==="jogo"){
    if(keys["ArrowLeft"]) player.vx=-SPEED;
    else if(keys["ArrowRight"]) player.vx=SPEED;
    else player.vx*=0.85;

    if((keys[" "]||keys["ArrowUp"]) && player.onGround){
      player.vy=JUMP; player.onGround=false;
    }

    player.vy+=GRAVITY;
    player.x+=player.vx;
    player.y+=player.vy;

    const g=groundY();
    if(player.y+player.h>=g){
      player.y=g-player.h;
      player.vy=0;
      player.onGround=true;
    }
  }

  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle="#87CEEB";
  ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle="#654321";
  ctx.fillRect(0,groundY(),canvas.width,80);

  if(player.skin==="polvo") drawPolvo(ctx,player);
  else drawRikcat(ctx,player);

  requestAnimationFrame(update);
}

update();
