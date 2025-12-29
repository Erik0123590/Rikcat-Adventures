alert("GAME.JS CARREGOU");

import { db, ref, set, onValue, onDisconnect, push, remove } from "./firebase.js";

/* ====== DOM / CANVAS ====== */
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

function resize() {
  canvas.width = innerWidth;
  canvas.height = innerHeight;
}
window.addEventListener("resize", resize, { passive: true });
resize();

// prevenir comportamento padrão de toque que pode atrapalhar controles mobile
if (canvas) {
  canvas.addEventListener("touchstart", e => e.preventDefault(), { passive: false });
  canvas.addEventListener("touchmove", e => e.preventDefault(), { passive: false });
}

/* ====== CONFIG ====== */
const GRAVITY = 0.6;
const JUMP = -12;
const SPEED = 5;
const room = "online_salas_1";
const playerId = "p_" + Math.floor(Math.random() * 999999);

/* ====== PLAYER (me) ====== */
const me = {
  x: 100,
  y: 100,
  vx: 0,
  vy: 0,
  w: 32,
  h: 32,
  onGround: false,
  facing: 1,
  nick: "Convidado",
  skin: "rikcat",
  color: "#FFB000", // padrão laranja; você pode trocar para verde "#00D92A"
  _walkCounter: 0
};

/* state */
let playing = false;
let online = false;
let camX = 0;
const others = {};

/* firebase refs */
const myRef = ref(db, `rooms/${room}/players/${playerId}`);
const playersRef = ref(db, `rooms/${room}/players`);
const chatRef = ref(db, `rooms/${room}/chat`);

/* ====== INPUT (teclado + mobile buttons) ====== */
const keys = {};
window.addEventListener("keydown", e => keys[e.code] = true);
window.addEventListener("keyup", e => keys[e.code] = false);

// Bind mobile buttons if exist
function bindTouchButton(elId, keyName) {
  const el = document.getElementById(elId);
  if (!el) return;
  el.addEventListener("touchstart", e => {
    e.preventDefault();
    keys[keyName] = true;
  }, { passive: false });
  el.addEventListener("touchend", e => {
    e.preventDefault();
    keys[keyName] = false;
  }, { passive: false });
}
bindTouchButton("left", "ArrowLeft");
bindTouchButton("right", "ArrowRight");
bindTouchButton("jump", "Space");

/* ====== CHAT ====== */
const chatBox = document.getElementById("chatBox");
const chatInput = document.getElementById("chatInput");
const chatBtn = document.getElementById("openChatBtn");
const chatContainer = document.getElementById("chatContainer");
let chatOpen = false;

if (chatBtn) {
  chatBtn.addEventListener("click", () => {
    chatOpen = !chatOpen;
    if (chatContainer) chatContainer.style.display = chatOpen ? "flex" : "none";
    if (chatOpen && chatInput) chatInput.focus();
  });
}

if (chatInput) {
  chatInput.addEventListener("keydown", e => {
    if (e.key === "Enter" && chatInput.value.trim()) {
      push(chatRef, {
        sender: me.nick,
        text: chatInput.value.trim(),
        time: Date.now()
      });
      chatInput.value = "";
    }
  });
}

// listen chat updates
onValue(chatRef, snap => {
  if (!chatBox) return;
  chatBox.innerHTML = "";
  const data = snap.val();
  if (!data) return;
  Object.values(data).slice(-25).forEach(m => {
    const row = document.createElement("div");
    row.innerHTML = `<b>${m.sender}:</b> ${m.text}`;
    chatBox.appendChild(row);
  });
  chatBox.scrollTop = chatBox.scrollHeight;
});

/* ====== PLATAFORMAS ====== */
const platforms = [
  { x: 0, y: () => canvas.height - 40, w: 3000, h: 40 },
  { x: 250, y: () => canvas.height - 120, w: 140, h: 20 },
  { x: 500, y: () => canvas.height - 200, w: 140, h: 20 }
];

/* ====== DRAW FUNCTIONS ====== */

