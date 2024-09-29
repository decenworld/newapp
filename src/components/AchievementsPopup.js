import React, { useContext, useState } from 'react';
import { GameContext } from '../App';

const AchievementsPopup = ({ onClose }) => {
  const { gameState } = useContext(GameContext);
  const [selectedAchievement, setSelectedAchievement] = useState(null);

  // This is a placeholder. You should define your achievements list somewhere appropriate in your app.
  const achievements = [
    { id: 0, name: "Wake and bake", description: "Bake 1 cookie in one ascension.", icon: "wake_and_bake.png", condition: (state) => state.cookies >= 1 },
    { id: 1, name: "Making some dough", description: "Bake 1,000 cookies in one ascension.", icon: "making_some_dough.png", condition: (state) => state.cookies >= 1000 },
    // Add more achievements here
  ];

  const showAchievementDescription = (achievement) => {
    setSelectedAchievement(achievement);
  };

  return (
    <div className="popup">
      <div className="popup-header">
        Achievements
        <span className="popup-close" onClick={onClose}>&times;</span>
      </div>
      <div id="achievements-grid">
        {achievements.map(achievement => (
          <div 
            key={achievement.id} 
            className="achievement-item"
            onClick={() => showAchievementDescription(achievement)}
          >
            {gameState.unlockedAchievements.includes(achievement.id) ? (
              <img src={achievement.icon} alt={achievement.name} />
            ) : (
              <img src="locked_achievement.png" alt="Locked" />
            )}
          </div>
        ))}
      </div>
      {selectedAchievement && (
        <div id="achievement-description-popup">
          <h3>{selectedAchievement.name}</h3>
          <p>{selectedAchievement.description}</p>
        </div>
      )}
    </div>
  );
};

export default AchievementsPopup;
