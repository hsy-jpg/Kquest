import { useState } from "react";
import { ArrowLeft, Check, Dice5, LockKeyhole, RotateCcw, Sparkles, Trophy, Zap } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getTravelGame } from "@/data/games";
import tigerCheer from "@/assets/tiger-cheer.png";

const won = (value: number) => `₩${Math.max(0, value).toLocaleString()}`;

const GamePlay = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const game = getTravelGame(id);
  const [started, setStarted] = useState(false);
  const [missionIndex, setMissionIndex] = useState(0);
  const [expense, setExpense] = useState("");
  const [spent, setSpent] = useState(0);
  const [justUnlocked, setJustUnlocked] = useState(false);

  if (!game) return <div className="flex min-h-[70dvh] flex-col items-center justify-center"><p className="font-black">Game not found</p><Button variant="ghost" onClick={() => navigate("/games")}>Back to Game Zone</Button></div>;
  const complete = missionIndex >= game.missions.length;
  const remaining = (game.budget ?? 0) - spent;

  const completeMission = () => {
    const amount = game.budget ? Math.max(0, Number(expense) || 0) : 0;
    if (game.budget && amount > remaining) return;
    setSpent((value) => value + amount); setExpense(""); setMissionIndex((value) => value + 1); setJustUnlocked(true);
    window.setTimeout(() => setJustUnlocked(false), 900);
  };

  if (complete) return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden bg-[hsl(var(--korean-deep))] px-6 text-center text-white">
      <div className="absolute left-7 top-20 text-3xl animate-bounce">⭐</div><div className="absolute right-7 top-36 text-3xl animate-bounce">⚡</div><div className="absolute bottom-32 left-12 text-3xl animate-bounce">🎲</div>
      <img src={tigerCheer} alt="Celebrating K-Quest tiger" className="h-48 w-48 object-contain drop-shadow-2xl" />
      <p className="mt-2 text-xs font-black uppercase tracking-[0.24em] text-[hsl(var(--xp))]">You survived!</p><h1 className="mt-2 text-3xl font-black">🎉 CHALLENGE<br />COMPLETE!</h1>
      <div className="mt-6 w-full rounded-3xl border border-white/15 bg-white/10 p-5 backdrop-blur-sm"><Trophy className="mx-auto text-[hsl(var(--xp))]" size={38} /><p className="mt-2 text-xs font-black uppercase tracking-widest text-white/60">Badge unlocked</p><p className="mt-1 text-xl font-black">🏆 {game.badge}</p>{game.budget && <p className="mt-3 text-sm font-bold text-white/70">Finished with {won(remaining)} remaining</p>}</div>
      <div className="mt-6 flex w-full gap-3"><Button variant="outline" className="flex-1 border-white/20 bg-white/10 text-white hover:bg-white/20" onClick={() => { setMissionIndex(0); setSpent(0); setStarted(false); }}>Play Again</Button><Button className="flex-1 bg-[hsl(var(--xp))] font-black text-[hsl(var(--xp-foreground))]" onClick={() => navigate("/games")}>More Games</Button></div>
    </div>
  );

  return (
    <div className="min-h-[100dvh] bg-[hsl(var(--korean-deep))] pb-8 text-white">
      <header className="px-5 pb-5 pt-5"><button onClick={() => navigate("/games")} className="flex items-center gap-1 text-sm font-extrabold text-white/70"><ArrowLeft size={16} /> Game Zone</button><div className="mt-5 flex items-start gap-3"><span className="text-4xl">{game.emoji}</span><div><p className="text-[10px] font-black uppercase tracking-[0.2em] text-[hsl(var(--xp))]">Challenge mode</p><h1 className="text-2xl font-black uppercase leading-tight">{game.title}</h1></div></div></header>
      <main className="mx-4 rounded-[2rem] bg-background p-5 text-foreground shadow-2xl">
        {!started ? <><p className="text-sm font-bold leading-relaxed text-muted-foreground">{game.description}</p><section className="mt-5 rounded-2xl border border-border bg-card p-4"><p className="text-xs font-black uppercase tracking-widest text-primary">Game rules</p><div className="mt-3 space-y-2">{game.rules.map((rule) => <div key={rule} className="flex items-center gap-2 text-sm font-bold"><Check size={15} className="text-success" />{rule}</div>)}</div></section>{game.budget && <div className="mt-4 rounded-2xl bg-[hsl(var(--korean-deep))] p-5 text-center text-white"><p className="text-xs font-black uppercase tracking-[0.2em] text-white/60">Starting budget</p><p className="mt-1 text-4xl font-black text-[hsl(var(--xp))]">{won(game.budget)}</p></div>}<Button className="mt-5 h-14 w-full rounded-2xl text-base font-black active:scale-95" onClick={() => setStarted(true)}>{game.id === "korea-decides" ? <><Dice5 /> ROLL THE DICE</> : <><Zap /> START CHALLENGE</>}</Button></> : <>
          <div className="flex items-center justify-between"><span className="text-xs font-black uppercase tracking-widest text-primary">Mission {missionIndex + 1} / {game.missions.length}</span><span className="text-xs font-bold text-muted-foreground">{Math.round((missionIndex / game.missions.length) * 100)}%</span></div>
          <div className="mt-2 h-3 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-gradient-to-r from-primary to-[hsl(var(--xp))] transition-all duration-500" style={{ width: `${(missionIndex / game.missions.length) * 100}%` }} /></div>
          {game.budget && <div className="mt-5 rounded-2xl bg-[hsl(var(--korean-deep))] p-4 text-center text-white"><p className="text-[10px] font-black uppercase tracking-widest text-white/55">Remaining budget</p><p className="mt-1 text-4xl font-black text-[hsl(var(--xp))]">{won(remaining)}</p><p className="mt-1 text-[10px] text-white/50">Spent {won(spent)} of {won(game.budget)}</p></div>}
          {justUnlocked && <div className="mt-5 flex items-center justify-center gap-2 rounded-2xl bg-success/15 py-3 text-sm font-black text-success animate-fade-in"><LockKeyhole size={16} /> MISSION {String(missionIndex + 1).padStart(2, "0")} UNLOCKED</div>}
          <section className={`relative mt-5 overflow-hidden rounded-3xl border-2 border-primary/20 bg-card p-5 shadow-[6px_7px_0_hsl(var(--korean-deep)/0.14)] ${justUnlocked ? "animate-scale-in" : ""}`}><Sparkles className="absolute right-4 top-4 text-xp" size={20} /><p className="text-xs font-black uppercase tracking-[0.2em] text-primary">Mission {String(missionIndex + 1).padStart(2, "0")}</p><p className="mt-5 pr-5 text-xl font-black leading-snug">{game.missions[missionIndex]}</p><p className="mt-3 text-xs font-bold text-muted-foreground">Game Master says: “Stay curious, stay respectful, and make it count.”</p></section>
          {game.budget && missionIndex !== 2 && <div className="mt-5"><label htmlFor="expense" className="text-xs font-black uppercase tracking-widest text-muted-foreground">Amount spent this mission</label><div className="mt-2 flex items-center gap-2 rounded-xl border border-border bg-card px-3"><span className="font-black">₩</span><Input id="expense" inputMode="numeric" min={0} max={remaining} value={expense} onChange={(event) => setExpense(event.target.value.replace(/\D/g, ""))} placeholder="0" className="border-0 px-0 focus-visible:ring-0" /></div>{Number(expense) > remaining && <p className="mt-1 text-xs font-bold text-destructive">That is over your remaining budget.</p>}</div>}
          <Button className="mt-5 h-14 w-full rounded-2xl text-base font-black active:scale-95" disabled={game.budget ? Number(expense || 0) > remaining : false} onClick={completeMission}><Check size={18} /> COMPLETE MISSION</Button>
          <button onClick={() => { setMissionIndex(0); setSpent(0); setStarted(false); }} className="mt-4 flex w-full items-center justify-center gap-1 text-xs font-bold text-muted-foreground"><RotateCcw size={13} /> Reset game</button>
        </>}
      </main>
    </div>
  );
};

export default GamePlay;
