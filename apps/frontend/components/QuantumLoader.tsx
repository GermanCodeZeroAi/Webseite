/**
 * QuantumLoader - INSANE Quantum Loading Effects
 */
'use client';

import React, { useEffect, useState } from 'react';

interface QuantumLoaderProps {
  progress?: number;
  message?: string;
  type?: 'neural' | 'data' | 'ai' | 'quantum' | 'business';
  size?: 'small' | 'medium' | 'large';
  showProgress?: boolean;
  showMetrics?: boolean;
  className?: string;
}

const LOADING_MESSAGES = {
  neural: ['Initializing Neural Networks...', 'Training AI Models...', 'Optimizing Synapses...'],
  data: ['Processing Data Streams...', 'Analyzing Business Metrics...', 'Calculating ROI...'],
  ai: ['AI Learning in Progress...', 'Machine Intelligence Activating...', 'Predictive Models Loading...'],
  quantum: ['Quantum States Superposing...', 'Entangling Business Logic...', 'Collapsing Probability Waves...'],
  business: ['Calculating Revenue Impact...', 'Analyzing Market Dynamics...', 'Processing Customer Data...']
};

const BUSINESS_METRICS = [
  '+847% Revenue Growth',
  '+234% Efficiency Gain', 
  '+156% ROI Increase',
  '94% Process Automation',
  '87% AI Optimization'
];

export default function QuantumLoader({
  progress = 0,
  message,
  type = 'quantum',
  size = 'medium',
  showProgress = true,
  showMetrics = true,
  className = ''
}: QuantumLoaderProps) {
  const [currentMessage, setCurrentMessage] = useState('');
  const [currentMetric, setCurrentMetric] = useState('');

  const messages = LOADING_MESSAGES[type];

  const getSizeDimensions = () => {
    switch (size) {
      case 'small': return { width: 120, height: 120 };
      case 'large': return { width: 200, height: 200 };
      default: return { width: 160, height: 160 };
    }
  };

  const dimensions = getSizeDimensions();

  useEffect(() => {
    if (message) {
      setCurrentMessage(message);
      return;
    }

    const interval = setInterval(() => {
      const randomMessage = messages[Math.floor(Math.random() * messages.length)];
      setCurrentMessage(randomMessage);
    }, 2000);

    setCurrentMessage(messages[0]);
    return () => clearInterval(interval);
  }, [message, messages]);

  useEffect(() => {
    if (!showMetrics) return;

    const interval = setInterval(() => {
      const randomMetric = BUSINESS_METRICS[Math.floor(Math.random() * BUSINESS_METRICS.length)];
      setCurrentMetric(randomMetric);
    }, 1500);

    setCurrentMetric(BUSINESS_METRICS[0]);
    return () => clearInterval(interval);
  }, [showMetrics]);

  return (
    <div className={`quantum-loader ${size} ${className}`}>
      <div className="quantum-loader__animation">
        <svg
          width={dimensions.width}
          height={dimensions.height}
          viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
          className="quantum-loader__svg"
        >
          <defs>
            <linearGradient id="quantumGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFD700" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#FFA500" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#FFD700" stopOpacity="0.8" />
            </linearGradient>
          </defs>
          
          {/* Background ring */}
          <circle
            cx={dimensions.width / 2}
            cy={dimensions.height / 2}
            r={dimensions.width / 4}
            fill="none"
            stroke="rgba(255, 215, 0, 0.2)"
            strokeWidth="4"
          />
          
          {/* Progress ring */}
          <circle
            cx={dimensions.width / 2}
            cy={dimensions.height / 2}
            r={dimensions.width / 4}
            fill="none"
            stroke="url(#quantumGradient)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * (dimensions.width / 4)}`}
            strokeDashoffset={`${2 * Math.PI * (dimensions.width / 4) * (1 - progress / 100)}`}
            transform={`rotate(-90 ${dimensions.width / 2} ${dimensions.height / 2})`}
            className="quantum-loader__progress"
          />
          
          {/* Center pulse */}
          <circle
            cx={dimensions.width / 2}
            cy={dimensions.height / 2}
            r="8"
            fill="#FFFFFF"
            className="quantum-loader__pulse"
          />
        </svg>

        {showProgress && (
          <div className="quantum-loader__percentage">
            {Math.round(progress)}%
          </div>
        )}
      </div>

      <div className="quantum-loader__message">
        {currentMessage}
      </div>

      {showMetrics && (
        <div className="quantum-loader__metrics">
          <div className="quantum-loader__metric-label">PROJECTED IMPACT:</div>
          <div className="quantum-loader__metric-value">{currentMetric}</div>
        </div>
      )}

      <style jsx>{`
        .quantum-loader {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
          padding: 1.5rem;
          text-align: center;
        }

        .quantum-loader__animation {
          position: relative;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(20, 20, 40, 0.8) 0%, rgba(0, 0, 0, 0.9) 100%);
          border: 2px solid rgba(255, 215, 0, 0.3);
          box-shadow: 0 0 20px rgba(255, 215, 0, 0.3);
        }

        .quantum-loader__svg {
          display: block;
        }

        .quantum-loader__progress {
          animation: quantumSpin 2s linear infinite;
        }

        .quantum-loader__pulse {
          animation: quantumPulse 1.5s ease-in-out infinite;
        }

        .quantum-loader__percentage {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          font-size: 1.25rem;
          font-weight: 700;
          color: #FFD700;
          text-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
          z-index: 2;
        }

        .quantum-loader__message {
          font-size: 0.9rem;
          color: #ffffff;
          opacity: 0.9;
          animation: fadeInOut 2s ease-in-out infinite;
          min-height: 1.2em;
        }

        .quantum-loader__metrics {
          background: rgba(0, 0, 0, 0.6);
          border: 1px solid rgba(255, 215, 0, 0.3);
          border-radius: 8px;
          padding: 0.75rem 1rem;
          backdrop-filter: blur(10px);
        }

        .quantum-loader__metric-label {
          font-size: 0.7rem;
          color: #00FFFF;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin-bottom: 0.25rem;
        }

        .quantum-loader__metric-value {
          font-size: 0.9rem;
          color: #00FF00;
          font-weight: 600;
          font-family: 'Courier New', monospace;
          animation: glow 2s ease-in-out infinite alternate;
        }

        @keyframes quantumSpin {
          from { transform: rotate(-90deg); }
          to { transform: rotate(270deg); }
        }

        @keyframes quantumPulse {
          0%, 100% { r: 8; opacity: 1; }
          50% { r: 12; opacity: 0.7; }
        }

        @keyframes fadeInOut {
          0%, 100% { opacity: 0.7; }
          50% { opacity: 1; }
        }

        @keyframes glow {
          from { text-shadow: 0 0 5px rgba(0, 255, 0, 0.5); }
          to { text-shadow: 0 0 15px rgba(0, 255, 0, 0.8); }
        }

        .quantum-loader.small {
          gap: 0.75rem;
          padding: 1rem;
        }

        .quantum-loader.large {
          gap: 1.5rem;
          padding: 2rem;
        }

        @media (max-width: 768px) {
          .quantum-loader {
            gap: 0.75rem;
            padding: 1rem;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .quantum-loader__progress,
          .quantum-loader__pulse,
          .quantum-loader__message,
          .quantum-loader__metric-value {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}