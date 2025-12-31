
import React, { useEffect, useRef, useState } from 'react';

interface BackgroundEffectsProps {
  intensity: 'normal' | 'high';
  isInteracting: boolean;
  powerLevel?: number;
}

export const BackgroundEffects: React.FC<BackgroundEffectsProps> = ({ intensity, isInteracting, powerLevel = 0 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const gainNodesRef = useRef<{ master: GainNode; hum: GainNode; resonance: GainNode; chimes: GainNode } | null>(null);
  const oscillatorsRef = useRef<{ hum1: OscillatorNode; hum2: OscillatorNode; resonance: OscillatorNode } | null>(null);
  const [isAudioInitialized, setIsAudioInitialized] = useState(false);

  // Soundscape Initialization
  const initAudio = () => {
    if (audioContextRef.current) return;

    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    audioContextRef.current = ctx;

    const masterGain = ctx.createGain();
    const humGain = ctx.createGain();
    const resonanceGain = ctx.createGain();
    const chimesGain = ctx.createGain();

    masterGain.gain.value = 0.15; // Global volume
    humGain.gain.value = 0.4;
    resonanceGain.gain.value = 0.1;
    chimesGain.gain.value = 0.2;

    humGain.connect(masterGain);
    resonanceGain.connect(masterGain);
    chimesGain.connect(masterGain);
    masterGain.connect(ctx.destination);

    // Cosmic Hum (Beating Sine Waves)
    const hum1 = ctx.createOscillator();
    const hum2 = ctx.createOscillator();
    hum1.type = 'sine';
    hum2.type = 'sine';
    hum1.frequency.value = 55; // A1
    hum2.frequency.value = 55.5; // Slight detune for beating
    
    hum1.connect(humGain);
    hum2.connect(humGain);
    hum1.start();
    hum2.start();

    // Neural Resonance
    const resonance = ctx.createOscillator();
    resonance.type = 'triangle';
    resonance.frequency.value = 110;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q.value = 10;
    resonance.connect(filter);
    filter.connect(resonanceGain);
    resonance.start();

    oscillatorsRef.current = { hum1, hum2, resonance };
    gainNodesRef.current = { master: masterGain, hum: humGain, resonance: resonanceGain, chimes: chimesGain };
    
    setIsAudioInitialized(true);
  };

  // Trigger ethereal chimes with dynamic complexity
  const triggerChime = () => {
    if (!audioContextRef.current || !gainNodesRef.current) return;
    const ctx = audioContextRef.current;
    const gain = gainNodesRef.current.chimes;

    const osc = ctx.createOscillator();
    const env = ctx.createGain();
    const subOsc = ctx.createOscillator(); // Harmonic companion
    const subEnv = ctx.createGain();
    
    // Wave shape evolution based on power level
    if (powerLevel < 30) {
      osc.type = 'sine';
    } else if (powerLevel < 70) {
      osc.type = Math.random() > 0.4 ? 'sine' : 'triangle';
    } else {
      const rand = Math.random();
      osc.type = rand > 0.6 ? 'sine' : rand > 0.2 ? 'triangle' : 'sawtooth';
    }

    // Frequency logic: Pentatonic scale with power-level octaves
    const baseFreqs = [523.25, 587.33, 659.25, 783.99, 880.00, 1046.50]; // C5 to C6
    const baseFreq = baseFreqs[Math.floor(Math.random() * baseFreqs.length)];
    
    // As powerLevel grows, allow higher frequencies and more "crystalline" overtones
    const octaveShift = powerLevel > 80 ? (Math.random() > 0.5 ? 2 : 1) : (powerLevel > 40 ? 1 : 0);
    const finalFreq = baseFreq * Math.pow(2, octaveShift) * (1 + (powerLevel / 400));
    
    osc.frequency.setValueAtTime(finalFreq, ctx.currentTime);
    
    // Harmonic companion settings
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(finalFreq * 1.5, ctx.currentTime); // Perfect fifth
    subOsc.detune.setValueAtTime((Math.random() - 0.5) * (powerLevel / 5), ctx.currentTime);

    // Envelope for main chime
    const attack = 0.05 + (Math.random() * 0.1);
    const decay = 2 + (powerLevel / 40);
    env.gain.setValueAtTime(0, ctx.currentTime);
    env.gain.linearRampToValueAtTime(0.08 + (powerLevel / 1000), ctx.currentTime + attack);
    env.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + decay);

    // Envelope for harmonic sub chime
    subEnv.gain.setValueAtTime(0, ctx.currentTime);
    subEnv.gain.linearRampToValueAtTime(0.02 + (powerLevel / 2000), ctx.currentTime + attack * 2);
    subEnv.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + decay * 0.8);

    osc.connect(env);
    env.connect(gain);
    
    subOsc.connect(subEnv);
    subEnv.connect(gain);
    
    osc.start();
    subOsc.start();
    
    osc.stop(ctx.currentTime + decay + 0.1);
    subOsc.stop(ctx.currentTime + decay + 0.1);
  };

  // Soundscape Update based on Power Level
  useEffect(() => {
    if (!isAudioInitialized || !oscillatorsRef.current || !gainNodesRef.current || !audioContextRef.current) return;

    const ctx = audioContextRef.current;
    const { hum1, hum2, resonance } = oscillatorsRef.current;
    const { hum, resonance: resGain } = gainNodesRef.current;

    const time = ctx.currentTime + 0.5;

    // Shift frequencies and volumes
    hum1.frequency.exponentialRampToValueAtTime(55 + (powerLevel / 10), time);
    hum2.frequency.exponentialRampToValueAtTime(55.5 + (powerLevel / 10), time);
    resonance.frequency.exponentialRampToValueAtTime(110 + (powerLevel * 2), time);

    hum.gain.linearRampToValueAtTime(0.3 + (powerLevel / 300), time);
    resGain.gain.linearRampToValueAtTime(0.05 + (powerLevel / 500), time);

  }, [powerLevel, isAudioInitialized]);

  // Periodic Chimes
  useEffect(() => {
    if (!isAudioInitialized) return;
    const interval = setInterval(() => {
      // Frequency of chimes increases as power level rises
      const spawnChance = 0.2 + (powerLevel / 150);
      if (Math.random() < spawnChance) {
        triggerChime();
      }
    }, 2500 - (powerLevel * 10)); // Faster interval with high power
    return () => clearInterval(interval);
  }, [isAudioInitialized, powerLevel]);

  // Canvas Visuals
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Particle[] = [];
    let ribbons: Ribbon[] = [];
    const particleCount = intensity === 'high' ? 150 : 60;
    const ribbonCount = intensity === 'high' ? 6 : 2;
    
    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;

    class Particle {
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      color: string;
      alpha: number;

      constructor() {
        this.x = Math.random() * canvas!.width;
        this.y = Math.random() * canvas!.height;
        this.size = Math.random() * 1.5 + 0.2;
        const speedScale = 0.1 + (powerLevel / 100) * 0.8;
        this.speedX = (Math.random() - 0.5) * speedScale;
        this.speedY = (Math.random() - 0.5) * speedScale;
        this.color = Math.random() > 0.7 ? '#67E8F9' : '#8B5CF6';
        this.alpha = Math.random() * 0.3 + 0.05;
      }

      update() {
        this.x += this.speedX;
        this.y += this.speedY;

        const dx = mouseX - this.x;
        const dy = mouseY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < 250) {
          const force = (250 - distance) / 250;
          this.x += dx * force * 0.005;
          this.y += dy * force * 0.005;
        }

        if (this.x > canvas!.width) this.x = 0;
        else if (this.x < 0) this.x = canvas!.width;
        if (this.y > canvas!.height) this.y = 0;
        else if (this.y < 0) this.y = canvas!.height;
      }

      draw() {
        if (!ctx) return;
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
      }
    }

    class Ribbon {
      points: {x: number, y: number}[];
      color: string;
      offset: number;
      speed: number;

      constructor() {
        this.points = [];
        for(let i = 0; i < 5; i++) {
          this.points.push({ x: Math.random() * canvas!.width, y: Math.random() * canvas!.height });
        }
        this.color = Math.random() > 0.5 ? 'rgba(6, 182, 212, 0.03)' : 'rgba(139, 92, 246, 0.03)';
        if (powerLevel > 80) this.color = 'rgba(236, 72, 153, 0.04)';
        this.offset = Math.random() * 1000;
        this.speed = 0.0005 + (powerLevel / 20000);
      }

      update(time: number) {
        this.points.forEach((p, i) => {
          p.x += Math.sin(time * this.speed + i + this.offset) * 0.3;
          p.y += Math.cos(time * this.speed + i + this.offset) * 0.3;
        });
      }

      draw() {
        if (!ctx || this.points.length < 2) return;
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 0.5 + (powerLevel / 40);
        ctx.beginPath();
        ctx.moveTo(this.points[0].x, this.points[0].y);
        for(let i = 1; i < this.points.length - 1; i++) {
          const xc = (this.points[i].x + this.points[i+1].x) / 2;
          const yc = (this.points[i].y + this.points[i+1].y) / 2;
          ctx.quadraticCurveTo(this.points[i].x, this.points[i].y, xc, yc);
        }
        ctx.stroke();
      }
    }

    const init = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      particles = [];
      ribbons = [];
      for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
      }
      for (let i = 0; i < ribbonCount; i++) {
        ribbons.push(new Ribbon());
      }
    };

    const handleResize = () => {
      init();
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };

    const animate = (time: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      if (powerLevel > 60) {
        ctx.fillStyle = `rgba(139, 92, 246, ${(powerLevel - 60) / 2000})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      const maxDistance = 150 + (powerLevel / 4);
      ctx.lineWidth = 0.2;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          if (distance < maxDistance) {
            const alpha = (1 - distance / maxDistance) * 0.1;
            ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      ribbons.forEach(r => {
        r.update(time);
        r.draw();
      });

      particles.forEach(p => {
        p.update();
        p.draw();
      });

      if (isInteracting) {
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.05)';
        ctx.beginPath();
        ctx.arc(mouseX, mouseY, (time % 800) / 4, 0, Math.PI * 2);
        ctx.stroke();
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    init();
    animationFrameId = requestAnimationFrame(animate);

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, [intensity, powerLevel, isInteracting]);

  return (
    <>
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none z-0 transition-opacity duration-1000"
        style={{ 
          opacity: intensity === 'high' ? 0.7 : 0.3,
          filter: powerLevel > 95 ? 'saturate(1.5)' : 'none'
        }}
      />
      
      {!isAudioInitialized && (
        <button 
          onClick={initAudio}
          className="fixed bottom-32 left-10 z-[100] bg-white/5 border border-white/10 px-4 py-2 rounded-full text-[10px] uppercase tracking-widest text-gray-400 hover:bg-white/10 hover:text-cyan-400 transition-all backdrop-blur-md"
        >
          🔊 فعال‌سازی اتمسفر صوتی
        </button>
      )}
    </>
  );
};
