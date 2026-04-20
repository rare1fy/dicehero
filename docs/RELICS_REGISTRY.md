# Dice Hero 2 - 遗物完整注册表

> **唯一权威文档** — 所有遗物配置集中在 `src/data/relics.ts`
> 
> 最后更新: 2026-04-09

## 文件位置

| 文件 | 职责 |
|---|---|
| `src/data/relics.ts` | **遗物定义（唯一配置源）** — 所有遗物的 id/name/trigger/effect/rarity |
| `src/types/game.ts` | 类型定义 — `Relic`, `RelicTrigger`, `RelicEffect`, `RelicContext` |
| `src/DiceHeroGame.tsx` | 触发逻辑 — 各 trigger 类型在战斗/移动中的调用点 |

## 触发器调用位置速查

| Trigger | DiceHeroGame.tsx 位置 | 实现方式 | 备注 |
|---|---|---|---|
| `passive` | ~行374/379/484/524 | 通用 `.filter(r => r.trigger === 'passive')` | extraReroll/extraPlay/drawCountBonus/shopDiscount 等 |
| `on_play` | ~行852-900 | 通用 `.filter(r => r.trigger === 'on_play')` | relicCtx 含14个字段 |
| `on_reroll` | ~行555/563 | 通用 `.filter(r => r.trigger === 'on_reroll')` | 卖血重投时触发 |
| `on_kill` | ~行1505-1534 | 通用 `.filter(r => r.trigger === 'on_kill')` | 击杀敌人时触发 |
| `on_battle_end` | ~行2394 | 通用 `.filter(r => r.trigger === 'on_battle_end')` | 战斗胜利结算时 |
| `on_battle_start` | ~行378后 | 通用 `.filter(r => r.trigger === 'on_battle_start')` | startBattle 内 |
| `on_damage_taken` | ~行2067后 | 通用 `.filter(r => r.trigger === 'on_damage_taken')` | 敌人攻击扣血后，设置 rageFireBonus |
| `on_move` | ~行413 startNode内 | 通用 `.filter(r => r.trigger === 'on_move')` | 选择地图节点时触发 |
| `on_fatal` | ~行2056/1707/2217 | **硬编码** `r.id === 'emergency_hourglass'` | 致命伤害时免死，15节点CD |
| `on_turn_end` | ~行2222 | **硬编码** `r.id === 'schrodinger_bag'` | 回合结束未重Roll则额外抽骰 |

## 遗物完整清单（68个）

### 体系一：基础打工类（6个）

| # | ID | 名称 | 稀有度 | Trigger | 效果 |
|---|---|---|---|---|---|
| 1 | `grindstone` | 磨刀石 | common | on_play | ≤2颗骰子牌型+12伤害 |
| 2 | `iron_banner` | 铁血战旗 | uncommon | on_play | 每次卖血Roll，下次出牌+6伤害 |
| 3 | `heavy_metal_core` | 重金属核心 | common | on_play | 每颗灌铅骰子+10伤害 |
| 4 | `chaos_pendulum` | 混沌摆锤 | common | on_play | 点数和奇数+12伤害，偶数回3HP |
| 5 | `iron_skin_relic` | 铁皮护符 | common | on_play | 每次出牌+5护甲 |
| 6 | `scattershot_relic` | 散射弹幕 | common | on_play | 普攻点数≥15时每骰+3伤害 |

### 体系二：倍率起飞类（8个）

| # | ID | 名称 | 稀有度 | Trigger | 效果 |
|---|---|---|---|---|---|
| 7 | `crimson_grail` | 猩红圣杯 | rare | on_play | 损失HP%转倍率(最高x1.8) |
| 8 | `arithmetic_gauge` | 等差数列仪 | rare | on_play | 顺子长度越长倍率越高 |
| 9 | `mirror_prism` | 镜像棱镜 | rare | on_play | 分裂骰子点数转全局倍率 |
| 10 | `elemental_resonator` | 元素共鸣器 | legendary | on_play | 打过3种元素→伤害x2.5 |
| 11 | `perfectionist` | 完美主义强迫症 | legendary | on_play | 纯白杆葫芦/四条/五条→x4 |
| 12 | `twin_stars_relic` | 双子星 | uncommon | on_play | 对子→x1.5 |
| 13 | `void_echo_relic` | 虚空回响 | uncommon | on_play | 连对→x1.8 |
| 14 | `glass_cannon_relic` | 玻璃大炮 | rare | on_play | x2.0但-4HP |

