export class Email {
  constructor(data) {
    this.id = data.id;
    this.messageId = data.messageId;
    this.from = data.from;
    this.to = data.to;
    this.subject = data.subject;
    this.body = data.body;
    this.html = data.html;
    this.date = data.date;
    this.attachments = data.attachments || [];
    this.category = data.category || 'uncategorized';
    this.priority = data.priority || 'normal';
    this.status = data.status || 'unread';
    this.customerId = data.customerId;
    this.orderId = data.orderId;
    this.sentiment = data.sentiment;
    this.tags = data.tags || [];
    this.responseId = data.responseId;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  static categories = {
    ORDER_INQUIRY: 'order_inquiry',
    RETURN_REQUEST: 'return_request',
    SHIPPING_ISSUE: 'shipping_issue',
    PRODUCT_QUESTION: 'product_question',
    COMPLAINT: 'complaint',
    PAYMENT_ISSUE: 'payment_issue',
    TECHNICAL_SUPPORT: 'technical_support',
    GENERAL_INQUIRY: 'general_inquiry',
    REFUND_REQUEST: 'refund_request',
    EXCHANGE_REQUEST: 'exchange_request',
    CANCELLATION: 'cancellation',
    FEEDBACK: 'feedback'
  };

  static priorities = {
    LOW: 'low',
    NORMAL: 'normal',
    HIGH: 'high',
    URGENT: 'urgent'
  };

  static statuses = {
    UNREAD: 'unread',
    READ: 'read',
    IN_PROGRESS: 'in_progress',
    RESPONDED: 'responded',
    RESOLVED: 'resolved',
    ESCALATED: 'escalated'
  };
}