// minigames/timeTrial.js
// Requer: ./firebase.js (exporta db, ref, set, push, onValue, remove, onDisconnect)

import { ref, set, onValue, push } from "../firebase.js";

/**
 * createTimeTrial(room, opts)
 * - room: string (ex: "room123")
 * - opts: { durationSec?, mapSeed? }
 *
 * Retorna API:
 * - join(playerId, meta)
 * - leave(playerId)
 * - start(delaySeconds)
 * - reportFinish(playerId, timeMs)
 * - onUpdate(cb) // cb(stateObj)
 * - destroy()
 */
export function createTimeTrial(room, opts = {}) {
  const basePath = `rooms/${room}/minigames/timeTrial`;
  const baseRef = ref(null, basePath);

  function write(obj) {
    return set(ref(null, basePath), obj);
  }

  // Initialize minimal structure if missing
  write({
    state: "waiting", // waiting | running | finished
    startAt: null,
    mapSeed: opts.mapSeed || Date.now(),
    players: {}
  }).catch(()=>{});

  let onUpdateCb = null;
  const listenerRef = ref(null, basePath);
  onValue(listenerRef, snap => {
    const val = snap.val() || {};
    if (onUpdateCb) onUpdateCb(val);
  });

  function join(playerId, meta = {}) {
    const p = {
      id: playerId,
      nick: meta.nick || "Player",
      finished: false,
      time: null,
      meta
    };
    // set player node
    set(ref(null, `${basePath}/players/${playerId}`), p);
  }

  function leave(playerId) {
    set(ref(null, `${basePath}/players/${playerId}`), null);
  }

  async function start(delaySeconds = 3) {
    const startAt = Date.now() + Math.max(0, delaySeconds) * 1000;
    await set(ref(null, `${basePath}/state`), "running");
    await set(ref(null, `${basePath}/startAt`), startAt);
  }

  function reportFinish(playerId, timeMs) {
    set(ref(null, `${basePath}/players/${playerId}/finished`), true);
    set(ref(null, `${basePath}/players/${playerId}/time`), timeMs);
    // also push to results list (optional leaderboard)
    push(ref(null, `${basePath}/results`), { playerId, timeMs, time: Date.now() }).catch(()=>{});
  }

  function onUpdate(cb) { onUpdateCb = cb; }

  function destroy() {
    onUpdateCb = null;
    set(ref(null, basePath), null).catch(()=>{}); // clears minigame (optional)
  }

  return { join, leave, start, reportFinish, onUpdate, destroy };
    }
