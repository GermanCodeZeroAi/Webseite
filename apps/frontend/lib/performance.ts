/**
 * Performance Optimization Utilities for German Code Zero AI Frontend
 * 
 * Provides comprehensive performance monitoring and optimization including:
 * - Core Web Vitals monitoring
 * - Bundle size analysis
 * - Lazy loading utilities
 * - Image optimization
 * - Code splitting helpers
 * - Preconnect and prefetch management
 */

export interface PerformanceMetrics {
  lcp: number; // Largest Contentful Paint
  fid: number; // First Input Delay
  cls: number; // Cumulative Layout Shift
  inp: number; // Interaction to Next Paint
  fcp: number; // First Contentful Paint
  ttfb: number; // Time to First Byte
}

export interface BundleAnalysis {
  totalSize: number;
  jsSize: number;
  cssSize: number;
  imageSize: number;
  fontSize: number;
  chunks: Array<{
    name: string;
    size: number;
    modules: string[];
  }>;
}

export interface LazyLoadOptions {
  root?: Element | null;
  rootMargin?: string;
  threshold?: number | number[];
  placeholder?: string;
  error?: string;
  loading?: 'lazy' | 'eager';
}

/**
 * Performance monitoring class
 */
export class PerformanceMonitor {
  private metrics: Partial<PerformanceMetrics> = {};
  private observers: PerformanceObserver[] = [];
  private isInitialized = false;

  constructor() {
    this.initialize();
  }

  private initialize(): void {
    if (this.isInitialized) return;
    
    // Check if PerformanceObserver is supported
    if (!('PerformanceObserver' in window)) {
      console.warn('PerformanceObserver not supported');
      return;
    }

    this.setupCoreWebVitals();
    this.setupResourceTiming();
    this.isInitialized = true;
  }

  private setupCoreWebVitals(): void {
    // LCP - Largest Contentful Paint
    try {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as PerformanceEntry;
        this.metrics.lcp = lastEntry.startTime;
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      this.observers.push(lcpObserver);
    } catch (e) {
      console.warn('LCP observer setup failed:', e);
    }

    // FID - First Input Delay
    try {
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          this.metrics.fid = entry.processingStart - entry.startTime;
        });
      });
      fidObserver.observe({ entryTypes: ['first-input'] });
      this.observers.push(fidObserver);
    } catch (e) {
      console.warn('FID observer setup failed:', e);
    }

    // CLS - Cumulative Layout Shift
    try {
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
            this.metrics.cls = clsValue;
          }
        });
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
      this.observers.push(clsObserver);
    } catch (e) {
      console.warn('CLS observer setup failed:', e);
    }

    // FCP - First Contentful Paint
    try {
      const fcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.name === 'first-contentful-paint') {
            this.metrics.fcp = entry.startTime;
          }
        });
      });
      fcpObserver.observe({ entryTypes: ['paint'] });
      this.observers.push(fcpObserver);
    } catch (e) {
      console.warn('FCP observer setup failed:', e);
    }
  }

  private setupResourceTiming(): void {
    // TTFB - Time to First Byte
    try {
      const navigationObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (entry.entryType === 'navigation') {
            this.metrics.ttfb = entry.responseStart - entry.requestStart;
          }
        });
      });
      navigationObserver.observe({ entryTypes: ['navigation'] });
      this.observers.push(navigationObserver);
    } catch (e) {
      console.warn('Navigation observer setup failed:', e);
    }
  }

  /**
   * Get current performance metrics
   */
  getMetrics(): Partial<PerformanceMetrics> {
    return { ...this.metrics };
  }

  /**
   * Check if metrics meet Core Web Vitals thresholds
   */
  checkCoreWebVitals(): {
    lcp: { value: number; status: 'good' | 'needs-improvement' | 'poor' };
    fid: { value: number; status: 'good' | 'needs-improvement' | 'poor' };
    cls: { value: number; status: 'good' | 'needs-improvement' | 'poor' };
  } {
    const lcp = this.metrics.lcp || 0;
    const fid = this.metrics.fid || 0;
    const cls = this.metrics.cls || 0;

    return {
      lcp: {
        value: lcp,
        status: lcp <= 2500 ? 'good' : lcp <= 4000 ? 'needs-improvement' : 'poor'
      },
      fid: {
        value: fid,
        status: fid <= 100 ? 'good' : fid <= 300 ? 'needs-improvement' : 'poor'
      },
      cls: {
        value: cls,
        status: cls <= 0.1 ? 'good' : cls <= 0.25 ? 'needs-improvement' : 'poor'
      }
    };
  }

  /**
   * Send metrics to analytics service
   */
  sendMetrics(endpoint: string): void {
    const metrics = this.getMetrics();
    const coreWebVitals = this.checkCoreWebVitals();
    
    fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        metrics,
        coreWebVitals,
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent
      })
    }).catch(error => {
      console.warn('Failed to send performance metrics:', error);
    });
  }

  /**
   * Clean up observers
   */
  destroy(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}

