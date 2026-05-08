content = open('F:/UGit/dicehero2/src/hooks/useBattleLifecycle.ts', encoding='utf-8').read()
lines = content.split('\n')
# 找到"非 Boss 节点在这里"开始行，到startNode函数开始前的最后一个'};'
start = -1
end = -1
for i, line in enumerate(lines):
    if '非 Boss 节点在这里' in line:
        start = i
        print('start at line', i+1, ':', line)
    if start != -1 and '// ==================== startNode' in line:
        # 往上找最近的 '  };'
        for j in range(i-1, start-1, -1):
            if lines[j].strip() == '};':
                end = j
                break
        break
print('start:', start+1, 'end:', end+1)
print('removing lines:', start+1, 'to', end+1)
# 注意end那行 '  };' 是startBattle函数的结束，我们需要保留。但block2是在startBattle内部的。
# 重新审视：block2的结构是 if(!boss){ if(depth==0){...} else {fadeOut; none;} }
# 在block2之后是 '};' 然后 '// ==================== startNode'
# 我们要保留 '  };' 这行，只删掉 '非Boss...' 到 '  };' 前一行（即 '}'  行）
# 所以删除start 到 end-1（end就是'};'行，要保留）
if start != -1 and end != -1:
    # 删除 start ~ end-1（保留end这行 '  };'）
    new_lines = lines[:start] + lines[end:]
    new_content = '\n'.join(new_lines)
    with open('F:/UGit/dicehero2/src/hooks/useBattleLifecycle.ts', 'w', encoding='utf-8') as f:
        f.write(new_content)
    print('removed', end - start, 'lines')
    print('new total:', len(new_lines))
