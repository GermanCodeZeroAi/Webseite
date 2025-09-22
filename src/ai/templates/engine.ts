import * as fs from 'fs';
import * as path from 'path';
import { logger } from '../../core/logger/index.js';

export interface TemplateVariables {
  [key: string]: string | number | boolean | undefined;
}

export interface PraxisSettings {
  PRAXIS_NAME: string;
  PRAXIS_FACHGEBIET: string;
  PRAXIS_STRASSE: string;
  PRAXIS_PLZ: string;
  PRAXIS_ORT: string;
  PRAXIS_TELEFON: string;
  PRAXIS_FAX: string;
  PRAXIS_EMAIL: string;
  SPRECHZEITEN: string;
  LLM_REWRITE_ENABLED?: boolean;
  LLM_REWRITE_STYLE?: string;
  LLM_REWRITE_TEMPERATURE?: number;
}

export interface KnowledgeBase {
  getPolicyHint(category: string): string | undefined;
  getAnswer(question: string): string | undefined;
}

export class TemplateEngine {
  private templatesPath: string;
  private templateCache: Map<string, string> = new Map();

  constructor(templatesPath?: string) {
    this.templatesPath = templatesPath || path.join(process.cwd(), 'templates', 'de');
  }

  /**
   * Render a template with given variables, settings, and knowledge base
   */
  async render(
    templateName: string,
    variables: TemplateVariables,
    settings: PraxisSettings,
    kb?: KnowledgeBase
  ): Promise<string> {
    try {
      // Load template
      const template = await this.loadTemplate(templateName);
      
      // Merge all variables
      const allVars = {
        ...variables,
        ...settings,
      };

      // Replace placeholders
      let result = this.replacePlaceholders(template, allVars);

      // Add signature if not already included
      if (!templateName.includes('signatur')) {
        const signature = await this.loadTemplate('signatur');
        const signatureRendered = this.replacePlaceholders(signature, allVars);
        result = `${result}\n\n${signatureRendered}`;
      }

      // Optional LLM rewrite
      if (settings.LLM_REWRITE_ENABLED) {
        result = await this.llmRewrite(
          result, 
          settings.LLM_REWRITE_STYLE || 'de-praxis-höflich',
          settings.LLM_REWRITE_TEMPERATURE || 0.3
        );
      }

      return result;
    } catch (error) {
      logger.error('Fehler beim Rendern des Templates', {
        templateName,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Load a template from file system
   */
  private async loadTemplate(templateName: string): Promise<string> {
    const cacheKey = `${templateName}.md`;
    
    // Check cache first
    if (this.templateCache.has(cacheKey)) {
      return this.templateCache.get(cacheKey)!;
    }

    const templatePath = path.join(this.templatesPath, cacheKey);
    
    try {
      const content = await fs.promises.readFile(templatePath, 'utf-8');
      this.templateCache.set(cacheKey, content);
      return content;
    } catch (error) {
      logger.error('Template nicht gefunden', { templatePath });
      throw new Error(`Template '${templateName}' nicht gefunden`);
    }
  }

  /**
   * Replace placeholders in template with actual values
   */
  private replacePlaceholders(template: string, variables: TemplateVariables): string {
    let result = template;

    // Replace all placeholders {VARIABLE_NAME}
    Object.entries(variables).forEach(([key, value]) => {
      const placeholder = `{${key}}`;
      const replacement = value !== undefined ? String(value) : '';
      result = result.replace(new RegExp(placeholder, 'g'), replacement);
    });

    // Log warnings for unreplaced placeholders
    const unreplaced = result.match(/\{[A-Z_]+\}/g);
    if (unreplaced && unreplaced.length > 0) {
      logger.warn('Nicht ersetzte Platzhalter gefunden', {
        placeholders: unreplaced,
        template: template.substring(0, 100) + '...',
      });
    }

    return result;
  }

  /**
   * Optional LLM rewrite for polishing the message
   * This is a placeholder - actual implementation would call an LLM API
   */
  private async llmRewrite(
    text: string, 
    style: string, 
    temperature: number
  ): Promise<string> {
    // TODO: Implement actual LLM call
    // For now, just return the original text
    logger.info('LLM Rewrite angefordert', {
      style,
      temperature,
      textLength: text.length,
    });
    
    // Placeholder for LLM integration
    // In production, this would call OpenAI/Anthropic/etc API
    // Example:
    // const response = await llmClient.complete({
    //   prompt: `Bitte formuliere die folgende E-Mail im Stil "${style}" leicht um, 
    //            behalte aber alle wichtigen Informationen bei:\n\n${text}`,
    //   temperature,
    //   max_tokens: text.length * 2,
    // });
    // return response.text;

    return text;
  }

  /**
   * Clear template cache
   */
  clearCache(): void {
    this.templateCache.clear();
  }

  /**
   * Get available templates
   */
  async getAvailableTemplates(): Promise<string[]> {
    try {
      const files = await fs.promises.readdir(this.templatesPath);
      return files
        .filter(file => file.endsWith('.md'))
        .map(file => file.replace('.md', ''));
    } catch (error) {
      logger.error('Fehler beim Lesen der Templates', { error });
      return [];
    }
  }
}