/**
 * enemies.ts - 敌人配置表
 *
 * 5个章节各自的敌人池，西幻魔兽世界风格
 * 章1: 幽暗森林 — 亡灵/蜘蛛/狼人/树精
 * 章2: 冰封山脉 — 冰巨人/雪狼/冰元素/霜巫
 * 章3: 熔岩深渊 — 火元素/熔岩犬/黑铁矮人/地狱火
 * 章4: 暗影要塞 — 暗影刺客/恶魔卫兵/邪能术士/堕落天使
 * 章5: 永恒之巅 — 光铸卫士/时光龙/虚空行者/泰坦造物
 */

// ============================================================
// 行为模式数据结构
// ============================================================

export type IntentType = '攻击' | '防御' | '技能';

export interface PatternAction {
  type: IntentType;
  baseValue: number;
  description?: string;
  scalable?: boolean;
  curseDice?: 'cursed' | 'cracked';
  curseDiceCount?: number;
}

export interface PhaseConfig {
  hpThreshold?: number;
  actions: PatternAction[];
}

export interface EnemyQuotes {
  enter?: string[];
  death?: string[];
  attack?: string[];
  hurt?: string[];
  lowHp?: string[];
  defend?: string[];
  skill?: string[];
  heal?: string[];
}

export interface EnemyConfig {
  id: string;
  name: string;
  emoji: string;
  baseHp: number;
  baseDmg: number;
  phases: PhaseConfig[];
  category: 'normal' | 'elite' | 'boss';
  combatType: 'warrior' | 'guardian' | 'ranger' | 'caster' | 'priest';
  chapter?: number; // 1-5, undefined = 通用
  drops: { gold: number; augment: boolean; rerollReward?: number; };
  quotes?: EnemyQuotes;
}

// ============================================================
// 章1: 幽暗森林 — 亡灵/野兽/腐化生物
// ============================================================
const ch1_normals: EnemyConfig[] = [
  {
    id: 'forest_ghoul', name: '食尸鬼', emoji: '', chapter: 1,
    baseHp: 28, baseDmg: 7, category: 'normal', combatType: 'warrior',
    drops: { gold: 20, augment: false },
    phases: [{ actions: [
      { type: '攻击', baseValue: 7 },
      { type: '攻击', baseValue: 9, description: '撕咬' },
      { type: '技能', baseValue: 1, description: '虚弱', scalable: false },
    ]}],
    quotes: {
      enter: ['嘎嘎……新鲜的肉……', '从坟墓里爬出来了……'],
      death: ['骨头……散了……', '回到……土里……'],
      attack: ['撕！', '咬碎你！', '嘎嘎嘎！'],
      hurt: ['嘎！', '腐肉……掉了……'],
      lowHp: ['不……还没吃饱……'],
    },
  },
  {
    id: 'forest_spider', name: '剧毒蛛母', emoji: '', chapter: 1,
    baseHp: 18, baseDmg: 3, category: 'normal', combatType: 'ranger',
    drops: { gold: 20, augment: false },
    phases: [{ actions: [
      { type: '技能', baseValue: 2, description: '剧毒', scalable: false },
      { type: '攻击', baseValue: 4 },
      { type: '攻击', baseValue: 4 },
    ]}],
    quotes: {
      enter: ['嘶嘶……陷阱已经布好了……', '（密集的爬行声）'],
      death: ['嘶……蛛卵……会替我……', '（扭曲倒地）'],
      attack: ['毒牙！', '吐丝！', '缠住你！'],
      hurt: ['嘶！', '我的……腿！'],
      lowHp: ['蛛巢……不会忘记你……'],
    },
  },
  {
    id: 'forest_treant', name: '腐化树人', emoji: '', chapter: 1,
    baseHp: 42, baseDmg: 4, category: 'normal', combatType: 'guardian',
    drops: { gold: 20, augment: false },
    phases: [{ actions: [
      { type: '防御', baseValue: 8 },
      { type: '攻击', baseValue: 5 },
      { type: '防御', baseValue: 6 },
      { type: '攻击', baseValue: 7, description: '根须缠绕' },
    ]}],
    quotes: {
      enter: ['这片……森林……不欢迎你……', '（树根从地面涌出）'],
      death: ['森林……会记住……', '倒下了……但种子……已经播下……'],
      attack: ['根须！', '大地之力！'],
      hurt: ['树皮……裂了……', '不过是……划痕……'],
      lowHp: ['我的根……断了……但森林……永存……'],
    },
  },
  {
    id: 'forest_banshee', name: '哀嚎女妖', emoji: '', chapter: 1,
    baseHp: 16, baseDmg: 3, category: 'normal', combatType: 'caster',
    drops: { gold: 20, augment: false },
    phases: [{ actions: [
      { type: '技能', baseValue: 1, description: '易伤', scalable: false },
      { type: '攻击', baseValue: 5 },
      { type: '技能', baseValue: 1, description: '虚弱', scalable: false },
    ]}],
    quotes: {
      enter: ['啊啊啊——！', '听到了吗……死亡的歌声……'],
      death: ['终于……安息了……', '（哀鸣渐弱）'],
      attack: ['尖叫！', '死亡之歌！', '颤抖吧！'],
      hurt: ['（刺耳尖啸）', '痛苦……是我的养分……'],
      lowHp: ['最后……一曲……送你上路！'],
    },
  },
  {
    id: 'forest_wolf_priest', name: '月光狼灵', emoji: '', chapter: 1,
    baseHp: 20, baseDmg: 2, category: 'normal', combatType: 'priest',
    drops: { gold: 20, augment: false },
    phases: [{ actions: [
      { type: '技能', baseValue: 2, description: '剧毒', scalable: false },
      { type: '技能', baseValue: 1, description: '易伤', scalable: false },
      { type: '攻击', baseValue: 4 },
    ]}],
    quotes: {
      enter: ['呜——月光指引着我……', '嗅到了……猎物的气息……'],
      death: ['月光……暗了……', '呜……（倒下）'],
      attack: ['狼牙！', '月光之噬！'],
      hurt: ['嗷！', '这……不可能……'],
      lowHp: ['月光……给我力量……'],
    },
  },
];

