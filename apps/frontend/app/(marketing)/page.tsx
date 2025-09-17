/**
 * Marketing Landing Page for German Code Zero AI
 * 
 * Premium B2B landing page with Hero3D component.
 * Features:
 * - Complete i18n integration with SEO utilities
 * - No hardcoded text - all content from i18n keys
 * - Public-safe content (no internal terminology)
 * - CTA navigation to shop configurator
 * - Accessibility and performance optimized
 */

import React from 'react';
import { Metadata } from 'next';
import Hero3D from '../../components/Hero3D';
import { getPageSeo, type Locale } from '../../lib/seo';

interface PageProps {
  params: { locale?: string };
  searchParams: { [key: string]: string | string[] | undefined };
}

// Generate metadata for SEO
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const locale: Locale = (params.locale as Locale) || 'de';
  const seoData = getPageSeo('home', locale);
  
  return {
    title: seoData.title,
    description: seoData.description,
    openGraph: {
      title: seoData.og.title,
      description: seoData.og.description,
      url: seoData.canonical,
      siteName: 'German Code Zero AI',
      images: [
        {
          url: seoData.og.image,
          width: 1200,
          height: 630,
          alt: seoData.og.title,
        },
      ],
      locale: seoData.og.locale,
      type: seoData.og.type,
    },
    twitter: {
      card: 'summary_large_image',
      title: seoData.og.title,
      description: seoData.og.description,
      images: [seoData.og.image],
    },
    alternates: {
      canonical: seoData.canonical,
      languages: seoData.hreflang,
    },
    other: {
      'application/ld+json': JSON.stringify(seoData.jsonLd),
    },
  };
}

export default function MarketingPage({ params }: PageProps) {
  const locale: Locale = (params.locale as Locale) || 'de';
  const seoData = getPageSeo('home', locale);

  return (
    <>
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(seoData.jsonLd),
        }}
      />

      {/* Main Content */}
      <main role="main">
        <Hero3D 
          locale={locale}
        />
        
        {/* Additional sections can be added here */}
        {/* All future content should use i18n keys from seo.ts */}
      </main>

      <style jsx global>{`
        /* Reset and base styles */
        * {
          box-sizing: border-box;
        }

        html {
          scroll-behavior: smooth;
        }

        @media (prefers-reduced-motion: reduce) {
          html {
            scroll-behavior: auto;
          }
        }

        body {
          margin: 0;
          padding: 0;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 
                       'Oxygen', 'Ubuntu', 'Cantarell', 'Open Sans', 'Helvetica Neue', 
                       sans-serif;
          background-color: #000000;
          color: #ffffff;
          line-height: 1.6;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }

        /* Skip link for accessibility */
        .skip-link {
          position: absolute;
          top: -40px;
          left: 6px;
          background: #FFD700;
          color: #000000;
          padding: 8px;
          text-decoration: none;
          border-radius: 4px;
          z-index: 1000;
          font-weight: 600;
        }

        .skip-link:focus {
          top: 6px;
        }

        /* Focus styles */
        :focus-visible {
          outline: 2px solid #FFD700;
          outline-offset: 2px;
        }

        /* High contrast mode support */
        @media (prefers-contrast: high) {
          body {
            background-color: #000000;
            color: #ffffff;
          }
        }

        /* Print styles */
        @media print {
          body {
            background: white;
            color: black;
          }
          
          .hero-3d__background {
            display: none;
          }
        }
      `}</style>
    </>
  );
}