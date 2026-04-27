# Coder 日志 - DOC-FIX-R2
日期: 2026-04-27
任务: Godot 设计文档 6 条设计修正 + Verify WARN 落地 + 文风改造
触发: 刘叔指令"有些核心规则写得有问题...按要求修正对应文本，带上 verify 指出的问题一起改好"
结果: [PASS]

---

## 一、刘叔提出的 6 条核心修正

| # | 错误描述 | 正确描述 | 落地位置 | 状态 |
|---|---|---|---|---|
| 1 | 篝火=遗物升级 | 篝火=回血 / 净化骰子二选一 | Part3 §16.2 | [OK] |
| 2 | 宝箱=花金币开箱 | 宝箱=新小玩法（保留基础形式说明）| Part3 §16.4 | [OK] |
| 3 | skillSelect 阶段存在 | 已删除，增幅模块不存在 | Part1 §1.1 / §1.2 + Part3 §18.7 BGM | [OK] |
| 4 | 胜利奖励简单带过 | 战利品弹窗 + 4 档分级（普通/精英/中 Boss/终极 Boss）| Part3 §16.5 + Checklist §21.8 | [OK] |
| 5 | 盗贼初始普通骰 3 颗 | 4 颗 | Part1 §3.1 | [OK] |
| 6 | 骰子升级机制完整描述 | 搁置不实现，标注待办 | Part2 §11.7 + Part3 §16.2 | [OK] |

### 1. 战利品 4 档分级详表（核心修正）

| 战斗类型 | 金币 | 骰子 | 遗物 | 特殊 |
|---|---|---|---|---|
| 普通战 | 爆金币 | 固定 3 选 1 | 无 | — |
| 精英战 | 爆金币（多）| 固定 3 选 1 | **+1 随机遗物** | — |
| 中层 Boss | 大量金币 | 传说骰 3 选 1 | 传说遗物 | — |
| 终极 Boss | 大量金币 | 传说骰 3 选 1 | 传说遗物 | **+1 手牌上限（bossDrawCount）** |

**实现要点**：所有胜利共用 `LootScreen` 组件（逐项 collect → finishLoot）。

### 2. 关键源码对照

| 用户指令 | 源码现状 | 决策 |
|---|---|---|
| 盗贼初始 4 颗 standard | `data/classes.ts:115` 是 `std×3 + r_quickdraw + r_combomastery` | **按用户指令修正为 std×4**（设计层修正，非源码复刻）|
| 终极 Boss 额外 +1 手牌 | `lootHandler.ts:44` 所有 Boss 都加 | **按用户指令修正为只有终极 Boss 才加** |
| 篝火回血/净化 | 源码有 `CampfireUpgradeView.tsx` | **按用户指令移除升级分支** |
| skillSelect | 源码有 `SkillSelectScreen.tsx` 残留 | **按用户指令删除** |

---

## 二、Verify 5 条 WARN 落地

| # | WARN | 状态 |
|---|---|---|
| W1 | 敌人 emoji 字段空，用像素精灵 | Part2 §10 序言说明 [RESOLVED] |
| W2 | drawFromBag 是纯函数 | 原文档已准确 [NO-CHANGE] |
| W3 | Boss 小兵从当前章节普通敌人池抽 | 原文档已准确 [NO-CHANGE] |
| W4 | DICE_BY_RARITY.uncommon = [] | 原文档已准确 [NO-CHANGE] |
| W5 | 初始骰子以 classes.ts 为准 | Part2 §11.8 已标注 [NO-CHANGE] |

---

## 三、文风改造（11 处体验定位序言）

按刘叔要求"用自然语言先描述再列程序逻辑"，在所有核心章节前加入"**体验定位**"段落：

### Part1
- §3.2 战士专属机制：越打越猛、血越少越凶；普攻可多选
- §3.3 法师专属机制：可以选择不出牌 = 吟唱；过充博弈
- §3.4 盗贼专属机制：连击节奏 = 先铺垫后收割
- §1.1 流程图：先自然语言描述再流程图

### Part2
- §10 敌人大全：4 种 combatType + 45+ 只敌人分层
- §11 骰子大全：4 类骰子 + 构筑循环
- §12 牌型 17 种：17 种扑克 + 元素组合
- §13 遗物大全：4 档稀有度 + `triggerRelics()` 规范
- §14 状态效果：7 种 buff/debuff

### Part3
- §15 挑战系统：小目标 + 挑战宝箱
- §16 节点大全：商店/营火/事件/宝箱节奏
- §17 灵魂晶经济：跨局元进度货币
- §18 UI 交互：隐性规则即手感
- §20 边界情况：源码陷阱点汇总

---

## 四、留痕文件清单

| 路径 | 用途 |
|---|---|
| `agent-work/fix-docs-20260427.py` | Part1 初版批量改 |
| `agent-work/fix-docs-part1-rest.py` | Part1 补匹配的 1.1 流程图 |
| `agent-work/fix-docs-part3.py` | Part3 篝火/宝箱/战利品/Checklist 5 块 |
| `agent-work/fix-docs-part3-patch.py` | Part3 补匹配的 2 块 |
| `agent-work/fix-docs-part2-verify.py` | Part2 + Part3 自然语言 + Verify 更新 |
| `agent-work/update-readme-tasks.py` | README v2 + TASKS 待办 |
| `agent-work/verify-patches.py` | 12 点验证全通过 |

---

## 五、git 提交记录

commit 等待下一轮推送：
- 7 份文档全部更新（01/02 考古不动，03/04/05/06 + README 全改，TASKS.md 新增 2 条）
- 提交说明：`文档(godot-port): 按刘叔 6 条修正意见更新设计规范 v2.0`

---

## 六、自评

[PASS] 12/12 patch 验证通过。
[PASS] 源码铁证核对完毕（5 条关键差异，全部按"用户指令 > 源码"优先级处理）。
[PASS] 文风改造完成 11 处体验定位序言。
[PASS] 待办条目已进 TASKS.md。

风险：
- 战利品 4 档分级是按用户口述整理，具体金币数值（"大量"）未量化，需 Designer 补数值稿。
- 宝箱小玩法为空待设计，Godot 落地前需 Designer 先出方案。
