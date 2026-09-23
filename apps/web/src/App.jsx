import React, { useState, useRef, useEffect } from 'react';
import RoadmapTimeline from './components/RoadmapTimeline';
import LiveDashboard from './components/LiveDashboard';
import PrivacyFirstPreview from './components/PrivacyFirstPreview';
import HeroCityAnalytics from './components/HeroCityAnalytics';
import SmartCityBackground from './components/SmartCityBackground';
import BrandPortal from './components/BrandPortal';
import MediaOwnerPage from './components/MediaOwnerPage';
import DemoDashboardPage from './components/DemoDashboardPage';
import LocationIntelligence from './pages/LocationIntelligence';
import ContactSection from './components/ContactSection';
import newLogo from './assets/aculion_logo_transparent.png';
import { supabase, resolveUserRoleFromSupabase } from './services/supabase';
import SignInPage from './pages/SignInPage';
import MediaProfilePage from './pages/MediaProfilePage';
import BookDemoModal from './components/BookDemoModal';
import { billboardService } from './services/billboard.service';
import SEOHead from './components/SEOHead';
import InsightsPage from './components/InsightsPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import TermsOfServicePage from './pages/TermsOfServicePage';

const INITIAL_BILLBOARDS = [
  {
    id: 'ACU-BB-0001',
    billboard_code: 'ACU-BB-0001',
    name: 'Testing Billboard -1',
    billboard_name: 'Testing Billboard -1',
    location: 'Injabakkam',
    address: 'Swastik Avenue, Injabakkam',
    street_address: 'Swastik Avenue',
    city: 'Chennai',
    state: 'Tamil Nadu',
    country: 'India',
    width: '40 ft',
    height: '20 ft',
    size: '40 ft × 20 ft',
    type: 'Digital Billboard',
    screenType: 'High-Brightness Outdoor LED',
    status: 'Active',
    latitude: 13.0827,
    longitude: 80.2707,
    camera_ff_code: 'CAM-FF-001',
    image: '/anna_nagar_location.png',
    feedImage: '/anna_nagar_feed.png'
  },
  {
    id: 'ACU-BB-0002',
    billboard_code: 'ACU-BB-0002',
    name: 'Testing Billboard -2',
    billboard_name: 'Testing Billboard -2',
    location: 'Injabakkam',
    address: 'Swastik Avenue, Injabakkam',
    street_address: 'Swastik Avenue',
    city: 'Chennai',
    state: 'Tamil Nadu',
    country: 'India',
    width: '50 ft',
    height: '25 ft',
    size: '50 ft × 25 ft',
    type: 'Static Billboard',
    screenType: 'High-Brightness Outdoor LED',
    status: 'Active',
    latitude: 13.0827,
    longitude: 80.2707,
    camera_ff_code: 'CAM-FF-002',
    image: '/blog_attention_metrics.png',
    feedImage: '/anna_nagar_feed.png'
  },
  {
    id: 'ACU-BB-0003',
    billboard_code: 'ACU-BB-0003',
    name: 'Testing billboard -3',
    billboard_name: 'Testing billboard -3',
    location: 'Injabakkam',
    address: 'Swastik Avenue, Injabakkam',
    street_address: 'Swastik Avenue',
    city: 'Chennai',
    state: 'Tamil Nadu',
    country: 'India',
    width: '30 ft',
    height: '15 ft',
    size: '30 ft × 15 ft',
    type: 'Static Billboard',
    screenType: 'LED Outdoor Display',
    status: 'Active',
    latitude: 13.0827,
    longitude: 80.2707,
    camera_ff_code: 'CAM-FF-003',
    image: '/blog_billboard_roi.png',
    feedImage: '/anna_nagar_feed.png'
  },
  {
    id: 'ACU-BB-0004',
    billboard_code: 'ACU-BB-0004',
    name: 'Sholinganalur',
    billboard_name: 'Sholinganalur',
    location: 'Dollar stop',
    address: '5E/7, Kirubai Nagar, Dollar Stop',
    street_address: '5E/7, Kirubai Nagar',
    city: 'Chennai',
    state: 'Tamil Nadu',
    country: 'India',
    width: '60 ft',
    height: '30 ft',
    size: '60 ft × 30 ft',
    type: 'Digital Billboard',
    screenType: 'P4 Outdoor LED',
    status: 'Active',
    latitude: 13.0827,
    longitude: 80.2707,
    camera_ff_code: 'CAM-FF-004',
    image: '/blog_smart_city.png',
    feedImage: '/anna_nagar_feed.png'
  }
];

const hashPassword = async (password) => {
  const msgBuffer = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
};

const generateNextRegNumber = () => {
  const users = JSON.parse(localStorage.getItem('aculion_users') || '[]');
  let maxNum = 1233;
  users.forEach(u => {
    if (u.regNumber && u.regNumber.startsWith('ACU-')) {
      const numPart = parseInt(u.regNumber.replace('ACU-', ''), 10);
      if (!isNaN(numPart) && numPart > maxNum) {
        maxNum = numPart;
      }
    }
  });
  return `ACU-${maxNum + 1}`;
};

