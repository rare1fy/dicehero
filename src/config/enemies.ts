/**
 * enemies.ts - 敌人配置表
 *
 * 纯数据配置，定义敌人的基础属性和行为模式。
 * 行为模式用纯数据描述，由 data/enemies.ts 解释执行。
 */

// ============================================================
// 行为模式数据结构
// ============================================================

export type IntentType = '攻击' | '防御' | '技能';

export interface PatternAction {
  type: IntentType;
  /** 伤害/护甲的基础值（会乘以 dmgScale） */
  baseValue: number;
  /** 技能描述（仅技能类型使用） */
  description?: string;
  /** 是否受 dmgScale 影响（默认 true，技能类型层数不缩放） */
  scalable?: boolean;
  /** 塞入诅咒骰子类型 */
  curseDice?: 'cursed' | 'cracked';
  /** 塞入诅咒骰子数量 */
  curseDiceCount?: number;
}

export interface PhaseConfig {
  /** 触发条件：hpRatio < threshold 时进入该阶段 */
  hpThreshold?: number;
  /** 循环动作序列，按 turn % length 索引 */
  actions: PatternAction[];
}

/** 敌人台词配置 */
export interface EnemyQuotes {
  /** 出场台词（随机取一条） */
  enter?: string[];
  /** 死亡台词（随机取一条） */
  death?: string[];
  /** 攻击时台词（30% 概率触发，随机取一条） */
  attack?: string[];
  /** 受重击台词（随机取一条） */
  hurt?: string[];
  /** 低血量台词（首次触发一次） */
  lowHp?: string[];
  /** 防御时台词 */
  defend?: string[];
  /** 释放技能时台词（法师/牧师） */
  skill?: string[];
  /** 治疗时台词（牧师） */
  heal?: string[];
}

export interface EnemyConfig {
  id: string;
  name: string;
  emoji: string;
  /** 基础HP（未缩放） */
  baseHp: number;
  /** 基础伤害（未缩放，用于初始 intent） */
  baseDmg: number;
  /** 行为阶段，按优先级从高到低检查 */
  phases: PhaseConfig[];
  /** 敌人类型 */
  category: 'normal' | 'elite' | 'boss';
  /** 战斗类型 */
  combatType: 'warrior' | 'guardian' | 'ranger' | 'caster' | 'priest';
  /** 掉落配置 */
  drops: {
    gold: number;
    augment: boolean;
    rerollReward?: number;
  };
  /** 台词配置 */
  quotes?: EnemyQuotes;
}

