import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { HybridClassifier } from '../../../../src/pipeline/decide/classify';
import { EmailsRepo } from '../../../../src/core/db/repos/EmailsRepo';
import { ExtractedRepo } from '../../../../src/core/db/repos/ExtractedRepo';
import { SettingsRepo } from '../../../../src/core/db/repos/SettingsRepo';
import * as llmModule from '../../../../src/ai/classification/llm';

// Mock repositories
const mockEmailsRepo = {
  findById: jest.fn(),
  markClassified: jest.fn(),
  findClassified: jest.fn()
} as unknown as EmailsRepo;

const mockExtractedRepo = {
  upsert: jest.fn()
} as unknown as ExtractedRepo;

const mockSettingsRepo = {
  getSettings: jest.fn()
} as unknown as SettingsRepo;

// Mock LLM client
const mockLLMClient = {
  classify: jest.fn(),
  isAvailable: jest.fn()
};

describe('HybridClassifier', () => {
  let classifier: HybridClassifier;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock settings
    (mockSettingsRepo.getSettings as jest.Mock).mockResolvedValue({
      classification: {
        score_gate_threshold: 0.7
      }
    });

    // Mock LLM client creation
    jest.spyOn(llmModule, 'createLLMClient').mockReturnValue(mockLLMClient);

    classifier = new HybridClassifier(mockEmailsRepo, mockExtractedRepo, mockSettingsRepo);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Email classification fixtures', () => {
    const fixtures = [
      {
        name: 'Simple appointment request',
        email: {
          id: 1,
          subject: 'Terminanfrage',
          body: 'Guten Tag, ich möchte gerne einen Termin für nächste Woche vereinbaren. Mit freundlichen Grüßen'
        },
        expectedCategory: 'Termin vereinbaren',
        expectedMethod: 'rules',
        expectedFlags: {
          mixed_intent: false,
          foreign_language: false,
          unclear: false,
          escalate: false
        }
      },
      {
        name: 'Appointment cancellation',
        email: {
          id: 2,
          subject: 'Terminabsage',
          body: 'Ich muss meinen Termin am Montag, den 15.3. um 10:00 Uhr leider absagen. Bin erkrankt.'
        },
        expectedCategory: 'Termin absagen/ändern',
        expectedMethod: 'rules',
        expectedFlags: {
          mixed_intent: false,
          foreign_language: false,
          unclear: false,
          escalate: false
        }
      },
      {
        name: 'Sick note request',
        email: {
          id: 3,
          subject: 'Krankschreibung',
          body: 'Sehr geehrte Damen und Herren, ich bin seit Montag krank und benötige eine AU-Bescheinigung für meinen Arbeitgeber.'
        },
        expectedCategory: 'Frage zu Krankschreibung',
        expectedMethod: 'rules',
        expectedFlags: {
          mixed_intent: false,
          foreign_language: false,
          unclear: false,
          escalate: false
        }
      },
      {
        name: 'Prescription request',
        email: {
          id: 4,
          subject: 'Rezept benötigt',
          body: 'Hallo, ich brauche ein neues Rezept für mein Blutdruckmedikament (Ramipril 5mg). Die Packung ist fast leer.'
        },
        expectedCategory: 'Frage zu Rezept',
        expectedMethod: 'rules',
        expectedFlags: {
          mixed_intent: false,
          foreign_language: false,
          unclear: false,
          escalate: false
        }
      },
      {
        name: 'General medical question',
        email: {
          id: 5,
          subject: 'Frage zu Symptomen',
          body: 'Ich habe seit einer Woche Kopfschmerzen und Schwindel. Was könnte die Ursache sein?'
        },
        expectedCategory: 'Allgemeine Frage',
        expectedMethod: 'llm', // Low confidence from rules
        expectedFlags: {
          mixed_intent: false,
          foreign_language: false,
          unclear: false,
          escalate: false
        }
      },
      {
        name: 'Mixed intent - appointment and prescription',
        email: {
          id: 6,
          subject: 'Termin und Rezept',
          body: 'Guten Tag, ich bräuchte einen Termin und gleichzeitig ein neues Rezept für meine Tabletten.'
        },
        expectedCategory: 'Termin vereinbaren', // LLM should pick primary intent
        expectedMethod: 'llm',
        expectedFlags: {
          mixed_intent: true,
          foreign_language: false,
          unclear: false,
          escalate: true
        }
      },
      {
        name: 'Mixed intent - sick note and appointment',
        email: {
          id: 7,
          subject: 'Krankschreibung und neuer Termin',
          body: 'Ich brauche eine Verlängerung meiner AU und möchte gleichzeitig einen Folgetermin vereinbaren.'
        },
        expectedCategory: 'Frage zu Krankschreibung',
        expectedMethod: 'llm',
        expectedFlags: {
          mixed_intent: true,
          foreign_language: false,
          unclear: false,
          escalate: true
        }
      },
      {
        name: 'English email (foreign language)',
        email: {
          id: 8,
          subject: 'Appointment request',
          body: 'Hello, I would like to make an appointment for next week. Thank you.'
        },
        expectedCategory: 'Sonstiges',
        expectedMethod: 'rules',
        expectedFlags: {
          mixed_intent: false,
          foreign_language: true,
          unclear: false,
          escalate: true
        }
      },
      {
        name: 'Unclear/spam content',
        email: {
          id: 9,
          subject: 'asdfgh',
          body: 'Lorem ipsum dolor sit amet...'
        },
        expectedCategory: 'Sonstiges',
        expectedMethod: 'rules',
        expectedFlags: {
          mixed_intent: false,
          foreign_language: false,
          unclear: false,
          escalate: false
        }
      },
      {
        name: 'Complex mixed intent with details',
        email: {
          id: 10,
          subject: 'Mehrere Anliegen',
          body: 'Sehr geehrtes Praxisteam, ich habe mehrere Anliegen: 1) Ich benötige einen Termin für eine Kontrolluntersuchung, am besten nachmittags. 2) Mein Rezept für Metformin 850mg läuft aus. 3) Ich bin seit gestern krankgeschrieben, brauche aber eine Verlängerung für weitere 3 Tage.'
        },
        expectedCategory: 'Termin vereinbaren',
        expectedMethod: 'llm',
        expectedFlags: {
          mixed_intent: true,
          foreign_language: false,
          unclear: false,
          escalate: true
        }
      },
      {
        name: 'Appointment rescheduling',
        email: {
          id: 11,
          subject: 'Termin verschieben',
          body: 'Kann ich meinen Termin vom 20.3. auf den 22.3. verschieben? Gleiche Uhrzeit wäre gut.'
        },
        expectedCategory: 'Termin absagen/ändern',
        expectedMethod: 'rules',
        expectedFlags: {
          mixed_intent: false,
          foreign_language: false,
          unclear: false,
          escalate: false
        }
      },
      {
        name: 'Urgent medical question',
        email: {
          id: 12,
          subject: 'Dringend',
          body: 'Ich habe starke Brustschmerzen und Atemnot. Was soll ich tun?'
        },
        expectedCategory: 'Allgemeine Frage',
        expectedMethod: 'llm',
        expectedFlags: {
          mixed_intent: false,
          foreign_language: false,
          unclear: false,
          escalate: true // Should escalate due to urgency
        }
      }
    ];

    fixtures.forEach(({ name, email, expectedCategory, expectedMethod, expectedFlags }) => {
      it(`should classify: ${name}`, async () => {
        (mockEmailsRepo.findById as jest.Mock).mockResolvedValue(email);

        if (expectedMethod === 'llm') {
          mockLLMClient.isAvailable.mockResolvedValue(true);
          mockLLMClient.classify.mockResolvedValue({
            category: expectedCategory,
            confidence: 0.85,
            extracted: {},
            flags: {
              mixed_intent: expectedFlags.mixed_intent,
              foreign_language: expectedFlags.foreign_language,
              unclear: expectedFlags.unclear
            }
          });
        }

        const result = await classifier.classifyEmail(email.id);

        expect(result.category).toBe(expectedCategory);
        expect(result.method).toBe(expectedMethod);
        expect(result.flags).toMatchObject(expectedFlags);

        // Verify save operations
        expect(mockEmailsRepo.markClassified).toHaveBeenCalledWith(
          email.id,
          expectedCategory,
          expect.any(Number),
          expectedFlags
        );
      });
    });
  });

  describe('Error handling', () => {
    it('should handle missing email', async () => {
      (mockEmailsRepo.findById as jest.Mock).mockResolvedValue(null);

      const result = await classifier.classifyEmail(999);

      expect(result.category).toBe('Sonstiges');
      expect(result.flags.escalate).toBe(true);
      expect(result.extracted.error).toBe('Classification failed');
    });

    it('should handle LLM unavailability', async () => {
      (mockEmailsRepo.findById as jest.Mock).mockResolvedValue({
        id: 1,
        subject: 'Test',
        body: 'Ich habe eine Frage zu meiner Behandlung.'
      });

      mockLLMClient.isAvailable.mockResolvedValue(false);

      const result = await classifier.classifyEmail(1);

      expect(result.method).toBe('rules');
      expect(result.flags.escalate).toBe(true);
      expect(result.flags.unclear).toBe(true);
    });

    it('should handle invalid LLM response', async () => {
      (mockEmailsRepo.findById as jest.Mock).mockResolvedValue({
        id: 1,
        subject: 'Test',
        body: 'Was ist das?'
      });

      mockLLMClient.isAvailable.mockResolvedValue(true);
      mockLLMClient.classify.mockResolvedValue({
        category: 'InvalidCategory',
        confidence: 0.9,
        extracted: {},
        flags: { mixed_intent: false, foreign_language: false, unclear: false }
      });

      const result = await classifier.classifyEmail(1);

      expect(result.method).toBe('rules');
      expect(result.flags.escalate).toBe(true);
    });

    it('should handle JSON parsing errors from LLM', async () => {
      (mockEmailsRepo.findById as jest.Mock).mockResolvedValue({
        id: 1,
        subject: 'Test',
        body: 'Terminanfrage für nächste Woche'
      });

      mockLLMClient.isAvailable.mockResolvedValue(true);
      mockLLMClient.classify.mockRejectedValue(new Error('Invalid JSON'));

      const result = await classifier.classifyEmail(1);

      expect(result.method).toBe('rules');
      expect(result.category).toBe('Termin vereinbaren');
      expect(result.flags.escalate).toBe(true);
      expect(result.flags.unclear).toBe(true);
    });
  });

  describe('Batch processing', () => {
    it('should classify multiple emails', async () => {
      const emails = [
        { id: 1, subject: 'Termin', body: 'Ich möchte einen Termin.' },
        { id: 2, subject: 'Rezept', body: 'Ich brauche ein Rezept.' }
      ];

      emails.forEach(email => {
        (mockEmailsRepo.findById as jest.Mock).mockResolvedValueOnce(email);
      });

      const results = await classifier.classifyBatch([1, 2]);

      expect(results).toHaveLength(2);
      expect(results[0].category).toBe('Termin vereinbaren');
      expect(results[1].category).toBe('Frage zu Rezept');
    });

    it('should handle errors in batch processing gracefully', async () => {
      (mockEmailsRepo.findById as jest.Mock)
        .mockResolvedValueOnce({ id: 1, subject: 'Test', body: 'Termin bitte' })
        .mockResolvedValueOnce(null) // This will cause an error
        .mockResolvedValueOnce({ id: 3, subject: 'Test', body: 'Rezept bitte' });

      const results = await classifier.classifyBatch([1, 2, 3]);

      expect(results).toHaveLength(2); // Only successful classifications
      expect(results[0].emailId).toBe(1);
      expect(results[1].emailId).toBe(3);
    });
  });

  describe('Statistics', () => {
    it('should calculate classification statistics', async () => {
      const classifiedEmails = [
        { id: 1, classification: 'Termin vereinbaren', confidence: 0.9, flags: { escalate: false } },
        { id: 2, classification: 'Termin vereinbaren', confidence: 0.8, flags: { escalate: false } },
        { id: 3, classification: 'Frage zu Rezept', confidence: 0.6, flags: { escalate: true } },
        { id: 4, classification: 'Sonstiges', confidence: 0.3, flags: { escalate: true } }
      ];

      (mockEmailsRepo.findClassified as jest.Mock).mockResolvedValue(classifiedEmails);

      const stats = await classifier.getClassificationStats();

      expect(stats.total).toBe(4);
      expect(stats.byCategory['Termin vereinbaren']).toBe(2);
      expect(stats.byCategory['Frage zu Rezept']).toBe(1);
      expect(stats.byCategory['Sonstiges']).toBe(1);
      expect(stats.byMethod.rules).toBe(2); // High confidence
      expect(stats.byMethod.llm).toBe(2); // Low confidence
      expect(stats.escalated).toBe(2);
    });
  });
});