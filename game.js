import { db, ref, set, onValue, onDisconnect } from "./firebase.js";

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

/* TELAS */
const titleScreen = document.getElementById("titleScreen");
const soloBtn = document.getElementById("soloBtn");
const multiBtn = document.getElementById("multiBtn");
const gameDiv = document.getElementById("game");
const rotate = document.getElementById("rotate");

/* CONTROLES */
const left  = document.getElementById("left");
const right = document.getElementById("right");
const jump  = document.getElementById("jump");
const attack= document.getElementById("attack");

/* EMOTES */
const emoteBtn = document.getElementById("emoteBtn");
const emoteMenu = document.getElementById("emoteMenu");

/* ONLINE */
const room = "online_emotes_3";
const playerId = "p_" + Math.floor(Math.random()*99999);
let onlineEnabled = false;
const onlinePlayers = {};

/* CORES */
const playerColors = ["#FFB000", "#A020F0", "#2ECC71"];

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
function startGame(online){
  onlineEnabled = online;
  titleScreen.style.display="none";
  gameDiv.style.display="block";
  playing=true;
}
soloBtn.onclick=()=>startGame(false);
multiBtn.onclick=()=>startGame(true);

/* PLAYER */
const rikcat={
  x:80,y:0,w:32,h:32,
  vx:0,vy:0,onGround:false,
  life:3,attacking:false,
  emote:null
};

/* FIREBASE */
const myRef = ref(db, `rooms/${room}/players/${playerId}`);
onDisconnect(myRef).remove();

onValue(ref(db,`rooms/${room}/players`), snap=>{
  Object.keys(onlinePlayers).forEach(k=>delete onlinePlayers[k]);
  if(snap.val()) Object.assign(onlinePlayers,snap.val());
});

/* CONTROLES */
left.ontouchstart=()=>rikcat.vx=-4;
right.ontouchstart=()=>rikcat.vx=4;
jump.ontouchstart=()=>{
  if(rikcat.onGround){
    rikcat.vy=-12;
    rikcat.onGround=false;
  }
};
attack.ontouchstart=()=>rikcat.attacking=true;
[left,right,jump,attack].forEach(b=>b.ontouchend=()=>{
  rikcat.vx=0;
  rikcat.attacking=false;
});

/* EMOTES */
emoteBtn.onclick=()=>{
  emoteMenu.style.display =
    emoteMenu.style.display==="flex"?"none":"flex";
};
document.querySelectorAll(".emote").forEach(btn=>{
  btn.onclick=()=>{
    rikcat.emote = btn.textContent;
    emoteMenu.style.display="none";
  };
});

/* MAPA */
const platforms=[
  {x:0,y:()=>canvas.height-40,w:3000,h:40},
  {x:200,y:()=>canvas.height-120,w:140,h:20},
  {x:420,y:()=>canvas.height-200,w:140,h:20},
];

/* RIKCAT */
function drawRikcat(x,y,color,emote){
  ctx.save();
  ctx.translate(x+16,y+16);

  const outline="#000";
  const earInside="#FF2FA3";
  const noseColor="#FF2FA3";

  ctx.lineWidth=4;

  /* ORELHAS */
  ctx.fillStyle=color; ctx.strokeStyle=outline;
  ctx.beginPath();
  ctx.moveTo(-18,-2); ctx.lineTo(-40,-28); ctx.lineTo(-8,-22);
  ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle=earInside;
  ctx.beginPath();
  ctx.moveTo(-20,-8); ctx.lineTo(-32,-22); ctx.lineTo(-14,-18);
  ctx.closePath(); ctx.fill();

  ctx.fillStyle=color;
  ctx.beginPath();
  ctx.moveTo(18,-2); ctx.lineTo(40,-28); ctx.lineTo(8,-22);
  ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle=earInside;
  ctx.beginPath();
  ctx.moveTo(20,-8); ctx.lineTo(32,-22); ctx.lineTo(14,-18);
  ctx.closePath(); ctx.fill();

  /* CABEÇA */
  ctx.fillStyle=color;
  ctx.beginPath();
  ctx.arc(0,6,26,0,Math.PI*2);
  ctx.fill(); ctx.stroke();

  /* OLHOS */
  ctx.fillStyle="#000";
  ctx.fillRect(-8,0,4,14);
  ctx.fillRect(4,0,4,14);

  /* NARIZ */
  ctx.fillStyle=noseColor;
  ctx.beginPath();
  ctx.moveTo(0,14); ctx.lineTo(-6,22); ctx.lineTo(6,22);
  ctx.closePath(); ctx.fill();

  /* BOCA */
  ctx.beginPath();
  ctx.moveTo(0,22); ctx.lineTo(0,28);
  ctx.quadraticCurveTo(-4,30,-6,28);
  ctx.moveTo(0,28);
  ctx.quadraticCurveTo(4,30,6,28);
  ctx.stroke();

  /* EMOTE */
  if(emote){
    ctx.font="24px sans-serif";
    ctx.fillText(emote,-10,-35);
  }

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

/* LOCAL */
drawRikcat(rikcat.x,rikcat.y,playerColors[0],rikcat.emote);

/* ONLINE */
if(onlineEnabled){
  set(myRef,{
    x:rikcat.x,
    y:rikcat.y,
    emote:rikcat.emote
  });

  const ids = Object.keys(onlinePlayers);
  ids.forEach((id,i)=>{
    if(id===playerId) return;
    const p = onlinePlayers[id];
    drawRikcat(p.x,p.y,playerColors[i+1]||"#999",p.emote);
  });
}
}
update();
