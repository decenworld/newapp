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
  achievements: [],

};

function App() {
  const [userId, setUserId] = useState(null);
  const [gameState, setGameState] = useState(null);
  const [unlockedAchievements, setUnlockedAchievements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const saveErrorRef = useRef(null);
  const isOfflineRef = useRef(false);
  const lastSaveTimeRef = useRef(Date.now());
  const saveTimeoutRef = useRef(null);

  const loadTelegramScript = () => {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://telegram.org/js/telegram-web-app.js';
      script.onload = resolve;
      script.onerror = reject;
      document.body.appendChild(script);
    });
  };

  useEffect(() => {
    const initTelegram = async () => {
      try {
        await loadTelegramScript();
        if (window.Telegram && window.Telegram.WebApp) {
          const initDataUnsafe = window.Telegram.WebApp.initDataUnsafe;
          if (initDataUnsafe && initDataUnsafe.user) {
            setUserId(initDataUnsafe.user.id.toString());
            console.log('User ID set:', initDataUnsafe.user.id.toString());
          } else {
            console.error('Telegram user data not available');
            setUserId('anonymous');
          }
        } else {
          console.error('Telegram WebApp not available');
          setUserId('anonymous');
        }
      } catch (error) {
        console.error('Failed to load Telegram script:', error);
        setUserId('anonymous');
      }
    };

    initTelegram();
  }, []);

  const loadGameData = useCallback(async () => {
    if (!userId) return;

    try {
      const response = await fetch(`/.netlify/functions/load-user-data?userId=${userId}`);
      if (!response.ok) {
        throw new Error(`Failed to load game data: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      if (data.gameState) {
        setGameState(prevState => ({
          ...initialGameState,
          ...data.gameState,
          buildings: data.gameState.buildings || initialGameState.buildings,
        }));
        setUnlockedAchievements(data.achievements || []);
      } else {
        setGameState(initialGameState);
        setUnlockedAchievements([]);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      setGameState(initialGameState);
      setUnlockedAchievements([]);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      loadGameData();
    }
  }, [userId, loadGameData]);

  const saveGame = useCallback(async () => {
    if (!userId || !gameState) return;

    const now = Date.now();
    if (now - lastSaveTimeRef.current < 10000) {
      console.log('Last save was less than 10 seconds ago, skipping this save');
      return;
    }

    console.log('Saving game at:', new Date().toISOString());
    console.log('Current userId:', userId);

    lastSaveTimeRef.current = now;

    const currentState = {
      userId: userId, // Use the actual userId, not 'anonymous'
      cookies_collected: Number(Math.floor(gameState.cookies)),
      buildings_data: JSON.stringify(gameState.buildings.map(building => ({
        name: building.name,
        count: Number(building.count)
      }))),
      achievements: JSON.stringify(unlockedAchievements),
    };

    console.log('Attempting to save game state:', JSON.stringify(currentState));

    try {
      const response = await fetch('/.netlify/functions/save-user-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentState),
      });

      if (!response.ok) {
        throw new Error(`Failed to save game: ${response.status} ${response.statusText}`);
      }

      console.log('Game saved successfully');
      saveErrorRef.current = null;
      isOfflineRef.current = false;
    } catch (error) {
      console.error('Error saving user data:', error);
      saveErrorRef.current = error.message;
      isOfflineRef.current = !navigator.onLine;
    }
  }, [userId, gameState, unlockedAchievements]);

  useEffect(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    if (!isLoading && gameState) {
      saveTimeoutRef.current = setTimeout(() => {
        saveGame();
        saveTimeoutRef.current = null;
      }, 10000);
    }

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [gameState, isLoading, saveGame]);

  const calculateTotalCps = useCallback((buildings) => {
    return buildings.reduce((total, building) => total + building.baseCps * building.count, 0);
  }, []);

  const calculateBuildingCost = useCallback((building) => {
    return Math.floor(building.baseCost * Math.pow(1.15, building.count));
  }, []);

  const buyBuilding = useCallback((buildingName) => {
    setGameState(prevState => {
      const buildingIndex = prevState.buildings.findIndex(b => b.name === buildingName);
      if (buildingIndex === -1) return prevState;

      const building = prevState.buildings[buildingIndex];
      const cost = calculateBuildingCost(building);

      if (prevState.cookies < cost) {
        console.log(`Not enough cookies to buy ${buildingName}. Need ${cost}, have ${prevState.cookies}`);
        return prevState;
      }

      const newBuildings = prevState.buildings.map((b, index) => 
        index === buildingIndex ? { ...b, count: b.count + 1 } : b
      );

      const newCps = calculateTotalCps(newBuildings);

      console.log(`Bought ${buildingName} for ${cost} cookies. New count: ${newBuildings[buildingIndex].count}`);

      return {
        ...prevState,
        cookies: prevState.cookies - cost,
        buildings: newBuildings,
        cps: newCps
      };
    });
    // No need to trigger save here, it will be handled by the useEffect
  }, [calculateBuildingCost, calculateTotalCps]);

  useEffect(() => {
    return () => {
      if (userId) {
        console.log('Saving game before unmount...');
        saveGame(true);
      }
    };
  }, [userId, saveGame]);

  useEffect(() => {
    const handleOnline = () => {
      isOfflineRef.current = false;
      saveGame(true); // Attempt to save when coming back online
    };
    const handleOffline = () => isOfflineRef.current = true;

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [saveGame]);

  const checkAchievements = useCallback(() => {
    if (!gameState) {
      console.log('Game state is null, skipping achievement check');
      return;
    }

    const newAchievements = achievements.filter(
      achievement => {
        try {
          return !unlockedAchievements.includes(achievement.id) && achievement.condition(gameState);
        } catch (error) {
          console.error(`Error checking achievement ${achievement.id}:`, error);
          return false;
        }
      }
    );

    if (newAchievements.length > 0) {
      setUnlockedAchievements(prev => [...prev, ...newAchievements.map(a => a.id)]);
    }
  }, [gameState, unlockedAchievements]);

  useEffect(() => {
    if (gameState) {
      checkAchievements();
    }
  }, [gameState, checkAchievements]);

  const clickCookie = useCallback(() => {
    setGameState(prevState => ({
      ...prevState,
      cookies: prevState.cookies + 1
    }));
    // No need to trigger save here, it will be handled by the useEffect
  }, []);

  useEffect(() => {
    if (!gameState) return;

    const cookieInterval = setInterval(() => {
      setGameState(prevState => {
        if (!prevState) return initialGameState;
        return {
          ...prevState,
          cookies: prevState.cookies + prevState.cps / 10  // Update every 100ms
        };
      });
    }, 100);

    return () => clearInterval(cookieInterval);
  }, [gameState]);

  useEffect(() => {
    console.log('Current game state:', JSON.stringify(gameState));
    console.log('Current achievements:', JSON.stringify(unlockedAchievements));
    console.log('Last save attempt:', new Date(lastSaveTimeRef.current).toISOString());
    console.log('Is offline:', isOfflineRef.current);
    console.log('Save error:', saveErrorRef.current);
  }, [gameState, unlockedAchievements]);

  console.log('App rendered, userId:', userId);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <GameContext.Provider value={{ 
      gameState, 
      setGameState, 
      unlockedAchievements,
      clickCookie,
      buyBuilding,
      calculateBuildingCost,
      saveError: saveErrorRef.current,
      isOffline: isOfflineRef.current
    }}>
      {(saveErrorRef.current) && <div className="error-message">Error: {saveErrorRef.current}</div>}
      {isOfflineRef.current && <div className="offline-message">You are offline. Game progress will be saved when you reconnect.</div>}
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