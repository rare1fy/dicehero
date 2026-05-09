/**
 * classes.ts — 职业系统核心数据
 * 
 * 定义三大职业的规则、初始配置和专属骰子池。
 * 职业差异来自"出牌规则"而非数值膨胀。
 */

import type { DiceDef } from '../types/game';

// ============================================================
// 职业类型定义
// ============================================================

export type ClassId = 'warrior' | 'mage' | 'rogue';

export interface ClassDef {
  id: ClassId;
  name: string;
  title: string;           // 副标题
  description: string;     // 简短描述
  color: string;           // 主题色
  colorLight: string;      // 浅色
  colorDark: string;       // 深色

  // 回合规则
  drawCount: number;       // 每回合抽骰数
  maxPlays: number;        // 出牌次数
  freeRerolls: number;     // 免费重投次数
  canBloodReroll: boolean; // 嗜血
  keepUnplayed: boolean;   // 保留未出牌骰子

  // 生命值
  hp: number;              // 初始血量
  maxHp: number;           // 最大血量

  // 初始骰子库
  initialDice: string[];   // 普通×4 + 职业骰×2

  // 职业特权描述（简短版，用于顶栏等）
  passiveDesc: string;
  // 职业技能列表（用于职业选择界面详细展示）
  skills: { name: string; desc: string }[];
  // 普攻特殊规则
  normalAttackMultiSelect: boolean; // 普攻可多选
}

// ============================================================
// 三大职业定义
// ============================================================

export const CLASS_DEFS: Record<ClassId, ClassDef> = {
  warrior: {
    id: 'warrior',
    name: '嗜血狂战',
    title: '铁血征服者',
    description: '以血换伤，一击致命。嗜血越多，越凶。',
    color: '#c04040',
    colorLight: '#ff6060',
    colorDark: '#601010',
    drawCount: 3,
    maxPlays: 1,
    freeRerolls: 1,
    canBloodReroll: true,
    keepUnplayed: false,
    hp: 120,
    maxHp: 120,
    initialDice: ['standard', 'standard', 'standard', 'standard', 'w_bloodthirst', 'w_ironwall'],
    passiveDesc: '【战场收割】斩首+完防双触发：直伤击杀任意敌人 → 下回合手牌+1；敌人攻击被护甲全额吸收 → 下回合手牌+1（默认每槽 1 次/回合，可被遗物/骰子破限）。手牌溢出 6 颗时每多 1 颗本回合 +10% 伤害。普攻可多选；嗜血卖血保留',
    skills: [
      { name: '斩首+完防', desc: '直伤击杀 / 完全格挡，下回合各+1手牌' },
      { name: '过充溢出', desc: '手牌超过6颗后，每溢出1颗伤害+10%' },
      { name: '血怒铁拳', desc: '嗜血重投伤害+15%（满5层改得5护甲）；普攻可多选' },
    ],
    normalAttackMultiSelect: true,
  },
  mage: {
    id: 'mage',
    name: '星界魔导',
    title: '星界禁咒师',
    description: '耐心吟唱2-3回合，攒齐完美手牌一波超载。',
    color: '#7040c0',
    colorLight: '#a070ff',
    colorDark: '#301060',
    drawCount: 3,
    maxPlays: 1,
    freeRerolls: 1,
    canBloodReroll: false,
    keepUnplayed: true,
    hp: 100,
    maxHp: 100,
    initialDice: ['standard', 'standard', 'standard', 'standard', 'mage_elemental', 'mage_reverse'],
    passiveDesc: '【星界吟唱】未出牌骰子保留到下回合（3→4→5→6递增）；吟唱回合获得奥术屏障（减免一切伤害含DOT），但吟唱会导致【法脉紊乱】——每次受击累加 2^N 层易伤（第N次受击）；满6后继续吟唱每次+10%伤害；出牌后重置',
    skills: [
      { name: '星界吟唱', desc: '不出牌的骰子保留至下回合，上限 3→4→5→6 递增' },
      { name: '奥术屏障', desc: '吟唱回合获得屏障（4/6/8/10），可挡一切伤害' },
      { name: '法术反噬', desc: '吟唱时受击累加 2^N 层易伤；满6后每回合伤害再+10%' },
    ],
    normalAttackMultiSelect: false,
  },
  rogue: {
    id: 'rogue',
    name: '影锋刺客',
    title: '暗影连击者',
    description: '一回合出牌2次，连击层层加成。',
    color: '#30a050',
    colorLight: '#60d080',
    colorDark: '#104020',
    drawCount: 3,
    maxPlays: 2,
    freeRerolls: 1,
    canBloodReroll: false,
    keepUnplayed: false,
    hp: 90,
    maxHp: 90,
    initialDice: ['standard', 'standard', 'standard', 'standard', 'r_quickdraw', 'r_combomastery'],
    passiveDesc: '【连击】每回合出牌2次；第2次伤害+20%；同牌型再+25%；暗影残骰是连击核心',
    skills: [
      { name: '双刃连击', desc: '每回合出牌2次，第2次伤害+20%' },
      { name: '精准连击', desc: '两次同牌型（非普攻）额外+25%伤害' },
      { name: '暗影残骰', desc: '连击补暗影残骰，可保留到下回合' },
    ],
    normalAttackMultiSelect: false,
  },
};
// ============================================================
// 战士专属骰子（20个）
// 原则：嗜血卖血 → 直来直往 → 简单初学
// ============================================================

