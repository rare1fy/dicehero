# Coder 日志 - TURN-ARCHAEOLOGY-R2（第二轮深挖）

日期: 2026-04-27
任务: 挖出 dicehero2 React 版的全部系统（敌人/骰子/遗物/事件/挑战/商店/灵魂晶/地图/章节）
触发: 刘叔指令 "挖得再详细一些，事无巨细"
结果: [PASS]

---

## 0. 本轮新增扫过的文件

| 模块 | 文件 |
|---|---|
| 职业/初始 | `data/classes.ts`, `config/balance/player.ts` (含 DEPTH_SCALING 15级系数表) |
| 配平 | `config/balance/enemy.ts`, `config/balance/world.ts` |
| 敌人配置表 | `config/enemyNormal.ts` (5章×5种=20种普通怪), `config/enemyEliteBoss.ts` (10精英+10Boss) |
| 敌人AI | `logic/enemyAI.ts` 主流程, `logic/enemySkills.ts` (Priest/Caster), `logic/elites.ts` (精英/Boss 补强), `logic/enemyDialogue.ts`, `logic/enemyStatusSettlement.ts` (DOT), `logic/enemyWaveTransition.ts`, `logic/attackCalc.ts` |
| 骰子体系 | `data/dice.ts`, `data/diceBag.ts`, `data/handTypes.tsx` |
| 遗物体系 | `data/relicsCore.ts` (~40), `data/relicsAugmented.ts` (~40), `data/relicsSpecial.ts` (~10) |
| 事件 | `config/events/combatEvents.ts` (1), `config/events/shrineEvents.ts` (4), `config/events/tradeEvents.ts` (5) |
| 挑战/奖励 | `utils/instakillChallenge.ts` (洞察弱点), `logic/instakillChallengeAid.ts` (援助效果), `logic/soulCrystalCalc.ts`, `logic/lootHandler.ts` |
| 商店/伤害 | `logic/shopGenerator.ts`, `logic/damageApplication.ts` |

---

## 1. 三职业初始参数（`data/classes.ts`）

| 字段 | 战士 | 法师 | 盗贼 |
|---|---|---|---|
| hp/maxHp | **120** | 100 | 90 |
| drawCount | 3 | 3 | 3 |
| maxPlays | 1 | 1 | **2** |
| freeRerolls | 1 | 1 | 1 |
| canBloodReroll | **true** | false | false |
| 初始骰子 | std×4 + w_bloodthirst + w_ironwall | std×4 + mage_elemental + mage_reverse | std×3 + r_quickdraw + r_combomastery |
| 标签 | normalAttackMultiSelect=true | keepUnplayed=true | - |

**初始手牌上限** `drawCount=3, maxDrawCount=6`；**初始免费重投/回合=1**；**初始遗物槽=5**。

## 2. 深度 × 章节 双重缩放（DEPTH_SCALING / CHAPTER_CONFIG）

### 2.1 15 层深度系数表

| depth | hpMult | dmgMult | 说明 |
|---|---|---|---|
| 0 | 0.90 | 0.40 | 教学关 |
| 1 | 1.10 | 0.50 | 稍有肉感 |
| 2 | 1.25 | 0.60 | 开始有压力 |
| 3 | 1.50 | 0.75 | 精英层 |
| 4 | 1.20 | 0.65 | 精英后休息 |
| 5 | 1.40 | 0.80 | 热身完毕 |
| 6 | 1.20 | 0.70 | 营火前缓冲 |
| 7 | 1.80 | 1.00 | **中期Boss** |
| 8 | 1.10 | 0.60 | Boss后恢复 |
| 9 | 1.40 | 0.80 | 重新热身 |
| 10 | 1.60 | 0.90 | 后期开始 |
| 11 | 1.80 | 1.00 | 后期巅峰 |
| 12 | 2.00 | 1.10 | pre-boss精英 |
| 13 | 1.30 | 0.80 | Boss前缓冲 |
| 14 | **2.50** | **1.30** | **最终Boss** |

### 2.2 5 章章节名 + 叠加系数

| 章节 | 名称 | hpMult | dmgMult |
|---|---|---|---|
| 1 | 幽暗森林 | 1.00 | 1.00 |
| 2 | 冰封山脉 | 1.25 | 1.15 |
| 3 | 熔岩深渊 | 1.55 | 1.30 |
| 4 | 暗影要塞 | 1.90 | 1.50 |
| 5 | 永恒之巅 | **2.30** | **1.70** |

**最终敌人 hp = baseHp × depthHpMult × chapterHpMult × (难度倍率)**。
章节通关：回满 `maxHp × 0.6` + 奖励 75 金。

