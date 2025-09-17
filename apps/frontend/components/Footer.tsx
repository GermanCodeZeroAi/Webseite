/**
 * Footer Component for German Code Zero AI
 * 
 * Site footer with proper accessibility and i18n support.
 * Features:
 * - Contentinfo landmark role
 * - i18n integration with locale support
 * - Accessibility features (proper headings, ARIA labels)
 * - Responsive design
 * - Premium gold/black branding
 * - Social links and legal information
 */

'use client';

import React from 'react';
import Link from 'next/link';
import { type Locale } from '../lib/seo';

interface FooterProps {
  locale: Locale;
}

// Footer content with i18n
const FOOTER_CONTENT = {
  de: {
    brand: 'German Code Zero AI',
    tagline: 'Premium B2B Services für Revenue- und Service-Orchestrierung',
    sections: {
      product: {
        title: 'Produkt',
        links: [
          { label: 'Shop', href: '/shop' },
          { label: 'Branchenlösungen', href: '/industries' },
          { label: 'Preise', href: '/pricing' },
          { label: 'Demo anfordern', href: '/contact' }
        ]
      },
      company: {
        title: 'Unternehmen',
        links: [
          { label: 'Über uns', href: '/about' },
          { label: 'Kontakt', href: '/contact' },
          { label: 'Blog', href: '/blog' },
          { label: 'Karriere', href: '/careers' }
        ]
      },
      legal: {
        title: 'Rechtliches',
        links: [
          { label: 'Impressum', href: '/legal/imprint' },
          { label: 'Datenschutz', href: '/legal/privacy' },
          { label: 'AGB', href: '/legal/terms' },
          { label: 'Cookie-Einstellungen', href: '/legal/cookies' }
        ]
      }
    },
    social: {
      title: 'Folgen Sie uns',
      ariaLabel: 'Social Media Links',
      links: [
        { 
          label: 'LinkedIn', 
          href: 'https://linkedin.com/company/germancodezeroai',
          ariaLabel: 'German Code Zero AI auf LinkedIn besuchen'
        },
        { 
          label: 'Twitter/X', 
          href: 'https://x.com/germancodezeroai',
          ariaLabel: 'German Code Zero AI auf X (Twitter) besuchen'
        },
        { 
          label: 'GitHub', 
          href: 'https://github.com/germancodezeroai',
          ariaLabel: 'German Code Zero AI auf GitHub besuchen'
        }
      ]
    },
    copyright: `© ${new Date().getFullYear()} German Code Zero AI. Alle Rechte vorbehalten.`,
    madeIn: 'Entwickelt in Deutschland mit ❤️'
  },
  en: {
    brand: 'German Code Zero AI',
    tagline: 'Premium B2B Services for Revenue and Service Orchestration',
    sections: {
      product: {
        title: 'Product',
        links: [
          { label: 'Shop', href: '/shop' },
          { label: 'Industries', href: '/industries' },
          { label: 'Pricing', href: '/pricing' },
          { label: 'Get Demo', href: '/contact' }
        ]
      },
      company: {
        title: 'Company',
        links: [
          { label: 'About', href: '/about' },
          { label: 'Contact', href: '/contact' },
          { label: 'Blog', href: '/blog' },
          { label: 'Careers', href: '/careers' }
        ]
      },
      legal: {
        title: 'Legal',
        links: [
          { label: 'Imprint', href: '/legal/imprint' },
          { label: 'Privacy', href: '/legal/privacy' },
          { label: 'Terms', href: '/legal/terms' },
          { label: 'Cookie Settings', href: '/legal/cookies' }
        ]
      }
    },
    social: {
      title: 'Follow us',
      ariaLabel: 'Social Media Links',
      links: [
        { 
          label: 'LinkedIn', 
          href: 'https://linkedin.com/company/germancodezeroai',
          ariaLabel: 'Visit German Code Zero AI on LinkedIn'
        },
        { 
          label: 'Twitter/X', 
          href: 'https://x.com/germancodezeroai',
          ariaLabel: 'Visit German Code Zero AI on X (Twitter)'
        },
        { 
          label: 'GitHub', 
          href: 'https://github.com/germancodezeroai',
          ariaLabel: 'Visit German Code Zero AI on GitHub'
        }
      ]
    },
    copyright: `© ${new Date().getFullYear()} German Code Zero AI. All rights reserved.`,
    madeIn: 'Made in Germany with ❤️'
  }
} as const;

