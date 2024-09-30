import React, { createContext, useState, useEffect, useCallback, useRef } from 'react';
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
  const [userId, setUserId] = useState(null);
  const lastSavedStateRef = useRef({ cookies: 0, buildings: initialGameState.buildings });
  const saveUserDataRef = useRef(null);

  const calculateTotalCps = useCallback((buildings) => {
    return buildings.reduce((total, building) => total + building.baseCps * building.count, 0);
  }, []);

  useEffect(() => {
    const initApp = () => {
      console.log("Initializing App...");
      
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

      if (savedData && savedData.cookies_collected !== undefined && savedData.buildings_data) {
        const parsedBuildings = JSON.parse(savedData.buildings_data);
        const calculatedCps = calculateTotalCps(parsedBuildings);
        
        setGameState(prevState => ({
          ...prevState,
          cookies: savedData.cookies_collected,
          buildings: parsedBuildings.length ? parsedBuildings : prevState.buildings,
          cps: calculatedCps,
        }));
        
        lastSavedStateRef.current = {
          cookies: savedData.cookies_collected,
          buildings: parsedBuildings.length ? parsedBuildings : initialGameState.buildings,
        };
        console.log('Game state loaded successfully for user:', userId);
        console.log('Calculated CPS:', calculatedCps);
      } else {
        console.log('Invalid or empty saved data, using initial game state for user:', userId);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  }, [userId, calculateTotalCps]);

  useEffect(() => {
    if (userId) {
      loadUserData();
    }
  }, [userId, loadUserData]);

  saveUserDataRef.current = async () => {
    if (!userId) {
      console.log('No userId available, skipping save');
      return;
    }

    const currentState = {
      cookies_collected: Math.floor(gameState.cookies),
      buildings_data: JSON.stringify(gameState.buildings),
    };

    console.log('Attempting to save game state:', currentState);
    try {
      console.log('Sending POST request to save-user-data');
      const response = await fetch('/.netlify/functions/save-user-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          cookies_collected: currentState.cookies_collected,
          buildings_data: currentState.buildings_data,
        }),
      });

      console.log('Received response from save-user-data:', response);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response body:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
      }

      const result = await response.json();
      console.log('Save response data:', result);
      
      lastSavedStateRef.current = {
        cookies: currentState.cookies_collected,
        buildings: gameState.buildings,
      };
      console.log('Updated lastSavedStateRef:', lastSavedStateRef.current);
    } catch (error) {
      console.error('Error saving user data:', error.message);
      console.error('Error details:', error);
    }
  };

  useEffect(() => {
    let saveInterval;
    if (userId) {
      console.log('Setting up save interval');
      saveInterval = setInterval(() => {
        console.log('Save interval triggered');
        saveUserDataRef.current();
      }, 5000);
    }
    return () => {
      if (saveInterval) {
        console.log('Clearing save interval');
        clearInterval(saveInterval);
      }
    };
  }, [userId]);

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

  useEffect(() => {
    const gameLoop = setInterval(() => {
      setGameState(prevState => ({
        ...prevState,
        cookies: prevState.cookies + prevState.cps / 10
      }));
    }, 100);

    return () => clearInterval(gameLoop);
  }, []);

  console.log('App rendered, userId:', userId);

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