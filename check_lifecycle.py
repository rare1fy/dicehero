content = open('F:/UGit/dicehero2/src/hooks/useBattleLifecycle.ts', encoding='utf-8').read()
idx = content.find('演出结束后才刷出小怪')
print(content[max(0,idx-200):idx+600])
