/**
 * xpEvents.ts — 经验事件总线
 *
 * postPlayEffects 发出击杀事件（每个被击杀敌人的 uid + 分配到的 XP），
 * XpShardLayer 订阅事件，读取敌人 DOM 位置 → 生成飞向徽章的经验碎片。
 *
 * 独立于 React 状态，避免污染 GameState。
 */

export interface XpKillEvent {
  /** 被击杀敌人的 uid（需与 data-enemy-uid 对应） */
  enemyUid: string;
  /** 分配到该敌人的经验量（用来决定碎片数量） */
  xp: number;
  /** 事件触发时间戳，用于 key */
  at: number;
}

type Listener = (ev: XpKillEvent) => void;

const listeners = new Set<Listener>();

export function onXpKill(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function emitXpKill(ev: XpKillEvent): void {
  listeners.forEach(fn => {
    try { fn(ev); } catch (e) { /* 吞掉避免一个订阅者挂掉影响其他 */ }
  });
}