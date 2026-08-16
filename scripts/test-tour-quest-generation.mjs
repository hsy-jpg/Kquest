#!/usr/bin/env node

/* Local-only Quest generation validation. No API, UI, DB, or file writes. */

import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const V = (id, signals, explore, photo, action) => ({ id, signals, explore, photo, action });
export const catalog = {
  MARKET_LOCAL_FOOD_HUNT_V1: [
    V("market-food-sign", /market|food/i, "Find a public sign that connects {{place}} with a local food or ingredient.", "Photograph a market sign or shared display at {{place}} without including faces.", "Record one food or ingredient you learned about without making a purchase."),
    V("market-color", /market|shopping/i, "Notice two colors or display styles in the public aisles of {{place}}.", "Photograph a public market detail without focusing on a single vendor.", "Choose one detail that makes this market feel connected to {{region}}."),
    V("market-wayfinding", /street|alley|market/i, "Follow the public market route and find one directional or area sign.", "Photograph the market entrance or a public wayfinding sign.", "Describe how the market is organized in one sentence."),
    V("market-safe-general", /.*/, "Find one public sign or shared-space detail that gives {{place}} its character.", "Photograph the entrance or a public-space detail; avoid faces and private transactions.", "Record one thing you noticed without buying anything."),
  ],
  LOCAL_DISH_OBSERVER_V1: [
    V("dish-region-name", /local|regional|traditional/i, "Find the name of a dish or ingredient connected to {{region}} on a public menu or sign.", "Photograph an exterior sign or a clearly permitted food display.", "Record one regional ingredient or preparation detail."),
    V("dish-menu-language", /food|cuisine|restaurant/i, "Find one dish name and notice how it is described in English or Korean.", "Photograph only a menu or sign where photography is permitted.", "Write down one new food word you learned."),
    V("dish-ingredient", /ingredient|specialty/i, "Look for one ingredient named on a public sign at {{place}}.", "Photograph an exterior ingredient or menu sign without including customers.", "Describe what you think the ingredient contributes to the dish."),
    V("dish-safe-general", /.*/, "Find one publicly visible food name associated with {{place}}.", "Use an exterior sign unless indoor photography is explicitly allowed.", "Record one detail; ordering or purchasing is not required."),
  ],
  NATURE_DETAIL_HUNT_V1: [
    V("nature-forest-texture", /forest|wood|NA01/i, "Stay on the path and find two textures around {{feature}}.", "Photograph one natural texture without collecting plants.", "Record one color, sound, or texture that defined your visit."),
    V("nature-season-color", /garden|forest|season/i, "Compare two naturally occurring colors visible at {{place}}.", "Photograph a seasonal detail from the public path.", "Choose the color that best represents the visit and explain why."),
    V("nature-sound", /forest|wetland|nature/i, "Pause at a permitted point and identify two non-human sounds.", "Photograph the landscape connected to one of the sounds.", "Describe how the sound changed your impression of {{place}}."),
    V("nature-safe-general", /.*/, "From the public path, find one small landscape detail and one wide view.", "Photograph a natural feature without leaving the path or approaching wildlife.", "Record one observation that could change in another season."),
  ],
  SAFE_VIEWPOINT_WALK_V1: [
    V("view-lake", /lake|water|NA03/i, "From a permitted viewpoint, observe how water and terrain meet at {{place}}.", "Photograph the view only from a marked public path or viewpoint.", "Record one change in color, weather, or terrain."),
    V("view-coast", /cliff|coast|sea|NA02/i, "From a safe public viewpoint, find one visible layer or shape in {{feature}}.", "Photograph the coastal view without approaching edges.", "Describe how rock and water shape the landscape."),
    V("view-elevation", /mountain|peak|oreum/i, "At an approved checkpoint, compare one near feature with one distant feature.", "Photograph the view without blocking the path or crossing barriers.", "Record how the view changes with elevation."),
    V("view-safe-general", /.*/, "Use only a marked public viewpoint and identify one prominent landscape shape.", "Photograph from behind barriers or within the marked viewing area.", "Describe the safest feature that helped you observe the landscape."),
  ],
  HERITAGE_CLUE_HUNT_V1: [
    V("heritage-pattern", /pattern|temple|palace/i, "Find one public architectural pattern or material at {{place}}.", "Photograph an exterior detail only where photography is permitted.", "Record what the pattern or material suggests about the site."),
    V("heritage-date", /history|memorial|historic/i, "Find one date or historical name on a public information panel.", "Photograph the panel or exterior marker without touching artifacts.", "Connect the date or name to the place in one sentence."),
    V("heritage-route", /fortress|wall|village/i, "Follow the public route and find one feature that shows how the site was used.", "Photograph a route marker or exterior structure from the visitor path.", "Describe how the route shapes your understanding of the site."),
    V("heritage-safe-general", /.*/, "Find one public clue about the past at {{place}}.", "Photograph an exterior sign or structure; avoid rituals and restricted areas.", "Record one question the clue made you ask."),
  ],
  CULTURE_ONE_OBJECT_V1: [
    V("culture-artwork", /museum|art|gallery|VE0706/i, "Choose one artwork, exhibition theme, or architectural detail at {{place}}.", "Unless indoor photography is explicitly allowed, photograph only the entrance or exterior.", "Explain in one sentence why you chose that detail."),
    V("culture-building", /center|cinema|architecture/i, "Find one feature showing how the building supports culture or art.", "Photograph an exterior architectural feature or entrance sign.", "Record how the building affects your expectation of what is inside."),
    V("culture-topic", /exhibition|history|media/i, "Find one public exhibition title or topic that interests you.", "Photograph a public information panel only where permitted.", "Write one question you would ask about the topic."),
    V("culture-safe-general", /.*/, "Find one public sign, theme, or exterior detail that represents {{place}}.", "Use the exterior or entrance sign unless photography rules are confirmed.", "Record one cultural detail you would tell a friend about."),
  ],
  STREET_DETAIL_HUNT_V1: [
    V("street-stairs", /stairs|step/i, "Notice how one public detail changes as you move along the steps at {{place}}.", "Photograph a street detail while avoiding residents, windows, and vehicle plates.", "Record how the steps connect different parts of the neighborhood."),
    V("street-history", /theme street|culture street|historic/i, "Find one marker or building detail that suggests the areas past.", "Photograph a public marker without including residents or private interiors.", "Describe one place where old and new elements appear together."),
    V("street-reuse", /ground|regeneration|reused/i, "Find one reused structure, public design, or gathering space at {{place}}.", "Photograph a public design feature while respecting nearby businesses and residents.", "Record how the space differs from an ordinary commercial complex."),
    V("street-safe-general", /.*/, "Find one sign, facade, or public-space detail that gives {{place}} its character.", "Photograph only public-facing details and avoid recognizable faces.", "Describe what this detail reveals about the neighborhood."),
  ],
  FESTIVAL_SCENE_HUNT_V1: [
    V("festival-market", /market|food/i, "Find an official sign connecting {{place}} with a market, food, or ingredient.", "Photograph an official sign or decoration without capturing recognizable faces.", "Record one market or food detail without making a purchase."),
    V("festival-music", /rock|music|stage/i, "Find an official stage sign, emblem, or music-themed decoration at {{place}}.", "Photograph a stage exterior or official emblem without capturing the audience.", "Record one visual detail that connects the festival to {{region}}."),
    V("festival-visual-story", /comic|art|character/i, "Find an official character, artwork, panel, or emblem in the public event area.", "Photograph official event art without capturing recognizable faces.", "Describe one visual storytelling detail that caught your attention."),
    V("festival-theme", /.*/, "Find one official exhibit sign, emblem, or public decoration representing the event theme.", "Photograph an official sign or public decoration without capturing faces.", "Record which event theme you would explore further."),
  ],
  FESTIVAL_TRADITION_TRACE_V1: [
    V("tradition-mask", /mask|dance/i, "Find one mask, dance pose, costume, or official symbol at {{place}}.", "Photograph an official symbol or stage exterior without capturing performers faces.", "Record how one visual detail communicates the tradition."),
    V("tradition-instrument", /pungmul|music|instrument/i, "Look for one traditional instrument, rhythm symbol, or costume detail.", "Photograph an official decoration or instrument display where permitted.", "Describe how sound or movement represents the local tradition."),
    V("tradition-performance", /namsadang|performance/i, "Find one public clue about the performers role, costume, or movement.", "Photograph an official festival marker without interrupting the performance.", "Choose one performance detail and explain why it stood out."),
    V("tradition-safe-general", /.*/, "Find one costume, pattern, instrument, or performance symbol in the public festival area.", "Photograph an official symbol or decoration without capturing recognizable faces.", "Record one detail that best represents the tradition."),
  ],
  CRAFT_PROCESS_SPOTTER_V1: [
    V("craft-material", /craft|material|EX02/i, "Find one publicly visible material, tool, or finished object at {{place}}.", "Photograph an exterior sign or clearly permitted display.", "Record what the material might be used to make."),
    V("craft-process", /workshop|process|studio/i, "Find one public clue showing a stage of a creative process.", "Photograph only a permitted process sign or exterior display.", "Describe the process step in your own words."),
    V("craft-pattern", /art|design|pattern/i, "Compare two visible patterns, shapes, or finishes at {{place}}.", "Photograph one permitted design detail without including staff or customers.", "Choose the detail that feels most distinctive and explain why."),
    V("craft-safe-general", /.*/, "From a public area, find one sign or object suggesting how something is made.", "Use an exterior sign unless indoor photography is explicitly allowed.", "Record one material or process you noticed; participation is not required."),
  ],
  GENERIC_LANDMARK_HUNT_V1: [
    V("generic-name-sign", /sign|landmark/i, "Find the official place-name sign at {{place}}.", "Photograph the exterior sign without including recognizable faces.", "Record one detail that helps identify the place."),
    V("generic-exterior", /building|facility/i, "Find one distinctive exterior feature at {{place}}.", "Photograph only a public-facing exterior detail.", "Describe how that feature affects the places character."),
    V("generic-region", /local|region/i, "Find one public detail connecting {{place}} to {{region}}.", "Photograph a public sign or exterior detail.", "Explain the regional connection using only what you observed."),
    V("generic-safe-general", /.*/, "Find one public sign or exterior detail at {{place}}.", "Photograph only from a public area and avoid recognizable faces.", "Record one observation without assuming facts not shown on site."),
  ],
};

