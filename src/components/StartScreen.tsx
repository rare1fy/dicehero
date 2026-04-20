import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useGameContext } from '../contexts/GameContext';
import { PixelDice, PixelBook, PixelSoulCrystal, PixelSword } from './PixelIcons';
import { CSSParticles } from './ParticleEffects';
import { TutorialOverlay, isTutorialCompleted } from './TutorialOverlay';
import { SoulShop } from './SoulShop';
import { ALL_RELICS } from '../data/relics';
import { playSound } from '../utils/sound';

/** 首页专用金色骰子 — 与PixelDice同形态，神圣白金配色 */
const GoldDice: React.FC<{ size?: number }> = ({ size = 2 }) => {
  const s = size;
  const B = '#6b5520', H = '#f0d860', F = '#dcc040', D = '#a88a28', DOT = '#3a2a10';
  const p = [
    [B, H, H, H, H, H, B],
    [H, F, F, F, F, F, D],
    [H, F, DOT, F, F, F, D],
    [H, F, F, DOT, F, F, D],
    [H, F, F, F, DOT, F, D],
    [H, F, F, F, F, F, D],
    [B, D, D, D, D, D, B],
  ];
  return (
    <svg width={7 * s} height={7 * s} viewBox="0 0 7 7" shapeRendering="crispEdges" style={{ imageRendering: 'pixelated' }}>
      {p.map((row, y) => row.map((c, x) => c ? <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill={c} /> : null))}
    </svg>
  );
};

