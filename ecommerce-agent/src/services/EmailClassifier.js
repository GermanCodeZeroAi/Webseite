import natural from 'natural';
import { Email } from '../models/Email.js';

export class EmailClassifier {
  constructor() {
    this.classifier = new natural.BayesClassifier();
    this.initializeTrainingData();
    this.keywordPatterns = this.initializeKeywordPatterns();
    this.urgencyKeywords = this.initializeUrgencyKeywords();
  }

  initializeTrainingData() {
    // Training data für verschiedene E-Commerce Email-Kategorien
    const trainingData = {
      [Email.categories.ORDER_INQUIRY]: [
        'wo ist meine bestellung',
        'bestellstatus',
        'bestellnummer',
        'wann kommt meine bestellung',
        'lieferstatus',
        'sendungsverfolgung',
        'tracking nummer',
        'bestellung noch nicht angekommen',
        'bestellung verfolgen',
        'wo bleibt meine ware'
      ],
      [Email.categories.RETURN_REQUEST]: [
        'zurückschicken',
        'zurücksenden',
        'retour',
        'rücksendung',
        'umtausch',
        'zurückgeben',
        'rückgabe',
        'retoure einleiten',
        'ware zurück',
        'artikel zurücksenden'
      ],
      [Email.categories.SHIPPING_ISSUE]: [
        'versand problem',
        'falsche adresse',
        'lieferung fehlgeschlagen',
        'paket beschädigt',
        'versand verzögerung',
        'dhl problem',
        'ups problem',
        'hermes problem',
        'zustellung fehlgeschlagen',
        'nicht zugestellt'
      ],
      [Email.categories.PRODUCT_QUESTION]: [
        'produkt frage',
        'artikel information',
        'größe',
        'farbe',
        'material',
        'verfügbarkeit',
        'technische daten',
        'produktdetails',
        'wie funktioniert',
        'anleitung'
      ],
      [Email.categories.COMPLAINT]: [
        'beschwerde',
        'unzufrieden',
        'schlechte qualität',
        'mangelhaft',
        'defekt',
        'kaputt',
        'funktioniert nicht',
        'enttäuscht',
        'reklamation',
        'beanstandung'
      ],
      [Email.categories.PAYMENT_ISSUE]: [
        'zahlung',
        'bezahlung',
        'kreditkarte',
        'paypal',
        'überweisung',
        'rechnung',
        'zahlungsproblem',
        'abbuchung',
        'erstattung',
        'rückerstattung'
      ],
      [Email.categories.REFUND_REQUEST]: [
        'geld zurück',
        'erstattung',
        'rückerstattung',
        'refund',
        'kostenerstattung',
        'betrag zurück',
        'geld erstatten',
        'kaufpreis zurück',
        'rückzahlung',
        'gutschrift'
      ],
      [Email.categories.EXCHANGE_REQUEST]: [
        'umtausch',
        'austausch',
        'andere größe',
        'andere farbe',
        'tauschen',
        'exchange',
        'wechseln',
        'ersetzen',
        'anderes modell',
        'alternative'
      ],
      [Email.categories.CANCELLATION]: [
        'stornieren',
        'stornierung',
        'bestellung abbrechen',
        'cancel',
        'nicht mehr benötigt',
        'doch nicht',
        'rückgängig machen',
        'auftrag löschen',
        'bestellung löschen',
        'storno'
      ],
      [Email.categories.TECHNICAL_SUPPORT]: [
        'website problem',
        'anmeldung funktioniert nicht',
        'passwort vergessen',
        'konto zugriff',
        'app problem',
        'fehler meldung',
        'technisches problem',
        'browser problem',
        'seite lädt nicht',
        'checkout fehler'
      ],
      [Email.categories.FEEDBACK]: [
        'feedback',
        'bewertung',
        'rezension',
        'erfahrung',
        'meinung',
        'vorschlag',
        'verbesserung',
        'lob',
        'kritik',
        'kommentar'
      ]
    };

    // Trainiere den Classifier
    Object.entries(trainingData).forEach(([category, phrases]) => {
      phrases.forEach(phrase => {
        this.classifier.addDocument(phrase.toLowerCase(), category);
      });
    });

    this.classifier.train();
  }

