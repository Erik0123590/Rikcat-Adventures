// game.js
import {
  db,
  ref,
  set,
  push,
  onValue,
  onDisconnect
} from "./firebase.js";

import { pedirSenhaADM, admLigado } from "./admin.js";

console.log("GAME.JS CARREGOU");

// Canvas
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

// Estado
let modo = null;
let player = { x: 100, y: 300, vx: 0 };
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
chatInput.addEventListener("keydown", e => {
  if (e.key === "Enter" && chatInput.value.trim()) {
    push(ref(db, "chat"), {
      text: chatInput.value
    });
    chatInput.value = "";
  }
});

onValue(ref(db, "chat"), snap => {
  messages.innerHTML = "";
  snap.forEach(msg => {
    const div = document.createElement("div");
    div.textContent = msg.val().text;
    messages.appendChild(div);
  });
});

// Multiplayer
function conectarMultiplayer() {
  const playerRef = push(ref(db, "players"));
  set(playerRef, player);

  onDisconnect(playerRef).remove();

  onValue(ref(db, "players"), snap => {
    ctx.clearRect(0,0,canvas.width,canvas.height);
    snap.forEach(p => {
      const data = p.val();
      ctx.fillStyle = "orange";
      ctx.fillRect(data.x, data.y, 40, 40);
    });
  });

  setInterval(() => {
    set(playerRef, player);
  }, 100);
}

// Loop
function update() {
  if (keys["ArrowRight"]) player.x += 4;
  if (keys["ArrowLeft"]) player.x -= 4;

  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle = "orange";
  ctx.fillRect(player.x, player.y, 40, 40);

  requestAnimationFrame(update);
}

update();

// ADM botão
document.getElementById("admin-btn").onclick = () => {
  if (admLigado()) {
    alert("🔥 Poder de fogo ativado (placeholder)");
  }
};
