import { useRef, useState } from "react";
import { Camera, CheckCircle2, Loader2, Sparkles, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

const SignTranslator = () => {
  const inputRef = useRef<HTMLInputElement>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const requestIdRef = useRef(0);
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [translation, setTranslation] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fileToBase64 = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const requestId = ++requestIdRef.current;
    e.target.value = "";
    setError(null);
    setTranslation(null);
    try {
      const dataUrl = await fileToBase64(file);
      if (requestId !== requestIdRef.current) return;
      setPreview(dataUrl);
      setFileName(file.name || "Captured photo");
      setLoading(true);

      const { data, error: fnError } = await Promise.race([
        supabase.functions.invoke("translate-sign", {
          body: { imageBase64: dataUrl },
        }),
        new Promise<never>((_, reject) => {
          window.setTimeout(() => reject(new Error("Translation timed out.")), 12_000);
        }),
      ]);
      if (requestId !== requestIdRef.current) return;
      if (fnError) throw fnError;
      if (data?.error) throw new Error(data.error);
      setTranslation(data?.translation ?? "No readable text was returned.");
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
        Stuck on a Korean sign? Snap a photo and Lovable AI will read and
        translate it for you.
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
                Reading the sign…
              </div>
            )}
            {error && <p className="text-sm text-muted-foreground">{error}</p>}
            {translation && (
              <pre className="text-xs whitespace-pre-wrap leading-relaxed font-sans text-foreground">
                {translation}
              </pre>
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
