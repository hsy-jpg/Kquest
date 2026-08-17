import { useRef, useState } from "react";
import { Camera, Loader2, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

const SignTranslator = () => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
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
    setError(null);
    setTranslation(null);
    setLoading(true);
    try {
      const dataUrl = await fileToBase64(file);
      setPreview(dataUrl);
      const { data, error: fnError } = await supabase.functions.invoke(
        "translate-sign",
        { body: { imageBase64: dataUrl } },
      );
      if (fnError) throw fnError;
      if (data?.error) throw new Error(data.error);
      setTranslation(data?.translation ?? "No result.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Couldn't translate this sign.",
      );
    } finally {
      setLoading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const reset = () => {
    setPreview(null);
    setTranslation(null);
    setError(null);
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

      {!preview && (
        <Button
          onClick={() => inputRef.current?.click()}
          className="w-full rounded-xl font-bold gap-2 h-12"
        >
          <Sparkles size={16} />
          <Camera size={16} />
          AI Sign Translation
        </Button>
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
            {loading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 size={14} className="animate-spin" />
                Reading the sign…
              </div>
            )}
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
            {translation && (
              <pre className="text-xs whitespace-pre-wrap leading-relaxed font-sans text-foreground">
                {translation}
              </pre>
            )}
            {!loading && (
              <Button
                variant="outline"
                size="sm"
                className="mt-3 w-full rounded-xl font-bold text-xs"
                onClick={() => inputRef.current?.click()}
              >
                <Camera size={14} className="mr-1.5" /> Try another sign
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SignTranslator;
