import { Customer } from '../models/Customer.js';
import { DatabaseService } from './DatabaseService.js';
import crypto from 'crypto';

export class CustomerService {
  constructor(databaseService) {
    this.db = databaseService;
  }

  async createOrUpdateCustomer(emailData) {
    const email = this.extractEmail(emailData.from);
    if (!email) {
      throw new Error('Keine gültige E-Mail-Adresse gefunden');
    }

    let customer = await this.db.getCustomerByEmail(email);
    
    if (!customer) {
      // Create new customer
      const customerData = {
        email: email,
        name: this.extractName(emailData.from),
        preferred_language: this.detectLanguage(emailData.body),
        loyalty_tier: Customer.loyaltyTiers.STANDARD
      };
      
      customer = await this.db.createCustomer(customerData);
    } else {
      // Update last interaction
      await this.updateCustomerInteraction(customer.id);
    }

    return customer;
  }

  extractEmail(fromField) {
    const emailMatch = fromField.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    return emailMatch ? emailMatch[0].toLowerCase() : null;
  }

  extractName(fromField) {
    // Extract name from "Name <email@example.com>" format
    const nameMatch = fromField.match(/^([^<]+)\s*</);
    if (nameMatch) {
      return nameMatch[1].trim();
    }
    
    // If no name found, use part before @ in email
    const email = this.extractEmail(fromField);
    if (email) {
      return email.split('@')[0].replace(/[._-]/g, ' ');
    }
    
    return 'Kunde';
  }

  detectLanguage(text) {
    // Simple language detection based on common words
    const germanWords = ['der', 'die', 'das', 'und', 'ist', 'nicht', 'ich', 'sie', 'mit'];
    const englishWords = ['the', 'and', 'is', 'not', 'i', 'you', 'with', 'have'];
    
    const lowerText = text.toLowerCase();
    let germanCount = 0;
    let englishCount = 0;
    
    germanWords.forEach(word => {
      if (lowerText.includes(` ${word} `)) germanCount++;
    });
    
    englishWords.forEach(word => {
      if (lowerText.includes(` ${word} `)) englishCount++;
    });
    
    return germanCount > englishCount ? 'de' : 'en';
  }

  async updateCustomerInteraction(customerId) {
    const stmt = this.db.db.prepare(`
      UPDATE customers 
      SET updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `);
    stmt.run(customerId);
  }

  async getCustomerById(customerId) {
    const customer = await this.db.getCustomerById(customerId);
    if (!customer) return null;

    // Enrich with additional data
    const enrichedCustomer = {
      ...customer,
      orders: await this.getCustomerOrders(customerId),
      returns: await this.getCustomerReturns(customerId),
      communications: await this.getCustomerCommunications(customerId),
      metrics: await this.calculateCustomerMetrics(customerId)
    };

    return enrichedCustomer;
  }

