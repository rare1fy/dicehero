import React from 'react';

/**
 * PixelDiceRenderer — 纯像素风骰子渲染器
 * 全职业+通用骰子，用 <rect> 像素块绘制
 */

const PIXEL_DIGITS: Record<string, number[][]> = {
  '0': [[1,1,1],[1,0,1],[1,0,1],[1,0,1],[1,1,1]],
  '1': [[0,1,0],[1,1,0],[0,1,0],[0,1,0],[1,1,1]],
  '2': [[1,1,1],[0,0,1],[1,1,1],[1,0,0],[1,1,1]],
  '3': [[1,1,1],[0,0,1],[1,1,1],[0,0,1],[1,1,1]],
  '4': [[1,0,1],[1,0,1],[1,1,1],[0,0,1],[0,0,1]],
  '5': [[1,1,1],[1,0,0],[1,1,1],[0,0,1],[1,1,1]],
  '6': [[1,1,1],[1,0,0],[1,1,1],[1,0,1],[1,1,1]],
  '7': [[1,1,1],[0,0,1],[0,0,1],[0,1,0],[0,1,0]],
  '8': [[1,1,1],[1,0,1],[1,1,1],[1,0,1],[1,1,1]],
  '9': [[1,1,1],[1,0,1],[1,1,1],[0,0,1],[1,1,1]],
  '?': [[1,1,1],[0,0,1],[0,1,0],[0,0,0],[0,1,0]],
};

interface DiceColorScheme {
  border: string; outer: string; inner: string;
  highlight: string; shadow: string; digit: string; digitShadow: string;
}

