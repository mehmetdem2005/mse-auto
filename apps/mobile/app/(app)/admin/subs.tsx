import { ConsoleShell, Empty, ErrText, Loading, day, money } from "@/features/admin/ui";
import { type AdminSubscription, api } from "@/lib/api";
import { qk } from "@/lib/query";
import { useQuery } from "@tanstack/react-query";
import { CreditCard } from "lucide-react-native";
import type { ReactNode } from "react";
import { FlatList, Text, View } from "react-native";

export default function SubsScreen(): ReactNode {
  const q = useQuery({ queryKey: qk.adminSubscriptions, queryFn: api.adminSubscriptions });
  return (
    <ConsoleShell title="Abonelik" sub="tüm aboneler">
      {q.isLoading ? <Loading /> : null}
      {q.error ? <ErrText e={q.error} /> : null}
      {q.data ? (
        <FlatList
          data={q.data}
          keyExtractor={(s) => s.userId}
          contentContainerClassName="px-5 pt-4 pb-8"
          onRefresh={() => void q.refetch()}
          refreshing={q.isRefetching}
          ItemSeparatorComponent={() => <View className="h-3" />}
          ListEmptyComponent={
            <Empty
              Icon={CreditCard}
              title="Abonelik yok"
              hint="Pro'ya geçen kullanıcılar burada listelenir."
            />
          }
          renderItem={({ item: s }: { item: AdminSubscription }) => (
            <View className="bg-panel border border-line rounded-xl p-4">
              <View className="flex-row justify-between">
                <Text className="text-text text-sm" numberOfLines={1}>
                  {s.userEmail ?? s.userId}
                </Text>
                <Text
                  className="text-xs"
                  style={{ color: s.status === "active" ? "#16A34A" : "#64748B" }}
                >
                  {s.status === "active" ? "aktif" : "iptal"}
                </Text>
              </View>
              <Text className="text-muted text-xs mt-1">
                {s.plan.toUpperCase()} ·{" "}
                {s.interval ? (s.interval === "month" ? "aylık" : "yıllık") : "—"} ·{" "}
                {s.amountCents !== null ? money(s.amountCents, s.currency) : "—"}
                {s.cancelAtPeriodEnd ? " · dönem sonu iptal" : ""}
                {s.currentPeriodEnd ? ` · ${day(s.currentPeriodEnd)}` : ""}
              </Text>
            </View>
          )}
        />
      ) : null}
    </ConsoleShell>
  );
}
