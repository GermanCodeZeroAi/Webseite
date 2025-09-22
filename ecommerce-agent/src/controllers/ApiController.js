import express from 'express';
import { EmailAgent } from '../services/EmailAgent.js';
import { DatabaseService } from '../services/DatabaseService.js';
import { CustomerService } from '../services/CustomerService.js';
import { ReturnService } from '../services/ReturnService.js';
import { TemplateService } from '../services/TemplateService.js';

export class ApiController {
  constructor(emailAgent) {
    this.router = express.Router();
    this.emailAgent = emailAgent;
    this.db = emailAgent.db;
    this.customerService = emailAgent.customerService;
    this.returnService = emailAgent.returnService;
    this.templateService = emailAgent.templateService;
    
    this.setupRoutes();
  }

  setupRoutes() {
    // Health check
    this.router.get('/health', (req, res) => {
      res.json({
        status: 'ok',
        agent: this.emailAgent.isRunning ? 'running' : 'stopped',
        timestamp: new Date().toISOString()
      });
    });

    // Email routes
    this.router.get('/emails', this.getEmails.bind(this));
    this.router.get('/emails/:id', this.getEmail.bind(this));
    this.router.put('/emails/:id/status', this.updateEmailStatus.bind(this));
    this.router.post('/emails/:id/reply', this.replyToEmail.bind(this));
    this.router.post('/emails/:id/escalate', this.escalateEmail.bind(this));
    this.router.get('/emails/category/:category', this.getEmailsByCategory.bind(this));

    // Customer routes
    this.router.get('/customers', this.getCustomers.bind(this));
    this.router.get('/customers/:id', this.getCustomer.bind(this));
    this.router.put('/customers/:id', this.updateCustomer.bind(this));
    this.router.get('/customers/:id/orders', this.getCustomerOrders.bind(this));
    this.router.get('/customers/:id/returns', this.getCustomerReturns.bind(this));
    this.router.get('/customers/:id/communications', this.getCustomerCommunications.bind(this));
    this.router.post('/customers/:id/notes', this.addCustomerNote.bind(this));
    this.router.get('/customers/search', this.searchCustomers.bind(this));
    this.router.get('/customers/high-value', this.getHighValueCustomers.bind(this));
    this.router.get('/customers/at-risk', this.getAtRiskCustomers.bind(this));

    // Order routes
    this.router.get('/orders/:id', this.getOrder.bind(this));
    this.router.get('/orders/number/:orderNumber', this.getOrderByNumber.bind(this));
    this.router.put('/orders/:id/status', this.updateOrderStatus.bind(this));

    // Return routes
    this.router.post('/returns', this.createReturn.bind(this));
    this.router.get('/returns', this.getReturns.bind(this));
    this.router.get('/returns/:id', this.getReturn.bind(this));
    this.router.put('/returns/:id/status', this.updateReturnStatus.bind(this));
    this.router.post('/returns/:id/process', this.processReturn.bind(this));

    // Template routes
    this.router.get('/templates', this.getTemplates.bind(this));
    this.router.get('/templates/:name', this.getTemplate.bind(this));
    this.router.post('/templates', this.createTemplate.bind(this));
    this.router.put('/templates/:id', this.updateTemplate.bind(this));
    this.router.delete('/templates/:id', this.deleteTemplate.bind(this));
    this.router.post('/templates/:name/test', this.testTemplate.bind(this));

    // Agent control routes
    this.router.post('/agent/start', this.startAgent.bind(this));
    this.router.post('/agent/stop', this.stopAgent.bind(this));
    this.router.post('/agent/process', this.processEmails.bind(this));

    // Analytics routes
    this.router.get('/analytics/overview', this.getAnalyticsOverview.bind(this));
    this.router.get('/analytics/emails', this.getEmailAnalytics.bind(this));
    this.router.get('/analytics/returns', this.getReturnAnalytics.bind(this));
    this.router.get('/analytics/customers', this.getCustomerAnalytics.bind(this));

    // Webhook routes for e-commerce platforms
    this.router.post('/webhooks/shopify', this.handleShopifyWebhook.bind(this));
    this.router.post('/webhooks/woocommerce', this.handleWooCommerceWebhook.bind(this));
  }