/**
 * Lazy loading utility for images and components
 */
export class LazyLoader {
  private observer: IntersectionObserver;
  private options: LazyLoadOptions;

  constructor(options: LazyLoadOptions = {}) {
    this.options = {
      root: null,
      rootMargin: '50px',
      threshold: 0.1,
      placeholder: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMSIgaGVpZ2h0PSIxIiB2aWV3Qm94PSIwIDAgMSAxIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiNmM2Y0ZjYiLz48L3N2Zz4=',
      error: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMSIgaGVpZ2h0PSIxIiB2aWV3Qm94PSIwIDAgMSAxIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiNmYzU1NTUiLz48L3N2Zz4=',
      loading: 'lazy',
      ...options
    };

    this.observer = new IntersectionObserver(
      this.handleIntersection.bind(this),
      {
        root: this.options.root,
        rootMargin: this.options.rootMargin,
        threshold: this.options.threshold
      }
    );
  }

  private handleIntersection(entries: IntersectionObserverEntry[]): void {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        this.loadElement(entry.target as HTMLElement);
        this.observer.unobserve(entry.target);
      }
    });
  }

  private loadElement(element: HTMLElement): void {
    if (element.tagName === 'IMG') {
      this.loadImage(element as HTMLImageElement);
    } else if (element.hasAttribute('data-lazy-component')) {
      this.loadComponent(element);
    }
  }

  private loadImage(img: HTMLImageElement): void {
    const src = img.dataset.src;
    if (!src) return;

    // Set placeholder
    if (this.options.placeholder) {
      img.src = this.options.placeholder;
    }

    // Load actual image
    const imageLoader = new Image();
    imageLoader.onload = () => {
      img.src = src;
      img.classList.add('loaded');
    };
    imageLoader.onerror = () => {
      if (this.options.error) {
        img.src = this.options.error;
      }
      img.classList.add('error');
    };
    imageLoader.src = src;
  }

  private loadComponent(element: HTMLElement): void {
    const componentName = element.dataset.lazyComponent;
    if (!componentName) return;

    // Dynamic import of component
    import(`../components/${componentName}`)
      .then(module => {
        if (module.default) {
          element.innerHTML = module.default;
        }
        element.classList.add('loaded');
      })
      .catch(error => {
        console.error(`Failed to load component ${componentName}:`, error);
        element.classList.add('error');
      });
  }

  /**
   * Observe element for lazy loading
   */
  observe(element: HTMLElement): void {
    this.observer.observe(element);
  }

  /**
   * Observe multiple elements
   */
  observeAll(selector: string): void {
    const elements = document.querySelectorAll(selector);
    elements.forEach(element => this.observe(element as HTMLElement));
  }

  /**
   * Clean up observer
   */
  destroy(): void {
    this.observer.disconnect();
  }
}

/**
 * Image optimization utility
 */
export class ImageOptimizer {
  private static readonly SUPPORTED_FORMATS = ['avif', 'webp', 'jpeg', 'png'];
  private static readonly QUALITY_LEVELS = [75, 85, 95];

