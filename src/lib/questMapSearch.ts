import type { Quest } from "@/data/quests";

const ROUTE_PROTOTYPE_MAP_SEARCH_TERMS: Record<number, string> = {
  100: "Seongsan Ilchulbong Jeju", 101: "Gimnyeong Beach Jeju", 102: "Jeju Mokgwana", 103: "Jeju local food restaurant",
  110: "Inwangsan trail entrance convenience store", 111: "Inwangsan hiking trail", 112: "Inwangsan summit", 113: "Inwangsan trail exit", 114: "Inwangsan pajeon makgeolli restaurant",
  120: "Seoul traditional market", 121: "Seoul subway station", 122: "Seoul affordable lunch restaurant", 123: "Seoul free public park", 124: "Seoul convenience store",
  130: "Sinchon university district", 131: "Sinchon bunsik restaurant", 132: "Sinchon self photo booth",
  140: "Seoul neighborhood street", 141: "Seoul traditional market", 142: "Seoul neighborhood restaurant", 143: "Seoul neighborhood cafe",
  150: "Seoul convenience store", 151: "Seoul convenience store", 152: "Seoul convenience store",
  160: "Seoul pajeon restaurant", 161: "Seoul manhwa cafe", 170: "Seoul sunset viewpoint", 171: "Seoul public park",
  180: "Seoul haejangguk restaurant", 181: "Seoul convenience store", 182: "Seoul neighborhood cafe",
  190: "Seoul subway station", 191: "Seoul subway station restaurant", 192: "Seoul subway station neighborhood",
  200: "Seoul public date spot", 210: "Seoul old dabang", 211: "Seoul old neighborhood alley", 212: "Seoul traditional games experience", 213: "Seoul retro street",
  220: "Seoul traditional market snack", 221: "Seoul old local restaurant nopo",
};

/**
 * Search terms used only when a mock/local Quest opens an external map.
 * The visible English Quest title stays unchanged, while the map receives a
 * real Korean place, neighborhood, or business-category query it can resolve.
 */
export const MOCK_QUEST_MAP_SEARCH_TERMS: Readonly<Record<number, string>> = {
  ...ROUTE_PROTOTYPE_MAP_SEARCH_TERMS,
  0: "을지로 포장마차",
  1: "서울 편의점",
  2: "동묘 벼룩시장",
  3: "홍대 노래방",
  4: "탑골공원",
  5: "서울 찜질방",
  6: "익선동 카페",
  7: "서울 근린공원",
  8: "여의도 한강공원",
  9: "서울 편의점",
  10: "서울 분식집",
  11: "홍대 걷고싶은거리",
  12: "망원시장",
  13: "중랑장미공원",
  14: "반포한강공원",
  15: "청계천",
  16: "한강 자전거길",
  17: "서울 미용실",
  18: "인왕산 등산로 입구",
  19: "연남동 독립서점",
  20: "서울 동네 빵집",
  21: "서울 근린공원 배드민턴장",
  22: "서울 떡볶이 분식집",
};

export const getMockQuestMapSearchQuery = (
  quest: Pick<Quest, "id" | "title" | "location">,
) => MOCK_QUEST_MAP_SEARCH_TERMS[quest.id] ?? `${quest.location} ${quest.title}`;

export const getMockQuestMapUrls = (
  quest: Pick<Quest, "id" | "title" | "location">,
) => {
  const encodedQuery = encodeURIComponent(getMockQuestMapSearchQuery(quest));

  return {
    google: `https://www.google.com/maps/search/?api=1&query=${encodedQuery}`,
    kakao: `https://map.kakao.com/?q=${encodedQuery}`,
  };
};
