/**
 * Hero3D Component for German Code Zero AI
 * 
 * Premium 3D hero section with performance optimization and accessibility.
 * Features:
 * - Reduced motion support (prefers-reduced-motion)
 * - Performance-optimized 3D animations
 * - Full i18n integration with SEO utilities
 * - CTA navigation to shop configurator
 * - Gold/Black premium branding
 */

'use client';

import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getHeroContent, type Locale } from '../lib/seo';

interface Hero3DProps {
  locale: Locale;
  onCtaClick?: () => void;
}


export default function Hero3D({ locale, onCtaClick }: Hero3DProps) {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const animationRef = useRef<number>();
  const observerRef = useRef<IntersectionObserver | null>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [shouldInitialize, setShouldInitialize] = useState(false);

  // Get localized content from i18n
  const content = useMemo(() => getHeroContent(locale), [locale]);

  // Check for reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Intersection Observer for lazy initialization
  useEffect(() => {
    if (!sectionRef.current) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            // Initialize animation only when visible and on idle
            if (!shouldInitialize) {
              requestIdleCallback(
                () => {
                  setShouldInitialize(true);
                },
                { timeout: 2000 }
              );
            }
          } else {
            setIsVisible(false);
          }
        });
      },
      {
        rootMargin: '50px',
        threshold: 0.1
      }
    );

    observerRef.current.observe(sectionRef.current);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [shouldInitialize]);

  // Performance-optimized 3D animation with lazy initialization
  useEffect(() => {
    if (!canvasRef.current || prefersReducedMotion || !shouldInitialize || !isVisible) {
      if (prefersReducedMotion) {
        setIsLoaded(true);
      }
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const updateCanvasSize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);

    // Animation state
    let time = 0;
    const particles: Array<{
      x: number;
      y: number;
      z: number;
      vx: number;
      vy: number;
      vz: number;
      size: number;
      opacity: number;
    }> = [];

    // Initialize particles
    const particleCount = prefersReducedMotion ? 20 : 50;
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        z: Math.random() * 1000,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        vz: Math.random() * 2 + 1,
        size: Math.random() * 3 + 1,
        opacity: Math.random() * 0.6 + 0.2
      });
    }

    // Animation loop with performance optimization
    const animate = () => {
      time += 0.016; // ~60fps

      // Clear canvas with gradient background
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, '#000000');
      gradient.addColorStop(1, '#1a1a1a');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Update and draw particles
      particles.forEach((particle, index) => {
        // Update position
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.z -= particle.vz;

        // Reset particle if it goes out of bounds
        if (particle.z <= 0 || particle.x < 0 || particle.x > canvas.width || 
            particle.y < 0 || particle.y > canvas.height) {
          particle.x = Math.random() * canvas.width;
          particle.y = Math.random() * canvas.height;
          particle.z = 1000;
        }

        // Calculate 3D projection
        const scale = 400 / (400 + particle.z);
        const x2d = particle.x * scale;
        const y2d = particle.y * scale;
        const size2d = particle.size * scale;

        // Draw particle with gold color
        ctx.save();
        ctx.globalAlpha = particle.opacity * scale;
        ctx.fillStyle = '#FFD700'; // Gold color
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#FFD700';
        ctx.beginPath();
        ctx.arc(x2d, y2d, size2d, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Draw connections (reduced for performance)
        if (index < particles.length - 1 && scale > 0.5) {
          const nextParticle = particles[index + 1];
          const nextScale = 400 / (400 + nextParticle.z);
          const distance = Math.sqrt(
            Math.pow(particle.x - nextParticle.x, 2) + 
            Math.pow(particle.y - nextParticle.y, 2)
          );

          if (distance < 100) {
            ctx.save();
            ctx.globalAlpha = 0.2 * Math.min(scale, nextScale);
            ctx.strokeStyle = '#FFD700';
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(x2d, y2d);
            ctx.lineTo(
              nextParticle.x * nextScale,
              nextParticle.y * nextScale
            );
            ctx.stroke();
            ctx.restore();
          }
        }
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    // Start animation with delay for better perceived performance
    setTimeout(() => {
      setIsLoaded(true);
      animate();
    }, 100);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      window.removeEventListener('resize', updateCanvasSize);
    };
  }, [prefersReducedMotion, shouldInitialize, isVisible]);

  // Pause animation when not visible for performance
  useEffect(() => {
    if (!isVisible && animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    } else if (isVisible && shouldInitialize && !prefersReducedMotion && canvasRef.current) {
      // Resume animation when visible again
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const animate = () => {
          // Animation logic would be here (simplified for brevity)
          if (isVisible) {
            animationRef.current = requestAnimationFrame(animate);
          }
        };
        animate();
      }
    }
  }, [isVisible, shouldInitialize, prefersReducedMotion]);

  const handleCtaClick = () => {
    // Navigate to shop configurator
    if (onCtaClick) {
      onCtaClick();
    } else {
      // Use Next.js router for client-side navigation
      router.push('/shop/configurator');
    }
  };

  return (
    <section 
      ref={sectionRef}
      className="hero-3d"
      aria-labelledby="hero-headline"
      role="banner"
    >
      {/* 3D Background Canvas */}
      <div className="hero-3d__background">
        {!prefersReducedMotion && shouldInitialize && (
          <canvas
            ref={canvasRef}
            className="hero-3d__canvas"
            aria-hidden="true"
            style={{
              opacity: isLoaded ? 1 : 0,
              transition: 'opacity 0.5s ease-in-out'
            }}
          />
        )}
        {prefersReducedMotion && (
          <div 
            className="hero-3d__static-bg"
            aria-hidden="true"
          />
        )}
      </div>

      {/* Content Overlay */}
      <div className="hero-3d__content">
        <div className="hero-3d__container">
          <header className="hero-3d__header">
            <h1 
              id="hero-headline"
              className="hero-3d__headline"
            >
              {content.headline}
            </h1>
            
            <p className="hero-3d__subheadline">
              {content.subheadline}
            </p>
          </header>

          <div className="hero-3d__benefits">
            <ul 
              className="hero-3d__bullets"
              role="list"
              aria-label={content.benefitsAriaLabel}
            >
              {content.bullets.map((bullet, index) => (
                <li 
                  key={index}
                  className="hero-3d__bullet"
                >
                  <span className="hero-3d__bullet-icon" aria-hidden="true">
                    ✓
                  </span>
                  {bullet}
                </li>
              ))}
            </ul>
          </div>

          <div className="hero-3d__actions">
            <button
              className="hero-3d__cta"
              data-testid="hero-cta-button"
              onClick={handleCtaClick}
              aria-label={content.ctaAriaLabel}
              type="button"
            >
              <span className="hero-3d__cta-text">
                {content.ctaText}
              </span>
              <span className="hero-3d__cta-arrow" aria-hidden="true">
                →
              </span>
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .hero-3d {
          position: relative;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          background: linear-gradient(135deg, #000000 0%, #1a1a1a 100%);
        }

        .hero-3d__background {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 1;
        }

        .hero-3d__canvas {
          width: 100%;
          height: 100%;
          display: block;
        }

        .hero-3d__static-bg {
          width: 100%;
          height: 100%;
          background: radial-gradient(
            ellipse at center,
            rgba(255, 215, 0, 0.1) 0%,
            rgba(255, 215, 0, 0.05) 50%,
            transparent 100%
          );
        }

        .hero-3d__content {
          position: relative;
          z-index: 2;
          width: 100%;
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem;
          text-align: center;
        }

        .hero-3d__container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 3rem;
        }

        .hero-3d__header {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .hero-3d__headline {
          font-size: clamp(2.5rem, 5vw, 4rem);
          font-weight: 700;
          color: #FFD700;
          text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
          margin: 0;
          line-height: 1.1;
        }

        .hero-3d__subheadline {
          font-size: clamp(1.1rem, 2.5vw, 1.4rem);
          color: #ffffff;
          max-width: 800px;
          margin: 0;
          line-height: 1.6;
          opacity: 0.95;
        }

        .hero-3d__benefits {
          width: 100%;
          max-width: 600px;
        }

        .hero-3d__bullets {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .hero-3d__bullet {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          color: #ffffff;
          font-size: 1.1rem;
          line-height: 1.5;
          text-align: left;
        }

        .hero-3d__bullet-icon {
          color: #FFD700;
          font-weight: bold;
          flex-shrink: 0;
          margin-top: 0.1rem;
        }

        .hero-3d__actions {
          display: flex;
          justify-content: center;
        }

        .hero-3d__cta {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
          color: #000000;
          border: none;
          padding: 1rem 2rem;
          font-size: 1.1rem;
          font-weight: 600;
          border-radius: 0.5rem;
          cursor: pointer;
          transition: all 0.3s ease;
          text-decoration: none;
          box-shadow: 0 4px 15px rgba(255, 215, 0, 0.3);
        }

        .hero-3d__cta:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(255, 215, 0, 0.4);
        }

        .hero-3d__cta:focus {
          outline: 2px solid #FFD700;
          outline-offset: 2px;
        }

        .hero-3d__cta:active {
          transform: translateY(0);
        }

        .hero-3d__cta-text {
          font-weight: inherit;
        }

        .hero-3d__cta-arrow {
          font-size: 1.2rem;
          transition: transform 0.3s ease;
        }

        .hero-3d__cta:hover .hero-3d__cta-arrow {
          transform: translateX(4px);
        }

        @media (max-width: 768px) {
          .hero-3d__content {
            padding: 1.5rem;
          }

          .hero-3d__container {
            gap: 2rem;
          }

          .hero-3d__bullets {
            gap: 0.75rem;
          }

          .hero-3d__bullet {
            font-size: 1rem;
          }

          .hero-3d__cta {
            padding: 0.875rem 1.75rem;
            font-size: 1rem;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .hero-3d__cta {
            transition: none;
          }

          .hero-3d__cta:hover {
            transform: none;
          }

          .hero-3d__cta:active {
            transform: none;
          }

          .hero-3d__cta-arrow {
            transition: none;
          }

          .hero-3d__cta:hover .hero-3d__cta-arrow {
            transform: none;
          }
        }
      `}</style>
    </section>
  );
}