import { db, ref, set, onValue, onDisconnect } from "./firebase.js";

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const titleScreen = document.getElementById("titleScreen");
const soloBtn = document.getElementById("soloBtn");
const multiBtn = document.getElementById("multiBtn");
const gameDiv = document.getElementById("game");
const rotate = document.getElementById("rotate");
const configBtn = document.getElementById("configBtn");

/* CONTROLES */
const left  = document.getElementById("left");
const right = document.getElementById("right");
const up    = document.getElementById("jump");
const down  = document.getElementById("down");
const attack= document.getElementById("attack");

/* EMOTES */
const emoteBtn = document.getElementById("emoteBtn");
const emoteMenu = document.getElementById("emoteMenu");

/* JOGO ONLINE */
const room = "online_salas_1";
const playerId = "p_" + Math.floor(Math.random() * 99999);
let onlineEnabled = false;
const onlinePlayers = {};

/* CONFIGURAÇÃO INICIAL */
let playerSkin = "rikcat"; // rikcat ou polvo
let playerColor = "#FFB000"; // cor padrão

/* GRAVIDADE */
const GRAVITY = 0.6;
const TERMINAL_V = 12;

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
let playing = false;
function startGame(online){
  onlineEnabled = online;
  titleScreen.style.display = "none";
  gameDiv.style.display = "block";
  playing = true;
}
soloBtn.onclick = () => startGame(false);
multiBtn.onclick = () => startGame(true);

/* PLAYER */
const rikcat = {
  x: 80, y: 0, w: 32, h: 32,
  vx: 0, vy: 0, onGround: false,
  life: 3, attacking: false,
  emote: null,
  skin: playerSkin,
  color: playerColor
};

/* FIREBASE */
const myRef = ref(db, `rooms/${room}/players/${playerId}`);
onDisconnect(myRef).remove();

onValue(ref(db,`rooms/${room}/players`), snap => {
  Object.keys(onlinePlayers).forEach(k => delete onlinePlayers[k]);
  if(snap.val()) Object.assign(onlinePlayers, snap.val());
});

/* CONTROLES */
left.ontouchstart  = () => rikcat.vx = -4;
right.ontouchstart = () => rikcat.vx = 4;
up.ontouchstart    = () => { if(rikcat.onGround) { rikcat.vy=-12; rikcat.onGround=false; } };
down.ontouchstart  = () => {}; // se quiser, pode usar para mergulho
attack.ontouchstart = () => rikcat.attacking = true;

[left,right,up,down,attack].forEach(b => b.ontouchend = () => {
  rikcat.vx = 0;
  rikcat.attacking = false;
});

/* EMOTES */
if(emoteBtn && emoteMenu){
  emoteBtn.onclick = () => {
    emoteMenu.style.display = emoteMenu.style.display === "flex" ? "none" : "flex";
  };
  document.querySelectorAll(".emote").forEach(btn => {
    btn.onclick = () => {
      rikcat.emote = btn.textContent;
      emoteMenu.style.display = "none";
    };
  });
}

/* MAPA */
const platforms = [
  {x:0, y:()=>canvas.height-40, w:3000, h:40},
  {x:200, y:()=>canvas.height-120, w:140, h:20},
  {x:420, y:()=>canvas.height-200, w:140, h:20},
  {x:650, y:()=>canvas.height-260, w:140, h:20},
];

/* CANO/Fase aquática */
const pipes = [
  {x:900, y:canvas.height-60, w:40, h:60, target:"water"}
];
let inWater = false;

/* CÂMERA */
let cameraX = 0;
let cameraY = 0;

