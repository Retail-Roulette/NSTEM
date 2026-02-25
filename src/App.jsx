import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Home from './screens/Home';
import JoinParty from './screens/JoinParty';
import SelectStore from './screens/SelectStore';
import GameModes from './screens/GameModes';
import TeamsSetup from './screens/TeamsSetup';
import SingularSetup from './screens/SingularSetup';
import TeamsLobby from './screens/TeamsLobby';
import SingularLobby from './screens/SingularLobby';
import PreGameCountdown from './screens/PreGameCountdown';
import GameScreen from './screens/GameScreen';
import RoundResults from './screens/RoundResults';
import FinalResults from './screens/FinalResults';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/join" element={<JoinParty />} />
        <Route path="/create/store" element={<SelectStore />} />
        <Route path="/create/modes" element={<GameModes />} />
        <Route path="/create/teams-setup" element={<TeamsSetup />} />
        <Route path="/create/singular-setup" element={<SingularSetup />} />
        <Route path="/lobby/teams/:code" element={<TeamsLobby />} />
        <Route path="/lobby/singular/:code" element={<SingularLobby />} />
        <Route path="/game/:code" element={<PreGameCountdown />} />
        <Route path="/play/:code" element={<GameScreen />} />
        <Route path="/results/:code" element={<RoundResults />} />
        <Route path="/final/:code" element={<FinalResults />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
