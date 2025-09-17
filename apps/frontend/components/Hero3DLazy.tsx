/**
 * Lazy-loaded Hero3D Component for German Code Zero AI
 * 
 * This component provides lazy loading for the 3D hero section to improve
 * initial bundle size and loading performance.
 */

'use client';

import React, { Suspense, lazy } from 'react';
import { type Locale } from '../lib/seo';

// Lazy load the actual Hero3D component
const Hero3D = lazy(() => import('./Hero3D'));

interface Hero3DLazyProps {
  locale: Locale;
  onCtaClick?: () => void;
}

// Loading fallback component
function Hero3DFallback() {
  return (
    <section 
      className="hero-3d-fallback"
      aria-labelledby="hero-headline-fallback"
      role="banner"
    >
      <div className="hero-3d-fallback__content">
        <div className="hero-3d-fallback__container">
          <div className="hero-3d-fallback__skeleton">
            <div className="skeleton skeleton--headline" />
            <div className="skeleton skeleton--subheadline" />
            <div className="skeleton skeleton--bullets">
              <div className="skeleton skeleton--bullet" />
              <div className="skeleton skeleton--bullet" />
              <div className="skeleton skeleton--bullet" />
            </div>
            <div className="skeleton skeleton--cta" />
          </div>
        </div>
      </div>

      <style jsx>{`
        .hero-3d-fallback {
          position: relative;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          background: linear-gradient(135deg, #000000 0%, #1a1a1a 100%);
        }

        .hero-3d-fallback__content {
          position: relative;
          z-index: 2;
          width: 100%;
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem;
          text-align: center;
        }

        .hero-3d-fallback__container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 3rem;
        }

        .hero-3d-fallback__skeleton {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2rem;
          width: 100%;
          max-width: 800px;
        }

        .skeleton {
          background: linear-gradient(
            90deg,
            rgba(255, 215, 0, 0.1) 0%,
            rgba(255, 215, 0, 0.2) 50%,
            rgba(255, 215, 0, 0.1) 100%
          );
          background-size: 200% 100%;
          animation: shimmer 2s infinite;
          border-radius: 0.5rem;
        }

        .skeleton--headline {
          height: 4rem;
          width: 80%;
          max-width: 600px;
        }

        .skeleton--subheadline {
          height: 2rem;
          width: 90%;
          max-width: 700px;
        }

        .skeleton--bullets {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          width: 100%;
          max-width: 600px;
        }

        .skeleton--bullet {
          height: 1.5rem;
          width: 100%;
        }

        .skeleton--cta {
          height: 3rem;
          width: 200px;
          border-radius: 0.5rem;
        }

        @keyframes shimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }

        @media (max-width: 768px) {
          .hero-3d-fallback__content {
            padding: 1.5rem;
          }

          .hero-3d-fallback__container {
            gap: 2rem;
          }

          .skeleton--headline {
            height: 3rem;
          }

          .skeleton--subheadline {
            height: 1.5rem;
          }

          .skeleton--bullet {
            height: 1.25rem;
          }

          .skeleton--cta {
            height: 2.5rem;
            width: 180px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .skeleton {
            animation: none;
            background: rgba(255, 215, 0, 0.15);
          }
        }
      `}</style>
    </section>
  );
}

export default function Hero3DLazy({ locale, onCtaClick }: Hero3DLazyProps) {
  return (
    <Suspense fallback={<Hero3DFallback />}>
      <Hero3D locale={locale} onCtaClick={onCtaClick} />
    </Suspense>
  );
}