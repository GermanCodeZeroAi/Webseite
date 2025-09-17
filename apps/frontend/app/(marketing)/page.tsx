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
import { getPageSeo, getHeroContent, type Locale } from '../../lib/seo';

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
  const heroContent = getHeroContent(locale);

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

      {/* Mobile Sticky CTA */}
      <div className="mobile-sticky-cta visible" role="complementary" aria-label={heroContent.ctaAriaLabel}>
        <a
          href="/shop/configurator"
          className="mobile-sticky-cta__button"
          aria-label={heroContent.ctaAriaLabel}
        >
          <span className="mobile-sticky-cta__text">
            {heroContent.ctaText}
          </span>
          <span className="mobile-sticky-cta__arrow" aria-hidden="true">
            →
          </span>
        </a>
      </div>

      {/* Mobile CTA Space Reservation */}
      <div className="mobile-sticky-cta-spacer" aria-hidden="true"></div>

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

        /* Mobile Sticky CTA */
        .mobile-sticky-cta {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          z-index: 1000;
          background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
          padding: 1rem;
          box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.3);
          transform: translateY(100%);
          transition: transform 0.3s ease-in-out;
          display: none; /* Hidden by default, shown on mobile */
        }

        .mobile-sticky-cta.visible {
          transform: translateY(0);
        }

        .mobile-sticky-cta__button {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          width: 100%;
          background: transparent;
          border: none;
          color: #000000;
          font-size: 1.1rem;
          font-weight: 600;
          text-decoration: none;
          padding: 0.75rem 1rem;
          border-radius: 0.5rem;
          transition: all 0.2s ease;
        }

        .mobile-sticky-cta__button:hover {
          background: rgba(0, 0, 0, 0.1);
        }

        .mobile-sticky-cta__button:focus {
          outline: 2px solid #000000;
          outline-offset: 2px;
        }

        .mobile-sticky-cta__text {
          font-weight: inherit;
        }

        .mobile-sticky-cta__arrow {
          font-size: 1.2rem;
          transition: transform 0.3s ease;
        }

        .mobile-sticky-cta__button:hover .mobile-sticky-cta__arrow {
          transform: translateX(4px);
        }

        /* Space reservation to prevent layout shift */
        .mobile-sticky-cta-spacer {
          height: 0;
          transition: height 0.3s ease-in-out;
        }

        /* Show sticky CTA on mobile */
        @media (max-width: 768px) {
          .mobile-sticky-cta {
            display: block;
          }

          .mobile-sticky-cta.visible + .mobile-sticky-cta-spacer {
            height: 84px; /* Height of sticky CTA + padding */
          }
        }

        /* Reduced motion support */
        @media (prefers-reduced-motion: reduce) {
          .mobile-sticky-cta {
            transition: none;
          }

          .mobile-sticky-cta__button {
            transition: none;
          }

          .mobile-sticky-cta__arrow {
            transition: none;
          }

          .mobile-sticky-cta__button:hover .mobile-sticky-cta__arrow {
            transform: none;
          }

          .mobile-sticky-cta-spacer {
            transition: none;
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

          .mobile-sticky-cta {
            display: none;
          }

          .mobile-sticky-cta-spacer {
            display: none;
          }
        }
      `}</style>
    </>
  );
}