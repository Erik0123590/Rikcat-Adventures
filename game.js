import { db, ref, set, onValue, onDisconnect, push } from "./firebase.js";
import { drawRikcat } from "./rikcat.js";
import cupheadMode from "./cuphead/cupheadMode.js";

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
function resize(){ canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
window.addEventListener("resize", resize); resize();

/* State */
const GRAVITY = 0.6, JUMP = -12, SPEED = 5;
const playerId = "p_" + Math.floor(Math.random()*999999);
const me = { x:100, y:100, vx:0, vy:0, w:32, h:32, onGround:false, facing:1, nick:"Convidado", skin:"rikcat", color:"#FFB000" };
let playing = false, online = false, gameMode = "normal";
let camX = 0, lastSyncTime = 0;
const others = {};

/* Platforms */
const normalPlatforms = [
    { x:0, y:()=>canvas.height-40, w:3000, h:40 },
    { x:250, y:()=>canvas.height-120, w:140, h:20 }
];
const bossPlatforms = [
    { x:0, y:()=>canvas.height-40, w:5000, h:40 },
    { x:150, y:()=>canvas.height-250, w:200, h:20 },
    { x:()=>canvas.width-350, y:()=>canvas.height-250, w:200, h:20 }
];
let currentPlatforms = normalPlatforms;

/* Input Handling (Corrigido para evitar auto-parry) */
window.keys = {};
function handleInputDown(code) {
    if (code === "Space") {
        if (me.onGround) {
            me.vy = JUMP; me.onGround = false;
            if (gameMode === "cuphead") { me._cup = { canParry: true, hasParried: false }; }
        } else if (gameMode === "cuphead" && me._cup?.canParry && !me._cup?.hasParried) {
            if (cupheadMode.tryParryLocal(me)) {
                me._cup.hasParried = true;
                me.vy = -10;
            }
        }
    }
}
window.addEventListener("keydown", e => { if(!window.keys[e.code]) handleInputDown(e.code); window.keys[e.code] = true; });
window.addEventListener("keyup", e => { window.keys[e.code] = false; });

/* UI logic */
document.getElementById("playBtn").onclick = () => document.getElementById("playMenu").style.display = "flex";
document.getElementById("cupheadBtn").onclick = () => startGame("cuphead");
document.getElementById("soloBtn").onclick = () => startGame("solo");

function startGame(mode) {
    document.querySelectorAll("#titleScreen, #playMenu, #othersMenu").forEach(m => m.style.display = "none");
    document.getElementById("game").style.display = "block";
    gameMode = mode;
    currentPlatforms = (mode === "cuphead") ? bossPlatforms : normalPlatforms;
    playing = true;
    if(mode === "cuphead") cupheadMode.init({ me, canvas, ctx });
    loop();
}

function updatePhysics() {
    if(window.keys["ArrowLeft"]) { me.vx = -SPEED; me.facing = -1; }
    else if(window.keys["ArrowRight"]) { me.vx = SPEED; me.facing = 1; }
    else me.vx *= 0.85;

    me.vy += GRAVITY; me.x += me.vx; me.y += me.vy;
    me.onGround = false;

    for(const p of currentPlatforms) {
        const py = typeof p.y === 'function' ? p.y() : p.y;
        const px = typeof p.x === 'function' ? p.x() : p.x;
        if(me.x < px + p.w && me.x + me.w > px && me.y + me.h > py && me.y + me.h < py + 15 && me.vy > 0) {
            me.y = py - me.h; me.vy = 0; me.onGround = true;
        }
    }
}

function loop() {
    if(!playing) return;
    requestAnimationFrame(loop);
    updatePhysics();
    if(gameMode === "cuphead") cupheadMode.update(me);

    camX = (gameMode === "cuphead") ? 0 : Math.max(0, me.x - canvas.width/2);
    ctx.fillStyle = "#6aa5ff"; ctx.fillRect(0,0,canvas.width,canvas.height);
    
    ctx.fillStyle = "#8b4513";
    currentPlatforms.forEach(p => {
        const px = typeof p.x === 'function' ? p.x() : p.x;
        const py = typeof p.y === 'function' ? p.y() : p.y;
        ctx.fillRect(px - camX, py, p.w, p.h);
    });

    if(gameMode === "cuphead") cupheadMode.drawBeforePlayers(ctx, camX);
    drawRikcat(ctx, me, camX);
    if(gameMode === "cuphead") cupheadMode.drawAfterPlayers(ctx, camX);
  }
