import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../components/AuthForms.css';

const MobileLogin = () => {
  const [step, setStep] = useState(1);
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleMobileSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await fetch('http://localhost:8000/api/mobile-login-otp/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile })
      });
      const data = await response.json();
      if (data.success) {
        setMessage('OTP sent to your mobile');
        setStep(2);
      } else {
        setError(data.error || 'Mobile number not found');
      }
    } catch (error) {
      setError('Error sending OTP');
    }
    setLoading(false);
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await fetch('http://localhost:8000/api/verify-mobile-otp/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile, otp })
      });
      const data = await response.json();
      if (data.success) {
        setMessage('OTP verified. Set your password');
        setStep(3);
      } else {
        setError('Invalid OTP');
      }
    } catch (error) {
      setError('Error verifying OTP');
    }
    setLoading(false);
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const response = await fetch('http://localhost:8000/api/set-mobile-password/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile, password })
      });
      const data = await response.json();
      if (data.success) {
        localStorage.setItem('token', data.token);
        navigate('/home');
      } else {
        setError(data.error || 'Failed to set password');
      }
    } catch (error) {
      setError('Error setting password');
    }
    setLoading(false);
  };

  const renderStepIndicator = () => (
    <div className="step-indicator">
      {[1, 2, 3].map((stepNum, index) => (
        <React.Fragment key={stepNum}>
          <div className={`step ${
            step > stepNum ? 'completed' : 
            step === stepNum ? 'active' : 'inactive'
          }`}>
            {step > stepNum ? '✓' : stepNum}
          </div>
          {index < 2 && (
            <div className={`step-connector ${
              step > stepNum + 1 ? 'active' : ''
            }`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );

  return (
    <>
      <div className="animated-bg">
        <div className="bg-circle bg-circle1"></div>
        <div className="bg-circle bg-circle2"></div>
        <div className="bg-circle bg-circle3"></div>
        <div className="bg-circle bg-circle4"></div>
      </div>
      
      <div className="auth-form-container">
        <div className="auth-form-icon">
          <svg viewBox="0 0 64 64" fill="none">
            <g>
              <rect x="20" y="12" width="24" height="40" rx="4" stroke="currentColor" strokeWidth="2" fill="none"/>
              <circle cx="32" cy="18" r="2" fill="currentColor"/>
              <rect x="24" y="24" width="16" height="2" fill="currentColor"/>
              <rect x="24" y="28" width="16" height="2" fill="currentColor"/>
              <rect x="24" y="32" width="12" height="2" fill="currentColor"/>
            </g>
          </svg>
        </div>
        
        <h2>Other Login</h2>
        
        {renderStepIndicator()}
        
        {step === 1 && (
          <div>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                color: '#4a5568',
                fontWeight: '600',
                fontSize: '0.95rem'
              }}>
                Enter your mobile number from Excel data
              </label>
              <input
                type="tel"
                placeholder="Mobile Number"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                required
              />
            </div>
            
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                type="button"
                onClick={() => navigate('/signin')}
                className="login-redirect-btn"
                style={{ flex: 1 }}
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleMobileSubmit}
                disabled={!mobile || loading}
                style={{ flex: 1 }}
              >
                {loading && <span className="loading-spinner"></span>}
                {loading ? 'Sending...' : 'Send OTP'}
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                color: '#4a5568',
                fontWeight: '600',
                fontSize: '0.95rem'
              }}>
                Enter OTP sent to {mobile}
              </label>
              <input
                type="text"
                placeholder="Enter 6-digit OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                maxLength={6}
                style={{
                  textAlign: 'center',
                  letterSpacing: '3px',
                  fontSize: '1.2rem',
                  fontWeight: '600'
                }}
                required
              />
            </div>
            
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="login-redirect-btn"
                style={{ flex: 1 }}
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleOtpSubmit}
                disabled={otp.length !== 6 || loading}
                style={{ flex: 1 }}
              >
                {loading && <span className="loading-spinner"></span>}
                {loading ? 'Verifying...' : 'Verify OTP'}
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                color: '#4a5568',
                fontWeight: '600',
                fontSize: '0.95rem'
              }}>
                Set your password
              </label>
              <input
                type="password"
                placeholder="Set Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ marginBottom: '10px' }}
                required
              />
              <input
                type="password"
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                type="button"
                onClick={() => setStep(2)}
                className="login-redirect-btn"
                style={{ flex: 1 }}
              >
                Back
              </button>
              <button
                type="button"
                onClick={handlePasswordSubmit}
                disabled={!password || !confirmPassword || loading}
                style={{ flex: 1 }}
              >
                {loading && <span className="loading-spinner"></span>}
                {loading ? 'Setting...' : 'Set Password & Login'}
              </button>
            </div>
          </div>
        )}

        {message && !error && (
          <p className="success" style={{ textAlign: 'center', marginTop: '10px' }}>{message}</p>
        )}
        {error && (
          <p className="error" style={{ textAlign: 'center', marginTop: '10px' }}>{error}</p>
        )}
      </div>
    </>
  );
};

export default MobileLogin;