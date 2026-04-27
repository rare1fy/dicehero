# Dice Hero · Godot 复刻设计规范 v1.0 · Part 2

> 续 Part 1。本 Part 包含第 10-14 章：敌人大全 / 骰子大全 / 牌型 / 遗物大全 / 状态效果。

---

## 10. 敌人大全

**体验定位**：每一章有 5 种普通怪 + 2 个精英 + 2 个 Boss（1 中 + 1 终），5 章共计 25+10+10 = 45+ 只敌人。普通怪负责消耗资源、磨损 HP 与手牌；精英怪作为小高潮，行动有明显的质变招式；Boss 则是章节的终极考验，通常带多阶段、加血、召小弟或组合技。所有敌人在 `combatType` 字段上分为攻击型 / 防御型 / 法术型 / 召唤型四类，AI 决策树基于这个字段走不同策略（详见 Part1 §9）。

> **美术说明（Verify W1）**：源码的敌人 `emoji` 字段实际为空字符串（历史残留），Godot 版**直接使用像素精灵（PNG 导出自 `components/EnemyStageView.tsx` SVG 素材）**，不要 fallback 到 emoji。

### 10.1 5 章 × 5 种普通怪（20 只）

每只敌人都有 enter / death / attack / defend / skill / heal / hurt / lowHp 8 类语音（见 `config/enemyNormal.ts`）。lowHp 语音在 HP<30% 时首次触发，`playSound('enemy_speak')`。

#### 第 1 章 · 幽暗森林

| id | 名 | HP | Dmg | 类型 | 行为模式（按顺序循环） |
|---|---|---|---|---|---|
| forest_ghoul | 食永鬼 | 28 | 7 | warrior | 攻击7 / 撕咬9 / 虚弱1回合 |
| forest_spider | 剧毒蛛母 | 18 | 3 | ranger | 剧毒2 / 攻击4 / 攻击4 |
| forest_treant | 腐化树人 | 42 | 4 | guardian | 防御8 / 攻击5 / 防御6 / 根须缠绕7 |
| forest_banshee | 哭嚎女妖 | 16 | 3 | caster | 易伤1 / 攻击5 / 虚弱1 |
| forest_wolf_priest | 月光狼灵 | 20 | 2 | priest | 剧毒2 / 易伤1 / 攻击4 |

#### 第 2 章 · 冰封山脉

| id | 名 | HP | Dmg | 类型 | 行为模式 |
|---|---|---|---|---|---|
| ice_yeti | 雪原雪人 | 36 | 9 | warrior | 攻击9 / 冰拳11 |
| ice_mage | 霜寒女巫 | 18 | 4 | caster | 冻结1 / 攻击6 / 虚弱2 |
| ice_wolf | 霜齿狼 | 22 | 5 | ranger | 攻击5 / 冰霜撕咬7 / 灼烧1 |
| ice_golem | 寒冰石像 | 44 | 4 | guardian | 防御10 / 攻击5 / 防御8 |

#### 第 3 章 · 熔岩深渊

| id | 名 | HP | Dmg | 类型 | 行为模式 |
|---|---|---|---|---|---|
| lava_hound | 地狱火犬 | 30 | 8 | warrior | 攻击8 / 烈焰撕咬10 / 灼烧2 |
| lava_imp | 小恶魔 | 16 | 4 | caster | 灼烧2 / 攻击5 / 易伤1 / 火球6 |
| lava_guardian | 黑铁卫士 | 48 | 5 | guardian | 防御12 / 攻击6 / 防御8 / 锻造重击8 |
| lava_shaman | 火焰萨满 | 22 | 3 | priest | 灼烧2 / 力量1 / 攻击5 |

#### 第 4 章 · 暗影要塞

| id | 名 | HP | Dmg | 类型 | 行为模式 |
|---|---|---|---|---|---|
| shadow_assassin | 暗影刺客 | 24 | **12** | ranger | 背刺12 / 剧毒2 / 攻击8 |
| shadow_felguard | 邪能卫兵 | 46 | 6 | guardian | 攻击7 / 防御14 / 邪能重斩9 |
| shadow_warlock | 邪能术士 | 20 | 5 | caster | 剧毒2 / 攻击6 / 灼烧2 / 暗影箭7 |
| shadow_knight | 堕落死亡骑士 | 34 | 10 | warrior | 攻击10 / 虚弱1 / 凛零打击12 |

#### 第 5 章 · 永恒之巅

| id | 名 | HP | Dmg | 类型 | 行为模式 |
|---|---|---|---|---|---|
| eternal_sentinel | 光铸哨兵 | 40 | 8 | guardian | 防御14 / 攻击8 / 防御10 / 圣光裁决10 |
| eternal_chrono | 时光龙人 | 26 | 7 | caster | 虚弱2 / 时光冲击8 / 冻结1 |
| eternal_archer | 星界游侠 | 22 | 10 | ranger | 攻击10 / 星辰之矢12 / 易伤1 |
| eternal_priest | 泰坦祭司 | 24 | 3 | priest | 力量2 / 易伤1 / 圣光惩击6 |

