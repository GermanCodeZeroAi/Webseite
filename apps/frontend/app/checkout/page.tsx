/**
 * Checkout Page
 * 
 * Mock implementation for testing purposes
 */

'use client';

import React, { useState, useEffect } from 'react';

interface OrderSummary {
  items: Array<{
    name: string;
    price: number;
    quantity: number;
  }>;
  subtotal: number;
  discount?: number;
  vat: number;
  total: number;
  currency: string;
}

interface CustomerInfo {
  email: string;
  name: string;
  company: string;
  phone?: string;
  address?: string;
}

export default function CheckoutPage() {
  const [orderSummary] = useState<OrderSummary>({
    items: [
      { name: 'Base Starter', price: 99, quantity: 1 },
      { name: 'Analytics Module', price: 49, quantity: 1 },
    ],
    subtotal: 148,
    discount: 74, // 50% LAUNCH50 discount
    vat: 14.06, // 19% VAT on discounted amount
    total: 88.06,
    currency: 'EUR',
  });

  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    email: '',
    name: '',
    company: '',
    phone: '',
    address: '',
  });

  const [paymentMethod, setPaymentMethod] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!customerInfo.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(customerInfo.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!customerInfo.name) {
      newErrors.name = 'Name is required';
    }

    if (!customerInfo.company) {
      newErrors.company = 'Company is required';
    }

    if (!termsAccepted) {
      newErrors.terms = 'You must accept the terms and conditions';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof CustomerInfo, value: string) => {
    setCustomerInfo(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubmitOrder = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setCheckoutError('');

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simulate success/failure
      const success = Math.random() > 0.3; // 70% success rate for testing
      
      if (success) {
        setCheckoutSuccess(true);
        // In real app, would redirect to success page
      } else {
        throw new Error('Payment processing failed');
      }
    } catch (error) {
      setCheckoutError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (checkoutSuccess) {
    return (
      <div data-testid="checkout-success" className="checkout-success">
        <div className="container">
          <div className="success-content">
            <h1>Order Confirmed!</h1>
            <p>Thank you for your order. You will receive a confirmation email shortly.</p>
            <div className="order-details">
              <p>Order ID: #{Math.random().toString(36).substr(2, 9).toUpperCase()}</p>
              <p>Total: €{orderSummary.total.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div data-testid="checkout-container" className="checkout-page">
      <div className="container">
        <header className="page-header">
          <h1>Checkout</h1>
          <p>Complete your order</p>
        </header>

        <div className="checkout-content">
          <div className="checkout-form-section">
            <form data-testid="checkout-form" role="form" onSubmit={(e) => e.preventDefault()}>
              <div className="form-section">
                <h2>Customer Information</h2>
                
                <div className="form-group">
                  <label htmlFor="email">Email Address *</label>
                  <input
                    type="email"
                    id="email"
                    data-testid="email-input"
                    required
                    value={customerInfo.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    aria-label="Email address"
                  />
                  {errors.email && (
                    <div data-testid="validation-error" className="error-message">
                      {errors.email}
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="name">Full Name *</label>
                  <input
                    type="text"
                    id="name"
                    data-testid="name-input"
                    required
                    value={customerInfo.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    aria-label="Full name"
                  />
                  {errors.name && (
                    <div data-testid="validation-error" className="error-message">
                      {errors.name}
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="company">Company *</label>
                  <input
                    type="text"
                    id="company"
                    data-testid="company-input"
                    required
                    value={customerInfo.company}
                    onChange={(e) => handleInputChange('company', e.target.value)}
                    aria-label="Company name"
                  />
                  {errors.company && (
                    <div data-testid="validation-error" className="error-message">
                      {errors.company}
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="phone">Phone Number</label>
                  <input
                    type="tel"
                    id="phone"
                    data-testid="phone-input"
                    value={customerInfo.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    aria-label="Phone number"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="address">Address</label>
                  <textarea
                    id="address"
                    data-testid="address-input"
                    value={customerInfo.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    aria-label="Address"
                    rows={3}
                  />
                </div>
              </div>

              <div className="form-section">
                <h2>Payment Method</h2>
                
                <div className="payment-methods">
                  <div className="payment-option">
                    <input
                      type="radio"
                      id="card"
                      name="payment"
                      value="card"
                      data-testid="payment-method"
                      checked={paymentMethod === 'card'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                    />
                    <label htmlFor="card">Credit Card</label>
                  </div>
                  
                  <div className="payment-option">
                    <input
                      type="radio"
                      id="invoice"
                      name="payment"
                      value="invoice"
                      data-testid="payment-method"
                      checked={paymentMethod === 'invoice'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                    />
                    <label htmlFor="invoice">Invoice (NET 30)</label>
                  </div>
                </div>

                {paymentMethod === 'card' && (
                  <div data-testid="stripe-card-element" className="card-element">
                    <div className="stripe-placeholder">
                      [Stripe Card Element would be here]
                    </div>
                  </div>
                )}
              </div>

              <div className="form-section">
                <div className="terms-section">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      data-testid="terms-checkbox"
                      checked={termsAccepted}
                      onChange={(e) => setTermsAccepted(e.target.checked)}
                    />
                    I accept the <a href="/terms" target="_blank">Terms and Conditions</a>
                  </label>
                  {errors.terms && (
                    <div data-testid="validation-error" className="error-message">
                      {errors.terms}
                    </div>
                  )}
                </div>
              </div>

              {checkoutError && (
                <div data-testid="checkout-error" className="error-message">
                  {checkoutError}
                </div>
              )}

              <button
                type="button"
                data-testid="submit-order"
                className="submit-button"
                onClick={handleSubmitOrder}
                disabled={loading}
              >
                {loading ? 'Processing...' : `Complete Order - €${orderSummary.total.toFixed(2)}`}
              </button>
            </form>
          </div>

          <div className="order-summary-section">
            <div data-testid="order-summary" className="order-summary">
              <h2>Order Summary</h2>
              
              <div className="order-items">
                {orderSummary.items.map((item, index) => (
                  <div key={index} className="order-item">
                    <span className="item-name">{item.name}</span>
                    <span className="item-price">€{item.price.toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="order-totals">
                <div data-testid="base-price" className="total-line">
                  <span>Subtotal:</span>
                  <span>€{orderSummary.subtotal.toFixed(2)}</span>
                </div>
                
                {orderSummary.discount && (
                  <div data-testid="discount-amount" className="total-line discount">
                    <span>Discount:</span>
                    <span>-€{orderSummary.discount.toFixed(2)}</span>
                  </div>
                )}
                
                <div data-testid="vat-amount" className="total-line">
                  <span>VAT (19%):</span>
                  <span>€{orderSummary.vat.toFixed(2)}</span>
                </div>
                
                <div data-testid="total-price" className="total-line final-total">
                  <span>Total:</span>
                  <span>€{orderSummary.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .checkout-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #000000 0%, #1a1a1a 100%);
          color: #ffffff;
          padding: 2rem 0;
        }

        .checkout-success {
          min-height: 100vh;
          background: linear-gradient(135deg, #000000 0%, #1a1a1a 100%);
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .success-content {
          text-align: center;
          padding: 3rem;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          border: 1px solid #FFD700;
        }

        .success-content h1 {
          color: #FFD700;
          margin-bottom: 1rem;
        }

        .order-details {
          margin-top: 2rem;
          padding-top: 2rem;
          border-top: 1px solid rgba(255, 215, 0, 0.3);
        }

        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 2rem;
        }

        .page-header {
          text-align: center;
          margin-bottom: 3rem;
        }

        .page-header h1 {
          font-size: 2.5rem;
          color: #FFD700;
          margin-bottom: 0.5rem;
        }

        .checkout-content {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 3rem;
        }

        .form-section {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 8px;
          padding: 2rem;
          margin-bottom: 2rem;
        }

        .form-section h2 {
          color: #FFD700;
          margin-bottom: 1.5rem;
        }

        .form-group {
          margin-bottom: 1.5rem;
        }

        .form-group label {
          display: block;
          margin-bottom: 0.5rem;
          color: #FFD700;
          font-weight: 500;
        }

        .form-group input,
        .form-group textarea {
          width: 100%;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 215, 0, 0.3);
          color: #ffffff;
          padding: 0.75rem;
          border-radius: 4px;
          font-size: 1rem;
        }

        .form-group input:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: #FFD700;
          box-shadow: 0 0 0 2px rgba(255, 215, 0, 0.2);
        }

        .payment-methods {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .payment-option {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .payment-option input[type="radio"] {
          width: auto;
        }

        .card-element {
          margin-top: 1rem;
          padding: 1rem;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 215, 0, 0.3);
          border-radius: 4px;
        }

        .stripe-placeholder {
          color: rgba(255, 255, 255, 0.7);
          font-style: italic;
        }

        .terms-section {
          margin-top: 2rem;
        }

        .checkbox-label {
          display: flex;
          align-items: flex-start;
          gap: 0.5rem;
          cursor: pointer;
        }

        .checkbox-label input[type="checkbox"] {
          width: auto;
          margin-top: 0.2rem;
        }

        .checkbox-label a {
          color: #FFD700;
          text-decoration: underline;
        }

        .error-message {
          color: #ff6b6b;
          font-size: 0.875rem;
          margin-top: 0.5rem;
        }

        .submit-button {
          width: 100%;
          background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
          color: #000000;
          border: none;
          padding: 1rem 2rem;
          border-radius: 8px;
          font-size: 1.1rem;
          font-weight: bold;
          cursor: pointer;
          transition: all 0.3s ease;
          margin-top: 2rem;
        }

        .submit-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(255, 215, 0, 0.4);
        }

        .submit-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none;
        }

        .order-summary {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 8px;
          padding: 2rem;
          height: fit-content;
          position: sticky;
          top: 2rem;
        }

        .order-summary h2 {
          color: #FFD700;
          margin-bottom: 1.5rem;
        }

        .order-items {
          margin-bottom: 2rem;
        }

        .order-item {
          display: flex;
          justify-content: space-between;
          margin-bottom: 0.75rem;
          padding-bottom: 0.75rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .item-name {
          color: #ffffff;
        }

        .item-price {
          color: #FFD700;
          font-weight: 500;
        }

        .order-totals {
          border-top: 1px solid rgba(255, 215, 0, 0.3);
          padding-top: 1rem;
        }

        .total-line {
          display: flex;
          justify-content: space-between;
          margin-bottom: 0.5rem;
        }

        .total-line.discount {
          color: #00ff00;
        }

        .total-line.final-total {
          font-size: 1.2rem;
          font-weight: bold;
          border-top: 1px solid #FFD700;
          padding-top: 0.5rem;
          margin-top: 1rem;
        }

        @media (max-width: 768px) {
          .checkout-content {
            grid-template-columns: 1fr;
          }
          
          .order-summary {
            position: static;
          }
        }
      `}</style>
    </div>
  );
}