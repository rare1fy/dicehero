# Dice Hero Godot 移植 · 伤害演出 & 遗物半弹窗专题

> 来源：React 版 `logic/settlement/*` 4 Phase 编排器 + `components/SettlementOverlay.tsx` + `components/DamagePreviewCard.tsx` + `components/RelicPanelView.tsx` + `components/PlayerHudView.tsx` 的 DamageOverlay + `index.css` 全部 keyframes。
> 本章专门描述**战斗爽点两大核心 UI**：① 伤害演出（Settlement Overlay，4 阶段自动播放）② 遗物半弹窗（Relic Panel Drawer，自动展开 + 即将/正在触发双状态）。
> 刘叔第 3 轮审阅指出原文档漏掉了这部分，独立成篇补全。
> 版本：v1.0 · 2026-04-27

---

## 0. 体验定位（先看这段）

**这是整个战斗的爽点所在**。玩家按下"出牌"按钮后，**不会**立即看到一个冷冰冰的"你造成 X 点伤害"——而是会经历一段 2~4 秒的**自动结算演出**：

1. **屏幕瞬间暗下来**，正中央弹出**牌型卡片**（同花顺 / 对子 / 元素共鸣 ... 金色粗边+像素角饰）。
2. **底部自动展开遗物库半弹窗**（平时折叠在底栏的"▲ 遗物库 -N件-"按钮，此时自动弹起），让玩家在演出期间能**眼睛不动就看到**自己哪个遗物要出力。
3. **骰子依次亮起**，每一颗滚动的点数叠加到"基础值"里（伴随 tick 音效 + 0.3s 节奏）。
4. **倍率方块"砰"一下弹大**（Phase 2.5 的 bounce 动画），代表牌型倍率已确认。
5. **特殊效果列表逐条浮现**（骰子 onPlay / 遗物 / 血怒 / 狂暴 / 连击），**每条触发时对应的遗物图标在半弹窗里爆一下白金光**（relic-flash 0.6s），同时结算面板里该条自带遗物 icon。
6. **屏幕震屏 + 爆红圈/金圈光波 + 超大数字弹出**（按伤害档分 5xl / 6xl / 7xl 三档字号，≥40 变金色字）。
7. **最终清理**：3 秒内演出结束，遗物库半弹窗自动收起，屏幕恢复正常，敌人血条开始扣血。

**爽点来源**：节奏感（0.3s→0.3s→0.35s 递进）+ 联动感（遗物刷光 = 玩家看懂自己为什么打这么高）+ 仪式感（金色边框 + 像素角饰 + tick 音效叠加）。

**Godot 版必须 1:1 复刻**——任何阶段省略都会让"构筑感"崩掉。

---

## 1. 整体时序总览

```
[玩家点击"出牌"]
      ↓
setShowRelicPanel(true)        ← 遗物库自动展开（飞入动画 y: 100% → 0，spring damping=25 stiffness=300）
setSettlementPhase('hand')
      ↓ 0.6s
Phase 1  hand      牌型卡片 + 元素共鸣提示
      ↓
setSettlementPhase('dice')
      ↓ N × 0.28s（N = 骰子数）
Phase 2  dice      骰子逐颗亮起，base 累加 + tick 音效
      ↓ 可选：分裂骰/磁吸骰插入动画 +0.4~0.5s
      ↓
setSettlementPhase('mult')
      ↓ 0.5s
Phase 2.5 mult     倍率方块"砰"弹大 + bounce 动画
      ↓
setSettlementPhase('effects')
      ↓ M × 0.35s（M = 触发效果数）
Phase 3  effects   特殊效果逐条浮现
                   ├─ 遗物触发 → setFlashingRelicIds([...]) 持续 800ms → 半弹窗刷光
                   └─ 结算面板同步显示 relic/blooddrop/flame/zap 图标
      ↓
setSettlementPhase('bounce')
      ↓ 0.5s
结算面板整体 Q 弹定格
      ↓
[棱镜聚焦 / 连击终结 立即应用]
      ↓
setSettlementPhase('damage')
      ↓
setShowDamageOverlay({damage, armor, heal})  ← 全屏红圈+金圈+白光+震屏+大数字
      ↓ 0.8s / 1.0s / 1.2s（按伤害档）
Phase 4  damage    最终伤害飞出
      ↓
setSettlementPhase(null)
setSettlementData(null)
setShowRelicPanel(false)       ← 遗物库自动收起
setShowDamageOverlay(null)     ← 1.8s / 2.5s 后
```

**硬规则 1.1**：从 Phase 1 开始到 Phase 4 结束的整段动画，`pointer-events: none`，禁止玩家打断。

**硬规则 1.2**：`setShowRelicPanel(true)` 必须在 Phase 1 第一行就调用，不能延迟——让玩家刚抬头就已经看到半弹窗亮起。

---

## 2. 遗物半弹窗（Relic Panel Drawer）

### 2.1 默认折叠态（底栏按钮）

**位置**：`PlayerHudPanel` 底部，紧贴手牌上方。

**外观**：
- 宽度占满 HUD，高度 ~28px。
- 背景：`linear-gradient(to bottom, rgba(40,34,26,0.6) 0%, rgba(20,18,14,0.3) 60%, transparent 100%)`。
- 顶部边框：`2px solid rgba(80,70,55,0.6)` + 金色外发光 `box-shadow: 0 -4px 12px rgba(0,0,0,0.5), 0 -1px 0 rgba(120,100,70,0.25)`。
- 内容三行居中：
  - 第 1 行：`▲` 金色箭头（11px）
  - 第 2 行：`遗物库`（12px 金色粗体，letter-spacing 0.2em）
  - 第 3 行：`- N件 -`（9px 暗灰 mono）

