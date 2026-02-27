import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { subscribeToParty, updateParty, recordScan } from '../lib/gameState';
// import BarcodeScanner from '../components/BarcodeScanner';

const MAX_POINTS = 100;

// Full time remaining = 100 pts, half time = 50 pts, no time = 0 pts. Rounded to whole number.
function calculatePoints(timeTaken, timeLimit) {
  if (!timeLimit || timeTaken < 0) return 0;
  const p = MAX_POINTS * (1 - timeTaken / timeLimit);
  return Math.round(Math.max(0, Math.min(MAX_POINTS, p)));
}

export default function GameScreen() {
  const { code } = useParams();
  const navigate = useNavigate();
  const [party, setParty] = useState(null);
  const [me, setMe] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);
  // const [scanning, setScanning] = useState(false);
  const [foundResult, setFoundResult] = useState(null); // { timeTaken, points }
  const roundStartRef = useRef(null);

  useEffect(() => {
    const stored = sessionStorage.getItem(`party_${code}`);
    if (stored) setMe(JSON.parse(stored));

    const unsub = subscribeToParty(code, (p) => {
      setParty(p);
      if (p?.state === 'results') {
        navigate(`/results/${code}`);
      }
      if (p?.state === 'playing' && p?.roundStartTime && !roundStartRef.current) {
        roundStartRef.current = p.roundStartTime;
      }
      // Singular: end round only when ALL players have found it
      if (p?.mode === 'singular' && p?.state === 'playing' && p?.roundStartTime) {
        const roundKey = `round${p.currentRound || 1}`;
        const roundResults = p.roundResults?.[roundKey] || {};
        const playerIds = Object.keys(p.players || {});
        const allFound = playerIds.length > 0 && playerIds.every(pid => roundResults[pid] != null);
        if (allFound) {
          endRound();
        }
      }
    });
    return unsub;
  }, [code, navigate]);

  useEffect(() => {
    if (!party || party.state !== 'playing' || !party.roundStartTime) return;
    const limit = party.timePerRound || 60;
    const start = party.roundStartTime || Date.now();
    const elapsed = (Date.now() - start) / 1000;
    setTimeLeft(Math.max(0, limit - elapsed));

    const id = setInterval(() => {
      const el = (Date.now() - start) / 1000;
      const left = Math.max(0, limit - el);
      setTimeLeft(left);
      if (left <= 0) {
        clearInterval(id);
        endRound();
      }
    }, 200);
    return () => clearInterval(id);
  }, [party?.state, party?.roundStartTime, party?.timePerRound]);

  async function endRound() {
    await updateParty(code, { state: 'results' });
    navigate(`/results/${code}`);
  }

  function getMyProduct() {
    if (!party?.productAssignments) return null;
    const roundKey = `round${party.currentRound}`;
    const roundData = party.productAssignments[roundKey];
    if (!roundData) return null;
    if (party.mode === 'teams') {
      const myTeam = party.players?.[me?.playerId]?.team;
      return myTeam ? roundData[myTeam] : null;
    }
    return roundData[me?.playerId] || null;
  }

  async function handleFoundIt() {
    const timeTaken = party.roundStartTime ? (Date.now() - party.roundStartTime) / 1000 : 0;
    const points = calculatePoints(timeTaken, party.timePerRound || 60);
    const teamKey = party.mode === 'teams' ? party.players?.[me?.playerId]?.team : null;
    await recordScan(code, me?.playerId, timeTaken, points, teamKey);
    setFoundResult({ timeTaken, points });
    // Round ends only when timer runs out (teams) or when all players have found it (singular, checked in subscribe)
  }

  // Barcode flow (commented out for now):
  // async function handleScanSuccess(barcode) {
  //   const product = getMyProduct();
  //   if (!product) return;
  //   const timeTaken = party.roundStartTime ? (Date.now() - party.roundStartTime) / 1000 : 0;
  //   const points = calculatePoints(timeTaken, party.timePerRound || 60);
  //   const teamKey = party.mode === 'teams' ? party.players?.[me?.playerId]?.team : null;
  //   await recordScan(code, me?.playerId, timeTaken, points, teamKey);
  //   setScanning(false);
  //   setScanResult({ success: true, points });
  //   setTimeout(() => endRound(), 800);
  // }
  // function handleScanError() {
  //   setScanResult({ success: false });
  // }

  if (!party || !me) return <div className="page"><p>Loading...</p></div>;
  if (party.state !== 'playing') {
    if (party.state === 'countdown') {
      return <div className="page"><p>Starting...</p></div>;
    }
    return null;
  }

  const product = getMyProduct();

  // Teams: unassigned players don't get a product — show helpful message
  const isUnassigned = party.mode === 'teams' && !party.players?.[me?.playerId]?.team;

  // Teams: if any teammate already found it, show that result for everyone on the team (same time, same points)
  const roundKey = `round${party.currentRound || 1}`;
  const myTeam = party.mode === 'teams' ? party.players?.[me?.playerId]?.team : null;
  const teamFoundResult = myTeam && (party.roundResults || {})[roundKey]?.[myTeam]
    ? { timeTaken: party.roundResults[roundKey][myTeam].time, points: party.roundResults[roundKey][myTeam].points }
    : null;
  const displayFoundResult = foundResult || teamFoundResult;
  const canPressFoundIt = !foundResult && !teamFoundResult;

  // Cumulative score (faster finds = more points, already in roundResults)
  const totalScore = (() => {
    const results = party.roundResults || {};
    let sum = 0;
    const id = party.mode === 'teams' ? party.players?.[me?.playerId]?.team : me?.playerId;
    if (!id) return 0;
    for (const key of Object.keys(results)) {
      sum += results[key]?.[id]?.points ?? 0;
    }
    return sum;
  })();

  return (
    <div className="page game-page">
      <div className="game-header">
        {party.mode === 'teams' && (
          <span className="team-name">
            {party.players?.[me?.playerId]?.team?.replace('team', 'Team ') || 'Unassigned'}
          </span>
        )}
        <span className="game-score">Score: {totalScore}</span>
        <span className={`timer ${timeLeft <= 10 ? 'urgent' : ''}`}>
          {Math.ceil(timeLeft || 0)}s
        </span>
      </div>

      <div className="product-display">
        <h2 className="product-name">
          {isUnassigned ? 'Ask the host to assign you to a team' : (product || 'Loading...')}
        </h2>
      </div>

      {displayFoundResult && (
        <div className="scan-feedback success">
          ✓ Found it! {displayFoundResult.timeTaken.toFixed(1)}s — <strong>+{Math.round(displayFoundResult.points)} pts</strong> this round
          <div className="waiting-others">
            {teamFoundResult && !foundResult ? 'Your team found it!' : 'Waiting for round to end...'}
          </div>
        </div>
      )}

      <button
        className="btn btn-primary btn-scan"
        onClick={handleFoundIt}
        disabled={!canPressFoundIt}
      >
        I found it!
      </button>

      {/* Barcode scanner (commented out):
      {!scanning ? (
        <button className="btn btn-primary btn-scan" onClick={() => setScanning(true)}>Scan Barcode</button>
      ) : (
        <BarcodeScanner onScan={handleScanSuccess} onClose={() => setScanning(false)} onError={handleScanError} expectedProduct={product} />
      )}
      */}
    </div>
  );
}
