import React, { useState, useEffect, useRef } from 'react';
import axios from '../axiosConfig';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Layout from '../components/Layout';
import LanguageToggle from '../components/LanguageToggle';
import { useTranslation } from '../hooks/useTranslation';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const Messages = () => {
  const { t, language } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const partnerId = searchParams.get('partner_id');
  
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchConversations();
    if (partnerId) {
      fetchMessages(partnerId);
    }
  }, [partnerId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchConversations = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('community/messages/', {
        headers: { Authorization: `Token ${token}` }
      });

      if (response.data.success) {
        setConversations(response.data.conversations);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (partnerIdParam) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`community/messages/?partner_id=${partnerIdParam}`, {
        headers: { Authorization: `Token ${token}` }
      });

      if (response.data.success) {
        setMessages(response.data.messages);
        const partner = conversations.find(conv => conv.partner.id === parseInt(partnerIdParam));
        if (partner) {
          setSelectedPartner(partner.partner);
        } else {
          try {
            const profileResponse = await axios.get(`community/profile/${partnerIdParam}/`, {
              headers: { Authorization: `Token ${token}` }
            });
            if (profileResponse.data.success) {
              setSelectedPartner({
                id: parseInt(partnerIdParam),
                name: `${profileResponse.data.profile.surname} ${profileResponse.data.profile.name}`,
                avatar: profileResponse.data.profile.avatar
              });
            }
          } catch (error) {
            console.error('Error fetching partner profile:', error);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedPartner || sending) return;

    setSending(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('community/messages/', {
        receiver_id: selectedPartner.id,
        message: newMessage.trim()
      }, {
        headers: { Authorization: `Token ${token}` }
      });

      if (response.data.success) {
        setNewMessage('');
        fetchMessages(selectedPartner.id);
        fetchConversations();
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const selectConversation = (partner) => {
    setSelectedPartner(partner);
    navigate(`/messages?partner_id=${partner.id}`);
    fetchMessages(partner.id);
  };

  if (loading) {
    return (
      <Layout title={t('messages') || 'Messages'}>
        <LanguageToggle />
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '400px',
          fontSize: '1.2rem',
          color: '#666'
        }}>{t('loadingMessages') || 'Loading messages...'}</div>
      </Layout>
    );
  }

  return (
    <Layout title={`💬 ${t('familyMessages') || 'Family Messages'}`}>
      <LanguageToggle />
      <div style={{
        display: 'flex',
        height: '70vh',
        gap: '20px'
      }}>
        {/* Conversations List */}
        <div style={{
          width: '350px',
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.95) 100%)',
          backdropFilter: 'blur(20px)',
          borderRadius: '25px',
          padding: '25px',
          boxShadow: '0 15px 35px rgba(0, 0, 0, 0.08)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          overflowY: 'auto'
        }}>
          <h3 style={{
            fontSize: '1.4rem',
            fontWeight: '800',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '20px',
            textAlign: 'center'
          }}>
            {t('conversations') || 'Conversations'}
          </h3>
          
          {conversations.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '40px 20px',
              background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
              borderRadius: '20px',
              border: '2px dashed #dee2e6'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '15px' }}>💭</div>
              <h4 style={{ color: '#64748b', marginBottom: '10px' }}>{t('noConversationsYet') || 'No conversations yet'}</h4>
              <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>{t('startMessagingFamilies') || 'Start messaging your connected families!'}</p>
            </div>
          ) : (
            conversations.map((conversation) => (
              <div
                key={conversation.partner.id}
                onClick={() => selectConversation(conversation.partner)}
                style={{
                  padding: '18px',
                  borderRadius: '18px',
                  marginBottom: '12px',
                  cursor: 'pointer',
                  background: selectedPartner?.id === conversation.partner.id 
                    ? 'linear-gradient(135deg, rgba(102, 126, 234, 0.15) 0%, rgba(118, 75, 162, 0.15) 100%)'
                    : 'rgba(255, 255, 255, 0.8)',
                  border: selectedPartner?.id === conversation.partner.id 
                    ? '2px solid rgba(102, 126, 234, 0.3)'
                    : '1px solid rgba(255, 255, 255, 0.3)',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  if (selectedPartner?.id !== conversation.partner.id) {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.1)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedPartner?.id !== conversation.partner.id) {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = 'none';
                  }
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '15px'
                }}>
                  <div style={{
                    width: '50px',
                    height: '50px',
                    borderRadius: '50%',
                    background: conversation.partner.avatar ? 'transparent' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.3rem',
                    color: '#fff',
                    fontWeight: 'bold',
                    overflow: 'hidden',
                    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)'
                  }}>
                    {conversation.partner.avatar ? (
                      <img
                        src={conversation.partner.avatar.startsWith('http') ? conversation.partner.avatar : `http://localhost:8000${conversation.partner.avatar}`}
                        alt={conversation.partner.name}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                      />
                    ) : (
                      conversation.partner.name[0]?.toUpperCase() || 'F'
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontSize: '1.1rem',
                      fontWeight: '700',
                      color: '#2c3e50',
                      marginBottom: '4px'
                    }}>
                      {conversation.partner.name}
                    </div>
                    <div style={{
                      fontSize: '0.9rem',
                      color: '#64748b',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      marginBottom: '2px'
                    }}>
                      {conversation.latest_message.is_sender ? 'You: ' : ''}
                      {conversation.latest_message.message}
                    </div>
                    <div style={{
                      fontSize: '0.8rem',
                      color: '#94a3b8'
                    }}>
                      {dayjs(conversation.latest_message.created_at).fromNow()}
                    </div>
                  </div>
                  {conversation.unread_count > 0 && (
                    <div style={{
                      background: '#ff4757',
                      color: 'white',
                      borderRadius: '50%',
                      width: '24px',
                      height: '24px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.8rem',
                      fontWeight: 'bold',
                      animation: 'pulse 2s infinite'
                    }}>
                      {conversation.unread_count}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Messages Area */}
        <div style={{
          flex: 1,
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.95) 100%)',
          backdropFilter: 'blur(20px)',
          borderRadius: '25px',
          boxShadow: '0 15px 35px rgba(0, 0, 0, 0.08)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          display: 'flex',
          flexDirection: 'column',
          height: '70vh'
        }}>
          {selectedPartner ? (
            <>
              {/* Chat Header */}
              <div style={{
                padding: '25px',
                borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
                display: 'flex',
                alignItems: 'center',
                gap: '15px',
                flexShrink: 0
              }}>
                <div style={{
                  width: '55px',
                  height: '55px',
                  borderRadius: '50%',
                  background: selectedPartner.avatar ? 'transparent' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.5rem',
                  color: '#fff',
                  fontWeight: 'bold',
                  overflow: 'hidden',
                  boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15)'
                }}>
                  {selectedPartner.avatar ? (
                    <img
                      src={selectedPartner.avatar.startsWith('http') ? selectedPartner.avatar : `http://localhost:8000${selectedPartner.avatar}`}
                      alt={selectedPartner.name}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                    />
                  ) : (
                    selectedPartner.name[0]?.toUpperCase() || 'F'
                  )}
                </div>
                <div>
                  <h3 style={{
                    fontSize: '1.4rem',
                    fontWeight: '700',
                    color: '#2c3e50',
                    margin: '0 0 5px 0'
                  }}>
                    {selectedPartner.name}
                  </h3>
                  <p style={{
                    fontSize: '0.95rem',
                    color: '#64748b',
                    margin: 0
                  }}>
                    {t('connectedFamily') || 'Connected Family'}
                  </p>
                </div>
              </div>

              {/* Messages Container */}
              <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: '25px',
                display: 'flex',
                flexDirection: 'column',
                gap: '15px'
              }}>
                {messages.length === 0 ? (
                  <div style={{
                    textAlign: 'center',
                    padding: '60px 20px',
                    background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
                    borderRadius: '20px',
                    border: '2px dashed #dee2e6'
                  }}>
                    <div style={{ fontSize: '4rem', marginBottom: '20px' }}>👋</div>
                    <h3 style={{ fontSize: '1.3rem', color: '#64748b', marginBottom: '10px' }}>{t('startConversation') || 'Start Conversation'}</h3>
                    <p style={{ color: '#94a3b8' }}>{t('sendFirstMessage') || 'Send your first message to'} {selectedPartner.name}!</p>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      style={{
                        display: 'flex',
                        justifyContent: message.sender.id === selectedPartner.id ? 'flex-start' : 'flex-end'
                      }}
                    >
                      <div style={{
                        maxWidth: '70%',
                        padding: '15px 20px',
                        borderRadius: '20px',
                        background: message.sender.id === selectedPartner.id 
                          ? 'rgba(102, 126, 234, 0.1)'
                          : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: message.sender.id === selectedPartner.id ? '#2c3e50' : '#fff',
                        fontSize: '1rem',
                        lineHeight: '1.5',
                        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)'
                      }}>
                        <div>{message.message}</div>
                        <div style={{
                          fontSize: '0.8rem',
                          opacity: 0.7,
                          marginTop: '8px',
                          textAlign: 'right'
                        }}>
                          {dayjs(message.created_at).format('HH:mm')}
                        </div>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div style={{
                padding: '25px',
                borderTop: '1px solid rgba(0, 0, 0, 0.1)',
                display: 'flex',
                gap: '15px',
                alignItems: 'flex-end',
                flexShrink: 0
              }}>
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={`Send a message to ${selectedPartner.name}...`}
                  style={{
                    flex: 1,
                    padding: '15px 20px',
                    borderRadius: '25px',
                    border: '2px solid rgba(102, 126, 234, 0.2)',
                    fontSize: '1rem',
                    fontFamily: 'inherit',
                    resize: 'none',
                    minHeight: '50px',
                    maxHeight: '120px',
                    outline: 'none',
                    backgroundColor: '#ffffff',
                    color: '#333',
                    lineHeight: '1.4',
                    transition: 'all 0.3s ease'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#667eea';
                    e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'rgba(102, 126, 234, 0.2)';
                    e.target.style.boxShadow = 'none';
                  }}
                  rows={1}
                />
                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim() || sending}
                  style={{
                    background: newMessage.trim() && !sending 
                      ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                      : 'rgba(102, 126, 234, 0.4)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '50%',
                    width: '55px',
                    height: '55px',
                    cursor: newMessage.trim() && !sending ? 'pointer' : 'not-allowed',
                    fontSize: '1.4rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.3s ease',
                    boxShadow: newMessage.trim() && !sending 
                      ? '0 8px 25px rgba(102, 126, 234, 0.4)' 
                      : 'none'
                  }}
                  onMouseEnter={(e) => {
                    if (newMessage.trim() && !sending) {
                      e.target.style.transform = 'scale(1.1)';
                      e.target.style.boxShadow = '0 12px 35px rgba(102, 126, 234, 0.5)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (newMessage.trim() && !sending) {
                      e.target.style.transform = 'scale(1)';
                      e.target.style.boxShadow = '0 8px 25px rgba(102, 126, 234, 0.4)';
                    }
                  }}
                >
                  {sending ? '⏳' : '📤'}
                </button>
              </div>
            </>
          ) : (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              textAlign: 'center'
            }}>
              <div>
                <div style={{ fontSize: '5rem', marginBottom: '25px' }}>💬</div>
                <h3 style={{ 
                  fontSize: '1.8rem', 
                  marginBottom: '15px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}>{t('selectConversation') || 'Select a conversation'}</h3>
                <p style={{ color: '#64748b', fontSize: '1.1rem' }}>{t('chooseFamily') || 'Choose a family from the left to start messaging'}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Messages;