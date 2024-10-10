import React, { useContext, useRef } from 'react';
import { GameContext } from '../App';

const Cookie = ({ createParticle }) => {
  const { clickCookie } = useContext(GameContext);
  const cookieRef = useRef(null);

  const handleClick = (e) => {
    clickCookie();
    if (cookieRef.current) {
      const rect = cookieRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const topY = rect.top;
      createParticle(centerX, topY);
    }
  };

  return (
    <div ref={cookieRef} className="cookie" onClick={handleClick} />
  );
};

export default Cookie;