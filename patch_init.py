content = open('src/logic/gameInit.ts', encoding='utf-8').read()
old = '    bossPreviewSeen: [],\n  };\n}'
new = '    bossPreviewSeen: [],\n    bossRoamSeen: [],\n  };\n}'
if old in content:
    content = content.replace(old, new)
    open('src/logic/gameInit.ts', 'w', encoding='utf-8').write(content)
    print('OK')
else:
    print('NOT FOUND')
