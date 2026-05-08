// ============================================================
// types/game.ts — 统一重导出入口 + 本地类型
// ============================================================

import React from 'react';
import type { OwnedDie, HandType, StatusEffect } from './dice';
import type { MapNode, BattleWave, ShopItem, MerchantItem, LootItem, InstakillChallenge } from './entities';
import type { Relic } from './relics';

// 重导出 — 统一入口
export type { DiceElement, DiceRarity, DiceDef, OwnedDie, Die, HandType, StatusType, StatusEffect } from './dice';
export type { ClassId } from '../data/classes';
export type { NodeType, MapNode, EnemyCombatType, Enemy, LootItem, ChestTier, ChestReward, ShopItem, BattleWave, InstakillChallenge, MerchantItem } from './entities';
export type { RelicTrigger, RelicRarity, RelicContext, RelicEffect, PassiveRelicKey, Relic } from './relics';

// ============================================================
// 本局统计数据
// ============================================================

export interface RunStats {
  totalDamageDealt: number;       // 累计造成伤害
  maxSingleHit: number;           // 单次最高伤害
  totalPlays: number;             // 总出牌次数
  totalRerolls: number;           // 总重掷次数
  totalDamageTaken: number;       // 累计受到伤害
  totalHealing: number;           // 累计回复量
  totalArmorGained: number;       // 累计获得护甲
  battlesWon: number;             // 已完成战斗场数
  elitesWon: number;              // 精英战胜利
  bossesWon: number;              // Boss战胜利
  enemiesKilled: number;          // 总击杀敌人数
  handTypeCounts: Record<string, number>;  // 每种牌型出牌次数
  bestHandPlayed: string;         // 打出过的最强牌型
  diceUsageCounts: Record<string, number>; // 每种骰子被选中出牌次数
  goldEarned: number;             // 累计获得金币
  goldSpent: number;              // 累计花费金币
}

export const INITIAL_STATS: RunStats = {
  totalDamageDealt: 0,
  maxSingleHit: 0,
  totalPlays: 0,
  totalRerolls: 0,
  totalDamageTaken: 0,
  totalHealing: 0,
  totalArmorGained: 0,
  battlesWon: 0,
  elitesWon: 0,
  bossesWon: 0,
  enemiesKilled: 0,
  handTypeCounts: {},
  bestHandPlayed: '',
  diceUsageCounts: {},
  goldEarned: 0,
  goldSpent: 0,
};

// ============================================================
// 游戏主状态
// ============================================================

export interface GameState {
  hp: number;
  maxHp: number;
  armor: number;
  /** 法师【奥术屏障】：吟唱回合叠加的伤害免疫层，优先于 armor 抵挡一切伤害（含 DOT），每新回合清零 */
  chantShield: number;
  freeRerollsLeft: number;
  freeRerollsPerTurn: number;
  globalRerolls: number;
  playsLeft: number;
  maxPlays: number;
  souls: number;
  slots: number;
  playerClass?: string;        // 职业ID: 'warrior' | 'mage' | 'rogue'
  bloodRerollCount?: number;   // 本回合卖血重投次数（战士特权伤害加成）
  chargeStacks?: number;       // 法师蓄力层数（连续不出牌回合数）
  mageOverchargeMult?: number; // 法师囤满后继续蓄力的额外伤害倍率加成
  /** 法师吟唱期间已被攻击次数（包含 DOT 和屏障吸收）。
   *  每次受击 → 累加 2^N 层 vulnerable，出牌后清零（吟唱重置）。 */
  mageChantHitCount?: number;
  comboCount?: number;
  lockedElement?: string;  // 棱镜聚焦锁定的元素         // 盗贼本回合已出牌次数（连击计数）
  lastPlayHandType?: string;   // 盗贼上一次出牌的牌型（连击终结判定）

  // 骰子库系统
  ownedDice: OwnedDie[];       // 玩家拥有的所有骰子定义ID列表
  diceBag: string[];          // 骰子库 (待抽取)
  discardPile: string[];      // 弃骰库 (已使用)
  drawCount: number;          // 每回合抽取数量

  handLevels: Record<string, number>;
  relics: Relic[];                     // 遗物列表（无限制数量）
  elementsUsedThisBattle: string[];    // 本场战斗已使用的元素
  currentNodeId: string | null;
  /** 当前节点的 depth 索引（number 版，用于 nextNode 递增逻辑） */
  currentNode?: number;
  map: MapNode[];
  phase: 'start' | 'classSelect' | 'map' | 'battle' | 'merchant' | 'event' | 'campfire' | 'victory' | 'gameover' | 'loot' | 'skillSelect' | 'diceReward' | 'chapterTransition' | 'treasure';
  battleTurn: number;
  isEnemyTurn: boolean;
  targetEnemyUid: string | null;  // selected attack target
  battleWaves: BattleWave[];      // remaining waves
  currentWaveIndex: number;       // current wave number
  logs: string[];
  shopItems: ShopItem[];
  merchantItems: MerchantItem[];
  shopLevel: number;
  statuses: StatusEffect[];
  lootItems: LootItem[];
  enemyHpMultiplier: number;
  chapter: number;          // 当前大关 (1-5)
  stats: RunStats;

