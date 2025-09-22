import { EventEmitter } from 'events';
import { createLogger } from '../logger/index.js';
import { auditLogger, type AuditEventType, type AuditPayload } from './audit.js';

const logger = createLogger('events');

export interface EmailReceivedEvent {
  type: 'email.received';
  data: {
    messageId: string;
    account: string;
    subject: string;
    from: string;
  };
}

export interface EmailProcessedEvent {
  type: 'email.processed';
  data: {
    emailId: number;
    extractedData?: Record<string, unknown>;
  };
}

export interface DraftCreatedEvent {
  type: 'draft.created';
  data: {
    draftId: number;
    emailId: number;
  };
}

export interface CalendarUpdatedEvent {
  type: 'calendar.updated';
  data: {
    calendarId: string;
    slotsUpdated: number;
  };
}

export type AppEvent = 
  | EmailReceivedEvent
  | EmailProcessedEvent
  | DraftCreatedEvent
  | CalendarUpdatedEvent;

class EventBus extends EventEmitter {
  emit(event: AppEvent['type'], data: AppEvent['data']): boolean {
    logger.debug({ event, data }, 'Event emittiert');
    return super.emit(event, data);
  }
  
  on(event: AppEvent['type'], listener: (data: AppEvent['data']) => void): this {
    logger.debug({ event }, 'Event-Listener registriert');
    return super.on(event, listener);
  }
}

export const eventBus = new EventBus();

// Export appendEvent function for convenience
export function appendEvent(
  emailId: number | null,
  type: AuditEventType,
  payload: AuditPayload
): void {
  auditLogger.appendEvent(emailId, type, payload);
}

// Re-export audit types
export type { AuditEventType, AuditPayload } from './audit.js';
export { auditLogger } from './audit.js';