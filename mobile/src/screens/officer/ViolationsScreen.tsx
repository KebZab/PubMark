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
import { createViolation, getStalls, getViolations, updateViolation } from "../../services/api";
import { Card, EmptyState, ErrorState, LoadingState, OfficerHeader, formatDate } from "../../components/ui";
import type { EvidenceFile, Violation, ViolationStatus } from "../../services/types";

// Same eight categories the web officer dashboard offers.
const CATEGORIES = [
  "Illegal Vending", "Health Violation", "Fire Hazard",
  "Unauthorized Expansion", "Noise Violation", "Improper Waste Disposal",
  "Permit Expired", "Other",
] as const;

const STATUS_STYLE: Record<ViolationStatus, { bg: string; text: string; label: string }> = {
  open: { bg: "bg-red-100", text: "text-red-700", label: "Open" },
  resolved: { bg: "bg-green-100", text: "text-green-700", label: "Resolved" },
  dismissed: { bg: "bg-gray-100", text: "text-gray-600", label: "Dismissed" },
};

type Filter = "all" | ViolationStatus;

export default function ViolationsScreen() {
  const { data, loading, error, refetch } = useApiData(getViolations);
  const stallsQuery = useApiData(getStalls);
  const [filter, setFilter] = useState<Filter>("all");
  const [busyId, setBusyId] = useState<string | null>(null);

  const [reportOpen, setReportOpen] = useState(false);
  const [stallId, setStallId] = useState("");
  const [category, setCategory] = useState<string>("Health Violation");
  const [description, setDescription] = useState("");
  const [evidence, setEvidence] = useState<EvidenceFile[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const violations = data?.violations ?? [];
  const stalls = stallsQuery.data?.stalls ?? [];

  const shown = useMemo(
    () => (filter === "all" ? violations : violations.filter((v) => v.status === filter)),
    [violations, filter]
  );

  const openCount = violations.filter((v) => v.status === "open").length;

  const capturePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Camera access needed", "Allow camera access to photograph evidence.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const sizeMb = asset.fileSize ? `${(asset.fileSize / (1024 * 1024)).toFixed(1)} MB` : "1.0 MB";
      setEvidence((prev) => [
        ...prev,
        { name: asset.fileName ?? `evidence-${Date.now()}.jpg`, type: "image", size: sizeMb },
      ]);
    }
  };

  const resetForm = () => {
    setStallId("");
    setCategory("Health Violation");
    setDescription("");
    setEvidence([]);
    setFormError("");
  };

  const submitReport = async () => {
    if (!stallId) { setFormError("Choose which stall this concerns."); return; }
    if (!description.trim()) { setFormError("Describe what you observed."); return; }
    setFormError("");
    setSubmitting(true);
    try {
      await createViolation({
        stallId,
        category,
        description: description.trim(),
        evidence: evidence.map((e) => ({ name: e.name, type: e.type, size: e.size })),
      });
      setReportOpen(false);
      resetForm();
      await refetch();
      Alert.alert("Violation reported", "It now appears in the violations list.");
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Could not report the violation.");
    } finally {
      setSubmitting(false);
    }
  };

  const resolve = (v: Violation, status: "resolved" | "dismissed") => {
    Alert.alert(
      status === "resolved" ? "Mark resolved?" : "Dismiss violation?",
      `${v.category} at ${v.stallName ?? "this stall"}.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: status === "resolved" ? "Resolve" : "Dismiss",
          onPress: async () => {
            setBusyId(v.id);
            try {
              await updateViolation(v.id, { status });
              await refetch();
            } catch (e) {
              Alert.alert("Failed", e instanceof Error ? e.message : "Try again.");
            } finally {
              setBusyId(null);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={["top"]}>
      <OfficerHeader
        title="Violations"
        subtitle={`${openCount} open · ${violations.length} total`}
        right={
          <Pressable
            onPress={() => setReportOpen(true)}
            className="flex-row items-center rounded-xl bg-amber-500 px-3 py-2.5"
          >
            <Ionicons name="add" size={16} color="#ffffff" />
            <Text className="ml-1 text-xs font-semibold text-white">Report</Text>
          </Pressable>
        }
      />

      <View className="border-b border-gray-200 bg-white px-5 pb-3">
        <View className="flex-row gap-2">
          {(["all", "open", "resolved", "dismissed"] as Filter[]).map((f) => {
            const active = filter === f;
            return (
              <Pressable
                key={f}
                onPress={() => setFilter(f)}
                className={`rounded-full px-3 py-1.5 ${active ? "bg-amber-500" : "bg-gray-100"}`}
              >
                <Text className={`text-xs font-semibold capitalize ${active ? "text-white" : "text-gray-600"}`}>
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
            title={filter === "all" ? "No violations recorded" : `No ${filter} violations`}
            note={filter === "all" ? "Tap Report to record one you've observed." : undefined}
          />
        ) : (
          <View className="gap-3 px-4 pt-4">
            {shown.map((v) => {
              const s = STATUS_STYLE[v.status];
              return (
                <Card key={v.id} className="p-4">
                  <View className="flex-row items-start justify-between">
                    <View className="flex-1 pr-3">
                      <Text className="text-sm font-semibold text-gray-900">{v.stallName ?? "Stall"}</Text>
                      <Text className="mt-0.5 text-xs text-gray-500">{v.category}</Text>
                    </View>
                    <View className={`self-start rounded-full px-2.5 py-1 ${s.bg}`}>
                      <Text className={`text-[10px] font-semibold ${s.text}`}>{s.label}</Text>
                    </View>
                  </View>

                  <Text className="mt-3 text-xs leading-5 text-gray-600">{v.description}</Text>

                  {v.evidence.length > 0 ? (
                    <View className="mt-3 flex-row flex-wrap gap-1.5">
                      {v.evidence.map((e, i) => (
                        <View key={i} className="flex-row items-center rounded-lg bg-gray-100 px-2 py-1">
                          <Ionicons name="image-outline" size={11} color="#6b7280" />
                          <Text className="ml-1 text-[10px] text-gray-600" numberOfLines={1}>
                            {e.name}
                          </Text>
                        </View>
                      ))}
                    </View>
                  ) : null}

                  <Text className="mt-3 text-[11px] text-gray-400">
                    {v.officerName ? `By ${v.officerName} · ` : ""}
                    {formatDate(v.createdAt)}
                    {v.resolvedAt ? ` · closed ${formatDate(v.resolvedAt)}` : ""}
                  </Text>

                  {v.status === "open" ? (
                    <View className="mt-3 flex-row gap-2 border-t border-gray-100 pt-3">
                      <Pressable
                        onPress={() => resolve(v, "dismissed")}
                        disabled={busyId === v.id}
                        className="flex-1 items-center rounded-xl bg-gray-100 py-2.5"
                      >
                        <Text className="text-xs font-semibold text-gray-700">Dismiss</Text>
                      </Pressable>
                      <Pressable
                        onPress={() => resolve(v, "resolved")}
                        disabled={busyId === v.id}
                        className="flex-1 items-center rounded-xl bg-emerald-500 py-2.5"
                      >
                        {busyId === v.id ? (
                          <ActivityIndicator size="small" color="#ffffff" />
                        ) : (
                          <Text className="text-xs font-semibold text-white">Resolve</Text>
                        )}
                      </Pressable>
                    </View>
                  ) : null}
                </Card>
              );
            })}
          </View>
        )}
      </ScrollView>

      <Modal visible={reportOpen} animationType="slide" onRequestClose={() => setReportOpen(false)}>
        <SafeAreaView className="flex-1 bg-gray-50" edges={["top"]}>
          <View className="flex-row items-center border-b border-gray-200 bg-white px-4 py-3">
            <Pressable onPress={() => { setReportOpen(false); resetForm(); }} hitSlop={12} className="pr-3">
              <Ionicons name="close" size={22} color="#374151" />
            </Pressable>
            <Text className="flex-1 text-base font-semibold text-gray-900">Report a violation</Text>
          </View>

          <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
            <Card className="p-4">
              <Text className="mb-2 text-sm font-medium text-gray-700">
                Stall <Text className="text-red-500">*</Text>
              </Text>
              {stalls.length === 0 ? (
                <Text className="text-xs text-gray-400">No stalls available.</Text>
              ) : (
                <View className="gap-2">
                  {stalls.map((s) => {
                    const active = stallId === s.id;
                    return (
                      <Pressable
                        key={s.id}
                        onPress={() => { setStallId(s.id); setFormError(""); }}
                        className={`flex-row items-center rounded-xl border px-3 py-3 ${
                          active ? "border-amber-500 bg-amber-50" : "border-gray-200 bg-white"
                        }`}
                      >
                        <Ionicons
                          name={active ? "radio-button-on" : "radio-button-off"}
                          size={16}
                          color={active ? "#f59e0b" : "#9ca3af"}
                        />
                        <Text className="ml-2 flex-1 text-xs font-medium text-gray-800">{s.stall_name}</Text>
                        <Text className="text-[10px] text-gray-400">Sec {s.section}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              )}
            </Card>

            <Card className="mt-4 p-4">
              <Text className="mb-2 text-sm font-medium text-gray-700">Category</Text>
              <View className="flex-row flex-wrap gap-2">
                {CATEGORIES.map((c) => {
                  const active = category === c;
                  return (
                    <Pressable
                      key={c}
                      onPress={() => setCategory(c)}
                      className={`rounded-full px-3 py-2 ${active ? "bg-amber-500" : "bg-gray-100"}`}
                    >
                      <Text className={`text-xs font-semibold ${active ? "text-white" : "text-gray-600"}`}>{c}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </Card>

            <Card className="mt-4 p-4">
              <Text className="mb-2 text-sm font-medium text-gray-700">
                What did you observe? <Text className="text-red-500">*</Text>
              </Text>
              <TextInput
                className="min-h-[100px] rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-base text-gray-900"
                placeholder="Describe the violation"
                placeholderTextColor="#9ca3af"
                value={description}
                onChangeText={(v) => { setDescription(v); setFormError(""); }}
                editable={!submitting}
                multiline
                textAlignVertical="top"
              />
            </Card>

            <Card className="mt-4 p-4">
              <Text className="mb-1 text-sm font-medium text-gray-700">Photo evidence</Text>
              <Text className="mb-3 text-xs leading-5 text-gray-500">
                Photograph what you saw — the strongest kind of evidence.
              </Text>

              {evidence.length > 0 ? (
                <View className="mb-3 gap-2">
                  {evidence.map((e, i) => (
                    <View key={i} className="flex-row items-center rounded-xl bg-gray-50 px-3 py-2.5">
                      <Ionicons name="image-outline" size={16} color="#f59e0b" />
                      <Text className="ml-2 flex-1 text-xs text-gray-700" numberOfLines={1}>{e.name}</Text>
                      <Pressable onPress={() => setEvidence((p) => p.filter((_, idx) => idx !== i))} hitSlop={10}>
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
                  {evidence.length > 0 ? "Add another photo" : "Take photo"}
                </Text>
              </Pressable>
            </Card>

            {formError ? (
              <View className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                <Text className="text-sm leading-5 text-red-700">{formError}</Text>
              </View>
            ) : null}

            <Pressable
              onPress={submitReport}
              disabled={submitting}
              className={`mt-6 items-center rounded-xl py-4 ${submitting ? "bg-amber-500/50" : "bg-amber-500"}`}
            >
              {submitting ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text className="text-base font-semibold text-white">Submit report</Text>
              )}
            </Pressable>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
