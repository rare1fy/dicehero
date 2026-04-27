# Coder 日志 - TURN-ARCHAEOLOGY

日期: 2026-04-27
任务: 考古挖掘 dicehero2 React 版完整回合规则（作为 Godot 移植对照基线）
触发: 刘叔指令 "深刻理解 f盘dicehero2 代码"
结果: [PASS]

---

## 一、扫过的文件（证据链）

| 文件 | 作用 |
|---|---|
| `src/data/classes.ts` | 三职业元数据（drawCount/maxPlays/freeRerolls/canBloodReroll/keepUnplayed/normalAttackMultiSelect） |
| `src/logic/gameInit.ts` | `createInitialGameState` 初始化职业差异 |
| `src/logic/battleInit.ts` | `buildBattleGameState` 战斗开始状态重置 |
| `src/logic/drawPhase.ts` | **回合开始**抽牌/弃牌（职业分支） |
| `src/logic/turnEndProcessing.ts` | **回合结束前段**（吟唱/冥想/on_turn_end 遗物/嘲讽反噬） |
| `src/hooks/useBattleLifecycle.ts` | startBattle / rollAllDice / 波次转换 |
| `src/hooks/useBattleCombat.tsx` | toggleSelect / playHand / endTurn / 自动结束回合 |
| `src/hooks/useReroll.tsx` | 重投（免费/卖血）完整逻辑 |
| `src/hooks/useBattleState.ts` | 全部战斗状态字段 |
| `src/logic/expectedOutcomeCalc.ts` | 伤害公式大全（血怒/狂暴/过充/连击等加成点位） |
| `src/logic/postPlayEffects.ts` | 出牌后副作用（标 spent/弃骰/暗影残骰/补牌） |
| `src/logic/playHandStats.ts` | 连击终结判定 |
| `src/logic/rogueComboEffects.ts` | 盗贼连击预备/追击浮字 |
| `src/logic/aoeDetection.ts` | **战士多选普攻**特殊效果禁用判定 |
| `src/utils/handEvaluator.ts` | 牌型判定（普攻逻辑） |
| `src/logic/rerollCalc.ts` | 重投 HP 代价公式 |
| `src/logic/enemyAI.ts` | 敌人回合（DoT → 每敌行动 → 精英骰/盾 → 玩家灼烧） |
| `src/logic/diceEffects.ts` | 元素坍缩（法师锁元素关键） |
| `src/components/PlayerHudView.tsx` | UI 层：出牌按钮 3 态 / 结束回合按钮职业皮肤 / 非战士禁用提示 |
| `src/config/balance/player.ts` | PLAYER_INITIAL / FURY_CONFIG / DEPTH_SCALING / ANIMATION_TIMING |

---

## 二、回合骨架（所有职业通用）

```
[战斗开始]
  startBattle(node)
    ├─ buildBattleGameState: phase='battle', battleTurn=1, armor=0, statuses=[],
    │   chargeStacks=0, mageOverchargeMult=0, bloodRerollCount=0,
    │   comboCount=0, lastPlayHandType=undefined, fortuneWheelUsed=false,
    │   diceBag=initDiceBag(ownedDice), discardPile=[],
    │   playsLeft=maxPlays+extraPlay遗物, freeRerollsLeft=freeRerollsPerTurn+extraReroll遗物
    ├─ 首次抽牌: count = min(6, drawCount + warriorBloodBonus)
    │   战士HP≤50% → warriorBloodBonus=1 → 飘字"血怒补牌 +1"
    ├─ drawFromBag + 掷骰动画（8帧随机点数, 第3帧播重投音效）
    └─ applyDiceSpecialEffects: 元素骰坍缩 + 小丑骰 1-9 随机（限界骰 1-100）

[玩家回合循环]
  ┌─→ 玩家操作
  │   ├─ toggleSelect(die) → 选/取消选
  │   │   └─ 战士多选且全是普攻时弹 Toast "多选普通攻击：特殊骰子效果将被禁用！"
  │   ├─ rerollSelected → 重投选中骰（详见 §4）
  │   ├─ playHand → 出牌（详见 §5）
  │   └─ endTurn → 手动结束回合
  ├─── 自动结束触发
  │   条件: playsLeft<=0 OR 无未消耗骰子 → 1000ms 延迟后自动 endTurn
  └─── endTurn
      ├─ 防重入: isEnemyTurn=true 或 phase=gameover 时直接 return
      ├─ processTurnEnd(ctx)   ← 回合结束前段，详见 §6
      ├─ executeEnemyTurn(...) ← 敌人回合，详见 §7
      ├─ 检查玩家HP: ≤0 → gameover
      └─ setGame: isEnemyTurn=false, armor=0, playsLeft=maxPlays,
                  freeRerollsLeft=freeRerollsPerTurn, hpLostThisTurn=0,
                  consecutiveNormalAttacks=0
          (注意: comboCount/bloodRerollCount 不在此处重置——
           bloodRerollCount 在敌人回合开始时被重置; comboCount 同理)
      └─ executeDrawPhase    ← 回合开始抽牌，详见 §3
          phase 末尾自动 setRerollCount(0)、warriorRageMult/rogueComboDrawBonus 更新
```

