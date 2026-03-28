import { DiceColor } from '../types';

// 标准骰子颜色映射 (1-6)
export const COLORS: Record<number, DiceColor> = {
  1: '红色',
  2: '红色',
  3: '蓝色',
  4: '蓝色',
  5: '紫色',
  6: '金色',
};

// 混沌骰子颜色映射 — 更多金色和紫色
export const CHAOS_COLORS: Record<number, DiceColor> = {
  1: '紫色',
  2: '红色',
  3: '蓝色',
  4: '紫色',
  5: '金色',
  6: '金色',
};

// 血色骰子颜色映射 — 更多红色
export const BLOOD_COLORS: Record<number, DiceColor> = {
  1: '红色',
  2: '红色',
  3: '红色',
  4: '蓝色',
  5: '紫色',
  6: '金色',
};

// 骰子类型定义
export type DiceType = 'standard' | 'chaos' | 'blood' | 'weighted';

export interface DiceConfig {
  type: DiceType;
  name: string;
  emoji: string;
  description: string;
  faces: number; // 面数
  colorMap: Record<number, DiceColor>;
  bias?: number; // 加权偏向（偏向高点数）
}

// 预设骰子配置
export const DICE_CONFIGS: Record<DiceType, DiceConfig> = {
  standard: {
    type: 'standard',
    name: '标准骰子',
    emoji: '🎲',
    description: '标准6面骰，公平随机',
    faces: 6,
    colorMap: COLORS,
  },
  chaos: {
    type: 'chaos',
    name: '混沌骰子',
    emoji: '🌀',
    description: '混沌骰子，更多紫色和金色',
    faces: 6,
    colorMap: CHAOS_COLORS,
  },
  blood: {
    type: 'blood',
    name: '血色骰子',
    emoji: '🩸',
    description: '血色骰子，更多红色',
    faces: 6,
    colorMap: BLOOD_COLORS,
  },
  weighted: {
    type: 'weighted',
    name: '加权骰子',
    emoji: '⚖️',
    description: '加权骰子，偏向高点数',
    faces: 6,
    colorMap: COLORS,
    bias: 1, // +1 偏向
  },
};

// 根据骰子配置投掷
export const rollDie = (config: DiceConfig = DICE_CONFIGS.standard): { value: number; color: DiceColor } => {
  let value = Math.floor(Math.random() * config.faces) + 1;
  
  // 加权骰子逻辑：有一定概率将低点数提升
  if (config.bias && config.bias > 0) {
    const secondRoll = Math.floor(Math.random() * config.faces) + 1;
    value = Math.max(value, secondRoll); // 取两次中较大的
  }
  
  const color = config.colorMap[value] || '蓝色';
  return { value, color };
};
