import React, { createContext, useState, useEffect, useCallback } from 'react';
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
  const [gameState, setGameState] = useState(initialGameState);
  const [userId, setUserId] = useState(null);
  const [unlockedAchievements, setUnlockedAchievements] = useState([]);
  const [loadError, setLoadError] = useState(null);
  const [saveError, setSaveError] = useState(null);

  // Add this function to calculate total CPS
  const calculateTotalCps = useCallback((buildings) => {
    return buildings.reduce((total, building) => total + building.baseCps * building.count, 0);
  }, []);

  useEffect(() => {
    // Set userId here, e.g., from localStorage or a login process
    const storedUserId = localStorage.getItem('userId');
    if (storedUserId) {
      setUserId(storedUserId);
    } else {
      const newUserId = 'user_' + Date.now(); // Generate a simple userId
      localStorage.setItem('userId', newUserId);
      setUserId(newUserId);
    }
  }, []);

  const loadGame = useCallback(async (retryCount = 0) => {
    if (!userId) {
      console.log('No userId available, skipping load');
      return;
    }

    try {
      console.log('Attempting to load game state for user:', userId);
      const response = await fetch(`/.netlify/functions/load-user-data?userId=${userId}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.error}`);
      }
      const data = await response.json();
      console.log('Loaded game state:', data);

      if (data.cookies_collected === undefined || !Array.isArray(data.buildings_data)) {
        throw new Error('Invalid data structure received');
      }

      const loadedBuildings = data.buildings_data.map((building, index) => ({
        ...initialGameState.buildings[index],
        ...building,
      }));

      setGameState(prevState => ({
        ...prevState,
        cookies: data.cookies_collected,
        buildings: loadedBuildings,
        cps: calculateTotalCps(loadedBuildings),
      }));
      setUnlockedAchievements(data.achievements || []);
      setLoadError(null);
    } catch (error) {
      console.error('Failed to load game:', error);
      setLoadError(error.message);
      
      if (retryCount < 3) {
        console.log(`Retrying load... Attempt ${retryCount + 1}`);
        setTimeout(() => loadGame(retryCount + 1), 5000);
      } else {
        console.error('Max retries reached. Unable to load game data.');
        // Here you might want to set some default state or show an error message to the user
      }
    }
  }, [userId, calculateTotalCps]);

  useEffect(() => {
    if (userId) {
      loadGame();
    }
  }, [userId, loadGame]);

  const saveGame = useCallback(async (retryCount = 0) => {
    if (!userId) {
      console.log('No userId available, skipping save');
      return;
    }

    const currentState = {
      cookies_collected: Math.floor(gameState.cookies),
      buildings_data: gameState.buildings,
      achievements: unlockedAchievements,
    };

    console.log('Attempting to save game state:', currentState);
    try {
      const response = await fetch('/.netlify/functions/save-user-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          ...currentState,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.error}`);
      }

      const result = await response.json();
      console.log('Save result:', result);
      setSaveError(null);
    } catch (error) {
      console.error('Error saving user data:', error);
      setSaveError(error.message);
      
      if (retryCount < 3) {
        console.log(`Retrying save... Attempt ${retryCount + 1}`);
        setTimeout(() => saveGame(retryCount + 1), 5000);
      } else {
        console.error('Max retries reached. Unable to save game data.');
      }
    }
  }, [userId, gameState, unlockedAchievements]);

  useEffect(() => {
    let saveInterval;
    if (userId) {
      saveGame(); // Initial save when userId is set
      saveInterval = setInterval(saveGame, 5000); // Save every 5 seconds
    }
    return () => {
      if (saveInterval) clearInterval(saveInterval);
    };
  }, [userId, saveGame]);

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
        const newCps = calculateTotalCps(newBuildings);
        return {
          ...prevState,
          cookies: prevState.cookies - cost,
          buildings: newBuildings,
          cps: newCps
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

  console.log('App rendered, userId:', userId);

  return (
    <GameContext.Provider value={{ 
      gameState, 
      setGameState, 
      unlockedAchievements,
      clickCookie,
      buyBuilding,
      saveGame,
      saveError
    }}>
      {saveError && <div className="error-message">Error saving game: {saveError}</div>}
      {loadError && <div className="error-message">Error loading game: {loadError}</div>}
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