// ============================================================
// 章2: 冰封山脉 — 冰霜生物
// ============================================================
const ch2_normals: EnemyConfig[] = [
  {
    id: 'ice_yeti', name: '雪原雪人', emoji: '', chapter: 2,
    baseHp: 36, baseDmg: 9, category: 'normal', combatType: 'warrior',
    drops: { gold: 20, augment: false },
    phases: [{ actions: [
      { type: '攻击', baseValue: 9 },
      { type: '攻击', baseValue: 11, description: '冰拳' },
    ]}],
    quotes: {
      enter: ['吼————！', '（地面在颤抖）'],
      death: ['吼……（倒地，掀起雪浪）', '冰……碎了……'],
      attack: ['砸！', '冰拳！', '吼！'],
      hurt: ['吼！疼！', '（愤怒咆哮）'],
      lowHp: ['吼……不会……倒下……'],
    },
  },
  {
    id: 'ice_mage', name: '霜寒女巫', emoji: '', chapter: 2,
    baseHp: 18, baseDmg: 4, category: 'normal', combatType: 'caster',
    drops: { gold: 20, augment: false },
    phases: [{ actions: [
      { type: '技能', baseValue: 1, description: '冻结', scalable: false },
      { type: '攻击', baseValue: 6 },
      { type: '技能', baseValue: 2, description: '虚弱', scalable: false },
    ]}],
    quotes: {
      enter: ['冰霜……会冻结一切……', '寒冬……已经来临……'],
      death: ['冰……碎了……但寒意……永存……', '（冰晶四散）'],
      attack: ['冰锥！', '寒冰箭！', '冻住！'],
      hurt: ['冰盾……裂了……', '不……可能……'],
      lowHp: ['暴风雪……最后的咏唱……'],
    },
  },
  {
    id: 'ice_wolf', name: '霜鬃狼', emoji: '', chapter: 2,
    baseHp: 22, baseDmg: 5, category: 'normal', combatType: 'ranger',
    drops: { gold: 20, augment: false },
    phases: [{ actions: [
      { type: '攻击', baseValue: 5 },
      { type: '攻击', baseValue: 7, description: '冰霜撕咬' },
      { type: '技能', baseValue: 1, description: '灼烧', scalable: false },
    ]}],
    quotes: {
      enter: ['（低沉的咆哮）', '嗅到了……温暖的血……'],
      death: ['呜……（倒在雪中）', '（低吟消散）'],
      attack: ['嗷！', '撕咬！', '冰牙！'],
      hurt: ['嗷呜！', '（退后一步，龇牙）'],
      lowHp: ['呜……群狼……会替我报仇……'],
    },
  },
  {
    id: 'ice_golem', name: '寒冰石像', emoji: '', chapter: 2,
    baseHp: 44, baseDmg: 4, category: 'normal', combatType: 'guardian',
    drops: { gold: 20, augment: false },
    phases: [{ actions: [
      { type: '防御', baseValue: 10 },
      { type: '攻击', baseValue: 5 },
      { type: '防御', baseValue: 8 },
    ]}],
    quotes: {
      enter: ['（冰晶嘎吱作响）', '不许……通过……'],
      death: ['（碎裂成冰块）', '使命……完成……'],
      attack: ['碾压！', '冰拳！'],
      hurt: ['裂缝……', '（冰块脱落）'],
      lowHp: ['还能……守住……'],
    },
  },
];

// ============================================================
// 章3: 熔岩深渊 — 火焰/恶魔生物
// ============================================================
const ch3_normals: EnemyConfig[] = [
  {
    id: 'lava_hound', name: '地狱火犬', emoji: '', chapter: 3,
    baseHp: 30, baseDmg: 8, category: 'normal', combatType: 'warrior',
    drops: { gold: 20, augment: false },
    phases: [{ actions: [
      { type: '攻击', baseValue: 8 },
      { type: '攻击', baseValue: 10, description: '烈焰撕咬' },
      { type: '技能', baseValue: 2, description: '灼烧', scalable: false },
    ]}],
    quotes: {
      enter: ['（烈焰从口中喷出）', '吼！猎物！'],
      death: ['（化为灰烬）', '火……灭了……'],
      attack: ['烈焰！', '烧！', '吞噬！'],
      hurt: ['（痛苦嚎叫）', '嗷！'],
      lowHp: ['最后……一口火焰……'],
    },
  },
  {
    id: 'lava_imp', name: '小恶魔', emoji: '', chapter: 3,
    baseHp: 16, baseDmg: 4, category: 'normal', combatType: 'caster',
    drops: { gold: 20, augment: false },
    phases: [{ actions: [
      { type: '技能', baseValue: 2, description: '灼烧', scalable: false },
      { type: '攻击', baseValue: 5 },
      { type: '技能', baseValue: 1, description: '易伤', scalable: false },
      { type: '攻击', baseValue: 6, description: '火球' },
    ]}],
    quotes: {
      enter: ['嘻嘻嘻！又来送死的！', '火焰……是最好的玩具！'],
      death: ['嘻……不好玩了……', '（砰——消散）'],
      attack: ['接火球！', '嘻嘻！烫吧！', '燃烧吧！'],
      hurt: ['哎呀！', '嘻……你打得到我？'],
      lowHp: ['不行了……要逃了……才怪！吃火球！'],
    },
  },
  {
    id: 'lava_guardian', name: '黑铁卫士', emoji: '', chapter: 3,
    baseHp: 48, baseDmg: 5, category: 'normal', combatType: 'guardian',
    drops: { gold: 20, augment: false },
    phases: [{ actions: [
      { type: '防御', baseValue: 12 },
      { type: '攻击', baseValue: 6 },
      { type: '防御', baseValue: 8 },
      { type: '攻击', baseValue: 8, description: '锻造重击' },
    ]}],
    quotes: {
      enter: ['黑铁之盾，坚不可摧！', '没有通行令，不许过！'],
      death: ['盾……碎了……', '黑铁……不灭……（倒下）'],
      attack: ['锤击！', '黑铁之力！'],
      hurt: ['叮！', '铁甲……凹了？'],
      lowHp: ['只要……盾还在……就不会倒！'],
    },
  },
  {
    id: 'lava_shaman', name: '火焰萨满', emoji: '', chapter: 3,
    baseHp: 22, baseDmg: 3, category: 'normal', combatType: 'priest',
    drops: { gold: 20, augment: false },
    phases: [{ actions: [
      { type: '技能', baseValue: 2, description: '灼烧', scalable: false },
      { type: '技能', baseValue: 1, description: '力量', scalable: false },
      { type: '攻击', baseValue: 5 },
    ]}],
    quotes: {
      enter: ['烈焰之灵……降临吧！', '火焰赐予我力量！'],
      death: ['火灵……离开了我……', '（火焰熄灭）'],
      attack: ['烈焰冲击！', '焚烧！'],
      hurt: ['火盾……碎了……', '灵体……动摇了……'],
      lowHp: ['最后的祈祷……烈焰之怒！'],
    },
  },
];

