/**
 * Google Cloud Vertex AI + Cloud Text-to-Speech client.
 *
 * Activates when GCP_SERVICE_ACCOUNT_JSON is set — a service-account key (role
 * "Vertex AI User"; Cloud Text-to-Speech API enabled on the project). Spends the
 * user's GCP credit instead of the exhausted OpenAI/Gemini free tiers.
 *
 *  - Images: Vertex Gemini image model ("Nano Banana"). Each beat is a SEPARATE
 *    stateless call (no chat/context limit to hit), but we feed the PREVIOUS beat's
 *    image back in as a reference so character / art-style / palette / world stay
 *    consistent and the visual story flows beat-to-beat.
 *  - Voice : Cloud TTS Chirp 3 HD — natural, expressive Turkish narration that
 *    replaces the robotic standard voice.
 *
 * Auth uses the service-account JSON directly (via googleapis' bundled google-auth);
 * the minted OAuth token (cloud-platform scope) is cached ~50min.
 */
import { google } from "googleapis";

const SA_RAW = process.env.GCP_SERVICE_ACCOUNT_JSON || "";

/** True when a GCP service-account key is configured → route media to Vertex/Cloud TTS. */
export function gcpConfigured(): boolean {
  return SA_RAW.trim().length > 0;
}

function parseSA(): any {
  const raw = SA_RAW.trim();
  // Accept raw JSON or base64-encoded JSON (env vars often mangle multi-line PEM newlines).
  const json = raw.startsWith("{") ? raw : Buffer.from(raw, "base64").toString("utf8");
  return JSON.parse(json);
}

let _auth: any = null;
function authClient(): any {
  if (_auth) return _auth;
  const creds = parseSA();
  _auth = new google.auth.GoogleAuth({
    credentials: { client_email: creds.client_email, private_key: creds.private_key },
    scopes: ["https://www.googleapis.com/auth/cloud-platform"],
  });
  return _auth;
}

export function gcpProject(): string {
  return process.env.GCP_PROJECT_ID || parseSA().project_id;
}
const LOCATION = process.env.VERTEX_LOCATION || "us-central1";

let _tok: { value: string; exp: number } | null = null;
async function token(): Promise<string> {
  if (_tok && Date.now() < _tok.exp) return _tok.value;
  const client = await authClient().getClient();
  const t = await client.getAccessToken();
  const value = typeof t === "string" ? t : t?.token;
  if (!value) throw new Error("GCP: could not mint access token from service account");
  _tok = { value, exp: Date.now() + 50 * 60 * 1000 };
  return value;
}

// ── Images (Vertex Gemini image model, with previous-image reference) ─────────
const IMAGE_MODEL = process.env.VERTEX_IMAGE_MODEL || "gemini-2.5-flash-image-preview";

/**
 * Generate one image, optionally conditioned on a previous image for visual continuity.
 * Returns base64 (PNG/JPEG). Each call is independent — pass `refB64` to carry the look forward.
 */
export async function vertexImage(prompt: string, refB64?: string): Promise<string> {
  const url = `https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${gcpProject()}/locations/${LOCATION}/publishers/google/models/${IMAGE_MODEL}:generateContent`;
  const parts: any[] = [];
  if (refB64) parts.push({ inlineData: { mimeType: "image/png", data: refB64 } });
  parts.push({ text: prompt });
  const r = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${await token()}`, "Content-Type": "application/json" },
    body: JSON.stringify({ contents: [{ role: "user", parts }], generationConfig: { responseModalities: ["TEXT", "IMAGE"] } }),
  });
  if (!r.ok) throw new Error(`Vertex image ${r.status}: ${(await r.text()).slice(0, 220)}`);
  const d: any = await r.json();
  const ps = d.candidates?.[0]?.content?.parts ?? [];
  const img = ps.find((p: any) => p.inlineData?.data);
  if (!img) throw new Error("Vertex: no image data in response");
  return img.inlineData.data as string;
}

// ── Voice (Cloud TTS Chirp 3 HD) ─────────────────────────────────────────────
const TTS_LANG = process.env.GCP_TTS_LANG || "tr-TR";
// Chirp 3 HD voices are named after stars. Charon = grounded, confident male (documentary tone).
const TTS_VOICE = process.env.GCP_TTS_VOICE || "tr-TR-Chirp3-HD-Charon";

/** High-quality, expressive narration via Cloud TTS Chirp 3 HD. Returns an MP3 buffer. */
export async function vertexTTS(text: string): Promise<Buffer> {
  const r = await fetch("https://texttospeech.googleapis.com/v1/text:synthesize", {
    method: "POST",
    headers: { Authorization: `Bearer ${await token()}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      input: { text: text.slice(0, 4800) },
      voice: { languageCode: TTS_LANG, name: TTS_VOICE },
      // Chirp 3 HD ignores pitch/SSML; speakingRate is honoured. Keep it natural.
      audioConfig: { audioEncoding: "MP3", speakingRate: Number(process.env.GCP_TTS_RATE || 1.0) },
    }),
  });
  if (!r.ok) throw new Error(`Cloud TTS ${r.status}: ${(await r.text()).slice(0, 220)}`);
  const d: any = await r.json();
  if (!d.audioContent) throw new Error("Cloud TTS: no audio returned");
  return Buffer.from(d.audioContent, "base64");
}
