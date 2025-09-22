import { EmailService } from './EmailService.js';
import { EmailClassifier } from './EmailClassifier.js';
import { DatabaseService } from './DatabaseService.js';
import { CustomerService } from './CustomerService.js';
import { ReturnService } from './ReturnService.js';
import { TemplateService } from './TemplateService.js';
import { Email } from '../models/Email.js';
import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

export class EmailAgent {
  constructor() {
    this.db = new DatabaseService(process.env.DATABASE_PATH);
    this.emailService = new EmailService({
      emailUser: process.env.EMAIL_USER,
      emailPassword: process.env.EMAIL_PASSWORD,
      emailHost: process.env.EMAIL_HOST,
      emailPort: process.env.EMAIL_PORT,
      emailSecure: process.env.EMAIL_SECURE === 'true',
      smtpHost: process.env.SMTP_HOST,
      smtpPort: process.env.SMTP_PORT,
      smtpSecure: process.env.SMTP_SECURE === 'true'
    });
    
    this.classifier = new EmailClassifier();
    this.customerService = new CustomerService(this.db);
    this.returnService = new ReturnService(this.db, this.emailService);
    this.templateService = new TemplateService(this.db);
    
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    
    this.isRunning = false;
    this.processingInterval = null;
  }

  async initialize() {
    console.log('🚀 Initialisiere E-Commerce Email Agent...');
    
    try {
      // Initialize database
      console.log('📊 Datenbank wird initialisiert...');
      await this.templateService.initializeDefaultTemplates();
      
      // Connect to email
      console.log('📧 Verbinde mit Email-Server...');
      await this.emailService.connect();
      
      console.log('✅ Email Agent erfolgreich initialisiert!');
      return true;
    } catch (error) {
      console.error('❌ Fehler bei der Initialisierung:', error);
      return false;
    }
  }

  async start(checkInterval = 60000) {
    if (this.isRunning) {
      console.log('⚠️ Email Agent läuft bereits');
      return;
    }

    this.isRunning = true;
    console.log('🏃 Email Agent gestartet - Prüfe alle', checkInterval / 1000, 'Sekunden auf neue Emails');

    // Initial check
    await this.processNewEmails();

    // Set up periodic checking
    this.processingInterval = setInterval(async () => {
      await this.processNewEmails();
    }, checkInterval);

    // Listen for real-time updates if supported
    this.emailService.on('new-emails', async (emails) => {
      console.log(`📬 ${emails.length} neue Email(s) empfangen`);
      await this.processEmails(emails);
    });
  }

  async stop() {
    if (!this.isRunning) {
      console.log('⚠️ Email Agent läuft nicht');
      return;
    }

    this.isRunning = false;
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }

