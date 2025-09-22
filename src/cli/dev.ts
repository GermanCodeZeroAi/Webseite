#!/usr/bin/env node
import { config, validateConfig } from '../core/config/index.js';
import { dbConnection, EmailsRepo } from '../core/db/index.js';
import { createLogger } from '../core/logger/index.js';
import { praxisSettings } from '../core/config/settings.js';

const logger = createLogger('cli');

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
    
    // Health Check
    const emailsRepo = new EmailsRepo();
    const db = dbConnection.getDb();
    const emailCount = db.prepare('SELECT COUNT(*) as count FROM emails').get() as { count: number };
    logger.info({ emailCount: emailCount.count }, '✓ Datenbank-Verbindung OK');
    
    // Zeige aktuelle Einstellungen
    logger.info({
      autoSendEnabled: praxisSettings.autoSendEnabled,
      requireManualApproval: praxisSettings.requireManualApproval,
      workingHours: `${praxisSettings.workingHoursStart} - ${praxisSettings.workingHoursEnd}`,
    }, '✓ Einstellungen geladen');
    
    // TODO: Pipeline starten
    logger.info('🚧 Pipeline-Implementation ausstehend');
    
    // Graceful Shutdown
    const shutdown = () => {
      logger.info('Fahre herunter...');
      dbConnection.close();
      process.exit(0);
    };
    
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
    
    // Keep alive
    logger.info('Agent läuft. Drücke Ctrl+C zum Beenden.');
    
    // Prevent exit
    setInterval(() => {}, 1000);
    
  } catch (error) {
    logger.error({ error }, 'Fehler beim Start');
    dbConnection.close();
    process.exit(1);
  }
}

// Start
main().catch((error) => {
  logger.error({ error }, 'Unerwarteter Fehler');
  process.exit(1);
});