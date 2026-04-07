/**
 * loopFloorGenerator.ts - Loop Floor Map Generator
 *
 * Generates all floors for a chapter, assigns themes, fills tile templates.
 * Coexists with old mapGenerator.ts, switched via mapMode.
 */

import { LoopFloor, LoopFloorTile, LoopFloorTheme, FloorObjective } from '../types/game';
import {
  TILES_PER_FLOOR,
  STANDARD_TILE_TEMPLATES,
  THEME_POOL,
  CHAPTER_FLOOR_DEFS,
  DEFAULT_OBJECTIVE,
} from '../config/loopFloors';

// ============================================================
// Utility Functions
// ============================================================

function pickWeightedTheme(): LoopFloorTheme {
  const totalWeight = THEME_POOL.reduce((sum, t) => sum + t.weight, 0);
  let roll = Math.random() * totalWeight;
  for (const entry of THEME_POOL) {
    roll -= entry.weight;
    if (roll <= 0) return entry.theme;
  }
  return THEME_POOL[0].theme;
}

function pickThemeAvoidRepeat(prevTheme: LoopFloorTheme | null): LoopFloorTheme {
  let attempts = 0;
  let theme = pickWeightedTheme();
  while (theme === prevTheme && attempts < 10) {
    theme = pickWeightedTheme();
    attempts++;
  }
  return theme;
}

// ============================================================
// Single Floor Generation
// ============================================================

function generateFloorTiles(theme: LoopFloorTheme): LoopFloorTile[] {
  const template = STANDARD_TILE_TEMPLATES[theme] || STANDARD_TILE_TEMPLATES.forge;
  const tiles: LoopFloorTile[] = [];

  for (let i = 0; i < TILES_PER_FLOOR; i++) {
    const tileType = template[i] || 'battle';
    tiles.push({
      id: '',
      index: i,
      type: tileType,
      resolved: false,
      visitCount: 0,
      battleSeed: tileType === 'battle' || tileType === 'boss_battle'
        ? Math.floor(Math.random() * 100000)
        : undefined,
      themeTag: tileType === 'theme' ? theme : undefined,
    });
  }

  return tiles;
}

function createObjective(): FloorObjective {
  return {
    type: DEFAULT_OBJECTIVE.type,
    target: DEFAULT_OBJECTIVE.target,
    current: 0,
    description: DEFAULT_OBJECTIVE.description,
  };
}

// ============================================================
// Generate All Floors for a Chapter
// ============================================================

export function generateLoopFloors(chapter: number): LoopFloor[] {
  const floors: LoopFloor[] = [];
  let prevTheme: LoopFloorTheme | null = null;

  for (let fi = 0; fi < CHAPTER_FLOOR_DEFS.length; fi++) {
    const def = CHAPTER_FLOOR_DEFS[fi];

    let theme: LoopFloorTheme;
    if (def.forcedTheme) {
      theme = def.forcedTheme;
    } else {
      theme = pickThemeAvoidRepeat(prevTheme);
    }
    prevTheme = theme;

    const tiles = generateFloorTiles(theme);
    const floorId = 'floor-' + chapter + '-' + fi;

    tiles.forEach((tile, idx) => {
      tile.id = floorId + '-tile-' + idx;
    });

    const entryIdx = tiles.findIndex(t => t.type === 'entry');
    const exitIdx = tiles.findIndex(t => t.type === 'exit');

    const floor: LoopFloor = {
      id: floorId,
      floorIndex: fi,
      theme,
      tiles,
      entryTileIndex: entryIdx >= 0 ? entryIdx : 0,
      exitTileIndex: exitIdx >= 0 ? exitIdx : TILES_PER_FLOOR - 1,
      objective: createObjective(),
      isExitOpen: false,
      completed: false,
      totalMovePoints: 0,
      battleCount: 0,
      settlementSeed: Math.floor(Math.random() * 100000),
    };

    floors.push(floor);
  }

  return floors;
}

/**
 * Roll movement dice (1~3 uniform)
 */
export function rollMoveDice(): number {
  const min = 1;
  const max = 3;
  return min + Math.floor(Math.random() * (max - min + 1));
}

/**
 * Calculate target tile index after move (circular)
 */
export function getTargetTileIndex(currentIndex: number, steps: number, totalTiles: number): number {
  return (currentIndex + steps) % totalTiles;
}

/**
 * Check if exit should open
 */
export function checkExitCondition(floor: LoopFloor): boolean {
  return floor.objective.current >= floor.objective.target;
}
