import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Clock, Dice5, Flag, MapPin, Route, Sparkles, Star, Zap, Shuffle, SlidersHorizontal } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { quests, difficultyColor, type Quest } from "@/data/quests";
import { loadPrefs, REGIONS, type Prefs } from "@/lib/personalization";
import { usePublishedQuests } from "@/features/quests/usePublishedQuests";
import { useQuestEventSignals } from "@/features/quests/useQuestEventSignals";
import { questMatchesRegion, rankForYouQuests } from "@/features/quests/forYouRecommendations";
import type { SupabaseQuestCard } from "@/features/quests/supabaseQuestAdapter";
import { questRoutes, type QuestRoute } from "@/data/questRoutes";
import CreateQuestDialog from "@/components/CreateQuestDialog";
import SaveQuestButton from "@/components/SaveQuestButton";
import SaveRouteButton from "@/components/SaveRouteButton";

const categories = ["For You", "Food", "Culture", "Shopping", "Nightlife", "Nature"] as const;

// Existing location-flexible mock quests. These are reused as everyday local
// experiences when a region is selected; no new quest content is generated.
const GENERIC_LOCAL_MOCK_IDS = [1, 3, 5, 7, 9, 17, 20, 21, 22] as const;
const genericLocalMockQuests = quests.filter((quest) => GENERIC_LOCAL_MOCK_IDS.includes(quest.id as typeof GENERIC_LOCAL_MOCK_IDS[number]));

const QuestCard = ({ quest, onClick }: { quest: Quest; onClick: () => void }) => (
  <div
    role="button"
    tabIndex={0}
    onClick={onClick}
    onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") onClick(); }}
    className="w-full text-left rounded-2xl overflow-hidden border border-border shadow-sm transition-transform active:scale-[0.98] bg-card"
  >
    <div className="relative h-40">
      <img src={quest.image} alt={quest.title} className="w-full h-full object-cover" loading="lazy" />
      <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 to-transparent" />
      <span className="absolute top-3 right-3 flex items-center gap-1 text-xp bg-card/90 backdrop-blur-sm text-xs font-bold px-2.5 py-1 rounded-full">
        <Zap size={13} /> {quest.xp} XP
      </span>
      <SaveQuestButton quest={quest} className="absolute left-3 top-3" />
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
  </div>
);

const RouteCard = ({ route, onClick }: { route: QuestRoute; onClick: () => void }) => (
  <div role="button" tabIndex={0} onClick={onClick} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") onClick(); }} className="w-[82vw] max-w-[330px] shrink-0 overflow-hidden rounded-2xl border border-border bg-card text-left shadow-sm transition-transform active:scale-[0.98]">
    <div className="relative h-44">
      <img src={route.coverImage} alt="" className="h-full w-full object-cover" loading="lazy" />
      <div className="absolute inset-0 bg-gradient-to-t from-[hsl(var(--korean-deep))] via-[hsl(var(--korean-deep)/0.35)] to-transparent" />
      <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-extrabold text-primary shadow-sm">{route.theme}</span>
      <SaveRouteButton route={route} className="absolute right-3 top-3" />
      <div className="absolute inset-x-0 bottom-0 p-4 text-white"><p className="text-lg font-black leading-tight">{route.emoji} {route.title}</p><p className="mt-1 text-xs font-bold text-white/75">{route.subtitle}</p></div>
    </div>
    <div className="p-4">
      <div className="flex items-center gap-2 text-xs font-extrabold text-foreground"><span className="rounded-full bg-primary/10 px-2.5 py-1 text-primary">{route.duration}</span><span className="flex items-center gap-1"><Flag size={13} /> {route.questIds.length} Quests</span></div>
      <div className="mt-3 flex items-center justify-between"><span className="text-xs text-muted-foreground">{route.estimatedTime}</span><span className="flex items-center gap-1 text-xs font-extrabold text-primary">View Route <ArrowRight size={14} /></span></div>
    </div>
  </div>
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
        <div className="mt-1 flex items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">Find your next adventure</p>
          <CreateQuestDialog />
        </div>
      </div>

      <section className="mt-6">
        <div className="mb-3 flex items-end justify-between px-5">
          <div><p className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-[0.16em] text-primary"><Route size={14} /> Curated journeys</p><h2 className="mt-1 text-lg font-black">Featured Quest Routes</h2></div>
          <span className="text-xs font-bold text-muted-foreground">Swipe →</span>
        </div>
        <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-2 scrollbar-hide">
          {questRoutes.map((route) => <div key={route.id} className="snap-start"><RouteCard route={route} onClick={() => navigate(`/quest-route/${route.id}`)} /></div>)}
        </div>
      </section>

      <section className="px-5 pt-5">
        <button onClick={() => navigate("/games")} className="group relative w-full overflow-hidden rounded-3xl bg-[hsl(var(--korean-deep))] p-5 text-left text-white shadow-[7px_8px_0_hsl(var(--primary)/0.22)] transition-transform duration-200 active:scale-[0.97] active:-rotate-1">
          <div className="absolute -right-8 -top-10 h-36 w-36 rounded-full bg-primary/35 blur-2xl" /><Star className="absolute right-5 top-5 rotate-12 text-[hsl(var(--xp))]" size={20} /><Zap className="absolute right-16 top-12 -rotate-12 text-accent" size={18} /><span className="absolute bottom-3 right-7 rotate-12 text-2xl font-black text-white/15">?</span>
          <div className="relative flex items-center gap-4"><span className="flex h-16 w-16 shrink-0 rotate-[-6deg] items-center justify-center rounded-2xl bg-[hsl(var(--xp))] text-[hsl(var(--xp-foreground))] shadow-lg transition-transform group-active:rotate-6"><Dice5 size={34} /></span><div><p className="flex items-center gap-1 text-[10px] font-black uppercase tracking-[0.2em] text-white/55"><Sparkles size={12} /> K-Quest Game Zone</p><h2 className="mt-1 text-2xl font-black">LET'S PLAY!</h2><p className="mt-1 text-xs font-bold leading-relaxed text-white/70">Feeling adventurous?<br />Pick a challenge and let Korea surprise you.</p></div></div>
          <div className="relative mt-4 flex items-center justify-between rounded-xl bg-white/10 px-4 py-2.5 text-xs font-black"><span>4 challenges waiting</span><span className="flex items-center gap-1 text-[hsl(var(--xp))]">ENTER GAME ZONE <ArrowRight size={14} /></span></div>
        </button>
      </section>

      <div className="px-5 pt-6"><p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-muted-foreground">Explore one at a time</p><h2 className="mt-1 text-lg font-black">Individual Quests</h2></div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-3">
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
