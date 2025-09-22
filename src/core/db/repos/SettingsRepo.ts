import { dbConnection } from '../connection.js';
import type { Database } from 'better-sqlite3';

export interface SettingRow {
  key: string;
  value: string;
  updated_at: string;
}

export class SettingsRepo {
  private db: Database.Database;

  constructor() {
    this.db = dbConnection.getDb();
  }

  get(key: string): string | undefined {
    const stmt = this.db.prepare(`
      SELECT value FROM settings WHERE key = @key
    `);

    const result = stmt.get({ key }) as { value: string } | undefined;
    return result?.value;
  }

  set(key: string, value: string): void {
    const stmt = this.db.prepare(`
      INSERT INTO settings (key, value) 
      VALUES (@key, @value)
      ON CONFLICT(key) DO UPDATE SET
        value = excluded.value,
        updated_at = CURRENT_TIMESTAMP
    `);

    stmt.run({ key, value });
  }

  getBoolean(key: string, defaultValue = false): boolean {
    const value = this.get(key);
    if (value === undefined) return defaultValue;
    return value === 'true' || value === '1';
  }

  setBoolean(key: string, value: boolean): void {
    this.set(key, value ? 'true' : 'false');
  }

  getNumber(key: string, defaultValue = 0): number {
    const value = this.get(key);
    if (value === undefined) return defaultValue;
    const num = parseFloat(value);
    return isNaN(num) ? defaultValue : num;
  }

  setNumber(key: string, value: number): void {
    this.set(key, value.toString());
  }

  getJSON<T = unknown>(key: string, defaultValue?: T): T | undefined {
    const value = this.get(key);
    if (value === undefined) return defaultValue;
    try {
      return JSON.parse(value) as T;
    } catch {
      return defaultValue;
    }
  }

  setJSON(key: string, value: unknown): void {
    this.set(key, JSON.stringify(value));
  }

  delete(key: string): void {
    const stmt = this.db.prepare(`
      DELETE FROM settings WHERE key = @key
    `);

    stmt.run({ key });
  }

  getAll(): SettingRow[] {
    const stmt = this.db.prepare(`
      SELECT * FROM settings ORDER BY key ASC
    `);

    return stmt.all() as SettingRow[];
  }

  getAllByPrefix(prefix: string): SettingRow[] {
    const stmt = this.db.prepare(`
      SELECT * FROM settings 
      WHERE key LIKE @pattern 
      ORDER BY key ASC
    `);

    return stmt.all({ pattern: `${prefix}%` }) as SettingRow[];
  }

  // Batch operations
  setMultiple(settings: Record<string, string>): void {
    const transaction = this.db.transaction(() => {
      for (const [key, value] of Object.entries(settings)) {
        this.set(key, value);
      }
    });

    transaction();
  }

  deleteByPrefix(prefix: string): number {
    const stmt = this.db.prepare(`
      DELETE FROM settings WHERE key LIKE @pattern
    `);

    const result = stmt.run({ pattern: `${prefix}%` });
    return result.changes;
  }

  // Standard-Einstellungen initialisieren
  initializeDefaults(defaults: Record<string, string>): void {
    const transaction = this.db.transaction(() => {
      for (const [key, value] of Object.entries(defaults)) {
        // Nur setzen wenn noch nicht vorhanden
        const existing = this.get(key);
        if (existing === undefined) {
          this.set(key, value);
        }
      }
    });

    transaction();
  }
}