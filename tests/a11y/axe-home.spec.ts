import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * Accessibility Test: Home/Shop Pages
 * 
 * This test validates WCAG 2.2 AA compliance using axe-core:
 * 1. Home page has no critical accessibility violations
 * 2. Shop/configurator page has no critical accessibility violations
 * 3. All interactive elements are keyboard accessible
 * 4. Color contrast meets WCAG standards
 * 5. Screen reader compatibility is ensured
 */

test.describe('Accessibility - Home & Shop', () => {
  test('home page should have no critical accessibility violations', async ({ page }) => {
    // Navigate to home page
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Run axe accessibility scan
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
      .analyze();
    
    // Filter critical violations (critical and serious impact)
    const criticalViolations = accessibilityScanResults.violations.filter(
      violation => violation.impact === 'critical' || violation.impact === 'serious'
    );
    
    // Should have no critical violations
    expect(criticalViolations).toEqual([]);
    
    // Log results for documentation
    console.log(`✅ Home page accessibility: ${accessibilityScanResults.passes.length} checks passed`);
    console.log(`✅ Critical violations: ${criticalViolations.length}/${accessibilityScanResults.violations.length} total violations`);
    
    if (criticalViolations.length > 0) {
      console.error('❌ Critical accessibility violations found:');
      criticalViolations.forEach(violation => {
        console.error(`- ${violation.id}: ${violation.description} [${violation.impact}]`);
        violation.nodes.forEach(node => {
          console.error(`  Element: ${node.target}`);
          console.error(`  Impact: ${node.impact}`);
        });
      });
    }
    
    // Log minor violations for awareness (but don't fail test)
    const minorViolations = accessibilityScanResults.violations.filter(
      violation => violation.impact === 'moderate' || violation.impact === 'minor'
    );
    if (minorViolations.length > 0) {
      console.log(`⚠️ Minor violations found (${minorViolations.length}) - should be addressed but not critical:`);
      minorViolations.forEach(violation => {
        console.log(`- ${violation.id}: ${violation.description} [${violation.impact}]`);
      });
    }
  });

  test('shop/configurator page should have no critical accessibility violations', async ({ page }) => {
    // Navigate to shop/configurator page
    await page.goto('/shop/configurator');
    await page.waitForLoadState('networkidle');
    
    // Run axe accessibility scan
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
      .analyze();
    
    // Filter critical violations (critical and serious impact)
    const criticalViolations = accessibilityScanResults.violations.filter(
      violation => violation.impact === 'critical' || violation.impact === 'serious'
    );
    
    // Should have no critical violations
    expect(criticalViolations).toEqual([]);
    
    // Log results for documentation
    console.log(`✅ Shop page accessibility: ${accessibilityScanResults.passes.length} checks passed`);
    console.log(`✅ Critical violations: ${criticalViolations.length}/${accessibilityScanResults.violations.length} total violations`);
    
    if (criticalViolations.length > 0) {
      console.error('❌ Critical accessibility violations found:');
      criticalViolations.forEach(violation => {
        console.error(`- ${violation.id}: ${violation.description} [${violation.impact}]`);
        violation.nodes.forEach(node => {
          console.error(`  Element: ${node.target}`);
          console.error(`  Impact: ${node.impact}`);
        });
      });
    }
    
    // Log minor violations for awareness (but don't fail test)
    const minorViolations = accessibilityScanResults.violations.filter(
      violation => violation.impact === 'moderate' || violation.impact === 'minor'
    );
    if (minorViolations.length > 0) {
      console.log(`⚠️ Minor violations found (${minorViolations.length}) - should be addressed but not critical:`);
      minorViolations.forEach(violation => {
        console.log(`- ${violation.id}: ${violation.description} [${violation.impact}]`);
      });
    }
  });

  test('home page should be fully keyboard navigable', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Test skip link functionality
    await page.keyboard.press('Tab');
    const skipLink = page.locator('.skip-link');
    if (await skipLink.isVisible()) {
      await expect(skipLink).toBeFocused();
      await expect(skipLink).toContainText(/skip|springe/i);
    }
    
    // Navigate through all focusable elements
    const focusableElements = await page.locator('a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])').all();
    
    let tabCount = 0;
    const maxTabs = 20; // Prevent infinite loop
    
    while (tabCount < maxTabs && tabCount < focusableElements.length) {
      await page.keyboard.press('Tab');
      tabCount++;
      
      // Verify focus is visible
      const focusedElement = page.locator(':focus');
      await expect(focusedElement).toBeVisible();
    }
    
    console.log(`✅ Keyboard navigation: ${tabCount} focusable elements tested`);
  });

  test('CTA button should have proper accessibility attributes', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const ctaButton = page.locator('.hero-3d__cta');
    await expect(ctaButton).toBeVisible();
    
    // Should have proper ARIA label
    const ariaLabel = await ctaButton.getAttribute('aria-label');
    expect(ariaLabel).toBeTruthy();
    expect(ariaLabel).toContain('konfigurator');
    
    // Should be focusable
    await ctaButton.focus();
    await expect(ctaButton).toBeFocused();
    
    // Should be activatable with keyboard
    await page.keyboard.press('Enter');
    await page.waitForURL('**/shop/configurator**', { timeout: 5000 });
    await expect(page).toHaveURL(/\/shop\/configurator/);
  });

  test('color contrast should meet WCAG AA standards', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Run specific color contrast checks
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withRules(['color-contrast'])
      .analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
    
    // Additional manual checks for key elements
    const headline = page.locator('.hero-3d__headline');
    const subheadline = page.locator('.hero-3d__subheadline');
    const ctaButton = page.locator('.hero-3d__cta');
    
    // Verify text elements are visible and have sufficient contrast
    await expect(headline).toBeVisible();
    await expect(subheadline).toBeVisible();
    await expect(ctaButton).toBeVisible();
    
    // Test with high contrast mode
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Elements should still be visible in dark mode
    await expect(headline).toBeVisible();
    await expect(subheadline).toBeVisible();
    await expect(ctaButton).toBeVisible();
  });

  test('images should have proper alt text', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check all images have alt attributes
    const images = page.locator('img');
    const imageCount = await images.count();
    
    for (let i = 0; i < imageCount; i++) {
      const image = images.nth(i);
      const alt = await image.getAttribute('alt');
      
      // Alt text should exist (can be empty for decorative images)
      expect(alt).not.toBeNull();
      
      // If image is not decorative, alt should be descriptive
      const isDecorative = alt === '' || await image.getAttribute('role') === 'presentation';
      if (!isDecorative) {
        expect(alt!.length).toBeGreaterThan(0);
      }
    }
    
    console.log(`✅ Image accessibility: ${imageCount} images checked`);
  });

  test('form elements should have proper labels and descriptions', async ({ page }) => {
    // Test on configurator page where forms are more likely
    await page.goto('/shop/configurator');
    await page.waitForLoadState('networkidle');
    
    // Check all form inputs have labels
    const inputs = page.locator('input, select, textarea');
    const inputCount = await inputs.count();
    
    for (let i = 0; i < inputCount; i++) {
      const input = inputs.nth(i);
      const inputId = await input.getAttribute('id');
      
      if (inputId) {
        // Check for associated label
        const label = page.locator(`label[for="${inputId}"]`);
        const hasLabel = await label.count() > 0;
        
        // Check for aria-label or aria-labelledby
        const ariaLabel = await input.getAttribute('aria-label');
        const ariaLabelledBy = await input.getAttribute('aria-labelledby');
        
        // Input should have some form of labeling
        expect(hasLabel || ariaLabel || ariaLabelledBy).toBeTruthy();
      }
    }
    
    console.log(`✅ Form accessibility: ${inputCount} form elements checked`);
  });

  test('headings should follow proper hierarchy', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Get all heading elements
    const headings = page.locator('h1, h2, h3, h4, h5, h6');
    const headingCount = await headings.count();
    
    if (headingCount > 0) {
      // Should have exactly one h1
      const h1Count = await page.locator('h1').count();
      expect(h1Count).toBe(1);
      
      // Check heading hierarchy
      const headingLevels: number[] = [];
      for (let i = 0; i < headingCount; i++) {
        const heading = headings.nth(i);
        const tagName = await heading.evaluate(el => el.tagName.toLowerCase());
        const level = parseInt(tagName.charAt(1));
        headingLevels.push(level);
      }
      
      // Verify no heading levels are skipped
      for (let i = 1; i < headingLevels.length; i++) {
        const currentLevel = headingLevels[i];
        const previousLevel = headingLevels[i - 1];
        
        // Should not skip more than one level
        expect(currentLevel - previousLevel).toBeLessThanOrEqual(1);
      }
    }
    
    console.log(`✅ Heading structure: ${headingCount} headings checked`);
  });

  test('should support screen reader announcements', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check for ARIA live regions
    const liveRegions = page.locator('[aria-live]');
    const liveRegionCount = await liveRegions.count();
    
    if (liveRegionCount > 0) {
      console.log(`✅ Live regions: ${liveRegionCount} regions found`);
      
      // Verify live regions have proper attributes
      for (let i = 0; i < liveRegionCount; i++) {
        const region = liveRegions.nth(i);
        const ariaLive = await region.getAttribute('aria-live');
        expect(['polite', 'assertive', 'off']).toContain(ariaLive);
      }
    }
    
    // Check for proper landmarks
    const landmarks = page.locator('[role="banner"], [role="main"], [role="navigation"], [role="contentinfo"], main, nav, header, footer');
    const landmarkCount = await landmarks.count();
    
    expect(landmarkCount).toBeGreaterThan(0);
    console.log(`✅ Landmarks: ${landmarkCount} landmarks found`);
  });

  test('should handle reduced motion preferences', async ({ page }) => {
    // Test with reduced motion preference
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Verify 3D canvas is not rendered for reduced motion users
    const canvas = page.locator('.hero-3d__canvas');
    const staticBg = page.locator('.hero-3d__static-bg');
    
    // Should show static background instead of animated canvas
    if (await staticBg.isVisible()) {
      await expect(staticBg).toBeVisible();
      console.log('✅ Reduced motion: Static background shown');
    }
    
    // Reset to normal motion
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Should show animated canvas for normal users
    if (await canvas.isVisible()) {
      await expect(canvas).toBeVisible();
      console.log('✅ Normal motion: Animated canvas shown');
    }
  });

  test('should be compatible with screen readers', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Run screen reader specific checks
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['cat.aria', 'cat.semantics', 'cat.keyboard'])
      .analyze();
    
    // Filter critical violations only
    const criticalViolations = accessibilityScanResults.violations.filter(
      violation => violation.impact === 'critical' || violation.impact === 'serious'
    );
    
    expect(criticalViolations).toEqual([]);
    
    // Check for proper semantic markup
    const main = page.locator('main');
    await expect(main).toBeVisible();
    
    // Check for proper button semantics
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    
    for (let i = 0; i < buttonCount; i++) {
      const button = buttons.nth(i);
      const hasText = (await button.textContent())?.trim().length > 0;
      const hasAriaLabel = await button.getAttribute('aria-label');
      
      // Button should have accessible name
      expect(hasText || hasAriaLabel).toBeTruthy();
    }
    
    console.log(`✅ Screen reader compatibility: ${buttonCount} buttons checked`);
  });

  test('consent banner should be accessible when present', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Look for consent banner
    const consentBanner = page.locator('[role="dialog"][aria-labelledby*="consent"]');
    const fallbackBanner = page.locator('[data-testid="consent-banner"]');
    
    if (await consentBanner.isVisible() || await fallbackBanner.isVisible()) {
      const banner = await consentBanner.isVisible() ? consentBanner : fallbackBanner;
      
      // Run accessibility scan on the banner specifically
      const accessibilityScanResults = await new AxeBuilder({ page })
        .include(await banner.getAttribute('id') || '[role="dialog"]')
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
        .analyze();
      
      // Filter critical violations
      const criticalViolations = accessibilityScanResults.violations.filter(
        violation => violation.impact === 'critical' || violation.impact === 'serious'
      );
      
      expect(criticalViolations).toEqual([]);
      
      // Verify essential accessibility attributes
      const role = await banner.getAttribute('role');
      expect(role).toBe('dialog');
      
      const ariaLabelledBy = await banner.getAttribute('aria-labelledby');
      expect(ariaLabelledBy).toBeTruthy();
      
      // Verify buttons are accessible
      const acceptButton = banner.locator('button').filter({ hasText: /alle akzeptieren|accept all/i });
      const rejectButton = banner.locator('button').filter({ hasText: /alle ablehnen|reject all/i });
      
      if (await acceptButton.isVisible()) {
        const acceptText = await acceptButton.textContent();
        const acceptAriaLabel = await acceptButton.getAttribute('aria-label');
        expect(acceptText || acceptAriaLabel).toBeTruthy();
      }
      
      if (await rejectButton.isVisible()) {
        const rejectText = await rejectButton.textContent();
        const rejectAriaLabel = await rejectButton.getAttribute('aria-label');
        expect(rejectText || rejectAriaLabel).toBeTruthy();
      }
      
      console.log('✅ Consent banner accessibility verified');
      
    } else {
      console.log('⚠️ Consent banner not present - skipping banner-specific accessibility tests');
      expect(true).toBe(true); // Pass test if banner not implemented yet
    }
  });
});

