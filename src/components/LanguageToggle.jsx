import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

const LanguageToggle = ({ inline = false, hideOnAdmin = false }) => {
  const { language, toggleLanguage } = useLanguage();
  
  // Hide on admin page if hideOnAdmin prop is true
  if (hideOnAdmin && window.location.pathname === '/admin') {
    return null;
  }

  if (inline) {
    // Inline version for auth forms
    return (
      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '15px',
        justifyContent: 'center'
      }}>
        <button 
          onClick={() => language !== 'en' && toggleLanguage()}
          style={{
            padding: '8px 16px',
            borderRadius: '20px',
            border: '2px solid #667eea',
            background: language === 'en' ? '#667eea' : 'white',
            color: language === 'en' ? 'white' : '#667eea',
            fontSize: '0.9rem',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            margin: '0',
            textTransform: 'none',
            letterSpacing: 'normal',
            boxShadow: 'none',
            width: 'auto',
            minWidth: '50px'
          }}
        >
          EN
        </button>
        <button 
          onClick={() => language !== 'gu' && toggleLanguage()}
          style={{
            padding: '8px 16px',
            borderRadius: '20px',
            border: '2px solid #667eea',
            background: language === 'gu' ? '#667eea' : 'white',
            color: language === 'gu' ? 'white' : '#667eea',
            fontSize: '0.9rem',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            margin: '0',
            textTransform: 'none',
            letterSpacing: 'normal',
            boxShadow: 'none',
            width: 'auto',
            minWidth: '50px'
          }}
        >
          ગુ
        </button>
      </div>
    );
  }

  // Check if we're on admin page
  const isAdminPage = window.location.pathname === '/admin';
  
  // Don't show language toggle on admin page
  if (isAdminPage) {
    return null;
  }

  // Fixed position version for other pages
  return (
    <button
      onClick={toggleLanguage}
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 1000,
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        border: 'none',
        borderRadius: '25px',
        padding: '12px 20px',
        fontSize: '14px',
        fontWeight: '600',
        cursor: 'pointer',
        boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)',
        transition: 'all 0.3s ease',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}
      onMouseEnter={(e) => {
        e.target.style.transform = 'translateY(-2px)';
        e.target.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.4)';
      }}
      onMouseLeave={(e) => {
        e.target.style.transform = 'translateY(0)';
        e.target.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.3)';
      }}
    >
      <span style={{ fontSize: '16px' }}>🌐</span>
      {language === 'en' ? 'ગુ' : 'EN'}
    </button>
  );
};

export default LanguageToggle;