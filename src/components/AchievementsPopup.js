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
    <div className="popup-overlay" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    }}>
      <div className="popup achievements-popup" style={{
        backgroundColor: '#333',
        color: 'white',
        padding: '20px',
        borderRadius: '10px',
        maxWidth: '80%',
        width: '400px',
        maxHeight: '80vh',
        overflowY: 'auto',
      }}>
        <span 
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            color: 'white',
            fontSize: '24px',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          &times;
        </span>
        <h2 style={{marginBottom: '20px'}}>Achievements</h2>
        <div className="achievements-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
          gap: '10px'
        }}>
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
      </div>
    </div>
  );
};

export default AchievementsPopup;
