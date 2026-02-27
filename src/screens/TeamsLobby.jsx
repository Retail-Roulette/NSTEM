import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { subscribeToParty, assignPlayerToTeam, startGame } from '../lib/gameState';
import { loadProducts, getProductsByCategories, getRandomProducts } from '../data/products';

export default function TeamsLobby() {
  const { code } = useParams();
  const navigate = useNavigate();
  const [party, setParty] = useState(null);
  const [me, setMe] = useState(null);
  const [dragging, setDragging] = useState(null);
  const [selectedPlayer, setSelectedPlayer] = useState(null);

  useEffect(() => {
    const stored = sessionStorage.getItem(`party_${code}`);
    if (stored) setMe(JSON.parse(stored));

    const unsub = subscribeToParty(code, (p) => setParty(p));
    return unsub;
  }, [code]);

  // When host starts game, everyone (including non-host) must go to countdown
  useEffect(() => {
    if (party?.state === 'countdown') {
      navigate(`/game/${code}`);
    }
  }, [party?.state, code, navigate]);

  async function handleStart() {
    if (!party || !me?.isHost) return;
    const { target, walmart } = await loadProducts();
    const storeData = party.store === 'target' ? target : walmart;
    const products = getProductsByCategories(storeData, party.categories);
    const numTeams = party.numTeams || 2;
    const assignments = {};
    const shuffled = getRandomProducts(products, numTeams * (party.rounds || 3));
    const fallbackProduct = products[0] || 'Find an item in the store';
    for (let r = 1; r <= (party.rounds || 1); r++) {
      assignments[`round${r}`] = {};
      for (let t = 1; t <= numTeams; t++) {
        const idx = (r - 1) * numTeams + (t - 1);
        assignments[`round${r}`][`team${t}`] = shuffled[idx % Math.max(1, shuffled.length)] || fallbackProduct;
      }
    }
    await startGame(code, {
      productAssignments: assignments,
      roundStartTime: null,
    });
    navigate(`/game/${code}`);
  }

  async function handleAssign(playerId, teamKey) {
    if (!me?.isHost) return;
    await assignPlayerToTeam(code, playerId, teamKey);
  }

  function handleDragStart(e, playerId) {
    if (!me?.isHost) return;
    setDragging(playerId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', playerId);
  }

  function handleDrop(e, teamKey) {
    e.preventDefault();
    if (!me?.isHost) return;
    const playerId = e.dataTransfer.getData('text/plain') || dragging;
    if (playerId) handleAssign(playerId, teamKey);
    setDragging(null);
    setSelectedPlayer(null);
  }

  function handleClickTeam(teamKey) {
    if (!me?.isHost || !selectedPlayer) return;
    handleAssign(selectedPlayer, teamKey);
    setSelectedPlayer(null);
  }

  function handleClickPlayer(playerId) {
    if (!me?.isHost) return;
    setSelectedPlayer(prev => prev === playerId ? null : playerId);
  }

  function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }

  if (!party) return <div className="page"><p>Loading...</p></div>;

  // Always show Team 1, Team 2, etc. — derive from numTeams if teams object is missing (e.g. old data or Firebase)
  const numTeams = Math.max(2, party.numTeams || 2);
  const teamKeysFromData = Object.keys(party.teams || {}).sort();
  const teamKeys = teamKeysFromData.length >= numTeams
    ? teamKeysFromData
    : Array.from({ length: numTeams }, (_, i) => `team${i + 1}`);
  const teams = party.teams || Object.fromEntries(teamKeys.map(tk => [tk, []]));
  const unassigned = (party.unassigned || []).map(id => party.players?.[id]).filter(Boolean);

  return (
    <div className="page lobby-page">
      <h1 className="party-code">Party Code: {code}</h1>

      {me?.isHost ? (
        <>
          <div className="lobby-grid">
            <div
              className={`lobby-box unassigned ${selectedPlayer ? 'selected' : ''}`}
              onDrop={(e) => handleDrop(e, null)}
              onDragOver={handleDragOver}
              onClick={() => selectedPlayer && handleClickTeam(null)}
            >
              <h3>Unassigned</h3>
              {unassigned.map(p => (
                <div
                  key={p.id}
                  className={`player-chip ${selectedPlayer === p.id ? 'selected' : ''}`}
                  draggable
                  onDragStart={(e) => handleDragStart(e, p.id)}
                  onClick={() => handleClickPlayer(p.id)}
                >
                  {p.name}
                </div>
              ))}
            </div>
            {teamKeys.map(tk => (
              <div
                key={tk}
                className="lobby-box team-box"
                onDrop={(e) => handleDrop(e, tk)}
                onDragOver={handleDragOver}
                onClick={() => selectedPlayer && handleClickTeam(tk)}
              >
                <h3>{tk.replace('team', 'Team ')}</h3>
                {(teams[tk] || []).map(id => party.players?.[id]).filter(Boolean).map(p => (
                  <div
                    key={p.id}
                    className={`player-chip ${selectedPlayer === p.id ? 'selected' : ''}`}
                    draggable
                    onDragStart={(e) => handleDragStart(e, p.id)}
                    onClick={() => handleClickPlayer(p.id)}
                  >
                    {p.name}
                  </div>
                ))}
              </div>
            ))}
          </div>
          {selectedPlayer && (
            <p className="form-hint">Click a team box to assign the selected player, or click again to deselect.</p>
          )}
          <button className="btn btn-primary btn-large" onClick={handleStart}>
            Start Game
          </button>
        </>
      ) : (
        <div className="waiting">
          <p>Waiting for Host...</p>
          <p className="sub">You are in: {party.players?.[me?.playerId]?.team || 'Unassigned'}</p>
        </div>
      )}
    </div>
  );
}
