/**
 * Aculion JSON-LD Structured Data Generator
 * Phase 2 SEO Implementation
 */

import { SITE_ORIGIN, DEFAULT_OG_IMAGE } from './seoConfig.js';

export const ORGANIZATION_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': `${SITE_ORIGIN}/#organization`,
  name: 'Aculion',
  url: SITE_ORIGIN,
  logo: {
    '@type': 'ImageObject',
    url: `${SITE_ORIGIN}/logo_new_transparent.png`,
    caption: 'Aculion Logo'
  },
  description: 'AI-Powered Out-of-Home (OOH) Intelligence Platform measuring verified traffic, audience dwell time, and vehicle classification across physical billboards.',
  contactPoint: {
    '@type': 'ContactPoint',
    email: 'connect@aculion.com',
    telephone: '+91-9176590590',
    contactType: 'customer support'
  }
};

export const WEBSITE_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': `${SITE_ORIGIN}/#website`,
  name: 'Aculion',
  url: SITE_ORIGIN,
  publisher: {
    '@id': `${SITE_ORIGIN}/#organization`
  }
};

export const SOFTWARE_APPLICATION_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Aculion OOH Intelligence Platform',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'All (Cloud SaaS)',
  url: SITE_ORIGIN,
  description: 'Enterprise AI platform for media owners, brands, and agencies to measure traffic, attention, dwell time, and ROI for outdoor advertising.',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
    description: 'Enterprise demo and custom pricing available upon request'
  },
  creator: {
    '@id': `${SITE_ORIGIN}/#organization`
  }
};

/**
 * Metadata registry for Insights articles to generate accurate BlogPosting schema
 */
export const ARTICLES_METADATA = {
  'attention-metrics-2026': {
    headline: 'The Future of Digital Out-of-Home: How AI is Redefining Attention Metrics in 2026',
    description: 'For decades, OOH has relied on daily traffic estimates. Now, computer vision and edge intelligence are transforming billboards into measurable, high-impact digital assets that track direct human attention.',
    image: `${SITE_ORIGIN}/blog_attention_metrics.png`,
    datePublished: '2026-07-02',
    dateModified: '2026-07-02',
    author: {
      '@type': 'Person',
      name: 'Dr. Elena Rostova',
      jobTitle: 'Chief AI Scientist'
    }
  },
  'privacy-first-analytics': {
    headline: 'Privacy-First Analytics in Physical Spaces: The New Edge Computing Standard',
    description: 'Can physical spaces be analyzed without compromising citizen privacy? Explore Aculion’s on-device processing where faces are blurred instantly at the hardware level, satisfying GDPR and CCPA.',
    image: `${SITE_ORIGIN}/blog_privacy_edge.png`,
    datePublished: '2026-06-28',
    dateModified: '2026-06-28',
    author: {
      '@type': 'Person',
      name: 'Marcus Vance',
      jobTitle: 'VP of Product'
    }
  },
  'maximizing-billboard-roi': {
    headline: 'Maximizing Billboard ROI: Data-Driven Optimization for Modern Media Owners',
    description: 'Outdoor billboard inventory is highly valuable, but selling it requires absolute proof of performance. Learn how real-time vehicle classification and dwell time analytics attract tier-1 brands.',
    image: `${SITE_ORIGIN}/blog_billboard_roi.png`,
    datePublished: '2026-06-15',
    dateModified: '2026-06-15',
    author: {
      '@type': 'Person',
      name: 'Sarah Jenkins',
      jobTitle: 'Director of OOH Strategy'
    }
  },
  'smart-cities-and-interactive-ooh': {
    headline: 'Smart Cities and Interactive OOH: Creating Context-Aware Citizen Experiences',
    description: 'How street furniture, transit shelters, and digital billboards integrate into the IoT grid to deliver weather-triggered advertisements and public utility messaging in real time.',
    image: `${SITE_ORIGIN}/blog_smart_city.png`,
    datePublished: '2026-05-30',
    dateModified: '2026-05-30',
    author: {
      '@type': 'Person',
      name: 'Liam Chen',
      jobTitle: 'Urban Technology Lead'
    }
  }
};

/**
 * Generates Article schema for a given article slug
 */
export function getArticleSchema(slug) {
  const article = ARTICLES_METADATA[slug];
  if (!article) return null;

  const canonicalUrl = `${SITE_ORIGIN}/insights/${slug}`;

  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': canonicalUrl
    },
    headline: article.headline,
    description: article.description,
    image: [article.image],
    datePublished: article.datePublished,
    dateModified: article.dateModified,
    author: article.author,
    publisher: {
      '@type': 'Organization',
      name: 'Aculion',
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_ORIGIN}/logo_new_transparent.png`
      }
    }
  };
}

/**
 * Generates BreadcrumbList schema based on the current pathname
 */
export function getBreadcrumbSchema(pathname) {
  const normalized = pathname.length > 1 && pathname.endsWith('/') 
    ? pathname.slice(0, -1) 
    : pathname;

  if (normalized === '/' || normalized === '') return null;

  const items = [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'Home',
      item: SITE_ORIGIN
    }
  ];

  if (normalized === '/media-owner') {
    items.push({
      '@type': 'ListItem',
      position: 2,
      name: 'Media Owner Platform',
      item: `${SITE_ORIGIN}/media-owner`
    });
  } else if (normalized === '/insights') {
    items.push({
      '@type': 'ListItem',
      position: 2,
      name: 'Insights',
      item: `${SITE_ORIGIN}/insights`
    });
  } else if (normalized.startsWith('/insights/')) {
    const slug = normalized.replace('/insights/', '');
    const article = ARTICLES_METADATA[slug];
    items.push({
      '@type': 'ListItem',
      position: 2,
      name: 'Insights',
      item: `${SITE_ORIGIN}/insights`
    });
    items.push({
      '@type': 'ListItem',
      position: 3,
      name: article ? article.headline : slug,
      item: `${SITE_ORIGIN}/insights/${slug}`
    });
  } else if (normalized === '/privacy-policy') {
    items.push({
      '@type': 'ListItem',
      position: 2,
      name: 'Privacy Policy',
      item: `${SITE_ORIGIN}/privacy-policy`
    });
  } else if (normalized === '/terms-of-service') {
    items.push({
      '@type': 'ListItem',
      position: 2,
      name: 'Terms of Service',
      item: `${SITE_ORIGIN}/terms-of-service`
    });
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items
  };
}

/**
 * Returns complete array of structured data objects for any route
 */
export function getStructuredDataForRoute(pathname) {
  const normalized = pathname.length > 1 && pathname.endsWith('/') 
    ? pathname.slice(0, -1) 
    : pathname;

  // 1. Homepage
  if (normalized === '/' || normalized === '') {
    return [ORGANIZATION_SCHEMA, WEBSITE_SCHEMA, SOFTWARE_APPLICATION_SCHEMA];
  }

  // 2. Article detail pages
  if (normalized.startsWith('/insights/')) {
    const slug = normalized.replace('/insights/', '');
    const articleSchema = getArticleSchema(slug);
    const breadcrumb = getBreadcrumbSchema(normalized);
    const schemas = [ORGANIZATION_SCHEMA];
    if (articleSchema) schemas.push(articleSchema);
    if (breadcrumb) schemas.push(breadcrumb);
    return schemas;
  }

  // 3. Other public indexable pages
  const breadcrumb = getBreadcrumbSchema(normalized);
  const schemas = [ORGANIZATION_SCHEMA, WEBSITE_SCHEMA];
  if (breadcrumb) schemas.push(breadcrumb);

  return schemas;
}
