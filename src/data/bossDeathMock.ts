/**
 * bossDeathMock.ts — 玩家死亡时，该章"终 BOSS"对玩家的嘲讽台词池
 *
 * 用于 GameOverScreen：根据 game.chapter 取对应章的终 BOSS 名 + 从对应池里随机抽一条嘲讽。
 * 每章 3 条，风格延续 enemyEliteBoss.ts 的 greet/dispatch 语感。
 */

export interface ChapterDeathMock {
  /** 该章终 BOSS 名字（与 CHAPTER_BOSSES[idx][1] 一致，用于 PixelSprite 取图） */
  bossName: string;
  /** 嘲讽台词池 */
  lines: string[];
}

export const CHAPTER_DEATH_MOCKS: ChapterDeathMock[] = [
  // 章 1 · 远古树王（幽暗森林）
  {
    bossName: '远古树王',
    lines: [
      '根须下多了一具骸骨——森林从不嫌肥料多。',
      '连我的树冠都没看见，你就倒了？可怜。',
      '春天的嫩芽会从你的胸口长出来的。安息吧，养料。',
    ],
  },
  // 章 2 · 霜之巫妖王（冰封山脉）
  {
    bossName: '霜之巫妖王',
    lines: [
      '霜之哀伤没饮过你的血——真遗憾。',
      '冰雕长廊里，又要多一座姿势难看的新作。',
      '连我的剑刃出鞘都不配见，你就冻在半山腰了。',
    ],
  },
  // 章 3 · 熔火死翼（熔岩深渊）
  {
    bossName: '熔火死翼',
    lines: [
      '连我翅膀扇起的风，都比你的剑锋更烫。',
      '灰烬，是你在这世上留下的最后体温。',
      '火焰之灵笑了——区区凡夫，也敢妄谈屠龙？',
    ],
  },
  // 章 4 · 暗影之王（暗影要塞）
  {
    bossName: '暗影之王',
    lines: [
      '阴影吞噬了你的名字，连哀悼者也记不得。',
      '你以为自己在前进——其实一直在我的掌心里打转。',
      '下一个勇者会踩着你的骨头走上来，然后重复这一切。',
    ],
  },
  // 章 5 · 永恒主宰（永恒之巅）
  {
    bossName: '永恒主宰',
    lines: [
      '永恒面前，你不过是一次短促的心跳。',
      '时光长河多你一个幽魂，少你一个幽魂，都掀不起波澜。',
      '我见过千万个像你这样的人。他们的名字，我一个也记不得。',
    ],
  },
];

/** 根据章节（1-5）取一条随机嘲讽台词 + BOSS 名 */
export function pickChapterDeathMock(chapter: number): { bossName: string; line: string } {
  const idx = Math.max(0, Math.min(4, (chapter || 1) - 1));
  const entry = CHAPTER_DEATH_MOCKS[idx] || CHAPTER_DEATH_MOCKS[0];
  const line = entry.lines[Math.floor(Math.random() * entry.lines.length)];
  return { bossName: entry.bossName, line };
}
