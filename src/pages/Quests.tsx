import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Clock, MapPin, Zap, Shuffle, SlidersHorizontal } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { quests, difficultyColor } from "@/data/quests";

const categories = ["For You", "Food", "Culture", "Shopping", "Nightlife", "Nature"] as const;

const categoryMap: Record<string, typeof quests> = {
  "For You": quests,
  Food: quests.filter((q) => q.category === "Food"),
  Culture: quests.filter((q) => q.category === "Culture"),
  Shopping: quests.filter((q) => q.category === "Shopping"),
  Nightlife: quests.filter((q) => q.category === "Nightlife"),
  Nature: quests.filter((q) => q.category === "Nature"),
};

const QuestCard = ({ quest, onClick }: { quest: (typeof quests)[0]; onClick: () => void }) => (
  <button
    onClick={onClick}
    className="w-full text-left rounded-2xl overflow-hidden border border-border shadow-sm transition-transform active:scale-[0.98] bg-card"
  >
    <div className="relative h-40">
      <img src={quest.image} alt={quest.title} className="w-full h-full object-cover" loading="lazy" />
      <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 to-transparent" />
      <span className="absolute top-3 right-3 flex items-center gap-1 text-xp bg-card/90 backdrop-blur-sm text-xs font-bold px-2.5 py-1 rounded-full">
        <Zap size={13} /> {quest.xp} XP
      </span>
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <p className="font-extrabold text-base text-primary-foreground">{quest.title}</p>
      </div>
    </div>
    <div className="p-3.5 flex items-center gap-3">
      <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${difficultyColor(quest.difficulty)}`}>
        {quest.difficulty}
      </span>
      <span className="flex items-center gap-1 text-xs text-muted-foreground">
        <Clock size={12} /> {quest.time}
      </span>
      <span className="flex items-center gap-1 text-xs text-muted-foreground">
        <MapPin size={12} /> {quest.distance}
      </span>
    </div>
  </button>
);

const Quests = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<string>("For You");
  const [shuffleKey, setShuffleKey] = useState(0);

  const displayQuests = [...(categoryMap[activeTab] || quests)].sort(() =>
    shuffleKey ? Math.random() - 0.5 : 0
  );

  return (
    <div className="pb-4">
      <div className="px-5 pt-6">
        <h1 className="text-2xl font-extrabold">Quests 🎯</h1>
        <p className="text-sm text-muted-foreground mt-1">Find your next adventure</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
        <div className="px-5 overflow-x-auto scrollbar-hide">
          <TabsList className="inline-flex h-11 rounded-xl bg-muted gap-1 w-auto min-w-full">
            {categories.map((c) => (
              <TabsTrigger key={c} value={c} className="rounded-lg text-xs font-bold px-4 data-[state=active]:bg-card data-[state=active]:shadow-sm whitespace-nowrap">
                {c}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {categories.map((c) => (
          <TabsContent key={c} value={c} className="px-5 mt-4 space-y-4">
            {(categoryMap[c] || []).length === 0 ? (
              <p className="text-center text-muted-foreground text-sm py-8">No quests in this category yet</p>
            ) : (
              displayQuests
                .filter(() => activeTab === c)
                .length > 0 ? displayQuests.map((q) => (
                <QuestCard key={q.id} quest={q} onClick={() => navigate(`/quest/${q.id}`)} />
              )) : (categoryMap[c] || []).map((q) => (
                <QuestCard key={q.id} quest={q} onClick={() => navigate(`/quest/${q.id}`)} />
              ))
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Bottom action bar */}
      <div className="fixed bottom-[calc(3.5rem+env(safe-area-inset-bottom))] left-0 right-0 z-40 px-5 pb-3">
        <div className="flex gap-3 max-w-md mx-auto">
          <Button
            variant="outline"
            className="flex-1 rounded-xl h-11 font-bold gap-2 bg-card border-border shadow-md"
            onClick={() => setShuffleKey((k) => k + 1)}
          >
            <Shuffle size={16} /> Shuffle
          </Button>
          <Button
            variant="outline"
            className="flex-1 rounded-xl h-11 font-bold gap-2 bg-card border-border shadow-md"
          >
            <SlidersHorizontal size={16} /> Filter
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Quests;
