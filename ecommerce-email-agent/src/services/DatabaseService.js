import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class DatabaseService {
  constructor(dbPath) {
    this.db = new Database(dbPath || path.join(__dirname, '../../data/ecommerce.db'));
    this.initializeTables();
  }

  initializeTables() {
    // Customers table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS customers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        name TEXT,
        phone TEXT,
        address TEXT,
        loyalty_tier TEXT DEFAULT 'standard',
        preferred_language TEXT DEFAULT 'de',
        lifetime_value REAL DEFAULT 0,
        return_rate REAL DEFAULT 0,
        satisfaction_score REAL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Orders table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_id INTEGER,
        order_number TEXT UNIQUE NOT NULL,
        status TEXT DEFAULT 'pending',
        total_amount REAL,
        currency TEXT DEFAULT 'EUR',
        shipping_address TEXT,
        billing_address TEXT,
        shipping_method TEXT,
        tracking_number TEXT,
        payment_method TEXT,
        payment_status TEXT DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        shipped_at DATETIME,
        delivered_at DATETIME,
        FOREIGN KEY (customer_id) REFERENCES customers(id)
      )
    `);

    // Order items table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS order_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER,
        product_id TEXT,
        product_name TEXT,
        quantity INTEGER,
        price REAL,
        sku TEXT,
        FOREIGN KEY (order_id) REFERENCES orders(id)
      )
    `);

    // Emails table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS emails (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        message_id TEXT UNIQUE,
        from_email TEXT,
        to_email TEXT,
        subject TEXT,
        body TEXT,
        html TEXT,
        category TEXT DEFAULT 'uncategorized',
        priority TEXT DEFAULT 'normal',
        status TEXT DEFAULT 'unread',
        customer_id INTEGER,
        order_id INTEGER,
        sentiment TEXT,
        date DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (customer_id) REFERENCES customers(id),
        FOREIGN KEY (order_id) REFERENCES orders(id)
      )
    `);

    // Email tags table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS email_tags (
        email_id INTEGER,
        tag TEXT,
        FOREIGN KEY (email_id) REFERENCES emails(id),
        PRIMARY KEY (email_id, tag)
      )
    `);

    // Returns table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS returns (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER,
        customer_id INTEGER,
        return_number TEXT UNIQUE NOT NULL,
        status TEXT DEFAULT 'requested',
        reason TEXT,
        reason_category TEXT,
        customer_comments TEXT,
        return_method TEXT,
        return_label TEXT,
        tracking_number TEXT,
        refund_amount REAL,
        refund_method TEXT,
        replacement_requested BOOLEAN DEFAULT 0,
        restocking_fee REAL DEFAULT 0,
        inspection_notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        approved_at DATETIME,
        received_at DATETIME,
        processed_at DATETIME,
        FOREIGN KEY (order_id) REFERENCES orders(id),
        FOREIGN KEY (customer_id) REFERENCES customers(id)
      )
    `);

    // Return items table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS return_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        return_id INTEGER,
        order_item_id INTEGER,
        quantity INTEGER,
        condition TEXT,
        FOREIGN KEY (return_id) REFERENCES returns(id),
        FOREIGN KEY (order_item_id) REFERENCES order_items(id)
      )
    `);

    // Email templates table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS email_templates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        category TEXT,
        subject TEXT,
        body TEXT,
        variables TEXT,
        language TEXT DEFAULT 'de',
        active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Email responses table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS email_responses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        original_email_id INTEGER,
        response_text TEXT,
        sent_at DATETIME,
        template_used TEXT,
        agent_notes TEXT,
        FOREIGN KEY (original_email_id) REFERENCES emails(id)
      )
    `);

    // Create indexes for better performance
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_emails_customer ON emails(customer_id);
      CREATE INDEX IF NOT EXISTS idx_emails_status ON emails(status);
      CREATE INDEX IF NOT EXISTS idx_emails_category ON emails(category);
      CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
      CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
      CREATE INDEX IF NOT EXISTS idx_returns_order ON returns(order_id);
      CREATE INDEX IF NOT EXISTS idx_returns_status ON returns(status);
    `);
  }

  // Customer methods
  createCustomer(customerData) {
    const stmt = this.db.prepare(`
      INSERT INTO customers (email, name, phone, address, loyalty_tier, preferred_language)
      VALUES (@email, @name, @phone, @address, @loyalty_tier, @preferred_language)
    `);
    const result = stmt.run(customerData);
    return this.getCustomerById(result.lastInsertRowid);
  }

  getCustomerByEmail(email) {
    const stmt = this.db.prepare('SELECT * FROM customers WHERE email = ?');
    return stmt.get(email);
  }

  getCustomerById(id) {
    const stmt = this.db.prepare('SELECT * FROM customers WHERE id = ?');
    return stmt.get(id);
  }

  updateCustomer(id, updates) {
    const fields = Object.keys(updates).map(key => `${key} = @${key}`).join(', ');
    const stmt = this.db.prepare(`
      UPDATE customers 
      SET ${fields}, updated_at = CURRENT_TIMESTAMP 
      WHERE id = @id
    `);
    stmt.run({ ...updates, id });
    return this.getCustomerById(id);
  }

  // Order methods
  createOrder(orderData) {
    const stmt = this.db.prepare(`
      INSERT INTO orders (
        customer_id, order_number, status, total_amount, currency,
        shipping_address, billing_address, shipping_method, payment_method
      ) VALUES (
        @customer_id, @order_number, @status, @total_amount, @currency,
        @shipping_address, @billing_address, @shipping_method, @payment_method
      )
    `);
    const result = stmt.run(orderData);
    return result.lastInsertRowid;
  }

  getOrderById(id) {
    const stmt = this.db.prepare('SELECT * FROM orders WHERE id = ?');
    const order = stmt.get(id);
    if (order) {
      const itemsStmt = this.db.prepare('SELECT * FROM order_items WHERE order_id = ?');
      order.items = itemsStmt.all(id);
    }
    return order;
  }

  getOrderByNumber(orderNumber) {
    const stmt = this.db.prepare('SELECT * FROM orders WHERE order_number = ?');
    const order = stmt.get(orderNumber);
    if (order) {
      const itemsStmt = this.db.prepare('SELECT * FROM order_items WHERE order_id = ?');
      order.items = itemsStmt.all(order.id);
    }
    return order;
  }

  getCustomerOrders(customerId) {
    const stmt = this.db.prepare('SELECT * FROM orders WHERE customer_id = ? ORDER BY created_at DESC');
    return stmt.all(customerId);
  }

  updateOrderStatus(id, status, additionalFields = {}) {
    const fields = { status, ...additionalFields };
    const fieldsList = Object.keys(fields).map(key => `${key} = @${key}`).join(', ');
    const stmt = this.db.prepare(`
      UPDATE orders 
      SET ${fieldsList}, updated_at = CURRENT_TIMESTAMP 
      WHERE id = @id
    `);
    stmt.run({ ...fields, id });
    return this.getOrderById(id);
  }

  // Email methods
  saveEmail(emailData) {
    const stmt = this.db.prepare(`
      INSERT INTO emails (
        message_id, from_email, to_email, subject, body, html,
        category, priority, status, customer_id, order_id, sentiment, date
      ) VALUES (
        @message_id, @from_email, @to_email, @subject, @body, @html,
        @category, @priority, @status, @customer_id, @order_id, @sentiment, @date
      )
    `);
    const result = stmt.run(emailData);
    return result.lastInsertRowid;
  }

  getEmailById(id) {
    const stmt = this.db.prepare('SELECT * FROM emails WHERE id = ?');
    const email = stmt.get(id);
    if (email) {
      const tagsStmt = this.db.prepare('SELECT tag FROM email_tags WHERE email_id = ?');
      email.tags = tagsStmt.all(id).map(row => row.tag);
    }
    return email;
  }

  getEmailsByStatus(status, limit = 100) {
    const stmt = this.db.prepare('SELECT * FROM emails WHERE status = ? ORDER BY date DESC LIMIT ?');
    return stmt.all(status, limit);
  }

  getEmailsByCategory(category, limit = 100) {
    const stmt = this.db.prepare('SELECT * FROM emails WHERE category = ? ORDER BY date DESC LIMIT ?');
    return stmt.all(category, limit);
  }

  updateEmailStatus(id, status) {
    const stmt = this.db.prepare('UPDATE emails SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
    stmt.run(status, id);
  }

  addEmailTag(emailId, tag) {
    const stmt = this.db.prepare('INSERT OR IGNORE INTO email_tags (email_id, tag) VALUES (?, ?)');
    stmt.run(emailId, tag);
  }

  // Return methods
  createReturn(returnData) {
    const stmt = this.db.prepare(`
      INSERT INTO returns (
        order_id, customer_id, return_number, status, reason, reason_category,
        customer_comments, return_method, refund_amount, replacement_requested
      ) VALUES (
        @order_id, @customer_id, @return_number, @status, @reason, @reason_category,
        @customer_comments, @return_method, @refund_amount, @replacement_requested
      )
    `);
    const result = stmt.run(returnData);
    return result.lastInsertRowid;
  }

  getReturnById(id) {
    const stmt = this.db.prepare('SELECT * FROM returns WHERE id = ?');
    const returnData = stmt.get(id);
    if (returnData) {
      const itemsStmt = this.db.prepare(`
        SELECT ri.*, oi.product_name, oi.price 
        FROM return_items ri 
        JOIN order_items oi ON ri.order_item_id = oi.id 
        WHERE ri.return_id = ?
      `);
      returnData.items = itemsStmt.all(id);
    }
    return returnData;
  }

  getReturnByNumber(returnNumber) {
    const stmt = this.db.prepare('SELECT * FROM returns WHERE return_number = ?');
    return stmt.get(returnNumber);
  }

  updateReturnStatus(id, status, additionalFields = {}) {
    const fields = { status, ...additionalFields };
    const fieldsList = Object.keys(fields).map(key => `${key} = @${key}`).join(', ');
    const stmt = this.db.prepare(`UPDATE returns SET ${fieldsList} WHERE id = @id`);
    stmt.run({ ...fields, id });
    return this.getReturnById(id);
  }

  getActiveReturns() {
    const stmt = this.db.prepare(`
      SELECT r.*, c.email, c.name, o.order_number 
      FROM returns r
      JOIN customers c ON r.customer_id = c.id
      JOIN orders o ON r.order_id = o.id
      WHERE r.status NOT IN ('refunded', 'rejected', 'cancelled')
      ORDER BY r.created_at DESC
    `);
    return stmt.all();
  }

  // Template methods
  createEmailTemplate(templateData) {
    const stmt = this.db.prepare(`
      INSERT INTO email_templates (name, category, subject, body, variables, language)
      VALUES (@name, @category, @subject, @body, @variables, @language)
    `);
    stmt.run(templateData);
  }

  getTemplateByCategory(category, language = 'de') {
    const stmt = this.db.prepare(`
      SELECT * FROM email_templates 
      WHERE category = ? AND language = ? AND active = 1 
      ORDER BY created_at DESC LIMIT 1
    `);
    return stmt.get(category, language);
  }

  getAllTemplates() {
    const stmt = this.db.prepare('SELECT * FROM email_templates WHERE active = 1 ORDER BY category, language');
    return stmt.all();
  }

  // Analytics methods
  getEmailStats(startDate, endDate) {
    const stmt = this.db.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as resolved,
        SUM(CASE WHEN status = 'escalated' THEN 1 ELSE 0 END) as escalated,
        AVG(CASE WHEN status = 'resolved' THEN julianday(updated_at) - julianday(created_at) END) as avg_resolution_time
      FROM emails
      WHERE created_at BETWEEN ? AND ?
    `);
    return stmt.get(startDate, endDate);
  }

  getCategoryStats(startDate, endDate) {
    const stmt = this.db.prepare(`
      SELECT category, COUNT(*) as count
      FROM emails
      WHERE created_at BETWEEN ? AND ?
      GROUP BY category
      ORDER BY count DESC
    `);
    return stmt.all(startDate, endDate);
  }

  getReturnStats(startDate, endDate) {
    const stmt = this.db.prepare(`
      SELECT 
        COUNT(*) as total_returns,
        SUM(refund_amount) as total_refunds,
        AVG(julianday(processed_at) - julianday(created_at)) as avg_processing_days,
        reason_category,
        COUNT(*) as reason_count
      FROM returns
      WHERE created_at BETWEEN ? AND ?
      GROUP BY reason_category
    `);
    return stmt.all(startDate, endDate);
  }

  close() {
    this.db.close();
  }
}