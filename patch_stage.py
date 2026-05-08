content = open('F:/UGit/dicehero2/src/components/EnemyStageView.tsx', encoding='utf-8').read()

# 找到 BossTauntEntrance 的 JSX 挂载，加入 onDismiss 传递
old = """      <BossTauntEntrance
        visible={bossTaunt.visible}
        bossName={bossTaunt.name}
        chapter={bossTaunt.chapter}
        lines={bossTaunt.lines}
      />"""

new = """      <BossTauntEntrance
        visible={bossTaunt.visible}
        bossName={bossTaunt.name}
        chapter={bossTaunt.chapter}
        lines={bossTaunt.lines}
        onDismiss={bossTaunt.onDismiss}
      />"""

if old in content:
    content = content.replace(old, new)
    open('F:/UGit/dicehero2/src/components/EnemyStageView.tsx', 'w', encoding='utf-8').write(content)
    print('OK')
else:
    print('NOT FOUND')
    # debug
    idx = content.find('BossTauntEntrance')
    print(repr(content[max(0,idx-20):idx+300]))
