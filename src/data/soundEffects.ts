// [RULES-B4-EXEMPT] 纯音效数据/生成代码：35种音效的波形生成逻辑，结构一致
// 拆分自 utils/sound.ts，职责单一：只负责音效生成，不管理播放器状态

import { getCtx, createMasterGain, isSfxEnabled, getMasterVolume } from '../engine/soundPlayer';

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
      case 'roll': {
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
        break;
      }
      
      case 'select': {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523, now); // C5
        osc.frequency.exponentialRampToValueAtTime(784, now + 0.06); // G5
        g.gain.setValueAtTime(0.22, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        osc.connect(g); g.connect(master);
        osc.start(now); osc.stop(now + 0.08);
        break;
      }
      
      case 'dice_lock': {
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
        break;
      }
      
      case 'hit': {
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
        break;
      }
      
      case 'critical': {
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
        break;
      }
      
      case 'armor': {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(600, now + 0.15);
        g.gain.setValueAtTime(0.25, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        osc.connect(g); g.connect(master);
        osc.start(now); osc.stop(now + 0.2);
        break;
      }
      
      case 'shield_break': {
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
        break;
      }
      
      case 'heal': {
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
        break;
      }
      
      case 'enemy': {
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
        break;
      }
      
      case 'poison': {
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
        break;
      }
      
      case 'burn': {
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
        break;
      }
      
      case 'skill': {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(800, now + 0.3);
        g.gain.setValueAtTime(0.25, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        osc.connect(g); g.connect(master);
        osc.start(now); osc.stop(now + 0.3);
        break;
      }
      
      case 'coin': {
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
        break;
      }
      
      case 'reroll': {
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
        break;
      }
      
      case 'victory': {
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
        break;
      }
      
      case 'defeat': {
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
        break;
      }
      
      case 'levelup': {
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
        break;
      }
      
      case 'map_move': {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(392, now);
        osc.frequency.exponentialRampToValueAtTime(523, now + 0.08);
        g.gain.setValueAtTime(0.2, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        osc.connect(g); g.connect(master);
        osc.start(now); osc.stop(now + 0.1);
        break;
      }
      
      case 'shop_buy': {
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
        break;
      }
      
      case 'campfire': {
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
        break;
      }
      
      case 'event': {
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
        break;
      }
      
      case 'boss_appear': {
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
        break;
      }
      
      case 'relic_activate': {
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
        break;
      }
      
      case 'turn_end': {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(220, now + 0.2);
        g.gain.setValueAtTime(0.2, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.connect(g); g.connect(master);
        osc.start(now); osc.stop(now + 0.25);
        break;
      }
      
      case 'enemy_defend': {
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
        break;
      }
      
      case 'enemy_skill': {
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
        break;
      }
      
      case 'enemy_heal': {
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
        break;
      }
      
      case 'player_attack': {
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
        break;
      }
      
      case 'player_aoe': {
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
        break;
      }
      
      case 'enemy_speak': {
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
        break;
      }

      case 'boss_laugh': {
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
        break;
      }

      case 'gate_close': {
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
        break;
      }

      case 'enemy_death': {
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
        break;
      }
      
      case 'player_death': {
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
        break;
      }
    }
  } catch (e) {
    console.error('Audio error:', e);
  }
};
