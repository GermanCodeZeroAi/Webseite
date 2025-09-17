/**
 * Security Utilities for Autonomy Grid Frontend
 * 
 * Provides comprehensive security features including:
 * - Content Security Policy (CSP) management
 * - XSS protection
 * - CSRF token handling
 * - Input sanitization
 * - Secure storage utilities
 * - Rate limiting helpers
 */

export interface CSPConfig {
  'default-src': string[];
  'script-src': string[];
  'style-src': string[];
  'img-src': string[];
  'font-src': string[];
  'connect-src': string[];
  'frame-src': string[];
  'object-src': string[];
  'base-uri': string[];
  'form-action': string[];
  'frame-ancestors': string[];
  'upgrade-insecure-requests': boolean;
  'block-all-mixed-content': boolean;
}

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyGenerator?: (req: Request) => string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

export interface SecurityHeaders {
  'Content-Security-Policy': string;
  'X-Frame-Options': string;
  'X-Content-Type-Options': string;
  'Referrer-Policy': string;
  'Permissions-Policy': string;
  'Strict-Transport-Security': string;
}

/**
 * Content Security Policy manager
 */
export class CSPManager {
  private config: Partial<CSPConfig>;
  private nonce: string;

  constructor(config: Partial<CSPConfig> = {}) {
    this.config = this.getDefaultConfig();
    this.mergeConfig(config);
    this.nonce = this.generateNonce();
  }

  private getDefaultConfig(): CSPConfig {
    return {
      'default-src': ["'self'"],
      'script-src': [
        "'self'",
        "'unsafe-inline'", // Required for inline scripts with nonce
        'https://js.stripe.com',
        'https://checkout.stripe.com'
      ],
      'style-src': [
        "'self'",
        "'unsafe-inline'", // Required for inline styles
        'https://fonts.googleapis.com'
      ],
      'img-src': [
        "'self'",
        'data:',
        'https:',
        'blob:'
      ],
      'font-src': [
        "'self'",
        'https://fonts.gstatic.com',
        'data:'
      ],
      'connect-src': [
        "'self'",
        'https://api.stripe.com',
        'https://backend.autonomy-grid.com',
        'https://staging.autonomy-grid.com'
      ],
      'frame-src': [
        "'self'",
        'https://js.stripe.com',
        'https://checkout.stripe.com',
        'https://hooks.stripe.com'
      ],
      'object-src': ["'none'"],
      'base-uri': ["'self'"],
      'form-action': ["'self'"],
      'frame-ancestors': ["'none'"],
      'upgrade-insecure-requests': true,
      'block-all-mixed-content': true
    };
  }

  private mergeConfig(config: Partial<CSPConfig>): void {
    Object.keys(config).forEach(key => {
      if (config[key as keyof CSPConfig]) {
        this.config[key as keyof CSPConfig] = config[key as keyof CSPConfig] as any;
      }
    });
  }

  private generateNonce(): string {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Get current nonce for inline scripts/styles
   */
  getNonce(): string {
    return this.nonce;
  }

  /**
   * Generate CSP header value
   */
  generateCSPHeader(): string {
    const directives: string[] = [];

    Object.entries(this.config).forEach(([directive, values]) => {
      if (Array.isArray(values)) {
        if (directive === 'script-src' && values.includes("'unsafe-inline'")) {
          // Replace unsafe-inline with nonce
          const nonceValues = values.filter(v => v !== "'unsafe-inline'");
          nonceValues.push(`'nonce-${this.nonce}'`);
          directives.push(`${directive} ${nonceValues.join(' ')}`);
        } else {
          directives.push(`${directive} ${values.join(' ')}`);
        }
      } else if (typeof values === 'boolean' && values) {
        directives.push(directive);
      }
    });

    return directives.join('; ');
  }

  /**
   * Add nonce to script tag
   */
  addNonceToScript(script: HTMLScriptElement): void {
    script.nonce = this.nonce;
  }

  /**
   * Add nonce to style tag
   */
  addNonceToStyle(style: HTMLStyleElement): void {
    style.nonce = this.nonce;
  }

  /**
   * Update CSP configuration
   */
  updateConfig(newConfig: Partial<CSPConfig>): void {
    this.mergeConfig(newConfig);
  }
}

/**
 * XSS protection utilities
 */
export class XSSProtection {
  /**
   * Sanitize HTML content
   */
  static sanitizeHTML(html: string): string {
    const div = document.createElement('div');
    div.textContent = html;
    return div.innerHTML;
  }

