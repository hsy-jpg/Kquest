import { useCallback, useEffect, useState } from "react";
import type { Quest } from "@/data/quests";
import type { QuestRoute } from "@/data/questRoutes";

const STORAGE_KEY = "kquest-trip-board-v1";
const CHANGE_EVENT = "kquest-trip-board-change";
export const TRIP_DAYS = [1, 2, 3] as const;
export type TripDay = typeof TRIP_DAYS[number];

export interface SavedQuest {
  kind: "quest" | "route";
  key: string;
  id: string;
  title: string;
  subtitle: string;
  image: string;
  category: string;
  location: string;
  time: string;
  path: string;
}

interface TripBoardState {
  saved: SavedQuest[];
  schedule: Record<TripDay, string[]>;
}

const emptyState = (): TripBoardState => ({ saved: [], schedule: { 1: [], 2: [], 3: [] } });

const readState = (): TripBoardState => {
  if (typeof window === "undefined") return emptyState();
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null") as Partial<TripBoardState> | null;
    return {
      saved: Array.isArray(parsed?.saved) ? parsed.saved : [],
      schedule: {
        1: Array.isArray(parsed?.schedule?.[1]) ? parsed.schedule[1] : [],
        2: Array.isArray(parsed?.schedule?.[2]) ? parsed.schedule[2] : [],
        3: Array.isArray(parsed?.schedule?.[3]) ? parsed.schedule[3] : [],
      },
    };
  } catch { return emptyState(); }
};

const writeState = (state: TripBoardState) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
};

export const savedQuestFrom = (quest: Quest): SavedQuest => {
  const databaseId = "databaseId" in quest ? String((quest as Quest & { databaseId: string }).databaseId) : null;
  return {
    kind: "quest",
    key: databaseId ? `published:${databaseId}` : `mock:${quest.id}`,
    id: String(quest.id), title: quest.title, subtitle: quest.subtitle, image: quest.image,
    category: quest.category, location: quest.location, time: quest.time, path: `/quest/${quest.id}`,
  };
};

export const savedRouteFrom = (route: QuestRoute): SavedQuest => ({
  kind: "route", key: `route:${route.id}`, id: route.id, title: route.title, subtitle: route.subtitle,
  image: route.coverImage, category: route.theme, location: route.region, time: route.estimatedTime,
  path: `/quest-route/${route.id}`,
});

export function useTripBoard() {
  const [state, setState] = useState<TripBoardState>(readState);
  useEffect(() => {
    const sync = () => setState(readState());
    window.addEventListener(CHANGE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => { window.removeEventListener(CHANGE_EVENT, sync); window.removeEventListener("storage", sync); };
  }, []);

  const toggleSaved = useCallback((quest: Quest) => {
    const item = savedQuestFrom(quest);
    const current = readState();
    const exists = current.saved.some((saved) => saved.key === item.key);
    writeState(exists ? {
      saved: current.saved.filter((saved) => saved.key !== item.key),
      schedule: { 1: current.schedule[1].filter((key) => key !== item.key), 2: current.schedule[2].filter((key) => key !== item.key), 3: current.schedule[3].filter((key) => key !== item.key) },
    } : { ...current, saved: [item, ...current.saved] });
  }, []);

  const toggleSavedRoute = useCallback((route: QuestRoute) => {
    const item = savedRouteFrom(route);
    const current = readState();
    const exists = current.saved.some((saved) => saved.key === item.key);
    writeState(exists ? {
      saved: current.saved.filter((saved) => saved.key !== item.key),
      schedule: { 1: current.schedule[1].filter((key) => key !== item.key), 2: current.schedule[2].filter((key) => key !== item.key), 3: current.schedule[3].filter((key) => key !== item.key) },
    } : { ...current, saved: [item, ...current.saved] });
  }, []);

  const putOnDay = useCallback((key: string, day: TripDay) => {
    const current = readState();
    if (!current.saved.some((item) => item.key === key)) return;
    const schedule = { 1: current.schedule[1].filter((item) => item !== key), 2: current.schedule[2].filter((item) => item !== key), 3: current.schedule[3].filter((item) => item !== key) };
    schedule[day] = [...schedule[day], key];
    writeState({ ...current, schedule });
  }, []);

  const removeFromSchedule = useCallback((key: string) => {
    const current = readState();
    writeState({ ...current, schedule: { 1: current.schedule[1].filter((item) => item !== key), 2: current.schedule[2].filter((item) => item !== key), 3: current.schedule[3].filter((item) => item !== key) } });
  }, []);

  return {
    ...state, toggleSaved, toggleSavedRoute, putOnDay, removeFromSchedule,
    isSaved: (quest: Quest) => state.saved.some((item) => item.key === savedQuestFrom(quest).key),
    isRouteSaved: (route: QuestRoute) => state.saved.some((item) => item.key === savedRouteFrom(route).key),
  };
}
