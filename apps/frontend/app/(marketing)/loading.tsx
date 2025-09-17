/**
 * Loading component for marketing routes
 * 
 * Provides a performance-optimized loading state while
 * code chunks are being downloaded and parsed.
 */

import React from 'react';

export default function MarketingLoading() {
  return (
    <div className="marketing-loading">
      <div className="marketing-loading__container">
        <div className="marketing-loading__hero">
          <div className="skeleton skeleton--large" />
          <div className="skeleton skeleton--medium" />
          <div className="skeleton skeleton--small" />
          <div className="skeleton skeleton--button" />
        </div>
      </div>

      <style jsx>{`
        .marketing-loading {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #000000 0%, #1a1a1a 100%);
        }

        .marketing-loading__container {
          width: 100%;
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem;
        }

        .marketing-loading__hero {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2rem;
          text-align: center;
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

        .skeleton--large {
          height: 4rem;
          width: 80%;
          max-width: 600px;
        }

        .skeleton--medium {
          height: 2rem;
          width: 90%;
          max-width: 700px;
        }

        .skeleton--small {
          height: 1.5rem;
          width: 70%;
          max-width: 500px;
        }

        .skeleton--button {
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
          .marketing-loading__container {
            padding: 1.5rem;
          }

          .skeleton--large {
            height: 3rem;
          }

          .skeleton--medium {
            height: 1.5rem;
          }

          .skeleton--small {
            height: 1.25rem;
          }

          .skeleton--button {
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
    </div>
  );
}