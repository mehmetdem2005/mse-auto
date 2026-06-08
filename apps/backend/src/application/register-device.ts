import type { DeviceRegistered, RegisterDeviceInput } from "@watcher/contracts";
import type { DeviceRepository } from "../domain/device";

export async function registerDevice(
  deps: { devices: DeviceRepository },
  userId: string,
  input: RegisterDeviceInput,
): Promise<DeviceRegistered> {
  await deps.devices.save({ userId, token: input.fcmToken, platform: input.platform });
  return { ok: true };
}
