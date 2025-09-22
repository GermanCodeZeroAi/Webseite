# E-Mail-Antwortgenerierung

Dieses Dokument beschreibt das System zur automatischen Generierung professioneller deutscher E-Mail-Antworten.

## Übersicht

Das System verwendet vordefinierte Templates kombiniert mit optionalem LLM-basierten Feinschliff, um einheitliche, höfliche und professionelle Antworten in deutscher Sprache zu generieren.

## Architektur

### Komponenten

1. **Template Engine** (`src/ai/templates/engine.ts`)
   - Lädt und rendert Markdown-Templates
   - Ersetzt Platzhalter mit konkreten Werten
   - Fügt automatisch Praxis-Signatur an
   - Optional: LLM-basiertes Polishing

2. **Reply Generator** (`src/pipeline/generate/reply.ts`)
   - Wählt passende Templates basierend auf E-Mail-Klassifikation
   - Fügt Policy-Hinweise ein (z.B. AU max. 3 Tage)
   - Erstellt Entwürfe in der Datenbank
   - Aktualisiert E-Mail-Status auf DRAFTED

3. **Templates** (`templates/de/*.md`)
   - Vordefinierte Antwortvorlagen für verschiedene Kategorien
   - Platzhalter im Format `{VARIABLE_NAME}`
   - UTF-8 kodiert mit korrekten Umlauten

## Templates

### Verfügbare Templates

1. **termin_vorschlag.md**
   - Für: Terminanfragen
   - Platzhalter: `{NAME}`, `{DATUM}`, `{UHRZEIT}`, `{HOLD_HINT}`

2. **termin_bestaetigung.md**
   - Für: Terminbestätigungen
   - Platzhalter: `{NAME}`, `{DATUM}`, `{UHRZEIT}`, `{ORT}`

3. **termin_absage.md**
   - Für: Terminabsagen
   - Platzhalter: `{NAME}`, `{DATUM}`, `{UHRZEIT}`, `{GRUND}`

4. **faq_antwort.md**
   - Für: Allgemeine Anfragen
   - Platzhalter: `{NAME}`, `{ANTWORT_KB}`

5. **vorsicht_sensibel.md**
   - Für: Sensible Themen
   - Platzhalter: `{NAME}`

6. **signatur.md**
   - Automatisch an alle E-Mails angehängt
   - Enthält Praxisdaten aus Settings

## Stilregeln

### Sprachstil

- **Höflich und professionell**: Siezen, formelle Anrede
- **Klar und verständlich**: Einfache Sätze, keine Fachbegriffe ohne Erklärung
- **Empathisch**: Verständnis für Patientenanliegen zeigen
- **Strukturiert**: Klare Absätze, Aufzählungen wo sinnvoll

### Formatierung

- **Anrede**: "Guten Tag {NAME},"
- **Grußformel**: "Mit freundlichen Grüßen"
- **Hervorhebungen**: Fettschrift für wichtige Informationen (Markdown: `**text**`)
- **Listen**: Mit Bindestrichen für Aufzählungen

### Beispiele

#### Guter Stil ✓
```
Guten Tag Herr Müller,

vielen Dank für Ihre Anfrage bezüglich eines Termins.

Ich möchte Ihnen folgenden Termin vorschlagen:
**Montag, 15.01.2024 um 10:30 Uhr**

Bitte bestätigen Sie mir, ob dieser Termin für Sie passt.

Mit freundlichen Grüßen
```

#### Zu vermeiden ✗
```
Hallo,

Termin: Mo 15.1. 10:30

MfG
```

## LLM Rewrite

Das optionale LLM-Rewrite-Feature kann über die Settings aktiviert werden:

### Einstellungen

- `llm.rewrite.enabled`: true/false (Standard: false)
- `llm.rewrite.style`: Stil-Vorgabe (Standard: "de-praxis-höflich")
- `llm.rewrite.temperature`: 0.0-1.0 (Standard: 0.3)

### Wann aktivieren?

**Aktivieren bei:**
- Komplexen medizinischen Erklärungen
- Individuellen Patientenanfragen
- Sensiblen Themen