// ============================================================
// 章4: 暗影要塞 — 恶魔/堕落生物
// ============================================================
const ch4_normals: EnemyConfig[] = [
  {
    id: 'shadow_assassin', name: '暗影刺客', emoji: '', chapter: 4,
    baseHp: 24, baseDmg: 12, category: 'normal', combatType: 'ranger',
    drops: { gold: 20, augment: false },
    phases: [{ actions: [
      { type: '攻击', baseValue: 12, description: '背刺' },
      { type: '技能', baseValue: 2, description: '剧毒', scalable: false },
      { type: '攻击', baseValue: 8 },
    ]}],
    quotes: {
      enter: ['（从阴影中浮现）', '你……看不见我……'],
      death: ['影子……消散了……', '（无声倒下）'],
      attack: ['背刺！', '影杀！', '无声之刃！'],
      hurt: ['嘶……被发现了……', '不……可能……'],
      lowHp: ['影遁……最后一击……'],
    },
  },
  {
    id: 'shadow_felguard', name: '邪能卫兵', emoji: '', chapter: 4,
    baseHp: 46, baseDmg: 6, category: 'normal', combatType: 'guardian',
    drops: { gold: 20, augment: false },
    phases: [{ actions: [
      { type: '攻击', baseValue: 7 },
      { type: '防御', baseValue: 14 },
      { type: '攻击', baseValue: 9, description: '邪能重斩' },
    ]}],
    quotes: {
      enter: ['受主人之命……消灭一切入侵者！', '邪能……流淌在我的血脉中！'],
      death: ['主人……恕我……', '邪能……回归虚空……'],
      attack: ['邪能斩！', '毁灭！', '碾碎你！'],
      hurt: ['邪能护甲……', '不过如此……'],
      lowHp: ['主人的力量……赐予我……最后一击！'],
    },
  },
  {
    id: 'shadow_warlock', name: '邪能术士', emoji: '', chapter: 4,
    baseHp: 20, baseDmg: 5, category: 'normal', combatType: 'caster',
    drops: { gold: 20, augment: false },
    phases: [{ actions: [
      { type: '技能', baseValue: 2, description: '剧毒', scalable: false },
      { type: '攻击', baseValue: 6 },
      { type: '技能', baseValue: 2, description: '灼烧', scalable: false },
      { type: '攻击', baseValue: 7, description: '暗影箭' },
    ]}],
    quotes: {
      enter: ['邪能……是最强大的力量！', '痛苦……才刚刚开始……'],
      death: ['不……我的灵魂……', '邪能……反噬了……'],
      attack: ['暗影箭！', '燃烧吧！', '腐蚀！'],
      hurt: ['灵魂石……碎了……', '不可能……我的结界……'],
      lowHp: ['生命分流！用你的生命……延续我的！'],
    },
  },
  {
    id: 'shadow_knight', name: '堕落死亡骑士', emoji: '', chapter: 4,
    baseHp: 34, baseDmg: 10, category: 'normal', combatType: 'warrior',
    drops: { gold: 20, augment: false },
    phases: [{ actions: [
      { type: '攻击', baseValue: 10 },
      { type: '技能', baseValue: 1, description: '虚弱', scalable: false },
      { type: '攻击', baseValue: 12, description: '凋零打击' },
    ]}],
    quotes: {
      enter: ['曾经……我也是光明的骑士……', '背叛了光……便无路可退……'],
      death: ['光……我又看到了……光……', '（黑色铠甲碎裂）'],
      attack: ['凋零！', '黑暗之力！', '受死吧！'],
      hurt: ['这具身体……已经不怕痛了……', '无用的抵抗……'],
      lowHp: ['即便倒下……黑暗……也不会消失……'],
    },
  },
];

