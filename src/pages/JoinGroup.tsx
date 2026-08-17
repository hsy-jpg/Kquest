import { ArrowLeft, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useGroups, useJoinGroup } from "@/features/social/useGroups";
import { GROUP_VISUALS } from "@/data/groupVisuals";

const JoinGroup = () => {
  const navigate = useNavigate();
  const { data: groups, isLoading } = useGroups();
  const joinGroup = useJoinGroup();

  const handleOpen = async (groupId: string, isMember: boolean) => {
    if (!isMember) await joinGroup.mutateAsync(groupId);
    navigate(`/community/chat/${groupId}`);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card">
        <button onClick={() => navigate("/community")} className="p-1">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-bold">Join a Group</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {isLoading && <p className="text-center text-xs text-muted-foreground py-6">Loading groups...</p>}
        {(groups ?? []).map((g) => {
          const visuals = GROUP_VISUALS[g.name];
          const displayMembers = (visuals?.baseMembers ?? 0) + g.memberCount;
          return (
            <div key={g.id} className="rounded-2xl bg-card border border-border overflow-hidden shadow-sm">
              {visuals ? (
                <img src={visuals.image} alt={g.name} className="w-full h-28 object-cover" />
              ) : (
                <div className="h-24 flex items-center justify-center text-5xl bg-primary/10">{g.emoji}</div>
              )}
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <h3 className="font-bold text-sm">{g.name}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{g.description}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-2">
                    {visuals && (
                      <div className="flex -space-x-2">
                        {visuals.avatars.map((a, i) => (
                          <img key={i} src={a} alt="" className="w-6 h-6 rounded-full border-2 border-card object-cover" />
                        ))}
                      </div>
                    )}
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Users size={12} /> {displayMembers} member{displayMembers === 1 ? "" : "s"}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant={g.isMember ? "secondary" : "default"}
                    className="rounded-xl text-xs font-bold h-8 px-5"
                    disabled={joinGroup.isPending}
                    onClick={() => handleOpen(g.id, g.isMember)}
                  >
                    {g.isMember ? "Open" : "Join"}
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default JoinGroup;