### 10.2 精英 10 个（每章 2 个，`config/enemyEliteBoss.ts ELITE_ENEMIES`）

| 章 | id | 名 | HP | Dmg | 类型 | 低血阶段切换 | 行为 |
|---|---|---|---|---|---|---|---|
| 1 | elite_necromancer | 亡灵大师 | 85 | 8 | caster | <40%HP → 亡灵大军14+剧毒3 | 默认：攻击8 / 虚弱2 / 防御12 |
| 1 | elite_alpha_wolf | 狼人首领 | 100 | 11 | warrior | 无 | 攻击11 / 狂暴撕咬14 / 力量2 / 攻击9 |
| 2 | elite_frost_wyrm | 霜龙幼崽 | 95 | 10 | caster | <30%HP → 寒冰吐息18+冻结2 | 默认：攻击10 / 虚弱2 / 防御14 / 攻击8 |
| 2 | elite_ice_lord | 冰霜巨人王 | 120 | 7 | guardian | 无 | 防御20 / 攻击8 / 冰锤粉碎14 / 冻结1 |
| 3 | elite_infernal | 地狱火 | 100 | 12 | warrior | 无 | 攻击12 / 烈焰冲击16 / 灼烧3 / 防御10 |
| 3 | elite_dark_iron | 黑铁议员 | 90 | 9 | caster | <40%HP → 熔岩之怒16+锻造碎裂骰1 | 默认：攻击9 / 灼烧2 / 防御16 |
| 4 | elite_doomguard | 末日守卫 | 110 | 11 | warrior | 无 | 攻击11 / 末日审判16 / 易伤2 / 防御14 / 诅咒注入(诅咒骰1) |
| 4 | elite_shadow_priest | 暗影大主教 | 80 | 8 | priest | <30%HP → 剧毒3 + 灼烧3 | 默认：攻击8 / 虚弱2 / 精神鞭挞10 / 剧毒2 |
| 5 | elite_titan_construct | 泰坦守护者 | 130 | 10 | guardian | 无 | 防御22 / 攻击10 / 泰坦之锤18 / 虚弱2 |
| 5 | elite_void_walker | 虚空行者 | 90 | **13** | caster | <35%HP → 虚空爆裂20 + 诅咒骰1 | 默认：攻击13 / 易伤2 / 攻击10 / 虚弱2 |

### 10.3 Boss 10 个（每章 1 中 + 1 终）

| 章 | id | 名 | HP | Dmg | 类型 | 角色 | 低血阶段（hpThreshold 0.5） |
|---|---|---|---|---|---|---|---|
| 1 | boss_lich_forest | 林巫妖 | 150 | 10 | caster | 中 | <40% → 亡灵风暴16/灼烧2/骸风之矛14/诅咒骰1/防御15 |
| 1 | boss_ancient_treant | 远古树王 | **300** | 15 | guardian | 终 | <50% → 大地之怒22/防御30/攻击18/剧毒3 |
| 2 | boss_frost_queen | 霜寒女王 | 160 | 10 | caster | 中 | <40% → 暴风雪18/冻结2/攻击14/碎裂诅咒(碎裂骰1)/防御16 |
| 2 | boss_frost_lich | 霜之巫妖王 | **320** | 15 | warrior | 终 | <50% → 霜之哀伤28/攻击20/剧毒3/防御28 |
| 3 | boss_ragnaros | 炎魔之王 | 200 | 12 | warrior | 中 | <40% → 岩浆之锤20/灼烧3/烈焰之手16/防御14 |
| 3 | boss_deathwing | 熔火死翼 | **380** | 16 | caster | 终 | <50% → 大灾变30/攻击22/灼烧4/防御30 |
| 4 | boss_archimonde | 深渊领主 | 200 | 11 | caster | 中 | <40% → 暗影之手18/灼烧2/邪能风暴14/诅咒骰1/防御16 |
| 4 | boss_kiljaeden | 暗影之王 | **380** | 16 | caster | 终 | <50% → 黑暗终焉28/攻击22/剧毒3/防御30 |
| 5 | boss_titan_watcher | 泰坦看守者 | 200 | 12 | guardian | 中 | <40% → 泰坦审判18/防御22/秩序之光16/易伤2 |
| 5 | boss_eternal_lord | 永恒主宰 | **480** | 18 | caster | 终 | <50% → 终极之光28/攻击22/剧毒3/防御30 |

### 10.4 精英/Boss 判定（`config/balance/enemy.ts ELITE_CONFIG`）

```ts
ELITE_CONFIG = {
  hpThreshold: 80,        // maxHp > 80 且 ≤200 → 精英
  bossHpThreshold: 200,   // maxHp > 200 → Boss
  bossCurseHpRatio: 0.4,  // Boss hp/maxHp <0.4 触发诅咒骰
  armorMult: 1.5,         // 精英护甲=atk×1.5
  bossArmorMult: 2.0,     // Boss护甲=atk×2.0
  eliteDiceCycle: 3,      // 精英每3回合塞碎裂骰
  bossCurseCycle: 2,      // Boss低血时每2回合塞诅咒骰
  bossCrackedDiceCycle: 3,// Boss每3回合塞碎裂骰
  eliteArmorCycle: 3,     // 精英每3回合叠护甲
  bossArmorCycle: 2,      // Boss每2回合叠护甲
}
```