// ============================================================
// 章5: 永恒之巅 — 光铸/泰坦/时光造物
// ============================================================
const ch5_normals: EnemyConfig[] = [
  {
    id: 'eternal_sentinel', name: '光铸哨兵', emoji: '', chapter: 5,
    baseHp: 40, baseDmg: 8, category: 'normal', combatType: 'guardian',
    drops: { gold: 20, augment: false },
    phases: [{ actions: [
      { type: '防御', baseValue: 14 },
      { type: '攻击', baseValue: 8 },
      { type: '防御', baseValue: 10 },
      { type: '攻击', baseValue: 10, description: '圣光裁决' },
    ]}],
    quotes: {
      enter: ['此地……不可侵犯。', '以泰坦之名——退下！'],
      death: ['任务……失败……', '光……指引我……回家……'],
      attack: ['裁决！', '净化！', '圣光之锤！'],
      hurt: ['圣光护盾……动摇了……', '不过是……考验……'],
      lowHp: ['即使倒下……光明……永不熄灭……'],
    },
  },
  {
    id: 'eternal_chrono', name: '时光龙人', emoji: '', chapter: 5,
    baseHp: 26, baseDmg: 7, category: 'normal', combatType: 'caster',
    drops: { gold: 20, augment: false },
    phases: [{ actions: [
      { type: '技能', baseValue: 2, description: '虚弱', scalable: false },
      { type: '攻击', baseValue: 8, description: '时光冲击' },
      { type: '技能', baseValue: 1, description: '冻结', scalable: false },
    ]}],
    quotes: {
      enter: ['你的时间线……出了偏差……', '过去、现在、未来……我都能看见……'],
      death: ['时间线……修复了……', '这个结果……也在预料之中……'],
      attack: ['时光逆转！', '沙漏之力！', '时间停止！'],
      hurt: ['时间流……紊乱了……', '这不在……预言中……'],
      lowHp: ['最后的沙粒……也快流尽了……'],
    },
  },
  {
    id: 'eternal_archer', name: '星界游侠', emoji: '', chapter: 5,
    baseHp: 22, baseDmg: 10, category: 'normal', combatType: 'ranger',
    drops: { gold: 20, augment: false },
    phases: [{ actions: [
      { type: '攻击', baseValue: 10 },
      { type: '攻击', baseValue: 12, description: '星辰之箭' },
      { type: '技能', baseValue: 1, description: '易伤', scalable: false },
    ]}],
    quotes: {
      enter: ['星光……指引我的箭矢……', '（弓弦轻响）'],
      death: ['星辰……暗了……', '（化为星尘）'],
      attack: ['星箭！', '穿透！', '星光之雨！'],
      hurt: ['嘶……', '星光……偏移了……'],
      lowHp: ['最后一箭……献给星辰……'],
    },
  },
  {
    id: 'eternal_priest', name: '泰坦祭司', emoji: '', chapter: 5,
    baseHp: 24, baseDmg: 3, category: 'normal', combatType: 'priest',
    drops: { gold: 20, augment: false },
    phases: [{ actions: [
      { type: '技能', baseValue: 2, description: '力量', scalable: false },
      { type: '技能', baseValue: 1, description: '易伤', scalable: false },
      { type: '攻击', baseValue: 6, description: '圣光惩击' },
    ]}],
    quotes: {
      enter: ['泰坦的意志……不容亵渎。', '圣光……会审判一切。'],
      death: ['泰坦……我……回来了……', '（光芒消散）'],
      attack: ['惩击！', '圣光！', '泰坦之怒！'],
      hurt: ['信仰……不会动摇……', '只是……皮肉之伤……'],
      lowHp: ['圣光……赐予我……最后的力量……'],
    },
  },
];

// ============================================================
// 合并所有普通敌人
// ============================================================
export const NORMAL_ENEMIES: EnemyConfig[] = [
  ...ch1_normals, ...ch2_normals, ...ch3_normals, ...ch4_normals, ...ch5_normals,
];