**交互**：
- 单击 → `setShowRelicPanel(prev => !prev)` 切换。
- **悬停态**：第 2 行"遗物库"文字从 `var(--pixel-gold)` 过渡到 `var(--pixel-gold-light)`。

### 2.2 展开态（半弹窗）

**触发方式**（3 种）：
1. **玩家主动点击**底栏 `▲ 遗物库` 按钮。
2. **自动展开**：伤害演出 Phase 1 启动瞬间，`setShowRelicPanel(true)`。
3. **结算结束自动收起**：Phase 4 最后一行 `setShowRelicPanel(false)`。

**出场动画**：
```
motion.div backdrop   opacity: 0 → 1    （背景 rgba(0,0,0,0.5) 淡入）
motion.div panel      y: 100% → 0      spring { damping: 25, stiffness: 300 }
```

**退场动画**：`y: 0 → 100%` 同样 spring，背景 opacity 淡出。

**硬规则 2.2.1**：展开高度 **55vh**（`max-h-[55vh]`），不占满屏。

**硬规则 2.2.2**：展开时**背景**是半透明蒙层 `bg-black/50`，覆盖整个战斗场景；点击蒙层 = 收起。

**硬规则 2.2.3**：展开时**面板**点击不收起（`onClick e.stopPropagation()`）。

### 2.3 面板结构

```
┌─────────────────────────────────────────┐
│  遗物库 (N)                       [X]   │ ← 顶部栏 py:8 px:16 border-bottom
├─────────────────────────────────────────┤
│                                         │
│  遗物                                   │ ← 分区标题 text-[8px] opacity 60%
│  ┌───┬───┬───┬───┬───┬───┐              │
│  │🔥 │🌊 │⭐ │🗡️ │🛡️ │💧 │              │ ← 遗物网格 grid-cols-6 gap-1.5
│  │火 │海 │命 │嗜 │铁 │血 │              │
│  │焰 │潮 │运 │血 │壁 │瓶 │              │
│  ├───┼───┼───┼───┼───┼───┤              │
│  │💀 │🌀 │⚡ │...│...│...│              │
│  └───┴───┴───┴───┴───┴───┘              │
│                                         │
└─────────────────────────────────────────┘
```

**顶部栏**：
- 左：`遗物库 (N)` 11px 金色粗体 + `textShadow: 0 0 6px rgba(212,160,48,0.4)`
- 右：`[X]` 关闭按钮（PixelClose 组件，2x size）

**遗物网格**：
- 6 列等宽 grid（`grid-cols-6 gap-1.5`），内边距 `p-3`。
- 每格 `padding: 4px 2px 3px`，圆角 3px。
- 滚动：`overflow-y-auto max-h-[calc(55vh - 40px)]`，容纳超过 12 颗遗物时垂直滚动。

**单格内容**（从上到下）：
1. RelicPixelIcon（2.5 倍像素）
2. 遗物名（最多 4 字，超过截断）6px 暗灰粗体
3. 计数器（如命运之轮 `X/5`）6px 橙色 mono（仅当 `relic.counter !== undefined`）

### 2.4 三态视觉（**核心爽点**）

遗物格有 **3 种视觉状态**，由 `isActive` + `isFlashing` 两个布尔字段决定：

| 状态 | 条件 | 边框 | 背景 | 光晕 |
|---|---|---|---|---|
| **普通** | 既不 active 也不 flashing | `border-2 border-[var(--dungeon-panel-border)]` | `bg-[var(--dungeon-panel)]` | 无 |
| **即将触发** | `expectedOutcome.triggeredAugments.some(ta => ta.relicId === relic.id)` | `border-2 border-[var(--pixel-gold)]` | `bg-gradient-to-b from-[rgba(212,160,48,0.2)] to-[rgba(180,120,30,0.08)]` | `boxShadow: 0 0 8px rgba(212,160,48,0.3)` |
| **正在触发** | `flashingRelicIds.includes(relic.id)` | 同上 | 同上 | **`boxShadow: 0 0 16px rgba(255,255,255,0.9), 0 0 30px rgba(212,160,48,0.8)`** + `animation: relic-flash 0.6s ease-out` |

**三态转换时序**（玩家视角）：

```
选中骰子         → 即将触发态（金色边+微光，预告本次出牌会激活哪些遗物）
点击出牌         → Phase 1 半弹窗自动展开，所有即将触发的遗物保持金色边
Phase 3 逐条演出 → 当前触发的这一条：正在触发态（爆白金光 800ms）→ 回落即将触发态
Phase 3 演完     → 所有遗物回普通态
Phase 4 结束     → 半弹窗自动收起
```

**硬规则 2.4.1**：`isActive`（即将触发）**持续存在**于整个"选中骰子 → 出牌 → 演出结束"期间，用于给玩家**预告**。

**硬规则 2.4.2**：`isFlashing`（正在触发）**只持续 800ms**，过后自动从 `flashingRelicIds` 数组中移除：
```ts
setFlashingRelicIds(prev => [...prev, relicId]);
setTimeout(() => setFlashingRelicIds(prev => prev.filter(id => id !== relicId)), 800);
```

**硬规则 2.4.3**：Phase 3 每条效果之间间隔 350ms，若效果关联遗物，**新效果的刷光开始时旧效果的刷光还没结束**（800ms 窗口 > 350ms 间隔），因此**可能同时有 2-3 个遗物在刷光**——这是预期行为，别"优化"掉。

### 2.5 遗物详情弹窗

**触发**：单击半弹窗内任意遗物格 → `setSelectedRelic(relic)`。

