import tierConfig from "../config/voice-sample-tiers.json";

export type ReadingStyle = "neutral" | "question" | "exclaim" | "sustained" | "soft";

export interface ReadingSegment {
  id: string;
  text: string;
  style: ReadingStyle;
  direction: string;
}

// Core script: the "standard" tier on its own, ~5 minutes at a slow,
// storytelling pace (~100-110 wpm, slower than normal conversational speech
// because part of this is meant to be read softly). Each segment is a natural
// pause point — the recording UI should capture one segment per take, so each
// becomes a clean dataset/<rvc_name>/split_i.wav with no mid-word cuts (see
// lalaby-build-blueprint.md §7/§13).
export const coreSegments: ReadingSegment[] = [
  {
    id: "intro",
    text:
      "Hello. My voice is being recorded so that a lullaby can learn to sound like me. " +
      "I am speaking normally, at a relaxed and steady pace, in a quiet room, sitting close to the microphone. " +
      "The quick brown fox jumps over the lazy dog, and a jovial swordsman quickly extracted his prize from the old wooden chest. " +
      "A dozen equally exquisite jazz musicians played their zithers with great feeling.",
    style: "neutral",
    direction: "Read at a normal, relaxed pace. Sit close to the microphone.",
  },
  {
    id: "phonetic-1",
    text:
      "Peter picked a peck of pickled peppers, and a peck of pickled peppers Peter picked. " +
      "Six thick thistle sticks lay near the shore, gathered by a shepherd with a crooked staff. " +
      "The bright blue butterfly drifted past the tall oak trees, and a gentle breeze carried the scent of fresh rain across the meadow. " +
      "Grey squirrels scampered up the twisted branches while a distant church bell rang twelve slow, heavy chimes.",
    style: "neutral",
    direction: "Keep the same relaxed pace as the opening segment.",
  },
  {
    id: "questions",
    text:
      "Did you hear the wind moving through the trees tonight? Where did the little bird go when the storm began? " +
      "Isn't it strange how quiet the house gets after midnight? Could you ever forget the sound of the ocean on a calm morning? " +
      "Why does the rain always sound louder once the lights go out? Have you ever tried counting every star in the sky above you?",
    style: "question",
    direction: "Let your pitch rise naturally at the end of each question, as you would in real conversation.",
  },
  {
    id: "exclaim",
    text:
      "Oh, look how high that kite is flying! What a beautiful sunset that was over the hills! " +
      "I can't believe how fast the puppy ran across the yard this morning! That thunder was so loud it rattled the windows! " +
      "Wow, the fireworks lit up the whole sky at once!",
    style: "exclaim",
    direction: "React with genuine energy — a little louder and brighter than your normal speaking voice, not shouting.",
  },
  {
    id: "sustained",
    text:
      "The moon glooows. The sea flooows. The wind bloooows, and we go hooome. " +
      "Alooone, alooone, we drift so slooowly, slooowly, slooowly on. " +
      "Deeeep in the vaaalley, the river runs quiiiet and slooow.",
    style: "sustained",
    direction:
      "Hold every stretched vowel a good deal longer than feels natural — almost like humming through the word — before moving to the next one.",
  },
  {
    id: "transition",
    text:
      "Now I'll read the rest slowly and softly, the way I would to settle a child to sleep. " +
      "Take a slow breath, and let your voice drop, just a little, from here on.",
    style: "neutral",
    direction: "Pause for a breath after this line, then drop your volume and pace for everything that follows.",
  },
  {
    id: "soft-1",
    text:
      "Hush now. The stars are coming out one by one, quiet as falling snow over a sleeping field. " +
      "The moon climbs slowly over the hill, watching over the whole sleeping town below, patient and unhurried. " +
      "Somewhere far off, a soft wind hums low through the trees, carrying the last of the day gently away. " +
      "The house creaks once, settles, and falls still, the way old houses do at the end of a long, warm day.",
    style: "soft",
    direction: "Speak softly and slowly, close to a whisper but still voiced — the way you'd read a bedtime story.",
  },
  {
    id: "soft-2",
    text:
      "Close your eyes now, little one. The night is warm, and the whole world can wait quietly until morning. " +
      "Everything is safe, everything is still, and there is nowhere else that you need to be tonight. " +
      "Sleep is coming, gentle and slow, like a tide drawing softly, softly to the shore, and pulling away again. " +
      "Rest your head, let your shoulders soften, and let the day drift quietly out of reach.",
    style: "soft",
    direction: "Even slower and quieter than the previous segment. Let the ends of sentences trail off gently.",
  },
  {
    id: "closing",
    text:
      "Goodnight, moon. Goodnight, stars, wherever you are tonight. Sleep well, and dream soft, slow dreams until morning comes.",
    style: "soft",
    direction:
      "Read this as gently as you can, almost sung. If it feels natural, hum a few soft notes after the last line.",
  },
];

