import { Home, Compass, Users, User, Swords } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

const tabs = [
  { path: "/", label: "Home", icon: Home },
  { path: "/quests", label: "Quest", icon: Swords },
  { path: "/explore", label: "Explore", icon: Compass },
  { path: "/community", label: "Community", icon: Users },
  { path: "/profile", label: "Profile", icon: User },
];

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto w-full max-w-md px-2 pb-2 pt-2 min-[375px]:px-3 min-[375px]:pb-3">
        <div
          className="flex items-center justify-around rounded-3xl border border-white/60 bg-card/95 backdrop-blur-md px-2 py-2 shadow-[var(--shadow-soft)]"
          style={{ background: "linear-gradient(180deg, hsl(0 0% 100% / 0.98), hsl(210 70% 97% / 0.98))" }}
        >
          {tabs.map(({ path, label, icon: Icon }) => {
            const isActive = location.pathname === path;
            return (
              <button
                key={path}
                onClick={() => navigate(path)}
                className={`relative flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-2xl px-1 py-1.5 transition-all min-[375px]:px-2 ${
                  isActive
                    ? "text-primary-foreground bg-gradient-to-b from-primary to-[hsl(217_64%_50%)] shadow-md scale-105"
                    : "text-nav-inactive"
                }`}
              >
                <Icon size={20} strokeWidth={isActive ? 2.8 : 2} />
                <span className="max-w-full truncate text-[9px] font-extrabold min-[375px]:text-[10px]">{label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default BottomNav;
