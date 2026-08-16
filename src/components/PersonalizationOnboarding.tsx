import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ACTIVITIES, MOODS, Prefs, REGIONS, savePrefs } from "@/lib/personalization";

type Props = {
  initial?: Prefs | null;
  onDone: (p: Prefs) => void;
  onClose?: () => void;
};

const OptionButton = ({
  emoji,
  label,
  selected,
  onClick,
}: {
  emoji: string;
  label: string;
  selected: boolean;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`w-full flex items-center gap-3 rounded-2xl border px-4 py-3 text-left text-sm font-bold transition-all active:scale-[0.98] ${
      selected
        ? "border-primary bg-primary/10 text-primary shadow-sm"
        : "border-border bg-card text-foreground"
    }`}
  >
    <span className="text-lg">{emoji}</span>
    <span className="flex-1">{label}</span>
    <span
      className={`h-5 w-5 rounded-full border-2 shrink-0 ${
        selected ? "border-primary bg-primary" : "border-border"
      }`}
    />
  </button>
);

const PersonalizationOnboarding = ({ initial, onDone, onClose }: Props) => {
  const [step, setStep] = useState(0);
  const [moods, setMoods] = useState<string[]>(initial?.moods ?? []);
  const [activities, setActivities] = useState<string[]>(initial?.activities ?? []);
  const [region, setRegion] = useState<string>(initial?.region ?? "");

  const toggle = (list: string[], set: (v: string[]) => void, id: string) =>
    set(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

  const canNext = step === 0 ? moods.length > 0 : step === 1 ? activities.length > 0 : !!region;

  const next = () => {
    if (step < 2) return setStep(step + 1);
    const prefs = { moods, activities, region };
    savePrefs(prefs);
    onDone(prefs);
  };

  return (
    <div className="fixed inset-0 z-[90] bg-background/95 backdrop-blur-sm overflow-y-auto">
      <div className="mx-auto max-w-md min-h-screen flex flex-col px-5 pt-8 pb-8">
        <div className="flex items-center gap-2">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className={`h-1.5 flex-1 rounded-full ${i <= step ? "bg-primary" : "bg-muted"}`}
            />
          ))}
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="self-end mt-3 text-xs font-bold text-muted-foreground"
          >
            Close
          </button>
        )}

        <div className="mt-6 flex-1">
          {step === 0 && (
            <>
              <h1 className="text-2xl font-extrabold">How are you feeling today?</h1>
              <p className="text-sm text-muted-foreground mt-1">Select all that apply</p>
              <div className="mt-5 space-y-3">
                {MOODS.map((m) => (
                  <OptionButton
                    key={m.id}
                    emoji={m.emoji}
                    label={m.label}
                    selected={moods.includes(m.id)}
                    onClick={() => toggle(moods, setMoods, m.id)}
                  />
                ))}
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <h1 className="text-2xl font-extrabold">What do you want to do?</h1>
              <p className="text-sm text-muted-foreground mt-1">Select all that apply</p>
              <div className="mt-5 space-y-3">
                {ACTIVITIES.map((a) => (
                  <OptionButton
                    key={a.id}
                    emoji={a.emoji}
                    label={a.label}
                    selected={activities.includes(a.id)}
                    onClick={() => toggle(activities, setActivities, a.id)}
                  />
                ))}
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h1 className="text-2xl font-extrabold">Where do you want to explore?</h1>
              <p className="text-sm text-muted-foreground mt-1">Pick one</p>
              <div className="mt-5 space-y-3">
                {REGIONS.map((r) => (
                  <OptionButton
                    key={r.id}
                    emoji={r.emoji}
                    label={r.label}
                    selected={region === r.id}
                    onClick={() => setRegion(r.id)}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        <div className="sticky bottom-0 pt-4 flex gap-3">
          {step > 0 && (
            <Button
              variant="outline"
              className="rounded-xl h-13 py-3 font-bold flex-1"
              onClick={() => setStep(step - 1)}
            >
              Back
            </Button>
          )}
          <Button
            className="rounded-xl py-6 text-base font-extrabold flex-[2]"
            disabled={!canNext}
            onClick={next}
          >
            {step === 2 ? "Start Exploring" : "Next"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PersonalizationOnboarding;