### 10.5 战斗波次结构（`logic/enemies.ts getEnemiesForNode`）

| 节点类型 | 波数 | 波 1 | 波 2 |
|---|---|---|---|
| enemy（普通）| 1 或 2 | 1-3 敌（随深度递增） | 第 2 波 scale ×0.8（若出现）|
| elite | 1 | 1 精英 + 1 跟班(hp×0.5,dmg×0.6) | - |
| boss | **2** | 2 个小兵(hp×0.6,dmg×0.7) | Boss 本体 |

多波概率（普通战）：
- depth ≥ 9：85%
- depth ≥ 5：70%
- depth ≥ 3：50%
- depth ≥ 1：25%
- depth = 0：0%

每波敌人数量：
- depth = 0：1
- depth ≤ 1：40% 1 / 60% 2
- depth ≤ 4：50% 2 / 50% 3
- depth ≤ 9：30% 2 / 70% 3
- depth ≥ 10：3-4（`Math.min(4, 3 + Math.floor(Math.random() × 2))`）

### 10.6 敌人可用性规则（新手保护）

- depth ≤ 1：仅 warrior + guardian
- depth ≤ 3：不出 caster + priest
- depth ≥ 4：全类型

### 10.7 敌人语音触发规则（`config/balance/enemy.ts ENEMY_TAUNT_CONFIG`）

```
attackChance: 0.3             // 攻击台词触发概率
highDmgThreshold: 15          // damage≥15 触发 hurt 台词
highDmgQuoteDelay: 600ms      // hurt 台词延迟
highDmgQuoteDuration: 2000ms  // hurt 台词展示时长
```

lowHp 语音：`hp/maxHp < 0.3` 时首次触发，播 `enemy_speak` 音效，set `speaking` 特效 400ms，`enemyQuotedLowHp` 集合标记已播过。

---

## 11. 骰子大全

**体验定位**：骰子是整个游戏的核心资产，每颗骰子既有点数属性（1-6 面）又有特效（`onPlay`）。常见类型有：
- **标准骰（standard）**：6 面均匀 1-6，无特殊效果，构筑基础。
- **元素骰**：6 面带元素（火/冰/雷/毒/圣），触发元素反应后有倍率加成。
- **功能骰**：如锋刃 +5 伤、倍增 ×1.2 倍率、碎裂自损 2 换强度、暗影残骰跨回合保留等。
- **职业专属骰**：战士 `w_*` 偏血怒 / 卖血；法师 `mage_*` 偏吟唱 / 元素锁定；盗贼 `r_*` 偏连击 / 临时骰。

整个构筑循环：战斗胜利固定 3 选 1 补骰 → 商店购买 → 篝火净化（移除）→ 形成个性化牌库。


### 11.1 职业无关通用骰子（`data/dice.ts`）

| id | 名 | faces | 稀有度 | onPlay | 备注 |
|---|---|---|---|---|---|
| standard | 普通骰子 | [1,2,3,4,5,6] | common | - | 标准六面骰 |
| heavy | 灌铅骰子 | [4,4,5,5,6,6] | uncommon | - | 已移交盗贼 r_heavy；旧存档兼容保留 |
| elemental | 元素骰子 | [1,2,3,4,5,6] + isElemental | rare | - | 抽到时随机坍缩元素；已移交法师 mage_elemental |
| blade | 锋刃骰子 | [1,2,3,4,5,6] | rare | `bonusDamage:5` | Lv2=+8, Lv3=+11 |
| amplify | 倍增骰子 | [1,2,3,4,5,6] | rare | `bonusMult:1.2` | Lv2=1.35x, Lv3=1.5x |
| split | 分裂骰子 | [1,2,3,4,5,6] | rare | - | 结算时复制 1 颗相同点数临时骰 |
| magnet | 磁吸骰子 | [1,2,3,4,5,6] | rare | - | 随机将 1 颗同伴骰子改为同点数 |
| joker | 小丑骰子 | [1..9] | rare | - | 1-9 随机（有 limit_breaker 则上限=100）|
| chaos | 混沌骰子 | [1,1,1,6,6,6] | legendary | - | 极端分布 |
| cursed | 诅咒骰子 | [0,0,0,0,0,0] | curse | - | 点数 0，重投代价翻倍，`isCursed:true` |
| cracked | 碎裂骰子 | [1,1,1,2,2,2] | curse | `selfDamage:2` | 未打出→回合结束销毁，`isCracked:true` |
| temp_rogue | 暗影残骰 | [1,1,2,2,3,3] | common | - | 盗贼连击奖励，`isTemp:true`，回合末销毁 |

### 11.2 战士 `w_*` 专属骰子（注册来源：`registerClassDice`，具体文件需 Verify 确认 [GAP]）

