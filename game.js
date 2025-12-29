// game.js (FO1 base) — usa rikcat.js para desenhar o player
// IMPORTS: firebase.js must export db, ref, set, onValue, onDisconnect, push
import { db, ref, set, onValue, onDisconnect, push } from "./firebase.js";
import { drawRikcat_update } from "./rikcat.js"; // function that updates internal state + draws

// Wait DOM ready to query elements
window.addEventListener("DOMContentLoaded", () => {
  alert("GAME.JS CARREGOU — FO1");

  // DOM
  const canvas = document.getElementById("canvas");
  const ctx = canvas.getContext("2d");

  const titleScreen = document.getElementById("titleScreen");
  const soloBtn = document.getElementById("soloBtn");
  const multiBtn = document.getElementById("multiBtn");
  const gameDiv = document.getElementById("game");

  const leftBtn = document.getElementById("left");
  const rightBtn = document.getElementById("right");
  const jumpBtn = document.getElementById("jump");

  const openChatBtn = document.getElementById("openChatBtn");
  const chatWrap = document.getElementById("chatBoxWrap");
  const chatBox = document.getElementById("chatBox");
  const chatInput = document.getElementById("chatInput");

  // Resize helper
  function resize() {
    canvas.width = innerWidth;
    canvas.height = innerHeight;
  }
  addEventListener("resize", resize);
  resize();

  /* ===== CONFIG / STATE ===== */
  const GRAVITY = 0.6;
  const JUMP = -12;
  const SPEED = 5;

  const room = "fogo_online_1";
  const playerId = "p_" + Math.floor(Math.random() * 999999);

  const myRef = ref(db, `rooms/${room}/players/${playerId}`);
  const playersRef = ref(db, `rooms/${room}/players`);
  const chatRef = ref(db, `rooms/${room}/chat`);

  // player state
  const me = {
    x: 100, y: 100, vx: 0, vy: 0, w: 32, h: 32,
    onGround: false, facing: 1, nick: "Convidado", skin: "rikcat", color: "#FFB000"
  };

  let playing = false;
  let online = false;
  let camX = 0;
  const others = {};

  /* ===== INPUT ===== */
  const keys = {};

  // keyboard
  window.addEventListener("keydown", e => { keys[e.code] = true; });
  window.addEventListener("keyup",   e => { keys[e.code] = false; });

  // mobile buttons (touch)
  const bindTouch = (el, code) => {
    if (!el) return;
    el.addEventListener("touchstart", e => { e.preventDefault(); keys[code] = true; }, { passive: false });
    el.addEventListener("touchend",   e => { e.preventDefault(); keys[code] = false; }, { passive: false });
  };
  bindTouch(leftBtn, "ArrowLeft");
  bindTouch(rightBtn, "ArrowRight");
  bindTouch(jumpBtn, "Space");

  /* ===== CHAT ===== */
  let chatOpen = false;
  openChatBtn.style.display = "none"; // default hidden (shown only in online)
  openChatBtn.addEventListener("click", () => {
    chatOpen = !chatOpen;
    chatWrap.style.display = chatOpen ? "flex" : "none";
    if (chatOpen) chatInput.focus();
  });

  chatInput.addEventListener("keydown", e => {
    if (e.key === "Enter" && chatInput.value.trim()) {
      push(chatRef, { sender: me.nick, text: chatInput.value.trim(), time: Date.now() });
      chatInput.value = "";
    }
  });

  onValue(chatRef, snap => {
    chatBox.innerHTML = "";
    const data = snap.val();
    if (!data) return;
    // show last 30
    Object.values(data).slice(-30).forEach(m => {
      const d = document.createElement("div");
      d.innerHTML = `<b>${m.sender}:</b> ${m.text}`;
      chatBox.appendChild(d);
    });
    chatBox.scrollTop = chatBox.scrollHeight;
  });

  /* ===== MAPA ===== */
  const platforms = [
    { x: 0, y: () => canvas.height - 40, w: 3000, h: 40 },
    { x: 200, y: () => canvas.height - 120, w: 140, h: 20 },
    { x: 420, y: () => canvas.height - 200, w: 140, h: 20 },
    { x: 650, y: () => canvas.height - 260, w: 140, h: 20 }
  ];

  /* ===== PLAYERS DB sync ===== */
  onValue(playersRef, snap => {
    const data = snap.val() || {};
    // keep others in sync; don't override me
    for (const k in others) if (!data[k]) delete others[k];
    Object.assign(others, data);
  });

  /* ===== DRAW HELPERS ===== */
  function drawPlatform(p) {
    ctx.fillStyle = "#8B4513";
    ctx.fillRect(p.x - camX, p.y(), p.w, p.h);
  }

  /* ===== LOOP ===== */
  function updateLoop() {
    if (!playing) return;
    requestAnimationFrame(updateLoop);

    // typing block
    const typing = chatOpen && document.activeElement === chatInput;

    if (!typing) {
      // horizontal movement
      if (keys["ArrowLeft"]) { me.vx = -SPEED; me.facing = -1; }
      else if (keys["ArrowRight"]) { me.vx = SPEED; me.facing = 1; }
      else me.vx *= 0.8;

      // jump
      if (keys["Space"] && me.onGround) {
        me.vy = JUMP;
        me.onGround = false;
      }
    }

    // physics
    me.vy += GRAVITY;
    me.x += me.vx;
    me.y += me.vy;

    // collisions
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

    // clear
    ctx.fillStyle = "#6aa5ff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // draw platforms
    for (const p of platforms) drawPlatform(p);

    // sync online and draw others
    if (online) {
      // push my state (simple payload)
      set(myRef, {
        x: me.x, y: me.y, vx: me.vx, vy: me.vy,
        w: me.w, h: me.h, onGround: me.onGround,
        facing: me.facing, nick: me.nick, skin: me.skin, color: me.color
      });
      // draw other players from DB
      for (const id in others) {
        if (id === playerId) continue; // skip self if exists in others
        try {
          const p = others[id];
          if (!p) continue;
          // ensure defaults
          p.skin = p.skin || "rikcat";
          p.color = p.color || "#FFB000";
          p.facing = p.facing || 1;
          drawRikcat_update(ctx, p, camX);
        } catch (err) {
          // ignore malformed
        }
      }
    }

    // draw local player
    drawRikcat_update(ctx, me, camX);
  }

  /* ===== START / UI wiring ===== */
  function startGame(isOnline) {
    online = !!isOnline;
    playing = true;
    titleScreen.style.display = "none";
    gameDiv.style.display = "block";
    resize(); // ensure canvas sized

    if (online) {
      openChatBtn.style.display = "flex";
      onDisconnect(myRef).remove();
      // initial players snapshot already set by onValue above
    } else {
      openChatBtn.style.display = "none";
    }

    updateLoop();
  }

  soloBtn.onclick = () => startGame(false);
  multiBtn.onclick = () => startGame(true);

  // expose in console to debug quickly
  window.__ME = me;
  window.__START = startGame;
});
