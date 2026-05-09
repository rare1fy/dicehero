/**
 * GmDebugPanel.tsx — GM 调试工具子面板
 * ARCH-H: 从 SettingsPanel.tsx 拆分出的独立子组件
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useGameContext } from '../contexts/GameContext';
import { ALL_RELICS } from '../data/relics';
import type { GameState, MapNode } from '../types/game';
import { ALL_DICE } from '../data/dice';
import { NORMAL_ENEMIES, ELITE_ENEMIES, BOSS_ENEMIES } from '../config';
import type { EnemyConfig } from '../config';
import { buildEnemy } from '../data/enemies';

const RARITY_COLORS: Record<string, string> = {
  common: 'var(--dungeon-text-dim)',
  uncommon: 'var(--pixel-green)',
  rare: 'var(--pixel-blue)',
  legendary: 'var(--pixel-gold)',
  curse: 'var(--pixel-red)',
};

const RARITY_LABELS: Record<string, string> = {
  common: '普通', uncommon: '稀有', rare: '史诗', legendary: '传说', curse: '诅咒',
};

interface GmDebugPanelProps {
  onClose: () => void;
}

/** GM 子面板状态类型（提取为 type alias，新增 training 不需到处改签名） */
type GmSubPanel = 'none' | 'addRelic' | 'removeRelic' | 'addDice' | 'removeDice' | 'training';

export const GmDebugPanel: React.FC<GmDebugPanelProps> = ({ onClose }) => {
  const { game, setGame, addToast } = useGameContext();
  const [gmSubPanel, setGmSubPanel] = useState<GmSubPanel>('none');
  const [gmFilter, setGmFilter] = useState('');

  return (
    <div className="space-y-2 p-2 bg-[var(--dungeon-bg)] border border-[var(--pixel-red-dark)]" style={{ borderRadius: '4px' }}>
      <div className="text-[8px] text-[var(--pixel-red)] text-center font-bold mb-1">— 调试功能 —</div>

      {/* 快捷操作 */}
      <GmQuickActions game={game} setGame={setGame} addToast={addToast} />

      {/* 传送层 */}
      <GmTeleport game={game} setGame={setGame} addToast={addToast} onClose={onClose} />

      {/* 战斗/出牌/重掷 */}
      <GmBattleActions game={game} setGame={setGame} addToast={addToast} onClose={onClose} />

      {/* 训练场 (GM 单独抓任意敌人来打) */}
      <GmTrainingGround
        gmSubPanel={gmSubPanel}
        setGmSubPanel={setGmSubPanel}
        gmFilter={gmFilter}
        setGmFilter={setGmFilter}
        onClose={onClose}
      />

      {/* 遗物管理 */}
      <GmRelicManager
        game={game}
        setGame={setGame}
        addToast={addToast}
        gmSubPanel={gmSubPanel}
        setGmSubPanel={setGmSubPanel}
        gmFilter={gmFilter}
        setGmFilter={setGmFilter}
      />

      {/* 骰子管理 */}
      <GmDiceManager
        game={game}
        setGame={setGame}
        addToast={addToast}
        gmSubPanel={gmSubPanel}
        setGmSubPanel={setGmSubPanel}
      />
    </div>
  );
};

/* ── 快捷操作行 ── */
const GmQuickActions: React.FC<{
  game: ReturnType<typeof useGameContext>['game'];
  setGame: ReturnType<typeof useGameContext>['setGame'];
  addToast: ReturnType<typeof useGameContext>['addToast'];
}> = ({ game, setGame, addToast }) => (
  <div className="grid grid-cols-2 gap-1.5">
    <GmBtn
      onClick={() => { setGame(p => ({ ...p, hp: p.maxHp })); addToast('GM: 满血'); }}
      className="bg-[var(--pixel-green-dark)] text-[var(--pixel-green-light)] border-[var(--pixel-green)]"
    >❤ 满血</GmBtn>
    <GmBtn
      onClick={() => { setGame(p => ({ ...p, souls: p.souls + 500 })); addToast('GM: +500金'); }}
      className="bg-[var(--pixel-gold-dark)] text-[var(--pixel-gold-light)] border-[var(--pixel-gold)]"
    >💰 +500金</GmBtn>
    <GmBtn
      onClick={() => { setGame(p => ({ ...p, blackMarketQuota: (p.blackMarketQuota || 0) + 100 })); addToast('GM: +100魂晶'); }}
      className="bg-[var(--pixel-purple-dark)] text-[var(--pixel-purple-light)] border-[var(--pixel-purple)]"
    >💎 +100魂晶</GmBtn>
    <GmBtn
      onClick={() => { setGame(p => ({ ...p, maxHp: p.maxHp + 50, hp: p.hp + 50 })); addToast('GM: +50最大HP'); }}
      className="bg-[var(--pixel-red-dark)] text-[var(--pixel-red-light)] border-[var(--pixel-red)]"
    >♥ +50血上限</GmBtn>
  </div>
);

