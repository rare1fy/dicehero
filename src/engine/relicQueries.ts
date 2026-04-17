/**
 * relicQueries.ts — 遗物查询函数
 *
 * 消灭 DiceHeroGame.tsx 中所有硬编码的 `r.id === 'xxx'` 查询。
 * 所有遗物判断统一走这层，避免字符串散落各处。
 *
 * SRP: 只负责"查询遗物状态"，不负责触发效果。
 */

import type { Relic } from '../types/game';

// ============================================================
// 核心查询：有/无、计数器
// ============================================================

/** 判断是否拥有指定遗物 */
export const hasRelic = (relics: Relic[], relicId: string): boolean =>
  relics.some(r => r.id === relicId);

/** 获取指定遗物（返回 undefined 如果没有） */
export const getRelic = (relics: Relic[], relicId: string): Relic | undefined =>
  relics.find(r => r.id === relicId);

/** 获取指定遗物的计数器值（默认0） */
export const getRelicCounter = (relics: Relic[], relicId: string): number =>
  getRelic(relics, relicId)?.counter || 0;

// ============================================================
// 具名查询：每个硬编码遗物一个语义化函数
// ============================================================

// --- 突破限制（limit_breaker）---
/** 是否拥有突破限制（骰子面值上限解除） */
export const hasLimitBreaker = (relics: Relic[]): boolean =>
  hasRelic(relics, 'limit_breaker');

// --- 导航罗盘（navigator_compass）---
/** 导航罗盘计数器 */
export const getCompassCounter = (relics: Relic[]): number =>
  getRelicCounter(relics, 'navigator_compass');

// --- 紧急沙漏（emergency_hourglass）---
/** 紧急沙漏是否可用（counter === 0 表示冷却完毕） */
export const isHourglassReady = (relics: Relic[]): boolean => {
  const hg = getRelic(relics, 'emergency_hourglass');
  return !!hg && (hg.counter || 0) === 0;
};

/** 紧急沙漏当前倒计时 */
export const getHourglassCounter = (relics: Relic[]): number =>
  getRelicCounter(relics, 'emergency_hourglass');

// --- 嗜血骰袋（extra_free_reroll）---
/** 是否拥有嗜血骰袋（非战士也能嗜血重投） */
export const hasBloodRerollRelic = (relics: Relic[]): boolean =>
  hasRelic(relics, 'extra_free_reroll');

// --- 降维打击（dimension_crush）---
/** 顺子升级量（0 或 1） */
export const getStraightUpgrade = (relics: Relic[]): number =>
  hasRelic(relics, 'dimension_crush') ? 1 : 0;

// --- 层厅征服者（floor_conqueror）---
/** 已通关层数 */
export const getFloorsCleared = (relics: Relic[]): number =>
  getRelicCounter(relics, 'floor_conqueror');

// --- 溢出导管（overflow_conduit）---
/** 是否拥有溢出导管 */
export const hasOverflowConduit = (relics: Relic[]): boolean =>
  hasRelic(relics, 'overflow_conduit');

// --- 薛定谔的袋子（schrodinger_bag）---
/** 是否拥有薛定谔的袋子 */
export const hasSchrodingerBag = (relics: Relic[]): boolean =>
  hasRelic(relics, 'schrodinger_bag');

// --- 命运之轮（fortune_wheel_relic）---
/** 是否拥有命运之轮且未使用 */
export const isFortuneWheelReady = (relics: Relic[], fortuneWheelUsed: boolean): boolean =>
  hasRelic(relics, 'fortune_wheel_relic') && !fortuneWheelUsed;

// ============================================================
// 被动遗物值查询（替代 .effect({}) 空对象调用）
// ============================================================

import type { RelicEffect, PassiveRelicKey } from '../types/game';

/**
 * 获取所有 passive 遗物的效果累加
 *
 * [RULES-A4] 被动遗物返回静态值，不依赖 RelicContext。
 * 使用 PassiveRelicKey 类型约束，确保只能查询被动遗物特有的字段。
 * 如果尝试查询非被动字段（如 damage/armor），TypeScript 会编译报错。
 *
 * @param relics 遗物列表
 * @param key 要累加的 PassiveRelicKey 字段名
 * @returns 所有 passive 遗物该字段的累加值
 */
export const sumPassiveRelicValue = (
  relics: Relic[],
  key: PassiveRelicKey,
): number => {
  return relics
    .filter(r => r.trigger === 'passive')
    .reduce((sum, r) => {
      const eff = r.effect({});
      const val = eff[key];
      return sum + (typeof val === 'number' ? val : 0);
    }, 0);
};

/**
 * 按触发器类型查询遗物被动属性值累加
 *
 * [RULES-A4] 替代直接调用 r.effect({})，统一走查询层。
 * 仅用于"查询遗物声明时返回的静态属性值"，不触发效果。
 *
 * @param relics 遗物列表
 * @param trigger 触发器类型（如 'on_reroll'）
 * @param key 要累加的 RelicEffect 字段名
 * @returns 指定 trigger 类型的所有遗物该字段的累加值
 */
export const sumRelicValueByTrigger = <K extends keyof RelicEffect>(
  relics: Relic[],
  trigger: string,
  key: K,
): number => {
  return relics
    .filter(r => r.trigger === trigger)
    .reduce((sum, r) => {
      const eff = r.effect({});
      const val = eff[key];
      return sum + (typeof val === 'number' ? val : 0);
    }, 0);
};

// ============================================================
// on_fatal 致命保护查询
// ============================================================

/**
 * 检查 on_fatal 遗物是否能阻止致命伤害
 *
 * [RULES-A3] 统一 on_fatal 触发接口，替代3处重复的 isHourglassReady 判断。
 * 遍历所有 on_fatal 遗物，检查 effect() 中是否包含 preventDeath 且遗物就绪。
 * 目前只有急救沙漏一种，但未来新增 on_fatal 遗物自动生效。
 *
 * @param relics 遗物列表
 * @returns 是否有 on_fatal 遗物能阻止本次致命伤害
 */
export const hasFatalProtection = (relics: Relic[]): boolean => {
  return relics
    .filter(r => r.trigger === 'on_fatal')
    .some(r => {
      const eff = r.effect({});
      // 检查是否有 preventDeath 且就绪（counter === 0 表示 CD 完毕）
      return eff.preventDeath && (r.counter || 0) === 0;
    });
};