---

## 三、抽牌阶段 `executeDrawPhase`（回合开始）

### 3.1 弃牌决策（职业分支）

| 职业 | 出过牌本回合 | 未出牌本回合（吟唱） |
|---|---|---|
| **战士** | 全弃（除非**命运之轮**遗物首次生效） | 全弃 |
| **法师** | 全弃 | **保留手牌**；仅当手牌数 > `min(6, drawCount + chargeStacks)` 才弃超出部分 |
| **盗贼** | 全弃（特殊：**暗影残骰 `shadowRemnantPersistent=true` 保留→变 isTemp**；普通 `isTemp` 直接销毁不进弃牌库） | 同上（每回合都按这条） |

**关键字段**：
- `playsLeft < maxPlays` → 本回合出过牌（通用判定）
- `dice.filter(d => !d.spent)` → 未消耗手牌
- `shadowRemnantPersistent` → 盗贼专用，保留后自动转 `isTemp=true`

### 3.2 命运之轮（跨职业遗物，仅触发一次/战）
```
战士/其他 && hasRelic('fortune_wheel_relic') && !fortuneWheelUsed && 出过牌
  → remainingDice = 保留所有未消耗骰
  → fortuneWheelUsed = true
  → 飘字"命运之轮: 保留手牌!"
```

### 3.3 保留最高点遗物 `relicKeepHighest`
弃牌后把本该弃掉的最高点 N 颗骰抢回来保留；用完后 `relicKeepHighest = 0`。

### 3.4 骰子被保留时的 onPlay 特殊效果（执行点在保留瞬间）
| 骰子效果 | 行为 |
|---|---|
| `bonusOnKeep` (水晶骰) | 点数 +N |
| `boostLowestOnKeep` (时光沙) | 手牌最低点骰 +2 |
| `bonusPerTurnKept` (星辰骰) | 每保留回合 +N，上限 `keepBonusCap=3` |
| `rerollOnKeep` (时光骰) | 自动重投 |
| `bonusMultOnKeep` (法力涌动) | `mageOverchargeMult += 0.2` |

### 3.5 抽牌数计算
```ts
chargeBonus   = (playerClass==='mage') ? chargeStacks : 0
warriorBonus  = (playerClass==='warrior' && hp <= maxHp*0.5) ? 1 : 0
rawTargetHandSize = drawCount + chargeBonus + warriorBonus
targetHandSize    = min(6, rawTargetHandSize)

# 战士狂暴本能（溢出补偿）
if playerClass==='warrior' && rawTargetHandSize > 6:
    hpLostPct = max(0, 1 - hp/maxHp)
    warriorRageMult = round(hpLostPct*100)/100   # 0.00~1.00 的 0.01 粒度
    → 飘字"狂暴+XX%"
else if playerClass==='warrior':
    warriorRageMult = 0

# 临时加成消耗
schrodingerBonus   = game.tempDrawCountBonus  → 然后清零
rogueComboDrawBonus= game.rogueComboDrawBonus → 然后清零
relicTempDrawBonus = game.relicTempDrawBonus  → 然后清零

needDraw = max(0, targetHandSize + schrodingerBonus + rogueComboDrawBonus + relicTempDrawBonus - 保留数)
```

### 3.6 `drawFromBag` 行为
- 从 `diceBag` 抽；若不够，自动把 `discardPile` 洗回 `diceBag` 再抽
- 洗牌触发 `shuffleAnimating=true` 800ms + Toast "✨ 弃牌库已洗回骰子库"

