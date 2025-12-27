import { db, ref, set, onValue, onDisconnect } from "./firebase.js";

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

/* TELAS */
const titleScreen = document.getElementById("titleScreen");
const soloBtn = document.getElementById("soloBtn");
const multiBtn = document.getElementById("multiBtn");
const gameDiv = document.getElementById("game");
const rotate = document.getElementById("rotate");

/* BOTÕES */
const left   = document.getElementById("left");
const right  = document.getElementById("right");
const jump   = document.getElementById("jump");
const attack = document.getElementById("attack");
const emoteBtn = document.getElementById("emoteBtn");

/* ONLINE */
const room = "oeo2_room";
const playerId = "p_" + Math.floor(Math.random()*99999);
const onlinePlayers = {};
let gameMode = "solo"; // "solo" | "online"

/* PLAYER */
const rikcat = {
  x:80, y:0, w:32, h:32,
  vx:0, vy:0, onGround:false,
  life:3, attacking:false,
  emote:null, emoteTimer:0
};

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
function startGame(){
  titleScreen.style.display="none";
  gameDiv.style.display="block";
}

soloBtn.onclick = ()=>{
  gameMode="solo";
  clearOnlinePlayers();
  startGame();
};

multiBtn.onclick = ()=>{
  gameMode="online";
  startOnline();
  startGame();
};

/* FIREBASE */
const myRef = ref(db, `rooms/${room}/players/${playerId}`);
onDisconnect(myRef).remove();

function startOnline(){
  onValue(ref(db, `rooms/${room}/players`), snap=>{
    const data = snap.val();
    if(data){
      clearOnlinePlayers();
      Object.assign(onlinePlayers, data);
    }
  });
}

function clearOnlinePlayers(){
  Object.keys(onlinePlayers).forEach(k=>delete onlinePlayers[k]);
}

/* CONTROLES */
left.ontouchstart  = ()=>rikcat.vx=-4;
right.ontouchstart = ()=>rikcat.vx=4;
jump.ontouchstart  = ()=>{
  if(rikcat.onGround){
    rikcat.vy=-12;
    rikcat.onGround=false;
  }
};
attack.ontouchstart= ()=>rikcat.attacking=true;

[left,right,jump,attack].forEach(b=>{
  b.ontouchend=()=>{
    rikcat.vx=0;
    rikcat.attacking=false;
  };
});

/* EMOTES */
const emotes = ["😺","❤️","🔥","😂"];
let emoteIndex = 0;

emoteBtn.onclick = ()=>{
  rikcat.emote = emotes[emoteIndex];
  rikcat.emoteTimer = 180;
  emoteIndex = (emoteIndex+1)%emotes.length;
};

/* MAPA */
const platforms = [
  {x:0,y:()=>canvas.height-40,w:3000,h:40},
  {x:200,y:()=>canvas.height-120,w:140,h:20},
  {x:420,y:()=>canvas.height-200,w:140,h:20},
  {x:650,y:()=>canvas.height-260,w:140,h:20},
];

/* RIKCAT (DESENHO DEFINITIVO) */
function drawRikcat(x,y,scale=1,color="#FFB000"){
  ctx.save();
  ctx.translate(x,y);
  ctx.scale(scale,scale);

  const outline="#000", earInside="#FF2FA3";

  ctx.lineWidth=4;

  // ORELHAS ATRÁS
  ctx.fillStyle=color;
  ctx.strokeStyle=outline;

  ctx.beginPath();
  ctx.moveTo(-18,-2);ctx.lineTo(-40,-28);ctx.lineTo(-8,-22);
  ctx.closePath();ctx.fill();ctx.stroke();

  ctx.fillStyle=earInside;
  ctx.beginPath();
  ctx.moveTo(-20,-8);ctx.lineTo(-32,-22);ctx.lineTo(-14,-18);
  ctx.closePath();ctx.fill();

  ctx.fillStyle=color;
  ctx.beginPath();
  ctx.moveTo(18,-2);ctx.lineTo(40,-28);ctx.lineTo(8,-22);
  ctx.closePath();ctx.fill();ctx.stroke();

  ctx.fillStyle=earInside;
  ctx.beginPath();
  ctx.moveTo(20,-8);ctx.lineTo(32,-22);ctx.lineTo(14,-18);
  ctx.closePath();ctx.fill();

  // CABEÇA
  ctx.fillStyle=color;
  ctx.strokeStyle=outline;
  ctx.beginPath();
  ctx.arc(0,6,26,0,Math.PI*2);
  ctx.fill();ctx.stroke();

  // OLHOS
  ctx.fillStyle="#000";
  ctx.fillRect(-8,0,4,14);
  ctx.fillRect(4,0,4,14);

  // BOCA
  ctx.beginPath();
  ctx.moveTo(0,22);ctx.lineTo(0,28);
  ctx.quadraticCurveTo(-4,30,-6,28);
  ctx.moveTo(0,28);
  ctx.quadraticCurveTo(4,30,6,28);
  ctx.stroke();

  ctx.restore();
}

/* LOOP */
function update(){
  requestAnimationFrame(update);
  ctx.clearRect(0,0,canvas.width,canvas.height);

  rikcat.vy+=0.6;
  rikcat.x+=rikcat.vx;
  rikcat.y+=rikcat.vy;
  rikcat.onGround=false;

  platforms.forEach(p=>{
    const py=p.y();
    ctx.fillStyle="#8B4513";
    ctx.fillRect(p.x,py,p.w,p.h);
    if(rikcat.x<p.x+p.w && rikcat.x+rikcat.w>p.x &&
       rikcat.y+rikcat.h>py && rikcat.y+rikcat.h<py+p.h){
      rikcat.y=py-rikcat.h;
      rikcat.vy=0;
      rikcat.onGround=true;
    }
  });

  drawRikcat(rikcat.x,rikcat.y);

  if(rikcat.emoteTimer>0){
    ctx.font="32px serif";
    ctx.fillText(rikcat.emote,rikcat.x,rikcat.y-20);
    rikcat.emoteTimer--;
  }

  if(gameMode==="online"){
    set(myRef,{
      x:rikcat.x,y:rikcat.y,
      emote:rikcat.emote,emoteTimer:rikcat.emoteTimer
    });

    for(const id in onlinePlayers){
      if(id===playerId) continue;
      const p=onlinePlayers[id];
      drawRikcat(p.x,p.y,1,"purple");
      if(p.emoteTimer>0){
        ctx.font="32px serif";
        ctx.fillText(p.emote,p.x,p.y-20);
      }
    }
  }
}
update();
