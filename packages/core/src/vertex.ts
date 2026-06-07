/**
 * Google Cloud Vertex AI + Cloud Text-to-Speech client. Spends the user's GCP credit.
 *
 * TWO ways to authenticate (either activates Vertex; proxy is preferred when both are set):
 *
 *  1) PROXY  (recommended, no key file): deploy proxy/ to Cloud Run (see proxy/KUR.md). The
 *     Cloud Run service account holds the identity (ADC) and bills the credit; the worker just
 *     POSTs to it with a shared secret. Set VERTEX_PROXY_URL + VERTEX_PROXY_SECRET.
 *  2) DIRECT (service-account key): set GCP_SERVICE_ACCOUNT_JSON (a key with role
 *     "Vertex AI User"; Cloud Text-to-Speech API enabled). The worker mints OAuth tokens itself.
 *
 * Images: Vertex Gemini image model ("Nano Banana"). Each beat is a SEPARATE stateless call
 * (no chat/context limit), but the PREVIOUS beat's image is fed back as a reference so
 * characters / art-style / palette / world stay consistent and the visual story flows.
 * Voice: Cloud TTS Chirp 3 HD — natural, expressive Turkish narration (no more robotic voice).
 */
import { google } from "googleapis";

const SA_RAW = process.env.GCP_SERVICE_ACCOUNT_JSON || "";
const PROXY_URL = (process.env.VERTEX_PROXY_URL || "").replace(/\/$/, "");
const PROXY_SECRET = process.env.VERTEX_PROXY_SECRET || "";

/** True when Vertex is reachable (via proxy or service-account key) → route media to Vertex/Cloud TTS. */
export function gcpConfigured(): boolean {
  return PROXY_URL.length > 0 || SA_RAW.trim().length > 0;
}

// ── Config ───────────────────────────────────────────────────────────────────
const LOCATION = process.env.VERTEX_LOCATION || "us-central1";
// Some models (e.g. Nano Banana Pro / gemini-3-pro-image-preview) are only served from "global".
// global → regionless host; otherwise the regional host. (Matches the proven Cloud Run proxy.)
const AIPLATFORM_HOST = LOCATION === "global" ? "aiplatform.googleapis.com" : `${LOCATION}-aiplatform.googleapis.com`;
const IMAGE_MODEL = process.env.VERTEX_IMAGE_MODEL || "gemini-2.5-flash-image";
const TTS_LANG = process.env.GCP_TTS_LANG || "tr-TR";
// Chirp 3 HD voices are named after stars. Charon = grounded, confident male (documentary tone).
const TTS_VOICE = process.env.GCP_TTS_VOICE || "tr-TR-Chirp3-HD-Charon";
const TTS_RATE = Number(process.env.GCP_TTS_RATE || 1.0);

// ── Direct (service-account) auth ─────────────────────────────────────────────
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
function gcpProject(): string {
  return process.env.GCP_PROJECT_ID || parseSA().project_id;
}
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

function imgFromVertexJson(d: any): string {
  const ps = d?.candidates?.[0]?.content?.parts ?? [];
  const img = ps.find((p: any) => p.inlineData?.data || p.inline_data?.data);
  const data = img?.inlineData?.data ?? img?.inline_data?.data;
  if (!data) throw new Error("Vertex: no image data in response");
  return data as string;
}

// ── Images (with previous-image reference for visual continuity) ──────────────
/** Generate one image, optionally conditioned on a previous image. Returns base64. */
export async function vertexImage(prompt: string, refB64?: string): Promise<string> {
  const parts: any[] = [];
  if (refB64) parts.push({ inlineData: { mimeType: "image/png", data: refB64 } });
  parts.push({ text: prompt });
  const contents = [{ role: "user", parts }];
  const generationConfig = { responseModalities: ["TEXT", "IMAGE"] };

  if (PROXY_URL) {
    const body = JSON.stringify({ location: LOCATION, model: IMAGE_MODEL, contents, generationConfig });
    const headers = { "Content-Type": "application/json", "X-Proxy-Secret": PROXY_SECRET };
    // Prefer /image (this repo's proxy). Fall back to the proxy root "/" so an older image-only
    // proxy (which serves generateContent at "/") keeps working without a redeploy.
    let r = await fetch(`${PROXY_URL}/image`, { method: "POST", headers, body });
    if (r.status === 404) r = await fetch(`${PROXY_URL}/`, { method: "POST", headers, body });
    if (!r.ok) throw new Error(`Vertex proxy image ${r.status}: ${(await r.text()).slice(0, 220)}`);
    return imgFromVertexJson(await r.json());
  }

  const url = `https://${AIPLATFORM_HOST}/v1/projects/${gcpProject()}/locations/${LOCATION}/publishers/google/models/${IMAGE_MODEL}:generateContent`;
  const r = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${await token()}`, "Content-Type": "application/json" },
    body: JSON.stringify({ contents, generationConfig }),
  });
  if (!r.ok) throw new Error(`Vertex image ${r.status}: ${(await r.text()).slice(0, 220)}`);
  return imgFromVertexJson(await r.json());
}

// ── Voice (Cloud TTS Chirp 3 HD) ─────────────────────────────────────────────
/** High-quality, expressive narration via Cloud TTS Chirp 3 HD. Returns an MP3 buffer. */
export async function vertexTTS(text: string): Promise<Buffer> {
  const payload = { text: text.slice(0, 4800), languageCode: TTS_LANG, voice: TTS_VOICE, speakingRate: TTS_RATE };

  if (PROXY_URL) {
    const r = await fetch(`${PROXY_URL}/tts`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Proxy-Secret": PROXY_SECRET },
      body: JSON.stringify(payload),
    });
    if (!r.ok) throw new Error(`Cloud TTS proxy ${r.status}: ${(await r.text()).slice(0, 220)}`);
    const d: any = await r.json();
    if (!d.audioContent) throw new Error("Cloud TTS proxy: no audio returned");
    return Buffer.from(d.audioContent, "base64");
  }

  const r = await fetch("https://texttospeech.googleapis.com/v1/text:synthesize", {
    method: "POST",
    headers: { Authorization: `Bearer ${await token()}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      input: { text: payload.text },
      voice: { languageCode: TTS_LANG, name: TTS_VOICE },
      // Chirp 3 HD ignores pitch/SSML; speakingRate is honoured. Keep it natural.
      audioConfig: { audioEncoding: "MP3", speakingRate: TTS_RATE },
    }),
  });
  if (!r.ok) throw new Error(`Cloud TTS ${r.status}: ${(await r.text()).slice(0, 220)}`);
  const d: any = await r.json();
  if (!d.audioContent) throw new Error("Cloud TTS: no audio returned");
  return Buffer.from(d.audioContent, "base64");
}
