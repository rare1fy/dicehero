/**
 * mapPhaseHelper.ts - Helper to determine correct map phase based on mapMode
 */

import type { GameState } from '../types/game';

/** Returns the correct map phase string based on current mapMode */
export function getMapPhase(state: GameState): GameState['phase'] {
  return state.mapMode === 'loop_floor' ? 'loopMap' : 'map';
}
