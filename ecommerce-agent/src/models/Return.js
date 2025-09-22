export class Return {
  constructor(data) {
    this.id = data.id;
    this.orderId = data.orderId;
    this.customerId = data.customerId;
    this.returnNumber = data.returnNumber;
    this.status = data.status || 'requested';
    this.items = data.items || [];
    this.reason = data.reason;
    this.reasonCategory = data.reasonCategory;
    this.customerComments = data.customerComments;
    this.returnMethod = data.returnMethod;
    this.returnLabel = data.returnLabel;
    this.trackingNumber = data.trackingNumber;
    this.refundAmount = data.refundAmount;
    this.refundMethod = data.refundMethod;
    this.replacementRequested = data.replacementRequested || false;
    this.replacementItems = data.replacementItems || [];
    this.createdAt = data.createdAt || new Date();
    this.approvedAt = data.approvedAt;
    this.receivedAt = data.receivedAt;
    this.processedAt = data.processedAt;
    this.inspectionNotes = data.inspectionNotes;
    this.restockingFee = data.restockingFee || 0;
  }

  static statuses = {
    REQUESTED: 'requested',
    APPROVED: 'approved',
    LABEL_SENT: 'label_sent',
    IN_TRANSIT: 'in_transit',
    RECEIVED: 'received',
    INSPECTING: 'inspecting',
    PROCESSED: 'processed',
    REFUNDED: 'refunded',
    REJECTED: 'rejected',
    CANCELLED: 'cancelled'
  };

  static reasonCategories = {
    DEFECTIVE: 'defective',
    WRONG_ITEM: 'wrong_item',
    NOT_AS_DESCRIBED: 'not_as_described',
    DAMAGED: 'damaged',
    SIZE_ISSUE: 'size_issue',
    COLOR_ISSUE: 'color_issue',
    QUALITY_ISSUE: 'quality_issue',
    CHANGED_MIND: 'changed_mind',
    FOUND_CHEAPER: 'found_cheaper',
    OTHER: 'other'
  };

  static returnMethods = {
    PREPAID_LABEL: 'prepaid_label',
    CUSTOMER_SHIP: 'customer_ship',
    PICKUP: 'pickup',
    DROP_OFF: 'drop_off'
  };

  getTotalReturnValue() {
    return this.items.reduce((total, item) => total + (item.price * item.quantity), 0);
  }

  getProcessingTime() {
    if (!this.processedAt || !this.createdAt) return null;
    return Math.floor((new Date(this.processedAt) - new Date(this.createdAt)) / (1000 * 60 * 60 * 24));
  }
}