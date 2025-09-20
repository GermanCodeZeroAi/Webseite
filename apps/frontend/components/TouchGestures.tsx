/**
 * TouchGestures - INSANE Mobile Touch Interactions
 * 
 * KRASSE touch gestures and mobile-specific animations.
 * Features:
 * - Multi-touch particle explosions
 * - Swipe-activated neural networks
 * - Pinch-to-zoom quantum effects
 * - Touch-trail visualizations
 * - Haptic feedback integration
 * - Gesture-based navigation
 */

'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useSound } from './SoundSystem';

interface TouchGesturesProps {
  enabled?: boolean;
  showTrails?: boolean;
  hapticFeedback?: boolean;
  children: React.ReactNode;
  className?: string;
}

interface TouchPoint {
  id: number;
  x: number;
  y: number;
  startX: number;
  startY: number;
  timestamp: number;
  pressure: number;
}

interface TouchTrail {
  points: Array<{ x: number; y: number; opacity: number; size: number }>;
  color: string;
  id: number;
}

interface GestureState {
  type: 'none' | 'swipe' | 'pinch' | 'tap' | 'long_press' | 'multi_touch';
  startTime: number;
  data: any;
}

export default function TouchGestures({
  enabled = true,
  showTrails = true,
  hapticFeedback = true,
  children,
  className = ''
}: TouchGesturesProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const { playNeuralFire, playLiquidMorph, playQuantumShift } = useSound();
  
  const [activeTouches, setActiveTouches] = useState<Map<number, TouchPoint>>(new Map());
  const [touchTrails, setTouchTrails] = useState<TouchTrail[]>([]);
  const [gestureState, setGestureState] = useState<GestureState>({ type: 'none', startTime: 0, data: null });
  const [multiTouchEffect, setMultiTouchEffect] = useState(false);

  // Haptic feedback function
  const triggerHaptic = useCallback((intensity: 'light' | 'medium' | 'heavy' = 'light') => {
    if (!hapticFeedback || !navigator.vibrate) return;
    
    const patterns = {
      light: [10],
      medium: [20],
      heavy: [50, 20, 50]
    };
    
    navigator.vibrate(patterns[intensity]);
  }, [hapticFeedback]);

  // Handle touch start
  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (!enabled) return;
    
    e.preventDefault();
    const now = Date.now();
    
    Array.from(e.changedTouches).forEach(touch => {
      const touchPoint: TouchPoint = {
        id: touch.identifier,
        x: touch.clientX,
        y: touch.clientY,
        startX: touch.clientX,
        startY: touch.clientY,
        timestamp: now,
        pressure: (touch as any).force || 0.5
      };
      
      setActiveTouches(prev => new Map(prev).set(touch.identifier, touchPoint));
      
      // Create new trail
      if (showTrails) {
        const colors = ['#FFD700', '#00BFFF', '#9370DB', '#00FF00', '#FF69B4'];
        const trailColor = colors[touch.identifier % colors.length];
        
        setTouchTrails(prev => [...prev, {
          points: [{ x: touch.clientX, y: touch.clientY, opacity: 1, size: 8 }],
          color: trailColor,
          id: touch.identifier
        }]);
      }
    });

    // Detect gesture type
    if (e.touches.length === 1) {
      setGestureState({ type: 'tap', startTime: now, data: null });
      triggerHaptic('light');
    } else if (e.touches.length === 2) {
      setGestureState({ type: 'pinch', startTime: now, data: { 
        initialDistance: getTouchDistance(e.touches[0], e.touches[1])
      }});
      triggerHaptic('medium');
      playQuantumShift();
    } else if (e.touches.length >= 3) {
      setGestureState({ type: 'multi_touch', startTime: now, data: null });
      setMultiTouchEffect(true);
      triggerHaptic('heavy');
      playNeuralFire();
      
      // Multi-touch particle explosion
      createMultiTouchExplosion(Array.from(e.touches));
    }
  }, [enabled, showTrails, triggerHaptic, playQuantumShift, playNeuralFire]);

  // Handle touch move
  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!enabled) return;
    
    e.preventDefault();
    
    Array.from(e.changedTouches).forEach(touch => {
      const touchPoint = activeTouches.get(touch.identifier);
      if (touchPoint) {
        // Update touch point
        const updatedPoint = {
          ...touchPoint,
          x: touch.clientX,
          y: touch.clientY,
          pressure: (touch as any).force || 0.5
        };
        
        setActiveTouches(prev => new Map(prev).set(touch.identifier, updatedPoint));
        
        // Update trail
        if (showTrails) {
          setTouchTrails(prev => prev.map(trail => {
            if (trail.id === touch.identifier) {
              return {
                ...trail,
                points: [...trail.points.slice(-20), { 
                  x: touch.clientX, 
                  y: touch.clientY, 
                  opacity: 1,
                  size: 4 + updatedPoint.pressure * 8
                }]
              };
            }
            return trail;
          }));
        }
        
        // Detect swipe gesture
        if (gestureState.type === 'tap') {
          const deltaX = touch.clientX - touchPoint.startX;
          const deltaY = touch.clientY - touchPoint.startY;
          const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
          
          if (distance > 50) {
            setGestureState({ type: 'swipe', startTime: gestureState.startTime, data: { deltaX, deltaY }});
            playLiquidMorph();
          }
        }
      }
    });

    // Handle pinch gesture
    if (gestureState.type === 'pinch' && e.touches.length === 2) {
      const currentDistance = getTouchDistance(e.touches[0], e.touches[1]);
      const initialDistance = gestureState.data?.initialDistance || currentDistance;
      const scale = currentDistance / initialDistance;
      
      // Trigger quantum effect on significant pinch
      if (Math.abs(scale - 1) > 0.3) {
        createQuantumRipple(
          (e.touches[0].clientX + e.touches[1].clientX) / 2,
          (e.touches[0].clientY + e.touches[1].clientY) / 2,
          scale
        );
      }
    }
  }, [enabled, activeTouches, showTrails, gestureState, playLiquidMorph]);

  // Handle touch end
  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (!enabled) return;
    
    Array.from(e.changedTouches).forEach(touch => {
      setActiveTouches(prev => {
        const newMap = new Map(prev);
        newMap.delete(touch.identifier);
        return newMap;
      });
      
      // Fade out trail
      if (showTrails) {
        setTouchTrails(prev => prev.map(trail => {
          if (trail.id === touch.identifier) {
            return {
              ...trail,
              points: trail.points.map(point => ({ ...point, opacity: point.opacity * 0.5 }))
            };
          }
          return trail;
        }));
      }
    });

    // Reset gesture state
    if (e.touches.length === 0) {
      setGestureState({ type: 'none', startTime: 0, data: null });
      setMultiTouchEffect(false);
    }
  }, [enabled, showTrails]);

  // Get distance between two touches
  const getTouchDistance = (touch1: Touch, touch2: Touch): number => {
    const deltaX = touch1.clientX - touch2.clientX;
    const deltaY = touch1.clientY - touch2.clientY;
    return Math.sqrt(deltaX * deltaX + deltaY * deltaY);
  };

  // Create multi-touch explosion effect
  const createMultiTouchExplosion = (touches: Touch[]) => {
    // Calculate center point of all touches
    const centerX = touches.reduce((sum, touch) => sum + touch.clientX, 0) / touches.length;
    const centerY = touches.reduce((sum, touch) => sum + touch.clientY, 0) / touches.length;
    
    // Create explosion effect
    const explosionElement = document.createElement('div');
    explosionElement.style.cssText = `
      position: fixed;
      left: ${centerX}px;
      top: ${centerY}px;
      width: 20px;
      height: 20px;
      background: radial-gradient(circle, #FFD700, transparent);
      border-radius: 50%;
      transform: translate(-50%, -50%);
      animation: touchExplosion 0.8s ease-out forwards;
      pointer-events: none;
      z-index: 9999;
    `;
    
    document.body.appendChild(explosionElement);
    setTimeout(() => explosionElement.remove(), 800);
  };

  // Create quantum ripple effect
  const createQuantumRipple = (x: number, y: number, scale: number) => {
    const rippleElement = document.createElement('div');
    rippleElement.style.cssText = `
      position: fixed;
      left: ${x}px;
      top: ${y}px;
      width: 100px;
      height: 100px;
      border: 2px solid #9370DB;
      border-radius: 50%;
      transform: translate(-50%, -50%) scale(${scale});
      animation: quantumRipple 1s ease-out forwards;
      pointer-events: none;
      z-index: 9999;
      box-shadow: 0 0 20px #9370DB;
    `;
    
    document.body.appendChild(rippleElement);
    setTimeout(() => rippleElement.remove(), 1000);
  };

  // Setup touch event listeners
  useEffect(() => {
    if (!enabled || !containerRef.current) return;

    const container = containerRef.current;
    
    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: false });
    
    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [enabled, handleTouchStart, handleTouchMove, handleTouchEnd]);

  // Animate touch trails
  useEffect(() => {
    if (!showTrails) return;

    const animateTrails = () => {
      setTouchTrails(prev => {
        return prev
          .map(trail => ({
            ...trail,
            points: trail.points
              .map(point => ({
                ...point,
                opacity: point.opacity * 0.95,
                size: point.size * 0.98
              }))
              .filter(point => point.opacity > 0.1)
          }))
          .filter(trail => trail.points.length > 0);
      });

      animationRef.current = requestAnimationFrame(animateTrails);
    };

    animationRef.current = requestAnimationFrame(animateTrails);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [showTrails]);

  // Canvas trail rendering
  useEffect(() => {
    if (!canvasRef.current || !showTrails) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw touch trails
      touchTrails.forEach(trail => {
        if (trail.points.length < 2) return;

        ctx.save();
        ctx.strokeStyle = trail.color;
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.shadowBlur = 10;
        ctx.shadowColor = trail.color;

        ctx.beginPath();
        trail.points.forEach((point, index) => {
          ctx.globalAlpha = point.opacity;
          ctx.lineWidth = point.size;
          
          if (index === 0) {
            ctx.moveTo(point.x, point.y);
          } else {
            ctx.lineTo(point.x, point.y);
          }
        });
        ctx.stroke();
        ctx.restore();
      });

      requestAnimationFrame(render);
    };

    requestAnimationFrame(render);
  }, [showTrails, touchTrails]);

  return (
    <div 
      ref={containerRef}
      className={`touch-gestures ${multiTouchEffect ? 'multi-touch-active' : ''} ${className}`}
    >
      {/* Touch trail canvas */}
      {showTrails && (
        <canvas
          ref={canvasRef}
          className="touch-gestures__canvas"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            pointerEvents: 'none',
            zIndex: 9996
          }}
        />
      )}

      {/* Content */}
      <div className="touch-gestures__content">
        {children}
      </div>

      {/* Multi-touch indicator */}
      {multiTouchEffect && (
        <div className="touch-gestures__multi-indicator">
          <div className="multi-touch-text">
            ⚡ MULTI-TOUCH NEURAL ACTIVATION ⚡
          </div>
        </div>
      )}

      <style jsx>{`
        .touch-gestures {
          position: relative;
          width: 100%;
          min-height: 100vh;
          touch-action: none;
        }

        .touch-gestures__content {
          width: 100%;
          min-height: 100vh;
          transition: transform 0.3s ease;
        }

        .touch-gestures.multi-touch-active .touch-gestures__content {
          transform: scale(1.02);
          filter: drop-shadow(0 0 20px rgba(255, 215, 0, 0.5));
        }

        .touch-gestures__multi-indicator {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: rgba(0, 0, 0, 0.9);
          border: 2px solid #FFD700;
          border-radius: 16px;
          padding: 1rem 2rem;
          z-index: 9997;
          animation: multiTouchPulse 0.5s ease-in-out infinite alternate;
        }

        .multi-touch-text {
          color: #FFD700;
          font-weight: bold;
          text-align: center;
          font-size: 1.2rem;
          text-shadow: 0 0 10px rgba(255, 215, 0, 0.8);
        }

        @keyframes multiTouchPulse {
          from {
            box-shadow: 0 0 20px rgba(255, 215, 0, 0.5);
            transform: translate(-50%, -50%) scale(1);
          }
          to {
            box-shadow: 0 0 40px rgba(255, 215, 0, 0.8);
            transform: translate(-50%, -50%) scale(1.05);
          }
        }

        /* Global touch explosion animation */
        @keyframes touchExplosion {
          0% {
            width: 20px;
            height: 20px;
            opacity: 1;
          }
          50% {
            width: 200px;
            height: 200px;
            opacity: 0.6;
          }
          100% {
            width: 400px;
            height: 400px;
            opacity: 0;
          }
        }

        @keyframes quantumRipple {
          0% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -50%) scale(3);
            opacity: 0;
          }
        }

        /* Responsive touch targets */
        @media (max-width: 768px) {
          .touch-gestures {
            touch-action: manipulation;
          }

          .multi-touch-text {
            font-size: 1rem;
          }

          .touch-gestures__multi-indicator {
            padding: 0.75rem 1.5rem;
          }
        }

        /* Reduced motion */
        @media (prefers-reduced-motion: reduce) {
          .touch-gestures__content,
          .touch-gestures__multi-indicator {
            transition: none;
            animation: none;
          }

          .touch-gestures.multi-touch-active .touch-gestures__content {
            transform: none;
            filter: none;
          }
        }
      `}</style>

      {/* Global touch animation styles */}
      <style jsx global>{`
        @keyframes touchExplosion {
          0% {
            width: 20px;
            height: 20px;
            opacity: 1;
          }
          50% {
            width: 200px;
            height: 200px;
            opacity: 0.6;
          }
          100% {
            width: 400px;
            height: 400px;
            opacity: 0;
          }
        }

        @keyframes quantumRipple {
          0% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -50%) scale(3);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}