## 3. 地图结构（MAP_CONFIG）

### 3.1 15 层固定布局

| 层 | 类型 | 节点数 | 说明 |
|---|---|---|---|
| 0 | enemy | 1 | 教学战（必走） |
| 1 | - | 3 | 初期分路 |
| 2 | - | 5 | 扩散层 |
| 3 | - | 3 | 风险层（可出精英） |
| 4 | - | 4 | 中期分叉（可能出营火） |
| 5 | - | 5 | 扩散层 |
| 6 | - | 4 | Boss前分散（保证带营火） |
| 7 | **boss** | 1 | **中期Boss** |
| 8 | - | 3 | Boss后分路 |
| 9 | - | 5 | 扩散层 |
| 10 | - | 5 | 中后期风险 |
| 11 | - | 4 | 后期分散 |
| 12 | - | 5 | 压力层 |
| 13 | - | 4 | Boss前分散（保证带营火） |
| 14 | **boss** | 1 | **最终Boss** |

### 3.2 节点类型概率（fallback / 非 Boss 层）
```
elite     : 10%
campfire  : 12%
treasure  : 10%
merchant  : 12% (×2=24% 加权)
event     : 10%
enemy     : 剩余 ~38%
```

## 4. 敌人完整体系

### 4.1 5 种 combatType

| 类型 | 初始距离 | 行为特征 |
|---|---|---|
| **warrior** | 2 | 近战，先逼近再攻击；被减速时原地罚站 |
| **guardian** | 2 | 近战+每 2 回合（偶回合）必上盾嘲讽：`armor += atk × 1.5` |
| **ranger** | 3 | 远程直接攻击 + 追击：`主攻 = max(1, atk×0.4 + attackCount)`; `追击 = max(1, atk×0.4 + attackCount + 1)`；attackCount 每次+2 |
| **priest** | 3 | 优先级：治疗友军(+atk×4.0)→自疗(+atk×3.0)→盟友增益(力量+3 或 armor+atk×3)→玩家减益（35%虚弱/其后25%易伤/剩40%塞碎裂骰0.5或诅咒骰0.5） |
| **caster** | 3 | DoT 3 选 1：40% 毒雾(`max(2, atk×0.4)`)；30% 火球(`max(1, atk×0.3)`灼烧 3 回合)；30% 诅咒(毒+虚弱2回合) |

**combatType 乘数**：warrior 攻击 ×1.3；ranger 主攻 ×0.4；slow ×0.5（仅对 ranger）；weak ×0.75（下限1）；vulnerable ×1.5；strength +value。

### 4.2 20 种普通怪（5 章 × 各 5 种）

> 每只都有 6 类语音（enter/death/attack/defend/skill/heal/hurt/lowHp）。

#### 第 1 章 · 幽暗森林（教学段）
| id | 名 | HP | Dmg | 类型 | 特色 |
|---|---|---|---|---|---|
| forest_ghoul | 食永鬼 | 28 | 7 | warrior | 撕咬9/虚弱 |
| forest_spider | 剧毒蛛母 | 18 | 3 | ranger | 剧毒2/攻击4 |
| forest_treant | 腐化树人 | 42 | 4 | guardian | 防御8/攻5/根须缠绕 |
| forest_banshee | 哭嚎女妖 | 16 | 3 | caster | 易伤1/攻5/虚弱 |
| forest_wolf_priest | 月光狼灵 | 20 | 2 | priest | 剧毒2/易伤/攻4 |

#### 第 2 章 · 冰封山脉
| id | 名 | HP | Dmg | 类型 | 特色 |
|---|---|---|---|---|---|
| ice_yeti | 雪原雪人 | 36 | 9 | warrior | 冰拳9/11 |
| ice_mage | 霜寒女巫 | 18 | 4 | caster | 冻结/虚弱 |
| ice_wolf | 霜齿狼 | 22 | 5 | ranger | 冰霜撕咬/灼烧1 |
| ice_golem | 寒冰石像 | 44 | 4 | guardian | 防御10/8，攻5 |

#### 第 3 章 · 熔岩深渊
| id | 名 | HP | Dmg | 类型 |
|---|---|---|---|---|
| lava_hound | 地狱火犬 | 30 | 8 | warrior |
| lava_imp | 小恶魔 | 16 | 4 | caster |
| lava_guardian | 黑铁卫士 | 48 | 5 | guardian |
| lava_shaman | 火焰萨满 | 22 | 3 | priest |

#### 第 4 章 · 暗影要塞
| id | 名 | HP | Dmg | 类型 |
|---|---|---|---|---|
| shadow_assassin | 暗影刺客 | 24 | **12** | ranger |
| shadow_felguard | 邪能卫兵 | 46 | 6 | guardian |
| shadow_warlock | 邪能术士 | 20 | 5 | caster |
| shadow_knight | 堕落死亡骑士 | 34 | 10 | warrior |

