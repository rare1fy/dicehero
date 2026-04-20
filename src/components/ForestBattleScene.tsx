/**
 * ForestBattleScene — 阴暗枯树森林
 */
import React, { useMemo } from 'react';

function seededRandom(seed: number) {
  let s = seed;
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
}

/* ── 星星 ── */
const Stars: React.FC = React.memo(() => {
  const stars = useMemo(() => {
    const rng = seededRandom(42);
    return Array.from({ length: 40 }, () => ({
      x: rng() * 100, y: rng() * 38,
      size: rng() > 0.88 ? 2 : 1,
      brightness: 0.25 + rng() * 0.5,
      d: rng() * 6,
    }));
  }, []);
  return (
    <svg className="absolute inset-0 w-full h-full" style={{ imageRendering: 'pixelated' }}>
      {stars.map((s, i) => (
        <rect key={i} x={`${s.x}%`} y={`${s.y}%`} width={s.size} height={s.size}
          fill={`rgba(200,205,230,${s.brightness})`} className="animate-star-twinkle"
          style={{ animationDelay: `${s.d}s` }} />
      ))}
    </svg>
  );
});

/* ── 大月亮 ── */
const Moon: React.FC = React.memo(() => (
  <div className="absolute" style={{ top: '1%', left: '5%', zIndex: 1 }}>
    <div className="absolute" style={{
      top: -30, left: -30, width: 140, height: 140,
      background: 'radial-gradient(circle, rgba(180,190,220,0.07) 0%, rgba(160,170,200,0.03) 45%, transparent 70%)',
      borderRadius: '50%',
    }} />
    <svg width="80" height="80" viewBox="0 0 20 20" style={{ imageRendering: 'pixelated' }}>
      <rect x="6" y="2" width="8" height="2" fill="#ddd8c0" />
      <rect x="4" y="4" width="12" height="2" fill="#e8e0c8" />
      <rect x="3" y="6" width="14" height="2" fill="#ede6d0" />
      <rect x="2" y="8" width="16" height="4" fill="#f0ecd8" />
      <rect x="3" y="12" width="14" height="2" fill="#ede6d0" />
      <rect x="4" y="14" width="12" height="2" fill="#e8e0c8" />
      <rect x="6" y="16" width="8" height="2" fill="#ddd8c0" />
      <rect x="6" y="8" width="2" height="2" fill="#c8c4b0" />
      <rect x="11" y="6" width="2" height="2" fill="#ccc8b4" />
      <rect x="9" y="12" width="3" height="2" fill="#c5c0ac" />
      <rect x="5" y="10" width="2" height="1" fill="#bfbaa8" />
      <rect x="13" y="4" width="3" height="2" fill="rgba(10,14,25,0.55)" />
      <rect x="14" y="6" width="3" height="2" fill="rgba(10,14,25,0.6)" />
      <rect x="15" y="8" width="3" height="4" fill="rgba(10,14,25,0.65)" />
      <rect x="14" y="12" width="3" height="2" fill="rgba(10,14,25,0.6)" />
      <rect x="13" y="14" width="3" height="2" fill="rgba(10,14,25,0.55)" />
    </svg>
  </div>
));

/* ── 山脉 — 比天空亮很多，蓝紫灰调 ── */
const Mountains: React.FC = React.memo(() => (
  <svg className="absolute w-full pointer-events-none"
    style={{ bottom: '50%', height: '28%', imageRendering: 'pixelated' }}
    viewBox="0 0 320 100" preserveAspectRatio="none">
    {/* 远山 — 蓝灰色，明显比天空亮 */}
    <polygon
      points="0,100 0,65 15,55 30,40 50,50 70,28 90,42 110,20 130,35 150,15 170,30 190,22 210,38 230,25 250,40 270,18 290,32 310,42 320,28 320,100"
      fill="#2a2438" />
    {/* 中山 */}
    <polygon
      points="0,100 0,75 12,68 30,60 48,50 65,58 82,42 100,52 118,38 135,48 155,32 172,45 190,38 208,50 225,42 242,52 260,40 278,50 295,44 312,52 320,46 320,100"
      fill="#1e1828" />
    {/* 近山丘 — 深色但仍比天空可辨 */}
    <polygon
      points="0,100 0,82 18,75 35,80 55,70 72,76 90,65 108,72 125,64 142,70 160,62 178,68 195,72 212,66 230,74 248,68 265,75 282,70 300,76 315,68 320,72 320,100"
      fill="#14101c" />
  </svg>
));

