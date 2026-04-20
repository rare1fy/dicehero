import React from 'react';
import { PixelBook, PixelCards, PixelDiceIcon, PixelGem, PixelClaw, PixelRefresh } from './PixelIcons';
import { resetTutorial } from './TutorialOverlay';

/* ── 图鉴按钮 ── */
const GuideButton: React.FC<{ onClick: () => void; icon: React.ReactNode; label: string; hoverColor: string }> = ({ onClick, icon, label, hoverColor }) => (
  <button onClick={onClick}
    className={`flex flex-col items-center gap-1 py-2 px-1 bg-[var(--dungeon-bg)] border-2 border-[var(--dungeon-panel-border)] ${hoverColor} transition-colors`}
    style={{ borderRadius: '4px' }}>
    {icon}
    <span className="text-[8px] font-bold text-[var(--dungeon-text-dim)]">{label}</span>
  </button>
);

/* ── 图鉴入口网格 ── */
export const SettingsGuideSection: React.FC<{
  onOpenHandGuide?: () => void;
  onOpenDiceGuide?: () => void;
  onOpenRelicGuide?: () => void;
  onOpenEnemyGuide?: () => void;
  onOpenLog?: () => void;
  onResetTutorial?: () => void;
  onClose: () => void;
}> = ({ onOpenHandGuide, onOpenDiceGuide, onOpenRelicGuide, onOpenEnemyGuide, onOpenLog, onResetTutorial, onClose }) => (
  <div className="grid grid-cols-3 gap-1.5">
    {onOpenHandGuide && (
      <GuideButton onClick={() => { onOpenHandGuide(); onClose(); }} icon={<PixelCards size={2.5} />} label="牌型" hoverColor="hover:border-[var(--pixel-blue)] hover:bg-[rgba(60,108,200,0.08)]" />
    )}
    {onOpenDiceGuide && (
      <GuideButton onClick={() => { onOpenDiceGuide(); onClose(); }} icon={<PixelDiceIcon size={2.5} />} label="骰子" hoverColor="hover:border-[var(--pixel-green)] hover:bg-[rgba(60,200,100,0.08)]" />
    )}
    {onOpenRelicGuide && (
      <GuideButton onClick={() => { onOpenRelicGuide(); onClose(); }} icon={<PixelGem size={2.5} />} label="遗物" hoverColor="hover:border-[var(--pixel-purple)] hover:bg-[rgba(120,60,200,0.08)]" />
    )}
    {onOpenEnemyGuide && (
      <GuideButton onClick={() => { onOpenEnemyGuide(); onClose(); }} icon={<PixelClaw size={2.5} />} label="敌人" hoverColor="hover:border-[var(--pixel-red)] hover:bg-[rgba(200,60,60,0.08)]" />
    )}
    {onOpenLog && (
      <GuideButton onClick={() => { onOpenLog(); onClose(); }} icon={<PixelBook size={2.5} />} label="日志" hoverColor="hover:border-[var(--pixel-gold)] hover:bg-[rgba(212,160,48,0.08)]" />
    )}
    <button onClick={() => { resetTutorial(); onResetTutorial?.(); onClose(); }}
      className="flex flex-col items-center gap-1 py-2 px-1 bg-[var(--dungeon-bg)] border-2 border-[var(--dungeon-panel-border)] hover:border-[var(--dungeon-text-dim)] hover:bg-[rgba(255,255,255,0.04)] transition-colors"
      style={{ borderRadius: '4px' }}>
      <PixelRefresh size={2.5} />
      <span className="text-[8px] font-bold text-[var(--dungeon-text-dim)]">教程</span>
    </button>
  </div>
);
