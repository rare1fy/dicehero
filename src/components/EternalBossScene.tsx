/**
 * EternalBossScene — 永恒之巅·神圣神殿
 * 明亮天穹 / 金白云海 / 浮空神殿 / 圣光光柱 / 白色大理石地面
 * 普通战：神圣开阔明亮 | Boss战：天降审判之光
 */
import React, { useMemo } from 'react';

function seededRandom(seed: number) {
  let s = seed;
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
}

const HolyStars: React.FC = React.memo(() => {
  const stars = useMemo(() => {
    const rng = seededRandom(123);
    return Array.from({ length: 50 }, () => ({
      x: rng() * 100, y: rng() * 40,
      size: rng() > 0.85 ? 2 : 1,
      brightness: 0.4 + rng() * 0.6, d: rng() * 6,
    }));
  }, []);
  return (
    <svg className="absolute inset-0 w-full h-full" style={{ imageRendering: 'pixelated' as any }}>
      {stars.map((s, i) => (
        <rect key={i} x={`${s.x}%`} y={`${s.y}%`} width={s.size} height={s.size}
          fill={`rgba(255,248,220,${s.brightness})`} className="animate-star-twinkle"
          style={{ animationDelay: `${s.d}s` }} />
      ))}
    </svg>
  );
});

const GoldParticles: React.FC<{ intense?: boolean }> = React.memo(({ intense = false }) => {
  const particles = useMemo(() => {
    const rng = seededRandom(88);
    const count = intense ? 18 : 10;
    return Array.from({ length: count }, () => ({
      x: 5 + rng() * 90, y: 10 + rng() * 60,
      delay: rng() * 8, dur: 3 + rng() * 5, size: rng() > 0.5 ? 3 : 2,
    }));
  }, [intense]);
  return (<>
    {particles.map((p, i) => (
      <div key={i} className="absolute pointer-events-none animate-firefly" style={{
        left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size,
        background: i % 3 === 0 ? '#f0e080' : i % 3 === 1 ? '#e8d060' : '#fff8d0',
        boxShadow: `0 0 ${p.size + 5}px rgba(255,240,140,0.5)`,
        animationDelay: `${p.delay}s`, animationDuration: `${p.dur}s`, zIndex: 2,
      }} />
    ))}
  </>);
});

