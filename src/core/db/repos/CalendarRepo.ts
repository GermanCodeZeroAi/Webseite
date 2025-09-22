import { dbConnection } from '../connection.js';
import type { Database } from 'better-sqlite3';

export interface CalendarSlotRow {
  id: number;
  calendar_id: string;
  start_time: string;
  end_time: string;
  is_available: boolean;
  appointment_type: string | null;
  created_at: string;
  updated_at: string;
}

export interface SlotInput {
  calendar_id: string;
  start_time: Date;
  end_time: Date;
  appointment_type?: string;
}

export class CalendarRepo {
  private db: Database.Database;

  constructor() {
    this.db = dbConnection.getDb();
  }

  // CRUD für Slots
  createSlot(slot: SlotInput): number {
    const stmt = this.db.prepare(`
      INSERT INTO calendar_slots (
        calendar_id, start_time, end_time, is_available, appointment_type
      ) VALUES (
        @calendar_id, @start_time, @end_time, TRUE, @appointment_type
      )
      ON CONFLICT(calendar_id, start_time, end_time) DO UPDATE SET
        appointment_type = excluded.appointment_type,
        updated_at = CURRENT_TIMESTAMP
    `);

    const result = stmt.run({
      calendar_id: slot.calendar_id,
      start_time: slot.start_time.toISOString(),
      end_time: slot.end_time.toISOString(),
      appointment_type: slot.appointment_type || null,
    });

    return result.lastInsertRowid as number;
  }

  findSlotById(id: number): CalendarSlotRow | undefined {
    const stmt = this.db.prepare(`
      SELECT * FROM calendar_slots WHERE id = @id
    `);

    return stmt.get({ id }) as CalendarSlotRow | undefined;
  }

  findAvailableSlots(
    calendarId: string,
    startDate: Date,
    endDate: Date
  ): CalendarSlotRow[] {
    const stmt = this.db.prepare(`
      SELECT * FROM calendar_slots 
      WHERE calendar_id = @calendarId
        AND is_available = TRUE
        AND start_time >= @startDate
        AND start_time <= @endDate
      ORDER BY start_time ASC
    `);

    return stmt.all({
      calendarId,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    }) as CalendarSlotRow[];
  }

  updateSlotAvailability(id: number, isAvailable: boolean): void {
    const stmt = this.db.prepare(`
      UPDATE calendar_slots 
      SET is_available = @isAvailable,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = @id
    `);

    stmt.run({ id, isAvailable });
  }

  deleteSlot(id: number): void {
    const stmt = this.db.prepare(`
      DELETE FROM calendar_slots WHERE id = @id
    `);

    stmt.run({ id });
  }

  // Hold-Mechanismus für temporäre Reservierungen
  hold(slotId: number, emailId: number, ttlMinutes: number): boolean {
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + ttlMinutes);

    // Prüfe ob Slot verfügbar ist
    const slot = this.findSlotById(slotId);
    if (!slot || !slot.is_available) {
      return false;
    }

    // Speichere Hold-Info im appointment_type als JSON
    const holdInfo = {
      type: 'hold',
      email_id: emailId,
      expires_at: expiresAt.toISOString(),
    };

    const stmt = this.db.prepare(`
      UPDATE calendar_slots 
      SET is_available = FALSE,
          appointment_type = @holdInfo,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = @slotId AND is_available = TRUE
    `);

    const result = stmt.run({
      slotId,
      holdInfo: JSON.stringify(holdInfo),
    });

    return result.changes > 0;
  }

  confirm(slotId: number): boolean {
    const slot = this.findSlotById(slotId);
    if (!slot || slot.is_available) {
      return false;
    }

    // Parse hold info
    let holdInfo: any = {};
    try {
      if (slot.appointment_type) {
        holdInfo = JSON.parse(slot.appointment_type);
      }
    } catch {
      // Ignore parse errors
    }

    if (holdInfo.type !== 'hold') {
      return false;
    }

    // Confirm by changing type
    holdInfo.type = 'confirmed';
    holdInfo.confirmed_at = new Date().toISOString();

    const stmt = this.db.prepare(`
      UPDATE calendar_slots 
      SET appointment_type = @holdInfo,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = @slotId
    `);

    const result = stmt.run({
      slotId,
      holdInfo: JSON.stringify(holdInfo),
    });

    return result.changes > 0;
  }

  releaseExpiredHolds(): number {
    // Finde alle Slots mit abgelaufenen Holds
    const stmt = this.db.prepare(`
      UPDATE calendar_slots 
      SET is_available = TRUE,
          appointment_type = NULL,
          updated_at = CURRENT_TIMESTAMP
      WHERE is_available = FALSE
        AND appointment_type LIKE '%"type":"hold"%'
        AND json_extract(appointment_type, '$.expires_at') < CURRENT_TIMESTAMP
    `);

    const result = stmt.run();
    return result.changes;
  }

  // Hilfsmethoden
  findSlotsByEmailId(emailId: number): CalendarSlotRow[] {
    const stmt = this.db.prepare(`
      SELECT * FROM calendar_slots 
      WHERE appointment_type LIKE @pattern
      ORDER BY start_time ASC
    `);

    return stmt.all({
      pattern: `%"email_id":${emailId}%`,
    }) as CalendarSlotRow[];
  }

  syncSlots(calendarId: string, slots: SlotInput[]): void {
    const transaction = this.db.transaction(() => {
      // Lösche alte Slots die nicht mehr existieren
      const existingStart = slots[0]?.start_time;
      const existingEnd = slots[slots.length - 1]?.end_time;

      if (existingStart && existingEnd) {
        this.db.prepare(`
          DELETE FROM calendar_slots 
          WHERE calendar_id = @calendarId
            AND start_time >= @startTime
            AND end_time <= @endTime
            AND (is_available = TRUE OR appointment_type IS NULL)
        `).run({
          calendarId,
          startTime: existingStart.toISOString(),
          endTime: existingEnd.toISOString(),
        });
      }

      // Füge neue Slots hinzu
      for (const slot of slots) {
        this.createSlot(slot);
      }
    });

    transaction();
  }
}