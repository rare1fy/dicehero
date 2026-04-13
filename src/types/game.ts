import React from 'react';

// ============================================================
// 骰子元素与稀有度
// ============================================================

export type DiceElement = 'normal' | 'fire' | 'ice' | 'thunder' | 'poison' | 'holy';
export type DiceRarity = 'common' | 'uncommon' | 'rare' | 'legendary' | 'curse';

// ============================================================
// 骰子定义 (模板)
// ============================================================

export interface DiceDef {
  id: string;
  name: string;
  element: DiceElement;
  faces: number[];
  description: string;
  rarity: DiceRarity;
  isElemental?: boolean;   // 元素骰子：抽到时随机坍缩
  isCursed?: boolean;      // 诅咒骰子：重Roll代价翻倍
  isCracked?: boolean;     // 碎裂骰子：回合结束自毁
  onPlay?: {
    bonusDamage?: number;
    bonusMult?: number;
    heal?: number;
    pierce?: number;
    selfDamage?: number;     // 反噬伤害（固定值）
    selfDamagePercent?: number; // 反噬伤害（最大HP百分比）
    statusToEnemy?: StatusEffect;
    statusToSelf?: StatusEffect;
    aoe?: boolean;
    armor?: number;          // 获得固定护甲
    // 战士特殊
    armorFromValue?: boolean;    // 护甲=骰子点数
    armorFromTotalPoints?: boolean; // 护甲=选中骰子总点数
    armorBreak?: boolean;        // 摧毁敌人全部护甲
    scaleWithHits?: boolean;     // 每受伤一次伤害+2
    firstPlayOnly?: boolean;     // 仅首次出牌生效
    scaleWithLostHp?: number;    // 伤害加成=已损失HP×N
    executeThreshold?: number;   // 斩杀线（敌人HP百分比）
    executeMult?: number;        // 斩杀倍率
    aoeDamage?: number;          // 独立AOE伤害
    healFromValue?: boolean;     // 回血=骰子点数
    lowHpOverrideValue?: number; // 低血时点数变为N
    lowHpThreshold?: number;     // 低血判定线
    bonusDamageFromPoints?: number; // 额外伤害=总点数×N
    requiresTriple?: boolean;    // 需要三条以上牌型
    scaleWithBloodRerolls?: boolean; // 卖血次数+1面值
    selfBerserk?: boolean;       // 自身施加狂暴
    scaleWithSelfDamage?: boolean;   // 自伤量转伤害
    damageFromArmor?: number;    // 伤害加成=护甲×N
    maxHpBonus?: number;         // 最大HP+N
    purifyAll?: boolean;         // 净化全部负面
    tauntAll?: boolean;          // 嘲讽全体
    // 法师特殊
    reverseValue?: boolean;      // 点数变为7-当前值
    randomTarget?: boolean;      // 随机目标
    removeBurn?: number;         // 清除灼烧层数
    healOnSkip?: number;         // 未出牌回复HP
    bonusDamagePerElement?: number; // 每颗元素骰子+N伤害
    copyHighestValue?: boolean;  // 复制最高点数
    bonusOnKeep?: number;        // 保留到下回合时+N点
    rerollOnKeep?: boolean;      // 保留时自动重投
    dualElement?: boolean;       // 双元素
    copyMajorityElement?: boolean; // 复制多数元素
    devourDie?: boolean;         // 吞噬骰子
    healPerCleanse?: number;     // 每净化1种回复N HP
    bonusMultOnKeep?: number;    // 保留时+N倍率
    unifyElement?: boolean;      // 统一元素
    overrideValue?: number;      // 固定点数
    swapWithUnselected?: boolean; // 与未选中骰子交换
    freezeBonus?: number;        // 冻结+N回合
    bonusPerTurnKept?: number;   // 每保留1回合+N点
    keepBonusCap?: number;       // 保留加成上限
    armorFromHandSize?: number;  // 护甲=手牌数×N
    requiresCharge?: number;     // 需要蓄力N回合
    triggerAllElements?: boolean; // 触发全部元素
    // 盗贼特殊
    comboBonus?: number;         // 连击倍率加成
    poisonInverse?: boolean;     // 毒=7-点数
    stayInHand?: boolean;        // 出牌后不消耗
    grantTempDie?: boolean;      // 补充临时骰子
    comboDrawBonusNextTurn?: boolean; // 连击成功后下回合手牌+1
    critOnSecondPlay?: number;   // 第2次出牌暴击倍率
    poisonBase?: number;         // 基础毒层
    poisonBonusIfPoisoned?: number; // 已有毒额外+N
    alwaysBounce?: boolean;      // 必定弹回
    bonusDamageOnSecondPlay?: number; // 第2次出牌+N伤害
    stealArmor?: number;         // 偷取护甲
    poisonFromPoisonDice?: number; // 毒层=毒系骰子数×N
    bonusMultOnSecondPlay?: number; // 第2次出牌倍率
    grantExtraPlay?: boolean;    // 额外出牌机会
    detonatePoisonPercent?: number; // 引爆毒层百分比
    wildcard?: boolean;          // 万能骰子
    transferDebuff?: boolean;    // 转移负面状态
    detonateAllOnLastPlay?: boolean; // 最后出牌引爆全部
    escalateDamage?: number;     // 递增伤害百分比
    // 通用
    purifyDebuff?: number | boolean; // 净化负面（遗物兼容）
  };
}

