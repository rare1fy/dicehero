/**
 * ThemeTileScreen.tsx - Theme Tile Interaction UI
 *
 * Each floor theme has a unique interactive tile:
 * - Forge: Upgrade dice, reforge dice, or smelt for gold
 * - Bazaar: Trade HP for gold, buy mystery dice, or gamble
 * - Sanctum: Heal, bless a die, or gain max HP
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useGameContext } from '../contexts/GameContext';
import {
  PixelFlame, PixelCoin, PixelDice, PixelHeart,
  PixelStar, PixelMerchant, PixelMagic, PixelShield,
  PixelArrowUp, PixelGear, PixelQuestion,
} from './PixelIcons';
import type { LoopFloorTheme } from '../types/game';

interface ThemeOption {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  cost?: { type: 'hp' | 'gold'; amount: number };
}

interface ThemeTileDef {
  name: string;
  icon: React.ReactNode;
  color: string;
  borderColor: string;
  bgGradient: string;
  options: ThemeOption[];
}

const THEME_DEFS: Record<Exclude<LoopFloorTheme, 'boss'>, ThemeTileDef> = {
  forge: {
    name: '\u7194\u94f8\u53f0',
    icon: <PixelFlame size={4} />,
    color: '#ff6b35',
    borderColor: '#ff6b35',
    bgGradient: 'from-orange-950/40 to-red-950/40',
    options: [
      {
        id: 'forge_upgrade',
        label: '\u5f3a\u5316\u9ab0\u5b50',
        description: '\u968f\u673a\u4e00\u9897\u9ab0\u5b50\u5347\u7ea7\uff0c\u6700\u9ad8\u9762+1',
        icon: <PixelArrowUp size={2} />,
        cost: { type: 'gold', amount: 15 },
      },
      {
        id: 'forge_reforge',
        label: '\u7194\u70bc\u91cd\u94f8',
        description: '\u968f\u673a\u4e00\u9897\u9ab0\u5b50\u53d8\u4e3a\u65b0\u7684\u7a00\u6709\u9ab0\u5b50',
        icon: <PixelGear size={2} />,
        cost: { type: 'gold', amount: 20 },
      },
      {
        id: 'forge_smelt',
        label: '\u7194\u70bc\u6362\u91d1',
        description: '\u727a\u7272\u4e00\u9897\u9ab0\u5b50\uff0c\u83b7\u5f97 25 \u91d1\u5e01',
        icon: <PixelCoin size={2} />,
      },
    ],
  },
  bazaar: {
    name: '\u9ed1\u5e02\u644a\u4f4d',
    icon: <PixelMerchant size={4} />,
    color: '#4ade80',
    borderColor: '#4ade80',
    bgGradient: 'from-green-950/40 to-emerald-950/40',
    options: [
      {
        id: 'bazaar_hp_trade',
        label: 'HP \u6362\u91d1',
        description: '\u6d88\u8017 10 HP\uff0c\u83b7\u5f97 20 \u91d1\u5e01',
        icon: <PixelHeart size={2} />,
        cost: { type: 'hp', amount: 10 },
      },
      {
        id: 'bazaar_mystery',
        label: '\u795e\u79d8\u9ab0\u5b50',
        description: '\u82b1\u8d39\u91d1\u5e01\u83b7\u5f97\u4e00\u9897\u968f\u673a\u7a00\u6709\u9ab0\u5b50',
        icon: <PixelQuestion size={2} />,
        cost: { type: 'gold', amount: 25 },
      },
      {
        id: 'bazaar_gamble',
        label: '\u8d4c\u535a\u644a\u4f4d',
        description: '\u82b1 10 \u91d1\u5e01\uff0c50%\u51e0\u7387\u83b7\u5f97 30 \u91d1\u5e01',
        icon: <PixelDice size={2} />,
        cost: { type: 'gold', amount: 10 },
      },
    ],
  },
  sanctum: {
    name: '\u7948\u7977\u53f0',
    icon: <PixelMagic size={4} />,
    color: '#a78bfa',
    borderColor: '#a78bfa',
    bgGradient: 'from-purple-950/40 to-indigo-950/40',
    options: [
      {
        id: 'sanctum_heal',
        label: '\u6cbb\u6108\u7948\u7977',
        description: '\u6062\u590d 15 HP',
        icon: <PixelHeart size={2} />,
      },
      {
        id: 'sanctum_bless',
        label: '\u795d\u798f',
        description: '\u4e0b\u6b21\u6218\u6597\u9996\u56de\u5408\u83b7\u5f97 3 \u70b9\u62a4\u7532',
        icon: <PixelShield size={2} />,
      },
      {
        id: 'sanctum_vitality',
        label: '\u751f\u547d\u7948\u613f',
        description: '\u6c38\u4e45\u6700\u5927 HP +5\uff0c\u6d88\u8017 10 \u91d1\u5e01',
        icon: <PixelStar size={2} />,
        cost: { type: 'gold', amount: 10 },
      },
    ],
  },
};

export const ThemeTileScreen: React.FC = () => {
  const { game, setGame, playSound } = useGameContext();
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [resultText, setResultText] = useState<string | null>(null);
  const [phase, setPhase] = useState<'choose' | 'result'>('choose');

  const floor = game.loopFloors[game.currentFloorIndex];
  const theme = floor?.theme as Exclude<LoopFloorTheme, 'boss'>;
  const def = THEME_DEFS[theme];

  if (!def) {
    setGame((prev) => ({ ...prev, phase: 'loopMap' as const }));
    return null;
  }

  const canAfford = (option: ThemeOption): boolean => {
    if (!option.cost) return true;
    if (option.cost.type === 'hp') return game.hp > option.cost.amount;
    if (option.cost.type === 'gold') return game.souls >= option.cost.amount;
    return true;
  };

  const handleSelect = (option: ThemeOption) => {
    if (!canAfford(option)) return;
    setSelectedOption(option.id);
    playSound('select');

    let result = '';
    setGame((prev) => {
      const newState = { ...prev };

      if (option.cost) {
        if (option.cost.type === 'hp') {
          newState.hp = Math.max(1, prev.hp - option.cost.amount);
        } else if (option.cost.type === 'gold') {
          newState.souls = prev.souls - option.cost.amount;
        }
      }

      switch (option.id) {
        case 'forge_upgrade': {
          result = '\u9ab0\u5b50\u5728\u7194\u7089\u4e2d\u5347\u6e29... \u5f3a\u5316\u5b8c\u6210\uff01';
          newState.freeRerolls = (prev.freeRerolls || 0) + 1;
          newState.logs = [...prev.logs, '\u7194\u94f8\u53f0: \u9ab0\u5b50\u5f3a\u5316\uff0c+1 \u514d\u8d39\u91cd\u6295'];
          break;
        }
        case 'forge_reforge': {
          result = '\u9ab0\u5b50\u5728\u70c8\u7130\u4e2d\u91cd\u94f8... \u83b7\u5f97\u65b0\u7684\u529b\u91cf\uff01';
          newState.drawCount = (prev.drawCount || 3) + 1;
          newState.logs = [...prev.logs, '\u7194\u94f8\u53f0: \u7194\u70bc\u91cd\u94f8\uff0c\u4e0b\u573a\u6218\u6597\u591a\u62bd 1 \u9897'];
          break;
        }
        case 'forge_smelt': {
          result = '\u9ab0\u5b50\u5316\u4e3a\u91d1\u5149... \u83b7\u5f97 25 \u91d1\u5e01\uff01';
          newState.souls = (newState.souls || 0) + 25;
          newState.logs = [...prev.logs, '\u7194\u94f8\u53f0: \u7194\u70bc\u6362\u91d1\uff0c+25 \u91d1\u5e01'];
          break;
        }
        case 'bazaar_hp_trade': {
          result = '\u9c9c\u8840\u5316\u4e3a\u91d1\u5e01... \u83b7\u5f97 20 \u91d1\u5e01\uff01';
          newState.souls = (newState.souls || 0) + 20;
          newState.logs = [...prev.logs, '\u9ed1\u5e02: HP\u6362\u91d1\uff0c-10 HP +20 \u91d1\u5e01'];
          break;
        }
        case 'bazaar_mystery': {
          result = '\u795e\u79d8\u5546\u4eba\u9012\u6765\u4e00\u9897\u95ea\u95ea\u53d1\u5149\u7684\u9ab0\u5b50...';
          newState.freeRerolls = (prev.freeRerolls || 0) + 2;
          newState.logs = [...prev.logs, '\u9ed1\u5e02: \u795e\u79d8\u9ab0\u5b50\uff0c+2 \u514d\u8d39\u91cd\u6295'];
          break;
        }
        case 'bazaar_gamble': {
          if (Math.random() > 0.5) {
            result = '\ud83c\udfb2 \u8d62\u4e86\uff01\u83b7\u5f97 30 \u91d1\u5e01\uff01';
            newState.souls = (newState.souls || 0) + 30;
            newState.logs = [...prev.logs, '\u9ed1\u5e02\u8d4c\u535a: \u8d62\u4e86\uff01+30 \u91d1\u5e01'];
          } else {
            result = '\ud83c\udfb2 \u8f93\u4e86... \u91d1\u5e01\u6253\u4e86\u6c34\u6f02\u3002';
            newState.logs = [...prev.logs, '\u9ed1\u5e02\u8d4c\u535a: \u8f93\u4e86\uff0c-10 \u91d1\u5e01'];
          }
          break;
        }
        case 'sanctum_heal': {
          const healAmount = 15;
          const actualHeal = Math.min(healAmount, prev.maxHp - prev.hp);
          result = '\u5723\u5149\u7b3c\u7f69... \u6062\u590d ' + actualHeal + ' HP\uff01';
          newState.hp = Math.min(prev.hp + healAmount, prev.maxHp);
          newState.logs = [...prev.logs, '\u7948\u7977\u53f0: \u6cbb\u6108\u7948\u7977\uff0c+' + actualHeal + ' HP'];
          break;
        }
        case 'sanctum_bless': {
          result = '\u795e\u5723\u4e4b\u5149\u6ce8\u5165\u4f60\u7684\u62a4\u7532...';
          newState.armor = (prev.armor || 0) + 3;
          newState.logs = [...prev.logs, '\u7948\u7977\u53f0: \u795d\u798f\uff0c+3 \u62a4\u7532'];
          break;
        }
        case 'sanctum_vitality': {
          result = '\u751f\u547d\u529b\u6d8c\u5165\u4f60\u7684\u8eab\u4f53... \u6700\u5927 HP +5\uff01';
          newState.maxHp = prev.maxHp + 5;
          newState.hp = prev.hp + 5;
          newState.logs = [...prev.logs, '\u7948\u7977\u53f0: \u751f\u547d\u7948\u613f\uff0c\u6700\u5927 HP +5'];
          break;
        }
        default:
          result = '\u4ec0\u4e48\u4e5f\u6ca1\u53d1\u751f...';
      }

      return newState;
    });

    setResultText(result);
    setTimeout(() => setPhase('result'), 300);
  };

  const handleContinue = () => {
    playSound('select');
    setGame((prev) => ({ ...prev, phase: 'loopMap' as const }));
  };

  const handleSkip = () => {
    playSound('select');
    setGame((prev) => ({
      ...prev,
      phase: 'loopMap' as const,
      logs: [...prev.logs, def.name + ': \u8df3\u8fc7'],
    }));
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 relative">
      <div className={`absolute inset-0 bg-gradient-to-b ${def.bgGradient} pointer-events-none`} />

      <AnimatePresence mode="wait">
        {phase === 'choose' && (
          <motion.div
            key="choose"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="relative z-10 w-full max-w-sm flex flex-col items-center gap-4"
          >
            <div className="text-center">
              <div className="mb-2" style={{ color: def.color }}>{def.icon}</div>
              <h2 className="text-xl font-bold pixel-text" style={{ color: def.color }}>
                {'\u25c6'} {def.name} {'\u25c6'}
              </h2>
              <p className="text-xs text-gray-400 mt-1">{'\u9009\u62e9\u4e00\u4e2a\u64cd\u4f5c'}</p>
            </div>

            <div className="w-full flex flex-col gap-3">
              {def.options.map((option) => {
                const affordable = canAfford(option);
                return (
                  <motion.button
                    key={option.id}
                    whileHover={affordable ? { scale: 1.02 } : undefined}
                    whileTap={affordable ? { scale: 0.98 } : undefined}
                    onClick={() => affordable && handleSelect(option)}
                    className={`w-full p-3 rounded border text-left transition-all ${
                      affordable
                        ? 'border-gray-600 hover:border-current bg-gray-900/60 cursor-pointer'
                        : 'border-gray-700/50 bg-gray-900/30 opacity-40 cursor-not-allowed'
                    }`}
                    style={affordable ? { borderColor: def.borderColor + '40' } : undefined}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span style={{ color: def.color }}>{option.icon}</span>
                      <span className="text-sm font-bold text-gray-200">{option.label}</span>
                      {option.cost && (
                        <span className={`text-xs ml-auto ${affordable ? 'text-yellow-400' : 'text-red-400'}`}>
                          {option.cost.type === 'hp' ? '\u2764\ufe0f' : '\ud83e\ude99'} {option.cost.amount}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400">{option.description}</p>
                  </motion.button>
                );
              })}
            </div>

            <button
              onClick={handleSkip}
              className="text-xs text-gray-500 hover:text-gray-300 mt-2 transition-colors"
            >
              {'\u8df3\u8fc7'}
            </button>
          </motion.div>
        )}

        {phase === 'result' && (
          <motion.div
            key="result"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="relative z-10 w-full max-w-sm flex flex-col items-center gap-4 text-center"
          >
            <div style={{ color: def.color }}>{def.icon}</div>
            <h2 className="text-lg font-bold pixel-text" style={{ color: def.color }}>{def.name}</h2>
            <p className="text-sm text-gray-200 leading-relaxed px-4">{resultText}</p>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleContinue}
              className="mt-4 px-6 py-2 rounded border text-sm font-bold transition-colors"
              style={{ borderColor: def.borderColor, color: def.color }}
            >
              {'\u7ee7\u7eed'}
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-6 text-xs text-gray-400">
        <span className="flex items-center gap-1">
          <PixelHeart size={1.5} /> {game.hp}
        </span>
        <span className="flex items-center gap-1">
          <PixelCoin size={1.5} /> {game.souls}
        </span>
      </div>
    </div>
  );
};