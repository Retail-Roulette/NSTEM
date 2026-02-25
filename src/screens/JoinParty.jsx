import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getParty } from '../lib/gameState';

export default function JoinParty() {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleJoin(e) {
    e.preventDefault();
    setError('');
    if (!code.trim() || !name.trim()) {
      setError('Enter party code and your name');
      return;
    }
    setLoading(true);
    try {
      const party = await getParty(code.trim().toUpperCase());
      if (!party) {
        setError('Party not found. Check the code.');
        setLoading(false);
        return;
      }
      const { joinParty } = await import('../lib/gameState');
      const result = await joinParty(code.trim().toUpperCase(), name.trim());
      if (result.error) {
        setError(result.error);
        setLoading(false);
        return;
      }
      const uc = code.trim().toUpperCase();
      const gameState = {
        playerId: result.playerId,
        playerName: name.trim(),
        isHost: false,
      };
      sessionStorage.setItem(`party_${uc}`, JSON.stringify(gameState));
      if (party.mode === 'teams') {
        navigate(`/lobby/teams/${uc}`);
      } else {
        navigate(`/lobby/singular/${uc}`);
      }
    } catch (err) {
      setError('Failed to join. Try again.');
    }
    setLoading(false);
  }

  return (
    <div className="page">
      <h1 className="title">Join Party</h1>
      <form onSubmit={handleJoin} className="form">
        <input
          type="text"
          placeholder="Enter Party Code"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          maxLength={6}
          className="input"
          autoComplete="off"
        />
        <input
          type="text"
          placeholder="Your Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="input"
          autoComplete="name"
        />
        {error && <p className="error">{error}</p>}
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Joining...' : 'Join'}
        </button>
      </form>
      <Link to="/">
        <button className="btn btn-ghost">Back</button>
      </Link>
    </div>
  );
}