### 3.7 新骰掷骰动画
- 8 帧随机点数（30/40/50/60/80/100/120/150ms 递增间隔 → 缓出感）
- 第 3 帧播 `reroll` 音效
- 动画结束后 `applyDiceSpecialEffects`：
  - **元素骰坍缩**：所有 `isElemental` 骰子共享同一随机元素（fire/ice/thunder/poison/holy）
  - 如 `game.lockedElement` 存在（法师棱镜锁元素）→ 用该锁定元素
  - **小丑骰**：普通上限 9，限界者遗物 100
  - **双元素骰**（棱镜）：额外随机第二元素
  - **共鸣骰**：复制手牌中数量最多的元素
- 最后播 `dice_lock` 音效，`setRerollCount(0)`

---

## 四、重投 `rerollSelected`

### 4.1 代价公式 `getRerollHpCost`
```ts
freeCount = freeRerollsPerTurn + sumPassiveRelicValue('extraReroll')
if count < freeCount: return 0   # 免费
# 非战士且无"嗜血仪式"遗物 → -1（禁用）
if playerClass !== 'warrior' && !hasBloodRerollRelic: return -1
paidIndex = count - freeCount
baseCost = ceil(maxHp * 2^(paidIndex+1) / 100)   # 2%/4%/8%/16%... 递增
return playerClass !== 'warrior' ? baseCost * 2 : baseCost   # 非战士代价翻倍
```
- 手牌中有**诅咒骰**参与重投 → HP 代价再翻倍
- 代价 > 当前HP → 拒绝并红屏闪烁

### 4.2 on_reroll 遗物
- `isBloodReroll = hpCost > 0` 传给遗物 ctx
- 黑市契约：本回合首次卖血触发后 `blackMarketUsedThisTurn=true`，禁止二次触发

### 4.3 战士血怒叠层（卖血才触发）
```ts
bloodRerollCount = min(bloodRerollCount+1, FURY_CONFIG.maxStack=5)
hp -= hpCost
飘字: "血怒+15%"（每层）或 "血怒已满↑+5护甲"
addLog: "嗜血消耗 N HP（血怒 X/5层, +75%伤害）"
```
- 每层 +15% 最终伤害（在 expectedOutcomeCalc 生效）
- 叠满 5 层后再卖血 → 仅给 +5 护甲，层数不再涨

### 4.4 重投动画
- 同抽牌的 8 帧随机
- 元素骰每帧随机元素
- 落定时：
  - 临时骰（isTemp 非 `temp_rogue`）→ 就地重投不换骰
  - 普通骰 → 放弃牌库 → 从 `diceBag` 补抽等量新骰替换（保留原 id 位置）
- `rerollOnKeep` 类加成在落定后再叠

### 4.5 鉴定"狂获风暴"遗物
`freeChance = sumRelicValueByTrigger('on_reroll', 'freeRerollChance')`
若 `isFreeReroll && Math.random() < freeChance`：免费次数不消耗，飘字"幸运！免费次数保留"

### 4.6 `rerollsThisWave++`（用于挑战统计）

---

## 五、出牌 `playHand`

### 5.1 前置守卫
- 无选骰 / 无敌人 / 敌人回合 / 出牌中 / `playsLeft<=0` → 直接拒绝
- 非战士多选普攻 → UI 层已禁用按钮，点击会 Toast "不成牌型时只能出1颗骰子"

### 5.2 连击计数 + 记录
```ts
playsLeft -= 1
comboCount += 1
lastPlayHandType = thisHandType
playsPerEnemy[targetUid] += 1  # 追踪同一敌人被打次数
```

### 5.3 盗贼连击钩子
- **连击预备**（currentCombo===0 时，即第 1 次出牌瞬间）：200ms 后 `rerollCount -= 1` → 飘字"连击预备: +1免费重投"
- **连击追击**（currentCombo===1 且本次非普攻，即第 2 次出牌）：200ms 后飘字"连击! +20%伤害"（实际加成在 `calcComboFinisherBonus` + `expectedOutcomeCalc`）

### 5.4 `calcComboFinisherBonus` 终结加成
```ts
if playerClass==='rogue' && currentCombo>=1
   && lastHandType === thisHandType    # 两次同牌型
   && thisHandType !== '普通攻击':
    return 0.25   # +25% 终结加成
return 0
```

### 5.5 `calculateExpectedOutcome` 伤害公式（完整链路）

