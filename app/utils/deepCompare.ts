/**
 * Deep comparison utility for game settings
 */
export function deepEqual<T>(obj1: T, obj2: T): boolean {
  if (obj1 === obj2) {
    return true;
  }

  if (obj1 == null || obj2 == null) {
    return obj1 === obj2;
  }

  if (typeof obj1 !== 'object' || typeof obj2 !== 'object') {
    return obj1 === obj2;
  }

  const keys1 = Object.keys(obj1 as object);
  const keys2 = Object.keys(obj2 as object);

  if (keys1.length !== keys2.length) {
    return false;
  }

  for (const key of keys1) {
    if (!keys2.includes(key)) {
      return false;
    }

    const val1 = (obj1 as any)[key];
    const val2 = (obj2 as any)[key];

    if (!deepEqual(val1, val2)) {
      return false;
    }
  }

  return true;
}

/**
 * Specific comparison function for GameSettings
 */
import { GameSettings } from '../models/Game';

export function compareGameSettings(settings1: GameSettings | undefined, settings2: GameSettings | undefined): boolean {
  if (!settings1 && !settings2) {
    return true;
  }
  
  if (!settings1 || !settings2) {
    return false;
  }

  return settings1.maxMovesPerPeriod === settings2.maxMovesPerPeriod && 
         settings1.pieceCooldownSeconds === settings2.pieceCooldownSeconds &&
         settings1.enableRandomPieceGeneration === settings2.enableRandomPieceGeneration &&
         settings1.enableHitPointsSystem === settings2.enableHitPointsSystem;
} 