import { db, ref, set, onValue, onDisconnect } from "./firebase.js";

/* CANVAS */
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

/* GAME STATE */
let playing = false;
let onlineEnabled = false;
const room = "rikcat_rooms";
const playerId = "p_" + Math.floor(Math.random()*99999);
const onlinePlayers = {};
let currentLevel = "normal"; // normal / water

/* CONFIGURAÇÕES */
let playerSkin = "Rikcat"; // Rikcat ou Polvo
let playerColor = "#FFB000";

/* RESIZE & ORIENTAÇÃO */
function resize(){
  canvas.width = innerWidth;
  canvas.height = innerHeight;
}
addEventListener("resize", resize);
resize();

function checkOrientation(){
  rotate.style.display = innerHeight > innerWidth ? "flex" : "none";
}
addEventListener("resize", checkOrientation);
checkOrientation();

/* START */
function startGame(online){
  onlineEnabled = online;
  titleScreen.style.display="none";
  gameDiv.style.display="block";
  playing=true;
}
soloBtn.onclick = () => startGame(false);
multiBtn.onclick = () => startGame(true);

/* PLAYER */
const rikcat = {
  x:80, y:0, w:32, h:32,
  vx:0, vy:0, onGround:false,
  life:3, attacking:false,
  emotes: [], emote:null,
  skin: playerSkin, color: playerColor
};

/* FIREBASE */
const myRef = ref(db, `rooms/${room}/players/${playerId}`);
onDisconnect(myRef).remove();

onValue(ref(db, `rooms/${room}/players`), snap=>{
  Object.keys(onlinePlayers).forEach(k=>delete onlinePlayers[k]);
  if(snap.val()) Object.assign(onlinePlayers,snap.val());
});

/* CONTROLES */
left.ontouchstart = () => rikcat.vx = -4;
right.ontouchstart = () => rikcat.vx = 4;
jump.ontouchstart = () => {
  if(rikcat.onGround){
    rikcat.vy = -12;
    rikcat.onGround = false;
  }
};
attack.ontouchstart = () => rikcat.attacking = true;

[left,right,jump,attack].forEach(b => b.ontouchend = ()=>{
  rikcat.vx = 0;
  rikcat.attacking = false;
});

