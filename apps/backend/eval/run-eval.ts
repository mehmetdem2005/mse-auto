import { createContainer } from "../src/config/container";
import { loadEnv } from "../src/config/env";
/**
 * Eval runner (ADR-075/A4): golden-set'i gerçek checker ile çalıştırır, judge'lar,
 * rapor basar. `pnpm eval`. Arama/LLM anahtarı yoksa (CI/offline) çalışma ATLANIR
 * — judge mantığı ayrıca test/eval.test.ts'te deterministik doğrulanır.
 */
import { type EvalReport, judgeCase, summarize } from "../src/domain/eval";
import type { CanonicalTopic } from "../src/domain/topic";
import { GOLDEN_SET } from "./golden-set";

async function main(): Promise<void> {
  const env = loadEnv();
  const hasLLM = !!(env.GROQ_API_KEY || env.DEEPSEEK_API_KEY || env.OPENAI_API_KEY);
  const hasSearch = !!(env.SERPER_API_KEY || env.TAVILY_API_KEY);
  if (!hasLLM || !hasSearch) {
    console.log("⏭  Eval ATLANDI: arama/LLM anahtarı yok (CI/offline).");
    console.log("   Judge mantığı test/eval.test.ts'te deterministik doğrulanır.");
    console.log(`   Çalıştırmak için: GROQ_API_KEY + SERPER_API_KEY ile 'pnpm eval'.`);
    return;
  }

  const { checker } = createContainer(env);
  console.log(`▶  Eval başlıyor — ${GOLDEN_SET.length} vaka (gerçek web + LLM)\n`);

  const scores = [];
  for (const g of GOLDEN_SET) {
    const topic: CanonicalTopic = { id: g.id, canonicalQuery: g.query, lastCheckedAt: null };
    try {
      const outcome = await checker.check(topic, {
        lastEventDescription: g.lastEventDescription ?? null,
      });
      const s = judgeCase(g, outcome);
      scores.push(s);
      console.log(`${s.passed ? "✅" : "❌"} ${g.id} — ${s.note} (skor ${s.score.toFixed(2)})`);
    } catch (err) {
      console.log(`⚠️  ${g.id} — checker hatası: ${err instanceof Error ? err.message : err}`);
      scores.push({
        id: g.id,
        passed: false,
        score: 0,
        detail: { detectionMatch: false, includeMatch: false, confidenceOk: false },
        note: "checker hatası",
      });
    }
  }

  const report: EvalReport = summarize(scores, GOLDEN_SET);
  console.log("\n──────── RAPOR ────────");
  console.log(
    `Geçen:            ${report.passed}/${report.total} (%${Math.round(report.passRate * 100)})`,
  );
  console.log(`Ort. skor:        ${report.avgScore.toFixed(2)}`);
  console.log(`Tespit isabeti:   %${Math.round(report.detectionAccuracy * 100)}`);
  console.log(`Yanlış-pozitif:   ${report.falsePositives}  (kullanıcıya yanlış bildirim)`);
  console.log(`Yanlış-negatif:   ${report.falseNegatives}  (kaçırılan gerçek olay)`);
  console.log("───────────────────────");
  // CI'da eşik altı düşerse görünür olsun (henüz exit-fail yapmıyoruz — trend izleme).
  if (report.detectionAccuracy < 0.7) {
    console.log("⚠️  Tespit isabeti %70 altında — gözden geçir.");
  }
}

main().catch((e) => {
  console.error("eval çöktü:", e);
  process.exit(1);
});
