// game.js — FO1 Base (corrigido para funcionar com o HTML)

import { db, ref, set, onValue, onDisconnect, push } from "./firebase.js";
import { drawRikcat_update } from "./rikcat.js";
import * as adminModule from "./admin.js";

window.addEventListener("DOMContentLoaded", () => {

  alert("GAME.JS CARREGOU");

  /* ===== CANVAS ===== */
  const canvas = document.getElementById("canvas");
  const ctx = canvas.getContext("2d");

  function resize() {
    canvas.width = innerWidth;
    canvas.height = innerHeight;
  }
  window.addEventListener("resize", resize);
  resize();

  /* ===== CONFIG ===== */
  const GRAVITY = 0.6;
  const JUMP = -12;
  const SPEED = 5;

  const room = "online_salas_1";
  const playerId = "p_" + Math.floor(Math.random() * 999999);

  /* ===== FIREBASE ===== */
  const myRef = ref(db, `rooms/${room}/players/${playerId}`);
  const playersRef = ref(db, `rooms/${room}/players`);
  const chatRef = ref(db, `rooms/${room}/chat`);

  /* ===== PLAYER ===== */
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
    color: "#FFB000"
  };

  let playing = false;
  let online = false;
  let camX = 0;

  const others = {};

  /* ===== INPUT ===== */
  const keys = {};

  window.addEventListener("keydown", e => keys[e.code] = true);
  window.addEventListener("keyup", e => keys[e.code] = false);

  function bindTouch(id, key) {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener("touchstart", e => {
      e.preventDefault();
      keys[key] = true;
    }, { passive: false });
    el.addEventListener("touchend", e => {
      e.preventDefault();
      keys[key] = false;
    }, { passive: false });
  }

  bindTouch("left", "ArrowLeft");
  bindTouch("right", "ArrowRight");
  bindTouch("jump", "Space");

  /* ===== CHAT ===== */
  const chatBox = document.getElementById("chatBox");
  const chatInput = document.getElementById("chatInput");
  const chatBtn = document.getElementById("openChatBtn");
  const chatContainer = document.getElementById("chatContainer");

  let chatOpen = false;

  if (chatBtn) {
    chatBtn.onclick = () => {
      chatOpen = !chatOpen;
      chatContainer.style.display = chatOpen ? "flex" : "none";
      if (chatOpen) chatInput.focus();
    };
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

  onValue(chatRef, snap => {
    if (!chatBox) return;
    chatBox.innerHTML = "";
    const data = snap.val() || {};
    Object.values(data).slice(-30).forEach(m => {
      const d = document.createElement("div");
      d.innerHTML = `<b>${m.sender}:</b> ${m.text}`;
      chatBox.appendChild(d);
    });
    chatBox.scrollTop = chatBox.scrollHeight;
  });

  /* ===== PLATAFORMAS ===== */
  const platforms = [
    { x: 0, y: () => canvas.height - 40, w: 3000, h: 40 },
    { x: 250, y: () => canvas.height - 120, w: 140, h: 20 },
    { x: 500, y: () => canvas.height - 200, w: 140, h: 20 }
  ];

  /* ===== PLAYERS DB ===== */
  onValue(playersRef, snap => {
    const data = snap.val() || {};
    for (const id in others) if (!data[id]) delete others[id];
    Object.assign(others, data);
  });

  /* ===== LOOP ===== */
  function loop() {
    if (!playing) return;
    requestAnimationFrame(loop);

    const typing = chatOpen && document.activeElement === chatInput;

    if (!typing) {
      if (keys["ArrowLeft"]) {
        me.vx = -SPEED;
        me.facing = -1;
      } else if (keys["ArrowRight"]) {
        me.vx = SPEED;
        me.facing = 1;
      } else {
        me.vx *= 0.8;
      }

      if (keys["Space"] && me.onGround) {
        me.vy = JUMP;
        me.onGround = false;
      }
    }

    me.vy += GRAVITY;
    me.x += me.vx;
    me.y += me.vy;

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

    camX = Math.max(0, me.x - canvas.width / 2);

    /* DRAW */
    ctx.fillStyle = "#6aa5ff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#8b4513";
    platforms.forEach(p => ctx.fillRect(p.x - camX, p.y(), p.w, p.h));

    if (online) {
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
        if (id !== playerId) {
          drawRikcat_update(ctx, others[id], camX);
        }
      }
    }

    drawRikcat_update(ctx, me, camX);
  }

  /* ===== START ===== */
  function start(isOnline) {
    online = isOnline;
    playing = true;

    document.getElementById("titleScreen").style.display = "none";
    document.getElementById("game").style.display = "block";

    if (online) {
      chatBtn.style.display = "flex";
      onDisconnect(myRef).remove();
    } else {
      chatBtn.style.display = "none";
    }

    loop();
  }

  /* ===== UI ===== */
  document.getElementById("soloBtn").onclick = () => start(false);
  document.getElementById("multiBtn").onclick = () => start(true);

});
