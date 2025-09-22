import { createLogger } from '../../core/logger/index.js';
import { TypedSettings } from '../../core/config/settings.js';

const logger = createLogger('ai:guard:policy');

export interface GuardPolicyInput {
  klass: string;
  details: Record<string, unknown>;
  flags: string[];
  kbPolicy?: Record<string, unknown>;
  confidence: number;
}

export interface GuardPolicyResult {
  auto: boolean;
  reason: string;
  escalateFlags: string[];
}

// Sensitive Kategorien, die immer eskaliert werden müssen
const SENSITIVE_CATEGORIES = [
  'rezept',
  'prescription',
  'au_anfrage',
  'sick_note_request',
  'arbeitsunfähigkeit',
  'unclear_intent'
];

// Bekannte Fremdsprachen-Flags
const FOREIGN_LANGUAGE_FLAGS = [
  'FOREIGN_LANGUAGE',
  'NON_GERMAN',
  'TRANSLATION_NEEDED'
];

export class GuardPolicy {
  private settings: TypedSettings | null = null;

  constructor(settings?: TypedSettings) {
    this.settings = settings || null;
  }

  private getSettings(): TypedSettings {
    if (!this.settings) {
      this.settings = new TypedSettings();
    }
    return this.settings;
  }

  /**
   * Entscheidet, ob eine automatische Antwort gesendet werden kann
   * oder ob der Fall eskaliert werden muss.
   */
  evaluate(input: GuardPolicyInput): GuardPolicyResult {
    const escalateFlags: string[] = [];
    let reason = '';

    // Regel 1: Fremdsprache -> Eskalation
    const hasLanguageIssue = this.checkForeignLanguage(input.flags);
    if (hasLanguageIssue) {
      escalateFlags.push('FOREIGN_LANGUAGE');
      reason = 'language';
      logger.info('Eskalation wegen Fremdsprache', {
        klass: input.klass,
        flags: input.flags
      });
      return { auto: false, reason, escalateFlags };
    }

    // Regel 2: Mixed Intent / Mehrfachanfragen -> Eskalation
    const hasMixedIntent = this.checkMixedIntent(input.klass, input.flags);
    if (hasMixedIntent) {
      escalateFlags.push('MIXED_INTENT');
      reason = 'mixed_intent';
      logger.info('Eskalation wegen Mehrfachanfrage', {
        klass: input.klass,
        flags: input.flags
      });
      return { auto: false, reason, escalateFlags };
    }

    // Regel 3: Sensitive Kategorien -> Eskalation
    const isSensitive = this.checkSensitiveCategory(input.klass);
    if (isSensitive) {
      escalateFlags.push('SENSITIVE_CATEGORY');
      reason = `sensitive_${input.klass}`;
      logger.info('Eskalation wegen sensitiver Kategorie', {
        klass: input.klass
      });
      return { auto: false, reason, escalateFlags };
    }

    // Regel 4: Niedrige Konfidenz -> Eskalation
    const confidenceThreshold = this.getSettings().autoSendConfidenceThreshold;
    if (input.confidence < confidenceThreshold) {
      escalateFlags.push('LOW_CONFIDENCE');
      reason = `low_confidence_${input.confidence.toFixed(2)}`;
      logger.info('Eskalation wegen niedriger Konfidenz', {
        klass: input.klass,
        confidence: input.confidence,
        threshold: confidenceThreshold
      });
      return { auto: false, reason, escalateFlags };
    }

    // Regel 5: Zusätzliche Policy-Checks (erweiterbar)
    const policyViolation = this.checkKnowledgeBasePolicy(input.kbPolicy);
    if (policyViolation) {
      escalateFlags.push('KB_POLICY_VIOLATION');
      reason = policyViolation;
      logger.info('Eskalation wegen KB-Policy', {
        klass: input.klass,
        violation: policyViolation
      });
      return { auto: false, reason, escalateFlags };
    }

    // Regel 6: Prüfe globale Auto-Send Einstellung
    if (!this.getSettings().autoSendEnabled) {
      escalateFlags.push('AUTO_SEND_DISABLED');
      reason = 'auto_send_disabled';
      logger.info('Eskalation wegen deaktiviertem Auto-Send', {
        klass: input.klass
      });
      return { auto: false, reason, escalateFlags };
    }

    // Regel 7: Manuelle Freigabe erforderlich?
    if (this.getSettings().requireManualApproval) {
      escalateFlags.push('MANUAL_APPROVAL_REQUIRED');
      reason = 'manual_approval';
      logger.info('Eskalation wegen erforderlicher manueller Freigabe', {
        klass: input.klass
      });
      return { auto: false, reason, escalateFlags };
    }

    // Alle Checks bestanden -> Auto-Reply möglich
    logger.info('Auto-Reply zugelassen', {
      klass: input.klass,
      confidence: input.confidence
    });

    return {
      auto: true,
      reason: 'all_checks_passed',
      escalateFlags: []
    };
  }

  private checkForeignLanguage(flags: string[]): boolean {
    return flags.some(flag => 
      FOREIGN_LANGUAGE_FLAGS.includes(flag.toUpperCase())
    );
  }

  private checkSensitiveCategory(klass: string): boolean {
    const normalizedKlass = klass.toLowerCase();
    return SENSITIVE_CATEGORIES.some(category => 
      normalizedKlass.includes(category)
    );
  }

  private checkMixedIntent(klass: string, flags: string[]): boolean {
    // Check Klassifikation
    if (klass.toLowerCase().includes('mixed') || 
        klass.toLowerCase().includes('mehrfach')) {
      return true;
    }

    // Check Flags
    const mixedIntentFlags = ['MIXED_INTENT', 'MULTIPLE_REQUESTS', 'MEHRFACHANFRAGE'];
    return flags.some(flag => 
      mixedIntentFlags.includes(flag.toUpperCase())
    );
  }

  private checkKnowledgeBasePolicy(kbPolicy?: Record<string, unknown>): string | null {
    if (!kbPolicy) {
      return null;
    }

    // Beispiel-Checks für KB-Policy
    if (kbPolicy.requiresDoctor === true) {
      return 'requires_doctor_attention';
    }

    if (kbPolicy.requiresPrivacyCheck === true) {
      return 'requires_privacy_check';
    }

    if (kbPolicy.complexityScore && Number(kbPolicy.complexityScore) > 0.8) {
      return 'high_complexity';
    }

    return null;
  }

  /**
   * Gibt eine Zusammenfassung der Policy-Regeln zurück
   */
  getPolicySummary(): Record<string, unknown> {
    const settings = this.getSettings();
    return {
      autoSendEnabled: settings.autoSendEnabled,
      confidenceThreshold: settings.autoSendConfidenceThreshold,
      requireManualApproval: settings.requireManualApproval,
      sensitiveCategories: SENSITIVE_CATEGORIES,
      foreignLanguageFlags: FOREIGN_LANGUAGE_FLAGS,
      rules: [
        'FOREIGN_LANGUAGE → escalate',
        'SENSITIVE_CATEGORY → escalate',
        'MIXED_INTENT → escalate',
        `CONFIDENCE < ${settings.autoSendConfidenceThreshold} → escalate`,
        'KB_POLICY_VIOLATION → escalate',
        'AUTO_SEND_DISABLED → escalate',
        'MANUAL_APPROVAL_REQUIRED → escalate'
      ]
    };
  }
}

// Singleton-Export für einfache Verwendung
export const guardPolicy = new GuardPolicy();