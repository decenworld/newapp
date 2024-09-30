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
  const [gameState, setGameState] = useState(initialGameState);
  const [unlockedAchievements, setUnlockedAchievements] = useState([]);
  const saveErrorRef = useRef(null);
  const isOfflineRef = useRef(false);
  const lastSaveTimeRef = useRef(Date.now());
  const saveTimeoutRef = useRef(null);
  const pendingSaveRef = useRef(false);
  const saveFailedRef = useRef(false);

  const calculateTotalCps = useCallback((buildings) => {
    return buildings.reduce((total, building) => total + building.baseCps * building.count, 0);
  }, []);

  const calculateBuildingCost = useCallback((building) => {
    return Math.floor(building.baseCost * Math.pow(1.15, building.count));
  }, []);

  const saveGame = useCallback(async (force = false) => {
    const now = Date.now();
    if (!force && now - lastSaveTimeRef.current < 10000) {
      console.log('Last save was less than 10 seconds ago, scheduling next save');
      pendingSaveRef.current = true;
      return;
    }

    console.log('Saving game at:', new Date().toISOString());
    lastSaveTimeRef.current = now;
    pendingSaveRef.current = false;

    const currentState = {
      userId: userId || 'anonymous',
      cookies_collected: Number(Math.floor(gameState.cookies)),
      buildings_data: JSON.stringify(gameState.buildings.map(building => ({
        name: building.name,
        baseCost: Number(building.baseCost),
        baseCps: Number(building.baseCps),
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

      const responseText = await response.text();
      console.log('Raw save response:', responseText);

      if (!response.ok) {
        throw new Error(`Failed to save game: ${response.status} ${response.statusText}. ${responseText}`);
      }

      const result = JSON.parse(responseText);
      console.log('Save result:', JSON.stringify(result));

      saveErrorRef.current = null;
      isOfflineRef.current = false;
      saveFailedRef.current = false;
    } catch (error) {
      console.error('Error saving user data:', error);
      saveErrorRef.current = error.message;
      isOfflineRef.current = !navigator.onLine;
      saveFailedRef.current = true;
      
      // Schedule a retry after 10 seconds
      setTimeout(() => {
        console.log('Retrying save after failure...');
        triggerSave();
      }, 10000);
    }
  }, [userId, gameState, unlockedAchievements]);

  const scheduleSave = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    const delay = saveFailedRef.current ? 10000 : 10000;

    saveTimeoutRef.current = setTimeout(() => {
      saveGame();
      if (pendingSaveRef.current) {
        scheduleSave();
      }
    }, delay);
  }, [saveGame]);

  const triggerSave = useCallback(() => {
    if (Date.now() - lastSaveTimeRef.current >= 10000 && !saveFailedRef.current) {
      saveGame();
    } else {
      scheduleSave();
    }
  }, [saveGame, scheduleSave]);

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
    triggerSave();
  }, [calculateBuildingCost, calculateTotalCps, triggerSave]);

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
            console.log('User ID set:', initDataUnsafe.user.id.toString());
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

  useEffect(() => {
    if (userId) {
      scheduleSave();
    }
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [userId, gameState, unlockedAchievements, scheduleSave]);

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
    // Don't trigger save on every click
  }, []);

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
    console.log('Current game state:', JSON.stringify(gameState));
    console.log('Current achievements:', JSON.stringify(unlockedAchievements));
    console.log('Last save attempt:', new Date(lastSaveTimeRef.current).toISOString());
    console.log('Is offline:', isOfflineRef.current);
    console.log('Save error:', saveErrorRef.current);
  }, [gameState, unlockedAchievements]);

  useEffect(() => {
    // This effect will handle scheduling saves when the game state changes
    triggerSave();
  }, [gameState, triggerSave]);

  console.log('App rendered, userId:', userId);

  return (
    <GameContext.Provider value={{ 
      gameState, 
      setGameState, 
      unlockedAchievements,
      clickCookie,
      buyBuilding,
      calculateBuildingCost,
      saveGame: triggerSave, // Use triggerSave instead of scheduleSave
      saveError: saveErrorRef.current,
      loadError: null,
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