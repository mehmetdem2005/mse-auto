const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fetch = (...args) => import("node-fetch").then(({ default: f }) => f(...args));
const { createClient } = require("@supabase/supabase-js");

const app = express();
const PORT = process.env.PORT || 3001;

const OPENAI_KEY   = process.env.OPENAI_API_KEY;
const GEMINI_KEY   = process.env.GEMINI_API_KEY;
const DEEPSEEK_KEY = process.env.DEEPSEEK_API_KEY;
const GROQ_KEY     = process.env.GROQ_API_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || "*";

app.use(cors({
  origin: ALLOWED_ORIGIN === "*" ? "*" : ALLOWED_ORIGIN.split(","),
  methods: ["GET", "POST", "OPTIONS"],
}));
app.use(express.json({ limit: "4mb" }));

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter: (_, file, cb) => {
    cb(null, /audio\/(webm|mp4|mpeg|ogg|wav|flac|m4a)|video\/webm/.test(file.mimetype));
  },
});

/* ── Health ── */
app.get("/", (_, res) => res.json({ ok: true, service: "MSE Auto API", version: "2.0" }));

/* ── AI Chat — multi-provider with fallback ── */
async function chatWithOpenAI(messages) {
  const r = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Authorization": `Bearer ${OPENAI_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "gpt-4o-mini", messages, max_tokens: 512, temperature: 0.7 }),
    signal: AbortSignal.timeout(15000),
  });
  if (!r.ok) throw new Error(`OpenAI ${r.status}`);
  const d = await r.json();
  return d.choices[0].message.content;
}

async function chatWithGemini(messages) {
  const contents = messages
    .filter(m => m.role !== "system")
    .map(m => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] }));
  const sys = messages.find(m => m.role === "system");
  const r = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: sys ? { parts: [{ text: sys.content }] } : undefined,
        contents,
        generationConfig: { maxOutputTokens: 512, temperature: 0.7 },
      }),
      signal: AbortSignal.timeout(15000),
    }
  );
  if (!r.ok) throw new Error(`Gemini ${r.status}`);
  const d = await r.json();
  return d.candidates[0].content.parts[0].text;
}

async function chatWithDeepSeek(messages) {
  const r = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: { "Authorization": `Bearer ${DEEPSEEK_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "deepseek-chat", messages, max_tokens: 512, temperature: 0.7 }),
    signal: AbortSignal.timeout(15000),
  });
  if (!r.ok) throw new Error(`DeepSeek ${r.status}`);
  const d = await r.json();
  return d.choices[0].message.content;
}

async function chatWithGroq(messages) {
  const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Authorization": `Bearer ${GROQ_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "llama-3.3-70b-versatile", messages, max_tokens: 512, temperature: 0.7 }),
    signal: AbortSignal.timeout(15000),
  });
  if (!r.ok) throw new Error(`Groq ${r.status}`);
  const d = await r.json();
  return d.choices[0].message.content;
}

app.post("/api/chat", async (req, res) => {
  const { message, history = [] } = req.body;
  if (!message) return res.status(400).json({ error: "message required" });

  const systemPrompt = `Sen MSE Auto'nun yapay zeka asistanısın. MSE Auto güvenilir bir 2. el araç alım-satım galerisidir.
Görevin: satılık araçlar, araç satma/değerleme süreci, takas, randevu ve iletişim konularında yardımcı olmak.
Kurallar: Türkçe cevap ver. Kısa ve net ol. Uydurma fiyat verme. Finansman veya kredi önerme. Samimi ve profesyonel ol.`;

  const messages = [
    { role: "system", content: systemPrompt },
    ...history.slice(-6).map(h => ({ role: h.role, content: h.content })),
    { role: "user", content: message },
  ];

  const providers = [
    OPENAI_KEY   && chatWithOpenAI,
    GEMINI_KEY   && chatWithGemini,
    DEEPSEEK_KEY && chatWithDeepSeek,
    GROQ_KEY     && chatWithGroq,
  ].filter(Boolean);

  for (const fn of providers) {
    try {
      const reply = await fn(messages);
      return res.json({ reply });
    } catch (err) {
      console.warn("AI provider failed:", err.message);
    }
  }

  res.status(500).json({ reply: "Üzgünüm, şu an yanıt veremiyorum. Lütfen bizi doğrudan arayın." });
});

/* ── Voice Transcription (OpenAI Whisper) ── */
app.post("/api/voice", upload.single("audio"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "Audio file required" });
  if (!OPENAI_KEY && !GROQ_KEY) return res.status(503).json({ error: "Ses servisi yapılandırılmadı" });

  try {
    const FormData = (await import("node-fetch")).FormData || require("form-data");
    const form = new (require("form-data"))();
    form.append("file", req.file.buffer, { filename: "audio.webm", contentType: req.file.mimetype });
    form.append("model", OPENAI_KEY ? "whisper-1" : "whisper-large-v3");
    form.append("language", "tr");

    const url = OPENAI_KEY
      ? "https://api.openai.com/v1/audio/transcriptions"
      : "https://api.groq.com/openai/v1/audio/transcriptions";
    const key = OPENAI_KEY || GROQ_KEY;

    const r = await fetch(url, {
      method: "POST",
      headers: { "Authorization": `Bearer ${key}`, ...form.getHeaders() },
      body: form,
    });
    const d = await r.json();
    res.json({ transcript: d.text || "" });
  } catch (err) {
    console.error("Voice error:", err.message);
    res.status(500).json({ error: "Ses tanınamadı" });
  }
});

/* ── Valuation Request ── */
app.post("/api/valuation", async (req, res) => {
  const { brand, model, year, km, contact, phone, email, note } = req.body;
  if (!phone) return res.status(400).json({ error: "Telefon numarası gerekli" });

  if (SUPABASE_URL && SUPABASE_SERVICE_KEY) {
    try {
      const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
      await sb.from("valuation_requests").insert([{
        brand, model, year, km, contact, phone, email, note,
        status: "new", created_at: new Date().toISOString(),
      }]);
    } catch (e) { console.error("Supabase:", e.message); }
  }

  res.json({ ok: true, message: "Talebiniz alındı. En kısa sürede sizi arayacağız." });
});

/* ── Contact Message ── */
app.post("/api/contact", async (req, res) => {
  const { name, email, phone, subject, message } = req.body;
  if (!name || !message) return res.status(400).json({ error: "Ad ve mesaj gerekli" });

  if (SUPABASE_URL && SUPABASE_SERVICE_KEY) {
    try {
      const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
      await sb.from("contact_messages").insert([{
        name, email, phone, subject, message,
        status: "new", created_at: new Date().toISOString(),
      }]);
    } catch (e) { console.error("Supabase:", e.message); }
  }

  res.json({ ok: true, message: "Mesajınız alındı." });
});

app.listen(PORT, () => console.log(`MSE Auto API ▸ port ${PORT}`));
