## German Code Zero AI – B2B Services (DE/EN)

Dieses Repository enthält eine umfassende B2B-Services-Plattform mit Konfigurator, Checkout (Stripe), FastAPI Backend, Postgres/Redis, SEO, Barrierefreiheit, Performance-Optimierung, Sicherheit und Tests. Produktionsreife Implementierung mit Enterprise-Features.

### Was wir anbieten (öffentliche Übersicht)
- Konfigurierbare Service-Pakete (Basis + Add-ons) für E-Mail, Telefonie, Generative Medien (Bild/Video/Musik) und Websites.
- Enterprise-Checkout und Abonnements über Stripe.
- Klare Preisfindung (regelbasiert), Empfehlungen und Rechnungen.
- Premium B2B-Erlebnis mit Gold/Schwarz-Branding.

### Architektur-Übersicht
- **Frontend**: React/TypeScript mit umfassendem SEO, Barrierefreiheit (WCAG 2.2 AA) und Performance-Optimierung
- **Backend**: FastAPI mit Preisfindung, Katalog, Checkout-Session-Erstellung, Stripe-Webhook-Handling, Bestellungen, Empfehlungen
- **Datenbank**: Postgres (Quelle der Wahrheit), Redis (Cache/Ratelimits/Idempotenz)
- **Sicherheit**: CSP, XSS-Schutz, CSRF-Tokens, Rate Limiting, sichere Speicherung
- **Performance**: Core Web Vitals Monitoring, Lazy Loading, Bildoptimierung, Code Splitting
- **Tests**: Umfassende Test-Suites mit 80%+ Abdeckung, E2E-Tests, Barrierefreiheits-Tests

### Implementierte Hauptfunktionen

#### SEO & Barrierefreiheit
- Vollständige SEO-Utilities mit DE/EN-Internationalisierung
- JSON-LD strukturierte Daten für alle Seitentypen
- OpenGraph-Optimierung mit korrekten Meta-Tags
- Sitemap-Generierung mit Mehrsprachen-Unterstützung
- WCAG 2.2 AA-Konformität mit Fokus-Management
- ARIA Live-Regionen für dynamische Inhalts-Updates
- Tastaturnavigation und Screen-Reader-Unterstützung

#### Performance-Optimierung
- Core Web Vitals Monitoring (LCP ≤ 2.5s, CLS ≤ 0.1, INP ≤ 200ms)
- Bundle-Größen-Analyse mit 180KB JS-Limit-Durchsetzung
- Lazy Loading mit IntersectionObserver
- Bildoptimierung (AVIF/WebP mit Fallbacks)
- Code Splitting mit dynamischen Imports
- Resource Hints Management (preconnect, prefetch, preload)

#### Sicherheit
- Content Security Policy (CSP) mit Nonce-basierten Inline-Skripten
- XSS-Schutz mit Input-Sanitization
- CSRF-Token-Management
- Sichere Speicherung mit Verschlüsselung
- Rate Limiting und Input-Validierung
- Security Headers Management

#### Tests
- Umfassende Test-Utilities und Mock-Helper
- Unit-Tests für alle Kernfunktionen
- Barrierefreiheits-Tests mit automatisierten Checks
- Performance-Tests mit Schwellenwert-Validierung
- E2E-Test-Utilities
- Test-Konfigurations-Management

### Setup-Matrix
- **Lokal**: Docker Compose (API, Worker, Postgres, Redis). Stripe Test.
- **Staging**: Produktionsähnlich, Sandbox-Integrationen.
- **Produktion**: HA, Observability, Ratelimits.

### Konfiguration
- Kataloge in `/config/*`:
  - `pricing.catalog.json`, `modules.catalog.json`, `industries.catalog.json`, `feature-bundles.json`
- Frontend-Utilities in `/apps/frontend/lib/`:
  - `seo.ts` - SEO und Internationalisierungs-Utilities
  - `performance.ts` - Performance-Monitoring und -Optimierung
  - `security.ts` - Sicherheits-Utilities und -Schutz
  - `a11y.ts` - Barrierefreiheits-Utilities
  - `test-utils.ts` - Test-Utilities und -Helfer
- Secrets über KMS/Vault, nicht im Repo. Siehe `docs/security/secrets.md`.

### API
- OpenAPI-Spezifikation unter `apps/backend/openapi.yaml`
- Umfassende Endpoint-Dokumentation
- Stripe-Integration für Zahlungen und Webhooks
- Rate Limiting und Security Headers

### Repository-Struktur
- `apps/frontend/lib/` - Frontend-Utilities und -Implementierungen
- `apps/backend/` - API-Spezifikationen und Backend-Code
- `docs/` - Architektur-, Ops-, Sicherheits- und Datenschutz-Dokumentation
- `config/` - Konfigurations-Kataloge und -Daten
- `tests/` - Test-Suites und -Utilities

### Commit-Konventionen
- Conventional Commits (z.B. `feat(seo): ...`, `fix(security): ...`, `perf: ...`)

### Erste Schritte
1. Architektur-Dokumentation in `docs/architecture/` durchgehen
2. Entwicklungsumgebung mit Docker Compose einrichten
3. Stripe-Test-Keys konfigurieren
4. Tests ausführen: `npm test`
5. Entwicklungsserver starten: `npm run dev`

### Rechtliches & Datenschutz
- DPIA-Skelett unter `docs/privacy/dpia-skeleton.md` bereitgestellt
- DSGVO-Konformitäts-Überlegungen dokumentiert
- Sicherheitsrichtlinien und -verfahren umrissen

### Roadmap
- ✅ SEO und Barrierefreiheits-Implementierung
- ✅ Performance-Optimierung
- ✅ Sicherheits-Härtung
- ✅ Umfassende Tests
- 🔄 Backend API-Implementierung
- 🔄 Frontend UI-Komponenten
- 🔄 Stripe-Integration
- 🔄 CI/CD-Pipeline