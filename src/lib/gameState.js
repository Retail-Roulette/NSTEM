/**
 * Game state management - works with Firebase or local fallback
 */
import { db } from './firebase';
import { ref, set, onValue, get, update } from 'firebase/database';

const PARTIES_KEY = 'parties';
const LS_KEY = 'retail_royale_parties';

function generatePartyCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

function generatePlayerId() {
  return Math.random().toString(36).slice(2, 12);
}

export function createPartyCode() {
  return generatePartyCode();
}

export function createPlayerId() {
  return generatePlayerId();
}

// Local fallback when Firebase not configured
function getLocalParties() {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || '{}');
  } catch {
    return {};
  }
}

function setLocalParty(code, data) {
  const parties = getLocalParties();
  parties[code] = data;
  localStorage.setItem(LS_KEY, JSON.stringify(parties));
}

function getLocalParty(code) {
  return getLocalParties()[code] || null;
}

export async function createParty(config) {
  const code = generatePartyCode();
  const hostId = config.hostId || generatePlayerId();
  const hostName = config.hostName || 'Host';
  const partyData = {
    code,
    hostId,
    store: config.store,
    mode: config.mode,
    rounds: config.rounds,
    timePerRound: config.timePerRound,
    categories: config.categories || ['All Categories'],
    numTeams: config.numTeams || 2,
    players: {
      [hostId]: { id: hostId, name: hostName, team: null },
    },
    teams: config.mode === 'teams' ? Object.fromEntries(
      Array.from({ length: Math.max(2, config.numTeams || 2) }, (_, i) => [`team${i + 1}`, []])
    ) : null,
    unassigned: [hostId],
    state: 'lobby',
    currentRound: 0,
    roundResults: {},
    gameResults: {},
    createdAt: Date.now(),
  };

  if (db) {
    await set(ref(db, `${PARTIES_KEY}/${code}`), partyData);
  } else {
    setLocalParty(code, partyData);
  }
  return { code, partyData, hostId };
}

export async function joinParty(code, playerName) {
  const playerId = generatePlayerId();
  if (db) {
    const partyRef = ref(db, `${PARTIES_KEY}/${code}`);
    const snap = await get(partyRef);
    if (!snap.exists()) return { error: 'Party not found' };
    const party = snap.val();
    const updates = {};
    updates[`players/${playerId}`] = { id: playerId, name: playerName, team: null };
    updates[`unassigned`] = [...(party.unassigned || []), playerId];
    await update(partyRef, updates);
    return { playerId, party: { ...party, ...updates } };
  } else {
    const party = getLocalParty(code);
    if (!party) return { error: 'Party not found' };
    party.players = party.players || {};
    party.players[playerId] = { id: playerId, name: playerName, team: null };
    party.unassigned = party.unassigned || [];
    party.unassigned.push(playerId);
    setLocalParty(code, party);
    return { playerId, party };
  }
}

export async function getParty(code) {
  if (db) {
    const snap = await get(ref(db, `${PARTIES_KEY}/${code}`));
    return snap.exists() ? snap.val() : null;
  }
  return getLocalParty(code);
}

export function subscribeToParty(code, callback) {
  if (db) {
    return onValue(ref(db, `${PARTIES_KEY}/${code}`), (snap) => {
      callback(snap.exists() ? snap.val() : null);
    });
  }
  // Local polling fallback
  const id = setInterval(() => callback(getLocalParty(code)), 1500);
  return () => clearInterval(id);
}

export async function updateParty(code, updates) {
  if (db) {
    await update(ref(db, `${PARTIES_KEY}/${code}`), updates);
  } else {
    const party = getLocalParty(code);
    if (party) {
      Object.assign(party, updates);
      setLocalParty(code, party);
    }
  }
}

export async function assignPlayerToTeam(code, playerId, teamKey) {
  const party = await getParty(code);
  if (!party) return;
  const players = { ...party.players };
  const unassigned = (party.unassigned || []).filter(id => id !== playerId);
  players[playerId] = { ...players[playerId], team: teamKey };
  const teams = { ...party.teams };
  Object.keys(teams || {}).forEach(t => {
    teams[t] = (teams[t] || []).filter(id => id !== playerId);
  });
  if (teamKey) {
    teams[teamKey] = [...(teams[teamKey] || []), playerId];
  } else {
    unassigned.push(playerId);
  }
  await updateParty(code, { players, unassigned, teams });
}

export async function startGame(code, gameState) {
  await updateParty(code, {
    state: 'countdown',
    currentRound: 1,
    ...gameState,
  });
}

export async function updateGameState(code, updates) {
  await updateParty(code, updates);
}

export async function recordScan(code, playerId, timeTaken, points, teamKey = null) {
  const party = await getParty(code);
  if (!party) return;
  const roundKey = `round${party.currentRound}`;
  const results = party.roundResults || {};
  results[roundKey] = results[roundKey] || {};
  if (teamKey) {
    // Teams: first team member to find it sets the team's time (don't overwrite with slower time)
    const existing = results[roundKey][teamKey];
    if (!existing || timeTaken < existing.time) {
      results[roundKey][teamKey] = { time: timeTaken, points };
    }
  } else {
    results[roundKey][playerId] = { time: timeTaken, points };
  }
  await updateParty(code, { roundResults: results });
}

/**
 * Play Again: create a new party with a new code, same settings and same players (everyone stays in lobby).
 * Writes redirectToCode on the old party so other clients can navigate to the new lobby.
 */
export async function playAgain(code) {
  const party = await getParty(code);
  if (!party) return { error: 'Party not found' };
  const newCode = generatePartyCode();
  const newPartyData = {
    code: newCode,
    hostId: party.hostId,
    store: party.store,
    mode: party.mode,
    rounds: party.rounds,
    timePerRound: party.timePerRound,
    categories: party.categories || ['All Categories'],
    numTeams: party.numTeams || 2,
    players: { ...(party.players || {}) },
    teams: party.teams ? Object.fromEntries(
      Object.entries(party.teams).map(([k, v]) => [k, [...(v || [])]])
    ) : null,
    unassigned: [...(party.unassigned || [])],
    state: 'lobby',
    currentRound: 0,
    roundResults: {},
    gameResults: {},
    createdAt: Date.now(),
  };
  if (db) {
    await set(ref(db, `${PARTIES_KEY}/${newCode}`), newPartyData);
    await update(ref(db, `${PARTIES_KEY}/${code}`), { redirectToCode: newCode });
  } else {
    setLocalParty(newCode, newPartyData);
    const oldParty = getLocalParty(code);
    if (oldParty) {
      Object.assign(oldParty, { redirectToCode: newCode });
      setLocalParty(code, oldParty);
    }
  }
  return { newCode };
}