// ============================================================
// 全骰子配色方案
// ============================================================
const DICE_COLORS: Record<string, DiceColorScheme> = {

  // === 閫氱敤 鈥?涓€х伆/鐗规畩鑹?===

  standard:  { border: '#687078', outer: '#889098', inner: '#a0a8b0', highlight: '#d0d8e0', shadow: '#484850', digit: '#1a1e25', digitShadow: '#b0b8c0' },

  blade:     { border: '#606068', outer: '#787880', inner: '#909098', highlight: '#c0c0c8', shadow: '#404048', digit: '#f0f0f8', digitShadow: '#505058' },

  amplify:   { border: '#382058', outer: '#503080', inner: '#6840a0', highlight: '#a070e0', shadow: '#201038', digit: '#d8b8ff', digitShadow: '#302050' },

  split:     { border: '#104838', outer: '#186858', inner: '#209870', highlight: '#50d8a0', shadow: '#083020', digit: '#a0ffd0', digitShadow: '#104838' },

  magnet:    { border: '#401828', outer: '#603040', inner: '#804858', highlight: '#c07888', shadow: '#280810', digit: '#ffc0d0', digitShadow: '#401828' },

  joker:     { border: '#402048', outer: '#604070', inner: '#885898', highlight: '#c088d0', shadow: '#281030', digit: '#f0d0ff', digitShadow: '#402048' },

  chaos:     { border: '#481810', outer: '#703020', inner: '#a04830', highlight: '#e07040', shadow: '#300808', digit: '#ffd040', digitShadow: '#481810' },

  cursed:    { border: '#281030', outer: '#402050', inner: '#583070', highlight: '#8858a0', shadow: '#180818', digit: '#c088e0', digitShadow: '#281030' },

  cracked:   { border: '#303030', outer: '#404040', inner: '#505050', highlight: '#787878', shadow: '#202020', digit: '#a8a8a8', digitShadow: '#303030' },

  elemental: { border: '#282848', outer: '#383868', inner: '#484888', highlight: '#7070c0', shadow: '#181830', digit: '#c0c0ff', digitShadow: '#282848' },

  heavy:     { border: '#505058', outer: '#686870', inner: '#808088', highlight: '#a8a8b0', shadow: '#383840', digit: '#e0e0e8', digitShadow: '#484850' },

  // === 鎴樺＋ (22) 鈥?绾?0)/姗?25)/榛?45)/閾?35) ===

  w_bloodthirst: { border: '#581010', outer: '#802020', inner: '#a83030', highlight: '#e05040', shadow: '#380808', digit: '#ffc0b0', digitShadow: '#501010' },

  w_ironwall:      { border: '#584018', outer: '#806020', inner: '#a88030', highlight: '#d0a848', shadow: '#382808', digit: '#ffe8c0', digitShadow: '#504018' },

  w_warcry:      { border: '#584810', outer: '#806818', inner: '#b09028', highlight: '#e0c040', shadow: '#383008', digit: '#fff8a0', digitShadow: '#504010' },

    w_fury:        { border: '#582008', outer: '#804010', inner: '#b06020', highlight: '#e88830', shadow: '#381008', digit: '#ffe0a0', digitShadow: '#502008' },

  w_charge:      { border: '#584008', outer: '#806010', inner: '#a88020', highlight: '#d8b030', shadow: '#382808', digit: '#fff0b0', digitShadow: '#503808' },

  w_armorbreak:  { border: '#582810', outer: '#804018', inner: '#a85828', highlight: '#d88038', shadow: '#381808', digit: '#ffc890', digitShadow: '#502010' },

  w_revenge:     { border: '#581818', outer: '#803028', inner: '#a84838', highlight: '#d06850', shadow: '#380808', digit: '#ffb0a0', digitShadow: '#501010' },

  w_roar:        { border: '#585010', outer: '#807018', inner: '#a89828', highlight: '#d0c040', shadow: '#383808', digit: '#fff0a0', digitShadow: '#504810' },

  w_lifefurnace: { border: '#580810', outer: '#801820', inner: '#a82830', highlight: '#e04848', shadow: '#380408', digit: '#ffa8a0', digitShadow: '#500810' },

  w_bloodpact:   { border: '#480808', outer: '#681010', inner: '#901818', highlight: '#c02828', shadow: '#300404', digit: '#ff8080', digitShadow: '#480808' },

  w_execute:     { border: '#504010', outer: '#786018', inner: '#a08028', highlight: '#c8a838', shadow: '#382808', digit: '#ffe8a0', digitShadow: '#483810' },

  w_quake:       { border: '#483810', outer: '#685018', inner: '#887028', highlight: '#b09038', shadow: '#302808', digit: '#e8d090', digitShadow: '#403010' },

  w_leech:       { border: '#501010', outer: '#702020', inner: '#983030', highlight: '#c84848', shadow: '#300808', digit: '#ffb0b0', digitShadow: '#481010' },

  w_titanfist:   { border: '#480408', outer: '#680810', inner: '#901018', highlight: '#c82028', shadow: '#280204', digit: '#ff9090', digitShadow: '#400408' },

  w_unyielding:  { border: '#504818', outer: '#706828', inner: '#988838', highlight: '#c0b050', shadow: '#383010', digit: '#f0e0a0', digitShadow: '#484018' },

  w_warhammer:   { border: '#583008', outer: '#805010', inner: '#a87020', highlight: '#d89830', shadow: '#382008', digit: '#ffe8a0', digitShadow: '#502808' },

  w_bloodblade:  { border: '#502018', outer: '#703828', inner: '#985038', highlight: '#c07050', shadow: '#381010', digit: '#f0c0a0', digitShadow: '#481818' },

  w_giantshield: { border: '#484018', outer: '#686028', inner: '#908038', highlight: '#b8a850', shadow: '#302810', digit: '#e8d8a0', digitShadow: '#403818' },

  w_berserk:     { border: '#580808', outer: '#801010', inner: '#b02020', highlight: '#e83830', shadow: '#380404', digit: '#ff8878', digitShadow: '#500808' },

  w_bloodgod:    { border: '#400408', outer: '#600810', inner: '#801018', highlight: '#b02028', shadow: '#280204', digit: '#ff7868', digitShadow: '#380408' },

  w_overlord:    { border: '#504010', outer: '#706018', inner: '#988028', highlight: '#c0a840', shadow: '#382810', digit: '#f0e0b0', digitShadow: '#483810' },

  // === 新增战士骰子 ===
  w_whirlwind:   { border: '#582800', outer: '#804010', inner: '#b06818', highlight: '#e0a030', shadow: '#381800', digit: '#fff0a8', digitShadow: '#502000' },
  w_cleave:    { border: '#5a1010', outer: '#882020', inner: '#b83030', highlight: '#e05050', shadow: '#380808', digit: '#ffe8e8', digitShadow: '#501818' },

  // === 娉曞笀 (22) 鈥?钃?210)/绱?270)/闈?195)/闈?240) ===

  mage_elemental:{ border: '#202848', outer: '#304068', inner: '#405888', highlight: '#6080c0', shadow: '#101830', digit: '#c0d8ff', digitShadow: '#202040' },

  mage_reverse:  { border: '#301848', outer: '#483070', inner: '#604898', highlight: '#8868c0', shadow: '#200830', digit: '#d8c0ff', digitShadow: '#281040' },

  mage_missile:  { border: '#102048', outer: '#203870', inner: '#305098', highlight: '#4878d0', shadow: '#081030', digit: '#a0c8ff', digitShadow: '#101838' },

  mage_barrier:  { border: '#103848', outer: '#185868', inner: '#287888', highlight: '#48a8c0', shadow: '#082830', digit: '#90e0ff', digitShadow: '#102830' },

  mage_meditate: { border: '#282048', outer: '#403868', inner: '#585088', highlight: '#7870b0', shadow: '#181030', digit: '#d0c0f0', digitShadow: '#201838' },

  mage_amplify:  { border: '#281048', outer: '#402070', inner: '#583098', highlight: '#7850d0', shadow: '#180828', digit: '#c8a8ff', digitShadow: '#200838' },

  mage_mirror:   { border: '#103048', outer: '#184868', inner: '#286088', highlight: '#4890c0', shadow: '#082030', digit: '#a0d8ff', digitShadow: '#102838' },

  mage_crystal:  { border: '#082848', outer: '#104068', inner: '#186090', highlight: '#3898d0', shadow: '#041828', digit: '#80d0ff', digitShadow: '#082038' },

  mage_temporal: { border: '#201848', outer: '#303068', inner: '#404888', highlight: '#6068b0', shadow: '#100830', digit: '#c0c8f0', digitShadow: '#181040' },

  mage_prism:    { border: '#301050', outer: '#482078', inner: '#6838a0', highlight: '#9058d0', shadow: '#200830', digit: '#d8b0ff', digitShadow: '#280840' },

  mage_resonance:{ border: '#282850', outer: '#404070', inner: '#585898', highlight: '#8080d0', shadow: '#181838', digit: '#d0d0ff', digitShadow: '#202040' },

  mage_devour:   { border: '#180830', outer: '#281050', inner: '#381870', highlight: '#5030a8', shadow: '#100418', digit: '#a870f0', digitShadow: '#180828' },

  mage_purify:   { border: '#103848', outer: '#185870', inner: '#287898', highlight: '#40a8d0', shadow: '#082830', digit: '#90e8ff', digitShadow: '#103040' },

  mage_surge:    { border: '#200848', outer: '#381070', inner: '#502098', highlight: '#7038d0', shadow: '#100428', digit: '#c0a0ff', digitShadow: '#180838' },

  mage_elemstorm:{ border: '#182048', outer: '#283870', inner: '#385098', highlight: '#5070c8', shadow: '#101030', digit: '#b0c8ff', digitShadow: '#182040' },

  mage_burnecho:  { border: '#180838', outer: '#301058', inner: '#481880', highlight: '#6838c0', shadow: '#100420', digit: '#b880ff', digitShadow: '#180830' },

  mage_weave:    { border: '#282850', outer: '#404070', inner: '#585890', highlight: '#8080c0', shadow: '#181838', digit: '#d0d0f8', digitShadow: '#202040' },

  mage_permafrost:{ border: '#084048', outer: '#106068', inner: '#188088', highlight: '#30b8d0', shadow: '#043030', digit: '#80e8ff', digitShadow: '#083838' },

  mage_star:     { border: '#181848', outer: '#283068', inner: '#384890', highlight: '#5868c8', shadow: '#101030', digit: '#c0d0ff', digitShadow: '#181840' },

  mage_frostecho:   { border: '#103048', outer: '#184870', inner: '#286898', highlight: '#4098d0', shadow: '#082030', digit: '#a0d8ff', digitShadow: '#103040' },

  mage_meteor:   { border: '#281040', outer: '#402060', inner: '#603080', highlight: '#8848b8', shadow: '#180828', digit: '#d8a8f0', digitShadow: '#201030' },

  mage_elemheart:{ border: '#202850', outer: '#304870', inner: '#406890', highlight: '#6898d0', shadow: '#101838', digit: '#d0e8ff', digitShadow: '#182040' },

  // === 鐩楄醇 (24) 鈥?缁?120)/鑽у厜榛勭豢(90)/婀栬摑(170)/缈?150) ===

  r_dagger:       { border: '#183818', outer: '#285828', inner: '#388838', highlight: '#58c058', shadow: '#102810', digit: '#c0ffc0', digitShadow: '#183018' },

  r_envenom:      { border: '#084818', outer: '#106828', inner: '#189838', highlight: '#30d050', shadow: '#043010', digit: '#80ffa0', digitShadow: '#084018' },

  r_throwing:     { border: '#183838', outer: '#285858', inner: '#388878', highlight: '#58c0b0', shadow: '#102828', digit: '#a0fff0', digitShadow: '#183030' },

  r_pursuit:      { border: '#104038', outer: '#186058', inner: '#288878', highlight: '#48c8b0', shadow: '#083028', digit: '#90fff0', digitShadow: '#103830' },

  r_poison_vial:  { border: '#284010', outer: '#406018', inner: '#588820', highlight: '#80c030', shadow: '#182808', digit: '#c0ff60', digitShadow: '#283810' },

  r_sleeve:       { border: '#184018', outer: '#286028', inner: '#389038', highlight: '#58c858', shadow: '#103010', digit: '#a0ffb0', digitShadow: '#183818' },

  r_quickdraw:    { border: '#104038', outer: '#186058', inner: '#289078', highlight: '#48c8a8', shadow: '#083028', digit: '#90fff0', digitShadow: '#103838' },

  r_combomastery: { border: '#304010', outer: '#486018', inner: '#688828', highlight: '#90c038', shadow: '#202808', digit: '#d0ff70', digitShadow: '#283810' },

  r_lethal:       { border: '#284018', outer: '#406028', inner: '#589038', highlight: '#80c858', shadow: '#183010', digit: '#c8ffa0', digitShadow: '#283818' },

  r_toxblade:     { border: '#104810', outer: '#186818', inner: '#209828', highlight: '#38d038', shadow: '#083008', digit: '#80ff80', digitShadow: '#104010' },

  r_shadow_clone: { border: '#204020', outer: '#306830', inner: '#409848', highlight: '#60d068', shadow: '#102810', digit: '#b0ffc0', digitShadow: '#203020' },

  r_miasma:       { border: '#304010', outer: '#486020', inner: '#688830', highlight: '#98c048', shadow: '#202808', digit: '#d8ff80', digitShadow: '#283810' },

  r_boomerang:    { border: '#184020', outer: '#286030', inner: '#389040', highlight: '#58c060', shadow: '#103018', digit: '#a0f8b0', digitShadow: '#183820' },

  r_corrosion:    { border: '#284810', outer: '#406818', inner: '#589828', highlight: '#80d038', shadow: '#183008', digit: '#c0ff68', digitShadow: '#284010' },

  r_chain_strike: { border: '#104840', outer: '#187060', inner: '#28a080', highlight: '#48e0b0', shadow: '#083028', digit: '#90fff0', digitShadow: '#103830' },
    r_shadowstrike:  { border: '#183020', outer: '#284830', inner: '#387040', highlight: '#58a060', shadow: '#082010', digit: '#d0ffd0', digitShadow: '#204020' },
  r_shadow:       { border: '#183818', outer: '#285838', inner: '#388850', highlight: '#58c070', shadow: '#102810', digit: '#a0f8b0', digitShadow: '#183018' },

  r_steal:        { border: '#384810', outer: '#506818', inner: '#709828', highlight: '#98d038', shadow: '#283008', digit: '#d8ff70', digitShadow: '#384010' },

  r_venomfang:    { border: '#085010', outer: '#107018', inner: '#18a028', highlight: '#30e040', shadow: '#043808', digit: '#70ff90', digitShadow: '#084810' },

  r_tripleflash:  { border: '#204010', outer: '#306018', inner: '#409028', highlight: '#68c838', shadow: '#182808', digit: '#b0ff80', digitShadow: '#203810' },

  r_shadowdance:  { border: '#103828', outer: '#185840', inner: '#288858', highlight: '#48c080', shadow: '#082818', digit: '#90ffc8', digitShadow: '#103020' },

  r_plaguedet:    { border: '#284010', outer: '#406820', inner: '#589830', highlight: '#80d048', shadow: '#182808', digit: '#c8ff78', digitShadow: '#283810' },

  r_phantom:      { border: '#183830', outer: '#285848', inner: '#388868', highlight: '#58c098', shadow: '#102820', digit: '#a0ffd8', digitShadow: '#183028' },

  r_purifyblade:  { border: '#184818', outer: '#286828', inner: '#389838', highlight: '#58d058', shadow: '#103010', digit: '#a0ffb0', digitShadow: '#184018' },

  r_deathtouch:   { border: '#183818', outer: '#285838', inner: '#388850', highlight: '#58b868', shadow: '#102810', digit: '#a0f0b8', digitShadow: '#183018' },

  r_bladestorm:   { border: '#085018', outer: '#107028', inner: '#18a038', highlight: '#30e050', shadow: '#043808', digit: '#80ffa0', digitShadow: '#084818' },

  temp_rogue:     { border: '#103818', outer: '#185028', inner: '#287038', highlight: '#48a058', shadow: '#082810', digit: '#80d890', digitShadow: '#103018' },

};

