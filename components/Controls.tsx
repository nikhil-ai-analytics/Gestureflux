
import React from 'react';
import { ParticleConfig, ParticleTemplate } from '../types';

interface Props {
  config: ParticleConfig;
  setConfig: React.Dispatch<React.SetStateAction<ParticleConfig>>;
  isCameraActive: boolean;
  setIsCameraActive: (val: boolean) => void;
}

const Controls: React.FC<Props> = ({ config, setConfig, isCameraActive, setIsCameraActive }) => {
  
  const toggleTemplate = (template: ParticleTemplate) => {
    setConfig(prev => {
      const newTemplates = new Set(prev.activeTemplates);
      if (newTemplates.has(template)) {
        if (newTemplates.size > 1) newTemplates.delete(template);
      } else {
        newTemplates.add(template);
      }
      return { ...prev, activeTemplates: newTemplates };
    });
  };

  const templates = [
    { id: ParticleTemplate.SATURN, label: 'Saturn', icon: '🪐' },
    { id: ParticleTemplate.HEARTS, label: 'Hearts', icon: '❤️' },
    { id: ParticleTemplate.FLOWERS, label: 'Flowers', icon: '🌸' },
    { id: ParticleTemplate.FIREWORKS, label: 'Fireworks', icon: '🎆' },
  ];

  return (
    <div className="absolute top-6 left-6 flex flex-col gap-6 w-80 z-20">
      {/* Header */}
      <div className="glass-panel p-6 rounded-3xl">
        <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
          NEBULA HANDS
        </h1>
        <p className="text-[10px] text-white/40 tracking-[0.2em] uppercase mt-1">
          Reactive Particle Weaver
        </p>
      </div>

      {/* Templates */}
      <div className="glass-panel p-6 rounded-3xl flex flex-col gap-4">
        <label className="text-xs font-semibold text-white/50 uppercase tracking-widest">Templates</label>
        <div className="grid grid-cols-2 gap-2">
          {templates.map((t) => (
            <button
              key={t.id}
              onClick={() => toggleTemplate(t.id)}
              className={`p-3 rounded-2xl flex items-center gap-2 transition-all duration-300 border ${
                config.activeTemplates.has(t.id)
                  ? 'bg-white/20 border-white/30 text-white scale-105'
                  : 'bg-white/5 border-transparent text-white/40 hover:bg-white/10'
              }`}
            >
              <span className="text-lg">{t.icon}</span>
              <span className="text-sm font-medium">{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Appearance */}
      <div className="glass-panel p-6 rounded-3xl flex flex-col gap-6">
        <div className="flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <label className="text-xs font-semibold text-white/50 uppercase tracking-widest">Particle Color</label>
            <div 
              className="w-6 h-6 rounded-full border border-white/20"
              style={{ backgroundColor: config.color }}
            />
          </div>
          <div className="flex gap-2">
            {['#00f2ff', '#ff0080', '#baff00', '#7a00ff', '#ffffff'].map((c) => (
              <button
                key={c}
                onClick={() => setConfig(prev => ({ ...prev, color: c }))}
                className={`w-8 h-8 rounded-xl transition-transform ${config.color === c ? 'scale-110 border-2 border-white' : 'scale-100'}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <label className="text-xs font-semibold text-white/50 uppercase tracking-widest">Density</label>
            <span className="text-[10px] font-mono text-white/40">{(config.count / 1000).toFixed(0)}K</span>
          </div>
          <input
            type="range"
            min="5000"
            max="100000"
            step="5000"
            value={config.count}
            onChange={(e) => setConfig(prev => ({ ...prev, count: parseInt(e.target.value) }))}
            className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
        </div>

        <button
          onClick={() => setIsCameraActive(!isCameraActive)}
          className={`w-full py-3 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all ${
            isCameraActive 
            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
            : 'bg-red-500/20 text-red-400 border border-red-500/30'
          }`}
        >
          Camera: {isCameraActive ? 'Active' : 'Paused'}
        </button>
      </div>
    </div>
  );
};

export default Controls;
