import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { subscribeToParty, updateParty, getParty } from '../lib/gameState';

export default function RoundResults() {
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

  // When host starts next round or goes to final, everyone follows
  useEffect(() => {
    if (!party) return;
    if (party.state === 'playing') navigate(`/play/${code}`);
    if (party.state === 'final') navigate(`/final/${code}`);
  }, [party?.state, code, navigate]);

  async function handleNext() {
    if (!party || !me?.isHost) return;
    const round = party.currentRound || 1;
    const rounds = party.rounds || 1;
    if (round >= rounds) {
      await updateParty(code, { state: 'final' });
      navigate(`/final/${code}`);
    } else {
      const { loadProducts, getProductsByCategories, getRandomProducts } = await import('../data/products');
      const { target, walmart } = await loadProducts();
      const storeData = party.store === 'target' ? target : walmart;
      const products = getProductsByCategories(storeData, party.categories);
      const assignments = party.productAssignments || {};
      const nextRound = round + 1;
      if (party.mode === 'teams') {
        const numTeams = party.numTeams || 2;
        const shuffled = getRandomProducts(products, numTeams);
        assignments[`round${nextRound}`] = {};
        for (let t = 1; t <= numTeams; t++) {
          assignments[`round${nextRound}`][`team${t}`] = shuffled[t - 1] || products[0];
        }
      } else {
        // Singular: same product for everyone
        const [product] = getRandomProducts(products, 1);
        assignments[`round${nextRound}`] = {};
        for (const pid of Object.keys(party.players || {})) {
          assignments[`round${nextRound}`][pid] = product || products[0];
        }
      }
      await updateParty(code, {
        currentRound: nextRound,
        state: 'playing',
        roundStartTime: Date.now(),
        productAssignments: assignments,
      });
      navigate(`/play/${code}`);
    }
  }

  if (!party) return <div className="page"><p>Loading...</p></div>;

  const round = party.currentRound || 1;
  const rounds = party.rounds || 1;
  const roundKey = `round${round}`;
  const results = (party.roundResults || {})[roundKey] || {};
  const isFinal = round >= rounds;

  const allRoundResults = party.roundResults || {};
  // Include ALL players/teams (0 points if they timed out or didn't find it)
  const participantIds = party.mode === 'teams'
    ? Array.from({ length: party.numTeams || 2 }, (_, i) => `team${i + 1}`)
    : Object.keys(party.players || {});
  const sorted = participantIds
    .map((id) => {
      const data = results[id];
      const roundPts = data?.points ?? 0;
      let totalPts = 0;
      for (const key of Object.keys(allRoundResults)) {
        totalPts += allRoundResults[key]?.[id]?.points ?? 0;
      }
      return {
        id,
        name: party.mode === 'teams' ? id.replace('team', 'Team ') : (party.players?.[id]?.name || id),
        time: data?.time ?? null,
        points: roundPts,
        totalPoints: totalPts,
      };
    })
    .sort((a, b) => (b.points || 0) - (a.points || 0));

  const top10 = sorted.slice(0, 10);

  return (
    <div className="page results-page">
      <h1 className="title">Round {round} Results</h1>
      <div className="leaderboard-section">
        <h2 className="leaderboard-title">Top 10</h2>
        <ol className="leaderboard-list">
          {top10.map((r, i) => (
            <li key={r.id} className="leaderboard-row">
              <span className="leaderboard-rank">{i + 1}</span>
              <span className="leaderboard-name">{r.name}</span>
              <span className="leaderboard-time">{r.time != null ? `${r.time.toFixed(1)}s` : '—'}</span>
              <span className="leaderboard-round-pts">{Math.round(r.points)} pts</span>
              <span className="leaderboard-total">Total: {Math.round(r.totalPoints)}</span>
            </li>
          ))}
        </ol>
        {sorted.length === 0 && (
          <p className="leaderboard-empty">No scores this round yet.</p>
        )}
      </div>
      {me?.isHost ? (
        <button className="btn btn-primary" onClick={handleNext}>
          {isFinal ? 'Final Results' : 'Next Round'}
        </button>
      ) : (
        <p className="waiting">Waiting for host to continue...</p>
      )}
    </div>
  );
}
