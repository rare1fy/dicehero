import React from 'react';
import type { Augment } from '../types/game';
import { AUGMENTS_POOL } from './augments';
import { PixelSword, PixelShield, PixelZap, PixelHeart, PixelMagic, PixelFlame, PixelStar, PixelDice, PixelCrown, PixelSkull, PixelRefresh, PixelPoison } from '../components/PixelIcons';
import { getAugmentIcon } from '../utils/uiHelpers';
import { SKILL_SELECT_CONFIG } from '../config';

interface SkillModule {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  augment: Augment;
  cost: { type: 'maxHp' | 'reroll' | 'plays' | 'hp' | 'addNormalDice'; value: number; label: string };
}

const generateSkillModules = (): SkillModule[] => {
  // 从增幅池中随机选3个不同的增幅
  const shuffled = [...AUGMENTS_POOL].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, SKILL_SELECT_CONFIG.choiceCount);
  
  // 代价类型池
  const costTypes = [...SKILL_SELECT_CONFIG.costPool];
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
