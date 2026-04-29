/**
 * PlayerHudView.tsx — 战斗下半区：玩家HUD
 * ARCH-F Round2 从 DiceHeroGame.tsx 提取
 */
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  PixelHeart, PixelShield, PixelRefresh, PixelPlay, PixelZap,
  PixelSkull, PixelFlame, PixelSword,
  PixelAttackIntent, PixelArrowUp, PixelArrowDown, PixelArrowRight,
  PixelMagic, PixelPoison, PixelCoin, PixelDice, PixelSoulCrystal,
  PixelBloodDrop,
} from './PixelIcons';
import { RelicPixelIcon } from './PixelRelicIcons';
import { StatusIcon } from './StatusIcon';
import { PixelDiceRenderer, hasPixelRenderer } from './PixelDiceRenderer';
import { DiceFacePattern } from './DiceFacePattern';
import { ElementBadge } from './PixelDiceShapes';
import { DiceBagPanel } from './DiceBagPanel';
import { MiniDice } from './MiniDice';
import { ClassIcon } from './ClassIcons';
import { CLASS_DEFS, type ClassId } from '../data/classes';
import BuffTooltip from './BuffTooltip';
import { useBattleContext } from '../contexts/BattleContext';
import { getDiceElementClass, getHpBarClass } from '../utils/uiHelpers';
import { formatDescription } from '../utils/richText';
import { COMBAT_TYPE_DESC } from '../logic/battleHelpers';
import { FURY_CONFIG } from '../config/gameBalance';
import { STATUS_INFO } from '../data/statusInfo';
import { getDiceDef } from '../data/dice';
import ReactDOM from 'react-dom';

const toggleLock = (_id: number) => {};

