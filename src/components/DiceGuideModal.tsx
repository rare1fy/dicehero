/**
 * 骰子图鉴模态框
 */
import React, { useContext, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GameContext } from '../contexts/GameContext';
import { PixelClose } from './PixelIcons';
import { ALL_DICE } from '../data/dice';
import { CLASS_DICE } from '../data/classes';
import {
  CATEGORIES,
  RARITY_ORDER,
  RARITY_COLORS,
  getCategoryForDice,
  type GuideSection,
  type CategoryId,
} from './DiceGuideList';
import { DiceGuideList } from './DiceGuideList';

// 合并所有骰子（通用 + 全职业），用于图鉴展示
const getAllDiceForGuide = (): Record<string, DiceDef> => {
  const result = { ...ALL_DICE };
  Object.values(CLASS_DICE).forEach(diceList => {
    diceList.forEach(d => { result[d.id] = d; });
  });
  return result;
};

export const DiceGuideModal: React.FC = () => {
  const { game, showDiceGuide, setShowDiceGuide } = useContext(GameContext);
  const [activeCategory, setActiveCategory] = useState<CategoryId>('all');

  const ownedIds = new Set((game.ownedDice || []).map(d => typeof d === 'string' ? d : d.defId));

  // 按分类+稀有度分组
  const getFilteredDice = (): GuideSection[] => {
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
              <DiceGuideList sections={sections} activeCategory={activeCategory} ownedIds={ownedIds} game={game} />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
