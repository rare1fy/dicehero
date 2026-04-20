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
  PixelHeart, PixelShield, PixelRefresh, PixelPlay, PixelZap,
  PixelSkull, PixelFlame, PixelSword,
  PixelAttackIntent,
  PixelArrowRight,
  PixelMagic, PixelPoison, PixelCoin, PixelDice, PixelSoulCrystal,
  PixelBloodDrop,
} from './PixelIcons';
import { RelicPixelIcon } from './PixelRelicIcons';
import ForestBattleScene from './ForestBattleScene';
import IceBattleScene from './IceBattleScene';
import LavaBossScene from './LavaBossScene';
import ShadowBattleScene from './ShadowBattleScene';
import EternalBossScene from './EternalBossScene';
import { ClassLeftHand, ClassRightHand } from './ClassHands';
import { StatusIcon } from './StatusIcon';
import { EnemyQuoteBubble } from './EnemyQuoteBubble';
import { PixelSprite, hasSpriteData } from './PixelSprite';
import { PixelDiceRenderer, hasPixelRenderer } from './PixelDiceRenderer';
import { DiceFacePattern } from './DiceFacePattern';
import { ElementBadge } from './PixelDiceShapes';
import { useBattleContext } from '../contexts/BattleContext';
import { formatDescription } from '../utils/richText';
import { getDiceElementClass } from '../utils/uiHelpers';
import { STATUS_INFO } from '../data/statusInfo';
import { ANIMATION_TIMING } from '../config';
import ReactDOM from 'react-dom';
import { getDiceDef } from '../data/dice';