// ============================================================
// 骰子实例 (运行时)
// ============================================================

// ============================================================
// 拥有的骰子（带等级）
// ============================================================

export interface OwnedDie {
  defId: string;    // 骰子定义ID
  level: number;    // 当前等级 1-3
}

export interface Die {
  id: number;
  diceDefId: string;
  value: number;
  element: DiceElement;
  collapsedElement?: DiceElement;  // 元素骰子坍缩后的实际元素
  selected: boolean;
  spent: boolean;
  rolling?: boolean;
  playing?: boolean;
  kept?: boolean;
}

// ============================================================
// 牌型
// ============================================================

export type HandType = '普通攻击' | '对子' | '连对' | '三连对' | '三条' | '顺子' | '4顺' | '5顺' | '6顺' | '同元素' | '葫芦' | '四条' | '五条' | '六条' | '元素顺' | '元素葫芦' | '皇家元素顺' | '无效牌型';

// ============================================================
// 状态效果
// ============================================================

export type StatusType = 'poison' | 'burn' | 'dodge' | 'vulnerable' | 'strength' | 'weak' | 'armor' | 'slow' | 'freeze';

export interface StatusEffect {
  type: StatusType;
  value: number;
  duration?: number;
}

// ============================================================
// 遗物
// ============================================================

export type AugmentCategory = 'transition' | 'economy' | 'endgame' | 'normal_attack' | 'self_harm';

export interface AugmentContext {
  rerollsThisTurn?: number;
  hpLostThisTurn?: number;
  hpLostThisBattle?: number;
  currentHp?: number;
  maxHp?: number;
  currentGold?: number;
  enemiesKilledThisBattle?: number;
  consecutiveNormalAttacks?: number;
}

export interface Augment {
  id: string;
  name: string;
  level?: number;
  category?: AugmentCategory;
  condition: 'high_card' | 'pair' | 'two_pair' | 'n_of_a_kind' | 'full_house' | 'straight' | 'same_element' | 'element_count' | 'always' | 'passive';
  conditionValue?: number;
  conditionElement?: DiceElement;
  effect: (x: number, dice: Die[], level: number, context?: AugmentContext) => { damage?: number; armor?: number; heal?: number; multiplier?: number; pierce?: number; goldBonus?: number; shopDiscount?: number; statusEffects?: StatusEffect[] };
  description: string;
}

// ============================================================
// 地图
// ============================================================