### 体系三：经济与续航类（9个）

| # | ID | 名称 | 稀有度 | Trigger | 效果 |
|---|---|---|---|---|---|
| 15 | `emergency_hourglass` | 急救沙漏 | rare | on_fatal | 免疫致命伤害(15节点CD) |
| 16 | `vampire_fangs` | 吸血鬼假牙 | rare | on_kill | 溢出伤害25%→回血 |
| 17 | `black_market_contract` | 黑市合同 | uncommon | on_reroll | 卖血Roll得等值金币 |
| 18 | `scrap_yard` | 废品回收站 | uncommon | on_battle_end | 手中诅咒/碎裂骰子每颗+8金 |
| 19 | `merchants_eye_relic` | 商人之眉 | common | on_play | 非普攻牌型+3金币 |
| 20 | `war_profiteer_relic` | 战争商人 | uncommon | on_play | 每击杀1敌人，出牌+5金币 |
| 21 | `interest_relic` | 利息存款 | uncommon | on_battle_end | 每10金产1金利息 |
| 22 | `pain_amplifier_relic` | 痛觉放大器 | rare | on_play | 本场已损失HP×15%→伤害 |
| 23 | `masochist_relic` | 受虐狂 | rare | on_play | 本回合损失HP→50%护甲+20%回复 |

### 体系四：机制突变类（5个）

| # | ID | 名称 | 稀有度 | Trigger | 效果 |
|---|---|---|---|---|---|
| 24 | `overflow_conduit` | 溢出导管 | legendary | on_kill | 溢出伤害转移给随机敌人 |
| 25 | `quantum_observer` | 量子观测仪 | legendary | passive | 透视骰子库+锁定骰子 |
| 26 | `limit_breaker` | 底线突破 | legendary | passive | 小丑骰最大点数解锁 |
| 27 | `schrodinger_bag` | 薛定谔的袋子 | rare | on_turn_end | 未重Roll→下回合+1临时骰 |
| 28 | `combo_master_relic` | 连招大师 | uncommon | on_play | 连续普攻叠伤害+倍率 |

### 体系五：环层塔地图类（3个）

| # | ID | 名称 | 稀有度 | Trigger | 效果 |
|---|---|---|---|---|---|
| 29 | `navigator_compass` | 导航罗盘 | common | on_move | 每步移动+1金币 |
| 30 | `point_accumulator` | 点数统计器 | uncommon | on_battle_start | 战斗开始+3护甲 |
| 31 | `floor_conqueror` | 层厅征服者 | rare | on_play | 每完成一层永久+2伤害 |

### 体系六：增幅转化遗物（20个）

| # | ID | 名称 | 稀有度 | Trigger | 效果 |
|---|---|---|---|---|---|
| 32 | `healing_breeze` | 治愈之风 | common | on_play | 每次出牌+3HP |
| 33 | `sharp_edge_relic` | 磨砺石 | common | on_play | 每次出牌+8伤害 |
| 34 | `lucky_coin_relic` | 幸运铜板 | common | on_play | 每次出牌+2金币 |
| 35 | `thick_hide_relic` | 厚皮兽甲 | common | on_play | 对子→+10护甲 |
| 36 | `warm_ember_relic` | 余烬暖石 | uncommon | on_play | 对子→+4HP+5护甲 |
| 37 | `treasure_sense_relic` | 寻宝直觉 | uncommon | on_play | 顺子→+15金币 |
| 38 | `golden_touch_relic` | 点金之手 | uncommon | on_play | 三条/四条/五条→点数和×2金币 |
| 39 | `haggler_relic` | 讨价还价 | uncommon | passive | 商店价格-20% |
| 40 | `element_overload_relic` | 元素过载 | rare | on_play | 同元素牌型→x2.2 |
| 41 | `full_house_blast_relic` | 葫芦爆裂 | rare | on_play | 葫芦→点数和×2.5伤+10护甲 |
| 42 | `chain_lightning_relic` | 连锁闪电 | rare | on_play | 顺子→点数和×1.5伤+2灼烧 |
| 43 | `frost_barrier_relic` | 霜冻屏障 | rare | on_play | 葫芦→+15护甲+2虚弱 |
| 44 | `soul_harvest_relic` | 灵魂收割 | rare | on_play | 多条→点数和×2伤+×0.5回血 |
| 45 | `pressure_point_relic` | 压力点 | rare | on_play | 顺子→10穿透+1易伤 |
| 46 | `basic_instinct_relic` | 基本直觉 | common | on_play | 普攻→点数和×1.5伤害 |
| 47 | `rapid_strikes_relic` | 连击本能 | uncommon | on_play | 普攻→x1.4 |
| 48 | `blood_pact_relic` | 血之契约 | uncommon | on_play | 普攻→点数和×2伤但-3HP |
| 49 | `minimalist_relic` | 极简主义 | rare | on_play | 单骰出牌→+15伤+x2.0 |
| 50 | `blood_dice_relic` | 血骰契约 | uncommon | on_play | 每次重Roll→倍率+0.3 |
| 51 | `adrenaline_rush_relic` | 肾上腺素 | rare | on_play | HP越低倍率越高 |

