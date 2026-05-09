/**
 * GameOverScreen.tsx — 死亡结算界面 (2026-05-09 重写)
 *
 * 结构（自上而下）：
 *   1. 该章终 BOSS 立绘（大尺寸 PixelSprite）+ 气泡嘲讽台词
 *   2. 标题 ◆ 黑夜吞噬 ◆
 *   3. 地点：第 X 章 · 章节名  /  第 Y 层
 *   4. 英勇事迹卡片（icon + 文字，7 行）：
 *        击败敌人 / 击败 BOSS / 总伤害 / 最高单伤 / 获得遗物 / 获得魂晶 / 获得金币
 *   5. 魂晶结算（保留：撤离保留 / 损失 / 永久账户）
 *   6. [好的] 返回主页
 */
import React, { useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import {
  PixelSkull, PixelSoulCrystal, PixelSword, PixelCrown, PixelCoin, PixelTrophy,
} from './PixelIcons';
import { PixelSprite, hasSpriteData } from './PixelSprite';
import { CSSParticles } from './ParticleEffects';
import { useGameContext } from '../contexts/GameContext';
import { pickChapterDeathMock } from '../data/bossDeathMock';

// ============================================================
// 章节标题（与 enemies.ts 里"章 N: XXX"保持一致）
// ============================================================
const CHAPTER_NAMES = ['幽暗森林', '冰封山脉', '熔岩深渊', '暗影要塞', '永恒之巅'];

const CHAPTER_GLOW: Record<number, string> = {
  1: '#e06030',
  2: '#4898e8',
  3: '#f09030',
  4: '#c060e8',
  5: '#e8c840',
};

// ============================================================
// 魂晶存档（和原版一致）
// ============================================================
const META_KEY = 'dicehero_meta';

interface MetaShape {
  permanentQuota: number;
  unlockedStartRelics: string[];
  highestOverkill: number;
  totalRuns: number;
  totalWins: number;
}

function loadMeta(): MetaShape {
  try {
    const raw = localStorage.getItem(META_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { permanentQuota: 0, unlockedStartRelics: [], highestOverkill: 0, totalRuns: 0, totalWins: 0 };
}

function saveMeta(meta: MetaShape) {
  try { localStorage.setItem(META_KEY, JSON.stringify(meta)); } catch { /* ignore */ }
}

// ============================================================
// 英勇事迹单行
// ============================================================
const DeedRow: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color?: string;
  delay: number;
}> = ({ icon, label, value, color = 'var(--dungeon-text-bright)', delay }) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay, duration: 0.35 }}
    className="flex items-center justify-between py-1.5 px-2.5 border-b border-[var(--dungeon-panel-border)] last:border-b-0"
  >
    <div className="flex items-center gap-2 text-[10px] text-[var(--dungeon-text)]">
      {icon}
      <span>{label}</span>
    </div>
    <span className="text-[12px] font-black font-mono pixel-text-shadow" style={{ color }}>
      {value}
    </span>
  </motion.div>
);

