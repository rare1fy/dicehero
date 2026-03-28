import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useGameContext } from '../contexts/GameContext';
import type { Augment } from '../types';
import { AUGMENTS_POOL } from '../data/augments';
import { HAND_TYPES } from '../data/handTypes';
import { playSound } from '../utils/sound';
import { CSSParticles } from './ParticleEffects';
import { PixelQuestion, PixelHeart, PixelCoin, PixelSword, PixelSkull, PixelStar, PixelShield, PixelZap, PixelDice, PixelFlame, PixelMagic, PixelCrown, PixelArrowUp, PixelArrowDown, PixelPoison, PixelInfo, PixelShopBag, PixelRefresh } from './PixelIcons';
import { formatDescription } from '../utils/richText';
import { getAugmentIcon } from '../utils/helpers';

export const EventScreen: React.FC = () => {
  const { game, setGame, addToast, addLog, startBattle } = useGameContext();

  const [event, setEvent] = useState<{title: string, desc: string, icon: React.ReactNode, options: {label: string, sub: string, action: () => void, color: string}[]}>();

  useEffect(() => {
    const handTypesToUpgrade = ['对子', '连对', '顺子', '同花', '葫芦'];
    const randomHandType = handTypesToUpgrade[Math.floor(Math.random() * handTypesToUpgrade.length)];

    const events = [
      {
        title: '阴影中的怪物',
        desc: '你在一处阴影中发现了一只落单的怪物，它似乎正在守护着一个散发着微光的宝箱。',
        icon: <PixelSkull size={6} />,
        options: [
          { 
            label: '发起战斗', 
            sub: '击败它以获取宝箱中的战利品',
            color: 'bg-red-600 hover:bg-red-500',
            action: () => {
              const currentNode = game.map.find(n => n.id === game.currentNodeId);
              if (currentNode) startBattle(currentNode);
            }
          },
          { 
            label: '悄悄绕过', 
            sub: '避免战斗，但可能会在穿过荆棘时受伤 (-5 HP)',
            color: 'bg-zinc-700 hover:bg-zinc-600',
            action: () => {
              addToast('穿过荆棘受伤 -5 HP', 'damage');
              setGame(prev => ({ ...prev, hp: Math.max(1, prev.hp - 5), phase: 'map' }));
              addLog('悄悄绕过了怪物，但受到了 5 点伤害。');
            }
          }
        ]
      },
      {
        title: '古老祭坛',
        desc: '你发现了一个被遗忘的祭坛，上面刻着两种不同的符文。你可以选择其中一种力量。',
        icon: <PixelStar size={6} />,
        options: [
          { 
            label: '贪婪符文', 
            sub: '立即获得 40 枚金币',
            color: 'bg-amber-600 hover:bg-amber-500',
            action: () => {
              setGame(prev => ({ ...prev, souls: prev.souls + 40, phase: 'map' }));
              addLog('在祭坛获得了 40 金币。');
            }
          },
          { 
            label: '力量符文', 
            sub: '永久增加 1 颗初始骰子',
            color: 'bg-blue-600 hover:bg-blue-500',
            action: () => {
              setGame(prev => ({ ...prev, diceCount: Math.min(6, prev.diceCount + 1), phase: 'map' }));
              addLog('在祭坛获得了 1 颗骰子。');
            }
          }
        ]
      },
      {
        title: '虚空交易',
        desc: '一个虚幻的身影出现在你面前，向你展示了禁忌的知识。但代价是你的生命力。',
        icon: <PixelSkull size={6} />,
        options: [
          { 
            label: `强化【${randomHandType}】`, 
            sub: `提升该牌型的基础威力 (-15 HP)`,
            color: 'bg-purple-600 hover:bg-purple-500',
            action: () => {
              addToast(`禁忌知识的代价 -15 HP`, 'damage');
              setGame(prev => {
                const currentLevel = prev.handLevels[randomHandType] || 1;
                return {
                  ...prev,
                  hp: Math.max(1, prev.hp - 15),
                  handLevels: { ...prev.handLevels, [randomHandType]: currentLevel + 1 },
                  phase: 'map'
                };
              });
              addLog(`消耗 15 生命，【${randomHandType}】升级了！`);
            }
          },
          { 
            label: '洞察未来', 
            sub: '获得 3 次全局重骰机会',
            color: 'bg-zinc-700 hover:bg-zinc-600',
            action: () => {
              addToast('+3 全局重骰', 'buff');
              setGame(prev => ({ ...prev, globalRerolls: prev.globalRerolls + 3, phase: 'map' }));
              addLog('获得了 3 次全局重骰机会。');
            }
          }
        ]
      },
      {
        title: '致命陷阱',
        desc: '你触发了一个隐藏的机关！无数箭矢从墙壁中射出。',
        icon: <PixelFlame size={6} />,
        options: [
          { 
            label: '全力躲避', 
            sub: '虽然避开了要害，但仍受了重伤 (-20 HP)',
            color: 'bg-orange-600 hover:bg-orange-500',
            action: () => {
              addToast('陷阱触发！-20 HP', 'damage');
              setGame(prev => ({ ...prev, hp: Math.max(1, prev.hp - 20), phase: 'map' }));
              addLog('踩中陷阱，扣除 20 生命。');
            }
          },
          { 
            label: '舍财保命', 
            sub: '丢弃一些金币来触发备用机关 (-30 金币)',
            color: 'bg-zinc-700 hover:bg-zinc-600',
            action: () => {
              setGame(prev => ({ ...prev, souls: Math.max(0, prev.souls - 30), phase: 'map' }));
              addLog('丢弃了 30 金币以避开陷阱。');
            }
          }
        ]
      },
      // === 新增事件 ===
      {
        title: '神秘旅商',
        desc: '一位戴着面具的旅商从暗处走来，他的背包里似乎有些不寻常的东西。',
        icon: <PixelShopBag size={6} />,
        options: [
          { 
            label: '购买生命药剂', 
            sub: '花费 25 金币回复 30 HP',
            color: 'bg-emerald-600 hover:bg-emerald-500',
            action: () => {
              if (game.souls >= 25) {
                setGame(prev => ({ ...prev, souls: prev.souls - 25, hp: Math.min(prev.maxHp, prev.hp + 30), phase: 'map' }));
                addLog('购买了生命药剂，回复 30 HP。');
              } else {
                setGame(prev => ({ ...prev, phase: 'map' }));
                addLog('金币不足，旅商失望地离开了。');
              }
            }
          },
          { 
            label: '购买强化药水', 
            sub: '花费 35 金币，永久提升最大生命 10 点',
            color: 'bg-blue-600 hover:bg-blue-500',
            action: () => {
              if (game.souls >= 35) {
                setGame(prev => ({ ...prev, souls: prev.souls - 35, maxHp: prev.maxHp + 10, hp: prev.hp + 10, phase: 'map' }));
                addLog('购买了强化药水，最大生命 +10！');
              } else {
                setGame(prev => ({ ...prev, phase: 'map' }));
                addLog('金币不足，旅商失望地离开了。');
              }
            }
          }
        ]
      },
      {
        title: '命运之轮',
        desc: '你发现了一个古老的命运之轮，轮盘上刻满了神秘的符号。你可以转动它，但结果难以预料。',
        icon: <PixelRefresh size={6} />,
        options: [
          { 
            label: '转动命运之轮', 
            sub: '随机获得：+50 金币 / +2 重骰 / -15 HP',
            color: 'bg-cyan-600 hover:bg-cyan-500',
            action: () => {
              const roll = Math.random();
              if (roll < 0.4) {
                addToast('🎰 幸运！+50 金币', 'gold');
                setGame(prev => ({ ...prev, souls: prev.souls + 50, phase: 'map' }));
                addLog('🎰 命运之轮转出了 50 金币！');
              } else if (roll < 0.7) {
                addToast('🎰 幸运！+2 全局重骰', 'buff');
                setGame(prev => ({ ...prev, globalRerolls: prev.globalRerolls + 2, phase: 'map' }));
                addLog('🎰 命运之轮赐予了 2 次全局重骰！');
              } else {
                addToast('🎰 厄运降临！-15 HP', 'damage');
                setGame(prev => ({ ...prev, hp: Math.max(1, prev.hp - 15), phase: 'map' }));
                addLog('🎰 命运之轮带来了厄运，损失 15 HP！');
              }
            }
          },
          { 
            label: '谨慎离开', 
            sub: '不冒险，安全通过',
            color: 'bg-zinc-700 hover:bg-zinc-600',
            action: () => {
              setGame(prev => ({ ...prev, phase: 'map' }));
              addLog('你明智地选择了离开命运之轮。');
            }
          }
        ]
      },
      {
        title: '暗影锻炉',
        desc: '一座被遗弃的锻炉仍在燃烧着幽蓝色的火焰。你可以利用它来强化自己的能力。',
        icon: <PixelFlame size={6} />,
        options: [
          { 
            label: '锻造护甲', 
            sub: '消耗 20 HP，本场游戏每回合额外获得 1 次免费重骰',
            color: 'bg-blue-600 hover:bg-blue-500',
            action: () => {
              addToast('暗影锻炉灼伤 -20 HP，每回合免费重骰 +1', 'damage');
              setGame(prev => ({ ...prev, hp: Math.max(1, prev.hp - 20), freeRerollsPerTurn: prev.freeRerollsPerTurn + 1, phase: 'map' }));
              addLog('在暗影锻炉中锻造了护甲，每回合免费重骰 +1！');
            }
          },
          { 
            label: '淬炼武器', 
            sub: '消耗 20 HP，永久增加 1 次出牌机会',
            color: 'bg-orange-600 hover:bg-orange-500',
            action: () => {
              addToast('暗影锻炉灼伤 -20 HP，出牌次数 +1', 'damage');
              setGame(prev => ({ ...prev, hp: Math.max(1, prev.hp - 20), maxPlays: prev.maxPlays + 1, phase: 'map' }));
              addLog('在暗影锻炉中淬炼了武器，出牌次数 +1！');
            }
          }
        ]
      },
      {
        title: '迷途灵魂',
        desc: '一个迷途的灵魂向你求助，它愿意用自己的力量作为报答。但你也可以选择吞噬它。',
        icon: <PixelHeart size={6} />,
        options: [
          { 
            label: '帮助灵魂', 
            sub: '回复 20 HP，获得 20 金币',
            color: 'bg-pink-600 hover:bg-pink-500',
            action: () => {
              setGame(prev => ({ ...prev, hp: Math.min(prev.maxHp, prev.hp + 20), souls: prev.souls + 20, phase: 'map' }));
              addLog('帮助了迷途灵魂，获得了它的祝福。');
            }
          },
          { 
            label: '吞噬灵魂', 
            sub: `强化【${randomHandType}】但损失 10 HP`,
            color: 'bg-red-600 hover:bg-red-500',
            action: () => {
              addToast(`吞噬灵魂 -10 HP，【${randomHandType}】升级！`, 'damage');
              setGame(prev => {
                const currentLevel = prev.handLevels[randomHandType] || 1;
                return {
                  ...prev,
                  hp: Math.max(1, prev.hp - 10),
                  handLevels: { ...prev.handLevels, [randomHandType]: currentLevel + 1 },
                  phase: 'map'
                };
              });
              addLog(`吞噬了灵魂，【${randomHandType}】升级了！`);
            }
          }
        ]
      }
    ];
    setEvent(events[Math.floor(Math.random() * events.length)]);
  }, []);

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
              onClick={opt.action} 
              className="group w-full p-3.5 pixel-panel transition-all flex flex-col items-center gap-1 active:scale-95"
              style={{ borderColor: opt.color.includes('red') ? 'var(--pixel-red)' : opt.color.includes('amber') ? 'var(--pixel-gold)' : opt.color.includes('blue') ? 'var(--pixel-blue)' : opt.color.includes('purple') ? 'var(--pixel-purple)' : opt.color.includes('emerald') ? 'var(--pixel-green)' : opt.color.includes('cyan') ? 'var(--pixel-blue)' : opt.color.includes('orange') ? 'var(--pixel-orange)' : opt.color.includes('pink') ? 'var(--pixel-red)' : 'var(--dungeon-panel-border)' }}
            >
              <span className="font-bold tracking-[0.1em] text-xs text-[var(--dungeon-text-bright)] pixel-text-shadow">{opt.label}</span>
              <span className="text-[9px] text-[var(--dungeon-text-dim)] font-medium">{formatDescription(opt.sub)}</span>
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  );
};
