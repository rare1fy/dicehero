import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PixelGear, PixelVolume, PixelMute, PixelMusic, PixelClose, PixelBook } from './PixelIcons';
import { 
  getMasterVolume, setMasterVolume, 
  isSfxEnabled, setSfxEnabled, 
  isBgmEnabled, setBgmEnabled 
} from '../utils/sound';
import { resetTutorial } from './TutorialOverlay';

interface SettingsPanelProps {
  onResetTutorial?: () => void;
  onOpenHandGuide?: () => void;
  onOpenDiceGuide?: () => void;
  onOpenRelicGuide?: () => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ onResetTutorial, onOpenHandGuide, onOpenDiceGuide, onOpenRelicGuide }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [volume, setVolume] = useState(getMasterVolume());
  const [sfx, setSfx] = useState(isSfxEnabled());
  const [bgm, setBgm] = useState(isBgmEnabled());

  const handleVolumeChange = (val: number) => {
    setVolume(val);
    setMasterVolume(val);
  };

  const handleSfxToggle = () => {
    const newVal = !sfx;
    setSfx(newVal);
    setSfxEnabled(newVal);
  };

  const handleBgmToggle = () => {
    const newVal = !bgm;
    setBgm(newVal);
    setBgmEnabled(newVal);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="p-1.5 pixel-border bg-[var(--dungeon-panel)] text-[var(--dungeon-text-dim)] hover:text-[var(--dungeon-text)] transition-colors"
      >
        <PixelGear size={2} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[150] bg-black/85 flex items-center justify-center p-4"
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="pixel-panel w-full max-w-xs overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              {/* 标题栏 */}
              <div className="p-3 border-b-3 border-[var(--dungeon-panel-border)] flex justify-between items-center bg-[var(--dungeon-bg-light)]">
                <h3 className="text-xs text-[var(--pixel-gold)] pixel-text-shadow flex items-center gap-2">
                  <PixelGear size={2} /> ✦ 设 置 ✦
                </h3>
                <button onClick={() => setIsOpen(false)} className="text-[var(--dungeon-text-dim)] hover:text-[var(--pixel-red)]">
                  <PixelClose size={2} />
                </button>
              </div>

              <div className="p-4 space-y-4 bg-[var(--dungeon-panel)]">
                {/* 音量控制 */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] text-[var(--dungeon-text)] flex items-center gap-1.5">
                      <PixelVolume size={2} /> 主 音 量
                    </span>
                    <span className="text-[10px] text-[var(--pixel-green)] font-mono">{Math.round(volume * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={volume}
                    onChange={e => handleVolumeChange(parseFloat(e.target.value))}
                    className="w-full h-1.5 cursor-pointer"
                  />
                </div>

                {/* 音效开关 */}
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-[var(--dungeon-text)] flex items-center gap-1.5">
                    {sfx ? <PixelVolume size={2} /> : <PixelMute size={2} />} 音 效
                  </span>
                  <button
                    onClick={handleSfxToggle}
                    className={`w-10 h-5 border-2 transition-all duration-100 relative ${
                      sfx 
                        ? 'bg-[var(--pixel-green-dark)] border-[var(--pixel-green)]' 
                        : 'bg-[var(--dungeon-bg)] border-[var(--dungeon-panel-border)]'
                    }`}
                    style={{ borderRadius: '2px' }}
                  >
                    <motion.div
                      animate={{ x: sfx ? 20 : 2 }}
                      className="absolute top-0.5 w-3.5 h-3.5 bg-[var(--dungeon-text)]"
                      style={{ borderRadius: '1px' }}
                    />
                  </button>
                </div>

                {/* BGM开关 */}
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-[var(--dungeon-text)] flex items-center gap-1.5">
                    <PixelMusic size={2} /> 背景音乐
                  </span>
                  <button
                    onClick={handleBgmToggle}
                    className={`w-10 h-5 border-2 transition-all duration-100 relative ${
                      bgm 
                        ? 'bg-[var(--pixel-green-dark)] border-[var(--pixel-green)]' 
                        : 'bg-[var(--dungeon-bg)] border-[var(--dungeon-panel-border)]'
                    }`}
                    style={{ borderRadius: '2px' }}
                  >
                    <motion.div
                      animate={{ x: bgm ? 20 : 2 }}
                      className="absolute top-0.5 w-3.5 h-3.5 bg-[var(--dungeon-text)]"
                      style={{ borderRadius: '1px' }}
                    />
                  </button>
                </div>

                {/* 分隔线 */}
                <div className="h-[2px] bg-[var(--dungeon-panel-border)]" />

                {/* 牌型图鉴 */}
                {onOpenHandGuide && (
                  <button
                    onClick={() => {
                      onOpenHandGuide();
                      setIsOpen(false);
                    }}
                    className="w-full py-2 pixel-btn pixel-btn-ghost text-[10px] flex items-center justify-center gap-2"
                  >
                    <PixelBook size={2} /> 牌型图鉴
                  </button>
                )}

                {/* 骰子图鉴 */}
                {onOpenDiceGuide && (
                  <button
                    onClick={() => {
                      onOpenDiceGuide();
                      setIsOpen(false);
                    }}
                    className="w-full py-2 pixel-btn pixel-btn-ghost text-[10px] flex items-center justify-center gap-2"
                  >
                    <PixelBook size={2} /> 骰子图鉴
                  </button>
                )}

                {/* 遗物图鉴 */}
                {onOpenRelicGuide && (
                  <button
                    onClick={() => {
                      onOpenRelicGuide();
                      setIsOpen(false);
                    }}
                    className="w-full py-2 pixel-btn pixel-btn-ghost text-[10px] flex items-center justify-center gap-2"
                  >
                    <PixelBook size={2} /> 遗物一览
                  </button>
                )}

                {/* 重置教程 */}
                <button
                  onClick={() => {
                    resetTutorial();
                    onResetTutorial?.();
                    setIsOpen(false);
                  }}
                  className="w-full py-2 pixel-btn pixel-btn-ghost text-[10px] flex items-center justify-center gap-2"
                >
                  <PixelBook size={2} /> 重新查看教程
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
