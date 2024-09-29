import React, { createContext, useState, useEffect, useCallback } from 'react';
import Game from './components/Game';

export const GameContext = createContext();

const initialGameState = {
  cookies: 0,
  cps: 0,
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
  unlockedAchievements: [],
};

function App() {
  const [gameState, setGameState] = useState(initialGameState);
  const [lastSavedState, setLastSavedState] = useState(null);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const initApp = () => {
      console.log("Initializing App...");
      
      // Parse the URL parameters
      const urlParams = new URLSearchParams(window.location.hash.slice(1));
      const tgWebAppData = urlParams.get('tgWebAppData');
      
      console.log("URL parameters:", urlParams.toString());
      console.log("tgWebAppData:", tgWebAppData);

      if (tgWebAppData) {
        try {
          const webAppData = new URLSearchParams(tgWebAppData);
          console.log("Parsed WebAppData:", Object.fromEntries(webAppData));

          const userString = webAppData.get('user');
          if (userString) {
            const user = JSON.parse(decodeURIComponent(userString));
            setUserId(user.id.toString());
            console.log("User ID set from URL data:", user.id);
          } else {
            console.error("User data not found in WebAppData");
          }
        } catch (error) {
          console.error("Error parsing WebAppData:", error);
        }
      } else {
        console.error("No WebAppData found in URL");
      }
    };

    initApp();
  }, []);

  const loadUserData = useCallback(async () => {
    if (!userId) {
      console.log("No userId available, skipping data load");
      return;
    }

    console.log("Attempting to load user data for userId:", userId);

    try {
      const response = await fetch(`/.netlify/functions/load-user-data?userId=${userId}`);
      console.log("Load user data response:", response);

      if (response.status === 404) {
        console.log("No saved data found for user, using initial game state");
        return;
      }

      if (!response.ok) {
        throw new Error(`Failed to load user data: ${response.status} ${response.statusText}`);
      }

      const savedData = await response.json();
      console.log("Loaded user data:", savedData);

      if (savedData && savedData.cookies !== undefined && savedData.buildings) {
        setGameState(prevState => ({
          ...prevState,
          cookies: savedData.cookies,
          buildings: savedData.buildings,
        }));
        setLastSavedState(savedData);
        console.log('Game state loaded successfully for user:', userId);
      } else {
        console.log('Invalid saved data format, using initial game state for user:', userId);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      loadUserData();
    }
  }, [userId, loadUserData]);

  const saveUserData = useCallback(async () => {
    if (!userId) return;

    const currentState = {
      cookies: gameState.cookies,
      buildings: gameState.buildings,
    };

    if (JSON.stringify(currentState) !== JSON.stringify(lastSavedState)) {
      try {
        const response = await fetch('/.netlify/functions/save-user-data', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId, gameState: currentState }),
        });

        if (!response.ok) {
          throw new Error('Failed to save user data');
        }

        setLastSavedState(currentState);
        console.log('Game state saved successfully for user:', userId);
      } catch (error) {
        console.error('Error saving user data:', error);
      }
    }
  }, [gameState, lastSavedState, userId]);

  useEffect(() => {
    const saveInterval = setInterval(saveUserData, 5000);
    return () => clearInterval(saveInterval);
  }, [saveUserData]);

  const clickCookie = useCallback(() => {
    setGameState(prevState => ({
      ...prevState,
      cookies: prevState.cookies + 1
    }));
  }, []);

  const buyBuilding = useCallback((index) => {
    setGameState(prevState => {
      const building = prevState.buildings[index];
      const cost = Math.floor(building.baseCost * Math.pow(1.15, building.count));
      if (prevState.cookies >= cost) {
        const newBuildings = [...prevState.buildings];
        newBuildings[index] = {
          ...building,
          count: building.count + 1
        };
        const newCookies = prevState.cookies - cost;
        const newCps = calculateTotalCps(newBuildings);
        return {
          ...prevState,
          cookies: newCookies,
          cps: newCps,
          buildings: newBuildings
        };
      }
      return prevState;
    });
  }, []);

  const calculateTotalCps = useCallback((buildings) => {
    return buildings.reduce((total, building) => total + building.baseCps * building.count, 0);
  }, []);

  useEffect(() => {
    const gameLoop = setInterval(() => {
      setGameState(prevState => ({
        ...prevState,
        cookies: prevState.cookies + prevState.cps / 10
      }));
    }, 100);

    return () => clearInterval(gameLoop);
  }, []);

  return (
    <GameContext.Provider value={{ 
      gameState, 
      clickCookie, 
      buyBuilding
    }}>
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