  /**
   * Generate optimized image sources
   */
  static generateSources(
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
   * Create responsive image element
   */
  static createResponsiveImage(
    basePath: string,
    alt: string,
    sizes: string = '100vw',
    className?: string
  ): HTMLPictureElement {
    const picture = document.createElement('picture');
    
    // AVIF source
    const avifSource = document.createElement('source');
    avifSource.type = 'image/avif';
    avifSource.srcset = this.generateSources(basePath, 400).avif + ' 400w, ' +
                       this.generateSources(basePath, 800).avif + ' 800w, ' +
                       this.generateSources(basePath, 1200).avif + ' 1200w';
    picture.appendChild(avifSource);

    // WebP source
    const webpSource = document.createElement('source');
    webpSource.type = 'image/webp';
    webpSource.srcset = this.generateSources(basePath, 400).webp + ' 400w, ' +
                       this.generateSources(basePath, 800).webp + ' 800w, ' +
                       this.generateSources(basePath, 1200).webp + ' 1200w';
    picture.appendChild(webpSource);

    // Fallback image
    const img = document.createElement('img');
    img.src = this.generateSources(basePath, 800).fallback;
    img.srcset = this.generateSources(basePath, 400).fallback + ' 400w, ' +
                this.generateSources(basePath, 800).fallback + ' 800w, ' +
                this.generateSources(basePath, 1200).fallback + ' 1200w';
    img.sizes = sizes;
    img.alt = alt;
    img.loading = 'lazy';
    if (className) img.className = className;
    picture.appendChild(img);

    return picture;
  }

  /**
   * Preload critical images
   */
  static preloadImages(urls: string[]): void {
    urls.forEach(url => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = url;
      document.head.appendChild(link);
    });
  }
}

/**
 * Code splitting utility
 */
export class CodeSplitter {
  private static loadedChunks = new Set<string>();

  /**
   * Dynamically import a module with caching
   */
  static async import<T>(modulePath: string): Promise<T> {
    if (this.loadedChunks.has(modulePath)) {
      return import(modulePath);
    }

    try {
      const module = await import(modulePath);
      this.loadedChunks.add(modulePath);
      return module;
    } catch (error) {
      console.error(`Failed to load module ${modulePath}:`, error);
      throw error;
    }
  }

  /**
   * Load component with error boundary
   */
  static async loadComponent<T>(
    componentPath: string,
    fallback?: () => T
  ): Promise<T> {
    try {
      const module = await this.import<{ default: T }>(componentPath);
      return module.default;
    } catch (error) {
      console.warn(`Component ${componentPath} failed to load, using fallback`);
      return fallback ? fallback() : null as T;
    }
  }

  /**
   * Preload module for future use
   */
  static preload(modulePath: string): void {
    if (!this.loadedChunks.has(modulePath)) {
      const link = document.createElement('link');
      link.rel = 'modulepreload';
      link.href = modulePath;
      document.head.appendChild(link);
    }
  }
}

/**
 * Resource hints manager
 */
export class ResourceHints {
  private static hints = new Map<string, HTMLElement>();

  /**
   * Add preconnect hint
   */
  static preconnect(domain: string, crossorigin: boolean = false): void {
    const key = `preconnect-${domain}`;
    if (this.hints.has(key)) return;

    const link = document.createElement('link');
    link.rel = 'preconnect';
    link.href = domain;
    if (crossorigin) {
      link.crossOrigin = 'anonymous';
    }
    
    document.head.appendChild(link);
    this.hints.set(key, link);
  }

  /**
   * Add dns-prefetch hint
   */
  static dnsPrefetch(domain: string): void {
    const key = `dns-prefetch-${domain}`;
    if (this.hints.has(key)) return;

    const link = document.createElement('link');
    link.rel = 'dns-prefetch';
    link.href = domain;
    
    document.head.appendChild(link);
    this.hints.set(key, link);
  }

  /**
   * Add prefetch hint
   */
  static prefetch(url: string, as: string = 'script'): void {
    const key = `prefetch-${url}`;
    if (this.hints.has(key)) return;

    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = url;
    link.as = as;
    
    document.head.appendChild(link);
    this.hints.set(key, link);
  }

  /**
   * Add preload hint
   */
  static preload(url: string, as: string, crossorigin: boolean = false): void {
    const key = `preload-${url}`;
    if (this.hints.has(key)) return;

    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = url;
    link.as = as;
    if (crossorigin) {
      link.crossOrigin = 'anonymous';
    }
    
    document.head.appendChild(link);
    this.hints.set(key, link);
  }

  /**
   * Remove all hints
   */
  static clear(): void {
    this.hints.forEach(link => {
      if (link.parentNode) {
        link.parentNode.removeChild(link);
      }
    });
    this.hints.clear();
  }
}

/**
 * Bundle analyzer utility
 */
