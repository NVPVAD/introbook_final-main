import React, { useState } from 'react';

const MobileMenu = () => {
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { path: '/home', label: 'Home', icon: '🏠' },
    { path: '/profile', label: 'Profile', icon: '👤' },
    { path: '/family-details', label: 'Family', icon: '👨👩👧👦' },
    { path: '/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/edit-profile', label: 'Edit Profile', icon: '✏️' }
  ];

  return (
    <>
      <button 
        style={{
          position: 'fixed',
          top: '15px',
          left: '15px',
          zIndex: 1000,
          background: '#667eea',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          width: '44px',
          height: '44px',
          fontSize: '18px',
          cursor: 'pointer',
          display: 'block'
        }}
        onClick={() => setIsOpen(true)}
      >
        ☰
      </button>
      
      {isOpen && (
        <>
          <div 
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.5)',
              zIndex: 1001
            }}
            onClick={() => setIsOpen(false)}
          />
          <div 
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '280px',
              height: '100vh',
              background: 'white',
              zIndex: 1002,
              padding: '20px',
              boxShadow: '2px 0 10px rgba(0,0,0,0.1)'
            }}
          >
            <button 
              style={{
                position: 'absolute',
                top: '15px',
                right: '15px',
                background: 'none',
                border: 'none',
                fontSize: '20px',
                cursor: 'pointer'
              }}
              onClick={() => setIsOpen(false)}
            >
              ✕
            </button>
            
            <h3 style={{ marginTop: '40px', color: '#667eea' }}>IntroBook</h3>
            
            {menuItems.map(item => (
              <div 
                key={item.path}
                style={{
                  padding: '15px 10px',
                  borderBottom: '1px solid #eee',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}
                onClick={() => {
                  window.location.href = item.path;
                  setIsOpen(false);
                }}
              >
                <span style={{ fontSize: '18px' }}>{item.icon}</span>
                <span>{item.label}</span>
              </div>
            ))}
            
            <div 
              style={{
                padding: '15px 10px',
                cursor: 'pointer',
                color: '#ff4757',
                fontWeight: 'bold',
                marginTop: '20px'
              }}
              onClick={() => {
                localStorage.clear();
                window.location.href = '/signin';
              }}
            >
              🚪 Logout
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default MobileMenu;