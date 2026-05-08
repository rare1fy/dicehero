content = open('F:/UGit/dicehero2/src/hooks/useBattleLifecycle.ts', encoding='utf-8').read()

# 用字节级别定位和替换
bad  = '&& !(game.bossRoamSeen || []).includes(-intro);'
good = '&& !(game.bossRoamSeen || []).includes(' + '' + '-intro);'

if bad in content:
    content = content.replace(bad, good)
    open('F:/UGit/dicehero2/src/hooks/useBattleLifecycle.ts', 'w', encoding='utf-8').write(content)
    print('OK')
else:
    print('STILL NOT FOUND')
    idx = content.find('includes(')
    # find all includes near bossRoamSeen
    import re
    for m in re.finditer(r'bossRoamSeen', content):
        i = m.start()
        print(repr(content[i:i+100]))
