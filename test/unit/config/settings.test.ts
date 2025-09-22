import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TypedSettings } from '../../../src/core/config/settings.js';
import { dbConnection } from '../../../src/core/db/connection.js';
import { rmSync, existsSync } from 'fs';
import { join } from 'path';

const TEST_DB_PATH = join(process.cwd(), 'test/fixtures/test-settings.db');

describe('TypedSettings', () => {
  let settings: TypedSettings;

  beforeEach(async () => {
    process.env.DB_PATH = TEST_DB_PATH;
    
    // Clean up
    if (existsSync(TEST_DB_PATH)) rmSync(TEST_DB_PATH);
    if (existsSync(`${TEST_DB_PATH}-wal`)) rmSync(`${TEST_DB_PATH}-wal`);
    if (existsSync(`${TEST_DB_PATH}-shm`)) rmSync(`${TEST_DB_PATH}-shm`);
    
    await dbConnection.init();
    settings = new TypedSettings();
    settings.clearCache();
  });

  afterEach(() => {
    dbConnection.close();
  });

  describe('boolean settings', () => {
    it('should get and set boolean values', () => {
      expect(settings.autoSendEnabled).toBe(false); // default
      
      settings.autoSendEnabled = true;
      expect(settings.autoSendEnabled).toBe(true);
      
      settings.autoSendEnabled = false;
      expect(settings.autoSendEnabled).toBe(false);
    });

    it('should persist boolean values', () => {
      settings.requireManualApproval = false;
      settings.clearCache();
      
      expect(settings.requireManualApproval).toBe(false);
    });
  });

  describe('number settings', () => {
    it('should get and set number values', () => {
      expect(settings.autoSendConfidenceThreshold).toBe(0.95); // default
      
      settings.autoSendConfidenceThreshold = 0.85;
      expect(settings.autoSendConfidenceThreshold).toBe(0.85);
    });

    it('should handle holdExpiryMinutes', () => {
      expect(settings.holdExpiryMinutes).toBe(30); // default
      
      settings.holdExpiryMinutes = 45;
      expect(settings.holdExpiryMinutes).toBe(45);
    });
  });

  describe('string settings', () => {
    it('should get and set string values', () => {
      expect(settings.workingHoursStart).toBe('08:00');
      expect(settings.workingHoursEnd).toBe('18:00');
      
      settings.workingHoursStart = '09:00';
      settings.workingHoursEnd = '17:00';
      
      expect(settings.workingHoursStart).toBe('09:00');
      expect(settings.workingHoursEnd).toBe('17:00');
    });
  });

  describe('array settings', () => {
    it('should get and set array values', () => {
      expect(settings.workingDays).toEqual([1, 2, 3, 4, 5]); // Mo-Fr
      
      settings.workingDays = [1, 2, 3, 4, 5, 6]; // Mo-Sa
      expect(settings.workingDays).toEqual([1, 2, 3, 4, 5, 6]);
    });
  });

  describe('helper methods', () => {
    describe('isWorkingTime', () => {
      it('should return true during working hours', () => {
        const tuesday10am = new Date('2024-01-02T10:00:00');
        tuesday10am.getDay = () => 2; // Tuesday
        
        expect(settings.isWorkingTime(tuesday10am)).toBe(true);
      });

      it('should return false outside working hours', () => {
        const tuesday6am = new Date('2024-01-02T06:00:00');
        tuesday6am.getDay = () => 2; // Tuesday
        
        expect(settings.isWorkingTime(tuesday6am)).toBe(false);
      });

      it('should return false on non-working days', () => {
        const sunday10am = new Date('2024-01-07T10:00:00');
        sunday10am.getDay = () => 0; // Sunday
        
        expect(settings.isWorkingTime(sunday10am)).toBe(false);
      });
    });

    describe('canAutoSend', () => {
      it('should check all conditions', () => {
        settings.autoSendEnabled = true;
        settings.autoSendConfidenceThreshold = 0.9;
        settings.requireManualApproval = false;
        
        expect(settings.canAutoSend(0.95)).toBe(true);
        expect(settings.canAutoSend(0.85)).toBe(false);
        
        settings.requireManualApproval = true;
        expect(settings.canAutoSend(0.95)).toBe(false);
        
        settings.autoSendEnabled = false;
        expect(settings.canAutoSend(0.95)).toBe(false);
      });
    });

    describe('shouldProcess', () => {
      it('should check score threshold', () => {
        settings.scoreGateThreshold = 0.8;
        
        expect(settings.shouldProcess(0.85)).toBe(true);
        expect(settings.shouldProcess(0.75)).toBe(false);
        expect(settings.shouldProcess(0.8)).toBe(true);
      });
    });
  });

  describe('getAll', () => {
    it('should return all settings', () => {
      const all = settings.getAll();
      
      expect(all).toHaveProperty('autoSendEnabled');
      expect(all).toHaveProperty('autoSendConfidenceThreshold');
      expect(all).toHaveProperty('workingHoursStart');
      expect(all).toHaveProperty('workingDays');
      expect(all).toHaveProperty('holdExpiryMinutes');
    });
  });

  describe('reset', () => {
    it('should reset all settings to defaults', () => {
      // Change some settings
      settings.autoSendEnabled = true;
      settings.holdExpiryMinutes = 60;
      settings.workingDays = [1, 2, 3];
      
      // Reset
      settings.reset();
      
      // Check defaults restored
      expect(settings.autoSendEnabled).toBe(false);
      expect(settings.holdExpiryMinutes).toBe(30);
      expect(settings.workingDays).toEqual([1, 2, 3, 4, 5]);
    });
  });

  describe('caching', () => {
    it('should cache values for performance', () => {
      // First access - from DB
      const value1 = settings.autoSendConfidenceThreshold;
      
      // Change in DB directly (simulate external change)
      const db = dbConnection.getDb();
      db.prepare('UPDATE settings SET value = ? WHERE key = ?')
        .run('0.75', 'auto_send_confidence_threshold');
      
      // Second access - should be from cache
      const value2 = settings.autoSendConfidenceThreshold;
      expect(value2).toBe(value1);
      
      // Clear cache and access again
      settings.clearCache();
      const value3 = settings.autoSendConfidenceThreshold;
      expect(value3).toBe(0.75);
    });
  });
});