content=open('F:/UGit/dicehero2/src/contexts/BattleContext.tsx',encoding='utf-8').read()

old = "bossTaunt: { visible: boolean; name: string; chapter: number; lines: string[] };"
new = "bossTaunt: { visible: boolean; name: string; chapter: number; lines: string[]; onDismiss?: () => void };"

if old in content:
    content = content.replace(old, new)
    open('F:/UGit/dicehero2/src/contexts/BattleContext.tsx','w',encoding='utf-8').write(content)
    print('OK')
else:
    print('NOT FOUND')
    idx = content.find('bossTaunt:')
    print(repr(content[max(0,idx-10):idx+120]))