export function PlayerHudView() {
  const {
    game, setGame, enemies, dice, hpGained, playerEffect, floatingTexts,
    enemyInfoTarget, setEnemyInfoTarget, settlementPhase, settlementData,
    showDamageOverlay, expectedOutcome, isNormalAttackMulti, handHintIds,
    shuffleAnimating, diceDiscardAnim, lastTappedDieId,
    selectedRelic, setSelectedRelic, flashingRelicIds,
    showRelicPanel, setShowRelicPanel,
    currentHands, canReroll, canAffordReroll, freeRerollsRemaining, currentRerollCost,
    addToast, toggleSelect, rerollSelected, playHand, endTurn,
    isAoeActive,
  } = useBattleContext();

  const isNonWarriorMultiNormal = isNormalAttackMulti && game.playerClass !== 'warrior';

  return (
    <div className="relative z-[5] player-hud-panel">
      {/* 玩家浮动伤害数字 */}
      <AnimatePresence>
        {floatingTexts.filter(ft => ft.target === 'player').map(ft => (
          ft.large ? (
            <motion.div key={ft.id} initial={{ opacity: 0, y: 20, scale: 0.5 }} animate={{ opacity: [0, 1, 1, 1, 0], y: [-30, -60, -70, -80, -100], scale: [0.5, 1.4, 1.3, 1.3, 1.5] }} transition={{ duration: 2.0, times: [0, 0.1, 0.3, 0.8, 1] }} className="fixed z-[200] font-black text-2xl pointer-events-none flex items-center gap-1.5 text-purple-300" style={{ top: '35%', left: '50%', transform: 'translateX(-50%)', textShadow: '0 0 16px rgba(168,85,247,0.9), 0 0 32px rgba(168,85,247,0.5), 0 2px 4px rgba(0,0,0,0.9)' }}>
              {ft.icon}{ft.text}
            </motion.div>
          ) : (
            <motion.div key={ft.id} initial={{ opacity: 0, y: 0 + ft.y, scale: 0.5 }} animate={{ opacity: [0, 1, 1, 0], y: -80 + ft.y, x: ft.x, scale: [0.5, 2.0, 1.8, 2.2] }} transition={{ duration: 1.8, times: [0, 0.1, 0.75, 1] }} className={`absolute z-50 font-bold text-xl pointer-events-none flex items-center gap-1 pixel-text-shadow ${ft.color}`} style={{ top: '-20px', left: '50%', marginLeft: '-20px' }}>
              {ft.icon}{ft.text}
            </motion.div>
          )
        ))}
      </AnimatePresence>

      {/* Fullscreen Damage Overlay */}
      <AnimatePresence>
        {showDamageOverlay && (
          <motion.div key="damage-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(255,40,40,0.15) 0%, transparent 70%)' }}>
            <motion.div initial={{ scale: 0.3, opacity: 0.8 }} animate={{ scale: 3, opacity: 0 }} transition={{ duration: 1.2, ease: 'easeOut' }} className="absolute w-32 h-32 rounded-full" style={{ border: '3px solid rgba(255,80,40,0.6)', boxShadow: '0 0 40px rgba(255,80,40,0.4)' }} />
            <motion.div initial={{ scale: 0.2, opacity: 0.6 }} animate={{ scale: 2.5, opacity: 0 }} transition={{ duration: 1, ease: 'easeOut', delay: 0.1 }} className="absolute w-24 h-24 rounded-full" style={{ border: '2px solid rgba(255,200,60,0.5)', boxShadow: '0 0 30px rgba(255,200,60,0.3)' }} />
            <motion.div initial={{ opacity: 0.6 }} animate={{ opacity: 0 }} transition={{ duration: 0.4 }} className="absolute inset-0" style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 60%)' }} />
            <motion.div initial={{ scale: 0.1, opacity: 0 }} animate={{ scale: [0.1, 1.4, 1.0], opacity: [0, 1, 1] }} transition={{ duration: 0.5, times: [0, 0.6, 1], ease: 'easeOut' }} className="flex flex-col items-center gap-1">
              {showDamageOverlay.damage > 0 && (
                <motion.div animate={{ scale: [1, 1.05, 1], textShadow: ['0 0 30px rgba(255,60,60,0.8)', '0 0 60px rgba(255,60,60,1)', '0 0 30px rgba(255,60,60,0.8)'] }} transition={{ repeat: 2, duration: 0.4 }} className={`font-black pixel-text-shadow ${showDamageOverlay.damage >= 40 ? "text-7xl text-[var(--pixel-gold)]" : showDamageOverlay.damage >= 20 ? "text-6xl text-[var(--pixel-orange)]" : "text-5xl text-[var(--pixel-red)]"}`} style={{ textShadow: showDamageOverlay.damage >= 40 ? '0 0 60px rgba(212,160,48,1), 0 0 120px rgba(212,160,48,0.7), 0 4px 0 rgba(0,0,0,0.5)' : showDamageOverlay.damage >= 20 ? '0 0 50px rgba(224,120,48,0.9), 0 0 100px rgba(224,120,48,0.5), 0 4px 0 rgba(0,0,0,0.5)' : '0 0 40px rgba(255,60,60,0.9), 0 0 80px rgba(255,60,60,0.5), 0 4px 0 rgba(0,0,0,0.5)', letterSpacing: '2px' }}>
                  {showDamageOverlay.damage}
                </motion.div>
              )}
              <div className="flex items-center gap-3">
                {showDamageOverlay.armor > 0 && <motion.span initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="text-2xl font-bold text-[var(--pixel-blue)] pixel-text-shadow">+{showDamageOverlay.armor} 护甲</motion.span>}
                {showDamageOverlay.heal > 0 && <motion.span initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="text-2xl font-bold text-emerald-400 pixel-text-shadow">+{showDamageOverlay.heal} 治疗</motion.span>}
              </div>
            </motion.div>
            {[...Array(12)].map((_, i) => (
              <motion.div key={i} initial={{ x: 0, y: 0, opacity: 1, scale: 1 }} animate={{ x: Math.cos(i * 30 * Math.PI / 180) * (80 + Math.random() * 60), y: Math.sin(i * 30 * Math.PI / 180) * (80 + Math.random() * 60), opacity: 0, scale: 0.3 }} transition={{ duration: 0.8 + Math.random() * 0.4, ease: 'easeOut', delay: 0.05 }} className="absolute w-2 h-2" style={{ background: i % 3 === 0 ? 'var(--pixel-red)' : i % 3 === 1 ? 'var(--pixel-orange)' : 'var(--pixel-gold)', borderRadius: '1px', boxShadow: '0 0 6px currentColor' }} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 玩家状态行：HP + 状态图标 */}
      <div className="px-3 py-1">
        <div className="flex items-center gap-1.5 mb-1">
          <motion.div animate={hpGained ? { scale: [1, 1.1, 1], y: 0 } : playerEffect === 'attack' ? { y: [0, -8, 2, 0], scale: [1, 1.05, 0.98, 1] } : playerEffect === 'flash' ? { x: [0, -6, 8, -4, 3, 0], scale: [1, 0.95, 1.05, 0.97, 1.02, 1], filter: ['brightness(1)', 'brightness(2)', 'brightness(0.6)', 'brightness(1.5)', 'brightness(1)'] } : playerEffect === 'death' ? { x: [0, -8, 10, -6, 8, -4, 2, 0], y: [0, 4, -6, 4, -3, 2, -1, 0], scale: [1, 0.9, 1.05, 0.92, 0.98, 0.95, 0.9, 0.85], filter: ['brightness(1)', 'brightness(3)', 'brightness(0.3)', 'brightness(2)', 'brightness(0.5)', 'brightness(0.3)', 'brightness(0.2)', 'brightness(0)'], opacity: [1, 1, 1, 1, 0.9, 0.7, 0.4, 0] } : { y: 0, x: 0, scale: 1 }} className="flex items-center gap-1 shrink-0 cursor-pointer leading-none" onClick={() => {}}>
            {game.playerClass && CLASS_DEFS[game.playerClass as ClassId] ? (
              <><ClassIcon classId={game.playerClass} size={2.5} /><span className="font-bold text-[11px] pixel-text-shadow" style={{ color: CLASS_DEFS[game.playerClass as ClassId].colorLight }}>{CLASS_DEFS[game.playerClass as ClassId].name}</span></>
            ) : (
              <><PixelHeart size={1} /><span className="font-bold text-[11px] text-[var(--dungeon-text)] pixel-text-shadow">守夜人</span></>
            )}
          </motion.div>
          <div className="flex items-center gap-0.5 flex-1 overflow-x-auto overflow-y-hidden no-scrollbar min-w-0">
            {game.armor > 0 && <StatusIcon status={{ type: 'armor', value: game.armor }} align="left" />}
            {game.statuses.map((s, i) => <StatusIcon key={i} status={s} align="left" />)}
            {game.playerClass === 'warrior' && (game.bloodRerollCount || 0) > 0 && (() => {
              const fs = Math.min(game.bloodRerollCount || 0, FURY_CONFIG.maxStack);
              const atCap = (game.bloodRerollCount || 0) >= FURY_CONFIG.maxStack;
              return <BuffTooltip label={`+${Math.round(fs * FURY_CONFIG.damagePerStack * 100)}%`} icon={<PixelBloodDrop size={1.5} />} color="rgb(220,60,60)" bgColor="rgba(200,40,40,0.15)" borderColor="rgba(200,40,40,0.4)" title={`血怒 ${fs}/${FURY_CONFIG.maxStack}层${atCap ? ' [已满]' : ''}`} desc={`每次嗜血+${Math.round(FURY_CONFIG.damagePerStack * 100)}%最终伤害（最多${FURY_CONFIG.maxStack}层+${Math.round(FURY_CONFIG.maxStack * FURY_CONFIG.damagePerStack * 100)}%）。${atCap ? '叠满后卖血改为+' + FURY_CONFIG.armorAtCap + '护甲。' : ''}出牌后重置。`} />;
            })()}
            {game.playerClass === 'warrior' && (game.warriorRageMult || 0) > 0 && <BuffTooltip label={`狂暴+${Math.round((game.warriorRageMult || 0) * 100)}%`} icon={<PixelFlame size={1.5} />} color="rgb(255,80,40)" bgColor="rgba(255,60,20,0.15)" borderColor="rgba(255,60,20,0.4)" title={`狂暴本能 +${Math.round((game.warriorRageMult || 0) * 100)}%`} desc={`手牌达到6颗上限时，按受伤百分比(${Math.round((1 - game.hp / game.maxHp) * 100)}%)获得等比例伤害加成。`} />}
            {game.playerClass === 'mage' && (game.mageOverchargeMult || 0) > 0 && <BuffTooltip label={`+${Math.round((game.mageOverchargeMult || 0) * 100)}%`} icon={<PixelMagic size={1.5} />} color="rgb(192,132,252)" bgColor="rgba(160,80,255,0.15)" borderColor="rgba(160,80,255,0.4)" title={`过充吟唱 +${Math.round((game.mageOverchargeMult || 0) * 100)}%`} desc="手牌满6颗后继续吟唱，每回合+10%伤害倍率。出牌后重置。" />}
            {game.playerClass === 'mage' && (game.chargeStacks || 0) > 0 && <BuffTooltip label={`蓄${game.chargeStacks}层`} icon={<PixelMagic size={1.5} />} color="rgb(168,148,232)" bgColor="rgba(120,80,200,0.15)" borderColor="rgba(120,80,200,0.4)" title={`星界吟唱 Lv.${game.chargeStacks}`} desc={`手牌上限${Math.min(6, game.drawCount + (game.chargeStacks || 0))}/6，吟唱回合+${6 + (game.chargeStacks || 0) * 2}护甲。出牌后重置所有吟唱。`} />}
            {game.playerClass === 'rogue' && (game.comboCount || 0) > 0 && <BuffTooltip label={`连击${game.comboCount}`} icon={<PixelZap size={1.5} />} color="rgb(96,208,128)" bgColor="rgba(48,160,80,0.15)" borderColor="rgba(48,160,80,0.4)" title={`连击 ×${game.comboCount}`} desc="第2次出牌伤害+20%。两次相同牌型（非普攻）额外+25%。回合结束重置。" />}
          </div>
          <span className="ml-auto text-[9px] font-mono font-bold text-[var(--pixel-gold)] tracking-wider px-1.5 py-0.5 bg-[rgba(212,160,48,0.1)] border border-[var(--pixel-gold-dark)] shrink-0" style={{borderRadius:"2px"}}>R{game.battleTurn}</span>
        </div>
        <div className={`pixel-hp-bar h-3 relative ${playerEffect === 'flash' ? 'animate-hp-flash' : ''} ${playerEffect === 'death' ? 'animate-player-death-vignette' : ''} ${game.statuses.some(s => s.type === 'poison') ? 'animate-poison-pulse' : ''} ${game.statuses.some(s => s.type === 'burn') ? 'animate-burn-edge' : ''}`}>
          <motion.div className={`h-full ${game.armor > 0 ? 'pixel-hp-fill-armor' : getHpBarClass(game.hp, game.maxHp)}`} initial={{ width: '100%' }} animate={{ width: `${(game.hp / game.maxHp) * 100}%` }} transition={{ duration: 0.3 }} />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[10px] font-mono font-bold text-white pixel-text-shadow">{game.hp}/{game.maxHp} {game.armor > 0 && `[+${game.armor}]`}</span>
          </div>
        </div>
      </div>

      {/* 敌人信息弹窗 */}
      <AnimatePresence>
        {enemyInfoTarget && (() => {
          const infoEnemy = enemies.find(e => e.uid === enemyInfoTarget);
          if (!infoEnemy) return null;
          const typeInfo = COMBAT_TYPE_DESC[infoEnemy.combatType] || COMBAT_TYPE_DESC.warrior;
          const isMelee = infoEnemy.combatType === 'warrior' || infoEnemy.combatType === 'guardian';
          return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70" onClick={() => setEnemyInfoTarget(null)}>
              <motion.div initial={{ scale: 0.85, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.85, y: 20 }} onClick={e => e.stopPropagation()} className="w-[85vw] max-w-sm pixel-panel p-3 bg-[var(--dungeon-bg)]">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2"><span className="text-xl">{infoEnemy.emoji}</span><div><div className="text-sm font-black text-[var(--dungeon-text-bright)] pixel-text-shadow">{infoEnemy.name}</div><div className="flex items-center gap-1 mt-0.5"><span className="text-xs" style={{ color: typeInfo.color }}>{typeInfo.icon} {typeInfo.name}</span><span className="text-[10px] text-[var(--dungeon-text-dim)]">|</span><span className="text-[11px] font-mono text-[var(--pixel-red-light)]">{infoEnemy.attackDmg} ATK</span></div></div></div>
                  <button onClick={() => setEnemyInfoTarget(null)} className="text-[var(--dungeon-text-dim)] hover:text-white text-sm font-bold"></button>
                </div>
                <div className="text-[11px] text-[var(--dungeon-text)] leading-relaxed mb-2 px-1" style={{ borderLeft: '2px solid ' + typeInfo.color, paddingLeft: '6px' }}>{formatDescription(typeInfo.desc)}</div>
                <div className="grid grid-cols-2 gap-1.5 mb-2">
                  <div className="px-2 py-1 bg-[rgba(8,11,14,0.6)] border border-[var(--dungeon-panel-border)]" style={{borderRadius:'2px'}}><div className="text-[9px] text-[var(--dungeon-text-dim)]">生命</div><div className="text-[12px] font-mono font-bold text-[var(--pixel-red-light)]">{infoEnemy.hp}/{infoEnemy.maxHp}</div></div>
                  <div className="px-2 py-1 bg-[rgba(8,11,14,0.6)] border border-[var(--dungeon-panel-border)]" style={{borderRadius:'2px'}}><div className="text-[9px] text-[var(--dungeon-text-dim)]">护甲</div><div className="text-[12px] font-mono font-bold text-[var(--pixel-blue-light)]">{infoEnemy.armor}</div></div>
                  <div className="px-2 py-1 bg-[rgba(8,11,14,0.6)] border border-[var(--dungeon-panel-border)]" style={{borderRadius:'2px'}}><div className="text-[9px] text-[var(--dungeon-text-dim)]">距离</div><div className="text-[12px] font-mono font-bold" style={{ color: isMelee && infoEnemy.distance > 0 ? 'var(--pixel-orange)' : 'var(--pixel-green-light)' }}>{infoEnemy.distance === 0 ? '近身' : `距离 ${infoEnemy.distance}`}</div></div>
                  <div className="px-2 py-1 bg-[rgba(8,11,14,0.6)] border border-[var(--dungeon-panel-border)]" style={{borderRadius:'2px'}}><div className="text-[9px] text-[var(--dungeon-text-dim)]">行动</div><div className="text-[12px] font-mono font-bold text-[var(--dungeon-text)]">{isMelee && infoEnemy.distance > 0 ? '逼近中' : '攻击'}</div></div>
                </div>
                {infoEnemy.statuses.length > 0 && <div className="flex flex-wrap gap-1 mb-1">{infoEnemy.statuses.map((s, idx) => <span key={idx} className="text-[10px] px-1 py-0.5 bg-[rgba(8,11,14,0.6)] border border-[var(--dungeon-panel-border)] text-[var(--dungeon-text)]" style={{borderRadius:'2px'}}>{s.type} {s.value}</span>)}</div>}
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {(() => {
        const isWarriorRage = game.playerClass === 'warrior' && game.hp <= game.maxHp * 0.5;
        return (
        <div className={`px-2 pb-3 pt-0.5 border-t-2 relative overflow-hidden ${isWarriorRage ? 'warrior-rage-panel' : ''}`} style={{ borderColor: isWarriorRage ? 'rgba(200,40,40,0.6)' : 'var(--dungeon-panel-border)', background: isWarriorRage ? 'linear-gradient(180deg, rgba(80,10,10,0.3) 0%, transparent 40%)' : undefined }}>
          {isWarriorRage && <div className="absolute inset-0 pointer-events-none z-[1]">{[...Array(8)].map((_, i) => (<motion.div key={`blood-particle-${i}`} className="absolute w-1.5 h-1.5" style={{ left: `${10 + i * 11}%`, bottom: 0, background: i % 3 === 0 ? '#c04040' : i % 3 === 1 ? '#a02020' : '#e06060', borderRadius: '1px', boxShadow: `0 0 4px ${i % 2 === 0 ? 'rgba(200,40,40,0.6)' : 'rgba(255,80,60,0.4)'}` }} animate={{ y: [0, -60 - Math.random() * 40], opacity: [0.8, 0], scale: [1, 0.3] }} transition={{ duration: 1.8 + Math.random() * 1.2, repeat: Infinity, delay: i * 0.35, ease: 'easeOut' }} />))}</div>}

          {/* 骰子库 + 流转 + 弃骰库 */}
          <div className="flex items-center gap-1 mb-0.5 px-1 mt-1">
            <DiceBagPanel ownedDice={game.ownedDice.map(d => d.defId)} diceBag={game.diceBag} discardPile={game.discardPile} position="left" />
            <div className="flex-1 flex gap-px overflow-hidden items-center justify-center relative h-5">
              <div className="flex gap-px items-center justify-end flex-1 overflow-hidden">
                <AnimatePresence mode="popLayout">{(() => { const bagDice = game.diceBag.map((defId, i) => ({ defId, idx: i })); const drawCount = game.drawCount || 4; const handSize = dice.filter(d => !d.spent).length; const nextDrawCount = Math.max(0, drawCount - handSize); return bagDice.map(({ defId, idx }) => { const isNextDraw = idx < nextDrawCount; return <motion.div key={defId + "-bag-" + idx} layout initial={shuffleAnimating ? { opacity: 0, x: 60, scale: 0.3 } : { opacity: 0, y: 10, scale: 0.5 }} animate={{ opacity: isNextDraw ? 1 : 0.6, y: isNextDraw ? -1 : 0, x: 0, scale: isNextDraw ? 1.15 : 1 }} exit={{ opacity: 0, scale: 0.3, y: -8 }} transition={shuffleAnimating ? { type: "spring", stiffness: 200, damping: 20, delay: idx * 0.04 } : { type: "spring", stiffness: 300, damping: 25 }}><MiniDice defId={defId} size={14} highlight={isNextDraw} /></motion.div>; }); })()}</AnimatePresence>
                {game.diceBag.length === 0 && !shuffleAnimating && <span className="text-[7px] text-[var(--dungeon-text-dim)] font-mono italic">empty</span>}
              </div>
              <div className="w-px h-4 bg-[var(--dungeon-text-dim)] opacity-40 mx-1 shrink-0" />
              <div className="flex gap-px items-center justify-start flex-1 overflow-hidden">
                <AnimatePresence mode="popLayout">{game.discardPile.map((defId, i) => (<motion.div key={defId + "-disc-" + i} layout initial={{ opacity: 0, y: 10, scale: 0.5 }} animate={shuffleAnimating ? { opacity: 0, x: -60, scale: 0.3, transition: { duration: 0.3, delay: i * 0.03 } } : { opacity: 0.3, y: 0, scale: 1 }} exit={{ opacity: 0, x: -40, scale: 0.3 }} transition={{ type: "spring", stiffness: 300, damping: 25 }}><MiniDice defId={defId} size={14} /></motion.div>))}</AnimatePresence>
                {game.discardPile.length === 0 && <span className="text-[7px] text-[var(--dungeon-text-dim)] font-mono italic">empty</span>}
              </div>
            </div>
            <DiceBagPanel ownedDice={game.ownedDice.map(d => d.defId)} diceBag={game.diceBag} discardPile={game.discardPile} position="right" />
          </div>

          {/* 骰子行 */}
          <div className="flex justify-center gap-2.5 mb-1.5 min-h-[80px] items-end relative pt-[20px]">
            {dice.filter(d => !d.spent).map((die) => {
              const isHint = !die.selected && handHintIds.has(die.id) && !die.rolling;
              const isComboReady = game.playerClass === 'rogue' && (game.comboCount || 0) >= 1 && game.playsLeft > 0 && !die.selected && !die.rolling && !die.playing && handHintIds.has(die.id);
              const usePixelRender = hasPixelRenderer(die.diceDefId) || (isNormalAttackMulti && die.selected && hasPixelRenderer('standard'));
              return (
                <div key={`die-wrap-${die.id}`} data-die-id={die.id} className={`relative ${isHint ? 'dice-hand-hint-wrap' : ''} ${isComboReady ? 'dice-combo-ready' : ''} ${die.diceDefId === 'temp_rogue' ? 'dice-temp-ghost' : ''}`}>
                <motion.button key={`die-${die.id}`} initial={die.justAdded ? { scale: 0, y: 60, opacity: 0, rotate: -180 } : false} animate={diceDiscardAnim && !die.spent ? { y: -100, x: 80, opacity: 0, scale: 0.3, rotate: 180 } : die.rolling ? { rotate: [0, 90, 180, 270, 360], scale: [1, 1.15, 1, 1.15, 1], y: [0, -10, 0, -8, 0], opacity: 1 } : die.playing ? { y: -180, opacity: 0, scale: 2, rotate: 720 } : die.selected ? { y: -18, scale: 1.12, rotate: 0 } : { rotate: 0, scale: 1, y: 0, opacity: 1 }} transition={diceDiscardAnim && !die.spent ? { duration: 0.25, ease: 'easeIn' } : die.rolling ? { repeat: Infinity, duration: 0.15, ease: 'linear' } : die.playing ? { duration: 0.4, ease: 'easeOut' } : die.selected ? { duration: 0.12, type: 'spring', stiffness: 500, damping: 25 } : { duration: 0.06, ease: 'easeOut' }} onClick={(e) => { e.stopPropagation(); !die.rolling && !game.isEnemyTurn && toggleSelect(die.id); }} onDoubleClick={(e) => { e.stopPropagation(); toggleLock(die.id); }} className={`${usePixelRender ? '' : getDiceElementClass(isNormalAttackMulti && die.selected && die.element !== 'normal' ? 'normal' : die.element, die.selected, die.rolling, false, isNormalAttackMulti && die.selected ? undefined : die.diceDefId)} ${!usePixelRender && die.selected && !die.playing ? 'dice-selected-enhanced' : ''} ${die.playing ? 'pixel-dice-playing' : ''} ${(!die.selected && game.isEnemyTurn) ? 'pointer-events-none' : ''} ${usePixelRender ? 'cursor-pointer relative flex items-center justify-center' : ''}`} style={{ width: '56px', height: '56px', ...(usePixelRender ? { background: 'transparent', border: 'none', padding: 0, boxShadow: 'none', fontSize: 0, outline: 'none', borderRadius: 0 } : { fontSize: '26px' }), ...(die.kept && !usePixelRender ? { boxShadow: '0 0 6px rgba(234,179,8,0.6)', borderColor: '#eab308' } : {}), ...(!die.selected && game.isEnemyTurn ? { filter: 'grayscale(0.5) brightness(0.7)', opacity: 0.6 } : {}) }}>
                  {usePixelRender ? (
                    <PixelDiceRenderer diceDefId={isNormalAttackMulti && die.selected ? 'standard' : die.diceDefId} value={die.value} size={56} selected={die.selected} rolling={die.rolling} element={!isNormalAttackMulti || !die.selected ? (die.collapsedElement || (die.element !== 'normal' ? die.element : undefined)) : undefined} />
                  ) : (
                    <>{!die.rolling && !die.playing && die.diceDefId !== 'standard' && !(isNormalAttackMulti && die.selected) && <DiceFacePattern diceDefId={die.diceDefId} />}<span className={`relative z-[2] ${(die.element === 'normal' || (isNormalAttackMulti && die.selected)) ? 'font-semibold' : 'font-black pixel-text-shadow'}`} style={{ textShadow: '0 1px 3px rgba(0,0,0,0.8), 0 0 6px rgba(0,0,0,0.5)' }}>{die.rolling ? "?" : die.value}</span></>
                  )}
                  {!usePixelRender && !die.rolling && die.element !== 'normal' && !(isNormalAttackMulti && die.selected) && <div className="absolute top-0.5 right-0.5 pointer-events-none z-[3]"><ElementBadge element={die.element} size={8} /></div>}
                  {die.kept && <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 pointer-events-none"><svg width="10" height="10" viewBox="0 0 10 10" className="drop-shadow-[0_0_2px_rgba(234,179,8,0.8)]"><rect x="1" y="5" width="8" height="5" rx="1" fill="#eab308"/><path d="M3 5V3a2 2 0 0 1 4 0v2" fill="none" stroke="#eab308" strokeWidth="1.5"/></svg></div>}
                </motion.button>
                {die.selected && !die.spent && !die.rolling && !die.playing && die.id === lastTappedDieId && (() => {
                  const wrapEl = document.querySelector(`[data-die-id="${die.id}"]`);
                  if (!wrapEl) return null;
                  const rect = wrapEl.getBoundingClientRect();
                  const tipLeft = Math.max(8, Math.min(rect.left + rect.width / 2 - 90, window.innerWidth - 188));
                  const tipTop = rect.top - 20;
                  const def = getDiceDef(die.diceDefId);
                  const collapsed = die.collapsedElement || (die.element !== 'normal' ? die.element : null);
                  const ELEM_NAMES: Record<string, string> = { fire: '火焰骰子', ice: '冰霜骰子', thunder: '雷电骰子', poison: '剧毒骰子', holy: '神圣骰子', shadow: '暗影骰子' };
                  const ELEM_DESCS: Record<string, string> = { fire: '造成额外灼烧伤害（持续2回合）', ice: '冻结敌人，令其跳过1回合行动', thunder: '雷击造成AOE范围伤害', poison: '施加毒素持续掉血', holy: '治疗自身并净化负面状态' };
                  const ELEM_COLORS: Record<string, string> = { fire: '#ff8040', ice: '#60c0f0', thunder: '#e0d040', poison: '#60e060', holy: '#e0d8a0', shadow: '#a080d0' };
                  const tipName = def.isElemental && collapsed ? ELEM_NAMES[collapsed] || def.name : def.name;
                  const tipDesc = def.isElemental && collapsed ? ELEM_DESCS[collapsed] || def.description : (def.onPlay?.scaleWithHits ? `${def.description}（当前累计+${game.furyBonusDamage || 0}伤害）` : def.description);
                  const tipColor = def.isElemental && collapsed ? (ELEM_COLORS[collapsed] || '#c8c8d0') : (() => { const id = def.id; return id.startsWith('w_') ? '#ff6060' : id.startsWith('mage_') ? '#a070ff' : id.startsWith('r_') ? '#60d080' : '#c8c8d0'; })();
                  const tipBg = def.isElemental && collapsed ? `${tipColor}22` : (() => { const id = def.id; return id.startsWith('w_') ? 'rgba(192,64,64,0.2)' : id.startsWith('mage_') ? 'rgba(112,64,192,0.2)' : id.startsWith('r_') ? 'rgba(48,160,80,0.2)' : 'rgba(200,200,200,0.1)'; })();
                  const tipBorder = def.isElemental && collapsed ? `${tipColor}66` : (() => { const id = def.id; return id.startsWith('w_') ? 'rgba(192,64,64,0.4)' : id.startsWith('mage_') ? 'rgba(112,64,192,0.4)' : id.startsWith('r_') ? 'rgba(48,160,80,0.4)' : 'rgba(200,200,200,0.2)'; })();
                  return ReactDOM.createPortal(
                    <div className="fixed pointer-events-none z-[150]" style={{ top: tipTop, left: tipLeft, width: '180px', transform: 'translateY(-100%)' }}>
                      <div className="px-2 py-1.5 bg-[rgba(12,10,20,0.95)] backdrop-blur-sm border border-[rgba(255,255,255,0.15)] text-center" style={{ borderRadius: '4px' }}>
                        <span className="inline-block px-1.5 py-0.5 text-[9px] font-black mb-1" style={{ color: tipColor, background: tipBg, border: `1px solid ${tipBorder}`, borderRadius: '2px' }}>{tipName}</span>
                        {tipDesc && <div className="text-[9px] text-[var(--dungeon-text)] leading-snug mt-0.5">{formatDescription(tipDesc)}</div>}
                        <div className="text-[8px] text-[var(--dungeon-text-dim)] mt-0.5 font-mono opacity-70">面值: [{def.faces.join(', ')}]</div>
                        {die.diceDefId === 'w_fury' && (game.furyBonusDamage || 0) > 0 && <div className="text-[8px] text-orange-400 mt-0.5 font-bold">当前叠加: +{game.furyBonusDamage}伤害</div>}
                      </div>
                      <div className="w-0 h-0 mx-auto" style={{ borderLeft: '5px solid transparent', borderRight: '5px solid transparent', borderTop: '5px solid rgba(12,10,20,0.85)' }} />
                    </div>, document.body
                  );
                })()}
                </div>
              );
            })}
            {dice.every(d => d.spent) && <div className="text-[var(--dungeon-text-dim)] text-[11px] font-bold py-4">所有骰子已使用</div>}
          </div>

          {/* 操作按钮行 */}
          <div className="flex gap-1.5 items-center">
            <motion.button disabled={!dice.some(d => d.selected && !d.spent) || game.isEnemyTurn || dice.some(d => d.playing) || !canAffordReroll} onClick={() => { if (game.isEnemyTurn) { addToast('敌人回合中，无法操作'); return; } if (dice.some(d => d.playing)) { addToast('正在出牌中...'); return; } if (!dice.some(d => d.selected && !d.spent)) { addToast('请先选中要重掷的骰子'); return; } if (!canReroll) { addToast('免费重投次数已用完'); return; } rerollSelected(); }} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className={`h-10 px-3 ${currentRerollCost <= 0 ? 'bg-[var(--pixel-green-dark)] border-[var(--pixel-green)] text-[var(--pixel-green-light)]' : currentRerollCost <= 4 ? 'bg-[#4a1a1a] border-[#c04040] text-[#ff8080]' : 'bg-[#5a0a0a] border-[#ff2020] text-[#ff4040]'} disabled:opacity-30 border-3 flex items-center justify-center gap-1.5 transition-all shrink-0 relative overflow-hidden`} style={{boxShadow: currentRerollCost <= 0 ? 'inset 0 2px 0 rgba(60,200,100,0.3), inset 0 -2px 0 rgba(0,0,0,0.4), 0 3px 0 rgba(0,0,0,0.5)' : `inset 0 2px 0 rgba(255,60,60,0.25), inset 0 -2px 0 rgba(0,0,0,0.4), 0 3px 0 rgba(0,0,0,0.5), 0 0 ${Math.min(16, 6 + currentRerollCost)}px rgba(255,40,40,${Math.min(0.6, 0.2 + currentRerollCost * 0.05)})`}}>
              {currentRerollCost > 0 && <>{[...Array(Math.min(8, Math.floor(currentRerollCost / 2) + 3))].map((_, i) => (<motion.div key={i} className="absolute" style={{ width: 3, height: 3, background: `rgb(${200 + Math.floor(Math.random() * 55)}, ${20 + Math.floor(Math.random() * 30)}, ${20 + Math.floor(Math.random() * 30)})`, imageRendering: 'pixelated', left: `${10 + i * 10}%` }} initial={{ y: -8, opacity: 0 }} animate={{ y: [- 8, 16], opacity: [0, 1, 1, 0], scale: [1, 1, 0.5] }} transition={{ duration: 0.8 + i * 0.1, repeat: Infinity, delay: i * 0.12, ease: 'linear' }} />))}</>}
              {currentRerollCost <= 0 && freeRerollsRemaining > 0 && <>{[...Array(3)].map((_, i) => (<motion.div key={i} className="absolute" style={{ width: 2, height: 2, background: '#60c880', imageRendering: 'pixelated', left: `${20 + i * 25}%` }} initial={{ y: 12, opacity: 0 }} animate={{ y: -8, opacity: [0, 0.8, 0] }} transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.3, ease: 'linear' }} />))}</>}
              <PixelRefresh size={2} />
              {currentRerollCost <= 0 ? (<span className="text-[11px] font-mono font-bold flex items-center gap-0.5">{freeRerollsRemaining}<span className="text-[9px] opacity-70">×</span></span>) : (<span className="text-[10px] font-mono font-bold flex items-center gap-0.5"><span>-{currentRerollCost}</span><PixelHeart size={1.5} /></span>)}
            </motion.button>

            <AnimatePresence mode="wait">
              {game.isEnemyTurn ? (
                <motion.div key="enemy-turn" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="flex-1 py-2.5 bg-[#a02820] text-[#ffc8c0] border-3 border-[#2a0808] flex items-center justify-center font-bold text-[12px] tracking-[0.1em] battle-action-btn" style={{boxShadow: 'inset 0 2px 0 #d04838, inset 0 -2px 0 #601008, 0 4px 0 #1a0404'}}><motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1.5 }}>敌人行动中...</motion.div></motion.div>
              ) : dice.some(d => d.selected && !d.spent) ? (
                <motion.button key="play" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} onClick={isNonWarriorMultiNormal ? () => addToast('不成牌型时只能出1颗骰子', 'info') : playHand} disabled={dice.some(d => d.playing) || game.playsLeft <= 0 || isNonWarriorMultiNormal} className={`flex-1 py-2.5 ${isNonWarriorMultiNormal ? 'bg-[var(--dungeon-panel)] border-[var(--dungeon-panel-border)] text-[var(--dungeon-text-dim)]' : 'bg-[#18803a] border-[#0a3014] text-[#c8ffd0]'} disabled:opacity-50 border-3 flex items-center justify-center gap-2 font-bold text-[12px] tracking-[0.05em] battle-action-btn`} style={{boxShadow: isNonWarriorMultiNormal ? 'none' : 'inset 0 2px 0 #3ccc60, inset 0 -2px 0 #0c4418, inset 2px 0 0 #28a848, inset -2px 0 0 #105820, 0 4px 0 #042a0c', textShadow: '1px 1px 0 #042a0c'}}><PixelPlay size={2} /> {isNonWarriorMultiNormal ? '不成牌型（仅限选1颗）' : game.playsLeft > 0 ? `出牌: ${currentHands.bestHand}` : '出牌次数耗尽'}</motion.button>
              ) : (dice.every(d => d.spent) || game.playsLeft <= 0) ? (
                <motion.button key="end" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} disabled={true} className="flex-1 py-2.5 bg-[var(--dungeon-panel)] text-[var(--dungeon-text-dim)] border-3 border-[var(--dungeon-panel-border)] font-bold text-[12px] tracking-[0.05em]">回合结束中...</motion.button>
              ) : (
                <motion.button key="endTurn" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} onClick={() => endTurn()} disabled={game.isEnemyTurn || dice.some(d => d.playing)} className={`flex-1 py-2.5 ${game.playerClass === 'mage' && game.playsLeft === game.maxPlays ? 'bg-[#503080] border-[#201040] text-[#d0b0ff]' : game.playerClass === 'rogue' && (game.comboCount || 0) >= 1 && game.playsLeft > 0 ? 'bg-[#184038] border-[#0a2018] text-[#40f0e0]' : 'bg-[#907020] border-[#2a2008] text-[#fff0c0]'} disabled:opacity-50 border-3 flex items-center justify-center gap-2 font-bold text-[12px] tracking-[0.05em] battle-action-btn relative overflow-hidden`} style={{boxShadow: game.playerClass === 'mage' && game.playsLeft === game.maxPlays ? 'inset 0 2px 0 #7850b0, inset 0 -2px 0 #281060, inset 2px 0 0 #6040a0, inset -2px 0 0 #381870, 0 4px 0 #100828' : game.playerClass === 'rogue' && (game.comboCount || 0) >= 1 && game.playsLeft > 0 ? 'inset 0 2px 0 #306858, inset 0 -2px 0 #082818, inset 2px 0 0 #285848, inset -2px 0 0 #103828, 0 4px 0 #041810' : 'inset 0 2px 0 #c8a040, inset 0 -2px 0 #604008, inset 2px 0 0 #b09030, inset -2px 0 0 #705010, 0 4px 0 #1a1404', textShadow: game.playerClass === 'mage' && game.playsLeft === game.maxPlays ? '1px 1px 0 #201040, 0 0 8px rgba(160,100,255,0.6)' : game.playerClass === 'rogue' && (game.comboCount || 0) >= 1 && game.playsLeft > 0 ? '1px 1px 0 #082018, 0 0 8px rgba(64,240,224,0.5)' : '1px 1px 0 #2a2008'}}>
                  {game.playerClass === 'mage' && game.playsLeft === game.maxPlays ? (<><PixelMagic size={2} /><span>吟唱</span>{[...Array(6)].map((_, i) => (<motion.div key={i} className="absolute w-1 h-1 rounded-full bg-purple-400" initial={{ x: Math.random() * 100 - 50, y: 20, opacity: 0 }} animate={{ y: -20, opacity: [0, 1, 0], scale: [0.5, 1, 0.5] }} transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.25, ease: 'easeOut' }} />))}</>) : game.playerClass === 'rogue' && (game.comboCount || 0) >= 1 && game.playsLeft > 0 ? (<><PixelArrowUp size={2} /><span>选骰连击</span>{[...Array(6)].map((_, i) => (<motion.div key={i} className="absolute" style={{ width: 3, height: 3, background: '#40f0f0', imageRendering: 'pixelated' }} initial={{ x: Math.random() * 120 - 60, y: 16, opacity: 0 }} animate={{ y: -16, opacity: [0, 1, 0], scale: [1, 1, 0.5] }} transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15, ease: 'linear' }} />))}</>) : (<><PixelArrowRight size={2} /> 结束回合</>)}
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>
        );
      })()}
    </div>
  );
}
