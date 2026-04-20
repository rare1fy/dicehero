/**
 * ShadowBattleScene — 暗影要塞场景
 * 普通战：哥特尖塔 / 紫色迷雾 / 魔法符文地面
 * Boss战：魔法阵涡旋 / 紫色能量柱 / 裂隙天空 / 符文爆发
 */
import React, { useMemo } from 'react';

function seededRandom(seed: number) {
  let s = seed;
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
}

const Stars: React.FC = React.memo(() => {
  const stars = useMemo(() => {
    const rng = seededRandom(71);
    return Array.from({ length: 25 }, () => ({
      x: rng() * 100, y: rng() * 35, size: 1,
      brightness: 0.15 + rng() * 0.35, d: rng() * 6,
    }));
  }, []);
  return (
    <svg className="absolute inset-0 w-full h-full" style={{ imageRendering: 'pixelated' }}>
      {stars.map((s, i) => (
        <rect key={i} x={`${s.x}%`} y={`${s.y}%`} width={s.size} height={s.size}
          fill={`rgba(180,160,220,${s.brightness})`} className="animate-star-twinkle"
          style={{ animationDelay: `${s.d}s` }} />
      ))}
    </svg>
  );
});

const ShadowParticles: React.FC<{ intense?: boolean }> = React.memo(({ intense = false }) => {
  const particles = useMemo(() => {
    const rng = seededRandom(33);
    const count = intense ? 18 : 10;
    return Array.from({ length: count }, () => ({
      x: 10 + rng() * 80, y: intense ? (15 + rng() * 60) : (25 + rng() * 50),
      delay: rng() * 8, dur: intense ? (3 + rng() * 4) : (4 + rng() * 5),
      size: intense ? (2 + (rng() > 0.5 ? 1 : 0) + (rng() > 0.8 ? 1 : 0)) : (2 + (rng() > 0.7 ? 1 : 0)),
    }));
  }, [intense]);
  return (<>
    {particles.map((p, i) => (
      <div key={i} className="absolute pointer-events-none animate-firefly" style={{
        left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size,
        background: intense
          ? (i % 3 === 0 ? '#c060f0' : i % 3 === 1 ? '#9040d0' : '#e080ff')
          : (i % 2 === 0 ? '#a050e0' : '#7030b0'),
        boxShadow: `0 0 ${p.size + (intense ? 5 : 3)}px rgba(160,80,240,${intense ? 0.7 : 0.5})`,
        animationDelay: `${p.delay}s`, animationDuration: `${p.dur}s`, zIndex: 2,
      }} />
    ))}
  </>);
});

