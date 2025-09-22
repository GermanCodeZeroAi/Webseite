# Observability & Monitoring

## Übersicht

Der Praxis E-Mail Agent verfügt über ein umfassendes Observability-System zur Überwachung der Systemgesundheit, Performance und kritischer Operationen.

## Komponenten

### 1. Strukturiertes Logging (Pino)

#### Features
- **Child Logger**: Jedes Modul hat seinen eigenen Logger-Kontext
- **Pretty Printing**: Entwickler-freundliche Ausgabe im Dev-Mode
- **Performance Tracking**: Automatisches Logging von Ausführungszeiten
- **Error Context**: Strukturierte Fehlererfassung mit Stack Traces

#### Vordefinierte Logger
```typescript
loggers.db         // Datenbank-Operationen
loggers.health     // Health-Check Ergebnisse
loggers.watchdog   // Watchdog-Aktivitäten
loggers.email      // E-Mail Verarbeitung
loggers.ai         // KI-Operationen
loggers.pipeline   // Pipeline-Schritte
loggers.api        // API-Calls
```

#### Helper-Funktionen
```typescript
// Fehler mit Kontext loggen
logError(logger, error, 'Operation failed', { emailId: 123 });

// Performance messen
const start = Date.now();
// ... operation ...
logPerformance(logger, 'email_processing', Date.now() - start);
```

### 2. Health Checks

Das System prüft folgende Komponenten:

#### Kritische Checks (müssen für Start OK sein)
- **Database**: SQLite-Verbindung und Schema-Integrität
- **Filesystem**: Schreibrechte im Daten-Verzeichnis
- **Environment**: Alle erforderlichen Umgebungsvariablen

#### Erweiterte Checks
- **Ollama**: KI-Service Erreichbarkeit (Warning bei Fehler)
- **Email**: OAuth-Konfiguration für Gmail/Outlook

#### Health Check Ausführung
```bash
# Einmaliger Check mit Exit-Code
pnpm health

# Beispiel-Ausgabe:
# ✅ database       HEALTHY    Database connection OK
#    └─ tables: 6, responseTime: 12
#    └─ Duration: 12ms
# 
# ⚠️  ollama         WARNING    Ollama unreachable: Connection refused
#    └─ url: "http://localhost:11434"
#    └─ Duration: 5002ms
```

### 3. Watchdog

Zyklische Überwachung (Standard: 60 Sekunden):

#### Aufgaben
1. **Health Monitoring**: Führt alle Health Checks aus
2. **Calendar Cleanup**: Gibt abgelaufene Slot-Reservierungen frei
3. **Event Logging**: Protokolliert jeden Tick für Audit-Trail

#### Konfiguration
```bash
# Watchdog deaktivieren
pnpm dev --no-watchdog

# Interval ändern (in Sekunden)
pnpm dev --watchdog-interval=30
```

#### Events
- `watchdog.tick`: Jeder Durchlauf
- `health.check_failed`: Bei fehlgeschlagenen Checks
- `calendar.holds_released`: Bei freigegebenen Slots

### 4. Audit Trail

Alle wichtigen Operationen werden als Events gespeichert:

```typescript
// E-Mail Events
auditLogger.logEmailReceived(emailId, messageId, from);
auditLogger.logEmailClassified(emailId, classification, confidence);

// System Events
auditLogger.logError(null, error, { module: 'pipeline' });
auditLogger.logWarning(emailId, 'Unusual pattern detected');

// User Actions
auditLogger.logUserAction(emailId, 'manual_approval', username);
```

## Monitoring-Integration

### Aktuelle Metriken

Der Watchdog liefert folgende Metriken:
- Health Status (healthy/unhealthy pro Check)
- Ausführungszeiten pro Check
- Anzahl freigegebener Calendar-Holds
- Fehlerrate und -typen

### Log-Ausgabe

#### Development
```
10:23:45.123 | health | Running health check
10:23:45.234 | health | ✓ Health check passed { duration: 111 }
10:23:45.235 | watchdog | Watchdog tick completed { run: 1, tasksRun: 2 }
```

#### Production (JSON)
```json
{
  "level": 30,
  "time": "2024-01-15T10:23:45.123Z",
  "module": "watchdog",
  "msg": "Watchdog tick completed",
  "run": 1,
  "tasksRun": 2,
  "duration": 115
}
```

## Alarm-Anbindung (Zukünftig)

### E-Mail Alerts
```typescript
// Geplant für kritische Fehler
if (!healthResult.healthy) {
  await emailAlert.send({
    to: praxisSettings.escalationEmail,
    subject: 'System Health Alert',
    criticalChecks: failedChecks
  });
}
```

### Microsoft Teams
```typescript
// Webhook-Integration geplant
await teamsWebhook.post({
  title: 'Praxis Agent Alert',
  color: 'danger',
  facts: [
    { name: 'Check', value: 'Database' },
    { name: 'Status', value: 'Connection lost' }
  ]
});
```

### Telegram Bot
```typescript
// Bot-Integration geplant
await telegramBot.sendMessage({
  chatId: praxisSettings.telegramChatId,
  text: '🚨 Ollama Service nicht erreichbar!',
  parseMode: 'Markdown'
});
```

## Best Practices

### 1. Logging
- Nutze Child-Logger mit Modul-Kontext
- Logge Start/Ende wichtiger Operationen
- Füge relevante IDs (emailId, draftId) als Kontext hinzu
- Nutze strukturierte Logs statt String-Konkatenation

### 2. Health Checks
- Füge eigene Checks für neue Komponenten hinzu
- Unterscheide zwischen kritisch (unhealthy) und optional (warning)
- Halte Checks schnell (< 5 Sekunden Timeout)
- Liefere aussagekräftige Fehlermeldungen

### 3. Monitoring
- Prüfe Watchdog-Status regelmäßig in Logs
- Setze Alerts für wiederholte Fehler auf
- Überwache Trends (z.B. steigende Response-Zeiten)
- Bereinige alte Events regelmäßig

## Troubleshooting

### Watchdog läuft nicht
```bash
# Status im Log prüfen
grep "Watchdog" app.log

# Manuell starten mit kürzerem Interval
pnpm dev --watchdog-interval=10
```

### Health Check schlägt fehl
```bash
# Einzelnen Check ausführen
pnpm health

# Verbose Logging aktivieren
LOG_LEVEL=debug pnpm health
```

### Performance-Probleme
```bash
# Performance-Logs analysieren
grep "durationMs" app.log | jq '.durationMs' | sort -n

# Slow Queries identifizieren
grep "db |" app.log | grep -E "duration[M]s.*[0-9]{4}"
```

## Dashboard (Geplant)

Zukünftig: Web-basiertes Dashboard mit:
- Live Health-Status
- Watchdog-Aktivität
- E-Mail-Verarbeitungs-Statistiken
- Error-Rate Graphen
- Calendar-Auslastung