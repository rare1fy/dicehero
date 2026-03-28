import { MapNode, Enemy, GameState } from '../types';

export const getEnemyForNode = (node: MapNode, depth: number, hpMultiplier: number = 1.0): Enemy => {
  const hpScale = (1 + depth * 0.25) * hpMultiplier;
  const dmgScale = 1 + depth * 0.12;

  if (node.type === 'boss') {
    return getBossForDepth(depth, hpScale, dmgScale);
  }

  if (node.type === 'elite') {
    const elites = [
      {
        name: '混沌聚合体', emoji: '🌀', hp: 80, dmg: 7,
        pattern: (t: number, self: Enemy) => {
          if (self.hp < self.maxHp * 0.4) return { type: '攻击' as const, value: Math.floor(18 * dmgScale), description: '混沌爆发' };
          const cycle = t % 3;
          if (cycle === 1) return { type: '攻击' as const, value: Math.floor(7 * dmgScale) };
          if (cycle === 2) return { type: '技能' as const, value: 2, description: '力量' };
          return { type: '攻击' as const, value: Math.floor(10 * dmgScale) };
        }
      },
      {
        name: '虚空典狱长', emoji: '⛓️', hp: 100, dmg: 5,
        pattern: (t: number) => {
          const cycle = t % 3;
          if (cycle === 1) return { type: '防御' as const, value: Math.floor(15 * dmgScale) };
          if (cycle === 2) return { type: '攻击' as const, value: Math.floor(12 * dmgScale), description: '处决' };
          return { type: '技能' as const, value: 2, description: '易伤' };
        }
      },
      // === 新增精英怪 ===
      {
        name: '深渊预言家', emoji: '🔮', hp: 90, dmg: 6,
        pattern: (t: number, self: Enemy) => {
          // 低血量时疯狂施法
          if (self.hp < self.maxHp * 0.3) {
            return t % 2 === 1
              ? { type: '技能' as const, value: 3, description: '剧毒' }
              : { type: '技能' as const, value: 3, description: '灼烧' };
          }
          const cycle = t % 4;
          if (cycle === 1) return { type: '技能' as const, value: 2, description: '虚弱' };
          if (cycle === 2) return { type: '攻击' as const, value: Math.floor(8 * dmgScale) };
          if (cycle === 3) return { type: '技能' as const, value: 2, description: '剧毒' };
          return { type: '防御' as const, value: Math.floor(12 * dmgScale) };
        }
      },
      {
        name: '永恒钟表匠', emoji: '⏰', hp: 70, dmg: 9,
        pattern: (t: number, self: Enemy) => {
          // 每3回合一次大爆发
          if (t % 4 === 0) return { type: '攻击' as const, value: Math.floor(20 * dmgScale), description: '时间崩塌' };
          const cycle = t % 3;
          if (cycle === 1) return { type: '技能' as const, value: 2, description: '力量' };
          if (cycle === 2) return { type: '防御' as const, value: Math.floor(10 * dmgScale) };
          return { type: '攻击' as const, value: Math.floor(9 * dmgScale) };
        }
      },
    ];
    const base = elites[Math.floor(Math.random() * elites.length)];
    return { 
      name: base.name, emoji: base.emoji, hp: Math.floor(base.hp * hpScale), maxHp: Math.floor(base.hp * hpScale), armor: 0, 
      intent: { type: '攻击', value: Math.floor(base.dmg * dmgScale) }, dropGold: 50, dropAugment: true, rerollReward: 2, 
      statuses: [],
      pattern: base.pattern as any
    };
  }

  const enemies = [
    { 
      name: '虚空巡游者', emoji: '👻', hp: 20, dmg: 4, 
      pattern: (t: number) => (t % 3 === 0 ? { type: '技能' as const, value: 2, description: '剧毒' } : { type: '攻击' as const, value: Math.floor(4 * dmgScale) })
    },
    { 
      name: '腐化甲虫', emoji: '🪲', hp: 30, dmg: 3,
      pattern: (t: number) => (t % 2 === 0 ? { type: '防御' as const, value: Math.floor(6 * dmgScale) } : { type: '攻击' as const, value: Math.floor(3 * dmgScale) })
    },
    { 
      name: '猩红异灵', emoji: '🩸', hp: 25, dmg: 5,
      pattern: (t: number) => (t % 3 === 0 ? { type: '技能' as const, value: 1, description: '易伤' } : { type: '攻击' as const, value: Math.floor(5 * dmgScale) })
    },
    { 
      name: '遗忘之影', emoji: '🌑', hp: 15, dmg: 6,
      pattern: (t: number) => (t % 2 === 0 ? { type: '攻击' as const, value: Math.floor(6 * dmgScale) } : { type: '技能' as const, value: 1, description: '虚弱' })
    },
    // === 新增普通敌人 ===
    {
      name: '暗蚀蛾群', emoji: '🦋', hp: 18, dmg: 3,
      pattern: (t: number) => {
        const cycle = t % 4;
        if (cycle === 0) return { type: '技能' as const, value: 2, description: '灼烧' };
        if (cycle === 3) return { type: '技能' as const, value: 1, description: '虚弱' };
        return { type: '攻击' as const, value: Math.floor(3 * dmgScale) };
      }
    },
    {
      name: '裂隙守望者', emoji: '👁️', hp: 35, dmg: 4,
      pattern: (t: number) => {
        const cycle = t % 3;
        if (cycle === 1) return { type: '防御' as const, value: Math.floor(8 * dmgScale) };
        if (cycle === 2) return { type: '攻击' as const, value: Math.floor(7 * dmgScale), description: '裂隙冲击' };
        return { type: '攻击' as const, value: Math.floor(4 * dmgScale) };
      }
    },
    {
      name: '噬魂水母', emoji: '🪼', hp: 22, dmg: 2,
      pattern: (t: number) => {
        if (t % 3 === 0) return { type: '技能' as const, value: 2, description: '剧毒' };
        if (t % 3 === 1) return { type: '技能' as const, value: 1, description: '易伤' };
        return { type: '攻击' as const, value: Math.floor(5 * dmgScale) };
      }
    },
    {
      name: '铁锈傀儡', emoji: '🤖', hp: 40, dmg: 6,
      pattern: (t: number) => {
        const cycle = t % 3;
        if (cycle === 0) return { type: '防御' as const, value: Math.floor(10 * dmgScale) };
        return { type: '攻击' as const, value: Math.floor(6 * dmgScale) };
      }
    },
  ];
  const base = enemies[Math.floor(Math.random() * enemies.length)];
  
  return { 
    name: base.name, 
    emoji: base.emoji,
    hp: Math.floor(base.hp * hpScale), 
    maxHp: Math.floor(base.hp * hpScale), 
    armor: 0, 
    intent: { type: '攻击', value: Math.floor(base.dmg * dmgScale) }, 
    dropGold: 20, 
    dropAugment: true,
    statuses: [],
    pattern: base.pattern as any
  };
};

