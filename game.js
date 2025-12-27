import { db, ref, set, onValue, onDisconnect } from "./firebase.js";

/* ==================== CANVAS E CONTROLES ==================== */
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const titleScreen = document.getElementById("titleScreen");
const soloBtn = document.getElementById("soloBtn");
const multiBtn = document.getElementById("multiBtn");
const configBtn = document.getElementById("configBtn");
const gameDiv = document.getElementById("game");
const rotate = document.getElementById("rotate");

/* BOTÕES DE CONTROLE */
const left  = document.getElementById("left");
const right = document.getElementById("right");
const up    = document.getElementById("jump");
const down  = document.getElementById("down");
const attack= document.getElementById("attack");

/* EMOTES */
const emoteBtn = document.getElementById("emoteBtn");
const emoteMenu = document.getElementById("emoteMenu");

/* CONFIGURAÇÕES */
let selectedSkin = "rikcat"; // ou "polvo"
let selectedColor = "#FFB000";

/* ==================== ONLINE ==================== */
const room = "salas_online_1";
const playerId = "p_" + Math.floor(Math.random()*99999);
let onlineEnabled = false;
const onlinePlayers = {};

/* ==================== RESIZE ==================== */
function resize(){
  canvas.width = innerWidth;
  canvas.height = innerHeight;
}
addEventListener("resize", resize);
resize();

/* ==================== ORIENTAÇÃO ==================== */
function checkOrientation(){
  rotate.style.display = innerHeight > innerWidth ? "flex" : "none";
}
addEventListener("resize", checkOrientation);
checkOrientation();

/* ==================== INICIALIZAÇÃO ==================== */
let playing=false;
function startGame(online){
  onlineEnabled = online;
  titleScreen.style.display="none";
  gameDiv.style.display="block";
  playing=true;

  if(onlineEnabled){
    const myRef = ref(db, `rooms/${room}/players/${playerId}`);
    onDisconnect(myRef).remove();

    onValue(ref(db, `rooms/${room}/players`), snap=>{
      Object.keys(onlinePlayers).forEach(k=>delete onlinePlayers[k]);
      if(snap.val()) Object.assign(onlinePlayers, snap.val());
    });
  }
}

soloBtn.onclick=()=>startGame(false);
multiBtn.onclick=()=>startGame(true);

/* ==================== PLAYER ==================== */
const rikcat={
  x:80, y:0, w:32, h:32,
  vx:0, vy:0, onGround:false,
  life:3, attacking:false, emote:null,
  skin:selectedSkin, color:selectedColor
};

/* ==================== MAPA ==================== */
const platforms=[
  {x:0, y:()=>canvas.height-40, w:3000, h:40},
  {x:200, y:()=>canvas.height-120, w:140, h:20},
  {x:420, y:()=>canvas.height-200, w:140, h:20},
  {x:650, y:()=>canvas.height-260, w:140, h:20},
];

/* Cano para fase aquática */
const pipeEntrance = {x:900, y:canvas.height-80, w:40, h:40};
const pipeExit = {x:0, y:canvas.height-40, w:40, h:40};

/* ==================== CONTROLES ==================== */
left.ontouchstart=()=>rikcat.vx=-4;
right.ontouchstart=()=>rikcat.vx=4;
up.ontouchstart=()=>{
  if(rikcat.onGround){
    rikcat.vy=-12;
    rikcat.onGround=false;
  }
};
down.ontouchstart=()=>{ /* futuro: aquático */ };
attack.ontouchstart=()=>rikcat.attacking=true;

[left,right,up,down,attack].forEach(b=>b.ontouchend=()=>{
  rikcat.vx=0;
  rikcat.vy=rikcat.vy; // mantém vertical
  rikcat.attacking=false;
});

/* ==================== EMOTES ==================== */
if(emoteBtn && emoteMenu){
  emoteBtn.onclick=()=>{
    emoteMenu.style.display = emoteMenu.style.display==="flex"?"none":"flex";
  };
  document.querySelectorAll(".emote").forEach(btn=>{
    btn.onclick=()=>{
      rikcat.emote = btn.textContent;
      emoteMenu.style.display="none";
    };
  });
}

