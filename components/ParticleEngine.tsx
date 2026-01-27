
import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ParticleConfig, ParticleTemplate } from '../types';

interface Props {
  config: ParticleConfig;
}

// Aliases for Three.js elements to bypass JSX intrinsic element type errors
const Points = 'points' as any;
const BufferGeometry = 'bufferGeometry' as any;
const BufferAttribute = 'bufferAttribute' as any;
const PointsMaterial = 'pointsMaterial' as any;

const ParticleEngine: React.FC<Props> = ({ config }) => {
  const meshRef = useRef<THREE.Points>(null!);
  const count = config.count;

  // Pre-calculate template positions
  const templatePoints = useMemo(() => {
    const points: Record<ParticleTemplate, Float32Array> = {
      [ParticleTemplate.HEARTS]: new Float32Array(count * 3),
      [ParticleTemplate.FLOWERS]: new Float32Array(count * 3),
      [ParticleTemplate.SATURN]: new Float32Array(count * 3),
      [ParticleTemplate.FIREWORKS]: new Float32Array(count * 3),
    };

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;

      // Heart shape
      const t = Math.random() * Math.PI * 2;
      const xH = 16 * Math.pow(Math.sin(t), 3);
      const yH = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
      points[ParticleTemplate.HEARTS][i3] = xH * 0.15;
      points[ParticleTemplate.HEARTS][i3 + 1] = yH * 0.15;
      points[ParticleTemplate.HEARTS][i3 + 2] = (Math.random() - 0.5) * 0.5;

      // Flower shape (Rose Curve)
      const phi = Math.random() * Math.PI * 2;
      const k = 5; // number of petals
      const r = Math.sin(k * phi);
      points[ParticleTemplate.FLOWERS][i3] = r * Math.cos(phi) * 3;
      points[ParticleTemplate.FLOWERS][i3 + 1] = r * Math.sin(phi) * 3;
      points[ParticleTemplate.FLOWERS][i3 + 2] = (Math.random() - 0.5) * 1.5;

      // Saturn shape (Sphere + Rings)
      if (i < count * 0.4) {
        // Sphere
        const u = Math.random();
        const v = Math.random();
        const theta2 = 2 * Math.PI * u;
        const phi2 = Math.acos(2 * v - 1);
        const rad = 1.5;
        points[ParticleTemplate.SATURN][i3] = rad * Math.sin(phi2) * Math.cos(theta2);
        points[ParticleTemplate.SATURN][i3 + 1] = rad * Math.sin(phi2) * Math.sin(theta2);
        points[ParticleTemplate.SATURN][i3 + 2] = rad * Math.cos(phi2);
      } else {
        // Rings
        const angle = Math.random() * Math.PI * 2;
        const radius = 2.2 + Math.random() * 1.5;
        points[ParticleTemplate.SATURN][i3] = radius * Math.cos(angle);
        points[ParticleTemplate.SATURN][i3 + 1] = (Math.random() - 0.5) * 0.1;
        points[ParticleTemplate.SATURN][i3 + 2] = radius * Math.sin(angle);
      }

      // Fireworks shape (Random Explosion)
      const explodeR = Math.random() * 5;
      const thetaE = Math.random() * Math.PI * 2;
      const phiE = Math.random() * Math.PI;
      points[ParticleTemplate.FIREWORKS][i3] = explodeR * Math.sin(phiE) * Math.cos(thetaE);
      points[ParticleTemplate.FIREWORKS][i3 + 1] = explodeR * Math.sin(phiE) * Math.sin(thetaE);
      points[ParticleTemplate.FIREWORKS][i3 + 2] = explodeR * Math.cos(phiE);
    }

    return points;
  }, [count]);

  const targetPositions = useMemo(() => new Float32Array(count * 3), [count]);
  const currentPositions = useMemo(() => new Float32Array(count * 3), [count]);
  const velocities = useMemo(() => new Float32Array(count * 3), [count]);

  // Update target positions based on active templates
  useEffect(() => {
    const active = Array.from(config.activeTemplates);
    if (active.length === 0) return;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      // Distribute particles across active templates
      const templateIdx = i % active.length;
      const template = active[templateIdx];
      const source = templatePoints[template];

      targetPositions[i3] = source[i3];
      targetPositions[i3 + 1] = source[i3 + 1];
      targetPositions[i3 + 2] = source[i3 + 2];
    }
  }, [config.activeTemplates, count, templatePoints, targetPositions]);

  useFrame((state, delta) => {
    const positions = meshRef.current.geometry.attributes.position.array as Float32Array;
    
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      
      // Calculate expansion force based on distance from center
      const currentX = positions[i3];
      const currentY = positions[i3 + 1];
      const currentZ = positions[i3 + 2];
      
      const distFromCenter = Math.sqrt(currentX*currentX + currentY*currentY + currentZ*currentZ);
      const expansionFactor = 1 + config.globalExpansion * 0.1;

      // Desired position modified by global scale and expansion
      const tx = targetPositions[i3] * config.globalScale * expansionFactor + config.swipeOffset.x;
      const ty = targetPositions[i3 + 1] * config.globalScale * expansionFactor + config.swipeOffset.y;
      const tz = targetPositions[i3 + 2] * config.globalScale * expansionFactor;

      // Simple smoothing/lerp towards target
      positions[i3] += (tx - positions[i3]) * 0.1;
      positions[i3 + 1] += (ty - positions[i3 + 1]) * 0.1;
      positions[i3 + 2] += (tz - positions[i3 + 2]) * 0.1;
    }
    
    meshRef.current.geometry.attributes.position.needsUpdate = true;
    meshRef.current.rotation.y += delta * 0.2;
    meshRef.current.rotation.x += delta * 0.1;
  });

  return (
    <Points ref={meshRef}>
      <BufferGeometry>
        <BufferAttribute
          attach="attributes-position"
          count={count}
          array={currentPositions}
          itemSize={3}
        />
      </BufferGeometry>
      <PointsMaterial
        size={0.03}
        color={config.color}
        transparent
        opacity={0.8}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </Points>
  );
};

export default ParticleEngine;
