import { toast } from "@/components/feedback";
import { ActBtn, ConsoleShell } from "@/features/admin/ui";
import { type AdminBroadcastResult, type BroadcastSegment, api } from "@/lib/api";
import { useMutation } from "@tanstack/react-query";
import { Send } from "lucide-react-native";
import { type ReactNode, useState } from "react";
import { Alert, Pressable, ScrollView, Text, TextInput, View } from "react-native";

const SEGMENTS: { id: BroadcastSegment; label: string }[] = [
  { id: "all", label: "Herkes" },
  { id: "free", label: "Ücretsiz" },
  { id: "pro", label: "Pro" },
];

// ADR-104: admin push yayını — segment seç, yaz, önizle, onayla, gönder.
export default function BroadcastScreen(): ReactNode {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [segment, setSegment] = useState<BroadcastSegment>("all");
  const [result, setResult] = useState<AdminBroadcastResult | null>(null);

  const send = useMutation({
    mutationFn: () => api.adminBroadcast({ title: title.trim(), body: body.trim(), segment }),
    onSuccess: (r) => {
      setResult(r);
      if (r.channel === "inactive") toast.error("Push kanalı pasif (FCM yok)");
      else toast.success(`${r.sent}/${r.recipients} cihaza gönderildi`);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "gönderilemedi"),
  });

  const canSend = title.trim().length >= 2 && body.trim().length >= 2 && !send.isPending;
  const segLabel = SEGMENTS.find((s) => s.id === segment)?.label ?? "Herkes";

  // Dışa-dönük işlem: gerçek kullanıcılara push gider → önce onay iste.
  const confirmSend = (): void => {
    Alert.alert(
      "Push yayını gönder",
      `"${title.trim()}" bildirimi ${segLabel} segmentine gönderilsin mi?`,
      [
        { text: "Vazgeç", style: "cancel" },
        { text: "Gönder", onPress: () => send.mutate() },
      ],
    );
  };

  return (
    <ConsoleShell title="Push Yayını" sub={segLabel}>
      <ScrollView className="flex-1" contentContainerClassName="px-5 pt-4 pb-12">
        <View className="bg-panel border border-line rounded-2xl p-4">
          <Text className="text-muted text-xs mb-1.5">Hedef segment</Text>
          <View
            accessibilityRole="radiogroup"
            accessibilityLabel="Hedef segment"
            className="flex-row gap-2 mb-3"
          >
            {SEGMENTS.map((s) => {
              const on = s.id === segment;
              return (
                <Pressable
                  key={s.id}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: on }}
                  accessibilityLabel={s.label}
                  onPress={() => setSegment(s.id)}
                  className={`flex-1 rounded-full px-3 py-2.5 min-h-11 items-center justify-center ${on ? "bg-accent" : "border border-line"}`}
                >
                  <Text
                    className="text-xs font-semibold"
                    style={{ color: on ? "#FFFFFF" : "#94A3B8" }}
                  >
                    {s.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text className="text-muted text-xs mb-1.5">Başlık</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Örn: Yeni özellik geldi"
            placeholderTextColor="#94A3B8"
            maxLength={80}
            accessibilityLabel="Bildirim başlığı"
            className="bg-ink border border-line rounded-lg px-3 py-2.5 text-text mb-3"
          />

          <Text className="text-muted text-xs mb-1.5">Metin</Text>
          <TextInput
            value={body}
            onChangeText={setBody}
            multiline
            maxLength={240}
            placeholder="Bildirim metnini yaz…"
            placeholderTextColor="#94A3B8"
            accessibilityLabel="Bildirim metni"
            className="bg-ink border border-line rounded-lg px-3 py-2.5 text-text min-h-[88px]"
            style={{ textAlignVertical: "top" }}
          />

          <Text className="text-muted text-[10px] uppercase tracking-widest mt-4 mb-2">
            önizleme
          </Text>
          <View className="flex-row items-start gap-3 bg-ink border border-line rounded-xl p-3">
            <View className="w-9 h-9 rounded-lg bg-accent/15 items-center justify-center">
              <Send size={16} color="#6366F1" />
            </View>
            <View className="flex-1 min-w-0">
              <Text className="text-text text-sm font-semibold" numberOfLines={1}>
                {title.trim() || "Bildirim başlığı"}
              </Text>
              <Text className="text-muted text-xs mt-0.5" numberOfLines={3}>
                {body.trim() || "Bildirim metni burada görünür."}
              </Text>
            </View>
          </View>

          <View className="mt-4">
            <ActBtn label="yayını gönder" tone="solid" disabled={!canSend} onPress={confirmSend} />
          </View>
        </View>

        {result ? (
          <View
            className={`border rounded-xl p-4 mt-4 ${result.channel === "inactive" ? "bg-neg/10 border-neg/30" : "bg-pos/10 border-pos/30"}`}
          >
            {result.channel === "inactive" ? (
              <Text className="text-neg text-sm leading-5">
                Push kanalı PASİF — FCM (FCM_PROJECT_ID + servis hesabı) yapılandırılmadığı için
                bildirim gerçekten gönderilmedi.
              </Text>
            ) : (
              <Text className="text-pos text-sm leading-5">
                {result.sent}/{result.recipients} cihaza gönderildi
                {result.failed > 0 ? ` · ${result.failed} başarısız` : ""} ({segLabel}).
              </Text>
            )}
          </View>
        ) : null}

        <Text className="text-muted text-[11px] mt-4 leading-4">
          Bildirim yalnız push token'ı kayıtlı cihazlara gider; segment abonelik planına göre (aktif
          Pro / ücretsiz) ayrılır.
        </Text>
      </ScrollView>
    </ConsoleShell>
  );
}
