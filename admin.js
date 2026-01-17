// admin.js — gerenciamento simples de senha ADM
let admAtivo = false;
const SENHA_ADM = "RikcatADM!2025";

export function pedirSenhaADM(){
  const s = prompt("Coloque a senha de ADM:");
  if(s === SENHA_ADM){
    admAtivo = true;
    alert("Comandos de ADM ligados");
    const b = document.getElementById("adminBtn");
    if(b) b.style.display = "block";
  } else {
    alert("Senha incorreta");
  }
}

export function admLigado(){ return admAtivo; }
