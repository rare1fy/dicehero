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
const ELEMENT_STYLE_MAP: Record<DiceElement, { diceClass: string; glowClass: string }> = {
  normal: { diceClass: 'pixel-dice-blue', glowClass: 'dice-glow-blue' },
  fire: { diceClass: 'pixel-dice-red', glowClass: 'dice-glow-red' },
  ice: { diceClass: 'pixel-dice-blue', glowClass: 'dice-glow-blue' },
  thunder: { diceClass: 'pixel-dice-purple', glowClass: 'dice-glow-purple' },
  poison: { diceClass: 'pixel-dice-purple', glowClass: 'dice-glow-purple' },
  holy: { diceClass: 'pixel-dice-gold', glowClass: 'dice-glow-gold' },
  shadow: { diceClass: 'pixel-dice-purple', glowClass: 'dice-glow-purple' },
};

// 8-Bit 像素风骰子样式 — 基于元素类型
export const getDiceElementClass = (element: DiceElement, selected: boolean, rolling?: boolean, invalid?: boolean) => {
  const base = 'pixel-dice ';
  const selection = selected ? 'pixel-dice-selected ' : '';
  const rollAnim = rolling ? 'animate-pulse opacity-70 ' : '';
  const invalidStyle = invalid ? 'pixel-dice-invalid ' : '';

  const style = ELEMENT_STYLE_MAP[element] || ELEMENT_STYLE_MAP.normal;
  const glow = selected && !invalid ? style.glowClass : '';

  return base + selection + rollAnim + invalidStyle + style.diceClass + ' ' + glow;
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
  shadow: '暗',
};

// 元素颜色映射 (用于文字着色)
export const ELEMENT_COLORS: Record<DiceElement, string> = {
  normal: '#8899aa',
  fire: '#e07830',
  ice: '#30a8d0',
  thunder: '#c070e0',
  poison: '#70c030',
  holy: '#d4a030',
  shadow: '#9060c0',
};