参考初始骰子和特殊字段出现位置：

| id（推测）| 特殊字段/onPlay |
|---|---|
| w_bloodthirst | 嗜血骰，战士初始骰子之一 |
| w_ironwall | 铁壁骰，战士初始骰子之一 |
| w_fury | 怒火骰：被攻击时 `furyBonusDamage += level`（永久叠加，作为下次出牌 extraDamage）|
| w_heavy | 战士版灌铅骰（替代通用 heavy）|

### 11.3 法师 `mage_*` 专属骰子

| id | 特殊字段/onPlay |
|---|---|
| mage_elemental | 法师元素骰（替代通用 elemental）|
| mage_reverse | 逆转骰，法师初始 |
| mage_prism | 棱镜骰：`lockElement=true` 出牌后锁定元素；双元素 |

### 11.4 盗贼 `r_*` 专属骰子

| id | 特殊字段/onPlay |
|---|---|
| r_quickdraw | 快拔骰，盗贼初始 |
| r_combomastery | 连击宗师骰，盗贼初始 |
| r_heavy | 盗贼版灌铅骰（替代通用 heavy）|

### 11.5 保留时 onPlay 7 种效果（前文已述，此处汇总）

| 字段 | 含义 |
|---|---|
| `bonusOnKeep` | 保留时点数 +N |
| `boostLowestOnKeep` | 保留时手牌最低点 +2 |
| `bonusPerTurnKept` | 每保留 1 回合 +N，上限 `keepBonusCap=3` |
| `rerollOnKeep` | 保留时自动重投 |
| `bonusMultOnKeep` | 保留时 `mageOverchargeMult += 0.2` |
| `fortune_wheel_relic`(遗物) | 每战首次出牌后保留手牌一次 |
| `relicKeepHighest`(遗物) | 保留最高点 N 颗 |

### 11.6 出牌时 onPlay 字段一览（从 expectedOutcomeCalc + postPlayEffects 反推）

| 字段 | 效果 |
|---|---|
| `bonusDamage` | +X 基础伤害 |
| `bonusMult` | 伤害乘法倍率 |
| `aoe` | 本骰子打出触发 AOE |
| `selfDamage` | 出牌后玩家 -X HP |
| `heal` | 玩家 +X HP |
| `pierce` | 穿透伤害（无视护甲）|
| `armorBreak` | 清零敌人护甲 |
| `holyPurify` | 清玩家 1 负面，无负面时清 1 诅咒/碎裂骰 |
| `splinterDamage` | 溢出伤害 × 比例 → 随机另一敌人 |
| `comboSplashDamage` | 连击≥1 时骰子点数 → 随机另一敌人 |
| `chainBolt` | 对每个存活敌 各造点数独立伤害 |
| `splashToRandom` | 骰子点数 → 随机另一敌人 |
| `bounceAndGrow` | 飞刀：不消耗，点数+1 回手牌（最多3次）|
| `boomerangPlay` | 回旋刃：首次 playsLeft 不减 |
| `tauntAll` | 嘲讽：全敌立即反噬 |
| `drawFromBag` | 从骰子库补抽 |
| `grantShadowDie` | 盗贼 +1 颗暗影残骰 |
| `comboPersistShadow` | 残骰持久化 |
| `comboGrantPlay` | 连击时 +1 出牌机会 |
| `grantExtraPlay` | +1 出牌机会 |
| `grantPlayOnThird` | 第 3 次出牌 +1 机会 |
| `grantTempDieFixed` | 固定面值临时骰 |
| `shadowClonePlay` | 自动追加 50% 伤害复制攻击 |
| `doublePoisonOnCombo` | 连击时目标毒层翻倍 |
| `maxHpBonus / maxHpBonusEvery / healOrMaxHp` | 永久加血 |
| `transferDebuff` | 清除自身 1 负面 |
| `healOnSkip` | 未出牌回合 +4HP（冥想骰）|
| `purifyOneOnSkip` | 未出牌回合清 1 负面 |

### 11.7 骰子升级体系（`getUpgradedOnPlay`）【**暂缓实现**】

> **设计决策**：骰子升级机制本版本**搁置不实现**，以下配置仅作为原 React 版历史资料保留，Godot 版不需要移植。后续是否引入升级体系由 Designer 另立 TASKS 评估。任何涉及 `level` 字段的逻辑在 Godot 版统一默认 Lv1。

**不改点数面，只强化 onPlay**（原版配置）：

| 骰子类型 | Lv1 | Lv2 | Lv3 | 规则 |
|---|---|---|---|---|
| 锋刃 bonusDamage | 5 | 8 | 11 | 每级 +3 |
| 倍增 bonusMult | 1.2 | 1.35 | 1.5 | 每级 +0.15 |
| 碎裂 selfDamage | 2 | 1 | 1 | 每级 -1，最低 1 |
| 普通骰子（无 onPlay）| - | +3 bonusDmg | +6 bonusDmg | 每级 +3 |
| 灌铅骰（无 onPlay）| - | +4 bonusDmg | +8 bonusDmg | 每级 +4 |
| 元素骰（无 onPlay）| - | +3 bonusDmg | +6 bonusDmg | 每级 +3 |