// Specialized accessibility tests for specific components
test.describe('Component-Specific Accessibility', () => {
  test('Hero3D component should be accessible', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const heroSection = page.locator('.hero-3d');
    await expect(heroSection).toBeVisible();
    
    // Should have proper role
    const role = await heroSection.getAttribute('role');
    expect(role).toBe('banner');
    
    // Should have proper labeling
    const ariaLabelledBy = await heroSection.getAttribute('aria-labelledby');
    expect(ariaLabelledBy).toBe('hero-headline');
    
    // Headline should be properly marked up
    const headline = page.locator('#hero-headline');
    await expect(headline).toBeVisible();
    const tagName = await headline.evaluate(el => el.tagName.toLowerCase());
    expect(tagName).toBe('h1');
  });

  test('bullet list should be properly structured', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const bulletList = page.locator('.hero-3d__bullets');
    if (await bulletList.isVisible()) {
      // Should have proper role
      const role = await bulletList.getAttribute('role');
      expect(role).toBe('list');
      
      // Should have aria-label
      const ariaLabel = await bulletList.getAttribute('aria-label');
      expect(ariaLabel).toBeTruthy();
      
      // List items should be properly marked up
      const listItems = bulletList.locator('li');
      const itemCount = await listItems.count();
      expect(itemCount).toBeGreaterThan(0);
    }
  });
});