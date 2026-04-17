// [RULES-B4-EXEMPT] 音效生成子模块：战斗类音效
// 拆分自 data/soundEffects.ts，职责单一：只负责战斗音效波形生成

/**
 * 打击音效 — 多层冲击
 */
export const playHitSound = (ctx: AudioContext, now: number, master: GainNode, _masterVol: number) => {
  // 多层打击音效
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(120, now);
  osc.frequency.exponentialRampToValueAtTime(30, now + 0.2);
  g.gain.setValueAtTime(0.22, now);
  g.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
  osc.connect(g); g.connect(master);
  osc.start(now); osc.stop(now + 0.25);

  // 冲击波层
  const impact = ctx.createOscillator();
  const ig = ctx.createGain();
  impact.type = 'square';
  impact.frequency.setValueAtTime(60, now);
  impact.frequency.exponentialRampToValueAtTime(20, now + 0.1);
  ig.gain.setValueAtTime(0.16, now);
  ig.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
  impact.connect(ig); ig.connect(master);
  impact.start(now); impact.stop(now + 0.15);
};

/**
 * 暴击音效 — 更强烈的多频叠加
 */
export const playCriticalSound = (ctx: AudioContext, now: number, master: GainNode, _masterVol: number) => {
  // 暴击音效 — 更强烈
  [80, 120, 200].forEach((f, i) => {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = i === 2 ? 'square' : 'sawtooth';
    o.frequency.setValueAtTime(f, now);
    o.frequency.exponentialRampToValueAtTime(f * 0.3, now + 0.3);
    g.gain.setValueAtTime(0.25, now + i * 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    o.connect(g); g.connect(master);
    o.start(now + i * 0.02); o.stop(now + 0.35);
  });
};

/**
 * 护甲音效 — 金属弹击感
 */
export const playArmorSound = (ctx: AudioContext, now: number, master: GainNode, _masterVol: number) => {
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(300, now);
  osc.frequency.exponentialRampToValueAtTime(600, now + 0.15);
  g.gain.setValueAtTime(0.25, now);
  g.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
  osc.connect(g); g.connect(master);
  osc.start(now); osc.stop(now + 0.2);
};

/**
 * 护甲破碎音效
 */
export const playShieldBreakSound = (ctx: AudioContext, now: number, master: GainNode, _masterVol: number) => {
  // 护甲破碎
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(600, now);
  osc.frequency.exponentialRampToValueAtTime(50, now + 0.3);
  g.gain.setValueAtTime(0.25, now);
  g.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
  osc.connect(g); g.connect(master);
  osc.start(now); osc.stop(now + 0.3);
};

/**
 * 敌人攻击音效 — 沉重冲击（3层叠加）
 */
export const playEnemySound = (ctx: AudioContext, now: number, master: GainNode, masterVol: number) => {
  // 敌人攻击 — 沉重冲击（多层叠加）
  // 层1: 低频重击
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  const lf = ctx.createBiquadFilter();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(110, now);
  osc.frequency.exponentialRampToValueAtTime(20, now + 0.45);
  lf.type = 'lowpass'; lf.frequency.value = 250;
  g.gain.setValueAtTime(0.4 * masterVol, now);
  g.gain.linearRampToValueAtTime(0.45 * masterVol, now + 0.04);
  g.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
  osc.connect(lf); lf.connect(g); g.connect(master);
  osc.start(now); osc.stop(now + 0.55);

  // 层2: 中频冲击波
  const osc2 = ctx.createOscillator();
  const g2 = ctx.createGain();
  osc2.type = 'square';
  osc2.frequency.setValueAtTime(220, now);
  osc2.frequency.exponentialRampToValueAtTime(45, now + 0.2);
  g2.gain.setValueAtTime(0.3 * masterVol, now);
  g2.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
  osc2.connect(g2); g2.connect(master);
  osc2.start(now); osc2.stop(now + 0.35);

  // 层3: 高频碎裂感
  const osc3 = ctx.createOscillator();
  const g3 = ctx.createGain();
  osc3.type = 'sawtooth';
  osc3.frequency.setValueAtTime(500, now);
  osc3.frequency.exponentialRampToValueAtTime(80, now + 0.12);
  g3.gain.setValueAtTime(0.18 * masterVol, now);
  g3.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
  osc3.connect(g3); g3.connect(master);
  osc3.start(now); osc3.stop(now + 0.18);
};

/**
 * 玩家出牌攻击 — 清脆斩击+冲击波（3层）
 */
export const playPlayerAttackSound = (ctx: AudioContext, now: number, master: GainNode, masterVol: number) => {
  // 玩家出牌攻击 — 清脆斩击+冲击波
  const slash = ctx.createOscillator();
  const sg = ctx.createGain();
  slash.type = 'sawtooth';
  slash.frequency.setValueAtTime(320, now);
  slash.frequency.exponentialRampToValueAtTime(70, now + 0.18);
  sg.gain.setValueAtTime(0.25 * masterVol, now);
  sg.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
  slash.connect(sg); sg.connect(master);
  slash.start(now); slash.stop(now + 0.35);
  // 高频锐利层
  const sharp = ctx.createOscillator();
  const shg = ctx.createGain();
  sharp.type = 'square';
  sharp.frequency.setValueAtTime(900, now);
  sharp.frequency.exponentialRampToValueAtTime(180, now + 0.1);
  shg.gain.setValueAtTime(0.15 * masterVol, now);
  shg.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
  sharp.connect(shg); shg.connect(master);
  sharp.start(now); sharp.stop(now + 0.18);
  // 低频冲击
  const impact = ctx.createOscillator();
  const ig = ctx.createGain();
  impact.type = 'sine';
  impact.frequency.setValueAtTime(65, now + 0.02);
  impact.frequency.exponentialRampToValueAtTime(18, now + 0.2);
  ig.gain.setValueAtTime(0.2 * masterVol, now + 0.02);
  ig.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
  impact.connect(ig); ig.connect(master);
  impact.start(now + 0.02); impact.stop(now + 0.35);
};

/**
 * 玩家AOE攻击 — 横扫冲击波+多层回响（3层）
 */
export const playPlayerAoeSound = (ctx: AudioContext, now: number, master: GainNode, masterVol: number) => {
  // 玩家AOE攻击 — 横扫冲击波+多层回响
  [150, 200, 120, 180].forEach((f, i) => {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sawtooth';
    const t = now + i * 0.06;
    o.frequency.setValueAtTime(f, t);
    o.frequency.exponentialRampToValueAtTime(f * 0.15, t + 0.35);
    g.gain.setValueAtTime(0.22 * masterVol, t);
    g.gain.exponentialRampToValueAtTime(0.01, t + 0.4);
    o.connect(g); g.connect(master);
    o.start(t); o.stop(t + 0.45);
  });
  // 高频横扫
  const sweep = ctx.createOscillator();
  const swg = ctx.createGain();
  sweep.type = 'square';
  sweep.frequency.setValueAtTime(700, now);
  sweep.frequency.exponentialRampToValueAtTime(80, now + 0.25);
  swg.gain.setValueAtTime(0.15 * masterVol, now);
  swg.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
  sweep.connect(swg); swg.connect(master);
  sweep.start(now); sweep.stop(now + 0.35);
  // 低频地面震动
  const ground = ctx.createOscillator();
  const gg = ctx.createGain();
  ground.type = 'sine'; ground.frequency.value = 45;
  gg.gain.setValueAtTime(0.15 * masterVol, now + 0.1);
  gg.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
  ground.connect(gg); gg.connect(master);
  ground.start(now + 0.1); ground.stop(now + 0.55);
};

/**
 * 敌人举盾防御 — 沉闷金属碰撞+盾牌共鸣（3层）
 */
export const playEnemyDefendSound = (ctx: AudioContext, now: number, master: GainNode, masterVol: number) => {
  // 敌人举盾防御 — 沉闷金属碰撞+盾牌共鸣
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  const df = ctx.createBiquadFilter();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(180, now);
  osc.frequency.exponentialRampToValueAtTime(420, now + 0.08);
  osc.frequency.exponentialRampToValueAtTime(280, now + 0.35);
  df.type = 'bandpass'; df.frequency.value = 400; df.Q.value = 3;
  g.gain.setValueAtTime(0.3 * masterVol, now);
  g.gain.linearRampToValueAtTime(0.35 * masterVol, now + 0.05);
  g.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
  osc.connect(df); df.connect(g); g.connect(master);
  osc.start(now); osc.stop(now + 0.55);
  // 金属回响层
  const osc2 = ctx.createOscillator();
  const g2 = ctx.createGain();
  osc2.type = 'sine';
  osc2.frequency.setValueAtTime(700, now + 0.04);
  osc2.frequency.exponentialRampToValueAtTime(300, now + 0.3);
  g2.gain.setValueAtTime(0.15 * masterVol, now + 0.04);
  g2.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
  osc2.connect(g2); g2.connect(master);
  osc2.start(now + 0.04); osc2.stop(now + 0.45);
  // 低频盾牌震动
  const shd = ctx.createOscillator();
  const shg = ctx.createGain();
  shd.type = 'sine'; shd.frequency.value = 70;
  shg.gain.setValueAtTime(0.15 * masterVol, now + 0.06);
  shg.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
  shd.connect(shg); shg.connect(master);
  shd.start(now + 0.06); shd.stop(now + 0.45);
};

/**
 * 敌人施法/技能 — 能量蓄积+释放冲击（3层）
 */
export const playEnemySkillSound = (ctx: AudioContext, now: number, master: GainNode, masterVol: number) => {
  // 敌人施法/技能 — 能量蓄积+释放冲击
  [220, 330, 440, 550, 660].forEach((f, i) => {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sine';
    o.frequency.value = f;
    const t = now + i * 0.07;
    g.gain.setValueAtTime(0.15 * masterVol, t);
    g.gain.exponentialRampToValueAtTime(0.01, t + 0.25);
    o.connect(g); g.connect(master);
    o.start(t); o.stop(t + 0.28);
  });
  // 低频冲击波释放
  const boom = ctx.createOscillator();
  const bg = ctx.createGain();
  const bf = ctx.createBiquadFilter();
  boom.type = 'sawtooth';
  boom.frequency.setValueAtTime(90, now + 0.35);
  boom.frequency.exponentialRampToValueAtTime(25, now + 0.7);
  bf.type = 'lowpass'; bf.frequency.value = 200;
  bg.gain.setValueAtTime(0.25 * masterVol, now + 0.35);
  bg.gain.exponentialRampToValueAtTime(0.01, now + 0.75);
  boom.connect(bf); bf.connect(bg); bg.connect(master);
  boom.start(now + 0.35); boom.stop(now + 0.8);
  // 高频能量回响
  const echo = ctx.createOscillator();
  const eg = ctx.createGain();
  echo.type = 'sine';
  echo.frequency.setValueAtTime(800, now + 0.4);
  echo.frequency.exponentialRampToValueAtTime(200, now + 0.8);
  eg.gain.setValueAtTime(0.1 * masterVol, now + 0.4);
  eg.gain.exponentialRampToValueAtTime(0.01, now + 0.85);
  echo.connect(eg); eg.connect(master);
  echo.start(now + 0.4); echo.stop(now + 0.9);
};

/**
 * 技能释放音效 — 能量上行
 */
export const playSkillSound = (ctx: AudioContext, now: number, master: GainNode, _masterVol: number) => {
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(400, now);
  osc.frequency.exponentialRampToValueAtTime(800, now + 0.3);
  g.gain.setValueAtTime(0.25, now);
  g.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
  osc.connect(g); g.connect(master);
  osc.start(now); osc.stop(now + 0.3);
};
