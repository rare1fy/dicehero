# ARCH-D mapGenerator.ts 拆分 — 最终验证报告

**日期**: 2025-01-XX
**验证者**: Verify Agent
**目标**: mapGenerator.ts (559行) -> mapGenerator.ts (374行) + mapConstraints.ts (243行)

---

## 一、编译检查 PASS

npx tsc --noEmit -> exitCode=0，零错误通过。

---

## 二、行数约束 PASS

| 文件 | 行数 | 上限 | 结果 |
|------|------|------|------|
| mapGenerator.ts | 374 | 500 | PASS |
| mapConstraints.ts | 243 | 800 | PASS |

---

## 三、四项修复逐项确认

### #1 shuffle 重复定义 -> PASS 已修复

- mapConstraints.ts:235 - shuffle 函数定义并 export
- mapGenerator.ts:8 - 从 ./mapConstraints import shuffle，无本地定义
- mapGenerator.ts:252 - 唯一调用点 shuffle(layerNodes) 使用 import 版本
- **结论**: 无重复定义，单一来源

### #2 isCombatType 未使用 -> PASS 已修复

- mapGenerator.ts 的 import 列表 (行3-11) 中不含 isCombatType
- 全文搜索 mapGenerator.ts 无 isCombatType 出现
- mapConstraints.ts 内部正常使用（行36定义，行144/179/220调用）
- **结论**: 无未使用的 import

### #3 类型断言不安全 -> PASS 已修复

- mapGenerator.ts:368: (node as MapNodeExt & { x: number }).x
- 此处 MapNodeExt 已通过 import 从 mapConstraints 引入
- MapNodeExt extends MapNode 且包含 x: number 字段
- 合并类型 MapNodeExt & { x: number } 语义上等价于 MapNodeExt
- **结论**: 类型断言安全，无运行时风险

### #4 递归无保护 -> PARTIAL 部分修复，存在逻辑缺陷

**MAX_RECURSION_DEPTH 保护**: PASS 已添加
- findMinCombatOnPaths 行130/138: depth > 50 返回 0
- findWeakestPath 行199/200: depth > 50 返回 null

**visited Set 传递**: WARNING 存在跨路径状态污染问题
- findMinCombatOnPaths 行135: visited: Set<string> = new Set()
- findWeakestPath 行196: visited: Set<string> = new Set()
- 两个函数的 visited Set 在递归兄弟分支之间共享（直接传递引用，不做拷贝）
- **后果**: 当路径A分支访问节点X后，路径B分支不会再访问x。但在图结构中X可能属于多条独立路径，导致某些合法路径被错误跳过
- findMinCombatOnPaths 返回值可能偏高（漏算合法路径）
- findWeakestPath 可能漏掉真正最弱路径
- **严重度**: 警告 - 当前15层地图规模下触发概率低，但逻辑不正确

**递归深度上限硬编码重复**: WARNING
- MAX_RECURSION_DEPTH = 50 在两个函数内各定义一次，违反 DRY 原则

---

## 四、消费方兼容性 PASS

| 消费方 | import 语句 | 路径变化 | 结果 |
|--------|------------|----------|------|
| DiceHeroGame.tsx:40 | from ./utils/mapGenerator | 无变化 | PASS |
| gameInit.ts:10 | from ../utils/mapGenerator | 无变化 | PASS |
| ChapterTransition.tsx:9 | from ../utils/mapGenerator | 无变化 | PASS |

所有消费方仅引用 generateMap，该函数仍在 mapGenerator.ts 中 export，路径未变。
MapNodeExt 通过 re-export（行25）保持兼容，但当前无外部消费方使用。

---

## 五、额外代码质量审查

| # | 严重度 | 罪名 | 确切位置 | 死亡逻辑推演 |
|---|--------|------|----------|-------------|
| 1 | WARNING | 硬编码概率值 | mapGenerator.ts:179,327,339 | 0.4/0.6直接写死，非配置化 |
| 2 | WARNING | visited Set 跨分支污染 | mapConstraints.ts:135,155 | findMinCombatOnPaths 兄弟分支间共享visited |
| 3 | WARNING | visited Set 跨分支污染 | mapConstraints.ts:196,218 | findWeakestPath 同样问题 |
| 4 | WARNING | 重复常量定义 | mapConstraints.ts:130,199 | MAX_RECURSION_DEPTH=50重复定义，应提取为模块级常量 |
| 5 | INFO | 类型断言冗余 | mapGenerator.ts:368 | MapNodeExt & { x: number }等价于MapNodeExt |
| 6 | INFO | isCombatType仅内部使用 | mapConstraints.ts:36 | 可取消export缩小API面 |

---

## 审查结论: FAIL 打回重造

### 阻断项汇总

虽然4项原始修复均已完成，但修复#4（递归无保护）的visited传递方式引入了新的逻辑缺陷：

- visited Set 在递归兄弟分支之间共享引用，导致跨路径状态污染
- 修复前（每次 new Set 拷贝）性能浪费但正确；修复后（直接传递）性能好但逻辑错误

### 打回要求

1. findMinCombatOnPaths / findWeakestPath 的visited传递需要在兄弟分支间隔离（每次递归调用传拷贝），但同一路径内共享以防循环
2. MAX_RECURSION_DEPTH 提取为模块级常量，消除重复定义
3. 硬编码概率值（0.4, 0.6）建议提取到配置常量（建议，非阻断）
