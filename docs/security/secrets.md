## Secrets Policy – German Code Zero AI

Ziel: Sichere Verwaltung von Geheimnissen (API Keys, Tokens, Credentials). Keine Secrets im Repo.

### Prinzipien
- Kein Secret im Quellcode oder in Git-Historie.
- Nutzung eines Secret-Managers (KMS/Vault) für alle Umgebungen.
- Least Privilege, Rotationspläne, kurze TTLs, Audit-Logging.

### Speicherung & Bezug
- Prod/Staging: Secret-Manager (z. B. Cloud KMS + Vault) als Quelle der Wahrheit.
- Local: `.env.local` nur mit Platzhaltern; echte Werte per lokalen Secret-Store.
- CI/CD: Inject per OIDC/JWT Workload Identity, nicht per statische Langzeitschlüssel.

### Transport & Nutzung
- TLS überall; Secrets nur im Memory, nicht loggen.
- Webhook-Signaturen (Stripe) verifizieren, Secret über Secret-Manager beziehen.
- Idempotency Keys behandeln wie vertraulich (kurzlebig, nicht persistieren als Plaintext-Logs).

### Rotation
- Geplanter Rotationszyklus (z. B. 90 Tage) + Ad-hoc bei Vorfällen.
- Automatisierte Rollouts via CI/CD, Zero-Downtime anstreben.

### Erkennung & Prävention
- Secret-Scanner in CI (Pre-commit/CI Hooks) – False Positives whitelisten.
- Access Reviews, Break-Glass-Konten mit strengem Prozess.

### .env.example
Nur Platzhalter; keine realen Werte:

```
# Backend
APP_ENV=production
DATABASE_URL=postgres://USER:PASSWORD@HOST:5432/DBNAME
REDIS_URL=redis://HOST:6379/0
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
SENTRY_DSN=https://PUBLIC_KEY@SENTRY_HOST/PROJECT
OTEL_EXPORTER_OTLP_ENDPOINT=https://otel-collector:4317
```

Hinweis: Diese Werte sind Beispiele/Platzhalter und dürfen nicht produktiv verwendet werden.