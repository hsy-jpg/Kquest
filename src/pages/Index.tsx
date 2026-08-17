import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Flame, Zap, Clock, MapPin, ChevronRight, Gift, TrendingUp, Star, Sparkles, SlidersHorizontal } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { quests, difficultyColor } from "@/data/quests";
import tigerMascot from "@/assets/tiger-mascot.png";
import kquestLogo from "@/assets/kquest-logo.png";
import PersonalizationOnboarding from "@/components/PersonalizationOnboarding";
import { ACTIVITIES, MOODS, REGIONS, loadPrefs, recommendedQuests, type Prefs } from "@/lib/personalization";
import { selectHomeForYouQuests } from "@/features/quests/homeForYou";
import { usePublishedQuests } from "@/features/quests/usePublishedQuests";
import { rankForYouQuests } from "@/features/quests/forYouRecommendations";
import { useQuestEventSignals } from "@/features/quests/useQuestEventSignals";
import { rankForTodayQuests } from "@/features/quests/forTodayRecommendations";

const todayQuest = quests[0];
const featuredQuests = quests.filter((q) => q.featured);
const trendingQuests = quests.filter((q) => !q.featured && q.id !== todayQuest.id);

const labelFor = (list: readonly { id: string; emoji: string; label: string }[], id: string) => {
  const found = list.find((x) => x.id === id);
  return found ? `${found.emoji} ${found.label}` : id;
};

