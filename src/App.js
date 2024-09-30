import React, { createContext, useState, useEffect, useCallback } from 'react';
import Game from './components/Game';
import { achievements } from './achievements';

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
};

function App() {
  const [gameState, setGameState] = useState(initialGameState);
  const [userId, setUserId] = useState(null);
  const [unlockedAchievements, setUnlockedAchievements] = useState([]);

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

  const checkAchievements = useCallback(() => {
    const newAchievements = achievements.filter(
      achievement => !unlockedAchievements.includes(achievement.id) && achievement.condition(gameState)
    );

    if (newAchievements.length > 0) {
      setUnlockedAchievements(prev => [...prev, ...newAchievements.map(a => a.id)]);
      // Here you could also trigger notifications or animations for new achievements
    }
  }, [gameState, unlockedAchievements]);

  useEffect(() => {
    checkAchievements();
  }, [gameState, checkAchievements]);

  const saveGame = useCallback(async () => {
    try {
      await fetch('/.netlify/functions/save-user-data', {
        method: 'POST',
        body: JSON.stringify({
          userId: userId,
          cookies_collected: gameState.cookies,
          buildings_data: gameState.buildings,
          achievements: unlockedAchievements,
        }),
      });
    } catch (error) {
      console.error('Failed to save game:', error);
    }
  }, [gameState, unlockedAchievements, userId]);

  const loadGame = useCallback(async () => {
    try {
      const response = await fetch(`/.netlify/functions/load-user-data?userId=${userId}`);
      const data = await response.json();
      setGameState(prevState => ({
        ...prevState,
        cookies: data.cookies_collected,
        buildings: data.buildings_data,
        cps: calculateTotalCps(data.buildings_data),
      }));
      setUnlockedAchievements(data.achievements || []);
    } catch (error) {
      console.error('Failed to load game:', error);
    }
  }, [userId, calculateTotalCps]);

  useEffect(() => {
    if (userId) {
      loadGame();
      const saveInterval = setInterval(saveGame, 60000); // Save every minute
      return () => clearInterval(saveInterval);
    }
  }, [userId, loadGame, saveGame]);

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
  }, [calculateTotalCps]);

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
      buyBuilding,
      unlockedAchievements
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