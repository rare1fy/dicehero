# Dice Hero · Godot 复刻设计规范 v1.0 · Part 3（最终）

> 续 Part 2。本 Part 包含第 15-21 章：挑战系统 / 商店营火事件 / 经济 / UI 交互 / 美术呈现 / 边界情况 / Checklist。

---

## 15. 洞察弱点挑战系统（`utils/instakillChallenge.ts` + `logic/instakillChallengeAid.ts`）

**体验定位**：每场战斗开局会随机下发一个"洞察弱点挑战"小目标（如"3 回合内秒杀某敌人"、"只用同花顺击杀"、"不重投通关"），完成后战利品会额外掉落**挑战宝箱**（高价值随机奖励）。挑战类型按战斗级别分两池：普通/精英战用 Normal Pool（8 种）、Boss 战用 Boss Pool（单独设计）。挑战失败不会惩罚，但错过奖励会让这场战斗性价比降低。


### 15.1 触发时机

- **每场战斗开始**（`buildBattleGameState`）生成一个挑战
- **每次波次切换**（`tryWaveTransition`）重新生成挑战
- 挑战字段：`game.instakillChallenge`

### 15.2 生成函数

```ts
generateChallenge(depth: number, chapter: number, diceCount: number, nodeType?: string)
```

- 根据 `nodeType === 'boss'` 切换池：`BOSS_POOL` / `NORMAL_POOL`
- 按 `weight` 加权随机

### 15.3 8 种挑战类型

#### Normal Pool（普通/精英战）

| type | 名 | 描述 | value 来源 |
|---|---|---|---|
| `descending_chain` | 递减打击 | 连 N 次出牌，每次点数和严格递减（断链重计）| N=3（depth<6）/ 4（≥6）|
| `same_sum_twice` | 镜像之力 | 连 N 次出牌点数和完全相同（不同则重计）| N=2（depth<6）/ 3（≥6）|
| `exact_sequence` | 命运密码 | 依次 3 次出牌点数和恰好=A/B/C（错一步重来）| A=mid+2, B=mid, C=mid-2（mid=round(dc×2.5)）|
| `forced_normal` | 负重前行 | 连 N 次选≥3 颗骰出普攻牌型（断链重计）| N=2（depth<5）/ 3（≥5）|
| `alternating_parity` | 阴阳交替 | 连 N 次，每次≥2 颗骰全同奇或全同偶，且与上次相反 | N=3（depth<5）/ 4（≥5）|
| `full_hand_low` | 背水一战 | 一次选中所有手牌出牌且点数和≤N | N=round(dc×2.2) |

#### Boss Pool（Boss 战）

| type | 名 | 描述 |
|---|---|---|
| `mono_value` | 天命齐心 | 一次出牌选≥3 颗骰，全部点数相同 |
| `all_ones_or_twos` | 微光破晓 | 一次出牌选≥3 颗骰，全部点数≤2 |
| `descending_chain` | 灭世倒计时 | 连 4 次出牌递减 |
| `same_sum_twice` | 绝对镜像 | 连 3 次相同点数和 |
| `alternating_parity` | 阴阳轮转 | 连 5 次奇偶交替 |
| `exact_sequence` | 命运解码 | 依次 4 次点数和恰好=A/B/C/D |
| `full_hand_low` | 置之死地 | 全出且点数和≤round(dc×1.8) |
| `forced_normal` | 自废武功 | 连 3 次≥3 颗骰普攻 |

### 15.4 挑战检查（`checkChallenge`）

调用时机：每次 `playHand` 后

输入：
```ts
interface ChallengeCheckContext {
  selectedDice?: Die[]
  activeHands?: HandType[]
  pointSum?: number
  rerollsUsedSinceLastPlay?: number
  totalDiceInHand?: number
  ownedDiceTypes?: string[]
  killedThisPlay?: number
}
```

### 15.5 完成后援助效果（5 种，各 20% 概率）

600 ms 后触发：
- `playSound('critical')`
- `setScreenShake(true)` 600 ms
- 弹 Toast + 浮字"✦ 弱点击破 ✦"

| roll | 效果描述 |
|---|---|
| <0.2 | 全场敌人 -N% maxHp 伤害（Boss 30%/普通 50%）|
| 0.2~0.4 | 全场敌人 HP 降至 N%（Boss 50%/普通 35%）|
| 0.4~0.6 | 全场敌人 +N 灼烧 +N 毒（N = 3+depth+(chapter-1)×2）|
| 0.6~0.8 | 立刻补抽 1 颗骰子 |
| >0.8 | 骰子库临时全换成随机强力骰（灌铅/分裂/倍增/元素/小丑/混沌/元素骰之一）|

