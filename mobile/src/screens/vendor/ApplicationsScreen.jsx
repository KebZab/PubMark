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
import {
  formatPermitDeadline,
  getApplicationDisplayStatus,
  getContractEndStatus,
  parsePermitDeadlineMeta,
} from "../../utils/permitDeadline";

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

  const stats = useMemo(
    () => ({
      total: mine.length,
      pending: mine.filter((a) => a.status === "pending").length,
      approved: mine.filter((a) => a.status === "approved").length,
      rejected: mine.filter((a) => a.status === "rejected").length,
    }),
    [mine],
  );

  const permitUploads = useMemo(
    () => mine.filter((a) => getApplicationDisplayStatus(a) === "approved" && !a.permitFileName),
    [mine],
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={["top"]}>
      <ScreenHeader title="My Applications" subtitle={`${mine.length} total`} />

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
          <>
            <ApplicationSummary stats={stats} filter={filter} setFilter={setFilter} />
            <EmptyState
              title={filter === "all" ? "No applications yet" : `No ${filter} applications`}
              note={filter === "all" ? "Browse the Map tab to find a stall and apply." : undefined}
            />
          </>
        ) : (
          <View className="pb-4">
            <ApplicationSummary stats={stats} filter={filter} setFilter={setFilter} />

            {permitUploads.map((app) => {
              const permitMeta = parsePermitDeadlineMeta(app.adminRemarks);
              return (
                <View
                  key={`permit-${app.id}`}
                  className="mx-4 mb-3 flex-row rounded-2xl border border-amber-300 bg-amber-50 p-4"
                >
                  <View className="h-9 w-9 items-center justify-center rounded-xl bg-amber-100">
                    <Ionicons name="cloud-upload-outline" size={18} color="#d97706" />
                  </View>
                  <View className="ml-3 flex-1">
                    <Text className="text-sm font-semibold text-amber-900">Business permit required</Text>
                    <Text className="mt-0.5 text-xs leading-5 text-amber-700">
                      Your application for {app.stallName ?? "this stall"} was approved. Upload your
                      permit to complete your records.
                    </Text>
                    {permitMeta.permitDeadlineAt ? (
                      <Text className="mt-1 text-[11px] font-semibold text-amber-800">
                        Due {formatPermitDeadline(permitMeta.permitDeadlineAt)}
                      </Text>
                    ) : null}
                    <Pressable
                      onPress={() => navigation.navigate("ApplicationDetail", { application: app })}
                      className="mt-2 self-start flex-row items-center"
                    >
                      <Ionicons name="cloud-upload-outline" size={13} color="#92400e" />
                      <Text className="ml-1 text-xs font-semibold text-amber-900">Upload permit now →</Text>
                    </Pressable>
                  </View>
                </View>
              );
            })}

            <View className="px-4">
              <Text className="mb-3 text-sm font-semibold text-gray-700">Application History</Text>
              <View className="gap-3">
                {shown.map((app) => {
                  const displayStatus = getApplicationDisplayStatus(app);
                  const permitMeta = parsePermitDeadlineMeta(app.adminRemarks);
                  const contractStatus = getContractEndStatus(app.contractEnd);
                  const contractNotice =
                    displayStatus === "approved" && contractStatus.urgency !== "none"
                      ? contractStatus.urgency === "expired"
                        ? "Contract term has ended"
                        : `Contract ends in ${contractStatus.daysRemaining} day${contractStatus.daysRemaining === 1 ? "" : "s"}`
                      : null;

                  return (
                    <Card key={app.id} className="p-4">
                      <View className="flex-row items-start">
                        <View className="h-10 w-10 items-center justify-center rounded-xl bg-primary-surface">
                          <Ionicons name="document-text-outline" size={20} color="#14B8A6" />
                        </View>
                        <View className="ml-3 flex-1">
                          <View className="flex-row items-start justify-between gap-2">
                            <Text className="flex-1 text-sm font-semibold text-gray-900" numberOfLines={1}>
                              {app.stallName ?? "Stall"}
                            </Text>
                            <StatusPill status={displayStatus} />
                          </View>
                          <Text className="mt-0.5 text-xs text-gray-400">
                            Applied {formatDate(app.dateApplied)}
                          </Text>
                          {displayStatus === "approved" && !app.permitFileName && permitMeta.permitDeadlineAt ? (
                            <Text className="mt-1 text-[10px] text-amber-700">
                              Permit due {formatPermitDeadline(permitMeta.permitDeadlineAt)}
                            </Text>
                          ) : null}
                          {contractNotice ? (
                            <Text
                              className={`mt-1 text-[10px] ${contractStatus.urgency === "notice" ? "text-amber-700" : "text-red-700"}`}
                            >
                              {contractNotice}
                            </Text>
                          ) : null}
                        </View>
                      </View>

                      <View className="mt-3 flex-row gap-2 border-t border-gray-100 pt-3">
                        <Pressable
                          onPress={() => navigation.navigate("ApplicationDetail", { application: app })}
                          className="flex-1 flex-row items-center justify-center rounded-lg bg-gray-100 py-2.5"
                        >
                          <Ionicons name="eye-outline" size={14} color="#374151" />
                          <Text className="ml-1.5 text-xs font-semibold text-gray-700">View Details</Text>
                        </Pressable>
                        {displayStatus === "approved" && !app.permitFileName ? (
                          <Pressable
                            onPress={() => navigation.navigate("ApplicationDetail", { application: app })}
                            className="flex-1 flex-row items-center justify-center rounded-lg bg-amber-400 py-2.5"
                          >
                            <Ionicons name="cloud-upload-outline" size={14} color="#ffffff" />
                            <Text className="ml-1.5 text-xs font-semibold text-white">Upload Permit</Text>
                          </Pressable>
                        ) : null}
                      </View>
                    </Card>
                  );
                })}
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function ApplicationSummary({ stats, filter, setFilter }) {
  return (
    <View className="px-4 py-4">
      <View className="flex-row gap-2">
        {[
          { key: "all", label: "Total", value: stats.total, color: "text-gray-900" },
          { key: "pending", label: "Pending", value: stats.pending, color: "text-amber-500" },
          { key: "approved", label: "Approved", value: stats.approved, color: "text-emerald-500" },
          { key: "rejected", label: "Rejected", value: stats.rejected, color: "text-red-500" },
        ].map((item) => (
          <Pressable key={item.key} onPress={() => setFilter(item.key)} className="flex-1">
            <Card
              className={`items-center py-3 ${filter === item.key ? "border-primary bg-primary-surface" : ""}`}
            >
              <Text className={`text-lg font-bold ${item.color}`}>{item.value}</Text>
              <Text className="mt-0.5 text-[10px] text-gray-500">{item.label}</Text>
            </Card>
          </Pressable>
        ))}
      </View>

      <View className="mt-3 flex-row gap-2">
        {FILTERS.map((item) => (
          <Pressable
            key={item}
            onPress={() => setFilter(item)}
            className={`rounded-full px-3 py-1.5 ${filter === item ? "bg-primary" : "bg-gray-100"}`}
          >
            <Text
              className={`text-xs font-semibold capitalize ${filter === item ? "text-white" : "text-gray-600"}`}
            >
              {item}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
