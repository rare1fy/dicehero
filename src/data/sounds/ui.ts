// [RULES-B4-EXEMPT] 音效生成子模块：UI交互类音效
// 拆分自 data/soundEffects.ts，职责单一：只负责UI交互音效波形生成

/**
 * 骰子滚动音效 — 多音层+noise碰撞感
 */
export const playRollSound = (ctx: AudioContext, now: number, master: GainNode, _masterVol: number) => {
  // 多音层骰子滚动音效
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  const noise = ctx.createOscillator();
  const ng = ctx.createGain();

  osc.type = 'square';
  osc.frequency.setValueAtTime(200, now);
  osc.frequency.exponentialRampToValueAtTime(60, now + 0.15);
  g.gain.setValueAtTime(0.16, now);
  g.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
  osc.connect(g); g.connect(master);
  osc.start(now); osc.stop(now + 0.15);

  // 添加碰撞感
  noise.type = 'sawtooth';
  noise.frequency.setValueAtTime(800, now);
  noise.frequency.exponentialRampToValueAtTime(100, now + 0.08);
  ng.gain.setValueAtTime(0.08, now);
  ng.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
  noise.connect(ng); ng.connect(master);
  noise.start(now); noise.stop(now + 0.08);
};

/**
 * 选择音效 — 清脆上行
 */
export const playSelectSound = (ctx: AudioContext, now: number, master: GainNode, _masterVol: number) => {
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(523, now); // C5
  osc.frequency.exponentialRampToValueAtTime(784, now + 0.06); // G5
  g.gain.setValueAtTime(0.22, now);
  g.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
  osc.connect(g); g.connect(master);
  osc.start(now); osc.stop(now + 0.08);
};

/**
 * 骰子锁定音效 — 清脆双音
 */
export const playDiceLockSound = (ctx: AudioContext, now: number, master: GainNode, _masterVol: number) => {
  // 骰子锁定（选中）的清脆声
  [659, 880].forEach((f, i) => {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sine';
    o.frequency.value = f;
    g.gain.setValueAtTime(0.2, now + i * 0.05);
    g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.05 + 0.1);
    o.connect(g); g.connect(master);
    o.start(now + i * 0.05); o.stop(now + i * 0.05 + 0.1);
  });
};

/**
 * 重骰音效 — 骰子翻滚
 */
export const playRerollSound = (ctx: AudioContext, now: number, master: GainNode, _masterVol: number) => {
  // 重骰音效 — 骰子翻滚
  for (let i = 0; i < 5; i++) {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'square';
    o.frequency.value = 150 + Math.random() * 200;
    g.gain.setValueAtTime(0.18, now + i * 0.03);
    g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.03 + 0.05);
    o.connect(g); g.connect(master);
    o.start(now + i * 0.03); o.stop(now + i * 0.03 + 0.05);
  }
};

/**
 * 金币叮当声
 */
export const playCoinSound = (ctx: AudioContext, now: number, master: GainNode, _masterVol: number) => {
  // 金币叮当声
  [1047, 1319, 1568].forEach((f, i) => {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sine';
    o.frequency.value = f;
    g.gain.setValueAtTime(0.18, now + i * 0.06);
    g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.15);
    o.connect(g); g.connect(master);
    o.start(now + i * 0.06); o.stop(now + i * 0.06 + 0.15);
  });
};

/**
 * 购买音效 — 收银机感
 */
export const playShopBuySound = (ctx: AudioContext, now: number, master: GainNode, _masterVol: number) => {
  // 购买音效 — 收银机感
  [880, 1047, 1319].forEach((f, i) => {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sine';
    o.frequency.value = f;
    g.gain.setValueAtTime(0.2, now + i * 0.07);
    g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.07 + 0.15);
    o.connect(g); g.connect(master);
    o.start(now + i * 0.07); o.stop(now + i * 0.07 + 0.15);
  });
};

/**
 * 地图移动音效
 */
export const playMapMoveSound = (ctx: AudioContext, now: number, master: GainNode, _masterVol: number) => {
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(392, now);
  osc.frequency.exponentialRampToValueAtTime(523, now + 0.08);
  g.gain.setValueAtTime(0.2, now);
  g.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
  osc.connect(g); g.connect(master);
  osc.start(now); osc.stop(now + 0.1);
};

/**
 * 篝火噼啪声
 */
export const playCampfireSound = (ctx: AudioContext, now: number, master: GainNode, _masterVol: number) => {
  // 篝火噼啪声
  for (let i = 0; i < 3; i++) {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sawtooth';
    o.frequency.value = 100 + Math.random() * 100;
    g.gain.setValueAtTime(0.12, now + i * 0.1 + Math.random() * 0.05);
    g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.15);
    o.connect(g); g.connect(master);
    o.start(now + i * 0.1); o.stop(now + i * 0.1 + 0.15);
  }
};

/**
 * 神秘事件音效
 */
export const playEventSound = (ctx: AudioContext, now: number, master: GainNode, _masterVol: number) => {
  // 神秘事件音效
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(330, now);
  osc.frequency.exponentialRampToValueAtTime(440, now + 0.2);
  osc.frequency.exponentialRampToValueAtTime(330, now + 0.4);
  g.gain.setValueAtTime(0.22, now);
  g.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
  osc.connect(g); g.connect(master);
  osc.start(now); osc.stop(now + 0.5);
};

/**
 * 回合结束音效
 */
export const playTurnEndSound = (ctx: AudioContext, now: number, master: GainNode, _masterVol: number) => {
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(440, now);
  osc.frequency.exponentialRampToValueAtTime(220, now + 0.2);
  g.gain.setValueAtTime(0.2, now);
  g.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
  osc.connect(g); g.connect(master);
  osc.start(now); osc.stop(now + 0.25);
};

/**
 * 遗物激活音效
 */
export const playRelicActivateSound = (ctx: AudioContext, now: number, master: GainNode, _masterVol: number) => {
  // 遗物激活
  [659, 784, 988].forEach((f, i) => {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sine';
    o.frequency.value = f;
    g.gain.setValueAtTime(0.2, now + i * 0.04);
    g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.04 + 0.12);
    o.connect(g); g.connect(master);
    o.start(now + i * 0.04); o.stop(now + i * 0.04 + 0.12);
  });
};

/**
 * 升级音效 — 辉煌感上行琶音
 */
export const playLevelupSound = (ctx: AudioContext, now: number, master: GainNode, _masterVol: number) => {
  // 升级的辉煌感
  [440, 554, 659, 880].forEach((f, i) => {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sine';
    o.frequency.value = f;
    g.gain.setValueAtTime(0.24, now + i * 0.1);
    g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.4);
    o.connect(g); g.connect(master);
    o.start(now + i * 0.1); o.stop(now + i * 0.1 + 0.4);
  });
};
