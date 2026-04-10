import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PixelSprite, hasSpriteData } from './PixelSprite';
import { PixelClose } from './PixelIcons';
import { NORMAL_ENEMIES, ELITE_ENEMIES, BOSS_ENEMIES, type EnemyConfig } from '../config/enemies';
import { CHAPTER_CONFIG } from '../config';

const COMBAT_LABELS: Record<string, { label: string; color: string }> = {
  warrior: { label: '战', color: 'var(--pixel-red)' },
  guardian: { label: '盾', color: 'var(--pixel-blue)' },
  ranger:  { label: '弓', color: 'var(--pixel-green)' },
  caster:  { label: '术', color: 'var(--pixel-purple)' },
  priest:  { label: '牧', color: 'var(--pixel-gold)' },
};

const CAT_COLORS: Record<string, string> = {
  normal: 'var(--dungeon-text-dim)',
  elite: 'var(--pixel-orange)',
  boss: 'var(--pixel-purple)',
};

interface Props {
  visible: boolean;
  onClose: () => void;
}

export const EnemyBestiary: React.FC<Props> = ({ visible, onClose }) => {
  const [tab, setTab] = useState(1);
  const allEnemies = [...NORMAL_ENEMIES, ...ELITE_ENEMIES, ...BOSS_ENEMIES];
  const chapterEnemies = allEnemies.filter(e => e.chapter === tab);

  const renderEnemy = (e: EnemyConfig) => {
    const ct = COMBAT_LABELS[e.combatType] || { label: '?', color: '#888' };
    const catColor = CAT_COLORS[e.category] || '#888';
    return (
      <div key={e.id} className="flex items-center gap-2 p-1.5 bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)]" style={{ borderRadius: '2px' }}>
        <div className="w-10 h-10 flex items-center justify-center shrink-0">
          {hasSpriteData(e.name) ? (
            <PixelSprite name={e.name} size={e.category === 'boss' ? 4 : e.category === 'elite' ? 3.5 : 3} />
          ) : (
            <div className="w-6 h-6 bg-[var(--dungeon-panel)] border border-[var(--dungeon-panel-border)] flex items-center justify-center text-[8px] text-[var(--dungeon-text-dim)]" style={{ borderRadius: '2px' }}>?</div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <span className="font-bold text-[11px] text-[var(--dungeon-text-bright)]">{e.name}</span>
            <span className="text-[8px] font-bold px-1 py-0 border" style={{ borderRadius: '2px', color: ct.color, borderColor: ct.color }}>{ct.label}</span>
            <span className="text-[8px] font-bold" style={{ color: catColor }}>
              {e.category === 'boss' ? 'BOSS' : e.category === 'elite' ? '精英' : '普通'}
            </span>
          </div>
          <div className="flex items-center gap-2 text-[9px] text-[var(--dungeon-text-dim)]">
            <span>HP {e.baseHp}</span>
            <span>ATK {e.baseDmg}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[999] flex items-center justify-center"
          style={{ background: 'rgba(4,3,6,0.85)' }}
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="pixel-panel w-full max-w-sm mx-4 overflow-hidden"
            style={{ maxHeight: '80dvh', display: 'flex', flexDirection: 'column' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-3 bg-[var(--dungeon-panel)] border-b-2 border-[var(--dungeon-panel-border)]">
              <h3 className="text-sm font-black text-[var(--dungeon-text-bright)] pixel-text-shadow">敌人图鉴</h3>
              <button onClick={onClose} className="p-1 hover:opacity-70"><PixelClose size={2} /></button>
            </div>

            {/* Chapter tabs */}
            <div className="flex gap-0.5 p-2 bg-[var(--dungeon-bg)] border-b border-[var(--dungeon-panel-border)]" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' as any }}>
              {CHAPTER_CONFIG.chapterNames.map((name, i) => (
                <button
                  key={i}
                  onClick={() => setTab(i + 1)}
                  className={`px-2 py-1 text-[9px] font-bold border shrink-0 transition-colors ${
                    tab === i + 1
                      ? 'bg-[var(--pixel-gold-dark)] text-[var(--pixel-gold-light)] border-[var(--pixel-gold)]'
                      : 'bg-[var(--dungeon-panel)] text-[var(--dungeon-text-dim)] border-[var(--dungeon-panel-border)] hover:text-[var(--dungeon-text)]'
                  }`}
                  style={{ borderRadius: '2px' }}
                >
                  {name}
                </button>
              ))}
            </div>

            {/* Enemy list */}
            <div className="flex-1 overflow-y-auto min-h-0 p-2 space-y-1.5" style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-y', overscrollBehavior: 'contain' } as any}>
              {/* Normal */}
              {chapterEnemies.filter(e => e.category === 'normal').length > 0 && (
                <>
                  <div className="text-[8px] text-[var(--dungeon-text-dim)] font-bold tracking-wider mt-1 mb-0.5">— 普通敌人 —</div>
                  {chapterEnemies.filter(e => e.category === 'normal').map(renderEnemy)}
                </>
              )}
              {/* Elite */}
              {chapterEnemies.filter(e => e.category === 'elite').length > 0 && (
                <>
                  <div className="text-[8px] text-[var(--pixel-orange)] font-bold tracking-wider mt-2 mb-0.5">— 精英敌人 —</div>
                  {chapterEnemies.filter(e => e.category === 'elite').map(renderEnemy)}
                </>
              )}
              {/* Boss */}
              {chapterEnemies.filter(e => e.category === 'boss').length > 0 && (
                <>
                  <div className="text-[8px] text-[var(--pixel-purple)] font-bold tracking-wider mt-2 mb-0.5">— BOSS —</div>
                  {chapterEnemies.filter(e => e.category === 'boss').map(renderEnemy)}
                </>
              )}
              {chapterEnemies.length === 0 && (
                <div className="text-center text-[var(--dungeon-text-dim)] text-[10px] py-8">该章节暂无敌人数据</div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