// ============================================================
// 普通敌人
// ============================================================
export const NORMAL_ENEMIES: EnemyConfig[] = [
  {
    id: 'void_wanderer',
    name: '虚空巡游者',
    emoji: '',
    baseHp: 20, baseDmg: 3,
    category: 'normal',
    combatType: 'caster',
    drops: { gold: 20, augment: false },
    phases: [
      {
        actions: [
          { type: '技能', baseValue: 2, description: '剧毒', scalable: false },
          { type: '攻击', baseValue: 4 },
          { type: '攻击', baseValue: 4 },
        ],
      },
    ],
    quotes: {
      enter: ['虚空……将吞噬一切……', '你的骰子……也会腐烂的……'],
      death: ['……终归于虚无……', '我……只是……先行一步……'],
      attack: ['腐化！', '归于虚空！', '让毒液渗入你的骨髓……'],
      hurt: ['嘶……虚空之力……', '这点伤……算什么……'],
      lowHp: ['不……我还没……腐化你……'],
    },
  },
  {
    id: 'rotten_beetle',
    name: '腐化甲虫',
    emoji: '',
    baseHp: 38, baseDmg: 3,
    category: 'normal',
    combatType: 'guardian',
    drops: { gold: 20, augment: false },
    phases: [
      {
        actions: [
          { type: '防御', baseValue: 6 },
          { type: '攻击', baseValue: 3 },
        ],
      },
    ],
    quotes: {
      enter: ['咔嚓咔嚓……', '甲壳无懈可击！'],
      death: ['我的……壳……裂了……', '咔……嚓……'],
      attack: ['咬碎你！', '咔嚓！', '臭虫的愤怒！'],
      hurt: ['壳……凹进去了……', '咔！痛！'],
      lowHp: ['壳……要碎了……绝对不行！'],
    },
  },
  {
    id: 'scarlet_sprite',
    name: '猩红异灵',
    emoji: '',
    baseHp: 18, baseDmg: 4,
    category: 'normal',
    combatType: 'caster',
    drops: { gold: 20, augment: false },
    phases: [
      {
        actions: [
          { type: '技能', baseValue: 1, description: '易伤', scalable: false },
          { type: '攻击', baseValue: 5 },
          { type: '攻击', baseValue: 5 },
        ],
      },
    ],
    quotes: {
      enter: ['嘻嘻嘻～找到你了！', '红色的血……多漂亮啊～'],
      death: ['嘻……不好玩了……', '红色……消散了……'],
      attack: ['嘻嘻！', '这里！那里！', '你的弱点在哪～'],
      hurt: ['哇！痛痛！', '嘻……你敢打我？'],
      lowHp: ['不行了……嘻嘻……还想再玩的……'],
    },
  },
  {
    id: 'forgotten_shadow',
    name: '遗忘之影',
    emoji: '',
    baseHp: 32, baseDmg: 9,
    category: 'normal',
    combatType: 'warrior',
    drops: { gold: 20, augment: false },
    phases: [
      {
        actions: [
          { type: '攻击', baseValue: 7 },
          { type: '技能', baseValue: 1, description: '虚弱', scalable: false },
        ],
      },
    ],
    quotes: {
      enter: ['……', '被遗忘的……才是最危险的……'],
      death: ['……终于……可以……消失了……', '……（沉默）……'],
      attack: ['……斩！', '忘记……痛苦吧……'],
      hurt: ['……（无声）', '……痛……'],
      lowHp: ['……我……还记得……你……'],
    },
  },
  {
    id: 'dark_spider_swarm',
    name: '暗棘蛛群',
    emoji: '',
    baseHp: 18, baseDmg: 3,
    category: 'normal',
    combatType: 'ranger',
    drops: { gold: 20, augment: false },
    phases: [
      {
        actions: [
          { type: '技能', baseValue: 2, description: '灼烧', scalable: false },
          { type: '攻击', baseValue: 3 },
          { type: '攻击', baseValue: 3 },
          { type: '技能', baseValue: 1, description: '虚弱', scalable: false },
        ],
      },
    ],
    quotes: {
      enter: ['吱吱吱吱吱！', '（密集的爬行声）'],
      death: ['吱……吱……', '（哗啦一声散开）'],
      attack: ['吱！吱吱！', '咬死你！咬死你！', '一口！两口！三口！'],
      hurt: ['吱——！', '散！散！'],
      lowHp: ['吱吱……还有我们……'],
    },
  },
  {
    id: 'cracked_watcher',
    name: '裂隙守望者',
    emoji: '',
    baseHp: 38, baseDmg: 5,
    category: 'normal',
    combatType: 'guardian',
    drops: { gold: 20, augment: false },
    phases: [
      {
        actions: [
          { type: '攻击', baseValue: 4 },
          { type: '防御', baseValue: 8 },
          { type: '攻击', baseValue: 8, description: '裂隙冲击' },
        ],
      },
    ],
    quotes: {
      enter: ['我……一直……在这里……', '裂隙之眼，看穿一切。'],
      death: ['裂隙……闭合了……', '终于……不用再守了……'],
      attack: ['裂隙之力！', '看穿你！', '冲击！'],
      hurt: ['裂缝……更深了……', '嘎！'],
      lowHp: ['裂缝……要彻底崩开了……'],
    },
  },
  {
    id: 'soul_jellyfish',
    name: '噬魂水母',
    emoji: '',
    baseHp: 16, baseDmg: 2,
    category: 'normal',
    combatType: 'priest',
    drops: { gold: 20, augment: false },
    phases: [
      {
        actions: [
          { type: '技能', baseValue: 2, description: '剧毒', scalable: false },
          { type: '技能', baseValue: 1, description: '易伤', scalable: false },
          { type: '攻击', baseValue: 5 },
        ],
      },
    ],
    quotes: {
      enter: ['飘……飘……', '灵魂……好香……'],
      death: ['灵魂……溢出来了……', '飘……走了……'],
      attack: ['吸！', '你的灵魂……属于我……', '飘过来～'],
      hurt: ['啊！触手！', '别……别打触手……'],
      lowHp: ['灵魂……快撑不住了……'],
    },
  },
  {
    id: 'iron_puppet',
    name: '铁链傀儡',
    emoji: '',
    baseHp: 34, baseDmg: 10,
    category: 'normal',
    combatType: 'warrior',
    drops: { gold: 20, augment: false },
    phases: [
      {
        actions: [
          { type: '防御', baseValue: 12 },
          { type: '攻击', baseValue: 7 },
          { type: '攻击', baseValue: 7 },
        ],
      },
    ],
    quotes: {
      enter: ['哐当——', '（铁链拖地的声音）'],
      death: ['哐……当……', '（倒地，铁链散落）'],
      attack: ['哐！', '铁拳！', '链条——扫！'],
      hurt: ['哐！（凹陷）', '铁甲……凹了……'],
      lowHp: ['哐哐哐……还能……打……'],
    },
  },
];

