// Shared types for the Auto-Shorts Studio pipeline.

export type JobStage =
  | "queued"        // created, waiting for a script
  | "drafting"      // Gemini is writing the script (RAG + grounding)
  | "needs_review"  // HUMAN-IN-THE-LOOP gate (default ON) – waiting for your approval/edit
  | "approved"      // you approved/edited it → ok to produce media
  | "narrating"     // Gemini TTS generating voiceover
  | "rendering"     // assembling the vertical 1080x1920 video
  | "scheduled"     // media ready, waiting for its randomized daytime slot
  | "uploading"     // pushing to YouTube via Data API v3
  | "published"     // live on the channel
  | "failed";

export interface ShortScript {
  hook: string;                 // first ~2 seconds, the scroll-stopper
  beats: string[];              // 3–6 short narration beats (the story)
  payoff: string;               // the twist / punchline
  cta: string;                  // closing line that drives comments/follows
  // Original-value layer (this is what keeps the channel alive under YT's 2026 rules):
  commentary: string;           // your unique angle / "why this matters" – NOT just facts
  onScreenText: string[];       // caption overlays, synced to beats
  visualPrompts: string[];      // image-generation prompts per beat (license-safe, original)
  title: string;                // YouTube title
  description: string;          // YouTube description (includes AI-disclosure line)
  tags: string[];
  sources: { title: string; url: string }[]; // verifiable sources (anti-misinfo)
  narrationText: string;        // the exact text fed to TTS (built from the beats)
  estDurationSec: number;
  language: string;             // e.g. "tr"
  styleId: string;              // which visual/voice "style" – used for variation
}

export interface KnowledgeChunk {
  id: string;
  topic: string;
  text: string;
  source_title: string;
  source_url: string;
  verified: boolean;            // only verified facts get used in scripts
  embedding?: number[];
}

export interface MemoryEntry {
  id: string;
  kind: "preference" | "fact" | "performance_insight" | "used_topic" | "strategy_note" | "competitor_insight";
  content: string;
  created_at: string;
  embedding?: number[];
}

export interface VideoJob {
  id: string;
  stage: JobStage;
  topic: string;
  script?: ShortScript;
  audio_path?: string;          // storage key for the narration wav/mp3
  video_path?: string;          // storage key for the rendered mp4
  scheduled_for?: string;       // ISO timestamp (randomized daytime slot)
  youtube_video_id?: string;
  made_with_ai: boolean;        // disclosure flag
  error?: string;
  created_at: string;
  updated_at: string;
}

export interface ScheduleSlot {
  iso: string;                  // when to publish
  jobId?: string;
}

export interface ChannelConfig {
  timezone: string;             // e.g. "Europe/Istanbul"
  daytimeStartHour: number;     // e.g. 9
  daytimeEndHour: number;       // e.g. 21
  maxPerDay: number;            // KEEP LOW. quality > volume (see PLAN.md §10)
  minSpacingMinutes: number;    // min gap between uploads
  seed: number;                 // deterministic-but-random scheduling seed
  requireHumanApproval: boolean;// default TRUE – do not disable lightly
  language: string;
}
