import React, { useState, useEffect } from 'react';
import axios from '../axiosConfig';
import './UserNumberDisplay.css';

const UserNumberDisplay = () => {
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserNumbers = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('user-numbers/', {
          headers: { Authorization: `Token ${token}` }
        });
        
        if (response.data.success) {
          setUserInfo(response.data);
        }
      } catch (error) {
        console.error('Error fetching user numbers:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserNumbers();
  }, []);

  if (loading) return <div className="number-loading">🔢</div>;
  if (!userInfo) return null;

  return (
    <div className="number-display-container">
      {userInfo.user_type === 'main_user' ? (
        <>
          <div className="main-number-card">
            <div className="number-badge main">
              <div className="number-circle">
                <span className="big-number">{userInfo.user_number}</span>
              </div>
              <div className="number-info">
                <h3>{userInfo.user_name}</h3>
                <span className="user-type">👑 Main User</span>
              </div>
            </div>
          </div>
          
          {userInfo.family_members?.length > 0 && (
            <div className="family-numbers">
              <h4>👨‍👩‍👧‍👦 Family Members</h4>
              <div className="members-grid">
                {userInfo.family_members.map((member, i) => (
                  <div key={i} className="member-card">
                    <div className="member-number">{member.member_number}</div>
                    <div className="member-details">
                      <span className="member-name">{member.name}</span>
                      <span className="member-relation">{member.relation}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          <div className="member-number-card">
            <div className="number-badge member">
              <div className="number-circle member-circle">
                <span className="big-number">{userInfo.member_number}</span>
              </div>
              <div className="number-info">
                <h3>{userInfo.member_name}</h3>
                <span className="user-type">👤 Family Member</span>
              </div>
            </div>
          </div>
          
          <div className="main-user-ref">
            <span>Main User: </span>
            <div className="ref-badge">
              <span className="ref-number">{userInfo.main_user_number}</span>
              <span className="ref-name">{userInfo.main_user_name}</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default UserNumberDisplay;