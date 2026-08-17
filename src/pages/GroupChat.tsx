import { ArrowLeft, Send } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import userSarah from "@/assets/user-sarah.jpg";
import userYuki from "@/assets/user-yuki.jpg";
import userTom from "@/assets/user-tom.jpg";
import userEmma from "@/assets/user-emma.jpg";
import userCarlos from "@/assets/user-carlos.jpg";

const messages = [
  { id: 1, user: "Sarah K.", image: userSarah, text: "Hey everyone! Anyone want to check out Gwangjang Market tonight? 🍜", time: "7:32 PM", self: false },
  { id: 2, user: "You", image: userTom, text: "I'm in! What time are you heading there?", time: "7:34 PM", self: true },
  { id: 3, user: "Yuki M.", image: userYuki, text: "Count me in too! I've been wanting to try the mung bean pancakes 😋", time: "7:35 PM", self: false },
  { id: 4, user: "Emma L.", image: userEmma, text: "Is it far from Myeongdong? I'm staying near there", time: "7:36 PM", self: false },
  { id: 5, user: "Sarah K.", image: userSarah, text: "It's just 2 stops on Line 1! Let's meet at 8pm at Exit 7?", time: "7:38 PM", self: false },
  { id: 6, user: "Carlos R.", image: userCarlos, text: "Perfect, I'll bring my camera for the food pics 📸", time: "7:39 PM", self: false },
  { id: 7, user: "You", image: userTom, text: "Sounds great! See you all there 🙌", time: "7:40 PM", self: true },
  { id: 8, user: "Yuki M.", image: userYuki, text: "Should we try the pojangmacha after? I know a great spot nearby!", time: "7:42 PM", self: false },
  { id: 9, user: "Emma L.", image: userEmma, text: "Yes!! Night market food is the best 🔥", time: "7:43 PM", self: false },
];

const GroupChat = () => {
  const navigate = useNavigate();
  const [input, setInput] = useState("");

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card">
        <button onClick={() => navigate("/community")} className="p-1">
          <ArrowLeft size={20} />
        </button>
        <div className="flex -space-x-2">
          {[userSarah, userYuki, userEmma].map((img, i) => (
            <img key={i} src={img} alt="" className="w-8 h-8 rounded-full border-2 border-card object-cover" />
          ))}
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold">Seoul Explorers</p>
          <p className="text-[11px] text-muted-foreground">5 members • 3 online</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.map((m) => (
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
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-border bg-card flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 rounded-full bg-muted px-4 py-2 text-sm outline-none"
        />
        <button className="bg-primary text-primary-foreground rounded-full w-10 h-10 flex items-center justify-center shrink-0">
          <Send size={18} />
        </button>
      </div>
    </div>
  );
};

export default GroupChat;
