/**
 * Solutions Layout for German Code Zero AI
 * 
 * Layout wrapper for all industry solution pages.
 * Features:
 * - Consistent branding and navigation
 * - SEO optimization with structured data
 * - Accessibility support
 * - Performance optimizations
 * - Clean, premium B2B design in gold/black theme
 */

import React from 'react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    template: '%s | German Code Zero AI',
    default: 'Branchenlösungen | German Code Zero AI'
  },
  description: 'Branchenpräzise Journeys ohne Custom-Overhead. Kürzere Ramp-Up-Zeit, höhere Abschlussquoten.',
  openGraph: {
    type: 'website',
    siteName: 'German Code Zero AI',
    locale: 'de_DE'
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-site-verification-code',
  },
};

interface SolutionsLayoutProps {
  children: React.ReactNode;
}

export default function SolutionsLayout({ children }: SolutionsLayoutProps) {
  return (
    <>
      {/* Skip navigation for accessibility */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      {/* Header/Navigation would go here if needed */}
      <header role="banner" className="solutions-header">
        <nav role="navigation" aria-label="Solutions navigation" className="solutions-nav">
          <div className="nav-container">
            <a href="/" className="logo-link" aria-label="German Code Zero AI Home">
              <span className="logo-text">German Code Zero AI</span>
            </a>
            
            <div className="nav-links">
              <a href="/solutions" className="nav-link">Branchenlösungen</a>
              <a href="/shop" className="nav-link">Shop</a>
              <a href="/pricing" className="nav-link">Preise</a>
              <a href="/contact" className="nav-link cta-link">Demo anfragen</a>
            </div>
          </div>
        </nav>
      </header>

      {/* Main content area */}
      <main id="main-content" role="main" className="solutions-main">
        {children}
      </main>

      {/* Footer */}
      <footer role="contentinfo" className="solutions-footer">
        <div className="footer-container">
          <div className="footer-section">
            <h3>German Code Zero AI</h3>
            <p>Premium B2B Services für Revenue- und Service-Orchestrierung</p>
          </div>
          
          <div className="footer-section">
            <h4>Lösungen</h4>
            <ul>
              <li><a href="/solutions">Branchenlösungen</a></li>
              <li><a href="/shop">Konfigurator</a></li>
              <li><a href="/pricing">Preise</a></li>
            </ul>
          </div>
          
          <div className="footer-section">
            <h4>Unternehmen</h4>
            <ul>
              <li><a href="/about">Über uns</a></li>
              <li><a href="/contact">Kontakt</a></li>
            </ul>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p>&copy; 2024 German Code Zero AI. Alle Rechte vorbehalten.</p>
        </div>
      </footer>

      {/* Global styles for solutions pages */}
      <style jsx global>{`
        /* Solutions Layout Styles */
        .skip-link {
          position: absolute;
          top: -40px;
          left: 6px;
          background: #FFD700;
          color: #000000;
          padding: 8px 16px;
          text-decoration: none;
          border-radius: 4px;
          z-index: 1000;
          font-weight: 600;
          font-size: 14px;
          transition: top 0.2s ease;
        }

        .skip-link:focus {
          top: 6px;
        }

        /* Header Styles */
        .solutions-header {
          background: #000000;
          border-bottom: 1px solid #333333;
          position: sticky;
          top: 0;
          z-index: 100;
        }

        .solutions-nav {
          padding: 0 24px;
        }

        .nav-container {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 64px;
        }

        .logo-link {
          text-decoration: none;
          color: #FFD700;
          font-weight: 700;
          font-size: 18px;
          transition: opacity 0.2s ease;
        }

        .logo-link:hover {
          opacity: 0.8;
        }

        .logo-text {
          display: inline-block;
        }

        .nav-links {
          display: flex;
          align-items: center;
          gap: 32px;
        }

        .nav-link {
          color: #ffffff;
          text-decoration: none;
          font-weight: 500;
          font-size: 14px;
          padding: 8px 16px;
          border-radius: 4px;
          transition: all 0.2s ease;
        }

        .nav-link:hover {
          background: rgba(255, 215, 0, 0.1);
          color: #FFD700;
        }

        .nav-link.cta-link {
          background: #FFD700;
          color: #000000;
          font-weight: 600;
        }

        .nav-link.cta-link:hover {
          background: #FFC700;
          transform: translateY(-1px);
        }

        /* Main Content Styles */
        .solutions-main {
          min-height: calc(100vh - 64px - 200px);
          background: #000000;
          color: #ffffff;
        }

        /* Footer Styles */
        .solutions-footer {
          background: #111111;
          border-top: 1px solid #333333;
          padding: 48px 24px 24px;
          margin-top: 64px;
        }

        .footer-container {
          max-width: 1200px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 2fr 1fr 1fr;
          gap: 48px;
        }

        .footer-section h3,
        .footer-section h4 {
          color: #FFD700;
          margin-bottom: 16px;
          font-weight: 600;
        }

        .footer-section h3 {
          font-size: 20px;
        }

        .footer-section h4 {
          font-size: 16px;
        }

        .footer-section p {
          color: #cccccc;
          line-height: 1.6;
          margin: 0;
        }

        .footer-section ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .footer-section ul li {
          margin-bottom: 8px;
        }

        .footer-section ul li a {
          color: #cccccc;
          text-decoration: none;
          transition: color 0.2s ease;
        }

        .footer-section ul li a:hover {
          color: #FFD700;
        }

        .footer-bottom {
          max-width: 1200px;
          margin: 32px auto 0;
          padding-top: 24px;
          border-top: 1px solid #333333;
          text-align: center;
          color: #888888;
          font-size: 14px;
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .nav-container {
            padding: 0 16px;
            height: 56px;
          }

          .nav-links {
            gap: 16px;
          }

          .nav-link {
            font-size: 13px;
            padding: 6px 12px;
          }

          .logo-link {
            font-size: 16px;
          }

          .footer-container {
            grid-template-columns: 1fr;
            gap: 32px;
            padding: 0 16px;
          }

          .solutions-footer {
            padding: 32px 16px 16px;
          }
        }

        /* High contrast mode support */
        @media (prefers-contrast: high) {
          .solutions-header {
            border-bottom: 2px solid #ffffff;
          }

          .nav-link:hover {
            background: #ffffff;
            color: #000000;
          }

          .footer-section ul li a:hover {
            background: #ffffff;
            color: #000000;
            padding: 2px 4px;
            border-radius: 2px;
          }
        }

        /* Focus styles for accessibility */
        .nav-link:focus-visible,
        .logo-link:focus-visible,
        .footer-section ul li a:focus-visible {
          outline: 2px solid #FFD700;
          outline-offset: 2px;
        }

        /* Print styles */
        @media print {
          .solutions-header,
          .solutions-footer {
            display: none;
          }

          .solutions-main {
            background: white;
            color: black;
          }
        }
      `}</style>
    </>
  );
}