  /**
   * Sanitize user input for display
   */
  static sanitizeInput(input: string): string {
    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  /**
   * Validate URL to prevent javascript: and data: schemes
   */
  static validateURL(url: string): boolean {
    try {
      const parsed = new URL(url);
      const allowedSchemes = ['http:', 'https:', 'mailto:', 'tel:'];
      return allowedSchemes.includes(parsed.protocol);
    } catch {
      return false;
    }
  }

  /**
   * Sanitize URL for safe use
   */
  static sanitizeURL(url: string): string {
    if (!this.validateURL(url)) {
      return '#';
    }
    return url;
  }

  /**
   * Create safe HTML element
   */
  static createSafeElement(tagName: string, attributes: Record<string, string> = {}, content: string = ''): HTMLElement {
    const element = document.createElement(tagName);
    
    Object.entries(attributes).forEach(([key, value]) => {
      if (key === 'href' || key === 'src') {
        element.setAttribute(key, this.sanitizeURL(value));
      } else {
        element.setAttribute(key, this.sanitizeInput(value));
      }
    });

    if (content) {
      element.textContent = content;
    }

    return element;
  }
}

/**
 * CSRF token manager
 */
export class CSRFManager {
  private token: string | null = null;
  private tokenName: string;

  constructor(tokenName: string = 'csrf-token') {
    this.tokenName = tokenName;
    this.loadToken();
  }

  private loadToken(): void {
    // Try to get token from meta tag
    const metaTag = document.querySelector(`meta[name="${this.tokenName}"]`);
    if (metaTag) {
      this.token = metaTag.getAttribute('content');
      return;
    }

    // Try to get token from cookie
    const cookies = document.cookie.split(';');
    const tokenCookie = cookies.find(cookie => 
      cookie.trim().startsWith(`${this.tokenName}=`)
    );
    if (tokenCookie) {
      this.token = tokenCookie.split('=')[1];
    }
  }

  /**
   * Get current CSRF token
   */
  getToken(): string | null {
    return this.token;
  }

  /**
   * Add CSRF token to fetch request
   */
  addTokenToRequest(options: RequestInit = {}): RequestInit {
    if (!this.token) return options;

    const headers = new Headers(options.headers);
    headers.set('X-CSRF-Token', this.token);
    
    return {
      ...options,
      headers
    };
  }

  /**
   * Add CSRF token to form data
   */
  addTokenToFormData(formData: FormData): FormData {
    if (this.token) {
      formData.append(this.tokenName, this.token);
    }
    return formData;
  }

  /**
   * Refresh CSRF token
   */
  async refreshToken(): Promise<void> {
    try {
      const response = await fetch('/auth/csrf-token', {
        method: 'GET',
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        this.token = data.token;
        
        // Update meta tag
        let metaTag = document.querySelector(`meta[name="${this.tokenName}"]`);
        if (!metaTag) {
          metaTag = document.createElement('meta');
          metaTag.setAttribute('name', this.tokenName);
          document.head.appendChild(metaTag);
        }
        metaTag.setAttribute('content', this.token);
      }
    } catch (error) {
      console.warn('Failed to refresh CSRF token:', error);
    }
  }
}

/**
 * Secure storage utilities
 */
export class SecureStorage {
  private static readonly PREFIX = 'gcz_';
  private static readonly ENCRYPTION_KEY = 'gcz_encryption_key';

  /**
   * Store data securely in localStorage
   */
  static setItem(key: string, value: any): void {
    try {
      const encryptedValue = this.encrypt(JSON.stringify(value));
      localStorage.setItem(this.PREFIX + key, encryptedValue);
    } catch (error) {
      console.error('Failed to store data securely:', error);
    }
  }

  /**
   * Retrieve data from secure storage
   */
  static getItem<T>(key: string): T | null {
    try {
      const encryptedValue = localStorage.getItem(this.PREFIX + key);
      if (!encryptedValue) return null;
      
      const decryptedValue = this.decrypt(encryptedValue);
      return JSON.parse(decryptedValue);
    } catch (error) {
      console.error('Failed to retrieve data securely:', error);
      return null;
    }
  }

  /**
   * Remove data from secure storage
   */
  static removeItem(key: string): void {
    localStorage.removeItem(this.PREFIX + key);
  }

  /**
   * Clear all secure storage
   */
  static clear(): void {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(this.PREFIX)) {
        localStorage.removeItem(key);
      }
    });
  }

  private static encrypt(text: string): string {
    // Simple XOR encryption - in production, use a proper encryption library
    let encrypted = '';
    const key = this.ENCRYPTION_KEY;
    
    for (let i = 0; i < text.length; i++) {
      encrypted += String.fromCharCode(
        text.charCodeAt(i) ^ key.charCodeAt(i % key.length)
      );
    }
    
    return btoa(encrypted);
  }

  private static decrypt(encryptedText: string): string {
    try {
      const text = atob(encryptedText);
      let decrypted = '';
      const key = this.ENCRYPTION_KEY;
      
      for (let i = 0; i < text.length; i++) {
        decrypted += String.fromCharCode(
          text.charCodeAt(i) ^ key.charCodeAt(i % key.length)
        );
      }
      
      return decrypted;
    } catch (error) {
      throw new Error('Failed to decrypt data');
    }
  }
}

