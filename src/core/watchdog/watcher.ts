import { healthChecker, type HealthCheckResult } from '../health/health.js';
import { CalendarRepo, EventsRepo } from '../db/repos/index.js';
import { loggers, logError, logPerformance } from '../logger/index.js';
import { auditLogger } from '../events/audit.js';

const logger = loggers.watchdog;

export interface WatchdogConfig {
  intervalMs: number;
  healthCheckEnabled: boolean;
  calendarCleanupEnabled: boolean;
  runOnStart: boolean;
}

export const DEFAULT_WATCHDOG_CONFIG: WatchdogConfig = {
  intervalMs: 60000, // 60 seconds
  healthCheckEnabled: true,
  calendarCleanupEnabled: true,
  runOnStart: true,
};

export class Watchdog {
  private config: WatchdogConfig;
  private intervalId: NodeJS.Timeout | null = null;
  private running = false;
  private lastRun: Date | null = null;
  private lastHealthResult: HealthCheckResult | null = null;
  private runCount = 0;
  private calendarRepo: CalendarRepo;
  private eventsRepo: EventsRepo;

  constructor(config: Partial<WatchdogConfig> = {}) {
    this.config = { ...DEFAULT_WATCHDOG_CONFIG, ...config };
    this.calendarRepo = new CalendarRepo();
    this.eventsRepo = new EventsRepo();
  }

  async start(): Promise<void> {
    if (this.running) {
      logger.warn('Watchdog already running');
      return;
    }

    logger.info({ config: this.config }, 'Starting watchdog');
    this.running = true;

    // Run immediately if configured
    if (this.config.runOnStart) {
      await this.tick();
    }

    // Set up interval
    this.intervalId = setInterval(async () => {
      await this.tick();
    }, this.config.intervalMs);

    logger.info('Watchdog started successfully');
  }

  stop(): void {
    if (!this.running) {
      logger.warn('Watchdog not running');
      return;
    }

    logger.info('Stopping watchdog');

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    this.running = false;
    logger.info({ totalRuns: this.runCount }, 'Watchdog stopped');
  }

  async tick(): Promise<void> {
    const tickStart = Date.now();
    this.runCount++;
    
    logger.debug({ run: this.runCount }, 'Watchdog tick started');

    try {
      const tasks: Array<{ name: string; promise: Promise<unknown> }> = [];

      // Health checks
      if (this.config.healthCheckEnabled) {
        tasks.push({
          name: 'health_check',
          promise: this.runHealthCheck(),
        });
      }

      // Calendar cleanup
      if (this.config.calendarCleanupEnabled) {
        tasks.push({
          name: 'calendar_cleanup',
          promise: this.cleanupExpiredHolds(),
        });
      }

      // Run all tasks
      const results = await Promise.allSettled(tasks.map(t => t.promise));
      
      // Log results
      results.forEach((result, index) => {
        const task = tasks[index];
        if (result.status === 'rejected') {
          logError(logger, result.reason, `Watchdog task failed: ${task.name}`);
        }
      });

      // Log watchdog event
      this.eventsRepo.append(null, 'watchdog.tick', {
        run_count: this.runCount,
        tasks_run: tasks.map(t => t.name),
        duration_ms: Date.now() - tickStart,
        health_status: this.lastHealthResult?.healthy,
      });

      this.lastRun = new Date();
      
      logPerformance(logger, 'watchdog_tick', Date.now() - tickStart, {
        run: this.runCount,
        tasksRun: tasks.length,
      });

    } catch (error) {
      logError(logger, error, 'Watchdog tick failed', { run: this.runCount });
      auditLogger.logError(null, error as Error, { context: 'watchdog_tick', run: this.runCount });
    }
  }

  private async runHealthCheck(): Promise<void> {
    const start = Date.now();
    
    try {
      logger.debug('Running health check');
      const result = await healthChecker.runAll();
      this.lastHealthResult = result;

      // Log critical issues
      const unhealthyChecks = Object.entries(result.checks)
        .filter(([_, check]) => check.status === 'unhealthy')
        .map(([name, check]) => ({ name, message: check.message }));

      if (unhealthyChecks.length > 0) {
        logger.error({ unhealthyChecks }, 'Health check found issues');
        
        // Log each unhealthy check as an event
        for (const check of unhealthyChecks) {
          this.eventsRepo.append(null, 'health.check_failed', {
            check_name: check.name,
            message: check.message,
            run_count: this.runCount,
          });
        }
      } else {
        logger.debug({ duration: Date.now() - start }, 'Health check completed successfully');
      }

      // Log warnings
      const warningChecks = Object.entries(result.checks)
        .filter(([_, check]) => check.status === 'warning')
        .map(([name]) => name);

      if (warningChecks.length > 0) {
        logger.warn({ warningChecks }, 'Health check warnings');
      }

    } catch (error) {
      logError(logger, error, 'Health check error');
    }
  }

  private async cleanupExpiredHolds(): Promise<void> {
    const start = Date.now();
    
    try {
      logger.debug('Cleaning up expired calendar holds');
      const released = this.calendarRepo.releaseExpiredHolds();

      if (released > 0) {
        logger.info({ releasedCount: released }, 'Released expired calendar holds');
        
        this.eventsRepo.append(null, 'calendar.holds_released', {
          count: released,
          run_count: this.runCount,
        });
      }

      logPerformance(logger, 'calendar_cleanup', Date.now() - start, { released });

    } catch (error) {
      logError(logger, error, 'Calendar cleanup error');
    }
  }

  // Getters for monitoring
  getStatus(): {
    running: boolean;
    lastRun: Date | null;
    runCount: number;
    lastHealthResult: HealthCheckResult | null;
    config: WatchdogConfig;
  } {
    return {
      running: this.running,
      lastRun: this.lastRun,
      runCount: this.runCount,
      lastHealthResult: this.lastHealthResult,
      config: this.config,
    };
  }

  isHealthy(): boolean {
    return this.lastHealthResult?.healthy ?? false;
  }

  getLastHealthCheck(): HealthCheckResult | null {
    return this.lastHealthResult;
  }

  // Manual trigger for testing
  async triggerTick(): Promise<void> {
    if (!this.running) {
      throw new Error('Watchdog not running');
    }
    await this.tick();
  }
}

// Singleton instance
export const watchdog = new Watchdog();