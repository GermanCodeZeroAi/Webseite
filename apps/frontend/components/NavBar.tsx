/**
 * NavBar Component for German Code Zero AI
 * 
 * Premium navigation bar with animated dropdown, accessibility features,
 * and responsive mobile burger menu. Features:
 * - Logo3D placeholder centered
 * - Left/right navigation links
 * - Animated dropdown with services, pricing, contact
 * - Full A11y: roving tabindex, ARIA roles, keyboard navigation
 * - Framer Motion animations with reduced-motion support
 * - Mobile burger menu with focus trap
 * - No layout shift, performance optimized
 */

'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { type Locale } from '../lib/seo';

interface NavBarProps {
  locale?: Locale;
  className?: string;
}

interface NavItem {
  label: string;
  href: string;
  ariaLabel?: string;
}

interface DropdownItem {
  label: string;
  href: string;
  description?: string;
  ariaLabel?: string;
}

// Logo3D Placeholder Component
const Logo3D: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`logo-3d ${className}`} aria-label="German Code Zero AI">
    <div className="logo-3d__cube">
      <div className="logo-3d__face logo-3d__face--front">GCZ</div>
      <div className="logo-3d__face logo-3d__face--back">AI</div>
      <div className="logo-3d__face logo-3d__face--right"></div>
      <div className="logo-3d__face logo-3d__face--left"></div>
      <div className="logo-3d__face logo-3d__face--top"></div>
      <div className="logo-3d__face logo-3d__face--bottom"></div>
    </div>
    
    <style jsx>{`
      .logo-3d {
        perspective: 200px;
        width: 48px;
        height: 48px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .logo-3d__cube {
        position: relative;
        width: 32px;
        height: 32px;
        transform-style: preserve-3d;
        transform: rotateX(-15deg) rotateY(15deg);
        transition: transform var(--duration-normal) var(--ease-out);
      }
      
      .logo-3d:hover .logo-3d__cube {
        transform: rotateX(-10deg) rotateY(25deg);
      }
      
      .logo-3d__face {
        position: absolute;
        width: 32px;
        height: 32px;
        background: linear-gradient(135deg, var(--gold) 0%, var(--gold-hi) 100%);
        border: 1px solid var(--gold-shadow);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 10px;
        font-weight: var(--font-bold);
        color: var(--color-text-inverse);
        text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
      }
      
      .logo-3d__face--front {
        transform: translateZ(16px);
      }
      
      .logo-3d__face--back {
        transform: translateZ(-16px) rotateY(180deg);
      }
      
      .logo-3d__face--right {
        transform: rotateY(90deg) translateZ(16px);
        background: linear-gradient(135deg, var(--gold-shadow) 0%, var(--gold) 100%);
      }
      
      .logo-3d__face--left {
        transform: rotateY(-90deg) translateZ(16px);
        background: linear-gradient(135deg, var(--gold-shadow) 0%, var(--gold) 100%);
      }
      
      .logo-3d__face--top {
        transform: rotateX(90deg) translateZ(16px);
        background: linear-gradient(135deg, var(--gold-hi) 0%, var(--gold) 100%);
      }
      
      .logo-3d__face--bottom {
        transform: rotateX(-90deg) translateZ(16px);
        background: linear-gradient(135deg, var(--gold-shadow) 0%, var(--gold-muted) 100%);
      }
      
      @media (prefers-reduced-motion: reduce) {
        .logo-3d__cube {
          transition: none;
        }
        
        .logo-3d:hover .logo-3d__cube {
          transform: rotateX(-15deg) rotateY(15deg);
        }
      }
    `}</style>
  </div>
);