**外观**：
- 固定居中 `fixed inset-0 z-[200]`
- 背景蒙层 `bg-black/70`
- 中央卡片 `max-w-[280px]`，像素风边框
- 内容：
  - 名称（14px 粗白 + pixel text shadow）
  - 稀有度（8px 金色：普通/精良/稀有/传说）
  - 描述（10px，`formatDescription` 支持富文本 `[value]` 染色）
  - 触发时机（8px 暗灰：每次出牌/击杀时/重 Roll 时/战斗结束/致命伤害时/回合结束/被动）
- 底部关闭按钮（全宽 ghost 风）

**硬规则 2.5.1**：点击背景蒙层 = 关闭，点击卡片本身不关闭。

**硬规则 2.5.2**：z-index 200，**高于**伤害演出 overlay（z-100）——演出期间玩家仍可以点开遗物详情。

---

## 3. 伤害演出（Settlement Overlay）

### 3.1 全屏结构

```
┌───────────────────────────────────────────────┐
│  [全屏黑 rgba(0,0,0,0.7) 蒙层]                │
│                                               │
│                ┌──────────────┐               │
│                │  同 花 顺    │ ← 牌型卡片 pt-[8vh]
│                │              │
│                │ ◆ 元素共鸣 ◆  │ ← isSameElement 才显示
│                └──────────────┘               │
│                                               │
│                ⚃ ⚄ ⚁ ⚅ ⚂                      │ ← 骰子序列 mt-5 gap-2
│                                               │
│              ┌─────────────────┐              │
│              │  42  ×  220%    │ ← 计分条 mt-3
│              └─────────────────┘              │
│                                               │
│           [+ 火焰骰: 伤害+8]                  │ ← 触发效果列表 Phase 3
│           [× 血怒: 3/5 层 +60%]                │
│           [× 连击: +20%]                      │
│                                               │
└───────────────────────────────────────────────┘
```

**硬规则 3.1.1**：整个演出层 `pointer-events: none`，**禁止玩家打断**。

**硬规则 3.1.2**：z-index **50**，低于遗物半弹窗（z-150）——玩家可以在演出期间透过来看半弹窗的遗物刷光。

### 3.2 牌型卡片（Phase 1）

**出场动画**：`scale: 0.5 → 1`, `opacity: 0 → 1`, `y: -20 → 0`, duration 0.3s ease-out。

**外观**：
- 背景：`linear-gradient(180deg, rgba(20,16,30,0.95) 0%, rgba(12,10,20,0.98) 100%)`
- 边框：`3px solid var(--pixel-gold)`, border-radius 2px
- 多重阴影：`0 0 20px rgba(212,160,48,0.3), 0 0 40px rgba(212,160,48,0.1), inset 0 1px 0 rgba(255,240,180,0.1), inset 0 -2px 0 rgba(0,0,0,0.4)`
- 四角贴 `2px × 2px` 金色小方块（像素角饰）

**主文字**：
- 24px（text-2xl）, font-black, letter-spacing 宽
- 金色 `var(--pixel-gold)` + `textShadow: 0 0 16px rgba(212,160,48,0.9), 0 2px 0 rgba(0,0,0,0.8)`

**副文字（元素共鸣提示）**：
- 仅当 `isSameElement = true`（`activeHands` 包含 同元素/元素项/元素葬礼/皇家元素顺 之一）才显示。
- 文本：`◆ 元素共鸣 +100% ◆`
- 10px 青色 `var(--pixel-cyan)`, `animate-pulse`, letter-spacing 极宽
- `textShadow: 0 0 10px rgba(48,216,208,0.8)`

### 3.3 骰子序列（Phase 2）

**出场**：每颗骰子 stagger 0.08s 延迟，`scale: 0 → 1`, `rotate: -180 → 0`, type: spring, stiffness 300。

**亮起逻辑**：
```ts
const isLit = settlementPhase === 'dice' && settlementData.currentEffectIdx >= i;
```
- Phase 2 推进时 `currentEffectIdx` 从 0 递增到 N-1，骰子从左到右依次亮。
- 亮起的骰子：`scale: 1.1` + `filter: drop-shadow(0 0 8px rgba(212,160,48,0.7))`
- 未亮：`scale: 1`，无滤镜。

**节奏**：
- 每颗骰子间隔 **280ms**（不是均匀 300ms，这是原版体感调优值，别改）
- 伴随 `playSettlementTick(i)`——音调随 i 递增（越到后面越亢奋）

**特殊骰插入动画**：
- **分裂骰**（`split`）：触发时在自己右边插入一颗随机 1-6 的标准骰，`id` 为原 id+9000，停顿 400ms 后继续；播 `relic_activate` 音效；同时 addLog + addToast 提示。
- **磁吸骰**（`magnet`）：把其他骰子的点数同化为自己的点数。插入后停顿 400ms。
- **插入后必须重算牌型**：如果分裂/磁吸改变了 bestHand（同花顺变成普通攻击 ...），重新调 `checkHands` + 更新 `outcome.damage / X / handMultiplier`，再 400~500ms 展示新状态。

### 3.4 计分条（Phase 2 + Phase 2.5）

**结构**：`{currentBase} × {currentMult}%`

**外观**：
- 背景 `linear-gradient(180deg, rgba(16,20,28,0.95) 0%, rgba(8,12,18,0.98) 100%)`
- 边框 `2px solid var(--dungeon-panel-border)`, border-radius 2px
- min-width 140px
- `boxShadow: inset 0 1px 0 rgba(255,255,255,0.05), inset 0 -2px 0 rgba(0,0,0,0.3), 0 4px 12px rgba(0,0,0,0.5)`