// ============================================================
// 精英敌人 — 每章2个
// ============================================================
export const ELITE_ENEMIES: EnemyConfig[] = [
  // 章1
  {
    id: 'elite_necromancer', name: '亡灵巫师', emoji: '', chapter: 1,
    baseHp: 85, baseDmg: 8, category: 'elite', combatType: 'caster',
    drops: { gold: 50, augment: true, rerollReward: 2 },
    phases: [
      { hpThreshold: 0.4, actions: [
        { type: '攻击', baseValue: 14, description: '亡灵大军' },
        { type: '技能', baseValue: 3, description: '剧毒', scalable: false },
      ]},
      { actions: [
        { type: '攻击', baseValue: 8 },
        { type: '技能', baseValue: 2, description: '虚弱', scalable: false },
        { type: '防御', baseValue: 12 },
      ]},
    ],
    quotes: {
      enter: ['死者……听从我的召唤！', '坟墓里的军队……比你想象的多。'],
      death: ['我的……亡灵们……', '死亡……只是另一个开始……'],
      attack: ['亡灵术！', '腐蚀！', '黑暗吞噬！'],
      hurt: ['骨盾……碎了？', '不可能……'],
      lowHp: ['用我的骸骨……召唤最后的亡灵！'],
    },
  },
  {
    id: 'elite_alpha_wolf', name: '狼人首领', emoji: '', chapter: 1,
    baseHp: 100, baseDmg: 11, category: 'elite', combatType: 'warrior',
    drops: { gold: 50, augment: true, rerollReward: 2 },
    phases: [{ actions: [
      { type: '攻击', baseValue: 11 },
      { type: '攻击', baseValue: 14, description: '狂暴撕咬' },
      { type: '技能', baseValue: 2, description: '力量', scalable: false },
      { type: '攻击', baseValue: 9 },
    ]}],
    quotes: {
      enter: ['月光之下……狼群为王！', '嗅到了……恐惧的味道……'],
      death: ['狼王……倒下了……', '（最后一声长嚎）'],
      attack: ['撕碎！', '狂暴！', '嗷——！'],
      hurt: ['疼痛……让我更愤怒！', '嗷呜！'],
      lowHp: ['月光……赐予我……最后的狂暴！'],
    },
  },
  // 章2
  {
    id: 'elite_frost_wyrm', name: '霜龙幼崽', emoji: '', chapter: 2,
    baseHp: 95, baseDmg: 10, category: 'elite', combatType: 'caster',
    drops: { gold: 50, augment: true, rerollReward: 2 },
    phases: [
      { hpThreshold: 0.3, actions: [
        { type: '攻击', baseValue: 18, description: '寒冰吐息' },
        { type: '技能', baseValue: 2, description: '冻结', scalable: false },
      ]},
      { actions: [
        { type: '攻击', baseValue: 10 },
        { type: '技能', baseValue: 2, description: '虚弱', scalable: false },
        { type: '防御', baseValue: 14 },
        { type: '攻击', baseValue: 8 },
      ]},
    ],
    quotes: {
      enter: ['（冰冷的咆哮响彻山谷）', '寒冰……将冻结一切……'],
      death: ['（碎裂成无数冰晶）', '龙血……冷了……'],
      attack: ['冰息！', '冻住吧！', '寒冰吐息！'],
      hurt: ['龙鳞……裂了？', '（愤怒咆哮）'],
      lowHp: ['最后的……寒冰吐息……全力释放！'],
    },
  },
  {
    id: 'elite_ice_lord', name: '冰霜巨人王', emoji: '', chapter: 2,
    baseHp: 120, baseDmg: 7, category: 'elite', combatType: 'guardian',
    drops: { gold: 50, augment: true, rerollReward: 2 },
    phases: [{ actions: [
      { type: '防御', baseValue: 20 },
      { type: '攻击', baseValue: 8 },
      { type: '攻击', baseValue: 14, description: '冰锤粉碎' },
      { type: '技能', baseValue: 1, description: '冻结', scalable: false },
    ]}],
    quotes: {
      enter: ['渺小的生物……敢闯冰封王座？', '（大地震颤）'],
      death: ['冰……不灭……', '（轰然倒塌）'],
      attack: ['碾碎！', '冰锤！', '臣服吧！'],
      hurt: ['蚊虫叮咬……', '（怒吼）'],
      lowHp: ['冰封王座……不会倒塌！'],
    },
  },
  // 章3
  {
    id: 'elite_infernal', name: '地狱火', emoji: '', chapter: 3,
    baseHp: 100, baseDmg: 12, category: 'elite', combatType: 'warrior',
    drops: { gold: 50, augment: true, rerollReward: 2 },
    phases: [{ actions: [
      { type: '攻击', baseValue: 12 },
      { type: '攻击', baseValue: 16, description: '烈焰冲击' },
      { type: '技能', baseValue: 3, description: '灼烧', scalable: false },
      { type: '防御', baseValue: 10 },
    ]}],
    quotes: {
      enter: ['（从天而降，地面龟裂）', '毁灭……降临！'],
      death: ['烈焰……熄灭了……', '（崩塌为岩石）'],
      attack: ['烈焰！', '毁灭！', '焚烧一切！'],
      hurt: ['石皮……裂了……', '（咆哮）'],
      lowHp: ['最后的爆发……与你同归于尽！'],
    },
  },
  {
    id: 'elite_dark_iron', name: '黑铁议员', emoji: '', chapter: 3,
    baseHp: 90, baseDmg: 9, category: 'elite', combatType: 'caster',
    drops: { gold: 50, augment: true, rerollReward: 2 },
    phases: [
      { hpThreshold: 0.4, actions: [
        { type: '攻击', baseValue: 16, description: '熔岩之怒' },
        { type: '技能', baseValue: 1, description: '诅咒锻造', scalable: false, curseDice: 'cracked', curseDiceCount: 1 },
      ]},
      { actions: [
        { type: '攻击', baseValue: 9 },
        { type: '技能', baseValue: 2, description: '灼烧', scalable: false },
        { type: '防御', baseValue: 16 },
      ]},
    ],
    quotes: {
      enter: ['黑铁议会……判你死刑！', '熔炉之力……为我所用！'],
      death: ['议会……散了……', '锻造……停止了……'],
      attack: ['熔岩之怒！', '黑铁审判！', '锻造碎骨！'],
      hurt: ['黑铁……不碎！', '嘁……'],
      lowHp: ['启动……自毁程序……一起下地狱！'],
    },
  },
  // 章4
  {
    id: 'elite_doomguard', name: '末日守卫', emoji: '', chapter: 4,
    baseHp: 110, baseDmg: 11, category: 'elite', combatType: 'warrior',
    drops: { gold: 50, augment: true, rerollReward: 2 },
    phases: [{ actions: [
      { type: '攻击', baseValue: 11 },
      { type: '攻击', baseValue: 16, description: '末日审判' },
      { type: '技能', baseValue: 2, description: '易伤', scalable: false },
      { type: '防御', baseValue: 14 },
      { type: '技能', baseValue: 1, description: '诅咒注入', scalable: false, curseDice: 'cursed', curseDiceCount: 1 },
    ]}],
    quotes: {
      enter: ['末日……已经降临。', '你的灵魂……归军团所有！'],
      death: ['军团……不灭……', '这不过是……开始……'],
      attack: ['末日审判！', '灵魂撕裂！', '深渊之力！'],
      hurt: ['邪能护甲……动摇了？', '渺小的伤害……'],
      lowHp: ['用我的生命……召唤更强大的恶魔！'],
    },
  },
  {
    id: 'elite_shadow_priest', name: '暗影大主教', emoji: '', chapter: 4,
    baseHp: 80, baseDmg: 8, category: 'elite', combatType: 'priest',
    drops: { gold: 50, augment: true, rerollReward: 2 },
    phases: [
      { hpThreshold: 0.3, actions: [
        { type: '技能', baseValue: 3, description: '剧毒', scalable: false },
        { type: '技能', baseValue: 3, description: '灼烧', scalable: false },
      ]},
      { actions: [
        { type: '攻击', baseValue: 8 },
        { type: '技能', baseValue: 2, description: '虚弱', scalable: false },
        { type: '攻击', baseValue: 10, description: '精神鞭笞' },
        { type: '技能', baseValue: 2, description: '剧毒', scalable: false },
      ]},
    ],
    quotes: {
      enter: ['暗影的低语……你听到了吗？', '精神……比肉体更容易摧毁……'],
      death: ['暗影……弥散了……', '虚空……在呼唤我……'],
      attack: ['精神鞭笞！', '暗影之触！', '虚空奔涌！'],
      hurt: ['心灵屏障……裂了……', '疼痛……也是力量……'],
      lowHp: ['暗影……形态——最终手段！'],
    },
  },
  // 章5
  {
    id: 'elite_titan_construct', name: '泰坦守护者', emoji: '', chapter: 5,
    baseHp: 130, baseDmg: 10, category: 'elite', combatType: 'guardian',
    drops: { gold: 50, augment: true, rerollReward: 2 },
    phases: [{ actions: [
      { type: '防御', baseValue: 22 },
      { type: '攻击', baseValue: 10 },
      { type: '攻击', baseValue: 18, description: '泰坦之锤' },
      { type: '技能', baseValue: 2, description: '虚弱', scalable: false },
    ]}],
    quotes: {
      enter: ['入侵者检测完毕。启动消灭程序。', '泰坦的造物……不可战胜。'],
      death: ['系统……崩溃……', '协议……执行……失败……'],
      attack: ['泰坦之锤！', '消灭目标！', '粉碎入侵者！'],
      hurt: ['护盾……承受冲击……', '损伤率……可接受……'],
      lowHp: ['核心过载……启动自毁倒计时……'],
    },
  },
  {
    id: 'elite_void_walker', name: '虚空行者', emoji: '', chapter: 5,
    baseHp: 90, baseDmg: 13, category: 'elite', combatType: 'caster',
    drops: { gold: 50, augment: true, rerollReward: 2 },
    phases: [
      { hpThreshold: 0.35, actions: [
        { type: '攻击', baseValue: 20, description: '虚空爆裂' },
        { type: '技能', baseValue: 1, description: '诅咒注入', scalable: false, curseDice: 'cursed', curseDiceCount: 1 },
      ]},
      { actions: [
        { type: '攻击', baseValue: 13 },
        { type: '技能', baseValue: 2, description: '易伤', scalable: false },
        { type: '攻击', baseValue: 10 },
        { type: '技能', baseValue: 2, description: '虚弱', scalable: false },
      ]},
    ],
    quotes: {
      enter: ['虚空……无处不在……你无法逃离。', '现实的壁障……在我面前不堪一击。'],
      death: ['虚空……会记住你……', '回到……黑暗中……'],
      attack: ['虚空爆裂！', '维度撕裂！', '消散吧！'],
      hurt: ['虚空……波动了……', '有趣……你能触碰到虚空？'],
      lowHp: ['虚空的全部力量……释放！'],
    },
  },
];

