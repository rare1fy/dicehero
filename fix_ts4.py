content = open('F:/UGit/dicehero2/src/hooks/useBattleLifecycle.ts', encoding='utf-8').read()

# 精确查找整行
lines = content.split('\n')
for i, line in enumerate(lines):
    if 'bossRoamSeen' in line and 'includes' in line and 'willShowRoamTaunt' not in line and 'roamKey' not in line:
        print(f'line {i+1}:', repr(line))
        # 修正: 替换该行为正确的模板字符串
        lines[i] = "      && !(game.bossRoamSeen || []).includes(" + "" + "-intro);"
        print('fixed to:', repr(lines[i]))
        break

content = '\n'.join(lines)
open('F:/UGit/dicehero2/src/hooks/useBattleLifecycle.ts', 'w', encoding='utf-8').write(content)
print('saved')
