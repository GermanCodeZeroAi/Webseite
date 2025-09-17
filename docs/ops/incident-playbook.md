## Incident Playbook – German Code Zero AI

Ziel: Einheitliches Vorgehen bei Störungen. Keine Secrets.

### Schweregrade
- SEV-1: Checkout/Payments global down.
- SEV-2: Webhooks verzögert, Bestellungen stauen sich.
- SEV-3: Einzelne Module/Regionen beeinträchtigt.

### Prozess
1. Erkennen (Monitoring/Alerts, Tickets, Support).
2. Triagieren (Scope, Impact, Hypothese, Schweregrad).
3. Kommunizieren (Incident-Channel, Status-Update alle 30–60 Min.).
4. Eindämmen (Feature-Flags, Ratelimits, Queue-Drain, Traffic-Shaping).
5. Beheben (Rollback/Hotfix, Config-Fix, Infrastrukturmaßnahme).
6. Validieren (Health, Backlog leer, KPIs normalisieren).
7. Postmortem (5-Why, Action Items mit Owner/Deadline).

### Standard-Runbooks je Kategorie
- Payments/Stripe: Prüfen der Webhook-Zustellung, Replays, Signaturvalidierung, Idempotency-Konflikte.
- Datenbank: Lock-Contention, langsame Queries, Reindex, Read-Replicas.
- Redis: Keys-Explosion, Ratelimit-Fehlkalibrierung, TTL-Korrekturen.
- Backend: Error-Rate Spike, Rollback, Canary-Pause.

### Kommunikation
- Intern: Incident-Channel, Issue-Tracker.
- Extern: Status-Seite, betroffene Kunden (nur notwendige Infos, keine Interna).