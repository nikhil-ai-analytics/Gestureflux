
export enum ParticleTemplate {
  HEARTS = 'hearts',
  FLOWERS = 'flowers',
  SATURN = 'saturn',
  FIREWORKS = 'fireworks'
}

export interface HandData {
  id: number;
  score: number;
  label: 'Left' | 'Right';
  landmarks: { x: number; y: number; z: number }[];
  pinch: number; // 0 to 1
  expansion: number; // 0 to 1
  palmPos: { x: number; y: number; z: number };
}

export interface ParticleConfig {
  count: number;
  color: string;
  activeTemplates: Set<ParticleTemplate>;
  globalScale: number;
  globalExpansion: number;
  swipeOffset: { x: number; y: number };
  isMuted: boolean;
}
