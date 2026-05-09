/**
 * finalBosses.ts — 终极 BOSS（章末 BOSS）id 名单
 *
 * 来源：每章 BOSS_ENEMIES 的最后一个 id（与 useBattleLifecycle isFinalBossNode 判定对应）。
 * 用途：渲染时识别终极 BOSS 以应用专属视觉规则（缩放、粒子等）。
 *
 * 维护：新增章节时，把该章的"终极 BOSS"id 加入此 Set。
 */

export const FINAL_BOSS_IDS: ReadonlySet<string> = new Set([
  "boss_ancient_treant", // 第1章 - 远古树王
  "boss_frost_lich",     // 第2章 - 霜之巫妖王
  "boss_deathwing",      // 第3章 - 熔火死翼
  "boss_kiljaeden",      // 第4章 - 暗影之王
  "boss_eternal_lord",   // 第5章 - 永恒主宰
]);

/** 判断给定 configId 是否为终极 BOSS */
export function isFinalBossId(configId: string | undefined): boolean {
  if (!configId) return false;
  return FINAL_BOSS_IDS.has(configId);
}