import React from 'react';
import Upgrade from './Upgrade';

const upgrades = [
  { name: 'Cursor', cost: 15, cps: 0.1 },
  { name: 'Grandma', cost: 100, cps: 1 },
  { name: 'Farm', cost: 1100, cps: 8 },
  { name: 'Mine', cost: 12000, cps: 47 },
  { name: 'Factory', cost: 130000, cps: 260 },
];

const UpgradeList = () => {
  return (
    <div className="upgrade-list">
      {upgrades.map((upgrade, index) => (
        <Upgrade key={index} upgrade={upgrade} />
      ))}
    </div>
  );
};

export default UpgradeList;