import { type Job, PgBoss } from "pg-boss";
import type { JobQueue } from "../../domain/queue";

/** Prod kuyruk — pg-boss (Postgres, SKIP LOCKED). ADR-011. */
export class PgBossJobQueue implements JobQueue {
  private readonly boss: PgBoss;
  private started = false;

  constructor(connectionString: string) {
    this.boss = new PgBoss(connectionString);
  }

  async init(): Promise<void> {
    if (!this.started) {
      await this.boss.start();
      this.started = true;
    }
  }

  async enqueue<T extends object>(queue: string, data: T): Promise<void> {
    // Poison-message koruması: sınırlı yeniden deneme + üstel backoff + süre aşımı.
    // Aksi halde sürekli başarısız bir job (örn. kalıcı bozuk veri) sonsuz retry'da
    // döner ya da asılı kalır. CHECK_TIMEOUT_MS zaten checker'ı kesiyor; 600 sn
    // job-düzeyi son emniyet kemeri.
    await this.boss.send(queue, data, {
      retryLimit: 5,
      retryBackoff: true,
      expireInSeconds: 600,
    });
  }

  async process<T extends object>(
    queue: string,
    handler: (data: T) => Promise<void>,
  ): Promise<void> {
    await this.boss.createQueue(queue);
    await this.boss.work<T>(queue, async (jobs: Job<T>[]) => {
      for (const job of jobs) await handler(job.data);
    });
  }

  async shutdown(): Promise<void> {
    await this.boss.stop();
  }
}
