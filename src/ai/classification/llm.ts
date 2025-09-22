/**
 * LLM client interface for classification and extraction
 * Supports OLLAMA for local deployment and cloud providers as stubs
 */

import { readFile } from 'fs/promises';
import { join } from 'path';

export interface LLMResponse {
  category: string;
  confidence: number;
  extracted: Record<string, any>;
  flags: {
    mixed_intent: boolean;
    foreign_language: boolean;
    unclear: boolean;
  };
}

export interface LLMClient {
  classify(emailContent: string): Promise<LLMResponse>;
  isAvailable(): Promise<boolean>;
}

// OLLAMA configuration
const OLLAMA_CONFIG = {
  baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
  model: process.env.OLLAMA_MODEL || 'llama2',
  timeout: parseInt(process.env.OLLAMA_TIMEOUT || '30000', 10)
};

/**
 * OLLAMA implementation for local LLM
 */
export class OllamaClient implements LLMClient {
  private promptTemplate: string | null = null;

  async loadPrompt(): Promise<string> {
    if (!this.promptTemplate) {
      const promptPath = join(__dirname, 'prompt.md');
      this.promptTemplate = await readFile(promptPath, 'utf-8');
    }
    return this.promptTemplate;
  }

  async classify(emailContent: string): Promise<LLMResponse> {
    try {
      const prompt = await this.loadPrompt();
      const fullPrompt = `${prompt}\n\n## E-Mail zu klassifizieren:\n\n${emailContent}\n\n## JSON-Antwort:`;

      const response = await fetch(`${OLLAMA_CONFIG.baseUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: OLLAMA_CONFIG.model,
          prompt: fullPrompt,
          stream: false,
          options: {
            temperature: 0.1, // Low temperature for consistent classification
            top_p: 0.9,
            max_tokens: 500
          }
        }),
        signal: AbortSignal.timeout(OLLAMA_CONFIG.timeout)
      });

      if (!response.ok) {
        throw new Error(`OLLAMA request failed: ${response.statusText}`);
      }

      const data = await response.json();
      const responseText = data.response;

      // Extract JSON from response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in LLM response');
      }

      const parsed = JSON.parse(jsonMatch[0]) as LLMResponse;
      
      // Validate response structure
      this.validateResponse(parsed);
      
      return parsed;
    } catch (error) {
      console.error('OLLAMA classification error:', error);
      throw error;
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${OLLAMA_CONFIG.baseUrl}/api/tags`, {
        signal: AbortSignal.timeout(5000)
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  private validateResponse(response: any): void {
    if (!response.category || typeof response.category !== 'string') {
      throw new Error('Invalid response: missing or invalid category');
    }
    
    if (typeof response.confidence !== 'number' || response.confidence < 0 || response.confidence > 1) {
      throw new Error('Invalid response: confidence must be between 0 and 1');
    }

    if (!response.extracted || typeof response.extracted !== 'object') {
      throw new Error('Invalid response: missing extracted data');
    }

    if (!response.flags || 
        typeof response.flags.mixed_intent !== 'boolean' ||
        typeof response.flags.foreign_language !== 'boolean' ||
        typeof response.flags.unclear !== 'boolean') {
      throw new Error('Invalid response: missing or invalid flags');
    }
  }
}

/**
 * Development stub for cloud LLM providers
 * Returns mock responses for testing
 */
export class CloudLLMStub implements LLMClient {
  private mockResponses: Map<string, LLMResponse> = new Map();

  constructor() {
    this.initializeMockResponses();
  }

  private initializeMockResponses(): void {
    // Mock responses for common patterns
    this.mockResponses.set('termin', {
      category: 'Termin vereinbaren',
      confidence: 0.9,
      extracted: {
        desired_date: null,
        desired_time: 'vormittags',
        urgency: 'normal',
        reason: 'Untersuchung'
      },
      flags: {
        mixed_intent: false,
        foreign_language: false,
        unclear: false
      }
    });

    this.mockResponses.set('rezept', {
      category: 'Frage zu Rezept',
      confidence: 0.85,
      extracted: {
        medication: 'Ibuprofen',
        dosage: '600mg',
        quantity: '1 Packung',
        prescription_type: 'folgerezept'
      },
      flags: {
        mixed_intent: false,
        foreign_language: false,
        unclear: false
      }
    });

    this.mockResponses.set('au', {
      category: 'Frage zu Krankschreibung',
      confidence: 0.88,
      extracted: {
        au_since: new Date().toISOString().split('T')[0],
        au_duration: 3,
        au_type: 'folgebescheinigung',
        diagnosis: 'Grippe'
      },
      flags: {
        mixed_intent: false,
        foreign_language: false,
        unclear: false
      }
    });
  }

  async classify(emailContent: string): Promise<LLMResponse> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 100));

    const lowerContent = emailContent.toLowerCase();

    // Check for mixed intent
    const intents = [];
    if (lowerContent.includes('termin')) intents.push('termin');
    if (lowerContent.includes('rezept')) intents.push('rezept');
    if (lowerContent.includes('krankschreibung') || lowerContent.includes(' au ')) intents.push('au');

    if (intents.length > 1) {
      return {
        category: 'Termin vereinbaren', // Pick first as primary
        confidence: 0.65,
        extracted: this.mockResponses.get('termin')!.extracted,
        flags: {
          mixed_intent: true,
          foreign_language: false,
          unclear: false
        }
      };
    }

    // Check for foreign language
    if (/\b(hello|please|thank you|appointment|prescription)\b/i.test(emailContent)) {
      return {
        category: 'Sonstiges',
        confidence: 0.95,
        extracted: {
          reason: 'Foreign language detected'
        },
        flags: {
          mixed_intent: false,
          foreign_language: true,
          unclear: false
        }
      };
    }

    // Return appropriate mock based on content
    for (const [key, response] of this.mockResponses.entries()) {
      if (lowerContent.includes(key)) {
        return response;
      }
    }

    // Default response
    return {
      category: 'Allgemeine Frage',
      confidence: 0.7,
      extracted: {
        topic: 'Allgemeine Anfrage',
        symptoms: null,
        duration: null
      },
      flags: {
        mixed_intent: false,
        foreign_language: false,
        unclear: false
      }
    };
  }

  async isAvailable(): Promise<boolean> {
    return true;
  }
}

/**
 * Factory to create appropriate LLM client based on environment
 */
export function createLLMClient(): LLMClient {
  const provider = process.env.LLM_PROVIDER || 'ollama';

  switch (provider.toLowerCase()) {
    case 'ollama':
      return new OllamaClient();
    case 'openai':
    case 'anthropic':
    case 'cloud':
      console.log(`Using CloudLLMStub for provider: ${provider}`);
      return new CloudLLMStub();
    default:
      console.warn(`Unknown LLM provider: ${provider}, falling back to CloudLLMStub`);
      return new CloudLLMStub();
  }
}