/* ── 枯树 — 颜色提亮，棕灰色可辨 ── */
interface TreeProps {
  x: string; bottom: string; scale?: number; flip?: boolean;
  variant?: 'dead1' | 'dead2' | 'dead3'; zIndex?: number; opacity?: number;
}

const DeadTree: React.FC<TreeProps> = React.memo(({ x, bottom, scale = 1, flip = false, variant = 'dead1', zIndex = 2, opacity = 1 }) => (
  <div className="absolute pointer-events-none" style={{
    left: x, bottom, zIndex, opacity,
    transform: `scale(${flip ? -scale : scale}, ${scale})`,
    transformOrigin: 'bottom center', imageRendering: 'pixelated',
  }}>
    <svg width="48" height="100" viewBox="0 0 48 100" style={{ imageRendering: 'pixelated' }}>
      {variant === 'dead1' && (<>
        <rect x="21" y="30" width="6" height="70" fill="#3e3024" />
        <rect x="19" y="60" width="3" height="36" fill="#34281c" />
        <rect x="26" y="65" width="3" height="30" fill="#34281c" />
        <rect x="23" y="35" width="2" height="25" fill="#4e4030" />
        {/* 左枯枝 */}
        <rect x="10" y="32" width="12" height="3" fill="#3e3024" />
        <rect x="8" y="28" width="4" height="6" fill="#3e3024" />
        <rect x="5" y="24" width="5" height="4" fill="#34281c" />
        <rect x="14" y="22" width="8" height="3" fill="#3e3024" />
        <rect x="12" y="18" width="4" height="5" fill="#34281c" />
        {/* 右枯枝 */}
        <rect x="26" y="28" width="14" height="3" fill="#3e3024" />
        <rect x="38" y="24" width="4" height="6" fill="#3e3024" />
        <rect x="40" y="20" width="4" height="5" fill="#34281c" />
        <rect x="26" y="38" width="10" height="3" fill="#34281c" />
        <rect x="34" y="35" width="4" height="5" fill="#3e3024" />
        {/* 顶 */}
        <rect x="20" y="20" width="8" height="3" fill="#3e3024" />
        <rect x="22" y="16" width="4" height="5" fill="#34281c" />
        <rect x="18" y="12" width="3" height="6" fill="#34281c" />
        <rect x="25" y="10" width="3" height="5" fill="#3e3024" />
      </>)}
      {variant === 'dead2' && (<>
        <rect x="20" y="35" width="5" height="65" fill="#382c1c" />
        <rect x="18" y="70" width="3" height="26" fill="#302414" />
        <rect x="24" y="75" width="3" height="20" fill="#302414" />
        <rect x="22" y="38" width="2" height="20" fill="#4a3c2c" />
        <rect x="8" y="36" width="13" height="3" fill="#382c1c" />
        <rect x="6" y="30" width="4" height="8" fill="#302414" />
        <rect x="3" y="26" width="5" height="4" fill="#382c1c" />
        <rect x="24" y="32" width="12" height="3" fill="#382c1c" />
        <rect x="34" y="28" width="5" height="6" fill="#302414" />
        <rect x="24" y="42" width="8" height="2" fill="#302414" />
        <rect x="19" y="22" width="6" height="3" fill="#382c1c" />
        <rect x="16" y="18" width="4" height="5" fill="#302414" />
        <rect x="24" y="16" width="4" height="5" fill="#382c1c" />
        <rect x="27" y="12" width="3" height="5" fill="#302414" />
      </>)}
      {variant === 'dead3' && (<>
        <rect x="18" y="40" width="8" height="60" fill="#3e3024" />
        <rect x="16" y="68" width="4" height="28" fill="#34281c" />
        <rect x="25" y="72" width="3" height="24" fill="#34281c" />
        <rect x="20" y="44" width="3" height="18" fill="#4e4030" />
        <rect x="18" y="36" width="3" height="6" fill="#3e3024" />
        <rect x="23" y="34" width="3" height="8" fill="#382c1c" />
        <rect x="20" y="32" width="4" height="4" fill="#4a3c2c" />
        <rect x="8" y="44" width="11" height="3" fill="#34281c" />
        <rect x="6" y="40" width="4" height="5" fill="#302414" />
        <rect x="25" y="48" width="10" height="3" fill="#34281c" />
        <rect x="33" y="44" width="4" height="5" fill="#302414" />
      </>)}
    </svg>
  </div>
));

