/**
 * Test Utilities for German Code Zero Frontend
 * 
 * Provides comprehensive testing utilities including:
 * - Component testing helpers
 * - Mock utilities
 * - Test data generators
 * - Accessibility testing helpers
 * - Performance testing utilities
 * - E2E testing helpers
 */

import { SEOData, getPageSeo } from './seo';
import { PerformanceMonitor } from './performance';
import { CSPManager, XSSProtection, CSRFManager } from './security';

export interface TestConfig {
  mockAPIs: boolean;
  mockStripe: boolean;
  mockAnalytics: boolean;
  enablePerformanceMonitoring: boolean;
  enableAccessibilityTesting: boolean;
}

export interface MockData {
  user: {
    id: string;
    email: string;
    name: string;
    locale: 'de' | 'en';
  };
  company: {
    id: string;
    name: string;
    vatId: string;
  };
  pricing: {
    plans: Array<{
      code: string;
      name: string;
      price: number;
      currency: string;
    }>;
    modules: Array<{
      code: string;
      name: string;
      price: number;
    }>;
  };
}

/**
 * Test data generator
 */
export class TestDataGenerator {
  /**
   * Generate mock user data
   */
  static generateUser(overrides: Partial<MockData['user']> = {}): MockData['user'] {
    return {
      id: 'test-user-' + Math.random().toString(36).substr(2, 9),
      email: 'test@example.com',
      name: 'Test User',
      locale: 'de',
      ...overrides
    };
  }

  /**
   * Generate mock company data
   */
  static generateCompany(overrides: Partial<MockData['company']> = {}): MockData['company'] {
    return {
      id: 'test-company-' + Math.random().toString(36).substr(2, 9),
      name: 'Test Company GmbH',
      vatId: 'DE123456789',
      ...overrides
    };
  }

  /**
   * Generate mock pricing data
   */
  static generatePricing(overrides: Partial<MockData['pricing']> = {}): MockData['pricing'] {
    return {
      plans: [
        { code: 'base-starter', name: 'Base Starter', price: 199, currency: 'EUR' },
        { code: 'base-enterprise', name: 'Base Enterprise', price: 499, currency: 'EUR' }
      ],
      modules: [
        { code: 'email-routing', name: 'E-Mail Routing', price: 99 },
        { code: 'voicebot', name: 'Voice Solution', price: 149 },
        { code: 'image-gen', name: 'Image Generation', price: 79 }
      ],
      ...overrides
    };
  }

  /**
   * Generate mock SEO data
   */
  static generateSEOData(page: string, locale: 'de' | 'en' = 'de'): SEOData {
    return getPageSeo(page as any, locale);
  }

  /**
   * Generate mock form data
   */
  static generateFormData(fields: Record<string, any> = {}): FormData {
    const formData = new FormData();
    Object.entries(fields).forEach(([key, value]) => {
      formData.append(key, value);
    });
    return formData;
  }
}

/**
 * Mock utilities
 */
export class MockUtils {
  private static mocks: Map<string, any> = new Map();

  /**
   * Mock fetch API
   */
  static mockFetch(responses: Record<string, any> = {}): void {
    const originalFetch = window.fetch;
    
    window.fetch = jest.fn().mockImplementation((url: string, options?: RequestInit) => {
      const responseKey = url.split('?')[0]; // Remove query params for matching
      const mockResponse = responses[responseKey] || responses['*'] || { status: 404, body: 'Not Found' };
      
      return Promise.resolve({
        ok: mockResponse.status >= 200 && mockResponse.status < 300,
        status: mockResponse.status || 200,
        json: () => Promise.resolve(mockResponse.body || {}),
        text: () => Promise.resolve(JSON.stringify(mockResponse.body || {})),
        headers: new Headers(mockResponse.headers || {}),
        ...mockResponse
      } as Response);
    });

    this.mocks.set('fetch', originalFetch);
  }

