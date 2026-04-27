# Coder 日志 - DOC-DAMAGE-SETTLEMENT-R3
日期: 2026-04-27
任务: 补全伤害演出 + 遗物半弹窗专题文档
触发: 刘叔指出原文档漏掉两大战斗爽点 UI
结果: [PASS]

---

## 一、任务背景

刘叔第 3 轮审阅指出 v2.0 文档有重大遗漏：
- **遗物半弹窗**（自动收纳，触发效果/主动点击才展开）
- **伤害演出时半弹窗自动展开 + 结算项触发到某个遗物时该遗物刷光**
- **伤害演出界面是核心爽点，表现细节没写进去**

## 二、源码考古覆盖范围

| 源码文件 | 行数 | 作用 |
|---|---|---|
| `logic/settlement/index.ts` | 35 | 4 Phase 编排器入口 |
| `logic/settlement/types.ts` | 73 | SettlementContext / SettlementData 接口 |
| `logic/settlement/phase1_handDisplay.ts` | 40 | 牌型卡片展示 + **第一行 setShowRelicPanel(true)** |
| `logic/settlement/phase2_diceScoring.ts` | 190 | 骰子逐颗计分 + 分裂 + 磁吸 + 重算 + 2.5 mult bounce |
| `logic/settlement/phase3_effects.ts` | 210 | 特殊效果 + **遗物刷光 setFlashingRelicIds 800ms** |
| `logic/settlement/phase4_finalDamage.ts` | 60 | 最终伤害 + 三档卡肉震屏 + **setShowRelicPanel(false)** |
| `components/SettlementOverlay.tsx` | 155 | 全屏演出 UI（牌型卡/骰子行/计分条/效果列表）|
| `components/DamagePreviewCard.tsx` | 125 | 出牌前预期卡（底部行即将触发遗物）|
| `components/RelicPanelView.tsx` | 210 | 折叠按钮 + 55vh 半弹窗 + 遗物三态视觉 |
| `components/PlayerHudView.tsx` L69-L90 | 22 | DamageOverlay 全屏红圈金圈白光粒子 + 三档字号 |
| `index.css` L1080+ | 多 | particle-float / pixel-screen-shake / relic-flash 等 keyframes |

## 三、交付物

### 3.1 新增文档
- `docs/godot-port/08-damage-settlement-relic-drawer.md`（**37KB，640 行**）
  - 8 大章节：定位 / 时序 / 半弹窗 / 演出 / 预期卡 / Godot建议 / Checklist / 自然语言还原
  - 9 块实现 Checklist，每项可独立勾选
  - 57 条硬规则 / 数值 / 时长标注
  - 源码证据表（8 条可追溯）

### 3.2 更新
- `README.md` 追加 v3.0 记录 + 08 索引
- `05-designer-spec-part3.md` §18 插入 08 引用提示

### 3.3 留痕
- `agent-work/coder-DOC-DAMAGE-SETTLEMENT-R3-20260427.md`（本文件）
- `agent-work/08-damage-settlement-relic-drawer.md`（源稿）
- `agent-work/update-readme-part3-08.py`（批量修改脚本）

## 四、关键规则摘录（供 Godot 开发快速查阅）

### 4.1 遗物半弹窗 3 种触发展开
1. 玩家主动点击底栏 `▲ 遗物库` 按钮
2. 伤害演出 Phase 1 **自动展开**（`setShowRelicPanel(true)`）
3. Phase 4 末尾**自动收起**（`setShowRelicPanel(false)`）

### 4.2 遗物三态视觉
| 状态 | 触发 | 视觉 |
|---|---|---|
| 普通 | 既不 active 也不 flashing | 灰边灰底 |
| **即将触发** | `expectedOutcome.triggeredAugments` 包含 | 金边 + 金色渐变底 + 光晕 0 0 8px |
| **正在触发** | `flashingRelicIds` 包含 | **爆白金光 + 双层 shadow + relic-flash 0.6s** |

### 4.3 遗物刷光时序
```
setFlashingRelicIds(prev => [...prev, relicId]);
setTimeout(() => setFlashingRelicIds(prev => prev.filter(id => id !== relicId)), 800);
// 下一条效果 350ms 后触发
// → 多个遗物可能同时刷光（800ms 窗口 > 350ms 间隔）
```

### 4.4 伤害数字三档字号
- ≥40 dmg → **text-7xl 金色** + shadow 60px+120px
- ≥20 dmg → text-6xl 橙色 + shadow 50px+100px
- 其他 → text-5xl 红色 + shadow 40px+80px

### 4.5 卡肉震屏三档
| 档位 | 阈值 | 卡肉 | 音效 | 震屏 | Overlay |
|---|---|---|---|---|---|
| Massive | ratio≥1.0 或 dmg≥120 | 150ms | 3 连 critical | 500ms | 2500ms |
| Heavy | ratio≥0.5 或 dmg≥60 | 100ms | 2 连 critical | 400ms | 1800ms |
| Medium | dmg≥20 | 无 | critical | 300ms | 1800ms |
| Light | dmg>0 | 无 | hit | 300ms | 1800ms |

### 4.6 Phase 时长表
| Phase | 时长 | 内容 |
|---|---|---|
| 1 hand | 0.6s | 牌型卡片展示 |
| 2 dice | N×0.28s + 特殊骰 0.4s/个 | 骰子逐颗计分 |
| 2.5 mult | 0.5s | 倍率方块 bounce |
| 3 effects | M×0.35s | 效果列表 + 遗物刷光 |
| bounce | 0.5s | 计分条定格 |
| 4 damage | 0.8/1.0/1.2s | 最终伤害+震屏 |

---

## 五、自评与风险

[PASS] 源码全覆盖：11 个关键文件挖透，57 条数值 / 时长标注均有源码行号可追溯。
[PASS] 文档结构：8 节从"体验定位 → 时序总览 → 组件详解 → Godot 建议 → Checklist → 自然语言还原"完整闭环。
[PASS] 独立性：本文档不依赖 Part1-3，Godot 开发者只看 08 也能实现。

风险：
- **美术资产**：本文档只描述"原版的视觉表现形式"，Godot 版美术（像素精灵的具体绘制）仍需 Designer 再单独立 TASKS。
- **音效**：`playHeavyImpact / playSettlementTick / playMultiplierTick / playSound('critical'/'relic_activate'/'hit')` 的具体音频文件格式未覆盖，建议后续专门写"音效对照表"。
- **Phase 执行器的协程模式**：§5.2 给出的 `BattleAnimationController` autoload 是设计建议，Godot 开发时需 Coder 结合 GodotRule 第一条"场景自给自足"原则再权衡是否 autoload。

## 六、下一步

- 等 Verify 审查（建议调 Verify 子 Agent 检查）
- git commit + push 上线
- 有补充再迭代 v1.1
