import React from 'react';
import {
  PixelSword, PixelPair, PixelLayers, PixelFlame, PixelHouse,
  PixelArrowUp, PixelDroplet, PixelHeart, PixelStar
} from '../components/PixelIcons';
import { DiceElement } from '../types/game';

export const getAugmentIcon = (condition: string, size = 12) => {
  const ps = Math.max(1, Math.round(size / 6));
  switch (condition) {
    case 'high_card': return <PixelSword size={ps} />;
    case 'pair': return <PixelPair size={ps} />;
    case 'two_pair': return <PixelLayers size={ps} />;
    case 'n_of_a_kind': return <PixelFlame size={ps} />;
    case 'full_house': return <PixelHouse size={ps} />;
    case 'straight': return <PixelArrowUp size={ps} />;
    case 'same_element': return <PixelDroplet size={ps} />;
    case 'element_count': return <PixelHeart size={ps} />;
    default: return <PixelStar size={ps} />;
  }
};

// 元素→CSS样式映射
const ELEMENT_STYLE_MAP: Record<DiceElement, { diceClass: string; glowClass: string; effectClass: string; textureClass: string }> = {
  normal:  { diceClass: 'pixel-dice-white',  glowClass: 'dice-glow-white',   effectClass: '',                     textureClass: '' },
  fire:    { diceClass: 'pixel-dice-red',    glowClass: 'dice-glow-fire',    effectClass: 'dice-element-fire',    textureClass: 'dice-texture-fire' },
  ice:     { diceClass: 'pixel-dice-blue',   glowClass: 'dice-glow-ice',     effectClass: 'dice-element-ice',     textureClass: 'dice-texture-ice' },
  thunder: { diceClass: 'pixel-dice-gold',   glowClass: 'dice-glow-thunder', effectClass: 'dice-element-thunder', textureClass: 'dice-texture-thunder' },
  poison:  { diceClass: 'pixel-dice-purple', glowClass: 'dice-glow-poison',  effectClass: 'dice-element-poison',  textureClass: 'dice-texture-poison' },
  holy:    { diceClass: 'pixel-dice-gold',   glowClass: 'dice-glow-holy',    effectClass: 'dice-element-holy',    textureClass: 'dice-texture-holy' },
};

// 8-Bit 像素风骰子样式 — 基于元素类型
export const getDiceElementClass = (element: DiceElement, selected: boolean, rolling?: boolean, invalid?: boolean, diceDefId?: string) => {
  const base = 'pixel-dice ';
  const selection = selected ? 'pixel-dice-selected ' : '';
  const rollAnim = rolling ? 'animate-pulse opacity-70 ' : '';
  const invalidStyle = invalid ? 'pixel-dice-invalid ' : '';

  // Heavy dice (lead) - distinct gray metallic look
  if (diceDefId === 'heavy') {
    const heavyGlow = selected && !invalid ? 'dice-glow-heavy' : '';
    return base + selection + rollAnim + invalidStyle + 'pixel-dice-heavy ' + heavyGlow;
  }

  const style = ELEMENT_STYLE_MAP[element] || ELEMENT_STYLE_MAP.normal;
  const glow = selected && !invalid ? style.glowClass : '';
  const effect = !rolling && !invalid ? style.effectClass : '';
  const texture = !rolling && !invalid ? style.textureClass : '';

  return base + selection + rollAnim + invalidStyle + style.diceClass + ' ' + glow + ' ' + effect + ' ' + texture;
};

// 像素HP条颜色
export const getHpBarClass = (hp: number, maxHp: number): string => {
  const ratio = hp / maxHp;
  if (ratio > 0.6) return 'pixel-hp-fill-healthy';
  if (ratio > 0.3) return 'pixel-hp-fill-warning';
  return 'pixel-hp-fill-critical';
};

// 元素名称映射 (用于日志和UI显示)
export const ELEMENT_NAMES: Record<DiceElement, string> = {
  normal: '普通',
  fire: '火',
  ice: '冰',
  thunder: '雷',
  poison: '毒',
  holy: '圣',
};

// 元素颜色映射 (用于文字着色)
export const ELEMENT_COLORS: Record<DiceElement, string> = {
  normal: '#8899aa',
  fire: '#e07830',
  ice: '#30a8d0',
  thunder: '#c070e0',
  poison: '#70c030',
  holy: '#d4a030',
};
