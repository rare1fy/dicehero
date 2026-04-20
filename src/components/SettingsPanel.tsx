import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PixelGear, PixelClose } from './PixelIcons';
import {
  getMasterVolume, setMasterVolume,
  isSfxEnabled, setSfxEnabled,
  isBgmEnabled, setBgmEnabled
} from '../utils/sound';
import { useGameContext } from '../contexts/GameContext';
import { GmDebugPanel } from './GmDebugPanel';
import { SettingsAudioSection } from './SettingsAudioSection';
import { SettingsGuideSection } from './SettingsGuideSection';
import { SettingsDataSection } from './SettingsDataSection';

interface SettingsPanelProps {
  onResetTutorial?: () => void;
  onOpenHandGuide?: () => void;
  onOpenDiceGuide?: () => void;
  onOpenRelicGuide?: () => void;
  onOpenEnemyGuide?: () => void;
  onOpenLog?: () => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  onResetTutorial, onOpenHandGuide, onOpenDiceGuide, onOpenRelicGuide, onOpenEnemyGuide, onOpenLog
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [volume, setVolume] = useState(getMasterVolume());
  const [sfx, setSfx] = useState(isSfxEnabled());
  const [bgm, setBgm] = useState(isBgmEnabled());
  const [showGM, setShowGM] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const { game, addToast } = useGameContext();

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
              style={{ maxHeight: '85dvh', display: 'flex', flexDirection: 'column' }}
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

              <div className="p-4 space-y-4 bg-[var(--dungeon-panel)] overflow-y-auto flex-1 min-h-0" style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-y', overscrollBehavior: 'contain' }}>
                {/* 音频设置 */}
                <SettingsAudioSection
                  volume={volume}
                  onVolumeChange={v => { setVolume(v); setMasterVolume(v); }}
                  sfx={sfx}
                  onSfxToggle={() => { const v = !sfx; setSfx(v); setSfxEnabled(v); }}
                  bgm={bgm}
                  onBgmToggle={() => { const v = !bgm; setBgm(v); setBgmEnabled(v); }}
                />

                <div className="h-[2px] bg-[var(--dungeon-panel-border)]" />

                {/* 图鉴入口 */}
                <SettingsGuideSection
                  onOpenHandGuide={onOpenHandGuide}
                  onOpenDiceGuide={onOpenDiceGuide}
                  onOpenRelicGuide={onOpenRelicGuide}
                  onOpenEnemyGuide={onOpenEnemyGuide}
                  onOpenLog={onOpenLog}
                  onResetTutorial={onResetTutorial}
                  onClose={() => setIsOpen(false)}
                />

                {/* 存档 & 清空数据 */}
                <div className="h-[2px] bg-[var(--dungeon-panel-border)]" />
                <SettingsDataSection
                  game={game}
                  addToast={addToast}
                  showClearConfirm={showClearConfirm}
                  setShowClearConfirm={setShowClearConfirm}
                />

                {/* GM 调试面板 */}
                <div className="h-[2px] bg-[var(--dungeon-panel-border)]" />
                <button
                  onClick={() => setShowGM(!showGM)}
                  className="w-full py-2 pixel-btn pixel-btn-ghost text-[10px] flex items-center justify-center gap-2 text-[var(--pixel-red)]"
                >
                  ⚙ GM 调试工具 {showGM ? '▲' : '▼'}
                </button>
                {showGM && <GmDebugPanel onClose={() => setIsOpen(false)} />}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