**数字规格**：
- 左侧 base：text-2xl, `var(--pixel-blue)`, font-black font-mono, `textShadow: 0 0 8px rgba(60,120,220,0.5)`
- 分隔符 `×`：text-lg, `var(--dungeon-text-dim)`, font-black
- 右侧 mult：text-2xl, `var(--pixel-red)`, font-black font-mono
  - Phase 2 期间：`opacity-40`（未激活灰显）
  - Phase mult/effects/damage 期间：`opacity-100` + `textShadow: 0 0 8px rgba(220,60,60,0.5)` + `animate-value-pop` 抖动

**数字变化时**：Phase 2 每颗骰子加分时，`key={base-${currentBase}-${currentEffectIdx}}`——key 变化触发 `animate-value-pop` 重放。

**Phase 2.5 bounce 动画**：
```js
animate={{
  scale: [1, 1.25, 0.9, 1.05, 1],
  borderColor: ['panel-border', 'pixel-gold', 'pixel-orange', 'pixel-gold', 'panel-border'],
}}
transition={{ duration: 0.5, times: [0, 0.25, 0.5, 0.75, 1], ease: 'easeOut' }}
```
计分条会"砰→缩→弹→回"地抖一下，同时边框从灰→金→橙→金→灰循环一次，配合 `playMultiplierTick(0)` 音效。

### 3.5 触发效果列表（Phase 3）

**出场**：每条 stagger 0.08s，`opacity: 0 → 1`, `x: -20 → 0`。

**三色分类**：
| type | 背景 | 边框 | 文字 | 前缀 |
|---|---|---|---|---|
| `mult`（倍率类）| `rgba(224,60,60,0.15)` 暗红 | `var(--pixel-red)` | `var(--pixel-red-light)` | `×` |
| `heal`（治疗/护甲类）| `rgba(60,180,60,0.15)` 暗绿 | `var(--pixel-green)` | `var(--pixel-green-light)` | `+` |
| 其他（damage/status/armor）| `rgba(60,120,224,0.15)` 暗蓝 | `var(--pixel-blue)` | `var(--pixel-blue-light)` | `+` |

**条目结构**：`[图标] {prefix} {name}: {detail}`

**图标逻辑**：
- 有 `relicId` → 显示 `RelicPixelIcon relicId={...} size={2}`（遗物专属像素图标）
- 无 relicId 看 `icon` 字段：
  - `blooddrop` → PixelBloodDrop（血怒）
  - `flame` → PixelFlame（狂暴）
  - `zap` → PixelZap（连击）

**常见 detail 文本举例**：
- 火焰骰：`伤害+8` (type: damage)
- 血怒：`3/5层 +60%` (type: mult, rawMult: 1.6, icon: blooddrop)
- 狂暴：`+33%` (type: mult, rawMult: 1.33, icon: flame)
- 连击：`+20%` (type: mult, rawMult: 1.2, icon: zap)
- 火焰（元素反应）：`灼烧` (type: status)
- 冰冻：`冻结+2回合` (type: status)
- 雷击：`雷击AOE` (type: status)
- 治疗：`回复8HP` (type: heal)
- 破甲：`破甲→伤害` (type: damage)

### 3.6 Phase 3 节奏

```
for each effect in allEffects:
  1. setSettlementData({ ...prev, triggeredEffects: slice(0, i+1), currentBase/currentMult 同步更新, currentEffectIdx: i })
  2. playMultiplierTick(i + 1)        ← 每条 tick 音调递增
  3. if effect.relicId:
       setFlashingRelicIds(prev => [...prev, relicId])      ← 半弹窗遗物立即爆光
       setTimeout 800ms → 移除
  4. await 350ms                      ← 下一条
```

**硬规则 3.6.1**：`currentBase` / `currentMult` 必须在每条效果触发瞬间同步更新到计分条，**玩家才能看到"基础值从 42→50→50→50，倍率从 220%→220%→275%→330%"这样的爬升感**。

### 3.7 Phase 3 bounce 定格

Phase 3 结束后进入 `setSettlementPhase('bounce')`，计分条再弹一次 0.5s，随后：
- 应用 **棱镜聚焦**（`lockedElement`）：找到选中骰子里当前激活元素，`game.lockedElement = activeElem`，floatingText 提示"棱镜聚焦: {element}锁定!"
- 应用 **连击终结**（`comboFinisherBonus > 0`）：`outcome.damage *= (1 + bonus)`，floatingText 提示"连击终结! +25%"

### 3.8 Phase 4 最终伤害（DamageOverlay）

**这是爽点顶峰。**

**触发**：`setShowDamageOverlay({ damage, armor, heal })`

**外观**（全屏 z-100）：

1. **背景径向红晕**：`radial-gradient(circle, rgba(255,40,40,0.15) 0%, transparent 70%)`
2. **外圈红光波**：
   - `w-32 h-32 rounded-full`
   - `border: 3px solid rgba(255,80,40,0.6)`, `boxShadow: 0 0 40px rgba(255,80,40,0.4)`
   - 动画：`scale: 0.3 → 3, opacity: 0.8 → 0`, duration 1.2s ease-out
3. **内圈金光波**（延迟 0.1s）：
   - `w-24 h-24 rounded-full`
   - `border: 2px solid rgba(255,200,60,0.5)`
   - 动画：`scale: 0.2 → 2.5, opacity: 0.6 → 0`, duration 1.0s
4. **白光闪爆**（全屏）：
   - `background: radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 60%)`
   - 动画：`opacity: 0.6 → 0`, duration 0.4s
