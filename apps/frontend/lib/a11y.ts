/**
 * Accessibility Utilities for Autonomy Grid Frontend
 * 
 * Provides comprehensive accessibility features including:
 * - Focus management
 * - ARIA live regions for dynamic content
 * - Keyboard navigation helpers
 * - Screen reader announcements
 * - Color contrast utilities
 * - WCAG 2.2 AA compliance helpers
 */

export interface A11yConfig {
  announcePriceUpdates: boolean;
  announceFormErrors: boolean;
  announceNavigation: boolean;
  highContrast: boolean;
  reducedMotion: boolean;
}

export interface FocusTrapOptions {
  container: HTMLElement;
  initialFocus?: HTMLElement;
  returnFocus?: HTMLElement;
  escapeKey?: boolean;
}

export interface LiveRegionOptions {
  politeness: 'polite' | 'assertive' | 'off';
  atomic: boolean;
  relevant: 'additions' | 'removals' | 'text' | 'all';
}

/**
 * Default accessibility configuration
 */
export const DEFAULT_A11Y_CONFIG: A11yConfig = {
  announcePriceUpdates: true,
  announceFormErrors: true,
  announceNavigation: false,
  highContrast: false,
  reducedMotion: false
};

/**
 * Create and manage ARIA live regions for announcements
 */
export class LiveRegionManager {
  private regions: Map<string, HTMLElement> = new Map();
  private config: A11yConfig;

  constructor(config: A11yConfig = DEFAULT_A11Y_CONFIG) {
    this.config = config;
    this.initializeLiveRegions();
  }

  private initializeLiveRegions(): void {
    // Create live region for price updates
    if (this.config.announcePriceUpdates) {
      this.createLiveRegion('price-updates', {
        politeness: 'polite',
        atomic: true,
        relevant: 'text'
      });
    }

    // Create live region for form errors
    if (this.config.announceFormErrors) {
      this.createLiveRegion('form-errors', {
        politeness: 'assertive',
        atomic: true,
        relevant: 'text'
      });
    }

    // Create live region for navigation
    if (this.config.announceNavigation) {
      this.createLiveRegion('navigation', {
        politeness: 'polite',
        atomic: false,
        relevant: 'text'
      });
    }
  }

  private createLiveRegion(id: string, options: LiveRegionOptions): HTMLElement {
    const region = document.createElement('div');
    region.id = `live-region-${id}`;
    region.setAttribute('aria-live', options.politeness);
    region.setAttribute('aria-atomic', options.atomic.toString());
    region.setAttribute('aria-relevant', options.relevant);
    region.className = 'sr-only';
    region.style.cssText = `
      position: absolute !important;
      width: 1px !important;
      height: 1px !important;
      padding: 0 !important;
      margin: -1px !important;
      overflow: hidden !important;
      clip: rect(0, 0, 0, 0) !important;
      white-space: nowrap !important;
      border: 0 !important;
    `;
    
    document.body.appendChild(region);
    this.regions.set(id, region);
    return region;
  }

  /**
   * Announce text to a specific live region
   */
  announce(id: string, text: string): void {
    const region = this.regions.get(id);
    if (region) {
      // Clear previous content
      region.textContent = '';
      // Use setTimeout to ensure the change is detected
      setTimeout(() => {
        region.textContent = text;
      }, 100);
    }
  }

  /**
   * Announce price update with proper formatting
   */
  announcePriceUpdate(oldPrice: number, newPrice: number, currency: string = 'EUR'): void {
    if (!this.config.announcePriceUpdates) return;
    
    const priceText = `Preis aktualisiert von ${oldPrice.toFixed(2)} ${currency} auf ${newPrice.toFixed(2)} ${currency}`;
    this.announce('price-updates', priceText);
  }

  /**
   * Announce form error
   */
  announceFormError(fieldName: string, errorMessage: string): void {
    if (!this.config.announceFormErrors) return;
    
    const errorText = `Fehler in ${fieldName}: ${errorMessage}`;
    this.announce('form-errors', errorText);
  }

  /**
   * Announce navigation change
   */
  announceNavigation(pageName: string): void {
    if (!this.config.announceNavigation) return;
    
    const navText = `Navigiert zu ${pageName}`;
    this.announce('navigation', navText);
  }

  /**
   * Clean up live regions
   */
  destroy(): void {
    this.regions.forEach(region => {
      if (region.parentNode) {
        region.parentNode.removeChild(region);
      }
    });
    this.regions.clear();
  }
}

/**
 * Focus trap implementation for modals and dropdowns
 */
export class FocusTrap {
  private container: HTMLElement;
  private initialFocus?: HTMLElement;
  private returnFocus?: HTMLElement;
  private escapeKey: boolean;
  private focusableElements: HTMLElement[] = [];
  private firstFocusable?: HTMLElement;
  private lastFocusable?: HTMLElement;
  private keydownHandler: (e: KeyboardEvent) => void;

