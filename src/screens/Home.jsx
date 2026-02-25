import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="page">
      <h1 className="title">Retail Royale</h1>
      <p className="subtitle">The ultimate real-time multiplayer scavenger hunt game</p>
      <div className="button-group">
        <Link to="/create/store">
          <button className="btn btn-primary">Create Party</button>
        </Link>
        <Link to="/join">
          <button className="btn btn-secondary">Join Party</button>
        </Link>
      </div>
    </div>
  );
}
