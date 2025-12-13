// src/components/SignupForm.jsx
import React, { useState, useEffect } from 'react';
import axios from '../axiosConfig';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../hooks/useTranslation';
import LanguageToggle from './LanguageToggle';
import './AuthForms.css';

const Signup = () => {
  const { t, language } = useTranslation();
  const [form, setForm] = useState({
    surname: '',      // Changed from first_name
    name: '',         // Changed from middle_name
    father_name: '',  // Changed from last_name
    sakh: '',        // Added sakh field
    full_name: '',
    email: '',        // Added email field
    mobile: '',
    otp: '',
    password: '',
    confirm_password: '',
  });
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [error, setError] = useState('');
  const [showCheck, setShowCheck] = useState(false);
  const [ripples, setRipples] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      full_name: [prev.surname, prev.name, prev.father_name].filter(Boolean).join(' '),
    }));
  }, [form.surname, form.name, form.father_name]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSendOtp = async () => {
    if (!form.mobile) {
      setError('Please enter mobile number');
      return;
    }
    try {
      const response = await axios.post('send-otp/', { 
        mobile: form.mobile, 
        type: 'signup' 
      });
      console.log('OTP response:', response.data);
      setOtpSent(true);
      alert(response.data.message || 'OTP sent!');
    } catch (err) {
      console.error('Send OTP error:', err.response?.data || err.message);
      setError(err.response?.data?.error || 'Failed to send OTP');
    }
  };

  const handleVerifyOtp = async () => {
    if (!form.otp) {
      setError('Please enter OTP');
      return;
    }
    try {
      const response = await axios.post('verify-otp/', { mobile: form.mobile, otp: form.otp });
      console.log('Verify OTP response:', response.data);
      setOtpVerified(true);
      alert('OTP verified!');
    } catch (err) {
      console.error('Verify OTP error:', err.response?.data || err.message);
      setError(err.response?.data?.error || 'Invalid OTP');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    const requiredFields = ['surname', 'father_name', 'email', 'mobile', 'password'];
    const missingFields = requiredFields.filter(field => !form[field]);
    
    if (missingFields.length > 0) {
      setError(`Please fill in all required fields: ${missingFields.join(', ')}`);
      return;
    }
    
    if (!otpVerified) {
      setError('Please verify OTP first');
      return;
    }
    
    if (form.password !== form.confirm_password) {
      setError('Passwords do not match');
      return;
    }
    
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }
    
    try {
      const response = await axios.post('signup/', {
        first_name: form.surname,      // Map to backend field
        middle_name: form.name,        // Map to backend field
        last_name: form.father_name,   // Map to backend field
        sakh: form.sakh,             // Map sakh field
        email: form.email,             // Map email field
        mobile: form.mobile,
        username: form.mobile,         // Use mobile number as username
        password: form.password,
      });
      console.log('Signup response:', response.data);
      setShowCheck(true);
      
      // Show success message with user details
      const successMessage = `
Signup successful!

User Number: #${response.data.user_number || 'Assigned'}
Full Name: ${response.data.full_name || form.full_name}
Mobile Number: ${form.mobile}
Password: ${form.password}

Remember your mobile number and password for login.
Welcome email sent to ${form.email}!

Redirecting to login page...`;
      
      alert(successMessage);
      
      console.log('Setting timeout to navigate to signin page...');
      
      // Navigate after showing success animation
      setTimeout(() => {
        console.log('Timeout completed, navigating to /signin');
        setShowCheck(false);
        navigate('/signin');
      }, 3000);
      
      // Fallback navigation in case the timeout doesn't work
      setTimeout(() => {
        console.log('Fallback navigation to /signin');
        navigate('/signin');
      }, 5000);
    } catch (err) {
      console.error('Signup error:', err.response?.data || err.message);
      setError(err.response?.data?.error || 'Signup failed');
    }
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

  return (
    <>
      <div className="animated-bg">
        <div className="bg-circle bg-circle1"></div>
        <div className="bg-circle bg-circle2"></div>
        <div className="bg-circle bg-circle3"></div>
        <div className="bg-circle bg-circle4"></div>
      </div>
      <form className="auth-form-container" onSubmit={handleSubmit}>
        <div className="language-toggle-container">
          <LanguageToggle inline={true} />
        </div>
        
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
        
        <h2>{t('signup')}</h2>
        <div className="form-section">
          <input 
            name="surname" 
            placeholder={language === 'en' ? 'Surname *' : 'ઉપનામ *'} 
            value={form.surname} 
            onChange={handleChange} 
            required 
          />
          <input 
            name="name" 
            placeholder={language === 'en' ? 'Name' : 'નામ'} 
            value={form.name} 
            onChange={handleChange} 
          />
          <input 
            name="father_name" 
            placeholder={language === 'en' ? 'Father Name *' : 'પિતાનું નામ *'} 
            value={form.father_name} 
            onChange={handleChange} 
            required 
          />
          <input 
            name="sakh" 
            placeholder={language === 'en' ? 'Sakh (શાખ)' : 'શાખ'} 
            value={form.sakh} 
            onChange={handleChange} 
          />
          <input 
            name="full_name" 
            placeholder={language === 'en' ? 'Full Name (Auto-generated)' : 'પૂરું નામ (આપોઆપ બનેલું)'} 
            value={form.full_name} 
            readOnly 
          />
          <input 
            name="email" 
            type="email" 
            placeholder={language === 'en' ? 'Email Address *' : 'ઈમેઈલ સરનામું *'} 
            value={form.email} 
            onChange={handleChange} 
            required 
          />
          <input 
            name="mobile" 
            placeholder={language === 'en' ? 'Mobile Number *' : 'મોબાઇલ નંબર *'} 
            value={form.mobile} 
            onChange={handleChange} 
            required 
          />
        </div>
        {!otpSent && (
          <button 
            type="button" 
            onClick={e => { handleSendOtp(); handleButtonClick(e); }}
            disabled={!form.mobile}
          >
            {language === 'en' ? 'Send OTP' : 'OTP મોકલો'}
            {ripples.map(r => (
              <span
                key={r.key}
                className="ripple"
                style={{ left: r.x, top: r.y, width: r.size, height: r.size }}
              />
            ))}
          </button>
        )}
        {otpSent && !otpVerified && (
          <div className="otp-section">
            <input 
              name="otp" 
              placeholder={language === 'en' ? 'Enter 6-digit OTP' : '6-અંકનો OTP દાખલ કરો'} 
              value={form.otp} 
              onChange={handleChange} 
              maxLength={6}
              style={{
                textAlign: 'center',
                letterSpacing: '3px',
                fontSize: '1.1rem',
                fontWeight: '600'
              }}
              required 
            />
            <button 
              type="button" 
              onClick={e => { handleVerifyOtp(); handleButtonClick(e); }}
              disabled={form.otp.length !== 6}
            >
              {language === 'en' ? 'Verify OTP' : 'OTP ચકાસો'}
              {ripples.map(r => (
                <span
                  key={r.key}
                  className="ripple"
                  style={{ left: r.x, top: r.y, width: r.size, height: r.size }}
                />
              ))}
            </button>
          </div>
        )}
        {otpVerified && (
          <div className="success">
            ✓ {language === 'en' ? 'OTP Verified Successfully!' : 'OTP સફળતાપૂર્વક ચકાસાયો!'}
          </div>
        )}
        <div className="form-section">
          <input 
            name="password" 
            type="password" 
            placeholder={language === 'en' ? 'Password (min 6 characters) *' : 'પાસવર્ડ (અવ્યવસ્થા 6 અક્ષરો) *'} 
            value={form.password} 
            onChange={handleChange} 
            required 
          />
          <input 
            name="confirm_password" 
            type="password" 
            placeholder={language === 'en' ? 'Confirm Password *' : 'પાસવર્ડની પુષ્ટિ કરો *'} 
            value={form.confirm_password} 
            onChange={handleChange} 
            required 
          />
        </div>
        {showCheck && (
          <>
            <div className="checkmark">
              <svg width="48" height="48" viewBox="0 0 48 48">
                <circle cx="24" cy="24" r="22" fill="#38a169" opacity="0.15"/>
                <polyline points="14,24 20,30 34,16" fill="none" stroke="#38a169" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="success-message">
              {language === 'en' ? 
                'Signup successful! Redirecting to signin page...' : 
                'સાઇનઅપ સફળ! સાઇનઇન પેજપર રીડાયરેક્ટ થઈ રહ્યું છે...'
              }
            </div>
            {renderConfetti()}
          </>
        )}
        {error && !showCheck && <div className="error">{error}</div>}
        <button 
          type="submit" 
          onClick={handleButtonClick}
          disabled={!otpVerified || !form.password || !form.confirm_password}
        >
          {t('signup')}
          {ripples.map(r => (
            <span
              key={r.key}
              className="ripple"
              style={{ left: r.x, top: r.y, width: r.size, height: r.size }}
            />
          ))}
        </button>
        <button 
          type="button" 
          className="login-redirect-btn" 
          onClick={() => navigate('/signin')}
        >
          {language === 'en' ? 'Already have an account? Sign In' : 'પહેલેથી એકાઉન્ટ છે? સાઇન ઇન કરો'}
        </button>
      </form>
    </>
  );
};

export default Signup;