### 15.6 挑战宝箱（`logic/lootHandler.openChallengeChest`）

完成挑战的战斗掉落 `challenge_chest`。开启：
- 40% 金币 30~70
- 35% 骰子（uncommon + rare 随机抽）
- 25% 遗物（common + uncommon 未拥有的）

---

## 16. 商店 / 营火 / 事件 / 宝箱

**体验定位**：战斗节点之间穿插的 4 种休整 / 补给节点，构成了跑图的节奏韵律：
- **商店（merchant）**：花金币买骰子 / 遗物 / 净化骰子，每张地图出 2 个。
- **营火（campfire）**：每章节 2 个（固定在 4、9 层），二选一休整，回血或净化骰子。
- **事件（event）**：每张地图 1-2 个，10 种剧情事件，风险与收益并存。
- **宝箱（treasure）**：每张地图 1 个，奖励小玩法（见 §16.4）。


### 16.1 商店（`logic/shopGenerator.ts` + `config/balance/world.ts SHOP_CONFIG`）

**商品结构**：
- 3 个从"候选池"随机抽（遗物 3 个 + 骰子 2 个 + 重掷强化 1 个合计 6 个候选）
- 外加 1 个固定"骰子净化"位

**候选池构建**：
```
遗物候选 = pickRandomRelics([...common, ...uncommon, ...rare], 3, 已拥有)
骰子候选 = shuffle([...uncommon, ...rare]).slice(0, 2)
重掷强化候选 = 1 个 reroll_legacy（+1 每回合免费重掷，永久）
```

**价格公式**：
```
priceRange: [20, 80]
randPrice = floor(random × (80 - 20 + 1)) + 20
```
- 骰子 rare 额外 +30 价
- 骰子 uncommon 额外 +10 价
- 固定骰子净化价 = random[20, 80]

**`haggler_relic` 遗物**：全物品 ×0.8

### 16.2 营火（篝火）

**自然语言说明**：篝火是两条休整分支的选择题，进入篝火节点时弹窗提示"回血"或"净化骰子"二选一，选完即退回地图。

| 选项 | 自然语言描述 | 机制 |
|---|---|---|
| 休息（回血）| 让英雄围着篝火打个盹，恢复一定生命值 | `hp = min(maxHp, hp + 40)` |
| 净化骰子 | 从骰子库里挑一颗骰子烧掉（永久移除），常用于剔除诅咒骰或构筑不想要的弱骰 | 进入骰子选择界面 → 选一颗 → 从 `ownedDice / diceBag` 移除 |

> **历史说明**：源码里仍保留"强化遗物"组件（`CampfireUpgradeView.tsx`），但**现版本设计上已替换为净化骰子**。Godot 版不实现升级遗物分支，只实现"回血 / 净化骰子"两个选项。
>
> **待办（TASKS）**：骰子升级体系（详见 Part2 §11.7）暂缓实现，后续再评估是否引入。

### 16.3 10 个随机事件（完整清单）

| # | id | 标题 | 分类 | 选项 | 效果 |
|---|---|---|---|---|---|
| 1 | shadow_creature | 阴影中的怪物 | combat | 战 / 绕 | 触发战斗 / -8HP |
| 2 | ancient_altar | 古老祭坛 | shrine | 献血 / 力量 | +30 金 -10HP / +遗物 -15HP |
| 3 | void_trade | 虚空交易 | shrine | 升级牌型 / 离开 | -15HP 升级随机牌型 / 无事 |
| 4 | deadly_trap | 致命陷阱 | trade | 硬牛 / 舍财 | -15HP+25 金 / -20 金 |
| 5 | mysterious_merchant | 神秘旅商 | trade | 买药 / 买强化水 / 讨价 | -25 金+35HP / -35 金+10maxHp / 50%+25HP 50% 无事 |
| 6 | wheel_of_fate | 命运之轮 | trade | 转动（-10HP）/ 观望 | 60%+40 金 / 40%+遗物 |
| 7 | cursed_spring | 诅咒之泉 | shrine | 饮用 / 净化 | +40HP-5maxHp / -15 金+20HP |
| 8 | dice_gambler | 骰子赌徒 | trade | 赌金币 / 赌生命 / 拒绝 | 50/50 +60/-30 金 或 +遗物/-20HP |
| 9 | forgotten_forge | 遗忘铸炉 | shrine | -30 金强化 / 探索 / 离开 | 70%+遗物 / 30%-12HP |
| 10 | soul_rift | 灵魂裂隙 | trade | 踏入 / 观察 | -20HP+遗物+30 金 / +15 金 |
| 11 | mystic_furnace | 神秘熔炉 | shrine | 投入 / 离开 | 去除 1 骰 -12HP / 无事 |