**元素骰升级倍率**（`getElementLevelBonus`）：Lv1=1x / Lv2=1.5x / Lv3=2x

`DICE_MAX_LEVEL = 3`

### 11.8 初始骰子库 `INITIAL_DICE_BAG`

```ts
['standard', 'standard', 'standard', 'standard', 'blade']
```

（但职业选择时会覆盖为职业初始骰子）

### 11.9 骰子奖励池（`getDiceRewardPool`）

按职业专属池 + 通用池组合，权重按稀有度分配：

| 稀有度 | 普通战 | 精英战 | Boss战 |
|---|---|---|---|
| common | 4 | 3 | 1 |
| uncommon | 3 | 3 | 2 |
| rare | 1 | 2 | 3 |
| legendary | 0.3 | 1 | 3 |

通用池（混入）：blade / amplify / split / magnet / joker / chaos（不含已移交职业的 heavy / elemental）

### 11.10 骰子奖励刷新（`DICE_REWARD_REFRESH`）

```
basePrice: 5 金
priceMultiplier: 2（每次刷新乘此值）
firstFree: true（首次刷新免费）
```

### 11.11 5 种元素坍缩效果（`ELEMENT_EFFECT_DESC`）

| 元素 | 描述 |
|---|---|
| fire 火 | 破甲爆燃：摧毁敌人所有护甲，附加真实伤害，并施加点数灼烧 |
| ice 冰 | 绝对控制：冻结敌人 1 回合，点数结算减半 |
| thunder 雷 | 传导AOE：对其他敌人造成等量穿透伤害 |
| poison 毒 | 叠层斩杀：施加毒层，跨回合持续掉血 |
| holy 圣 | 经济净化：恢复等同点数的生命值 |

### 11.12 元素碰撞规则

- 所有 `isElemental` 骰子在抽牌/重投时共享同一随机元素
- `game.lockedElement` 存在 → 强制用锁定元素（法师棱镜）
- 双元素骰（棱镜）额外随机第二元素
- 共鸣骰复制手牌中数量最多的元素

---

## 12. 牌型 17 种（`data/handTypes.tsx HAND_TYPES`）

**体验定位**：玩家选骰子组合出牌时，系统会自动匹配当前最强牌型（从高优先级到低优先级排查），牌型决定伤害倍率（如同花顺 ×3.5、对子 ×1.2、普通攻击 ×1.0）。17 种牌型覆盖"单张 → 对子 → 三条 → 顺子 → 同花 → 葫芦 → 四条 → 五条 → 同花顺 → 元素爆发"等经典扑克 + 自创元素组合。战士有特权：多选且全是普攻时无视牌型，一口气全出（但禁用骰子特效）。


**伤害公式**：`伤害 = 点数和 × 牌型倍率 × 增幅倍率`

### 12.1 优先级表（高→低，决定 `bestHand`）

| 优先级 | id | 中文名 | 条件 | mult | 特效 |
|---:|---|---|---|---|---|
| 1 | royal_element | 皇家元素顺 | 同元素 + 1-6 连 | **16.0** | AOE + 特效 200% + 50 护甲 |
| 2 | element_house | 元素葫芦 | 同元素 + 葫芦 | 6.0 | 特效翻倍 + 25 护甲 |
| 3 | element_straight | 元素顺 | 同元素 + 顺子 | 5.5 | AOE + 特效翻倍 |
| 4 | six_of_a_kind | 六条 | 6 颗同点 | **15.0** | 易伤 3 回合 |
| 5 | five_of_a_kind | 五条 | 5 颗同点 | 9.0 | 易伤 2 回合 |
| 6 | four_of_a_kind | 四条 | 4 颗同点 | 6.0 | 易伤 2 回合 |
| 7 | full_house | 葫芦 | 3+2 / 3+3 / 4+2 | 4.0 | +15 护甲 |
| 8 | same_element | 同元素 | ≥4 颗同元素（非 normal）| 3.0 | 特效翻倍 |
| 9 | straight_6 | 6 顺 | 1-6 连 | 5.0 | AOE + 虚弱 + 10 护甲 |
| 10 | straight_5 | 5 顺 | 5 连 | 3.5 | AOE + 虚弱 |
| 11 | straight_4 | 4 顺 | 4 连 | 2.5 | AOE + 虚弱 |
| 12 | straight_3 | 顺子 | 3 连 | 1.5 | AOE |
| 13 | three_of_a_kind | 三条 | 3 颗同点 | 3.5 | 易伤 2 回合 |
| 14 | three_pair | 三连对 | 2+2+2 | 3.5 | +8 护甲 |
| 15 | two_pair | 连对 | 2+2 | 2.5 | +5 护甲 |
| 16 | pair | 对子 | 2 颗同点 | 2.0 | - |
| 17 | high_card | 普通攻击 | 兜底（空选/单选/不成型）| 1.0 | - |