// === Boss 生成器：支持多Boss ===
const getBossForDepth = (depth: number, hpScale: number, dmgScale: number): Enemy => {
  // 中层Boss（深度7左右）
  if (depth < 12) {
    return {
      name: '虚空织梦者', emoji: '🕸️',
      hp: Math.floor(150 * hpScale), maxHp: Math.floor(150 * hpScale), armor: 0,
      intent: { type: '攻击', value: Math.floor(8 * dmgScale) },
      dropGold: 80, dropAugment: true, rerollReward: 3,
      pattern: (t: number, self: Enemy, player: GameState) => {
        // Phase 2: 低血量狂暴
        if (self.hp < self.maxHp * 0.4) {
          const cycle = t % 3;
          if (cycle === 1) return { type: '攻击' as const, value: Math.floor(15 * dmgScale), description: '梦魇撕裂' };
          if (cycle === 2) return { type: '技能' as const, value: 3, description: '灼烧' };
          return { type: '攻击' as const, value: Math.floor(22 * dmgScale), description: '织梦终焉' };
        }
        // Phase 1: 正常模式 — 施加debuff为主
        const cycle = t % 4;
        if (cycle === 1) return { type: '攻击' as const, value: Math.floor(8 * dmgScale) };
        if (cycle === 2) return { type: '技能' as const, value: 2, description: '虚弱' };
        if (cycle === 3) return { type: '技能' as const, value: 2, description: '易伤' };
        return { type: '防御' as const, value: Math.floor(15 * dmgScale) };
      },
      statuses: []
    };
  }

  // 最终Boss
  return { 
    name: '永夜主宰', emoji: '👑',
    hp: Math.floor(200 * hpScale), maxHp: Math.floor(200 * hpScale), armor: 0,
    intent: { type: '攻击', value: Math.floor(10 * dmgScale) },
    dropGold: 0, dropAugment: false,
    pattern: (t: number, self: Enemy) => {
      // Phase 2: Low HP
      if (self.hp < self.maxHp * 0.5) {
        const cycle = t % 4;
        if (cycle === 1) return { type: '攻击' as const, value: Math.floor(18 * dmgScale) };
        if (cycle === 2) return { type: '技能' as const, value: 3, description: '剧毒' };
        if (cycle === 3) return { type: '防御' as const, value: Math.floor(25 * dmgScale) };
        return { type: '攻击' as const, value: Math.floor(30 * dmgScale), description: '终焉之光' };
      }
      // Phase 1: Normal
      const cycle = t % 3;
      if (cycle === 1) return { type: '攻击' as const, value: Math.floor(10 * dmgScale) };
      if (cycle === 2) return { type: '技能' as const, value: 2, description: '虚弱' };
      if (cycle === 0) return { type: '技能' as const, value: 4, description: '灼烧' };
      return { type: '攻击' as const, value: Math.floor(20 * dmgScale) };
    },
    statuses: []
  };
};
