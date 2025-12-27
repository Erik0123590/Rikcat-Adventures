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
  const portrait = innerHeight > innerWidth;
  rotate.style.display = portrait ? "flex" : "none";
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
  life:3,dir:"right",attacking:false
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
  if(navigator.vibrate) navigator.vibrate(30);
};
[left,right,jump,attack].forEach(b=>b.ontouchend=()=>{
  rikcat.vx=0;
  rikcat.attacking=false;
});

/* MAPA */
const platforms=[
  {x:0,y:()=>canvas.height-40,w:3000,h:40},
  {x:200,y:()=>canvas.height-120,w:140,h:20},
  {x:420,y:()=>canvas.height-200,w:140,h:20},
  {x:650,y:()=>canvas.height-260,w:140,h:20},
];

/* SPRITE */
function drawRikcat(x, y, scale = 1, bodyColor = "#FFA500") {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  const outline = "#000";
  const earInside = "#FFB347"; // dentro da orelha (laranja claro)
  const noseColor = "#FF4FA3"; // rosa
  const mouthColor = "#000";

  // 🟠 Cabeça
  ctx.fillStyle = bodyColor;
  ctx.strokeStyle = outline;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, 16, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // 👂 Orelha esquerda
  ctx.beginPath();
  ctx.moveTo(-18, -10);
  ctx.lineTo(-30, -28);
  ctx.lineTo(-10, -24);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // 👂 Orelha direita
  ctx.beginPath();
  ctx.moveTo(18, -10);
  ctx.lineTo(30, -28);
  ctx.lineTo(10, -24);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // 👂 Dentro da orelha esquerda
  ctx.fillStyle = earInside;
  ctx.beginPath();
  ctx.moveTo(-18, -14);
  ctx.lineTo(-26, -24);
  ctx.lineTo(-14, -22);
  ctx.closePath();
  ctx.fill();

  // 👂 Dentro da orelha direita
  ctx.beginPath();
  ctx.moveTo(18, -14);
  ctx.lineTo(26, -24);
  ctx.lineTo(14, -22);
  ctx.closePath();
  ctx.fill();

  // 👁 Olho esquerdo
  ctx.fillStyle = "#000";
  ctx.fillRect(-6, -4, 3, 8);

  // 👁 Olho direito
  ctx.fillRect(3, -4, 3, 8);

  // 👃 Nariz COM contorno
  ctx.fillStyle = noseColor;
  ctx.strokeStyle = outline;
  ctx.beginPath();
  ctx.moveTo(0, 2);
  ctx.lineTo(-4, 8);
  ctx.lineTo(4, 8);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // 👄 Boca (agora EXISTE 😼)
  ctx.strokeStyle = mouthColor;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-5, 10);
  ctx.quadraticCurveTo(0, 13, 5, 10);
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

  drawRikcat(rikcat.x,rikcat.y,1,"orange");

  if(rikcat.attacking){
    ctx.fillStyle="yellow";
    ctx.fillRect(rikcat.x+32,rikcat.y+12,20,8);
  }

  ctx.fillStyle="red";
  ctx.fillRect(rikcat.x,rikcat.y-6,rikcat.life*10,4);

  set(myRef,{
    x:rikcat.x,
    y:rikcat.y,
    life:rikcat.life,
    attacking:rikcat.attacking,
    name:"Rikcat"
  });

  for(const id in onlinePlayers){
    if(id===playerId) continue;
    const p=onlinePlayers[id];
    drawRikcat(p.x,p.y,1,"purple");
    if(p.attacking){
      ctx.fillStyle="yellow";
      ctx.fillRect(p.x+32,p.y+12,20,8);
    }
  }
}
update();
