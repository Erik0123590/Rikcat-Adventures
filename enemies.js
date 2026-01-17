// enemies.js — placeholder básico (expanda conforme sua versão antiga)
export const enemies = [];

// exemplo de spawn simples (não ligado automaticamente)
export function spawnEnemy(x, y){
  const e = { x, y, vx:0, vy:0, w:32, h:32, hp:1 };
  enemies.push(e);
  return e;
}
