import { Augment } from '../types/game';
import { AUGMENT_SCALING } from '../config';

const getScale = (level: number) => 1 + (level - 1) * AUGMENT_SCALING.scaleFactor;

export { getScale };

export const AUGMENTS_POOL: Augment[] = [
  {
    id: 'twin_stars',
    name: '双子星',
    level: 1,
    condition: 'pair',
    effect: (_x, _dice, level) => ({ multiplier: 1 + (0.5 * getScale(level)) }),
    description: '对子: 最终基础伤害 × 1.5'
  },
  {
    id: 'steam_piston',
    name: '蒸汽活塞',
    level: 1,
    condition: 'pair',
    effect: (_x, _dice, level) => ({ armor: Math.floor(8 * getScale(level)) }),
    description: '对子: 额外获得 8 点护甲'
  },
  {
    id: 'twin_shot',
    name: '连对火炮',
    level: 1,
    condition: 'two_pair',
    effect: (x, _dice, level) => ({ damage: Math.floor(x * getScale(level)) }),
    description: '连对: 额外追加 X 点伤害'
  },
  {
    id: 'flame_thirst',
    name: '烈焰嗜血',
    level: 1,
    condition: 'element_count',
    conditionValue: 1,
    conditionElement: 'fire',
    effect: (_, dice, level) => ({ heal: Math.floor(dice.filter(d => d.element === 'fire').length * 2 * getScale(level)) }),
    description: '包含火元素: 选中的火骰子每颗回复 2 HP'
  },
  {
    id: 'precise_deconstruction',
    name: '精密解构',
    level: 1,
    condition: 'straight',
    effect: (x, _dice, level) => ({ pierce: Math.floor((x + 10) * getScale(level)) }),
    description: '顺子: 额外造成 X + 10 点穿透伤害'
  },
  {
    id: 'heavy_steam_hammer',
    name: '重型蒸汽锤',
    level: 1,
    condition: 'n_of_a_kind',
    effect: (x, _dice, level) => ({ damage: Math.floor(x * 2 * getScale(level)) }),
    description: '多条: 造成 X × 2 的额外伤害'
  },
  {
    id: 'full_house_blast',
    name: '葫芦爆裂',
    level: 1,
    condition: 'full_house',
    effect: (x, _dice, level) => ({ damage: Math.floor(x * 2.5 * getScale(level)), armor: Math.floor(10 * getScale(level)) }),
    description: '葫芦: 造成 X × 2.5 伤害并获得 10 护甲'
  },
  {
    id: 'element_shield',
    name: '元素力场',
    level: 1,
    condition: 'same_element',
    effect: (x, _dice, level) => ({ armor: Math.floor(x * 1.5 * getScale(level)) }),
    description: '同元素: 额外获得 X × 1.5 点护甲'
  },
  {
    id: 'element_overload',
    name: '元素过载',
    level: 1,
    condition: 'same_element',
    effect: (_x, _dice, level) => ({ multiplier: 1 + (1.2 * getScale(level)) }),
    description: '同元素: 最终伤害 × 2.2'
  },
  {
    id: 'venomous_dagger',
    name: '剧毒匕首',
    level: 1,
    condition: 'same_element',
    effect: (_x, _dice, level) => ({ statusEffects: [{ type: 'poison', value: Math.floor(3 * getScale(level)) }] }),
    description: '同元素: 额外附加 3 层中毒'
  },
  {
    id: 'ignition_core',
    name: '点火核心',
    level: 1,
    condition: 'n_of_a_kind',
    effect: (_x, _dice, level) => ({ statusEffects: [{ type: 'burn', value: Math.floor(4 * getScale(level)) }] }),
    description: '多条: 额外附加 4 层灼烧'
  },
  {
    id: 'pressure_point',
    name: '压力点',
    level: 1,
    condition: 'straight',
    effect: (_x, _dice, level) => ({ statusEffects: [{ type: 'vulnerable', value: Math.floor(1 * getScale(level)) }] }),
    description: '顺子: 额外附加 1 层易伤'
  },
  {
    id: 'soul_harvest',
    name: '灵魂收割',
    level: 1,
    condition: 'n_of_a_kind',
    effect: (x, _dice, level) => ({ heal: Math.floor((x * 0.5) * getScale(level)) }),
    description: '多条: 回复 X × 0.5 生命值'
  },
  {
    id: 'void_echo',
    name: '虚空回响',
    level: 1,
    condition: 'two_pair',
    effect: (_x, _dice, level) => ({ multiplier: 1 + (0.8 * getScale(level)) }),
    description: '连对: 最终基础伤害 × 1.8'
  },
  {
    id: 'frost_barrier',
    name: '霜冻屏障',
    level: 1,
    condition: 'full_house',
    effect: (_x, _dice, level) => ({ armor: Math.floor(15 * getScale(level)), statusEffects: [{ type: 'weak', value: Math.floor(2 * getScale(level)) }] }),
    description: '葫芦: 获得 15 护甲并使敌人虚弱 2 层'
  },
  {
    id: 'chain_lightning',
    name: '连锁闪电',
    level: 1,
    condition: 'straight',
    effect: (x, _dice, level) => ({ damage: Math.floor(x * 1.5 * getScale(level)), statusEffects: [{ type: 'burn', value: Math.floor(2 * getScale(level)) }] }),
    description: '顺子: 额外造成 X × 1.5 伤害并附加 2 层灼烧'
  },
  {
    id: 'blood_pact',
    name: '血之契约',
    level: 1,
    condition: 'high_card',
    effect: (x, _dice, level) => ({ damage: Math.floor(x * 2 * getScale(level)), heal: -Math.floor(3 * getScale(level)) }),
    description: '普通攻击: 额外追加 X × 2 伤害，但损失 3 HP'
  },
  {
    id: 'holy_touch',
    name: '圣光之手',
    level: 1,
    condition: 'same_element',
    conditionElement: 'holy',
    effect: (_x, dice, level) => {
      const holyCount = dice.filter(d => d.element === 'holy').length;
      return { heal: Math.floor(holyCount * 3 * getScale(level)) };
    },
    description: '同元素(圣): 每颗圣光骰子额外回复 3 HP'
  },
  {
    id: 'fortification',
    name: '铜墙铁壁',
    level: 1,
    condition: 'pair',
    effect: (_x, _dice, level) => ({ armor: Math.floor(12 * getScale(level)), heal: Math.floor(3 * getScale(level)) }),
    description: '对子: 获得 12 护甲并回复 3 HP'
  }
];

export const INITIAL_AUGMENTS: Augment[] = [
  {
    id: 'precise_stab',
    name: '精准刺击',
    level: 1,
    condition: 'high_card',
    effect: (x, _dice, level) => ({ damage: Math.floor(x * getScale(level)) }),
    description: '普通攻击: 额外追加 X 点伤害'
  },
  {
    id: 'gear_bulwark',
    name: '齿轮壁垒',
    level: 1,
    condition: 'pair',
    effect: (_x, _dice, level) => ({ armor: Math.floor(4 * getScale(level)) }),
    description: '对子: 额外获得 4 点护甲'
  },
  {
    id: 'flaw_strike',
    name: '破绽打击',
    level: 1,
    condition: 'straight',
    effect: (_x, _dice, level) => ({ damage: Math.floor(8 * getScale(level)) }),
    description: '顺子: 额外追加 8 点伤害'
  },
  {
    id: 'fire_overload',
    name: '烈焰超载',
    level: 1,
    condition: 'element_count',
    conditionValue: 3,
    conditionElement: 'fire',
    effect: (_x, _dice, level) => ({ multiplier: 1 + (1 * getScale(level)) }),
    description: '包含火元素>=3: 最终总伤害 × 2'
  }
];
