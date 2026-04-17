// [RULES-B4-EXEMPT] 纯音效数据/生成代码入口：类型定义 + 路由分发
// 拆分自 utils/sound.ts，职责单一：只负责音效生成入口路由，不管理播放器状态

import { getCtx, createMasterGain, isSfxEnabled, getMasterVolume } from '../engine/soundPlayer';

// 子模块
import {
  playHitSound, playCriticalSound, playArmorSound, playShieldBreakSound,
  playEnemySound, playPlayerAttackSound, playPlayerAoeSound,
  playEnemyDefendSound, playEnemySkillSound, playSkillSound,
} from './sounds/combat';
import {
  playHealSound, playPoisonSound, playBurnSound, playEnemyHealSound,
} from './sounds/status';
import {
  playRollSound, playSelectSound, playDiceLockSound, playRerollSound,
  playCoinSound, playShopBuySound, playMapMoveSound, playCampfireSound,
  playEventSound, playTurnEndSound, playRelicActivateSound, playLevelupSound,
} from './sounds/ui';
import {
  playVictorySound, playDefeatSound, playBossAppearSound,
  playEnemyDeathSound, playPlayerDeathSound, playBossLaughSound,
  playGateCloseSound, playEnemySpeakSound,
} from './sounds/cinematic';

export type SoundType =
  | 'roll' | 'select' | 'hit' | 'armor' | 'heal' | 'enemy'
  | 'victory' | 'defeat' | 'skill' | 'coin' | 'levelup'
  | 'critical' | 'poison' | 'burn' | 'shield_break' | 'reroll'
  | 'map_move' | 'shop_buy' | 'campfire' | 'event' | 'boss_appear'
  | 'dice_lock' | 'relic_activate' | 'turn_end'
  | 'enemy_defend' | 'enemy_skill' | 'enemy_heal' | 'player_attack' | 'player_aoe'
  | 'enemy_death' | 'player_death' | 'enemy_speak' | 'boss_laugh' | 'gate_close';

/**
 * 递进音调结算音效 - 每颗骰子计分时音调升半阶
 * @param step 当前骰子序号(0-based)，决定音高
 */
export const playSettlementTick = (step: number) => {
  if (!isSfxEnabled()) return;
  try {
    const ctx = getCtx();
    const now = ctx.currentTime;
    const master = createMasterGain(ctx);

    // C5起步，每步升半音 (半音比 = 2^(1/12))
    const baseFreq = 523.25; // C5
    const freq = baseFreq * Math.pow(2, step / 12);
    const harmFreq = freq * 1.5; // 五度泛音

    // 主音
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.2, now + 0.06);
    g.gain.setValueAtTime(0.28, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    osc.connect(g); g.connect(master);
    osc.start(now); osc.stop(now + 0.12);

    // 泛音层（清脆感）
    const osc2 = ctx.createOscillator();
    const g2 = ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.value = harmFreq;
    g2.gain.setValueAtTime(0.14, now);
    g2.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    osc2.connect(g2); g2.connect(master);
    osc2.start(now); osc2.stop(now + 0.08);

    // 金币碰撞感（高频点击）
    const click = ctx.createOscillator();
    const cg = ctx.createGain();
    click.type = 'square';
    click.frequency.value = freq * 3;
    cg.gain.setValueAtTime(0.08, now);
    cg.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
    click.connect(cg); cg.connect(master);
    click.start(now); click.stop(now + 0.03);
  } catch (e) { /* silent */ }
};

/**
 * 乘区触发音效 - 比普通tick更有力度的"倍率叠加"感
 * @param step 当前效果序号
 */
export const playMultiplierTick = (step: number) => {
  if (!isSfxEnabled()) return;
  try {
    const ctx = getCtx();
    const now = ctx.currentTime;
    const master = createMasterGain(ctx);

    const baseFreq = 392; // G4
    const freq = baseFreq * Math.pow(2, step / 8); // 更大步进

    // 力量感低音
    const bass = ctx.createOscillator();
    const bg = ctx.createGain();
    bass.type = 'sawtooth';
    bass.frequency.setValueAtTime(freq * 0.5, now);
    bass.frequency.exponentialRampToValueAtTime(freq * 0.3, now + 0.15);
    bg.gain.setValueAtTime(0.2, now);
    bg.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    bass.connect(bg); bg.connect(master);
    bass.start(now); bass.stop(now + 0.2);

    // 高亮音
    const hi = ctx.createOscillator();
    const hg = ctx.createGain();
    hi.type = 'sine';
    hi.frequency.setValueAtTime(freq * 2, now);
    hi.frequency.exponentialRampToValueAtTime(freq * 2.5, now + 0.1);
    hg.gain.setValueAtTime(0.22, now);
    hg.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    hi.connect(hg); hg.connect(master);
    hi.start(now); hi.stop(now + 0.12);
  } catch (e) { /* silent */ }
};

/**
 * 大伤害重击音效 - 用于卡肉顿帧时播放
 * @param intensity 0-1 伤害强度
 */
