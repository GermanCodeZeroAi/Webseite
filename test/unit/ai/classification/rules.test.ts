import { describe, it, expect } from '@jest/globals';
import { classifyWithRules, detectMixedIntent, detectForeignLanguage } from '../../../../src/ai/classification/rules';

describe('Rule-based Classification', () => {
  describe('classifyWithRules', () => {
    it('should classify appointment requests correctly', () => {
      const fixtures = [
        'Ich möchte gerne einen Termin vereinbaren.',
        'Kann ich nächste Woche Dienstag einen Termin bekommen?',
        'Haben Sie am 15. März noch einen Termin frei?',
        'Wann kann ich zur Sprechstunde kommen?'
      ];

      for (const text of fixtures) {
        const result = classifyWithRules(text);
        expect(result.category).toBe('Termin');
        expect(result.score).toBeGreaterThan(0.5);
        expect(result.matchedPatterns.length).toBeGreaterThan(0);
      }
    });

    it('should classify appointment cancellations correctly', () => {
      const fixtures = [
        'Ich muss meinen Termin am Montag leider absagen.',
        'Kann ich den Termin verschieben? Ich bin verhindert.',
        'Ich möchte meinen Termin stornieren.',
        'Leider kann ich morgen nicht kommen, bin krank.'
      ];

      for (const text of fixtures) {
        const result = classifyWithRules(text);
        expect(result.category).toBe('Terminabsage');
        expect(result.score).toBeGreaterThan(0.5);
      }
    });

    it('should classify sick note requests correctly', () => {
      const fixtures = [
        'Ich brauche eine Krankschreibung für meinen Arbeitgeber.',
        'Können Sie mir eine AU-Bescheinigung ausstellen?',
        'Ich bin seit 3 Tagen krank und benötige einen gelben Schein.',
        'Meine Krankschreibung läuft aus, ich brauche eine Verlängerung.'
      ];

      for (const text of fixtures) {
        const result = classifyWithRules(text);
        expect(result.category).toBe('AU');
        expect(result.score).toBeGreaterThan(0.5);
      }
    });

    it('should classify prescription requests correctly', () => {
      const fixtures = [
        'Ich brauche ein neues Rezept für mein Blutdruckmedikament.',
        'Können Sie mir Ibuprofen 600mg verschreiben?',
        'Mein Insulin ist alle, ich benötige ein Folgerezept.',
        'Bitte stellen Sie mir ein Rezept für die Salbe aus.'
      ];

      for (const text of fixtures) {
        const result = classifyWithRules(text);
        expect(result.category).toBe('Rezept');
        expect(result.score).toBeGreaterThan(0.5);
      }
    });

    it('should classify general questions correctly', () => {
      const fixtures = [
        'Ich habe eine Frage zu meinen Symptomen.',
        'Was bedeutet dieser Befund?',
        'Können Sie mir erklären, wie die Behandlung funktioniert?',
        'Ich habe seit einer Woche Kopfschmerzen, was kann das sein?'
      ];

      for (const text of fixtures) {
        const result = classifyWithRules(text);
        expect(result.category).toBe('Allgemeine Frage');
        expect(result.score).toBeGreaterThan(0.3);
      }
    });

    it('should classify unclear content as Sonstiges', () => {
      const fixtures = [
        'asdfghjkl',
        '!!!!!!',
        'Lorem ipsum dolor sit amet',
        ''
      ];

      for (const text of fixtures) {
        const result = classifyWithRules(text);
        expect(result.category).toBe('Sonstiges');
        expect(result.score).toBeLessThanOrEqual(0.1);
      }
    });

    it('should handle umlauts and special characters', () => {
      const text = 'Ich hätte gerne einen Termin für nächste Woche. Können Sie mir helfen?';
      const result = classifyWithRules(text);
      expect(result.category).toBe('Termin');
      expect(result.score).toBeGreaterThan(0.5);
    });
  });

  describe('detectMixedIntent', () => {
    it('should detect mixed intents correctly', () => {
      const mixedIntents = [
        'Ich brauche einen Termin und auch ein Rezept für meine Tabletten.',
        'Kann ich morgen kommen? Außerdem benötige ich eine Krankschreibung.',
        'Ich möchte meinen Termin absagen und gleichzeitig ein neues Rezept bestellen.',
        'Brauche AU-Bescheinigung und Termin für nächste Woche.'
      ];

      for (const text of mixedIntents) {
        expect(detectMixedIntent(text)).toBe(true);
      }
    });

    it('should not detect mixed intent for single topics', () => {
      const singleIntents = [
        'Ich möchte einen Termin vereinbaren.',
        'Ich brauche nur ein Rezept.',
        'Kann ich eine Krankschreibung bekommen?',
        'Ich habe eine Frage zu meiner Behandlung.'
      ];

      for (const text of singleIntents) {
        expect(detectMixedIntent(text)).toBe(false);
      }
    });

    it('should ignore general questions in mixed intent detection', () => {
      const text = 'Ich habe eine Frage und möchte einen Termin.';
      // Should not be mixed because "Allgemeine Frage" is ignored
      expect(detectMixedIntent(text)).toBe(false);
    });
  });

  describe('detectForeignLanguage', () => {
    it('should detect German text correctly', () => {
      const germanTexts = [
        'Ich möchte einen Termin vereinbaren.',
        'Können Sie mir helfen?',
        'Das ist eine deutsche E-Mail.',
        'Wir brauchen Ihre Hilfe.'
      ];

      for (const text of germanTexts) {
        expect(detectForeignLanguage(text)).toBe(false);
      }
    });

    it('should detect English text', () => {
      const englishTexts = [
        'I would like to make an appointment.',
        'Can you help me with this prescription?',
        'This is an English email.',
        'Please send me the information.'
      ];

      for (const text of englishTexts) {
        expect(detectForeignLanguage(text)).toBe(true);
      }
    });

    it('should detect other foreign languages', () => {
      const foreignTexts = [
        'Je voudrais prendre un rendez-vous.', // French
        'Necesito una cita con el médico.', // Spanish
        'Vorrei prenotare un appuntamento.' // Italian
      ];

      for (const text of foreignTexts) {
        expect(detectForeignLanguage(text)).toBe(true);
      }
    });

    it('should handle mixed language content', () => {
      const text = 'Hello, ich möchte einen appointment.';
      expect(detectForeignLanguage(text)).toBe(true);
    });
  });

  describe('Edge cases and special scenarios', () => {
    it('should handle very long emails', () => {
      const longEmail = 'Ich möchte einen Termin. '.repeat(100);
      const result = classifyWithRules(longEmail);
      expect(result.category).toBe('Termin');
      expect(result.score).toBeGreaterThan(0.5);
    });

    it('should handle emails with lots of whitespace', () => {
      const text = '\n\n\n   Ich   brauche   ein   Rezept   \n\n\n';
      const result = classifyWithRules(text);
      expect(result.category).toBe('Rezept');
    });

    it('should handle emails with mixed case', () => {
      const text = 'ICH BRAUCHE EINEN TERMIN. Können Sie MIR helfen?';
      const result = classifyWithRules(text);
      expect(result.category).toBe('Termin');
    });

    it('should prioritize more specific categories', () => {
      // "Terminabsage" should win over "Termin" when both patterns match
      const text = 'Ich muss meinen Termin leider absagen.';
      const result = classifyWithRules(text);
      expect(result.category).toBe('Terminabsage');
    });
  });
});