const samples = [
  ["3544280","100 Years Market 100 Years Night","Seoul","85","EV010600","A02070200","FESTIVAL","FESTIVAL_SCENE_HUNT_V1",["LOCAL_MARKET","LOCAL_FOOD"]],
  ["268104","ARKO Art Center","Seoul","78","VE070600","A02060500","CULTURE","CULTURE_ONE_OBJECT_V1",["CULTURE_FACILITY"]],
  ["3544517","ARTEASPOON","Seoul","76","EX020400","A02030400","CRAFT_EXPERIENCE","CRAFT_PROCESS_SPOTTER_V1",["LOCAL_EXPERIENCE"]],
  ["2401023","168 Stairs","Busan","76","EX070200","A02030400","NEIGHBORHOOD","STREET_DETAIL_HUNT_V1",["LOCAL_STREET"]],
  ["1000428","40-step Culture & Tourism Theme Street","Busan","76","VE040100","A02030600","NEIGHBORHOOD","STREET_DETAIL_HUNT_V1",["LOCAL_STREET"]],
  ["2947858","Ahopsan Forest","Busan","76","NA010200","A01010400","NATURE","NATURE_DETAIL_HUNT_V1",["FOREST"]],
  ["3516784","B-Con Ground","Busan","76","VE120300","A02030400","NEIGHBORHOOD","STREET_DETAIL_HUNT_V1",["LOCAL_STREET"]],
  ["2949079","Arario Museum Tapdong Cinema","Jeju","78","VE070600","A02060500","CULTURE","CULTURE_ONE_OBJECT_V1",["MUSEUM"]],
  ["2949520","Arte Museum Jeju","Jeju","78","VE070600","A02060500","CULTURE","CULTURE_ONE_OBJECT_V1",["MUSEUM","DIGITAL_ART"]],
  ["264591","Baengnokdam Lake","Jeju","76","NA030500","A01010500","NATURE","SAFE_VIEWPOINT_WALK_V1",["LAKE","MOUNTAIN"]],
  ["3418415","Baksugijeong Cliffs","Jeju","76","NA020800","A01011100","NATURE","SAFE_VIEWPOINT_WALK_V1",["COAST","CLIFF"]],
  ["697123","Andong Maskdance Festival","Gyeongbuk","85","EV010100","","FESTIVAL","FESTIVAL_TRADITION_TRACE_V1",["TRADITION","PERFORMANCE"]],
  ["697439","Anseong Namsadang Baudeogi Festival","Gyeonggi","85","EV010100","","FESTIVAL","FESTIVAL_TRADITION_TRACE_V1",["TRADITION","PERFORMANCE"]],
  ["293144","Bucheon International Comics Festival","Gyeonggi","85","EV010100","","FESTIVAL","FESTIVAL_SCENE_HUNT_V1",["COMICS","CULTURE"]],
  ["1273884","Bupyeong Pungmul Festival","Incheon","85","EV010100","","FESTIVAL","FESTIVAL_TRADITION_TRACE_V1",["TRADITION","MUSIC"]],
  ["293091","Busan International Rock Festival","Busan","85","EV010100","","FESTIVAL","FESTIVAL_SCENE_HUNT_V1",["MUSIC","PERFORMANCE"]],
  ["4020637","Cheonan K-Culture Expo","Chungnam","85","EV030200","","FESTIVAL","FESTIVAL_SCENE_HUNT_V1",["CULTURE_EXPO"]],
].map(([contentid,title,region,contenttypeid,lclsSystm3,cat3,questType,templateId,secondaryTags]) => ({contentid,title,region,contenttypeid,lclsSystm3,cat3,questType,templateId,secondaryTags,overview:null,detail:null,eventstartdate:null,eventenddate:null,venue:null}));

