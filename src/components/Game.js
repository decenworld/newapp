import React, { useState, useEffect } from 'react';
import Cookie from './Cookie';
import CookieCounter from './CookieCounter';
import BottomMenu from './BottomMenu';
import AchievementsPopup from './AchievementsPopup';
import '../styles/Game.css';
import MiscPopup from './MiscPopup';

const Game = () => {
  const [showAchievements, setShowAchievements] = useState(false);
  const [isMiscPopupOpen, setIsMiscPopupOpen] = useState(false);

  const handleOpenMiscPopup = () => {
    console.log('Opening Misc popup');
    setIsMiscPopupOpen(true);
  };

  useEffect(() => {
    console.log('isMiscPopupOpen:', isMiscPopupOpen);
  }, [isMiscPopupOpen]);

  return (
    <div className="game">
      <div className="header">
        <CookieCounter />
      </div>
      <div className="cookie-container">
        <Cookie />
      </div>
      <BottomMenu onShowAchievements={() => setShowAchievements(true)} />
      {showAchievements && <AchievementsPopup onClose={() => setShowAchievements(false)} />}
      <button onClick={handleOpenMiscPopup}>Misc</button>
      {isMiscPopupOpen && (
        <div>
          <p>Debug: Misc popup should be visible</p>
          <MiscPopup onClose={() => {
            console.log('Closing Misc popup');
            setIsMiscPopupOpen(false);
          }} />
        </div>
      )}
    </div>
  );
};

export default Game;