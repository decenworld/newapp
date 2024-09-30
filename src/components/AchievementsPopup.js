import React, { useContext } from 'react';
import { GameContext } from '../App';
import { achievements } from '../achievements';  // Updated import path

const AchievementsPopup = ({ onClose }) => {
  const { unlockedAchievements } = useContext(GameContext);

  return (
    <div className="achievements-popup">
      <h2>Achievements</h2>
      <ul>
        {achievements.map(achievement => (
          <li key={achievement.id} className={unlockedAchievements.includes(achievement.id) ? 'unlocked' : 'locked'}>
            <h3>{achievement.name}</h3>
            <p>{achievement.description}</p>
          </li>
        ))}
      </ul>
      <button onClick={onClose}>Close</button>
    </div>
  );
};

export default AchievementsPopup;
