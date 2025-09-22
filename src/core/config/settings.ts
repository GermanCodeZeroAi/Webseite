import { SettingsRepo } from '../db/repos/index.js';
import { createLogger } from '../logger/index.js';

const logger = createLogger('config:settings');

export interface PraxisSettings {
  // Auto-Send Einstellungen
  autoSendEnabled: boolean;
  autoSendConfidenceThreshold: number;
  scoreGateThreshold: number;
  
  // Arbeitszeiten
  workingHoursStart: string; // HH:MM
  workingHoursEnd: string;    // HH:MM
  workingDays: number[];     // 0=So, 1=Mo, ..., 6=Sa
  
  // Hold/Reservation Einstellungen
  holdExpiryMinutes: number;
  maxHoldsPerEmail: number;
  
  // E-Mail Verarbeitung
  maxEmailsPerBatch: number;
  processingDelaySeconds: number;
  retryDelayMinutes: number;
  maxRetries: number;
  
  // Sicherheit & Compliance
  requireManualApproval: boolean;
  piiDetectionEnabled: boolean;
  auditRetentionDays: number;
  
  // Vorlagen
  defaultLanguage: string;
  defaultTimezone: string;
  signatureTemplate: string;
  
  // Benachrichtigungen
  notificationEmail: string;
  escalationEmail: string;
  alertOnError: boolean;
}

const DEFAULT_SETTINGS: PraxisSettings = {
  // Auto-Send
  autoSendEnabled: false,
  autoSendConfidenceThreshold: 0.95,
  scoreGateThreshold: 0.8,
  
  // Arbeitszeiten (Mo-Fr 8-18 Uhr)
  workingHoursStart: '08:00',
  workingHoursEnd: '18:00',
  workingDays: [1, 2, 3, 4, 5], // Mo-Fr
  
  // Hold/Reservation
  holdExpiryMinutes: 30,
  maxHoldsPerEmail: 3,
  
  // E-Mail Verarbeitung
  maxEmailsPerBatch: 10,
  processingDelaySeconds: 5,
  retryDelayMinutes: 15,
  maxRetries: 3,
  
  // Sicherheit
  requireManualApproval: true,
  piiDetectionEnabled: true,
  auditRetentionDays: 90,
  
  // Vorlagen
  defaultLanguage: 'de-DE',
  defaultTimezone: 'Europe/Berlin',
  signatureTemplate: 'Mit freundlichen Grüßen\nIhre Praxis',
  
  // Benachrichtigungen
  notificationEmail: '',
  escalationEmail: '',
  alertOnError: true,
};

export class TypedSettings {
  private repo: SettingsRepo;
  private cache: Map<string, { value: unknown; timestamp: number }> = new Map();
  private cacheTTL = 60000; // 1 Minute

  constructor() {
    this.repo = new SettingsRepo();
    this.initializeDefaults();
  }

  private initializeDefaults(): void {
    const defaults: Record<string, string> = {};
    
    for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
      const settingKey = this.toSnakeCase(key);
      if (Array.isArray(value)) {
        defaults[settingKey] = JSON.stringify(value);
      } else {
        defaults[settingKey] = String(value);
      }
    }
    
