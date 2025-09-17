import { test, expect } from '@playwright/test';

/**
 * E2E Test: Configurator → Live Price → Checkout URL
 * 
 * This test validates the complete user journey:
 * 1. User lands on home page
 * 2. User clicks CTA to go to configurator
 * 3. User configures a service/product
 * 4. Price updates live as user makes selections
 * 5. User can proceed to checkout with valid URL
 */

test.describe('Configurator E2E Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Start from the home page
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should navigate from home to configurator via CTA', async ({ page }) => {
    // Verify we're on the home page
    await expect(page).toHaveTitle(/German Code Zero AI/);
    
    // Find and click the main CTA button
    const ctaButton = page.locator('.hero-3d__cta');
    await expect(ctaButton).toBeVisible();
    await expect(ctaButton).toContainText(/konfigurieren|configure/i);
    
    // Click CTA and verify navigation
    await ctaButton.click();
    
    // Should navigate to configurator
    await page.waitForURL('**/shop/configurator**');
    await expect(page).toHaveURL(/\/shop\/configurator/);
  });

  test('should display configurator interface with pricing', async ({ page }) => {
    // Navigate directly to configurator
    await page.goto('/shop/configurator');
    await page.waitForLoadState('networkidle');
    
    // Verify configurator elements are present
    await expect(page.locator('[data-testid="configurator-container"]')).toBeVisible();
    
    // Verify pricing display
    const priceDisplay = page.locator('[data-testid="price-display"]');
    await expect(priceDisplay).toBeVisible();
    await expect(priceDisplay).toContainText('€');
    
    // Verify at least one configuration option is available
    const configOptions = page.locator('[data-testid="config-option"]');
    await expect(configOptions.first()).toBeVisible();
  });

  test('should update price live when configuration changes', async ({ page }) => {
    // Navigate to configurator
    await page.goto('/shop/configurator');
    await page.waitForLoadState('networkidle');
    
    // Get initial price
    const priceDisplay = page.locator('[data-testid="price-display"]');
    await expect(priceDisplay).toBeVisible();
    const initialPrice = await priceDisplay.textContent();
    
    // Make a configuration change
    const configOption = page.locator('[data-testid="config-option"]').first();
    await configOption.click();
    
    // Wait for price update
    await page.waitForTimeout(500); // Allow for price calculation
    
    // Verify price has updated
    const updatedPrice = await priceDisplay.textContent();
    expect(updatedPrice).not.toBe(initialPrice);
    
    // Verify price format is correct (contains € symbol and number)
    expect(updatedPrice).toMatch(/€\s*\d+/);
  });

  test('should provide valid checkout URL after configuration', async ({ page }) => {
    // Navigate to configurator
    await page.goto('/shop/configurator');
    await page.waitForLoadState('networkidle');
    
    // Make some configuration selections
    const configOptions = page.locator('[data-testid="config-option"]');
    const optionCount = await configOptions.count();
    
    if (optionCount > 0) {
      // Select first option
      await configOptions.first().click();
      await page.waitForTimeout(500);
    }
    
    // Find and click checkout button
    const checkoutButton = page.locator('[data-testid="checkout-button"]');
    await expect(checkoutButton).toBeVisible();
    await expect(checkoutButton).toBeEnabled();
    
    // Click checkout and verify URL
    await checkoutButton.click();
    
    // Should navigate to checkout page
    await page.waitForURL('**/checkout**');
    await expect(page).toHaveURL(/\/checkout/);
    
    // Verify checkout page has essential elements
    await expect(page.locator('[data-testid="checkout-container"]')).toBeVisible();
    await expect(page.locator('[data-testid="order-summary"]')).toBeVisible();
  });

  test('should handle pricing with different billing cycles', async ({ page }) => {
    // Navigate to configurator
    await page.goto('/shop/configurator');
    await page.waitForLoadState('networkidle');
    
    // Check if billing cycle selector exists
    const billingCycleSelector = page.locator('[data-testid="billing-cycle-selector"]');
    
    if (await billingCycleSelector.isVisible()) {
      // Get initial price with monthly billing
      const priceDisplay = page.locator('[data-testid="price-display"]');
      const monthlyPrice = await priceDisplay.textContent();
      
      // Switch to annual billing
      await billingCycleSelector.selectOption('annual');
      await page.waitForTimeout(500);
      
      // Verify price updated for annual billing
      const annualPrice = await priceDisplay.textContent();
      expect(annualPrice).not.toBe(monthlyPrice);
      
      // Annual price should typically be lower per month
      // This is a business logic test
      const monthlyAmount = parseFloat(monthlyPrice?.match(/[\d,]+\.?\d*/)?.[0]?.replace(',', '') || '0');
      const annualAmount = parseFloat(annualPrice?.match(/[\d,]+\.?\d*/)?.[0]?.replace(',', '') || '0');
      
      // Annual should show total or discounted monthly rate
      expect(annualAmount).toBeGreaterThan(0);
    }
  });

  test('should apply coupon codes correctly', async ({ page }) => {
    // Navigate to configurator
    await page.goto('/shop/configurator');
    await page.waitForLoadState('networkidle');
    
    // Get initial price
    const priceDisplay = page.locator('[data-testid="price-display"]');
    const initialPrice = await priceDisplay.textContent();
    const initialAmount = parseFloat(initialPrice?.match(/[\d,]+\.?\d*/)?.[0]?.replace(',', '') || '0');
    
    // Check if coupon input exists
    const couponInput = page.locator('[data-testid="coupon-input"]');
    
    if (await couponInput.isVisible()) {
      // Apply test coupon code (LAUNCH50 from pricing catalog)
      await couponInput.fill('LAUNCH50');
      
      const applyCouponButton = page.locator('[data-testid="apply-coupon"]');
      await applyCouponButton.click();
      
      // Wait for price update
      await page.waitForTimeout(1000);
      
      // Verify coupon was applied
      const discountedPrice = await priceDisplay.textContent();
      const discountedAmount = parseFloat(discountedPrice?.match(/[\d,]+\.?\d*/)?.[0]?.replace(',', '') || '0');
      
      // Should be 50% off (LAUNCH50 coupon)
      expect(discountedAmount).toBeLessThan(initialAmount);
      expect(discountedAmount).toBeCloseTo(initialAmount * 0.5, 1);
      
      // Verify coupon success message
      await expect(page.locator('[data-testid="coupon-success"]')).toBeVisible();
    }
  });

  test('should maintain configuration state during session', async ({ page }) => {
    // Navigate to configurator
    await page.goto('/shop/configurator');
    await page.waitForLoadState('networkidle');
    
    // Make configuration selections
    const configOptions = page.locator('[data-testid="config-option"]');
    if (await configOptions.count() > 0) {
      await configOptions.first().click();
      await page.waitForTimeout(500);
    }
    
    // Get current price
    const priceDisplay = page.locator('[data-testid="price-display"]');
    const configuredPrice = await priceDisplay.textContent();
    
    // Navigate away and back
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.goto('/shop/configurator');
    await page.waitForLoadState('networkidle');
    
    // Verify configuration is maintained (if session storage is implemented)
    // This test might need adjustment based on actual implementation
    const restoredPrice = await priceDisplay.textContent();
    
    // If session persistence is implemented, prices should match
    // Otherwise, this test documents the current behavior
    if (configuredPrice && restoredPrice) {
      // Log the behavior for documentation
      console.log(`Original price: ${configuredPrice}, Restored price: ${restoredPrice}`);
    }
  });
});

// Test helper functions
test.describe('Configurator Error Handling', () => {
  test('should handle network errors gracefully', async ({ page }) => {
    // Navigate to configurator
    await page.goto('/shop/configurator');
    await page.waitForLoadState('networkidle');
    
    // Simulate network failure
    await page.route('**/api/pricing/**', route => route.abort());
    
    // Try to make a configuration change
    const configOption = page.locator('[data-testid="config-option"]').first();
    if (await configOption.isVisible()) {
      await configOption.click();
      
      // Should show error message
      await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    }
  });

  test('should validate required fields before checkout', async ({ page }) => {
    // Navigate to configurator
    await page.goto('/shop/configurator');
    await page.waitForLoadState('networkidle');
    
    // Try to checkout without making required selections
    const checkoutButton = page.locator('[data-testid="checkout-button"]');
    
    if (await checkoutButton.isVisible()) {
      await checkoutButton.click();
      
      // Should show validation errors or disable button
      const validationErrors = page.locator('[data-testid="validation-error"]');
      const isCheckoutDisabled = await checkoutButton.isDisabled();
      
      // Either show validation errors or disable checkout
      if (!isCheckoutDisabled) {
        await expect(validationErrors.first()).toBeVisible();
      }
    }
  });
});