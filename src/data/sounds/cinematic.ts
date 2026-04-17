// [RULES-B4-EXEMPT] 音效生成子模块：过场/剧情类音效
// 拆分自 data/soundEffects.ts，职责单一：只负责过场剧情音效波形生成

/**
 * 胜利凯旋音效
 */
export const playVictorySound = (ctx: AudioContext, now: number, master: GainNode, _masterVol: number) => {
  // 胜利凯旋
  [523, 659, 784, 1047].forEach((f, i) => {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sine';
    o.frequency.value = f;
    g.gain.setValueAtTime(0.25, now + i * 0.12);
    g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.5);
    o.connect(g); g.connect(master);
    o.start(now + i * 0.12); o.stop(now + i * 0.12 + 0.5);
  });
};

/**
 * 失败沉重感音效
 */
export const playDefeatSound = (ctx: AudioContext, now: number, master: GainNode, _masterVol: number) => {
  // 失败的沉重感
  [200, 150, 100, 60].forEach((f, i) => {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sawtooth';
    o.frequency.value = f;
    g.gain.setValueAtTime(0.28, now + i * 0.2);
    g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.2 + 0.6);
    o.connect(g); g.connect(master);
    o.start(now + i * 0.2); o.stop(now + i * 0.2 + 0.6);
  });
};

/**
 * Boss出场音效 — 沉重震撼地鸣+不祥高频泛音
 */
export const playBossAppearSound = (ctx: AudioContext, now: number, master: GainNode, masterVol: number) => {
  // Boss出场 — 沉重震撼地鸣+不祥和弦
  [50, 60, 75, 50, 65].forEach((f, i) => {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    const bf = ctx.createBiquadFilter();
    o.type = 'sawtooth';
    o.frequency.value = f;
    bf.type = 'lowpass'; bf.frequency.value = 200; bf.Q.value = 2;
    g.gain.setValueAtTime(0.3 * masterVol, now + i * 0.3);
    g.gain.linearRampToValueAtTime(0.35 * masterVol, now + i * 0.3 + 0.1);
    g.gain.exponentialRampToValueAtTime(0.01, now + i * 0.3 + 0.6);
    o.connect(bf); bf.connect(g); g.connect(master);
    o.start(now + i * 0.3); o.stop(now + i * 0.3 + 0.65);
  });
  // 不祥高频泛音
  const ominous = ctx.createOscillator();
  const og = ctx.createGain();
  ominous.type = 'sine';
  ominous.frequency.setValueAtTime(200, now + 0.5);
  ominous.frequency.linearRampToValueAtTime(150, now + 2.0);
  og.gain.setValueAtTime(0.12 * masterVol, now + 0.5);
  og.gain.exponentialRampToValueAtTime(0.01, now + 2.2);
  ominous.connect(og); og.connect(master);
  ominous.start(now + 0.5); ominous.stop(now + 2.3);
};

/**
 * 敌人死亡音效 — 4层: 爆裂/骨碎/灵魂/坠地
 */
export const playEnemyDeathSound = (ctx: AudioContext, now: number, master: GainNode, masterVol: number) => {
  // 敌人死亡 — 沉重爆裂+骨碎飞散+灵魂消散+坠地
  // Layer 1: 低频爆裂冲击
  const deathBoom = ctx.createOscillator();
  const dbg = ctx.createGain();
  const dbf = ctx.createBiquadFilter();
  deathBoom.type = 'sawtooth';
  deathBoom.frequency.setValueAtTime(140, now);
  deathBoom.frequency.exponentialRampToValueAtTime(18, now + 0.5);
  dbf.type = 'lowpass'; dbf.frequency.value = 300; dbf.Q.value = 2;
  dbg.gain.setValueAtTime(0.35 * masterVol, now);
  dbg.gain.linearRampToValueAtTime(0.4 * masterVol, now + 0.05);
  dbg.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
  deathBoom.connect(dbf); dbf.connect(dbg); dbg.connect(master);
  deathBoom.start(now); deathBoom.stop(now + 0.65);

  // Layer 2: 骨碎飞散（8个高频碎片粒子）
  for (let i = 0; i < 8; i++) {
    const shard = ctx.createOscillator();
    const sg = ctx.createGain();
    const sf = ctx.createBiquadFilter();
    shard.type = 'square';
    const t = now + 0.02 + i * 0.04;
    shard.frequency.setValueAtTime(400 + Math.random() * 600, t);
    shard.frequency.exponentialRampToValueAtTime(40 + Math.random() * 60, t + 0.15);
    sf.type = 'highpass'; sf.frequency.value = 200;
    sg.gain.setValueAtTime(0.12 * masterVol, t);
    sg.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
    shard.connect(sf); sf.connect(sg); sg.connect(master);
    shard.start(t); shard.stop(t + 0.2);
  }

  // Layer 3: 灵魂消散下行音（幽灵般的下滑）
  const fade = ctx.createOscillator();
  const fg = ctx.createGain();
  const ff = ctx.createBiquadFilter();
  fade.type = 'sine';
  fade.frequency.setValueAtTime(500, now + 0.15);
  fade.frequency.exponentialRampToValueAtTime(40, now + 0.9);
  ff.type = 'bandpass'; ff.frequency.value = 300; ff.Q.value = 1;
  fg.gain.setValueAtTime(0.18 * masterVol, now + 0.15);
  fg.gain.exponentialRampToValueAtTime(0.001, now + 0.95);
  fade.connect(ff); ff.connect(fg); fg.connect(master);
  fade.start(now + 0.15); fade.stop(now + 1.0);

  // Layer 4: 坠地撞击（延迟的低频闷响）
  const thud = ctx.createOscillator();
  const tg = ctx.createGain();
  thud.type = 'sine';
  thud.frequency.setValueAtTime(65, now + 0.4);
  thud.frequency.exponentialRampToValueAtTime(25, now + 0.7);
  tg.gain.setValueAtTime(0.25 * masterVol, now + 0.4);
  tg.gain.exponentialRampToValueAtTime(0.001, now + 0.75);
  thud.connect(tg); tg.connect(master);
  thud.start(now + 0.4); thud.stop(now + 0.8);
};

