const express = require("express");
const cors = require("cors");
const multer = require("multer");
const Groq = require("groq-sdk");
const { createClient } = require("@supabase/supabase-js");

const app = express();
const PORT = process.env.PORT || 3001;

/* ── Config ──────────────────────────────────────────────────────────── */
const GROQ_KEY = process.env.GROQ_API_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || "*";

const groq = new Groq({ apiKey: GROQ_KEY });

/* ── Middleware ──────────────────────────────────────────────────────── */
app.use(cors({
  origin: ALLOWED_ORIGIN === "*" ? "*" : ALLOWED_ORIGIN.split(","),
  methods: ["GET", "POST", "OPTIONS"],
}));
app.use(express.json({ limit: "4mb" }));

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter: (_, file, cb) => {
    const ok = /audio\/(webm|mp4|mpeg|ogg|wav|flac|m4a)|video\/webm/.test(file.mimetype);
    cb(null, ok);
  },
});

/* ── Health ──────────────────────────────────────────────────────────── */
app.get("/", (_, res) => res.json({ ok: true, service: "MSE Auto API" }));

/* ── AI Chat (Groq llama-3.3-70b-versatile) ─────────────────────────── */
app.post("/api/chat", async (req, res) => {
  const { message, history = [], tools = [] } = req.body;
  if (!message) return res.status(400).json({ error: "message required" });

  const systemPrompt = `Sen MSE Auto'nun yapay zeka asistanısın. MSE Auto güvenilir bir 2. el araç alım-satım galerisidir.

Görevin:
- Satılık araçlar hakkında bilgi vermek
- Aracını satmak isteyen müşterilere değerleme sürecini açıklamak
- Randevu ve iletişim konularında yardımcı olmak
- Finansman ve takas sorularını yanıtlamak
- SSS sorularını cevaplamak

Kurallar:
- Türkçe cevap ver
- Kısa, net ve yardımsever ol
- Uydurma fiyat veya araç bilgisi verme
- Müşteriyi ${tools.includes("bookAppointment") ? "randevuya yönlendir" : "iletişime geçmeye teşvik et"}
- Samimi ve profesyonel bir dil kullan`;

  const messages = [
    { role: "system", content: systemPrompt },
    ...history.slice(-6).map((h) => ({ role: h.role, content: h.content })),
    { role: "user", content: message },
  ];

  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages,
      max_tokens: 512,
      temperature: 0.7,
    });
    res.json({ reply: completion.choices[0].message.content });
  } catch (err) {
    console.error("Groq chat error:", err.message);
    res.status(500).json({ error: "AI yanıt veremedi", reply: "Üzgünüm, şu an yanıt veremiyorum. Lütfen tekrar deneyin veya bizi doğrudan arayın." });
  }
});

/* ── Voice Transcription (Groq Whisper) ──────────────────────────────── */
app.post("/api/voice", upload.single("audio"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "Audio file required" });

  try {
    const { Readable } = require("stream");
    const readable = Readable.from(req.file.buffer);
    readable.path = "audio.webm";

    const transcription = await groq.audio.transcriptions.create({
      file: readable,
      model: "whisper-large-v3",
      language: "tr",
      response_format: "text",
    });

    res.json({ transcript: transcription });
  } catch (err) {
    console.error("Whisper error:", err.message);
    res.status(500).json({ error: "Ses tanınamadı" });
  }
});

/* ── Valuation Request (saves to Supabase if configured) ─────────────── */
app.post("/api/valuation", async (req, res) => {
  const { brand, model, year, km, contact, phone, email } = req.body;
  if (!contact || !phone) return res.status(400).json({ error: "İletişim bilgileri gerekli" });

  if (SUPABASE_URL && SUPABASE_SERVICE_KEY) {
    try {
      const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
      await sb.from("valuation_requests").insert([{
        brand, model, year, km, contact, phone, email,
        status: "new",
        created_at: new Date().toISOString(),
      }]);
    } catch (e) {
      console.error("Supabase insert error:", e.message);
    }
  }

  res.json({ ok: true, message: "Talebiniz alındı. En kısa sürede sizi arayacağız." });
});

/* ── Contact Message ─────────────────────────────────────────────────── */
app.post("/api/contact", async (req, res) => {
  const { name, email, phone, subject, message } = req.body;
  if (!name || !message) return res.status(400).json({ error: "Ad ve mesaj gerekli" });

  if (SUPABASE_URL && SUPABASE_SERVICE_KEY) {
    try {
      const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
      await sb.from("contact_messages").insert([{
        name, email, phone, subject, message,
        status: "new",
        created_at: new Date().toISOString(),
      }]);
    } catch (e) {
      console.error("Supabase insert error:", e.message);
    }
  }

  res.json({ ok: true, message: "Mesajınız alındı." });
});

/* ── Start ───────────────────────────────────────────────────────────── */
app.listen(PORT, () => console.log(`MSE Auto API ▸ port ${PORT}`));