```
X = Σ(选中骰子点数)

# 牌型倍率（查 HAND_TYPES + handLevels）
handMultiplier = 1 + Σ((handDef.mult-1) + (handLevels[hand]-1)*0.3)
baseDamage = floor(X * handMultiplier)

# 同元素系手牌：护甲 += 基础伤害
if activeHands 含 ['同元素','元素顺','元素葫芦','皇家元素顺']:
    baseArmor += baseDamage

# 出牌时 onPlay 遗物（遍历 trigger='on_play' 遗物）
for relic in on_play_relics:
    extraDamage += res.damage
    extraArmor  += res.armor
    multiplier  *= res.multiplier
    pierceDamage+= res.pierce  # 穿甲
    ...

# 怒火燎原: rageFireBonus → extraDamage += rageFireBonus（一次性）

# 【关键】多选普攻 skip 机制
skipOnPlay = (selected.length > 1 && activeHands = ['普通攻击'])
→ skipOnPlay=true 时，所有骰子的 onPlay 效果全部被跳过
→ 这就是"战士一口气全出普攻"的实现：伤害仅为 baseDamage，不触发元素/特殊

# 骰子 onPlay（遍历 selected 每颗）
for d in selected:
    processDiceOnPlayEffects(d, { skipOnPlay, ... })
    → extraDamage/extraArmor/extraHeal/pierce/armorBreak/multiplier/holyPurify/statuses

# 法师过充倍率
if playerClass==='mage' && mageOverchargeMult > 0:
    multiplier *= (1 + mageOverchargeMult)

# 最终伤害
totalDamage = floor(baseDamage * multiplier) + extraDamage + pierceDamage
modifiedDamage = totalDamage
if playerWeak: modifiedDamage *= 0.75
if enemyVulnerable: modifiedDamage *= 1.5

# 战士血怒
effectiveFuryStacks = warrior ? min(bloodRerollCount, 5) : 0
if effectiveFuryStacks > 0:
    modifiedDamage *= (1 + effectiveFuryStacks * 0.15)

# 战士狂暴
if playerClass==='warrior' && warriorRageMult > 0:
    modifiedDamage *= (1 + warriorRageMult)

# 盗贼连击加成
if playerClass==='rogue' && comboCount>=1 && bestHand!=='普通攻击':
    modifiedDamage *= 1.2
```

### 5.6 结算演出 `runSettlementAnimation`
- 先冻结骰子 playing 状态
- 弹出伤害/护甲/治疗面板（`SettlementOverlay`）
- 触发遗物闪烁高亮（`flashingRelicIds`）
- 屏幕抖动 `setScreenShake(true)`
- 音效：`playSettlementTick` / `playMultiplierTick` / `playHeavyImpact`

### 5.7 伤害应用 `applyDamageToEnemies`
- AOE：所有存活敌人承担（护甲吸收先）
- 单体：目标吃 damage
- `armorBreak`：先清零目标护甲再计算
- 敌人死亡 → `setEnemyEffectForUid(uid,'death')`，加 `dyingEnemies`
- 低血量（≤25%）首次触发 → 敌人嘴 quotes.hurt

### 5.8 出牌后副作用 `executePostPlayEffects`
- **on_kill 遗物**: heal / grantExtraPlay / grantFreeReroll
- **溢出导管遗物**：溢出伤害转给随机另一敌人
- **魂晶获取**：溢出伤害 × `soulCrystalMultiplier` × 深度系数 × 0.15 = 魂晶
- **挑战进度**：`checkChallenge` 检查即死挑战进度
- **标记消耗**：选中骰 `spent=true, selected=false, playing=false`
  - 特殊：`bounceAndGrow`（飞刀）→ 不 spent，点数+1 回手牌（最多3次）
  - 特殊：`boomerangPlay`（回旋刃）→ 首次 `boomerangUsed=true` 且 playsLeft 不减
- **骰子加成**：
  - `drawFromBag` → 从骰子库补抽到手牌
  - `grantShadowDie` → 盗贼加 1 颗暗影残骰（2-5 点）
  - `comboPersistShadow` → 残骰持久化
  - `comboGrantPlay` → 连击时 +1 出牌机会
  - `grantExtraPlay` → +1 出牌机会
  - `grantPlayOnThird` → 第3次出牌 +1 机会
  - `grantTempDieFixed` → 固定面值临时骰
  - `shadowClonePlay` → 自动追加 50% 伤害复制攻击
  - `doublePoisonOnCombo` → 连击时目标毒层翻倍
  - `maxHpBonus/maxHpBonusEvery/healOrMaxHp` → 生命熔炉类永久加血
  - `transferDebuff` → 清除自身 1 负面
