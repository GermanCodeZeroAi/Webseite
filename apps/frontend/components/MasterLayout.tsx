/**
 * MasterLayout - INSANE Master Layout with All Effects
 * 
 * KRASSE master layout that combines all our insane components.
 * Features:
 * - Page transitions with neural networks
 * - Sound system integration
 * - Touch gesture recognition
 * - Easter egg activation
 * - Performance monitoring
 * - Global animation orchestration
 */

'use client';

import React, { useEffect, useState } from 'react';
import PageTransition from './PageTransition';
import SoundSystem from './SoundSystem';
import TouchGestures from './TouchGestures';
import EasterEggs from './EasterEggs';

interface MasterLayoutProps {
  children: React.ReactNode;
  enableSound?: boolean;
  enableGestures?: boolean;
  enableEasterEggs?: boolean;
  enableTransitions?: boolean;
  className?: string;
}

export default function MasterLayout({
  children,
  enableSound = true,
  enableGestures = true,
  enableEasterEggs = true,
  enableTransitions = true,
  className = ''
}: MasterLayoutProps) {
  const [isClient, setIsClient] = useState(false);
  const [performanceMode, setPerformanceMode] = useState<'high' | 'medium' | 'low'>('high');

  // Client-side only rendering
  useEffect(() => {
    setIsClient(true);

    // Detect device performance level
    const detectPerformance = () => {
      const memory = (navigator as any).deviceMemory;
      const cores = navigator.hardwareConcurrency;
      const connection = (navigator as any).connection;

      let score = 0;
      
      // Memory check
      if (memory >= 8) score += 3;
      else if (memory >= 4) score += 2;
      else score += 1;
      
      // CPU cores check
      if (cores >= 8) score += 3;
      else if (cores >= 4) score += 2;
      else score += 1;
      
      // Connection check
      if (connection) {
        if (connection.effectiveType === '4g') score += 2;
        else if (connection.effectiveType === '3g') score += 1;
      }

      if (score >= 7) setPerformanceMode('high');
      else if (score >= 4) setPerformanceMode('medium');
      else setPerformanceMode('low');
    };

    detectPerformance();
  }, []);

  // Performance-based feature enabling
  const getFeatureSettings = () => {
    switch (performanceMode) {
      case 'high':
        return {
          sound: enableSound,
          gestures: enableGestures,
          easterEggs: enableEasterEggs,
          transitions: enableTransitions,
          trails: true,
          haptic: true
        };
      case 'medium':
        return {
          sound: enableSound,
          gestures: enableGestures,
          easterEggs: false,
          transitions: enableTransitions,
          trails: true,
          haptic: false
        };
      case 'low':
        return {
          sound: false,
          gestures: false,
          easterEggs: false,
          transitions: false,
          trails: false,
          haptic: false
        };
    }
  };

  const features = getFeatureSettings();

  if (!isClient) {
    // Server-side rendering fallback
    return (
      <div className={`master-layout loading ${className}`}>
        {children}
        <style jsx>{`
          .master-layout.loading {
            opacity: 0;
            animation: fadeIn 0.5s ease-in-out forwards;
          }

          @keyframes fadeIn {
            to { opacity: 1; }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className={`master-layout ${performanceMode} ${className}`}>
      {/* Sound System */}
      {features.sound && (
        <SoundSystem 
          enabled={true}
          volume={0.3}
        />
      )}

      {/* Touch Gestures */}
      {features.gestures ? (
        <TouchGestures
          enabled={true}
          showTrails={features.trails}
          hapticFeedback={features.haptic}
        >
          {/* Page Transitions */}
          {features.transitions ? (
            <PageTransition>
              {children}
            </PageTransition>
          ) : (
            children
          )}
        </TouchGestures>
      ) : (
        features.transitions ? (
          <PageTransition>
            {children}
          </PageTransition>
        ) : (
          children
        )
      )}

      {/* Easter Eggs */}
      {features.easterEggs && (
        <EasterEggs enabled={true} />
      )}

      {/* Performance indicator */}
      <div className="master-layout__performance">
        <div className={`performance-indicator ${performanceMode}`}>
          <span className="performance-label">
            {performanceMode.toUpperCase()} PERFORMANCE
          </span>
          <div className="performance-dots">
            <div className={`dot ${performanceMode === 'high' ? 'active' : ''}`} />
            <div className={`dot ${performanceMode !== 'low' ? 'active' : ''}`} />
            <div className={`dot active`} />
          </div>
        </div>
      </div>

      <style jsx>{`
        .master-layout {
          position: relative;
          width: 100%;
          min-height: 100vh;
          overflow-x: hidden;
        }

        .master-layout__performance {
          position: fixed;
          bottom: 20px;
          left: 20px;
          z-index: 1000;
          opacity: 0.7;
          transition: opacity 0.3s ease;
        }

        .master-layout__performance:hover {
          opacity: 1;
        }

        .performance-indicator {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: rgba(0, 0, 0, 0.8);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 20px;
          padding: 0.5rem 1rem;
          backdrop-filter: blur(10px);
        }

        .performance-label {
          font-size: 0.7rem;
          font-weight: 600;
          color: #ffffff;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .performance-indicator.high .performance-label {
          color: #00FF00;
        }

        .performance-indicator.medium .performance-label {
          color: #FFD700;
        }

        .performance-indicator.low .performance-label {
          color: #FF6B6B;
        }

        .performance-dots {
          display: flex;
          gap: 0.25rem;
        }

        .dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.3);
          transition: background 0.3s ease;
        }

        .dot.active {
          background: #00FF00;
          box-shadow: 0 0 4px #00FF00;
        }

        .performance-indicator.medium .dot.active {
          background: #FFD700;
          box-shadow: 0 0 4px #FFD700;
        }

        .performance-indicator.low .dot.active {
          background: #FF6B6B;
          box-shadow: 0 0 4px #FF6B6B;
        }

        /* Performance mode adjustments */
        .master-layout.low {
          animation: none;
        }

        .master-layout.medium {
          animation-duration: 0.5s;
        }

        .master-layout.high {
          animation-duration: 0.3s;
        }

        @media (max-width: 768px) {
          .master-layout__performance {
            bottom: 10px;
            left: 10px;
          }

          .performance-indicator {
            padding: 0.4rem 0.8rem;
          }

          .performance-label {
            font-size: 0.6rem;
          }

          .dot {
            width: 5px;
            height: 5px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .master-layout,
          .performance-indicator,
          .dot {
            transition: none;
            animation: none;
          }
        }
      `}</style>

      {/* Global touch explosion styles */}
      <style jsx global>{`
        @keyframes touchExplosion {
          0% {
            width: 20px;
            height: 20px;
            opacity: 1;
          }
          50% {
            width: 200px;
            height: 200px;
            opacity: 0.6;
          }
          100% {
            width: 400px;
            height: 400px;
            opacity: 0;
          }
        }

        @keyframes quantumRipple {
          0% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -50%) scale(3);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}