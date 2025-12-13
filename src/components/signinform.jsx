// src/components/SigninForm.jsx
import React, { useState } from 'react';
import axios from '../axiosConfig';
import { useNavigate } from 'react-router-dom';
import './AuthForms.css';

const SigninForm = () => {
  // Step management
  const [currentStep, setCurrentStep] = useState(0); // 0: Login Type, 1: Mobile, 2: OTP, 3: Password
  const [loginType, setLoginType] = useState(''); // 'user' or 'admin'
  const [isForgotPassword, setIsForgotPassword] = useState(false); // Track forgot password mode
  
  // Form data
  const [mobileNumber, setMobileNumber] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [otpCode, setOtpCode] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  
  // State management
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [showCheck, setShowCheck] = useState(false);
  const [ripples, setRipples] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGujarati, setIsGujarati] = useState(false);
  
  const navigate = useNavigate();

  // Translation object
  const translations = {
    en: {
      userLogin: 'User Login',
      signUp: 'New User Login',
      otherLogin: 'Other Login',
      adminLogin: 'Admin Login',
      selectLoginType: 'Select Login Type'
    },
    gu: {
      userLogin: 'યુઝર લોગિન',
      signUp: 'નવા યુઝર લોગિન',
      otherLogin: 'અન્ય લોગિન',
      adminLogin: 'એડમિન લોગિન',
      selectLoginType: 'લોગિન પ્રકાર પસંદ કરો'
    }
  };

  const t = (key) => translations[isGujarati ? 'gu' : 'en'][key] || key;

  // Country code options
  const countryOptions = [
    { code: '+91', label: 'India', digits: 10 },
    { code: '+1', label: 'USA', digits: 10 },
    { code: '+44', label: 'UK', digits: 10 },
    { code: '+61', label: 'Australia', digits: 9 },
    { code: '+81', label: 'Japan', digits: 10 },
    { code: '+49', label: 'Germany', digits: 11 },
    { code: '+86', label: 'China', digits: 11 },
    { code: '+971', label: 'UAE', digits: 9 },
    { code: '+7', label: 'Russia', digits: 10 },
    { code: '+33', label: 'France', digits: 9 },
  ];

  // Check if mobile number is valid (10 digits for India, etc.)
  const isMobileValid = () => {
    const digits = mobileNumber.replace(/\D/g, '');
    const selectedCountry = countryOptions.find(opt => opt.code === countryCode);
    return digits.length === selectedCountry.digits;
  };

  // Handle mobile number change
  const handleMobileChange = (e) => {
    const value = e.target.value.replace(/\D/g, ''); // Only allow digits
    setMobileNumber(value);
    setError('');
    setMessage('');
  };

  // Handle country code change
  const handleCountryChange = (e) => {
    setCountryCode(e.target.value);
    setError('');
    setMessage('');
  };

  // Send OTP (for both login and forgot password)
  const handleSendOtp = async () => {
    if (!isMobileValid()) {
      setError('Please enter a valid mobile number');
      return;
    }

    setIsLoading(true);
    setError('');
    
    try {
      const fullMobile = countryCode + mobileNumber;
      
      // Check if admin login with fixed number
      if (loginType === 'admin' && mobileNumber !== '9876543210') {
        setError('Invalid admin mobile number');
        setIsLoading(false);
        return;
      }
      
      const endpoint = isForgotPassword ? 'forgot-password/' : 'send-otp/';
      const requestData = { mobile: fullMobile };
      if (!isForgotPassword) {
        requestData.type = 'login';
      }
      const response = await axios.post(endpoint, requestData);
      console.log('OTP response:', response.data);
      setOtpSent(true);
      setCurrentStep(2);
      setMessage(isForgotPassword ? 'Password reset OTP sent!' : 'OTP sent successfully!');
    } catch (err) {
      console.error('Send OTP error:', err.response?.data || err.message);
      setError(err.response?.data?.error || 'Failed to send OTP');
    } finally {
      setIsLoading(false);
    }
  };

  // Verify OTP (for both login and forgot password)
  const handleVerifyOtp = async () => {
    if (!otpCode) {
      setError('Please enter OTP');
      return;
    }

    setIsLoading(true);
    setError('');
    
    try {
      const fullMobile = countryCode + mobileNumber;
      const response = await axios.post('verify-otp/', { 
        mobile: fullMobile, 
        otp: otpCode 
      });
      console.log('Verify OTP response:', response.data);
      setOtpVerified(true);
      setCurrentStep(3);
      setMessage(isForgotPassword ? 'OTP verified! Please enter your new password.' : 'OTP verified! Please enter your password.');
    } catch (err) {
      console.error('Verify OTP error:', err.response?.data || err.message);
      setError(err.response?.data?.error || 'Invalid OTP');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle password change
  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    setError('');
  };

  // Handle new password change (for forgot password)
  const handleNewPasswordChange = (e) => {
    setNewPassword(e.target.value);
    setError('');
  };

  // Handle OTP change
  const handleOtpChange = (e) => {
    const value = e.target.value.replace(/\D/g, ''); // Only allow digits
    setOtpCode(value);
    setError('');
  };

  // Final login or password reset
  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (isForgotPassword) {
      // Handle password reset
      if (!newPassword) {
        setError('Please enter your new password');
        return;
      }

      setIsLoading(true);
      setError('');
      
      try {
        const resetMobile = countryCode + mobileNumber;
        const res = await axios.post('reset-password/', {
          mobile: resetMobile,
          otp: otpCode,
          new_password: newPassword
        });
        
        if (res.data.success) {
          setMessage('Password reset successful! You can now login with your new password.');
          setShowCheck(true);
          setTimeout(() => {
            setShowCheck(false);
            // Reset to login mode
            setIsForgotPassword(false);
            setCurrentStep(0);
            setLoginType('');
            setMobileNumber('');
            setOtpCode('');
            setNewPassword('');
            setOtpSent(false);
            setOtpVerified(false);
            setError('');
            setMessage('');
          }, 2000);
        } else {
          setError('Password reset failed');
        }
      } catch (error) {
        console.error('Reset password error:', error.response?.data || error.message);
        setError(error.response?.data?.error || 'Password reset failed');
      } finally {
        setIsLoading(false);
      }
    } else {
      // Handle normal login
      if (!password) {
        setError('Please enter your password');
        return;
      }

      setIsLoading(true);
      setError('');
      
      try {
        const loginMobile = loginType === 'admin' ? mobileNumber : countryCode + mobileNumber;
        const res = await axios.post('login/', {
          mobile: loginMobile,
          password: password,
          login_type: loginType
        });
        
        if (res.data.success && res.data.token) {
          localStorage.setItem('token', res.data.token);
          
          // Store user type and information for access control
          const userInfo = {
            user_type: res.data.user_type || 'main_user',
            login_type: loginType,
            user_id: res.data.user_id,
            family_member_id: res.data.family_member_id,
            family_member_name: res.data.family_member_name
          };
          localStorage.setItem('userInfo', JSON.stringify(userInfo));
          
          setMessage('Login successful');
          setShowCheck(true);
          setTimeout(() => {
            setShowCheck(false);
            navigate(loginType === 'admin' ? '/admin' : '/home');
          }, 1200);
        } else {
          setError('Login failed: Invalid credentials');
        }
      } catch (error) {
        console.error('Login error:', error.response?.data || error.message);
        setError(error.response?.data?.message || 'Login failed: Invalid credentials');
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Reset form
  const handleReset = () => {
    setCurrentStep(currentStep === 1 ? 0 : 1);
    if (currentStep === 1) {
      setLoginType('');
    }
    setMobileNumber('');
    setOtpCode('');
    setPassword('');
    setNewPassword('');
    setOtpSent(false);
    setOtpVerified(false);
    setError('');
    setMessage('');
    if (currentStep === 1) {
      setIsForgotPassword(false);
    }
  };

  // Handle forgot password button click
  const handleForgotPassword = () => {
    setIsForgotPassword(true);
    setCurrentStep(1);
    setMobileNumber('');
    setOtpCode('');
    setPassword('');
    setNewPassword('');
    setOtpSent(false);
    setOtpVerified(false);
    setError('');
    setMessage('');
  };

  const handleButtonClick = e => {
    const button = e.currentTarget;
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;
    const newRipple = { x, y, size, key: Date.now() };
    setRipples(ripples => [...ripples, newRipple]);
    setTimeout(() => {
      setRipples(ripples => ripples.slice(1));
    }, 500);
  };

  // Enhanced confetti generator
  const renderConfetti = () => {
    const colors = ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#00f2fe'];
    return (
      <div className="confetti">
        {Array.from({ length: 25 }).map((_, i) => (
          <div
            key={i}
            className="confetti-piece"
            style={{
              left: `${15 + Math.random() * 70}%`,
              background: colors[i % colors.length],
              animationDelay: `${Math.random() * 0.5}s`,
              transform: `rotate(${Math.random() * 360}deg)`
            }}
          />
        ))}
      </div>
    );
  };

  // Render enhanced step indicator
  const renderStepIndicator = () => (
    <div className="step-indicator">
      {[1, 2, 3].map((step, index) => (
        <React.Fragment key={step}>
          <div className={`step ${
            currentStep > step ? 'completed' : 
            currentStep === step ? 'active' : 'inactive'
          }`}>
            {currentStep > step ? '✓' : step}
          </div>
          {index < 2 && (
            <div className={`step-connector ${
              currentStep > step + 1 ? 'active' : ''
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
              <circle cx="20" cy="28" r="7" />
              <circle cx="44" cy="28" r="7" />
              <circle cx="32" cy="38" r="8" />
              <ellipse cx="20" cy="44" rx="10" ry="4" opacity="0.3"/>
              <ellipse cx="44" cy="44" rx="10" ry="4" opacity="0.3"/>
              <ellipse cx="32" cy="54" rx="14" ry="5" opacity="0.3"/>
            </g>
          </svg>
        </div>
        
        <h2>{isForgotPassword ? 'Reset Password' : (currentStep === 0 ? t('selectLoginType') : (loginType === 'admin' ? t('adminLogin') : t('userLogin')))}</h2>
        
        {currentStep === 0 && (
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <button
              type="button"
              onClick={() => setIsGujarati(!isGujarati)}
              style={{
                padding: '10px 20px',
                borderRadius: '25px',
                border: 'none',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                fontSize: '0.9rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                margin: '0 auto'
              }}
            >
              🌐 {isGujarati ? 'English' : 'ગુજરાતી'}
            </button>
          </div>
        )}
        
        {currentStep > 0 && renderStepIndicator()}
        
        {/* Step 0: Login Type Selection */}
        {currentStep === 0 && (
          <div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '20px' }}>
              <button
                type="button"
                onClick={() => {
                  setLoginType('user');
                  setCurrentStep(1);
                }}
                style={{
                  padding: '15px 25px',
                  borderRadius: '12px',
                  border: '2px solid #4facfe',
                  background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                  color: 'white',
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
              >
                👤 {t('userLogin')}
              </button>
              <button
                type="button"
                onClick={() => navigate('/signup')}
                style={{
                  padding: '15px 25px',
                  borderRadius: '12px',
                  border: '2px solid #38a169',
                  background: 'linear-gradient(135deg, #38a169 0%, #2f855a 100%)',
                  color: 'white',
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
              >
                ✨ {t('signUp')}
              </button>
              <button
                type="button"
                onClick={() => navigate('/mobile-login')}
                style={{
                  padding: '15px 25px',
                  borderRadius: '12px',
                  border: '2px solid #f093fb',
                  background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                  color: 'white',
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
              >
                📱 {t('otherLogin')}
              </button>
              <button
                type="button"
                onClick={() => {
                  setLoginType('admin');
                  setCurrentStep(1);
                }}
                style={{
                  padding: '15px 25px',
                  borderRadius: '12px',
                  border: '2px solid #667eea',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
              >
                🔐 {t('adminLogin')}
              </button>
            </div>
          </div>
        )}
        
        {/* Step 1: Mobile Number */}
        {currentStep === 1 && (
          <div>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                color: '#4a5568',
                fontWeight: '600',
                fontSize: '0.95rem'
              }}>
                {isForgotPassword ? 
                  'Enter your registered mobile number' :
                  (loginType === 'admin' ? 'Enter admin mobile number (9876543210)' : 'Enter your mobile number')
                }
              </label>
              <div className="form-field-group">
                {loginType !== 'admin' && (
                  <select
                    value={countryCode}
                    onChange={handleCountryChange}
                  >
                    {countryOptions.map(opt => (
                      <option key={opt.code} value={opt.code}>
                        {opt.label} ({opt.code})
                      </option>
                    ))}
                  </select>
                )}
                <input
                  type="text"
                  placeholder={loginType === 'admin' ? '9876543210' : 'Mobile Number'}
                  value={mobileNumber}
                  onChange={handleMobileChange}
                  maxLength={10}
                />
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                type="button"
                onClick={handleReset}
                className="login-redirect-btn"
                style={{ flex: 1 }}
              >
                Back
              </button>
              <button
                type="button"
                onClick={(e) => { 
                  if (loginType === 'admin') {
                    setCurrentStep(3); // Skip OTP for admin
                  } else {
                    handleSendOtp(); 
                  }
                  handleButtonClick(e); 
                }}
                disabled={!isMobileValid() || isLoading}
                style={{ flex: 1 }}
              >
                {isLoading && <span className="loading-spinner"></span>}
                {loginType === 'admin' ? 'Next' : 
                  (isLoading ? 
                    'Sending...' : 
                    (isForgotPassword ? 
                      'Send Reset OTP' :
                      'Send OTP'
                    )
                  )
                }
                {ripples.map(r => (
                  <span
                    key={r.key}
                    className="ripple"
                    style={{ left: r.x, top: r.y, width: r.size, height: r.size }}
                  />
                ))}
              </button>
            </div>
          </div>
        )}

        {/* Step 2: OTP Verification */}
        {currentStep === 2 && (
          <div>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                color: '#4a5568',
                fontWeight: '600',
                fontSize: '0.95rem'
              }}>
                {`Enter OTP sent to ${countryCode} ${mobileNumber}`}
              </label>
              <input
                type="text"
                placeholder="Enter 6-digit OTP"
                value={otpCode}
                onChange={handleOtpChange}
                maxLength={6}
                style={{
                  textAlign: 'center',
                  letterSpacing: '3px',
                  fontSize: '1.2rem',
                  fontWeight: '600'
                }}
              />
            </div>
            
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                type="button"
                onClick={handleReset}
                className="login-redirect-btn"
                style={{ flex: 1 }}
              >
                Back
              </button>
              <button
                type="button"
                onClick={(e) => { handleVerifyOtp(); handleButtonClick(e); }}
                disabled={otpCode.length !== 6 || isLoading}
                style={{ flex: 1 }}
              >
                {isLoading && <span className="loading-spinner"></span>}
                {isLoading ? 
                  'Verifying...' :
                  'Verify OTP'
                }
                {ripples.map(r => (
                  <span
                    key={r.key}
                    className="ripple"
                    style={{ left: r.x, top: r.y, width: r.size, height: r.size }}
                  />
                ))}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Password */}
        {currentStep === 3 && (
          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                color: '#4a5568',
                fontWeight: '600',
                fontSize: '0.95rem'
              }}>
                {isForgotPassword ? 
                  'Enter your new password' :
                  'Enter your password'
                }
              </label>
              <input
                type="password"
                placeholder={isForgotPassword ? 
                  'New Password' : 
                  'Password'
                }
                value={isForgotPassword ? newPassword : password}
                onChange={isForgotPassword ? handleNewPasswordChange : handlePasswordChange}
                required
              />
            </div>
            
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                type="button"
                onClick={handleReset}
                className="login-redirect-btn"
                style={{ flex: 1 }}
              >
                Back
              </button>
              <button
                type="submit"
                disabled={(isForgotPassword ? !newPassword : !password) || isLoading}
                onClick={handleButtonClick}
                style={{ flex: 1 }}
              >
                {isLoading && <span className="loading-spinner"></span>}
                {isLoading ? 
                  (isForgotPassword ? 
                    'Resetting...' :
                    'Logging in...'
                  ) :
                  (isForgotPassword ? 
                    'Reset Password' :
                    'Login'
                  )
                }
                {ripples.map(r => (
                  <span
                    key={r.key}
                    className="ripple"
                    style={{ left: r.x, top: r.y, width: r.size, height: r.size }}
                  />
                ))}
              </button>
            </div>
          </form>
        )}

        {/* Signup link and Forgot Password */}
        {!isForgotPassword && loginType === 'user' ? (
          <>
            <button
              type="button"
              className="signup-link-btn"
              onClick={() => navigate('/signup')}
            >
              Don't have an account? Sign up
            </button>

            <button
              type="button"
              className="signup-link-btn"
              onClick={handleForgotPassword}
              style={{ marginTop: '10px', color: '#e53e3e' }}
            >
              Forgot Password?
            </button>
          </>
        ) : isForgotPassword ? (
          <button
            type="button"
            className="signup-link-btn"
            onClick={() => {
              setIsForgotPassword(false);
              setCurrentStep(0);
              setLoginType('');
              setMobileNumber('');
              setOtpCode('');
              setPassword('');
              setNewPassword('');
              setOtpSent(false);
              setOtpVerified(false);
              setError('');
              setMessage('');
            }}
          >
            Back to Login
          </button>
        ) : null}

        {/* Success animation */}
        {showCheck && (
          <>
            <div className="checkmark">
              <svg width="48" height="48" viewBox="0 0 48 48">
                <circle cx="24" cy="24" r="22" fill="#38a169" opacity="0.15"/>
                <polyline points="14,24 20,30 34,16" fill="none" stroke="#38a169" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="success-message">
              {isForgotPassword ? 
                'Password reset successful!' :
                'Login successful! Redirecting...'
              }
            </div>
            {renderConfetti()}
          </>
        )}

        {/* Messages */}
        {message && !showCheck && (
          <p className="success" style={{ textAlign: 'center', marginTop: '10px' }}>{message}</p>
        )}
        {error && !showCheck && (
          <p className="error" style={{ textAlign: 'center', marginTop: '10px' }}>{error}</p>
        )}
      </div>
    </>
  );
};

export default SigninForm;