### 16.4 宝箱节点

**原版（React 版）实现**：踩到宝箱节点 → 触发 `treasure` 阶段 → 免费遗物 3 选 1（从 common + uncommon + rare 池抽）→ 选完回地图。源码里的开箱动画是骰子滚动后弹出三张遗物卡。

**Godot 版设计方向**：花金币"开宝箱"的原版玩法保留为基础形式说明，但 Godot 版计划**替换为一种更有互动感的小玩法**（例如踩盒子抽骰子、翻牌匹配奖励、或小型投骰 minigame），具体设计待 Designer 立项补稿。

> **实现建议**：先按原版"免费遗物 3 选 1"做通最小可玩版本（保证奖励总量不失衡），等小玩法设计落地后再替换这一层 UI 和交互。
>
> **待办（TASKS）**：宝箱节点小玩法设计 → 新增任务条目 `DESIGN-TREASURE-MINIGAME`。

### 16.5 战利品（`logic/lootHandler.buildLootItems`）

**自然语言说明**：所有战斗胜利后都会弹出**战利品拾取界面**（类似《杀戮尖塔》的"好东西"弹窗）——玩家可以逐项点击收下物品，点完"完成"退出。具体物品构成按战斗分级来分：

#### 分级奖励表

| 战斗类型 | 金币 | 骰子构筑 | 遗物 | 额外 |
|---|---|---|---|---|
| **普通战** | 爆金币（基于敌人 `dropGold` 汇总 + 职业/遗物加成）| 固定 3 选 1（从 common / uncommon 池）| 无 | 如完成"洞察弱点挑战"则额外出挑战宝箱 |
| **精英战** | 爆金币（比普通多）| 固定 3 选 1（稀有度略升）| 比普通多 **1 个随机遗物** | 同上 |
| **中层 Boss（章节内 Boss）** | **大量金币** | 固定 **传说级骰子 3 选 1** | **1 件传说级遗物** | 同上 |
| **终极 Boss（章节最终 Boss）** | **大量金币** | 固定传说级骰子 3 选 1 | 1 件传说级遗物 | 在中层 Boss 基础上**额外 +1 固定手牌骰子上限（`maxDrawCount +1`）** |

#### 关键实现细节

- **战利品弹窗统一入口**：所有胜利共用同一个 `LootScreen` 组件（逐项 collect → finishLoot），不因战斗类型开分支 UI。
- **爆金币计算**：`baseGold = Σ(enemy.dropGold) + on_battle_end 遗物 bonusGold`，不同战斗类型通过敌人 `dropGold` 字段拉开差距（普通 25 / 精英 50 / Boss 80，来自 `LOOT_CONFIG`）。
- **骰子 3 选 1**：胜利后先进入 `diceReward` 阶段（进骰子选择界面，可刷新），再进 `loot` 阶段领战利品。
- **中层 / 终极 Boss 区分**：用 `currentNode.depth >= mapMaxDepth` 判断是否为终极 Boss（章节最大深度的 Boss 节点），非终极即中层。
- **终极 Boss 的手牌上限 +1**：以 `LootItem { id: 'bossDrawCount', type: 'diceCount', value: 1 }` 形式出现，收下后 `game.maxDrawCount += 1` 永久生效。
- **挑战宝箱**：任何战斗只要达成 `instakillCompleted=true` 就会额外掉 `challenge_chest`，点开后随机 3 档奖励（金币 40% / 骰子 35% / 遗物 25%）。
- **遗物掉率**：精英/Boss 战 **100%** 掉遗物；普通战 **0%** 掉遗物（普通战的"骰子 3 选 1"是固定项，不是遗物）。

> **设计修正说明**：原 React 版所有 Boss（中层 + 终极）都会给 `bossDrawCount+1`，现设计修正为**只有终极 Boss 才给手牌上限奖励**，中层 Boss 只给传说骰 3 选 1 + 传说遗物 + 大量金币。Godot 版按此修正实现。

### 16.6 章节切换（`chapterTransition` phase）

触发：最终 Boss 击败且 `chapter < 5`

执行：
- `chapter += 1`
- `hp = min(maxHp, hp + floor(maxHp × 0.6))`
- `souls += 75`
- 重新生成地图（相同结构，换敌人池）
- 进入章节转场动画（待 Godot 补）

---

## 17. 灵魂晶经济（`logic/soulCrystalCalc.ts`）