export const playHeavyImpact = (intensity: number = 1) => {
  if (!isSfxEnabled()) return;
  try {
    const ctx = getCtx();
    const now = ctx.currentTime;
    const masterVol = getMasterVolume();
    const master = ctx.createGain();
    master.gain.value = masterVol * Math.min(1, 0.7 + intensity * 0.3);
    master.connect(ctx.destination);

    // 超低频冲击
    const sub = ctx.createOscillator();
    const sg = ctx.createGain();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(60, now);
    sub.frequency.exponentialRampToValueAtTime(20, now + 0.4);
    sg.gain.setValueAtTime(0.3, now);
    sg.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    sub.connect(sg); sg.connect(master);
    sub.start(now); sub.stop(now + 0.5);

    // 金属撞击
    [80, 160, 320].forEach((f, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = i === 0 ? 'sawtooth' : 'square';
      o.frequency.setValueAtTime(f, now);
      o.frequency.exponentialRampToValueAtTime(f * 0.2, now + 0.35);
      g.gain.setValueAtTime(0.2, now + i * 0.015);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      o.connect(g); g.connect(master);
      o.start(now + i * 0.015); o.stop(now + 0.4);
    });

    // 碎裂高频
    const crack = ctx.createOscillator();
    const cg = ctx.createGain();
    crack.type = 'sawtooth';
    crack.frequency.setValueAtTime(2000, now + 0.05);
    crack.frequency.exponentialRampToValueAtTime(200, now + 0.15);
    cg.gain.setValueAtTime(0.1 * intensity, now + 0.05);
    cg.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    crack.connect(cg); cg.connect(master);
    crack.start(now + 0.05); crack.stop(now + 0.2);
  } catch (e) { /* silent */ }
};

// playSound 薄路由 — 仅负责类型分发，音效逻辑在各子模块
export const playSound = (type: SoundType) => {
  if (!isSfxEnabled()) return;

  try {
    const ctx = getCtx();
    const now = ctx.currentTime;
    const masterVol = getMasterVolume();
    const master = ctx.createGain();
    master.gain.value = masterVol;
    master.connect(ctx.destination);

    switch (type) {
      // — UI交互 —
      case 'roll': return playRollSound(ctx, now, master, masterVol);
      case 'select': return playSelectSound(ctx, now, master, masterVol);
      case 'dice_lock': return playDiceLockSound(ctx, now, master, masterVol);
      case 'reroll': return playRerollSound(ctx, now, master, masterVol);
      case 'coin': return playCoinSound(ctx, now, master, masterVol);
      case 'shop_buy': return playShopBuySound(ctx, now, master, masterVol);
      case 'map_move': return playMapMoveSound(ctx, now, master, masterVol);
      case 'campfire': return playCampfireSound(ctx, now, master, masterVol);
      case 'event': return playEventSound(ctx, now, master, masterVol);
      case 'turn_end': return playTurnEndSound(ctx, now, master, masterVol);
      case 'relic_activate': return playRelicActivateSound(ctx, now, master, masterVol);
      case 'levelup': return playLevelupSound(ctx, now, master, masterVol);
      // — 战斗 —
      case 'hit': return playHitSound(ctx, now, master, masterVol);
      case 'critical': return playCriticalSound(ctx, now, master, masterVol);
      case 'armor': return playArmorSound(ctx, now, master, masterVol);
      case 'shield_break': return playShieldBreakSound(ctx, now, master, masterVol);
      case 'skill': return playSkillSound(ctx, now, master, masterVol);
      case 'enemy': return playEnemySound(ctx, now, master, masterVol);
      case 'player_attack': return playPlayerAttackSound(ctx, now, master, masterVol);
      case 'player_aoe': return playPlayerAoeSound(ctx, now, master, masterVol);
      case 'enemy_defend': return playEnemyDefendSound(ctx, now, master, masterVol);
      case 'enemy_skill': return playEnemySkillSound(ctx, now, master, masterVol);
      // — 状态/持续效果 —
      case 'heal': return playHealSound(ctx, now, master, masterVol);
      case 'poison': return playPoisonSound(ctx, now, master, masterVol);
      case 'burn': return playBurnSound(ctx, now, master, masterVol);
      case 'enemy_heal': return playEnemyHealSound(ctx, now, master, masterVol);
      // — 过场/剧情 —
      case 'victory': return playVictorySound(ctx, now, master, masterVol);
      case 'defeat': return playDefeatSound(ctx, now, master, masterVol);
      case 'boss_appear': return playBossAppearSound(ctx, now, master, masterVol);
      case 'enemy_death': return playEnemyDeathSound(ctx, now, master, masterVol);
      case 'player_death': return playPlayerDeathSound(ctx, now, master, masterVol);
      case 'boss_laugh': return playBossLaughSound(ctx, now, master, masterVol);
      case 'gate_close': return playGateCloseSound(ctx, now, master, masterVol);
      case 'enemy_speak': return playEnemySpeakSound(ctx, now, master, masterVol);
    }
  } catch (e) {
    console.error('Audio error:', e);
  }
};