// Navigation content
const NAV_CONTENT = {
  de: {
    leftNav: [
      { label: 'Über uns', href: '/about', ariaLabel: 'Über German Code Zero AI' },
      { label: 'Branchen', href: '/industries', ariaLabel: 'Branchenlösungen' }
    ],
    rightNav: [
      { label: 'Shop', href: '/shop', ariaLabel: 'Zum Konfigurator' }
    ],
    dropdown: {
      trigger: 'Mehr',
      ariaLabel: 'Weitere Optionen',
      items: [
        { 
          label: 'Leistungen', 
          href: '/services', 
          description: 'Orchestrierung Services',
          ariaLabel: 'Unsere Leistungen ansehen'
        },
        { 
          label: 'Preise', 
          href: '/pricing', 
          description: 'Pläne & Preise',
          ariaLabel: 'Preise und Pläne ansehen'
        },
        { 
          label: 'Kontakt', 
          href: '/contact', 
          description: 'Gespräch vereinbaren',
          ariaLabel: 'Kontakt aufnehmen'
        }
      ]
    },
    mobile: {
      menuLabel: 'Menü öffnen',
      closeLabel: 'Menü schließen'
    }
  },
  en: {
    leftNav: [
      { label: 'About', href: '/en/about', ariaLabel: 'About German Code Zero AI' },
      { label: 'Industries', href: '/en/industries', ariaLabel: 'Industry Solutions' }
    ],
    rightNav: [
      { label: 'Shop', href: '/en/shop', ariaLabel: 'Go to Configurator' }
    ],
    dropdown: {
      trigger: 'More',
      ariaLabel: 'More options',
      items: [
        { 
          label: 'Services', 
          href: '/en/services', 
          description: 'Orchestration Services',
          ariaLabel: 'View our services'
        },
        { 
          label: 'Pricing', 
          href: '/en/pricing', 
          description: 'Plans & Pricing',
          ariaLabel: 'View pricing and plans'
        },
        { 
          label: 'Contact', 
          href: '/en/contact', 
          description: 'Schedule a call',
          ariaLabel: 'Get in touch'
        }
      ]
    },
    mobile: {
      menuLabel: 'Open menu',
      closeLabel: 'Close menu'
    }
  }
} as const;