/* ── 水洼 ── */
const Puddle: React.FC<{ x: string; bottom: string; size?: 'sm' | 'md' }> = React.memo(
  ({ x, bottom, size = 'sm' }) => (
    <svg className="absolute pointer-events-none"
      style={{ left: x, bottom, zIndex: 1, imageRendering: 'pixelated' }}
      width={size === 'sm' ? 18 : 28} height={size === 'sm' ? 6 : 8}
      viewBox={size === 'sm' ? '0 0 18 6' : '0 0 28 8'}>
      {size === 'sm' ? (<>
        <ellipse cx="9" cy="3" rx="8" ry="3" fill="rgba(18,28,30,0.7)" />
        <ellipse cx="9" cy="3" rx="6" ry="2" fill="rgba(25,38,42,0.6)" />
        <rect x="6" y="2" width="2" height="1" fill="rgba(70,100,110,0.3)" />
      </>) : (<>
        <ellipse cx="14" cy="4" rx="13" ry="4" fill="rgba(18,28,30,0.7)" />
        <ellipse cx="14" cy="4" rx="10" ry="3" fill="rgba(22,35,40,0.6)" />
        <ellipse cx="14" cy="4" rx="6" ry="2" fill="rgba(28,45,50,0.5)" />
        <rect x="8" y="2" width="3" height="1" fill="rgba(70,110,120,0.25)" />
        <rect x="16" y="3" width="2" height="1" fill="rgba(60,90,100,0.2)" />
      </>)}
    </svg>
  )
);

/* ── 岩石 ── */
const Rock: React.FC<{ x: string; bottom: string; size?: 'sm' | 'md' }> = React.memo(
  ({ x, bottom, size = 'sm' }) => (
    <svg className="absolute pointer-events-none"
      style={{ left: x, bottom, zIndex: 2, imageRendering: 'pixelated' }}
      width={size === 'sm' ? 12 : 20} height={size === 'sm' ? 8 : 12}
      viewBox={size === 'sm' ? '0 0 12 8' : '0 0 20 12'}>
      {size === 'sm' ? (<>
        <rect x="2" y="4" width="8" height="4" fill="#38342a" />
        <rect x="4" y="2" width="6" height="4" fill="#444030" />
        <rect x="5" y="2" width="2" height="2" fill="#504c40" />
      </>) : (<>
        <rect x="2" y="6" width="16" height="6" fill="#38342a" />
        <rect x="4" y="3" width="14" height="5" fill="#444030" />
        <rect x="6" y="1" width="10" height="4" fill="#4c4838" />
        <rect x="8" y="1" width="4" height="2" fill="#585440" />
        <rect x="5" y="5" width="3" height="2" fill="#2c281e" />
      </>)}
    </svg>
  )
);

/* ── 萤火虫 ── */
const Fireflies: React.FC = React.memo(() => {
  const flies = useMemo(() => {
    const rng = seededRandom(77);
    return Array.from({ length: 6 }, () => ({
      x: 10 + rng() * 80, y: 30 + rng() * 35,
      delay: rng() * 8, dur: 5 + rng() * 5, size: rng() > 0.7 ? 3 : 2,
    }));
  }, []);
  return (<>
    {flies.map((f, i) => (
      <div key={i} className="absolute rounded-full pointer-events-none animate-firefly" style={{
        left: `${f.x}%`, top: `${f.y}%`, width: f.size, height: f.size,
        background: 'radial-gradient(circle, rgba(140,180,70,0.7) 0%, rgba(110,160,50,0.3) 50%, transparent 100%)',
        boxShadow: `0 0 ${f.size + 2}px rgba(120,170,60,0.4)`,
        animationDelay: `${f.delay}s`, animationDuration: `${f.dur}s`, zIndex: 2,
      }} />
    ))}
  </>);
});

