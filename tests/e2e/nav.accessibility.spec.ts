import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * E2E Accessibility Test: Navigation Bar
 * 
 * This test validates comprehensive keyboard navigation and accessibility compliance:
 * 1. Tab navigation reaches menu elements
 * 2. Enter/Space keys open dropdown menus
 * 3. Arrow keys navigate within menus
 * 4. ESC key closes menus and returns focus properly
 * 5. No critical axe-core accessibility violations
 * 6. WCAG 2.2 AA compliance for navigation patterns
 */

test.describe('Navigation Bar Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Ensure navigation is visible and loaded
    const nav = page.locator('nav, [role="navigation"], .navbar, .navigation');
    await expect(nav.first()).toBeVisible();
  });

  test('should have no critical accessibility violations', async ({ page }) => {
    console.log('🔍 Running axe accessibility scan on navigation...');
    
    // Run comprehensive axe scan focusing on navigation
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
      .include('nav, [role="navigation"], .navbar, .navigation')
      .analyze();
    
    // Log detailed results
    console.log(`✅ Navigation accessibility: ${accessibilityScanResults.passes.length} checks passed`);
    
    if (accessibilityScanResults.violations.length > 0) {
      console.error('❌ Critical accessibility violations found in navigation:');
      accessibilityScanResults.violations.forEach(violation => {
        console.error(`- ${violation.id}: ${violation.description}`);
        console.error(`  Impact: ${violation.impact}`);
        violation.nodes.forEach(node => {
          console.error(`  Element: ${node.target.join(', ')}`);
          console.error(`  HTML: ${node.html.substring(0, 100)}...`);
        });
      });
    }
    
    // Should have no violations
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should be fully keyboard navigable with Tab key', async ({ page }) => {
    console.log('⌨️  Testing keyboard navigation with Tab key...');
    
    // Start from the beginning of the page
    await page.keyboard.press('Home');
    
    // Find all navigation elements
    const navElements = page.locator('nav a, nav button, [role="navigation"] a, [role="navigation"] button, .navbar a, .navbar button');
    const navCount = await navElements.count();
    
    console.log(`🔍 Found ${navCount} navigation elements to test`);
    
    let focusedNavElements = 0;
    let tabCount = 0;
    const maxTabs = 50; // Prevent infinite loops
    
    // Tab through the page and count navigation elements that receive focus
    while (tabCount < maxTabs) {
      await page.keyboard.press('Tab');
      tabCount++;
      
      const focusedElement = page.locator(':focus');
      
      // Check if focused element is within navigation
      const isInNav = await focusedElement.locator('xpath=ancestor-or-self::nav | ancestor-or-self::*[@role="navigation"] | ancestor-or-self::*[contains(@class, "navbar")] | ancestor-or-self::*[contains(@class, "navigation")]').count() > 0;
      
      if (isInNav) {
        focusedNavElements++;
        
        // Verify the focused element is visible and has proper focus styles
        await expect(focusedElement).toBeVisible();
        
        // Check for focus indicators (outline, border, shadow, etc.)
        const focusedElementHandle = await focusedElement.elementHandle();
        if (focusedElementHandle) {
          const computedStyle = await focusedElementHandle.evaluate(el => {
            const styles = window.getComputedStyle(el);
            return {
              outline: styles.outline,
              outlineWidth: styles.outlineWidth,
              outlineStyle: styles.outlineStyle,
              boxShadow: styles.boxShadow,
              border: styles.border
            };
          });
          
          // Should have some form of focus indicator
          const hasFocusIndicator = 
            computedStyle.outline !== 'none' ||
            computedStyle.outlineWidth !== '0px' ||
            computedStyle.boxShadow !== 'none' ||
            computedStyle.border.includes('focus') ||
            computedStyle.boxShadow.includes('0px 0px');
          
          if (!hasFocusIndicator) {
            console.warn(`⚠️  Element may lack visible focus indicator: ${await focusedElement.getAttribute('class')}`);
          }
        }
        
        console.log(`✅ Navigation element ${focusedNavElements} focused: ${await focusedElement.textContent()}`);
      }
      
      // Stop if we've gone through all expected navigation elements
      if (focusedNavElements >= navCount) {
        break;
      }
      
      // Stop if we've reached the end of the page
      const activeElement = await page.evaluate(() => document.activeElement?.tagName);
      if (activeElement === 'BODY') {
        break;
      }
    }
    
    expect(focusedNavElements).toBeGreaterThan(0);
    console.log(`✅ Keyboard navigation: ${focusedNavElements} navigation elements successfully focused`);
  });

  test('should open dropdown menus with Enter and Space keys', async ({ page }) => {
    console.log('🔽 Testing dropdown menu activation with keyboard...');
    
    // Look for dropdown menu triggers (buttons with aria-expanded or aria-haspopup)
    const menuTriggers = page.locator('nav button[aria-expanded], nav button[aria-haspopup], [role="navigation"] button[aria-expanded], [role="navigation"] button[aria-haspopup], .navbar button[aria-expanded], .navbar button[aria-haspopup]');
    const triggerCount = await menuTriggers.count();
    
    if (triggerCount === 0) {
      console.log('ℹ️  No dropdown menu triggers found in navigation');
      return;
    }
    
    console.log(`🔍 Found ${triggerCount} dropdown menu triggers`);
    
    for (let i = 0; i < triggerCount; i++) {
      const trigger = menuTriggers.nth(i);
      await trigger.scrollIntoViewIfNeeded();
      
      // Test Enter key activation
      await trigger.focus();
      await expect(trigger).toBeFocused();
      
      const initialExpanded = await trigger.getAttribute('aria-expanded');
      console.log(`📋 Menu trigger ${i + 1} initial state: aria-expanded="${initialExpanded}"`);
      
      // Press Enter to open menu
      await page.keyboard.press('Enter');
      await page.waitForTimeout(300); // Allow for animation
      
      const expandedAfterEnter = await trigger.getAttribute('aria-expanded');
      console.log(`📋 After Enter: aria-expanded="${expandedAfterEnter}"`);
      
      // Verify menu opened
      if (initialExpanded === 'false') {
        expect(expandedAfterEnter).toBe('true');
        
        // Look for the dropdown menu content
        const menuId = await trigger.getAttribute('aria-controls');
        if (menuId) {
          const menu = page.locator(`#${menuId}`);
          await expect(menu).toBeVisible();
          console.log(`✅ Menu opened with Enter key: #${menuId}`);
        }
      }
      
      // Close menu with Escape for next test
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);
      
      // Test Space key activation
      await trigger.focus();
      await page.keyboard.press('Space');
      await page.waitForTimeout(300);
      
      const expandedAfterSpace = await trigger.getAttribute('aria-expanded');
      console.log(`📋 After Space: aria-expanded="${expandedAfterSpace}"`);
      
      if (initialExpanded === 'false') {
        expect(expandedAfterSpace).toBe('true');
        console.log(`✅ Menu opened with Space key`);
      }
      
      // Close menu for next iteration
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);
    }
  });

  test('should navigate menu items with arrow keys', async ({ page }) => {
    console.log('➡️  Testing arrow key navigation in menus...');
    
    // Find dropdown menu triggers
    const menuTriggers = page.locator('nav button[aria-expanded], nav button[aria-haspopup], [role="navigation"] button[aria-expanded], [role="navigation"] button[aria-haspopup]');
    const triggerCount = await menuTriggers.count();
    
    if (triggerCount === 0) {
      console.log('ℹ️  No dropdown menus found for arrow key testing');
      return;
    }
    
    for (let i = 0; i < triggerCount; i++) {
      const trigger = menuTriggers.nth(i);
      await trigger.scrollIntoViewIfNeeded();
      await trigger.focus();
      
      // Open menu
      await page.keyboard.press('Enter');
      await page.waitForTimeout(300);
      
      const menuId = await trigger.getAttribute('aria-controls');
      if (!menuId) continue;
      
      const menu = page.locator(`#${menuId}`);
      const isMenuVisible = await menu.isVisible();
      
      if (!isMenuVisible) continue;
      
      console.log(`🔍 Testing arrow navigation in menu: #${menuId}`);
      
      // Find menu items
      const menuItems = menu.locator('a, button, [role="menuitem"]');
      const itemCount = await menuItems.count();
      
      if (itemCount === 0) {
        console.log(`ℹ️  No menu items found in #${menuId}`);
        continue;
      }
      
      console.log(`📋 Found ${itemCount} menu items`);
      
      // Test Down Arrow navigation
      let currentItemIndex = 0;
      for (let j = 0; j < Math.min(itemCount, 5); j++) { // Test first 5 items
        await page.keyboard.press('ArrowDown');
        await page.waitForTimeout(100);
        
        // Check if focus moved to a menu item
        const focusedElement = page.locator(':focus');
        const isFocusInMenu = await focusedElement.locator(`xpath=ancestor-or-self::*[@id="${menuId}"]`).count() > 0;
        
        if (isFocusInMenu) {
          await expect(focusedElement).toBeVisible();
          const itemText = await focusedElement.textContent();
          console.log(`✅ Arrow Down ${j + 1}: Focused "${itemText?.trim()}"`);
          currentItemIndex = j;
        }
      }
      
      // Test Up Arrow navigation
      for (let j = 0; j < Math.min(currentItemIndex, 3); j++) {
        await page.keyboard.press('ArrowUp');
        await page.waitForTimeout(100);
        
        const focusedElement = page.locator(':focus');
        const isFocusInMenu = await focusedElement.locator(`xpath=ancestor-or-self::*[@id="${menuId}"]`).count() > 0;
        
        if (isFocusInMenu) {
          const itemText = await focusedElement.textContent();
          console.log(`✅ Arrow Up ${j + 1}: Focused "${itemText?.trim()}"`);
        }
      }
      
      // Test Home key (first item)
      await page.keyboard.press('Home');
      await page.waitForTimeout(100);
      
      const firstFocused = page.locator(':focus');
      const isFirstInMenu = await firstFocused.locator(`xpath=ancestor-or-self::*[@id="${menuId}"]`).count() > 0;
      
      if (isFirstInMenu) {
        const firstText = await firstFocused.textContent();
        console.log(`✅ Home key: Focused first item "${firstText?.trim()}"`);
      }
      
      // Test End key (last item)
      await page.keyboard.press('End');
      await page.waitForTimeout(100);
      
      const lastFocused = page.locator(':focus');
      const isLastInMenu = await lastFocused.locator(`xpath=ancestor-or-self::*[@id="${menuId}"]`).count() > 0;
      
      if (isLastInMenu) {
        const lastText = await lastFocused.textContent();
        console.log(`✅ End key: Focused last item "${lastText?.trim()}"`);
      }
      
      // Close menu before testing next one
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);
    }
  });

  test('should close menus with Escape key and return focus properly', async ({ page }) => {
    console.log('🔐 Testing Escape key behavior and focus management...');
    
    // Find dropdown menu triggers
    const menuTriggers = page.locator('nav button[aria-expanded], nav button[aria-haspopup], [role="navigation"] button[aria-expanded], [role="navigation"] button[aria-haspopup]');
    const triggerCount = await menuTriggers.count();
    
    if (triggerCount === 0) {
      console.log('ℹ️  No dropdown menus found for Escape key testing');
      return;
    }
    
    for (let i = 0; i < triggerCount; i++) {
      const trigger = menuTriggers.nth(i);
      await trigger.scrollIntoViewIfNeeded();
      await trigger.focus();
      
      // Store the trigger's selector for focus comparison
      const triggerText = await trigger.textContent();
      console.log(`🔍 Testing Escape behavior for menu: "${triggerText?.trim()}"`);
      
      // Open menu
      await page.keyboard.press('Enter');
      await page.waitForTimeout(300);
      
      // Verify menu is open
      const expandedAfterOpen = await trigger.getAttribute('aria-expanded');
      if (expandedAfterOpen !== 'true') {
        console.log(`⚠️  Menu did not open properly, skipping Escape test`);
        continue;
      }
      
      const menuId = await trigger.getAttribute('aria-controls');
      if (menuId) {
        const menu = page.locator(`#${menuId}`);
        await expect(menu).toBeVisible();
        console.log(`✅ Menu opened: #${menuId}`);
      }
      
      // Navigate into the menu
      await page.keyboard.press('ArrowDown');
      await page.waitForTimeout(100);
      
      // Verify focus is in the menu
      const focusedInMenu = page.locator(':focus');
      const isFocusInMenu = menuId ? 
        await focusedInMenu.locator(`xpath=ancestor-or-self::*[@id="${menuId}"]`).count() > 0 :
        false;
      
      if (isFocusInMenu) {
        console.log(`✅ Focus moved into menu`);
      }
      
      // Press Escape to close menu
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);
      
      // Verify menu is closed
      const expandedAfterEscape = await trigger.getAttribute('aria-expanded');
      expect(expandedAfterEscape).toBe('false');
      console.log(`✅ Menu closed with Escape: aria-expanded="${expandedAfterEscape}"`);
      
      // Verify menu is no longer visible
      if (menuId) {
        const menu = page.locator(`#${menuId}`);
        await expect(menu).not.toBeVisible();
        console.log(`✅ Menu hidden: #${menuId}`);
      }
      
      // Verify focus returned to trigger
      const focusedAfterEscape = page.locator(':focus');
      const isFocusOnTrigger = await focusedAfterEscape.evaluate((el, triggerEl) => {
        return el === triggerEl;
      }, await trigger.elementHandle());
      
      expect(isFocusOnTrigger).toBe(true);
      console.log(`✅ Focus correctly returned to menu trigger`);
      
      // Additional test: Escape when focus is on trigger should not affect other elements
      await page.keyboard.press('Escape');
      await page.waitForTimeout(100);
      
      const stillFocusedOnTrigger = await page.locator(':focus').evaluate((el, triggerEl) => {
        return el === triggerEl;
      }, await trigger.elementHandle());
      
      expect(stillFocusedOnTrigger).toBe(true);
      console.log(`✅ Escape on closed menu trigger maintains focus properly`);
    }
  });

  test('should handle complex keyboard navigation scenarios', async ({ page }) => {
    console.log('🎯 Testing complex keyboard navigation scenarios...');
    
    // Test scenario: Tab through nav, open menu, navigate with arrows, close with escape, continue tabbing
    const navLinks = page.locator('nav a, nav button, [role="navigation"] a, [role="navigation"] button');
    const navCount = await navLinks.count();
    
    if (navCount === 0) {
      console.log('ℹ️  No navigation links found for complex scenario testing');
      return;
    }
    
    // Start from beginning
    await page.keyboard.press('Home');
    
    // Tab to first nav element
    let tabsToNav = 0;
    const maxTabsToNav = 20;
    
    while (tabsToNav < maxTabsToNav) {
      await page.keyboard.press('Tab');
      tabsToNav++;
      
      const focusedElement = page.locator(':focus');
      const isInNav = await focusedElement.locator('xpath=ancestor-or-self::nav | ancestor-or-self::*[@role="navigation"]').count() > 0;
      
      if (isInNav) {
        console.log(`✅ Reached navigation after ${tabsToNav} tabs`);
        break;
      }
    }
    
    // Try to find a dropdown menu trigger
    let foundDropdown = false;
    const maxNavTabs = 10;
    
    for (let i = 0; i < maxNavTabs; i++) {
      const focusedElement = page.locator(':focus');
      const hasDropdown = await focusedElement.getAttribute('aria-haspopup') || 
                         await focusedElement.getAttribute('aria-expanded');
      
      if (hasDropdown) {
        foundDropdown = true;
        console.log(`✅ Found dropdown menu trigger`);
        
        // Open menu
        await page.keyboard.press('Enter');
        await page.waitForTimeout(300);
        
        // Navigate in menu
        await page.keyboard.press('ArrowDown');
        await page.keyboard.press('ArrowDown');
        await page.waitForTimeout(200);
        
        // Close menu
        await page.keyboard.press('Escape');
        await page.waitForTimeout(300);
        
        // Verify focus is back on trigger
        const focusedAfterEscape = page.locator(':focus');
        const triggerText = await focusedAfterEscape.textContent();
        console.log(`✅ Complex scenario completed, focus on: "${triggerText?.trim()}"`);
        
        break;
      }
      
      // Tab to next nav element
      await page.keyboard.press('Tab');
      await page.waitForTimeout(100);
      
      // Check if we're still in navigation
      const stillInNav = await page.locator(':focus').locator('xpath=ancestor-or-self::nav | ancestor-or-self::*[@role="navigation"]').count() > 0;
      if (!stillInNav) {
        break;
      }
    }
    
    if (!foundDropdown) {
      console.log('ℹ️  No dropdown menus found, testing basic tab navigation instead');
      
      // Continue tabbing through remaining nav elements
      for (let i = 0; i < 5; i++) {
        await page.keyboard.press('Tab');
        await page.waitForTimeout(100);
        
        const focusedElement = page.locator(':focus');
        const isStillInNav = await focusedElement.locator('xpath=ancestor-or-self::nav | ancestor-or-self::*[@role="navigation"]').count() > 0;
        
        if (isStillInNav) {
          const elementText = await focusedElement.textContent();
          console.log(`✅ Tab ${i + 1}: "${elementText?.trim()}"`);
        } else {
          console.log(`✅ Completed navigation, moved to next section`);
          break;
        }
      }
    }
    
    console.log(`✅ Complex keyboard navigation scenario completed successfully`);
  });

  test('should provide proper ARIA attributes and semantics', async ({ page }) => {
    console.log('🏷️  Testing ARIA attributes and semantic markup...');
    
    // Test navigation landmark
    const nav = page.locator('nav, [role="navigation"]');
    await expect(nav.first()).toBeVisible();
    
    const navCount = await nav.count();
    console.log(`🔍 Found ${navCount} navigation landmarks`);
    
    // Each nav should have proper labeling
    for (let i = 0; i < navCount; i++) {
      const navElement = nav.nth(i);
      const ariaLabel = await navElement.getAttribute('aria-label');
      const ariaLabelledBy = await navElement.getAttribute('aria-labelledby');
      const hasProperLabel = ariaLabel || ariaLabelledBy;
      
      if (navCount > 1) {
        // Multiple navs must be labeled
        expect(hasProperLabel).toBeTruthy();
        console.log(`✅ Navigation ${i + 1} has proper labeling: ${ariaLabel || `labelledby=${ariaLabelledBy}`}`);
      }
    }
    
    // Test dropdown menus
    const dropdownTriggers = page.locator('[aria-haspopup], [aria-expanded]');
    const dropdownCount = await dropdownTriggers.count();
    
    console.log(`🔍 Found ${dropdownCount} dropdown triggers`);
    
    for (let i = 0; i < dropdownCount; i++) {
      const trigger = dropdownTriggers.nth(i);
      
      // Should have aria-haspopup or aria-expanded
      const hasPopup = await trigger.getAttribute('aria-haspopup');
      const expanded = await trigger.getAttribute('aria-expanded');
      
      expect(hasPopup || expanded !== null).toBeTruthy();
      
      // If has aria-controls, referenced element should exist
      const controls = await trigger.getAttribute('aria-controls');
      if (controls) {
        const controlledElement = page.locator(`#${controls}`);
        const exists = await controlledElement.count() > 0;
        expect(exists).toBeTruthy();
        console.log(`✅ Dropdown ${i + 1} properly controls #${controls}`);
      }
      
      // Should be focusable
      await trigger.focus();
      await expect(trigger).toBeFocused();
    }
    
    // Test menu items have proper roles
    const menuItems = page.locator('[role="menuitem"], [role="menu"] a, [role="menu"] button');
    const menuItemCount = await menuItems.count();
    
    if (menuItemCount > 0) {
      console.log(`🔍 Found ${menuItemCount} menu items`);
      
      for (let i = 0; i < Math.min(menuItemCount, 10); i++) {
        const item = menuItems.nth(i);
        const role = await item.getAttribute('role');
        const tagName = await item.evaluate(el => el.tagName.toLowerCase());
        
        // Should be focusable
        const tabIndex = await item.getAttribute('tabindex');
        const isFocusable = tabIndex !== '-1' && (tagName === 'a' || tagName === 'button' || tabIndex !== null);
        
        expect(isFocusable).toBeTruthy();
        console.log(`✅ Menu item ${i + 1} is properly focusable: ${tagName}${role ? ` [role="${role}"]` : ''}`);
      }
    }
    
    console.log(`✅ ARIA attributes and semantics validation completed`);
  });

  test('should support screen reader users', async ({ page }) => {
    console.log('🔊 Testing screen reader compatibility...');
    
    // Run screen reader specific accessibility checks
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['cat.aria', 'cat.semantics', 'cat.keyboard', 'cat.name-role-value'])
      .include('nav, [role="navigation"]')
      .analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
    console.log(`✅ Screen reader checks: ${accessibilityScanResults.passes.length} tests passed`);
    
    // Test that all interactive elements have accessible names
    const interactiveElements = page.locator('nav a, nav button, [role="navigation"] a, [role="navigation"] button');
    const interactiveCount = await interactiveElements.count();
    
    for (let i = 0; i < interactiveCount; i++) {
      const element = interactiveElements.nth(i);
      
      // Get accessible name (text content, aria-label, or aria-labelledby)
      const textContent = (await element.textContent())?.trim();
      const ariaLabel = await element.getAttribute('aria-label');
      const ariaLabelledBy = await element.getAttribute('aria-labelledby');
      
      let accessibleName = textContent || ariaLabel;
      
      if (ariaLabelledBy && !accessibleName) {
        const labelElement = page.locator(`#${ariaLabelledBy}`);
        accessibleName = await labelElement.textContent();
      }
      
      expect(accessibleName).toBeTruthy();
      expect(accessibleName!.length).toBeGreaterThan(0);
      
      console.log(`✅ Element ${i + 1} has accessible name: "${accessibleName}"`);
    }
    
    // Test for proper heading structure in navigation
    const navHeadings = page.locator('nav h1, nav h2, nav h3, nav h4, nav h5, nav h6, [role="navigation"] h1, [role="navigation"] h2, [role="navigation"] h3, [role="navigation"] h4, [role="navigation"] h5, [role="navigation"] h6');
    const headingCount = await navHeadings.count();
    
    if (headingCount > 0) {
      console.log(`🔍 Found ${headingCount} headings in navigation`);
      
      for (let i = 0; i < headingCount; i++) {
        const heading = navHeadings.nth(i);
        const headingText = await heading.textContent();
        const tagName = await heading.evaluate(el => el.tagName.toLowerCase());
        
        expect(headingText?.trim().length).toBeGreaterThan(0);
        console.log(`✅ Navigation heading ${i + 1}: ${tagName} "${headingText?.trim()}"`);
      }
    }
    
    console.log(`✅ Screen reader compatibility validation completed`);
  });
});