  initializeKeywordPatterns() {
    return {
      orderNumber: /\b(?:bestellnummer|auftragsnummer|order\s*#?|bestell\s*nr\.?)\s*:?\s*([A-Z0-9\-]+)/i,
      email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/,
      phoneNumber: /\b(?:\+49|0049|0)?\s*\d{2,5}[-.\s]?\d{3,}[-.\s]?\d{3,}/,
      trackingNumber: /\b(?:tracking|sendungsnummer|paketnummer)\s*:?\s*([A-Z0-9]{10,})/i,
      returnNumber: /\b(?:retoure|rücksende|return)\s*(?:nummer|#|nr\.?)\s*:?\s*([A-Z0-9\-]+)/i,
      price: /\b\d+[.,]\d{2}\s*(?:€|EUR|euro)/i,
      productName: /\b(?:artikel|produkt|item)\s*:?\s*([^,\n]+)/i
    };
  }

  initializeUrgencyKeywords() {
    return {
      urgent: [
        'dringend', 'urgent', 'sofort', 'eilig', 'notfall',
        'asap', 'schnell', 'heute noch', 'morgen'
      ],
      high: [
        'wichtig', 'problem', 'defekt', 'kaputt', 'beschädigt',
        'falsch', 'fehlt', 'vermisse', 'enttäuscht', 'verärgert'
      ],
      normal: [
        'frage', 'information', 'wissen', 'könnte', 'würde',
        'bitte', 'danke', 'anfrage'
      ]
    };
  }

  async classifyEmail(emailContent) {
    const text = (emailContent.subject + ' ' + emailContent.body).toLowerCase();
    
    // Basis-Klassifizierung mit Naive Bayes
    const classification = this.classifier.classify(text);
    const classifications = this.classifier.getClassifications(text);
    
    // Confidence Score
    const confidence = classifications[0].value;
    
    // Erweiterte Analyse
    const analysis = {
      category: classification,
      confidence: confidence,
      priority: this.determinePriority(text),
      sentiment: this.analyzeSentiment(text),
      extractedData: this.extractKeyData(text),
      suggestedActions: [],
      tags: []
    };

    // Spezifische Aktionen basierend auf Kategorie
    analysis.suggestedActions = this.getSuggestedActions(classification, analysis.extractedData);
    analysis.tags = this.generateTags(text, classification);

    return analysis;
  }

  determinePriority(text) {
    const lowerText = text.toLowerCase();
    
    // Check for urgent keywords
    for (const keyword of this.urgencyKeywords.urgent) {
      if (lowerText.includes(keyword)) {
        return Email.priorities.URGENT;
      }
    }
    
    // Check for high priority keywords
    let highPriorityCount = 0;
    for (const keyword of this.urgencyKeywords.high) {
      if (lowerText.includes(keyword)) {
        highPriorityCount++;
      }
    }
    
    if (highPriorityCount >= 2) {
      return Email.priorities.HIGH;
    } else if (highPriorityCount === 1) {
      return Email.priorities.NORMAL;
    }
    
    return Email.priorities.NORMAL;
  }

  analyzeSentiment(text) {
    const sentiment = new natural.SentimentAnalyzer('German', natural.PorterStemmer, 'afinn');
    const tokenizer = new natural.WordTokenizer();
    const tokens = tokenizer.tokenize(text.toLowerCase());
    
    const score = sentiment.getSentiment(tokens);
    
    if (score > 0.2) return 'positive';
    if (score < -0.2) return 'negative';
    return 'neutral';
  }

  extractKeyData(text) {
    const extracted = {};
    
    // Extract order number
    const orderMatch = text.match(this.keywordPatterns.orderNumber);
    if (orderMatch) {
      extracted.orderNumber = orderMatch[1];
    }
    
    // Extract tracking number
    const trackingMatch = text.match(this.keywordPatterns.trackingNumber);
    if (trackingMatch) {
      extracted.trackingNumber = trackingMatch[1];
    }
    
    // Extract return number
    const returnMatch = text.match(this.keywordPatterns.returnNumber);
    if (returnMatch) {
      extracted.returnNumber = returnMatch[1];
    }
    
    // Extract email addresses
    const emails = text.match(this.keywordPatterns.email);
    if (emails) {
      extracted.customerEmail = emails[0];
    }
    
    // Extract phone numbers
    const phones = text.match(this.keywordPatterns.phoneNumber);
    if (phones) {
      extracted.phoneNumber = phones[0];
    }
    
    // Extract prices
    const prices = text.match(this.keywordPatterns.price);
    if (prices) {
      extracted.mentionedPrice = prices[0];
    }
    
    return extracted;
  }

  getSuggestedActions(category, extractedData) {
    const actions = [];
    
    switch (category) {
      case Email.categories.ORDER_INQUIRY:
        actions.push('check_order_status');
        if (extractedData.orderNumber) {
          actions.push('send_tracking_info');
        }
        break;
        
      case Email.categories.RETURN_REQUEST:
        actions.push('create_return_label');
        actions.push('send_return_instructions');
        break;
        
      case Email.categories.REFUND_REQUEST:
        actions.push('check_return_status');
        actions.push('process_refund');
        break;
        
      case Email.categories.COMPLAINT:
        actions.push('escalate_to_manager');
        actions.push('offer_compensation');
        break;
        
      case Email.categories.SHIPPING_ISSUE:
        actions.push('contact_shipping_provider');
        actions.push('offer_replacement');
        break;
        
      case Email.categories.CANCELLATION:
        actions.push('check_order_status');
        actions.push('process_cancellation');
        break;
        
      case Email.categories.TECHNICAL_SUPPORT:
        actions.push('provide_tech_support');
        actions.push('escalate_to_it');
        break;
    }
    
    return actions;
  }

  generateTags(text, category) {
    const tags = [category];
    const lowerText = text.toLowerCase();
    
    // Product-related tags
    if (lowerText.includes('defekt') || lowerText.includes('kaputt')) {
      tags.push('defective_product');
    }
    
    // Customer emotion tags
    if (lowerText.includes('enttäuscht') || lowerText.includes('verärgert') || lowerText.includes('wütend')) {
      tags.push('unhappy_customer');
    }
    
    if (lowerText.includes('zufrieden') || lowerText.includes('danke') || lowerText.includes('super')) {
      tags.push('satisfied_customer');
    }
    
    // Loyalty tags
    if (lowerText.includes('stammkunde') || lowerText.includes('jahre kunde') || lowerText.includes('immer bestellt')) {
      tags.push('loyal_customer');
    }
    
    // Action tags
    if (lowerText.includes('sofort') || lowerText.includes('dringend')) {
      tags.push('urgent_response_needed');
    }
    
    return [...new Set(tags)]; // Remove duplicates
  }

  // Methode für kontinuierliches Lernen
  learnFromFeedback(emailText, correctCategory) {
    this.classifier.addDocument(emailText.toLowerCase(), correctCategory);
    this.classifier.train();
  }

  // Batch-Klassifizierung für mehrere Emails
  async classifyBatch(emails) {
    const results = [];
    for (const email of emails) {
      const classification = await this.classifyEmail(email);
      results.push({
        email: email,
        classification: classification
      });
    }
    return results;
  }

  // Export der Trainings-Daten
  exportClassifier() {
    return this.classifier.save();
  }

  // Import von Trainings-Daten
  importClassifier(data) {
    this.classifier = natural.BayesClassifier.restore(data);
  }
}