### 12.2 牌型升级倍率（`handLevels`）

```
levelBonus = (handLevels[handId] - 1) × 0.3  每级 +30%
finalMult = baseMult + Σ((hand.mult - 1) + levelBonus)
```

### 12.3 牌型判定特殊规则（`utils/handEvaluator.ts`）

- **空选**：普通攻击
- **1 颗**：普通攻击（唯一牌型）
- **镜像骰 `ignoreForHandType`**：点数计入 X 但不参与牌型判定
- **同元素条件**：≥ 4 颗同元素（非 normal 元素）
- **顺子条件**：≥ 3 颗连续且点数互异（去重后连续）
- **葫芦**：3+2（5 颗）、3+3（6 颗）、4+2（6 颗）
- **连对**：2+2（4 颗）；**三连对**：2+2+2（6 颗）
- **元素顺**：同元素 + 顺子
- **皇家元素顺**：元素顺 + 1-6 连（最高牌型）
- **元素葫芦**：同元素 + 葫芦

### 12.4 多选普攻判定

```ts
isNormalAttackMulti = selected.length > 1
                   && activeHands = ['普通攻击']   // 只有普攻，无其他
isNonWarriorMultiNormal = isNormalAttackMulti && playerClass !== 'warrior'
skipOnPlay = selected.length > 1 && activeHands = ['普通攻击']
```

- **UI 层**：`isNonWarriorMultiNormal=true` → 禁用出牌按钮 + 灰色 + 文案"不成牌型（仅限选1颗）"
- **战斗层**：`skipOnPlay=true` → 所有骰子 onPlay 跳过

---

## 13. 遗物大全（85+）

**体验定位**：遗物是被动强化物，按稀有度分为 Common / Uncommon / Rare / Legendary 四档，共 85+ 个。遗物通过战利品（精英/Boss 战 100% 掉）、宝箱节点（原版 3 选 1）、事件奖励获得。每个遗物有明确的 `trigger`（触发时机）和 `effect`（效果函数），遗物之间不互斥但有叠加规则。Godot 版必须严格用 `triggerRelics()` 统一触发，禁止散写（见 Part1 §4）。


**触发分类 8 种**：`on_play` / `on_kill` / `on_reroll` / `on_move` / `on_turn_end` / `on_battle_end` / `on_damage_taken` / `on_fatal` / `passive`

### 13.1 Common 遗物（16+）

| id | 名 | trigger | 效果 |
|---|---|---|---|
| grindstone | 磨刀石 | on_play | ≤2 颗骰子牌型 +12 基础伤害 |
| heavy_metal_core | 重金属核心 | on_play | 每颗灌铅骰 +10 基础 |
| chaos_pendulum | 混沌摆锤 | on_play | 奇数 +12，偶数 +3HP + 净化 1 负面 |
| iron_skin_relic | 稳健之心 | on_play | 未重投则出牌后 +1 免费重投 |
| scattershot_relic | 散射弹幕 | on_play | 普攻点数≥15 每颗 +3 基础 |
| basic_instinct_relic | 基本直觉 | on_play | 普攻额外 +点数 150% 伤害 |
| merchants_eye_relic | 点石成金 | on_play | 普攻 +5 金 |
| healing_breeze | 治愈之风 | on_play | 每次出牌 +3HP |
| sharp_edge_relic | 磨砺石 | on_kill | 击杀 → 下回合 +1 出牌 |
| lucky_coin_relic | 幸运铜板 | on_play | 每次出牌 +2 金 |
| thick_hide_relic | 厚皮兽甲 | on_play | 对子 +10 护甲 |
| treasure_map_relic | 藏宝图 | on_move | 进入宝箱节点 +15 金 |
| navigator_compass | 导航罗盘 | on_move | 每移动 3 步 → 下场首次出牌 +8 伤 +5 护甲 |
| turn_armor | 铁壁护符 | on_damage_taken | 下回合 +1 临时手牌 |
| point_accumulator | 点数统计器 | on_play | 每次出牌 +3 护甲（每 6 层 +1）|
| floor_conqueror | 层厅征服者 | on_play | 每通过 1 层战斗 +2 永久基础（累计）|

### 13.2 Uncommon 遗物（24+）

