import battleNormalMp3 from '../assets/DiceBattle-Normal.mp3';
import battleBossMp3 from '../assets/DiceBattle-Boss.mp3';

// === 增强版音效系统 ===

type SoundType = 
  | 'roll' | 'select' | 'hit' | 'armor' | 'heal' | 'enemy' 
  | 'victory' | 'defeat' | 'skill' | 'coin' | 'levelup' 
  | 'critical' | 'poison' | 'burn' | 'shield_break' | 'reroll'
  | 'map_move' | 'shop_buy' | 'campfire' | 'event' | 'boss_appear'
  | 'dice_lock' | 'augment_activate' | 'turn_end'
  | 'enemy_defend' | 'enemy_skill' | 'enemy_heal' | 'player_attack' | 'player_aoe'
  | 'enemy_death' | 'player_death';

let audioCtx: AudioContext | null = null;
let _bgmOscillators: OscillatorNode[] = [];
let _bgmGains: GainNode[] = [];
let bgmPlaying = false;
let masterVolume = 0.8;
let sfxEnabled = true;
let bgmEnabled = true;

// MP3 BGM 播放器
let mp3Audio: HTMLAudioElement | null = null;
let mp3BgmPlaying = false;
const MP3_BGM_MAP: Record<string, string> = {
  battle: battleNormalMp3,
  boss: battleBossMp3,
};

const getCtx = (): AudioContext => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioCtx;
};

// 创建一个带有滤波器的振荡器
const _createFilteredOsc = (
  ctx: AudioContext, 
  type: OscillatorType, 
  freq: number, 
  filterFreq: number,
  gain: number,
  dest: AudioNode
) => {
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  const filter = ctx.createBiquadFilter();
  
  osc.type = type;
  osc.frequency.value = freq;
  filter.type = 'lowpass';
  filter.frequency.value = filterFreq;
  g.gain.value = gain;
  
  osc.connect(filter);
  filter.connect(g);
  g.connect(dest);
  
  return { osc, gain: g, filter };
};