  constructor(options: FocusTrapOptions) {
    this.container = options.container;
    this.initialFocus = options.initialFocus;
    this.returnFocus = options.returnFocus;
    this.escapeKey = options.escapeKey ?? true;
    this.keydownHandler = this.handleKeydown.bind(this);
    
    this.initialize();
  }

  private initialize(): void {
    this.updateFocusableElements();
    this.container.addEventListener('keydown', this.keydownHandler);
    
    // Focus initial element or first focusable element
    const focusTarget = this.initialFocus || this.firstFocusable;
    if (focusTarget) {
      focusTarget.focus();
    }
  }

  private updateFocusableElements(): void {
    const selector = [
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]'
    ].join(', ');

    this.focusableElements = Array.from(
      this.container.querySelectorAll(selector)
    ) as HTMLElement[];

    this.firstFocusable = this.focusableElements[0];
    this.lastFocusable = this.focusableElements[this.focusableElements.length - 1];
  }

  private handleKeydown(e: KeyboardEvent): void {
    if (e.key === 'Tab') {
      this.handleTabKey(e);
    } else if (e.key === 'Escape' && this.escapeKey) {
      this.handleEscapeKey();
    }
  }

  private handleTabKey(e: KeyboardEvent): void {
    if (this.focusableElements.length === 0) {
      e.preventDefault();
      return;
    }

    if (e.shiftKey) {
      // Shift + Tab: move backwards
      if (document.activeElement === this.firstFocusable) {
        e.preventDefault();
        this.lastFocusable?.focus();
      }
    } else {
      // Tab: move forwards
      if (document.activeElement === this.lastFocusable) {
        e.preventDefault();
        this.firstFocusable?.focus();
      }
    }
  }

  private handleEscapeKey(): void {
    // Dispatch custom event for escape key
    const escapeEvent = new CustomEvent('focus-trap-escape', {
      bubbles: true,
      detail: { returnFocus: this.returnFocus }
    });
    this.container.dispatchEvent(escapeEvent);
  }

  /**
   * Update focusable elements (call when content changes)
   */
  update(): void {
    this.updateFocusableElements();
  }

  /**
   * Clean up focus trap
   */
  destroy(): void {
    this.container.removeEventListener('keydown', this.keydownHandler);
    
    // Return focus to original element
    if (this.returnFocus) {
      this.returnFocus.focus();
    }
  }
}

/**
 * Keyboard navigation helper for complex UI components
 */
export class KeyboardNavigation {
  private container: HTMLElement;
  private orientation: 'horizontal' | 'vertical' | 'both';
  private wrap: boolean;
  private keydownHandler: (e: KeyboardEvent) => void;

  constructor(
    container: HTMLElement,
    orientation: 'horizontal' | 'vertical' | 'both' = 'both',
    wrap: boolean = true
  ) {
    this.container = container;
    this.orientation = orientation;
    this.wrap = wrap;
    this.keydownHandler = this.handleKeydown.bind(this);
    
    this.container.addEventListener('keydown', this.keydownHandler);
  }

  private handleKeydown(e: KeyboardEvent): void {
    const currentElement = document.activeElement as HTMLElement;
    if (!this.container.contains(currentElement)) return;

    const focusableElements = this.getFocusableElements();
    const currentIndex = focusableElements.indexOf(currentElement);
    
    if (currentIndex === -1) return;

    let nextIndex = currentIndex;
    const totalElements = focusableElements.length;

    switch (e.key) {
      case 'ArrowRight':
        if (this.orientation === 'horizontal' || this.orientation === 'both') {
          nextIndex = this.wrap ? (currentIndex + 1) % totalElements : Math.min(currentIndex + 1, totalElements - 1);
          e.preventDefault();
        }
        break;
      case 'ArrowLeft':
        if (this.orientation === 'horizontal' || this.orientation === 'both') {
          nextIndex = this.wrap ? (currentIndex - 1 + totalElements) % totalElements : Math.max(currentIndex - 1, 0);
          e.preventDefault();
        }
        break;
      case 'ArrowDown':
        if (this.orientation === 'vertical' || this.orientation === 'both') {
          nextIndex = this.wrap ? (currentIndex + 1) % totalElements : Math.min(currentIndex + 1, totalElements - 1);
          e.preventDefault();
        }
        break;
      case 'ArrowUp':
        if (this.orientation === 'vertical' || this.orientation === 'both') {
          nextIndex = this.wrap ? (currentIndex - 1 + totalElements) % totalElements : Math.max(currentIndex - 1, 0);
          e.preventDefault();
        }
        break;
      case 'Home':
        nextIndex = 0;
        e.preventDefault();
        break;
      case 'End':
        nextIndex = totalElements - 1;
        e.preventDefault();
        break;
    }

    if (nextIndex !== currentIndex && nextIndex >= 0 && nextIndex < totalElements) {
      focusableElements[nextIndex].focus();
    }
  }

