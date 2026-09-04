import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Clock, MapPin, Zap, Users, Info, Lightbulb, Wallet, CalendarClock, Navigation, Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import { quests, difficultyColor } from "@/data/quests";
import { getQuestDetail } from "@/data/questDetails";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import SignTranslator from "@/components/SignTranslator";
import { tigerPoseSrc, poseForQuest } from "@/lib/tigerPoses";
import { usePublishedQuest } from "@/features/quests/usePublishedQuests";
import { recordQuestView } from "@/features/quests/questEvents";
import { getMockQuestMapUrls } from "@/lib/questMapSearch";

const QuestDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const mockQuest = quests.find((q) => q.id === Number(id));
  const { data: publishedQuest, isLoading } = usePublishedQuest(id);
  const quest = publishedQuest ?? mockQuest;
  const detail = mockQuest ? getQuestDetail(mockQuest.id) : null;
  const experienceDetail = publishedQuest?.experienceDetails ?? detail;

  useEffect(() => {
    if (!publishedQuest) return;
    void recordQuestView(publishedQuest.databaseId).catch((error) => {
      console.error("Could not record Quest view.", error);
    });
  }, [publishedQuest]);

  if (isLoading && !mockQuest) {
    return <div className="flex items-center justify-center h-full p-8 text-sm text-muted-foreground">Loading quest...</div>;
  }

  if (!quest) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <p className="text-4xl mb-3">😕</p>
        <p className="font-bold">Quest not found</p>
        <Button variant="ghost" className="mt-4" onClick={() => navigate("/")}>Go Home</Button>
      </div>
    );
  }

  const mockMapUrls = mockQuest ? getMockQuestMapUrls(mockQuest) : null;
  const fallbackMapQuery = encodeURIComponent(`${quest.title} ${quest.location}`);
  const googleMapUrl = publishedQuest?.experienceDetails.googleMapUrl
    ?? mockMapUrls?.google
    ?? `https://www.google.com/maps/search/?api=1&query=${fallbackMapQuery}`;
  const kakaoMapUrl = publishedQuest?.experienceDetails.kakaoMapUrl
    ?? mockMapUrls?.kakao
    ?? `https://map.kakao.com/link/search/${fallbackMapQuery}`;

  return (
    <div className="flex flex-col min-h-full">
      {/* Hero Image */}
      <div className="relative">
        <img
          src={quest.image}
          alt={quest.title}
          className="w-full h-56 object-cover"
          width={800}
          height={512}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 to-transparent" />
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 flex items-center gap-1 text-sm font-bold text-primary-foreground bg-foreground/30 backdrop-blur-sm px-3 py-1.5 rounded-full active:opacity-70"
        >
          <ArrowLeft size={16} /> Back
        </button>
        <img
          src={tigerPoseSrc[poseForQuest(quest)]}
          alt=""
          aria-hidden
          className="absolute bottom-2 right-3 h-32 w-auto object-contain drop-shadow-xl pointer-events-none animate-tiger-wiggle"
        />
        <div className="absolute bottom-0 left-0 right-0 p-5">
          <h1 className="text-2xl font-extrabold text-primary-foreground leading-tight">{quest.title}</h1>
          <p className="text-sm text-primary-foreground/80 mt-1">{quest.subtitle}</p>
        </div>
      </div>


      {/* Meta pills */}
      <div className="flex items-center gap-2.5 px-5 pt-4 flex-wrap">
        <span className="text-xs font-bold px-3 py-1 rounded-full bg-primary/10 text-primary">
          {quest.category}
        </span>
        <span className={`text-xs font-bold px-3 py-1 rounded-full ${difficultyColor(quest.difficulty)}`}>
          {quest.difficulty}
        </span>
        <span className="flex items-center gap-1 text-xs text-muted-foreground bg-muted/60 px-3 py-1 rounded-full">
          <Clock size={13} /> {quest.time}
        </span>
        <span className="flex items-center gap-1 text-xs text-muted-foreground bg-muted/60 px-3 py-1 rounded-full">
          <MapPin size={13} /> {quest.distance}
        </span>
        <span className="flex items-center gap-1 text-xs font-bold text-xp bg-xp/10 px-3 py-1 rounded-full">
          <Zap size={13} /> {quest.xp} XP
        </span>
      </div>

      {/* Content */}
      <div className="px-5 py-5 space-y-5 flex-1">
        {/* About */}
        <div>
          <h2 className="font-bold text-sm mb-2">About This Quest</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">{quest.description}</p>
        </div>

        {/* Your Mission */}
        <div className="rounded-2xl bg-primary/5 border border-primary/20 p-4">
          <h2 className="font-bold text-sm mb-1">🎯 Your Mission</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">{quest.mission}</p>
        </div>

        {/* Quest Steps */}
        <div>
          <h2 className="font-bold text-sm mb-2">Quest Steps</h2>
          <div className="space-y-2">
            {quest.steps.map((step) => (
              <div key={step.id} className="rounded-xl bg-card border border-border p-3 flex gap-3 shadow-sm">
                <span className="text-lg" aria-hidden>{step.emoji}</span>
                <div>
                  <p className="font-bold text-sm">{step.title}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Group CTA */}
        <div className="rounded-2xl bg-card border border-border p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold text-sm">Do this with others?</p>
              <p className="text-xs text-muted-foreground mt-0.5">3 people are doing this quest nearby</p>
            </div>
            <Button variant="outline" size="sm" className="rounded-xl font-bold text-xs gap-1.5">
              <Users size={14} /> Join Group
            </Button>
          </div>
        </div>

        {/* Location */}
        <div className="rounded-2xl bg-muted/40 border border-border p-4">
          <div className="flex items-center gap-2">
            <MapPin size={16} className="text-primary" />
            <span className="font-bold text-sm">{quest.location}</span>
          </div>
        </div>

        {/* Quest Info Accordion */}
        {experienceDetail && (
          <div className="rounded-2xl bg-card border border-border shadow-sm px-4">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="about" className="border-b border-border/60">
                <AccordionTrigger className="text-sm font-bold py-3.5 hover:no-underline">
                  <span className="flex items-center gap-2">
                    <Info size={15} className="text-primary" /> About This Experience
                  </span>
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground leading-relaxed pb-4">
                  {experienceDetail.about}
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="tips" className="border-b border-border/60">
                <AccordionTrigger className="text-sm font-bold py-3.5 hover:no-underline">
                  <span className="flex items-center gap-2">
                    <Lightbulb size={15} className="text-accent" /> Local Tips
                  </span>
                </AccordionTrigger>
                <AccordionContent className="pb-4">
                  <ul className="space-y-2 text-sm text-muted-foreground leading-relaxed">
                    {experienceDetail.tips.map((t, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="text-accent">•</span>
                        <span>{t}</span>
                      </li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="budget" className="border-b border-border/60">
                <AccordionTrigger className="text-sm font-bold py-3.5 hover:no-underline">
                  <span className="flex items-center gap-2">
                    <Wallet size={15} className="text-primary" /> Budget
                  </span>
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground leading-relaxed pb-4">
                  {experienceDetail.budget}
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="hours" className="border-b border-border/60">
                <AccordionTrigger className="text-sm font-bold py-3.5 hover:no-underline">
                  <span className="flex items-center gap-2">
                    <CalendarClock size={15} className="text-primary" /> Hours
                  </span>
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground leading-relaxed pb-4">
                  <div className="space-y-2">
                    <p>{experienceDetail.hours}</p>
                    {publishedQuest && <p><span className="font-bold text-foreground">Closed:</span> {publishedQuest.experienceDetails.restDate}</p>}
                    {publishedQuest && <p><span className="font-bold text-foreground">Parking:</span> {publishedQuest.experienceDetails.parking}</p>}
                    {publishedQuest && <p><span className="font-bold text-foreground">Programs:</span> {publishedQuest.experienceDetails.operatingGuide}</p>}
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="how" className="border-b border-border/60">
                <AccordionTrigger className="text-sm font-bold py-3.5 hover:no-underline">
                  <span className="flex items-center gap-2">
                    <Navigation size={15} className="text-primary" /> How to Get There
                  </span>
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground leading-relaxed pb-4">
                  <div className="grid grid-cols-2 gap-2">
                    <a href={googleMapUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2.5 text-xs font-bold text-primary-foreground">
                      <Navigation size={14} /> Google Maps
                    </a>
                    <a href={kakaoMapUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2.5 text-xs font-bold text-foreground">
                      <Navigation size={14} /> Kakao Map
                    </a>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="signs" className="border-b-0">
                <AccordionTrigger className="text-sm font-bold py-3.5 hover:no-underline">
                  <span className="flex items-center gap-2">
                    <Languages size={15} className="text-accent" /> Sign Translation
                  </span>
                </AccordionTrigger>
                <AccordionContent className="pb-4 space-y-4">
                  {detail?.commonSigns && detail.commonSigns.length > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                        Signs you'll see
                      </p>
                      <div className="rounded-xl bg-muted/40 border border-border divide-y divide-border">
                        {detail.commonSigns.map((s, i) => (
                          <div key={i} className="flex items-center justify-between px-3 py-2 text-sm">
                            <span className="font-bold">{s.korean}</span>
                            <span className="text-muted-foreground text-xs">{s.meaning}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <SignTranslator />
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        )}
      </div>

      {/* Sticky CTA */}
      <div className="sticky bottom-0 bg-background/90 backdrop-blur-md border-t border-border px-5 py-4">
        <Button
          className="w-full rounded-xl font-extrabold h-14 text-base shadow-lg"
          size="lg"
          onClick={() => navigate(`/quest/${quest.id}/play`)}
        >
          Start Quest 🚀
        </Button>
      </div>
    </div>
  );
};

export default QuestDetail;
