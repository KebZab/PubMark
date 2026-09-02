import { useCallback, useMemo, useState } from "react";
import { RefreshControl, ScrollView, Text, View, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "../../context/AuthContext";
import { useApiData } from "../../hooks/useApiData";
import { getApplications } from "../../services/api";
import {
  Card,
  EmptyState,
  ErrorState,
  LoadingState,
  ScreenHeader,
  StatusPill,
  formatDate,
} from "../../components/ui";

const FILTERS = ["all", "pending", "approved", "rejected"];

export default function ApplicationsScreen({ navigation }) {
  const { user } = useAuth();
  const { data, loading, error, refetch } = useApiData(getApplications);

  // Kept mounted while you're on another tab, so this stays stale until a
  // manual pull-to-refresh unless refetched on every return to this tab.
  useFocusEffect(
    useCallback(() => {
      refetch();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );
  const [filter, setFilter] = useState("all");

  const mine = useMemo(() => {
    if (!data?.applications || !user) return [];
    return data.applications
      .filter((a) => a.userId === user.id)
      .sort((a, b) => new Date(b.dateApplied).getTime() - new Date(a.dateApplied).getTime());
  }, [data, user]);

  const shown = useMemo(
    () => (filter === "all" ? mine : mine.filter((a) => a.status === filter)),
    [mine, filter],
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={["top"]}>
      <ScreenHeader title="My Applications" subtitle={`${mine.length} total`} />

      {/* Status filter chips */}
      <View className="flex-row gap-2 border-b border-gray-200 bg-white px-4 pb-3">
        {FILTERS.map((f) => {
          const active = filter === f;
          return (
            <Pressable
              key={f}
              onPress={() => setFilter(f)}
              className={`rounded-full px-3 py-1.5 ${active ? "bg-primary" : "bg-gray-100"}`}
            >
              <Text className={`text-xs font-semibold capitalize ${active ? "text-white" : "text-gray-600"}`}>
                {f}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} tintColor="#14B8A6" />}
      >
        {loading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState message={error} />
        ) : shown.length === 0 ? (
          <EmptyState
            title={filter === "all" ? "No applications yet" : `No ${filter} applications`}
            note={filter === "all" ? "Browse the Map tab to find a stall and apply." : undefined}
          />
        ) : (
          <View className="gap-3 px-4 pt-4">
            {shown.map((app) => (
              <Pressable
                key={app.id}
                onPress={() => navigation.navigate("ApplicationDetail", { application: app })}
              >
                <Card className="p-4">
                  <View className="flex-row items-start justify-between">
                    <View className="flex-1 pr-3">
                      <View className="flex-row items-center gap-1">
                        <Text className="text-sm font-semibold text-gray-900">
                          {app.stallName ?? "Stall"}
                        </Text>
                        <Ionicons name="chevron-forward" size={13} color="#9ca3af" />
                      </View>
                      <Text className="mt-0.5 text-xs text-gray-500">
                        {app.businessName} · {app.businessType}
                      </Text>
                    </View>
                    <StatusPill status={app.status} />
                  </View>

                  <View className="mt-3 border-t border-gray-100 pt-3">
                    <Row label="Section" value={app.stallSection ?? "—"} />
                    <Row
                      label="Contract"
                      value={`${formatDate(app.contractStart)} → ${formatDate(app.contractEnd)}`}
                    />
                    <Row label="Term" value={`${app.contractTermMonths} months`} />
                    <Row label="Permit" value={app.permitFileName ?? "Not submitted"} />
                    <Row label="Applied" value={formatDate(app.dateApplied)} />
                  </View>

                  {app.adminRemarks ? (
                    <View className="mt-3 rounded-xl bg-gray-50 px-3 py-2.5">
                      <Text className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                        Admin remarks
                      </Text>
                      <Text className="mt-1 text-xs leading-5 text-gray-600">{app.adminRemarks}</Text>
                    </View>
                  ) : null}
                </Card>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({ label, value }) {
  return (
    <View className="flex-row justify-between py-1">
      <Text className="text-xs text-gray-400">{label}</Text>
      <Text className="flex-1 text-right text-xs font-medium text-gray-700" numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}