export default function App() {
  const [route, setRoute] = useState(window.location.pathname);

  useEffect(() => {
    const handleLocationChange = () => {
      setRoute(window.location.pathname);
    };
    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  const navigateTo = (e, path) => {
    if (e) e.preventDefault();
    window.history.pushState(null, '', path);
    setRoute(path);
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  // ── Offset-aware smooth scroll (accounts for fixed header) ──
  const scrollToSection = (sectionId) => {
    const el = document.getElementById(sectionId);
    if (!el) return;
    const headerHeight = document.querySelector('.main-header')?.offsetHeight || 72;
    const top = el.getBoundingClientRect().top + window.scrollY - headerHeight - 16;
    window.scrollTo({ top, behavior: 'smooth' });
  };

  const handleNavLinkClick = (e, path, sectionId) => {
    if (e) e.preventDefault();
    if (sectionId) {
      const el = document.getElementById(sectionId);
      if (el) {
        scrollToSection(sectionId);
        return;
      }
    }
    if (route !== path) {
      window.history.pushState(null, '', path);
      setRoute(path);
      window.scrollTo({ top: 0, behavior: 'instant' });
      if (sectionId) setTimeout(() => scrollToSection(sectionId), 120);
    } else if (sectionId) {
      scrollToSection(sectionId);
    }
  };

  // ── Active nav section tracker (IntersectionObserver) ─────
  const [activeSection, setActiveSection] = useState('');
  const [contactInquiryType, setContactInquiryType] = useState('Contact Sales');
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);

  const handleContactNavigation = (inquiryType = 'Contact Sales') => {
    setContactInquiryType(inquiryType);
    scrollToSection('contact-section');
  };

  const handleDemoNavigation = (e) => {
    if (e) e.preventDefault();
    setIsDemoModalOpen(true);
  };

  useEffect(() => {
    if (route === '/book-demo') {
      setIsDemoModalOpen(true);
    }
  }, [route]);

  useEffect(() => {
    const sectionIds = ['hero', 'features', 'solutions', 'services', 'about', 'contact-section', 'footer'];
    const observers = [];
    const visibleMap = {};

    const pick = () => {
      // Choose the section with the smallest positive top offset (highest on screen)
      let best = '';
      let bestTop = Infinity;
      for (const id of sectionIds) {
        if (visibleMap[id]) {
          const el = document.getElementById(id);
          if (el) {
            const top = Math.abs(el.getBoundingClientRect().top);
            if (top < bestTop) { bestTop = top; best = id; }
          }
        }
      }
      setActiveSection(best);
    };

    sectionIds.forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => {
          visibleMap[id] = entry.isIntersecting;
          pick();
        },
        { threshold: 0.15 }
      );
      obs.observe(el);
      observers.push(obs);
    });

    return () => observers.forEach(o => o.disconnect());
  }, [route]);

  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return localStorage.getItem('aculion_current_user') !== null;
  });
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('aculion_current_user');
    return stored ? JSON.parse(stored) : null;
  });

  const [authErrorMessage, setAuthErrorMessage] = useState('');

  // Supabase Auth listener with 3-table master role mapping
  useEffect(() => {
    // Derive user profile info from Supabase auth metadata only
    // (user_profile_master table has been dropped)
    const getUserProfileFromMetadata = (email, metadata) => ({
      name: metadata?.fullName || metadata?.name || email.split('@')[0],
      company: metadata?.company || 'Aculion Partner'
    });

    const handleSessionChange = async (session) => {
      if (!session) {
        setIsLoggedIn(false);
        setUser(null);
        localStorage.removeItem('aculion_current_user');
        return;
      }

      // Check 3 master tables: admin_master -> billboard_owner_master -> brand_owner_master
      const roleResult = await resolveUserRoleFromSupabase(session.user);

      if (roleResult.accessDenied) {
        console.warn('[Auth] Access denied:', roleResult.error);
        setAuthErrorMessage(roleResult.error || 'Access Denied: Account not registered in master role tables.');
        await supabase.auth.signOut();
        setIsLoggedIn(false);
        setUser(null);
        localStorage.removeItem('aculion_current_user');
        if (window.location.pathname !== '/sign-in') {
          window.history.pushState(null, '', '/sign-in');
          setRoute('/sign-in');
        }
        return;
      }

      setAuthErrorMessage('');
      setIsLoggedIn(true);
      const metadata = session.user.user_metadata || {};
      const profileInfo = getUserProfileFromMetadata(session.user.email, metadata);
      const u = {
        email: session.user.email,
        name: roleResult.username || profileInfo.name || metadata.fullName || metadata.name || session.user.email.split('@')[0],
        company: profileInfo.company || metadata.company || 'Aculion Partner',
        role: roleResult.role,
      };
      setUser(u);
      localStorage.setItem('aculion_current_user', JSON.stringify(u));

      // Redirect based on role after sign-in
      if (window.location.pathname === '/sign-in') {
        const targetPath = roleResult.targetPath || '/media-profile';
        window.history.pushState(null, '', targetPath);
        setRoute(targetPath);
      }
    };

    // 1. Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      handleSessionChange(session);
    });

    // 2. Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      handleSessionChange(session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // ── Billboards & Asset Management State ──
  const [billboards, setBillboards] = useState([]);
  const [selectedBillboard, setSelectedBillboard] = useState(null);

  // Fetch billboards via billboard service on mount and when user session changes
  useEffect(() => {
    billboardService.getBillboards().then((rows) => {
      if (rows && rows.length > 0) {
        setBillboards(rows);
        // Find if there is a billboard code in the current URL path
        const dashMatch = window.location.pathname.match(/^\/([^/]+)\/([^/]+)\/dashboard(?:\/[^/]*)?$/);
        const urlBbCode = dashMatch ? dashMatch[2] : null;
        const urlBillboard = urlBbCode ? rows.find(b => (b.billboard_code === urlBbCode || b.id === urlBbCode)) : null;

        setSelectedBillboard((prev) => {
          if (urlBillboard) return urlBillboard;
          const stillExists = prev && rows.find(b => (b.billboard_code || b.id) === (prev.billboard_code || prev.id));
          return stillExists ? prev : rows[0];
        });
      }
    }).catch((err) => {
      console.error('[App] Billboard fetch error:', err);
    });
  }, [isLoggedIn, user?.email]);

  // ── URL helpers ──────────────────────────────────────────
  // Converts a display name to a URL-safe slug (e.g. "Aculion Dev Admin" → "aculion-dev-admin")
  const slugify = (str) =>
    (str || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  // Derive a stable URL slug from the logged-in user (prefers name, falls back to email prefix)
  const getUserSlug = (u) =>
    slugify(u?.name || u?.email?.split('@')[0] || 'user');

  // Route pattern matchers
  const MEDIA_PROFILE_RE = /^\/([^/]+)\/media-profile\/?$/;
  const DASHBOARD_RE     = /^\/([^/]+)\/([^/]+)\/dashboard(?:\/[^/]*)?$/;

  const handleSelectBillboard = (billboard) => {
    setSelectedBillboard(billboard);
    localStorage.setItem('aculion_selected_billboard', JSON.stringify(billboard));
    const slug   = getUserSlug(user);
    const bbCode = billboard.billboard_code || billboard.id || 'bb';
    const path   = `/${slug}/${bbCode}/dashboard/audience-intelligence`;
    window.history.pushState(null, '', path);
    setRoute(path);
  };

  const handleAddBillboard = (newAsset) => {
    setBillboards(prev => [...prev, newAsset]);
  };

  // Auth protection and route redirection effect
  useEffect(() => {
    const mpMatch   = MEDIA_PROFILE_RE.test(route);
    const dashMatch = DASHBOARD_RE.test(route);

    if (!isLoggedIn) {
      // Redirect unauthenticated users away from protected routes
      if (mpMatch || dashMatch || route === '/demo-dashboard' || route === '/location-intelligence') {
        window.history.pushState(null, '', '/sign-in');
        setRoute('/sign-in');
      }
    } else {
      const mySlug = getUserSlug(user);

      if (route === '/sign-in' || route === '/media-profile') {
        // After sign-in, go to the user-scoped media-profile
        if (user?.role === 'Brand Advertiser') {
          navigateTo(null, '/demo-dashboard');
        } else {
          navigateTo(null, `/${mySlug}/media-profile/`);
        }
      } else if (mpMatch) {
        // Ownership check: wrong user in URL → redirect to correct URL
        const urlSlug = route.split('/')[1];
        if (urlSlug !== mySlug) {
          navigateTo(null, `/${mySlug}/media-profile/`);
        }
      } else if (dashMatch) {
        // Ownership check for dashboard routes
        const urlSlug = route.split('/')[1];
        if (urlSlug !== mySlug) {
          navigateTo(null, `/${mySlug}/media-profile/`);
        }
        // Ensure a billboard is selected
        if (!selectedBillboard) {
          setSelectedBillboard(billboards[0] || INITIAL_BILLBOARDS[0]);
        }
      } else if (route === '/location-intelligence') {
        if (!selectedBillboard) {
          setSelectedBillboard(billboards[0] || INITIAL_BILLBOARDS[0]);
        }
      }
    }
  }, [isLoggedIn, route, user?.role, selectedBillboard, billboards]);

  // Modals state
  const [showRegister, setShowRegister] = useState(false);
  const [showSignin, setShowSignin] = useState(false);
  const [solutionTab, setSolutionTab] = useState('brands');
  const [servicesTabIdx, setServicesTabIdx] = useState(0);

  // Profile dropdown state
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const closeTimerRef = useRef(null);
  const openTimerRef = useRef(null);

  // Register step timeline
  const [regStep, setRegStep] = useState(1);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [company, setCompany] = useState('');
  const [regNumber, setRegNumber] = useState('');
  const [regNumberError, setRegNumberError] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState(false);
  const [role, setRole] = useState('Media Owner (Billboard Operator)');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [otpError, setOtpError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passError, setPassError] = useState('');
  const [confirmError, setConfirmError] = useState('');
  const [successProgress, setSuccessProgress] = useState(0);

  // Searchable countries list for Phone Number input selector
  const countries = [
    { name: 'India', code: '+91', flag: '🇮🇳', minLen: 10, maxLen: 10, placeholder: '98765 43210' },
    { name: 'United States', code: '+1', flag: '🇺🇸', minLen: 10, maxLen: 10, placeholder: '(201) 555-0123' },
    { name: 'United Kingdom', code: '+44', flag: '🇬🇧', minLen: 10, maxLen: 10, placeholder: '7911 123456' },
    { name: 'Australia', code: '+61', flag: '🇦🇺', minLen: 9, maxLen: 9, placeholder: '412 345 678' },
    { name: 'Singapore', code: '+65', flag: '🇸🇬', minLen: 8, maxLen: 8, placeholder: '8123 4567' },
    { name: 'Germany', code: '+49', flag: '🇩🇪', minLen: 10, maxLen: 11, placeholder: '151 23456789' },
    { name: 'Canada', code: '+1', flag: '🇨🇦', minLen: 10, maxLen: 10, placeholder: '(204) 555-0123' },
    { name: 'United Arab Emirates', code: '+971', flag: '🇦🇪', minLen: 9, maxLen: 9, placeholder: '50 123 4567' }
  ];

  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [phoneIsValid, setPhoneIsValid] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(countries[0]);
  const [countrySearch, setCountrySearch] = useState('');
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const countryDropdownRef = useRef(null);
  const countrySearchRef = useRef(null);

  // Mobile menu toggle
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);



  // Form Validation & Sign In states
  const [signinRegNumber, setSigninRegNumber] = useState('');
  const [signinPassword, setSigninPassword] = useState('');
  const [signinRole, setSigninRole] = useState('');
  const [signinRegNumberError, setSigninRegNumberError] = useState('');
  const [signinPassError, setSigninPassError] = useState('');
  const [signinRoleError, setSigninRoleError] = useState('');
  const [signinSuccessMessage, setSigninSuccessMessage] = useState('');
  const [fullNameError, setFullNameError] = useState('');
  const [companyError, setCompanyError] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');

  // Sign In Redesign states
  const [signinUsername, setSigninUsername] = useState('');
  const [signinEmail, setSigninEmail] = useState('');
  const [signinCompany, setSigninCompany] = useState('');
  const [signinUsernameError, setSigninUsernameError] = useState('');
  const [signinEmailError, setSigninEmailError] = useState('');
  const [signinCompanyError, setSigninCompanyError] = useState('');
  const [signinGeneralError, setSigninGeneralError] = useState('');

  // Forgot Password flow states
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotStep, setForgotStep] = useState(1);
  const [forgotEmailOrRegNumber, setForgotEmailOrRegNumber] = useState('');
  const [forgotEmailOrRegNumberError, setForgotEmailOrRegNumberError] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [forgotOtpError, setForgotOtpError] = useState('');
  const [forgotGeneratedOtp, setForgotGeneratedOtp] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotNewPasswordError, setForgotNewPasswordError] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [forgotConfirmPasswordError, setForgotConfirmPasswordError] = useState('');
  const [forgotSuccessMessage, setForgotSuccessMessage] = useState('');
  const [forgotTargetEmail, setForgotTargetEmail] = useState('');

  React.useEffect(() => {
    const testUser = {
      email: 'connect@aculion.com',
      password: '92c3bb3b439c7907d48ade01205c6bcf46b56df92c8f12f79194cf7011542d67', // SHA-256 of Divyadivya09
      company: 'Aculion Intelligence Corp',
      fullName: 'Aculion',
      role: 'Media Owner (Billboard Operator)',
      regNumber: 'ACU-1234'
    };

    const usersStr = localStorage.getItem('aculion_users');
    if (!usersStr) {
      localStorage.setItem('aculion_users', JSON.stringify([
        testUser,
        {
          email: 'demo@aculion.com',
          password: 'ef92b778bafe4de167db03d65685767312e23b8e7cbf3e5dfd9b3fa47d227c3f', // SHA-256 of password123
          company: 'Demo Corporation',
          fullName: 'Demo User',
          role: 'Media Owner (Billboard Operator)',
          regNumber: 'ACU-1234'
        },
        {
          email: 'brand@aculion.com',
          password: 'ef92b778bafe4de167db03d65685767312e23b8e7cbf3e5dfd9b3fa47d227c3f', // SHA-256 of password123
          company: 'Aculion Brand Partner',
          fullName: 'Brand Advertiser User',
          role: 'Brand Advertiser',
          regNumber: 'ACU-5678'
        },
        {
          email: 'admin@aculion.com',
          password: 'ef92b778bafe4de167db03d65685767312e23b8e7cbf3e5dfd9b3fa47d227c3f', // SHA-256 of password123
          company: 'Aculion HQ',
          fullName: 'Administrator User',
          role: 'Administrator',
          regNumber: 'ACU-9012'
        }
      ]));
    } else {
      try {
        const parsed = JSON.parse(usersStr);
        let updated = false;

        const testUserIdx = parsed.findIndex(u => u.email && u.email.trim().toLowerCase() === 'connect@aculion.com');
        if (testUserIdx === -1) {
          parsed.push(testUser);
          updated = true;
        } else {
          const u = parsed[testUserIdx];
          if (u.regNumber !== 'ACU-1234' || u.password !== testUser.password) {
            parsed[testUserIdx] = { ...u, regNumber: 'ACU-1234', password: testUser.password };
            updated = true;
          }
        }

        parsed.forEach(u => {
          if (u.role === 'owner') { u.role = 'Media Owner (Billboard Operator)'; updated = true; }
          if (u.role === 'brand') { u.role = 'Brand Advertiser'; updated = true; }
          if (u.role === 'admin') { u.role = 'Administrator'; updated = true; }

          if (u.email === 'demo@aculion.com' && !u.regNumber) { u.regNumber = 'ACU-1234'; updated = true; }
          if (u.email === 'brand@aculion.com' && !u.regNumber) { u.regNumber = 'ACU-5678'; updated = true; }
          if (u.email === 'admin@aculion.com' && !u.regNumber) { u.regNumber = 'ACU-9012'; updated = true; }

          if (u.password && u.password.length !== 64) {
            if (u.password === 'password123') {
              u.password = 'ef92b778bafe4de167db03d65685767312e23b8e7cbf3e5dfd9b3fa47d227c3f';
              updated = true;
            }
          }
        });
        if (updated) {
          localStorage.setItem('aculion_users', JSON.stringify(parsed));
        }
      } catch (e) {
        // ignore
      }
    }
  }, []);

  // Close country dropdown on click outside
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (countryDropdownRef.current && !countryDropdownRef.current.contains(event.target)) {
        setShowCountryDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Format phone number dynamically based on selected country rules
  const formatPhoneNumber = (value, country) => {
    const clean = value.replace(/\D/g, '');
    if (country.name === 'India') {
      if (clean.length > 5) {
        return `${clean.slice(0, 5)} ${clean.slice(5, 10)}`;
      }
      return clean;
    }
    if (country.name === 'United States' || country.name === 'Canada') {
      if (clean.length > 6) {
        return `${clean.slice(0, 3)} ${clean.slice(3, 6)} ${clean.slice(6, 10)}`;
      }
      if (clean.length > 3) {
        return `${clean.slice(0, 3)} ${clean.slice(3, 6)}`;
      }
      return clean;
    }
    if (clean.length > 7) {
      return `${clean.slice(0, 4)} ${clean.slice(4, 7)} ${clean.slice(7, 11)}`;
    }
    if (clean.length > 4) {
      return `${clean.slice(0, 4)} ${clean.slice(4, 8)}`;
    }
    return clean;
  };

  const validatePhone = (value, country) => {
    const clean = value.replace(/\D/g, '');
    const isValid = clean.length >= country.minLen && clean.length <= country.maxLen;
    setPhoneIsValid(isValid);
    if (clean.length > 0 && !isValid) {
      setPhoneError('Please enter a valid mobile number.');
    } else {
      setPhoneError('');
    }
    return isValid;
  };

  const handlePhoneChange = (e) => {
    const input = e.target.value;
    const clean = input.replace(/\D/g, '');
    const formatted = formatPhoneNumber(clean, selectedCountry);
    setPhone(formatted);
    validatePhone(clean, selectedCountry);
  };

  const sendOtpEmail = (emailAddress, otpCode) => {
    console.log(`[ACULION DEBUG] Sent OTP to ${emailAddress}: ${otpCode}`);

    fetch(`https://formsubmit.co/ajax/${emailAddress}`, {
      method: "POST",
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        _subject: "Aculion Console Verification Code",
        message: `Your Aculion Cloud Console verification code is: ${otpCode}. Please enter this code in the registration wizard to complete setup.`
      })
    })
      .then(response => response.json())
      .then(data => {
        console.log("[ACULION DEBUG] FormSubmit Response:", data);
      })
      .catch(err => {
        console.error("[ACULION DEBUG] FormSubmit Error:", err);
      });
  };

  // Simulated validation & step progression
  const handleRegNext = (currentStep) => {
    if (currentStep === 1) {
      let valid = true;

      if (!fullName || fullName.trim().length < 2) {
        setFullNameError('Full name is required (minimum 2 characters).');
        valid = false;
      } else {
        setFullNameError('');
      }

      if (!company || company.trim().length < 2) {
        setCompanyError('Company name is required (minimum 2 characters).');
        valid = false;
      } else {
        setCompanyError('');
      }

      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!email || !emailPattern.test(email)) {
        setEmailError('Please enter a valid business email.');
        valid = false;
      } else {
        const users = JSON.parse(localStorage.getItem('aculion_users') || '[]');
        const cleanEmail = email.trim().toLowerCase();
        const isDuplicate = users.some(u => u.email && u.email.trim().toLowerCase() === cleanEmail);
        if (isDuplicate) {
          setEmailError('This business email is already registered.');
          valid = false;
        } else {
          setEmailError('');
        }
      }

      if (!phone || !phoneIsValid) {
        setPhoneError('Please enter a valid mobile number.');
        valid = false;
      } else {
        setPhoneError('');
      }

      if (!valid) return;

      if (!regNumber) {
        const nextRegNum = generateNextRegNumber();
        setRegNumber(nextRegNum);
      }
    }
    if (currentStep === 2) {
      let valid = true;
      if (!regNumber || !regNumber.startsWith('ACU-')) {
        setRegNumberError('Register Number is missing.');
        valid = false;
      } else {
        setRegNumberError('');
      }

      if (!validatePasswordStrength(password)) {
        setPassError('Password does not meet strength requirements.');
        valid = false;
      } else {
        setPassError('');
      }

      if (password !== confirmPassword) {
        setConfirmError('Passwords do not match.');
        valid = false;
      } else {
        setConfirmError('');
      }

      if (!agreeTerms) {
        valid = false;
      }

      if (!valid) return;

      handleRegisterSubmit();
      return;
    }
    setRegStep(currentStep + 1);
  };

  const handleRegBack = (currentStep) => {
    setRegStep(currentStep - 1);
  };

  const handleOtpChange = (val, idx) => {
    setOtpError('');
    const newOtp = [...otp];
    newOtp[idx] = val.slice(-1);
    setOtp(newOtp);

    // Auto-focus next field
    if (val && idx < 5) {
      const nextInput = document.getElementById(`otp-input-${idx + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleOtpKeyDown = (e, idx) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) {
      const prevInput = document.getElementById(`otp-input-${idx - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  const handleRegisterSubmit = async (e) => {
    if (e) e.preventDefault();

    // Switch to step 3 loader
    setRegStep(3);
    setSuccessProgress(20);

    try {
      const cleanEmail = email.trim().toLowerCase();
      
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: cleanEmail,
        password: password,
        options: {
          data: {
            owner_name: fullName,
            company_name: company
          }
        }
      });

      if (signUpError) {
        setRegStep(2);
        setPassError(signUpError.message || 'Registration failed.');
        setSuccessProgress(0);
        return;
      }

      setSuccessProgress(50);

      // Verify that the trigger created the corresponding billboard_owners record
      let verified = false;
      if (signUpData?.user) {
        for (let i = 0; i < 20; i++) {
          const { data: ownerRecord, error: ownerError } = await supabase
            .from('billboard_owners')
            .select('id')
            .eq('id', signUpData.user.id)
            .maybeSingle();

          if (ownerRecord && ownerRecord.id) {
            verified = true;
            break;
          }
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      if (!verified) {
        setRegStep(2);
        setPassError('Registration succeeded, but billboard owner profile verification timed out. Please try signing in.');
        setSuccessProgress(0);
        return;
      }

      setSuccessProgress(100);

      setTimeout(() => {
        // Clear registration wizard fields
        setRegStep(1);
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setFullName('');
        setCompany('');
        setRegNumber('');
        setRegNumberError('');
        setAgreeTerms(false);
        setShowRegPassword(false);
        setShowRegConfirmPassword(false);
        setRole('Media Owner (Billboard Operator)');
        setOtp(['', '', '', '', '', '']);
        setOtpError('');
        setEmailError('');
        setPassError('');
        setConfirmError('');
        setPhone('');
        setPhoneError('');
        setPhoneIsValid(false);
        setSuccessProgress(0);

        // Close register modal, open signin modal, pre-populate email, show success message
        setShowRegister(false);
        setShowSignin(true);
        setSigninEmail(cleanEmail);
        setSigninSuccessMessage(`Registration Successful! Please use your email and password to sign in.`);
      }, 500);

    } catch (err) {
      console.error('Registration submit error:', err);
      setRegStep(2);
      setPassError('An unexpected error occurred during registration.');
      setSuccessProgress(0);
    }
  };

  const handleSigninSubmit = async (e) => {
    e.preventDefault();
    setSigninGeneralError('');
    setSigninSuccessMessage('');

    // If using custom sign-in form on landing page, support email & password
    const uEmail = (signinEmail || '').trim().toLowerCase();
    const uPass = (signinPassword || '').trim();

    if (!uEmail || !uPass) {
      setSigninGeneralError('Please enter both email and password.');
      return;
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: uEmail,
        password: uPass,
      });

      if (error) {
        setSigninGeneralError(error.message || 'Invalid email or password.');
        return;
      }

      setSigninSuccessMessage('Login successful. Welcome to Aculion Intelligence Console.');

      setTimeout(() => {
        closeAllModals();
      }, 1500);
    } catch (err) {
      console.error('Signin submit error:', err);
      setSigninGeneralError('Invalid email or password.');
    }
  };

  const handleForgotPasswordSubmit = async (e) => {
    e.preventDefault();

    if (forgotStep === 1) {
      const input = forgotEmailOrRegNumber.trim();
      if (!input) {
        setForgotEmailOrRegNumberError('Please enter your business email or register number.');
        return;
      }

      const users = JSON.parse(localStorage.getItem('aculion_users') || '[]');
      const matchedUser = users.find(u =>
        (u.email && u.email.trim().toLowerCase() === input.toLowerCase()) ||
        (u.regNumber && u.regNumber.trim().toUpperCase() === input.toUpperCase())
      );

      if (!matchedUser) {
        setForgotEmailOrRegNumberError('No account found with this email or register number.');
        return;
      }

      const userEmail = matchedUser.email;
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      setForgotGeneratedOtp(otpCode);
      setForgotTargetEmail(userEmail);

      // Simulate sending OTP/reset link
      sendOtpEmail(userEmail, otpCode);

      setForgotSuccessMessage(`Verification code sent to your registered email: ${userEmail}`);
      setForgotStep(2);
      return;
    }

    if (forgotStep === 2) {
      const code = forgotOtp.trim();
      if (code !== forgotGeneratedOtp) {
        setForgotOtpError('Invalid OTP code. Please check your email and try again.');
        return;
      }

      setForgotOtpError('');
      setForgotSuccessMessage('Security code verified. Please enter your new password.');
      setForgotStep(3);
      return;
    }

    if (forgotStep === 3) {
      let valid = true;
      if (!validatePasswordStrength(forgotNewPassword)) {
        setForgotNewPasswordError('Password does not meet strength requirements (min 8 chars, 1 uppercase, 1 lowercase, 1 number).');
        valid = false;
      } else {
        setForgotNewPasswordError('');
      }

      if (forgotNewPassword !== forgotConfirmPassword) {
        setForgotConfirmPasswordError('Passwords do not match.');
        valid = false;
      } else {
        setForgotConfirmPasswordError('');
      }

      if (!valid) return;

      const hashed = await hashPassword(forgotNewPassword);
      const users = JSON.parse(localStorage.getItem('aculion_users') || '[]');
      const updatedUsers = users.map(u => {
        if (u.email && u.email.trim().toLowerCase() === forgotTargetEmail.toLowerCase()) {
          return { ...u, password: hashed };
        }
        return u;
      });

      localStorage.setItem('aculion_users', JSON.stringify(updatedUsers));

      closeAllModals();
      setShowSignin(true);
      setSigninSuccessMessage('Password updated successfully. Please sign in with your registered details.');
    }
  };

  const resendForgotOtp = () => {
    if (!forgotTargetEmail) return;
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    setForgotGeneratedOtp(otpCode);
    sendOtpEmail(forgotTargetEmail, otpCode);
    setForgotOtpError('A new security code has been sent.');
  };

  const loginAction = (userEmail, userCompany, userRole = 'Media Owner (Billboard Operator)', userName = '') => {
    const userData = {
      email: userEmail,
      name: userName || userEmail.split('@')[0],
      company: userCompany,
      role: userRole
    };
    setUser(userData);
    setIsLoggedIn(true);
    localStorage.setItem('aculion_current_user', JSON.stringify(userData));
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setIsLoggedIn(false);
    setDropdownOpen(false);
    localStorage.removeItem('aculion_current_user');
    navigateTo(null, '/');
  };


  // ── Profile Dropdown Logic ──
  const scheduleOpen = () => {
    clearTimeout(closeTimerRef.current);
    openTimerRef.current = setTimeout(() => setDropdownOpen(true), 100);
  };

  const scheduleClose = () => {
    clearTimeout(openTimerRef.current);
    closeTimerRef.current = setTimeout(() => setDropdownOpen(false), 350);
  };

  const cancelClose = () => {
    clearTimeout(closeTimerRef.current);
  };

  const toggleDropdown = () => {
    clearTimeout(openTimerRef.current);
    clearTimeout(closeTimerRef.current);
    setDropdownOpen(prev => !prev);
  };

  // Close on click outside
  React.useEffect(() => {
    if (!dropdownOpen) return;
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    const handleEsc = (e) => {
      if (e.key === 'Escape') setDropdownOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [dropdownOpen]);



  // Keyboard navigation inside dropdown
  const handleDropdownKeyDown = (e) => {
    if (!dropdownOpen) return;
    const items = dropdownRef.current?.querySelectorAll('.dropdown-item');
    if (!items) return;
    const arr = Array.from(items);
    const focused = document.activeElement;
    const idx = arr.indexOf(focused);
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      arr[(idx + 1) % arr.length]?.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      arr[(idx - 1 + arr.length) % arr.length]?.focus();
    }
  };
  // ── /Profile Dropdown Logic ──

  const closeAllModals = () => {
    setShowRegister(false);
    setShowSignin(false);
    setShowForgotPassword(false);
    // Reset wizard fields
    setRegStep(1);
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setFullName('');
    setCompany('');
    setRegNumber('');
    setRegNumberError('');
    setAgreeTerms(false);
    setShowRegPassword(false);
    setShowRegConfirmPassword(false);
    setRole('Media Owner (Billboard Operator)');
    setOtp(['', '', '', '', '', '']);
    setOtpError('');
    setEmailError('');
    setPassError('');
    setConfirmError('');
    setSigninRegNumber('');
    setSigninPassword('');
    setSigninRole('');
    setSigninRegNumberError('');
    setSigninPassError('');
    setSigninRoleError('');
    setSigninSuccessMessage('');
    setFullNameError('');
    setCompanyError('');
    setPhone('');
    setPhoneError('');
    setPhoneIsValid(false);
    setSuccessProgress(0);

    // Reset Sign In Redesign states
    setSigninUsername('');
    setSigninEmail('');
    setSigninCompany('');
    setSigninUsernameError('');
    setSigninEmailError('');
    setSigninCompanyError('');
    setSigninGeneralError('');

    // Reset Forgot Password states
    setForgotStep(1);
    setForgotEmailOrRegNumber('');
    setForgotEmailOrRegNumberError('');
    setForgotOtp('');
    setForgotOtpError('');
    setForgotGeneratedOtp('');
    setForgotNewPassword('');
    setForgotNewPasswordError('');
    setForgotConfirmPassword('');
    setForgotConfirmPasswordError('');
    setForgotSuccessMessage('');
    setForgotTargetEmail('');
  };

  const triggerResendOtp = () => {
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(otpCode);
    sendOtpEmail(email, otpCode);
    setOtpError('A new security code has been resent to your email.');
  };

  const isSlide1Valid =
    fullName && fullName.trim().length >= 2 &&
    company && company.trim().length >= 2 &&
    email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) &&
    phone && phoneIsValid;

  const validatePasswordStrength = (pass) => {
    if (!pass) return false;
    const hasUpper = /[A-Z]/.test(pass);
    const hasLower = /[a-z]/.test(pass);
    const hasDigit = /[0-9]/.test(pass);
    return pass.length >= 8 && hasUpper && hasLower && hasDigit;
  };

  const isSlide2Valid =
    regNumber && regNumber.startsWith('ACU-') &&
    validatePasswordStrength(password) &&
    password === confirmPassword &&
    agreeTerms;

  if (MEDIA_PROFILE_RE.test(route) || route === '/media-profile') {
    return (
      <>
        <SEOHead route={route} />
        <MediaProfilePage
          user={user}
          billboards={billboards}
          onSelectBillboard={handleSelectBillboard}
          onAddBillboard={handleAddBillboard}
          onLogout={handleLogout}
          navigateTo={navigateTo}
        />
      </>
    );
  }

  if (DASHBOARD_RE.test(route) || route === '/location-intelligence' || route === '/dashboard' || route.startsWith('/dashboard/')) {
    // Build baseDashboardPath from the new scoped URL, e.g. /developer/ACU-BB-1645/dashboard
    const dashParts = route.split('/');
    const dashIdx   = dashParts.indexOf('dashboard');
    const baseDashboardPath = dashIdx > 0
      ? dashParts.slice(0, dashIdx + 1).join('/')
      : `/dashboard`;
    return (
      <>
        <SEOHead route={route} />
        <LiveDashboard
          navigateTo={navigateTo}
          selectedBillboard={selectedBillboard}
          billboards={billboards}
          user={user}
          onSelectBillboard={handleSelectBillboard}
          onAddNewMedia={handleAddBillboard}
          baseDashboardPath={baseDashboardPath}
          onBackToProfile={() => navigateTo(null, `/${getUserSlug(user)}/media-profile/`)}
        />
      </>
    );
  }

  if (route === '/demo-dashboard') {
    return (
      <>
        <SEOHead route={route} />
        <DemoDashboardPage navigateTo={navigateTo} />
      </>
    );
  }

  return (
    <div className={isLoggedIn ? 'logged-in' : 'logged-out'}>
      {/* Route-Aware Dynamic SEO Metadata System */}
      <SEOHead route={route} />

      {/* Global Full-Screen 3D Smart City Background */}
      <SmartCityBackground />

      {/* Background Orbs */}
      <div className="bg-glow bg-glow-1"></div>
      <div className="bg-glow bg-glow-2"></div>
      <div className="bg-glow bg-glow-3"></div>

      {/* Header */}
      <header className="main-header">
        <div className="header-container">
          <a href="#" className="logo">
            <img src={newLogo} alt="Aculion Logo" className="logo-img" />
          </a>

          {(!user || (user.role !== 'Brand Advertiser' && user.role !== 'Administrator')) && (
            <nav className="nav-links">
              <a href="/" onClick={(e) => handleNavLinkClick(e, '/', 'hero')} className={`nav-item ${activeSection === 'hero' || activeSection === '' ? 'active' : ''}`}>Home</a>
              <a href="#features" onClick={(e) => handleNavLinkClick(e, '/', 'features')} className={`nav-item ${activeSection === 'features' ? 'active' : ''}`}>Features</a>
              <a href="#solutions" onClick={(e) => handleNavLinkClick(e, '/', 'solutions')} className={`nav-item ${activeSection === 'solutions' ? 'active' : ''}`}>Insights</a>
              <a href="#services" onClick={(e) => handleNavLinkClick(e, '/', 'services')} className={`nav-item ${activeSection === 'services' ? 'active' : ''}`}>Services</a>
              <a href="#about" onClick={(e) => handleNavLinkClick(e, '/', 'about')} className={`nav-item ${activeSection === 'about' ? 'active' : ''}`}>About Us</a>
              <a href="#contact-section" onClick={(e) => handleNavLinkClick(e, '/', 'contact-section')} className={`nav-item ${activeSection === 'contact-section' ? 'active' : ''}`}>Contact</a>
            </nav>
          )}

          <div className="auth-buttons">
            {!isLoggedIn ? (
              <>
                <button className="btn btn-demo" onClick={(e) => handleDemoNavigation(e)}>
                  <i className="fa-regular fa-calendar"></i>
                  <span>Book a Demo</span>
                </button>
                <button className="btn btn-primary" onClick={(e) => navigateTo(e, '/sign-in')}>Sign In</button>
              </>
            ) : (
              <div
                className={`user-profile-menu${dropdownOpen ? ' open' : ''}`}
                ref={dropdownRef}
                onMouseEnter={scheduleOpen}
                onMouseLeave={scheduleClose}
                onKeyDown={handleDropdownKeyDown}
              >
                {/* Trigger button */}
                <button
                  className="profile-info"
                  onClick={toggleDropdown}
                  aria-haspopup="true"
                  aria-expanded={dropdownOpen}
                  aria-label="Profile menu"
                >
                  <div className="profile-avatar"><i className="fa-solid fa-user"></i></div>
                  <span className="profile-name">
                    {user?.name ? user.name.charAt(0).toUpperCase() + user.name.slice(1) : 'User'}
                  </span>
                  <i className={`fa-solid fa-chevron-down profile-arrow${dropdownOpen ? ' rotated' : ''}`}></i>
                </button>

                {/* Invisible bridge: fills the gap so mouse can travel from button → menu */}
                {dropdownOpen && (
                  <div
                    className="dropdown-bridge"
                    onMouseEnter={cancelClose}
                    onMouseLeave={scheduleClose}
                  />
                )}

                {/* Dropdown panel */}
                <div
                  className={`profile-dropdown${dropdownOpen ? ' visible' : ''}`}
                  role="menu"
                  aria-label="User menu"
                  onMouseEnter={cancelClose}
                  onMouseLeave={scheduleClose}
                >
                  <a
                    href="/dashboard"
                    className="dropdown-item"
                    role="menuitem"
                    tabIndex={dropdownOpen ? 0 : -1}
                    onClick={(e) => { e.preventDefault(); setDropdownOpen(false); navigateTo(e, '/dashboard'); }}
                  >
                    <i className="fa-solid fa-chart-line"></i> Dashboard
                  </a>
                  <button
                    className="dropdown-item danger-item w-full"
                    role="menuitem"
                    tabIndex={dropdownOpen ? 0 : -1}
                    onClick={handleLogout}
                  >
                    <i className="fa-solid fa-arrow-right-from-bracket"></i> Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>

          {(!user || (user.role !== 'Brand Advertiser' && user.role !== 'Administrator')) && (
            <button className="mobile-menu-toggle" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              <i className={`fa-solid ${mobileMenuOpen ? 'fa-xmark' : 'fa-bars-staggered'}`}></i>
            </button>
          )}
        </div>
      </header>

      {/* Mobile nav drawer */}
      {(!user || (user.role !== 'Brand Advertiser' && user.role !== 'Administrator')) && mobileMenuOpen && (
        <div className="mobile-nav open">
          <a href="/" className={`mobile-nav-item ${activeSection === 'hero' || activeSection === '' ? 'active' : ''}`} onClick={(e) => { setMobileMenuOpen(false); handleNavLinkClick(e, '/', 'hero'); }}>Home</a>
          <a href="#features" className={`mobile-nav-item ${activeSection === 'features' ? 'active' : ''}`} onClick={(e) => { setMobileMenuOpen(false); handleNavLinkClick(e, '/', 'features'); }}>Features</a>
          <a href="#solutions" className={`mobile-nav-item ${activeSection === 'solutions' ? 'active' : ''}`} onClick={(e) => { setMobileMenuOpen(false); handleNavLinkClick(e, '/', 'solutions'); }}>Insights</a>
          <a href="#services" className={`mobile-nav-item ${activeSection === 'services' ? 'active' : ''}`} onClick={(e) => { setMobileMenuOpen(false); handleNavLinkClick(e, '/', 'services'); }}>Services</a>
          <a href="#about" className={`mobile-nav-item ${activeSection === 'about' ? 'active' : ''}`} onClick={(e) => { setMobileMenuOpen(false); handleNavLinkClick(e, '/', 'about'); }}>About Us</a>
          <a href="#contact-section" className={`mobile-nav-item ${activeSection === 'contact-section' ? 'active' : ''}`} onClick={(e) => { setMobileMenuOpen(false); handleNavLinkClick(e, '/', 'contact-section'); }}>Contact</a>
          <div className="mobile-auth-buttons">
            {!isLoggedIn ? (
              <>
                <button className="btn btn-demo w-full" onClick={(e) => { handleDemoNavigation(e); setMobileMenuOpen(false); }}>
                  <i className="fa-regular fa-calendar"></i>
                  <span>Book a Demo</span>
                </button>
                <button className="btn btn-primary w-full" onClick={(e) => { navigateTo(e, '/sign-in'); setMobileMenuOpen(false); }}>Sign In</button>
              </>
            ) : (
              <button className="btn btn-outline w-full" onClick={() => { handleLogout(); setMobileMenuOpen(false); }}>Sign Out</button>
            )}
          </div>
        </div>
      )}

      {/* Logged Out View Gateway */}
      {user?.role === 'Brand Advertiser' ? (
        /* Brand Advertiser Portal */
        <BrandPortal user={user} onLogout={handleLogout} />
      ) : (
        /* Logged Out / Media Owner View */
        <main className="fade-in-content">
          {route === '/media-owner' ? (
            <MediaOwnerPage
              navigateTo={navigateTo}
              isLoggedIn={isLoggedIn}
              setShowRegister={setShowRegister}
              setShowSignin={(val) => {
                if (val) {
                  navigateTo(null, '/sign-in');
                }
              }}
              handleLogout={handleLogout}
              user={user}
            />
          ) : route === '/sign-in' ? (
            <SignInPage
              navigateTo={navigateTo}
              isLoggedIn={isLoggedIn}
              user={user}
              authErrorMessage={authErrorMessage}
              onLoginSuccess={(u) => {
                setUser(u);
                setIsLoggedIn(true);
                const target = '/media-profile';
                window.history.pushState(null, '', target);
                setRoute(target);
              }}
            />
          ) : route === '/forgot-password' ? (
            <div className="signin-page-wrapper">
              <div className="signin-card glass-panel" style={{ textAlign: 'center' }}>
                <div className="signin-logo-container">
                  <img src={newLogo} alt="Aculion" className="signin-logo-img" />
                </div>
                <h2 className="signin-title" style={{ fontSize: '20px', marginBottom: '16px' }}>Forgot Password</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: '1.6', marginBottom: '24px' }}>
                  Please contact system administration to reset your password.
                </p>
                <button className="btn btn-primary w-full" onClick={(e) => navigateTo(e, '/sign-in')}>
                  Back to Sign In
                </button>
              </div>
            </div>
          ) : route === '/privacy-policy' ? (
            <PrivacyPolicyPage navigateTo={navigateTo} />
          ) : route === '/terms-of-service' ? (
            <TermsOfServicePage navigateTo={navigateTo} />
          ) : (route === '/insights' || route.startsWith('/insights/')) ? (
            <InsightsPage
              navigateTo={navigateTo}
              route={route}
              user={user}
              isLoggedIn={isLoggedIn}
              setShowSignin={(val) => {
                if (val) {
                  navigateTo(null, '/sign-in');
                }
              }}
              setShowRegister={setShowRegister}
            />
          ) : (

            <>
              {/* Hero Section */}
              <section id="hero" className="hero-section">
                <div className="section-container hero-container">
                  <div className="hero-content">
                    <div className="hero-accent">
                      <span className="accent-line"></span>
                      <span className="accent-pulse"></span>
                    </div>
                    <div className="hero-title-container">
                      <div className="hero-title-glow"></div>
                      <h1 className="hero-title">The Intelligence<br />Layer for<br />Outdoor<br /><span className="text-gradient">Advertising</span></h1>
                    </div>
                    <p className="hero-subtitle">
                      Aculion is an independent data intelligence provider measuring attention, traffic, and campaign performance across physical billboards in real-time—delivering complete transparency and measurable ROI to outdoor advertising.
                    </p>
                  </div>
                  <HeroCityAnalytics />
                </div>
              </section>

              {/* Metrics bar */}
              <section className="metrics-bar">
                <div className="section-container metrics-container">
                  <div className="metric-item">
                    <h3 className="metric-value">150+</h3>
                    <p className="metric-label"> Active Production Tests</p>
                  </div>
                  <div className="metric-divider"></div>
                  <div className="metric-item">
                    <h3 className="metric-value">10K+</h3>
                    <p className="metric-label">Real-World Traffic Intelligence</p>
                  </div>
                  <div className="metric-divider"></div>
                  <div className="metric-item">
                    <h3 className="metric-value">82,000+</h3>
                    <p className="metric-label">Points of Interest (POIs)</p>
                  </div>
                  <div className="metric-divider"></div>
                  <div className="metric-item">
                    <h3 className="metric-value">92.7%</h3>
                    <p className="metric-label">Vehicle Classification Accuracy</p>
                  </div>
                  <div className="metric-divider"></div>
                  <div className="metric-item">
                    <h3 className="metric-value">100%</h3>
                    <p className="metric-label">Privacy Secure</p>
                  </div>
                </div>
              </section>

              {/* ESOMAR Member Trust Section */}
              <section className="esomar-trust-section">
                <div className="esomar-fade-top"></div>
                <div className="section-container esomar-inner">
                  <div className="esomar-card">
                    <div className="esomar-icon-wrap">
                      <i className="fa-solid fa-shield-halved esomar-icon"></i>
                    </div>
                    <span className="esomar-badge">GLOBAL RESEARCH COMMITMENT</span>
                    <p className="esomar-description">
                      Aculion follows internationally recognized research methodologies inspired by ESOMAR's ethical framework while our membership application is in progress.
                    </p>
                  </div>
                </div>
                <div className="esomar-fade-bottom"></div>
              </section>

              {/* Features Pillar */}
              <section id="features" className="features-section">
                <div className="section-container">
                  <div className="section-header">
                    <span className="section-tag">Key Pillars</span>
                    <h2 className="section-title">Apex-Tier Analytics</h2>
                    <p className="section-desc">High-performance AI designed to process complex physical footprints with clinical precision, safeguarding privacy while uncovering absolute truth.</p>
                  </div>
                  <div className="features-grid">
                    <div className="feature-card">
                      <div className="card-shine"></div>
                      <div className="feature-icon"><i className="fa-solid fa-person-walking"></i></div>
                      <h3 className="feature-title">Traffic Intelligence</h3>
                      <p className="feature-text">Real-time movement intelligence for every road, intersection, and billboard.</p>
                    </div>
                    <div className="feature-card cursor-pointer" onClick={(e) => navigateTo(e, '/location-intelligence')} style={{ cursor: 'pointer' }}>
                      <div className="card-shine"></div>
                      <div className="feature-icon"><i className="fa-solid fa-eye"></i></div>
                      <h3 className="feature-title">Location Intelligence</h3>
                      <p className="feature-text">Deep contextual intelligence about where your media exists.</p>
                    </div>
                    <div className="feature-card">
                      <div className="card-shine"></div>
                      <div className="feature-icon"><i className="fa-solid fa-hourglass-half"></i></div>
                      <h3 className="feature-title">Audience Intelligence</h3>
                      <p className="feature-text">Understand who sees your media and how valuable that audience is</p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Solutions Section */}
              {/* id="insights" alias lets the #insights hash and old references still work */}
              <span id="insights" aria-hidden="true" style={{ position: 'absolute', pointerEvents: 'none' }}></span>
              <section id="solutions" className="solutions-section pt-28 sm:pt-32 lg:pt-[100px] scroll-mt-20">
                <div className="section-container">
                  <div className="section-header relative" style={{ zIndex: 10 }}>
                    <span className="section-tag">Solutions</span>
                    <h2 className="section-title text-4xl sm:text-5xl lg:text-[40px]">Insights That Drive Better Decisions.</h2>
                    <p className="section-desc mt-5 lg:mt-0">Purpose-built, data-driven solutions for media owners and billboard operators.</p>
                  </div>

                  {/* Tab Content: Media Owners */}
                  <div className="solutions-tab-content active">
                    <div className="solutions-intro-card glass-panel">
                      <div className="solutions-intro-icon" style={{ color: '#00f0ff' }}>
                        <i className="fa-solid fa-circle-nodes"></i>
                      </div>
                      <div className="solutions-intro-text">
                        <h3>Every Billboard Has Value. Aculion Helps You Prove It.</h3>
                        <p>For decades, outdoor advertising has relied on estimates instead of evidence. Aculion changes that by transforming every billboard into a measurable, data-driven advertising asset. With real-time traffic, location, and audience insights, media owners can measure performance, optimize inventory utilization, and make smarter pricing decisions.</p>
                        <ul className="solutions-intro-list">
                          <li>
                            <i className="fa-solid fa-circle-check text-cyan"></i>
                            <span>AI-powered traffic and audience intelligence.</span>
                          </li>
                          <li>
                            <i className="fa-solid fa-circle-check text-cyan"></i>
                            <span>Monthly performance reports, available anytime.</span>
                          </li>
                          <li>
                            <i className="fa-solid fa-circle-check text-cyan"></i>
                            <span>Premium listing to attract more advertisers.</span>
                          </li>
                          <li>
                            <i className="fa-solid fa-circle-check text-cyan"></i>
                            <span>Receive direct enquiries from potential advertisers.</span>
                          </li>
                          <li>
                            <i className="fa-solid fa-circle-check text-cyan"></i>
                            <span>Data-backed pricing instead of assumptions.</span>
                          </li>
                          <li>
                            <i className="fa-solid fa-circle-check text-cyan"></i>
                            <span>Turn digital screens into programmatic-ready assets.</span>
                          </li>
                        </ul>
                      </div>
                    </div>

                    <h3 className="solutions-grid-title">Why Media Owners Choose Aculion</h3>
                    <div className="solutions-grid">
                      {[
                        { title: "Increase Advertiser Confidence", desc: "Help advertisers make informed buying decisions by providing transparent, measurable media performance.", icon: "fa-shield-heart" },
                        { title: "Price with Confidence", desc: "Replace guesswork with real intelligence when determining media rates and negotiating campaigns.", icon: "fa-tags" },
                        { title: "Future-Ready Infrastructure", desc: "Prepare your media assets for data-driven and programmatic outdoor advertising as the industry evolves.", icon: "fa-network-wired" },
                        { title: "Turn Data into Revenue", desc: "Demonstrate the true value of your locations with verified traffic intelligence and performance analytics.", icon: "fa-sack-dollar" },
                        { title: "Premium Media Listings", desc: "Stand out on the Aculion platform with verified performance data, making your inventory more discoverable to premium advertisers.", icon: "fa-star" },
                        { title: "Generate Qualified Sales Leads", desc: "Advertisers can discover your media inventory and connect with you directly—bringing new business opportunities without intermediaries.", icon: "fa-envelope-open-text" },
                        { title: "Monthly Performance Reports", desc: "Download professionally designed reports anytime, complete with historical trends and performance insights.", icon: "fa-file-invoice-dollar" },
                        { title: "Understand Your Audience", desc: "Measure traffic volume, vehicle mix, peak hours, dwell patterns, and other key intelligence that helps explain why a location performs.", icon: "fa-chart-pie" },
                      ].map((item, idx) => (
                        <div className="solutions-card glass-panel" key={idx}>
                          <div className="solutions-card-icon"><i className={`fa-solid ${item.icon}`}></i></div>
                          <h4>{item.title}</h4>
                          <p>{item.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Why Aculion Exists Section */}
                  <div className="manifesto-section glass-panel">
                    <div className="manifesto-glow"></div>
                    <div className="manifesto-header">
                      <span className="manifesto-tag">Why Aculion Exists</span>
                      <h3 className="manifesto-title">From Assumptions to <span className="text-gradient">Intelligence</span></h3>
                      <p className="manifesto-desc">Outdoor advertising deserves the same level of measurement and accountability as digital advertising. Aculion is building the independent intelligence platform that empowers every outdoor advertising decision with trusted, AI-driven insights.</p>
                    </div>
                    <div className="manifesto-grid">
                      {[
                        { title: "Real-Time Intelligence", desc: "Measure live traffic, audience, and location insights with AI-powered computer vision.", icon: "fa-bolt", color: "#00f0ff" },
                        { title: "Independent Measurement", desc: "Access transparent, third-party analytics to verify campaign delivery and media performance.", icon: "fa-shield-halved", color: "#8b5cf6" },
                        { title: "Smarter Inventory Planning", desc: "Compare locations, predict campaign performance, and optimize inventory allocation for maximum yield.", icon: "fa-compass", color: "#0052ff" },
                        { title: "Actionable Insights", desc: "Turn complex data into clear recommendations that help maximize campaign performance and ROI.", icon: "fa-chart-line", color: "#10b981" }
                      ].map((item, idx) => (
                        <div className="manifesto-card" key={idx}>
                          <div className="manifesto-card-icon" style={{ color: item.color }}><i className={`fa-solid ${item.icon}`}></i></div>
                          <h4>{item.title}</h4>
                          <p>{item.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              </section>


              {/* Scroll Timeline Component (Roadmap) */}
              <section id="roadmap" className="roadmap-section">
                <div className="section-container">
                  <div className="section-header">
                    <span className="section-tag">Evolution</span>
                    <h2 className="section-title">Building the Future of Outdoor Intelligence</h2>
                    <p className="section-desc">Our roadmap to becoming the world’s independent intelligence platform for outdoor media.</p>
                  </div>
                  <RoadmapTimeline />
                </div>
              </section>

              {/* Services Section */}
              <section id="services" className="services-section scroll-mt-20">

                <div className="section-container" style={{ position: 'relative', zIndex: 10 }}>
                  <div className="section-header text-center" style={{ position: 'relative', zIndex: 10 }}>
                    <span className="section-tag">SERVICES</span>
                    <h2 className="section-title">Simple Pricing. Powerful Intelligence.</h2>
                    <p className="section-desc">Choose the plan that fits your media and transform every billboard into a measurable advertising asset.</p>
                  </div>

                  {/* Tab Contents */}
                  <div className="services-tab-content-active">
                    <div className="services-grid cols-2">
                      {/* Media Owners Card 1 */}
                      <div className="services-card">
                        <div className="services-card-top">
                          <h3 className="services-plan-name">Static Billboard Intelligence</h3>
                          <p className="services-plan-desc">Everything you need to measure, understand, and increase the value of your static billboard.</p>
                          <ul className="services-plan-features">
                            <li><i className="fa-solid fa-check"></i> Live Traffic Intelligence</li>
                            <li><i className="fa-solid fa-check"></i> Audience & Vehicle Insights</li>
                            <li><i className="fa-solid fa-check"></i> Location Intelligence</li>
                            <li><i className="fa-solid fa-check"></i> Peak Hour & Trend Analysis</li>
                            <li><i className="fa-solid fa-check"></i> Historical Performance Data</li>
                            <li><i className="fa-solid fa-check"></i> Monthly Performance Reports</li>
                            <li><i className="fa-solid fa-check"></i> AI-Powered Recommendations</li>
                            <li><i className="fa-solid fa-check"></i> Featured Media Listing</li>
                            <li><i className="fa-solid fa-check"></i> Direct Advertiser Enquiries</li>
                            <li><i className="fa-solid fa-check"></i> Cloud Dashboard Access</li>
                          </ul>
                        </div>
                        <div className="services-card-bottom">
                          <div className="services-best-for">
                            <strong>Best For</strong>
                            Media owners looking to prove billboard performance, attract more advertisers, and increase media value.
                          </div>
                          <button
                            className="btn btn-outline w-full"
                            onClick={() => handleContactNavigation('Contact Sales')}
                          >
                            Get Started
                          </button>
                        </div>
                      </div>

                      {/* Media Owners Card 2 */}
                      <div className="services-card premium">
                        <div className="services-premium-badge">MOST POPULAR</div>
                        <div className="services-card-top">
                          <h3 className="services-plan-name">DOOH Intelligence</h3>
                          <p className="services-plan-desc">Everything in the Static Intelligence plan, plus advanced tools to manage, monetize, and automate your digital screens.</p>
                          <ul className="services-plan-features">
                            <li className="feature-header-extra">Includes everything in Static plan, plus:</li>
                            <li><i className="fa-solid fa-check"></i> Digital Screen Health Monitoring</li>
                            <li><i className="fa-solid fa-check"></i> Campaign Scheduling</li>
                            <li><i className="fa-solid fa-check"></i> Remote Content Management</li>
                            <li><i className="fa-solid fa-check"></i> Live Campaign Reporting</li>
                            <li><i className="fa-solid fa-check"></i> Proof-of-Play Verification</li>
                            <li><i className="fa-solid fa-check"></i> Advertiser Self-Service Booking</li>
                            <li><i className="fa-solid fa-check"></i> Campaign Management Dashboard</li>
                            <li><i className="fa-solid fa-check"></i> Programmatic-Ready Infrastructure</li>
                            <li><i className="fa-solid fa-check"></i> AI-Powered Campaign Optimization</li>
                            <li><i className="fa-solid fa-check"></i> Direct Revenue Opportunities from Advertisers</li>
                          </ul>
                        </div>
                        <div className="services-card-bottom">
                          <div className="services-best-for">
                            <strong>Best For</strong>
                            Digital media owners looking to maximize occupancy, automate operations, and unlock new revenue opportunities.
                          </div>
                          <button
                            className="btn btn-primary w-full"
                            onClick={() => handleContactNavigation('Contact Sales')}
                          >
                            Get Started
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Included with Every Plan */}
                  <div className="included-features-section">
                    <div className="section-header text-center">
                      <h3 className="section-title" style={{ fontSize: '28px' }}>Included with Every Plan</h3>
                    </div>
                    <div className="included-features-grid">
                      <div className="included-feature-card">
                        <div className="included-feature-icon"><i className="fa-solid fa-shield-halved"></i></div>
                        <span className="included-feature-text">Secure Cloud Platform</span>
                      </div>
                      <div className="included-feature-card">
                        <div className="included-feature-icon"><i className="fa-solid fa-chart-line"></i></div>
                        <span className="included-feature-text">Real-Time Dashboard</span>
                      </div>
                      <div className="included-feature-card">
                        <div className="included-feature-icon"><i className="fa-solid fa-rotate"></i></div>
                        <span className="included-feature-text">Automatic Software Updates</span>
                      </div>
                      <div className="included-feature-card">
                        <div className="included-feature-icon"><i className="fa-solid fa-brain"></i></div>
                        <span className="included-feature-text">AI-Powered Insights</span>
                      </div>
                      <div className="included-feature-card">
                        <div className="included-feature-icon"><i className="fa-solid fa-map-location-dot"></i></div>
                        <span className="included-feature-text">Traffic, Audience & Location Intelligence</span>
                      </div>
                      <div className="included-feature-card">
                        <div className="included-feature-icon"><i className="fa-solid fa-chart-simple"></i></div>
                        <span className="included-feature-text">Real-Time Campaign Analytics</span>
                      </div>
                      <div className="included-feature-card">
                        <div className="included-feature-icon"><i className="fa-solid fa-headset"></i></div>
                        <span className="included-feature-text">Dedicated Customer Support</span>
                      </div>
                    </div>
                  </div>

                  {/* Final CTA Section */}
                  <div className="services-cta-section">
                    <div className="services-cta-card">
                      <h3 className="services-cta-title">Measure. Optimize. Grow.</h3>
                      <p className="services-cta-desc">Transform outdoor advertising into measurable business intelligence with an AE platform.</p>
                      <div className="services-cta-actions">
                        <button
                          className="btn btn-primary btn-lg"
                          onClick={() => handleContactNavigation('Book a Demo')}
                        >
                          Book a Demo
                        </button>
                      </div>
                    </div>
                  </div>

                </div>
              </section>

              {/* ── About Us ── */}
              <section id="about" className="about-section">
                <div className="section-container">

                  {/* 1. THE HERO HOOK & TAGLINE */}
                  <div className="section-header about-header" style={{ margin: '0 auto 60px auto', textAlign: 'center', maxWidth: '800px' }}>
                    <span className="section-tag" style={{ margin: '0 auto 16px auto' }}>About Us</span>
                    <h2 className="section-title" style={{ fontSize: '44px', lineHeight: '1.2' }}>
                      We Don't Measure Billboards.<br />
                      We Decode <span className="text-gradient">Attention.</span>
                    </h2>
                    <p className="section-desc" style={{ fontSize: '18px', margin: '16px auto 0 auto', maxWidth: '650px' }}>
                      Transforming Every Physical Advertisement into an Intelligent Digital Experience.
                    </p>
                  </div>

                  {/* 2. TWO CONTENT CARDS (COMPARISON) */}
                  <div className="about-duality-grid">

                    {/* The Old Way */}
                    <div className="about-duality-card about-problem-card">
                      <div className="about-duality-badge problem-badge">
                        <i className="fa-solid fa-triangle-exclamation"></i> The Old Way
                      </div>
                      <h3>Outdoor Advertising Has Been Flying Blind</h3>
                      <ul className="about-callout-list">
                        <li>
                          <i className="fa-solid fa-xmark"></i>
                          <span><strong>Traffic "estimates"</strong> based on decade-old census data</span>
                        </li>
                        <li>
                          <i className="fa-solid fa-xmark"></i>
                          <span><strong>Zero attention metrics</strong> — did anyone even look?</span>
                        </li>
                        <li>
                          <i className="fa-solid fa-xmark"></i>
                          <span><strong>Quarterly reports</strong> that arrive after campaigns are already dead</span>
                        </li>
                        <li>
                          <i className="fa-solid fa-xmark"></i>
                          <span><strong>Millions spent</strong> on gut instinct and hope</span>
                        </li>
                      </ul>
                      <p className="about-callout-punchline">
                        "Spend big, pray hard, measure never." That era is <strong>over</strong>.
                      </p>
                    </div>

                    {/* The Solution (The Aculion Way) */}
                    <div className="about-duality-card about-solution-card">
                      <div className="about-duality-badge solution-badge">
                        <i className="fa-solid fa-rocket"></i> The Aculion Way
                      </div>
                      <h3>Making the Unmeasurable, Unmistakable</h3>
                      <ul className="about-callout-list solution-list">
                        <li>
                          <i className="fa-solid fa-check"></i>
                          <span><strong>Edge-deployed computer vision</strong> — AI that lives on the billboard itself</span>
                        </li>
                        <li>
                          <i className="fa-solid fa-check"></i>
                          <span><strong>Real-time pedestrian & vehicle counting</strong> — not estimates, reality</span>
                        </li>
                        <li>
                          <i className="fa-solid fa-check"></i>
                          <span><strong>Gaze & dwell-time analytics</strong> — who looked, how long, what happened next</span>
                        </li>
                        <li>
                          <i className="fa-solid fa-check"></i>
                          <span><strong>Privacy-first architecture</strong> — GDPR compliant, faces blurred, data encrypted</span>
                        </li>
                      </ul>
                      <p className="about-callout-punchline solution-punchline">
                        Beyond billboards. Into <span className="text-gradient">intelligence.</span>
                      </p>
                    </div>
                  </div>

                </div>
              </section>

            </>
          )}

          {/* Contact Section - rendered only on landing/home views */}
          {route !== '/sign-in' && route !== '/forgot-password' && <ContactSection />}

          {/* Footer */}
          <footer id="footer" className="main-footer">
            <div className="section-container footer-container">
              {/* Column 1: Brand */}
              <div className="footer-brand-column">
                <a href="/" onClick={(e) => handleNavLinkClick(e, '/', 'hero')} className="logo">
                  <img src={newLogo} alt="Aculion Logo" className="logo-img footer-logo-img" />
                </a>
                <p className="footer-desc">Building the intelligence infrastructure for the next generation of Out-of-Home advertising.</p>
                <div className="footer-social-links">
                  <a href="mailto:connect@aculion.com" aria-label="Email Us" className="footer-social-icon"><i className="fa-solid fa-envelope"></i></a>
                  <a href="tel:+919176590590" aria-label="Call Us" className="footer-social-icon"><i className="fa-solid fa-phone"></i></a>
                  <a href="#contact-section" onClick={(e) => handleNavLinkClick(e, route, 'contact-section')} aria-label="Contact Section" className="footer-social-icon"><i className="fa-solid fa-headset"></i></a>
                </div>
              </div>

              {/* Column 2: Product */}
              <div className="footer-links-col">
                <h4 className="footer-col-title">PRODUCT</h4>
                <a href="/insights" onClick={(e) => navigateTo(e, '/insights')}>Insights & Research</a>
                <a href="#features" onClick={(e) => handleNavLinkClick(e, '/', 'features')}>Features</a>
                <a href="#solutions" onClick={(e) => handleNavLinkClick(e, '/', 'solutions')}>Insights Overview</a>
                <a href="#services" onClick={(e) => handleNavLinkClick(e, '/', 'services')}>Services</a>
                <a href="/dashboard" onClick={(e) => navigateTo(e, '/dashboard')}>Dashboard</a>
                <a href="#roadmap" onClick={(e) => handleNavLinkClick(e, '/', 'roadmap')}>Roadmap</a>
              </div>

              {/* Column 3: Company */}
              <div className="footer-links-col">
                <h4 className="footer-col-title">COMPANY</h4>
                <a href="#about" onClick={(e) => handleNavLinkClick(e, '/', 'about')}>About Us</a>
                <a href="#contact-section" onClick={(e) => handleNavLinkClick(e, route, 'contact-section')}>Contact</a>
                <a href="/privacy-policy" onClick={(e) => navigateTo(e, '/privacy-policy')}>Privacy Policy</a>
                <a href="/terms-of-service" onClick={(e) => navigateTo(e, '/terms-of-service')}>Terms of Service</a>
              </div>

              {/* Column 4: Services */}
              <div className="footer-links-col">
                <h4 className="footer-col-title">SERVICES</h4>
                <a href="#services" onClick={(e) => handleNavLinkClick(e, '/', 'services')}>Static Billboard Intelligence</a>
                <a href="#services" onClick={(e) => handleNavLinkClick(e, '/', 'services')}>DOOH Intelligence</a>
                <a href="/media-owner" onClick={(e) => navigateTo(e, '/media-owner')}>Media Owner Platform</a>
                <a href="#solutions" onClick={(e) => handleNavLinkClick(e, '/', 'solutions')}>Advertiser Solutions</a>
              </div>
            </div>

            {/* Bottom Footer */}
            <div className="footer-bottom">
              <div className="section-container footer-bottom-container">
                <p className="footer-copyright">&copy; 2026 Aculion Inc. All rights reserved.</p>
                <div className="footer-bottom-center">
                  <span className="footer-tagline-pill">AI-Powered Out-of-Home Intelligence</span>
                </div>
                <div className="footer-legal-links">
                  <a href="/privacy-policy" onClick={(e) => navigateTo(e, '/privacy-policy')}>Privacy Policy</a>
                  <span className="footer-link-divider">•</span>
                  <a href="/terms-of-service" onClick={(e) => navigateTo(e, '/terms-of-service')}>Terms of Service</a>
                  <span className="footer-link-divider">•</span>
                  <a href="#contact-section" onClick={(e) => handleNavLinkClick(e, route, 'contact-section')}>Contact</a>
                </div>
              </div>
            </div>
          </footer>
        </main>
      )}

      {/* Book a Demo Popup Modal */}
      <BookDemoModal isOpen={isDemoModalOpen} onClose={() => setIsDemoModalOpen(false)} />
    </div>
  );
}

