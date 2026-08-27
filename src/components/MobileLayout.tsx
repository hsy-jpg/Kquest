import { ReactNode } from "react";
import BottomNav from "./BottomNav";
import KoreanBackdrop from "./KoreanBackdrop";

const MobileLayout = ({ children }: { children: ReactNode }) => {
  return (
    <div className="relative mx-auto min-h-[100dvh] w-full max-w-md overflow-x-hidden bg-background sm:shadow-[0_0_40px_hsl(220_56%_26%_/_0.12)]">
      <KoreanBackdrop />
      <main className="relative min-h-[100dvh] pb-[calc(6rem+env(safe-area-inset-bottom))]">{children}</main>
      <BottomNav />
    </div>
  );
};

export default MobileLayout;
