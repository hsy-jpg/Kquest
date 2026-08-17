import { useCallback, useRef, useState } from "react";
import { Search, Users, X, Plus, Minus, Locate, Layers } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { quests, type Quest } from "@/data/quests";
import mapCity from "@/assets/map-seoul-city.jpg";
import mapDistrict from "@/assets/map-seoul-district.jpg";
import mapStreet from "@/assets/map-seoul-street.jpg";
import GoogleQuestMap, { type GoogleQuestMapHandle } from "@/components/GoogleQuestMap";
import { usePublishedQuests } from "@/features/quests/usePublishedQuests";
import type { SupabaseQuestCard } from "@/features/quests/supabaseQuestAdapter";

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? "";
const configuredMapId = (import.meta.env.VITE_GOOGLE_MAPS_MAP_ID ?? "").trim();
// Google Cloud JavaScript map IDs are 16-character hexadecimal identifiers.
// Keep the map usable while a project map ID is being configured.
const GOOGLE_MAPS_MAP_ID = configuredMapId === "DEMO_MAP_ID" || /^[a-f0-9]{16}$/i.test(configuredMapId)
  ? configuredMapId
  : "DEMO_MAP_ID";

const peopleCounts = [12, 8, 5, 23, 3, 15, 9, 7, 18, 4, 11, 6, 14];

const categories = [
  { label: "All", emoji: "✨" },
  { label: "Food", emoji: "🍜" },
  { label: "Culture", emoji: "🎎" },
  { label: "Nature", emoji: "🌿" },
  { label: "Nightlife", emoji: "🌙" },
];

// Pin coordinates per zoom level on the illustrated Seoul map.
// Level 0: Seoul-wide (Namsan top, palace right, hanok village left).
// Level 1: Jongno hanok streets. Level 2: Insadong street level.
const pinCoords: Record<number, Array<{ x: number; y: number } | null>> = {
  0: [{ x: 58, y: 62 }, { x: 70, y: 78 }, null],          // Pojangmacha
  1: [{ x: 30, y: 75 }, { x: 28, y: 60 }, { x: 25, y: 55 }], // Convenience ramen
  2: [{ x: 80, y: 55 }, { x: 75, y: 35 }, null],          // Dongmyo
  3: [{ x: 22, y: 70 }, null, null],                      // Hongdae noraebang
  4: [{ x: 50, y: 25 }, { x: 22, y: 14 }, null],          // Inwangsan
  5: [{ x: 65, y: 70 }, { x: 65, y: 47 }, { x: 78, y: 78 }], // Gwangjang Market
  6: [{ x: 45, y: 65 }, { x: 58, y: 32 }, { x: 50, y: 38 }], // Cafe Insadong
  7: [{ x: 30, y: 60 }, { x: 47, y: 25 }, { x: 50, y: 18 }], // Bukchon
  8: [{ x: 55, y: 80 }, { x: 42, y: 50 }, null],          // Myeongdong
  9: [{ x: 78, y: 80 }, null, { x: 80, y: 65 }],          // Convstore
  10: [{ x: 60, y: 70 }, { x: 50, y: 28 }, null],         // Gyeongbokgung
  11: [{ x: 22, y: 80 }, null, null],                     // Hongdae nightlife
  12: [{ x: 40, y: 70 }, { x: 60, y: 40 }, { x: 47, y: 50 }], // Insadong tea
};

const categoryPinColor = (c: string) => {
  if (c === "Food") return "bg-primary";
  if (c === "Culture") return "bg-accent";
  if (c === "Nature") return "bg-success";
  if (c === "Nightlife") return "bg-destructive";
  return "bg-secondary";
};

const zoomLevels = [
  { img: mapCity, label: "SEOUL", scale: 1 },
  { img: mapDistrict, label: "JONGNO · JUNG-GU", scale: 1 },
  { img: mapStreet, label: "INSA-DONG", scale: 1 },
];