### 体系七：重投/骰子数量强化类（5个）

| # | ID | 名称 | 稀有度 | Trigger | 效果 |
|---|---|---|---|---|---|
| 52 | `reroll_frenzy_relic` | 狂掷风暴 | uncommon | on_play | 每次重Roll+12伤害 |
| 53 | `dice_master_relic` | 骰子大师 | legendary | on_play | ≥3颗骰子→+15伤+x1.3 |
| 54 | `fortune_wheel_relic` | 命运之轮 | legendary | on_play | 每次重Roll+8伤害 |
| 55 | `battle_medic_relic` | 战场急救 | uncommon | on_kill | 击杀→+8HP |
| 56 | `rage_fire_relic` | 怒火燎原 | uncommon | on_damage_taken | 受伤→下次出牌+15伤 |

### 体系八：规则改变类（7个）

| # | ID | 名称 | 稀有度 | Trigger | 效果 |
|---|---|---|---|---|---|
| 57 | `treasure_map_relic` | 藏宝图 | common | on_move | 宝箱节点+15金币 |
| 58 | `dimension_crush` | 降维打击 | legendary | passive | 顺子数量+1 |
| 59 | `universal_pair` | 万象归一 | legendary | passive | 对子视为三条 |
| 60 | `chaos_face` | 混沌骰面 | rare | passive | 首次重投所有骰子+1点 |
| 61 | `greedy_hand` | 贪婪之手 | rare | on_play | ≥4颗骰子→+20伤害 |
| 62 | `double_strike` | 双重打击 | legendary | passive | +1出牌次数 |
| 63 | `fate_coin` | 命运硬币 | rare | on_play | 重投≥2次→x1.5 |
| 64 | `element_affinity` | 元素亲和 | rare | passive | 普通骰30%获得元素 |
| 65 | `symmetry_seeker` | 对称追求者 | rare | on_play | 所有骰子相同点数→x1.5 |

## 按稀有度汇总

| 稀有度 | 数量 | 掉落来源 |
|---|---|---|
| common | 13 | 精英/宝箱/商人/事件 |
| uncommon | 19 | 精英/宝箱/商人/事件 |
| rare | 23 | 精英/宝箱/商人/事件/Boss |
| legendary | 10 | Boss 独占 |
| **总计** | **65** | |

## 按 Trigger 汇总

| Trigger | 数量 | 说明 |
|---|---|---|
| on_play | 45 | 出牌时触发（核心） |
| passive | 8 | 被动持续生效 |
| on_kill | 3 | 击杀敌人时 |
| on_battle_end | 2 | 战斗胜利结算时 |
| on_move | 2 | 地图移动时 |
| on_reroll | 1 | 卖血重投时 |
| on_battle_start | 1 | 战斗开始时 |
| on_damage_taken | 1 | 受到伤害时 |
| on_fatal | 1 | 致命伤害时 |
| on_turn_end | 1 | 回合结束时 |
| **总计** | **65** | |

## 注意事项

1. `ALL_RELICS` 字典和 `RELICS_BY_RARITY` 数组**必须同步维护**，新增遗物两处都要注册
2. `on_fatal` 和 `on_turn_end` 目前为**硬编码实现**（按 id 匹配），不走通用 trigger 过滤
3. `rageFireBonus` 字段存储在 `GameState` 中，由 `on_damage_taken` 累加、`on_play` 结算时消费清零
4. 急救沙漏的 CD 计数在 `startNode` 中每次移动 -1
5. `symmetry_seeker` 的 effect 函数目前返回空对象 `{}`，需要后续补全实现
