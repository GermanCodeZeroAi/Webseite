# E-Commerce Email Agent 📧

Ein umfassender KI-gestützter Email-Agent für E-Commerce, der automatisch Kundenanfragen bearbeitet, Retouren verwaltet und den kompletten Kundensupport übernimmt.

## 🚀 Features

### Email-Verarbeitung
- **Automatische Email-Klassifizierung** mit Machine Learning
- **Intelligente Priorisierung** basierend auf Dringlichkeit und Sentiment
- **Multi-Sprachen-Unterstützung** (Deutsch/Englisch)
- **IMAP/SMTP Integration** für alle gängigen Email-Provider

### E-Commerce Spezifisch
- **Bestellstatus-Abfragen** automatisch beantworten
- **Retouren-Management** mit automatischer Label-Generierung
- **Versandverfolgung** und Statusupdates
- **Produktanfragen** mit KI-gestützten Antworten
- **Beschwerdemanagement** mit Eskalationssystem

### Kunden-Management
- **Automatische Kundenerkennung** und Profilerstellung
- **Loyalty-Tier System** (Standard, Silver, Gold, Platinum, VIP)
- **Kaufhistorie und Lifetime Value** Tracking
- **Risiko-Scoring** für Problemkunden
- **DSGVO-konform** mit Datenexport und -löschung

### Analytics & Reporting
- **Real-time Dashboard** mit wichtigen KPIs
- **Automatisierungsrate** und Response-Zeit Tracking
- **Retouren-Analytics** mit Gründen und Trends
- **Kunden-Sentiment** Analyse

## 🛠️ Installation

### Voraussetzungen
- Node.js 16+ 
- NPM oder Yarn
- Email-Account mit IMAP/SMTP Zugang
- OpenAI API Key (optional, für erweiterte KI-Features)

### Setup

1. **Repository klonen**
```bash
git clone https://github.com/your-repo/ecommerce-agent.git
cd ecommerce-agent
```

2. **Dependencies installieren**
```bash
npm install
```

3. **Environment Variables konfigurieren**
```bash
cp .env.example .env
```

Bearbeiten Sie die `.env` Datei mit Ihren Zugangsdaten:

```env
# Email Configuration
EMAIL_HOST=imap.gmail.com
EMAIL_PORT=993
EMAIL_SECURE=true
EMAIL_USER=ihr-email@example.com
EMAIL_PASSWORD=ihr-app-passwort

# SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false

# OpenAI Configuration (optional)
OPENAI_API_KEY=sk-...

# Business Configuration
COMPANY_NAME=Ihr Shop Name
SUPPORT_EMAIL=support@ihrshop.com
RETURN_POLICY_DAYS=30

# Server
PORT=3000
AUTO_START_AGENT=true
CHECK_INTERVAL=60000
```

4. **Agent starten**
```bash
npm start
```

Das Dashboard ist dann verfügbar unter: `http://localhost:3000`

## 📋 Verwendung

### Dashboard
- Öffnen Sie `http://localhost:3000` im Browser
- Der Agent kann über den Start/Stop Button gesteuert werden
- Emails werden automatisch alle 60 Sekunden abgerufen und verarbeitet

### API Endpoints

#### Email Management
- `GET /api/emails` - Alle Emails abrufen
- `GET /api/emails/:id` - Einzelne Email abrufen
- `PUT /api/emails/:id/status` - Email-Status ändern
- `POST /api/emails/:id/reply` - Auf Email antworten

#### Kunden
- `GET /api/customers` - Alle Kunden
- `GET /api/customers/:id` - Kundendetails
- `GET /api/customers/high-value` - VIP Kunden
- `GET /api/customers/at-risk` - Risiko-Kunden

#### Retouren
- `POST /api/returns` - Neue Retoure anlegen
- `GET /api/returns` - Alle aktiven Retouren
- `POST /api/returns/:id/process` - Retoure bearbeiten

#### Analytics
- `GET /api/analytics/overview` - Gesamt-Statistiken
- `GET /api/analytics/emails` - Email-Statistiken
- `GET /api/analytics/returns` - Retouren-Statistiken

### Webhook Integration

#### Shopify
```javascript
POST /api/webhooks/shopify
{
  "topic": "orders/create",
  "data": { ... }
}
```

#### WooCommerce
```javascript
POST /api/webhooks/woocommerce
{
  "event": "order.created",
  "data": { ... }
}
```

## 🎯 Email-Kategorien

Der Agent erkennt automatisch folgende Email-Typen:

1. **Bestellanfragen** - Status, Tracking, Lieferzeit
2. **Retouren** - Rücksendungen, Umtausch
3. **Versandprobleme** - Verzögerungen, falsche Adresse
4. **Produktfragen** - Verfügbarkeit, Spezifikationen
5. **Beschwerden** - Qualität, Service
6. **Zahlungsprobleme** - Fehlgeschlagene Transaktionen
7. **Erstattungen** - Rückzahlungen
8. **Stornierungen** - Bestellungen abbrechen
9. **Technischer Support** - Website, App Probleme
10. **Feedback** - Bewertungen, Vorschläge

## 🔧 Konfiguration

### Email Templates
Templates können über das Dashboard oder die API angepasst werden. Alle Templates unterstützen Handlebars-Syntax für dynamische Inhalte.

### Automatisierungsregeln
- Emails mit Priorität "urgent" werden sofort bearbeitet
- VIP-Kunden erhalten priorisierten Support
- Beschwerden werden automatisch eskaliert

### Retouren-Einstellungen
- Standard Rückgabefrist: 30 Tage (konfigurierbar)
- Automatische Label-Generierung
- Restocking-Gebühren für bestimmte Kategorien

## 🔒 Sicherheit

- Alle Passwörter werden verschlüsselt gespeichert
- DSGVO-konforme Datenverarbeitung
- Audit-Log für alle Aktionen
- Rate-Limiting für API-Zugriffe

## 🤝 Contributing

Contributions sind willkommen! Bitte erstellen Sie einen Pull Request mit einer detaillierten Beschreibung Ihrer Änderungen.

## 📄 Lizenz

MIT License - siehe LICENSE Datei für Details

## 🆘 Support

Bei Fragen oder Problemen:
- Erstellen Sie ein Issue auf GitHub
- Kontaktieren Sie support@example.com
- Dokumentation: https://docs.example.com

---

Made with ❤️ for E-Commerce Teams