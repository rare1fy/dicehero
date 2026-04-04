import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useGameContext } from '../contexts/GameContext';
import { pickRandomRelics, RELICS_BY_RARITY } from '../data/relics';
import { PixelQuestion, PixelHeart, PixelSkull, PixelStar, PixelFlame, PixelShopBag, PixelRefresh } from './PixelIcons';
import { formatDescription } from '../utils/richText';
import { playSound } from '../utils/sound';
import { EVENTS_POOL, UPGRADEABLE_HAND_TYPES, type EventConfig, type EventOptionConfig } from '../config';

/** 图标ID到组件的映射 */
const ICON_MAP: Record<string, React.ReactNode> = {
  skull: <PixelSkull size={6} />,
  star: <PixelStar size={6} />,
  flame: <PixelFlame size={6} />,
  heart: <PixelHeart size={6} />,
  shopBag: <PixelShopBag size={6} />,
  refresh: <PixelRefresh size={6} />,
  question: <PixelQuestion size={6} />,
};

export const EventScreen: React.FC = () => {
  const { game, setGame, addToast, addLog, startBattle, pickReward } = useGameContext();

  const [event, setEvent] = useState<{title: string, desc: string, icon: React.ReactNode, options: {label: string, sub: string, action: () => void, color: string, disabled?: boolean, goldCost?: number}[]}>();

  useEffect(() => {
    playSound('event');
    // 随机选择一个可升级牌型
    const randomHandType = UPGRADEABLE_HAND_TYPES[Math.floor(Math.random() * UPGRADEABLE_HAND_TYPES.length)];
    
    // 从配置池中随机选择一个事件
    const eventConfig = EVENTS_POOL[Math.floor(Math.random() * EVENTS_POOL.length)];
    
    // 将配置数据转换为运行时事件
    const resolvedEvent = resolveEvent(eventConfig, randomHandType);
    setEvent(resolvedEvent);
  }, []);

  /** 将配置表中的 action 解释为实际的游戏操作 */
  const executeAction = (action: EventOptionConfig['action'], handType: string) => {
    const resolvedLog = action.log?.replace(/{handType}/g, handType);
    const resolvedToast = action.toast?.replace(/{handType}/g, handType);

    switch (action.type) {
      case 'startBattle': {
        const currentNode = game.map.find(n => n.id === game.currentNodeId);
        if (currentNode) startBattle(currentNode);
        return;
      }
      case 'modifyHp': {
        const val = action.value || 0;
        if (resolvedToast) addToast(resolvedToast, action.toastType || (val < 0 ? 'damage' : 'heal'));
        setGame(prev => ({ ...prev, hp: Math.max(1, Math.min(prev.maxHp, prev.hp + val)), phase: 'map' }));
        if (resolvedLog) addLog(resolvedLog);
        return;
      }
      case 'modifySouls': {
        const val = action.value || 0;
        if (resolvedToast) addToast(resolvedToast, action.toastType || 'gold');
        setGame(prev => ({ ...prev, souls: Math.max(0, prev.souls + val), phase: 'map' }));
        if (resolvedLog) addLog(resolvedLog);
        return;
      }
      case 'upgradeHandType': {
        const hpCost = action.value || 0; // negative
        if (resolvedToast) addToast(resolvedToast, 'damage');
        setGame(prev => {
          const currentLevel = prev.handLevels[handType] || 1;
          return {
            ...prev,
            hp: Math.max(1, prev.hp + hpCost),
            handLevels: { ...prev.handLevels, [handType]: currentLevel + 1 },
            phase: 'map'
          };
        });
        if (resolvedLog) addLog(resolvedLog);
        return;
      }
      case 'modifyMaxHp': {
        const val = action.value || 0;
        setGame(prev => ({ ...prev, maxHp: prev.maxHp + val, hp: Math.min(prev.maxHp + val, prev.hp + (val > 0 ? val : 0)), phase: 'map' }));
        if (resolvedToast) addToast(resolvedToast, action.toastType || 'buff');
        if (resolvedLog) addLog(resolvedLog);
        return;
      }
      case 'randomOutcome': {
        if (!action.outcomes) return;
        const roll = Math.random();
        let cumWeight = 0;
        for (const outcome of action.outcomes) {
          cumWeight += outcome.weight;
          if (roll < cumWeight) {
            if (outcome.toast) addToast(outcome.toast, outcome.toastType || 'buff');
            // 执行子动作
            const hasBattle = outcome.actions.some(a => a.type === 'startBattle');
            for (const subAction of outcome.actions) {
              executeAction({ ...subAction, toast: undefined, log: undefined }, handType);
            }
            // Only return to map if no battle was started (startBattle sets phase itself)
            if (!hasBattle) {
              setGame(prev => ({ ...prev, phase: 'map' }));
            }
            if (outcome.log) addLog(outcome.log);
            return;
          }
        }
        return;
      }
      case 'grantRelic': {
        // 获得一个随机遗物
        const relicPool = [...RELICS_BY_RARITY.common, ...RELICS_BY_RARITY.uncommon, ...RELICS_BY_RARITY.rare];
        const picks = pickRandomRelics(relicPool, 1, game.relics.map(r => r.id));
        if (picks.length > 0) {
          const relic = picks[0];
          setGame(prev => ({ ...prev, relics: [...prev.relics, relic] }));
          addToast(`获得遗物「${relic.name}」!`, 'buff');
          addLog(`获得了遗物「${relic.name}」`);
        }
        setGame(prev => ({ ...prev, phase: 'map' }));
        if (resolvedLog) addLog(resolvedLog);
        return;
      }
      case 'noop': {
        setGame(prev => ({ ...prev, phase: 'map' }));
        if (resolvedLog) addLog(resolvedLog);
        return;
      }
    }
  };

  /** 将配置表事件转换为运行时事件 */
  const resolveEvent = (config: EventConfig, handType: string) => {
    const replacePlaceholder = (s: string) => s.replace(/{handType}/g, handType);
    
    /** Check if an action requires gold the player can't afford */
    const getGoldCost = (action: EventOptionConfig['action']): number => {
      // Direct modifySouls with negative value
      if (action.type === 'modifySouls' && (action.value || 0) < 0) return Math.abs(action.value || 0);
      // randomOutcome - check if ALL outcomes cost gold (guaranteed cost)
      if (action.type === 'randomOutcome' && action.outcomes) {
        const costs = action.outcomes.map(o => {
          let cost = 0;
          for (const a of o.actions) {
            if (a.type === 'modifySouls' && (a.value || 0) < 0) cost += Math.abs(a.value || 0);
          }
          return cost;
        });
        // If every outcome costs gold, the minimum cost is required
        if (costs.length > 0 && costs.every(c => c > 0)) return Math.min(...costs);
      }
      return 0;
    };

    return {
      title: config.title,
      desc: config.desc,
      icon: ICON_MAP[config.iconId] || ICON_MAP.question,
      options: config.options.map(opt => {
        const goldCost = getGoldCost(opt.action);
        return {
          label: replacePlaceholder(opt.label),
          sub: replacePlaceholder(opt.sub),
          color: opt.color,
          action: () => { playSound('select'); executeAction(opt.action, handType); },
          disabled: goldCost > 0 && game.souls < goldCost,
          goldCost,
        };
      }),
    };
  };

  if (!event) return null;

  return (
    <div className="flex flex-col items-center justify-center h-full p-5 bg-[var(--dungeon-bg)] text-[var(--dungeon-text)] relative overflow-hidden">
      <div className="absolute inset-0 pixel-grid-bg opacity-15 pointer-events-none" />
      <div className="absolute inset-0 dungeon-bg pointer-events-none" />

      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative z-10 flex flex-col items-center text-center max-w-sm"
      >
        <div className="mb-5 p-3 pixel-panel">
          {event.icon}
        </div>
        
        <h2 className="text-xl font-black mb-4 text-[var(--dungeon-text-bright)] pixel-text-shadow tracking-wide">◆ {event.title} ◆</h2>
        <p className="text-[var(--dungeon-text-dim)] mb-10 text-[10px] leading-relaxed">{event.desc}</p>
        
        <div className="flex flex-col gap-3 w-full">
          {event.options.map((opt, i) => (
            <button 
              key={i} 
              onClick={() => !opt.disabled && opt.action()} 
              disabled={opt.disabled}
              className={`group w-full p-3.5 pixel-panel transition-all flex flex-col items-center gap-1 ${opt.disabled ? 'opacity-40 grayscale cursor-not-allowed' : 'active:scale-95'}`}
              style={{ borderColor: opt.disabled ? 'var(--dungeon-panel-border)' : opt.color.includes('red') ? 'var(--pixel-red)' : opt.color.includes('amber') ? 'var(--pixel-gold)' : opt.color.includes('blue') ? 'var(--pixel-blue)' : opt.color.includes('purple') ? 'var(--pixel-purple)' : opt.color.includes('emerald') ? 'var(--pixel-green)' : opt.color.includes('cyan') ? 'var(--pixel-blue)' : opt.color.includes('orange') ? 'var(--pixel-orange)' : opt.color.includes('pink') ? 'var(--pixel-red)' : 'var(--dungeon-panel-border)' }}
            >
              <span className={`font-bold tracking-[0.1em] text-xs pixel-text-shadow ${opt.disabled ? 'text-[var(--dungeon-text-dim)]' : 'text-[var(--dungeon-text-bright)]'}`}>{opt.label}</span>
              <span className="text-[9px] text-[var(--dungeon-text-dim)] font-medium">{formatDescription(opt.sub)}</span>
              {opt.disabled && opt.goldCost > 0 && <span className="text-[8px] text-[var(--pixel-red)] font-bold mt-0.5">金币不足</span>}
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  );
};
