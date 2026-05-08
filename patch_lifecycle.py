content = open('src/hooks/useBattleLifecycle.ts', encoding='utf-8').read()

old = """        // fadeOut先收起黑屏，让战斗场景可见，再播演出
        setBattleTransition('fadeOut');
        await new Promise(r => setTimeout(r, 320));
        setBattleTransition('none');
        // 播Boss路过嘲讽"""

new = """        // 场景就绪后直接触发 Boss 登场演出（已嵌入战斗场景，不需要先切黑屏）
        setBattleTransition('fadeOut');
        await new Promise(r => setTimeout(r, 280));
        setBattleTransition('none');
        await new Promise(r => setTimeout(r, 60));
        // 播Boss路过嘲讽"""

if old in content:
    content = content.replace(old, new)
    open('src/hooks/useBattleLifecycle.ts', 'w', encoding='utf-8').write(content)
    print('OK')
else:
    print('NOT FOUND - no change needed')
