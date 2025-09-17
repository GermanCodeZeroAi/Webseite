/**
 * Jest Setup Configuration
 * 
 * Global test setup for German Code Zero AI test suite
 */

// Mock global objects that might not be available in test environment
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

global.PerformanceObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  disconnect: jest.fn(),
  takeRecords: jest.fn().mockReturnValue([]),
}));

// Mock crypto for secure storage tests
Object.defineProperty(global, 'crypto', {
  value: {
    getRandomValues: jest.fn((array) => {
      for (let i = 0; i < array.length; i++) {
        array[i] = Math.floor(Math.random() * 256);
      }
      return array;
    }),
  },
});

// Mock performance API
Object.defineProperty(global, 'performance', {
  value: {
    now: jest.fn(() => Date.now()),
    mark: jest.fn(),
    measure: jest.fn(),
    getEntriesByType: jest.fn(() => []),
    getEntriesByName: jest.fn(() => []),
    clearMarks: jest.fn(),
    clearMeasures: jest.fn(),
  },
});

// Mock matchMedia for responsive tests
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock fetch globally
global.fetch = jest.fn();

// Mock console methods to reduce noise in tests
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeEach(() => {
  // Reset all mocks before each test
  jest.clearAllMocks();
  
  // Reset fetch mock
  global.fetch.mockClear();
  
  // Reset localStorage
  localStorage.clear();
  
  // Reset document
  document.head.innerHTML = '';
  document.body.innerHTML = '';
});

afterEach(() => {
  // Restore console methods
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
});

// Global test utilities
global.testUtils = {
  // Create a test container
  createTestContainer: () => {
    const container = document.createElement('div');
    container.id = 'test-container';
    document.body.appendChild(container);
    return container;
  },
  
  // Clean up test container
  cleanupTestContainer: () => {
    const container = document.getElementById('test-container');
    if (container) {
      container.remove();
    }
  },
  
  // Wait for element to appear
  waitForElement: (selector, timeout = 5000) => {
    return new Promise((resolve) => {
      const element = document.querySelector(selector);
      if (element) {
        resolve(element);
        return;
      }

      const observer = new MutationObserver(() => {
        const element = document.querySelector(selector);
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
  },
  
  // Simulate user interaction
  simulateClick: (element) => {
    const event = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      view: window
    });
    element.dispatchEvent(event);
  },
  
  // Simulate keyboard event
  simulateKeyPress: (element, key) => {
    const event = new KeyboardEvent('keydown', {
      key,
      bubbles: true,
      cancelable: true
    });
    element.dispatchEvent(event);
  }
};

// Performance testing utilities
global.performanceTestUtils = {
  // Measure function execution time
  measureExecutionTime: async (fn) => {
    const start = performance.now();
    const result = await fn();
    const end = performance.now();
    
    return {
      result,
      duration: end - start
    };
  },
  
  // Check if performance metrics meet thresholds
  checkPerformanceThresholds: (metrics) => {
    return {
      lcp: (metrics.lcp || 0) <= 2500, // 2.5s
      fid: (metrics.fid || 0) <= 100,  // 100ms
      cls: (metrics.cls || 0) <= 0.1   // 0.1
    };
  }
};

// Accessibility testing utilities
global.a11yTestUtils = {
  // Check if element is accessible
  isAccessible: (element) => {
    const style = window.getComputedStyle(element);
    if (style.display === 'none' || style.visibility === 'hidden') {
      return false;
    }
    if (element.hasAttribute('aria-hidden') && element.getAttribute('aria-hidden') === 'true') {
      return false;
    }
    return true;
  },
  
  // Check keyboard navigation
  canNavigateWithKeyboard: (container) => {
    const focusableElements = container.querySelectorAll(
      'button, input, select, textarea, a[href], [tabindex]:not([tabindex="-1"])'
    );
    
    if (focusableElements.length === 0) {
      return false;
    }
    
    const firstElement = focusableElements[0];
    firstElement.focus();
    return document.activeElement === firstElement;
  },
  
  // Check if element has proper ARIA labels
  hasProperARIALabels: (element) => {
    const hasLabel = element.hasAttribute('aria-label') || 
                    element.hasAttribute('aria-labelledby') ||
                    element.hasAttribute('title');
    
    if (element.tagName === 'INPUT' || element.tagName === 'SELECT' || element.tagName === 'TEXTAREA') {
      const hasAssociatedLabel = document.querySelector(`label[for="${element.id}"]`);
      return hasLabel || !!hasAssociatedLabel;
    }
    
    return true;
  }
};

// Mock data generators
global.mockData = {
  generateUser: (overrides = {}) => ({
    id: 'test-user-' + Math.random().toString(36).substr(2, 9),
    email: 'test@example.com',
    name: 'Test User',
    locale: 'de',
    ...overrides
  }),
  
  generateCompany: (overrides = {}) => ({
    id: 'test-company-' + Math.random().toString(36).substr(2, 9),
    name: 'Test Company GmbH',
    vatId: 'DE123456789',
    ...overrides
  }),
  
  generatePricing: (overrides = {}) => ({
    plans: [
      { code: 'base-starter', name: 'Base Starter', price: 199, currency: 'EUR' },
      { code: 'base-enterprise', name: 'Base Enterprise', price: 499, currency: 'EUR' }
    ],
    modules: [
      { code: 'email-routing', name: 'E-Mail Routing', price: 99 },
      { code: 'voicebot', name: 'Voicebot', price: 149 },
      { code: 'image-gen', name: 'Image Generation', price: 79 }
    ],
    ...overrides
  })
};