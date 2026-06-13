import { toast } from "@/components/feedback";
import { ActBtn, ConsoleShell, ErrText, Loading, day } from "@/features/admin/ui";
import { type Announcement, type AnnouncementInput, type AnnouncementKind, api } from "@/lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, EyeOff, Image as ImageIcon, Pin, Trash2 } from "lucide-react-native";
import { type ReactNode, useState } from "react";
import { Image, Pressable, ScrollView, Switch, Text, TextInput, View } from "react-native";

const KINDS: { id: AnnouncementKind; label: string; color: string }[] = [
  { id: "info", label: "Bilgi", color: "#6366F1" },
  { id: "update", label: "Güncelleme", color: "#16A34A" },
  { id: "promo", label: "Kampanya", color: "#8B5CF6" },
  { id: "warning", label: "Uyarı", color: "#B45309" },
];

const EMPTY: AnnouncementInput = {
  title: "",
  body: "",
  kind: "info",
  imageUrl: null,
  ctaLabel: null,
  ctaUrl: null,
  pinned: false,
  published: true,
};

export default function AdminAnnouncementsScreen(): ReactNode {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["adminAnnouncements"], queryFn: api.adminAnnouncements });
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<AnnouncementInput>(EMPTY);
  const set = <K extends keyof AnnouncementInput>(k: K, v: AnnouncementInput[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const done = (msg: string) => {
    void qc.invalidateQueries({ queryKey: ["adminAnnouncements"] });
    void qc.invalidateQueries({ queryKey: ["announcements"] });
    toast.success(msg);
  };
  const reset = () => {
    setEditId(null);
    setForm(EMPTY);
  };

  const save = useMutation({
    mutationFn: () =>
      editId ? api.updateAnnouncement(editId, form) : api.createAnnouncement(form),
    onSuccess: () => {
      done(editId ? "Duyuru güncellendi" : "Duyuru yayınlandı");
      reset();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "kaydedilemedi"),
  });
  const toggle = useMutation({
    mutationFn: (v: { id: string; patch: Partial<AnnouncementInput> }) =>
      api.updateAnnouncement(v.id, v.patch),
    onSuccess: () => done("Güncellendi"),
  });
  const del = useMutation({
    mutationFn: (id: string) => api.deleteAnnouncement(id),
    onSuccess: () => {
      done("Silindi");
      if (editId) reset();
    },
  });

  const canSave = form.title.trim().length >= 2 && form.body.trim().length >= 2 && !save.isPending;

  function startEdit(a: Announcement) {
    setEditId(a.id);
    setForm({
      title: a.title,
      body: a.body,
      kind: a.kind,
      imageUrl: a.imageUrl,
      ctaLabel: a.ctaLabel,
      ctaUrl: a.ctaUrl,
      pinned: a.pinned,
      published: a.published,
    });
  }

  return (
    <ConsoleShell title="Duyurular" sub={editId ? "düzenle" : "oluştur"}>
      <ScrollView className="flex-1" contentContainerClassName="px-5 pt-4 pb-12">
        {/* ---------- Besteci ---------- */}
        <View className="bg-panel border border-line rounded-2xl p-4">
          <Text className="text-muted text-[10px] uppercase tracking-widest mb-2">
            {editId ? "duyuruyu düzenle" : "yeni duyuru"}
          </Text>

          <Field label="Başlık">
            <TextInput
              value={form.title}
              onChangeText={(v) => set("title", v)}
              placeholder="Örn: Google ile giriş geldi"
              placeholderTextColor="#94A3B8"
              accessibilityLabel="Duyuru başlığı"
              className="bg-ink border border-line rounded-lg px-3 py-2.5 text-text"
            />
          </Field>

          <Field label="Metin">
            <TextInput
              value={form.body}
              onChangeText={(v) => set("body", v)}
              multiline
              placeholder="Duyuru metnini yaz…"
              placeholderTextColor="#94A3B8"
              accessibilityLabel="Duyuru metni"
              className="bg-ink border border-line rounded-lg px-3 py-2.5 text-text min-h-[88px]"
              style={{ textAlignVertical: "top" }}
            />
          </Field>

          <Field label="Tür">
            <View className="flex-row flex-wrap gap-2">
              {KINDS.map((k) => {
                const on = form.kind === k.id;
                return (
                  <Pressable
                    key={k.id}
                    onPress={() => set("kind", k.id)}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: on }}
                    className="rounded-full px-3 py-2 min-h-[36px] justify-center border"
                    style={{
                      borderColor: on ? k.color : "#2B3A57",
                      backgroundColor: on ? `${k.color}1A` : "transparent",
                    }}
                  >
                    <Text
                      className="text-xs font-semibold"
                      style={{ color: on ? k.color : "#94A3B8" }}
                    >
                      {k.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </Field>

          <Field label="Görsel URL (opsiyonel)">
            <TextInput
              value={form.imageUrl ?? ""}
              onChangeText={(v) => set("imageUrl", v.trim() ? v.trim() : null)}
              autoCapitalize="none"
              keyboardType="url"
              placeholder="https://… (https zorunlu)"
              placeholderTextColor="#94A3B8"
              accessibilityLabel="Görsel adresi"
              className="bg-ink border border-line rounded-lg px-3 py-2.5 text-text"
            />
            {form.imageUrl ? (
              <Image
                source={{ uri: form.imageUrl }}
                accessibilityIgnoresInvertColors
                accessibilityLabel="Görsel önizleme"
                resizeMode="cover"
                style={{ width: "100%", aspectRatio: 16 / 9, borderRadius: 10, marginTop: 8 }}
              />
            ) : (
              <View className="flex-row items-center gap-2 mt-2">
                <ImageIcon size={13} color="#94A3B8" />
                <Text className="text-muted2 text-[11px]">
                  Genel erişilebilir bir görsel adresi yapıştır (önizleme burada görünür).
                </Text>
              </View>
            )}
          </Field>

          <View className="flex-row gap-2">
            <View className="flex-1">
              <Field label="Buton metni (ops.)">
                <TextInput
                  value={form.ctaLabel ?? ""}
                  onChangeText={(v) => set("ctaLabel", v.trim() ? v : null)}
                  placeholder="Örn: Hemen dene"
                  placeholderTextColor="#94A3B8"
                  accessibilityLabel="Buton metni"
                  className="bg-ink border border-line rounded-lg px-3 py-2.5 text-text"
                />
              </Field>
            </View>
            <View className="flex-1">
              <Field label="Buton adresi (ops.)">
                <TextInput
                  value={form.ctaUrl ?? ""}
                  onChangeText={(v) => set("ctaUrl", v.trim() ? v.trim() : null)}
                  autoCapitalize="none"
                  keyboardType="url"
                  placeholder="https://…"
                  placeholderTextColor="#94A3B8"
                  accessibilityLabel="Buton adresi"
                  className="bg-ink border border-line rounded-lg px-3 py-2.5 text-text"
                />
              </Field>
            </View>
          </View>

          <View className="flex-row items-center justify-between mt-1 py-2">
            <View className="flex-row items-center gap-2">
              <Pin size={15} color="#818CF8" />
              <Text className="text-text text-sm">Sabitle (en üstte göster)</Text>
            </View>
            <Switch value={form.pinned} onValueChange={(v) => set("pinned", v)} />
          </View>
          <View className="flex-row items-center justify-between py-2 border-t border-line">
            <View className="flex-row items-center gap-2">
              {form.published ? (
                <Eye size={15} color="#16A34A" />
              ) : (
                <EyeOff size={15} color="#94A3B8" />
              )}
              <Text className="text-text text-sm">
                {form.published ? "Yayında (kullanıcılar görür)" : "Taslak (gizli)"}
              </Text>
            </View>
            <Switch value={form.published} onValueChange={(v) => set("published", v)} />
          </View>

          <View className="flex-row gap-2 mt-3">
            <ActBtn
              label={editId ? "güncelle" : "yayınla"}
              tone="solid"
              disabled={!canSave}
              onPress={() => save.mutate()}
            />
            {editId ? <ActBtn label="vazgeç" onPress={reset} /> : null}
          </View>
        </View>

        {/* ---------- Mevcut duyurular ---------- */}
        <Text className="text-muted text-[10px] uppercase tracking-widest mt-6 mb-2">
          mevcut duyurular
        </Text>
        {q.isLoading ? <Loading /> : null}
        {q.error ? <ErrText e={q.error} /> : null}
        {q.data?.length === 0 ? (
          <Text className="text-muted text-sm">Henüz duyuru yok.</Text>
        ) : null}
        {q.data?.map((a) => {
          const meta = KINDS.find((k) => k.id === a.kind);
          return (
            <Pressable
              key={a.id}
              onPress={() => startEdit(a)}
              accessibilityRole="button"
              accessibilityLabel={`Düzenle: ${a.title}`}
              className={`bg-panel border rounded-xl p-4 mb-2.5 ${editId === a.id ? "border-accent" : "border-line"} active:bg-panel2`}
            >
              <View className="flex-row items-center gap-2 mb-1">
                <View
                  className="px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: `${meta?.color ?? "#6366F1"}1A` }}
                >
                  <Text
                    className="text-[10px] font-bold"
                    style={{ color: meta?.color ?? "#6366F1" }}
                  >
                    {meta?.label ?? a.kind}
                  </Text>
                </View>
                {a.pinned ? <Pin size={12} color="#818CF8" /> : null}
                <View
                  className={`px-2 py-0.5 rounded-full ${a.published ? "bg-pos/10" : "bg-panel2"}`}
                >
                  <Text
                    className="text-[10px] font-semibold"
                    style={{ color: a.published ? "#16A34A" : "#94A3B8" }}
                  >
                    {a.published ? "yayında" : "taslak"}
                  </Text>
                </View>
                <Text className="text-muted2 text-[11px] ml-auto">{day(a.createdAt)}</Text>
              </View>
              <Text className="text-text text-sm font-semibold" numberOfLines={1}>
                {a.title}
              </Text>
              <Text className="text-muted text-xs mt-0.5" numberOfLines={2}>
                {a.body}
              </Text>
              <View className="flex-row flex-wrap gap-2 mt-3">
                <ActBtn
                  label={a.published ? "yayından al" : "yayınla"}
                  onPress={() => toggle.mutate({ id: a.id, patch: { published: !a.published } })}
                />
                <ActBtn
                  label={a.pinned ? "sabiti kaldır" : "sabitle"}
                  onPress={() => toggle.mutate({ id: a.id, patch: { pinned: !a.pinned } })}
                />
                <ActBtn label="sil" tone="danger" onPress={() => del.mutate(a.id)} />
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    </ConsoleShell>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }): ReactNode {
  return (
    <View className="mb-3">
      <Text className="text-muted text-xs mb-1.5">{label}</Text>
      {children}
    </View>
  );
}
