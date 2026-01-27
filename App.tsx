
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import ParticleEngine from './components/ParticleEngine';
import Controls from './components/Controls';
import HandTracker from './components/HandTracker';
import SoundEngine from './components/SoundEngine';
import { ParticleTemplate, ParticleConfig, HandData } from './types';

// Aliases for Three.js elements to bypass JSX intrinsic element type errors
const Color = 'color' as any;
const AmbientLight = 'ambientLight' as any;
const PointLight = 'pointLight' as any;

const App: React.FC = () => {
  const [config, setConfig] = useState<ParticleConfig>({
    count: 20000,
    color: '#00f2ff',
    activeTemplates: new Set([ParticleTemplate.SATURN]),
    globalScale: 1,
    globalExpansion: 0.2,
    swipeOffset: { x: 0, y: 0 },
    isMuted: false // Sound is active by default; browser policies will handle initialization on first interaction
  });

  const [hands, setHands] = useState<HandData[]>([]);
  const [isCameraActive, setIsCameraActive] = useState(true);

  // Gesture mapping logic
  useEffect(() => {
    if (hands.length > 0) {
      // Calculate average metrics from both hands
      let avgPinch = 0;
      let avgExpansion = 0;
      let avgPalmX = 0;
      let avgPalmY = 0;

      hands.forEach(h => {
        avgPinch += h.pinch;
        avgExpansion += h.expansion;
        avgPalmX += (h.palmPos.x - 0.5);
        avgPalmY += (h.palmPos.y - 0.5);
      });

      avgPinch /= hands.length;
      avgExpansion /= hands.length;
      avgPalmX /= hands.length;
      avgPalmY /= hands.length;

      setConfig(prev => ({
        ...prev,
        // Scale is controlled by pinch (thumb-index distance)
        // Tension/Expansion is controlled by how open the palm is
        globalScale: 0.5 + avgPinch * 3,
        globalExpansion: avgExpansion * 4,
        swipeOffset: {
          x: avgPalmX * 15,
          y: -avgPalmY * 15
        }
      }));
    }
  }, [hands]);

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      {/* Sound System */}
      <SoundEngine config={config} hands={hands} />

      {/* 3D Scene */}
      <Canvas
        camera={{ position: [0, 0, 10], fov: 60 }}
        gl={{ antialias: true, alpha: true }}
      >
        <Color attach="background" args={['#050505']} />
        <AmbientLight intensity={0.5} />
        <PointLight position={[10, 10, 10]} />
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
        
        <ParticleEngine config={config} />
        
        <OrbitControls 
          enableDamping 
          dampingFactor={0.05} 
          rotateSpeed={0.5}
          makeDefault 
        />
      </Canvas>

      {/* Camera & Hand Tracking Overlay */}
      <HandTracker 
        onHandsDetected={setHands} 
        isActive={isCameraActive} 
      />

      {/* UI Overlay */}
      <Controls 
        config={config} 
        setConfig={setConfig} 
        isCameraActive={isCameraActive}
        setIsCameraActive={setIsCameraActive}
      />

      {/* On-screen Instructions */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 pointer-events-none text-center opacity-60">
        <p className="text-xs uppercase tracking-widest text-white/50 mb-2">Instructions</p>
        <div className="flex gap-4 text-[10px] font-medium text-white/80">
          <span>Pinch: Scale</span>
          <span>Open Palm: Expand</span>
          <span>Move Hand: Position</span>
        </div>
      </div>
    </div>
  );
};

export default App;