**体验定位**：灵魂晶是跨局持久化的"元进度"货币——每局结束按"击杀数 / 楼层数 / Boss 数"结算成灵魂晶，累积后可在主菜单的**灵魂商店（SoulShop）**里购买**永久强化**（初始 HP+5、初始金币+10、额外开局遗物槽等）。灵魂晶经济是让玩家"死了也有进度"的核心设计，避免纯 Roguelike 的挫败感。


### 17.1 获取公式

```ts
totalSoulGain = Σ(killedEnemies, killedData => {
    if (killedData.overkill <= 0) return 0
    cappedOverkill = min(killedData.overkill, enemy.maxHp)
    depthMult = soulCrystalMultiplier + currentDepth × 0.1
    gain = max(1, ceil(cappedOverkill × depthMult × 0.15))
    return gain
})
```

### 17.2 初始参数

```
soulCrystalMultiplier: 1.0
multPerDepth: 0.2  // 每层 +0.2
conversionRate: 0.15  // 基础 15%
```

### 17.3 涨价公式

```ts
getSoulCrystalMult(depth, currentMult) = currentMult + depth × 0.2
```

商店涨价通过此公式控制产销比。

---

## 18. UI 交互规则（`components/PlayerHudView.tsx` + `hooks/useBattleCombat.tsx`）

**体验定位**：本章专门汇总所有"藏在 UI 层的隐性规则"——诸如按钮在什么条件下禁用、文案在不同职业下如何切换、飘字 / Toast / 抖动等反馈时机。这些细节决定了"手感"，Godot 版必须 1:1 复刻才能保留原版的战斗节奏感。典型例子：战士多选普攻时出牌按钮文案变红"多选普攻：特殊效果失效"，法师未出牌时结束回合按钮变紫色+粒子表示"进入吟唱"。


### 18.1 出牌按钮 3 态

| 条件 | 文案 | 颜色 |
|---|---|---|
| 非战士多选普攻（`isNonWarriorMultiNormal=true`）| "不成牌型（仅限选 1 颗）" | 灰色，禁用 |
| `playsLeft > 0` | "出牌: {bestHand}" | 绿色 |
| `playsLeft <= 0` | "出牌次数耗尽" | 灰色，禁用 |

### 18.2 结束回合按钮 3 色职业皮肤

| 条件 | 文案 | 颜色 | 额外效果 |
|---|---|---|---|
| 法师 `playsLeft === maxPlays`（未出牌）| "吟唱" | 紫色 | 紫色粒子特效 |
| 盗贼 `comboCount >= 1 && playsLeft > 0` | "迎风连击" | 青色 | 青色粒子 |
| 其他 | "结束回合" | 金色 | 箭头指示 |

### 18.3 骰子视觉状态

| 字段 | 视觉 |
|---|---|
| `selected=true` | 高亮边框 + 抬起 |
| `rolling=true` | 8 帧随机点数动画 |
| `spent=true` | 灰色半透明 |
| `playing=true` | 飞向目标 |
| `justAdded=true` | 600ms 出现动画 |
| `isShadowRemnant=true` | 暗紫色边框 |
| `isCursed=true` | 诅咒紫色光效 |
| `isCracked=true` | 碎裂纹理 |
| `isTemp=true` | 半透明临时外观 |
| `isElemental && element !== 'normal'` | 元素颜色光效（fire 红 / ice 青 / thunder 黄 / poison 绿 / holy 金）|

### 18.4 飘字系统（`addFloatingText`）

| 字段 | 默认 |
|---|---|
| 普通飘字持续 | 2200ms |
| `large=true` 飘字 | 3500ms |
| 位置 | target='player' 或 'enemy' |
| 移动 | 向上浮动 + 淡出 |
| 冷却 | 无（多条同时可存在）|

### 18.5 Toast 系统

- 同内容 Toast 3000ms 内不重复（内部去重）
- 类型：`gold / buff / damage / heal`（影响图标与颜色）

### 18.6 动画时序全表（`config/balance/player.ts ANIMATION_TIMING`）

| 项 | 时长（ms）|
|---|---|
| 敌人死亡动画持续 | 1800 |
| 敌人死亡清理缓冲 | **2200** |
| 波次转换死亡缓冲 | 400 |
| Boss 入场动画 | 1200 |
| 攻击特效持续 | 400 |
| 说话特效持续 | 400 |
| 胜利后敌人清理延迟 | 2200 |
| 自动结束回合延迟 | **1000** |
| 出牌手牌抛出 | 500 |
| 洗牌动画 | 800 |
| 掷骰 8 帧 | [30,40,50,60,80,100,120,150] |
| 骰子重投帧 | 同上 |
| 挑战援助延迟 | 600（首个）+ 800（后续）|
| 高伤嘲讽延迟 | 600 |
| 高伤嘲讽持续 | 2000 |

