import type { JobQueue } from "../../domain/queue";

/**
 * Tek-süreç (combined) iş kuyruğu. Üretici + tüketici aynı process.
 * enqueue → otomatik pump (drain) ile işlenir; re-entrant pump guard'lıdır,
 * böylece bir handler içinden enqueue edilen iş dış döngüye bırakılır.
 * (Eski hata: process() yalnız handler kaydediyordu; prod'da kimse drain
 *  çağırmadığı için işler hiç işlenmiyordu → 0 check_run.)
 */
export class InMemoryJobQueue implements JobQueue {
  private readonly handlers = new Map<string, (data: unknown) => Promise<void>>();
  private readonly pending: Array<{ queue: string; data: unknown }> = [];
  private draining = false;

  async init(): Promise<void> {}

  async enqueue<T extends object>(queue: string, data: T): Promise<void> {
    this.pending.push({ queue, data });
    await this.pump();
  }

  async process<T extends object>(
    queue: string,
    handler: (data: T) => Promise<void>,
  ): Promise<void> {
    this.handlers.set(queue, handler as (d: unknown) => Promise<void>);
  }

  /** Bekleyen tüm işleri sırayla işler; bir işin hatası diğerlerini durdurmaz. */
  private async pump(): Promise<void> {
    if (this.draining) return; // re-entrancy: dış döngü zaten işliyor
    this.draining = true;
    try {
      for (;;) {
        const job = this.pending.shift();
        if (!job) break;
        const handler = this.handlers.get(job.queue);
        if (!handler) continue;
        try {
          await handler(job.data);
        } catch (err) {
          console.error(`queue '${job.queue}' işleyici hatası (yutuldu):`, err);
        }
      }
    } finally {
      this.draining = false;
    }
  }

  /** Test/dev uyumluluğu: pump ile aynı. */
  async drain(): Promise<void> {
    await this.pump();
  }

  async shutdown(): Promise<void> {}
}
