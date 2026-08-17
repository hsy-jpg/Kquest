import { Heart, MessageCircle, Trophy, Users, MessageSquare, UserPlus, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useDiscoverableProfiles, useToggleFriend, useXpLeaderboard } from "@/features/social/useFriends";
import { useJournalFeed, useToggleJournalLike } from "@/features/journal/useJournal";
import userSarah from "@/assets/user-sarah.jpg";
import userYuki from "@/assets/user-yuki.jpg";
import userTom from "@/assets/user-tom.jpg";
import userEmma from "@/assets/user-emma.jpg";
import userCarlos from "@/assets/user-carlos.jpg";

const actions = [
  { label: "Join Group", desc: "Find travelers near you", icon: Users, color: "text-primary", path: "/community/groups" },
  { label: "Group Chat", desc: "Chat with your squad", icon: MessageSquare, color: "text-secondary", path: "/community/chat" },
  { label: "Invite Friends", desc: "Share the adventure", icon: UserPlus, color: "text-accent-foreground", path: "/community/invite" },
];

const mockRecommended = [
  { name: "Mia Chen", flag: "🇨🇦", image: userSarah, quests: 18 },
  { name: "Liam Park", flag: "🇦🇺", image: userYuki, quests: 25 },
  { name: "Nina W.", flag: "🇩🇪", image: userEmma, quests: 9 },
];

const mockLeaderboard = [
  { name: "Sarah K.", xp: 2450, flag: "🇺🇸", image: userSarah },
  { name: "Yuki M.", xp: 2120, flag: "🇯🇵", image: userYuki },
  { name: "Tom B.", xp: 1980, flag: "🇬🇧", image: userTom },
];

const mockPosts = [
  { user: "Emma L.", flag: "🇫🇷", image: userEmma, text: "Just completed the street food quest in Myeongdong! 🍢🔥", likes: 24, comments: 5 },
  { user: "Carlos R.", flag: "🇪🇸", image: userCarlos, text: "Bukchon Hanok Village is absolutely stunning 🏘️", likes: 31, comments: 8 },
];

const Community = () => {
  const navigate = useNavigate();
  const { data: profiles } = useDiscoverableProfiles();
  const { data: leaderboard } = useXpLeaderboard();
  const { data: feed } = useJournalFeed();
  const toggleFriend = useToggleFriend();
  const toggleLike = useToggleJournalLike();

  const recommended = (profiles ?? []).filter((p) => !p.isFriend).slice(0, 5);

  const mergedLeaderboard = [
    ...mockLeaderboard.map((u) => ({ userId: null as string | null, displayName: u.name, photo: u.image, flag: null as string | null, totalXp: u.xp })),
    ...(leaderboard ?? []).map((u) => ({ userId: u.userId, displayName: u.displayName, photo: null as string | null, flag: u.countryFlag, totalXp: u.totalXp })),
  ]
    .sort((a, b) => b.totalXp - a.totalXp)
    .slice(0, 6);

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
          <button
            onClick={() => navigate("/community/invite")}
            className="flex items-center gap-0.5 text-xs font-bold text-primary"
          >
            See all <ChevronRight size={14} />
          </button>
        </div>
        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
          {mockRecommended.map((u) => (
            <div
              key={u.name}
              className="min-w-[140px] flex flex-col items-center gap-2 rounded-2xl bg-card border border-border p-4 shadow-sm shrink-0"
            >
              <img src={u.image} alt={u.name} className="w-14 h-14 rounded-full object-cover" loading="lazy" />
              <div className="text-center">
                <p className="text-sm font-bold">{u.name}</p>
                <p className="text-[11px] text-muted-foreground">{u.flag} {u.quests} quests</p>
              </div>
              <Button size="sm" variant="outline" className="rounded-xl text-xs font-bold h-7 px-4">
                Follow
              </Button>
            </div>
          ))}
          {recommended.map((u) => (
            <div
              key={u.userId}
              className="min-w-[140px] flex flex-col items-center gap-2 rounded-2xl bg-card border border-border p-4 shadow-sm shrink-0"
            >
              <button
                onClick={() => navigate(`/traveler/${u.userId}`)}
                className="flex flex-col items-center gap-2"
              >
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-2xl">
                  {u.countryFlag}
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold truncate max-w-[110px]">{u.displayName}</p>
                </div>
              </button>
              <Button
                size="sm"
                variant="outline"
                className="rounded-xl text-xs font-bold h-7 px-4"
                disabled={toggleFriend.isPending}
                onClick={() => toggleFriend.mutate(u.userId)}
              >
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
          <h2 className="font-bold text-sm">XP Leaderboard</h2>
        </div>
        {mergedLeaderboard.map((u, i) => {
          const rankMedal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}`;
          const content = (
            <>
              <span className="w-6 text-center text-sm font-bold text-muted-foreground">{rankMedal}</span>
              {u.photo ? (
                <img src={u.photo} alt={u.displayName} className="w-9 h-9 rounded-full object-cover" loading="lazy" />
              ) : (
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-base">
                  {u.flag}
                </div>
              )}
              <span className="flex-1 text-sm font-semibold truncate">{u.displayName}</span>
              <span className="text-xs font-bold text-xp">{u.totalXp} XP</span>
            </>
          );
          return u.userId ? (
            <button
              key={u.userId}
              onClick={() => navigate(`/traveler/${u.userId}`)}
              className="flex items-center gap-3 py-2 w-full text-left"
            >
              {content}
            </button>
          ) : (
            <div key={u.displayName} className="flex items-center gap-3 py-2">
              {content}
            </div>
          );
        })}
      </div>

      {/* Activity Feed */}
      <div>
        <h2 className="text-lg font-bold mb-3">Activity Feed</h2>
        <div className="flex flex-col gap-3">
          {mockPosts.map((post, i) => (
            <div key={i} className="rounded-2xl bg-card border border-border p-4 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <img src={post.image} alt={post.user} className="w-9 h-9 rounded-full object-cover" loading="lazy" />
                <div>
                  <span className="text-sm font-bold">{post.user}</span>
                  <p className="text-[11px] text-muted-foreground">{post.flag} • 2h ago</p>
                </div>
              </div>
              <p className="text-sm">{post.text}</p>
              <div className="mt-3 flex items-center gap-4 text-muted-foreground">
                <span className="flex items-center gap-1 text-xs">
                  <Heart size={14} /> {post.likes}
                </span>
                <span className="flex items-center gap-1 text-xs">
                  <MessageCircle size={14} /> {post.comments}
                </span>
              </div>
            </div>
          ))}
          {(feed ?? []).map((post) => (
            <button
              key={post.id}
              onClick={() => navigate(`/journal/${post.id}`)}
              className="text-left rounded-2xl bg-card border border-border p-4 shadow-sm"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-base">
                  {post.author.countryFlag}
                </div>
                <div>
                  <span className="text-sm font-bold">{post.author.displayName}</span>
                  <p className="text-[11px] text-muted-foreground">{new Date(post.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
              <p className="text-sm line-clamp-3">{post.content}</p>
              <div className="mt-3 flex items-center gap-4 text-muted-foreground">
                <span
                  role="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleLike.mutate(post.id);
                  }}
                  className={`flex items-center gap-1 text-xs font-semibold ${post.likedByMe ? "text-destructive" : ""}`}
                >
                  <Heart size={14} className={post.likedByMe ? "fill-current" : ""} /> {post.likeCount}
                </span>
                <span className="flex items-center gap-1 text-xs">
                  <MessageCircle size={14} /> {post.commentCount}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Community;