/**
 * 玩家死亡音效 — 3层: 心跳/不和谐/回响
 */
export const playPlayerDeathSound = (ctx: AudioContext, now: number, master: GainNode, _masterVol: number) => {
  // 玩家死亡 — 沉重心跳渐停+不和谐下行+回响消散
  // Layer 1: 心跳渐停（两次低频脉冲，第二次更弱更慢）
  [0, 0.3].forEach((t, i) => {
    const beat = ctx.createOscillator();
    const bg = ctx.createGain();
    beat.type = 'sine';
    beat.frequency.setValueAtTime(50, now + t);
    beat.frequency.exponentialRampToValueAtTime(25, now + t + 0.15);
    bg.gain.setValueAtTime(0.35 * (1 - i * 0.4), now + t);
    bg.gain.exponentialRampToValueAtTime(0.001, now + t + 0.2);
    beat.connect(bg); bg.connect(master);
    beat.start(now + t); beat.stop(now + t + 0.2);
  });
  // Layer 2: 不和谐下行和弦（小二度+减五度）
  [293, 277, 207].forEach((f, i) => {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(f, now + 0.5);
    o.frequency.exponentialRampToValueAtTime(f * 0.4, now + 1.2);
    g.gain.setValueAtTime(0.14, now + 0.5 + i * 0.05);
    g.gain.exponentialRampToValueAtTime(0.001, now + 1.3);
    o.connect(g); g.connect(master);
    o.start(now + 0.5 + i * 0.05); o.stop(now + 1.3);
  });
  // Layer 3: 最后一声低沉回响
  const echo = ctx.createOscillator();
  const eg = ctx.createGain();
  echo.type = 'triangle';
  echo.frequency.setValueAtTime(80, now + 1.0);
  echo.frequency.exponentialRampToValueAtTime(30, now + 2.0);
  eg.gain.setValueAtTime(0.18, now + 1.0);
  eg.gain.exponentialRampToValueAtTime(0.001, now + 2.0);
  echo.connect(eg); eg.connect(master);
  echo.start(now + 1.0); echo.stop(now + 2.0);
};

/**
 * Boss狂笑音效 — 低沉递升+颤音+低频共鸣
 */
export const playBossLaughSound = (ctx: AudioContext, now: number, master: GainNode, masterVol: number) => {
  // Boss狂笑 — 低沉递升，10段笑声+颤音+回响
  const laughNotes = [100, 120, 110, 135, 125, 150, 140, 165, 155, 180];
  const noteDur = 0.15;
  const noteGap = 0.16;
  laughNotes.forEach((f, i) => {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    o.type = 'sawtooth';
    const t = now + i * noteGap;
    o.frequency.setValueAtTime(f, t);
    o.frequency.linearRampToValueAtTime(f * 0.65, t + noteDur);
    // 颤音
    const vibrato = ctx.createOscillator();
    const vibratoG = ctx.createGain();
    vibrato.frequency.value = 8 + i;
    vibratoG.gain.value = 12;
    vibrato.connect(vibratoG); vibratoG.connect(o.frequency);
    vibrato.start(t); vibrato.stop(t + noteDur + 0.01);
    filter.type = 'bandpass';
    filter.frequency.value = 350 + i * 40;
    filter.Q.value = 4;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.28 * masterVol, t + 0.015);
    g.gain.setValueAtTime(0.25 * masterVol, t + noteDur * 0.6);
    g.gain.exponentialRampToValueAtTime(0.01, t + noteDur);
    o.connect(filter); filter.connect(g); g.connect(master);
    o.start(t); o.stop(t + noteDur + 0.01);
  });
  // 低频共鸣
  const bRumble = ctx.createOscillator();
  const bRumbleG = ctx.createGain();
  bRumble.type = 'sine'; bRumble.frequency.value = 55;
  bRumbleG.gain.setValueAtTime(0.15 * masterVol, now);
  bRumbleG.gain.linearRampToValueAtTime(0.2 * masterVol, now + 0.8);
  bRumbleG.gain.exponentialRampToValueAtTime(0.001, now + laughNotes.length * noteGap + 0.3);
  bRumble.connect(bRumbleG); bRumbleG.connect(master);
  bRumble.start(now); bRumble.stop(now + laughNotes.length * noteGap + 0.35);
};