#### 第 5 章 · 永恒之巅
| id | 名 | HP | Dmg | 类型 |
|---|---|---|---|---|
| eternal_sentinel | 光铸哨兵 | 40 | 8 | guardian |
| eternal_chrono | 时光龙人 | 26 | 7 | caster |
| eternal_archer | 星界游侠 | 22 | 10 | ranger |
| eternal_priest | 泰坦祭司 | 24 | 3 | priest |

### 4.3 10 个精英（每章 2 个）

| 章 | id | 名 | HP | Dmg | 类型 | 关键技能 |
|---|---|---|---|---|---|---|
| 1 | elite_necromancer | 亡灵大师 | 85 | 8 | caster | <40%HP 亡灵大军14+剧毒3 |
| 1 | elite_alpha_wolf | 狼人首领 | 100 | 11 | warrior | 狂暴撕咬14/力量2 |
| 2 | elite_frost_wyrm | 霜龙幼崽 | 95 | 10 | caster | <30%HP 寒冰吐息18+冻结 |
| 2 | elite_ice_lord | 冰霜巨人王 | 120 | 7 | guardian | 防御20/冰锤粉碎14/冻结 |
| 3 | elite_infernal | 地狱火 | 100 | 12 | warrior | 烈焰冲击16+灼烧3 |
| 3 | elite_dark_iron | 黑铁议员 | 90 | 9 | caster | <40% 熔岩之怒16+锻造碎裂骰1 |
| 4 | elite_doomguard | 末日守卫 | 110 | 11 | warrior | 末日审判16+易伤2+诅咒骰1 |
| 4 | elite_shadow_priest | 暗影大主教 | 80 | 8 | priest | <30%HP 双DoT 剧毒3+灼烧3 |
| 5 | elite_titan_construct | 泰坦守护者 | 130 | 10 | guardian | 防御22/泰坦之锤18/虚弱2 |
| 5 | elite_void_walker | 虚空行者 | 90 | **13** | caster | <35%HP 虚空爆裂20+诅咒骰1 |

### 4.4 10 个 Boss（每章 1 中 + 1 终）

| 章 | id | 名 | HP | Dmg | 类型 | 角色 |
|---|---|---|---|---|---|---|
| 1 | boss_lich_forest | 林巫妖 | 150 | 10 | caster | 中 |
| 1 | boss_ancient_treant | 远古树王 | **300** | 15 | guardian | 终 |
| 2 | boss_frost_queen | 霜寒女王 | 160 | 10 | caster | 中 |
| 2 | boss_frost_lich | 霜之巫妖王 | **320** | 15 | warrior | 终 |
| 3 | boss_ragnaros | 炎魔之王 | 200 | 12 | warrior | 中 |
| 3 | boss_deathwing | 熔火死翼 | **380** | 16 | caster | 终 |
| 4 | boss_archimonde | 深渊领主 | 200 | 11 | caster | 中 |
| 4 | boss_kiljaeden | 暗影之王 | **380** | 16 | caster | 终 |
| 5 | boss_titan_watcher | 泰坦看守者 | 200 | 12 | guardian | 中 |
| 5 | boss_eternal_lord | 永恒主宰 | **480** | 18 | caster | 终 |

### 4.5 精英/Boss 特殊机制（ELITE_CONFIG）

| 机制 | 精英（HP>80 且 ≤200） | Boss（HP>200） |
|---|---|---|
| HP 阈值 | 80~200 | >200 |
| 塞碎裂骰 | battleTurn%3==0 | battleTurn%3==0 (Boss<40%HP 时优先诅咒骰，period=2) |
| 叠护甲 | `armor += atk × 1.5`，每 3 回合 | `armor += atk × 2.0`，每 2 回合 |

### 4.6 敌人 AI 执行顺序（enemyAI.executeEnemyTurn）

