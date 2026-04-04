import type { Relic } from '../types/game';
import { RELICS_BY_RARITY, pickRandomRelics } from './relics';

/** 开局遗物三选一：从遗物池中随机抽取3个 */
const generateStartingRelicChoices = (ownedRelicIds: string[] = []): Relic[] => {
  // 开局池：common + uncommon + rare（不含 legendary）
  const pool = [
    ...RELICS_BY_RARITY.common,
    ...RELICS_BY_RARITY.uncommon,
    ...RELICS_BY_RARITY.rare,
  ];
  return pickRandomRelics(pool, 3, ownedRelicIds);
};

export { generateStartingRelicChoices };
