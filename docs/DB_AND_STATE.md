# DB & State Management

## Übersicht

Der Praxis E-Mail Agent nutzt SQLite mit better-sqlite3 für persistente Datenhaltung. Das System ist auf Idempotenz, Audit-Trails und klare State-Übergänge ausgelegt.

## Datenbank-Schema

```mermaid
erDiagram
    emails {
        int id PK
        string message_id UK
        string account_email
        string folder
        string from_email
        string to_email
        string subject
        text body_text
        text body_html
        datetime received_at
        json headers
        json attachments
        enum status
        string error_message
        datetime created_at
        datetime updated_at
    }
    
    extracted_data {
        int id PK
        int email_id FK
        string data_type
        json extracted_data
        float confidence
        bool validated
        datetime created_at
        datetime updated_at
    }
    
    drafts {
        int id PK
        int email_id FK
        string reply_to
        string to_email
        string subject
        text body_text
        text body_html
        string template_used
        enum status
        datetime scheduled_for
        datetime sent_at
        string error_message
        datetime created_at
        datetime updated_at
    }
    
    calendar_slots {
        int id PK
        string calendar_id
        datetime start_time
        datetime end_time
        bool is_available
        json appointment_type
        datetime created_at
        datetime updated_at
    }
    
    events {
        int id PK
        string event_type
        string source
        json data
        bool processed
        datetime created_at
    }
    
    settings {
        string key PK
        string value
        datetime updated_at
    }
    
    emails ||--o{ extracted_data : "has"
    emails ||--o{ drafts : "triggers"
    emails ||--o{ events : "logs"
```

## State-Flows

### E-Mail Verarbeitungs-Pipeline

```mermaid
stateDiagram-v2
    [*] --> NEW: Email empfangen
    NEW --> PROCESSING: Klassifizierung startet
    PROCESSING --> PROCESSED: Erfolgreich verarbeitet
    PROCESSING --> FAILED: Fehler aufgetreten
    PROCESSING --> IGNORED: Nicht relevant
    FAILED --> PROCESSING: Retry
    PROCESSED --> [*]
    IGNORED --> [*]
```

### Draft Lifecycle

```mermaid
stateDiagram-v2
    [*] --> DRAFT: Entwurf erstellt
    DRAFT --> SCHEDULED: Zeitgesteuert
    DRAFT --> SENT: Direkt gesendet
    SCHEDULED --> SENT: Zeit erreicht
    DRAFT --> FAILED: Sendefehler
    SCHEDULED --> FAILED: Sendefehler
    SENT --> [*]
    FAILED --> DRAFT: Korrektur
```

## Repository-Pattern

### EmailsRepo
- `insertIngested(email)`: Neue E-Mail hinzufügen
- `markClassified(id, class, score, flags)`: Klassifizierung speichern
- `addPIIFlags(id, json)`: PII-Markierungen hinzufügen
- `upsertState(id, state)`: Status aktualisieren
- `findByMessageId(msgId)`: Suche per Message-ID
- `findByTextHash(hash)`: Duplikat-Erkennung

### ExtractedRepo
- `upsert(email_id, fields, confidence)`: Daten extrahieren/aktualisieren
- `findByEmailId(email_id)`: Alle extrahierten Daten
- `validate(id)`: Daten als validiert markieren

### DraftsRepo
- `insert(email_id, class, template, body)`: Entwurf erstellen
- `updateStatus(id, status)`: Status ändern
- `schedule(id, datetime)`: Zeitgesteuert planen

### CalendarRepo
- `createSlot(slot)`: Zeitslot anlegen
- `hold(slotId, emailId, ttl)`: Temporär reservieren
- `confirm(slotId)`: Reservierung bestätigen
- `releaseExpiredHolds()`: Abgelaufene Holds freigeben

### EventsRepo
- `append(email_id, type, data)`: Event loggen
- `findByEmailId(email_id)`: Audit-Trail abrufen

### SettingsRepo
- `get/set(key, value)`: Key-Value Speicher
- Typed accessors für alle Einstellungen

## Idempotenz

### Text-Hashing
```typescript
// SHA256(messageId + normalizedBody)
const hash = createHash('sha256')
  .update(`${messageId}:${normalizedBody}`)
  .digest('hex');
```

### Duplikat-Erkennung
1. Check auf Message-ID (Primary)
2. Check auf Text-Hash (Secondary)
3. Batch-Deduplizierung im Speicher

## Audit & Events

Alle wichtigen Operationen werden geloggt:

```typescript
auditLogger.logEmailReceived(emailId, messageId, from);
auditLogger.logEmailClassified(emailId, classification, confidence);
auditLogger.logDraftCreated(emailId, draftId, template);
auditLogger.logDraftSent(emailId, draftId, to);
```

## Typed Settings

Zentrale Konfiguration mit Typ-Sicherheit:

```typescript
praxisSettings.autoSendEnabled = true;
praxisSettings.autoSendConfidenceThreshold = 0.95;
praxisSettings.workingHoursStart = "08:00";
praxisSettings.workingDays = [1, 2, 3, 4, 5]; // Mo-Fr

// Helper
if (praxisSettings.canAutoSend(confidence)) {
  // Auto-send logic
}
```

## Best Practices

1. **Transaktionen**: Nutze `dbConnection.transaction()` für atomare Operationen
2. **Idempotenz**: Prüfe immer auf Duplikate vor Insert
3. **Audit**: Logge alle state-changing Operations
4. **Error Handling**: Speichere Fehler in `error_message` Feldern
5. **Cleanup**: Nutze Events cleanup und Calendar hold expiry

## Performance

- WAL-Mode für bessere Concurrency
- Indizes auf: status, account_email, received_at, is_available
- Cache für häufig gelesene Settings
- Batch-Operationen wo möglich