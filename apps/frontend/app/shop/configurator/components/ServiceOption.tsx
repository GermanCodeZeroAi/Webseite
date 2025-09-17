/**
 * Service Option Component
 * 
 * Individual service selection with clear benefits
 */

'use client';

import React from 'react';

interface ServiceOptionProps {
  id: string;
  name: string;
  description: string;
  benefits: string[];
  price: number;
  billingCycle: 'monthly' | 'annual' | 'one-time';
  selected: boolean;
  onToggle: (id: string) => void;
}

export default function ServiceOption({
  id,
  name,
  description,
  benefits,
  price,
  billingCycle,
  selected,
  onToggle
}: ServiceOptionProps) {
  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('en-EU', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getPriceLabel = () => {
    switch (billingCycle) {
      case 'monthly':
        return '/month';
      case 'annual':
        return '/year';
      case 'one-time':
        return 'one-time';
      default:
        return '';
    }
  };

  const handleClick = () => {
    onToggle(id);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onToggle(id);
    }
  };

  return (
    <div 
      className={`service-option ${selected ? 'selected' : ''}`}
      data-testid="config-option"
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      aria-pressed={selected}
      aria-describedby={`${id}-description`}
    >
      <div className="option-header">
        <div className="option-title">
          <h3>{name}</h3>
          <div className="option-price">
            {formatPrice(price)}{getPriceLabel()}
          </div>
        </div>
        <div className="option-checkbox">
          <input
            type="checkbox"
            checked={selected}
            onChange={() => onToggle(id)}
            tabIndex={-1}
            aria-hidden="true"
          />
        </div>
      </div>

      <div id={`${id}-description`} className="option-content">
        <p className="option-description">{description}</p>
        
        <div className="option-benefits">
          <h4>Key Benefits:</h4>
          <ul>
            {benefits.map((benefit, index) => (
              <li key={index}>
                <span className="benefit-icon">✓</span>
                {benefit}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <style jsx>{`
        .service-option {
          background: rgba(255, 255, 255, 0.05);
          border: 2px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 1.5rem;
          cursor: pointer;
          transition: all 0.3s ease;
          position: relative;
        }

        .service-option:hover {
          border-color: rgba(255, 215, 0, 0.5);
          transform: translateY(-2px);
        }

        .service-option:focus {
          outline: none;
          border-color: #FFD700;
          box-shadow: 0 0 0 3px rgba(255, 215, 0, 0.3);
        }

        .service-option.selected {
          border-color: #FFD700;
          background: rgba(255, 215, 0, 0.1);
        }

        .option-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1rem;
        }

        .option-title h3 {
          margin: 0 0 0.5rem 0;
          color: #FFD700;
          font-size: 1.3rem;
        }

        .option-price {
          color: #FFD700;
          font-weight: bold;
          font-size: 1.1rem;
        }

        .option-checkbox input {
          width: 20px;
          height: 20px;
          accent-color: #FFD700;
        }

        .option-content {
          margin-top: 1rem;
        }

        .option-description {
          color: rgba(255, 255, 255, 0.8);
          margin-bottom: 1rem;
          line-height: 1.5;
        }

        .option-benefits h4 {
          color: #FFD700;
          margin-bottom: 0.75rem;
          font-size: 1rem;
        }

        .option-benefits ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .option-benefits li {
          display: flex;
          align-items: flex-start;
          gap: 0.5rem;
          margin-bottom: 0.5rem;
          color: rgba(255, 255, 255, 0.9);
          line-height: 1.4;
        }

        .benefit-icon {
          color: #00ff00;
          font-weight: bold;
          margin-top: 0.1rem;
          flex-shrink: 0;
        }

        @media (max-width: 768px) {
          .option-header {
            flex-direction: column;
            gap: 1rem;
          }
          
          .option-checkbox {
            align-self: flex-start;
          }
        }
      `}</style>
    </div>
  );
}