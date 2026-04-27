# Dice Hero - Godot 复刻工程文档

> 本目录收录从 React 版 dicehero2 迁移到 Godot 版的全部工程资产。
> 读者：Godot Coder + 测试 + 策划。
> 产出日期：2026-04-27。

---

## 文档清单（按阅读顺序）

| #   | 文件  | 作者  | 用途  | 行数  |
| --- | --- | --- | --- | --- |
| 01  | [coder-archaeology-r1](./01-coder-archaeology-r1.md) | Coder | **第一轮考古**：回合骨架 + 三职业机制 + 出牌/重投/牌型 | ~560 |
| 02  | [coder-archaeology-r2](./02-coder-archaeology-r2.md) | Coder | **第二轮考古**：敌人/骰子/遗物/事件/挑战/商店/地图 | ~500 |
| 03  | [designer-spec-part1](./03-designer-spec-part1.md) | Designer | **设计规范 Part1**：顶层架构 + 回合流程 + 敌人 AI（§1-9）| 553 |
| 04  | [designer-spec-part2](./04-designer-spec-part2.md) | Designer | **设计规范 Part2**：敌人大全 + 骰子 + 牌型 + 遗物 + 状态（§10-14）| 571 |
| 05  | [designer-spec-part3](./05-designer-spec-part3.md) | Designer | **设计规范 Part3**：挑战 + 商店 + 经济 + UI + 边界 + Checklist（§15-21）| 509 |
| 06  | [verify-audit](./06-verify-audit.md) | Verify | **像素级审查**：38 项核心公式对照源码，0 ERROR / 5 WARN / 9 INFO | ~280 |

**总计**：6 份文档，约 2970 行，146 KB。

---

## 快速入口

### 我只想知道游戏怎么玩

读 **03/04/05 三份设计规范**，每章独立，按需跳读。

### 我要立即开始 Godot 实现

读 **05 Part3 第 21 章 移植对照 Checklist**，按清单实现。
遇到疑问回 03/04 对应章节查证。

### 我想审阅设计文档是否贴合源码

读 **06 Verify 审查报告**，包含 38 项公式对照与 5 条需修正项。

### 我想深挖某条规则的源码依据

读 **01/02 考古文档**，每条规则都带文件名+行号证据。

---

## 核心认知（三条用户强调的规则）

1. **每回合未出手牌默认全弃** -> logic/drawPhase.ts 职业分支
2. **只有法师在吟唱（未出牌）状态才保留手牌** -> logic/drawPhase.ts 法师分支 playsLeft === maxPlays
3. **只有战士能多选普攻一口气全出** -> classes.ts normalAttackMultiSelect=true + aoeDetection.ts skipOnPlay + UI isNonWarriorMultiNormal 禁用

---

## Verify 审查待修正（5 条 WARN）

1. **W1**：敌人 emoji 字段当前全空，Godot 直接用像素精灵
2. **W2**：drawFromBag 是纯函数，Toast/动画由调用方处理
3. **W3**：Boss 小兵从当前章节普通敌人池抽
4. **W4**：DICE_BY_RARITY.uncommon = []，商店不出 uncommon 通用骰
5. **W5**：初始骰子以 classes.ts 为准，INITIAL_DICE_BAG 是遗留常量

详见 06-verify-audit.md。

---

## 待深挖的 [GAP]（需 Coder 补挖）

- 三职业专属骰子完整 id 清单（w_* / mage_* / r_*）
- 飞刀/回旋刃/嘲讽骰 具体定义
- 遗物具体 effect 返回值数值精度
- 存档字段与序列化格式（useGamePersistence.ts）
- skillSelect 阶段触发条件与增幅模块

---

## 制作工艺

本套文档由 狗鲨 / Designer / Verify 三岗协同产出：

```
刘叔指令 -> Coder 两轮考古 -> Designer 撰写规范 -> Verify 像素级审查 -> 刘叔终审
```

遵循 C:\Users\slimboiliu\.agent\context\RULES.md 项目宪法。