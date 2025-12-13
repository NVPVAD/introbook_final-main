import React, { useState, useEffect } from 'react';
import axios from '../axiosConfig';
import Layout from '../components/Layout';
import './FamilyView.css';

const FamilyView = () => {
  const [familyData, setFamilyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userType, setUserType] = useState(''); // 'main_user' or 'family_member'
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    fetchFamilyData();
  }, []);

  const fetchFamilyData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Check if this is a family member or main user
      const userInfo = localStorage.getItem('userInfo');
      let parsedUserInfo = {};
      if (userInfo) {
        parsedUserInfo = JSON.parse(userInfo);
        setUserType(parsedUserInfo.user_type || 'main_user');
        setCurrentUser(parsedUserInfo);
      }
      
      // Use different endpoints based on user type
      let response;
      if (parsedUserInfo.user_type === 'family_member') {
        // Family members should use the family-member/family endpoint
        response = await axios.get('family-member/family/', {
          headers: { Authorization: `Token ${token}` }
        });
        // The response structure is different for family members
        if (response.data.success) {
          console.log('Family member data received:', response.data.family_data);
          console.log('Family members array:', response.data.family_data.family_members);
          setFamilyData(response.data.family_data);
        } else {
          throw new Error('Failed to load family data');
        }
      } else {
        // Main users use the profile/edit endpoint
        response = await axios.get('profile/edit/', {
          headers: { Authorization: `Token ${token}` }
        });
        console.log('Main user data received:', response.data);
        console.log('Family members array:', response.data.family_members);
        setFamilyData(response.data);
      }
    } catch (error) {
      setError('Failed to load family data');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout title="Family Information">
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '400px',
          fontSize: '1.2rem',
          color: '#666'
        }}>Loading family information...</div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout title="Family Information">
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          background: 'rgba(255, 255, 255, 0.9)',
          borderRadius: '20px',
          color: '#e74c3c'
        }}>{error}</div>
      </Layout>
    );
  }

  return (
    <Layout title={userType === 'family_member' ? '👤 Family Information (View Only)' : '👨‍👩‍👧‍👦 Family Information'}>
      {userType === 'family_member' && (
        <div style={{
          background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
          border: '2px solid #2196f3',
          borderRadius: '15px',
          padding: '15px 20px',
          marginBottom: '25px',
          textAlign: 'center',
          color: '#1565c0',
          fontWeight: '600'
        }}>
          👤 Family Member View - Read Only Access
        </div>
      )}

      {familyData && (
        <div className="family-content">
          {/* Main User Information */}
          <div className="main-user-section">
            <h2>Main User Information</h2>
            <div className="user-card main-user-card">
              <div className="user-avatar">
                {/* Handle different data structures */}
                {userType === 'family_member' ? (
                  // For family members, use familyData.main_user
                  familyData.main_user?.avatar ? (
                    <img 
                      src={familyData.main_user.avatar.startsWith('http') 
                        ? familyData.main_user.avatar 
                        : `http://localhost:8000${familyData.main_user.avatar}`} 
                      alt="Profile" 
                    />
                  ) : (
                    <div className="avatar-placeholder">
                      {familyData.main_user?.surname?.charAt(0) || 'U'}
                    </div>
                  )
                ) : (
                  // For main users, use familyData directly
                  familyData.avatar ? (
                    <img 
                      src={familyData.avatar.startsWith('http') 
                        ? familyData.avatar 
                        : `http://localhost:8000${familyData.avatar}`} 
                      alt="Profile" 
                    />
                  ) : (
                    <div className="avatar-placeholder">
                      {familyData.surname?.charAt(0) || 'U'}
                    </div>
                  )
                )}
              </div>
              <div className="user-details">
                {/* Handle different data structures */}
                {userType === 'family_member' ? (
                  // For family members, use familyData.main_user
                  <>
                    <h3>{familyData.main_user?.surname} {familyData.main_user?.name}</h3>
                    <div className="detail-grid">
                      <div className="detail-item">
                        <label>Father's Name:</label>
                        <span>{familyData.main_user?.fatherName || 'Not specified'}</span>
                      </div>
                      <div className="detail-item">
                        <label>Mobile:</label>
                        <span>{familyData.main_user?.mobileNumber || 'Not specified'}</span>
                      </div>
                      <div className="detail-item">
                        <label>Email:</label>
                        <span>{familyData.main_user?.email || 'Not specified'}</span>
                      </div>
                      <div className="detail-item">
                        <label>Age:</label>
                        <span>{familyData.main_user?.age || 'Not specified'}</span>
                      </div>
                      <div className="detail-item">
                        <label>Occupation:</label>
                        <span>{familyData.main_user?.occupation || 'Not specified'}</span>
                      </div>
                      <div className="detail-item">
                        <label>City:</label>
                        <span>{familyData.main_user?.city || 'Not specified'}</span>
                      </div>
                      <div className="detail-item">
                        <label>Hometown:</label>
                        <span>{familyData.main_user?.hometown || 'Not specified'}</span>
                      </div>
                      <div className="detail-item">
                        <label>Address:</label>
                        <span>{familyData.main_user?.address || 'Not specified'}</span>
                      </div>
                      <div className="detail-item">
                        <label>Caste:</label>
                        <span>{familyData.main_user?.caste || 'Not specified'}</span>
                      </div>
                      <div className="detail-item">
                        <label>Subcaste:</label>
                        <span>{familyData.main_user?.subcaste || 'Not specified'}</span>
                      </div>
                    </div>
                  </>
                ) : (
                  // For main users, use familyData directly
                  <>
                    <h3>{familyData.surname} {familyData.name}</h3>
                    <div className="detail-grid">
                      <div className="detail-item">
                        <label>Father's Name:</label>
                        <span>{familyData.fatherName || 'Not specified'}</span>
                      </div>
                      <div className="detail-item">
                        <label>Mobile:</label>
                        <span>{familyData.mobileNumber || 'Not specified'}</span>
                      </div>
                      <div className="detail-item">
                        <label>Email:</label>
                        <span>{familyData.email || 'Not specified'}</span>
                      </div>
                      <div className="detail-item">
                        <label>Age:</label>
                        <span>{familyData.age || 'Not specified'}</span>
                      </div>
                      <div className="detail-item">
                        <label>Occupation:</label>
                        <span>{familyData.occupation || 'Not specified'}</span>
                      </div>
                      <div className="detail-item">
                        <label>City:</label>
                        <span>{familyData.city || 'Not specified'}</span>
                      </div>
                      <div className="detail-item">
                        <label>Hometown:</label>
                        <span>{familyData.hometown || 'Not specified'}</span>
                      </div>
                      <div className="detail-item">
                        <label>Address:</label>
                        <span>{familyData.address || 'Not specified'}</span>
                      </div>
                      <div className="detail-item">
                        <label>Caste:</label>
                        <span>{familyData.caste || 'Not specified'}</span>
                      </div>
                      <div className="detail-item">
                        <label>Subcaste:</label>
                        <span>{familyData.subcaste || 'Not specified'}</span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Family Members Section */}
          <div className="family-members-section">
            {/* Handle different data structures */}
            {userType === 'family_member' ? (
              <h2>Family Members ({familyData.family_members?.length || 0})</h2>
            ) : (
              <h2>Family Members ({familyData.family_members?.length || 0})</h2>
            )}
            
            {(!familyData.family_members || familyData.family_members.length === 0) ? (
              <div className="no-members">
                <p>No family members added yet.</p>
                <p style={{fontSize: '0.9rem', color: '#666', marginTop: '10px'}}>
                  Debug: family_members = {JSON.stringify(familyData.family_members)}
                </p>
              </div>
            ) : (
              <div className="members-grid">
                {familyData.family_members.map((member, index) => (
                  <div key={index} className="member-card">
                    <div className="member-header">
                      <h3>{member.surname} {member.name}</h3>
                      <span className="relation-badge">{member.relation || 'Family Member'}</span>
                    </div>
                    
                    <div className="member-details">
                      <div className="detail-row">
                        <label>Father's Name:</label>
                        <span>{member.fatherName || 'Not specified'}</span>
                      </div>
                      <div className="detail-row">
                        <label>Mobile:</label>
                        <span>{member.mobileNumber || 'Not specified'}</span>
                      </div>
                      <div className="detail-row">
                        <label>Email:</label>
                        <span>{member.email || 'Not specified'}</span>
                      </div>
                      <div className="detail-row">
                        <label>Age:</label>
                        <span>{member.memberAge || 'Not specified'}</span>
                      </div>
                      <div className="detail-row">
                        <label>Occupation:</label>
                        <span>{member.occupation || 'Not specified'}</span>
                      </div>
                      <div className="detail-row">
                        <label>City:</label>
                        <span>{member.city || 'Not specified'}</span>
                      </div>
                      <div className="detail-row">
                        <label>Hometown:</label>
                        <span>{member.hometown || 'Not specified'}</span>
                      </div>
                      <div className="detail-row">
                        <label>Address:</label>
                        <span>{member.address || 'Not specified'}</span>
                      </div>
                      <div className="detail-row">
                        <label>Caste:</label>
                        <span>{member.caste || 'Not specified'}</span>
                      </div>
                      <div className="detail-row">
                        <label>Subcaste:</label>
                        <span>{member.subcaste || 'Not specified'}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Access Information */}
          {userType === 'family_member' && (
            <div className="access-info">
              <div className="info-card">
                <h3>📋 View-Only Access</h3>
                <p>As a family member, you can view all family information but cannot make any changes.</p>
                <p>Only the main user can edit family details.</p>
              </div>
            </div>
          )}
        </div>
      )}
    </Layout>
  );
};

export default FamilyView; 