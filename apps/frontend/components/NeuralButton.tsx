/**
 * NeuralButton - INSANE Neural Network Button
 */
'use client';

import React, { useState, useCallback } from 'react';

interface NeuralButtonProps {
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'neural';
  size?: 'small' | 'medium' | 'large';
  neural?: boolean;
  quantum?: boolean;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  'data-testid'?: string;
}

export default function NeuralButton({
  children,
  onClick,
  disabled = false,
  loading = false,
  variant = 'primary',
  size = 'medium',
  neural = true,
  quantum = false,
  className = '',
  type = 'button',
  'data-testid': dataTestId,
  ...props
}: NeuralButtonProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  const getColors = () => {
    switch (variant) {
      case 'secondary': return { base: '#00BFFF', hover: '#1E90FF', glow: 'rgba(0, 191, 255, 0.6)' };
      case 'success': return { base: '#00FF00', hover: '#32CD32', glow: 'rgba(0, 255, 0, 0.6)' };
      case 'warning': return { base: '#FF69B4', hover: '#FF1493', glow: 'rgba(255, 105, 180, 0.6)' };
      case 'neural': return { base: '#9370DB', hover: '#8A2BE2', glow: 'rgba(147, 112, 219, 0.6)' };
      default: return { base: '#FFD700', hover: '#FFA500', glow: 'rgba(255, 215, 0, 0.6)' };
    }
  };

  const getDimensions = () => {
    switch (size) {
      case 'small': return { padding: '0.5rem 1rem', fontSize: '0.875rem' };
      case 'large': return { padding: '1rem 2rem', fontSize: '1.125rem' };
      default: return { padding: '0.75rem 1.5rem', fontSize: '1rem' };
    }
  };

  const colors = getColors();
  const dimensions = getDimensions();

  const handleClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || loading) return;
    setIsPressed(true);
    setTimeout(() => setIsPressed(false), 150);
    
    // Trigger sound effect
    if (typeof window !== 'undefined' && (window as any).playSound) {
      (window as any).playSound('neural_fire');
    }
    
    onClick?.(e);
  }, [disabled, loading, onClick]);

  return (
    <button
      {...props}
      type={type}
      className={`neural-button ${variant} ${size} ${isHovered ? 'hovered' : ''} ${isPressed ? 'pressed' : ''} ${loading ? 'loading' : ''} ${disabled ? 'disabled' : ''} ${className}`}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      disabled={disabled || loading}
      data-testid={dataTestId}
    >
      <span className="neural-button__content">
        {loading ? (
          <span className="neural-button__loading">
            <svg className="neural-button__spinner" width="16" height="16" viewBox="0 0 16 16">
              <circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="37.7">
                <animateTransform
                  attributeName="transform"
                  type="rotate"
                  values="0 8 8;360 8 8"
                  dur="1s"
                  repeatCount="indefinite"
                />
              </circle>
            </svg>
            Processing...
          </span>
        ) : (
          children
        )}
      </span>

      {quantum && <div className="neural-button__quantum-ripple" />}

      <style jsx>{`
        .neural-button {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: ${dimensions.padding};
          font-size: ${dimensions.fontSize};
          font-weight: 600;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          overflow: hidden;
          transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          background: linear-gradient(135deg, ${colors.base} 0%, ${colors.hover} 100%);
          color: ${variant === 'primary' || variant === 'warning' ? '#000000' : '#ffffff'};
          box-shadow: 0 4px 15px ${colors.glow};
          text-decoration: none;
          user-select: none;
        }

        .neural-button__content {
          position: relative;
          z-index: 2;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .neural-button__loading {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .neural-button__spinner {
          animation: spin 1s linear infinite;
        }

        .neural-button__quantum-ripple {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 0;
          height: 0;
          background: radial-gradient(circle, ${colors.glow}, transparent 70%);
          border-radius: 50%;
          transform: translate(-50%, -50%);
          transition: width 0.6s ease, height 0.6s ease, opacity 0.6s ease;
          opacity: 0;
          pointer-events: none;
          z-index: 0;
        }

        .neural-button.hovered {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px ${colors.glow};
          background: linear-gradient(135deg, ${colors.hover} 0%, ${colors.base} 100%);
        }

        .neural-button.pressed {
          transform: translateY(0);
        }

        .neural-button.pressed .neural-button__quantum-ripple {
          width: 200px;
          height: 200px;
          opacity: 0.4;
        }

        .neural-button.loading {
          cursor: wait;
          animation: neuralPulse 2s ease-in-out infinite;
        }

        .neural-button.disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
          background: #666666;
          box-shadow: none;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes neuralPulse {
          0%, 100% { box-shadow: 0 4px 15px ${colors.glow}; }
          50% { box-shadow: 0 6px 20px ${colors.glow}; }
        }

        @media (max-width: 768px) {
          .neural-button {
            padding: 0.75rem 1.25rem;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .neural-button, .neural-button__quantum-ripple {
            transition: none;
            animation: none;
          }
          .neural-button.hovered {
            transform: none;
          }
        }
      `}</style>
    </button>
  );
}