/* ── 透视地面+泥路+弧形地平线 ── */
const PerspectiveGround: React.FC = React.memo(() => (
  <div className="absolute left-0 right-0 pointer-events-none" style={{ top: '48%', bottom: 0, zIndex: 1 }}>
    <div style={{ width: '100%', height: '100%', perspective: '400px', perspectiveOrigin: '50% 0%', overflow: 'hidden' }}>
      <div style={{ width: '100%', height: '100%', transform: 'rotateX(35deg)', transformOrigin: 'top center' }}>
        <svg className="w-full h-full" viewBox="0 0 320 200" preserveAspectRatio="none"
          style={{ imageRendering: 'pixelated' }}>
          {/* 基底 — 暗褐泥土 */}
          <rect x="0" y="0" width="320" height="200" fill="#1c160c" />
          {/* 枯黄草地（两侧）*/}
          <rect x="0" y="0" width="120" height="200" fill="#1e1a08" />
          <rect x="200" y="0" width="120" height="200" fill="#1e1a08" />
          {/* 左侧草地深浅 — 枯黄色调 */}
          <rect x="0" y="0" width="120" height="8" fill="#24200a" />
          <rect x="0" y="14" width="120" height="10" fill="#1a1606" />
          <rect x="0" y="32" width="120" height="14" fill="#24200a" />
          <rect x="0" y="58" width="120" height="18" fill="#1a1606" />
          <rect x="0" y="90" width="120" height="24" fill="#201c08" />
          <rect x="0" y="130" width="120" height="30" fill="#181406" />
          {/* 右侧 */}
          <rect x="200" y="0" width="120" height="8" fill="#24200a" />
          <rect x="200" y="14" width="120" height="10" fill="#1a1606" />
          <rect x="200" y="32" width="120" height="14" fill="#24200a" />
          <rect x="200" y="58" width="120" height="18" fill="#1a1606" />
          <rect x="200" y="90" width="120" height="24" fill="#201c08" />
          <rect x="200" y="130" width="120" height="30" fill="#181406" />

          {/* === 居中泥泞小路 === */}
          <polygon points="115,0 205,0 280,200 40,200" fill="#1a140c" />
          <polygon points="125,0 195,0 260,200 60,200" fill="#1e1810" />
          <polygon points="135,0 185,0 240,200 80,200" fill="#1a140c" />
          {/* 泥坑 */}
          <ellipse cx="160" cy="15" rx="12" ry="3" fill="#14100a" />
          <ellipse cx="155" cy="40" rx="16" ry="4" fill="#120e08" />
          <ellipse cx="165" cy="75" rx="20" ry="5" fill="#14100a" />
          <ellipse cx="150" cy="120" rx="26" ry="7" fill="#120e08" />
          <ellipse cx="170" cy="165" rx="32" ry="8" fill="#100c06" />
          {/* 泥浆高光 */}
          <rect x="148" y="38" width="4" height="1" fill="rgba(80,60,40,0.3)" />
          <rect x="152" y="72" width="5" height="1" fill="rgba(80,60,40,0.25)" />
          <rect x="140" y="116" width="6" height="2" fill="rgba(80,60,40,0.2)" />
          {/* 路面碎石 */}
          <rect x="140" y="8" width="3" height="2" fill="#2e2818" />
          <rect x="170" y="25" width="4" height="2" fill="#2e2818" />
          <rect x="130" y="55" width="5" height="3" fill="#2c2618" />
          <rect x="180" y="90" width="6" height="3" fill="#2c2618" />
          <rect x="120" y="140" width="8" height="4" fill="#2e2818" />
          <rect x="200" y="160" width="8" height="4" fill="#2c2618" />
          {/* 路边缘沟 */}
          <line x1="120" y1="0" x2="50" y2="200" stroke="#0e0a06" strokeWidth="2" opacity="0.6" />
          <line x1="200" y1="0" x2="270" y2="200" stroke="#0e0a06" strokeWidth="2" opacity="0.6" />

          {/* 骷髅（散落在地面上） */}
          {/* 左侧骷髅 */}
          <rect x="72" y="30" width="6" height="2" fill="#b8b09a" />
          <rect x="71" y="32" width="8" height="3" fill="#c0b8a0" />
          <rect x="72" y="32" width="2" height="2" fill="#1a1410" />
          <rect x="76" y="32" width="2" height="2" fill="#1a1410" />
          <rect x="71" y="35" width="8" height="2" fill="#a8a090" />
          <rect x="72" y="36" width="1" height="1" fill="#1a1410" />
          <rect x="74" y="36" width="1" height="1" fill="#1a1410" />
          <rect x="76" y="36" width="1" height="1" fill="#1a1410" />
          {/* 右侧骷髅 */}
          <rect x="232" y="55" width="8" height="2" fill="#b0a890" />
          <rect x="231" y="57" width="10" height="4" fill="#b8b098" />
          <rect x="232" y="58" width="2" height="2" fill="#1a1410" />
          <rect x="237" y="58" width="2" height="2" fill="#1a1410" />
          <rect x="231" y="61" width="10" height="2" fill="#a0988a" />
          <rect x="232" y="62" width="1" height="1" fill="#1a1410" />
          <rect x="235" y="62" width="1" height="1" fill="#1a1410" />
          <rect x="238" y="62" width="1" height="1" fill="#1a1410" />
          {/* 散落骨头 */}
          <rect x="80" y="34" width="6" height="1" fill="#a8a090" />
          <rect x="68" y="38" width="4" height="1" fill="#a09888" />
          <rect x="240" y="64" width="5" height="1" fill="#a09888" />
          <rect x="228" y="60" width="4" height="1" fill="#a8a090" />

          {/* 水洼/沼泽（地面内） */}
          <ellipse cx="80" cy="80" rx="15" ry="5" fill="rgba(18,28,30,0.6)" />
          <ellipse cx="80" cy="80" rx="10" ry="3" fill="rgba(22,35,40,0.5)" />
          <rect x="76" y="78" width="3" height="1" fill="rgba(60,90,100,0.25)" />
          <ellipse cx="245" cy="110" rx="18" ry="6" fill="rgba(18,28,30,0.6)" />
          <ellipse cx="245" cy="110" rx="12" ry="4" fill="rgba(22,35,40,0.5)" />
          <rect x="240" y="108" width="3" height="1" fill="rgba(60,90,100,0.2)" />
          <ellipse cx="65" cy="150" rx="22" ry="7" fill="rgba(18,28,30,0.55)" />
          <ellipse cx="260" cy="170" rx="20" ry="7" fill="rgba(18,28,30,0.55)" />
        </svg>
      </div>
    </div>
    {/* 弧形地平线 — 用 SVG path 画弧度 */}
    <svg className="absolute w-full pointer-events-none"
      style={{ top: -10, left: 0, height: 20, imageRendering: 'pixelated' }}
      viewBox="0 0 320 20" preserveAspectRatio="none">
      {/* 左侧弧形草皮 */}
      <path d="M0,20 L0,14 C40,8 80,4 120,6 L120,20 Z" fill="#1e1a08" />
      {/* 中间泥路入口弧线 */}
      <path d="M120,20 L120,6 C140,8 160,10 180,8 C190,7 200,6 200,6 L200,20 Z" fill="#1a140c" />
      {/* 右侧弧形草皮 */}
      <path d="M200,20 L200,6 C240,4 280,8 320,14 L320,20 Z" fill="#1e1a08" />
      {/* 弧线上的不规则草 */}
      <path d="M0,14 C20,10 60,5 100,5 C110,5 115,5 120,6" stroke="#282408" strokeWidth="2" fill="none" />
      <path d="M200,6 C210,5 220,5 240,6 C280,8 310,12 320,14" stroke="#282408" strokeWidth="2" fill="none" />
    </svg>
  </div>
));