- **消耗骰入弃牌库**：`discardPile += spent骰定义ID`（临时骰不入库）
- **元素追踪**：`elementsUsedThisBattle`
- **连击链**：`consecutiveNormalAttacks` 普攻则+1，否则清零
- **圣光净化**：清除玩家负面；若无负面，移除一颗诅咒/破损骰

---

## 六、回合结束 `processTurnEnd`（敌人回合之前）

守卫：`aliveEnemies.length===0 || isEnemyTurn || 出牌动画未完` → 直接 return

### 6.1 法师吟唱/过充（`playerClass==='mage' && !playedThisTurn`）
```ts
currentCharge = chargeStacks
maxChargeForHand = 6 - drawCount   # drawCount=3 → 最多吟唱到3层

if currentCharge >= maxChargeForHand:
    # 过充
    chargeStacks += 1
    mageOverchargeMult += 0.10   # 每回合+10%
    armor += 6 + currentCharge*2
    飘字: "过充! 伤害+X%"、"+N护甲"
else:
    # 正常吟唱
    chargeStacks += 1
    armor += 6 + currentCharge*2
    飘字: "吟唱 X/6"、"+N护甲"
```

### 6.2 法师出牌 → 重置吟唱
`mage && playedThisTurn` → `chargeStacks=0, mageOverchargeMult=0`

### 6.3 冥想骰 `healOnSkip`（未出牌时触发，任何职业都可装备）
- 手牌里每颗冥想骰 +4 HP
- `purifyOneOnSkip` → 清除 1 个负面（poison/burn/vulnerable/weak 之一）

### 6.4 on_turn_end 遗物
- 蓄力晶核：未出牌 → +armor + heal
- 薛定谔袋子：`drawCountBonus` → 存到 `tempDrawCountBonus` 供下回合抽牌用

### 6.5 嘲讽反噬（出牌时用了 `tauntAll` 骰子）
- 全体存活敌人立即对玩家攻击一次（总伤害 = Σenemy.attackDmg）
- 400ms 后应用：`hp -= max(0, total - armor)`，`armor -= total`
- Toast + 音效 `enemy_skill`
- 所有敌人 `distance=0`（嘲讽拉近）

---

## 七、敌人回合 `executeEnemyTurn`

```
[0] setGame: isEnemyTurn=true, bloodRerollCount=0, comboCount=0,
             lastPlayHandType=undefined, blackMarketUsedThisTurn=false
    （综合来看血怒和连击是在"敌人回合开始"瞬间重置的，不是玩家回合开始）

[1] 玩家中毒结算:
    若玩家 statuses 有 poison.value>0 → hp -= poison.value
    poison.value -= 1 (为0移除)
    若玩家死 → 检查 hasFatalProtection → 触发沙漏/直接 gameover

[2] 敌人灼烧结算 settleEnemyBurn:
    存活敌人 burn.value>0 → hp -= burn.value
    burn 移除、armor=0 (灼烧破甲)
    若全灭 → tryWaveTransition OR handleVictory

[3] 敌人中毒结算 settleEnemyPoison:
    同上，poison.value -= 1 (非移除)
    所有敌人 statuses 走一次 tickStatuses (duration -= 1)

[4] 每个存活敌人执行 AI:
    - 若冰冻 (freeze.duration>0) → 跳过
    - 若减速 (slow) + 近战 + distance>0 → 卡住不动
    - 若近战 + distance>0 → distance -= 1 (逼近)
    - Guardian + battleTurn % 2==0 → 上盾嘲讽 (shield = atk * 0.5)
    - Priest → 治疗盟友/施负面/减甲
    - Caster → 对玩家施加 DoT (burn/poison/vulnerable/weak)
    - Warrior/Ranger → 直接攻击
        - Ranger: attackCount += 1, 第二击追击 = max(1, atk*0.4 + attackCount + 1)
        - 伤害 → armor 吸收 → hp
        - on_damage_taken 遗物：rageFireBonus/relicTempDrawBonus 叠加
        - 怒火骰 `w_fury`：`furyBonusDamage += furyLevel` (每次被打永久叠加)

[5] 精英/Boss 丢废骰 processEliteDice → ownedDice 注入诅咒骰

[6] 精英/Boss 叠护甲 processEliteArmor → enemy.armor += N

[7] 玩家灼烧结算:
    若 burn.value>0 → hp -= burn.value，burn 移除
    所有 statuses tickStatuses
    battleTurn += 1
    若玩家死 → 沙漏/gameover
```

---

