import { db, ref, set, onValue } from "./firebase.js";
import { Config } from "./config.js";
import { Rikcat } from "./rikcat.js";
import { setupPlayer } from "./player.js";

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const rikcat = new Rikcat();
setupPlayer(rikcat);

function loop() {
  if (Config.gameStarted) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    rikcat.update();
    rikcat.draw(ctx);
  }
  requestAnimationFrame(loop);
}

loop();
