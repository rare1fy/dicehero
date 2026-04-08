import { Augment } from '../types/game';
import { AUGMENT_SCALING } from '../config';

const getScale = (level: number) => 1 + (level - 1) * AUGMENT_SCALING.scaleFactor;

export { getScale };

// ============================================================
// 遗物池 - 小丑牌式设计
// 5大分类: 过渡 / 运营 / 终端 / 普攻流 / 自残流
// ============================================================

export const AUGMENTS_POOL: Augment[] = [
  // ──────────────────────────────────────────────
  // 【过渡类】前期提供小幅固定数值加成，帮助度过前期
  // ──────────────────────────────────────────────
  {
    id: 'iron_skin',
    name: '铁皮护符',
    level: 1,
    category: 'transition',
    condition: 'always',
    effect: (_x, _dice, level) => ({ armor: Math.floor(7 * getScale(level)) }),
    description: '每次出牌: 获得 7 点护甲',
  },
  {
    id: 'minor_heal',
    name: '治愈之风',
    level: 1,
    category: 'transition',
    condition: 'always',
    effect: (_x, _dice, level) => ({ heal: Math.floor(3 * getScale(level)) }),
    description: '每次出牌: 回复 2 HP',
  },
  {
    id: 'sharp_edge',
    name: '磨刃石',
    level: 1,
    category: 'transition',
    condition: 'always',
    effect: (_x, _dice, level) => ({ damage: Math.floor(8 * getScale(level)) }),
    description: '每次出牌: 额外造成 8 点伤害',
  },
  {
    id: 'lucky_coin',
    name: '幸运铜板',
    level: 1,
    category: 'transition',
    condition: 'always',
    effect: (_x, _dice, level) => ({ goldBonus: Math.floor(2 * getScale(level)) }),
    description: '每次出牌: 额外获得 2 金币',
  },
  {
    id: 'thick_hide',
    name: '厚皮兽甲',
    level: 1,
    category: 'transition',
    condition: 'pair',
    effect: (_x, _dice, level) => ({ armor: Math.floor(8 * getScale(level)) }),
    description: '对子: 获得 8 点护甲',
  },
  {
    id: 'warm_ember',
    name: '余烬暖石',
    level: 1,
    category: 'transition',
    condition: 'pair',
    effect: (_x, _dice, level) => ({ heal: Math.floor(4 * getScale(level)), armor: Math.floor(3 * getScale(level)) }),
    description: '对子: 回复 4 HP 并获得 3 护甲',
  },

  // ──────────────────────────────────────────────
  // 【运营类】提升金币产出、经济效率
  // ──────────────────────────────────────────────
  {
    id: 'merchants_eye',
    name: '商人之眼',
    level: 1,
    category: 'economy',
    condition: 'always',
    effect: (_x, _dice, level) => ({ goldBonus: Math.floor(3 * getScale(level)) }),
    description: '每次出牌: 额外获得 3 金币',
  },
  {
    id: 'treasure_sense',
    name: '寻宝直觉',
    level: 1,
    category: 'economy',
    condition: 'straight',
    effect: (_x, _dice, level) => ({ goldBonus: Math.floor(15 * getScale(level)) }),
    description: '顺子: 额外获得 15 金币',
  },
  {
    id: 'golden_touch',
    name: '点金之手',
    level: 1,
    category: 'economy',
    condition: 'n_of_a_kind',
    effect: (x, _dice, level) => ({ goldBonus: Math.floor(x * 2 * getScale(level)) }),
    description: '多条: 额外获得 X×2 金币',
  },
  {
    id: 'war_profiteer',
    name: '战争商人',
    level: 1,
    category: 'economy',
    condition: 'always',
    effect: (_x, _dice, _level, context) => ({ goldBonus: context?.enemiesKilledThisBattle ? context.enemiesKilledThisBattle * 5 : 0 }),
    description: '每击杀一个敌人: 本场战斗每次出牌额外 +5 金币',
  },
  {
    id: 'haggler',
    name: '讨价还价',
    level: 1,
    category: 'economy',
    condition: 'passive',
    effect: () => ({ shopDiscount: 0.2 }),
    description: '被动: 宝箱消耗减少 20%',
  },
  {
    id: 'interest',
    name: '利息存款',
    level: 1,
    category: 'economy',
    condition: 'passive',
    effect: (_x, _dice, _level, context) => ({ goldBonus: Math.floor((context?.currentGold || 0) / 10) }),
    description: '被动: 每场战斗结束时，每 10 金币产生 1 金币利息',
  },

  // ──────────────────────────────────────────────
  // 【终端类】长期伤害和战斗收益提升
  // ──────────────────────────────────────────────
  {
    id: 'twin_stars',
    name: '双子星',
    level: 1,
    category: 'endgame',
    condition: 'pair',
    effect: (_x, _dice, level) => ({ multiplier: 1 + (0.8 * getScale(level)) }),
    description: '对子: 最终伤害 ×1.5',
  },
  {
    id: 'element_overload',
    name: '元素过载',
    level: 1,
    category: 'endgame',
    condition: 'same_element',
    effect: (_x, _dice, level) => ({ multiplier: 1 + (1.2 * getScale(level)) }),
    description: '同元素: 最终伤害 ×2.2',
  },
  {
    id: 'full_house_blast',
    name: '葫芦爆裂',
    level: 1,
    category: 'endgame',
    condition: 'full_house',
    effect: (x, _dice, level) => ({ damage: Math.floor(x * 2.5 * getScale(level)), armor: Math.floor(10 * getScale(level)) }),
    description: '葫芦: 造成 X×2.5 伤害并获得 10 护甲',
  },
  {
    id: 'chain_lightning',
    name: '连锁闪电',
    level: 1,
    category: 'endgame',
    condition: 'straight',
    effect: (x, _dice, level) => ({ damage: Math.floor(x * 1.5 * getScale(level)), statusEffects: [{ type: 'burn', value: Math.floor(2 * getScale(level)) }] }),
    description: '顺子: 额外造成 X×1.5 伤害并附加 2 层灼热',
  },
  {
    id: 'void_echo',
    name: '虚空回响',
    level: 1,
    category: 'endgame',
    condition: 'two_pair',
    effect: (_x, _dice, level) => ({ multiplier: 1 + (0.8 * getScale(level)) }),
    description: '连对: 最终伤害 ×1.8',
  },
  {
    id: 'frost_barrier',
    name: '霜冻屏障',
    level: 1,
    category: 'endgame',
    condition: 'full_house',
    effect: (_x, _dice, level) => ({ armor: Math.floor(15 * getScale(level)), statusEffects: [{ type: 'weak', value: Math.floor(2 * getScale(level)) }] }),
    description: '葫芦: 获得 15 护甲并使敌人虚弱 2 层',
  },
  {
    id: 'soul_harvest',
    name: '灵魂收割',
    level: 1,
    category: 'endgame',
    condition: 'n_of_a_kind',
    effect: (x, _dice, level) => ({ heal: Math.floor((x * 0.5) * getScale(level)), damage: Math.floor(x * 2 * getScale(level)) }),
    description: '多条: 造成 X×2 伤害并回复 X×0.5 HP',
  },
  {
    id: 'pressure_point',
    name: '压力点',
    level: 1,
    category: 'endgame',
    condition: 'straight',
    effect: (_x, _dice, level) => ({ pierce: 10, statusEffects: [{ type: 'vulnerable', value: Math.floor(1 * getScale(level)) }] }),
    description: '顺子: 10 穿透伤害并附加 1 层易伤',
  },

  // ──────────────────────────────────────────────
  // 【普攻流】鼓励走普通攻击流派
  // ──────────────────────────────────────────────
  {
    id: 'basic_instinct',
    name: '基本直觉',
    level: 1,
    category: 'normal_attack',
    condition: 'high_card',
    effect: (x, _dice, level) => ({ damage: Math.floor(x * 1.5 * getScale(level)) }),
    description: '普通攻击: 额外造成 X×1.5 伤害',
  },
  {
    id: 'rapid_strikes',
    name: '连击本能',
    level: 1,
    category: 'normal_attack',
    condition: 'high_card',
    effect: (_x, _dice, level) => ({ multiplier: 1 + (0.4 * getScale(level)) }),
    description: '普通攻击: 最终伤害 ×1.4',
  },
  {
    id: 'blood_pact',
    name: '血之契约',
    level: 1,
    category: 'normal_attack',
    condition: 'high_card',
    effect: (x, _dice, level) => ({ damage: Math.floor(x * 2 * getScale(level)), heal: -Math.floor(3 * getScale(level)) }),
    description: '普通攻击: 额外 X×2 伤害，但损失 3 HP',
  },
  {
    id: 'combo_master',
    name: '连招大师',
    level: 1,
    category: 'normal_attack',
    condition: 'high_card',
    effect: (_x, _dice, _level, context) => ({ 
      damage: Math.floor((context?.consecutiveNormalAttacks || 0) * 4),
      multiplier: 1 + (context?.consecutiveNormalAttacks || 0) * 0.1,
    }),
    description: '普通攻击: 连续使用普攻，每次伤害 +4 且倍率 +0.1（每回合结束重置）',
  },
  {
    id: 'minimalist',
    name: '极简主义',
    level: 1,
    category: 'normal_attack',
    condition: 'high_card',
    effect: (_x, dice, level) => ({ 
      damage: dice.length === 1 ? Math.floor(15 * getScale(level)) : 0,
      multiplier: dice.length === 1 ? 1 + (1.0 * getScale(level)) : 1,
    }),
    description: '普通攻击(单骰): 只选 1 颗骰子时，+15 伤害且 ×2.0',
  },
  {
    id: 'scattershot',
    name: '散射弹幕',
    level: 1,
    category: 'normal_attack',
    condition: 'high_card',
    effect: (_x, dice, level) => ({ 
      damage: Math.floor(dice.length * 3 * getScale(level)),
    }),
    description: '普通攻击: 每颗选中骰子额外 +3 伤害',
  },

  // ──────────────────────────────────────────────
  // 【自残流】鼓励多Roll骰子，用HP换取力量
  // ──────────────────────────────────────────────
  {
    id: 'blood_dice',
    name: '血骰契约',
    level: 1,
    category: 'self_harm',
    condition: 'always',
    effect: (_x, _dice, _level, context) => ({
      multiplier: 1 + (context?.rerollsThisTurn || 0) * 0.3,
    }),
    description: '每次出牌: 本回合每次重掷，伤害倍率 +0.3',
  },
  {
    id: 'pain_amplifier',
    name: '痛觉放大器',
    level: 1,
    category: 'self_harm',
    condition: 'always',
    effect: (_x, _dice, _level, context) => ({
      damage: Math.floor((context?.hpLostThisBattle || 0) * 0.2),
    }),
    description: '每次出牌: 本场战斗已损失HP的 20% 转化为额外伤害',
  },
  {
    id: 'adrenaline_rush',
    name: '肾上腺素',
    level: 1,
    category: 'self_harm',
    condition: 'always',
    effect: (_x, _dice, _level, context) => {
      const hpPercent = (context?.currentHp || 100) / (context?.maxHp || 100);
      const bonus = hpPercent < 0.3 ? 2.0 : hpPercent < 0.5 ? 1.5 : hpPercent < 0.7 ? 1.2 : 1.0;
      return { multiplier: bonus };
    },
    description: '每次出牌: HP越低倍率越高（70%→×1.2, 50%→×1.5, 30%→×2.0）',
  },
  {
    id: 'reroll_frenzy',
    name: '狂掷风暴',
    level: 1,
    category: 'self_harm',
    condition: 'always',
    effect: (_x, _dice, _level, context) => ({
      damage: (context?.rerollsThisTurn || 0) * 12,
    }),
    description: '每次出牌: 本回合每次重掷，额外 +8 伤害',
  },
  {
    id: 'masochist',
    name: '受虐狂',
    level: 1,
    category: 'self_harm',
    condition: 'always',
    effect: (_x, _dice, _level, context) => ({
      armor: Math.floor((context?.hpLostThisTurn || 0) * 0.5),
      heal: Math.floor((context?.hpLostThisTurn || 0) * 0.2),
    }),
    description: '每次出牌: 本回合损失HP的 50% 转化为护甲，20% 回复',
  },
  {
    id: 'glass_cannon',
    name: '玻璃大炮',
    level: 1,
    category: 'self_harm',
    condition: 'always',
    effect: (_x, _dice, level) => ({
      multiplier: 1 + (0.8 * getScale(level)),
      heal: -8,
    }),
    description: '每次出牌: 伤害 ×1.8，但损失 8 HP',
  },
];