const WARRIOR_DICE: DiceDef[] = [
  // === Common (4) ===
  { id: 'w_bloodthirst', name: '血之渴望', element: 'normal', faces: [1,2,3,4,5,6], rarity: 'common',
    description: '出牌时以最大HP的2%为代价，对目标追加8点固定伤害', onPlay: { bonusDamage: 8, selfDamagePercent: 0.02 } },
  { id: 'w_ironwall', name: '铁壁', element: 'normal', faces: [1,2,3,4,5,6], rarity: 'common',
    description: '出牌时获得护甲，数值等于所有选中骰子的总点数', onPlay: { armorFromTotalPoints: true } },
  { id: 'w_warcry', name: '战吼', element: 'normal', faces: [1,2,3,4,5,6], rarity: 'common',
    description: '对目标施加1层易伤，持续2回合', onPlay: { statusToEnemy: { type: 'vulnerable', value: 1, duration: 2 } } },
  { id: 'w_fury', name: '怒火', element: 'normal', faces: [1,2,3,4,5,6], rarity: 'common',
    description: '每次被敌人攻击后，本骰子的面值永久+1，最多+10', onPlay: { scaleWithHits: true } },

  // === Uncommon (6) ===
  { id: 'w_armorbreak', name: '碎甲', element: 'normal', faces: [1,2,3,4,5,6], rarity: 'uncommon',
    description: '出牌时摧毁目标的全部护甲', onPlay: { armorBreak: true } },
  { id: 'w_revenge', name: '复仇', element: 'normal', faces: [1,2,3,4,5,6], rarity: 'uncommon',
    description: '对目标追加固定伤害，数值为本场已损失HP的10%', onPlay: { scaleWithLostHp: 0.1 } },
  { id: 'w_roar', name: '怒吼净化', element: 'normal', faces: [1,2,3,4,5,6], rarity: 'uncommon',
    description: '清除自身全部负面状态和诅咒，并嘲讽全体敌人', onPlay: { purifyAll: true, tauntAll: true } },
  { id: 'w_lifefurnace', name: '生命熔炉', element: 'normal', faces: [1,2,3,4,5,6], rarity: 'uncommon',
    description: '未满血时回复HP，数值等于本骰子的点数；满血时永久增加3点最大HP', onPlay: { healOrMaxHp: true } },
  { id: 'w_execute', name: '斩杀', element: 'normal', faces: [1,2,3,4,5,6], rarity: 'uncommon',
    description: '目标血量低于25%时伤害+100%；若成功击杀，回复15HP', onPlay: { executeThreshold: 0.25, executeMult: 2, executeHeal: 15 } },
  { id: 'w_leech', name: '吸血斩', element: 'normal', faces: [1,2,3,4,5,6], rarity: 'uncommon',
    description: '回复HP，数值等于本骰子的点数，同时清除1层负面状态', onPlay: { healFromValue: true, purifyOne: true } },

  // === Rare (8) ===
  { id: 'w_titanfist', name: '泰坦之拳', element: 'normal', faces: [6,6,6,6,6,6], rarity: 'rare',
    description: '固定6点。出牌时自伤最大HP的10%，摧毁目标护甲并追加15点固定伤害', onPlay: { selfDamagePercent: 0.10, armorBreak: true, bonusDamage: 15 } },
  { id: 'w_unyielding', name: '不屈意志', element: 'normal', faces: [1,2,3,4,5,6], rarity: 'rare',
    description: '自身血量低于30%时，本骰子点数强制变为6', onPlay: { lowHpOverrideValue: 6, lowHpThreshold: 0.3 } },
  { id: 'w_warhammer', name: '战神之锤', element: 'normal', faces: [1,2,3,4,5,6], rarity: 'rare',
    description: '以三条或更高牌型出牌时，追加所有选中骰子总点数50%的固定伤害', onPlay: { bonusDamageFromPoints: 0.5, requiresTriple: true } },
  { id: 'w_bloodblade', name: '浴血之刃', element: 'normal', faces: [1,2,3,4,5,6], rarity: 'rare',
    description: '每次触发嗜血重投后，本骰子所有面值永久+1，最多+3', onPlay: { scaleWithBloodRerolls: true } },
  { id: 'w_giantshield', name: '巨人壁垒', element: 'normal', faces: [1,2,3,4,5,6], rarity: 'rare',
    description: '出牌时获得护甲，数值等于所有选中骰子总点数的2.5倍，并嘲讽全体敌人',
    onPlay: { armorMultFromTotalPoints: 2.5, tauntAll: true } },
  { id: 'w_berserk', name: '狂暴之心', element: 'normal', faces: [1,2,3,4,5,6], rarity: 'rare',
    description: '进入狂暴状态2回合：造成伤害+30%，但受到伤害也+20%', onPlay: { selfBerserk: true } },
  { id: 'w_whirlwind', name: '旋风斩', element: 'normal', faces: [1,2,3,4,5,6], rarity: 'rare',
    description: '对全体敌人造成伤害，每个敌人额外承受6点固定伤害', onPlay: { aoe: true, aoeDamage: 6 } },
  { id: 'w_cleave', name: '顺劈斩', element: 'normal', faces: [1,2,3,4,5,6], rarity: 'rare',
    description: '击杀目标后，溢出伤害全额转移给随机另一个敌人；本次出牌斩首槽上限+1（最多 +2 临时手牌）', onPlay: { splinterDamage: 1.0 } },

  // === Legendary (2) ===
  { id: 'w_bloodgod', name: '血神之眼', element: 'normal', faces: [1,2,3,4,5,6], rarity: 'legendary',
    description: '本回合每损失最大HP的1%，最终伤害提升20%', onPlay: { scaleWithSelfDamage: true } },
  { id: 'w_overlord', name: '霸体铠甲', element: 'normal', faces: [1,2,3,4,5,6], rarity: 'legendary',
    description: '出牌时获得20点护甲，最终伤害按当前护甲总量的20%提升；本次出牌完防槽上限+1（最多 +2 临时手牌）', onPlay: { armor: 20, damageFromArmor: 0.2 } },
];

