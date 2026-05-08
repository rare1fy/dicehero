content = open('src/components/BossTauntEntrance.tsx', encoding='utf-8').read()

# 把 spriteVariants + motion.div variants 方式替换成直接的 animate 对象方式
old_variants = """  // Boss精灵的动画变体
  const spriteVariants = {
    hidden: { x: 160, opacity: 0, scale: 0.7 },
    enter: {
      x: 0,
      opacity: 1,
      scale: [0.7, 1.18, 0.94, 1.06, 1.0] as number[],
      transition: {
        x: { duration: 0.42, ease: 'easeOut' },
        opacity: { duration: 0.2 },
        scale: { duration: 0.55, times: [0, 0.42, 0.65, 0.82, 1.0], ease: 'easeOut' },
      },
    },
    talk: {
      x: 0,
      opacity: 1,
      scale: 1.0,
      transition: { duration: 0.18 },
    },
    exit: {
      x: 160,
      opacity: 0,
      scale: 0.8,
      transition: { duration: 0.38, ease: 'easeIn' },
    },
  };

  const currentVariant =
    phase === 'enter' ? 'enter' :
    phase === 'exit' ? 'exit' :
    phase === 'idle' ? 'hidden' :
    'talk';"""

new_variants = """  // Boss精灵的动画对象（直接传入 animate，避免 Variants 类型限制）
  const spriteAnimate = phase === 'enter'
    ? { x: 0, opacity: 1, scale: [0.7, 1.18, 0.94, 1.06, 1.0] }
    : phase === 'exit'
    ? { x: 160, opacity: 0, scale: 0.8 }
    : phase === 'idle'
    ? { x: 160, opacity: 0, scale: 0.7 }
    : { x: 0, opacity: 1, scale: 1.0 };

  const spriteTransition = phase === 'enter'
    ? { duration: 0.55, ease: 'easeOut' as const }
    : phase === 'exit'
    ? { duration: 0.38, ease: 'easeIn' as const }
    : { duration: 0.18 };"""

if old_variants in content:
    content = content.replace(old_variants, new_variants)
    print('variants replaced')
else:
    print('variants NOT FOUND')
    # debug
    idx = content.find('spriteVariants')
    print(repr(content[max(0,idx-30):idx+100]))

# 同时替换 motion.div 的 variants 用法
old_motion = """          <motion.div
            variants={spriteVariants}
            initial="hidden"
            animate={currentVariant}"""

new_motion = """          <motion.div
            initial={{ x: 160, opacity: 0, scale: 0.7 }}
            animate={spriteAnimate}
            transition={spriteTransition}"""

if old_motion in content:
    content = content.replace(old_motion, new_motion)
    print('motion.div replaced')
else:
    print('motion.div NOT FOUND')
    idx = content.find('variants={spriteVariants}')
    print(repr(content[max(0,idx-50):idx+100]))

open('src/components/BossTauntEntrance.tsx', 'w', encoding='utf-8').write(content)
print('saved')
