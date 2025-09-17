/**
 * Root Layout for German Code Zero AI
 * 
 * App Router root layout with proper HTML structure, landmarks, and accessibility.
 * Features:
 * - Semantic HTML with proper lang attribute
 * - Font loading optimization (system fonts + Inter)
 * - Skip links for accessibility
 * - Landmark roles and ARIA structure
 * - Header and Footer components (imported from separate files)
 */

import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { getPageSeo, type Locale } from '../lib/seo';

// Configure Inter font with display swap for performance
const inter = Inter({
  subsets: ['latin', 'latin-ext'],
  display: 'swap',
  variable: '--font-inter',
  preload: true,
  fallback: [
    'system-ui',
    '-apple-system',
    'BlinkMacSystemFont',
    'Segoe UI',
    'Roboto',
    'Oxygen',
    'Ubuntu',
    'Cantarell',
    'Open Sans',
    'Helvetica Neue',
    'sans-serif'
  ]
});

// Default metadata for the application
export const metadata: Metadata = {
  metadataBase: new URL('https://germancodezero.ai'),
  title: {
    default: 'German Code Zero AI – Premium B2B Services',
    template: '%s | German Code Zero AI'
  },
  description: 'Premium B2B Services für Revenue- und Service-Orchestrierung. Mehr Umsatz. Weniger Reibung.',
  keywords: ['B2B Services', 'Revenue Orchestration', 'Service Automation', 'Premium B2B', 'German Code Zero AI'],
  authors: [{ name: 'German Code Zero AI' }],
  creator: 'German Code Zero AI',
  publisher: 'German Code Zero AI',
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
  openGraph: {
    type: 'website',
    locale: 'de_DE',
    url: 'https://germancodezero.ai',
    siteName: 'German Code Zero AI',
    title: 'German Code Zero AI – Premium B2B Services',
    description: 'Premium B2B Services für Revenue- und Service-Orchestrierung. Mehr Umsatz. Weniger Reibung.',
    images: [
      {
        url: '/og/default-black-gold.png',
        width: 1200,
        height: 630,
        alt: 'German Code Zero AI – Premium B2B Services',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@germancodezeroai',
    creator: '@germancodezeroai',
  },
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      { rel: 'mask-icon', url: '/safari-pinned-tab.svg', color: '#000000' },
    ],
  },
  manifest: '/site.webmanifest',
  alternates: {
    canonical: 'https://germancodezero.ai',
    languages: {
      'de': 'https://germancodezero.ai',
      'en': 'https://germancodezero.ai/en',
    },
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
  },
  category: 'technology',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' },
  ],
};

interface RootLayoutProps {
  children: React.ReactNode;
  params?: { locale?: string };
}

