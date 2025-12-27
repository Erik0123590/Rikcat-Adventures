import { db, ref, set, onValue, onDisconnect } from "./firebase.js";

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const titleScreen = document.getElementById("titleScreen");
const soloBtn = document.getElementById("soloBtn");
const multiBtn = document.getElementById("multiBtn");
const gameDiv = document.getElementById("game");
const rotate = document.getElementById("rotate");

/* CONFIGURAÇÕES */
const skinSelect = document.getElementById("skinSelect");
const colorSelect = document.getElementById("colorSelect");
const roomInput  = document.getElementById("roomInput");

/* CONTROLES */
const left  = document.getElementById("left");
const right = document.getElementById("right");
const jump  = document.getElementById("jump");
const attack= document.getElementById("attack");

/* EMOTES */
const emoteBtn  = document.getElementById("emoteBtn");
const emoteMenu = document.getElementById("emoteMenu");

/* ONLINE */
let room = "default_room";
const playerId = "p_" + Math.floor(Math.random()*99999);
let onlineEnabled = false;
const onlinePlayers = {};

/* RESIZE */
function resize(){ canvas.width = innerWidth; canvas.height = innerHeight; }
addEventListener("resize", resize);
resize();

/* ORIENTAÇÃO */
function checkOrientation(){ rotate.style.display = innerHeight>innerWidth ? "flex":"none"; }
addEventListener("resize", checkOrientation);
checkOrientation();

/* START */
let playing=false;
function startGame(online){
  onlineEnabled = online;
  const selectedRoom = roomInput.value.trim();
  if(selectedRoom) room = selectedRoom;

  titleScreen.style.display="none";
  gameDiv.style.display="block";
  playing=true;

  // Inicializar referência online
  if(onlineEnabled){
    const myRef = ref(db, `rooms/${room}/players/${playerId}`);
    onDisconnect(myRef).remove();
    onValue(ref(db,`rooms/${room}/players`), snap=>{
      Object.keys(onlinePlayers).forEach(k=>delete onlinePlayers[k]);
      if(snap.val()) Object.assign(onlinePlayers,snap.val());
    });
    window.myRef = myRef;
  }
}

soloBtn.onclick = ()=>startGame(false);
multiBtn.onclick = ()=>startGame(true);

/* PLAYER */
const player={
  x:80,y:0,w:32,h:32,
  vx:0,vy:0,onGround:false,
  life:3,attacking:false,
  emote:null,
  skin:"rikcat",
  color:"#FFB000"
};

/* CONTROLES */
left.ontouchstart=()=>player.vx=-4;
right.ontouchstart=()=>player.vx=4;
jump.ontouchstart=()=>{
  if(player.onGround){ player.vy=-12; player.onGround=false; }
};
attack.ontouchstart=()=>player.attacking=true;
[left,right,jump,attack].forEach(b=>{
  b.ontouchend=()=>{
    player.vx=0;
    player.attacking=false;
  };
});

/* EMOTES */
if(emoteBtn && emoteMenu){
  emoteBtn.onclick=()=>{
    emoteMenu.style.display = emoteMenu.style.display==="flex"?"none":"flex";
  };
  document.querySelectorAll(".emote").forEach(btn=>{
    btn.onclick=()=>{
      player.emote = btn.textContent;
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

/* DRAW PLAYER */
function drawPlayer(x,y,scale=1,skin="rikcat",color="#FFB000",emote=null){
  ctx.save();
  ctx.translate(x,y);
  ctx.scale(scale,scale);

  ctx.font="24px sans-serif";

  if(skin==="rikcat"){
    // Rikcat
    const outline="#000";
    const earInside="#FF2FA3";
    const noseColor="#FF2FA3";

    ctx.lineWidth=4;

    // Orelhas atrás
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

    // Cabeça
    ctx.fillStyle=color;
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

  } else if(skin==="polvo"){
    // Polvo
    ctx.font="48px sans-serif";
    ctx.fillText("🐙",-24,-10);
  }

  // Emote
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

  player.vy += 0.6;
  player.x += player.vx;
  player.y += player.vy;

  player.onGround=false;
  platforms.forEach(p=>{
    const py=p.y();
    ctx.fillStyle="#8B4513";
    ctx.fillRect(p.x,py,p.w,p.h);

    if(player.x < p.x+p.w && player.x+player.w > p.x &&
       player.y+player.h > py && player.y+player.h < py+p.h &&
       player.vy>0){
      player.y = py - player.h;
      player.vy = 0;
      player.onGround=true;
    }
  });

  drawPlayer(player.x,player.y,1,player.skin,player.color,player.emote);

  if(onlineEnabled){
    set(window.myRef,{
      x:player.x,
      y:player.y,
      emote:player.emote,
      skin:player.skin,
      color:player.color
    });

    for(const id in onlinePlayers){
      if(id===playerId) continue;
      const p = onlinePlayers[id];
      drawPlayer(p.x,p.y,1,p.skin,p.color,p.emote);
    }
  }
}
update();