  async getCustomerOrders(customerId) {
    const orders = await this.db.getCustomerOrders(customerId);
    return orders.map(order => ({
      ...order,
      items: this.db.db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id)
    }));
  }

  async getCustomerReturns(customerId) {
    const stmt = this.db.db.prepare(`
      SELECT r.*, o.order_number 
      FROM returns r
      JOIN orders o ON r.order_id = o.id
      WHERE r.customer_id = ?
      ORDER BY r.created_at DESC
    `);
    return stmt.all(customerId);
  }

  async getCustomerCommunications(customerId, limit = 50) {
    const stmt = this.db.db.prepare(`
      SELECT * FROM emails 
      WHERE customer_id = ? 
      ORDER BY date DESC 
      LIMIT ?
    `);
    return stmt.all(customerId, limit);
  }

  async calculateCustomerMetrics(customerId) {
    const orders = await this.getCustomerOrders(customerId);
    const returns = await this.getCustomerReturns(customerId);
    const communications = await this.getCustomerCommunications(customerId, 100);

    const metrics = {
      totalOrders: orders.length,
      totalSpent: orders.reduce((sum, order) => sum + (order.total_amount || 0), 0),
      averageOrderValue: orders.length > 0 ? 
        orders.reduce((sum, order) => sum + (order.total_amount || 0), 0) / orders.length : 0,
      totalReturns: returns.length,
      returnRate: orders.length > 0 ? returns.length / orders.length : 0,
      totalRefunded: returns.reduce((sum, ret) => sum + (ret.refund_amount || 0), 0),
      communicationCount: communications.length,
      lastOrderDate: orders.length > 0 ? orders[0].created_at : null,
      customerSince: orders.length > 0 ? orders[orders.length - 1].created_at : null,
      preferredCategories: this.analyzePreferredCategories(orders),
      communicationSentiment: this.analyzeCommunicationSentiment(communications),
      riskScore: this.calculateRiskScore(orders, returns, communications)
    };

    // Update customer record with calculated metrics
    await this.db.updateCustomer(customerId, {
      lifetime_value: metrics.totalSpent,
      return_rate: metrics.returnRate
    });

    return metrics;
  }

  analyzePreferredCategories(orders) {
    const categories = {};
    orders.forEach(order => {
      order.items.forEach(item => {
        const category = item.category || 'uncategorized';
        categories[category] = (categories[category] || 0) + 1;
      });
    });
    
    // Sort by frequency
    return Object.entries(categories)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([category, count]) => ({ category, count }));
  }

  analyzeCommunicationSentiment(communications) {
    const sentiments = { positive: 0, neutral: 0, negative: 0 };
    
    communications.forEach(comm => {
      if (comm.sentiment) {
        sentiments[comm.sentiment]++;
      }
    });
    
    const total = communications.length || 1;
    return {
      positive: (sentiments.positive / total * 100).toFixed(1),
      neutral: (sentiments.neutral / total * 100).toFixed(1),
      negative: (sentiments.negative / total * 100).toFixed(1),
      overallScore: this.calculateSentimentScore(sentiments, total)
    };
  }

  calculateSentimentScore(sentiments, total) {
    // Weighted sentiment score: positive=1, neutral=0, negative=-1
    const score = (sentiments.positive - sentiments.negative) / total;
    return ((score + 1) * 50).toFixed(1); // Convert to 0-100 scale
  }

  calculateRiskScore(orders, returns, communications) {
    let riskScore = 0;
    
    // High return rate increases risk
    const returnRate = orders.length > 0 ? returns.length / orders.length : 0;
    if (returnRate > 0.3) riskScore += 30;
    else if (returnRate > 0.2) riskScore += 20;
    else if (returnRate > 0.1) riskScore += 10;
    
    // Many complaints increase risk
    const complaints = communications.filter(c => 
      c.category === 'complaint' || c.sentiment === 'negative'
    ).length;
    if (complaints > 5) riskScore += 20;
    else if (complaints > 3) riskScore += 10;
    
    // Recent negative interactions
    const recentComms = communications.slice(0, 10);
    const recentNegative = recentComms.filter(c => c.sentiment === 'negative').length;
    if (recentNegative > 3) riskScore += 20;
    
    // No recent orders might indicate churn risk
    if (orders.length > 0) {
      const daysSinceLastOrder = Math.floor(
        (new Date() - new Date(orders[0].created_at)) / (1000 * 60 * 60 * 24)
      );
      if (daysSinceLastOrder > 180) riskScore += 15;
      else if (daysSinceLastOrder > 90) riskScore += 10;
    }
    
    return Math.min(riskScore, 100); // Cap at 100
  }

  async updateCustomerLoyaltyTier(customerId) {
    const metrics = await this.calculateCustomerMetrics(customerId);
    
    let newTier = Customer.loyaltyTiers.STANDARD;
    
    if (metrics.totalSpent >= 10000 && metrics.returnRate < 0.1) {
      newTier = Customer.loyaltyTiers.VIP;
    } else if (metrics.totalSpent >= 5000 && metrics.returnRate < 0.15) {
      newTier = Customer.loyaltyTiers.PLATINUM;
    } else if (metrics.totalSpent >= 2000 && metrics.returnRate < 0.2) {
      newTier = Customer.loyaltyTiers.GOLD;
    } else if (metrics.totalSpent >= 500 && metrics.returnRate < 0.25) {
      newTier = Customer.loyaltyTiers.SILVER;
    }
    
    await this.db.updateCustomer(customerId, { loyalty_tier: newTier });
    return newTier;
  }

  async searchCustomers(criteria) {
    let query = 'SELECT * FROM customers WHERE 1=1';
    const params = [];
    
    if (criteria.email) {
      query += ' AND email LIKE ?';
      params.push(`%${criteria.email}%`);
    }
    
    if (criteria.name) {
      query += ' AND name LIKE ?';
      params.push(`%${criteria.name}%`);
    }
    
    if (criteria.loyaltyTier) {
      query += ' AND loyalty_tier = ?';
      params.push(criteria.loyaltyTier);
    }
    
    if (criteria.minLifetimeValue) {
      query += ' AND lifetime_value >= ?';
      params.push(criteria.minLifetimeValue);
    }
    
    query += ' ORDER BY lifetime_value DESC LIMIT 100';
    
    const stmt = this.db.db.prepare(query);
    return stmt.all(...params);
  }

  async getHighValueCustomers(limit = 50) {
    const stmt = this.db.db.prepare(`
      SELECT * FROM customers 
      WHERE loyalty_tier IN ('vip', 'platinum', 'gold') 
      OR lifetime_value > 1000
      ORDER BY lifetime_value DESC 
      LIMIT ?
    `);
    return stmt.all(limit);
  }

  async getAtRiskCustomers(limit = 50) {
    const stmt = this.db.db.prepare(`
      SELECT c.*, 
        MAX(o.created_at) as last_order_date,
        COUNT(DISTINCT r.id) as return_count,
        COUNT(DISTINCT o.id) as order_count
      FROM customers c
      LEFT JOIN orders o ON c.id = o.customer_id
      LEFT JOIN returns r ON c.id = r.customer_id
      GROUP BY c.id
      HAVING 
        (julianday('now') - julianday(last_order_date) > 90 AND order_count > 2)
        OR (return_count * 1.0 / NULLIF(order_count, 0) > 0.3)
      ORDER BY lifetime_value DESC
      LIMIT ?
    `);
    return stmt.all(limit);
  }

  async createCustomerNote(customerId, note, category = 'general') {
    const stmt = this.db.db.prepare(`
      INSERT INTO customer_notes (customer_id, note, category, created_at)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP)
    `);
    stmt.run(customerId, note, category);
  }

  async getCustomerNotes(customerId) {
    const stmt = this.db.db.prepare(`
      SELECT * FROM customer_notes 
      WHERE customer_id = ? 
      ORDER BY created_at DESC
    `);
    return stmt.all(customerId);
  }

  async mergeCustomers(primaryCustomerId, secondaryCustomerId) {
    // Begin transaction
    const updateOrders = this.db.db.prepare('UPDATE orders SET customer_id = ? WHERE customer_id = ?');
    const updateReturns = this.db.db.prepare('UPDATE returns SET customer_id = ? WHERE customer_id = ?');
    const updateEmails = this.db.db.prepare('UPDATE emails SET customer_id = ? WHERE customer_id = ?');
    const deleteSecondary = this.db.db.prepare('DELETE FROM customers WHERE id = ?');
    
    const transaction = this.db.db.transaction(() => {
      updateOrders.run(primaryCustomerId, secondaryCustomerId);
      updateReturns.run(primaryCustomerId, secondaryCustomerId);
      updateEmails.run(primaryCustomerId, secondaryCustomerId);
      deleteSecondary.run(secondaryCustomerId);
    });
    
    transaction();
    
    // Recalculate metrics for primary customer
    await this.calculateCustomerMetrics(primaryCustomerId);
    await this.updateCustomerLoyaltyTier(primaryCustomerId);
  }

  async exportCustomerData(customerId) {
    const customer = await this.getCustomerById(customerId);
    const orders = await this.getCustomerOrders(customerId);
    const returns = await this.getCustomerReturns(customerId);
    const communications = await this.getCustomerCommunications(customerId, 1000);
    
    return {
      customer: this.sanitizeCustomerData(customer),
      orders: orders.map(o => this.sanitizeOrderData(o)),
      returns: returns.map(r => this.sanitizeReturnData(r)),
      communications: communications.map(c => this.sanitizeCommunicationData(c)),
      exportDate: new Date().toISOString(),
      dataRetentionNotice: 'Diese Daten wurden gemäß DSGVO exportiert.'
    };
  }

  sanitizeCustomerData(customer) {
    const { password, ...safeData } = customer;
    return safeData;
  }

  sanitizeOrderData(order) {
    return {
      ...order,
      payment_details: '[REDACTED]'
    };
  }

  sanitizeReturnData(returnData) {
    return returnData;
  }

  sanitizeCommunicationData(communication) {
    return {
      ...communication,
      attachments: '[REMOVED]'
    };
  }

  async deleteCustomerData(customerId) {
    // Soft delete - anonymize data instead of hard delete
    const anonymizedEmail = `deleted_${customerId}_${Date.now()}@anonymous.com`;
    
    await this.db.updateCustomer(customerId, {
      email: anonymizedEmail,
      name: 'DELETED',
      phone: null,
      address: null,
      notes: JSON.stringify([{ 
        date: new Date().toISOString(), 
        note: 'Customer data deleted per GDPR request' 
      }])
    });
  }
}