/**
 * Rate limiting utility
 */
export class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
  }

  /**
   * Check if request is within rate limit
   */
  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;
    
    // Get existing requests for this identifier
    const requests = this.requests.get(identifier) || [];
    
    // Remove old requests outside the window
    const validRequests = requests.filter(timestamp => timestamp > windowStart);
    
    // Check if we're within the limit
    if (validRequests.length >= this.config.maxRequests) {
      return false;
    }
    
    // Add current request
    validRequests.push(now);
    this.requests.set(identifier, validRequests);
    
    return true;
  }

  /**
   * Get remaining requests for identifier
   */
  getRemainingRequests(identifier: string): number {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;
    const requests = this.requests.get(identifier) || [];
    const validRequests = requests.filter(timestamp => timestamp > windowStart);
    
    return Math.max(0, this.config.maxRequests - validRequests.length);
  }

  /**
   * Get reset time for identifier
   */
  getResetTime(identifier: string): number {
    const requests = this.requests.get(identifier) || [];
    if (requests.length === 0) return 0;
    
    const oldestRequest = Math.min(...requests);
    return oldestRequest + this.config.windowMs;
  }

  /**
   * Clean up old entries
   */
  cleanup(): void {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;
    
    this.requests.forEach((requests, identifier) => {
      const validRequests = requests.filter(timestamp => timestamp > windowStart);
      if (validRequests.length === 0) {
        this.requests.delete(identifier);
      } else {
        this.requests.set(identifier, validRequests);
      }
    });
  }
}

/**
 * Security headers generator
 */
export class SecurityHeaders {
  private cspManager: CSPManager;

  constructor(cspConfig?: Partial<CSPConfig>) {
    this.cspManager = new CSPManager(cspConfig);
  }

  /**
   * Generate security headers
   */
  generateHeaders(): Record<string, string> {
    return {
      'Content-Security-Policy': this.cspManager.generateCSPHeader(),
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload'
    };
  }

  /**
   * Apply security headers to document
   */
  applyHeaders(): void {
    const headers = this.generateHeaders();
    
    // Apply CSP via meta tag
    let cspMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
    if (!cspMeta) {
      cspMeta = document.createElement('meta');
      cspMeta.setAttribute('http-equiv', 'Content-Security-Policy');
      document.head.appendChild(cspMeta);
    }
    cspMeta.setAttribute('content', headers['Content-Security-Policy']);
  }
}

/**
 * Input validation utilities
 */
export class InputValidator {
  /**
   * Validate email address
   */
  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate phone number
   */
  static validatePhone(phone: string): boolean {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
  }

  /**
   * Validate URL
   */
  static validateURL(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Validate password strength
   */
  static validatePassword(password: string): {
    isValid: boolean;
    score: number;
    feedback: string[];
  } {
    const feedback: string[] = [];
    let score = 0;

    if (password.length < 8) {
      feedback.push('Password must be at least 8 characters long');
    } else {
      score += 1;
    }

    if (!/[a-z]/.test(password)) {
      feedback.push('Password must contain at least one lowercase letter');
    } else {
      score += 1;
    }

    if (!/[A-Z]/.test(password)) {
      feedback.push('Password must contain at least one uppercase letter');
    } else {
      score += 1;
    }

    if (!/\d/.test(password)) {
      feedback.push('Password must contain at least one number');
    } else {
      score += 1;
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      feedback.push('Password must contain at least one special character');
    } else {
      score += 1;
    }

    return {
      isValid: score >= 4,
      score,
      feedback
    };
  }

  /**
   * Sanitize and validate form data
   */
  static sanitizeFormData(formData: FormData): FormData {
    const sanitized = new FormData();
    
    formData.forEach((value, key) => {
      if (typeof value === 'string') {
        sanitized.append(key, XSSProtection.sanitizeInput(value));
      } else {
        sanitized.append(key, value);
      }
    });
    
    return sanitized;
  }
}

/**
 * Initialize security features
 */
export function initializeSecurity(): {
  cspManager: CSPManager;
  csrfManager: CSRFManager;
  rateLimiter: RateLimiter;
} {
  // Initialize CSP manager
  const cspManager = new CSPManager();

  // Initialize CSRF manager
  const csrfManager = new CSRFManager();

  // Initialize rate limiter
  const rateLimiter = new RateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100 // 100 requests per window
  });

  // Apply security headers
  const securityHeaders = new SecurityHeaders();
  securityHeaders.applyHeaders();

  // Set up periodic cleanup for rate limiter
  setInterval(() => {
    rateLimiter.cleanup();
  }, 5 * 60 * 1000); // Clean up every 5 minutes

  return { cspManager, csrfManager, rateLimiter };
}