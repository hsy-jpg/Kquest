import { useState, useRef, useMemo, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Camera, RotateCcw, Send, Zap, Share2, PenLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { quests, type Quest } from "@/data/quests";
import tigerMascot from "@/assets/tiger-cheer.png";
import { usePublishedQuest } from "@/features/quests/usePublishedQuests";
import { markQuestInProgress, submitMockQuestPhoto, submitQuestPhoto } from "@/features/quests/questCompletion";
import { getItemForQuest, type WardrobeItem } from "@/data/items";
import ItemUnlock from "@/components/ItemUnlock";

type Stage = "upload" | "preview" | "item" | "complete";

const PhotoVerify = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const mockQuest = quests.find((q) => q.id === Number(id));
  const { data: publishedQuest, isLoading } = usePublishedQuest(id);
  const quest = publishedQuest ?? mockQuest;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [stage, setStage] = useState<Stage>("upload");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [rewardItem, setRewardItem] = useState<WardrobeItem | null>(null);

  useEffect(() => {
    if (!publishedQuest) return;
    void markQuestInProgress(publishedQuest.databaseId).catch((error) => {
      console.error("Could not mark Quest as in progress.", error);
    });
  }, [publishedQuest]);

  if (isLoading && !mockQuest) {
    return <div className="flex items-center justify-center h-full p-8 text-sm text-muted-foreground">Loading quest...</div>;
  }

  if (!quest) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <p className="text-4xl mb-3">😕</p>
        <p className="font-bold">Quest not found</p>
        <Button variant="ghost" className="mt-4" onClick={() => navigate("/")}>Go Home</Button>
      </div>
    );
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPhotoFile(file);
    setSubmitError(null);
    setPhotoUrl(url);
    setStage("preview");
  };

  const handleRetake = () => {
    setPhotoUrl(null);
    setPhotoFile(null);
    setSubmitError(null);
    setStage("upload");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async () => {
    if (!photoFile) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      if (publishedQuest) {
        await submitQuestPhoto(publishedQuest, photoFile);
      } else if (mockQuest) {
        await submitMockQuestPhoto(mockQuest.id, photoFile);
      }
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      setRewardItem(getItemForQuest(quest));
      setStage("item");
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Could not submit Quest proof.");
    } finally {
      setSubmitting(false);
    }
  };

  // Reward item, granted immediately after mission completion.
  if (stage === "item" && rewardItem) {
    return <ItemUnlock item={rewardItem} onDone={() => setStage("complete")} />;
  }

  // Mission Complete
  if (stage === "complete") {
    return <MissionComplete quest={quest} photoUrl={photoUrl} navigate={navigate} />;
  }

  // Preview stage
  if (stage === "preview" && photoUrl) {
    return (
      <div className="flex flex-col min-h-full">
        <div className="px-5 pt-4 pb-3 border-b border-border bg-card">
          <div className="flex items-center justify-between">
            <button
              onClick={handleRetake}
              className="flex items-center gap-1 text-sm font-bold text-muted-foreground active:opacity-70"
            >
              <ArrowLeft size={18} /> Back
            </button>
            <span className="font-bold text-sm">Review Photo</span>
            <div className="w-14" />
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-5 py-6">
          <div className="w-full max-w-sm rounded-2xl overflow-hidden border border-border shadow-lg">
            <img src={photoUrl} alt="Your photo" className="w-full aspect-[4/3] object-cover" />
          </div>
          <p className="text-sm text-muted-foreground mt-4">Does this look good?</p>
        </div>

        <div className="sticky bottom-0 bg-background/90 backdrop-blur-md border-t border-border px-5 py-4 space-y-3">
          <Button
            className="w-full rounded-xl font-extrabold h-14 text-base shadow-lg gap-2"
            onClick={handleSubmit}
            disabled={submitting}
          >
            <Send size={18} />
            {submitting ? "Submitting..." : "Submit Photo"}
          </Button>
          {submitError && <p role="alert" className="text-xs text-destructive text-center">{submitError}</p>}
          <Button
            variant="outline"
            className="w-full rounded-xl font-bold h-12 gap-2"
            onClick={handleRetake}
          >
            <RotateCcw size={16} />
            Retake
          </Button>
        </div>
      </div>
    );
  }

  // Upload stage
  return (
    <div className="flex flex-col min-h-full">
      <div className="px-5 pt-4 pb-3 border-b border-border bg-card">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(`/quest/${quest.id}/play`)}
            className="flex items-center gap-1 text-sm font-bold text-muted-foreground active:opacity-70"
          >
            <ArrowLeft size={18} /> Back
          </button>
          <span className="font-bold text-sm">Upload Photo</span>
          <div className="w-14" />
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-5 py-8">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleFileSelect}
        />

        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full max-w-sm aspect-[4/3] rounded-2xl border-2 border-dashed border-primary/30 bg-primary/5 flex flex-col items-center justify-center gap-4 transition-colors active:bg-primary/10"
        >
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Camera size={32} className="text-primary" />
          </div>
          <div>
            <p className="font-bold text-sm">Tap to upload photo</p>
            <p className="text-xs text-muted-foreground mt-1">Take a photo or choose from gallery</p>
          </div>
        </button>

        <div className="mt-6 text-center max-w-xs">
          <p className="text-sm font-bold mb-1">📸 What to capture</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {publishedQuest?.proofRequirement ?? quest.mission}
          </p>
        </div>
      </div>
    </div>
  );
};