/* ── 传送层 ── */
const GmTeleport: React.FC<{
  game: ReturnType<typeof useGameContext>['game'];
  setGame: ReturnType<typeof useGameContext>['setGame'];
  addToast: ReturnType<typeof useGameContext>['addToast'];
  onClose: () => void;
}> = ({ game, setGame, addToast, onClose }) => (
  <>
    <div className="text-[8px] text-[var(--dungeon-text-dim)] text-center mt-1">传送到指定层</div>
    <div className="grid grid-cols-2 gap-1">
      {[
        { label: '中Boss(7)', depth: 7 },
        { label: '终Boss(14)', depth: 14 },
      ].map(tp => (
        <GmBtn
          key={tp.depth}
          onClick={() => {
            const prevDepth = tp.depth - 1;
            const prevNode = game.map.find(n => n.depth === prevDepth);
            if (prevNode) {
              setGame(p => ({
                ...p,
                map: p.map.map(n => n.depth <= prevDepth ? { ...n, completed: true } : n),
                currentNodeId: prevNode.id,
                phase: 'map',
              }));
              addToast(`GM: 传送到 ${tp.label}`);
            } else {
              addToast('GM: 找不到目标节点');
            }
            onClose();
          }}
          className="bg-[var(--dungeon-panel)] text-[var(--pixel-orange-light)] border-[var(--pixel-orange)]"
        >{tp.label}</GmBtn>
      ))}
    </div>
  </>
);

/* ── 战斗/出牌/重掷操作 ── */
const GmBattleActions: React.FC<{
  game: ReturnType<typeof useGameContext>['game'];
  setGame: ReturnType<typeof useGameContext>['setGame'];
  addToast: ReturnType<typeof useGameContext>['addToast'];
  onClose: () => void;
}> = ({ game, setGame, addToast, onClose }) => (
  <>
    <div className="grid grid-cols-2 gap-1.5 mt-1">
      <GmBtn
        onClick={() => { setGame(p => ({ ...p, playsLeft: 99, maxPlays: 99 })); addToast('GM: 99次出牌'); }}
        className="bg-[var(--dungeon-panel)] text-[var(--pixel-cyan-light)] border-[var(--pixel-cyan)]"
      >🎲 99出牌</GmBtn>
      <GmBtn
        onClick={() => { setGame(p => ({ ...p, freeRerollsLeft: 99, freeRerollsPerTurn: 99 })); addToast('GM: 99重掷'); }}
        className="bg-[var(--dungeon-panel)] text-[var(--pixel-cyan-light)] border-[var(--pixel-cyan)]"
      >🔄 99重掷</GmBtn>
    </div>
    <div className="grid grid-cols-1 gap-1.5 mt-1">
      <GmBtn
        onClick={() => {
          if (game.phase === 'battle') {
            setGame((p): GameState => ({ ...p, gmKillWave: Date.now() }));
            addToast('GM: 杀死当前波次敌人');
          } else {
            addToast('GM: 当前不在战斗中');
          }
        }}
        className="bg-[var(--pixel-red-dark)] text-[var(--pixel-red-light)] border-[var(--pixel-red)]"
      >💀 杀死当前波次</GmBtn>
    </div>
    <div className="text-[8px] text-[var(--dungeon-text-dim)] text-center mt-2">战斗/章节</div>
    <div className="grid grid-cols-2 gap-1.5">
      <GmBtn
        onClick={() => {
          if (game.phase === 'battle') {
            setGame(p => ({
              ...p,
              map: p.map.map(n => n.id === p.currentNodeId ? { ...n, completed: true } : n),
              phase: 'loot',
              isEnemyTurn: false,
            }));
            addToast('GM: 战斗胜利');
          } else {
            addToast('GM: 当前不在战斗中');
          }
          onClose();
        }}
        className="bg-[var(--pixel-gold-dark)] text-[var(--pixel-gold-light)] border-[var(--pixel-gold)]"
      >⚔ 立即胜利</GmBtn>
      <GmBtn
        onClick={() => {
          setGame(p => ({
            ...p,
            map: p.map.map(n => ({ ...n, completed: true })),
            phase: 'chapterTransition',
            isEnemyTurn: false,
          }));
          addToast('GM: 跳到下一大关');
          onClose();
        }}
        className="bg-[var(--pixel-orange-dark)] text-[var(--pixel-orange-light)] border-[var(--pixel-orange)]"
      >⏭ 跨大关</GmBtn>
    </div>
  </>
);

