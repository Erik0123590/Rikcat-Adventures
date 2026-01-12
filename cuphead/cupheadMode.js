import { spawnBullet, updateBullets, drawBullets, bullets } from "./bullets.js";
import { tryParry } from "./parry.js";

const boss = {
    x: 800, y: 0, w: 100, h: 120, vx: -3, vy: 0,
    state: 'walking', timer: 0, hp: 100, facing: -1,
    shots: 0, parryIndex: 3
};

export default {
    init({ canvas }) {
        boss.x = canvas.width - 150;
        boss.state = 'walking';
        bullets.length = 0;
    },
    update(me) {
        boss.timer++;
        // Movimentação básica e troca de estado
        if (boss.state === 'walking') {
            boss.x += boss.vx;
            if (boss.x < 50 || boss.x > window.innerWidth - 150) boss.vx *= -1;
            if (boss.timer > 120) { boss.state = 'attacking'; boss.timer = 0; boss.shots = 0; boss.parryIndex = Math.floor(Math.random()*5); }
        } else if (boss.state === 'attacking') {
            if (boss.timer % 30 === 0 && boss.shots < 5) {
                const isParry = boss.shots === boss.parryIndex;
                spawnBullet({ x: boss.x, y: boss.y + 50, dir: me.x < boss.x ? -1 : 1, type: isParry ? 'parry' : 'normal' });
                boss.shots++;
            }
            if (boss.timer > 180) { boss.state = 'walking'; boss.timer = 0; }
        }
        updateBullets();
    },
    drawBeforePlayers(ctx, camX) {
        // Desenho simplificado do Boss (Caixa com luvas)
        ctx.fillStyle = "#e8b78e";
        ctx.fillRect(boss.x - camX, boss.y + 400, boss.w, boss.h); // Corpo
        ctx.fillStyle = "blue"; ctx.fillRect(boss.x - camX - 20, boss.y + 450, 30, 30); // Luva Esq
        ctx.fillStyle = "red"; ctx.fillRect(boss.x - camX + 90, boss.y + 450, 30, 30); // Luva Dir
    },
    drawAfterPlayers(ctx, camX) { drawBullets(ctx, camX); },
    tryParryLocal(me) { return tryParry(me); }
};
