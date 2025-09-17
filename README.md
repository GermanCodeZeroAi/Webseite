# German Code Zero AI – Premium B2B Services Plattform 🚀

Eine umfassende B2B-Services-Plattform mit Konfigurator, Checkout (Stripe), FastAPI Backend, Postgres/Redis, SEO, Barrierefreiheit, Performance-Optimierung, Sicherheit und Testing. Produktionsreife Implementierung mit Enterprise-Features.

## 🌟 Was wir bieten

Unsere Plattform ermöglicht es Unternehmen, digitale Services effizient zu konfigurieren und zu verwalten:

- **📧 Email-Services**: Professionelle E-Mail-Lösungen mit erweiterten Funktionen
- **📞 Telefonie**: Moderne VoIP-Systeme und Kommunikationslösungen  
- **🎨 Generative Medien**: KI-gestützte Erstellung von Bildern, Videos und Musik
- **🌐 Websites**: Professionelle Webauftritte mit modernem Design
- **💳 Enterprise Checkout**: Sichere Zahlungsabwicklung über Stripe
- **📊 Transparente Preisgestaltung**: Regelbasierte Logik, Empfehlungssystem und Rechnungsstellung
- **✨ Premium B2B-Erlebnis**: Elegantes Gold/Schwarz-Branding für professionelle Auftritte

## 🏗️ Architektur-Überblick

Unsere moderne, skalierbare Architektur basiert auf bewährten Technologien:

- **🎯 Frontend**: React/TypeScript mit umfassendem SEO, Barrierefreiheit (WCAG 2.2 AA) und Performance-Optimierung
- **⚡ Backend**: FastAPI mit Preislogik, Katalog, Checkout-Session-Erstellung, Stripe Webhook-Handling, Bestellungen und Empfehlungen
- **🗄️ Datenbank**: PostgreSQL (Single Source of Truth), Redis (Cache/Rate Limits/Idempotenz)
- **🔒 Sicherheit**: Content Security Policy, XSS-Schutz, CSRF-Tokens, Rate Limiting, sichere Speicherung
- **🚀 Performance**: Core Web Vitals Monitoring, Lazy Loading, Bildoptimierung, Code Splitting
- **🧪 Testing**: Umfassende Testsuites mit 80%+ Abdeckung, E2E-Tests, Barrierefreiheitstests

## ✨ Implementierte Hauptfunktionen

### 🔍 SEO & Barrierefreiheit
- **Mehrsprachige SEO-Tools**: Vollständige DE/EN-Internationalisierung
- **Strukturierte Daten**: JSON-LD für alle Seitentypen (Organization, WebSite, WebPage, Product, BreadcrumbList)
- **OpenGraph-Optimierung**: Perfekte Meta-Tags und Bildbehandlung
- **Sitemap-Generierung**: Mehrsprachige Unterstützung mit Bild-Sitemaps
- **WCAG 2.2 AA-Konformität**: Umfassendes Focus-Management
- **ARIA Live Regions**: Dynamische Inhalts-Updates für Screenreader
- **Tastaturnavigation**: Vollständige Barrierefreiheit ohne Maus

### ⚡ Performance-Optimierung
- **Core Web Vitals**: Monitoring (LCP ≤ 2.5s, CLS ≤ 0.1, INP ≤ 200ms)
- **Bundle-Analyse**: 180KB JS-Limit mit automatischer Überwachung
- **Lazy Loading**: Intelligente Ressourcen-Ladung mit IntersectionObserver
- **Bildoptimierung**: AVIF/WebP mit Fallbacks für maximale Kompatibilität
- **Code Splitting**: Dynamische Imports für optimale Ladezeiten
- **Resource Hints**: Preconnect, Prefetch, Preload-Management

### 🛡️ Sicherheit
- **Content Security Policy**: CSP mit Nonce-basierten Inline-Scripts
- **XSS-Schutz**: Eingabe-Sanitization und URL-Validierung
- **CSRF-Token-Management**: Automatische Aktualisierung und Verwaltung
- **Sichere Speicherung**: Verschlüsselung für sensible Daten
- **Rate Limiting**: Konfigurierbare Grenzen und Zeitfenster
- **Security Headers**: HSTS, X-Frame-Options und weitere Schutzmaßnahmen

### 🧪 Umfassendes Testing
- **Test-Utilities**: Mock-Helpers für APIs, localStorage und Browser-APIs
- **Unit Tests**: 80%+ Abdeckung für alle Kernfunktionen
- **Barrierefreiheitstests**: Automatisierte WCAG-Compliance-Prüfungen
- **Performance-Tests**: Core Web Vitals Validierung mit Schwellenwerten
- **E2E-Tests**: Formular-Interaktionen und Navigation
- **Test-Konfiguration**: Umgebungssetup und Mock-Utilities

