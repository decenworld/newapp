import React, { useContext } from 'react';
import { GameContext } from '../App';

const Store = ({ onClose }) => {
  const { gameState, buyBuilding } = useContext(GameContext);

  const formatNumber = (num) => {
    if (num >= 1e6) return (num / 1e6).toFixed(2) + ' million';
    if (num >= 1e3) return (num / 1e3).toFixed(2) + 'k';
    return num.toFixed(0);
  };

  return (
    <div className="store">
      <div className="store-header">
        Buildings
        <span className="store-close" onClick={onClose}>&times;</span>
      </div>
      <div className="store-content">
        {gameState.buildings.map((building, index) => {
          const cost = Math.floor(building.baseCost * Math.pow(1.15, building.count));
          return (
            <div key={index} className="upgrade-item">
              <div className="upgrade-icon">{building.name[0]}</div>
              <div className="upgrade-info">
                <div className="upgrade-name">{building.name} ({building.count})</div>
                <div className="upgrade-description">Produces {building.baseCps} cookies per second.</div>
              </div>
              <div className="upgrade-buttons">
                <button
                  className="buy-button"
                  onClick={() => buyBuilding(index)}
                  disabled={gameState.cookies < cost}
                >
                  Buy 1 ({formatNumber(cost)} cookies)
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Store;