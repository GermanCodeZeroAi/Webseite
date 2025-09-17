/**
 * Optimized Image Component for German Code Zero AI
 * 
 * Provides modern image formats (AVIF/WebP) with fallbacks,
 * lazy loading, and responsive sizing for optimal performance.
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  priority?: boolean;
  sizes?: string;
  quality?: number;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  onLoad?: () => void;
  onError?: () => void;
}

interface ImageSources {
  avif: string;
  webp: string;
  jpeg: string;
}

export default function OptimizedImage({
  src,
  alt,
  width,
  height,
  className = '',
  priority = false,
  sizes = '100vw',
  quality = 85,
  placeholder = 'empty',
  blurDataURL,
  onLoad,
  onError,
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const imgRef = useRef<HTMLImageElement>(null);
  const pictureRef = useRef<HTMLPictureElement>(null);

  // Generate optimized image sources
  const generateSources = (baseSrc: string, w: number, q: number): ImageSources => {
    const baseName = baseSrc.replace(/\.[^/.]+$/, '');
    return {
      avif: `${baseName}-${w}w-q${q}.avif`,
      webp: `${baseName}-${w}w-q${q}.webp`,
      jpeg: `${baseName}-${w}w-q${q}.jpg`,
    };
  };

  // Generate responsive srcsets
  const generateSrcSet = (baseSrc: string, format: keyof ImageSources): string => {
    const sizes = [400, 800, 1200, 1600];
    return sizes
      .map(size => {
        const sources = generateSources(baseSrc, size, quality);
        return `${sources[format]} ${size}w`;
      })
      .join(', ');
  };

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (priority || !pictureRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '50px',
        threshold: 0.1,
      }
    );

    observer.observe(pictureRef.current);

    return () => observer.disconnect();
  }, [priority]);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  // Placeholder blur data URL
  const defaultBlurDataURL = 
    'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMSIgaGVpZ2h0PSIxIiB2aWV3Qm94PSIwIDAgMSAxIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiMxYTFhMWEiLz48L3N2Zz4=';

  const errorDataURL =
    'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMSIgaGVpZ2h0PSIxIiB2aWV3Qm94PSIwIDAgMSAxIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiNmYzU1NTUiLz48L3N2Zz4=';

  if (!isInView) {
    return (
      <picture
        ref={pictureRef}
        className={`optimized-image ${className}`}
        style={{ 
          display: 'block', 
          width: '100%', 
          maxWidth: width,
          aspectRatio: `${width}/${height}`,
          backgroundColor: '#1a1a1a',
        }}
      >
        {placeholder === 'blur' && (
          <img
            src={blurDataURL || defaultBlurDataURL}
            alt=""
            aria-hidden="true"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              filter: 'blur(10px)',
            }}
          />
        )}
      </picture>
    );
  }

  return (
    <picture
      ref={pictureRef}
      className={`optimized-image ${className} ${isLoaded ? 'loaded' : ''} ${hasError ? 'error' : ''}`}
    >
      {/* AVIF source */}
      <source
        type="image/avif"
        srcSet={generateSrcSet(src, 'avif')}
        sizes={sizes}
      />
      
      {/* WebP source */}
      <source
        type="image/webp"
        srcSet={generateSrcSet(src, 'webp')}
        sizes={sizes}
      />
      
      {/* JPEG fallback */}
      <img
        ref={imgRef}
        src={hasError ? errorDataURL : generateSources(src, 800, quality).jpeg}
        srcSet={hasError ? undefined : generateSrcSet(src, 'jpeg')}
        sizes={sizes}
        alt={alt}
        width={width}
        height={height}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        onLoad={handleLoad}
        onError={handleError}
        style={{
          width: '100%',
          height: 'auto',
          maxWidth: width,
          transition: 'opacity 0.3s ease',
          opacity: isLoaded ? 1 : 0,
        }}
      />

      <style jsx>{`
        .optimized-image {
          position: relative;
          display: block;
          overflow: hidden;
        }

        .optimized-image img {
          display: block;
          width: 100%;
          height: auto;
        }

        .optimized-image:not(.loaded) img {
          opacity: 0;
        }

        .optimized-image.loaded img {
          opacity: 1;
        }

        .optimized-image.error img {
          opacity: 0.5;
          filter: grayscale(100%);
        }

        @media (prefers-reduced-motion: reduce) {
          .optimized-image img {
            transition: none;
          }
        }
      `}</style>
    </picture>
  );
}

// Utility function to preload critical images
export function preloadImage(src: string, as: 'image' = 'image'): void {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = as;
  link.href = src;
  
  // Add AVIF support check
  const avifSrc = src.replace(/\.[^/.]+$/, '-800w-q85.avif');
  const webpSrc = src.replace(/\.[^/.]+$/, '-800w-q85.webp');
  
  // Check for AVIF support
  const avifSupported = new Promise((resolve) => {
    const avif = new Image();
    avif.onload = () => resolve(true);
    avif.onerror = () => resolve(false);
    avif.src = 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgABogQEAwgMg8f8D///8WfhwB8+ErK42A=';
  });

  avifSupported.then((supported) => {
    if (supported) {
      link.href = avifSrc;
    } else {
      // Check WebP support
      const webpSupported = new Promise((resolve) => {
        const webp = new Image();
        webp.onload = () => resolve(true);
        webp.onerror = () => resolve(false);
        webp.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
      });

      webpSupported.then((webpOk) => {
        link.href = webpOk ? webpSrc : src;
        document.head.appendChild(link);
      });
    }
  });
}

// Image optimization utility for build time
export const imageOptimization = {
  formats: ['image/avif', 'image/webp', 'image/jpeg'],
  deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
  imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  quality: 85,
  minimumCacheTTL: 31536000, // 1 year
};