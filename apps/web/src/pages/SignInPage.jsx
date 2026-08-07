import React, { useState } from 'react';
import { supabase } from '../services/supabase';
import newLogo from '../assets/aculion_logo_transparent.png';

export default function SignInPage({ navigateTo, isLoggedIn, user }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (error) {
        setGeneralError('Invalid email or password.');
        setIsSubmitting(false);
      } else {
        // Session will be picked up by onAuthStateChange listener in App.jsx
        // which will update global user state and redirect
      }
    } catch (err) {
      setGeneralError('Invalid email or password.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="signin-page-wrapper">
      <div className="signin-card glass-panel">
        <div className="signin-logo-container">
          <img src={newLogo} alt="Aculion" className="signin-logo-img" />
        </div>
        
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

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setPasswordError('');
                setGeneralError('');
              }}
              disabled={isSubmitting}
              className={passwordError ? 'input-error' : ''}
            />
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
