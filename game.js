// game.js — FO1 (Fogo Online 1) integrado ao rikcat.js e admin.js
import { db, ref, set, onValue, onDisconnect, push, remove } from "./firebase.js";
import { drawRikcat } from "./rikcat.js";
import * as admin from "./admin.js";

window.addEventListener("DOMContentLoaded", () => {

  /* CANVAS */
  const canvas = document.getElementById("canvas");
  const ctx = canvas.getContext("2d");
  function resize() { canvas.width = innerWidth; canvas.height = innerHeight; }
  window.addEventListener("resize", resize, { passive:true });
  resize();

  /* CONFIG */
  const GRAVITY = 0.6, JUMP = -12, SPEED = 5;
  const room = "online_salas_1";
  const playerId = "p_"+Math.floor(Math.random()*999999);

  /* DB refs */
  const playersRef = ref(db, `rooms/${room}/players`);
  const myRef = ref(db, `rooms/${room}/players/${playerId}`);
  const chatRef = ref(db, `rooms/${room}/chat`);
  const effectsRef = ref(db, `rooms/${room}/effects`);
  // wire admin effects ref
  admin.wireEffectsRef(effectsRef);

  /* STATE */
  const me = { x:100, y:100, vx:0, vy:0, w:32, h:32, onGround:false, facing:1, nick:"Convidado", skin:"rikcat", color:"#FFB000" };
  let playing=false, online=false, camX=0;
  const others = {};

  /* INPUT */
  const keys = {};
  window.addEventListener("keydown", e=> keys[e.code]=true);
  window.addEventListener("keyup", e=> keys[e.code]=false);

  // touch
  function bindTouch(id, key) {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener("touchstart", e => { e.preventDefault(); keys[key] = true; }, { passive:false });
    el.addEventListener("touchend",   e => { e.preventDefault(); keys[key] = false; }, { passive:false });
  }
  bindTouch("left", "ArrowLeft");
  bindTouch("right","ArrowRight");
  bindTouch("jump", "Space");

  /* CHAT UI */
  const chatBox = document.getElementById("chatBox");
  const chatInput = document.getElementById("chatInput");
  const chatBtn = document.getElementById("openChatBtn");
  const chatContainer = document.getElementById("chatContainer");
  let chatOpen = false;
  if (chatBtn) chatBtn.addEventListener("click", () => {
    chatOpen = !chatOpen;
    chatContainer.style.display = chatOpen ? "flex" : "none";
    if (chatOpen) chatInput.focus();
  });
  if (chatInput) chatInput.addEventListener("keydown", e => {
    if (e.key === "Enter" && chatInput.value.trim()) {
      const txt = chatInput.value.trim();
      // special command /PDF triggers enable (for admin)
      if (txt === "/PDF") {
        if (!admin.isAdmin()) alert("Você precisa da senha ADM para ativar comandos.");
        else {
          admin.enablePdfLocal();
          document.getElementById("fireBtn").style.display = "block";
          alert("Poder /PDF ativado — botão de raio disponível.");
        }
        chatInput.value = "";
        return;
      }
      push(chatRef, { sender: me.nick, text: txt, time: Date.now() });
      chatInput.value = "";
    }
  });

  onValue(chatRef, snap => {
    if (!chatBox) return;
    chatBox.innerHTML = "";
    const data = snap.val() || {};
    Object.values(data).slice(-40).forEach(m => {
      const d = document.createElement("div");
      d.innerHTML = `<b>${m.sender}:</b> ${m.text}`;
      chatBox.appendChild(d);
    });
    chatBox.scrollTop = chatBox.scrollHeight;
  });

  /* PLATFORMS */
  const platforms = [
    { x:0, y:() => canvas.height - 40, w:3000, h:40 },
    { x:250, y:() => canvas.height - 120, w:140, h:20 },
    { x:500, y:() => canvas.height - 200, w:140, h:20 }
  ];

  /* PLAYERS LISTENER */
  onValue(playersRef, snap => {
    const data = snap.val() || {};
    // cleanup others
    for (const k in others) if (!data[k]) delete others[k];
    Object.assign(others, data);
  });

  /* EFFECTS draw (from admin.effects array) */
  function renderEffects() {
    const now = Date.now();
    // draw DB-synced effects from admin.effects
    for (let i = admin.effects.length - 1; i >= 0; i--) {
      const ef = admin.effects[i];
      if (!ef) { admin.effects.splice(i,1); continue; }
      const age = now - (ef.createdAt || 0);
      if (age > (ef.duration || 700) + 400) { admin.effects.splice(i,1); continue; }
      const alpha = Math.max(0, 1 - (age / (ef.duration || 700)));
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.lineWidth = 12;
      ctx.strokeStyle = "rgba(255,140,0,0.95)";
      const startX = (ef.x - camX);
      const startY = (ef.y);
      const endX = startX + (ef.len || 400) * (ef.dir || 1);
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, startY);
      ctx.stroke();
      // highlight
      ctx.lineWidth = 2; ctx.strokeStyle = `rgba(255,255,200,${0.5*alpha})`;
      ctx.beginPath(); ctx.moveTo(startX, startY); ctx.lineTo(endX, startY); ctx.stroke();
      ctx.restore();
    }
  }

  /* DRAW wrapper */
  function drawPlayerWrapper(p) {
    const proto = {
      x: p.x || 0, y: p.y || 0, vx: p.vx || 0, vy: p.vy || 0,
      w: p.w || 32, h: p.h || 32, onGround: !!p.onGround, facing: p.facing || 1,
      nick: p.nick || "Convidado", skin: p.skin || "rikcat", color: p.color || "#FFB000"
    };
    if (proto.skin === "rikcat") drawRikcat(ctx, proto, camX);
    else {
      const x = proto.x - camX + proto.w/2;
      const y = proto.y + proto.h/2;
      ctx.font = "32px Arial"; ctx.textAlign = "center"; ctx.fillStyle = "white"; ctx.fillText("🐙", x, y);
      ctx.fillStyle = "white"; ctx.font = "12px Arial"; ctx.fillText(proto.nick, x, proto.y - 12);
    }
  }

  /* LOOP */
  function loop() {
    if (!playing) return;
    requestAnimationFrame(loop);

    const typing = chatOpen && document.activeElement === chatInput;
    if (!typing) {
      if (keys["ArrowLeft"]) { me.vx = -SPEED; me.facing = -1; }
      else if (keys["ArrowRight"]) { me.vx = SPEED; me.facing = 1; }
      else me.vx *= 0.8;

      if (keys["Space"] && me.onGround) { me.vy = JUMP; me.onGround = false; }
    }

    me.vy += GRAVITY; me.x += me.vx; me.y += me.vy;

    // collisions
    me.onGround = false;
    for (const p of platforms) {
      const py = p.y();
      if (me.x < p.x + p.w && me.x + me.w > p.x && me.y + me.h > py && me.y + me.h < py + p.h && me.vy > 0) {
        me.y = py - me.h; me.vy = 0; me.onGround = true;
      }
    }

    // camera
    camX = Math.max(0, me.x - canvas.width/2);

    // clear
    ctx.fillStyle = "#6aa5ff"; ctx.fillRect(0,0,canvas.width,canvas.height);

    // draw platforms
    ctx.fillStyle = "#8b4513";
    for (const pl of platforms) ctx.fillRect(pl.x - camX, pl.y(), pl.w, pl.h);

    // effects
    renderEffects();

    // online sync draw others
    if (online) {
      set(myRef, {
        x: me.x, y: me.y, vx: me.vx, vy: me.vy, w: me.w, h: me.h, onGround: me.onGround, facing: me.facing, nick: me.nick, skin: me.skin, color: me.color
      });
      for (const id in others) {
        if (id === playerId) continue;
        drawPlayerWrapper(others[id]);
      }
    }

    // draw me
    drawPlayerWrapper(me);
  }

  /* START */
  function start(isOnline) {
    online = isOnline;
    playing = true;
    document.getElementById("titleScreen").style.display = "none";
    document.getElementById("game").style.display = "block";
    resize();
    if (online) {
      document.getElementById("openChatBtn").style.display = "flex";
      onDisconnect(myRef).remove();
      onValue(playersRef, snap => {
        const data = snap.val() || {};
        for (const k in others) if (!data[k]) delete others[k];
        Object.assign(others, data);
      });
      // wire admin effects ref already done above
      document.getElementById("fireBtn").style.display = admin.isAdmin() ? "block" : "none";
    } else {
      document.getElementById("openChatBtn").style.display = "none";
    }
    loop();
  }

  document.getElementById("soloBtn").onclick = () => start(false);
  document.getElementById("multiBtn").onclick = () => start(true);

  /* CONFIG UI wiring */
  document.getElementById("configBtn").onclick = () => document.getElementById("configScreen").style.display = "flex";
  document.getElementById("closeConfig").onclick = () => {
    const n = document.getElementById("nickInput").value.trim(); if (n) me.nick = n;
    const skin = document.getElementById("skinSelect").value; if (skin) me.skin = skin;
    const col = document.getElementById("colorSelect").value; if (col) me.color = col;
    document.getElementById("configScreen").style.display = "none";
  };

  /* ADM modal */
  document.getElementById("adminBtn").onclick = () => document.getElementById("adminModal").style.display = "flex";
  document.getElementById("adminCancel").onclick = () => document.getElementById("adminModal").style.display = "none";
  document.getElementById("adminSubmit").onclick = () => {
    const pass = document.getElementById("adminPass").value || "";
    if (admin.tryPassword(pass)) {
      alert("Comandos de ADM ligados");
      document.getElementById("adminModal").style.display = "none";
      document.getElementById("fireBtn").style.display = "block";
      admin.enablePdfLocal();
    } else {
      alert("Senha incorreta");
    }
  };

  /* fire button */
  const fireBtn = document.getElementById("fireBtn");
  if (fireBtn) {
    fireBtn.onclick = () => {
      if (!admin.isAdmin()) { alert("Somente ADMs"); return; }
      // spawn effect in front of player
      const sx = me.x + (me.facing === 1 ? me.w + 6 : -6);
      const sy = me.y + me.h/2;
      admin.spawnEffect(sx, sy, me.facing, 700, 700);
    };
  }

  /* initial draw of effects (in case DB already has some) */
  // admin.wireEffectsRef already listening

  // expose
  window.__ME = me;
  window.__START = start;
  window.__ADMIN = admin;

});
