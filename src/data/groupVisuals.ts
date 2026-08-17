import userSarah from "@/assets/user-sarah.jpg";
import userYuki from "@/assets/user-yuki.jpg";
import userTom from "@/assets/user-tom.jpg";
import userEmma from "@/assets/user-emma.jpg";
import userCarlos from "@/assets/user-carlos.jpg";
import questPojangmacha from "@/assets/quest-pojangmacha.jpg";
import questRamen from "@/assets/quest-ramen.jpg";
import questDongmyo from "@/assets/quest-dongmyo.jpg";
import questNoraebang from "@/assets/quest-noraebang.jpg";
import questInwangsan from "@/assets/quest-inwangsan.jpg";

export const GROUP_VISUALS: Record<string, { image: string; baseMembers: number; avatars: string[] }> = {
  "Seoul Foodies": { image: questPojangmacha, baseMembers: 48, avatars: [userSarah, userYuki, userEmma] },
  "K-Culture Crew": { image: questNoraebang, baseMembers: 35, avatars: [userTom, userCarlos, userSarah] },
  "Budget Explorers": { image: questDongmyo, baseMembers: 62, avatars: [userEmma, userYuki, userTom] },
  "Night Owls Seoul": { image: questRamen, baseMembers: 29, avatars: [userCarlos, userSarah, userYuki] },
  "Hiking & Nature": { image: questInwangsan, baseMembers: 41, avatars: [userTom, userEmma, userCarlos] },
};
