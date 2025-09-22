import { dbConnection } from '../connection.js';
import type { Database } from 'better-sqlite3';

export interface EmailRow {
  id: number;
  message_id: string;
  account_email: string;
  folder: string;
  from_email: string;
  from_name?: string | null;
  to_email: string;
  subject: string;
  body_text?: string | null;
  body_html?: string | null;
  received_at: string;
  headers?: string | null;
  attachments?: string | null;
  status: 'new' | 'processing' | 'processed' | 'failed' | 'ignored';
  error_message?: string | null;
  created_at: string;
  updated_at: string;
}

export interface IngestedEmail {
  message_id: string;
  account_email: string;
  folder?: string;
  from_email: string;
  from_name?: string;
  to_email: string;
  subject: string;
  body_text?: string;
  body_html?: string;
  received_at: Date;
  headers?: Record<string, unknown>;
  attachments?: Array<{ filename: string; size: number; contentType: string }>;
}

export class EmailsRepo {
  private db: Database.Database;

  constructor() {
    this.db = dbConnection.getDb();
  }

  insertIngested(email: IngestedEmail): number {
    const stmt = this.db.prepare(`
      INSERT INTO emails (
        message_id, account_email, folder, from_email, from_name,
        to_email, subject, body_text, body_html, received_at,
        headers, attachments, status
      ) VALUES (
        @message_id, @account_email, @folder, @from_email, @from_name,
        @to_email, @subject, @body_text, @body_html, @received_at,
        @headers, @attachments, 'new'
      )
    `);

    const result = stmt.run({
      ...email,
      folder: email.folder || 'INBOX',
      from_name: email.from_name || null,
      body_text: email.body_text || null,
      body_html: email.body_html || null,
      received_at: email.received_at.toISOString(),
      headers: email.headers ? JSON.stringify(email.headers) : null,
      attachments: email.attachments ? JSON.stringify(email.attachments) : null,
    });

    return result.lastInsertRowid as number;
  }

  markClassified(
    id: number,
    classification: string,
    score: number,
    flags?: Record<string, unknown>
  ): void {
    const stmt = this.db.prepare(`
      UPDATE emails 
      SET status = 'processing',
          headers = json_set(
            COALESCE(headers, '{}'),
            '$.classification', @classification,
            '$.classificationScore', @score,
            '$.classificationFlags', json(@flags)
          ),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = @id
    `);

    stmt.run({
      id,
      classification,
      score,
      flags: flags ? JSON.stringify(flags) : '{}',
    });
  }

  addPIIFlags(id: number, piiData: Record<string, unknown>): void {
    const stmt = this.db.prepare(`
      UPDATE emails 
      SET headers = json_set(
            COALESCE(headers, '{}'),
            '$.pii', json(@piiData)
          ),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = @id
    `);

    stmt.run({
      id,
      piiData: JSON.stringify(piiData),
    });
  }

  upsertState(id: number, state: string): void {
    const validStates = ['new', 'processing', 'processed', 'failed', 'ignored'];
    if (!validStates.includes(state)) {
      throw new Error(`Invalid state: ${state}`);
    }

    const stmt = this.db.prepare(`
      UPDATE emails 
      SET status = @state,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = @id
    `);

    stmt.run({ id, state });
  }

  findByMessageId(messageId: string): EmailRow | undefined {
    const stmt = this.db.prepare(`
      SELECT * FROM emails WHERE message_id = @messageId
    `);

    return stmt.get({ messageId }) as EmailRow | undefined;
  }

  findByTextHash(hash: string): EmailRow | undefined {
    // Suche im headers JSON nach dem text_hash
    const stmt = this.db.prepare(`
      SELECT * FROM emails 
      WHERE json_extract(headers, '$.text_hash') = @hash
    `);

    return stmt.get({ hash }) as EmailRow | undefined;
  }

  findById(id: number): EmailRow | undefined {
    const stmt = this.db.prepare(`
      SELECT * FROM emails WHERE id = @id
    `);

    return stmt.get({ id }) as EmailRow | undefined;
  }

  findPendingEmails(limit = 10): EmailRow[] {
    const stmt = this.db.prepare(`
      SELECT * FROM emails 
      WHERE status = 'new' 
      ORDER BY received_at ASC 
      LIMIT @limit
    `);

    return stmt.all({ limit }) as EmailRow[];
  }

  updateError(id: number, errorMessage: string): void {
    const stmt = this.db.prepare(`
      UPDATE emails 
      SET status = 'failed',
          error_message = @errorMessage,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = @id
    `);

    stmt.run({ id, errorMessage });
  }

  storeTextHash(id: number, hash: string): void {
    const stmt = this.db.prepare(`
      UPDATE emails 
      SET headers = json_set(
            COALESCE(headers, '{}'),
            '$.text_hash', @hash
          ),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = @id
    `);

    stmt.run({ id, hash });
  }
}