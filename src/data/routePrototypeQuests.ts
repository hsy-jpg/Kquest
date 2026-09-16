import type { Quest, QuestStep } from "@/data/quests";
import jejuCover from "@/assets/route-tangerines-jeju.png";
import inwangsanCover from "@/assets/route-earn-makgeolli.png";
import marketImage from "@/assets/quest-market.jpg";
import convstoreImage from "@/assets/quest-convstore.jpg";
import tteokbokkiImage from "@/assets/quest-tteokbokki.jpg";
import bookstoreImage from "@/assets/quest-bookstore.jpg";
import cafeImage from "@/assets/quest-cafe.jpg";
import hanriverImage from "@/assets/quest-hanriver-picnic.jpg";
import noraebangImage from "@/assets/quest-noraebang.jpg";
import pojangmachaImage from "@/assets/quest-pojangmacha.jpg";
import jjimjilbangImage from "@/assets/quest-jjimjilbang.jpg";
import apartmentImage from "@/assets/quest-apartment-park.jpg";
import dongmyoImage from "@/assets/quest-dongmyo.jpg";
import gimnyeongImage from "@/assets/quest-jeju-gimnyeong-letter.png";
import mokgwanaImage from "@/assets/quest-jeju-mokgwana.png";
import jejuFoodImage from "@/assets/quest-jeju-local-food.png";
import hikingSnacksImage from "@/assets/quest-inwangsan-snacks.png";
import hikingClimbImage from "@/assets/quest-inwangsan-climb.png";
import hikingSummitImage from "@/assets/quest-inwangsan-summit.png";
import hikingFeastImage from "@/assets/quest-inwangsan-feast.png";
import gimbapImage from "@/assets/quest-gimbap.jpg";
import bakeryImage from "@/assets/quest-bakery.jpg";
import nightmarketImage from "@/assets/quest-nightmarket.jpg";
import roseImage from "@/assets/quest-rose-festival.jpg";
import badukImage from "@/assets/quest-baduk.jpg";
import hanokImage from "@/assets/quest-hanok.jpg";

type Seed = Pick<Quest, "id" | "title" | "subtitle" | "image" | "category" | "difficulty" | "time" | "distance" | "location" | "description" | "mission">;

const questImageOverrides: Record<number, string> = {
  101: gimnyeongImage,
  102: mokgwanaImage,
  103: jejuFoodImage,
  110: hikingSnacksImage,
  111: hikingClimbImage,
  112: hikingSummitImage,
  114: hikingFeastImage,
  132: nightmarketImage,
  151: gimbapImage,
  152: bakeryImage,
  200: roseImage,
  212: badukImage,
  213: hanokImage,
  220: bakeryImage,
};

const makeQuest = (seed: Seed): Quest => {
  const steps: QuestStep[] = [
    { id: 1, title: "Reach the mission spot", description: `Head to ${seed.location} and get ready for the challenge.`, emoji: "📍", type: "location" },
    { id: 2, title: "Complete the action", description: seed.mission, emoji: "🎯", type: "action" },
    { id: 3, title: "Save the moment", description: "Take a respectful proof photo that captures what you completed.", emoji: "📸", type: "photo" },
  ];
  return { ...seed, image: questImageOverrides[seed.id] ?? seed.image, xp: seed.difficulty === "Medium" ? 130 : 100, emoji: "🎯", story: seed.description, steps };
};

