#!/usr/bin/env node
import { config, validateConfig } from '../core/config/index.js';
import { dbConnection, EmailsRepo } from '../core/db/index.js';
import { createLogger } from '../core/logger/index.js';
import { praxisSettings } from '../core/config/settings.js';
import { healthChecker } from '../core/health/health.js';
import { watchdog } from '../core/watchdog/watcher.js';

const logger = createLogger('cli');

// Parse command line arguments
const args = process.argv.slice(2);
const noWatchdog = args.includes('--no-watchdog');
const watchdogInterval = args.find(arg => arg.startsWith('--watchdog-interval='));
const intervalMs = watchdogInterval ? parseInt(watchdogInterval.split('=')[1]) * 1000 : 60000;

async function main() {
  logger.info('=== Praxis E-Mail Agent ===');
  logger.info({ env: config.env, locale: config.locale }, 'Starte Anwendung');
  
  try {
    // Validiere Konfiguration
    validateConfig();
    logger.info('✓ Konfiguration validiert');
    
    // Initialisiere Datenbank
    await dbConnection.init();
    logger.info('✓ Datenbank initialisiert');
    
    // Initial health check
    const healthResult = await healthChecker.runCritical();
    if (!healthResult.healthy) {
      logger.error({ checks: healthResult.checks }, 'Kritische Health-Checks fehlgeschlagen');
      throw new Error('System nicht bereit - kritische Checks fehlgeschlagen');
    }
    logger.info('✓ Health-Checks bestanden');
    
    // Health Check Details
    const emailsRepo = new EmailsRepo();
    const db = dbConnection.getDb();
    const emailCount = db.prepare('SELECT COUNT(*) as count FROM emails').get() as { count: number };
    logger.info({ emailCount: emailCount.count }, '✓ Datenbank-Verbindung OK');
    
    // Zeige aktuelle Einstellungen
    logger.info({
      autoSendEnabled: praxisSettings.autoSendEnabled,
      requireManualApproval: praxisSettings.requireManualApproval,
      workingHours: `${praxisSettings.workingHoursStart} - ${praxisSettings.workingHoursEnd}`,
      watchdogEnabled: !noWatchdog,
      watchdogInterval: intervalMs / 1000 + 's',
    }, '✓ Einstellungen geladen');
    
    // Start Watchdog unless disabled
    if (!noWatchdog) {
      await watchdog.start();
      logger.info({ intervalMs }, '✓ Watchdog gestartet');
    } else {
      logger.info('Watchdog deaktiviert (--no-watchdog)');
    }
    
    // TODO: Pipeline starten
    logger.info('🚧 Pipeline-Implementation ausstehend');
    
    // Graceful Shutdown
    const shutdown = async () => {
      logger.info('Fahre herunter...');
      
      // Stop watchdog first
      if (!noWatchdog) {
        watchdog.stop();
        logger.info('Watchdog gestoppt');
      }
      
      // Close database
      dbConnection.close();
      logger.info('Datenbank geschlossen');
      
      process.exit(0);
    };
    
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
    
    // Health status display every 5 minutes
    if (!noWatchdog) {
      setInterval(() => {
        const status = watchdog.getStatus();
        const health = watchdog.isHealthy();
        logger.info({
          healthy: health,
          runCount: status.runCount,
          lastRun: status.lastRun,
        }, 'Watchdog Status');
      }, 300000); // 5 minutes
    }
    
    // Keep alive
    logger.info('Agent läuft. Drücke Ctrl+C zum Beenden.');
    if (args.includes('--help')) {
      console.log('\nOptionen:');
      console.log('  --no-watchdog           Watchdog deaktivieren');
      console.log('  --watchdog-interval=N   Watchdog Interval in Sekunden (default: 60)');
      console.log('  --help                  Diese Hilfe anzeigen\n');
    }
    
    // Prevent exit
    setInterval(() => {}, 1000);
    
  } catch (error) {
    logger.error({ error }, 'Fehler beim Start');
    watchdog.stop();
    dbConnection.close();
    process.exit(1);
  }
}

// Handle uncaught errors
process.on('unhandledRejection', (error) => {
  logger.error({ error }, 'Unhandled rejection');
  watchdog.stop();
  dbConnection.close();
  process.exit(1);
});

// Start
main().catch((error) => {
  logger.error({ error }, 'Unerwarteter Fehler');
  process.exit(1);
});