5. **12 颗粒子向外飞散**：
   - 每颗 `w-2 h-2 border-radius:1px`
   - 颜色 3 色循环：pixel-red / pixel-orange / pixel-gold
   - 飞行方向：`x: cos(i * 30°) * (80~140)`, `y: sin(i * 30°) * (80~140)`（圆形爆散）
   - 时长 0.8~1.2s, ease-out, delay 0.05s
6. **核心数字 + 护甲/治疗副标**

### 3.9 伤害数字**三档字号**（铁律）

```ts
if (damage >= 40) {
  字号 = text-7xl
  颜色 = var(--pixel-gold)      // 金色（毁灭级）
  textShadow = '0 0 60px rgba(212,160,48,1), 0 0 120px rgba(212,160,48,0.7), 0 4px 0 rgba(0,0,0,0.5)'
} else if (damage >= 20) {
  字号 = text-6xl
  颜色 = var(--pixel-orange)    // 橙色（重击级）
  textShadow = '0 0 50px rgba(224,120,48,0.9), 0 0 100px rgba(224,120,48,0.5), 0 4px 0 rgba(0,0,0,0.5)'
} else {
  字号 = text-5xl
  颜色 = var(--pixel-red)       // 红色（普通）
  textShadow = '0 0 40px rgba(255,60,60,0.9), 0 0 80px rgba(255,60,60,0.5), 0 4px 0 rgba(0,0,0,0.5)'
}
letterSpacing = '2px'
```

**入场动画**：`scale: [0.1, 1.4, 1.0], opacity: [0, 1, 1]`, duration 0.5s, times [0, 0.6, 1], ease-out（先放大超过再缩回）。

**持续脉冲**（显示期间）：`scale: [1, 1.05, 1], textShadow: 渐强→渐弱`, repeat 2, duration 0.4s——数字在显示的 1.8s 里一直轻微颤动。

### 3.10 护甲/治疗副标

- 位置：主伤害数字下方，水平 `gap-3`
- 只在对应值 > 0 时显示
- 字号 text-2xl, font-bold
- 颜色：护甲 `var(--pixel-blue)`；治疗 `text-emerald-400`
- 出场延迟 0.3s（让玩家先看清主伤害数字）

### 3.11 卡肉 + 震屏**三档**（铁律）

Phase 4 开始时按伤害比例决定反馈强度（核心公式见 `phase4_finalDamage.ts`）：

```ts
const maxEnemyHp = max(enemies.map(e => e.maxHp || e.hp))
const damageRatio = outcome.damage / maxEnemyHp
const isHeavyHit = damageRatio >= 0.5 || outcome.damage >= 60
const isMassiveHit = damageRatio >= 1.0 || outcome.damage >= 120
```

| 档位 | 条件 | 卡肉帧 | 音效 | 震屏 | DamageOverlay 持续 | Phase 4 总时长 |
|---|---|---|---|---|---|---|
| **Massive（毁灭）** | ratio≥1.0 OR dmg≥120 | **150ms 卡肉冻结** | `playHeavyImpact(1.0)` + 3 连 `critical` 音（0/120/250ms）| 500ms | 2500ms | 1200ms |
| **Heavy（重击）** | ratio≥0.5 OR dmg≥60 | **100ms 卡肉冻结** | `playHeavyImpact(0.6)` + 2 连 `critical`（0/150ms）| 400ms | 1800ms | 1000ms |
| **Medium（重伤）** | dmg≥20 | 无 | `critical` 单发 | 300ms | 1800ms | 800ms |
| **Light（普通）** | dmg>0 | 无 | `hit` 单发 | 300ms | 1800ms | 800ms |

**硬规则 3.11.1**：**卡肉 = 在伤害数字弹出**前**冻结屏幕 100/150ms**（用 `await new Promise(r => setTimeout(r, 150))` 实现）——这是"重击体感"的核心。

**硬规则 3.11.2**：震屏用 `pixel-screen-shake` CSS 关键帧（详见 index.css L1163），`transform: translateX/Y` 6px 范围抖动 0.5s steps。

### 3.12 清理

Phase 4 末尾：
```ts
setSettlementPhase(null);       // 演出层消失
setSettlementData(null);        // 释放数据
setShowRelicPanel(false);       // 遗物半弹窗自动收起
```

伤害 Overlay 由独立的 setTimeout 控制（1800/2500ms 后 `setShowDamageOverlay(null)`）——注意这个比 Phase 4 await 长，意思是**演出主体已结束但 DamageOverlay 还在屏幕上滞留 0.5~1s**，让玩家回味。

---

## 4. 出牌预期卡（DamagePreviewCard，演出前的预告）

### 4.1 定位

**触发**：玩家选中骰子后，`expectedOutcome` 非 null 且非敌人回合、非结算中时自动显示。

**位置**：战场下方 `absolute z-[80] bottom-2 left-2 right-2`，max-w-[340px] 居中。

**与演出的关系**：演出开始后（`settlementPhase !== null`），这张卡**消失**（`shouldRender = expectedOutcome && !isEnemyTurn && !settlementPhase`）——让位给 SettlementOverlay。

### 4.2 结构

```
┌──────────────────────────────────────┐
│ 同花顺 Lv.2     ⚡42  🛡+8  💚+6  ☠3  │ ← 顶部行
├──────────────────────────────────────┤
│ 🔥 🌊 ⭐                              │ ← 即将触发的遗物（可点开详情）
└──────────────────────────────────────┘
```

**外观**：
- 背景 `linear-gradient(180deg, rgba(20,16,10,0.92) 0%, rgba(14,10,6,0.96) 100%)`
- 边框 `2px solid var(--pixel-gold)`
- 光晕 `0 0 12px rgba(212,160,48,0.2)` + 内光 `inset 0 1px 0 rgba(212,160,48,0.1)`

### 4.3 顶部行

