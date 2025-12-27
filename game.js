import { db, ref, set, onValue, onDisconnect } from "./firebase.js";

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

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
const room = "online_salas_1";
const playerId = "p_" + Math.floor(Math.random()*99999);
let onlineEnabled = false;
const onlinePlayers = {};

/* CAMERA */
let cameraX = 0;

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
  emotes:[],
  skin:"rikcat",
  color:"#FFB000"
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
if(emoteBtn && emoteMenu){
  emoteBtn.onclick=()=>{
    emoteMenu.style.display =
      emoteMenu.style.display==="flex"?"none":"flex";
  };

  document.querySelectorAll(".emote").forEach(btn=>{
    btn.onclick=()=>{
      rikcat.emotes.push({text: btn.textContent, timer:120});
      emoteMenu.style.display="none";
    };
  });
}

/* MAPA */
const platforms=[
  {x:0,y:()=>canvas.height-40,w:5000,h:40},
  {x:200,y:()=>canvas.height-120,w:140,h:20},
  {x:420,y:()=>canvas.height-200,w:140,h:20},
  {x:650,y:()=>canvas.height-260,w:140,h:20},
  {x:900,y:()=>canvas.height-180,w:200,h:20},
  {x:1200,y:()=>canvas.height-120,w:300,h:20}
];

/* INIMIGOS */
const enemies = [
  {x:300,y:canvas.height-60,w:32,h:32,vx:2},
  {x:800,y:canvas.height-280,w:32,h:32,vx:-1.5}
];

/* RIKCAT & POLVO */
function drawPlayer(player){
  ctx.save();
  ctx.translate(player.x - cameraX, player.y);
  ctx.scale(1,1);

  // Skin
  if(player.skin==="rikcat"){
    const outline="#000";
    const earInside="#FF2FA3";
    const noseColor="#FF2FA3";
    ctx.lineWidth=4;

    // ORELHAS
    ctx.fillStyle=player.color; ctx.strokeStyle=outline;
    ctx.beginPath();
    ctx.moveTo(-18,-2); ctx.lineTo(-40,-28); ctx.lineTo(-8,-22);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle=earInside;
    ctx.beginPath();
    ctx.moveTo(-20,-8); ctx.lineTo(-32,-22); ctx.lineTo(-14,-18);
    ctx.closePath(); ctx.fill();

    ctx.fillStyle=player.color;
    ctx.beginPath();
    ctx.moveTo(18,-2); ctx.lineTo(40,-28); ctx.lineTo(8,-22);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle=earInside;
    ctx.beginPath();
    ctx.moveTo(20,-8); ctx.lineTo(32,-22); ctx.lineTo(14,-18);
    ctx.closePath(); ctx.fill();

    // CABEÇA
    ctx.fillStyle=player.color;
    ctx.beginPath(); ctx.arc(0,6,26,0,Math.PI*2);
    ctx.fill(); ctx.stroke();

    // OLHOS
    ctx.fillStyle="#000";
    ctx.fillRect(-8,0,4,14);
    ctx.fillRect(4,0,4,14);

    // NARIZ
    ctx.fillStyle=noseColor;
    ctx.beginPath();
    ctx.moveTo(0,14); ctx.lineTo(-6,22); ctx.lineTo(6,22);
    ctx.closePath(); ctx.fill();

    // BOCA
    ctx.beginPath();
    ctx.moveTo(0,22); ctx.lineTo(0,28);
    ctx.quadraticCurveTo(-4,30,-6,28);
    ctx.moveTo(0,28);
    ctx.quadraticCurveTo(4,30,6,28);
    ctx.stroke();
  } else if(player.skin==="polvo"){
    ctx.font="50px serif";
    ctx.fillText("🐙", -25, 0);
  }

  // EMOTES
  player.emotes.forEach((e, i)=>{
    ctx.font="24px sans-serif";
    ctx.fillText(e.text, (i>5 ? (i-5)*30 : 0) - 10, -35);
    e.timer--;
  });
  player.emotes = player.emotes.filter(e=>e.timer>0);

  ctx.restore();
}

/* LOOP */
function update(){
  requestAnimationFrame(update);
  if(!playing) return;

  ctx.clearRect(0,0,canvas.width,canvas.height);

  // CAMERA
  cameraX = rikcat.x - canvas.width/2;
  if(cameraX<0) cameraX=0;

  // FÍSICA
  rikcat.vy+=0.6;
  rikcat.x+=rikcat.vx;
  rikcat.y+=rikcat.vy;
  rikcat.onGround=false;

  // PLATAFORMAS
  platforms.forEach(p=>{
    const py=p.y();
    ctx.fillStyle="#8B4513";
    ctx.fillRect(p.x - cameraX, py, p.w, p.h);

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

  // INIMIGOS
  enemies.forEach(e=>{
    e.x += e.vx;
    if(e.x<0 || e.x>5000) e.vx*=-1; // limites
    ctx.fillStyle="red";
    ctx.fillRect(e.x-cameraX, e.y, e.w, e.h);
  });

  // PLAYER PRINCIPAL
  drawPlayer(rikcat);

  // ONLINE
  if(onlineEnabled){
    set(myRef,{
      x:rikcat.x,
      y:rikcat.y,
      skin: rikcat.skin,
      color: rikcat.color,
      emotes: rikcat.emotes
    });

    for(const id in onlinePlayers){
      if(id===playerId) continue;
      drawPlayer(onlinePlayers[id]);
    }
  }
}
update();
