import { Return } from '../models/Return.js';
import { DatabaseService } from './DatabaseService.js';
import { EmailService } from './EmailService.js';
import { PDFDocument, rgb } from 'pdf-lib';
import QRCode from 'qrcode';
import fs from 'fs/promises';
import path from 'path';

export class ReturnService {
  constructor(databaseService, emailService) {
    this.db = databaseService;
    this.emailService = emailService;
    this.returnPolicyDays = parseInt(process.env.RETURN_POLICY_DAYS) || 30;
  }

  async createReturn(orderData, returnRequest) {
    // Validate return eligibility
    const eligibility = await this.checkReturnEligibility(orderData);
    if (!eligibility.eligible) {
      throw new Error(eligibility.reason);
    }

    // Generate return number
    const returnNumber = this.generateReturnNumber();

    // Create return in database
    const returnData = {
      order_id: orderData.id,
      customer_id: orderData.customer_id,
      return_number: returnNumber,
      status: Return.statuses.REQUESTED,
      reason: returnRequest.reason,
      reason_category: this.categorizeReason(returnRequest.reason),
      customer_comments: returnRequest.comments,
      return_method: returnRequest.preferredMethod || Return.returnMethods.PREPAID_LABEL,
      refund_amount: this.calculateRefundAmount(orderData, returnRequest),
      replacement_requested: returnRequest.replacementRequested || false
    };

    const returnId = this.db.createReturn(returnData);

    // Add return items
    if (returnRequest.items) {
      for (const item of returnRequest.items) {
        await this.addReturnItem(returnId, item);
      }
    }

    // Generate return label if needed
    if (returnData.return_method === Return.returnMethods.PREPAID_LABEL) {
      const labelPath = await this.generateReturnLabel(returnId, returnNumber, orderData);
      await this.db.updateReturnStatus(returnId, Return.statuses.APPROVED, {
        return_label: labelPath,
        approved_at: new Date().toISOString()
      });
    }

    return {
      returnId,
      returnNumber,
      status: 'created',
      nextSteps: this.getReturnInstructions(returnData.return_method)
    };
  }

  async checkReturnEligibility(order) {
    const result = {
      eligible: true,
      reason: null,
      warnings: []
    };

    // Check if order exists and is delivered
    if (!order.delivered_at) {
      result.eligible = false;
      result.reason = 'Bestellung wurde noch nicht zugestellt';
      return result;
    }

    // Check return window
    const daysSinceDelivery = Math.floor(
      (new Date() - new Date(order.delivered_at)) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceDelivery > this.returnPolicyDays) {
      result.eligible = false;
      result.reason = `Rückgabefrist von ${this.returnPolicyDays} Tagen überschritten`;
      return result;
    }

    // Check if already returned
    const existingReturn = await this.db.getReturnByOrderId(order.id);
    if (existingReturn && existingReturn.status !== Return.statuses.CANCELLED) {
      result.eligible = false;
      result.reason = 'Für diese Bestellung existiert bereits eine Rücksendung';
      return result;
    }

    // Add warnings for edge cases
    if (daysSinceDelivery > this.returnPolicyDays * 0.8) {
      result.warnings.push(`Nur noch ${this.returnPolicyDays - daysSinceDelivery} Tage für Rücksendung`);
    }

    // Check customer return history
    const customerReturns = await this.getCustomerReturnHistory(order.customer_id);
    if (customerReturns.returnRate > 0.5) {
      result.warnings.push('Hohe Retourenquote des Kunden');
    }

    return result;
  }

