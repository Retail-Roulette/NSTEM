import { Link, useNavigate } from 'react-router-dom';

export default function GameModes() {
  const navigate = useNavigate();
  const store = sessionStorage.getItem('selectedStore') || 'walmart';

  function selectMode(mode) {
    sessionStorage.setItem('gameMode', mode);
    if (mode === 'teams') {
      navigate('/create/teams-setup');
    } else {
      navigate('/create/singular-setup');
    }
  }

  return (
    <div className="page">
      <h1 className="title">Game Modes</h1>
      <div className="button-group">
        <button className="btn btn-primary" onClick={() => selectMode('teams')}>
          Teams
        </button>
        <button className="btn btn-primary" onClick={() => selectMode('singular')}>
          Singular
        </button>
      </div>
      <Link to="/create/store">
        <button className="btn btn-ghost">Back</button>
      </Link>
    </div>
  );
}