// ============================================================
// 法师专属骰子（20个）
// 原则：囤牌吟唱 → 元素操控 → 一波毁天灭地
// ============================================================

const MAGE_DICE: DiceDef[] = [
  // === Common (6) ===
  { id: 'mage_elemental', name: '元素之力', element: 'normal', faces: [1,2,3,4,5,6], rarity: 'common',
    description: '每回合随机变为火、冰、雷、毒、圣元素之一，触发对应元素效果', isElemental: true },
  { id: 'mage_reverse', name: '逆流', element: 'normal', faces: [1,2,3,4,5,6], rarity: 'common',
    description: '摧毁目标全部护甲，并将护甲数值转化为对目标的伤害', onPlay: { armorBreak: true, armorToDamage: true } },
  { id: 'mage_missile', name: '奥术飞弹', element: 'normal', faces: [1,2,3,4,5,6], rarity: 'common',
    description: '出牌结算后，对每个存活敌人各造成等于本骰子点数的独立伤害', onPlay: { chainBolt: true } },
  { id: 'mage_barrier', name: '魔力壁障', element: 'normal', faces: [1,2,3,4,5,6], rarity: 'common',
    description: '出牌时获得免伤护盾，数值为本骰子点数的2倍，本回合内抵消等量伤害', onPlay: { damageShield: true } },
  { id: 'mage_meditate', name: '冥想', element: 'normal', faces: [1,2,3,4,5,6], rarity: 'common',
    description: '吟唱（不出牌）回合自动回复4HP，并清除1层负面状态', onPlay: { healOnSkip: 4, purifyOneOnSkip: true } },
  { id: 'mage_amplify', name: '奥术增幅', element: 'normal', faces: [1,2,3,4,5,6], rarity: 'common',
    description: '出牌时手牌中每有1颗元素骰子，最终伤害提升15%', onPlay: { multPerElement: 0.15 } },

  // === Uncommon (8) ===
  { id: 'mage_mirror', name: '镜像', element: 'normal', faces: [1,2,3,4,5,6], rarity: 'uncommon',
    description: '出牌时点数变为手牌中最高的骰子点数，不影响牌型判定', onPlay: { copyHighestValue: true, ignoreForHandType: true } },
  { id: 'mage_crystal', name: '蓄能水晶', element: 'normal', faces: [1,2,3,4,5,6], rarity: 'uncommon',
    description: '保留到下回合时，本骰子的点数增加2', onPlay: { bonusOnKeep: 2 } },
  { id: 'mage_temporal', name: '时光之沙', element: 'normal', faces: [1,2,3,4,5,6], rarity: 'uncommon',
    description: '保留到下回合时，自动将手牌中点数最低的骰子点数增加3', onPlay: { boostLowestOnKeep: 3 } },
  { id: 'mage_prism', name: '棱镜聚焦', element: 'normal', faces: [1,2,3,4,5,6], rarity: 'uncommon',
    description: '出牌后锁定当前元素类型，下回合所有元素骰子沿用该类型', isElemental: true, onPlay: { lockElement: true } },
  { id: 'mage_resonance', name: '共鸣', element: 'normal', faces: [1,2,3,4,5,6], rarity: 'uncommon',
    description: '自动跟随本回合的元素坍缩结果，额外触发一次该元素效果', isElemental: true, onPlay: { copyMajorityElement: true } },
  { id: 'mage_devour', name: '超载', element: 'normal', faces: [1,2,3,4,5,6], rarity: 'uncommon',
    description: '出牌时如果处于蓄力状态，伤害额外提升当前蓄力层数+15%', onPlay: { bonusMultPerExtraCharge: 0.15 } },
  { id: 'mage_purify', name: '净化之光', element: 'normal', faces: [1,2,3,4,5,6], rarity: 'uncommon',
    description: '清除自身全部负面状态，每清除1层回复5HP', onPlay: { purifyAll: true, healPerCleanse: 5 } },
  { id: 'mage_surge', name: '法力涌动', element: 'normal', faces: [1,2,3,4,5,6], rarity: 'uncommon',
    description: '保留到下回合时，下次出牌的伤害倍率提升20%', onPlay: { bonusMultOnKeep: 0.2 } },

  // === Rare (4) ===
  { id: 'mage_elemstorm', name: '元素风暴', element: 'normal', faces: [1,2,3,4,5,6], rarity: 'rare',
    description: '出牌时每颗选中的骰子各触发1种随机元素效果', isElemental: true, onPlay: { multiElementBlast: true } },
  { id: 'mage_burnecho', name: '灼烧共鸣', element: 'normal', faces: [1,2,3,4,5,6], rarity: 'rare',
    description: '目标身上每有1层灼烧，追加5点固定伤害，并延长灼烧1回合', onPlay: { burnEcho: true } },
  { id: 'mage_star', name: '星辰', element: 'normal', faces: [1,2,3,4,5,6], rarity: 'rare',
    description: '每吟唱1回合，本骰子点数增加1，最多+3', onPlay: { bonusPerTurnKept: 1, keepBonusCap: 3 } },
  { id: 'mage_frostecho', name: '冰封余韵', element: 'normal', faces: [1,2,3,4,5,6], rarity: 'rare',
    description: '目标上回合曾被冻结时，本次伤害提升50%', onPlay: { frostEchoDamage: 0.5 } },

  // === Legendary (2) ===
  { id: 'mage_meteor', name: '禁咒·陨星', element: 'normal', faces: [1,2,3,4,5,6], rarity: 'legendary',
    description: '需吟唱至少2回合才能释放；伤害提升50%，之后每多吟唱1回合再提升20%', onPlay: { bonusMult: 1.5, requiresCharge: 2, bonusMultPerExtraCharge: 0.2 } },
  { id: 'mage_elemheart', name: '元素之心', element: 'normal', faces: [1,2,3,4,5,6], rarity: 'legendary',
    description: '出牌时同时触发火、冰、雷、毒、圣全部5种元素效果', isElemental: true, onPlay: { triggerAllElements: true } },
];