// Cute Korean decorative overlays (emoji landmarks + blossoms) per zoom level.
// Pointer-events disabled — purely decorative on top of the realistic map.
const decorations: Record<number, Array<{ x: number; y: number; icon: string; size?: number; rotate?: number; opacity?: number }>> = {
  0: [
    { x: 48, y: 44, icon: "🗼", size: 22 },           // Namsan Tower
    { x: 32, y: 30, icon: "🏯", size: 18 },           // Gyeongbokgung
    { x: 18, y: 20, icon: "⛰️", size: 18 },           // Bukhansan
    { x: 82, y: 26, icon: "🌸", size: 16, rotate: -15, opacity: 0.85 },
    { x: 12, y: 60, icon: "🌸", size: 14, rotate: 25, opacity: 0.8 },
    { x: 72, y: 72, icon: "🌸", size: 16, rotate: 10, opacity: 0.85 },
    { x: 60, y: 88, icon: "🌊", size: 16, opacity: 0.8 },
    { x: 88, y: 58, icon: "🏘️", size: 16 },
  ],
  1: [
    { x: 25, y: 32, icon: "🏯", size: 24 },           // palace
    { x: 70, y: 28, icon: "🏘️", size: 20 },          // hanok village
    { x: 50, y: 60, icon: "🍵", size: 18 },
    { x: 15, y: 70, icon: "🌸", size: 16, rotate: -10, opacity: 0.85 },
    { x: 85, y: 75, icon: "🌸", size: 16, rotate: 20, opacity: 0.85 },
    { x: 40, y: 18, icon: "🌸", size: 14, rotate: 5, opacity: 0.8 },
    { x: 88, y: 50, icon: "🏮", size: 18 },
  ],
  2: [
    { x: 30, y: 35, icon: "🏯", size: 22 },
    { x: 65, y: 55, icon: "🍡", size: 20 },
    { x: 50, y: 25, icon: "🏮", size: 18 },
    { x: 20, y: 70, icon: "🌸", size: 16, rotate: -15, opacity: 0.85 },
    { x: 80, y: 80, icon: "🌸", size: 16, rotate: 15, opacity: 0.85 },
    { x: 75, y: 30, icon: "🍵", size: 18 },
    { x: 45, y: 85, icon: "🎎", size: 20 },
  ],
};

