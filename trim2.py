content = open('F:/UGit/dicehero2/src/hooks/useBattleLifecycle.ts', encoding='utf-8').read()

removals = [
    '        // Boss 路过嘲讽：先收黑屏，让场景可见（此时enemies为空，小怪区干净）\n',
    '        // 播Boss路过嘲讽 — 等玩家点击完两句台词后 resolve\n',
]
for r in removals:
    if r in content:
        content = content.replace(r, '')
        print('removed')
    else:
        print(f'not found: {repr(r[:50])}')

lines = content.split('\n')
print('new total:', len(lines))
open('F:/UGit/dicehero2/src/hooks/useBattleLifecycle.ts', 'w', encoding='utf-8').write(content)
