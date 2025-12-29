// rikcat.js — Drawn Rikcat atualizado
export function drawRikcat(ctx, p, camX) {
    if (!p._rk) p._rk = { t: 0, prevOnGround: !!p.onGround, landTimer: 0, walkCounter: 0 };
    const s = p._rk;
    s.t++;

    // detecta aterragem
    if (!s.prevOnGround && !!p.onGround) s.landTimer = 12;
    s.prevOnGround = !!p.onGround;

    const walking = Math.abs(p.vx || 0) > 0.5 && p.onGround;
    if (walking) s.walkCounter++; else s.walkCounter = 0;

    // bob
    let bob = walking ? Math.sin(s.walkCounter * 0.3)*3 : Math.sin(s.t*0.05)*1.5;

    // stretch/squash
    let stretchY = 1, stretchX = 1;
    if (!p.onGround) { const t = Math.min(Math.abs(p.vy||0)/20,0.4); stretchY=1+t; stretchX=1/stretchY; }
    else if (s.landTimer>0) { s.landTimer--; const prog = 1-(s.landTimer/12); stretchY=0.75+0.25*prog; stretchX=1/stretchY; }

    const cx = (p.x - camX) + (p.w/2||16);
    const baseY = p.y + (p.h/2||16) - bob;

    ctx.save();
    const facing = p.facing===-1?-1:1;
    ctx.translate(cx, baseY);
    if (walking) ctx.rotate(0.15);
    ctx.scale(facing*stretchX, stretchY);

    // cores
    const bodyColor = p.color||"#FFB000"; // default laranja
    const detailColor = "#FF2FA3";
    const outlineColor = "#000";

    ctx.lineWidth=2.5; ctx.lineCap="round"; ctx.lineJoin="round"; ctx.strokeStyle=outlineColor;

    // orelhas
    ctx.fillStyle=bodyColor;
    ctx.beginPath(); ctx.moveTo(-15,-18); ctx.lineTo(-32,-38); ctx.lineTo(-5,-28); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle=detailColor; ctx.beginPath(); ctx.moveTo(-18,-22); ctx.lineTo(-26,-32); ctx.lineTo(-12,-26); ctx.closePath(); ctx.fill();
    ctx.fillStyle=bodyColor; ctx.beginPath(); ctx.moveTo(15,-18); ctx.lineTo(32,-38); ctx.lineTo(5,-28); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle=detailColor; ctx.beginPath(); ctx.moveTo(18,-22); ctx.lineTo(26,-32); ctx.lineTo(12,-26); ctx.closePath(); ctx.fill();

    // corpo
    ctx.fillStyle=bodyColor; ctx.beginPath(); ctx.arc(0,0,20,0,Math.PI*2); ctx.fill(); ctx.stroke();

    // rosto
    ctx.fillStyle=outlineColor;
    ctx.beginPath(); ctx.roundRect(-10,-8,4,10,2); ctx.fill();
    ctx.beginPath(); ctx.roundRect(6,-8,4,10,2); ctx.fill();
    ctx.fillStyle=detailColor;
    ctx.beginPath(); ctx.moveTo(-4,2); ctx.lineTo(4,2); ctx.lineTo(0,7); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(0,7); ctx.lineTo(0,10); ctx.moveTo(-3,10); ctx.lineTo(3,10); ctx.stroke();

    ctx.restore();

    // nickname
    ctx.fillStyle="white"; ctx.font="bold 12px Arial"; ctx.textAlign="center";
    ctx.strokeStyle="black"; ctx.lineWidth=2;
    ctx.strokeText(p.nick||"Player", cx, p.y-25);
    ctx.fillText(p.nick||"Player", cx, p.y-25);
}
