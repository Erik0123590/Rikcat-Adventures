import { db, ref, set, onValue, onDisconnect, push } from "./firebase.js";

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

canvas.width = innerWidth;
canvas.height = innerHeight;
addEventListener("resize",()=>{
  canvas.width = innerWidth;
  canvas.height = innerHeight;
});

/* TELAS */
const titleScreen = document.getElementById("titleScreen");
const configScreen = document.getElementById("configScreen");
const gameDiv = document.getElementById("game");

/* BOTÕES */
const soloBtn = document.getElementById("soloBtn");
const multiBtn = document.getElementById("multiBtn");
const configBtn = document.getElementById("configBtn");
const saveConfig = document.getElementById("saveConfig");

/* CHAT */
const openChatBtn = document.getElementById("openChatBtn");
const chatBox = document.getElementById("chatBox");
const messages = document.getElementById("messages");
const chatInput = document.getElementById("chatInput");

/* CONTROLES */
const left = document.getElementById("left");
const right = document.getElementById("right");
const jump = document.getElementById("jump");

let keys = {};
let chatOpen = false;

/* PLAYER */
const player = {
  x:100,y:0,w:32,h:32,
  vx:0,vy:0,onGround:false,
  skin:"rikcat",
  nick:"Jogador",
  facing:1
};

const GRAVITY = 0.6;
const SPEED = 4;
const JUMP = -12;

/* PLATAFORMAS */
const platforms = [
  {x:0,y:()=>canvas.height-40,w:3000,h:40},
  {x:200,y:()=>canvas.height-140,w:150,h:20},
  {x:500,y:()=>canvas.height-220,w:150,h:20}
];

/* ONLINE */
const room = "online_emotes_5";
const playerId = "p_"+Math.floor(Math.random()*99999);
const onlinePlayers = {};
const myRef = ref(db,`rooms/${room}/players/${playerId}`);

/* DESENHO RIKCAT */
function drawRikcat(p){
  ctx.save();
  ctx.translate(p.x,p.y);
  ctx.scale(p.facing,1);

  ctx.fillStyle="#FFB000";
  ctx.beginPath();
  ctx.arc(0,0,18,0,Math.PI*2);
  ctx.fill();
  ctx.stroke();

  // orelhas
  ctx.beginPath();
  ctx.moveTo(-10,-10);ctx.lineTo(-25,-30);ctx.lineTo(-5,-25);
  ctx.moveTo(10,-10);ctx.lineTo(25,-30);ctx.lineTo(5,-25);
  ctx.stroke();

  // olhos
  ctx.fillStyle="#000";
  ctx.fillRect(-6,-5,3,8);
  ctx.fillRect(3,-5,3,8);

  ctx.restore();
}

/* DESENHO POLVO (IGUAL À IMAGEM) */
function drawPolvo(p){
  ctx.save();
  ctx.translate(p.x,p.y);

  ctx.fillStyle="#FF77B7";
  ctx.strokeStyle="#000";

  // cabeça
  ctx.beginPath();
  ctx.arc(0,-5,20,0,Math.PI*2);
  ctx.fill();ctx.stroke();

  // olhos
  ctx.fillStyle="#000";
  ctx.fillRect(-8,-10,4,10);
  ctx.fillRect(4,-10,4,10);

  // tentáculos
  ctx.fillStyle="#FF77B7";
  [-14,-7,0,7,14].forEach(tx=>{
    ctx.beginPath();
    ctx.arc(tx,10,6,0,Math.PI);
    ctx.fill();ctx.stroke();
  });

  ctx.restore();
}

/* LOOP */
let playing=false;
function loop(){
  requestAnimationFrame(loop);
  if(!playing)return;

  player.vy+=GRAVITY;
  player.x+=player.vx;
  player.y+=player.vy;

  player.onGround=false;
  platforms.forEach(p=>{
    const py=p.y();
    ctx.fillStyle="#8B4513";
    ctx.fillRect(p.x,py,p.w,p.h);

    if(player.x<p.x+p.w&&player.x+player.w>p.x &&
       player.y+player.h>py&&player.y+player.h<py+p.h &&
       player.vy>0){
      player.y=py-player.h;
      player.vy=0;
      player.onGround=true;
    }
  });

  ctx.clearRect(0,0,canvas.width,canvas.height);

  if(player.skin==="rikcat") drawRikcat(player);
  else drawPolvo(player);

  // nick
  ctx.fillStyle="white";
  ctx.font="14px Arial";
  ctx.fillText(player.nick,player.x-15,player.y-25);

  set(myRef,{
    x:player.x,y:player.y,
    skin:player.skin,
    nick:player.nick,
    facing:player.facing
  });

  for(const id in onlinePlayers){
    if(id===playerId)continue;
    const p=onlinePlayers[id];
    if(p.skin==="rikcat") drawRikcat(p);
    else drawPolvo(p);
  }
}

/* START */
function startGame(online){
  titleScreen.style.display="none";
  gameDiv.style.display="block";
  playing=true;

  if(online){
    openChatBtn.style.display="flex";
    onDisconnect(myRef).remove();
    onValue(ref(db,`rooms/${room}/players`),snap=>{
      Object.assign(onlinePlayers,snap.val()||{});
    });
  }
  loop();
}

soloBtn.onclick=()=>startGame(false);
multiBtn.onclick=()=>startGame(true);

configBtn.onclick=()=>{
  titleScreen.style.display="none";
  configScreen.style.display="flex";
};

saveConfig.onclick=()=>{
  player.nick=document.getElementById("nickInput").value||"Jogador";
  player.skin=document.getElementById("skinSelect").value;
  configScreen.style.display="none";
  titleScreen.style.display="flex";
};

/* INPUT */
window.onkeydown=e=>{ if(!chatOpen) keys[e.code]=true; };
window.onkeyup=e=>keys[e.code]=false;

left.ontouchstart=()=>{player.vx=-SPEED;player.facing=-1};
right.ontouchstart=()=>{player.vx=SPEED;player.facing=1};
jump.ontouchstart=()=>{if(player.onGround)player.vy=JUMP};

[left,right,jump].forEach(b=>b.ontouchend=()=>player.vx=0);

/* CHAT */
openChatBtn.onclick=()=>{
  chatOpen=!chatOpen;
  chatBox.style.display=chatOpen?"flex":"none";
};

chatInput.onkeydown=e=>{
  if(e.key==="Enter"&&chatInput.value){
    push(ref(db,`rooms/${room}/chat`),{
      nick:player.nick,
      msg:chatInput.value
    });
    chatInput.value="";
  }
};

onValue(ref(db,`rooms/${room}/chat`),snap=>{
  messages.innerHTML="";
  snap.forEach(c=>{
    const d=c.val();
    messages.innerHTML+=`<div><b>${d.nick}:</b> ${d.msg}</div>`;
  });
});
