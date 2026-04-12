/**
 * gameInit.ts — 游戏状态初始化
 * 
 * 从 DiceHeroGame.tsx 提取的初始化逻辑。
 */

import type { GameState } from '../types/game';
import { INITIAL_STATS } from '../types/game';
import { PLAYER_INITIAL } from '../config';
import { INITIAL_DICE_BAG } from '../data/dice';
import { initDiceBag } from '../data/diceBag';
import { generateMap } from '../utils/mapGenerator';

export function createInitialGameState(): GameState {
  return {
    hp: PLAYER_INITIAL.hp,
    maxHp: PLAYER_INITIAL.maxHp,
    armor: PLAYER_INITIAL.armor,
    freeRerollsLeft: PLAYER_INITIAL.freeRerollsPerTurn,
    freeRerollsPerTurn: PLAYER_INITIAL.freeRerollsPerTurn,
    globalRerolls: PLAYER_INITIAL.globalRerolls,
    playsLeft: PLAYER_INITIAL.playsPerTurn,
    maxPlays: PLAYER_INITIAL.playsPerTurn,
    souls: PLAYER_INITIAL.souls,
    slots: PLAYER_INITIAL.augmentSlots,
    ownedDice: INITIAL_DICE_BAG.map(id => ({ defId: id, level: 1 })),
    diceBag: initDiceBag(INITIAL_DICE_BAG),
    discardPile: [],
    drawCount: PLAYER_INITIAL.drawCount,
    handLevels: {},
    augments: Array(PLAYER_INITIAL.augmentSlots).fill(null),
    currentNodeId: null,
    map: generateMap(),
    phase: 'start',
    battleTurn: 0,
    isEnemyTurn: false,
    targetEnemyUid: null,
    battleWaves: [],
    currentWaveIndex: 0,
    logs: [],
    shopItems: [],
    merchantItems: [],
    shopLevel: 1,
    statuses: [],
    lootItems: [],
    enemyHpMultiplier: 1.0,
    chapter: 1,
    stats: { ...INITIAL_STATS },
    pendingReplacementAugment: null,
    relics: [],
    elementsUsedThisBattle: [],
    consecutiveNormalAttacks: 0,
    enemiesKilledThisBattle: 0,
    hpLostThisBattle: 0,
    hpLostThisTurn: 0,
    blackMarketQuota: 0,
    evacuatedQuota: 0,
    totalOverkillThisRun: 0,
    soulCrystalMultiplier: 1.0,
    playsPerEnemy: {},
    rageFireBonus: 0,
    instakillChallenge: null,
    instakillCompleted: false,
    playsThisWave: 0,
    rerollsThisWave: 0,
  };
}