- 左：牌型名 12px 金色粗体 + `Lv.N`（8px opacity 60%）如果 handLevel > 1
- 右：数值组
  - 伤害 `⚡{damage}` 13px 红 font-black mono，**带无限循环 textShadow 脉冲**（1.2s loop）
  - 护甲 `🛡+{armor}` 10px 蓝
  - 治疗 `💚+{heal}` 10px 绿
  - 状态效果（中毒/灼烧...）9px 各自主题色

**单击顶部行 = 打开 CalcModal**（详细计算过程）。

### 4.4 底部行（即将触发的遗物）

**集合来源**：
```ts
outcomeTriggeredRelicIds = new Set(
  (expectedOutcome.triggeredAugments || []).map(ta => ta.relicId).filter(id => typeof id === 'string')
)
sceneTriggeredRelics = game.relics.filter(r =>
  flashingRelicIds.includes(r.id) || outcomeTriggeredRelicIds.has(r.id)
)
```

**显示条件**：`sceneTriggeredRelics.length > 0` 才显示底部行。

**分隔线**：`h-[1px]` 金色横向渐变 `linear-gradient(90deg, transparent, var(--pixel-gold), transparent)`, opacity 0.25。

**遗物小图标**（scale 入场）：
- `6x6` 方格，金色边，`borderRadius: 2px`
- 背景 `rgba(212,160,48,0.12)`, 光晕 `0 0 6px rgba(212,160,48,0.3)`
- RelicPixelIcon size 1.5
- 单击 = 打开 `selectedRelic` 详情弹窗

---

## 5. Godot 移植实现建议

### 5.1 节点结构建议

```
BattleScene (root)
├── Background (ParallaxBackground)
├── EnemyStage
├── PlayerHud (CanvasLayer)
│   ├── HpBar
│   ├── StatusRow
│   ├── HandDiceContainer
│   ├── DamagePreviewCard        ← 出牌预期卡（见 §4）
│   └── RelicDrawerButton        ← 折叠按钮（见 §2.1）
├── RelicDrawer (CanvasLayer, layer=2)     ← 半弹窗（见 §2.2）
│   ├── Backdrop
│   └── Panel (AnimationPlayer: slide_up/slide_down)
│       ├── TopBar
│       └── RelicGrid (GridContainer cols=6)
├── SettlementOverlay (CanvasLayer, layer=3)  ← 伤害演出（见 §3）
│   ├── Dimmer
│   └── Content
│       ├── HandLabel
│       ├── DiceRow
│       ├── ScoreBar
│       └── EffectList
└── DamageOverlay (CanvasLayer, layer=4)     ← 最终伤害（见 §3.8-3.11）
    ├── RingWaves (2 个 Control，AnimationPlayer)
    ├── WhiteFlash
    ├── MainDamage (Label)
    ├── SubStats (HBoxContainer: Armor + Heal)
    └── Particles (12 个 Control 或 GPUParticles2D)
```

### 5.2 状态机

用 Autoload `BattleAnimationController` 单例管理：

```gdscript
enum SettlementPhase { NONE, HAND, DICE, MULT, EFFECTS, BOUNCE, DAMAGE }

signal phase_changed(phase: SettlementPhase)
signal relic_flash_requested(relic_id: String)
signal damage_overlay_requested(damage: int, armor: int, heal: int)
signal relic_drawer_toggle_requested(open: bool)

var _flashing_relic_ids: Array[String] = []
```

### 5.3 Phase 执行器（异步协程）

```gdscript
func run_settlement_animation(outcome: ExpectedOutcome) -> void:
    _set_phase(SettlementPhase.HAND)
    relic_drawer_toggle_requested.emit(true)    # 半弹窗自动展开
    await _phase1_hand_display(outcome)          # 0.6s
    await _phase2_dice_scoring(outcome)          # N×0.28s + 特殊骰
    await _phase25_mult_bounce()                 # 0.5s
    await _phase3_effects(outcome)               # M×0.35s
    await _phase_bounce()                        # 0.5s
    await _phase4_final_damage(outcome)          # 0.8~1.2s
    _set_phase(SettlementPhase.NONE)
    relic_drawer_toggle_requested.emit(false)    # 半弹窗自动收起
```

### 5.4 遗物刷光实现

```gdscript
# Phase 3 内部
for i in range(all_effects.size()):
    var eff = all_effects[i]
    _update_scorebar(eff)
    if eff.relic_id != "":
        _flashing_relic_ids.append(eff.relic_id)
        relic_flash_requested.emit(eff.relic_id)
        get_tree().create_timer(0.8).timeout.connect(func():
            _flashing_relic_ids.erase(eff.relic_id)
            relic_flash_ended.emit(eff.relic_id)
        )
    await get_tree().create_timer(0.35).timeout
```

**RelicDrawer 侧监听**：

```gdscript
func _ready():
    BattleAnimationController.relic_flash_requested.connect(_on_relic_flash)
    BattleAnimationController.relic_flash_ended.connect(_on_relic_flash_ended)

func _on_relic_flash(relic_id: String):
    var cell: RelicCell = _find_relic_cell(relic_id)
    if cell:
        cell.play_flash_animation()   # AnimationPlayer 播 relic_flash 动画（白光 boxShadow 等效 = Godot 的 modulate + emission）
```

### 5.5 Godot 下 "boxShadow" 的等价实现

Web 里的 `box-shadow: 0 0 16px rgba(255,255,255,0.9)` 在 Godot 下用 **Panel + StyleBoxFlat** 的 `shadow_color` + `shadow_size` 模拟，或者用一个额外的 `ColorRect` 子节点作为光晕层，通过 `modulate.a` 动画控制可见度。

