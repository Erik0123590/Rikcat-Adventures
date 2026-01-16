import { Config } from "./config.js";

export function setupPlayer(rikcat) {
  document.getElementById("btnJump").onclick = () => {
    rikcat.jump();
  };
}
