import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Zap, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { quests } from "@/data/quests";
import { usePublishedQuest } from "@/features/quests/usePublishedQuests";
import { startQuest } from "@/features/quests/questCompletion";

const QuestPlay = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const mockQuest = quests.find((q) => q.id === Number(id));
  const { data: publishedQuest, isLoading } = usePublishedQuest(id);
  const quest = publishedQuest ?? mockQuest;

  useEffect(() => {
    if (!publishedQuest) return;
    void startQuest(publishedQuest.databaseId).catch((error) => {
      console.error("Could not mark Quest as started.", error);
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

  return (
    <div className="flex flex-col min-h-full">
      {/* Header with image */}
      <div className="relative">
        <img
          src={quest.image}
          alt={quest.title}
          className="w-full h-40 object-cover"
          width={800}
          height={512}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 to-transparent" />
        <button
          onClick={() => navigate(`/quest/${quest.id}`)}
          className="absolute top-4 left-4 flex items-center gap-1 text-sm font-bold text-primary-foreground bg-foreground/30 backdrop-blur-sm px-3 py-1.5 rounded-full active:opacity-70"
        >
          <ArrowLeft size={16} /> Back
        </button>
        <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between">
          <p className="font-extrabold text-primary-foreground text-lg">{quest.title}</p>
          <span className="flex items-center gap-1 text-xp bg-card/90 backdrop-blur-sm text-xs font-bold px-2.5 py-1 rounded-full">
            <Zap size={13} /> {quest.xp} XP
          </span>
        </div>
      </div>

      {/* Progress */}
      <div className="px-5 pt-4 pb-2">
        <div className="flex items-center gap-2">
          <Progress
            value={0}
            className="flex-1 h-2.5 rounded-full bg-muted [&>div]:bg-success [&>div]:rounded-full"
          />
          <span className="text-xs font-bold text-muted-foreground">In Progress</span>
        </div>
      </div>

      {/* Single Active Mission */}
      <div className="flex-1 px-5 py-6 flex flex-col items-center justify-center text-center">
        <div className="text-5xl mb-4">🎯</div>
        <h2 className="text-xl font-extrabold mb-2">Your Mission</h2>
        <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mb-6">
          {quest.mission}
        </p>

        <div className="w-full max-w-xs rounded-2xl bg-card border border-border p-5 shadow-sm">
          <div className="flex items-center gap-2 text-muted-foreground mb-3">
            <Camera size={16} />
            <span className="text-xs font-bold">
              {publishedQuest?.proofType === "PHOTO" || !publishedQuest ? "Photo required to complete" : "Complete each quest step"}
            </span>
          </div>
          <div className="space-y-3 text-left">
            {quest.steps.map((step) => (
              <div key={step.id} className="flex gap-2">
                <span aria-hidden>{step.emoji}</span>
                <div>
                  <p className="text-xs font-bold">{step.title}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="sticky bottom-0 bg-background/90 backdrop-blur-md border-t border-border px-5 py-4">
        <Button
          className="w-full rounded-xl font-extrabold h-14 text-base shadow-lg gap-2"
          onClick={() => navigate(`/quest/${quest.id}/verify`)}
        >
          <Camera size={20} />
          Upload Photo to Complete Mission
        </Button>
      </div>
    </div>
  );
};

export default QuestPlay;
