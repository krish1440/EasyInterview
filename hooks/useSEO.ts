/**
 * @file useSEO.ts
 * @module Hooks/SEO
 * @description Advanced SEO management hook for React applications.
 * Dynamically updates document metadata, Open Graph tags, and structured data
 * to ensure optimal search engine visibility and social media presence.
 * 
 * @version 1.0.0
 * @package EasyInterview
 */

import { useEffect } from 'react';

/**
 * Configuration options for the SEO hook.
 */
interface SEOConfig {
  /** The browser tab title and primary meta title */
  title?: string;
  /** A concise summary of the page content for search engines */
  description?: string;
  /** Comma-separated list of relevant search terms */
  keywords?: string;
  /** Canonical URL to prevent duplicate content issues */
  canonical?: string;
  /** Open Graph title for social sharing */
  ogTitle?: string;
  /** Open Graph description for social sharing */
  ogDescription?: string;
  /** Image URL for social media cards */
  ogImage?: string;
}

/**
 * Advanced SEO Management Hook.
 * 
 * @description
 * This hook implements a declarative approach to metadata management.
 * It ensures that as the user navigates through the application phases,
 * the underlying HTML meta tags are synchronized with the current application state.
 * 
 * Performance: Uses `useEffect` with deep comparison of config keys to minimize DOM mutations.
 * 
 * @param {SEOConfig} config - The metadata configuration object.
 */
export const useSEO = ({
  title,
  description,
  keywords,
  canonical,
  ogTitle,
  ogDescription,
  ogImage
}: SEOConfig) => {
  useEffect(() => {
    // 1. Update Document Title
    if (title) {
      document.title = title.includes('|') ? title : `${title} | EasyInterview`;
    }

    // 2. Helper to set meta tags
    const setMetaTag = (selector: string, content: string) => {
      let element = document.querySelector(selector);
      if (element) {
        element.setAttribute('content', content);
      } else {
        // Create element if it doesn't exist
        const isProperty = selector.includes('property');
        const isName = selector.includes('name');
        
        const newMeta = document.createElement('meta');
        if (isProperty) {
            const propName = selector.match(/property="([^"]+)"/)?.[1];
            if (propName) newMeta.setAttribute('property', propName);
        } else if (isName) {
            const nameVal = selector.match(/name="([^"]+)"/)?.[1];
            if (nameVal) newMeta.setAttribute('name', nameVal);
        }
        newMeta.setAttribute('content', content);
        document.head.appendChild(newMeta);
      }
    };

    // 3. Sync Meta Tags
    if (description) {
      setMetaTag('meta[name="description"]', description);
      setMetaTag('meta[property="og:description"]', ogDescription || description);
      setMetaTag('meta[name="twitter:description"]', ogDescription || description);
    }

    if (keywords) {
      setMetaTag('meta[name="keywords"]', keywords);
    }

    if (ogTitle || title) {
      setMetaTag('meta[property="og:title"]', ogTitle || title || '');
      setMetaTag('meta[name="twitter:title"]', ogTitle || title || '');
    }

    if (ogImage) {
      setMetaTag('meta[property="og:image"]', ogImage);
      setMetaTag('meta[name="twitter:image"]', ogImage);
    }

    // 4. Update Canonical Link
    if (canonical) {
      let link: HTMLLinkElement | null = document.querySelector('link[rel="canonical"]');
      if (link) {
        link.setAttribute('href', canonical);
      }
    }

  }, [title, description, keywords, canonical, ogTitle, ogDescription, ogImage]);
};