// ============================================================
// PixelDiceBody — 核心像素骰子SVG渲染
// ============================================================
const PixelDiceBody: React.FC<{
  colors: DiceColorScheme; value: number | string;
  pattern?: React.ReactNode; size: number; selected?: boolean;
}> = ({ colors, value, pattern, size, selected }) => {
  const digitStr = String(value);
  const digitData = PIXEL_DIGITS[digitStr] || PIXEL_DIGITS['?'];
  return (
    <svg width={size} height={size} viewBox="0 0 26 30" style={{ imageRendering: 'pixelated', display: 'block' }}>
      {/* 底部厚度 */}
      <rect x="0" y="24" width="26" height="2" fill={colors.shadow} />
      <rect x="0" y="26" width="26" height="2" fill={colors.shadow} opacity="0.6" />
      <rect x="2" y="28" width="22" height="2" fill="rgba(0,0,0,0.25)" />
      {/* 外边框 */}
      <rect x="0" y="0" width="26" height="2" fill={colors.border} />
      <rect x="0" y="22" width="26" height="2" fill={colors.border} />
      <rect x="0" y="0" width="2" height="24" fill={colors.border} />
      <rect x="24" y="0" width="2" height="24" fill={colors.border} />
      {/* 底色 */}
      <rect x="2" y="2" width="22" height="20" fill={colors.outer} />
      {/* 内层亮区 */}
      <rect x="4" y="4" width="18" height="16" fill={colors.inner} />
      {/* inset高光 左+上 */}
      <rect x="2" y="2" width="22" height="2" fill={colors.highlight} opacity="0.35" />
      <rect x="2" y="2" width="2" height="20" fill={colors.highlight} opacity="0.2" />
      <rect x="4" y="4" width="4" height="2" fill={colors.highlight} opacity="0.3" />
      <rect x="4" y="4" width="2" height="4" fill={colors.highlight} opacity="0.25" />
      {/* inset暗边 右+下 */}
      <rect x="22" y="4" width="2" height="18" fill={colors.shadow} opacity="0.4" />
      <rect x="4" y="20" width="20" height="2" fill={colors.shadow} opacity="0.35" />
      <rect x="20" y="18" width="2" height="2" fill={colors.shadow} opacity="0.3" />
      {/* 图案 */}
      {pattern && <g opacity="0.85">{pattern}</g>}
      {/* 数字 */}
      <g>{digitData.map((row, ry) => row.map((px, rx) => {
        if (!px) return null;
        const x = 10 + rx * 2, y = 7 + ry * 2;
        return (<React.Fragment key={`${ry}-${rx}`}>
          <rect x={x+1} y={y+1} width="2" height="2" fill={colors.digitShadow} />
          <rect x={x} y={y} width="2" height="2" fill={colors.digit} />
        </React.Fragment>);
      }))}</g>
      {/* 选中态 */}
      {selected && <g>
        <rect x="0" y="0" width="26" height="2" fill={colors.highlight} opacity="0.8" />
        <rect x="0" y="26" width="26" height="2" fill={colors.highlight} opacity="0.5" />
        <rect x="0" y="0" width="2" height="28" fill={colors.highlight} opacity="0.8" />
        <rect x="24" y="0" width="2" height="28" fill={colors.highlight} opacity="0.8" />
      </g>}
    </svg>
  );
};

