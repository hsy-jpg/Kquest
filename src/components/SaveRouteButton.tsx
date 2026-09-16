import { Heart } from "lucide-react";
import type { QuestRoute } from "@/data/questRoutes";
import { useTripBoard } from "@/features/trip/tripBoard";

const SaveRouteButton = ({ route, className = "" }: { route: QuestRoute; className?: string }) => {
  const { isRouteSaved, toggleSavedRoute } = useTripBoard();
  const saved = isRouteSaved(route);
  return <button type="button" aria-label={saved ? `Remove ${route.title} from My Trip Board` : `Save ${route.title} to My Trip Board`} aria-pressed={saved} onClick={(event) => { event.preventDefault(); event.stopPropagation(); toggleSavedRoute(route); }} className={`flex h-10 w-10 items-center justify-center rounded-full bg-card/90 text-primary shadow-md backdrop-blur-sm transition-transform active:scale-90 ${className}`}><Heart size={19} className={saved ? "fill-primary" : ""} /></button>;
};

export default SaveRouteButton;