/* ── 训练场（GM 抓任意敌人单挑） ──
 *
 * [GM-TRAINING 2026-05-09] 用于快速验证敌人精灵图、AI 行为、台词触发节点：
 *   greet/dispatch（BOSS Taunt）/ enter / hurt / phase2_taunt / lowHp / death
 *
 * 实现策略（最小改动）：
 *   1. 仅在 phase==='battle' 时可用（依赖当前 game.currentNodeId 作为载体节点）
 *   2. 用户选择敌人 → 调 startBattle(fakeNode, [{enemies:[buildEnemy(target)]}])
 *      其中 fakeNode 沿用当前 currentNode.id 但 type 改为 'normal' / 'boss' (按敌人 category)
 *   3. startBattle 完整复用：fadeIn / Taunt / BossEntrance / 出场台词 / 骰子动画
 *   4. 战后正常进 loot 流（用户可选 GM"立即胜利"或正常通关）
 */
const ENEMY_CATEGORY_LABEL: Record<string, string> = {
  normal: '小怪', elite: '精英', boss_mid: '中BOSS', boss_final: '终BOSS',
};
const ENEMY_CATEGORY_COLOR: Record<string, string> = {
  normal: 'var(--dungeon-text)', elite: 'var(--pixel-cyan-light)',
  boss_mid: 'var(--pixel-orange-light)', boss_final: 'var(--pixel-red-light)',
};
const COMBAT_TYPE_LABEL: Record<string, string> = {
  warrior: '战', ranger: '射', guardian: '盾', caster: '法', priest: '祭',
};

interface TrainingEntry {
  config: EnemyConfig;
  category: 'normal' | 'elite' | 'boss_mid' | 'boss_final';
}

/** 收集全部敌人，分类标记（用 bossRank 区分中/终） */
function collectAllEnemies(): TrainingEntry[] {
  const list: TrainingEntry[] = [];
  for (const cfg of NORMAL_ENEMIES) list.push({ config: cfg, category: 'normal' });
  for (const cfg of ELITE_ENEMIES) list.push({ config: cfg, category: 'elite' });
  for (const cfg of BOSS_ENEMIES) {
    list.push({ config: cfg, category: cfg.bossRank === 'final' ? 'boss_final' : 'boss_mid' });
  }
  return list;
}

