import { DraftsRepo } from '../../core/db/repos/DraftsRepo.js';
import { EmailsRepo } from '../../core/db/repos/EmailsRepo.js';
import { SettingsRepo } from '../../core/db/repos/SettingsRepo.js';
import { ExtractedRepo } from '../../core/db/repos/ExtractedRepo.js';
import { TemplateEngine, type PraxisSettings, type TemplateVariables } from '../../ai/templates/engine.js';
import { logger } from '../../core/logger/index.js';
import { auditLogger } from '../../core/events/audit.js';

export interface EmailClassification {
  category: string;
  confidence: number;
  guard?: 'sensibel' | 'normal';
  extractedData?: any;
}

export interface PolicyKnowledgeBase {
  getPolicyHint(category: string): string | undefined;
  getAnswer(question: string): string | undefined;
}

// Placeholder KB implementation - in production this would be more sophisticated
class SimpleKnowledgeBase implements PolicyKnowledgeBase {
  private policies: Map<string, string> = new Map([
    ['au_bescheinigung', 'Hinweis: Arbeitsunfähigkeitsbescheinigungen können rückwirkend maximal 3 Tage ausgestellt werden.'],
    ['rezept', 'Hinweis: Rezepte für Dauermedikation können für maximal 3 Monate ausgestellt werden.'],
    ['termin_absage', 'Hinweis: Termine müssen mindestens 24 Stunden vorher abgesagt werden.'],
  ]);

  private faqs: Map<string, string> = new Map([
    ['sprechzeiten', 'Unsere Sprechzeiten sind: Mo-Fr 8:00-12:00 Uhr, Mo/Di/Do 14:00-18:00 Uhr'],
    ['notfall', 'In dringenden Notfällen außerhalb der Sprechzeiten wenden Sie sich bitte an den ärztlichen Bereitschaftsdienst unter 116 117.'],
  ]);

  getPolicyHint(category: string): string | undefined {
    return this.policies.get(category);
  }

  getAnswer(question: string): string | undefined {
    // Simple keyword matching - in production use proper NLP
    const lowerQuestion = question.toLowerCase();
    for (const [key, answer] of this.faqs) {
      if (lowerQuestion.includes(key)) {
        return answer;
      }
    }
    return undefined;
  }
}

export class ReplyGenerator {
  private draftsRepo: DraftsRepo;
  private emailsRepo: EmailsRepo;
  private settingsRepo: SettingsRepo;
  private extractedRepo: ExtractedRepo;
  private templateEngine: TemplateEngine;
  private kb: PolicyKnowledgeBase;

  constructor() {
    this.draftsRepo = new DraftsRepo();
    this.emailsRepo = new EmailsRepo();
    this.settingsRepo = new SettingsRepo();
    this.extractedRepo = new ExtractedRepo();
    this.templateEngine = new TemplateEngine();
    this.kb = new SimpleKnowledgeBase();
  }

