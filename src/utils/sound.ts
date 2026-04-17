// 音效模块统一导出入口
// 原 sound.ts 已拆分为 engine/soundPlayer.ts 和 data/soundEffects.ts

export {
  // 播放器核心 (from engine/soundPlayer)
  getCtx,
  isAudioContextReady,
  resumeAudioContext,
  getMasterVolume,
  isSfxEnabled,
  isBgmEnabled,
  setMasterVolume,
  setSfxEnabled,
  setBgmEnabled,
  playBGM,
  startBGM,
  stopBGM,
  stopBGMImmediate,
  getCurrentBGMType,
  createMasterGain,
  createFilteredOsc,
} from '../engine/soundPlayer';

export {
  // 音效生成 (from data/soundEffects)
  playSound,
  playSettlementTick,
  playMultiplierTick,
  playHeavyImpact,
} from '../data/soundEffects';

export type { SoundType } from '../data/soundEffects';
export type { AudioNodes } from '../engine/soundPlayer';
