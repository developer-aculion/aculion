/**
 * Aculion — Email Backend Server
 * Runs on port 3001 (proxied via Vite at /api/*)
 * 
 * Email providers (in priority order):
 *   1. Resend (if RESEND_API_KEY is set)
 *   2. Nodemailer + SMTP (if SMTP_USER/SMTP_PASS are set)
 *
 * No visitor authentication is required — the contact form is public.
 */

import express from 'express';
import nodemailer from 'nodemailer';
import { Resend } from 'resend';
import cors from 'cors';
import { config } from 'dotenv';

config(); // load .env

const app = express();
const PORT = process.env.PORT || 3001;
const RECIPIENT = process.env.RECIPIENT_EMAIL || 'connect@aculion.com';

// ── Email provider detection ────────────────────────────────
const resendKey = (process.env.RESEND_API_KEY || '').trim();
const smtpUser = (process.env.SMTP_USER || '').trim();
const smtpPass = (process.env.SMTP_PASS || process.env.SMTP_PASSWORD || '').trim();

const useResend = !!resendKey;
const useSMTP = !useResend && !!smtpUser && !!smtpPass;

console.log('─── Email Server Startup ──────────────────────────────');
console.log(`  Provider   : ${useResend ? 'Resend' : useSMTP ? 'SMTP (Nodemailer)' : '⚠  NONE CONFIGURED'}`);
if (useResend) {
  console.log(`  RESEND_KEY : [SET] (length: ${resendKey.length})`);
} else if (useSMTP) {
  console.log(`  SMTP_USER  : "${smtpUser}" (length: ${smtpUser.length})`);
  console.log(`  SMTP_PASS  : [SET] (length: ${smtpPass.length})`);
}
console.log(`  RECIPIENT  : ${RECIPIENT}`);
console.log(`  PORT       : ${PORT}`);
console.log('───────────────────────────────────────────────────────');

// ── Resend client ───────────────────────────────────────────
let resend = null;
if (useResend) {
  resend = new Resend(resendKey);
  console.log('✅  Resend client initialized');
}

// ── Nodemailer SMTP transporter (fallback) ──────────────────
let transporter = null;
if (useSMTP) {
  const isCustomHost = !!process.env.SMTP_HOST;
  const transporterConfig = isCustomHost
    ? {
      host: process.env.SMTP_HOST.trim(),
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_PORT === '465',
      auth: { user: smtpUser, pass: smtpPass },
    }
    : {
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: { user: smtpUser, pass: smtpPass },
    };

  transporter = nodemailer.createTransport(transporterConfig);

  transporter.verify((err) => {
    if (err) {
      console.error('⚠  SMTP connection FAILED:', err.message);
      console.error('   → Check SMTP_USER and SMTP_PASS in .env');
    } else {
      const host = isCustomHost ? `${process.env.SMTP_HOST}:${process.env.SMTP_PORT}` : 'smtp.gmail.com:465';
      console.log(`✅  SMTP ready — sending via ${smtpUser} → ${host}`);
    }
  });
}

// ── Middleware ───────────────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  methods: ['GET', 'POST'],
}));
app.use(express.json({ limit: '10kb' }));

// ── Rate limiting (in-memory, no extra dependency) ──────────
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 5; // max 5 requests per minute per IP

function rateLimit(req, res, next) {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    rateLimitMap.set(ip, { windowStart: now, count: 1 });
    return next();
  }

  entry.count++;
  if (entry.count > RATE_LIMIT_MAX) {
    return res.status(429).json({
      success: false,
      message: 'Too many requests. Please wait a minute before trying again.',
    });
  }
  return next();
}

// Clean up rate limit map periodically
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateLimitMap) {
    if (now - entry.windowStart > RATE_LIMIT_WINDOW_MS * 2) {
      rateLimitMap.delete(ip);
    }
  }
}, 60000);

// ── Helpers ─────────────────────────────────────────────────
function getIST() {
  return new Date().toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'full',
    timeStyle: 'long',
  });
}

function sanitize(str) {
  if (!str) return '—';
  return String(str).replace(/</g, '&lt;').replace(/>/g, '&gt;').trim();
}

function emailRow(label, value) {
  return `
    <tr>
      <td style="padding:10px 16px;font-weight:600;color:#94a3b8;font-size:13px;white-space:nowrap;vertical-align:top;border-bottom:1px solid #1e293b;">${label}</td>
      <td style="padding:10px 16px;color:#f1f5f9;font-size:14px;border-bottom:1px solid #1e293b;">${value}</td>
    </tr>`;
}

