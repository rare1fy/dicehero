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
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
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

const fadeOutAudio = async (audio: HTMLAudioElement, duration: number): Promise<void> => {
  const startVol = audio.volume;
  const steps = 20;
  const stepDuration = duration / steps;
  
  for (let i = 0; i < steps; i++) {
    audio.volume = startVol * (1 - i / steps);
    await new Promise(r => setTimeout(r, stepDuration));
  }
  audio.pause();
};

export const playBGM = async (type: 'start' | 'explore' | 'battle'): Promise<void> => {
  if (!bgmEnabled) return;
  await resumeAudioContext();
  
  if (mp3BgmPlaying && currentBgmType === type) return;
  
  // 淡出当前BGM
  if (mp3Audio && mp3BgmPlaying) {
    const oldAudio = mp3Audio;
    mp3Audio = null;
    mp3BgmPlaying = false;
    await fadeOutAudio(oldAudio, FADE_DURATION);
  }
  
  const src = MP3_BGM_MAP[type];
  if (!src) return;
  
  mp3Audio = new Audio(src);
  mp3Audio.loop = true;
  mp3Audio.volume = masterVolume * BGM_VOLUME_SCALE;
  
  try {
    await mp3Audio.play();
    mp3BgmPlaying = true;
    currentBgmType = type;
  } catch (e) {
    mp3BgmPlaying = false;
  }
};

// 向后兼容：startBGM 是 playBGM 的别名
export const startBGM = playBGM;

export const stopBGMImmediate = (): void => {
  if (mp3Audio) {
    mp3Audio.pause();
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
  if (mp3Audio && mp3BgmPlaying) {
    const oldAudio = mp3Audio;
    mp3Audio = null;
    mp3BgmPlaying = false;
    currentBgmType = '';
    await fadeOutAudio(oldAudio, FADE_DURATION);
  } else {
    stopBGMImmediate();
  }
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
