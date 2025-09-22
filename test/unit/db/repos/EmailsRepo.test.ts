import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { EmailsRepo, type IngestedEmail } from '../../../../src/core/db/repos/EmailsRepo.js';
import { dbConnection } from '../../../../src/core/db/connection.js';
import { rmSync, existsSync } from 'fs';
import { join } from 'path';

const TEST_DB_PATH = join(process.cwd(), 'test/fixtures/test-emails.db');

describe('EmailsRepo', () => {
  let repo: EmailsRepo;

  beforeEach(async () => {
    // Set test database path
    process.env.DB_PATH = TEST_DB_PATH;
    
    // Clean up
    if (existsSync(TEST_DB_PATH)) rmSync(TEST_DB_PATH);
    if (existsSync(`${TEST_DB_PATH}-wal`)) rmSync(`${TEST_DB_PATH}-wal`);
    if (existsSync(`${TEST_DB_PATH}-shm`)) rmSync(`${TEST_DB_PATH}-shm`);
    
    await dbConnection.init();
    repo = new EmailsRepo();
  });

  afterEach(() => {
    dbConnection.close();
  });

  describe('insertIngested', () => {
    it('should insert new email', () => {
      const email: IngestedEmail = {
        message_id: '<test@example.com>',
        account_email: 'praxis@example.com',
        from_email: 'patient@example.com',
        from_name: 'Max Mustermann',
        to_email: 'praxis@example.com',
        subject: 'Terminanfrage',
        body_text: 'Ich möchte gerne einen Termin vereinbaren.',
        received_at: new Date('2024-01-01T10:00:00Z'),
      };

      const id = repo.insertIngested(email);
      expect(id).toBeGreaterThan(0);

      const saved = repo.findById(id);
      expect(saved).toBeDefined();
      expect(saved?.message_id).toBe(email.message_id);
      expect(saved?.status).toBe('new');
    });

    it('should handle optional fields', () => {
      const email: IngestedEmail = {
        message_id: '<minimal@example.com>',
        account_email: 'praxis@example.com',
        from_email: 'patient@example.com',
        to_email: 'praxis@example.com',
        subject: 'Test',
        received_at: new Date(),
      };

      const id = repo.insertIngested(email);
      const saved = repo.findById(id);
      
      expect(saved?.folder).toBe('INBOX');
      expect(saved?.from_name).toBeNull();
      expect(saved?.body_text).toBeNull();
      expect(saved?.headers).toBeNull();
    });

    it('should save headers and attachments as JSON', () => {
      const email: IngestedEmail = {
        message_id: '<json@example.com>',
        account_email: 'praxis@example.com',
        from_email: 'patient@example.com',
        to_email: 'praxis@example.com',
        subject: 'Test',
        received_at: new Date(),
        headers: { 'X-Test': 'value' },
        attachments: [{ filename: 'test.pdf', size: 1024, contentType: 'application/pdf' }],
      };

      const id = repo.insertIngested(email);
      const saved = repo.findById(id);
      
      expect(saved?.headers).toBe('{"X-Test":"value"}');
      expect(saved?.attachments).toBe('[{"filename":"test.pdf","size":1024,"contentType":"application/pdf"}]');
    });
  });

  describe('markClassified', () => {
    it('should update classification data', () => {
      const id = repo.insertIngested(createTestEmail());
      
      repo.markClassified(id, 'appointment_request', 0.95, { urgent: true });
      
      const updated = repo.findById(id);
      expect(updated?.status).toBe('processing');
      
      const headers = JSON.parse(updated?.headers || '{}');
      expect(headers.classification).toBe('appointment_request');
      expect(headers.classificationScore).toBe(0.95);
      expect(headers.classificationFlags).toEqual({ urgent: true });
    });
  });

  describe('addPIIFlags', () => {
    it('should add PII data to headers', () => {
      const id = repo.insertIngested(createTestEmail());
      
      const piiData = {
        hasPatientName: true,
        hasPhoneNumber: true,
        phoneNumbers: ['+49123456789'],
      };
      
      repo.addPIIFlags(id, piiData);
      
      const updated = repo.findById(id);
      const headers = JSON.parse(updated?.headers || '{}');
      expect(headers.pii).toEqual(piiData);
    });
  });

  describe('upsertState', () => {
    it('should update email state', () => {
      const id = repo.insertIngested(createTestEmail());
      
      repo.upsertState(id, 'processed');
      
      const updated = repo.findById(id);
      expect(updated?.status).toBe('processed');
    });

    it('should reject invalid states', () => {
      const id = repo.insertIngested(createTestEmail());
      
      expect(() => {
        repo.upsertState(id, 'invalid_state' as any);
      }).toThrow('Invalid state');
    });
  });

  describe('findByMessageId', () => {
    it('should find email by message ID', () => {
      const email = createTestEmail();
      repo.insertIngested(email);
      
      const found = repo.findByMessageId(email.message_id);
      expect(found).toBeDefined();
      expect(found?.message_id).toBe(email.message_id);
    });

    it('should return undefined for non-existent message ID', () => {
      const found = repo.findByMessageId('<non-existent@example.com>');
      expect(found).toBeUndefined();
    });
  });

  describe('findByTextHash', () => {
    it('should find email by text hash', () => {
      const id = repo.insertIngested(createTestEmail());
      const hash = 'test-hash-12345';
      
      repo.storeTextHash(id, hash);
      
      const found = repo.findByTextHash(hash);
      expect(found).toBeDefined();
      expect(found?.id).toBe(id);
    });
  });

  describe('findPendingEmails', () => {
    it('should return only new emails ordered by received_at', () => {
      // Insert emails with different statuses
      repo.insertIngested(createTestEmail('1', new Date('2024-01-01')));
      const id2 = repo.insertIngested(createTestEmail('2', new Date('2024-01-02')));
      repo.insertIngested(createTestEmail('3', new Date('2024-01-03')));
      
      // Mark one as processed
      repo.upsertState(id2, 'processed');
      
      const pending = repo.findPendingEmails(10);
      expect(pending).toHaveLength(2);
      expect(pending[0].message_id).toContain('1');
      expect(pending[1].message_id).toContain('3');
    });

    it('should respect limit', () => {
      for (let i = 0; i < 5; i++) {
        repo.insertIngested(createTestEmail(String(i)));
      }
      
      const pending = repo.findPendingEmails(3);
      expect(pending).toHaveLength(3);
    });
  });

  describe('updateError', () => {
    it('should mark email as failed with error message', () => {
      const id = repo.insertIngested(createTestEmail());
      
      repo.updateError(id, 'Classification failed: Model timeout');
      
      const updated = repo.findById(id);
      expect(updated?.status).toBe('failed');
      expect(updated?.error_message).toBe('Classification failed: Model timeout');
    });
  });

  describe('storeTextHash', () => {
    it('should store text hash in headers', () => {
      const id = repo.insertIngested(createTestEmail());
      const hash = 'sha256:abcdef123456';
      
      repo.storeTextHash(id, hash);
      
      const updated = repo.findById(id);
      const headers = JSON.parse(updated?.headers || '{}');
      expect(headers.text_hash).toBe(hash);
    });
  });
});

function createTestEmail(suffix = '', receivedAt = new Date()): IngestedEmail {
  return {
    message_id: `<test${suffix}@example.com>`,
    account_email: 'praxis@example.com',
    from_email: 'patient@example.com',
    to_email: 'praxis@example.com',
    subject: `Test Email ${suffix}`,
    body_text: `Test body ${suffix}`,
    received_at: receivedAt,
  };
}