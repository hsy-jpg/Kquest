import { useRef, useState } from "react";
import { Camera, CheckCircle2, Loader2, Sparkles, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const LEGACY_SIGN_TRANSLATOR_URL =
  "https://wljbisyzfurbnjzvuqzh.supabase.co/functions/v1/translate-sign";

type SignTranslation = {
  koreanText: string;
  englishMeaning: string;
  context?: string;
};

const parseLegacyTranslation = (value: string): SignTranslation => {
  if (/no korean text detected/i.test(value)) {
    return {
      koreanText: "읽을 수 있는 한국어가 없습니다",
      englishMeaning: "No readable Korean text was detected.",
    };
  }

  const korean = value.match(/KOREAN:\s*([\s\S]*?)(?=\n\s*ENGLISH:|$)/i)?.[1]?.trim();
  const english = value.match(/ENGLISH:\s*([\s\S]*?)(?=\n\s*MEANING:|$)/i)?.[1]?.trim();
  const context = value.match(/MEANING:\s*([\s\S]*)$/i)?.[1]?.trim();

  if (!korean || !english) throw new Error("No readable text was returned.");
  return { koreanText: korean, englishMeaning: english, context };
};

const SignTranslator = () => {
  const inputRef = useRef<HTMLInputElement>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const requestIdRef = useRef(0);
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [translation, setTranslation] = useState<SignTranslation | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fileToBase64 = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const optimizeImage = async (file: File) => {
    const source = await fileToBase64(file);
    const image = new Image();
    image.src = source;
    await image.decode();

    const maxDimension = 1600;
    const scale = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Image processing is unavailable.");
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.88);
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const requestId = ++requestIdRef.current;
    e.target.value = "";
    setError(null);
    setTranslation(null);
    try {
      if (!file.type.startsWith("image/")) throw new Error("Please choose an image file.");
      const dataUrl = await optimizeImage(file);
      if (requestId !== requestIdRef.current) return;
      setPreview(dataUrl);
      setFileName(file.name || "Captured photo");
      setLoading(true);

      const controller = new AbortController();
      const timeoutId = window.setTimeout(() => controller.abort(), 45_000);
      const response = await fetch(LEGACY_SIGN_TRANSLATOR_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: dataUrl }),
        signal: controller.signal,
      }).finally(() => window.clearTimeout(timeoutId));
      if (requestId !== requestIdRef.current) return;
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error ?? "Translation failed.");
      if (data?.error) throw new Error(data.error);
      setTranslation(
        data?.koreanText && data?.englishMeaning
          ? {
              koreanText: data.koreanText,
              englishMeaning: data.englishMeaning,
              context: data.context,
            }
          : parseLegacyTranslation(data?.translation ?? ""),
      );
    } catch {
      if (requestId !== requestIdRef.current) return;
      setError("Your image is ready, but translation is unavailable right now.");
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
      if (inputRef.current) inputRef.current.value = "";
      if (uploadInputRef.current) uploadInputRef.current.value = "";
    }
  };

  const reset = () => {
    requestIdRef.current += 1;
    setPreview(null);
    setFileName(null);
    setTranslation(null);
    setError(null);
    setLoading(false);
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground leading-relaxed">
        Take or upload a photo of a Korean sign, storefront, handwritten notice,
        or menu. K-Quest will rewrite the Korean clearly and explain it in English.
      </p>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFile}
      />
      <input
        ref={uploadInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
      />

      {!preview && (
        <div className="grid grid-cols-2 gap-2">
          <Button onClick={() => inputRef.current?.click()} className="rounded-xl font-bold gap-2 h-12">
            <Camera size={16} /> Take Photo
          </Button>
          <Button variant="outline" onClick={() => uploadInputRef.current?.click()} className="rounded-xl font-bold gap-2 h-12">
            <Upload size={16} /> Upload Image
          </Button>
        </div>
      )}

      {preview && (
        <div className="rounded-2xl overflow-hidden border border-border bg-card">
          <div className="relative">
            <img src={preview} alt="Captured sign" className="w-full h-44 object-cover" />
            <button
              onClick={reset}
              className="absolute top-2 right-2 bg-foreground/60 text-primary-foreground rounded-full p-1.5 active:opacity-70"
              aria-label="Clear"
            >
              <X size={14} />
            </button>
          </div>
          <div className="p-3">
            <div className="mb-3 flex items-start gap-2 rounded-xl bg-success/10 px-3 py-2 text-success">
              <CheckCircle2 size={15} className="mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-bold">Image uploaded successfully</p>
                {fileName && <p className="mt-0.5 truncate text-[10px] opacity-80">{fileName}</p>}
              </div>
            </div>
            {loading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 size={14} className="animate-spin" />
                Reading the Korean text...
              </div>
            )}
            {error && <p className="text-sm text-muted-foreground">{error}</p>}
            {translation && (
              <div className="space-y-3 rounded-xl bg-muted/40 p-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Korean text</p>
                  <p lang="ko" className="mt-1 whitespace-pre-wrap text-sm font-medium leading-relaxed text-foreground">
                    {translation.koreanText}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">English meaning</p>
                  <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                    {translation.englishMeaning}
                  </p>
                </div>
                {translation.context && (
                  <p className="border-t border-border pt-2 text-xs leading-relaxed text-muted-foreground">
                    {translation.context}
                  </p>
                )}
              </div>
            )}
            <Button
              variant="outline"
              size="sm"
              className="mt-3 w-full rounded-xl font-bold text-xs"
              onClick={() => uploadInputRef.current?.click()}
            >
              <Sparkles size={14} className="mr-1.5" /> Choose another image
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SignTranslator;
