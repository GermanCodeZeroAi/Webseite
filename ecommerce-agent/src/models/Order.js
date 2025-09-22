export class Order {
  constructor(data) {
    this.id = data.id;
    this.customerId = data.customerId;
    this.orderNumber = data.orderNumber;
    this.status = data.status || 'pending';
    this.items = data.items || [];
    this.totalAmount = data.totalAmount;
    self.currency = data.currency || 'EUR';
    this.shippingAddress = data.shippingAddress;
    this.billingAddress = data.billingAddress;
    this.shippingMethod = data.shippingMethod;
    this.trackingNumber = data.trackingNumber;
    this.paymentMethod = data.paymentMethod;
    this.paymentStatus = data.paymentStatus || 'pending';
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
    this.shippedAt = data.shippedAt;
    this.deliveredAt = data.deliveredAt;
    this.returnRequested = data.returnRequested || false;
    this.returnReason = data.returnReason;
    this.refundAmount = data.refundAmount;
    this.notes = data.notes || [];
  }

  static statuses = {
    PENDING: 'pending',
    CONFIRMED: 'confirmed',
    PROCESSING: 'processing',
    SHIPPED: 'shipped',
    IN_TRANSIT: 'in_transit',
    DELIVERED: 'delivered',
    CANCELLED: 'cancelled',
    RETURNED: 'returned',
    REFUNDED: 'refunded',
    PARTIALLY_REFUNDED: 'partially_refunded'
  };

  static paymentStatuses = {
    PENDING: 'pending',
    PAID: 'paid',
    FAILED: 'failed',
    REFUNDED: 'refunded',
    PARTIALLY_REFUNDED: 'partially_refunded'
  };

  canBeReturned(returnPolicyDays = 30) {
    if (!this.deliveredAt) return false;
    const daysSinceDelivery = (new Date() - new Date(this.deliveredAt)) / (1000 * 60 * 60 * 24);
    return daysSinceDelivery <= returnPolicyDays && !this.returnRequested;
  }

  getOrderAge() {
    return Math.floor((new Date() - new Date(this.createdAt)) / (1000 * 60 * 60 * 24));
  }
}