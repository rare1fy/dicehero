import React from 'react';
import { RELIC_PIXEL_DATA, DEFAULT_ICON } from '../data/relicPixelData';

/**
 * 遗物专属像素图标 — 每个遗物按其效果设计独立的 7x7 像素图标
 * 使用与 PixelIcons.tsx 相同的 CSS box-shadow 绘制体系
 */

interface RelicIconProps {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

const generateShadow = (pixels: string[][], ps: number): string => {
  const shadows: string[] = [];
  for (let r = 0; r < pixels.length; r++) {
    for (let c = 0; c < pixels[r].length; c++) {
      const color = pixels[r][c];
      if (color) shadows.push(`${c * ps}px ${r * ps}px 0 ${color}`);
    }
  }
  return shadows.join(',');
};

const Base: React.FC<{ pixels: string[][]; ps: number; className?: string; style?: React.CSSProperties }> = ({ pixels, ps, className = '', style }) => {
  const w = pixels[0]?.length || 0;
  const h = pixels.length;
  return (
    <div className={`inline-block relative ${className}`} style={{ width: w * ps, height: h * ps, ...style }}>
      <div style={{ position: 'absolute', width: ps, height: ps, boxShadow: generateShadow(pixels, ps), imageRendering: 'pixelated' }} />
    </div>
  );
};

/** 通用遗物图标组件 — 传入 relicId 自动渲染对应像素图标 */
export const RelicPixelIcon: React.FC<RelicIconProps & { relicId: string }> = ({ relicId, size = 2, className, style }) => {
  const pixels = RELIC_PIXEL_DATA[relicId] || DEFAULT_ICON;
  return <Base pixels={pixels} ps={size} className={className} style={style} />;
};
