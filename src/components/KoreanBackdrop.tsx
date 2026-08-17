import scenery from "@/assets/scenery-seoul.png";

/**
 * Soft Korean cultural backdrop used across the app.
 * - Soft blue sky gradient
 * - Subtle traditional cloud (구름) SVG pattern
 * - Floating cherry blossoms
 * - Illustrated Seoul scenery silhouette at the bottom (Namsan, hanok, mountains)
 */
const KoreanBackdrop = () => {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Sky gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[hsl(210_85%_96%)] via-[hsl(212_70%_94%)] to-[hsl(212_60%_90%)]" />

      {/* Traditional Korean cloud pattern (구름문) */}
      <svg
        className="absolute inset-x-0 top-0 w-full h-64 opacity-[0.08] text-[hsl(var(--korean-deep))]"
        viewBox="0 0 400 200"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <g>
          <path d="M30 40 q15 -20 35 -10 q10 -15 28 -5 q12 -10 22 5 q8 12 -4 18 q6 12 -10 14 q-12 8 -22 -2 q-14 8 -24 -4 q-16 2 -25 -16z" />
          <path d="M210 30 q12 -18 30 -8 q14 -10 24 4 q10 12 -2 18 q4 10 -10 12 q-12 6 -22 -4 q-14 4 -20 -22z" />
          <path d="M310 70 q10 -14 24 -6 q12 -8 20 4 q8 12 -4 16 q-8 8 -18 0 q-12 4 -22 -14z" />
          <path d="M60 140 q14 -16 30 -6 q10 -12 24 0 q12 10 0 18 q-10 8 -20 2 q-12 6 -34 -14z" />
          <path d="M260 150 q12 -14 26 -4 q10 -10 22 2 q10 10 -2 16 q-12 8 -22 0 q-14 4 -24 -14z" />
        </g>
      </svg>

      {/* Floating cherry blossoms */}
      <div className="absolute top-12 left-6 text-2xl opacity-30 rotate-[-15deg]">🌸</div>
      <div className="absolute top-32 right-8 text-xl opacity-25 rotate-[20deg]">🌸</div>
      <div className="absolute top-1/2 left-2 text-lg opacity-20 rotate-[10deg]">🌸</div>
      <div className="absolute top-72 right-4 text-2xl opacity-25 rotate-[-25deg]">🌸</div>

      {/* Bottom illustrated Seoul scenery */}
      <img
        src={scenery}
        alt=""
        className="absolute bottom-16 left-0 right-0 w-full opacity-25 select-none"
      />
    </div>
  );
};

export default KoreanBackdrop;
