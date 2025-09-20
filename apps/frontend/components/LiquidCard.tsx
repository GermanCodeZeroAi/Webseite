/**
 * LiquidCard - INSANE Liquid Metal Effects
 */
'use client';

import React, { useState, useCallback } from 'react';

interface LiquidCardProps {
  title: string;
  description: string;
  value?: string;
  metric?: string;
  type?: 'primary' | 'secondary' | 'success' | 'warning' | 'neural';
  interactive?: boolean;
  holographic?: boolean;
  children?: React.ReactNode;
  onClick?: () => void;
  className?: string;
  'data-testid'?: string;
}

export default function LiquidCard({
  title,
  description,
  value,
  metric,
  type = 'primary',
  interactive = true,
  holographic = true,
  children,
  onClick,
  className = '',
  'data-testid': dataTestId,
  ...props
}: LiquidCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const getColors = () => {
    switch (type) {
      case 'success': return { primary: '#00FF00', glow: 'rgba(0, 255, 0, 0.6)' };
      case 'warning': return { primary: '#FF69B4', glow: 'rgba(255, 105, 180, 0.6)' };
      case 'neural': return { primary: '#9370DB', glow: 'rgba(147, 112, 219, 0.6)' };
      case 'secondary': return { primary: '#00BFFF', glow: 'rgba(0, 191, 255, 0.6)' };
      default: return { primary: '#FFD700', glow: 'rgba(255, 215, 0, 0.6)' };
    }
  };

  const colors = getColors();

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!interactive) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePosition({
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height
    });
  }, [interactive]);

  return (
    <div
      {...props}
      className={`liquid-card ${type} ${isHovered ? 'hovered' : ''} ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseMove={handleMouseMove}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      data-testid={dataTestId}
    >
      {holographic && (
        <div 
          className="liquid-card__hologram"
          style={{
            background: `radial-gradient(circle at ${mousePosition.x * 100}% ${mousePosition.y * 100}%, ${colors.glow}, transparent 70%)`
          }}
        />
      )}

      <div className="liquid-card__content">
        <div className="liquid-card__header">
          <h3 className="liquid-card__title">{title}</h3>
          {value && (
            <div className="liquid-card__value">
              {value}
              {metric && <span className="liquid-card__metric">{metric}</span>}
            </div>
          )}
        </div>
        <p className="liquid-card__description">{description}</p>
        {children && <div className="liquid-card__children">{children}</div>}
      </div>

      <div className="liquid-card__border" />

      <style jsx>{`
        .liquid-card {
          position: relative;
          background: rgba(0, 0, 0, 0.8);
          border-radius: 16px;
          padding: 1.5rem;
          overflow: hidden;
          transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          cursor: ${onClick ? 'pointer' : 'default'};
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .liquid-card__hologram {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          opacity: 0;
          transition: opacity 0.3s ease;
          pointer-events: none;
          z-index: 0;
        }

        .liquid-card.hovered .liquid-card__hologram {
          opacity: 0.3;
        }

        .liquid-card__content {
          position: relative;
          z-index: 2;
        }

        .liquid-card__header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1rem;
        }

        .liquid-card__title {
          font-size: 1.25rem;
          font-weight: 600;
          color: #ffffff;
          margin: 0;
          transition: color 0.3s ease;
        }

        .liquid-card__value {
          font-size: 1.5rem;
          font-weight: 700;
          color: ${colors.primary};
          display: flex;
          align-items: baseline;
          gap: 0.25rem;
        }

        .liquid-card__metric {
          font-size: 0.875rem;
          font-weight: 400;
          opacity: 0.8;
        }

        .liquid-card__description {
          color: rgba(255, 255, 255, 0.8);
          line-height: 1.5;
          margin: 0;
          transition: color 0.3s ease;
        }

        .liquid-card__children {
          margin-top: 1rem;
        }

        .liquid-card__border {
          position: absolute;
          top: -2px;
          left: -2px;
          right: -2px;
          bottom: -2px;
          background: linear-gradient(45deg, ${colors.primary}, transparent, ${colors.primary});
          background-size: 300% 300%;
          border-radius: 18px;
          z-index: -1;
          opacity: 0;
          transition: opacity 0.3s ease;
          animation: liquidBorder 3s ease-in-out infinite;
        }

        @keyframes liquidBorder {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }

        .liquid-card.hovered .liquid-card__border {
          opacity: 1;
        }

        .liquid-card.hovered {
          box-shadow: 0 10px 30px ${colors.glow};
          transform: translateY(-5px);
        }

        .liquid-card.hovered .liquid-card__title {
          color: ${colors.primary};
        }

        @media (max-width: 768px) {
          .liquid-card {
            padding: 1.25rem;
          }
          .liquid-card__header {
            flex-direction: column;
            gap: 0.5rem;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .liquid-card, .liquid-card__border {
            transition: none;
            animation: none;
          }
          .liquid-card.hovered {
            transform: none;
          }
        }
      `}</style>
    </div>
  );
}