content = open('F:/UGit/dicehero2/src/hooks/useBattleLifecycle.ts', encoding='utf-8').read()

old = "      && !(game.bossRoamSeen || []).includes(-intro);"
new = "      && !(game.bossRoamSeen || []).includes(${game.chapter}-intro);"

if old in content:
    content = content.replace(old, new)
    open('F:/UGit/dicehero2/src/hooks/useBattleLifecycle.ts', 'w', encoding='utf-8').write(content)
    print('OK fixed backtick')
else:
    print('NOT FOUND - checking what is there:')
    idx = content.find('bossRoamSeen || []).includes')
    print(repr(content[max(0,idx-10):idx+80]))
