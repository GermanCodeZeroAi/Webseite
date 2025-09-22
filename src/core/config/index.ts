import { config as dotenvConfig } from 'dotenv';
import { existsSync } from 'fs';
import { join } from 'path';

// Load environment variables
const envPath = join(process.cwd(), '.env');
if (existsSync(envPath)) {
  dotenvConfig({ path: envPath });
}

export interface Config {
  // General
  env: 'development' | 'production';
  logLevel: string;
  locale: string;
  
  // Database
  db: {
    path: string;
  };
  
  // Email Accounts
  gmail: {
    enabled: boolean;
    email?: string;
    clientId?: string;
    clientSecret?: string;
    refreshToken?: string;
  };
  
  outlook: {
    enabled: boolean;
    email?: string;
    clientId?: string;
    clientSecret?: string;
    tenantId?: string;
  };
  
  // Calendar
  googleCalendar: {
    enabled: boolean;
    calendarId?: string;
  };
  
  // AI
  ai: {
    provider: 'ollama' | 'openai' | 'anthropic';
    ollamaUrl: string;
    model: string;
    temperature: number;
  };
  
  // Pipeline
  pipeline: {
    checkIntervalMinutes: number;
    maxRetries: number;
  };
}

export const config: Config = {
  env: (process.env.NODE_ENV as 'development' | 'production') || 'development',
  logLevel: process.env.LOG_LEVEL || 'info',
  locale: process.env.LOCALE || 'de-DE',
  
  db: {
    path: process.env.DB_PATH || './data/praxis.db',
  },
  
  gmail: {
    enabled: process.env.GMAIL_ENABLED === 'true',
    email: process.env.GMAIL_EMAIL,
    clientId: process.env.GMAIL_CLIENT_ID,
    clientSecret: process.env.GMAIL_CLIENT_SECRET,
    refreshToken: process.env.GMAIL_REFRESH_TOKEN,
  },
  
  outlook: {
    enabled: process.env.OUTLOOK_ENABLED === 'true',
    email: process.env.OUTLOOK_EMAIL,
    clientId: process.env.OUTLOOK_CLIENT_ID,
    clientSecret: process.env.OUTLOOK_CLIENT_SECRET,
    tenantId: process.env.OUTLOOK_TENANT_ID,
  },
  
  googleCalendar: {
    enabled: process.env.GOOGLE_CALENDAR_ENABLED === 'true',
    calendarId: process.env.GOOGLE_CALENDAR_ID,
  },
  
  ai: {
    provider: (process.env.AI_PROVIDER as 'ollama' | 'openai' | 'anthropic') || 'ollama',
    ollamaUrl: process.env.OLLAMA_URL || 'http://localhost:11434',
    model: process.env.AI_MODEL || 'llama3.2',
    temperature: parseFloat(process.env.AI_TEMPERATURE || '0.3'),
  },
  
  pipeline: {
    checkIntervalMinutes: parseInt(process.env.CHECK_INTERVAL_MINUTES || '5', 10),
    maxRetries: parseInt(process.env.MAX_RETRIES || '3', 10),
  },
};

export function validateConfig(): void {
  if (!config.gmail.enabled && !config.outlook.enabled) {
    throw new Error('Mindestens ein E-Mail-Provider muss aktiviert sein');
  }
  
  if (config.gmail.enabled) {
    if (!config.gmail.email || !config.gmail.clientId || !config.gmail.clientSecret) {
      throw new Error('Gmail-Konfiguration unvollständig');
    }
  }
  
  if (config.outlook.enabled) {
    if (!config.outlook.email || !config.outlook.clientId || !config.outlook.clientSecret) {
      throw new Error('Outlook-Konfiguration unvollständig');
    }
  }
}