**推荐方案**：每个 RelicCell 内部放一个 `GlowLayer: ColorRect`（白色，scale 1.2x 覆盖，默认 `modulate.a = 0`），激活时 `AnimationPlayer.play("flash")` 让 `modulate.a: 0 → 1 → 0` 在 0.6s 内完成，配合 `scale: 1.0 → 1.1 → 1.0` 轻微放大。

### 5.6 卡肉 + 震屏实现

**卡肉**（100/150ms 冻结）：
```gdscript
Engine.time_scale = 0.0
await get_tree().create_timer(0.15, false, false, true).timeout  # 用真实时间
Engine.time_scale = 1.0
```

**震屏**（Camera2D offset 抖动）：
```gdscript
@onready var camera: Camera2D = $Camera2D
func screen_shake(intensity: float, duration: float):
    var tween = create_tween()
    for i in range(int(duration * 60)):  # 60fps
        tween.tween_property(camera, "offset",
            Vector2(randf_range(-intensity, intensity), randf_range(-intensity, intensity)),
            1.0 / 60.0)
    tween.tween_property(camera, "offset", Vector2.ZERO, 0.1)
```

---

## 6. 实现 Checklist（Godot 版移植）

### 6.1 遗物半弹窗

- [ ] 折叠态底栏按钮：`▲ 遗物库 - N件 -`，金色边 + 底部渐变背景
- [ ] 展开动画：y 100%→0 spring damping=25 stiffness=300
- [ ] 收起动画：y 0→100% 同 spring
- [ ] 高度 55vh，背景蒙层 black/50，点击蒙层收起，点击面板不收起
- [ ] 6 列 GridContainer，单格含 icon + 名称截断 + 计数器
- [ ] 普通态（灰边灰底）
- [ ] **即将触发态**（金边 + 渐变底 + 光晕 0 0 8px 金）
- [ ] **正在触发态**（爆白金光 + 0.6s relic-flash 动画 + 800ms 自动退出）
- [ ] 单击遗物打开详情弹窗（z=200 独立层）
- [ ] 伤害演出 Phase 1 **自动展开**
- [ ] 伤害演出 Phase 4 **自动收起**

### 6.2 出牌预期卡（DamagePreviewCard）

- [ ] 选中骰子后显示，演出期间隐藏
- [ ] 顶部行：牌型 + Lv + ⚡damage(脉冲)/🛡armor/💚heal/☠status
- [ ] 底部行：即将触发遗物缩略图（金边+微光）
- [ ] 点击顶部行打开 CalcModal
- [ ] 点击底部遗物打开遗物详情

### 6.3 伤害演出 - Phase 1 hand

- [ ] 牌型卡片入场 scale 0.5→1 + y -20→0 duration 0.3s
- [ ] 金色边框 + 四角像素角饰
- [ ] 元素共鸣副标 `◆ 元素共鸣 +100% ◆`（仅 isSameElement）
- [ ] 持续 0.6s

### 6.4 伤害演出 - Phase 2 dice

- [ ] 骰子 stagger 0.08s 入场（scale + rotate spring）
- [ ] 每颗亮起 280ms 间隔
- [ ] 亮起状态：scale 1.1 + drop-shadow 金光
- [ ] playSettlementTick(i) 音调递增
- [ ] 分裂骰插入动画（+400ms）
- [ ] 磁吸骰同化动画（+400ms）
- [ ] 分裂/磁吸后必须重算牌型

### 6.5 伤害演出 - Phase 2.5 mult

- [ ] 计分条 bounce 动画 scale [1, 1.25, 0.9, 1.05, 1] 0.5s
- [ ] 边框颜色循环 灰→金→橙→金→灰
- [ ] playMultiplierTick(0) 音效

### 6.6 伤害演出 - Phase 3 effects

- [ ] 每条效果 350ms 间隔出现
- [ ] 三色分类（mult 红 / heal 绿 / 其他蓝）
- [ ] 图标：relic 优先，否则 blooddrop/flame/zap
- [ ] **遗物触发时 setFlashingRelicIds + 800ms 退出**
- [ ] currentBase / currentMult 同步爬升到计分条
- [ ] playMultiplierTick(i+1) 音调递增

### 6.7 伤害演出 - Phase 4 damage

- [ ] 伤害档位判定（Massive ≥100%/120 ； Heavy ≥50%/60 ； Medium ≥20 ； Light >0）
- [ ] 卡肉冻结（Massive 150ms / Heavy 100ms / 其他无）
- [ ] 音效链（Massive 3 连 critical / Heavy 2 连 / Medium 单 critical / Light hit）
- [ ] 震屏时长（Massive 500ms / Heavy 400ms / 其他 300ms）
- [ ] DamageOverlay 持续（Massive 2500ms / 其他 1800ms）
- [ ] Phase 4 await 时长（Massive 1200 / Heavy 1000 / 其他 800ms）

### 6.8 DamageOverlay 视觉

- [ ] 背景径向红晕 rgba(255,40,40,0.15)
- [ ] 外红圈 scale 0.3→3 opacity 0.8→0 duration 1.2s
- [ ] 内金圈 scale 0.2→2.5 opacity 0.6→0 duration 1.0s delay 0.1s
- [ ] 白光闪爆 opacity 0.6→0 duration 0.4s
- [ ] 12 颗粒子圆形爆散（3 色循环：red/orange/gold）
- [ ] **伤害数字三档字号**：≥40 7xl 金 / ≥20 6xl 橙 / 其他 5xl 红
- [ ] 数字入场 scale 0.1→1.4→1.0 duration 0.5s
- [ ] 数字持续脉冲 scale [1,1.05,1] repeat 2
- [ ] 护甲/治疗副标延迟 0.3s 出现

