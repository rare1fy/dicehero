content=open('F:/UGit/dicehero2/src/hooks/useBattleState.ts',encoding='utf-8').read()
idx=content.find('bossTaunt, setBossTaunt')
print(repr(content[idx:idx+200]))
