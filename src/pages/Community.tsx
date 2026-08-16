import { Heart, MessageCircle, Trophy, Users, MessageSquare, UserPlus, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import userSarah from "@/assets/user-sarah.jpg";
import userYuki from "@/assets/user-yuki.jpg";
import userTom from "@/assets/user-tom.jpg";
import userEmma from "@/assets/user-emma.jpg";
import userCarlos from "@/assets/user-carlos.jpg";

const leaderboard = [
  { rank: 1, name: "Sarah K.", xp: 2450, flag: "🇺🇸", image: userSarah },
  { rank: 2, name: "Yuki M.", xp: 2120, flag: "🇯🇵", image: userYuki },
  { rank: 3, name: "Tom B.", xp: 1980, flag: "🇬🇧", image: userTom },
];

const posts = [
  { user: "Emma L.", flag: "🇫🇷", image: userEmma, text: "Just completed the street food quest in Myeongdong! 🍢🔥", likes: 24, comments: 5 },
  { user: "Carlos R.", flag: "🇪🇸", image: userCarlos, text: "Bukchon Hanok Village is absolutely stunning 🏘️", likes: 31, comments: 8 },
];

const recommended = [
  { name: "Mia Chen", flag: "🇨🇦", image: userSarah, quests: 18 },
  { name: "Liam Park", flag: "🇦🇺", image: userYuki, quests: 25 },
  { name: "Nina W.", flag: "🇩🇪", image: userEmma, quests: 9 },
];

const actions = [
  { label: "Join Group", desc: "Find travelers near you", icon: Users, color: "text-primary", path: "/community/groups" },
  { label: "Group Chat", desc: "Chat with your squad", icon: MessageSquare, color: "text-secondary", path: "/community/chat" },
  { label: "Invite Friends", desc: "Share the adventure", icon: UserPlus, color: "text-accent-foreground", path: "/community/invite" },
];

const Community = () => {
  const navigate = useNavigate();
  return (
    <div className="px-5 pt-6 pb-4 space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold">Community 🌍</h1>
        <p className="text-sm text-muted-foreground mt-1">See what others are exploring</p>
      </div>

      {/* Action Cards */}
      <div className="grid grid-cols-3 gap-3">
        {actions.map((a) => (
          <button
            key={a.label}
            onClick={() => navigate(a.path)}
            className="flex flex-col items-center gap-2 rounded-2xl bg-card border border-border p-4 shadow-sm transition-transform active:scale-95"
          >
            <a.icon size={22} className={a.color} />
            <span className="text-xs font-bold text-center leading-tight">{a.label}</span>
          </button>
        ))}
      </div>

      {/* Recommended Users */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold">Recommended Travelers</h2>
          <button className="flex items-center gap-0.5 text-xs font-bold text-primary">
            See all <ChevronRight size={14} />
          </button>
        </div>
        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
          {recommended.map((u) => (
            <div key={u.name} className="min-w-[140px] flex flex-col items-center gap-2 rounded-2xl bg-card border border-border p-4 shadow-sm shrink-0">
              <img src={u.image} alt={u.name} className="w-14 h-14 rounded-full object-cover" loading="lazy" width={512} height={512} />
              <div className="text-center">
                <p className="text-sm font-bold">{u.name}</p>
                <p className="text-[11px] text-muted-foreground">{u.flag} {u.quests} quests</p>
              </div>
              <Button size="sm" variant="outline" className="rounded-xl text-xs font-bold h-7 px-4">
                Follow
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Leaderboard */}
      <div className="rounded-2xl bg-card border border-border p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <Trophy size={18} className="text-accent-foreground" />
          <h2 className="font-bold text-sm">Weekly Leaderboard</h2>
        </div>
        {leaderboard.map((u) => (
          <div key={u.rank} className="flex items-center gap-3 py-2">
            <span className="w-6 text-center text-sm font-bold text-muted-foreground">
              {u.rank === 1 ? "🥇" : u.rank === 2 ? "🥈" : "🥉"}
            </span>
            <img src={u.image} alt={u.name} className="w-9 h-9 rounded-full object-cover" loading="lazy" width={512} height={512} />
            <span className="flex-1 text-sm font-semibold">{u.name}</span>
            <span className="text-xs font-bold text-xp">{u.xp} XP</span>
          </div>
        ))}
      </div>

      {/* Activity Feed */}
      <div>
        <h2 className="text-lg font-bold mb-3">Activity Feed</h2>
        <div className="flex flex-col gap-3">
          {posts.map((p, i) => (
            <div key={i} className="rounded-2xl bg-card border border-border p-4 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <img src={p.image} alt={p.user} className="w-9 h-9 rounded-full object-cover" loading="lazy" width={512} height={512} />
                <div>
                  <span className="text-sm font-bold">{p.user}</span>
                  <p className="text-[11px] text-muted-foreground">{p.flag} • 2h ago</p>
                </div>
              </div>
              <p className="text-sm">{p.text}</p>
              <div className="mt-3 flex items-center gap-4 text-muted-foreground">
                <button className="flex items-center gap-1 text-xs">
                  <Heart size={14} /> {p.likes}
                </button>
                <button className="flex items-center gap-1 text-xs">
                  <MessageCircle size={14} /> {p.comments}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Community;