function buildEmailTemplate({ title, accentColor, badge, rows, submittedOn, browser, device, ip }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#0a0e1a;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0e1a;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#0d1220,#111827);border-radius:16px 16px 0 0;padding:36px 40px 28px;border:1px solid #1e293b;border-bottom:none;">
              <div style="display:inline-block;background:${accentColor}18;border:1px solid ${accentColor}44;border-radius:50px;padding:6px 16px;margin-bottom:16px;">
                <span style="color:${accentColor};font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;">${badge}</span>
              </div>
              <h1 style="margin:0;color:#f1f5f9;font-size:22px;font-weight:700;line-height:1.3;">${title}</h1>
              <p style="margin:8px 0 0;color:#64748b;font-size:13px;">Received via Aculion website · ${submittedOn}</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background:#0d1220;border:1px solid #1e293b;border-top:3px solid ${accentColor};border-bottom:none;padding:0;">
              <table width="100%" cellpadding="0" cellspacing="0">
                ${rows}
              </table>
            </td>
          </tr>

          <!-- Meta info -->
          <tr>
            <td style="background:#080b14;border:1px solid #1e293b;border-top:none;border-bottom:none;padding:0;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr><td colspan="2" style="padding:12px 16px 4px;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#475569;">Submission Metadata</td></tr>
                ${emailRow('Browser', browser)}
                ${emailRow('Device', device)}
                ${emailRow('IP Address', ip)}
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#060912;border:1px solid #1e293b;border-top:none;border-radius:0 0 16px 16px;padding:24px 40px;text-align:center;">
              <p style="margin:0;color:#334155;font-size:12px;">This email was automatically generated by the Aculion website form system.</p>
              <p style="margin:8px 0 0;color:#334155;font-size:12px;">© ${new Date().getFullYear()} Aculion · AI-Powered OOH Intelligence</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ── Validation helpers ──────────────────────────────────────
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[\+\d\s\-\(\)]{7,20}$/;

// ── SMTP Test Endpoint ──────────────────────────────────────
app.get('/api/smtp-test', async (_req, res) => {
  if (useResend) {
    return res.json({ ok: true, message: 'Using Resend API', provider: 'resend' });
  }
  if (!transporter) {
    return res.status(500).json({ ok: false, message: 'No email provider configured' });
  }
  try {
    await transporter.verify();
    return res.json({ ok: true, message: 'SMTP connection verified', provider: 'smtp' });
  } catch (err) {
    return res.status(500).json({ ok: false, message: err.message, code: err.code });
  }
});

// ══════════════════════════════════════════════════════════════
//  POST /api/contact — PUBLIC, no authentication required
//  Accepts contact form submissions from unauthenticated visitors
// ══════════════════════════════════════════════════════════════
app.post('/api/contact', rateLimit, async (req, res) => {
  const {
    name, company, email, phone, billboards, message,
    inquiryType, preferredDate, preferredTime, preferredMeetingMode,
    browser, device, ip,
    _honeypot, // honeypot field — must be empty
  } = req.body;

  // ── Honeypot spam check ─────────────────────────────────
  if (_honeypot) {
    // Silently accept to fool bots, but don't send email
    return res.json({ success: true, message: 'Your inquiry has been submitted successfully.' });
  }

  // ── Backend validation ──────────────────────────────────
  if (!name?.trim()) return res.status(400).json({ success: false, message: 'Full name is required.' });
  if (!company?.trim()) return res.status(400).json({ success: false, message: 'Company name is required.' });
  if (!email?.trim() || !EMAIL_RE.test(email)) return res.status(400).json({ success: false, message: 'A valid business email is required.' });
  if (phone?.trim() && !PHONE_RE.test(phone)) return res.status(400).json({ success: false, message: 'Phone number contains invalid characters.' });

  // Max message length
  if (message && message.length > 5000) {
    return res.status(400).json({ success: false, message: 'Message is too long (max 5000 characters).' });
  }

  if (inquiryType === 'Book a Demo') {
    if (!preferredDate) return res.status(400).json({ success: false, message: 'Preferred date is required for demo booking.' });
    if (!preferredTime) return res.status(400).json({ success: false, message: 'Preferred time is required for demo booking.' });
    if (!preferredMeetingMode) return res.status(400).json({ success: false, message: 'Preferred meeting mode is required for demo booking.' });
  }

  // ── Build email content ─────────────────────────────────
  const clientIp = (ip && ip !== 'Unavailable') ? ip : (req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'Unavailable');
  const submittedOn = getIST();
  const subject = 'New Contact Inquiry - Aculion Website';

  const rows = [
    emailRow('Inquiry Type', sanitize(inquiryType) || 'Contact Sales'),
    emailRow('Full Name', sanitize(name)),
    emailRow('Company Name', sanitize(company)),
    emailRow('Business Email', `<a href="mailto:${sanitize(email)}" style="color:#38bdf8;">${sanitize(email)}</a>`),
    emailRow('Phone Number', sanitize(phone) || '—'),
    emailRow('Number of Billboards', sanitize(billboards) || 'Not specified'),
    inquiryType === 'Book a Demo' ? emailRow('Preferred Demo Date & Time', `${sanitize(preferredDate)} at ${sanitize(preferredTime)}`) : '',
    inquiryType === 'Book a Demo' ? emailRow('Preferred Meeting Mode', sanitize(preferredMeetingMode)) : '',
    emailRow('Message', `<span style="white-space:pre-wrap;">${sanitize(message) || '—'}</span>`),
    emailRow('Submitted On (IST)', submittedOn),
  ].filter(Boolean).join('');

  const html = buildEmailTemplate({
    title: 'New Contact Inquiry - Aculion Website',
    accentColor: '#00f0ff',
    badge: inquiryType || 'Inquiry',
    rows,
    submittedOn,
    browser: sanitize(browser) || 'Unknown',
    device: sanitize(device) || 'Unknown',
    ip: sanitize(clientIp) || 'Unknown',
  });

  const text = `New Contact Inquiry - Aculion Website\n\nInquiry Type: ${inquiryType || 'Contact Sales'}\nFull Name: ${name}\nCompany Name: ${company}\nBusiness Email: ${email}\nPhone Number: ${phone || '—'}\nNumber of Billboards: ${billboards || 'Not specified'}\n${inquiryType === 'Book a Demo' ? `Preferred Demo Date & Time: ${preferredDate} at ${preferredTime}\nPreferred Meeting Mode: ${preferredMeetingMode}\n` : ''}Message:\n${message || '—'}\n\nSubmitted On: ${submittedOn}\nBrowser: ${browser || 'Unknown'}\nDevice: ${device || 'Unknown'}\nIP Address: ${clientIp || 'Unknown'}`;

  // ── Send email ──────────────────────────────────────────
  try {
    if (useResend) {
      // ── Resend API ────────────────────────────────────
      const fromAddress = process.env.RESEND_FROM || 'Aculion Website <onboarding@resend.dev>';
      const { data, error } = await resend.emails.send({
        from: fromAddress,
        to: [RECIPIENT],
        replyTo: email,
        subject,
        html,
        text,
      });

      if (error) {
        console.error('❌ Resend email failed:', error);
        return res.status(500).json({
          success: false,
          message: 'Unable to send your inquiry right now. Please try again later.',
        });
      }

      console.log(`✅ Email sent via Resend (id: ${data?.id})`);
      return res.json({ success: true, message: 'Your inquiry has been submitted successfully.' });

    } else if (transporter) {
      // ── Nodemailer SMTP ───────────────────────────────
      const maxRetries = 3;
      const timeoutMs = 10000;
      let attempts = 0;
      let sentSuccessfully = false;
      let lastError = null;

      while (attempts < maxRetries && !sentSuccessfully) {
        attempts++;
        try {
          await Promise.race([
            transporter.sendMail({
              from: `"Aculion Website" <${smtpUser}>`,
              to: RECIPIENT,
              replyTo: email,
              subject,
              text,
              html,
            }),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error('SMTP timeout')), timeoutMs)
            ),
          ]);
          sentSuccessfully = true;
          console.log(`✅ Email sent via SMTP (attempt ${attempts})`);
        } catch (err) {
          lastError = err;
          console.error(`❌ SMTP attempt ${attempts} failed:`, err.message);
          if (attempts < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, attempts * 1000));
          }
        }
      }

      if (sentSuccessfully) {
        return res.json({ success: true, message: 'Your inquiry has been submitted successfully.' });
      } else {
        console.error('All SMTP attempts failed. Last error:', lastError?.message);
        return res.status(500).json({
          success: false,
          message: 'Unable to send your inquiry right now. Please try again later.',
        });
      }

    } else {
      // ── No email provider configured ──────────────────
      console.error('❌ No email provider configured (set RESEND_API_KEY or SMTP_USER/SMTP_PASS in .env)');
      return res.status(500).json({
        success: false,
        message: 'Unable to send your inquiry right now. Please try again later.',
      });
    }
  } catch (err) {
    console.error('❌ Unexpected email error:', err);
    return res.status(500).json({
      success: false,
      message: 'Unable to send your inquiry right now. Please try again later.',
    });
  }
});