// ============================================================
// 主组件
// ============================================================
export const GameOverScreen: React.FC = () => {
  const { game, resetGame } = useGameContext();

  const chapter = game.chapter || 1;
  const chapterName = CHAPTER_NAMES[chapter - 1] || '未知之地';
  const glowColor = CHAPTER_GLOW[chapter] || CHAPTER_GLOW[1];

  // 死亡嘲讽（每次进入本界面随机一条，用 useMemo 固化）
  const { bossName, line: mockLine } = useMemo(() => pickChapterDeathMock(chapter), [chapter]);

  // 魂晶结算（保留原逻辑）
  const totalQuota = game.blackMarketQuota || 0;
  const lostQuota = Math.ceil(totalQuota * 0.6);
  const deathSaved = totalQuota - lostQuota;
  const savedQuota = (game.evacuatedQuota || 0) + deathSaved;

  // 英勇事迹数据
  const stats = game.stats;
  const enemiesKilled = stats.enemiesKilled || 0;
  const bossesKilled = stats.bossesWon || 0;
  const totalDamage = stats.totalDamageDealt || 0;
  const highestHit = stats.maxSingleHit || 0;
  const relicsCollected = game.relics.length;
  const soulCrystalsEarned = savedQuota; // 本局获得魂晶（撤离 + 死亡保留 40%）
  const goldEarned = stats.goldEarned || 0;

  // 当前层数：currentNode（number）+1 显示给玩家，fallback 到 1
  const floor = typeof game.currentNode === 'number' ? game.currentNode + 1 : 1;

  // Meta 存档
  useEffect(() => {
    const meta = loadMeta();
    if (savedQuota > 0) {
      meta.permanentQuota = (meta.permanentQuota || 0) + savedQuota;
    }
    meta.totalRuns = (meta.totalRuns || 0) + 1;
    if ((game.totalOverkillThisRun || 0) > (meta.highestOverkill || 0)) {
      meta.highestOverkill = game.totalOverkillThisRun || 0;
    }
    saveMeta(meta);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const returnToTitle = () => { resetGame(); };

  const hasSprite = hasSpriteData(bossName);

  return (
    <div className="flex flex-col h-[100dvh] w-full max-w-md mx-auto bg-[var(--dungeon-bg)] text-[var(--dungeon-text)] relative overflow-hidden sm:border-x-3 border-[var(--dungeon-panel-border)] scanlines">
      <div className="absolute inset-0 pixel-grid-bg opacity-20" />
      <CSSParticles type="ember" count={10} />

      <div className="flex-1 overflow-y-auto scrollbar-hide relative z-10 px-4 pb-6">
        {/* ===== 1. BOSS 立绘 + 气泡 ===== */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="flex flex-col items-center pt-6 pb-2"
        >
          {/* 气泡（BOSS 立绘上方） */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.4 }}
            style={{
              maxWidth: '280px',
              minWidth: '160px',
              padding: '10px 14px',
              marginBottom: '12px',
              background: 'rgba(30,18,0,0.96)',
              border: `2px solid ${glowColor}`,
              borderRadius: '3px',
              fontFamily: '"fusion-pixel", monospace',
              fontSize: '12px',
              lineHeight: 1.5,
              color: glowColor,
              textAlign: 'center',
              wordBreak: 'break-word',
              position: 'relative',
            }}
          >
            {mockLine}
            <svg
              width="12" height="7" viewBox="0 0 12 7"
              style={{ position: 'absolute', bottom: '-7px', left: '50%', transform: 'translateX(-50%)' }}
            >
              <polygon points="0,0 12,0 6,7" fill="rgba(30,18,0,0.96)" />
              <line x1="0" y1="0" x2="6" y2="7" stroke={glowColor} strokeWidth="2" />
              <line x1="12" y1="0" x2="6" y2="7" stroke={glowColor} strokeWidth="2" />
            </svg>
          </motion.div>

          {/* BOSS 立绘 */}
          <motion.div
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              filter: `drop-shadow(0 0 14px ${glowColor}a0) drop-shadow(0 0 30px ${glowColor}50)`,
              imageRendering: 'pixelated',
            }}
          >
            {hasSprite
              ? <PixelSprite name={bossName} size={7} />
              : <PixelSkull size={7} />
            }
          </motion.div>

          {/* BOSS 名牌 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            style={{
              marginTop: '6px',
              padding: '2px 12px',
              background: 'rgba(0,0,0,0.8)',
              border: `1px solid ${glowColor}`,
              borderRadius: '2px',
              fontFamily: '"fusion-pixel", monospace',
              fontSize: '10px',
              color: glowColor,
              letterSpacing: '2px',
              textShadow: '1px 1px 0 #000',
              whiteSpace: 'nowrap',
            }}
          >
            {bossName}
          </motion.div>
        </motion.div>

        {/* ===== 2. 标题 + 地点 ===== */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center mt-4 mb-3"
        >
          <h1
            className="text-2xl font-black text-[var(--pixel-red)] pixel-text-shadow tracking-wide"
            style={{ textShadow: '0 0 14px rgba(224,96,48,0.6), 2px 2px 0 rgba(0,0,0,0.8)' }}
          >
            ◆ 黑夜吞噬 ◆
          </h1>
          <div className="text-[10px] text-[var(--dungeon-text-dim)] mt-2 leading-relaxed">
            <div>第 {chapter} 章 · {chapterName}</div>
            <div>第 {floor} 层</div>
          </div>
        </motion.div>

        {/* ===== 3. 英勇事迹 ===== */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="pixel-panel p-1 mb-3"
        >
          <div className="text-[8px] text-[var(--pixel-gold)] font-bold tracking-widest text-center py-1.5">
            ◆ 英勇事迹 ◆
          </div>
          <DeedRow icon={<PixelSkull size={2} />}  label="击败敌人" value={enemiesKilled} color="var(--pixel-red)" delay={0.8} />
          <DeedRow icon={<PixelCrown size={2} />}  label="击败 BOSS" value={bossesKilled} color="var(--pixel-purple)" delay={0.9} />
          <DeedRow icon={<PixelSword size={2} />}  label="总伤害" value={totalDamage.toLocaleString()} color="var(--pixel-red-light)" delay={1.0} />
          <DeedRow icon={<PixelSword size={2} />}  label="最高单伤" value={highestHit} color="var(--pixel-orange)" delay={1.1} />
          <DeedRow icon={<PixelTrophy size={2} />} label="获得遗物" value={relicsCollected} color="var(--pixel-purple)" delay={1.2} />
          <DeedRow icon={<PixelSoulCrystal size={2} />} label="获得魂晶" value={soulCrystalsEarned} color="#c090ff" delay={1.3} />
          <DeedRow icon={<PixelCoin size={2} />}   label="获得金币" value={goldEarned} color="var(--pixel-gold)" delay={1.4} />
        </motion.div>

        {/* ===== 4. 魂晶结算明细（保留原版） ===== */}
        {(lostQuota > 0 || savedQuota > 0) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.5 }}
            className="mb-4 p-2 pixel-panel border-purple-500/30"
          >
            <div className="text-[9px] text-purple-300 font-bold mb-1.5 flex items-center justify-center gap-1">
              <PixelSoulCrystal size={2} /> 魂晶结算
            </div>
            {lostQuota > 0 && (
              <div className="text-[9px] text-red-400 text-center">
                未撤离魂晶: <span className="font-bold">-{lostQuota}</span>（损失 60%）
              </div>
            )}
            {deathSaved > 0 && (
              <div className="text-[9px] text-yellow-400 text-center">
                死亡保留: <span className="font-bold">+{deathSaved}</span>（保留 40%）
              </div>
            )}
            {(game.evacuatedQuota || 0) > 0 && (
              <div className="text-[9px] text-green-400 text-center">
                已撤离魂晶: <span className="font-bold">+{game.evacuatedQuota || 0}</span>（已存入永久账户）
              </div>
            )}
            <div className="text-[8px] text-[var(--dungeon-text-dim)] mt-1 text-center">
              永久账户余额: {loadMeta().permanentQuota}
            </div>
          </motion.div>
        )}

        {/* ===== 5. 按钮 ===== */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.7 }}
          className="flex justify-center"
        >
          <button
            onClick={returnToTitle}
            className="w-full max-w-[220px] py-3 pixel-btn pixel-btn-danger text-sm font-bold"
          >
            ▶ 好的
          </button>
        </motion.div>
      </div>
    </div>
  );
};
