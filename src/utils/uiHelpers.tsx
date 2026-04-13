import React from 'react';

import { DiceElement } from '../types/game';

/** 遗物图标 - 像素风SVG，形象直观 */
export const getAugmentIcon = (condition: string, size = 12) => {
  const s = size;
  const sr = 'crispEdges';
  switch (condition) {
    // 普通攻击(高牌) - 像素剑：一把明确的宝剑形状
    case 'high_card': return (
      <svg width={s} height={s} viewBox="0 0 12 12" shapeRendering={sr}>
        <rect x="5" y="0" width="2" height="7" fill="currentColor" />
        <rect x="4" y="1" width="1" height="1" fill="currentColor" opacity="0.6" />
        <rect x="7" y="1" width="1" height="1" fill="currentColor" opacity="0.6" />
        <rect x="3" y="7" width="6" height="1" fill="currentColor" />
        <rect x="5" y="8" width="2" height="3" fill="currentColor" opacity="0.7" />
        <rect x="4" y="11" width="4" height="1" fill="currentColor" opacity="0.5" />
      </svg>
    );
    // 对子 - 像素双子星：两个相连的圆
    case 'pair': return (
      <svg width={s} height={s} viewBox="0 0 12 12" shapeRendering={sr}>
        <rect x="1" y="3" width="4" height="4" rx="1" fill="currentColor" />
        <rect x="7" y="3" width="4" height="4" rx="1" fill="currentColor" />
        <rect x="5" y="4" width="2" height="2" fill="currentColor" opacity="0.5" />
        <rect x="2" y="4" width="2" height="2" fill="rgba(255,255,255,0.3)" />
        <rect x="8" y="4" width="2" height="2" fill="rgba(255,255,255,0.3)" />
        <rect x="3" y="8" width="2" height="1" fill="currentColor" opacity="0.4" />
        <rect x="7" y="8" width="2" height="1" fill="currentColor" opacity="0.4" />
      </svg>
    );
    // 两对 - 像素四叶草：四个对称的叶子
    case 'two_pair': return (
      <svg width={s} height={s} viewBox="0 0 12 12" shapeRendering={sr}>
        <rect x="3" y="1" width="3" height="3" fill="currentColor" opacity="0.9" />
        <rect x="6" y="1" width="3" height="3" fill="currentColor" opacity="0.7" />
        <rect x="3" y="4" width="3" height="3" fill="currentColor" opacity="0.7" />
        <rect x="6" y="4" width="3" height="3" fill="currentColor" opacity="0.9" />
        <rect x="5" y="3" width="2" height="2" fill="rgba(255,255,255,0.25)" />
        <rect x="5" y="8" width="2" height="3" fill="currentColor" opacity="0.5" />
      </svg>
    );
    // N条(三条/四条) - 像素火焰拳：拳头+火焰
    case 'n_of_a_kind': return (
      <svg width={s} height={s} viewBox="0 0 12 12" shapeRendering={sr}>
        <rect x="3" y="5" width="6" height="5" rx="1" fill="currentColor" />
        <rect x="4" y="4" width="4" height="1" fill="currentColor" />
        <rect x="4" y="6" width="1" height="3" fill="rgba(0,0,0,0.2)" />
        <rect x="6" y="6" width="1" height="3" fill="rgba(0,0,0,0.2)" />
        <rect x="8" y="6" width="1" height="3" fill="rgba(0,0,0,0.2)" />
        <rect x="5" y="1" width="2" height="3" fill="#f59e0b" />
        <rect x="3" y="2" width="2" height="2" fill="#ef4444" opacity="0.8" />
        <rect x="7" y="2" width="2" height="2" fill="#ef4444" opacity="0.8" />
        <rect x="4" y="0" width="1" height="2" fill="#fbbf24" opacity="0.6" />
        <rect x="7" y="0" width="1" height="2" fill="#fbbf24" opacity="0.6" />
      </svg>
    );
    // 葫芦 - 像素房屋：三角屋顶+门
    case 'full_house': return (
      <svg width={s} height={s} viewBox="0 0 12 12" shapeRendering={sr}>
        <rect x="1" y="6" width="10" height="5" fill="currentColor" />
        <polygon points="6,0 0,6 12,6" fill="currentColor" opacity="0.85" />
        <rect x="2" y="2" width="1" height="4" fill="currentColor" opacity="0.5" />
        <rect x="9" y="2" width="1" height="4" fill="currentColor" opacity="0.5" />
        <rect x="5" y="8" width="2" height="3" fill="rgba(0,0,0,0.35)" />
        <rect x="2" y="7" width="2" height="2" fill="rgba(255,255,255,0.15)" />
        <rect x="8" y="7" width="2" height="2" fill="rgba(255,255,255,0.15)" />
        <rect x="5" y="3" width="2" height="1" fill="rgba(255,255,255,0.2)" />
      </svg>
    );
    // 顺子 - 像素阶梯箭头：明确的上升台阶
    case 'straight': return (
      <svg width={s} height={s} viewBox="0 0 12 12" shapeRendering={sr}>
        <rect x="0" y="10" width="3" height="2" fill="currentColor" opacity="0.4" />
        <rect x="3" y="8" width="3" height="2" fill="currentColor" opacity="0.6" />
        <rect x="6" y="6" width="3" height="2" fill="currentColor" opacity="0.8" />
        <rect x="9" y="4" width="3" height="2" fill="currentColor" />
        <rect x="10" y="2" width="2" height="2" fill="currentColor" />
        <rect x="9" y="1" width="1" height="1" fill="currentColor" opacity="0.7" />
        <polygon points="11,0 12,3 9,3" fill="currentColor" />
      </svg>
    );
    // 同元素 - 像素水晶球：发光的宝石
    case 'same_element': return (
      <svg width={s} height={s} viewBox="0 0 12 12" shapeRendering={sr}>
        <polygon points="6,0 10,4 8,11 4,11 2,4" fill="currentColor" opacity="0.85" />
        <polygon points="6,1 9,4 6,4" fill="rgba(255,255,255,0.3)" />
        <polygon points="6,1 3,4 6,4" fill="rgba(255,255,255,0.15)" />
        <rect x="4" y="5" width="4" height="1" fill="rgba(255,255,255,0.2)" />
        <polygon points="6,4 9,4 8,10 6,10" fill="currentColor" opacity="0.6" />
        <rect x="5" y="2" width="1" height="1" fill="rgba(255,255,255,0.5)" />
      </svg>
    );
    // 元素计数 - 像素彩虹棱镜：多色三角
    case 'element_count': return (
      <svg width={s} height={s} viewBox="0 0 12 12" shapeRendering={sr}>
        <polygon points="6,0 12,11 0,11" fill="currentColor" opacity="0.3" />
        <rect x="2" y="8" width="2" height="3" fill="#ef4444" opacity="0.9" />
        <rect x="4" y="6" width="2" height="5" fill="#3b82f6" opacity="0.9" />
        <rect x="6" y="4" width="2" height="7" fill="#a855f7" opacity="0.9" />
        <rect x="8" y="6" width="2" height="5" fill="#eab308" opacity="0.9" />
        <rect x="5" y="1" width="2" height="2" fill="currentColor" />
        <rect x="5" y="0" width="2" height="1" fill="rgba(255,255,255,0.4)" />
      </svg>
    );
    // 始终触发 - 像素齿轮太阳：旋转的齿轮
    case 'always': return (
      <svg width={s} height={s} viewBox="0 0 12 12" shapeRendering={sr}>
        <circle cx="6" cy="6" r="3" fill="currentColor" />
        <rect x="5" y="0" width="2" height="2" fill="currentColor" />
        <rect x="5" y="10" width="2" height="2" fill="currentColor" />
        <rect x="0" y="5" width="2" height="2" fill="currentColor" />
        <rect x="10" y="5" width="2" height="2" fill="currentColor" />
        <rect x="1" y="1" width="2" height="2" fill="currentColor" opacity="0.7" />
        <rect x="9" y="1" width="2" height="2" fill="currentColor" opacity="0.7" />
        <rect x="1" y="9" width="2" height="2" fill="currentColor" opacity="0.7" />
        <rect x="9" y="9" width="2" height="2" fill="currentColor" opacity="0.7" />
        <circle cx="6" cy="6" r="1.5" fill="rgba(255,255,255,0.3)" />
      </svg>
    );
    // 被动效果 - 像素盾牌：防御盾形状
    case 'passive': return (
      <svg width={s} height={s} viewBox="0 0 12 12" shapeRendering={sr}>
        <polygon points="6,0 11,2 11,7 6,12 1,7 1,2" fill="currentColor" opacity="0.8" />
        <polygon points="6,1 10,3 10,7 6,11 2,7 2,3" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.5" />
        <rect x="5" y="3" width="2" height="4" fill="rgba(255,255,255,0.2)" />
        <rect x="4" y="5" width="4" height="1" fill="rgba(255,255,255,0.2)" />
        <rect x="5" y="2" width="2" height="1" fill="rgba(255,255,255,0.3)" />
      </svg>
    );
    // 同花 - 像素扑克花色
    case 'flush': return (
      <svg width={s} height={s} viewBox="0 0 12 12" shapeRendering={sr}>
        <circle cx="6" cy="4" r="2" fill="currentColor" />
        <circle cx="4" cy="6" r="2" fill="currentColor" />
        <circle cx="8" cy="6" r="2" fill="currentColor" />
        <polygon points="6,7 4,11 8,11" fill="currentColor" />
        <rect x="5" y="2" width="2" height="1" fill="rgba(255,255,255,0.3)" />
      </svg>
    );
    default: return (
      <svg width={s} height={s} viewBox="0 0 12 12" shapeRendering={sr}>
        <polygon points="6,0 7.5,4.5 12,4.5 8.5,7.5 10,12 6,9 2,12 3.5,7.5 0,4.5 4.5,4.5" fill="currentColor" />
      </svg>
    );
  }
};


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
  const invalidStyle = invalid ? 'pixel-dice-invalid ' : '';

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