// ── Location Intelligence Spatial Endpoints ──────────────────
app.get('/api/v1/analyze', (req, res) => {
  const latitude = parseFloat(req.query.latitude) || 13.0827;
  const longitude = parseFloat(req.query.longitude) || 80.2707;
  const radius = parseInt(req.query.radius, 10) || 1000;

  const areaName = "Anna Nagar - Shanthi Colony Junction";
  res.json({
    latitude,
    longitude,
    radius,
    area: areaName,
    features: {
      poi_density: 142,
      road_density: 18.4,
      junction_density: 12.5,
      transit_accessibility: 84,
      commercial_density: 88,
      residential_density: 38.5,
      green_cover_ratio: 14.2,
      competition_index: 44,
      walkability: 82,
      land_use_mix: 78,
      population_proxy: 45000,
      building_density: 64,
      total_pois: 52,
      bus_count: 8,
      metro_count: 2,
      rail_count: 1,
      bank_count: 6,
      restaurant_count: 14,
      office_count: 9,
      shopping_count: 11,
      road_length_m: radius * 6.2,
      area_km2: 3.14
    },
    kpis: {
      overall_score: 87,
      accessibility: 85,
      commercial_potential: 89,
      residential_density: 68,
      transit_connectivity: 84,
      green_coverage: 45,
      building_density: 74,
      competition_level: 42,
      footfall_potential: 89,
      ai_confidence: 91
    },
    top_recommendations: [
      {
        category: "Automotive & Electric Vehicles",
        score: 92,
        confidence: 94,
        reason: "High vehicular traffic density along major commercial artery with elevated high-income commuter volume."
      },
      {
        category: "E-Commerce & Quick Commerce",
        score: 88,
        confidence: 90,
        reason: "Dense millennial residential presence with high Smartphone & digital payment adoption."
      },
      {
        category: "Banking, Insurance & FinTech",
        score: 84,
        confidence: 86,
        reason: "Multiple financial institutions within 400m radius creating ideal environment for financial product messaging."
      }
    ],
    explanation: {
      positive: [
        "Major transit junction with high pedestrian and vehicular throughput",
        "High concentration of retail and commercial establishments within viewing cone"
      ],
      negative: [
        "Moderate visual clutter from adjacent retail signage"
      ],
      summary: "High-yield commercial site with prime visibility across daily commuters and shoppers."
    },
    poi_distribution: [
      { category: "Retail & Shopping", count: 18, density: 42, percentage: 32, weighted_score: 88 },
      { category: "Restaurants & Dining", count: 14, density: 31, percentage: 25, weighted_score: 82 },
      { category: "Corporate & Offices", count: 9, density: 20, percentage: 16, weighted_score: 74 },
      { category: "Banking & Financial", count: 6, density: 13, percentage: 11, weighted_score: 79 }
    ],
    land_use_distribution: [
      { name: "Commercial", value: 42 },
      { name: "Residential", value: 32 },
      { name: "Transit & Infrastructure", value: 16 },
      { name: "Green & Open Spaces", value: 10 }
    ],
    road_analytics: {
      connectivity: 88,
      accessibility: 84,
      walkability: 82,
      trafficDensity: 91,
      roadQuality: 86,
      publicTransport: 85
    },
    heatmap_points: Array.from({ length: 30 }, (_, i) => ({
      lat: latitude + (Math.random() - 0.5) * 0.01,
      lng: longitude + (Math.random() - 0.5) * 0.01,
      intensity: 0.3 + Math.random() * 0.7
    })),
    poi_locations: [
      { name: "Anna Nagar Tower Metro", type: "transit", lat: latitude + 0.002, lng: longitude + 0.003 },
      { name: "Nexus Vijaya Mall", type: "retail", lat: latitude - 0.003, lng: longitude + 0.001 },
      { name: "HDFC Regional Hub", type: "bank", lat: latitude + 0.001, lng: longitude - 0.002 }
    ]
  });
});