const Index = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [dailyRewardClaimed, setDailyRewardClaimed] = useState(false);
  const [prefs, setPrefs] = useState<Prefs | null>(() => loadPrefs());
  const [editingPrefs, setEditingPrefs] = useState(false);
  const [recentForYouIds, setRecentForYouIds] = useState<ReadonlySet<string>>(() => new Set());
  const forYou = recommendedQuests(prefs, 6);
  const {
    data: publishedQuests,
    isLoading: publishedQuestsLoading,
    isError: publishedQuestsError,
  } = usePublishedQuests();
  const { data: questEventSignals = [] } = useQuestEventSignals();
  const personalizedPublished = useMemo(
    () => prefs && publishedQuests ? rankForYouQuests(publishedQuests, prefs, questEventSignals, 6, new Date(), recentForYouIds) : publishedQuests,
    [prefs, publishedQuests, questEventSignals, recentForYouIds],
  );
  const displayedForYou = useMemo(
    () => selectHomeForYouQuests(
      personalizedPublished,
      forYou,
      publishedQuestsError,
      6,
      Boolean(prefs && prefs.region !== "korea" && prefs.region !== "near"),
    ),
    [personalizedPublished, forYou, publishedQuestsError, prefs, publishedQuests],
  );
  const displayedForToday = useMemo(() => {
    if (publishedQuestsError || !publishedQuests?.length) return featuredQuests;
    const forYouIds = new Set(
      displayedForYou.flatMap((quest) => "databaseId" in quest ? [(quest as { databaseId: string }).databaseId] : []),
    );
    const ranked = rankForTodayQuests(publishedQuests, questEventSignals, forYouIds, 3);
    return ranked.length ? ranked : featuredQuests;
  }, [publishedQuestsError, publishedQuests, displayedForYou, questEventSignals]);

  useEffect(() => {
    if (location.hash !== "#for-you") return;
    requestAnimationFrame(() => document.getElementById("for-you")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }, [location.hash]);


  return (
    <div className="pb-4 space-y-5">
      {/* K-QUEST branded header */}
      <div className="px-5 pt-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img
            src={kquestLogo}
            alt="K-QUEST"
            className="h-20 w-auto object-contain drop-shadow-lg"
          />
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 rounded-full bg-card border border-border px-2 py-1 text-primary shadow-sm">
            <Flame size={14} strokeWidth={2.5} />
            <span className="text-xs font-extrabold">5</span>
          </div>
          <div className="flex items-center gap-1 rounded-full bg-card border border-border px-2 py-1 text-xp shadow-sm">
            <Zap size={14} strokeWidth={2.5} />
            <span className="text-xs font-extrabold">320</span>
          </div>
        </div>
      </div>

      {/* Tiger mascot greeting — gradient hero card */}
      <div className="mx-5 relative rounded-3xl p-5 overflow-hidden border border-white/70 shadow-[var(--shadow-soft)]"
        style={{ background: "linear-gradient(160deg, hsl(212 80% 88%), hsl(217 70% 78%))" }}>
        {/* Cloud pattern */}
        <svg aria-hidden className="absolute inset-0 w-full h-full opacity-25 text-white" viewBox="0 0 200 120" preserveAspectRatio="none" fill="none" stroke="currentColor" strokeWidth="1">
          <path d="M10 30 q10 -14 24 -6 q10 -8 20 4 q8 10 -4 14 q-10 6 -18 -2 q-14 4 -22 -10z" />
          <path d="M130 20 q10 -12 22 -4 q12 -6 18 6 q6 10 -6 12 q-12 4 -18 -2 q-12 4 -16 -12z" />
          <path d="M40 90 q12 -14 26 -4 q10 -8 20 4 q8 10 -4 14 q-12 6 -22 -2 q-14 4 -20 -12z" />
        </svg>
        <div className="flex items-center gap-3 relative z-10">
          <div className="relative shrink-0">
            <div className="absolute inset-0 -m-4 rounded-full bg-white/50 blur-2xl animate-pulse" />
            {/* Floating sparkles around tiger */}
            <span className="absolute -top-1 -left-2 text-base animate-bounce-soft" style={{ animationDelay: "0.1s" }}>✨</span>
            <span className="absolute -top-2 right-2 text-sm animate-bounce-soft" style={{ animationDelay: "0.5s" }}>🌸</span>
            <span className="absolute bottom-2 -left-3 text-sm animate-bounce-soft" style={{ animationDelay: "0.8s" }}>⭐</span>
            <img
              src={tigerMascot}
              alt="K-Quest tiger mascot"
              className="relative w-36 h-36 object-contain drop-shadow-xl animate-tiger-wiggle origin-bottom"
              width={256}
              height={256}
            />
            <span className="absolute -bottom-1 right-1 text-[10px] font-extrabold bg-primary text-primary-foreground rounded-full px-2 py-0.5 shadow-md">
              Lv.4
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-extrabold text-[hsl(var(--korean-deep))] uppercase tracking-widest">Hello, Explorer!</p>
            <p className="font-extrabold text-base leading-snug text-[hsl(var(--korean-deep))]">Let's discover Seoul 🌸</p>
            <div className="mt-2 rounded-full bg-white/70 backdrop-blur p-1 pl-3 flex items-center gap-2">
              <span className="text-[10px] font-extrabold text-primary">EXP</span>
              <div className="flex-1 h-2 rounded-full bg-white/80 overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-primary to-[hsl(var(--korean-deep))]" style={{ width: "64%" }} />
              </div>
              <span className="text-[10px] font-extrabold text-muted-foreground pr-2">320/500</span>
            </div>
          </div>
        </div>
      </div>

      {/* Today's Quest - Image Card */}
      <div className="px-5">
        <h2 className="text-lg font-bold mb-3">Today's Quest</h2>
        <button
          onClick={() => navigate(`/quest/${todayQuest.id}`)}
          className="w-full text-left rounded-2xl overflow-hidden border border-border shadow-md transition-transform active:scale-[0.98]"
        >
          <div className="relative h-44">
            <img
              src={todayQuest.image}
              alt={todayQuest.title}
              className="w-full h-full object-cover"
              width={800}
              height={512}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <p className="font-extrabold text-lg text-primary-foreground">{todayQuest.title}</p>
              <p className="text-xs text-primary-foreground/80 mt-0.5">{todayQuest.subtitle}</p>
            </div>
            <span className="absolute top-3 right-3 flex items-center gap-1 text-xp bg-card/90 backdrop-blur-sm text-xs font-bold px-2.5 py-1 rounded-full">
              <Zap size={13} /> {todayQuest.xp} XP
            </span>
          </div>
          <div className="p-4 bg-card">
            <div className="flex items-center gap-3 mb-3">
              <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${difficultyColor(todayQuest.difficulty)}`}>
                {todayQuest.difficulty}
              </span>
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock size={12} /> {todayQuest.time}
              </span>
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin size={12} /> {todayQuest.distance}
              </span>
            </div>
            <div className="rounded-xl bg-primary text-primary-foreground text-center py-3 font-bold text-sm">
              Start Quest
            </div>
          </div>
        </button>
      </div>

      {/* Daily Reward */}
      <div className="mx-5 rounded-2xl bg-card p-4 border border-border shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/15 text-xl">
              <Gift size={20} className="text-accent" />
            </div>
            <div>
              <p className="font-bold text-sm">Daily Bonus</p>
              <p className="text-xs text-muted-foreground">Log in every day for bonus XP!</p>
            </div>
          </div>
          <Button
            variant={dailyRewardClaimed ? "secondary" : "default"}
            size="sm"
            className="rounded-xl font-bold text-xs"
            disabled={dailyRewardClaimed}
            onClick={(e) => {
              e.stopPropagation();
              setDailyRewardClaimed(true);
            }}
          >
            {dailyRewardClaimed ? "Claimed ✓" : "+25 XP"}
          </Button>
        </div>
      </div>

      {/* For You filter entry button */}
      <div className="px-5">
        <button
          onClick={() => setEditingPrefs(true)}
          className="w-full flex items-center gap-3 rounded-2xl border border-primary/40 bg-card p-4 shadow-sm transition-transform active:scale-[0.98]"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Sparkles size={20} />
          </span>
          <span className="flex-1 text-left">
            <span className="block font-extrabold text-sm">For You</span>
            <span className="block text-xs text-muted-foreground">
              Set your mood, activity & region filters
            </span>
          </span>
          <SlidersHorizontal size={16} className="text-primary" />
        </button>
      </div>

      {/* For You — personalized recommendations */}
      <div id="for-you" className="scroll-mt-4">
        <div className="flex items-center justify-between mb-3 px-5">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-primary" />
            <h2 className="text-lg font-bold">For You ✨</h2>
          </div>
          <button
            onClick={() => setEditingPrefs(true)}
            className="flex items-center gap-1 rounded-full border border-border bg-card px-3 py-1.5 text-[11px] font-extrabold text-primary shadow-sm"
          >
            <SlidersHorizontal size={12} /> Edit
          </button>
        </div>


        {prefs ? (
          <>
            <div className="px-5 flex flex-wrap gap-1.5 mb-3">
              {prefs.moods.map((m) => (
                <span key={m} className="rounded-full bg-muted px-2.5 py-1 text-[10px] font-bold text-muted-foreground">
                  {labelFor(MOODS, m)}
                </span>
              ))}
              {prefs.activities.map((a) => (
                <span key={a} className="rounded-full bg-muted px-2.5 py-1 text-[10px] font-bold text-muted-foreground">
                  {labelFor(ACTIVITIES, a)}
                </span>
              ))}
              <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-bold text-primary">
                {labelFor(REGIONS, prefs.region)}
              </span>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 px-5 scrollbar-hide">
              {publishedQuestsLoading ? (
                <p className="py-4 text-xs text-muted-foreground">Loading quests...</p>
              ) : displayedForYou.length ? displayedForYou.map((q) => (
                <button
                  key={q.id}
                  onClick={() => navigate(`/quest/${q.id}`)}
                  className="min-w-[200px] max-w-[200px] rounded-2xl overflow-hidden border border-primary/40 shadow-sm text-left transition-transform active:scale-[0.97] shrink-0 bg-card"
                >
                  <div className="h-28 relative">
                    <img
                      src={q.image}
                      alt={q.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      width={800}
                      height={512}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-foreground/55 to-transparent" />
                    <span className="absolute bottom-2 left-2 font-bold text-sm text-primary-foreground leading-tight">
                      {q.title}
                    </span>
                  </div>
                  <div className="p-3">
                    <p className="text-[11px] text-muted-foreground line-clamp-1">{q.subtitle}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${difficultyColor(q.difficulty)}`}>
                        {q.difficulty}
                      </span>
                      <span className="flex items-center gap-0.5 text-xp text-xs font-bold">
                        <Zap size={12} /> {q.xp}
                      </span>
                    </div>
                  </div>
                </button>
              )) : (
                <p className="py-4 text-xs text-muted-foreground">No published quests match this region yet.</p>
              )}
              {publishedQuestsError && (
                <span className="sr-only" role="status">Live quests unavailable. Showing existing recommendations.</span>
              )}
            </div>
          </>
        ) : (
          <div className="mx-5 rounded-2xl border border-dashed border-primary/50 bg-card p-4 text-center">
            <p className="text-sm font-bold">Get quests picked for you</p>
            <p className="text-xs text-muted-foreground mt-1">Answer 3 quick questions</p>
            <Button className="mt-3 rounded-xl font-bold" onClick={() => setEditingPrefs(true)}>
              Personalize
            </Button>
          </div>
        )}
      </div>

      {editingPrefs && (
        <PersonalizationOnboarding
          initial={prefs}
          onClose={() => setEditingPrefs(false)}
          onDone={(p) => {
            setRecentForYouIds(new Set(displayedForYou.flatMap((quest) =>
              "databaseId" in quest ? [(quest as { databaseId: string }).databaseId] : [],
            )));
            setPrefs(p);
            setEditingPrefs(false);
          }}
        />
      )}


      {/* For Today ★ — featured limited-time / seasonal quests */}
      <div>
        <div className="flex items-center justify-between mb-3 px-5">
          <div className="flex items-center gap-2">
            <span className="relative flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-accent to-[hsl(var(--xp))] text-white shadow-md">
              <Star size={15} strokeWidth={2.8} fill="currentColor" />
              <span className="absolute inset-0 rounded-full bg-accent/40 animate-ping" />
            </span>
            <h2 className="text-lg font-bold">
              For Today <span className="text-accent">★</span>
            </h2>
          </div>
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-accent/90 bg-accent/15 px-2 py-1 rounded-full">
            Limited
          </span>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2 px-5 scrollbar-hide">
          {displayedForToday.map((q) => (
            <button
              key={q.id}
              onClick={() => navigate(`/quest/${q.id}`)}
              className="relative min-w-[230px] max-w-[230px] rounded-2xl overflow-hidden border-2 border-accent/60 shadow-[0_8px_24px_-8px_hsl(var(--accent)/0.45)] text-left transition-transform active:scale-[0.97] shrink-0 bg-card"
            >
              {/* glowing star badge */}
              <span className="absolute top-2 left-2 z-10 flex items-center gap-1 rounded-full bg-gradient-to-r from-accent to-[hsl(var(--xp))] text-white text-[10px] font-extrabold px-2 py-1 shadow-md">
                <Star size={11} strokeWidth={3} fill="currentColor" /> {q.featuredTag ?? "Featured"}
              </span>
              <div className="h-32 relative">
                <img
                  src={q.image}
                  alt={q.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  width={800}
                  height={512}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/75 via-foreground/20 to-transparent" />
                <span className="absolute top-2 right-2 flex items-center gap-1 text-xp bg-card/90 backdrop-blur-sm text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                  <Zap size={11} /> {q.xp}
                </span>
                <div className="absolute bottom-2 left-2 right-2">
                  <p className="font-extrabold text-sm text-primary-foreground leading-tight">
                    {q.title} <span className="text-accent">★</span>
                  </p>
                </div>
              </div>
              <div className="p-3">
                <p className="text-[11px] text-muted-foreground line-clamp-1">{q.subtitle}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <MapPin size={11} /> {q.location.split(",")[0]}
                  </span>
                  <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <Clock size={11} /> {q.time}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Trending Quests */}
      <div>
        <div className="flex items-center justify-between mb-3 px-5">
          <div className="flex items-center gap-2">
            <TrendingUp size={18} className="text-secondary" />
            <h2 className="text-lg font-bold">Trending Quests</h2>
          </div>
          <button className="flex items-center gap-0.5 text-xs font-bold text-primary">
            See all <ChevronRight size={14} />
          </button>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2 px-5 scrollbar-hide">
          {trendingQuests.map((q) => (
            <button
              key={q.id}
              onClick={() => navigate(`/quest/${q.id}`)}
              className="min-w-[200px] max-w-[200px] rounded-2xl overflow-hidden border border-border shadow-sm text-left transition-transform active:scale-[0.97] shrink-0"
            >
              <div className="h-28 relative">
                <img
                  src={q.image}
                  alt={q.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  width={800}
                  height={512}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/50 to-transparent" />
                <span className="absolute bottom-2 left-2 font-bold text-sm text-primary-foreground leading-tight">
                  {q.title}
                </span>
              </div>
              <div className="p-3 bg-card">
                <p className="text-[11px] text-muted-foreground line-clamp-1">{q.subtitle}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${difficultyColor(q.difficulty)}`}>
                    {q.difficulty}
                  </span>
                  <span className="flex items-center gap-0.5 text-xp text-xs font-bold">
                    <Zap size={12} /> {q.xp}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Index;
