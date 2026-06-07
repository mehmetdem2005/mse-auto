/**
 * Persistent media storage — keep rendered MP4s in Supabase Storage (the worker disk is
 * ephemeral). Returns a durable public URL stored on video_jobs.video_url. Fully non-fatal.
 */
import { readFile } from "node:fs/promises";
import { supabase } from "./supabase.js";

const BUCKET = process.env.VIDEO_BUCKET || "videos";

export async function uploadRenderedVideo(jobId: string, filePath: string): Promise<string | null> {
  try {
    const buf = await readFile(filePath);
    const path = `${jobId}/short.mp4`;
    let { error } = await supabase.storage.from(BUCKET).upload(path, buf, { contentType: "video/mp4", upsert: true });
    if (error) {
      // bucket may not exist yet — create it (public) and retry once
      await supabase.storage.createBucket(BUCKET, { public: true }).catch(() => {});
      const retry = await supabase.storage.from(BUCKET).upload(path, buf, { contentType: "video/mp4", upsert: true });
      if (retry.error) throw retry.error;
    }
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    return data?.publicUrl ?? null;
  } catch (e) {
    console.warn("[storage] video upload failed:", String((e as any)?.message || e).slice(0, 140));
    return null;
  }
}
