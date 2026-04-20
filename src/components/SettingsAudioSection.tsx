import React from 'react';
import { motion } from 'motion/react';
import { PixelVolume, PixelMute, PixelMusic } from './PixelIcons';

/* ── 音量滑块 ── */
export const VolumeSlider: React.FC<{ volume: number; onChange: (v: number) => void }> = ({ volume, onChange }) => (
  <div>
    <div className="flex justify-between items-center mb-2">
      <span className="text-[10px] text-[var(--dungeon-text)] flex items-center gap-1.5">
        <PixelVolume size={2} /> 主 音 量
      </span>
      <span className="text-[10px] text-[var(--pixel-green)] font-mono">{Math.round(volume * 100)}%</span>
    </div>
    <input
      type="range" min="0" max="1" step="0.05"
      value={volume} onChange={e => onChange(parseFloat(e.target.value))}
      className="w-full h-1.5 cursor-pointer"
    />
  </div>
);

/* ── 开关组件 ── */
export const ToggleSwitch: React.FC<{
  label: string;
  iconOn: React.ReactNode;
  iconOff: React.ReactNode;
  value: boolean;
  onToggle: () => void;
}> = ({ label, iconOn, iconOff, value, onToggle }) => (
  <div className="flex justify-between items-center">
    <span className="text-[10px] text-[var(--dungeon-text)] flex items-center gap-1.5">
      {value ? iconOn : iconOff} {label}
    </span>
    <button
      onClick={onToggle}
      className={`w-10 h-5 border-2 transition-all duration-100 relative ${
        value
          ? 'bg-[var(--pixel-green-dark)] border-[var(--pixel-green)]'
          : 'bg-[var(--dungeon-bg)] border-[var(--dungeon-panel-border)]'
      }`}
      style={{ borderRadius: '2px' }}
    >
      <motion.div
        animate={{ x: value ? 20 : 2 }}
        className="absolute top-0.5 w-3.5 h-3.5 bg-[var(--dungeon-text)]"
        style={{ borderRadius: '1px' }}
      />
    </button>
  </div>
);

/* ── 音频设置区（音量 + 音效开关 + BGM开关） ── */
export const SettingsAudioSection: React.FC<{
  volume: number;
  onVolumeChange: (v: number) => void;
  sfx: boolean;
  onSfxToggle: () => void;
  bgm: boolean;
  onBgmToggle: () => void;
}> = ({ volume, onVolumeChange, sfx, onSfxToggle, bgm, onBgmToggle }) => (
  <>
    <VolumeSlider volume={volume} onChange={onVolumeChange} />
    <ToggleSwitch label="音 效" iconOn={<PixelVolume size={2} />} iconOff={<PixelMute size={2} />} value={sfx} onToggle={onSfxToggle} />
    <ToggleSwitch label="背景音乐" iconOn={<PixelMusic size={2} />} iconOff={<PixelMusic size={2} />} value={bgm} onToggle={onBgmToggle} />
  </>
);
