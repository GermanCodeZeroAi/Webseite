/**
 * OptimizedImage Component for German Code Zero AI
 * 
 * Modern image component with AVIF/WebP support and lazy loading.
 * Features:
 * - Modern format support (AVIF, WebP, JPEG fallback)
 * - Responsive images with srcset
 * - Lazy loading with intersection observer
 * - Accessibility support
 * - Performance optimized
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';

interface OptimizedImageProps {
  /** Base path of the image (without extension) */
  src: string;
  /** Alt text for accessibility */
  alt: string;
  /** Image width */
  width?: number;
  /** Image height */
  height?: number;
  /** Image quality (1-100) */
  quality?: number;
  /** Sizes attribute for responsive images */
  sizes?: string;
  /** CSS class name */
  className?: string;
  /** Loading strategy */
  loading?: 'lazy' | 'eager';
  /** Priority loading (preload) */
  priority?: boolean;
  /** Placeholder while loading */
  placeholder?: string;
  /** Error fallback */
  onError?: () => void;
  /** Load callback */
  onLoad?: () => void;
}

/**
 * Generate source URLs for different formats
 */
function generateSources(
  basePath: string,
  width: number,
  height?: number,
  quality: number = 85
): {
  avif: string;
  webp: string;
  fallback: string;
} {
  const sizeSuffix = height ? `${width}x${height}` : `${width}w`;
  const qualitySuffix = `q${quality}`;
  
  return {
    avif: `${basePath}-${sizeSuffix}-${qualitySuffix}.avif`,
    webp: `${basePath}-${sizeSuffix}-${qualitySuffix}.webp`,
    fallback: `${basePath}-${sizeSuffix}-${qualitySuffix}.jpg`
  };
}

/**
 * Generate responsive srcset for different breakpoints
 */
function generateSrcSet(basePath: string, format: 'avif' | 'webp' | 'fallback', quality: number = 85): string {
  const sources = [
    { width: 400, descriptor: '400w' },
    { width: 800, descriptor: '800w' },
    { width: 1200, descriptor: '1200w' },
    { width: 1600, descriptor: '1600w' }
  ];

  return sources
    .map(({ width, descriptor }) => {
      const urls = generateSources(basePath, width, undefined, quality);
      return `${urls[format]} ${descriptor}`;
    })
    .join(', ');
}

export default function OptimizedImage({
  src,
  alt,
  width,
  height,
  quality = 85,
  sizes = '100vw',
  className = '',
  loading = 'lazy',
  priority = false,
  placeholder,
  onError,
  onLoad
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(loading === 'eager' || priority);
  const imgRef = useRef<HTMLImageElement>(null);
  const pictureRef = useRef<HTMLPictureElement>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (loading === 'eager' || priority || isInView) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '50px'
      }
    );

    if (pictureRef.current) {
      observer.observe(pictureRef.current);
    }

    return () => observer.disconnect();
  }, [loading, priority, isInView]);

  // Handle image load
  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  // Handle image error
  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  // Don't render sources until in view (for lazy loading)
  if (!isInView) {
    return (
      <picture ref={pictureRef} className={`optimized-image ${className}`}>
        {placeholder && (
          <img
            src={placeholder}
            alt={alt}
            className="optimized-image__placeholder"
            style={{
              width: width ? `${width}px` : 'auto',
              height: height ? `${height}px` : 'auto',
              filter: 'blur(5px)',
              transition: 'filter 0.3s ease'
            }}
          />
        )}
        <style jsx>{`
          .optimized-image {
            display: block;
            background: linear-gradient(90deg, rgba(255, 215, 0, 0.1) 0%, rgba(255, 215, 0, 0.2) 50%, rgba(255, 215, 0, 0.1) 100%);
            background-size: 200% 100%;
            animation: shimmer 2s infinite;
          }
          @keyframes shimmer {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
          }
          @media (prefers-reduced-motion: reduce) {
            .optimized-image {
              animation: none;
              background: rgba(255, 215, 0, 0.1);
            }
          }
        `}</style>
      </picture>
    );
  }

  return (
    <picture ref={pictureRef} className={`optimized-image ${className}`}>
      {/* AVIF source - best compression */}
      <source
        type="image/avif"
        srcSet={generateSrcSet(src, 'avif', quality)}
        sizes={sizes}
      />

      {/* WebP source - good compression, wide support */}
      <source
        type="image/webp"
        srcSet={generateSrcSet(src, 'webp', quality)}
        sizes={sizes}
      />

      {/* JPEG fallback - universal support */}
      <img
        ref={imgRef}
        src={generateSources(src, width || 800, height, quality).fallback}
        srcSet={generateSrcSet(src, 'fallback', quality)}
        alt={alt}
        width={width}
        height={height}
        sizes={sizes}
        loading={loading}
        onLoad={handleLoad}
        onError={handleError}
        className={`optimized-image__img ${isLoaded ? 'loaded' : ''} ${hasError ? 'error' : ''}`}
        style={{
          opacity: isLoaded ? 1 : 0,
          transition: 'opacity 0.3s ease'
        }}
      />

      {/* Priority preload link */}
      {priority && (
        <>
          <link
            rel="preload"
            as="image"
            href={generateSources(src, width || 800, height, quality).avif}
            type="image/avif"
          />
          <link
            rel="preload"
            as="image"
            href={generateSources(src, width || 800, height, quality).webp}
            type="image/webp"
          />
        </>
      )}

      <style jsx>{`
        .optimized-image {
          display: block;
          position: relative;
          overflow: hidden;
        }

        .optimized-image__img {
          width: 100%;
          height: auto;
          display: block;
        }

        .optimized-image__img.loaded {
          opacity: 1;
        }

        .optimized-image__img.error {
          opacity: 1;
          background: linear-gradient(45deg, #333 25%, transparent 25%), 
                      linear-gradient(-45deg, #333 25%, transparent 25%), 
                      linear-gradient(45deg, transparent 75%, #333 75%), 
                      linear-gradient(-45deg, transparent 75%, #333 75%);
          background-size: 20px 20px;
          background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
        }

        .optimized-image__placeholder {
          width: 100%;
          height: auto;
          display: block;
        }
      `}</style>
    </picture>
  );
}

/**
 * Hook for programmatic image optimization
 */
export function useOptimizedImage(src: string, quality: number = 85) {
  const generateUrls = (width: number, height?: number) => {
    return generateSources(src, width, height, quality);
  };

  const generateResponsiveSrcSet = (format: 'avif' | 'webp' | 'fallback') => {
    return generateSrcSet(src, format, quality);
  };

  return {
    generateUrls,
    generateResponsiveSrcSet,
    avifSrcSet: generateResponsiveSrcSet('avif'),
    webpSrcSet: generateResponsiveSrcSet('webp'),
    fallbackSrcSet: generateResponsiveSrcSet('fallback')
  };
}