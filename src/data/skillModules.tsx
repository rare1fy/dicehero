import type { Relic } from '../types/game';
import { RELICS_BY_RARITY, pickRandomRelics, filterRelicsByClass } from './relics';
import type { ClassId } from './classes';

/** 开局遗物三选一：从遗物池中随机抽取3个（职业筛选） */
const generateStartingRelicChoices = (ownedRelicIds: string[] = [], playerClass?: ClassId): Relic[] => {
  // 开局池：common + uncommon + rare（不含 legendary），筛选当前职业可用遗物
  const pool = filterRelicsByClass([
    ...RELICS_BY_RARITY.common,
    ...RELICS_BY_RARITY.uncommon,
    ...RELICS_BY_RARITY.rare,
  ], playerClass);
  return pickRandomRelics(pool, 3, ownedRelicIds);
};

export { generateStartingRelicChoices };
