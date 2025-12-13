import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../axiosConfig';
import Layout from '../components/Layout';
import LanguageToggle from '../components/LanguageToggle';
import { useTranslation } from '../hooks/useTranslation';
import '../styles/ModernStyles.css';
import './HomeResponsive.css';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
dayjs.extend(relativeTime);

const Home = () => {
  const navigate = useNavigate();
  const { t, language } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState([]);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [activeMembers, setActiveMembers] = useState(0);
  const [dailyQuote, setDailyQuote] = useState("");
  const [currentWeather, setCurrentWeather] = useState({ temp: '22°C', icon: '☀️' });
  const [selectedBanner, setSelectedBanner] = useState(null);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('activities/', {
          headers: { Authorization: `Token ${token}` }
        });
        setActivities(response.data);
      } catch (error) {
        setActivities([]);
      }
    };
    
    const fetchDashboardStats = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('dashboard/stats/', {
          headers: { Authorization: `Token ${token}` }
        });
        if (response.data.success) {
          setUnreadMessages(response.data.unread_messages || 0);
          setUpcomingEvents(response.data.upcoming_events || []);
          setActiveMembers(response.data.active_members || 0);
        }
      } catch (error) {
        fetchEventsData();
        fetchMessagesData();
      }
    };
    
    const fetchMessagesData = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('community/messages/', {
          headers: { Authorization: `Token ${token}` }
        });
        if (response.data.success) {
          const totalUnread = response.data.conversations.reduce((total, conv) => {
            return total + (conv.unread_count || 0);
          }, 0);
          setUnreadMessages(totalUnread);
        }
      } catch (error) {
        setUnreadMessages(0);
      }
    };
    
    const fetchEventsData = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('community/events/', {
          headers: { Authorization: `Token ${token}` }
        });
        if (response.data.success) {
          const deletedEvents = JSON.parse(localStorage.getItem('deletedEvents') || '[]');
          const allEvents = [
            ...response.data.organized_events.filter(event => !deletedEvents.includes(event.id)),
            ...response.data.invited_events.filter(event => !deletedEvents.includes(event.id)),
            ...response.data.public_events.filter(event => !deletedEvents.includes(event.id))
          ];
          const now = new Date();
          const upcoming = allEvents
            .filter(event => new Date(event.event_date) > now)
            .sort((a, b) => new Date(a.event_date) - new Date(b.event_date))
            .slice(0, 4);
          setUpcomingEvents(upcoming);
        }
      } catch (error) {
        setUpcomingEvents([]);
      }
    };
    
    const loadDailyContent = () => {
      const quotes = [
        language === 'en' ? "Family is where life begins and love never ends." : "કુટુંબ એ તે સ્થળ છે જ્યાં જીવન શરૂ થાય છે અને પ્રેમ ક્યારેય સમાપ્ત થતો નથી.",
        language === 'en' ? "Together is a wonderful place to be." : "સાથે રહેવું એ એક અદ્ભુત સ્થળ છે.",
        language === 'en' ? "Family time is the best time." : "કુટુંબનો સમય એ શ્રેષ્ઠ સમય છે.",
        language === 'en' ? "The love of family is life's greatest blessing." : "કુટુંબનો પ્રેમ એ જીવનનું સૌથી મોટું આશીર્વાદ છે.",
        language === 'en' ? "Home is where the heart is." : "ઘર એ તે સ્થળ છે જ્યાં હૃદય છે."
      ];
      const weather = [
        { temp: '20°C', icon: '☀️' },
        { temp: '22°C', icon: '⛅' },
        { temp: '18°C', icon: '🌧️' },
        { temp: '25°C', icon: '🌤️' }
      ];
      
      const today = new Date().getDate();
      setDailyQuote(quotes[today % quotes.length]);
      setCurrentWeather(weather[today % weather.length]);
      
      // Set sample activities with translations
      if (activities.length === 0) {
        setActivities([
          {
            id: 1,
            text: language === 'en' ? "Sarah shared new family photos from the weekend trip" : "સારાહે સપ્તાહાંતની સફરના નવા કુટુંબના ફોટા શેર કર્યા",
            user: "Sarah Johnson",
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
            type: "photo_share"
          },
          {
            id: 2,
            text: language === 'en' ? "Michael updated his profile with graduation photos" : "માઇકલે તેની પ્રોફાઇલ ગ્રેજ્યુએશન ફોટા સાથે અપડેટ કરી",
            user: "Michael Johnson",
            timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
            type: "profile_update"
          },
          {
            id: 3,
            text: language === 'en' ? "Mom created a new family event: Sunday Dinner" : "મમ્મીએ નવો કુટુંબ કાર્યક્રમ બનાવ્યો: રવિવારનું ડિનર",
            user: "Linda Johnson",
            timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
            type: "event_created"
          }
        ]);
      }
    };

    fetchActivities();
    fetchDashboardStats();
    loadDailyContent();
    setLoading(false);
  }, [language]);

  if (loading) {
    return (
      <Layout title={t('home')}>
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '400px',
          fontSize: '1.2rem',
          color: '#666'
        }}>{t('loading')}</div>
      </Layout>
    );
  }

  return (
    <div className="home-responsive">
      <style>
        {`
          @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(40px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes bounce {
            0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
            40% { transform: translateY(-10px); }
            60% { transform: translateY(-5px); }
          }
          @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
          }
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-10px); }
          }
          @keyframes slideLeftToRight {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(0%); }
          }
          .gradient-text {
            background: linear-gradient(45deg, #667eea, #764ba2, #f093fb, #f5576c);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
          }
        `}
      </style>
      <Layout title={t('home')}>
        <LanguageToggle />
        {/* Event Banners Section */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.95) 100%)',
          backdropFilter: 'blur(25px)',
          borderRadius: '35px',
          padding: '40px',
          marginBottom: '40px',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.4)',
          overflow: 'hidden',
          animation: 'fadeInUp 1s ease-out'
        }}>
          <h2 style={{
            fontSize: '2.4rem',
            fontWeight: '800',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '30px',
            textAlign: 'center',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '15px'
          }}>🎯 {t('eventInvitations') || 'Event Invitations'}</h2>
          
          <div style={{
            position: 'relative',
            height: '200px',
            overflow: 'hidden',
            borderRadius: '20px',
            background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.05), rgba(118, 75, 162, 0.05))'
          }}>
            <div style={{
              display: 'flex',
              animation: 'slideLeftToRight 20s linear infinite',
              height: '100%'
            }}>
              {[
                {
                  title: 'Blood Donation Camp',
                  date: 'Dec 25, 2024',
                  img: 'https://images.unsplash.com/photo-1615461066841-6116e61058f4?w=400&h=250&fit=crop',
                  icon: '🩸'
                },
                {
                  title: 'Health Checkup Drive',
                  date: 'Jan 15, 2025',
                  img: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=400&h=250&fit=crop',
                  icon: '🏥'
                },
                {
                  title: 'Education Seminar',
                  date: 'Feb 10, 2025',
                  img: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=400&h=250&fit=crop',
                  icon: '📚'
                },
                {
                  title: 'Community Clean-up',
                  date: 'Mar 5, 2025',
                  img: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=250&fit=crop',
                  icon: '🌱'
                },
                {
                  title: 'Blood Donation Camp',
                  date: 'Dec 25, 2024',
                  img: 'https://images.unsplash.com/photo-1615461066841-6116e61058f4?w=400&h=250&fit=crop',
                  icon: '🩸'
                },
                {
                  title: 'Health Checkup Drive',
                  date: 'Jan 15, 2025',
                  img: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=400&h=250&fit=crop',
                  icon: '🏥'
                }
              ].map((banner, index) => (
                <div key={index} style={{
                  minWidth: '280px',
                  height: '180px',
                  margin: '10px 15px',
                  borderRadius: '15px',
                  backgroundImage: `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.6)), url(${banner.img})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
                  transition: 'transform 0.3s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  color: 'white',
                  textAlign: 'center',
                  cursor: 'pointer'
                }}
                onClick={() => setSelectedBanner(banner)}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05) translateY(-5px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1) translateY(0)'}>
                  <div style={{ fontSize: '3rem', marginBottom: '10px' }}>{banner.icon}</div>
                  <h3 style={{ fontSize: '1.3rem', fontWeight: '700', margin: '0 0 8px 0', textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>{banner.title}</h3>
                  <p style={{ fontSize: '1rem', margin: '0', opacity: '0.9', textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>{banner.date}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* Welcome Section */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.15), rgba(118, 75, 162, 0.15), rgba(240, 147, 251, 0.1))',
          borderRadius: '35px',
          padding: '60px 40px',
          marginBottom: '40px',
          textAlign: 'center',
          animation: 'fadeInUp 0.8s ease-out',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          backdropFilter: 'blur(10px)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute',
            top: '-50px',
            right: '-50px',
            fontSize: '8rem',
            opacity: 0.15,
            animation: 'float 6s ease-in-out infinite'
          }}>🏠</div>
          
          <h1 className="gradient-text" style={{
            fontSize: '3.5rem',
            fontWeight: '900',
            margin: '0 0 20px 0',
            letterSpacing: '-1px'
          }}>{t('welcomeHome')}</h1>
          <p style={{
            fontSize: '1.3rem',
            color: '#64748b',
            margin: '0 0 30px 0'
          }}>{t('familyConnectSubtitle')}</p>
          
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '30px',
            flexWrap: 'wrap'
          }}>
            <div style={{ 
              textAlign: 'center',
              padding: '20px',
              borderRadius: '20px',
              background: 'rgba(255, 255, 255, 0.1)',
              cursor: 'pointer',
              transition: 'transform 0.3s ease'
            }}
            onMouseEnter={(e) => e.target.style.transform = 'translateY(-5px)'}
            onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}>
              <div style={{ fontSize: '3rem', marginBottom: '8px', animation: 'bounce 2s infinite' }}>💬</div>
              <div style={{ fontSize: '2rem', fontWeight: '800', color: '#4facfe' }}>{unreadMessages}</div>
              <div style={{ fontSize: '1rem', color: '#64748b', fontWeight: '600' }}>{t('newMessages')}</div>
            </div>
            <div style={{ 
              textAlign: 'center',
              padding: '20px',
              borderRadius: '20px',
              background: 'rgba(255, 255, 255, 0.1)',
              cursor: 'pointer',
              transition: 'transform 0.3s ease'
            }}
            onMouseEnter={(e) => e.target.style.transform = 'translateY(-5px)'}
            onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}>
              <div style={{ fontSize: '3rem', marginBottom: '8px', animation: 'bounce 2s infinite', animationDelay: '0.5s' }}>📅</div>
              <div style={{ fontSize: '2rem', fontWeight: '800', color: '#ff9800' }}>{upcomingEvents.length}</div>
              <div style={{ fontSize: '1rem', color: '#64748b', fontWeight: '600' }}>{t('upcomingEvents')}</div>
            </div>
            <div style={{ 
              textAlign: 'center',
              padding: '20px',
              borderRadius: '20px',
              background: 'rgba(255, 255, 255, 0.1)',
              cursor: 'pointer',
              transition: 'transform 0.3s ease'
            }}
            onMouseEnter={(e) => e.target.style.transform = 'translateY(-5px)'}
            onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}>
              <div style={{ fontSize: '3rem', marginBottom: '8px', animation: 'bounce 2s infinite', animationDelay: '1s' }}>👥</div>
              <div style={{ fontSize: '2rem', fontWeight: '800', color: '#4caf50' }}>{activeMembers}</div>
              <div style={{ fontSize: '1rem', color: '#64748b', fontWeight: '600' }}>{t('familyMembers')}</div>
            </div>
          </div>
          
          {/* Daily Quote & Weather */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '40px',
            padding: '25px',
            background: 'rgba(255, 255, 255, 0.4)',
            borderRadius: '20px',
            border: '1px solid rgba(255, 255, 255, 0.5)',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ flex: 1, textAlign: 'left' }}>
              <div style={{
                fontSize: '1rem',
                fontStyle: 'italic',
                color: '#2c3e50',
                fontWeight: '500'
              }}>
                "{dailyQuote}"
              </div>
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginLeft: '20px'
            }}>
              <span style={{ fontSize: '2.5rem', animation: 'pulse 3s infinite' }}>{currentWeather.icon}</span>
              <span style={{
                fontSize: '1.4rem',
                fontWeight: '700',
                color: '#2c3e50',
                textShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}>{currentWeather.temp}</span>
            </div>
          </div>
        </div>

        {/* Family Activities */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.95) 100%)',
          backdropFilter: 'blur(25px)',
          borderRadius: '30px',
          padding: '40px',
          marginBottom: '40px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.4)',
          animation: 'fadeInUp 0.8s ease-out'
        }}>
          <h2 style={{
            fontSize: '2.4rem',
            fontWeight: '800',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '30px',
            display: 'flex',
            alignItems: 'center',
            gap: '15px'
          }}>🌟 {t('whatsHappening')}</h2>
          
          {activities.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '60px 20px',
              background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
              borderRadius: '20px',
              border: '2px dashed #dee2e6'
            }}>
              <div style={{ fontSize: '4rem', marginBottom: '20px', animation: 'pulse 2s infinite' }}>🌱</div>
              <h3 style={{ fontSize: '1.5rem', color: '#64748b', marginBottom: '10px' }}>{t('familyStoryStarts')}</h3>
              <p style={{ fontSize: '1.1rem', color: '#94a3b8' }}>{t('shareMemories')}</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
              {activities.slice(0, 3).map((activity, index) => (
                <div key={index} style={{
                  padding: '30px',
                  background: 'linear-gradient(135deg, rgba(79, 172, 254, 0.08) 0%, rgba(0, 242, 254, 0.08) 100%)',
                  borderRadius: '25px',
                  border: '1px solid rgba(79, 172, 254, 0.15)',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-8px) scale(1.02)';
                  e.currentTarget.style.boxShadow = '0 20px 40px rgba(79, 172, 254, 0.25)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0) scale(1)';
                  e.currentTarget.style.boxShadow = 'none';
                }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '15px' }}>💖</div>
                  <div style={{ fontWeight: '600', marginBottom: '10px', fontSize: '1.1rem', color: '#2c3e50' }}>
                    {language === 'en' ? activity.text : 
                      activity.text
                        .replace(/Sent connection request to (.+) family/g, '$1 કુટુંબને કનેક્શન વિનંતી મોકલી')
                        .replace(/Connected with (.+) family/g, '$1 કુટુંબ સાથે જોડાયા')
                        .replace('patel Dharmik', 'પટેલ ધાર્મિક')
                        .replace('Varmora Ashish', 'વરમોરા આશીષ')
                        .replace('Panesara Shivam', 'પાનેસરા શિવમ')
                        .replace('Sarah Johnson', 'સારા જોહનસન')
                        .replace('Michael Johnson', 'માઇકલ જોહનસન')
                        .replace('Linda Johnson', 'લિન્ડા જોહનસન')
                        .replace('shared new family photos', 'નવા કુટુંબના ફોટા શેર કર્યા')
                        .replace('updated his profile', 'તેની પ્રોફાઇલ અપડેટ કરી')
                        .replace('created a new family event', 'નવો કુટુંબ કાર્યક્રમ બનાવ્યો')
                    }
                  </div>
                  <div style={{ fontSize: '0.9rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>👤 {activity.user}</span>
                    <span>•</span>
                    <span>{dayjs(activity.timestamp).fromNow()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Events */}
        {upcomingEvents.length > 0 && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.95) 100%)',
            backdropFilter: 'blur(20px)',
            borderRadius: '25px',
            padding: '30px',
            marginBottom: '30px',
            boxShadow: '0 15px 35px rgba(0, 0, 0, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            animation: 'fadeInUp 1s ease-out'
          }}>
            <h3 style={{
              fontSize: '1.6rem',
              fontWeight: '700',
              color: '#2c3e50',
              marginBottom: '25px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>📅 {t('upcomingFamilyEvents')}</h3>
            <div style={{ display: 'grid', gap: '25px' }}>
              {upcomingEvents.map((event, index) => (
                <div key={event.id} style={{
                  padding: '25px 30px',
                  background: 'linear-gradient(135deg, rgba(255, 152, 0, 0.12) 0%, rgba(255, 193, 7, 0.12) 100%)',
                  borderRadius: '22px',
                  border: '1px solid rgba(255, 152, 0, 0.25)',
                  transition: 'all 0.4s ease',
                  cursor: 'pointer'
                }}>
                  <h4 style={{ 
                    margin: '0 0 15px 0', 
                    color: '#2c3e50',
                    fontSize: '1.5rem',
                    fontWeight: '800'
                  }}>{event.title}</h4>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '15px',
                    fontSize: '1rem',
                    color: '#64748b',
                    flexWrap: 'wrap'
                  }}>
                    <span>📅 {dayjs(event.event_date).format('ddd, MMM DD')}</span>
                    <span>🕰️ {dayjs(event.event_date).format('HH:mm')}</span>
                    {event.location && <span>📍 {event.location}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Family Navigation */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.95) 100%)',
          backdropFilter: 'blur(25px)',
          borderRadius: '35px',
          padding: '50px',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.4)',
          animation: 'fadeInUp 1.2s ease-out'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '50px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px', marginBottom: '20px' }}>
              <span style={{ fontSize: '3rem', animation: 'bounce 2s infinite' }}>🏠</span>
              <h2 style={{
                fontSize: '2.8rem',
                fontWeight: '900',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                margin: '0'
              }}>{t('yourFamilyHub')}</h2>
            </div>
            <p style={{
              fontSize: '1.3rem',
              color: '#64748b',
              margin: 0,
              fontWeight: '500'
            }}>{t('stayConnected')}</p>
          </div>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '25px'
          }}>
            {[
              { 
                icon: '👤', 
                title: t('myProfile'), 
                desc: t('viewManageProfile'),
                route: '/profile'
              },
              { 
                icon: '💬', 
                title: t('messages'), 
                desc: `${t('chatMembers')} ${unreadMessages > 0 ? `(${unreadMessages} ${t('new')})` : ''}`,
                route: '/messages'
              },
              { 
                icon: '📅', 
                title: t('events'), 
                desc: `${t('planGatherings')} ${upcomingEvents.length > 0 ? `(${upcomingEvents.length} ${t('upcoming')})` : ''}`,
                route: '/events'
              },
              { 
                icon: '🤝', 
                title: t('connections'), 
                desc: t('connectFamilies'),
                route: '/connections'
              }
            ].map((action, index) => (
              <div
                key={action.route}
                onClick={() => navigate(action.route)}
                style={{
                  background: 'rgba(255, 255, 255, 0.9)',
                  borderRadius: '25px',
                  padding: '35px',
                  cursor: 'pointer',
                  transition: 'all 0.4s ease',
                  border: '1px solid rgba(255, 255, 255, 0.5)',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-12px) scale(1.03)';
                  e.currentTarget.style.boxShadow = '0 30px 60px rgba(102, 126, 234, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0) scale(1)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{ fontSize: '4rem', marginBottom: '25px', animation: 'pulse 3s infinite' }}>{action.icon}</div>
                <h3 style={{
                  fontSize: '1.6rem',
                  fontWeight: '800',
                  color: '#2c3e50',
                  margin: '0 0 15px 0'
                }}>{action.title}</h3>
                <p style={{
                  fontSize: '1.1rem',
                  color: '#64748b',
                  margin: 0,
                  lineHeight: '1.6',
                  fontWeight: '500'
                }}>{action.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Modal for expanded banner */}
        {selectedBanner && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000
          }} onClick={() => setSelectedBanner(null)}>
            <div style={{
              position: 'relative',
              maxWidth: '95vw',
              maxHeight: '95vh',
              borderRadius: '20px',
              overflow: 'hidden',
              boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5)'
            }} onClick={(e) => e.stopPropagation()}>
              <img 
                src={selectedBanner.img}
                alt={selectedBanner.title}
                style={{
                  width: '100%',
                  height: 'auto',
                  maxHeight: '95vh',
                  minWidth: '600px',
                  objectFit: 'contain'
                }}
              />
              <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
                padding: '40px 30px 30px',
                color: 'white'
              }}>
                <div style={{ fontSize: '2rem', marginBottom: '10px' }}>{selectedBanner.icon}</div>
                <h2 style={{ fontSize: '2rem', fontWeight: '700', margin: '0 0 10px 0' }}>{selectedBanner.title}</h2>
                <p style={{ fontSize: '1.2rem', margin: '0', opacity: '0.9' }}>{selectedBanner.date}</p>
              </div>
              <button 
                onClick={() => setSelectedBanner(null)}
                style={{
                  position: 'absolute',
                  top: '15px',
                  right: '15px',
                  background: 'rgba(0, 0, 0, 0.7)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '40px',
                  height: '40px',
                  color: 'white',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >×</button>
            </div>
          </div>
        )}
      </Layout>
    </div>
  );
};

export default Home;