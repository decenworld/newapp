import React, { useState } from 'react';
import Store from './Store';
import InvitePopup from './InvitePopup';
import AchievementsPopup from './AchievementsPopup';
import cookieIcon from '../assets/cookie-icon.png';
import './BottomMenu.css'; // Make sure to create this CSS file
import MiscPopup from './MiscPopup';

const BottomMenu = () => {
  const [isStoreOpen, setIsStoreOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isAchievementsOpen, setIsAchievementsOpen] = useState(false);
  const [isMiscPopupOpen, setIsMiscPopupOpen] = useState(false);

  return (
    <>
      <div className="bottom-menu">
        <button>
          <img src={cookieIcon} alt="Cookie" className="menu-icon cookie-icon" />
          <span>Cookie</span>
        </button>
        <button onClick={() => setIsStoreOpen(true)}>
          <span className="menu-icon" role="img" aria-label="Store">🏪</span>
          <span>Store</span>
        </button>
        <button onClick={() => setIsInviteOpen(true)}>
          <span className="menu-icon" role="img" aria-label="Invite">👥</span>
          <span>Invite</span>
        </button>
        <button onClick={() => setIsAchievementsOpen(true)}>
          <span className="menu-icon" role="img" aria-label="Achievements">🏆</span>
          <span>Achievements</span>
        </button>
        <button onClick={() => setIsMiscPopupOpen(true)}>
          <span className="menu-icon" role="img" aria-label="Misc">⋯</span>
          <span>Misc</span>
        </button>
      </div>
      {isStoreOpen && <Store onClose={() => setIsStoreOpen(false)} />}
      {isInviteOpen && <InvitePopup onClose={() => setIsInviteOpen(false)} />}
      {isAchievementsOpen && <AchievementsPopup onClose={() => setIsAchievementsOpen(false)} />}
      {isMiscPopupOpen && <MiscPopup onClose={() => setIsMiscPopupOpen(false)} />}
    </>
  );
};

export default BottomMenu;