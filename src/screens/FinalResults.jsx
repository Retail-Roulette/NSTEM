import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { subscribeToParty } from '../lib/gameState';

export default function FinalResults() {
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

  function handlePlayAgain() {
    navigate(`/`);
    sessionStorage.removeItem(`party_${code}`);
  }

  if (!party) return <div className="page"><p>Loading...</p></div>;

  const rounds = party.rounds || 1;
  const totals = {};
  for (let r = 1; r <= rounds; r++) {
    const roundData = (party.roundResults || {})[`round${r}`] || {};
    for (const [id, data] of Object.entries(roundData)) {
      totals[id] = (totals[id] || 0) + (data?.points || 0);
    }
  }
  const sorted = Object.entries(totals)
    .map(([id, pts]) => ({
      id,
      name: party.mode === 'teams' ? id.replace('team', 'Team ') : (party.players?.[id]?.name || id),
      points: pts,
    }))
    .sort((a, b) => b.points - a.points);

  const winner = sorted[0];
  const top3 = sorted.slice(0, 3);
  const rest = sorted.slice(3);

  return (
    <div className="page final-page">
      <h1 className="title">Final Results</h1>
      {winner && (
        <div className="winner-announce">
          <p className="winner-label">Winner</p>
          <p className="winner-name">{winner.name}</p>
          <p className="winner-points">{Math.round(winner.points)} pts</p>
        </div>
      )}
      <div className="podium">
        {top3[1] && (
          <div className="podium-item second">
            <span className="podium-rank">2</span>
            <span className="podium-name">{top3[1].name}</span>
            <span className="podium-points">{Math.round(top3[1].points)} pts</span>
          </div>
        )}
        {top3[0] && (
          <div className="podium-item first">
            <span className="podium-rank">1</span>
            <span className="podium-name">{top3[0].name}</span>
            <span className="podium-points">{Math.round(top3[0].points)} pts</span>
          </div>
        )}
        {top3[2] && (
          <div className="podium-item third">
            <span className="podium-rank">3</span>
            <span className="podium-name">{top3[2].name}</span>
            <span className="podium-points">{Math.round(top3[2].points)} pts</span>
          </div>
        )}
      </div>
      {rest.length > 0 && (
        <div className="runner-ups">
          <h3>Rankings</h3>
          <ul>
            {rest.map((r, i) => (
              <li key={r.id}>
                <span>{4 + i}. {r.name}</span>
                <span>{Math.round(r.points)} pts</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="final-actions">
        <button className="btn btn-primary" onClick={handlePlayAgain}>
          Play Again
        </button>
        <Link to="/">
          <button className="btn btn-secondary">Home</button>
        </Link>
      </div>
    </div>
  );
}
