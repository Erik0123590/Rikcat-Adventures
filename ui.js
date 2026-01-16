import { Config } from "./config.js";

const menu = document.getElementById("menu");
const config = document.getElementById("config");
const canvas = document.getElementById("gameCanvas");
const controls = document.getElementById("controls");

document.getElementById("btnPlay").onclick = () => {
  menu.classList.add("hidden");
  canvas.style.display = "block";
  controls.classList.remove("hidden");
  Config.gameStarted = true;
};

document.getElementById("btnConfig").onclick = () => {
  menu.classList.add("hidden");
  config.classList.remove("hidden");
};

document.getElementById("btnBack").onclick = () => {
  config.classList.add("hidden");
  menu.classList.remove("hidden");
};
