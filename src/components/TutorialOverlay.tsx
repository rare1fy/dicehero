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
    title: '◆ 欢迎来到六面决界 ◆',
    content: '在这片被永夜笼罩的大陆上，你将用骰子组合牌型，击败沿途的敌人，穿越5个大关，拯救世界。',
    icon: <PixelStar size={4} />,
    position: 'center',
  },
  {
    id: 'map',
    title: '◆ 地图探索 ◆',
    content: '每个大关有一张随机生成的地图。节点类型包括：\n⚔ 战斗 — 击败敌人获取金币\n💀 精英 — 强敌，奖励丰厚\n👑 Boss — 关卡守关者\n🏪 商店/商人 — 购买遗物和骰子\n🔥 篝火 — 回复生命或升级牌型\n❓ 事件 — 随机遭遇\n📦 宝箱 — 免费获取奖励',
    icon: <PixelBook size={4} />,
    position: 'center',
  },
  {
    id: 'dice',
    title: '◆ 骰子与元素 ◆',
    content: '战斗时自动从骰子库抽取手牌。骰子分多种类型：\n• 普通骰子 — 标准1-6\n• 灌铅骰子 — 只出4/5/6\n• 元素骰子 — 随机附带火/冰/雷/毒/圣元素\n• 锋刃/倍增/分裂等 — 各有特殊效果\n击败Boss和战斗后可获取新骰子扩充骰子库。',
    icon: <PixelDice size={4} />,
    position: 'center',
  },
  {
    id: 'hands',
    title: '◆ 牌型系统 ◆',
    content: '选中骰子组合成牌型，牌型决定基础伤害和倍率：\n• 普通攻击 — 任意骰子\n• 对子 — 两颗相同点数\n• 三条/四条/五条 — 更多相同点数\n• 顺子 — 连续点数\n• 葫芦 — 三条+对子\n• 同元素 — 所有骰子同一元素（伤害翻倍）\n牌型等级可在篝火升级，提升基础伤害。',
    icon: <PixelPair size={4} />,
    position: 'center',
  },
  {
    id: 'play',
    title: '◆ 出牌与重Roll ◆',
    content: '选中想要打出的骰子 → 点击「出牌」攻击敌人。\n每回合有固定出牌次数，用完后轮到敌人行动。\n\n想换骰子？选中不要的骰子 → 点「重Roll」重新投掷。\n首次重Roll免费，之后消耗HP（代价逐渐递增）。',
    icon: <PixelPlay size={4} />,
    position: 'center',
  },
  {
    id: 'relics',
    title: '◆ 遗物系统 ◆',
    content: '遗物是你的被动能力，打出特定牌型时自动触发。\n击败精英和Boss后可获得遗物，商店也能购买。\n\n战斗中，伤害预览卡片下方会显示当前牌型激活了哪些遗物。点击遗物图标可查看详细说明。\n\n点「遗物库」按钮可查看你的全部遗物。',
    icon: <PixelZap size={4} />,
    position: 'center',
  },
  {
    id: 'combat',
    title: '◆ 战斗要点 ◆',
    content: '• 注意敌人头顶的意图图标（攻击/防御/施法）\n• 护甲在敌人攻击前抵挡伤害，每回合刷新\n• 元素效果：火破甲、冰冻结、雷AOE、毒持续、圣回血\n• Boss战分多波，每波击败后自动进入下一波\n• 击败Boss获得额外手牌上限+1',
    icon: <PixelSword size={4} />,
    position: 'center',
  },
  {
    id: 'economy',
    title: '◆ 经济与构筑 ◆',
    content: '• 金币 — 在商店购买遗物和骰子\n• 魂晶商店（开始界面）— 永久解锁常驻遗物\n• 骰子构筑 — 每场战斗后可选取新骰子\n• 同种骰子重复获取可升级（最高Lv.3）\n• 合理搭配骰子+遗物，打造你的专属流派！',
    icon: <PixelCoin size={4} />,
    position: 'center',
  },
  {
    id: 'ready',
    title: '◆ 准备出发 ◆',
    content: '穿越幽暗森林、冰封山脉、熔岩深渊、暗影要塞，直到永恒之巅。\n\n每一关都有独特的敌人和Boss等待着你。\n骰运亨通，勇士！',
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
