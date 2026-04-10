/**
 * 骰子图鉴模态框
 */
import React, { useContext } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GameContext } from '../contexts/GameContext';
import { PixelClose } from './PixelIcons';
import { ALL_DICE, ELEMENT_EFFECT_DESC } from '../data/dice';
import { getDiceElementClass } from '../utils/uiHelpers';
import { formatDescription } from '../utils/richText';
import type { DiceDef } from '../types/game';

const RARITY_COLORS: Record<string, string> = {
  common: 'text-gray-400',
  uncommon: 'text-green-400',
  rare: 'text-blue-400',
  legendary: 'text-yellow-400',
  curse: 'text-purple-400',
};

const RARITY_LABELS: Record<string, string> = {
  common: '普通',
  uncommon: '进阶',
  rare: '稀有',
  legendary: '传说',
  curse: '诅咒',
};

const RARITY_ORDER = ['common', 'uncommon', 'rare', 'legendary', 'curse'];

export const DiceGuideModal: React.FC = () => {
  const { game, showDiceGuide, setShowDiceGuide } = useContext(GameContext);

  const ownedIds = new Set((game.ownedDice || []).map(d => typeof d === 'string' ? d : d.defId));

  const groupedDice: Record<string, DiceDef[]> = {};
  Object.values(ALL_DICE).forEach(def => {
    if (!groupedDice[def.rarity]) groupedDice[def.rarity] = [];
    groupedDice[def.rarity].push(def);
  });

  return (
    <AnimatePresence>
      {showDiceGuide && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-black/85 flex items-center justify-center p-4"
          onClick={() => setShowDiceGuide(false)}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="pixel-panel w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-4 border-b-3 border-[var(--dungeon-panel-border)] flex justify-between items-center bg-[var(--dungeon-bg-light)]">
              <h3 className="text-sm font-bold text-[var(--dungeon-text-bright)] pixel-text-shadow">◆ 骰子图鉴 ◆</h3>
              <button onClick={() => setShowDiceGuide(false)} className="text-[var(--dungeon-text-dim)] hover:text-white"><PixelClose size={2} /></button>
            </div>
            <div className="overflow-y-auto p-3 flex-1">
              {RARITY_ORDER.map(rarity => {
                const diceList = groupedDice[rarity];
                if (!diceList || diceList.length === 0) return null;
                return (
                  <div key={rarity} className="mb-3">
                    <div className={`text-xs font-bold mb-1.5 ${RARITY_COLORS[rarity]} pixel-text-shadow`}>
                      ── {RARITY_LABELS[rarity]} ──
                    </div>
                    {diceList.map(def => {
                      const owned = ownedIds.has(def.id);
                      const ownedCount = (game.ownedDice || []).filter(d => (typeof d === 'string' ? d : d.defId) === def.id).length;
                      return (
                        <div key={def.id} className={`flex items-start gap-2 py-2 px-2 border-b border-[rgba(255,255,255,0.05)] ${!owned ? 'opacity-50' : ''}`}>
                          <div className={`flex-shrink-0 w-9 h-9 flex items-center justify-center text-sm font-bold ${getDiceElementClass(def.element, false, false, false, def.id)}`}>
                            {def.faces[Math.floor(def.faces.length / 2)]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className={`text-xs font-bold ${RARITY_COLORS[def.rarity]}`}>{def.name}</span>
                              {owned && <span className="text-[10px] text-[var(--pixel-green)] opacity-70">×{ownedCount}</span>}
                            </div>
                            <div className="text-[10px] text-[var(--dungeon-text-dim)] mt-0.5 leading-tight">{formatDescription(def.description)}</div>
                            <div className="text-[10px] text-[var(--dungeon-text-dim)] mt-0.5 opacity-60">
                              面: [{def.faces.join(', ')}]
                            </div>
                            {def.isElemental && (
                              <div className="text-[10px] text-[var(--pixel-cyan)] mt-0.5">
                                ⚡ 元素效果：抽到时随机坍缩
                              </div>
                            )}
                            {def.onPlay && (
                              <div className="text-[10px] text-[var(--pixel-gold)] mt-0.5">
                                ⚔ 出牌效果：
                                {def.onPlay.bonusDamage ? ` 伤害+${def.onPlay.bonusDamage}` : ''}
                                {def.onPlay.bonusMult ? ` 倍率×${def.onPlay.bonusMult}` : ''}
                                {def.onPlay.heal ? ` 回复${def.onPlay.heal}HP` : ''}
                                {def.onPlay.selfDamage ? ` 自伤${def.onPlay.selfDamage}` : ''}
                              </div>
                            )}
                            {def.id === 'split' && (
                              <div className="text-[10px] text-[var(--pixel-cyan)] mt-0.5">
                                ✦ 结算时分裂出一颗随机点数骰子
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}

              <div className="mt-3 pt-3 border-t border-[rgba(255,255,255,0.1)]">
                <div className="text-xs font-bold text-[var(--pixel-cyan)] mb-1.5 pixel-text-shadow">
                  ── 元素效果 ──
                </div>
                {Object.entries(ELEMENT_EFFECT_DESC).map(([elem, desc]) => (
                  <div key={elem} className="flex items-start gap-1.5 py-1 text-[10px]">
                    <span className={`font-bold ${
                      elem === 'fire' ? 'text-red-400' :
                      elem === 'ice' ? 'text-blue-300' :
                      elem === 'thunder' ? 'text-yellow-300' :
                      elem === 'poison' ? 'text-purple-400' :
                      'text-yellow-200'
                    }`}>
                      {elem === 'fire' ? '火' : elem === 'ice' ? '冰' : elem === 'thunder' ? '雷' : elem === 'poison' ? '毒' : '圣'}
                    </span>
                    <span className="text-[var(--dungeon-text-dim)]">{formatDescription(desc)}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
