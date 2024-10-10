import React, { useContext } from 'react';
import { GameContext } from '../App';

const CookieCounter = () => {
  const { gameState } = useContext(GameContext);

  return (
    <div id="cookies">
      <span className="cookie-count">{Math.floor(gameState.cookies)} cookies</span>
      <br />
      <span className="cps">{gameState.cps.toFixed(1)} per second</span>
    </div>
  );
};

export default CookieCounter;