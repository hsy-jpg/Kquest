import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { MarkerClusterer } from "@googlemaps/markerclusterer";
import type { SupabaseQuestCard } from "@/features/quests/supabaseQuestAdapter";

export type GoogleQuestMapHandle = {
  zoomIn: () => void;
  zoomOut: () => void;
  locate: () => void;
};

type Props = {
  apiKey: string;
  mapId: string;
  quests: SupabaseQuestCard[];
  selectedQuestId?: number;
  onSelect: (quest: SupabaseQuestCard) => void;
  onError: () => void;
};

let mapsLoader: Promise<typeof google> | null = null;

function loadGoogleMaps(apiKey: string): Promise<typeof google> {
  if (window.google?.maps) return Promise.resolve(window.google);
  mapsLoader ??= new Promise((resolve, reject) => {
    const callbackName = `__kquestGoogleMapsReady_${Date.now()}`;
    const script = document.createElement("script");
    const cleanup = () => {
      delete (window as typeof window & Record<string, unknown>)[callbackName];
    };
    (window as typeof window & Record<string, unknown>)[callbackName] = () => {
      cleanup();
      window.google?.maps
        ? resolve(window.google)
        : reject(new Error("Google Maps was unavailable after loading."));
    };
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&v=weekly&loading=async&libraries=marker&callback=${callbackName}`;
    script.async = true;
    script.onerror = () => {
      cleanup();
      reject(new Error("Google Maps JavaScript API failed to load."));
    };
    document.head.appendChild(script);
  });
  return mapsLoader;
}

const markerColors: Record<string, string> = {
  Food: "#f97316", Culture: "#7c3aed", Nature: "#16a34a",
  Nightlife: "#dc2626", Shopping: "#2563eb", Festival: "#db2777",
};

function markerContent(quest: SupabaseQuestCard, selected: boolean) {
  const root = document.createElement("div");
  root.className = "kquest-map-marker";
  root.title = quest.title;
  root.style.cssText = `width:${selected ? 46 : 38}px;height:${selected ? 46 : 38}px;border-radius:50% 50% 50% 8px;transform:rotate(-45deg);background:${markerColors[quest.category] ?? "#2563eb"};border:3px solid white;box-shadow:0 4px 12px rgba(0,0,0,.32);display:grid;place-items:center;transition:.18s;`;
  const glyph = document.createElement("span");
  glyph.textContent = quest.emoji || "★";
  glyph.style.cssText = "transform:rotate(45deg);font-size:17px;line-height:1";
  root.appendChild(glyph);
  return root;
}

const GoogleQuestMap = forwardRef<GoogleQuestMapHandle, Props>(({
  apiKey, mapId, quests, selectedQuestId, onSelect, onError,
}, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const clusterRef = useRef<MarkerClusterer | null>(null);
  const currentMarkerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadGoogleMaps(apiKey).then(async () => {
      if (cancelled || !containerRef.current) return;
      const { Map } = await google.maps.importLibrary("maps") as google.maps.MapsLibrary;
      await google.maps.importLibrary("marker");
      mapRef.current = new Map(containerRef.current, {
        center: { lat: 36.35, lng: 127.9 },
        zoom: 7,
        mapId,
        disableDefaultUI: true,
        gestureHandling: "greedy",
      });
      setReady(true);
    }).catch((error) => {
      console.error("[K-Quest Explore] Google Maps initialization failed.", error);
      onError();
    });
    return () => { cancelled = true; };
  }, [apiKey, mapId, onError]);

  useEffect(() => {
    if (!ready || !mapRef.current) return;
    clusterRef.current?.clearMarkers();
    const markers = quests.map((quest) => {
      const marker = new google.maps.marker.AdvancedMarkerElement({
        map: mapRef.current,
        position: { lat: quest.latitude!, lng: quest.longitude! },
        title: quest.title,
        content: markerContent(quest, selectedQuestId === quest.id),
        gmpClickable: true,
      });
      marker.addListener("click", () => onSelect(quest));
      return marker;
    });
    clusterRef.current = new MarkerClusterer({ map: mapRef.current, markers });
    return () => {
      clusterRef.current?.clearMarkers();
      for (const marker of markers) marker.map = null;
    };
  }, [ready, quests, selectedQuestId, onSelect]);

  useImperativeHandle(ref, () => ({
    zoomIn: () => mapRef.current?.setZoom((mapRef.current.getZoom() ?? 7) + 1),
    zoomOut: () => mapRef.current?.setZoom((mapRef.current.getZoom() ?? 7) - 1),
    locate: () => navigator.geolocation?.getCurrentPosition(({ coords }) => {
      const position = { lat: coords.latitude, lng: coords.longitude };
      mapRef.current?.panTo(position);
      mapRef.current?.setZoom(14);
      if (currentMarkerRef.current) currentMarkerRef.current.map = null;
      const dot = document.createElement("div");
      dot.style.cssText = "width:18px;height:18px;border-radius:50%;background:#2563eb;border:4px solid white;box-shadow:0 0 0 5px rgba(37,99,235,.25)";
      currentMarkerRef.current = new google.maps.marker.AdvancedMarkerElement({ map: mapRef.current, position, content: dot, title: "Current location" });
    }),
  }), []);

  return <div ref={containerRef} className="absolute inset-0" aria-label="Google Map showing published K-Quest locations" />;
});

GoogleQuestMap.displayName = "GoogleQuestMap";
export default GoogleQuestMap;
