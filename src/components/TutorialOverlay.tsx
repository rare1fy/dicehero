import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  PixelStar, PixelBook, PixelDice, PixelPair, PixelPlay, 
  PixelRefresh, PixelZap, PixelCoin, PixelSword, PixelFlame, PixelClose
} from './PixelIcons';

interface TutorialStep {
  id: string;
  title: string;
  content: string;
  icon: React.ReactNode;
  highlight?: string;
  position?: 'top' | 'center' | 'bottom';
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'welcome',
    title: '◆ 欢迎来到 DICE BATTLE ◆',
    content: '在这个永夜笼罩的世界中，你将通过投掷骰子、组合牌型来战胜敌人。让我来教你基本操作。',
    icon: <PixelStar size={4} />,
    position: 'center',
  },
  {
    id: 'map',
    title: '◆ 探索地图 ◆',
    content: '地图上有不同类型的节点：战斗、精英怪、Boss、商店、篝火、随机事件。选择路线前进，逐步深入永夜。',
    icon: <PixelBook size={4} />,
    position: 'center',
  },
  {
    id: 'dice',
    title: '◆ 投掷骰子 ◆',
    content: '战斗开始时自动投掷骰子。每颗骰子有 1-6 点数和 4 种颜色：红色、蓝色、紫色、金色。',
    icon: <PixelDice size={4} />,
    position: 'bottom',
  },
  {
    id: 'hands',
    title: '◆ 组合牌型 ◆',
    content: '点击骰子选择，组成不同牌型。牌型越稀有伤害越高！如：对子、顺子、同元素等。',
    icon: <PixelPair size={4} />,
    position: 'bottom',
  },
  {
    id: 'play',
    title: '◆ 出牌攻击 ◆',
    content: '选好骰子后，点击「出牌」按钮发动攻击。每回合有固定出牌次数，用完后敌人行动。',
    icon: <PixelPlay size={4} />,
    position: 'bottom',
  },
  {
    id: 'reroll',
    title: '◆ 重骰机会 ◆',
    content: '不满意骰子？可以重骰未选中的骰子。每回合有免费重骰次数，用完消耗全局重骰。',
    icon: <PixelRefresh size={4} />,
    position: 'bottom',
  },
  {
    id: 'augments',
    title: '◆ 增幅模块 ◆',
    content: '底部的增幅模块在你打出对应牌型时自动激活，提供额外伤害、护甲、回血等效果。',
    icon: <PixelZap size={4} />,
    position: 'bottom',
  },
  {
    id: 'resources',
    title: '◆ 资源管理 ◆',
    content: '金币 — 在商店购买道具\n重骰 — 重新投掷骰子\n生命 — 降到 0 即 Game Over\n护甲 — 抵挡即将到来的伤害',
    icon: <PixelCoin size={4} />,
    position: 'center',
  },
  {
    id: 'tips',
    title: '◆ 战斗技巧 ◆',
    content: '• 注意敌人意图提前应对\n• 合理分配重骰和出牌次数\n• 篝火可回复生命或升级\n• 增幅搭配是制胜关键',
    icon: <PixelSword size={4} />,
    position: 'center',
  },
  {
    id: 'ready',
    title: '◆ 准备就绪 ◆',
    content: '现在你已了解基本玩法。祝你在永夜中骰运亨通！',
    icon: <PixelFlame size={4} />,
    position: 'center',
  },
];

const TUTORIAL_STORAGE_KEY = 'dicebattle_tutorial_completed';

interface TutorialOverlayProps {
  onComplete: () => void;
}

export const TutorialOverlay: React.FC<TutorialOverlayProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const step = TUTORIAL_STEPS[currentStep];
  const progress = ((currentStep + 1) / TUTORIAL_STEPS.length) * 100;

  const handleNext = () => {
    if (currentStep < TUTORIAL_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      localStorage.setItem(TUTORIAL_STORAGE_KEY, 'true');
      onComplete();
    }
  };

  const handleSkip = () => {
    localStorage.setItem(TUTORIAL_STORAGE_KEY, 'true');
    onComplete();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] bg-black/90 flex items-center justify-center p-4"
    >
      {/* 像素进度条 */}
      <div className="absolute top-0 left-0 right-0 h-2 bg-[var(--dungeon-bg)] border-b-2 border-[var(--dungeon-panel-border)]">
        <motion.div
          className="h-full"
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.2 }}
          style={{
            background: `repeating-linear-gradient(90deg, var(--pixel-green) 0px, var(--pixel-green) 4px, var(--pixel-green-dark) 4px, var(--pixel-green-dark) 8px)`,
          }}
        />
      </div>

      {/* 跳过按钮 */}
      <button
        onClick={handleSkip}
        className="absolute top-4 right-4 text-[var(--dungeon-text-dim)] hover:text-[var(--pixel-red)] text-[10px] flex items-center gap-1 transition-colors z-10"
      >
        跳过 <PixelClose size={2} />
      </button>

      {/* 步骤计数 */}
      <div className="absolute top-4 left-4 text-[var(--dungeon-text-dim)] text-[10px] font-mono">
        [{currentStep + 1}/{TUTORIAL_STEPS.length}]
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-sm"
        >
          {/* 图标 — 像素面板 */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
            className="w-16 h-16 mx-auto mb-5 pixel-panel flex items-center justify-center"
          >
            {step.icon}
          </motion.div>

          {/* 标题 */}
          <motion.h2
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="text-sm text-[var(--pixel-gold)] text-center mb-4 pixel-text-shadow"
          >
            {step.title}
          </motion.h2>

          {/* 内容面板 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="pixel-panel p-4 mb-6"
          >
            <p className="text-[var(--dungeon-text)] text-[11px] leading-relaxed whitespace-pre-line">
              {step.content}
            </p>
          </motion.div>

          {/* 导航按钮 */}
          <div className="flex gap-3">
            {currentStep > 0 && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={() => setCurrentStep(prev => prev - 1)}
                className="flex-1 py-2.5 pixel-btn pixel-btn-ghost text-[11px]"
              >
                ◀ 上一步
              </motion.button>
            )}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleNext}
              className="flex-1 py-2.5 pixel-btn pixel-btn-primary text-[11px] flex items-center justify-center gap-2"
            >
              {currentStep === TUTORIAL_STEPS.length - 1 ? '开始游戏！' : '下一步 ▶'}
            </motion.button>
          </div>

          {/* 像素步骤点 */}
          <div className="flex justify-center gap-1.5 mt-5">
            {TUTORIAL_STEPS.map((_, i) => (
              <div
                key={i}
                className={`transition-all duration-100 ${
                  i === currentStep 
                    ? 'w-4 h-2 bg-[var(--pixel-green)]' 
                    : i < currentStep 
                      ? 'w-2 h-2 bg-[var(--pixel-green-dark)]' 
                      : 'w-2 h-2 bg-[var(--dungeon-panel-border)]'
                }`}
                style={{ borderRadius: '1px' }}
              />
            ))}
          </div>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
};

export const isTutorialCompleted = (): boolean => {
  try {
    return localStorage.getItem(TUTORIAL_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
};

export const resetTutorial = (): void => {
  try {
    localStorage.removeItem(TUTORIAL_STORAGE_KEY);
  } catch {
    // ignore
  }
};
