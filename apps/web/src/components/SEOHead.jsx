import { useEffect } from 'react';
import { getSEOMetadata } from '../utils/seoConfig';

/**
 * Helper to update or insert a <meta> tag by name or property
 */
function setMetaTag(attribute, attrValue, content) {
  let element = document.querySelector(`meta[${attribute}="${attrValue}"]`);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attribute, attrValue);
    document.head.appendChild(element);
  }
  element.setAttribute('content', content);
}

/**
 * Helper to update or insert a <link> tag by rel
 */
function setLinkTag(rel, href) {
  let element = document.querySelector(`link[rel="${rel}"]`);
  if (!element) {
    element = document.createElement('link');
    element.setAttribute('rel', rel);
    document.head.appendChild(element);
  }
  element.setAttribute('href', href);
}

/**
 * Route-aware SEO Head Component
 * Dynamically synchronizes document head tags (title, description, canonical, OG, Twitter, robots)
 * across SPA route changes without heavy third-party dependencies.
 */
export default function SEOHead({ route }) {
  useEffect(() => {
    const meta = getSEOMetadata(route || window.location.pathname);

    // 1. Page Title
    if (meta.title) {
      document.title = meta.title;
    }

    // 2. Meta Description
    if (meta.description) {
      setMetaTag('name', 'description', meta.description);
    }

    // 3. Canonical Link
    if (meta.canonical) {
      setLinkTag('canonical', meta.canonical);
    }

    // 4. Robots Directive
    if (meta.robots) {
      setMetaTag('name', 'robots', meta.robots);
    }

    // 5. OpenGraph Tags
    if (meta.ogTitle) setMetaTag('property', 'og:title', meta.ogTitle);
    if (meta.ogDescription) setMetaTag('property', 'og:description', meta.ogDescription);
    if (meta.canonical) setMetaTag('property', 'og:url', meta.canonical);
    if (meta.ogImage) setMetaTag('property', 'og:image', meta.ogImage);
    if (meta.ogType) setMetaTag('property', 'og:type', meta.ogType);
    setMetaTag('property', 'og:site_name', 'Aculion');

    // 6. Twitter Card Tags
    if (meta.twitterCard) setMetaTag('name', 'twitter:card', meta.twitterCard);
    if (meta.ogTitle) setMetaTag('name', 'twitter:title', meta.ogTitle);
    if (meta.ogDescription) setMetaTag('name', 'twitter:description', meta.ogDescription);
    if (meta.ogImage) setMetaTag('name', 'twitter:image', meta.ogImage);
  }, [route]);

  return null;
}
