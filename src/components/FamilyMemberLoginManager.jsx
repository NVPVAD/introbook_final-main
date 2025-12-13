import React, { useState, useEffect } from 'react';
import axios from '../axiosConfig';
import './FamilyMemberLoginManager.css';

const FamilyMemberLoginManager = () => {
  const [familyMembers, setFamilyMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // State for adding new login access
  const [selectedMember, setSelectedMember] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [availableMembers, setAvailableMembers] = useState([]);
  const [fullAccess, setFullAccess] = useState(false);

  // Fetch family members on component mount
  useEffect(() => {
    fetchFamilyMembers();
    fetchAvailableMembers();
  }, []);

  const fetchFamilyMembers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('family-members/', {
        headers: { Authorization: `Token ${token}` }
      });
      
      if (response.data.success) {
        setFamilyMembers(response.data.family_members);
      } else {
        setError('Failed to fetch family members');
      }
    } catch (error) {
      setError('Error loading family members');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableMembers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('family-members/available/', {
        headers: { Authorization: `Token ${token}` }
      });
      
      if (response.data.success) {
        setAvailableMembers(response.data.available_members);
      }
    } catch (error) {
      console.error('Error fetching available members:', error);
    }
  };

  const handleAddLoginAccess = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!selectedMember || !mobileNumber || !password || !confirmPassword) {
      setError('All fields are required');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    try {
      setError('');
      setSuccess('');
      
      const token = localStorage.getItem('token');
      const response = await axios.post('family-members/register/', {
        family_member_id: selectedMember,
        mobile_number: mobileNumber,
        password: password,
        full_access: fullAccess
      }, {
        headers: { Authorization: `Token ${token}` }
      });

      if (response.status === 201) {
        setSuccess(response.data.message);
        setShowAddForm(false);
        setSelectedMember('');
        setMobileNumber('');
        setPassword('');
        setConfirmPassword('');
        setFullAccess(false);
        fetchFamilyMembers(); // Refresh the list
      }
    } catch (error) {
      if (error.response?.data?.error) {
        setError(error.response.data.error);
      } else {
        setError('Failed to add login access');
      }
    }
  };

  const handleRemoveAccess = async (memberId) => {
    if (!window.confirm('Are you sure you want to remove login access for this family member?')) {
      return;
    }

    try {
      setError('');
      setSuccess('');
      
      const token = localStorage.getItem('token');
      const response = await axios.delete(`family-members/${memberId}/remove-access/`, {
        headers: { Authorization: `Token ${token}` }
      });

      if (response.status === 200) {
        setSuccess('Login access removed successfully');
        fetchFamilyMembers(); // Refresh the list
      }
    } catch (error) {
      setError('Failed to remove login access');
    }
  };

  if (loading) {
    return (
      <div className="family-login-manager">
        <div className="loading">Loading family members...</div>
      </div>
    );
  }

  return (
    <div className="family-login-manager">
      <div className="header-section">
        <h2>Family Member Login Management</h2>
        <p>Manage login access for your family members</p>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {success && (
        <div className="success-message">
          {success}
        </div>
      )}

      <div className="family-members-list">
        <h3>Family Members with Login Access</h3>
        
        {familyMembers.length === 0 ? (
          <div className="no-members">
            <p>No family members have login access yet.</p>
            <p>Add login access to allow family members to view family details.</p>
          </div>
        ) : (
          <div className="members-grid">
            {familyMembers.map((member) => (
              <div key={member.id} className="member-card">
                <div className="member-info">
                  <h4>{member.name}</h4>
                  <p><strong>Mobile:</strong> {member.mobile}</p>
                  <p><strong>Last Login:</strong> {member.last_login ? new Date(member.last_login).toLocaleString() : 'Never'}</p>
                  <p><strong>Status:</strong> 
                    <span className={`status ${member.can_login ? 'active' : 'inactive'}`}>
                      {member.can_login ? 'Active' : 'Inactive'}
                    </span>
                  </p>
                  <p><strong>Access Level:</strong> 
                    <span className={`access-level ${member.full_access ? 'full' : 'limited'}`}>
                      {member.full_access ? 'Full Access' : 'Limited Access'}
                    </span>
                  </p>
                </div>
                <div className="member-actions">
                  <button 
                    className="remove-btn"
                    onClick={() => handleRemoveAccess(member.id)}
                  >
                    Remove Access
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="add-access-section">
        <button 
          className="add-access-btn"
          onClick={() => setShowAddForm(!showAddForm)}
        >
          {showAddForm ? 'Cancel' : '+ Add Login Access'}
        </button>

        {showAddForm && (
          <form className="add-access-form" onSubmit={handleAddLoginAccess}>
            <h3>Add Login Access for Family Member</h3>
        <div className="access-warning">
          <p><strong>Note:</strong> You can choose between limited or full access for family members.</p>
        </div>
            
            <div className="form-group">
              <label>Select Family Member:</label>
              <select 
                value={selectedMember} 
                onChange={(e) => setSelectedMember(e.target.value)}
                required
              >
                <option value="">Choose a family member...</option>
                {availableMembers.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name} ({member.relation})
                  </option>
                ))}
              </select>
              {availableMembers.length === 0 && (
                <p style={{ color: '#666', fontSize: '0.9rem', marginTop: '5px' }}>
                  No family members available for login access. Add family members in the profile section first.
                </p>
              )}
            </div>

            <div className="form-group">
              <label>Mobile Number:</label>
              <input
                type="tel"
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value)}
                placeholder="Enter mobile number"
                required
              />
            </div>

            <div className="form-group">
              <label>Password:</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password (min 6 characters)"
                required
              />
            </div>

            <div className="form-group">
              <label>Confirm Password:</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm password"
                required
              />
            </div>

            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={fullAccess}
                  onChange={(e) => setFullAccess(e.target.checked)}
                  className="access-checkbox"
                />
                <span className="checkmark"></span>
                Grant Full Profile Access
              </label>
              <p className="access-description">
                {fullAccess 
                  ? "✅ Family member will see all profile data including personal details, documents, and full family information."
                  : "⚠️ Family member will have limited access to basic family information only."
                }
              </p>
            </div>

            <div className="form-actions">
              <button type="submit" className="submit-btn">
                Add Login Access
              </button>
              <button 
                type="button" 
                className="cancel-btn"
                onClick={() => setShowAddForm(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      <div className="info-section">
        <h3>Access Levels & Permissions</h3>
        <div className="access-levels">
          <div className="access-card main-user">
            <h4>🔑 Main User (You)</h4>
            <ul>
              <li>View all family member profiles</li>
              <li>Edit family member information</li>
              <li>Manage login access for family members</li>
              <li>Delete family member records</li>
              <li>Full administrative control</li>
            </ul>
          </div>
          
          <div className="access-card family-member">
            <h4>👥 Family Members (Limited Access)</h4>
            <ul>
              <li>View basic family information</li>
              <li>View their own profile details</li>
              <li>Limited read-only access</li>
              <li>Cannot edit or delete any information</li>
              <li>Cannot manage other members' access</li>
            </ul>
          </div>
          
          <div className="access-card family-member-full">
            <h4>👥 Family Members (Full Access)</h4>
            <ul>
              <li>View all profile data and documents</li>
              <li>Access complete family information</li>
              <li>See personal details and history</li>
              <li>Full read-only access to everything</li>
              <li>Cannot edit or delete any information</li>
            </ul>
          </div>
        </div>
        
        <div className="important-notes">
          <h4>📋 Important Notes</h4>
          <ul>
            <li>Each family member needs a unique mobile number for login</li>
            <li>Passwords must be at least 6 characters long</li>
            <li>You can remove login access at any time</li>
            <li>Login activity is tracked for security purposes</li>
            <li>Family members have restricted access for privacy and security</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default FamilyMemberLoginManager; 