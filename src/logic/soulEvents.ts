/**
 * soulEvents.ts — 魂晶事件总线
 *
 * postPlayEffects 击杀溢出伤害转化魂晶时发事件（起点敌人 uid + 数量），
 * SoulShardLayer 订阅事件，生成从敌人位置飞向顶栏魂晶 badge 的碎片。
 *
 * 独立于 React 状态，设计与 xpEvents 完全对齐。
 */

export interface SoulGainEvent {
  /** 起点：触发溢出的敌人 uid（需与 data-enemy-uid 对应） */
  enemyUid: string;
  /** 本次获得魂晶数量（决定碎片数量） */
  amount: number;
  /** 事件时间戳 */
  at: number;
}

type Listener = (ev: SoulGainEvent) => void;

const listeners = new Set<Listener>();

export function onSoulGain(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function emitSoulGain(ev: SoulGainEvent): void {
  listeners.forEach(fn => {
    try { fn(ev); } catch (e) { /* 吞掉避免一个订阅者挂掉影响其他 */ }
  });
}
