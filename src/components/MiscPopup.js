import React from 'react';

const MiscPopup = ({ onClose }) => {
  const copyToClipboard = () => {
    navigator.clipboard.writeText('2hXvyAYKJ8gAS8boLQmbpKHLfXZsR6zjmdq1yYHTfK1t');
    alert('Copied to clipboard!');
  };

  return (
    <div className="popup-overlay" style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
      <div className="popup misc-popup" style={{backgroundColor: '#333', color: 'white', padding: '20px', borderRadius: '10px', maxWidth: '80%', textAlign: 'center'}}>
        <h2 style={{marginBottom: '20px'}}>Welcome to Cookie Clicker</h2>
        <p>
          All our games will be bound to coin STEF coin
          <br />
          Get in now before and get the benefits of holding it
          <br />
          Only on solana
          <br />
          CA:
          <br />
          <span 
            onClick={copyToClipboard} 
            style={{cursor: 'pointer', textDecoration: 'underline'}}
          >
            2hXvyAYKJ8gAS8boLQmbpKHLfXZsR6zjmdq1yYHT
          </span>
        </p>
        <button onClick={() => {
          console.log('Close button clicked');
          onClose();
        }} className="close-button">Close</button>
      </div>
    </div>
  );
};

export default MiscPopup;