export default function NavBar({ locale = 'de', className = '' }: NavBarProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const dropdownTriggerRef = useRef<HTMLButtonElement>(null);
  const mobileToggleRef = useRef<HTMLButtonElement>(null);
  
  const content = NAV_CONTENT[locale];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
        setFocusedIndex(-1);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node) &&
          !mobileToggleRef.current?.contains(event.target as Node)) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (isDropdownOpen) {
          setIsDropdownOpen(false);
          setFocusedIndex(-1);
          dropdownTriggerRef.current?.focus();
        }
        if (isMobileMenuOpen) {
          setIsMobileMenuOpen(false);
          mobileToggleRef.current?.focus();
        }
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isDropdownOpen, isMobileMenuOpen]);

  // Focus trap for mobile menu
  useEffect(() => {
    if (isMobileMenuOpen) {
      const focusableElements = mobileMenuRef.current?.querySelectorAll(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements?.[0] as HTMLElement;
      const lastElement = focusableElements?.[focusableElements.length - 1] as HTMLElement;

      const handleTabKey = (event: KeyboardEvent) => {
        if (event.key === 'Tab') {
          if (event.shiftKey) {
            if (document.activeElement === firstElement) {
              event.preventDefault();
              lastElement?.focus();
            }
          } else {
            if (document.activeElement === lastElement) {
              event.preventDefault();
              firstElement?.focus();
            }
          }
        }
      };

      document.addEventListener('keydown', handleTabKey);
      firstElement?.focus();

      return () => document.removeEventListener('keydown', handleTabKey);
    }
  }, [isMobileMenuOpen]);

  // Keyboard navigation for dropdown
  const handleDropdownKeyDown = useCallback((event: React.KeyboardEvent) => {
    const items = content.dropdown.items;
    
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        if (!isDropdownOpen) {
          setIsDropdownOpen(true);
          setFocusedIndex(0);
        } else {
          setFocusedIndex(prev => (prev + 1) % items.length);
        }
        break;
        
      case 'ArrowUp':
        event.preventDefault();
        if (isDropdownOpen) {
          setFocusedIndex(prev => prev <= 0 ? items.length - 1 : prev - 1);
        }
        break;
        
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (!isDropdownOpen) {
          setIsDropdownOpen(true);
          setFocusedIndex(0);
        } else if (focusedIndex >= 0) {
          window.location.href = items[focusedIndex].href;
        }
        break;
        
      case 'Escape':
        event.preventDefault();
        setIsDropdownOpen(false);
        setFocusedIndex(-1);
        break;
    }
  }, [isDropdownOpen, focusedIndex, content.dropdown.items]);

  // Animation variants
  const dropdownVariants = {
    hidden: {
      opacity: 0,
      scale: 0.95,
      y: -10,
      transition: {
        duration: 0.12,
        ease: [0.4, 0, 1, 1]
      }
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        duration: 0.18,
        ease: [0, 0, 0.2, 1]
      }
    }
  };

  const mobileMenuVariants = {
    hidden: {
      opacity: 0,
      scale: 0.95,
      transition: {
        duration: 0.12,
        ease: [0.4, 0, 1, 1]
      }
    },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.18,
        ease: [0, 0, 0.2, 1]
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: (index: number) => ({
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.15,
        delay: index * 0.05,
        ease: [0, 0, 0.2, 1]
      }
    })
  };

  return (
    <>
      <nav 
        className={`navbar ${className}`}
        role="navigation"
        aria-label={locale === 'de' ? 'Hauptnavigation' : 'Main navigation'}
      >
        <div className="navbar__container">
          {/* Left Navigation */}
          <div className="navbar__section navbar__section--left">
            {content.leftNav.map((item, index) => (
              <a
                key={item.href}
                href={item.href}
                className="navbar__link"
                aria-label={item.ariaLabel}
              >
                {item.label}
              </a>
            ))}
          </div>

          {/* Logo (Centered) */}
          <div className="navbar__section navbar__section--center">
            <a 
              href={locale === 'de' ? '/' : '/en'}
              className="navbar__logo-link"
              aria-label={locale === 'de' ? 'Zur Startseite' : 'Go to homepage'}
            >
              <Logo3D />
            </a>
          </div>

          {/* Right Navigation */}
          <div className="navbar__section navbar__section--right">
            {content.rightNav.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="navbar__link"
                aria-label={item.ariaLabel}
              >
                {item.label}
              </a>
            ))}
            
            {/* Dropdown */}
            <div className="navbar__dropdown" ref={dropdownRef}>
              <button
                ref={dropdownTriggerRef}
                className="navbar__dropdown-trigger"
                aria-expanded={isDropdownOpen}
                aria-haspopup="true"
                aria-label={content.dropdown.ariaLabel}
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                onKeyDown={handleDropdownKeyDown}
              >
                {content.dropdown.trigger}
                <svg
                  className="navbar__dropdown-icon"
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M4.5 6l3.5 3.5L11.5 6H4.5z" />
                </svg>
              </button>

              <AnimatePresence>
                {isDropdownOpen && (
                  <motion.div
                    className="navbar__dropdown-menu"
                    variants={dropdownVariants}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    role="menu"
                    aria-labelledby="dropdown-trigger"
                  >
                    {content.dropdown.items.map((item, index) => (
                      <motion.a
                        key={item.href}
                        href={item.href}
                        className={`navbar__dropdown-item ${
                          focusedIndex === index ? 'navbar__dropdown-item--focused' : ''
                        }`}
                        role="menuitem"
                        aria-label={item.ariaLabel}
                        variants={itemVariants}
                        custom={index}
                        tabIndex={focusedIndex === index ? 0 : -1}
                        onMouseEnter={() => setFocusedIndex(index)}
                        onMouseLeave={() => setFocusedIndex(-1)}
                      >
                        <div className="navbar__dropdown-item-content">
                          <span className="navbar__dropdown-item-label">
                            {item.label}
                          </span>
                          {item.description && (
                            <span className="navbar__dropdown-item-description">
                              {item.description}
                            </span>
                          )}
                        </div>
                      </motion.a>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            ref={mobileToggleRef}
            className="navbar__mobile-toggle"
            aria-expanded={isMobileMenuOpen}
            aria-label={isMobileMenuOpen ? content.mobile.closeLabel : content.mobile.menuLabel}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <span className="navbar__burger-line"></span>
            <span className="navbar__burger-line"></span>
            <span className="navbar__burger-line"></span>
          </button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              ref={mobileMenuRef}
              className="navbar__mobile-menu"
              variants={mobileMenuVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              role="menu"
              aria-label={locale === 'de' ? 'Mobile Navigation' : 'Mobile navigation'}
            >
              <div className="navbar__mobile-content">
                {/* Left nav items */}
                {content.leftNav.map((item, index) => (
                  <motion.a
                    key={item.href}
                    href={item.href}
                    className="navbar__mobile-link"
                    role="menuitem"
                    aria-label={item.ariaLabel}
                    variants={itemVariants}
                    custom={index}
                  >
                    {item.label}
                  </motion.a>
                ))}
                
                {/* Right nav items */}
                {content.rightNav.map((item, index) => (
                  <motion.a
                    key={item.href}
                    href={item.href}
                    className="navbar__mobile-link"
                    role="menuitem"
                    aria-label={item.ariaLabel}
                    variants={itemVariants}
                    custom={content.leftNav.length + index}
                  >
                    {item.label}
                  </motion.a>
                ))}
                
                {/* Dropdown items */}
                <div className="navbar__mobile-section">
                  <span className="navbar__mobile-section-title">
                    {content.dropdown.trigger}
                  </span>
                  {content.dropdown.items.map((item, index) => (
                    <motion.a
                      key={item.href}
                      href={item.href}
                      className="navbar__mobile-link navbar__mobile-link--sub"
                      role="menuitem"
                      aria-label={item.ariaLabel}
                      variants={itemVariants}
                      custom={content.leftNav.length + content.rightNav.length + index}
                    >
                      <div className="navbar__mobile-link-content">
                        <span className="navbar__mobile-link-label">
                          {item.label}
                        </span>
                        {item.description && (
                          <span className="navbar__mobile-link-description">
                            {item.description}
                          </span>
                        )}
                      </div>
                    </motion.a>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      <style jsx>{`
        .navbar {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: var(--z-fixed);
          background: var(--navbar-bg);
          backdrop-filter: var(--navbar-backdrop-filter);
          -webkit-backdrop-filter: var(--navbar-backdrop-filter);
          border-bottom: 1px solid var(--navbar-border);
          height: var(--navbar-height);
        }

        .navbar__container {
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 100%;
          max-width: 1280px;
          margin: 0 auto;
          padding: 0 var(--space-md);
        }

        .navbar__section {
          display: flex;
          align-items: center;
          gap: var(--space-lg);
          flex: 1;
        }

        .navbar__section--left {
          justify-content: flex-start;
        }

        .navbar__section--center {
          justify-content: center;
          flex: 0 0 auto;
        }

        .navbar__section--right {
          justify-content: flex-end;
        }

        .navbar__link {
          color: var(--color-text-primary);
          text-decoration: none;
          font-weight: var(--font-medium);
          font-size: var(--text-sm);
          transition: var(--transition-fast);
          padding: var(--space-xs) var(--space-sm);
          border-radius: var(--radius-md);
          white-space: nowrap;
        }

        .navbar__link:hover {
          color: var(--gold);
          background: rgba(255, 255, 255, 0.05);
        }

        .navbar__link:focus-visible {
          outline: none;
          box-shadow: var(--focus-ring);
        }

        .navbar__logo-link {
          display: flex;
          align-items: center;
          justify-content: center;
          text-decoration: none;
          border-radius: var(--radius-lg);
          transition: var(--transition-fast);
        }

        .navbar__logo-link:focus-visible {
          outline: none;
          box-shadow: var(--focus-ring);
        }

        .navbar__dropdown {
          position: relative;
        }

        .navbar__dropdown-trigger {
          display: flex;
          align-items: center;
          gap: var(--space-xs);
          background: none;
          border: none;
          color: var(--color-text-primary);
          font-weight: var(--font-medium);
          font-size: var(--text-sm);
          cursor: pointer;
          padding: var(--space-xs) var(--space-sm);
          border-radius: var(--radius-md);
          transition: var(--transition-fast);
          white-space: nowrap;
        }

        .navbar__dropdown-trigger:hover {
          color: var(--gold);
          background: rgba(255, 255, 255, 0.05);
        }

        .navbar__dropdown-trigger:focus-visible {
          outline: none;
          box-shadow: var(--focus-ring);
        }

        .navbar__dropdown-trigger[aria-expanded="true"] .navbar__dropdown-icon {
          transform: rotate(180deg);
        }

        .navbar__dropdown-icon {
          transition: var(--transition-fast);
        }

        .navbar__dropdown-menu {
          position: absolute;
          top: calc(100% + var(--space-xs));
          right: 0;
          min-width: var(--dropdown-min-width);
          background: var(--dropdown-bg);
          border: 1px solid var(--dropdown-border);
          border-radius: var(--radius-dropdown);
          box-shadow: var(--shadow-lg);
          padding: var(--space-xs);
          z-index: var(--z-dropdown);
        }

        .navbar__dropdown-item {
          display: block;
          width: 100%;
          padding: var(--space-sm);
          color: var(--color-text-primary);
          text-decoration: none;
          border-radius: var(--radius-md);
          transition: var(--transition-fast);
          cursor: pointer;
        }

        .navbar__dropdown-item:hover,
        .navbar__dropdown-item--focused {
          background: rgba(255, 255, 255, 0.05);
          color: var(--gold);
        }

        .navbar__dropdown-item:focus-visible {
          outline: none;
          box-shadow: var(--focus-ring-inset);
        }

        .navbar__dropdown-item-content {
          display: flex;
          flex-direction: column;
          gap: var(--space-xs);
        }

        .navbar__dropdown-item-label {
          font-weight: var(--font-medium);
          font-size: var(--text-sm);
        }

        .navbar__dropdown-item-description {
          font-size: var(--text-xs);
          color: var(--color-text-muted);
        }

        .navbar__mobile-toggle {
          display: none;
          flex-direction: column;
          justify-content: space-around;
          width: 24px;
          height: 24px;
          background: none;
          border: none;
          cursor: pointer;
          padding: 0;
          margin-left: var(--space-sm);
        }

        .navbar__burger-line {
          width: 100%;
          height: 2px;
          background: var(--color-text-primary);
          transition: var(--transition-fast);
          transform-origin: center;
        }

        .navbar__mobile-toggle[aria-expanded="true"] .navbar__burger-line:nth-child(1) {
          transform: rotate(45deg) translate(5px, 5px);
        }

        .navbar__mobile-toggle[aria-expanded="true"] .navbar__burger-line:nth-child(2) {
          opacity: 0;
        }

        .navbar__mobile-toggle[aria-expanded="true"] .navbar__burger-line:nth-child(3) {
          transform: rotate(-45deg) translate(7px, -6px);
        }

        .navbar__mobile-toggle:focus-visible {
          outline: none;
          box-shadow: var(--focus-ring);
          border-radius: var(--radius-sm);
        }

        .navbar__mobile-menu {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: var(--dropdown-bg);
          border-bottom: 1px solid var(--dropdown-border);
          box-shadow: var(--shadow-lg);
          z-index: var(--z-dropdown);
          display: none;
        }

        .navbar__mobile-content {
          padding: var(--space-lg) var(--space-md);
          max-width: 1280px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: var(--space-sm);
        }

        .navbar__mobile-link {
          display: block;
          padding: var(--space-sm);
          color: var(--color-text-primary);
          text-decoration: none;
          font-weight: var(--font-medium);
          border-radius: var(--radius-md);
          transition: var(--transition-fast);
        }

        .navbar__mobile-link:hover,
        .navbar__mobile-link:focus-visible {
          background: rgba(255, 255, 255, 0.05);
          color: var(--gold);
        }

        .navbar__mobile-link:focus-visible {
          outline: none;
          box-shadow: var(--focus-ring-inset);
        }

        .navbar__mobile-link--sub {
          padding-left: var(--space-lg);
        }

        .navbar__mobile-section {
          margin-top: var(--space-md);
          padding-top: var(--space-md);
          border-top: 1px solid var(--color-border-muted);
        }

        .navbar__mobile-section-title {
          display: block;
          padding: var(--space-sm);
          color: var(--color-text-muted);
          font-size: var(--text-xs);
          font-weight: var(--font-semibold);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .navbar__mobile-link-content {
          display: flex;
          flex-direction: column;
          gap: var(--space-xs);
        }

        .navbar__mobile-link-label {
          font-weight: var(--font-medium);
        }

        .navbar__mobile-link-description {
          font-size: var(--text-xs);
          color: var(--color-text-muted);
        }

        @media (max-width: 768px) {
          .navbar {
            height: var(--navbar-height-mobile);
          }

          .navbar__section--left,
          .navbar__section--right .navbar__link,
          .navbar__dropdown {
            display: none;
          }

          .navbar__mobile-toggle,
          .navbar__mobile-menu {
            display: flex;
          }

          .navbar__mobile-menu {
            display: block;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .navbar__link,
          .navbar__dropdown-trigger,
          .navbar__dropdown-item,
          .navbar__mobile-link,
          .navbar__burger-line,
          .navbar__dropdown-icon {
            transition: none;
          }

          .navbar__mobile-toggle[aria-expanded="true"] .navbar__burger-line:nth-child(1),
          .navbar__mobile-toggle[aria-expanded="true"] .navbar__burger-line:nth-child(3) {
            transition: none;
          }
        }
      `}</style>
    </>
  );
}