const EternalBossScene: React.FC<{ isBoss?: boolean }> = ({ isBoss = false }) => (
  <div className="absolute inset-0 overflow-hidden" style={{ background: isBoss ? '#1a1820' : '#342e50', zIndex: 0, isolation: 'isolate' }}>
    {/* 天空 — 普通：明亮的暖紫金渐变，Boss：暗沉+裂隙光 */}
    <div className="absolute inset-0" style={{
      background: isBoss
        ? 'linear-gradient(to bottom, #0e0c18 0%, #181628 15%, #201e30 30%, #282438 45%, #221e2c 60%, #1a1620 100%)'
        : 'linear-gradient(to bottom, #282050 0%, #342860 15%, #403470 30%, #4a3c78 40%, #504480 50%, #463a70 100%)',
    }} />
    <HolyStars />

    {/* 金色云海/光辉层 — 普通场景的明亮来源 */}
    <div className="absolute pointer-events-none" style={{
      top: '8%', left: '5%', width: '90%', height: '25%',
      background: isBoss
        ? 'radial-gradient(ellipse at 50% 60%, rgba(240,220,120,0.06) 0%, rgba(200,180,80,0.03) 40%, transparent 70%)'
        : 'radial-gradient(ellipse at 50% 60%, rgba(255,240,160,0.18) 0%, rgba(240,220,120,0.08) 40%, transparent 60%)',
      zIndex: 1,
    }} />
    {/* 第二层暖色光晕 */}
    <div className="absolute pointer-events-none" style={{
      top: '0%', left: '25%', width: '50%', height: '35%',
      background: isBoss
        ? 'radial-gradient(ellipse at 50% 30%, rgba(200,180,100,0.04) 0%, transparent 60%)'
        : 'radial-gradient(ellipse at 50% 30%, rgba(255,245,200,0.12) 0%, transparent 50%)',
      zIndex: 1,
    }} />

    {/* 远景浮空神殿 — 金白建筑 */}
    <svg className="absolute w-full pointer-events-none"
      style={{ bottom: '50%', height: '28%', imageRendering: 'pixelated' as any }}
      viewBox="0 0 320 90" preserveAspectRatio="none">
      {/* 浮空石柱 — 左 (白金) */}
      <rect x="35" y="28" width="14" height="62" fill={isBoss ? '#2a2440' : '#585080'} />
      <rect x="33" y="24" width="18" height="6" fill={isBoss ? '#342c4a' : '#686090'} />
      <rect x="37" y="30" width="3" height="60" fill={isBoss ? '#342c50' : '#6a6090'} />
      <rect x="35" y="52" width="14" height="2" fill={isBoss ? '#3a3255' : '#787098'} />
      {/* 柱顶金色装饰 */}
      <rect x="37" y="24" width="10" height="2" fill={isBoss ? 'rgba(220,200,100,0.2)' : 'rgba(255,240,160,0.45)'} />
      {/* 浮空石柱 — 右 */}
      <rect x="271" y="32" width="14" height="58" fill={isBoss ? '#2a2440' : '#585080'} />
      <rect x="269" y="28" width="18" height="6" fill={isBoss ? '#342c4a' : '#686090'} />
      <rect x="273" y="34" width="3" height="56" fill={isBoss ? '#342c50' : '#6a6090'} />
      <rect x="271" y="55" width="14" height="2" fill={isBoss ? '#3a3255' : '#787098'} />
      <rect x="273" y="28" width="10" height="2" fill={isBoss ? 'rgba(220,200,100,0.2)' : 'rgba(255,240,160,0.45)'} />
      {/* 中央神殿拱门 — 更大更亮 */}
      <rect x="125" y="16" width="70" height="74" fill={isBoss ? '#222040' : '#4c4478'} />
      <rect x="130" y="18" width="60" height="70" fill={isBoss ? '#1a1830' : '#3c3668'} />
      <rect x="125" y="14" width="70" height="4" fill={isBoss ? '#383060' : '#686098'} />
      <rect x="122" y="12" width="76" height="4" fill={isBoss ? '#403868' : '#7870a0'} />
      {/* 拱门内神圣光 */}
      <rect x="140" y="26" width="40" height="62" fill={isBoss ? 'rgba(240,220,120,0.06)' : 'rgba(255,245,180,0.18)'} />
      <rect x="150" y="24" width="20" height="64" fill={isBoss ? 'rgba(255,240,140,0.04)' : 'rgba(255,250,200,0.12)'} />
      {/* 台阶 — 白金 */}
      <rect x="95" y="86" width="130" height="4" fill={isBoss ? '#302a4a' : '#5c5488'} />
      <rect x="85" y="88" width="150" height="2" fill={isBoss ? '#282244' : '#504880'} />
    </svg>

    {/* 神圣光柱 — 中央 */}
    <div className={`absolute pointer-events-none ${isBoss ? 'animate-boss-holy-pulse' : ''}`} style={{
      left: isBoss ? '35%' : '38%', width: isBoss ? '30%' : '24%', top: '0%', bottom: isBoss ? '15%' : '25%',
      background: isBoss
        ? 'linear-gradient(to bottom, rgba(255,240,140,0.08) 0%, rgba(240,220,120,0.16) 40%, rgba(255,240,140,0.06) 80%, transparent 100%)'
        : 'linear-gradient(to bottom, rgba(255,245,180,0.06) 0%, rgba(255,240,160,0.12) 40%, rgba(255,245,180,0.04) 80%, transparent 100%)',
      zIndex: 1,
    }} />
    {/* 左右副光柱 */}
    <div className={`absolute pointer-events-none ${isBoss ? 'animate-boss-holy-pulse' : ''}`} style={{
      left: '12%', width: '8%', top: '8%', bottom: '45%',
      background: isBoss
        ? 'linear-gradient(to bottom, rgba(240,220,120,0.04) 0%, rgba(220,200,100,0.08) 50%, transparent 100%)'
        : 'linear-gradient(to bottom, rgba(255,240,160,0.03) 0%, rgba(255,235,140,0.06) 50%, transparent 100%)',
      zIndex: 1, animationDelay: '0.8s',
    }} />
    <div className={`absolute pointer-events-none ${isBoss ? 'animate-boss-holy-pulse' : ''}`} style={{
      right: '12%', width: '8%', top: '8%', bottom: '45%',
      background: isBoss
        ? 'linear-gradient(to bottom, rgba(240,220,120,0.04) 0%, rgba(220,200,100,0.08) 50%, transparent 100%)'
        : 'linear-gradient(to bottom, rgba(255,240,160,0.03) 0%, rgba(255,235,140,0.06) 50%, transparent 100%)',
      zIndex: 1, animationDelay: '1.6s',
    }} />
    {/* Boss额外：天顶裂隙光线 */}
    {isBoss && (
      <div className="absolute pointer-events-none animate-boss-holy-pulse" style={{
        left: '20%', width: '60%', top: '0%', height: '50%',
        background: 'radial-gradient(ellipse at 50% 0%, rgba(255,240,140,0.1) 0%, rgba(240,220,100,0.04) 30%, transparent 60%)',
        zIndex: 1, animationDelay: '0.4s',
      }} />
    )}

    {/* 透视大理石地面 — 淡金白色 */}
    <div className="absolute left-0 right-0 pointer-events-none" style={{ top: '48%', bottom: 0, zIndex: 1 }}>
      <div style={{ width: '100%', height: '100%', perspective: '400px', perspectiveOrigin: '50% 0%', overflow: 'hidden' }}>
        <div style={{ width: '100%', height: '100%', transform: 'rotateX(35deg)', transformOrigin: 'top center' }}>
          <svg className="w-full h-full" viewBox="0 0 320 200" preserveAspectRatio="none" style={{ imageRendering: 'pixelated' as any }}>
            {/* 基底 — 暖灰白大理石 */}
            <rect x="0" y="0" width="320" height="200" fill={isBoss ? '#201c30' : '#484070'} />
            <rect x="0" y="0" width="320" height="6" fill={isBoss ? '#242038' : '#504878'} />
            <rect x="0" y="12" width="320" height="8" fill={isBoss ? '#1c1a28' : '#3c3660'} />
            <rect x="0" y="28" width="320" height="12" fill={isBoss ? '#242038' : '#504878'} />
            <rect x="0" y="50" width="320" height="16" fill={isBoss ? '#1c1a28' : '#3c3660'} />
            <rect x="0" y="80" width="320" height="22" fill={isBoss ? '#242038' : '#504878'} />
            <rect x="0" y="120" width="320" height="28" fill={isBoss ? '#1c1a28' : '#3c3660'} />
            <rect x="0" y="165" width="320" height="35" fill={isBoss ? '#181624' : '#342e58'} />
            {/* 中央金色光道 */}
            <polygon points="140,0 180,0 230,200 90,200" fill={isBoss ? 'rgba(240,220,100,0.04)' : 'rgba(255,240,160,0.06)'} />
            <polygon points="150,0 170,0 210,200 110,200" fill={isBoss ? 'rgba(255,240,140,0.03)' : 'rgba(255,245,180,0.04)'} />
            {/* 金色符文纹样 */}
            <rect x="146" y="18" width="28" height="2" fill={isBoss ? 'rgba(240,220,100,0.1)' : 'rgba(255,240,160,0.22)'} />
            <rect x="138" y="55" width="44" height="2" fill={isBoss ? 'rgba(240,220,100,0.08)' : 'rgba(255,240,160,0.16)'} />
            <rect x="126" y="100" width="68" height="2" fill={isBoss ? 'rgba(240,220,100,0.06)' : 'rgba(255,240,160,0.12)'} />
            <rect x="115" y="155" width="90" height="3" fill={isBoss ? 'rgba(240,220,100,0.04)' : 'rgba(255,240,160,0.08)'} />
            {/* 大理石砖缝 */}
            <rect x="45" y="25" width="10" height="2" fill={isBoss ? '#2a2642' : '#5a5488'} />
            <rect x="210" y="50" width="12" height="2" fill={isBoss ? '#2a2642' : '#5a5488'} />
            <rect x="75" y="88" width="14" height="3" fill={isBoss ? '#262240' : '#544e82'} />
            <rect x="245" y="135" width="16" height="3" fill={isBoss ? '#262240' : '#544e82'} />
          </svg>
        </div>
      </div>
      {/* 弧形地平线 */}
      <svg className="absolute w-full pointer-events-none" style={{ top: -8, left: 0, height: 16 }}
        viewBox="0 0 320 16" preserveAspectRatio="none">
        <path d="M0,16 L0,10 C60,4 120,2 160,3 C200,2 260,4 320,10 L320,16 Z" fill={isBoss ? '#201c30' : '#484070'} />
      </svg>
    </div>
    <GoldParticles intense={isBoss} />
    {/* 暗角 — 普通场景非常开阔，Boss暗沉 */}
    <div className="absolute inset-0 pointer-events-none" style={{
      background: isBoss
        ? 'radial-gradient(ellipse at 50% 45%, transparent 12%, rgba(14,10,20,0.2) 35%, rgba(10,8,16,0.5) 58%, rgba(6,4,12,0.85) 100%)'
        : 'radial-gradient(ellipse at 50% 45%, transparent 28%, rgba(30,24,48,0.08) 50%, rgba(20,16,36,0.2) 70%, rgba(14,10,28,0.45) 100%)',
      zIndex: 2,
    }} />
    {/* Boss时金色边框光晕 */}
    {isBoss && (
      <div className="absolute inset-0 pointer-events-none" style={{
        boxShadow: 'inset 0 0 80px rgba(255,240,120,0.06), inset 0 0 160px rgba(220,200,80,0.03)',
        zIndex: 2,
      }} />
    )}
  </div>
);

export default EternalBossScene;
