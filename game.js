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
const emotePages = document.getElementById("emotePages");
const prevEmote = document.getElementById("prevEmote");
const nextEmote = document.getElementById("nextEmote");

/* ONLINE */
const room = "online_emotes_4";
const playerId = "p_" + Math.floor(Math.random()*99999);
let onlineEnabled = false;
const onlinePlayers = {};

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
attack.ontouchstart=()=>{};
[left,right,jump,attack].forEach(b=>b.ontouchend=()=>rikcat.vx=0);

/* EMOTES */
emoteBtn.onclick=()=>{
  emoteMenu.style.display =
    emoteMenu.style.display==="block"?"none":"block";
};

/* LISTA DE EMOTES */
const emotes=[
  "😀","😡","😴","😂","😭",
  "😎","🥳","😱","❤️","🔥",
  "👍","👎"
];

const EMOTES_PER_PAGE=5;
let currentPage=0;

for(let i=0;i<emotes.length;i+=EMOTES_PER_PAGE){
  const page=document.createElement("div");
  page.className="emotePage";

  emotes.slice(i,i+EMOTES_PER_PAGE).forEach(e=>{
    const btn=document.createElement("button");
    btn.className="emote";
    btn.textContent=e;
    btn.onclick=()=>{
      rikcat.emote=e;
      emoteMenu.style.display="none";
    };
    page.appendChild(btn);
  });

  emotePages.appendChild(page);
}

const totalPages=Math.ceil(emotes.length/EMOTES_PER_PAGE);

function updateEmotePage(){
  emotePages.style.transform=
    `translateX(${-currentPage*200}px)`;
}

prevEmote.onclick=()=>{
  if(currentPage>0){
    currentPage--;
    updateEmotePage();
  }
};
nextEmote.onclick=()=>{
  if(currentPage<totalPages-1){
    currentPage++;
    updateEmotePage();
  }
};

/* MAPA */
const platforms=[
  {x:0,y:()=>canvas.height-40,w:3000,h:40},
  {x:200,y:()=>canvas.height-120,w:140,h:20},
  {x:420,y:()=>canvas.height-200,w:140,h:20},
];

/* DESENHO DO RIKCAT */
function drawRikcat(x,y,color,emote){
  ctx.save();
  ctx.translate(x,y);

  const outline="#000";
  const earInside="#FF2FA3";

  ctx.lineWidth=4;

  /* ORELHAS ATRÁS */
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
  ctx.fillStyle="#FF2FA3";
  ctx.beginPath();
  ctx.moveTo(0,14); ctx.lineTo(-6,22); ctx.lineTo(6,22);
  ctx.closePath(); ctx.fill();

  /* BOCA */
  ctx.strokeStyle="#000";
  ctx.beginPath();
  ctx.moveTo(0,22); ctx.lineTo(0,28);
  ctx.quadraticCurveTo(-4,30,-6,28);
  ctx.moveTo(0,28);
  ctx.quadraticCurveTo(4,30,6,28);
  ctx.stroke();

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

/* FÍSICA */
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

drawRikcat(rikcat.x,rikcat.y,"#FFB000",rikcat.emote);

/* ONLINE */
if(onlineEnabled){
  set(myRef,{
    x:rikcat.x,
    y:rikcat.y,
    emote:rikcat.emote
  });

  for(const id in onlinePlayers){
    if(id===playerId) continue;
    const p=onlinePlayers[id];
    drawRikcat(p.x,p.y,"#A020F0",p.emote);
  }
}
}
update();
