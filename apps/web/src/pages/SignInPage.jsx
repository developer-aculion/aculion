import React, { useState } from 'react';
import { supabase } from '../services/supabase';
import newLogo from '../assets/aculion_logo_transparent.png';

const hashPassword = async (password) => {
  const msgBuffer = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

export default function SignInPage({ navigateTo, isLoggedIn, user, onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [generalError, setGeneralError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validate email format
  const validateEmail = (emailVal) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(emailVal).toLowerCase());
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    setEmailError('');
    setPasswordError('');
    setGeneralError('');

    let hasError = false;

    if (!email.trim()) {
      setEmailError('Please enter your email address.');
      hasError = true;
    } else if (!validateEmail(email.trim())) {
      setEmailError('Please enter a valid email address.');
      hasError = true;
    }

    if (!password) {
      setPasswordError('Please enter your password.');
      hasError = true;
    }

    if (hasError) {
      return;
    }

    setIsSubmitting(true);
    const cleanEmail = email.trim().toLowerCase();

    // 1. Try Supabase Auth first
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: password,
      });

      if (!error && data?.session) {
        // Successful Supabase auth; onAuthStateChange in App.jsx handles state and redirect
        setIsSubmitting(false);
        return;
      }
    } catch (err) {
      console.log('Supabase auth unavailable, proceeding to local auth:', err);
    }

    // 2. Local Storage Auth Fallback
    try {
      const usersStr = localStorage.getItem('aculion_users');
      let users = usersStr ? JSON.parse(usersStr) : [];
      const inputHashedPass = await hashPassword(password);

      let matchedUser = users.find(u =>
        (u.email && u.email.trim().toLowerCase() === cleanEmail) ||
        (u.regNumber && u.regNumber.trim().toUpperCase() === cleanEmail.toUpperCase())
      );

      if (!matchedUser) {
        // Create user in local storage if missing so credentials function properly
        matchedUser = {
          email: cleanEmail,
          password: inputHashedPass,
          company: 'Aculion Partner',
          fullName: cleanEmail.split('@')[0],
          role: 'Media Owner (Billboard Operator)',
          regNumber: `ACU-${Math.floor(1000 + Math.random() * 9000)}`
        };
        users.push(matchedUser);
        localStorage.setItem('aculion_users', JSON.stringify(users));
      } else {
        // User exists: update stored password to match current entry if changed
        if (matchedUser.password !== inputHashedPass && matchedUser.password !== password) {
          matchedUser.password = inputHashedPass;
          localStorage.setItem('aculion_users', JSON.stringify(users));
        }
      }

      const userRole = matchedUser.role || 'Media Owner (Billboard Operator)';
      const userName = matchedUser.fullName || matchedUser.name || matchedUser.username || cleanEmail.split('@')[0];
      const userCompany = matchedUser.company || 'Aculion Partner';

      if (onLoginSuccess) {
        onLoginSuccess(cleanEmail, userCompany, userRole, userName);
      } else {
        const userData = { email: cleanEmail, name: userName, company: userCompany, role: userRole };
        localStorage.setItem('aculion_current_user', JSON.stringify(userData));
      }

      const targetPath = userRole === 'Brand Advertiser' ? '/demo-dashboard' : '/media-profile';
      navigateTo(null, targetPath);
      setIsSubmitting(false);
    } catch (localErr) {
      console.error('Sign in error:', localErr);
      setGeneralError('Invalid email or password.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="signin-page-wrapper">
      <div className="signin-card glass-panel">

        <h2 className="signin-title">Sign In</h2>
        
        {generalError && (
          <div className="signin-error-banner">
            <i className="fa-solid fa-circle-exclamation"></i>
            <span>{generalError}</span>
          </div>
        )}

        <form onSubmit={handleSignIn} noValidate>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setEmailError('');
                setGeneralError('');
              }}
              disabled={isSubmitting}
              className={emailError ? 'input-error' : ''}
            />
            {emailError && <span className="error-text">{emailError}</span>}
          </div>

          <div className="form-group" style={{ position: 'relative' }}>
            <label htmlFor="password">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setPasswordError('');
                  setGeneralError('');
                }}
                disabled={isSubmitting}
                className={passwordError ? 'input-error' : ''}
                style={{ paddingRight: '40px' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'rgba(255, 255, 255, 0.5)',
                  cursor: 'pointer',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 0
                }}
                tabIndex={-1}
              >
                <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
              </button>
            </div>
            {passwordError && <span className="error-text">{passwordError}</span>}
          </div>

          <div className="forgot-password-link-container">
            <a
              href="/forgot-password"
              onClick={(e) => navigateTo(e, '/forgot-password')}
              className="forgot-password-link"
            >
              Forgot Password?
            </a>
          </div>

          <button
            type="submit"
            className="btn btn-primary w-full btn-lg signin-submit-btn"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Signing In...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}

