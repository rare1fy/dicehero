content = open('F:/UGit/dicehero2/src/hooks/useBattleLifecycle.ts', encoding='utf-8').read()

# 移除一些多余的注释行
removals = [
    '    // [BOSS-TAUNT 2026-05-08] Boss 战不走普通 enter 气泡（会被下面的 bossTaunt 短剧取代），避免重复\n',
    '    // [BOSS-ROAM 2026-05-08] 路过嘲讽场景：演出期间不刷小怪（空场景），演出结束后才 setEnemies\n',
    '    // 非路过嘲讽场景（boss节点或非第一场）正常立刻 setEnemies\n',
    '      // 演出结束后才刷出小怪 + enter 台词\n',
]
for r in removals:
    if r in content:
        content = content.replace(r, '')
        print(f'removed comment')
    else:
        print(f'not found: {repr(r[:40])}')

lines = content.split('\n')
print('new total:', len(lines))
open('F:/UGit/dicehero2/src/hooks/useBattleLifecycle.ts', 'w', encoding='utf-8').write(content)
