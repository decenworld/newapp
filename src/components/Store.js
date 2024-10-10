import React, { useContext } from 'react';
import { GameContext } from '../App';
import './Store.css';

const Store = ({ onClose }) => {
  const { gameState, buyBuilding, calculateBuildingCost } = useContext(GameContext);

  const formatNumber = (num) => {
    if (num >= 1e6) return (num / 1e6).toFixed(2) + ' million';
    if (num >= 1e3) return (num / 1e3).toFixed(2) + 'k';
    return num.toFixed(0);
  };

  return (
    <div className="store-overlay">
      <div id="store">
        <div id="storeTitle" className="inset title zoneTitle">Store</div>
        <div id="products" className="storeSection">
          {gameState.buildings.map((building, index) => {
            const cost = calculateBuildingCost(building);
            const isLocked = gameState.cookies < cost;
            return (
              <div 
                key={index} 
                className={`product ${isLocked ? 'locked disabled' : 'unlocked enabled'}`}
                onClick={() => !isLocked && buyBuilding(building.name)}
              >
                <div className="icon">
                  <img 
                    src={`/images/${building.name.toLowerCase()}.png`} 
                    alt={building.name} 
                    className="building-icon"
                  />
                </div>
                <div className="content">
                  <div className="title productName">{building.name}</div>
                  <span className="price">{formatNumber(cost)}</span>
                  <div className="title owned">{building.count}</div>
                </div>
              </div>
            );
          })}
        </div>
        <span className="store-close" onClick={onClose}>&times;</span>
      </div>
    </div>
  );
};

export default Store;