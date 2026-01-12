export const bullets = [];
export function spawnBullet({x, y, dir, type}) {
    bullets.push({ x, y: y + 400, vx: dir * 7, type, id: Math.random() });
}
export function updateBullets() {
    for(let i = bullets.length-1; i>=0; i--) {
        bullets[i].x += bullets[i].vx;
        if(bullets[i].x < -500 || bullets[i].x > 5000) bullets.splice(i, 1);
    }
}
export function drawBullets(ctx, camX) {
    bullets.forEach(b => {
        ctx.fillStyle = b.type === 'parry' ? "#00ff66" : "#ff3300";
        ctx.beginPath(); ctx.arc(b.x - camX, b.y, 10, 0, Math.PI*2); ctx.fill();
    });
}