  // 黑市配额系统（塔科夫式溢出伤害提现）
  blackMarketQuota: number;           // 局内未撤离的黑市配额
  evacuatedQuota: number;             // 已撤离（安全）的配额
  totalOverkillThisRun: number;       // 本局总溢出伤害（统计用）
  soulCrystalMultiplier: number;      // 魂晶倍率（按层数成长，撤离后重置为1）
  playsPerEnemy: Record<string, number>; // 本场战斗中对每个敌人的出牌次数（追踪首次秒杀）
  consecutiveNormalAttacks?: number;  // 连续普通攻击计数
  enemiesKilledThisBattle?: number;   // 本场战斗击杀数
  hpLostThisBattle?: number;          // 本场战斗已损失的HP
  hpLostThisTurn?: number;            // 本回合已损失的HP
  rageFireBonus?: number;              // 怒火燎原遗物：受伤后累积的额外伤害
  furyBonusDamage?: number;            // 怒火骰子：本局游戏永久叠加的额外基础伤害（受敌人攻击时+N）
  blackMarketUsedThisTurn?: boolean;   // 黑市合同本回合是否已触发
  warriorRageMult?: number;            // 战士狂暴本能：受伤百分比对应的伤害倍率加成
  rogueComboDrawBonus?: number;        // 盗贼连击心得：下回合额外抽牌数
  relicTempDrawBonus?: number;         // 魔法手套遗物：下回合临时+N手牌
  relicKeepHighest?: number;           // 血之契约遗物：保留N颗最高点骰子
  relicTempExtraPlay?: number;         // 磨砺石遗物：下回合临时+N出牌
  fortuneWheelUsed?: boolean;          // 命运之轮遗物：本场是否已用过
  lifefurnaceCounter?: number;         // 生命熔炉：出牌计数器（每N次才触发）
  instakillChallenge?: InstakillChallenge | null; // 一击必杀挑战条件
  instakillCompleted?: boolean;        // 是否已达成一击必杀
  /** 本次挑战触发的援助类型（用于完成后 UI 只显示这一条）。
   *   1=百分比伤害 2=血量上限压制 3=DOT大礼包 4=永久+1手牌上限/+50%伤害 */
  instakillAidType?: 1 | 2 | 3 | 4 | null;
  playsThisWave?: number;              // 本波已出牌次数（挑战追踪用）
  rerollsThisWave?: number;            // 本波重投次数（挑战追踪用）
  tempDrawCountBonus?: number;         // 洞察弱点临时骰子上限加成（战斗结束清除）
  boomerangFreeReroll?: number;        // 回旋骰子弹回后获得的免费重投次数（每回合重置）
  comboFreeReroll?: number;            // 盗贼连击预备给予的免费重投次数（每回合重置）
  gmKillWave?: number;                 // GM 调试：杀死当前波次敌人（timestamp，让 useEffect 通过值变化触发）

  // ============ 经验 / 等级系统 ============
  level: number;                       // 当前等级（初始 1）
  xp: number;                          // 当前经验值（本级累积）
  xpToNext: number;                    // 升到下一级所需经验
  lastXpGain?: number;                 // 最近一次经验获取量（用于触发 HUD 弹出动画）
  lastXpGainAt?: number;               // 最近一次经验获取时间戳
  // 升级永久成长（累加式，不会重置）
  levelMaxHpBonus?: number;            // 升级累计最大生命加成
  levelDamageBonus?: number;           // 升级累计出牌基础伤害加成（加法）
  levelDamageMultBonus?: number;       // 升级累计伤害倍率加成（0.08 = +8%，叠加）
  levelPierceBonus?: number;           // 升级累计穿透伤害加成
  levelStartArmor?: number;            // 升级累计战斗开局初始护甲
  levelMapHeal?: number;               // 升级累计每层地图结束回血
  levelGoldBonus?: number;             // 升级累计金币收益百分比（0.15 = +15%）
  levelSoulBonus?: number;             // 升级累计魂晶倍率加成
  levelXpBonus?: number;               // 升级累计经验值加成
  pendingLevelUps?: number[];          // 待领奖的升级级数队列（FIFO）
  bossPreviewSeen?: number[];          // 已触发过路上预告的章节列表（防重复）
  bossRoamSeen?: string[];             // 已触发过Boss路过嘲讽演出（防重复）
}

// ============================================================
// 牌型相关
// ============================================================

export interface HandResult {
  bestHand: string;
  allHands: HandType[];
  activeHands: HandType[];
}

export interface HandTypeDef {
  id: string;
  name: string;
  icon: React.ReactNode;
  base: number;
  mult: number;
  description: string;
}

// ============================================================
// Meta-Progression（跨局永久进度）
// ============================================================

/** 黑市配额永久存储 */
export interface MetaProgression {
  /** 永久黑市配额（已撤离的安全资产） */
  permanentQuota: number;
  /** 已解锁的开局遗物ID列表 */
  unlockedStartRelics: string[];
  /** 历史最高单次溢出伤害 */
  highestOverkill: number;
  /** 总游戏局数 */
  totalRuns: number;
  /** 总胜利局数 */
  totalWins: number;
}

/** 开局遗物解锁配置 */
export interface StartRelicUnlock {
  relicId: string;
  cost: number;           // 永久配额花费
  name: string;
  description: string;
}
