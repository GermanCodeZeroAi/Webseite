/**
 * Root Layout for German Code Zero AI
 * 
 * Global layout with performance optimizations, preconnects,
 * and essential meta tags for all pages.
 */

import React from 'react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  metadataBase: new URL('https://germancodezero.ai'),
  title: {
    default: 'German Code Zero AI - Premium B2B Services',
    template: '%s | German Code Zero AI',
  },
  description: 'Premium B2B services and solutions with cutting-edge AI technology',
  keywords: ['b2b', 'services', 'ai', 'automation', 'premium', 'enterprise'],
  authors: [{ name: 'German Code Zero AI' }],
  creator: 'German Code Zero AI',
  publisher: 'German Code Zero AI',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
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
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="de" suppressHydrationWarning>
      <head>
        {/* Performance-critical preconnects */}
        <link rel="preconnect" href="https://js.stripe.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://api.stripe.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://fonts.googleapis.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* DNS prefetch for additional domains */}
        <link rel="dns-prefetch" href="//www.googletagmanager.com" />
        <link rel="dns-prefetch" href="//www.google-analytics.com" />
        <link rel="dns-prefetch" href="//cdnjs.cloudflare.com" />
        
        {/* Preload critical resources */}
        <link 
          rel="preload" 
          href="/fonts/inter-var.woff2" 
          as="font" 
          type="font/woff2" 
          crossOrigin="anonymous"
        />
        
        {/* Favicon and app icons */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
        
        {/* Theme and viewport */}
        <meta name="theme-color" content="#FFD700" />
        <meta name="color-scheme" content="dark light" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes" />
        
        {/* Security headers */}
        <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
        <meta httpEquiv="X-Frame-Options" content="DENY" />
        <meta httpEquiv="X-XSS-Protection" content="1; mode=block" />
        <meta name="referrer" content="origin-when-cross-origin" />
        
        {/* Performance hints */}
        <meta httpEquiv="X-DNS-Prefetch-Control" content="on" />
        
        {/* Critical CSS for above-the-fold content */}
        <style dangerouslySetInnerHTML={{
          __html: `
            /* Critical CSS for initial paint */
            *,*::before,*::after{box-sizing:border-box}
            html{line-height:1.15;-webkit-text-size-adjust:100%}
            body{margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Oxygen,Ubuntu,Cantarell,'Helvetica Neue',sans-serif;background:#000;color:#fff}
            main{display:block}
            h1{font-size:2em;margin:.67em 0}
            a{background-color:transparent;color:inherit;text-decoration:none}
            button{font-family:inherit;font-size:100%;line-height:1.15;margin:0;overflow:visible;text-transform:none;background:none;border:none;cursor:pointer}
            [hidden]{display:none}
            .sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
            @media(prefers-reduced-motion:reduce){*,*::before,*::after{animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important;scroll-behavior:auto!important}}
          `
        }} />
      </head>
      <body>
        {/* Skip to main content link for accessibility */}
        <a 
          href="#main-content" 
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-yellow-400 focus:text-black focus:rounded"
        >
          Skip to main content
        </a>

        {/* Main content wrapper */}
        <div id="main-content">
          {children}
        </div>

        {/* Performance monitoring script */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Critical performance monitoring
              if ('PerformanceObserver' in window) {
                // Monitor LCP
                new PerformanceObserver((list) => {
                  const entries = list.getEntries();
                  const lastEntry = entries[entries.length - 1];
                  console.log('LCP:', lastEntry.startTime);
                }).observe({entryTypes: ['largest-contentful-paint']});

                // Monitor FID
                new PerformanceObserver((list) => {
                  list.getEntries().forEach((entry) => {
                    console.log('FID:', entry.processingStart - entry.startTime);
                  });
                }).observe({entryTypes: ['first-input']});

                // Monitor CLS
                let clsValue = 0;
                new PerformanceObserver((list) => {
                  list.getEntries().forEach((entry) => {
                    if (!entry.hadRecentInput) {
                      clsValue += entry.value;
                      console.log('CLS:', clsValue);
                    }
                  });
                }).observe({entryTypes: ['layout-shift']});
              }

              // Resource timing
              window.addEventListener('load', () => {
                const navigation = performance.getEntriesByType('navigation')[0];
                console.log('TTFB:', navigation.responseStart - navigation.requestStart);
                console.log('Load time:', navigation.loadEventEnd - navigation.fetchStart);
              });
            `
          }}
        />
      </body>
    </html>
  );
}