import { db, ref, set, onValue, onDisconnect } from "./firebase.js";

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const titleScreen = document.getElementById("titleScreen");
const soloBtn = document.getElementById("soloBtn");
const multiBtn = document.getElementById("multiBtn");
const configBtn = document.getElementById("configBtn");
const configMenu = document.getElementById("configMenu");
const configBackBtn = document.getElementById("configBackBtn");
const skinSelect = document.getElementById("skinSelect");
const colorPicker = document.getElementById("colorPicker");

const gameDiv = document.getElementById("game");
const rotate = document.getElementById("rotate");

/* CONTROLES */
const left  = document.getElementById("left");
const right = document.getElementById("right");
const up    = document.getElementById("up");
const down  = document.getElementById("down");
const attack= document.getElementById("attack");

/* EMOTES */
const emoteBtn = document.getElementById("emoteBtn");
const emoteMenu = document.getElementById("emoteMenu");

/* ONLINE */
const room = "salas_online";
const playerId = "p_" + Math.floor(Math.random()*99999);
let onlineEnabled = false;
const onlinePlayers = {};

/* RESIZE */
function resize(){ canvas.width=innerWidth; canvas.height=innerHeight; }
addEventListener("resize", resize); resize();

/* ORIENTAÇÃO */
function checkOrientation(){ rotate.style.display = innerHeight>innerWidth?"flex":"none"; }
addEventListener("resize", checkOrientation); checkOrientation();

/* START */
let playing=false;
function startGame(online){
  onlineEnabled = online;
  titleScreen.style.display="none";
  configMenu.style.display="none";
  gameDiv.style.display="block";
  playing=true;
}
soloBtn.onclick=()=>startGame(false);
multiBtn.onclick=()=>startGame(true);

/* CONFIGURAÇÕES */
configBtn.onclick = () => {
  titleScreen.style.display="none";
  configMenu.style.display="flex";
};
configBackBtn.onclick = () => {
  configMenu.style.display="none";
  titleScreen.style.display="flex";
};

/* PLAYER */
const player = {
  x:80, y:0, w:32, h:32,
  vx:0, vy:0, onGround:false,
  life:3, attacking:false, emotes:[], skin:"rikcat", color:"#FFB000"
};

/* FIREBASE */
const myRef = ref(db, `rooms/${room}/players/${playerId}`);
onDisconnect(myRef).remove();
onValue(ref(db,`rooms/${room}/players`), snap=>{
  Object.keys(onlinePlayers).forEach(k=>delete onlinePlayers[k]);
  if(snap.val()) Object.assign(onlinePlayers,snap.val());
});

/* CONTROLES */
left.ontouchstart=()=>player.vx=-4;
right.ontouchstart=()=>player.vx=4;
up.ontouchstart=()=>player.vy=-4;
down.ontouchstart=()=>player.vy=4;
attack.ontouchstart=()=>player.attacking=true;
[left,right,up,down,attack].forEach(b=>b.ontouchend=()=>{
  player.vx=0; player.vy=0; player.attacking=false;
});

/* EMOTES */
if(emoteBtn && emoteMenu){
  emoteBtn.onclick=()=>{ emoteMenu.style.display = emoteMenu.style.display==="flex"?"none":"flex"; };
  document.querySelectorAll(".emote").forEach(btn=>{
    btn.onclick=()=>{
      if(player.emotes.length>=5) player.emotes.shift();
      player.emotes.push(btn.textContent);
      emoteMenu.style.display="none";
    };
  });
}

/* MAPA */
let platforms=[
  {x:0,y:()=>canvas.height-40,w:3000,h:40},
  {x:200,y:()=>canvas.height-120,w:140,h:20},
  {x:420,y:()=>canvas.height-200,w:140,h:20},
];
let pipes=[
  {x:700,y:()=>canvas.height-60,w:40,h:60,target:"waterLevel"},
  {x:50,y:()=>canvas.height-60,w:40,h:60,target:"startLevel"}
];

/* RENDER */
function drawPlayer(x,y,scale=1,skin="rikcat",color="#FFB000",emotes=[]){
  ctx.save(); ctx.translate(x,y); ctx.scale(scale,scale);
  if(skin==="rikcat"){
    // Rikcat
    ctx.fillStyle=color; ctx.strokeStyle="#000"; ctx.lineWidth=4;
    // Cabeça
    ctx.beginPath(); ctx.arc(0,6,26,0,Math.PI*2); ctx.fill(); ctx.stroke();
    // Olhos
    ctx.fillStyle="#000"; ctx.fillRect(-8,0,4,14); ctx.fillRect(4,0,4,14);
    // Nariz
    ctx.fillStyle="#FF2FA3"; ctx.beginPath(); ctx.moveTo(0,14); ctx.lineTo(-6,22); ctx.lineTo(6,22); ctx.closePath(); ctx.fill();
    // Boca
    ctx.beginPath(); ctx.moveTo(0,22); ctx.lineTo(0,28);
    ctx.quadraticCurveTo(-4,30,-6,28); ctx.moveTo(0,28); ctx.quadraticCurveTo(4,30,6,28); ctx.stroke();
  } else if(skin==="octopus"){
    ctx.font="48px sans-serif"; ctx.fillText("🐙",-24,-12);
  }
  // Emotes
  emotes.forEach((e,i)=> ctx.fillText(e,-10+i*20,-35));
  ctx.restore();
}

/* LOOP */
function update(){
  requestAnimationFrame(update);
  if(!playing) return;

  ctx.clearRect(0,0,canvas.width,canvas.height);

  // Física
  player.vy+=0.6;
  player.x+=player.vx;
  player.y+=player.vy;
  player.onGround=false;

  // Plataformas
  platforms.forEach(p=>{
    const py=p.y();
    ctx.fillStyle="#8B4513"; ctx.fillRect(p.x,py,p.w,p.h);
    if(player.x<p.x+p.w && player.x+player.w>p.x && player.y+player.h>py && player.y+player.h<py+p.h && player.vy>0){
      player.y=py-player.h; player.vy=0; player.onGround=true;
    }
  });

  // Pipes
  pipes.forEach(p=>{
    const py=p.y();
    ctx.fillStyle="#0000FF"; ctx.fillRect(p.x,py,p.w,p.h);
    if(player.attacking && player.x+player.w>p.x && player.x<p.x+p.w && player.y+player.h>py && player.y<py+p.h){
      if(p.target==="waterLevel") startWaterLevel();
      else if(p.target==="startLevel") restartLevel();
    }
  });

  drawPlayer(player.x,player.y,1,player.skin,player.color,player.emotes);

  // Online
  if(onlineEnabled){
    set(myRef,{x:player.x,y:player.y,emotes:player.emotes,skin:player.skin,color:player.color});
    for(const id in onlinePlayers){
      if(id===playerId) continue;
      const p=onlinePlayers[id];
      drawPlayer(p.x,p.y,1,p.skin,p.color,p.emotes);
    }
  }
}

function startWaterLevel(){
  platforms.length=0;
  platforms.push({x:0,y:()=>canvas.height-40,w:3000,h:40});
  platforms.push({x:100,y:()=>canvas.height-100,w:140,h:20});
  platforms.push({x:300,y:()=>canvas.height-180,w:140,h:20});
}

function restartLevel(){
  platforms.length=0;
  platforms.push({x:0,y:()=>canvas.height-40,w:3000,h:40});
  platforms.push({x:200,y:()=>canvas.height-120,w:140,h:20});
  platforms.push({x:420,y:()=>canvas.height-200,w:140,h:20});
  platforms.push({x:650,y:()=>canvas.height-260,w:140,h:20});
}

update();
