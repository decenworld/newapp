import React, { useState, useCallback } from 'react';
import Cookie from './Cookie';
import CookieCounter from './CookieCounter';
import BottomMenu from './BottomMenu';
import AchievementsPopup from './AchievementsPopup';
import '../styles/Game.css';
import MiscPopup from './MiscPopup';
import cookieImage from '../assets/cookie.png'; // Make sure this path is correct
import backgroundImage from '../assets/cookiebg.jpeg'; // Add this line

const Game = () => {
  const [showAchievements, setShowAchievements] = useState(false);
  const [isMiscPopupOpen, setIsMiscPopupOpen] = useState(false);
  const [particles, setParticles] = useState([]);

  const handleOpenMiscPopup = () => {
    console.log('Opening Misc popup');
    setIsMiscPopupOpen(true);
  };

  const createParticle = useCallback((x, y) => {
    const particle = {
      id: Date.now(),
      x,
      y,
      opacity: 1,
      rotation: Math.random() * 360, // Random initial rotation
    };
    setParticles(prevParticles => [...prevParticles, particle]);
    console.log('Particle created:', particle); // Add this line for debugging

    setTimeout(() => {
      setParticles(prevParticles => prevParticles.filter(p => p.id !== particle.id));
      console.log('Particle removed:', particle.id); // Add this line for debugging
    }, 1000);
  }, []);

  return (
    <div className="game" style={{ backgroundImage: `url(${backgroundImage})` }}>
      <CookieCounter />
      <div className="cookie-container">
        <Cookie createParticle={createParticle} />
        {particles.map(particle => (
          <img
            key={particle.id}
            src={cookieImage}
            alt="Small Cookie"
            className="cookie-particle"
            style={{
              left: `${particle.x}px`,
              top: `${particle.y}px`,
              opacity: particle.opacity,
              transform: `rotate(${particle.rotation}deg)`,
            }}
          />
        ))}
      </div>
      <BottomMenu onShowAchievements={() => setShowAchievements(true)} />
      {showAchievements && <AchievementsPopup onClose={() => setShowAchievements(false)} />}
      <button onClick={handleOpenMiscPopup}>Misc</button>
      {isMiscPopupOpen && (
        <MiscPopup onClose={() => {
          console.log('Closing Misc popup');
          setIsMiscPopupOpen(false);
        }} />
      )}
    </div>
  );
};

export default Game;