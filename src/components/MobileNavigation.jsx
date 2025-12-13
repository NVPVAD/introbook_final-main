import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './MobileNavigation.css';

const MobileNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { path: '/home', label: 'Home', icon: '🏠' },
    { path: '/profile', label: 'Profile', icon: '👤' },
    { path: '/family-details', label: 'Family', icon: '👨‍👩‍👧‍👦' },
    { path: '/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/edit-profile', label: 'Edit', icon: '✏️' },
    { path: '/connections', label: 'Connect', icon: '🤝' },
    { path: '/messages', label: 'Messages', icon: '💬' },
    { path: '/events', label: 'Events', icon: '📅' }
  ];

  return (
    <div className="mobile-nav-menu">
      <div className="mobile-nav-header">
        <h3>IntroBook</h3>
      </div>
      <div className="mobile-nav-items">
        {navItems.map(item => (
          <button
            key={item.path}
            className={`mobile-nav-item ${location.pathname === item.path ? 'active' : ''}`}
            onClick={() => navigate(item.path)}
          >
            <span className="mobile-nav-icon">{item.icon}</span>
            <span className="mobile-nav-label">{item.label}</span>
          </button>
        ))}
      </div>
      <div className="mobile-nav-footer">
        <button 
          className="mobile-nav-logout"
          onClick={() => {
            localStorage.clear();
            navigate('/signin');
          }}
        >
          🚪 Logout
        </button>
      </div>
    </div>
  );
};

export default MobileNavigation;