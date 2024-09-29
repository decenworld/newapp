import React, { createContext, useState, useEffect, useCallback } from 'react';

export const CookieClickerContext = createContext();

const initialAchievements = [
  { id: 0, name: "Wake and bake", description: "Bake 1 cookie in one ascension.", icon: "wake_and_bake.png", condition: (state) => state.cookies >= 1 },
  { id: 1, name: "Making some dough", description: "Bake 1,000 cookies in one ascension.", icon: "making_some_dough.png", condition: (state) => state.cookies >= 1000 },
  // Add more achievements here
];

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
  unlockedAchievements: new Set(),
};

export const CookieClickerProvider = ({ children }) => {
  const [gameState, setGameState] = useState(initialGameState);

  const checkAchievements = useCallback(() => {
    initialAchievements.forEach(achievement => {
      if (!gameState.unlockedAchievements.has(achievement.id) && achievement.condition(gameState)) {
        setGameState(prevState => ({
          ...prevState,
          unlockedAchievements: new Set([...prevState.unlockedAchievements, achievement.id])
        }));
        showAchievementNotification(achievement);
      }
    });
  }, [gameState]);

  const showAchievementNotification = (achievement) => {
    console.log(`Achievement unlocked: ${achievement.name}`);
    // You can implement a more sophisticated notification system here
  };

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
    const savedState = localStorage.getItem('gameState');
    if (savedState) {
      const parsedState = JSON.parse(savedState);
      setGameState({
        ...parsedState,
        unlockedAchievements: new Set(parsedState.unlockedAchievements || [])
      });
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('gameState', JSON.stringify({
      ...gameState,
      unlockedAchievements: Array.from(gameState.unlockedAchievements)
    }));
  }, [gameState]);

  useEffect(() => {
    const gameLoop = setInterval(() => {
      setGameState(prevState => ({
        ...prevState,
        cookies: prevState.cookies + prevState.cps / 10
      }));
      checkAchievements();
    }, 100);

    return () => clearInterval(gameLoop);
  }, [checkAchievements]);

  return (
    <CookieClickerContext.Provider value={{ 
      gameState, 
      clickCookie, 
      buyBuilding, 
      achievements: initialAchievements 
    }}>
      {children}
    </CookieClickerContext.Provider>
  );
};