```
0. setGame: isEnemyTurn=true, bloodRerollCount=0, comboCount=0, lastPlayHandType=undefined, blackMarketUsedThisTurn=false
1. 玩家中毒结算（poison.value 立即触发，value−=1，≤0 移除；致死→沙漏或 gameover）等待 600ms
2. 敌人灼烧结算（settleEnemyBurn）：全队同步；任一死亡触发 allDead 判断；等待 600ms
3. 敌人中毒结算（settleEnemyPoison + tickStatuses）；等待 600ms
4. 遍历存活敌人（每只延迟 350ms 轮次）：
   - freeze.duration>0 → 跳过 + "冻结"浮字 + shake 动画
   - slow + 近战 + distance>0 → 原地罚站
   - 近战 + distance>0 → distance−=1 "正在逼近..."
   - Guardian + battleTurn%2==0 → 上盾嘲讽
   - Priest → executePriestSkill
   - Caster → executeCasterSkill
   - Warrior/Ranger/其他 → 直接攻击
     • 伤害用 getEffectiveAttackDmg
     • armor 吸收 → hp
     • 触发 on_damage_taken 遗物
     • 触发 w_fury 骰子（furyBonusDamage += furyLevel）
     • Ranger 追击（延迟 250ms）
5. 精英/Boss：processEliteDice（塞碎裂骰/诅咒骰）
6. 精英/Boss：processEliteArmor（叠护甲）
7. 回合结束：battleTurn+=1；玩家 burn 结算；tickStatuses；isEnemyTurn=false
```

**高伤嘲讽**：damage ≥ 15 时 600ms 后播 hurt 台词 2000ms；普通攻击 30% 概率立即播 attack 台词。

## 5. 骰子大全（`data/dice.ts`）

### 5.1 职业无关通用池

| id | 名 | faces | 稀有度 | onPlay |
|---|---|---|---|---|
| standard | 普通骰子 | [1,2,3,4,5,6] | common | - |
| heavy | 灌铅骰子 | [4,4,5,5,6,6] | uncommon | - (传承:+bonusDamage) |
| elemental | 元素骰子 | [1,2,3,4,5,6] + isElemental | rare | - (抽到时随机坍缩元素) |
| blade | 锋刃骰子 | [1,2,3,4,5,6] | rare | bonusDamage:5 |
| amplify | 倍增骰子 | [1,2,3,4,5,6] | rare | bonusMult:1.2 |
| split | 分裂骰子 | [1,2,3,4,5,6] | rare | （结算时复制出 1 颗相同点数临时骰） |
| magnet | 磁吸骰子 | [1,2,3,4,5,6] | rare | （随机将 1 颗同伴骰子改为同点） |
| joker | 小丑骰子 | [1..9] | rare | 1-9 随机（有限界者遗物则上限=100） |
| chaos | 混沌骰子 | [1,1,1,6,6,6] | legendary | - |
| cursed | 诅咒骰子 | [0,0,0,0,0,0] | curse | 点数0，重投代价翻倍 |
| cracked | 碎裂骰子 | [1,1,1,2,2,2] | curse | selfDamage:2；未打出回合结束自动销毁 |
| temp_rogue | 暗影残骰 | [1,1,2,2,3,3] | common | 盗贼连击奖励，回合末销毁 |

### 5.2 职业专属骰子（示例，需 Designer 从 `r_*` / `w_*` / `mage_*` 补完）

通过 `registerClassDice()` 注入：
- 战士 `w_*`：w_bloodthirst 嗜血骰、w_ironwall 铁壁骰、w_fury 怒火骰（furyBonusDamage）、w_heavy 战士版灌铅骰…
- 法师 `mage_*`：mage_elemental 法师元素骰、mage_reverse 逆转骰、mage_prism 棱镜骰（lockElement）…
- 盗贼 `r_*`：r_quickdraw 快拔骰、r_combomastery 连击宗师骰、r_heavy 盗贼版灌铅骰…

### 5.3 骰子升级体系（Lv1→Lv3）

- **不改点数面**，只强化 onPlay 特效
- **锋刃** Lv1=+5 / Lv2=+8 / Lv3=+11（每级+3）
- **倍增** Lv1=1.2x / Lv2=1.35x / Lv3=1.5x（每级+0.15）
- **碎裂** selfDamage Lv1=2→Lv2=1→Lv3=1（每级-1，最低1）
- **无 onPlay 骰子** Lv2=+3 / Lv3=+6 bonusDamage（普通/灌铅特殊 base=4）
- **元素** Lv1=1x / Lv2=1.5x / Lv3=2x 元素效果倍率

### 5.4 元素坍缩 5 种 + 效果

| 元素 | 效果描述 |
|---|---|
| fire | 破甲爆燃：摧毁敌人所有护甲，附加真实伤害，并施加点数灼烧 |
| ice | 绝对控制：冻结敌人 1 回合，点数结算减半 |
| thunder | 传导AOE：对其他敌人造成等量穿透伤害 |
| poison | 叠层斩杀：施加毒层，跨回合持续掉血 |
| holy | 经济净化：恢复等同点数的生命值 |

### 5.5 17 种牌型（HAND_TYPES）

