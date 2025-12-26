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
const attack = document.getElementById("attack");

const left2  = document.getElementById("left2");
const right2 = document.getElementById("right2");
const jump2  = document.getElementById("jump2");
const attack2 = document.getElementById("attack2");

let playing=false;
let multiplayer=false;

/* ONLINE */
const room="online_des_1";
const playerId="p_"+Math.floor(Math.random()*99999);
const onlinePlayers={};

/* RESIZE */
function resize(){
  canvas.width=innerWidth;
  canvas.height=innerHeight;
}
addEventListener("resize",resize);
resize();

/* ORIENTAÇÃO */
function checkOrientation(){
  const portrait=innerHeight>innerWidth;
  rotate.style.display=portrait?"flex":"none";
  playing=!portrait;
}
addEventListener("resize",checkOrientation);
checkOrientation();

/* START */
function startGame(isMulti){
  multiplayer=isMulti;
  titleScreen.style.display="none";
  gameDiv.style.display="block";
}
soloBtn.onclick=()=>startGame(false);
multiBtn.onclick=()=>startGame(true);

/* PLAYER LOCAL */
const rikcat={
  x:80,y:0,w:32,h:32,
  vx:0,vy:0,onGround:false,
  life:3,dir:"right",attacking:false
};

/* FIREBASE */
const myRef=ref(db,`rooms/${room}/players/${playerId}`);
onDisconnect(myRef).remove();

onValue(ref(db,`rooms/${room}/players`),snap=>{
  const data=snap.val();
  if(data) Object.assign(onlinePlayers,data);
});

/* CONTROLES */
left.ontouchstart=()=>rikcat.vx=-4;
right.ontouchstart=()=>rikcat.vx=4;
jump.ontouchstart=()=>{
  if(rikcat.onGround){rikcat.vy=-12;rikcat.onGround=false;}
};
attack.ontouchstart=()=>rikcat.attacking=true;
[left,right,jump,attack].forEach(b=>b.ontouchend=()=>{
  rikcat.vx=0;rikcat.attacking=false;
});

/* MAPA */
const platforms=[
 {x:0,y:()=>canvas.height-40,w:3000,h:40},
 {x:200,y:()=>canvas.height-120,w:140,h:20},
 {x:420,y:()=>canvas.height-200,w:140,h:20},
];

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
      rikcat.x< p.x+p.w &&
      rikcat.x+rikcat.w>p.x &&
      rikcat.y+rikcat.h>py &&
      rikcat.y+rikcat.h<py+p.h &&
      rikcat.vy>0
    ){
      rikcat.y=py-rikcat.h;
      rikcat.vy=0;
      rikcat.onGround=true;
    }
  });

  /* DESENHA RIKCAT */
  ctx.fillStyle="orange";
  ctx.fillRect(rikcat.x,rikcat.y,rikcat.w,rikcat.h);

  if(rikcat.attacking){
    ctx.fillStyle="yellow";
    ctx.fillRect(rikcat.x+32,rikcat.y+12,20,8);
  }

  ctx.fillStyle="red";
  ctx.fillRect(rikcat.x,rikcat.y-6,rikcat.life*10,4);

  /* ENVIA ONLINE */
  set(myRef,{
    x:rikcat.x,
    y:rikcat.y,
    life:rikcat.life,
    attacking:rikcat.attacking,
    name:"Rikcat"
  });

  /* OUTROS PLAYERS */
  for(const id in onlinePlayers){
    if(id===playerId) continue;
    const p=onlinePlayers[id];
    ctx.fillStyle="purple";
    ctx.fillRect(p.x,p.y,32,32);
    if(p.attacking){
      ctx.fillStyle="yellow";
      ctx.fillRect(p.x+32,p.y+12,20,8);
    }
  }
}
update();
