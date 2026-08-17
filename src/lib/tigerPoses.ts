import tigerWave from "@/assets/tiger-mascot.png"; // full-body waving
import tigerCamera from "@/assets/tiger-camera.png";
import tigerMap from "@/assets/tiger-map.png";
import tigerBackpack from "@/assets/tiger-backpack.png";
import tigerCup from "@/assets/tiger-cup.png";
import tigerCheer from "@/assets/tiger-cheer.png";
import tigerFace from "@/assets/tiger-face.png";

export type TigerPose =
  | "wave"
  | "camera"
  | "map"
  | "backpack"
  | "cup"
  | "cheer"
  | "face";

export const tigerPoseSrc: Record<TigerPose, string> = {
  wave: tigerWave,
  camera: tigerCamera,
  map: tigerMap,
  backpack: tigerBackpack,
  cup: tigerCup,
  cheer: tigerCheer,
  face: tigerFace,
};

/**
 * Pick the best tiger pose for a given quest based on its category and title.
 */
export function poseForQuest(quest: { category?: string; title?: string }): TigerPose {
  const title = (quest.title ?? "").toLowerCase();
  if (/bathhouse|banana milk|jjimjilbang/.test(title)) return "cup";
  if (/han river|picnic|bike/.test(title)) return "backpack";
  if (/hik|inwangsan|mountain|namsan/.test(title)) return "backpack";
  if (/baduk|book|read/.test(title)) return "map";
  if (/photo|camera/.test(title)) return "camera";
  if (/cafe|coffee|tea|ramen|gimbap|tteokbokki|bakery|food|market|snack/.test(title))
    return "cup";

  switch (quest.category) {
    case "Food":
      return "cup";
    case "Nature":
      return "backpack";
    case "Culture":
      return "map";
    case "Nightlife":
      return "cheer";
    case "Festival":
      return "cheer";
    default:
      return "wave";
  }
}