| 优先级 | id | 名 | 条件 | mult | 特效 |
|---:|---|---|---|---|---|
| 1 | royal_element | 皇家元素顺 | 同元素+1-6连 | 16.0 | AOE+特效200%+50护甲 |
| 2 | element_house | 元素葫芦 | 同元素+葫芦 | 6.0 | 特效翻倍+25护甲 |
| 3 | element_straight | 元素顺 | 同元素+顺子 | 5.5 | AOE+特效翻倍 |
| 4 | six_of_a_kind | 六条 | 6颗同点 | 15.0 | 易伤 3 回合 |
| 5 | five_of_a_kind | 五条 | 5颗同点 | 9.0 | 易伤 2 回合 |
| 6 | four_of_a_kind | 四条 | 4颗同点 | 6.0 | 易伤 2 回合 |
| 7 | full_house | 葫芦 | 3+2 / 3+3 / 4+2 | 4.0 | +15 护甲 |
| 8 | same_element | 同元素 | ≥4颗同元素 | 3.0 | 特效翻倍 |
| 9 | straight_6 | 6顺 | 1-6连 | 5.0 | AOE+虚弱+10护甲 |
| 10 | straight_5 | 5顺 | 5连 | 3.5 | AOE+虚弱 |
| 11 | straight_4 | 4顺 | 4连 | 2.5 | AOE+虚弱 |
| 12 | straight_3 | 顺子 | 3连 | 1.5 | AOE |
| 13 | three_of_a_kind | 三条 | 3颗同点 | 3.5 | 易伤 2 回合 |
| 14 | three_pair | 三连对 | 2+2+2 | 3.5 | +8 护甲 |
| 15 | two_pair | 连对 | 2+2 | 2.5 | +5 护甲 |
| 16 | pair | 对子 | 2颗同点 | 2.0 | - |
| 17 | high_card | 普通攻击 | 兜底 | 1.0 | 无 |

## 6. 遗物大全（~85 个；按稀有度分类）

### 6.1 Common 遗物（12 个）

| id | 名 | trigger | 效果 |
|---|---|---|---|
| grindstone | 磨刀石 | on_play | ≤2颗骰子牌型+12基础伤害 |
| heavy_metal_core | 重金属核心 | on_play | 每颗灌铅骰+10基础 |
| chaos_pendulum | 混沌摆锤 | on_play | 奇数+12，偶数+3HP+净化1负面 |
| iron_skin_relic | 稳健之心 | on_play | 未重投则出牌后+1免费重投 |
| scattershot_relic | 散射弹幕 | on_play | 普攻点数≥15每颗+3基础 |
| basic_instinct_relic | 基本直觉 | on_play | 普攻额外+点数150%伤害 |
| merchants_eye_relic | 点石成金 | on_play | 普攻+5金 |
| healing_breeze | 治愈之风 | on_play | 每次出牌+3HP |
| sharp_edge_relic | 磨砺石 | on_kill | 击杀→下回合+1出牌 |
| lucky_coin_relic | 幸运铜板 | on_play | 每次出牌+2金 |
| thick_hide_relic | 厚皮兽甲 | on_play | 对子+10护甲 |
| treasure_map_relic | 藏宝图 | on_move | 进入宝箱+15金 |
| navigator_compass | 导航罗盘 | on_move | 每移动3步→下场首次出牌+8伤+5护甲 |
| turn_armor | 铁壁护符 | on_damage_taken | 下回合+1临时手牌 |
| point_accumulator | 点数统计器 | on_play | 每次出牌+3护甲（+每6层+1） |
| floor_conqueror | 层厅征服者 | on_play | 每通过1层战斗+2永久基础（叠加） |

### 6.2 Uncommon 遗物（20+）

