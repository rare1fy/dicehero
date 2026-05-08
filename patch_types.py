content = open('src/types/game.ts', encoding='utf-8').read()
old = 'bossPreviewSeen?: number[];          // 已触发过路上预告的章节列表（防重复）\n}'
new = 'bossPreviewSeen?: number[];          // 已触发过路上预告的章节列表（防重复）\n  bossRoamSeen?: string[];             // 已触发过Boss路过嘲讽演出（防重复）\n}'
if old in content:
    content = content.replace(old, new)
    open('src/types/game.ts', 'w', encoding='utf-8').write(content)
    print('OK')
else:
    print('NOT FOUND')