export function EnemyStageView() {
  const {
    game, setGame,
    enemies,
    dice,
    enemyEffects,
    playerEffect,
    floatingTexts,
    enemyQuotes,
    setEnemyInfoTarget,
    showChallengeDetail, setShowChallengeDetail,
    showWaveDetail, setShowWaveDetail,
    waveAnnouncement, setWaveAnnouncement: _setWaveAnnouncement,
    isAoeActive,
    isNormalAttackMulti,
    handHintIds,
    expectedOutcome,
    settlementPhase,
    settlementData,
    flashingRelicIds,
    selectedRelic, setSelectedRelic,
    showRelicPanel, setShowRelicPanel,
    handLeftThrow,
    shuffleAnimating,
    diceDiscardAnim,
    lastTappedDieId, setLastTappedDieId,
    skillTriggerTexts,
    targetEnemyUid,
    addToast,
    toggleSelect,
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
              <div className="text-[8px] text-[var(--dungeon-text-dim)] text-center mb-3 leading-relaxed border-t border-[var(--dungeon-panel-border)] pt-2">
                达成条件后将获得强力战斗援助效果，并获得额外宝箱奖励
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
            {ft.icon}
            {ft.text}
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Multi-enemy fixed-slot display */}
      <div className="relative" style={{ minHeight: '180px', display: 'grid', gridTemplateColumns: `repeat(${Math.max(enemies.length, 1)}, 1fr)`, alignItems: 'end', justifyItems: 'center', gap: '12px' }}>
      {[...enemies]
        .map((enemy) => {
          const effect = enemyEffects[enemy.uid] || null;
          const isDying = enemy.hp <= 0;
          // Bug-3: 死亡动画播放中(effect==='death')的敌人保持可见
          // 动画结束后(effect被清除或变更)不再渲染，避免空白占位符撑开grid
          if (isDying && effect !== 'death') {
            return null;
          }
        const isTarget = isAoeActive ? (enemy.hp > 0) : (enemy.uid === (targetEnemyUid_ || enemies.find(e => e.hp > 0)?.uid));
        const currentNode = game.map.find(n => n.id === game.currentNodeId);
        const baseSpriteSize = currentNode?.type === 'boss' ? 12 : currentNode?.type === 'elite' ? 10 : 7;
        const dist = enemy.distance || 0;
        const depthScale = dist === 0 ? 1.25 : dist === 1 ? 0.95 : dist === 2 ? 0.75 : 0.6;
        const depthY = dist >= 3 ? -50 : dist === 2 ? -25 : dist === 1 ? -5 : 30;
        const depthOpacity = 1.0;
        const depthBrightness = dist >= 3 ? 0.82 : dist === 2 ? 0.9 : dist === 1 ? 0.95 : 1.0;
        const depthZ = dist >= 3 ? 1 : dist === 2 ? 3 : dist === 1 ? 5 : 7;
        const spriteSize = Math.max(4, Math.round(baseSpriteSize * depthScale));

        return (
          <motion.div
            key={enemy.uid}
            onClick={() => {
              const aliveGuardian = enemies.find(e => e.hp > 0 && e.combatType === 'guardian' && e.uid !== enemy.uid);
              if (aliveGuardian && enemy.combatType !== 'guardian') {
                addToast('盾卫强制嘲讽！必须先击败盾卫');
                return;
              }
              setGame(prev => ({ ...prev, targetEnemyUid: enemy.uid }));
            }}
            initial={{ scale: depthScale * 0.8, opacity: 0, y: depthY + 20 }}
            animate={effect === 'death'
              ? { scale: [1, 1.1, 0.95, 1.05, 1.2, 1.4, 0.5, 0], opacity: [1, 1, 1, 1, 0.9, 0.7, 0.3, 0], y: [0, -5, 0, -3, -10, -25, -35, 10], rotate: [0, -5, 5, -3, 8, -15, 30, 0], filter: ['brightness(1)', 'brightness(1)', 'brightness(1)', 'brightness(1.5)', 'brightness(2)', 'brightness(3)', 'brightness(5)', 'brightness(0)'] }
              : effect === 'boss_entrance'
              ? { scale: [0.6, 1.4, 1.3, 1.35, 1.25, 1.3, 1.2, 1.25], y: [60, -15, -5, -12, 0, -8, 2, 0], opacity: [0, 1, 1, 1, 1, 1, 1, 1], rotate: [0, 0, -3, 3, -2, 2, -1, 0] }
              : effect === 'speaking'
              ? { x: [0, -2, 2, -1.5, 1.5, -1, 1, 0], scale: [1, 1.02, 0.98, 1.01, 0.99, 1] }
              : effect === 'attack'
              ? { y: [0, -8, 30, 0], scale: [1, 1.05, 1.12, 1] }
              : effect === 'defend'
              ? { scale: [1, 1.08, 1] }
              : effect === 'skill'
              ? { scale: [1, 1.2, 1], rotate: [0, 8, -8, 0] }
              : playerEffect === 'attack' && isTarget
              ? { x: [0, -4, 6, -3, 0], scale: [1, 0.97, 1.01, 0.99, 1] }
              : { scale: depthScale, y: depthY, opacity: depthOpacity }
            }
            transition={{ duration: effect === 'death' ? ANIMATION_TIMING.enemyDeathDuration / 1000 : effect === 'boss_entrance' ? ANIMATION_TIMING.bossEntranceDuration / 1000 : effect === 'speaking' ? ANIMATION_TIMING.speakingEffectDuration / 1000 : 0.4, ease: effect === 'death' ? [0.25, 0.1, 0.25, 1] : 'easeOut' }}
            className={`relative cursor-pointer group flex flex-col items-center`}
            style={{ zIndex: isTarget ? 10 : depthZ, filter: `brightness(${depthBrightness})` }}
          >
            {isTarget && (
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-20">
                <motion.div animate={{ y: [0, -3, 0] }} transition={{ duration: 1, repeat: Infinity }}>
                  <svg width="10" height="8" viewBox="0 0 10 8" style={{imageRendering:'pixelated'}}>
                    <polygon points="5,8 0,0 10,0" fill="var(--pixel-orange)" />
                  </svg>
                </motion.div>
              </div>
            )}
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
              <span className="ml-1 font-mono text-[var(--dungeon-text-dim)]">{enemy.attackDmg}</span>
            </div>
            <div className="text-center mb-0.5">
              <span className="font-bold text-[var(--dungeon-text-bright)] text-[12px] pixel-text-shadow">{enemy.name}</span><span className="ml-1 text-[9px] font-mono px-1 py-0" style={{borderRadius: '2px',border: '1px solid ' + ((enemy.combatType === 'warrior' || enemy.combatType === 'guardian') ? 'var(--pixel-orange)' : 'var(--pixel-cyan)'),color: (enemy.combatType === 'warrior' || enemy.combatType === 'guardian') ? 'var(--pixel-orange-light)' : 'var(--pixel-cyan-light)',background: (enemy.combatType === 'warrior' || enemy.combatType === 'guardian') ? 'rgba(224,120,48,0.15)' : 'rgba(48,216,208,0.15)',}}>{(enemy.combatType === 'warrior' || enemy.combatType === 'guardian') ? '近' : '远'}</span>
              {enemy.distance > 0 && (
                <div className="flex items-center justify-center gap-0.5 mt-0.5">
                  {Array.from({ length: 3 }).map((_, idx) => (
                    <div key={idx} className="w-1.5 h-1.5" style={{
                      background: idx < enemy.distance ? 'var(--pixel-orange)' : 'rgba(255,255,255,0.15)',
                      borderRadius: '1px',
                      boxShadow: idx < enemy.distance ? '0 0 3px rgba(224,120,48,0.5)' : 'none'
                    }} />
                  ))}
                  <span className="text-[9px] text-[var(--pixel-orange-light)] font-mono ml-0.5">{'距'}{enemy.distance}</span>
                </div>
              )}
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
              {enemy.statuses.map((s, i) => <StatusIcon key={i} status={s} align="center" />)}
            </div>
            <EnemyQuoteBubble text={enemyQuotes[enemy.uid] || null} category={enemy.category} />
            <div className={`relative ${
              enemy.combatType === 'warrior' ? 'animate-enemy-breathe-warrior' :
              enemy.combatType === 'caster' ? 'animate-enemy-breathe-caster' :
              enemy.combatType === 'guardian' ? 'animate-enemy-breathe-guardian' :
              enemy.combatType === 'ranger' ? 'animate-enemy-breathe-ranger' :
              enemy.combatType === 'priest' ? 'animate-enemy-breathe-priest' :
              'animate-enemy-breathe'
            }`}>
              {hasSpriteData(enemy.name) ? <PixelSprite name={enemy.name} size={spriteSize} /> : <PixelSkull size={spriteSize} />}
              {enemy.statuses.some(s => s.type === 'burn') && (
                <><div className="absolute inset-[-6px] pointer-events-none enemy-debuff-burn" style={{borderRadius:'50%'}} /><div className="absolute inset-[-8px] pointer-events-none enemy-burn-particles">{Array.from({length: 4}).map((_, pi) => (<div key={pi} className="enemy-burn-spark" style={{left: `${20 + Math.random() * 60}%`, animationDelay: `${Math.random() * 1.5}s`}} />))}</div></>
              )}
              {enemy.statuses.some(s => s.type === 'poison') && (
                <><div className="absolute inset-[-6px] pointer-events-none enemy-debuff-poison" style={{borderRadius:'50%'}} /><div className="absolute inset-[-8px] pointer-events-none enemy-poison-drips">{Array.from({length: 3}).map((_, pi) => (<div key={pi} className="enemy-poison-drip" style={{left: `${25 + Math.random() * 50}%`, animationDelay: `${Math.random() * 2}s`}} />))}</div></>
              )}
              {enemy.statuses.some(s => s.type === 'weak') && <div className="absolute inset-[-4px] pointer-events-none enemy-debuff-weak" style={{borderRadius:'50%'}} />}
              {enemy.statuses.some(s => s.type === 'vulnerable') && <div className="absolute inset-[-4px] pointer-events-none enemy-debuff-vulnerable" style={{borderRadius:'50%'}} />}
              {isTarget && <div className="absolute inset-[-6px] pointer-events-none enemy-target-glow" />}
            </div>
            <div className="mt-1 animate-enemy-shadow" style={{width: '150%', height: '18px', background: 'radial-gradient(ellipse, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.3) 45%, transparent 70%)', borderRadius: '50%', marginLeft: '-25%', filter: 'blur(3px)'}} />
            {dist > 0 && (
              <div className="distance-indicator mt-0.5">
                {Array.from({ length: 3 }, (_, i) => (<div key={i} className={i < dist ? 'distance-dot' : 'distance-dot-empty'} />))}
              </div>
            )}
            <AnimatePresence>
              {effect === 'attack' && (<motion.div initial={{ opacity: 0, scale: 0.5, y: 0 }} animate={{ opacity: 1, scale: 2, y: 80 }} exit={{ opacity: 0 }} className="absolute inset-0 flex items-center justify-center pointer-events-none z-20"><PixelSword size={5} /></motion.div>)}
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
    </div>
  );
}