// ============================================================
// 全骰子图案 — 纯rect像素块
// ============================================================
const P: Record<string, React.ReactNode> = {
  // --- 通用 ---
  standard: (<><rect x="8" y="8" width="2" height="2" fill="#a0a8b0"/><rect x="16" y="8" width="2" height="2" fill="#a0a8b0"/><rect x="12" y="12" width="2" height="2" fill="#a0a8b0"/><rect x="8" y="16" width="2" height="2" fill="#a0a8b0"/><rect x="16" y="16" width="2" height="2" fill="#a0a8b0"/></>),
  blade: (<><rect x="6" y="6" width="2" height="12" fill="#b0b8c0"/><rect x="8" y="10" width="10" height="2" fill="#98a0a8"/><rect x="18" y="8" width="2" height="6" fill="#b0b8c0"/></>),
  amplify: (<><rect x="12" y="4" width="2" height="8" fill="#9070d0"/><rect x="8" y="8" width="2" height="2" fill="#7050b0"/><rect x="16" y="8" width="2" height="2" fill="#7050b0"/><rect x="10" y="14" width="6" height="2" fill="#8060c0"/></>),
  split: (<><rect x="8" y="6" width="4" height="4" fill="#50c880"/><rect x="14" y="12" width="4" height="4" fill="#40b070"/><rect x="12" y="10" width="2" height="2" fill="#80ffd0"/></>),
  magnet: (<><rect x="4" y="6" width="8" height="10" fill="#c04860"/><rect x="14" y="6" width="8" height="10" fill="#3878c0"/><rect x="10" y="10" width="6" height="4" fill="#707880"/></>),
  joker: (<><rect x="6" y="6" width="4" height="4" fill="#e06090"/><rect x="14" y="6" width="4" height="4" fill="#60a0e0"/><rect x="6" y="14" width="4" height="4" fill="#60c060"/><rect x="14" y="14" width="4" height="4" fill="#e0c040"/><rect x="10" y="10" width="4" height="4" fill="#e0e0e0"/></>),
  chaos: (<><rect x="8" y="6" width="8" height="2" fill="#d05040"/><rect x="6" y="8" width="4" height="4" fill="#c03830"/><rect x="14" y="8" width="4" height="4" fill="#c03830"/><rect x="10" y="12" width="4" height="4" fill="#ffd040"/><rect x="10" y="16" width="4" height="2" fill="#b09030"/></>),
  cursed: (<><rect x="8" y="6" width="8" height="2" fill="#8050b0"/><rect x="6" y="8" width="2" height="6" fill="#7040a0"/><rect x="16" y="8" width="2" height="6" fill="#7040a0"/><rect x="8" y="14" width="8" height="2" fill="#6030a0"/><rect x="12" y="10" width="2" height="2" fill="#c080f0"/></>),
  cracked: (<><rect x="8" y="6" width="2" height="4" fill="#585858"/><rect x="10" y="10" width="2" height="2" fill="#606060"/><rect x="12" y="12" width="2" height="4" fill="#585858"/><rect x="14" y="16" width="2" height="2" fill="#505050"/></>),
  elemental: (<><rect x="8" y="6" width="4" height="4" fill="#e07830"/><rect x="14" y="6" width="4" height="4" fill="#50b8e0"/><rect x="8" y="14" width="4" height="4" fill="#70c030"/><rect x="14" y="14" width="4" height="4" fill="#8060c0"/><rect x="11" y="11" width="4" height="2" fill="#d4a030"/></>),
  heavy: (<><rect x="8" y="8" width="8" height="2" fill="#6a6a78"/><rect x="6" y="10" width="12" height="4" fill="#5a5a68"/><rect x="8" y="14" width="8" height="2" fill="#4a4a58"/><rect x="10" y="10" width="4" height="2" fill="#808090"/></>),
  // --- 战士 (20) ---
  w_bloodthirst: (<><rect x="12" y="4" width="2" height="2" fill="#ffffff"/><rect x="10" y="6" width="6" height="2" fill="#e0e0e0"/><rect x="8" y="8" width="10" height="4" fill="#c8c8c8"/><rect x="8" y="12" width="10" height="2" fill="#e0e0e0"/><rect x="10" y="14" width="6" height="2" fill="#a0a0a0"/><rect x="12" y="16" width="2" height="2" fill="#808080"/><rect x="12" y="10" width="2" height="2" fill="#ff6060"/></>),
  w_warcry: (<><rect x="12" y="10" width="2" height="2" fill="#80f0ff"/><rect x="10" y="8" width="6" height="2" fill="#60d8e8" opacity=".7"/><rect x="8" y="6" width="10" height="2" fill="#40c0d0" opacity=".5"/><rect x="6" y="14" width="14" height="2" fill="#40c0d0" opacity=".5"/></>),
  w_ironwall: (<><rect x="8" y="4" width="10" height="2" fill="#60e8ff"/><rect x="6" y="6" width="14" height="10" fill="#3098c0"/><rect x="8" y="8" width="10" height="6" fill="#40b0d8"/><rect x="12" y="8" width="2" height="6" fill="#80e8ff"/><rect x="8" y="16" width="10" height="2" fill="#2080a0"/></>),
  w_fury: (<><rect x="12" y="4" width="2" height="2" fill="#80ffff"/><rect x="10" y="6" width="6" height="2" fill="#60e8e0"/><rect x="8" y="8" width="10" height="4" fill="#40d0c0"/><rect x="8" y="12" width="10" height="2" fill="#30b0a0"/><rect x="10" y="14" width="6" height="2" fill="#209888"/><rect x="12" y="10" width="2" height="2" fill="#ffffff"/></>),
  w_armorbreak: (<><rect x="8" y="6" width="10" height="2" fill="#c040ff"/><rect x="6" y="8" width="14" height="8" fill="#9020d0"/><rect x="8" y="8" width="2" height="8" fill="#b030e8" opacity=".7"/><rect x="8" y="8" width="10" height="2" fill="#b030e8" opacity=".5"/><rect x="10" y="10" width="6" height="4" fill="transparent"/></>),
  w_revenge: (<><rect x="6" y="10" width="10" height="4" fill="#f06050"/><rect x="16" y="8" width="2" height="2" fill="#ff7060"/><rect x="16" y="14" width="2" height="2" fill="#ff7060"/><rect x="18" y="10" width="2" height="4" fill="#ff8070"/></>),
  w_roar: (<><rect x="4" y="8" width="18" height="2" fill="#40e0ff"/><rect x="4" y="14" width="18" height="2" fill="#30c8e8" opacity=".8"/><rect x="6" y="10" width="14" height="2" fill="#20b0d0" opacity=".5"/></>),
  w_lifefurnace: (<><rect x="10" y="6" width="2" height="2" fill="#60f0ff"/><rect x="14" y="6" width="2" height="2" fill="#60f0ff"/><rect x="8" y="8" width="4" height="4" fill="#40d0e0"/><rect x="14" y="8" width="4" height="4" fill="#40d0e0"/><rect x="12" y="10" width="2" height="2" fill="#80ffff"/><rect x="10" y="12" width="6" height="4" fill="#30b0c0"/><rect x="12" y="16" width="2" height="2" fill="#2098a8"/></>),
  w_execute: (<><rect x="12" y="4" width="2" height="14" fill="#ff4080"/><rect x="6" y="6" width="6" height="6" fill="#d02060"/><rect x="14" y="6" width="6" height="6" fill="#d02060"/><rect x="8" y="8" width="2" height="2" fill="#ff60a0"/><rect x="16" y="8" width="2" height="2" fill="#ff60a0"/></>),
  w_leech: (<><rect x="10" y="8" width="6" height="2" fill="#80e0ff"/><rect x="8" y="10" width="10" height="4" fill="#50c0e0"/><rect x="10" y="14" width="6" height="2" fill="#80e0ff"/><rect x="12" y="10" width="2" height="4" fill="#ffffff"/></>),
  w_titanfist: (<><rect x="8" y="10" width="10" height="8" fill="#2060e0"/><rect x="10" y="6" width="2" height="6" fill="#3080f0"/><rect x="12" y="4" width="2" height="8" fill="#40a0ff"/><rect x="14" y="6" width="2" height="6" fill="#3080f0"/><rect x="16" y="8" width="2" height="4" fill="#1850c0"/></>),
  w_unyielding: (<><rect x="10" y="4" width="6" height="2" fill="#a0f0ff"/><rect x="8" y="6" width="10" height="8" fill="#60a8d8"/><rect x="10" y="8" width="6" height="4" fill="#80c8f0"/><rect x="12" y="14" width="2" height="4" fill="#a0f0ff"/></>),
  w_warhammer: (<><rect x="12" y="10" width="2" height="10" fill="#4080ff"/><rect x="6" y="4" width="14" height="6" fill="#3060e0"/><rect x="8" y="6" width="10" height="2" fill="#60a0ff"/></>),
  w_bloodblade: (<><rect x="12" y="4" width="2" height="10" fill="#40c0ff"/><rect x="11" y="4" width="4" height="2" fill="#60d8ff"/><rect x="8" y="14" width="10" height="2" fill="#2090d0"/><rect x="10" y="16" width="6" height="2" fill="#1070b0"/></>),
  w_giantshield: (<><rect x="6" y="4" width="14" height="2" fill="#a0f0ff"/><rect x="4" y="6" width="18" height="10" fill="#5098d0"/><rect x="6" y="8" width="14" height="6" fill="#68b8e8"/><rect x="12" y="8" width="2" height="6" fill="#c0f8ff"/><rect x="8" y="10" width="10" height="2" fill="#c0f8ff" opacity=".5"/><rect x="8" y="16" width="10" height="2" fill="#3878b0"/></>),
  w_berserk: (<><rect x="10" y="6" width="2" height="2" fill="#80f0ff"/><rect x="14" y="6" width="2" height="2" fill="#80f0ff"/><rect x="8" y="8" width="4" height="4" fill="#50d0e0"/><rect x="14" y="8" width="4" height="4" fill="#50d0e0"/><rect x="12" y="10" width="2" height="2" fill="#a0ffff"/><rect x="10" y="12" width="6" height="4" fill="#30b0c0"/><rect x="12" y="6" width="2" height="12" fill="#ffffff" opacity=".4"/></>),
  w_bloodgod: (<><rect x="6" y="10" width="14" height="4" fill="#3060c0"/><rect x="8" y="8" width="10" height="2" fill="#4080e0"/><rect x="8" y="14" width="10" height="2" fill="#4080e0"/><rect x="12" y="6" width="2" height="12" fill="#60a0ff"/><rect x="12" y="10" width="2" height="4" fill="#ffffff"/></>),
  w_overlord: (<><rect x="6" y="4" width="14" height="4" fill="#4080e0"/><rect x="4" y="8" width="18" height="8" fill="#3060c0"/><rect x="6" y="10" width="14" height="2" fill="#5098e0"/><rect x="10" y="12" width="6" height="2" fill="#70b8ff"/><rect x="6" y="16" width="14" height="2" fill="#2048a0"/></>),
  // --- 法师 (20) ---
  mage_elemental: (<><rect x="6" y="6" width="4" height="4" fill="#ff9030"/><rect x="16" y="6" width="4" height="4" fill="#50d8ff"/><rect x="6" y="14" width="4" height="4" fill="#90ff40"/><rect x="16" y="14" width="4" height="4" fill="#ff60b0"/><rect x="11" y="11" width="4" height="2" fill="#ffe040"/></>),
  mage_reverse: (<><rect x="14" y="6" width="4" height="2" fill="#ff8040"/><rect x="16" y="8" width="2" height="4" fill="#ff6830"/><rect x="12" y="10" width="4" height="2" fill="#ff5020"/><rect x="8" y="12" width="2" height="4" fill="#ff6830"/><rect x="8" y="16" width="4" height="2" fill="#ff8040"/></>),
  mage_missile: (<><rect x="8" y="6" width="4" height="4" fill="#ff6040"/><rect x="16" y="8" width="2" height="2" fill="#ff4830" opacity=".7"/><rect x="10" y="14" width="6" height="4" fill="#ff3018" opacity=".6"/></>),
  mage_barrier: (<><rect x="12" y="4" width="2" height="2" fill="#ffe040"/><rect x="8" y="6" width="2" height="2" fill="#ffd030"/><rect x="16" y="6" width="2" height="2" fill="#ffd030"/><rect x="6" y="8" width="2" height="6" fill="#ffc020"/><rect x="18" y="8" width="2" height="6" fill="#ffc020"/><rect x="8" y="14" width="2" height="2" fill="#ffd030"/><rect x="16" y="14" width="2" height="2" fill="#ffd030"/><rect x="12" y="16" width="2" height="2" fill="#ffe040"/></>),
  mage_meditate: (<><rect x="12" y="6" width="2" height="2" fill="#ffe080"/><rect x="10" y="8" width="2" height="2" fill="#ffd060" opacity=".5"/><rect x="14" y="8" width="2" height="2" fill="#ffd060" opacity=".5"/><rect x="8" y="10" width="10" height="4" fill="#ffc040"/><rect x="6" y="14" width="4" height="4" fill="#ffb030" opacity=".6"/><rect x="16" y="14" width="4" height="4" fill="#ffb030" opacity=".6"/></>),
  mage_amplify: (<><rect x="12" y="4" width="2" height="2" fill="#ff8040"/><rect x="10" y="6" width="2" height="2" fill="#ff6830"/><rect x="14" y="6" width="2" height="2" fill="#ff6830"/><rect x="8" y="8" width="10" height="2" fill="#ff5020"/><rect x="10" y="10" width="6" height="8" fill="#ff3810"/><rect x="12" y="12" width="2" height="4" fill="#ff8040"/></>),
  mage_mirror: (<><rect x="12" y="4" width="2" height="16" fill="#ffe040"/><rect x="6" y="8" width="4" height="6" fill="#ffd030" opacity=".5"/><rect x="16" y="8" width="4" height="6" fill="#ffd030" opacity=".5"/></>),
  mage_crystal: (<><rect x="12" y="4" width="2" height="2" fill="#ffe040"/><rect x="10" y="6" width="2" height="2" fill="#ffd030"/><rect x="14" y="6" width="2" height="2" fill="#ffd030"/><rect x="8" y="8" width="2" height="6" fill="#ffc020"/><rect x="16" y="8" width="2" height="6" fill="#ffc020"/><rect x="10" y="14" width="2" height="2" fill="#ffd030"/><rect x="14" y="14" width="2" height="2" fill="#ffd030"/><rect x="12" y="16" width="2" height="2" fill="#ffe040"/><rect x="12" y="10" width="2" height="2" fill="#ffffff"/></>),
  mage_temporal: (<><rect x="8" y="4" width="8" height="2" fill="#ffe060"/><rect x="10" y="6" width="4" height="2" fill="#ffd050"/><rect x="12" y="8" width="2" height="2" fill="#ffc040"/><rect x="10" y="10" width="4" height="2" fill="#ffd050"/><rect x="8" y="12" width="8" height="2" fill="#ffe060"/><rect x="10" y="14" width="4" height="2" fill="#ffd050"/><rect x="8" y="16" width="8" height="2" fill="#ffe060"/></>),
  mage_prism: (<><rect x="12" y="4" width="2" height="2" fill="#ff60a0"/><rect x="10" y="6" width="2" height="2" fill="#ff4090"/><rect x="14" y="6" width="2" height="2" fill="#ff4090"/><rect x="8" y="8" width="2" height="2" fill="#ff2080"/><rect x="16" y="8" width="2" height="2" fill="#ff2080"/><rect x="6" y="16" width="14" height="2" fill="#ff2080"/></>),
  mage_resonance: (<><rect x="12" y="10" width="2" height="2" fill="#ffe040"/><rect x="10" y="8" width="6" height="2" fill="#ffd030" opacity=".6"/><rect x="8" y="6" width="10" height="2" fill="#ffc020" opacity=".4"/><rect x="8" y="14" width="10" height="2" fill="#ffc020" opacity=".4"/></>),
  mage_devour: (<><rect x="8" y="8" width="10" height="8" fill="#ff3010"/><rect x="10" y="10" width="6" height="4" fill="#ff4820"/><rect x="12" y="10" width="2" height="4" fill="#ff6030"/><rect x="12" y="12" width="2" height="2" fill="#ffffff"/></>),
  mage_purify: (<><rect x="12" y="4" width="2" height="16" fill="#ffe060"/><rect x="4" y="10" width="18" height="2" fill="#ffe060"/><rect x="12" y="10" width="2" height="2" fill="#ffffff"/></>),
  mage_surge: (<><rect x="12" y="4" width="2" height="2" fill="#ff6040"/><rect x="12" y="6" width="2" height="4" fill="#ff4830"/><rect x="10" y="10" width="6" height="2" fill="#ff3020"/><rect x="12" y="12" width="2" height="6" fill="#ff2010"/></>),
  mage_elemstorm: (<><rect x="8" y="6" width="4" height="4" fill="#ff6030"/><rect x="14" y="8" width="4" height="4" fill="#60d0ff"/><rect x="10" y="14" width="4" height="4" fill="#60ff80"/><rect x="12" y="10" width="2" height="2" fill="#ffffff"/></>),
  mage_burnecho: (<><rect x="6" y="10" width="14" height="4" fill="#ff3050"/><rect x="8" y="8" width="10" height="2" fill="#ff1840"/><rect x="8" y="14" width="10" height="2" fill="#ff1840"/><rect x="12" y="6" width="2" height="12" fill="#ff4870"/><rect x="12" y="10" width="2" height="4" fill="#ffffff"/></>),
  mage_star: (<><rect x="12" y="4" width="2" height="2" fill="#ffe060"/><rect x="10" y="6" width="2" height="2" fill="#ffd050"/><rect x="14" y="6" width="2" height="2" fill="#ffd050"/><rect x="6" y="8" width="14" height="2" fill="#ffc040"/><rect x="8" y="10" width="2" height="2" fill="#ffd050"/><rect x="16" y="10" width="2" height="2" fill="#ffd050"/><rect x="10" y="12" width="2" height="2" fill="#ffe060"/><rect x="14" y="12" width="2" height="2" fill="#ffe060"/><rect x="8" y="14" width="2" height="2" fill="#ffd050"/><rect x="16" y="14" width="2" height="2" fill="#ffd050"/></>),
  mage_frostecho: (<><rect x="12" y="4" width="2" height="2" fill="#ffe040"/><rect x="8" y="6" width="10" height="2" fill="#ffd030"/><rect x="6" y="8" width="14" height="6" fill="#ffc020"/><rect x="8" y="10" width="10" height="2" fill="#ffe040"/><rect x="10" y="14" width="6" height="4" fill="#ffb010"/></>),
  mage_meteor: (<><rect x="12" y="10" width="6" height="6" fill="#ff5040"/><rect x="14" y="12" width="2" height="2" fill="#ffffff"/><rect x="6" y="4" width="2" height="2" fill="#ff7060"/><rect x="8" y="6" width="2" height="2" fill="#ff6050"/><rect x="10" y="8" width="2" height="2" fill="#ff5040"/><rect x="4" y="8" width="2" height="2" fill="#ff4030" opacity=".5"/><rect x="8" y="4" width="2" height="2" fill="#ff4030" opacity=".5"/></>),
  mage_elemheart: (<><rect x="10" y="8" width="6" height="6" fill="#ff8050"/><rect x="12" y="10" width="2" height="2" fill="#ffffff"/><rect x="12" y="4" width="2" height="4" fill="#ffa060"/><rect x="12" y="14" width="2" height="4" fill="#ffa060"/><rect x="4" y="10" width="6" height="2" fill="#ffa060"/><rect x="16" y="10" width="6" height="2" fill="#ffa060"/></>),
  // --- 盗贼 (20) ---
  r_envenom: (<><rect x="12" y="4" width="2" height="2" fill="#e040ff"/><rect x="10" y="6" width="6" height="2" fill="#c830e0"/><rect x="8" y="8" width="10" height="2" fill="#b020c0"/><rect x="8" y="10" width="10" height="4" fill="#c830e0"/><rect x="10" y="14" width="6" height="2" fill="#b020c0"/><rect x="12" y="16" width="2" height="2" fill="#9010a0"/><rect x="12" y="10" width="2" height="2" fill="#ff80ff"/></>),
  r_throwing: (<><rect x="12" y="4" width="2" height="16" fill="#ff8040"/><rect x="4" y="12" width="18" height="2" fill="#ff8040"/><rect x="12" y="12" width="2" height="2" fill="#ffe0c0"/></>),
  r_pursuit: (<><rect x="12" y="4" width="2" height="2" fill="#ff6080"/><rect x="10" y="6" width="2" height="2" fill="#ff4870"/><rect x="14" y="6" width="2" height="2" fill="#ff4870"/><rect x="8" y="8" width="2" height="2" fill="#ff3060"/><rect x="16" y="8" width="2" height="2" fill="#ff3060"/><rect x="12" y="12" width="2" height="2" fill="#ff6080"/><rect x="10" y="14" width="2" height="2" fill="#ff4870"/><rect x="14" y="14" width="2" height="2" fill="#ff4870"/><rect x="8" y="16" width="2" height="2" fill="#ff3060"/><rect x="16" y="16" width="2" height="2" fill="#ff3060"/></>),
  r_sleeve: (<>{[{x:16,y:4},{x:16,y:6},{x:14,y:8},{x:12,y:10},{x:10,y:12},{x:8,y:14},{x:6,y:16}].map((p,i)=><rect key={i} x={p.x} y={p.y} width="2" height="2" fill="#e0a0ff"/>)}<rect x="16" y="4" width="4" height="2" fill="#ffc0ff"/></>),
  r_quickdraw: (<><rect x="6" y="10" width="10" height="4" fill="#ff8040"/><rect x="18" y="10" width="2" height="4" fill="#ffc090"/><rect x="16" y="8" width="2" height="2" fill="#ffa060"/><rect x="16" y="14" width="2" height="2" fill="#ffa060"/><rect x="4" y="10" width="4" height="4" fill="#ff6020"/></>),
  r_combomastery: (<><rect x="12" y="4" width="2" height="2" fill="#ff4080"/><rect x="10" y="6" width="2" height="2" fill="#e83070"/><rect x="14" y="6" width="2" height="2" fill="#e83070"/><rect x="8" y="8" width="2" height="2" fill="#d02060"/><rect x="16" y="8" width="2" height="2" fill="#d02060"/><rect x="12" y="12" width="2" height="2" fill="#ff4080"/><rect x="10" y="14" width="2" height="2" fill="#e83070"/><rect x="14" y="14" width="2" height="2" fill="#e83070"/></>),
  r_toxblade: (<>{[{x:16,y:4},{x:14,y:6},{x:12,y:8},{x:10,y:10},{x:8,y:12},{x:8,y:14}].map((p,i)=><rect key={i} x={p.x} y={p.y} width="2" height="2" fill={`rgb(${255-i*20},${80-i*8},${255-i*12})`}/>)}<rect x="16" y="16" width="2" height="2" fill="#ff80ff"/><rect x="16" y="18" width="2" height="2" fill="#e060e0"/></>),
  r_shadow_clone: (<><rect x="6" y="8" width="4" height="8" fill="#e060a0"/><rect x="7" y="9" width="2" height="2" fill="#ff80c0"/><rect x="16" y="8" width="4" height="8" fill="#c04080"/><rect x="17" y="9" width="2" height="2" fill="#e060a0"/></>),
  r_boomerang: (<>{[{x:6,y:16},{x:6,y:14},{x:6,y:12},{x:8,y:10},{x:10,y:8},{x:12,y:6},{x:14,y:6},{x:16,y:8},{x:18,y:10},{x:18,y:12}].map((p,i)=><rect key={i} x={p.x} y={p.y} width="2" height="2" fill={`rgb(${255-i*8},${120+i*8},${40+i*12})`}/>)}</>),
  r_corrosion: (<><rect x="8" y="8" width="4" height="4" fill="#e060ff"/><rect x="16" y="12" width="4" height="4" fill="#d040e0"/><rect x="10" y="14" width="4" height="4" fill="#c030d0"/></>),
  r_venomfang: (<><rect x="8" y="6" width="2" height="2" fill="#ff80d0"/><rect x="8" y="8" width="2" height="4" fill="#e060c0"/><rect x="8" y="12" width="2" height="4" fill="#c040a0"/><rect x="16" y="6" width="2" height="2" fill="#ff90e0"/><rect x="16" y="8" width="2" height="4" fill="#e070d0"/><rect x="16" y="12" width="2" height="4" fill="#c050b0"/></>),
  r_tripleflash: (<><rect x="6" y="8" width="2" height="8" fill="#ff5040"/><rect x="12" y="6" width="2" height="12" fill="#ff8060"/><rect x="18" y="8" width="2" height="8" fill="#ff5040"/></>),
  r_shadowdance: (<>{[{x:8,y:4},{x:12,y:6},{x:16,y:8},{x:16,y:10},{x:12,y:12},{x:8,y:14},{x:8,y:16},{x:12,y:18}].map((p,i)=><rect key={i} x={p.x} y={p.y} width="2" height="2" fill={`rgb(${255-i*8},${80+i*10},${200-i*8})`}/>)}</>),
  r_plaguedet: (<><rect x="10" y="10" width="6" height="4" fill="#a060d0"/><rect x="12" y="4" width="2" height="6" fill="#7038a0"/><rect x="12" y="14" width="2" height="6" fill="#7038a0"/><rect x="4" y="12" width="6" height="2" fill="#7038a0"/><rect x="16" y="12" width="6" height="2" fill="#7038a0"/><rect x="12" y="12" width="2" height="2" fill="#c060e0"/></>),
  r_phantom: (<><rect x="10" y="6" width="6" height="2" fill="#90b8b0"/><rect x="16" y="8" width="2" height="2" fill="#80a8a0"/><rect x="12" y="10" width="4" height="2" fill="#709888"/><rect x="12" y="12" width="2" height="2" fill="#609080"/><rect x="12" y="16" width="2" height="2" fill="#b0d0c8"/></>),
  r_purifyblade: (<><rect x="6" y="6" width="6" height="12" fill="#c0e0d0"/><rect x="12" y="6" width="6" height="12" fill="#283830"/><rect x="10" y="10" width="4" height="2" fill="#283830"/><rect x="12" y="14" width="4" height="2" fill="#c0e0d0"/></>),
  r_deathtouch: (<><rect x="12" y="6" width="2" height="12" fill="#504840"/><rect x="14" y="4" width="4" height="2" fill="#808888"/><rect x="18" y="6" width="2" height="2" fill="#a0a8a8"/><rect x="16" y="8" width="2" height="2" fill="#707878"/><rect x="8" y="16" width="4" height="2" fill="#603020"/></>),
  r_bladestorm: (<><rect x="12" y="4" width="2" height="6" fill="#40c060"/><rect x="16" y="12" width="6" height="2" fill="#38b058"/><rect x="12" y="16" width="2" height="6" fill="#309848"/><rect x="4" y="12" width="6" height="2" fill="#288838"/><rect x="12" y="12" width="2" height="2" fill="#80ffa0"/></>),
  temp_rogue: (<><rect x="8" y="8" width="10" height="8" fill="#308040" opacity=".4"/><rect x="10" y="10" width="6" height="4" fill="#50c060" opacity=".3"/><rect x="8" y="8" width="2" height="2" fill="#40a050"/><rect x="16" y="8" width="2" height="2" fill="#40a050"/><rect x="8" y="14" width="2" height="2" fill="#40a050"/><rect x="16" y="14" width="2" height="2" fill="#40a050"/></>),
};

