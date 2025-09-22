import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Watchdog } from '../../../src/core/watchdog/watcher.js';
import { CalendarRepo, EventsRepo } from '../../../src/core/db/repos/index.js';
import { healthChecker } from '../../../src/core/health/health.js';
import { dbConnection } from '../../../src/core/db/connection.js';
import { rmSync, existsSync } from 'fs';
import { join } from 'path';

const TEST_DB_PATH = join(process.cwd(), 'test/fixtures/test-watchdog.db');

// Mock health checker
vi.mock('../../../src/core/health/health.js', () => ({
  healthChecker: {
    runAll: vi.fn(),
  },
}));

describe('Watchdog', () => {
  let watchdog: Watchdog;
  let calendarRepo: CalendarRepo;
  let eventsRepo: EventsRepo;

  beforeEach(async () => {
    process.env.DB_PATH = TEST_DB_PATH;
    
    // Clean up
    if (existsSync(TEST_DB_PATH)) rmSync(TEST_DB_PATH);
    if (existsSync(`${TEST_DB_PATH}-wal`)) rmSync(`${TEST_DB_PATH}-wal`);
    if (existsSync(`${TEST_DB_PATH}-shm`)) rmSync(`${TEST_DB_PATH}-shm`);
    
    await dbConnection.init();
    
    calendarRepo = new CalendarRepo();
    eventsRepo = new EventsRepo();
    
    // Create fresh watchdog instance
    watchdog = new Watchdog({
      intervalMs: 100, // Fast interval for testing
      runOnStart: false, // Don't run immediately
    });

    // Reset mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    watchdog.stop();
    dbConnection.close();
  });

  describe('start/stop', () => {
    it('should start and stop correctly', async () => {
      expect(watchdog.getStatus().running).toBe(false);
      
      await watchdog.start();
      expect(watchdog.getStatus().running).toBe(true);
      
      watchdog.stop();
      expect(watchdog.getStatus().running).toBe(false);
    });

    it('should not start twice', async () => {
      await watchdog.start();
      await watchdog.start(); // Should log warning but not fail
      
      expect(watchdog.getStatus().running).toBe(true);
      expect(watchdog.getStatus().runCount).toBeLessThanOrEqual(1);
    });

    it('should run on start if configured', async () => {
      const wd = new Watchdog({
        intervalMs: 1000,
        runOnStart: true,
      });

      vi.mocked(healthChecker.runAll).mockResolvedValueOnce({
        healthy: true,
        checks: {},
        timestamp: new Date().toISOString(),
        duration: 10,
      });

      await wd.start();
      
      expect(watchdog.getStatus().runCount).toBe(0); // Our test instance
      expect(wd.getStatus().runCount).toBe(1); // New instance
      
      wd.stop();
    });
  });

  describe('tick', () => {
    it('should run health check when enabled', async () => {
      vi.mocked(healthChecker.runAll).mockResolvedValueOnce({
        healthy: true,
        checks: {
          database: { status: 'healthy', message: 'OK' },
        },
        timestamp: new Date().toISOString(),
        duration: 10,
      });

      await watchdog.triggerTick();

      expect(healthChecker.runAll).toHaveBeenCalledOnce();
      expect(watchdog.getLastHealthCheck()?.healthy).toBe(true);
    });

    it('should handle health check failures', async () => {
      vi.mocked(healthChecker.runAll).mockResolvedValueOnce({
        healthy: false,
        checks: {
          database: { status: 'unhealthy', message: 'Connection failed' },
        },
        timestamp: new Date().toISOString(),
        duration: 10,
      });

      await watchdog.start();
      await watchdog.triggerTick();

      expect(watchdog.isHealthy()).toBe(false);
      
      // Check that error event was logged
      const events = eventsRepo.findByType('health.check_failed');
      expect(events).toHaveLength(1);
      expect(events[0].data).toContain('database');
    });

    it('should release expired calendar holds', async () => {
      // Create expired hold
      const slotId = calendarRepo.createSlot({
        calendar_id: 'test',
        start_time: new Date('2024-01-01T10:00:00'),
        end_time: new Date('2024-01-01T11:00:00'),
      });

      // Hold with 0 TTL to expire immediately
      calendarRepo.hold(slotId, 1, 0);

      await watchdog.start();
      await new Promise(resolve => setTimeout(resolve, 10)); // Let it expire
      await watchdog.triggerTick();

      // Check slot is available again
      const slot = calendarRepo.findSlotById(slotId);
      expect(slot?.is_available).toBe(true);

      // Check event was logged
      const events = eventsRepo.findByType('calendar.holds_released');
      expect(events.length).toBeGreaterThan(0);
    });

    it('should log watchdog tick event', async () => {
      await watchdog.start();
      await watchdog.triggerTick();

      const events = eventsRepo.findByType('watchdog.tick');
      expect(events).toHaveLength(1);
      
      const eventData = JSON.parse(events[0].data || '{}');
      expect(eventData).toHaveProperty('run_count', 1);
      expect(eventData).toHaveProperty('tasks_run');
    });

    it('should handle errors gracefully', async () => {
      vi.mocked(healthChecker.runAll).mockRejectedValueOnce(new Error('Test error'));

      await watchdog.start();
      await watchdog.triggerTick(); // Should not throw

      expect(watchdog.getStatus().runCount).toBe(1);
    });
  });

  describe('configuration', () => {
    it('should respect disabled health checks', async () => {
      const wd = new Watchdog({
        intervalMs: 100,
        healthCheckEnabled: false,
        calendarCleanupEnabled: true,
      });

      await wd.start();
      await wd.triggerTick();

      expect(healthChecker.runAll).not.toHaveBeenCalled();
      
      wd.stop();
    });

    it('should respect disabled calendar cleanup', async () => {
      const wd = new Watchdog({
        intervalMs: 100,
        healthCheckEnabled: true,
        calendarCleanupEnabled: false,
      });

      // Spy on releaseExpiredHolds
      const spy = vi.spyOn(calendarRepo, 'releaseExpiredHolds');

      await wd.start();
      await wd.triggerTick();

      expect(spy).not.toHaveBeenCalled();
      
      wd.stop();
    });
  });

  describe('status', () => {
    it('should track run count and last run', async () => {
      vi.mocked(healthChecker.runAll).mockResolvedValue({
        healthy: true,
        checks: {},
        timestamp: new Date().toISOString(),
        duration: 10,
      });

      await watchdog.start();
      
      expect(watchdog.getStatus().runCount).toBe(0);
      expect(watchdog.getStatus().lastRun).toBeNull();

      await watchdog.triggerTick();

      const status = watchdog.getStatus();
      expect(status.runCount).toBe(1);
      expect(status.lastRun).toBeInstanceOf(Date);
      expect(status.running).toBe(true);

      await watchdog.triggerTick();
      expect(watchdog.getStatus().runCount).toBe(2);
    });

    it('should expose health status', async () => {
      expect(watchdog.isHealthy()).toBe(false);
      expect(watchdog.getLastHealthCheck()).toBeNull();

      vi.mocked(healthChecker.runAll).mockResolvedValueOnce({
        healthy: true,
        checks: {},
        timestamp: new Date().toISOString(),
        duration: 10,
      });

      await watchdog.start();
      await watchdog.triggerTick();

      expect(watchdog.isHealthy()).toBe(true);
      expect(watchdog.getLastHealthCheck()).toBeDefined();
    });
  });

  describe('interval execution', () => {
    it('should run periodically', async () => {
      vi.mocked(healthChecker.runAll).mockResolvedValue({
        healthy: true,
        checks: {},
        timestamp: new Date().toISOString(),
        duration: 10,
      });

      await watchdog.start();
      
      // Wait for 3 intervals
      await new Promise(resolve => setTimeout(resolve, 350));
      
      const status = watchdog.getStatus();
      expect(status.runCount).toBeGreaterThanOrEqual(3);
    });
  });
});