export class BundleAnalyzer {
  /**
   * Analyze current bundle size
   */
  static analyzeBundle(): BundleAnalysis {
    const scripts = Array.from(document.querySelectorAll('script[src]'));
    const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
    const images = Array.from(document.querySelectorAll('img[src]'));
    const fonts = Array.from(document.querySelectorAll('link[rel="preload"][as="font"]'));

    let totalSize = 0;
    let jsSize = 0;
    let cssSize = 0;
    let imageSize = 0;
    let fontSize = 0;

    const chunks: Array<{ name: string; size: number; modules: string[] }> = [];

    // Analyze scripts
    scripts.forEach(script => {
      const src = script.getAttribute('src');
      if (src) {
        // This is a simplified analysis - in reality you'd need to fetch and measure
        const estimatedSize = this.estimateResourceSize(src);
        jsSize += estimatedSize;
        totalSize += estimatedSize;
        
        chunks.push({
          name: src.split('/').pop() || 'unknown',
          size: estimatedSize,
          modules: [src]
        });
      }
    });

    // Analyze styles
    styles.forEach(style => {
      const href = style.getAttribute('href');
      if (href) {
        const estimatedSize = this.estimateResourceSize(href);
        cssSize += estimatedSize;
        totalSize += estimatedSize;
      }
    });

    // Analyze images
    images.forEach(img => {
      const src = img.getAttribute('src');
      if (src) {
        const estimatedSize = this.estimateResourceSize(src);
        imageSize += estimatedSize;
        totalSize += estimatedSize;
      }
    });

    // Analyze fonts
    fonts.forEach(font => {
      const href = font.getAttribute('href');
      if (href) {
        const estimatedSize = this.estimateResourceSize(href);
        fontSize += estimatedSize;
        totalSize += estimatedSize;
      }
    });

    return {
      totalSize,
      jsSize,
      cssSize,
      imageSize,
      fontSize,
      chunks
    };
  }

  private static estimateResourceSize(url: string): number {
    // This is a very rough estimation
    // In a real implementation, you'd fetch the resource and measure its size
    if (url.includes('.js')) return 50000; // 50KB estimate for JS
    if (url.includes('.css')) return 10000; // 10KB estimate for CSS
    if (url.includes('.jpg') || url.includes('.jpeg')) return 100000; // 100KB estimate for images
    if (url.includes('.png')) return 80000; // 80KB estimate for PNG
    if (url.includes('.webp')) return 60000; // 60KB estimate for WebP
    if (url.includes('.avif')) return 40000; // 40KB estimate for AVIF
    if (url.includes('.woff') || url.includes('.woff2')) return 20000; // 20KB estimate for fonts
    return 1000; // Default 1KB estimate
  }

  /**
   * Check if bundle size is within limits
   */
  static checkBundleLimits(analysis: BundleAnalysis): {
    total: { size: number; limit: number; status: 'good' | 'warning' | 'exceeded' };
    js: { size: number; limit: number; status: 'good' | 'warning' | 'exceeded' };
  } {
    const totalLimit = 500000; // 500KB total limit
    const jsLimit = 180000; // 180KB JS limit as per requirements

    return {
      total: {
        size: analysis.totalSize,
        limit: totalLimit,
        status: analysis.totalSize <= totalLimit ? 'good' : 
                analysis.totalSize <= totalLimit * 1.2 ? 'warning' : 'exceeded'
      },
      js: {
        size: analysis.jsSize,
        limit: jsLimit,
        status: analysis.jsSize <= jsLimit ? 'good' : 
                analysis.jsSize <= jsLimit * 1.2 ? 'warning' : 'exceeded'
      }
    };
  }
}

/**
 * Initialize performance optimizations
 */
export function initializePerformance(): {
  monitor: PerformanceMonitor;
  lazyLoader: LazyLoader;
} {
  // Set up resource hints for external services
  ResourceHints.preconnect('https://js.stripe.com', true);
  ResourceHints.preconnect('https://api.stripe.com', true);
  ResourceHints.dnsPrefetch('https://fonts.googleapis.com');
  ResourceHints.dnsPrefetch('https://fonts.gstatic.com');

  // Initialize performance monitoring
  const monitor = new PerformanceMonitor();

  // Initialize lazy loading
  const lazyLoader = new LazyLoader({
    rootMargin: '100px',
    threshold: 0.1
  });

  // Start observing lazy load elements
  lazyLoader.observeAll('[data-lazy-src]');
  lazyLoader.observeAll('[data-lazy-component]');

  return { monitor, lazyLoader };
}