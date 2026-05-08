with open('F:/UGit/dicehero2/src/hooks/useBattleLifecycle.ts', 'rb') as f:
    raw = f.read()
bad  = b'      && !(game.bossRoamSeen || []).includes(-intro);'
good = b"      && !(game.bossRoamSeen || []).includes(\-intro);"
if bad in raw:
    raw = raw.replace(bad, good)
    with open('F:/UGit/dicehero2/src/hooks/useBattleLifecycle.ts', 'wb') as f:
        f.write(raw)
    print('OK')
else:
    print('not found, raw search:')
    idx = raw.find(b'includes(')
    # find near willShowRoamTaunt
    idx2 = raw.find(b'willShowRoamTaunt')
    print(raw[max(0,idx2-200):idx2+100])