/* EMOTES */
if(emoteBtn && emoteMenu){
  emoteBtn.onclick = () => {
    emoteMenu.style.display = emoteMenu.style.display==="flex"?"none":"flex";
  };

  document.querySelectorAll(".emote").forEach(btn=>{
    btn.onclick = () => {
      rikcat.emote = btn.textContent;
      rikcat.emotes.push({text: btn.textContent, x: rikcat.x, y: rikcat.y});
      emoteMenu.style.display="none";
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

/* CANOS */
const pipes = [
  {x:900, y:()=>canvas.height-80, w:40, h:40, target:"water", color:"blue"},
  {x:1200, y:()=>canvas.height-40, w:40, h:40, target:"normal", color:"green"}
];

/* INIMIGOS */
const enemies = [
  {x:300, y:canvas.height-60, w:30, h:30, vy:0},
  {x:500, y:canvas.height-60, w:30, h:30, vy:0}
];

/* DRAW FUNCTIONS */
function drawRikcat(player){
  const {x, y, color, skin, emote} = player;
  ctx.save();
  ctx.translate(x,y);
  ctx.scale(1,1);

  const outline = "#000";
  const earInside = "#FF2FA3";
  const noseColor = "#FF2FA3";

  ctx.lineWidth=4;

  // ORELHAS ATRÁS
  if(skin==="Rikcat"){
    ctx.fillStyle=color; ctx.strokeStyle=outline;
    ctx.beginPath(); ctx.moveTo(-18,-2); ctx.lineTo(-40,-28); ctx.lineTo(-8,-22);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle=earInside;
    ctx.beginPath(); ctx.moveTo(-20,-8); ctx.lineTo(-32,-22); ctx.lineTo(-14,-18);
    ctx.closePath(); ctx.fill();

    ctx.fillStyle=color;
    ctx.beginPath(); ctx.moveTo(18,-2); ctx.lineTo(40,-28); ctx.lineTo(8,-22);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle=earInside;
    ctx.beginPath(); ctx.moveTo(20,-8); ctx.lineTo(32,-22); ctx.lineTo(14,-18);
    ctx.closePath(); ctx.fill();
  }

  // CABEÇA
  ctx.fillStyle=color;
  ctx.beginPath();
  ctx.arc(0,6,26,0,Math.PI*2);
  ctx.fill(); ctx.stroke();

  if(skin==="Rikcat"){
    // OLHOS
    ctx.fillStyle="#000";
    ctx.fillRect(-8,0,4,14);
    ctx.fillRect(4,0,4,14);
    // NARIZ
    ctx.fillStyle=noseColor;
    ctx.beginPath(); ctx.moveTo(0,14); ctx.lineTo(-6,22); ctx.lineTo(6,22);
    ctx.closePath(); ctx.fill();
    // BOCA
    ctx.beginPath();
    ctx.moveTo(0,22); ctx.lineTo(0,28);
    ctx.quadraticCurveTo(-4,30,-6,28);
    ctx.moveTo(0,28);
    ctx.quadraticCurveTo(4,30,6,28);
    ctx.stroke();
  } else if(skin==="Polvo"){
    ctx.font="48px serif";
    ctx.fillText("🐙",-24,-10);
  }

  // EMOTE
  if(emote){
    ctx.font="24px sans-serif";
    ctx.fillText(emote,-10,-35);
  }

  ctx.restore();
}

/* DRAW EMOTES */
function drawEmotes(){
  rikcat.emotes.forEach((e,i)=>{
    const offset = (i>5)? (i-5)*30 : 0;
    ctx.font="24px sans-serif";
    ctx.fillText(e.text, e.x + offset, e.y-35);
  });
}

/* LOOP */
function update(){
  requestAnimationFrame(update);
  if(!playing) return;

  // FUNDO
  ctx.fillStyle = currentLevel==="water"?"#66ccff":"#6aa5ff";
  ctx.fillRect(0,0,canvas.width,canvas.height);

  // FÍSICA
  rikcat.vy += 0.6;
  rikcat.x += rikcat.vx;
  rikcat.y += rikcat.vy;
  rikcat.onGround = false;

  // PLATAFORMAS
  platforms.forEach(p=>{
    const py = p.y();
    ctx.fillStyle="#8B4513";
    ctx.fillRect(p.x,py,p.w,p.h);

    if(rikcat.x < p.x+p.w && rikcat.x+rikcat.w > p.x &&
       rikcat.y+rikcat.h > py && rikcat.y+rikcat.h < py+p.h && rikcat.vy>0){
         rikcat.y=py-rikcat.h;
         rikcat.vy=0;
         rikcat.onGround=true;
    }
  });

  // INIMIGOS
  enemies.forEach(e=>{
    e.vy += 0.4;
    e.y += e.vy;
    const ground = canvas.height-40;
    if(e.y > ground-e.h){ e.y = ground-e.h; e.vy=0; }
    ctx.fillStyle="red";
    ctx.fillRect(e.x,e.y,e.w,e.h);
  });

  // CANOS
  pipes.forEach(pipe=>{
    const py = pipe.y();
    ctx.fillStyle = pipe.color;
    ctx.fillRect(pipe.x, py, pipe.w, pipe.h);

    // COLISÃO COM GARRA
    if(rikcat.attacking &&
       rikcat.x+rikcat.w > pipe.x &&
       rikcat.x < pipe.x+pipe.w &&
       rikcat.y+rikcat.h > py &&
       rikcat.y < py+pipe.h){
         currentLevel = pipe.target;
    }
  });

  // RIKCAT
  drawRikcat(rikcat);

  // EMOTES
  drawEmotes();

  // ONLINE
  if(onlineEnabled){
    set(myRef,{
      x:rikcat.x, y:rikcat.y,
      emotes: rikcat.emotes,
      skin: rikcat.skin, color: rikcat.color
    });

    for(const id in onlinePlayers){
      if(id===playerId) continue;
      const p = onlinePlayers[id];
      drawRikcat(p);
      if(p.emotes){
        p.emotes.forEach((e,i)=>{
          const offset = (i>5)?(i-5)*30:0;
          ctx.fillText(e.text, e.x + offset, e.y-35);
        });
      }
    }
  }
}
update();
