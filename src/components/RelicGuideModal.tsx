import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PixelClose } from './PixelIcons';
import { RelicPixelIcon } from './PixelRelicIcons';
import { RELICS_BY_RARITY } from '../data/relics';
import { formatDescription } from '../utils/richText';
import type { Relic, RelicRarity } from '../types/game';

const RARITY_CONFIG: Record<RelicRarity, { label: string; color: string; border: string }> = {
  common: { label: '普通', color: 'text-green-400', border: 'border-green-500' },
  uncommon: { label: '精良', color: 'text-blue-400', border: 'border-blue-500' },
  rare: { label: '稀有', color: 'text-purple-400', border: 'border-purple-500' },
  legendary: { label: '传说', color: 'text-orange-400', border: 'border-orange-500' },
};

const TRIGGER_LABEL: Record<string, string> = {
  on_play: '出牌时',
  passive: '被动',
  on_kill: '击杀时',
  on_reroll: '重投时',
  on_battle_end: '战斗结束',
  on_battle_start: '战斗开始',
  on_damage_taken: '受伤时',
  on_fatal: '致命伤',
  on_turn_end: '回合结束',
  on_move: '移动时',
};

interface RelicGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  ownedRelicIds?: string[];
}

export const RelicGuideModal: React.FC<RelicGuideModalProps> = ({ isOpen, onClose, ownedRelicIds = [] }) => {
  const [filter, setFilter] = useState<RelicRarity | 'all'>('all');

  const allRelics: Relic[] = [
    ...RELICS_BY_RARITY.common,
    ...RELICS_BY_RARITY.uncommon,
    ...RELICS_BY_RARITY.rare,
    ...RELICS_BY_RARITY.legendary,
  ];

  const filtered = filter === 'all' ? allRelics : RELICS_BY_RARITY[filter] || [];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] bg-black/90 flex items-center justify-center p-2"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="pixel-panel w-full max-w-sm max-h-[85vh] flex flex-col overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* 标题栏 */}
            <div className="p-3 border-b-3 border-[var(--dungeon-panel-border)] flex justify-between items-center bg-[var(--dungeon-bg-light)] shrink-0">
              <h3 className="text-xs text-[var(--pixel-gold)] pixel-text-shadow">
                ✦ 遗物图鉴 ✦ <span className="text-[9px] text-[var(--dungeon-text-dim)]">({filtered.length}个)</span>
              </h3>
              <button onClick={onClose} className="text-[var(--dungeon-text-dim)] hover:text-[var(--pixel-red)]">
                <PixelClose size={2} />
              </button>
            </div>

            {/* 稀有度筛选 */}
            <div className="flex gap-1 p-2 border-b-2 border-[var(--dungeon-panel-border)] bg-[var(--dungeon-bg)] shrink-0">
              <FilterBtn active={filter === 'all'} onClick={() => setFilter('all')} label="全部" color="text-[var(--dungeon-text)]" />
              <FilterBtn active={filter === 'common'} onClick={() => setFilter('common')} label="普通" color="text-gray-200" />
              <FilterBtn active={filter === 'uncommon'} onClick={() => setFilter('uncommon')} label="精良" color="text-green-400" />
              <FilterBtn active={filter === 'rare'} onClick={() => setFilter('rare')} label="稀有" color="text-blue-400" />
              <FilterBtn active={filter === 'legendary'} onClick={() => setFilter('legendary')} label="传说" color="text-orange-400" />
            </div>

            {/* 遗物列表 */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1.5 bg-[var(--dungeon-panel)]">
              {filtered.map(relic => {
                const owned = ownedRelicIds.includes(relic.id);
                const rc = RARITY_CONFIG[relic.rarity];
                return (
                  <div
                    key={relic.id}
                    className={`p-2 border-2 ${owned ? 'border-[var(--pixel-gold)]' : 'border-[var(--dungeon-panel-border)]'} bg-[var(--dungeon-bg)] transition-colors`}
                    style={{ borderRadius: '2px' }}
                  >
                    <div className="flex items-start gap-2">
                      {/* 图标 */}
                      <div className={`w-7 h-7 flex items-center justify-center border-2 ${rc.border} bg-[var(--dungeon-bg-light)] shrink-0`} style={{ borderRadius: '2px' }}>
                        <RelicPixelIcon relicId={relic.id} size={2} />
                      </div>
                      {/* 内容 */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className={`text-[11px] font-bold ${rc.color}`}>{relic.name}</span>
                          <span className={`text-[8px] px-1 border ${rc.border} ${rc.color}`} style={{ borderRadius: '1px' }}>
                            {rc.label}
                          </span>
                          <span className="text-[8px] px-1 border border-[var(--dungeon-panel-border)] text-[var(--dungeon-text-dim)]" style={{ borderRadius: '1px' }}>
                            {TRIGGER_LABEL[relic.trigger] || relic.trigger}
                          </span>
                          {owned && (
                            <span className="text-[8px] px-1 bg-[var(--pixel-gold-dark)] text-[var(--pixel-gold-light)] border border-[var(--pixel-gold)]" style={{ borderRadius: '1px' }}>
                              已装备
                            </span>
                          )}
                        </div>
                        <p className="text-[9px] text-[var(--dungeon-text-dim)] leading-relaxed">
                          {formatDescription(relic.description)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const FilterBtn: React.FC<{ active: boolean; onClick: () => void; label: string; color: string }> = ({ active, onClick, label, color }) => (
  <button
    onClick={onClick}
    className={`flex-1 py-1 text-[9px] border-2 transition-all ${
      active
        ? `${color} border-[var(--pixel-gold)] bg-[var(--dungeon-bg-light)]`
        : `text-[var(--dungeon-text-dim)] border-[var(--dungeon-panel-border)] bg-[var(--dungeon-bg)]`
    }`}
    style={{ borderRadius: '2px' }}
  >
    {label}
  </button>
);
