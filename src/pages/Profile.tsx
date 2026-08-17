import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Award, Flame, MapPin, Zap, Camera, Users, Heart, Settings, PenLine, LogIn } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import TigerAvatar from "@/components/TigerAvatar";
import TigerWardrobe from "@/components/TigerWardrobe";
import { useWardrobe } from "@/lib/wardrobe";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile, useMyPhotos } from "@/features/profile/useProfile";
import { useMyJournalEntries, useCreateJournalEntry } from "@/features/journal/useJournal";
import { badges, computeUnlockedBadges } from "@/data/badges";
import { levelFromXp, levelTitle } from "@/lib/leveling";
import journalFood from "@/assets/journal-food.jpg";
import journalView from "@/assets/journal-view.jpg";
import journalHanbok from "@/assets/journal-hanbok.jpg";

const REWARD_CHART_SIZE = 10;
const MOCK_QUESTS_BASELINE = 12;

const mockJournalPosts = [
  {
    image: journalFood,
    text: "Found the best tteokbokki at Gwangjang Market! 🔥 The spice level was perfect.",
    likes: 42,
    date: "2 days ago",
  },
  {
    image: journalView,
    text: "Sunset from Namsan Tower — this view never gets old 🌅",
    likes: 67,
    date: "4 days ago",
  },
  {
    image: journalHanbok,
    text: "Tried on hanbok for the first time at Gyeongbokgung! Felt like royalty 👑",
    likes: 89,
    date: "1 week ago",
  },
];

