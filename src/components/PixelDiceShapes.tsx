import React from 'react';
import type { DiceElement } from '../types/game';

/**
 * PixelDiceShapes.tsx - 元素骰子独特外形
 * 
 * 每种元素的骰子有独特的像素SVG外形标记，
 * 用于在骰子角落显示元素标识。
 */

interface ElementBadgeProps {
  element: DiceElement;
  size?: number;
}

// 火焰标记 - 小火苗
const FireBadge: React.FC<{ s: number }> = ({ s }) => (
  <svg width={s} height={s} viewBox="0 0 8 8" fill="none">
    <rect x="3" y="1" width="2" height="1" fill="#ff6b35"/>
    <rect x="2" y="2" width="4" height="1" fill="#ff6b35"/>
    <rect x="2" y="3" width="4" height="1" fill="#e05020"/>
    <rect x="1" y="4" width="6" height="1" fill="#e05020"/>
    <rect x="1" y="5" width="6" height="1" fill="#c03010"/>
    <rect x="2" y="6" width="4" height="1" fill="#c03010"/>
    <rect x="3" y="7" width="2" height="1" fill="#901808"/>
  </svg>
);

// 冰霜标记 - 雪花结晶
const IceBadge: React.FC<{ s: number }> = ({ s }) => (
  <svg width={s} height={s} viewBox="0 0 8 8" fill="none">
    <rect x="3" y="0" width="2" height="1" fill="#70d0f0"/>
    <rect x="3" y="7" width="2" height="1" fill="#70d0f0"/>
    <rect x="0" y="3" width="1" height="2" fill="#70d0f0"/>
    <rect x="7" y="3" width="1" height="2" fill="#70d0f0"/>
    <rect x="3" y="1" width="2" height="6" fill="#50b8e0"/>
    <rect x="1" y="3" width="6" height="2" fill="#50b8e0"/>
    <rect x="2" y="2" width="1" height="1" fill="#90e0ff"/>
    <rect x="5" y="2" width="1" height="1" fill="#90e0ff"/>
    <rect x="2" y="5" width="1" height="1" fill="#90e0ff"/>
    <rect x="5" y="5" width="1" height="1" fill="#90e0ff"/>
  </svg>
);

// 雷电标记 - 闪电
const ThunderBadge: React.FC<{ s: number }> = ({ s }) => (
  <svg width={s} height={s} viewBox="0 0 8 8" fill="none">
    <rect x="4" y="0" width="2" height="1" fill="#ffe040"/>
    <rect x="3" y="1" width="2" height="1" fill="#ffe040"/>
    <rect x="2" y="2" width="4" height="1" fill="#f0c020"/>
    <rect x="1" y="3" width="5" height="1" fill="#f0c020"/>
    <rect x="3" y="4" width="3" height="1" fill="#ffe040"/>
    <rect x="4" y="5" width="2" height="1" fill="#ffe040"/>
    <rect x="3" y="6" width="2" height="1" fill="#f0c020"/>
    <rect x="2" y="7" width="2" height="1" fill="#f0c020"/>
  </svg>
);

// 毒素标记 - 毒液滴
const PoisonBadge: React.FC<{ s: number }> = ({ s }) => (
  <svg width={s} height={s} viewBox="0 0 8 8" fill="none">
    <rect x="3" y="0" width="2" height="1" fill="#60c030"/>
    <rect x="2" y="1" width="4" height="1" fill="#60c030"/>
    <rect x="1" y="2" width="6" height="1" fill="#50a028"/>
    <rect x="1" y="3" width="6" height="1" fill="#50a028"/>
    <rect x="1" y="4" width="6" height="1" fill="#408020"/>
    <rect x="2" y="5" width="4" height="1" fill="#408020"/>
    <rect x="2" y="6" width="4" height="1" fill="#306018"/>
    <rect x="3" y="7" width="2" height="1" fill="#306018"/>
  </svg>
);

// 圣光标记 - 光环十字
const HolyBadge: React.FC<{ s: number }> = ({ s }) => (
  <svg width={s} height={s} viewBox="0 0 8 8" fill="none">
    <rect x="3" y="0" width="2" height="2" fill="#f0d060"/>
    <rect x="3" y="6" width="2" height="2" fill="#f0d060"/>
    <rect x="0" y="3" width="2" height="2" fill="#f0d060"/>
    <rect x="6" y="3" width="2" height="2" fill="#f0d060"/>
    <rect x="2" y="2" width="4" height="4" fill="#d4a030"/>
    <rect x="3" y="3" width="2" height="2" fill="#ffe890"/>
  </svg>
);

// 暗影标记 - 暗影之眼
const ShadowBadge: React.FC<{ s: number }> = ({ s }) => (
  <svg width={s} height={s} viewBox="0 0 8 8" fill="none">
    <rect x="2" y="2" width="4" height="1" fill="#8050b0"/>
    <rect x="1" y="3" width="6" height="2" fill="#6030a0"/>
    <rect x="2" y="5" width="4" height="1" fill="#8050b0"/>
    <rect x="3" y="3" width="2" height="2" fill="#c080f0"/>
    <rect x="3" y="1" width="1" height="1" fill="#a060d0"/>
    <rect x="4" y="6" width="1" height="1" fill="#a060d0"/>
  </svg>
);

/**
 * 元素标记组件 - 在骰子角落显示元素标识
 * normal 元素不显示标记
 */
export const ElementBadge: React.FC<ElementBadgeProps> = ({ element, size = 10 }) => {
  switch (element) {
    case 'fire': return <FireBadge s={size} />;
    case 'ice': return <IceBadge s={size} />;
    case 'thunder': return <ThunderBadge s={size} />;
    case 'poison': return <PoisonBadge s={size} />;
    case 'holy': return <HolyBadge s={size} />;
    case 'shadow': return <ShadowBadge s={size} />;
    default: return null;
  }
};

/**
 * 骰子稀有度边框颜色
 */
export const RARITY_COLORS: Record<string, string> = {
  common: 'var(--dungeon-panel-border)',
  uncommon: 'var(--pixel-green)',
  rare: 'var(--pixel-blue)',
  legendary: 'var(--pixel-gold)',
  curse: 'var(--pixel-red)',
};

export const RARITY_LABELS: Record<string, string> = {
  common: '普通',
  uncommon: '非凡',
  rare: '稀有',
  legendary: '传说',
  curse: '诅咒',
};

export const RARITY_TEXT_COLORS: Record<string, string> = {
  common: 'var(--dungeon-text-dim)',
  uncommon: 'var(--pixel-green-light)',
  rare: 'var(--pixel-blue-light)',
  legendary: 'var(--pixel-gold-light)',
  curse: 'var(--pixel-red-light)',
};
