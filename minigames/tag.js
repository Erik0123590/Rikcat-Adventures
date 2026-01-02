// minigames/tag.js
import { ref, set, onValue, push } from "../firebase.js";

/**
 * createTag(room)
 * retorna:
 * - join(playerId, meta)
 * - leave(playerId)
 * - setIt(newPlayerId)
 * - getCurrent()
 * - onUpdate(cb)
 * - destroy()
 *
 * Regras:
 * - DB node: rooms/{room}/minigames/tag
 * - fields: state, it, lastChanged, scores:{playerId:seconds}
 */
export function createTag(room) {
  const basePath = `rooms/${room}/minigames/tag`;
  const baseRef = ref(null, basePath);

  // init
  set(ref(null, basePath), {
    state: "waiting",
    it: null,
    lastChanged: Date.now(),
    scores: {},
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

  // atomically switch 'it' by calculating scored time for previous it
  async function setIt(newId) {
    const now = Date.now();
    const snap = await new Promise(res => onValue(ref(null, basePath), s => res(s), { onlyOnce: true }));
    const state = snap.val() || {};
    const prev = state.it;
    const lastChanged = state.lastChanged || now;
    const scores = state.scores || {};

    if (prev && prev !== newId) {
      const deltaSec = Math.max(0, (now - lastChanged) / 1000);
      scores[prev] = (scores[prev] || 0) + deltaSec;
    }

    // set new it and lastChanged
    await set(ref(null, `${basePath}/it`), newId);
    await set(ref(null, `${basePath}/lastChanged`), now);
    await set(ref(null, `${basePath}/scores`), scores);
    // push event
    push(ref(null, `${basePath}/events`), { type:"setIt", by:newId, time:now }).catch(()=>{});
  }

  function getCurrent() {
    return onValue(ref(null, basePath), snap => snap.val());
  }

  function onUpdate(cb) { onUpdateCb = cb; }

  function destroy() {
    set(ref(null, basePath), null).catch(()=>{});
    onUpdateCb = null;
  }

  return { join, leave, setIt, onUpdate, destroy };
}
