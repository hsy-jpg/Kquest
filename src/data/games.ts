export interface TravelGame {
  id: string;
  emoji: string;
  title: string;
  tagline: string;
  description: string;
  rules: string[];
  missions: string[];
  badge: string;
  accent: string;
  budget?: number;
}

export const travelGames: TravelGame[] = [
  { id: "no-google-maps", emoji: "📵", title: "No Google Maps Day", tagline: "Can you survive Seoul without Maps?", description: "Put away the blue dot. Your only navigation tool is a real conversation.", rules: ["No map apps", "Ask politely", "Follow safe public recommendations"], missions: ["Ask a local: “Where should I eat around here?”", "Go to their recommendation.", "Ask another local what you should do next.", "Follow their recommendation.", "Upload or take a final discovery photo."], badge: "LOST BUT LOCAL", accent: "from-blue-500 to-indigo-700" },
  { id: "korea-decides", emoji: "🎲", title: "Let Korea Decide My Day", tagline: "You have no plan today. Good. Korea does.", description: "Roll into one surprise mission at a time and let the day build itself.", rules: ["No rerolls", "Stay curious", "Choose safe public places"], missions: ["Take the subway and ride 5 stops.", "Find a food you've never eaten before.", "Ask a local what you should do next.", "Find somewhere you would never normally visit."], badge: "KOREA CHOSE MY DAY", accent: "from-violet-500 to-primary" },
  { id: "zero-tourist-spots", emoji: "🚫", title: "Zero Tourist Spots Challenge", tagline: "Can you enjoy Seoul without one famous tourist spot?", description: "Leave the checklist behind and find the version of Seoul people actually live in.", rules: ["No palaces", "No Myeongdong", "No Hongdae", "No famous attractions"], missions: ["Find a neighborhood market.", "Eat somewhere with no obvious tourist branding.", "Find a local park or neighborhood hangout.", "Discover one unexpected place.", "Save your favorite discovery."], badge: "TOURIST TRAP ESCAPED", accent: "from-rose-500 to-orange-500" },
  { id: "20000-survival", emoji: "💸", title: "20,000 Seoul Survival", tagline: "Can you survive one day in Seoul with only ₩20,000?", description: "Track every won and finish a complete Seoul day before the budget hits zero.", rules: ["Start with ₩20,000", "Log every expense", "Do not exceed the budget"], missions: ["Find breakfast under ₩5,000.", "Travel somewhere using public transportation.", "Find a free activity.", "Eat one Korean snack.", "Finish the day without reaching ₩0."], badge: "SEOUL SURVIVOR", accent: "from-emerald-500 to-teal-700", budget: 20000 },
];

export const getTravelGame = (id?: string) => travelGames.find((game) => game.id === id);
