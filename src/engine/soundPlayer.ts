// [RULES-B4-EXEMPT] 播放器核心逻辑：AudioContext管理、BGM控制、音量状态
// 拆分自 utils/sound.ts，职责单一：只负责播放基础设施

import battleNormalMp3 from '../assets/DiceBattle-Normal.mp3';
import startMp3 from '../assets/DiceBattle-Start.mp3';
import outsideMp3 from '../assets/DiceBattle-Outside.mp3';

// === 播放器状态 ===
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
  start: startMp3,
  explore: outsideMp3,
  battle: battleNormalMp3,
};

// BGM 音量缩放
const BGM_VOLUME_SCALE = 0.6;
const FADE_DURATION = 800;

// === 核心工具函数 ===

export const getCtx = (): AudioContext => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext || AudioContext)();
  }
  return audioCtx;
};

export const isAudioContextReady = (): boolean => {
  return audioCtx !== null && audioCtx.state === 'running';
};

export const resumeAudioContext = async (): Promise<void> => {
  if (audioCtx && audioCtx.state === 'suspended') {
    await audioCtx.resume();
  }
};

// === 状态获取/设置 ===

export const getMasterVolume = (): number => masterVolume;
export const isSfxEnabled = (): boolean => sfxEnabled;
export const isBgmEnabled = (): boolean => bgmEnabled;

export const setMasterVolume = (vol: number): void => {
  masterVolume = Math.max(0, Math.min(1, vol));
  if (mp3Audio) {
    mp3Audio.volume = masterVolume * BGM_VOLUME_SCALE;
  }
};

export const setSfxEnabled = (enabled: boolean): void => {
  sfxEnabled = enabled;
};

export const setBgmEnabled = (enabled: boolean): void => {
  bgmEnabled = enabled;
  if (!enabled) stopBGM();
};

// === BGM 控制 ===

let currentBgmType = '';

/**
 * BGM 切换代数标记：每次 playBGM 调用自增。
 * 用于在异步过程（淡入/淡出）中识别"自己是否已被新的切换顶替"。
 * 避免并发调用导致新旧 BGM 重叠。
 */
let bgmGeneration = 0;

// [Bug-FIX 2026-05-07] 浏览器 autoplay 策略兜底：
// 首次 playBGM 在用户尚未与页面交互时被静默拒绝。我们在拒绝时记录 pending 类型，
// 并安装一次性 pointerdown 监听，等待首次用户交互后自动重试播放。
let pendingBgmType: 'start' | 'explore' | 'battle' | null = null;
let unlockListenerInstalled = false;

const installUserGestureUnlock = (): void => {
  if (unlockListenerInstalled || typeof window === 'undefined') return;
  unlockListenerInstalled = true;
  const handler = () => {
    window.removeEventListener('pointerdown', handler);
    window.removeEventListener('keydown', handler);
    window.removeEventListener('touchstart', handler);
    if (pendingBgmType && bgmEnabled) {
      const t = pendingBgmType;
      pendingBgmType = null;
      // 异步重试：在 stack 清空后调用，确保用户手势栈仍生效
      setTimeout(() => { void playBGM(t); }, 0);
    }
  };
  window.addEventListener('pointerdown', handler, { once: true });
  window.addEventListener('keydown', handler, { once: true });
  window.addEventListener('touchstart', handler, { once: true });
};

// 新 BGM 淡入（旧 BGM 已立即停止，不再重叠播放）
const FADE_IN_DURATION = 400;
const fadeInAudio = async (audio: HTMLAudioElement, targetVol: number, duration: number, gen: number): Promise<void> => {
  const steps = 10;
  const stepDuration = duration / steps;
  for (let i = 1; i <= steps; i++) {
    // 如果本次切换已被新调用顶替，立刻停止并停音
    if (gen !== bgmGeneration) {
      try { audio.pause(); } catch {}
      return;
    }
    audio.volume = targetVol * (i / steps);
    await new Promise(r => setTimeout(r, stepDuration));
  }
};

export const playBGM = async (type: 'start' | 'explore' | 'battle'): Promise<void> => {
  if (!bgmEnabled) return;
  await resumeAudioContext();

  // 同类型短路（允许多次调用同类型 BGM 而不打断播放）
  if (mp3BgmPlaying && currentBgmType === type && mp3Audio && !mp3Audio.paused) return;

  // 标记本次切换代数，后续异步 step 若被覆盖则自行终止
  const myGen = ++bgmGeneration;

  // 立即停止旧 BGM（不渐弱，避免新旧重叠）
  if (mp3Audio) {
    try { mp3Audio.pause(); } catch {}
    mp3Audio = null;
  }
  mp3BgmPlaying = false;

  const src = MP3_BGM_MAP[type];
  if (!src) return;

  const newAudio = new Audio(src);
  newAudio.loop = true;
  newAudio.volume = 0; // 从 0 淡入

  // 绑定本次切换；若此时 myGen 已过期则放弃
  if (myGen !== bgmGeneration) return;
  mp3Audio = newAudio;

  try {
    await newAudio.play();
    // 再次校验：await 期间可能已被更新
    if (myGen !== bgmGeneration) {
      try { newAudio.pause(); } catch {}
      return;
    }
    mp3BgmPlaying = true;
    currentBgmType = type;
    pendingBgmType = null;
    // 渐入到目标音量
    void fadeInAudio(newAudio, masterVolume * BGM_VOLUME_SCALE, FADE_IN_DURATION, myGen);
  } catch {
    mp3BgmPlaying = false;
    if (myGen === bgmGeneration) {
      mp3Audio = null;
    }
    // 浏览器 autoplay 拒绝：标记待播类型并等待首次用户交互
    pendingBgmType = type;
    installUserGestureUnlock();
  }
};

// 向后兼容：startBGM 是 playBGM 的别名
export const startBGM = playBGM;

export const stopBGMImmediate = (): void => {
  bgmGeneration++; // 让进行中的淡入立即失效
  if (mp3Audio) {
    try { mp3Audio.pause(); } catch {}
    mp3Audio = null;
  }
  mp3BgmPlaying = false;
  currentBgmType = '';

  // 停止合成器BGM
  _bgmOscillators.forEach(osc => {
    try { osc.stop(); } catch {}
  });
  _bgmOscillators = [];
  _bgmGains = [];
  bgmPlaying = false;
};

export const stopBGM = async (): Promise<void> => {
  // 切换到停止状态，直接立即停（不再渐出，避免残留）
  stopBGMImmediate();
};

export const getCurrentBGMType = (): string => currentBgmType;

// === 音频节点创建工具 ===

export interface AudioNodes {
  osc: OscillatorNode;
  gain: GainNode;
  filter?: BiquadFilterNode;
}

export const createFilteredOsc = (
  ctx: AudioContext,
  type: OscillatorType,
  freq: number,
  filterFreq: number,
  gain: number,
  dest: AudioNode
): AudioNodes => {
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

export const createMasterGain = (ctx: AudioContext): GainNode => {
  const master = ctx.createGain();
  master.gain.value = masterVolume;
  master.connect(ctx.destination);
  return master;
};

// === AudioContext 类型导出已移除（TS2661: 不能 re-export 全局声明） ===
