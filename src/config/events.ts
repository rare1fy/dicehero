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
        sub: '击败它以获取宝箱中的战利品',
        color: 'bg-red-600 hover:bg-red-500',
        action: { type: 'startBattle' },
      },
      {
        label: '悄悄绕过',
        sub: '避免战斗，但可能会在穿过荆棘时受伤 (-5 HP)',
        color: 'bg-zinc-700 hover:bg-zinc-600',
        action: { type: 'modifyHp', value: -5, toast: '穿过荆棘受伤 -5 HP', toastType: 'damage', log: '悄悄绕过了怪物，但受到了 5 点伤害。' },
      },
    ],
  },
  {
    id: 'ancient_altar',
    title: '古老祭坛',
    desc: '你发现了一个被遗忘的祭坛，上面刻着两种不同的符文。你可以选择其中一种力量。',
    iconId: 'star',
    options: [
      {
        label: '贪婪符文',
        sub: '立即获得 40 枚金币',
        color: 'bg-amber-600 hover:bg-amber-500',
        action: { type: 'modifySouls', value: 40, log: '在祭坛获得了 40 金币。' },
      },
      {
        label: '力量符文',
        sub: '永久增加 1 颗初始骰子',
        color: 'bg-blue-600 hover:bg-blue-500',
        action: { type: 'modifyDiceCount', value: 1, log: '在祭坛获得了 1 颗骰子。' },
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
        sub: '提升该牌型的基础威力 (-15 HP)',
        color: 'bg-purple-600 hover:bg-purple-500',
        action: { type: 'upgradeHandType', value: -15, toast: '禁忌知识的代价 -15 HP', toastType: 'damage', log: '消耗 15 生命，【{handType}】升级了！' },
      },
      {
        label: '洞察未来',
        sub: '获得 3 次全局重骰机会',
        color: 'bg-zinc-700 hover:bg-zinc-600',
        action: { type: 'modifyGlobalRerolls', value: 3, toast: '+3 全局重骰', toastType: 'buff', log: '获得了 3 次全局重骰机会。' },
      },
    ],
  },
  {
    id: 'deadly_trap',
    title: '致命陷阱',
    desc: '你触发了一个隐藏的机关！无数箭矢从墙壁中射出。',
    iconId: 'flame',
    options: [
      {
        label: '全力躲避',
        sub: '虽然避开了被害，但仍受了重伤 (-20 HP)',
        color: 'bg-orange-600 hover:bg-orange-500',
        action: { type: 'modifyHp', value: -20, toast: '陷阱触发！-20 HP', toastType: 'damage', log: '踩中陷阱，扣除 20 生命。' },
      },
      {
        label: '舍财保命',
        sub: '丢弃一些金币来触发备用机关 (-30 金币)',
        color: 'bg-zinc-700 hover:bg-zinc-600',
        action: { type: 'modifySouls', value: -30, log: '丢弃了 30 金币以避开陷阱。' },
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
        sub: '花费 25 金币回复 30 HP',
        color: 'bg-emerald-600 hover:bg-emerald-500',
        action: { type: 'modifySouls', value: -25,
          toast: '购买生命药剂',
          log: '购买了生命药剂，回复 30 HP。',
        },
      },
      {
        label: '购买强化药水',
        sub: '花费 35 金币，永久提升最大生命 10 点',
        color: 'bg-blue-600 hover:bg-blue-500',
        action: { type: 'modifyMaxHp', value: 10,
          log: '购买了强化药水，最大生命 +10！',
        },
      },
    ],
  },
  {
    id: 'wheel_of_fate',
    title: '命运之轮',
    desc: '你发现了一个古老的命运之轮，轮盘上刻满了神秘的符号。你可以转动它，但结果难以预料。',
    iconId: 'refresh',
    options: [
      {
        label: '转动命运之轮',
        sub: '随机获得：+50 金币 / +2 重骰 / -15 HP',
        color: 'bg-cyan-600 hover:bg-cyan-500',
        action: {
          type: 'randomOutcome',
          outcomes: [
            { weight: 0.4, actions: [{ type: 'modifySouls', value: 50 }], toast: '🎉 幸运！+50 金币', toastType: 'gold', log: '🎉 命运之轮转出了 50 金币！' },
            { weight: 0.3, actions: [{ type: 'modifyGlobalRerolls', value: 2 }], toast: '🎉 幸运！+2 全局重骰', toastType: 'buff', log: '🎉 命运之轮赐予了 2 次全局重骰！' },
            { weight: 0.3, actions: [{ type: 'modifyHp', value: -15 }], toast: '🎉 厄运降临！-15 HP', toastType: 'damage', log: '🎉 命运之轮带来了厄运，损失 15 HP！' },
          ],
        },
      },
      {
        label: '谨慎离开',
        sub: '不冒险，安全通过',
        color: 'bg-zinc-700 hover:bg-zinc-600',
        action: { type: 'noop', log: '你明智地选择了离开命运之轮。' },
      },
    ],
  },
  {
    id: 'shadow_forge',
    title: '暗影锻炉',
    desc: '一座被遗弃的锻炉仍在燃烧着幽蓝色的火焰。你可以利用它来强化自己的能力。',
    iconId: 'flame',
    options: [
      {
        label: '锻造护甲',
        sub: '消耗 20 HP，本场游戏每回合额外获得 1 次免费重骰',
        color: 'bg-blue-600 hover:bg-blue-500',
        action: { type: 'modifyFreeRerollsPerTurn', value: 1,
          toast: '暗影锻炉烤伤 -20 HP，每回合免费重骰 +1', toastType: 'damage',
          log: '在暗影锻炉中锻造了护甲，每回合免费重骰 +1！',
        },
      },
      {
        label: '混炼武器',
        sub: '消耗 20 HP，永久增加 1 次出牌机会',
        color: 'bg-orange-600 hover:bg-orange-500',
        action: { type: 'modifyMaxPlays', value: 1,
          toast: '暗影锻炉烤伤 -20 HP，出牌次数 +1', toastType: 'damage',
          log: '在暗影锻炉中混炼了武器，出牌次数 +1！',
        },
      },
    ],
  },
  {
    id: 'lost_spirit',
    title: '迷途灵魂',
    desc: '一个迷途的灵魂向你求助，它愿意用自己的力量作为报答。但你也可以选择吞噬它。',
    iconId: 'heart',
    needsRandomHandType: true,
    options: [
      {
        label: '帮助灵魂',
        sub: '回复 20 HP，获得 20 金币',
        color: 'bg-pink-600 hover:bg-pink-500',
        action: { type: 'modifyHp', value: 20,
          log: '帮助了迷途灵魂，获得了它的祝福。',
        },
      },
      {
        label: '吞噬灵魂',
        sub: '强化【{handType}】但损失 10 HP',
        color: 'bg-red-600 hover:bg-red-500',
        action: { type: 'upgradeHandType', value: -10,
          toast: '吞噬灵魂 -10 HP，【{handType}】升级！', toastType: 'damage',
          log: '吞噬了灵魂，【{handType}】升级了！',
        },
      },
    ],
  },
];
