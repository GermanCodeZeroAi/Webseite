/**
 * EasterEggs - INSANE Hidden Interactive Elements
 * 
 * KRASSE hidden animations and secret interactions.
 * Features:
 * - Konami code activation
 * - Secret neural network visualization
 * - Hidden business metrics dashboard
 * - AI personality interactions
 * - Quantum reality glitches
 * - Developer mode activations
 */

'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSound } from './SoundSystem';

interface EasterEggsProps {
  enabled?: boolean;
  className?: string;
}

interface SecretMode {
  name: string;
  description: string;
  active: boolean;
  unlocked: boolean;
  code: string[];
  effect: () => void;
}

const KONAMI_CODE = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'KeyB', 'KeyA'];

export default function EasterEggs({ enabled = true, className = '' }: EasterEggsProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const { playQuantumShift, playSuccessChime, playNeuralFire } = useSound();
  
  const [keySequence, setKeySequence] = useState<string[]>([]);
  const [secretModes, setSecretModes] = useState<SecretMode[]>([]);
  const [matrixMode, setMatrixMode] = useState(false);
  const [aiPersonality, setAiPersonality] = useState(false);
  const [quantumGlitch, setQuantumGlitch] = useState(false);
  const [clickCount, setClickCount] = useState(0);
  const [lastClickTime, setLastClickTime] = useState(0);

  // Initialize secret modes
  useEffect(() => {
    setSecretModes([
      {
        name: 'Matrix Mode',
        description: 'Digital rain effect with business data',
        active: false,
        unlocked: false,
        code: ['KeyM', 'KeyA', 'KeyT', 'KeyR', 'KeyI', 'KeyX'],
        effect: () => {
          setMatrixMode(true);
          playQuantumShift();
          setTimeout(() => setMatrixMode(false), 10000);
        }
      },
      {
        name: 'AI Personality',
        description: 'Activate AI assistant personality',
        active: false,
        unlocked: false,
        code: ['KeyA', 'KeyI'],
        effect: () => {
          setAiPersonality(true);
          playNeuralFire();
          setTimeout(() => setAiPersonality(false), 5000);
        }
      },
      {
        name: 'Quantum Glitch',
        description: 'Reality distortion effects',
        active: false,
        unlocked: false,
        code: ['KeyQ', 'KeyU', 'KeyA', 'KeyN', 'KeyT', 'KeyU', 'KeyM'],
        effect: () => {
          setQuantumGlitch(true);
          playQuantumShift();
          setTimeout(() => setQuantumGlitch(false), 8000);
        }
      }
    ]);
  }, [playQuantumShift, playNeuralFire]);

  // Key sequence detection
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      setKeySequence(prev => {
        const newSequence = [...prev, event.code].slice(-10); // Keep last 10 keys

        // Check for Konami code
        if (newSequence.length >= KONAMI_CODE.length) {
          const lastKeys = newSequence.slice(-KONAMI_CODE.length);
          if (JSON.stringify(lastKeys) === JSON.stringify(KONAMI_CODE)) {
            activateKonamiMode();
            return [];
          }
        }

        // Check for secret modes
        secretModes.forEach(mode => {
          if (newSequence.length >= mode.code.length) {
            const lastKeys = newSequence.slice(-mode.code.length);
            if (JSON.stringify(lastKeys) === JSON.stringify(mode.code)) {
              activateSecretMode(mode.name);
              return [];
            }
          }
        });

        return newSequence;
      });
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [enabled, secretModes]);

  // Multi-click detection for secret activation
  useEffect(() => {
    if (!enabled) return;

    const handleClick = (event: MouseEvent) => {
      const now = Date.now();
      
      if (now - lastClickTime < 500) { // Within 500ms
        setClickCount(prev => prev + 1);
      } else {
        setClickCount(1);
      }
      
      setLastClickTime(now);

      // 7 rapid clicks = secret mode
      if (clickCount >= 6) {
        activateRapidClickMode();
        setClickCount(0);
      }
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [enabled, clickCount, lastClickTime]);

  // Activate Konami code effects
  const activateKonamiMode = useCallback(() => {
    playSuccessChime();
    
    // Show all business metrics
    const metrics = [
      'REVENUE: +847%',
      'EFFICIENCY: +234%', 
      'ROI: +156%',
      'AUTOMATION: 94%',
      'AI OPTIMIZATION: 87%',
      'PIPELINE: +312%'
    ];

    // Create floating metric displays
    metrics.forEach((metric, index) => {
      setTimeout(() => {
        createFloatingText(metric, Math.random() * window.innerWidth, Math.random() * window.innerHeight);
      }, index * 200);
    });

    // Unlock all secret modes
    setSecretModes(prev => prev.map(mode => ({ ...mode, unlocked: true })));
  }, [playSuccessChime]);

  // Activate secret mode
  const activateSecretMode = useCallback((modeName: string) => {
    const mode = secretModes.find(m => m.name === modeName);
    if (mode && !mode.active) {
      mode.effect();
      setSecretModes(prev => prev.map(m => 
        m.name === modeName ? { ...m, active: true, unlocked: true } : m
      ));
    }
  }, [secretModes]);

  // Rapid click secret mode
  const activateRapidClickMode = useCallback(() => {
    playNeuralFire();
    
    // Screen shake effect
    document.body.style.animation = 'screenShake 0.5s ease-in-out';
    setTimeout(() => {
      document.body.style.animation = '';
    }, 500);

    // Particle explosion
    createParticleExplosion();
  }, [playNeuralFire]);

  // Create floating text effect
  const createFloatingText = (text: string, x: number, y: number) => {
    const element = document.createElement('div');
    element.textContent = text;
    element.style.cssText = `
      position: fixed;
      left: ${x}px;
      top: ${y}px;
      color: #FFD700;
      font-weight: bold;
      font-size: 1.5rem;
      text-shadow: 0 0 10px rgba(255, 215, 0, 0.8);
      pointer-events: none;
      z-index: 9999;
      animation: floatUp 3s ease-out forwards;
    `;

    document.body.appendChild(element);
    setTimeout(() => element.remove(), 3000);
  };

  // Create particle explosion
  const createParticleExplosion = () => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    canvas.style.display = 'block';

    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      life: number;
      color: string;
      size: number;
    }> = [];

    // Create explosion particles
    for (let i = 0; i < 100; i++) {
      particles.push({
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
        vx: (Math.random() - 0.5) * 20,
        vy: (Math.random() - 0.5) * 20,
        life: 60,
        color: ['#FFD700', '#FFA500', '#00BFFF', '#9370DB', '#00FF00'][Math.floor(Math.random() * 5)],
        size: Math.random() * 8 + 2
      });
    }

    const animateExplosion = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((particle, index) => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.vy += 0.3; // Gravity
        particle.life--;
        particle.vx *= 0.99;
        particle.vy *= 0.99;

        if (particle.life > 0) {
          ctx.save();
          ctx.globalAlpha = particle.life / 60;
          ctx.fillStyle = particle.color;
          ctx.shadowBlur = 10;
          ctx.shadowColor = particle.color;
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      });

      const aliveParticles = particles.filter(p => p.life > 0);
      if (aliveParticles.length > 0) {
        requestAnimationFrame(animateExplosion);
      } else {
        canvas.style.display = 'none';
      }
    };

    requestAnimationFrame(animateExplosion);
  };

  return (
    <div className={`easter-eggs ${className}`}>
      {/* Hidden canvas for effects */}
      <canvas
        ref={canvasRef}
        className="easter-eggs__canvas"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          pointerEvents: 'none',
          zIndex: 9998,
          display: 'none'
        }}
      />

      {/* Matrix mode overlay */}
      {matrixMode && (
        <div className="easter-eggs__matrix">
          <div className="matrix-text">
            {Array.from({ length: 20 }, (_, i) => (
              <div key={i} className="matrix-column">
                {Array.from({ length: 30 }, (_, j) => (
                  <span key={j} className="matrix-char">
                    {Math.random() > 0.5 ? '1' : '0'}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Personality mode */}
      {aiPersonality && (
        <div className="easter-eggs__ai">
          <div className="ai-message">
            🤖 NEURAL NETWORK ACTIVATED<br/>
            <span className="ai-subtitle">I am now analyzing your business patterns...</span>
          </div>
        </div>
      )}

      {/* Quantum glitch mode */}
      {quantumGlitch && (
        <div className="easter-eggs__glitch">
          <div className="glitch-overlay" />
        </div>
      )}

      {/* Secret modes indicator */}
      {secretModes.some(mode => mode.unlocked) && (
        <div className="easter-eggs__indicator">
          <div className="secret-modes">
            🎉 SECRET MODES UNLOCKED
            <div className="unlocked-list">
              {secretModes.filter(mode => mode.unlocked).map(mode => (
                <div key={mode.name} className="unlocked-mode">
                  ✨ {mode.name}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .easter-eggs__matrix {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: rgba(0, 0, 0, 0.9);
          color: #00FF00;
          font-family: 'Courier New', monospace;
          z-index: 9997;
          overflow: hidden;
          pointer-events: none;
        }

        .matrix-text {
          display: flex;
          width: 100%;
          height: 100%;
        }

        .matrix-column {
          flex: 1;
          display: flex;
          flex-direction: column;
          animation: matrixRain 2s linear infinite;
        }

        .matrix-column:nth-child(even) {
          animation-delay: -1s;
        }

        .matrix-char {
          font-size: 1rem;
          line-height: 1.2;
          opacity: 0.8;
          animation: matrixFade 2s ease-in-out infinite;
        }

        @keyframes matrixRain {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100vh); }
        }

        @keyframes matrixFade {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }

        .easter-eggs__ai {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: rgba(0, 0, 0, 0.9);
          border: 2px solid #FFD700;
          border-radius: 16px;
          padding: 2rem;
          text-align: center;
          z-index: 9997;
          backdrop-filter: blur(10px);
          animation: aiPulse 2s ease-in-out infinite;
        }

        .ai-message {
          color: #FFD700;
          font-size: 1.5rem;
          font-weight: bold;
          text-shadow: 0 0 10px rgba(255, 215, 0, 0.8);
        }

        .ai-subtitle {
          display: block;
          font-size: 1rem;
          color: #00FFFF;
          margin-top: 1rem;
          font-weight: normal;
        }

        @keyframes aiPulse {
          0%, 100% { 
            box-shadow: 0 0 20px rgba(255, 215, 0, 0.5);
            transform: translate(-50%, -50%) scale(1);
          }
          50% { 
            box-shadow: 0 0 40px rgba(255, 215, 0, 0.8);
            transform: translate(-50%, -50%) scale(1.05);
          }
        }

        .easter-eggs__glitch {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          z-index: 9997;
          pointer-events: none;
        }

        .glitch-overlay {
          width: 100%;
          height: 100%;
          background: 
            linear-gradient(90deg, transparent 0%, rgba(255, 0, 0, 0.1) 50%, transparent 100%),
            linear-gradient(0deg, transparent 0%, rgba(0, 255, 0, 0.1) 50%, transparent 100%);
          animation: glitchEffect 0.1s infinite;
        }

        @keyframes glitchEffect {
          0% { 
            transform: translate(0px, 0px);
            filter: hue-rotate(0deg);
          }
          10% { 
            transform: translate(-2px, 2px);
            filter: hue-rotate(90deg);
          }
          20% { 
            transform: translate(-1px, -1px);
            filter: hue-rotate(180deg);
          }
          30% { 
            transform: translate(1px, 2px);
            filter: hue-rotate(270deg);
          }
          40% { 
            transform: translate(1px, -1px);
            filter: hue-rotate(0deg);
          }
          50% { 
            transform: translate(-1px, 2px);
            filter: hue-rotate(90deg);
          }
          60% { 
            transform: translate(-1px, 1px);
            filter: hue-rotate(180deg);
          }
          70% { 
            transform: translate(0px, 1px);
            filter: hue-rotate(270deg);
          }
          80% { 
            transform: translate(1px, 0px);
            filter: hue-rotate(0deg);
          }
          90% { 
            transform: translate(0px, 2px);
            filter: hue-rotate(90deg);
          }
          100% { 
            transform: translate(0px, 0px);
            filter: hue-rotate(0deg);
          }
        }

        .easter-eggs__indicator {
          position: fixed;
          top: 20px;
          right: 20px;
          background: rgba(0, 0, 0, 0.9);
          border: 1px solid #FFD700;
          border-radius: 8px;
          padding: 1rem;
          z-index: 1000;
          animation: slideInRight 0.5s ease-out;
        }

        .secret-modes {
          color: #FFD700;
          font-weight: bold;
          text-align: center;
        }

        .unlocked-list {
          margin-top: 0.5rem;
        }

        .unlocked-mode {
          color: #00FF00;
          font-size: 0.9rem;
          margin: 0.25rem 0;
        }

        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        /* Global screen shake */
        @keyframes screenShake {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          10% { transform: translate(-1px, -2px) rotate(-1deg); }
          20% { transform: translate(-3px, 0px) rotate(1deg); }
          30% { transform: translate(3px, 2px) rotate(0deg); }
          40% { transform: translate(1px, -1px) rotate(1deg); }
          50% { transform: translate(-1px, 2px) rotate(-1deg); }
          60% { transform: translate(-3px, 1px) rotate(0deg); }
          70% { transform: translate(3px, 1px) rotate(-1deg); }
          80% { transform: translate(-1px, -1px) rotate(1deg); }
          90% { transform: translate(1px, 2px) rotate(0deg); }
        }

        /* Floating text animation */
        @keyframes floatUp {
          0% {
            opacity: 0;
            transform: translateY(0) scale(0.5);
          }
          20% {
            opacity: 1;
            transform: translateY(-20px) scale(1);
          }
          100% {
            opacity: 0;
            transform: translateY(-100px) scale(1.2);
          }
        }

        @media (max-width: 768px) {
          .easter-eggs__indicator {
            top: 10px;
            right: 10px;
            padding: 0.75rem;
            font-size: 0.9rem;
          }

          .easter-eggs__ai {
            padding: 1.5rem;
          }

          .ai-message {
            font-size: 1.25rem;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .matrix-column,
          .matrix-char,
          .glitch-overlay,
          .easter-eggs__indicator,
          .easter-eggs__ai {
            animation: none;
          }
        }
      `}</style>

      {/* Add global floating text styles */}
      <style jsx global>{`
        @keyframes floatUp {
          0% {
            opacity: 0;
            transform: translateY(0) scale(0.5);
          }
          20% {
            opacity: 1;
            transform: translateY(-20px) scale(1);
          }
          100% {
            opacity: 0;
            transform: translateY(-100px) scale(1.2);
          }
        }

        @keyframes screenShake {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          10% { transform: translate(-1px, -2px) rotate(-1deg); }
          20% { transform: translate(-3px, 0px) rotate(1deg); }
          30% { transform: translate(3px, 2px) rotate(0deg); }
          40% { transform: translate(1px, -1px) rotate(1deg); }
          50% { transform: translate(-1px, 2px) rotate(-1deg); }
          60% { transform: translate(-3px, 1px) rotate(0deg); }
          70% { transform: translate(3px, 1px) rotate(-1deg); }
          80% { transform: translate(-1px, -1px) rotate(1deg); }
          90% { transform: translate(1px, 2px) rotate(0deg); }
        }
      `}</style>
    </div>
  );
}