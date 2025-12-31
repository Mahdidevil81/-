
import React, { useEffect, useState, useRef } from 'react';
import { Capability } from '../types';

interface CapabilityCardProps {
  capability: Capability;
}

export const CapabilityCard: React.FC<CapabilityCardProps> = ({ capability }) => {
  const [isLevelingUp, setIsLevelingUp] = useState(false);
  const prevLevelRef = useRef(capability.level);

  useEffect(() => {
    if (capability.level > prevLevelRef.current) {
      setIsLevelingUp(true);
      const timer = setTimeout(() => setIsLevelingUp(false), 1200);
      prevLevelRef.current = capability.level;
      return () => clearTimeout(timer);
    }
    prevLevelRef.current = capability.level;
  }, [capability.level]);

  return (
    <div 
      className="group relative overflow-hidden rounded-2xl bg-white/5 border border-white/10 p-6 transition-all duration-500 hover:bg-white/10 hover:border-[var(--cap-color)] hover:-translate-y-2 hover:shadow-2xl hover:shadow-[var(--cap-glow)]"
      style={{ 
        '--cap-color': capability.color,
        '--cap-glow': `${capability.color}33` // 20% opacity hex
      } as React.CSSProperties}
    >
      <div 
        className="absolute top-0 right-0 w-32 h-32 blur-[100px] rounded-full transition-all duration-700 group-hover:blur-[70px] group-hover:scale-150 opacity-30"
        style={{ backgroundColor: 'var(--cap-color)' }}
      />
      
      <div className="relative z-10">
        <div 
          className="mb-4 inline-flex p-3 rounded-xl bg-white/5 w-12 h-12 transition-all duration-500 group-hover:scale-110 group-hover:bg-[var(--cap-glow)]"
          style={{ color: 'var(--cap-color)' }}
        >
          {capability.icon}
        </div>
        <h3 
          className="text-xl font-bold mb-2 transition-colors duration-300 group-hover:text-[var(--cap-color)]"
        >
          {capability.title}
        </h3>
        <p className="text-gray-400 text-sm leading-relaxed mb-6">
          {capability.description}
        </p>
        
        <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden relative border border-white/5">
          <div 
            className={`h-full relative transition-all duration-[1500ms] ease-[cubic-bezier(0.34,1.56,0.64,1)] ${isLevelingUp ? 'animate-level-glow' : ''}`}
            style={{ 
              width: `${capability.level}%`, 
              backgroundColor: 'var(--cap-color)',
              boxShadow: isLevelingUp 
                ? `0 0 20px 2px var(--cap-color), 0 0 35px 4px var(--cap-color)` 
                : `0 0 10px var(--cap-color)`,
              color: capability.color
            }}
          >
            {/* Leading edge flare */}
            <div 
              className={`absolute right-0 top-0 h-full w-2 bg-white blur-[2px] transition-opacity duration-500 ${isLevelingUp ? 'opacity-100 scale-y-125' : 'opacity-0 scale-y-100'}`}
              style={{ boxShadow: `0 0 15px 2px white, 0 0 25px 4px var(--cap-color)` }}
            />
            
            {/* Shimmer overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer" />
          </div>
        </div>
        <div className="mt-2 flex justify-between text-[10px] uppercase tracking-wider text-gray-500 font-bold">
          <span className="opacity-60">ظرفیت کنونی</span>
          <span 
            className={`transition-all duration-500 ${isLevelingUp ? 'scale-125' : ''}`} 
            style={{ color: 'var(--cap-color)', textShadow: isLevelingUp ? `0 0 15px var(--cap-color)` : 'none' }}
          >
            {Math.round(capability.level)}%
          </span>
        </div>
      </div>
    </div>
  );
};
