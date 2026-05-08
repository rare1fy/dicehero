/**
 * PixelCheck — 像素风 ✓ 对勾图标（7x7 绿色）
 * [TOAST-ICON 2026-05-09] 用于"成功/购买/存档"类 toast
 */
import React from 'react';

interface PixelIconProps {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

const GREEN_LIGHT = '#aef28a';
const GREEN_MID = '#5cb046';
const GREEN_DARK = '#2f6a1e';

const CHECK: readonly (readonly string[])[] = [
  ['', '', '', '', '', '', GREEN_LIGHT],
  ['', '', '', '', '', GREEN_LIGHT, GREEN_MID],
  ['', '', '', '', GREEN_LIGHT, GREEN_MID, GREEN_DARK],
  [GREEN_DARK, '', '', GREEN_LIGHT, GREEN_MID, GREEN_DARK, ''],
  [GREEN_MID, GREEN_DARK, GREEN_LIGHT, GREEN_MID, GREEN_DARK, '', ''],
  [GREEN_LIGHT, GREEN_MID, GREEN_DARK, '', '', '', ''],
  ['', GREEN_DARK, '', '', '', '', ''],
];

const generateShadow = (pixels: readonly (readonly string[])[], ps: number): string => {
  const shadows: string[] = [];
  for (let r = 0; r < pixels.length; r++) {
    for (let c = 0; c < pixels[r].length; c++) {
      const color = pixels[r][c];
      if (color) shadows.push(`${c * ps}px ${r * ps}px 0 ${color}`);
    }
  }
  return shadows.join(',');
};

export const PixelCheck: React.FC<PixelIconProps> = ({ size = 2, className, style }) => {
  const w = CHECK[0].length;
  const h = CHECK.length;
  return (
    <div className={`inline-block relative ${className || ''}`} style={{ width: w * size, height: h * size, ...style }}>
      <div style={{ position: 'absolute', width: size, height: size, boxShadow: generateShadow(CHECK, size), imageRendering: 'pixelated' }} />
    </div>
  );
};
