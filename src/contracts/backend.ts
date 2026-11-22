import type {
  Entry,
  EntryInput,
  RecalledRef,
  Reflection,
  WeekTheme,
} from "@/contracts/journal";
import type { Session } from "@/contracts/session";

/** Result of an auth action that the UI reports back to the user. */
export type AuthResult =
  { ok: true } | { ok: false; reason: "not-configured" | "invalid" | "failed" };

export interface AuthService {
  /** The current session from request cookies, or null. */
  getSession(): Promise<Session | null>;
  signInDemo(): Promise<AuthResult>;
  /** Sends a magic link; `next` is a same-origin relative path. */
  signInWithEmail(email: string, next: string): Promise<AuthResult>;
  /** Returns the provider URL to redirect to. */
  signInWithGitHub(
    next: string,
  ): Promise<{ ok: true; url: string } | { ok: false; reason: string }>;
  /** Exchanges the OAuth / magic-link code from /auth/callback. */
  exchangeCode(code: string): Promise<AuthResult>;
  signOut(): Promise<void>;
  /** Deletes the signed-in (non-demo) user and all their data. */
  deleteAccount(session: Session): Promise<AuthResult>;
  /** Restores the demo account's seeded entries and replies. */
  resetDemo(session: Session): Promise<AuthResult>;
}

export interface ListEntriesOptions {
  /** ISO createdAt cursor: return entries strictly older than this. */
  before?: string;
  /** Default 20, max 100. */
  limit?: number;
}

export interface EntriesPage {
  entries: Entry[];
  /** Cursor for the next (older) page, or null when there are no more. */
  nextBefore: string | null;
}

export interface EntriesRepo {
  /** Newest first. */
  list(userId: string, options?: ListEntriesOptions): Promise<EntriesPage>;
  get(userId: string, id: string): Promise<Entry | null>;
  create(userId: string, input: EntryInput): Promise<Entry>;
  update(userId: string, id: string, input: EntryInput): Promise<Entry | null>;
  /** Also removes the entry's reply and memory. Returns false if not found. */
  remove(userId: string, id: string): Promise<boolean>;
}

export interface ReflectionsRepo {
  get(userId: string, entryId: string): Promise<Reflection | null>;
  save(userId: string, reflection: Reflection): Promise<void>;
  /** Entry ids (of the given ones) that have a reply — for "Echo replied". */
  repliedEntryIds(userId: string, entryIds: string[]): Promise<Set<string>>;
}

export interface SimilarEntry {
  entry: Entry;
  /** Higher is more similar (cosine similarity for vectors). */
  score: number;
}

export interface MemoryStore {
  /** Creates or refreshes the entry's embedding. */
  index(userId: string, entry: Entry): Promise<void>;
  /** Up to `k` entries most similar to `entry`, older than it, excluding it. */
  similar(userId: string, entry: Entry, k: number): Promise<SimilarEntry[]>;
  remove(userId: string, entryId: string): Promise<void>;
}

export interface ReflectionRequest {
  entry: Entry;
  recalled: { entry: Entry; ref: RecalledRef }[];
}

export interface AiClient {
  /** Streams Echo's reply as text chunks. */
  streamReflection(request: ReflectionRequest): AsyncIterable<string>;
  /** 3–5 themes for a week's entries (≥ 2 entries). */
  summarizeWeek(entries: Entry[]): Promise<WeekTheme[]>;
}

export interface UsageLimiter {
  /** Uses one AI call for today (UTC); `allowed: false` when over the limit. */
  consume(userId: string): Promise<{ allowed: boolean; remaining: number }>;
  remaining(userId: string): Promise<number>;
  limit(): number;
}

export interface Backend {
  mode: { data: "demo" | "supabase"; ai: "fake" | "openrouter" };
  auth: AuthService;
  entries: EntriesRepo;
  reflections: ReflectionsRepo;
  memory: MemoryStore;
  ai: AiClient;
  usage: UsageLimiter;
}
