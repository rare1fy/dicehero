import React from 'react';
import { 
  PixelSword, PixelPair, PixelLayers, PixelFlame, PixelHouse, 
  PixelArrowUp, PixelDroplet, PixelHeart, PixelStar 
} from '../components/PixelIcons';
import { DiceColor } from '../types/game';

export const getAugmentIcon = (condition: string, size = 12) => {
  // size参数转换为像素块大小 (原来lucide-react的12px ≈ 像素块2)
  const ps = Math.max(1, Math.round(size / 6));
  switch (condition) {
    case 'high_card': return <PixelSword size={ps} />;
    case 'pair': return <PixelPair size={ps} />;
    case 'two_pair': return <PixelLayers size={ps} />;
    case 'n_of_a_kind': return <PixelFlame size={ps} />;
    case 'full_house': return <PixelHouse size={ps} />;
    case 'straight': return <PixelArrowUp size={ps} />;
    case 'flush': return <PixelDroplet size={ps} />;
    case 'red_count': return <PixelHeart size={ps} />;
    default: return <PixelStar size={ps} />;
  }
};

// 8-Bit 像素风骰子样式
export const getDiceColorClass = (color: DiceColor, selected: boolean, rolling?: boolean, invalid?: boolean) => {
  const base = "pixel-dice ";
  const selection = selected ? "pixel-dice-selected " : "";
  const rollAnim = rolling ? "animate-pulse opacity-70 " : "";
  const invalidStyle = invalid ? "pixel-dice-invalid " : "";
  
  const colorMap: Record<DiceColor, string> = {
    '红色': 'pixel-dice-red',
    '蓝色': 'pixel-dice-blue',
    '紫色': 'pixel-dice-purple',
    '金色': 'pixel-dice-gold',
  };
  
  const glow = selected && !invalid ? (
    color === '红色' ? 'dice-glow-red' :
    color === '蓝色' ? 'dice-glow-blue' :
    color === '紫色' ? 'dice-glow-purple' :
    color === '金色' ? 'dice-glow-gold' : ''
  ) : '';
  
  return base + selection + rollAnim + invalidStyle + (colorMap[color] || 'pixel-dice-blue') + ' ' + glow;
};

// 像素HP条颜色
export const getHpBarClass = (hp: number, maxHp: number): string => {
  const ratio = hp / maxHp;
  if (ratio > 0.6) return 'pixel-hp-fill-healthy';
  if (ratio > 0.3) return 'pixel-hp-fill-warning';
  return 'pixel-hp-fill-critical';
};

// 像素风敌人边框 — 暗黑地牢风格

// 像素风敌人背景 — 暗黑地牢风格
