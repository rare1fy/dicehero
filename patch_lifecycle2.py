content = open('F:/UGit/dicehero2/src/hooks/useBattleLifecycle.ts', encoding='utf-8').read()

# 目标：把路过嘲讽改为 Promise-await 模式，演出期间不setEnemies
# 找到路过嘲讽那一大块
old = """        // 场景就绪后直接触发 Boss 登场演出（已嵌入战斗场景，不需要先切黑屏）
        setBattleTransition('fadeOut');
        await new Promise(r => setTimeout(r, 280));
        setBattleTransition('none');
        await new Promise(r => setTimeout(r, 60));
        // 播Boss路过嘲讽
        setBossTaunt({ visible: true, name: bossName, chapter: game.chapter || 1, lines: tauntLines });
        playSound('boss_laugh');
        await new Promise(r => setTimeout(r, 2600));
        setBossTaunt(prev => ({ ...prev, visible: false }));
        await new Promise(r => setTimeout(r, 200));
      } else {"""

new = """        // Boss 路过嘲讽：先收黑屏，让场景可见（此时enemies为空，小怪区干净）
        setBattleTransition('fadeOut');
        await new Promise(r => setTimeout(r, 280));
        setBattleTransition('none');
        await new Promise(r => setTimeout(r, 60));
        // 播Boss路过嘲讽 — 等玩家点击完两句台词后 resolve
        await new Promise<void>(resolve => {
          setBossTaunt({
            visible: true,
            name: bossName,
            chapter: game.chapter || 1,
            lines: tauntLines,
            onDismiss: resolve,
          });
          playSound('boss_laugh');
        });
        setBossTaunt(prev => ({ ...prev, visible: false, onDismiss: undefined }));
        await new Promise(r => setTimeout(r, 200));
        // 演出结束后才刷出小怪 + enter 台词
        setEnemies(firstWave);
        setTimeout(() => {
          firstWave.forEach((e, ei) => {
            const q = getEnemyQuotes(e.configId);
            const line = pickQuote(q?.enter);
            if (line) {
              setTimeout(() => {
                showEnemyQuote(e.uid, line, 3000);
                playSound('enemy_speak');
                setEnemyEffectForUid(e.uid, 'speaking');
                setTimeout(() => setEnemyEffectForUid(e.uid, null), 400);
              }, ei * 400);
            }
          });
        }, 200);
      } else {"""

if old in content:
    content = content.replace(old, new)
    open('F:/UGit/dicehero2/src/hooks/useBattleLifecycle.ts', 'w', encoding='utf-8').write(content)
    print('OK - lifecycle patched')
else:
    print('NOT FOUND')
    idx = content.find('播Boss路过嘲讽')
    print(repr(content[max(0,idx-300):idx+400]))
