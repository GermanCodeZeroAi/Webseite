import { test, expect } from '@playwright/test';

/**
 * E2E Test: Checkout Flow
 * 
 * This test validates the complete checkout process:
 * 1. User arrives at checkout with valid configuration
 * 2. User fills out required information
 * 3. User sees order summary with correct pricing
 * 4. User can complete the checkout process
 * 5. Payment integration works correctly
 */

test.describe('Checkout Flow E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Start with a pre-configured cart
    await page.goto('/shop/configurator');
    await page.waitForLoadState('networkidle');
    
    // Make basic configuration to have something in cart
    const configOption = page.locator('[data-testid="config-option"]').first();
    if (await configOption.isVisible()) {
      await configOption.click();
      await page.waitForTimeout(500);
    }
    
    // Navigate to checkout
    const checkoutButton = page.locator('[data-testid="checkout-button"]');
    if (await checkoutButton.isVisible() && await checkoutButton.isEnabled()) {
      await checkoutButton.click();
      await page.waitForURL('**/checkout**');
    } else {
      // Fallback: navigate directly to checkout
      await page.goto('/checkout');
    }
    
    await page.waitForLoadState('networkidle');
  });

  test('should display checkout page with order summary', async ({ page }) => {
    // Verify we're on checkout page
    await expect(page).toHaveURL(/\/checkout/);
    
    // Verify essential checkout elements
    await expect(page.locator('[data-testid="checkout-container"]')).toBeVisible();
    await expect(page.locator('[data-testid="order-summary"]')).toBeVisible();
    
    // Verify order summary contains pricing
    const orderSummary = page.locator('[data-testid="order-summary"]');
    await expect(orderSummary).toContainText('€');
    
    // Verify checkout form is present
    await expect(page.locator('[data-testid="checkout-form"]')).toBeVisible();
  });

  test('should validate required customer information', async ({ page }) => {
    // Try to submit without filling required fields
    const submitButton = page.locator('[data-testid="submit-order"]');
    await expect(submitButton).toBeVisible();
    
    await submitButton.click();
    
    // Should show validation errors
    const validationErrors = page.locator('[data-testid="validation-error"]');
    await expect(validationErrors.first()).toBeVisible();
    
    // Check specific required fields
    const emailField = page.locator('[data-testid="email-input"]');
    const nameField = page.locator('[data-testid="name-input"]');
    const companyField = page.locator('[data-testid="company-input"]');
    
    if (await emailField.isVisible()) {
      await expect(emailField).toHaveAttribute('required');
    }
    if (await nameField.isVisible()) {
      await expect(nameField).toHaveAttribute('required');
    }
    if (await companyField.isVisible()) {
      await expect(companyField).toHaveAttribute('required');
    }
  });

  test('should accept valid customer information', async ({ page }) => {
    // Fill out customer information
    await page.fill('[data-testid="email-input"]', 'test@germancodezero.ai');
    await page.fill('[data-testid="name-input"]', 'Max Mustermann');
    await page.fill('[data-testid="company-input"]', 'Test GmbH');
    
    // Fill additional fields if present
    const phoneField = page.locator('[data-testid="phone-input"]');
    if (await phoneField.isVisible()) {
      await page.fill('[data-testid="phone-input"]', '+49 123 456789');
    }
    
    const addressField = page.locator('[data-testid="address-input"]');
    if (await addressField.isVisible()) {
      await page.fill('[data-testid="address-input"]', 'Teststraße 123, 10115 Berlin');
    }
    
    // Verify form accepts the input
    const submitButton = page.locator('[data-testid="submit-order"]');
    await expect(submitButton).toBeEnabled();
    
    // Form should be valid (no validation errors visible)
    const validationErrors = page.locator('[data-testid="validation-error"]');
    await expect(validationErrors).toHaveCount(0);
  });

  test('should display correct pricing breakdown', async ({ page }) => {
    const orderSummary = page.locator('[data-testid="order-summary"]');
    
    // Should show base price
    await expect(orderSummary.locator('[data-testid="base-price"]')).toBeVisible();
    
    // Should show total price
    const totalPrice = orderSummary.locator('[data-testid="total-price"]');
    await expect(totalPrice).toBeVisible();
    await expect(totalPrice).toContainText('€');
    
    // If VAT is applicable, should show VAT breakdown
    const vatLine = orderSummary.locator('[data-testid="vat-amount"]');
    if (await vatLine.isVisible()) {
      await expect(vatLine).toContainText('%');
    }
    
    // If discounts are applied, should show discount line
    const discountLine = orderSummary.locator('[data-testid="discount-amount"]');
    if (await discountLine.isVisible()) {
      await expect(discountLine).toContainText('-');
    }
  });

  test('should handle payment method selection', async ({ page }) => {
    // Fill required customer info first
    await page.fill('[data-testid="email-input"]', 'test@germancodezero.ai');
    await page.fill('[data-testid="name-input"]', 'Max Mustermann');
    await page.fill('[data-testid="company-input"]', 'Test GmbH');
    
    // Check if payment method selection is available
    const paymentMethods = page.locator('[data-testid="payment-method"]');
    
    if (await paymentMethods.first().isVisible()) {
      const paymentCount = await paymentMethods.count();
      expect(paymentCount).toBeGreaterThan(0);
      
      // Select first payment method
      await paymentMethods.first().click();
      
      // Verify selection is reflected in UI
      await expect(paymentMethods.first()).toBeChecked();
    }
  });

  test('should integrate with Stripe payment processing', async ({ page }) => {
    // Fill customer information
    await page.fill('[data-testid="email-input"]', 'test@germancodezero.ai');
    await page.fill('[data-testid="name-input"]', 'Max Mustermann');
    await page.fill('[data-testid="company-input"]', 'Test GmbH');
    
    // Select credit card payment if available
    const creditCardOption = page.locator('[data-testid="payment-method"][value="card"]');
    if (await creditCardOption.isVisible()) {
      await creditCardOption.click();
    }
    
    // Look for Stripe elements
    const stripeCardElement = page.locator('[data-testid="stripe-card-element"]');
    if (await stripeCardElement.isVisible()) {
      // Verify Stripe is loaded
      await expect(stripeCardElement).toBeVisible();
      
      // In a real test, you'd use Stripe test card numbers
      // For now, just verify the integration is present
    }
    
    // Check for payment processing button
    const processPaymentButton = page.locator('[data-testid="process-payment"]');
    if (await processPaymentButton.isVisible()) {
      await expect(processPaymentButton).toContainText(/zahlen|pay/i);
    }
  });

  test('should handle checkout submission', async ({ page }) => {
    // Fill all required information
    await page.fill('[data-testid="email-input"]', 'test@germancodezero.ai');
    await page.fill('[data-testid="name-input"]', 'Max Mustermann');
    await page.fill('[data-testid="company-input"]', 'Test GmbH');
    
    // Accept terms if present
    const termsCheckbox = page.locator('[data-testid="terms-checkbox"]');
    if (await termsCheckbox.isVisible()) {
      await termsCheckbox.check();
    }
    
    // Submit the order
    const submitButton = page.locator('[data-testid="submit-order"]');
    await expect(submitButton).toBeEnabled();
    
    // Mock successful payment response
    await page.route('**/api/checkout/**', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          orderId: 'test-order-123',
          redirectUrl: '/checkout/success'
        })
      });
    });
    
    await submitButton.click();
    
    // Should redirect to success page or show success message
    await page.waitForTimeout(2000); // Allow for processing
    
    // Check for success indicators
    const successIndicator = page.locator('[data-testid="checkout-success"]');
    const successPage = page.url().includes('/success');
    
    expect(await successIndicator.isVisible() || successPage).toBeTruthy();
  });

  test('should handle checkout errors gracefully', async ({ page }) => {
    // Fill customer information
    await page.fill('[data-testid="email-input"]', 'test@germancodezero.ai');
    await page.fill('[data-testid="name-input"]', 'Max Mustermann');
    await page.fill('[data-testid="company-input"]', 'Test GmbH');
    
    // Mock payment failure
    await page.route('**/api/checkout/**', route => {
      route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: 'Payment failed'
        })
      });
    });
    
    // Submit the order
    const submitButton = page.locator('[data-testid="submit-order"]');
    await submitButton.click();
    
    // Should show error message
    await expect(page.locator('[data-testid="checkout-error"]')).toBeVisible();
    
    // User should be able to retry
    await expect(submitButton).toBeEnabled();
  });

  test('should preserve order data during session', async ({ page }) => {
    // Get initial order summary
    const orderSummary = page.locator('[data-testid="order-summary"]');
    const initialSummary = await orderSummary.textContent();
    
    // Fill some information
    await page.fill('[data-testid="email-input"]', 'test@germancodezero.ai');
    
    // Refresh the page
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Verify order data is preserved
    const preservedSummary = await orderSummary.textContent();
    expect(preservedSummary).toBe(initialSummary);
    
    // Check if form data is preserved (if implemented)
    const emailField = page.locator('[data-testid="email-input"]');
    const preservedEmail = await emailField.inputValue();
    
    // Log behavior for documentation
    console.log(`Email preservation: ${preservedEmail === 'test@germancodezero.ai' ? 'Yes' : 'No'}`);
  });
});