| id | 名 | trigger | 效果 |
|---|---|---|---|
| iron_banner | 铁血战旗 | on_play | 每3回合：出牌后+1临时出牌机会 |
| twin_stars_relic | 双子星 | on_play | 对子+50%最终 |
| void_echo_relic | 虚空回响 | on_play | 连对+80%最终 |
| black_market_contract | 黑市合同 | on_reroll | 每回合首次卖血→骰子点数等金币 |
| scrap_yard | 废品回收站 | on_battle_end | 每颗诅咒/碎裂+8金 |
| war_profiteer_relic | 战争商人 | on_play | 每击杀 1 敌→本战每次出牌+5金 |
| interest_relic | 利息存款 | on_battle_end | 每10金+1利息 |
| warm_ember_relic | 余烬暖石 | on_play | 对子+4HP+5护甲+净化1负面 |
| treasure_sense_relic | 寻宝直觉 | on_play | 顺子+15金 |
| golden_touch_relic | 点金之手 | on_play | 三/四/五条+点数和100%金币 |
| haggler_relic | 讨价还价 | passive | 商店所有物品-20%价 |
| rapid_strikes_relic | 连击本能 | on_play | 已出≥2次→每次出牌+1免费重投 |
| blood_pact_relic | 血之契约 | on_play | 普攻→保留1颗最高点骰至下回合 |
| reroll_frenzy_relic | 狂掷风暴 | on_reroll | 10%免费次数不消耗 |
| battle_medic_relic | 战场急救 | on_kill | 击杀+8HP |
| rage_fire_relic | 怒火燎原 | on_damage_taken | 受伤→下次出牌+15伤 |
| extra_free_reroll | 嗜血骰袋 | passive | 解锁非战士嗜血（代价×2） |
| kill_reroll | 战利品骰 | on_kill | 击杀+1免费重投 |
| less_is_more_relic | 少即是多 | on_play | 每颗≤3点骰+20%倍率 |
| combo_master_relic | 连招大师 | on_play | 连续普攻每次+5伤+15%（非普攻重置） |
| blood_forge_armor | 血铸铠甲 | on_reroll | 每次嗜血+8护甲 |
| charge_core | 蓄力晶核 | on_turn_end | 蓄力回合+4护甲+3HP |
| combo_leech | 暗影吸取 | on_play | 第2次非普攻+6HP |
| extra_hand_slot | 魔法手套 | on_play | 对子→下回合+1临时骰 |

### 6.3 Rare 遗物（30+）

| id | 名 | trigger | 效果 |
|---|---|---|---|
| crimson_grail | 猩红圣杯 | on_play | 损失HP比例→最终倍率（最高+80%） |
| arithmetic_gauge | 等差数列仪 | on_play | 顺子长度→递增倍率 3=+50/4=+100/5=+200/6=+400 |
| mirror_prism | 镜像棱镜 | on_play | 分裂骰的点数→全局倍率 |
| emergency_hourglass | 急救沙漏 | on_fatal | 免一次致命（15节点CD） |
| vampire_fangs | 吸血鬼假牙 | on_kill | 击杀溢出25%→HP |
| pain_amplifier_relic | 痛觉放大器 | on_play | 已损失HP×15%→额外伤 |
| masochist_relic | 受虐狂 | on_play | 本回合损失HP 50%→护甲+20%→HP |
| element_overload_relic | 元素过载 | on_play | 同元素+120%最终 |
| full_house_blast_relic | 葫芦爆裂 | on_play | 葫芦额外点数250%伤+10护甲 |
| chain_lightning_relic | 连锁闪电 | on_play | 顺子额外点数150%伤+2灼烧 |
| frost_barrier_relic | 霜冻屏障 | on_play | 葫芦+15护甲+虚弱2 |
| soul_harvest_relic | 灵魂收割 | on_play | 三/四/五条+点数200%伤+点数50%HP |
| pressure_point_relic | 压力点 | on_play | 顺子+10穿透+易伤1 |
| glass_cannon_relic | 玻璃大炮 | on_play | 伤害+100%但-10HP |
| minimalist_relic | 极简主义 | on_play | 只选1颗：+15伤+100% |
| blood_dice_relic | 血骰契约 | on_play | 每次重投→倍率+20% |
| purify_water_relic | 净化圣水 | on_play | 每次出牌随机清1负面 |
| adrenaline_rush_relic | 肾上腺素 | on_play | HP≤70%+20%/50%+50%/30%+100% |
| schrodinger_bag | 薛定谔的袋子 | on_turn_end | 未重投→下回合+1临时元素骰 |
| chaos_face | 混沌骰面 | passive | 每回合首次重投所有骰+1（6不变） |
| greedy_hand | 贪婪之手 | on_play | ≥4颗+20基础 |
| fate_coin | 命运硬币 | on_play | 重投≥2次后+50%倍率 |
| element_affinity | 元素亲和 | passive | 30%普通骰抽牌→元素骰 |
| symmetry_seeker | 对称追求者 | on_play | 所有骰同点+50%倍率 |
| venom_crystal | 毒爆晶石 | on_play | 敌毒层≥8→+15伤 |
| overflow_mana | 满溢魔力 | on_play | 手牌≥5+25%伤 |
| undying_spirit | 不灭斗志 | on_play | HP≤50%+8伤+5护甲 |
| blood_eye | 血神之眼 | on_kill | 击杀+3HP，溢出>5再+2 |
| dice_master_relic | 骰子大师（升 legendary） | on_play | ≥3颗+15基础+30%倍率 |

### 6.4 Legendary 遗物（8 个）

