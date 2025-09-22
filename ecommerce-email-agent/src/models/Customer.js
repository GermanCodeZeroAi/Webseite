export class Customer {
  constructor(data) {
    this.id = data.id;
    this.email = data.email;
    this.name = data.name;
    this.phone = data.phone;
    this.address = data.address;
    this.orderHistory = data.orderHistory || [];
    this.totalSpent = data.totalSpent || 0;
    this.loyaltyTier = data.loyaltyTier || 'standard';
    this.preferredLanguage = data.preferredLanguage || 'de';
    this.notes = data.notes || [];
    this.tags = data.tags || [];
    this.createdAt = data.createdAt || new Date();
    this.lastOrderDate = data.lastOrderDate;
    this.lifetimeValue = data.lifetimeValue || 0;
    this.returnRate = data.returnRate || 0;
    this.satisfactionScore = data.satisfactionScore;
  }

  static loyaltyTiers = {
    STANDARD: 'standard',
    SILVER: 'silver',
    GOLD: 'gold',
    PLATINUM: 'platinum',
    VIP: 'vip'
  };

  isHighValue() {
    return this.lifetimeValue > 1000 || this.loyaltyTier === 'vip' || this.loyaltyTier === 'platinum';
  }

  hasHighReturnRate() {
    return this.returnRate > 0.3; // 30% return rate
  }
}