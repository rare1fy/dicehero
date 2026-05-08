content = open('F:/UGit/dicehero2/src/hooks/useBattleLifecycle.ts', encoding='utf-8').read()
removals = [
    '      // [BOSS-ROAM 2026-05-08] Boss路过嘲讽演出：章节第一场战斗（depth 0）开始时插入\n',
    '      // 触发时机：每章第一场战斗，Boss亮个相说句垃圾话就退场\n',
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
