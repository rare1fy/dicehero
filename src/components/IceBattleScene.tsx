/**
 * IceBattleScene — 冰封山脉场景
 * 银白冰山 / 极光天空 / 冰天雪地 / 暴风雪粒子
 * 普通战：冷白开阔雪原 | Boss战：暴风雪黑云压顶
 */
import React, { useMemo } from 'react';

function seededRandom(seed: number) {
  let s = seed;
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
}

const Stars: React.FC = React.memo(() => {
  const stars = useMemo(() => {
    const rng = seededRandom(63);
    return Array.from({ length: 30 }, () => ({
      x: rng() * 100, y: rng() * 35, size: 1,
      brightness: 0.3 + rng() * 0.5, d: rng() * 6,
    }));
  }, []);
  return (
    <svg className="absolute inset-0 w-full h-full" style={{ imageRendering: 'pixelated' as any }}>
      {stars.map((s, i) => (
        <rect key={i} x={`${s.x}%`} y={`${s.y}%`} width={s.size} height={s.size}
          fill={`rgba(220,230,255,${s.brightness})`} className="animate-star-twinkle"
          style={{ animationDelay: `${s.d}s` }} />
      ))}
    </svg>
  );
});

const SnowParticles: React.FC<{ heavy?: boolean }> = React.memo(({ heavy = false }) => {
  const flakes = useMemo(() => {
    const rng = seededRandom(44);
    const count = heavy ? 30 : 16;
    return Array.from({ length: count }, () => ({
      x: rng() * 100, delay: rng() * 8, dur: heavy ? (2 + rng() * 3) : (4 + rng() * 6),
      size: heavy ? (1 + (rng() > 0.5 ? 1 : 0) + (rng() > 0.8 ? 1 : 0)) : (1 + (rng() > 0.7 ? 1 : 0)),
    }));
  }, [heavy]);
  return (<>
    {flakes.map((f, i) => (
      <div key={i} className="absolute pointer-events-none animate-snow-fall" style={{
        left: `${f.x}%`, top: '-2%', width: f.size, height: f.size,
        background: heavy ? 'rgba(230,240,255,0.85)' : 'rgba(210,225,245,0.7)', borderRadius: '1px',
        animationDelay: `${f.delay}s`, animationDuration: `${f.dur}s`, zIndex: 2,
      }} />
    ))}
  </>);
});