const GmTrainingGround: React.FC<{
  gmSubPanel: GmSubPanel;
  setGmSubPanel: (v: GmSubPanel) => void;
  gmFilter: string;
  setGmFilter: (v: string) => void;
  onClose: () => void;
}> = ({ gmSubPanel, setGmSubPanel, gmFilter, setGmFilter, onClose }) => {
  const { game, addToast, startBattle } = useGameContext();
  const [chapterFilter, setChapterFilter] = useState<number | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'normal' | 'elite' | 'boss_mid' | 'boss_final'>('all');

  const allEnemies = React.useMemo(() => collectAllEnemies(), []);
  const filtered = allEnemies.filter(e => {
    if (chapterFilter !== 'all' && (e.config.chapter || 0) !== chapterFilter) return false;
    if (categoryFilter !== 'all' && e.category !== categoryFilter) return false;
    if (gmFilter && !e.config.name.includes(gmFilter) && !e.config.id.includes(gmFilter)) return false;
    return true;
  });

  const inBattle = game.phase === 'battle';

  const launchTraining = (entry: TrainingEntry) => {
    if (!inBattle) {
      addToast('训练场仅在战斗中可用，请先进入任意战斗');
      return;
    }
    const realNode = game.map.find(n => n.id === game.currentNodeId);
    if (!realNode) {
      addToast('找不到当前节点，无法启动训练');
      return;
    }
    // 伪造 node：保留 id 但根据敌人类别决定 type（影响演出路径）
    const fakeNode: MapNode = {
      ...realNode,
      type: (entry.category === 'boss_mid' || entry.category === 'boss_final') ? 'boss' : 'enemy',
    };
    const enemy = buildEnemy(entry.config, 1, 1);
    addToast(`训练场: 出战「${entry.config.name}」`, 'buff');
    onClose();
    // 异步等关闭面板后再触发战斗演出
    setTimeout(() => startBattle(fakeNode, [{ enemies: [enemy] }]), 80);
  };

  return (
    <>
      <div className="text-[8px] text-[var(--dungeon-text-dim)] text-center mt-2">训练场（敌人测试）</div>
      <div className="grid grid-cols-1 gap-1.5">
        <GmBtn
          onClick={() => { setGmSubPanel(gmSubPanel === 'training' ? 'none' : 'training'); setGmFilter(''); }}
          className={gmSubPanel === 'training'
            ? 'bg-[var(--pixel-cyan)] text-black border-[var(--pixel-cyan)]'
            : 'bg-[var(--dungeon-panel)] text-[var(--pixel-cyan-light)] border-[var(--pixel-cyan)]'}
        >🎯 训练场（{allEnemies.length} 只敌人）</GmBtn>
      </div>

      {gmSubPanel === 'training' && (
        <div className="border border-[var(--pixel-cyan-dark)] p-1.5 space-y-1" style={{ borderRadius: '4px', maxHeight: '320px', display: 'flex', flexDirection: 'column' }}>
          {!inBattle && (
            <div className="text-[8px] text-[var(--pixel-orange)] text-center py-1 px-2"
              style={{ background: 'rgba(255,140,40,0.08)', border: '1px solid var(--pixel-orange-dark)', borderRadius: '3px' }}>
              ⚠ 训练场需在战斗中启动，请先点地图任一节点进入战斗
            </div>
          )}

          {/* 章节筛选 */}
          <div className="flex gap-1 flex-wrap">
            {[
              { v: 'all' as const, label: '全部' },
              { v: 1 as const, label: '章1' }, { v: 2 as const, label: '章2' },
              { v: 3 as const, label: '章3' }, { v: 4 as const, label: '章4' },
              { v: 5 as const, label: '章5' },
            ].map(opt => (
              <button key={String(opt.v)} onClick={() => setChapterFilter(opt.v)}
                className="text-[8px] px-1.5 py-0.5 border"
                style={{
                  borderRadius: '2px',
                  background: chapterFilter === opt.v ? 'var(--pixel-cyan)' : 'transparent',
                  color: chapterFilter === opt.v ? '#000' : 'var(--dungeon-text)',
                  borderColor: 'var(--pixel-cyan-dark)',
                }}
              >{opt.label}</button>
            ))}
          </div>

          {/* 类别筛选 */}
          <div className="flex gap-1 flex-wrap">
            {[
              { v: 'all' as const, label: '全部' },
              { v: 'normal' as const, label: '小怪' },
              { v: 'elite' as const, label: '精英' },
              { v: 'boss_mid' as const, label: '中BOSS' },
              { v: 'boss_final' as const, label: '终BOSS' },
            ].map(opt => (
              <button key={opt.v} onClick={() => setCategoryFilter(opt.v)}
                className="text-[8px] px-1.5 py-0.5 border"
                style={{
                  borderRadius: '2px',
                  background: categoryFilter === opt.v ? 'var(--pixel-orange)' : 'transparent',
                  color: categoryFilter === opt.v ? '#000' : 'var(--dungeon-text)',
                  borderColor: 'var(--pixel-orange-dark)',
                }}
              >{opt.label}</button>
            ))}
          </div>

          {/* 搜索框 */}
          <input
            type="text" placeholder="搜索敌人名或 ID..."
            value={gmFilter} onChange={e => setGmFilter(e.target.value)}
            className="w-full px-2 py-1 text-[9px] bg-[var(--dungeon-bg)] text-[var(--dungeon-text)] border border-[var(--dungeon-panel-border)] outline-none"
            style={{ borderRadius: '3px', flexShrink: 0 }}
          />

          {/* 敌人列表 */}
          <div style={{ flex: 1, overflowY: 'auto', minHeight: 0, WebkitOverflowScrolling: 'touch', touchAction: 'pan-y', overscrollBehavior: 'contain' }}>
            {filtered.length === 0 ? (
              <div className="text-[8px] text-[var(--dungeon-text-dim)] text-center py-2">无匹配敌人</div>
            ) : filtered.map(entry => (
              <button key={entry.config.id} onClick={() => launchTraining(entry)}
                disabled={!inBattle}
                className="w-full text-left px-1.5 py-1 text-[8px] flex items-center gap-1 hover:bg-[rgba(255,255,255,0.05)] transition-colors"
                style={{ opacity: inBattle ? 1 : 0.4 }}
              >
                <span style={{ color: ENEMY_CATEGORY_COLOR[entry.category], fontWeight: 'bold', minWidth: '36px', fontSize: '7px' }}>
                  [{ENEMY_CATEGORY_LABEL[entry.category]}]
                </span>
                <span style={{ color: 'var(--dungeon-text-dim)', minWidth: '14px', fontSize: '7px' }}>
                  {COMBAT_TYPE_LABEL[entry.config.combatType] || '?'}
                </span>
                <span style={{ color: 'var(--dungeon-text-dim)', minWidth: '20px', fontSize: '7px' }}>
                  ch{entry.config.chapter || '?'}
                </span>
                <span className="text-[var(--dungeon-text)] flex-1">{entry.config.name}</span>
                <span style={{ color: 'var(--pixel-red-light)', fontSize: '7px' }}>
                  HP{entry.config.baseHp}
                </span>
                <span style={{ color: 'var(--pixel-orange-light)', fontSize: '7px' }}>
                  /AT{entry.config.baseDmg}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
};


/* ── 遗物管理 ── */
const GmRelicManager: React.FC<{
  game: ReturnType<typeof useGameContext>['game'];
  setGame: ReturnType<typeof useGameContext>['setGame'];
  addToast: ReturnType<typeof useGameContext>['addToast'];
  gmSubPanel: GmSubPanel;
  setGmSubPanel: (v: GmSubPanel) => void;
  gmFilter: string;
  setGmFilter: (v: string) => void;
}> = ({ game, setGame, addToast, gmSubPanel, setGmSubPanel, gmFilter, setGmFilter }) => (
  <>
    <div className="text-[8px] text-[var(--dungeon-text-dim)] text-center mt-2">遗物管理</div>
    <div className="grid grid-cols-2 gap-1.5">
      <GmBtn
        onClick={() => { setGmSubPanel(gmSubPanel === 'addRelic' ? 'none' : 'addRelic'); setGmFilter(''); }}
        className={gmSubPanel === 'addRelic'
          ? 'bg-[var(--pixel-green)] text-black border-[var(--pixel-green)]'
          : 'bg-[var(--dungeon-panel)] text-[var(--pixel-green-light)] border-[var(--pixel-green)]'}
      >+ 添加遗物</GmBtn>
      <GmBtn
        onClick={() => { setGmSubPanel(gmSubPanel === 'removeRelic' ? 'none' : 'removeRelic'); }}
        className={gmSubPanel === 'removeRelic'
          ? 'bg-[var(--pixel-red)] text-black border-[var(--pixel-red)]'
          : 'bg-[var(--dungeon-panel)] text-[var(--pixel-red-light)] border-[var(--pixel-red)]'}
      >- 移除遗物</GmBtn>
    </div>

    {/* 添加遗物子面板 */}
    {gmSubPanel === 'addRelic' && (
      <div className="border border-[var(--pixel-green-dark)] p-1.5 space-y-1" style={{ borderRadius: '4px', maxHeight: '200px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <input
          type="text" placeholder="搜索遗物名..."
          value={gmFilter} onChange={e => setGmFilter(e.target.value)}
          className="w-full px-2 py-1 text-[9px] bg-[var(--dungeon-bg)] text-[var(--dungeon-text)] border border-[var(--dungeon-panel-border)] outline-none"
          style={{ borderRadius: '3px', flexShrink: 0 }}
        />
        <div style={{ flex: 1, overflowY: 'auto', minHeight: 0, WebkitOverflowScrolling: 'touch', touchAction: 'pan-y', overscrollBehavior: 'contain' }}>
          {Object.values(ALL_RELICS)
            .filter(r => !gmFilter || r.name.includes(gmFilter) || r.id.includes(gmFilter))
            .map(relic => {
              const owned = game.relics.some(r => r.id === relic.id);
              return (
                <button key={relic.id} onClick={() => {
                  if (owned) { addToast('已拥有该遗物'); return; }
                  setGame(p => ({ ...p, relics: [...p.relics, { ...relic }] }));
                  addToast(`GM: +遗物「${relic.name}」`, 'buff');
                }}
                  className="w-full text-left px-1.5 py-1 text-[8px] flex items-center gap-1 hover:bg-[rgba(255,255,255,0.05)] transition-colors"
                  style={{ opacity: owned ? 0.4 : 1 }}
                >
                  <span style={{ color: RARITY_COLORS[relic.rarity] || '#888', fontWeight: 'bold', minWidth: '24px' }}>
                    [{RARITY_LABELS[relic.rarity] || '?'}]
                  </span>
                  <span className="text-[var(--dungeon-text)]">{relic.name}</span>
                  {owned && <span className="ml-auto text-[var(--pixel-green)]" style={{ fontSize: '7px' }}>已有</span>}
                </button>
              );
            })}
        </div>
      </div>
    )}

    {/* 移除遗物子面板 */}
    {gmSubPanel === 'removeRelic' && (
      <div className="border border-[var(--pixel-red-dark)] p-1.5 space-y-1" style={{ borderRadius: '4px', maxHeight: '200px', overflowY: 'auto', WebkitOverflowScrolling: 'touch', touchAction: 'pan-y', overscrollBehavior: 'contain' }}>
        {game.relics.length === 0 ? (
          <div className="text-[8px] text-[var(--dungeon-text-dim)] text-center py-2">当前没有遗物</div>
        ) : game.relics.map((relic, idx) => (
          <button key={`${relic.id}_${idx}`} onClick={() => {
            setGame(p => ({ ...p, relics: p.relics.filter((_, i) => i !== idx) }));
            addToast(`GM: 移除遗物「${relic.name}」`);
          }}
            className="w-full text-left px-1.5 py-1 text-[8px] flex items-center gap-1 hover:bg-[rgba(255,0,0,0.08)] transition-colors"
          >
            <span style={{ color: RARITY_COLORS[relic.rarity] || '#888', fontWeight: 'bold', minWidth: '24px' }}>
              [{RARITY_LABELS[relic.rarity] || '?'}]
            </span>
            <span className="text-[var(--dungeon-text)] flex-1">{relic.name}</span>
            <span className="text-[var(--pixel-red)] font-bold">×</span>
          </button>
        ))}
      </div>
    )}
  </>
);

/* ── 骰子管理 ── */
const GmDiceManager: React.FC<{
  game: ReturnType<typeof useGameContext>['game'];
  setGame: ReturnType<typeof useGameContext>['setGame'];
  addToast: ReturnType<typeof useGameContext>['addToast'];
  gmSubPanel: GmSubPanel;
  setGmSubPanel: (v: GmSubPanel) => void;
}> = ({ game, setGame, addToast, gmSubPanel, setGmSubPanel }) => (
  <>
    <div className="text-[8px] text-[var(--dungeon-text-dim)] text-center mt-2">骰子管理</div>
    <div className="grid grid-cols-2 gap-1.5">
      <GmBtn
        onClick={() => { setGmSubPanel(gmSubPanel === 'addDice' ? 'none' : 'addDice'); }}
        className={gmSubPanel === 'addDice'
          ? 'bg-[var(--pixel-cyan)] text-black border-[var(--pixel-cyan)]'
          : 'bg-[var(--dungeon-panel)] text-[var(--pixel-cyan-light)] border-[var(--pixel-cyan)]'}
      >+ 添加骰子</GmBtn>
      <GmBtn
        onClick={() => { setGmSubPanel(gmSubPanel === 'removeDice' ? 'none' : 'removeDice'); }}
        className={gmSubPanel === 'removeDice'
          ? 'bg-[var(--pixel-red)] text-black border-[var(--pixel-red)]'
          : 'bg-[var(--dungeon-panel)] text-[var(--pixel-red-light)] border-[var(--pixel-red)]'}
      >- 移除骰子</GmBtn>
    </div>

    {/* 添加骰子子面板 */}
    {gmSubPanel === 'addDice' && (
      <div className="border border-[var(--pixel-cyan-dark)] p-1.5 space-y-1" style={{ borderRadius: '4px', maxHeight: '180px', overflowY: 'auto', WebkitOverflowScrolling: 'touch', touchAction: 'pan-y', overscrollBehavior: 'contain' }}>
        {Object.values(ALL_DICE).map(diceDef => (
          <button key={diceDef.id} onClick={() => {
            setGame(p => ({
              ...p,
              ownedDice: [...p.ownedDice, { defId: diceDef.id, level: 1 }],
              diceBag: [...p.diceBag, diceDef.id],
            }));
            addToast(`GM: +骰子「${diceDef.name}」`, 'buff');
          }}
            className="w-full text-left px-1.5 py-1 text-[8px] flex items-center gap-1 hover:bg-[rgba(255,255,255,0.05)] transition-colors"
          >
            <span style={{ color: RARITY_COLORS[diceDef.rarity] || '#888', fontWeight: 'bold', minWidth: '24px' }}>
              [{RARITY_LABELS[diceDef.rarity] || '?'}]
            </span>
            <span className="text-[var(--dungeon-text)]">{diceDef.name}</span>
            <span className="ml-auto text-[var(--dungeon-text-dim)]" style={{ fontSize: '7px' }}>[{diceDef.faces.join(',')}]</span>
          </button>
        ))}
      </div>
    )}

    {/* 移除骰子子面板 */}
    {gmSubPanel === 'removeDice' && (
      <div className="border border-[var(--pixel-red-dark)] p-1.5 space-y-1" style={{ borderRadius: '4px', maxHeight: '180px', overflowY: 'auto', WebkitOverflowScrolling: 'touch', touchAction: 'pan-y', overscrollBehavior: 'contain' }}>
        {game.ownedDice.length === 0 ? (
          <div className="text-[8px] text-[var(--dungeon-text-dim)] text-center py-2">骰子库为空</div>
        ) : (() => {
          const counts: Record<string, { count: number; name: string; rarity: string; faces: number[] }> = {};
          game.ownedDice.forEach(od => {
            const def = ALL_DICE[od.defId];
            if (!counts[od.defId]) counts[od.defId] = { count: 0, name: def?.name || od.defId, rarity: def?.rarity || 'common', faces: def?.faces || [] };
            counts[od.defId].count++;
          });
          return Object.entries(counts).map(([defId, info]) => (
            <button key={defId} onClick={() => {
              setGame(p => {
                const idx = p.ownedDice.findIndex(od => od.defId === defId);
                if (idx < 0) return p;
                const newOwned = [...p.ownedDice];
                newOwned.splice(idx, 1);
                let removed = false;
                const newBag = p.diceBag.filter(id => {
                  if (!removed && id === defId) { removed = true; return false; }
                  return true;
                });
                return { ...p, ownedDice: newOwned, diceBag: newBag };
              });
              addToast(`GM: 移除骰子「${info.name}」`);
            }}
              className="w-full text-left px-1.5 py-1 text-[8px] flex items-center gap-1 hover:bg-[rgba(255,0,0,0.08)] transition-colors"
            >
              <span style={{ color: RARITY_COLORS[info.rarity] || '#888', fontWeight: 'bold', minWidth: '24px' }}>
                [{RARITY_LABELS[info.rarity] || '?'}]
              </span>
              <span className="text-[var(--dungeon-text)] flex-1">{info.name}</span>
              <span className="text-[var(--pixel-orange)] font-mono" style={{ fontSize: '8px' }}>×{info.count}</span>
              <span className="text-[var(--pixel-red)] font-bold ml-1">×</span>
            </button>
          ));
        })()}
      </div>
    )}
  </>
);

/* ── 通用按钮样式 ── */
const GmBtn: React.FC<{
  onClick: () => void;
  className: string;
  children: React.ReactNode;
}> = ({ onClick, className, children }) => (
  <button
    onClick={onClick}
    className={`py-1.5 text-[9px] font-bold border ${className}`}
    style={{ borderRadius: '4px' }}
  >
    {children}
  </button>
);
