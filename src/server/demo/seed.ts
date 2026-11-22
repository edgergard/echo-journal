import "server-only";

import type { Entry, Mood, Reflection } from "@/contracts/journal";
import { DEMO_USER_ID } from "@/contracts/session";

/** The demo persona: someone moving to a new city for a new job. */
const ENTRIES: { daysAgo: number; mood: Mood; text: string }[] = [
  {
    daysAgo: 0,
    mood: "okay",
    text: "Finally finished the move. The new flat is quiet in a way I’m not used to yet; I keep listening for the neighbours’ radio. Unpacked the kitchen first, the way Mum always did. Tomorrow: curtains, and maybe calling Dad.",
  },
  {
    daysAgo: 1,
    mood: "low",
    text: "Didn’t sleep much again. Spent the evening packing books and found the letters from my grandmother. Read one standing in the hallway and had to sit down.",
  },
  {
    daysAgo: 3,
    mood: "good",
    text: "Long walk along the river after work. Called Marta, first time in weeks. We laughed about the camping trip and she promised to visit once I’m settled.",
  },
  {
    daysAgo: 5,
    mood: "rough",
    text: "Argued with Dad about the move. I said things I didn’t mean. Need to call him tomorrow.",
  },
  {
    daysAgo: 7,
    mood: "great",
    text: "Got the offer. Sat in the car for ten minutes before telling anyone.",
  },
  {
    daysAgo: 9,
    mood: "okay",
    text: "Quiet day. Read on the balcony until it got too cold.",
  },
  {
    daysAgo: 11,
    mood: "good",
    text: "Cooked for the whole floor. Burnt the rice, nobody minded.",
  },
  {
    daysAgo: 13,
    mood: "low",
    text: "Rain all day. Couldn’t focus on the applications.",
  },
  {
    daysAgo: 15,
    mood: "okay",
    text: "Second interview went fine, I think. Hard to tell over video.",
  },
  {
    daysAgo: 17,
    mood: "good",
    text: "First cold morning. Bought the good coffee.",
  },
  {
    daysAgo: 18,
    mood: "low",
    text: "Couldn’t sleep. Kept thinking about whether I’m ready to leave the city.",
  },
  {
    daysAgo: 19,
    mood: "okay",
    text: "Packed the first box. It was mostly cables I don’t need.",
  },
  {
    daysAgo: 20,
    mood: "good",
    text: "Lunch with Dad. He asked about the job three times; I think he’s proud and worried at once.",
  },
  {
    daysAgo: 22,
    mood: "rough",
    text: "Rejected from the studio job. Spent the evening on the couch.",
  },
  {
    daysAgo: 23,
    mood: "okay",
    text: "Long run in the morning. Legs heavy, head clearer.",
  },
  {
    daysAgo: 24,
    mood: "good",
    text: "Marta sent photos from the camping trip last summer. Forgot how happy I looked.",
  },
  {
    daysAgo: 26,
    mood: "low",
    text: "Grandma’s birthday would have been today.",
  },
  {
    daysAgo: 27,
    mood: "okay",
    text: "Started reading the letters Grandma left. Only managed two.",
  },
  {
    daysAgo: 28,
    mood: "good",
    text: "Sketched for an hour without checking my phone.",
  },
  {
    daysAgo: 30,
    mood: "okay",
    text: "New notebook. Trying to write a few lines every day.",
  },
];

/** Hand-written replies for the newest entries: index → reply + recalled. */
const REPLIES: Record<
  number,
  { text: string; recalled: { index: number; quote: string }[] }
> = {
  0: {
    text: "A quiet flat after a loud month is worth noticing. Last Sunday you wrote about arguing with your dad over this move — have you two talked since? And the letters you found on Thursday: it sounds like this move is carrying more than boxes. What would make the new place feel like yours this week?",
    recalled: [
      { index: 3, quote: "I said things I didn’t mean." },
      { index: 1, quote: "found the letters from my grandmother" },
    ],
  },
  1: {
    text: "Finding the letters in the middle of packing sounds like it stopped time for a moment. A month ago you could only manage two of them, around what would have been her birthday. Maybe they don’t need to be read all at once — what would it be like to keep one somewhere you’ll see it in the new flat?",
    recalled: [
      { index: 17, quote: "Only managed two." },
      { index: 16, quote: "Grandma’s birthday would have been today." },
    ],
  },
  2: {
    text: "Laughing with Marta again — that comes through even in a few lines. The last time she came up, it was her photos reminding you how happy you looked. Who else made last year feel like that, and could you reach out to one of them this week?",
    recalled: [{ index: 15, quote: "Forgot how happy I looked." }],
  },
  3: {
    text: "Saying things you didn’t mean usually means a lot was already in the room. A few weeks ago you noticed your dad seemed proud and worried at once. Could the argument be the worried half talking? What would you want him to hear first when you call?",
    recalled: [{ index: 12, quote: "I think he’s proud and worried at once." }],
  },
  4: {
    text: "Ten minutes in the car before telling anyone — that’s a moment worth keeping for yourself. Not long ago a rejection sent you to the couch for the evening; this is the other side of that same effort. What do you want to remember about how this felt?",
    recalled: [{ index: 13, quote: "Rejected from the studio job." }],
  },
};

const SHORT_REPLY =
  "Thanks for writing this down. Small days count too — what stood out most, even a little?";

const DAY_MS = 86_400_000;

function entryId(index: number) {
  return `demo-e${String(index + 1).padStart(2, "0")}`;
}

export interface DemoSeed {
  entries: Entry[];
  reflections: Reflection[];
}

/** Builds the demo persona's data relative to `now` (newest entry ~1h ago). */
export function buildDemoSeed(now: Date = new Date()): DemoSeed {
  const entries: Entry[] = ENTRIES.map((e, index) => {
    const at = new Date(now.getTime() - e.daysAgo * DAY_MS - 3_600_000);
    const iso = at.toISOString();
    return {
      id: entryId(index),
      userId: DEMO_USER_ID,
      text: e.text,
      mood: e.mood,
      createdAt: iso,
      updatedAt: iso,
    };
  });

  const reflections: Reflection[] = [];
  entries.forEach((entry, index) => {
    // The two oldest entries have no reply yet.
    if (index >= entries.length - 2) return;
    const reply = REPLIES[index];
    const created = new Date(
      new Date(entry.createdAt).getTime() + 60_000,
    ).toISOString();
    reflections.push({
      entryId: entry.id,
      status: "done",
      text: reply?.text ?? SHORT_REPLY,
      recalled: (reply?.recalled ?? []).map((r) => {
        const recalledEntry = entries[r.index];
        if (!recalledEntry) throw new Error(`Bad seed index ${r.index}`);
        return {
          entryId: recalledEntry.id,
          date: recalledEntry.createdAt,
          quote: r.quote,
        };
      }),
      createdAt: created,
    });
  });

  return { entries, reflections };
}
