import { Heart } from "lucide-react";
import type { Quest } from "@/data/quests";
import { useTripBoard } from "@/features/trip/tripBoard";

const SaveQuestButton = ({ quest, className = "" }: { quest: Quest; className?: string }) => {
  const { isSaved, toggleSaved } = useTripBoard();
  const saved = isSaved(quest);
  return (
    <button
      type="button"
      aria-label={saved ? `Remove ${quest.title} from My Trip Board` : `Save ${quest.title} to My Trip Board`}
      aria-pressed={saved}
      onClick={(event) => { event.preventDefault(); event.stopPropagation(); toggleSaved(quest); }}
      className={`flex h-10 w-10 items-center justify-center rounded-full bg-card/90 text-primary shadow-md backdrop-blur-sm transition-transform active:scale-90 ${className}`}
    >
      <Heart size={19} className={saved ? "fill-primary" : ""} />
    </button>
  );
};

export default SaveQuestButton;
