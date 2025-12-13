import React, { useState, useEffect } from 'react';
import axios from '../axiosConfig';
import { useNavigate, useParams } from 'react-router-dom';
import Layout from '../components/Layout';

const FamilyProfile = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [profile, setProfile] = useState(null);
  const [familyMembers, setFamilyMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchFamilyProfile();
  }, [id]);

  const fetchFamilyProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`community/profile/${id}/`, {
        headers: { Authorization: `Token ${token}` }
      });

      if (response.data.success) {
        setProfile(response.data.profile);
        setFamilyMembers(response.data.family_members);
      } else {
        setError(response.data.message);
      }
    } catch (error) {
      console.error('Error fetching family profile:', error);
      setError('Failed to load family profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = () => {
    navigate(`/messages?partner_id=${id}`);
  };

  if (loading) {
    return (
      <Layout title="Family Profile">
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '400px',
          fontSize: '1.2rem',
          color: '#666'
        }}>Loading family profile...</div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout title="Family Profile">
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          background: 'rgba(255, 255, 255, 0.9)',
          borderRadius: '20px',
          color: '#e74c3c'
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '20px' }}>❌</div>
          <div style={{ fontSize: '1.2rem', marginBottom: '20px' }}>{error}</div>
          <button
            onClick={() => navigate('/connections')}
            style={{
              background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '20px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Back to Connections
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title={`👨‍👩‍👧‍👦 ${profile?.surname} ${profile?.name} Family`}>
      {/* Action Buttons */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: '25px'
      }}>
        <button
          onClick={() => navigate('/connections')}
          style={{
            background: 'rgba(102, 126, 234, 0.1)',
            border: '1px solid rgba(102, 126, 234, 0.3)',
            borderRadius: '15px',
            padding: '12px 20px',
            cursor: 'pointer',
            fontSize: '0.9rem',
            fontWeight: '600',
            color: '#667eea',
            transition: 'all 0.3s ease'
          }}
        >
          ← Back to Connections
        </button>

        <button
          onClick={handleSendMessage}
          style={{
            background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            border: 'none',
            borderRadius: '15px',
            padding: '12px 20px',
            cursor: 'pointer',
            fontSize: '0.9rem',
            fontWeight: '600',
            color: 'white',
            transition: 'all 0.3s ease'
          }}
        >
          💬 Send Message
        </button>
      </div>

      {/* Main Profile Section */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.95) 100%)',
        backdropFilter: 'blur(20px)',
        borderRadius: '25px',
        padding: '35px',
        marginBottom: '25px',
        boxShadow: '0 15px 35px rgba(0, 0, 0, 0.08)',
        border: '1px solid rgba(255, 255, 255, 0.3)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '30px',
          marginBottom: '30px',
          flexWrap: 'wrap'
        }}>
          {/* Avatar */}
          <div style={{
            width: '120px',
            height: '120px',
            borderRadius: '50%',
            background: profile.avatar ? 'transparent' : 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '3rem',
            color: '#fff',
            fontWeight: 'bold',
            overflow: 'hidden',
            boxShadow: '0 15px 40px rgba(79, 172, 254, 0.3)'
          }}>
            {profile.avatar ? (
              <img
                src={profile.avatar.startsWith('http') ? profile.avatar : `http://localhost:8000${profile.avatar}`}
                alt={`${profile.surname} ${profile.name}`}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  borderRadius: '50%'
                }}
              />
            ) : (
              profile.surname ? profile.surname[0].toUpperCase() : 'F'
            )}
          </div>

          {/* Basic Info */}
          <div style={{ flex: 1 }}>
            <h2 style={{
              fontSize: '2.2rem',
              fontWeight: '700',
              color: '#2d3a4b',
              margin: '0 0 10px 0'
            }}>
              {profile.surname} {profile.name} Family
            </h2>
            <div style={{
              fontSize: '1.1rem',
              color: '#666',
              marginBottom: '8px'
            }}>
              <strong>Father's Name:</strong> {profile.fatherName}
            </div>
            {profile.city && (
              <div style={{
                fontSize: '1rem',
                color: '#666',
                marginBottom: '8px'
              }}>
                📍 <strong>City:</strong> {profile.city}
              </div>
            )}
            {profile.hometown && (
              <div style={{
                fontSize: '1rem',
                color: '#666',
                marginBottom: '8px'
              }}>
                🏠 <strong>Hometown:</strong> {profile.hometown}
              </div>
            )}
            <div style={{
              fontSize: '1rem',
              color: '#666',
              marginBottom: '8px'
            }}>
              👥 <strong>Family Members:</strong> {familyMembers.length + 1}
            </div>
          </div>
        </div>

        {/* Detailed Information */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '20px',
          marginBottom: '30px'
        }}>
          {/* Personal Information Card */}
          <div style={{
            background: '#fff',
            borderRadius: '16px',
            padding: '24px',
            border: '2px solid #e8f4fd',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            transition: 'transform 0.2s ease'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '20px',
              paddingBottom: '12px',
              borderBottom: '2px solid #4facfe'
            }}>
              <div style={{
                width: '36px',
                height: '36px',
                background: '#4facfe',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.1rem'
              }}>👤</div>
              <h4 style={{
                fontSize: '1.2rem',
                fontWeight: '700',
                color: '#2c3e50',
                margin: 0
              }}>Personal Information</h4>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px 12px',
                background: '#f8fbff',
                borderRadius: '8px',
                borderLeft: '3px solid #4facfe'
              }}>
                <span style={{ fontWeight: '500', color: '#5a6c7d' }}>Age:</span>
                <span style={{ fontWeight: '600', color: '#2c3e50' }}>{profile.age} years</span>
              </div>
              {profile.occupation && (
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 12px',
                  background: '#f8fbff',
                  borderRadius: '8px',
                  borderLeft: '3px solid #4facfe'
                }}>
                  <span style={{ fontWeight: '500', color: '#5a6c7d' }}>Occupation:</span>
                  <span style={{ fontWeight: '600', color: '#2c3e50' }}>{profile.occupation}</span>
                </div>
              )}
              {profile.email && (
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 12px',
                  background: '#f8fbff',
                  borderRadius: '8px',
                  borderLeft: '3px solid #4facfe'
                }}>
                  <span style={{ fontWeight: '500', color: '#5a6c7d' }}>Email:</span>
                  <span style={{ fontWeight: '600', color: '#2c3e50', fontSize: '0.9rem' }}>{profile.email}</span>
                </div>
              )}
              {profile.mobileNumber && (
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 12px',
                  background: '#f8fbff',
                  borderRadius: '8px',
                  borderLeft: '3px solid #4facfe'
                }}>
                  <span style={{ fontWeight: '500', color: '#5a6c7d' }}>Mobile:</span>
                  <span style={{ fontWeight: '600', color: '#2c3e50' }}>{profile.mobileNumber}</span>
                </div>
              )}
            </div>
          </div>

          {/* Community Information Card */}
          {(profile.caste || profile.subcaste) && (
            <div style={{
              background: '#fff',
              borderRadius: '16px',
              padding: '24px',
              border: '2px solid #e8f5e8',
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              transition: 'transform 0.2s ease'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '20px',
                paddingBottom: '12px',
                borderBottom: '2px solid #28a745'
              }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  background: '#28a745',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.1rem'
                }}>🏛️</div>
                <h4 style={{
                  fontSize: '1.2rem',
                  fontWeight: '700',
                  color: '#2c3e50',
                  margin: 0
                }}>Community Information</h4>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {profile.caste && (
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 12px',
                    background: '#f8fff8',
                    borderRadius: '8px',
                    borderLeft: '3px solid #28a745'
                  }}>
                    <span style={{ fontWeight: '500', color: '#5a6c7d' }}>Caste:</span>
                    <span style={{ fontWeight: '600', color: '#2c3e50' }}>{profile.caste}</span>
                  </div>
                )}
                {profile.subcaste && (
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 12px',
                    background: '#f8fff8',
                    borderRadius: '8px',
                    borderLeft: '3px solid #28a745'
                  }}>
                    <span style={{ fontWeight: '500', color: '#5a6c7d' }}>Subcaste:</span>
                    <span style={{ fontWeight: '600', color: '#2c3e50' }}>{profile.subcaste}</span>
                  </div>
                )}
                {profile.sakh && (
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 12px',
                    background: '#f8fff8',
                    borderRadius: '8px',
                    borderLeft: '3px solid #28a745'
                  }}>
                    <span style={{ fontWeight: '500', color: '#5a6c7d' }}>Sakh:</span>
                    <span style={{ fontWeight: '600', color: '#2c3e50' }}>{profile.sakh}</span>
                  </div>
                )}
                {profile.education && (
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 12px',
                    background: '#f8fff8',
                    borderRadius: '8px',
                    borderLeft: '3px solid #28a745'
                  }}>
                    <span style={{ fontWeight: '500', color: '#5a6c7d' }}>Education (અભ્યાસ):</span>
                    <span style={{ fontWeight: '600', color: '#2c3e50' }}>{profile.education}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Address Card */}
          {profile.address && (
            <div style={{
              background: '#fff',
              borderRadius: '16px',
              padding: '24px',
              border: '2px solid #fff3e0',
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              transition: 'transform 0.2s ease'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '20px',
                paddingBottom: '12px',
                borderBottom: '2px solid #ff9800'
              }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  background: '#ff9800',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.1rem'
                }}>📍</div>
                <h4 style={{
                  fontSize: '1.2rem',
                  fontWeight: '700',
                  color: '#2c3e50',
                  margin: 0
                }}>Address</h4>
              </div>
              <div style={{
                padding: '12px 16px',
                background: '#fffbf0',
                borderRadius: '8px',
                borderLeft: '3px solid #ff9800',
                fontSize: '1rem',
                lineHeight: '1.6',
                color: '#2c3e50',
                fontWeight: '500'
              }}>
                {profile.address}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Family Members Section */}
      {familyMembers.length > 0 && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.95) 100%)',
          backdropFilter: 'blur(20px)',
          borderRadius: '25px',
          padding: '35px',
          boxShadow: '0 15px 35px rgba(0, 0, 0, 0.08)',
          border: '1px solid rgba(255, 255, 255, 0.3)'
        }}>
          <h3 style={{
            fontSize: '1.8rem',
            fontWeight: '700',
            color: '#2d3a4b',
            marginBottom: '30px',
            textAlign: 'center'
          }}>
            Family Members
          </h3>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '20px'
          }}>
            {familyMembers.map((member, index) => (
              <div key={index} style={{
                background: '#fff',
                borderRadius: '16px',
                padding: '24px',
                border: '2px solid #f0f8ff',
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                transition: 'transform 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)';
              }}>
                {/* Header */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '15px',
                  marginBottom: '20px',
                  paddingBottom: '15px',
                  borderBottom: '2px solid #e74c3c'
                }}>
                  <div style={{
                    width: '50px',
                    height: '50px',
                    borderRadius: '50%',
                    background: '#e74c3c',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '1.5rem',
                    fontWeight: 'bold'
                  }}>
                    {member.surname ? member.surname[0].toUpperCase() : 'M'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <h4 style={{
                      margin: '0 0 8px 0',
                      fontSize: '1.3rem',
                      fontWeight: '700',
                      color: '#2c3e50'
                    }}>
                      {member.surname} {member.name}
                    </h4>
                    <span style={{
                      background: '#e74c3c',
                      color: 'white',
                      padding: '4px 10px',
                      borderRadius: '8px',
                      fontSize: '0.8rem',
                      fontWeight: '600'
                    }}>
                      {member.relation}
                    </span>
                  </div>
                </div>

                {/* Personal Details */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {member.fatherName && (
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '8px 12px',
                      background: '#fff5f5',
                      borderRadius: '8px',
                      borderLeft: '3px solid #e74c3c'
                    }}>
                      <span style={{ fontWeight: '500', color: '#5a6c7d' }}>Father's Name:</span>
                      <span style={{ fontWeight: '600', color: '#2c3e50' }}>{member.fatherName}</span>
                    </div>
                  )}
                  {member.memberAge && (
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '8px 12px',
                      background: '#fff5f5',
                      borderRadius: '8px',
                      borderLeft: '3px solid #e74c3c'
                    }}>
                      <span style={{ fontWeight: '500', color: '#5a6c7d' }}>Age:</span>
                      <span style={{ fontWeight: '600', color: '#2c3e50' }}>{member.memberAge} years</span>
                    </div>
                  )}
                  {member.occupation && (
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '8px 12px',
                      background: '#fff5f5',
                      borderRadius: '8px',
                      borderLeft: '3px solid #e74c3c'
                    }}>
                      <span style={{ fontWeight: '500', color: '#5a6c7d' }}>Occupation:</span>
                      <span style={{ fontWeight: '600', color: '#2c3e50' }}>{member.occupation}</span>
                    </div>
                  )}
                  {member.email && (
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '8px 12px',
                      background: '#fff5f5',
                      borderRadius: '8px',
                      borderLeft: '3px solid #e74c3c'
                    }}>
                      <span style={{ fontWeight: '500', color: '#5a6c7d' }}>Email:</span>
                      <span style={{ fontWeight: '600', color: '#2c3e50', fontSize: '0.9rem' }}>{member.email}</span>
                    </div>
                  )}
                  {member.mobileNumber && (
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '8px 12px',
                      background: '#fff5f5',
                      borderRadius: '8px',
                      borderLeft: '3px solid #e74c3c'
                    }}>
                      <span style={{ fontWeight: '500', color: '#5a6c7d' }}>Mobile:</span>
                      <span style={{ fontWeight: '600', color: '#2c3e50' }}>{member.mobileNumber}</span>
                    </div>
                  )}
                  {member.city && (
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '8px 12px',
                      background: '#fff5f5',
                      borderRadius: '8px',
                      borderLeft: '3px solid #e74c3c'
                    }}>
                      <span style={{ fontWeight: '500', color: '#5a6c7d' }}>City:</span>
                      <span style={{ fontWeight: '600', color: '#2c3e50' }}>{member.city}</span>
                    </div>
                  )}
                  {member.hometown && (
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '8px 12px',
                      background: '#fff5f5',
                      borderRadius: '8px',
                      borderLeft: '3px solid #e74c3c'
                    }}>
                      <span style={{ fontWeight: '500', color: '#5a6c7d' }}>Hometown:</span>
                      <span style={{ fontWeight: '600', color: '#2c3e50' }}>{member.hometown}</span>
                    </div>
                  )}
                  {member.address && (
                    <div style={{
                      padding: '12px',
                      background: '#fff5f5',
                      borderRadius: '8px',
                      borderLeft: '3px solid #e74c3c'
                    }}>
                      <div style={{ fontWeight: '500', color: '#5a6c7d', marginBottom: '6px' }}>Address:</div>
                      <div style={{ fontWeight: '600', color: '#2c3e50', lineHeight: '1.5' }}>{member.address}</div>
                    </div>
                  )}
                  {member.caste && (
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '8px 12px',
                      background: '#fff5f5',
                      borderRadius: '8px',
                      borderLeft: '3px solid #e74c3c'
                    }}>
                      <span style={{ fontWeight: '500', color: '#5a6c7d' }}>Caste:</span>
                      <span style={{ fontWeight: '600', color: '#2c3e50' }}>{member.caste}</span>
                    </div>
                  )}
                  {member.subcaste && (
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '8px 12px',
                      background: '#fff5f5',
                      borderRadius: '8px',
                      borderLeft: '3px solid #e74c3c'
                    }}>
                      <span style={{ fontWeight: '500', color: '#5a6c7d' }}>Subcaste:</span>
                      <span style={{ fontWeight: '600', color: '#2c3e50' }}>{member.subcaste}</span>
                    </div>
                  )}
                  {member.sakh && (
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '8px 12px',
                      background: '#fff5f5',
                      borderRadius: '8px',
                      borderLeft: '3px solid #e74c3c'
                    }}>
                      <span style={{ fontWeight: '500', color: '#5a6c7d' }}>Sakh:</span>
                      <span style={{ fontWeight: '600', color: '#2c3e50' }}>{member.sakh}</span>
                    </div>
                  )}
                  {member.education && (
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '8px 12px',
                      background: '#fff5f5',
                      borderRadius: '8px',
                      borderLeft: '3px solid #e74c3c'
                    }}>
                      <span style={{ fontWeight: '500', color: '#5a6c7d' }}>Education (અભ્યાસ):</span>
                      <span style={{ fontWeight: '600', color: '#2c3e50' }}>{member.education}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Layout>
  );
};

export default FamilyProfile;