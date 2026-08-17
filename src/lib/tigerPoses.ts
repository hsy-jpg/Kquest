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

export interface FaceAnchor {
  /** Eye-line center, as a percentage of the image's height/width. */
  top: number;
  left: number;
  /** Ear-to-ear face width, as a percentage of the image width — scales hat/glasses to the head size in that pose. */
  width: number;
}

/**
 * Every pose is a distinct illustration (not a rigged character), so the
 * head sits in a different spot in each one. `items` is only ever passed
 * with pose="wave" (Tiger Wardrobe, ItemUnlock) or pose="face" (Profile
 * header), so those two are measured precisely against the actual eye
 * position; the rest are rough estimates kept for completeness.
 */
export const FACE_ANCHORS: Record<TigerPose, FaceAnchor> = {
  wave: { top: 27, left: 60, width: 46 },
  camera: { top: 24, left: 53, width: 50 },
  map: { top: 20, left: 50, width: 42 },
  backpack: { top: 14, left: 48, width: 38 },
  cup: { top: 23, left: 50, width: 44 },
  cheer: { top: 20, left: 50, width: 40 },
  face: { top: 62, left: 50, width: 65 },
};

export interface BodyAnchor {
  /** Torso center, as a percentage of the image's height/width — used to place outfit/backpack items. */
  top: number;
  left: number;
}

/** Only defined for poses that actually render body-slot items (outfit/backpack) today. */
export const BODY_ANCHORS: Partial<Record<TigerPose, BodyAnchor>> = {
  wave: { top: 58, left: 62 },
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
