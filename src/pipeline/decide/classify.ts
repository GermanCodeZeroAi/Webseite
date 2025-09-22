/**
 * Hybrid classification pipeline combining rule-based and LLM approaches
 * Fast path: Rules with high confidence
 * Fallback: LLM for validation and extraction
 */

import { EmailsRepo } from '../../core/db/repos/EmailsRepo';
import { ExtractedRepo } from '../../core/db/repos/ExtractedRepo';
import { SettingsRepo } from '../../core/db/repos/SettingsRepo';
import { classifyWithRules, detectMixedIntent, detectForeignLanguage } from '../../ai/classification/rules';
import { createLLMClient, LLMResponse } from '../../ai/classification/llm';
import { logger } from '../../core/logger';

// Map rule categories to final categories
const CATEGORY_MAPPING: Record<string, string> = {
  'Termin': 'Termin vereinbaren',
  'Terminabsage': 'Termin absagen/ändern',
  'AU': 'Frage zu Krankschreibung',
  'Rezept': 'Frage zu Rezept',
  'Allgemeine Frage': 'Allgemeine Frage',
  'Sonstiges': 'Sonstiges'
};

export interface ClassificationResult {
  emailId: number;
  category: string;
  confidence: number;
  method: 'rules' | 'llm';
  extracted: Record<string, any>;
  flags: {
    mixed_intent: boolean;
    foreign_language: boolean;
    unclear: boolean;
    escalate: boolean;
  };
}

export class HybridClassifier {
  private llmClient = createLLMClient();

  constructor(
    private emailsRepo: EmailsRepo,
    private extractedRepo: ExtractedRepo,
    private settingsRepo: SettingsRepo
  ) {}

  /**
   * Classify email using hybrid approach
   */
  async classifyEmail(emailId: number): Promise<ClassificationResult> {
    try {
      // Get email content
      const email = await this.emailsRepo.findById(emailId);
      if (!email) {
        throw new Error(`Email ${emailId} not found`);
      }

      const content = `${email.subject || ''}\n\n${email.body || ''}`.trim();
      
      // Get classification settings
      const settings = await this.settingsRepo.getSettings();
      const scoreThreshold = settings.classification?.score_gate_threshold || 0.7;

      // Quick language check
      const isForeign = detectForeignLanguage(content);
      if (isForeign) {
        const result: ClassificationResult = {
          emailId,
          category: 'Sonstiges',
          confidence: 1.0,
          method: 'rules',
          extracted: { reason: 'Foreign language detected' },
          flags: {
            mixed_intent: false,
            foreign_language: true,
            unclear: false,
            escalate: true
          }
        };
        
        await this.saveClassification(result);
        return result;
      }

      // Rule-based classification
      const ruleResult = classifyWithRules(content);
      const mappedCategory = CATEGORY_MAPPING[ruleResult.category] || 'Sonstiges';
      const hasMixedIntent = detectMixedIntent(content);

      logger.info('Rule classification result', {
        emailId,
        category: ruleResult.category,
        score: ruleResult.score,
        hasMixedIntent
      });

      // Fast path: High confidence rule match without mixed intent
      if (ruleResult.score >= scoreThreshold && !hasMixedIntent) {
        const result: ClassificationResult = {
          emailId,
          category: mappedCategory,
          confidence: ruleResult.score,
          method: 'rules',
          extracted: {}, // Rules don't extract detailed info
          flags: {
            mixed_intent: false,
            foreign_language: false,
            unclear: false,
            escalate: false
          }
        };

        await this.saveClassification(result);
        return result;
      }

      // LLM path: Low confidence or mixed intent
      try {
        const llmAvailable = await this.llmClient.isAvailable();
        if (!llmAvailable) {
          logger.warn('LLM not available, falling back to rule result', { emailId });
          throw new Error('LLM not available');
        }

        const llmResponse = await this.llmClient.classify(content);
        
        // Validate LLM response
        this.validateLLMResponse(llmResponse);

        const result: ClassificationResult = {
          emailId,
          category: llmResponse.category,
          confidence: llmResponse.confidence,
          method: 'llm',
          extracted: llmResponse.extracted,
          flags: {
            ...llmResponse.flags,
            escalate: llmResponse.flags.mixed_intent || 
                     llmResponse.flags.foreign_language || 
                     llmResponse.flags.unclear ||
                     llmResponse.confidence < 0.5
          }
        };

        await this.saveClassification(result);
        return result;

      } catch (llmError) {
        logger.error('LLM classification failed', { 
          emailId, 
          error: llmError instanceof Error ? llmError.message : String(llmError) 
        });

        // Fallback to rule result with escalation
        const result: ClassificationResult = {
          emailId,
          category: mappedCategory,
          confidence: ruleResult.score,
          method: 'rules',
          extracted: {},
          flags: {
            mixed_intent: hasMixedIntent,
            foreign_language: false,
            unclear: true,
            escalate: true
          }
        };

        await this.saveClassification(result);
        return result;
      }

    } catch (error) {
      logger.error('Classification pipeline error', { 
        emailId, 
        error: error instanceof Error ? error.message : String(error) 
      });
      
      // Ultimate fallback
      const result: ClassificationResult = {
        emailId,
        category: 'Sonstiges',
        confidence: 0,
        method: 'rules',
        extracted: { error: 'Classification failed' },
        flags: {
          mixed_intent: false,
          foreign_language: false,
          unclear: true,
          escalate: true
        }
      };

      await this.saveClassification(result);
      return result;
    }
  }

