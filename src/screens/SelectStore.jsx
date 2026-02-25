import { Link, useNavigate } from 'react-router-dom';

export default function SelectStore() {
  const navigate = useNavigate();

  function selectStore(store) {
    sessionStorage.setItem('selectedStore', store);
    navigate('/create/modes');
  }

  return (
    <div className="page">
      <h1 className="title">Select Store</h1>
      <div className="button-group store-buttons">
        <button className="btn btn-store" onClick={() => selectStore('walmart')}>
          Walmart
        </button>
        <button className="btn btn-store" onClick={() => selectStore('target')}>
          Target
        </button>
      </div>
      <Link to="/">
        <button className="btn btn-ghost">Back</button>
      </Link>
    </div>
  );
}