export default function RootLayout({ children, params }: RootLayoutProps) {
  // Determine locale from params or default to 'de'
  const locale: Locale = (params?.locale as Locale) || 'de';

  return (
    <html 
      lang={locale} 
      className={`${inter.variable}`}
      dir="ltr"
    >
      <head>
        {/* Preconnect to Google Fonts for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* DNS prefetch for performance */}
        <link rel="dns-prefetch" href="https://www.google-analytics.com" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        
        {/* Preload critical resources */}
        <link
          rel="preload"
          href="/fonts/inter-var.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
      </head>
      
      <body className={inter.className}>
        {/* Skip Links for Accessibility */}
        <a 
          href="#main-content" 
          className="skip-link"
          aria-label={locale === 'de' ? 'Zum Hauptinhalt springen' : 'Skip to main content'}
        >
          {locale === 'de' ? 'Zum Hauptinhalt springen' : 'Skip to main content'}
        </a>
        <a 
          href="#navigation" 
          className="skip-link"
          aria-label={locale === 'de' ? 'Zur Navigation springen' : 'Skip to navigation'}
        >
          {locale === 'de' ? 'Zur Navigation springen' : 'Skip to navigation'}
        </a>
        <a 
          href="#footer" 
          className="skip-link"
          aria-label={locale === 'de' ? 'Zum Footer springen' : 'Skip to footer'}
        >
          {locale === 'de' ? 'Zum Footer springen' : 'Skip to footer'}
        </a>

        {/* Page Structure with Landmarks */}
        <div className="app-container">
          {/* Header with Navigation Landmark */}
          <Header locale={locale} />

          {/* Main Content with Main Landmark */}
          <main 
            id="main-content"
            role="main"
            className="main-content"
            tabIndex={-1}
          >
            {children}
          </main>

          {/* Footer with Contentinfo Landmark */}
          <Footer locale={locale} />
        </div>

        {/* Global Styles */}
        <style jsx global>{`
          /* CSS Custom Properties for Design System */
          :root {
            /* Colors - Gold/Black Premium Branding */
            --color-primary: #FFD700;
            --color-primary-dark: #FFA500;
            --color-secondary: #000000;
            --color-background: #000000;
            --color-surface: #1a1a1a;
            --color-text-primary: #ffffff;
            --color-text-secondary: #cccccc;
            --color-text-muted: #999999;
            --color-border: #333333;
            --color-error: #ff4444;
            --color-success: #00ff88;
            --color-warning: #ffaa00;

            /* Typography */
            --font-family-primary: var(--font-inter), system-ui, -apple-system, 
                                   BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 
                                   'Ubuntu', 'Cantarell', 'Open Sans', 'Helvetica Neue', sans-serif;
            --font-family-mono: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', 
                               'Source Code Pro', monospace;

            /* Spacing Scale */
            --space-xs: 0.25rem;
            --space-sm: 0.5rem;
            --space-md: 1rem;
            --space-lg: 1.5rem;
            --space-xl: 2rem;
            --space-2xl: 3rem;
            --space-3xl: 4rem;

            /* Border Radius */
            --radius-sm: 0.25rem;
            --radius-md: 0.5rem;
            --radius-lg: 1rem;

            /* Shadows */
            --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
            --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
            --shadow-gold: 0 4px 15px rgba(255, 215, 0, 0.3);

            /* Z-Index Scale */
            --z-dropdown: 1000;
            --z-sticky: 1020;
            --z-fixed: 1030;
            --z-modal: 1040;
            --z-popover: 1050;
            --z-tooltip: 1060;

            /* Breakpoints (for reference in JS) */
            --breakpoint-sm: 640px;
            --breakpoint-md: 768px;
            --breakpoint-lg: 1024px;
            --breakpoint-xl: 1280px;
            --breakpoint-2xl: 1536px;
          }

          /* Reset and Base Styles */
          * {
            box-sizing: border-box;
          }

          html {
            scroll-behavior: smooth;
            font-size: 16px;
            line-height: 1.6;
          }

          @media (prefers-reduced-motion: reduce) {
            html {
              scroll-behavior: auto;
            }
          }

          body {
            margin: 0;
            padding: 0;
            font-family: var(--font-family-primary);
            font-size: 1rem;
            line-height: 1.6;
            color: var(--color-text-primary);
            background-color: var(--color-background);
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
            text-rendering: optimizeLegibility;
          }

          /* App Container */
          .app-container {
            min-height: 100vh;
            display: flex;
            flex-direction: column;
          }

          /* Main Content */
          .main-content {
            flex: 1;
            outline: none;
          }

          /* Skip Links */
          .skip-link {
            position: absolute;
            top: -48px;
            left: 8px;
            background: var(--color-primary);
            color: var(--color-secondary);
            padding: 8px 16px;
            text-decoration: none;
            border-radius: var(--radius-md);
            font-weight: 600;
            font-size: 0.875rem;
            z-index: var(--z-tooltip);
            transition: top 0.2s ease-in-out;
          }

          .skip-link:focus {
            top: 8px;
          }

          /* Focus Management */
          :focus {
            outline: 2px solid var(--color-primary);
            outline-offset: 2px;
          }

          :focus:not(:focus-visible) {
            outline: none;
          }

          :focus-visible {
            outline: 2px solid var(--color-primary);
            outline-offset: 2px;
          }

          /* High Contrast Mode Support */
          @media (prefers-contrast: high) {
            :root {
              --color-primary: #ffff00;
              --color-background: #000000;
              --color-text-primary: #ffffff;
              --color-border: #ffffff;
            }
          }

          /* Reduced Motion Support */
          @media (prefers-reduced-motion: reduce) {
            *,
            *::before,
            *::after {
              animation-duration: 0.01ms !important;
              animation-iteration-count: 1 !important;
              transition-duration: 0.01ms !important;
              scroll-behavior: auto !important;
            }
          }

          /* Print Styles */
          @media print {
            :root {
              --color-background: #ffffff;
              --color-text-primary: #000000;
              --color-text-secondary: #333333;
            }

            .skip-link {
              display: none;
            }

            .main-content {
              margin: 0;
              box-shadow: none;
            }
          }

          /* Dark Mode Support (if needed in future) */
          @media (prefers-color-scheme: light) {
            /* Light mode overrides would go here if needed */
          }

          /* Font Loading Optimization */
          .font-loading body {
            visibility: hidden;
          }

          .font-loaded body {
            visibility: visible;
          }

          /* Responsive Typography */
          @media (max-width: 768px) {
            html {
              font-size: 14px;
            }
          }

          @media (min-width: 1200px) {
            html {
              font-size: 18px;
            }
          }
        `}</style>
      </body>
    </html>
  );
}