## 🔧 Umgebungssetup

### Entwicklungsumgebungen
- **🏠 Lokal**: Docker Compose (API, Worker, PostgreSQL, Redis) mit Stripe Test-Modus
- **🧪 Staging**: Produktionsähnliche Umgebung mit Sandbox-Integrationen
- **🚀 Produktion**: Hochverfügbarkeit, Observability und Rate Limits

## ⚙️ Konfiguration

### Katalog-Dateien (`/config/`)
- `pricing.catalog.json` - Preismodelle und Tarife
- `modules.catalog.json` - Verfügbare Service-Module
- `industries.catalog.json` - Branchenspezifische Konfigurationen
- `feature-bundles.json` - Feature-Pakete und Add-ons

### Frontend-Utilities (`/apps/frontend/lib/`)
- `seo.ts` - SEO und Internationalisierung
- `performance.ts` - Performance-Monitoring und Optimierung
- `security.ts` - Sicherheits-Utilities und Schutzfunktionen
- `a11y.ts` - Barrierefreiheits-Utilities
- `test-utils.ts` - Test-Utilities und Helper-Funktionen

### Sicherheit
🔒 **Sensible Daten** werden über KMS/Vault verwaltet, nicht im Repository gespeichert.  
📖 Details siehe `docs/security/secrets.md`

## 🌐 API-Dokumentation

- **📋 OpenAPI-Spezifikation**: `apps/backend/openapi.yaml`
- **🔗 Umfassende Endpoint-Dokumentation**: Alle verfügbaren API-Endpunkte
- **💳 Stripe-Integration**: Zahlungen und Webhooks
- **🛡️ Rate Limiting**: Automatische Sicherheitsmaßnahmen

## 📁 Repository-Struktur

```
├── apps/
│   ├── frontend/lib/     # Frontend-Utilities und Implementierungen
│   └── backend/          # API-Spezifikationen und Backend-Code
├── docs/                 # Architektur, Ops, Sicherheit, Datenschutz
├── config/               # Konfigurations-Kataloge und Daten
└── tests/                # Test-Suites und Utilities
```

## 📝 Commit-Konventionen

Wir verwenden **Conventional Commits** für bessere Nachverfolgbarkeit:
- `feat(seo): neue Sitemap-Generierung`
- `fix(security): XSS-Schutz verbessert`
- `perf: Bundle-Größe um 20% reduziert`

## 🚀 Schnellstart

### 1. 📖 Dokumentation lesen
Beginnen Sie mit der Architektur-Dokumentation in `docs/architecture/`

### 2. 🐳 Entwicklungsumgebung einrichten
```bash
# Repository klonen
git clone https://github.com/GermanCodeZeroAi/Webseite.git
cd Webseite

# Abhängigkeiten installieren
npm install

# Docker-Umgebung starten
docker-compose up -d
```

### 3. 🔑 Stripe Test-Keys konfigurieren
Fügen Sie Ihre Stripe Test-Keys in die Umgebungsvariablen ein

### 4. 🧪 Tests ausführen
```bash
# Alle Tests
npm test

# Mit Coverage-Report
npm run test:coverage

# Spezifische Test-Kategorien
npm run test:performance
npm run test:a11y
npm run test:security
```

### 5. 🖥️ Entwicklungsserver starten
```bash
npm run dev
```

## ⚖️ Rechtliches & Datenschutz

- **📋 DPIA-Vorlage**: `docs/privacy/dpia-skeleton.md`
- **🇪🇺 GDPR-Compliance**: Umfassende Datenschutz-Überlegungen dokumentiert
- **🔒 Sicherheitsrichtlinien**: Detaillierte Verfahren und Richtlinien

## 🗺️ Roadmap

### ✅ Abgeschlossen
- SEO und Barrierefreiheits-Implementierung
- Performance-Optimierung
- Sicherheitshärtung
- Umfassende Test-Implementierung

### 🔄 In Arbeit
- Backend API-Implementierung
- Frontend UI-Komponenten
- Stripe-Integration
- CI/CD-Pipeline

### 📋 Geplant
- Erweiterte Analytics-Integration
- Multi-Tenant-Architektur
- Mobile App-Entwicklung
- KI-basierte Empfehlungssysteme

---

## 💬 Support & Community

**Haben Sie Fragen oder benötigen Unterstützung?**

- 🐛 **Issues**: [GitHub Issues](https://github.com/GermanCodeZeroAi/Webseite/issues)
- 📧 **E-Mail**: support@germancodezero.ai
- 🌐 **Website**: [germancodezero.ai](https://germancodezero.ai)

**Beiträge sind willkommen!** Lesen Sie unsere Contribution Guidelines und werden Sie Teil unserer Community.

---

*Entwickelt mit ❤️ von German Code Zero AI*