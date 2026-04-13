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
  canBloodReroll: boolean; // 卖血重投
  keepUnplayed: boolean;   // 保留未出牌骰子

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
    description: '以鲜血为代价，换取毁天灭地的一击。卖血重投越多，伤害越高。',
    color: '#c04040',
    colorLight: '#ff6060',
    colorDark: '#601010',
    drawCount: 3,
    maxPlays: 1,
    freeRerolls: 1,
    canBloodReroll: true,
    keepUnplayed: false,
    initialDice: ['standard', 'standard', 'standard', 'standard', 'w_bloodthirst', 'w_thorns'],
    passiveDesc: '【血怒战意】卖血重投每次+15%最终伤害（叠加）；血量≤50%手牌+1；手牌溢出上限时按受伤百分比加伤害倍率；普攻可多选',
    skills: [
      { name: '血怒战意', desc: '每次卖血重投，最终伤害+15%（可叠加），以鲜血换取毁灭之力' },
      { name: '狂暴本能', desc: '血量≤50%时手牌上限+1颗；手牌达到6颗上限时，按受伤百分比获得等比例伤害倍率加成' },
      { name: '铁拳连打', desc: '普攻牌型可多选骰子，一次打出所有选中骰子的伤害' },
    ],
    normalAttackMultiSelect: true,
  },
  mage: {
    id: 'mage',
    name: '星界魔导',
    title: '星界禁咒师',
    description: '耐心蓄力，两三回合攒齐完美手牌，打出毁天灭地的大招。',
    color: '#7040c0',
    colorLight: '#a070ff',
    colorDark: '#301060',
    drawCount: 3,
    maxPlays: 1,
    freeRerolls: 1,
    canBloodReroll: false,
    keepUnplayed: true,
    initialDice: ['standard', 'standard', 'standard', 'standard', 'mage_elemental', 'mage_reverse'],
    passiveDesc: '【星界蓄力】未出牌骰子保留到下回合（3→4→5→6递增）；蓄力回合+6护甲；满6后继续蓄力每次+10%伤害；出牌后重置',
    skills: [
      { name: '星界蓄力', desc: '未出牌的骰子保留到下回合，手牌上限逐层递增（3→4→5→6）' },
      { name: '蓄力护盾', desc: '每次蓄力（不出牌）获得+6护甲，积攒防御' },
      { name: '过充释放', desc: '手牌满6颗后继续蓄力，每回合额外+10%伤害倍率；出牌后重置' },
    ],
    normalAttackMultiSelect: false,
  },
  rogue: {
    id: 'rogue',
    name: '影锋刺客',
    title: '暗影连击者',
    description: '一回合出牌两次，连击加成层层递增。特定骰子触发时补充临时骰子。',
    color: '#30a050',
    colorLight: '#60d080',
    colorDark: '#104020',
    drawCount: 3,
    maxPlays: 2,
    freeRerolls: 1,
    canBloodReroll: false,
    keepUnplayed: false,
    initialDice: ['standard', 'standard', 'standard', 'standard', 'r_quickdraw', 'r_combomastery'],
    passiveDesc: '【连击】每回合出牌2次；第2次伤害×1.2；两次同牌型+25%；特定骰子触发时补充临时骰子',
    skills: [
      { name: '双刃连击', desc: '每回合可出牌2次，第2次出牌伤害×1.2' },
      { name: '精准连击', desc: '两次出牌使用相同牌型时（非普攻），额外+25%伤害加成' },
      { name: '暗影补充', desc: '特定骰子（袖箭/接应/影舞/影刃风暴）触发时，自动补充1颗临时骰子到手牌' },
    ],
    normalAttackMultiSelect: false,
  },
};

// ============================================================
// 战士专属骰子（22个）
// 原则：面值全是[1-6]或全6，靠效果凶残
// ============================================================