export const playSound = (type: SoundType) => {
  if (!sfxEnabled) return;
  
  try {
    const ctx = getCtx();
    const now = ctx.currentTime;
    const master = ctx.createGain();
    master.gain.value = masterVolume;
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
        g.gain.setValueAtTime(0.08, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        osc.connect(g); g.connect(master);
        osc.start(now); osc.stop(now + 0.15);
        
        // 添加碰撞感
        noise.type = 'sawtooth';
        noise.frequency.setValueAtTime(800, now);
        noise.frequency.exponentialRampToValueAtTime(100, now + 0.08);
        ng.gain.setValueAtTime(0.03, now);
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
        g.gain.setValueAtTime(0.15, now);
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
          g.gain.setValueAtTime(0.12, now + i * 0.05);
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
        g.gain.setValueAtTime(0.15, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.connect(g); g.connect(master);
        osc.start(now); osc.stop(now + 0.25);
        
        // 冲击波层
        const impact = ctx.createOscillator();
        const ig = ctx.createGain();
        impact.type = 'square';
        impact.frequency.setValueAtTime(60, now);
        impact.frequency.exponentialRampToValueAtTime(20, now + 0.1);
        ig.gain.setValueAtTime(0.1, now);
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
        g.gain.setValueAtTime(0.18, now);
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
          g.gain.setValueAtTime(0.14, now + i * 0.08);
          g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.3);
          o.connect(g); g.connect(master);
          o.start(now + i * 0.08); o.stop(now + i * 0.08 + 0.3);
        });
        break;
      }
      
      case 'enemy': {
        // 敌人攻击 — 强力冲击音效（多层叠加）
        // 层1: 低频重击
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(100, now);
        osc.frequency.exponentialRampToValueAtTime(25, now + 0.3);
        g.gain.setValueAtTime(0.35, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.connect(g); g.connect(master);
        osc.start(now); osc.stop(now + 0.35);
        
        // 层2: 中频冲击波
        const osc2 = ctx.createOscillator();
        const g2 = ctx.createGain();
        osc2.type = 'square';
        osc2.frequency.setValueAtTime(200, now);
        osc2.frequency.exponentialRampToValueAtTime(50, now + 0.15);
        g2.gain.setValueAtTime(0.25, now);
        g2.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        osc2.connect(g2); g2.connect(master);
        osc2.start(now); osc2.stop(now + 0.2);
        
        // 层3: 高频碎裂感
        const osc3 = ctx.createOscillator();
        const g3 = ctx.createGain();
        osc3.type = 'sawtooth';
        osc3.frequency.setValueAtTime(500, now);
        osc3.frequency.exponentialRampToValueAtTime(80, now + 0.1);
        g3.gain.setValueAtTime(0.15, now);
        g3.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc3.connect(g3); g3.connect(master);
        osc3.start(now); osc3.stop(now + 0.12);
        break;
      }
      
      case 'poison': {
        // 毒液滴落感
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(200, now + 0.15);
        g.gain.setValueAtTime(0.14, now);
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
        g.gain.setValueAtTime(0.18, now);
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
        g.gain.setValueAtTime(0.18, now);
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
          g.gain.setValueAtTime(0.1, now + i * 0.06);
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
          g.gain.setValueAtTime(0.1, now + i * 0.03);
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
          g.gain.setValueAtTime(0.18, now + i * 0.12);
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
          g.gain.setValueAtTime(0.2, now + i * 0.2);
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
          g.gain.setValueAtTime(0.16, now + i * 0.1);
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
        g.gain.setValueAtTime(0.1, now);
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
          g.gain.setValueAtTime(0.12, now + i * 0.07);
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
          g.gain.setValueAtTime(0.03, now + i * 0.1 + Math.random() * 0.05);
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
        g.gain.setValueAtTime(0.14, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
        osc.connect(g); g.connect(master);
        osc.start(now); osc.stop(now + 0.5);
        break;
      }
      
      case 'boss_appear': {
        // Boss出场 — 低沉震撼
        [55, 65, 82, 55].forEach((f, i) => {
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.type = 'sawtooth';
          o.frequency.value = f;
          g.gain.setValueAtTime(0.12, now + i * 0.3);
          g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.3 + 0.5);
          o.connect(g); g.connect(master);
          o.start(now + i * 0.3); o.stop(now + i * 0.3 + 0.5);
        });
        break;
      }
      
      case 'augment_activate': {
        // 遗物激活
        [659, 784, 988].forEach((f, i) => {
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.type = 'sine';
          o.frequency.value = f;
          g.gain.setValueAtTime(0.1, now + i * 0.04);
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
        g.gain.setValueAtTime(0.12, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.connect(g); g.connect(master);
        osc.start(now); osc.stop(now + 0.25);
        break;
      }
      
      case 'enemy_defend': {
        // 敌人举盾防御 — 沉闷金属碰撞
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.exponentialRampToValueAtTime(400, now + 0.1);
        osc.frequency.exponentialRampToValueAtTime(250, now + 0.25);
        g.gain.setValueAtTime(0.12, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        osc.connect(g); g.connect(master);
        osc.start(now); osc.stop(now + 0.3);
        // 金属回响层
        const osc2 = ctx.createOscillator();
        const g2 = ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(600, now + 0.05);
        osc2.frequency.exponentialRampToValueAtTime(300, now + 0.2);
        g2.gain.setValueAtTime(0.06, now + 0.05);
        g2.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc2.connect(g2); g2.connect(master);
        osc2.start(now + 0.05); osc2.stop(now + 0.25);
        break;
      }
      
      case 'enemy_skill': {
        // 敌人施法/技能 — 神秘能量蓄积+释放
        [220, 330, 440, 660].forEach((f, i) => {
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.type = 'sine';
          o.frequency.value = f;
          g.gain.setValueAtTime(0.06, now + i * 0.06);
          g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.2);
          o.connect(g); g.connect(master);
          o.start(now + i * 0.06); o.stop(now + i * 0.06 + 0.2);
        });
        // 低频冲击波
        const boom = ctx.createOscillator();
        const bg = ctx.createGain();
        boom.type = 'sawtooth';
        boom.frequency.setValueAtTime(80, now + 0.25);
        boom.frequency.exponentialRampToValueAtTime(30, now + 0.45);
        bg.gain.setValueAtTime(0.1, now + 0.25);
        bg.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
        boom.connect(bg); bg.connect(master);
        boom.start(now + 0.25); boom.stop(now + 0.5);
        break;
      }
      
      case 'enemy_heal': {
        // 敌人治疗 — 柔和上行琶音（比玩家heal更低沉）
        [262, 330, 392].forEach((f, i) => {
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.type = 'sine';
          o.frequency.value = f;
          g.gain.setValueAtTime(0.05, now + i * 0.1);
          g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.25);
          o.connect(g); g.connect(master);
          o.start(now + i * 0.1); o.stop(now + i * 0.1 + 0.25);
        });
        break;
      }
      
      case 'player_attack': {
        // 玩家出牌攻击 — 清脆斩击+冲击波
        const slash = ctx.createOscillator();
        const sg = ctx.createGain();
        slash.type = 'sawtooth';
        slash.frequency.setValueAtTime(300, now);
        slash.frequency.exponentialRampToValueAtTime(80, now + 0.15);
        sg.gain.setValueAtTime(0.15, now);
        sg.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        slash.connect(sg); sg.connect(master);
        slash.start(now); slash.stop(now + 0.2);
        // 高频锐利层
        const sharp = ctx.createOscillator();
        const shg = ctx.createGain();
        sharp.type = 'square';
        sharp.frequency.setValueAtTime(800, now);
        sharp.frequency.exponentialRampToValueAtTime(200, now + 0.08);
        shg.gain.setValueAtTime(0.08, now);
        shg.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        sharp.connect(shg); shg.connect(master);
        sharp.start(now); sharp.stop(now + 0.1);
        // 低频冲击
        const impact = ctx.createOscillator();
        const ig = ctx.createGain();
        impact.type = 'sine';
        impact.frequency.setValueAtTime(60, now + 0.02);
        impact.frequency.exponentialRampToValueAtTime(20, now + 0.15);
        ig.gain.setValueAtTime(0.12, now + 0.02);
        ig.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        impact.connect(ig); ig.connect(master);
        impact.start(now + 0.02); impact.stop(now + 0.2);
        break;
      }
      
      case 'player_aoe': {
        // 玩家AOE攻击 — 横扫冲击波+多层回响
        [150, 200, 120].forEach((f, i) => {
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.type = 'sawtooth';
          o.frequency.setValueAtTime(f, now + i * 0.06);
          o.frequency.exponentialRampToValueAtTime(f * 0.2, now + i * 0.06 + 0.25);
          g.gain.setValueAtTime(0.12, now + i * 0.06);
          g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.3);
          o.connect(g); g.connect(master);
          o.start(now + i * 0.06); o.stop(now + i * 0.06 + 0.3);
        });
        // 高频横扫
        const sweep = ctx.createOscillator();
        const swg = ctx.createGain();
        sweep.type = 'square';
        sweep.frequency.setValueAtTime(600, now);
        sweep.frequency.exponentialRampToValueAtTime(100, now + 0.2);
        swg.gain.setValueAtTime(0.08, now);
        swg.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        sweep.connect(swg); swg.connect(master);
        sweep.start(now); sweep.stop(now + 0.25);
        break;
      }
      
      case 'enemy_death': {
        // 敌人死亡 — 低沉爆裂+碎片飞散+消散
        // Layer 1: 低频爆裂
        const deathBoom = ctx.createOscillator();
        const dbg = ctx.createGain();
        deathBoom.type = 'sawtooth';
        deathBoom.frequency.setValueAtTime(120, now);
        deathBoom.frequency.exponentialRampToValueAtTime(20, now + 0.3);
        dbg.gain.setValueAtTime(0.2, now);
        dbg.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        deathBoom.connect(dbg); dbg.connect(master);
        deathBoom.start(now); deathBoom.stop(now + 0.35);
        // Layer 2: 碎片飞散（高频噪声粒子）
        for (let i = 0; i < 4; i++) {
          const shard = ctx.createOscillator();
          const sg = ctx.createGain();
          shard.type = 'square';
          shard.frequency.setValueAtTime(300 + Math.random() * 500, now + i * 0.03);
          shard.frequency.exponentialRampToValueAtTime(50, now + i * 0.03 + 0.1);
          sg.gain.setValueAtTime(0.06, now + i * 0.03);
          sg.gain.exponentialRampToValueAtTime(0.001, now + i * 0.03 + 0.12);
          shard.connect(sg); sg.connect(master);
          shard.start(now + i * 0.03); shard.stop(now + i * 0.03 + 0.12);
        }
        // Layer 3: 消散下行音
        const fade = ctx.createOscillator();
        const fg = ctx.createGain();
        fade.type = 'sine';
        fade.frequency.setValueAtTime(400, now + 0.1);
        fade.frequency.exponentialRampToValueAtTime(60, now + 0.5);
        fg.gain.setValueAtTime(0.08, now + 0.1);
        fg.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
        fade.connect(fg); fg.connect(master);
        fade.start(now + 0.1); fade.stop(now + 0.55);
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
          bg.gain.setValueAtTime(0.25 * (1 - i * 0.4), now + t);
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
          g.gain.setValueAtTime(0.08, now + 0.5 + i * 0.05);
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
        eg.gain.setValueAtTime(0.12, now + 1.0);
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

// === 背景音乐系统 ===
// RPG风格音序器 — 多声部旋律+和弦+节奏

interface BGMConfig {
  melody: number[];       // 主旋律音符
  bass: number[];         // 低音进行
  tempo: number;          // 每拍毫秒
  melodyType: OscillatorType;
  bassType: OscillatorType;
  melodyVol: number;
  bassVol: number;
  drumPattern: boolean[]; // 鼓点节拍（true=重拍）
  drumVol: number;
}

const BGM_CONFIGS: Record<string, BGMConfig> = {
  explore: {
    // 小调民谣风 — Am Em F G 和弦进行上的旋律
    melody: [440, 523, 494, 440, 392, 440, 523, 587, 523, 494, 440, 392, 349, 392, 440, 494],
    bass:   [220, 220, 165, 165, 175, 175, 196, 196, 220, 220, 165, 165, 175, 175, 196, 196],
    tempo: 320,
    melodyType: 'sine',
    bassType: 'triangle',
    melodyVol: 0.04,
    bassVol: 0.025,
    drumPattern: [true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false],
    drumVol: 0.018,
  },
  battle: {
    // Lydian调式战斗曲 — C Lydian (C D E F# G A B)
    // 和弦走向: Cmaj7 → D → Em7 → Bm → Cmaj7 → A → D → G
    // 明亮、梦幻、带有冒险感的旋律，30秒循环 (168 notes × 180ms = 30.24s)
    melody: [
      // Phrase 1: Cmaj7 — 明亮开场，Lydian特征音F#点缀 (bar 1-2)
      523, 494, 440, 523,  392, 370, 392, 440,
      523, 587, 523, 494,  440, 392, 440, 494,
      // Phrase 2: D — 上行推进，充满活力 (bar 3-4)
      587, 523, 587, 659,  587, 523, 494, 440,
      494, 523, 587, 523,  494, 440, 392, 440,
      // Phrase 3: Em7 — 柔和过渡，呼吸感 (bar 5-6)
      330, 392, 440, 494,  523, 494, 440, 392,
      370, 440, 494, 523,  494, 440, 392, 370,
      // Phrase 4: Bm — 紧张感，半音下行 (bar 7-8)
      494, 440, 392, 370,  392, 440, 494, 587,
      523, 494, 440, 392,  370, 330, 370, 392,
      // Phrase 5: Cmaj7 — 回归主调，旋律变奏 (bar 9-10)
      440, 494, 523, 587,  659, 587, 523, 494,
      523, 440, 392, 440,  494, 523, 587, 523,
      // Phrase 6: A — 温暖过渡 (bar 11-12)
      440, 523, 494, 440,  392, 370, 392, 440,
      330, 370, 440, 494,  440, 392, 370, 330,
      // Phrase 7: D — 高潮推进 (bar 13-14)
      587, 659, 587, 523,  587, 659, 784, 659,
      587, 523, 494, 523,  587, 523, 494, 440,
      // Phrase 8: G → 回到C — 解决感，循环衔接 (bar 15-16)
      392, 440, 494, 523,  587, 523, 494, 440,
      494, 523, 440, 392,  370, 392, 440, 494,
      // Phrase 9: Em7 → Bm — 回声变奏 (bar 17-18)
      330, 370, 440, 494,  523, 587, 523, 494,
      494, 440, 392, 370,  330, 370, 392, 440,
      // Phrase 10: Cmaj7 — 渐弱回归 (bar 19-20)
      523, 494, 440, 494,  523, 587, 523, 440,
      392, 440, 494, 440,  392, 370, 392, 440,
      // Coda: 8音过渡回开头
      523, 494, 440, 392,  440, 494, 523, 494
    ],
    bass: [
      // Cmaj7 (C bass)
      131, 131, 131, 131,  131, 131, 131, 131,
      131, 131, 131, 131,  131, 131, 131, 131,
      // D (D bass)
      147, 147, 147, 147,  147, 147, 147, 147,
      147, 147, 147, 147,  147, 147, 147, 147,
      // Em7 (E bass)
      165, 165, 165, 165,  165, 165, 165, 165,
      165, 165, 165, 165,  165, 165, 165, 165,
      // Bm (B bass)
      247, 247, 247, 247,  247, 247, 247, 247,
      247, 247, 247, 247,  247, 247, 247, 247,
      // Cmaj7 (C bass)
      131, 131, 131, 131,  131, 131, 131, 131,
      131, 131, 131, 131,  131, 131, 131, 131,
      // A (A bass)
      220, 220, 220, 220,  220, 220, 220, 220,
      220, 220, 220, 220,  220, 220, 220, 220,
      // D (D bass)
      147, 147, 147, 147,  147, 147, 147, 147,
      147, 147, 147, 147,  147, 147, 147, 147,
      // G → C (G then C bass)
      196, 196, 196, 196,  196, 196, 196, 196,
      131, 131, 131, 131,  131, 131, 131, 131,
      // Em7 → Bm
      165, 165, 165, 165,  165, 165, 165, 165,
      247, 247, 247, 247,  247, 247, 247, 247,
      // Cmaj7
      131, 131, 131, 131,  131, 131, 131, 131,
      131, 131, 131, 131,  131, 131, 131, 131,
      // Coda: C bass
      131, 131, 131, 131,  131, 131, 131, 131
    ],
    tempo: 180,
    melodyType: 'square' as OscillatorType,
    bassType: 'triangle' as OscillatorType,
    melodyVol: 0.032,
    bassVol: 0.022,
    drumPattern: [
      // Bar 1-2: 基础4/4拍
      true, false, false, false,  true, false, true, false,
      true, false, false, false,  true, false, true, false,
      // Bar 3-4: 推进感加强
      true, false, true, false,  true, false, false, true,
      true, false, true, false,  true, false, true, false,
      // Bar 5-6: 呼吸段，鼓点减少
      true, false, false, false,  false, false, true, false,
      true, false, false, false,  false, false, true, false,
      // Bar 7-8: 紧张段，加密
      true, false, true, false,  true, false, true, true,
      true, true, false, true,  true, false, true, false,
      // Bar 9-10: 回归主调
      true, false, false, false,  true, false, true, false,
      true, false, false, true,  true, false, false, false,
      // Bar 11-12: 温暖过渡
      true, false, false, false,  true, false, false, false,
      true, false, true, false,  false, false, true, false,
      // Bar 13-14: 高潮，鼓点密集
      true, false, true, true,  true, false, true, false,
      true, true, false, true,  true, false, true, true,
      // Bar 15-16: 解决+衔接
      true, false, true, false,  true, false, false, true,
      true, false, false, false,  true, false, true, false,
      // Bar 17-18: 回声变奏
      true, false, false, false,  true, false, true, false,
      true, false, true, false,  true, false, false, true,
      // Bar 19-20: 渐弱回归
      true, false, false, false,  false, false, true, false,
      true, false, false, false,  false, false, false, false,
      // Coda
      true, false, false, false,  false, false, true, false
    ],
    drumVol: 0.03,
  },
  boss: {
    // 威压Boss战 — 低沉厚重，半音阶下行 + 强力鼓点
    melody: [220, 208, 196, 220, 175, 165, 196, 208, 220, 262, 247, 220, 196, 175, 165, 147],
    bass:   [110, 110, 98, 98, 87, 87, 98, 98, 110, 110, 98, 98, 87, 87, 73, 73],
    tempo: 240,
    melodyType: 'sawtooth',
    bassType: 'sawtooth',
    melodyVol: 0.035,
    bassVol: 0.035,
    drumPattern: [true, false, false, true, true, false, false, true, true, false, true, false, true, true, false, true],
    drumVol: 0.04,
  },
};

let bgmInterval: ReturnType<typeof setInterval> | null = null;
let currentBgmType: string = '';

export const startBGM = (type: 'explore' | 'battle' | 'boss') => {
  if (!bgmEnabled) return;
  if (currentBgmType === type && (bgmPlaying || mp3BgmPlaying)) return;
  
  stopBGM();
  
  // MP3 BGM for battle and boss
  const mp3Path = MP3_BGM_MAP[type];
  if (mp3Path) {
    currentBgmType = type;
    mp3BgmPlaying = true;
    try {
      mp3Audio = new Audio(mp3Path);
      mp3Audio.loop = true;
      mp3Audio.volume = masterVolume * 0.35; // MP3 volume (source files already reduced 50%)
      mp3Audio.play().catch(e => console.warn('MP3 BGM autoplay blocked:', e));
    } catch (e) {
      console.error('MP3 BGM error:', e);
      mp3BgmPlaying = false;
    }
    return;
  }
  
  // Programmatic BGM for explore
  const cfg = BGM_CONFIGS[type];
  if (!cfg) return;
  
  currentBgmType = type;
  bgmPlaying = true;
  let noteIndex = 0;
  
  bgmInterval = setInterval(() => {
    if (!bgmPlaying) return;
    
    try {
      const ctx = getCtx();
      const now = ctx.currentTime;
      const idx = noteIndex % cfg.melody.length;
      const melodyNote = cfg.melody[idx];
      const bassNote = cfg.bass[idx];
      const beatDur = cfg.tempo / 1000;
      
      // === 主旋律 ===
      const melOsc = ctx.createOscillator();
      const melGain = ctx.createGain();
      const melFilter = ctx.createBiquadFilter();
      
      melOsc.type = cfg.melodyType;
      melOsc.frequency.value = melodyNote;
      melFilter.type = 'lowpass';
      melFilter.frequency.value = 1200;
      melFilter.Q.value = 1;
      melGain.gain.setValueAtTime(cfg.melodyVol * masterVolume, now);
      melGain.gain.setValueAtTime(cfg.melodyVol * masterVolume * 0.8, now + beatDur * 0.7);
      melGain.gain.exponentialRampToValueAtTime(0.001, now + beatDur * 0.95);
      
      melOsc.connect(melFilter);
      melFilter.connect(melGain);
      melGain.connect(ctx.destination);
      melOsc.start(now);
      melOsc.stop(now + beatDur);
      
      // === 低音伴奏 === (每2拍换一次)
      if (idx % 2 === 0) {
        const bassOsc = ctx.createOscillator();
        const bassGain = ctx.createGain();
        const bassFilter = ctx.createBiquadFilter();
        
        bassOsc.type = cfg.bassType;
        bassOsc.frequency.value = bassNote;
        bassFilter.type = 'lowpass';
        bassFilter.frequency.value = 400;
        bassGain.gain.setValueAtTime(cfg.bassVol * masterVolume, now);
        bassGain.gain.exponentialRampToValueAtTime(0.001, now + beatDur * 1.8);
        
        bassOsc.connect(bassFilter);
        bassFilter.connect(bassGain);
        bassGain.connect(ctx.destination);
        bassOsc.start(now);
        bassOsc.stop(now + beatDur * 2);
      }
      
      // === 鼓点/打击层 ===
      if (cfg.drumPattern[idx]) {
        // 低频鼓点（kick）
        const kickOsc = ctx.createOscillator();
        const kickGain = ctx.createGain();
        kickOsc.type = 'sine';
        kickOsc.frequency.setValueAtTime(80, now);
        kickOsc.frequency.exponentialRampToValueAtTime(30, now + 0.08);
        kickGain.gain.setValueAtTime(cfg.drumVol * masterVolume, now);
        kickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        kickOsc.connect(kickGain);
        kickGain.connect(ctx.destination);
        kickOsc.start(now);
        kickOsc.stop(now + 0.12);
        
        // 高频噪声层（snare感）
        const noiseOsc = ctx.createOscillator();
        const noiseGain = ctx.createGain();
        noiseOsc.type = 'square';
        noiseOsc.frequency.setValueAtTime(200 + Math.random() * 100, now);
        noiseOsc.frequency.exponentialRampToValueAtTime(80, now + 0.04);
        noiseGain.gain.setValueAtTime(cfg.drumVol * 0.3 * masterVolume, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
        noiseOsc.connect(noiseGain);
        noiseGain.connect(ctx.destination);
        noiseOsc.start(now);
        noiseOsc.stop(now + 0.06);
      }
      
      // === 和弦填充 (每4拍) ===
      if (idx % 4 === 0) {
        // 三度音
        const chordOsc = ctx.createOscillator();
        const chordGain = ctx.createGain();
        chordOsc.type = 'sine';
        chordOsc.frequency.value = melodyNote * 1.2; // 小三度
        chordGain.gain.setValueAtTime(cfg.melodyVol * 0.3 * masterVolume, now);
        chordGain.gain.exponentialRampToValueAtTime(0.001, now + beatDur * 2);
        chordOsc.connect(chordGain);
        chordGain.connect(ctx.destination);
        chordOsc.start(now);
        chordOsc.stop(now + beatDur * 2);
        
        // 五度音
        const chord5Osc = ctx.createOscillator();
        const chord5Gain = ctx.createGain();
        chord5Osc.type = 'sine';
        chord5Osc.frequency.value = melodyNote * 1.5; // 纯五度
        chord5Gain.gain.setValueAtTime(cfg.melodyVol * 0.2 * masterVolume, now);
        chord5Gain.gain.exponentialRampToValueAtTime(0.001, now + beatDur * 2);
        chord5Osc.connect(chord5Gain);
        chord5Gain.connect(ctx.destination);
        chord5Osc.start(now);
        chord5Osc.stop(now + beatDur * 2);
      }
      
      noteIndex++;
    } catch (e) {
      console.error('BGM error:', e);
    }
  }, cfg.tempo);
};

export const stopBGM = () => {
  bgmPlaying = false;
  currentBgmType = '';
  // Stop programmatic BGM
  if (bgmInterval) {
    clearInterval(bgmInterval);
    bgmInterval = null;
  }
  // Stop MP3 BGM
  if (mp3Audio) {
    mp3Audio.pause();
    mp3Audio.currentTime = 0;
    mp3Audio = null;
  }
  mp3BgmPlaying = false;
};

export const setMasterVolume = (vol: number) => {
  masterVolume = Math.max(0, Math.min(1, vol));
  // Sync MP3 BGM volume
  if (mp3Audio) {
    mp3Audio.volume = masterVolume * 0.35;
  }
};

export const setSfxEnabled = (enabled: boolean) => {
  sfxEnabled = enabled;
};

export const setBgmEnabled = (enabled: boolean) => {
  bgmEnabled = enabled;
  if (!enabled) stopBGM();
};

export const getMasterVolume = () => masterVolume;
export const isSfxEnabled = () => sfxEnabled;
export const isBgmEnabled = () => bgmEnabled;
