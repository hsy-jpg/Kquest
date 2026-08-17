import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Heart, MapPin, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePublicProfile } from "@/features/social/usePublicProfile";
import { useJournalEntriesByUser } from "@/features/journal/useJournal";
import { useToggleFriend } from "@/features/social/useFriends";

const PublicProfile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { data: profile, isLoading } = usePublicProfile(userId);
  const { data: entries } = useJournalEntriesByUser(userId);
  const toggleFriend = useToggleFriend();

  if (isLoading) {
    return <div className="flex items-center justify-center h-full p-8 text-sm text-muted-foreground">Loading...</div>;
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <p className="text-4xl mb-3">😕</p>
        <p className="font-bold">Traveler not found</p>
        <button className="mt-4 text-sm font-bold text-primary" onClick={() => navigate("/community")}>
          Back to Community
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card">
        <button onClick={() => navigate(-1)} className="p-1">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-bold">Traveler</h1>
      </div>

      <div className="flex flex-col items-center pt-6 px-5">
        <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center text-4xl border-4 border-primary/30">
          {profile.countryFlag}
        </div>
        <h2 className="mt-3 text-xl font-extrabold">{profile.displayName}</h2>

        {!profile.isSelf && (
          <Button
            size="sm"
            variant={profile.isFriend ? "secondary" : "default"}
            className="mt-3 rounded-xl text-xs font-bold h-9 px-5"
            disabled={toggleFriend.isPending}
            onClick={() => toggleFriend.mutate(profile.userId)}
          >
            {profile.isFriend ? "Invited ✓" : "Invite"}
          </Button>
        )}

        <div className="mt-5 grid grid-cols-2 gap-3 w-full max-w-xs">
          <div className="flex flex-col items-center rounded-2xl bg-card border border-border p-3 shadow-sm">
            <MapPin size={16} className="text-primary" />
            <span className="mt-1 text-lg font-bold">{profile.completedQuestCount}</span>
            <span className="text-[11px] text-muted-foreground">Quests</span>
          </div>
          <div className="flex flex-col items-center rounded-2xl bg-card border border-border p-3 shadow-sm">
            <Zap size={16} className="text-xp" />
            <span className="mt-1 text-lg font-bold">{profile.totalXp}</span>
            <span className="text-[11px] text-muted-foreground">XP</span>
          </div>
        </div>
      </div>

      <div className="mt-6 px-5 pb-6">
        <p className="text-sm font-bold mb-3">📓 Journal</p>
        <div className="space-y-4">
          {(entries ?? []).map((post) => (
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
          {entries?.length === 0 && (
            <p className="text-center text-xs text-muted-foreground py-4">No journal entries yet.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default PublicProfile;
