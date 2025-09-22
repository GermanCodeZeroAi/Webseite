import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GuardPolicy, GuardPolicyInput } from '../../../../src/ai/guard/policy.js';

// Mock settings values
const mockSettings = {
  autoSendEnabled: true,
  requireManualApproval: false,
  autoSendConfidenceThreshold: 0.95
};

// Mock TypedSettings class
vi.mock('../../../../src/core/config/settings.js', () => ({
  TypedSettings: vi.fn().mockImplementation(() => mockSettings)
}));

// Mock logger
vi.mock('../../../../src/core/logger/index.js', () => ({
  createLogger: vi.fn(() => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn()
  }))
}));

describe('GuardPolicy', () => {
  let guardPolicy: GuardPolicy;

  beforeEach(() => {
    // Reset to default settings
    mockSettings.autoSendEnabled = true;
    mockSettings.requireManualApproval = false;
    mockSettings.autoSendConfidenceThreshold = 0.95;
    
    // Create guard policy with mocked settings
    guardPolicy = new GuardPolicy(mockSettings as any);
  });

  describe('Foreign Language Detection', () => {
    it('should escalate when FOREIGN_LANGUAGE flag is present', () => {
      const input: GuardPolicyInput = {
        klass: 'appointment_request',
        details: {},
        flags: ['FOREIGN_LANGUAGE'],
        confidence: 0.98
      };

      const result = guardPolicy.evaluate(input);

      expect(result.auto).toBe(false);
      expect(result.reason).toBe('language');
      expect(result.escalateFlags).toContain('FOREIGN_LANGUAGE');
    });

    it('should escalate when NON_GERMAN flag is present', () => {
      const input: GuardPolicyInput = {
        klass: 'appointment_request',
        details: {},
        flags: ['NON_GERMAN', 'SOME_OTHER_FLAG'],
        confidence: 0.99
      };

      const result = guardPolicy.evaluate(input);

      expect(result.auto).toBe(false);
      expect(result.reason).toBe('language');
      expect(result.escalateFlags).toContain('FOREIGN_LANGUAGE');
    });

    it('should escalate when TRANSLATION_NEEDED flag is present', () => {
      const input: GuardPolicyInput = {
        klass: 'general_inquiry',
        details: {},
        flags: ['TRANSLATION_NEEDED'],
        confidence: 0.96
      };

      const result = guardPolicy.evaluate(input);

      expect(result.auto).toBe(false);
      expect(result.reason).toBe('language');
    });
  });

  describe('Sensitive Category Detection', () => {
    it('should escalate for rezept (prescription) requests', () => {
      const input: GuardPolicyInput = {
        klass: 'rezept_anfrage',
        details: { medication: 'Ibuprofen' },
        flags: [],
        confidence: 0.98
      };

      const result = guardPolicy.evaluate(input);

      expect(result.auto).toBe(false);
      expect(result.reason).toBe('sensitive_rezept_anfrage');
      expect(result.escalateFlags).toContain('SENSITIVE_CATEGORY');
    });

    it('should escalate for prescription category in English', () => {
      const input: GuardPolicyInput = {
        klass: 'prescription_request',
        details: {},
        flags: [],
        confidence: 0.97
      };

      const result = guardPolicy.evaluate(input);

      expect(result.auto).toBe(false);
      expect(result.reason).toBe('sensitive_prescription_request');
      expect(result.escalateFlags).toContain('SENSITIVE_CATEGORY');
    });

    it('should escalate for AU (sick note) requests', () => {
      const input: GuardPolicyInput = {
        klass: 'au_anfrage',
        details: { duration: '3 days' },
        flags: [],
        confidence: 0.99
      };

      const result = guardPolicy.evaluate(input);

      expect(result.auto).toBe(false);
      expect(result.reason).toBe('sensitive_au_anfrage');
      expect(result.escalateFlags).toContain('SENSITIVE_CATEGORY');
    });

    it('should escalate for Arbeitsunfähigkeit requests', () => {
      const input: GuardPolicyInput = {
        klass: 'arbeitsunfähigkeit_bescheinigung',
        details: {},
        flags: [],
        confidence: 0.96
      };

      const result = guardPolicy.evaluate(input);

      expect(result.auto).toBe(false);
      expect(result.reason).toBe('sensitive_arbeitsunfähigkeit_bescheinigung');
      expect(result.escalateFlags).toContain('SENSITIVE_CATEGORY');
    });

    it('should escalate for unclear intent', () => {
      const input: GuardPolicyInput = {
        klass: 'unclear_intent',
        details: {},
        flags: [],
        confidence: 0.97
      };

      const result = guardPolicy.evaluate(input);

      expect(result.auto).toBe(false);
      expect(result.reason).toBe('sensitive_unclear_intent');
      expect(result.escalateFlags).toContain('SENSITIVE_CATEGORY');
    });
  });

  describe('Mixed Intent Detection', () => {
    it('should escalate when class contains "mixed"', () => {
      const input: GuardPolicyInput = {
        klass: 'mixed_appointment_and_prescription',
        details: {},
        flags: [],
        confidence: 0.98
      };

      const result = guardPolicy.evaluate(input);

      expect(result.auto).toBe(false);
      expect(result.reason).toBe('mixed_intent');
      expect(result.escalateFlags).toContain('MIXED_INTENT');
    });

    it('should escalate when class contains "mehrfach"', () => {
      const input: GuardPolicyInput = {
        klass: 'mehrfachanfrage',
        details: {},
        flags: [],
        confidence: 0.97
      };

      const result = guardPolicy.evaluate(input);

      expect(result.auto).toBe(false);
      expect(result.reason).toBe('mixed_intent');
      expect(result.escalateFlags).toContain('MIXED_INTENT');
    });

    it('should escalate when MIXED_INTENT flag is present', () => {
      const input: GuardPolicyInput = {
        klass: 'appointment_request',
        details: {},
        flags: ['MIXED_INTENT'],
        confidence: 0.98
      };

      const result = guardPolicy.evaluate(input);

      expect(result.auto).toBe(false);
      expect(result.reason).toBe('mixed_intent');
      expect(result.escalateFlags).toContain('MIXED_INTENT');
    });

    it('should escalate when MULTIPLE_REQUESTS flag is present', () => {
      const input: GuardPolicyInput = {
        klass: 'general_inquiry',
        details: {},
        flags: ['MULTIPLE_REQUESTS'],
        confidence: 0.96
      };

      const result = guardPolicy.evaluate(input);

      expect(result.auto).toBe(false);
      expect(result.reason).toBe('mixed_intent');
      expect(result.escalateFlags).toContain('MIXED_INTENT');
    });
  });

  describe('Low Confidence Detection', () => {
    it('should escalate when confidence is below threshold', () => {
      const input: GuardPolicyInput = {
        klass: 'appointment_request',
        details: {},
        flags: [],
        confidence: 0.90 // Below 0.95 threshold
      };

      const result = guardPolicy.evaluate(input);

      expect(result.auto).toBe(false);
      expect(result.reason).toBe('low_confidence_0.90');
      expect(result.escalateFlags).toContain('LOW_CONFIDENCE');
    });

    it('should allow auto-reply when confidence is exactly at threshold', () => {
      const input: GuardPolicyInput = {
        klass: 'appointment_request',
        details: {},
        flags: [],
        confidence: 0.95
      };

      const result = guardPolicy.evaluate(input);

      expect(result.auto).toBe(true);
      expect(result.reason).toBe('all_checks_passed');
      expect(result.escalateFlags).toHaveLength(0);
    });

    it('should allow auto-reply when confidence is above threshold', () => {
      const input: GuardPolicyInput = {
        klass: 'appointment_request',
        details: {},
        flags: [],
        confidence: 0.98
      };

      const result = guardPolicy.evaluate(input);

      expect(result.auto).toBe(true);
      expect(result.reason).toBe('all_checks_passed');
      expect(result.escalateFlags).toHaveLength(0);
    });

    it('should respect custom confidence threshold', () => {
      mockSettings.autoSendConfidenceThreshold = 0.85;

      const input: GuardPolicyInput = {
        klass: 'appointment_request',
        details: {},
        flags: [],
        confidence: 0.87
      };

      const result = guardPolicy.evaluate(input);

      expect(result.auto).toBe(true);
      expect(result.reason).toBe('all_checks_passed');
    });
  });

  describe('Knowledge Base Policy Checks', () => {
    it('should escalate when KB policy requires doctor attention', () => {
      const input: GuardPolicyInput = {
        klass: 'medical_inquiry',
        details: {},
        flags: [],
        confidence: 0.98,
        kbPolicy: { requiresDoctor: true }
      };

      const result = guardPolicy.evaluate(input);

      expect(result.auto).toBe(false);
      expect(result.reason).toBe('requires_doctor_attention');
      expect(result.escalateFlags).toContain('KB_POLICY_VIOLATION');
    });

    it('should escalate when KB policy requires privacy check', () => {
      const input: GuardPolicyInput = {
        klass: 'personal_data_request',
        details: {},
        flags: [],
        confidence: 0.97,
        kbPolicy: { requiresPrivacyCheck: true }
      };

      const result = guardPolicy.evaluate(input);

      expect(result.auto).toBe(false);
      expect(result.reason).toBe('requires_privacy_check');
      expect(result.escalateFlags).toContain('KB_POLICY_VIOLATION');
    });

    it('should escalate when KB policy indicates high complexity', () => {
      const input: GuardPolicyInput = {
        klass: 'complex_medical_case',
        details: {},
        flags: [],
        confidence: 0.96,
        kbPolicy: { complexityScore: 0.85 }
      };

      const result = guardPolicy.evaluate(input);

      expect(result.auto).toBe(false);
      expect(result.reason).toBe('high_complexity');
      expect(result.escalateFlags).toContain('KB_POLICY_VIOLATION');
    });
  });

  describe('System Settings Checks', () => {
    it('should escalate when auto-send is disabled', () => {
      mockSettings.autoSendEnabled = false;

      const input: GuardPolicyInput = {
        klass: 'appointment_request',
        details: {},
        flags: [],
        confidence: 0.98
      };

      const result = guardPolicy.evaluate(input);

      expect(result.auto).toBe(false);
      expect(result.reason).toBe('auto_send_disabled');
      expect(result.escalateFlags).toContain('AUTO_SEND_DISABLED');
    });

    it('should escalate when manual approval is required', () => {
      mockSettings.requireManualApproval = true;

      const input: GuardPolicyInput = {
        klass: 'appointment_request',
        details: {},
        flags: [],
        confidence: 0.97
      };

      const result = guardPolicy.evaluate(input);

      expect(result.auto).toBe(false);
      expect(result.reason).toBe('manual_approval');
      expect(result.escalateFlags).toContain('MANUAL_APPROVAL_REQUIRED');
    });
  });

  describe('Priority Order of Rules', () => {
    it('should prioritize foreign language over other rules', () => {
      const input: GuardPolicyInput = {
        klass: 'rezept_anfrage', // Sensitive category
        details: {},
        flags: ['FOREIGN_LANGUAGE'],
        confidence: 0.80 // Low confidence
      };

      const result = guardPolicy.evaluate(input);

      expect(result.auto).toBe(false);
      expect(result.reason).toBe('language'); // Foreign language takes precedence
      expect(result.escalateFlags).toContain('FOREIGN_LANGUAGE');
    });

    it('should prioritize sensitive category over low confidence', () => {
      const input: GuardPolicyInput = {
        klass: 'au_anfrage',
        details: {},
        flags: [],
        confidence: 0.80 // Low confidence
      };

      const result = guardPolicy.evaluate(input);

      expect(result.auto).toBe(false);
      expect(result.reason).toBe('sensitive_au_anfrage'); // Sensitive category takes precedence
      expect(result.escalateFlags).toContain('SENSITIVE_CATEGORY');
    });
  });

  describe('Happy Path - Auto Reply Allowed', () => {
    it('should allow auto-reply for non-sensitive appointment request', () => {
      const input: GuardPolicyInput = {
        klass: 'appointment_request',
        details: { type: 'routine_checkup' },
        flags: [],
        confidence: 0.98
      };

      const result = guardPolicy.evaluate(input);

      expect(result.auto).toBe(true);
      expect(result.reason).toBe('all_checks_passed');
      expect(result.escalateFlags).toHaveLength(0);
    });

    it('should allow auto-reply for general inquiry with high confidence', () => {
      const input: GuardPolicyInput = {
        klass: 'general_inquiry',
        details: { topic: 'opening_hours' },
        flags: [],
        confidence: 0.99
      };

      const result = guardPolicy.evaluate(input);

      expect(result.auto).toBe(true);
      expect(result.reason).toBe('all_checks_passed');
      expect(result.escalateFlags).toHaveLength(0);
    });
  });

  describe('getPolicySummary', () => {
    it('should return complete policy summary', () => {
      const summary = guardPolicy.getPolicySummary();

      expect(summary).toHaveProperty('autoSendEnabled');
      expect(summary).toHaveProperty('confidenceThreshold');
      expect(summary).toHaveProperty('requireManualApproval');
      expect(summary).toHaveProperty('sensitiveCategories');
      expect(summary).toHaveProperty('foreignLanguageFlags');
      expect(summary).toHaveProperty('rules');
      expect(Array.isArray(summary.rules)).toBe(true);
    });
  });
});