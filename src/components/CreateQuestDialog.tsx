import { FormEvent, useEffect, useRef, useState } from "react";
import { Camera, CheckCircle2, Loader2, Plus, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { submitQuestProposal } from "@/features/quests/questSubmissions";
import type { Quest } from "@/data/quests";

const categories: Quest["category"][] = ["Food", "Culture", "Nature", "Nightlife", "Shopping", "Festival"];

const CreateQuestDialog = () => {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [mission, setMission] = useState("");
  const [category, setCategory] = useState<Quest["category"] | "">("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => () => { if (photoUrl) URL.revokeObjectURL(photoUrl); }, [photoUrl]);

  const reset = () => {
    setTitle(""); setLocation(""); setMission(""); setCategory(""); setPhoto(null); setPhotoUrl(null); setSubmitted(false); setError(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handlePhoto = (file?: File) => {
    if (!file) return;
    if (photoUrl) URL.revokeObjectURL(photoUrl);
    setPhoto(file); setPhotoUrl(URL.createObjectURL(file)); setError(null);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!category || !photo) { setError("Please choose a category and upload a photo."); return; }
    setSubmitting(true); setError(null);
    try {
      await submitQuestProposal({ title, location, mission, category, photo });
      setSubmitted(true);
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Could not submit your Quest.");
    } finally { setSubmitting(false); }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => { setOpen(next); if (!next) reset(); }}>
      <DialogTrigger asChild><Button className="h-10 shrink-0 rounded-xl px-3 font-extrabold shadow-sm"><Plus size={16} /> Create Quest</Button></DialogTrigger>
      <DialogContent className="max-h-[92dvh] w-[calc(100%-2rem)] max-w-md overflow-y-auto rounded-2xl p-5">
        {submitted ? (
          <div className="flex flex-col items-center px-2 py-8 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/15 text-success"><CheckCircle2 size={34} /></div>
            <DialogTitle className="mt-5 text-xl font-black">🎉 Your Quest is under review!</DialogTitle>
            <DialogDescription className="mt-2 leading-relaxed">Thanks for sharing a local experience. We’ll review it before it appears in K-Quest.</DialogDescription>
            <Button className="mt-6 w-full rounded-xl font-extrabold" onClick={() => setOpen(false)}>Done</Button>
          </div>
        ) : (
          <>
            <DialogHeader><DialogTitle className="text-xl font-black">Create a Quest</DialogTitle><DialogDescription>Share something visitors should do—not just somewhere they should go.</DialogDescription></DialogHeader>
            <form className="mt-1 space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-1.5"><Label htmlFor="quest-title">Quest Title</Label><Input id="quest-title" required minLength={3} maxLength={100} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Find Seoul's best hotteok" /></div>
              <div className="space-y-1.5"><Label htmlFor="quest-location">Location</Label><Input id="quest-location" required minLength={2} maxLength={160} value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Neighborhood, venue, or address" /></div>
              <div className="space-y-1.5"><Label htmlFor="quest-mission">What should people do?</Label><Textarea id="quest-mission" required minLength={10} maxLength={1000} value={mission} onChange={(e) => setMission(e.target.value)} placeholder="Describe one clear action and how to complete it." className="min-h-24" /></div>
              <div className="space-y-1.5"><Label>Category</Label><Select value={category} onValueChange={(value) => setCategory(value as Quest["category"])}><SelectTrigger className="rounded-xl"><SelectValue placeholder="Choose a category" /></SelectTrigger><SelectContent>{categories.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-1.5">
                <Label>Upload Photo</Label><input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif" className="hidden" onChange={(e) => handlePhoto(e.target.files?.[0])} />
                <button type="button" onClick={() => fileRef.current?.click()} className="relative flex min-h-36 w-full overflow-hidden rounded-2xl border-2 border-dashed border-primary/25 bg-primary/5 transition-colors active:bg-primary/10">
                  {photoUrl ? <img src={photoUrl} alt="Quest submission preview" className="absolute inset-0 h-full w-full object-cover" /> : <span className="m-auto flex flex-col items-center gap-2 text-sm font-bold text-muted-foreground"><Camera className="text-primary" size={28} /> Add a Quest photo<span className="text-[11px] font-normal">JPG, PNG, WebP or HEIC · max 8 MB</span></span>}
                  {photoUrl && <span className="absolute bottom-2 right-2 rounded-full bg-card/90 px-3 py-1 text-xs font-bold text-foreground">Change</span>}
                </button>
              </div>
              {error && <p role="alert" className="rounded-xl bg-destructive/10 px-3 py-2 text-xs font-bold text-destructive">{error}</p>}
              <Button type="submit" disabled={submitting} className="h-12 w-full rounded-xl font-extrabold">{submitting ? <><Loader2 size={17} className="animate-spin" /> Uploading...</> : <><Upload size={17} /> Submit</>}</Button>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CreateQuestDialog;
