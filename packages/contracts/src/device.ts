import { z } from "zod";

export const registerDeviceInputSchema = z.object({
  fcmToken: z.string().min(1),
  platform: z.enum(["android", "ios"]).default("android"),
});
export type RegisterDeviceInput = z.infer<typeof registerDeviceInputSchema>;

export const deviceRegisteredSchema = z.object({
  ok: z.boolean(),
});
export type DeviceRegistered = z.infer<typeof deviceRegisteredSchema>;