const Explore = () => {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState("All");
  const [selectedQuest, setSelectedQuest] = useState<Quest | null>(null);
  const [zoom, setZoom] = useState(0); // 0=city, 1=district, 2=street
  const [googleMapFailed, setGoogleMapFailed] = useState(false);
  const googleMapRef = useRef<GoogleQuestMapHandle>(null);
  const { data: publishedQuests, isError: publishedQuestsError } = usePublishedQuests();
  const liveMapQuests = (publishedQuests ?? []).filter((quest) => quest.latitude !== null && quest.longitude !== null);
  const useGoogleMap = Boolean(GOOGLE_MAPS_API_KEY && !googleMapFailed && liveMapQuests.length);
  const questSource: Quest[] = useGoogleMap && !publishedQuestsError ? liveMapQuests : quests;

  const filteredQuests =
    activeCategory === "All" ? questSource : questSource.filter((q) => q.category === activeCategory);

  const visiblePins = filteredQuests
    .map((q) => ({ quest: q, pos: pinCoords[q.id]?.[zoom] }))
    .filter((p): p is { quest: Quest; pos: { x: number; y: number } } => !!p.pos);

  const zoomIn = () => {
    setSelectedQuest(null);
    if (useGoogleMap) return googleMapRef.current?.zoomIn();
    setZoom((z) => Math.min(z + 1, zoomLevels.length - 1));
  };
  const zoomOut = () => {
    setSelectedQuest(null);
    if (useGoogleMap) return googleMapRef.current?.zoomOut();
    setZoom((z) => Math.max(z - 1, 0));
  };
  const handleGoogleMapError = useCallback(() => setGoogleMapFailed(true), []);

  const pinSize = zoom === 0 ? 32 : zoom === 1 ? 38 : 44;

  return (
    <div className="px-5 pt-6 pb-4">
      <h1 className="text-2xl font-extrabold">Explore 🗺️</h1>
      <p className="text-sm text-muted-foreground mt-1">Tap a pin to discover a quest</p>

      {/* Search */}
      <div className="mt-4 flex items-center gap-2 rounded-xl bg-card border border-border px-3 py-2.5">
        <Search size={18} className="text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Search places or quests...</span>
      </div>

      {/* Categories */}
      <div className="mt-5 flex gap-2 overflow-x-auto scrollbar-hide">
        {categories.map((c) => (
          <button
            key={c.label}
            onClick={() => setActiveCategory(c.label)}
            className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition-all whitespace-nowrap border ${
              activeCategory === c.label
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card border-border text-foreground"
            }`}
          >
            <span>{c.emoji}</span>
            <span>{c.label}</span>
          </button>
        ))}
      </div>

      {/* Interactive Map */}
      <div className="mt-5 relative rounded-3xl overflow-hidden border-2 border-primary/20 shadow-[var(--shadow-soft)] aspect-square bg-muted">
        {useGoogleMap && (
          <GoogleQuestMap
            ref={googleMapRef}
            apiKey={GOOGLE_MAPS_API_KEY}
            mapId={GOOGLE_MAPS_MAP_ID}
            quests={filteredQuests as SupabaseQuestCard[]}
            selectedQuestId={selectedQuest?.id}
            onSelect={setSelectedQuest}
            onError={handleGoogleMapError}
          />
        )}
        <div className={useGoogleMap ? "hidden" : "contents"}>
        {/* Crossfade map layers */}
        {zoomLevels.map((lvl, i) => (
          <img
            key={i}
            src={lvl.img}
            alt={`Seoul map ${lvl.label}`}
            className={`absolute inset-0 w-full h-full object-cover transition-all duration-500 ease-out ${
              i === zoom ? "opacity-100 scale-100" : i < zoom ? "opacity-0 scale-150" : "opacity-0 scale-75"
            }`}
            loading="lazy"
          />
        ))}

        {/* Korean decorative overlay (cherry blossoms, hanok, Namsan Tower) */}
        <div key={`deco-${zoom}`} className="pointer-events-none absolute inset-0 animate-fade-in">
          {decorations[zoom]?.map((d, i) => (
            <span
              key={i}
              className="absolute -translate-x-1/2 -translate-y-1/2 drop-shadow-sm select-none"
              style={{
                left: `${d.x}%`,
                top: `${d.y}%`,
                fontSize: d.size ?? 18,
                transform: `translate(-50%, -50%) rotate(${d.rotate ?? 0}deg)`,
                opacity: d.opacity ?? 1,
              }}
              aria-hidden
            >
              {d.icon}
            </span>
          ))}
        </div>

        {/* Pins */}
        <div key={zoom} className="absolute inset-0 animate-fade-in">
          {visiblePins.map(({ quest: q, pos }) => (
            <button
              key={q.id}
              onClick={() => setSelectedQuest(q)}
              className="absolute -translate-x-1/2 -translate-y-full transition-transform hover:scale-110 active:scale-95"
              style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
              aria-label={q.title}
            >
              <div className="relative drop-shadow-lg">
                <div
                  className={`${categoryPinColor(q.category)} text-primary-foreground rounded-full flex items-center justify-center shadow-lg border-2 border-background ${
                    selectedQuest?.id === q.id ? "ring-4 ring-primary/40" : ""
                  }`}
                  style={{ width: pinSize, height: pinSize, fontSize: pinSize * 0.45 }}
                >
                  {q.emoji}
                </div>
                <div className="w-1.5 h-1.5 bg-foreground/40 rounded-full mx-auto -mt-0.5" />
              </div>
            </button>
          ))}
        </div>

        {/* Top label */}
        <div className="absolute left-3 top-3 rounded-full bg-card/95 backdrop-blur border border-border px-3 py-1 text-[10px] font-bold shadow-md">
          {zoomLevels[zoom].label}
        </div>
        </div>

        {/* Zoom controls */}
        <div className="absolute right-3 top-3 flex flex-col gap-0 rounded-xl bg-card/95 backdrop-blur border border-border shadow-md overflow-hidden">
          <button
            onClick={zoomIn}
            disabled={!useGoogleMap && zoom === zoomLevels.length - 1}
            className="p-2.5 hover:bg-muted disabled:opacity-30 transition-colors"
            aria-label="Zoom in"
          >
            <Plus size={16} />
          </button>
          <div className="h-px bg-border" />
          <button
            onClick={zoomOut}
            disabled={!useGoogleMap && zoom === 0}
            className="p-2.5 hover:bg-muted disabled:opacity-30 transition-colors"
            aria-label="Zoom out"
          >
            <Minus size={16} />
          </button>
        </div>

        {/* Side controls */}
        <div className="absolute right-3 top-28 flex flex-col gap-2">
          <button onClick={() => useGoogleMap ? googleMapRef.current?.locate() : undefined} className="p-2.5 rounded-xl bg-card/95 backdrop-blur border border-border shadow-md hover:bg-muted" aria-label="Show current location">
            <Locate size={16} />
          </button>
          <button className="p-2.5 rounded-xl bg-card/95 backdrop-blur border border-border shadow-md hover:bg-muted">
            <Layers size={16} />
          </button>
        </div>

        {/* Zoom level dots */}
        {!useGoogleMap && <div className="absolute left-3 bottom-3 flex gap-1.5 rounded-full bg-card/95 backdrop-blur border border-border px-2.5 py-1.5 shadow-md">
          {zoomLevels.map((_, i) => (
            <div
              key={i}
              className={`w-1.5 h-1.5 rounded-full transition-all ${
                i === zoom ? "bg-primary w-4" : "bg-muted-foreground/40"
              }`}
            />
          ))}
        </div>}

        {/* Preview card overlay */}
        {selectedQuest && (
          <div className="absolute bottom-3 left-3 right-3 animate-fade-in">
            <div className="relative rounded-2xl bg-card border border-border shadow-xl overflow-hidden">
              <button
                onClick={() => setSelectedQuest(null)}
                className="absolute top-2 right-2 z-10 p-1.5 rounded-full bg-background/90 border border-border"
                aria-label="Close"
              >
                <X size={14} />
              </button>
              <div className="flex">
                <img
                  src={selectedQuest.image}
                  alt={selectedQuest.title}
                  className="w-24 h-28 object-cover flex-shrink-0"
                  loading="lazy"
                />
                <div className="p-3 flex-1 min-w-0">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">
                    {selectedQuest.category} · {selectedQuest.difficulty}
                  </p>
                  <h3 className="font-bold text-sm leading-tight truncate">{selectedQuest.title}</h3>
                  <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                    📍 {selectedQuest.location}
                  </p>
                  <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground font-semibold">
                    <span>⏱ {selectedQuest.time}</span>
                    <span>·</span>
                    <Users size={10} />
                    <span>{peopleCounts[selectedQuest.id % peopleCounts.length]}</span>
                  </div>
                  <div className="flex gap-1.5 mt-2">
                    {zoom < zoomLevels.length - 1 && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 rounded-lg h-7 text-xs font-bold px-2"
                        onClick={zoomIn}
                      >
                        Zoom In
                      </Button>
                    )}
                    <Button
                      size="sm"
                      className="flex-1 rounded-lg h-7 text-xs font-bold px-2"
                      onClick={() => navigate(`/quest/${selectedQuest.id}`)}
                    >
                      Start
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-semibold">
        {categories.slice(1).map((c) => (
          <div key={c.label} className="flex items-center gap-1 rounded-full bg-card border border-border px-2 py-1">
            <div className={`w-2 h-2 rounded-full ${categoryPinColor(c.label)}`} />
            <span>{c.label}</span>
          </div>
        ))}
      </div>

      {/* Nearby quests with social */}
      <h2 className="mt-5 text-lg font-bold">
        {activeCategory === "All" ? "Happening Now" : `${activeCategory} Quests`}
      </h2>
      <div className="mt-2 flex flex-col gap-3">
        {filteredQuests.map((q, i) => (
          <div key={q.id} className="rounded-2xl overflow-hidden border border-border shadow-sm bg-card">
            <div className="relative h-32">
              <img src={q.image} alt={q.title} className="w-full h-full object-cover" loading="lazy" />
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/50 to-transparent" />
              <p className="absolute bottom-2 left-3 font-bold text-sm text-primary-foreground">{q.title}</p>
            </div>
            <div className="p-3 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Users size={14} />
                <span className="text-xs font-semibold">
                  {peopleCounts[i % peopleCounts.length]} people doing now
                </span>
              </div>
              <Button
                size="sm"
                className="rounded-xl font-bold text-xs h-8 px-4"
                onClick={() => navigate(`/quest/${q.id}`)}
              >
                Join
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Explore;
