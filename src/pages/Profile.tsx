import { useState } from "react";
import { Award, Flame, MapPin, Zap, Camera, Users, Heart, Settings, PenLine } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import TigerAvatar from "@/components/TigerAvatar";
import TigerWardrobe from "@/components/TigerWardrobe";
import { useWardrobe } from "@/lib/wardrobe";
import journalFood from "@/assets/journal-food.jpg";
import journalView from "@/assets/journal-view.jpg";
import journalHanbok from "@/assets/journal-hanbok.jpg";

const badges = [
  { label: "First Quest", emoji: "⭐" },
  { label: "Foodie", emoji: "🍜" },
  { label: "Explorer", emoji: "🧭" },
  { label: "Night Owl", emoji: "🦉" },
  { label: "Socialite", emoji: "🤝" },
  { label: "Photographer", emoji: "📸" },
];

const journalPosts = [
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

const rewardStamps = [
  { label: "Pojangmacha", emoji: "🍻", completed: true },
  { label: "Ramen Chef", emoji: "🍜", completed: true },
  { label: "Thrift King", emoji: "👕", completed: true },
  { label: "Noraebang", emoji: "🎤", completed: false },
  { label: "Inwangsan", emoji: "⛰️", completed: false },
  { label: "Food Tour", emoji: "🥘", completed: false },
  { label: "Cafe Hunter", emoji: "☕", completed: false },
  { label: "Hanok Walk", emoji: "🏠", completed: false },
  { label: "Night Market", emoji: "🌙", completed: false },
  { label: "Palace", emoji: "👑", completed: false },
];

const completedCount = rewardStamps.filter((s) => s.completed).length;

const Profile = () => {
  const [showJournalForm, setShowJournalForm] = useState(false);
  const { equippedItems } = useWardrobe();

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
          <TigerAvatar items={equippedItems} size={112} pose="face" />
          <span className="absolute -bottom-1 right-0 text-[10px] font-extrabold bg-primary text-primary-foreground rounded-full px-2 py-0.5 shadow-md">
            Lv.4
          </span>
        </div>
        <h2 className="mt-3 text-xl font-extrabold">Alex Traveler</h2>
        <p className="text-sm text-muted-foreground">🇺🇸 Joined March 2026</p>
      </div>

      {/* Stats row */}
      <div className="mt-5 mx-5 grid grid-cols-3 gap-3">
        {[
          { icon: MapPin, label: "Quests", value: "12" },
          { icon: Camera, label: "Photos", value: "34" },
          { icon: Users, label: "Friends", value: "28" },
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
            <span className="font-bold">Level 4 — Explorer</span>
          </div>
          <span className="text-muted-foreground text-xs">320 / 500 XP</span>
        </div>
        <Progress value={64} className="mt-2 h-3 rounded-full bg-muted [&>div]:bg-primary [&>div]:rounded-full" />
        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
          <Flame size={13} className="text-primary" />
          <span className="font-semibold">5 day streak</span>
        </div>
      </div>

      {/* Badges */}
      <div className="mt-5 mx-5">
        <div className="flex items-center gap-2 mb-3">
          <Award size={18} className="text-accent-foreground" />
          <h2 className="font-bold">Badges</h2>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {badges.map((b) => (
            <div key={b.label} className="flex flex-col items-center gap-1 rounded-xl bg-card border border-border py-3">
              <span className="text-2xl">{b.emoji}</span>
              <span className="text-[10px] font-semibold text-muted-foreground">{b.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Tiger Wardrobe */}
      <TigerWardrobe />

      {/* Reward Stamp Chart */}
      <div className="mt-5 mx-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">🏆</span>
            <h2 className="font-bold">Reward Chart</h2>
          </div>
          <span className="text-xs font-bold text-primary">{completedCount}/{rewardStamps.length} completed</span>
        </div>
        <div className="rounded-2xl bg-card border border-border p-4 shadow-sm">
          <Progress
            value={(completedCount / rewardStamps.length) * 100}
            className="h-2.5 rounded-full bg-muted [&>div]:bg-primary [&>div]:rounded-full mb-4"
          />
          <div className="grid grid-cols-5 gap-3">
            {rewardStamps.map((stamp) => (
              <div key={stamp.label} className="flex flex-col items-center gap-1">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center text-xl border-2 transition-all ${
                    stamp.completed
                      ? "bg-primary/10 border-primary shadow-sm"
                      : "bg-muted/50 border-border opacity-40"
                  }`}
                >
                  {stamp.completed ? stamp.emoji : "🔒"}
                </div>
                <span className={`text-[9px] font-semibold text-center leading-tight ${
                  stamp.completed ? "text-foreground" : "text-muted-foreground"
                }`}>
                  {stamp.label}
                </span>
              </div>
            ))}
          </div>
          <p className="text-center text-[11px] text-muted-foreground mt-4">
            Complete {rewardStamps.length - completedCount} more quests to fill your stamp card! 🎉
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
                  placeholder="Write about your adventure today..."
                  className="w-full rounded-xl border border-border bg-background p-3 text-sm resize-none min-h-[80px] focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="rounded-lg text-xs gap-1.5">
                    <Camera size={14} /> Add Photo
                  </Button>
                  <Button size="sm" className="rounded-lg text-xs ml-auto">
                    Post
                  </Button>
                </div>
              </div>
            )}

            {journalPosts.map((post, i) => (
              <div key={i} className="rounded-2xl overflow-hidden border border-border shadow-sm bg-card">
                <img
                  src={post.image}
                  alt="Journal entry"
                  className="w-full h-48 object-cover"
                  loading="lazy"
                  width={512}
                  height={512}
                />
                <div className="p-4">
                  <p className="text-sm leading-relaxed">{post.text}</p>
                  <div className="mt-3 flex items-center justify-between text-muted-foreground">
                    <button className="flex items-center gap-1 text-xs">
                      <Heart size={14} /> {post.likes}
                    </button>
                    <span className="text-[11px]">{post.date}</span>
                  </div>
                </div>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="photos" className="mt-4">
            <div className="grid grid-cols-3 gap-1.5 rounded-xl overflow-hidden">
              {journalPosts.map((post, i) => (
                <img
                  key={i}
                  src={post.image}
                  alt="Photo"
                  className="w-full aspect-square object-cover"
                  loading="lazy"
                  width={512}
                  height={512}
                />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Profile;
