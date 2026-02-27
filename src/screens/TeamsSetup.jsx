import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { loadProducts, getCategories } from '../data/products';
import { createParty, createPlayerId } from '../lib/gameState';

export default function TeamsSetup() {
  const [hostName, setHostName] = useState('');
  const [rounds, setRounds] = useState(3);
  const [timePerRound, setTimePerRound] = useState(60);
  const [numTeams, setNumTeams] = useState(2);
  const [categories, setCategories] = useState(['All Categories']);
  const [availableCats, setAvailableCats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const store = sessionStorage.getItem('selectedStore') || 'walmart';

  useEffect(() => {
    loadProducts().then(({ target, walmart }) => {
      const data = store === 'target' ? target : walmart;
      setAvailableCats(['All Categories', ...getCategories(data)]);
      setLoading(false);
    });
  }, [store]);

  async function handleConfirm(e) {
    e.preventDefault();
    setError('');
    if (!hostName.trim()) {
      setError('Enter your name.');
      return;
    }
    if (rounds < 1 || timePerRound < 1 || numTeams < 2) {
      setError('Invalid settings. Rounds ≥ 1, Time ≥ 1s, Teams ≥ 2.');
      return;
    }
    const hostId = createPlayerId();
    const name = hostName.trim();
    try {
      const { code } = await createParty({
        hostId,
        hostName: name,
        store,
        mode: 'teams',
        rounds,
        timePerRound,
        categories,
        numTeams,
      });
      sessionStorage.setItem(`party_${code}`, JSON.stringify({
        id: hostId,
        playerId: hostId,
        playerName: name,
        isHost: true,
      }));
      navigate(`/lobby/teams/${code}`);
    } catch (err) {
      setError('Failed to create party.');
    }
  }

  function toggleCategory(cat) {
    if (cat === 'All Categories') {
      setCategories(['All Categories']);
      return;
    }
    setCategories(prev => {
      const next = prev.filter(c => c !== 'All Categories');
      if (next.includes(cat)) {
        const n = next.filter(c => c !== cat);
        return n.length ? n : ['All Categories'];
      }
      return [...next, cat];
    });
  }

  if (loading) return <div className="page"><p>Loading...</p></div>;

  return (
    <div className="page">
      <h1 className="title">Teams Setup</h1>
      <form onSubmit={handleConfirm} className="form setup-form">
        <label>
          Your Name
          <input
            type="text"
            placeholder="Host name"
            value={hostName}
            onChange={(e) => setHostName(e.target.value)}
            className="input"
            autoComplete="name"
          />
        </label>
        <label>
          Number of Rounds
          <input
            type="number"
            min={1}
            value={rounds}
            onChange={(e) => setRounds(parseInt(e.target.value) || 1)}
            className="input"
          />
        </label>
        <label>
          Time per Round
          <select
            value={timePerRound}
            onChange={(e) => setTimePerRound(parseInt(e.target.value))}
            className="input"
          >
            {[60, 120, 180, 240, 300, 360, 420, 480].map(sec => (
              <option key={sec} value={sec}>{sec === 60 ? '1 min' : `${sec / 60} min`}</option>
            ))}
          </select>
        </label>
        <label>
          Number of Teams
          <input
            type="number"
            min={2}
            value={numTeams}
            onChange={(e) => setNumTeams(parseInt(e.target.value) || 2)}
            className="input"
          />
        </label>
        <label>
          Categories
          <select
            multiple
            value={categories}
            onChange={(e) => {
              const opts = [...e.target.selectedOptions].map(o => o.value);
              setCategories(opts.length ? opts : ['All Categories']);
            }}
            className="input select-multi"
          >
            {availableCats.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <small>Hold Ctrl/Cmd to multi-select</small>
        </label>
        {error && <p className="error">{error}</p>}
        <button type="submit" className="btn btn-primary">Confirm</button>
      </form>
      <Link to="/create/modes">
        <button className="btn btn-ghost">Back</button>
      </Link>
    </div>
  );
}