| id | 名 | trigger | 效果 |
|---|---|---|---|
| iron_banner | 铁血战旗 | on_play | 每 3 回合：出牌后 +1 临时出牌机会 |
| twin_stars_relic | 双子星 | on_play | 对子 +50% 最终 |
| void_echo_relic | 虚空回响 | on_play | 连对 +80% 最终 |
| black_market_contract | 黑市合同 | on_reroll | 每回合首次卖血 → 骰子点数等金币 |
| scrap_yard | 废品回收站 | on_battle_end | 每颗诅咒/碎裂 +8 金 |
| war_profiteer_relic | 战争商人 | on_play | 每击杀 1 敌 → 本战每次出牌 +5 金 |
| interest_relic | 利息存款 | on_battle_end | 每 10 金 +1 利息 |
| warm_ember_relic | 余烬暖石 | on_play | 对子 +4HP +5 护甲 + 净化 1 负面 |
| treasure_sense_relic | 寻宝直觉 | on_play | 顺子 +15 金 |
| golden_touch_relic | 点金之手 | on_play | 三/四/五条 +点数和 100% 金币 |
| haggler_relic | 讨价还价 | passive | 商店所有物品 -20% 价 |
| rapid_strikes_relic | 连击本能 | on_play | 已出≥2 次 → 每次出牌 +1 免费重投 |
| blood_pact_relic | 血之契约 | on_play | 普攻 → 保留 1 颗最高点骰至下回合 |
| reroll_frenzy_relic | 狂掷风暴 | on_reroll | 10% 免费次数不消耗 |
| battle_medic_relic | 战场急救 | on_kill | 击杀 +8HP |
| rage_fire_relic | 怒火燎原 | on_damage_taken | 受伤 → 下次出牌 +15 伤 |
| kill_reroll | 战利品骰 | on_kill | 击杀 +1 免费重投 |
| less_is_more_relic | 少即是多 | on_play | 每颗≤3 点骰 +20% 倍率 |
| combo_master_relic | 连招大师 | on_play | 连续普攻每次 +5 伤 +15%（非普攻重置）|
| blood_forge_armor | 血铸铠甲 | on_reroll | 每次嗜血 +8 护甲 |
| charge_core | 蓄力晶核 | on_turn_end | 蓄力回合 +4 护甲 +3HP |
| combo_leech | 暗影吸取 | on_play | 第 2 次非普攻 +6HP |
| extra_hand_slot | 魔法手套 | on_play | 对子 → 下回合 +1 临时骰 |

### 13.3 Rare 遗物（30+）

| id | 名 | trigger | 效果 |
|---|---|---|---|
| crimson_grail | 猩红圣杯 | on_play | 损失 HP 比例 → 最终倍率（最高 +80%）|
| arithmetic_gauge | 等差数列仪 | on_play | 顺子长度 → 递增倍率 3=+50/4=+100/5=+200/6=+400 |
| mirror_prism | 镜像棱镜 | on_play | 分裂骰的点数 → 全局倍率 |
| emergency_hourglass | 急救沙漏 | on_fatal | 免一次致命（15 节点 CD）|
| vampire_fangs | 吸血鬼假牙 | on_kill | 击杀溢出 25% → HP |
| pain_amplifier_relic | 痛觉放大器 | on_play | 已损失 HP×15% → 额外伤 |
| masochist_relic | 受虐狂 | on_play | 本回合损失 HP 50% → 护甲，20% → HP |
| element_overload_relic | 元素过载 | on_play | 同元素 +120% 最终 |
| full_house_blast_relic | 葫芦爆裂 | on_play | 葫芦额外点数 250% 伤 +10 护甲 |
| chain_lightning_relic | 连锁闪电 | on_play | 顺子额外点数 150% 伤 +2 灼烧 |
| frost_barrier_relic | 霜冻屏障 | on_play | 葫芦 +15 护甲 +虚弱 2 |
| soul_harvest_relic | 灵魂收割 | on_play | 三/四/五条 +点数 200% 伤 +点数 50% HP |
| pressure_point_relic | 压力点 | on_play | 顺子 +10 穿透 +易伤 1 |
| glass_cannon_relic | 玻璃大炮 | on_play | 伤害 +100% 但 -10HP |
| minimalist_relic | 极简主义 | on_play | 只选 1 颗：+15 伤 +100% |
| blood_dice_relic | 血骰契约 | on_play | 每次重投 → 倍率 +20% |
| purify_water_relic | 净化圣水 | on_play | 每次出牌随机清 1 负面 |
| adrenaline_rush_relic | 肾上腺素 | on_play | HP≤70%+20% / 50%+50% / 30%+100% |
| schrodinger_bag | 薛定谔的袋子 | on_turn_end | 未重投 → 下回合 +1 临时元素骰 |
| chaos_face | 混沌骰面 | passive | 每回合首次重投所有骰 +1（6 不变）|
| greedy_hand | 贪婪之手 | on_play | ≥4 颗 +20 基础 |
| fate_coin | 命运硬币 | on_play | 重投≥2 次后 +50% 倍率 |
| element_affinity | 元素亲和 | passive | 30% 普通骰抽牌 → 元素骰 |
| symmetry_seeker | 对称追求者 | on_play | 所有骰同点 +50% 倍率 |
| venom_crystal | 毒爆晶石 | on_play | 敌毒层≥8 → +15 伤 |
| overflow_mana | 满溢魔力 | on_play | 手牌≥5 +25% 伤 |
| undying_spirit | 不灭斗志 | on_play | HP≤50%+8 伤 +5 护甲 |
| blood_eye | 血神之眼 | on_kill | 击杀 +3HP，溢出 >5 再 +2 |

### 13.4 Legendary 遗物（9 个）