const CONFETTI_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--xp))",
  "hsl(var(--accent))",
  "hsl(var(--success))",
  "hsl(var(--secondary))",
];

const MissionComplete = ({
  quest,
  photoUrl,
  navigate,
}: {
  quest: Quest;
  photoUrl: string | null;
  navigate: (to: string) => void;
}) => {
  const confetti = useMemo(
    () =>
      Array.from({ length: 32 }).map((_, i) => ({
        left: Math.random() * 100,
        delay: Math.random() * 0.8,
        duration: 2.2 + Math.random() * 1.2,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        size: 6 + Math.random() * 8,
        rounded: Math.random() > 0.5,
      })),
    [],
  );

  return (
    <div className="relative flex flex-col items-center min-h-full px-6 pt-8 pb-6 text-center overflow-hidden bg-gradient-to-b from-[hsl(var(--accent))]/30 via-[hsl(var(--korean-cloud))] to-background">
      {/* Confetti */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        {confetti.map((c, i) => (
          <span
            key={i}
            className="absolute top-0 block animate-confetti-fall"
            style={{
              left: `${c.left}%`,
              width: c.size,
              height: c.size,
              background: c.color,
              borderRadius: c.rounded ? "9999px" : "2px",
              animationDelay: `${c.delay}s`,
              animationDuration: `${c.duration}s`,
            }}
          />
        ))}
      </div>

      {/* Tiger mascot with celebration ring */}
      <div className="relative mt-4 mb-2">
        <div className="absolute inset-0 -m-6 rounded-full bg-gradient-to-br from-[hsl(var(--accent))]/60 to-[hsl(var(--primary))]/30 blur-2xl" />
        <div className="relative w-44 h-44 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-card shadow-[var(--shadow-soft)] border-4 border-white" />
          <img
            src={tigerMascot}
            alt="Celebrating tiger"
            className="relative w-36 h-36 object-contain origin-bottom animate-tiger-pop"
          />
          {/* Sparkles */}
          <span className="absolute -top-2 -left-2 text-2xl animate-bounce-soft">✨</span>
          <span className="absolute -top-1 -right-3 text-2xl animate-bounce-soft" style={{ animationDelay: "0.2s" }}>
            🌸
          </span>
          <span className="absolute -bottom-1 -left-3 text-xl animate-bounce-soft" style={{ animationDelay: "0.4s" }}>
            ⭐
          </span>
        </div>

        {/* Paw stamp */}
        <div className="absolute -right-4 -bottom-2 text-4xl animate-stamp-in select-none" aria-hidden>
          🐾
        </div>
      </div>

      {/* Title */}
      <div className="animate-title-pop mt-3">
        <p className="text-xs font-extrabold tracking-[0.3em] text-primary mb-1">미션 완료</p>
        <h1 className="text-3xl font-extrabold bg-gradient-to-r from-primary to-[hsl(var(--korean-deep))] bg-clip-text text-transparent">
          MISSION COMPLETE!
        </h1>
        <p className="text-sm text-muted-foreground mt-2 max-w-[16rem] mx-auto">
          You crushed <span className="font-bold text-foreground">{quest.title}</span>
        </p>
      </div>

      {/* XP reward */}
      <div className="animate-xp-pop mt-5 rounded-2xl bg-card border border-border px-6 py-4 shadow-[var(--shadow-soft)] w-full max-w-xs">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">You earned</p>
        <div className="flex items-center justify-center gap-2 text-xp">
          <Zap size={28} className="fill-current" />
          <span className="text-5xl font-extrabold">{quest.xp}</span>
          <span className="text-xl font-bold mt-2">XP</span>
        </div>
      </div>

      {photoUrl && (
        <div className="mt-4 w-24 h-24 rounded-2xl overflow-hidden border-4 border-white shadow-md rotate-3 animate-fade-in">
          <img src={photoUrl} alt="Your submission" className="w-full h-full object-cover" />
        </div>
      )}

      {/* Actions */}
      <div className="w-full max-w-xs space-y-3 mt-6 animate-fade-in" style={{ animationDelay: "0.9s" }}>
        <Button
          className="w-full rounded-xl font-bold h-12 gap-2 shadow-[var(--shadow-soft)]"
          onClick={() => navigate(`/quest/${quest.id}/review`)}
        >
          <PenLine size={18} />
          Write Review
        </Button>
        <Button
          variant="outline"
          className="w-full rounded-xl font-bold h-12 gap-2"
          onClick={() => {
            if (navigator.share) {
              navigator.share({
                title: `I completed ${quest.title}!`,
                text: `Just earned ${quest.xp} XP on Quest Korea Go!`,
              });
            }
          }}
        >
          <Share2 size={18} />
          Share
        </Button>
        <Button variant="ghost" className="w-full rounded-xl font-bold h-12" onClick={() => navigate("/")}>
          Back to Home
        </Button>
      </div>
    </div>
  );
};

export default PhotoVerify;
