import React, { useState, useEffect } from 'react';
import axios from '../axiosConfig';
import Layout from '../components/Layout';
import LanguageToggle from '../components/LanguageToggle';
import { useTranslation } from '../hooks/useTranslation';
import './Profile.css';
import './ProfileEnhanced.css';
import '../styles/ModernStyles.css';
import '../styles/ProfileResponsive.css';

// Helper function to get spouse display text based on main person's gender
const getSpouseText = (t, mainPersonGender) => {
  if (mainPersonGender === 'male') return t ? (t('wife') || 'Wife') : 'Wife';
  if (mainPersonGender === 'female') return t ? (t('husband') || 'Husband') : 'Husband';
  return t ? (t('spouse') || 'Spouse') : 'Spouse';
};

const Profile = () => {
  const { t, language } = useTranslation();
  const [personal, setPersonal] = useState(null);
  const [family, setFamily] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userAvatar, setUserAvatar] = useState('');

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
        // Use same API endpoint for both user types to show same data
        const response = await axios.get('profile/edit/', {
          headers: { Authorization: `Token ${token}` }
        });
        if (response.data) {
          if (response.data.avatar) {
            const avatarUrl = response.data.avatar.startsWith('http') 
              ? response.data.avatar 
              : `http://localhost:8000${response.data.avatar}`;
            setUserAvatar(avatarUrl);
          }
          setPersonal({
            user_number: response.data.user_number,
            surname: response.data.surname || '',
            name: response.data.name || '',
            fatherName: response.data.fatherName || '',
            motherName: response.data.motherName || '',
            gender: response.data.gender || '',
            dateOfBirth: response.data.dateOfBirth || '',
            age: response.data.age || '',
            maritalStatus: response.data.maritalStatus || '',
            email: response.data.email || '',
            mobileNumber: response.data.mobileNumber || '',
            emergencyContact: response.data.emergencyContact || '',
            address: response.data.address || '',
            area: response.data.area || '',
            city: response.data.city || '',
            hometown: response.data.hometown || '',
            state: response.data.state || '',
            country: response.data.country || '',
            pincode: response.data.pincode || '',
            occupation: response.data.occupation || '',
            companyName: response.data.companyName || '',
            workAddress: response.data.workAddress || '',
            incomeRange: response.data.incomeRange || '',
            education: response.data.education || '',
            instituteName: response.data.instituteName || '',
            specialization: response.data.specialization || '',
            caste: response.data.caste || '',
            subcaste: response.data.subcaste || '',
            religion: response.data.religion || '',
            height: response.data.height || '',
            weight: response.data.weight || '',
            bloodGroup: response.data.bloodGroup || '',
            medicalConditions: response.data.medicalConditions || '',
            hobbies: response.data.hobbies || '',
            languagesKnown: response.data.languagesKnown || '',
            skills: response.data.skills || '',
            facebookProfile: response.data.facebookProfile || '',
            instagramProfile: response.data.instagramProfile || '',
            linkedinProfile: response.data.linkedinProfile || '',
            aboutMe: response.data.aboutMe || '',

            achievements: response.data.achievements || '',
          });
          setFamily(
            Array.isArray(response.data.family_members) && response.data.family_members.length > 0
              ? response.data.family_members.map(member => ({
                  member_number: member.member_number,
                  surname: member.surname || '',
                  name: member.name || '',
                  fatherName: member.fatherName || '',
                  motherName: member.motherName || '',
                  gender: member.gender || '',
                  dateOfBirth: member.dateOfBirth || '',
                  age: member.memberAge || '',
                  maritalStatus: member.maritalStatus || '',
                  relation: member.relation || '',
                  email: member.email || '',
                  mobileNumber: member.mobileNumber || '',
                  emergencyContact: member.emergencyContact || '',
                  address: member.address || '',
                  area: member.area || '',
                  city: member.city || '',
                  hometown: member.hometown || '',
                  state: member.state || '',
                  country: member.country || '',
                  pincode: member.pincode || '',
                  occupation: member.occupation || '',
                  companyName: member.companyName || '',
                  workAddress: member.workAddress || '',
                  education: member.education || '',
                  instituteName: member.instituteName || '',
                  specialization: member.specialization || '',
                  caste: member.caste || '',
                  subcaste: member.subcaste || '',
                  religion: member.religion || '',
                  height: member.height || '',
                  weight: member.weight || '',
                  bloodGroup: member.bloodGroup || '',
                  medicalConditions: member.medicalConditions || '',
                  hobbies: member.hobbies || '',
                  languagesKnown: member.languagesKnown || '',
                  skills: member.skills || '',
                  aboutMember: member.aboutMember || '',
                  achievements: member.achievements || '',
                }))
              : []
          );
        }

      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  if (loading) return (
    <Layout title={t('myProfile')}>
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
  
  if (!personal) return (
    <Layout title={t('myProfile')}>
      <div style={{
        textAlign: 'center',
        padding: '60px 20px',
        background: 'rgba(255, 255, 255, 0.9)',
        borderRadius: '20px',
        color: '#e74c3c'
      }}>{t('noProfileData')}</div>
    </Layout>
  );

  return (
    <div className="profile-responsive">
      <Layout title={t('myProfile')}>
        <LanguageToggle />
        <div className="profile-page">
        {/* User Number Section */}
        <div className="user-number-section">
          <div className="main-user-number">
            <span className="number-label">{t('userID')}</span>
            <span className="number-value">#{personal.user_number || 'N/A'}</span>
          </div>
          {family.length > 0 && (
            <div className="family-numbers-preview">
              <span className="family-label">{t('familyMembers')}:</span>
              <div className="family-number-list">
                {family.slice(0, 3).map((member, i) => (
                  <span key={i} className="family-number-item">
                    #{member.member_number || 'N/A'}
                  </span>
                ))}
                {family.length > 3 && <span className="more-members">+{family.length - 3}</span>}
              </div>
            </div>
          )}
        </div>

        {/* Profile Header */}
        <div className="profile-header">
          <div className="avatar">
            {userAvatar ? (
              <img src={userAvatar} alt="Avatar" />
            ) : (
              <div className="avatar-placeholder">
                {personal.surname ? personal.surname[0].toUpperCase() : "U"}
              </div>
            )}
          </div>
          <div className="profile-info">
            <h1>{personal.name} {personal.surname}</h1>
            <p>{personal.occupation} • {personal.city}</p>
            {/* Only show edit button for main users */}
            {(() => {
              const userInfo = localStorage.getItem('userInfo');
              let userType = 'main_user';
              if (userInfo) {
                const parsedUserInfo = JSON.parse(userInfo);
                userType = parsedUserInfo.user_type || 'main_user';
              }
              return userType === 'main_user' ? (
                <button 
                  onClick={() => window.location.href = '/edit-profile'}
                  style={{
                    marginTop: '15px',
                    padding: '12px 24px',
                    background: 'linear-gradient(135deg, #667eea, #764ba2)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '25px',
                    fontSize: '0.9rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 4px 15px rgba(102,126,234,0.3)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}
                  onMouseOver={(e) => {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 6px 20px rgba(102,126,234,0.4)';
                  }}
                  onMouseOut={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 4px 15px rgba(102,126,234,0.3)';
                  }}
                >
                  ✏️ {t('editProfile')}
                </button>
              ) : (
                <div style={{
                  marginTop: '15px',
                  padding: '12px 24px',
                  background: 'linear-gradient(135deg, #51cf66, #40c057)',
                  color: 'white',
                  borderRadius: '25px',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  textAlign: 'center',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  👁️ {t('viewOnlyAccess')}
                </div>
              );
            })()}
          </div>
        </div>

        {/* Compact Profile Information */}
        <div className="section">
          <div className="compact-grid">
            {/* Personal Details */}
            <div className="compact-card personal-card">
              <div className="card-header">
                <div className="icon-wrapper">
                  <span className="card-icon">👤</span>
                </div>
                <h3>{t('personalDetails')}</h3>
              </div>
              <div className="personal-grid">
                <div className="name-section">
                  <div className="full-name">
                    <span className="first-name">{personal.name}</span>
                    <span className="last-name">{personal.surname}</span>
                  </div>
                  <div className="name-details">
                    {personal.fatherName && (
                      <div className="parent-info">
                        <span className="parent-label">{t('father')}:</span>
                        <span className="parent-name">{personal.fatherName}</span>
                      </div>
                    )}
                    {personal.motherName && (
                      <div className="parent-info">
                        <span className="parent-label">{t('mother')}:</span>
                        <span className="parent-name">{personal.motherName}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="basic-info">
                  {[
                    { label: t('gender'), value: personal.gender === 'male' ? (t('male') || 'Male') : personal.gender === 'female' ? (t('female') || 'Female') : personal.gender === 'other' ? (t('other') || 'Other') : personal.gender, icon: personal.gender === 'male' ? '♂️' : personal.gender === 'female' ? '♀️' : '⚧️' },
                    { label: t('age'), value: personal.age, icon: '🎂' },
                    { label: t('born'), value: new Date(personal.dateOfBirth).toLocaleDateString('en-IN'), icon: '📅' },
                    { label: t('status'), value: personal.maritalStatus === 'married' ? (t('married') || 'Married') : personal.maritalStatus === 'single' ? (t('single') || 'Single') : personal.maritalStatus === 'widowed' ? (t('widowed') || 'Widowed') : personal.maritalStatus === 'divorced' ? (t('divorced') || 'Divorced') : personal.maritalStatus, icon: personal.maritalStatus === 'married' ? '💑' : '👤' }
                  ].filter(item => item.value).map((item, index) => (
                    <div key={index} className="info-badge">
                      <span className="badge-icon">{item.icon}</span>
                      <div className="badge-content">
                        <span className="badge-label">{item.label}</span>
                        <span className="badge-value">{item.value}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Contact Details */}
            <div className="compact-card">
              <h3>📞 {t('contact')}</h3>
              <div className="compact-items">
                {[
                  { label: t('email'), value: personal.email },
                  { label: t('mobile'), value: personal.mobileNumber },
                  { label: t('emergency'), value: personal.emergencyContact },
                  { label: t('address'), value: personal.address },
                  { label: t('area') || 'Area (વિસ્તાર)', value: personal.area },
                  { label: t('city'), value: personal.city },
                  { label: t('state'), value: personal.state },
                  { label: t('country'), value: personal.country },
                  { label: t('pincode'), value: personal.pincode },
                  { label: t('hometown'), value: personal.hometown }
                ].filter(item => item.value).map((item, index) => (
                  <div key={index} className="compact-item">
                    <span className="label">{item.label}:</span>
                    <span className="value">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Professional & Education */}
            <div className="compact-card">
              <h3>💼 {t('professionalEducation')}</h3>
              <div className="prof-edu-grid">
                <div className="prof-section">
                  <h4 className="section-title">💼 {t('professional')}</h4>
                  {[
                    { label: t('occupation'), value: personal.occupation },
                    { label: t('company'), value: personal.companyName },
                    { label: t('workAddress'), value: personal.workAddress },
                    { label: t('income'), value: personal.incomeRange }
                  ].filter(item => item.value).map((item, index) => (
                    <div key={index} className="compact-item">
                      <span className="label">{item.label}:</span>
                      <span className="value">{item.value}</span>
                    </div>
                  ))}
                </div>
                <div className="edu-section">
                  <h4 className="section-title">🎓 {t('education')}</h4>
                  {[
                    { label: t('education') + ' (અભ્યાસ)', value: personal.education },
                    { label: t('institute'), value: personal.instituteName },
                    { label: t('specialization'), value: personal.specialization }
                  ].filter(item => item.value).map((item, index) => (
                    <div key={index} className="compact-item">
                      <span className="label">{item.label}:</span>
                      <span className="value">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Cultural & Health */}
            <div className="compact-card health-card">
              <div className="card-header">
                <div className="icon-wrapper">
                  <span className="card-icon">🕉️</span>
                </div>
                <h3>{t('culturalHealth')}</h3>
              </div>
              <div className="health-grid">
                <div className="cultural-section">
                  <h4 className="section-title">🏛️ {t('cultural')}</h4>
                  {[
                    { label: t('religion'), value: personal.religion },
                    { label: t('caste'), value: personal.caste },
                    { label: t('subcaste'), value: personal.subcaste },
                    { label: t('sakh'), value: personal.sakh }
                  ].filter(item => item.value).map((item, index) => (
                    <div key={index} className="cultural-item">
                      <span className="label">{item.label}:</span>
                      <span className="value">{item.value}</span>
                    </div>
                  ))}
                </div>
                <div className="health-section">
                  <h4 className="section-title">🏥 {t('health')}</h4>
                  <div className="health-stats">
                    {personal.height && (
                      <div className="stat-item">
                        <span className="stat-icon">📏</span>
                        <div className="stat-info">
                          <span className="stat-label">{t('height')}</span>
                          <span className="stat-value">{personal.height}</span>
                        </div>
                      </div>
                    )}
                    {personal.weight && (
                      <div className="stat-item">
                        <span className="stat-icon">⚖️</span>
                        <div className="stat-info">
                          <span className="stat-label">{t('weight')}</span>
                          <span className="stat-value">{personal.weight}</span>
                        </div>
                      </div>
                    )}
                    {personal.bloodGroup && (
                      <div className="stat-item">
                        <span className="stat-icon">🩸</span>
                        <div className="stat-info">
                          <span className="stat-label">{t('blood')}</span>
                          <span className="stat-value">{personal.bloodGroup}</span>
                        </div>
                      </div>
                    )}
                  </div>
                  {personal.medicalConditions && (
                    <div className="medical-note">
                      <span className="medical-label">{t('medicalNotes')}:</span>
                      <span className="medical-text">{personal.medicalConditions}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Interests & Social */}
            <div className="compact-card">
              <h3>🎨 {t('interestsSocial')}</h3>
              <div className="compact-items">
                {[
                  { label: t('hobbies'), value: personal.hobbies },
                  { label: t('languages'), value: personal.languagesKnown },
                  { label: t('skills'), value: personal.skills },
                  { label: t('facebook'), value: personal.facebookProfile, isLink: true },
                  { label: t('instagram'), value: personal.instagramProfile, isLink: true },
                  { label: t('linkedin'), value: personal.linkedinProfile, isLink: true }
                ].filter(item => item.value).map((item, index) => (
                  <div key={index} className="compact-item">
                    <span className="label">{item.label}:</span>
                    <span className="value">
                      {item.isLink ? (
                        <a href={item.value} target="_blank" rel="noopener noreferrer">
                          {t('view')}
                        </a>
                      ) : (
                        item.value
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* About Section */}
          {(personal.aboutMe || personal.achievements) && (
            <div className="about-section">
              {personal.aboutMe && (
                <div className="about-item">
                  <h4>📝 {t('aboutMe')}</h4>
                  <p>{personal.aboutMe}</p>
                </div>
              )}
              {personal.achievements && (
                <div className="about-item">
                  <h4>🏆 {t('achievements')}</h4>
                  <p>{personal.achievements}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Family Members */}
        <div className="section">
          <h2><span style={{fontSize: '1.5rem', marginRight: '10px'}}>👨‍👩‍👧‍👦</span>{t('familyMembers')} ({family.length})</h2>
          {family.length === 0 ? (
            <div className="no-data">
              <p>{t('noFamilyMembers')}</p>
              <small style={{opacity: 0.7, marginTop: '10px', display: 'block'}}>{t('addFamilyMembers')}</small>
            </div>
          ) : (
            <div className="family-compact-grid">
              {family.map((member, idx) => (
                <div key={idx} className="family-compact-card">
                  <div className="family-compact-header">
                    <div className="family-avatar">
                    </div>
                    <div>
                      <h4>{member.name} {member.surname}</h4>
                      <span className="relation">{member.relation === 'spouse' ? getSpouseText(t, personal.gender) : member.relation === 'son' ? (t('son') || 'Son') : member.relation === 'daughter' ? (t('daughter') || 'Daughter') : member.relation === 'father' ? (t('father') || 'Father') : member.relation === 'mother' ? (t('mother') || 'Mother') : member.relation === 'brother' ? (t('brother') || 'Brother') : member.relation === 'sister' ? (t('sister') || 'Sister') : member.relation === 'grandfather' ? (t('grand-father') || 'Grand-father') : member.relation === 'grandmother' ? (t('grand-mother') || 'Grand-mother') : member.relation === 'grandson' ? (t('grand-son') || 'Grand-son') : member.relation === 'granddaughter' ? (t('grand-daughter') || 'Grand-daughter') : member.relation === 'uncle' ? (t('uncle') || 'Uncle') : member.relation === 'aunt' ? (t('aunt') || 'Aunt') : member.relation === 'cousin' ? (t('cousin') || 'Cousin') : member.relation === 'nephew' ? (t('nephew') || 'Nephew') : member.relation === 'niece' ? (t('niece') || 'Niece') : member.relation === 'son_in_law' ? (t('sonInLaw') || 'Son-in-law') : member.relation === 'daughter_in_law' ? (t('daughterInLaw') || 'Daughter-in-law') : member.relation === 'father_in_law' ? (t('fatherInLaw') || 'Father-in-law') : member.relation === 'mother_in_law' ? (t('motherInLaw') || 'Mother-in-law') : member.relation}</span>
                      <span className="member-id">ID: #{member.member_number || 'N/A'}</span>
                    </div>
                  </div>
                  <div className="family-full-details">
                    {[
                      { label: t('age'), value: member.age },
                      { label: t('gender'), value: member.gender },
                      { label: t('father'), value: member.fatherName },
                      { label: t('mother'), value: member.motherName },
                      { label: t('dob'), value: new Date(member.dateOfBirth).toLocaleDateString('en-IN') },
                      { label: t('status'), value: member.maritalStatus === 'married' ? (t('married') || 'Married') : member.maritalStatus === 'single' ? (t('single') || 'Single') : member.maritalStatus === 'widowed' ? (t('widowed') || 'Widowed') : member.maritalStatus === 'divorced' ? (t('divorced') || 'Divorced') : member.maritalStatus },
                      { label: t('mobile'), value: member.mobileNumber },
                      { label: t('email'), value: member.email },
                      { label: t('emergency'), value: member.emergencyContact },
                      { label: t('occupation'), value: member.occupation },
                      { label: t('company'), value: member.companyName },
                      { label: t('workAddress'), value: member.workAddress },
                      { label: t('education') + ' (અભ્યાસ)', value: member.education },
                      { label: t('institute'), value: member.instituteName },
                      { label: t('specialization'), value: member.specialization },
                      { label: t('city'), value: member.city },
                      { label: t('state'), value: member.state },
                      { label: t('country'), value: member.country },
                      { label: t('pincode'), value: member.pincode },
                      { label: t('hometown'), value: member.hometown },
                      { label: t('area') || 'Area (વિસ્તાર)', value: member.area },
                      { label: t('address'), value: member.address },
                      { label: t('religion'), value: member.religion },
                      { label: t('caste'), value: member.caste },
                      { label: t('subcaste'), value: member.subcaste },
                      { label: t('blood'), value: member.bloodGroup },
                      { label: t('height'), value: member.height },
                      { label: t('weight'), value: member.weight },
                      { label: t('medical'), value: member.medicalConditions },
                      { label: t('hobbies'), value: member.hobbies },
                      { label: t('languages'), value: member.languagesKnown },
                      { label: t('skills'), value: member.skills },
                      { label: t('about'), value: member.aboutMember },
                      { label: t('achievements'), value: member.achievements }
                    ].filter(item => item.value).map((item, index) => (
                      <div key={index} className="family-detail-item">
                        <span className="label">{item.label}:</span>
                        <span className="value">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        </div>
      </Layout>
    </div>
  );
};

export default Profile;