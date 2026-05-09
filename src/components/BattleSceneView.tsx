/**
 * BattleSceneView.tsx — 战斗场景入口组件
 *
 * 从 DiceHeroGame.tsx 提取（ARCH-F Round2）。
 * 负责战斗phase条件渲染、屏幕震动、闪光覆盖层。
 * 内部委托给 EnemyStageView 和 PlayerHudView。
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useBattleContext } from '../contexts/BattleContext';
import { useGameContext } from '../contexts/GameContext';
import { EnemyStageView } from './EnemyStageView';
import { PlayerHudView } from './PlayerHudView';
import { RelicPanelView } from './RelicPanelView';

export function BattleSceneView() {
  const { game } = useGameContext();
  const { enemies, screenShake, lastTappedDieId, setLastTappedDieId, playerEffect, enemyEffects } = useBattleContext();
  // [VENGEANCE-FX 2026-05-10] 监听复仇触发事件，叠加一段更短促的红色脉冲屏抖（与 screenShake 不冲突）
  const [vengeanceShake, setVengeanceShake] = useState(false);
  useEffect(() => {
    const onVeng = () => { setVengeanceShake(true); window.setTimeout(() => setVengeanceShake(false), 380); };
    window.addEventListener('dh-vengeance-triggered', onVeng);
    return () => window.removeEventListener('dh-vengeance-triggered', onVeng);
  }, []);

  return (
    <motion.div
      animate={
        screenShake
          ? { x: [-8, 8, -7, 6, -4, 4, -2, 2, 0], y: [0, -4, 3, -2, 2, -1, 0, 0, 0] }
          : vengeanceShake
            ? { x: [-5, 5, -4, 4, -2, 2, 0], y: [0, -2, 1, -1, 0, 0, 0] }
            : { x: 0, y: 0 }
      }
      transition={screenShake ? { duration: 0.55, ease: 'easeOut' } : vengeanceShake ? { duration: 0.38, ease: 'easeOut' } : { duration: 0 }}
      className="flex flex-col h-full relative"
      onClick={() => lastTappedDieId && setLastTappedDieId(null)}
    >
      {/* [VENGEANCE-FX] 复仇红光覆盖（短促） */}
      <AnimatePresence>
        {vengeanceShake && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: [0, 0.28, 0.18, 0.08, 0] }} exit={{ opacity: 0 }} transition={{ duration: 0.4, times: [0, 0.15, 0.4, 0.7, 1] }} className="absolute inset-0 z-[55] pointer-events-none" style={{ background: 'radial-gradient(ellipse at center, rgba(220,40,40,0.55) 0%, rgba(160,20,20,0.25) 50%, transparent 80%)' }} />
        )}
      </AnimatePresence>
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

      {/* 遗物库（底部条状按钮 + 弹起浮层 + 结算时自动展开+刷光） */}
      <RelicPanelView />
    </motion.div>
  );
}