const WARRIOR_DICE: DiceDef[] = [
  // === Common (6) ===
  { id: 'w_bloodthirst', name: '嗜血骰子', element: 'normal', faces: [1,2,3,4,5,6], rarity: 'common',
    description: '出牌时自伤最大HP的2%，额外伤害+8', onPlay: { bonusDamage: 8, selfDamagePercent: 0.02 } },
  { id: 'w_thorns', name: '荆棘骰子', element: 'normal', faces: [1,2,3,4,5,6], rarity: 'common',
    description: '出牌时获得等于骰子点数的护甲', onPlay: { armorFromValue: true } },
  { id: 'w_warcry', name: '战吼骰子', element: 'normal', faces: [1,2,3,4,5,6], rarity: 'common',
    description: '出牌时对目标施加1层易伤（2回合）', onPlay: { statusToEnemy: { type: 'vulnerable', value: 1, duration: 2 } } },
  { id: 'w_ironwall', name: '铁壁骰子', element: 'normal', faces: [1,2,3,4,5,6], rarity: 'common',
    description: '出牌时获得6护甲', onPlay: { armor: 6 } },
  { id: 'w_fury', name: '怒火骰子', element: 'normal', faces: [1,2,3,4,5,6], rarity: 'common',
    description: '每次受到敌人攻击，本骰子额外基础伤害永久+1（本局游戏叠加，2级+2，3级+3）', onPlay: { scaleWithHits: true } },
  { id: 'w_charge', name: '冲锋骰子', element: 'normal', faces: [1,2,3,4,5,6], rarity: 'common',
    description: '每场战斗首次出牌时伤害+12', onPlay: { bonusDamage: 12, firstPlayOnly: true } },

  // === Uncommon (8) ===
  { id: 'w_armorbreak', name: '破甲骰子', element: 'normal', faces: [1,2,3,4,5,6], rarity: 'uncommon',
    description: '出牌时摧毁敌人全部护甲', onPlay: { armorBreak: true } },
  { id: 'w_revenge', name: '复仇骰子', element: 'normal', faces: [1,2,3,4,5,6], rarity: 'uncommon',
    description: '额外伤害=本场已损失HP的10%', onPlay: { scaleWithLostHp: 0.1 } },
  { id: 'w_roar', name: '咆哮骰子', element: 'normal', faces: [1,2,3,4,5,6], rarity: 'uncommon',
    description: '净化自身全部负面+清除诅咒骰子。代价：嘲讽全体敌人无视距离攻击你', onPlay: { purifyAll: true, tauntAll: true } },
  { id: 'w_lifefurnace', name: '生命熔炉', element: 'normal', faces: [1,2,3,4,5,6], rarity: 'uncommon',
    description: '出牌时最大HP永久+3，回复3HP', onPlay: { maxHpBonus: 3, heal: 3 } },
  { id: 'w_bloodpact', name: '鲜血契约', element: 'normal', faces: [6,6,6,6,6,6], rarity: 'uncommon',
    description: '全6面骰子，出牌时自伤最大HP的6%', onPlay: { selfDamagePercent: 0.06 } },
  { id: 'w_execute', name: '处刑骰子', element: 'normal', faces: [1,2,3,4,5,6], rarity: 'uncommon',
    description: '敌人血量低于25%时本骰子伤害×3', onPlay: { executeThreshold: 0.25, executeMult: 3 } },
  { id: 'w_quake', name: '震地骰子', element: 'normal', faces: [1,2,3,4,5,6], rarity: 'uncommon',
    description: '出牌时对全体敌人造成3点独立AOE伤害', onPlay: { aoeDamage: 3 } },
  { id: 'w_leech', name: '吸血骰子', element: 'normal', faces: [1,2,3,4,5,6], rarity: 'uncommon',
    description: '出牌时回复等于骰子点数的HP', onPlay: { healFromValue: true } },

  // === Rare (6) ===
  { id: 'w_titanfist', name: '泰坦之拳', element: 'normal', faces: [6,6,6,6,6,6], rarity: 'rare',
    description: '全6面骰子，出牌时自伤最大HP的10%', onPlay: { selfDamagePercent: 0.10 } },
  { id: 'w_unyielding', name: '不屈意志', element: 'normal', faces: [1,2,3,4,5,6], rarity: 'rare',
    description: '血量低于30%时点数自动视为6', onPlay: { lowHpOverrideValue: 6, lowHpThreshold: 0.3 } },
  { id: 'w_warhammer', name: '战神之锤', element: 'normal', faces: [1,2,3,4,5,6], rarity: 'rare',
    description: '三条以上牌型时额外伤害+总点数的50%', onPlay: { bonusDamageFromPoints: 0.5, requiresTriple: true } },
  { id: 'w_bloodblade', name: '浴血之刃', element: 'normal', faces: [1,2,3,4,5,6], rarity: 'rare',
    description: '每次卖血重投本骰子面值永久+1（本场上限+3）', onPlay: { scaleWithBloodRerolls: true } },
  { id: 'w_giantshield', name: '巨人护盾', element: 'normal', faces: [1,2,3,4,5,6], rarity: 'rare',
    description: '出牌时获得等于所有选中骰子总点数的护甲', onPlay: { armorFromTotalPoints: true } },
  { id: 'w_berserk', name: '狂暴之心', element: 'normal', faces: [1,2,3,4,5,6], rarity: 'rare',
    description: '自身施加"狂暴"2回合：伤害+30%，受伤+20%', onPlay: { selfBerserk: true } },

  // === Legendary (2) ===
  { id: 'w_bloodgod', name: '血神之眼', element: 'normal', faces: [1,2,3,4,5,6], rarity: 'legendary',
    description: '本回合每自伤最大HP的1%，最终伤害+2%', onPlay: { scaleWithSelfDamage: true } },
  { id: 'w_overlord', name: '霸体铠甲', element: 'normal', faces: [1,2,3,4,5,6], rarity: 'legendary',
    description: '出牌时获得20护甲+最终伤害加成=当前护甲的20%', onPlay: { armor: 20, damageFromArmor: 0.2 } },
];

