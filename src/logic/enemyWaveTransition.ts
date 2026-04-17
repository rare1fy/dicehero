/**
 * enemyWaveTransition.ts — 敌人波次转换逻辑
 * 从 enemyAI.ts 拆分，ARCH-6 Round 2
 *
 * 职责：检查并执行波次转换
 */

import type { GameState, Enemy, Die } from '../types/game';
import { generateChallenge } from '../utils/instakillChallenge';

/** 波次转换所需的回调接口（从 EnemyAICallbacks 中提取） */
export interface WaveTransitionCallbacks {
  setGame: (update: GameState | ((prev: GameState) => GameState)) => void;
  setEnemies: (update: Enemy[] | ((prev: Enemy[]) => Enemy[])) => void;
  setEnemyEffects: (update: Record<string, string | null> | ((prev: Record<string, string | null>) => Record<string, string | null>)) => void;
  setDyingEnemies: (update: Set<string> | ((prev: Set<string>) => Set<string>)) => void;
  setRerollCount: (v: number | ((prev: number) => number)) => void;
  setWaveAnnouncement: (v: number | null) => void;
  addLog: (msg: string) => void;
  setDice: (v: Die[]) => void;
  rollAllDice: (force?: boolean) => void;
}

/**
 * 检查并执行波次转换
 * @returns true=成功转波, false=没有下一波（应调用handleVictory）
 */
export function tryWaveTransition(
  game: GameState,
  cb: WaveTransitionCallbacks
): boolean {
  const nextWaveIdx = game.currentWaveIndex + 1;
  if (nextWaveIdx >= game.battleWaves.length) return false;

  const nextWave = game.battleWaves[nextWaveIdx].enemies;
  cb.setEnemies(nextWave);
  cb.setEnemyEffects({});
  cb.setDyingEnemies(new Set());
  cb.setGame((prev: GameState) => ({
    ...prev,
    currentWaveIndex: nextWaveIdx,
    targetEnemyUid: (nextWave.find(e => e.combatType === 'guardian') || nextWave[0])?.uid || null,
    isEnemyTurn: false,
    playsLeft: prev.maxPlays,
    freeRerollsLeft: prev.freeRerollsPerTurn,
    armor: 0,
    chargeStacks: 0,
    mageOverchargeMult: 0,
    bloodRerollCount: 0,
    comboCount: 0,
    lastPlayHandType: undefined,
    instakillChallenge: generateChallenge(prev.map.find(n => n.id === prev.currentNodeId)?.depth || 0, prev.chapter, prev.drawCount, prev.map.find(n => n.id === prev.currentNodeId)?.type),
    instakillCompleted: false,
    playsThisWave: 0,
    rerollsThisWave: 0,
    battleTurn: 1,
  }));
  cb.setRerollCount(0);
  cb.setWaveAnnouncement(nextWaveIdx + 1);
  cb.addLog(`第 ${nextWaveIdx + 1} 波敌人来袭！`);
  cb.setDice([]);
  cb.rollAllDice(true);
  return true;
}
