#!/usr/bin/env node

import lighthouse from 'lighthouse';
import * as chromeLauncher from 'chrome-launcher';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Lighthouse Runner Script
 * 
 * Runs Lighthouse against a target URL and generates a compact Markdown report
 * with Performance, SEO, Best Practices, and Accessibility scores plus Core Web Vitals.
 */

// Configuration
const SITE_URL = process.env.SITE_URL || 'http://localhost:3000';
const REPORT_PATH = path.join(__dirname, '..', 'docs', 'reports', 'lighthouse.md');

// Lighthouse options
const opts = {
  chromeFlags: ['--headless', '--no-sandbox', '--disable-gpu'],
  logLevel: 'info',
  output: 'json',
  onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
};

/**
 * Format score as percentage with color indicator
 */
function formatScore(score) {
  if (score === null || score === undefined) return 'N/A';
  
  const percentage = Math.round(score * 100);
  let indicator = '';
  
  if (percentage >= 90) indicator = '🟢';
  else if (percentage >= 50) indicator = '🟡';
  else indicator = '🔴';
  
  return `${indicator} ${percentage}%`;
}

/**
 * Format metric value with unit
 */
function formatMetric(audit, unit = '') {
  if (!audit || audit.numericValue === null || audit.numericValue === undefined) {
    return 'N/A';
  }
  
  const value = audit.numericValue;
  let formattedValue;
  
  switch (unit) {
    case 'ms':
      formattedValue = `${Math.round(value)}ms`;
      break;
    case 's':
      formattedValue = `${(value / 1000).toFixed(2)}s`;
      break;
    default:
      formattedValue = typeof value === 'number' ? value.toFixed(3) : value;
  }
  
  // Add score indicator
  let indicator = '';
  if (audit.score !== null) {
    if (audit.score >= 0.9) indicator = '🟢';
    else if (audit.score >= 0.5) indicator = '🟡';
    else indicator = '🔴';
  }
  
  return `${indicator} ${formattedValue}`;
}

/**
 * Generate Markdown report
 */
function generateMarkdownReport(results, url) {
  const { lhr } = results;
  const timestamp = new Date().toISOString();
  
  // Extract scores
  const performanceScore = lhr.categories.performance?.score;
  const accessibilityScore = lhr.categories.accessibility?.score;
  const bestPracticesScore = lhr.categories['best-practices']?.score;
  const seoScore = lhr.categories.seo?.score;
  
  // Extract Core Web Vitals
  const lcp = lhr.audits['largest-contentful-paint'];
  const inp = lhr.audits['interaction-to-next-paint'] || lhr.audits['total-blocking-time']; // Fallback for older versions
  const cls = lhr.audits['cumulative-layout-shift'];
  const fcp = lhr.audits['first-contentful-paint'];
  const si = lhr.audits['speed-index'];
  const tti = lhr.audits['interactive'];
  
  const report = `# Lighthouse Performance Report

**URL:** ${url}  
**Generated:** ${timestamp}  
**User Agent:** ${lhr.environment.hostUserAgent}

## 📊 Overall Scores

| Category | Score |
|----------|-------|
| **Performance** | ${formatScore(performanceScore)} |
| **Accessibility** | ${formatScore(accessibilityScore)} |
| **Best Practices** | ${formatScore(bestPracticesScore)} |
| **SEO** | ${formatScore(seoScore)} |

## ⚡ Core Web Vitals

| Metric | Value | Description |
|--------|-------|-------------|
| **LCP** (Largest Contentful Paint) | ${formatMetric(lcp, 's')} | Time to render the largest content element |
| **INP** (Interaction to Next Paint) | ${formatMetric(inp, 'ms')} | Responsiveness to user interactions |
| **CLS** (Cumulative Layout Shift) | ${formatMetric(cls)} | Visual stability of the page |

## 🚀 Performance Metrics

| Metric | Value | Description |
|--------|-------|-------------|
| **FCP** (First Contentful Paint) | ${formatMetric(fcp, 's')} | Time to first content render |
| **SI** (Speed Index) | ${formatMetric(si, 's')} | How quickly content is visually populated |
| **TTI** (Time to Interactive) | ${formatMetric(tti, 's')} | Time until page is fully interactive |

## 🎯 Performance Budget Status

${performanceScore >= 0.9 ? '✅ **EXCELLENT** - Performance is within optimal range' : 
  performanceScore >= 0.7 ? '⚠️ **GOOD** - Minor performance improvements recommended' :
  performanceScore >= 0.5 ? '🚨 **NEEDS IMPROVEMENT** - Significant performance issues detected' :
  '💥 **CRITICAL** - Major performance problems require immediate attention'}

## 📈 Recommendations

${lhr.categories.performance.score < 0.9 ? `
### Performance Improvements Needed:
${lhr.categories.performance.auditRefs
  .filter(ref => lhr.audits[ref.id].score !== null && lhr.audits[ref.id].score < 0.9)
  .slice(0, 5)
  .map(ref => `- ${lhr.audits[ref.id].title}`)
  .join('\n')}
` : '### ✅ Performance is optimal!'}

${lhr.categories.accessibility.score < 0.9 ? `
### Accessibility Improvements Needed:
${lhr.categories.accessibility.auditRefs
  .filter(ref => lhr.audits[ref.id].score !== null && lhr.audits[ref.id].score < 0.9)
  .slice(0, 3)
  .map(ref => `- ${lhr.audits[ref.id].title}`)
  .join('\n')}
` : ''}

${lhr.categories.seo.score < 0.9 ? `
### SEO Improvements Needed:
${lhr.categories.seo.auditRefs
  .filter(ref => lhr.audits[ref.id].score !== null && lhr.audits[ref.id].score < 0.9)
  .slice(0, 3)
  .map(ref => `- ${lhr.audits[ref.id].title}`)
  .join('\n')}
` : ''}

---

*Report generated by Lighthouse ${lhr.lighthouseVersion}*
`;

  return report;
}