**Deaktiviert lassen bei:**
- Standard-Terminvereinbarungen
- Einfachen FAQ-Antworten
- Wenn einheitliche Formulierung wichtig ist

### Stil-Parameter

- `de-praxis-höflich`: Standard-Stil für Arztpraxen
- `de-praxis-empathisch`: Besonders einfühlsam
- `de-praxis-sachlich`: Neutral und faktisch

## Policy-Integration

Das System fügt automatisch relevante Hinweise aus der Knowledge Base ein:

### Beispiele

- **AU-Bescheinigung**: "Hinweis: Arbeitsunfähigkeitsbescheinigungen können rückwirkend maximal 3 Tage ausgestellt werden."
- **Rezepte**: "Hinweis: Rezepte für Dauermedikation können für maximal 3 Monate ausgestellt werden."
- **Terminabsagen**: "Hinweis: Termine müssen mindestens 24 Stunden vorher abgesagt werden."

## Verwendung

### Code-Beispiel

```typescript
const generator = new ReplyGenerator();

// E-Mail klassifizieren
const classification: EmailClassification = {
  category: 'termin_anfrage',
  confidence: 0.95,
  extractedData: {
    suggestedDate: 'Montag, 15.01.2024',
    suggestedTime: '10:30'
  }
};

// Antwort generieren
const draftId = await generator.generateReply(emailId, classification);
```

### Template direkt verwenden

```typescript
const engine = new TemplateEngine();

const result = await engine.render(
  'termin_vorschlag',
  {
    NAME: 'Herr Müller',
    DATUM: 'Montag, 15.01.2024',
    UHRZEIT: '10:30',
    HOLD_HINT: 'Der Termin wird 24 Stunden für Sie reserviert.'
  },
  praxisSettings,
  knowledgeBase
);
```

## Testing

### Unit Tests
- Template Engine: Platzhalter-Ersetzung, Fehlerbehandlung
- Reply Generator: Template-Auswahl, Policy-Integration

### Snapshot Tests
- Alle Templates mit Beispieldaten
- UTF-8 Encoding
- Zeilenumbrüche und Formatierung

### Testkommandos

```bash
# Alle Tests ausführen
npm test

# Nur Template-Tests
npm test -- test/unit/ai/templates

# Snapshot-Tests aktualisieren
npm test -- -u test/snapshots
```

## Wartung

### Neue Templates hinzufügen

1. Template-Datei in `templates/de/` erstellen
2. Platzhalter im Format `{VARIABLE_NAME}` verwenden
3. In Reply Generator die Template-Auswahl erweitern
4. Tests hinzufügen

### Praxis-Einstellungen

Über die Settings-Tabelle konfigurierbar:

```sql
INSERT INTO settings (key, value) VALUES
  ('praxis.name', 'Praxis Dr. Schmidt'),
  ('praxis.telefon', '030 / 12345678'),
  ('praxis.sprechzeiten', 'Mo-Fr 8:00-12:00'),
  ('llm.rewrite.enabled', 'true');
```

## Best Practices

1. **Templates einfach halten**: Komplexität über Variablen, nicht über Template-Logik
2. **Platzhalter dokumentieren**: Alle verwendeten Variablen in diesem Dokument aufführen
3. **Tests schreiben**: Für jede neue Template-Kategorie Snapshot-Tests erstellen
4. **UTF-8 beachten**: Umlaute direkt schreiben, nicht als HTML-Entities
5. **Versionierung**: Bei Template-Änderungen Version in Reply Generator anpassen

## Troubleshooting

### Häufige Probleme

1. **Platzhalter nicht ersetzt**
   - Prüfen: Variablenname korrekt?
   - Logs checken für Warnungen

2. **Umlaute falsch dargestellt**
   - Datei-Encoding prüfen (muss UTF-8 sein)
   - E-Mail-Encoding in Versand-System prüfen

3. **Template nicht gefunden**
   - Dateipfad prüfen
   - Template-Cache leeren: `engine.clearCache()`

### Debug-Modus

Logging aktivieren für detaillierte Informationen:

```typescript
import { logger } from '../../core/logger/index.js';
logger.level = 'debug';
```