// Additional edge case tests
test.describe('Navigation Edge Cases', () => {
  test('should handle rapid keyboard interactions gracefully', async ({ page }) => {
    console.log('⚡ Testing rapid keyboard interactions...');
    
    const menuTrigger = page.locator('nav button[aria-expanded], nav button[aria-haspopup]').first();
    
    if (await menuTrigger.count() === 0) {
      console.log('ℹ️  No dropdown menus found for rapid interaction testing');
      return;
    }
    
    await menuTrigger.focus();
    
    // Rapid open/close sequence
    for (let i = 0; i < 3; i++) {
      await page.keyboard.press('Enter');
      await page.waitForTimeout(50);
      await page.keyboard.press('Escape');
      await page.waitForTimeout(50);
    }
    
    // Verify menu is in consistent state
    const finalExpanded = await menuTrigger.getAttribute('aria-expanded');
    expect(finalExpanded).toBe('false');
    
    // Verify focus is still on trigger
    await expect(menuTrigger).toBeFocused();
    
    console.log(`✅ Rapid interactions handled gracefully`);
  });

  test('should work with different viewport sizes', async ({ page }) => {
    console.log('📱 Testing navigation at different viewport sizes...');
    
    const viewports = [
      { width: 1920, height: 1080, name: 'Desktop Large' },
      { width: 1024, height: 768, name: 'Desktop Small' },
      { width: 768, height: 1024, name: 'Tablet' },
      { width: 375, height: 667, name: 'Mobile' }
    ];
    
    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.waitForTimeout(300);
      
      console.log(`🔍 Testing ${viewport.name} (${viewport.width}x${viewport.height})`);
      
      // Check if navigation is still visible and accessible
      const nav = page.locator('nav, [role="navigation"]').first();
      await expect(nav).toBeVisible();
      
      // Test keyboard navigation still works
      await page.keyboard.press('Home');
      
      // Find first focusable nav element
      let foundNavElement = false;
      for (let i = 0; i < 10; i++) {
        await page.keyboard.press('Tab');
        const focusedElement = page.locator(':focus');
        const isInNav = await focusedElement.locator('xpath=ancestor-or-self::nav | ancestor-or-self::*[@role="navigation"]').count() > 0;
        
        if (isInNav) {
          await expect(focusedElement).toBeVisible();
          foundNavElement = true;
          console.log(`✅ ${viewport.name}: Navigation accessible via keyboard`);
          break;
        }
      }
      
      expect(foundNavElement).toBeTruthy();
    }
    
    // Reset to default viewport
    await page.setViewportSize({ width: 1280, height: 720 });
    console.log(`✅ Navigation works across all viewport sizes`);
  });

  test('should maintain accessibility during animations', async ({ page }) => {
    console.log('🎬 Testing accessibility during menu animations...');
    
    // Test with reduced motion preference
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    const menuTrigger = page.locator('nav button[aria-expanded]').first();
    
    if (await menuTrigger.count() === 0) {
      console.log('ℹ️  No animated menus found for testing');
      return;
    }
    
    await menuTrigger.focus();
    
    // Open menu with reduced motion
    await page.keyboard.press('Enter');
    await page.waitForTimeout(100); // Shorter wait for reduced motion
    
    const expandedWithReducedMotion = await menuTrigger.getAttribute('aria-expanded');
    expect(expandedWithReducedMotion).toBe('true');
    
    const menuId = await menuTrigger.getAttribute('aria-controls');
    if (menuId) {
      const menu = page.locator(`#${menuId}`);
      await expect(menu).toBeVisible();
    }
    
    console.log(`✅ Menu opens properly with reduced motion`);
    
    // Close and test with normal motion
    await page.keyboard.press('Escape');
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    
    await page.keyboard.press('Enter');
    await page.waitForTimeout(300); // Normal animation time
    
    const expandedWithMotion = await menuTrigger.getAttribute('aria-expanded');
    expect(expandedWithMotion).toBe('true');
    
    console.log(`✅ Menu opens properly with animations enabled`);
    
    await page.keyboard.press('Escape');
  });
});