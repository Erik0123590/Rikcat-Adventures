import { Config } from "./config.js";

document.getElementById("btnADM").onclick = () => {
  const senha = prompt("Coloque a senha");
  if (senha === "RikcatADM!2025") {
    alert("Comandos de ADM ligados");
    Config.admEnabled = true;
    Config.fireEnabled = true;
    document.getElementById("btnFire").classList.remove("hidden");
  }
};
