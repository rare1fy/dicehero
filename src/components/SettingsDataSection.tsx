import React from 'react';
import type { GameContextType } from '../contexts/GameContext';

/* ── 存档按钮 ── */
const SaveButton: React.FC<{ game: GameContextType['game']; addToast: GameContextType['addToast'] }> = ({ game, addToast }) => (
  <button
    onClick={() => {
      try {
        const saveData = JSON.stringify(game);
        localStorage.setItem('dicehero_save', saveData);
        addToast('✅ 存档成功！', 'buff');
      } catch {
        addToast('存档失败', 'damage');
      }
    }}
    className="w-full py-2 pixel-btn pixel-btn-ghost text-[10px] flex items-center justify-center gap-2 text-[var(--pixel-green)]"
  >
    ◆ 保存存档
  </button>
);

/* ── 清空数据按钮 ── */
const ClearDataButton: React.FC<{ showConfirm: boolean; setShowConfirm: (v: boolean) => void }> = ({ showConfirm, setShowConfirm }) => (
  <>
    {!showConfirm ? (
      <button
        onClick={() => setShowConfirm(true)}
        className="w-full py-2 pixel-btn pixel-btn-ghost text-[10px] flex items-center justify-center gap-2 text-[var(--pixel-red)]"
      >
        ✖ 清空游戏数据
      </button>
    ) : (
      <div className="p-2 bg-[rgba(200,40,30,0.1)] border border-[var(--pixel-red-dark)]" style={{ borderRadius: '2px' }}>
        <div className="text-[10px] text-[var(--pixel-red)] font-bold text-center mb-2">
          确定要清空所有游戏数据吗？
        </div>
        <div className="text-[8px] text-[var(--dungeon-text-dim)] text-center mb-2">
          魂晶、解锁的遗物、教程进度将全部重置
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowConfirm(false)} className="flex-1 py-1.5 pixel-btn pixel-btn-ghost text-[9px]">取消</button>
          <button
            onClick={() => { localStorage.clear(); window.location.reload(); }}
            className="flex-1 py-1.5 pixel-btn pixel-btn-danger text-[9px]"
          >确认清空</button>
        </div>
      </div>
    )}
  </>
);

/* ── 数据管理区（存档 + 清空） ── */
export const SettingsDataSection: React.FC<{
  game: GameContextType['game'];
  addToast: GameContextType['addToast'];
  showClearConfirm: boolean;
  setShowClearConfirm: (v: boolean) => void;
}> = ({ game, addToast, showClearConfirm, setShowClearConfirm }) => (
  <>
    <SaveButton game={game} addToast={addToast} />
    <div className="h-[2px] bg-[var(--dungeon-panel-border)]" />
    <ClearDataButton showConfirm={showClearConfirm} setShowConfirm={setShowClearConfirm} />
  </>
);