### 6.9 清理

- [ ] Phase 4 末尾 setPhase(NONE) + setSettlementData(null) + setShowRelicPanel(false)
- [ ] DamageOverlay 独立 setTimeout 1800/2500ms 后 null

---

## 7. 自然语言完整还原（读这段就能脑补画面）

> 玩家刚从 6 颗骰子里挑了 3 颗同花色+连号的，组成了"同花顺"。底部出牌按钮文字变成"出牌: 同花顺"，上方出现一张暗金小卡片：左边"同花顺 Lv.2"，右边"⚡ 42"红字在微微脉冲。卡片下面三颗小遗物图标发着微弱金光——火焰徽章、碧海之潮、命运之轮。
>
> 玩家点下出牌按钮。
>
> **0s**：屏幕瞬间暗下来，底部的遗物库按钮"咻"地飞起来变成一个占屏幕下半 55% 的半弹窗，12 颗遗物整齐陈列。刚才那 3 颗（火焰/碧海/命运）边框从普通灰色变成了金色+微光。
>
> **0.1s**：正中央 scale 从 0.5 弹到 1，"同花顺"三个字带着金色粗边框和像素角饰定格，下面小字"◆ 元素共鸣 +100% ◆"青色脉冲。耳朵里听到一声 `relic_activate` 清脆音效。
>
> **0.6s**：牌型卡片保持，下方排出 3 颗像素骰子（stagger 0.08s 飞入，带旋转）。第一颗开始 glow，屏幕下方计分条显示 `0 × 180%`（倍率灰色未激活）。
> - **0.88s**：`"tick"`，第一颗骰子加点，计分条跳到 `6 × 180%`。
> - **1.16s**：`"tink"` 音调升高，第二颗亮，`12 × 180%`。
> - **1.44s**：`"tonk"` 再升，第三颗亮，`18 × 180%`。
> - （如果有分裂骰，中间会插入一颗带白光的新骰，+400ms 延迟）
>
> **1.94s**：计分条突然"砰"地弹大 1.25 倍，边框从灰闪到金再到橙再到金，倍率数字从灰色变成鲜红 `180%`，textShadow 加重。`playMultiplierTick(0)`。
>
> **2.44s**：下方逐条浮现红色/绿色/蓝色标签：
> - `+ 火焰骰: 伤害+8`（蓝标，底部遗物库里的**火焰徽章**爆一下白金光**🔥⚡**！）
> - （350ms 后）`× 碧海之潮: +25%`（红标，**碧海之潮**爆光！）
> - （350ms 后）`× 血怒: 3/5层 +60%`（红标，带血滴图标，无遗物刷光）
> - （350ms 后）`× 连击: +20%`（红标带闪电图标）
>
> 每条出现时计分条上的 base/mult 都在同步爬升，从 `18 × 180%` 涨到 `26 × 180%` 再到 `26 × 225%` 再到 `26 × 330%` 再到 `26 × 396%`。半弹窗里的三颗遗物先后爆光，前两颗还没熄灭第三颗就接上来——整个下半屏白金色一片。
>
> **3.84s**：计分条再弹一次（bounce 0.5s），作为"算完了"的仪式。
>
> **4.34s**：黑屏一闪，150ms 卡肉冻结——**画面完全静止**。`playHeavyImpact(1.0)`。
>
> **4.49s**：一个径向红晕从中心炸开，紧跟着外红圈从小爆到屏幕外，内金圈跟进，白光闪一下；12 颗像素粒子从中心圆形爆散飞出；一个巨大的金色 `112` 从 0.1 弹到 1.4 再回 1.0，textShadow 60px + 120px 双层金光，连击音效 `critical` 连响 3 声（0ms/120ms/250ms）。下方副标 `+8 护甲` 蓝色从下往上飞入（delay 0.3s）。屏幕震动 500ms。
>
> **5.69s**：演出主体收尾，`112` 还在屏幕上脉冲。半弹窗"咻"地缩回底部变回小按钮。敌人血条开始扣血。
>
> **7s**：`112` 褪去，DamageOverlay 彻底消失。玩家重新获得控制权，看向地图上还剩多少回合。
>
> "爽。" 玩家心想。"我刚才那套构筑真的牛逼。"

---

## 8. 验证状态

| 项 | 源码证据 | 文档落地 |
|---|---|---|
| Phase 1 自动展开半弹窗 | `phase1_handDisplay.ts:21` `setShowRelicPanel(true)` | §1.2 §2.2 |
| Phase 4 自动收起半弹窗 | `phase4_finalDamage.ts:62` `setShowRelicPanel(false)` | §3.12 |
| 遗物刷光 800ms | `phase3_effects.ts` setTimeout 800 | §2.4.2 §3.6 |
| 即将触发态 isActive | `RelicPanelView.tsx:115-116` | §2.4 |
| 正在触发态 isFlashing | `RelicPanelView.tsx:117-118` boxShadow+animation | §2.4 |
| 三档伤害字号 | `PlayerHudView.tsx:76` ≥40/≥20/其他 | §3.9 |
| 三档卡肉+震屏 | `phase4_finalDamage.ts:19-42` Massive/Heavy/Medium/Light | §3.11 |
| 出牌预期卡消失条件 | `DamagePreviewCard.tsx:31` `!settlementPhase` | §4.1 |

---

**文档版本**：v1.0 · 2026-04-27
**作者**：🐶通用狗鲨（Coder 岗位 考古输出）
**审查**：Verify 待审
**下游交付**：Godot 版 BattleAnimationController + RelicDrawer + SettlementOverlay + DamageOverlay 四个场景的实现依据
