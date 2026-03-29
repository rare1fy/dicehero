import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { getDiceDef } from '../data/dice';
import { ElementBadge, RARITY_COLORS, RARITY_LABELS, RARITY_TEXT_COLORS } from './PixelDiceShapes';
import { ELEMENT_NAMES, ELEMENT_COLORS } from '../utils/uiHelpers';
import { PixelDice } from './PixelIcons';

interface DiceBagPanelProps {
  ownedDice: string[];
  diceBag: string[];
  discardPile: string[];
}

/**
 * DiceBagPanel - 骰子库/弃骰库信息面板
 * 
 * 战斗界面左上角显示骰子库和弃骰库数量，
 * 点击可展开查看详细骰子列表。
 */
export const DiceBagPanel: React.FC<DiceBagPanelProps> = ({ ownedDice, diceBag, discardPile }) => {
  const [expanded, setExpanded] = useState(false);

  // 统计骰子数量
  const countDice = (ids: string[]) => {
    const counts: Record<string, number> = {};
    ids.forEach(id => { counts[id] = (counts[id] || 0) + 1; });
    return counts;
  };

  const bagCounts = countDice(diceBag);
  const discardCounts = countDice(discardPile);
  const ownedCounts = countDice(ownedDice);

  return (
    <>
      {/* 紧凑指示器 */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 px-1.5 py-0.5 bg-[var(--dungeon-panel-bg)] border-2 border-[var(--dungeon-panel-border)] hover:border-[var(--pixel-blue)] transition-colors"
          style={{ borderRadius: '2px' }}
          title="点击查看骰子库详情"
        >
          <PixelDice size={2} />
          <span className="text-[9px] font-mono font-bold text-[var(--pixel-blue-light)]">{diceBag.length}</span>
          <span className="text-[8px] text-[var(--dungeon-text-dim)]">/</span>
          <span className="text-[9px] font-mono font-bold text-[var(--pixel-red-light)]">{discardPile.length}</span>
        </button>
      </div>

      {/* 展开面板 */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
            onClick={() => setExpanded(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={e => e.stopPropagation()}
              className="w-[90vw] max-w-md max-h-[80vh] overflow-y-auto pixel-panel p-4 bg-[var(--dungeon-bg)]"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-black text-[var(--dungeon-text-bright)] pixel-text-shadow tracking-wide">
                  ◆ 骰子库 ◆
                </h3>
                <button
                  onClick={() => setExpanded(false)}
                  className="text-[var(--dungeon-text-dim)] hover:text-[var(--dungeon-text)] text-xs font-bold"
                >
                  ✕
                </button>
              </div>

              {/* 总览 */}
              <div className="flex gap-2 mb-3">
                <div className="flex-1 px-2 py-1.5 bg-[var(--pixel-blue-dark)] border-2 border-[var(--pixel-blue)] text-center" style={{ borderRadius: '2px' }}>
                  <div className="text-[8px] text-[var(--pixel-blue-light)] font-bold tracking-wider">待抽</div>
                  <div className="text-lg font-black text-[var(--pixel-blue-light)]">{diceBag.length}</div>
                </div>
                <div className="flex-1 px-2 py-1.5 bg-[var(--pixel-red-dark)] border-2 border-[var(--pixel-red)] text-center" style={{ borderRadius: '2px' }}>
                  <div className="text-[8px] text-[var(--pixel-red-light)] font-bold tracking-wider">已用</div>
                  <div className="text-lg font-black text-[var(--pixel-red-light)]">{discardPile.length}</div>
                </div>
                <div className="flex-1 px-2 py-1.5 bg-[var(--pixel-gold-dark)] border-2 border-[var(--pixel-gold)] text-center" style={{ borderRadius: '2px' }}>
                  <div className="text-[8px] text-[var(--pixel-gold-light)] font-bold tracking-wider">总计</div>
                  <div className="text-lg font-black text-[var(--pixel-gold-light)]">{ownedDice.length}</div>
                </div>
              </div>

              {/* 骰子列表 */}
              <div className="text-[8px] font-bold text-[var(--dungeon-text-dim)] tracking-wider mb-1.5">全部骰子</div>
              <div className="flex flex-col gap-1">
                {Object.entries(ownedCounts).map(([defId, total]) => {
                  const def = getDiceDef(defId);
                  const inBag = bagCounts[defId] || 0;
                  const inDiscard = discardCounts[defId] || 0;
                  const inHand = total - inBag - inDiscard;

                  return (
                    <div
                      key={defId}
                      className="flex items-center gap-2 px-2 py-1.5 bg-[var(--dungeon-panel-bg)] border-2 transition-colors"
                      style={{ borderColor: RARITY_COLORS[def.rarity], borderRadius: '2px' }}
                    >
                      {/* 元素标记 */}
                      <div className="w-5 h-5 flex items-center justify-center">
                        {def.element !== 'normal' ? (
                          <ElementBadge element={def.element} size={14} />
                        ) : (
                          <PixelDice size={2} />
                        )}
                      </div>

                      {/* 骰子信息 */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] font-bold text-[var(--dungeon-text-bright)]">{def.name}</span>
                          <span className="text-[7px] font-bold tracking-wider" style={{ color: RARITY_TEXT_COLORS[def.rarity] }}>
                            {RARITY_LABELS[def.rarity]}
                          </span>
                        </div>
                        <div className="text-[8px] text-[var(--dungeon-text-dim)] leading-tight truncate">
                          [{def.faces.join(',')}]
                          {def.element !== 'normal' && (
                            <span style={{ color: ELEMENT_COLORS[def.element] }}> {ELEMENT_NAMES[def.element]}</span>
                          )}
                        </div>
                      </div>

                      {/* 数量分布 */}
                      <div className="flex items-center gap-1 text-[8px] font-mono font-bold shrink-0">
                        <span className="text-[var(--pixel-blue-light)]" title="待抽">{inBag}</span>
                        <span className="text-[var(--dungeon-text-dim)]">/</span>
                        <span className="text-[var(--pixel-orange-light)]" title="手中">{inHand > 0 ? inHand : 0}</span>
                        <span className="text-[var(--dungeon-text-dim)]">/</span>
                        <span className="text-[var(--pixel-red-light)]" title="已用">{inDiscard}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-2 text-[7px] text-[var(--dungeon-text-dim)] text-center tracking-wider">
                颜色: <span className="text-[var(--pixel-blue-light)]">待抽</span> / <span className="text-[var(--pixel-orange-light)]">手中</span> / <span className="text-[var(--pixel-red-light)]">已用</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
