import { dbConnection } from '../connection.js';
import type { Database } from 'better-sqlite3';

export interface ExtractedDataRow {
  id: number;
  email_id: number;
  data_type: string;
  extracted_data: string;
  confidence: number;
  validated: boolean;
  created_at: string;
  updated_at: string;
}

export interface ExtractedFields {
  data_type: string;
  data: Record<string, unknown>;
}

export class ExtractedRepo {
  private db: Database.Database;

  constructor() {
    this.db = dbConnection.getDb();
  }

  upsert(emailId: number, fields: ExtractedFields, confidence: number): number {
    // Check if extraction already exists
    const existing = this.db
      .prepare(`
        SELECT id FROM extracted_data 
        WHERE email_id = @emailId AND data_type = @dataType
      `)
      .get({ emailId, dataType: fields.data_type });

    if (existing) {
      // Update existing
      const updateStmt = this.db.prepare(`
        UPDATE extracted_data 
        SET extracted_data = @extractedData,
            confidence = @confidence,
            updated_at = CURRENT_TIMESTAMP
        WHERE email_id = @emailId AND data_type = @dataType
      `);

      updateStmt.run({
        emailId,
        dataType: fields.data_type,
        extractedData: JSON.stringify(fields.data),
        confidence,
      });

      return (existing as { id: number }).id;
    } else {
      // Insert new
      const insertStmt = this.db.prepare(`
        INSERT INTO extracted_data (
          email_id, data_type, extracted_data, confidence, validated
        ) VALUES (
          @emailId, @dataType, @extractedData, @confidence, FALSE
        )
      `);

      const result = insertStmt.run({
        emailId,
        dataType: fields.data_type,
        extractedData: JSON.stringify(fields.data),
        confidence,
      });

      return result.lastInsertRowid as number;
    }
  }

  findByEmailId(emailId: number): ExtractedDataRow[] {
    const stmt = this.db.prepare(`
      SELECT * FROM extracted_data 
      WHERE email_id = @emailId 
      ORDER BY confidence DESC, created_at DESC
    `);

    return stmt.all({ emailId }) as ExtractedDataRow[];
  }

  findByType(emailId: number, dataType: string): ExtractedDataRow | undefined {
    const stmt = this.db.prepare(`
      SELECT * FROM extracted_data 
      WHERE email_id = @emailId AND data_type = @dataType
    `);

    return stmt.get({ emailId, dataType }) as ExtractedDataRow | undefined;
  }

  validate(id: number): void {
    const stmt = this.db.prepare(`
      UPDATE extracted_data 
      SET validated = TRUE,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = @id
    `);

    stmt.run({ id });
  }

  deleteByEmailId(emailId: number): void {
    const stmt = this.db.prepare(`
      DELETE FROM extracted_data WHERE email_id = @emailId
    `);

    stmt.run({ emailId });
  }

  getHighConfidenceData(emailId: number, minConfidence = 0.8): ExtractedDataRow[] {
    const stmt = this.db.prepare(`
      SELECT * FROM extracted_data 
      WHERE email_id = @emailId AND confidence >= @minConfidence
      ORDER BY confidence DESC
    `);

    return stmt.all({ emailId, minConfidence }) as ExtractedDataRow[];
  }
}