const META_KEY = 'dicehero_meta';
const loadMeta = () => {
  try {
    const raw = localStorage.getItem(META_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { permanentQuota: 0, unlockedStartRelics: [], highestOverkill: 0, totalRuns: 0, totalWins: 0 };
};

export const StartScreen: React.FC = () => {
  const { game, setGame, showTutorial, setShowTutorial } = useGameContext();
  const [showSoulShop, setShowSoulShop] = useState(false);
  const [fading, setFading] = useState(false);

  const startGame = () => {
    // 进入职业选择界面
    setGame(prev => ({ ...prev, phase: 'classSelect' }));
  };

  const handleStart = () => {
    if (!isTutorialCompleted()) {
      setShowTutorial(true);
      return;
    }
    // 石门音效 + 慢速淡出
    playSound('gate_close');
    setFading(true);
    setTimeout(() => startGame(), 1200);
  };

  const meta = loadMeta();

  return (
    <div className="flex flex-col items-center justify-center h-[100dvh] w-full max-w-md mx-auto bg-[var(--dungeon-bg)] text-[var(--dungeon-text)] p-6 overflow-hidden relative sm:border-x-3 border-[var(--dungeon-panel-border)] scanlines">
      {/* 多层背景氛围 */}
      <div className="absolute inset-0 pixel-grid-bg opacity-30" />
      <div className="absolute inset-0 dungeon-bg" />
      {/* 暗角氛围 */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse at 50% 40%, transparent 20%, rgba(6,4,8,0.4) 60%, rgba(3,2,4,0.85) 100%)',
      }} />
      {/* 顶部暗雾 */}
      <div className="absolute top-0 left-0 right-0 h-[30%] pointer-events-none" style={{
        background: 'linear-gradient(to bottom, rgba(4,3,6,0.7) 0%, transparent 100%)',
      }} />
      {/* 底部暗雾 */}
      <div className="absolute bottom-0 left-0 right-0 h-[25%] pointer-events-none" style={{
        background: 'linear-gradient(to top, rgba(4,3,6,0.8) 0%, transparent 100%)',
      }} />
      {/* 微弱的脉冲光晕 */}
      <motion.div
        animate={{ opacity: [0.03, 0.08, 0.03] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute pointer-events-none"
        style={{ top: '20%', left: '20%', width: '60%', height: '40%',
          background: 'radial-gradient(circle, rgba(212,160,48,0.12) 0%, transparent 60%)',
        }}
      />
      <CSSParticles type="sparkle" count={8} />
      
      {/* 淡出遮罩 */}
      <AnimatePresence>
        {fading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.0, ease: 'easeIn' }}
            className="absolute inset-0 z-50 bg-black pointer-events-none"
          />
        )}
      </AnimatePresence>

      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 text-center w-full"
      >
        {/* 金色呼吸发光骰子 */}
        <motion.div
          animate={{ y: [0, -8, 0], rotate: [0, 4, -4, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          className="mb-5 flex justify-center"
        >
          <motion.div
            animate={{
              filter: [
                'drop-shadow(0 0 8px rgba(212,160,48,0.3)) drop-shadow(0 0 20px rgba(212,160,48,0.15))',
                'drop-shadow(0 0 18px rgba(212,160,48,0.7)) drop-shadow(0 0 40px rgba(212,160,48,0.35))',
                'drop-shadow(0 0 8px rgba(212,160,48,0.3)) drop-shadow(0 0 20px rgba(212,160,48,0.15))',
              ],
            }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          >
            <GoldDice size={8} />
          </motion.div>
        </motion.div>
        
        {/* 标题 — 加强辉光 */}
        <h1 className="text-4xl font-black tracking-[0.15em] mb-2 pixel-text-shadow" style={{ textShadow: '3px 3px 0 rgba(0,0,0,0.9), 0 0 30px rgba(224,120,48,0.4), 0 0 60px rgba(224,120,48,0.15)' }}>
          <span className="text-[var(--dungeon-text-bright)]">六面</span>
          <span className="text-[var(--pixel-green)]">决界</span>
        </h1>
        <motion.p
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 3, repeat: Infinity }}
          className="text-[var(--pixel-gold)] text-[10px] tracking-[0.3em] mb-10 pixel-text-shadow"
          style={{ textShadow: '0 0 8px rgba(212,160,48,0.5)' }}
        >
          ◆ 6 SIDES BATTLE ◆
        </motion.p>
        
        {/* 开始按钮 — 像素立体 + 呼吸光效 */}
        <motion.button 
          onClick={handleStart}
          disabled={fading}
          animate={{ filter: ['drop-shadow(0 0 6px rgba(60,200,100,0.2))', 'drop-shadow(0 0 16px rgba(60,200,100,0.5))', 'drop-shadow(0 0 6px rgba(60,200,100,0.2))'] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="group relative w-full max-w-[220px] mx-auto py-3 pixel-btn pixel-btn-primary text-sm block mb-4 disabled:opacity-50"
        >
          <span className="relative z-10 flex items-center justify-center gap-2"><PixelSword size={2} /> 开启征程</span>
        </motion.button>

        {/* 读取存档按钮 */}
        {localStorage.getItem('dicehero_save') && (
          <button
            onClick={() => {
              try {
                const raw = localStorage.getItem('dicehero_save');
                if (!raw) return;
                const saveData = JSON.parse(raw);
                playSound('gate_close');
                setFading(true);
                setTimeout(() => {
                  setGame(saveData);
                }, 1200);
              } catch { /* ignore */ }
            }}
            disabled={fading}
            className="group relative w-full max-w-[220px] mx-auto py-2.5 pixel-btn pixel-btn-ghost text-[11px] block mb-4 disabled:opacity-50"
          >
            <span className="relative z-10 flex items-center justify-center gap-2"><PixelBook size={2} /> 继续上次冒险</span>
          </button>
        )}

        {/* 魂晶商店按钮 */}
        <button
          onClick={() => setShowSoulShop(true)}
          className="group relative w-full max-w-[220px] mx-auto py-2.5 pixel-btn pixel-btn-purple text-sm block mb-5"
        >
          <span className="relative z-10 flex items-center justify-center gap-2">
            <PixelSoulCrystal size={2} />
            魂晶商店
            {meta.permanentQuota > 0 && (
              <span className="text-[9px] opacity-70 font-mono">({meta.permanentQuota})</span>
            )}
          </span>
        </button>

        {/* 教程按钮 */}
        <button
          onClick={() => setShowTutorial(true)}
          className="text-[var(--dungeon-text-dim)] hover:text-[var(--pixel-green)] text-[9px] transition-colors mb-8 flex items-center gap-1 mx-auto"
        >
          <PixelBook size={2} /> 查看教程
        </button>


      </motion.div>
      
      {/* 教程覆盖层 */}
      <AnimatePresence>
        {showTutorial && (
          <TutorialOverlay onComplete={() => {
            setShowTutorial(false);
            playSound('gate_close');
            setFading(true);
            setTimeout(() => startGame(), 1200);
          }} />
        )}
      </AnimatePresence>

      {/* 魂晶商店 */}
      <AnimatePresence>
        {showSoulShop && <SoulShop onClose={() => setShowSoulShop(false)} ownedRelicIds={game.relics.map(r => r.id)} />}
      </AnimatePresence>
    </div>
  );
};