import { test, expect } from '@playwright/test';

/**
 * Visual Regression Test: Pricing States
 * 
 * This test captures and compares visual snapshots of different pricing states:
 * 1. Default pricing display
 * 2. Pricing with different billing cycles (monthly, annual)
 * 3. Pricing with applied discounts/coupons
 * 4. Pricing breakdown in checkout
 * 5. Mobile vs desktop pricing layouts
 * 6. Different product configurations
 * 
 * @visual tag for filtering visual tests
 */

test.describe('Visual Regression - Pricing States @visual', () => {
  test.beforeEach(async ({ page }) => {
    // Disable animations for consistent screenshots
    await page.addInitScript(() => {
      document.addEventListener('DOMContentLoaded', () => {
        const style = document.createElement('style');
        style.textContent = `
          *, *::before, *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
            scroll-behavior: auto !important;
          }
        `;
        document.head.appendChild(style);
      });
    });
  });

  test('should capture default pricing display on configurator', async ({ page }) => {
    // Navigate to configurator
    await page.goto('/shop/configurator');
    await page.waitForLoadState('networkidle');
    
    // Wait for pricing to load
    await page.waitForSelector('[data-testid="price-display"]', { timeout: 10000 });
    
    // Take full page screenshot
    await expect(page).toHaveScreenshot('pricing-default-full-page.png', {
      fullPage: true,
      animations: 'disabled'
    });
    
    // Take screenshot of just the pricing component
    const pricingSection = page.locator('[data-testid="pricing-section"]');
    if (await pricingSection.isVisible()) {
      await expect(pricingSection).toHaveScreenshot('pricing-default-component.png', {
        animations: 'disabled'
      });
    }
  });

  test('should capture pricing with monthly billing cycle', async ({ page }) => {
    await page.goto('/shop/configurator');
    await page.waitForLoadState('networkidle');
    
    // Select monthly billing if available
    const billingCycleSelector = page.locator('[data-testid="billing-cycle-selector"]');
    if (await billingCycleSelector.isVisible()) {
      await billingCycleSelector.selectOption('monthly');
      await page.waitForTimeout(1000); // Allow for price update
      
      // Capture pricing with monthly billing
      const pricingSection = page.locator('[data-testid="pricing-section"]');
      await expect(pricingSection).toHaveScreenshot('pricing-monthly-billing.png', {
        animations: 'disabled'
      });
    }
  });

  test('should capture pricing with annual billing cycle', async ({ page }) => {
    await page.goto('/shop/configurator');
    await page.waitForLoadState('networkidle');
    
    // Select annual billing if available
    const billingCycleSelector = page.locator('[data-testid="billing-cycle-selector"]');
    if (await billingCycleSelector.isVisible()) {
      await billingCycleSelector.selectOption('annual');
      await page.waitForTimeout(1000); // Allow for price update
      
      // Capture pricing with annual billing
      const pricingSection = page.locator('[data-testid="pricing-section"]');
      await expect(pricingSection).toHaveScreenshot('pricing-annual-billing.png', {
        animations: 'disabled'
      });
    }
  });

  test('should capture pricing with applied coupon', async ({ page }) => {
    await page.goto('/shop/configurator');
    await page.waitForLoadState('networkidle');
    
    // Apply coupon if coupon input is available
    const couponInput = page.locator('[data-testid="coupon-input"]');
    if (await couponInput.isVisible()) {
      await couponInput.fill('LAUNCH50');
      
      const applyCouponButton = page.locator('[data-testid="apply-coupon"]');
      await applyCouponButton.click();
      
      // Wait for coupon to be applied
      await page.waitForTimeout(1000);
      
      // Capture pricing with coupon applied
      const pricingSection = page.locator('[data-testid="pricing-section"]');
      await expect(pricingSection).toHaveScreenshot('pricing-with-coupon.png', {
        animations: 'disabled'
      });
      
      // Also capture success message
      const couponSuccess = page.locator('[data-testid="coupon-success"]');
      if (await couponSuccess.isVisible()) {
        await expect(couponSuccess).toHaveScreenshot('coupon-success-message.png', {
          animations: 'disabled'
        });
      }
    }
  });

  test('should capture pricing breakdown in checkout', async ({ page }) => {
    // Navigate to checkout (assuming some configuration exists)
    await page.goto('/checkout');
    await page.waitForLoadState('networkidle');
    
    // Wait for order summary to load
    const orderSummary = page.locator('[data-testid="order-summary"]');
    if (await orderSummary.isVisible()) {
      await expect(orderSummary).toHaveScreenshot('checkout-order-summary.png', {
        animations: 'disabled'
      });
      
      // Capture full checkout page
      await expect(page).toHaveScreenshot('checkout-full-page.png', {
        fullPage: true,
        animations: 'disabled'
      });
    }
  });

  test('should capture different product configuration pricing', async ({ page }) => {
    await page.goto('/shop/configurator');
    await page.waitForLoadState('networkidle');
    
    // Capture base configuration
    const pricingSection = page.locator('[data-testid="pricing-section"]');
    await expect(pricingSection).toHaveScreenshot('pricing-base-config.png', {
      animations: 'disabled'
    });
    
    // Make configuration changes and capture each state
    const configOptions = page.locator('[data-testid="config-option"]');
    const optionCount = await configOptions.count();
    
    for (let i = 0; i < Math.min(optionCount, 3); i++) { // Limit to 3 configurations
      await configOptions.nth(i).click();
      await page.waitForTimeout(500); // Allow for price update
      
      await expect(pricingSection).toHaveScreenshot(`pricing-config-option-${i + 1}.png`, {
        animations: 'disabled'
      });
    }
  });

  test('should capture pricing states on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 812 }); // iPhone X dimensions
    
    await page.goto('/shop/configurator');
    await page.waitForLoadState('networkidle');
    
    // Capture mobile pricing layout
    await expect(page).toHaveScreenshot('pricing-mobile-full-page.png', {
      fullPage: true,
      animations: 'disabled'
    });
    
    // Capture mobile pricing component
    const pricingSection = page.locator('[data-testid="pricing-section"]');
    if (await pricingSection.isVisible()) {
      await expect(pricingSection).toHaveScreenshot('pricing-mobile-component.png', {
        animations: 'disabled'
      });
    }
    
    // Test mobile checkout pricing
    await page.goto('/checkout');
    await page.waitForLoadState('networkidle');
    
    const orderSummary = page.locator('[data-testid="order-summary"]');
    if (await orderSummary.isVisible()) {
      await expect(orderSummary).toHaveScreenshot('checkout-mobile-order-summary.png', {
        animations: 'disabled'
      });
    }
  });

  test('should capture pricing states on tablet viewport', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 }); // iPad dimensions
    
    await page.goto('/shop/configurator');
    await page.waitForLoadState('networkidle');
    
    // Capture tablet pricing layout
    await expect(page).toHaveScreenshot('pricing-tablet-full-page.png', {
      fullPage: true,
      animations: 'disabled'
    });
    
    const pricingSection = page.locator('[data-testid="pricing-section"]');
    if (await pricingSection.isVisible()) {
      await expect(pricingSection).toHaveScreenshot('pricing-tablet-component.png', {
        animations: 'disabled'
      });
    }
  });

  test('should capture pricing error states', async ({ page }) => {
    await page.goto('/shop/configurator');
    await page.waitForLoadState('networkidle');
    
    // Mock pricing API error
    await page.route('**/api/pricing/**', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Pricing service unavailable' })
      });
    });
    
    // Trigger a pricing update to cause error
    const configOption = page.locator('[data-testid="config-option"]').first();
    if (await configOption.isVisible()) {
      await configOption.click();
      await page.waitForTimeout(1000);
      
      // Capture error state
      const errorMessage = page.locator('[data-testid="pricing-error"]');
      if (await errorMessage.isVisible()) {
        await expect(errorMessage).toHaveScreenshot('pricing-error-state.png', {
          animations: 'disabled'
        });
      }
    }
  });

  test('should capture pricing loading states', async ({ page }) => {
    await page.goto('/shop/configurator');
    
    // Mock slow pricing API
    await page.route('**/api/pricing/**', async route => {
      await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ price: 999.99, currency: 'EUR' })
      });
    });
    
    await page.waitForLoadState('networkidle');
    
    // Trigger pricing update and capture loading state
    const configOption = page.locator('[data-testid="config-option"]').first();
    if (await configOption.isVisible()) {
      await configOption.click();
      
      // Capture loading state quickly
      const loadingIndicator = page.locator('[data-testid="pricing-loading"]');
      if (await loadingIndicator.isVisible()) {
        await expect(loadingIndicator).toHaveScreenshot('pricing-loading-state.png', {
          animations: 'disabled'
        });
      }
    }
  });

  test('should capture pricing comparison states', async ({ page }) => {
    await page.goto('/shop/configurator');
    await page.waitForLoadState('networkidle');
    
    // Check if pricing comparison is available
    const comparisonToggle = page.locator('[data-testid="pricing-comparison-toggle"]');
    if (await comparisonToggle.isVisible()) {
      // Capture with comparison off
      const pricingSection = page.locator('[data-testid="pricing-section"]');
      await expect(pricingSection).toHaveScreenshot('pricing-comparison-off.png', {
        animations: 'disabled'
      });
      
      // Enable comparison
      await comparisonToggle.click();
      await page.waitForTimeout(500);
      
      // Capture with comparison on
      await expect(pricingSection).toHaveScreenshot('pricing-comparison-on.png', {
        animations: 'disabled'
      });
    }
  });

  test('should capture pricing with VAT breakdown', async ({ page }) => {
    await page.goto('/shop/configurator');
    await page.waitForLoadState('networkidle');
    
    // Look for VAT toggle or automatic VAT display
    const vatToggle = page.locator('[data-testid="vat-toggle"]');
    const vatBreakdown = page.locator('[data-testid="vat-breakdown"]');
    
    if (await vatToggle.isVisible()) {
      // Toggle VAT display
      await vatToggle.click();
      await page.waitForTimeout(500);
    }
    
    if (await vatBreakdown.isVisible()) {
      await expect(vatBreakdown).toHaveScreenshot('pricing-vat-breakdown.png', {
        animations: 'disabled'
      });
    }
    
    // Capture full pricing with VAT
    const pricingSection = page.locator('[data-testid="pricing-section"]');
    await expect(pricingSection).toHaveScreenshot('pricing-with-vat.png', {
      animations: 'disabled'
    });
  });

  test('should capture pricing in different languages', async ({ page }) => {
    // Test German pricing
    await page.goto('/de/shop/configurator');
    await page.waitForLoadState('networkidle');
    
    const pricingSection = page.locator('[data-testid="pricing-section"]');
    if (await pricingSection.isVisible()) {
      await expect(pricingSection).toHaveScreenshot('pricing-german.png', {
        animations: 'disabled'
      });
    }
    
    // Test English pricing
    await page.goto('/en/shop/configurator');
    await page.waitForLoadState('networkidle');
    
    if (await pricingSection.isVisible()) {
      await expect(pricingSection).toHaveScreenshot('pricing-english.png', {
        animations: 'disabled'
      });
    }
  });

  test('should capture pricing in dark mode', async ({ page }) => {
    // Enable dark mode
    await page.emulateMedia({ colorScheme: 'dark' });
    
    await page.goto('/shop/configurator');
    await page.waitForLoadState('networkidle');
    
    // Capture dark mode pricing
    await expect(page).toHaveScreenshot('pricing-dark-mode-full-page.png', {
      fullPage: true,
      animations: 'disabled'
    });
    
    const pricingSection = page.locator('[data-testid="pricing-section"]');
    if (await pricingSection.isVisible()) {
      await expect(pricingSection).toHaveScreenshot('pricing-dark-mode-component.png', {
        animations: 'disabled'
      });
    }
  });
});

// Test helper for consistent screenshot configuration
test.describe('Visual Test Configuration', () => {
  test('should validate screenshot configuration', async ({ page }) => {
    await page.goto('/shop/configurator');
    await page.waitForLoadState('networkidle');
    
    // This test ensures our screenshot configuration is working
    // and provides a baseline for visual regression testing
    await expect(page).toHaveScreenshot('visual-test-baseline.png', {
      fullPage: true,
      animations: 'disabled',
      threshold: 0.2, // Allow for minor rendering differences
      maxDiffPixels: 1000
    });
  });
});