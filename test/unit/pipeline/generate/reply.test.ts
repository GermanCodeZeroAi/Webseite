import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ReplyGenerator, type EmailClassification } from '../../../../src/pipeline/generate/reply.js';
import { DraftsRepo } from '../../../../src/core/db/repos/DraftsRepo.js';
import { EmailsRepo } from '../../../../src/core/db/repos/EmailsRepo.js';
import { SettingsRepo } from '../../../../src/core/db/repos/SettingsRepo.js';
import { dbConnection } from '../../../../src/core/db/connection.js';

// Mock the database connection
vi.mock('../../../../src/core/db/connection.js', () => ({
  dbConnection: {
    getDb: vi.fn(() => ({
      prepare: vi.fn(() => ({
        run: vi.fn(() => ({ lastInsertRowid: 1 })),
        get: vi.fn(),
        all: vi.fn(() => []),
      })),
    })),
  },
}));

// Mock audit logger
vi.mock('../../../../src/core/events/audit.js', () => ({
  auditLogger: {
    logEmailProcessed: vi.fn(),
  },
}));

describe('ReplyGenerator', () => {
  let generator: ReplyGenerator;
  let mockEmail: any;

  beforeEach(() => {
    vi.clearAllMocks();
    generator = new ReplyGenerator();
    
    mockEmail = {
      id: 1,
      message_id: 'test@example.com',
      from_email: 'patient@example.com',
      from_name: 'Max Mustermann',
      subject: 'Terminanfrage',
      body_text: 'Ich möchte gerne einen Termin vereinbaren.',
    };
  });

  describe('generateReply', () => {
    beforeEach(() => {
      // Mock email repo methods
      vi.spyOn(EmailsRepo.prototype, 'findById').mockReturnValue(mockEmail);
      vi.spyOn(EmailsRepo.prototype, 'updateClassification').mockImplementation(() => {});
      
      // Mock settings repo
      vi.spyOn(SettingsRepo.prototype, 'getAll').mockReturnValue({
        'praxis.name': 'Testpraxis Dr. Schmidt',
        'praxis.fachgebiet': 'Allgemeinmedizin',
        'praxis.strasse': 'Teststraße 123',
        'praxis.plz': '10115',
        'praxis.ort': 'Berlin',
        'praxis.telefon': '030 / 12345678',
        'praxis.fax': '030 / 12345679',
        'praxis.email': 'test@praxis-schmidt.de',
        'praxis.sprechzeiten': 'Mo-Fr 8:00-12:00',
      });

      // Mock drafts repo insert
      vi.spyOn(DraftsRepo.prototype, 'insert').mockReturnValue(123);
    });

    it('should generate appointment request reply', async () => {
      const classification: EmailClassification = {
        category: 'termin_anfrage',
        confidence: 0.95,
        extractedData: {
          suggestedDate: 'Montag, 22.01.2024',
          suggestedTime: '10:00',
        },
      };

      const draftId = await generator.generateReply(1, classification);

      expect(draftId).toBe(123);
      expect(DraftsRepo.prototype.insert).toHaveBeenCalledWith(
        1,
        'termin_anfrage',
        '1.0',
        expect.stringContaining('Guten Tag Max Mustermann'),
        expect.objectContaining({
          subject: 'Re: Terminanfrage - Terminvorschlag',
          template_used: 'termin_vorschlag',
        })
      );
    });

    it('should generate appointment confirmation reply', async () => {
      const classification: EmailClassification = {
        category: 'termin_bestaetigung',
        confidence: 0.90,
        extractedData: {
          date: 'Dienstag, 23.01.2024',
          time: '14:00',
          location: 'Hauptpraxis',
        },
      };

      const draftId = await generator.generateReply(1, classification);

      const insertCall = vi.mocked(DraftsRepo.prototype.insert).mock.calls[0];
      const bodyText = insertCall[3];

      expect(bodyText).toContain('hiermit bestätige ich Ihnen Ihren Termin');
      expect(bodyText).toContain('Dienstag, 23.01.2024');
      expect(bodyText).toContain('14:00 Uhr');
      expect(bodyText).toContain('Hauptpraxis');
    });

    it('should handle sensitive content appropriately', async () => {
      const classification: EmailClassification = {
        category: 'medizinische_anfrage',
        confidence: 0.85,
        guard: 'sensibel',
      };

      await generator.generateReply(1, classification);

      const insertCall = vi.mocked(DraftsRepo.prototype.insert).mock.calls[0];
      const bodyText = insertCall[3];

      expect(bodyText).toContain('wir haben Ihre Nachricht erhalten und melden uns persönlich');
      expect(bodyText).toContain('Aufgrund der Sensibilität des Themas');
    });

    it('should add policy hints for AU requests', async () => {
      const classification: EmailClassification = {
        category: 'au_bescheinigung',
        confidence: 0.88,
      };

      await generator.generateReply(1, classification);

      const insertCall = vi.mocked(DraftsRepo.prototype.insert).mock.calls[0];
      const bodyText = insertCall[3];

      expect(bodyText).toContain('Arbeitsunfähigkeitsbescheinigungen können rückwirkend maximal 3 Tage ausgestellt werden');
    });

    it('should handle FAQ with knowledge base answer', async () => {
      mockEmail.body_text = 'Was sind Ihre Sprechzeiten?';
      
      const classification: EmailClassification = {
        category: 'faq',
        confidence: 0.92,
      };

      await generator.generateReply(1, classification);

      const insertCall = vi.mocked(DraftsRepo.prototype.insert).mock.calls[0];
      const bodyText = insertCall[3];

      expect(bodyText).toContain('Unsere Sprechzeiten sind');
    });

    it('should generate correct subject for replies', async () => {
      const testCases = [
        {
          originalSubject: 'Terminanfrage',
          category: 'termin_anfrage',
          expectedSubject: 'Re: Terminanfrage - Terminvorschlag',
        },
        {
          originalSubject: 'Re: Bestätigung',
          category: 'termin_bestaetigung',
          expectedSubject: 'Re: Bestätigung', // Should keep existing Re:
        },
        {
          originalSubject: 'Allgemeine Frage',
          category: 'faq',
          expectedSubject: 'Re: Allgemeine Frage',
        },
      ];

      for (const testCase of testCases) {
        vi.clearAllMocks();
        mockEmail.subject = testCase.originalSubject;

        await generator.generateReply(1, {
          category: testCase.category,
          confidence: 0.9,
        });

        expect(DraftsRepo.prototype.insert).toHaveBeenCalledWith(
          expect.any(Number),
          expect.any(String),
          expect.any(String),
          expect.any(String),
          expect.objectContaining({
            subject: testCase.expectedSubject,
          })
        );
      }
    });

    it('should update email state to DRAFTED', async () => {
      const classification: EmailClassification = {
        category: 'termin_anfrage',
        confidence: 0.95,
      };

      await generator.generateReply(1, classification);

      expect(EmailsRepo.prototype.updateClassification).toHaveBeenCalledWith(
        1,
        'termin_anfrage',
        0.95,
        { state: 'DRAFTED' }
      );
    });

    it('should handle missing email gracefully', async () => {
      vi.mocked(EmailsRepo.prototype.findById).mockReturnValue(undefined);

      await expect(
        generator.generateReply(999, { category: 'test', confidence: 0.9 })
      ).rejects.toThrow('Email mit ID 999 nicht gefunden');
    });

    it('should use fallback template for unknown categories', async () => {
      const classification: EmailClassification = {
        category: 'unknown_category',
        confidence: 0.75,
      };

      await generator.generateReply(1, classification);

      const insertCall = vi.mocked(DraftsRepo.prototype.insert).mock.calls[0];
      const templateUsed = insertCall[4]?.template_used;

      expect(templateUsed).toBe('faq_antwort');
    });
  });
});