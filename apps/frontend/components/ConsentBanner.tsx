import React, { useState, useEffect, useRef, useCallback } from 'react';

// Simple i18n implementation - in a real app, this would come from a proper i18n library
const translations = {
  de: {
    'consent.banner.title': 'Datenschutz-Einstellungen',
    'consent.banner.description': 'Wir verwenden Cookies und ähnliche Technologien, um Ihnen die bestmögliche Nutzererfahrung zu bieten, unsere Website zu verbessern und relevante Inhalte anzuzeigen. Sie können Ihre Einstellungen jederzeit anpassen.',
    'consent.banner.acceptAll': 'Alle akzeptieren',
    'consent.banner.rejectAll': 'Alle ablehnen',
    'consent.banner.customize': 'Einstellungen anpassen',
    'consent.banner.privacy': 'Datenschutzerklärung',
    'consent.banner.statusAccepted': 'Alle Cookies wurden akzeptiert',
    'consent.banner.statusRejected': 'Alle Cookies wurden abgelehnt',
    'consent.banner.statusCustomized': 'Cookie-Einstellungen wurden angepasst',
  },
  en: {
    'consent.banner.title': 'Privacy Settings',
    'consent.banner.description': 'We use cookies and similar technologies to provide you with the best user experience, improve our website and display relevant content. You can adjust your settings at any time.',
    'consent.banner.acceptAll': 'Accept All',
    'consent.banner.rejectAll': 'Reject All',
    'consent.banner.customize': 'Customize Settings',
    'consent.banner.privacy': 'Privacy Policy',
    'consent.banner.statusAccepted': 'All cookies have been accepted',
    'consent.banner.statusRejected': 'All cookies have been rejected',
    'consent.banner.statusCustomized': 'Cookie settings have been customized',
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
    return translations[language]?.[key as keyof typeof translations[typeof language]] || key;
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
            
            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-3 lg:ml-6">
              {/* Equal prominence buttons as per TTDSG requirements */}
              <button
                ref={rejectButtonRef}
                onClick={handleRejectAll}
                className="
                  px-4 py-2 text-sm font-medium
                  bg-gray-100 text-gray-900 
                  border border-gray-300 rounded-md
                  hover:bg-gray-200 focus:outline-none focus:ring-2 
                  focus:ring-gray-500 focus:ring-offset-2
                  transition-colors duration-200
                  min-w-[120px]
                "
                aria-describedby="consent-banner-description"
              >
                {t('consent.banner.rejectAll')}
              </button>
              
              <button
                ref={acceptButtonRef}
                onClick={handleAcceptAll}
                className="
                  px-4 py-2 text-sm font-medium
                  bg-blue-600 text-white 
                  border border-blue-600 rounded-md
                  hover:bg-blue-700 focus:outline-none focus:ring-2 
                  focus:ring-blue-500 focus:ring-offset-2
                  transition-colors duration-200
                  min-w-[120px]
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