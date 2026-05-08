/**
 * bossTauntDispatch.ts — Boss 登场"派小弟"演出相关台词池
 *
 * 用于：useBattleLifecycle.ts 章节首战 Boss 路过嘲讽演出
 *  - BOSS_DISPATCH_LINES：Boss 第二句，派遣小弟的挑衅/指令台词
 *  - MINION_FORCED_LINES：小弟登场若 enter 池为空时使用的通用兜底台词
 */

export const BOSS_DISPATCH_LINES: string[] = [
  '小的们，上！让他尝尝厉害。',
  '来人！把这不知死活的东西撕碎。',
  '孩儿们，让他见识见识本尊的爪牙。',
  '弟兄们，替我招呼招呼这位"英雄"。',
  '先让我的爪牙和你玩玩，别太快倒下。',
];

export const MINION_FORCED_LINES: string[] = [
  '老大有令，你死定了！',
  '这块肉就交给我了！',
  '嘿嘿，别反抗，死得痛快些。',
  '送你上路！',
  '听到了吗？老大让我们收拾你。',
];