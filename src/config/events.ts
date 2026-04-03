/**
 * events.ts - 事件配置表
 * 
 * 定义所有随机事件的纯数据配置。
 * 事件的实际效果由 EventScreen 根据 action 字段解释执行。
 */

export interface EventOptionConfig {
  label: string;
  sub: string;
  color: string;
  /** 动作类型，由 EventScreen 解释执行 */
  action: {
    type: 'startBattle'
      | 'modifyHp'
      | 'modifySouls'
      | 'modifyDiceCount'
      | 'upgradeHandType'
      | 'modifyGlobalRerolls'
      | 'modifyMaxHp'
      | 'modifyFreeRerollsPerTurn'
      | 'modifyMaxPlays'
      | 'randomOutcome'
      | 'grantAugment'
      | 'noop';
    value?: number;
    /** 随机结果配置（仅 randomOutcome 类型使用） */
    outcomes?: {
      weight: number;
      actions: EventOptionConfig['action'][];
      toast?: string;
      toastType?: 'gold' | 'buff' | 'damage' | 'heal';
      log?: string;
    }[];
    toast?: string;
    toastType?: 'gold' | 'buff' | 'damage' | 'heal';
    log?: string;
  };
}

export interface EventConfig {
  id: string;
  title: string;
  desc: string;
  /** 图标ID，由 EventScreen 映射为实际组件 */
  iconId: 'skull' | 'star' | 'flame' | 'heart' | 'shopBag' | 'refresh' | 'question';
  options: EventOptionConfig[];
  /** 是否需要随机牌型参数 */
  needsRandomHandType?: boolean;
}

/**
 * 事件配置池
 * 
 * 注意：当 needsRandomHandType=true 时，
 * 描述和标签中的 {handType} 会被替换为实际随机牌型名。
 */

