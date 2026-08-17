import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Send, Users } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useGroupInfo, useGroupMessages, useMyGroups, useSendGroupMessage } from "@/features/social/useGroups";
import { GROUP_VISUALS } from "@/data/groupVisuals";
import userSarah from "@/assets/user-sarah.jpg";
import userYuki from "@/assets/user-yuki.jpg";
import userTom from "@/assets/user-tom.jpg";
import userEmma from "@/assets/user-emma.jpg";
import userCarlos from "@/assets/user-carlos.jpg";

const mockMessages = [
  { id: "m1", user: "Sarah K.", image: userSarah, text: "Hey everyone! Anyone want to check out Gwangjang Market tonight? 🍜", time: "7:32 PM", self: false },
  { id: "m2", user: "You", image: userTom, text: "I'm in! What time are you heading there?", time: "7:34 PM", self: true },
  { id: "m3", user: "Yuki M.", image: userYuki, text: "Count me in too! I've been wanting to try the mung bean pancakes 😋", time: "7:35 PM", self: false },
  { id: "m4", user: "Emma L.", image: userEmma, text: "Is it far from Myeongdong? I'm staying near there", time: "7:36 PM", self: false },
  { id: "m5", user: "Sarah K.", image: userSarah, text: "It's just 2 stops on Line 1! Let's meet at 8pm at Exit 7?", time: "7:38 PM", self: false },
  { id: "m6", user: "Carlos R.", image: userCarlos, text: "Perfect, I'll bring my camera for the food pics 📸", time: "7:39 PM", self: false },
  { id: "m7", user: "You", image: userTom, text: "Sounds great! See you all there 🙌", time: "7:40 PM", self: true },
  { id: "m8", user: "Yuki M.", image: userYuki, text: "Should we try the pojangmacha after? I know a great spot nearby!", time: "7:42 PM", self: false },
  { id: "m9", user: "Emma L.", image: userEmma, text: "Yes!! Night market food is the best 🔥", time: "7:43 PM", self: false },
];

const GroupChat = () => {
  const { groupId } = useParams();
  if (!groupId) return <MyGroupsList />;
  return <GroupChatRoom groupId={groupId} />;
};

const MyGroupsList = () => {
  const navigate = useNavigate();
  const { data: groups, isLoading } = useMyGroups();

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card">
        <button onClick={() => navigate("/community")} className="p-1">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-bold">Group Chat</h1>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
        {isLoading && <p className="text-center text-xs text-muted-foreground py-6">Loading your groups...</p>}
        {groups?.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center gap-3">
            <p className="text-4xl">💬</p>
            <p className="text-sm font-bold">Join a group to start chatting</p>
            <button className="text-sm font-bold text-primary" onClick={() => navigate("/community/groups")}>
              Browse Groups
            </button>
          </div>
        )}
        {(groups ?? []).map((g) => {
          const displayMembers = (GROUP_VISUALS[g.name]?.baseMembers ?? 0) + g.memberCount;
          return (
            <button
              key={g.id}
              onClick={() => navigate(`/community/chat/${g.id}`)}
              className="w-full flex items-center gap-3 rounded-2xl bg-card border border-border p-3 shadow-sm text-left"
            >
              <div className="h-11 w-11 rounded-full bg-primary/10 flex items-center justify-center text-2xl shrink-0">
                {g.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate">{g.name}</p>
                <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <Users size={11} /> {displayMembers} member{displayMembers === 1 ? "" : "s"}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

const GroupChatRoom = ({ groupId }: { groupId: string }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: group } = useGroupInfo(groupId);
  const { data: messages } = useGroupMessages(groupId);
  const sendMessage = useSendGroupMessage();
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages?.length]);

  const handleSend = () => {
    if (!input.trim()) return;
    sendMessage.mutate({ groupId, content: input });
    setInput("");
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card">
        <button onClick={() => navigate("/community/chat")} className="p-1">
          <ArrowLeft size={20} />
        </button>
        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-lg">
          {group?.emoji ?? "💬"}
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold">{group?.name ?? "Group Chat"}</p>
          <p className="text-[11px] text-muted-foreground">
            {(group ? (GROUP_VISUALS[group.name]?.baseMembers ?? 0) + group.memberCount : 0)} members
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {mockMessages.map((m) => (
          <div key={m.id} className={`flex gap-2 ${m.self ? "flex-row-reverse" : ""}`}>
            {!m.self && (
              <img src={m.image} alt={m.user} className="w-8 h-8 rounded-full object-cover shrink-0 mt-1" />
            )}
            <div className={`max-w-[75%] ${m.self ? "items-end" : ""}`}>
              {!m.self && <p className="text-[11px] font-semibold text-muted-foreground mb-0.5">{m.user}</p>}
              <div className={`rounded-2xl px-3 py-2 text-sm ${m.self ? "bg-primary text-primary-foreground rounded-br-md" : "bg-muted rounded-bl-md"}`}>
                {m.text}
              </div>
              <p className={`text-[10px] text-muted-foreground mt-0.5 ${m.self ? "text-right" : ""}`}>{m.time}</p>
            </div>
          </div>
        ))}
        {(messages ?? []).map((m) => {
          const self = m.userId === user?.id;
          return (
            <div key={m.id} className={`flex gap-2 ${self ? "flex-row-reverse" : ""}`}>
              {!self && (
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-base shrink-0 mt-1">
                  {m.author.countryFlag}
                </div>
              )}
              <div className={`max-w-[75%] ${self ? "items-end" : ""}`}>
                {!self && <p className="text-[11px] font-semibold text-muted-foreground mb-0.5">{m.author.displayName}</p>}
                <div
                  className={`rounded-2xl px-3 py-2 text-sm ${
                    self ? "bg-primary text-primary-foreground rounded-br-md" : "bg-muted rounded-bl-md"
                  }`}
                >
                  {m.content}
                </div>
                <p className={`text-[10px] text-muted-foreground mt-0.5 ${self ? "text-right" : ""}`}>
                  {new Date(m.createdAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div className="px-4 py-3 border-t border-border bg-card flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Type a message..."
          className="flex-1 rounded-full bg-muted px-4 py-2 text-sm outline-none"
        />
        <button
          onClick={handleSend}
          disabled={sendMessage.isPending || !input.trim()}
          className="bg-primary text-primary-foreground rounded-full w-10 h-10 flex items-center justify-center shrink-0 disabled:opacity-50"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
};

export default GroupChat;
