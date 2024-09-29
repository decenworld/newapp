import React, { useContext } from 'react';
import { GameContext } from '../App';

const Cookie = () => {
  const { clickCookie } = useContext(GameContext);

  return (
    <div className="cookie" onClick={clickCookie}>
      {/* Add your cookie image or styling here */}
    </div>
  );
};

export default Cookie;