  // Email endpoints
  async getEmails(req, res) {
    try {
      const { status, category, customerId, limit = 50, offset = 0 } = req.query;
      
      let query = 'SELECT * FROM emails WHERE 1=1';
      const params = [];
      
      if (status) {
        query += ' AND status = ?';
        params.push(status);
      }
      if (category) {
        query += ' AND category = ?';
        params.push(category);
      }
      if (customerId) {
        query += ' AND customer_id = ?';
        params.push(customerId);
      }
      
      query += ' ORDER BY date DESC LIMIT ? OFFSET ?';
      params.push(parseInt(limit), parseInt(offset));
      
      const emails = this.db.db.prepare(query).all(...params);
      
      res.json({
        emails,
        total: this.db.db.prepare('SELECT COUNT(*) as count FROM emails').get().count,
        limit: parseInt(limit),
        offset: parseInt(offset)
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getEmail(req, res) {
    try {
      const email = await this.db.getEmailById(req.params.id);
      if (!email) {
        return res.status(404).json({ error: 'Email nicht gefunden' });
      }
      
      // Add customer and order data
      if (email.customer_id) {
        email.customer = await this.db.getCustomerById(email.customer_id);
      }
      if (email.order_id) {
        email.order = await this.db.getOrderById(email.order_id);
      }
      
      res.json(email);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async updateEmailStatus(req, res) {
    try {
      const { status } = req.body;
      await this.db.updateEmailStatus(req.params.id, status);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async replyToEmail(req, res) {
    try {
      const { subject, body, useTemplate, templateData } = req.body;
      const email = await this.db.getEmailById(req.params.id);
      
      if (!email) {
        return res.status(404).json({ error: 'Email nicht gefunden' });
      }
      
      let response;
      if (useTemplate && templateData) {
        response = await this.templateService.renderTemplate(useTemplate, templateData);
      } else {
        response = { subject, body };
      }
      
      await this.emailAgent.sendResponse(
        { from: email.from_email, messageId: email.message_id },
        response,
        email.id
      );
      
      res.json({ success: true, response });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async escalateEmail(req, res) {
    try {
      const { reason } = req.body;
      await this.emailAgent.escalateEmail(req.params.id, reason);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getEmailsByCategory(req, res) {
    try {
      const emails = await this.db.getEmailsByCategory(req.params.category, 100);
      res.json(emails);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Customer endpoints
  async getCustomers(req, res) {
    try {
      const { search, loyaltyTier, minValue } = req.query;
      let customers;
      
      if (search || loyaltyTier || minValue) {
        customers = await this.customerService.searchCustomers({
          email: search,
          name: search,
          loyaltyTier,
          minLifetimeValue: minValue
        });
      } else {
        customers = this.db.db.prepare('SELECT * FROM customers ORDER BY lifetime_value DESC LIMIT 100').all();
      }
      
      res.json(customers);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getCustomer(req, res) {
    try {
      const customer = await this.customerService.getCustomerById(req.params.id);
      if (!customer) {
        return res.status(404).json({ error: 'Kunde nicht gefunden' });
      }
      res.json(customer);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async updateCustomer(req, res) {
    try {
      const updates = req.body;
      const updated = await this.db.updateCustomer(req.params.id, updates);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getCustomerOrders(req, res) {
    try {
      const orders = await this.customerService.getCustomerOrders(req.params.id);
      res.json(orders);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getCustomerReturns(req, res) {
    try {
      const returns = await this.customerService.getCustomerReturns(req.params.id);
      res.json(returns);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getCustomerCommunications(req, res) {
    try {
      const communications = await this.customerService.getCustomerCommunications(
        req.params.id,
        req.query.limit || 50
      );
      res.json(communications);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async addCustomerNote(req, res) {
    try {
      const { note, category } = req.body;
      await this.customerService.createCustomerNote(req.params.id, note, category);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async searchCustomers(req, res) {
    try {
      const customers = await this.customerService.searchCustomers(req.query);
      res.json(customers);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getHighValueCustomers(req, res) {
    try {
      const customers = await this.customerService.getHighValueCustomers(req.query.limit || 50);
      res.json(customers);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getAtRiskCustomers(req, res) {
    try {
      const customers = await this.customerService.getAtRiskCustomers(req.query.limit || 50);
      res.json(customers);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Order endpoints
  async getOrder(req, res) {
    try {
      const order = await this.db.getOrderById(req.params.id);
      if (!order) {
        return res.status(404).json({ error: 'Bestellung nicht gefunden' });
      }
      res.json(order);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getOrderByNumber(req, res) {
    try {
      const order = await this.db.getOrderByNumber(req.params.orderNumber);
      if (!order) {
        return res.status(404).json({ error: 'Bestellung nicht gefunden' });
      }
      res.json(order);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async updateOrderStatus(req, res) {
    try {
      const { status, trackingNumber, shippedAt, deliveredAt } = req.body;
      const updated = await this.db.updateOrderStatus(req.params.id, status, {
        tracking_number: trackingNumber,
        shipped_at: shippedAt,
        delivered_at: deliveredAt
      });
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Return endpoints
  async createReturn(req, res) {
    try {
      const { orderId, reason, comments, items, preferredMethod } = req.body;
      const order = await this.db.getOrderById(orderId);
      
      if (!order) {
        return res.status(404).json({ error: 'Bestellung nicht gefunden' });
      }
      
      const result = await this.returnService.createReturn(order, {
        reason,
        comments,
        items,
        preferredMethod
      });
      
      res.json(result);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async getReturns(req, res) {
    try {
      const returns = await this.returnService.getActiveReturns();
      res.json(returns);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getReturn(req, res) {
    try {
      const returnData = await this.db.getReturnById(req.params.id);
      if (!returnData) {
        return res.status(404).json({ error: 'Retoure nicht gefunden' });
      }
      res.json(returnData);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async updateReturnStatus(req, res) {
    try {
      const { status, notes } = req.body;
      const updated = await this.db.updateReturnStatus(req.params.id, status, { inspection_notes: notes });
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async processReturn(req, res) {
    try {
      const { action, notes } = req.body;
      await this.returnService.processReturn(req.params.id, action, notes);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Template endpoints
  async getTemplates(req, res) {
    try {
      const templates = await this.templateService.getAllTemplates();
      res.json(templates);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getTemplate(req, res) {
    try {
      const template = this.db.db.prepare('SELECT * FROM email_templates WHERE name = ?').get(req.params.name);
      if (!template) {
        return res.status(404).json({ error: 'Template nicht gefunden' });
      }
      res.json(template);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async createTemplate(req, res) {
    try {
      await this.templateService.createCustomTemplate(req.body);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async updateTemplate(req, res) {
    try {
      await this.templateService.updateTemplate(req.params.id, req.body);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async deleteTemplate(req, res) {
    try {
      await this.templateService.deleteTemplate(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async testTemplate(req, res) {
    try {
      const result = await this.templateService.testTemplate(req.params.name, req.body);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Agent control endpoints
  async startAgent(req, res) {
    try {
      const { interval = 60000 } = req.body;
      await this.emailAgent.start(interval);
      res.json({ success: true, status: 'started' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async stopAgent(req, res) {
    try {
      await this.emailAgent.stop();
      res.json({ success: true, status: 'stopped' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async processEmails(req, res) {
    try {
      await this.emailAgent.processNewEmails();
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Analytics endpoints
  async getAnalyticsOverview(req, res) {
    try {
      const { startDate, endDate } = req.query;
      const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const end = endDate || new Date().toISOString();
      
      const stats = await this.emailAgent.getAgentStats(start, end);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getEmailAnalytics(req, res) {
    try {
      const { startDate, endDate } = req.query;
      const emailStats = await this.db.getEmailStats(startDate, endDate);
      const categoryStats = await this.db.getCategoryStats(startDate, endDate);
      
      res.json({
        overall: emailStats,
        byCategory: categoryStats
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getReturnAnalytics(req, res) {
    try {
      const { startDate, endDate } = req.query;
      const metrics = await this.returnService.getReturnMetrics(startDate, endDate);
      res.json(metrics);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getCustomerAnalytics(req, res) {
    try {
      const stmt = this.db.db.prepare(`
        SELECT 
          COUNT(*) as total_customers,
          COUNT(CASE WHEN loyalty_tier = 'vip' THEN 1 END) as vip_customers,
          COUNT(CASE WHEN loyalty_tier = 'platinum' THEN 1 END) as platinum_customers,
          AVG(lifetime_value) as avg_lifetime_value,
          AVG(return_rate) as avg_return_rate,
          AVG(satisfaction_score) as avg_satisfaction
        FROM customers
      `);
      
      const stats = stmt.get();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Webhook endpoints
  async handleShopifyWebhook(req, res) {
    try {
      const { topic, data } = req.body;
      
      switch (topic) {
        case 'orders/create':
          await this.handleNewOrder(data, 'shopify');
          break;
        case 'orders/updated':
          await this.handleOrderUpdate(data, 'shopify');
          break;
        case 'customers/create':
          await this.handleNewCustomer(data, 'shopify');
          break;
      }
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async handleWooCommerceWebhook(req, res) {
    try {
      const { event, data } = req.body;
      
      switch (event) {
        case 'order.created':
          await this.handleNewOrder(data, 'woocommerce');
          break;
        case 'order.updated':
          await this.handleOrderUpdate(data, 'woocommerce');
          break;
        case 'customer.created':
          await this.handleNewCustomer(data, 'woocommerce');
          break;
      }
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Helper methods for webhooks
  async handleNewOrder(orderData, platform) {
    // Transform order data based on platform
    const normalizedOrder = this.normalizeOrderData(orderData, platform);
    
    // Create or update customer
    const customer = await this.customerService.createOrUpdateCustomer({
      from: `${normalizedOrder.customerName} <${normalizedOrder.customerEmail}>`
    });
    
    // Create order
    await this.db.createOrder({
      customer_id: customer.id,
      order_number: normalizedOrder.orderNumber,
      status: normalizedOrder.status,
      total_amount: normalizedOrder.total,
      currency: normalizedOrder.currency,
      shipping_address: JSON.stringify(normalizedOrder.shippingAddress),
      billing_address: JSON.stringify(normalizedOrder.billingAddress),
      shipping_method: normalizedOrder.shippingMethod,
      payment_method: normalizedOrder.paymentMethod
    });
  }

  async handleOrderUpdate(orderData, platform) {
    const normalizedOrder = this.normalizeOrderData(orderData, platform);
    const order = await this.db.getOrderByNumber(normalizedOrder.orderNumber);
    
    if (order) {
      await this.db.updateOrderStatus(order.id, normalizedOrder.status, {
        tracking_number: normalizedOrder.trackingNumber,
        shipped_at: normalizedOrder.shippedAt,
        delivered_at: normalizedOrder.deliveredAt
      });
    }
  }

  async handleNewCustomer(customerData, platform) {
    const normalizedCustomer = this.normalizeCustomerData(customerData, platform);
    await this.db.createCustomer(normalizedCustomer);
  }

  normalizeOrderData(data, platform) {
    // Platform-specific normalization
    if (platform === 'shopify') {
      return {
        orderNumber: data.order_number,
        customerEmail: data.email,
        customerName: data.customer?.default_address?.name || 'Customer',
        status: data.fulfillment_status || 'pending',
        total: parseFloat(data.total_price),
        currency: data.currency,
        shippingAddress: data.shipping_address,
        billingAddress: data.billing_address,
        shippingMethod: data.shipping_lines?.[0]?.title,
        paymentMethod: data.payment_gateway_names?.[0],
        trackingNumber: data.fulfillments?.[0]?.tracking_number,
        shippedAt: data.fulfillments?.[0]?.created_at,
        deliveredAt: null
      };
    } else if (platform === 'woocommerce') {
      return {
        orderNumber: data.number,
        customerEmail: data.billing?.email,
        customerName: `${data.billing?.first_name} ${data.billing?.last_name}`,
        status: data.status,
        total: parseFloat(data.total),
        currency: data.currency,
        shippingAddress: data.shipping,
        billingAddress: data.billing,
        shippingMethod: data.shipping_lines?.[0]?.method_title,
        paymentMethod: data.payment_method_title,
        trackingNumber: data.meta_data?.find(m => m.key === '_tracking_number')?.value,
        shippedAt: data.date_completed,
        deliveredAt: null
      };
    }
    
    return data;
  }

  normalizeCustomerData(data, platform) {
    if (platform === 'shopify') {
      return {
        email: data.email,
        name: `${data.first_name} ${data.last_name}`,
        phone: data.phone,
        address: JSON.stringify(data.default_address),
        loyalty_tier: data.tags?.includes('VIP') ? 'vip' : 'standard'
      };
    } else if (platform === 'woocommerce') {
      return {
        email: data.email,
        name: `${data.first_name} ${data.last_name}`,
        phone: data.billing?.phone,
        address: JSON.stringify(data.billing),
        loyalty_tier: 'standard'
      };
    }
    
    return data;
  }
}