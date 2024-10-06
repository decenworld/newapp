import React from 'react';

const MiscPopup = ({ onClose }) => {
  const copyToClipboard = () => {
    navigator.clipboard.writeText('2hXvyAYKJ8gAS8boLQmbpKHLfXZsR6zjmdq1yYHTfK1t');
    alert('Copied to clipboard!');
  };

  return (
    <div className="popup-overlay" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    }}>
      <div className="popup misc-popup" style={{
        backgroundColor: '#333',
        color: 'white',
        padding: '20px',
        borderRadius: '10px',
        maxWidth: '80%',
        width: '400px',
        textAlign: 'center',
      }}>
        <span 
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            color: 'white',
            fontSize: '24px',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          &times;
        </span>
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
      </div>
    </div>
  );
};

export default MiscPopup;
