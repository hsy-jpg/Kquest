import { ArrowLeft, ArrowRight, Clock3, Flag, Route, Trophy, Zap } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { getQuestRoute, getRouteQuests } from "@/data/questRoutes";
import SaveRouteButton from "@/components/SaveRouteButton";

const QuestRouteDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const route = getQuestRoute(id);

  if (!route) {
    return <div className="flex min-h-[70dvh] flex-col items-center justify-center px-6 text-center"><Route className="mb-3 text-muted-foreground" size={38} /><h1 className="text-xl font-extrabold">Route not found</h1><Button variant="ghost" className="mt-4" onClick={() => navigate("/quests")}>Back to Quests</Button></div>;
  }

  const routeQuests = getRouteQuests(route);
  return (
    <div className="min-h-full pb-8">
      <header className="relative h-72 overflow-hidden">
        <img src={route.coverImage} alt="" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-[hsl(var(--korean-deep))] via-[hsl(var(--korean-deep)/0.72)] to-black/15" />
        <button onClick={() => navigate(-1)} className="absolute left-4 top-4 flex items-center gap-1 rounded-full bg-white/90 px-3 py-2 text-sm font-extrabold text-foreground shadow-sm"><ArrowLeft size={16} /> Back</button>
        <SaveRouteButton route={route} className="absolute right-4 top-4" />
        <div className="absolute inset-x-0 bottom-0 p-5 text-white">
          <div className="mb-2 flex flex-wrap gap-2"><span className="rounded-full bg-white/15 px-3 py-1 text-xs font-extrabold backdrop-blur-sm">{route.theme}</span><span className="rounded-full bg-[hsl(var(--xp))] px-3 py-1 text-xs font-extrabold text-[hsl(var(--xp-foreground))]">{route.duration}</span></div>
          <h1 className="text-2xl font-black leading-tight">{route.emoji} {route.title}</h1>
          <p className="mt-1 text-sm font-bold text-white/85">{route.subtitle}</p>
          <div className="mt-3 flex items-center gap-4 text-xs font-bold text-white/80"><span className="flex items-center gap-1"><Flag size={14} /> {routeQuests.length} Missions</span><span className="flex items-center gap-1"><Clock3 size={14} /> {route.estimatedTime}</span></div>
        </div>
      </header>
      <main className="px-5 py-6">
        <p className="text-sm leading-relaxed text-muted-foreground">{route.description}</p>
        <div className="mt-6 flex items-center justify-between"><div><p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-primary">Mission path</p><h2 className="mt-1 text-lg font-black">Start to route complete</h2></div><span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-extrabold text-primary">{route.region}</span></div>
        <div className="mt-5">
          <div className="mb-2 ml-3 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-primary"><span className="h-3 w-3 rounded-full bg-primary ring-4 ring-primary/15" /> Start</div>
          {routeQuests.map((quest, index) => (
            <div key={quest.id} className="relative flex gap-4">
              {index < routeQuests.length - 1 && <div className="absolute bottom-0 left-[17px] top-9 w-0.5 bg-gradient-to-b from-primary/55 to-primary/15" />}
              <div className="relative z-10 mt-5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-primary bg-background text-xs font-black text-primary shadow-sm">{index + 1}</div>
              <article className="mb-4 flex-1 rounded-2xl border border-border bg-card p-4 shadow-sm">
                <div className="flex gap-3"><img src={quest.image} alt="" className="h-16 w-16 shrink-0 rounded-xl object-cover" loading="lazy" /><div className="min-w-0"><p className="font-extrabold leading-tight">{quest.title}</p><p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">{quest.subtitle}</p></div></div>
                <div className="mt-3 flex items-center justify-between border-t border-border/70 pt-3"><div className="flex items-center gap-3 text-[11px] font-bold text-muted-foreground"><span className="flex items-center gap-1"><Clock3 size={12} /> {quest.time}</span><span className="flex items-center gap-1 text-xp"><Zap size={12} /> {quest.xp} XP</span></div><Button size="sm" variant="ghost" className="h-8 rounded-lg px-2 text-xs font-extrabold text-primary" onClick={() => navigate(`/quest/${quest.id}`)}>View Quest <ArrowRight size={13} /></Button></div>
              </article>
            </div>
          ))}
          <div className="ml-3 mt-1 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-primary"><span className="h-3 w-3 rounded-full bg-primary ring-4 ring-primary/15" /> Route complete</div>
        </div>
        <section className="mt-6 overflow-hidden rounded-2xl bg-[hsl(var(--korean-deep))] p-5 text-white shadow-lg"><div className="flex items-start gap-3"><div className="rounded-xl bg-[hsl(var(--xp))] p-2.5 text-[hsl(var(--xp-foreground))]"><Trophy size={22} /></div><div><p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-white/60">Completion reward</p><p className="mt-1 font-black">{route.reward}</p><p className="mt-1 text-xs text-white/65">Complete every Quest in this route to finish the journey.</p></div></div></section>
      </main>
    </div>
  );
};

export default QuestRouteDetail;
