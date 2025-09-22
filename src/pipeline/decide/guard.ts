import { createLogger } from '../../core/logger/index.js';
import { EventsRepo } from '../../core/db/repos/EventsRepo.js';
import { EmailsRepo } from '../../core/db/repos/EmailsRepo.js';
import { guardPolicy, GuardPolicyInput } from '../../ai/guard/policy.js';

const logger = createLogger('pipeline:decide:guard');

export interface EmailContext {
  emailId: number;
  klass: string;
  confidence: number;
  flags: string[];
  details: Record<string, unknown>;
  kbPolicy?: Record<string, unknown>;
  state: string;
}

export interface GuardDecision {
  emailId: number;
  shouldAutoReply: boolean;
  escalationReason?: string;
  escalationFlags: string[];
  timestamp: Date;
}

export class GuardDecisionMaker {
  private eventsRepo = new EventsRepo();
  private emailsRepo = new EmailsRepo();

  /**
   * Trifft die Guard-Entscheidung für eine E-Mail
   */
  async decide(context: EmailContext): Promise<GuardDecision> {
    logger.info('Guard-Entscheidung wird getroffen', {
      emailId: context.emailId,
      klass: context.klass,
      confidence: context.confidence,
      currentState: context.state
    });

    try {
      // Bereite Input für Policy vor
      const policyInput: GuardPolicyInput = {
        klass: context.klass,
        details: context.details,
        flags: context.flags,
        kbPolicy: context.kbPolicy,
        confidence: context.confidence
      };

      // Evaluiere Policy
      const policyResult = guardPolicy.evaluate(policyInput);

      // Erstelle Entscheidung
      const decision: GuardDecision = {
        emailId: context.emailId,
        shouldAutoReply: policyResult.auto,
        escalationReason: policyResult.auto ? undefined : policyResult.reason,
        escalationFlags: policyResult.escalateFlags,
        timestamp: new Date()
      };

      // Logge Event
      await this.logDecisionEvent(context, decision);

      // Update E-Mail Status wenn eskaliert
      if (!decision.shouldAutoReply) {
        await this.escalateEmail(context, decision);
      }

      logger.info('Guard-Entscheidung abgeschlossen', {
        emailId: context.emailId,
        decision: decision.shouldAutoReply ? 'AUTO_REPLY' : 'ESCALATE',
        reason: decision.escalationReason
      });

      return decision;

    } catch (error) {
      logger.error('Fehler bei Guard-Entscheidung', {
        emailId: context.emailId,
        error: error instanceof Error ? error.message : String(error)
      });

      // Im Fehlerfall immer eskalieren
      const fallbackDecision: GuardDecision = {
        emailId: context.emailId,
        shouldAutoReply: false,
        escalationReason: 'guard_error',
        escalationFlags: ['GUARD_ERROR'],
        timestamp: new Date()
      };

      await this.logDecisionEvent(context, fallbackDecision);
      await this.escalateEmail(context, fallbackDecision);

      return fallbackDecision;
    }
  }

  /**
   * Loggt die Guard-Entscheidung als Event
   */
  private async logDecisionEvent(
    context: EmailContext, 
    decision: GuardDecision
  ): Promise<void> {
    const eventType = decision.shouldAutoReply ? 'GUARD_APPROVED' : 'ESCALATED';
    
    await this.eventsRepo.logEvent(eventType, 'guard', {
      emailId: context.emailId,
      klass: context.klass,
      confidence: context.confidence,
      flags: context.flags,
      decision: decision.shouldAutoReply ? 'auto_reply' : 'escalate',
      escalationReason: decision.escalationReason,
      escalationFlags: decision.escalationFlags,
      timestamp: decision.timestamp.toISOString()
    });
  }

  /**
   * Eskaliert eine E-Mail und aktualisiert ihren Status
   */
  private async escalateEmail(
    context: EmailContext, 
    decision: GuardDecision
  ): Promise<void> {
    try {
      // Update E-Mail Metadaten
      const metadata = {
        state: 'ESCALATED',
        escalatedAt: decision.timestamp.toISOString(),
        escalationReason: decision.escalationReason,
        escalationFlags: decision.escalationFlags,
        guardDecision: {
          timestamp: decision.timestamp.toISOString(),
          reason: decision.escalationReason,
          flags: decision.escalationFlags
        }
      };

      // Führe Update durch (status bleibt 'processing', state wird 'ESCALATED')
      await this.emailsRepo.updateMetadata(context.emailId, metadata);

      // Logge zusätzliches Eskalations-Event
      await this.eventsRepo.logEvent('EMAIL_ESCALATED', 'guard', {
        emailId: context.emailId,
        reason: decision.escalationReason,
        flags: decision.escalationFlags,
        previousState: context.state,
        newState: 'ESCALATED'
      });

      logger.warn('E-Mail wurde eskaliert', {
        emailId: context.emailId,
        reason: decision.escalationReason,
        flags: decision.escalationFlags
      });

    } catch (error) {
      logger.error('Fehler beim Eskalieren der E-Mail', {
        emailId: context.emailId,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Batch-Verarbeitung mehrerer E-Mails
   */
  async decideBatch(contexts: EmailContext[]): Promise<GuardDecision[]> {
    logger.info(`Verarbeite ${contexts.length} E-Mails im Batch`);

    const decisions = await Promise.all(
      contexts.map(context => this.decide(context))
    );

    const autoReplyCount = decisions.filter(d => d.shouldAutoReply).length;
    const escalatedCount = decisions.filter(d => !d.shouldAutoReply).length;

    logger.info('Batch-Verarbeitung abgeschlossen', {
      total: contexts.length,
      autoReply: autoReplyCount,
      escalated: escalatedCount
    });

    return decisions;
  }

  /**
   * Gibt Statistiken über Guard-Entscheidungen zurück
   */
  async getStatistics(timeframe: { start: Date; end: Date }): Promise<Record<string, unknown>> {
    const events = await this.eventsRepo.getEventsByType(
      ['GUARD_APPROVED', 'ESCALATED', 'EMAIL_ESCALATED'],
      timeframe.start,
      timeframe.end
    );

    const stats = {
      total: 0,
      approved: 0,
      escalated: 0,
      escalationReasons: {} as Record<string, number>,
      escalationFlags: {} as Record<string, number>
    };

    for (const event of events) {
      stats.total++;
      
      if (event.event_type === 'GUARD_APPROVED') {
        stats.approved++;
      } else {
        stats.escalated++;
        
        const data = JSON.parse(event.data || '{}');
        if (data.escalationReason) {
          stats.escalationReasons[data.escalationReason] = 
            (stats.escalationReasons[data.escalationReason] || 0) + 1;
        }
        
        if (data.escalationFlags) {
          for (const flag of data.escalationFlags) {
            stats.escalationFlags[flag] = (stats.escalationFlags[flag] || 0) + 1;
          }
        }
      }
    }

    return {
      ...stats,
      approvalRate: stats.total > 0 ? (stats.approved / stats.total) : 0,
      escalationRate: stats.total > 0 ? (stats.escalated / stats.total) : 0
    };
  }
}

// Singleton-Export
export const guardDecisionMaker = new GuardDecisionMaker();