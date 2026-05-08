content=open('F:/UGit/dicehero2/src/hooks/useBattleState.ts',encoding='utf-8').read()

old = "bossTaunt, setBossTaunt] = useState<{ visible: boolean; name: string; chapter: number; lines: string[] }>({ visible: false, name: '', chapter: 1, lines: [] });"
new = "bossTaunt, setBossTaunt] = useState<{ visible: boolean; name: string; chapter: number; lines: string[]; onDismiss?: () => void }>({ visible: false, name: '', chapter: 1, lines: [] });"

if old in content:
    content = content.replace(old, new)
    open('F:/UGit/dicehero2/src/hooks/useBattleState.ts','w',encoding='utf-8').write(content)
    print('OK')
else:
    print('NOT FOUND')