export default function Footer({ locale }: FooterProps) {
  const content = FOOTER_CONTENT[locale];

  return (
    <footer 
      id="footer"
      className="site-footer"
      role="contentinfo"
      aria-label={locale === 'de' ? 'Website-Footer' : 'Website footer'}
    >
      <div className="footer-container">
        {/* Main Footer Content */}
        <div className="footer-main">
          {/* Brand Section */}
          <div className="footer-brand">
            <Link 
              href="/"
              className="footer-brand-link"
              aria-label={locale === 'de' ? 'German Code Zero AI - Zur Startseite' : 'German Code Zero AI - Go to homepage'}
            >
              <span className="footer-brand-text">
                {content.brand}
              </span>
            </Link>
            <p className="footer-tagline">
              {content.tagline}
            </p>
            
            {/* Social Links */}
            <div className="footer-social">
              <h3 className="footer-social-title">
                {content.social.title}
              </h3>
              <ul 
                className="social-list"
                role="list"
                aria-label={content.social.ariaLabel}
              >
                {content.social.links.map((link, index) => (
                  <li key={index} className="social-item">
                    <a
                      href={link.href}
                      className="social-link"
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={link.ariaLabel}
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Navigation Sections */}
          <div className="footer-nav">
            {/* Product Section */}
            <div className="footer-section">
              <h3 className="footer-section-title">
                {content.sections.product.title}
              </h3>
              <ul className="footer-links" role="list">
                {content.sections.product.links.map((link, index) => (
                  <li key={index} className="footer-link-item">
                    <Link 
                      href={link.href}
                      className="footer-link"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company Section */}
            <div className="footer-section">
              <h3 className="footer-section-title">
                {content.sections.company.title}
              </h3>
              <ul className="footer-links" role="list">
                {content.sections.company.links.map((link, index) => (
                  <li key={index} className="footer-link-item">
                    <Link 
                      href={link.href}
                      className="footer-link"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal Section */}
            <div className="footer-section">
              <h3 className="footer-section-title">
                {content.sections.legal.title}
              </h3>
              <ul className="footer-links" role="list">
                {content.sections.legal.links.map((link, index) => (
                  <li key={index} className="footer-link-item">
                    <Link 
                      href={link.href}
                      className="footer-link"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="footer-bottom">
          <div className="footer-bottom-content">
            <p className="footer-copyright">
              {content.copyright}
            </p>
            <p className="footer-made-in">
              {content.madeIn}
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        .site-footer {
          background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%);
          border-top: 1px solid var(--color-border);
          margin-top: auto;
        }

        .footer-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: var(--space-3xl) var(--space-md) var(--space-lg);
        }

        .footer-main {
          display: grid;
          grid-template-columns: 1fr 2fr;
          gap: var(--space-3xl);
          margin-bottom: var(--space-2xl);
        }

        .footer-brand {
          display: flex;
          flex-direction: column;
          gap: var(--space-lg);
        }

        .footer-brand-link {
          text-decoration: none;
          color: var(--color-primary);
          font-weight: 700;
          font-size: 1.5rem;
          transition: opacity 0.2s ease;
          align-self: flex-start;
        }

        .footer-brand-link:hover {
          opacity: 0.8;
        }

        .footer-tagline {
          color: var(--color-text-secondary);
          font-size: 1rem;
          line-height: 1.6;
          margin: 0;
          max-width: 300px;
        }

        .footer-social {
          display: flex;
          flex-direction: column;
          gap: var(--space-md);
        }

        .footer-social-title {
          color: var(--color-text-primary);
          font-size: 1rem;
          font-weight: 600;
          margin: 0;
        }

        .social-list {
          display: flex;
          gap: var(--space-lg);
          list-style: none;
          margin: 0;
          padding: 0;
        }

        .social-item {
          display: flex;
        }

        .social-link {
          color: var(--color-text-secondary);
          text-decoration: none;
          font-size: 0.9rem;
          transition: color 0.2s ease;
          padding: var(--space-xs) 0;
        }

        .social-link:hover {
          color: var(--color-primary);
        }

        .footer-nav {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: var(--space-2xl);
        }

        .footer-section {
          display: flex;
          flex-direction: column;
          gap: var(--space-lg);
        }

        .footer-section-title {
          color: var(--color-text-primary);
          font-size: 1.1rem;
          font-weight: 600;
          margin: 0;
        }

        .footer-links {
          display: flex;
          flex-direction: column;
          gap: var(--space-sm);
          list-style: none;
          margin: 0;
          padding: 0;
        }

        .footer-link-item {
          display: flex;
        }

        .footer-link {
          color: var(--color-text-secondary);
          text-decoration: none;
          font-size: 0.95rem;
          transition: color 0.2s ease;
          padding: var(--space-xs) 0;
        }

        .footer-link:hover {
          color: var(--color-primary);
        }

        .footer-bottom {
          border-top: 1px solid var(--color-border);
          padding-top: var(--space-lg);
        }

        .footer-bottom-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: var(--space-md);
        }

        .footer-copyright,
        .footer-made-in {
          color: var(--color-text-muted);
          font-size: 0.875rem;
          margin: 0;
        }

        .footer-made-in {
          text-align: right;
        }

        /* Mobile Styles */
        @media (max-width: 768px) {
          .footer-container {
            padding: var(--space-2xl) var(--space-md) var(--space-lg);
          }

          .footer-main {
            grid-template-columns: 1fr;
            gap: var(--space-2xl);
          }

          .footer-nav {
            grid-template-columns: 1fr;
            gap: var(--space-xl);
          }

          .social-list {
            flex-wrap: wrap;
            gap: var(--space-md);
          }

          .footer-bottom-content {
            flex-direction: column;
            align-items: center;
            text-align: center;
            gap: var(--space-sm);
          }

          .footer-made-in {
            text-align: center;
          }
        }

        /* Tablet Styles */
        @media (max-width: 1024px) and (min-width: 769px) {
          .footer-nav {
            grid-template-columns: repeat(2, 1fr);
            gap: var(--space-xl);
          }

          .footer-section:last-child {
            grid-column: span 2;
          }
        }

        /* Large Mobile Styles */
        @media (max-width: 640px) {
          .footer-nav {
            gap: var(--space-lg);
          }

          .footer-section {
            gap: var(--space-md);
          }

          .footer-links {
            gap: var(--space-xs);
          }
        }

        /* High Contrast Mode */
        @media (prefers-contrast: high) {
          .site-footer {
            background: var(--color-background);
            border-top: 2px solid var(--color-text-primary);
          }

          .footer-link:hover,
          .social-link:hover {
            background-color: var(--color-primary);
            color: var(--color-background);
            padding: var(--space-xs) var(--space-sm);
            border-radius: var(--radius-sm);
          }
        }

        /* Print Styles */
        @media print {
          .site-footer {
            background: none;
            border-top: 1px solid #000;
          }

          .footer-social,
          .footer-made-in {
            display: none;
          }

          .footer-main {
            grid-template-columns: 1fr;
          }

          .footer-nav {
            display: flex;
            flex-wrap: wrap;
            gap: var(--space-lg);
          }

          .footer-section {
            flex: 1;
            min-width: 200px;
          }
        }

        /* Reduced Motion */
        @media (prefers-reduced-motion: reduce) {
          .footer-brand-link,
          .footer-link,
          .social-link {
            transition: none;
          }
        }
      `}</style>
    </footer>
  );
}