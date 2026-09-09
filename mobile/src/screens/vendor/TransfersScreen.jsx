import { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";
import { useTransfers } from "../../hooks/useTransfers";
import { respondToTransfer } from "../../services/api";
import { Card, EmptyState, ErrorState, LoadingState, ScreenHeader, formatDate } from "../../components/ui";

export default function TransfersScreen() {
  const { user } = useAuth();
  // Shared with the Transfers tab badge (useTransfersBadge) -- same query
  // key, so accepting/declining here updates the badge immediately instead
  // of waiting for its own cache to separately go stale.
  const { data, loading, error, refetch } = useTransfers();
  const [responding, setResponding] = useState(null);

  const all = data?.transfers ?? [];

  // The server already limits this to transfers you sent or received; split
  // them so the incoming ones (which need a decision) come first.
  const incoming = useMemo(
    () => all.filter((t) => t.toUserId === user?.id && t.status === "pending"),
    [all, user],
  );
  const history = useMemo(
    () => all.filter((t) => !(t.toUserId === user?.id && t.status === "pending")),
    [all, user],
  );

  const respond = useCallback(
    async (transfer, status) => {
      setResponding(transfer.id);
      try {
        await respondToTransfer(transfer.id, status);
        await refetch();
        Alert.alert(
          status === "accepted" ? "Transfer accepted" : "Offer declined",
          status === "accepted"
            ? `${transfer.stallName} has been transferred to you. Apply for it from the Map tab to start your own contract.`
            : `You declined ${transfer.fromUserName}'s offer.`,
        );
      } catch (e) {
        Alert.alert("Could not respond", e instanceof Error ? e.message : "Please try again.");
      } finally {
        setResponding(null);
      }
    },
    [refetch],
  );

  const confirmAccept = (transfer) => {
    Alert.alert(
      "Accept this stall?",
      `${transfer.fromUserName} is offering you ${transfer.stallName}. Accepting gives up their claim on it.`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Accept", onPress: () => respond(transfer, "accepted") },
      ],
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={["top"]}>
      <ScreenHeader
        title="Transfers"
        subtitle={
          incoming.length > 0 ? `${incoming.length} offer(s) awaiting your decision` : "Stall handovers"
        }
      />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} tintColor="#14B8A6" />}
      >
        {loading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState message={error} />
        ) : all.length === 0 ? (
          <EmptyState
            title="No transfers"
            note="Offers to take over a stall — or ones you've sent — will appear here."
          />
        ) : (
          <View className="px-4 pt-4">
            {incoming.length > 0 ? (
              <>
                <Text className="mb-3 text-sm font-semibold text-gray-800">Awaiting your decision</Text>
                <View className="gap-3">
                  {incoming.map((t) => (
                    <Card key={t.id} className="overflow-hidden border-primary/40">
                      <View className="bg-primary-surface px-4 py-3">
                        <Text className="text-sm font-semibold text-gray-900">{t.stallName}</Text>
                        <Text className="mt-0.5 text-xs text-gray-500">
                          From {t.fromUserName} · Section {t.stallSection}
                        </Text>
                      </View>
                      <View className="px-4 py-3">
                        <Text className="text-xs leading-5 text-gray-600">
                          {t.fromUserName} wants to hand {t.stallName} over to you. Accepting releases their
                          claim; you then apply for it to start your own contract.
                        </Text>
                      </View>
                      <View className="flex-row gap-2 px-4 pb-4">
                        <Pressable
                          onPress={() => respond(t, "declined")}
                          disabled={responding === t.id}
                          className="flex-1 items-center rounded-xl bg-gray-100 py-3"
                        >
                          <Text className="text-xs font-semibold text-gray-700">Decline</Text>
                        </Pressable>
                        <Pressable
                          onPress={() => confirmAccept(t)}
                          disabled={responding === t.id}
                          className={`flex-[2] items-center rounded-xl py-3 ${
                            responding === t.id ? "bg-primary/50" : "bg-primary"
                          }`}
                        >
                          {responding === t.id ? (
                            <ActivityIndicator color="#ffffff" size="small" />
                          ) : (
                            <Text className="text-xs font-semibold text-white">Accept stall</Text>
                          )}
                        </Pressable>
                      </View>
                    </Card>
                  ))}
                </View>
              </>
            ) : null}

            {history.length > 0 ? (
              <>
                <Text
                  className={`mb-3 text-sm font-semibold text-gray-800 ${incoming.length > 0 ? "mt-7" : ""}`}
                >
                  History
                </Text>
                <View className="gap-3">
                  {history.map((t) => {
                    const sentByMe = t.fromUserId === user?.id;
                    return (
                      <Card key={t.id} className="p-4">
                        <View className="flex-row items-start justify-between">
                          <View className="flex-1 pr-3">
                            <Text className="text-sm font-semibold text-gray-900">{t.stallName}</Text>
                            <Text className="mt-0.5 text-xs text-gray-500">
                              {sentByMe ? `To ${t.toUserName}` : `From ${t.fromUserName}`}
                            </Text>
                          </View>
                          <TransferStatusPill status={t.status} />
                        </View>
                        <Text className="mt-3 text-[11px] text-gray-400">
                          Sent {formatDate(t.createdAt)}
                          {t.respondedAt ? ` · answered ${formatDate(t.respondedAt)}` : ""}
                        </Text>
                      </Card>
                    );
                  })}
                </View>
              </>
            ) : null}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function TransferStatusPill({ status }) {
  const style = {
    pending: { bg: "bg-amber-100", text: "text-amber-700", label: "Pending", icon: "time-outline" },
    accepted: {
      bg: "bg-emerald-100",
      text: "text-emerald-700",
      label: "Accepted",
      icon: "checkmark-circle-outline",
    },
    declined: { bg: "bg-gray-200", text: "text-gray-600", label: "Declined", icon: "close-circle-outline" },
  }[status];

  return (
    <View className={`flex-row items-center gap-1 self-start rounded-full px-2.5 py-1 ${style.bg}`}>
      <Ionicons
        name={style.icon}
        size={11}
        color={status === "accepted" ? "#047857" : status === "pending" ? "#b45309" : "#4b5563"}
      />
      <Text className={`text-[10px] font-semibold ${style.text}`}>{style.label}</Text>
    </View>
  );
}
