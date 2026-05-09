// [RULES-B2-EXEMPT] 纯数据配置文件：精英 + 10 个 Boss 的 phases/quotes 写实数据，
// 每个 Boss 的台词池（greet/dispatch/hurt/lowHp/death/attack）需 19~25 条以保证随机性，
// 因此整个文件随 Boss 数量线性增长，无法拆分而不破坏\"一个 Boss 一个 entry\"的可读性。
/**
 * enemyEliteBoss.ts - 精英敌人 & Boss敌人 & 可升级牌型池
 */

import type { EnemyConfig } from './enemyTypes';

// ============================================================
// 精英敌人 — 每章2个
// ============================================================
export const ELITE_ENEMIES: EnemyConfig[] = [
  // 章1
  {
    id: 'elite_necromancer', name: '亡灵巫师', emoji: '', chapter: 1,
    baseHp: 85, baseDmg: 8, category: 'elite', combatType: 'caster',
    drops: { gold: 50, relic: true, rerollReward: 2 },
    // [SUMMON 2026-05-09] 亡灵巫师每3回合召唤食尸鬼，maxTotal=2
    summons: { minionId: 'forest_ghoul', interval: 3, count: 1, maxTotal: 2, waveCap: 4 },
    // [REVIVE 2026-05-09] 不死巫师不死：死亡时回 50% HP 一次
    revive: { reviveHpRatio: 0.5 },
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
    drops: { gold: 50, relic: true, rerollReward: 2 },
    phases: [{ actions: [
      { type: '攻击', baseValue: 11 },
      { type: '攻击', baseValue: 14, description: '狂暴撕咬' },
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
  // [CH1-EXPANSION 2026-05-09] 章1 精英 +1 (ranger 缺口)
  {
    id: 'elite_phantom_hunter', name: '魅影猎手', emoji: '', chapter: 1,
    baseHp: 72, baseDmg: 12, category: 'elite', combatType: 'ranger',
    drops: { gold: 50, relic: true, rerollReward: 2 },
    phases: [{ actions: [
      { type: '攻击', baseValue: 12 },
      { type: '攻击', baseValue: 10, description: '穿林箭' },
      { type: '技能', baseValue: 2, description: '剧毒', scalable: false },
      { type: '攻击', baseValue: 14, description: '致命追击' },
    ]}],
    quotes: {
      enter: ['你进入了我的猎场。', '（弓弦轻响）', '影子替我锁定了你。'],
      death: ['箭袋……空了……', '一箭之差……我的狩猎……', '下一次……我会先瞄准喉咙……'],
      attack: ['穿林箭！', '影刺！', '咻——'],
      hurt: ['擦伤罢了。', '距离还不够近。', '我低估了你。'],
      lowHp: ['最后一支箭——必须命中要害。'],
    },
  },
  // 章2
  {
    id: 'elite_frost_wyrm', name: '霜龙幼崽', emoji: '', chapter: 2,
    baseHp: 95, baseDmg: 10, category: 'elite', combatType: 'caster',
    drops: { gold: 50, relic: true, rerollReward: 2 },
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
    drops: { gold: 50, relic: true, rerollReward: 2 },
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
  // [CH2-EXPANSION 2026-05-09] 章2 精英 +1 (priest 职业)
  {
    id: 'elite_frost_archon', name: '霜誓执政', emoji: '', chapter: 2,
    baseHp: 88, baseDmg: 9, category: 'elite', combatType: 'priest',
    drops: { gold: 50, relic: true, rerollReward: 2 },
    phases: [{ actions: [
      { type: '技能', baseValue: 2, description: '易伤', scalable: false },
      { type: '防御', baseValue: 16 },
      { type: '技能', baseValue: 3, description: '剧毒', scalable: false },
      { type: '攻击', baseValue: 9 },
      { type: '技能', baseValue: 1, description: '虚弱', scalable: false },
    ]}],
    quotes: {
      enter: ['冰霜之律——判你缄默。', '（圣冰权杖轻敲大地）', '执政的意志，就是寒冬的边界。'],
      death: ['权杖……折了……', '寒冬法庭……无法再审……', '律令……归于死寂……'],
      attack: ['缄默之咒！', '霜律刃！', '判！'],
      hurt: ['亵渎律令……可斩。', '袍服划破，律意不改。', '哼。'],
      lowHp: ['以本座性命——判你永冻不超生！'],
    },
  },
  // 章3
  {
    id: 'elite_infernal', name: '地狱火', emoji: '', chapter: 3,
    baseHp: 100, baseDmg: 12, category: 'elite', combatType: 'warrior',
    drops: { gold: 50, relic: true, rerollReward: 2 },
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
    drops: { gold: 50, relic: true, rerollReward: 2 },
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
  // [CH3-EXPANSION 2026-05-09] 章3 精英 +1 (priest 职业)
  {
    id: 'elite_flame_oracle', name: '烈焰谕者', emoji: '', chapter: 3,
    baseHp: 85, baseDmg: 9, category: 'elite', combatType: 'priest',
    drops: { gold: 50, relic: true, rerollReward: 2 },
    phases: [{ actions: [
      { type: '技能', baseValue: 3, description: '灼烧', scalable: false },
      { type: '防御', baseValue: 16 },
      { type: '技能', baseValue: 2, description: '易伤', scalable: false },
      { type: '攻击', baseValue: 9 },
      { type: '技能', baseValue: 1, description: '虚弱', scalable: false },
    ]}],
    quotes: {
      enter: ['火神的谕旨——已经写在你的灰烬上。', '（经文在火中燃烧成咒）', '你听不到火神的声音——那我替他说。'],
      death: ['经书……化为灰烬……', '谕旨……无人传达……', '火神……终究收回了目光……'],
      attack: ['烈焰谕旨！', '灼骨审判！', '炼狱经文！'],
      hurt: ['扰圣——有罪。', '经书烧得更亮了。', '哼，虔诚者不怕火。'],
      lowHp: ['以我之灰——铸最后一段谕旨！'],
    },
  },
  // 章4
  {
    id: 'elite_doomguard', name: '末日守卫', emoji: '', chapter: 4,
    baseHp: 110, baseDmg: 11, category: 'elite', combatType: 'warrior',
    drops: { gold: 50, relic: true, rerollReward: 2 },
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
    drops: { gold: 50, relic: true, rerollReward: 2 },
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
  // [CH4-EXPANSION 2026-05-09] 章4 精英 +1 (ranger 职业)
  {
    id: 'elite_nightfang_stalker', name: '夜牙潜影', emoji: '', chapter: 4,
    baseHp: 95, baseDmg: 13, category: 'elite', combatType: 'ranger',
    drops: { gold: 50, relic: true, rerollReward: 2 },
    phases: [{ actions: [
      { type: '攻击', baseValue: 13 },
      { type: '攻击', baseValue: 11, description: '影刃穿刺' },
      { type: '技能', baseValue: 2, description: '剧毒', scalable: false },
      { type: '攻击', baseValue: 15, description: '致命暗袭' },
    ]}],
    quotes: {
      enter: ['影子，是我的猎场。', '（弦响不可闻）', '你已经被瞄准了两步之久。'],
      death: ['脚步……没能再次融进影里……', '（一刀没扎中——只差一寸……）', '暗影……拒绝再庇护我了……'],
      attack: ['影刃穿刺！', '致命暗袭！', '咻——'],
      hurt: ['擦伤而已。', '暴露了半步。', '下一回我走得更无声。'],
      lowHp: ['最后一刀——影子替我推进去！'],
    },
  },
  // 章5
  {
    id: 'elite_titan_construct', name: '泰坦守护者', emoji: '', chapter: 5,
    baseHp: 130, baseDmg: 10, category: 'elite', combatType: 'guardian',
    drops: { gold: 50, relic: true, rerollReward: 2 },
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
    drops: { gold: 50, relic: true, rerollReward: 2 },
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
  // [CH5-EXPANSION 2026-05-09] 章5 精英 +1 (warrior 职业 — 章5 原无 warrior)
  {
    id: 'elite_celestial_champion', name: '天裁斗神', emoji: '', chapter: 5,
    baseHp: 110, baseDmg: 14, category: 'elite', combatType: 'warrior',
    drops: { gold: 50, relic: true, rerollReward: 2 },
    phases: [{ actions: [
      { type: '攻击', baseValue: 14 },
      { type: '攻击', baseValue: 18, description: '天裁一击' },
      { type: '防御', baseValue: 14 },
      { type: '攻击', baseValue: 12 },
    ]}],
    quotes: {
      enter: ['斗神之名——写于天空。', '（圣剑破鞘声）', '我曾一剑斩开星幕——你不过是落在剑痕里的一粒灰。'],
      death: ['圣剑……失手了？……', '斗神的名字……也会有人夺去……', '天空……收回了我的剑痕……'],
      attack: ['天裁一击！', '圣剑斩！', '破空！'],
      hurt: ['肉伤不碍剑锋。', '剑痕只会更深。', '哼。'],
      lowHp: ['以我剑命——斩破这世所有妄徒！'],
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
    baseHp: 150, baseDmg: 10, category: 'boss', bossRank: 'mid', combatType: 'caster',
    drops: { gold: 60, relic: true },
    // [SUMMON 2026-05-09] 死灵法师召唤亡灵：每3回合召唤食尸鬼，最多4只
    summons: { minionId: 'forest_ghoul', interval: 3, count: 1, maxTotal: 4, waveCap: 4 },
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
      // [BOSS-LINES-v3 2026-05-08] 章1 中Boss · 枯骨巫妖
      greet: [
        '千年的死寂，被你这小小的活人惊扰了……不可饶恕。',
        '又一个不知死活的来客？我的墓园从不嫌客人多。',
        '能踏进这座坟茔的活人，最后都成了我的藏品。',
      ],
      dispatch: [
        '亡魂们，听令——把他的骨头加入我的军团。',
        '骷髅卫，起立。让他先和你们的旧战友打个招呼。',
        '我懒得为你抬手——亡灵已经够多了，你的尸体只是再多一具。',
      ],
      enter: ['千年的死寂，被你这小小的活人惊扰了……不可饶恕。', '亡魂们，听令——把他的骨头加入我的军团。'],
      death: [
        '我的……灵魂宝石……不——！',
        '这不可能……巫妖……不灭的……',
        '千年的亡灵契约……断了……',
        '不……你以为这就结束了？（笑声渐远）',
        '骨灰……终究……要落地……',
      ],
      attack: ['亡灵风暴！', '骸骨之矛！', '让亡灵大军吞噬你！'],
      hurt: [
        '灵魂宝石……动摇了……',
        '你……竟能伤到我？',
        '不该……这骨头不该裂的……',
        '寒意……侵骨？我自己就是寒意！',
        '区区一击，惊不醒亡者。',
      ],
      lowHp: [
        '灵魂宝石……碎裂吧——释放一切死灵之力！',
        '骸骨之墙，给我立起来！',
        '我的亡灵大军……全部听令！',
      ],
    },
  },
  // [CH1-EXPANSION 2026-05-09] 章1 中BOSS +2
  {
    id: 'boss_root_colossus', name: '根须巨像', emoji: '', chapter: 1,
    baseHp: 170, baseDmg: 11, category: 'boss', bossRank: 'mid', combatType: 'guardian',
    drops: { gold: 55, relic: true, rerollReward: 3 },
    // [REVIVE 2026-05-09] 树魔死亡分裂为 2 只腐化树人（半血，攻击力 70%）
    revive: { reviveHpRatio: 0.5, splitInto: 2, splitMinionId: 'forest_treant' },
    phases: [
      { hpThreshold: 0.5, actions: [
        { type: '攻击', baseValue: 14, description: '根须重拳' },
        { type: '防御', baseValue: 24 },
        { type: '攻击', baseValue: 12 },
        { type: '技能', baseValue: 2, description: '剧毒', scalable: false },
      ]},
      { actions: [
        { type: '防御', baseValue: 14 },
        { type: '攻击', baseValue: 10 },
        { type: '技能', baseValue: 1, description: '虚弱', scalable: false },
      ]},
    ],
    quotes: {
      greet: [
        '森林把你交给了我——这片土地上，每一块石头都记得我的名字。',
        '从树王的根系里生长出来，就是为了处理你们这样的访客。',
        '你踏的每一步泥土，都会在我脚下凝成岩石。',
      ],
      dispatch: [
        '泥像们，起。把他缠住——我走一步，泥土就长一尺。',
        '根须卫士——上前。我很久没亲自挥拳了。',
        '岩裂巨虫，出动。先让他在地里挣扎片刻。',
      ],
      enter: ['森林把你交给了我——这片土地上，每一块石头都记得我的名字。', '泥像们，起。把他缠住——我走一步，泥土就长一尺。'],
      death: ['根系……断开……', '回归大地……养育下一代……', '土壤……会再次凝聚……', '这场战斗……滋养了森林……', '倒下的是我……活下来的是根……'],
      attack: ['根须重拳！', '大地摇动！', '岩裂！'],
      hurt: ['表皮裂开——里面还是石头。', '一层剥落，十层依旧。', '小伤。'],
      lowHp: ['根须最深处——释放全部力量！', '大地之心——为我加压！', '和这片森林一起压碎他！'],
    },
  },
  {
    id: 'boss_coven_matriarch', name: '魇森巫母', emoji: '', chapter: 1,
    baseHp: 145, baseDmg: 9, category: 'boss', bossRank: 'mid', combatType: 'caster',
    drops: { gold: 55, relic: true, rerollReward: 3 },
    // [SUMMON 2026-05-09] 巫母召唤蛛群：每3回合召唤剧毒蛛母，最多3只
    summons: { minionId: 'forest_spider', interval: 3, count: 1, maxTotal: 3, waveCap: 4 },
    phases: [
      { hpThreshold: 0.5, actions: [
        { type: '技能', baseValue: 2, description: '易伤', scalable: false },
        { type: '攻击', baseValue: 12, description: '诅咒爆发' },
        { type: '技能', baseValue: 3, description: '剧毒', scalable: false },
        { type: '防御', baseValue: 12 },
      ]},
      { actions: [
        { type: '技能', baseValue: 1, description: '虚弱', scalable: false },
        { type: '攻击', baseValue: 9 },
        { type: '技能', baseValue: 2, description: '剧毒', scalable: false },
      ]},
    ],
    quotes: {
      greet: [
        '我养育了这片森林里所有的毒草，也养育了每一个诅咒。',
        '你闻到的每一缕雾气，都是我的亲生孩子。',
        '三百年前，我把第一个闯入者织进了我的丝网。今晚——轮到你了。',
      ],
      dispatch: [
        '女儿们——起舞。让他看看诅咒真正的模样。',
        '我的爪牙早已饥渴——先给他们一点开胃菜。',
        '我的指甲不屑沾这种血。姐妹们，你们上。',
      ],
      enter: ['我养育了这片森林里所有的毒草，也养育了每一个诅咒。', '女儿们——起舞。让他看看诅咒真正的模样。'],
      death: ['诅咒……反噬了我自己……', '（咳出墨绿色的烟）', '女儿们……记住这个名字……', '丝网……断了……', '我会在毒雾里等你……下次相见……'],
      attack: ['诅咒爆发！', '毒瘴！', '千丝缠绕！'],
      hurt: ['扰我施咒……代价不小。', '仪式服破了一角——无妨。', '一点皮肉伤。'],
      lowHp: ['全部的毒素——融入最后一击！', '诅咒的精华——凝成一刀！', '我与森林同归于尽也无所谓！'],
    },
  },
  // 章1 终Boss
  {
    id: 'boss_ancient_treant', name: '远古树王', emoji: '', chapter: 1,
    baseHp: 300, baseDmg: 15, category: 'boss', bossRank: 'final', combatType: 'guardian',
    drops: { gold: 0, relic: false },
    // [SUMMON 2026-05-09] 终BOSS 二阶段（hp<50%）召唤幽冥诅祝
    summons: { minionId: 'forest_wraith_cultist', interval: 4, count: 1, maxTotal: 3, waveCap: 4, hpThreshold: 0.5 },
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
      // [BOSS-LINES-v3 2026-05-08] 章1 终Boss · 远古树王
      greet: [
        '这片森林从我萌芽的那一刻起，就吞噬了无数像你这样的来客。',
        '我用千年生根，你却想用几个回合砍倒我？可笑。',
        '你脚下的土壤，曾埋葬过一百个像你这样的英雄。',
      ],
      dispatch: [
        '根须，缠住他。落叶，蒙住他的眼。让他成为森林的一部分。',
        '林中的子嗣们——上前。让他听见树叶下亡魂的低语。',
        '我从不亲自动手——森林会替我处理一切。',
      ],
      enter: ['这片森林从我萌芽的那一刻起，就吞噬了无数像你这样的来客。', '根须，缠住他。落叶，蒙住他的眼。让他成为森林的一部分。'],
      death: [
        '森林……终将……重生……',
        '你……是第一个……砍倒我的人……',
        '根须……回归大地……',
        '下一轮的春天……不再属于我……',
        '让我倒下吧……腐殖土需要养分……',
      ],
      attack: ['大地之怒！', '根须绞杀！', '千年之力！'],
      hurt: [
        '不过是……树皮划痕……',
        '千年巨木……岂会轻倒？',
        '伐木者……我已见过太多。',
        '每一刀，我都会记下来。',
        '你的剑锋……还不够利。',
      ],
      phase2_taunt: [
        '划痕？你以为能砍倒我？——下一刀你会记得更深。',
        '这点刀伤，我千年前就开始愈合了。',
        '你激怒了我。森林会把你困在此刻，直到你耗尽。',
      ],
      lowHp: [
        '大地啊——赐予我最后的力量！',
        '千年巨木，岂会倒于你手！',
        '根须，缠住他！决不能让他离开森林！',
      ],
    },
  },
  // 章2 中Boss
  {
    id: 'boss_frost_queen', name: '霜寒女王', emoji: '', chapter: 2,
    baseHp: 160, baseDmg: 10, category: 'boss', bossRank: 'mid', combatType: 'caster',
    drops: { gold: 60, relic: true },
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
      // [BOSS-LINES-v3 2026-05-08] 章2 中Boss · 霜寒女王
      greet: [
        '这片冰原的每一寸都见证过我的加冕。你来此，无非送一具新的冰雕。',
        '冬之子民跪迎我千年——而你，连下跪的资格都没有。',
        '风雪从我指尖出生，又在你脚下死去。这就是寒冬的法则。',
      ],
      dispatch: [
        '冰晶卫队——上前。让他在见到我之前，就已经被冻僵了灵魂。',
        '霜骑士，去会会他。我喜欢看温热的血在冰上结成花。',
        '不必动我的指甲。爪牙——把他冻成我宫殿的新装饰。',
      ],
      enter: ['这片冰原的每一寸都见证过我的加冕。你来此，无非送一具新的冰雕。', '冰晶卫队——上前。让他在见到我之前，就已经被冻僵了灵魂。'],
      death: [
        '寒冬……永远……不会结束……',
        '（冰雕碎裂）',
        '王冠……坠地……',
        '我的冰封之国……终究……融化了……',
        '春风……到底还是来了……',
      ],
      attack: ['暴风雪！', '冰封！', '寒冰王冠之力！'],
      hurt: [
        '我的冰甲……裂了？',
        '温暖……好恶心……',
        '别脏了本宫的雪。',
        '热血溅在冰上，就快冻成花。',
        '小小灼烧，挠痒罢了。',
      ],
      lowHp: [
        '冰封整个世界吧——别让一缕春风留下！',
        '血液都要冻结了吗？可笑！',
        '我的宫殿，还不倒塌！',
      ],
    },
  },
  // [CH2-EXPANSION 2026-05-09] 章2 中BOSS +2
  {
    id: 'boss_frost_hammer', name: '冰锤领主', emoji: '', chapter: 2,
    baseHp: 175, baseDmg: 12, category: 'boss', bossRank: 'mid', combatType: 'warrior',
    drops: { gold: 55, relic: true, rerollReward: 3 },
    // [SUMMON 2026-05-09] 冰巨人召唤雪峦守望，每3回合
    summons: { minionId: 'ice_avalanche_watch', interval: 3, count: 1, maxTotal: 3, waveCap: 4 },
    phases: [
      { hpThreshold: 0.5, actions: [
        { type: '攻击', baseValue: 16, description: '冰锤粉碎' },
        { type: '技能', baseValue: 2, description: '冻结', scalable: false },
        { type: '攻击', baseValue: 13 },
        { type: '防御', baseValue: 18 },
      ]},
      { actions: [
        { type: '防御', baseValue: 14 },
        { type: '攻击', baseValue: 10 },
        { type: '技能', baseValue: 1, description: '虚弱', scalable: false },
      ]},
    ],
    quotes: {
      greet: [
        '冰锤锻造于千年冰河——它只认一件事：敲平一切拒绝臣服之物。',
        '我曾用一锤砸碎十层敌军盾阵。你这根骨头，够不够我暖锤头。',
        '冬王座下，我是手——而手，从不与尘土交谈。',
      ],
      dispatch: [
        '冰锤士——去。我不喜欢为一个蝼蚁弯腰。',
        '霜兵上前——让他先尝尝锤影之下的膝盖。',
        '爪牙优先——本尊的锤头只留给值得的目标。',
      ],
      enter: ['冰锤锻造于千年冰河——它只认一件事：敲平一切拒绝臣服之物。', '冰锤士——去。我不喜欢为一个蝼蚁弯腰。'],
      death: ['锤……落地……', '冰河……封冻了我的名字……', '下一个持锤之人……会为我报仇……', '（锤柄碎裂）', '冬之手……到此为止……'],
      attack: ['冰锤砸下！', '粉碎！', '跪！'],
      hurt: ['区区划痕。', '锤还在。', '还不够让锤头松手。'],
      lowHp: ['最后一锤——把天砸下来！', '冰锤全力——敲平！', '让冬天用我的死重新咆哮！'],
    },
  },
  {
    id: 'boss_winter_huntress', name: '寒霜女猎', emoji: '', chapter: 2,
    baseHp: 150, baseDmg: 10, category: 'boss', bossRank: 'mid', combatType: 'ranger',
    drops: { gold: 55, relic: true, rerollReward: 3 },
    // [SUMMON 2026-05-09] 女猎召唤暴风战狼群，每3回合，最多3只
    summons: { minionId: 'ice_storm_wolf', interval: 3, count: 1, maxTotal: 3, waveCap: 4 },
    phases: [
      { hpThreshold: 0.5, actions: [
        { type: '攻击', baseValue: 11, description: '冰棱连发' },
        { type: '技能', baseValue: 2, description: '虚弱', scalable: false },
        { type: '攻击', baseValue: 13, description: '致命一箭' },
        { type: '防御', baseValue: 10 },
      ]},
      { actions: [
        { type: '攻击', baseValue: 9 },
        { type: '技能', baseValue: 1, description: '虚弱', scalable: false },
        { type: '攻击', baseValue: 10 },
      ]},
    ],
    quotes: {
      greet: [
        '风雪里的脚印——是我给你的最后警告。',
        '我射下过一只奔腾中的雪崩。你不会比它更难瞄准。',
        '我只猎一次——因为从没需要第二次。',
      ],
      dispatch: [
        '雪狼群——上。我要先看清你的步法。',
        '冰晶猎犬，去。我的弦，还不愿为你松开。',
        '我不浪费箭——爪牙够用了。',
      ],
      enter: ['风雪里的脚印——是我给你的最后警告。', '雪狼群——上。我要先看清你的步法。'],
      death: ['箭……偏了……', '今夜的风……怪我……', '（雪地里只留下一截冰箭）', '下一次……我会更近再放……', '雪融时……我的弓……会被找到……'],
      attack: ['致命一箭！', '冰棱连发！', '咻——'],
      hurt: ['擦伤罢了。', '距离没算准。', '下一箭会学会教训。'],
      lowHp: ['搭上最后一支箭——必须命中心脏！', '屏息——所有风都为这一箭让路！', '我的弓——做最后一次弯折！'],
    },
  },
  // 章2 终Boss
  {
    id: 'boss_frost_lich', name: '霜之巫妖王', emoji: '', chapter: 2,
    baseHp: 320, baseDmg: 15, category: 'boss', bossRank: 'final', combatType: 'warrior',
    drops: { gold: 0, relic: false },
    // [SUMMON 2026-05-09] 终BOSS 二阶段（hp<50%）召唤冰棺咒灵
    summons: { minionId: 'ice_coffin_wraith', interval: 4, count: 1, maxTotal: 3, waveCap: 4, hpThreshold: 0.5 },
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
      // [BOSS-LINES-v3 2026-05-08] 章2 终Boss · 霜之巫妖王
      greet: [
        '永恒寒冬以我之名加冕——而你，配不上让本王亲自挥剑。',
        '霜之哀伤已经千年没有饮过新鲜的灵魂。今晚，它会有的。',
        '我曾让一支远征军在三回合内全部冻成冰雕。你，也想试试？',
      ],
      dispatch: [
        '霜之死徒，去。把他的灵魂，带回我的剑里。',
        '不必脏了王者的剑刃——死徒先行，让他先尝亡魂滋味。',
        '我从不重复出招两次——爪牙们，把第一次留给他。',
      ],
      enter: ['永恒寒冬以我之名加冕——而你，配不上让本王亲自挥剑。', '霜之死徒，去。把他的灵魂，带回我的剑里。'],
      death: [
        '不……霜之哀伤……不会……',
        '永恒的寒冬……终结了？',
        '王座……崩塌了……',
        '巫妖王……也会死？……荒谬……',
        '我的灵魂……也躲不开自己的剑……',
      ],
      attack: ['霜之哀伤！', '臣服于寒冰！', '灵魂收割！'],
      hurt: [
        '不过是……暖风拂面。',
        '你的抵抗……毫无意义。',
        '剑锋还不够冷。',
        '我活了千年，可不止见过你这种英雄。',
        '想伤本王？再练三百年。',
      ],
      phase2_taunt: [
        '暖风……居然划破了我的霜甲？有意思。',
        '本王千年没出过剑。今天，为了你，破例。',
        '你让我流了血——那寒冬就要翻倍偿还。',
      ],
      lowHp: [
        '所有人——都将臣服于寒冰王座！',
        '死亡，并不是终结！',
        '霜之哀伤，喝饱他的灵魂！',
      ],
    },
  },
  // 章3 中Boss
  {
    id: 'boss_ragnaros', name: '炎魔之王', emoji: '', chapter: 3,
    baseHp: 200, baseDmg: 12, category: 'boss', bossRank: 'mid', combatType: 'warrior',
    drops: { gold: 60, relic: true },
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
      // [BOSS-LINES-v3 2026-05-08] 章3 中Boss · 炎魔之王
      greet: [
        '熔火之核沉睡千年——只为等一个值得灼烧的灵魂。可惜，不是你。',
        '我的火焰能熔穿七层王城的城墙。你这身骨头，怕是经不起一阵呼吸。',
        '渣渣！打扰我的沉睡，你将以灰烬的方式告别这个世界。',
      ],
      dispatch: [
        '余烬卫，将他化作我醒来的祭品。要慢一点……我喜欢听他喊叫。',
        '熔岩仆从——上前。让他先在烈焰里跳一支舞，再来见我。',
        '我连抬手都嫌烫——爪牙们，去把他烤熟。',
      ],
      enter: ['熔火之核沉睡千年——只为等一个值得灼烧的灵魂。可惜，不是你。', '余烬卫，将他化作我醒来的祭品。要慢一点……我喜欢听他喊叫。'],
      death: [
        '不——！岩浆……在退却……',
        '我会……回来的……',
        '炎魔不死……只是沉睡……',
        '这把锤子……也冷却了吗……',
        '熔火之核……熄灭了……',
      ],
      attack: ['岩浆之锤！', '烈焰冲击！', '燃烧吧——！'],
      hurt: [
        '渣渣！你敢伤我？',
        '这点伤……不算什么！',
        '冷武器？也想穿透我的火甲？',
        '一只蝼蚁，却咬了我一口。',
        '燃烧得不够旺，让你不知厉害。',
      ],
      lowHp: [
        '烈焰最后的爆发——焚尽一切！',
        '燃烧！继续燃烧！',
        '炎魔之怒——连熔岩都要沸腾！',
      ],
    },
  },
  // [CH3-EXPANSION 2026-05-09] 章3 中BOSS +2
  {
    id: 'boss_magma_tyrant', name: '岩浆暴君', emoji: '', chapter: 3,
    baseHp: 180, baseDmg: 13, category: 'boss', bossRank: 'mid', combatType: 'guardian',
    drops: { gold: 55, relic: true, rerollReward: 3 },
    // [SUMMON 2026-05-09] 暴君召唤地狱火犬，每3回合
    summons: { minionId: 'lava_hound', interval: 3, count: 1, maxTotal: 3, waveCap: 4 },
    phases: [
      { hpThreshold: 0.5, actions: [
        { type: '攻击', baseValue: 16, description: '熔岩巨锤' },
        { type: '防御', baseValue: 26 },
        { type: '技能', baseValue: 3, description: '灼烧', scalable: false },
        { type: '攻击', baseValue: 12 },
      ]},
      { actions: [
        { type: '防御', baseValue: 18 },
        { type: '攻击', baseValue: 10 },
        { type: '技能', baseValue: 2, description: '虚弱', scalable: false },
      ]},
    ],
    quotes: {
      greet: [
        '熔岩从我足下流出——我走一步，大地就要塌一层。',
        '我统治的是熔岩，不是什么王座。王座会冷，熔岩不会。',
        '你走进的每一块岩壁，都是我睡过的床。',
      ],
      dispatch: [
        '熔岩犬，去。我要看看你能撑到第几口火焰。',
        '熔铁爪牙——先行。我不屑踩你这种脆壳。',
        '小兵上。只要你能活着见到我，我就亲自烤熟你。',
      ],
      enter: ['熔岩从我足下流出——我走一步，大地就要塌一层。', '熔岩犬，去。我要看看你能撑到第几口火焰。'],
      death: ['熔岩……降温了……', '王座……成灰……', '（一声轰然，没有任何话语）', '下一座火山，会再有暴君……', '我的名字会被刻在熔岩石上……等待复活……'],
      attack: ['熔岩巨锤！', '熔地！', '跪下！'],
      hurt: ['钢铁外壳，不过皮毛被烧。', '烫——也比被劈强。', '一点小伤，不影响我沉睡。'],
      lowHp: ['最后一锤——把我连同熔岩砸向你！', '熔岩核心——为我释放全部高温！', '和我一起沉入火中！'],
    },
  },
  {
    id: 'boss_soulforge_warlock', name: '魂炉术士', emoji: '', chapter: 3,
    baseHp: 150, baseDmg: 10, category: 'boss', bossRank: 'mid', combatType: 'caster',
    drops: { gold: 55, relic: true, rerollReward: 3 },
    // [SUMMON 2026-05-09] 术士召唤小恶魔，每3回合
    summons: { minionId: 'lava_imp', interval: 3, count: 1, maxTotal: 4, waveCap: 4 },
    phases: [
      { hpThreshold: 0.5, actions: [
        { type: '技能', baseValue: 1, description: '诅咒注入', scalable: false, curseDice: 'cursed', curseDiceCount: 1 },
        { type: '攻击', baseValue: 12, description: '魂炉熔诅' },
        { type: '技能', baseValue: 3, description: '灼烧', scalable: false },
        { type: '防御', baseValue: 12 },
      ]},
      { actions: [
        { type: '攻击', baseValue: 10 },
        { type: '技能', baseValue: 2, description: '易伤', scalable: false },
        { type: '技能', baseValue: 2, description: '灼烧', scalable: false },
      ]},
    ],
    quotes: {
      greet: [
        '我把灵魂丢进熔炉——看它融成什么，就成什么。',
        '你的灵魂是什么质地？——正好，我今天想试炼一口新锭。',
        '魂炉从不熄火。今晚，你来添一把薪。',
      ],
      dispatch: [
        '锻灵们，起。先把他的意志敲软。',
        '魂焰仆从——上场。让他闻闻自己魂魄的焦味。',
        '爪牙打前阵。我好专心炼这一勺新灵。',
      ],
      enter: ['我把灵魂丢进熔炉——看它融成什么，就成什么。', '锻灵们，起。先把他的意志敲软。'],
      death: ['炉——冷了……', '灵魂……炸开……', '熔不化的东西……也有吗……', '（熔炉塌陷的巨响）', '我的熔炉……将为别人所用……'],
      attack: ['魂炉熔诅！', '炼魂刃！', '熔！'],
      hurt: ['炉盖松动，不算大事。', '灵魂滴水，不够溅起火花。', '刺我一下？我回你一炉。'],
      lowHp: ['最后的魂焰——把我自己一起炼进去！', '熔！熔！熔！—— 通通变成我的刃！', '魂炉全开！一起进熔化池！'],
    },
  },
  // 章3 终Boss
  {
    id: 'boss_deathwing', name: '熔火死翼', emoji: '', chapter: 3,
    baseHp: 380, baseDmg: 16, category: 'boss', bossRank: 'final', combatType: 'caster',
    drops: { gold: 0, relic: false },
    // [SUMMON 2026-05-09] 终BOSS 二阶段（hp<50%）召唤小恶魔
    summons: { minionId: 'lava_imp', interval: 4, count: 1, maxTotal: 4, waveCap: 4, hpThreshold: 0.5 },
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
      // [BOSS-LINES-v3 2026-05-08] 章3 终Boss · 熔火死翼
      greet: [
        '大地在我翼下战栗，王城在我焰下成灰。区区凡夫，妄图与我对视？',
        '我用一次咆哮就劈开了一座海。你以为你能撑过两次？',
        '末日之翼一展开，整片大陆都要重新画。你不过是地图边角的灰。',
      ],
      dispatch: [
        '黑龙仆从——上。让他先体会一次"灾难"，再来我面前承受第二次。',
        '余烬之翼，去。我连转头都嫌费劲。',
        '别让他靠近——爪牙们，把他化作焦土的一部分。',
      ],
      enter: ['大地在我翼下战栗，王城在我焰下成灰。区区凡夫，妄图与我对视？', '黑龙仆从——上。让他先体会一次"灾难"，再来我面前承受第二次。'],
      death: [
        '不……我是……大地的毁灭者……怎么会……',
        '（咆哮着坠入岩浆）',
        '鳞片……在剥落……',
        '大灾变……就止步于此了吗……',
        '世界……总会有人取代我，毁灭它……',
      ],
      attack: ['大灾变！', '熔岩吐息！', '世界……在燃烧！'],
      hurt: [
        '你伤到了……我的钢铁之躯？',
        '可笑……',
        '区区凡铁，也想刻穿龙鳞？',
        '一片鳞片下，是百年的厚甲。',
        '别得意——下一击我会让你后悔。',
      ],
      phase2_taunt: [
        '你……竟然能在我翼下留下伤痕？',
        '鳞片掉一片不算什么——真正的灾变还没开始。',
        '小虫子，你激怒了一条古龙。准备好尖叫吧。',
      ],
      lowHp: [
        '即使我倒下——世界也已面目全非！',
        '用我的血，灌溉这片焦土！',
        '大地龟裂吧——与我同毁！',
      ],
    },
  },
  // 章4 中Boss
  {
    id: 'boss_archimonde', name: '深渊领主', emoji: '', chapter: 4,
    baseHp: 200, baseDmg: 11, category: 'boss', bossRank: 'mid', combatType: 'caster',
    drops: { gold: 60, relic: true },
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
      // [BOSS-LINES-v3 2026-05-08] 章4 中Boss · 深渊领主
      greet: [
        '燃烧军团跨越万千星海——而你的命，连一星烬火都不值。',
        '我已征服一千个世界。这只是第一千零一个。',
        '看看你脚下的星辰——它们死前都尖叫过我的名字。',
      ],
      dispatch: [
        '邪能爪牙，去吞噬他。让他在死前明白：抵抗，本就是亵渎。',
        '军团是无穷的——爪牙们，让他先尝尝其中之一。',
        '我不亲手处理虫子。深渊里有的是嘴，乐意为我效劳。',
      ],
      enter: ['燃烧军团跨越万千星海——而你的命，连一星烬火都不值。', '邪能爪牙，去吞噬他。让他在死前明白：抵抗，本就是亵渎。'],
      death: [
        '不……军团……不会……',
        '我会……在扭曲虚空中……重生！',
        '燃烧军团……停止征伐……？',
        '虚空……也会抛弃我吗……',
        '一千个世界陪葬……都换不回我的不甘……',
      ],
      attack: ['暗影之手！', '邪能风暴！', '毁灭一切！'],
      hurt: [
        '你……竟敢？',
        '渺小的虫子……',
        '这点疼痛，连虚空里的回声都不如。',
        '邪能护甲，岂会被你劈裂？',
        '别得意得太早。军团从不为一击改变计划。',
      ],
      lowHp: [
        '燃烧吧——用你的世界作为我的燃料！',
        '军团，降临！',
        '邪能，流入我的血脉吧！',
      ],
    },
  },
  // [CH4-EXPANSION 2026-05-09] 章4 中BOSS +2
  {
    id: 'boss_void_inquisitor', name: '虚空审判官', emoji: '', chapter: 4,
    baseHp: 170, baseDmg: 11, category: 'boss', bossRank: 'mid', combatType: 'priest',
    drops: { gold: 55, relic: true, rerollReward: 3 },
    // [SUMMON 2026-05-09] 审判官召唤暗影刺客，每3回合
    summons: { minionId: 'shadow_assassin', interval: 3, count: 1, maxTotal: 3, waveCap: 4 },
    phases: [
      { hpThreshold: 0.5, actions: [
        { type: '技能', baseValue: 2, description: '易伤', scalable: false },
        { type: '攻击', baseValue: 13, description: '虚空审决' },
        { type: '技能', baseValue: 3, description: '剧毒', scalable: false },
        { type: '防御', baseValue: 18 },
      ]},
      { actions: [
        { type: '技能', baseValue: 1, description: '虚弱', scalable: false },
        { type: '攻击', baseValue: 10 },
        { type: '技能', baseValue: 2, description: '剧毒', scalable: false },
      ]},
    ],
    quotes: {
      greet: [
        '虚空议会——已对你作出终审判决。',
        '我带来的不是问答，是执行。',
        '每一个灵魂在我面前都只有一次机会——不，你连那一次都错过了。',
      ],
      dispatch: [
        '执法侍者，出列。让他先感受\'审判\'这个词的重量。',
        '爪牙——执行初步判决。我保留对复杂案件的亲自处置。',
        '我不动手——罪名需要被亲手证明，但宣判只需一个眼神。',
      ],
      enter: ['虚空议会——已对你作出终审判决。', '执法侍者，出列。让他先感受\'审判\'这个词的重量。'],
      death: ['判决……被撤回了？……', '虚空议会……会记住这个名字……', '第一次……有人推翻了我的判决……', '（权杖坠地）', '下一位审判官……会更严厉……'],
      attack: ['虚空审决！', '宣判！', '罪有应得！'],
      hurt: ['不敬——记录在案。', '污了圣服，加重罪行。', '哼。'],
      lowHp: ['以我性命——作最后一纸判决！', '权杖——把所有罪全部宣读出来！', '虚空议会——倾巢出动！'],
    },
  },
  {
    id: 'boss_chaos_tactician', name: '混沌谋略家', emoji: '', chapter: 4,
    baseHp: 155, baseDmg: 10, category: 'boss', bossRank: 'mid', combatType: 'caster',
    drops: { gold: 55, relic: true, rerollReward: 3 },
    // [SUMMON 2026-05-09] 谋略家召唤邪能术士，每3回合
    summons: { minionId: 'shadow_warlock', interval: 3, count: 1, maxTotal: 3, waveCap: 4 },
    phases: [
      { hpThreshold: 0.5, actions: [
        { type: '攻击', baseValue: 12, description: '混乱之触' },
        { type: '技能', baseValue: 1, description: '诅咒注入', scalable: false, curseDice: 'cursed', curseDiceCount: 1 },
        { type: '技能', baseValue: 2, description: '虚弱', scalable: false },
        { type: '攻击', baseValue: 10 },
      ]},
      { actions: [
        { type: '攻击', baseValue: 9 },
        { type: '技能', baseValue: 2, description: '易伤', scalable: false },
        { type: '防御', baseValue: 12 },
      ]},
    ],
    quotes: {
      greet: [
        '我不需要你理解我的棋局——你的任务是成为一枚被牺牲的子。',
        '混沌不是无序——是我还没向你解释的那种秩序。',
        '你脑子里每一个\'意外\'，其实都是我三回合前埋下的注脚。',
      ],
      dispatch: [
        '小卒们——布阵。我的价值不在于挥剑，在于预言谁该倒下。',
        '爪牙先行。我还在计算下一个奇迹该如何解释。',
        '先让棋子去消耗他——我需要看他的反应速度。',
      ],
      enter: ['我不需要你理解我的棋局——你的任务是成为一枚被牺牲的子。', '小卒们——布阵。我的价值不在于挥剑，在于预言谁该倒下。'],
      death: ['这一步——我没算进去……', '原来……有人不按棋谱走……', '棋盘……被掀翻了……', '（笔落地）', '下一局……我会多留一颗后手……'],
      attack: ['混乱之触！', '将军！', '落子！'],
      hurt: ['这一子——我低估了。', '棋盘上多了一粒灰尘。', '走得太急，我容后调整。'],
      lowHp: ['最后一子——把整个棋盘翻过来！', '弃子——全盘皆毒！', '混沌最终解——你也一起被解出！'],
    },
  },
  // 章4 终Boss
  {
    id: 'boss_kiljaeden', name: '暗影之王', emoji: '', chapter: 4,
    baseHp: 380, baseDmg: 16, category: 'boss', bossRank: 'final', combatType: 'caster',
    drops: { gold: 0, relic: false },
    // [REVIVE 2026-05-09] 死亡分裂为 2 只暗影刺客（半血，影分身）
    revive: { reviveHpRatio: 0.5, splitInto: 2, splitMinionId: 'shadow_assassin' },
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
      // [BOSS-LINES-v3 2026-05-08] 章4 终Boss · 暗影之王
      greet: [
        '你以为是你选择了走到这里？……不。这是我编织的剧本，第七幕，独你一人。',
        '欺骗者从不亲自杀人——我只让你的恐惧替我动手。',
        '从你踏进这扇门起，命运就已经写好了。剩下的，只是表演。',
      ],
      dispatch: [
        '幻影们——上场吧。先让他怀疑自己存在，再让他怀疑自己死亡。',
        '影子里的同伴们，去陪他玩玩。死前最好让他笑出声来。',
        '我不必出手——你眼前的每一道阴影，都已经在动手了。',
      ],
      enter: ['你以为是你选择了走到这里？……不。这是我编织的剧本，第七幕，独你一人。', '幻影们——上场吧。先让他怀疑自己存在，再让他怀疑自己死亡。'],
      death: [
        '虚空……会记住……这一天……',
        '不可能……欺骗者……怎会被欺骗……',
        '这竟然……不是幻象……',
        '我的布局……竟在此崩塌……',
        '原来……剧本，也有写错的一页……',
      ],
      attack: ['黑暗终焉！', '邪能陨石！', '所有生命——终结吧！'],
      hurt: [
        '有趣……你确实……有些能耐。',
        '欺骗者……不惧伤痛。',
        '这一击……是我让你打的，你信吗？',
        '剧本里写过这一刀。我没说错台词。',
        '虚空允许你伤我一次——下一次，没有。',
      ],
      phase2_taunt: [
        '剧本……出现了偏差？这页我没写过。',
        '有趣。你打破了第一幕的预设。第二幕会更黑。',
        '连幻影都伤到我了——这局面，我自己都好奇结局。',
      ],
      lowHp: [
        '用虚空的全部力量——毁灭这个世界！',
        '你走进的，是更深的陷阱！',
        '扭曲虚空，打开吧！',
      ],
    },
  },
  // 章5 中Boss
  {
    id: 'boss_titan_watcher', name: '泰坦看守者', emoji: '', chapter: 5,
    baseHp: 200, baseDmg: 12, category: 'boss', bossRank: 'mid', combatType: 'guardian',
    drops: { gold: 60, relic: true },
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
      // [BOSS-LINES-v3 2026-05-08] 章5 中Boss · 泰坦看守者
      greet: [
        '泰坦的秩序写在我的核心。你的存在——是宇宙级的拼写错误。',
        '我守过的世界比你呼吸过的次数还多。多你一个，不嫌多。',
        '入侵者协议·已激活。判决·正在生成。结果·一目了然。',
      ],
      dispatch: [
        '执行肃清协议。子程序——出动。在他抵达本体之前，将其格式化。',
        '辅助单元，启动。让他先与我的复制体交谈，了结自己。',
        '本体不必参与基础任务——爪牙们，处理他。',
      ],
      enter: ['泰坦的秩序写在我的核心。你的存在——是宇宙级的拼写错误。', '执行肃清协议。子程序——出动。在他抵达本体之前，将其格式化。'],
      death: [
        '秩序……被打破了……',
        '报告……泰坦……入侵者……无法阻止……',
        '运行异常……核心……离线……',
        '这……不符合……预测……',
        '协议·终止·永远……',
      ],
      attack: ['泰坦审判！', '秩序之光！', '修正错误！'],
      hurt: [
        '损伤……在可控范围内……',
        '你的力量……超出预期……',
        '校准·进行中。下一击·将更精准。',
        '装甲韧度·下降 0.03%。可忽略。',
        '错误已记录。即将修正。',
      ],
      lowHp: [
        '启动——最终审判协议！',
        '战斗协议升级：毁灭模式。',
        '修正：消灭威胁优先级——最高。',
      ],
    },
  },
  // [CH5-EXPANSION 2026-05-09] 章5 中BOSS +2
  {
    id: 'boss_chrono_archon', name: '时流执政', emoji: '', chapter: 5,
    baseHp: 180, baseDmg: 12, category: 'boss', bossRank: 'mid', combatType: 'caster',
    drops: { gold: 55, relic: true, rerollReward: 3 },
    // [SUMMON 2026-05-09] 时流执政召唤时砂法师，每3回合
    summons: { minionId: 'eternal_chronomancer', interval: 3, count: 1, maxTotal: 3, waveCap: 4 },
    phases: [
      { hpThreshold: 0.5, actions: [
        { type: '攻击', baseValue: 14, description: '时流撕裂' },
        { type: '技能', baseValue: 2, description: '易伤', scalable: false },
        { type: '防御', baseValue: 18 },
        { type: '攻击', baseValue: 11 },
      ]},
      { actions: [
        { type: '攻击', baseValue: 10 },
        { type: '技能', baseValue: 2, description: '虚弱', scalable: false },
        { type: '攻击', baseValue: 12 },
      ]},
    ],
    quotes: {
      greet: [
        '时流在我手里是一卷可以翻阅的书——你的结局，我已经读到最后一页。',
        '你每一次挥剑，对我来说都是已经发生的往事。',
        '我站在你未来的尽头——回望你此刻的挣扎。',
      ],
      dispatch: [
        '时流侍从——从过去与未来同时召唤出来。',
        '分身们，去。让他不知道自己正在与第几个我交手。',
        '爪牙先行。我要从你下一步的选择里，挑最有趣的继续。',
      ],
      enter: ['时流在我手里是一卷可以翻阅的书——你的结局，我已经读到最后一页。', '时流侍从——从过去与未来同时召唤出来。'],
      death: ['这一页……没有记录过……', '时流……抛弃了我的预言……', '骰子……比时间更早一步……', '（沙漏倒置却停止流动）', '下一次循环……我会记得提防你……'],
      attack: ['时流撕裂！', '时之刃！', '翻页！'],
      hurt: ['时差……被扰了一步。', '剧本没写到这。', '下一页会更厚——我保证。'],
      lowHp: ['把所有时流——逆向灌入最后一击！', '过去与未来——合为同一刃！', '时流尽头——与我共葬！'],
    },
  },
  {
    id: 'boss_celestial_archon', name: '圣辉执政', emoji: '', chapter: 5,
    baseHp: 170, baseDmg: 11, category: 'boss', bossRank: 'mid', combatType: 'priest',
    drops: { gold: 55, relic: true, rerollReward: 3 },
    // [SUMMON 2026-05-09] 圣辉执政召唤永光吟唱者，每3回合
    summons: { minionId: 'eternal_lightcantor', interval: 3, count: 1, maxTotal: 3, waveCap: 4 },
    phases: [
      { hpThreshold: 0.5, actions: [
        { type: '技能', baseValue: 2, description: '易伤', scalable: false },
        { type: '攻击', baseValue: 13, description: '圣辉审判' },
        { type: '防御', baseValue: 20 },
        { type: '技能', baseValue: 3, description: '剧毒', scalable: false },
      ]},
      { actions: [
        { type: '技能', baseValue: 1, description: '虚弱', scalable: false },
        { type: '攻击', baseValue: 10 },
        { type: '防御', baseValue: 14 },
      ]},
    ],
    quotes: {
      greet: [
        '圣辉议会——已将你列于\'可以审判之物\'的末位。',
        '我是圣光的手。圣光不怕脏——因为我替它脏。',
        '凡活着的生物，都要为活着这件事向我交账。',
      ],
      dispatch: [
        '圣辉护卫——执行初审。我只处理不可饶恕的罪人。',
        '爪牙出动。让他先听完审问词，再开始求饶也不迟。',
        '我不沾凡尘——侍者们替我念起诉状。',
      ],
      enter: ['圣辉议会——已将你列于\'可以审判之物\'的末位。', '圣辉护卫——执行初审。我只处理不可饶恕的罪人。'],
      death: ['议会……撤回我的判例了……', '圣辉……收回了他的注视……', '（金权杖坠落成灰）', '我的审判……第一次被推翻……', '下一位议员……会更严格……'],
      attack: ['圣辉审判！', '审决！', '宣判！'],
      hurt: ['对圣者动手——罪加一等。', '圣服破了一角——不影响判决。', '哼。'],
      lowHp: ['以我性命——把最后一纸判决印在他灵魂上！', '圣辉全开——照穿他每一寸阴影！', '议会终审——我与他一同归于尘埃！'],
    },
  },
  // 章5 终Boss
  {
    id: 'boss_eternal_lord', name: '永恒主宰', emoji: '', chapter: 5,
    baseHp: 480, baseDmg: 18, category: 'boss', bossRank: 'final', combatType: 'caster',
    drops: { gold: 0, relic: false },
    // [SUMMON+REVIVE 2026-05-09] 终极 BOSS 双机制：召唤时砂法师 + 死亡分裂成 2 只穹苍骑兵
    summons: { minionId: 'eternal_chronomancer', interval: 4, count: 1, maxTotal: 3, waveCap: 4, hpThreshold: 0.7 },
    revive: { reviveHpRatio: 0.5, splitInto: 2, splitMinionId: 'eternal_skyknight' },
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
      // [BOSS-LINES-v3 2026-05-08] 章5 终Boss · 永恒主宰
      greet: [
        '每个时代都有人走到这里。每个走到这里的人，最后都成了我王座上的灰。',
        '我已经看你失败过无数次了，骰子掷者。这一次也不会例外。',
        '在永恒面前，你的勇气、你的运气，都只是一瞬的闪光。',
      ],
      dispatch: [
        '永恒侍从——出列。让他先与时间为敌，再与我，为终结。',
        '过去的英雄、未来的英雄，都先在我的爪牙手下倒下。',
        '我从不亲自结束故事——序章，由仆从来唱。',
      ],
      enter: ['每个时代都有人走到这里。每个走到这里的人，最后都成了我王座上的灰。', '永恒侍从——出列。让他先与时间为敌，再与我，为终结。'],
      death: [
        '不……不可能……永恒……怎么会……',
        '你……究竟……是什么？……永恒……也有尽头……',
        '永恒的谎言……终被戳破……',
        '骰子掷者……你赢了……这一次……',
        '原来在所有时代之外……还有你这种存在……',
      ],
      attack: ['终极之光！', '永恒之力，碾碎你！', '渺小者，跪下！'],
      hurt: [
        '哼……有点意思。',
        '永恒之躯……竟被撼动……',
        '我活过千万纪元，从未被这样冒犯。',
        '骰子……竟能伤永恒？',
        '记下这一击——它会成为传说，然后被我抹去。',
      ],
      phase2_taunt: [
        '骰子……真的伤到我了？让我记下这一刻——它很快会被抹去。',
        '有趣……所有时代里，没人让我走到这一步。',
        '你让永恒流血了。那我会让你流尽时间。',
      ],
      lowHp: [
        '永恒动摇了——但我绝不会就此终结！终极之光——爆发！',
        '时间之外的力量——听我号令！',
        '我的存在即永恒——何谈倒下！',
      ],
    },
  },
];

/** 可升级牌型池（用于事件中随机选择） */
export const UPGRADEABLE_HAND_TYPES = ['对子', '连值', '顺子', '同元素', '葡萄'];
