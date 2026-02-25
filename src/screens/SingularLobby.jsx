import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { subscribeToParty, startGame } from '../lib/gameState';
import { loadProducts, getProductsByCategories, getRandomProducts } from '../data/products';

export default function SingularLobby() {
  const { code } = useParams();
  const navigate = useNavigate();
  const [party, setParty] = useState(null);
  const [me, setMe] = useState(null);

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
    const rounds = party.rounds || 1;
    const assignments = {};
    // Singular: everyone gets the SAME product each round
    for (let r = 1; r <= rounds; r++) {
      const [product] = getRandomProducts(products, 1);
      assignments[`round${r}`] = {};
      for (const pid of Object.keys(party.players || {})) {
        assignments[`round${r}`][pid] = product || products[0];
      }
    }
    await startGame(code, {
      productAssignments: assignments,
      roundStartTime: null,
    });
    navigate(`/game/${code}`);
  }

  if (!party) return <div className="page"><p>Loading...</p></div>;

  const players = Object.values(party.players || {});

  return (
    <div className="page lobby-page">
      <h1 className="party-code">Party Code: {code}</h1>
      <div className="lobby-box singular-box">
        <h3>Players</h3>
        <ul className="player-list">
          {players.map(p => (
            <li key={p.id}>{p.name}</li>
          ))}
        </ul>
      </div>
      {me?.isHost ? (
        <button className="btn btn-primary btn-large" onClick={handleStart}>
          Start Game
        </button>
      ) : (
        <p className="waiting">Waiting for Host...</p>
      )}
    </div>
  );
}
