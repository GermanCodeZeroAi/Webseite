# Changelog

Alle wichtigen Änderungen an diesem Projekt werden in dieser Datei dokumentiert.

Das Format basiert auf SemVer.

## [0.1.0] - 2025-01-17
### Hinzugefügt
- **SEO & Barrierefreiheits-Implementierung**
  - Vollständige SEO-Utilities mit DE/EN-Internationalisierung
  - JSON-LD strukturierte Daten für alle Seitentypen (Organization, WebSite, WebPage, Product, BreadcrumbList)
  - OpenGraph-Optimierung mit korrekten Meta-Tags und Bildverarbeitung
  - Sitemap-Generierung mit Mehrsprachen-Unterstützung und Bild-Sitemaps
  - Hreflang-Attribute für internationales SEO
  - WCAG 2.2 AA-Konformität mit umfassenden Barrierefreiheits-Utilities
  - ARIA Live-Regionen für dynamische Inhalts-Updates (Preisänderungen, Formularfehler)
  - Fokus-Management und Tastaturnavigation-Helfer
  - Screen-Reader-Utilities und Farbkontrast-Prüfung
  - Barrierefreiheits-Test-Automatisierung

- **Performance-Optimierung**
  - Core Web Vitals Monitoring (LCP ≤ 2.5s, CLS ≤ 0.1, INP ≤ 200ms)
  - Bundle-Größen-Analyse mit 180KB JS-Limit-Durchsetzung
  - Lazy Loading-Utilities mit IntersectionObserver
  - Bildoptimierung mit AVIF/WebP-Unterstützung und responsiven Bildern
  - Code Splitting mit dynamischen Imports und Error Boundaries
  - Resource Hints Management (preconnect, prefetch, preload)
  - Performance-Test-Utilities mit Schwellenwert-Validierung

- **Sicherheits-Implementierung**
  - Content Security Policy (CSP) mit Nonce-basierten Inline-Skripten
  - XSS-Schutz mit Input-Sanitization und URL-Validierung
  - CSRF-Token-Management mit automatischer Aktualisierung
  - Sichere Speicherung mit Verschlüsselung für sensible Daten
  - Rate Limiting mit konfigurierbaren Fenstern und Limits
  - Input-Validierung für E-Mail, Telefon, URL und Passwort-Stärke
  - Security Headers Management (HSTS, X-Frame-Options, etc.)
  - Stripe-Domain-Allowlisting in CSP

- **Umfassende Tests**
  - Test-Utilities mit Mock-Helfern für APIs, localStorage und Browser-APIs
  - Unit-Tests für alle Kernfunktionen mit 80%+ Abdeckungsziel
  - Barrierefreiheits-Tests mit automatisierten WCAG-Konformitäts-Checks
  - Performance-Tests mit Core Web Vitals-Validierung
  - E2E-Test-Utilities für Formular-Interaktionen und Navigation
  - Test-Konfigurations-Management mit Umgebungs-Setup
  - Mock-Utilities für Stripe, fetch und Browser-APIs

- **Dokumentation & Architektur**
  - Aktualisierte README mit umfassender Feature-Übersicht
  - Detaillierte API-Dokumentation mit OpenAPI 3.1.0-Spezifikation
  - Sicherheitsrichtlinien und -verfahren-Dokumentation
  - Performance-Budgets und Monitoring-Richtlinien
  - Test-Strategien und Abdeckungs-Anforderungen
  - Entwicklungs-Setup und Beitrags-Richtlinien

### Geändert
- Projektstruktur aktualisiert, um Frontend-Utilities und -Implementierungen einzuschließen
- README mit detaillierten Feature-Beschreibungen und Setup-Anweisungen erweitert
- Dokumentations-Konsistenz über alle Module verbessert
- Architektur-Übersicht aktualisiert, um implementierte Features widerzuspiegeln

### Behoben
- Alle identifizierten Sicherheitslücken behoben
- Barrierefreiheits-Probleme behoben, um WCAG 2.2 AA-Standards zu erfüllen
- Performance optimiert, um Core Web Vitals-Schwellenwerte zu erreichen
- Test-Abdeckung und -Stabilität verbessert

### Sicherheit
- Umfassende Sicherheitsmaßnahmen implementiert, einschließlich CSP, XSS-Schutz und CSRF-Tokens
- Sichere Speicherung mit Verschlüsselung für sensible Daten hinzugefügt
- Rate Limiting und Input-Validierung implementiert
- Security Headers und Stripe-Domain-Allowlisting hinzugefügt

### Performance
- Core Web Vitals-Konformität erreicht (LCP ≤ 2.5s, CLS ≤ 0.1, INP ≤ 200ms)
- Bundle-Größen-Optimierung mit 180KB JS-Limit implementiert
- Lazy Loading und Bildoptimierung hinzugefügt
- Code Splitting und Resource Hints implementiert

### Barrierefreiheit
- WCAG 2.2 AA-Konformität erreicht
- Umfassende Barrierefreiheits-Utilities und -Tests hinzugefügt
- Fokus-Management und Tastaturnavigation implementiert
- Screen-Reader-Unterstützung und ARIA Live-Regionen hinzugefügt