import React, { useState, useEffect } from 'react';

export default function ContactSection({ initialInquiryType = 'Contact Sales' }) {
  const [contactForm, setContactForm] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    billboards: '',
    message: '',
    inquiryType: initialInquiryType,
    preferredDate: '',
    preferredTime: '',
    preferredMeetingMode: 'Google Meet',
  });
  const [contactState, setContactState] = useState({ loading: false, success: false, error: '' });

  useEffect(() => {
    if (initialInquiryType) {
      setContactForm(prev => ({ ...prev, inquiryType: initialInquiryType }));
    }
  }, [initialInquiryType]);

  // ── Collect browser / device metadata ────────────────────
  const getClientMeta = async () => {
    const browser = `${navigator.userAgent}`;
    const device   = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent) ? 'Mobile / Tablet' : 'Desktop';
    let ip = 'Unavailable';
    try {
      const r = await fetch('https://api.ipify.org?format=json');
      const d = await r.json();
      ip = d.ip || 'Unavailable';
    } catch { /* silently skip */ }
    return { browser, device, ip };
  };

  // ── Validate email ────────────────────────────────────────
  const isValidEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

  // ── Phone: only allow digits, +, spaces, -, () ────────────
  const handlePhoneInput = (setter) => (e) => {
    const val = e.target.value.replace(/[^\d\+\s\-\(\)]/g, '');
    setter(p => ({ ...p, phone: val }));
  };

  // ── Submit: Unified Contact Sales & Book a Demo ───────────
  const handleContactSubmit = async (e) => {
    e.preventDefault();
    setContactState({ loading: false, success: false, error: '' });

    // Client-side validation
    if (!contactForm.name.trim())    return setContactState(s => ({ ...s, error: 'Full name is required.' }));
    if (!contactForm.company.trim()) return setContactState(s => ({ ...s, error: 'Company name is required.' }));
    if (!isValidEmail(contactForm.email)) return setContactState(s => ({ ...s, error: 'Please enter a valid business email.' }));

    if (contactForm.inquiryType === 'Book a Demo') {
      if (!contactForm.preferredDate) return setContactState(s => ({ ...s, error: 'Preferred date is required.' }));
      if (!contactForm.preferredTime) return setContactState(s => ({ ...s, error: 'Preferred time is required.' }));
      if (!contactForm.preferredMeetingMode) return setContactState(s => ({ ...s, error: 'Preferred meeting mode is required.' }));
    }

    setContactState({ loading: true, success: false, error: '' });

    try {
      const meta = await getClientMeta();
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...contactForm, ...meta, _honeypot: '' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.details || data.error || 'Server error');
      setContactState({ loading: false, success: true, error: '' });
      setContactForm({
        name: '',
        company: '',
        email: '',
        phone: '',
        billboards: '',
        message: '',
        inquiryType: contactForm.inquiryType,
        preferredDate: '',
        preferredTime: '',
        preferredMeetingMode: 'Google Meet',
      });
    } catch (err) {
      console.error('Contact form submission error:', err);
      setContactState({
        loading: false,
        success: false,
        error: err.message || 'Unable to send your inquiry right now. Please try again.',
      });
    } finally {
      setTimeout(() => {
        const el = document.getElementById('contact-section');
        if (el) {
          const headerHeight = document.querySelector('.main-header')?.offsetHeight || 72;
          const top = el.getBoundingClientRect().top + window.scrollY - headerHeight - 16;
          window.scrollTo({ top, behavior: 'smooth' });
        }
      }, 100);
    }
  };

  return (
    <section id="contact-section" className="cs-section">
      <div className="section-container">

        <div className="cs-two-col">

          {/* Left: Info */}
          <div className="cs-info-col">
            <span className="section-tag">OOH Intelligence</span>
            <h2 className="cs-heading">Contact the Aculion Team</h2>
            <p className="cs-body-text">
              Connect with our OOH specialists to optimize your billboard network, or schedule a live personalized demo tailored to your scale and goals.
            </p>

            <div className="cs-contact-items">
              <div className="cs-contact-item">
                <div className="cs-contact-icon">
                  <i className="fa-solid fa-envelope"></i>
                </div>
                <div>
                  <div className="cs-contact-label">Email Us</div>
                  <div className="cs-contact-value">connect@aculion.com</div>
                </div>
              </div>
              <div className="cs-contact-item">
                <div className="cs-contact-icon">
                  <i className="fa-solid fa-phone"></i>
                </div>
                <div>
                  <div className="cs-contact-label">Call Us</div>
                  <div className="cs-contact-value">+91 91765 90590</div>
                </div>
              </div>
              <div className="cs-contact-item">
                <div className="cs-contact-icon">
                  <i className="fa-solid fa-clock"></i>
                </div>
                <div>
                  <div className="cs-contact-label">Office Hours</div>
                  <div className="cs-contact-value">Mon–Fri, 9 AM – 6 PM IST</div>
                </div>
              </div>
            </div>

            <div className="cs-trust-badges">
              <div className="cs-trust-badge"><i className="fa-solid fa-shield-halved"></i> GDPR Compliant</div>
              <div className="cs-trust-badge"><i className="fa-solid fa-lock"></i> Secure & Private</div>
              <div className="cs-trust-badge"><i className="fa-solid fa-bolt"></i> Response in 24hrs</div>
            </div>
          </div>

          {/* Right: Form */}
          <div className="cs-form-col glass-panel" style={{ minHeight: '520px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div className="cs-form-glow"></div>
            {contactState.success ? (
              <div className="cs-success-msg" style={{ animation: 'fadeInUp 0.4s ease', padding: '40px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: '16px' }}>
                <div className="cs-success-icon" style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'rgba(16,185,129,0.12)', border: '2px solid rgba(16,185,129,0.4)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px' }}>
                  <i className="fa-solid fa-circle-check"></i>
                </div>
                <h3 style={{ color: '#ffffff', fontSize: '24px', fontWeight: 700, margin: 0 }}>Thank You!</h3>
                <p style={{ color: '#8e909a', fontSize: '16px', maxWidth: '380px', margin: 0, lineHeight: 1.6 }}>Thank you! Your inquiry has been submitted successfully.</p>
                <button
                  type="button"
                  className="btn btn-outline"
                  style={{ marginTop: '12px', padding: '10px 24px', fontSize: '14px' }}
                  onClick={() => setContactState({ loading: false, success: false, error: '' })}
                >
                  Send Another Message <i className="fa-solid fa-rotate-right" style={{ marginLeft: '6px' }}></i>
                </button>
              </div>
            ) : (
              <form className="cs-form" onSubmit={handleContactSubmit} noValidate>
                <h3 className="cs-form-title">Send Us a Message</h3>

                {/* Inline error banner */}
                {contactState.error && (
                  <div className="cs-form-error">
                    <i className="fa-solid fa-triangle-exclamation"></i> {contactState.error}
                  </div>
                )}

                {/* Required dropdown for Inquiry Type */}
                <div className="cs-field">
                  <label htmlFor="cs-inquiry-type">Inquiry Type <span className="cs-required">*</span></label>
                  <select
                    id="cs-inquiry-type"
                    required
                    value={contactForm.inquiryType}
                    onChange={e => setContactForm(p => ({ ...p, inquiryType: e.target.value }))}
                    disabled={contactState.loading}
                  >
                    <option value="Contact Sales">Contact Sales</option>
                    <option value="Book a Demo">Book a Demo</option>
                    <option value="Careers Oppurtunities">Careers Oppurtunities</option>
                    <option value="General Inquiry">General Inquiry</option>
                    <option value="Support">Support</option>
                  </select>
                </div>

                <div className="cs-form-row">
                  <div className="cs-field">
                    <label htmlFor="cs-name">Full Name <span className="cs-required">*</span></label>
                    <input
                      id="cs-name"
                      type="text"
                      placeholder="Jane Smith"
                      required
                      value={contactForm.name}
                      onChange={e => setContactForm(p => ({...p, name: e.target.value}))}
                      disabled={contactState.loading}
                    />
                  </div>
                  <div className="cs-field">
                    <label htmlFor="cs-company">Company <span className="cs-required">*</span></label>
                    <input
                      id="cs-company"
                      type="text"
                      placeholder="Acme Media Pvt. Ltd."
                      required
                      value={contactForm.company}
                      onChange={e => setContactForm(p => ({...p, company: e.target.value}))}
                      disabled={contactState.loading}
                    />
                  </div>
                </div>
                <div className="cs-form-row">
                  <div className="cs-field">
                    <label htmlFor="cs-email">Business Email <span className="cs-required">*</span></label>
                    <input
                      id="cs-email"
                      type="email"
                      placeholder="jane@acmemedia.com"
                      required
                      value={contactForm.email}
                      onChange={e => setContactForm(p => ({...p, email: e.target.value}))}
                      disabled={contactState.loading}
                    />
                  </div>
                  <div className="cs-field">
                    <label htmlFor="cs-phone">Phone Number</label>
                    <input
                      id="cs-phone"
                      type="tel"
                      placeholder="+91 98765 43210"
                      value={contactForm.phone}
                      onChange={handlePhoneInput(setContactForm)}
                      disabled={contactState.loading}
                    />
                  </div>
                </div>
                <div className="cs-field">
                  <label htmlFor="cs-billboards">Number of Billboards</label>
                  <select
                    id="cs-billboards"
                    value={contactForm.billboards}
                    onChange={e => setContactForm(p => ({...p, billboards: e.target.value}))}
                    disabled={contactState.loading}
                  >
                    <option value="">Select range</option>
                    <option>1–10</option>
                    <option>11–50</option>
                    <option>51–200</option>
                    <option>200+</option>
                  </select>
                </div>

                {/* Book a Demo scheduling fields revealed dynamically */}
                {contactForm.inquiryType === 'Book a Demo' && (
                  <div style={{ animation: 'fadeInUp 0.3s ease' }}>
                    <div className="cs-form-row">
                      <div className="cs-field">
                        <label htmlFor="cs-date">Preferred Date <span className="cs-required">*</span></label>
                        <input
                          id="cs-date"
                          type="date"
                          required
                          value={contactForm.preferredDate}
                          onChange={e => setContactForm(p => ({...p, preferredDate: e.target.value}))}
                          disabled={contactState.loading}
                        />
                      </div>
                      <div className="cs-field">
                        <label htmlFor="cs-time">Preferred Time <span className="cs-required">*</span></label>
                        <input
                          id="cs-time"
                          type="time"
                          required
                          value={contactForm.preferredTime}
                          onChange={e => setContactForm(p => ({...p, preferredTime: e.target.value}))}
                          disabled={contactState.loading}
                        />
                      </div>
                    </div>
                    <div className="cs-field">
                      <label htmlFor="cs-meeting-mode">Preferred Meeting Mode <span className="cs-required">*</span></label>
                      <select
                        id="cs-meeting-mode"
                        required
                        value={contactForm.preferredMeetingMode}
                        onChange={e => setContactForm(p => ({...p, preferredMeetingMode: e.target.value}))}
                        disabled={contactState.loading}
                      >
                        <option value="Google Meet">Google Meet</option>
                        <option value="Microsoft Teams">Microsoft Teams</option>
                        <option value="Zoom">Zoom</option>
                        <option value="In-Person">In-Person</option>
                      </select>
                    </div>
                  </div>
                )}

                <div className="cs-field">
                  <label htmlFor="cs-message">Message</label>
                  <textarea
                    id="cs-message"
                    rows="4"
                    placeholder="Tell us about your network and what you'd like to achieve..."
                    value={contactForm.message}
                    onChange={e => setContactForm(p => ({...p, message: e.target.value}))}
                    disabled={contactState.loading}
                  ></textarea>
                </div>
                <button
                  id="cs-submit"
                  type="submit"
                  className="btn btn-primary w-full cs-submit-btn"
                  disabled={contactState.loading}
                >
                  {contactState.loading ? (
                    <><span className="cs-spinner"></span> Submitting...</>
                  ) : (
                    <>Submit Inquiry <i className="fa-solid fa-paper-plane"></i></>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>

      </div>
    </section>
  );
}
