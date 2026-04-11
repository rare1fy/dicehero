import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PixelGear, PixelVolume, PixelMute, PixelMusic, PixelClose, PixelBook, PixelCards, PixelDiceIcon, PixelGem, PixelClaw, PixelRefresh } from './PixelIcons';
import { 
  getMasterVolume, setMasterVolume, 
  isSfxEnabled, setSfxEnabled, 
  isBgmEnabled, setBgmEnabled 
} from '../utils/sound';
import { resetTutorial } from './TutorialOverlay';
import { useGameContext } from '../contexts/GameContext';
import { ALL_RELICS } from '../data/relics';
import { ALL_DICE } from '../data/dice';

interface SettingsPanelProps {
  onResetTutorial?: () => void;
  onOpenHandGuide?: () => void;
  onOpenDiceGuide?: () => void;
  onOpenRelicGuide?: () => void;
  onOpenEnemyGuide?: () => void;
  onOpenLog?: () => void;
}

const RARITY_COLORS: Record<string, string> = {
  common: 'var(--dungeon-text-dim)',
  uncommon: 'var(--pixel-green)',
  rare: 'var(--pixel-blue)',
  legendary: 'var(--pixel-gold)',
  curse: 'var(--pixel-red)',
};

const RARITY_LABELS: Record<string, string> = {
  common: '普通', uncommon: '稀有', rare: '史诗', legendary: '传说', curse: '诅咒',
};

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ onResetTutorial, onOpenHandGuide, onOpenDiceGuide, onOpenRelicGuide, onOpenEnemyGuide, onOpenLog }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [volume, setVolume] = useState(getMasterVolume());
  const [sfx, setSfx] = useState(isSfxEnabled());
  const [bgm, setBgm] = useState(isBgmEnabled());
  const [showGM, setShowGM] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [gmSubPanel, setGmSubPanel] = useState<'none' | 'addRelic' | 'removeRelic' | 'addDice' | 'removeDice'>('none');
  const [gmFilter, setGmFilter] = useState('');
  const { game, setGame, addToast } = useGameContext();

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

                {/* 图鉴入口 — 紧凑图标网格 */}
                <div className="grid grid-cols-3 gap-1.5">
                  {onOpenHandGuide && (
                    <button onClick={() => { onOpenHandGuide(); setIsOpen(false); }}
                      className="flex flex-col items-center gap-1 py-2 px-1 bg-[var(--dungeon-bg)] border-2 border-[var(--dungeon-panel-border)] hover:border-[var(--pixel-blue)] hover:bg-[rgba(60,108,200,0.08)] transition-colors"
                      style={{ borderRadius: '4px' }}>
                      <PixelCards size={2.5} />
                      <span className="text-[8px] font-bold text-[var(--dungeon-text-dim)]">牌型</span>
                    </button>
                  )}
                  {onOpenDiceGuide && (
                    <button onClick={() => { onOpenDiceGuide(); setIsOpen(false); }}
                      className="flex flex-col items-center gap-1 py-2 px-1 bg-[var(--dungeon-bg)] border-2 border-[var(--dungeon-panel-border)] hover:border-[var(--pixel-green)] hover:bg-[rgba(60,200,100,0.08)] transition-colors"
                      style={{ borderRadius: '4px' }}>
                      <PixelDiceIcon size={2.5} />
                      <span className="text-[8px] font-bold text-[var(--dungeon-text-dim)]">骰子</span>
                    </button>
                  )}
                  {onOpenRelicGuide && (
                    <button onClick={() => { onOpenRelicGuide(); setIsOpen(false); }}
                      className="flex flex-col items-center gap-1 py-2 px-1 bg-[var(--dungeon-bg)] border-2 border-[var(--dungeon-panel-border)] hover:border-[var(--pixel-purple)] hover:bg-[rgba(120,60,200,0.08)] transition-colors"
                      style={{ borderRadius: '4px' }}>
                      <PixelGem size={2.5} />
                      <span className="text-[8px] font-bold text-[var(--dungeon-text-dim)]">遗物</span>
                    </button>
                  )}
                  {onOpenEnemyGuide && (
                    <button onClick={() => { onOpenEnemyGuide(); setIsOpen(false); }}
                      className="flex flex-col items-center gap-1 py-2 px-1 bg-[var(--dungeon-bg)] border-2 border-[var(--dungeon-panel-border)] hover:border-[var(--pixel-red)] hover:bg-[rgba(200,60,60,0.08)] transition-colors"
                      style={{ borderRadius: '4px' }}>
                      <PixelClaw size={2.5} />
                      <span className="text-[8px] font-bold text-[var(--dungeon-text-dim)]">敌人</span>
                    </button>
                  )}
                  {onOpenLog && (
                    <button onClick={() => { onOpenLog(); setIsOpen(false); }}
                      className="flex flex-col items-center gap-1 py-2 px-1 bg-[var(--dungeon-bg)] border-2 border-[var(--dungeon-panel-border)] hover:border-[var(--pixel-gold)] hover:bg-[rgba(212,160,48,0.08)] transition-colors"
                      style={{ borderRadius: '4px' }}>
                      <PixelBook size={2.5} />
                      <span className="text-[8px] font-bold text-[var(--dungeon-text-dim)]">日志</span>
                    </button>
                  )}
                  <button onClick={() => { resetTutorial(); onResetTutorial?.(); setIsOpen(false); }}
                    className="flex flex-col items-center gap-1 py-2 px-1 bg-[var(--dungeon-bg)] border-2 border-[var(--dungeon-panel-border)] hover:border-[var(--dungeon-text-dim)] hover:bg-[rgba(255,255,255,0.04)] transition-colors"
                    style={{ borderRadius: '4px' }}>
                    <PixelRefresh size={2.5} />
                    <span className="text-[8px] font-bold text-[var(--dungeon-text-dim)]">教程</span>
                  </button>
                </div>

                {/* 存档功能 */}
                <div className="h-[2px] bg-[var(--dungeon-panel-border)]" />
                <button
                  onClick={() => {
                    try {
                      const saveData = JSON.stringify(game);
                      localStorage.setItem('dicehero_save', saveData);
                      addToast('✅ 存档成功！', 'buff');
                    } catch (e) {
                      addToast('存档失败', 'damage');
                    }
                  }}
                  className="w-full py-2 pixel-btn pixel-btn-ghost text-[10px] flex items-center justify-center gap-2 text-[var(--pixel-green)]"
                >
                  ◆ 保存存档
                </button>

                {/* 清空游戏数据 */}
                <div className="h-[2px] bg-[var(--dungeon-panel-border)]" />
                {!showClearConfirm ? (
                  <button
                    onClick={() => setShowClearConfirm(true)}
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
                      <button
                        onClick={() => setShowClearConfirm(false)}
                        className="flex-1 py-1.5 pixel-btn pixel-btn-ghost text-[9px]"
                      >
                        取消
                      </button>
                      <button
                        onClick={() => {
                          localStorage.clear();
                          window.location.reload();
                        }}
                        className="flex-1 py-1.5 pixel-btn pixel-btn-danger text-[9px]"
                      >
                        确认清空
                      </button>
                    </div>
                  </div>
                )}

                {/* GM 调试面板 */}
                <div className="h-[2px] bg-[var(--dungeon-panel-border)]" />
                <button
                  onClick={() => setShowGM(!showGM)}
                  className="w-full py-2 pixel-btn pixel-btn-ghost text-[10px] flex items-center justify-center gap-2 text-[var(--pixel-red)]"
                >
                  ⚙ GM 调试工具 {showGM ? '▲' : '▼'}
                </button>
                {showGM && (
                  <div className="space-y-2 p-2 bg-[var(--dungeon-bg)] border border-[var(--pixel-red-dark)]" style={{ borderRadius: '4px' }}>
                    <div className="text-[8px] text-[var(--pixel-red)] text-center font-bold mb-1">— 调试功能 —</div>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button onClick={() => { setGame(p => ({ ...p, hp: p.maxHp })); addToast('GM: 满血'); }}
                        className="py-1.5 text-[9px] font-bold bg-[var(--pixel-green-dark)] text-[var(--pixel-green-light)] border border-[var(--pixel-green)]" style={{ borderRadius: '4px' }}>
                        ❤ 满血
                      </button>
                      <button onClick={() => { setGame(p => ({ ...p, souls: p.souls + 500 })); addToast('GM: +500金'); }}
                        className="py-1.5 text-[9px] font-bold bg-[var(--pixel-gold-dark)] text-[var(--pixel-gold-light)] border border-[var(--pixel-gold)]" style={{ borderRadius: '4px' }}>
                        💰 +500金
                      </button>
                      <button onClick={() => { setGame(p => ({ ...p, blackMarketQuota: (p.blackMarketQuota || 0) + 100 })); addToast('GM: +100魂晶'); }}
                        className="py-1.5 text-[9px] font-bold bg-[var(--pixel-purple-dark)] text-[var(--pixel-purple-light)] border border-[var(--pixel-purple)]" style={{ borderRadius: '4px' }}>
                        💎 +100魂晶
                      </button>
                      <button onClick={() => { setGame(p => ({ ...p, maxHp: p.maxHp + 50, hp: p.hp + 50 })); addToast('GM: +50最大HP'); }}
                        className="py-1.5 text-[9px] font-bold bg-[var(--pixel-red-dark)] text-[var(--pixel-red-light)] border border-[var(--pixel-red)]" style={{ borderRadius: '4px' }}>
                        ♥ +50血上限
                      </button>
                    </div>
                    <div className="text-[8px] text-[var(--dungeon-text-dim)] text-center mt-1">传送到指定层</div>
                    <div className="grid grid-cols-2 gap-1">
                      {[
                        { label: '中Boss(7)', depth: 7 },
                        { label: '终Boss(14)', depth: 14 },
                      ].map(tp => (
                        <button key={tp.depth} onClick={() => {
                          const prevDepth = tp.depth - 1;
                          const prevNode = game.map.find(n => n.depth === prevDepth);
                          if (prevNode) {
                            setGame(p => ({
                              ...p,
                              map: p.map.map(n => n.depth <= prevDepth
                                ? { ...n, completed: true }
                                : n
                              ),
                              currentNodeId: prevNode.id,
                              phase: 'map',
                            }));
                            addToast(`GM: 传送到 ${tp.label}`);
                          } else {
                            addToast('GM: 找不到目标节点');
                          }
                          setIsOpen(false);
                        }}
                          className="py-1.5 text-[8px] font-bold bg-[var(--dungeon-panel)] text-[var(--pixel-orange-light)] border border-[var(--pixel-orange)]" style={{ borderRadius: '4px' }}>
                          {tp.label}
                        </button>
                      ))}
                    </div>
                    <div className="grid grid-cols-2 gap-1.5 mt-1">
                      <button onClick={() => { setGame(p => ({ ...p, playsLeft: 99, maxPlays: 99 })); addToast('GM: 99次出牌'); }}
                        className="py-1.5 text-[9px] font-bold bg-[var(--dungeon-panel)] text-[var(--pixel-cyan-light)] border border-[var(--pixel-cyan)]" style={{ borderRadius: '4px' }}>
                        🎲 99出牌
                      </button>
                      <button onClick={() => { setGame(p => ({ ...p, freeRerollsLeft: 99, freeRerollsPerTurn: 99 })); addToast('GM: 99重掷'); }}
                        className="py-1.5 text-[9px] font-bold bg-[var(--dungeon-panel)] text-[var(--pixel-cyan-light)] border border-[var(--pixel-cyan)]" style={{ borderRadius: '4px' }}>
                        🔄 99重掷
                      </button>
                    </div>
                    <div className="grid grid-cols-1 gap-1.5 mt-1">
                      <button onClick={() => {
                        if (game.phase === 'battle') {
                          setGame(p => ({ ...p, gmKillWave: Date.now() } as any));
                          addToast('GM: 杀死当前波次敌人');
                        } else {
                          addToast('GM: 当前不在战斗中');
                        }
                      }}
                        className="py-1.5 text-[9px] font-bold bg-[var(--pixel-red-dark)] text-[var(--pixel-red-light)] border border-[var(--pixel-red)]" style={{ borderRadius: '4px' }}>
                        💀 杀死当前波次
                      </button>
                    </div>
                    <div className="text-[8px] text-[var(--dungeon-text-dim)] text-center mt-2">战斗/章节</div>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button onClick={() => {
                        if (game.phase === 'battle') {
                          setGame(p => ({
                            ...p,
                            map: p.map.map(n => n.id === p.currentNodeId ? { ...n, completed: true } : n),
                            phase: 'loot',
                            isEnemyTurn: false,
                          }));
                          addToast('GM: 战斗胜利');
                        } else {
                          addToast('GM: 当前不在战斗中');
                        }
                        setIsOpen(false);
                      }}
                        className="py-1.5 text-[9px] font-bold bg-[var(--pixel-gold-dark)] text-[var(--pixel-gold-light)] border border-[var(--pixel-gold)]" style={{ borderRadius: '4px' }}>
                        ⚔ 立即胜利
                      </button>
                      <button onClick={() => {
                        setGame(p => ({
                          ...p,
                          map: p.map.map(n => ({ ...n, completed: true })),
                          phase: 'chapterTransition' as any,
                          isEnemyTurn: false,
                        }));
                        addToast('GM: 跳到下一大关');
                        setIsOpen(false);
                      }}
                        className="py-1.5 text-[9px] font-bold bg-[var(--pixel-orange-dark)] text-[var(--pixel-orange-light)] border border-[var(--pixel-orange)]" style={{ borderRadius: '4px' }}>
                        ⏭ 跨大关
                      </button>
                    </div>

                    {/* === 遗物管理 === */}
                    <div className="text-[8px] text-[var(--dungeon-text-dim)] text-center mt-2">遗物管理</div>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button onClick={() => { setGmSubPanel(gmSubPanel === 'addRelic' ? 'none' : 'addRelic'); setGmFilter(''); }}
                        className={`py-1.5 text-[9px] font-bold border ${gmSubPanel === 'addRelic' ? 'bg-[var(--pixel-green)] text-black border-[var(--pixel-green)]' : 'bg-[var(--dungeon-panel)] text-[var(--pixel-green-light)] border-[var(--pixel-green)]'}`} style={{ borderRadius: '4px' }}>
                        + 添加遗物
                      </button>
                      <button onClick={() => { setGmSubPanel(gmSubPanel === 'removeRelic' ? 'none' : 'removeRelic'); }}
                        className={`py-1.5 text-[9px] font-bold border ${gmSubPanel === 'removeRelic' ? 'bg-[var(--pixel-red)] text-black border-[var(--pixel-red)]' : 'bg-[var(--dungeon-panel)] text-[var(--pixel-red-light)] border-[var(--pixel-red)]'}`} style={{ borderRadius: '4px' }}>
                        - 移除遗物
                      </button>
                    </div>

                    {/* 添加遗物子面板 */}
                    {gmSubPanel === 'addRelic' && (
                      <div className="border border-[var(--pixel-green-dark)] p-1.5 space-y-1" style={{ borderRadius: '4px', maxHeight: '200px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                        <input
                          type="text" placeholder="搜索遗物名..."
                          value={gmFilter} onChange={e => setGmFilter(e.target.value)}
                          className="w-full px-2 py-1 text-[9px] bg-[var(--dungeon-bg)] text-[var(--dungeon-text)] border border-[var(--dungeon-panel-border)] outline-none"
                          style={{ borderRadius: '3px', flexShrink: 0 }}
                        />
                        <div style={{ flex: 1, overflowY: 'auto', minHeight: 0, WebkitOverflowScrolling: 'touch', touchAction: 'pan-y', overscrollBehavior: 'contain' } as any}>
                          {Object.values(ALL_RELICS)
                            .filter(r => !gmFilter || r.name.includes(gmFilter) || r.id.includes(gmFilter))
                            .map(relic => {
                              const owned = game.relics.some(r => r.id === relic.id);
                              return (
                                <button key={relic.id} onClick={() => {
                                  if (owned) { addToast('已拥有该遗物'); return; }
                                  setGame(p => ({ ...p, relics: [...p.relics, { ...relic }] }));
                                  addToast(`GM: +遗物「${relic.name}」`, 'buff');
                                }}
                                  className="w-full text-left px-1.5 py-1 text-[8px] flex items-center gap-1 hover:bg-[rgba(255,255,255,0.05)] transition-colors"
                                  style={{ opacity: owned ? 0.4 : 1 }}
                                >
                                  <span style={{ color: RARITY_COLORS[relic.rarity] || '#888', fontWeight: 'bold', minWidth: '24px' }}>
                                    [{RARITY_LABELS[relic.rarity] || '?'}]
                                  </span>
                                  <span className="text-[var(--dungeon-text)]">{relic.name}</span>
                                  {owned && <span className="ml-auto text-[var(--pixel-green)]" style={{ fontSize: '7px' }}>已有</span>}
                                </button>
                              );
                            })}
                        </div>
                      </div>
                    )}

                    {/* 移除遗物子面板 */}
                    {gmSubPanel === 'removeRelic' && (
                      <div className="border border-[var(--pixel-red-dark)] p-1.5 space-y-1" style={{ borderRadius: '4px', maxHeight: '200px', overflowY: 'auto', WebkitOverflowScrolling: 'touch', touchAction: 'pan-y', overscrollBehavior: 'contain' } as any}>
                        {game.relics.length === 0 ? (
                          <div className="text-[8px] text-[var(--dungeon-text-dim)] text-center py-2">当前没有遗物</div>
                        ) : game.relics.map((relic, idx) => (
                          <button key={`${relic.id}_${idx}`} onClick={() => {
                            setGame(p => ({ ...p, relics: p.relics.filter((_, i) => i !== idx) }));
                            addToast(`GM: 移除遗物「${relic.name}」`);
                          }}
                            className="w-full text-left px-1.5 py-1 text-[8px] flex items-center gap-1 hover:bg-[rgba(255,0,0,0.08)] transition-colors"
                          >
                            <span style={{ color: RARITY_COLORS[relic.rarity] || '#888', fontWeight: 'bold', minWidth: '24px' }}>
                              [{RARITY_LABELS[relic.rarity] || '?'}]
                            </span>
                            <span className="text-[var(--dungeon-text)] flex-1">{relic.name}</span>
                            <span className="text-[var(--pixel-red)] font-bold">×</span>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* === 骰子管理 === */}
                    <div className="text-[8px] text-[var(--dungeon-text-dim)] text-center mt-2">骰子管理</div>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button onClick={() => { setGmSubPanel(gmSubPanel === 'addDice' ? 'none' : 'addDice'); }}
                        className={`py-1.5 text-[9px] font-bold border ${gmSubPanel === 'addDice' ? 'bg-[var(--pixel-cyan)] text-black border-[var(--pixel-cyan)]' : 'bg-[var(--dungeon-panel)] text-[var(--pixel-cyan-light)] border-[var(--pixel-cyan)]'}`} style={{ borderRadius: '4px' }}>
                        + 添加骰子
                      </button>
                      <button onClick={() => { setGmSubPanel(gmSubPanel === 'removeDice' ? 'none' : 'removeDice'); }}
                        className={`py-1.5 text-[9px] font-bold border ${gmSubPanel === 'removeDice' ? 'bg-[var(--pixel-red)] text-black border-[var(--pixel-red)]' : 'bg-[var(--dungeon-panel)] text-[var(--pixel-red-light)] border-[var(--pixel-red)]'}`} style={{ borderRadius: '4px' }}>
                        - 移除骰子
                      </button>
                    </div>

                    {/* 添加骰子子面板 */}
                    {gmSubPanel === 'addDice' && (
                      <div className="border border-[var(--pixel-cyan-dark)] p-1.5 space-y-1" style={{ borderRadius: '4px', maxHeight: '180px', overflowY: 'auto', WebkitOverflowScrolling: 'touch', touchAction: 'pan-y', overscrollBehavior: 'contain' } as any}>
                        {Object.values(ALL_DICE).map(diceDef => (
                          <button key={diceDef.id} onClick={() => {
                            setGame(p => ({
                              ...p,
                              ownedDice: [...p.ownedDice, { defId: diceDef.id, level: 1 }],
                              diceBag: [...p.diceBag, diceDef.id],
                            }));
                            addToast(`GM: +骰子「${diceDef.name}」`, 'buff');
                          }}
                            className="w-full text-left px-1.5 py-1 text-[8px] flex items-center gap-1 hover:bg-[rgba(255,255,255,0.05)] transition-colors"
                          >
                            <span style={{ color: RARITY_COLORS[diceDef.rarity] || '#888', fontWeight: 'bold', minWidth: '24px' }}>
                              [{RARITY_LABELS[diceDef.rarity] || '?'}]
                            </span>
                            <span className="text-[var(--dungeon-text)]">{diceDef.name}</span>
                            <span className="ml-auto text-[var(--dungeon-text-dim)]" style={{ fontSize: '7px' }}>[{diceDef.faces.join(',')}]</span>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* 移除骰子子面板 */}
                    {gmSubPanel === 'removeDice' && (
                      <div className="border border-[var(--pixel-red-dark)] p-1.5 space-y-1" style={{ borderRadius: '4px', maxHeight: '180px', overflowY: 'auto', WebkitOverflowScrolling: 'touch', touchAction: 'pan-y', overscrollBehavior: 'contain' } as any}>
                        {game.ownedDice.length === 0 ? (
                          <div className="text-[8px] text-[var(--dungeon-text-dim)] text-center py-2">骰子库为空</div>
                        ) : (() => {
                          const counts: Record<string, { count: number; name: string; rarity: string; faces: number[] }> = {};
                          game.ownedDice.forEach(od => {
                            const def = ALL_DICE[od.defId];
                            if (!counts[od.defId]) counts[od.defId] = { count: 0, name: def?.name || od.defId, rarity: def?.rarity || 'common', faces: def?.faces || [] };
                            counts[od.defId].count++;
                          });
                          return Object.entries(counts).map(([defId, info]) => (
                            <button key={defId} onClick={() => {
                              setGame(p => {
                                const idx = p.ownedDice.findIndex(od => od.defId === defId);
                                if (idx < 0) return p;
                                const newOwned = [...p.ownedDice];
                                newOwned.splice(idx, 1);
                                let removed = false;
                                const newBag = p.diceBag.filter(id => {
                                  if (!removed && id === defId) { removed = true; return false; }
                                  return true;
                                });
                                return { ...p, ownedDice: newOwned, diceBag: newBag };
                              });
                              addToast(`GM: 移除骰子「${info.name}」`);
                            }}
                              className="w-full text-left px-1.5 py-1 text-[8px] flex items-center gap-1 hover:bg-[rgba(255,0,0,0.08)] transition-colors"
                            >
                              <span style={{ color: RARITY_COLORS[info.rarity] || '#888', fontWeight: 'bold', minWidth: '24px' }}>
                                [{RARITY_LABELS[info.rarity] || '?'}]
                              </span>
                              <span className="text-[var(--dungeon-text)] flex-1">{info.name}</span>
                              <span className="text-[var(--pixel-orange)] font-mono" style={{ fontSize: '8px' }}>×{info.count}</span>
                              <span className="text-[var(--pixel-red)] font-bold ml-1">×</span>
                            </button>
                          ));
                        })()}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