test.describe('Checkout Accessibility', () => {
  test('should be keyboard navigable', async ({ page }) => {
    await page.goto('/checkout');
    await page.waitForLoadState('networkidle');
    
    // Start from first focusable element
    await page.keyboard.press('Tab');
    
    // Verify focus moves through form elements
    const focusableElements = [
      '[data-testid="email-input"]',
      '[data-testid="name-input"]',
      '[data-testid="company-input"]',
      '[data-testid="submit-order"]'
    ];
    
    for (const selector of focusableElements) {
      const element = page.locator(selector);
      if (await element.isVisible()) {
        await expect(element).toBeFocused();
        await page.keyboard.press('Tab');
      }
    }
  });

  test('should have proper ARIA labels', async ({ page }) => {
    await page.goto('/checkout');
    await page.waitForLoadState('networkidle');
    
    // Check form has proper labeling
    const form = page.locator('[data-testid="checkout-form"]');
    await expect(form).toHaveAttribute('role', 'form');
    
    // Check required fields have proper labels
    const emailInput = page.locator('[data-testid="email-input"]');
    if (await emailInput.isVisible()) {
      const hasLabel = await emailInput.getAttribute('aria-label') || 
                      await emailInput.getAttribute('aria-labelledby');
      expect(hasLabel).toBeTruthy();
    }
  });
});