    await this.emailService.disconnect();
    console.log('🛑 Email Agent gestoppt');
  }

  async processNewEmails() {
    try {
      console.log('🔍 Prüfe auf neue Emails...');
      const unreadEmails = await this.emailService.fetchUnreadEmails();
      
      if (unreadEmails.length > 0) {
        console.log(`📧 ${unreadEmails.length} ungelesene Email(s) gefunden`);
        await this.processEmails(unreadEmails);
      }
    } catch (error) {
      console.error('❌ Fehler beim Abrufen neuer Emails:', error);
    }
  }

  async processEmails(emails) {
    for (const email of emails) {
      try {
        await this.processEmail(email);
      } catch (error) {
        console.error(`❌ Fehler bei der Verarbeitung von Email ${email.messageId}:`, error);
      }
    }
  }

  async processEmail(emailData) {
    console.log(`\n📧 Verarbeite Email: ${emailData.subject}`);
    
    // 1. Create/Update Customer
    const customer = await this.customerService.createOrUpdateCustomer(emailData);
    console.log(`👤 Kunde: ${customer.name} (${customer.email})`);

    // 2. Classify Email
    const classification = await this.classifier.classifyEmail({
      subject: emailData.subject,
      body: emailData.text || emailData.html
    });
    console.log(`🏷️ Kategorie: ${classification.category} (Konfidenz: ${classification.confidence.toFixed(2)})`);
    console.log(`🎯 Priorität: ${classification.priority}`);
    console.log(`😊 Stimmung: ${classification.sentiment}`);

    // 3. Save Email to Database
    const emailId = await this.db.saveEmail({
      message_id: emailData.messageId,
      from_email: customer.email,
      to_email: process.env.EMAIL_USER,
      subject: emailData.subject,
      body: emailData.text,
      html: emailData.html,
      category: classification.category,
      priority: classification.priority,
      status: Email.statuses.READ,
      customer_id: customer.id,
      sentiment: classification.sentiment,
      date: emailData.date
    });

    // 4. Add tags
    for (const tag of classification.tags) {
      await this.db.addEmailTag(emailId, tag);
    }

    // 5. Extract relevant data
    let orderData = null;
    if (classification.extractedData.orderNumber) {
      orderData = await this.db.getOrderByNumber(classification.extractedData.orderNumber);
      if (orderData) {
        await this.db.updateEmail(emailId, { order_id: orderData.id });
      }
    }

    // 6. Determine action based on category
    const response = await this.handleEmailByCategory(
      classification,
      customer,
      orderData,
      emailData
    );

    // 7. Send response if generated
    if (response && response.shouldSend) {
      await this.sendResponse(emailData, response, emailId);
      await this.db.updateEmailStatus(emailId, Email.statuses.RESPONDED);
    } else if (response && response.escalate) {
      await this.escalateEmail(emailId, response.escalateReason);
      await this.db.updateEmailStatus(emailId, Email.statuses.ESCALATED);
    }

    // 8. Mark original email as read
    if (emailData.uid) {
      await this.emailService.markAsRead(emailData.uid);
    }

    console.log(`✅ Email verarbeitet: ${emailData.subject}`);
  }

  async handleEmailByCategory(classification, customer, orderData, emailData) {
    const category = classification.category;
    const extractedData = classification.extractedData;
    
    switch (category) {
      case Email.categories.ORDER_INQUIRY:
        return await this.handleOrderInquiry(customer, orderData, extractedData);
        
      case Email.categories.RETURN_REQUEST:
        return await this.handleReturnRequest(customer, orderData, emailData);
        
      case Email.categories.SHIPPING_ISSUE:
        return await this.handleShippingIssue(customer, orderData, extractedData);
        
      case Email.categories.COMPLAINT:
        return await this.handleComplaint(customer, emailData, classification);
        
      case Email.categories.REFUND_REQUEST:
        return await this.handleRefundRequest(customer, orderData, extractedData);
        
      case Email.categories.PRODUCT_QUESTION:
        return await this.handleProductQuestion(customer, emailData, extractedData);
        
      case Email.categories.CANCELLATION:
        return await this.handleCancellation(customer, orderData);
        
      case Email.categories.TECHNICAL_SUPPORT:
        return await this.handleTechnicalSupport(customer, emailData);
        
      case Email.categories.FEEDBACK:
        return await this.handleFeedback(customer, emailData, classification);
        
      default:
        return await this.handleGeneralInquiry(customer, emailData);
    }
  }

  async handleOrderInquiry(customer, orderData, extractedData) {
    if (!orderData && extractedData.orderNumber) {
      // Order not found
      return {
        shouldSend: true,
        subject: `Bestellnummer ${extractedData.orderNumber} nicht gefunden`,
        body: `Leider konnten wir keine Bestellung mit der Nummer ${extractedData.orderNumber} finden. Bitte überprüfen Sie die Bestellnummer.`,
        template: 'order_not_found'
      };
    }

    if (orderData) {
      const templateData = {
        customerName: customer.name,
        orderNumber: orderData.order_number,
        orderStatus: this.translateOrderStatus(orderData.status),
        trackingNumber: orderData.tracking_number,
        trackingUrl: this.generateTrackingUrl(orderData.tracking_number, orderData.shipping_method),
        shippedDate: orderData.shipped_at,
        deliveredDate: orderData.delivered_at,
        companyName: process.env.COMPANY_NAME
      };

      const response = await this.templateService.renderTemplate('order_status_update', templateData);
      return {
        shouldSend: true,
        ...response
      };
    }

    return {
      escalate: true,
      escalateReason: 'Bestelldaten konnten nicht automatisch abgerufen werden'
    };
  }

  async handleReturnRequest(customer, orderData, emailData) {
    if (!orderData) {
      return {
        shouldSend: true,
        subject: 'Bestellinformationen für Rücksendung benötigt',
        body: 'Bitte geben Sie Ihre Bestellnummer an, damit wir Ihre Rücksendung bearbeiten können.'
      };
    }

    try {
      // Check return eligibility
      const eligibility = await this.returnService.checkReturnEligibility(orderData);
      
      if (!eligibility.eligible) {
        return {
          shouldSend: true,
          subject: 'Rücksendung nicht möglich',
          body: `Leider ist eine Rücksendung für diese Bestellung nicht möglich. Grund: ${eligibility.reason}`
        };
      }

      // Extract return details from email using AI
      const returnDetails = await this.extractReturnDetails(emailData.text || emailData.html);
      
      // Create return
      const returnResult = await this.returnService.createReturn(orderData, returnDetails);
      
      // Generate response
      const templateData = {
        customerName: customer.name,
        orderNumber: orderData.order_number,
        returnNumber: returnResult.returnNumber,
        returnItems: returnDetails.items || [],
        refundAmount: returnDetails.estimatedRefund,
        shippingProvider: 'DHL',
        supportEmail: process.env.SUPPORT_EMAIL,
        companyName: process.env.COMPANY_NAME
      };

      const response = await this.templateService.renderTemplate('return_instructions', templateData);
      
      // Attach return label if available
      if (returnResult.labelPath) {
        response.attachments = [{
          filename: `return-label-${returnResult.returnNumber}.pdf`,
          path: returnResult.labelPath
        }];
      }

      return {
        shouldSend: true,
        ...response
      };
    } catch (error) {
      console.error('Fehler bei Retouren-Verarbeitung:', error);
      return {
        escalate: true,
        escalateReason: `Fehler bei automatischer Retouren-Verarbeitung: ${error.message}`
      };
    }
  }

  async handleShippingIssue(customer, orderData, extractedData) {
    if (!orderData) {
      return {
        shouldSend: true,
        subject: 'Bestellinformationen benötigt',
        body: 'Bitte geben Sie Ihre Bestellnummer an, damit wir das Versandproblem untersuchen können.'
      };
    }

    // Check shipping status with carrier
    const shippingStatus = await this.checkShippingStatus(orderData);
    
    const templateData = {
      customerName: customer.name,
      orderNumber: orderData.order_number,
      delayReason: shippingStatus.issue || 'Verzögerung beim Versanddienstleister',
      newDeliveryDate: shippingStatus.estimatedDelivery || 'wird ermittelt',
      compensationAmount: '5€',
      voucherCode: this.generateVoucherCode(),
      trackingUrl: this.generateTrackingUrl(orderData.tracking_number, orderData.shipping_method),
      companyName: process.env.COMPANY_NAME
    };

    const response = await this.templateService.renderTemplate('shipping_delay_notification', templateData);
    
    return {
      shouldSend: true,
      ...response
    };
  }

  async handleComplaint(customer, emailData, classification) {
    // High priority complaints should be escalated
    if (classification.priority === Email.priorities.URGENT || 
        classification.sentiment === 'negative') {
      
      const complaintNumber = this.generateComplaintNumber();
      
      // Save complaint details
      await this.db.createComplaint({
        customer_id: customer.id,
        complaint_number: complaintNumber,
        subject: emailData.subject,
        description: emailData.text,
        priority: classification.priority,
        category: classification.category
      });

      const templateData = {
        customerName: customer.name,
        complaintSubject: this.extractComplaintSubject(emailData),
        complaintNumber: complaintNumber,
        responseTime: classification.priority === Email.priorities.URGENT ? '2' : '24',
        isVipCustomer: customer.loyalty_tier === 'vip' || customer.loyalty_tier === 'platinum',
        agentName: 'Sarah Schmidt',
        companyName: process.env.COMPANY_NAME
      };

      const response = await this.templateService.renderTemplate('complaint_acknowledgment', templateData);
      
      return {
        shouldSend: true,
        escalate: true,
        escalateReason: 'Kundenbeschwerde - manuelle Überprüfung erforderlich',
        ...response
      };
    }

    return {
      escalate: true,
      escalateReason: 'Beschwerde erfordert persönliche Bearbeitung'
    };
  }

  async handleRefundRequest(customer, orderData, extractedData) {
    if (!orderData) {
      return {
        shouldSend: true,
        subject: 'Bestellinformationen für Erstattung benötigt',
        body: 'Bitte geben Sie Ihre Bestellnummer an, damit wir Ihre Erstattung bearbeiten können.'
      };
    }

    // Check if there's an existing return
    const existingReturn = await this.db.getReturnByOrderId(orderData.id);
    
    if (!existingReturn) {
      return {
        shouldSend: true,
        subject: 'Rücksendung erforderlich für Erstattung',
        body: 'Für eine Erstattung muss zuerst eine Rücksendung eingeleitet werden. Bitte senden Sie uns die Artikel zurück.'
      };
    }

    if (existingReturn.status === 'refunded') {
      return {
        shouldSend: true,
        subject: 'Erstattung bereits erfolgt',
        body: `Ihre Erstattung wurde bereits am ${new Date(existingReturn.processed_at).toLocaleDateString('de-DE')} bearbeitet.`
      };
    }

    return {
      escalate: true,
      escalateReason: 'Erstattungsanfrage muss manuell geprüft werden'
    };
  }

  async handleProductQuestion(customer, emailData, extractedData) {
    // Use AI to understand the product question
    const productInfo = await this.getProductInformation(emailData.text || emailData.html);
    
    if (productInfo && productInfo.found) {
      const templateData = {
        customerName: customer.name,
        productName: productInfo.name,
        productAvailable: productInfo.available,
        deliveryTime: '2-3 Werktage',
        productDescription: productInfo.description,
        specifications: productInfo.specifications,
        sizesAvailable: productInfo.sizes?.join(', '),
        colorsAvailable: productInfo.colors?.join(', '),
        productPrice: productInfo.price,
        productUrl: productInfo.url,
        notificationUrl: `${process.env.COMPANY_URL}/notify/${productInfo.id}`,
        alternatives: productInfo.alternatives || [],
        companyName: process.env.COMPANY_NAME
      };

      const response = await this.templateService.renderTemplate('product_information', templateData);
      
      return {
        shouldSend: true,
        ...response
      };
    }

    return {
      escalate: true,
      escalateReason: 'Produktinformationen konnten nicht automatisch ermittelt werden'
    };
  }

  async handleCancellation(customer, orderData) {
    if (!orderData) {
      return {
        shouldSend: true,
        subject: 'Bestellnummer für Stornierung benötigt',
        body: 'Bitte geben Sie die Bestellnummer an, die Sie stornieren möchten.'
      };
    }

    // Check if order can be cancelled
    if (!['pending', 'confirmed', 'processing'].includes(orderData.status)) {
      return {
        shouldSend: true,
        subject: 'Stornierung nicht mehr möglich',
        body: `Ihre Bestellung ${orderData.order_number} kann leider nicht mehr storniert werden, da sie bereits ${this.translateOrderStatus(orderData.status)} ist.`
      };
    }

    // Process cancellation
    await this.db.updateOrderStatus(orderData.id, 'cancelled');
    
    const templateData = {
      customerName: customer.name,
      orderNumber: orderData.order_number,
      cancelledItems: orderData.items,
      totalAmount: orderData.total_amount,
      paymentRefunded: orderData.payment_status === 'paid',
      refundAmount: orderData.total_amount,
      refundDays: '3-5',
      paymentMethod: orderData.payment_method,
      partialCancellation: false,
      voucherAmount: '10€',
      voucherCode: this.generateVoucherCode(),
      companyName: process.env.COMPANY_NAME
    };

    const response = await this.templateService.renderTemplate('order_cancelled', templateData);
    
    return {
      shouldSend: true,
      ...response
    };
  }

  async handleTechnicalSupport(customer, emailData) {
    // Extract technical issue details
    const issueDetails = await this.extractTechnicalIssue(emailData.text || emailData.html);
    
    if (issueDetails.commonIssue) {
      return {
        shouldSend: true,
        subject: 'Lösung für Ihr technisches Problem',
        body: issueDetails.solution,
        attachments: issueDetails.helpGuides
      };
    }

    return {
      escalate: true,
      escalateReason: 'Technisches Problem erfordert IT-Support'
    };
  }

  async handleFeedback(customer, emailData, classification) {
    const feedbackType = classification.sentiment === 'positive' ? 'positives' : 
                        classification.sentiment === 'negative' ? 'negatives' : 'neutrales';
    
    const templateData = {
      customerName: customer.name,
      feedbackType: feedbackType,
      sentiment: classification.sentiment,
      feedbackSubject: this.extractFeedbackSubject(emailData),
      approvalUrl: `${process.env.COMPANY_URL}/feedback/approve/${emailData.messageId}`,
      voucherAmount: '5€',
      voucherCode: this.generateVoucherCode(),
      voucherExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('de-DE'),
      companyName: process.env.COMPANY_NAME
    };

    const response = await this.templateService.renderTemplate('feedback_thank_you', templateData);
    
    // Update customer satisfaction score
    await this.updateCustomerSatisfaction(customer.id, classification.sentiment);
    
    return {
      shouldSend: true,
      ...response
    };
  }

  async handleGeneralInquiry(customer, emailData) {
    const ticketNumber = this.generateTicketNumber();
    
    const templateData = {
      customerName: customer.name,
      ticketNumber: ticketNumber,
      priority: 'normal',
      faqUrl: `${process.env.COMPANY_URL}/faq`,
      companyName: process.env.COMPANY_NAME
    };

    const response = await this.templateService.renderTemplate('auto_reply', templateData);
    
    return {
      shouldSend: true,
      escalate: true,
      escalateReason: 'Allgemeine Anfrage zur manuellen Bearbeitung',
      ...response
    };
  }

  async sendResponse(originalEmail, response, emailId) {
    try {
      const sentInfo = await this.emailService.sendReply(
        originalEmail,
        response.body,
        response.html || response.body
      );

      // Save response in database
      await this.db.db.prepare(`
        INSERT INTO email_responses (original_email_id, response_text, sent_at, template_used)
        VALUES (?, ?, CURRENT_TIMESTAMP, ?)
      `).run(emailId, response.body, response.template || 'custom');

      console.log(`📤 Antwort gesendet: ${response.subject}`);
    } catch (error) {
      console.error('❌ Fehler beim Senden der Antwort:', error);
      throw error;
    }
  }

  async escalateEmail(emailId, reason) {
    console.log(`⚠️ Email eskaliert: ${reason}`);
    
    // Create escalation record
    await this.db.db.prepare(`
      INSERT INTO escalations (email_id, reason, created_at)
      VALUES (?, ?, CURRENT_TIMESTAMP)
    `).run(emailId, reason);

    // Send notification to support team
    await this.notifySupportTeam(emailId, reason);
  }

  async notifySupportTeam(emailId, reason) {
    const email = await this.db.getEmailById(emailId);
    const customer = await this.db.getCustomerById(email.customer_id);
    
    const notificationBody = `
Eskalierte Email:
- Kunde: ${customer.name} (${customer.email})
- Betreff: ${email.subject}
- Kategorie: ${email.category}
- Priorität: ${email.priority}
- Grund: ${reason}

Bitte bearbeiten Sie diese Anfrage manuell im Dashboard.
    `;

    // Send to support team
    if (process.env.SUPPORT_TEAM_EMAIL) {
      await this.emailService.sendEmail(
        process.env.SUPPORT_TEAM_EMAIL,
        `[ESKALATION] ${email.subject}`,
        notificationBody,
        notificationBody.replace(/\n/g, '<br>')
      );
    }
  }

  // Helper methods
  translateOrderStatus(status) {
    const translations = {
      'pending': 'Ausstehend',
      'confirmed': 'Bestätigt',
      'processing': 'In Bearbeitung',
      'shipped': 'Versendet',
      'in_transit': 'Unterwegs',
      'delivered': 'Zugestellt',
      'cancelled': 'Storniert',
      'returned': 'Zurückgesendet',
      'refunded': 'Erstattet'
    };
    return translations[status] || status;
  }

  generateTrackingUrl(trackingNumber, shippingMethod) {
    if (!trackingNumber) return '';
    
    const carriers = {
      'dhl': `https://www.dhl.de/de/privatkunden/pakete-empfangen/verfolgen.html?piececode=${trackingNumber}`,
      'ups': `https://www.ups.com/track?loc=de_DE&tracknum=${trackingNumber}`,
      'hermes': `https://www.myhermes.de/empfangen/sendungsverfolgung/ergebnisse?trackingNumber=${trackingNumber}`,
      'dpd': `https://tracking.dpd.de/parcelstatus?query=${trackingNumber}&locale=de_DE`
    };
    
    const carrier = shippingMethod?.toLowerCase() || 'dhl';
    return carriers[carrier] || carriers['dhl'];
  }

  generateVoucherCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = 'SAVE';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  generateTicketNumber() {
    return `TICKET-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  }

  generateComplaintNumber() {
    return `COMP-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  }

  async extractReturnDetails(emailText) {
    try {
      const prompt = `
Analysiere diese E-Mail und extrahiere Retouren-Details:
- Welche Artikel sollen zurückgeschickt werden?
- Grund für die Rücksendung
- Gewünschte Aktion (Erstattung, Umtausch, etc.)

E-Mail: ${emailText}

Antwort im JSON-Format.
      `;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' }
      });

      return JSON.parse(response.choices[0].message.content);
    } catch (error) {
      console.error('Fehler bei AI-Extraktion:', error);
      return {
        reason: 'Nicht spezifiziert',
        items: [],
        action: 'refund'
      };
    }
  }

  async getProductInformation(question) {
    // Simulate product lookup - in production, this would query your product database
    return {
      found: true,
      id: 'PROD-123',
      name: 'Beispielprodukt',
      available: true,
      price: 49.99,
      description: 'Ein hochwertiges Produkt für Ihre Bedürfnisse',
      specifications: {
        'Material': '100% Baumwolle',
        'Größe': 'M, L, XL',
        'Farbe': 'Blau, Schwarz, Weiß'
      },
      sizes: ['M', 'L', 'XL'],
      colors: ['Blau', 'Schwarz', 'Weiß'],
      url: `${process.env.COMPANY_URL}/products/PROD-123`
    };
  }

  async checkShippingStatus(orderData) {
    // Simulate carrier API call
    return {
      status: 'delayed',
      issue: 'Verzögerung im Verteilzentrum',
      estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString('de-DE'),
      lastUpdate: new Date().toISOString()
    };
  }

  extractComplaintSubject(emailData) {
    const subject = emailData.subject.toLowerCase();
    if (subject.includes('produkt')) return 'Produktqualität';
    if (subject.includes('versand')) return 'Versandproblem';
    if (subject.includes('service')) return 'Kundenservice';
    if (subject.includes('website')) return 'Website-Problem';
    return 'Allgemeine Beschwerde';
  }

  extractFeedbackSubject(emailData) {
    return emailData.subject.replace(/^(re:|feedback:|bewertung:)/i, '').trim();
  }

  async extractTechnicalIssue(text) {
    // Simple pattern matching for common issues
    const commonIssues = {
      'passwort': {
        commonIssue: true,
        solution: 'Sie können Ihr Passwort hier zurücksetzen: ' + process.env.COMPANY_URL + '/reset-password'
      },
      'anmeldung': {
        commonIssue: true,
        solution: 'Bitte löschen Sie Ihre Browser-Cookies und versuchen Sie es erneut.'
      }
    };

    const lowerText = text.toLowerCase();
    for (const [key, value] of Object.entries(commonIssues)) {
      if (lowerText.includes(key)) {
        return value;
      }
    }

    return { commonIssue: false };
  }

  async updateCustomerSatisfaction(customerId, sentiment) {
    const score = sentiment === 'positive' ? 90 : sentiment === 'negative' ? 30 : 60;
    
    // Get current satisfaction score
    const customer = await this.db.getCustomerById(customerId);
    const currentScore = customer.satisfaction_score || 50;
    
    // Calculate new score (weighted average)
    const newScore = (currentScore * 0.7 + score * 0.3);
    
    await this.db.updateCustomer(customerId, {
      satisfaction_score: newScore
    });
  }

  // Analytics methods
  async getAgentStats(startDate, endDate) {
    return {
      emailStats: await this.db.getEmailStats(startDate, endDate),
      categoryBreakdown: await this.db.getCategoryStats(startDate, endDate),
      returnStats: await this.db.getReturnStats(startDate, endDate),
      responseTime: await this.calculateAverageResponseTime(startDate, endDate),
      automationRate: await this.calculateAutomationRate(startDate, endDate)
    };
  }

  async calculateAverageResponseTime(startDate, endDate) {
    const stmt = this.db.db.prepare(`
      SELECT AVG(julianday(r.sent_at) - julianday(e.created_at)) * 24 as avg_hours
      FROM email_responses r
      JOIN emails e ON r.original_email_id = e.id
      WHERE e.created_at BETWEEN ? AND ?
    `);
    
    const result = stmt.get(startDate, endDate);
    return result.avg_hours || 0;
  }

  async calculateAutomationRate(startDate, endDate) {
    const stmt = this.db.db.prepare(`
      SELECT 
        COUNT(CASE WHEN status IN ('responded', 'resolved') THEN 1 END) as automated,
        COUNT(CASE WHEN status = 'escalated' THEN 1 END) as escalated,
        COUNT(*) as total
      FROM emails
      WHERE created_at BETWEEN ? AND ?
    `);
    
    const result = stmt.get(startDate, endDate);
    const automationRate = result.total > 0 ? (result.automated / result.total * 100) : 0;
    
    return {
      rate: automationRate.toFixed(1),
      automated: result.automated,
      escalated: result.escalated,
      total: result.total
    };
  }
}