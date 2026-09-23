/**
 * Aculion SEO Metadata Registry
 * Implementation for Phase 1 P0 Technical SEO
 */

export const SITE_ORIGIN = 'https://www.aculion.com';
export const DEFAULT_OG_IMAGE = 'https://www.aculion.com/blog_attention_metrics.png';

export const SEO_ROUTES = {
  '/': {
    title: 'Aculion | AI-Powered Out-of-Home (OOH) Intelligence Platform',
    description: 'Aculion delivers real-time computer vision analytics for outdoor advertising. Measure verified traffic, audience dwell time, and vehicle classification across physical billboards.',
    canonical: `${SITE_ORIGIN}/`,
    ogTitle: 'Aculion | AI-Powered Out-of-Home (OOH) Intelligence Platform',
    ogDescription: 'Transform physical billboards into measurable digital intelligence assets with real-time gaze, dwell time, and traffic analytics.',
    ogImage: `${SITE_ORIGIN}/blog_attention_metrics.png`,
    ogType: 'website',
    twitterCard: 'summary_large_image',
    robots: 'index, follow'
  },
  '/media-owner': {
    title: 'Media Owner Platform | Maximize Billboard Revenue | Aculion',
    description: 'Empower billboard operators with real-time traffic intelligence, verified audience dwell time, and vehicle classification to command higher CPMs and prove ad performance.',
    canonical: `${SITE_ORIGIN}/media-owner`,
    ogTitle: 'Media Owner Intelligence Platform | Aculion',
    ogDescription: 'Maximize outdoor advertising asset yield with verified audience dwell times and traffic classification reports.',
    ogImage: `${SITE_ORIGIN}/blog_billboard_roi.png`,
    ogType: 'website',
    twitterCard: 'summary_large_image',
    robots: 'index, follow'
  },
  '/insights': {
    title: 'OOH Advertising Insights, Research & Industry Trends | Aculion',
    description: 'Explore expert analysis, research reports, and technical insights on digital out-of-home advertising, privacy-first computer vision, and billboard analytics.',
    canonical: `${SITE_ORIGIN}/insights`,
    ogTitle: 'OOH Advertising Insights & Research | Aculion',
    ogDescription: 'Discover the latest trends in OOH measurement, edge AI vision, and data-driven billboard optimization.',
    ogImage: `${SITE_ORIGIN}/blog_smart_city.png`,
    ogType: 'website',
    twitterCard: 'summary_large_image',
    robots: 'index, follow'
  },
  '/insights/attention-metrics-2026': {
    title: 'The Future of DOOH: AI Attention Metrics in 2026 | Aculion Insights',
    description: 'How computer vision and edge AI are transforming billboard measurement from estimated OTS to verified human attention, dwell time, and gaze duration.',
    canonical: `${SITE_ORIGIN}/insights/attention-metrics-2026`,
    ogTitle: 'The Future of Digital Out-of-Home: How AI is Redefining Attention Metrics in 2026',
    ogDescription: 'How computer vision and edge AI are transforming billboard measurement from estimated OTS to verified human gaze and attention.',
    ogImage: `${SITE_ORIGIN}/blog_attention_metrics.png`,
    ogType: 'article',
    twitterCard: 'summary_large_image',
    robots: 'index, follow'
  },
  '/insights/privacy-first-analytics': {
    title: 'Privacy-First Analytics in Physical Spaces & Edge Computing | Aculion Insights',
    description: 'Learn how on-device edge computing and hardware-level face blurring protect citizen privacy under GDPR and CCPA while delivering actionable audience analytics.',
    canonical: `${SITE_ORIGIN}/insights/privacy-first-analytics`,
    ogTitle: 'Privacy-First Analytics in Physical Spaces: The New Edge Computing Standard',
    ogDescription: 'Explore Aculion\'s on-device processing where video frames are blurred instantly and wiped in RAM to guarantee GDPR and CCPA compliance.',
    ogImage: `${SITE_ORIGIN}/blog_privacy_edge.png`,
    ogType: 'article',
    twitterCard: 'summary_large_image',
    robots: 'index, follow'
  },
  '/insights/maximizing-billboard-roi': {
    title: 'Maximizing Billboard ROI: Data-Driven Optimization for Media Owners | Aculion',
    description: 'Discover how real-time vehicle classification, dwell time analysis, and dynamic scheduling help billboard operators win premium brand campaigns and increase ad revenue.',
    canonical: `${SITE_ORIGIN}/insights/maximizing-billboard-roi`,
    ogTitle: 'Maximizing Billboard ROI: Data-Driven Optimization for Modern Media Owners',
    ogDescription: 'Learn how verified vehicle mix data and dwell time analytics enable outdoor media owners to command up to 40% higher CPMs.',
    ogImage: `${SITE_ORIGIN}/blog_billboard_roi.png`,
    ogType: 'article',
    twitterCard: 'summary_large_image',
    robots: 'index, follow'
  },
  '/insights/smart-cities-and-interactive-ooh': {
    title: 'Smart Cities and Interactive OOH: Context-Aware Citizen Experiences | Aculion',
    description: 'How digital street furniture, transit shelters, and smart billboards integrate with IoT sensors to deliver weather-triggered ads and emergency public messaging.',
    canonical: `${SITE_ORIGIN}/insights/smart-cities-and-interactive-ooh`,
    ogTitle: 'Smart Cities and Interactive OOH: Creating Context-Aware Citizen Experiences',
    ogDescription: 'How digital street furniture and smart billboards integrate with IoT sensors to deliver weather-triggered ads and public utility messaging.',
    ogImage: `${SITE_ORIGIN}/blog_smart_city.png`,
    ogType: 'article',
    twitterCard: 'summary_large_image',
    robots: 'index, follow'
  }
};

/**
 * Resolves SEO metadata based on the current pathname.
 * Authenticated or private paths default to noindex.
 */
export function getSEOMetadata(pathname) {
  // Normalize trailing slashes (except root '/')
  const normalized = pathname.length > 1 && pathname.endsWith('/') 
    ? pathname.slice(0, -1) 
    : pathname;

  if (SEO_ROUTES[normalized]) {
    return SEO_ROUTES[normalized];
  }

  // Check if it's a private or auth route
  const isPrivate = 
    normalized.startsWith('/sign-in') ||
    normalized.startsWith('/forgot-password') ||
    normalized.includes('/dashboard') ||
    normalized.includes('/media-profile');

  if (isPrivate) {
    return {
      title: 'Aculion Console',
      description: 'Aculion enterprise client console.',
      canonical: `${SITE_ORIGIN}${normalized}`,
      ogTitle: 'Aculion Console',
      ogDescription: 'Aculion enterprise client console.',
      ogImage: DEFAULT_OG_IMAGE,
      ogType: 'website',
      twitterCard: 'summary',
      robots: 'noindex, nofollow'
    };
  }

  // Default fallback for any unmatched public page
  return {
    title: 'Aculion | AI-Powered Out-of-Home Intelligence',
    description: 'Aculion delivers real-time computer vision analytics for outdoor advertising.',
    canonical: `${SITE_ORIGIN}${normalized}`,
    ogTitle: 'Aculion | AI-Powered Out-of-Home Intelligence',
    ogDescription: 'Aculion delivers real-time computer vision analytics for outdoor advertising.',
    ogImage: DEFAULT_OG_IMAGE,
    ogType: 'website',
    twitterCard: 'summary_large_image',
    robots: 'index, follow'
  };
}