// ============================================================
// 法师专属骰子（22个）
// 原则：面值全[1-6]，靠元素和操控取胜
// ============================================================

const MAGE_DICE: DiceDef[] = [
  // === Common (6) ===
  { id: 'mage_elemental', name: '元素骰子', element: 'normal', faces: [1,2,3,4,5,6], rarity: 'common',
    description: '抽到时随机坍缩为火/冰/雷/毒/圣之一', isElemental: true },
  { id: 'mage_reverse', name: '反转骰子', element: 'normal', faces: [1,2,3,4,5,6], rarity: 'common',
    description: '出牌时将目标敌人的护甲反转为对其的伤害', onPlay: { armorBreak: true, armorToDamage: true } },
  { id: 'mage_missile', name: '奥术飞弹', element: 'normal', faces: [1,2,3,4,5,6], rarity: 'common',
    description: '出牌时额外对随机敌人造成3点独立伤害', onPlay: { aoeDamage: 3, randomTarget: true } },
  { id: 'mage_barrier', name: '魔力屏障', element: 'normal', faces: [1,2,3,4,5,6], rarity: 'common',
    description: '出牌时获得4护甲+清除自身1层灼烧', onPlay: { armor: 4, removeBurn: 1 } },
  { id: 'mage_meditate', name: '冥想骰子', element: 'normal', faces: [1,2,3,4,5,6], rarity: 'common',
    description: '未出牌的回合回复4HP', onPlay: { healOnSkip: 4 } },
  { id: 'mage_amplify', name: '奥术增幅', element: 'normal', faces: [1,2,3,4,5,6], rarity: 'common',
    description: '手牌中每有1颗元素骰子，伤害+3', onPlay: { bonusDamagePerElement: 3 } },

  // === Uncommon (8) ===
  { id: 'mage_mirror', name: '镜像骰子', element: 'normal', faces: [1,2,3,4,5,6], rarity: 'uncommon',
    description: '结算时复制手牌中点数最高骰子的点数', onPlay: { copyHighestValue: true } },
  { id: 'mage_crystal', name: '水晶骰子', element: 'normal', faces: [1,2,3,4,5,6], rarity: 'uncommon',
    description: '保留到下回合时点数+2（蓄力增值）', onPlay: { bonusOnKeep: 2 } },
  { id: 'mage_temporal', name: '时光骰子', element: 'normal', faces: [1,2,3,4,5,6], rarity: 'uncommon',
    description: '保留到下回合时自动重投一次（免费刷新点数）', onPlay: { rerollOnKeep: true } },
  { id: 'mage_prism', name: '棱镜骰子', element: 'normal', faces: [1,2,3,4,5,6], rarity: 'uncommon',
    description: '随机坍缩为两种元素之一，同时触发两种元素效果', isElemental: true, onPlay: { dualElement: true } },
  { id: 'mage_resonance', name: '共鸣骰子', element: 'normal', faces: [1,2,3,4,5,6], rarity: 'uncommon',
    description: '自动复制手牌中数量最多的元素', isElemental: true, onPlay: { copyMajorityElement: true } },
  { id: 'mage_devour', name: '吞噬骰子', element: 'normal', faces: [1,2,3,4,5,6], rarity: 'uncommon',
    description: '出牌时消耗手牌中1颗未选中骰子，本骰子点数+该骰子点数', onPlay: { devourDie: true } },
  { id: 'mage_purify', name: '净化之光', element: 'normal', faces: [1,2,3,4,5,6], rarity: 'uncommon',
    description: '出牌时清除自身全部负面状态，每清除1种回复3HP', onPlay: { purifyAll: true, healPerCleanse: 3 } },
  { id: 'mage_surge', name: '法力涌动', element: 'normal', faces: [1,2,3,4,5,6], rarity: 'uncommon',
    description: '蓄力（保留到下回合）时下次出牌倍率额外+20%', onPlay: { bonusMultOnKeep: 0.2 } },

  // === Rare (6) ===
  { id: 'mage_elemstorm', name: '元素风暴', element: 'normal', faces: [1,2,3,4,5,6], rarity: 'rare',
    description: '出牌时将所有选中骰子强制变为同一随机元素', isElemental: true, onPlay: { unifyElement: true } },
  { id: 'mage_voideye', name: '虚空之眼', element: 'normal', faces: [1,2,3,4,5,6], rarity: 'rare',
    description: '结算时点数变为7（突破6面上限）', onPlay: { overrideValue: 7 } },
  { id: 'mage_weave', name: '命运编织', element: 'normal', faces: [1,2,3,4,5,6], rarity: 'rare',
    description: '结算时可与手牌中任意未选中骰子交换点数', onPlay: { swapWithUnselected: true } },
  { id: 'mage_permafrost', name: '永冻核心', element: 'normal', faces: [1,2,3,4,5,6], rarity: 'rare',
    description: '冰元素锁定，冻结+1回合（共2回合）', isElemental: true, onPlay: { freezeBonus: 1 } },
  { id: 'mage_star', name: '星辰骰子', element: 'normal', faces: [1,2,3,4,5,6], rarity: 'rare',
    description: '在手牌中每存在1回合点数+1（上限+3）', onPlay: { bonusPerTurnKept: 1, keepBonusCap: 3 } },
  { id: 'mage_shield', name: '法术护盾', element: 'normal', faces: [1,2,3,4,5,6], rarity: 'rare',
    description: '出牌时获得护甲=手牌中骰子总数×5', onPlay: { armorFromHandSize: 5 } },

  // === Legendary (2) ===
  { id: 'mage_meteor', name: '禁咒·陨星', element: 'normal', faces: [1,2,3,4,5,6], rarity: 'legendary',
    description: '蓄力2回合后出牌时伤害×1.8', onPlay: { bonusMult: 1.8, requiresCharge: 2 } },
  { id: 'mage_elemheart', name: '元素之心', element: 'normal', faces: [1,2,3,4,5,6], rarity: 'legendary',
    description: '出牌时触发手牌中所有不同元素的效果（即使未选中）', isElemental: true, onPlay: { triggerAllElements: true } },
];

