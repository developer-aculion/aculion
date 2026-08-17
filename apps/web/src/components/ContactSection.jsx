import React from 'react';

export default function ContactSection() {
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

        </div>
      </div>
    </section>
  );
}
