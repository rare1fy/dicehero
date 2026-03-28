import React from 'react';
import type { Augment } from '../types';
import { AUGMENTS_POOL } from './augments';
import { PixelSword, PixelShield, PixelZap, PixelHeart, PixelMagic, PixelFlame, PixelStar, PixelDice, PixelCrown, PixelSkull, PixelRefresh, PixelPoison } from '../components/PixelIcons';
import { getAugmentIcon } from '../utils/helpers';

interface SkillModule {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  augment: Augment;
  cost: { type: 'maxHp' | 'reroll' | 'plays' | 'hp'; value: number; label: string };
}

const generateSkillModules = (): SkillModule[] => {
  // 从增幅池中随机选3个不同的增幅
  const shuffled = [...AUGMENTS_POOL].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, 3);
  
  // 代价类型池
  const costTypes: SkillModule['cost'][] = [
    { type: 'maxHp', value: 8, label: '最大生命 -8' },
    { type: 'maxHp', value: 12, label: '最大生命 -12' },
    { type: 'reroll', value: 1, label: '全局重骰 -1' },
    { type: 'reroll', value: 2, label: '全局重骰 -2' },
    { type: 'hp', value: 10, label: '当前生命 -10' },
    { type: 'hp', value: 15, label: '当前生命 -15' },
  ];
  const shuffledCosts = [...costTypes].sort(() => Math.random() - 0.5);
  
  const icons = [<PixelZap size={4} />, <PixelSword size={4} />, <PixelMagic size={4} />];
  
  return selected.map((aug, i) => ({
    id: `skill-${aug.id}-${Date.now()}`,
    name: aug.name,
    description: aug.description,
    icon: icons[i],
    augment: aug,
    cost: shuffledCosts[i]
  }));
};

export { generateSkillModules };
export type { SkillModule };