## 八、三职业差异总表（规则源头 `classes.ts`）

| 字段 | 战士 | 法师 | 盗贼 |
|---|---|---|---|
| `drawCount`（初始手牌） | **3** | **3** | **3** |
| `maxPlays`（每回合出牌次数） | 1 | 1 | **2** |
| `freeRerolls` | 1 | 1 | 1 |
| `canBloodReroll` | **true** | false | false |
| `keepUnplayed`（仅UI标签） | false | **true** | false |
| `normalAttackMultiSelect`（仅UI标签） | **true** | false | false |
| 初始 hp/maxHp | 120 | 100 | 90 |
| 初始骰子 | std×4 + w_bloodthirst + w_ironwall | std×4 + mage_elemental + mage_reverse | std×3 + r_quickdraw + r_combomastery |

> 注意：`keepUnplayed` 和 `normalAttackMultiSelect` **只是 UI 标签**（`ClassSelectScreen` 显示用）。真实行为代码里全靠 `playerClass === 'mage'` / `playerClass === 'warrior'` 硬判断。

### 8.1 战士专属机制

1. **血怒补牌**（被动）：HP ≤ 50% max 时，抽牌数 +1（`drawPhase.ts` + `rollAllDice`）
2. **血怒叠层**（触发）：每次卖血重投 `bloodRerollCount += 1`，上限 5，每层 +15% 最终伤害，叠满再卖血 +5 护甲
3. **狂暴倍率**（被动+触发）：当 `hp ≤ 50% && rawTargetHandSize > 6` 触发，`warriorRageMult = (1 - hp/maxHp)`，精度 0.01，作为最终伤害倍率
4. **多选普攻铁拳连打**：
   - UI：不禁用出牌按钮，显示 "出牌: 普通攻击"
   - 代码：`isNonWarriorMultiNormal === false`
   - 战斗：`skipOnPlay=true` 跳过所有骰子 onPlay 效果，伤害仅 `baseDamage = X * handMultiplier(1)`
   - Toast 提示："多选普通攻击：特殊骰子效果将被禁用！"（选中后弹一次）
5. **重投代价**：可卖血（baseCost = ceil(maxHp × 2^(n+1) / 100) HP）
6. **弃牌**：每回合全弃（命运之轮遗物可例外）

### 8.2 法师专属机制

1. **吟唱保留**（被动）：未出牌回合保留所有未消耗手牌
2. **吟唱加骰**（被动）：每吟唱一次 `chargeStacks += 1`，抽牌上限 `min(6, drawCount + chargeStacks)`
3. **吟唱护甲**（触发）：每次吟唱 `armor += 6 + currentCharge*2`（吟唱层数越高护甲越多）
4. **过充**（触发）：手牌上限达6后继续吟唱，`mageOverchargeMult += 0.10`
5. **过充倍率生效**：出牌时 `multiplier *= (1 + mageOverchargeMult)`
6. **出牌清零**：任何出牌 → `chargeStacks=0, mageOverchargeMult=0`
7. **无法卖血**（非战士 → `-1` 禁用）
8. **波次转换特殊**：若切波时法师正在吟唱（`playsLeft === maxPlays`），`chargeStacks/mageOverchargeMult/lockedElement/手牌` 全部保留（而非重置）
9. **UI 按钮**：未出牌回合的"结束回合"按钮变紫色 + "吟唱"文案 + 紫色粒子
10. **棱镜锁元素**：`mage_prism` 出牌后 `lockElement=true`，下回合所有元素骰沿用当前元素

### 8.3 盗贼专属机制

1. **每回合 2 次出牌**（`maxPlays=2`）
2. **连击伤害**：第 2 次出牌且非普攻 → `modifiedDamage *= 1.2`
3. **精准连击**：`currentCombo===1 && lastHandType===thisHandType && 非普攻` → **额外** ×1.25
4. **连击预备**：第 1 次出牌后 `rerollCount -= 1`（+1 免费重投）
5. **暗影残骰保留**：出牌时 `shadowRemnantPersistent=true` 的残骰跨回合保留（仅一次，下回合转 `isTemp`）
6. **临时骰销毁**：`isTemp && 非持久` 的残骰回合结束不入弃牌库，直接销毁
7. **连击补牌**：`rogueComboDrawBonus` 下回合多抽牌
8. **UI 按钮**：`comboCount >= 1 && playsLeft > 0` → "结束回合"按钮变青色 + "迎风连击"文案

---

## 九、牌型判定 `checkHands`（通用）

