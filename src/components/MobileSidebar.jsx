import React, { useState } from 'react';
import './MobileSidebar.css';

const MobileSidebar = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button className="mobile-menu-btn" onClick={() => setIsOpen(true)}>
        ☰
      </button>
      
      {isOpen && (
        <>
          <div className="mobile-sidebar-overlay" onClick={() => setIsOpen(false)} />
          <div className="mobile-sidebar">
            <button className="mobile-sidebar-close" onClick={() => setIsOpen(false)}>
              ✕
            </button>
            <div className="mobile-sidebar-content">
              {children}
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default MobileSidebar;