// Continuation appended for the "extended" tier, taking the script from ~5 to
// ~10 minutes. Same style distribution as the core script, but different
// content, so the combined script keeps full phonetic/pitch/dynamic coverage
// instead of just repeating the first half.
//
// These segments are additive by design: a user who recorded the standard tier
// keeps every clip they already made and only records these to upgrade — the
// core segments are never re-recorded (lalaby-build-blueprint.md §13 Q2).
export const extensionSegments: ReadingSegment[] = [
  {
    id: "phonetic-2",
    text:
      "A crowd of jazzy vixens quickly waltzed through the foggy market square, laughing at some private joke. " +
      "Twelve strong horses pulled the heavy wooden cart up the steep, winding road toward the old stone bridge. " +
      "A curious fox paused at the edge of the garden, sniffed the cold night air, and vanished silently between the hedges. " +
      "The blacksmith's hammer struck again and again, a steady rhythm echoing across the quiet village square.",
    style: "neutral",
    direction: "Same relaxed pace as the opening segments.",
  },
  {
    id: "questions-2",
    text:
      "What would it feel like to walk on top of the clouds for just one afternoon? " +
      "Do you remember the first time you saw snow falling outside your window? " +
      "Why do the crickets always seem to grow louder the later the night gets? " +
      "Could a single candle really light up an entire room on its own?",
    style: "question",
    direction: "Natural rising pitch on each question, same as the earlier question segment.",
  },
  {
    id: "exclaim-2",
    text:
      "I've never seen so many fireflies gathered in one single field before! " +
      "What a wonderful, wild afternoon that turned out to be, start to finish! " +
      "Look, the whole valley is glowing gold in the last of the sunlight! " +
      "That was the loudest, happiest laugh I've heard all summer!",
    style: "exclaim",
    direction: "Bright and energetic, same as the earlier exclamation segment.",
  },
  {
    id: "sustained-2",
    text:
      "Rooom by rooom, the old house grows quiiiet. Weee go hooome, sloooly, sloooly, on and on. " +
      "Faaar and wiiide, the fields lie stiiill beneath a paaale, roound moon.",
    style: "sustained",
    direction: "Hold each stretched vowel a beat longer than feels natural, exactly like the earlier sustained segment.",
  },
  {
    id: "soft-3",
    text:
      "The candle flickers low beside the window, and the whole house settles slowly into silence. " +
      "Outside, the garden sleeps beneath a soft blanket of grey mist, waiting patiently for the sun to rise again. " +
      "A last, warm breath of wind moves once through the curtains, and then everything is still. " +
      "Rest now — there is nowhere else you need to be, and nothing left to do but sleep.",
    style: "soft",
    direction: "Same soft, unhurried bedtime delivery as the earlier soft segments.",
  },
  {
    id: "soft-4",
    text:
      "Far away, the tide moves slowly in and out, patient as it has always been, night after quiet night. " +
      "Somewhere above the clouds, the same old stars are keeping watch the way they always have. " +
      "You don't need to hold onto today any longer; let it go, soft and slow, like a boat drifting from the shore. " +
      "Tomorrow will still be there in the morning, warm and waiting, whenever you're ready for it.",
    style: "soft",
    direction: "Slow and hushed, the quietest delivery in the whole script — almost a whisper by the final line.",
  },
];

// ---------------------------------------------------------------- tiers

export type SampleTierId = keyof typeof tierConfig.tiers;

export interface SampleTier {
  id: SampleTierId;
  /** User-facing name, e.g. "Standard". */
  label: string;
  /** Approximate length of the script for this tier, in minutes. */
  targetMinutes: number;
  /** Worker rejects/warns below this much recorded audio (see rvc_pipeline.py). */
  minSeconds: number;
  /** Whether extensionSegments are part of this tier's script. */
  includesExtension: boolean;
  blurb: string;
}

/**
 * Every selectable sample length, keyed by id. Values come from
 * config/voice-sample-tiers.json so the worker validates against exactly the
 * same numbers this UI asks the user for.
 */
export const SAMPLE_TIERS: Record<SampleTierId, SampleTier> = Object.fromEntries(
  Object.entries(tierConfig.tiers).map(([id, tier]) => [id, { id: id as SampleTierId, ...tier }]),
) as Record<SampleTierId, SampleTier>;

/** Pre-selected in the recording UI when the user expresses no preference. */
export const DEFAULT_SAMPLE_TIER = tierConfig.defaultTier as SampleTierId;

/** Tiers in ascending length order, for rendering the picker. */
export const SAMPLE_TIER_LIST: SampleTier[] = Object.values(SAMPLE_TIERS).sort(
  (a, b) => a.targetMinutes - b.targetMinutes,
);

export function isSampleTierId(value: string): value is SampleTierId {
  return value in SAMPLE_TIERS;
}

/** The script the user reads for a given tier. */
export function getReadingScript(tier: SampleTierId = DEFAULT_SAMPLE_TIER): ReadingSegment[] {
  return SAMPLE_TIERS[tier].includesExtension
    ? [...coreSegments, ...extensionSegments]
    : coreSegments;
}

/**
 * The segments a user must still record to move from `from` to `to`, given the
 * clips they already have. Upgrading standard -> extended returns only the
 * extension segments; nothing already recorded is re-recorded.
 */
export function getUpgradeSegments(from: SampleTierId, to: SampleTierId): ReadingSegment[] {
  const already = new Set(getReadingScript(from).map((s) => s.id));
  return getReadingScript(to).filter((s) => !already.has(s.id));
}
