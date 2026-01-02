// game.js
alert("GAME.JS CARREGOU");
import { db, ref, set, onValue, onDisconnect, push, remove } from "./firebase.js";
import { drawRikcat } from "./rikcat.js";

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
function resize(){ canvas.width = innerWidth; canvas.height = innerHeight; }
window.addEventListener("resize", resize); resize();

/* CONFIG */
const GRAVITY = 0.6, JUMP = -12, SPEED = 5;
const room = "online_salas_1";
const playerId = "p_" + Math.floor(Math.random()*999999);

/* STATE */
const me = { x:100, y:100, vx:0, vy:0, w:32, h:32, onGround:false, facing:1, nick:"Convidado", skin:"rikcat", color:"#FFB000" };
let playing=false, online=false, camX=0;
const others = {};
const myRef = ref(db, `rooms/${room}/players/${playerId}`);
const playersRef = ref(db, `rooms/${room}/players`);
const chatRef = ref(db, `rooms/${room}/chat`);

/* UI refs */
const screens = { title: document.getElementById("titleScreen"), config: document.getElementById("configScreen"), game: document.getElementById("game") };
const openChatBtn = document.getElementById("openChatBtn");
const chatContainer = document.getElementById("chatContainer");
const chatBox = document.getElementById("chatBox");
const chatInput = document.getElementById("chatInput");
const fireBtn = document.getElementById("fireBtn");

if(openChatBtn) openChatBtn.style.display = "none";

/* INPUT */
window.keys = {};
window.addEventListener("keydown", e=>{ if(e.code) window.keys[e.code] = true; });
window.addEventListener("keyup", e=>{ if(e.code) window.keys[e.code] = false; });
function bindTouch(id,key){ const el=document.getElementById(id); if(!el) return; el.addEventListener("touchstart",e=>{ e.preventDefault(); window.keys[key]=true; },{passive:false}); el.addEventListener("touchend", e=>{ e.preventDefault(); window.keys[key]=false; },{passive:false}); }
bindTouch("left","ArrowLeft"); bindTouch("right","ArrowRight"); bindTouch("jump","Space");

/* CHAT */
let chatOpen=false;
if(openChatBtn) openChatBtn.addEventListener("click", ()=>{ chatOpen=!chatOpen; chatContainer.style.display = chatOpen ? "flex":"none"; if(chatOpen) chatInput.focus(); });
if(chatInput) chatInput.addEventListener("keydown", e=> {
  if(e.key === "Enter" && chatInput.value.trim()){
    push(chatRef, { sender: me.nick, text: chatInput.value.trim(), time: Date.now() });
    chatInput.value = "";
  }
});
onValue(chatRef, snap => {
  if(!chatBox) return;
  chatBox.innerHTML = "";
  const data = snap.val() || {};
  Object.values(data).slice(-40).forEach(m=>{
    const d = document.createElement("div");
    d.innerHTML = `<b>${m.sender}:</b> ${m.text}`;
    chatBox.appendChild(d);
  });
  chatBox.scrollTop = chatBox.scrollHeight;
});

/* PLAYERS sync */
onValue(playersRef, snap=>{
  const data = snap.val() || {};
  for (const k in others) if (!data[k]) delete others[k];
  Object.assign(others, data);
});

/* FIRE (admin effect simple local) */
fireBtn.addEventListener("click", ()=>{
  // draw a local effect via push to /rooms/.../effects (light implementation)
  push(ref(db, `rooms/${room}/effects`), {
    x: me.x + (me.facing === 1 ? me.w : 0),
    y: me.y + me.h/2,
    dir: me.facing,
    len: 500,
    duration: 700,
    createdAt: Date.now()
  });
});

/* Efects listener */
const effects = [];
onValue(ref(db, `rooms/${room}/effects`), snap=>{
  const data = snap.val() || {};
  effects.length = 0;
  Object.values(data).forEach(e => effects.push(e));
});

/* PLATFORMS */
const platforms = [
  { x:0, y:()=>canvas.height-40, w:3000, h:40 },
  { x:250, y:()=>canvas.height-120, w:140, h:20 },
  { x:500, y:()=>canvas.height-200, w:140, h:20 }
];

/* RENDER effects helper */
function renderEffects(){
  const now = Date.now();
  for(let i = effects.length-1; i>=0; i--){
    const ef = effects[i];
    if(!ef) continue;
    const age = now - (ef.createdAt||0);
    const dur = ef.duration||700;
    if(age > dur + 300) continue;
    const alpha = Math.max(0, 1 - (age/dur));
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.lineWidth = 12;
    ctx.strokeStyle = "rgba(255,100,0,0.95)";
    const sx = (ef.x - camX);
    const sy = ef.y;
    const ex = sx + (ef.len||400) * (ef.dir||1);
    ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(ex, sy); ctx.stroke();
    ctx.restore();
  }
}

/* DRAW wrapper */
function drawPlayerWrapper(p){
  const proto = {
    x: p.x||0, y:p.y||0, vx:p.vx||0, vy:p.vy||0,
    w:p.w||32, h:p.h||32, onGround:!!p.onGround, facing:p.facing||1, nick:p.nick||"Convidado", skin:p.skin||"rikcat", color:p.color||"#FFB000"
  };
  if(proto.skin === "rikcat"){
    drawRikcat(ctx, proto, camX);
  } else {
    const x = proto.x - camX + proto.w/2;
    const y = proto.y + proto.h/2;
    ctx.font = "32px Arial"; ctx.textAlign = "center"; ctx.fillStyle = "white";
    ctx.fillText("🐙", x, y);
    ctx.fillStyle = "white"; ctx.font = "12px Arial"; ctx.fillText(proto.nick, x, proto.y-12);
  }
}

