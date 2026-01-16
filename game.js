import {
  db,
  ref,
  set,
  push,
  onValue,
  onDisconnect
} from "./firebase.js";

import { pedirSenhaADM, admLigado } from "./admin.js";
import { drawRikcat } from "./rikcat.js";

console.log("GAME.JS CARREGOU");

// Canvas
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

// Resize handling (robusto)
function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener("resize", resize);
resize();

// Scene draw helper
function drawScene() {
  // sky
  ctx.fillStyle = "#87ceeb";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // ground
  const groundH = 60;
  ctx.fillStyle = "#3e7a2f";
  ctx.fillRect(0, canvas.height - groundH, canvas.width, groundH);
}

// Estado
let modo = null;
let player = { x: 100, y: canvas.height - 100, vx: 0 };
let keys = {};

// Chat
const chatBox = document.getElementById("chat");
const messages = document.getElementById("messages");
const chatInput = document.getElementById("chatInput");

// Menu
window.startSolo = () => {
  modo = "solo";
  document.getElementById("menu").style.display = "none";
  chatBox.style.display = "block";
};

window.startMulti = () => {
  modo = "multi";
  document.getElementById("menu").style.display = "none";
  chatBox.style.display = "block";
  conectarMultiplayer();
};

window.openConfig = () => {
  pedirSenhaADM();
};

// Teclado
window.addEventListener("keydown", e => keys[e.key] = true);
window.addEventListener("keyup", e => keys[e.key] = false);

// Chat
if (chatInput) {
  chatInput.addEventListener("keydown", e => {
    if (e.key === "Enter" && chatInput.value.trim()) {
      push(ref(db, "chat"), {
        text: chatInput.value
      });
      chatInput.value = "";
    }
  });
}

if (messages) {
  onValue(ref(db, "chat"), snap => {
    messages.innerHTML = "";
    snap.forEach(msg => {
      const div = document.createElement("div");
      div.textContent = msg.val().text;
      messages.appendChild(div);
    });
  });
}

// Multiplayer
function conectarMultiplayer() {
  const playerRef = push(ref(db, "players"));
  set(playerRef, player);

  onDisconnect(playerRef).remove();

  onValue(ref(db, "players"), snap => {
    // draw background first
    drawScene();

    snap.forEach(p => {
      const data = p.val();
      // draw each player's Rikcat
      drawRikcat(ctx, data.x, data.y);
    });
  });

  setInterval(() => {
    set(playerRef, player);
  }, 100);
}

// Main loop
function update() {
  // simple horizontal movement
  if (keys["ArrowRight"]) player.x += 4;
  if (keys["ArrowLeft"]) player.x -= 4;

  // clamp to screen
  if (player.x < 0) player.x = 0;
  if (player.x > canvas.width - 40) player.x = canvas.width - 40;

  // draw scene and local player
  drawScene();
  drawRikcat(ctx, player.x, player.y);

  requestAnimationFrame(update);
}

update();

// show admin button if adm is enabled (polling is fine here)
setInterval(() => {
  if (admLigado()) {
    const btn = document.getElementById("admin-btn");
    if (btn) btn.style.display = "block";
  }
}, 500);

// ADM button action (placeholder)
const adminBtn = document.getElementById("admin-btn");
if (adminBtn) {
  adminBtn.onclick = () => {
    if (admLigado()) {
      alert("🔥 Poder de fogo ativado (placeholder)");
    } else {
      alert("ADM não ativado");
    }
  };
}
