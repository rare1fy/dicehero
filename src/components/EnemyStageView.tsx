/**
 * EnemyStageView.tsx — 战斗上半区：敌人舞台
 *
 * 从 DiceHeroGame.tsx 提取（ARCH-F Round2）。
 * 包含：场景背景、Debuff特效、波次信息、洞察弱点、敌人网格、
 *       波次公告、第一人称手部、技能飘字、结算演出、预期结果
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  PixelHeart,
  PixelShield,
  PixelSkull,
  PixelSword,
  PixelAttackIntent,
  PixelMagic,
} from './PixelIcons';
import ForestBattleScene from './ForestBattleScene';
import IceBattleScene from './IceBattleScene';
import LavaBossScene from './LavaBossScene';
import ShadowBattleScene from './ShadowBattleScene';
import EternalBossScene from './EternalBossScene';
import { ClassLeftHand, ClassRightHand } from './ClassHands';
import { StatusIcon } from './StatusIcon';
import { EnemyQuoteBubble } from './EnemyQuoteBubble';
import { NORMAL_ENEMIES, ELITE_ENEMIES, BOSS_ENEMIES } from '../config/enemies';

// 通过 configId 反查敌人所属 category（Enemy 运行时实例不含 category 字段，权威来源在 EnemyConfig）
const ENEMY_CATEGORY_MAP: Record<string, 'normal' | 'elite' | 'boss'> = (() => {
  const m: Record<string, 'normal' | 'elite' | 'boss'> = {};
  NORMAL_ENEMIES.forEach(e => { m[e.id] = 'normal'; });
  ELITE_ENEMIES.forEach(e => { m[e.id] = 'elite'; });
  BOSS_ENEMIES.forEach(e => { m[e.id] = 'boss'; });
  return m;
})();

// [2026-05-09] BOSS rank 反查：mid（中BOSS）/ final（终BOSS）/ undefined（非 BOSS）
//   用于在 sprite 外层叠加 aura/光圈/粒子等"BOSS 独特感"特效，区分中BOSS与终BOSS的视觉强度。
const BOSS_RANK_MAP: Record<string, 'mid' | 'final'> = (() => {
  const m: Record<string, 'mid' | 'final'> = {};
  BOSS_ENEMIES.forEach(e => { if (e.bossRank) m[e.id] = e.bossRank; });
  return m;
})();
import { PixelSprite, hasSpriteData } from './PixelSprite';
import { SettlementOverlay } from './SettlementOverlay';
import { DamagePreviewCard } from './DamagePreviewCard';
import { EnemySelectionFx } from './EnemySelectionFx';
import { EnemyRangeBadge } from './EnemyRangeBadge';
import { isFinalBossId } from '../data/finalBosses';
import { useBattleContext } from '../contexts/BattleContext';
import { BossTauntScene } from './BossTauntEntrance';
import { BossAura } from './BossAura';
import { formatDescription } from '../utils/richText';
import { renderFloatText } from '../utils/renderFloatText';
import { ANIMATION_TIMING } from '../config';
import { getDisplayAttackDmg } from '../logic/attackCalc';

export function EnemyStageView() {
  const {
    game,
    setGame,
    enemies,
    dice,
    enemyEffects,
    playerEffect,
    floatingTexts,
    enemyQuotes,
    setEnemyInfoTarget,
    showChallengeDetail,
    setShowChallengeDetail,
    showWaveDetail,
    setShowWaveDetail,
    waveAnnouncement,
    setWaveAnnouncement: _setWaveAnnouncement,
    phaseAnnouncement,
    setPhaseAnnouncement,
    isAoeActive,
    isNormalAttackMulti,
    handHintIds,
    handLeftThrow,
    shuffleAnimating,
    diceDiscardAnim,
    lastTappedDieId,
    setLastTappedDieId,
    skillTriggerTexts,
    targetEnemyUid,
    addToast,
    toggleSelect,
    currentHands,

  } = useBattleContext();

  const targetEnemyUid_ = targetEnemyUid || game.targetEnemyUid;

  return (
    <div className="flex-1 flex flex-col items-center justify-center relative z-[3] min-h-0 overflow-hidden">
      {/* 场景背景层 */}
      {(() => {
        const node = game.map.find(n => n.id === game.currentNodeId);
        const isBossNode = node?.type === 'boss';
        const ch = game.chapter;
        if (ch <= 1) return <ForestBattleScene isBoss={isBossNode} />;
        if (ch <= 2) return <IceBattleScene isBoss={isBossNode} />;
        if (ch <= 3) return <LavaBossScene isBoss={isBossNode} />;
        if (ch <= 4) return <ShadowBattleScene isBoss={isBossNode} />;
        return <EternalBossScene isBoss={isBossNode} />;
      })()}

      {/* 玩家Debuff屏幕特效层 */}
      {game.statuses.some(s => s.type === 'burn') && (
        <div className="absolute inset-0 z-[5] pointer-events-none debuff-screen-burn" />
      )}
      {game.statuses.some(s => s.type === 'poison') && (
        <>
          <div className="absolute inset-0 z-[5] pointer-events-none debuff-screen-poison" />
          <div className="absolute inset-0 z-[5] pointer-events-none debuff-poison-bubbles">
            {Array.from({length: 8}).map((_, i) => (
              <div key={i} className="debuff-poison-bubble" style={{
                left: `${10 + Math.random() * 80}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 2}s`,
              }} />
            ))}
          </div>
        </>
      )}
      {game.statuses.some(s => s.type === 'weak') && (
        <div className="absolute inset-0 z-[5] pointer-events-none debuff-screen-weak" />
      )}
      {game.statuses.some(s => s.type === 'vulnerable') && (
        <div className="absolute inset-0 z-[5] pointer-events-none debuff-screen-vulnerable" />
      )}

      {/* 波次信息 */}
      {game.battleWaves.length > 0 && (
        <div
          className="absolute top-2 left-2 z-20 flex flex-col gap-1 cursor-pointer"
          onClick={() => setShowWaveDetail(true)}
        >
          <div className="flex items-center gap-1 px-1.5 py-0.5 bg-[rgba(8,11,14,0.8)] border border-[var(--dungeon-panel-border)]" style={{borderRadius:'2px'}}>
            <PixelSkull size={1} className="inline-block mr-0.5" style={{ verticalAlign: 'middle' }} />
            <span className="text-[10px] text-[var(--pixel-orange)] font-bold">第{game.currentWaveIndex + 1}波</span>
            <span className="text-[9px] text-[var(--dungeon-text-dim)]">/ {game.battleWaves.length}波</span>
          </div>
          {game.currentWaveIndex + 1 < game.battleWaves.length && (
            <div className="flex items-center gap-0.5 px-1.5 py-0.5 bg-[rgba(8,11,14,0.65)] border border-[rgba(255,255,255,0.06)]" style={{borderRadius:'2px'}}>
              <span className="text-[8px] text-[var(--dungeon-text-dim)]">下波:</span>
              {game.battleWaves[game.currentWaveIndex + 1].enemies.slice(0, 3).map((ne, ni) => (
                <div key={ni} className="inline-flex items-center" title={ne.name} style={{ transform: 'scale(0.5)', transformOrigin: 'center', margin: '-2px' }}>
                  {hasSpriteData(ne.name) ? <PixelSprite name={ne.name} size={2} /> : <PixelSkull size={2} />}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 洞察弱点 */}
      {game.instakillChallenge && (
        <motion.div
          className="absolute top-2 right-2 z-20 max-w-[130px]"
          animate={game.instakillCompleted ? {
            scale: [1, 1.15, 1.05, 1.15, 1],
            rotate: [0, -2, 2, -2, 0],
          } : {}}
          transition={{ duration: 0.6 }}
        >
          <div
            className={`px-1.5 py-1 bg-[rgba(8,11,14,0.85)] border cursor-pointer transition-all ${
              game.instakillCompleted ? 'border-[var(--pixel-gold)]' :
              'border-[rgba(212,160,48,0.4)]'
            }`}
            style={{
              borderRadius:'2px',
              boxShadow: game.instakillCompleted ? '0 0 12px rgba(212,160,48,0.6), 0 0 24px rgba(212,160,48,0.3), inset 0 0 8px rgba(212,160,48,0.15)' : 'none',
            }}
            onClick={() => setShowChallengeDetail(true)}
          >
            <div className="text-[7px] text-[var(--pixel-gold)] font-bold tracking-wider mb-0.5 text-center">
              {game.instakillCompleted ? '✦ 弱点击破 ✦' : '◆ 洞察弱点'}
            </div>
            <div className={`text-[9px] font-bold text-center leading-tight ${
              game.instakillCompleted ? 'text-[var(--pixel-gold)]' :
              'text-[var(--dungeon-text-bright)]'
            }`}>
              {game.instakillChallenge.label}
            </div>
            {game.instakillChallenge.progress !== undefined && game.instakillChallenge.value && !game.instakillCompleted && (
              <div className="mt-0.5">
                <div className="h-1 bg-[rgba(255,255,255,0.1)] relative" style={{borderRadius:'1px'}}>
                  <div className="h-full bg-[var(--pixel-gold)]" style={{
                    width: `${Math.min(100, ((game.instakillChallenge.progress || 0) / (game.instakillChallenge.value || 1)) * 100)}%`,
                    borderRadius:'1px',
                    transition: 'width 0.3s',
                  }} />
                </div>
                <div className="text-[7px] text-[var(--dungeon-text-dim)] text-center mt-0.5 font-mono">
                  {game.instakillChallenge.progress || 0}/{game.instakillChallenge.value}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
      <AnimatePresence>
        {showChallengeDetail && game.instakillChallenge && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[60] flex items-center justify-center bg-[rgba(0,0,0,0.7)]"
            onClick={() => setShowChallengeDetail(false)}
          >
            <motion.div
              initial={{ scale: 0.8, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 20 }}
              className="pixel-panel p-4 max-w-[260px] w-[85%]"
              onClick={e => e.stopPropagation()}
            >
              <div className="text-[8px] text-[var(--pixel-gold)] font-bold tracking-[0.15em] text-center mb-1">◆ 洞察弱点 ◆</div>
              <div className="text-[13px] font-bold text-[var(--dungeon-text-bright)] text-center mb-2 pixel-text-shadow">{game.instakillChallenge.label}</div>
              <div className="text-[10px] text-[var(--dungeon-text)] leading-relaxed text-center mb-3">{formatDescription(game.instakillChallenge.description)}</div>
              {/* 进度条（仅在进行中且 value 存在时显示） */}
              {!game.instakillCompleted && game.instakillChallenge.value !== undefined && (
                <div className="mb-3 px-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[8px] text-[var(--dungeon-text-dim)] tracking-wider font-bold">进度</span>
                    <span className="text-[11px] font-mono font-bold text-[var(--pixel-gold-light)]">{game.instakillChallenge.progress || 0} / {game.instakillChallenge.value}</span>
                  </div>
                  <div className="h-1.5 bg-[rgba(0,0,0,0.4)] border border-[var(--dungeon-panel-border)] relative overflow-hidden" style={{borderRadius:'1px'}}>
                    <div className="h-full bg-[var(--pixel-gold)]" style={{ width: `${Math.min(100, ((game.instakillChallenge.progress || 0) / (game.instakillChallenge.value || 1)) * 100)}%`, transition: 'width 0.35s ease-out', boxShadow: '0 0 6px rgba(212,160,48,0.4)' }} />
                  </div>
                </div>
              )}
              <div className="border-t border-[var(--dungeon-panel-border)] pt-2 mb-3">
                {game.instakillCompleted && game.instakillAidType ? (
                  <>
                    <div className="text-[9px] text-[var(--pixel-gold)] font-bold text-center mb-1.5 tracking-wider">✦ 本次触发的援助 ✦</div>
                    <ul className="text-[10px] text-[var(--pixel-gold)] leading-snug space-y-0.5 pl-1">
                      {game.instakillAidType === 1 && (
                        <li>◆ 全场敌人受到 {game.map.find(n => n.id === game.currentNodeId)?.type === 'boss' ? '30%' : '50%'} 最大HP伤害</li>
                      )}
                      {game.instakillAidType === 2 && (
                        <li>◆ 全场敌人当前HP减半（保底1HP）</li>
                      )}
                      {game.instakillAidType === 3 && (
                        <li>◆ 全场敌人叠加大量灼烧+中毒</li>
                      )}
                      {game.instakillAidType === 4 && (
                        <li>◆ 本场战斗 +1 手牌上限</li>
                      )}
                      {game.instakillAidType === 5 && (
                        <li>◆ 立刻回复 25% 最大生命值 + 获得 30 金币</li>
                      )}
                    </ul>
                  </>
                ) : (
                  <>
                    <div className="text-[9px] text-[var(--pixel-gold)] font-bold text-center mb-1.5 tracking-wider">达成后将触发</div>
                    <ul className="text-[10px] text-[var(--dungeon-text-bright)] leading-snug space-y-0.5 pl-1">
                      {game.instakillChallenge.aidType === 1 && (
                        <li>◆ 全场敌人受到 {game.map.find(n => n.id === game.currentNodeId)?.type === 'boss' ? '30%' : '50%'} 最大HP伤害</li>
                      )}
                      {game.instakillChallenge.aidType === 2 && (
                        <li>◆ 全场敌人当前HP减半（保底1HP）</li>
                      )}
                      {game.instakillChallenge.aidType === 3 && (
                        <li>◆ 全场敌人叠加大量灼烧+中毒</li>
                      )}
                      {game.instakillChallenge.aidType === 4 && (
                        <li>◆ 本场战斗 +1 手牌上限</li>
                      )}
                      {game.instakillChallenge.aidType === 5 && (
                        <li>◆ 立刻回复 25% 最大生命值 + 获得 30 金币</li>
                      )}
                      {!game.instakillChallenge.aidType && (
                        <li className="text-[var(--dungeon-text)]">◆ 触发一种随机援助效果</li>
                      )}
                    </ul>
                  </>
                )}
              </div>
              <button onClick={() => setShowChallengeDetail(false)} className="w-full py-1.5 pixel-btn pixel-btn-ghost text-[10px]">关闭</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 敌人舞台光效 */}
      <div className="absolute inset-0 enemy-stage-glow pointer-events-none" />

      {/* 敌人浮动伤害数字 */}
      <AnimatePresence>
        {floatingTexts.filter(ft => ft.target === 'enemy').map(ft => (
          <motion.div
            key={ft.id}
            initial={{ opacity: 0, y: 20 + ft.y, scale: 0.5 }}
            animate={{ opacity: [0, 1, 1, 0], y: -120 + ft.y, x: ft.x, scale: [0.5, 1.4, 1.1, 1.6] }}
            transition={{ duration: 2.0, times: [0, 0.12, 0.75, 1] }}
            className={`absolute z-50 font-black text-3xl pointer-events-none flex items-center gap-1 drop-shadow-[0_3px_6px_rgba(0,0,0,0.7)] ${ft.color}`}
            style={{ top: '25%' }}
          >
            {renderFloatText(ft.text, ft.icon)}
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Multi-enemy fixed-slot display
          [2026-05-09] 位置稳定化：grid 列数始终 = enemies 数组长度（含已死者），
          死亡敌人保留空位占位，不让幸存敌人挤位。 */}
      <div className="relative" style={{ minHeight: '180px', display: 'grid', gridTemplateColumns: `repeat(${Math.max(enemies.length, 1)}, 1fr)`, alignItems: 'end', justifyItems: 'center', gap: '12px' }}>
      {[...enemies]
        .map((enemy) => {
          const effect = enemyEffects[enemy.uid] || null;
          const isDying = enemy.hp <= 0;
          // [2026-05-09] 死亡动画结束后的敌人渲染"占位空槽"（保持 grid 列位），
          //   避免旁边的活敌人挤到死者的位置。
          if (isDying && effect !== 'death') {
            return <div key={enemy.uid} aria-hidden style={{ visibility: 'hidden', minWidth: 1 }} />;
          }
        const isTarget = isAoeActive ? (enemy.hp > 0) : (enemy.uid === (targetEnemyUid_ || enemies.find(e => e.hp > 0)?.uid));
        const currentNode = game.map.find(n => n.id === game.currentNodeId);
        const isBossNode = currentNode?.type === 'boss';
        const isFinalBoss = isBossNode && isFinalBossId(enemy.configId);
        const baseSpriteSize = isBossNode ? 12 : currentNode?.type === 'elite' ? 10 : 7;
        const dist = enemy.distance || 0;
        // [2026-05-10 FINAL-BOSS-DEPTH-CAP v5] 四层级缩放：普通 1.25 / elite 1.25 / 章中 BOSS 1.05 / 终极 BOSS 1.15→0.62（v4=0.78 将终极 BOSS 打到比 elite 还小，压迫感消失；v5 重新拉大到 13.8 像素，比 elite 大 10%，走近时 1.15/0.62=1.85× 放大令“走向玩家”的压迫感回归）
        const depthScale = isFinalBoss ? (dist === 0 ? 1.15 : dist === 1 ? 0.95 : dist === 2 ? 0.78 : 0.62) : isBossNode ? (dist === 0 ? 1.05 : dist === 1 ? 0.92 : dist === 2 ? 0.75 : 0.6) : (dist === 0 ? 1.25 : dist === 1 ? 0.95 : dist === 2 ? 0.75 : 0.6);
        const depthY = dist >= 3 ? -50 : dist === 2 ? -25 : dist === 1 ? -5 : 30;
        const depthOpacity = 1.0;
        const depthBrightness = dist >= 3 ? 0.82 : dist === 2 ? 0.9 : dist === 1 ? 0.95 : 1.0;
        const depthZ = dist >= 3 ? 1 : dist === 2 ? 3 : dist === 1 ? 5 : 7;
        const spriteSize = Math.max(4, Math.round(baseSpriteSize * depthScale));

        return (
          <motion.div
            key={enemy.uid}
            data-enemy-uid={enemy.uid}
            onClick={() => {
              const aliveGuardian = enemies.find(e => e.hp > 0 && e.combatType === 'guardian' && e.uid !== enemy.uid);
              // [v2 2026-05-10] 葫芦/大葫芦：无视嘲讽（圣裁之印 / 王葬可越过盾卫直击目标）
              const bypassTaunt = currentHands?.activeHands?.some(h => h === '葫芦' || h === '大葫芦');
              if (aliveGuardian && enemy.combatType !== 'guardian' && !bypassTaunt) {
                addToast('盾卫强制嘲讽！必须先击败盾卫');
                return;
              }
              setGame(prev => ({ ...prev, targetEnemyUid: enemy.uid }));
            }}
            initial={{ scale: depthScale * 0.8, opacity: 0, y: depthY + 20 }}
            animate={effect === 'death'
              ? { scale: [1, 1.1, 0.95, 1.05, 1.2, 1.4, 0.5, 0], opacity: [1, 1, 1, 1, 0.9, 0.7, 0.3, 0], y: [0, -5, 0, -3, -10, -25, -35, 10], rotate: [0, -5, 5, -3, 8, -15, 30, 0], filter: ['brightness(1)', 'brightness(1)', 'brightness(1)', 'brightness(1.5)', 'brightness(2)', 'brightness(3)', 'brightness(5)', 'brightness(0)'] }
              : effect === 'boss_death'
              // [BOSS-DEATH-RITUAL] Boss 死亡完整仪式 2000ms：前半震颤金光（怒吼垂死），后半爆闪消散
              //  keyframe 0-0.5: 放大+金光震颤（仪式感）；0.5-1: 缩小旋转+淡出（消散）
              ? { scale: [1, 1.35, 1.3, 1.4, 1.45, 1.3, 0.7, 0], opacity: [1, 1, 1, 1, 1, 0.85, 0.4, 0], y: [0, -6, -4, -10, -8, -15, -30, 5], rotate: [0, -2, 3, -3, 2, -8, 25, 0], filter: ['brightness(1)', 'brightness(2.2)', 'brightness(2.5) hue-rotate(30deg)', 'brightness(3) hue-rotate(40deg)', 'brightness(3.5) hue-rotate(50deg)', 'brightness(4) hue-rotate(45deg)', 'brightness(5) hue-rotate(30deg)', 'brightness(0)'] }
              : effect === 'boss_entrance'
              ? { scale: [0.6, 1.4, 1.3, 1.35, 1.25, 1.3, 1.2, 1.25], y: [60, -15, -5, -12, 0, -8, 2, 0], opacity: [0, 1, 1, 1, 1, 1, 1, 1], rotate: [0, 0, -3, 3, -2, 2, -1, 0] }
              : effect === 'boss_low_hp'
              // [BOSS-LOW-HP-ROAR] Boss 怒吼：强烈抖动+放大 1.35 + 红光脉动 2000ms
              ? { scale: [1, 1.3, 1.25, 1.35, 1.28, 1.33, 1.3, 1.32], x: [0, -4, 5, -5, 4, -3, 3, 0], rotate: [0, -2, 2, -3, 2, -1, 1, 0], filter: ['brightness(1)', 'brightness(1.8) hue-rotate(-20deg)', 'brightness(1.5) hue-rotate(-15deg)', 'brightness(2) hue-rotate(-25deg)', 'brightness(1.6) hue-rotate(-18deg)', 'brightness(1.9) hue-rotate(-22deg)', 'brightness(1.7) hue-rotate(-20deg)', 'brightness(1.8) hue-rotate(-20deg)'] }
              : effect === 'speaking'
              ? { x: [0, -2, 2, -1.5, 1.5, -1, 1, 0], scale: [1, 1.02, 0.98, 1.01, 0.99, 1] }
              : effect === 'attack'
              ? { y: [0, -8, 30, 0], scale: [1, 1.05, 1.12, 1] }
              : effect === 'defend'
              ? { scale: [1, 1.08, 1] }
              : effect === 'skill'
              ? { scale: [1, 1.2, 1], rotate: [0, 8, -8, 0] }
              : effect === 'hit'
              ? { x: [0, -10, 12, -6, 3, 0], scale: [1, 0.9, 1.1, 0.95, 1.02, 1], filter: ['brightness(1)', 'brightness(3)', 'brightness(0.5)', 'brightness(2)', 'brightness(1)'] }
              : playerEffect === 'attack' && isTarget
              ? { x: [0, -4, 6, -3, 0], scale: [1, 0.97, 1.01, 0.99, 1] }
              : { scale: depthScale, y: depthY, opacity: depthOpacity }
            }
            transition={{ duration: effect === 'death' ? ANIMATION_TIMING.enemyDeathDuration / 1000 : effect === 'boss_death' ? ANIMATION_TIMING.bossDeathRitualDuration / 1000 : effect === 'boss_entrance' ? ANIMATION_TIMING.bossEntranceDuration / 1000 : effect === 'boss_low_hp' ? ANIMATION_TIMING.bossLowHpDuration / 1000 : effect === 'speaking' ? ANIMATION_TIMING.speakingEffectDuration / 1000 : 0.4, ease: effect === 'death' ? [0.25, 0.1, 0.25, 1] : 'easeOut' }}
            className={`relative cursor-pointer group flex flex-col items-center`}
            style={{ zIndex: isTarget ? 10 : depthZ, filter: `brightness(${depthBrightness})` }}
          >
            {/* [2026-05-10] 选中箭头已迁移至 .enemy-target-arrow（像素方块阵），此处 SVG 三角移除 */}
            {/* [HUD-COUNTER-SCALE 2026-05-10] 反向缩放抵消 depthScale，让远处敌人 HUD 字保持可读 */}
            <div className="flex flex-col items-center" style={{ transform: `scale(${1/depthScale})`, transformOrigin: 'bottom center' }}>
            {/* [2026-05-10 HUD-ARROW] ????????????????? ?? ??????/??????????????? */}
            <div className="relative">
            {isTarget && <div className="enemy-hud-arrow" aria-hidden="true" />}
            <div className="flex items-center justify-center mb-1 px-1.5 py-0.5 cursor-pointer hover:brightness-125 transition-all"
              onClick={(e) => { e.stopPropagation(); setEnemyInfoTarget(enemy.uid); }}
              style={{
                background: 'rgba(8,11,14,0.85)',
                border: '2px solid ' + (
                  enemy.combatType === 'warrior' ? 'var(--pixel-red)' :
                  enemy.combatType === 'guardian' ? 'var(--pixel-blue)' :
                  enemy.combatType === 'ranger' ? 'var(--pixel-green)' :
                  enemy.combatType === 'caster' ? 'var(--pixel-purple)' :
                  'var(--pixel-gold)'
                ),
                borderRadius: '2px', fontSize: '8px', fontWeight: 'bold',
                color: enemy.combatType === 'warrior' ? 'var(--pixel-red-light)' :
                  enemy.combatType === 'guardian' ? 'var(--pixel-blue-light)' :
                  enemy.combatType === 'ranger' ? 'var(--pixel-green-light)' :
                  enemy.combatType === 'caster' ? 'var(--pixel-purple-light)' :
                  'var(--pixel-gold-light)',
              }}
            >
              {enemy.combatType === 'warrior' && <><PixelSword size={2} /><span className="ml-0.5">战</span></>}
              {enemy.combatType === 'guardian' && <><PixelShield size={2} /><span className="ml-0.5">盾</span></>}
              {enemy.combatType === 'ranger' && <><PixelAttackIntent size={2} /><span className="ml-0.5">弓</span></>}
              {enemy.combatType === 'caster' && <><PixelMagic size={2} /><span className="ml-0.5">术</span></>}
              {enemy.combatType === 'priest' && <><PixelHeart size={2} /><span className="ml-0.5">牧</span></>}
              <span className="ml-1 font-mono text-[var(--dungeon-text-dim)]">{getDisplayAttackDmg(enemy)}</span>
            </div>
            </div>
            <div className="text-center mb-0.5">
              <span className="font-bold text-[var(--dungeon-text-bright)] text-[12px] pixel-text-shadow">{enemy.name}</span>
              {/* [2026-05-10 像素风差异化] 类别 tag + 距离 tag，由 EnemyRangeBadge 统一渲染 */}
              <EnemyRangeBadge enemy={enemy} />
            </div>
            <div className="pixel-hp-bar h-2.5 w-20 relative mb-1">
              <motion.div
                className={`h-full ${enemy.armor > 0 ? 'pixel-hp-fill-armor' : 'pixel-hp-fill-critical'}`}
                initial={{ width: '100%' }}
                animate={{ width: `${(enemy.hp / enemy.maxHp) * 100}%` }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[9px] font-mono font-bold text-white pixel-text-shadow">{enemy.hp}/{enemy.maxHp}</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-0.5 justify-center mb-1 min-h-[12px]">
              {enemy.armor > 0 && <StatusIcon status={{ type: 'armor', value: enemy.armor }} align="center" />}
              {/* [TRAIT-BADGE 2026-05-09] 让玩家看到"血怒/守护怒气/持续伤害放大/圣怒"层数，机制可视化 */}
              {(enemy.bloodFury || 0) > 0 && (
                <span className="text-[8px] font-bold px-1 py-0 border border-[var(--pixel-red)] text-[var(--pixel-red-light)] bg-[rgba(120,20,20,0.5)]" style={{borderRadius:'2px'}} title="血怒：每受一次伤害攻击力+25%（狂战+40%）">血怒×{enemy.bloodFury}</span>
              )}
              {(enemy.guardRage || 0) > 0 && (
                <span className="text-[8px] font-bold px-1 py-0 border border-[var(--pixel-blue)] text-[var(--pixel-blue-light)] bg-[rgba(40,60,120,0.5)]" style={{borderRadius:'2px'}} title="守护怒气：每防御一次下次攻击+60%">怒气×{enemy.guardRage}</span>
              )}
              {(enemy.dotAmplifier || 0) > 0 && (
                <span className="text-[8px] font-bold px-1 py-0 border border-[var(--pixel-purple)] text-[#d0a0ff] bg-[rgba(80,20,100,0.5)]" style={{borderRadius:'2px'}} title="持续伤害放大：每叠1层DOT放大系数+40%">DOT×{enemy.dotAmplifier}</span>
              )}
              {(enemy.holyWrath || 0) > 0 && (
                <span className="text-[8px] font-bold px-1 py-0 border border-[var(--pixel-gold)] text-[var(--pixel-gold-light)] bg-[rgba(120,100,20,0.5)]" style={{borderRadius:'2px'}} title="圣怒：治疗/护甲祝福/减益持续更强">圣怒×{enemy.holyWrath}</span>
              )}
              {enemy.statuses.map((s, i) => <StatusIcon key={i} status={s} align="center" />)}
            </div>
            </div>
            <EnemyQuoteBubble text={enemyQuotes[enemy.uid] || null} category={ENEMY_CATEGORY_MAP[enemy.configId] ?? 'normal'} />
            <div className={`relative ${
              enemy.combatType === 'warrior' ? 'animate-enemy-breathe-warrior' :
              enemy.combatType === 'caster' ? 'animate-enemy-breathe-caster' :
              enemy.combatType === 'guardian' ? 'animate-enemy-breathe-guardian' :
              enemy.combatType === 'ranger' ? 'animate-enemy-breathe-ranger' :
              enemy.combatType === 'priest' ? 'animate-enemy-breathe-priest' :
              'animate-enemy-breathe'
            }`}>
              {/* [BOSS-AURA 2026-05-09] 中/终 BOSS sprite 光效+粒子（章节配色） */}
              {(() => { const rank = BOSS_RANK_MAP[enemy.configId]; return rank ? <BossAura rank={rank} chapter={game.chapter} /> : null; })()}
              {/* [2026-05-10 SELECT-RING-Z-FIX] 选中光环渲染在 PixelSprite 之前 → DOM 先 = z 序低 → 精灵盖住光环上半，营造"敌人站在光圈中"的层次感 */}
              {isTarget && <EnemySelectionFx />}
              {hasSpriteData(enemy.name) ? <PixelSprite name={enemy.name} size={spriteSize} /> : <PixelSkull size={spriteSize} />}
              {enemy.statuses.some(s => s.type === 'burn') && (
                <><div className="absolute inset-[-6px] pointer-events-none enemy-debuff-burn" style={{borderRadius:'50%'}} /><div className="absolute inset-[-8px] pointer-events-none enemy-burn-particles">{Array.from({length: 4}).map((_, pi) => (<div key={pi} className="enemy-burn-spark" style={{left: `${20 + Math.random() * 60}%`, animationDelay: `${Math.random() * 1.5}s`}} />))}</div></>
              )}
              {enemy.statuses.some(s => s.type === 'poison') && (
                <><div className="absolute inset-[-6px] pointer-events-none enemy-debuff-poison" style={{borderRadius:'50%'}} /><div className="absolute inset-[-8px] pointer-events-none enemy-poison-drips">{Array.from({length: 3}).map((_, pi) => (<div key={pi} className="enemy-poison-drip" style={{left: `${25 + Math.random() * 50}%`, animationDelay: `${Math.random() * 2}s`}} />))}</div></>
              )}
              {enemy.statuses.some(s => s.type === 'weak') && <div className="absolute inset-[-4px] pointer-events-none enemy-debuff-weak" style={{borderRadius:'50%'}} />}
              {enemy.statuses.some(s => s.type === 'vulnerable') && <div className="absolute inset-[-4px] pointer-events-none enemy-debuff-vulnerable" style={{borderRadius:'50%'}} />}
            </div>
            <div className="mt-1 animate-enemy-shadow" style={{width: '150%', height: '18px', background: 'radial-gradient(ellipse, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.3) 45%, transparent 70%)', borderRadius: '50%', marginLeft: '-25%', filter: 'blur(3px)'}} />
            {/* [2026-05-09] 移除脚下距离指示点（distance-indicator） */}
            <AnimatePresence>
              {effect === 'attack' && (<motion.div initial={{ opacity: 0, scale: 0.5, y: 0 }} animate={{ opacity: 1, scale: 2, y: 80 }} exit={{ opacity: 0 }} className="absolute inset-0 flex items-center justify-center pointer-events-none z-20"><PixelSword size={5} /></motion.div>)}
            {effect === 'hit' && (<motion.div initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 1, 0] }} transition={{ duration: 0.4 }} className="absolute inset-0 pointer-events-none z-20 rounded-lg" style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.6) 0%, rgba(255,100,50,0.3) 50%, transparent 80%)' }} />)}
              {playerEffect === 'attack' && isTarget && (<motion.div initial={{ opacity: 1, scaleX: 0 }} animate={{ opacity: [1, 1, 0], scaleX: [0, 1.2, 1.5], rotate: -15 }} transition={{ duration: 0.35 }} className="absolute inset-[-10px] pointer-events-none z-30 slash-effect" />)}
            </AnimatePresence>
          </motion.div>
        );
      })}
      </div>

      {/* Wave announcement overlay */}
      <AnimatePresence>
        {waveAnnouncement !== null && (
          <motion.div
            key={`wave-${waveAnnouncement}`}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: [0, 1, 1, 1, 0], scale: [0.5, 1.2, 1, 1, 0.8], y: [0, 0, 0, 0, -30] }}
            transition={{ duration: 2.5, times: [0, 0.15, 0.3, 0.75, 1] }}
            onAnimationComplete={() => _setWaveAnnouncement(null)}
            className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none"
          >
            <div className="text-center">
              <div className="text-3xl font-black pixel-text-shadow" style={{ color: 'var(--pixel-orange)', letterSpacing: '4px' }}>{'\u7b2c'} {waveAnnouncement} {'\u6ce2'}</div>
              <div className="text-sm font-bold mt-1 pixel-text-shadow" style={{ color: 'var(--pixel-orange-light)' }}>{'\u654c\u4eba\u6765\u88ad\uff01'}</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* [PHASE-ANN 2026-05-09 v2] BOSS 阶段切换全屏横幅 — fixed 覆盖 + 暗幕 + 红色震撼脉冲 */}
      <AnimatePresence>
        {phaseAnnouncement !== null && (
          <motion.div
            key={`phase-${phaseAnnouncement.bossName}-${phaseAnnouncement.stage}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onAnimationComplete={() => { /* 用内层动画完成决定移除 */ }}
            className="fixed inset-0 z-[900] flex items-center justify-center pointer-events-none"
            style={{ background: 'radial-gradient(ellipse at center, rgba(120,10,10,0.55) 0%, rgba(10,2,2,0.75) 70%)' }}
          >
            {/* 顶/底部红色锯齿警告带 */}
            <div style={{ position: 'absolute', top: '22%', left: 0, right: 0, height: '6px', background: 'repeating-linear-gradient(90deg, #c04040 0px, #c04040 6px, transparent 6px, transparent 12px)' }} />
            <div style={{ position: 'absolute', bottom: '22%', left: 0, right: 0, height: '6px', background: 'repeating-linear-gradient(90deg, #c04040 0px, #c04040 6px, transparent 6px, transparent 12px)' }} />
            <motion.div
              initial={{ scale: 0.3, opacity: 0 }}
              animate={{
                scale: [0.3, 1.35, 1, 1, 1, 0.92],
                opacity: [0, 1, 1, 1, 1, 0],
                x: [0, -4, 4, -3, 3, 0],
              }}
              transition={{ duration: 3.6, times: [0, 0.1, 0.22, 0.4, 0.85, 1] }}
              onAnimationComplete={() => setPhaseAnnouncement(null)}
              className="text-center"
              style={{ filter: 'drop-shadow(0 0 16px rgba(220,40,40,0.9)) drop-shadow(0 0 40px rgba(220,40,40,0.5))' }}
            >
              <motion.div
                animate={{ opacity: [1, 0.4, 1, 0.4, 1] }}
                transition={{ duration: 1.6, repeat: Infinity }}
                className="text-[11px] font-black pixel-text-shadow"
                style={{ color: '#ffa0a0', letterSpacing: '0.5em' }}
              >
                ▲ PHASE CHANGE ▲
              </motion.div>
              <div className="text-[32px] font-black pixel-text-shadow mt-1" style={{ color: '#ff5050', letterSpacing: '8px', textShadow: '0 0 10px rgba(220,40,40,0.9), 2px 2px 0 #400' }}>
                阶段 {phaseAnnouncement.stage}
              </div>
              <div className="text-base font-black mt-2 pixel-text-shadow" style={{ color: 'var(--pixel-red-light)', letterSpacing: '3px' }}>
                {phaseAnnouncement.bossName} · 变身
              </div>
              <div className="text-xs font-bold mt-3 pixel-text-shadow max-w-[300px] mx-auto px-4" style={{ color: '#ffd0d0', lineHeight: 1.5 }}>
                「{phaseAnnouncement.taunt}」
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 波次详情弹窗 */}
      <AnimatePresence>
        {showWaveDetail && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-[60] flex items-center justify-center bg-[rgba(0,0,0,0.7)]" onClick={() => setShowWaveDetail(false)}>
            <motion.div initial={{ scale: 0.8, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.8, y: 20 }} className="bg-[var(--dungeon-panel-bg)] border-2 border-[var(--dungeon-panel-border)] p-3 max-w-[280px] w-[90%]" style={{ borderRadius: '4px' }} onClick={e => e.stopPropagation()}>
              <div className="text-[12px] font-bold text-[var(--dungeon-text-bright)] mb-2 text-center pixel-text-shadow">波次详情</div>
              {game.battleWaves.map((wave, wi) => (
                <div key={wi} className={`mb-2 p-2 border ${wi === game.currentWaveIndex ? 'border-[var(--pixel-orange)] bg-[rgba(224,120,48,0.1)]' : 'border-[rgba(255,255,255,0.08)]'}`} style={{borderRadius:'3px'}}>
                  <div className="text-[11px] font-bold mb-1" style={{ color: wi === game.currentWaveIndex ? 'var(--pixel-orange)' : 'var(--dungeon-text-dim)' }}>第{wi + 1}波 {wi === game.currentWaveIndex ? '(当前)' : wi < game.currentWaveIndex ? '(已清除)' : ''}</div>
                  <div className="flex flex-wrap gap-1">{wave.enemies.map((we, ei) => (<div key={ei} className="flex items-center gap-0.5 px-1 py-0.5 bg-[rgba(255,255,255,0.04)]" style={{borderRadius:'2px'}}><span className="text-[10px] text-[var(--dungeon-text)]">{we.name}</span><span className="text-[9px] text-[var(--dungeon-text-dim)]">HP{we.maxHp}</span></div>))}</div>
                </div>
              ))}
              <button className="w-full mt-1 py-1 text-[11px] text-[var(--dungeon-text-dim)] hover:text-[var(--dungeon-text)] transition-colors" onClick={() => setShowWaveDetail(false)}>关闭</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 第一人称手部 */}
      <div className="first-person-hands">
        {dice.some(d => d.rolling) && (
          <div className="hand-dice-fx">
            {Array.from({length: 8}).map((_, i) => (<div key={i} className="dice-particle" style={{animationDelay: `${i * 0.08}s`, left: `${15 + Math.sin(i * 0.8) * 12}%`, top: `${20 + Math.cos(i * 1.1) * 15}%`}} />))}
          </div>
        )}
        <div className={`hand-left ${dice.some(d => d.rolling) ? 'hand-left-rolling' : handLeftThrow ? 'hand-left-throw' : ''}`}>
          <ClassLeftHand playerClass={game.playerClass} />
        </div>
        <div className={`hand-right ${playerEffect === 'attack' ? 'hand-right-attacking' : ''} ${(game.playerClass === 'rogue' && game.playsLeft > 1) ? 'weapon-active-rogue' : (game.playerClass === 'mage' && (game.chargeStacks || 0) > 0) ? 'weapon-active-mage' : (game.playerClass === 'warrior' && (game.warriorRageMult || 0) > 0) ? 'weapon-active-warrior' : ''}`}>
          <ClassRightHand playerClass={game.playerClass} attacking={playerEffect === 'attack'} glowing={(game.playerClass === 'rogue' && game.playsLeft > 1) || (game.playerClass === 'mage' && (game.chargeStacks || 0) > 0) || (game.playerClass === 'warrior' && (game.warriorRageMult || 0) > 0)} />
        </div>
      </div>

      {/* 技能触发飘字 */}
      <AnimatePresence>
        {skillTriggerTexts.map(st => (
          <motion.div key={st.id} initial={{ opacity: 0, y: 30, scale: 0.5 }} animate={{ opacity: [0, 1, 1, 0], y: [-10, -40, -70, -110], scale: [0.5, 1.3, 1.1, 0.9] }} transition={{ duration: 1.8, delay: st.delay / 1000, times: [0, 0.15, 0.6, 1] }} className={`absolute z-[55] pointer-events-none flex items-center gap-1.5 ${st.color}`} style={{ bottom: '25%', left: `calc(50% + ${st.x}px)`, transform: 'translateX(-50%)', filter: 'drop-shadow(0 2px 8px rgba(60,200,100,0.6))' }}>
            {st.icon}
            <span className="font-bold text-sm pixel-text-shadow whitespace-nowrap">{st.name}</span>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* 结算演出覆盖层 + 出牌预期结算卡片（2026-04-21 铁律 B.1 拆分） */}
      <SettlementOverlay />
      <DamagePreviewCard />

      {/* Boss 路过嘲讽 - 场景层（v7：拆分后只负责精灵/气泡/名牌，点击提示在根层） */}
      <BossTauntScene />
    </div>
  );
}
