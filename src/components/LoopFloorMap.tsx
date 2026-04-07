/**
 * LoopFloorMap.tsx - Loop Floor Map UI Component
 *
 * Displays the current floor as a circular 8-tile ring.
 * Shows player position, tile states, objective progress, and movement dice.
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useGameContext } from '../contexts/GameContext';
import type { LoopFloorTile, LoopFloor, LoopFloorTheme } from '../types/game';
import {
  PixelSword, PixelCrown, PixelShopBag, PixelQuestion,
  PixelCampfire, PixelHeart, PixelTreasure, PixelRefresh,
  PixelBook,
} from './PixelIcons';
import { TILES_PER_FLOOR } from '../config/loopFloors';

// ============================================================
// Tile Config
// ============================================================

const tileConfig: Record<string, {
  icon: React.ReactNode;
  label: string;
  color: string;
}> = {
  entry: { icon: <PixelHeart size={2} />, label: '入口', color: 'var(--pixel-green)' },
  battle: { icon: <PixelSword size={2} />, label: '战斗', color: 'var(--pixel-gold)' },
  boss_battle: { icon: <PixelCrown size={2} />, label: 'Boss', color: 'var(--pixel-purple)' },
  event: { icon: <PixelQuestion size={2} />, label: '事件', color: 'var(--pixel-blue)' },
  shop: { icon: <PixelShopBag size={2} />, label: '商店', color: 'var(--pixel-green)' },
  campfire: { icon: <PixelCampfire size={2} />, label: '营火', color: 'var(--pixel-orange)' },
  theme: { icon: <PixelTreasure size={2} />, label: '主题', color: 'var(--pixel-purple)' },
  risk: { icon: <PixelQuestion size={2} />, label: '风险', color: 'var(--pixel-red)' },
  exit: { icon: <PixelRefresh size={2} />, label: '出口', color: 'var(--pixel-gold)' },
};

const themeNames: Record<LoopFloorTheme, string> = {
  forge: '熔炉层',
  bazaar: '集市层',
  sanctum: '圣域层',
  boss: 'Boss 层',
};

const themeColors: Record<LoopFloorTheme, string> = {
  forge: 'var(--pixel-red)',
  bazaar: 'var(--pixel-green)',
  sanctum: 'var(--pixel-blue)',
  boss: 'var(--pixel-purple)',
};

// ============================================================
// Ring Layout Helper
// ============================================================

function getTilePosition(index: number, total: number, radius: number, cx: number, cy: number) {
  // Start from top, go clockwise
  const angle = (index / total) * Math.PI * 2 - Math.PI / 2;
  return {
    x: cx + Math.cos(angle) * radius,
    y: cy + Math.sin(angle) * radius,
  };
}

// ============================================================
// Component
// ============================================================

export const LoopFloorMap: React.FC = () => {
  const { game, enterLoopTile, rollAndMoveOnFloor } = useGameContext();
  const [isRolling, setIsRolling] = useState(false);

  const floor = game.loopFloors[game.currentFloorIndex];
  if (!floor) return null;

  const currentTile = game.currentTileIndex;
  const theme = floor.theme;

  // Ring dimensions
  const svgSize = 360;
  const cx = svgSize / 2;
  const cy = svgSize / 2;
  const radius = 120;

  const handleRollMove = async () => {
    if (isRolling) return;
    setIsRolling(true);
    // Small delay for animation feel
    setTimeout(() => {
      rollAndMoveOnFloor();
      setIsRolling(false);
    }, 600);
  };

  return (
    <div className="flex flex-col h-full map-bg-dungeon text-[var(--dungeon-text)] relative overflow-hidden">
      <div className="absolute inset-0 pixel-dither-overlay" />

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-20 p-4 pb-6 pt-3"
        style={{ background: 'linear-gradient(to bottom, #0c1018 40%, transparent)' }}>
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-xl font-black tracking-wider pixel-text-shadow leading-none"
              style={{ color: themeColors[theme] }}>
              {themeNames[theme]}
            </h2>
            <p className="text-[var(--dungeon-text-dim)] text-[10px] tracking-[0.1em] mt-1.5 font-bold">
              第 {floor.floorIndex + 1} 层 / {game.loopFloors.length}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold tracking-wider"
              style={{ color: floor.isExitOpen ? 'var(--pixel-green)' : 'var(--dungeon-text-dim)' }}>
              {floor.isExitOpen ? '✓ 出口已开启' : floor.objective.description}
            </p>
            <p className="text-[8px] text-[var(--dungeon-text-dim)] mt-0.5">
              进度: {floor.objective.current} / {floor.objective.target}
            </p>
          </div>
        </div>
      </div>

      {/* Ring Map */}
      <div className="flex-1 flex items-center justify-center relative z-10 pt-20 pb-44">
        <svg width={svgSize} height={svgSize} viewBox={`0 0 ${svgSize} ${svgSize}`}>
          {/* Connection lines */}
          {floor.tiles.map((tile, i) => {
            const nextI = (i + 1) % TILES_PER_FLOOR;
            const pos1 = getTilePosition(i, TILES_PER_FLOOR, radius, cx, cy);
            const pos2 = getTilePosition(nextI, TILES_PER_FLOOR, radius, cx, cy);
            const isPath = i === currentTile || nextI === currentTile;
            return (
              <line
                key={`line-${i}`}
                x1={pos1.x} y1={pos1.y}
                x2={pos2.x} y2={pos2.y}
                stroke={isPath ? 'var(--pixel-gold)' : 'rgba(140,160,180,0.4)'}
                strokeWidth={isPath ? 2.5 : 1.5}
                strokeDasharray={tile.resolved && floor.tiles[nextI].resolved ? 'none' : '4 3'}
              />
            );
          })}

          {/* Tiles */}
          {floor.tiles.map((tile, i) => {
            const pos = getTilePosition(i, TILES_PER_FLOOR, radius, cx, cy);
            const isCurrent = i === currentTile;
            const isResolved = tile.resolved;
            const isExit = tile.type === 'exit';
            const isExitReady = isExit && floor.isExitOpen;
            const cfg = tileConfig[tile.type] || tileConfig.battle;

            return (
              <g key={tile.id} transform={`translate(${pos.x}, ${pos.y})`}>
                {/* Glow for current */}
                {isCurrent && (
                  <circle r={26} fill="none" stroke="var(--pixel-gold)" strokeWidth={2} opacity={0.6}>
                    <animate attributeName="r" values="24;28;24" dur="2s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.6;0.2;0.6" dur="2s" repeatCount="indefinite" />
                  </circle>
                )}

                {/* Tile background */}
                <rect
                  x={-20} y={-20} width={40} height={40} rx={3}
                  fill={isCurrent ? '#1a1e2e' : isResolved ? '#0d1117' : '#141820'}
                  stroke={isCurrent ? 'var(--pixel-gold)' : isExitReady ? 'var(--pixel-green)' : isResolved ? 'rgba(140,160,180,0.3)' : cfg.color}
                  strokeWidth={isCurrent ? 3 : 2}
                  opacity={isResolved && !isCurrent ? 0.5 : 1}
                />

                {/* Icon area */}
                <g transform="translate(-6, -8)" style={{ color: cfg.color, opacity: isResolved && !isCurrent ? 0.4 : 1 }}>
                  {cfg.icon}
                </g>

                {/* Label */}
                <text
                  y={16} textAnchor="middle"
                  fill={isCurrent ? 'var(--pixel-gold)' : cfg.color}
                  fontSize={8} fontWeight="bold"
                  opacity={isResolved && !isCurrent ? 0.4 : 0.8}
                  style={{ fontFamily: 'fusion-pixel-12px-monospaced, monospace' }}
                >
                  {isExitReady ? '→ 出口' : cfg.label}
                </text>

                {/* Visit indicator */}
                {tile.visitCount > 0 && !isCurrent && (
                  <circle cx={16} cy={-16} r={6} fill="var(--pixel-gold)" opacity={0.8}>
                    <text x={16} y={-13} textAnchor="middle" fill="#000" fontSize={7} fontWeight="bold">
                      {tile.visitCount}
                    </text>
                  </circle>
                )}
              </g>
            );
          })}

          {/* Center info */}
          <text x={cx} y={cy - 12} textAnchor="middle" fill="var(--dungeon-text-dim)" fontSize={9}
            style={{ fontFamily: 'fusion-pixel-12px-monospaced, monospace' }}>
            移动点数
          </text>
          <text x={cx} y={cy + 8} textAnchor="middle" fill="var(--pixel-gold)" fontSize={22} fontWeight="bold"
            style={{ fontFamily: 'fusion-pixel-12px-monospaced, monospace' }}>
            {floor.totalMovePoints}
          </text>
        </svg>
      </div>

      {/* Bottom Controls */}
      <div className="absolute bottom-0 left-0 right-0 z-20 p-5"
        style={{ background: 'linear-gradient(to top, #0c1018 50%, transparent)' }}>
        <div className="max-w-sm mx-auto">
          {/* Roll button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleRollMove}
            disabled={isRolling}
            className={`w-full py-3 px-6 font-black tracking-wider text-base
              border-3 transition-all
              ${isRolling
                ? 'bg-[var(--dungeon-panel)] border-[var(--dungeon-panel-border)] text-[var(--dungeon-text-dim)] cursor-wait'
                : 'bg-[#1a1e2e] border-[var(--pixel-gold)] text-[var(--pixel-gold)] hover:bg-[#252a3a] cursor-pointer'
              }
            `}
            style={{ borderRadius: '2px' }}
          >
            <AnimatePresence mode="wait">
              {isRolling ? (
                <motion.span
                  key="rolling"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  🎲 投掷中...
                </motion.span>
              ) : (
                <motion.span
                  key="roll"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  🎲 投掷行进骰 (1~3)
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>

          {/* Status bar */}
          <div className="flex justify-between items-center mt-3">
            <div className="flex items-center gap-3">
              <div className="flex flex-col">
                <span className="text-[8px] text-[var(--dungeon-text-dim)] tracking-widest font-bold">生命</span>
                <div className="flex items-center gap-1.5">
                  <PixelHeart size={2} />
                  <span className="font-mono font-bold text-base text-[var(--dungeon-text-bright)] pixel-text-shadow">{game.hp}</span>
                </div>
              </div>
              <div className="h-6 w-[2px] bg-[var(--dungeon-panel-border)]" />
              <div className="flex flex-col">
                <span className="text-[8px] text-[var(--dungeon-text-dim)] tracking-widest font-bold">金币</span>
                <div className="flex items-center gap-1.5 text-[var(--pixel-gold)]">
                  <span className="font-mono font-bold text-base pixel-text-shadow">{game.souls}</span>
                </div>
              </div>
            </div>

            {/* Last roll display */}
            {game.pendingMoveRoll !== null && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex items-center gap-2 bg-[var(--dungeon-panel)] border-2 border-[var(--pixel-gold)] px-3 py-1"
                style={{ borderRadius: '2px' }}
              >
                <span className="text-[10px] text-[var(--dungeon-text-dim)]">移动</span>
                <span className="font-mono font-black text-lg text-[var(--pixel-gold)]">{game.pendingMoveRoll}</span>
                <span className="text-[10px] text-[var(--dungeon-text-dim)]">步</span>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
