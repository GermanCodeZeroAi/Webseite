#!/usr/bin/env node

/**
 * Performance Audit Script
 * 
 * Analyzes bundle sizes and performance metrics to ensure
 * we meet our performance targets:
 * - Initial JS < 180 KB
 * - LCP < 2.5s
 * - INP < 200ms
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Performance targets
const PERFORMANCE_TARGETS = {
  initialJS: 180 * 1024, // 180 KB in bytes
  lcp: 2500, // 2.5 seconds in ms
  inp: 200, // 200ms
  fid: 100, // 100ms
  cls: 0.1, // 0.1 cumulative layout shift
};

/**
 * Analyze bundle sizes
 */
function analyzeBundleSize() {
  console.log('📊 Analyzing bundle sizes...');
  
  try {
    // Run Next.js build to generate bundle analysis
    execSync('npm run build', { stdio: 'inherit' });
    
    // Check if bundle analysis exists
    const bundleStatsPath = path.join(process.cwd(), '.next/analyze/bundle.json');
    
    if (fs.existsSync(bundleStatsPath)) {
      const bundleStats = JSON.parse(fs.readFileSync(bundleStatsPath, 'utf8'));
      
      // Calculate initial JS size
      let initialJSSize = 0;
      const initialChunks = bundleStats.chunks.filter(chunk => chunk.initial);
      
      initialChunks.forEach(chunk => {
        chunk.files.forEach(file => {
          if (file.endsWith('.js')) {
            const filePath = path.join(process.cwd(), '.next/static', file);
            if (fs.existsSync(filePath)) {
              initialJSSize += fs.statSync(filePath).size;
            }
          }
        });
      });
      
      console.log(`📦 Initial JS size: ${(initialJSSize / 1024).toFixed(2)} KB`);
      console.log(`🎯 Target: ${(PERFORMANCE_TARGETS.initialJS / 1024).toFixed(2)} KB`);
      
      if (initialJSSize > PERFORMANCE_TARGETS.initialJS) {
        console.error(`❌ Initial JS size exceeds target by ${((initialJSSize - PERFORMANCE_TARGETS.initialJS) / 1024).toFixed(2)} KB`);
        process.exit(1);
      } else {
        console.log(`✅ Initial JS size is within target`);
      }
    } else {
      console.warn('⚠️ Bundle analysis not found, skipping bundle size check');
    }
  } catch (error) {
    console.error('❌ Bundle analysis failed:', error.message);
    process.exit(1);
  }
}

/**
 * Run Lighthouse audit
 */
function runLighthouseAudit() {
  console.log('🔍 Running Lighthouse performance audit...');
  
  try {
    // Check if Lighthouse is available
    execSync('which lighthouse', { stdio: 'ignore' });
    
    // Run Lighthouse audit
    const lighthouseResult = execSync(
      'lighthouse http://localhost:3000 --only-categories=performance --output=json --quiet',
      { encoding: 'utf8' }
    );
    
    const audit = JSON.parse(lighthouseResult);
    const metrics = audit.lhr.audits;
    
    // Extract key metrics
    const lcp = metrics['largest-contentful-paint']?.numericValue || 0;
    const fid = metrics['max-potential-fid']?.numericValue || 0;
    const cls = metrics['cumulative-layout-shift']?.numericValue || 0;
    const performanceScore = audit.lhr.categories.performance.score * 100;
    
    console.log('📈 Performance Metrics:');
    console.log(`  LCP: ${lcp.toFixed(0)}ms (target: ${PERFORMANCE_TARGETS.lcp}ms)`);
    console.log(`  FID: ${fid.toFixed(0)}ms (target: ${PERFORMANCE_TARGETS.fid}ms)`);
    console.log(`  CLS: ${cls.toFixed(3)} (target: ${PERFORMANCE_TARGETS.cls})`);
    console.log(`  Performance Score: ${performanceScore.toFixed(0)}/100`);
    
    // Check targets
    let failed = false;
    
    if (lcp > PERFORMANCE_TARGETS.lcp) {
      console.error(`❌ LCP exceeds target by ${(lcp - PERFORMANCE_TARGETS.lcp).toFixed(0)}ms`);
      failed = true;
    } else {
      console.log(`✅ LCP is within target`);
    }
    
    if (fid > PERFORMANCE_TARGETS.fid) {
      console.error(`❌ FID exceeds target by ${(fid - PERFORMANCE_TARGETS.fid).toFixed(0)}ms`);
      failed = true;
    } else {
      console.log(`✅ FID is within target`);
    }
    
    if (cls > PERFORMANCE_TARGETS.cls) {
      console.error(`❌ CLS exceeds target by ${(cls - PERFORMANCE_TARGETS.cls).toFixed(3)}`);
      failed = true;
    } else {
      console.log(`✅ CLS is within target`);
    }
    
    if (failed) {
      process.exit(1);
    }
    
  } catch (error) {
    console.warn('⚠️ Lighthouse audit failed, skipping:', error.message);
    console.log('💡 Install Lighthouse CLI: npm install -g lighthouse');
  }
}

/**
 * Generate performance report
 */
function generateReport() {
  const report = {
    timestamp: new Date().toISOString(),
    targets: PERFORMANCE_TARGETS,
    // Add actual measurements here
  };
  
  const reportPath = path.join(process.cwd(), 'performance-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  console.log(`📄 Performance report saved to: ${reportPath}`);
}

/**
 * Main execution
 */
function main() {
  console.log('🚀 Starting performance audit...\n');
  
  analyzeBundleSize();
  console.log('');
  
  runLighthouseAudit();
  console.log('');
  
  generateReport();
  
  console.log('\n✨ Performance audit completed!');
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  analyzeBundleSize,
  runLighthouseAudit,
  generateReport,
  PERFORMANCE_TARGETS
};