/**
 * 沉重石门关闭音效 — 3层: 低频隆隆+金属撞击+回响
 */
export const playGateCloseSound = (ctx: AudioContext, now: number, master: GainNode, masterVol: number) => {
  // 沉重石门关闭 — 低频隆隆声+金属撞击+回响
  const rumble = ctx.createOscillator();
  const rg = ctx.createGain();
  const rf = ctx.createBiquadFilter();
  rumble.type = 'sawtooth';
  rumble.frequency.setValueAtTime(60, now);
  rumble.frequency.linearRampToValueAtTime(35, now + 0.8);
  rf.type = 'lowpass'; rf.frequency.value = 200; rf.Q.value = 2;
  rg.gain.setValueAtTime(0.15 * masterVol, now);
  rg.gain.linearRampToValueAtTime(0.2 * masterVol, now + 0.3);
  rg.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
  rumble.connect(rf); rf.connect(rg); rg.connect(master);
  rumble.connect(rf); rf.connect(rg); rg.connect(master);
  rumble.start(now); rumble.stop(now + 1.2);
  // 撞击声
  const impact = ctx.createOscillator();
  const ig = ctx.createGain();
  impact.type = 'square';
  impact.frequency.setValueAtTime(90, now + 0.6);
  impact.frequency.exponentialRampToValueAtTime(30, now + 1.0);
  ig.gain.setValueAtTime(0.2 * masterVol, now + 0.6);
  ig.gain.exponentialRampToValueAtTime(0.001, now + 1.0);
  impact.connect(ig); ig.connect(master);
  impact.start(now + 0.6); impact.stop(now + 1.0);
  // 回响
  const echo = ctx.createOscillator();
  const eg = ctx.createGain();
  echo.type = 'sine';
  echo.frequency.value = 45;
  eg.gain.setValueAtTime(0.08 * masterVol, now + 0.8);
  eg.gain.exponentialRampToValueAtTime(0.001, now + 2.0);
  echo.connect(eg); eg.connect(master);
  echo.start(now + 0.8); echo.stop(now + 2.0);
};

/**
 * 敌人说话音效 — 低沉咕噜声，6个音节
 */
export const playEnemySpeakSound = (ctx: AudioContext, now: number, master: GainNode, masterVol: number) => {
  // 敌人说话 — 低沉咕噜声，6个音节，更长更响
  const vowels = [160, 200, 140, 220, 170, 190];
  const syllableDur = 0.12;
  const syllableGap = 0.14;
  vowels.forEach((f, i) => {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    o.type = 'sawtooth';
    const t = now + i * syllableGap;
    o.frequency.setValueAtTime(f + Math.random() * 30, t);
    o.frequency.linearRampToValueAtTime(f - 30 + Math.random() * 20, t + syllableDur);
    filter.type = 'bandpass';
    filter.frequency.value = 500 + Math.random() * 500;
    filter.Q.value = 3;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.3 * masterVol, t + 0.01);
    g.gain.setValueAtTime(0.3 * masterVol, t + syllableDur * 0.5);
    g.gain.exponentialRampToValueAtTime(0.01, t + syllableDur);
    o.connect(filter); filter.connect(g); g.connect(master);
    o.start(t); o.stop(t + syllableDur + 0.01);
  });
  // 低频底噪增加厚度
  const rumbleO = ctx.createOscillator();
  const rumbleG = ctx.createGain();
  rumbleO.type = 'sine'; rumbleO.frequency.value = 80;
  rumbleG.gain.setValueAtTime(0.1 * masterVol, now);
  rumbleG.gain.linearRampToValueAtTime(0.15 * masterVol, now + 0.3);
  rumbleG.gain.exponentialRampToValueAtTime(0.001, now + vowels.length * syllableGap + 0.1);
  rumbleO.connect(rumbleG); rumbleG.connect(master);
  rumbleO.start(now); rumbleO.stop(now + vowels.length * syllableGap + 0.15);
};
