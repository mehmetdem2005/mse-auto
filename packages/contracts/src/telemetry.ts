import { z } from "zod";

/**
 * Trafik telemetrisi (ADR-091) — KİMLİKSİZ, toplama-amaçlı edinim sinyali.
 * P1/gizlilik: kullanıcı kimliği, IP, tam URL, user-agent SAKLANMAZ; yalnız
 * kaynak türü + yönlendiren alan adı + utm etiketi + yol + dil + platform.
 */
export const trafficSourceSchema = z.enum(["site", "app"]);
export type TrafficSource = z.infer<typeof trafficSourceSchema>;

export const trafficEventInputSchema = z.object({
  source: trafficSourceSchema,
  /** Sayfa yolu (yalnız path, query yok). */
  path: z.string().max(120).optional(),
  /** Yönlendiren ALAN ADI (tam URL değil — istemci kırpar, sunucu yine doğrular). */
  ref: z.string().max(120).optional(),
  /** utm_source etiketi (varsa). */
  utm: z.string().max(60).optional(),
  /** Arayüz/sayfa dili. */
  lang: z.string().max(8).optional(),
  /** İstemci platformu. */
  platform: z.enum(["web", "android", "ios"]).optional(),
});
export type TrafficEventInput = z.infer<typeof trafficEventInputSchema>;

/** Admin trafik özeti: gün-gün seri + en çok görülen kaynaklar (site/app ayrı). */
export const trafficDayPointSchema = z.object({
  date: z.string(), // YYYY-MM-DD
  site: z.number().int(),
  app: z.number().int(),
});
export const trafficTopItemSchema = z.object({
  key: z.string(), // ref alanı / utm / path / lang / platform değeri
  count: z.number().int(),
});
export const trafficBreakdownSchema = z.object({
  total: z.number().int(),
  refs: z.array(trafficTopItemSchema),
  utms: z.array(trafficTopItemSchema),
  paths: z.array(trafficTopItemSchema),
  langs: z.array(trafficTopItemSchema),
  platforms: z.array(trafficTopItemSchema),
});
export const adminTrafficSchema = z.object({
  days: z.array(trafficDayPointSchema),
  site: trafficBreakdownSchema,
  app: trafficBreakdownSchema,
});
export type AdminTraffic = z.infer<typeof adminTrafficSchema>;
