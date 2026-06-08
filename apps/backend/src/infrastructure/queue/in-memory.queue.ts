import type { JobQueue } from "../../domain/queue";

export class InMemoryJobQueue implements JobQueue {
  private readonly handlers = new Map<string, (data: unknown) => Promise<void>>();
  private readonly pending: Array<{ queue: string; data: unknown }> = [];

  async init(): Promise<void> {}

  async enqueue<T extends object>(queue: string, data: T): Promise<void> {
    this.pending.push({ queue, data });
  }

  async process<T extends object>(
    queue: string,
    handler: (data: T) => Promise<void>,
  ): Promise<void> {
    this.handlers.set(queue, handler as (d: unknown) => Promise<void>);
  }

  /** Dev/test: bekleyen tüm işleri sırayla işle. */
  async drain(): Promise<void> {
    for (;;) {
      const job = this.pending.shift();
      if (!job) break;
      const handler = this.handlers.get(job.queue);
      if (handler) await handler(job.data);
    }
  }

  async shutdown(): Promise<void> {}
}
