import React, { useState, useEffect } from 'react';
import axios from '../axiosConfig';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import LanguageToggle from '../components/LanguageToggle';
import { useTranslation } from '../hooks/useTranslation';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const Connections = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [acceptedConnections, setAcceptedConnections] = useState([]);
  const [pendingRequests, setPendingRequests] = useState({ sent_requests: [], received_requests: [] });
  const [findConnections, setFindConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('accepted');
  const [showEventModal, setShowEventModal] = useState(false);
  const [removing, setRemoving] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredConnections, setFilteredConnections] = useState([]);

  useEffect(() => {
    fetchAllConnections();
  }, []);

  const fetchAllConnections = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Fetch accepted connections
      const acceptedResponse = await axios.get('community/accepted-connections/', {
        headers: { Authorization: `Token ${token}` }
      });
      if (acceptedResponse.data.success) {
        setAcceptedConnections(acceptedResponse.data.connections);
      }
      
      // Fetch pending requests
      const pendingResponse = await axios.get('community/pending-requests/', {
        headers: { Authorization: `Token ${token}` }
      });
      if (pendingResponse.data.success) {
        setPendingRequests(pendingResponse.data);
      }
      
      // Fetch find connections
      const findResponse = await axios.get('community/find-connections/', {
        headers: { Authorization: `Token ${token}` }
      });
      if (findResponse.data.success) {
        setFindConnections(findResponse.data.suggestions);
        setFilteredConnections(findResponse.data.suggestions);
      }
    } catch (error) {
      console.error('Error fetching connections:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendConnectionRequest = async (profileId) => {
    try {
      const token = localStorage.getItem('token');
      const message = prompt('Enter a message for your connection request (optional):') || '';
      
      const response = await axios.post('community/connect/', {
        receiver_id: profileId,
        message: message
      }, {
        headers: { Authorization: `Token ${token}` }
      });

      if (response.data.success) {
        alert(response.data.message);
        const updatedConnections = findConnections.filter(profile => profile.id !== profileId);
        setFindConnections(updatedConnections);
        setFilteredConnections(updatedConnections.filter(profile => 
          profile.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (profile.city && profile.city.toLowerCase().includes(searchQuery.toLowerCase()))
        ));
        fetchAllConnections();
      } else {
        alert(response.data.message || 'Failed to send connection request');
      }
    } catch (error) {
      console.error('Connection request error:', error);
      alert('Failed to send connection request. Please try again.');
    }
  };

  const handleConnectionResponse = async (connectionId, action) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`community/connections/${connectionId}/respond/`, {
        action: action
      }, {
        headers: { Authorization: `Token ${token}` }
      });

      if (response.data.success) {
        alert(response.data.message);
        fetchAllConnections();
      }
    } catch (error) {
      alert('Failed to respond to connection request. Please try again.');
      console.error('Connection response error:', error);
    }
  };

  const handleSendMessage = (profileId) => {
    navigate(`/messages?partner_id=${profileId}`);
  };

  const handleViewProfile = (profileId) => {
    navigate(`/family-profile/${profileId}`);
  };

  const handleRemoveConnection = async (connectionId, profileName) => {
    if (!window.confirm(`Are you sure you want to remove ${profileName} from your connections?`)) {
      return;
    }

    setRemoving(connectionId);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.delete(`community/connections/${connectionId}/`, {
        headers: { Authorization: `Token ${token}` }
      });

      if (response.data.success) {
        alert('Connection removed successfully!');
        fetchAllConnections();
      } else {
        alert(response.data.message || 'Failed to remove connection');
      }
    } catch (error) {
      console.error('Error removing connection:', error);
      alert('Failed to remove connection. Please try again.');
    } finally {
      setRemoving(null);
    }
  };

  if (loading) {
    return (
      <Layout title="Connections">
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '400px',
          fontSize: '1.2rem',
          color: '#666'
        }}>{t('loadingConnections') || 'Loading connections...'}</div>
      </Layout>
    );
  }

  return (
    <Layout title={`🤝 ${t('familyConnections') || 'Family Connections'}`}>
      <LanguageToggle />

      {/* Tabs */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.95) 100%)',
        backdropFilter: 'blur(20px)',
        borderRadius: '25px',
        padding: '25px',
        marginBottom: '25px',
        boxShadow: '0 15px 35px rgba(0, 0, 0, 0.08)',
        border: '1px solid rgba(255, 255, 255, 0.3)'
      }}>
        <div style={{
          display: 'flex',
          gap: '10px',
          justifyContent: 'center',
          flexWrap: 'wrap'
        }}>
          <button
            onClick={() => setActiveTab('accepted')}
            style={{
              background: activeTab === 'accepted'
                ? 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
                : 'rgba(102, 126, 234, 0.1)',
              color: activeTab === 'accepted' ? '#fff' : '#667eea',
              border: activeTab === 'accepted' ? 'none' : '1px solid rgba(102, 126, 234, 0.3)',
              padding: '12px 25px',
              borderRadius: '25px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            ✅ {t('accepted') || 'Accepted'} ({acceptedConnections.length})
          </button>
          <button
            onClick={() => setActiveTab('pending')}
            style={{
              background: activeTab === 'pending'
                ? 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
                : 'rgba(102, 126, 234, 0.1)',
              color: activeTab === 'pending' ? '#fff' : '#667eea',
              border: activeTab === 'pending' ? 'none' : '1px solid rgba(102, 126, 234, 0.3)',
              padding: '12px 25px',
              borderRadius: '25px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            ⏳ {t('pending') || 'Pending'} ({pendingRequests.sent_requests.length + pendingRequests.received_requests.length})
          </button>
          <button
            onClick={() => setActiveTab('find')}
            style={{
              background: activeTab === 'find'
                ? 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
                : 'rgba(102, 126, 234, 0.1)',
              color: activeTab === 'find' ? '#fff' : '#667eea',
              border: activeTab === 'find' ? 'none' : '1px solid rgba(102, 126, 234, 0.3)',
              padding: '12px 25px',
              borderRadius: '25px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            🔍 {t('findConnections') || 'Find Connections'}
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.95) 100%)',
        backdropFilter: 'blur(20px)',
        borderRadius: '25px',
        padding: '35px',
        boxShadow: '0 15px 35px rgba(0, 0, 0, 0.08)',
        border: '1px solid rgba(255, 255, 255, 0.3)'
      }}>
        {activeTab === 'accepted' && (
          <div>
            <h2 style={{
              fontSize: '1.6rem',
              fontWeight: '700',
              color: '#2d3a4b',
              marginBottom: '25px',
              textAlign: 'center'
            }}>
              ✅ {t('acceptedConnections') || 'Your Accepted Connections'}
            </h2>
            
            {acceptedConnections.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '60px 20px',
                color: '#666'
              }}>
                <div style={{ fontSize: '4rem', marginBottom: '20px' }}>🤝</div>
                <h3 style={{ fontSize: '1.3rem', marginBottom: '10px' }}>{t('noAcceptedConnections') || 'No accepted connections'}</h3>
                <p style={{ fontSize: '1rem' }}>When you accept connection requests, they'll appear here.</p>
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
                gap: '20px'
              }}>
                {acceptedConnections.map((connection) => (
                  <div key={connection.id} style={{
                    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.8) 0%, rgba(255, 255, 255, 0.6) 100%)',
                    borderRadius: '15px',
                    padding: '25px',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    transition: 'all 0.3s ease',
                    backdropFilter: 'blur(10px)',
                    boxShadow: '0 8px 25px rgba(0, 0, 0, 0.1)'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '15px',
                      marginBottom: '15px'
                    }}>
                      <div style={{
                        width: '50px',
                        height: '50px',
                        borderRadius: '50%',
                        background: connection.profile.avatar ? 'transparent' : 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.5rem',
                        color: '#fff',
                        fontWeight: 'bold',
                        overflow: 'hidden'
                      }}>
                        {connection.profile.avatar ? (
                          <img
                            src={connection.profile.avatar.startsWith('http') ? connection.profile.avatar : `http://localhost:8000${connection.profile.avatar}`}
                            alt={connection.profile.name}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                              borderRadius: '50%'
                            }}
                          />
                        ) : (
                          connection.profile.name[0]?.toUpperCase() || 'F'
                        )}
                      </div>
                      <div style={{ flex: 1 }}>
                        <h4 style={{
                          fontSize: '1.2rem',
                          fontWeight: '700',
                          color: '#2d3a4b',
                          margin: '0 0 5px 0'
                        }}>
                          {connection.profile.name}
                        </h4>
                        <div style={{
                          fontSize: '0.9rem',
                          color: '#666',
                          marginBottom: '5px'
                        }}>
                          {connection.profile.city && `From ${connection.profile.city}`}
                        </div>
                        <div style={{
                          fontSize: '0.8rem',
                          color: '#999'
                        }}>
                          Connected {dayjs(connection.connected_at).fromNow()}
                        </div>
                      </div>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        fontSize: '0.9rem',
                        fontWeight: '600',
                        color: '#4caf50'
                      }}>
                        ✅ Connected
                      </div>
                    </div>

                    <div style={{
                      display: 'flex',
                      gap: '10px',
                      justifyContent: 'center',
                      marginTop: '10px'
                    }}>
                      <button
                        onClick={() => handleSendMessage(connection.profile.id)}
                        style={{
                          background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                          color: 'white',
                          border: 'none',
                          padding: '8px 16px',
                          borderRadius: '20px',
                          fontSize: '0.85rem',
                          fontWeight: '600',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          boxShadow: '0 4px 15px rgba(79, 172, 254, 0.4)'
                        }}
                      >
                        💬 {t('sendMessage') || 'Send Message'}
                      </button>
                      <button
                        onClick={() => handleViewProfile(connection.profile.id)}
                        style={{
                          background: 'rgba(79, 172, 254, 0.1)',
                          color: '#4facfe',
                          border: '1px solid rgba(79, 172, 254, 0.3)',
                          padding: '8px 16px',
                          borderRadius: '20px',
                          fontSize: '0.85rem',
                          fontWeight: '600',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease'
                        }}
                      >
                        👁️ {t('viewProfile') || 'View Profile'}
                      </button>
                      <button
                        onClick={() => handleRemoveConnection(connection.id, connection.profile.name)}
                        disabled={removing === connection.id}
                        style={{
                          background: removing === connection.id 
                            ? 'rgba(244, 67, 54, 0.3)' 
                            : 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)',
                          color: 'white',
                          border: 'none',
                          padding: '8px 16px',
                          borderRadius: '20px',
                          fontSize: '0.85rem',
                          fontWeight: '600',
                          cursor: removing === connection.id ? 'not-allowed' : 'pointer',
                          transition: 'all 0.3s ease'
                        }}
                      >
                        {removing === connection.id ? '⏳ Removing...' : `🗑️ ${t('remove') || 'Remove'}`}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'pending' && (
          <div>
            <h2 style={{
              fontSize: '1.6rem',
              fontWeight: '700',
              color: '#2d3a4b',
              marginBottom: '25px',
              textAlign: 'center'
            }}>
              ⏳ {t('pendingRequests') || 'Pending Requests'}
            </h2>
            
            {/* Received Requests */}
            <div style={{ marginBottom: '40px' }}>
              <h3 style={{ fontSize: '1.3rem', color: '#2d3a4b', marginBottom: '20px' }}>
                📨 {t('receivedRequests') || 'Received Requests'} ({pendingRequests.received_requests.length})
              </h3>
              
              {pendingRequests.received_requests.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '15px' }}>📭</div>
                  <p>No pending requests received</p>
                </div>
              ) : (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
                  gap: '20px'
                }}>
                  {pendingRequests.received_requests.map((connection) => (
                    <div key={connection.id} style={{
                      background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.8) 0%, rgba(255, 255, 255, 0.6) 100%)',
                      borderRadius: '15px',
                      padding: '25px',
                      border: '1px solid rgba(255, 255, 255, 0.3)',
                      boxShadow: '0 8px 25px rgba(0, 0, 0, 0.1)'
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '15px',
                        marginBottom: '15px'
                      }}>
                        <div style={{
                          width: '50px',
                          height: '50px',
                          borderRadius: '50%',
                          background: connection.profile.avatar ? 'transparent' : 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1.5rem',
                          color: '#fff',
                          fontWeight: 'bold',
                          overflow: 'hidden'
                        }}>
                          {connection.profile.avatar ? (
                            <img
                              src={connection.profile.avatar.startsWith('http') ? connection.profile.avatar : `http://localhost:8000${connection.profile.avatar}`}
                              alt={connection.profile.name}
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                borderRadius: '50%'
                              }}
                            />
                          ) : (
                            connection.profile.name[0]?.toUpperCase() || 'F'
                          )}
                        </div>
                        <div style={{ flex: 1 }}>
                          <h4 style={{
                            fontSize: '1.2rem',
                            fontWeight: '700',
                            color: '#2d3a4b',
                            margin: '0 0 5px 0'
                          }}>
                            {connection.profile.name}
                          </h4>
                          <div style={{ fontSize: '0.9rem', color: '#666' }}>
                            {connection.profile.city && `From ${connection.profile.city}`}
                          </div>
                          <div style={{ fontSize: '0.8rem', color: '#999' }}>
                            {dayjs(connection.created_at).fromNow()}
                          </div>
                        </div>
                      </div>

                      {connection.message && (
                        <div style={{
                          background: 'rgba(79, 172, 254, 0.1)',
                          borderRadius: '10px',
                          padding: '15px',
                          marginBottom: '15px',
                          fontSize: '0.95rem',
                          color: '#2d3a4b',
                          fontStyle: 'italic'
                        }}>
                          "{connection.message}"
                        </div>
                      )}

                      <div style={{
                        display: 'flex',
                        gap: '10px',
                        justifyContent: 'center'
                      }}>
                        <button
                          onClick={() => handleConnectionResponse(connection.id, 'accept')}
                          style={{
                            background: 'linear-gradient(135deg, #4caf50 0%, #45a049 100%)',
                            color: 'white',
                            border: 'none',
                            padding: '10px 20px',
                            borderRadius: '20px',
                            fontSize: '0.9rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease'
                          }}
                        >
                          ✅ {t('accept') || 'Accept'}
                        </button>
                        <button
                          onClick={() => handleConnectionResponse(connection.id, 'decline')}
                          style={{
                            background: 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)',
                            color: 'white',
                            border: 'none',
                            padding: '10px 20px',
                            borderRadius: '20px',
                            fontSize: '0.9rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease'
                          }}
                        >
                          ❌ {t('decline') || 'Decline'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Sent Requests */}
            <div>
              <h3 style={{ fontSize: '1.3rem', color: '#2d3a4b', marginBottom: '20px' }}>
                📤 {t('sentRequests') || 'Sent Requests'} ({pendingRequests.sent_requests.length})
              </h3>
              
              {pendingRequests.sent_requests.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '15px' }}>📮</div>
                  <p>No pending requests sent</p>
                </div>
              ) : (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
                  gap: '20px'
                }}>
                  {pendingRequests.sent_requests.map((connection) => (
                    <div key={connection.id} style={{
                      background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.8) 0%, rgba(255, 255, 255, 0.6) 100%)',
                      borderRadius: '15px',
                      padding: '25px',
                      border: '1px solid rgba(255, 255, 255, 0.3)',
                      boxShadow: '0 8px 25px rgba(0, 0, 0, 0.1)'
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '15px',
                        marginBottom: '15px'
                      }}>
                        <div style={{
                          width: '50px',
                          height: '50px',
                          borderRadius: '50%',
                          background: connection.profile.avatar ? 'transparent' : 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1.5rem',
                          color: '#fff',
                          fontWeight: 'bold',
                          overflow: 'hidden'
                        }}>
                          {connection.profile.avatar ? (
                            <img
                              src={connection.profile.avatar.startsWith('http') ? connection.profile.avatar : `http://localhost:8000${connection.profile.avatar}`}
                              alt={connection.profile.name}
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                borderRadius: '50%'
                              }}
                            />
                          ) : (
                            connection.profile.name[0]?.toUpperCase() || 'F'
                          )}
                        </div>
                        <div style={{ flex: 1 }}>
                          <h4 style={{
                            fontSize: '1.2rem',
                            fontWeight: '700',
                            color: '#2d3a4b',
                            margin: '0 0 5px 0'
                          }}>
                            {connection.profile.name}
                          </h4>
                          <div style={{ fontSize: '0.9rem', color: '#666' }}>
                            {connection.profile.city && `From ${connection.profile.city}`}
                          </div>
                          <div style={{ fontSize: '0.8rem', color: '#999' }}>
                            Sent {dayjs(connection.created_at).fromNow()}
                          </div>
                        </div>
                        <div style={{
                          fontSize: '0.9rem',
                          fontWeight: '600',
                          color: '#ff9800'
                        }}>
                          ⏳ Pending
                        </div>
                      </div>

                      {connection.message && (
                        <div style={{
                          background: 'rgba(79, 172, 254, 0.1)',
                          borderRadius: '10px',
                          padding: '15px',
                          fontSize: '0.95rem',
                          color: '#2d3a4b',
                          fontStyle: 'italic'
                        }}>
                          Your message: "{connection.message}"
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'find' && (
          <div>
            <h2 style={{
              fontSize: '1.6rem',
              fontWeight: '700',
              color: '#2d3a4b',
              marginBottom: '25px',
              textAlign: 'center'
            }}>
              🔍 {t('findNewConnections') || 'Find New Connections'}
            </h2>
            
            {/* Search Input */}
            <div style={{
              marginBottom: '30px',
              display: 'flex',
              justifyContent: 'center'
            }}>
              <div style={{
                position: 'relative',
                width: '100%',
                maxWidth: '400px'
              }}>
                <input
                  type="text"
                  placeholder={t('searchFamiliesByName') || 'Search families by name or city...'}
                  value={searchQuery}
                  onChange={(e) => {
                    const query = e.target.value;
                    setSearchQuery(query);
                    const filtered = findConnections.filter(profile => 
                      profile.name.toLowerCase().includes(query.toLowerCase()) ||
                      (profile.city && profile.city.toLowerCase().includes(query.toLowerCase()))
                    );
                    setFilteredConnections(filtered);
                  }}
                  style={{
                    width: '100%',
                    padding: '15px 50px 15px 20px',
                    borderRadius: '25px',
                    border: '2px solid rgba(79, 172, 254, 0.3)',
                    fontSize: '1rem',
                    outline: 'none',
                    transition: 'all 0.3s ease',
                    background: 'rgba(255, 255, 255, 0.9)'
                  }}
                />
                <div style={{
                  position: 'absolute',
                  right: '20px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontSize: '1.2rem',
                  color: '#4facfe'
                }}>
                  🔍
                </div>
              </div>
            </div>
            
            {filteredConnections.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '60px 20px',
                color: '#666'
              }}>
                <div style={{ fontSize: '4rem', marginBottom: '20px' }}>🔍</div>
                <h3 style={{ fontSize: '1.3rem', marginBottom: '10px' }}>
                  {searchQuery ? 'No families found' : 'No new families to connect with'}
                </h3>
                <p style={{ fontSize: '1rem' }}>
                  {searchQuery ? 'Try searching with different keywords.' : 'All available families are already connected or have pending requests.'}
                </p>
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
                gap: '20px'
              }}>
                {filteredConnections.map((profile) => (
                  <div key={profile.id} style={{
                    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.8) 0%, rgba(255, 255, 255, 0.6) 100%)',
                    borderRadius: '15px',
                    padding: '25px',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    boxShadow: '0 8px 25px rgba(0, 0, 0, 0.1)'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '15px',
                      marginBottom: '15px'
                    }}>
                      <div style={{
                        width: '60px',
                        height: '60px',
                        borderRadius: '50%',
                        background: profile.avatar ? 'transparent' : 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.8rem',
                        color: '#fff',
                        fontWeight: 'bold',
                        overflow: 'hidden'
                      }}>
                        {profile.avatar ? (
                          <img
                            src={profile.avatar.startsWith('http') ? profile.avatar : `http://localhost:8000${profile.avatar}`}
                            alt={profile.name}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                              borderRadius: '50%'
                            }}
                          />
                        ) : (
                          profile.name[0]?.toUpperCase() || 'F'
                        )}
                      </div>
                      <div style={{ flex: 1 }}>
                        <h4 style={{
                          fontSize: '1.3rem',
                          fontWeight: '700',
                          color: '#2d3a4b',
                          margin: '0 0 5px 0'
                        }}>
                          {profile.name}
                        </h4>
                        <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '3px' }}>
                          👨‍👩‍👧‍👦 {profile.membersCount} member(s)
                        </div>
                        {profile.city && (
                          <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '3px' }}>
                            📍 {profile.city}
                          </div>
                        )}
                        {profile.hometown && profile.hometown !== profile.city && (
                          <div style={{ fontSize: '0.9rem', color: '#666' }}>
                            🏠 {profile.hometown}
                          </div>
                        )}
                      </div>
                    </div>

                    <div style={{
                      display: 'flex',
                      justifyContent: 'center'
                    }}>
                      <button
                        onClick={() => handleSendConnectionRequest(profile.id)}
                        style={{
                          background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                          color: 'white',
                          border: 'none',
                          padding: '12px 25px',
                          borderRadius: '25px',
                          fontSize: '1rem',
                          fontWeight: '600',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          boxShadow: '0 4px 15px rgba(79, 172, 254, 0.4)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}
                      >
                        🤝 {t('sendConnectionRequest') || 'Send Connection Request'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Connections;