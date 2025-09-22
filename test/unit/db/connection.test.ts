import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { existsSync, rmSync } from 'fs';
import { join } from 'path';
import { dbConnection } from '../../../src/core/db/connection.js';

const TEST_DB_PATH = join(process.cwd(), 'test/fixtures/test.db');

describe('DatabaseConnection', () => {
  beforeEach(() => {
    // Clean up test database
    if (existsSync(TEST_DB_PATH)) {
      rmSync(TEST_DB_PATH);
    }
    if (existsSync(`${TEST_DB_PATH}-wal`)) {
      rmSync(`${TEST_DB_PATH}-wal`);
    }
    if (existsSync(`${TEST_DB_PATH}-shm`)) {
      rmSync(`${TEST_DB_PATH}-shm`);
    }
  });

  afterEach(() => {
    dbConnection.close();
  });

  it('should be a singleton', () => {
    const conn1 = dbConnection;
    const conn2 = dbConnection;
    expect(conn1).toBe(conn2);
  });

  it('should throw error when accessing db before init', () => {
    expect(() => dbConnection.getDb()).toThrow('Datenbank nicht initialisiert');
  });

  it('should initialize database successfully', async () => {
    await dbConnection.init();
    const db = dbConnection.getDb();
    expect(db).toBeDefined();
    expect(db.open).toBe(true);
  });

  it('should run migrations on first init', async () => {
    await dbConnection.init();
    const db = dbConnection.getDb();
    
    // Check migrations table exists
    const tables = db.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='_migrations'"
    ).all();
    expect(tables).toHaveLength(1);
    
    // Check initial migration was applied
    const migrations = db.prepare('SELECT * FROM _migrations').all();
    expect(migrations).toHaveLength(1);
    expect(migrations[0]).toHaveProperty('filename', '001_initial_schema.sql');
  });

  it('should not re-run migrations on subsequent init', async () => {
    // First init
    await dbConnection.init();
    dbConnection.close();
    
    // Second init
    await dbConnection.init();
    const db = dbConnection.getDb();
    
    const migrations = db.prepare('SELECT * FROM _migrations').all();
    expect(migrations).toHaveLength(1);
  });

  it('should set correct pragmas', async () => {
    await dbConnection.init();
    const db = dbConnection.getDb();
    
    const journalMode = db.pragma('journal_mode', { simple: true });
    const foreignKeys = db.pragma('foreign_keys', { simple: true });
    
    expect(journalMode).toBe('wal');
    expect(foreignKeys).toBe(1);
  });

  it('should handle transactions', async () => {
    await dbConnection.init();
    
    let executed = false;
    const result = dbConnection.transaction(() => {
      executed = true;
      return 42;
    });
    
    expect(executed).toBe(true);
    expect(result).toBe(42);
  });

  it('should rollback transaction on error', async () => {
    await dbConnection.init();
    const db = dbConnection.getDb();
    
    // Insert test data
    db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)').run('test', 'value');
    
    expect(() => {
      dbConnection.transaction(() => {
        db.prepare('UPDATE settings SET value = ? WHERE key = ?').run('new', 'test');
        throw new Error('Rollback test');
      });
    }).toThrow('Rollback test');
    
    // Check value was not updated
    const value = db.prepare('SELECT value FROM settings WHERE key = ?').get('test');
    expect(value).toHaveProperty('value', 'value');
  });

  it('should close database properly', async () => {
    await dbConnection.init();
    const db = dbConnection.getDb();
    
    dbConnection.close();
    expect(db.open).toBe(false);
    
    // Should throw when trying to access after close
    expect(() => dbConnection.getDb()).toThrow('Datenbank nicht initialisiert');
  });
});