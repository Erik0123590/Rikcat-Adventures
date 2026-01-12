import { bullets } from "./bullets.js";
export function tryParry(me) {
    for(let i = bullets.length-1; i >= 0; i--) {
        const b = bullets[i];
        if(b.type !== 'parry') continue;
        const dx = Math.abs(b.x - me.x);
        const dy = Math.abs(b.y - (me.y + me.h/2));
        if(dx < 50 && dy < 50) {
            bullets.splice(i, 1);
            return true;
        }
    }
    return false;
}