export type NodeType = 'enemy' | 'elite' | 'boss' | 'event' | 'campfire' | 'treasure' | 'merchant';

export interface MapNode {
  id: string;
  type: NodeType;
  depth: number;
  connectedTo: string[];
  completed: boolean;
}

// ============================================================
// 敌人
// ============================================================

/** 敌人战斗类型：决定攻击距离和视觉标识 */
/** 敌人战斗类型（西幻风格） */
export type EnemyCombatType = 'warrior' | 'guardian' | 'ranger' | 'caster' | 'priest';

export interface Enemy {
  uid: string;  // runtime unique id for multi-enemy targeting
  configId: string;  // links back to EnemyConfig.id for quotes lookup
  name: string;
  hp: number;
  maxHp: number;
  armor: number;
  /** 固定攻击力 */
  attackDmg: number;
  /** 战斗类型 */
  combatType: EnemyCombatType;
  /** 敌人描述（用于弹窗） */
  description?: string;
  dropGold: number;
  dropAugment: boolean;
  dropMaxPlays?: number;
  dropDiceCount?: number;
  rerollReward?: number;
  emoji: string;
  pattern?: (turn: number, self: Enemy, player: GameState) => { type: '攻击' | '防御' | '技能'; value: number; description?: string };
  statuses: StatusEffect[];
  distance: number;  // distance to player: 0=melee, >0=approaching
  attackCount?: number; // 弓箭手攻击次数计数（伤害递增用）
}

// ============================================================
// 战利品 & 商店
// ============================================================

export interface LootItem {
  id: string;
  type: 'gold' | 'augment' | 'reroll' | 'maxPlays' | 'diceCount' | 'specialDice' | 'diceChoice' | 'relic';
  value?: number;
  augment?: Augment;
  augmentOptions?: Augment[];
  diceDefId?: string;
  collected: boolean;
  relicData?: Relic;
}

export type ChestTier = 'bronze' | 'silver' | 'gold';

export interface ChestReward {
  type: 'gold' | 'heal' | 'dice' | 'augment' | 'maxHp' | 'maxPlays' | 'removeDice' | 'reroll';
  value?: number;
  diceDefId?: string;
  augment?: Augment;
  label: string;
  desc: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'legendary';
}

export interface ShopItem {
  id: string;
  type: 'augment' | 'reroll' | 'dice' | 'specialDice' | 'removeDice';
  augment?: Augment;
  diceDefId?: string;
  price: number;
  label: string;
  desc: string;
}

// ============================================================
// 游戏主状态
// ============================================================

// ============================================================
// Battle Wave (multi-enemy wave system)
// ============================================================

export interface BattleWave {
  enemies: Enemy[];
}

/** 一击必杀挑战条件 */
export interface InstakillChallenge {
  type: string;
  label: string;
  description: string;
  value?: number;
  handType?: string;
  progress?: number;
  completed: boolean;
}


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


// 游荡商人物品
export interface MerchantItem {
  id: string;
  type: 'dice' | 'augment' | 'heal' | 'reroll' | 'diceCount';
  label: string;
  desc: string;
  price: number;
  bought: boolean;
  diceDefId?: string;
  augment?: Augment;
  healAmount?: number;
  rerollAmount?: number;
}


// ============================================================
// 遗物系统
// ============================================================

export type RelicTrigger = 
  | 'on_play'          // 每次出牌时
  | 'on_kill'          // 击杀敌人时
  | 'on_reroll'        // 重Roll时
  | 'on_turn_start'    // 回合开始时
  | 'on_turn_end'      // 回合结束时
  | 'on_battle_start'  // 战斗开始时
  | 'on_battle_end'    // 战斗结束时
  | 'on_damage_taken'  // 受到伤害时
  | 'on_fatal'
  | 'on_floor_clear'
  | 'on_move'         // 致命伤害时
  | 'passive';         // 被动持续生效

export type RelicRarity = 'common' | 'uncommon' | 'rare' | 'legendary';