/* ==================== DESENHO DO PERSONAGEM ==================== */
function drawCharacter(player){
  ctx.save();
  ctx.translate(player.x, player.y);
  ctx.scale(1,1);

  const outline="#000";
  const earInside="#FF2FA3";
  const noseColor="#FF2FA3";
  const color = player.color;

  if(player.skin==="rikcat"){
    // ORELHAS
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

    // CABEÇA
    ctx.fillStyle=color;
    ctx.beginPath();
    ctx.arc(0,6,26,0,Math.PI*2);
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
    ctx.font="48px serif";
    ctx.fillText("🐙",-12,-4);
  }

  // EMOTE
  if(player.emote){
    ctx.font="24px sans-serif";
    ctx.fillText(player.emote,-10,-35);
  }

  ctx.restore();
}

/* ==================== LOOP PRINCIPAL ==================== */
let cameraX=0, cameraY=0;

function update(){
  requestAnimationFrame(update);
  if(!playing) return;

  // física
  rikcat.vy += 0.6; // gravidade
  rikcat.x += rikcat.vx;
  rikcat.y += rikcat.vy;

  rikcat.onGround = false;

  // colisões com plataformas
  platforms.forEach(p=>{
    const py = p.y();
    if(rikcat.x + rikcat.w > p.x && rikcat.x < p.x + p.w){
      // colisão descendo
      if(rikcat.vy>0 && rikcat.y + rikcat.h > py && rikcat.y + rikcat.h < py + p.h){
        rikcat.y = py - rikcat.h;
        rikcat.vy = 0;
        rikcat.onGround = true;
      }
      // colisão subindo
      if(rikcat.vy<0 && rikcat.y < py + p.h && rikcat.y > py){
        rikcat.y = py + p.h;
        rikcat.vy = 0;
      }
    }
  });

  // colisão com teto
  if(rikcat.y < 0){ rikcat.y=0; rikcat.vy=0; }

  // colisão com cano para fase aquática
  if(rikcat.x + rikcat.w > pipeEntrance.x && rikcat.x < pipeEntrance.x + pipeEntrance.w &&
     rikcat.y + rikcat.h > pipeEntrance.y && rikcat.y < pipeEntrance.y + pipeEntrance.h){
       // só ativa se atacando
       if(rikcat.attacking){
         rikcat.x = pipeExit.x;
         rikcat.y = pipeExit.y - rikcat.h;
         rikcat.vx = 0;
         rikcat.vy = 0;
       }
  }

  // CÂMERA
  cameraX = rikcat.x - canvas.width/2 + rikcat.w/2;
  cameraY = rikcat.y - canvas.height/2 + rikcat.h/2;

  ctx.setTransform(1,0,0,1,0,0); // reset
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.translate(-cameraX,-cameraY);

  // fundo
  ctx.fillStyle = "#6aa5ff";
  ctx.fillRect(cameraX, cameraY, canvas.width, canvas.height);

  // plataformas
  ctx.fillStyle = "#8B4513";
  platforms.forEach(p=>{
    const py = p.y();
    ctx.fillRect(p.x, py, p.w, p.h);
  });

  // cano
  ctx.fillStyle="blue";
  ctx.fillRect(pipeEntrance.x,pipeEntrance.y,pipeEntrance.w,pipeEntrance.h);

  // desenhar player
  drawCharacter(rikcat);

  // multiplayer
  if(onlineEnabled){
    const myRef = ref(db, `rooms/${room}/players/${playerId}`);
    set(myRef,{
      x:rikcat.x,
      y:rikcat.y,
      vx:rikcat.vx,
      vy:rikcat.vy,
      emote:rikcat.emote,
      skin:rikcat.skin,
      color:rikcat.color
    });

    for(const id in onlinePlayers){
      if(id===playerId) continue;
      drawCharacter(onlinePlayers[id]);
    }
  }
}

update();