const hash = text => [...text].reduce((n,c) => ((n * 31) + c.charCodeAt(0)) >>> 0, 7);
export const fill = (text, slots) => text.replaceAll("{{place}}",slots.place).replaceAll("{{region}}",slots.region).replaceAll("{{feature}}",slots.feature);
export function grounding(item) {
  const signal = [item.lclsSystm3,item.cat3,item.title,item.overview,item.detail,...item.secondaryTags].filter(Boolean).join(" ");
  const feature = /forest/i.test(signal) ? "the forest" : /lake/i.test(signal) ? "the lake and surrounding terrain" : /cliff|coast/i.test(signal) ? "the coastal cliffs" : /stairs|step/i.test(signal) ? "the public steps" : /market/i.test(signal) ? "the market area" : item.title;
  return { signal, slots:{place:item.title,region:item.region,feature}, groundingFields:item.overview||item.detail?["title","lclsSystm3","cat3",item.overview?"overview":"detail"]:["title","lclsSystm3","cat3"] };
}
export function selectVariant(item, recentVariantIds) {
  const variants = catalog[item.templateId];
  const g = grounding(item);
  const scored = variants.map((v,index) => {
    const isGeneral = v.id.includes("safe-general") || v.id === "festival-theme";
    const semanticMatch = !isGeneral && v.signals.test(g.signal);
    return {v,index,semanticMatch,isGeneral,score:semanticMatch?100:isGeneral?1:0};
  }).sort((a,b)=>b.score-a.score || ((hash(item.contentid+a.v.id)%997)-(hash(item.contentid+b.v.id)%997)));
  const fresh = scored.find(x => !recentVariantIds.includes(`${item.templateId}:${x.v.id}`));
  const selected = fresh || scored[0];
  return {...selected,g};
}
function blockers(item) {
  const result=[];
  if(item.title==="B-Con Ground") result.push("PLACE_IDENTITY_NOT_CONFIRMED");
  if(item.title==="ARTEASPOON") result.push("PROGRAM_AVAILABILITY_UNKNOWN");
  if(item.title==="Baengnokdam Lake") result.push("ROUTE_DIFFICULTY_ENTRY_WEATHER_NOT_VERIFIED");
  if(item.questType==="FESTIVAL") {
    if(!item.eventstartdate) result.push("EVENT_START_MISSING");
    if(!item.eventenddate) result.push("EVENT_END_MISSING");
    if(!item.venue) result.push("VENUE_MISSING");
  }
  return result;
}