// ============================================================
// 初始可选增幅（战斗前3选1）
// ============================================================
export const INITIAL_AUGMENTS: Augment[] = [
  {
    id: 'precise_stab',
    name: '精准刺击',
    level: 1,
    category: 'transition',
    condition: 'high_card',
    effect: (x, _dice, level) => ({ damage: Math.floor(x * getScale(level)) }),
    description: '普通攻击: 额外追加 X 点伤害',
  },
  {
    id: 'gear_bulwark',
    name: '齿轮壁垒',
    level: 1,
    category: 'transition',
    condition: 'pair',
    effect: (_x, _dice, level) => ({ armor: Math.floor(4 * getScale(level)) }),
    description: '对子: 额外获得 4 点护甲',
  },
  {
    id: 'flaw_strike',
    name: '破绽打击',
    level: 1,
    category: 'transition',
    condition: 'straight',
    effect: (_x, _dice, level) => ({ damage: Math.floor(8 * getScale(level)) }),
    description: '顺子: 额外追加 8 点伤害',
  },
  {
    id: 'fire_overload',
    name: '烈焰超载',
    level: 1,
    category: 'endgame',
    condition: 'element_count',
    conditionValue: 3,
    conditionElement: 'fire',
    effect: (_x, _dice, level) => ({ multiplier: 1 + (1 * getScale(level)) }),
    description: '包含火元素>=3: 最终总伤害 ×2',
  },
];