// ============================================================
// 精英敌人
// ============================================================
export const ELITE_ENEMIES: EnemyConfig[] = [
  {
    id: 'chaos_aggregate',
    name: '混沌聚合体',
    emoji: '',
    baseHp: 90, baseDmg: 11,
    category: 'elite',
    combatType: 'caster',
    drops: { gold: 50, augment: true, rerollReward: 2 },
    phases: [
      {
        hpThreshold: 0.4,
        actions: [
          { type: '攻击', baseValue: 16, description: '混沌爆发' },
          { type: '技能', baseValue: 1, description: '诅咒注入', scalable: false, curseDice: 'cursed', curseDiceCount: 1 },
        ],
      },
      {
        actions: [
          { type: '攻击', baseValue: 12 },
          { type: '攻击', baseValue: 8 },
          { type: '技能', baseValue: 2, description: '力量', scalable: false },
        ],
      },
    ],
    quotes: {
      enter: ['我……是……所有……也是……虚无……', '混沌……从未停止……'],
      death: ['混沌……不会……消亡……', '我……只是……分裂了……'],
      attack: ['爆裂！', '混沌之触！', '吞噬你的骰子！'],
      hurt: ['混沌……重组……', '痛？混沌不懂痛……'],
      lowHp: ['混沌……失控了……这才……有趣……'],
    },
  },
  {
    id: 'void_warden',
    name: '虚空公英雄长',
    emoji: '',
    baseHp: 110, baseDmg: 6,
    category: 'elite',
    combatType: 'guardian',
    drops: { gold: 50, augment: true, rerollReward: 2 },
    phases: [
      {
        actions: [
          { type: '攻击', baseValue: 6 },
          { type: '防御', baseValue: 18 },
          { type: '攻击', baseValue: 12, description: '处决' },
          { type: '技能', baseValue: 2, description: '易伤', scalable: false },
          { type: '技能', baseValue: 1, description: '碎裂诅咒', scalable: false, curseDice: 'cracked', curseDiceCount: 1 },
        ],
      },
    ],
    quotes: {
      enter: ['虚空之门，由我守护。无关者，退！', '敢闯禁地？你的骰子，我要收缴。'],
      death: ['门……破了……', '守卫……失职……'],
      attack: ['处决！', '虚空之刃！', '越界者，死！'],
      hurt: ['护甲……被破了？', '不可能……'],
      lowHp: ['门……我守不住了……但你别想……轻易过去……'],
    },
  },
  {
    id: 'abyss_prophet',
    name: '深渊预言者',
    emoji: '',
    baseHp: 80, baseDmg: 10,
    category: 'elite',
    combatType: 'caster',
    drops: { gold: 50, augment: true, rerollReward: 2 },
    phases: [
      {
        hpThreshold: 0.3,
        actions: [
          { type: '技能', baseValue: 3, description: '剧毒', scalable: false },
          { type: '技能', baseValue: 3, description: '灼烧', scalable: false },
        ],
      },
      {
        actions: [
          { type: '攻击', baseValue: 7 },
          { type: '技能', baseValue: 2, description: '虚弱', scalable: false },
          { type: '攻击', baseValue: 9 },
          { type: '技能', baseValue: 2, description: '剧毒', scalable: false },
          { type: '防御', baseValue: 14 },
        ],
      },
    ],
    quotes: {
      enter: ['我已预见……你的终局。', '深渊告诉我……你会在第几回合倒下。'],
      death: ['预言……出错了？', '不……深渊……骗了我……'],
      attack: ['命中注定！', '深渊之眼已锁定你！', '这一击……早已写好。'],
      hurt: ['这……不在预言中……', '未来……改变了？'],
      lowHp: ['我看到了……我的死亡……但我……不信命！'],
    },
  },
  {
    id: 'eternal_clocksmith',
    name: '永恒钟表匠',
    emoji: '',
    baseHp: 85, baseDmg: 12,
    category: 'elite',
    combatType: 'warrior',
    drops: { gold: 50, augment: true, rerollReward: 2 },
    phases: [
      {
        actions: [
          { type: '攻击', baseValue: 22, description: '时间崩塌' },
          { type: '技能', baseValue: 2, description: '力量', scalable: false },
          { type: '防御', baseValue: 10 },
          { type: '攻击', baseValue: 10 },
        ],
      },
    ],
    quotes: {
      enter: ['滴答……滴答……你的时间，不多了。', '每一个齿轮，都是为了终结你而转动。'],
      death: ['时……钟……停了……', '滴答……滴……'],
      attack: ['时间崩塌！', '齿轮碾压！', '滴答——时间到！'],
      hurt: ['发条……松了……', '嘎吱！精密仪器！别乱打！'],
      lowHp: ['时钟……快停了……但最后一击……我留着……'],
    },
  },
];

