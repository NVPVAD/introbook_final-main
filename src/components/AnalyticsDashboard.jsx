import React, { useState, useEffect } from 'react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import axios from '../axiosConfig';
import UserNumberDisplay from './UserNumberDisplay';
import { useTranslation } from '../hooks/useTranslation';
import './AnalyticsDashboard.css';

const AnalyticsDashboard = () => {
  const { t } = useTranslation();
  const [userActivity, setUserActivity] = useState([]);
  const [familyStats, setFamilyStats] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [familyMembers, setFamilyMembers] = useState([]);
  const [realTimeData, setRealTimeData] = useState({
    activeUsers: 0,
    newRegistrations: 0,
    totalConnections: 0,
    totalFamilies: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        const token = localStorage.getItem('token');
        
        const [familiesResponse, profileResponse] = await Promise.all([
          axios.get('all-families/', { headers: { Authorization: `Token ${token}` } }),
          axios.get('profile/edit/', { headers: { Authorization: `Token ${token}` } })
        ]);
        
        const families = familiesResponse.data || [];
        const profile = profileResponse.data;
        
        setUserProfile(profile);
        setFamilyMembers(profile.family_members || []);

        const surnameCount = {};
        families.forEach(family => {
          const surname = family.surname || 'Unknown';
          surnameCount[surname] = (surnameCount[surname] || 0) + 1;
        });
        
        let familyStatsData = Object.entries(surnameCount)
          .sort(([,a], [,b]) => b - a)
          .map(([name, value], index) => ({
            name,
            value,
            color: ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1', '#ff9999', '#66b3ff', '#99ff99', '#ffcc99', '#ff99cc'][index % 10]
          }));
        
        if (familyStatsData.length === 0) {
          familyStatsData = [{ name: 'No Data', value: 1, color: '#cccccc' }];
        }
        
        setFamilyStats(familyStatsData);
        
        const totalFamilies = families.length;
        const totalMembers = families.reduce((acc, family) => 
          acc + 1 + (family.family_members ? family.family_members.length : 0), 0
        );
        
        setUserActivity([{
          name: 'Database Stats',
          families: totalFamilies,
          members: totalMembers,
          connections: 0
        }]);

        setRealTimeData({
          activeUsers: totalMembers,
          newRegistrations: totalFamilies,
          totalConnections: 0,
          totalFamilies: totalFamilies
        });

        console.log('User profile:', profile);
        console.log('Family members:', profile.family_members || []);
        
      } catch (error) {
        console.error('Error fetching analytics data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAnalyticsData();
  }, []);

  if (loading) {
    return (
      <div className="analytics-dashboard">
        <div className="dashboard-header">
          <h2>📊 {t('loadingAnalytics') || 'Loading Analytics'}...</h2>
        </div>
      </div>
    );
  }
  
  return (
    <div className="analytics-dashboard">
      <div className="dashboard-header">
        <h2>📊 {t('analyticsDashboard') || 'Analytics Dashboard'}</h2>
        <div className="live-indicator">
          <span className="live-dot"></span>
          {t('liveData') || 'Live Data'}
        </div>
      </div>

      <UserNumberDisplay />
      
      <div className="stats-grid">
        <div className="stat-card active-users">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <h3>{realTimeData.activeUsers}</h3>
            <p>{t('activeUsers') || 'Active Users'}</p>
          </div>
        </div>
        <div className="stat-card new-registrations">
          <div className="stat-icon">✨</div>
          <div className="stat-content">
            <h3>{realTimeData.newRegistrations}</h3>
            <p>{t('newToday') || 'New Today'}</p>
          </div>
        </div>
        <div className="stat-card total-connections">
          <div className="stat-icon">🤝</div>
          <div className="stat-content">
            <h3>{realTimeData.totalConnections}</h3>
            <p>{t('connections')}</p>
          </div>
        </div>
        <div className="stat-card total-families">
          <div className="stat-icon">🏠</div>
          <div className="stat-content">
            <h3>{realTimeData.totalFamilies}</h3>
            <p>{t('families') || 'Families'}</p>
          </div>
        </div>
      </div>

      <div className="charts-grid">
        <div className="chart-container">
          <h3>📊 {t('databaseOverview') || 'Database Overview'}</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={userActivity}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="families" fill="#8884d8" name="Total Families" />
              <Bar dataKey="members" fill="#82ca9d" name="Total Members" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-container">
          <h3>🏘️ {t('familyDistribution') || 'Family Surname Distribution'}</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={familyStats}
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {familyStats.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-container full-width">
          <h3>🌳 {t('myFamilyTree') || 'My Family Tree'}</h3>
          <div style={{ padding: '30px', background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)', borderRadius: '15px', minHeight: '500px' }}>
            <div style={{ textAlign: 'center', marginBottom: '40px', position: 'relative' }}>
              <div style={{
                display: 'inline-block',
                padding: '20px 30px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                borderRadius: '50px',
                fontSize: '1.2rem',
                fontWeight: 'bold',
                boxShadow: '0 8px 25px rgba(102, 126, 234, 0.4)',
                border: '4px solid white'
              }}>
                👤 {userProfile?.name || 'You'} (Main User)
              </div>
              
              {familyMembers.length > 0 && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: '50%',
                  width: '2px',
                  height: '30px',
                  background: '#8B4513',
                  transform: 'translateX(-50%)'
                }}></div>
              )}
            </div>
            
            {familyMembers.length > 0 ? (
              <div>
                <div style={{
                  height: '2px',
                  background: '#8B4513',
                  margin: '0 auto 30px',
                  width: `${Math.min(familyMembers.length * 120, 800)}px`
                }}></div>
                
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '30px' }}>
                  {familyMembers.map((member, i) => (
                    <div key={i} style={{ textAlign: 'center', position: 'relative' }}>
                      <div style={{
                        position: 'absolute',
                        top: '-32px',
                        left: '50%',
                        width: '2px',
                        height: '30px',
                        background: '#8B4513',
                        transform: 'translateX(-50%)'
                      }}></div>
                      
                      <div style={{
                        width: '90px',
                        height: '90px',
                        borderRadius: '50%',
                        background: `linear-gradient(135deg, ${['#ff9a9e', '#fecfef', '#a8edea', '#fed6e3', '#d299c2', '#ffecd2', '#fcb69f', '#ffd89b'][i % 8]} 0%, ${['#fecfef', '#a8edea', '#fed6e3', '#d299c2', '#ffecd2', '#fcb69f', '#ffd89b', '#ff9a9e'][i % 8]} 100%)`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '2rem',
                        margin: '0 auto 15px',
                        boxShadow: '0 6px 20px rgba(0,0,0,0.15)',
                        border: '3px solid white'
                      }}>
                        {member.gender === 'male' ? '👨' : member.gender === 'female' ? '👩' : '👤'}
                      </div>
                      
                      <div style={{
                        background: 'white',
                        padding: '10px 15px',
                        borderRadius: '15px',
                        boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
                        minWidth: '120px'
                      }}>
                        <div style={{ fontSize: '1rem', fontWeight: 'bold', color: '#333', marginBottom: '5px' }}>
                          {member.name || member.firstName || 'Family Member'}
                        </div>
                        <div style={{ fontSize: '0.85rem', color: '#666', fontWeight: '600' }}>
                          {member.relation || 'Family Member'}
                        </div>
                        {member.age && (
                          <div style={{ fontSize: '0.8rem', color: '#999', marginTop: '3px' }}>
                            Age: {member.age || member.memberAge}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', color: '#666', fontSize: '1.2rem' }}>
                <div style={{ fontSize: '4rem', marginBottom: '20px' }}>🌱</div>
                <p>Add family members to see your family tree grow!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;