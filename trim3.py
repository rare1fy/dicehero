content = open('F:/UGit/dicehero2/src/hooks/useBattleLifecycle.ts', encoding='utf-8').read()

removals = [
    '      // 标记已触发，防重复\n',
    '        // 章节开场亮相：取当前章节终Boss（最终大Boss更有压迫感）\n',
    '        // 拿台词：从 BOSS_ENEMIES 取该Boss的enter台词\n',
    '        // 随机取2句（前2句 or 洗牌取2）\n',
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
