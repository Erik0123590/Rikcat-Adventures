import { db, ref, set, onValue, onDisconnect } from "./firebase.js";

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const titleScreen = document.getElementById("titleScreen");
const soloBtn = document.getElementById("soloBtn");
const multiBtn = document.getElementById("multiBtn");
const configBtn = document.getElementById("configBtn");
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

/* CONFIG */
const configMenu = document.getElementById("configMenu");
const skinSelect = document.getElementById("skinSelect");
const colorSelect = document.getElementById("colorSelect");
const exitConfig = document.getElementById("exitConfig");

/* ONLINE */
const room = "salas_online_1";
const playerId = "p_" + Math.floor(Math.random()*99999);
let onlineEnabled = false;
let myRef;
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

/* PLAYER */
const rikcat={
  x:80,y:0,w:32,h:32,
  vx:0,vy:0,onGround:false,
  life:3,attacking:false,
  emotes:[], emote:null,
  skin:"rikcat", color:"#FFB000"
};

/* START */
let playing=false;
function startGame(online){
  onlineEnabled = online;
  titleScreen.style.display="none";
  gameDiv.style.display="block";
  playing=true;

  if(onlineEnabled){
    myRef = ref(db, `rooms/${room}/players/${playerId}`);
    onDisconnect(myRef).remove();

    onValue(ref(db,`rooms/${room}/players`), snap=>{
      Object.keys(onlinePlayers).forEach(k=>delete onlinePlayers[k]);
      if(snap.val()) Object.assign(onlinePlayers,snap.val());
    });
  }
}
soloBtn.onclick=()=>startGame(false);
multiBtn.onclick=()=>startGame(true);

/* CONFIGURAÇÕES */
configBtn.onclick = ()=>{
  titleScreen.style.display="none";
  configMenu.style.display="flex";
  gameDiv.style.display="none";
};
exitConfig.onclick = ()=>{
  configMenu.style.display="none";
  titleScreen.style.display="flex";
  rikcat.skin = skinSelect.value;
  rikcat.color = colorSelect.value;
};

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
if(emoteBtn && emoteMenu){
  emoteBtn.onclick=()=>{
    emoteMenu.style.display = emoteMenu.style.display==="flex"?"none":"flex";
  };

  document.querySelectorAll(".emote").forEach(btn=>{
    btn.onclick=()=>{
      rikcat.emote = btn.textContent;
      rikcat.emotes.push(rikcat.emote);
      if(rikcat.emotes.length>5) rikcat.emotes.shift();
      emoteMenu.style.display="none";
    };
  });
}

/* MAPA */
const platforms=[
  {x:0,y:()=>canvas.height-40,w:3000,h:40},
  {x:200,y:()=>canvas.height-120,w:140,h:20},
  {x:420,y:()=>canvas.height-200,w:140,h:20},
];

/* RIKCAT / POLVO */
function drawRikcat(x,y,scale=1,color="#FFB000",emotes=[],skin="rikcat"){
  ctx.save();
  ctx.translate(x,y);
  ctx.scale(scale,scale);

  if(skin==="rikcat"){
    const outline="#000"; const earInside="#FF2FA3"; const noseColor="#FF2FA3";
    ctx.lineWidth=4;
    // ORELHAS ATRÁS
    ctx.fillStyle=color; ctx.strokeStyle=outline;
    ctx.beginPath(); ctx.moveTo(-18,-2); ctx.lineTo(-40,-28); ctx.lineTo(-8,-22); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle=earInside; ctx.beginPath(); ctx.moveTo(-20,-8); ctx.lineTo(-32,-22); ctx.lineTo(-14,-18); ctx.closePath(); ctx.fill();
    ctx.fillStyle=color; ctx.beginPath(); ctx.moveTo(18,-2); ctx.lineTo(40,-28); ctx.lineTo(8,-22); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle=earInside; ctx.beginPath(); ctx.moveTo(20,-8); ctx.lineTo(32,-22); ctx.lineTo(14,-18); ctx.closePath(); ctx.fill();
    // CABEÇA
    ctx.fillStyle=color; ctx.beginPath(); ctx.arc(0,6,26,0,Math.PI*2); ctx.fill(); ctx.stroke();
    // OLHOS
    ctx.fillStyle="#000"; ctx.fillRect(-8,0,4,14); ctx.fillRect(4,0,4,14);
    // NARIZ
    ctx.fillStyle=noseColor; ctx.beginPath(); ctx.moveTo(0,14); ctx.lineTo(-6,22); ctx.lineTo(6,22); ctx.closePath(); ctx.fill();
    // BOCA
    ctx.beginPath(); ctx.moveTo(0,22); ctx.lineTo(0,28); ctx.quadraticCurveTo(-4,30,-6,28); ctx.moveTo(0,28); ctx.quadraticCurveTo(4,30,6,28); ctx.stroke();
  }else{
    // POLVO
    ctx.font="60px sans-serif";
    ctx.textAlign="center";
    ctx.textBaseline="middle";
    ctx.fillText("🐙",0,0);
  }

  // EMOTES
  emotes.forEach((e,i)=>{
    ctx.font="24px sans-serif";
    ctx.fillText(e,-10 + i*20,-35);
  });

  ctx.restore();
}

/* LOOP */
function update(){
  requestAnimationFrame(update);
  if(!playing) return;

  ctx.clearRect(0,0,canvas.width,canvas.height);

  // Física
  rikcat.vy+=0.6;
  rikcat.x+=rikcat.vx;
  rikcat.y+=rikcat.vy;

  rikcat.onGround=false;
  platforms.forEach(p=>{
    const py=p.y();
    ctx.fillStyle="#8B4513";
    ctx.fillRect(p.x,py,p.w,p.h);
    if(rikcat.x < p.x+p.w &&
       rikcat.x+rikcat.w > p.x &&
       rikcat.y+rikcat.h > py &&
       rikcat.y+rikcat.h < py+p.h &&
       rikcat.vy>0){
         rikcat.y=py-rikcat.h;
         rikcat.vy=0;
         rikcat.onGround=true;
       }
  });

  drawRikcat(rikcat.x,rikcat.y,1,rikcat.color,rikcat.emotes,rikcat.skin);

  if(onlineEnabled && myRef){
    set(myRef,{x:rikcat.x,y:rikcat.y,emotes:rikcat.emotes,skin:rikcat.skin,color:rikcat.color});

    const keys = Object.keys(onlinePlayers);
    keys.forEach((id,i)=>{
      if(id===playerId) return;
      const p=onlinePlayers[id];
      const color = i===2?"#00FF00":"#A020F0"; // 3º jogador verde
      drawRikcat(p.x,p.y,1,p.color,p.emotes,p.skin);
    });
  }
}
update();