export const EVENTS_POOL: EventConfig[] = [
  {
    id: 'shadow_creature',
    title: '阴影中的怪物',
    desc: '你在一处阴影中发现了一只落单的怪物，它似乎正在守护着一个散发着微光的宝箱。',
    iconId: 'skull',
    options: [
      {
        label: '发起战斗',
        sub: '击败它以获取战利品（需要消耗资源战斗）',
        color: 'bg-red-600 hover:bg-red-500',
        action: { type: 'startBattle' },
      },
      {
        label: '悄悄绕过',
        sub: '避免战斗，但穿越荆棘受伤 (-8 HP)',
        color: 'bg-zinc-700 hover:bg-zinc-600',
        action: { type: 'modifyHp', value: -8, toast: '穿过荆棘受伤 -8 HP', toastType: 'damage', log: '悄悄绕过了怪物，但受到了 8 点伤害。' },
      },
    ],
  },
  {
    id: 'ancient_altar',
    title: '古老祭坛',
    desc: '你发现了一个被遗忘的祭坛，上面刻着两种不同的符文。你只能选择其中一种力量。',
    iconId: 'star',
    options: [
      {
        label: '贪婪符文',
        sub: '+30 金币，但 -10 HP（献血祭祀）',
        color: 'bg-amber-600 hover:bg-amber-500',
        action: { type: 'randomOutcome', outcomes: [
          { weight: 1.0, actions: [{ type: 'modifySouls', value: 30 }, { type: 'modifyHp', value: -10 }], toast: '获得30金币，损失10HP', toastType: 'gold', log: '在祭坛献血获得了 30 金币，损失 10 HP。' },
        ]},
      },
      {
        label: '力量符文',
        sub: '永久+1初始骰子，但 -20 HP（剧痛刻印）',
        color: 'bg-blue-600 hover:bg-blue-500',
        action: { type: 'randomOutcome', outcomes: [
          { weight: 1.0, actions: [{ type: 'modifyDiceCount', value: 1 }, { type: 'modifyHp', value: -20 }], toast: '+1骰子，-20HP', toastType: 'buff', log: '在祭坛获得了 1 颗骰子，但损失 20 HP。' },
        ]},
      },
    ],
  },
  {
    id: 'void_trade',
    title: '虚空交易',
    desc: '一个虚幻的身影出现在你面前，向你展示了禁忌的知识。但代价是你的生命力。',
    iconId: 'skull',
    needsRandomHandType: true,
    options: [
      {
        label: '强化【{handType}】',
        sub: '提升该牌型的基础威力，代价 -15 HP',
        color: 'bg-purple-600 hover:bg-purple-500',
        action: { type: 'upgradeHandType', value: -15, toast: '禁忌知识的代价 -15 HP', toastType: 'damage', log: '消耗 15 生命，【{handType}】升级了！' },
      },
      {
        label: '拒绝交易',
        sub: '获得 2 次全局重掷（安全但收益小）',
        color: 'bg-zinc-700 hover:bg-zinc-600',
        action: { type: 'modifyGlobalRerolls', value: 2, toast: '+2 全局重掷', toastType: 'buff', log: '拒绝了虚空交易，获得 2 次全局重掷。' },
      },
    ],
  },
  {
    id: 'deadly_trap',
    title: '致命陷阱',
    desc: '你触发了一个隐藏的机关！无数毒箭从墙壁中射出。',
    iconId: 'flame',
    options: [
      {
        label: '硬扛毒箭',
        sub: '-15 HP，但在残骸中找到 25 金币',
        color: 'bg-orange-600 hover:bg-orange-500',
        action: { type: 'randomOutcome', outcomes: [
          { weight: 1.0, actions: [{ type: 'modifyHp', value: -15 }, { type: 'modifySouls', value: 25 }], toast: '-15HP, +25金币', toastType: 'damage', log: '踩中陷阱受伤，但在残骸中找到了 25 金币。' },
        ]},
      },
      {
        label: '舍财保命',
        sub: '-20 金币触发备用机关，完全避开',
        color: 'bg-zinc-700 hover:bg-zinc-600',
        action: { type: 'modifySouls', value: -20, log: '丢弃了 20 金币以避开陷阱。' },
      },
    ],
  },
  {
    id: 'mysterious_merchant',
    title: '神秘旅商',
    desc: '一位戴着面具的旅商从暗处走来，他的背包里似乎有些不寻常的东西。',
    iconId: 'shopBag',
    options: [
      {
        label: '购买生命药剂',
        sub: '-25 金币，回复 35 HP',
        color: 'bg-emerald-600 hover:bg-emerald-500',
        action: { type: 'randomOutcome', outcomes: [
          { weight: 1.0, actions: [{ type: 'modifySouls', value: -25 }, { type: 'modifyHp', value: 35 }], toast: '-25金币, +35HP', toastType: 'heal', log: '购买了生命药剂，回复 35 HP。' },
        ]},
      },
      {
        label: '购买强化药水',
        sub: '-35 金币，永久 +10 最大生命',
        color: 'bg-blue-600 hover:bg-blue-500',
        action: { type: 'modifyMaxHp', value: 10, log: '购买了强化药水，最大生命 +10！' },
      },
      {
        label: '讨价还价',
        sub: '有50%概率免费获得药剂，50%概率被赶走',
        color: 'bg-zinc-700 hover:bg-zinc-600',
        action: { type: 'randomOutcome', outcomes: [
          { weight: 0.5, actions: [{ type: 'modifyHp', value: 25 }], toast: '讨价成功！免费回复25HP', toastType: 'heal', log: '讨价还价成功，免费获得药剂！' },
          { weight: 0.5, actions: [{ type: 'noop' }], toast: '旅商不悦，拒绝交易', toastType: 'damage', log: '旅商被激怒，拒绝了你的交易。' },
        ]},
      },
    ],
  },
  {
    id: 'wheel_of_fate',
    title: '命运之轮',
    desc: '你发现了一个古老的命运之轮，轮盘上刻满了神秘的符号。转动它需要付出代价。',
    iconId: 'refresh',
    options: [
      {
        label: '献血转动（-10 HP）',
        sub: '70%概率+40金币，30%概率+1每回合免费重掷',
        color: 'bg-cyan-600 hover:bg-cyan-500',
        action: { type: 'randomOutcome', outcomes: [
          { weight: 0.7, actions: [{ type: 'modifyHp', value: -10 }, { type: 'modifySouls', value: 40 }], toast: '幸运！-10HP, +40金币', toastType: 'gold', log: '命运之轮转出了 40 金币！' },
          { weight: 0.3, actions: [{ type: 'modifyHp', value: -10 }, { type: 'modifyFreeRerollsPerTurn', value: 1 }], toast: '大吉！-10HP, +1免费重掷/回合', toastType: 'buff', log: '命运之轮赐予了永久免费重掷！' },
        ]},
      },
      {
        label: '观望离开',
        sub: '安全但错过机会',
        color: 'bg-zinc-700 hover:bg-zinc-600',
        action: { type: 'noop', log: '你选择了安全离开。' },
      },
    ],
  },
  {
    id: 'cursed_spring',
    title: '诅咒之泉',
    desc: '一汪散发着诡异紫光的泉水出现在你面前。泉水能恢复伤口，但也会留下诅咒。',
    iconId: 'heart',
    options: [
      {
        label: '饮用泉水',
        sub: '+40 HP，但最大生命永久 -5',
        color: 'bg-emerald-600 hover:bg-emerald-500',
        action: { type: 'randomOutcome', outcomes: [
          { weight: 1.0, actions: [{ type: 'modifyHp', value: 40 }, { type: 'modifyMaxHp', value: -5 }], toast: '+40HP, 最大生命-5', toastType: 'heal', log: '饮用诅咒之泉，恢复40HP但最大生命永久-5。' },
        ]},
      },
      {
        label: '净化泉水',
        sub: '-15 金币净化后安全饮用，+20 HP',
        color: 'bg-blue-600 hover:bg-blue-500',
        action: { type: 'randomOutcome', outcomes: [
          { weight: 1.0, actions: [{ type: 'modifySouls', value: -15 }, { type: 'modifyHp', value: 20 }], toast: '-15金币, +20HP', toastType: 'heal', log: '花费15金币净化泉水，安全回复20HP。' },
        ]},
      },
    ],
  },
  {
    id: 'dice_gambler',
    title: '骰子赌徒',
    desc: '一个神秘的赌徒向你发起挑战：用你的资源赌一把，赢了翻倍，输了全无。',
    iconId: 'question',
    options: [
      {
        label: '赌上 30 金币',
        sub: '50%概率+60金币，50%概率-30金币',
        color: 'bg-amber-600 hover:bg-amber-500',
        action: { type: 'randomOutcome', outcomes: [
          { weight: 0.5, actions: [{ type: 'modifySouls', value: 60 }], toast: '赢了！+60金币', toastType: 'gold', log: '赌赢了！获得60金币！' },
          { weight: 0.5, actions: [{ type: 'modifySouls', value: -30 }], toast: '输了...-30金币', toastType: 'damage', log: '赌输了，损失30金币。' },
        ]},
      },
      {
        label: '赌上生命力',
        sub: '50%概率+1出牌次数，50%概率-20HP',
        color: 'bg-red-600 hover:bg-red-500',
        action: { type: 'randomOutcome', outcomes: [
          { weight: 0.5, actions: [{ type: 'modifyMaxPlays', value: 1 }], toast: '赢了！+1出牌次数', toastType: 'buff', log: '赌赢了！永久+1出牌次数！' },
          { weight: 0.5, actions: [{ type: 'modifyHp', value: -20 }], toast: '输了...-20HP', toastType: 'damage', log: '赌输了，损失20HP。' },
        ]},
      },
      {
        label: '拒绝赌博',
        sub: '安全离开',
        color: 'bg-zinc-700 hover:bg-zinc-600',
        action: { type: 'noop', log: '你拒绝了赌徒的挑战。' },
      },
    ],
  },
];