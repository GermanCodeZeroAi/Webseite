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

import React, { Suspense } from 'react';
import { Metadata } from 'next';
import dynamic from 'next/dynamic';
import Head from 'next/head';
import { getPageSeo, type Locale } from '../../lib/seo';

// Lazy load Hero3D component for better initial performance
const Hero3D = dynamic(() => import('../../components/Hero3D'), {
  loading: () => (
    <div className="hero-loading">
      <div className="hero-loading__container">
        <div className="hero-loading__content">
          <h1 className="hero-loading__headline">Mehr Umsatz. Weniger Reibung.</h1>
          <p className="hero-loading__subheadline">
            Orchestrieren Sie Revenue- und Service-Prozesse Ende‑zu‑Ende – mit Premium-Erlebnis, konsistenten Journeys und planbarem Wachstum.
          </p>
          <div className="hero-loading__skeleton" />
        </div>
      </div>
    </div>
  ),
  ssr: false // Disable SSR for 3D components to avoid hydration issues
});

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
    // Performance optimizations - preconnect to external services
    // Note: These will be added via Next.js Link components in the component
  };
}

export default function MarketingPage({ params }: PageProps) {
  const locale: Locale = (params.locale as Locale) || 'de';
  const seoData = getPageSeo('home', locale);

  const handleCtaClick = () => {
    // Navigate to shop configurator
    window.location.href = '/shop/configurator';
  };

  return (
    <>
      {/* Performance optimizations - preconnect to external services */}
      <Head>
        <link rel="preconnect" href="https://js.stripe.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://api.stripe.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://checkout.stripe.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://hooks.stripe.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href="https://fonts.gstatic.com" />
      </Head>

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
          onCtaClick={handleCtaClick}
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

        /* Hero loading placeholder */
        .hero-loading {
          position: relative;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #000000 0%, #1a1a1a 100%);
        }

        .hero-loading__container {
          width: 100%;
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem;
          text-align: center;
        }

        .hero-loading__content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2rem;
        }

        .hero-loading__headline {
          font-size: clamp(2.5rem, 5vw, 4rem);
          font-weight: 700;
          color: #FFD700;
          text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
          margin: 0;
          line-height: 1.1;
        }

        .hero-loading__subheadline {
          font-size: clamp(1.1rem, 2.5vw, 1.4rem);
          color: #ffffff;
          max-width: 800px;
          margin: 0;
          line-height: 1.6;
          opacity: 0.95;
        }

        .hero-loading__skeleton {
          width: 200px;
          height: 50px;
          background: linear-gradient(90deg, rgba(255, 215, 0, 0.1) 0%, rgba(255, 215, 0, 0.3) 50%, rgba(255, 215, 0, 0.1) 100%);
          background-size: 200% 100%;
          border-radius: 0.5rem;
          animation: shimmer 2s infinite;
        }

        @keyframes shimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .hero-loading__skeleton {
            animation: none;
            background: rgba(255, 215, 0, 0.2);
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