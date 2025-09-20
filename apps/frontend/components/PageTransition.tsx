/**
 * PageTransition - INSANE Page Transition Effects
 * 
 * KRASSE page transitions with morphing effects and neural networks.
 * Features:
 * - Liquid morphing between pages
 * - Neural network dissolution effects
 * - Quantum teleportation animations
 * - Business data flow visualization
 * - AI-powered smooth transitions
 */

'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
}

interface TransitionParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  opacity: number;
  color: string;
  type: 'neural' | 'data' | 'quantum';
}

const TRANSITION_TYPES = [
  'neural_dissolve',
  'quantum_teleport', 
  'liquid_morph',
  'data_stream',
  'hologram_shift'
] as const;

type TransitionType = typeof TRANSITION_TYPES[number];

export default function PageTransition({ children, className = '' }: PageTransitionProps) {
  const router = useRouter();
  const pathname = usePathname();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionType, setTransitionType] = useState<TransitionType>('neural_dissolve');
  const [transitionProgress, setTransitionProgress] = useState(0);
  const [particles, setParticles] = useState<TransitionParticle[]>([]);
  const [previousPath, setPreviousPath] = useState<string>('');

  // Detect route changes
  useEffect(() => {
    if (previousPath && previousPath !== pathname) {
      startTransition();
    }
    setPreviousPath(pathname);
  }, [pathname, previousPath]);

  // Start INSANE transition
  const startTransition = useCallback(() => {
    // Random transition type for variety
    const randomType = TRANSITION_TYPES[Math.floor(Math.random() * TRANSITION_TYPES.length)];
    setTransitionType(randomType);
    setIsTransitioning(true);
    setTransitionProgress(0);

    // Create particles based on transition type
    createTransitionParticles(randomType);

    // Animate transition
    let progress = 0;
    const duration = 1200; // 1.2 seconds
    const startTime = Date.now();

    const animateTransition = () => {
      const elapsed = Date.now() - startTime;
      progress = Math.min(elapsed / duration, 1);
      
      setTransitionProgress(progress);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animateTransition);
      } else {
        setIsTransitioning(false);
        setParticles([]);
      }
    };

    animationRef.current = requestAnimationFrame(animateTransition);
  }, []);

  // Create particles for different transition types
  const createTransitionParticles = (type: TransitionType) => {
    const newParticles: TransitionParticle[] = [];
    const particleCount = 50;

    for (let i = 0; i < particleCount; i++) {
      let particleType: TransitionParticle['type'] = 'neural';
      let color = '#FFD700';

      switch (type) {
        case 'neural_dissolve':
          particleType = 'neural';
          color = '#FFD700';
          break;
        case 'quantum_teleport':
          particleType = 'quantum';
          color = '#9370DB';
          break;
        case 'data_stream':
          particleType = 'data';
          color = '#00BFFF';
          break;
        default:
          color = '#FFD700';
      }

      newParticles.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8,
        life: 60,
        maxLife: 60,
        size: Math.random() * 4 + 2,
        opacity: Math.random() * 0.8 + 0.2,
        color,
        type: particleType
      });
    }

    setParticles(newParticles);
  };

  // Canvas animation effect
  useEffect(() => {
    if (!canvasRef.current || !isTransitioning) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const updateCanvasSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);

    const animate = () => {
      if (!isTransitioning) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Render transition effect based on type
      switch (transitionType) {
        case 'neural_dissolve':
          renderNeuralDissolve(ctx);
          break;
        case 'quantum_teleport':
          renderQuantumTeleport(ctx);
          break;
        case 'liquid_morph':
          renderLiquidMorph(ctx);
          break;
        case 'data_stream':
          renderDataStream(ctx);
          break;
        case 'hologram_shift':
          renderHologramShift(ctx);
          break;
      }

      // Update and draw particles
      setParticles(prevParticles => {
        return prevParticles.map(particle => ({
          ...particle,
          x: particle.x + particle.vx,
          y: particle.y + particle.vy,
          life: particle.life - 1,
          opacity: particle.opacity * (particle.life / particle.maxLife)
        })).filter(particle => particle.life > 0);
      });

      // Draw particles
      particles.forEach(particle => {
        ctx.save();
        ctx.globalAlpha = particle.opacity;
        ctx.fillStyle = particle.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = particle.color;
        
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', updateCanvasSize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isTransitioning, transitionType, particles]);

  // Neural dissolve effect
  const renderNeuralDissolve = (ctx: CanvasRenderingContext2D) => {
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    const maxRadius = Math.max(window.innerWidth, window.innerHeight);
    
    // Create expanding neural network
    ctx.save();
    ctx.strokeStyle = `rgba(255, 215, 0, ${0.3 * (1 - transitionProgress)})`;
    ctx.lineWidth = 2;
    ctx.shadowBlur = 20;
    ctx.shadowColor = '#FFD700';
    
    const radius = maxRadius * transitionProgress;
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(
        centerX + Math.cos(angle) * radius,
        centerY + Math.sin(angle) * radius
      );
      ctx.stroke();
    }
    ctx.restore();
  };

  // Quantum teleport effect
  const renderQuantumTeleport = (ctx: CanvasRenderingContext2D) => {
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    
    // Quantum portal effect
    ctx.save();
    const gradient = ctx.createRadialGradient(
      centerX, centerY, 0,
      centerX, centerY, 200 * transitionProgress
    );
    gradient.addColorStop(0, `rgba(147, 112, 219, ${0.8 * transitionProgress})`);
    gradient.addColorStop(0.5, `rgba(138, 43, 226, ${0.4 * transitionProgress})`);
    gradient.addColorStop(1, 'transparent');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, 200 * transitionProgress, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };

  // Liquid morph effect
  const renderLiquidMorph = (ctx: CanvasRenderingContext2D) => {
    ctx.save();
    ctx.fillStyle = `rgba(0, 0, 0, ${transitionProgress * 0.9})`;
    
    // Create liquid wave effect
    const waveHeight = window.innerHeight * transitionProgress;
    ctx.beginPath();
    ctx.moveTo(0, window.innerHeight - waveHeight);
    
    for (let x = 0; x <= window.innerWidth; x += 10) {
      const y = window.innerHeight - waveHeight + 
                Math.sin((x * 0.01) + (transitionProgress * 10)) * 20;
      ctx.lineTo(x, y);
    }
    
    ctx.lineTo(window.innerWidth, window.innerHeight);
    ctx.lineTo(0, window.innerHeight);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  };

  // Data stream effect
  const renderDataStream = (ctx: CanvasRenderingContext2D) => {
    ctx.save();
    ctx.strokeStyle = `rgba(0, 191, 255, ${0.6 * transitionProgress})`;
    ctx.lineWidth = 1;
    ctx.shadowBlur = 8;
    ctx.shadowColor = '#00BFFF';
    
    // Vertical data streams
    for (let i = 0; i < 20; i++) {
      const x = (window.innerWidth / 20) * i;
      const progress = (transitionProgress + (i * 0.05)) % 1;
      
      ctx.beginPath();
      ctx.moveTo(x, -50);
      ctx.lineTo(x, window.innerHeight * progress);
      ctx.stroke();
    }
    ctx.restore();
  };

  // Hologram shift effect
  const renderHologramShift = (ctx: CanvasRenderingContext2D) => {
    ctx.save();
    
    // RGB split effect
    const offset = 20 * transitionProgress;
    
    ctx.globalCompositeOperation = 'screen';
    ctx.fillStyle = `rgba(255, 0, 0, ${0.3 * transitionProgress})`;
    ctx.fillRect(-offset, 0, window.innerWidth, window.innerHeight);
    
    ctx.fillStyle = `rgba(0, 255, 0, ${0.3 * transitionProgress})`;
    ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
    
    ctx.fillStyle = `rgba(0, 0, 255, ${0.3 * transitionProgress})`;
    ctx.fillRect(offset, 0, window.innerWidth, window.innerHeight);
    
    ctx.restore();
  };

  return (
    <div className={`page-transition ${className}`}>
      {/* Transition Canvas */}
      {isTransitioning && (
        <canvas
          ref={canvasRef}
          className="page-transition__canvas"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            zIndex: 9999,
            pointerEvents: 'none'
          }}
        />
      )}

      {/* Content with transition overlay */}
      <div 
        className={`page-transition__content ${isTransitioning ? 'transitioning' : ''}`}
        style={{
          opacity: isTransitioning ? 1 - transitionProgress : 1,
          transform: isTransitioning ? `scale(${1 - transitionProgress * 0.1})` : 'scale(1)',
          filter: isTransitioning ? `blur(${transitionProgress * 5}px)` : 'blur(0px)',
          transition: 'none'
        }}
      >
        {children}
      </div>

      <style jsx>{`
        .page-transition {
          position: relative;
          width: 100%;
          min-height: 100vh;
        }

        .page-transition__content {
          width: 100%;
          min-height: 100vh;
        }

        .page-transition__content.transitioning {
          will-change: transform, opacity, filter;
        }

        /* Preload transition styles */
        @media (prefers-reduced-motion: reduce) {
          .page-transition__content {
            transition: none !important;
            transform: none !important;
            filter: none !important;
          }
        }
      `}</style>
    </div>
  );
}