  /**
   * Mock Stripe API
   */
  static mockStripe(): void {
    const mockStripe = {
      elements: jest.fn().mockReturnValue({
        create: jest.fn().mockReturnValue({
          mount: jest.fn(),
          unmount: jest.fn(),
          on: jest.fn(),
          off: jest.fn()
        })
      }),
      createPaymentMethod: jest.fn().mockResolvedValue({
        paymentMethod: { id: 'pm_test_123' }
      }),
      confirmPayment: jest.fn().mockResolvedValue({
        paymentIntent: { status: 'succeeded' }
      })
    };

    (window as any).Stripe = jest.fn(() => mockStripe);
    this.mocks.set('stripe', mockStripe);
  }

  /**
   * Mock localStorage
   */
  static mockLocalStorage(): void {
    const store: Record<string, string> = {};
    
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn((key: string) => store[key] || null),
        setItem: jest.fn((key: string, value: string) => {
          store[key] = value;
        }),
        removeItem: jest.fn((key: string) => {
          delete store[key];
        }),
        clear: jest.fn(() => {
          Object.keys(store).forEach(key => delete store[key]);
        }),
        length: Object.keys(store).length,
        key: jest.fn((index: number) => Object.keys(store)[index] || null)
      },
      writable: true
    });

    this.mocks.set('localStorage', store);
  }

  /**
   * Mock IntersectionObserver
   */
  static mockIntersectionObserver(): void {
    const mockIntersectionObserver = jest.fn();
    mockIntersectionObserver.mockReturnValue({
      observe: jest.fn(),
      unobserve: jest.fn(),
      disconnect: jest.fn()
    });
    
    (window as any).IntersectionObserver = mockIntersectionObserver;
    this.mocks.set('IntersectionObserver', mockIntersectionObserver);
  }

  /**
   * Mock PerformanceObserver
   */
  static mockPerformanceObserver(): void {
    const mockPerformanceObserver = jest.fn();
    mockPerformanceObserver.mockReturnValue({
      observe: jest.fn(),
      disconnect: jest.fn(),
      takeRecords: jest.fn().mockReturnValue([])
    });
    
    (window as any).PerformanceObserver = mockPerformanceObserver;
    this.mocks.set('PerformanceObserver', mockPerformanceObserver);
  }

  /**
   * Restore all mocks
   */
  static restoreAll(): void {
    this.mocks.forEach((original, key) => {
      if (key === 'fetch') {
        window.fetch = original;
      } else if (key === 'localStorage') {
        delete (window as any).localStorage;
      } else {
        (window as any)[key] = original;
      }
    });
    this.mocks.clear();
  }
}

/**
 * Component testing utilities
 */
export class ComponentTestUtils {
  /**
   * Create a test container
   */
  static createTestContainer(): HTMLElement {
    const container = document.createElement('div');
    container.id = 'test-container';
    document.body.appendChild(container);
    return container;
  }

  /**
   * Clean up test container
   */
  static cleanupTestContainer(): void {
    const container = document.getElementById('test-container');
    if (container) {
      container.remove();
    }
  }

  /**
   * Simulate user interaction
   */
  static simulateClick(element: HTMLElement): void {
    const event = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      view: window
    });
    element.dispatchEvent(event);
  }

  /**
   * Simulate keyboard event
   */
  static simulateKeyPress(element: HTMLElement, key: string): void {
    const event = new KeyboardEvent('keydown', {
      key,
      bubbles: true,
      cancelable: true
    });
    element.dispatchEvent(event);
  }

  /**
   * Simulate form submission
   */
  static simulateFormSubmit(form: HTMLFormElement): void {
    const event = new Event('submit', {
      bubbles: true,
      cancelable: true
    });
    form.dispatchEvent(event);
  }

  /**
   * Wait for element to appear
   */
  static async waitForElement(selector: string, timeout: number = 5000): Promise<HTMLElement | null> {
    return new Promise((resolve) => {
      const element = document.querySelector(selector) as HTMLElement;
      if (element) {
        resolve(element);
        return;
      }

      const observer = new MutationObserver(() => {
        const element = document.querySelector(selector) as HTMLElement;
        if (element) {
          observer.disconnect();
          resolve(element);
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true
      });

      setTimeout(() => {
        observer.disconnect();
        resolve(null);
      }, timeout);
    });
  }
}