const Profile = () => {
  const navigate = useNavigate();
  const { isAnonymous } = useAuth();
  const { equippedItems } = useWardrobe();
  const { data: profileData } = useProfile();
  const { data: photos } = useMyPhotos();
  const { data: journalEntries } = useMyJournalEntries();
  const createJournalEntry = useCreateJournalEntry();

  const [showJournalForm, setShowJournalForm] = useState(false);
  const [journalText, setJournalText] = useState("");
  const [journalPhoto, setJournalPhoto] = useState<File | null>(null);
  const [journalPhotoPreview, setJournalPhotoPreview] = useState<string | null>(null);
  const journalFileInputRef = useRef<HTMLInputElement>(null);

  const stats = profileData?.stats;
  const level = levelFromXp(stats?.totalXp ?? 0);
  const badgeList = computeUnlockedBadges(
    stats ?? { completedQuestCount: 0, totalXp: 0, categoryCounts: {}, photoCount: 0, friendCount: 0 },
  );
  const completedQuests = profileData?.completedQuests ?? [];
  const rewardStamps = Array.from({ length: REWARD_CHART_SIZE }).map((_, i) => completedQuests[i] ?? null);
  const chartCompletedCount = Math.min(completedQuests.length, REWARD_CHART_SIZE);

  const handleJournalPhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setJournalPhoto(file);
    setJournalPhotoPreview(URL.createObjectURL(file));
  };

  const handlePostJournal = async () => {
    if (!journalText.trim()) return;
    await createJournalEntry.mutateAsync({ content: journalText, photoFile: journalPhoto });
    setJournalText("");
    setJournalPhoto(null);
    setJournalPhotoPreview(null);
    setShowJournalForm(false);
  };

  return (
    <div className="pb-4">
      {/* Header */}
      <div className="px-5 pt-6 flex items-center justify-between">
        <h1 className="text-xl font-extrabold">Profile</h1>
        <button className="p-2 rounded-xl text-muted-foreground">
          <Settings size={20} />
        </button>
      </div>

      {/* Avatar & Info */}
      <div className="flex flex-col items-center mt-2">
        <div
          className="relative w-32 h-32 rounded-full flex items-center justify-center border-4 border-primary/30 shadow-[var(--shadow-soft)]"
          style={{ background: "var(--gradient-blossom)" }}
        >
          <TigerAvatar items={isAnonymous ? [] : equippedItems} size={112} pose="face" />
          <span className="absolute -bottom-1 right-0 text-[10px] font-extrabold bg-primary text-primary-foreground rounded-full px-2 py-0.5 shadow-md">
            Lv.{level.level}
          </span>
        </div>
        <h2 className="mt-3 text-xl font-extrabold">{profileData?.profile.displayName ?? "Traveler"}</h2>
        <p className="text-sm text-muted-foreground">
          {profileData?.profile.countryFlag ?? "🌍"} Joined{" "}
          {profileData
            ? new Date(profileData.profile.joinedAt).toLocaleDateString(undefined, { month: "long", year: "numeric" })
            : "..."}
        </p>
      </div>

      {isAnonymous && (
        <div className="mt-4 mx-5 rounded-2xl bg-primary/10 border border-primary/30 p-4 flex items-center gap-3">
          <LogIn size={20} className="text-primary shrink-0" />
          <p className="text-xs font-semibold flex-1">Log in to save your progress across devices.</p>
          <Button size="sm" className="rounded-lg text-xs h-8 px-3 shrink-0" onClick={() => navigate("/login")}>
            Log In
          </Button>
        </div>
      )}

      {/* Stats row */}
      <div className="mt-5 mx-5 grid grid-cols-3 gap-3">
        {[
          { icon: MapPin, label: "Quests", value: String(MOCK_QUESTS_BASELINE + (stats?.completedQuestCount ?? 0)) },
          { icon: Camera, label: "Photos", value: String(stats?.photoCount ?? 0) },
          { icon: Users, label: "Friends", value: String(stats?.friendCount ?? 0) },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex flex-col items-center rounded-2xl bg-card border border-border p-3 shadow-sm">
            <Icon size={16} className="text-primary" />
            <span className="mt-1 text-lg font-bold">{value}</span>
            <span className="text-[11px] text-muted-foreground">{label}</span>
          </div>
        ))}
      </div>

      {/* Level */}
      <div className="mt-4 mx-5 rounded-2xl bg-card border border-border p-4 shadow-sm">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Zap size={16} className="text-xp" />
            <span className="font-bold">Level {level.level} — {levelTitle(level.level)}</span>
          </div>
          <span className="text-muted-foreground text-xs">
            {level.currentLevelXp} / {level.xpToNext} XP
          </span>
        </div>
        <Progress value={level.progressPct} className="mt-2 h-3 rounded-full bg-muted [&>div]:bg-primary [&>div]:rounded-full" />
        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
          <Flame size={13} className="text-primary" />
          <span className="font-semibold">{profileData?.profile.currentStreak ?? 0} day streak</span>
        </div>
      </div>

      {/* Badges */}
      <div className="mt-5 mx-5">
        <div className="flex items-center gap-2 mb-3">
          <Award size={18} className="text-accent-foreground" />
          <h2 className="font-bold">Badges</h2>
        </div>
        {isAnonymous ? (
          <div className="grid grid-cols-3 gap-3">
            {badges.map((b) => (
              <div key={b.id} className="flex flex-col items-center gap-1 rounded-xl bg-card border border-border py-3">
                <span className="text-2xl">{b.emoji}</span>
                <span className="text-[10px] font-semibold text-muted-foreground">{b.label}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {badgeList.map((b) => (
              <div
                key={b.id}
                className={`flex flex-col items-center gap-1 rounded-xl bg-card border border-border py-3 ${
                  b.unlocked ? "" : "opacity-40"
                }`}
              >
                <span className="text-2xl">{b.unlocked ? b.emoji : "🔒"}</span>
                <span className="text-[10px] font-semibold text-muted-foreground">{b.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tiger Wardrobe */}
      {isAnonymous ? (
        <div className="mt-5 mx-5 rounded-2xl bg-card border border-border p-5 flex flex-col items-center text-center gap-3">
          <TigerAvatar size={96} pose="wave" />
          <p className="text-sm font-bold">Log in to unlock your Tiger Wardrobe</p>
          <p className="text-xs text-muted-foreground -mt-1">
            Items you earn from quests will be saved to your account once you log in.
          </p>
          <Button size="sm" className="rounded-lg text-xs h-8 px-4" onClick={() => navigate("/login")}>
            Log In
          </Button>
        </div>
      ) : (
        <TigerWardrobe />
      )}

      {/* Reward Stamp Chart */}
      <div className="mt-5 mx-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">🏆</span>
            <h2 className="font-bold">Reward Chart</h2>
          </div>
          <span className="text-xs font-bold text-primary">{chartCompletedCount}/{REWARD_CHART_SIZE} completed</span>
        </div>
        <div className="rounded-2xl bg-card border border-border p-4 shadow-sm">
          <Progress
            value={(chartCompletedCount / REWARD_CHART_SIZE) * 100}
            className="h-2.5 rounded-full bg-muted [&>div]:bg-primary [&>div]:rounded-full mb-4"
          />
          <div className="grid grid-cols-5 gap-3">
            {rewardStamps.map((quest, i) => (
              <div key={quest?.userQuestId ?? i} className="flex flex-col items-center gap-1">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center text-xl border-2 transition-all ${
                    quest ? "bg-primary/10 border-primary shadow-sm" : "bg-muted/50 border-border opacity-40"
                  }`}
                >
                  {quest ? quest.emoji : "🔒"}
                </div>
                <span
                  className={`text-[9px] font-semibold text-center leading-tight ${
                    quest ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {quest ? quest.title : "Locked"}
                </span>
              </div>
            ))}
          </div>
          <p className="text-center text-[11px] text-muted-foreground mt-4">
            {chartCompletedCount >= REWARD_CHART_SIZE
              ? "Stamp card full! 🎉"
              : `Complete ${REWARD_CHART_SIZE - chartCompletedCount} more quests to fill your stamp card! 🎉`}
          </p>
        </div>
      </div>

      {/* Journal Tabs */}
      <div className="mt-6 mx-5">
        <Tabs defaultValue="journal">
          <TabsList className="w-full grid grid-cols-2 h-10 rounded-xl bg-muted">
            <TabsTrigger value="journal" className="rounded-lg text-xs font-bold">
              📓 Journal
            </TabsTrigger>
            <TabsTrigger value="photos" className="rounded-lg text-xs font-bold">
              📸 Photos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="journal" className="mt-4 space-y-4">
            {/* Write Journal Button */}
            <Button
              variant="outline"
              className="w-full rounded-xl h-12 font-bold gap-2 border-dashed border-2"
              onClick={() => setShowJournalForm(!showJournalForm)}
            >
              <PenLine size={16} />
              Write Journal Entry
            </Button>

            {showJournalForm && (
              <div className="rounded-2xl border border-border bg-card p-4 shadow-sm space-y-3">
                <textarea
                  value={journalText}
                  onChange={(e) => setJournalText(e.target.value)}
                  placeholder="Write about your adventure today..."
                  className="w-full rounded-xl border border-border bg-background p-3 text-sm resize-none min-h-[80px] focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                {journalPhotoPreview && (
                  <img src={journalPhotoPreview} alt="Attached" className="w-full h-32 object-cover rounded-xl" />
                )}
                <input
                  ref={journalFileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleJournalPhotoSelect}
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-lg text-xs gap-1.5"
                    onClick={() => journalFileInputRef.current?.click()}
                  >
                    <Camera size={14} /> Add Photo
                  </Button>
                  <Button
                    size="sm"
                    className="rounded-lg text-xs ml-auto"
                    disabled={!journalText.trim() || createJournalEntry.isPending}
                    onClick={handlePostJournal}
                  >
                    {createJournalEntry.isPending ? "Posting..." : "Post"}
                  </Button>
                </div>
                {createJournalEntry.isError && (
                  <p role="alert" className="text-xs text-destructive">
                    {createJournalEntry.error instanceof Error ? createJournalEntry.error.message : "Could not post."}
                  </p>
                )}
              </div>
            )}

            {(journalEntries ?? []).map((post) => (
              <button
                key={post.id}
                onClick={() => navigate(`/journal/${post.id}`)}
                className="w-full text-left rounded-2xl overflow-hidden border border-border shadow-sm bg-card"
              >
                {post.photoUrl && (
                  <img src={post.photoUrl} alt="Journal entry" className="w-full h-48 object-cover" loading="lazy" />
                )}
                <div className="p-4">
                  <p className="text-sm leading-relaxed line-clamp-3">{post.content}</p>
                  <div className="mt-3 flex items-center justify-between text-muted-foreground">
                    <span className="flex items-center gap-1 text-xs">
                      <Heart size={14} /> {post.likeCount}
                    </span>
                    <span className="text-[11px]">{new Date(post.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </button>
            ))}

            {mockJournalPosts.map((post, i) => (
              <div key={i} className="rounded-2xl overflow-hidden border border-border shadow-sm bg-card">
                <img src={post.image} alt="Journal entry" className="w-full h-48 object-cover" loading="lazy" />
                <div className="p-4">
                  <p className="text-sm leading-relaxed">{post.text}</p>
                  <div className="mt-3 flex items-center justify-between text-muted-foreground">
                    <span className="flex items-center gap-1 text-xs">
                      <Heart size={14} /> {post.likes}
                    </span>
                    <span className="text-[11px]">{post.date}</span>
                  </div>
                </div>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="photos" className="mt-4">
            <div className="grid grid-cols-3 gap-1.5 rounded-xl overflow-hidden">
              {(photos ?? []).map((photo) => (
                <img key={photo.id} src={photo.url} alt="Quest proof" className="w-full aspect-square object-cover" loading="lazy" />
              ))}
              {mockJournalPosts.map((post, i) => (
                <img key={i} src={post.image} alt="Photo" className="w-full aspect-square object-cover" loading="lazy" />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Profile;
