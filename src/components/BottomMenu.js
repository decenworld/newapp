import React, { useState } from 'react';
import Store from './Store';
import InvitePopup from './InvitePopup';
import AchievementsPopup from './AchievementsPopup';
import cookieIcon from '../assets/cookie-icon.png';
import storeIcon from '../assets/store-icon.png';
import inviteIcon from '../assets/invite-icon.png';
import achievementsIcon from '../assets/achievements-icon.png';
import miscIcon from '../assets/misc-icon.png';

const BottomMenu = () => {
  const [isStoreOpen, setIsStoreOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isAchievementsOpen, setIsAchievementsOpen] = useState(false);

  return (
    <>
      <div className="bottom-menu">
        <button><img src={cookieIcon} alt="Cookie" /><br/>Cookie</button>
        <button onClick={() => setIsStoreOpen(true)}><img src={storeIcon} alt="Store" /><br/>Store</button>
        <button onClick={() => setIsInviteOpen(true)}><img src={inviteIcon} alt="Invite" /><br/>Invite</button>
        <button onClick={() => setIsAchievementsOpen(true)}><img src={achievementsIcon} alt="Achievements" /><br/>Achievements</button>
        <button><img src={miscIcon} alt="Misc" /><br/>Misc</button>
      </div>
      {isStoreOpen && <Store onClose={() => setIsStoreOpen(false)} />}
      {isInviteOpen && <InvitePopup onClose={() => setIsInviteOpen(false)} />}
      {isAchievementsOpen && <AchievementsPopup onClose={() => setIsAchievementsOpen(false)} />}
    </>
  );
};

export default BottomMenu;