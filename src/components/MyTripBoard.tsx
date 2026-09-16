import { ChevronLeft, ChevronRight, Clock, GripVertical, Heart, MapPin, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { TRIP_DAYS, type TripDay, useTripBoard } from "@/features/trip/tripBoard";

const MyTripBoard = () => {
  const navigate = useNavigate();
  const { saved, schedule, putOnDay, removeFromSchedule } = useTripBoard();
  const byKey = new Map(saved.map((item) => [item.key, item]));

  return (
    <section className="mt-6 mx-5">
      <div className="mb-3 flex items-end justify-between"><div><div className="flex items-center gap-2"><Heart size={18} className="fill-primary text-primary" /><h2 className="font-black">My Trip Board</h2></div><p className="mt-1 text-xs text-muted-foreground">Save Quests, then drag them into your itinerary.</p></div><span className="text-xs font-extrabold text-primary">{saved.length} saved</span></div>

      {saved.length === 0 ? (
        <button onClick={() => navigate("/quests")} className="w-full rounded-2xl border-2 border-dashed border-primary/20 bg-primary/5 px-5 py-8 text-center"><Heart className="mx-auto text-primary/50" /><p className="mt-2 text-sm font-extrabold">Your board is empty</p><p className="mt-1 text-xs text-muted-foreground">Tap a heart on any Quest to save it here.</p></button>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {saved.map((item) => (
            <article key={item.key} draggable onDragStart={(event) => event.dataTransfer.setData("text/quest-key", item.key)} className="w-44 shrink-0 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
              <button className="w-full text-left" onClick={() => navigate(item.path)}><img src={item.image} alt="" className="h-24 w-full object-cover" /><div className="p-3"><p className="line-clamp-2 text-sm font-extrabold leading-tight">{item.title}</p><p className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground"><MapPin size={10} /> {item.location}</p></div></button>
              <div className="border-t border-border px-2 py-2"><button onClick={() => putOnDay(item.key, 1)} className="w-full rounded-lg bg-primary/10 py-1.5 text-[11px] font-extrabold text-primary">Add to Day 1</button></div>
            </article>
          ))}
        </div>
      )}

      <div className="mt-5 flex items-center gap-2"><span className="text-lg">🗓️</span><div><h3 className="font-black">My Trip Schedule</h3><p className="text-[11px] text-muted-foreground">Drag saved Quests between days.</p></div></div>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {TRIP_DAYS.map((day) => (
          <div key={day} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); const key = event.dataTransfer.getData("text/quest-key"); if (key) putOnDay(key, day); }} className="min-h-48 rounded-2xl border border-border bg-card/70 p-2 shadow-sm">
            <div className="mb-2 rounded-xl bg-[hsl(var(--korean-deep))] px-2 py-2 text-center text-xs font-black text-white">Day {day}</div>
            <div className="space-y-2">
              {schedule[day].map((key, index) => {
                const item = byKey.get(key); if (!item) return null;
                return <article key={key} draggable onDragStart={(event) => event.dataTransfer.setData("text/quest-key", key)} className="rounded-xl border border-border bg-card p-2 shadow-sm"><div className="flex items-start gap-1"><GripVertical size={13} className="mt-0.5 shrink-0 text-muted-foreground" /><button onClick={() => navigate(item.path)} className="min-w-0 flex-1 text-left"><p className="line-clamp-2 text-[11px] font-extrabold leading-tight">{index + 1}. {item.title}</p><p className="mt-1 flex items-center gap-1 text-[9px] text-muted-foreground"><Clock size={9} /> {item.time}</p></button></div><div className="mt-2 flex items-center justify-between"><button disabled={day === 1} aria-label="Move to previous day" onClick={() => putOnDay(key, (day - 1) as TripDay)} className="disabled:opacity-20"><ChevronLeft size={14} /></button><button aria-label="Remove from schedule" onClick={() => removeFromSchedule(key)} className="text-destructive"><Trash2 size={12} /></button><button disabled={day === 3} aria-label="Move to next day" onClick={() => putOnDay(key, (day + 1) as TripDay)} className="disabled:opacity-20"><ChevronRight size={14} /></button></div></article>;
              })}
              {schedule[day].length === 0 && <p className="px-1 py-5 text-center text-[10px] leading-relaxed text-muted-foreground">Drop a saved Quest here</p>}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default MyTripBoard;