// Substitua a função drawPlayer por esta
function drawPlayer(p) {
  // posição no canvas (considerando câmera)
  const cx = p.x - camX + p.w / 2;
  const baseY = p.y + p.h / 2;

  // estado: andando quando tem velocidade horizontal e está no chão
  const moving = Math.abs(p.vx || 0) > 0.5 && !!p.onGround;

  // contador interno para animação (criado se inexistente)
  if (p._walkCounter === undefined) p._walkCounter = 0;
  if (moving) p._walkCounter += 1;
  else p._walkCounter = 0;

  // duas frames de caminhada trocando a cada 8 ticks
  const walkFrame = Math.floor(p._walkCounter / 8) % 2;

  // bob: alterna entre "encostar" e "flutuar"
  const bob = moving ? (walkFrame === 0 ? 4 : -2) : 0;

  ctx.save();
  // translação até o ponto central do personagem, com bob aplicado
  ctx.translate(cx, baseY + bob);

  // espelha APENAS quando estiver andando
  if (moving) ctx.scale(p.facing || 1, 1);

  const bodyColor = p.color || "#FFB000";
  const outline = "#000";
  const earInner = "#FF2FA3";

  ctx.lineWidth = 3;
  ctx.strokeStyle = outline;
  ctx.fillStyle = bodyColor;

  /* ===== CORPO no estilo OE5 (ellipse + cabeça) ===== */
  // corpo (um pouco mais largo que a cabeça)
  ctx.beginPath();
  ctx.ellipse(0, 8, 20, 14, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // cabeça
  ctx.beginPath();
  ctx.ellipse(0, -12, 18, 16, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  /* ===== ORELHAS ===== */
  ctx.fillStyle = bodyColor;
  ctx.strokeStyle = outline;

  if (!moving) {
    // IDLE: orelhas apontando para os lados (mantém rosto central)
    // esquerda
    ctx.beginPath();
    ctx.moveTo(-14, -8);
    ctx.lineTo(-34, -8);
    ctx.lineTo(-14, -30);
    ctx.closePath();
    ctx.fill(); ctx.stroke();

    ctx.fillStyle = earInner;
    ctx.beginPath();
    ctx.moveTo(-20, -12);
    ctx.lineTo(-30, -12);
    ctx.lineTo(-20, -24);
    ctx.closePath();
    ctx.fill();

    // direita
    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.moveTo(14, -8);
    ctx.lineTo(34, -8);
    ctx.lineTo(14, -30);
    ctx.closePath();
    ctx.fill(); ctx.stroke();

    ctx.fillStyle = earInner;
    ctx.beginPath();
    ctx.moveTo(20, -12);
    ctx.lineTo(30, -12);
    ctx.lineTo(20, -24);
    ctx.closePath();
    ctx.fill();
  } else {
    // WALK: orelhas inclinadas (dinâmica)
    ctx.beginPath();
    ctx.moveTo(-10, -18);
    ctx.lineTo(-28, -34);
    ctx.lineTo(-6, -36);
    ctx.closePath();
    ctx.fill(); ctx.stroke();

    ctx.fillStyle = earInner;
    ctx.beginPath();
    ctx.moveTo(-16, -20);
    ctx.lineTo(-24, -32);
    ctx.lineTo(-10, -30);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.moveTo(10, -18);
    ctx.lineTo(28, -34);
    ctx.lineTo(6, -36);
    ctx.closePath();
    ctx.fill(); ctx.stroke();

    ctx.fillStyle = earInner;
    ctx.beginPath();
    ctx.moveTo(16, -20);
    ctx.lineTo(24, -32);
    ctx.lineTo(10, -30);
    ctx.closePath();
    ctx.fill();
  }

  /* ===== ROSTO ===== */
  ctx.fillStyle = "#000";
  // olhos: frames diferentes para caminhada (simples)
  if (moving) {
    if (walkFrame === 0) {
      ctx.fillRect(-7, -14, 4, 10);
      ctx.fillRect(3,  -14, 4, 10);
    } else {
      ctx.fillRect(-7, -10, 4, 6);
      ctx.fillRect(3,  -10, 4, 6);
    }
  } else {
    // idle olhos verticais
    ctx.fillRect(-7, -14, 4, 10);
    ctx.fillRect(3,  -14, 4, 10);
  }

  // nariz (interno das orelhas estilo rosa)
  ctx.fillStyle = earInner;
  ctx.beginPath();
  ctx.moveTo(0, -6);
  ctx.lineTo(-5, -0);
  ctx.lineTo(5, -0);
  ctx.closePath();
  ctx.fill();

  // boca (w quando idle, sorriso ao andar)
  ctx.strokeStyle = outline;
  ctx.lineWidth = 2;
  if (moving) {
    ctx.beginPath();
    ctx.moveTo(-6, 4);
    ctx.quadraticCurveTo(0, 8, 6, 4);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.moveTo(-4, 2);
    ctx.quadraticCurveTo(0, 6, 4, 2);
    ctx.moveTo(-1, 2);
    ctx.quadraticCurveTo(0, 5, 1, 2);
    ctx.stroke();
  }

  ctx.restore();

  /* ===== NICK (fora da transformação) ===== */
  ctx.fillStyle = "white";
  ctx.font = "bold 12px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(p.nick || "Convidado", cx, p.y - 8);
  }

/* ====== MAIN LOOP ====== */
function loop() {
  if (!playing) return;
  requestAnimationFrame(loop);

  // bloquear inputs de movimento somente quando o chat estiver aberto E o input estiver em foco
  const typing = chatOpen && document.activeElement === chatInput;

  if (!typing) {
    if (keys["ArrowLeft"]) { me.vx = -SPEED; me.facing = -1; }
    else if (keys["ArrowRight"]) { me.vx = SPEED; me.facing = 1; }
    else me.vx *= 0.8;

    if (keys["Space"] && me.onGround) {
      me.vy = JUMP;
      me.onGround = false;
    }
  }

  // physics
  me.vy += GRAVITY;
  me.x += me.vx;
  me.y += me.vy;

  // collisions with platforms
  me.onGround = false;
  for (const p of platforms) {
    const py = p.y();
    if (
      me.x < p.x + p.w &&
      me.x + me.w > p.x &&
      me.y + me.h > py &&
      me.y + me.h < py + p.h &&
      me.vy > 0
    ) {
      me.y = py - me.h;
      me.vy = 0;
      me.onGround = true;
    }
  }

  // camera
  camX = Math.max(0, me.x - canvas.width / 2);

  // clear & background
  ctx.fillStyle = "#6aa5ff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // draw platforms
  ctx.fillStyle = "#8b4513";
  platforms.forEach(p => ctx.fillRect(p.x - camX, p.y(), p.w, p.h));

  // online sync + draw others
  if (online) {
    // send own state (basic)
    // we send only primitive fields to DB
    set(myRef, {
      x: me.x,
      y: me.y,
      vx: me.vx,
      vy: me.vy,
      w: me.w,
      h: me.h,
      onGround: me.onGround,
      facing: me.facing,
      nick: me.nick,
      skin: me.skin,
      color: me.color
    });

    for (const id in others) {
      if (id === playerId) continue;
      const p = others[id];
      // ensure required defaults for drawing
      const drawP = {
        x: p.x || 0,
        y: p.y || 0,
        vx: p.vx || 0,
        vy: p.vy || 0,
        w: p.w || 32,
        h: p.h || 32,
        onGround: p.onGround || false,
        facing: p.facing || 1,
        nick: p.nick || "Convidado",
        skin: p.skin || "rikcat",
        color: p.color || "#FFB000",
        _walkCounter: p._walkCounter || 0
      };
      drawPlayer(drawP);
    }
  }

  // draw me on top
  drawPlayer(me);
}

/* ====== START / UI HOOKS ====== */
function start(isOnline) {
  online = isOnline;
  playing = true;

  // show/hide screens
  const title = document.getElementById("titleScreen");
  const gameEl = document.getElementById("game");
  if (title) title.style.display = "none";
  if (gameEl) gameEl.style.display = "block";

  // important: ensure canvas has correct size BEFORE starting loop
  resize();

  if (online) {
    if (chatBtn) chatBtn.style.display = "flex";

    // ensure we are removed on disconnect
    onDisconnect(myRef).remove();

    // listen players
    onValue(playersRef, snap => {
      const data = snap.val() || {};
      // replace others entirely to reflect DB (keeps our own entry if present as well)
      // we'll skip drawing our own id when iterating
      for (const k in others) {
        if (!data[k]) delete others[k];
      }
      Object.assign(others, data);
    });
  } else {
    if (chatBtn) chatBtn.style.display = "none";
  }

  loop();
}

/* buttons */
const soloBtn = document.getElementById("soloBtn");
const multiBtn = document.getElementById("multiBtn");
if (soloBtn) soloBtn.onclick = () => start(false);
if (multiBtn) multiBtn.onclick = () => start(true);

/* config save button */
const closeConfig = document.getElementById("closeConfig");
if (closeConfig) {
  closeConfig.onclick = () => {
    const n = document.getElementById("nickInput")?.value.trim();
    if (n) me.nick = n;
    const skin = document.getElementById("skinSelect")?.value;
    if (skin) me.skin = skin;
    const col = document.getElementById("colorSelect")?.value;
    if (col) me.color = col;
    document.getElementById("configScreen").style.display = "none";
  };
}

/* ====== INITIAL RESIZE ====== */
resize();

// optional: expose me to console for quick testing
window.__ME = me;
window.__START = start;