  private getFocusableElements(): HTMLElement[] {
    const selector = [
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]'
    ].join(', ');

    return Array.from(
      this.container.querySelectorAll(selector)
    ) as HTMLElement[];
  }

  /**
   * Clean up keyboard navigation
   */
  destroy(): void {
    this.container.removeEventListener('keydown', this.keydownHandler);
  }
}

/**
 * Color contrast utilities
 */
export class ColorContrast {
  /**
   * Calculate relative luminance of a color
   */
  static getLuminance(r: number, g: number, b: number): number {
    const [rs, gs, bs] = [r, g, b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  }

  /**
   * Calculate contrast ratio between two colors
   */
  static getContrastRatio(color1: string, color2: string): number {
    const rgb1 = this.hexToRgb(color1);
    const rgb2 = this.hexToRgb(color2);
    
    if (!rgb1 || !rgb2) return 0;
    
    const lum1 = this.getLuminance(rgb1.r, rgb1.g, rgb1.b);
    const lum2 = this.getLuminance(rgb2.r, rgb2.g, rgb2.b);
    
    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);
    
    return (brightest + 0.05) / (darkest + 0.05);
  }

  /**
   * Check if contrast ratio meets WCAG AA standards
   */
  static meetsWCAGAA(foreground: string, background: string): boolean {
    const ratio = this.getContrastRatio(foreground, background);
    return ratio >= 4.5; // WCAG AA standard for normal text
  }

  /**
   * Check if contrast ratio meets WCAG AAA standards
   */
  static meetsWCAGAAA(foreground: string, background: string): boolean {
    const ratio = this.getContrastRatio(foreground, background);
    return ratio >= 7; // WCAG AAA standard for normal text
  }

  private static hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }
}

/**
 * Screen reader utilities
 */
export class ScreenReaderUtils {
  /**
   * Hide element from screen readers
   */
  static hideFromScreenReader(element: HTMLElement): void {
    element.setAttribute('aria-hidden', 'true');
  }

  /**
   * Show element to screen readers
   */
  static showToScreenReader(element: HTMLElement): void {
    element.removeAttribute('aria-hidden');
  }

  /**
   * Make element focusable for screen readers
   */
  static makeFocusable(element: HTMLElement): void {
    if (!element.hasAttribute('tabindex')) {
      element.setAttribute('tabindex', '0');
    }
  }

  /**
   * Remove element from tab order
   */
  static removeFromTabOrder(element: HTMLElement): void {
    element.setAttribute('tabindex', '-1');
  }

  /**
   * Add descriptive label for screen readers
   */
  static addAriaLabel(element: HTMLElement, label: string): void {
    element.setAttribute('aria-label', label);
  }

  /**
   * Add descriptive label by referencing another element
   */
  static addAriaLabelledBy(element: HTMLElement, labelId: string): void {
    element.setAttribute('aria-labelledby', labelId);
  }

  /**
   * Add description for screen readers
   */
  static addAriaDescribedBy(element: HTMLElement, descriptionId: string): void {
    element.setAttribute('aria-describedby', descriptionId);
  }
}

/**
 * Initialize accessibility features
 */
export function initializeA11y(config: A11yConfig = DEFAULT_A11Y_CONFIG): LiveRegionManager {
  // Detect user preferences
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    config.reducedMotion = true;
  }

  if (window.matchMedia('(prefers-contrast: high)').matches) {
    config.highContrast = true;
  }

  // Apply reduced motion styles
  if (config.reducedMotion) {
    document.documentElement.style.setProperty('--animation-duration', '0.01ms');
    document.documentElement.style.setProperty('--animation-iteration-count', '1');
  }

  // Apply high contrast styles
  if (config.highContrast) {
    document.documentElement.classList.add('high-contrast');
  }

  return new LiveRegionManager(config);
}

/**
 * Utility to check if element is visible to screen readers
 */
export function isVisibleToScreenReader(element: HTMLElement): boolean {
  const style = window.getComputedStyle(element);
  return (
    style.display !== 'none' &&
    style.visibility !== 'hidden' &&
    element.getAttribute('aria-hidden') !== 'true' &&
    !element.classList.contains('sr-only')
  );
}

/**
 * Utility to get accessible name of an element
 */
export function getAccessibleName(element: HTMLElement): string {
  // Check aria-label first
  const ariaLabel = element.getAttribute('aria-label');
  if (ariaLabel) return ariaLabel;

  // Check aria-labelledby
  const labelledBy = element.getAttribute('aria-labelledby');
  if (labelledBy) {
    const labelElement = document.getElementById(labelledBy);
    if (labelElement) return labelElement.textContent || '';
  }

  // Check for associated label
  if (element.id) {
    const label = document.querySelector(`label[for="${element.id}"]`);
    if (label) return label.textContent || '';
  }

  // Check for title attribute
  const title = element.getAttribute('title');
  if (title) return title;

  // Fall back to text content
  return element.textContent || '';
}