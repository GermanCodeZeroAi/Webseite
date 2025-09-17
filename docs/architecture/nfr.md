## Nichtfunktionale Anforderungen (NFR) – German Code Zero AI

### Performance-Budgets
- Core Web Vitals (CWV):
  - LCP ≤ 2.5s (p75, mobile), CLS ≤ 0.1, INP ≤ 200ms.
- API-Latenz (p95):
  - Reads ≤ 300ms, Writes ≤ 700ms, Webhook-Handling ≤ 2s (inkl. Idempotenzprüfung).
- Throughput-Ziel: 100 RPS steady auf API (skaliert horizontal).

### Accessibility (WCAG 2.2 AA)
- Tastaturbedienbarkeit, Fokusindikatoren, Kontrast ≥ 4.5:1, ARIA-Landmarks.
- Medien: Untertitel/Transkripte für Video/Audio-Beispiele.

### Observability
- OpenTelemetry Tracing/Metrics/Logs, Sentry für Errors.
- RED/USE Metriken, Service-Level Objectives (SLO) und Alerts.

### Sicherheit
- TLS 1.2+, HSTS, CSP, CSRF-Schutz wo relevant.
- Webhook-Signaturen, Ratelimits, Idempotency, Input-Validierung, SSRF/XXE-Vermeidung.

### Ratelimits
- Token Bucket via Redis: pro IP, pro Company, pro Endpoint-Klasse.
- 429-Antworten mit Retry-After, Beobachtung/Safelisting für legitime Spikes.

### Verfügbarkeit & Zuverlässigkeit
- Ziel: 99.9% Monatsverfügbarkeit.
- Backups (PITR), Replikation, Rolling Deploys, Canary-Option.

### Datenschutz & Compliance
- Consent-Management, Datenminimierung, Lösch-/Sperrkonzepte, DPIA-Prozess.