const IceBattleScene: React.FC<{ isBoss?: boolean }> = ({ isBoss = false }) => (
  <div className="absolute inset-0 overflow-hidden" style={{ background: isBoss ? '#101828' : '#1a2438', zIndex: 0, isolation: 'isolate' }}>
    {/* 天空 — 普通：灰蓝白，Boss：暗沉风暴天 */}
    <div className="absolute inset-0" style={{
      background: isBoss
        ? 'linear-gradient(to bottom, #0c1018 0%, #141c28 15%, #1a2438 30%, #202c40 45%, #1a2438 60%, #141c30 100%)'
        : 'linear-gradient(to bottom, #1c2840 0%, #283848 15%, #304858 30%, #385868 45%, #2a4050 60%, #203040 100%)',
    }} />
    {!isBoss && <Stars />}
    {/* 极光 — 普通才有（Boss时暴风雪遮蔽） */}
    {!isBoss && (
      <div className="absolute pointer-events-none" style={{
        top: '3%', left: '10%', width: '80%', height: '22%',
        background: 'linear-gradient(90deg, transparent, rgba(80,200,180,0.06), rgba(100,160,240,0.08), rgba(120,220,200,0.06), rgba(80,140,240,0.05), transparent)',
        zIndex: 1, filter: 'blur(3px)',
      }} />
    )}
    {/* Boss：暴风雪云层 */}
    {isBoss && (<>
      <div className="absolute pointer-events-none" style={{
        top: 0, left: 0, right: 0, height: '35%',
        background: 'linear-gradient(to bottom, rgba(20,28,40,0.95) 0%, rgba(30,40,55,0.7) 50%, transparent 100%)',
        zIndex: 1,
      }} />
      <div className="absolute pointer-events-none animate-boss-aurora-pulse" style={{
        top: '5%', left: '5%', width: '90%', height: '20%',
        background: 'linear-gradient(90deg, transparent, rgba(140,180,220,0.04), rgba(100,140,200,0.06), rgba(140,180,220,0.04), transparent)',
        zIndex: 1, filter: 'blur(4px)',
      }} />
    </>)}
    {/* 银白冰山远景 */}
    <svg className="absolute w-full pointer-events-none"
      style={{ bottom: '50%', height: '30%', imageRendering: 'pixelated' as any }}
      viewBox="0 0 320 100" preserveAspectRatio="none">
      {/* 远山 — 银白 */}
      <polygon points="0,100 0,55 20,40 40,50 60,25 80,38 100,15 120,30 140,20 160,35 180,10 200,28 220,40 240,22 260,35 280,45 300,28 320,40 320,100" fill={isBoss ? '#2a3448' : '#485870'} />
      {/* 中山 */}
      <polygon points="0,100 0,70 15,62 35,55 55,42 75,52 95,35 115,45 135,30 155,42 175,25 195,38 215,48 235,35 255,45 275,55 295,40 315,50 320,45 320,100" fill={isBoss ? '#222c3c' : '#3a4c60'} />
      {/* 冰山顶部高光 */}
      <rect x="95" y="16" width="14" height="2" fill={isBoss ? 'rgba(180,200,220,0.12)' : 'rgba(200,220,240,0.25)'} />
      <rect x="175" y="12" width="12" height="2" fill={isBoss ? 'rgba(180,200,220,0.1)' : 'rgba(200,220,240,0.2)'} />
      <rect x="55" y="28" width="10" height="2" fill={isBoss ? 'rgba(180,200,220,0.08)' : 'rgba(200,220,240,0.18)'} />
      <rect x="238" y="24" width="8" height="2" fill={isBoss ? 'rgba(180,200,220,0.08)' : 'rgba(200,220,240,0.15)'} />
      {/* 近山丘 */}
      <polygon points="0,100 0,85 20,78 40,82 60,72 80,78 100,68 120,75 140,65 160,72 180,66 200,74 220,78 240,70 260,76 280,82 300,72 320,78 320,100" fill={isBoss ? '#1a2430' : '#2c3c50'} />
    </svg>
    {/* 雪松树线 */}
    <svg className="absolute w-full pointer-events-none"
      style={{ bottom: '50%', height: '12%', zIndex: 2, imageRendering: 'pixelated' as any }}
      viewBox="0 0 320 40" preserveAspectRatio="none">
      <polygon
        points="0,40 0,22 4,18 8,10 12,16 16,6 20,14 24,18 28,8 32,14 36,20 40,10 44,16 48,6 52,14 56,18 60,8 64,14 68,20 72,10 76,16 80,6 84,14 88,18 92,8 96,14 100,20 104,10 108,16 112,6 116,14 120,18 124,8 128,14 132,20 136,10 140,16 144,6 148,14 152,18 156,8 160,14 164,20 168,10 172,16 176,6 180,14 184,18 188,8 192,14 196,20 200,10 204,16 208,6 212,14 216,18 220,8 224,14 228,20 232,10 236,16 240,6 244,14 248,18 252,8 256,14 260,20 264,10 268,16 272,6 276,14 280,18 284,8 288,14 292,20 296,10 300,16 304,6 308,14 312,18 316,14 320,10 320,40"
        fill={isBoss ? '#182230' : '#1e3040'} />
    </svg>
    {/* 雪松 左 */}
    <div className="absolute pointer-events-none" style={{ left: '3%', bottom: '48%', zIndex: 2 }}>
      <svg width="36" height="80" viewBox="0 0 18 40" style={{ imageRendering: 'pixelated' as any }}>
        <rect x="8" y="24" width="2" height="16" fill="#3a3028" />
        <rect x="6" y="18" width="6" height="8" fill={isBoss ? '#1e2c38' : '#2a3c48'} />
        <rect x="4" y="12" width="10" height="8" fill={isBoss ? '#1a2834' : '#243844'} />
        <rect x="2" y="6" width="14" height="8" fill={isBoss ? '#1e2c38' : '#2a3c48'} />
        <rect x="4" y="2" width="10" height="6" fill={isBoss ? '#1a2834' : '#243844'} />
        <rect x="6" y="0" width="6" height="4" fill={isBoss ? '#1e2c38' : '#2a3c48'} />
        {/* 雪积 */}
        <rect x="3" y="6" width="6" height="2" fill="rgba(220,235,250,0.35)" />
        <rect x="5" y="12" width="8" height="2" fill="rgba(220,235,250,0.3)" />
        <rect x="4" y="18" width="5" height="1" fill="rgba(220,235,250,0.25)" />
      </svg>
    </div>
    {/* 雪松 右 */}
    <div className="absolute pointer-events-none" style={{ right: '5%', bottom: '48%', zIndex: 2, transform: 'scaleX(-1)' }}>
      <svg width="30" height="65" viewBox="0 0 18 40" style={{ imageRendering: 'pixelated' as any }}>
        <rect x="8" y="24" width="2" height="16" fill="#3a3028" />
        <rect x="5" y="16" width="8" height="10" fill={isBoss ? '#1e2c38' : '#2a3c48'} />
        <rect x="3" y="8" width="12" height="10" fill={isBoss ? '#1a2834' : '#243844'} />
        <rect x="5" y="2" width="8" height="8" fill={isBoss ? '#1e2c38' : '#2a3c48'} />
        <rect x="7" y="0" width="4" height="4" fill={isBoss ? '#1a2834' : '#243844'} />
        <rect x="4" y="8" width="6" height="2" fill="rgba(220,235,250,0.3)" />
      </svg>
    </div>
    {/* 透视雪地地面 — 白色系 */}
    <div className="absolute left-0 right-0 pointer-events-none" style={{ top: '48%', bottom: 0, zIndex: 1 }}>
      <div style={{ width: '100%', height: '100%', perspective: '400px', perspectiveOrigin: '50% 0%', overflow: 'hidden' }}>
        <div style={{ width: '100%', height: '100%', transform: 'rotateX(35deg)', transformOrigin: 'top center' }}>
          <svg className="w-full h-full" viewBox="0 0 320 200" preserveAspectRatio="none" style={{ imageRendering: 'pixelated' as any }}>
            {/* 基底 — 雪白色 */}
            <rect x="0" y="0" width="320" height="200" fill={isBoss ? '#28354a' : '#4a5c70'} />
            {/* 雪地条纹 */}
            <rect x="0" y="0" width="320" height="8" fill={isBoss ? '#2c3850' : '#506880'} />
            <rect x="0" y="14" width="320" height="10" fill={isBoss ? '#243044' : '#445868'} />
            <rect x="0" y="32" width="320" height="14" fill={isBoss ? '#2c3850' : '#506880'} />
            <rect x="0" y="58" width="320" height="18" fill={isBoss ? '#243044' : '#445868'} />
            <rect x="0" y="90" width="320" height="24" fill={isBoss ? '#283448' : '#4c6478'} />
            <rect x="0" y="130" width="320" height="30" fill={isBoss ? '#202c3c' : '#3c5060'} />
            {/* 冰面路径 — 偏白反光 */}
            <polygon points="140,0 180,0 230,200 90,200" fill={isBoss ? 'rgba(60,80,110,0.3)' : 'rgba(100,140,180,0.25)'} />
            <polygon points="148,0 172,0 210,200 110,200" fill={isBoss ? 'rgba(70,100,140,0.2)' : 'rgba(120,160,200,0.18)'} />
            {/* 冰面反光高光 */}
            <rect x="150" y="12" width="22" height="2" fill={isBoss ? 'rgba(160,190,220,0.12)' : 'rgba(200,220,240,0.25)'} />
            <rect x="142" y="45" width="38" height="2" fill={isBoss ? 'rgba(160,190,220,0.1)' : 'rgba(200,220,240,0.2)'} />
            <rect x="128" y="90" width="64" height="3" fill={isBoss ? 'rgba(160,190,220,0.08)' : 'rgba(200,220,240,0.15)'} />
            {/* 雪堆 */}
            <ellipse cx="55" cy="35" rx="18" ry="5" fill={isBoss ? 'rgba(180,200,220,0.08)' : 'rgba(220,235,250,0.15)'} />
            <ellipse cx="265" cy="70" rx="22" ry="6" fill={isBoss ? 'rgba(180,200,220,0.07)' : 'rgba(220,235,250,0.12)'} />
            <ellipse cx="75" cy="130" rx="26" ry="7" fill={isBoss ? 'rgba(180,200,220,0.06)' : 'rgba(220,235,250,0.1)'} />
          </svg>
        </div>
      </div>
      {/* 弧形地平线 */}
      <svg className="absolute w-full pointer-events-none" style={{ top: -8, left: 0, height: 16 }}
        viewBox="0 0 320 16" preserveAspectRatio="none">
        <path d="M0,16 L0,10 C60,4 120,2 160,3 C200,2 260,4 320,10 L320,16 Z" fill={isBoss ? '#28354a' : '#4a5c70'} />
      </svg>
    </div>
    <SnowParticles heavy={isBoss} />
    {/* 暗角 — Boss更收窄 */}
    <div className="absolute inset-0 pointer-events-none" style={{
      background: isBoss
        ? 'radial-gradient(ellipse at 50% 45%, transparent 10%, rgba(10,16,24,0.2) 30%, rgba(8,12,20,0.5) 55%, rgba(6,10,18,0.85) 100%)'
        : 'radial-gradient(ellipse at 50% 45%, transparent 20%, rgba(16,24,36,0.15) 45%, rgba(12,18,28,0.35) 65%, rgba(8,14,22,0.65) 100%)',
      zIndex: 2,
    }} />
    {isBoss && (
      <div className="absolute inset-0 pointer-events-none" style={{
        boxShadow: 'inset 0 0 80px rgba(80,140,220,0.08), inset 0 0 160px rgba(40,80,160,0.04)',
        zIndex: 2,
      }} />
    )}
  </div>
);

export default IceBattleScene;
