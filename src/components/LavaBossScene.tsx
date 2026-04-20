/**
 * LavaBossScene — 熔岩深渊场景
 * 普通战：远景火山 / 熔岩河 / 岩石柱
 * Boss战：火山大爆发 / 天空烈焰 / 岩浆泛滥 / 巨型火山口
 */
import React, { useMemo } from 'react';

function seededRandom(seed: number) {
  let s = seed;
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
}

const Stars: React.FC = React.memo(() => {
  const stars = useMemo(() => {
    const rng = seededRandom(99);
    return Array.from({ length: 15 }, () => ({
      x: rng() * 100, y: rng() * 25,
      size: 1, brightness: 0.15 + rng() * 0.25, d: rng() * 6,
    }));
  }, []);
  return (
    <svg className="absolute inset-0 w-full h-full" style={{ imageRendering: 'pixelated' }}>
      {stars.map((s, i) => (
        <rect key={i} x={`${s.x}%`} y={`${s.y}%`} width={s.size} height={s.size}
          fill={`rgba(255,180,140,${s.brightness})`} className="animate-star-twinkle"
          style={{ animationDelay: `${s.d}s` }} />
      ))}
    </svg>
  );
});

const EmberParticles: React.FC<{ intense?: boolean }> = React.memo(({ intense = false }) => {
  const embers = useMemo(() => {
    const rng = seededRandom(55);
    const count = intense ? 24 : 14;
    return Array.from({ length: count }, () => ({
      x: 5 + rng() * 90, y: intense ? (10 + rng() * 80) : (30 + rng() * 60),
      delay: rng() * 6, dur: intense ? (2 + rng() * 3) : (3 + rng() * 4),
      size: intense ? (2 + (rng() > 0.5 ? 2 : 0) + (rng() > 0.8 ? 2 : 0)) : (2 + (rng() > 0.7 ? 2 : 0)),
    }));
  }, [intense]);
  return (<>
    {embers.map((e, i) => (
      <div key={i} className="absolute pointer-events-none animate-firefly" style={{
        left: `${e.x}%`, top: `${e.y}%`, width: e.size, height: e.size,
        background: i % 3 === 0 ? '#f08030' : i % 3 === 1 ? '#e05020' : '#f0a040',
        boxShadow: `0 0 ${e.size + (intense ? 5 : 3)}px rgba(240,120,40,${intense ? 0.8 : 0.6})`,
        animationDelay: `${e.delay}s`, animationDuration: `${e.dur}s`, zIndex: 2,
        borderRadius: '1px',
      }} />
    ))}
  </>);
});

