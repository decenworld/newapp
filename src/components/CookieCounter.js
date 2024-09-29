import React, { useContext } from 'react';
import { GameContext } from '../App';

const CookieCounter = () => {
  const { gameState } = useContext(GameContext);

  return (
    <div className="cookie-counter">
      <div className="cookie-count">{Math.floor(gameState.cookies)} cookies</div>
      <div className="cps">{gameState.cps.toFixed(1)} per second</div>
    </div>
  );
};

export default CookieCounter;