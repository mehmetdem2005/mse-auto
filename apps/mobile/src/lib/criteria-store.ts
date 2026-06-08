import AsyncStorage from "@react-native-async-storage/async-storage";
import type { PersonalCriterion } from "../domain/personal";

/**
 * Kişisel kriter deposu — CİHAZDA (ADR-015 gizlilik değişmezi).
 * Kriterler sunucuya gönderilmez; watch oluşturulduktan sonra dönen watchId ile
 * burada saklanır ve gelen push facts'i bunlara karşı yerelde değerlendirilir.
 */
const key = (watchId: string): string => `watcher:criterion:${watchId}`;

export async function setCriterion(watchId: string, criterion: PersonalCriterion): Promise<void> {
  await AsyncStorage.setItem(key(watchId), JSON.stringify(criterion));
}

export async function getCriterion(watchId: string): Promise<PersonalCriterion | null> {
  const raw = await AsyncStorage.getItem(key(watchId));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PersonalCriterion;
  } catch {
    return null;
  }
}

export async function removeCriterion(watchId: string): Promise<void> {
  await AsyncStorage.removeItem(key(watchId));
}
