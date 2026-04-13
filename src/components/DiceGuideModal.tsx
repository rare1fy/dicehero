/**
 * 骰子图鉴模态框
 */
import React, { useContext, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GameContext } from '../contexts/GameContext';
import { PixelClose } from './PixelIcons';
import { ALL_DICE, ELEMENT_EFFECT_DESC } from '../data/dice';
import { CLASS_DICE } from '../data/classes';
import { getDiceElementClass } from '../utils/uiHelpers';
import { formatDescription } from '../utils/richText';
import type { DiceDef } from '../types/game';

// 合并所有骰子（通用 + 全职业），用于图鉴展示
const getAllDiceForGuide = (): Record<string, DiceDef> => {
  const result = { ...ALL_DICE };
  Object.values(CLASS_DICE).forEach(diceList => {
    diceList.forEach(d => { result[d.id] = d; });
  });
  return result;
};

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

type CategoryId = 'all' | 'universal' | 'warrior' | 'mage' | 'rogue';

const CATEGORIES: { id: CategoryId; label: string; color: string }[] = [
  { id: 'all', label: '全部', color: 'var(--dungeon-text-bright)' },
  { id: 'universal', label: '通用', color: '#a0a8b8' },
  { id: 'warrior', label: '战士', color: '#c04040' },
  { id: 'mage', label: '法师', color: '#a070ff' },
  { id: 'rogue', label: '盗贼', color: '#60d080' },
];

// 已移交给职业的旧通用骰子ID，图鉴中不再展示
const LEGACY_DICE_IDS = new Set(['heavy', 'elemental']);

const getCategoryForDice = (def: DiceDef): CategoryId | null => {
  if (LEGACY_DICE_IDS.has(def.id)) return null; // 排除旧版，由职业版替代
  if (def.id.startsWith('w_')) return 'warrior';
  if (def.id.startsWith('mage_')) return 'mage';
  if (def.id.startsWith('r_')) return 'rogue';
  return 'universal';
};

export const DiceGuideModal: React.FC = () => {
  const { game, showDiceGuide, setShowDiceGuide } = useContext(GameContext);
  const [activeCategory, setActiveCategory] = useState<CategoryId>('all');

  const ownedIds = new Set((game.ownedDice || []).map(d => typeof d === 'string' ? d : d.defId));

  // 按分类+稀有度分组
  const getFilteredDice = (): { category: CategoryId; label: string; color: string; groups: Record<string, DiceDef[]> }[] => {
    const categoriesToShow = activeCategory === 'all'
      ? (['universal', 'warrior', 'mage', 'rogue'] as CategoryId[])
      : [activeCategory];

    return categoriesToShow.map(catId => {
      const catInfo = CATEGORIES.find(c => c.id === catId)!;
      const diceInCat = Object.values(getAllDiceForGuide()).filter(def => getCategoryForDice(def) === catId);
      const groups: Record<string, DiceDef[]> = {};
      diceInCat.forEach(def => {
        if (!groups[def.rarity]) groups[def.rarity] = [];
        groups[def.rarity].push(def);
      });
      return { category: catId, label: catInfo.label, color: catInfo.color, groups };
    });
  };

  const sections = getFilteredDice();

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
            <div className="p-4 border-b-3 border-[var(--dungeon-panel-border)] bg-[var(--dungeon-bg-light)]">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-bold text-[var(--dungeon-text-bright)] pixel-text-shadow">◆ 骰子图鉴 ◆</h3>
                <button onClick={() => setShowDiceGuide(false)} className="text-[var(--dungeon-text-dim)] hover:text-white"><PixelClose size={2} /></button>
              </div>
              {/* 分类标签栏 */}
              <div className="flex gap-1">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`px-2 py-1 text-[9px] font-bold border-2 transition-all ${
                      activeCategory === cat.id
                        ? 'border-current bg-[rgba(255,255,255,0.08)]'
                        : 'border-transparent opacity-50 hover:opacity-80'
                    }`}
                    style={{ color: cat.color, borderRadius: '2px' }}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="overflow-y-auto p-3 flex-1">
              {sections.map(section => {
                const hasAny = Object.values(section.groups).some(g => g.length > 0);
                if (!hasAny) return null;
                return (
                  <div key={section.category} className="mb-4">
                    {/* 分类标题（全部模式下显示） */}
                    {activeCategory === 'all' && (
                      <div className="text-xs font-black mb-2 px-1 py-1 border-b-2 border-[rgba(255,255,255,0.08)]" style={{ color: section.color }}>
                        ◆ {section.label}骰子
                      </div>
                    )}
                    {RARITY_ORDER.map(rarity => {
                      const diceList = section.groups[rarity];
                      if (!diceList || diceList.length === 0) return null;
                      return (
                        <div key={rarity} className="mb-2">
                          <div className={`text-[10px] font-bold mb-1 ${RARITY_COLORS[rarity]} pixel-text-shadow opacity-70`}>
                            {RARITY_LABELS[rarity]}
                          </div>
                          {diceList.map(def => {
                            const owned = ownedIds.has(def.id);
                            const ownedCount = (game.ownedDice || []).filter(d => (typeof d === 'string' ? d : d.defId) === def.id).length;
                            return (
                              <div key={def.id} className={`flex items-start gap-2 py-2 px-2 border-b border-[rgba(255,255,255,0.05)] ${!owned ? 'opacity-50' : ''}`}>
                                <div className={`flex-shrink-0 w-9 h-9 flex items-center justify-center text-sm font-bold ${getDiceElementClass(def.element, false, false, false, def.id)}`}>
                                  ?
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
