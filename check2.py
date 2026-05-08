content = open('F:/UGit/dicehero2/src/hooks/useBattleLifecycle.ts', encoding='utf-8').read()
idx = content.find('willShowRoamTaunt')
print(content[max(0,idx-10):idx+120])
