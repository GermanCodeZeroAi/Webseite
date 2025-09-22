import Database from 'better-sqlite3';
import { readFileSync, existsSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { config } from '../config/index.js';
import { createLogger } from '../logger/index.js';

const logger = createLogger('db:connection');

class DatabaseConnection {
  private static instance: DatabaseConnection;
  private db: Database.Database | null = null;
  private initialized = false;

  private constructor() {}

  static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection();
    }
    return DatabaseConnection.instance;
  }

  getDb(): Database.Database {
    if (!this.db || !this.initialized) {
      throw new Error('Datenbank nicht initialisiert. Rufe init() zuerst auf.');
    }
    return this.db;
  }

  async init(): Promise<void> {
    if (this.initialized) {
      logger.debug('Datenbank bereits initialisiert');
      return;
    }

    try {
      // Ensure directory exists
      const dbDir = dirname(config.db.path);
      if (!existsSync(dbDir)) {
        mkdirSync(dbDir, { recursive: true });
        logger.info({ dir: dbDir }, 'Datenbank-Verzeichnis erstellt');
      }

      // Open database
      this.db = new Database(config.db.path);
      logger.info({ path: config.db.path }, 'Datenbank geöffnet');

      // Set pragmas for performance and reliability
      this.db.pragma('journal_mode = WAL');
      this.db.pragma('foreign_keys = ON');
      this.db.pragma('synchronous = NORMAL');
      this.db.pragma('temp_store = MEMORY');
      this.db.pragma('mmap_size = 30000000000');
      this.db.pragma('cache_size = -64000'); // 64MB cache

      // Run migrations
      await this.runMigrations();

      this.initialized = true;
      logger.info('Datenbank erfolgreich initialisiert');
    } catch (error) {
      logger.error({ error }, 'Fehler bei Datenbank-Initialisierung');
      throw error;
    }
  }

  private async runMigrations(): Promise<void> {
    if (!this.db) return;

    // Create migrations tracking table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        filename TEXT NOT NULL UNIQUE,
        applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    const migrationsDir = join(process.cwd(), 'migrations');
    const migrationFile = '001_initial_schema.sql';
    const migrationPath = join(migrationsDir, migrationFile);

    // Check if already applied
    const applied = this.db
      .prepare('SELECT 1 FROM _migrations WHERE filename = ?')
      .get(migrationFile);

    if (!applied) {
      if (!existsSync(migrationPath)) {
        throw new Error(`Migration nicht gefunden: ${migrationPath}`);
      }

      logger.info({ migration: migrationFile }, 'Führe Migration aus');

      const migrationSql = readFileSync(migrationPath, 'utf-8');
      
      // Execute migration in transaction
      const transaction = this.db.transaction(() => {
        this.db!.exec(migrationSql);
        this.db!.prepare('INSERT INTO _migrations (filename) VALUES (?)').run(migrationFile);
      });

      transaction();
      logger.info({ migration: migrationFile }, 'Migration erfolgreich ausgeführt');
    } else {
      logger.debug({ migration: migrationFile }, 'Migration bereits angewendet');
    }
  }

  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.initialized = false;
      logger.info('Datenbank geschlossen');
    }
  }

  // Helper for transactions
  transaction<T>(fn: () => T): T {
    if (!this.db) throw new Error('Datenbank nicht initialisiert');
    return this.db.transaction(fn)();
  }
}

export const dbConnection = DatabaseConnection.getInstance();