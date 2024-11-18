import React, { useState } from 'react';
import TypingGame from './components/TypingGame';
import AdminScreen from './components/AdminScreen';

function App() {
  const [showAdmin, setShowAdmin] = useState(false);
  const [gameSettings, setGameSettings] = useState({
    selectedStages: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], // デフォルトですべてのステージを選択
    speed: 2,
  });

  return showAdmin ? (
    <AdminScreen
      onBack={() => setShowAdmin(false)}
      onSettingsChange={setGameSettings}
      currentSettings={gameSettings}
    />
  ) : (
    <TypingGame
      settings={gameSettings}
      onAdminRequest={() => setShowAdmin(true)}
    />
  );
}

export default App;