"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deepEqual = deepEqual;
exports.compareGameSettings = compareGameSettings;
/**
 * Deep comparison utility for game settings
 */
function deepEqual(obj1, obj2) {
    if (obj1 === obj2) {
        return true;
    }
    if (obj1 == null || obj2 == null) {
        return obj1 === obj2;
    }
    if (typeof obj1 !== 'object' || typeof obj2 !== 'object') {
        return obj1 === obj2;
    }
    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);
    if (keys1.length !== keys2.length) {
        return false;
    }
    for (const key of keys1) {
        if (!keys2.includes(key)) {
            return false;
        }
        const val1 = obj1[key];
        const val2 = obj2[key];
        if (!deepEqual(val1, val2)) {
            return false;
        }
    }
    return true;
}
function compareGameSettings(settings1, settings2) {
    if (!settings1 && !settings2) {
        return true;
    }
    if (!settings1 || !settings2) {
        return false;
    }
    return settings1.maxMovesPerPeriod === settings2.maxMovesPerPeriod &&
        settings1.pieceCooldownSeconds === settings2.pieceCooldownSeconds;
}
