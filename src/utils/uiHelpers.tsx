import React from 'react';

import { DiceElement } from '../types/game';




// 元素→CSS样式映射
const ELEMENT_STYLE_MAP: Record<DiceElement, { diceClass: string; glowClass: string; effectClass: string; textureClass: string }> = {
  normal:  { diceClass: 'pixel-dice-white',  glowClass: 'dice-glow-white',   effectClass: '',                     textureClass: '' },
  fire:    { diceClass: 'pixel-dice-red',    glowClass: 'dice-glow-fire',    effectClass: 'dice-element-fire',    textureClass: 'dice-texture-fire' },
  ice:     { diceClass: 'pixel-dice-blue',   glowClass: 'dice-glow-ice',     effectClass: 'dice-element-ice',     textureClass: 'dice-texture-ice' },
  thunder: { diceClass: 'pixel-dice-thunder', glowClass: 'dice-glow-thunder', effectClass: 'dice-element-thunder', textureClass: 'dice-texture-thunder' },
  poison:  { diceClass: 'pixel-dice-purple', glowClass: 'dice-glow-poison',  effectClass: 'dice-element-poison',  textureClass: 'dice-texture-poison' },
  holy:    { diceClass: 'pixel-dice-gold',   glowClass: 'dice-glow-holy',    effectClass: 'dice-element-holy',    textureClass: 'dice-texture-holy' },
};

// 8-Bit 像素风骰子样式 — 基于元素类型
export const getDiceElementClass = (element: DiceElement, selected: boolean, rolling?: boolean, invalid?: boolean, diceDefId?: string) => {
  const base = 'pixel-dice ';
  const selection = selected ? 'pixel-dice-selected ' : '';
  const rollAnim = rolling ? 'animate-pulse opacity-70 ' : '';
  const invalidStyle = '';  // pressure blackout removed

  // Heavy dice (lead) - distinct gray metallic look
  if (diceDefId === 'heavy') {
    const heavyGlow = selected && !invalid ? 'dice-glow-heavy' : '';
    return base + selection + rollAnim + invalidStyle + 'pixel-dice-heavy ' + heavyGlow;
  }

  // Blade dice - silver metallic with slash texture
  if (diceDefId === 'blade') {
    const bladeGlow = selected && !invalid ? 'dice-glow-blade' : '';
    return base + selection + rollAnim + invalidStyle + 'pixel-dice-blade ' + bladeGlow;
  }

  // Amplify dice - purple-blue with radial glow
  if (diceDefId === 'amplify') {
    const ampGlow = selected && !invalid ? 'dice-glow-amplify' : '';
    return base + selection + rollAnim + invalidStyle + 'pixel-dice-amplify ' + ampGlow;
  }

  // Split dice - teal green with crack lines
  if (diceDefId === 'split') {
    const splitGlow = selected && !invalid ? 'dice-glow-split' : '';
    return base + selection + rollAnim + invalidStyle + 'pixel-dice-split ' + splitGlow;
  }

  // Magnet dice - red-blue bicolor magnetic
  if (diceDefId === 'magnet') {
    const magnetGlow = selected && !invalid ? 'dice-glow-magnet' : '';
    return base + selection + rollAnim + invalidStyle + 'pixel-dice-magnet ' + magnetGlow;
  }

  // Joker dice - rainbow gradient with diamond pattern
  if (diceDefId === 'joker') {
    const jokerGlow = selected && !invalid ? 'dice-glow-joker' : '';
    return base + selection + rollAnim + invalidStyle + 'pixel-dice-joker ' + jokerGlow;
  }

  // Chaos dice - dark red + gold with swirl
  if (diceDefId === 'chaos') {
    const chaosGlow = selected && !invalid ? 'dice-glow-chaos' : '';
    return base + selection + rollAnim + invalidStyle + 'pixel-dice-chaos ' + chaosGlow;
  }

  // Cursed dice - dark purple with rune border
  if (diceDefId === 'cursed') {
    const cursedGlow = selected && !invalid ? 'dice-glow-cursed' : '';
    return base + selection + rollAnim + invalidStyle + 'pixel-dice-cursed ' + cursedGlow;
  }

  // Cracked dice - dark gray with visible cracks
  if (diceDefId === 'cracked') {
    const crackedGlow = selected && !invalid ? 'dice-glow-cracked' : '';
    return base + selection + rollAnim + invalidStyle + 'pixel-dice-cracked ' + crackedGlow;
  }

  // Elemental dice — show element-specific style when collapsed, default when in bag
  if (diceDefId === 'elemental') {
    if (element !== 'normal' && !rolling) {
      // Collapsed to a specific element — use that element's full style
      const elemStyle = ELEMENT_STYLE_MAP[element] || ELEMENT_STYLE_MAP.normal;
      const elemGlow = selected && !invalid ? elemStyle.glowClass : '';
      const elemEffect = !invalid ? elemStyle.effectClass : '';
      const elemTexture = !invalid ? elemStyle.textureClass : '';
      return base + selection + invalidStyle + elemStyle.diceClass + ' ' + elemGlow + ' ' + elemEffect + ' ' + elemTexture + ' dice-elemental-badge';
    }
    if (rolling && element !== 'normal') {
      // Rolling animation — show the cycling element's style briefly
      const cycleStyle = ELEMENT_STYLE_MAP[element] || ELEMENT_STYLE_MAP.normal;
      return base + selection + rollAnim + invalidStyle + cycleStyle.diceClass + ' dice-elemental-rolling';
    }
    // Default state (in bag / not yet collapsed)
    const defaultGlow = selected && !invalid ? 'dice-glow-elemental' : '';
    return base + selection + rollAnim + invalidStyle + 'pixel-dice-elemental ' + defaultGlow;
  }

  // === 职业骰子外观 — 每个骰子独特样式 ===
  if (diceDefId?.startsWith('w_') || diceDefId?.startsWith('mage_') || diceDefId?.startsWith('r_')) {
    const classPrefix = diceDefId.startsWith('w_') ? 'warrior' : diceDefId.startsWith('mage_') ? 'mage' : 'rogue';
    const classGlow = selected && !invalid ? `dice-glow-${classPrefix}` : '';
    // 每个骰子有独立CSS class: dice-id-{diceDefId}
    return base + selection + rollAnim + invalidStyle + `pixel-dice-${classPrefix} dice-id-${diceDefId} ` + classGlow;
  }

  // 盗贼临时骰子（暗影残骰）
  if (diceDefId === 'temp_rogue') {
    const tempGlow = selected && !invalid ? 'dice-glow-rogue' : '';
    return base + selection + rollAnim + invalidStyle + 'pixel-dice-rogue dice-id-temp_rogue ' + tempGlow;
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
  thunder: '#8060c0',
  poison: '#70c030',
  holy: '#d4a030',
};
