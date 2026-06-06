/**
 * YouTube integration via the official Data API v3 (the SANCTIONED upload path).  [v0.3]
 *
 * Verified (June 2026):
 *  - videos.insert quota ≈ 100 units (cut from 1600 on 2025-12-04) → ~100 uploads/day on default 10k.
 *  - status.containsSyntheticMedia (since 2024-10-30) discloses AI/altered content via the API.
 *  - status.selfDeclaredMadeForKids MUST be sent (even false) or the video is silently blocked
 *    from views until set in Studio.
 *  - ⚠ UNVERIFIED API projects upload videos as PRIVATE and cannot publish public until Google
 *    audits the project. So a brand-new OAuth project will NOT auto-publish public — request the
 *    API audit, or keep videos unlisted/private until approved. (See HANDOFF.md.)
 *
 * v0.3 adds: configurable default privacy, an idempotency marker + lookup to prevent double
 * uploads on retry, and a #Shorts hint.
 */
import { google } from "googleapis";
import { createReadStream } from "node:fs";
import { env } from "./env.js";
import { supabase } from "./supabase.js";
import { limiter } from "./ratelimit.js";

function baseClient() {
  return new google.auth.OAuth2(
    process.env.YOUTUBE_CLIENT_ID, process.env.YOUTUBE_CLIENT_SECRET, process.env.YOUTUBE_REDIRECT_URI,
  );
}
/** Refresh token: prefer the UI-connected store (oauth_tokens), fall back to env. */
async function resolveRefreshToken(): Promise<string | undefined> {
  try {
    const { data } = await supabase.from("oauth_tokens").select("refresh_token").eq("provider", "youtube").single();
    if ((data as any)?.refresh_token) return (data as any).refresh_token;
  } catch { /* table empty / not connected → env fallback */ }
  return process.env.YOUTUBE_REFRESH_TOKEN;
}
async function authedClient() { const c = baseClient(); c.setCredentials({ refresh_token: await resolveRefreshToken() }); return c; }

/** Has a YouTube account been connected (via UI or env)? */
export async function isConnected(): Promise<boolean> { return Boolean(await resolveRefreshToken()); }

/** Exchange an OAuth code for a refresh token and store it (used by the in-UI Connect flow). */
export async function exchangeCodeAndStore(code: string): Promise<boolean> {
  const { tokens } = await baseClient().getToken(code);
  if (!tokens.refresh_token) return false; // Google only returns it with access_type=offline + prompt=consent
  await supabase.from("oauth_tokens").upsert({ provider: "youtube", refresh_token: tokens.refresh_token, updated_at: new Date().toISOString() });
  return true;
}

export interface UploadInput {
  filePath: string;
  title: string;
  description: string;
  tags: string[];
  madeWithAI: boolean;
  idempotencyKey?: string;   // embedded as a hidden marker for dedup
  publishAt?: string;        // ISO; if set, video is uploaded PRIVATE and goes public then
  privacy?: "private" | "unlisted" | "public";
  categoryId?: string;       // default 27 = Education
}

const MARKER = (key: string) => `\n\n[asid:${key}]`;

export async function uploadVideo(input: UploadInput): Promise<string> {
  await limiter.acquire("youtube-write");
  const yt = google.youtube({ version: "v3", auth: await authedClient() });

  const wantPrivacy = input.privacy || (env() as any).YOUTUBE_DEFAULT_PRIVACY || "private";
  const status: any = {
    privacyStatus: input.publishAt ? "private" : wantPrivacy, // publishAt requires private
    selfDeclaredMadeForKids: false,                            // must be explicit
  };
  if (input.publishAt) status.publishAt = input.publishAt;
  if (input.madeWithAI) status.containsSyntheticMedia = true;  // verified API field

  let description = input.description;
  if (!/#shorts/i.test(description)) description += "\n\n#Shorts";
  if (input.idempotencyKey) description += MARKER(input.idempotencyKey);

  const res = await yt.videos.insert({
    part: ["snippet", "status"],
    requestBody: {
      snippet: { title: input.title.slice(0, 100), description: description.slice(0, 4900), tags: input.tags, categoryId: input.categoryId || "27" },
      status,
    },
    media: { body: createReadStream(input.filePath) }, // resumable handled internally
  });
  const id = res.data.id;
  if (!id) throw new Error("Upload returned no video id");
  return id;
}

/** Idempotency lookup: find a previously-uploaded video carrying this key's marker (costs 100 units). */
export async function findUploadedByKey(key: string): Promise<string | null> {
  const yt = google.youtube({ version: "v3", auth: await authedClient() });
  const res = await yt.search.list({ part: ["id"], forMine: true, type: ["video"], q: `asid:${key}`, maxResults: 5 } as any);
  const hit = (res.data.items ?? []).find((i: any) => i.id?.videoId);
  return (hit?.id as any)?.videoId ?? null;
}

export async function fetchStats(videoIds: string[]) {
  if (!videoIds.length) return [];
  const yt = google.youtube({ version: "v3", auth: await authedClient() });
  const res = await yt.videos.list({ part: ["statistics", "snippet"], id: videoIds });
  return (res.data.items ?? []).map((v) => ({
    id: v.id!, title: v.snippet?.title, publishedAt: v.snippet?.publishedAt,
    views: Number(v.statistics?.viewCount ?? 0), likes: Number(v.statistics?.likeCount ?? 0), comments: Number(v.statistics?.commentCount ?? 0),
  }));
}

/** One-time: print the consent URL to mint a refresh token (run locally). */
export function consentUrl(): string {
  return baseClient().generateAuthUrl({
    access_type: "offline", prompt: "consent",
    scope: ["https://www.googleapis.com/auth/youtube.upload", "https://www.googleapis.com/auth/youtube.readonly"],
  });
}

/** Fetch top-level comments for a video (for sentiment/issue analysis). ~1 unit. */
export async function fetchCommentThreads(videoId: string, max = 20): Promise<{ author: string; text: string; likes: number }[]> {
  const yt = google.youtube({ version: "v3", auth: await authedClient() });
  try {
    const res = await yt.commentThreads.list({ part: ["snippet"], videoId, maxResults: Math.min(max, 100), order: "relevance" } as any);
    return (res.data.items ?? []).map((it: any) => {
      const s = it.snippet?.topLevelComment?.snippet;
      return { author: s?.authorDisplayName ?? "", text: s?.textOriginal ?? s?.textDisplay ?? "", likes: Number(s?.likeCount ?? 0) };
    });
  } catch { return []; }
}

/** Set a video's privacy (used by the anomaly commander for reversible takedown). */
export async function setVideoPrivacy(videoId: string, privacy: "private" | "unlisted" | "public"): Promise<boolean> {
  const yt = google.youtube({ version: "v3", auth: await authedClient() });
  await yt.videos.update({ part: ["status"], requestBody: { id: videoId, status: { privacyStatus: privacy } } } as any);
  return true;
}
