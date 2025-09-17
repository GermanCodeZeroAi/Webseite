## Runbook – German Code Zero AI

Zweck: Betriebsleitfaden für lokal und Produktion. Keine Secrets; nur Platzhalter/Prozesse.

### Umgebungen
- Local: Entwicklergeräte, Docker Compose (API, Worker, Postgres, Redis), Stripe Test.
- Staging: Produktionsnah, echte Integrationen in Sandbox-Modus.
- Production: Hochverfügbar, observability-on, Ratelimits aktiv.

### Start (Local)
1. `.env.example` kopieren zu `.env.local` und Platzhalter ausfüllen (ohne Secrets im Repo).
2. Docker Compose starten (API, Worker, DB, Cache).
3. Datenbank migrieren, Seed-Daten (nur Metadaten ohne Preise, falls nicht freigegeben).
4. OpenAPI unter `/apps/backend/openapi.yaml` referenzieren.

### Deploy (Prod)
- CI/CD: Build, Tests, Security-Checks, Migrations, Blue/Green Rollout.
- Konfiguration per Env Vars aus KMS/Vault; Webhook-Signatur-Secret über Secret-Manager.
- Health Checks: `/api/health` (readiness), externes Uptime-Monitoring.

### Betrieb
- Monitoring: SLOs, Traces (Otel), Sentry Errors, struktur. Logs.
- Ratelimits: pro IP/Company, Redis-basierte Token Bucket.
- Caches: Expire/Invalidate nach Deploys.

### Routineaufgaben
- Katalog-Updates einspielen (Vier-Augen-Prinzip, Reviews).
- Backups überprüfen (siehe Backup/Restore).
- Webhook-Retries beobachten und fehlerhafte Events manuell re-queuen.

### Oncall
- Eskalationspfad: L1 (Ops) → L2 (Backend) → L3 (Payments/Infra).
- Kommunikationskanäle: Issue-Tracker, Incident-Channel.

### Sicherheit
- Secrets nie im Repo. Zugriff via IAM, kurzlebige Tokens.
- Signaturen prüfen (Stripe), Idempotency Keys verwenden.