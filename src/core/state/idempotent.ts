import { createHash } from 'crypto';
import { EmailsRepo } from '../db/repos/index.js';
import { createLogger } from '../logger/index.js';

const logger = createLogger('state:idempotent');

export class IdempotencyChecker {
  private emailsRepo: EmailsRepo;

  constructor() {
    this.emailsRepo = new EmailsRepo();
  }

  /**
   * Generiert einen Hash aus Message-ID und normalisiertem Body
   */
  generateTextHash(messageId: string, bodyText: string): string {
    const normalizedBody = this.normalizeText(bodyText);
    const content = `${messageId}:${normalizedBody}`;
    
    return createHash('sha256')
      .update(content, 'utf8')
      .digest('hex');
  }

  /**
   * Normalisiert Text für konsistentes Hashing
   */
  private normalizeText(text: string): string {
    return text
      .toLowerCase()
      .replace(/\s+/g, ' ')           // Mehrfache Whitespaces zu einem Space
      .replace(/[\r\n]+/g, '\n')      // Normalisiere Zeilenumbrüche
      .replace(/[^\w\s\n.,!?@-]/g, '') // Entferne Sonderzeichen
      .trim();
  }

  /**
   * Prüft ob eine E-Mail bereits existiert (Duplikat-Check)
   */
  async isDuplicate(messageId: string, bodyText?: string): Promise<boolean> {
    // Zuerst Check auf Message-ID
    const existingByMessageId = this.emailsRepo.findByMessageId(messageId);
    if (existingByMessageId) {
      logger.debug({ messageId }, 'Duplikat gefunden: Message-ID existiert bereits');
      return true;
    }

    // Falls Body vorhanden, zusätzlicher Check auf Text-Hash
    if (bodyText) {
      const textHash = this.generateTextHash(messageId, bodyText);
      const existingByHash = this.emailsRepo.findByTextHash(textHash);
      
      if (existingByHash) {
        logger.warn(
          { messageId, existingId: existingByHash.id },
          'Duplikat gefunden: Gleicher Inhalt mit anderer Message-ID'
        );
        return true;
      }
    }

    return false;
  }

  /**
   * Speichert den Text-Hash für eine E-Mail
   */
  storeTextHash(emailId: number, messageId: string, bodyText: string): void {
    const textHash = this.generateTextHash(messageId, bodyText);
    this.emailsRepo.storeTextHash(emailId, textHash);
    logger.debug({ emailId, textHash }, 'Text-Hash gespeichert');
  }

  /**
   * Prüft und markiert eine E-Mail als verarbeitet
   */
  async processEmail(
    messageId: string,
    bodyText: string,
    processFunc: () => Promise<number>
  ): Promise<{ emailId: number; isDuplicate: boolean }> {
    // Prüfe auf Duplikat
    const isDuplicate = await this.isDuplicate(messageId, bodyText);
    if (isDuplicate) {
      return { emailId: 0, isDuplicate: true };
    }

    // Verarbeite E-Mail
    const emailId = await processFunc();

    // Speichere Text-Hash für zukünftige Duplikat-Erkennung
    this.storeTextHash(emailId, messageId, bodyText);

    return { emailId, isDuplicate: false };
  }
}

/**
 * Hilfsklasse für Batch-Operationen mit Idempotenz
 */
export class IdempotentBatch {
  private checker: IdempotencyChecker;
  private processed = new Set<string>();

  constructor() {
    this.checker = new IdempotencyChecker();
  }

  /**
   * Fügt eine E-Mail zum Batch hinzu, wenn sie nicht bereits verarbeitet wurde
   */
  async addIfNew(messageId: string, bodyText?: string): Promise<boolean> {
    // Check im aktuellen Batch
    if (this.processed.has(messageId)) {
      return false;
    }

    // Check in der Datenbank
    const isDuplicate = await this.checker.isDuplicate(messageId, bodyText);
    if (isDuplicate) {
      return false;
    }

    this.processed.add(messageId);
    return true;
  }

  /**
   * Gibt die Anzahl der neuen (nicht-duplizierten) E-Mails zurück
   */
  getNewCount(): number {
    return this.processed.size;
  }

  /**
   * Setzt den Batch zurück
   */
  reset(): void {
    this.processed.clear();
  }
}

// Singleton-Export für einfache Verwendung
export const idempotencyChecker = new IdempotencyChecker();