/**
 * Accessibility testing utilities
 */
export class A11yTestUtils {
  /**
   * Check if element is accessible
   */
  static isAccessible(element: HTMLElement): boolean {
    // Check if element is visible
    const style = window.getComputedStyle(element);
    if (style.display === 'none' || style.visibility === 'hidden') {
      return false;
    }

    // Check if element has proper ARIA attributes
    if (element.hasAttribute('aria-hidden') && element.getAttribute('aria-hidden') === 'true') {
      return false;
    }

    return true;
  }

  /**
   * Check keyboard navigation
   */
  static canNavigateWithKeyboard(container: HTMLElement): boolean {
    const focusableElements = container.querySelectorAll(
      'button, input, select, textarea, a[href], [tabindex]:not([tabindex="-1"])'
    );

    if (focusableElements.length === 0) {
      return false;
    }

    // Check if first element can be focused
    const firstElement = focusableElements[0] as HTMLElement;
    firstElement.focus();
    return document.activeElement === firstElement;
  }

  /**
   * Check color contrast
   */
  static checkColorContrast(foreground: string, background: string): boolean {
    // This is a simplified check - in real tests, use a proper contrast checking library
    return foreground !== background;
  }

  /**
   * Check if element has proper ARIA labels
   */
  static hasProperARIALabels(element: HTMLElement): boolean {
    const hasLabel = element.hasAttribute('aria-label') || 
                    element.hasAttribute('aria-labelledby') ||
                    element.hasAttribute('title');
    
    if (element.tagName === 'INPUT' || element.tagName === 'SELECT' || element.tagName === 'TEXTAREA') {
      const hasAssociatedLabel = document.querySelector(`label[for="${element.id}"]`);
      return hasLabel || !!hasAssociatedLabel;
    }

    return true; // Other elements don't necessarily need labels
  }
}

/**
 * Performance testing utilities
 */
export class PerformanceTestUtils {
  /**
   * Measure function execution time
   */
  static async measureExecutionTime<T>(fn: () => Promise<T> | T): Promise<{ result: T; duration: number }> {
    const start = performance.now();
    const result = await fn();
    const end = performance.now();
    
    return {
      result,
      duration: end - start
    };
  }

  /**
   * Check if performance metrics meet thresholds
   */
  static checkPerformanceThresholds(metrics: any): {
    lcp: boolean;
    fid: boolean;
    cls: boolean;
  } {
    return {
      lcp: (metrics.lcp || 0) <= 2500, // 2.5s
      fid: (metrics.fid || 0) <= 100,  // 100ms
      cls: (metrics.cls || 0) <= 0.1   // 0.1
    };
  }

  /**
   * Simulate slow network
   */
  static simulateSlowNetwork(delay: number = 1000): void {
    const originalFetch = window.fetch;
    window.fetch = jest.fn().mockImplementation((...args) => {
      return new Promise(resolve => {
        setTimeout(() => {
          resolve(originalFetch(...args));
        }, delay);
      });
    });
  }
}

/**
 * E2E testing utilities
 */
export class E2ETestUtils {
  /**
   * Navigate to page
   */
  static async navigateToPage(url: string): Promise<void> {
    window.history.pushState({}, '', url);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }

  /**
   * Fill form field
   */
  static fillFormField(selector: string, value: string): void {
    const element = document.querySelector(selector) as HTMLInputElement;
    if (element) {
      element.value = value;
      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }

  /**
   * Submit form
   */
  static submitForm(selector: string): void {
    const form = document.querySelector(selector) as HTMLFormElement;
    if (form) {
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    }
  }

  /**
   * Wait for navigation
   */
  static async waitForNavigation(timeout: number = 5000): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error('Navigation timeout'));
      }, timeout);

      const handleNavigation = () => {
        clearTimeout(timeoutId);
        window.removeEventListener('popstate', handleNavigation);
        resolve();
      };

      window.addEventListener('popstate', handleNavigation);
    });
  }
}

