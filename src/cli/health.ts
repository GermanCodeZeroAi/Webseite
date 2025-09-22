#!/usr/bin/env node
import { config } from '../core/config/index.js';
import { dbConnection } from '../core/db/connection.js';
import { healthChecker } from '../core/health/health.js';
import { createLogger } from '../core/logger/index.js';

const logger = createLogger('cli:health');

async function main() {
  console.log('🏥 Praxis E-Mail Agent - Health Check\n');
  
  let exitCode = 0;

  try {
    // Initialize database connection
    await dbConnection.init();
    
    // Run health checks
    const result = await healthChecker.runAll();
    
    // Display results
    console.log(`Overall Status: ${result.healthy ? '✅ HEALTHY' : '❌ UNHEALTHY'}`);
    console.log(`Duration: ${result.duration}ms`);
    console.log(`Timestamp: ${result.timestamp}\n`);
    
    console.log('Check Results:');
    console.log('─'.repeat(60));
    
    for (const [name, check] of Object.entries(result.checks)) {
      const icon = check.status === 'healthy' ? '✅' : check.status === 'warning' ? '⚠️' : '❌';
      const status = check.status.toUpperCase().padEnd(10);
      
      console.log(`${icon} ${name.padEnd(15)} ${status} ${check.message}`);
      
      if (check.details) {
        const detailsStr = Object.entries(check.details)
          .map(([k, v]) => `${k}: ${JSON.stringify(v)}`)
          .join(', ');
        console.log(`   └─ ${detailsStr}`);
      }
      
      if (check.duration) {
        console.log(`   └─ Duration: ${check.duration}ms`);
      }
      
      console.log();
    }
    
    // Set exit code based on health
    if (!result.healthy) {
      exitCode = 1;
      
      const failedChecks = Object.entries(result.checks)
        .filter(([_, check]) => check.status === 'unhealthy')
        .map(([name]) => name);
      
      console.error(`\n❌ Health check failed! Failed checks: ${failedChecks.join(', ')}`);
    } else {
      console.log('\n✅ All health checks passed!');
    }
    
    // Check for warnings
    const warnings = Object.entries(result.checks)
      .filter(([_, check]) => check.status === 'warning')
      .map(([name]) => name);
    
    if (warnings.length > 0) {
      console.warn(`\n⚠️  Warnings in: ${warnings.join(', ')}`);
    }
    
  } catch (error) {
    logger.error({ error }, 'Health check failed with error');
    console.error('\n❌ Health check error:', error instanceof Error ? error.message : error);
    exitCode = 2;
  } finally {
    // Clean up
    dbConnection.close();
  }
  
  process.exit(exitCode);
}

// Handle uncaught errors
process.on('unhandledRejection', (error) => {
  logger.error({ error }, 'Unhandled rejection in health check');
  console.error('❌ Unhandled error:', error);
  process.exit(2);
});

// Run health check
main().catch((error) => {
  logger.error({ error }, 'Fatal error in health check');
  console.error('❌ Fatal error:', error);
  process.exit(2);
});