| id | 名 | trigger | 效果 |
|---|---|---|---|
| dice_master_relic | 骰子大师 | on_play | ≥3 颗 +15 基础 +30% 倍率 |
| elemental_resonator | 元素共鸣器 | on_play | 本战 3 种元素 +150% 伤 + 净化全负面 |
| perfectionist | 完美主义强迫症 | on_play | 葫芦/四条/五条且纯白杆 +300% 伤 |
| fortune_wheel_relic | 命运之轮 | passive | 每战首次出牌后保留未出骰子一次 |
| dimension_crush | 降维打击 | passive | 顺子数量 +1（3 顺 → 4 顺）|
| universal_pair | 万象归一 | passive | 对子按三条结算 |
| double_strike | 双重打击 | passive | 每回合 +1 出牌机会 |
| overflow_conduit | 溢出导管 | on_kill | 击杀溢出转移给随机敌 |
| quantum_observer | 量子观测仪 | on_play | 随机复制 1 颗选中骰点数 → 额外伤 |
| limit_breaker | 狂暴小丑 | passive | 小丑骰上限 9 → 100 |
| extra_free_reroll | 嗜血骰袋 | passive | 解锁非战士嗜血（代价 ×2）|

### 13.5 遗物遗失触发说明

**遗物 trigger 8 种 + 每种的执行点**：

| trigger | 执行点 |
|---|---|
| `on_play` | 出牌时（`expectedOutcomeCalc` 遍历）|
| `on_kill` | 每击杀后（`postPlayEffects.executeKillRelics`）|
| `on_reroll` | 每次重投调用时（`useReroll.rerollSelected`）|
| `on_move` | 地图节点移动（进入 battle/event/shop/campfire 等前）|
| `on_turn_end` | 玩家回合结束（`turnEndProcessing`，先于敌人回合）|
| `on_battle_end` | 战斗胜利时（`handleVictory`）|
| `on_damage_taken` | 玩家受击后（`enemyAI` 攻击之后）|
| `on_fatal` | 致死保护（`hasFatalProtection` → `triggerHourglass`）|
| `passive` | 只存在、不触发，被动生效 |

---

## 14. 状态效果（`data/statusInfo.tsx STATUS_INFO`）

**体验定位**：状态效果是附加在玩家或敌人身上的持续性 buff / debuff，共 7 种：中毒（每回合掉血）、灼烧（下次行动前掉血）、虚弱（攻击 -25%）、易伤（受伤 +50%）、嘲讽（敌人只能打这一个）、迟缓（CD +1）、护甲（吸收伤害）。状态有层数和回合数两个维度，叠加规则见 §14.5。

### 14.1 7 种状态（StatusEffect.type）

| type | 名 | 颜色 | 来源 | 结算时机 | 持续机制 |
|---|---|---|---|---|---|
| poison 毒 | 中毒 | purple-400 | caster / priest / 事件 | 每回合开始 | value 每回合-1，0 时移除 |
| burn 灼烧 | 灼烧 | orange-500 | fire 元素 / caster 火球 | 敌人回合末 / 玩家回合末 | 整层一次爆发，随后移除（无 duration）|
| freeze 冻结 | 冻结 | cyan-400 | ice 元素 | 无持续伤害 | duration-1 每回合，=0 移除 |
| slow 减速 | 减速 | cyan-300 | - | 无持续伤害 | duration-1 每回合，=0 移除 |
| weak 虚弱 | 虚弱 | purple-400 | caster 诅咒 / 牌型特效 | 攻击时 ×0.75 | duration-1 每回合 |
| vulnerable 易伤 | 易伤 | orange-400 | priest / 牌型特效 | 受击时 ×1.5 | duration-1 每回合 |
| strength 力量 | 力量 | red-400 | priest 增益 | 攻击时 +value | 永久（无 duration）|

### 14.2 玩家中毒结算顺序（敌人回合开始）

```
1. 玩家中毒结算（enemyAI Step 1）
   if poison.value > 0:
       hp -= poison.value
       poison.value -= 1
       if poison.value == 0: remove
```

### 14.3 敌人灼烧结算（`settleEnemyBurn`）

```
遍历存活敌人:
    if burn.value > 0:
        dmg = burn.value
        statuses.remove('burn')
        hp -= dmg
        armor = 0  // 灼烧破甲
```

### 14.4 敌人中毒结算（`settleEnemyPoison`）

```
遍历存活敌人:
    if poison.value > 0:
        dmg = poison.value
        poison.value -= 1
        hp -= dmg
    tickStatuses(其他状态 duration-=1)
```

### 14.5 状态叠加规则（`upsertStatus`）

```ts
function upsertStatus(statuses, type, value, duration?):
    existing = statuses.find(s => s.type === type)
    if existing:
        existing.value += value
        if duration !== undefined: existing.duration = duration  // 覆盖 duration
    else:
        new StatusEffect{type, value, duration?}
```

### 14.6 `tickStatuses`（每回合递减）

```ts
function tickStatuses(statuses):
    返回非 poison/burn 的状态 duration -= 1
    duration == 0 移除
    poison/burn 不参与 tick（有独立结算）
```

---

(续 Part 3：第 15-21 章)
