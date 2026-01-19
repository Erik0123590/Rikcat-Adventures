import { db, ref, push, set, onValue, onDisconnect } from "./firebase.js";
import { drawRikcat } from "./rikcat.js";
import { drawPolvo } from "./polvo.js";

/* CANVAS */
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

function resize(){
  canvas.width = innerWidth;
  canvas.height = innerHeight;
}
resize();
addEventListener("resize", resize);

/* ESTADO */
let estado = "menu"; // menu | solo | multi

/* PLAYER */
const player = {
  x:100, y:0, w:40, h:40,
  vx:0, vy:0, onGround:false,
  skin:"rikcat",
  color:"#FFB000",
  nick:"Convidado"
};

/* FÍSICA */
const GRAVITY = 0.9;
const JUMP = -16;
const SPEED = 5;

/* INPUT */
const keys = {};
addEventListener("keydown", e=>keys[e.key]=true);
addEventListener("keyup", e=>keys[e.key]=false);

/* MOBILE */
function bindTouch(id,key){
  const el=document.getElementById(id);
  if(!el) return;
  el.addEventListener("touchstart",e=>{e.preventDefault();keys[key]=true;});
  el.addEventListener("touchend",e=>{e.preventDefault();keys[key]=false;});
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

const openChatBtn = document.getElementById("openChatBtn");
const chatBar = document.getElementById("chatBar");
const messages = document.getElementById("messages");
const chatInput = document.getElementById("chatInput");

/* CONFIG */
configBtn.onclick = ()=> configScreen.style.display="flex";

saveConfig.onclick = ()=>{
  player.nick = document.getElementById("nickInput").value || player.nick;
  player.skin = document.getElementById("skinSelect").value;
  player.color = document.getElementById("colorInput").value;
  configScreen.style.display="none";
};

/* CHAT */
const chatRef = ref(db,"rooms/fo3/chat");

onValue(chatRef,snap=>{
  messages.innerHTML="";
  Object.values(snap.val()||{}).slice(-50).forEach(m=>{
    const d=document.createElement("div");
    d.innerHTML=`<b>${m.sender}:</b> ${m.text}`;
    messages.appendChild(d);
  });
  messages.scrollTop=messages.scrollHeight;
});

openChatBtn.onclick=()=>{
  chatBar.style.display = chatBar.style.display==="block"?"none":"block";
  chatInput.focus();
};

chatInput.onkeydown=e=>{
  if(e.key==="Enter" && chatInput.value.trim()){
    push(chatRef,{sender:player.nick,text:chatInput.value,time:Date.now()});
    chatInput.value="";
  }
};

/* MULTIPLAYER */
let playerRef=null;
let outros={};

function iniciarMulti(){
  estado="multi";
  menu.style.display="none";
  openChatBtn.style.display="flex";

  const playersRef = ref(db,"rooms/fo3/players");
  playerRef = push(playersRef);

  set(playerRef,{...player});
  onDisconnect(playerRef).remove();

  onValue(playersRef,snap=>{
    outros={};
    const data=snap.val()||{};
    for(const id in data){
      if(id!==playerRef.key) outros[id]=data[id];
    }
  });

  setInterval(()=>{
    if(playerRef) set(playerRef,{...player});
  },120);
}

/* SOLO */
function iniciarSolo(){
  estado="solo";
  menu.style.display="none";
  openChatBtn.style.display="flex";
}

/* BOTÕES */
soloBtn.onclick=iniciarSolo;
multiBtn.onclick=iniciarMulti;

/* JOGO */
function groundY(){ return canvas.height-80; }

function update(){
  if(estado!=="menu"){
    if(keys["ArrowLeft"]) player.vx=-SPEED;
    else if(keys["ArrowRight"]) player.vx=SPEED;
    else player.vx*=0.85;

    if((keys[" "]||keys["ArrowUp"]) && player.onGround){
      player.vy=JUMP;
      player.onGround=false;
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

  for(const id in outros){
    const p=outros[id];
    p.skin==="polvo"?drawPolvo(ctx,p):drawRikcat(ctx,p);
  }

  player.skin==="polvo"?drawPolvo(ctx,player):drawRikcat(ctx,player);

  requestAnimationFrame(update);
}

update();
