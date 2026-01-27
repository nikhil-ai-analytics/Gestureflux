
import React, { useEffect, useRef } from 'react';
import { HandData } from '../types';

interface Props {
  onHandsDetected: (hands: HandData[]) => void;
  isActive: boolean;
}

const HandTracker: React.FC<Props> = ({ onHandsDetected, isActive }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const handsModelRef = useRef<any>(null);
  const cameraRef = useRef<any>(null);

  useEffect(() => {
    // Extract MediaPipe objects from window to bypass TypeScript property errors
    const { Hands, Camera, drawConnectors, drawLandmarks, HAND_CONNECTIONS } = window as any;
    
    if (!Hands || !Camera) return;

    const hands = new Hands({
      locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
    });

    hands.setOptions({
      maxNumHands: 2,
      modelComplexity: 1,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });

    hands.onResults((results: any) => {
      // Draw to preview canvas
      if (canvasRef.current && videoRef.current) {
        const canvasCtx = canvasRef.current.getContext('2d')!;
        canvasCtx.save();
        canvasCtx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        
        // Horizontal flip for mirror effect
        canvasCtx.translate(canvasRef.current.width, 0);
        canvasCtx.scale(-1, 1);
        
        canvasCtx.drawImage(results.image, 0, 0, canvasRef.current.width, canvasRef.current.height);

        const detectedHands: HandData[] = [];

        if (results.multiHandLandmarks) {
          for (let i = 0; i < results.multiHandLandmarks.length; i++) {
            const landmarks = results.multiHandLandmarks[i];
            const label = results.multiHandedness[i].label;
            
            // Draw skeleton
            drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, { color: '#ffffff', lineWidth: 1 });
            drawLandmarks(canvasCtx, landmarks, { color: label === 'Left' ? '#00f2ff' : '#ff0080', lineWidth: 0.5, radius: 2 });

            // Calculate pinch (Distance between thumb tip and index tip)
            const thumbTip = landmarks[4];
            const indexTip = landmarks[8];
            const pinchDist = Math.sqrt(
              Math.pow(thumbTip.x - indexTip.x, 2) + 
              Math.pow(thumbTip.y - indexTip.y, 2)
            );
            
            // Normalize pinch: 0.05 (pinched) to 0.25 (wide)
            const pinch = Math.max(0, Math.min(1, (pinchDist - 0.05) / 0.2));

            // Calculate expansion (Average distance of all fingertips from palm base)
            const wrist = landmarks[0];
            const fingertips = [8, 12, 16, 20].map(idx => landmarks[idx]);
            const avgFingerDist = fingertips.reduce((acc, f) => acc + Math.sqrt(Math.pow(f.x - wrist.x, 2) + Math.pow(f.y - wrist.y, 2)), 0) / 4;
            
            // Normalize expansion: 0.2 (closed) to 0.5 (open)
            const expansion = Math.max(0, Math.min(1, (avgFingerDist - 0.2) / 0.3));

            detectedHands.push({
              id: i,
              score: results.multiHandedness[i].score,
              label,
              landmarks,
              pinch,
              expansion,
              palmPos: landmarks[9] // Middle finger mcp as palm center
            });
          }
        }
        onHandsDetected(detectedHands);
        canvasCtx.restore();
      }
    });

    handsModelRef.current = hands;

    if (videoRef.current) {
      const camera = new Camera(videoRef.current, {
        onFrame: async () => {
          if (isActive) {
            await hands.send({ image: videoRef.current! });
          }
        },
        width: 320,
        height: 240
      });
      camera.start();
      cameraRef.current = camera;
    }

    return () => {
      cameraRef.current?.stop();
      handsModelRef.current?.close();
    };
  }, [onHandsDetected, isActive]);

  return (
    <div className="absolute top-6 right-6 z-20">
      <div className="relative glass-panel rounded-3xl overflow-hidden border-2 border-white/10 shadow-2xl">
        <video ref={videoRef} className="hidden" playsInline muted />
        <canvas 
          ref={canvasRef} 
          width={240} 
          height={180} 
          className="block w-full h-full object-cover"
        />
        <div className="absolute bottom-2 left-3 flex items-center gap-2">
            <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${isActive ? 'bg-emerald-400' : 'bg-red-400'}`} />
            <span className="text-[10px] font-bold text-white/50 tracking-widest uppercase">
                {isActive ? 'Tracking' : 'Paused'}
            </span>
        </div>
      </div>
    </div>
  );
};

export default HandTracker;