### 18.7 BGM 切换规则

BGM 类型：`battle / map / merchant / campfire / event / diceReward / loot / treasure`

对应状态（切换点）：`battle / explore / start / stop` 三种

### 18.8 音效清单

| 音效 id | 触发点 |
|---|---|
| `reroll` | 掷骰第 3 帧 |
| `dice_lock` | 掷骰动画结束 |
| `armor` | 获得护甲 |
| `heal` | 回血 |
| `critical` | 挑战完成 |
| `player_attack` | 单体出牌 |
| `player_aoe` | AOE 出牌 |
| `player_death` | 玩家死亡 |
| `enemy` | 敌人攻击命中 |
| `enemy_defend` | 敌人上盾/防御 |
| `enemy_skill` | 敌人技能（priest/caster/塞骰）|
| `enemy_heal` | 敌人回血 |
| `enemy_death` | 敌人死亡 |
| `enemy_speak` | 敌人说话（lowHp/嘲讽）|

### 18.9 屏幕抖动

触发：
- 出牌结算 `setScreenShake(true)` 持续到结算动画结束
- 敌人攻击命中 `setScreenShake(true)` → 300ms 后 false
- 挑战援助 `setScreenShake(true)` → 300~600ms 后 false

### 18.10 遗物闪烁高亮

触发时机：遗物效果生效时 → `flashingRelicIds: Set<string>` 加入 id
- 持续 ~600ms 后移除
- UI 对应遗物图标播放高亮发光动画

---

## 19. 美术呈现原有形式（待 Godot 补齐）

### 19.1 画面风格

- **像素风**：所有 UI/骰子/遗物/敌人图标均为 SVG 像素画
- **配色**：CSS 变量 `--pixel-gold / --pixel-purple / --pixel-red` 等
- **字体**：等宽像素字体

### 19.2 骰子视觉（`components/PixelIcons.tsx` + `data/pixelIconData.ts`）

- 6 面骰子点阵图（1-6 点各一张）
- 元素骰：基础点阵 + 元素色叠加
- 双元素骰：半色分屏
- 诅咒骰：暗紫纹理覆盖
- 碎裂骰：裂纹覆盖

### 19.3 敌人图标（`data/enemySprites.ts`）

- 每个敌人一个 emoji 或 SVG 像素精灵
- 语音气泡：上方弹出，2000ms 后消失
- 状态图标：敌人下方横排显示（毒/灼烧/冻结/虚弱/易伤/力量）

### 19.4 HP/护甲条

- HP 红条（可配渐变）+ 当前/最大数字
- 护甲蓝条叠加在 HP 上方
- 变化时短暂高亮（armor +2 时 armorGained=true 持续 500ms）

### 19.5 地图

- 节点用不同图标区分（enemy/elite/boss/campfire/treasure/merchant/event）
- 当前节点高亮
- 可选路径连线
- 已访问节点灰化

### 19.6 动画节奏参考

| 阶段 | 动效 |
|---|---|
| 抽牌 | 骰子从牌库滑出 + 8 帧掷骰 |
| 重投 | 8 帧掷骰 + 元素抖动 |
| 出牌 | 手牌向左抛出 500ms + 结算面板弹出 |
| 敌人攻击 | 屏闪 + 屏抖 + 数字飘字 |
| 敌人死亡 | 1800ms 死亡动画 + 2200ms 缓冲清理 |
| 波次切换 | "第 X 波" 公告 |
| Boss 入场 | 1200ms 入场动画 |
| 章节切换 | 全屏转场（具体效果待 Godot 补）|

### 19.7 SVG 资产路径（Godot 可复用 PNG 导出）

- `src/components/ClassHands.tsx` → 三职业手部图案
- `src/components/PixelIcons.tsx` → 牌型图标
- `src/data/relicPixelData.ts` → 遗物像素数据
- `src/data/enemySprites.ts` → 敌人精灵
- `src/data/pixelIconData.ts` → 通用图标

---

## 20. 存档与边界情况

**体验定位**：本章汇总所有"容易写错、但不写错会崩盘"的边界规则——沙漏免死、黑市契约每局一次、法师波次切换吟唱保留、盗贼残骰持久化、薛定谔 3 件套一次性加成、命运之轮每战一次、章节最终胜利判定、存档反序列化等。每一条都是 Coder 考古时从源码里抠出来的"陷阱点"，Godot 版必须逐条对照实现。


### 20.1 沙漏免死（`emergency_hourglass` 遗物）

- `on_fatal` 触发
- 致命伤免一次，HP 保持不变
- **15 节点 CD**：触发后 `hourglassUsedAt = currentNodeDepth`，`currentDepth - hourglassUsedAt < 15` 时不再触发
- 判定函数：`hasFatalProtection(relics)`；触发：`triggerHourglass(relics)`

