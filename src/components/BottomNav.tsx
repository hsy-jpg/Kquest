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
      <div className="mx-auto max-w-md px-3 pb-3 pt-2">
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
                className={`relative flex flex-col items-center gap-0.5 rounded-2xl px-3 py-1.5 transition-all ${
                  isActive
                    ? "text-primary-foreground bg-gradient-to-b from-primary to-[hsl(217_64%_50%)] shadow-md scale-105"
                    : "text-nav-inactive"
                }`}
              >
                <Icon size={20} strokeWidth={isActive ? 2.8 : 2} />
                <span className="text-[10px] font-extrabold">{label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default BottomNav;