// ============================================================
// Boss
// ============================================================
export const BOSS_ENEMIES: EnemyConfig[] = [
  {
    id: 'dream_weaver',
    name: '虚空织梦者',
    emoji: '',
    baseHp: 200, baseDmg: 10,
    category: 'boss',
    combatType: 'caster',
    drops: { gold: 60, augment: true },
    phases: [
      {
        hpThreshold: 0.4,
        actions: [
          { type: '攻击', baseValue: 16, description: '织梦终焰' },
          { type: '技能', baseValue: 2, description: '灼烧', scalable: false },
          { type: '攻击', baseValue: 14, description: '梦魇撕裂' },
          { type: '技能', baseValue: 1, description: '噩梦编织', scalable: false, curseDice: 'cursed', curseDiceCount: 1 },
          { type: '攻击', baseValue: 12 },
          { type: '防御', baseValue: 15 },
        ],
      },
      {
        actions: [
          { type: '攻击', baseValue: 8 },
          { type: '攻击', baseValue: 8 },
          { type: '技能', baseValue: 2, description: '虚弱', scalable: false },
          { type: '技能', baseValue: 1, description: '易伤', scalable: false },
          { type: '防御', baseValue: 15 },
        ],
      },
    ],
    quotes: {
      enter: [
        '欢迎……来到我的梦境。你……再也醒不来了。',
        '骰子？哈……在梦里，数字没有意义。',
      ],
      death: [
        '梦……碎了……但噩梦……永不消散……',
        '你……打破了……我的织梦……这是……第一次……',
      ],
      attack: ['入梦！', '噩梦缠绕！', '梦境撕裂你的意志！', '你的骰子……都是幻象……'],
      hurt: ['梦境……动摇了……', '不可能……这是我的领域……', '痛？在梦里……也会痛……'],
      lowHp: [
        '梦……快碎了……但我……会把你一起拖入深渊！',
        '织梦者……不会就此消亡……终焰，燃起！',
      ],
    },
  },
  {
    id: 'eternal_lord',
    name: '永恒主宰',
    emoji: '',
    baseHp: 380, baseDmg: 15,
    category: 'boss',
    combatType: 'caster',
    drops: { gold: 0, augment: false },
    phases: [
      {
        hpThreshold: 0.5,
        actions: [
          { type: '攻击', baseValue: 28, description: '终极之光' },
          { type: '攻击', baseValue: 22 },
          { type: '技能', baseValue: 3, description: '剧毒', scalable: false },
          { type: '防御', baseValue: 30 },
        ],
      },
      {
        actions: [
          { type: '技能', baseValue: 4, description: '灼烧', scalable: false },
          { type: '攻击', baseValue: 12 },
          { type: '技能', baseValue: 2, description: '虚弱', scalable: false },
          { type: '攻击', baseValue: 20 },
        ],
      },
    ],
    quotes: {
      enter: [
        '永恒……在此。渺小的骰子掷者，你的终点……就是今天。',
        '多少英雄……都折在了这里。你……不过是下一个。',
      ],
      death: [
        '不……不可能……永恒……怎么会……',
        '你……你究竟……是什么？……永恒……也有尽头……',
      ],
      attack: ['终极之光！', '永恒之力，碾碎你！', '渺小者，跪下！', '这就是……永恒的重量！'],
      hurt: ['哼……有点意思。', '永恒之躯……竟被撼动……', '这点伤……不值一提。'],
      lowHp: [
        '永恒……动摇了……但我绝不会……就此终结！终极之光——爆发！',
        '有趣……你是第一个……让我动用全力的……受死吧！',
      ],
    },
  },
];

/** 可升级牌型池（用于事件中随机选择） */
export const UPGRADEABLE_HAND_TYPES = ['对子', '连值', '顺子', '同元素', '葡萄'];