| id | 名 | trigger | 效果 |
|---|---|---|---|
| elemental_resonator | 元素共鸣器 | on_play | 本战3种元素+150%伤+净化全负面 |
| perfectionist | 完美主义强迫症 | on_play | 葫芦/四条/五条且纯白杆+300%伤 |
| fortune_wheel_relic | 命运之轮 | passive | 每战首次出牌后保留未出骰子一次 |
| dimension_crush | 降维打击 | passive | 顺子数量+1（3顺→4顺） |
| universal_pair | 万象归一 | passive | 对子按三条结算 |
| double_strike | 双重打击 | passive | 每回合+1出牌机会 |
| overflow_conduit | 溢出导管 | on_kill | 击杀溢出转移给随机敌 |
| quantum_observer | 量子观测仪 | on_play | 随机复制1颗选中骰点数→额外伤 |
| limit_breaker | 狂暴小丑 | passive | 小丑骰上限9→100 |

## 7. 10 个随机事件

| # | id | 标题 | 分类 | 选项 | 结果 |
|---|---|---|---|---|---|
| 1 | shadow_creature | 阴影中的怪物 | combat | 战 / 绕 | 触发战斗 / -8HP |
| 2 | ancient_altar | 古老祭坛 | shrine | 献血 / 力量 | +30金-10HP / +遗物-15HP |
| 3 | void_trade | 虚空交易 | shrine | 升级牌型 / 离开 | -15HP升级随机牌型 / 无事 |
| 4 | deadly_trap | 致命陷阱 | trade | 硬牛 / 舍财 | -15HP+25金 / -20金 |
| 5 | mysterious_merchant | 神秘旅商 | trade | 买药 / 买强化水 / 讨价 | -25金+35HP / -35金+10maxHp / 50%+25HP 50%无事 |
| 6 | wheel_of_fate | 命运之轮 | trade | 转动 / 观望 | -10HP → 60%+40金/40%+遗物 |
| 7 | cursed_spring | 诅咒之泉 | shrine | 饮用 / 净化 | +40HP-5maxHp / -15金+20HP |
| 8 | dice_gambler | 骰子赌徒 | trade | 赌金币 / 赌生命 / 拒绝 | 50/50 +60/-30金 或 遗物/-20HP |
| 9 | forgotten_forge | 遗忘铸炉 | shrine | -30金强化 / 探索 / 离开 | 70%+遗物/30%-12HP |
| 10 | soul_rift | 灵魂裂隙 | trade | 踏入 / 观察 | -20HP+遗物+30金 / +15金 |
| 11 | mystic_furnace | 神秘熔炉 | shrine | 投入 / 离开 | 去除1骰-12HP / 无事 |

## 8. 洞察弱点挑战系统

### 8.1 8 种挑战类型（`utils/instakillChallenge.ts`）

| type | 名 | 描述 | 值来源 |
|---|---|---|---|
| descending_chain | 递减打击 | 连N次出牌，每次点数和严格递减 | N=3或4 |
| same_sum_twice | 镜像之力 | 连N次出牌点数和完全相同 | N=2或3 |
| exact_sequence | 命运密码 | 依次3次点数和恰好=A/B/C（基于 drawCount）| 3次 |
| alternating_parity | 阴阳交替 | 连N次，每次≥2颗骰全同奇或全同偶且与上次相反 | N=3或4 |
| forced_normal | 负重前行 | 连N次选≥3颗骰出普攻牌型 | N=2或3 |
| full_hand_low | 背水一战 | 一次选中所有手牌出牌且点数≤N | N=drawCount×2.2 |
| mono_value | 天命齐心 | 一次出牌≥3颗骰全同点（Boss 版） | 1次 |
| all_ones_or_twos | 微光破晓 | 一次出牌≥3颗骰全≤2点（Boss 版） | 1次 |

### 8.2 完成后 5 种援助效果（均 20% 概率）

| roll | 效果 |
|---|---|
| <0.2 | 全场敌人 -N% maxHp 伤害（Boss 30%/普通 50%）|
| 0.2~0.4 | 全场敌人 HP 降至 N%（Boss 50%/普通 35%）|
| 0.4~0.6 | 全场敌人+N 灼烧+N 毒（N = 3+depth+(chapter-1)×2）|
| 0.6~0.8 | 立刻补抽 1 颗骰子 |
| >0.8 | 骰子库临时全换成随机强力骰（灌铅/分裂/倍增/元素/小丑/混沌/元素骰之一）|

**挑战在波次切换时重生成**（调用 `generateChallenge(depth, chapter, drawCount, nodeType)`）。

## 9. 商店/营火/战利品

