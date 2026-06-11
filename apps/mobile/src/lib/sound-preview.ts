// Ses önizleme hook'u (expo-audio) — bildirim sesi seçilirken çalmak için.
// Tek oynatıcı; kaynağı değiştirir (bellek-dostu). Web + native ortak.
// reduce-motion'a tabi DEĞİL (ses erişilebilirlik için yardımcıdır, hareket değil).
import { setAlarmConfig } from "@/lib/alarm-config";
import { SOUND_MODULES } from "@/lib/sound-modules";
import { type AudioSource, useAudioPlayer } from "expo-audio";
import { useCallback, useState } from "react";

export interface SoundPreview {
  /** Şu an önizlenen kaynağın kimliği (yerleşik id veya "custom"); yoksa null. */
  playingId: string | null;
  /** Yerleşik sesi (alarm-0xx) baştan çal. */
  play: (soundId: string) => void;
  /** Cihazdan seçilen özel ses URI'sini çal. */
  playUri: (uri: string) => void;
  /** Çalmayı durdur. */
  stop: () => void;
}

/**
 * Tek paylaşılan oynatıcıyla ses önizlemesi. `useAudioPlayer(null)` boş başlar;
 * `replace()` ile kaynağı değiştirip baştan oynatır. Hata sessiz yutulur
 * (önizleme kritik değil — örn. web'de codec / izin durumları).
 */
export function useSoundPreview(): SoundPreview {
  const player = useAudioPlayer(null);
  const [playingId, setPlayingId] = useState<string | null>(null);

  const start = useCallback(
    (id: string, source: AudioSource) => {
      try {
        player.replace(source);
        player.seekTo(0);
        player.play();
        setPlayingId(id);
      } catch {
        setPlayingId(null);
      }
    },
    [player],
  );

  const play = useCallback(
    (soundId: string) => {
      const src = SOUND_MODULES[soundId];
      if (src) start(soundId, src);
    },
    [start],
  );

  const playUri = useCallback((uri: string) => start("custom", { uri }), [start]);

  const stop = useCallback(() => {
    try {
      player.pause();
    } catch {
      /* yut */
    }
    setPlayingId(null);
  }, [player]);

  return { playingId, play, playUri, stop };
}

/** AlarmConfig kalıcılığı için yardımcı: yalnız ses alanlarını günceller. */
export async function persistSound(
  watchId: string,
  channel: "silent" | "notify" | "alarm",
  soundId: string,
  custom: { uri: string; name: string } | null,
): Promise<void> {
  await setAlarmConfig(watchId, {
    channel,
    soundId,
    customSoundUri: custom?.uri ?? null,
    customSoundName: custom?.name ?? null,
  });
}
