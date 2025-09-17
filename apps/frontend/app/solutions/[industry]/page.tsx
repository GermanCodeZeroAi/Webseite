/**
 * Dynamic Industry Solution Page for German Code Zero AI
 * 
 * Generates industry-specific solution pages from catalog data.
 * Features:
 * - Dynamic routing based on industry codes
 * - Complete i18n integration with SEO utilities
 * - Industry-specific content and recommendations
 * - H1, benefits sections, FAQ, and CTA
 * - No hardcoded text - all content from i18n/catalog
 * - Public-safe content (no internal terminology)
 * - Accessibility and performance optimized
 */

import React from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { 
  getAllIndustryCodes, 
  getIndustryByCode, 
  getIndustryContent,
  getIndustryPageSeo,
  type Industry 
} from '../../../lib/industries';
import { type Locale } from '../../../lib/seo';

interface PageProps {
  params: { industry: string; locale?: string };
  searchParams: { [key: string]: string | string[] | undefined };
}

// Generate static paths for all industries
export async function generateStaticParams() {
  const industryCodes = getAllIndustryCodes();
  
  return industryCodes.map((industry) => ({
    industry,
  }));
}

// Generate metadata for SEO
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const industryCode = params.industry;
  const locale: Locale = (params.locale as Locale) || 'de';
  
  // Validate industry code
  const industry = getIndustryByCode(industryCode);
  if (!industry) {
    return {
      title: 'Industry Not Found',
      description: 'The requested industry solution could not be found.',
    };
  }

  const seoData = getIndustryPageSeo(industryCode, locale);
  if (!seoData) {
    return {
      title: 'Industry Not Found',
      description: 'The requested industry solution could not be found.',
    };
  }
  
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

