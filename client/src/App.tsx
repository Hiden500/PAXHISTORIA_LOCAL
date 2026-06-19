import { useState } from "react";
import { type GameState } from "@shared/types/GameState";
import { ScenarioSelector } from "./components/ScenarioSelector";
import { GameView } from "./components/GameView";
import { Map1946Viewer } from "./map/Map1946Viewer";
import { startGame } from "./api/gameApi";
import "./App.css";

export default function App() {
  const [game, setGame] = useState<GameState | null>(null);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showMap1946, setShowMap1946] = useState(false);

  const handleScenarioSelect = async (
    scenarioId: string,
    countryId: string
  ) => {
    setStarting(true);
    setError(null);
    try {
      const state = await startGame(scenarioId, countryId);
      setGame(state);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось начать игру");
    } finally {
      setStarting(false);
    }
  };

  const handleBack = () => {
    setGame(null);
    setError(null);
  };

  if (showMap1946) {
    return (
      <>
        <Map1946Viewer />
        <button
          onClick={() => setShowMap1946(false)}
          style={{
            position: 'absolute',
            top: '10px',
            left: '10px',
            zIndex: 1000,
            padding: '8px 16px',
            backgroundColor: '#1e293b',
            color: '#f1f5f9',
            border: '1px solid #334155',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          ← Вернуться
        </button>
      </>
    );
  }

  if (game) {
    return <GameView game={game} onGameUpdate={setGame} onBack={handleBack} />;
  }

  return (
    <>
      {starting && <div className="loading">Создание мира...</div>}
      {!starting && (
        <>
          <button
            onClick={() => setShowMap1946(true)}
            style={{
              position: 'absolute',
              top: '10px',
              right: '10px',
              zIndex: 1000,
              padding: '8px 16px',
              backgroundColor: '#1e293b',
              color: '#f1f5f9',
              border: '1px solid #334155',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            🗺️ Карта 1946
          </button>
          <ScenarioSelector
            onScenarioSelect={handleScenarioSelect}
            error={error}
          />
        </>
      )}
    </>
  );
}