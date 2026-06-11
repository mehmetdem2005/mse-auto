import type { ChannelSender, UserChannelRepository } from "../domain/channels";
import { resolveTargets } from "../domain/channels";
import type { DeviceRepository } from "../domain/device";
import type { MonitoringRepository } from "../domain/monitoring";
import type { Notifier } from "../domain/notifier";
import type { EventFacts } from "../domain/personal";
import type { JobQueue } from "../domain/queue";

export const DELIVERY_QUEUE = "delivery-dispatch";

export interface DeliveryJob {
  eventId: string;
  title: string;
  body: string;
  facts?: EventFacts | null;
}

export interface DeliveryDeps {
  monitoring: MonitoringRepository;
  devices: DeviceRepository;
  notifier: Notifier;
  /** Ek kanallar (ADR-084) — opsiyonel: yoksa yalnız push. */
  channels?: ChannelSender[] | undefined;
  userChannels?: UserChannelRepository | undefined;
}

/** Bir olayın bekleyen teslimlerini gönderir: token bul → push → işaretle. */
export async function dispatchEventDeliveries(
  deps: DeliveryDeps,
  job: DeliveryJob,
): Promise<{ sent: number; failed: number }> {
  const pending = await deps.monitoring.listPendingDeliveriesForEvent(job.eventId);
  let sent = 0;
  let failed = 0;
  for (const delivery of pending) {
    const tokens = await deps.devices.listTokens(delivery.userId);
    if (tokens.length === 0) {
      await deps.monitoring.markDeliveryStatus(delivery.id, "failed");
      failed++;
      continue;
    }
    const data: Record<string, string> = {
      watchId: delivery.watchId,
      eventId: job.eventId,
      title: job.title,
      body: job.body,
    };
    if (job.facts) data.facts = JSON.stringify(job.facts);
    // Arketip-B (ADR-015): kişisel teslimde cihaz yereldeki kriterle değerlendirir → data-only.
    // FCM adapter'ı gate="1" görünce görünür bildirim yerine data-only mesaj göndermeli.
    if (delivery.archetype === "personal") data.gate = "1";
    let anySuccess = false;
    for (const token of tokens) {
      const result = await deps.notifier.send({ token, title: job.title, body: job.body, data });
      if (result.success) anySuccess = true;
    }
    // Ek kanallar (ADR-084): YALNIZ paylaşılan (shared) teslimlerde sunucu-tarafı
    // gönderim yapılır. Kişisel (personal) teslimde eşleşme kararı CİHAZDA verilir
    // (gate=1) → sunucu kriteri bilmez; e-posta/telegram'a göndermek cihazın
    // bastıracağı bir uyarıyı sızdırırdı. Bu yüzden personal'da ek kanal ATLANIR.
    if (delivery.archetype !== "personal" && deps.channels && deps.userChannels) {
      const prefs = await deps.userChannels.get(delivery.userId);
      for (const { kind, target } of resolveTargets(prefs)) {
        const sender = deps.channels.find((c) => c.kind === kind);
        if (!sender) continue;
        const r = await sender.send(target, { title: job.title, body: job.body });
        if (r.success) anySuccess = true;
      }
    }
    await deps.monitoring.markDeliveryStatus(delivery.id, anySuccess ? "sent" : "failed");
    if (anySuccess) sent++;
    else failed++;
  }
  return { sent, failed };
}

export interface DeliveryWorkerDeps extends DeliveryDeps {
  queue: JobQueue;
}

/** Worker: kuyruktaki teslim job'larını işler. */
export async function registerDeliveryWorker(deps: DeliveryWorkerDeps): Promise<void> {
  await deps.queue.process<DeliveryJob>(DELIVERY_QUEUE, async (job) => {
    await dispatchEventDeliveries(deps, job);
  });
}