const ShadowBattleScene: React.FC<{ isBoss?: boolean }> = ({ isBoss = false }) => (
  <div className="absolute inset-0 overflow-hidden" style={{ background: isBoss ? '#0a0410' : '#08040e', zIndex: 0, isolation: 'isolate' }}>
    {isBoss ? (<>
      {/* ===== BOSS场景：魔法阵涡旋 + 裂隙天空 ===== */}
      {/* 天空 — 深紫+裂隙光线 */}
      <div className="absolute inset-0" style={{
        background: 'linear-gradient(to bottom, #06020c 0%, #0c0616 15%, #120a22 30%, #1a0e2e 45%, #140a22 55%, #0c0614 100%)',
      }} />
      <Stars />
      {/* 天空紫色裂隙光 */}
      <div className="absolute pointer-events-none" style={{
        top: '0%', left: '30%', width: '40%', height: '35%',
        background: 'radial-gradient(ellipse at 50% 30%, rgba(140,60,220,0.1) 0%, rgba(100,30,180,0.04) 40%, transparent 65%)',
        zIndex: 1,
      }} />
      {/* 紫色能量涡旋光环（天空中） */}
      <div className="absolute pointer-events-none animate-boss-shadow-pulse" style={{
        top: '5%', left: '20%', width: '60%', height: '30%',
        background: 'conic-gradient(from 0deg, transparent, rgba(140,60,220,0.06), transparent, rgba(100,40,200,0.08), transparent, rgba(160,80,240,0.05), transparent)',
        borderRadius: '50%', zIndex: 1, filter: 'blur(3px)',
      }} />
      {/* 巨大紫色能量柱（中央） */}
      <div className="absolute pointer-events-none animate-boss-shadow-pulse" style={{
        left: '40%', width: '20%', top: '0%', bottom: '20%',
        background: 'linear-gradient(to bottom, rgba(160,80,240,0.08) 0%, rgba(140,60,220,0.14) 40%, rgba(120,40,200,0.06) 80%, transparent 100%)',
        zIndex: 1,
      }} />
      {/* 哥特要塞剪影（更大更暗） */}
      <svg className="absolute w-full pointer-events-none"
        style={{ bottom: '50%', height: '35%', imageRendering: 'pixelated' }}
        viewBox="0 0 320 120" preserveAspectRatio="none">
        <rect x="0" y="80" width="320" height="40" fill="#0a0616" />
        <rect x="0" y="78" width="320" height="4" fill="#120a1e" />
        {Array.from({ length: 16 }).map((_, i) => (
          <rect key={i} x={i * 20 + 2} y="68" width="12" height="12" fill="#0e0818" />
        ))}
        <rect x="25" y="15" width="20" height="105" fill="#120a1e" />
        <rect x="20" y="10" width="30" height="8" fill="#180e28" />
        <rect x="30" y="2" width="10" height="12" fill="#120a1e" />
        <rect x="33" y="0" width="4" height="6" fill="#1e1230" />
        <rect x="275" y="20" width="20" height="100" fill="#120a1e" />
        <rect x="270" y="15" width="30" height="8" fill="#180e28" />
        <rect x="280" y="6" width="10" height="14" fill="#120a1e" />
        <rect x="283" y="2" width="4" height="8" fill="#1e1230" />
        {/* 中央巨门 — 紫光大爆发 */}
        <rect x="130" y="30" width="60" height="90" fill="#080414" />
        <rect x="128" y="26" width="64" height="6" fill="#1a1028" />
        <rect x="140" y="40" width="40" height="78" fill="#060310" />
        {/* 门内紫色强光 */}
        <rect x="148" y="45" width="24" height="72" fill="rgba(140,60,220,0.15)" />
        <rect x="155" y="42" width="10" height="76" fill="rgba(160,80,240,0.1)" />
        {/* 窗户强光 */}
        <rect x="31" y="35" width="8" height="10" fill="rgba(160,80,240,0.25)" />
        <rect x="31" y="55" width="8" height="10" fill="rgba(140,60,220,0.2)" />
        <rect x="281" y="32" width="8" height="10" fill="rgba(160,80,240,0.25)" />
        <rect x="281" y="50" width="8" height="10" fill="rgba(140,60,220,0.2)" />
        <polygon points="0,120 0,95 30,85 60,92 90,78 120,88 140,80 160,75 180,80 200,88 220,78 250,85 280,80 310,88 320,82 320,120" fill="#060310" />
      </svg>
      {/* 透视地面 — 符文大放光芒 */}
      <div className="absolute left-0 right-0 pointer-events-none" style={{ top: '48%', bottom: 0, zIndex: 1 }}>
        <div style={{ width: '100%', height: '100%', perspective: '400px', perspectiveOrigin: '50% 0%', overflow: 'hidden' }}>
          <div style={{ width: '100%', height: '100%', transform: 'rotateX(35deg)', transformOrigin: 'top center' }}>
            <svg className="w-full h-full" viewBox="0 0 320 200" preserveAspectRatio="none" style={{ imageRendering: 'pixelated' }}>
              <rect x="0" y="0" width="320" height="200" fill="#0e0818" />
              <rect x="0" y="0" width="320" height="6" fill="#120c20" />
              <rect x="0" y="12" width="320" height="8" fill="#0a0614" />
              <rect x="0" y="28" width="320" height="12" fill="#120c20" />
              <rect x="0" y="50" width="320" height="16" fill="#0a0614" />
              <rect x="0" y="80" width="320" height="22" fill="#120c20" />
              <rect x="0" y="120" width="320" height="28" fill="#0a0614" />
              <rect x="0" y="165" width="320" height="35" fill="#080512" />
              {/* 紫色路 */}
              <polygon points="130,0 190,0 250,200 70,200" fill="rgba(40,18,60,0.45)" />
              <polygon points="142,0 178,0 225,200 95,200" fill="rgba(50,25,70,0.35)" />
              {/* 强烈符文光 */}
              <rect x="148" y="15" width="24" height="3" fill="rgba(160,80,240,0.2)" />
              <rect x="140" y="45" width="40" height="3" fill="rgba(160,80,240,0.16)" />
              <rect x="128" y="85" width="64" height="3" fill="rgba(140,60,220,0.12)" />
              <rect x="115" y="135" width="90" height="4" fill="rgba(140,60,220,0.1)" />
              {/* 交叉符文 */}
              <rect x="155" y="30" width="10" height="2" fill="rgba(200,120,255,0.15)" />
              <rect x="145" y="65" width="30" height="2" fill="rgba(200,120,255,0.12)" />
              <rect x="130" y="110" width="60" height="2" fill="rgba(200,120,255,0.08)" />
            </svg>
          </div>
        </div>
        <svg className="absolute w-full pointer-events-none" style={{ top: -8, left: 0, height: 16 }}
          viewBox="0 0 320 16" preserveAspectRatio="none">
          <path d="M0,16 L0,10 C60,4 120,2 160,3 C200,2 260,4 320,10 L320,16 Z" fill="#0e0818" />
        </svg>
      </div>
      <ShadowParticles intense />
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse at 50% 45%, transparent 8%, rgba(12,4,18,0.25) 30%, rgba(8,2,14,0.6) 55%, rgba(4,1,10,0.9) 100%)',
        zIndex: 2,
      }} />
      <div className="absolute inset-0 pointer-events-none" style={{
        boxShadow: 'inset 0 0 80px rgba(140,60,220,0.08), inset 0 0 160px rgba(100,30,180,0.04)',
        zIndex: 2,
      }} />
    </>) : (<>
      {/* ===== 普通场景：哥特城堡 + 紫雾 ===== */}
      <div className="absolute inset-0" style={{
        background: 'linear-gradient(to bottom, #04020a 0%, #080610 15%, #0c0818 30%, #100a20 45%, #0e0818 55%, #0a060e 100%)',
      }} />
      <Stars />
      <div className="absolute pointer-events-none" style={{
        top: '10%', left: '10%', width: '80%', height: '25%',
        background: 'radial-gradient(ellipse at 50% 50%, rgba(100,40,160,0.04) 0%, transparent 60%)',
        zIndex: 1,
      }} />
      <svg className="absolute w-full pointer-events-none"
        style={{ bottom: '50%', height: '32%', imageRendering: 'pixelated' }}
        viewBox="0 0 320 110" preserveAspectRatio="none">
        <rect x="0" y="70" width="320" height="40" fill="#0e0814" />
        <rect x="0" y="68" width="320" height="4" fill="#140c1c" />
        {Array.from({ length: 16 }).map((_, i) => (
          <rect key={i} x={i * 20 + 2} y="60" width="12" height="10" fill="#120a18" />
        ))}
        <rect x="30" y="20" width="16" height="90" fill="#140c1c" />
        <rect x="26" y="16" width="24" height="6" fill="#180e22" />
        <rect x="32" y="8" width="12" height="10" fill="#140c1c" />
        <rect x="34" y="4" width="8" height="6" fill="#180e22" />
        <rect x="36" y="0" width="4" height="6" fill="#1c1028" />
        <rect x="34" y="22" width="2" height="68" fill="#1c1228" />
        <rect x="270" y="25" width="16" height="85" fill="#140c1c" />
        <rect x="266" y="20" width="24" height="6" fill="#180e22" />
        <rect x="272" y="12" width="12" height="10" fill="#140c1c" />
        <rect x="274" y="6" width="8" height="8" fill="#180e22" />
        <rect x="276" y="2" width="4" height="6" fill="#1c1028" />
        <rect x="274" y="26" width="2" height="64" fill="#1c1228" />
        <rect x="140" y="40" width="40" height="70" fill="#0a0610" />
        <rect x="138" y="36" width="44" height="6" fill="#180e22" />
        <rect x="148" y="50" width="24" height="58" fill="#060410" />
        <rect x="155" y="55" width="10" height="50" fill="rgba(120,60,180,0.08)" />
        <rect x="36" y="40" width="4" height="6" fill="rgba(140,80,200,0.2)" />
        <rect x="36" y="55" width="4" height="6" fill="rgba(140,80,200,0.15)" />
        <rect x="276" y="38" width="4" height="6" fill="rgba(140,80,200,0.2)" />
        <rect x="276" y="52" width="4" height="6" fill="rgba(140,80,200,0.15)" />
        <polygon points="0,110 0,90 30,80 60,88 90,75 120,85 140,78 160,72 180,78 200,85 220,75 250,82 280,78 310,85 320,80 320,110" fill="#080410" />
      </svg>
      <svg className="absolute w-full pointer-events-none"
        style={{ bottom: '50%', height: '10%', zIndex: 2, imageRendering: 'pixelated' }}
        viewBox="0 0 320 30" preserveAspectRatio="none">
        <polygon
          points="0,30 0,20 5,16 10,8 15,14 20,6 25,12 30,18 40,10 50,6 60,14 70,18 80,8 90,14 100,6 110,12 120,18 130,8 140,14 150,6 160,12 170,18 180,8 190,14 200,6 210,12 220,18 230,8 240,14 250,6 260,12 270,18 280,8 290,14 300,6 310,12 320,8 320,30"
          fill="#0a0612" />
      </svg>
      <div className="absolute left-0 right-0 pointer-events-none" style={{ top: '48%', bottom: 0, zIndex: 1 }}>
        <div style={{ width: '100%', height: '100%', perspective: '400px', perspectiveOrigin: '50% 0%', overflow: 'hidden' }}>
          <div style={{ width: '100%', height: '100%', transform: 'rotateX(35deg)', transformOrigin: 'top center' }}>
            <svg className="w-full h-full" viewBox="0 0 320 200" preserveAspectRatio="none" style={{ imageRendering: 'pixelated' }}>
              <rect x="0" y="0" width="320" height="200" fill="#0c0814" />
              <rect x="0" y="0" width="320" height="6" fill="#100c1a" />
              <rect x="0" y="12" width="320" height="8" fill="#080612" />
              <rect x="0" y="28" width="320" height="12" fill="#100c1a" />
              <rect x="0" y="50" width="320" height="16" fill="#080612" />
              <rect x="0" y="80" width="320" height="22" fill="#100c1a" />
              <rect x="0" y="120" width="320" height="28" fill="#080612" />
              <rect x="0" y="165" width="320" height="35" fill="#060410" />
              <polygon points="140,0 180,0 230,200 90,200" fill="rgba(30,15,40,0.4)" />
              <polygon points="148,0 172,0 210,200 110,200" fill="rgba(40,20,55,0.3)" />
              <rect x="152" y="18" width="16" height="2" fill="rgba(140,80,200,0.12)" />
              <rect x="145" y="55" width="30" height="2" fill="rgba(140,80,200,0.1)" />
              <rect x="135" y="100" width="50" height="2" fill="rgba(140,80,200,0.08)" />
              <rect x="125" y="150" width="70" height="3" fill="rgba(140,80,200,0.06)" />
              <rect x="50" y="30" width="6" height="3" fill="#14101e" />
              <rect x="240" y="60" width="8" height="3" fill="#14101e" />
              <rect x="70" y="110" width="10" height="4" fill="#120e1a" />
              <rect x="260" y="150" width="12" height="4" fill="#120e1a" />
            </svg>
          </div>
        </div>
        <svg className="absolute w-full pointer-events-none" style={{ top: -8, left: 0, height: 16 }}
          viewBox="0 0 320 16" preserveAspectRatio="none">
          <path d="M0,16 L0,10 C60,4 120,2 160,3 C200,2 260,4 320,10 L320,16 Z" fill="#0c0814" />
        </svg>
      </div>
      <ShadowParticles />
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse at 50% 45%, transparent 15%, rgba(6,3,10,0.2) 40%, rgba(4,2,8,0.5) 65%, rgba(3,1,6,0.8) 100%)',
        zIndex: 2,
      }} />
    </>)}
  </div>
);

export default ShadowBattleScene;