// ============================================================
// 盗贼专属骰子（20个）
// 原则：单回合多次出牌 → 补手牌/补出牌 → 连击奖励
// ============================================================

const ROGUE_DICE: DiceDef[] = [
  // === Common (6) ===
  { id: 'r_envenom', name: '淬毒', element: 'normal', faces: [1,2,3,4,5,6], rarity: 'common',
    description: '对目标施加毒层，层数等于本骰子的点数', onPlay: { poisonFromValue: true } },
  { id: 'r_throwing', name: '飞刀', element: 'normal', faces: [2,3,3,4,4,5], rarity: 'common',
    description: '出牌后弹回手牌可再次使用，每次弹回后本骰子点数+1，最多+3', onPlay: { bounceAndGrow: true } },
  { id: 'r_pursuit', name: '追击', element: 'normal', faces: [3,3,4,4,5,5], rarity: 'common',
    description: '本回合第3次及以上出牌时，伤害变为原来的2倍半', onPlay: { multOnThirdPlay: 2.5 } },
  { id: 'r_sleeve', name: '袖箭', element: 'normal', faces: [2,2,3,3,4,4], rarity: 'common',
    description: '出牌后补1颗暗影残骰到手牌；作为连击出牌时，额外获得1次出牌机会', onPlay: { grantShadowDie: true, comboGrantPlay: true } },
  { id: 'r_quickdraw', name: '接应', element: 'normal', faces: [2,2,3,3,4,4], rarity: 'common',
    description: '出牌后立即从骰子库中补抽1颗骰子到手牌', onPlay: { drawFromBag: 1 } },
  { id: 'r_combomastery', name: '连击心得', element: 'normal', faces: [2,3,3,4,4,5], rarity: 'common',
    description: '出牌后补1颗暗影残骰到手牌；作为连击出牌时，该残骰可保留到下回合', onPlay: { grantShadowDie: true, comboPersistShadow: true } },

  // === Uncommon (6) ===
  { id: 'r_toxblade', name: '剧毒匕首', element: 'normal', faces: [1,2,3,4,5,6], rarity: 'uncommon',
    description: '对目标施加毒层：本骰子点数+3层；目标已中毒时再额外+2层', onPlay: { poisonBase: 3, poisonBonusIfPoisoned: 2 } },
  { id: 'r_shadow_clone', name: '影分身', element: 'normal', faces: [2,2,3,3,4,4], rarity: 'uncommon',
    description: '出牌结算后，自动追加一次额外攻击，伤害为本次的50%', onPlay: { shadowClonePlay: true } },
  { id: 'r_boomerang', name: '回旋刃', element: 'normal', faces: [2,3,3,4,4,5], rarity: 'uncommon',
    description: '首次出牌后弹回手牌，获得一次免费重投', onPlay: { boomerangPlay: true } },
  { id: 'r_corrosion', name: '蚀骨毒液', element: 'normal', faces: [1,2,3,4,5,6], rarity: 'uncommon',
    description: '对目标追加固定伤害，数值为目标身上毒层数的2倍；连击时引爆目标25%毒层为即时伤害', onPlay: { poisonScaleDamage: 2, comboDetonatePoison: 0.25 } },
  { id: 'r_chain_strike', name: '连锁打击', element: 'normal', faces: [2,2,3,3,4,4], rarity: 'uncommon',
    description: '作为连击出牌时，对随机另一个敌人造成本骰子点数2倍的独立伤害', onPlay: { comboSplashDamage: 2 } },
  { id: 'r_shadowstrike', name: '剔骨', element: 'normal', faces: [3,3,4,4,5,5], rarity: 'uncommon',
    description: '连击次数越多伤害越高：每层连击使本次伤害+100%', onPlay: { comboScaleDamage: 2.0 } },

  // === Rare (6) ===
  { id: 'r_venomfang', name: '毒王之牙', element: 'normal', faces: [1,2,3,4,5,6], rarity: 'rare',
    description: '对目标施加毒层，层数为手牌中毒系骰子数量的3倍', onPlay: { poisonFromPoisonDice: 3 } },
  { id: 'r_tripleflash', name: '三连闪', element: 'normal', faces: [2,2,3,3,4,4], rarity: 'rare',
    description: '作为第2次出牌时伤害提升60%；第3次及以上出牌时额外获得1次出牌机会', onPlay: { bonusMultOnSecondPlay: 1.6, grantPlayOnThird: true } },
  { id: 'r_shadowdance', name: '影舞', element: 'normal', faces: [3,3,4,4,5,5], rarity: 'rare',
    description: '出牌后获得1次额外出牌机会，并补1颗暗影残骰到手牌', onPlay: { grantExtraPlay: true, grantShadowDie: true } },
  { id: 'r_plaguedet', name: '瘟疫引爆', element: 'normal', faces: [1,2,3,4,5,6], rarity: 'rare',
    description: '引爆目标身上50%的毒层转化为即时伤害；本回合每多出1次牌，引爆比例+10%', onPlay: { detonatePoisonPercent: 0.5, detonateExtraPerPlay: 0.1 } },
  { id: 'r_phantom', name: '幻影', element: 'normal', faces: [1,2,3,4,5,6], rarity: 'rare',
    description: '本骰子点数随手牌中暗影残骰数量增长：每颗残骰+2点，至少为2', onPlay: { phantomFromShadowDice: true } },
  { id: 'r_purifyblade', name: '净化之刃', element: 'normal', faces: [2,3,3,4,4,5], rarity: 'rare',
    description: '清除1层负面状态；作为连击出牌时，额外回复4HP', onPlay: { purifyOne: true, comboHeal: 4 } },

  // === Legendary (2) ===
  { id: 'r_deathtouch', name: '死神之触', element: 'normal', faces: [1,2,3,4,5,6], rarity: 'legendary',
    description: '作为本回合最后一次出牌时，引爆目标身上的全部负面状态为即时伤害', onPlay: { detonateAllOnLastPlay: true } },
  { id: 'r_bladestorm', name: '影刃风暴', element: 'normal', faces: [1,2,2,3,3,4], rarity: 'legendary',
    description: '本回合每出1次牌，后续伤害叠加提升40%，并补1颗暗影残骰到手牌', onPlay: { escalateDamage: 0.4, grantShadowDie: true } },
];

// ============================================================
// 按职业获取骰子池
// ============================================================

export const CLASS_DICE: Record<ClassId, DiceDef[]> = {
  warrior: WARRIOR_DICE,
  mage: MAGE_DICE,
  rogue: ROGUE_DICE,
};

/** 获取指定职业所有骰子的注册表 */
export function getClassDiceRegistry(classId: ClassId): Record<string, DiceDef> {
  const result: Record<string, DiceDef> = {};
  CLASS_DICE[classId].forEach(d => { result[d.id] = d; });
  return result;
}

/** 获取指定职业按稀有度分组的骰子 */
export function getClassDiceByRarity(classId: ClassId) {
  const pool = CLASS_DICE[classId];
  return {
    common: pool.filter(d => d.rarity === 'common'),
    uncommon: pool.filter(d => d.rarity === 'uncommon'),
    rare: pool.filter(d => d.rarity === 'rare'),
    legendary: pool.filter(d => d.rarity === 'legendary'),
  };
}
