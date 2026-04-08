import io

content = """/\*\*
 \* 章节过渡界面
 \*/
import React from 'react';
import { motion } from 'motion/react';
import { useContext } from 'react';
import { GameContext } from '../contexts/GameContext';
import { CHAPTER_CONFIG } from '../config';
import { generateMap } from '../utils/mapGenerator';
import { initDiceBag } from '../data/diceBag';

export const ChapterTransition: React.FC = () => {
  const { game, setGame } = useContext(GameContext);
  
  const chapterName = CHAPTER_CONFIG.chapterNames[game.chapter - 1] || '未知';
  const nextChapterName = CHAPTER_CONFIG.chapterNames[game.chapter] || '未知';
  const healAmount = Math.floor(game.maxHp \* CHAPTER_CONFIG.chapterHealPercent);

  const handleNextChapter = () => {
    const nextChapter = game.chapter + 1;
    const newHp = Math.min(game.hp + healAmount, game.maxHp);
    const bonusGold = CHAPTER_CONFIG.chapterBonusGold;
    const newMap = generateMap();
    const diceIds = game.ownedDice.map((d: any) => d.defId);
    const newBag = initDiceBag(diceIds);
    setGame((prev: any) => ({
      ...prev,
      chapter: nextChapter,
      hp: newHp,
      souls: prev.souls + bonusGold,
      map: newMap,
      currentNodeId: null,
      diceBag: newBag,
      discardPile: [],
      phase: 'map',
      stats: { ...prev.stats, goldEarned: prev.stats.goldEarned + bonusGold },
    }));
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4"
      style={{ background: 'linear-gradient(180deg, #080b0e 0%, #1a1520 50%, #0e1317 100%)' }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="pixel-panel p-6 max-w-sm w-full text-center"
      >
        <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}>
          <div className="text-[10px] text-[var(--dungeon-text-dim)] mb-1">章节完成</div>
          <div className="text-lg font-bold text-[var(--pixel-gold)] pixel-text-shadow mb-4">{chapterName}</div>
        </motion.div>
        
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}>
          <div className="text-[10px] text-[var(--dungeon-text-dim)] mb-2">奖励</div>
          <div className="flex justify-center gap-4 mb-4">
            <div className="text-[11px] text-[var(--pixel-green)]">+{healAmount} HP</div>
            <div className="text-[11px] text-[var(--pixel-gold)]">+{CHAPTER_CONFIG.chapterBonusGold} 金币</div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}>
          <div className="text-[10px] text-[var(--dungeon-text-dim)] mb-1">即将进入</div>
          <div className="text-sm font-bold text-[var(--pixel-cyan)] mb-4">{nextChapterName}</div>
          <button onClick={handleNextChapter} className="pixel-btn pixel-btn-primary w-full py-2 text-[11px] font-bold">
            继续前进
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
};
"""

f = io.open('F:/UGit/dicehero2/src/components/ChapterTransition.tsx', 'w', encoding='utf-8')
f.write(content)
f.close()
print('OK')