- **空选**：`普通攻击`
- **1 颗**：`普通攻击`（唯一牌型）
- **镜像骰 `ignoreForHandType`**：点数计入 X 但不参与牌型判定
- **同元素**：≥4 颗且元素统一（非 normal）
- **顺子**：≥3 颗连续且点数互异
  - 3顺/4顺/5顺/6顺 按长度区分
- **N 条**：2/3/4/5/6 同点数
- **葫芦**：3+2（5颗）、3+3（6颗）、4+2（6颗）
- **连对**：2+2（4颗）；**三连对**：2+2+2（6颗）
- **元素顺**：同元素 + 顺子
- **皇家元素顺**：元素顺 + 1-6 连（最高牌型）
- **元素葫芦**：同元素 + 葫芦

**优先级**（决定 `bestHand`）：
```
皇家元素顺 > 元素葫芦 > 元素顺 > 六条 > 五条 > 四条 > 葫芦 > 同元素
> 6顺 > 5顺 > 4顺 > 顺子 > 三条 > 三连对 > 连对 > 对子 > 普通攻击
```

**多选普攻判定**（关键）：
```ts
isNormalAttackMulti = selected.length > 1
                   && activeHands = ['普通攻击']   # 只有普攻，无其他
isNonWarriorMultiNormal = isNormalAttackMulti && playerClass !== 'warrior'
skipOnPlay = selected.length > 1 && activeHands = ['普通攻击']
```
- UI 层 `playHand` 按钮：`isNonWarriorMultiNormal=true` → 禁用 + 灰色 + 文案"不成牌型（仅限选1颗）"
- UI 层 `toggleSelect`：战士多选后若触发 `shouldWarnWarriorMultiNormal` → Toast 警告
- 战斗层 `expectedOutcomeCalc`：`skipOnPlay=true` → 所有骰子 onPlay 跳过

---

## 十、其他 Godot 移植容易遗漏的隐藏细节

1. **骰子动画节奏**：8 帧递增间隔 `[30,40,50,60,80,100,120,150]ms`，第 3 帧播 `reroll` 音；结束前播 `dice_lock`。
2. **自动结束回合的 1000ms 延时**：`useBattleCombat.tsx` useEffect，条件 = `playsLeft<=0 OR 无未消耗骰子`。
3. **出牌动画 500ms**：`handLeftThrow=true` 500ms 后复位（手牌向左抛出）。
4. **洗牌动画 800ms**：`shuffleAnimating=true` → `false`。
5. **死亡清理缓冲 2200ms**：`ANIMATION_TIMING.enemyDeathCleanupDelay`，防死亡动画被提前清理。
6. **Toast 冷却 3000ms**：同内容 Toast 3 秒内不重复。
7. **飘字生命周期**：普通 2200ms，large 3500ms。
8. **BGM 切换表**：`battle/map/merchant/campfire/event/diceReward/loot/skillSelect/treasure` → 对应 `battle/explore/start/stop` 三种状态。
9. **战士怒火骰 `w_fury`**：每次被攻击 `furyBonusDamage += level`，永久累加，作为下次出牌 extraDamage。
10. **即死挑战 `instakillChallenge`**：每波生成一个挑战，出牌后 `checkChallenge` 更新进度，完成触发 aid 效果（600ms 后）。
11. **deep kill 溢出 → 魂晶**：`overkill × min(maxHp, overkill) × (soulCrystalMultiplier + depth*0.1) × 0.15`，存入 `blackMarketQuota`。
12. **结束回合按钮 3 种职业皮肤**：
    - 法师 `playsLeft===maxPlays` → 紫色"吟唱"+粒子
    - 盗贼 `comboCount>=1 && playsLeft>0` → 青色"迎风连击"+粒子
    - 其他 → 金色"结束回合"+箭头
13. **出牌按钮文案 3 态**：
    - 非战士多选普攻 → 灰色 + "不成牌型（仅限选1颗）"
    - `playsLeft>0` → 绿色 + "出牌: {bestHand}"
    - `playsLeft<=0` → 灰色 + "出牌次数耗尽"
