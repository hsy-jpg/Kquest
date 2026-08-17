import { ArrowLeft, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useDiscoverableProfiles, useToggleFriend } from "@/features/social/useFriends";
import userSarah from "@/assets/user-sarah.jpg";
import userYuki from "@/assets/user-yuki.jpg";
import userTom from "@/assets/user-tom.jpg";
import userEmma from "@/assets/user-emma.jpg";
import userCarlos from "@/assets/user-carlos.jpg";

const mockUsers = [
  { name: "Mia Chen", flag: "🇨🇦", image: userSarah, bio: "Foodie & photographer" },
  { name: "Liam Park", flag: "🇦🇺", image: userYuki, bio: "K-pop fan, loves street food" },
  { name: "Nina Weber", flag: "🇩🇪", image: userEmma, bio: "Budget traveler & hiker" },
  { name: "Jake Wilson", flag: "🇺🇸", image: userTom, bio: "Night owl, bar hopper" },
  { name: "Sofia Martinez", flag: "🇲🇽", image: userCarlos, bio: "Culture explorer" },
  { name: "Haruto Tanaka", flag: "🇯🇵", image: userYuki, bio: "Ramen enthusiast" },
  { name: "Chloe Dubois", flag: "🇫🇷", image: userEmma, bio: "Fashion & thrift shopping" },
  { name: "Oscar Svensson", flag: "🇸🇪", image: userTom, bio: "Hiking & nature lover" },
];

const InviteFriends = () => {
  const navigate = useNavigate();
  const { data: profiles, isLoading } = useDiscoverableProfiles();
  const toggleFriend = useToggleFriend();
  const [invitedMock, setInvitedMock] = useState<Set<string>>(new Set());

  const toggleMock = (name: string) => {
    setInvitedMock((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card">
        <button onClick={() => navigate("/community")} className="p-1">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-bold">Invite Friends</h1>
      </div>

      {/* Search */}
      <div className="px-4 py-3">
        <div className="flex items-center gap-2 bg-muted rounded-full px-4 py-2">
          <Search size={16} className="text-muted-foreground" />
          <input placeholder="Search by name..." className="bg-transparent text-sm outline-none flex-1" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 space-y-1">
        {mockUsers.map((u) => (
          <div key={u.name} className="flex items-center gap-3 py-3 border-b border-border last:border-0">
            <img src={u.image} alt={u.name} className="w-12 h-12 rounded-full object-cover" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold">{u.name} {u.flag}</p>
              <p className="text-xs text-muted-foreground truncate">{u.bio}</p>
            </div>
            <Button
              size="sm"
              variant={invitedMock.has(u.name) ? "secondary" : "default"}
              className="rounded-xl text-xs font-bold h-8 px-4 shrink-0"
              onClick={() => toggleMock(u.name)}
            >
              {invitedMock.has(u.name) ? "Invited ✓" : "Invite"}
            </Button>
          </div>
        ))}

        {isLoading && <p className="text-center text-xs text-muted-foreground py-6">Loading travelers...</p>}
        {(profiles ?? []).map((u) => (
          <div key={u.userId} className="flex items-center gap-3 py-3 border-b border-border last:border-0">
            <button
              onClick={() => navigate(`/traveler/${u.userId}`)}
              className="flex items-center gap-3 flex-1 min-w-0 text-left"
            >
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-xl shrink-0">
                {u.countryFlag}
              </div>
              <p className="text-sm font-bold truncate">{u.displayName}</p>
            </button>
            <Button
              size="sm"
              variant={u.isFriend ? "secondary" : "default"}
              className="rounded-xl text-xs font-bold h-8 px-4 shrink-0"
              disabled={toggleFriend.isPending}
              onClick={() => toggleFriend.mutate(u.userId)}
            >
              {u.isFriend ? "Invited ✓" : "Invite"}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default InviteFriends;