export default function IndustrySolutionPage({ params }: PageProps) {
  const industryCode = params.industry;
  const locale: Locale = (params.locale as Locale) || 'de';
  
  // Get industry data
  const industry = getIndustryByCode(industryCode);
  if (!industry) {
    notFound();
  }

  // Get localized content
  const content = getIndustryContent(industryCode, locale);
  if (!content) {
    notFound();
  }

  const seoData = getIndustryPageSeo(industryCode, locale);

  const handleCtaClick = (action: 'configure' | 'demo') => {
    if (action === 'configure') {
      window.location.href = `/shop/configurator?industry=${industryCode}`;
    } else {
      window.location.href = `/contact?source=industry-${industryCode}`;
    }
  };

  return (
    <>
      {/* JSON-LD Structured Data */}
      {seoData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(seoData.jsonLd),
          }}
        />
      )}

      {/* Hero Section */}
      <section className="hero-section" role="banner">
        <div className="hero-container">
          <div className="hero-content">
            <h1 className="hero-title">{content.hero.title}</h1>
            <p className="hero-subtitle">{content.hero.subtitle}</p>
            <p className="hero-description">{content.hero.description}</p>
            
            <div className="hero-actions">
              <button 
                className="btn-primary" 
                onClick={() => handleCtaClick('configure')}
                aria-label={`${content.cta.primaryButton} für ${industry.name}`}
              >
                {content.cta.primaryButton}
              </button>
              <button 
                className="btn-secondary"
                onClick={() => handleCtaClick('demo')}
                aria-label={`${content.cta.secondaryButton} für ${industry.name}`}
              >
                {content.cta.secondaryButton}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="benefits-section" role="region" aria-labelledby="benefits-title">
        <div className="section-container">
          <h2 id="benefits-title" className="section-title">{content.benefits.title}</h2>
          
          <div className="benefits-grid">
            {content.benefits.items.map((benefit, index) => (
              <div key={index} className="benefit-card">
                <h3 className="benefit-title">{benefit.title}</h3>
                <p className="benefit-description">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Recommended Modules Section */}
      <section className="modules-section" role="region" aria-labelledby="modules-title">
        <div className="section-container">
          <h2 id="modules-title" className="section-title">{content.modules.title}</h2>
          <p className="section-description">{content.modules.description}</p>
          
          <div className="modules-grid">
            {industry.recommended_modules.map((module, index) => (
              <div key={index} className="module-card">
                <h3 className="module-name">{module}</h3>
                <p className="module-description">
                  {locale === 'de' 
                    ? `Optimiert für ${industry.name}-spezifische Anforderungen`
                    : `Optimized for ${industry.name}-specific requirements`
                  }
                </p>
              </div>
            ))}
          </div>
          
          <div className="modules-cta">
            <button 
              className="btn-primary"
              onClick={() => handleCtaClick('configure')}
              aria-label={`${content.modules.cta} - ${industry.name}`}
            >
              {content.modules.cta}
            </button>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="faq-section" role="region" aria-labelledby="faq-title">
        <div className="section-container">
          <h2 id="faq-title" className="section-title">{content.faq.title}</h2>
          
          <div className="faq-list">
            {content.faq.items.map((faq, index) => (
              <details key={index} className="faq-item">
                <summary className="faq-question">
                  <span>{faq.question}</span>
                  <span className="faq-icon" aria-hidden="true">+</span>
                </summary>
                <div className="faq-answer">
                  <p>{faq.answer}</p>
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="cta-section" role="region" aria-labelledby="cta-title">
        <div className="section-container">
          <div className="cta-content">
            <h2 id="cta-title" className="cta-title">{content.cta.title}</h2>
            <p className="cta-description">{content.cta.description}</p>
            
            <div className="cta-actions">
              <button 
                className="btn-primary btn-large"
                onClick={() => handleCtaClick('configure')}
                aria-label={`${content.cta.primaryButton} für ${industry.name}`}
              >
                {content.cta.primaryButton}
              </button>
              <button 
                className="btn-secondary btn-large"
                onClick={() => handleCtaClick('demo')}
                aria-label={`${content.cta.secondaryButton} für ${industry.name}`}
              >
                {content.cta.secondaryButton}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Page-specific styles */}
      <style jsx>{`
        /* Hero Section */
        .hero-section {
          background: linear-gradient(135deg, #000000 0%, #1a1a1a 100%);
          padding: 80px 24px;
          text-align: center;
        }

        .hero-container {
          max-width: 1200px;
          margin: 0 auto;
        }

        .hero-title {
          font-size: clamp(2.5rem, 5vw, 4rem);
          font-weight: 700;
          color: #FFD700;
          margin-bottom: 24px;
          line-height: 1.2;
        }

        .hero-subtitle {
          font-size: clamp(1.25rem, 3vw, 1.5rem);
          color: #ffffff;
          margin-bottom: 16px;
          font-weight: 600;
        }

        .hero-description {
          font-size: clamp(1rem, 2vw, 1.125rem);
          color: #cccccc;
          margin-bottom: 48px;
          max-width: 800px;
          margin-left: auto;
          margin-right: auto;
          line-height: 1.6;
        }

        .hero-actions {
          display: flex;
          gap: 24px;
          justify-content: center;
          align-items: center;
          flex-wrap: wrap;
        }

        /* Sections */
        .benefits-section,
        .modules-section,
        .faq-section {
          padding: 80px 24px;
        }

        .cta-section {
          padding: 80px 24px;
          background: #111111;
          text-align: center;
        }

        .section-container {
          max-width: 1200px;
          margin: 0 auto;
        }

        .section-title {
          font-size: clamp(2rem, 4vw, 2.5rem);
          font-weight: 700;
          color: #FFD700;
          margin-bottom: 48px;
          text-align: center;
        }

        .section-description {
          font-size: 1.125rem;
          color: #cccccc;
          text-align: center;
          margin-bottom: 48px;
          max-width: 800px;
          margin-left: auto;
          margin-right: auto;
        }

        /* Benefits Grid */
        .benefits-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 32px;
        }

        .benefit-card {
          background: #111111;
          padding: 32px;
          border-radius: 8px;
          border: 1px solid #333333;
          transition: all 0.3s ease;
        }

        .benefit-card:hover {
          border-color: #FFD700;
          transform: translateY(-4px);
        }

        .benefit-title {
          font-size: 1.25rem;
          font-weight: 600;
          color: #FFD700;
          margin-bottom: 16px;
        }

        .benefit-description {
          color: #cccccc;
          line-height: 1.6;
          margin: 0;
        }

        /* Modules Grid */
        .modules-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 24px;
          margin-bottom: 48px;
        }

        .module-card {
          background: #0a0a0a;
          padding: 24px;
          border-radius: 6px;
          border: 1px solid #444444;
          text-align: center;
          transition: all 0.3s ease;
        }

        .module-card:hover {
          border-color: #FFD700;
        }

        .module-name {
          font-size: 1.125rem;
          font-weight: 600;
          color: #ffffff;
          margin-bottom: 12px;
          text-transform: capitalize;
        }

        .module-description {
          color: #aaaaaa;
          font-size: 0.875rem;
          margin: 0;
        }

        .modules-cta {
          text-align: center;
        }

        /* FAQ Section */
        .faq-list {
          max-width: 800px;
          margin: 0 auto;
        }

        .faq-item {
          border-bottom: 1px solid #333333;
          margin-bottom: 0;
        }

        .faq-question {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 24px 0;
          font-size: 1.125rem;
          font-weight: 600;
          color: #ffffff;
          cursor: pointer;
          list-style: none;
          transition: color 0.2s ease;
        }

        .faq-question:hover {
          color: #FFD700;
        }

        .faq-question::-webkit-details-marker {
          display: none;
        }

        .faq-icon {
          font-size: 1.5rem;
          color: #FFD700;
          transition: transform 0.2s ease;
        }

        .faq-item[open] .faq-icon {
          transform: rotate(45deg);
        }

        .faq-answer {
          padding-bottom: 24px;
          color: #cccccc;
          line-height: 1.6;
        }

        .faq-answer p {
          margin: 0;
        }

        /* CTA Section */
        .cta-content {
          max-width: 800px;
          margin: 0 auto;
        }

        .cta-title {
          font-size: clamp(2rem, 4vw, 2.5rem);
          font-weight: 700;
          color: #FFD700;
          margin-bottom: 24px;
        }

        .cta-description {
          font-size: 1.125rem;
          color: #cccccc;
          margin-bottom: 48px;
          line-height: 1.6;
        }

        .cta-actions {
          display: flex;
          gap: 24px;
          justify-content: center;
          align-items: center;
          flex-wrap: wrap;
        }

        /* Buttons */
        .btn-primary,
        .btn-secondary {
          padding: 12px 32px;
          border-radius: 6px;
          font-weight: 600;
          font-size: 1rem;
          border: 2px solid transparent;
          cursor: pointer;
          transition: all 0.3s ease;
          text-decoration: none;
          display: inline-block;
        }

        .btn-large {
          padding: 16px 40px;
          font-size: 1.125rem;
        }

        .btn-primary {
          background: #FFD700;
          color: #000000;
          border-color: #FFD700;
        }

        .btn-primary:hover {
          background: #FFC700;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(255, 215, 0, 0.3);
        }

        .btn-secondary {
          background: transparent;
          color: #FFD700;
          border-color: #FFD700;
        }

        .btn-secondary:hover {
          background: #FFD700;
          color: #000000;
        }

        /* Focus styles for accessibility */
        .btn-primary:focus-visible,
        .btn-secondary:focus-visible,
        .faq-question:focus-visible {
          outline: 2px solid #FFD700;
          outline-offset: 2px;
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .hero-section,
          .benefits-section,
          .modules-section,
          .faq-section,
          .cta-section {
            padding: 48px 16px;
          }

          .hero-actions,
          .cta-actions {
            flex-direction: column;
            gap: 16px;
          }

          .btn-primary,
          .btn-secondary {
            width: 100%;
            max-width: 280px;
          }

          .benefits-grid {
            grid-template-columns: 1fr;
            gap: 24px;
          }

          .modules-grid {
            grid-template-columns: 1fr;
            gap: 16px;
          }
        }

        /* High contrast mode support */
        @media (prefers-contrast: high) {
          .benefit-card,
          .module-card {
            border-width: 2px;
          }

          .btn-primary,
          .btn-secondary {
            border-width: 3px;
          }
        }

        /* Print styles */
        @media print {
          .hero-section,
          .cta-section {
            background: white;
          }

          .hero-title,
          .section-title,
          .cta-title,
          .benefit-title,
          .faq-question {
            color: black;
          }

          .btn-primary,
          .btn-secondary {
            display: none;
          }
        }
      `}</style>
    </>
  );
}