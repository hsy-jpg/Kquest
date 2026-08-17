import { useEffect, useState } from "react";
import logo from "@/assets/kquest-logo.png";

const Splash = ({ onDone }: { onDone: () => void }) => {
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setLeaving(true), 2700);
    const t2 = setTimeout(onDone, 3200);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [onDone]);

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center transition-opacity duration-500 ${
        leaving ? "opacity-0" : "opacity-100"
      }`}
      style={{ background: "linear-gradient(180deg, hsl(210 85% 96%), hsl(212 70% 90%))" }}
    >
      {/* Soft cloud accents */}
      <svg
        aria-hidden
        className="absolute inset-0 w-full h-full opacity-[0.08] text-[hsl(var(--korean-deep))]"
        viewBox="0 0 400 600"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <path d="M40 120 q15 -20 35 -10 q10 -15 28 -5 q12 -10 22 5 q8 12 -4 18 q6 12 -10 14 q-12 8 -22 -2 q-14 8 -24 -4 q-16 2 -25 -16z" />
        <path d="M260 90 q12 -18 30 -8 q14 -10 24 4 q10 12 -2 18 q4 10 -10 12 q-12 6 -22 -4 q-14 4 -20 -22z" />
        <path d="M60 480 q14 -16 30 -6 q10 -12 24 0 q12 10 0 18 q-10 8 -20 2 q-12 6 -34 -14z" />
        <path d="M280 510 q12 -14 26 -4 q10 -10 22 2 q10 10 -2 16 q-12 8 -22 0 q-14 4 -24 -14z" />
      </svg>

      {/* Floating blossoms */}
      <span className="absolute top-24 left-10 text-2xl opacity-50 animate-bounce-soft">🌸</span>
      <span className="absolute bottom-32 right-12 text-xl opacity-40 animate-bounce-soft" style={{ animationDelay: "0.3s" }}>🌸</span>

      {/* Logo */}
      <div className="relative animate-tiger-pop">
        <div className="absolute inset-0 -m-8 rounded-full bg-white/60 blur-3xl" />
        <img
          src={logo}
          alt="K-QUEST"
          className="relative w-64 h-64 object-contain drop-shadow-xl"
        />
      </div>

      {/* Tagline */}
      <p
        className="mt-2 text-xs font-extrabold tracking-[0.3em] text-[hsl(var(--korean-deep))] opacity-0 animate-fade-in"
        style={{ animationDelay: "0.5s", animationFillMode: "forwards" }}
      >
        한국을 탐험하는 특별한 여정
      </p>

      {/* Loading dots */}
      <div className="absolute bottom-24 flex items-center gap-1.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-2 h-2 rounded-full bg-primary animate-bounce-soft"
            style={{ animationDelay: `${i * 0.15}s`, animationDuration: "0.8s" }}
          />
        ))}
      </div>
    </div>
  );
};

export default Splash;
