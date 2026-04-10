import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PixelSoulCrystal, PixelClose } from './PixelIcons';
import { RelicPixelIcon } from './PixelRelicIcons';
import { ALL_RELICS } from '../data/relics';

const META_KEY = 'dicehero_meta';

interface MetaProgress {
  permanentQuota: number;
  unlockedStartRelics: string[];
  highestOverkill: number;
  totalRuns: number;
  totalWins: number;
}

const loadMeta = (): MetaProgress => {
  try {
    const raw = localStorage.getItem(META_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { permanentQuota: 0, unlockedStartRelics: [], highestOverkill: 0, totalRuns: 0, totalWins: 0 };
};

const saveMeta = (meta: MetaProgress) => {
  try { localStorage.setItem(META_KEY, JSON.stringify(meta)); } catch { /* ignore */ }
};

/** 魂晶商店可购买的常驻遗物列表（描述从遗物定义自动读取） */
const SHOP_RELIC_IDS: { relicId: string; cost: number }[] = [
  { relicId: 'grindstone', cost: 150 },
  { relicId: 'iron_skin_relic', cost: 120 },
  { relicId: 'fate_coin', cost: 200 },
  { relicId: 'greedy_hand', cost: 250 },
  { relicId: 'crimson_grail', cost: 200 },
  { relicId: 'schrodinger_bag', cost: 220 },
  { relicId: 'treasure_sense_relic', cost: 160 },
  { relicId: 'warm_ember_relic', cost: 130 },
  { relicId: 'symmetry_seeker', cost: 180 },
  { relicId: 'iron_banner', cost: 150 },
];

export const SoulShop: React.FC<{ onClose: () => void; ownedRelicIds?: string[] }> = ({ onClose, ownedRelicIds = [] }) => {
  const [meta, setMeta] = useState<MetaProgress>(loadMeta());
  const [purchased, setPurchased] = useState<string[]>([]);
  const [flashMsg, setFlashMsg] = useState<string | null>(null);

  const handlePurchase = (item: typeof SHOP_RELIC_IDS[0]) => {
    if (meta.permanentQuota < item.cost) {
      setFlashMsg('\u274C \u9B42\u6676\u4E0D\u8DB3\uFF01');
      setTimeout(() => setFlashMsg(null), 1500);
      return;
    }
    if (meta.unlockedStartRelics.includes(item.relicId)) {
      setFlashMsg('\u5DF2\u62E5\u6709\u6B64\u9057\u7269\uFF01');
      setTimeout(() => setFlashMsg(null), 1500);
      return;
    }
    const newMeta = {
      ...meta,
      permanentQuota: meta.permanentQuota - item.cost,
      unlockedStartRelics: [...meta.unlockedStartRelics, item.relicId],
    };
    setMeta(newMeta);
    saveMeta(newMeta);
    setPurchased(prev => [...prev, item.relicId]);
    setFlashMsg('\u2726 \u83B7\u5F97 ' + (ALL_RELICS[item.relicId]?.name || item.relicId) + '\uFF01');
    setTimeout(() => setFlashMsg(null), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="w-full max-w-md mx-4 pixel-panel border-purple-500/60 p-4 max-h-[85vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <PixelSoulCrystal size={3} />
            <h2 className="text-lg font-black text-purple-300 pixel-text-shadow">{'\u9B42\u6676\u5546\u5E97'}</h2>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-purple-400 text-sm font-mono">
              <PixelSoulCrystal size={2} />
              <span className="font-bold">{meta.permanentQuota}</span>
            </div>
            <button onClick={onClose} className="text-[var(--dungeon-text-dim)] hover:text-[var(--pixel-red)] transition-colors"><PixelClose size={2} /></button>
          </div>
        </div>

        <p className="text-[8px] text-[var(--dungeon-text-dim)] mb-3 leading-relaxed">
          {'\u6D88\u8017\u9B42\u6676\u8D2D\u4E70\u5E38\u9A7B\u9057\u7269\uFF0C\u8D2D\u4E70\u540E\u6BCF\u6B21\u5F00\u5C40\u81EA\u52A8\u643A\u5E26\u3002\u9B42\u6676\u901A\u8FC7\u6EA2\u51FA\u4F24\u5BB3\u83B7\u53D6\uFF0C\u8425\u706B\u53EF\u64A4\u79BB\u4FDD\u5B58\u3002'}
        </p>

        <AnimatePresence>
          {flashMsg && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="text-center text-sm font-bold text-purple-300 mb-3 pixel-text-shadow">
              {flashMsg}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex flex-col gap-2">
          {SHOP_RELIC_IDS.map((item) => {
            const relic = ALL_RELICS[item.relicId];
            if (!relic) return null;
            const owned = meta.unlockedStartRelics.includes(item.relicId);
            const ownedInRun = ownedRelicIds.includes(item.relicId);
            const justBought = purchased.includes(item.relicId);
            const canAfford = meta.permanentQuota >= item.cost;

            return (
              <motion.button
                key={item.relicId}
                onClick={() => handlePurchase(item)}
                disabled={owned}
                whileTap={!owned ? { scale: 0.97 } : undefined}
                className={`flex items-center gap-3 p-3 border-2 text-left transition-all ${
                  owned
                    ? 'border-green-700/40 bg-green-900/10 opacity-60 cursor-default'
                    : canAfford
                    ? 'border-purple-500/40 bg-purple-900/10 hover:border-purple-400 hover:bg-purple-900/20 cursor-pointer'
                    : 'border-[var(--dungeon-panel-border)] bg-[var(--dungeon-bg)] opacity-50 cursor-not-allowed'
                }`}
                style={{ borderRadius: '2px' }}
              >
                <div className="shrink-0 w-8 flex items-center justify-center">
                  <RelicPixelIcon relicId={item.relicId} size={3} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs font-bold ${owned ? 'text-green-400' : 'text-[var(--dungeon-text-bright)]'}`}>
                      {relic.name}
                    </span>
                    {owned && <span className="text-[8px] text-green-500 font-bold">{'\u5DF2\u89E3\u9501'}</span>}
                    {ownedInRun && !owned && <span className="text-[8px] text-cyan-400 font-bold">{'\u5F53\u5C40\u5DF2\u6709'}</span>}
                    {justBought && <span className="text-[8px] text-purple-400 font-bold animate-pulse">{'\u521A\u8D2D\u4E70'}</span>}
                  </div>
                  <p className="text-[9px] text-[var(--dungeon-text-dim)] mt-0.5 leading-relaxed">{relic.description}</p>
                </div>
                {!owned && (
                  <div className={`flex items-center gap-1 shrink-0 text-xs font-mono font-bold ${canAfford ? 'text-purple-400' : 'text-red-400'}`}>
                    <PixelSoulCrystal size={1.5} />
                    <span>{item.cost}</span>
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>

        <div className="mt-4 pt-3 border-t border-[var(--dungeon-panel-border)] text-[8px] text-[var(--dungeon-text-dim)] flex gap-4">
          <span>{'\u603B\u5C40\u6570'}: {meta.totalRuns}</span>
          <span>{'\u6700\u9AD8\u6EA2\u51FA'}: {meta.highestOverkill}</span>
          <span>{'\u5DF2\u89E3\u9501'}: {meta.unlockedStartRelics.length}/{SHOP_RELIC_IDS.length}</span>
        </div>
      </motion.div>
    </motion.div>
  );
};
