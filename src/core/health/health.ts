import { accessSync, constants, writeFileSync, unlinkSync } from 'fs';
import { join, dirname } from 'path';
import { config } from '../config/index.js';
import { dbConnection } from '../db/connection.js';
import { loggers, logError } from '../logger/index.js';
import { randomBytes } from 'crypto';

const logger = loggers.health;

export interface HealthCheckResult {
  healthy: boolean;
  checks: Record<string, CheckResult>;
  timestamp: string;
  duration: number;
}

export interface CheckResult {
  status: 'healthy' | 'unhealthy' | 'warning';
  message: string;
  details?: Record<string, unknown>;
  duration?: number;
}

export class HealthChecker {
  private checks: Map<string, () => Promise<CheckResult>> = new Map();

  constructor() {
    this.registerDefaultChecks();
  }

  private registerDefaultChecks() {
    // Database connectivity
    this.register('database', async () => {
      const start = Date.now();
      try {
        const db = dbConnection.getDb();
        const result = db.prepare('SELECT 1 as check').get() as { check: number };
        
        if (result.check !== 1) {
          throw new Error('Unexpected database response');
        }

        // Check table existence
        const tables = db.prepare(
          "SELECT COUNT(*) as count FROM sqlite_master WHERE type='table' AND name IN ('emails', 'drafts', 'settings')"
        ).get() as { count: number };

        return {
          status: 'healthy',
          message: 'Database connection OK',
          details: { tables: tables.count, responseTime: Date.now() - start },
          duration: Date.now() - start,
        };
      } catch (error) {
        logError(logger, error, 'Database health check failed');
        return {
          status: 'unhealthy',
          message: `Database error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          duration: Date.now() - start,
        };
      }
    });

    // File system write permissions
    this.register('filesystem', async () => {
      const start = Date.now();
      const testFile = join(dirname(config.db.path), `.health-check-${randomBytes(6).toString('hex')}`);
      
      try {
        // Test write
        writeFileSync(testFile, 'health-check');
        
        // Test read
        accessSync(testFile, constants.R_OK | constants.W_OK);
        
        // Cleanup
        unlinkSync(testFile);

        return {
          status: 'healthy',
          message: 'File system permissions OK',
          details: { path: dirname(config.db.path) },
          duration: Date.now() - start,
        };
      } catch (error) {
        logError(logger, error, 'Filesystem health check failed');
        return {
          status: 'unhealthy',
          message: `Filesystem error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          duration: Date.now() - start,
        };
      }
    });

    // Environment configuration
    this.register('environment', async () => {
      const required = [
        'NODE_ENV',
        'LOG_LEVEL',
        'DB_PATH',
      ];

      const conditionalRequired: Array<{ condition: boolean; keys: string[] }> = [
        {
          condition: config.gmail.enabled,
          keys: ['GMAIL_EMAIL', 'GMAIL_CLIENT_ID', 'GMAIL_CLIENT_SECRET'],
        },
        {
          condition: config.outlook.enabled,
          keys: ['OUTLOOK_EMAIL', 'OUTLOOK_CLIENT_ID', 'OUTLOOK_CLIENT_SECRET'],
        },
        {
          condition: config.ai.provider === 'ollama',
          keys: ['OLLAMA_URL'],
        },
      ];

      const missing: string[] = [];
      
      // Check required
      for (const key of required) {
        if (!process.env[key]) {
          missing.push(key);
        }
      }

      // Check conditional
      for (const check of conditionalRequired) {
        if (check.condition) {
          for (const key of check.keys) {
            if (!process.env[key]) {
              missing.push(key);
            }
          }
        }
      }

      if (missing.length > 0) {
        return {
          status: 'unhealthy',
          message: 'Missing required environment variables',
          details: { missing },
        };
      }

      return {
        status: 'healthy',
        message: 'Environment configuration OK',
        details: { 
          env: config.env,
          emailProvider: config.gmail.enabled ? 'gmail' : 'outlook',
          aiProvider: config.ai.provider,
        },
      };
    });

    // Ollama connectivity
    this.register('ollama', async () => {
      if (config.ai.provider !== 'ollama') {
        return {
          status: 'healthy',
          message: 'Ollama check skipped (not configured)',
        };
      }

      const start = Date.now();
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

      try {
        const healthUrl = new URL('/api/tags', config.ai.ollamaUrl);
        const response = await fetch(healthUrl.toString(), {
          method: 'GET',
          signal: controller.signal,
        });

        clearTimeout(timeout);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return {
          status: 'healthy',
          message: 'Ollama service reachable',
          details: { 
            url: config.ai.ollamaUrl,
            responseTime: Date.now() - start,
            model: config.ai.model,
          },
          duration: Date.now() - start,
        };
      } catch (error) {
        clearTimeout(timeout);
        const isTimeout = error instanceof Error && error.name === 'AbortError';
        
        logError(logger, error, 'Ollama health check failed');
        
        return {
          status: 'warning', // Warning because AI might be optional
          message: `Ollama unreachable: ${isTimeout ? 'Timeout' : error instanceof Error ? error.message : 'Unknown error'}`,
          details: { url: config.ai.ollamaUrl },
          duration: Date.now() - start,
        };
      }
    });

    // Email connectivity (dry check)
    this.register('email', async () => {
      const checks: Record<string, string> = {};

      if (config.gmail.enabled) {
        // For Gmail, we just check if OAuth credentials are present
        if (config.gmail.refreshToken) {
          checks.gmail = 'OAuth configured';
        } else {
          checks.gmail = 'OAuth not configured (refresh token missing)';
        }
      }

      if (config.outlook.enabled) {
        // For Outlook, check if credentials are present
        if (config.outlook.clientSecret) {
          checks.outlook = 'OAuth configured';
        } else {
          checks.outlook = 'OAuth not configured';
        }
      }

      const hasIssues = Object.values(checks).some(v => v.includes('not configured'));

      return {
        status: hasIssues ? 'warning' : 'healthy',
        message: hasIssues ? 'Email configuration incomplete' : 'Email providers configured',
        details: checks,
      };
    });
  }