  /**
   * Generate a reply for an email based on its classification
   */
  async generateReply(
    emailId: number,
    classification: EmailClassification
  ): Promise<number> {
    try {
      // Get email details
      const email = this.emailsRepo.findById(emailId);
      if (!email) {
        throw new Error(`Email mit ID ${emailId} nicht gefunden`);
      }

      // Get practice settings
      const settings = await this.loadPraxisSettings();

      // Select template based on classification
      const { templateName, variables } = await this.selectTemplateAndVariables(
        email,
        classification
      );

      // Render the template
      const bodyText = await this.templateEngine.render(
        templateName,
        variables,
        settings,
        this.kb
      );

      // Add policy hints if applicable
      const finalBody = this.addPolicyHints(bodyText, classification.category);

      // Save draft
      const draftId = this.draftsRepo.insert(
        emailId,
        classification.category,
        '1.0', // Template version
        finalBody,
        {
          subject: this.generateSubject(email, classification),
          template_used: templateName,
        }
      );

      // Update email state to DRAFTED
      this.emailsRepo.updateClassification(
        emailId,
        classification.category,
        classification.confidence,
        { state: 'DRAFTED' }
      );

      // Log event
      auditLogger.logEmailProcessed(
        emailId,
        classification.category,
        { draftId, templateUsed: templateName }
      );

      logger.info('Antwort-Entwurf erstellt', {
        emailId,
        draftId,
        category: classification.category,
        template: templateName,
      });

      return draftId;
    } catch (error) {
      logger.error('Fehler beim Generieren der Antwort', {
        emailId,
        classification,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Load practice settings from database
   */
  private async loadPraxisSettings(): Promise<PraxisSettings> {
    const settings = this.settingsRepo.getAll();
    
    return {
      PRAXIS_NAME: settings['praxis.name'] || 'Praxis Dr. Mustermann',
      PRAXIS_FACHGEBIET: settings['praxis.fachgebiet'] || 'Allgemeinmedizin',
      PRAXIS_STRASSE: settings['praxis.strasse'] || 'Musterstraße 1',
      PRAXIS_PLZ: settings['praxis.plz'] || '12345',
      PRAXIS_ORT: settings['praxis.ort'] || 'Musterstadt',
      PRAXIS_TELEFON: settings['praxis.telefon'] || '0123 / 456789',
      PRAXIS_FAX: settings['praxis.fax'] || '0123 / 456788',
      PRAXIS_EMAIL: settings['praxis.email'] || 'info@praxis-mustermann.de',
      SPRECHZEITEN: settings['praxis.sprechzeiten'] || 'Mo-Fr 8:00-12:00, Mo/Di/Do 14:00-18:00',
      LLM_REWRITE_ENABLED: settings['llm.rewrite.enabled'] === 'true',
      LLM_REWRITE_STYLE: settings['llm.rewrite.style'] || 'de-praxis-höflich',
      LLM_REWRITE_TEMPERATURE: parseFloat(settings['llm.rewrite.temperature'] || '0.3'),
    };
  }

  /**
   * Select appropriate template and prepare variables
   */
  private async selectTemplateAndVariables(
    email: any,
    classification: EmailClassification
  ): Promise<{ templateName: string; variables: TemplateVariables }> {
    const extractedData = classification.extractedData || {};
    const fromName = email.from_name || email.from_email.split('@')[0];

    // Handle sensitive cases first
    if (classification.guard === 'sensibel') {
      return {
        templateName: 'vorsicht_sensibel',
        variables: {
          NAME: fromName,
        },
      };
    }

    // Select template based on category
    switch (classification.category) {
      case 'termin_anfrage':
      case 'appointment_request':
        return {
          templateName: 'termin_vorschlag',
          variables: {
            NAME: fromName,
            DATUM: extractedData.suggestedDate || 'Montag, 01.01.2024',
            UHRZEIT: extractedData.suggestedTime || '10:00',
            HOLD_HINT: 'Bitte beachten Sie, dass wir den Termin erst nach Ihrer Bestätigung fest einplanen.',
          },
        };

      case 'termin_bestaetigung':
      case 'appointment_confirmation':
        return {
          templateName: 'termin_bestaetigung',
          variables: {
            NAME: fromName,
            DATUM: extractedData.date || 'Montag, 01.01.2024',
            UHRZEIT: extractedData.time || '10:00',
            ORT: extractedData.location || 'Hauptpraxis, 1. Stock',
          },
        };

      case 'termin_absage':
      case 'appointment_cancellation':
        return {
          templateName: 'termin_absage',
          variables: {
            NAME: fromName,
            DATUM: extractedData.date || 'dem gewünschten Datum',
            UHRZEIT: extractedData.time || 'der gewünschten Uhrzeit',
            GRUND: extractedData.reason || 'Der Zeitslot ist bereits vergeben.',
          },
        };

      case 'faq':
      case 'general_inquiry':
        const answer = this.kb.getAnswer(email.body_text || '') || 
                      'Wir haben Ihre Anfrage erhalten und werden sie schnellstmöglich bearbeiten.';
        return {
          templateName: 'faq_antwort',
          variables: {
            NAME: fromName,
            ANTWORT_KB: answer,
          },
        };

      default:
        // Fallback to FAQ template
        return {
          templateName: 'faq_antwort',
          variables: {
            NAME: fromName,
            ANTWORT_KB: 'Vielen Dank für Ihre Nachricht. Wir werden Ihr Anliegen prüfen und uns bei Ihnen melden.',
          },
        };
    }
  }

  /**
   * Generate appropriate subject line
   */
  private generateSubject(email: any, classification: EmailClassification): string {
    const originalSubject = email.subject || '';
    
    // If it's already a reply, keep the Re:
    if (originalSubject.toLowerCase().startsWith('re:')) {
      return originalSubject;
    }

    // Add Re: based on category
    switch (classification.category) {
      case 'termin_anfrage':
      case 'appointment_request':
        return `Re: ${originalSubject} - Terminvorschlag`;
      
      case 'termin_bestaetigung':
      case 'appointment_confirmation':
        return `Re: ${originalSubject} - Terminbestätigung`;
      
      case 'termin_absage':
      case 'appointment_cancellation':
        return `Re: ${originalSubject}`;
      
      default:
        return `Re: ${originalSubject}`;
    }
  }

  /**
   * Add policy hints to the reply if applicable
   */
  private addPolicyHints(bodyText: string, category: string): string {
    const hint = this.kb.getPolicyHint(category);
    
    if (hint) {
      // Insert hint before signature
      const signatureStart = bodyText.lastIndexOf('\n\n');
      if (signatureStart > 0) {
        return (
          bodyText.substring(0, signatureStart) +
          '\n\n' + hint +
          bodyText.substring(signatureStart)
        );
      } else {
        return bodyText + '\n\n' + hint;
      }
    }

    return bodyText;
  }
}