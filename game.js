// game.js
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

/* CHAT */
const openChatBtn = document.getElementById("openChatBtn");
const chatBar = document.getElementById("chatBar");
const messages = document.getElementById("messages");
const chatInput = document.getElementById("chatInput");

const chatRef = ref(db, "rooms/fo1/chat");
let chatAberto = false;

onValue(chatRef, snap=>{
  messages.innerHTML = "";
  const data = snap.val() || {};
  Object.values(data).slice(-40).forEach(m=>{
    const div = document.createElement("div");
    div.innerHTML = `<b>${m.sender}:</b> ${m.text}`;
    messages.appendChild(div);
  });
  messages.scrollTop = messages.scrollHeight;
});

openChatBtn.onclick = ()=>{
  chatAberto = !chatAberto;
  chatBar.style.display = chatAberto ? "block" : "none";
  if(chatAberto) chatInput.focus();
};

chatInput.addEventListener("keydown", e=>{
  if(e.key === "Enter" && chatInput.value.trim()){
    push(chatRef,{
      sender: player.nick,
      text: chatInput.value.trim(),
      time: Date.now()
    });
    chatInput.value = "";
  }
});

addEventListener("keydown", e=>{
  if(e.key === "Escape"){
    chatAberto = false;
    chatBar.style.display = "none";
  }
});

/* JOGO */
function groundY(){
  return canvas.height - 80;
}

function update(){
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

  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle = "#87CEEB";
  ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle = "#654321";
  ctx.fillRect(0,g,canvas.width,80);

  drawRikcat(ctx, player);

  requestAnimationFrame(update);
}

update();