/* MAIN loop */
function loop(){
  if(!playing) return;
  requestAnimationFrame(loop);

  const typing = chatOpen && document.activeElement === chatInput;
  if(!typing){
    if(window.keys["ArrowLeft"]) { me.vx = -SPEED; me.facing = -1; }
    else if(window.keys["ArrowRight"]) { me.vx = SPEED; me.facing = 1; }
    else me.vx *= 0.8;
    if(window.keys["Space"] && me.onGround){ me.vy = JUMP; me.onGround = false; }
  }

  me.vy += GRAVITY; me.x += me.vx; me.y += me.vy;

  // collision with platforms
  me.onGround = false;
  for(const p of platforms){
    const py = p.y();
    if(me.x < p.x + p.w && me.x + me.w > p.x && me.y + me.h > py && me.y + me.h < py + p.h && me.vy > 0){
      me.y = py - me.h; me.vy = 0; me.onGround = true;
    }
  }

  if(me.y > canvas.height + 200){ me.x = 100; me.y = 100; me.vy = 0; }

  camX = Math.max(0, me.x - canvas.width/2);

  // clear
  ctx.fillStyle = "#6aa5ff"; ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle = "#8b4513";
  platforms.forEach(pl => ctx.fillRect(pl.x - camX, pl.y(), pl.w, pl.h));

  // effects behind
  renderEffects();

  // online sync
  if(online){
    set(myRef, { x:me.x, y:me.y, vx:me.vx, vy:me.vy, w:me.w, h:me.h, onGround:me.onGround, facing:me.facing, nick:me.nick, skin:me.skin, color:me.color });
    for(const id in others) if(id !== playerId) drawPlayerWrapper(others[id]);
  }

  // local draw
  drawPlayerWrapper(me);
}

/* START */
function start(isOnline){
  online = !!isOnline; playing = true;
  screens.title.style.display = "none"; screens.game.style.display = "block";
  resize();

  if(online){
    openChatBtn.style.display = "flex";
    onDisconnect(myRef).remove();
    onValue(playersRef, snap=>{
      const data = snap.val() || {};
      for(const k in others) if(!data[k]) delete others[k];
      Object.assign(others, data);
    });
  } else {
    openChatBtn.style.display = "none";
  }
  loop();
}

/* UI wiring */
document.getElementById("soloBtn").onclick = ()=> start(false);
document.getElementById("multiBtn").onclick = ()=> start(true);
document.getElementById("configBtn").onclick = ()=> screens.config.style.display = "flex";
document.getElementById("closeConfig").onclick = ()=> {
  const n = document.getElementById("nickInput").value.trim();
  if(n) me.nick = n;
  me.skin = document.getElementById("skinSelect").value;
  me.color = document.getElementById("colorSelect").value;
  screens.config.style.display = "none";
};

/* ADMIN password modal simple (local) */
document.getElementById("adminBtn").onclick = ()=> document.getElementById("adminScreen").style.display = "flex";
document.getElementById("adminCancel").onclick = ()=> document.getElementById("adminScreen").style.display = "none";
document.getElementById("adminSubmit").onclick = ()=> {
  const pass = document.getElementById("adminPass").value;
  // change this secret to whatever you want
  if(pass === "minhasenhaADM123"){
    alert("Comandos de ADM ligados");
    // reveal fire button and allow /PDF command via chat (server effects already enabled)
    fireBtn.style.display = "block";
  } else alert("Senha incorreta");
  document.getElementById("adminScreen").style.display = "none";
};

/* MINIGAMES integration */
const MINIGAMES = [
  { id: "timeTrial", name: "⏱️ Time Trial" },
  { id: "platformRace", name: "🏁 Platform Race" },
  { id: "captureFlag", name: "🏳️ Capture Flag" },
  { id: "survivalWaves", name: "🌊 Survival Waves" }
];
const mgBtn = document.getElementById("minigamesBtn");
const mgMenu = document.getElementById("minigameMenu");
const mgList = document.getElementById("minigameList");
const mgClose = document.getElementById("closeMinigameMenu");
let activeMinigame = null;
function buildMinigameList(){
  mgList.innerHTML = "";
  MINIGAMES.forEach(m=>{
    const b = document.createElement("button");
    b.className = "mg-btn";
    b.textContent = m.name;
    b.onclick = ()=> { openMinigame(m.id); mgMenu.style.display = "none"; };
    mgList.appendChild(b);
  });
}
if(mgBtn) mgBtn.onclick = ()=> { mgMenu.style.display = "flex"; buildMinigameList(); }
if(mgClose) mgClose.onclick = ()=> mgMenu.style.display = "none";

async function openMinigame(id){
  if(activeMinigame && activeMinigame.stop) { try{ activeMinigame.stop(); }catch(e){} activeMinigame = null; }
  screens.title.style.display = "none"; screens.game.style.display = "block"; playing = true;
  try {
    let mod;
    switch(id){
      case "timeTrial": mod = await import('./minigame_timeTrial.js'); break;
      case "platformRace": mod = await import('./minigame_platformRace.js'); break;
      case "captureFlag": mod = await import('./minigame_captureFlag.js'); break;
      case "survivalWaves": mod = await import('./minigame_survivalWaves.js'); break;
      default: return;
    }
    if(mod && mod.default && mod.default.init){
      activeMinigame = mod.default;
      activeMinigame.init({ canvas, ctx, me, onExit: ()=> { if(activeMinigame && activeMinigame.stop) activeMinigame.stop(); activeMinigame=null; playing=false; screens.game.style.display='none'; screens.title.style.display='flex'; } });
    } else console.warn("minigame inválido", id);
  } catch(err){ console.error("Erro carregando minigame",id,err); alert("Erro ao carregar minigame"); }
}

/* init expose for debugging */
window.__ME = me;
window.__START = start;
