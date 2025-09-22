import Handlebars from 'handlebars';
import { DatabaseService } from './DatabaseService.js';
import { Email } from '../models/Email.js';

export class TemplateService {
  constructor(databaseService) {
    this.db = databaseService;
    this.handlebars = Handlebars.create();
    this.registerHelpers();
    this.initializeDefaultTemplates();
  }

  registerHelpers() {
    // Format currency
    this.handlebars.registerHelper('currency', (amount, currency = 'EUR') => {
      return new Intl.NumberFormat('de-DE', {
        style: 'currency',
        currency: currency
      }).format(amount);
    });

    // Format date
    this.handlebars.registerHelper('formatDate', (date, format = 'full') => {
      const dateObj = new Date(date);
      const options = {
        full: { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' },
        short: { day: '2-digit', month: '2-digit', year: 'numeric' },
        time: { hour: '2-digit', minute: '2-digit' }
      };
      return dateObj.toLocaleString('de-DE', options[format] || options.full);
    });

    // Conditional helper
    this.handlebars.registerHelper('ifEquals', function(arg1, arg2, options) {
      return (arg1 == arg2) ? options.fn(this) : options.inverse(this);
    });

    // Pluralization
    this.handlebars.registerHelper('plural', (count, singular, plural) => {
      return count === 1 ? singular : plural;
    });
  }

  async initializeDefaultTemplates() {
    const templates = [
      // Order Inquiry Templates
      {
        name: 'order_status_update',
        category: Email.categories.ORDER_INQUIRY,
        subject: 'Ihre Bestellung {{orderNumber}} - Statusupdate',
        body: `Guten Tag {{customerName}},

vielen Dank für Ihre Anfrage bezüglich Ihrer Bestellung {{orderNumber}}.

Aktueller Status: {{orderStatus}}
{{#if trackingNumber}}
Sendungsverfolgung: {{trackingNumber}}
Sie können Ihre Sendung hier verfolgen: {{trackingUrl}}
{{/if}}

{{#ifEquals orderStatus "shipped"}}
Ihre Bestellung wurde am {{formatDate shippedDate}} versendet und sollte innerhalb von 2-3 Werktagen bei Ihnen eintreffen.
{{/ifEquals}}

{{#ifEquals orderStatus "delivered"}}
Ihre Bestellung wurde am {{formatDate deliveredDate}} zugestellt.
{{/ifEquals}}

Bei weiteren Fragen stehen wir Ihnen gerne zur Verfügung.

Mit freundlichen Grüßen
Ihr {{companyName}} Team`,
        variables: JSON.stringify(['customerName', 'orderNumber', 'orderStatus', 'trackingNumber', 'trackingUrl', 'shippedDate', 'deliveredDate', 'companyName'])
      },

      // Return Request Templates
      {
        name: 'return_instructions',
        category: Email.categories.RETURN_REQUEST,
        subject: 'Ihre Rücksendung - Anleitung und Label',
        body: `Guten Tag {{customerName}},

wir haben Ihre Rücksendeanfrage für Bestellung {{orderNumber}} erhalten.

Ihre Rücksende-Nummer: {{returnNumber}}

**So funktioniert die Rücksendung:**

1. **Artikel verpacken**: Bitte verpacken Sie die Artikel sicher und legen Sie eine Kopie der Rechnung bei.

2. **Label ausdrucken**: Das Rücksende-Label finden Sie im Anhang dieser E-Mail.

3. **Paket abgeben**: Geben Sie das Paket bei einer {{shippingProvider}} Filiale ab.

**Zu retournierende Artikel:**
{{#each returnItems}}
- {{this.name}} (Menge: {{this.quantity}})
{{/each}}

**Erstattung:**
Nach Eingang und Prüfung der Ware erstatten wir Ihnen {{currency refundAmount}} auf Ihre ursprüngliche Zahlungsmethode.

Die Bearbeitung dauert in der Regel 5-7 Werktage nach Wareneingang.

Bei Fragen erreichen Sie uns unter {{supportEmail}}.

Mit freundlichen Grüßen
Ihr {{companyName}} Team`,
        variables: JSON.stringify(['customerName', 'orderNumber', 'returnNumber', 'returnItems', 'refundAmount', 'shippingProvider', 'supportEmail', 'companyName'])
      },

      // Shipping Issue Templates
      {
        name: 'shipping_delay_notification',
        category: Email.categories.SHIPPING_ISSUE,
        subject: 'Lieferverzögerung bei Ihrer Bestellung {{orderNumber}}',
        body: `Guten Tag {{customerName}},

leider müssen wir Ihnen mitteilen, dass es bei der Zustellung Ihrer Bestellung {{orderNumber}} zu einer Verzögerung gekommen ist.

**Grund der Verzögerung:** {{delayReason}}

**Neue voraussichtliche Lieferung:** {{newDeliveryDate}}

Wir entschuldigen uns für die Unannehmlichkeiten. Als kleine Entschädigung möchten wir Ihnen einen Gutschein über {{compensationAmount}} für Ihre nächste Bestellung anbieten.

Gutscheincode: {{voucherCode}}

Sie können den Lieferstatus jederzeit hier verfolgen: {{trackingUrl}}

Mit freundlichen Grüßen
Ihr {{companyName}} Team`,
        variables: JSON.stringify(['customerName', 'orderNumber', 'delayReason', 'newDeliveryDate', 'compensationAmount', 'voucherCode', 'trackingUrl', 'companyName'])
      },

      // Payment Issue Templates
      {
        name: 'payment_failed',
        category: Email.categories.PAYMENT_ISSUE,
        subject: 'Zahlungsproblem bei Ihrer Bestellung',
        body: `Guten Tag {{customerName}},

bei der Bearbeitung Ihrer Bestellung {{orderNumber}} ist ein Problem mit der Zahlung aufgetreten.

**Problem:** {{paymentIssue}}

**Was können Sie tun:**
1. Überprüfen Sie Ihre Zahlungsdaten
2. Stellen Sie sicher, dass Ihr Konto gedeckt ist
3. Versuchen Sie es mit einer alternativen Zahlungsmethode

Sie können die Zahlung hier erneut versuchen: {{paymentRetryUrl}}

Ihre Bestellung wird für 48 Stunden reserviert. Danach müssen wir sie leider stornieren.

Bei Fragen helfen wir Ihnen gerne weiter.

Mit freundlichen Grüßen
Ihr {{companyName}} Team`,
        variables: JSON.stringify(['customerName', 'orderNumber', 'paymentIssue', 'paymentRetryUrl', 'companyName'])
      },

      // Refund Templates
      {
        name: 'refund_processed',
        category: Email.categories.REFUND_REQUEST,
        subject: 'Ihre Erstattung wurde bearbeitet',
        body: `Guten Tag {{customerName}},

gute Nachrichten! Ihre Erstattung wurde erfolgreich bearbeitet.

**Details:**
- Rücksende-Nummer: {{returnNumber}}
- Erstattungsbetrag: {{currency refundAmount}}
- Zahlungsmethode: {{refundMethod}}
- Transaktions-ID: {{transactionId}}

Der Betrag wird innerhalb von {{refundDays}} Werktagen auf Ihrem Konto gutgeschrieben.

**Zusammenfassung:**
{{#each refundItems}}
- {{this.name}}: {{currency this.amount}}
{{/each}}
{{#if restockingFee}}
- Wiedereinlagerungsgebühr: -{{currency restockingFee}}
{{/if}}
**Gesamterstattung: {{currency refundAmount}}**

Vielen Dank für Ihr Verständnis.

Mit freundlichen Grüßen
Ihr {{companyName}} Team`,
        variables: JSON.stringify(['customerName', 'returnNumber', 'refundAmount', 'refundMethod', 'transactionId', 'refundDays', 'refundItems', 'restockingFee', 'companyName'])
      },

      // Complaint Templates
      {
        name: 'complaint_acknowledgment',
        category: Email.categories.COMPLAINT,
        subject: 'Wir haben Ihre Beschwerde erhalten',
        body: `Guten Tag {{customerName}},

vielen Dank, dass Sie sich die Zeit genommen haben, uns Ihr Feedback mitzuteilen. Es tut uns sehr leid, dass Sie mit {{complaintSubject}} unzufrieden sind.

**Ihre Beschwerde-Nummer:** {{complaintNumber}}

Wir nehmen Ihr Anliegen sehr ernst und werden es umgehend bearbeiten. Ein Mitglied unseres Kundenservice-Teams wird sich innerhalb von {{responseTime}} Stunden bei Ihnen melden.

{{#if isVipCustomer}}
Als geschätzter VIP-Kunde haben Sie Priorität bei der Bearbeitung.
{{/if}}

Was wir tun werden:
1. Ihren Fall gründlich untersuchen
2. Die Ursache des Problems identifizieren
3. Eine angemessene Lösung finden
4. Maßnahmen ergreifen, um ähnliche Probleme zu vermeiden

Wir schätzen Ihre Geduld und Ihr Vertrauen in {{companyName}}.

Mit freundlichen Grüßen
{{agentName}}
Kundenservice-Team
{{companyName}}`,
        variables: JSON.stringify(['customerName', 'complaintSubject', 'complaintNumber', 'responseTime', 'isVipCustomer', 'agentName', 'companyName'])
      },

      // Product Question Templates
      {
        name: 'product_information',
        category: Email.categories.PRODUCT_QUESTION,
        subject: 'Ihre Produktanfrage - {{productName}}',
        body: `Guten Tag {{customerName}},

vielen Dank für Ihr Interesse an {{productName}}.

{{#if productAvailable}}
✅ **Verfügbarkeit:** Auf Lager
Lieferzeit: {{deliveryTime}}

**Produktdetails:**
{{productDescription}}

**Technische Daten:**
{{#each specifications}}
- {{@key}}: {{this}}
{{/each}}

{{#if sizesAvailable}}
**Verfügbare Größen:** {{sizesAvailable}}
{{/if}}

{{#if colorsAvailable}}
**Verfügbare Farben:** {{colorsAvailable}}
{{/if}}

**Preis:** {{currency productPrice}}

Sie können das Produkt hier bestellen: {{productUrl}}
{{else}}
❌ **Verfügbarkeit:** Derzeit nicht verfügbar

Möchten Sie benachrichtigt werden, wenn das Produkt wieder verfügbar ist? 
Klicken Sie hier: {{notificationUrl}}

**Alternative Produkte:**
{{#each alternatives}}
- {{this.name}} - {{currency this.price}} - {{this.url}}
{{/each}}
{{/if}}

Haben Sie weitere Fragen? Wir helfen Ihnen gerne!

Mit freundlichen Grüßen
Ihr {{companyName}} Team`,
        variables: JSON.stringify(['customerName', 'productName', 'productAvailable', 'deliveryTime', 'productDescription', 'specifications', 'sizesAvailable', 'colorsAvailable', 'productPrice', 'productUrl', 'notificationUrl', 'alternatives', 'companyName'])
      },

      // Cancellation Templates
      {
        name: 'order_cancelled',
        category: Email.categories.CANCELLATION,
        subject: 'Ihre Bestellung {{orderNumber}} wurde storniert',
        body: `Guten Tag {{customerName}},

Ihre Bestellung {{orderNumber}} wurde erfolgreich storniert.

**Stornierte Artikel:**
{{#each cancelledItems}}
- {{this.name}} (Menge: {{this.quantity}}) - {{currency this.price}}
{{/each}}

**Gesamtbetrag:** {{currency totalAmount}}

{{#if paymentRefunded}}
Die Rückerstattung von {{currency refundAmount}} wird innerhalb von {{refundDays}} Werktagen auf Ihre {{paymentMethod}} erfolgen.
{{else}}
Da die Zahlung noch nicht verarbeitet wurde, wird keine Belastung Ihres Kontos erfolgen.
{{/if}}

{{#if partialCancellation}}
**Hinweis:** Dies war eine Teilstornierung. Die verbleibenden Artikel Ihrer Bestellung werden wie geplant geliefert.
{{/if}}

Möchten Sie etwas anderes bestellen? Hier ist ein Gutschein über {{voucherAmount}} für Ihre nächste Bestellung:
**Gutscheincode:** {{voucherCode}}

Mit freundlichen Grüßen
Ihr {{companyName}} Team`,
        variables: JSON.stringify(['customerName', 'orderNumber', 'cancelledItems', 'totalAmount', 'paymentRefunded', 'refundAmount', 'refundDays', 'paymentMethod', 'partialCancellation', 'voucherAmount', 'voucherCode', 'companyName'])
      },

      // General Templates
      {
        name: 'auto_reply',
        category: Email.categories.GENERAL_INQUIRY,
        subject: 'Wir haben Ihre Nachricht erhalten',
        body: `Guten Tag {{customerName}},

vielen Dank für Ihre Nachricht. Wir haben Ihre Anfrage erhalten und werden sie schnellstmöglich bearbeiten.

**Ihre Ticket-Nummer:** {{ticketNumber}}

**Erwartete Antwortzeit:**
{{#ifEquals priority "urgent"}}
🔴 Dringend: Innerhalb von 2 Stunden
{{/ifEquals}}
{{#ifEquals priority "high"}}
🟡 Hoch: Innerhalb von 4 Stunden
{{/ifEquals}}
{{#ifEquals priority "normal"}}
🟢 Normal: Innerhalb von 24 Stunden
{{/ifEquals}}

**Öffnungszeiten:**
Montag - Freitag: 8:00 - 20:00 Uhr
Samstag: 9:00 - 18:00 Uhr
Sonntag: 10:00 - 16:00 Uhr

In der Zwischenzeit finden Sie möglicherweise eine Antwort in unserem FAQ-Bereich: {{faqUrl}}

Mit freundlichen Grüßen
Ihr {{companyName}} Team`,
        variables: JSON.stringify(['customerName', 'ticketNumber', 'priority', 'faqUrl', 'companyName'])
      },

      // Feedback Templates
      {
        name: 'feedback_thank_you',
        category: Email.categories.FEEDBACK,
        subject: 'Danke für Ihr Feedback!',
        body: `Guten Tag {{customerName}},

herzlichen Dank für Ihr {{feedbackType}} Feedback!

{{#ifEquals sentiment "positive"}}
Es freut uns sehr zu hören, dass Sie mit {{feedbackSubject}} zufrieden sind. Ihr Lob motiviert unser Team, weiterhin exzellenten Service zu bieten.

Dürfen wir Ihr Feedback als Kundenbewertung auf unserer Website verwenden?
[Ja, gerne] {{approvalUrl}}
{{/ifEquals}}

{{#ifEquals sentiment "negative"}}
Es tut uns leid zu hören, dass Sie mit {{feedbackSubject}} nicht zufrieden waren. Ihr Feedback ist für uns sehr wertvoll und hilft uns, unseren Service zu verbessern.

Wir werden Ihre Anmerkungen an die zuständige Abteilung weiterleiten und Maßnahmen ergreifen.
{{/ifEquals}}

Als Dankeschön für Ihre Zeit möchten wir Ihnen einen Gutschein über {{voucherAmount}} schenken:
**Gutscheincode:** {{voucherCode}}
Gültig bis: {{voucherExpiry}}

Beste Grüße
Ihr {{companyName}} Team`,
        variables: JSON.stringify(['customerName', 'feedbackType', 'sentiment', 'feedbackSubject', 'approvalUrl', 'voucherAmount', 'voucherCode', 'voucherExpiry', 'companyName'])
      }
    ];

    // Save templates to database
    for (const template of templates) {
      await this.db.createEmailTemplate({
        ...template,
        language: 'de',
        active: true
      });
    }
  }

  async getTemplate(category, language = 'de') {
    return await this.db.getTemplateByCategory(category, language);
  }

  async renderTemplate(templateName, data) {
    const template = await this.db.db.prepare(
      'SELECT * FROM email_templates WHERE name = ? AND active = 1'
    ).get(templateName);

    if (!template) {
      throw new Error(`Template ${templateName} not found`);
    }

    const compiledSubject = this.handlebars.compile(template.subject);
    const compiledBody = this.handlebars.compile(template.body);

    return {
      subject: compiledSubject(data),
      body: compiledBody(data),
      html: this.convertToHtml(compiledBody(data))
    };
  }

  convertToHtml(text) {
    // Convert markdown-style formatting to HTML
    let html = text
      .replace(/\n/g, '<br>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/^- (.+)$/gm, '<li>$1</li>')
      .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
      .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>');

    // Wrap in basic HTML template
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    strong { color: #2c3e50; }
    a { color: #3498db; text-decoration: none; }
    ul { padding-left: 20px; }
    .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 0.9em; color: #666; }
  </style>
</head>
<body>
  ${html}
  <div class="footer">
    <p>Diese E-Mail wurde automatisch generiert. Bitte antworten Sie nicht direkt auf diese E-Mail.</p>
  </div>
</body>
</html>`;
  }

  async createCustomTemplate(templateData) {
    return await this.db.createEmailTemplate(templateData);
  }

  async updateTemplate(templateId, updates) {
    const stmt = this.db.db.prepare(`
      UPDATE email_templates 
      SET ${Object.keys(updates).map(k => `${k} = ?`).join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    stmt.run(...Object.values(updates), templateId);
  }

  async deleteTemplate(templateId) {
    const stmt = this.db.db.prepare('UPDATE email_templates SET active = 0 WHERE id = ?');
    stmt.run(templateId);
  }

  async getTemplateVariables(templateName) {
    const template = await this.db.db.prepare(
      'SELECT variables FROM email_templates WHERE name = ?'
    ).get(templateName);
    
    return template ? JSON.parse(template.variables) : [];
  }

  async suggestTemplate(emailClassification, context = {}) {
    const category = emailClassification.category;
    const templates = await this.db.db.prepare(
      'SELECT * FROM email_templates WHERE category = ? AND active = 1'
    ).all(category);

    if (templates.length === 0) {
      return null;
    }

    // Score templates based on context matching
    const scoredTemplates = templates.map(template => {
      let score = 0;
      const variables = JSON.parse(template.variables);
      
      // Check how many required variables we have
      const availableVars = Object.keys(context);
      const matchingVars = variables.filter(v => availableVars.includes(v));
      score = matchingVars.length / variables.length;

      return { template, score };
    });

    // Return the best matching template
    scoredTemplates.sort((a, b) => b.score - a.score);
    return scoredTemplates[0].template;
  }

  async generateResponse(emailClassification, customerData, orderData = null) {
    const template = await this.suggestTemplate(emailClassification);
    if (!template) {
      return null;
    }

    // Prepare data for template
    const templateData = {
      customerName: customerData.name || 'Kunde',
      companyName: process.env.COMPANY_NAME || 'E-Commerce Store',
      supportEmail: process.env.SUPPORT_EMAIL,
      ...this.extractDataFromClassification(emailClassification),
      ...orderData
    };

    return await this.renderTemplate(template.name, templateData);
  }

  extractDataFromClassification(classification) {
    const data = {};
    
    if (classification.extractedData) {
      Object.assign(data, classification.extractedData);
    }

    // Add classification-specific data
    data.priority = classification.priority;
    data.sentiment = classification.sentiment;
    
    return data;
  }

  async getAllTemplates() {
    return await this.db.getAllTemplates();
  }

  async getTemplatesByCategory(category) {
    return await this.db.db.prepare(
      'SELECT * FROM email_templates WHERE category = ? AND active = 1'
    ).all(category);
  }

  async testTemplate(templateName, sampleData = {}) {
    const defaultData = {
      customerName: 'Max Mustermann',
      orderNumber: 'ORD-2024-12345',
      companyName: 'Test Store',
      supportEmail: 'support@test.com',
      productName: 'Test Produkt',
      refundAmount: 49.99,
      trackingNumber: 'DHL123456789',
      returnNumber: 'RET-2024-001'
    };

    const testData = { ...defaultData, ...sampleData };
    return await this.renderTemplate(templateName, testData);
  }
}