import React, { useContext } from 'react';
import { CookieClickerContext } from '../contexts/CookieClickerContext';

const Upgrade = ({ upgrade, owned }) => {
  const { gameState, updateGameState } = useContext(CookieClickerContext);

  const handlePurchase = () => {
    if (gameState.cookies >= upgrade.cost && !owned) {
      updateGameState({
        cookies: gameState.cookies - upgrade.cost,
        ownedUpgrades: [...(gameState.ownedUpgrades || []), upgrade.id],
      });
    }
  };

  return (
    <div className={`upgrade ${owned ? 'owned' : ''}`} onClick={handlePurchase}>
      <img src={upgrade.icon} alt={upgrade.name} />
      <div className="upgrade-info">
        <h3>{upgrade.name}</h3>
        <p>{upgrade.description}</p>
        <p>Cost: {upgrade.cost} cookies</p>
      </div>
    </div>
  );
};

export default Upgrade;