import { describe, it, expect, beforeEach } from 'vitest';
import { TemplateEngine, type PraxisSettings } from '../../../../src/ai/templates/engine.js';
import * as fs from 'fs';
import * as path from 'path';

describe('TemplateEngine', () => {
  let engine: TemplateEngine;
  const mockSettings: PraxisSettings = {
    PRAXIS_NAME: 'Testpraxis Dr. Schmidt',
    PRAXIS_FACHGEBIET: 'Allgemeinmedizin',
    PRAXIS_STRASSE: 'Teststraße 123',
    PRAXIS_PLZ: '10115',
    PRAXIS_ORT: 'Berlin',
    PRAXIS_TELEFON: '030 / 12345678',
    PRAXIS_FAX: '030 / 12345679',
    PRAXIS_EMAIL: 'test@praxis-schmidt.de',
    SPRECHZEITEN: 'Mo-Fr 8:00-12:00, Mo/Di/Do 14:00-18:00',
  };

  beforeEach(() => {
    engine = new TemplateEngine();
  });

  describe('render', () => {
    it('should render termin_vorschlag template correctly', async () => {
      const variables = {
        NAME: 'Herr Müller',
        DATUM: 'Montag, 15.01.2024',
        UHRZEIT: '10:30',
        HOLD_HINT: 'Der Termin wird für 24 Stunden reserviert.',
      };

      const result = await engine.render('termin_vorschlag', variables, mockSettings);

      expect(result).toContain('Guten Tag Herr Müller');
      expect(result).toContain('Montag, 15.01.2024 um 10:30 Uhr');
      expect(result).toContain('Der Termin wird für 24 Stunden reserviert.');
      expect(result).toContain('Testpraxis Dr. Schmidt'); // From signature
    });

    it('should render termin_bestaetigung template correctly', async () => {
      const variables = {
        NAME: 'Frau Schmidt',
        DATUM: 'Dienstag, 16.01.2024',
        UHRZEIT: '14:00',
        ORT: 'Hauptpraxis, Zimmer 3',
      };

      const result = await engine.render('termin_bestaetigung', variables, mockSettings);

      expect(result).toContain('Guten Tag Frau Schmidt');
      expect(result).toContain('Datum:** Dienstag, 16.01.2024');
      expect(result).toContain('Uhrzeit:** 14:00 Uhr');
      expect(result).toContain('Ort:** Hauptpraxis, Zimmer 3');
      expect(result).toContain('Krankenversicherungskarte');
    });

    it('should render termin_absage template correctly', async () => {
      const variables = {
        NAME: 'Herr Weber',
        DATUM: 'Mittwoch, 17.01.2024',
        UHRZEIT: '09:00',
        GRUND: 'Alle Termine sind bereits vergeben.',
      };

      const result = await engine.render('termin_absage', variables, mockSettings);

      expect(result).toContain('Guten Tag Herr Weber');
      expect(result).toContain('Mittwoch, 17.01.2024 um 09:00 Uhr');
      expect(result).toContain('Alle Termine sind bereits vergeben.');
    });

    it('should render faq_antwort template correctly', async () => {
      const variables = {
        NAME: 'Frau Meyer',
        ANTWORT_KB: 'Die Sprechzeiten sind: Mo-Fr 8:00-12:00 Uhr.',
      };

      const result = await engine.render('faq_antwort', variables, mockSettings);

      expect(result).toContain('Guten Tag Frau Meyer');
      expect(result).toContain('Die Sprechzeiten sind: Mo-Fr 8:00-12:00 Uhr.');
    });

    it('should render vorsicht_sensibel template correctly', async () => {
      const variables = {
        NAME: 'Herr Klein',
      };

      const result = await engine.render('vorsicht_sensibel', variables, mockSettings);

      expect(result).toContain('Guten Tag Herr Klein');
      expect(result).toContain('wir haben Ihre Nachricht erhalten und melden uns persönlich');
      expect(result).toContain('Aufgrund der Sensibilität des Themas');
    });

    it('should append signature to all templates', async () => {
      const variables = { NAME: 'Test' };

      const result = await engine.render('faq_antwort', variables, mockSettings);

      expect(result).toContain('Testpraxis Dr. Schmidt');
      expect(result).toContain('Allgemeinmedizin');
      expect(result).toContain('Teststraße 123');
      expect(result).toContain('10115 Berlin');
      expect(result).toContain('Tel: 030 / 12345678');
      expect(result).toContain('Diese E-Mail wurde automatisch generiert');
    });

    it('should handle missing placeholders gracefully', async () => {
      const variables = {
        NAME: 'Test User',
        // Missing ANTWORT_KB
      };

      const result = await engine.render('faq_antwort', variables, mockSettings);

      expect(result).toContain('Guten Tag Test User');
      expect(result).not.toContain('{ANTWORT_KB}'); // Should be replaced with empty string
    });

    it('should handle UTF-8 characters correctly', async () => {
      const variables = {
        NAME: 'Frau Müller-Lüdenscheidt',
        ANTWORT_KB: 'Für Röntgenaufnahmen benötigen wir eine Überweisung.',
      };

      const result = await engine.render('faq_antwort', variables, mockSettings);

      expect(result).toContain('Frau Müller-Lüdenscheidt');
      expect(result).toContain('Röntgenaufnahmen');
      expect(result).toContain('Überweisung');
    });

    it('should preserve line breaks correctly', async () => {
      const variables = {
        NAME: 'Test',
        DATUM: '01.01.2024',
        UHRZEIT: '10:00',
        ORT: 'Hauptpraxis',
      };

      const result = await engine.render('termin_bestaetigung', variables, mockSettings);

      // Check for proper line breaks
      expect(result.split('\n').length).toBeGreaterThan(10);
      expect(result).toMatch(/\n\n/); // Double line breaks should be preserved
    });
  });

  describe('getAvailableTemplates', () => {
    it('should return all available templates', async () => {
      const templates = await engine.getAvailableTemplates();

      expect(templates).toContain('termin_vorschlag');
      expect(templates).toContain('termin_bestaetigung');
      expect(templates).toContain('termin_absage');
      expect(templates).toContain('faq_antwort');
      expect(templates).toContain('vorsicht_sensibel');
      expect(templates).toContain('signatur');
      expect(templates.length).toBe(6);
    });
  });

  describe('error handling', () => {
    it('should throw error for non-existent template', async () => {
      await expect(
        engine.render('non_existent_template', {}, mockSettings)
      ).rejects.toThrow("Template 'non_existent_template' nicht gefunden");
    });
  });
});