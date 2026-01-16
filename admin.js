// admin.js — FO1

let admAtivo = false;
const SENHA_ADM = "RikcatADM!2025";

export function pedirSenhaADM() {
  const senha = prompt("Coloque a senha de ADM:");
  if (senha === SENHA_ADM) {
    admAtivo = true;
    alert("Comandos de ADM ligados");
    document.getElementById("admin-btn").style.display = "block";
  } else {
    alert("Senha incorreta");
  }
}

export function admLigado() {
  return admAtivo;
}
