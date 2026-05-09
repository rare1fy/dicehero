/**
 * warriorReap.ts — 战士天赋【战场收割】(2026-05-09)
 *
 * 设计：
 *   战士通过两种行为换取下回合临时手牌上限：
 *     1. 斩首槽（kill）  : 本回合直伤击杀任意敌人（DOT 击杀不算）
 *     2. 完防槽（block） : 敌人直接攻击命中你，护甲完全吸收（armor 扣完未到 0、HP 未减）
 *   每槽默认上限 1（即一回合最多 +1 + +1 = +2 临时手牌）。
 *   遗物 / 职业骰子 可以临时把槽位上限抬高（warriorReapKillSlotCap / warriorReapBlockSlotCap）。
 *   下回合开局抽牌阶段把两槽合计加到 drawCount 上；溢出 6 颗的部分按法师过充逻辑转 +10%/颗 伤害。
 *   所有槽位字段在抽牌阶段消耗后清零。
 *
 *   "战场收割·爆发回合"：上回合奖励兑现的回合，触发血怒粒子特效（PlayerHudView）。
 *   特效在玩家**完成出牌**（或回合切换）后归零。
 */
import type { GameState } from '../types/game';

const DEFAULT_SLOT_CAP = 1;

/** [WARRIOR-REAP 2026-05-09] 战神纹章遗物：双槽位上限永久 +1 */
const hasWarlordEmblem = (g: GameState): boolean =>
  Array.isArray(g.relics) && g.relics.some(r => r.id === 'warlord_emblem');

/** 当前 game 是否是战士。其他职业不触发任何战场收割逻辑 */
export const isWarrior = (g: Pick<GameState, 'playerClass'>): boolean =>
  g.playerClass === 'warrior';

/** 取斩首槽上限（受遗物/骰子破限） */
export const getKillSlotCap = (g: GameState): number => {
  const base = Math.max(DEFAULT_SLOT_CAP, g.warriorReapKillSlotCap || DEFAULT_SLOT_CAP);
  return base + (hasWarlordEmblem(g) ? 1 : 0);
};

/** 取完防槽上限（受遗物/骰子破限） */
export const getBlockSlotCap = (g: GameState): number => {
  const base = Math.max(DEFAULT_SLOT_CAP, g.warriorReapBlockSlotCap || DEFAULT_SLOT_CAP);
  return base + (hasWarlordEmblem(g) ? 1 : 0);
};

/**
 * 触发斩首槽：直伤击杀一只敌人时调用。返回更新后的 GameState 片段。
 *   上限达到时无变化。
 *   不应在 DOT 结算路径调用。
 */
export const tryGainKillSlot = (g: GameState): { changed: boolean; gameUpdate: Partial<GameState> } => {
  if (!isWarrior(g)) return { changed: false, gameUpdate: {} };
  const cur = g.warriorReapKillSlot || 0;
  const cap = getKillSlotCap(g);
  if (cur >= cap) return { changed: false, gameUpdate: {} };
  return { changed: true, gameUpdate: { warriorReapKillSlot: cur + 1 } };
};

/**
 * 触发完防槽：敌人直接攻击命中后，本次伤害被护甲全额吸收时调用。
 *   incoming > 0 && armor >= incoming  → HP 未掉一滴 → 算"完美防御"
 *   DOT/状态伤害绕开本路径，不会触发。
 */
export const tryGainBlockSlot = (g: GameState): { changed: boolean; gameUpdate: Partial<GameState> } => {
  if (!isWarrior(g)) return { changed: false, gameUpdate: {} };
  const cur = g.warriorReapBlockSlot || 0;
  const cap = getBlockSlotCap(g);
  if (cur >= cap) return { changed: false, gameUpdate: {} };
  return { changed: true, gameUpdate: { warriorReapBlockSlot: cur + 1 } };
};

/**
 * 抽牌阶段：消耗两槽，写入 warriorReapNextDraw 并标记爆发回合。
 *   返回额外抽牌数（用于 drawPhase 拼装 targetHandSize）。
 *   这个函数应该在抽牌"开始时"调用一次，立即清零槽位 + 写 warriorReapBurstActive=true（如果有奖励）。
 */
export const consumeReapSlotsForDraw = (g: GameState): {
  bonusDraw: number;
  killSlots: number;
  blockSlots: number;
  gameUpdate: Partial<GameState>;
} => {
  const killSlots = g.warriorReapKillSlot || 0;
  const blockSlots = g.warriorReapBlockSlot || 0;
  const bonus = killSlots + blockSlots;
  if (bonus <= 0) {
    return { bonusDraw: 0, killSlots: 0, blockSlots: 0, gameUpdate: {} };
  }
  return {
    bonusDraw: bonus,
    killSlots,
    blockSlots,
    gameUpdate: {
      warriorReapKillSlot: 0,
      warriorReapBlockSlot: 0,
      // 槽位上限是"本回合"破限，回合结束随槽位一起重置
      warriorReapKillSlotCap: DEFAULT_SLOT_CAP,
      warriorReapBlockSlotCap: DEFAULT_SLOT_CAP,
      warriorReapNextDraw: bonus,
      warriorReapBurstActive: true,
    },
  };
};

/** 关闭爆发态（出牌后或回合末调用） */
export const clearBurstFlag = (): Partial<GameState> => ({
  warriorReapBurstActive: false,
  warriorReapNextDraw: 0,
});