  /**
   * Validate LLM response format and content
   */
  private validateLLMResponse(response: LLMResponse): void {
    const validCategories = [
      'Termin vereinbaren',
      'Termin absagen/ändern',
      'Frage zu Krankschreibung',
      'Frage zu Rezept',
      'Allgemeine Frage',
      'Sonstiges'
    ];

    if (!validCategories.includes(response.category)) {
      throw new Error(`Invalid category: ${response.category}`);
    }

    if (response.confidence < 0 || response.confidence > 1) {
      throw new Error(`Invalid confidence: ${response.confidence}`);
    }

    if (!response.extracted || typeof response.extracted !== 'object') {
      throw new Error('Missing or invalid extracted data');
    }

    if (!response.flags || 
        typeof response.flags.mixed_intent !== 'boolean' ||
        typeof response.flags.foreign_language !== 'boolean' ||
        typeof response.flags.unclear !== 'boolean') {
      throw new Error('Invalid flags structure');
    }
  }

  /**
   * Save classification results to database
   */
  private async saveClassification(result: ClassificationResult): Promise<void> {
    // Mark email as classified
    await this.emailsRepo.markClassified(
      result.emailId,
      result.category,
      result.confidence,
      result.flags
    );

    // Store extracted data if any
    if (Object.keys(result.extracted).length > 0) {
      await this.extractedRepo.upsert(
        result.emailId,
        result.category,
        result.extracted
      );
    }

    logger.info('Classification saved', {
      emailId: result.emailId,
      category: result.category,
      confidence: result.confidence,
      method: result.method,
      flags: result.flags
    });
  }

  /**
   * Batch classify multiple emails
   */
  async classifyBatch(emailIds: number[]): Promise<ClassificationResult[]> {
    const results: ClassificationResult[] = [];

    for (const emailId of emailIds) {
      try {
        const result = await this.classifyEmail(emailId);
        results.push(result);
      } catch (error) {
        logger.error('Batch classification error for email', { 
          emailId, 
          error: error instanceof Error ? error.message : String(error) 
        });
      }
    }

    return results;
  }

  /**
   * Get classification statistics
   */
  async getClassificationStats(): Promise<{
    total: number;
    byCategory: Record<string, number>;
    byMethod: Record<string, number>;
    escalated: number;
  }> {
    const emails = await this.emailsRepo.findClassified();
    
    const stats = {
      total: emails.length,
      byCategory: {} as Record<string, number>,
      byMethod: { rules: 0, llm: 0 },
      escalated: 0
    };

    for (const email of emails) {
      if (email.classification) {
        stats.byCategory[email.classification] = (stats.byCategory[email.classification] || 0) + 1;
        
        if (email.confidence && email.confidence >= 0.7) {
          stats.byMethod.rules++;
        } else {
          stats.byMethod.llm++;
        }

        if (email.flags?.escalate) {
          stats.escalated++;
        }
      }
    }

    return stats;
  }
}