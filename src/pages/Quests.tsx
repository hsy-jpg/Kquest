import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Clock, MapPin, Zap, Shuffle, SlidersHorizontal } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { quests, difficultyColor, type Quest } from "@/data/quests";
import { loadPrefs, REGIONS, type Prefs } from "@/lib/personalization";
import { usePublishedQuests } from "@/features/quests/usePublishedQuests";
import { useQuestEventSignals } from "@/features/quests/useQuestEventSignals";
import { questMatchesRegion, rankForYouQuests } from "@/features/quests/forYouRecommendations";
import type { SupabaseQuestCard } from "@/features/quests/supabaseQuestAdapter";

const categories = ["For You", "Food", "Culture", "Shopping", "Nightlife", "Nature"] as const;

// Existing location-flexible mock quests. These are reused as everyday local
// experiences when a region is selected; no new quest content is generated.
const GENERIC_LOCAL_MOCK_IDS = [1, 3, 5, 7, 9, 17, 20, 21, 22] as const;
const genericLocalMockQuests = quests.filter((quest) => GENERIC_LOCAL_MOCK_IDS.includes(quest.id as typeof GENERIC_LOCAL_MOCK_IDS[number]));

const QuestCard = ({ quest, onClick }: { quest: Quest; onClick: () => void }) => (
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
  const [position, setPosition] = useState<{ latitude: number; longitude: number } | null>(null);
  const prefs = useMemo(() => loadPrefs(), []);
  const [selectedRegion, setSelectedRegion] = useState(() => prefs?.region ?? "korea");
  const [regionFilterOpen, setRegionFilterOpen] = useState(false);
  const { data: publishedQuests, isError: publishedQuestsError } = usePublishedQuests();
  const { data: questEvents = [] } = useQuestEventSignals();

  useEffect(() => {
    if (selectedRegion !== "near" || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => setPosition({ latitude: coords.latitude, longitude: coords.longitude }),
      () => setPosition(null),
      { enableHighAccuracy: false, timeout: 8_000, maximumAge: 10 * 60_000 },
    );
  }, [selectedRegion]);

  const regionalQuests = useMemo(() => {
    if (!publishedQuests) return undefined;
    if (selectedRegion === "korea") return publishedQuests;
    if (selectedRegion === "near") {
      if (!position) return [];
      return publishedQuests.filter((quest) => quest.latitude !== null && quest.longitude !== null
        && distanceKm(position.latitude, position.longitude, quest.latitude, quest.longitude) <= 50);
    }
    return publishedQuests.filter((quest) => questMatchesRegion(selectedRegion, quest));
  }, [publishedQuests, selectedRegion, position]);

  const categoryMap = useMemo<Record<string, Quest[]>>(() => {
    const publishedSource: Quest[] = publishedQuestsError ? [] : regionalQuests ?? [];
    const localMocks = selectedRegion === "seoul" || selectedRegion === "korea"
      ? quests
      : selectLocalMockQuests(selectedRegion, shuffleKey, 3);
    const source: Quest[] = [...publishedSource, ...localMocks];
    const effectivePrefs: Prefs = prefs
      ? { ...prefs, region: selectedRegion }
      : { moods: [], activities: [], region: selectedRegion };
    const rankedPublished = regionalQuests && !publishedQuestsError
      ? rankForYouQuests(regionalQuests, effectivePrefs, questEvents, regionalQuests.length)
      : [];
    const forYou = interleaveLocalQuests(rankedPublished, localMocks);
    return {
      "For You": forYou,
      Food: source.filter((quest) => quest.category === "Food"),
      Culture: source.filter((quest) => quest.category === "Culture"),
      Shopping: source.filter((quest) => quest.category === "Shopping"),
      Nightlife: source.filter((quest) => quest.category === "Nightlife"),
      Nature: source.filter((quest) => quest.category === "Nature"),
    };
  }, [prefs, publishedQuestsError, regionalQuests, questEvents, selectedRegion, shuffleKey]);

  const displayQuests = [...(categoryMap[activeTab] || [])].sort(() =>
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
          <Popover open={regionFilterOpen} onOpenChange={setRegionFilterOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="flex-1 rounded-xl h-11 font-bold gap-2 bg-card border-border shadow-md"
              >
                <SlidersHorizontal size={16} /> Region Filter
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" side="top" className="w-64 p-2 max-h-80 overflow-y-auto">
              <p className="px-2 py-1.5 text-xs font-extrabold text-muted-foreground">Choose a region</p>
              {REGIONS.map((region) => (
                <button
                  key={region.id}
                  type="button"
                  onClick={() => {
                    setSelectedRegion(region.id);
                    setRegionFilterOpen(false);
                  }}
                  className={`w-full flex items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-bold transition-colors ${selectedRegion === region.id ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
                >
                  <span>{region.emoji}</span>
                  <span>{region.label}</span>
                </button>
              ))}
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  );
};

export default Quests;

function distanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const radians = (value: number) => value * Math.PI / 180;
  const dLat = radians(lat2 - lat1);
  const dLon = radians(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(radians(lat1)) * Math.cos(radians(lat2)) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function selectLocalMockQuests(region: string, shuffleKey: number, count: number): Quest[] {
  const seed = [...region].reduce((total, character) => total + character.charCodeAt(0), 0) + shuffleKey;
  return Array.from({ length: Math.min(count, genericLocalMockQuests.length) }, (_, index) =>
    genericLocalMockQuests[(seed + index * 3) % genericLocalMockQuests.length],
  );
}

function interleaveLocalQuests(published: Quest[], localMocks: Quest[]): Quest[] {
  if (!published.length) return localMocks;
  if (!localMocks.length) return published;

  const result = [...published];
  localMocks.forEach((quest, index) => {
    // Keep regional places dominant while making everyday local quests visible.
    const insertionIndex = Math.min(2 + index * 4, result.length);
    result.splice(insertionIndex, 0, quest);
  });
  return result;
}
