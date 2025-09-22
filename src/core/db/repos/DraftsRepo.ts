import { dbConnection } from '../connection.js';
import type { Database } from 'better-sqlite3';

export interface DraftRow {
  id: number;
  email_id: number | null;
  reply_to: string | null;
  to_email: string;
  subject: string;
  body_text: string;
  body_html: string | null;
  template_used: string | null;
  status: 'draft' | 'scheduled' | 'sent' | 'failed';
  scheduled_for: string | null;
  sent_at: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface DraftInput {
  email_id: number;
  reply_to?: string;
  to_email: string;
  subject: string;
  body_text: string;
  body_html?: string;
  template_used?: string;
  template_version?: string;
  classification?: string;
}

export class DraftsRepo {
  private db: Database.Database;

  constructor() {
    this.db = dbConnection.getDb();
  }

  insert(
    emailId: number,
    classification: string,
    templateVersion: string,
    body: string,
    additionalData?: Partial<DraftInput>
  ): number {
    const email = this.db
      .prepare('SELECT * FROM emails WHERE id = @emailId')
      .get({ emailId }) as any;

    if (!email) {
      throw new Error(`Email mit ID ${emailId} nicht gefunden`);
    }

    const stmt = this.db.prepare(`
      INSERT INTO drafts (
        email_id, reply_to, to_email, subject, body_text, body_html,
        template_used, status
      ) VALUES (
        @email_id, @reply_to, @to_email, @subject, @body_text, @body_html,
        @template_used, 'draft'
      )
    `);

    const result = stmt.run({
      email_id: emailId,
      reply_to: additionalData?.reply_to || email.message_id,
      to_email: additionalData?.to_email || email.from_email,
      subject: additionalData?.subject || `Re: ${email.subject}`,
      body_text: body,
      body_html: additionalData?.body_html || null,
      template_used: `${classification}_${templateVersion}`,
    });

    return result.lastInsertRowid as number;
  }

  findById(id: number): DraftRow | undefined {
    const stmt = this.db.prepare(`
      SELECT * FROM drafts WHERE id = @id
    `);

    return stmt.get({ id }) as DraftRow | undefined;
  }

  findByEmailId(emailId: number): DraftRow[] {
    const stmt = this.db.prepare(`
      SELECT * FROM drafts 
      WHERE email_id = @emailId 
      ORDER BY created_at DESC
    `);

    return stmt.all({ emailId }) as DraftRow[];
  }

  findPendingDrafts(): DraftRow[] {
    const stmt = this.db.prepare(`
      SELECT * FROM drafts 
      WHERE status = 'draft' 
      ORDER BY created_at ASC
    `);

    return stmt.all() as DraftRow[];
  }

  updateStatus(
    id: number,
    status: 'draft' | 'scheduled' | 'sent' | 'failed',
    errorMessage?: string
  ): void {
    const stmt = this.db.prepare(`
      UPDATE drafts 
      SET status = @status,
          error_message = @errorMessage,
          sent_at = CASE WHEN @status = 'sent' THEN CURRENT_TIMESTAMP ELSE sent_at END,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = @id
    `);

    stmt.run({
      id,
      status,
      errorMessage: errorMessage || null,
    });
  }

  schedule(id: number, scheduledFor: Date): void {
    const stmt = this.db.prepare(`
      UPDATE drafts 
      SET status = 'scheduled',
          scheduled_for = @scheduledFor,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = @id
    `);

    stmt.run({
      id,
      scheduledFor: scheduledFor.toISOString(),
    });
  }

  findScheduledDrafts(): DraftRow[] {
    const stmt = this.db.prepare(`
      SELECT * FROM drafts 
      WHERE status = 'scheduled' 
        AND scheduled_for <= CURRENT_TIMESTAMP
      ORDER BY scheduled_for ASC
    `);

    return stmt.all() as DraftRow[];
  }

  updateContent(id: number, bodyText: string, bodyHtml?: string): void {
    const stmt = this.db.prepare(`
      UPDATE drafts 
      SET body_text = @bodyText,
          body_html = @bodyHtml,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = @id AND status = 'draft'
    `);

    stmt.run({
      id,
      bodyText,
      bodyHtml: bodyHtml || null,
    });
  }

  delete(id: number): void {
    const stmt = this.db.prepare(`
      DELETE FROM drafts 
      WHERE id = @id AND status = 'draft'
    `);

    stmt.run({ id });
  }
}