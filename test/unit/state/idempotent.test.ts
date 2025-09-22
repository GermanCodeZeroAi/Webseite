import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { IdempotencyChecker, IdempotentBatch } from '../../../src/core/state/idempotent.js';
import { EmailsRepo } from '../../../src/core/db/repos/EmailsRepo.js';
import { dbConnection } from '../../../src/core/db/connection.js';
import { rmSync, existsSync } from 'fs';
import { join } from 'path';

const TEST_DB_PATH = join(process.cwd(), 'test/fixtures/test-idempotent.db');

describe('IdempotencyChecker', () => {
  let checker: IdempotencyChecker;
  let emailsRepo: EmailsRepo;

  beforeEach(async () => {
    process.env.DB_PATH = TEST_DB_PATH;
    
    // Clean up
    if (existsSync(TEST_DB_PATH)) rmSync(TEST_DB_PATH);
    if (existsSync(`${TEST_DB_PATH}-wal`)) rmSync(`${TEST_DB_PATH}-wal`);
    if (existsSync(`${TEST_DB_PATH}-shm`)) rmSync(`${TEST_DB_PATH}-shm`);
    
    await dbConnection.init();
    checker = new IdempotencyChecker();
    emailsRepo = new EmailsRepo();
  });

  afterEach(() => {
    dbConnection.close();
  });

  describe('generateTextHash', () => {
    it('should generate consistent hash for same input', () => {
      const messageId = '<test@example.com>';
      const bodyText = 'Hello, this is a test email.';
      
      const hash1 = checker.generateTextHash(messageId, bodyText);
      const hash2 = checker.generateTextHash(messageId, bodyText);
      
      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64); // SHA256 hex length
    });

    it('should normalize text before hashing', () => {
      const messageId = '<test@example.com>';
      const text1 = 'HELLO   World\r\n\r\nTest!!!';
      const text2 = 'hello world\n\ntest';
      
      const hash1 = checker.generateTextHash(messageId, text1);
      const hash2 = checker.generateTextHash(messageId, text2);
      
      expect(hash1).toBe(hash2);
    });

    it('should generate different hashes for different message IDs', () => {
      const bodyText = 'Same content';
      
      const hash1 = checker.generateTextHash('<msg1@example.com>', bodyText);
      const hash2 = checker.generateTextHash('<msg2@example.com>', bodyText);
      
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('isDuplicate', () => {
    it('should detect duplicate by message ID', async () => {
      const messageId = '<dup1@example.com>';
      
      // Insert email
      emailsRepo.insertIngested({
        message_id: messageId,
        account_email: 'praxis@example.com',
        from_email: 'patient@example.com',
        to_email: 'praxis@example.com',
        subject: 'Test',
        received_at: new Date(),
      });
      
      // Check for duplicate
      const isDup = await checker.isDuplicate(messageId);
      expect(isDup).toBe(true);
    });

    it('should detect duplicate by text hash', async () => {
      const messageId1 = '<msg1@example.com>';
      const messageId2 = '<msg2@example.com>';
      const bodyText = 'Identical content in both emails';
      
      // Insert first email with hash
      const id = emailsRepo.insertIngested({
        message_id: messageId1,
        account_email: 'praxis@example.com',
        from_email: 'patient@example.com',
        to_email: 'praxis@example.com',
        subject: 'Test',
        body_text: bodyText,
        received_at: new Date(),
      });
      
      checker.storeTextHash(id, messageId1, bodyText);
      
      // Check second email with same content but different message ID
      const isDup = await checker.isDuplicate(messageId2, bodyText);
      expect(isDup).toBe(true);
    });

    it('should not flag unique emails as duplicates', async () => {
      const isDup = await checker.isDuplicate('<unique@example.com>', 'Unique content');
      expect(isDup).toBe(false);
    });
  });

  describe('processEmail', () => {
    it('should process new email and store hash', async () => {
      const messageId = '<process1@example.com>';
      const bodyText = 'Process this email';
      let processCalled = false;
      
      const result = await checker.processEmail(messageId, bodyText, async () => {
        processCalled = true;
        return emailsRepo.insertIngested({
          message_id: messageId,
          account_email: 'praxis@example.com',
          from_email: 'patient@example.com',
          to_email: 'praxis@example.com',
          subject: 'Test',
          body_text: bodyText,
          received_at: new Date(),
        });
      });
      
      expect(processCalled).toBe(true);
      expect(result.isDuplicate).toBe(false);
      expect(result.emailId).toBeGreaterThan(0);
      
      // Verify hash was stored
      const email = emailsRepo.findById(result.emailId);
      const headers = JSON.parse(email?.headers || '{}');
      expect(headers.text_hash).toBeDefined();
    });

    it('should skip processing for duplicates', async () => {
      const messageId = '<dup2@example.com>';
      
      // Insert first
      emailsRepo.insertIngested({
        message_id: messageId,
        account_email: 'praxis@example.com',
        from_email: 'patient@example.com',
        to_email: 'praxis@example.com',
        subject: 'Test',
        received_at: new Date(),
      });
      
      // Try to process duplicate
      let processCalled = false;
      const result = await checker.processEmail(messageId, 'body', async () => {
        processCalled = true;
        return 999;
      });
      
      expect(processCalled).toBe(false);
      expect(result.isDuplicate).toBe(true);
      expect(result.emailId).toBe(0);
    });
  });
});

describe('IdempotentBatch', () => {
  let batch: IdempotentBatch;
  let emailsRepo: EmailsRepo;

  beforeEach(async () => {
    process.env.DB_PATH = TEST_DB_PATH;
    
    // Clean up
    if (existsSync(TEST_DB_PATH)) rmSync(TEST_DB_PATH);
    if (existsSync(`${TEST_DB_PATH}-wal`)) rmSync(`${TEST_DB_PATH}-wal`);
    if (existsSync(`${TEST_DB_PATH}-shm`)) rmSync(`${TEST_DB_PATH}-shm`);
    
    await dbConnection.init();
    batch = new IdempotentBatch();
    emailsRepo = new EmailsRepo();
  });

  afterEach(() => {
    dbConnection.close();
  });

  describe('addIfNew', () => {
    it('should add new emails to batch', async () => {
      const added1 = await batch.addIfNew('<new1@example.com>', 'body1');
      const added2 = await batch.addIfNew('<new2@example.com>', 'body2');
      
      expect(added1).toBe(true);
      expect(added2).toBe(true);
      expect(batch.getNewCount()).toBe(2);
    });

    it('should reject duplicates in same batch', async () => {
      const messageId = '<batch1@example.com>';
      
      const added1 = await batch.addIfNew(messageId, 'body');
      const added2 = await batch.addIfNew(messageId, 'body');
      
      expect(added1).toBe(true);
      expect(added2).toBe(false);
      expect(batch.getNewCount()).toBe(1);
    });

    it('should reject emails already in database', async () => {
      const messageId = '<existing@example.com>';
      
      // Add to database
      emailsRepo.insertIngested({
        message_id: messageId,
        account_email: 'praxis@example.com',
        from_email: 'patient@example.com',
        to_email: 'praxis@example.com',
        subject: 'Test',
        received_at: new Date(),
      });
      
      // Try to add to batch
      const added = await batch.addIfNew(messageId);
      expect(added).toBe(false);
      expect(batch.getNewCount()).toBe(0);
    });
  });

  describe('reset', () => {
    it('should clear batch state', async () => {
      await batch.addIfNew('<reset1@example.com>');
      await batch.addIfNew('<reset2@example.com>');
      expect(batch.getNewCount()).toBe(2);
      
      batch.reset();
      expect(batch.getNewCount()).toBe(0);
      
      // Should be able to add same IDs again
      const added = await batch.addIfNew('<reset1@example.com>');
      expect(added).toBe(true);
    });
  });
});