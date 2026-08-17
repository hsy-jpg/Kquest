import { ReactNode } from "react";
import BottomNav from "./BottomNav";
import KoreanBackdrop from "./KoreanBackdrop";

const MobileLayout = ({ children }: { children: ReactNode }) => {
  return (
    <div className="mx-auto min-h-screen max-w-md bg-background relative overflow-hidden">
      <KoreanBackdrop />
      <main className="pb-24 relative">{children}</main>
      <BottomNav />
    </div>
  );
};

export default MobileLayout;