export interface RelicContext {
  // 出牌信息
  handType?: string;
  diceCount?: number;
  diceValues?: number[];
  diceDefIds?: string[];
  pointSum?: number;
  // 战斗状态
  rerollsThisTurn?: number;
  hpLostThisTurn?: number;
  hpLostThisBattle?: number;
  currentHp?: number;
  maxHp?: number;
  currentGold?: number;
  enemiesKilledThisBattle?: number;
  overkillDamage?: number;
  // 元素追踪
  elementsUsedThisBattle?: Set<string>;
  // 特殊骰子追踪
  hasSplitDice?: boolean;
  splitDiceValue?: number;
  hasLoadedDice?: boolean;
  loadedDiceCount?: number;
  hasSpecialDice?: boolean;
  cursedDiceInHand?: number;
  crackedDiceInHand?: number;
  // 连续普攻追踪
  consecutiveNormalAttacks?: number;
  // 免费重Roll追踪
  freeRerollsUsed?: number;
  selectedDiceCount?: number;
  // 地图进度
  currentDepth?: number;           // 当前节点深度
  floorsCleared?: number;          // 已通过的战斗层数（层厅征服者用）
}

export interface RelicEffect {
  damage?: number;
  armor?: number;
  heal?: number;
  multiplier?: number;
  pierce?: number;
  goldBonus?: number;
  drawCountBonus?: number;
  shopDiscount?: number;
  statusEffects?: StatusEffect[];
    preventDeath?: boolean;
    overflowDamage?: number;
  freeRerolls?: number;
  // 特殊标记
  canLockDice?: boolean;
  maxPointsUnlocked?: boolean;
  straightUpgrade?: number;      // 顺子触发时升级量（3顺变4顺）
  pairAsTriplet?: boolean;       // 对子视为三条结算
  rerollPointBoost?: number;     // 重掷时骰子点数+N
  extraDraw?: number;            // 每回合额外抽骰子数量
  extraPlay?: number;            // 每回合额外出牌次数
  extraReroll?: number;          // 每回合额外免费重投次数
  normalElementChance?: number;  // 普通骰子获得元素概率
}

export interface Relic {
  id: string;
  name: string;
  description: string;
  icon: string;           // icon标识符（对应PixelIcons中的组件）
  rarity: RelicRarity;
  trigger: RelicTrigger;
  effect: (context: RelicContext) => RelicEffect;
  // 计数型遗物
  counter?: number;        // 当前计数值
  maxCounter?: number;      // 最大计数（用于显示进度）
  counterLabel?: string;    // 计数标签（如"层"、"次"）
}

export interface GameState {
  hp: number;
  maxHp: number;
  armor: number;
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
  comboCount?: number;         // 盗贼本回合已出牌次数（连击计数）
  lastPlayHandType?: string;   // 盗贼上一次出牌的牌型（连击终结判定）

  // 骰子库系统
  ownedDice: OwnedDie[];       // 玩家拥有的所有骰子定义ID列表
  diceBag: string[];          // 骰子库 (待抽取)
  discardPile: string[];      // 弃骰库 (已使用)
  drawCount: number;          // 每回合抽取数量

  handLevels: Record<string, number>;
  augments: (Augment | null)[];
  relics: Relic[];                     // 遗物列表（无限制数量）
  elementsUsedThisBattle: string[];    // 本场战斗已使用的元素
  currentNodeId: string | null;
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
  pendingReplacementAugment: Augment | null;

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
  instakillChallenge?: InstakillChallenge | null; // 一击必杀挑战条件
  instakillCompleted?: boolean;        // 是否已达成一击必杀
  playsThisWave?: number;              // 本波已出牌次数（挑战追踪用）
  rerollsThisWave?: number;            // 本波重投次数（挑战追踪用）
  tempDrawCountBonus?: number;         // 洞察弱点临时骰子上限加成（战斗结束清除）
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