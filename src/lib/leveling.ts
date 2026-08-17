const XP_PER_LEVEL = 150;

export interface LevelInfo {
  level: number;
  currentLevelXp: number;
  xpToNext: number;
  progressPct: number;
}

export function levelFromXp(totalXp: number): LevelInfo {
  const safeXp = Math.max(0, totalXp);
  const level = Math.floor(safeXp / XP_PER_LEVEL) + 1;
  const currentLevelXp = safeXp % XP_PER_LEVEL;

  return {
    level,
    currentLevelXp,
    xpToNext: XP_PER_LEVEL,
    progressPct: Math.round((currentLevelXp / XP_PER_LEVEL) * 100),
  };
}

const LEVEL_TITLES = ["Newcomer", "Wanderer", "Explorer", "Adventurer", "Trailblazer", "K-Master"];

export function levelTitle(level: number): string {
  return LEVEL_TITLES[Math.min(level - 1, LEVEL_TITLES.length - 1)];
}
