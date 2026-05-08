content = open('src/DiceHeroGame.tsx', encoding='utf-8').read()

old = """      {/* Boss 挑衅短演出（2026-05-08 刘叔新增）：先于 BossEntrance 横幅播放 */}
      <BossTauntEntrance
        visible={bossTaunt.visible}
        bossName={bossTaunt.name}
        chapter={bossTaunt.chapter}
        lines={bossTaunt.lines}
      />

      {/* Boss出场演出遮罩 */}"""

new = """      {/* Boss出场演出遮罩 */}"""

if old in content:
    content = content.replace(old, new)
    # 也移除 BossTauntEntrance 的 import（EnemyStageView 会自己 import）
    content = content.replace("import { BossTauntEntrance } from './components/BossTauntEntrance';\n", "")
    open('src/DiceHeroGame.tsx', 'w', encoding='utf-8').write(content)
    print('OK - removed from DiceHeroGame')
else:
    print('NOT FOUND')
