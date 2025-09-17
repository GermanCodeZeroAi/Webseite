import React, { useState, useEffect, useRef, useCallback } from 'react';

// Simple i18n implementation - in a real app, this would come from a proper i18n library
const translations = {
  de: {
    'consent.banner.title': 'Datenschutz-Einstellungen',
    'consent.banner.description': 'Diese Website nutzt Technologien zur Datenverarbeitung, um Funktionen bereitzustellen und die Nutzererfahrung zu verbessern. Sie können Ihre Einstellungen jederzeit anpassen oder die Datenverarbeitung ablehnen.',
    'consent.banner.acceptAll': 'Alle akzeptieren',
    'consent.banner.rejectAll': 'Alle ablehnen',
    'consent.banner.customize': 'Einstellungen anpassen',
    'consent.banner.privacy': 'Datenschutzerklärung',
    'consent.banner.statusAccepted': 'Datenverarbeitung wurde zugestimmt',
    'consent.banner.statusRejected': 'Datenverarbeitung wurde abgelehnt',
    'consent.banner.statusCustomized': 'Datenschutz-Einstellungen wurden angepasst',
  },
  en: {
    'consent.banner.title': 'Privacy Settings',
    'consent.banner.description': 'This website uses data processing technologies to provide functionality and improve user experience. You can adjust your settings at any time or reject data processing.',
    'consent.banner.acceptAll': 'Accept All',
    'consent.banner.rejectAll': 'Reject All',
    'consent.banner.customize': 'Customize Settings',
    'consent.banner.privacy': 'Privacy Policy',
    'consent.banner.statusAccepted': 'Data processing has been accepted',
    'consent.banner.statusRejected': 'Data processing has been rejected',
    'consent.banner.statusCustomized': 'Privacy settings have been customized',
  }
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
  
  const t = useCallback((key: string): string => {
    const langTranslations = translations[language];
    if (!langTranslations) return key;
    return (langTranslations as Record<string, string>)[key] || key;
  }, [language]);

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

  // Focus management for accessibility
  useEffect(() => {
    if (isVisible && bannerRef.current) {
      // Focus the reject button first for TTDSG compliance (neutral approach)
      const focusTarget = rejectButtonRef.current || bannerRef.current;
      focusTarget.focus();
      
      // Announce the banner appearance
      setAnnouncement(t('consent.banner.title'));
    }
  }, [isVisible, t]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      // ESC key should close the banner by rejecting all (TTDSG compliant)
      event.preventDefault();
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
    } else if (event.key === 'Enter' || event.key === ' ') {
      // Handle enter/space on focused elements
      const target = event.target as HTMLElement;
      if (target.tagName === 'BUTTON') {
        event.preventDefault();
        target.click();
      }
    }
  }, [handleRejectAll]);

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
        aria-modal="true"
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
          minHeight: '140px',
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
            
            {/* Action buttons - Equal prominence per TTDSG */}
            <div className="flex flex-col sm:flex-row gap-3 lg:ml-6">
              {/* Reject button - equal prominence and positioned first for TTDSG compliance */}
              <button
                ref={rejectButtonRef}
                onClick={handleRejectAll}
                className="
                  px-6 py-3 text-sm font-medium
                  bg-white text-gray-900 
                  border-2 border-gray-400 rounded-md
                  hover:bg-gray-50 hover:border-gray-500
                  focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2
                  transition-all duration-200
                  min-w-[140px] order-1 sm:order-1
                "
                aria-describedby="consent-banner-description"
                aria-label={`${t('consent.banner.rejectAll')} - ${t('consent.banner.description')}`}
              >
                {t('consent.banner.rejectAll')}
              </button>
              
              <button
                ref={acceptButtonRef}
                onClick={handleAcceptAll}
                className="
                  px-6 py-3 text-sm font-medium
                  bg-white text-gray-900 
                  border-2 border-gray-400 rounded-md
                  hover:bg-gray-50 hover:border-gray-500
                  focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2
                  transition-all duration-200
                  min-w-[140px] order-2 sm:order-2
                "
                aria-describedby="consent-banner-description"
                aria-label={`${t('consent.banner.acceptAll')} - ${t('consent.banner.description')}`}
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
                text-sm text-gray-700 hover:text-gray-900 
                focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2
                underline hover:no-underline
                transition-all duration-200
                px-1 py-1 rounded-sm
              "
              aria-label={`${t('consent.banner.customize')} - Öffnet detaillierte Einstellungen`}
            >
              {t('consent.banner.customize')}
            </button>
            
            <button
              onClick={handlePrivacyPolicy}
              className="
                text-sm text-gray-700 hover:text-gray-900 
                focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2
                underline hover:no-underline
                transition-all duration-200
                px-1 py-1 rounded-sm
              "
              aria-label={`${t('consent.banner.privacy')} - Öffnet Datenschutzerklärung in neuem Tab`}
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