  categorizeReason(reason) {
    const reasonLower = reason.toLowerCase();
    
    const categories = {
      [Return.reasonCategories.DEFECTIVE]: ['defekt', 'kaputt', 'funktioniert nicht', 'beschädigt'],
      [Return.reasonCategories.WRONG_ITEM]: ['falsch', 'anderes produkt', 'verwechselt'],
      [Return.reasonCategories.NOT_AS_DESCRIBED]: ['anders als beschrieben', 'entspricht nicht', 'abweichung'],
      [Return.reasonCategories.DAMAGED]: ['beschädigt', 'zerbrochen', 'verkratzt'],
      [Return.reasonCategories.SIZE_ISSUE]: ['größe', 'zu klein', 'zu groß', 'passt nicht'],
      [Return.reasonCategories.COLOR_ISSUE]: ['farbe', 'farbabweichung', 'andere farbe'],
      [Return.reasonCategories.QUALITY_ISSUE]: ['qualität', 'minderwertig', 'billig'],
      [Return.reasonCategories.CHANGED_MIND]: ['umentschieden', 'gefällt nicht', 'doch nicht'],
      [Return.reasonCategories.FOUND_CHEAPER]: ['günstiger', 'woanders billiger', 'preisunterschied']
    };

    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => reasonLower.includes(keyword))) {
        return category;
      }
    }

    return Return.reasonCategories.OTHER;
  }

  calculateRefundAmount(order, returnRequest) {
    let refundAmount = 0;
    
    if (returnRequest.items && returnRequest.items.length > 0) {
      // Partial return
      for (const item of returnRequest.items) {
        const orderItem = order.items.find(oi => oi.id === item.orderItemId);
        if (orderItem) {
          refundAmount += orderItem.price * item.quantity;
        }
      }
    } else {
      // Full return
      refundAmount = order.total_amount;
    }

    // Apply restocking fee for certain categories
    const reasonCategory = this.categorizeReason(returnRequest.reason);
    if ([Return.reasonCategories.CHANGED_MIND, Return.reasonCategories.FOUND_CHEAPER].includes(reasonCategory)) {
      const restockingFee = refundAmount * 0.1; // 10% restocking fee
      refundAmount -= restockingFee;
    }

    return refundAmount;
  }

  generateReturnNumber() {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `RET-${timestamp}-${random}`.toUpperCase();
  }

  async generateReturnLabel(returnId, returnNumber, orderData) {
    // Create PDF document
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([600, 400]);
    const { width, height } = page.getSize();

    // Add company info
    page.drawText(process.env.COMPANY_NAME || 'E-Commerce Store', {
      x: 50,
      y: height - 50,
      size: 20,
      color: rgb(0, 0, 0)
    });

    // Add return address
    page.drawText('Retouren-Abteilung', {
      x: 50,
      y: height - 80,
      size: 14
    });
    page.drawText('Musterstraße 123', {
      x: 50,
      y: height - 100,
      size: 14
    });
    page.drawText('12345 Musterstadt', {
      x: 50,
      y: height - 120,
      size: 14
    });

    // Add return number
    page.drawText(`Rücksende-Nr: ${returnNumber}`, {
      x: 50,
      y: height - 160,
      size: 16,
      color: rgb(0, 0, 0.8)
    });

    // Add order reference
    page.drawText(`Bestell-Nr: ${orderData.order_number}`, {
      x: 50,
      y: height - 180,
      size: 14
    });

    // Generate QR code
    const qrCodeData = `${process.env.COMPANY_URL}/returns/${returnNumber}`;
    const qrCodeImage = await QRCode.toDataURL(qrCodeData);
    const qrCodeImageBytes = await fetch(qrCodeData).then(res => res.arrayBuffer());
    
    // Add customer address
    const customer = await this.db.getCustomerById(orderData.customer_id);
    if (customer) {
      page.drawText('Absender:', {
        x: 350,
        y: height - 50,
        size: 12
      });
      page.drawText(customer.name || 'Kunde', {
        x: 350,
        y: height - 70,
        size: 14
      });
      if (orderData.shipping_address) {
        const address = JSON.parse(orderData.shipping_address);
        page.drawText(address.street || '', {
          x: 350,
          y: height - 90,
          size: 14
        });
        page.drawText(`${address.zip || ''} ${address.city || ''}`, {
          x: 350,
          y: height - 110,
          size: 14
        });
      }
    }

    // Add instructions
    page.drawText('Anleitung:', {
      x: 50,
      y: 150,
      size: 14,
      color: rgb(0, 0, 0)
    });
    page.drawText('1. Artikel sicher verpacken', {
      x: 50,
      y: 130,
      size: 12
    });
    page.drawText('2. Dieses Label ausdrucken und aufkleben', {
      x: 50,
      y: 110,
      size: 12
    });
    page.drawText('3. Paket bei DHL/Hermes/Post abgeben', {
      x: 50,
      y: 90,
      size: 12
    });

    // Save PDF
    const pdfBytes = await pdfDoc.save();
    const labelPath = path.join('data', 'labels', `${returnNumber}.pdf`);
    await fs.mkdir(path.dirname(labelPath), { recursive: true });
    await fs.writeFile(labelPath, pdfBytes);

    return labelPath;
  }

  getReturnInstructions(returnMethod) {
    const instructions = {
      [Return.returnMethods.PREPAID_LABEL]: [
        'Rücksende-Label wurde per E-Mail verschickt',
        'Artikel sicher verpacken',
        'Label ausdrucken und auf Paket kleben',
        'Paket bei einem Paketshop abgeben',
        'Sendungsverfolgung wird automatisch aktiviert'
      ],
      [Return.returnMethods.CUSTOMER_SHIP]: [
        'Artikel sicher verpacken',
        'Eigenes Versandlabel erstellen',
        'An unsere Retouren-Adresse senden',
        'Sendungsnummer an uns übermitteln',
        'Versandkosten werden nach Eingang erstattet'
      ],
      [Return.returnMethods.PICKUP]: [
        'Artikel retourenfähig verpacken',
        'Abholung wird innerhalb von 2-3 Werktagen erfolgen',
        'Bitte jemand zur Übergabe bereithalten',
        'Abholbestätigung aufbewahren'
      ],
      [Return.returnMethods.DROP_OFF]: [
        'Artikel sicher verpacken',
        'Zu einem unserer Partner-Shops bringen',
        'Rücksende-Nummer angeben',
        'Quittung aufbewahren'
      ]
    };

    return instructions[returnMethod] || [];
  }

  async processReturn(returnId, action, notes = '') {
    const returnData = await this.db.getReturnById(returnId);
    if (!returnData) {
      throw new Error('Rücksendung nicht gefunden');
    }

    switch (action) {
      case 'approve':
        await this.approveReturn(returnId, notes);
        break;
      case 'receive':
        await this.receiveReturn(returnId, notes);
        break;
      case 'inspect':
        await this.inspectReturn(returnId, notes);
        break;
      case 'process_refund':
        await this.processRefund(returnId, notes);
        break;
      case 'reject':
        await this.rejectReturn(returnId, notes);
        break;
      default:
        throw new Error('Unbekannte Aktion');
    }
  }

  async approveReturn(returnId, notes) {
    await this.db.updateReturnStatus(returnId, Return.statuses.APPROVED, {
      approved_at: new Date().toISOString(),
      inspection_notes: notes
    });

    // Send approval email
    const returnData = await this.db.getReturnById(returnId);
    const customer = await this.db.getCustomerById(returnData.customer_id);
    
    await this.sendReturnStatusEmail(customer.email, 'approved', returnData);
  }

  async receiveReturn(returnId, notes) {
    await this.db.updateReturnStatus(returnId, Return.statuses.RECEIVED, {
      received_at: new Date().toISOString(),
      inspection_notes: notes
    });

    // Update to inspecting status
    setTimeout(() => {
      this.db.updateReturnStatus(returnId, Return.statuses.INSPECTING);
    }, 1000);
  }

  async inspectReturn(returnId, inspectionResults) {
    const { condition, refundApproved, refundAmount, notes } = inspectionResults;

    if (refundApproved) {
      await this.db.updateReturnStatus(returnId, Return.statuses.PROCESSED, {
        inspection_notes: notes,
        refund_amount: refundAmount
      });
      
      // Trigger refund process
      await this.processRefund(returnId);
    } else {
      await this.rejectReturn(returnId, notes);
    }
  }

  async processRefund(returnId) {
    const returnData = await this.db.getReturnById(returnId);
    const order = await this.db.getOrderById(returnData.order_id);
    
    // Here you would integrate with payment provider
    // For now, we'll simulate the refund
    const refundResult = await this.simulateRefund(order, returnData.refund_amount);

    if (refundResult.success) {
      await this.db.updateReturnStatus(returnId, Return.statuses.REFUNDED, {
        processed_at: new Date().toISOString(),
        refund_transaction_id: refundResult.transactionId
      });

      // Update order status
      await this.db.updateOrderStatus(order.id, 'refunded');

      // Send confirmation email
      const customer = await this.db.getCustomerById(returnData.customer_id);
      await this.sendRefundConfirmationEmail(customer.email, returnData, refundResult);
    }
  }

  async rejectReturn(returnId, reason) {
    await this.db.updateReturnStatus(returnId, Return.statuses.REJECTED, {
      inspection_notes: reason
    });

    const returnData = await this.db.getReturnById(returnId);
    const customer = await this.db.getCustomerById(returnData.customer_id);
    
    await this.sendReturnStatusEmail(customer.email, 'rejected', returnData, reason);
  }

  async getCustomerReturnHistory(customerId) {
    const returns = await this.db.getCustomerReturns(customerId);
    const orders = await this.db.getCustomerOrders(customerId);
    
    const stats = {
      totalReturns: returns.length,
      totalOrders: orders.length,
      returnRate: orders.length > 0 ? returns.length / orders.length : 0,
      totalRefunded: returns.reduce((sum, ret) => sum + (ret.refund_amount || 0), 0),
      averageProcessingTime: this.calculateAverageProcessingTime(returns),
      commonReasons: this.analyzeReturnReasons(returns)
    };

    return stats;
  }

  calculateAverageProcessingTime(returns) {
    const processedReturns = returns.filter(r => r.processed_at && r.created_at);
    if (processedReturns.length === 0) return 0;

    const totalDays = processedReturns.reduce((sum, ret) => {
      const days = Math.floor(
        (new Date(ret.processed_at) - new Date(ret.created_at)) / (1000 * 60 * 60 * 24)
      );
      return sum + days;
    }, 0);

    return totalDays / processedReturns.length;
  }

  analyzeReturnReasons(returns) {
    const reasons = {};
    returns.forEach(ret => {
      const category = ret.reason_category || 'other';
      reasons[category] = (reasons[category] || 0) + 1;
    });
    return reasons;
  }

  async simulateRefund(order, amount) {
    // Simulate payment provider API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      success: true,
      transactionId: `REF-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      amount: amount,
      currency: order.currency || 'EUR',
      processedAt: new Date().toISOString()
    };
  }

  async sendReturnStatusEmail(email, status, returnData, additionalInfo = '') {
    const templates = {
      approved: {
        subject: `Ihre Rücksendung wurde genehmigt - ${returnData.return_number}`,
        body: `Guten Tag,\n\nIhre Rücksendung wurde genehmigt. Bitte senden Sie die Artikel mit dem beigefügten Label zurück.\n\nRücksende-Nummer: ${returnData.return_number}\n\nMit freundlichen Grüßen`
      },
      rejected: {
        subject: `Rücksendung abgelehnt - ${returnData.return_number}`,
        body: `Guten Tag,\n\nLeider mussten wir Ihre Rücksendung ablehnen.\n\nGrund: ${additionalInfo}\n\nBei Fragen kontaktieren Sie uns bitte.\n\nMit freundlichen Grüßen`
      }
    };

    const template = templates[status];
    if (template) {
      await this.emailService.sendEmail(
        email,
        template.subject,
        template.body,
        template.body.replace(/\n/g, '<br>')
      );
    }
  }

  async sendRefundConfirmationEmail(email, returnData, refundResult) {
    const subject = `Erstattung erfolgreich - ${returnData.return_number}`;
    const body = `
Guten Tag,

Ihre Erstattung wurde erfolgreich bearbeitet.

Rücksende-Nummer: ${returnData.return_number}
Erstattungsbetrag: ${refundResult.amount} ${refundResult.currency}
Transaktions-ID: ${refundResult.transactionId}

Der Betrag wird innerhalb von 3-5 Werktagen auf Ihrem Konto gutgeschrieben.

Mit freundlichen Grüßen
${process.env.COMPANY_NAME}
    `;

    await this.emailService.sendEmail(email, subject, body, body.replace(/\n/g, '<br>'));
  }

  async addReturnItem(returnId, item) {
    const stmt = this.db.db.prepare(`
      INSERT INTO return_items (return_id, order_item_id, quantity, condition)
      VALUES (?, ?, ?, ?)
    `);
    stmt.run(returnId, item.orderItemId, item.quantity, item.condition || 'unknown');
  }

  async getActiveReturns() {
    return await this.db.getActiveReturns();
  }

  async getReturnMetrics(startDate, endDate) {
    const stats = await this.db.getReturnStats(startDate, endDate);
    return {
      overview: stats[0],
      byReason: stats,
      trends: await this.calculateReturnTrends(startDate, endDate)
    };
  }

  async calculateReturnTrends(startDate, endDate) {
    // Calculate daily/weekly/monthly trends
    // This would be more complex in production
    return {
      daily: [],
      weekly: [],
      monthly: []
    };
  }
}