/**
 * Header Component for German Code Zero AI
 * 
 * Navigation header with proper accessibility and i18n support.
 * Features:
 * - Semantic navigation landmark
 * - i18n integration with locale support
 * - Accessibility features (ARIA labels, keyboard navigation)
 * - Responsive design
 * - Premium gold/black branding
 */

'use client';

import React from 'react';
import Link from 'next/link';
import { type Locale } from '../lib/seo';

interface HeaderProps {
  locale: Locale;
}

// Navigation content with i18n
const NAV_CONTENT = {
  de: {
    brand: 'German Code Zero AI',
    brandAriaLabel: 'German Code Zero AI - Startseite',
    nav: {
      home: 'Start',
      shop: 'Shop',
      industries: 'Branchen',
      pricing: 'Preise',
      about: 'Über uns',
      contact: 'Kontakt'
    },
    actions: {
      demo: 'Demo anfordern',
      demoAriaLabel: 'Demo anfordern - Kontakt aufnehmen'
    },
    menuToggle: 'Menü',
    menuToggleAriaLabel: 'Hauptnavigation ein-/ausblenden'
  },
  en: {
    brand: 'German Code Zero AI',
    brandAriaLabel: 'German Code Zero AI - Home',
    nav: {
      home: 'Home',
      shop: 'Shop',
      industries: 'Industries',
      pricing: 'Pricing',
      about: 'About',
      contact: 'Contact'
    },
    actions: {
      demo: 'Get Demo',
      demoAriaLabel: 'Get Demo - Contact us'
    },
    menuToggle: 'Menu',
    menuToggleAriaLabel: 'Toggle main navigation'
  }
} as const;

