import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, set, onValue } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

/* FIREBASE */
const firebaseConfig = {
  apiKey: "AIzaSyDCGDk08XGGYOTYnXchuDDrBS0emCm87P0",
  authDomain: "rikcatonline.firebaseapp.com",
  databaseURL: "https://rikcatonline-default-rtdb.firebaseio.com",
  projectId: "rikcatonline",
  storageBucket: "rikcatonline.appspot.com",
  messagingSenderId: "504285237002",
  appId: "1:504285237002:web:9841ceb83ea0fe919674f3"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

/* CANVAS */
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

/* UI */
const titleScreen = document.getElementById("titleScreen");
const gameDiv = document.getElementById("game");
const soloBtn = document.getElementById("soloBtn");
const multiBtn = document.getElementById("multiBtn");
const emoteBtn = document.getElementById("emoteBtn");

/* BOTÕES */
const left = document.getElementById("left");
const right = document.getElementById("right");
const jump = document.getElementById("jump");

const left2 = document.getElementById("left2");
const right2 = document.getElementById("right2");
const jump2 = document.getElementById("jump2");

let multiplayer = false;

/* RESIZE */
function resize(){
  canvas.width = innerWidth;
  canvas.height = innerHeight;
}
addEventListener("resize", resize);
resize();

/* PLAYERS */
const players = [
  {
    name:"Rikcat",
    color:"orange",
    x:80,y:0,w:32,h:32,
    vx:0,vy:0,onGround:false,
    emote:null, emoteTime:0,
    controls:{left:false,right:false,jump:false}
  },
  {
    name:"EduKat",
    color:"purple",
    x:140,y:0,w:32,h:32,
    vx:0,vy:0,onGround:false,
    emote:null, emoteTime:0,
    controls:{left:false,right:false,jump:false}
  }
];

/* CONTROLES */
left.ontouchstart=()=>players[0].controls.left=true;
left.ontouchend=()=>players[0].controls.left=false;
right.ontouchstart=()=>players[0].controls.right=true;
right.ontouchend=()=>players[0].controls.right=false;
jump.ontouchstart=()=>players[0].controls.jump=true;
jump.ontouchend=()=>players[0].controls.jump=false;

left2.ontouchstart=()=>players[1].controls.left=true;
left2.ontouchend=()=>players[1].controls.left=false;
right2.ontouchstart=()=>players[1].controls.right=true;
right2.ontouchend=()=>players[1].controls.right=false;
jump2.ontouchstart=()=>players[1].controls.jump=true;
jump2.ontouchend=()=>players[1].controls.jump=false;

/* EMOTES */
const emotes = ["😺","🔥","❤","😂","😮"];
let emoteIndex = 0;
emoteBtn.onclick = ()=>{
  const p = players[0];
  p.emote = emotes[emoteIndex++ % emotes.length];
  p.emoteTime = Date.now() + 2000;
};

/* MAPA */
const platforms = [
  {x:0,y:()=>canvas.height-40,w:3000,h:40}
];

/* DRAW RIKCAT DEFINITIVO */
function drawRikcat(p){
  ctx.fillStyle=p.color;

  // orelhas atrás
  ctx.beginPath();
  ctx.arc(p.x+6,p.y+4,6,0,Math.PI*2);
  ctx.arc(p.x+p.w-6,p.y+4,6,0,Math.PI*2);
  ctx.fill();

  // corpo
  ctx.beginPath();
  ctx.arc(p.x+p.w/2,p.y+p.h/2,p.w/2,0,Math.PI*2);
  ctx.fill();

  // olhos
  ctx.fillStyle="black";
  ctx.beginPath();
  ctx.arc(p.x+10,p.y+14,2,0,Math.PI*2);
  ctx.arc(p.x+22,p.y+14,2,0,Math.PI*2);
  ctx.fill();

  // nariz
  ctx.beginPath();
  ctx.arc(p.x+p.w/2,p.y+18,2,0,Math.PI*2);
  ctx.fill();

  // boca
  ctx.beginPath();
  ctx.arc(p.x+p.w/2-3,p.y+21,3,0,Math.PI);
  ctx.arc(p.x+p.w/2+3,p.y+21,3,0,Math.PI);
  ctx.stroke();
}

/* ONLINE RECEIVE */
onValue(ref(db,"players"),snap=>{
  const d=snap.val();
  if(!d) return;
  players.forEach(p=>{
    if(d[p.name]){
      p.x=d[p.name].x;
      p.y=d[p.name].y;
      p.emote=d[p.name].emote;
    }
  });
});

/* START */
function startGame(isMulti){
  multiplayer=isMulti;
  titleScreen.style.display="none";
  gameDiv.style.display="block";

  left2.style.display =
  right2.style.display =
  jump2.style.display = multiplayer?"block":"none";
}
soloBtn.onclick=()=>startGame(false);
multiBtn.onclick=()=>startGame(true);

/* LOOP */
function update(){
  requestAnimationFrame(update);
  ctx.clearRect(0,0,canvas.width,canvas.height);

  platforms.forEach(p=>{
    ctx.fillStyle="#8B4513";
    ctx.fillRect(p.x,p.y(),p.w,p.h);
  });

  players.forEach((p,i)=>{
    if(i===1 && !multiplayer) return;

    p.vx=0;
    if(p.controls.left)p.vx=-4;
    if(p.controls.right)p.vx=4;

    if(p.controls.jump && p.onGround){
      p.vy=-12;p.onGround=false;
    }

    p.vy+=0.6;
    p.x+=p.vx;
    p.y+=p.vy;

    p.onGround=false;
    platforms.forEach(pl=>{
      const py=pl.y();
      if(p.x<p.l+pl.w && p.x+p.w>pl.x &&
         p.y<py+pl.h && p.y+p.h>py && p.vy>0){
        p.y=py-p.h;p.vy=0;p.onGround=true;
      }
    });

    drawRikcat(p);

    if(p.emote && p.emoteTime>Date.now()){
      ctx.font="24px sans-serif";
      ctx.textAlign="center";
      ctx.fillText(p.emote,p.x+p.w/2,p.y-10);
    }

    if(multiplayer){
      set(ref(db,"players/"+p.name),{
        x:p.x,y:p.y,emote:p.emote
      });
    }
  });
}
update();
