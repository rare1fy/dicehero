import React, { useEffect, useRef, useCallback } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  opacity: number;
}

interface ParticleEffectProps {
  type: 'idle' | 'hit' | 'heal' | 'fire' | 'poison' | 'victory' | 'death' | 'levelup';
  active: boolean;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  className?: string;
}

// 暗黑地牢色调粒子配色
const EFFECT_CONFIGS: Record<string, {
  count: number;
  colors: string[];
  speed: number;
  sizeRange: [number, number];
  lifeRange: [number, number];
  gravity: number;
  spread: number;
  continuous: boolean;
}> = {
  idle: {
    count: 2,
    colors: ['#3cc864', '#1a8b34', '#68e888'],
    speed: 0.3,
    sizeRange: [2, 4],
    lifeRange: [60, 120],
    gravity: -0.01,
    spread: 1,
    continuous: true,
  },
  hit: {
    count: 12,
    colors: ['#c8403c', '#e86860', '#c8a83c', '#fff'],
    speed: 3,
    sizeRange: [3, 6],
    lifeRange: [15, 30],
    gravity: 0.05,
    spread: Math.PI * 2,
    continuous: false,
  },
  heal: {
    count: 10,
    colors: ['#3cc864', '#68e888', '#1a8b34'],
    speed: 1.5,
    sizeRange: [3, 5],
    lifeRange: [25, 50],
    gravity: -0.03,
    spread: Math.PI * 0.5,
    continuous: false,
  },
  fire: {
    count: 8,
    colors: ['#c8403c', '#c87c3c', '#c8a83c', '#8b1a14'],
    speed: 1.2,
    sizeRange: [3, 6],
    lifeRange: [15, 35],
    gravity: -0.04,
    spread: Math.PI * 0.4,
    continuous: false,
  },
  poison: {
    count: 8,
    colors: ['#8b3cc8', '#5a1a8b', '#b068e8'],
    speed: 0.8,
    sizeRange: [3, 5],
    lifeRange: [25, 45],
    gravity: -0.02,
    spread: Math.PI * 0.6,
    continuous: false,
  },
  victory: {
    count: 4,
    colors: ['#c8a83c', '#e8d068', '#c8403c', '#3c6cc8', '#8b3cc8', '#3cc864', '#fff'],
    speed: 2.5,
    sizeRange: [3, 7],
    lifeRange: [50, 100],
    gravity: 0.02,
    spread: Math.PI * 2,
    continuous: true,
  },
  death: {
    count: 16,
    colors: ['#c8403c', '#8b1a14', '#4a0808', '#0a0a0f'],
    speed: 2,
    sizeRange: [4, 8],
    lifeRange: [25, 50],
    gravity: 0.03,
    spread: Math.PI * 2,
    continuous: false,
  },
  levelup: {
    count: 16,
    colors: ['#c8a83c', '#e8d068', '#fff', '#3cc864'],
    speed: 2,
    sizeRange: [3, 6],
    lifeRange: [35, 70],
    gravity: -0.02,
    spread: Math.PI * 2,
    continuous: false,
  },
};

export const ParticleCanvas: React.FC<ParticleEffectProps> = ({ 
  type, active, className = '',
  width = 200, height = 200 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animFrameRef = useRef<number>(0);
  const hasSpawnedRef = useRef(false);

  const spawnParticles = useCallback((config: typeof EFFECT_CONFIGS[string]) => {
    const newParticles: Particle[] = [];
    const cx = width / 2;
    const cy = height / 2;
    
    for (let i = 0; i < config.count; i++) {
      const angle = Math.random() * config.spread - config.spread / 2 - Math.PI / 2;
      const speed = config.speed * (0.5 + Math.random() * 0.5);
      const life = config.lifeRange[0] + Math.random() * (config.lifeRange[1] - config.lifeRange[0]);
      
      newParticles.push({
        x: cx + (Math.random() - 0.5) * 40,
        y: cy + (Math.random() - 0.5) * 40,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life,
        maxLife: life,
        size: config.sizeRange[0] + Math.random() * (config.sizeRange[1] - config.sizeRange[0]),
        color: config.colors[Math.floor(Math.random() * config.colors.length)],
        opacity: 1,
      });
    }
    
    particlesRef.current = [...particlesRef.current, ...newParticles];
  }, [width, height]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const config = EFFECT_CONFIGS[type];
    if (!config) return;

    // 关闭抗锯齿，保持像素感
    ctx.imageSmoothingEnabled = false;

    let running = true;

    const animate = () => {
      if (!running) return;
      
      ctx.clearRect(0, 0, width, height);
      
      if (active && config.continuous) {
        spawnParticles(config);
      }

      if (active && !config.continuous && !hasSpawnedRef.current) {
        spawnParticles(config);
        hasSpawnedRef.current = true;
      }

      particlesRef.current = particlesRef.current.filter(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += config.gravity;
        p.life--;
        p.opacity = Math.max(0, p.life / p.maxLife);
        
        if (p.life <= 0) return false;
        
        ctx.save();
        ctx.globalAlpha = p.opacity;
        ctx.fillStyle = p.color;
        // 使用方形像素粒子 (不用圆形)
        const s = Math.floor(p.size * p.opacity);
        ctx.fillRect(Math.floor(p.x), Math.floor(p.y), s, s);
        ctx.restore();
        
        return true;
      });

      animFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      running = false;
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [type, active, width, height, spawnParticles]);

  useEffect(() => {
    if (!active) {
      hasSpawnedRef.current = false;
    }
  }, [active]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className={`pointer-events-none ${className}`}
      style={{ imageRendering: 'pixelated' }}
    />
  );
};

// 像素化CSS粒子
export const CSSParticles: React.FC<{ 
  type: 'sparkle' | 'ember' | 'float';
  count?: number;
  className?: string;
}> = ({ type, count = 6, className = '' }) => {
  const particles = Array.from({ length: count }, (_, i) => {
    const delay = Math.random() * 3;
    const duration = 2 + Math.random() * 3;
    const x = Math.random() * 100;
    const size = type === 'sparkle' ? 3 + Math.random() * 3 : 4 + Math.random() * 4;
    
    // 暗黑地牢色调
    const colorMap = {
      sparkle: `hsl(${42 + Math.random() * 20}, 80%, ${50 + Math.random() * 20}%)`,
      ember: `hsl(${Math.random() * 25}, 80%, ${40 + Math.random() * 20}%)`,
      float: `hsl(${140 + Math.random() * 30}, 50%, ${30 + Math.random() * 20}%)`,
    };

    return (
      <div
        key={i}
        className="absolute animate-particle-float"
        style={{
          width: size,
          height: size,
          left: `${x}%`,
          bottom: type === 'ember' ? '0%' : `${Math.random() * 80}%`,
          backgroundColor: colorMap[type],
          borderRadius: '0px', // 方形像素粒子
          animationDelay: `${delay}s`,
          animationDuration: `${duration}s`,
          opacity: 0.5 + Math.random() * 0.3,
          imageRendering: 'pixelated' as any,
        }}
      />
    );
  });

  return <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>{particles}</div>;
};
