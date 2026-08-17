export interface QuestDetailContent {
  about: string;
  tips: string[];
  budget: string;
  hours: string;
  howToGetThere: string;
  commonSigns?: { korean: string; meaning: string }[];
}

const fallback: QuestDetailContent = {
  about:
    "A taste of everyday Seoul life. Slow down, follow the flow of the neighborhood, and let the small moments become the memory.",
  tips: [
    "Go with cash and a T-money card — some smaller spots are cash-only.",
    "Greet with a small bow and a friendly '안녕하세요' (annyeonghaseyo).",
    "Avoid weekday lunch rush (12:00–13:00) if you want a calmer experience.",
  ],
  budget: "₩5,000 – ₩20,000 per person",
  hours: "Most spots: 10:00 – 22:00 daily",
  howToGetThere:
    "Take the Seoul Metro to the nearest station, then walk 5–10 minutes. Use Naver Map or Kakao Map (Google Maps walking directions are limited in Korea).",
  commonSigns: [
    { korean: "입구 / 출구", meaning: "Entrance / Exit" },
    { korean: "영업중", meaning: "Open for business" },
    { korean: "준비중", meaning: "Closed / Preparing" },
  ],
};

export const questDetails: Record<number, QuestDetailContent> = {
  0: {
    about:
      "Pojangmacha are orange-tented street bars where office workers unwind after work. Plastic stools, hissing grills, and somaek (soju + beer) define the vibe.",
    tips: [
      "Order at least one anju (drinking snack) per person — that's the etiquette.",
      "Pour drinks for others, never for yourself. Hold the bottle with two hands for elders.",
      "Soju is ~17%, beer ~5%. Somaek ratio: 3 parts beer to 1 part soju is a safe start.",
    ],
    budget: "₩15,000 – ₩30,000 per person",
    hours: "Most tents open 18:00 – 02:00, busiest after 21:00",
    howToGetThere:
      "Euljiro 3-ga Station (Line 2/3), Exit 4. Walk into the alleys behind the printing shops — follow the orange tents.",
    commonSigns: [
      { korean: "포장마차", meaning: "Pojangmacha (tent bar)" },
      { korean: "소주 / 맥주", meaning: "Soju / Beer" },
      { korean: "안주", meaning: "Anju (drinking snacks)" },
    ],
  },
  1: {
    about:
      "Korean convenience stores (CU, GS25, 7-Eleven, Emart24) are mini-restaurants. Hot water dispensers, microwaves, and seating areas let you build a full meal for under ₩5,000.",
    tips: [
      "Try Shin Ramyeon Black for richer broth, or Buldak for spice. Add a slice of cheese to tame the heat.",
      "Crack a raw egg into hot ramyeon and stir — it makes the broth silky.",
      "Pair with triangle kimbap (samgak gimbap) and banana milk for the full combo.",
    ],
    budget: "₩3,000 – ₩7,000",
    hours: "24 hours, every day",
    howToGetThere: "There's a convenience store on almost every block. Just look for CU, GS25, 7-Eleven, or Emart24 signs.",
    commonSigns: [
      { korean: "온수", meaning: "Hot water" },
      { korean: "전자레인지", meaning: "Microwave" },
      { korean: "시식대", meaning: "Eating counter" },
    ],
  },
  2: {
    about:
      "Dongmyo Flea Market is Seoul's most authentic vintage scene — racks of second-hand jackets, retro sneakers, and ₩1,000 finds spilling onto the sidewalk.",
    tips: [
      "Bring cash in small bills — most vendors don't take cards.",
      "Polite haggling is OK: ask '깎아 주세요' (kkakka juseyo — please give a discount).",
      "Go on weekends for the biggest selection; mornings are calmer.",
    ],
    budget: "₩5,000 – ₩20,000 for a full outfit",
    hours: "Daily 10:00 – 19:00 (weekends busiest)",
    howToGetThere: "Dongmyo Station (Line 1/6), Exit 3. The market stretches out from the shrine in both directions.",
    commonSigns: [
      { korean: "구제 / 빈티지", meaning: "Second-hand / Vintage" },
      { korean: "한 벌 / 한 장", meaning: "Per set / Per piece" },
      { korean: "할인", meaning: "Discount" },
    ],
  },
  3: {
    about:
      "Noraebang (singing rooms) are private karaoke booths. Coin noraebangs charge per song (~₩500) — perfect for solo or small groups.",
    tips: [
      "Bring a friend, or go solo — no judgment, that's the point.",
      "Tambourines and disco lights are free. Use them.",
      "Songs ending in a high note score bonus points on the rating screen.",
    ],
    budget: "₩500 per song, or ₩15,000/hr for a room",
    hours: "Most open 14:00 – 04:00, coin spots often 24h",
    howToGetThere: "Hongik Univ Station (Line 2), Exit 9. Coin noraebangs are stacked along the main Hongdae walking street.",
    commonSigns: [
      { korean: "노래방", meaning: "Noraebang (karaoke)" },
      { korean: "동전 노래방", meaning: "Coin karaoke" },
      { korean: "예약", meaning: "Reserve / Queue song" },
    ],
  },
  4: {
    about:
      "Tapgol Park is where Seoul's elders gather to play baduk (Go) and janggi (Korean chess). The clack of stones is the city's quiet heartbeat.",
    tips: [
      "Watch a game first. A respectful bow and '안녕하세요' goes far.",
      "Bring a small cold drink to share if you sit down to play.",
      "Speak softly — focus is sacred at the boards.",
    ],
    budget: "Free (₩2,000 if you buy drinks for your opponent)",
    hours: "Daily 09:00 – 18:00 (games happen mostly 10:00 – 16:00)",
    howToGetThere: "Jongno 3-ga Station (Line 1/3/5), Exit 1. The park is a 3-min walk.",
    commonSigns: [
      { korean: "바둑", meaning: "Baduk (Go)" },
      { korean: "장기", meaning: "Janggi (Korean chess)" },
      { korean: "어르신", meaning: "Elders / Respected seniors" },
    ],
  },
  5: {
    about:
      "Jjimjilbang are 24-hour Korean bathhouses with hot pools, sauna rooms, and a lounge stocked with banana milk and boiled eggs. A full Korean ritual.",
    tips: [
      "Strip fully in the bath area — swimsuits are not allowed. Everyone's chill about it.",
      "Try the cold plunge after a hot pool to feel reborn.",
      "Banana milk + sikhye after the bath is non-negotiable. Crack the egg on your friend's forehead (gently) — it's tradition.",
    ],
    budget: "₩10,000 – ₩18,000 entry, +₩2,000 for snacks",
    hours: "Most open 24 hours",
    howToGetThere: "Search 'jjimjilbang' on Naver Map for the nearest one. Dragon Hill Spa (Yongsan Station) is the famous tourist pick; neighborhood spots are cheaper and more local.",
    commonSigns: [
      { korean: "찜질방", meaning: "Jjimjilbang (sauna lounge)" },
      { korean: "남탕 / 여탕", meaning: "Men's bath / Women's bath" },
      { korean: "바나나우유", meaning: "Banana milk" },
    ],
  },
  6: {
    about:
      "Seoul's third-wave cafe scene hides in renovated hanok homes, rooftop attics, and industrial warehouses. Half the fun is finding the door.",
    tips: [
      "Order at the counter, then pick a seat. Tipping isn't a thing.",
      "Most cafes have an order-minimum per person (usually one drink).",
      "Try dalgona, einspänner, or sweet potato latte for something local.",
    ],
    budget: "₩6,000 – ₩9,000 per drink",
    hours: "Most cafes: 11:00 – 22:00",
    howToGetThere: "Ikseon-dong: Jongno 3-ga Station Exit 4. Seongsu: Seongsu Station (Line 2), Exit 3.",
    commonSigns: [
      { korean: "영업중 / 준비중", meaning: "Open / Preparing (closed)" },
      { korean: "포장", meaning: "Takeaway" },
      { korean: "1인 1음료", meaning: "1 drink per person required" },
    ],
  },
  7: {
    about:
      "Korean apartment complexes (아파트 단지) have manicured parks, walking paths, and play areas open to all. At night they glow with warm yellow lights — pure cozy.",
    tips: [
      "Stay on the walking paths; the playgrounds are for residents' kids.",
      "Look up — the lit windows in tall apartments are the real view.",
      "Bring earbuds and slow city pop for the perfect walking mood.",
    ],
    budget: "Free",
    hours: "Best from 20:00 – 23:00, fully open 24h",
    howToGetThere:
      "Any neighborhood with high-rise apartments — Mapo, Hapjeong, and Jamsil are great starting points. Enter through the main pedestrian gate.",
    commonSigns: [
      { korean: "단지 내", meaning: "Inside the complex" },
      { korean: "외부인 출입금지", meaning: "Residents only (some areas)" },
      { korean: "산책로", meaning: "Walking path" },
    ],
  },
  8: {
    about:
      "Picnicking at the Han River with convenience-store ramyeon, chicken, and beer is a real Seoul ritual. Bring a mat, find grass, watch the bridge change colors.",
    tips: [
      "Use the in-store ramyeon machine — it cooks a perfect bowl in 3 minutes.",
      "Order chicken delivery to a park bench: tell them the park name + nearest bridge.",
      "Banpo bridge has a rainbow fountain show 8pm & 9pm in summer.",
    ],
    budget: "₩10,000 – ₩20,000 per person",
    hours: "Parks open 24h; food deliveries usually 11:00 – 02:00",
    howToGetThere: "Yeouinaru Station (Line 5) for Yeouido Park, or Express Bus Terminal (Line 3/7/9) for Banpo Park.",
    commonSigns: [
      { korean: "라면 조리기", meaning: "Ramyeon cooker" },
      { korean: "한강 공원", meaning: "Han River Park" },
      { korean: "쓰레기통", meaning: "Trash bin" },
    ],
  },
  9: {
    about:
      "More than ramyeon — Korean convenience stores have entire meals, desserts, and limited-edition collabs. A local treasure hunt.",
    tips: [
      "Look for '1+1' or '2+1' tags — buy-one-get-one promos rotate weekly.",
      "Try the seasonal sandwich, the Yakult Light, and any new mochi.",
      "Use the self-pay kiosks to skip lines.",
    ],
    budget: "₩5,000 – ₩12,000",
    hours: "24 hours",
    howToGetThere: "Any street corner in Seoul. CU, GS25, 7-Eleven, Emart24.",
    commonSigns: [
      { korean: "1+1 / 2+1", meaning: "Buy 1 get 1 / Buy 2 get 1" },
      { korean: "신상품", meaning: "New product" },
      { korean: "한정판", meaning: "Limited edition" },
    ],
  },
  10: {
    about:
      "Bunsikjip (분식집) are tiny snack shops serving gimbap, tteokbokki, and ramyeon for under ₩5,000. The smell of sesame oil and gochujang = childhood for Koreans.",
    tips: [
      "Order chamchi (tuna) or cheese gimbap as your first try.",
      "Dip the gimbap in the tteokbokki sauce — locals do.",
      "Most spots are stand-and-eat counters; don't linger if there's a line.",
    ],
    budget: "₩3,000 – ₩8,000",
    hours: "10:00 – 21:00, often closed Sundays",
    howToGetThere: "Every residential neighborhood has one. Search '김밥' on Naver Map.",
    commonSigns: [
      { korean: "김밥", meaning: "Gimbap" },
      { korean: "떡볶이", meaning: "Tteokbokki (spicy rice cakes)" },
      { korean: "포장 가능", meaning: "Takeaway available" },
    ],
  },
  11: {
    about:
      "Hongdae after midnight is buskers, indie clubs, dance battles, and ₩2,000 toast trucks. It's the loudest, youngest, most unfiltered Seoul.",
    tips: [
      "Buskers start around 21:00 in front of the playground.",
      "Club entry is usually ₩10,000–20,000 and includes one drink.",
      "Last subway is 12:30am — after that, taxis or wait for the first train at 5:30.",
    ],
    budget: "₩20,000 – ₩50,000 per person",
    hours: "Peak 22:00 – 04:00",
    howToGetThere: "Hongik Univ Station (Line 2/AREX), Exit 9.",
    commonSigns: [
      { korean: "입장료", meaning: "Entry fee" },
      { korean: "19금", meaning: "19+ (adults only)" },
      { korean: "마지막 주문", meaning: "Last order" },
    ],
  },
  12: {
    about:
      "Traditional markets (시장) are alive with shouts, samples, and grandmothers slicing tteok. Mangwon for street food, Tongin for the lunch-box tour, Gyeongdong for herbs.",
    tips: [
      "Ask for a sample ('맛 좀 봐도 돼요?') — most ajummas will say yes.",
      "Bring small bills; carts and stalls rarely take cards.",
      "Tongin Market sells brass coins to use at food stalls as your lunchbox currency.",
    ],
    budget: "₩5,000 – ₩15,000",
    hours: "Most stalls: 09:00 – 20:00; food carts later",
    howToGetThere: "Mangwon: Mangwon Station Exit 2. Tongin: Gyeongbokgung Exit 2. Gyeongdong: Jegidong Station Exit 2.",
    commonSigns: [
      { korean: "시장", meaning: "Market" },
      { korean: "원", meaning: "KRW (Korean Won)" },
      { korean: "맛보기", meaning: "Sample / Taste" },
    ],
  },
  13: {
    about:
      "Every May, Jungnang's Rose Park bursts into a 5.45km tunnel of one million roses. Free entry, fireworks on weekends, and food trucks lining the river.",
    tips: [
      "Go at sunset — the golden light on the petals is unreal.",
      "Avoid Saturday afternoon crowds; Friday evening is the sweet spot.",
      "Bring water and a hat — the rose tunnel has little shade.",
    ],
    budget: "Free entry; ₩10,000 for snacks",
    hours: "Festival usually mid-May (10 days), 10:00 – 22:00",
    howToGetThere: "Junghwa Station (Line 7), Exit 1. Walk 10 min toward Jungnang Stream.",
    commonSigns: [
      { korean: "장미축제", meaning: "Rose Festival" },
      { korean: "입장 무료", meaning: "Free entry" },
      { korean: "포토존", meaning: "Photo spot" },
    ],
  },
  14: {
    about:
      "Banpo Hangang Park summer nights = the Moonlight Rainbow Fountain, cold beer, and Korea's biggest open-air picnic. Pure peak Seoul summer.",
    tips: [
      "Fountain shows: 20:00 & 21:00 (weekdays), extra 19:30 + 22:00 on weekends.",
      "Order chicken via 'Baemin' app to your bench — pick a landmark like '반포 무지개분수 앞'.",
      "Mosquito repellent is a real upgrade in July–August.",
    ],
    budget: "₩15,000 – ₩30,000",
    hours: "Summer evenings, best 19:00 – 23:00",
    howToGetThere: "Express Bus Terminal Station (Line 3/7/9), Exit 8-1. Walk 10 min toward the river.",
    commonSigns: [
      { korean: "무지개 분수", meaning: "Rainbow Fountain" },
      { korean: "공연 시간", meaning: "Show time" },
      { korean: "금연 구역", meaning: "No smoking area" },
    ],
  },
  15: {
    about:
      "Every November, Cheonggyecheon Stream lights up with hundreds of huge handcrafted lanterns floating over the water. Free, magical, and very crowded.",
    tips: [
      "Enter from Gwanghwamun and walk downstream — the crowd flows one direction.",
      "Weekdays after 20:30 are noticeably calmer.",
      "Wear warm layers — November nights in Seoul are sharp.",
    ],
    budget: "Free entry",
    hours: "Festival: early–mid November, 17:00 – 23:00 daily",
    howToGetThere: "Gwanghwamun Station (Line 5), Exit 5, or City Hall Station (Line 1/2), Exit 4.",
    commonSigns: [
      { korean: "등 축제", meaning: "Lantern Festival" },
      { korean: "일방통행", meaning: "One-way walk" },
      { korean: "관람 시간", meaning: "Viewing hours" },
    ],
  },
};

export function getQuestDetail(id: number): QuestDetailContent {
  return questDetails[id] ?? fallback;
}
