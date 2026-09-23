import React from 'react';
import './LegalPages.css';

export default function TermsOfServicePage({ navigateTo }) {
  return (
    <div className="legal-page-container">
      {/* Glow Effects */}
      <div className="legal-hero-glow"></div>

      <div className="legal-content-wrapper">
        {/* Breadcrumb */}
        <nav className="legal-breadcrumb" aria-label="Breadcrumb">
          <a href="/" onClick={(e) => { e.preventDefault(); navigateTo(e, '/'); }}>Home</a>
          <span className="breadcrumb-separator">/</span>
          <span className="breadcrumb-current">Terms of Service</span>
        </nav>

        {/* Header */}
        <header className="legal-header">
          <span className="legal-tag">Legal Agreement</span>
          <h1 className="legal-title">Terms of Service</h1>
          <p className="legal-subtitle">
            Please read these terms and conditions carefully before accessing or using the Aculion intelligence platform.
          </p>
          <div className="legal-meta">
            <span><strong>Effective Date:</strong> September 2026</span>
            <span className="meta-dot">•</span>
            <span><strong>Version:</strong> 2.0</span>
          </div>
        </header>

        {/* Main Content Sections */}
        <div className="legal-body glass-panel">
          <section className="legal-section">
            <h2>1. Acceptance of Terms</h2>
            <p>
              These Terms of Service ("Terms") constitute a legally binding agreement between you (individually or on behalf of your entity, "Client", "User", or "you") and Aculion Inc. ("Aculion", "we", "our", or "us"), governing your access to and use of the website located at <code>https://www.aculion.com</code>, our software consoles, edge sensor data integrations, and associated services (collectively, the "Platform").
            </p>
            <p>
              By creating an account, accessing dashboards, or using our services, you acknowledge that you have read, understood, and agreed to be bound by these Terms. If you do not agree, you must not access or use the Platform.
            </p>
          </section>

          <section className="legal-section">
            <h2>2. Description of Services</h2>
            <p>
              Aculion provides an enterprise AI platform that delivers real-time physical audience intelligence, vehicle classification, dwell time metrics, and campaign verification for Out-of-Home (OOH) media owners, brand advertisers, and agencies.
            </p>
            <p>
              Services include hardware-assisted edge video processing nodes, audience reporting dashboards, location intelligence mapping, and data export features. Specific commercial service tiers and hardware deployments are governed by individual Enterprise Order Forms or Master Service Agreements.
            </p>
          </section>

          <section className="legal-section">
            <h2>3. Account Registration & Security</h2>
            <ul>
              <li><strong>Authorized Credentials:</strong> You agree to provide accurate, current, and complete business information during registration and keep your account details updated.</li>
              <li><strong>Credential Confidentiality:</strong> You are solely responsible for maintaining the confidentiality of your sign-in credentials and for all activities that occur under your account.</li>
              <li><strong>Unauthorized Access:</strong> You agree to notify Aculion immediately at <code>connect@aculion.com</code> if you discover or suspect any unauthorized use or security compromise of your account.</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>4. Intellectual Property & Proprietary Rights</h2>
            <p>
              All software, computer vision algorithms, neural model weights, telemetry pipelines, user interface designs, logos, trademarks, and documentation comprising the Platform are the exclusive intellectual property of Aculion Inc. and its licensors.
            </p>
            <p>
              Subject to these Terms, Aculion grants you a limited, non-exclusive, non-transferable, revocable license to access and use the Platform dashboards and export analytical reports solely for your internal business purposes.
            </p>
          </section>

          <section className="legal-section">
            <h2>5. Acceptable Use & Prohibitions</h2>
            <p>You agree not to:</p>
            <ul>
              <li>Reverse-engineer, decompile, disassemble, or attempt to derive the source code of any Aculion edge firmware, machine learning models, or web software.</li>
              <li>Scrape, harvest, or extract data from the Platform using automated bots, crawlers, or unauthorized scripts.</li>
              <li>Bypass or attempt to circumvent authentication layers, role permissions, or security protocols.</li>
              <li>Use the Platform or its data in any manner that violates applicable local, national, or international privacy and data protection laws.</li>
              <li>Resell, sublicense, or redistribute raw platform telemetry without express written authorization from Aculion.</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>6. Privacy & Edge Data Commitment</h2>
            <p>
              Both parties agree to comply with applicable data protection legislation. Aculion’s edge computing architecture operates on a Privacy-by-Design standard where physical video streams are processed on local device RAM with instant face and license plate blurring, preventing the collection of personally identifiable biometric data. For more details, refer to our <a href="/privacy-policy" onClick={(e) => { e.preventDefault(); navigateTo(e, '/privacy-policy'); }}>Privacy Policy</a>.
            </p>
          </section>

          <section className="legal-section">
            <h2>7. Disclaimer of Warranties</h2>
            <p>
              The Platform and its analytical reports are provided on an "as is" and "as available" basis. While Aculion employs advanced computer vision algorithms and rigorous quality control to deliver high precision, we do not warrant that analytical telemetry will be completely error-free or uninterrupted under extreme weather conditions, network outages, or physical camera occlusions beyond our control.
            </p>
          </section>

          <section className="legal-section">
            <h2>8. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by applicable law, in no event shall Aculion, its directors, employees, or partners be liable for any indirect, incidental, special, consequential, or punitive damages arising out of or related to your use or inability to use the Platform.
            </p>
          </section>

          <section className="legal-section">
            <h2>9. Termination & Suspension</h2>
            <p>
              Aculion reserves the right to suspend or terminate access to the Platform immediately upon notice if a user materially breaches these Terms or engages in unauthorized activity. Upon termination, all rights granted to you under these Terms will cease immediately.
            </p>
          </section>

          <section className="legal-section">
            <h2>10. Governing Law & Dispute Resolution</h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of India, without regard to its conflict of law principles. Any dispute arising under or in connection with these Terms shall be subject to the exclusive jurisdiction of the competent courts in Chennai, Tamil Nadu, India.
            </p>
          </section>

          <section className="legal-section">
            <h2>11. Contact & Legal Inquiries</h2>
            <p>
              If you have any questions, feedback, or legal inquiries regarding these Terms, please contact us:
            </p>
            <div className="legal-contact-card">
              <p><strong>Aculion Inc. — Legal & Corporate Affairs</strong></p>
              <p><i className="fa-solid fa-envelope"></i> Email: <a href="mailto:connect@aculion.com">connect@aculion.com</a></p>
              <p><i className="fa-solid fa-phone"></i> Telephone: <a href="tel:+919176590590">+91 91765 90590</a></p>
              <p><i className="fa-solid fa-globe"></i> Website: <a href="https://www.aculion.com">https://www.aculion.com</a></p>
            </div>
          </section>

          <div className="legal-footer-nav">
            <button className="btn btn-primary" onClick={(e) => { e.preventDefault(); navigateTo(e, '/'); }}>
              <i className="fa-solid fa-arrow-left"></i> Return to Homepage
            </button>
            <button className="btn btn-outline" onClick={(e) => { e.preventDefault(); navigateTo(e, '/privacy-policy'); }}>
              View Privacy Policy <i className="fa-solid fa-arrow-right"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