export default function Header({ locale }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const content = NAV_CONTENT[locale];

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  // Handle keyboard navigation
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      closeMenu();
    }
  };

  return (
    <header 
      className="site-header"
      role="banner"
    >
      <nav 
        id="navigation"
        className="site-nav"
        role="navigation"
        aria-label={locale === 'de' ? 'Hauptnavigation' : 'Main navigation'}
        onKeyDown={handleKeyDown}
      >
        <div className="nav-container">
          {/* Brand/Logo */}
          <div className="nav-brand">
            <Link 
              href="/"
              className="brand-link"
              aria-label={content.brandAriaLabel}
              onClick={closeMenu}
            >
              <span className="brand-text">
                {content.brand}
              </span>
            </Link>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="menu-toggle"
            type="button"
            aria-expanded={isMenuOpen}
            aria-controls="main-menu"
            aria-label={content.menuToggleAriaLabel}
            onClick={toggleMenu}
          >
            <span className="menu-toggle-icon">
              <span></span>
              <span></span>
              <span></span>
            </span>
            <span className="menu-toggle-text">
              {content.menuToggle}
            </span>
          </button>

          {/* Navigation Menu */}
          <div 
            id="main-menu"
            className={`nav-menu ${isMenuOpen ? 'nav-menu--open' : ''}`}
            aria-hidden={!isMenuOpen}
          >
            <ul 
              className="nav-list"
              role="list"
            >
              <li className="nav-item">
                <Link 
                  href="/"
                  className="nav-link"
                  onClick={closeMenu}
                >
                  {content.nav.home}
                </Link>
              </li>
              <li className="nav-item">
                <Link 
                  href="/shop"
                  className="nav-link"
                  onClick={closeMenu}
                >
                  {content.nav.shop}
                </Link>
              </li>
              <li className="nav-item">
                <Link 
                  href="/industries"
                  className="nav-link"
                  onClick={closeMenu}
                >
                  {content.nav.industries}
                </Link>
              </li>
              <li className="nav-item">
                <Link 
                  href="/pricing"
                  className="nav-link"
                  onClick={closeMenu}
                >
                  {content.nav.pricing}
                </Link>
              </li>
              <li className="nav-item">
                <Link 
                  href="/about"
                  className="nav-link"
                  onClick={closeMenu}
                >
                  {content.nav.about}
                </Link>
              </li>
              <li className="nav-item">
                <Link 
                  href="/contact"
                  className="nav-link"
                  onClick={closeMenu}
                >
                  {content.nav.contact}
                </Link>
              </li>
            </ul>

            {/* CTA Button */}
            <div className="nav-actions">
              <Link 
                href="/contact"
                className="cta-button"
                aria-label={content.actions.demoAriaLabel}
                onClick={closeMenu}
              >
                {content.actions.demo}
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <style jsx>{`
        .site-header {
          position: sticky;
          top: 0;
          z-index: var(--z-sticky);
          background: rgba(0, 0, 0, 0.95);
          backdrop-filter: blur(10px);
          border-bottom: 1px solid var(--color-border);
        }

        .site-nav {
          width: 100%;
        }

        .nav-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 var(--space-md);
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 70px;
        }

        .nav-brand {
          flex-shrink: 0;
        }

        .brand-link {
          text-decoration: none;
          color: var(--color-primary);
          font-weight: 700;
          font-size: 1.25rem;
          transition: opacity 0.2s ease;
        }

        .brand-link:hover {
          opacity: 0.8;
        }

        .brand-text {
          display: block;
        }

        .menu-toggle {
          display: none;
          flex-direction: column;
          align-items: center;
          gap: 0.25rem;
          background: none;
          border: none;
          color: var(--color-text-primary);
          cursor: pointer;
          padding: var(--space-sm);
          border-radius: var(--radius-sm);
          transition: background-color 0.2s ease;
        }

        .menu-toggle:hover {
          background-color: rgba(255, 255, 255, 0.1);
        }

        .menu-toggle-icon {
          display: flex;
          flex-direction: column;
          gap: 3px;
          width: 20px;
          height: 14px;
        }

        .menu-toggle-icon span {
          display: block;
          width: 100%;
          height: 2px;
          background-color: var(--color-text-primary);
          transition: all 0.3s ease;
        }

        .menu-toggle[aria-expanded="true"] .menu-toggle-icon span:nth-child(1) {
          transform: rotate(45deg) translate(5px, 5px);
        }

        .menu-toggle[aria-expanded="true"] .menu-toggle-icon span:nth-child(2) {
          opacity: 0;
        }

        .menu-toggle[aria-expanded="true"] .menu-toggle-icon span:nth-child(3) {
          transform: rotate(-45deg) translate(7px, -6px);
        }

        .menu-toggle-text {
          font-size: 0.75rem;
          font-weight: 500;
        }

        .nav-menu {
          display: flex;
          align-items: center;
          gap: var(--space-xl);
        }

        .nav-list {
          display: flex;
          align-items: center;
          gap: var(--space-lg);
          list-style: none;
          margin: 0;
          padding: 0;
        }

        .nav-item {
          position: relative;
        }

        .nav-link {
          color: var(--color-text-primary);
          text-decoration: none;
          font-weight: 500;
          font-size: 0.95rem;
          padding: var(--space-sm) 0;
          transition: color 0.2s ease;
          position: relative;
        }

        .nav-link:hover {
          color: var(--color-primary);
        }

        .nav-link::after {
          content: '';
          position: absolute;
          bottom: -2px;
          left: 0;
          width: 0;
          height: 2px;
          background-color: var(--color-primary);
          transition: width 0.3s ease;
        }

        .nav-link:hover::after {
          width: 100%;
        }

        .nav-actions {
          display: flex;
          align-items: center;
        }

        .cta-button {
          background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%);
          color: var(--color-secondary);
          text-decoration: none;
          padding: var(--space-sm) var(--space-lg);
          border-radius: var(--radius-md);
          font-weight: 600;
          font-size: 0.9rem;
          transition: all 0.3s ease;
          box-shadow: var(--shadow-gold);
        }

        .cta-button:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(255, 215, 0, 0.4);
        }

        .cta-button:active {
          transform: translateY(0);
        }

        /* Mobile Styles */
        @media (max-width: 768px) {
          .menu-toggle {
            display: flex;
          }

          .nav-menu {
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            background: var(--color-background);
            border-top: 1px solid var(--color-border);
            flex-direction: column;
            align-items: stretch;
            gap: 0;
            padding: var(--space-lg);
            transform: translateY(-10px);
            opacity: 0;
            visibility: hidden;
            transition: all 0.3s ease;
            box-shadow: var(--shadow-lg);
          }

          .nav-menu--open {
            transform: translateY(0);
            opacity: 1;
            visibility: visible;
          }

          .nav-list {
            flex-direction: column;
            align-items: stretch;
            gap: 0;
            margin-bottom: var(--space-lg);
          }

          .nav-item {
            border-bottom: 1px solid var(--color-border);
          }

          .nav-item:last-child {
            border-bottom: none;
          }

          .nav-link {
            display: block;
            padding: var(--space-md) 0;
            font-size: 1rem;
          }

          .nav-actions {
            justify-content: center;
          }

          .cta-button {
            padding: var(--space-md) var(--space-xl);
            font-size: 1rem;
          }
        }

        /* Tablet Styles */
        @media (max-width: 1024px) and (min-width: 769px) {
          .nav-list {
            gap: var(--space-md);
          }

          .nav-link {
            font-size: 0.9rem;
          }
        }

        /* Reduced Motion */
        @media (prefers-reduced-motion: reduce) {
          .nav-link::after,
          .menu-toggle-icon span,
          .nav-menu,
          .cta-button {
            transition: none;
          }

          .cta-button:hover {
            transform: none;
          }
        }

        /* High Contrast Mode */
        @media (prefers-contrast: high) {
          .site-header {
            background: var(--color-background);
            border-bottom: 2px solid var(--color-text-primary);
          }

          .nav-link:hover {
            background-color: var(--color-primary);
            color: var(--color-background);
          }
        }

        /* Print Styles */
        @media print {
          .site-header {
            position: static;
            background: none;
            border-bottom: 1px solid #000;
          }

          .menu-toggle,
          .nav-actions {
            display: none;
          }

          .nav-menu {
            display: block;
          }

          .nav-list {
            display: flex;
            flex-wrap: wrap;
            gap: var(--space-md);
          }
        }
      `}</style>
    </header>
  );
}