14. **敌人回合开始时 reset 的 5 个字段**：`isEnemyTurn=true, bloodRerollCount=0, comboCount=0, lastPlayHandType=undefined, blackMarketUsedThisTurn=false`（不在 endTurn 返回时重置！）
15. **endTurn 返回后 reset 的 6 个字段**：`isEnemyTurn=false, armor=0, playsLeft=maxPlays, freeRerollsLeft=freeRerollsPerTurn, hpLostThisTurn=0, consecutiveNormalAttacks=0`
16. **波次转换 `tryWaveTransition`**：若切波时法师处于吟唱状态，手牌和蓄力层不清；否则 `setDice([])` + `rollAllDice(true)`。
17. **暗影残骰**：2 个字段 `isShadowRemnant=true, shadowRemnantPersistent=true/false` + `isTemp=true`。生成时 `shadowRemnantPersistent` 可选，`comboPersistShadow` 效果会把它改成 true。
18. **命运之轮**一次性：`fortuneWheelUsed` 每战斗开始重置，本战内第一次出牌后触发，之后失效。
19. **薛定谔临时加成3件套**：`tempDrawCountBonus`（on_turn_end 遗物）、`rogueComboDrawBonus`（盗贼连击）、`relicTempDrawBonus`（魔法手套等），都是**用一次清零**。
20. **法师波次切换保留条件**：`mage && playsLeft >= maxPlays`（等于 `!playedThisTurn`，即当前回合未出牌）才保留吟唱状态。

---

## 十一、Godot 对照排查 Checklist（给移植参考）

### ☑ 必须严格复刻的行为
- [ ] 抽牌数 = `min(6, drawCount + chargeBonus + warriorBonus + 三种临时bonus - 已保留数)`
- [ ] 战士 HP≤50% 血怒补牌 +1
- [ ] 战士 rawTargetHandSize>6 时触发 warriorRageMult
- [ ] 法师未出牌保留手牌 + 吟唱护甲 `6 + currentCharge*2`
- [ ] 法师过充 +10%/回合
- [ ] 盗贼残骰持久化保留 1 回合后转 `isTemp`
- [ ] 重投 HP 代价 `maxHp × 2^(n+1) / 100`，非战士×2
- [ ] 战士嗜血 5 层上限 + 满层 +5 护甲
- [ ] skipOnPlay：多选普攻时 onPlay 全禁用
- [ ] 非战士 UI 层禁用多选普攻出牌按钮
- [ ] 连击精准终结 +25%（同牌型非普攻）
- [ ] 盗贼 maxPlays=2 + 第2次非普攻 ×1.2
- [ ] 敌人回合开始重置 bloodRerollCount/comboCount
- [ ] endTurn 返回重置 armor/playsLeft/freeRerollsLeft
- [ ] 牌型判定 17 种全覆盖 + 优先级
- [ ] 波次切换法师吟唱保留逻辑

### ☑ 动画时序（否则手感差异大）
- [ ] 掷骰 8 帧：`[30,40,50,60,80,100,120,150]ms`
- [ ] 自动结束回合延时 1000ms
- [ ] 出牌动画 500ms
- [ ] 敌人死亡缓冲 2200ms
- [ ] 洗牌动画 800ms

### ☑ UI 层细节
- [ ] 结束回合按钮 3 色皮肤（法师紫/盗贼青/其他金）
- [ ] 出牌按钮文案 3 态
- [ ] 战士多选特殊骰 Toast 警告
- [ ] 血怒/狂暴/吟唱/过充/连击的 BuffTooltip
- [ ] 弃牌库洗牌粒子特效 + Toast

### ☑ 易忽略的遗物互动
- [ ] 命运之轮（首次出牌后保留手牌1次/战）
- [ ] 保留最高点遗物
- [ ] on_reroll: 黑市契约本回合只触发一次
- [ ] on_damage_taken: 怒火燎原 rageFireBonus
- [ ] on_kill: 溢出导管、魂晶
- [ ] 怒火骰 w_fury: furyBonusDamage 永久叠加
- [ ] 沙漏 hasFatalProtection: 玩家致死时救一次

---

## 十二、结论

上述 11 大模块是 React 版的**真实可观测行为完整还原**。用户给出的三条核心规则全部核对一致：

1. ✅ **每回合未出手牌默认全弃** → `drawPhase.ts` 战士/其他分支 `discardFromHand = dice.filter(d=>!d.spent)`
2. ✅ **法师吟唱（未出牌）才保留手牌** → `drawPhase.ts` 法师分支 `playedThisTurnCheck` 判定
3. ✅ **战士普攻可无视牌型一口气全出** → `classes.ts: normalAttackMultiSelect=true` + `aoeDetection.ts: shouldWarnWarriorMultiNormal` + `expectedOutcomeCalc.ts: skipOnPlay`