  register(name: string, check: () => Promise<CheckResult>) {
    this.checks.set(name, check);
  }

  async runCheck(name: string): Promise<CheckResult> {
    const check = this.checks.get(name);
    if (!check) {
      return {
        status: 'unhealthy',
        message: `Unknown check: ${name}`,
      };
    }

    try {
      return await check();
    } catch (error) {
      logError(logger, error, `Health check ${name} threw error`);
      return {
        status: 'unhealthy',
        message: `Check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  async runAll(): Promise<HealthCheckResult> {
    const start = Date.now();
    const results: Record<string, CheckResult> = {};
    let healthy = true;

    logger.info('Running health checks...');

    for (const [name, check] of this.checks) {
      logger.debug({ check: name }, 'Running health check');
      
      try {
        const result = await check();
        results[name] = result;
        
        if (result.status === 'unhealthy') {
          healthy = false;
          logger.error({ check: name, result }, 'Health check failed');
        } else if (result.status === 'warning') {
          logger.warn({ check: name, result }, 'Health check warning');
        } else {
          logger.debug({ check: name, duration: result.duration }, 'Health check passed');
        }
      } catch (error) {
        healthy = false;
        results[name] = {
          status: 'unhealthy',
          message: `Check error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        };
        logError(logger, error, `Health check ${name} failed`);
      }
    }

    const duration = Date.now() - start;
    const result = {
      healthy,
      checks: results,
      timestamp: new Date().toISOString(),
      duration,
    };

    logger.info({ healthy, duration, failedChecks: Object.entries(results).filter(([_, r]) => r.status === 'unhealthy').map(([n]) => n) }, 'Health check completed');

    return result;
  }

  async runCritical(): Promise<HealthCheckResult> {
    // Run only critical checks (DB, FS, ENV)
    const critical = ['database', 'filesystem', 'environment'];
    const start = Date.now();
    const results: Record<string, CheckResult> = {};
    let healthy = true;

    for (const name of critical) {
      const result = await this.runCheck(name);
      results[name] = result;
      if (result.status === 'unhealthy') {
        healthy = false;
      }
    }

    return {
      healthy,
      checks: results,
      timestamp: new Date().toISOString(),
      duration: Date.now() - start,
    };
  }
}

// Singleton instance
export const healthChecker = new HealthChecker();