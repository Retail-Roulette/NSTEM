import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { updateParty } from '../lib/gameState';

const COUNTDOWN_ITEMS = [
  { num: '3', text: 'No Running' },
  { num: '2', text: 'No Yelling' },
  { num: '1', text: 'Have Fun!' },
];

export default function PreGameCountdown() {
  const { code } = useParams();
  const navigate = useNavigate();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (index >= COUNTDOWN_ITEMS.length) {
      updateParty(code, {
        state: 'playing',
        roundStartTime: Date.now(),
      }).then(() => {
        navigate(`/play/${code}`, { replace: true });
      });
      return;
    }
    const t = setTimeout(() => setIndex(i => i + 1), 1000);
    return () => clearTimeout(t);
  }, [index, code, navigate]);

  if (index >= COUNTDOWN_ITEMS.length) {
    return null;
  }

  const item = COUNTDOWN_ITEMS[index];
  return (
    <div className="page countdown-page">
      <div key={item.num} className="countdown-slam slam-enter">
        <span className="countdown-num">{item.num}</span>
        <p className="countdown-text">{item.text}</p>
      </div>
    </div>
  );
}
