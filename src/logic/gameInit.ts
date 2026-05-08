/**
 * gameInit.ts — 游戏状态初始化（职业系统版）
 */

import type { GameState } from '../types/game';
import { INITIAL_STATS } from '../types/game';
import { PLAYER_INITIAL } from '../config';
import { registerClassDice } from '../data/dice';
import { initDiceBag } from '../data/diceBag';
import { generateMap } from '../utils/mapGenerator';
import { CLASS_DEFS, CLASS_DICE, type ClassId } from '../data/classes';

export function createInitialGameState(classId?: ClassId): GameState {
  // 注册职业骰子到全局注册表
  if (classId) {
    registerClassDice(CLASS_DICE[classId]);
  }

  const classDef = classId ? CLASS_DEFS[classId] : null;
  const initialDice = classDef ? classDef.initialDice : [
    'standard', 'standard', 'standard', 'standard', 'heavy', 'blade'
  ];

  return {
    hp: classDef?.hp ?? PLAYER_INITIAL.hp,
    maxHp: classDef?.maxHp ?? PLAYER_INITIAL.maxHp,
    armor: PLAYER_INITIAL.armor,
    chantShield: 0,
    freeRerollsLeft: classDef?.freeRerolls ?? PLAYER_INITIAL.freeRerollsPerTurn,
    freeRerollsPerTurn: classDef?.freeRerolls ?? PLAYER_INITIAL.freeRerollsPerTurn,
    globalRerolls: PLAYER_INITIAL.globalRerolls,
    playsLeft: classDef?.maxPlays ?? PLAYER_INITIAL.playsPerTurn,
    maxPlays: classDef?.maxPlays ?? PLAYER_INITIAL.playsPerTurn,
    souls: PLAYER_INITIAL.souls,
    slots: 4, // 固定槽位数
    playerClass: classId,
    bloodRerollCount: 0,
    chargeStacks: 0,
    mageChantHitCount: 0,
    mageOverchargeMult: 0,
    comboCount: 0,
    lastPlayHandType: undefined,
    ownedDice: initialDice.map(id => ({ defId: id, level: 1 })),
    diceBag: initDiceBag(initialDice),
    discardPile: [],
    drawCount: classDef?.drawCount ?? PLAYER_INITIAL.drawCount,
    handLevels: {},
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
    furyBonusDamage: 0,
    blackMarketUsedThisTurn: false,
    warriorRageMult: 0,
    rogueComboDrawBonus: 0,
    instakillChallenge: null,
    instakillCompleted: false,
    instakillAidType: null,
    playsThisWave: 0,
    rerollsThisWave: 0,
    boomerangFreeReroll: 0,
    comboFreeReroll: 0,
    level: 1,
    xp: 0,
    xpToNext: 30,
    levelMaxHpBonus: 0,
    levelDamageBonus: 0,
    levelDamageMultBonus: 0,
    levelPierceBonus: 0,
    levelStartArmor: 0,
    levelMapHeal: 0,
    levelGoldBonus: 0,
    levelSoulBonus: 0,
    levelXpBonus: 0,
    pendingLevelUps: [],
    bossPreviewSeen: [],
    bossRoamSeen: [],
  };
}
