with open('F:/UGit/dicehero2/src/hooks/useBattleLifecycle.ts', 'rb') as f:
    raw = f.read()
lines = raw.split(b'\n')
fixed = 0
for i, line in enumerate(lines):
    # 找形如 'const roamKey = \-intro;' 或类似被破坏的模板字符串
    if b'const roamKey' in line and b'-intro' in line and b'\' not in line:
        correct = b'    const roamKey = \' + b'\' + b'-intro\;'
        # 但block1里是'    const roamKey' 在函数体内4空格缩进
        lines[i] = correct
        print(f'line {i+1}: fixed')
        fixed += 1
raw = b'\n'.join(lines)
with open('F:/UGit/dicehero2/src/hooks/useBattleLifecycle.ts', 'wb') as f:
    f.write(raw)
print('done, fixed', fixed)
