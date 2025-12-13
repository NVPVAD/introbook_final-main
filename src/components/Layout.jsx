// src/components/Layout.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSidebar } from '../contexts/SidebarContext';
import axios from '../axiosConfig';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { useTranslation } from '../hooks/useTranslation';
import './ResponsiveLayout.css';
dayjs.extend(relativeTime);

const Layout = ({ children, title = "IntroBook", showHeader = true }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { sidebarPinned, setSidebarPinned } = useSidebar();
  const { t } = useTranslation();
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [userName, setUserName] = useState('User');
  const [userAvatar, setUserAvatar] = useState('');
  const [familyCount, setFamilyCount] = useState(0);
  const [userType, setUserType] = useState('main_user');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [weatherInfo, setWeatherInfo] = useState({ temp: '22°C', condition: '☀️' });
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 480);

  useEffect(() => {
    setSidebarExpanded(sidebarPinned);
  }, [sidebarPinned]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        const userInfo = localStorage.getItem('userInfo');
        let userType = 'main_user';
        if (userInfo) {
          const parsedUserInfo = JSON.parse(userInfo);
          userType = parsedUserInfo.user_type || 'main_user';
        }
        if (userType === 'family_member') {
          const response = await axios.get('family-member/family/', {
            headers: { Authorization: `Token ${token}` }
          });
          if (response.data?.success && response.data.family_data?.main_user) {
            const mainUser = response.data.family_data.main_user;
            const name = mainUser.name || mainUser.surname || 'User';
            setUserName(name);
            setUserAvatar(mainUser.avatar ? 
              (mainUser.avatar.startsWith('http') ? mainUser.avatar : `http://localhost:8000${mainUser.avatar}`) :
              `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=e3f2fd&color=1976d2&size=128`
            );
            setFamilyCount(Array.isArray(response.data.family_data.family_members) ? response.data.family_data.family_members.length + 1 : 1);
          }
        } else {
          const response = await axios.get('profile/edit/', {
            headers: { Authorization: `Token ${token}` }
          });
          const data = response.data;
          const name = data.name || data.surname || 'User';
          setUserName(name);
          setUserAvatar(data.avatar ? 
            (data.avatar.startsWith('http') ? data.avatar : `http://localhost:8000${data.avatar}`) :
            `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=e3f2fd&color=1976d2&size=128`
          );
          setFamilyCount(Array.isArray(data.family_members) ? data.family_members.length + 1 : 1);
        }
        setUserType(userType);
      } catch (error) {
        setUserName('User');
        setUserAvatar('https://ui-avatars.com/api/?name=User&background=e3f2fd&color=1976d2&size=128');
        setFamilyCount(1);
      }
    };



    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('dashboard/stats/', {
          headers: { Authorization: `Token ${token}` }
        });
        if (response.data.success) {
          setUnreadMessages(response.data.unread_messages || 0);
        }
      } catch (error) {
        setUnreadMessages(3);
      }
    };

    fetchProfile();
    fetchStats();

    const timeInterval = setInterval(() => setCurrentTime(new Date()), 60000);
    
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 480);
      if (window.innerWidth > 480) {
        setMobileMenuOpen(false);
      }
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      clearInterval(timeInterval);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userInfo');
    navigate('/');
  };



  const navigationItems = [
    { title: t('home'), route: '/home', icon: '🏠', color: '#e8f5e8' },
    { title: t('myProfile'), route: '/profile', icon: '👤', color: '#e3f2fd' },
    ...(userType !== 'family_member' ? [
      { title: t('editProfile'), route: '/edit-profile', icon: '✏️', color: '#fff3e0' },
    ] : []),
    { title: t('dashboard'), route: '/dashboard', icon: '📊', color: '#e8f5e8' },
    { title: t('familyDetails'), route: '/family-details', icon: '👪', color: '#fce4ec' },
    { title: t('connections'), route: '/connections', icon: '🤝', color: '#f3e5f5' },
    { title: t('messages'), route: '/messages', icon: '💬', color: '#e0f2f1' },
    { title: t('events'), route: '/events', icon: '📅', color: '#fff8e1' },
  ];

  console.log('Navigation items:', navigationItems);

  return (
    <div className="layout-responsive" style={{
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      fontFamily: '"Inter", "Segoe UI", Arial, sans-serif'
    }}>
      {/* Left Sidebar */}
      <div 
        className={`sidebar-responsive ${isMobile && mobileMenuOpen ? 'expanded' : ''} ${!sidebarExpanded ? 'collapsed' : ''}`}
        style={{
          width: isMobile ? '100%' : (sidebarExpanded ? '300px' : '85px'),
          background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 255, 0.98) 100%)',
          backdropFilter: 'blur(25px)',
          borderRight: isMobile ? 'none' : '1px solid rgba(102, 126, 234, 0.1)',
          borderBottom: isMobile ? '1px solid rgba(102, 126, 234, 0.1)' : 'none',
          boxShadow: sidebarExpanded ? '0 20px 60px rgba(102, 126, 234, 0.15)' : '0 10px 30px rgba(0, 0, 0, 0.08)',
          overflow: isMobile ? 'visible' : 'hidden'
        }}
        onMouseEnter={() => !sidebarPinned && !isMobile && setSidebarExpanded(true)}
        onMouseLeave={() => !sidebarPinned && !isMobile && setSidebarExpanded(false)}
      >


        {/* User Avatar and Name */}
        <div 
          className={isMobile ? 'sidebar-user-mobile' : (window.innerWidth <= 768 ? 'sidebar-user-tablet' : '')}
          style={{
            padding: isMobile ? '12px 16px' : (sidebarExpanded ? '25px 20px' : '25px 15px'),
            textAlign: isMobile ? 'left' : 'center',
            borderBottom: '1px solid rgba(102, 126, 234, 0.1)',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            background: sidebarExpanded ? 'linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)' : 'transparent',
            display: isMobile ? 'flex' : 'block',
            justifyContent: isMobile ? 'space-between' : 'center',
            alignItems: isMobile ? 'center' : 'stretch'
          }}
          onClick={() => isMobile ? null : navigate('/profile')}
        >
          {isMobile ? (
            <div className="sidebar-user-info-mobile" style={{ display: 'flex', alignItems: 'center', gap: '12px' }} onClick={() => navigate('/profile')}>
              <div 
                className={isMobile ? 'sidebar-avatar-mobile' : (window.innerWidth <= 768 ? 'sidebar-avatar-tablet' : '')}
                style={{
                  width: isMobile ? '36px' : (sidebarExpanded ? '55px' : '45px'),
                  height: isMobile ? '36px' : (sidebarExpanded ? '55px' : '45px'),
                  borderRadius: '50%',
                  margin: isMobile ? '0' : (sidebarExpanded ? '0 auto 15px' : '0 auto 10px'),
                  overflow: 'hidden',
                  border: '3px solid rgba(102, 126, 234, 0.3)',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 8px 25px rgba(102, 126, 234, 0.2)'
                }}>
                <img
                  src={userAvatar}
                  alt={userName}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                  onError={(e) => {
                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=e3f2fd&color=1976d2&size=128`;
                  }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <h3 className="sidebar-name-mobile" style={{
                  margin: '0 0 2px 0',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  color: '#2c3e50'
                }}>
                  {userName}
                </h3>
                <p className="sidebar-family-count-mobile" style={{
                  margin: 0,
                  fontSize: '0.7rem',
                  color: '#7f8c8d'
                }}>
                  {familyCount} {t('familyMembers').toLowerCase()}
                </p>
              </div>
            </div>
          ) : (
            <>
              <div 
                className={window.innerWidth <= 768 ? 'sidebar-avatar-tablet' : ''}
                style={{
                  width: sidebarExpanded ? '55px' : '45px',
                  height: sidebarExpanded ? '55px' : '45px',
                  borderRadius: '50%',
                  margin: sidebarExpanded ? '0 auto 15px' : '0 auto 10px',
                  overflow: 'hidden',
                  border: '3px solid rgba(102, 126, 234, 0.3)',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 8px 25px rgba(102, 126, 234, 0.2)'
                }}>
                <img
                  src={userAvatar}
                  alt={userName}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                  onError={(e) => {
                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=e3f2fd&color=1976d2&size=128`;
                  }}
                />
              </div>
              <div style={{
                opacity: sidebarExpanded ? 1 : 0,
                transform: sidebarExpanded ? 'translateX(0)' : 'translateX(-20px)',
                transition: 'all 0.3s ease',
                whiteSpace: 'nowrap'
              }}>
                <h3 style={{
                  margin: '0 0 5px 0',
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  color: '#2c3e50'
                }}>
                  {userName}
                </h3>
                <p style={{
                  margin: 0,
                  fontSize: '0.85rem',
                  color: '#7f8c8d'
                }}>
                  {familyCount} {t('familyMembers').toLowerCase()}
                </p>
              </div>
            </>
          )}
          
          {isMobile && (
            <button 
              className="mobile-menu-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '1.5rem',
                cursor: 'pointer',
                padding: '8px',
                borderRadius: '8px',
                transition: 'all 0.3s ease'
              }}
            >
              {mobileMenuOpen ? '✕' : '☰'}
            </button>
          )}
        </div>

        {/* Navigation Items */}
        <div 
          className={isMobile ? `sidebar-nav-mobile ${mobileMenuOpen ? 'expanded' : ''}` : ''}
          style={{ 
            padding: isMobile ? (mobileMenuOpen ? '16px' : '0') : '25px 0 15px 0',
            height: isMobile ? 'auto' : 'calc(100vh - 280px)',
            overflowY: isMobile ? 'visible' : 'auto',
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(102, 126, 234, 0.3) transparent',
            display: isMobile && !mobileMenuOpen ? 'none' : 'block'
          }}>
          {navigationItems.map((item, index) => {
            // Ensure all items are always visible
            return (
              <div
                key={item.title}
                className={isMobile ? 'nav-item-mobile' : (window.innerWidth <= 768 ? 'nav-item-tablet' : '')}
                onClick={() => {
                  navigate(item.route);
                  if (isMobile) setMobileMenuOpen(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: isMobile ? '12px 16px' : (sidebarExpanded ? '16px 22px' : '16px 12px'),
                  margin: isMobile ? '4px 0' : (sidebarExpanded ? '6px 15px' : '6px 8px'),
                  borderRadius: isMobile ? '12px' : '16px',
                  cursor: 'pointer',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  background: location.pathname === item.route ? 
                    'linear-gradient(135deg, rgba(102, 126, 234, 0.15) 0%, rgba(118, 75, 162, 0.15) 100%)' : 
                    'transparent',
                  border: location.pathname === item.route ? '1px solid rgba(102, 126, 234, 0.2)' : '1px solid transparent',
                  transform: 'translateX(0)',
                  opacity: 1,
                  animationDelay: `${index * 0.05}s`,
                  justifyContent: (sidebarExpanded || isMobile) ? 'flex-start' : 'center',
                  gap: isMobile ? '12px' : '0'
                }}
                onMouseEnter={(e) => {
                  if (location.pathname !== item.route) {
                    e.currentTarget.style.background = 'linear-gradient(135deg, rgba(102, 126, 234, 0.08) 0%, rgba(118, 75, 162, 0.08) 100%)';
                    e.currentTarget.style.border = '1px solid rgba(102, 126, 234, 0.15)';
                  }
                  e.currentTarget.style.transform = sidebarExpanded ? 'translateX(8px) scale(1.02)' : 'scale(1.08)';
                  e.currentTarget.style.boxShadow = '0 12px 35px rgba(102, 126, 234, 0.15)';
                }}
                onMouseLeave={(e) => {
                  if (location.pathname !== item.route) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.border = '1px solid transparent';
                  }
                  e.currentTarget.style.transform = 'translateX(0) scale(1)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <span 
                  className={isMobile ? 'nav-icon-mobile' : (window.innerWidth <= 768 ? 'nav-icon-tablet' : '')}
                  style={{
                    fontSize: isMobile ? '1.3rem' : (sidebarExpanded ? '1.6rem' : '1.8rem'),
                    minWidth: isMobile ? '24px' : (sidebarExpanded ? '45px' : 'auto'),
                    textAlign: 'center',
                    transition: 'all 0.3s ease',
                    display: 'block',
                    filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1))'
                  }}>
                  {item.icon}
                </span>
                {(sidebarExpanded || isMobile) && (
                  <span 
                    className={isMobile ? 'nav-text-mobile' : (window.innerWidth <= 768 ? 'nav-text-tablet' : '')}
                    style={{
                      marginLeft: isMobile ? '0' : '18px',
                      fontSize: isMobile ? '0.9rem' : '1rem',
                      fontWeight: '600',
                      color: location.pathname === item.route ? '#667eea' : '#2c3e50',
                      opacity: (sidebarExpanded || isMobile) ? 1 : 0,
                      transform: (sidebarExpanded || isMobile) ? 'translateX(0)' : 'translateX(-20px)',
                      transition: 'all 0.3s ease',
                      whiteSpace: 'nowrap',
                      letterSpacing: '0.3px'
                    }}>
                    {item.title}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Logout Button */}
        <div style={{
          position: isMobile ? 'static' : 'absolute',
          bottom: isMobile ? 'auto' : '25px',
          left: isMobile ? 'auto' : '15px',
          right: isMobile ? 'auto' : '15px',
          padding: isMobile ? '12px 16px' : '0',
          display: isMobile && !mobileMenuOpen ? 'none' : 'block'
        }}>
          <button
            className={isMobile ? 'logout-btn-mobile' : ''}
            onClick={() => {
              handleLogout();
              if (isMobile) setMobileMenuOpen(false);
            }}
            style={{
              width: '100%',
              padding: isMobile ? '10px 16px' : '14px 16px',
              background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%)',
              color: 'white',
              border: 'none',
              borderRadius: isMobile ? '12px' : '16px',
              fontSize: isMobile ? '0.9rem' : '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 25px rgba(255, 107, 107, 0.3)',
              backdropFilter: 'blur(10px)'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-3px) scale(1.02)';
              e.target.style.boxShadow = '0 12px 35px rgba(255, 107, 107, 0.4)';
              e.target.style.background = 'linear-gradient(135deg, #ff5252 0%, #d32f2f 100%)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0) scale(1)';
              e.target.style.boxShadow = '0 8px 25px rgba(255, 107, 107, 0.3)';
              e.target.style.background = 'linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%)';
            }}
          >
            <span style={{ 
              fontSize: isMobile ? '1.2rem' : (sidebarExpanded ? '1.3rem' : '1.5rem'), 
              marginRight: (sidebarExpanded || isMobile) ? '10px' : '0',
              transition: 'all 0.3s ease',
              filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.2))'
            }}>🚪</span>
            {(sidebarExpanded || isMobile) && (
              <span style={{
                opacity: 1,
                transition: 'all 0.3s ease',
                letterSpacing: '0.5px'
              }}>
                {t('logout')}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div 
        className={`main-content-responsive ${!sidebarExpanded ? 'sidebar-collapsed' : ''}`}
        style={{
          marginLeft: isMobile ? '0' : (sidebarExpanded ? '280px' : '80px'),
          marginTop: isMobile ? '60px' : '0',
          flex: 1,
          padding: isMobile ? '16px 12px' : '30px',
          overflow: 'auto',
          width: isMobile ? '100%' : 'auto',
          boxSizing: 'border-box'
        }}>
        {showHeader && (
          <div 
            className="header-responsive"
            style={{
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.95) 100%)',
              backdropFilter: 'blur(20px)',
              borderRadius: isMobile ? '16px' : '25px',
              padding: isMobile ? '16px 20px' : '25px 35px',
              marginBottom: isMobile ? '16px' : '25px',
              boxShadow: '0 15px 35px rgba(0, 0, 0, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              position: 'relative',
              overflow: 'hidden'
            }}>
            <div 
              className="header-content-responsive"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: isMobile ? '12px' : '16px',
                flexDirection: isMobile ? 'column' : 'row',
                textAlign: isMobile ? 'center' : 'left'
              }}>
              <div>
                <h1 
                  className="header-title-responsive"
                  style={{
                    fontSize: isMobile ? '1.5rem' : '2rem',
                    fontWeight: '700',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    margin: isMobile ? '0 0 4px 0' : '0 0 8px 0'
                  }}>
                  {title}
                </h1>
                <div 
                  className="header-subtitle-responsive"
                  style={{
                    fontSize: isMobile ? '0.8rem' : '0.9rem',
                    color: '#64748b'
                  }}>
                  🕒 {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
              
              {/* Welcome Message */}
              <div 
                className="header-welcome-responsive"
                style={{
                  fontSize: isMobile ? '0.9rem' : '1rem',
                  color: '#64748b',
                  fontStyle: 'italic'
                }}>
                {t('wonderfulDay')}
              </div>
            </div>
          </div>
        )}
        
        {/* Page Content */}
        {children}
      </div>
      

    </div>
  );
};

export default Layout;