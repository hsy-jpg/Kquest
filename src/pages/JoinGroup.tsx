import { ArrowLeft, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import userSarah from "@/assets/user-sarah.jpg";
import userYuki from "@/assets/user-yuki.jpg";
import userTom from "@/assets/user-tom.jpg";
import userEmma from "@/assets/user-emma.jpg";
import userCarlos from "@/assets/user-carlos.jpg";
import questPojangmacha from "@/assets/quest-pojangmacha.jpg";
import questRamen from "@/assets/quest-ramen.jpg";
import questDongmyo from "@/assets/quest-dongmyo.jpg";
import questNoraebang from "@/assets/quest-noraebang.jpg";
import questInwangsan from "@/assets/quest-inwangsan.jpg";

const groups = [
  {
    name: "Seoul Foodies",
    image: questPojangmacha,
    members: 48,
    desc: "Share the best street food spots and hidden restaurants in Seoul",
    avatars: [userSarah, userYuki, userEmma],
  },
  {
    name: "K-Culture Crew",
    image: questNoraebang,
    members: 35,
    desc: "Noraebang nights, K-drama locations, and pop-up events",
    avatars: [userTom, userCarlos, userSarah],
  },
  {
    name: "Budget Explorers",
    image: questDongmyo,
    members: 62,
    desc: "Explore Seoul on a budget — thrift shops, free attractions, cheap eats",
    avatars: [userEmma, userYuki, userTom],
  },
  {
    name: "Night Owls Seoul",
    image: questRamen,
    members: 29,
    desc: "Late-night ramen runs, convenience store hacks, and after-hours vibes",
    avatars: [userCarlos, userSarah, userYuki],
  },
  {
    name: "Hiking & Nature",
    image: questInwangsan,
    members: 41,
    desc: "Mountain trails, hidden parks, and sunrise viewpoints around Seoul",
    avatars: [userTom, userEmma, userCarlos],
  },
];

const JoinGroup = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card">
        <button onClick={() => navigate("/community")} className="p-1">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-bold">Join a Group</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {groups.map((g) => (
          <div key={g.name} className="rounded-2xl bg-card border border-border overflow-hidden shadow-sm">
            <img src={g.image} alt={g.name} className="w-full h-28 object-cover" />
            <div className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <h3 className="font-bold text-sm">{g.name}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{g.desc}</p>
                </div>
              </div>
              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {g.avatars.map((a, i) => (
                      <img key={i} src={a} alt="" className="w-6 h-6 rounded-full border-2 border-card object-cover" />
                    ))}
                  </div>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Users size={12} /> {g.members} members
                  </span>
                </div>
                <Button size="sm" className="rounded-xl text-xs font-bold h-8 px-5">
                  Join
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default JoinGroup;
