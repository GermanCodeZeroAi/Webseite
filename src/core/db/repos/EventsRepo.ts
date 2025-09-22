import { dbConnection } from '../connection.js';
import type { Database } from 'better-sqlite3';

export interface EventRow {
  id: number;
  event_type: string;
  source: string;
  data: string | null;
  processed: boolean;
  created_at: string;
}

export interface EventInput {
  event_type: string;
  source: string;
  data?: Record<string, unknown>;
  email_id?: number;
}

export class EventsRepo {
  private db: Database.Database;

  constructor() {
    this.db = dbConnection.getDb();
  }

  append(emailId: number | null, type: string, jsonData: Record<string, unknown>): number {
    const stmt = this.db.prepare(`
      INSERT INTO events (
        event_type, source, data, processed
      ) VALUES (
        @event_type, @source, @data, FALSE
      )
    `);

    const eventData = {
      ...jsonData,
      email_id: emailId,
      timestamp: new Date().toISOString(),
    };

    const result = stmt.run({
      event_type: type,
      source: 'system',
      data: JSON.stringify(eventData),
    });

    return result.lastInsertRowid as number;
  }

  findById(id: number): EventRow | undefined {
    const stmt = this.db.prepare(`
      SELECT * FROM events WHERE id = @id
    `);

    return stmt.get({ id }) as EventRow | undefined;
  }

  findUnprocessed(limit = 100): EventRow[] {
    const stmt = this.db.prepare(`
      SELECT * FROM events 
      WHERE processed = FALSE 
      ORDER BY created_at ASC 
      LIMIT @limit
    `);

    return stmt.all({ limit }) as EventRow[];
  }

  findByType(eventType: string, limit = 100): EventRow[] {
    const stmt = this.db.prepare(`
      SELECT * FROM events 
      WHERE event_type = @eventType 
      ORDER BY created_at DESC 
      LIMIT @limit
    `);

    return stmt.all({ eventType, limit }) as EventRow[];
  }

  findByEmailId(emailId: number): EventRow[] {
    const stmt = this.db.prepare(`
      SELECT * FROM events 
      WHERE json_extract(data, '$.email_id') = @emailId
      ORDER BY created_at ASC
    `);

    return stmt.all({ emailId }) as EventRow[];
  }

  markProcessed(id: number): void {
    const stmt = this.db.prepare(`
      UPDATE events 
      SET processed = TRUE 
      WHERE id = @id
    `);

    stmt.run({ id });
  }

  markBatchProcessed(ids: number[]): void {
    if (ids.length === 0) return;

    const placeholders = ids.map(() => '?').join(',');
    const stmt = this.db.prepare(`
      UPDATE events 
      SET processed = TRUE 
      WHERE id IN (${placeholders})
    `);

    stmt.run(...ids);
  }

  // Hilfsmethoden für verschiedene Event-Typen
  logEmailReceived(emailId: number, messageId: string, from: string): number {
    return this.append(emailId, 'email.received', {
      message_id: messageId,
      from_email: from,
    });
  }

  logEmailClassified(emailId: number, classification: string, score: number): number {
    return this.append(emailId, 'email.classified', {
      classification,
      score,
    });
  }

  logDraftCreated(emailId: number, draftId: number, template: string): number {
    return this.append(emailId, 'draft.created', {
      draft_id: draftId,
      template_used: template,
    });
  }

  logDraftSent(emailId: number, draftId: number, to: string): number {
    return this.append(emailId, 'draft.sent', {
      draft_id: draftId,
      to_email: to,
    });
  }

  logError(emailId: number | null, error: string, context?: Record<string, unknown>): number {
    return this.append(emailId, 'error', {
      error_message: error,
      context: context || {},
    });
  }

  // Bereinigung alter Events
  deleteOldEvents(daysToKeep = 30): number {
    const stmt = this.db.prepare(`
      DELETE FROM events 
      WHERE created_at < datetime('now', '-' || @days || ' days')
        AND processed = TRUE
    `);

    const result = stmt.run({ days: daysToKeep });
    return result.changes;
  }

  // Statistiken
  getEventStats(): Record<string, number> {
    const stmt = this.db.prepare(`
      SELECT event_type, COUNT(*) as count 
      FROM events 
      GROUP BY event_type
    `);

    const rows = stmt.all() as Array<{ event_type: string; count: number }>;
    const stats: Record<string, number> = {};
    
    for (const row of rows) {
      stats[row.event_type] = row.count;
    }
    
    return stats;
  }
}