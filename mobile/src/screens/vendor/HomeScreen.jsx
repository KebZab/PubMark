import { useCallback, useMemo } from "react";
import { RefreshControl, ScrollView, Text, View, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "../../context/AuthContext";
import { useApiData } from "../../hooks/useApiData";
import { getApplications } from "../../services/api";
import { Card, ErrorState, LoadingState, StatusPill, formatDate } from "../../components/ui";

export default function HomeScreen() {
  const { user, signOut } = useAuth();
  const { data, loading, error, refetch } = useApiData(getApplications);

  // Kept mounted while you're on another tab, so this stays stale until a
  // manual pull-to-refresh unless refetched on every return to this tab.
  useFocusEffect(
    useCallback(() => {
      refetch();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  // The /applications endpoint returns every application; a vendor should only
  // ever see their own, so filter client-side by the logged-in user's id.
  const mine = useMemo(() => {
    if (!data?.applications || !user) return [];
    return data.applications.filter((a) => a.userId === user.id);
  }, [data, user]);

  const stats = useMemo(
    () => ({
      total: mine.length,
      pending: mine.filter((a) => a.status === "pending").length,
      approved: mine.filter((a) => a.status === "approved").length,
      rejected: mine.filter((a) => a.status === "rejected").length,
    }),
    [mine],
  );

  const recent = useMemo(
    () =>
      [...mine]
        .sort((a, b) => new Date(b.dateApplied).getTime() - new Date(a.dateApplied).getTime())
        .slice(0, 5),
    [mine],
  );

  const firstName = user?.name?.split(" ")[0] ?? "";

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={["top"]}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} tintColor="#14B8A6" />}
      >
        {/* Hero — mirrors the web dashboard's teal gradient banner */}
        <View className="mx-4 mt-4 overflow-hidden rounded-2xl bg-primary-dark p-5">
          <Text className="text-xs font-medium text-primary-light">PubMark — Smart Public Market</Text>
          <Text className="mt-2 text-lg font-bold leading-snug text-white">Good day, {firstName}! 👋</Text>
          <Text className="mt-1 text-xs text-primary-light">Here's a summary of your stall activity.</Text>
        </View>

        {loading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState message={error} />
        ) : (
          <>
            {/* Stats row — same four counts as web */}
            <View className="mt-4 flex-row gap-2 px-4">
              {[
                { label: "Total", value: stats.total, color: "text-gray-900" },
                { label: "Pending", value: stats.pending, color: "text-amber-500" },
                { label: "Approved", value: stats.approved, color: "text-emerald-500" },
                { label: "Rejected", value: stats.rejected, color: "text-red-500" },
              ].map((s) => (
                <Card key={s.label} className="flex-1 items-center py-3">
                  <Text className={`text-lg font-bold ${s.color}`}>{s.value}</Text>
                  <Text className="mt-0.5 text-[10px] text-gray-500">{s.label}</Text>
                </Card>
              ))}
            </View>

            <View className="mt-6 px-4">
              <Text className="mb-3 text-sm font-semibold text-gray-800">Recent Applications</Text>

              {recent.length === 0 ? (
                <Card className="items-center px-5 py-10">
                  <Text className="text-sm font-semibold text-gray-700">No applications yet</Text>
                  <Text className="mt-1.5 text-center text-xs leading-5 text-gray-400">
                    Browse the Map tab to find a stall and apply.
                  </Text>
                </Card>
              ) : (
                <View className="gap-3">
                  {recent.map((app) => (
                    <Card key={app.id} className="p-4">
                      <View className="flex-row items-start justify-between">
                        <View className="flex-1 pr-3">
                          <Text className="text-sm font-semibold text-gray-900" numberOfLines={1}>
                            {app.stallName ?? "Stall"}
                          </Text>
                          <Text className="mt-0.5 text-xs text-gray-500" numberOfLines={1}>
                            {app.businessName} · {app.businessType}
                          </Text>
                        </View>
                        <StatusPill status={app.status} />
                      </View>
                      <Text className="mt-3 text-[11px] text-gray-400">
                        Applied {formatDate(app.dateApplied)}
                      </Text>
                    </Card>
                  ))}
                </View>
              )}
            </View>
          </>
        )}

        <Pressable
          onPress={signOut}
          className="mx-4 mt-8 items-center rounded-xl border border-gray-200 bg-white py-3.5"
        >
          <Text className="text-sm font-semibold text-status-rejected">Sign out</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