export const routePrototypeQuests: Quest[] = [
  makeQuest({ id: 100, title: "Seongsan Drama Still", subtitle: "Recreate a quiet Jeju opening scene", image: jejuCover, category: "Nature", difficulty: "Easy", time: "1.5 hr", distance: "1.5 km", location: "Seongsan Ilchulbong, Jeju", description: "Begin the route at Jeju's iconic volcanic peak and frame the landscape like a drama still.", mission: "Take one cinematic photo with Seongsan Ilchulbong in the composition." }),
  makeQuest({ id: 101, title: "Letter at Gimnyeong Beach", subtitle: "Write one line to your future self", image: jejuCover, category: "Nature", difficulty: "Easy", time: "1 hr", distance: "0.8 km", location: "Gimnyeong Beach, Jeju", description: "Pause by Gimnyeong's clear water and turn the scenery into a personal memory.", mission: "Write one honest sentence to your future self, then photograph it against the sea." }),
  makeQuest({ id: 102, title: "Jeju Mokgwana Time Walk", subtitle: "Find a detail that belongs in another era", image: jejuCover, category: "Culture", difficulty: "Easy", time: "1 hr", distance: "0.7 km", location: "Jeju Mokgwana, Jeju City", description: "Explore Jeju's historic government complex through architecture, texture, and quiet observation.", mission: "Find one historical architectural detail and capture it like a period-drama frame." }),
  makeQuest({ id: 103, title: "Taste a New Jeju Dish", subtitle: "Order one local food you have never tried", image: jejuCover, category: "Food", difficulty: "Easy", time: "1 hr", distance: "0.5 km", location: "A local restaurant in Jeju", description: "Finish the story through a genuinely local Jeju flavor.", mission: "Ask for a Jeju specialty you have never eaten, try it, and record its name." }),

  makeQuest({ id: 110, title: "Choose Your Hiking Fuel", subtitle: "Build a Korean convenience-store trail pack", image: convstoreImage, category: "Food", difficulty: "Easy", time: "20 min", distance: "0.2 km", location: "A convenience store near Inwangsan", description: "Every Korean hike starts with practical snacks and enough water.", mission: "Choose water and two trail snacks within a ₩10,000 budget." }),
  makeQuest({ id: 111, title: "Climb Inwangsan", subtitle: "Follow the fortress wall toward the summit", image: inwangsanCover, category: "Nature", difficulty: "Medium", time: "1.5 hr", distance: "2.5 km", location: "Inwangsan Trail, Seoul", description: "Earn the view one section of the fortress wall at a time.", mission: "Complete the marked climb from the trailhead to the summit area." }),
  makeQuest({ id: 112, title: "Inwangsan Summit Proof", subtitle: "Take the photo that proves you earned it", image: inwangsanCover, category: "Nature", difficulty: "Easy", time: "15 min", distance: "0.1 km", location: "Inwangsan Summit, Seoul", description: "Stop safely at the summit and capture Seoul opening below you.", mission: "Take a safe summit photo with the city or fortress wall visible." }),
  makeQuest({ id: 113, title: "Finish the Descent", subtitle: "The feast only counts after you come down", image: inwangsanCover, category: "Nature", difficulty: "Medium", time: "1 hr", distance: "2.0 km", location: "Inwangsan Descent Trail, Seoul", description: "Complete the full journey by descending carefully to the village streets.", mission: "Reach the official trail exit and photograph the final trail marker." }),
  makeQuest({ id: 114, title: "Pajeon & Makgeolli Reward", subtitle: "No hike, no makgeolli", image: pojangmachaImage, category: "Food", difficulty: "Easy", time: "1 hr", distance: "0.5 km", location: "A restaurant near Inwangsan, Seoul", description: "Claim the classic post-hike reward: crisp pajeon and a bowl of makgeolli.", mission: "Order pajeon with makgeolli or a non-alcoholic alternative and photograph the earned feast." }),

  makeQuest({ id: 120, title: "Budget Market Breakfast", subtitle: "Start the day without breaking ₩5,000", image: marketImage, category: "Food", difficulty: "Medium", time: "45 min", distance: "0.8 km", location: "A traditional market in Seoul", description: "Use market prices and local instincts to build a filling breakfast.", mission: "Buy breakfast at a market for ₩5,000 or less and keep the receipt or price photo." }),
  makeQuest({ id: 121, title: "Ride Seoul on a Budget", subtitle: "Use public transit and protect your cash", image: apartmentImage, category: "Culture", difficulty: "Easy", time: "45 min", distance: "5 km", location: "Seoul subway", description: "Cross the city like a resident using only public transportation.", mission: "Take one subway journey and record the fare as part of your ₩20,000 total." }),
  makeQuest({ id: 122, title: "Value Lunch Hunt", subtitle: "Find a real meal under ₩8,000", image: tteokbokkiImage, category: "Food", difficulty: "Medium", time: "1 hr", distance: "1 km", location: "A university or office neighborhood in Seoul", description: "Search beyond trend lists for a lunch locals can actually afford.", mission: "Find and eat a complete lunch costing ₩8,000 or less." }),
  makeQuest({ id: 123, title: "Free Seoul Mission", subtitle: "Have fun without spending one won", image: hanriverImage, category: "Culture", difficulty: "Easy", time: "1.5 hr", distance: "2 km", location: "A free public space in Seoul", description: "Prove that the city itself can be the attraction.", mission: "Spend one full hour at a free park, trail, exhibition, or public viewpoint." }),
  makeQuest({ id: 124, title: "Final-Won Convenience Supper", subtitle: "Finish the day inside the ₩20,000 limit", image: convstoreImage, category: "Food", difficulty: "Medium", time: "30 min", distance: "0.2 km", location: "Any Seoul convenience store", description: "Use only the money remaining from today's budget.", mission: "Build a late snack with your remaining budget and show the final total at or below ₩20,000." }),

  makeQuest({ id: 130, title: "Campus Neighborhood Walk", subtitle: "Explore the streets around a Korean university", image: bookstoreImage, category: "Culture", difficulty: "Easy", time: "1 hr", distance: "1.5 km", location: "Sinchon or Hongdae university district, Seoul", description: "Notice club posters, student cafés, stationery shops, and campus energy.", mission: "Walk one campus neighborhood and photograph three details of student life." }),
  makeQuest({ id: 131, title: "Student Lunch Mission", subtitle: "Eat like a student, pay like a student", image: tteokbokkiImage, category: "Food", difficulty: "Easy", time: "45 min", distance: "0.5 km", location: "A university-area bunsikjip, Seoul", description: "Choose an affordable meal from the places students use every day.", mission: "Order a university-area meal or bunsik combo under ₩10,000." }),
  makeQuest({ id: 132, title: "Four-Cut Photo Booth", subtitle: "Make the unofficial Korean student ID", image: cafeImage, category: "Culture", difficulty: "Easy", time: "30 min", distance: "0.3 km", location: "A self-photo booth in a Seoul university district", description: "Pick props, choose four poses, and leave with a classic photo strip.", mission: "Complete one four-cut photo strip and choose your best frame." }),

  makeQuest({ id: 140, title: "Ask a Local for Directions", subtitle: "No map—your first clue must come from a person", image: apartmentImage, category: "Culture", difficulty: "Medium", time: "30 min", distance: "0.5 km", location: "A neighborhood street in Seoul", description: "Practice respectful human navigation instead of following a blue dot.", mission: "Politely ask someone for directions and follow their explanation to the next block." }),
  makeQuest({ id: 141, title: "Vendor's Choice", subtitle: "Let a market seller choose your bite", image: marketImage, category: "Food", difficulty: "Easy", time: "45 min", distance: "0.5 km", location: "A traditional market in Seoul", description: "The best recommendation is often standing behind the counter.", mission: "Ask a vendor what they recommend today and try that item." }),
  makeQuest({ id: 142, title: "Order the Owner's Pick", subtitle: "Give up control of the menu", image: tteokbokkiImage, category: "Food", difficulty: "Medium", time: "1 hr", distance: "0.5 km", location: "A neighborhood restaurant in Seoul", description: "Discover a dish by trusting the person who serves it every day.", mission: "Ask for the owner's recommendation and order it without searching reviews." }),
  makeQuest({ id: 143, title: "Find a Place Not on Your List", subtitle: "Follow a local clue to a hidden stop", image: cafeImage, category: "Culture", difficulty: "Medium", time: "1 hr", distance: "1 km", location: "Any Seoul neighborhood", description: "End somewhere you could not have planned in advance.", mission: "Visit one safe public place recommended by a local and record how you found it." }),

  makeQuest({ id: 150, title: "Mystery Korean Drink", subtitle: "Choose a bottle you have never seen before", image: convstoreImage, category: "Food", difficulty: "Easy", time: "15 min", distance: "0.1 km", location: "Any Korean convenience store", description: "Explore the refrigerator without relying on familiar labels.", mission: "Pick one unfamiliar Korean drink, taste it, and rate it out of five." }),
  makeQuest({ id: 151, title: "Triangle Gimbap Pairing", subtitle: "Build the perfect two-item combo", image: convstoreImage, category: "Food", difficulty: "Easy", time: "25 min", distance: "0.1 km", location: "Any Korean convenience store", description: "Match a triangle gimbap flavor with one snack or drink.", mission: "Create and photograph a triangle-gimbap pairing under ₩6,000." }),
  makeQuest({ id: 152, title: "Register Your Secret Combo", subtitle: "Invent a convenience-store menu hack", image: convstoreImage, category: "Food", difficulty: "Medium", time: "30 min", distance: "0.1 km", location: "Any Korean convenience store", description: "Turn separate shelf items into one original creation.", mission: "Combine at least two products, name your combo, and photograph the recipe." }),

  makeQuest({ id: 160, title: "Rainy-Day Pajeon", subtitle: "Listen to the rain with jeon and makgeolli", image: pojangmachaImage, category: "Food", difficulty: "Easy", time: "1 hr", distance: "0.5 km", location: "A jeon restaurant in Seoul", description: "Experience Korea's favorite rainy-day food pairing.", mission: "Order pajeon with makgeolli or a non-alcoholic drink and record the rain soundtrack." }),
  makeQuest({ id: 161, title: "Manhwa Café Hideout", subtitle: "Wait out the rain between comic shelves", image: bookstoreImage, category: "Culture", difficulty: "Easy", time: "1.5 hr", distance: "0.3 km", location: "A manhwa café in Seoul", description: "Trade wet streets for comics, warm seats, and an unhurried break.", mission: "Read one Korean comic volume or translated title for at least 30 minutes." }),
  makeQuest({ id: 170, title: "Golden-Hour Proof", subtitle: "Catch Seoul at its most cinematic", image: hanriverImage, category: "Nature", difficulty: "Easy", time: "45 min", distance: "0.5 km", location: "A sunset viewpoint in Seoul", description: "Time your arrival and capture the city changing color.", mission: "Take one sunset photo during golden hour without using a preset filter." }),
  makeQuest({ id: 171, title: "Film Your Ending Scene", subtitle: "Give the day its final shot", image: apartmentImage, category: "Culture", difficulty: "Easy", time: "30 min", distance: "0.5 km", location: "A safe public street or park in Seoul", description: "End the route with a short scene that feels entirely yours.", mission: "Record a 10-second final scene showing where your Seoul story ended." }),

  makeQuest({ id: 180, title: "Korean Hangover Soup", subtitle: "Start recovery with a steaming bowl", image: tteokbokkiImage, category: "Food", difficulty: "Easy", time: "1 hr", distance: "0.5 km", location: "A haejangguk restaurant in Seoul", description: "Try the warming soup Koreans reach for after a long night.", mission: "Order haejangguk or another traditional recovery soup and record its key ingredients." }),
  makeQuest({ id: 181, title: "Hangover Drink Shelf", subtitle: "Investigate Korea's convenience-store remedies", image: convstoreImage, category: "Food", difficulty: "Easy", time: "20 min", distance: "0.1 km", location: "Any Korean convenience store", description: "Explore the small bottles and drinks marketed for the morning after.", mission: "Find two Korean hangover drinks, compare their labels, and choose one only if appropriate for you." }),
  makeQuest({ id: 182, title: "Iced Coffee Reset", subtitle: "Complete the Korean recovery ritual", image: cafeImage, category: "Food", difficulty: "Easy", time: "30 min", distance: "0.3 km", location: "A neighborhood café in Seoul", description: "Slow down with the drink that appears in every season.", mission: "Order an iced coffee or caffeine-free alternative and take a quiet 20-minute break." }),

  makeQuest({ id: 190, title: "Draw Three Subway Stops", subtitle: "Let one line choose today's map", image: apartmentImage, category: "Culture", difficulty: "Medium", time: "20 min", distance: "0 km", location: "Any Seoul subway line", description: "Choose one subway line, then randomly select three different stations.", mission: "Write down three randomly selected stations on one line and commit to their order." }),
  makeQuest({ id: 191, title: "Station Food Mission", subtitle: "Eat one thing found near your random stop", image: tteokbokkiImage, category: "Food", difficulty: "Easy", time: "45 min", distance: "0.5 km", location: "Within 500 m of a selected subway station", description: "Let the station neighborhood decide what you eat.", mission: "Buy one local food within 500 m of your selected station." }),
  makeQuest({ id: 192, title: "Station Photo Mission", subtitle: "Find the image unique to this stop", image: dongmyoImage, category: "Culture", difficulty: "Easy", time: "45 min", distance: "0.8 km", location: "A selected Seoul subway station neighborhood", description: "Look for a scene that could only belong to this neighborhood.", mission: "Take one photo featuring the station name and one neighborhood detail." }),
  makeQuest({ id: 200, title: "Choose the Final Date Spot", subtitle: "Make your final selection", image: hanriverImage, category: "Culture", difficulty: "Easy", time: "30 min", distance: "0.5 km", location: "A public date spot in Seoul", description: "Like a dating-show finale, each person chooses where the story should end.", mission: "Each person secretly chooses a final spot, reveal together, then visit one choice." }),

  makeQuest({ id: 210, title: "Old-School Dabang Break", subtitle: "Drink coffee at Seoul's older pace", image: cafeImage, category: "Culture", difficulty: "Easy", time: "1 hr", distance: "0.4 km", location: "A long-running dabang in Seoul", description: "Step into a traditional coffee shop with its original atmosphere intact.", mission: "Order a classic drink and note three details that reveal the café's age." }),
  makeQuest({ id: 211, title: "Walk an Old Seoul Alley", subtitle: "Follow the city's smaller history", image: dongmyoImage, category: "Culture", difficulty: "Easy", time: "1 hr", distance: "1.2 km", location: "An older neighborhood alley in Seoul", description: "Notice doorways, signs, walls, and workshops left outside the trend cycle.", mission: "Walk an old alley slowly and photograph one disappearing architectural detail." }),
  makeQuest({ id: 212, title: "Try a Traditional Street Game", subtitle: "Play before screens took over", image: marketImage, category: "Culture", difficulty: "Easy", time: "30 min", distance: "0.3 km", location: "A park or cultural space in Seoul", description: "Learn a simple round of yut, jegichagi, or another traditional game.", mission: "Play one traditional Korean game and record your score or result." }),
  makeQuest({ id: 213, title: "Retro Film-Style Portrait", subtitle: "Capture Seoul like an old family album", image: dongmyoImage, category: "Culture", difficulty: "Easy", time: "30 min", distance: "0.3 km", location: "An old Seoul street", description: "Use pose, framing, and surroundings—not false location claims—to create a retro portrait.", mission: "Take one respectfully staged retro-style photo in an old neighborhood." }),
  makeQuest({ id: 220, title: "Old-Fashioned Market Snack", subtitle: "Taste the treat older Seoul remembers", image: marketImage, category: "Food", difficulty: "Easy", time: "30 min", distance: "0.3 km", location: "A traditional market in Seoul", description: "Look for hotteok, yakgwa, gangjeong, or another long-loved snack.", mission: "Ask a vendor for an old-fashioned favorite and try one serving." }),
  makeQuest({ id: 221, title: "Eat at a Seoul Nopo", subtitle: "Choose a restaurant that survived the trends", image: pojangmachaImage, category: "Food", difficulty: "Easy", time: "1 hr", distance: "0.5 km", location: "A long-running neighborhood restaurant in Seoul", description: "Visit a modest restaurant known for doing one thing well for many years.", mission: "Eat one signature dish at a long-running local restaurant and learn how long it has operated." }),
];