    this.repo.initializeDefaults(defaults);
    logger.info('Standard-Einstellungen initialisiert');
  }

  private toSnakeCase(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }

  private fromSnakeCase(str: string): string {
    return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
  }

  private getCached<T>(key: string, getter: () => T): T {
    const cached = this.cache.get(key);
    const now = Date.now();
    
    if (cached && (now - cached.timestamp) < this.cacheTTL) {
      return cached.value as T;
    }
    
    const value = getter();
    this.cache.set(key, { value, timestamp: now });
    return value;
  }

  // Getter für alle Settings
  get autoSendEnabled(): boolean {
    return this.getCached('auto_send_enabled', () => 
      this.repo.getBoolean('auto_send_enabled', DEFAULT_SETTINGS.autoSendEnabled)
    );
  }

  set autoSendEnabled(value: boolean) {
    this.repo.setBoolean('auto_send_enabled', value);
    this.cache.delete('auto_send_enabled');
  }

  get autoSendConfidenceThreshold(): number {
    return this.getCached('auto_send_confidence_threshold', () =>
      this.repo.getNumber('auto_send_confidence_threshold', DEFAULT_SETTINGS.autoSendConfidenceThreshold)
    );
  }

  set autoSendConfidenceThreshold(value: number) {
    this.repo.setNumber('auto_send_confidence_threshold', value);
    this.cache.delete('auto_send_confidence_threshold');
  }

  get scoreGateThreshold(): number {
    return this.getCached('score_gate_threshold', () =>
      this.repo.getNumber('score_gate_threshold', DEFAULT_SETTINGS.scoreGateThreshold)
    );
  }

  set scoreGateThreshold(value: number) {
    this.repo.setNumber('score_gate_threshold', value);
    this.cache.delete('score_gate_threshold');
  }

  get workingHoursStart(): string {
    return this.getCached('working_hours_start', () =>
      this.repo.get('working_hours_start') || DEFAULT_SETTINGS.workingHoursStart
    );
  }

  set workingHoursStart(value: string) {
    this.repo.set('working_hours_start', value);
    this.cache.delete('working_hours_start');
  }

  get workingHoursEnd(): string {
    return this.getCached('working_hours_end', () =>
      this.repo.get('working_hours_end') || DEFAULT_SETTINGS.workingHoursEnd
    );
  }

  set workingHoursEnd(value: string) {
    this.repo.set('working_hours_end', value);
    this.cache.delete('working_hours_end');
  }

  get workingDays(): number[] {
    return this.getCached('working_days', () =>
      this.repo.getJSON<number[]>('working_days', DEFAULT_SETTINGS.workingDays)!
    );
  }

  set workingDays(value: number[]) {
    this.repo.setJSON('working_days', value);
    this.cache.delete('working_days');
  }

  get holdExpiryMinutes(): number {
    return this.getCached('hold_expiry_minutes', () =>
      this.repo.getNumber('hold_expiry_minutes', DEFAULT_SETTINGS.holdExpiryMinutes)
    );
  }

  set holdExpiryMinutes(value: number) {
    this.repo.setNumber('hold_expiry_minutes', value);
    this.cache.delete('hold_expiry_minutes');
  }

  get requireManualApproval(): boolean {
    return this.getCached('require_manual_approval', () =>
      this.repo.getBoolean('require_manual_approval', DEFAULT_SETTINGS.requireManualApproval)
    );
  }

  set requireManualApproval(value: boolean) {
    this.repo.setBoolean('require_manual_approval', value);
    this.cache.delete('require_manual_approval');
  }

  // Hilfsmethoden
  isWorkingTime(date: Date = new Date()): boolean {
    const day = date.getDay();
    if (!this.workingDays.includes(day)) {
      return false;
    }

    const time = date.toTimeString().substring(0, 5); // HH:MM
    return time >= this.workingHoursStart && time <= this.workingHoursEnd;
  }

  canAutoSend(confidence: number): boolean {
    return this.autoSendEnabled && 
           confidence >= this.autoSendConfidenceThreshold &&
           !this.requireManualApproval;
  }

  shouldProcess(score: number): boolean {
    return score >= this.scoreGateThreshold;
  }

  getAll(): PraxisSettings {
    const settings: Partial<PraxisSettings> = {};
    
    for (const key of Object.keys(DEFAULT_SETTINGS)) {
      const getter = Object.getOwnPropertyDescriptor(this, key)?.get;
      if (getter) {
        settings[key as keyof PraxisSettings] = getter.call(this);
      }
    }
    
    return settings as PraxisSettings;
  }

  reset(): void {
    logger.warn('Setze alle Einstellungen auf Standardwerte zurück');
    
    for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
      const setter = Object.getOwnPropertyDescriptor(this, key)?.set;
      if (setter) {
        setter.call(this, value);
      }
    }
    
    this.cache.clear();
  }

  clearCache(): void {
    this.cache.clear();
  }
}

// Singleton-Export
export const praxisSettings = new TypedSettings();