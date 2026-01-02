// minigames/ctf.js
import { ref, set, onValue, push } from "../firebase.js";

/**
 * createCTF(room)
 * - base DB: rooms/{room}/minigames/ctf
 * structure:
 * { state, flags: {red:{holder:null, atBase:true}, blue:...}, scores:{red:0,blue:0}, players:{} }
 */
export function createCTF(room) {
  const basePath = `rooms/${room}/minigames/ctf`;
  set(ref(null, basePath), {
    state: "waiting",
    flags: {
      red: { holder: null, atBase: true },
      blue: { holder: null, atBase: true }
    },
    scores: { red: 0, blue: 0 },
    players: {}
  }).catch(()=>{});

  let onUpdateCb = null;
  onValue(ref(null, basePath), snap => {
    const val = snap.val() || {};
    if (onUpdateCb) onUpdateCb(val);
  });

  async function join(playerId, team = "red", meta = {}) {
    await set(ref(null, `${basePath}/players/${playerId}`), { id: playerId, team, nick: meta.nick || "Player" });
  }

  function leave(playerId) {
    set(ref(null, `${basePath}/players/${playerId}`), null);
  }

  // pickup: player picks flag if available
  async function pickupFlag(color, playerId) {
    const stateSnap = await new Promise(res => onValue(ref(null, basePath), s => res(s), { onlyOnce: true }));
    const state = stateSnap.val() || {};
    const flag = (state.flags && state.flags[color]) || {};
    if (flag.holder) return false; // already taken
    // assign holder
    await set(ref(null, `${basePath}/flags/${color}/holder`), playerId);
    await set(ref(null, `${basePath}/flags/${color}/atBase`), false);
    push(ref(null, `${basePath}/events`), { type:"pickup", color, playerId, time: Date.now() }).catch(()=>{});
    return true;
  }

  // capture: called when player with opponent flag reaches own base
  async function captureFlag(playerId) {
    const snap = await new Promise(res => onValue(ref(null, basePath), s => res(s), { onlyOnce: true }));
    const state = snap.val() || {};
    const players = state.players || {};
    const p = players[playerId];
    if (!p) return false;
    const team = p.team;
    const enemyColor = team === "red" ? "blue" : "red";
    const flag = (state.flags && state.flags[enemyColor]) || {};
    if (flag.holder !== playerId) return false;
    // score point to player's team
    const scores = state.scores || { red:0, blue:0 };
    scores[team] = (scores[team]||0) + 1;
    // reset flag to base
    await set(ref(null, `${basePath}/flags/${enemyColor}`), { holder: null, atBase: true });
    await set(ref(null, `${basePath}/scores`), scores);
    push(ref(null, `${basePath}/events`), { type:"capture", by: playerId, team, time:Date.now() }).catch(()=>{});
    return true;
  }

  function onUpdate(cb) { onUpdateCb = cb; }

  function destroy() {
    set(ref(null, basePath), null).catch(()=>{});
    onUpdateCb = null;
  }

  return { join, leave, pickupFlag, captureFlag, onUpdate, destroy };
}
