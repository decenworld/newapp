import React from 'react';
import Cookie from './Cookie';
import CookieCounter from './CookieCounter';
import BottomMenu from './BottomMenu';
import '../styles/Game.css';

const Game = () => {
  return (
    <div className="game">
      <div className="header">
        <CookieCounter />
      </div>
      <div className="cookie-container">
        <Cookie />
      </div>
      <BottomMenu />
    </div>
  );
};

export default Game;