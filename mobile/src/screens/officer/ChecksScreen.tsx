import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useApiData } from "../../hooks/useApiData";
import { getCheckRequests, updateCheckRequest } from "../../services/api";
import { Card, EmptyState, ErrorState, LoadingState, formatDate } from "../../components/ui";
import type { CheckPriority, CheckRequest, EvidenceFile } from "../../services/types";

const PRIORITY_STYLE: Record<CheckPriority, { bg: string; text: string }> = {
  urgent: { bg: "bg-red-100", text: "text-red-700" },
  high: { bg: "bg-orange-100", text: "text-orange-700" },
  normal: { bg: "bg-blue-100", text: "text-blue-700" },
  low: { bg: "bg-gray-100", text: "text-gray-600" },
};

type Filter = "pending" | "completed" | "all";

export default function ChecksScreen() {
  const { data, loading, error, refetch } = useApiData(getCheckRequests);
  const [filter, setFilter] = useState<Filter>("pending");

  const [active, setActive] = useState<CheckRequest | null>(null);
  const [summary, setSummary] = useState("");
  const [notes, setNotes] = useState("");
  const [files, setFiles] = useState<EvidenceFile[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const requests = data?.requests ?? [];

  const shown = useMemo(() => {
    const sorted = [...requests].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    if (filter === "all") return sorted;
    return sorted.filter((r) => r.status === filter);
  }, [requests, filter]);

  const pendingCount = requests.filter((r) => r.status === "pending").length;

  const openComplete = (r: CheckRequest) => {
    setActive(r);
    setSummary(r.completionSummary ?? "");
    setNotes(r.completionNotes ?? "");
    setFiles(r.completionFiles ?? []);
    setFormError("");
  };

  const capturePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Camera access needed", "Allow camera access to document the inspection.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const sizeMb = asset.fileSize ? `${(asset.fileSize / (1024 * 1024)).toFixed(1)} MB` : "1.0 MB";
      setFiles((prev) => [
        ...prev,
        { name: asset.fileName ?? `inspection-${Date.now()}.jpg`, type: "image", size: sizeMb },
      ]);
    }
  };

  const submitCompletion = async () => {
    if (!active) return;
    if (!summary.trim()) { setFormError("Add a short summary of what you found."); return; }
    setFormError("");
    setSubmitting(true);
    try {
      await updateCheckRequest(active.id, {
        status: "completed",
        completionSummary: summary.trim(),
        completionNotes: notes.trim(),
        completionFiles: files.map((f) => ({ name: f.name, type: f.type, size: f.size })),
      });
      setActive(null);
      await refetch();
      Alert.alert("Inspection completed", "The request has been marked complete.");
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Could not submit.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={["top"]}>
      <View className="border-b border-gray-200 bg-white px-5 py-4">
        <Text className="text-lg font-semibold text-gray-900">Check Requests</Text>
        <Text className="mt-0.5 text-xs text-gray-500">{pendingCount} awaiting inspection</Text>

        <View className="mt-3 flex-row gap-2">
          {(["pending", "completed", "all"] as Filter[]).map((f) => {
            const activeF = filter === f;
            return (
              <Pressable
                key={f}
                onPress={() => setFilter(f)}
                className={`rounded-full px-3 py-1.5 ${activeF ? "bg-amber-500" : "bg-gray-100"}`}
              >
                <Text className={`text-xs font-semibold capitalize ${activeF ? "text-white" : "text-gray-600"}`}>
                  {f}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} tintColor="#f59e0b" />}
      >
        {loading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState message={error} />
        ) : shown.length === 0 ? (
          <EmptyState
            title={filter === "pending" ? "Nothing to inspect" : `No ${filter} requests`}
            note={filter === "pending" ? "Requests assigned by admin will appear here." : undefined}
          />
        ) : (
          <View className="gap-3 px-4 pt-4">
            {shown.map((r) => {
              const p = PRIORITY_STYLE[r.priority] ?? PRIORITY_STYLE.normal;
              return (
                <Card key={r.id} className="p-4">
                  <View className="flex-row items-start justify-between">
                    <View className="flex-1 pr-3">
                      <Text className="text-sm font-semibold text-gray-900">{r.stallName ?? "Stall"}</Text>
                      <Text className="mt-0.5 text-xs text-gray-500">
                        Requested by {r.requestedByName ?? "admin"}
                      </Text>
                    </View>
                    <View className={`self-start rounded-full px-2.5 py-1 ${p.bg}`}>
                      <Text className={`text-[10px] font-semibold capitalize ${p.text}`}>{r.priority}</Text>
                    </View>
                  </View>

                  <Text className="mt-3 text-xs leading-5 text-gray-600">{r.reason}</Text>
                  {r.notes ? (
                    <Text className="mt-1.5 text-[11px] leading-5 text-gray-400">{r.notes}</Text>
                  ) : null}

                  <Text className="mt-3 text-[11px] text-gray-400">
                    {formatDate(r.createdAt)}
                    {r.completedAt ? ` · completed ${formatDate(r.completedAt)}` : ""}
                  </Text>

                  {r.status === "completed" && r.completionSummary ? (
                    <View className="mt-3 rounded-xl bg-emerald-50 px-3 py-2.5">
                      <Text className="text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
                        Findings
                      </Text>
                      <Text className="mt-1 text-xs leading-5 text-emerald-900">{r.completionSummary}</Text>
                    </View>
                  ) : null}

                  {r.status === "pending" ? (
                    <Pressable
                      onPress={() => openComplete(r)}
                      className="mt-3 items-center rounded-xl bg-amber-500 py-2.5"
                    >
                      <Text className="text-xs font-semibold text-white">Complete inspection</Text>
                    </Pressable>
                  ) : null}
                </Card>
              );
            })}
          </View>
        )}
      </ScrollView>

      <Modal visible={active !== null} animationType="slide" onRequestClose={() => setActive(null)}>
        <SafeAreaView className="flex-1 bg-gray-50" edges={["top"]}>
          <View className="flex-row items-center border-b border-gray-200 bg-white px-4 py-3">
            <Pressable onPress={() => setActive(null)} hitSlop={12} className="pr-3">
              <Ionicons name="close" size={22} color="#374151" />
            </Pressable>
            <View className="flex-1">
              <Text className="text-base font-semibold text-gray-900">Complete inspection</Text>
              <Text className="text-xs text-gray-500">{active?.stallName}</Text>
            </View>
          </View>

          <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
            <Card className="p-4">
              <Text className="mb-2 text-sm font-medium text-gray-700">
                Findings <Text className="text-red-500">*</Text>
              </Text>
              <TextInput
                className="min-h-[90px] rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-base text-gray-900"
                placeholder="What did you find?"
                placeholderTextColor="#9ca3af"
                value={summary}
                onChangeText={(v) => { setSummary(v); setFormError(""); }}
                editable={!submitting}
                multiline
                textAlignVertical="top"
              />

              <Text className="mb-2 mt-4 text-sm font-medium text-gray-700">Internal notes</Text>
              <TextInput
                className="min-h-[70px] rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-base text-gray-900"
                placeholder="Optional"
                placeholderTextColor="#9ca3af"
                value={notes}
                onChangeText={setNotes}
                editable={!submitting}
                multiline
                textAlignVertical="top"
              />
            </Card>

            <Card className="mt-4 p-4">
              <Text className="mb-3 text-sm font-medium text-gray-700">Photos</Text>
              {files.length > 0 ? (
                <View className="mb-3 gap-2">
                  {files.map((f, i) => (
                    <View key={i} className="flex-row items-center rounded-xl bg-gray-50 px-3 py-2.5">
                      <Ionicons name="image-outline" size={16} color="#f59e0b" />
                      <Text className="ml-2 flex-1 text-xs text-gray-700" numberOfLines={1}>{f.name}</Text>
                      <Pressable onPress={() => setFiles((p) => p.filter((_, idx) => idx !== i))} hitSlop={10}>
                        <Ionicons name="close-circle" size={16} color="#9ca3af" />
                      </Pressable>
                    </View>
                  ))}
                </View>
              ) : null}
              <Pressable
                onPress={capturePhoto}
                disabled={submitting}
                className="flex-row items-center justify-center rounded-xl border border-gray-200 bg-white py-3"
              >
                <Ionicons name="camera-outline" size={18} color="#374151" />
                <Text className="ml-2 text-xs font-semibold text-gray-700">
                  {files.length > 0 ? "Add another photo" : "Take photo"}
                </Text>
              </Pressable>
            </Card>

            {formError ? (
              <View className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                <Text className="text-sm leading-5 text-red-700">{formError}</Text>
              </View>
            ) : null}

            <Pressable
              onPress={submitCompletion}
              disabled={submitting}
              className={`mt-6 items-center rounded-xl py-4 ${submitting ? "bg-amber-500/50" : "bg-amber-500"}`}
            >
              {submitting ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text className="text-base font-semibold text-white">Mark complete</Text>
              )}
            </Pressable>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
