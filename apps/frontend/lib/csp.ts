/**
 * Content Security Policy (CSP) Management for German Code Zero AI Frontend
 * 
 * Implements nonce-based CSP with strict security policies:
 * - script-src 'self' 'nonce-<nonce>' *.stripe.com
 * - style-src 'self' 'unsafe-inline'
 * - connect-src 'self' *.stripe.com
 * - img-src 'self' data:
 * - frame-src *.stripe.com
 * - base-uri 'self'
 * - upgrade-insecure-requests
 */

import { headers } from 'next/headers';
import { NextRequest } from 'next/server';

export interface CSPDirectives {
  'script-src': string[];
  'style-src': string[];
  'connect-src': string[];
  'img-src': string[];
  'frame-src': string[];
  'base-uri': string[];
  'upgrade-insecure-requests': boolean;
}

/**
 * Generate a cryptographically secure nonce for CSP
 */
export function generateNonce(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Get the CSP directives configuration
 */
export function getCSPDirectives(): CSPDirectives {
  return {
    'script-src': [
      "'self'",
      '*.stripe.com',
      'https://js.stripe.com',
      'https://checkout.stripe.com'
    ],
    'style-src': [
      "'self'",
      "'unsafe-inline'" // Required for dynamic styles and frameworks
    ],
    'connect-src': [
      "'self'",
      '*.stripe.com',
      'https://api.stripe.com',
      'https://checkout.stripe.com',
      'https://api.germancodezero.ai'
    ],
    'img-src': [
      "'self'",
      'data:'
    ],
    'frame-src': [
      '*.stripe.com',
      'https://js.stripe.com',
      'https://checkout.stripe.com'
    ],
    'base-uri': [
      "'self'"
    ],
    'upgrade-insecure-requests': true
  };
}

/**
 * Build CSP header string with nonce
 */
export function buildCSPHeader(nonce: string): string {
  const directives = getCSPDirectives();
  const cspParts: string[] = [];

  // Add script-src with nonce
  const scriptSrc = [...directives['script-src'], `'nonce-${nonce}'`];
  cspParts.push(`script-src ${scriptSrc.join(' ')}`);

  // Add other directives
  Object.entries(directives).forEach(([directive, values]) => {
    if (directive === 'script-src') return; // Already handled above
    
    if (Array.isArray(values)) {
      cspParts.push(`${directive} ${values.join(' ')}`);
    } else if (typeof values === 'boolean' && values) {
      cspParts.push(directive);
    }
  });

  return cspParts.join('; ');
}

/**
 * CSP Manager class for handling nonce generation and header creation
 */
export class CSPManager {
  private nonce: string;

  constructor(nonce?: string) {
    this.nonce = nonce || generateNonce();
  }

  /**
   * Get the current nonce
   */
  getNonce(): string {
    return this.nonce;
  }

  /**
   * Generate new nonce
   */
  regenerateNonce(): string {
    this.nonce = generateNonce();
    return this.nonce;
  }

  /**
   * Get CSP header value
   */
  getCSPHeader(): string {
    return buildCSPHeader(this.nonce);
  }

  /**
   * Get all security headers including CSP
   */
  getSecurityHeaders(): Record<string, string> {
    return {
      'Content-Security-Policy': this.getCSPHeader(),
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload'
    };
  }
}

/**
 * Get nonce from request headers or generate new one
 */
export function getNonceFromRequest(request: NextRequest): string {
  // Try to get nonce from request headers (set by middleware)
  const existingNonce = request.headers.get('x-nonce');
  if (existingNonce) {
    return existingNonce;
  }

  // Generate new nonce if not found
  return generateNonce();
}

/**
 * Get nonce from Next.js headers (for use in server components)
 */
export function getNonceFromHeaders(): string {
  const headersList = headers();
  const nonce = headersList.get('x-nonce');
  
  if (!nonce) {
    // This should not happen if middleware is properly configured
    console.warn('No nonce found in headers, generating fallback nonce');
    return generateNonce();
  }
  
  return nonce;
}

/**
 * Create script tag with nonce attribute
 */
export function createNonceScript(content: string, nonce: string): string {
  return `<script nonce="${nonce}">${content}</script>`;
}

/**
 * Create style tag with nonce attribute (optional, since we allow unsafe-inline for styles)
 */
export function createNonceStyle(content: string, nonce: string): string {
  return `<style nonce="${nonce}">${content}</style>`;
}

/**
 * Validate nonce format
 */
export function isValidNonce(nonce: string): boolean {
  // Nonce should be a hex string of 32 characters (16 bytes)
  return /^[a-f0-9]{32}$/i.test(nonce);
}

/**
 * Default CSP manager instance
 */
let defaultCSPManager: CSPManager | null = null;

/**
 * Get or create default CSP manager
 */
export function getDefaultCSPManager(): CSPManager {
  if (!defaultCSPManager) {
    defaultCSPManager = new CSPManager();
  }
  return defaultCSPManager;
}

/**
 * Reset default CSP manager (useful for testing)
 */
export function resetDefaultCSPManager(): void {
  defaultCSPManager = null;
}