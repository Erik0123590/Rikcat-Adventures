/* =====================================================
   Rikcat – OE5 Style (Base)
   OBS: Visual ainda NÃO está agradável, será melhorado
   futuramente. Lógica mantida como base.
===================================================== */

export class Rikcat {
  constructor(player) {
    this.p = player;

    this.animTime = 0;
    this.scaleX = 1;
    this.scaleY = 1;

    this.stretchTimer = 0;
  }

  update() {
    this.animTime++;

    // Reset stretch suavemente
    this.scaleX += (1 - this.scaleX) * 0.2;
    this.scaleY += (1 - this.scaleY) * 0.2;

    // Stretch apenas no pulo / aterrissagem
    if (this.stretchTimer > 0) {
      this.stretchTimer--;
    }
  }

  jumpStretch() {
    this.scaleY = 1.3;
    this.scaleX = 0.8;
    this.stretchTimer = 6;
  }

  landStretch() {
    this.scaleY = 0.7;
    this.scaleX = 1.2;
    this.stretchTimer = 6;
  }

  draw(ctx, camX) {
    const p = this.p;

    const baseX = p.x - camX + p.w / 2;
    let baseY = p.y + p.h / 2;

    let bob = 0;
    let earTilt = 0;

    /* ===== STATE ===== */
    const walking = Math.abs(p.vx) > 0.5 && p.onGround;

    if (walking) {
      // Andando: encosta no chão e flutua
      bob = Math.sin(this.animTime * 0.25) * 4;
      earTilt = Math.sin(this.animTime * 0.25) * 0.2;
    } else {
      // Idle: parado, sem flutuação exagerada
      bob = 0;
      earTilt = 0;
    }

    baseY += bob;

    ctx.save();
    ctx.translate(baseX, baseY);
    ctx.scale(p.facing * this.scaleX, this.scaleY);

    /* ===== BODY ===== */
    ctx.fillStyle = p.color || "#ff9900";
    ctx.beginPath();
    ctx.ellipse(0, 6, 14, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    /* ===== HEAD ===== */
    ctx.beginPath();
    ctx.ellipse(0, -8, 12, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    /* ===== EARS ===== */
    ctx.fillStyle = p.color || "#ff9900";

    // Left ear
    ctx.save();
    ctx.rotate(-0.6 + earTilt);
    ctx.beginPath();
    ctx.ellipse(-10, -18, 4, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Right ear
    ctx.save();
    ctx.rotate(0.6 + earTilt);
    ctx.beginPath();
    ctx.ellipse(10, -18, 4, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    /* ===== FACE ===== */
    ctx.fillStyle = "#000";

    // Eyes
    ctx.beginPath();
    ctx.arc(-4, -10, 1.5, 0, Math.PI * 2);
    ctx.arc(4, -10, 1.5, 0, Math.PI * 2);
    ctx.fill();

    // Mouth
    ctx.beginPath();
    ctx.arc(0, -6, 3, 0, Math.PI);
    ctx.stroke();

    ctx.restore();

    /* ===== NICK ===== */
    ctx.fillStyle = "white";
    ctx.font = "12px Arial";
    ctx.textAlign = "center";
    ctx.fillText(p.nick, baseX, p.y - 8);
  }
}