// ============================================================
// Boss — 每章1个中Boss + 1个终Boss = 10个Boss
// ============================================================
export const BOSS_ENEMIES: EnemyConfig[] = [
  // 章1 中Boss
  {
    id: 'boss_lich_forest', name: '枯骨巫妖', emoji: '', chapter: 1,
    baseHp: 150, baseDmg: 10, category: 'boss', combatType: 'caster',
    drops: { gold: 60, augment: true },
    phases: [
      { hpThreshold: 0.4, actions: [
        { type: '攻击', baseValue: 16, description: '亡灵风暴' },
        { type: '技能', baseValue: 2, description: '灼烧', scalable: false },
        { type: '攻击', baseValue: 14, description: '骸骨之矛' },
        { type: '技能', baseValue: 1, description: '诅咒', scalable: false, curseDice: 'cursed', curseDiceCount: 1 },
        { type: '防御', baseValue: 15 },
      ]},
      { actions: [
        { type: '攻击', baseValue: 8 },
        { type: '攻击', baseValue: 8 },
        { type: '技能', baseValue: 2, description: '虚弱', scalable: false },
        { type: '技能', baseValue: 1, description: '易伤', scalable: false },
        { type: '防御', baseValue: 15 },
      ]},
    ],
    quotes: {
      enter: ['哈哈哈……又一个活人，送上门来了。', '死亡……是我赐予你的礼物。'],
      death: ['我的……灵魂宝石……不——！', '这不可能……巫妖……不灭的……'],
      attack: ['亡灵风暴！', '骸骨之矛！', '让亡灵大军吞噬你！'],
      hurt: ['灵魂宝石……动摇了……', '你……竟能伤到我？'],
      lowHp: ['灵魂宝石……碎裂吧——释放一切死灵之力！'],
    },
  },
  // 章1 终Boss
  {
    id: 'boss_ancient_treant', name: '远古树王', emoji: '', chapter: 1,
    baseHp: 300, baseDmg: 15, category: 'boss', combatType: 'guardian',
    drops: { gold: 0, augment: false },
    phases: [
      { hpThreshold: 0.5, actions: [
        { type: '攻击', baseValue: 22, description: '大地之怒' },
        { type: '防御', baseValue: 30 },
        { type: '攻击', baseValue: 18 },
        { type: '技能', baseValue: 3, description: '剧毒', scalable: false },
      ]},
      { actions: [
        { type: '防御', baseValue: 20 },
        { type: '攻击', baseValue: 12 },
        { type: '技能', baseValue: 2, description: '虚弱', scalable: false },
        { type: '攻击', baseValue: 15 },
      ]},
    ],
    quotes: {
      enter: ['千年……未曾有人……走到这里。', '这片森林……就是我的身体。'],
      death: ['森林……终将……重生……', '你……是第一个……砍倒我的人……'],
      attack: ['大地之怒！', '根须绞杀！', '千年之力！'],
      hurt: ['不过是……树皮划痕……', '千年巨木……岂会轻倒？'],
      lowHp: ['大地啊……赐予我……最后的力量——！'],
    },
  },
  // 章2 中Boss
  {
    id: 'boss_frost_queen', name: '霜寒女王', emoji: '', chapter: 2,
    baseHp: 160, baseDmg: 10, category: 'boss', combatType: 'caster',
    drops: { gold: 60, augment: true },
    phases: [
      { hpThreshold: 0.4, actions: [
        { type: '攻击', baseValue: 18, description: '暴风雪' },
        { type: '技能', baseValue: 2, description: '冻结', scalable: false },
        { type: '攻击', baseValue: 14 },
        { type: '技能', baseValue: 1, description: '碎裂诅咒', scalable: false, curseDice: 'cracked', curseDiceCount: 1 },
        { type: '防御', baseValue: 16 },
      ]},
      { actions: [
        { type: '攻击', baseValue: 9 },
        { type: '技能', baseValue: 1, description: '冻结', scalable: false },
        { type: '攻击', baseValue: 9 },
        { type: '技能', baseValue: 2, description: '虚弱', scalable: false },
        { type: '防御', baseValue: 14 },
      ]},
    ],
    quotes: {
      enter: ['冰封山脉的女王……亲自迎接你。', '你的体温……让我厌恶。'],
      death: ['寒冬……永远……不会结束……', '（冰雕碎裂）'],
      attack: ['暴风雪！', '冰封！', '寒冰王冠之力！'],
      hurt: ['我的冰甲……裂了？', '温暖……好恶心……'],
      lowHp: ['冰封……整个世界吧——！'],
    },
  },
  // 章2 终Boss
  {
    id: 'boss_frost_lich', name: '霜之巫妖王', emoji: '', chapter: 2,
    baseHp: 320, baseDmg: 15, category: 'boss', combatType: 'warrior',
    drops: { gold: 0, augment: false },
    phases: [
      { hpThreshold: 0.5, actions: [
        { type: '攻击', baseValue: 28, description: '霜之哀伤' },
        { type: '攻击', baseValue: 20 },
        { type: '技能', baseValue: 3, description: '剧毒', scalable: false },
        { type: '防御', baseValue: 28 },
      ]},
      { actions: [
        { type: '攻击', baseValue: 14 },
        { type: '技能', baseValue: 2, description: '冻结', scalable: false },
        { type: '攻击', baseValue: 18 },
        { type: '技能', baseValue: 2, description: '虚弱', scalable: false },
      ]},
    ],
    quotes: {
      enter: ['跪下……在巫妖王面前。', '这把剑……渴望你的灵魂。'],
      death: ['不……霜之哀伤……不会……', '永恒的寒冬……终结了？'],
      attack: ['霜之哀伤！', '臣服于寒冰！', '灵魂收割！'],
      hurt: ['不过是……暖风拂面。', '你的抵抗……毫无意义。'],
      lowHp: ['所有人……都将臣服于寒冰王座——！'],
    },
  },
  // 章3 中Boss
  {
    id: 'boss_ragnaros', name: '炎魔之王', emoji: '', chapter: 3,
    baseHp: 200, baseDmg: 12, category: 'boss', combatType: 'warrior',
    drops: { gold: 60, augment: true },
    phases: [
      { hpThreshold: 0.4, actions: [
        { type: '攻击', baseValue: 20, description: '岩浆之锤' },
        { type: '技能', baseValue: 3, description: '灼烧', scalable: false },
        { type: '攻击', baseValue: 16, description: '烈焰之手' },
        { type: '防御', baseValue: 14 },
      ]},
      { actions: [
        { type: '攻击', baseValue: 12 },
        { type: '技能', baseValue: 2, description: '灼烧', scalable: false },
        { type: '攻击', baseValue: 10 },
        { type: '防御', baseValue: 12 },
      ]},
    ],
    quotes: {
      enter: ['太早了……你唤醒我太早了！', '熔火之核……是我的领域！'],
      death: ['不——！岩浆……在退却……', '我会……回来的……'],
      attack: ['岩浆之锤！', '烈焰冲击！', '燃烧吧——！'],
      hurt: ['渣渣！你敢伤我？', '这点伤……不算什么！'],
      lowHp: ['烈焰……最后的爆发——焚尽一切！'],
    },
  },
  // 章3 终Boss
  {
    id: 'boss_deathwing', name: '熔火死翼', emoji: '', chapter: 3,
    baseHp: 380, baseDmg: 16, category: 'boss', combatType: 'caster',
    drops: { gold: 0, augment: false },
    phases: [
      { hpThreshold: 0.5, actions: [
        { type: '攻击', baseValue: 30, description: '大灾变' },
        { type: '攻击', baseValue: 22 },
        { type: '技能', baseValue: 4, description: '灼烧', scalable: false },
        { type: '防御', baseValue: 30 },
      ]},
      { actions: [
        { type: '技能', baseValue: 3, description: '灼烧', scalable: false },
        { type: '攻击', baseValue: 14 },
        { type: '技能', baseValue: 2, description: '易伤', scalable: false },
        { type: '攻击', baseValue: 20, description: '熔岩吐息' },
      ]},
    ],
    quotes: {
      enter: ['大灾变……来临了！', '凡人……在我面前……不堪一击。'],
      death: ['不……我是……大地的毁灭者……怎么会……', '（咆哮着坠入岩浆）'],
      attack: ['大灾变！', '熔岩吐息！', '世界……在燃烧！'],
      hurt: ['你伤到了……我的钢铁之躯？', '可笑……'],
      lowHp: ['即使我倒下……世界……也已面目全非——！'],
    },
  },
  // 章4 中Boss
  {
    id: 'boss_archimonde', name: '深渊领主', emoji: '', chapter: 4,
    baseHp: 200, baseDmg: 11, category: 'boss', combatType: 'caster',
    drops: { gold: 60, augment: true },
    phases: [
      { hpThreshold: 0.4, actions: [
        { type: '攻击', baseValue: 18, description: '暗影之手' },
        { type: '技能', baseValue: 2, description: '灼烧', scalable: false },
        { type: '攻击', baseValue: 14, description: '邪能风暴' },
        { type: '技能', baseValue: 1, description: '诅咒注入', scalable: false, curseDice: 'cursed', curseDiceCount: 1 },
        { type: '防御', baseValue: 16 },
      ]},
      { actions: [
        { type: '攻击', baseValue: 10 },
        { type: '技能', baseValue: 2, description: '虚弱', scalable: false },
        { type: '攻击', baseValue: 9 },
        { type: '技能', baseValue: 2, description: '剧毒', scalable: false },
        { type: '防御', baseValue: 14 },
      ]},
    ],
    quotes: {
      enter: ['燃烧军团……势不可挡！', '你的抵抗……不过是临死前的挣扎。'],
      death: ['不……军团……不会……', '我会……在扭曲虚空中……重生！'],
      attack: ['暗影之手！', '邪能风暴！', '毁灭一切！'],
      hurt: ['你……竟敢？', '渺小的虫子……'],
      lowHp: ['燃烧吧——用你的世界……作为我的燃料！'],
    },
  },
  // 章4 终Boss
  {
    id: 'boss_kiljaeden', name: '暗影之王', emoji: '', chapter: 4,
    baseHp: 380, baseDmg: 16, category: 'boss', combatType: 'caster',
    drops: { gold: 0, augment: false },
    phases: [
      { hpThreshold: 0.5, actions: [
        { type: '攻击', baseValue: 28, description: '黑暗终焉' },
        { type: '攻击', baseValue: 22 },
        { type: '技能', baseValue: 3, description: '剧毒', scalable: false },
        { type: '防御', baseValue: 30 },
      ]},
      { actions: [
        { type: '技能', baseValue: 4, description: '灼烧', scalable: false },
        { type: '攻击', baseValue: 14 },
        { type: '技能', baseValue: 2, description: '虚弱', scalable: false },
        { type: '攻击', baseValue: 20, description: '邪能陨石' },
      ]},
    ],
    quotes: {
      enter: ['欺骗者……来了。', '你看到的一切……都是我的安排。'],
      death: ['虚空……会记住……这一天……', '不可能……欺骗者……怎会被欺骗……'],
      attack: ['黑暗终焉！', '邪能陨石！', '所有生命——终结吧！'],
      hurt: ['有趣……你确实……有些能耐。', '欺骗者……不惧伤痛。'],
      lowHp: ['用虚空的全部力量——毁灭这个世界！'],
    },
  },
  // 章5 中Boss
  {
    id: 'boss_titan_watcher', name: '泰坦看守者', emoji: '', chapter: 5,
    baseHp: 200, baseDmg: 12, category: 'boss', combatType: 'guardian',
    drops: { gold: 60, augment: true },
    phases: [
      { hpThreshold: 0.4, actions: [
        { type: '攻击', baseValue: 18, description: '泰坦审判' },
        { type: '防御', baseValue: 22 },
        { type: '攻击', baseValue: 16, description: '秩序之光' },
        { type: '技能', baseValue: 2, description: '易伤', scalable: false },
      ]},
      { actions: [
        { type: '防御', baseValue: 18 },
        { type: '攻击', baseValue: 10 },
        { type: '技能', baseValue: 2, description: '虚弱', scalable: false },
        { type: '攻击', baseValue: 12 },
      ]},
    ],
    quotes: {
      enter: ['泰坦的秩序……不容亵渎。', '你的存在……是一个错误。需要修正。'],
      death: ['秩序……被打破了……', '报告……泰坦……入侵者……无法阻止……'],
      attack: ['泰坦审判！', '秩序之光！', '修正错误！'],
      hurt: ['损伤……在可控范围内……', '你的力量……超出预期……'],
      lowHp: ['启动……最终审判协议——！'],
    },
  },
  // 章5 终Boss
  {
    id: 'boss_eternal_lord', name: '永恒主宰', emoji: '', chapter: 5,
    baseHp: 380, baseDmg: 16, category: 'boss', combatType: 'caster',
    drops: { gold: 0, augment: false },
    phases: [
      { hpThreshold: 0.5, actions: [
        { type: '攻击', baseValue: 28, description: '终极之光' },
        { type: '攻击', baseValue: 22 },
        { type: '技能', baseValue: 3, description: '剧毒', scalable: false },
        { type: '防御', baseValue: 30 },
      ]},
      { actions: [
        { type: '技能', baseValue: 4, description: '灼烧', scalable: false },
        { type: '攻击', baseValue: 14 },
        { type: '技能', baseValue: 2, description: '虚弱', scalable: false },
        { type: '攻击', baseValue: 20 },
      ]},
    ],
    quotes: {
      enter: ['永恒……在此。渺小的骰子掷者，你的终点……就是今天。', '多少英雄……都折在了这里。你……不过是下一个。'],
      death: ['不……不可能……永恒……怎么会……', '你……究竟……是什么？……永恒……也有尽头……'],
      attack: ['终极之光！', '永恒之力，碾碎你！', '渺小者，跪下！'],
      hurt: ['哼……有点意思。', '永恒之躯……竟被撼动……'],
      lowHp: ['永恒……动摇了……但我绝不会……就此终结！终极之光——爆发！'],
    },
  },
];

/** 可升级牌型池（用于事件中随机选择） */
export const UPGRADEABLE_HAND_TYPES = ['对子', '连值', '顺子', '同元素', '葡萄'];