### 20.2 黑市契约（`black_market_contract` 遗物）

- `on_reroll` 触发
- 本回合首次卖血时：获得等同 roll 出骰子点数的金币
- `blackMarketUsedThisTurn=true` 后本回合禁用
- 敌人回合开始时 `blackMarketUsedThisTurn=false` 重置

### 20.3 法师波次切换保留条件

切波时 `playerClass === 'mage' && playsLeft >= maxPlays`（即未出牌）→ 保留：
- `chargeStacks`
- `mageOverchargeMult`
- `lockedElement`
- 手牌（不清空，不重新 rollAllDice）
- Bug-4 修复：即使 DoT 全灭触发波次，法师吟唱状态也保留

### 20.4 盗贼残骰持久化

出牌时 `shadowRemnantPersistent=true` 的残骰：
- 保留至下回合
- 下回合自动转为 `isTemp=true`（下下回合销毁）
- 一次性，不再持久

### 20.5 薛定谔 3 件套临时加成

| 字段 | 来源 | 消耗时机 |
|---|---|---|
| `tempDrawCountBonus` | on_turn_end 遗物（薛定谔袋子等）| 下回合 drawPhase |
| `rogueComboDrawBonus` | 盗贼连击效果 | 下回合 drawPhase |
| `relicTempDrawBonus` | on_damage_taken 遗物（铁壁护符等）| 下回合 drawPhase |

**用一次清零**：抽牌后立即归 0。

### 20.6 命运之轮一次性

- `fortuneWheelUsed` 每战重置
- 本战首次出牌后触发（任何职业可囤牌 1 次）
- 之后失效

### 20.7 章节最终胜利判定

```ts
resolvePostVictoryPhase(game) = 
  if currentNode.type === 'boss' && currentNode.depth === mapMaxDepth:
      if chapter >= 5: return 'victory'
      else: return 'chapterTransition'
  else: return 'diceReward'
```

### 20.8 存档系统

`DiceHeroGame.tsx` 用 localStorage 保存 `GameState`（详见 `hooks/useGamePersistence.ts`，待 Verify 确认）。

Godot 侧：用 `save_to_file.tres` + `ConfigFile` 或 `FileAccess.store_var` 保存对应结构（30+ 字段完整 GameState）。

关键字段必须序列化：
- `chapter`, `phase`, `map`, `currentNodeId`
- `playerClass`, `hp`, `maxHp`, `armor`, `souls`
- `ownedDice`, `diceBag`, `discardPile`, `relics`
- `statuses`, `battleWaves`, `currentWaveIndex`
- `chargeStacks`, `mageOverchargeMult`, `bloodRerollCount`, `comboCount`
- `warriorRageMult`, `furyBonusDamage`
- `handLevels`, `tempDrawCountBonus`, `rogueComboDrawBonus`, `relicTempDrawBonus`
- `blackMarketQuota`, `soulCrystalMultiplier`, `fortuneWheelUsed`
- `instakillChallenge`, `instakillCompleted`
- `stats`（bossesWon 等）

---

## 21. Godot 移植对照 Checklist

### 21.1 必须严格复刻的规则

- [ ] 三职业初始属性与初始骰子（`data/classes.ts`）
- [ ] 抽牌公式 `min(6, drawCount + chargeBonus + warriorBonus + 三种临时bonus - 保留数)`
- [ ] 战士 HP≤50% 血怒补牌 +1
- [ ] 战士 `rawTargetHandSize>6` 时触发 warriorRageMult 0.01 精度
- [ ] 法师未出牌保留手牌 + 吟唱护甲 `6 + currentCharge*2`
- [ ] 法师过充 +10%/回合
- [ ] 盗贼残骰持久化保留 1 回合后转 `isTemp`
- [ ] 重投 HP 代价 `maxHp × 2^(n+1) / 100`，非战士×2
- [ ] 战士嗜血 5 层上限 + 满层 +5 护甲
- [ ] skipOnPlay：多选普攻时 onPlay 全禁用
- [ ] 非战士 UI 层禁用多选普攻出牌按钮
- [ ] 连击精准终结 +25%（同牌型非普攻）
- [ ] 盗贼 `maxPlays=2` + 第 2 次非普攻 ×1.2
- [ ] 敌人回合开始重置 5 字段
- [ ] endTurn 返回重置 6 字段
- [ ] 牌型判定 17 种全覆盖 + 优先级
- [ ] 波次切换法师吟唱保留逻辑
- [ ] 精英每 3 回合塞碎裂骰 + 每 3 回合叠护甲
- [ ] Boss <40% + 每 2 回合塞诅咒骰 + 每 2 回合叠护甲
- [ ] ranger 追击公式 `max(1, floor(atk×0.4) + attackCount + 1)`
- [ ] priest 4 层决策优先级
- [ ] caster DoT 3 选 1 概率 40/30/30

