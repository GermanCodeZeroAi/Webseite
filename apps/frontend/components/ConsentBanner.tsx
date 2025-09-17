'use client';

import * as React from 'react';
import { useState, useEffect, useRef, useCallback } from 'react';

// Import translations from external i18n configuration
const deTranslations = require('../../../config/i18n/de.json');
const enTranslations = require('../../../config/i18n/en.json');

const translations: Record<'de' | 'en', any> = {
  de: deTranslations,
  en: enTranslations
};

interface ConsentBannerProps {
  language?: 'de' | 'en';
  onAcceptAll?: () => void;
  onRejectAll?: () => void;
  onCustomize?: () => void;
  onPrivacyPolicy?: () => void;
  className?: string;
}

const ConsentBanner: React.FC<ConsentBannerProps> = ({
  language = 'de',
  onAcceptAll,
  onRejectAll,
  onCustomize,
  onPrivacyPolicy,
  className = ''
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [announcement, setAnnouncement] = useState('');
  const bannerRef = useRef<HTMLDivElement>(null);
  const acceptButtonRef = useRef<HTMLButtonElement>(null);
  const rejectButtonRef = useRef<HTMLButtonElement>(null);
  
  const t = useCallback((path: string): string => {
    const keys = path.split('.');
    let value: any = translations[language as keyof typeof translations];
    
    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key];
      } else {
        return path; // Return the path if key not found
      }
    }
    
    return typeof value === 'string' ? value : path;
  }, [language]);

  // Focus management for accessibility
  useEffect(() => {
    if (isVisible && bannerRef.current) {
      // Focus the banner when it appears for screen readers
      bannerRef.current.focus();
    }
  }, [isVisible]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      // ESC key should close the banner by rejecting all (TTDSG compliant)
      handleRejectAll();
    } else if (event.key === 'Tab') {
      // Ensure focus stays within the banner
      const focusableElements = bannerRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      
      if (focusableElements && focusableElements.length > 0) {
        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
        
        if (event.shiftKey && document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        } else if (!event.shiftKey && document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    }
  }, []);

  const handleAcceptAll = useCallback(() => {
    setAnnouncement(t('consent.banner.statusAccepted'));
    setIsVisible(false);
    onAcceptAll?.();
  }, [onAcceptAll, t]);

  const handleRejectAll = useCallback(() => {
    setAnnouncement(t('consent.banner.statusRejected'));
    setIsVisible(false);
    onRejectAll?.();
  }, [onRejectAll, t]);

  const handleCustomize = useCallback(() => {
    setAnnouncement(t('consent.banner.statusCustomized'));
    onCustomize?.();
  }, [onCustomize, t]);

  const handlePrivacyPolicy = useCallback(() => {
    onPrivacyPolicy?.();
  }, [onPrivacyPolicy]);

  if (!isVisible) {
    return (
      <div
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {announcement}
      </div>
    );
  }

  return (
    <>
      {/* Announcement region for screen readers */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {announcement}
      </div>
      
      {/* Main consent banner */}
      <div
        ref={bannerRef}
        role="dialog"
        aria-labelledby="consent-banner-title"
        aria-describedby="consent-banner-description"
        tabIndex={-1}
        onKeyDown={handleKeyDown}
        className={`
          fixed bottom-0 left-0 right-0 z-50 
          bg-white border-t border-gray-200 shadow-lg
          p-4 md:p-6
          ${className}
        `}
        style={{
          // Ensure the banner is always visible and accessible
          minHeight: '120px',
        }}
      >
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Content */}
            <div className="flex-1">
              <h2 
                id="consent-banner-title"
                className="text-lg font-semibold text-gray-900 mb-2"
              >
{t('consent.banner.title')}
              </h2>
              <p 
                id="consent-banner-description"
                className="text-sm text-gray-600 leading-relaxed"
              >
{t('consent.banner.description')}
              </p>
            </div>
            
            {/* Action buttons - TTDSG compliant: equal prominence for reject/accept */}
            <div className="flex flex-col sm:flex-row gap-3 lg:ml-6">
              {/* Reject button - equal prominence as required by TTDSG */}
              <button
                ref={rejectButtonRef}
                onClick={handleRejectAll}
                className="
                  px-4 py-2 text-sm font-medium
                  bg-white text-gray-900 
                  border-2 border-gray-400 rounded-md
                  hover:bg-gray-50 hover:border-gray-500
                  focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2
                  transition-all duration-200
                  min-w-[120px] font-semibold
                "
                aria-describedby="consent-banner-description"
              >
                {t('consent.banner.rejectAll')}
              </button>
              
              {/* Accept button - equal prominence as required by TTDSG */}
              <button
                ref={acceptButtonRef}
                onClick={handleAcceptAll}
                className="
                  px-4 py-2 text-sm font-medium
                  bg-white text-gray-900 
                  border-2 border-gray-400 rounded-md
                  hover:bg-gray-50 hover:border-gray-500
                  focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2
                  transition-all duration-200
                  min-w-[120px] font-semibold
                "
                aria-describedby="consent-banner-description"
              >
                {t('consent.banner.acceptAll')}
              </button>
            </div>
          </div>
          
          {/* Secondary actions */}
          <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-gray-100">
            <button
              onClick={handleCustomize}
              className="
                text-sm text-blue-600 hover:text-blue-800 
                focus:outline-none focus:underline
                transition-colors duration-200
              "
            >
{t('consent.banner.customize')}
            </button>
            
            <button
              onClick={handlePrivacyPolicy}
              className="
                text-sm text-blue-600 hover:text-blue-800 
                focus:outline-none focus:underline
                transition-colors duration-200
              "
            >
{t('consent.banner.privacy')}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ConsentBanner;