import { db, ref, set, onValue, onDisconnect } from "./firebase.js";

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const titleScreen = document.getElementById("titleScreen");
const soloBtn = document.getElementById("soloBtn");
const multiBtn = document.getElementById("multiBtn");
const gameDiv = document.getElementById("game");
const rotate = document.getElementById("rotate");

/* BOTÕES */
const left  = document.getElementById("left");
const right = document.getElementById("right");
const jump  = document.getElementById("jump");
const attack= document.getElementById("attack");

/* EMOTES */
const emoteBtn = document.getElementById("emoteBtn");
const emoteMenu = document.getElementById("emoteMenu");
const emoteButtons = document.querySelectorAll(".emote");

/* ONLINE */
const room = "boa_online_03";
const playerId = "p_" + Math.floor(Math.random()*99999);
const onlinePlayers = {};

/* AUDIO */
const audioCtx = new (window.AudioContext||window.webkitAudioContext)();
function playSound(freq,time=0.1){
  const osc = audioCtx.createOscillator();
  osc.frequency.value = freq;
  osc.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime+time);
}

/* RESIZE */
function resize(){
  canvas.width = innerWidth;
  canvas.height = innerHeight;
}
addEventListener("resize", resize);
resize();

/* ORIENTAÇÃO */
function checkOrientation(){
  rotate.style.display = innerHeight > innerWidth ? "flex" : "none";
}
addEventListener("resize", checkOrientation);
checkOrientation();

/* START */
let playing=false;
function startGame(){
  titleScreen.style.display="none";
  gameDiv.style.display="block";
  playing=true;
}
soloBtn.onclick=startGame;
multiBtn.onclick=startGame;

/* PLAYER */
const rikcat={
  x:80,y:0,w:32,h:32,
  vx:0,vy:0,onGround:false,
  life:3,dir:"right",attacking:false,
  emote:"", emoteTimer:0
};

/* FIREBASE */
const myRef = ref(db, `rooms/${room}/players/${playerId}`);
onDisconnect(myRef).remove();

onValue(ref(db,`rooms/${room}/players`), snap=>{
  const data = snap.val();
  if(data) Object.assign(onlinePlayers,data);
});

/* CONTROLES */
left.ontouchstart=()=>rikcat.vx=-4;
right.ontouchstart=()=>rikcat.vx=4;
jump.ontouchstart=()=>{
  if(rikcat.onGround){
    rikcat.vy=-12;
    rikcat.onGround=false;
    playSound(300);
  }
};
attack.ontouchstart=()=>{
  rikcat.attacking=true;
  playSound(500,0.08);
};
[left,right,jump,attack].forEach(b=>b.ontouchend=()=>{
  rikcat.vx=0;
  rikcat.attacking=false;
});

/* EMOTES */
emoteBtn.ontouchstart=()=>{
  emoteMenu.style.display =
    emoteMenu.style.display==="none"?"block":"none";
};
emoteButtons.forEach(btn=>{
  btn.ontouchstart=()=>{
    rikcat.emote=btn.textContent;
    rikcat.emoteTimer=180;
    emoteMenu.style.display="none";
  };
});

/* MAPA */
const platforms=[
  {x:0,y:()=>canvas.height-40,w:3000,h:40},
  {x:200,y:()=>canvas.height-120,w:140,h:20},
  {x:420,y:()=>canvas.height-200,w:140,h:20},
  {x:650,y:()=>canvas.height-260,w:140,h:20},
];

/* RIKCAT DESENHO */
function drawRikcat(x,y,scale=1,bodyColor="#FFB000"){
ctx.save();
ctx.translate(x,y);
ctx.scale(scale,scale);

const outline="#000";
const earInside="#FF2FA3";
const noseColor="#FF2FA3";
ctx.lineWidth=4;

// ORELHAS ATRÁS
ctx.fillStyle=bodyColor;
ctx.strokeStyle=outline;

// esquerda
ctx.beginPath();
ctx.moveTo(-18,-2);
ctx.lineTo(-40,-28);
ctx.lineTo(-8,-22);
ctx.closePath();ctx.fill();ctx.stroke();
ctx.fillStyle=earInside;
ctx.beginPath();
ctx.moveTo(-20,-8);
ctx.lineTo(-32,-22);
ctx.lineTo(-14,-18);
ctx.closePath();ctx.fill();

// direita
ctx.fillStyle=bodyColor;
ctx.beginPath();
ctx.moveTo(18,-2);
ctx.lineTo(40,-28);
ctx.lineTo(8,-22);
ctx.closePath();ctx.fill();ctx.stroke();
ctx.fillStyle=earInside;
ctx.beginPath();
ctx.moveTo(20,-8);
ctx.lineTo(32,-22);
ctx.lineTo(14,-18);
ctx.closePath();ctx.fill();

// cabeça
ctx.fillStyle=bodyColor;
ctx.beginPath();
ctx.arc(0,6,26,0,Math.PI*2);
ctx.fill();ctx.stroke();

// olhos
ctx.fillStyle="#000";
ctx.fillRect(-8,0,4,14);
ctx.fillRect(4,0,4,14);

// nariz
ctx.fillStyle=noseColor;
ctx.beginPath();
ctx.moveTo(0,14);
ctx.lineTo(-6,22);
ctx.lineTo(6,22);
ctx.closePath();
ctx.fill();

// boca
ctx.strokeStyle=outline;
ctx.beginPath();
ctx.moveTo(0,22);
ctx.lineTo(0,28);
ctx.quadraticCurveTo(-4,30,-6,28);
ctx.moveTo(0,28);
ctx.quadraticCurveTo(4,30,6,28);
ctx.stroke();

ctx.restore();
}

/* LOOP */
function update(){
requestAnimationFrame(update);
if(!playing) return;

ctx.clearRect(0,0,canvas.width,canvas.height);

rikcat.vy+=0.6;
rikcat.x+=rikcat.vx;
rikcat.y+=rikcat.vy;

rikcat.onGround=false;
platforms.forEach(p=>{
  const py=p.y();
  ctx.fillStyle="#8B4513";
  ctx.fillRect(p.x,py,p.w,p.h);
  if(
    rikcat.x < p.x+p.w &&
    rikcat.x+rikcat.w > p.x &&
    rikcat.y+rikcat.h > py &&
    rikcat.y+rikcat.h < py+p.h &&
    rikcat.vy>0
  ){
    rikcat.y=py-rikcat.h;
    rikcat.vy=0;
    rikcat.onGround=true;
  }
});

drawRikcat(rikcat.x+16,rikcat.y+16,1);

if(rikcat.emote){
  ctx.font="28px Arial";
  ctx.textAlign="center";
  ctx.fillText(rikcat.emote, rikcat.x+16, rikcat.y-10);
  rikcat.emoteTimer--;
  if(rikcat.emoteTimer<=0) rikcat.emote="";
}

set(myRef,{
  x:rikcat.x,
  y:rikcat.y,
  emote:rikcat.emote
});

for(const id in onlinePlayers){
  if(id===playerId) continue;
  const p=onlinePlayers[id];
  drawRikcat(p.x+16,p.y+16,1,"purple");
  if(p.emote){
    ctx.font="28px Arial";
    ctx.fillText(p.emote,p.x+16,p.y-10);
  }
}
}
update();
