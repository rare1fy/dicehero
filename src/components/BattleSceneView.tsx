/**
 * BattleSceneView.tsx — 战斗场景入口组件
 *
 * 从 DiceHeroGame.tsx 提取（ARCH-F Round2）。
 * 负责战斗phase条件渲染、屏幕震动、闪光覆盖层。
 * 内部委托给 EnemyStageView 和 PlayerHudView。
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useBattleContext } from '../contexts/BattleContext';
import { useGameContext } from '../contexts/GameContext';
import { EnemyStageView } from './EnemyStageView';
import { PlayerHudView } from './PlayerHudView';

export function BattleSceneView() {
  const { game } = useGameContext();
  const { enemies, screenShake, lastTappedDieId, setLastTappedDieId, playerEffect, enemyEffects } = useBattleContext();

  return (
    <motion.div
      animate={screenShake ? { x: [-10, 10, -10, 10, 0] } : {}}
      className="flex flex-col h-full relative"
      onClick={() => lastTappedDieId && setLastTappedDieId(null)}
    >
      {/* 战斗闪光覆盖层 */}
      <AnimatePresence>
        {(playerEffect === 'attack' || Object.values(enemyEffects).includes('attack')) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.12, 0.05, 0.08, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, times: [0, 0.15, 0.3, 0.5, 1] }}
            className={`absolute inset-0 z-[60] pointer-events-none ${playerEffect === 'attack' ? 'bg-red-500' : 'bg-white'}`}
          />
        )}
      </AnimatePresence>

      {/* 上半区：敌人舞台 */}
      <EnemyStageView />

      {/* 下半区：玩家HUD */}
      <PlayerHudView />
    </motion.div>
  );
}
