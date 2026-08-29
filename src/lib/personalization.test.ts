import { beforeEach, describe, expect, it, vi } from "vitest";
import { loadPrefs, PREFS_UPDATED_EVENT, savePrefs, type Prefs } from "./personalization";

describe("personalization preferences", () => {
  beforeEach(() => localStorage.clear());

  it("notifies the mounted Home screen immediately after onboarding saves preferences", () => {
    const prefs: Prefs = {
      moods: ["discover"],
      activities: ["culture"],
      region: "incheon",
    };
    const listener = vi.fn();
    window.addEventListener(PREFS_UPDATED_EVENT, listener);

    savePrefs(prefs);

    expect(loadPrefs()).toEqual(prefs);
    expect(listener).toHaveBeenCalledOnce();
    expect((listener.mock.calls[0][0] as CustomEvent<Prefs>).detail).toEqual(prefs);
    window.removeEventListener(PREFS_UPDATED_EVENT, listener);
  });
});
