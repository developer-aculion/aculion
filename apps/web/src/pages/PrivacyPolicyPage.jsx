import React from 'react';
import './LegalPages.css';

export default function PrivacyPolicyPage({ navigateTo }) {
  return (
    <div className="legal-page-container">
      {/* Glow Effects */}
      <div className="legal-hero-glow"></div>

      <div className="legal-content-wrapper">
        {/* Breadcrumb */}
        <nav className="legal-breadcrumb" aria-label="Breadcrumb">
          <a href="/" onClick={(e) => { e.preventDefault(); navigateTo(e, '/'); }}>Home</a>
          <span className="breadcrumb-separator">/</span>
          <span className="breadcrumb-current">Privacy Policy</span>
        </nav>

        {/* Header */}
        <header className="legal-header">
          <span className="legal-tag">Privacy & Data Governance</span>
          <h1 className="legal-title">Privacy Policy</h1>
          <p className="legal-subtitle">
            How Aculion protects individual privacy through edge computing, hardware-level anonymization, and transparent data practices.
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
            <h2>1. Introduction & Privacy-by-Design Philosophy</h2>
            <p>
              Aculion Inc. ("Aculion", "we", "our", or "us") provides AI-powered Out-of-Home (OOH) audience intelligence and traffic analytics. We operate on a strict <strong>Privacy-by-Design</strong> principle: physical audience metrics can and must be gathered without tracking, storing, or compromising the identity of individual citizens.
            </p>
            <p>
              This Privacy Policy explains how our edge sensor devices process physical-world camera feeds, what information is collected on our web platform and client consoles, how that data is protected, and your rights under applicable privacy laws including GDPR and CCPA.
            </p>
          </section>

          <section className="legal-section">
            <h2>2. Physical Space & Edge Video Processing</h2>
            <div className="legal-highlight-box">
              <h3><i className="fa-solid fa-shield-halved"></i> Zero Video Storage Architecture</h3>
              <p>
                Aculion edge sensor nodes do not record, store, or stream raw identifiable video footage. All video processing occurs in the volatile memory (RAM) of local hardware chipsets on-site.
              </p>
            </div>
            <ul>
              <li><strong>Instant Frame Blurring:</strong> Video feeds from physical sensor nodes apply hardware-level neural blurring to human faces and license plates immediately upon frame acquisition.</li>
              <li><strong>Vector Anonymization:</strong> Computer vision models extract only mathematical vectors representing generalized pedestrian gaze direction and bounding boxes for vehicle classification (e.g., sedan, SUV, bus, truck).</li>
              <li><strong>Immediate Frame Deletion:</strong> Raw video frames are discarded milliseconds after vector calculation. No raw video files ever leave the local camera node or get uploaded to cloud storage.</li>
              <li><strong>Aggregate Telemetry:</strong> Only anonymized mathematical counts (e.g., "142 vehicles detected between 14:00 and 14:15 with an average dwell time of 28 seconds") are securely transmitted to the Aculion analytics console.</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>3. Web Platform & Account Information We Collect</h2>
            <p>
              When media owners, advertisers, or enterprise partners interact with our web platform (<code>https://www.aculion.com</code>) or client console, we may collect:
            </p>
            <ul>
              <li><strong>Account Credentials:</strong> Full name, business email address, company name, phone number, and encrypted passwords managed via Supabase authentication.</li>
              <li><strong>Inquiry & Demo Information:</strong> Information submitted through our "Book a Demo" or "Contact Sales" forms.</li>
              <li><strong>Asset & Inventory Data:</strong> Billboard specifications, locations, dimensions, and screen types registered by media owners.</li>
              <li><strong>Technical Web Telemetry:</strong> Standard browser metadata, IP addresses for security rate-limiting, operating system details, and session timestamps.</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>4. How We Use Information</h2>
            <p>We use web platform and account data solely for legitimate business operations:</p>
            <ul>
              <li>To provide, operate, and maintain the Aculion audience intelligence platform.</li>
              <li>To authenticate authorized users and protect client portal access.</li>
              <li>To respond to enterprise demo requests, inquiries, and customer support tickets.</li>
              <li>To detect, prevent, and address technical issues, unauthorized access, or fraudulent activity.</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>5. Cookies & Local Storage</h2>
            <p>
              Our web application uses browser LocalStorage and essential session cookies strictly to maintain user authentication tokens, dashboard filter preferences, and theme state. We do not sell user data to third-party advertising brokers.
            </p>
          </section>

          <section className="legal-section">
            <h2>6. Third-Party Service Providers</h2>
            <p>
              We partner with trusted enterprise cloud infrastructure providers to deliver our platform:
            </p>
            <ul>
              <li><strong>Hosting & Edge CDN:</strong> Vercel Inc.</li>
              <li><strong>Authentication & Database:</strong> Supabase Inc. (PostgreSQL with row-level security and TLS 1.3 encryption).</li>
              <li><strong>Map Visualizations:</strong> Leaflet & OpenStreetMap geospatial tiles.</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>7. Data Security & Retention</h2>
            <p>
              We implement industry-standard administrative, technical, and physical safeguards:
            </p>
            <ul>
              <li>All web and API traffic is encrypted in transit using HTTPS / TLS.</li>
              <li>Database records are protected by granular Row-Level Security (RLS) policies.</li>
              <li>Aggregated billboard telemetry is retained for historical reporting and trend analytics. Account information is retained for the duration of the commercial relationship.</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>8. Your Rights (GDPR, CCPA & Global Regulations)</h2>
            <p>
              Depending on your jurisdiction, you have the right to:
            </p>
            <ul>
              <li>Request access to the personal data we hold about your account.</li>
              <li>Request correction of inaccurate or incomplete information.</li>
              <li>Request deletion of your account and associated contact records.</li>
              <li>Object to or restrict specific data processing activities.</li>
            </ul>
            <p>
              Because edge nodes process anonymized physical vectors without storing biometric identifiers, individual physical pedestrian lookup requests are not technically feasible (as no identifiable pedestrian data exists in our systems).
            </p>
          </section>

          <section className="legal-section">
            <h2>9. Changes to This Privacy Policy</h2>
            <p>
              We may update this Privacy Policy from time to time to reflect technological or regulatory advancements. Any updates will be posted on this page with a revised "Effective Date".
            </p>
          </section>

          <section className="legal-section">
            <h2>10. Contact Us</h2>
            <p>
              For privacy inquiries, data protection questions, or account requests, please reach out to our team:
            </p>
            <div className="legal-contact-card">
              <p><strong>Aculion Inc. — Data Governance & Privacy</strong></p>
              <p><i className="fa-solid fa-envelope"></i> Email: <a href="mailto:connect@aculion.com">connect@aculion.com</a></p>
              <p><i className="fa-solid fa-phone"></i> Telephone: <a href="tel:+919176590590">+91 91765 90590</a></p>
              <p><i className="fa-solid fa-globe"></i> Website: <a href="https://www.aculion.com">https://www.aculion.com</a></p>
            </div>
          </section>

          <div className="legal-footer-nav">
            <button className="btn btn-primary" onClick={(e) => { e.preventDefault(); navigateTo(e, '/'); }}>
              <i className="fa-solid fa-arrow-left"></i> Return to Homepage
            </button>
            <button className="btn btn-outline" onClick={(e) => { e.preventDefault(); navigateTo(e, '/terms-of-service'); }}>
              View Terms of Service <i className="fa-solid fa-arrow-right"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
