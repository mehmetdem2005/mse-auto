const express = require("express");
const cors    = require("cors");
const multer  = require("multer");
const fetch   = (...a) => import("node-fetch").then(({ default: f }) => f(...a));
const { createClient } = require("@supabase/supabase-js");

const app  = express();
const PORT = process.env.PORT || 3001;

/* ── Config ── */
const GEMINI_KEY = process.env.GEMINI_API_KEY;
const GROQ_KEY   = process.env.GROQ_API_KEY;   // opsiyonel fallback
const SB_URL     = process.env.SUPABASE_URL;
const SB_KEY     = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ORIGIN     = process.env.ALLOWED_ORIGIN || "*";

app.use(cors({ origin: ORIGIN === "*" ? "*" : ORIGIN.split(","), methods: ["GET","POST","OPTIONS"] }));
app.use(express.json({ limit: "4mb" }));

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter: (_, f, cb) => cb(null, /audio\/(webm|mp4|mpeg|ogg|wav|flac|m4a)|video\/webm/.test(f.mimetype)),
});

/* ── Supabase ── */
const sb = () => SB_URL && SB_KEY ? createClient(SB_URL, SB_KEY) : null;

/* ── Health ── */
app.get("/", (_, res) => res.json({
  ok: true, service: "MSE Auto API v2",
  ai: GEMINI_KEY ? "gemini" : (GROQ_KEY ? "groq" : "none"),
  db: SB_URL ? "supabase" : "none",
}));

/* ── Gemini chat ── */
async function geminiChat(messages) {
  const sys = messages.find(m => m.role === "system");
  const hist = messages
    .filter(m => m.role !== "system")
    .map(m => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] }));

  const r = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: sys ? { parts: [{ text: sys.content }] } : undefined,
        contents: hist,
        generationConfig: { maxOutputTokens: 512, temperature: 0.7 },
      }),
      signal: AbortSignal.timeout(20000),
    }
  );
  if (!r.ok) throw new Error(`Gemini ${r.status}: ${await r.text()}`);
  const d = await r.json();
  return d.candidates[0].content.parts[0].text;
}

/* ── Groq chat (fallback) ── */
async function groqChat(messages) {
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

/* ── Gemini embeddings ── */
async function embedText(text) {
  const r = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${GEMINI_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: "models/text-embedding-004", content: { parts: [{ text }] } }),
      signal: AbortSignal.timeout(10000),
    }
  );
  if (!r.ok) throw new Error(`Embed ${r.status}`);
  const d = await r.json();
  return d.embedding.values;
}

/* ── RAG: fetch relevant cars from Supabase ── */
async function ragCars(query) {
  const client = sb();
  if (!client || !GEMINI_KEY) return "";
  try {
    const vec = await embedText(query);
    const { data } = await client.rpc("match_cars", { query_embedding: vec, match_count: 3 });
    if (!data || !data.length) return "";
    return "\n\nGalerimizdeki ilgili araçlar:\n" +
      data.map(c => `- ${c.title || c.brand + " " + c.model} | ${c.year} | ${c.km} km | ${c.price || "fiyat sorunuz"}`).join("\n");
  } catch { return ""; }
}

/* ── /api/chat ── */
app.post("/api/chat", async (req, res) => {
  const { message, history = [] } = req.body;
  if (!message) return res.status(400).json({ error: "message required" });

  const ragContext = await ragCars(message);

  const systemPrompt = `Sen MSE Auto'nun yapay zeka asistanısın. MSE Auto güvenilir bir 2. el araç alım-satım galerisidir.
Görevin: satılık araçlar, araç satma/değerleme, takas, randevu konularında yardımcı olmak.
Kurallar: Türkçe cevap ver. Kısa ve net ol. Uydurma bilgi verme. Finansman/kredi önerme.${ragContext}`;

  const messages = [
    { role: "system", content: systemPrompt },
    ...history.slice(-6).map(h => ({ role: h.role, content: h.content })),
    { role: "user", content: message },
  ];

  try {
    const reply = GEMINI_KEY ? await geminiChat(messages) : await groqChat(messages);
    return res.json({ reply });
  } catch (e1) {
    console.warn("Primary AI failed:", e1.message);
    if (GROQ_KEY && GEMINI_KEY) {
      try {
        const reply = await groqChat(messages);
        return res.json({ reply });
      } catch (e2) { console.warn("Groq fallback failed:", e2.message); }
    }
  }
  res.status(500).json({ reply: "Üzgünüm, şu an yanıt veremiyorum. Lütfen bizi doğrudan arayın." });
});

/* ── /api/embed — store car embedding in Supabase ── */
app.post("/api/embed", async (req, res) => {
  const { id, text } = req.body;
  if (!id || !text) return res.status(400).json({ error: "id ve text gerekli" });
  if (!GEMINI_KEY) return res.status(503).json({ error: "Embedding servisi yok" });
  const client = sb();
  if (!client) return res.status(503).json({ error: "DB bağlantısı yok" });
  try {
    const embedding = await embedText(text);
    await client.from("car_embeddings").upsert({ car_id: id, embedding, text });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/* ── /api/valuation ── */
app.post("/api/valuation", async (req, res) => {
  const { brand, model, year, km, name, phone, email, note } = req.body;
  if (!phone) return res.status(400).json({ error: "Telefon numarası gerekli" });
  const client = sb();
  if (client) {
    try {
      await client.from("valuation_requests").insert([{
        brand, model, year, km, name, phone, email, note,
        status: "new", created_at: new Date().toISOString(),
      }]);
    } catch (e) { console.error("Supabase:", e.message); }
  }
  res.json({ ok: true, message: "Talebiniz alındı. En kısa sürede sizi arayacağız." });
});

/* ── /api/contact ── */
app.post("/api/contact", async (req, res) => {
  const { name, email, phone, subject, message } = req.body;
  if (!name || !message) return res.status(400).json({ error: "Ad ve mesaj gerekli" });
  const client = sb();
  if (client) {
    try {
      await client.from("contact_messages").insert([{
        name, email, phone, subject, message,
        status: "new", created_at: new Date().toISOString(),
      }]);
    } catch (e) { console.error("Supabase:", e.message); }
  }
  res.json({ ok: true, message: "Mesajınız alındı." });
});

app.listen(PORT, () => console.log(`MSE Auto API ▸ ${PORT} | AI:${GEMINI_KEY?"gemini":"?"} DB:${SB_URL?"sb":"local"}`));
