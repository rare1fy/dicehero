content = open('src/components/EnemyStageView.tsx', encoding='utf-8').read()

# 1. 添加 import
old_import = "import { useBattleContext } from '../contexts/BattleContext';"
new_import = """import { useBattleContext } from '../contexts/BattleContext';
import { BossTauntEntrance } from './BossTauntEntrance';"""

# 2. 添加 bossTaunt 从 context 解构
old_destruct = "  const {\n    game,\n    setGame,"
new_destruct = """  const {
    game,
    setGame,"""

# 3. 找到 bossTaunt 字段在 context 解构中的位置（在 addToast 附近添加）
old_context_end = """    addToast,
    toggleSelect,
  } = useBattleContext();"""
new_context_end = """    addToast,
    toggleSelect,
    bossTaunt,
  } = useBattleContext();"""

# 4. 在结尾前插入 BossTauntEntrance
old_end = """      {/* 结算演出覆盖层 + 出牌预期结算卡片（2026-04-21 铁律 B.1 拆分） */}
      <SettlementOverlay />
      <DamagePreviewCard />
    </div>
  );
}"""
new_end = """      {/* 结算演出覆盖层 + 出牌预期结算卡片（2026-04-21 铁律 B.1 拆分） */}
      <SettlementOverlay />
      <DamagePreviewCard />

      {/* Boss 路过嘲讽登场演出 — 嵌入战斗场景，非全屏弹窗 */}
      <BossTauntEntrance
        visible={bossTaunt.visible}
        bossName={bossTaunt.name}
        chapter={bossTaunt.chapter}
        lines={bossTaunt.lines}
      />
    </div>
  );
}"""

changed = False
if old_import in content:
    content = content.replace(old_import, new_import)
    changed = True
    print('import OK')
else:
    print('import NOT FOUND')

if old_context_end in content:
    content = content.replace(old_context_end, new_context_end)
    print('context destruct OK')
else:
    print('context destruct NOT FOUND')

if old_end in content:
    content = content.replace(old_end, new_end)
    print('component mount OK')
else:
    print('component mount NOT FOUND')

if changed:
    open('src/components/EnemyStageView.tsx', 'w', encoding='utf-8').write(content)
    print('File saved')
