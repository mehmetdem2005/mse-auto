import type { TrafficEvent, TrafficRepository } from "../../domain/traffic";

/** Dev/test ikizi — süreç içi; restart'ta sıfırlanır (telemetri kritik veri değil). */
export class InMemoryTrafficRepository implements TrafficRepository {
  private readonly events: TrafficEvent[] = [];

  async record(event: TrafficEvent): Promise<void> {
    this.events.push(event);
    // Sınırsız büyüme koruması: en eski kayıtları at (≈90 gün × makul hacim üstü).
    if (this.events.length > 50_000) this.events.splice(0, this.events.length - 50_000);
  }

  async listSince(firstDay: string): Promise<TrafficEvent[]> {
    return this.events.filter((e) => e.day >= firstDay);
  }
}