### 21.2 敌人清单完整

- [ ] 20 种普通敌人（5 章 × 5 种）
- [ ] 10 种精英（每章 2 种）
- [ ] 10 种 Boss（每章 2 种）
- [ ] 每种敌人 8 类语音
- [ ] 5 种 combatType 行为差异
- [ ] 每只敌人的 phases 阶段切换

### 21.3 骰子清单完整

- [ ] 12 种通用池骰子
- [ ] 战士专属 `w_*` 骰子（待 Verify 确认 id 清单）
- [ ] 法师专属 `mage_*` 骰子
- [ ] 盗贼专属 `r_*` 骰子
- [ ] 骰子升级体系 Lv1/2/3
- [ ] 5 种元素坍缩效果
- [ ] 保留时 onPlay 7 种
- [ ] 出牌时 onPlay 27 种字段
- [ ] 小丑骰 vs 限界者遗物

### 21.4 遗物清单完整

- [ ] 85+ 遗物 8 种触发分类
- [ ] 稀有度分层 common/uncommon/rare/legendary
- [ ] 每种遗物的条件检测与生效时机
- [ ] 遗物池抽取（精英/Boss 战后）
- [ ] 开局遗物 3 选 1

### 21.5 地图与章节

- [ ] 15 层固定结构
- [ ] 5 章递进
- [ ] 节点类型加权概率
- [ ] 章节切换 +0.6×maxHp + 75 金
- [ ] 深度 15 级缩放系数表

### 21.6 事件 / 商店 / 营火 / 宝箱

- [ ] 10 个随机事件 + 每个事件的完整 options
- [ ] 商店 3+1 物品生成
- [ ] 篝火：回血（+40HP）/ 净化骰子（二选一）；升级遗物分支搁置不实现
- [ ] 宝箱小玩法（`DESIGN-TREASURE-MINIGAME` 待办）；落地前先按 3 选 1 遗物作基础形式

### 21.7 挑战赛

- [ ] 8 种挑战完整判定规则
- [ ] 普通池 / Boss 池切换
- [ ] 波次切换重生成挑战
- [ ] 5 种援助效果 20% 概率
- [ ] 挑战宝箱 3 档奖励

### 21.8 经济系统

- [ ] 灵魂晶获取公式 `overkill × (1.0 + depth×0.1) × 0.15`
- [ ] 初始 souls=0
- [ ] 战利品金币（基于敌人 `dropGold`：普通 25 / 精英 50 / Boss 80 + `on_battle_end` 遗物 bonusGold）
- [ ] 战利品弹窗（所有胜利共用 LootScreen，逐项 collect → finishLoot）
- [ ] 普通战奖励：金币 + 固定骰子 3 选 1
- [ ] 精英战奖励：金币 + 固定骰子 3 选 1 + **1 个随机遗物**
- [ ] 中层 Boss 奖励：大量金币 + 传说骰 3 选 1 + 传说遗物
- [ ] 终极 Boss 奖励：中层 Boss 的全部 + **手牌上限 +1（`bossDrawCount`）**
- [ ] 挑战宝箱（`instakillCompleted` 触发，3 档随机：金币 40% / 骰子 35% / 遗物 25%）
- [ ] 涨价通过 `getSoulCrystalMult` 控制

### 21.9 动画时序（否则手感差异大）

- [ ] 掷骰 8 帧：`[30,40,50,60,80,100,120,150]ms`
- [ ] 自动结束回合延时 1000ms
- [ ] 出牌动画 500ms
- [ ] 敌人死亡缓冲 2200ms
- [ ] 洗牌动画 800ms
- [ ] Boss 入场 1200ms
- [ ] 波次转换死亡缓冲 400ms

### 21.10 UI 层细节

- [ ] 结束回合按钮 3 色皮肤（法师紫/盗贼青/其他金）
- [ ] 出牌按钮文案 3 态
- [ ] 战士多选特殊骰 Toast 警告
- [ ] 血怒/狂暴/吟唱/过充/连击的 BuffTooltip
- [ ] 弃牌库洗牌粒子特效 + Toast

### 21.11 易忽略的遗物互动

