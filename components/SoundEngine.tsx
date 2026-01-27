
import React, { useEffect, useRef, useMemo } from 'react';
import { ParticleConfig, HandData } from '../types';

interface Props {
  config: ParticleConfig;
  hands: HandData[];
}

const SoundEngine: React.FC<Props> = ({ config, hands }) => {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  
  // Hand-specific synth components
  const handSynths = useRef<Map<number, { 
    osc: OscillatorNode, 
    filter: BiquadFilterNode, 
    gain: GainNode 
  }>>(new Map());

  // Ambient "nebula" hum
  const nebulaOscRef = useRef<OscillatorNode | null>(null);
  const nebulaFilterRef = useRef<BiquadFilterNode | null>(null);

  useEffect(() => {
    // Lazy initialize AudioContext on first user interaction or when unmuted
    if (!audioCtxRef.current && !config.isMuted) {
      const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
      const ctx = new AudioContextClass();
      audioCtxRef.current = ctx;

      const masterGain = ctx.createGain();
      masterGain.gain.value = 0.15; // Subtle master volume
      masterGain.connect(ctx.destination);
      masterGainRef.current = masterGain;

      // Create a background hum
      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      osc.type = 'sine';
      osc.frequency.value = 40;
      filter.type = 'lowpass';
      filter.frequency.value = 200;
      
      osc.connect(filter);
      filter.connect(masterGain);
      osc.start();
      
      nebulaOscRef.current = osc;
      nebulaFilterRef.current = filter;
    }

    if (audioCtxRef.current) {
      if (config.isMuted) {
        audioCtxRef.current.suspend();
      } else {
        audioCtxRef.current.resume();
      }
    }
  }, [config.isMuted]);

  // Handle template switch sound
  const prevTemplatesCount = useRef(config.activeTemplates.size);
  const prevTemplatesKey = useRef(Array.from(config.activeTemplates).join('-'));
  
  useEffect(() => {
    const currentKey = Array.from(config.activeTemplates).join('-');
    if (audioCtxRef.current && currentKey !== prevTemplatesKey.current) {
      const ctx = audioCtxRef.current;
      const chime = ctx.createOscillator();
      const chimeGain = ctx.createGain();
      
      chime.type = 'triangle';
      chime.frequency.setValueAtTime(440 + Math.random() * 200, ctx.currentTime);
      chime.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.1);
      
      chimeGain.gain.setValueAtTime(0.1, ctx.currentTime);
      chimeGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      
      chime.connect(chimeGain);
      if (masterGainRef.current) chimeGain.connect(masterGainRef.current);
      
      chime.start();
      chime.stop(ctx.currentTime + 0.5);
      
      prevTemplatesKey.current = currentKey;
    }
  }, [config.activeTemplates]);

  // Real-time hand gesture tracking to audio parameters
  useEffect(() => {
    if (!audioCtxRef.current || config.isMuted) return;
    const ctx = audioCtxRef.current;

    // Track active hand IDs to clean up old oscillators
    const currentHandIds = new Set(hands.map(h => h.id));
    
    // Clean up missing hands
    handSynths.current.forEach((synth, id) => {
      if (!currentHandIds.has(id)) {
        synth.gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
        setTimeout(() => {
          synth.osc.stop();
          synth.osc.disconnect();
          handSynths.current.delete(id);
        }, 150);
      }
    });

    // Update or create hand synths
    hands.forEach(hand => {
      let synth = handSynths.current.get(hand.id);
      
      if (!synth) {
        const osc = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();
        const gain = ctx.createGain();
        
        osc.type = 'sine';
        filter.type = 'bandpass';
        filter.Q.value = 5;
        gain.gain.value = 0; // Start silent

        osc.connect(filter);
        filter.connect(gain);
        if (masterGainRef.current) gain.connect(masterGainRef.current);
        
        osc.start();
        synth = { osc, filter, gain };
        handSynths.current.set(hand.id, synth);
      }

      // Map Pinch to Frequency (Tension)
      const targetFreq = 200 + (1 - hand.pinch) * 1000;
      synth.osc.frequency.setTargetAtTime(targetFreq, ctx.currentTime, 0.05);

      // Map Expansion to Filter Cutoff (Energy)
      const targetFilter = 500 + hand.expansion * 3000;
      synth.filter.frequency.setTargetAtTime(targetFilter, ctx.currentTime, 0.05);

      // Presence fade in
      synth.gain.gain.setTargetAtTime(0.15, ctx.currentTime, 0.1);
    });

    // Update Nebula hum based on global stats
    if (nebulaFilterRef.current && hands.length > 0) {
      const avgExpansion = hands.reduce((a, b) => a + b.expansion, 0) / hands.length;
      nebulaFilterRef.current.frequency.setTargetAtTime(100 + avgExpansion * 400, ctx.currentTime, 0.2);
    }
  }, [hands, config.isMuted]);

  return null; // Logic-only component
};

export default SoundEngine;
