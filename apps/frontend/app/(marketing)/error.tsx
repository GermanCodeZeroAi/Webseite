/**
 * Error boundary for marketing routes
 * 
 * Provides graceful error handling with performance considerations
 * and user-friendly fallback UI.
 */

'use client';

import React, { useEffect } from 'react';

interface MarketingErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function MarketingError({ error, reset }: MarketingErrorProps) {
  useEffect(() => {
    // Log error to monitoring service
    console.error('Marketing route error:', error);
    
    // Send error to analytics (if available)
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'exception', {
        description: error.message,
        fatal: false,
      });
    }
  }, [error]);

  return (
    <div className="marketing-error">
      <div className="marketing-error__container">
        <div className="marketing-error__content">
          <div className="marketing-error__icon" aria-hidden="true">
            ⚠️
          </div>
          
          <h1 className="marketing-error__title">
            Oops! Something went wrong
          </h1>
          
          <p className="marketing-error__description">
            We're sorry, but there was an error loading this page. 
            Please try again or contact support if the problem persists.
          </p>
          
          <div className="marketing-error__actions">
            <button
              onClick={reset}
              className="marketing-error__button marketing-error__button--primary"
              type="button"
            >
              Try again
            </button>
            
            <a
              href="/"
              className="marketing-error__button marketing-error__button--secondary"
            >
              Go home
            </a>
          </div>

          {process.env.NODE_ENV === 'development' && (
            <details className="marketing-error__details">
              <summary>Error details (development only)</summary>
              <pre className="marketing-error__stack">
                {error.message}
                {error.stack && (
                  <>
                    {'\n\n'}
                    {error.stack}
                  </>
                )}
              </pre>
            </details>
          )}
        </div>
      </div>

      <style jsx>{`
        .marketing-error {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #000000 0%, #1a1a1a 100%);
          padding: 2rem;
        }

        .marketing-error__container {
          width: 100%;
          max-width: 600px;
          margin: 0 auto;
        }

        .marketing-error__content {
          text-align: center;
          color: #ffffff;
        }

        .marketing-error__icon {
          font-size: 4rem;
          margin-bottom: 1.5rem;
          filter: grayscale(1);
        }

        .marketing-error__title {
          font-size: clamp(1.75rem, 4vw, 2.5rem);
          font-weight: 700;
          color: #FFD700;
          margin: 0 0 1rem 0;
          line-height: 1.2;
        }

        .marketing-error__description {
          font-size: 1.125rem;
          line-height: 1.6;
          color: rgba(255, 255, 255, 0.9);
          margin: 0 0 2rem 0;
        }

        .marketing-error__actions {
          display: flex;
          gap: 1rem;
          justify-content: center;
          flex-wrap: wrap;
        }

        .marketing-error__button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0.875rem 1.75rem;
          font-size: 1rem;
          font-weight: 600;
          border-radius: 0.5rem;
          text-decoration: none;
          border: none;
          cursor: pointer;
          transition: all 0.3s ease;
          min-width: 140px;
        }

        .marketing-error__button--primary {
          background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
          color: #000000;
          box-shadow: 0 4px 15px rgba(255, 215, 0, 0.3);
        }

        .marketing-error__button--primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(255, 215, 0, 0.4);
        }

        .marketing-error__button--secondary {
          background: transparent;
          color: #ffffff;
          border: 2px solid rgba(255, 255, 255, 0.3);
        }

        .marketing-error__button--secondary:hover {
          border-color: rgba(255, 255, 255, 0.6);
          background: rgba(255, 255, 255, 0.05);
        }

        .marketing-error__details {
          margin-top: 2rem;
          text-align: left;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 0.5rem;
          padding: 1rem;
        }

        .marketing-error__details summary {
          cursor: pointer;
          font-weight: 600;
          color: #FFD700;
          margin-bottom: 0.5rem;
        }

        .marketing-error__stack {
          background: rgba(0, 0, 0, 0.5);
          padding: 1rem;
          border-radius: 0.25rem;
          font-family: 'Courier New', monospace;
          font-size: 0.875rem;
          line-height: 1.4;
          color: #ffffff;
          overflow-x: auto;
          white-space: pre-wrap;
          word-break: break-all;
        }

        @media (max-width: 768px) {
          .marketing-error {
            padding: 1.5rem;
          }

          .marketing-error__actions {
            flex-direction: column;
            align-items: center;
          }

          .marketing-error__button {
            width: 100%;
            max-width: 280px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .marketing-error__button {
            transition: none;
          }

          .marketing-error__button--primary:hover {
            transform: none;
          }
        }
      `}</style>
    </div>
  );
}