/**
 * Test configuration manager
 */
export class TestConfigManager {
  private config: TestConfig;

  constructor(config: Partial<TestConfig> = {}) {
    this.config = {
      mockAPIs: true,
      mockStripe: true,
      mockAnalytics: true,
      enablePerformanceMonitoring: true,
      enableAccessibilityTesting: true,
      ...config
    };
  }

  /**
   * Setup test environment
   */
  setup(): void {
    if (this.config.mockAPIs) {
      MockUtils.mockFetch({
        '/api/pricing': { status: 200, body: TestDataGenerator.generatePricing() },
        '/api/modules': { status: 200, body: { modules: [] } },
        '/api/checkout/session': { status: 200, body: { session_id: 'cs_test_123' } }
      });
    }

    if (this.config.mockStripe) {
      MockUtils.mockStripe();
    }

    MockUtils.mockLocalStorage();
    MockUtils.mockIntersectionObserver();
    MockUtils.mockPerformanceObserver();
  }

  /**
   * Cleanup test environment
   */
  cleanup(): void {
    MockUtils.restoreAll();
    ComponentTestUtils.cleanupTestContainer();
  }

  /**
   * Get test configuration
   */
  getConfig(): TestConfig {
    return { ...this.config };
  }
}

/**
 * Test suite utilities
 */
export class TestSuiteUtils {
  /**
   * Run accessibility tests
   */
  static async runA11yTests(container: HTMLElement): Promise<{
    passed: number;
    failed: number;
    results: Array<{ test: string; passed: boolean; message?: string }>;
  }> {
    const results: Array<{ test: string; passed: boolean; message?: string }> = [];
    let passed = 0;
    let failed = 0;

    // Test keyboard navigation
    const keyboardTest = A11yTestUtils.canNavigateWithKeyboard(container);
    results.push({
      test: 'Keyboard Navigation',
      passed: keyboardTest,
      message: keyboardTest ? 'Keyboard navigation works' : 'Keyboard navigation failed'
    });
    keyboardTest ? passed++ : failed++;

    // Test ARIA labels
    const elements = container.querySelectorAll('button, input, select, textarea');
    let ariaTestPassed = true;
    elements.forEach(element => {
      if (!A11yTestUtils.hasProperARIALabels(element as HTMLElement)) {
        ariaTestPassed = false;
      }
    });
    results.push({
      test: 'ARIA Labels',
      passed: ariaTestPassed,
      message: ariaTestPassed ? 'All elements have proper ARIA labels' : 'Some elements missing ARIA labels'
    });
    ariaTestPassed ? passed++ : failed++;

    return { passed, failed, results };
  }

  /**
   * Run performance tests
   */
  static async runPerformanceTests(): Promise<{
    passed: number;
    failed: number;
    results: Array<{ test: string; passed: boolean; message?: string }>;
  }> {
    const results: Array<{ test: string; passed: boolean; message?: string }> = [];
    let passed = 0;
    let failed = 0;

    // Test page load time
    const loadTime = performance.now();
    const loadTimeTest = loadTime < 3000; // 3 seconds
    results.push({
      test: 'Page Load Time',
      passed: loadTimeTest,
      message: `Page loaded in ${loadTime.toFixed(2)}ms`
    });
    loadTimeTest ? passed++ : failed++;

    // Test bundle size
    const bundleSize = document.querySelectorAll('script[src]').length * 50000; // Rough estimate
    const bundleSizeTest = bundleSize < 180000; // 180KB limit
    results.push({
      test: 'Bundle Size',
      passed: bundleSizeTest,
      message: `Estimated bundle size: ${(bundleSize / 1024).toFixed(2)}KB`
    });
    bundleSizeTest ? passed++ : failed++;

    return { passed, failed, results };
  }
}

/**
 * Initialize test environment
 */
export function initializeTestEnvironment(config: Partial<TestConfig> = {}): TestConfigManager {
  const testConfig = new TestConfigManager(config);
  testConfig.setup();
  return testConfig;
}