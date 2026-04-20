/**
 * MapEffects.tsx — 地图视觉效果子组件
 * ARCH-H: 从 MapScreen.tsx 拆分出的独立子组件
 *
 * 包含：全屏粒子、顶部/底部淡雾
 */

import React from 'react';

interface ParticleData {
  left: string;
  top: string;
  size: number;
  duration: number;
  delay: number;
  opacity: number;
  dx: number;
  dy: number;
  dx2: number;
  dy2: number;
}

interface MapEffectsProps {
  particles: ParticleData[];
  particleClass: string;
  fogColor: string;
}

export const MapEffects: React.FC<MapEffectsProps> = ({ particles, particleClass, fogColor }) => (
  <>
    {/* 章节主题粒子效果 */}
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-[1]">
      {particles.map((p, i) => (
        <div
          key={`mp-${i}`}
          className={`map-particle ${particleClass}`}
          style={{
            left: p.left, top: p.top, width: p.size, height: p.size,
            animationDuration: `${p.duration}s`, animationDelay: `${p.delay}s`,
            opacity: p.opacity,
            '--dx': `${p.dx}px`, '--dy': `${p.dy}px`,
            '--dx2': `${p.dx2}px`, '--dy2': `${p.dy2}px`,
          } as React.CSSProperties}
        />
      ))}
    </div>

    {/* 顶部淡雾 */}
    <div className="absolute top-0 left-0 right-0 h-[10%] pointer-events-none z-[2]" style={{
      background: `linear-gradient(to bottom, ${fogColor.replace(/[\d.]+\)$/, '0.25)')} 0%, transparent 100%)`,
    }} />
    {/* 底部淡雾 */}
    <div className="absolute bottom-0 left-0 right-0 h-[12%] pointer-events-none z-[2]" style={{
      background: `linear-gradient(to top, ${fogColor.replace(/[\d.]+\)$/, '0.3)')} 0%, transparent 100%)`,
    }} />
  </>
);
