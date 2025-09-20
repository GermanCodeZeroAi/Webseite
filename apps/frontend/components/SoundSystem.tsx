/**
 * SoundSystem - INSANE Audio Feedback System
 * 
 * KRASSE audio effects for interactions.
 * Features:
 * - Neural network activation sounds
 * - Liquid metal morphing audio
 * - Quantum state transition effects
 * - Business success celebration sounds
 * - AI-generated ambient soundscapes
 */

'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';

interface SoundSystemProps {
  enabled?: boolean;
  volume?: number;
  className?: string;
}

type SoundType = 
  | 'neural_fire'
  | 'liquid_morph'
  | 'quantum_shift'
  | 'success_chime'
  | 'error_pulse'
  | 'hover_whisper'
  | 'click_snap'
  | 'page_transition'
  | 'ai_thinking'
  | 'data_flow';

class AudioSynthesizer {
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;

  constructor() {
    if (typeof window !== 'undefined' && 'AudioContext' in window) {
      this.audioContext = new AudioContext();
      this.masterGain = this.audioContext.createGain();
      this.masterGain.connect(this.audioContext.destination);
      this.masterGain.gain.setValueAtTime(0.3, this.audioContext.currentTime);
    }
  }

  // Neural network firing sound
  playNeuralFire(): void {
    if (!this.audioContext || !this.masterGain) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    const filter = this.audioContext.createBiquadFilter();

    oscillator.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.masterGain);

    // Neural firing frequency sweep
    oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(1200, this.audioContext.currentTime + 0.1);
    oscillator.frequency.exponentialRampToValueAtTime(400, this.audioContext.currentTime + 0.3);

    // Filter for neural texture
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1000, this.audioContext.currentTime);
    filter.Q.setValueAtTime(5, this.audioContext.currentTime);

    // Envelope
    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.2, this.audioContext.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + 0.3);
  }

  // Liquid metal morphing sound
  playLiquidMorph(): void {
    if (!this.audioContext || !this.masterGain) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    const filter = this.audioContext.createBiquadFilter();

    oscillator.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.masterGain);

    // Liquid morphing frequency
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(200, this.audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(600, this.audioContext.currentTime + 0.5);

    // Low-pass filter for liquid texture
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, this.audioContext.currentTime);
    filter.frequency.exponentialRampToValueAtTime(1200, this.audioContext.currentTime + 0.5);

    // Smooth envelope
    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.15, this.audioContext.currentTime + 0.1);
    gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 0.5);

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + 0.5);
  }

  // Quantum state transition
  playQuantumShift(): void {
    if (!this.audioContext || !this.masterGain) return;

    // Create multiple oscillators for quantum superposition effect
    for (let i = 0; i < 3; i++) {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      const delay = this.audioContext.createDelay();
      const feedback = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(delay);
      delay.connect(feedback);
      feedback.connect(delay);
      feedback.connect(this.masterGain);

      // Quantum frequencies
      const baseFreq = 440 * Math.pow(2, i * 0.5);
      oscillator.frequency.setValueAtTime(baseFreq, this.audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(baseFreq * 2, this.audioContext.currentTime + 0.2);

      // Delay for quantum echo
      delay.delayTime.setValueAtTime(0.1 + i * 0.05, this.audioContext.currentTime);
      feedback.gain.setValueAtTime(0.3, this.audioContext.currentTime);

      // Envelope
      gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.1, this.audioContext.currentTime + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.4);

      oscillator.start(this.audioContext.currentTime + i * 0.05);
      oscillator.stop(this.audioContext.currentTime + 0.4);
    }
  }

  // Success celebration sound
  playSuccessChime(): void {
    if (!this.audioContext || !this.masterGain) return;

    // Major chord progression
    const frequencies = [523.25, 659.25, 783.99]; // C5, E5, G5
    
    frequencies.forEach((freq, index) => {
      const oscillator = this.audioContext!.createOscillator();
      const gainNode = this.audioContext!.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.masterGain!);

      oscillator.frequency.setValueAtTime(freq, this.audioContext!.currentTime);
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0, this.audioContext!.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.2, this.audioContext!.currentTime + 0.1);
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext!.currentTime + 1);

      oscillator.start(this.audioContext!.currentTime + index * 0.1);
      oscillator.stop(this.audioContext!.currentTime + 1);
    });
  }

  // Set master volume
  setVolume(volume: number): void {
    if (this.masterGain) {
      this.masterGain.gain.setValueAtTime(volume, this.audioContext!.currentTime);
    }
  }
}

