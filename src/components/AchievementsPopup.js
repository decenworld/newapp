import React, { useContext, useState } from 'react';
import { GameContext } from '../App';
import { achievements } from '../achievements';

const AchievementItem = ({ achievement, isUnlocked, onClick }) => {
  const getAchievementImage = () => {
    const basePath = '/images/achivements/';
    if (!isUnlocked) return `${basePath}none.png`;
    
    switch (achievement.id) {
      case 'firstCookie':
        return `${basePath}0.png`;
      case 'tenCookies':
        return `${basePath}1.png`;
      default:
        return `${basePath}none.png`;
    }
  };

  const imageSrc = getAchievementImage();

  return (
    <div 
      className={`achievement ${isUnlocked ? 'unlocked' : 'locked'}`}
      onClick={() => isUnlocked && onClick(achievement)}
    >
      <img 
        src={imageSrc} 
        alt={achievement.name}
        onError={(e) => {
          console.error(`Failed to load image for achievement: ${achievement.id}, src: ${imageSrc}`);
          e.target.onerror = null;
          e.target.src = "/images/achivements/none.png";
        }}
      />
    </div>
  );
};

const AchievementDescription = ({ achievement, onClose }) => {
  return (
    <div className="achievement-description-popup">
      <h3>{achievement.name}</h3>
      <p>{achievement.description}</p>
      <button onClick={onClose}>Close</button>
    </div>
  );
};

const AchievementsPopup = ({ onClose }) => {
  const { unlockedAchievements } = useContext(GameContext);
  const [selectedAchievement, setSelectedAchievement] = useState(null);

  const handleAchievementClick = (achievement) => {
    setSelectedAchievement(achievement);
  };

  const closeDescription = () => {
    setSelectedAchievement(null);
  };

  return (
    <div className="popup-overlay">
      <div className="popup achievements-popup">
        <h2>Achievements</h2>
        <div className="achievements-grid">
          {achievements.map(achievement => (
            <AchievementItem 
              key={achievement.id} 
              achievement={achievement} 
              isUnlocked={unlockedAchievements.includes(achievement.id)} 
              onClick={handleAchievementClick}
            />
          ))}
        </div>
        {selectedAchievement && (
          <AchievementDescription 
            achievement={selectedAchievement} 
            onClose={closeDescription}
          />
        )}
        <button onClick={onClose} className="close-button">Close</button>
      </div>
    </div>
  );
};

export default AchievementsPopup;
