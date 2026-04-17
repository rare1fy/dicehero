/**
 * CalcModal — 结果计算详情弹窗
 * ARCH-6: 从 DiceHeroGame.tsx 提取的独立UI组件
 */
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { Die, Enemy, GameState } from '../types/game';
import { PixelClose, PixelArrowDown, PixelArrowUp, PixelBloodDrop, PixelFlame, PixelZap, PixelMagic } from './PixelIcons';
import { PixelDiceRenderer } from './PixelDiceRenderer';
import { FURY_CONFIG } from '../config/gameBalance';
import { STATUS_INFO } from '../data/statusInfo';

interface CalcModalProps {
  visible: boolean;
  onClose: () => void;
  expectedOutcome: {
    bestHand: string;
    baseHandValue: number;
    handMultiplier: number;
    X: number;
    baseDamage: number;
    extraDamage: number;
    multiplier: number;
    pierceDamage: number;
    armorBreak: boolean;
    damage: number;
    armor: number;
    statusEffects: { type: string; value: number }[];
  } | null;
  selectedDice: Die[];
  game: GameState;
  targetEnemy: Enemy | null;
}

const CalcModal: React.FC<CalcModalProps> = ({ visible, onClose, expectedOutcome, selectedDice, game, targetEnemy }) => {
  if (!expectedOutcome) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/85"
          onClick={onClose}
        >
          <motion.div 
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            className="w-full max-w-sm pixel-panel overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-3 border-b-3 border-[var(--dungeon-panel-border)] flex justify-between items-center bg-[var(--dungeon-bg-light)]">
              <h3 className="text-[12px] font-bold text-[var(--dungeon-text-bright)] tracking-[0.1em] pixel-text-shadow">◆ 结果计算详情 ◆</h3>
              <button onClick={onClose} className="text-[var(--dungeon-text-dim)] hover:text-[var(--dungeon-text-bright)]">
                <PixelClose size={2} />
              </button>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[12px] text-[var(--dungeon-text-dim)]">激活牌型</span>
                <div className="flex items-center gap-2">
                  <span className="text-[12px] font-bold text-[var(--pixel-green)]">{expectedOutcome.bestHand}</span>
                  {game.handLevels[expectedOutcome.bestHand] > 1 && (
                    <span className="text-[10px] bg-[var(--pixel-green-dark)] text-[var(--pixel-green)] px-1 py-0.5 border border-[var(--pixel-green)] font-bold" style={{borderRadius:'2px'}}>Lv.{game.handLevels[expectedOutcome.bestHand]}</span>
                  )}
                  <span className="text-[10px] text-[var(--dungeon-text-dim)] font-mono">(基础 {expectedOutcome.baseHandValue} / 倍率 {Math.round(expectedOutcome.handMultiplier * 100)}%)</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[12px] text-[var(--dungeon-text-dim)]">选中骰子</span>
                <div className="flex gap-1">
                  {selectedDice.map((d, i) => (
                    <PixelDiceRenderer key={i} diceDefId={d.diceDefId} value={d.value} size={22} element={d.collapsedElement || (d.element !== 'normal' ? d.element : undefined)} />
                  ))}
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[12px] text-[var(--dungeon-text-dim)]">基础点数 (X)</span>
                <span className="text-[12px] font-bold text-[var(--dungeon-text-bright)]">{expectedOutcome.X}</span>
              </div>
              <div className="h-[2px] bg-[var(--dungeon-panel-border)]" />
              <div className="space-y-2">
                <div className="flex justify-between items-center text-[12px]">
                  <span className="text-[var(--dungeon-text-dim)]">牌型基础伤害 <span className="text-[10px] opacity-50">({expectedOutcome.baseHandValue} + {expectedOutcome.X}) × {Math.round(expectedOutcome.handMultiplier * 100)}%</span></span>
                  <span className="text-[var(--dungeon-text)]">{expectedOutcome.baseDamage}</span>
                </div>
                {expectedOutcome.extraDamage !== 0 && (
                  <div className="flex justify-between items-center text-[12px]">
                    <span className="text-[var(--dungeon-text-dim)]">加成伤害 <span className="text-[10px] opacity-50">× {Math.round(expectedOutcome.multiplier * 100)}%</span></span>
                    <span className="text-[var(--pixel-gold)]">+{expectedOutcome.extraDamage}</span>
                  </div>
                )}
                {expectedOutcome.pierceDamage > 0 && (
                  <div className="flex justify-between items-center text-[12px]">
                    <span className="text-[var(--dungeon-text-dim)]">穿透伤害</span>
                    <span className="text-[var(--pixel-purple)]">+{expectedOutcome.pierceDamage}</span>
                  </div>
                )}
                {expectedOutcome.armorBreak && (
                  <div className="flex justify-between items-center text-[12px]">
                    <span className="text-[var(--dungeon-text-dim)]">?? 破甲</span>
                    <span className="text-orange-400">摧毁护甲</span>
                  </div>
                )}
                {expectedOutcome.statusEffects?.filter(s => s.type === 'burn').length > 0 && (
                  <div className="flex justify-between items-center text-[12px]">
                    <span className="text-[var(--dungeon-text-dim)]">?? 灼烧</span>
                    <span className="text-orange-400">+{expectedOutcome.statusEffects.filter(s => s.type === 'burn').reduce((sum, s) => sum + s.value, 0)}</span>
                  </div>
                )}
                
                {/* Status Modifiers */}
                {game.statuses.find(s => s.type === 'weak') && (
                  <div className="flex justify-between items-center text-[12px]">
                    <span className="text-[var(--dungeon-text-dim)] flex items-center gap-1">
                      <PixelArrowDown size={1} /> 虚弱修正
                    </span>
                    <span className="text-[var(--dungeon-text-dim)]">-25%</span>
                  </div>
                )}
                {targetEnemy?.statuses.find(s => s.type === 'vulnerable') && (
                  <div className="flex justify-between items-center text-[12px]">
                    <span className="text-[var(--dungeon-text-dim)] flex items-center gap-1">
                      <PixelArrowUp size={1} /> 易伤修正
                    </span>
                    <span className="text-[var(--pixel-red)]">+50%</span>
                  </div>
                )}
                {/* 战士血怒加成（5层封顶） */}
                {game.playerClass === 'warrior' && (game.bloodRerollCount || 0) > 0 && (() => {
                  const furyStacks = Math.min(game.bloodRerollCount || 0, FURY_CONFIG.maxStack);
                  const atCap = (game.bloodRerollCount || 0) >= FURY_CONFIG.maxStack;
                  return (
                  <div className="flex justify-between items-center text-[12px]">
                    <span className="text-red-400 flex items-center gap-1">
                      <PixelBloodDrop size={1} /> 血怒({furyStacks}/{FURY_CONFIG.maxStack}层{atCap ? ' [已满]' : ''})
                    </span>
                    <span className="text-red-400">+{Math.round(furyStacks * FURY_CONFIG.damagePerStack * 100)}%</span>
                  </div>
                  );
                })()}
                {/* 战士狂暴本能 */}
                {game.playerClass === 'warrior' && (game.warriorRageMult || 0) > 0 && (
                  <div className="flex justify-between items-center text-[12px]">
                    <span className="text-red-400 flex items-center gap-1">
                      <PixelFlame size={1} /> 狂暴(受伤{Math.round((1 - game.hp / game.maxHp) * 100)}%)
                    </span>
                    <span className="text-red-400">+{Math.round((game.warriorRageMult || 0) * 100)}%</span>
                  </div>
                )}
                {/* 盗贼连击加成 */}
                {game.playerClass === 'rogue' && (game.comboCount || 0) >= 1 && (
                  <div className="flex justify-between items-center text-[12px]">
                    <span className="text-green-400 flex items-center gap-1">
                      <PixelZap size={1} /> 连击加成
                    </span>
                    <span className="text-green-400">+20%</span>
                  </div>
                )}
                {/* 法师过充加成 */}
                {game.playerClass === 'mage' && (game.mageOverchargeMult || 0) > 0 && (
                  <div className="flex justify-between items-center text-[12px]">
                    <span className="text-purple-400 flex items-center gap-1">
                      <PixelMagic size={1} /> 过充吟唱
                    </span>
                    <span className="text-purple-400">+{Math.round((game.mageOverchargeMult || 0) * 100)}%</span>
                  </div>
                )}

                <div className="flex justify-between items-center text-xs font-bold border-t-2 border-[var(--dungeon-panel-border)] pt-2">
                  <span className="text-[var(--dungeon-text-bright)]">最终总伤害</span>
                  <span className="text-[var(--pixel-red)] pixel-text-shadow">{expectedOutcome.damage}</span>
                </div>
                {expectedOutcome.armor > 0 && (
                  <div className="flex justify-between items-center text-xs font-bold pt-1">
                    <span className="text-[var(--dungeon-text-bright)]">获得护甲</span>
                    <span className="text-[var(--pixel-blue)] pixel-text-shadow">+{expectedOutcome.armor}</span>
                  </div>
                )}
              </div>
              
              {expectedOutcome.statusEffects.length > 0 && (
                <div className="pt-3 space-y-2">
                  <div className="text-[11px] font-bold text-[var(--dungeon-text-dim)] tracking-[0.1em]">附加效果</div>
                  <div className="flex flex-wrap gap-2">
                    {expectedOutcome.statusEffects.map((s, i) => {
                      const info = STATUS_INFO[s.type];
                      return (
                        <div key={i} className={`flex items-center gap-1 px-2 py-1 bg-[var(--dungeon-bg)] border border-[var(--dungeon-panel-border)] ${info.color}`} style={{borderRadius:'2px'}}>
                          {info.icon}
                          <span className="text-[11px] font-bold">{info.label} +{s.value}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CalcModal;
