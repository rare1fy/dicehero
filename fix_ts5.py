content = open('F:/UGit/dicehero2/src/hooks/useBattleLifecycle.ts', encoding='utf-8').read()

bad = '      && !(game.bossRoamSeen || []).includes(-intro);'
# correct line with backtick template literal
correct_bytes = b'      && !(game.bossRoamSeen || []).includes(' + b'' + b'-intro);'
correct = correct_bytes.decode('utf-8')

if bad in content:
    content = content.replace(bad, correct)
    open('F:/UGit/dicehero2/src/hooks/useBattleLifecycle.ts', 'w', encoding='utf-8').write(content)
    print('OK fixed')
else:
    print('not found, checking...')
    idx = content.find('willShowRoamTaunt')
    print(repr(content[max(0,idx-50):idx+200]))
