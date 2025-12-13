import React, { useState, useEffect } from 'react';
import axios from '../axiosConfig';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import LanguageToggle from '../components/LanguageToggle';
import { useTranslation } from '../hooks/useTranslation';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import './Events.css';

dayjs.extend(relativeTime);

const Events = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [events, setEvents] = useState({
    organized: [],
    invited: [],
    public: []
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('invited');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [editingEvent, setEditingEvent] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [connections, setConnections] = useState([]);
  const [selectedInvitees, setSelectedInvitees] = useState([]);
  const [inviting, setInviting] = useState(false);
  const [showManageModal, setShowManageModal] = useState(false);
  const [currentInvitations, setCurrentInvitations] = useState([]);

  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    event_type: 'gathering',
    event_date: '',
    location: '',
    max_attendees: '',
    is_public: false,
    visible_to_all: false
  });

  useEffect(() => {
    fetchEvents();
    fetchConnections();
  }, []);

  const fetchConnections = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('community/accepted-connections/', {
        headers: { Authorization: `Token ${token}` }
      });
      if (response.data.success) {
        setConnections(response.data.connections);
      }
    } catch (error) {
      console.error('Error fetching connections:', error);
    }
  };

  const fetchEvents = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('community/events/', {
        headers: { Authorization: `Token ${token}` }
      });

      if (response.data.success) {
        setEvents({
          organized: response.data.organized_events,
          invited: response.data.invited_events,
          public: response.data.public_events
        });
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!newEvent.title.trim()) errors.title = 'Title is required';
    if (!newEvent.description.trim()) errors.description = 'Description is required';
    if (!newEvent.event_date) errors.event_date = 'Date and time is required';
    if (!newEvent.location.trim()) errors.location = 'Location is required';
    if (newEvent.max_attendees && newEvent.max_attendees < 1) {
      errors.max_attendees = 'Max attendees must be at least 1';
    }
    return errors;
  };

  const createEvent = async () => {
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setCreating(true);
    setFormErrors({});
    
    try {
      const token = localStorage.getItem('token');
      // Ensure the datetime is sent in the correct format
      const eventData = {
        ...newEvent,
        event_date: newEvent.event_date, // Keep the datetime-local format
        max_attendees: newEvent.max_attendees ? parseInt(newEvent.max_attendees) : null
      };
      
      console.log('Creating event with data:', eventData);
      console.log('Event date value:', newEvent.event_date);
      
      let response;
      if (editingEvent) {
        // Update existing event
        response = await axios.put(`community/events/${editingEvent.id}/`, eventData, {
          headers: { 
            Authorization: `Token ${token}`,
            'Content-Type': 'application/json'
          }
        });
      } else {
        // Create new event
        response = await axios.post('community/events/', eventData, {
          headers: { 
            Authorization: `Token ${token}`,
            'Content-Type': 'application/json'
          }
        });
      }

      if (response.data.success) {
        alert(editingEvent ? 'Event updated successfully!' : 'Event created successfully!');
        setShowCreateForm(false);
        setEditingEvent(null);
        setNewEvent({
          title: '',
          description: '',
          event_type: 'gathering',
          event_date: '',
          location: '',
          max_attendees: '',
          is_public: false,
          visible_to_all: false
        });
        fetchEvents();
      } else {
        alert(response.data.message || `Failed to ${editingEvent ? 'update' : 'create'} event`);
      }
    } catch (error) {
      console.error(`Error ${editingEvent ? 'updating' : 'creating'} event:`, error);
      if (error.response?.data?.message) {
        alert(error.response.data.message);
      } else if (error.response?.data?.errors) {
        setFormErrors(error.response.data.errors);
      } else {
        alert(`Failed to ${editingEvent ? 'update' : 'create'} event. Please check your connection and try again.`);
      }
    } finally {
      setCreating(false);
    }
  };

  const editEvent = (event) => {
    setEditingEvent(event);
    // Format datetime for datetime-local input (YYYY-MM-DDTHH:mm)
    const eventDate = new Date(event.event_date);
    const year = eventDate.getFullYear();
    const month = String(eventDate.getMonth() + 1).padStart(2, '0');
    const day = String(eventDate.getDate()).padStart(2, '0');
    const hours = String(eventDate.getHours()).padStart(2, '0');
    const minutes = String(eventDate.getMinutes()).padStart(2, '0');
    const formattedDateTime = `${year}-${month}-${day}T${hours}:${minutes}`;
    
    setNewEvent({
      title: event.title,
      description: event.description,
      event_type: event.event_type,
      event_date: formattedDateTime,
      location: event.location,
      max_attendees: event.max_attendees || '',
      is_public: event.is_public,
      visible_to_all: event.visible_to_all || false
    });
    setShowCreateForm(true);
  };

  const deleteEvent = async (eventId) => {
    if (!window.confirm('Are you sure you want to delete this event?')) {
      return;
    }

    setDeleting(eventId);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.delete(`community/events/${eventId}/`, {
        headers: { Authorization: `Token ${token}` }
      });

      if (response.data.success) {
        alert('Event deleted successfully!');
        fetchEvents();
      } else {
        alert('Failed to delete event');
      }
    } catch (error) {
      console.error('Error deleting event:', error);
      alert('Failed to delete event');
    } finally {
      setDeleting(null);
    }
  };

  const handleInviteToEvent = async (event) => {
    setSelectedEvent(event);
    setSelectedInvitees([]);
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`community/events/${event.id}/invitations/`, {
        headers: { Authorization: `Token ${token}` }
      });
      
      if (response.data.success) {
        const existingInviteeIds = response.data.invitations.map(inv => inv.invitee_id);
        const availableConnections = connections.filter(conn => 
          !existingInviteeIds.includes(conn.profile.id)
        );
        setConnections(availableConnections);
      }
    } catch (error) {
      console.error('Error fetching existing invitations:', error);
    }
    
    setShowInviteModal(true);
  };

  const sendInvitations = async () => {
    if (selectedInvitees.length === 0) {
      alert('Please select at least one family to invite.');
      return;
    }

    setInviting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('community/events/invitations/', {
        event_id: selectedEvent.id,
        invitee_ids: selectedInvitees
      }, {
        headers: { Authorization: `Token ${token}` }
      });

      if (response.data.success) {
        alert(`Invitations sent to ${selectedInvitees.length} families!`);
        setShowInviteModal(false);
        setSelectedEvent(null);
        setSelectedInvitees([]);
        fetchConnections();
      } else {
        alert(response.data.message || 'Failed to send invitations');
      }
    } catch (error) {
      console.error('Error sending invitations:', error);
      alert('Failed to send invitations. Please try again.');
    } finally {
      setInviting(false);
    }
  };

  const disinviteFamily = async (invitationId) => {
    if (!window.confirm('Are you sure you want to remove this invitation?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.delete(`community/events/invitations/${invitationId}/`, {
        headers: { Authorization: `Token ${token}` }
      });

      if (response.data.success) {
        alert('Invitation removed successfully!');
        fetchCurrentInvitations(selectedEvent.id);
        fetchEvents();
      } else {
        alert('Failed to remove invitation');
      }
    } catch (error) {
      console.error('Error removing invitation:', error);
      alert('Failed to remove invitation');
    }
  };

  const handleManageInvitations = async (event) => {
    setSelectedEvent(event);
    await fetchCurrentInvitations(event.id);
    setShowManageModal(true);
  };

  const fetchCurrentInvitations = async (eventId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`community/events/${eventId}/invitations/`, {
        headers: { Authorization: `Token ${token}` }
      });
      
      if (response.data.success) {
        setCurrentInvitations(response.data.invitations);
      }
    } catch (error) {
      console.error('Error fetching invitations:', error);
    }
  };

  const respondToInvitation = async (invitationId, response) => {
    try {
      const token = localStorage.getItem('token');
      const result = await axios.post(`community/events/invitations/${invitationId}/respond/`, {
        response: response
      }, {
        headers: { Authorization: `Token ${token}` }
      });

      if (result.data.success) {
        alert(result.data.message);
        fetchEvents();
      }
    } catch (error) {
      console.error('Error responding to invitation:', error);
      alert('Failed to respond to invitation. Please try again.');
    }
  };

  const getEventTypeIcon = (type) => {
    const icons = {
      festival: '🎉',
      birthday: '🎂',
      wedding: '💒',
      gathering: '👨‍👩‍👧‍👦',
      picnic: '🧺',
      religious: '🙏',
      cultural: '🎭',
      other: '📅'
    };
    return icons[type] || '📅';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'accepted': return '#4caf50';
      case 'declined': return '#f44336';
      case 'maybe': return '#ff9800';
      case 'pending': return '#2196f3';
      default: return '#666';
    }
  };

  if (loading) {
    return (
      <Layout title={t('events') || 'Events'}>
        <LanguageToggle />
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '400px',
          fontSize: '1.2rem',
          color: '#666'
        }}>{t('loadingEvents') || 'Loading events...'}</div>
      </Layout>
    );
  }

  return (
    <Layout title={`📅 ${t('familyEvents') || 'Family Events'}`}>
      <LanguageToggle />
      {/* Create Event Button */}
      <div style={{
        display: 'flex',
        justifyContent: 'flex-end',
        marginBottom: '25px'
      }}>
        <button
          onClick={() => {
            setEditingEvent(null);
            setNewEvent({
              title: '',
              description: '',
              event_type: 'gathering',
              event_date: '',
              location: '',
              max_attendees: '',
              is_public: false,
              visible_to_all: false
            });
            setShowCreateForm(true);
          }}
          style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '25px',
            padding: '12px 24px',
            fontSize: '1rem',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)'
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'translateY(-2px)';
            e.target.style.boxShadow = '0 8px 25px rgba(102, 126, 234, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.3)';
          }}
        >
          + {t('createEvent') || 'Create Event'}
        </button>
      </div>

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
          gap: '15px',
          justifyContent: 'center'
        }}>
          {[
            { key: 'invited', label: t('invitations') || 'Invitations', count: events.invited.length, icon: '📨' },
            { key: 'organized', label: t('myEvents') || 'My Events', count: events.organized.length, icon: '📋' },
            { key: 'public', label: t('communityEvents') || 'Community Events', count: events.public.length, icon: '🌟' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                background: activeTab === tab.key 
                  ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
                  : 'rgba(255, 255, 255, 0.8)',
                color: activeTab === tab.key ? '#fff' : '#64748b',
                border: activeTab === tab.key ? 'none' : '1px solid rgba(255, 255, 255, 0.3)',
                padding: '15px 25px',
                borderRadius: '20px',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
              onMouseEnter={(e) => {
                if (activeTab !== tab.key) {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.1)';
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== tab.key) {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = 'none';
                }
              }}
            >
              <span>{tab.icon}</span>
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>
      </div>

      {/* Events List */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.95) 100%)',
        backdropFilter: 'blur(20px)',
        borderRadius: '25px',
        padding: '35px',
        boxShadow: '0 15px 35px rgba(0, 0, 0, 0.08)',
        border: '1px solid rgba(255, 255, 255, 0.3)'
      }}>
        {events[activeTab].length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '80px 20px',
            background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
            borderRadius: '20px',
            border: '2px dashed #dee2e6'
          }}>
            <div style={{ fontSize: '5rem', marginBottom: '25px' }}>
              {activeTab === 'invited' ? '📨' : activeTab === 'organized' ? '📋' : '🌟'}
            </div>
            <h3 style={{ 
              fontSize: '1.5rem', 
              marginBottom: '15px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              {activeTab === 'invited' ? (t('noInvitations') || 'No invitations') : 
               activeTab === 'organized' ? (t('noEventsCreated') || 'No events created') : 
               (t('noCommunityEvents') || 'No community events')}
            </h3>
            <p style={{ fontSize: '1.1rem', color: '#64748b' }}>
              {activeTab === 'invited' ? (t('eventInvitationsAppear') || 'Event invitations will appear here.') :
               activeTab === 'organized' ? (t('createFirstEvent') || 'Create your first family event!') :
               (t('noPublicEvents') || 'No public events from connected families.')}
            </p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '20px'
          }} className="events-grid">
            {events[activeTab].map((event) => (
              <div key={event.id} style={{
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 252, 0.9) 100%)',
                borderRadius: '20px',
                padding: '25px',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                transition: 'all 0.4s ease',
                cursor: 'pointer',
                position: 'relative',
                overflow: 'hidden'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-8px) scale(1.02)';
                e.target.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0) scale(1)';
                e.target.style.boxShadow = 'none';
              }}>
                <div style={{
                  position: 'absolute',
                  top: '-10px',
                  right: '-10px',
                  width: '60px',
                  height: '60px',
                  background: 'linear-gradient(135deg, #667eea20, #764ba220)',
                  borderRadius: '50%'
                }} />
                
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '15px',
                  marginBottom: '20px',
                  position: 'relative',
                  zIndex: 1
                }}>
                  <div style={{
                    fontSize: '3rem',
                    lineHeight: 1
                  }}>
                    {getEventTypeIcon(event.event_type)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <h4 style={{
                      fontSize: '1.4rem',
                      fontWeight: '700',
                      color: '#2c3e50',
                      margin: '0 0 10px 0'
                    }}>
                      {event.title}
                    </h4>
                    <div style={{
                      fontSize: '1rem',
                      color: '#64748b',
                      marginBottom: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <span>📍</span> {event.location}
                    </div>
                    <div style={{
                      fontSize: '1rem',
                      color: '#64748b',
                      marginBottom: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <span>🗓️</span> {(() => {
                        // Parse datetime string directly without timezone conversion
                        const dateTimeStr = event.event_date;
                        const [datePart, timePart] = dateTimeStr.split('T');
                        const [year, month, day] = datePart.split('-');
                        const [hours, minutes] = timePart ? timePart.split(':') : ['00', '00'];
                        
                        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                        const monthName = monthNames[parseInt(month) - 1];
                        
                        const hour12 = parseInt(hours) === 0 ? 12 : parseInt(hours) > 12 ? parseInt(hours) - 12 : parseInt(hours);
                        const ampm = parseInt(hours) >= 12 ? 'PM' : 'AM';
                        
                        return `${monthName} ${parseInt(day)}, ${year} at ${hour12}:${minutes} ${ampm}`;
                      })()}
                    </div>
                    <div style={{
                      fontSize: '0.9rem',
                      color: '#94a3b8'
                    }}>
                      Organized by {event.organizer.surname} {event.organizer.name}
                    </div>
                  </div>
                </div>

                <div style={{
                  background: 'rgba(102, 126, 234, 0.1)',
                  borderRadius: '15px',
                  padding: '20px',
                  marginBottom: '20px',
                  fontSize: '1rem',
                  color: '#2c3e50',
                  lineHeight: '1.5',
                  position: 'relative',
                  zIndex: 1
                }}>
                  {event.description}
                </div>

                <div style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  alignItems: 'center',
                  marginBottom: '15px',
                  position: 'relative',
                  zIndex: 1
                }}>
                  <div style={{
                    padding: '6px 12px',
                    borderRadius: '15px',
                    background: event.visible_to_all ? 'rgba(33, 150, 243, 0.2)' : event.is_public ? 'rgba(76, 175, 80, 0.2)' : 'rgba(255, 152, 0, 0.2)',
                    color: event.visible_to_all ? '#2196f3' : event.is_public ? '#4caf50' : '#ff9800',
                    fontSize: '0.8rem',
                    fontWeight: '600'
                  }}>
                    {event.visible_to_all ? '🌍 All Users' : event.is_public ? '🌍 Public' : '👥 Private'}
                  </div>
                </div>

                {/* Action buttons */}
                <div style={{
                  display: 'flex',
                  gap: '10px',
                  justifyContent: 'center',
                  position: 'relative',
                  zIndex: 1
                }}>
                  {activeTab === 'invited' && event.invitations && event.invitations.length > 0 && (
                    event.invitations[0].status === 'pending' ? (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            respondToInvitation(event.invitations[0].id, 'accepted');
                          }}
                          style={{
                            background: 'linear-gradient(135deg, #4caf50 0%, #45a049 100%)',
                            color: 'white',
                            border: 'none',
                            padding: '8px 16px',
                            borderRadius: '20px',
                            fontSize: '0.85rem',
                            fontWeight: '600',
                            cursor: 'pointer'
                          }}
                        >
                          ✅ {t('accept') || 'Accept'}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            respondToInvitation(event.invitations[0].id, 'maybe');
                          }}
                          style={{
                            background: 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)',
                            color: 'white',
                            border: 'none',
                            padding: '8px 16px',
                            borderRadius: '20px',
                            fontSize: '0.85rem',
                            fontWeight: '600',
                            cursor: 'pointer'
                          }}
                        >
                          🤔 {t('maybe') || 'Maybe'}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            respondToInvitation(event.invitations[0].id, 'declined');
                          }}
                          style={{
                            background: 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)',
                            color: 'white',
                            border: 'none',
                            padding: '8px 16px',
                            borderRadius: '20px',
                            fontSize: '0.85rem',
                            fontWeight: '600',
                            cursor: 'pointer'
                          }}
                        >
                          ❌ {t('decline') || 'Decline'}
                        </button>
                      </>
                    ) : (
                      <div style={{
                        padding: '8px 16px',
                        borderRadius: '20px',
                        background: getStatusColor(event.invitations[0].status),
                        color: 'white',
                        fontSize: '0.85rem',
                        fontWeight: '600'
                      }}>
                        {event.invitations[0].status.charAt(0).toUpperCase() + event.invitations[0].status.slice(1)}
                      </div>
                    )
                  )}

                  {activeTab === 'organized' && (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          editEvent(event);
                        }}
                        style={{
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          color: 'white',
                          border: 'none',
                          padding: '8px 16px',
                          borderRadius: '20px',
                          fontSize: '0.85rem',
                          fontWeight: '600',
                          cursor: 'pointer'
                        }}
                      >
                        ✏️ {t('edit') || 'Edit'}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleInviteToEvent(event);
                        }}
                        style={{
                          background: 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)',
                          color: 'white',
                          border: 'none',
                          padding: '8px 16px',
                          borderRadius: '20px',
                          fontSize: '0.85rem',
                          fontWeight: '600',
                          cursor: 'pointer'
                        }}
                      >
                        📧 {t('invite') || 'Invite'}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleManageInvitations(event);
                        }}
                        style={{
                          background: 'linear-gradient(135deg, #9c27b0 0%, #7b1fa2 100%)',
                          color: 'white',
                          border: 'none',
                          padding: '8px 16px',
                          borderRadius: '20px',
                          fontSize: '0.85rem',
                          fontWeight: '600',
                          cursor: 'pointer'
                        }}
                      >
                        👥 {t('manage') || 'Manage'}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteEvent(event.id);
                        }}
                        disabled={deleting === event.id}
                        style={{
                          background: deleting === event.id 
                            ? 'rgba(244, 67, 54, 0.3)' 
                            : 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)',
                          color: 'white',
                          border: 'none',
                          padding: '8px 16px',
                          borderRadius: '20px',
                          fontSize: '0.85rem',
                          fontWeight: '600',
                          cursor: deleting === event.id ? 'not-allowed' : 'pointer'
                        }}
                      >
                        {deleting === event.id ? '⏳ Deleting...' : `🗑️ ${t('delete') || 'Delete'}`}
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Event Modal */}
      {showCreateForm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '25px',
            padding: '35px',
            width: '90%',
            maxWidth: '500px',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <h3 style={{
              fontSize: '1.8rem',
              fontWeight: '800',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginBottom: '25px',
              textAlign: 'center'
            }}>
              {editingEvent ? 'Edit Event' : 'Create New Event'}
            </h3>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#2c3e50' }}>
                Event Title *
              </label>
              <input
                type="text"
                value={newEvent.title}
                onChange={(e) => {
                  setNewEvent({...newEvent, title: e.target.value});
                  if (formErrors.title) setFormErrors({...formErrors, title: ''});
                }}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '15px',
                  border: formErrors.title ? '2px solid #f44336' : '2px solid rgba(102, 126, 234, 0.2)',
                  fontSize: '1rem',
                  outline: 'none',
                  transition: 'all 0.3s ease'
                }}
                placeholder="Enter event title"
                onFocus={(e) => e.target.style.borderColor = '#667eea'}
                onBlur={(e) => e.target.style.borderColor = formErrors.title ? '#f44336' : 'rgba(102, 126, 234, 0.2)'}
              />
              {formErrors.title && (
                <div style={{ color: '#f44336', fontSize: '0.85rem', marginTop: '5px' }}>
                  {formErrors.title}
                </div>
              )}
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#2c3e50' }}>
                Description *
              </label>
              <textarea
                value={newEvent.description}
                onChange={(e) => {
                  setNewEvent({...newEvent, description: e.target.value});
                  if (formErrors.description) setFormErrors({...formErrors, description: ''});
                }}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '15px',
                  border: formErrors.description ? '2px solid #f44336' : '2px solid rgba(102, 126, 234, 0.2)',
                  fontSize: '1rem',
                  minHeight: '100px',
                  outline: 'none',
                  resize: 'vertical',
                  transition: 'all 0.3s ease'
                }}
                placeholder="Describe your event"
                onFocus={(e) => e.target.style.borderColor = '#667eea'}
                onBlur={(e) => e.target.style.borderColor = formErrors.description ? '#f44336' : 'rgba(102, 126, 234, 0.2)'}
              />
              {formErrors.description && (
                <div style={{ color: '#f44336', fontSize: '0.85rem', marginTop: '5px' }}>
                  {formErrors.description}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#2c3e50' }}>
                  Event Type
                </label>
                <select
                  value={newEvent.event_type}
                  onChange={(e) => setNewEvent({...newEvent, event_type: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '15px',
                    border: '2px solid rgba(102, 126, 234, 0.2)',
                    fontSize: '1rem',
                    outline: 'none'
                  }}
                >
                  <option value="gathering">Family Gathering</option>
                  <option value="festival">Festival</option>
                  <option value="birthday">Birthday</option>
                  <option value="wedding">Wedding</option>
                  <option value="picnic">Picnic</option>
                  <option value="religious">Religious Event</option>
                  <option value="cultural">Cultural Event</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#2c3e50' }}>
                  Max Attendees
                </label>
                <input
                  type="number"
                  min="1"
                  value={newEvent.max_attendees}
                  onChange={(e) => {
                    setNewEvent({...newEvent, max_attendees: e.target.value});
                    if (formErrors.max_attendees) setFormErrors({...formErrors, max_attendees: ''});
                  }}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '15px',
                    border: formErrors.max_attendees ? '2px solid #f44336' : '2px solid rgba(102, 126, 234, 0.2)',
                    fontSize: '1rem',
                    outline: 'none'
                  }}
                  placeholder="Optional"
                />
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#2c3e50' }}>
                Date & Time *
              </label>
              <input
                type="datetime-local"
                value={newEvent.event_date}
                min={new Date().toISOString().slice(0, 16)}
                onChange={(e) => {
                  console.log('DateTime input changed:', e.target.value);
                  setNewEvent({...newEvent, event_date: e.target.value});
                  if (formErrors.event_date) setFormErrors({...formErrors, event_date: ''});
                }}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '15px',
                  border: formErrors.event_date ? '2px solid #f44336' : '2px solid rgba(102, 126, 234, 0.2)',
                  fontSize: '1rem',
                  outline: 'none'
                }}
              />
              {formErrors.event_date && (
                <div style={{ color: '#f44336', fontSize: '0.85rem', marginTop: '5px' }}>
                  {formErrors.event_date}
                </div>
              )}
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#2c3e50' }}>
                Location *
              </label>
              <input
                type="text"
                value={newEvent.location}
                onChange={(e) => {
                  setNewEvent({...newEvent, location: e.target.value});
                  if (formErrors.location) setFormErrors({...formErrors, location: ''});
                }}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '15px',
                  border: formErrors.location ? '2px solid #f44336' : '2px solid rgba(102, 126, 234, 0.2)',
                  fontSize: '1rem',
                  outline: 'none'
                }}
                placeholder="Event location"
              />
            </div>

            <div style={{ marginBottom: '25px' }}>
              <label style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '12px', 
                fontWeight: '600',
                color: '#2c3e50',
                cursor: 'pointer'
              }}>
                <input
                  type="checkbox"
                  checked={newEvent.visible_to_all}
                  onChange={(e) => setNewEvent({...newEvent, visible_to_all: e.target.checked})}
                  style={{ width: '18px', height: '18px' }}
                />
                🌍 Make this event visible to ALL users in the system
              </label>
              {newEvent.visible_to_all && (
                <div style={{
                  marginTop: '8px',
                  padding: '10px',
                  background: 'rgba(255, 193, 7, 0.1)',
                  borderRadius: '8px',
                  fontSize: '0.9rem',
                  color: '#856404'
                }}>
                  ⚠️ This event will be visible to every user in the system, not just your connections.
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
              <button
                onClick={() => setShowCreateForm(false)}
                style={{
                  background: 'rgba(255, 255, 255, 0.8)',
                  color: '#64748b',
                  border: '2px solid rgba(102, 126, 234, 0.2)',
                  padding: '12px 24px',
                  borderRadius: '25px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
              >
                Cancel
              </button>
              <button
                onClick={createEvent}
                disabled={creating || !newEvent.title || !newEvent.description || !newEvent.event_date || !newEvent.location}
                style={{
                  background: (creating || !newEvent.title || !newEvent.description || !newEvent.event_date || !newEvent.location)
                    ? 'rgba(102, 126, 234, 0.3)'
                    : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '25px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: (creating || !newEvent.title || !newEvent.description || !newEvent.event_date || !newEvent.location) ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.3s ease'
                }}
              >
                {creating ? (editingEvent ? 'Updating...' : 'Creating...') : (editingEvent ? 'Update Event' : 'Create Event')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && selectedEvent && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '25px',
            padding: '35px',
            width: '90%',
            maxWidth: '500px',
            maxHeight: '80vh',
            overflowY: 'auto'
          }}>
            <h3 style={{
              fontSize: '1.8rem',
              fontWeight: '800',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginBottom: '10px',
              textAlign: 'center'
            }}>
              📧 Invite Families
            </h3>
            <p style={{
              textAlign: 'center',
              color: '#64748b',
              marginBottom: '25px',
              fontSize: '1rem'
            }}>
              {selectedEvent.title}
            </p>

            {connections.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '60px 20px',
                background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
                borderRadius: '20px',
                border: '2px dashed #dee2e6'
              }}>
                <div style={{ fontSize: '4rem', marginBottom: '20px' }}>👥</div>
                <h4 style={{ color: '#64748b', marginBottom: '10px' }}>No Connected Families</h4>
                <p style={{ color: '#94a3b8' }}>Connect with families to invite them to events</p>
              </div>
            ) : (
              <>
                <div style={{
                  marginBottom: '25px',
                  maxHeight: '300px',
                  overflowY: 'auto'
                }}>
                  {connections.map((connection) => (
                    <label key={connection.id} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '15px',
                      padding: '15px',
                      borderRadius: '15px',
                      border: '1px solid rgba(255, 255, 255, 0.3)',
                      marginBottom: '12px',
                      cursor: 'pointer',
                      background: selectedInvitees.includes(connection.profile.id) ? 'rgba(102, 126, 234, 0.1)' : 'rgba(255, 255, 255, 0.8)',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (!selectedInvitees.includes(connection.profile.id)) {
                        e.target.style.background = 'rgba(102, 126, 234, 0.05)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!selectedInvitees.includes(connection.profile.id)) {
                        e.target.style.background = 'rgba(255, 255, 255, 0.8)';
                      }
                    }}>
                      <input
                        type="checkbox"
                        checked={selectedInvitees.includes(connection.profile.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedInvitees([...selectedInvitees, connection.profile.id]);
                          } else {
                            setSelectedInvitees(selectedInvitees.filter(id => id !== connection.profile.id));
                          }
                        }}
                        style={{
                          width: '20px',
                          height: '20px',
                          cursor: 'pointer'
                        }}
                      />
                      <div style={{
                        width: '50px',
                        height: '50px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.3rem',
                        color: '#fff',
                        fontWeight: 'bold'
                      }}>
                        {connection.profile.name[0]?.toUpperCase() || 'F'}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{
                          fontSize: '1.1rem',
                          fontWeight: '600',
                          color: '#2c3e50'
                        }}>
                          {connection.profile.name}
                        </div>
                        {connection.profile.city && (
                          <div style={{
                            fontSize: '0.9rem',
                            color: '#64748b'
                          }}>
                            📍 {connection.profile.city}
                          </div>
                        )}
                      </div>
                    </label>
                  ))}
                </div>

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '25px',
                  padding: '15px',
                  background: 'rgba(102, 126, 234, 0.1)',
                  borderRadius: '15px'
                }}>
                  <span style={{ fontSize: '1rem', color: '#667eea', fontWeight: '600' }}>
                    {selectedInvitees.length} families selected
                  </span>
                  <button
                    onClick={() => {
                      if (selectedInvitees.length === connections.length) {
                        setSelectedInvitees([]);
                      } else {
                        setSelectedInvitees(connections.map(c => c.profile.id));
                      }
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#667eea',
                      fontSize: '0.9rem',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    {selectedInvitees.length === connections.length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>
              </>
            )}

            <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
              <button
                onClick={() => setShowInviteModal(false)}
                style={{
                  background: 'rgba(255, 255, 255, 0.8)',
                  color: '#64748b',
                  border: '2px solid rgba(102, 126, 234, 0.2)',
                  padding: '12px 24px',
                  borderRadius: '25px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={sendInvitations}
                disabled={inviting || selectedInvitees.length === 0}
                style={{
                  background: (inviting || selectedInvitees.length === 0)
                    ? 'rgba(102, 126, 234, 0.3)'
                    : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '25px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: (inviting || selectedInvitees.length === 0) ? 'not-allowed' : 'pointer'
                }}
              >
                {inviting ? '📧 Sending...' : `📧 Send Invitations (${selectedInvitees.length})`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manage Invitations Modal */}
      {showManageModal && selectedEvent && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '25px',
            padding: '35px',
            width: '90%',
            maxWidth: '500px',
            maxHeight: '80vh',
            overflowY: 'auto'
          }}>
            <h3 style={{
              fontSize: '1.8rem',
              fontWeight: '800',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginBottom: '10px',
              textAlign: 'center'
            }}>
              👥 Manage Invitations
            </h3>
            <p style={{
              textAlign: 'center',
              color: '#64748b',
              marginBottom: '25px',
              fontSize: '1rem'
            }}>
              {selectedEvent.title}
            </p>

            {currentInvitations.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '60px 20px',
                background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
                borderRadius: '20px',
                border: '2px dashed #dee2e6'
              }}>
                <div style={{ fontSize: '4rem', marginBottom: '20px' }}>📨</div>
                <h4 style={{ color: '#64748b', marginBottom: '10px' }}>No Invitations Sent</h4>
                <p style={{ color: '#94a3b8' }}>No families have been invited to this event yet</p>
              </div>
            ) : (
              <div style={{
                marginBottom: '25px',
                maxHeight: '300px',
                overflowY: 'auto'
              }}>
                {currentInvitations.map((invitation) => (
                  <div key={invitation.id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '15px',
                    borderRadius: '15px',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    marginBottom: '12px',
                    background: 'rgba(255, 255, 255, 0.8)'
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontSize: '1.1rem',
                        fontWeight: '600',
                        color: '#2c3e50'
                      }}>
                        {invitation.invitee_name}
                      </div>
                      <div style={{
                        fontSize: '0.9rem',
                        color: '#64748b',
                        textTransform: 'capitalize'
                      }}>
                        Status: {invitation.status}
                      </div>
                    </div>
                    <button
                      onClick={() => disinviteFamily(invitation.id)}
                      style={{
                        background: 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)',
                        color: 'white',
                        border: 'none',
                        padding: '8px 16px',
                        borderRadius: '15px',
                        fontSize: '0.85rem',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
                      🚫 Remove
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <button
                onClick={() => setShowManageModal(false)}
                style={{
                  background: 'rgba(255, 255, 255, 0.8)',
                  color: '#64748b',
                  border: '2px solid rgba(102, 126, 234, 0.2)',
                  padding: '12px 24px',
                  borderRadius: '25px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Events;