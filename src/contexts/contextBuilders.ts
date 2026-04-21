/**
 * contextBuilders.ts — Context Provider Value 构建器
 * 提取自 DiceHeroGame.tsx Phase J (Round3)
 * 将 GameContext / BattleContext 的 value 对象构建逻辑集中管理
 */
import type { BattleState } from '../hooks/useBattleState';
import type { BattleLifecycle } from '../hooks/useBattleLifecycle';
import type { BattleCombat } from '../hooks/useBattleCombat';
import type { BattleContextType } from '../contexts/BattleContext';
import type { GameContextType } from '../contexts/GameContext';

/**
 * 构建 GameContext.Provider 的 value 对象
 */
export function buildGameContext(
  state: BattleState,
  lifecycle: BattleLifecycle,
  combat: BattleCombat,
): GameContextType {
  const {
    game, setGame,
    enemies, setEnemies, targetEnemy,
    dice, setDice,
    showTutorial, setShowTutorial,
    showHandGuide, setShowHandGuide,
    showDiceGuide, setShowDiceGuide,
    rerollFlash,
    startingRelicChoices,
    pendingBattleNode,
    toasts, addToast,
    addLog,
  } = state;

  const {
    startNode, startBattle,
    handleSelectStartingRelic, handleSkipStartingRelic,
    resetGame,
  } = lifecycle;

  const {
    collectLoot, finishLoot,
    pickReward, nextNode,
  } = combat;

  return {
    game, setGame,
    enemies, setEnemies, targetEnemy,
    dice, setDice,
    showTutorial, setShowTutorial,
    showHandGuide, setShowHandGuide,
    showDiceGuide, setShowDiceGuide,
    rerollFlash,
    startingRelicChoices,
    pendingBattleNode,
    startNode, startBattle,
    collectLoot, finishLoot,
    pickReward, nextNode,
    toasts, addToast,
    addLog,
    handleSelectStartingRelic, handleSkipStartingRelic,
    resetGame,
  };
}

/**
 * 构建 BattleContext.Provider 的 value 对象
 */
export function buildBattleContext(
  state: BattleState,
  lifecycle: BattleLifecycle,
  combat: BattleCombat,
): BattleContextType {
  const {
    game, setGame,
    enemies, targetEnemy,
    dice,
    rerollCount,
    enemyEffects,
    playerEffect,
    screenShake,
    hpGained,
    rerollFlash,
    floatingTexts,
    enemyQuotes,
    enemyInfoTarget, setEnemyInfoTarget,
    selectedHandTypeInfo, setSelectedHandTypeInfo,
    settlementPhase,
    settlementData,
    showDamageOverlay,
    showRelicPanel, setShowRelicPanel,
    flashingRelicIds,
    selectedRelic, setSelectedRelic,
    showCalcModal, setShowCalcModal,
    showHandGuide, setShowHandGuide,
    showDiceGuide, setShowDiceGuide,
    showClassInfo, setShowClassInfo,
    battleTransition,
    bossEntrance,
    waveAnnouncement, setWaveAnnouncement,
    showWaveDetail, setShowWaveDetail,
    showChallengeDetail, setShowChallengeDetail,
    handLeftThrow,
    shuffleAnimating,
    diceDiscardAnim,
    lastTappedDieId, setLastTappedDieId,
    skillTriggerTexts,
    targetEnemyUid,
    addToast,
    addFloatingText,
    addLog,
  } = state;

  const {
    currentHands,
    isNormalAttackMulti,
    handHintIds,
    expectedOutcome,
    isAoeActive,
    canReroll,
    canAffordReroll,
    freeRerollsRemaining,
    currentRerollCost,
    rerollSelected,
    toggleSelect,
    playHand,
    endTurn,
  } = combat;

  // rollAllDice 来自 lifecycle 而非 combat
  const { rollAllDice } = lifecycle;

  return {
    // 核心战斗状态
    game, setGame,
    enemies, targetEnemy,
    dice,
    rerollCount,

    // 战斗UI状态
    enemyEffects,
    playerEffect,
    screenShake,
    hpGained,
    rerollFlash,
    floatingTexts,
    enemyQuotes,
    enemyInfoTarget,
    setEnemyInfoTarget,
    selectedHandTypeInfo,
    setSelectedHandTypeInfo,

    // 结算演出状态
    settlementPhase,
    settlementData,
    showDamageOverlay,
    showRelicPanel,
    setShowRelicPanel,
    flashingRelicIds,
    selectedRelic,
    setSelectedRelic,

    // 模态框开关
    showCalcModal,
    setShowCalcModal,
    showHandGuide,
    setShowHandGuide,
    showDiceGuide,
    setShowDiceGuide,
    showClassInfo,
    setShowClassInfo,

    // 转场/波次状态
    battleTransition,
    bossEntrance,
    waveAnnouncement,
    setWaveAnnouncement,
    showWaveDetail,
    setShowWaveDetail,
    showChallengeDetail,
    setShowChallengeDetail,

    // 骰子动画状态
    handLeftThrow,
    shuffleAnimating,
    diceDiscardAnim,
    lastTappedDieId,
    setLastTappedDieId,

    // 战斗动画数据
    skillTriggerTexts,
    targetEnemyUid,

    // 计算属性
    currentHands,
    isNormalAttackMulti,
    handHintIds,
    expectedOutcome,
    isAoeActive,
    canReroll,
    canAffordReroll,
    freeRerollsRemaining,
    currentRerollCost,

    // 战斗动作
    rollAllDice,
    rerollSelected,
    toggleSelect,
    playHand,
    endTurn,
    addToast,
    addFloatingText,
    addLog,
  };
}
