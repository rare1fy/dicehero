// [RULES-B4-EXEMPT] 音效生成子模块：状态/持续效果类音效
// 拆分自 data/soundEffects.ts，职责单一：只负责状态效果音效波形生成

/**
 * 治疗音效 — 温暖的上行琶音
 */
export const playHealSound = (ctx: AudioContext, now: number, master: GainNode, _masterVol: number) => {
  // 温暖的治疗音效
  [523, 659, 784].forEach((f, i) => {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sine';
    o.frequency.value = f;
    g.gain.setValueAtTime(0.22, now + i * 0.08);
    g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.3);
    o.connect(g); g.connect(master);
    o.start(now + i * 0.08); o.stop(now + i * 0.08 + 0.3);
  });
};

/**
 * 中毒音效 — 毒液滴落感
 */
export const playPoisonSound = (ctx: AudioContext, now: number, master: GainNode, _masterVol: number) => {
  // 毒液滴落感
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(800, now);
  osc.frequency.exponentialRampToValueAtTime(200, now + 0.15);
  g.gain.setValueAtTime(0.22, now);
  g.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
  osc.connect(g); g.connect(master);
  osc.start(now); osc.stop(now + 0.2);
};

/**
 * 灼烧音效 — 火焰噼啪声
 */
export const playBurnSound = (ctx: AudioContext, now: number, master: GainNode, _masterVol: number) => {
  // 火焰噼啪声
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(400, now);
  osc.frequency.exponentialRampToValueAtTime(100, now + 0.2);
  g.gain.setValueAtTime(0.25, now);
  g.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
  osc.connect(g); g.connect(master);
  osc.start(now); osc.stop(now + 0.25);
};

/**
 * 敌人治疗音效 — 低沉上行琶音+回响
 */
export const playEnemyHealSound = (ctx: AudioContext, now: number, master: GainNode, masterVol: number) => {
  // 敌人治疗 — 低沉上行琶音+回响
  [220, 277, 330, 392].forEach((f, i) => {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sine';
    o.frequency.value = f;
    const t = now + i * 0.12;
    g.gain.setValueAtTime(0.18 * masterVol, t);
    g.gain.linearRampToValueAtTime(0.2 * masterVol, t + 0.04);
    g.gain.exponentialRampToValueAtTime(0.01, t + 0.35);
    o.connect(g); g.connect(master);
    o.start(t); o.stop(t + 0.38);
  });
  // 低频温暖底色
  const warm = ctx.createOscillator();
  const wg = ctx.createGain();
  warm.type = 'sine'; warm.frequency.value = 110;
  wg.gain.setValueAtTime(0.12 * masterVol, now);
  wg.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
  warm.connect(wg); wg.connect(master);
  warm.start(now); warm.stop(now + 0.65);
};