/**
 * Check if Chrome/Chromium is available
 */
async function checkChromeAvailability() {
  try {
    const chrome = await chromeLauncher.launch({ 
      chromeFlags: ['--headless', '--no-sandbox', '--disable-gpu'],
      startingUrl: 'about:blank'
    });
    await chrome.kill();
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Main execution function
 */
async function runLighthouse() {
  console.log(`🚀 Starting Lighthouse audit for: ${SITE_URL}`);
  
  // Check Chrome availability first
  console.log('🔍 Checking Chrome availability...');
  const chromeAvailable = await checkChromeAvailability();
  
  if (!chromeAvailable) {
    console.error('❌ Chrome/Chromium not found or not accessible.');
    console.error('\n💡 To install Chrome/Chromium:');
    console.error('   Ubuntu/Debian: sudo apt-get install chromium-browser');
    console.error('   macOS: brew install chromium');
    console.error('   Or set CHROME_PATH environment variable');
    console.error('\n📄 A sample report has been generated instead.');
    
    // Generate sample report
    const sampleReport = `# Lighthouse Performance Report

**URL:** ${SITE_URL}  
**Generated:** ${new Date().toISOString()}  
**Status:** ⚠️ Chrome not available - Sample report generated

## 📊 Overall Scores

| Category | Score |
|----------|-------|
| **Performance** | 🔴 N/A |
| **Accessibility** | 🔴 N/A |
| **Best Practices** | 🔴 N/A |
| **SEO** | 🔴 N/A |

## ⚡ Core Web Vitals

| Metric | Value | Description |
|--------|-------|-------------|
| **LCP** (Largest Contentful Paint) | 🔴 N/A | Time to render the largest content element |
| **INP** (Interaction to Next Paint) | 🔴 N/A | Responsiveness to user interactions |
| **CLS** (Cumulative Layout Shift) | 🔴 N/A | Visual stability of the page |

## 🚀 Performance Metrics

| Metric | Value | Description |
|--------|-------|-------------|
| **FCP** (First Contentful Paint) | 🔴 N/A | Time to first content render |
| **SI** (Speed Index) | 🔴 N/A | How quickly content is visually populated |
| **TTI** (Time to Interactive) | 🔴 N/A | Time until page is fully interactive |

## 🎯 Performance Budget Status

❌ **UNABLE TO AUDIT** - Chrome/Chromium not available

## 📈 Setup Instructions

To run a real Lighthouse audit:

1. Install Chrome/Chromium:
   \`\`\`bash
   # Ubuntu/Debian
   sudo apt-get install chromium-browser
   
   # macOS
   brew install chromium
   
   # Or set CHROME_PATH
   export CHROME_PATH=/path/to/chrome
   \`\`\`

2. Ensure your application is running at ${SITE_URL}

3. Run the audit:
   \`\`\`bash
   npm run lighthouse
   \`\`\`

---

*Sample report - Install Chrome/Chromium to generate real audit data*
`;

    // Ensure reports directory exists
    const reportsDir = path.dirname(REPORT_PATH);
    await fs.mkdir(reportsDir, { recursive: true });
    
    // Write sample report
    await fs.writeFile(REPORT_PATH, sampleReport, 'utf8');
    console.log(`📄 Sample report saved to: ${REPORT_PATH}`);
    
    return;
  }
  
  let chrome;
  
  try {
    // Launch Chrome
    console.log('🔧 Launching Chrome...');
    chrome = await chromeLauncher.launch({ chromeFlags: opts.chromeFlags });
    opts.port = chrome.port;
    
    // Run Lighthouse
    console.log('📊 Running Lighthouse audit...');
    const results = await lighthouse(SITE_URL, opts);
    
    if (!results) {
      throw new Error('Lighthouse returned no results');
    }
    
    // Generate Markdown report
    console.log('📝 Generating Markdown report...');
    const markdownReport = generateMarkdownReport(results, SITE_URL);
    
    // Ensure reports directory exists
    const reportsDir = path.dirname(REPORT_PATH);
    await fs.mkdir(reportsDir, { recursive: true });
    
    // Write report
    await fs.writeFile(REPORT_PATH, markdownReport, 'utf8');
    
    console.log('✅ Lighthouse audit completed successfully!');
    console.log(`📄 Report saved to: ${REPORT_PATH}`);
    
    // Log summary
    const { lhr } = results;
    console.log('\n📊 Summary:');
    console.log(`Performance: ${Math.round((lhr.categories.performance?.score || 0) * 100)}%`);
    console.log(`Accessibility: ${Math.round((lhr.categories.accessibility?.score || 0) * 100)}%`);
    console.log(`Best Practices: ${Math.round((lhr.categories['best-practices']?.score || 0) * 100)}%`);
    console.log(`SEO: ${Math.round((lhr.categories.seo?.score || 0) * 100)}%`);
    
  } catch (error) {
    console.error('❌ Lighthouse audit failed:', error.message);
    
    if (error.message.includes('ECONNREFUSED') || error.message.includes('net::ERR_CONNECTION_REFUSED')) {
      console.error(`\n💡 Make sure your application is running at ${SITE_URL}`);
      console.error('   You can start it with: npm run dev');
    }
    
    process.exit(1);
  } finally {
    if (chrome) {
      console.log('🔧 Closing Chrome...');
      await chrome.kill();
    }
  }
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
  runLighthouse().catch(console.error);
}

export default runLighthouse;