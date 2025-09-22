import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { HealthChecker } from '../../../src/core/health/health.js';
import { dbConnection } from '../../../src/core/db/connection.js';
import { rmSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

const TEST_DB_PATH = join(process.cwd(), 'test/fixtures/test-health.db');

// Mock fetch for Ollama tests
global.fetch = vi.fn();

describe('HealthChecker', () => {
  let healthChecker: HealthChecker;

  beforeEach(async () => {
    process.env.DB_PATH = TEST_DB_PATH;
    process.env.NODE_ENV = 'test';
    process.env.LOG_LEVEL = 'debug';
    process.env.GMAIL_ENABLED = 'true';
    process.env.GMAIL_EMAIL = 'test@gmail.com';
    process.env.GMAIL_CLIENT_ID = 'test-client-id';
    process.env.GMAIL_CLIENT_SECRET = 'test-secret';
    process.env.AI_PROVIDER = 'ollama';
    process.env.OLLAMA_URL = 'http://localhost:11434';
    
    // Clean up and create test directory
    const testDir = join(process.cwd(), 'test/fixtures');
    if (!existsSync(testDir)) {
      mkdirSync(testDir, { recursive: true });
    }
    if (existsSync(TEST_DB_PATH)) rmSync(TEST_DB_PATH);
    if (existsSync(`${TEST_DB_PATH}-wal`)) rmSync(`${TEST_DB_PATH}-wal`);
    if (existsSync(`${TEST_DB_PATH}-shm`)) rmSync(`${TEST_DB_PATH}-shm`);
    
    await dbConnection.init();
    healthChecker = new HealthChecker();
    
    // Reset fetch mock
    vi.mocked(fetch).mockReset();
  });

  afterEach(() => {
    dbConnection.close();
    vi.clearAllMocks();
  });

  describe('database check', () => {
    it('should return healthy when database is accessible', async () => {
      const result = await healthChecker.runCheck('database');
      
      expect(result.status).toBe('healthy');
      expect(result.message).toBe('Database connection OK');
      expect(result.details).toHaveProperty('tables');
      expect(result.duration).toBeGreaterThan(0);
    });

    it('should return unhealthy when database is not initialized', async () => {
      // Close connection to simulate error
      dbConnection.close();
      
      const result = await healthChecker.runCheck('database');
      
      expect(result.status).toBe('unhealthy');
      expect(result.message).toContain('Database error');
    });
  });

  describe('filesystem check', () => {
    it('should return healthy when filesystem is writable', async () => {
      const result = await healthChecker.runCheck('filesystem');
      
      expect(result.status).toBe('healthy');
      expect(result.message).toBe('File system permissions OK');
      expect(result.details).toHaveProperty('path');
    });
  });

  describe('environment check', () => {
    it('should return healthy when all required env vars are set', async () => {
      const result = await healthChecker.runCheck('environment');
      
      expect(result.status).toBe('healthy');
      expect(result.message).toBe('Environment configuration OK');
      expect(result.details).toHaveProperty('env', 'test');
    });

    it('should return unhealthy when required env vars are missing', async () => {
      delete process.env.NODE_ENV;
      
      const checker = new HealthChecker();
      const result = await checker.runCheck('environment');
      
      expect(result.status).toBe('unhealthy');
      expect(result.message).toBe('Missing required environment variables');
      expect(result.details?.missing).toContain('NODE_ENV');
    });

    it('should check conditional Gmail vars when enabled', async () => {
      delete process.env.GMAIL_CLIENT_SECRET;
      
      const checker = new HealthChecker();
      const result = await checker.runCheck('environment');
      
      expect(result.status).toBe('unhealthy');
      expect(result.details?.missing).toContain('GMAIL_CLIENT_SECRET');
    });
  });

  describe('ollama check', () => {
    it('should return healthy when Ollama is reachable', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
      } as Response);
      
      const result = await healthChecker.runCheck('ollama');
      
      expect(result.status).toBe('healthy');
      expect(result.message).toBe('Ollama service reachable');
      expect(result.details).toHaveProperty('url', 'http://localhost:11434');
    });

    it('should return warning when Ollama is unreachable', async () => {
      vi.mocked(fetch).mockRejectedValueOnce(new Error('Connection refused'));
      
      const result = await healthChecker.runCheck('ollama');
      
      expect(result.status).toBe('warning');
      expect(result.message).toContain('Ollama unreachable');
    });

    it('should handle timeout', async () => {
      vi.mocked(fetch).mockImplementationOnce(() => 
        new Promise((_, reject) => {
          setTimeout(() => {
            const error = new Error('Aborted');
            error.name = 'AbortError';
            reject(error);
          }, 100);
        })
      );
      
      const result = await healthChecker.runCheck('ollama');
      
      expect(result.status).toBe('warning');
      expect(result.message).toContain('Timeout');
    });

    it('should skip check when not using ollama', async () => {
      process.env.AI_PROVIDER = 'openai';
      
      const checker = new HealthChecker();
      const result = await checker.runCheck('ollama');
      
      expect(result.status).toBe('healthy');
      expect(result.message).toBe('Ollama check skipped (not configured)');
    });
  });

  describe('email check', () => {
    it('should return healthy when OAuth is configured', async () => {
      process.env.GMAIL_REFRESH_TOKEN = 'test-refresh-token';
      
      const checker = new HealthChecker();
      const result = await checker.runCheck('email');
      
      expect(result.status).toBe('healthy');
      expect(result.message).toBe('Email providers configured');
      expect(result.details).toHaveProperty('gmail', 'OAuth configured');
    });

    it('should return warning when OAuth is not configured', async () => {
      const result = await healthChecker.runCheck('email');
      
      expect(result.status).toBe('warning');
      expect(result.message).toBe('Email configuration incomplete');
      expect(result.details).toHaveProperty('gmail');
    });
  });

  describe('runAll', () => {
    it('should run all health checks', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
      } as Response);
      
      const result = await healthChecker.runAll();
      
      expect(result.healthy).toBe(false); // Because email OAuth is not configured
      expect(result.checks).toHaveProperty('database');
      expect(result.checks).toHaveProperty('filesystem');
      expect(result.checks).toHaveProperty('environment');
      expect(result.checks).toHaveProperty('ollama');
      expect(result.checks).toHaveProperty('email');
      expect(result.timestamp).toBeDefined();
      expect(result.duration).toBeGreaterThan(0);
    });

    it('should mark as unhealthy if any critical check fails', async () => {
      // Close DB to cause failure
      dbConnection.close();
      
      const result = await healthChecker.runAll();
      
      expect(result.healthy).toBe(false);
      expect(result.checks.database.status).toBe('unhealthy');
    });
  });

  describe('runCritical', () => {
    it('should only run critical checks', async () => {
      const result = await healthChecker.runCritical();
      
      expect(result.checks).toHaveProperty('database');
      expect(result.checks).toHaveProperty('filesystem');
      expect(result.checks).toHaveProperty('environment');
      expect(result.checks).not.toHaveProperty('ollama');
      expect(result.checks).not.toHaveProperty('email');
    });
  });

  describe('custom checks', () => {
    it('should allow registering custom checks', async () => {
      healthChecker.register('custom', async () => ({
        status: 'healthy',
        message: 'Custom check passed',
      }));
      
      const result = await healthChecker.runCheck('custom');
      
      expect(result.status).toBe('healthy');
      expect(result.message).toBe('Custom check passed');
    });

    it('should handle errors in custom checks', async () => {
      healthChecker.register('failing', async () => {
        throw new Error('Custom check error');
      });
      
      const result = await healthChecker.runCheck('failing');
      
      expect(result.status).toBe('unhealthy');
      expect(result.message).toContain('Custom check error');
    });
  });
});