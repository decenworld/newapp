import React, { useContext, useState } from 'react';
import { GameContext } from '../App';

const InvitePopup = ({ onClose }) => {
  const { gameState, isTelegramAvailable, telegramWebApp } = useContext(GameContext);
  const [referralLink, setReferralLink] = useState('');

  React.useEffect(() => {
    if (isTelegramAvailable && telegramWebApp) {
      // Generate a referral link using Telegram data
      const newReferralCode = Math.random().toString(36).substring(2, 8);
      setReferralLink(`https://t.me/YourBotUsername?start=${newReferralCode}`);
    } else {
      // Generate a dummy referral link for local mode
      setReferralLink(`https://example.com/invite/${Math.random().toString(36).substring(2, 8)}`);
    }
  }, [isTelegramAvailable, telegramWebApp]);

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink);
    alert('Referral link copied to clipboard!');
  };

  return (
    <div className="popup">
      <div className="popup-header">
        Invite Friends
        <span className="popup-close" onClick={onClose}>&times;</span>
      </div>
      <div className="popup-content">
        <p>Share this link with your friends:</p>
        <input type="text" value={referralLink} readOnly />
        <button onClick={copyLink}>Copy Link</button>
        <div className="referral-list">
          <h3>Your Referrals:</h3>
          {gameState.referrals && gameState.referrals.map((referral, index) => (
            <div key={index} className="referral-item">
              {referral.username} - Earned: {referral.cookiesEarned} cookies
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default InvitePopup;