const LavaBossScene: React.FC<{ isBoss?: boolean }> = ({ isBoss = false }) => (
  <div className="absolute inset-0 overflow-hidden" style={{ background: isBoss ? '#1a0804' : '#120804', zIndex: 0, isolation: 'isolate' }}>
    {isBoss ? (<>
      {/* ===== BOSS场景：火山大爆发 ===== */}
      {/* 天空 — 烈焰映天，红橙色 */}
      <div className="absolute inset-0" style={{
        background: 'linear-gradient(to bottom, #140606 0%, #221008 12%, #301408 25%, #3c1a0a 38%, #30140a 50%, #241008 100%)',
      }} />
      {/* 天空火光映射 — 明显红色天幕 */}
      <div className="absolute pointer-events-none" style={{
        top: 0, left: '15%', width: '70%', height: '40%',
        background: 'radial-gradient(ellipse at 50% 80%, rgba(240,100,20,0.12) 0%, rgba(200,60,10,0.06) 40%, transparent 70%)',
        zIndex: 1,
      }} />
      {/* 爆发的火山 — 更大+喷射光 */}
      <svg className="absolute w-full pointer-events-none"
        style={{ bottom: '48%', height: '40%', imageRendering: 'pixelated' }}
        viewBox="0 0 320 140" preserveAspectRatio="none">
        {/* 主火山 — 更大 */}
        <polygon points="80,140 120,25 160,5 200,25 240,140" fill="#321c10" />
        <polygon points="125,25 160,8 195,25 160,20" fill="#442818" />
        {/* 火山口大爆发光 */}
        <rect x="140" y="4" width="40" height="10" fill="#f08030" opacity="0.7" />
        <rect x="146" y="2" width="28" height="8" fill="#f0a040" opacity="0.55" />
        <rect x="152" y="0" width="16" height="6" fill="#f0c060" opacity="0.4" />
        <rect x="156" y="-2" width="8" height="4" fill="#ffe080" opacity="0.3" />
        {/* 喷射光柱 */}
        <rect x="155" y="0" width="10" height="5" fill="rgba(255,200,80,0.2)" />
        {/* 侧山 */}
        <polygon points="0,140 0,70 30,50 60,65 90,55 120,140" fill="#241208" opacity="0.9" />
        <polygon points="200,140 240,55 270,42 300,48 320,38 320,140" fill="#241208" opacity="0.9" />
        {/* 近山 */}
        <polygon points="0,140 0,100 40,88 80,92 120,80 160,95 200,85 240,90 280,82 320,92 320,140" fill="#1a0c06" />
      </svg>
      {/* 岩石柱 — 更大 */}
      <div className="absolute pointer-events-none" style={{ left: '3%', bottom: '44%', zIndex: 2 }}>
        <svg width="36" height="100" viewBox="0 0 14 40" style={{ imageRendering: 'pixelated' }}>
          <rect x="2" y="0" width="10" height="40" fill="#2e1c12" />
          <rect x="0" y="4" width="14" height="4" fill="#261410" />
          <rect x="1" y="16" width="12" height="3" fill="#261410" />
          <rect x="5" y="0" width="3" height="40" fill="#382418" />
        </svg>
      </div>
      <div className="absolute pointer-events-none" style={{ right: '6%', bottom: '44%', zIndex: 2 }}>
        <svg width="30" height="80" viewBox="0 0 12 32" style={{ imageRendering: 'pixelated' }}>
          <rect x="2" y="0" width="8" height="32" fill="#2a1a12" />
          <rect x="0" y="6" width="12" height="3" fill="#221210" />
          <rect x="4" y="0" width="2" height="32" fill="#342018" />
        </svg>
      </div>
      {/* 熔岩地面 — 岩浆泛滥，更亮更红 */}
      <div className="absolute left-0 right-0 pointer-events-none" style={{ top: '48%', bottom: 0, zIndex: 1 }}>
        <div style={{ width: '100%', height: '100%', perspective: '400px', perspectiveOrigin: '50% 0%', overflow: 'hidden' }}>
          <div style={{ width: '100%', height: '100%', transform: 'rotateX(35deg)', transformOrigin: 'top center' }}>
            <svg className="w-full h-full" viewBox="0 0 320 200" preserveAspectRatio="none" style={{ imageRendering: 'pixelated' }}>
              <rect x="0" y="0" width="320" height="200" fill="#1e0c06" />
              <rect x="0" y="0" width="320" height="8" fill="#241008" />
              <rect x="0" y="14" width="320" height="10" fill="#1a0c06" />
              <rect x="0" y="32" width="320" height="14" fill="#241008" />
              <rect x="0" y="58" width="320" height="18" fill="#1a0c06" />
              <rect x="0" y="90" width="320" height="24" fill="#241008" />
              <rect x="0" y="130" width="320" height="30" fill="#1a0c06" />
              {/* 宽熔岩河 — Boss时更宽更亮 */}
              <polygon points="120,0 200,0 280,200 40,200" fill="#501c08" />
              <polygon points="135,0 185,0 250,200 70,200" fill="#702810" />
              {/* 岩浆光 — 更亮 */}
              <rect x="140" y="8" width="40" height="6" fill="#e06020" opacity="0.5" />
              <rect x="130" y="35" width="60" height="8" fill="#f08030" opacity="0.45" />
              <rect x="115" y="70" width="90" height="10" fill="#e06020" opacity="0.35" />
              <rect x="95" y="120" width="130" height="14" fill="#f0a040" opacity="0.3" />
              <rect x="70" y="165" width="180" height="18" fill="#e06020" opacity="0.25" />
            </svg>
          </div>
        </div>
        <svg className="absolute w-full pointer-events-none" style={{ top: -8, left: 0, height: 16 }}
          viewBox="0 0 320 16" preserveAspectRatio="none">
          <path d="M0,16 L0,10 C60,4 120,2 160,3 C200,2 260,4 320,10 L320,16 Z" fill="#1e0c06" />
          <path d="M120,3 C140,5 160,6 200,5 C220,4 240,3 240,3" stroke="#501c08" strokeWidth="3" fill="none" opacity="0.4" />
        </svg>
      </div>
      <EmberParticles intense />
      {/* 极暗暗角+底部热浪 */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse at 50% 45%, transparent 8%, rgba(20,4,2,0.2) 30%, rgba(14,2,1,0.55) 55%, rgba(8,1,0,0.88) 100%)',
        zIndex: 2,
      }} />
      <div className="absolute bottom-0 left-0 right-0 pointer-events-none animate-boss-lava-pulse" style={{
        height: '45%',
        background: 'linear-gradient(to top, rgba(240,100,30,0.15) 0%, rgba(200,60,10,0.06) 40%, transparent 100%)',
        zIndex: 2,
      }} />
      <div className="absolute inset-0 pointer-events-none" style={{
        boxShadow: 'inset 0 0 80px rgba(240,100,20,0.1), inset 0 0 160px rgba(200,60,10,0.05)',
        zIndex: 2,
      }} />
    </>) : (<>
      {/* ===== 普通场景：远景火山+熔岩河 ===== */}
      <div className="absolute inset-0" style={{
        background: 'linear-gradient(to bottom, #0a0404 0%, #140808 15%, #1e0c06 30%, #281008 45%, #201008 55%, #180a04 100%)',
      }} />
      <Stars />
      <svg className="absolute w-full pointer-events-none"
        style={{ bottom: '48%', height: '35%', imageRendering: 'pixelated' }}
        viewBox="0 0 320 120" preserveAspectRatio="none">
        <polygon points="100,120 130,30 160,10 190,30 220,120" fill="#2a1810" />
        <polygon points="135,30 160,14 185,30 160,26" fill="#3a2018" />
        <rect x="148" y="12" width="24" height="6" fill="#e06020" opacity="0.6" />
        <rect x="152" y="10" width="16" height="4" fill="#f0a040" opacity="0.4" />
        <rect x="156" y="8" width="8" height="4" fill="#f0c060" opacity="0.3" />
        <polygon points="0,120 0,70 30,50 60,65 90,55 120,120" fill="#1e1008" opacity="0.8" />
        <polygon points="200,120 240,60 270,50 300,55 320,45 320,120" fill="#1e1008" opacity="0.8" />
        <polygon points="0,120 0,90 40,80 80,85 120,75 160,90 200,80 240,85 280,78 320,88 320,120" fill="#140a06" />
      </svg>
      <svg className="absolute w-full pointer-events-none"
        style={{ bottom: '48%', height: '10%', zIndex: 2, imageRendering: 'pixelated' }}
        viewBox="0 0 320 30" preserveAspectRatio="none">
        <polygon
          points="0,30 0,18 5,14 10,8 15,12 20,6 25,14 30,10 35,4 40,12 50,8 60,14 70,6 80,12 90,16 100,8 110,12 120,6 130,14 140,10 150,4 160,12 170,8 180,14 190,6 200,12 210,16 220,8 230,12 240,6 250,14 260,10 270,4 280,12 290,8 300,14 310,10 320,6 320,30"
          fill="#100804" />
      </svg>
      <div className="absolute pointer-events-none" style={{ left: '5%', bottom: '46%', zIndex: 2 }}>
        <svg width="30" height="80" viewBox="0 0 12 32" style={{ imageRendering: 'pixelated' }}>
          <rect x="2" y="0" width="8" height="32" fill="#2a1c14" />
          <rect x="0" y="4" width="12" height="4" fill="#221410" />
          <rect x="1" y="14" width="10" height="3" fill="#221410" />
          <rect x="4" y="0" width="2" height="32" fill="#342418" />
        </svg>
      </div>
      <div className="absolute pointer-events-none" style={{ right: '8%', bottom: '46%', zIndex: 2 }}>
        <svg width="24" height="60" viewBox="0 0 10 24" style={{ imageRendering: 'pixelated' }}>
          <rect x="2" y="0" width="6" height="24" fill="#281a12" />
          <rect x="0" y="6" width="10" height="3" fill="#201210" />
          <rect x="3" y="0" width="2" height="24" fill="#322018" />
        </svg>
      </div>
      <div className="absolute left-0 right-0 pointer-events-none" style={{ top: '48%', bottom: 0, zIndex: 1 }}>
        <div style={{ width: '100%', height: '100%', perspective: '400px', perspectiveOrigin: '50% 0%', overflow: 'hidden' }}>
          <div style={{ width: '100%', height: '100%', transform: 'rotateX(35deg)', transformOrigin: 'top center' }}>
            <svg className="w-full h-full" viewBox="0 0 320 200" preserveAspectRatio="none" style={{ imageRendering: 'pixelated' }}>
              <rect x="0" y="0" width="320" height="200" fill="#1a0c06" />
              <rect x="0" y="0" width="320" height="8" fill="#201008" />
              <rect x="0" y="14" width="320" height="10" fill="#180c06" />
              <rect x="0" y="32" width="320" height="14" fill="#201008" />
              <rect x="0" y="58" width="320" height="18" fill="#180c06" />
              <rect x="0" y="90" width="320" height="24" fill="#201008" />
              <rect x="0" y="130" width="320" height="30" fill="#180c06" />
              <polygon points="140,0 180,0 240,200 80,200" fill="#401808" />
              <polygon points="148,0 172,0 220,200 100,200" fill="#602010" />
              <rect x="150" y="10" width="20" height="4" fill="#e06020" opacity="0.4" />
              <rect x="145" y="40" width="30" height="6" fill="#f08030" opacity="0.35" />
              <rect x="138" y="80" width="44" height="8" fill="#e06020" opacity="0.3" />
              <rect x="125" y="130" width="70" height="10" fill="#f0a040" opacity="0.25" />
              <rect x="110" y="170" width="100" height="14" fill="#e06020" opacity="0.2" />
              <rect x="60" y="20" width="4" height="3" fill="#2e1c10" />
              <rect x="250" y="45" width="6" height="3" fill="#2e1c10" />
              <rect x="40" y="100" width="8" height="4" fill="#281810" />
              <rect x="270" y="140" width="10" height="5" fill="#281810" />
            </svg>
          </div>
        </div>
        <svg className="absolute w-full pointer-events-none" style={{ top: -8, left: 0, height: 16 }}
          viewBox="0 0 320 16" preserveAspectRatio="none">
          <path d="M0,16 L0,10 C60,4 120,2 160,3 C200,2 260,4 320,10 L320,16 Z" fill="#1a0c06" />
          <path d="M140,3 C150,4 160,5 180,4 C190,3 200,3 200,3" stroke="#401808" strokeWidth="2" fill="none" opacity="0.5" />
        </svg>
      </div>
      <EmberParticles />
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse at 50% 45%, transparent 15%, rgba(12,4,2,0.2) 40%, rgba(8,2,1,0.5) 65%, rgba(6,1,0,0.8) 100%)',
        zIndex: 2,
      }} />
      <div className="absolute bottom-0 left-0 right-0 pointer-events-none" style={{
        height: '30%',
        background: 'linear-gradient(to top, rgba(200,80,20,0.06) 0%, transparent 100%)',
        zIndex: 2,
      }} />
    </>)}
  </div>
);

export default LavaBossScene;
