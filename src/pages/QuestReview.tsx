import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Star, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { quests } from "@/data/quests";
import ItemUnlock, { pickItemForQuest } from "@/components/ItemUnlock";
import userSarah from "@/assets/user-sarah.jpg";
import userYuki from "@/assets/user-yuki.jpg";
import userTom from "@/assets/user-tom.jpg";
import userEmma from "@/assets/user-emma.jpg";
import userCarlos from "@/assets/user-carlos.jpg";

const sampleReviews = [
  {
    name: "Sarah M.",
    avatar: userSarah,
    rating: 5,
    text: "This was SO fun! We spent way longer than expected because we kept trying new foods. Highly recommend going with friends.",
    date: "2 days ago",
  },
  {
    name: "Yuki T.",
    avatar: userYuki,
    rating: 4,
    text: "Great quest! The mission was clear and easy to follow. Only wish it was a bit longer. Loved the photo challenge part!",
    date: "3 days ago",
  },
  {
    name: "Tom W.",
    avatar: userTom,
    rating: 5,
    text: "Best experience I've had in Seoul so far. Felt like a real adventure, not just a tourist checklist. 10/10 would do again.",
    date: "5 days ago",
  },
  {
    name: "Emma L.",
    avatar: userEmma,
    rating: 4,
    text: "Really cool concept! The locals were super friendly when they saw what we were doing. Made some great memories.",
    date: "1 week ago",
  },
  {
    name: "Carlos R.",
    avatar: userCarlos,
    rating: 5,
    text: "My favorite quest on the app! Discovered places I never would have found on my own. The XP reward was a nice bonus 😄",
    date: "1 week ago",
  },
];

const QuestReview = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const quest = quests.find((q) => q.id === Number(id));
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");
  const [submitted, setSubmitted] = useState(false);

  if (!quest) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <p className="text-4xl mb-3">😕</p>
        <p className="font-bold">Quest not found</p>
        <Button variant="ghost" className="mt-4" onClick={() => navigate("/")}>Go Home</Button>
      </div>
    );
  }

  if (submitted) {
    const item = pickItemForQuest(quest.id);
    return <ItemUnlock item={item} onDone={() => navigate("/")} />;
  }

  return (
    <div className="flex flex-col min-h-full">
      <div className="px-5 pt-4 pb-3 border-b border-border bg-card">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-1 text-sm font-bold text-muted-foreground active:opacity-70"
          >
            <ArrowLeft size={18} /> Skip
          </button>
          <span className="font-bold text-sm">Write Review</span>
          <div className="w-14" />
        </div>
      </div>

      <div className="flex-1 px-5 py-6 space-y-6">
        {/* Quest header */}
        <div className="flex items-center gap-3">
          <img
            src={quest.image}
            alt={quest.title}
            className="h-14 w-14 rounded-xl object-cover"
            loading="lazy"
            width={56}
            height={56}
          />
          <div>
            <p className="font-extrabold text-sm">{quest.title}</p>
            <p className="text-xs text-muted-foreground">{quest.location}</p>
          </div>
        </div>

        {/* Star rating */}
        <div>
          <p className="font-bold text-sm mb-3">How was this quest?</p>
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setRating(star)}
                className="transition-transform active:scale-90"
              >
                <Star
                  size={40}
                  className={star <= rating ? "text-[hsl(38_95%_55%)] fill-[hsl(38_95%_55%)] drop-shadow-sm" : "text-muted-foreground/40"}
                  strokeWidth={2}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Review text */}
        <div>
          <p className="font-bold text-sm mb-2">Share your experience</p>
          <Textarea
            placeholder="What did you enjoy? Any tips for others?"
            value={review}
            onChange={(e) => setReview(e.target.value)}
            className="rounded-xl min-h-[100px] resize-none"
          />
        </div>

        {/* Other reviews */}
        <div>
          <p className="font-bold text-sm mb-3">What others are saying</p>
          <div className="space-y-3">
            {sampleReviews.map((r, i) => (
              <div key={i} className="rounded-xl bg-card border border-border p-3.5 shadow-sm">
                <div className="flex items-center gap-2.5 mb-2">
                  <img src={r.avatar} alt={r.name} className="h-8 w-8 rounded-full object-cover" />
                  <div className="flex-1">
                    <p className="text-xs font-bold">{r.name}</p>
                    <p className="text-[10px] text-muted-foreground">{r.date}</p>
                  </div>
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} size={13} className={s <= r.rating ? "text-[hsl(38_95%_55%)] fill-[hsl(38_95%_55%)]" : "text-muted-foreground/30"} />
                    ))}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{r.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Submit */}
      <div className="sticky bottom-0 bg-background/90 backdrop-blur-md border-t border-border px-5 py-4">
        <Button
          className="w-full rounded-xl font-extrabold h-14 text-base shadow-lg gap-2"
          disabled={rating === 0}
          onClick={() => setSubmitted(true)}
        >
          <Send size={18} />
          Submit Review
        </Button>
      </div>
    </div>
  );
};

export default QuestReview;
