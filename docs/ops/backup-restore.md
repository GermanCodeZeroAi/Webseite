## Backup & Restore – German Code Zero AI

Ziel: Sicherung und Wiederherstellung von Postgres/Redis und Audit-Events. Keine Secrets in diesem Dokument.

### Postgres
- Backups: PITR-fähig (Base + WAL). Turnus: täglich Full, 5-min WAL Upload.
- Aufbewahrung: 30 Tage (konfigurierbar). Verschlüsselt (KMS-managed).
- Test-Restores: 1x pro Woche in isolierter Umgebung.

Restore-Verfahren (Beispielablauf):
1. Neuen leeren Cluster bereitstellen.
2. Base-Backup einspielen, WAL-Replay bis Zielzeitpunkt.
3. Read-Only Validierung: Konsistenz, kritische Tabellen (`orders`, `invoices`, `subscriptions`).
4. Umschalten der Anwendung (Readiness prüfen), DNS/Service-Switch.

### Redis
- Snapshot (RDB) + AOF, tägliche Snapshots, 24h Aufbewahrung.
- Restore: Neues Redis, Snapshot einspielen; Kaltstart-Caches akzeptabel.

### WebhookEvent-Audit
- Persistiert in Postgres. Kein separater Backup-Plan nötig.

### Notizen
- Verschlüsselung at rest und in transit.
- Zugriffskontrolle: Least Privilege für Backup-Service-Accounts.