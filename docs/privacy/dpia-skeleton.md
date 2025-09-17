## DPIA Skeleton – German Code Zero AI

Hinweis: Keine Rechtsberatung. Diese Vorlage dient als Strukturhilfe für eine Datenschutz-Folgenabschätzung (Art. 35 DSGVO). Inhalte sind Platzhalter, fachlich zu prüfen.

### 1. Beschreibung der Verarbeitung
- Zweck(e) der Verarbeitung: B2B-Dienstleistungen (Konfigurator, Checkout, Abwicklung).
- Kategorien betroffener Personen: Kundenvertreter (B2B), Website-Besucher.
- Datenkategorien: Kontaktdaten, Bestell-/Abodaten, Zahlungs-Metadaten (keine vollständigen Zahlungsdaten – Stripe verarbeitet), technische Nutzungsdaten.

### 2. Rechtsgrundlagen & Notwendigkeit
- Vertragsdurchführung (Art. 6 Abs. 1 lit. b), berechtigte Interessen (lit. f) für Betrugsprävention, Einwilligung (lit. a) für Marketing/Tracking.

### 3. Beschreibung der Systeme & Datenflüsse
- Frontend ↔ Backend ↔ Stripe ↔ Postgres/Redis (siehe C4-Dokumente).
- Webhooks (Stripe) mit Signaturprüfung; Audit-Logs (`WebhookEvent`).

### 4. Risiken für Rechte und Freiheiten
- Unbefugter Zugriff, Zweckänderung, Fehlkonfiguration, Datenabfluss, Profilbildung.

### 5. Maßnahmen (technisch/organisatorisch)
- Zugriffskontrolle (IAM, Least Privilege), Verschlüsselung in Transit/at Rest.
- Protokollierung/Monitoring, Ratelimits, Idempotency, Backups, Lösch-/Sperrkonzepte.
- Consent-Management, Transparenz, Datenminimierung.

### 6. Bewertung der Notwendigkeit/Verhältnismäßigkeit
- Datenminimierung in Katalog/Bestellprozess, Pseudonymisierung wo möglich.

### 7. Einbindung von Stakeholdern
- Datenschutz, Sicherheit, Engineering, Operations.

### 8. Ergebnis & Freigaben
- Rest-Risiko-Einschätzung, Maßnahmenplan, Freigabe durch Datenschutzbeauftragte(n).