// minigames/survival.js
import { ref, set, onValue, push } from "../firebase.js";

/**
 * createSurvival(room)
 * - structure: rooms/{room}/minigames/survival
 * { state, wave:0, spawns: { id: { type, x, y, spawnAt, hp } }, players:{} }
 */
export function createSurvival(room) {
  const basePath = `rooms/${room}/minigames/survival`;
  set(ref(null, basePath), {
    state: "waiting",
    wave: 0,
    spawns: {},
    players: {}
  }).catch(()=>{});

  let onUpdateCb = null;
  onValue(ref(null, basePath), snap => {
    const val = snap.val() || {};
    if (onUpdateCb) onUpdateCb(val);
  });

  async function join(playerId, meta = {}) {
    await set(ref(null, `${basePath}/players/${playerId}`), { id: playerId, nick: meta.nick || "Player" });
  }

  function leave(playerId) {
    set(ref(null, `${basePath}/players/${playerId}`), null);
  }

  // start next wave: increments wave and optionally schedule spawns
  async function startNextWave(waveConfig = {}) {
    const now = Date.now();
    const wave = (waveConfig.waveNum !== undefined) ? waveConfig.waveNum : (waveConfig.currentWave || 1);
    // simple spawn schedule passed by caller: waveConfig.spawns = [{type,x,y,delay}]
    await set(ref(null, `${basePath}/state`), "running");
    await set(ref(null, `${basePath}/wave`), wave);
    if (Array.isArray(waveConfig.spawns)) {
      for (const s of waveConfig.spawns) {
        const spawnAt = now + (s.delay || 0);
        const id = "s_" + Math.random().toString(36).substr(2,9);
        const node = { id, type: s.type || "grunt", x:s.x||0, y:s.y||0, spawnAt, hp: s.hp || 1 };
        await set(ref(null, `${basePath}/spawns/${id}`), node);
      }
    }
    push(ref(null, `${basePath}/events`), { type:"waveStart", wave, time: now }).catch(()=>{});
  }

  // remove spawn (enemy died) - client should call when enemy is killed
  function removeSpawn(spawnId) {
    set(ref(null, `${basePath}/spawns/${spawnId}`), null);
  }

  function onUpdate(cb) { onUpdateCb = cb; }

  function destroy() {
    set(ref(null, basePath), null).catch(()=>{});
    onUpdateCb = null;
  }

  return { join, leave, startNextWave, removeSpawn, onUpdate, destroy };
}
