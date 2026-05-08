content = open('F:/UGit/dicehero2/src/hooks/useBattleLifecycle.ts', encoding='utf-8').read()
# 查找"非 Boss 节点在这里 fadeOut"
idx = content.find('非 Boss 节点在这里')
print('非 Boss 节点在这里 fadeOut at:', idx)
if idx != -1:
    print(content[idx:idx+2000])
else:
    print('not found - already clean')