app.get('/api/v1/area/metadata', (_req, res) => {
  res.json({
    places: [
      { name: "Anna Nagar", latitude: 13.0827, longitude: 80.2707 },
      { name: "Nungambakkam", latitude: 13.0617, longitude: 80.2422 },
      { name: "OMR IT Corridor", latitude: 12.9701, longitude: 80.2443 },
      { name: "T-Nagar", latitude: 13.0360, longitude: 80.2335 }
    ],
    categories: ["Retail", "Restaurants", "Corporate Offices", "Banking", "Transit Hubs"]
  });
});

app.get('/api/v1/area/detect', (req, res) => {
  res.json({ area: "Anna Nagar - Shanthi Colony Junction" });
});

// ── Health check ────────────────────────────────────────────
app.get('/api/health', (_req, res) => res.json({
  status: 'ok',
  provider: useResend ? 'resend' : useSMTP ? 'smtp' : 'none',
  timestamp: new Date().toISOString(),
}));

// ── Start ───────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀  Aculion email server running at http://localhost:${PORT}`);
  console.log(`📧  Emails will be sent to: ${RECIPIENT}`);
  console.log(`🔧  Provider: ${useResend ? 'Resend API' : useSMTP ? 'SMTP (Nodemailer)' : '⚠  NO PROVIDER'}\n`);
});