/* DESENHO DO RIKCAT OU POLVO */
function drawPlayer(player){
  const x = player.x - cameraX;
  const y = player.y - cameraY;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(1,1);

  const outline="#000";
  const earInside="#FF2FA3";
  const noseColor="#FF2FA3";

  if(player.skin === "rikcat"){
    // Orelhas
    ctx.fillStyle=player.color; ctx.strokeStyle=outline;
    ctx.beginPath(); ctx.moveTo(-18,-2); ctx.lineTo(-40,-28); ctx.lineTo(-8,-22);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle=earInside;
    ctx.beginPath(); ctx.moveTo(-20,-8); ctx.lineTo(-32,-22); ctx.lineTo(-14,-18);
    ctx.closePath(); ctx.fill();

    ctx.fillStyle=player.color;
    ctx.beginPath(); ctx.moveTo(18,-2); ctx.lineTo(40,-28); ctx.lineTo(8,-22);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle=earInside;
    ctx.beginPath(); ctx.moveTo(20,-8); ctx.lineTo(32,-22); ctx.lineTo(14,-18);
    ctx.closePath(); ctx.fill();

    // Cabeça
    ctx.fillStyle=player.color;
    ctx.beginPath();
    ctx.arc(0,6,26,0,Math.PI*2);
    ctx.fill(); ctx.stroke();

    // Olhos
    ctx.fillStyle="#000";
    ctx.fillRect(-8,0,4,14);
    ctx.fillRect(4,0,4,14);

    // Nariz
    ctx.fillStyle=noseColor;
    ctx.beginPath();
    ctx.moveTo(0,14); ctx.lineTo(-6,22); ctx.lineTo(6,22);
    ctx.closePath(); ctx.fill();

    // Boca
    ctx.beginPath();
    ctx.moveTo(0,22); ctx.lineTo(0,28);
    ctx.quadraticCurveTo(-4,30,-6,28);
    ctx.moveTo(0,28);
    ctx.quadraticCurveTo(4,30,6,28);
    ctx.stroke();
  } else if(player.skin === "polvo"){
    ctx.font = "60px sans-serif";
    ctx.fillText("🐙",-20,-10);
  }

  // Emote
  if(player.emote){
    ctx.font="24px sans-serif";
    ctx.fillText(player.emote,-10,-35);
  }

  ctx.restore();
}

/* LOOP */
function update(){
  requestAnimationFrame(update);
  if(!playing) return;

  // Física
  rikcat.vy += GRAVITY;
  if(rikcat.vy > TERMINAL_V) rikcat.vy = TERMINAL_V;
  rikcat.x += rikcat.vx;
  rikcat.y += rikcat.vy;
  rikcat.onGround = false;

  // Colisão com plataformas
  platforms.forEach(p=>{
    const py = p.y();
    if(rikcat.x < p.x+p.w && rikcat.x+rikcat.w > p.x &&
       rikcat.y+rikcat.h > py && rikcat.y+rikcat.h < py+p.h &&
       rikcat.vy>0){
      rikcat.y = py-rikcat.h;
      rikcat.vy = 0;
      rikcat.onGround = true;
    }
  });

  // Colisão com cano
  pipes.forEach(pipe=>{
    if(rikcat.x+rikcat.w>pipe.x && rikcat.x<pipe.x+pipe.w &&
       rikcat.y+rikcat.h>pipe.y && rikcat.y<pipe.y+pipe.h &&
       rikcat.attacking){
      inWater = pipe.target==="water";
      rikcat.x = inWater ? 50 : 80;
      rikcat.y = inWater ? 50 : 0;
    }
  });

  // Câmera
  cameraX = rikcat.x - canvas.width/2;
  cameraY = rikcat.y - canvas.height/2;
  if(cameraX<0) cameraX=0;
  if(cameraY<0) cameraY=0;

  // Fundo
  ctx.fillStyle = inWater ? "#3399FF" : "#6AA5FF";
  ctx.fillRect(0,0,canvas.width,canvas.height);

  // Desenhar plataformas
  ctx.fillStyle = "#8B4513";
  platforms.forEach(p=>{
    const py = p.y();
    ctx.fillRect(p.x - cameraX, py - cameraY, p.w, p.h);
  });

  // Desenhar canos
  ctx.fillStyle = "blue";
  pipes.forEach(pipe=>{
    ctx.fillRect(pipe.x - cameraX, pipe.y - cameraY, pipe.w, pipe.h);
  });

  // Jogador
  drawPlayer(rikcat);

  // Multiplayer
  if(onlineEnabled){
    set(myRef,{
      x: rikcat.x,
      y: rikcat.y,
      emote: rikcat.emote,
      skin: rikcat.skin,
      color: rikcat.color
    });
    for(const id in onlinePlayers){
      if(id === playerId) continue;
      drawPlayer(onlinePlayers[id]);
    }
  }
}

update();