export default function SoundSystem({ 
  enabled = true, 
  volume = 0.3, 
  className = '' 
}: SoundSystemProps) {
  const synthRef = useRef<AudioSynthesizer | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [userInteracted, setUserInteracted] = useState(false);

  // Initialize audio context after user interaction
  useEffect(() => {
    if (!enabled || isInitialized) return;

    const initAudio = () => {
      synthRef.current = new AudioSynthesizer();
      synthRef.current.setVolume(volume);
      setIsInitialized(true);
      setUserInteracted(true);
    };

    // Wait for user interaction to initialize audio
    const handleUserInteraction = () => {
      initAudio();
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('keydown', handleUserInteraction);
    };

    document.addEventListener('click', handleUserInteraction);
    document.addEventListener('keydown', handleUserInteraction);

    return () => {
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('keydown', handleUserInteraction);
    };
  }, [enabled, isInitialized, volume]);

  // Global sound effect function
  const playSound = useCallback((soundType: SoundType) => {
    if (!enabled || !isInitialized || !synthRef.current || !userInteracted) return;

    switch (soundType) {
      case 'neural_fire':
        synthRef.current.playNeuralFire();
        break;
      case 'liquid_morph':
        synthRef.current.playLiquidMorph();
        break;
      case 'quantum_shift':
        synthRef.current.playQuantumShift();
        break;
      case 'success_chime':
        synthRef.current.playSuccessChime();
        break;
      // Add more sound types as needed
    }
  }, [enabled, isInitialized, userInteracted]);

  // Expose sound system globally
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).playSound = playSound;
    }
  }, [playSound]);

  // Listen for custom sound events
  useEffect(() => {
    const handleSoundEvent = (event: CustomEvent<{ type: SoundType }>) => {
      playSound(event.detail.type);
    };

    document.addEventListener('playSound', handleSoundEvent as EventListener);
    
    return () => {
      document.removeEventListener('playSound', handleSoundEvent as EventListener);
    };
  }, [playSound]);

  return (
    <div className={`sound-system ${className}`}>
      {/* Audio context status indicator */}
      {enabled && !userInteracted && (
        <div className="sound-system__prompt">
          <small>🔊 Click anywhere to enable audio effects</small>
        </div>
      )}

      <style jsx>{`
        .sound-system__prompt {
          position: fixed;
          bottom: 20px;
          right: 20px;
          background: rgba(0, 0, 0, 0.8);
          color: #FFD700;
          padding: 0.5rem 1rem;
          border-radius: 8px;
          border: 1px solid rgba(255, 215, 0, 0.3);
          backdrop-filter: blur(10px);
          font-size: 0.8rem;
          z-index: 1000;
          animation: pulse 2s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 0.7; }
          50% { opacity: 1; }
        }

        @media (max-width: 768px) {
          .sound-system__prompt {
            bottom: 10px;
            right: 10px;
            font-size: 0.7rem;
            padding: 0.4rem 0.8rem;
          }
        }
      `}</style>
    </div>
  );
}

// Helper function to trigger sounds from anywhere
export const triggerSound = (soundType: SoundType) => {
  const event = new CustomEvent('playSound', { detail: { type: soundType } });
  document.dispatchEvent(event);
};

// Hook for easy sound integration
export const useSound = () => {
  return {
    playNeuralFire: () => triggerSound('neural_fire'),
    playLiquidMorph: () => triggerSound('liquid_morph'),
    playQuantumShift: () => triggerSound('quantum_shift'),
    playSuccessChime: () => triggerSound('success_chime'),
    playErrorPulse: () => triggerSound('error_pulse'),
    playHoverWhisper: () => triggerSound('hover_whisper'),
    playClickSnap: () => triggerSound('click_snap'),
    playPageTransition: () => triggerSound('page_transition'),
    playAiThinking: () => triggerSound('ai_thinking'),
    playDataFlow: () => triggerSound('data_flow')
  };
};