import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import logo from '../../assets/MOREBYTES LOGO.png';
import ovenBg from '../../assets/OVEN.webp';
import './Login.css';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();

  const VALID_EMAILS = ['supervisor@lynloves.com', 'admin@lynloves.com'];

  const handleSubmit = (e) => {
    e.preventDefault();
    setEmailError('');
    setPasswordError('');

    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail) {
      setEmailError('Email address is required.');
      return;
    }

    if (!VALID_EMAILS.includes(trimmedEmail)) {
      setEmailError('Email address is incorrect. Account not found.');
      return;
    }

    if (!password) {
      setPasswordError('Password is required.');
      return;
    }

    if (password !== 'admin123') {
      setPasswordError('Password is incorrect. Please try again.');
      return;
    }

    // Success
    login({ name: 'John Doe', role: 'supervisor' });
    navigate('/supervisor/dashboard');
  };

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    if (emailError) setEmailError('');
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    if (passwordError) setPasswordError('');
  };

  return (
    <div className="login-page">
      {/* OVEN background with Layer blur of 17 */}
      <div 
        className="login-bg" 
        style={{ backgroundImage: `url(${ovenBg})` }}
        aria-hidden="true" 
      />

      {/* Center container */}
      <div className="login-container">
        {/* Glassmorphism Card */}
        <div className="login-card">
          {/* Logo */}
          <div className="login-logo-container">
            <img src={logo} alt="Morebytes Food Corner Logo" className="login-logo" />
          </div>

          {/* Heading */}
          <h1 className="login-title">Start your shift</h1>
          
          {/* Subheading */}
          <p className="login-subtitle">Sign in to continue managing the store</p>

          {/* Login Form */}
          <form className="login-form" onSubmit={handleSubmit} noValidate>
            {/* Email Field */}
            <div className="login-field">
              <label htmlFor="email">Email Address</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={handleEmailChange}
                autoComplete="email"
                className={emailError ? 'input-error' : ''}
              />
              {emailError && <p className="field-error-msg">{emailError}</p>}
            </div>

            {/* Password Field */}
            <div className="login-field">
              <label htmlFor="password">Password</label>
              <div className="login-password-wrapper">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={handlePasswordChange}
                  autoComplete="current-password"
                  className={passwordError ? 'input-error' : ''}
                />
                <button
                  type="button"
                  className="login-password-toggle"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                      <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                    </svg>
                  )}
                </button>
              </div>
              {passwordError && <p className="field-error-msg">{passwordError}</p>}
            </div>

            {/* Sign In Button */}
            <button type="submit" className="login-btn">
              Sign In
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Login;
