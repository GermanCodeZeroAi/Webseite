import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { GuardDecisionMaker, EmailContext } from '../../../../src/pipeline/decide/guard.js';
import { EventsRepo } from '../../../../src/core/db/repos/EventsRepo.js';
import { EmailsRepo } from '../../../../src/core/db/repos/EmailsRepo.js';
import { guardPolicy } from '../../../../src/ai/guard/policy.js';

// Mock logger
vi.mock('../../../../src/core/logger/index.js', () => ({
  createLogger: vi.fn(() => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn()
  }))
}));

// Mock the database repositories
vi.mock('../../../../src/core/db/repos/EventsRepo.js');
vi.mock('../../../../src/core/db/repos/EmailsRepo.js');
vi.mock('../../../../src/ai/guard/policy.js', () => ({
  guardPolicy: {
    evaluate: vi.fn()
  }
}));

describe('GuardDecisionMaker', () => {
  let guardDecisionMaker: GuardDecisionMaker;
  let mockEventsRepo: any;
  let mockEmailsRepo: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Create new instance for each test
    guardDecisionMaker = new GuardDecisionMaker();
    
    // Get mocked instances
    mockEventsRepo = (guardDecisionMaker as any).eventsRepo;
    mockEmailsRepo = (guardDecisionMaker as any).emailsRepo;

    // Setup default mock behavior
    mockEventsRepo.logEvent = vi.fn().mockResolvedValue(1);
    mockEmailsRepo.updateMetadata = vi.fn().mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('decide', () => {
    it('should return auto-reply decision when policy approves', async () => {
      const context: EmailContext = {
        emailId: 123,
        klass: 'appointment_request',
        confidence: 0.98,
        flags: [],
        details: { type: 'routine' },
        state: 'classified'
      };

      vi.mocked(guardPolicy.evaluate).mockReturnValue({
        auto: true,
        reason: 'all_checks_passed',
        escalateFlags: []
      });

      const decision = await guardDecisionMaker.decide(context);

      expect(decision).toMatchObject({
        emailId: 123,
        shouldAutoReply: true,
        escalationReason: undefined,
        escalationFlags: []
      });

      // Verify event was logged
      expect(mockEventsRepo.logEvent).toHaveBeenCalledWith(
        'GUARD_APPROVED',
        'guard',
        expect.objectContaining({
          emailId: 123,
          decision: 'auto_reply'
        })
      );

      // Verify email was not updated (no escalation)
      expect(mockEmailsRepo.updateMetadata).not.toHaveBeenCalled();
    });

    it('should return escalation decision when policy rejects', async () => {
      const context: EmailContext = {
        emailId: 456,
        klass: 'rezept_anfrage',
        confidence: 0.96,
        flags: [],
        details: { medication: 'Antibiotics' },
        state: 'classified'
      };

      vi.mocked(guardPolicy.evaluate).mockReturnValue({
        auto: false,
        reason: 'sensitive_rezept_anfrage',
        escalateFlags: ['SENSITIVE_CATEGORY']
      });

      const decision = await guardDecisionMaker.decide(context);

      expect(decision).toMatchObject({
        emailId: 456,
        shouldAutoReply: false,
        escalationReason: 'sensitive_rezept_anfrage',
        escalationFlags: ['SENSITIVE_CATEGORY']
      });

      // Verify events were logged
      expect(mockEventsRepo.logEvent).toHaveBeenCalledWith(
        'ESCALATED',
        'guard',
        expect.objectContaining({
          emailId: 456,
          decision: 'escalate',
          escalationReason: 'sensitive_rezept_anfrage'
        })
      );

      expect(mockEventsRepo.logEvent).toHaveBeenCalledWith(
        'EMAIL_ESCALATED',
        'guard',
        expect.objectContaining({
          emailId: 456,
          reason: 'sensitive_rezept_anfrage',
          newState: 'ESCALATED'
        })
      );

      // Verify email metadata was updated
      expect(mockEmailsRepo.updateMetadata).toHaveBeenCalledWith(
        456,
        expect.objectContaining({
          state: 'ESCALATED',
          escalationReason: 'sensitive_rezept_anfrage'
        })
      );
    });

    it('should handle errors gracefully and escalate', async () => {
      const context: EmailContext = {
        emailId: 789,
        klass: 'appointment_request',
        confidence: 0.97,
        flags: [],
        details: {},
        state: 'classified'
      };

      // Mock policy to throw error
      vi.mocked(guardPolicy.evaluate).mockImplementation(() => {
        throw new Error('Policy evaluation failed');
      });

      const decision = await guardDecisionMaker.decide(context);

      expect(decision).toMatchObject({
        emailId: 789,
        shouldAutoReply: false,
        escalationReason: 'guard_error',
        escalationFlags: ['GUARD_ERROR']
      });

      // Verify error handling
      expect(mockEventsRepo.logEvent).toHaveBeenCalledWith(
        'ESCALATED',
        'guard',
        expect.objectContaining({
          emailId: 789,
          decision: 'escalate',
          escalationReason: 'guard_error'
        })
      );
    });

    it('should pass complete context to policy evaluation', async () => {
      const context: EmailContext = {
        emailId: 321,
        klass: 'mixed_intent',
        confidence: 0.85,
        flags: ['FOREIGN_LANGUAGE', 'MIXED_INTENT'],
        details: { intents: ['appointment', 'prescription'] },
        kbPolicy: { requiresDoctor: true },
        state: 'enriched'
      };

      vi.mocked(guardPolicy.evaluate).mockReturnValue({
        auto: false,
        reason: 'language',
        escalateFlags: ['FOREIGN_LANGUAGE']
      });

      await guardDecisionMaker.decide(context);

      // Verify policy was called with correct input
      expect(guardPolicy.evaluate).toHaveBeenCalledWith({
        klass: 'mixed_intent',
        details: { intents: ['appointment', 'prescription'] },
        flags: ['FOREIGN_LANGUAGE', 'MIXED_INTENT'],
        kbPolicy: { requiresDoctor: true },
        confidence: 0.85
      });
    });
  });

  describe('decideBatch', () => {
    it('should process multiple contexts in parallel', async () => {
      const contexts: EmailContext[] = [
        {
          emailId: 1,
          klass: 'appointment_request',
          confidence: 0.98,
          flags: [],
          details: {},
          state: 'classified'
        },
        {
          emailId: 2,
          klass: 'rezept_anfrage',
          confidence: 0.95,
          flags: [],
          details: {},
          state: 'classified'
        },
        {
          emailId: 3,
          klass: 'general_inquiry',
          confidence: 0.99,
          flags: [],
          details: {},
          state: 'classified'
        }
      ];

      vi.mocked(guardPolicy.evaluate)
        .mockReturnValueOnce({
          auto: true,
          reason: 'all_checks_passed',
          escalateFlags: []
        })
        .mockReturnValueOnce({
          auto: false,
          reason: 'sensitive_rezept_anfrage',
          escalateFlags: ['SENSITIVE_CATEGORY']
        })
        .mockReturnValueOnce({
          auto: true,
          reason: 'all_checks_passed',
          escalateFlags: []
        });

      const decisions = await guardDecisionMaker.decideBatch(contexts);

      expect(decisions).toHaveLength(3);
      expect(decisions[0].shouldAutoReply).toBe(true);
      expect(decisions[1].shouldAutoReply).toBe(false);
      expect(decisions[2].shouldAutoReply).toBe(true);

      // Verify all contexts were processed
      expect(guardPolicy.evaluate).toHaveBeenCalledTimes(3);
    });

    it('should handle empty batch', async () => {
      const decisions = await guardDecisionMaker.decideBatch([]);

      expect(decisions).toHaveLength(0);
      expect(guardPolicy.evaluate).not.toHaveBeenCalled();
    });
  });

  describe('getStatistics', () => {
    it('should calculate statistics correctly', async () => {
      const mockEvents = [
        {
          id: 1,
          event_type: 'GUARD_APPROVED',
          source: 'guard',
          data: JSON.stringify({ emailId: 1 }),
          processed: false,
          created_at: '2025-01-01T10:00:00Z'
        },
        {
          id: 2,
          event_type: 'ESCALATED',
          source: 'guard',
          data: JSON.stringify({
            emailId: 2,
            escalationReason: 'language',
            escalationFlags: ['FOREIGN_LANGUAGE']
          }),
          processed: false,
          created_at: '2025-01-01T11:00:00Z'
        },
        {
          id: 3,
          event_type: 'ESCALATED',
          source: 'guard',
          data: JSON.stringify({
            emailId: 3,
            escalationReason: 'low_confidence_0.80',
            escalationFlags: ['LOW_CONFIDENCE']
          }),
          processed: false,
          created_at: '2025-01-01T12:00:00Z'
        },
        {
          id: 4,
          event_type: 'GUARD_APPROVED',
          source: 'guard',
          data: JSON.stringify({ emailId: 4 }),
          processed: false,
          created_at: '2025-01-01T13:00:00Z'
        }
      ];

      mockEventsRepo.getEventsByType = vi.fn().mockResolvedValue(mockEvents);

      const stats = await guardDecisionMaker.getStatistics({
        start: new Date('2025-01-01T00:00:00Z'),
        end: new Date('2025-01-01T23:59:59Z')
      });

      expect(stats).toMatchObject({
        total: 4,
        approved: 2,
        escalated: 2,
        approvalRate: 0.5,
        escalationRate: 0.5,
        escalationReasons: {
          'language': 1,
          'low_confidence_0.80': 1
        },
        escalationFlags: {
          'FOREIGN_LANGUAGE': 1,
          'LOW_CONFIDENCE': 1
        }
      });
    });

    it('should handle empty timeframe', async () => {
      mockEventsRepo.getEventsByType = vi.fn().mockResolvedValue([]);

      const stats = await guardDecisionMaker.getStatistics({
        start: new Date('2025-01-01T00:00:00Z'),
        end: new Date('2025-01-01T23:59:59Z')
      });

      expect(stats).toMatchObject({
        total: 0,
        approved: 0,
        escalated: 0,
        approvalRate: 0,
        escalationRate: 0,
        escalationReasons: {},
        escalationFlags: {}
      });
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle foreign language escalation correctly', async () => {
      const context: EmailContext = {
        emailId: 100,
        klass: 'appointment_request',
        confidence: 0.99,
        flags: ['FOREIGN_LANGUAGE'],
        details: { language: 'en' },
        state: 'classified'
      };

      vi.mocked(guardPolicy.evaluate).mockReturnValue({
        auto: false,
        reason: 'language',
        escalateFlags: ['FOREIGN_LANGUAGE']
      });

      const decision = await guardDecisionMaker.decide(context);

      expect(decision.shouldAutoReply).toBe(false);
      expect(decision.escalationReason).toBe('language');
      expect(decision.escalationFlags).toContain('FOREIGN_LANGUAGE');
    });

    it('should handle prescription request escalation correctly', async () => {
      const context: EmailContext = {
        emailId: 200,
        klass: 'rezept_anfrage',
        confidence: 0.98,
        flags: [],
        details: { medication: 'Aspirin' },
        state: 'classified'
      };

      vi.mocked(guardPolicy.evaluate).mockReturnValue({
        auto: false,
        reason: 'sensitive_rezept_anfrage',
        escalateFlags: ['SENSITIVE_CATEGORY']
      });

      const decision = await guardDecisionMaker.decide(context);

      expect(decision.shouldAutoReply).toBe(false);
      expect(decision.escalationReason).toBe('sensitive_rezept_anfrage');
      expect(decision.escalationFlags).toContain('SENSITIVE_CATEGORY');
    });

    it('should handle AU request escalation correctly', async () => {
      const context: EmailContext = {
        emailId: 300,
        klass: 'au_anfrage',
        confidence: 0.97,
        flags: [],
        details: { reason: 'Grippe' },
        state: 'classified'
      };

      vi.mocked(guardPolicy.evaluate).mockReturnValue({
        auto: false,
        reason: 'sensitive_au_anfrage',
        escalateFlags: ['SENSITIVE_CATEGORY']
      });

      const decision = await guardDecisionMaker.decide(context);

      expect(decision.shouldAutoReply).toBe(false);
      expect(decision.escalationReason).toBe('sensitive_au_anfrage');
      expect(decision.escalationFlags).toContain('SENSITIVE_CATEGORY');
    });

    it('should handle mixed intent escalation correctly', async () => {
      const context: EmailContext = {
        emailId: 400,
        klass: 'general_inquiry',
        confidence: 0.96,
        flags: ['MIXED_INTENT'],
        details: { topics: ['appointment', 'prescription'] },
        state: 'classified'
      };

      vi.mocked(guardPolicy.evaluate).mockReturnValue({
        auto: false,
        reason: 'mixed_intent',
        escalateFlags: ['MIXED_INTENT']
      });

      const decision = await guardDecisionMaker.decide(context);

      expect(decision.shouldAutoReply).toBe(false);
      expect(decision.escalationReason).toBe('mixed_intent');
      expect(decision.escalationFlags).toContain('MIXED_INTENT');
    });

    it('should handle low confidence escalation correctly', async () => {
      const context: EmailContext = {
        emailId: 500,
        klass: 'appointment_request',
        confidence: 0.75,
        flags: [],
        details: {},
        state: 'classified'
      };

      vi.mocked(guardPolicy.evaluate).mockReturnValue({
        auto: false,
        reason: 'low_confidence_0.75',
        escalateFlags: ['LOW_CONFIDENCE']
      });

      const decision = await guardDecisionMaker.decide(context);

      expect(decision.shouldAutoReply).toBe(false);
      expect(decision.escalationReason).toBe('low_confidence_0.75');
      expect(decision.escalationFlags).toContain('LOW_CONFIDENCE');
    });
  });
});