/** 检查是否支持像素渲染 */
export const hasPixelRenderer = (diceDefId: string): boolean => !!DICE_COLORS[diceDefId];

// 元素坍缩配色 — 打破职业色系框架
const ELEMENT_COLORS: Record<string, DiceColorScheme> = {
  fire:    { border: '#682010', outer: '#984020', inner: '#c06030', highlight: '#ff9050', shadow: '#481008', digit: '#fff0c0', digitShadow: '#601810' },
  ice:     { border: '#103050', outer: '#184870', inner: '#286898', highlight: '#60b8e0', shadow: '#082040', digit: '#d0f0ff', digitShadow: '#102840' },
  thunder: { border: '#484010', outer: '#686018', inner: '#988828', highlight: '#e0d040', shadow: '#303008', digit: '#fffff0', digitShadow: '#484010' },
  poison:  { border: '#183818', outer: '#285828', inner: '#389838', highlight: '#60e060', shadow: '#102810', digit: '#c0ffc0', digitShadow: '#183018' },
  holy:    { border: '#484030', outer: '#686050', inner: '#989078', highlight: '#e0d8b8', shadow: '#303020', digit: '#fffff0', digitShadow: '#484030' },
  shadow:  { border: '#181020', outer: '#281838', inner: '#382848', highlight: '#604878', shadow: '#100818', digit: '#c0a0e0', digitShadow: '#181020' },
};
// 元素坍缩图案
const ELEMENT_PATTERNS: Record<string, React.ReactNode> = {
  fire: (<><rect x="10" y="4" width="4" height="2" fill="#ff9050"/><rect x="8" y="6" width="8" height="2" fill="#e07030"/><rect x="6" y="8" width="12" height="4" fill="#c05820"/><rect x="8" y="12" width="8" height="4" fill="#ff8040"/><rect x="10" y="16" width="4" height="2" fill="#e06020"/><rect x="11" y="8" width="2" height="4" fill="#ffc060"/></>),
  ice: (<><rect x="11" y="4" width="2" height="14" fill="#60b8e0"/><rect x="5" y="10" width="14" height="2" fill="#60b8e0"/><rect x="7" y="6" width="2" height="2" fill="#80d0f0"/><rect x="15" y="6" width="2" height="2" fill="#80d0f0"/><rect x="7" y="14" width="2" height="2" fill="#80d0f0"/><rect x="15" y="14" width="2" height="2" fill="#80d0f0"/></>),
  thunder: (<><rect x="12" y="4" width="4" height="2" fill="#e0d040"/><rect x="10" y="6" width="4" height="2" fill="#d0c030"/><rect x="8" y="8" width="6" height="2" fill="#f0e050"/><rect x="10" y="10" width="4" height="2" fill="#e0d040"/><rect x="12" y="12" width="4" height="2" fill="#d0c030"/><rect x="10" y="14" width="4" height="2" fill="#c0b020"/><rect x="10" y="16" width="2" height="2" fill="#b0a010"/></>),
  poison: (<><rect x="10" y="4" width="4" height="2" fill="#50d050"/><rect x="8" y="6" width="8" height="2" fill="#40c040"/><rect x="6" y="8" width="12" height="4" fill="#38a838"/><rect x="8" y="12" width="8" height="4" fill="#48c848"/><rect x="10" y="16" width="4" height="2" fill="#30a030"/><rect x="10" y="10" width="4" height="2" fill="#70ff70"/></>),
  holy: (<><rect x="11" y="4" width="2" height="14" fill="#e0d8a0"/><rect x="6" y="9" width="12" height="4" fill="#e0d8a0"/><rect x="9" y="7" width="6" height="2" fill="#d0c890" opacity=".5"/><rect x="9" y="14" width="6" height="2" fill="#d0c890" opacity=".5"/></>),
  shadow: (<><rect x="8" y="8" width="8" height="8" fill="#382848"/><rect x="6" y="6" width="6" height="6" fill="#281838" opacity=".6"/><rect x="12" y="12" width="6" height="6" fill="#201030" opacity=".4"/><rect x="10" y="10" width="4" height="4" fill="#604878"/></>),
};

/** 渲染像素风骰子 */
export const PixelDiceRenderer: React.FC<{
  diceDefId: string; value: number | string;
  size?: number; selected?: boolean; rolling?: boolean;
  element?: string; // 传入元素类型，坍缩后覆盖配色
}> = React.memo(({ diceDefId, value, size = 56, selected = false, rolling = false, element }) => {
  // 元素骰子坍缩后使用元素配色（打破职业色系）
  const elementColors = element && element !== 'normal' ? ELEMENT_COLORS[element] : null;
  const colors = elementColors || DICE_COLORS[diceDefId];
  if (!colors) return null;
  const pattern = elementColors ? ELEMENT_PATTERNS[element!] : P[diceDefId];
  return <PixelDiceBody colors={colors} value={rolling ? '?' : value} pattern={pattern} size={size} selected={selected} />;
});
PixelDiceRenderer.displayName = 'PixelDiceRenderer';