import { ArrowLeft, ArrowRight, Dice5, Sparkles, Star, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { travelGames } from "@/data/games";
import tigerMap from "@/assets/tiger-map.png";

const GameZone = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-[100dvh] overflow-hidden bg-[hsl(var(--korean-deep))] pb-8 text-white">
      <header className="relative overflow-hidden px-5 pb-7 pt-5">
        <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-primary/30 blur-2xl" />
        <button onClick={() => navigate("/quests")} className="relative flex items-center gap-1 text-sm font-extrabold text-white/75"><ArrowLeft size={16} /> Quests</button>
        <div className="relative mt-5 flex items-end gap-2">
          <div className="min-w-0 flex-1"><div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-[hsl(var(--xp))]"><Dice5 size={16} /> Game Zone</div><h1 className="mt-2 text-4xl font-black tracking-tight">LET'S PLAY! 🎲</h1><p className="mt-3 max-w-xs text-sm font-bold leading-relaxed text-white/70">No plans. No boring itineraries.<br />Pick a challenge and let Korea surprise you.</p></div>
          <img src={tigerMap} alt="K-Quest tiger game master" className="-mr-5 h-36 w-32 object-contain drop-shadow-2xl" />
        </div>
        <Star className="absolute right-9 top-8 rotate-12 text-[hsl(var(--xp))]" size={18} /><Zap className="absolute right-24 top-20 -rotate-12 text-accent" size={17} />
      </header>
      <main className="rounded-t-[2rem] bg-background px-5 pb-8 pt-6 text-foreground">
        <div className="mb-4 flex items-center justify-between"><div><p className="text-[11px] font-black uppercase tracking-[0.18em] text-primary">Choose your challenge</p><h2 className="mt-1 text-xl font-black">Four ways to get surprised</h2></div><Sparkles className="text-xp" /></div>
        <div className="space-y-5">
          {travelGames.map((game, index) => (
            <article key={game.id} className={`relative overflow-hidden rounded-3xl border-2 border-foreground/10 bg-card p-4 shadow-[6px_7px_0_hsl(var(--korean-deep)/0.16)] transition-transform active:scale-[0.98] ${index % 2 ? "-rotate-[0.7deg]" : "rotate-[0.7deg]"}`}>
              <div className={`absolute inset-x-0 top-0 h-2 bg-gradient-to-r ${game.accent}`} />
              <div className="flex items-start gap-3"><span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-muted text-3xl shadow-inner">{game.emoji}</span><div><p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Game {index + 1}</p><h3 className="mt-0.5 font-black uppercase leading-tight">{game.title}</h3><p className="mt-1 text-xs font-bold text-muted-foreground">“{game.tagline}”</p></div></div>
              <div className="mt-4 flex flex-wrap gap-1.5">{game.rules.slice(0, 3).map((rule) => <span key={rule} className="rounded-full bg-primary/8 px-2.5 py-1 text-[10px] font-extrabold text-primary">{rule}</span>)}</div>
              <Button className="mt-4 h-11 w-full rounded-xl font-black" onClick={() => navigate(`/games/${game.id}`)}>START GAME <ArrowRight size={16} /></Button>
            </article>
          ))}
        </div>
      </main>
    </div>
  );
};

export default GameZone;