- [ ] 命运之轮（首次出牌后保留手牌 1 次/战）
- [ ] 保留最高点遗物
- [ ] on_reroll: 黑市契约本回合只触发一次
- [ ] on_damage_taken: 怒火燎原 rageFireBonus
- [ ] on_kill: 溢出导管、魂晶
- [ ] 怒火骰 `w_fury`: furyBonusDamage 永久叠加
- [ ] 沙漏 `hasFatalProtection`: 玩家致死时救一次

### 21.12 状态效果

- [ ] 7 种状态类型 + 颜色 + 图标
- [ ] 玩家中毒 / 敌人灼烧 / 敌人中毒结算顺序
- [ ] `tickStatuses` 每回合 duration -1
- [ ] `upsertStatus` 叠加规则
- [ ] 灼烧特殊：整层一次爆发
- [ ] strength 无 duration 永久

### 21.13 需要 Verify 确认的 `[GAP]` 清单

- [ ] 三职业专属骰子完整 id 清单（`w_*` / `mage_*` / `r_*`）
- [ ] 所有骰子的 `onPlay` 字段具体值（特别是飞刀 `bounceAndGrow`、回旋刃 `boomerangPlay`、嘲讽 `tauntAll`）
- [ ] 遗物的具体 effect 返回值（数值精度）
- [ ] `useGamePersistence.ts` 的存档字段与序列化格式
- [ ] Boss 战第 1 波"小兵"的具体敌人类型池（是否只从当前章节抽）
- [ ] 章节转场具体 UI 形式
- [ ] `skillSelect` 阶段的触发条件与增幅模块内容

---

## 附录 A · 文档证据索引

### A.1 核心代码文件（按重要度降序）

| 文件 | 行数 | 说明 |
|---|---|---|
| `hooks/useBattleCombat.tsx` | ~400 | 出牌/选骰/自动结束回合 |
| `logic/enemyAI.ts` | 440 | 敌人 AI 主流程 |
| `logic/drawPhase.ts` | 225 | 抽牌阶段职业分支 |
| `logic/turnEndProcessing.ts` | ~200 | 回合结束前段 |
| `logic/expectedOutcomeCalc.ts` | 293 | 伤害 9 级链路 |
| `logic/damageApplication.ts` | 276 | 伤害应用 + AOE |
| `logic/postPlayEffects.ts` | ~300 | 出牌后副作用 |
| `logic/enemySkills.ts` | ~300 | Priest/Caster 决策 |
| `logic/elites.ts` | ~200 | 精英/Boss 补强 |
| `logic/attackCalc.ts` | ~80 | 攻击力计算 |
| `logic/enemyWaveTransition.ts` | ~80 | 波次切换 |
| `logic/enemyStatusSettlement.ts` | ~100 | DOT 结算 |
| `logic/shopGenerator.ts` | 82 | 商店 |
| `logic/soulCrystalCalc.ts` | 45 | 灵魂晶 |
| `logic/lootHandler.ts` | 173 | 战利品 |
| `logic/instakillChallengeAid.ts` | 157 | 挑战援助 |
| `utils/instakillChallenge.ts` | ~300 | 挑战生成 |
| `utils/handEvaluator.ts` | ~200 | 牌型判定 |
| `data/classes.ts` | ~100 | 三职业元数据 |
| `data/dice.ts` | 319 | 骰子定义 |
| `data/diceBag.ts` | 100 | 骰子库/弃牌库 |
| `data/handTypes.tsx` | 40 | 17 种牌型 |
| `data/relicsCore.ts` | 316 | 核心遗物 ~40 |
| `data/relicsAugmented.ts` | 489 | 增幅遗物 ~40 |
| `data/relicsSpecial.ts` | 289 | 特殊遗物 ~10 |
| `data/enemies.ts` | ~150 | 敌人生成 |
| `data/enemySprites.ts` | ~50 | 敌人精灵 |
| `data/statusInfo.tsx` | ~50 | 状态元数据 |
| `config/enemyNormal.ts` | ~250 | 20 普通敌配置 |
| `config/enemyEliteBoss.ts` | ~400 | 10 精英 + 10 Boss |
| `config/events/*.ts` | ~300 | 10 随机事件 |
| `config/balance/player.ts` | ~120 | 玩家缩放/动画时序 |
| `config/balance/enemy.ts` | ~100 | 敌人缩放/精英 Boss 配置 |
| `config/balance/world.ts` | ~100 | 地图/商店/营火/战利品 |
| `components/PlayerHudView.tsx` | ~400 | UI 主面板 |

### A.2 已知冲突 `[CONFLICT]`

无（本轮考古未发现明显冲突）。

### A.3 已知缺失 `[GAP]`

列于 21.13。待 Verify 返回原项目像素级审查后补齐。

---

**文档结束。交付日期 2026-04-27。**