function runLocalTest() {
const recent=[];
const generated=samples.map(item=>{
  const s=selectVariant(item,recent);
  const selectedVariantId=`${item.templateId}:${s.v.id}`;
  recent.unshift(selectedVariantId); if(recent.length>20) recent.pop();
  const publishBlockingReasons=blockers(item);
  const questTitle = s.g.slots.feature === item.title ? `Discover ${item.title}` : `Explore ${s.g.slots.feature} at ${item.title}`;
  return {title:item.title,questType:item.questType,templateId:item.templateId,selectedVariantId,variantSelectionReasons:[`lcls:${item.lclsSystm3}`,`cat3:${item.cat3||"missing"}`,s.semanticMatch?"semantic-signal-match":"safe-general-fallback",recent.slice(1).includes(selectedVariantId)?"recent-repeat-unavoidable":"not-recently-used"],questTitle,explore:fill(s.v.explore,s.g.slots),photo:fill(s.v.photo,s.g.slots),action:fill(s.v.action,s.g.slots),groundingFields:s.g.groundingFields,generationStatus:publishBlockingReasons.length?"DRAFT_REVIEW_REQUIRED":"READY_TO_PUBLISH",publishBlockingReasons};
});
const steps=generated.flatMap(q=>[q.explore,q.photo,q.action]);
const duplicateCount=steps.filter((s,i)=>steps.indexOf(s)!==i).length;
const repeatedVariantCount=generated.filter((q,i,a)=>a.findIndex(x=>x.selectedVariantId===q.selectedVariantId)!==i).length;
const summary={sampleCount:generated.length,exactDuplicateStepCount:duplicateCount,totalStepCount:steps.length,duplicatePhraseRate:`${(duplicateCount/steps.length*100).toFixed(1)}%`,repeatedVariantCount,variantReuseRate:`${(repeatedVariantCount/generated.length*100).toFixed(1)}%`,readyToPublish:generated.filter(q=>q.generationStatus==="READY_TO_PUBLISH").length,review:generated.filter(q=>q.generationStatus!=="READY_TO_PUBLISH").length,genericFallback:generated.filter(q=>q.templateId==="GENERIC_LANDMARK_HUNT_V1").length};
console.log(JSON.stringify({summary,quests:generated},null,2));
}

const isDirectRun = process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;
if (isDirectRun) runLocalTest();
