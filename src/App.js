import React, { createContext, useState, useEffect, useCallback, useRef } from 'react';
import Game from './components/Game';
import { achievements } from './achievements';

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

const FALLBACK_USER_ID = 'browser-test-user';

function App() {
  const [userId, setUserId] = useState(null);
  const [gameState, setGameState] = useState(null);
  const [unlockedAchievements, setUnlockedAchievements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialLoadDone, setIsInitialLoadDone] = useState(false);
  const saveErrorRef = useRef(null);
  const isOfflineRef = useRef(false);
  const lastSaveTimeRef = useRef(Date.now());

  const loadTelegramScript = useCallback(() => {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://telegram.org/js/telegram-web-app.js';
      script.onload = resolve;
      script.onerror = reject;
      document.body.appendChild(script);
    });
  }, []);

  const loadGameData = useCallback(async (id) => {
    try {
      let data;
      if (id === FALLBACK_USER_ID) {
        const savedData = localStorage.getItem('gameState');
        data = savedData ? JSON.parse(savedData) : null;
      } else {
        const response = await fetch(`/.netlify/functions/load-user-data?userId=${id}`);
        if (!response.ok) {
          throw new Error(`Failed to load game data: ${response.status} ${response.statusText}`);
        }
        data = await response.json();
      }
      
      console.log('Loaded game data:', data);
      
      if (data && data.gameState) {
        const parsedBuildingsData = JSON.parse(data.gameState.buildings_data);
        setGameState({
          cookies: Number(data.gameState.cookies_collected) || 0,
          buildings: parsedBuildingsData.buildings || initialGameState.buildings,
          cps: calculateTotalCps(parsedBuildingsData.buildings || initialGameState.buildings),
          upgrades: parsedBuildingsData.upgrades || initialGameState.upgrades,
        });
        setUnlockedAchievements(JSON.parse(data.gameState.achievements) || []);
      } else {
        console.log('No existing game data found. Creating new game state.');
        setGameState(initialGameState);
        setUnlockedAchievements([]);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      setGameState(initialGameState);
      setUnlockedAchievements([]);
    } finally {
      setIsLoading(false);
      setIsInitialLoadDone(true);
    }
  }, []);

  const getUserId = useCallback(() => {
    return new Promise((resolve) => {
      const checkTelegramData = () => {
        if (window.Telegram && window.Telegram.WebApp) {
          const initDataUnsafe = window.Telegram.WebApp.initDataUnsafe;
          if (initDataUnsafe && initDataUnsafe.user) {
            const id = initDataUnsafe.user.id.toString();
            if (id !== 'anonymous' && !isNaN(Number(id))) {
              resolve(id);
            } else {
              resolve(FALLBACK_USER_ID);
            }
          } else {
            setTimeout(checkTelegramData, 100);
          }
        } else {
          resolve(FALLBACK_USER_ID);
        }
      };
      checkTelegramData();
    });
  }, []);

  useEffect(() => {
    const initGame = async () => {
      try {
        await loadTelegramScript();
        const id = await getUserId();
        setUserId(id);
        console.log('User ID set:', id);
        await loadGameData(id);
      } catch (error) {
        console.error('Failed to initialize game:', error);
        setUserId(FALLBACK_USER_ID);
        await loadGameData(FALLBACK_USER_ID);
      }
    };

    initGame();
  }, [loadTelegramScript, getUserId, loadGameData]);

  const saveGame = useCallback(() => {
    if (!isInitialLoadDone || !userId || !gameState) {
      console.log('Not ready to save yet. Skipping save.');
      return;
    }

    const now = Date.now();
    if (now - lastSaveTimeRef.current < 10000) {
      console.log('Last save was less than 10 seconds ago, skipping this save');
      return;
    }

    console.log('Saving game at:', new Date().toISOString());
    console.log('Current userId:', userId);

    const currentState = {
      userId: userId,
      cookies_collected: Number(Math.floor(gameState.cookies)),
      buildings_data: JSON.stringify({
        buildings: gameState.buildings,
        upgrades: gameState.upgrades
      }),
      achievements: JSON.stringify(unlockedAchievements),
    };

    console.log('Attempting to save game state:', JSON.stringify(currentState));

    if (userId === FALLBACK_USER_ID) {
      localStorage.setItem('gameState', JSON.stringify({ gameState: currentState }));
      console.log('Game saved successfully to localStorage');
      saveErrorRef.current = null;
      isOfflineRef.current = false;
      lastSaveTimeRef.current = now;
    } else {
      fetch('/.netlify/functions/save-user-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentState),
      })
        .then(response => {
          if (!response.ok) {
            throw new Error(`Failed to save game: ${response.status} ${response.statusText}`);
          }
          return response.json();
        })
        .then(() => {
          console.log('Game saved successfully');
          saveErrorRef.current = null;
          isOfflineRef.current = false;
        })
        .catch(error => {
          console.error('Error saving user data:', error);
          saveErrorRef.current = error.message;
          isOfflineRef.current = !navigator.onLine;
        })
        .finally(() => {
          lastSaveTimeRef.current = now;
        });
    }
  }, [userId, gameState, unlockedAchievements, isInitialLoadDone]);

  useEffect(() => {
    let saveInterval;
    if (isInitialLoadDone) {
      saveInterval = setInterval(saveGame, 10000);
    }
    return () => {
      if (saveInterval) {
        clearInterval(saveInterval);
      }
    };
  }, [saveGame, isInitialLoadDone]);

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

  return (
    <GameContext.Provider value={{ 
      gameState, 
      setGameState, 
      unlockedAchievements,
      setUnlockedAchievements,
      clickCookie,
      buyBuilding,
      calculateBuildingCost,
      saveError: saveErrorRef.current,
      isOffline: isOfflineRef.current
    }}>
      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <>
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
              <p>Initial Load Done: {isInitialLoadDone ? 'Yes' : 'No'}</p>
            </div>
          </div>
        </>
      )}
    </GameContext.Provider>
  );
}

export default App;