### 9.1 商店（SHOP_CONFIG）
- 3 个遗物（从已未拥有池随机）+ 1 个骰子净化位（固定）
- 候选池随机抽 3 件（遗物、骰子、重掷强化）+ 1 件净化骰
- 价格范围：[20, 80]
- 净化骰固定价：30
- `haggler_relic` → -20% 价

### 9.2 营火（CAMPFIRE_CONFIG）
- 休息回复：+40 HP
- 强化遗物：`cost = level × 20`
- 最大遗物等级：5

### 9.3 战利品（LOOT_CONFIG / lootHandler）
- 普通战掉金：25（+敌人 dropGold 合计）
- 精英战掉金：50
- Boss 战掉金：80
- 精英随机奖励：60% 金币 40% 反复随机 `[+1 freeReroll/per回合, +40金×2, +50金]`
- Boss 奖励：强制 +1 drawCount 上限
- 精英战/Boss 战 100% 掉遗物（稀有度池按 battleType 切换）
- **挑战宝箱**：`instakillCompleted → 掉 challenge_chest`；开启结果：40% 金币30~70、35% 骰子（uncommon+rare）、25% 遗物（common+uncommon 未拥有）

## 10. 灵魂晶系统（soulCrystalCalc）

```
totalSoulGain = Σ(overkill敌人) max(1, ⌈min(overkill, enemy.maxHp) × (soulCrystalMultiplier + depth×0.1) × 0.15⌉)

初始 soulCrystalMultiplier = 1.0
每层 +0.2（通过商店涨价控制产销）
```

## 11. 波次转换规则（enemyWaveTransition）

条件：当前波敌人全灭 且 `currentWaveIndex+1 < battleWaves.length`

执行：
1. `setEnemies(nextWave)`
2. 判断法师吟唱状态：`playerClass='mage' && playsLeft>=maxPlays`
3. setGame：
   - currentWaveIndex+1
   - targetEnemyUid = Guardian 优先 否则首个
   - isEnemyTurn=false
   - playsLeft=max(prev,1), freeRerollsLeft=max(prev,1)
   - armor=0, bloodRerollCount=0
   - **法师吟唱中保留**：chargeStacks, mageOverchargeMult, lockedElement, 手牌
   - **非吟唱**：清除骰子重掷
   - instakillChallenge=新挑战
   - playsThisWave=0, rerollsThisWave=0, battleTurn=1
4. 不吟唱 → setDice([]) + rollAllDice(true)

## 12. Boss 战多波结构

**Boss 节点战斗 = 2 波**：
- 第 1 波：2 个小兵（`hpScale×0.6, dmgScale×0.7`）
- 第 2 波：Boss 本体

**Elite 节点战斗 = 1 波**：
- Elite + 1 个小跟班（`hpScale×0.5, dmgScale×0.6`）

**普通节点战斗**：
- 1-2 波，多波概率随深度递增（depth≥9 时 85%、≥5 时 70%、≥3 时 50%、≥1 时 25%）
- 敌人数 depth=0→1；depth≤1→40% 1 / 60% 2；depth≤4→50% 2 / 50% 3；depth≤9→30% 2 / 70% 3；depth≥10→3-4
- 第 2 波 `waveScale=0.8`

## 13. 章节切换（chapterTransition）

触发：当前最终 Boss 击败且 chapter < 5

自动：
- `chapter += 1`
- `hp = Math.min(maxHp, hp + floor(maxHp × 0.6))`
- `souls += 75`
- 重新生成地图（相同 15 层结构，更换敌人池）

## 14. 胜利后阶段判定（`resolvePostVictoryPhase`）

| 判定顺序 | 条件 | 阶段 |
|---|---|---|
| 1 | nodeType=boss 且 depth=maxDepth 且 chapter≥5 | `victory`（游戏胜利）|
| 2 | nodeType=boss 且 depth=maxDepth 且 chapter<5 | `chapterTransition` |
| 其他 | - | `diceReward`（选骰子奖励 3选1）|

## 15. 附：文件与行号速查

| 模块 | 行数 |
|---|---|
| enemyAI.ts | 440 |
| relicsAugmented.ts | 489 |
| dice.ts | 319 |
| relicsCore.ts | 316 |
| expectedOutcomeCalc.ts | 293 |
| relicsSpecial.ts | 289 |
| damageApplication.ts | 276 |
| drawPhase.ts | 225 |
| relics.ts | 222 |

---

## 结论

至此 React 版 dicehero2 的 13 大系统全部挖通。配合第一轮的回合/出牌/重投/牌型挖掘，已具备**输出像素级复刻设计文档**所需的全部原料。

下一步交给 [DICE]Designer 基于两轮挖掘成果撰写设计文档，并由 [DICE]Verify 返回原项目像素级审查。
