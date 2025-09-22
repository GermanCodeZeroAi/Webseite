import { describe, it, expect } from 'vitest';
import { TemplateEngine, type PraxisSettings } from '../../src/ai/templates/engine.js';

describe('Email Template Snapshots', () => {
  const engine = new TemplateEngine();
  const mockSettings: PraxisSettings = {
    PRAXIS_NAME: 'Praxis Dr. med. Anna Schmidt',
    PRAXIS_FACHGEBIET: 'Allgemeinmedizin und Innere Medizin',
    PRAXIS_STRASSE: 'Hauptstraße 42',
    PRAXIS_PLZ: '10115',
    PRAXIS_ORT: 'Berlin',
    PRAXIS_TELEFON: '030 / 555 123 456',
    PRAXIS_FAX: '030 / 555 123 457',
    PRAXIS_EMAIL: 'info@praxis-schmidt-berlin.de',
    SPRECHZEITEN: 'Mo-Fr 8:00-12:00 Uhr, Mo/Di/Do 14:00-18:00 Uhr\nMittwochnachmittag geschlossen',
  };

  it('should match snapshot for Terminvorschlag', async () => {
    const result = await engine.render(
      'termin_vorschlag',
      {
        NAME: 'Herr Thomas Müller',
        DATUM: 'Donnerstag, 25.01.2024',
        UHRZEIT: '10:30',
        HOLD_HINT: 'Bitte beachten Sie, dass wir den Termin für Sie 48 Stunden reservieren.',
      },
      mockSettings
    );

    expect(result).toMatchSnapshot();
  });

  it('should match snapshot for Terminbestätigung', async () => {
    const result = await engine.render(
      'termin_bestaetigung',
      {
        NAME: 'Frau Lisa Weber',
        DATUM: 'Montag, 29.01.2024',
        UHRZEIT: '15:00',
        ORT: 'Praxis Dr. Schmidt, 2. Stock, Zimmer 205',
      },
      mockSettings
    );

    expect(result).toMatchSnapshot();
  });

  it('should match snapshot for Terminabsage', async () => {
    const result = await engine.render(
      'termin_absage',
      {
        NAME: 'Herr Klaus Fischer',
        DATUM: 'Freitag, 02.02.2024',
        UHRZEIT: '11:00',
        GRUND: 'Leider sind an diesem Tag alle Termine bereits vergeben, da Dr. Schmidt an einer Fortbildung teilnimmt.',
      },
      mockSettings
    );

    expect(result).toMatchSnapshot();
  });

  it('should match snapshot for FAQ Antwort', async () => {
    const result = await engine.render(
      'faq_antwort',
      {
        NAME: 'Frau Sandra Meyer',
        ANTWORT_KB: `Unsere Praxis bietet folgende Leistungen an:
- Hausärztliche Grundversorgung
- Vorsorgeuntersuchungen (Check-up 35, Krebsvorsorge)
- Impfungen und Reisemedizin
- Kleine Chirurgie
- EKG und Lungenfunktionsprüfung
- Laboruntersuchungen

Für spezielle Untersuchungen arbeiten wir mit Fachärzten in der Umgebung zusammen.`,
      },
      mockSettings
    );

    expect(result).toMatchSnapshot();
  });

  it('should match snapshot for sensible Nachricht', async () => {
    const result = await engine.render(
      'vorsicht_sensibel',
      {
        NAME: 'Frau Martina Schulz',
      },
      mockSettings
    );

    expect(result).toMatchSnapshot();
  });

  it('should match snapshot for complex UTF-8 content', async () => {
    const result = await engine.render(
      'faq_antwort',
      {
        NAME: 'Herr François Müller-Lüdenscheidt',
        ANTWORT_KB: `Für Ihre Überweisung zum Orthopäden benötigen wir:
- Aktuelle Röntgenbilder (falls vorhanden)
- Ihre bisherigen Befunde
- Eine kurze Schilderung Ihrer Beschwerden

Die Überweisung können Sie während unserer Sprechzeiten abholen.`,
      },
      mockSettings
    );

    expect(result).toMatchSnapshot();
  });

  describe('Line breaks and formatting', () => {
    it('should preserve proper line breaks in all templates', async () => {
      const templates = [
        { name: 'termin_vorschlag', vars: { NAME: 'Test', DATUM: '01.01.2024', UHRZEIT: '10:00', HOLD_HINT: 'Test' } },
        { name: 'termin_bestaetigung', vars: { NAME: 'Test', DATUM: '01.01.2024', UHRZEIT: '10:00', ORT: 'Test' } },
        { name: 'termin_absage', vars: { NAME: 'Test', DATUM: '01.01.2024', UHRZEIT: '10:00', GRUND: 'Test' } },
        { name: 'faq_antwort', vars: { NAME: 'Test', ANTWORT_KB: 'Test answer' } },
        { name: 'vorsicht_sensibel', vars: { NAME: 'Test' } },
      ];

      for (const template of templates) {
        const result = await engine.render(template.name, template.vars, mockSettings);
        
        // Check that we have proper line breaks
        expect(result.split('\n').length).toBeGreaterThan(5);
        
        // Check for double line breaks between sections
        expect(result).toMatch(/\n\n/);
        
        // Check that signature is properly separated
        expect(result).toMatch(/\n\n.*Praxis Dr\. med\. Anna Schmidt/);
      }
    });
  });
});