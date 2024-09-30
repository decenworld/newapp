import React, { createContext, useState, useEffect, useCallback, useRef } from 'react';
import Game from './components/Game';
import { achievements } from './achievements';  // Make sure this path is correct

export const GameContext = createContext();

const initialGameState = {
  cookies: 0,
  cps: 0,  // Add this line to include CPS in the initial state
  buildings: [
    { name: "Cursor", baseCost: 15, baseCps: 0.1, count: 0 },
    { name: "Grandma", baseCost: 100, baseCps: 1, count: 0 },
    { name: "Farm", baseCost: 1100, baseCps: 8, count: 0 },
    { name: "Mine", baseCost: 12000, baseCps: 47, count: 0 },
    { name: "Factory", baseCost: 130000, baseCps: 260, count: 0 },
  ],
  upgrades: {
    tiered: Array(20).fill().map(() => Array(10).fill(false)),
    synergies: Array(20).fill().map(() => Array(2).fill(false)),
    fortune: Array(20).fill(false),
    heavenly: Array(20).fill(false),
    grandmaTypes: Array(14).fill(false),
    research: Array(3).fill(false),
    unshackled: Array(20).fill(false),
  },
};

function App() {
  const [userId, setUserId] = useState(null);
  const [gameState, setGameState] = useState({
    cookies: 0,
    buildings: [
      { name: "Cursor", baseCost: 15, baseCps: 0.1, count: 0 },
      { name: "Grandma", baseCost: 100, baseCps: 1, count: 0 },
      { name: "Farm", baseCost: 1100, baseCps: 8, count: 0 },
      { name: "Mine", baseCost: 12000, baseCps: 47, count: 0 },
      { name: "Factory", baseCost: 130000, baseCps: 260, count: 0 },
    ],
    cps: 0,
  });
  const [unlockedAchievements, setUnlockedAchievements] = useState([]);
  const [saveError, setSaveError] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [isOffline, setIsOffline] = useState(false);

  // Add this function to calculate total CPS
  const calculateTotalCps = useCallback((buildings) => {
    return buildings.reduce((total, building) => total + building.baseCps * building.count, 0);
  }, []);

  useEffect(() => {
    const loadTelegramScript = () => {
      return new Promise((resolve, reject) => {
        if (window.Telegram) {
          resolve();
          return;
        }
        const script = document.createElement('script');
        script.src = 'https://telegram.org/js/telegram-web-app.js';
        script.async = true;
        script.onload = resolve;
        script.onerror = reject;
        document.body.appendChild(script);
      });
    };

    const initTelegram = async () => {
      try {
        await loadTelegramScript();
        if (window.Telegram && window.Telegram.WebApp) {
          const initDataUnsafe = window.Telegram.WebApp.initDataUnsafe;
          if (initDataUnsafe && initDataUnsafe.user) {
            setUserId(initDataUnsafe.user.id.toString());
          } else {
            console.error('Telegram user data not available');
          }
        } else {
          console.error('Telegram WebApp not available');
        }
      } catch (error) {
        console.error('Failed to load Telegram script:', error);
      }
    };

    initTelegram();
  }, []);

  const loadGame = useCallback(async () => {
    if (!userId) return;

    try {
      const response = await fetch(`/.netlify/functions/load-user-data?userId=${userId}`);
      if (!response.ok) throw new Error('Failed to load game');

      const data = await response.json();
      if (data.cookies_collected !== undefined) {
        setGameState(prevState => ({
          ...prevState,
          cookies: data.cookies_collected,
          buildings: JSON.parse(data.buildings_data),
          cps: calculateTotalCps(JSON.parse(data.buildings_data)),
        }));
        setUnlockedAchievements(JSON.parse(data.achievements) || []);
      }
      setLoadError(null);
      setIsOffline(false);
    } catch (error) {
      console.error('Failed to load game:', error);
      setLoadError(error.message);
      setIsOffline(!navigator.onLine);
    }
  }, [userId, calculateTotalCps]);

  const saveGame = useCallback(async () => {
    if (!userId) {
      console.error('Cannot save game: userId is not set');
      return;
    }

    const currentState = {
      userId,
      cookies_collected: Math.floor(gameState.cookies),
      buildings_data: JSON.stringify(gameState.buildings),
      achievements: JSON.stringify(unlockedAchievements),
    };

    console.log('Attempting to save game state:', currentState);

    try {
      const response = await fetch('/.netlify/functions/save-user-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentState),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to save game: ${response.status} ${response.statusText}. ${errorText}`);
      }

      const result = await response.json();
      console.log('Save result:', result);

      setSaveError(null);
      setIsOffline(false);
    } catch (error) {
      console.error('Error saving user data:', error);
      setSaveError(error.message);
      setIsOffline(!navigator.onLine);
    }
  }, [userId, gameState, unlockedAchievements]);

  useEffect(() => {
    if (userId) {
      loadGame();
    }
  }, [userId, loadGame]);

  useEffect(() => {
    const saveInterval = setInterval(() => {
      if (userId) {
        console.log('Triggering save game...');
        saveGame();
      } else {
        console.log('Save skipped: userId is null');
      }
    }, 5000);

    return () => clearInterval(saveInterval);
  }, [userId, saveGame]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      saveGame(true); // Attempt to save when coming back online
    };
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [saveGame]);

  const checkAchievements = useCallback(() => {
    const newAchievements = achievements.filter(
      achievement => !unlockedAchievements.includes(achievement.id) && achievement.condition(gameState)
    );

    if (newAchievements.length > 0) {
      setUnlockedAchievements(prev => [...prev, ...newAchievements.map(a => a.id)]);
    }
  }, [gameState, unlockedAchievements]);

  useEffect(() => {
    checkAchievements();
  }, [gameState, checkAchievements]);

  const clickCookie = useCallback(() => {
    setGameState(prevState => ({
      ...prevState,
      cookies: prevState.cookies + 1
    }));
  }, []);

  const buyBuilding = useCallback((buildingName) => {
    setGameState(prevState => {
      const building = prevState.buildings.find(b => b.name === buildingName);
      if (building && prevState.cookies >= building.baseCost) {
        const newBuildings = prevState.buildings.map(b => 
          b.name === buildingName ? {...b, count: b.count + 1} : b
        );
        return {
          ...prevState,
          cookies: prevState.cookies - building.baseCost,
          buildings: newBuildings,
          cps: calculateTotalCps(newBuildings)
        };
      }
      return prevState;
    });
  }, [calculateTotalCps]);

  useEffect(() => {
    const cookieInterval = setInterval(() => {
      setGameState(prevState => ({
        ...prevState,
        cookies: prevState.cookies + prevState.cps / 10  // Update every 100ms
      }));
    }, 100);

    return () => clearInterval(cookieInterval);
  }, []);

  useEffect(() => {
    console.log('App rendered, userId:', userId);
  }, [userId]);

  return (
    <GameContext.Provider value={{ 
      gameState, 
      setGameState, 
      unlockedAchievements,
      clickCookie,
      buyBuilding,
      saveGame,
      saveError,
      loadError,
      isOffline
    }}>
      {(saveError || loadError) && <div className="error-message">Error: {saveError || loadError}</div>}
      {isOffline && <div className="offline-message">You are offline. Game progress will be saved when you reconnect.</div>}
      <div className="App">
        <Game />
        <button onClick={() => window.open('/.netlify/functions/download-data', '_blank')}>
          Download Game Data
        </button>
        <div>
          <h3>Debug Info:</h3>
          <p>User ID: {userId || 'Not available'}</p>
          <p>URL: {window.location.href}</p>
        </div>
      </div>
    </GameContext.Provider>
  );
}

export default App;