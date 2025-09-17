/**
 * Security Utilities Test Suite
 * 
 * Comprehensive tests for security features including:
 * - Content Security Policy (CSP) management
 * - XSS protection
 * - CSRF token handling
 * - Input validation
 * - Secure storage
 * - Rate limiting
 */

import {
  CSPManager,
  XSSProtection,
  CSRFManager,
  SecureStorage,
  RateLimiter,
  SecurityHeaders,
  InputValidator,
  initializeSecurity
} from '../security';
import { MockUtils } from '../test-utils';

describe('Security Utilities', () => {
  beforeEach(() => {
    MockUtils.mockLocalStorage();
  });

  afterEach(() => {
    MockUtils.restoreAll();
  });

  describe('CSPManager', () => {
    let cspManager: CSPManager;

    beforeEach(() => {
      cspManager = new CSPManager();
    });

    it('should initialize with default configuration', () => {
      expect(cspManager).toBeDefined();
      expect(cspManager.getNonce()).toBeDefined();
      expect(cspManager.getNonce().length).toBe(32); // 16 bytes = 32 hex chars
    });

    it('should generate unique nonces', () => {
      const nonce1 = cspManager.getNonce();
      const cspManager2 = new CSPManager();
      const nonce2 = cspManager2.getNonce();
      
      expect(nonce1).not.toBe(nonce2);
    });

    it('should generate valid CSP header', () => {
      const cspHeader = cspManager.generateCSPHeader();
      
      expect(cspHeader).toContain('default-src');
      expect(cspHeader).toContain('script-src');
      expect(cspHeader).toContain('style-src');
      expect(cspHeader).toContain('img-src');
      expect(cspHeader).toContain('font-src');
      expect(cspHeader).toContain('connect-src');
      expect(cspHeader).toContain('frame-src');
      expect(cspHeader).toContain('object-src');
      expect(cspHeader).toContain('base-uri');
      expect(cspHeader).toContain('form-action');
      expect(cspHeader).toContain('frame-ancestors');
      expect(cspHeader).toContain('upgrade-insecure-requests');
      expect(cspHeader).toContain('block-all-mixed-content');
    });

    it('should include nonce in script-src directive', () => {
      const cspHeader = cspManager.generateCSPHeader();
      const nonce = cspManager.getNonce();
      
      expect(cspHeader).toContain(`'nonce-${nonce}'`);
    });

    it('should allow Stripe domains in appropriate directives', () => {
      const cspHeader = cspManager.generateCSPHeader();
      
      expect(cspHeader).toContain('https://js.stripe.com');
      expect(cspHeader).toContain('https://checkout.stripe.com');
      expect(cspHeader).toContain('https://api.stripe.com');
    });

    it('should add nonce to script elements', () => {
      const script = document.createElement('script');
      cspManager.addNonceToScript(script);
      
      expect(script.nonce).toBe(cspManager.getNonce());
    });

    it('should add nonce to style elements', () => {
      const style = document.createElement('style');
      cspManager.addNonceToStyle(style);
      
      expect(style.nonce).toBe(cspManager.getNonce());
    });

    it('should update configuration', () => {
      const newConfig = {
        'script-src': ["'self'", "'unsafe-inline'", 'https://custom-cdn.com']
      };
      
      cspManager.updateConfig(newConfig);
      const cspHeader = cspManager.generateCSPHeader();
      
      expect(cspHeader).toContain('https://custom-cdn.com');
    });
  });

  describe('XSSProtection', () => {
    it('should sanitize HTML content', () => {
      const maliciousHTML = '<script>alert("xss")</script><p>Safe content</p>';
      const sanitized = XSSProtection.sanitizeHTML(maliciousHTML);
      
      expect(sanitized).toBe('&lt;script&gt;alert("xss")&lt;/script&gt;&lt;p&gt;Safe content&lt;/p&gt;');
    });

    it('should sanitize user input', () => {
      const maliciousInput = '<img src="x" onerror="alert(1)">';
      const sanitized = XSSProtection.sanitizeInput(maliciousInput);
      
      expect(sanitized).toBe('&lt;img src=&quot;x&quot; onerror=&quot;alert(1)&quot;&gt;');
    });

    it('should validate safe URLs', () => {
      expect(XSSProtection.validateURL('https://example.com')).toBe(true);
      expect(XSSProtection.validateURL('http://example.com')).toBe(true);
      expect(XSSProtection.validateURL('mailto:test@example.com')).toBe(true);
      expect(XSSProtection.validateURL('tel:+1234567890')).toBe(true);
    });

    it('should reject dangerous URLs', () => {
      expect(XSSProtection.validateURL('javascript:alert(1)')).toBe(false);
      expect(XSSProtection.validateURL('data:text/html,<script>alert(1)</script>')).toBe(false);
      expect(XSSProtection.validateURL('vbscript:msgbox(1)')).toBe(false);
    });

    it('should sanitize URLs', () => {
      expect(XSSProtection.sanitizeURL('https://example.com')).toBe('https://example.com');
      expect(XSSProtection.sanitizeURL('javascript:alert(1)')).toBe('#');
    });

    it('should create safe HTML elements', () => {
      const element = XSSProtection.createSafeElement('a', {
        href: 'https://example.com',
        title: 'Safe link'
      }, 'Click here');
      
      expect(element.tagName).toBe('A');
      expect(element.getAttribute('href')).toBe('https://example.com');
      expect(element.getAttribute('title')).toBe('Safe link');
      expect(element.textContent).toBe('Click here');
    });

    it('should sanitize dangerous attributes', () => {
      const element = XSSProtection.createSafeElement('a', {
        href: 'javascript:alert(1)',
        title: '<script>alert(1)</script>'
      }, 'Dangerous link');
      
      expect(element.getAttribute('href')).toBe('#');
      expect(element.getAttribute('title')).toBe('&lt;script&gt;alert(1)&lt;/script&gt;');
    });
  });

  describe('CSRFManager', () => {
    let csrfManager: CSRFManager;

    beforeEach(() => {
      csrfManager = new CSRFManager();
    });

    it('should initialize without token', () => {
      expect(csrfManager.getToken()).toBeNull();
    });

    it('should load token from meta tag', () => {
      const metaTag = document.createElement('meta');
      metaTag.setAttribute('name', 'csrf-token');
      metaTag.setAttribute('content', 'test-token-123');
      document.head.appendChild(metaTag);

      const newCsrfManager = new CSRFManager();
      expect(newCsrfManager.getToken()).toBe('test-token-123');
    });

    it('should load token from cookie', () => {
      document.cookie = 'csrf-token=test-token-456';
      
      const newCsrfManager = new CSRFManager();
      expect(newCsrfManager.getToken()).toBe('test-token-456');
    });

    it('should add token to fetch request', () => {
      csrfManager = new CSRFManager();
      (csrfManager as any).token = 'test-token-789';
      
      const options = csrfManager.addTokenToRequest({ method: 'POST' });
      
      expect(options.headers).toBeDefined();
      const headers = options.headers as Headers;
      expect(headers.get('X-CSRF-Token')).toBe('test-token-789');
    });

    it('should add token to form data', () => {
      csrfManager = new CSRFManager();
      (csrfManager as any).token = 'test-token-101';
      
      const formData = new FormData();
      formData.append('field1', 'value1');
      
      const updatedFormData = csrfManager.addTokenToFormData(formData);
      
      expect(updatedFormData.get('csrf-token')).toBe('test-token-101');
      expect(updatedFormData.get('field1')).toBe('value1');
    });

    it('should refresh token from backend', async () => {
      MockUtils.mockFetch({
        '/api/csrf-token': { 
          status: 200, 
          body: { token: 'new-token-123' } 
        }
      });

      await csrfManager.refreshToken();
      
      expect(csrfManager.getToken()).toBe('new-token-123');
    });

    it('should handle token refresh errors', async () => {
      MockUtils.mockFetch({
        '/api/csrf-token': { status: 500, body: { error: 'Server Error' } }
      });

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      await csrfManager.refreshToken();
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to refresh CSRF token:',
        expect.any(Error)
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('SecureStorage', () => {
    it('should store and retrieve data', () => {
      const testData = { key: 'value', number: 123, array: [1, 2, 3] };
      
      SecureStorage.setItem('test-key', testData);
      const retrieved = SecureStorage.getItem('test-key');
      
      expect(retrieved).toEqual(testData);
    });

    it('should return null for non-existent key', () => {
      const retrieved = SecureStorage.getItem('non-existent-key');
      expect(retrieved).toBeNull();
    });

    it('should remove data', () => {
      SecureStorage.setItem('test-key', 'test-value');
      expect(SecureStorage.getItem('test-key')).toBe('test-value');
      
      SecureStorage.removeItem('test-key');
      expect(SecureStorage.getItem('test-key')).toBeNull();
    });

    it('should clear all data', () => {
      SecureStorage.setItem('key1', 'value1');
      SecureStorage.setItem('key2', 'value2');
      
      SecureStorage.clear();
      
      expect(SecureStorage.getItem('key1')).toBeNull();
      expect(SecureStorage.getItem('key2')).toBeNull();
    });

    it('should handle storage errors gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      // Mock localStorage to throw error
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = jest.fn(() => {
        throw new Error('Storage quota exceeded');
      });
      
      SecureStorage.setItem('test-key', 'test-value');
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to store data securely:',
        expect.any(Error)
      );
      
      localStorage.setItem = originalSetItem;
      consoleSpy.mockRestore();
    });

    it('should encrypt and decrypt data', () => {
      const testData = { sensitive: 'data', secret: 12345 };
      
      SecureStorage.setItem('encrypted-key', testData);
      const retrieved = SecureStorage.getItem('encrypted-key');
      
      expect(retrieved).toEqual(testData);
      
      // Verify data is actually encrypted in storage
      const rawValue = localStorage.getItem('gcz_encrypted-key');
      expect(rawValue).not.toContain('sensitive');
      expect(rawValue).not.toContain('data');
    });
  });

  describe('RateLimiter', () => {
    let rateLimiter: RateLimiter;

    beforeEach(() => {
      rateLimiter = new RateLimiter({
        windowMs: 1000, // 1 second
        maxRequests: 3
      });
    });

    it('should allow requests within limit', () => {
      expect(rateLimiter.isAllowed('user1')).toBe(true);
      expect(rateLimiter.isAllowed('user1')).toBe(true);
      expect(rateLimiter.isAllowed('user1')).toBe(true);
    });

    it('should block requests exceeding limit', () => {
      // Make 3 requests (within limit)
      rateLimiter.isAllowed('user1');
      rateLimiter.isAllowed('user1');
      rateLimiter.isAllowed('user1');
      
      // 4th request should be blocked
      expect(rateLimiter.isAllowed('user1')).toBe(false);
    });

    it('should track different identifiers separately', () => {
      // User 1 makes 3 requests
      rateLimiter.isAllowed('user1');
      rateLimiter.isAllowed('user1');
      rateLimiter.isAllowed('user1');
      
      // User 2 should still be allowed
      expect(rateLimiter.isAllowed('user2')).toBe(true);
    });

    it('should return remaining requests count', () => {
      expect(rateLimiter.getRemainingRequests('user1')).toBe(3);
      
      rateLimiter.isAllowed('user1');
      expect(rateLimiter.getRemainingRequests('user1')).toBe(2);
      
      rateLimiter.isAllowed('user1');
      expect(rateLimiter.getRemainingRequests('user1')).toBe(1);
      
      rateLimiter.isAllowed('user1');
      expect(rateLimiter.getRemainingRequests('user1')).toBe(0);
    });

    it('should return reset time', () => {
      rateLimiter.isAllowed('user1');
      const resetTime = rateLimiter.getResetTime('user1');
      
      expect(resetTime).toBeGreaterThan(Date.now());
      expect(resetTime).toBeLessThanOrEqual(Date.now() + 1000);
    });

    it('should clean up old entries', () => {
      // Make requests
      rateLimiter.isAllowed('user1');
      
      // Fast forward time beyond window
      const originalNow = Date.now;
      Date.now = jest.fn(() => originalNow() + 2000);
      
      rateLimiter.cleanup();
      
      // Should be able to make requests again
      expect(rateLimiter.isAllowed('user1')).toBe(true);
      
      Date.now = originalNow;
    });
  });

  describe('SecurityHeaders', () => {
    let securityHeaders: SecurityHeaders;

    beforeEach(() => {
      securityHeaders = new SecurityHeaders();
    });

    it('should generate security headers', () => {
      const headers = securityHeaders.generateHeaders();
      
      expect(headers['Content-Security-Policy']).toBeDefined();
      expect(headers['X-Frame-Options']).toBe('DENY');
      expect(headers['X-Content-Type-Options']).toBe('nosniff');
      expect(headers['Referrer-Policy']).toBe('strict-origin-when-cross-origin');
      expect(headers['Permissions-Policy']).toBeDefined();
      expect(headers['Strict-Transport-Security']).toBeDefined();
    });

    it('should apply headers to document', () => {
      const createElementSpy = jest.spyOn(document, 'createElement');
      const appendChildSpy = jest.spyOn(document.head, 'appendChild');
      
      securityHeaders.applyHeaders();
      
      expect(createElementSpy).toHaveBeenCalledWith('meta');
      expect(appendChildSpy).toHaveBeenCalled();
    });
  });

  describe('InputValidator', () => {
    it('should validate email addresses', () => {
      expect(InputValidator.validateEmail('test@example.com')).toBe(true);
      expect(InputValidator.validateEmail('user.name+tag@domain.co.uk')).toBe(true);
      expect(InputValidator.validateEmail('invalid-email')).toBe(false);
      expect(InputValidator.validateEmail('@example.com')).toBe(false);
      expect(InputValidator.validateEmail('test@')).toBe(false);
    });

    it('should validate phone numbers', () => {
      expect(InputValidator.validatePhone('+1234567890')).toBe(true);
      expect(InputValidator.validatePhone('1234567890')).toBe(true);
      expect(InputValidator.validatePhone('+49 30 12345678')).toBe(true);
      expect(InputValidator.validatePhone('abc123')).toBe(false);
      expect(InputValidator.validatePhone('123')).toBe(false);
    });

    it('should validate URLs', () => {
      expect(InputValidator.validateURL('https://example.com')).toBe(true);
      expect(InputValidator.validateURL('http://example.com/path')).toBe(true);
      expect(InputValidator.validateURL('invalid-url')).toBe(false);
      expect(InputValidator.validateURL('')).toBe(false);
    });

    it('should validate password strength', () => {
      const weakPassword = InputValidator.validatePassword('123');
      expect(weakPassword.isValid).toBe(false);
      expect(weakPassword.score).toBeLessThan(4);
      expect(weakPassword.feedback).toContain('Password must be at least 8 characters long');

      const strongPassword = InputValidator.validatePassword('MyStr0ng!Pass');
      expect(strongPassword.isValid).toBe(true);
      expect(strongPassword.score).toBe(5);
      expect(strongPassword.feedback).toHaveLength(0);
    });

    it('should sanitize form data', () => {
      const formData = new FormData();
      formData.append('name', 'John Doe');
      formData.append('email', 'john@example.com');
      formData.append('message', '<script>alert("xss")</script>Hello');
      
      const sanitized = InputValidator.sanitizeFormData(formData);
      
      expect(sanitized.get('name')).toBe('John Doe');
      expect(sanitized.get('email')).toBe('john@example.com');
      expect(sanitized.get('message')).toBe('&lt;script&gt;alert("xss")&lt;/script&gt;Hello');
    });
  });

  describe('initializeSecurity', () => {
    it('should initialize all security features', () => {
      const { cspManager, csrfManager, rateLimiter } = initializeSecurity();
      
      expect(cspManager).toBeInstanceOf(CSPManager);
      expect(csrfManager).toBeInstanceOf(CSRFManager);
      expect(rateLimiter).toBeInstanceOf(RateLimiter);
    });

    it('should set up periodic cleanup', () => {
      const setIntervalSpy = jest.spyOn(global, 'setInterval');
      
      initializeSecurity();
      
      expect(setIntervalSpy).toHaveBeenCalledWith(
        expect.any(Function),
        5 * 60 * 1000 // 5 minutes
      );
    });
  });

  describe('Integration tests', () => {
    it('should work together for secure form submission', async () => {
      const { cspManager, csrfManager } = initializeSecurity();
      
      // Mock CSRF token
      (csrfManager as any).token = 'test-csrf-token';
      
      // Create form data
      const formData = new FormData();
      formData.append('email', 'test@example.com');
      formData.append('message', 'Hello world');
      
      // Add CSRF token
      const secureFormData = csrfManager.addTokenToFormData(formData);
      
      // Sanitize form data
      const sanitizedFormData = InputValidator.sanitizeFormData(secureFormData);
      
      expect(sanitizedFormData.get('csrf-token')).toBe('test-csrf-token');
      expect(sanitizedFormData.get('email')).toBe('test@example.com');
      expect(sanitizedFormData.get('message')).toBe('Hello world');
    });

    it('should protect against XSS in stored data', () => {
      const maliciousData = {
        name: '<script>alert("xss")</script>',
        email: 'test@example.com'
      };
      
      SecureStorage.setItem('user-data', maliciousData);
      const retrieved = SecureStorage.getItem('user-data');
      
      expect(retrieved.name).toBe(maliciousData.name); // Data is stored as-is
      // But when displayed, it should be sanitized
      const sanitized = XSSProtection.sanitizeInput(retrieved.name);
      expect(sanitized).toBe('&lt;script&gt;alert("xss")&lt;/script&gt;');
    });
  });
});