/* ── 主场景 ── */
const ForestBattleScene: React.FC<{ isBoss?: boolean }> = ({ isBoss = false }) => (
  <div className="absolute inset-0 overflow-hidden" style={{ background: isBoss ? '#0c0204' : '#08060a', zIndex: 0, isolation: 'isolate' }}>
    {isBoss ? (<>
      {/* ===== BOSS场景：燃烧的枯树林 ===== */}
      {/* 天空 — 无月、暗红烟雾弥漫 */}
      <div className="absolute inset-0" style={{
        background: 'linear-gradient(to bottom, #060204 0%, #0c0406 12%, #140608 25%, #1a080a 38%, #14060a 50%, #0e0406 100%)',
      }} />
      {/* 远处火光映天 */}
      <div className="absolute pointer-events-none" style={{
        top: '15%', left: '20%', width: '60%', height: '30%',
        background: 'radial-gradient(ellipse at 50% 80%, rgba(200,60,20,0.08) 0%, rgba(160,40,10,0.04) 40%, transparent 70%)',
        zIndex: 1,
      }} />
      <Mountains />
      {/* 燃烧枯树线 — 红色树冠轮廓 */}
      <svg className="absolute w-full pointer-events-none"
        style={{ bottom: '50%', height: '14%', zIndex: 2, imageRendering: 'pixelated' }}
        viewBox="0 0 320 50" preserveAspectRatio="none">
        <polygon
          points="0,50 0,30 3,28 6,18 10,24 14,12 18,20 22,8 26,16 30,22 34,10 38,18 42,24 46,12 50,20 54,14 58,22 62,8 66,18 70,24 74,14 78,20 82,10 86,18 90,26 94,14 98,20 102,8 106,18 110,24 114,12 118,20 122,14 126,22 130,10 134,18 138,24 142,12 146,20 150,8 154,16 158,22 162,14 166,20 170,10 174,18 178,24 182,12 186,20 190,8 194,16 198,22 202,14 206,18 210,10 214,20 218,24 222,12 226,18 230,8 234,16 238,22 242,14 246,20 250,10 254,18 258,24 262,12 266,18 270,22 274,14 278,20 282,10 286,18 290,24 294,14 298,18 302,10 306,18 310,24 314,16 318,20 320,14 320,50"
          fill="#1a0808" />
        {/* 火光顶部 — 红橙色 */}
        <polygon
          points="0,30 3,28 6,18 10,24 14,12 18,20 22,8 26,16 30,22 34,10 38,18 42,24 46,12 50,20 54,14 58,22 62,8 66,18 70,24 74,14 78,20 82,10 86,18 90,26 94,14 98,20 102,8 106,18 110,24 114,12 118,20 122,14 126,22 130,10 134,18 138,24 142,12 146,20 150,8 154,16 158,22 162,14 166,20 170,10 174,18 178,24 182,12 186,20 190,8 194,16 198,22 202,14 206,18 210,10 214,20 218,24 222,12 226,18 230,8 234,16 238,22 242,14 246,20 250,10 254,18 258,24 262,12 266,18 270,22 274,14 278,20 282,10 286,18 290,24 294,14 298,18 302,10 306,18 310,24 314,16 318,20 320,14"
          fill="none" stroke="rgba(200,60,20,0.15)" strokeWidth="3" />
      </svg>
      {/* 燃烧枯树（带红色光晕） */}
      <DeadTree x="1%" bottom="48%" scale={1.5} variant="dead1" opacity={0.9} />
      <DeadTree x="84%" bottom="48%" scale={1.4} variant="dead2" opacity={0.85} flip />
      <DeadTree x="-6%" bottom="48%" scale={1.8} variant="dead3" opacity={0.6} />
      <DeadTree x="92%" bottom="48%" scale={1.6} variant="dead1" opacity={0.65} flip />
      {/* 树根火光 */}
      <div className="absolute pointer-events-none" style={{ left: '-2%', bottom: '46%', width: '20%', height: '8%', background: 'radial-gradient(ellipse at 50% 100%, rgba(220,80,20,0.12) 0%, transparent 70%)', zIndex: 3 }} />
      <div className="absolute pointer-events-none" style={{ right: '-2%', bottom: '46%', width: '18%', height: '8%', background: 'radial-gradient(ellipse at 50% 100%, rgba(200,60,15,0.1) 0%, transparent 70%)', zIndex: 3 }} />
      {/* 地面 — 龟裂焦土 */}
      <PerspectiveGround />
      {/* 地面红色裂痕光层 */}
      <div className="absolute left-0 right-0 pointer-events-none" style={{ top: '52%', bottom: 0, zIndex: 2, opacity: 0.4, background: 'linear-gradient(to bottom, transparent 0%, rgba(180,40,10,0.06) 30%, rgba(160,30,5,0.1) 60%, rgba(140,20,0,0.08) 100%)' }} />
      {/* 灰烬粒子（代替萤火虫） */}
      <Fireflies />
      {/* 极暗红色暗角 */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse at 50% 45%, transparent 8%, rgba(20,4,2,0.3) 30%, rgba(14,2,1,0.65) 55%, rgba(8,1,0,0.92) 100%)',
        zIndex: 2,
      }} />
      {/* 红色边缘光 */}
      <div className="absolute inset-0 pointer-events-none" style={{
        boxShadow: 'inset 0 0 60px rgba(180,40,10,0.08), inset 0 0 120px rgba(120,20,5,0.04)',
        zIndex: 2,
      }} />
    </>) : (<>
      {/* ===== 普通场景：阴暗枯树森林 ===== */}
      <div className="absolute inset-0" style={{
        background: 'linear-gradient(to bottom, #04030a 0%, #060610 12%, #080a16 25%, #0a0c18 38%, #0c0a12 50%, #0a0808 100%)',
      }} />
      <Stars />
      <Moon />
      <div className="absolute pointer-events-none" style={{
        top: 0, left: 0, width: '55%', height: '65%',
        background: 'radial-gradient(ellipse at 18% 12%, rgba(160,170,200,0.06) 0%, transparent 55%)',
        zIndex: 1,
      }} />
      <Mountains />
      <svg className="absolute w-full pointer-events-none"
        style={{ bottom: '50%', height: '14%', zIndex: 2, imageRendering: 'pixelated' }}
        viewBox="0 0 320 50" preserveAspectRatio="none">
        <polygon
          points="0,50 0,30 3,28 6,18 10,24 14,12 18,20 22,8 26,16 30,22 34,10 38,18 42,24 46,12 50,20 54,14 58,22 62,8 66,18 70,24 74,14 78,20 82,10 86,18 90,26 94,14 98,20 102,8 106,18 110,24 114,12 118,20 122,14 126,22 130,10 134,18 138,24 142,12 146,20 150,8 154,16 158,22 162,14 166,20 170,10 174,18 178,24 182,12 186,20 190,8 194,16 198,22 202,14 206,18 210,10 214,20 218,24 222,12 226,18 230,8 234,16 238,22 242,14 246,20 250,10 254,18 258,24 262,12 266,18 270,22 274,14 278,20 282,10 286,18 290,24 294,14 298,18 302,10 306,18 310,24 314,16 318,20 320,14 320,50"
          fill="#18121c" />
      </svg>
      <DeadTree x="1%" bottom="48%" scale={1.5} variant="dead1" opacity={0.85} />
      <DeadTree x="84%" bottom="48%" scale={1.4} variant="dead2" opacity={0.8} flip />
      <DeadTree x="-6%" bottom="48%" scale={1.8} variant="dead3" opacity={0.55} />
      <DeadTree x="92%" bottom="48%" scale={1.6} variant="dead1" opacity={0.6} flip />
      <DeadTree x="-8%" bottom="44%" scale={2.4} variant="dead2" opacity={0.35} />
      <DeadTree x="90%" bottom="44%" scale={2.2} variant="dead3" opacity={0.3} flip />
      <PerspectiveGround />
      <Rock x="28%" bottom="50%" size="md" />
      <Rock x="58%" bottom="51%" size="sm" />
      <Rock x="88%" bottom="50%" size="sm" />
      <Rock x="5%" bottom="50%" size="sm" />
      <Puddle x="12%" bottom="49%" size="md" />
      <Puddle x="68%" bottom="50%" size="sm" />
      <Fireflies />
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse at 50% 45%, transparent 15%, rgba(6,4,8,0.2) 40%, rgba(4,3,6,0.5) 65%, rgba(3,2,4,0.8) 100%)',
        zIndex: 2,
      }} />
    </>)}

    <div className="absolute top-0 left-0 right-0 pointer-events-none" style={{
      height: '5%',
      background: 'linear-gradient(to bottom, rgba(6,4,8,0.7) 0%, transparent 100%)',
      zIndex: 2,
    }} />
    <div className="battle-ground-fog-forest" />
  </div>
);

export default ForestBattleScene;
