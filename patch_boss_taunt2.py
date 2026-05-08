content = open('src/components/BossTauntEntrance.tsx', encoding='utf-8').read()

# 修复1: ease: number[] -> ease: string (贝塞尔曲线用字符串)
content = content.replace(
    "x: { duration: 0.42, ease: [0.2, 0.8, 0.3, 1.0] as number[] }",
    "x: { duration: 0.42, ease: 'easeOut' }"
)
content = content.replace(
    "exit: {\n      x: 160,\n      opacity: 0,\n      scale: 0.8,\n      transition: { duration: 0.38, ease: [0.5, 0.0, 0.8, 0.4] as number[] },\n    },",
    "exit: {\n      x: 160,\n      opacity: 0,\n      scale: 0.8,\n      transition: { duration: 0.38, ease: 'easeIn' },\n    },"
)

# 修复2: phase !== 'idle' 比较，idle不在enter|exit|talk1|talk2里，改写判断
content = content.replace(
    "phase !== 'idle' && phase !== 'exit' ? { opacity: 1 } : { opacity: 0 }",
    "phase === 'enter' || phase === 'talk1' || phase === 'talk2' ? { opacity: 1 } : { opacity: 0 }"
)

open('src/components/BossTauntEntrance.tsx', 'w', encoding='utf-8').write(content)
print('patched')
