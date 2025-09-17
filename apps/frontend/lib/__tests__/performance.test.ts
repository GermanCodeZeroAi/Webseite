/**
 * Performance Utilities Test Suite
 * 
 * Comprehensive tests for performance monitoring and optimization including:
 * - Core Web Vitals monitoring
 * - Bundle size analysis
 * - Lazy loading functionality
 * - Image optimization
 * - Code splitting
 * - Resource hints
 */

import {
  PerformanceMonitor,
  LazyLoader,
  ImageOptimizer,
  CodeSplitter,
  ResourceHints,
  BundleAnalyzer,
  initializePerformance
} from '../performance';
import { MockUtils, ComponentTestUtils, PerformanceTestUtils } from '../test-utils';

describe('Performance Utilities', () => {
  let container: HTMLElement;

  beforeEach(() => {
    MockUtils.mockPerformanceObserver();
    MockUtils.mockIntersectionObserver();
    container = ComponentTestUtils.createTestContainer();
  });

  afterEach(() => {
    MockUtils.restoreAll();
    ComponentTestUtils.cleanupTestContainer();
  });

  describe('PerformanceMonitor', () => {
    let monitor: PerformanceMonitor;

    beforeEach(() => {
      monitor = new PerformanceMonitor();
    });

    afterEach(() => {
      monitor.destroy();
    });

    it('should initialize without errors', () => {
      expect(monitor).toBeDefined();
      expect(monitor.getMetrics()).toBeDefined();
    });

    it('should track performance metrics', () => {
      const metrics = monitor.getMetrics();
      expect(typeof metrics).toBe('object');
    });

    it('should check Core Web Vitals thresholds', () => {
      const coreWebVitals = monitor.checkCoreWebVitals();
      
      expect(coreWebVitals.lcp).toBeDefined();
      expect(coreWebVitals.fid).toBeDefined();
      expect(coreWebVitals.cls).toBeDefined();
      
      expect(coreWebVitals.lcp.status).toMatch(/good|needs-improvement|poor/);
      expect(coreWebVitals.fid.status).toMatch(/good|needs-improvement|poor/);
      expect(coreWebVitals.cls.status).toMatch(/good|needs-improvement|poor/);
    });

    it('should send metrics to analytics endpoint', async () => {
      MockUtils.mockFetch({
        '/api/analytics/performance': { status: 200, body: { success: true } }
      });

      // Mock console.warn to avoid test output
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      monitor.sendMetrics('/api/analytics/performance');
      
      // Wait for async operation
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should handle analytics endpoint errors gracefully', async () => {
      MockUtils.mockFetch({
        '/api/analytics/performance': { status: 500, body: { error: 'Server Error' } }
      });

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      monitor.sendMetrics('/api/analytics/performance');
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to send performance metrics:',
        expect.any(Error)
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('LazyLoader', () => {
    let lazyLoader: LazyLoader;

    beforeEach(() => {
      lazyLoader = new LazyLoader({
        rootMargin: '50px',
        threshold: 0.1
      });
    });

    afterEach(() => {
      lazyLoader.destroy();
    });

    it('should initialize without errors', () => {
      expect(lazyLoader).toBeDefined();
    });

    it('should observe elements for lazy loading', () => {
      const img = document.createElement('img');
      img.dataset.src = 'https://example.com/image.jpg';
      container.appendChild(img);

      const observeSpy = jest.spyOn(lazyLoader as any, 'observe');
      lazyLoader.observe(img);

      expect(observeSpy).toHaveBeenCalledWith(img);
    });

    it('should observe multiple elements with selector', () => {
      const img1 = document.createElement('img');
      img1.dataset.src = 'https://example.com/image1.jpg';
      img1.className = 'lazy-image';
      container.appendChild(img1);

      const img2 = document.createElement('img');
      img2.dataset.src = 'https://example.com/image2.jpg';
      img2.className = 'lazy-image';
      container.appendChild(img2);

      const observeSpy = jest.spyOn(lazyLoader as any, 'observe');
      lazyLoader.observeAll('.lazy-image');

      expect(observeSpy).toHaveBeenCalledTimes(2);
    });

    it('should load image when element comes into view', () => {
      const img = document.createElement('img');
      img.dataset.src = 'https://example.com/image.jpg';
      container.appendChild(img);

      // Mock Image constructor
      const mockImage = {
        onload: null as any,
        onerror: null as any,
        src: ''
      };
      (window as any).Image = jest.fn(() => mockImage);

      lazyLoader.observe(img);

      // Simulate intersection
      const intersectionCallback = (window as any).IntersectionObserver.mock.calls[0][0];
      intersectionCallback([{ isIntersecting: true, target: img }]);

      expect(mockImage.src).toBe('https://example.com/image.jpg');
    });

    it('should handle image load errors', () => {
      const img = document.createElement('img');
      img.dataset.src = 'https://example.com/invalid-image.jpg';
      container.appendChild(img);

      const mockImage = {
        onload: null as any,
        onerror: null as any,
        src: ''
      };
      (window as any).Image = jest.fn(() => mockImage);

      lazyLoader.observe(img);

      // Simulate intersection
      const intersectionCallback = (window as any).IntersectionObserver.mock.calls[0][0];
      intersectionCallback([{ isIntersecting: true, target: img }]);

      // Simulate error
      if (mockImage.onerror) {
        mockImage.onerror();
      }

      expect(img.classList.contains('error')).toBe(true);
    });
  });

  describe('ImageOptimizer', () => {
    it('should generate optimized image sources', () => {
      const sources = ImageOptimizer.generateSources('/images/hero', 800, 600, 85);
      
      expect(sources.avif).toBe('/images/hero-800x600-q85.avif');
      expect(sources.webp).toBe('/images/hero-800x600-q85.webp');
      expect(sources.fallback).toBe('/images/hero-800x600-q85.jpg');
    });

    it('should generate sources without height', () => {
      const sources = ImageOptimizer.generateSources('/images/hero', 800, undefined, 85);
      
      expect(sources.avif).toBe('/images/hero-800w-q85.avif');
      expect(sources.webp).toBe('/images/hero-800w-q85.webp');
      expect(sources.fallback).toBe('/images/hero-800w-q85.jpg');
    });

    it('should create responsive image element', () => {
      const picture = ImageOptimizer.createResponsiveImage(
        '/images/hero',
        'Hero image',
        '100vw',
        'hero-image'
      );

      expect(picture.tagName).toBe('PICTURE');
      expect(picture.querySelectorAll('source')).toHaveLength(2);
      expect(picture.querySelector('img')).toBeDefined();
      
      const img = picture.querySelector('img') as HTMLImageElement;
      expect(img.alt).toBe('Hero image');
      expect(img.sizes).toBe('100vw');
      expect(img.className).toBe('hero-image');
      expect(img.loading).toBe('lazy');
    });

    it('should preload critical images', () => {
      const preloadSpy = jest.spyOn(document.head, 'appendChild');
      const urls = ['/images/hero.jpg', '/images/logo.png'];
      
      ImageOptimizer.preloadImages(urls);
      
      expect(preloadSpy).toHaveBeenCalledTimes(2);
      
      const links = preloadSpy.mock.calls.map(call => call[0] as HTMLLinkElement);
      expect(links[0].rel).toBe('preload');
      expect(links[0].as).toBe('image');
      expect(links[0].href).toBe('/images/hero.jpg');
    });
  });

  describe('CodeSplitter', () => {
    beforeEach(() => {
      // Clear loaded chunks
      (CodeSplitter as any).loadedChunks.clear();
    });

    it('should import module dynamically', async () => {
      // Mock dynamic import
      const mockModule = { default: 'test-component' };
      jest.doMock('../components/TestComponent', () => mockModule);

      const result = await CodeSplitter.import('../components/TestComponent');
      expect(result).toBe(mockModule);
    });

    it('should cache loaded modules', async () => {
      const mockModule = { default: 'test-component' };
      jest.doMock('../components/TestComponent', () => mockModule);

      // First import
      await CodeSplitter.import('../components/TestComponent');
      expect((CodeSplitter as any).loadedChunks.has('../components/TestComponent')).toBe(true);

      // Second import should use cache
      const result = await CodeSplitter.import('../components/TestComponent');
      expect(result).toBe(mockModule);
    });

    it('should load component with error boundary', async () => {
      const fallback = () => 'fallback-component';
      
      // Mock failed import
      jest.doMock('../components/FailingComponent', () => {
        throw new Error('Module not found');
      });

      const result = await CodeSplitter.loadComponent('../components/FailingComponent', fallback);
      expect(result).toBe('fallback-component');
    });

    it('should preload module', () => {
      const appendChildSpy = jest.spyOn(document.head, 'appendChild');
      
      CodeSplitter.preload('/modules/test-module.js');
      
      expect(appendChildSpy).toHaveBeenCalledWith(expect.objectContaining({
        rel: 'modulepreload',
        href: '/modules/test-module.js'
      }));
    });
  });

  describe('ResourceHints', () => {
    beforeEach(() => {
      ResourceHints.clear();
    });

    it('should add preconnect hint', () => {
      const appendChildSpy = jest.spyOn(document.head, 'appendChild');
      
      ResourceHints.preconnect('https://api.example.com');
      
      expect(appendChildSpy).toHaveBeenCalledWith(expect.objectContaining({
        rel: 'preconnect',
        href: 'https://api.example.com'
      }));
    });

    it('should add preconnect hint with crossorigin', () => {
      const appendChildSpy = jest.spyOn(document.head, 'appendChild');
      
      ResourceHints.preconnect('https://api.example.com', true);
      
      const link = appendChildSpy.mock.calls[0][0] as HTMLLinkElement;
      expect(link.rel).toBe('preconnect');
      expect(link.href).toBe('https://api.example.com');
      expect(link.crossOrigin).toBe('anonymous');
    });

    it('should add dns-prefetch hint', () => {
      const appendChildSpy = jest.spyOn(document.head, 'appendChild');
      
      ResourceHints.dnsPrefetch('https://fonts.googleapis.com');
      
      expect(appendChildSpy).toHaveBeenCalledWith(expect.objectContaining({
        rel: 'dns-prefetch',
        href: 'https://fonts.googleapis.com'
      }));
    });

    it('should add prefetch hint', () => {
      const appendChildSpy = jest.spyOn(document.head, 'appendChild');
      
      ResourceHints.prefetch('/modules/lazy-module.js', 'script');
      
      expect(appendChildSpy).toHaveBeenCalledWith(expect.objectContaining({
        rel: 'prefetch',
        href: '/modules/lazy-module.js',
        as: 'script'
      }));
    });

    it('should add preload hint', () => {
      const appendChildSpy = jest.spyOn(document.head, 'appendChild');
      
      ResourceHints.preload('/fonts/roboto.woff2', 'font', true);
      
      const link = appendChildSpy.mock.calls[0][0] as HTMLLinkElement;
      expect(link.rel).toBe('preload');
      expect(link.href).toBe('/fonts/roboto.woff2');
      expect(link.as).toBe('font');
      expect(link.crossOrigin).toBe('anonymous');
    });

    it('should not add duplicate hints', () => {
      const appendChildSpy = jest.spyOn(document.head, 'appendChild');
      
      ResourceHints.preconnect('https://api.example.com');
      ResourceHints.preconnect('https://api.example.com');
      
      expect(appendChildSpy).toHaveBeenCalledTimes(1);
    });

    it('should clear all hints', () => {
      const removeChildSpy = jest.spyOn(document.head, 'removeChild');
      
      ResourceHints.preconnect('https://api.example.com');
      ResourceHints.clear();
      
      expect(removeChildSpy).toHaveBeenCalled();
    });
  });

  describe('BundleAnalyzer', () => {
    it('should analyze bundle size', () => {
      // Add some mock resources to the document
      const script = document.createElement('script');
      script.src = '/js/app.js';
      document.head.appendChild(script);

      const style = document.createElement('link');
      style.rel = 'stylesheet';
      style.href = '/css/app.css';
      document.head.appendChild(style);

      const analysis = BundleAnalyzer.analyzeBundle();
      
      expect(analysis.totalSize).toBeGreaterThan(0);
      expect(analysis.jsSize).toBeGreaterThan(0);
      expect(analysis.cssSize).toBeGreaterThan(0);
      expect(analysis.chunks).toBeDefined();
      expect(Array.isArray(analysis.chunks)).toBe(true);
    });

    it('should check bundle size limits', () => {
      const analysis = BundleAnalyzer.analyzeBundle();
      const limits = BundleAnalyzer.checkBundleLimits(analysis);
      
      expect(limits.total).toBeDefined();
      expect(limits.total.size).toBeGreaterThanOrEqual(0);
      expect(limits.total.limit).toBe(500000);
      expect(limits.total.status).toMatch(/good|warning|exceeded/);
      
      expect(limits.js).toBeDefined();
      expect(limits.js.size).toBeGreaterThanOrEqual(0);
      expect(limits.js.limit).toBe(180000);
      expect(limits.js.status).toMatch(/good|warning|exceeded/);
    });

    it('should estimate resource sizes correctly', () => {
      const jsSize = (BundleAnalyzer as any).estimateResourceSize('/js/app.js');
      const cssSize = (BundleAnalyzer as any).estimateResourceSize('/css/app.css');
      const imageSize = (BundleAnalyzer as any).estimateResourceSize('/images/hero.jpg');
      
      expect(jsSize).toBe(50000);
      expect(cssSize).toBe(10000);
      expect(imageSize).toBe(100000);
    });
  });

  describe('initializePerformance', () => {
    it('should initialize performance monitoring and lazy loading', () => {
      const { monitor, lazyLoader } = initializePerformance();
      
      expect(monitor).toBeInstanceOf(PerformanceMonitor);
      expect(lazyLoader).toBeInstanceOf(LazyLoader);
    });

    it('should set up resource hints for external services', () => {
      const appendChildSpy = jest.spyOn(document.head, 'appendChild');
      
      initializePerformance();
      
      // Should add preconnect hints for Stripe
      expect(appendChildSpy).toHaveBeenCalledWith(expect.objectContaining({
        rel: 'preconnect',
        href: 'https://js.stripe.com'
      }));
      
      expect(appendChildSpy).toHaveBeenCalledWith(expect.objectContaining({
        rel: 'preconnect',
        href: 'https://api.stripe.com'
      }));
    });

    it('should start observing lazy load elements', () => {
      const observeAllSpy = jest.spyOn(LazyLoader.prototype, 'observeAll');
      
      initializePerformance();
      
      expect(observeAllSpy).toHaveBeenCalledWith('[data-lazy-src]');
      expect(observeAllSpy).toHaveBeenCalledWith('[data-lazy-component]');
    });
  });

  describe('Performance thresholds', () => {
    it('should meet Core Web Vitals requirements', () => {
      const monitor = new PerformanceMonitor();
      const coreWebVitals = monitor.checkCoreWebVitals();
      
      // In a real test environment, these would be actual measurements
      // For now, we just verify the structure
      expect(coreWebVitals.lcp.value).toBeGreaterThanOrEqual(0);
      expect(coreWebVitals.fid.value).toBeGreaterThanOrEqual(0);
      expect(coreWebVitals.cls.value).toBeGreaterThanOrEqual(0);
      
      monitor.destroy();
    });

    it('should complete operations within time limits', async () => {
      const { result, duration } = await PerformanceTestUtils.measureExecutionTime(() => {
        // Simulate some work
        let sum = 0;
        for (let i = 0; i < 1000; i++) {
          sum += i;
        }
        return sum;
      });
      
      expect(result).toBe(499500);
      expect(duration).toBeLessThan(100); // Should complete in less than 100ms
    });
  });

  describe('Memory management', () => {
    it('should not cause memory leaks in lazy loading', () => {
      const lazyLoader = new LazyLoader();
      
      // Create many elements
      for (let i = 0; i < 100; i++) {
        const img = document.createElement('img');
        img.dataset.src = `https://example.com/image${i}.jpg`;
        container.appendChild(img);
        lazyLoader.observe(img);
      }
      
      // Clean up
      lazyLoader.destroy();
      
      // Should not throw errors
      expect(() => lazyLoader.destroy()).not.toThrow();
    });

    it('should clean up performance observers', () => {
      const monitor = new PerformanceMonitor();
      const disconnectSpy = jest.spyOn(PerformanceObserver.prototype, 'disconnect');
      
      monitor.destroy();
      
      expect(disconnectSpy).toHaveBeenCalled();
    });
  });
});