// ============================================================
// 盗贼专属骰子（22个）
// 原则：大量特殊面值，靠连击/毒/操作取胜
// ============================================================

const ROGUE_DICE: DiceDef[] = [
  // === Common (8) ===
  { id: 'r_dagger', name: '匕首骰子', element: 'normal', faces: [1,1,2,2,3,3], rarity: 'common',
    description: '参与出牌时连击倍率额外+15%', onPlay: { comboBonus: 0.15 } },
  { id: 'r_envenom', name: '淬毒骰子', element: 'normal', faces: [1,2,3,4,5,6], rarity: 'common',
    description: '施加毒层=7-点数（点数越小毒越猛）', onPlay: { poisonInverse: true } },
  { id: 'r_throwing', name: '飞刀骰子', element: 'normal', faces: [1,2,2,3,3,4], rarity: 'common',
    description: '出牌后不消耗留在手牌（每回合限1次）', onPlay: { stayInHand: true } },
  { id: 'r_heavy', name: '灌铅骰子', element: 'normal', faces: [4,4,5,5,6,6], rarity: 'common',
    description: '高下限，凑对子/三条基石' },
  { id: 'r_poison_vial', name: '毒瓶骰子', element: 'normal', faces: [1,1,2,2,3,3], rarity: 'common',
    description: '出牌时固定施加3层毒', onPlay: { statusToEnemy: { type: 'poison', value: 3 } } },
  { id: 'r_sleeve', name: '袖箭骰子', element: 'normal', faces: [2,2,3,3,4,4], rarity: 'common',
    description: '出牌后补充1颗临时骰子到手牌（随机1-6）', onPlay: { grantTempDie: true } },
  { id: 'r_quickdraw', name: '接应骰子', element: 'normal', faces: [2,2,3,3,4,4], rarity: 'common',
    description: '出牌后立即从骰子库补抽1颗骰子到手牌', onPlay: { grantTempDie: true } },
  { id: 'r_combomastery', name: '连击心得', element: 'normal', faces: [1,2,3,4,5,6], rarity: 'common',
    description: '成功触发连击（第2次出牌）后，下回合手牌上限+1', onPlay: { comboDrawBonusNextTurn: true } },

  // === Uncommon (8) ===
  { id: 'r_lethal', name: '致命骰子', element: 'normal', faces: [3,3,4,4,5,5], rarity: 'uncommon',
    description: '第2次出牌时暴击（伤害×1.4）', onPlay: { critOnSecondPlay: 1.4 } },
  { id: 'r_toxblade', name: '剧毒匕首', element: 'normal', faces: [1,1,2,2,3,3], rarity: 'uncommon',
    description: '施加毒=点数+3，敌人已有毒再+2', onPlay: { poisonBase: 3, poisonBonusIfPoisoned: 2 } },
  { id: 'r_shadow_clone', name: '影分身', element: 'normal', faces: [2,2,3,3,4,4], rarity: 'uncommon',
    description: '结算时复制自身（多1颗同点数参与计算）' },
  { id: 'r_miasma', name: '毒雾骰子', element: 'normal', faces: [1,2,3,4,5,6], rarity: 'uncommon',
    description: '出牌时对全体敌人施加2层毒', onPlay: { aoeDamage: 0, statusToEnemy: { type: 'poison', value: 2 }, aoe: true } },
  { id: 'r_boomerang', name: '回旋骰子', element: 'normal', faces: [2,3,3,4,4,5], rarity: 'uncommon',
    description: '出牌后必定弹回手牌', onPlay: { alwaysBounce: true } },
  { id: 'r_corrosion', name: '蚀骨毒液', element: 'normal', faces: [1,1,2,2,3,3], rarity: 'uncommon',
    description: '施加"蚀骨"：敌人毒伤+50%（2回合）', onPlay: { statusToEnemy: { type: 'corrosion', value: 50, duration: 2 } } },
  { id: 'r_shadow', name: '暗影骰子', element: 'normal', faces: [2,2,3,3,4,4], rarity: 'uncommon',
    description: '第2次出牌时额外伤害+6', onPlay: { bonusDamageOnSecondPlay: 6 } },
  { id: 'r_steal', name: '偷窃骰子', element: 'normal', faces: [1,2,3,4,5,6], rarity: 'uncommon',
    description: '出牌时偷取敌人护甲（最多10点）转为自己的', onPlay: { stealArmor: 10 } },

  // === Rare (6) ===
  { id: 'r_venomfang', name: '毒王之牙', element: 'normal', faces: [1,1,2,2,3,3], rarity: 'rare',
    description: '施加毒层=手牌中毒系骰子数×3', onPlay: { poisonFromPoisonDice: 3 } },
  { id: 'r_tripleflash', name: '三连闪', element: 'normal', faces: [2,2,3,3,4,4], rarity: 'rare',
    description: '第2次出牌时伤害×1.6', onPlay: { bonusMultOnSecondPlay: 1.6 } },
  { id: 'r_shadowdance', name: '影舞骰子', element: 'normal', faces: [3,3,4,4,5,5], rarity: 'rare',
    description: '出牌后获得1次额外出牌机会（本回合限1次）+补充1颗临时骰子', onPlay: { grantExtraPlay: true, grantTempDie: true } },
  { id: 'r_plaguedet', name: '瘟疫引爆', element: 'normal', faces: [1,2,3,4,5,6], rarity: 'rare',
    description: '出牌时引爆敌人50%的毒层为即时伤害', onPlay: { detonatePoisonPercent: 0.5 } },
  { id: 'r_phantom', name: '幻影骰子', element: 'normal', faces: [1,2,3,4,5,6], rarity: 'rare',
    description: '万能：结算时视为任意1-6（玩家选择）', onPlay: { wildcard: true } },
  { id: 'r_purifyblade', name: '净化之刃', element: 'normal', faces: [2,3,3,4,4,5], rarity: 'rare',
    description: '清除自身1个负面状态+转移给敌人', onPlay: { transferDebuff: true } },

  // === Legendary (2) ===
  { id: 'r_deathtouch', name: '死神之触', element: 'normal', faces: [1,2,3,4,5,6], rarity: 'legendary',
    description: '本回合最后一次出牌时引爆敌人全部负面状态', onPlay: { detonateAllOnLastPlay: true } },
  { id: 'r_bladestorm', name: '影刃风暴', element: 'normal', faces: [1,1,2,2,3,3], rarity: 'legendary',
    description: '每出一次牌后续伤害+40%（可叠加）+补充1颗临时骰子', onPlay: { escalateDamage: 0.4, grantTempDie: true } },
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
