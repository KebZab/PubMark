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
import * as DocumentPicker from "expo-document-picker";
import { readAssetForUpload, formatFileSize, DOCUMENT_PICKER_TYPES } from "../../services/fileUpload";
import { useApiData } from "../../hooks/useApiData";
import { getCheckRequests, updateCheckRequest, createViolation } from "../../services/api";
import { Attachments, Card, EmptyState, ErrorState, LoadingState, OfficerHeader, formatDate } from "../../components/ui";

const PRIORITY_STYLE = {
  urgent: { bg: "bg-red-100", text: "text-red-700" },
  high: { bg: "bg-orange-100", text: "text-orange-700" },
  normal: { bg: "bg-blue-100", text: "text-blue-700" },
  low: { bg: "bg-gray-100", text: "text-gray-600" },
};

// Same eight categories the Violations tab offers, so reporting from a check
// request (like web's officer dashboard lets you do) doesn't diverge.
const CATEGORIES = [
  "Illegal Vending",
  "Health Violation",
  "Fire Hazard",
  "Unauthorized Expansion",
  "Noise Violation",
  "Improper Waste Disposal",
  "Permit Expired",
  "Other",
];

export default function ChecksScreen() {
  const { data, loading, error, refetch } = useApiData(getCheckRequests);
  const [filter, setFilter] = useState("pending");

  const [expandedId, setExpandedId] = useState(null);
  const [active, setActive] = useState(null);
  const [summary, setSummary] = useState("");
  const [notes, setNotes] = useState("");
  const [files, setFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  // Report a violation right from a check request — mirrors web's officer
  // dashboard, which lets an inspection turn up a violation without leaving
  // the request to go find the stall again on the Violations tab.
  const [violationTarget, setViolationTarget] = useState(null);
  const [violationCategory, setViolationCategory] = useState("Health Violation");
  const [violationDescription, setViolationDescription] = useState("");
  const [violationEvidence, setViolationEvidence] = useState([]);
  const [violationSubmitting, setViolationSubmitting] = useState(false);
  const [violationError, setViolationError] = useState("");

  const requests = data?.requests ?? [];

  const shown = useMemo(() => {
    const sorted = [...requests].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    if (filter === "all") return sorted;
    return sorted.filter((r) => r.status === filter);
  }, [requests, filter]);

  const pendingCount = requests.filter((r) => r.status === "pending").length;

  const openComplete = (r) => {
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
    const result = await ImagePicker.launchCameraAsync({ quality: 0.7, base64: true });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      try {
        const file = await readAssetForUpload({
          ...asset,
          name: asset.fileName ?? `inspection-${Date.now()}.jpg`,
          mimeType: asset.mimeType ?? "image/jpeg",
        });
        setFiles((prev) => [...prev, { ...file, size: formatFileSize(file.size) }]);
      } catch (error) {
        Alert.alert("Cannot attach photo", error.message);
      }
    }
  };

  const submitCompletion = async () => {
    if (!active) return;
    if (!summary.trim()) {
      setFormError("Add a short summary of what you found.");
      return;
    }
    setFormError("");
    setSubmitting(true);
    try {
      await updateCheckRequest(active.id, {
        status: "completed",
        completionSummary: summary.trim(),
        completionNotes: notes.trim(),
        // Send the whole object: new photos carry `base64` (uploaded), and
        // ones already stored carry `id` (kept as they are, server-side).
        completionFiles: files,
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

  const openViolationReport = (r) => {
    setViolationTarget(r);
    setViolationCategory("Health Violation");
    setViolationDescription("");
    setViolationEvidence([]);
    setViolationError("");
  };

  const captureViolationPhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Camera access needed", "Allow camera access to photograph evidence.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.7, base64: true });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      try {
        const file = await readAssetForUpload({
          ...asset,
          name: asset.fileName ?? `evidence-${Date.now()}.jpg`,
          mimeType: asset.mimeType ?? "image/jpeg",
        });
        setViolationEvidence((prev) => [...prev, { ...file, size: formatFileSize(file.size) }]);
      } catch (error) {
        Alert.alert("Cannot attach photo", error.message);
      }
    }
  };

  const pickViolationFile = async () => {
    // copyToCacheDirectory MUST stay false. With it on, Android copies the pick
    // into a file:// path under Expo Go's own cache, which the sandboxed app
    // then can't read ("Location ... isn't readable"). Left off, the picker
    // returns the original content:// uri, which expo-file-system grants read
    // access to unconditionally and opens via contentResolver.
    const result = await DocumentPicker.getDocumentAsync({
      type: DOCUMENT_PICKER_TYPES,
      copyToCacheDirectory: false,
    });
    if (!result.canceled && result.assets?.[0]) {
      try {
        const file = await readAssetForUpload(result.assets[0]);
        setViolationEvidence((prev) => [...prev, { ...file, size: formatFileSize(file.size) }]);
      } catch (error) {
        Alert.alert("Cannot attach file", error.message);
      }
    }
  };

  const submitViolationReport = async () => {
    if (!violationTarget) return;
    if (!violationDescription.trim()) {
      setViolationError("Describe what you observed.");
      return;
    }
    setViolationError("");
    setViolationSubmitting(true);
    try {
      await createViolation({
        stallId: violationTarget.stallId,
        category: violationCategory,
        description: violationDescription.trim(),
        evidence: violationEvidence,
      });
      setViolationTarget(null);
      Alert.alert("Violation reported", "It now appears in the Violations tab.");
    } catch (e) {
      setViolationError(e instanceof Error ? e.message : "Could not report the violation.");
    } finally {
      setViolationSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={["top"]}>
      <OfficerHeader title="Check Requests" subtitle={`${pendingCount} awaiting inspection`} />

      <View className="border-b border-gray-200 bg-white px-5 pb-3">
        <View className="flex-row gap-2">
          {["pending", "completed", "all"].map((f) => {
            const activeF = filter === f;
            return (
              <Pressable
                key={f}
                onPress={() => setFilter(f)}
                className={`rounded-full px-3 py-1.5 ${activeF ? "bg-amber-500" : "bg-gray-100"}`}
              >
                <Text
                  className={`text-xs font-semibold capitalize ${activeF ? "text-white" : "text-gray-600"}`}
                >
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
              const expanded = expandedId === r.id;
              // Older followups (sent before categories existed) carry no
              // category, but still have this generated notes text — treat
              // those the same as a proper followup, badge included.
              const isFollowup = !!r.category || r.notes === "Generated from violation request.";
              return (
                <Card key={r.id} className="p-4">
                  <Pressable
                    onPress={() => setExpandedId((id) => (id === r.id ? null : r.id))}
                    className="flex-row items-start justify-between"
                  >
                    <View className="flex-1 pr-3">
                      <Text className="text-sm font-semibold text-gray-900">{r.stallName ?? "Stall"}</Text>
                      <Text className="mt-0.5 text-xs text-gray-500">
                        Requested by {r.requestedByName ?? "admin"}
                      </Text>
                    </View>
                    <View className="flex-row items-center gap-2">
                      <View
                        className={`self-start rounded-full px-2.5 py-1 ${isFollowup ? "bg-blue-100" : p.bg}`}
                      >
                        <Text
                          className={`text-[10px] font-semibold capitalize ${isFollowup ? "text-blue-700" : p.text}`}
                        >
                          {isFollowup ? "Followup" : r.priority}
                        </Text>
                      </View>
                      <Ionicons
                        name={expanded ? "chevron-up" : "chevron-down"}
                        size={16}
                        color="#9ca3af"
                      />
                    </View>
                  </Pressable>

                  {expanded ? (
                    <>
                      <Text className="mt-3 text-xs font-bold leading-5 text-gray-800">
                        {r.category ? `Followup: ${r.category}` : isFollowup ? r.notes : r.reason}
                      </Text>
                      {isFollowup ? (
                        <Text className="mt-1.5 text-[11px] leading-5 text-gray-600">{r.reason}</Text>
                      ) : r.notes ? (
                        <Text className="mt-1.5 text-[11px] leading-5 text-gray-600">{r.notes}</Text>
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
                          <Attachments files={r.completionFiles ?? []} />
                        </View>
                      ) : null}
                    </>
                  ) : null}

                  {r.status === "pending" ? (
                    <View className="mt-3 flex-row gap-2">
                      {isFollowup ? null : (
                        <Pressable
                          onPress={() => openViolationReport(r)}
                          className="flex-1 flex-row items-center justify-center rounded-xl border border-red-200 bg-red-50 py-2.5"
                        >
                          <Ionicons name="alert-circle-outline" size={14} color="#dc2626" />
                          <Text className="ml-1 text-xs font-semibold text-red-600">Report Violation</Text>
                        </Pressable>
                      )}
                      <Pressable
                        onPress={() => openComplete(r)}
                        className="flex-1 items-center rounded-xl bg-amber-500 py-2.5"
                      >
                        <Text className="text-xs font-semibold text-white">Submit Report</Text>
                      </Pressable>
                    </View>
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

          <ScrollView
            className="flex-1"
            contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
            keyboardShouldPersistTaps="handled"
          >
            <Card className="p-4">
              <Text className="mb-2 text-sm font-medium text-gray-700">
                Findings <Text className="text-red-500">*</Text>
              </Text>
              <TextInput
                className="min-h-[90px] rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-base text-gray-900"
                placeholder="What did you find?"
                placeholderTextColor="#9ca3af"
                value={summary}
                onChangeText={(v) => {
                  setSummary(v);
                  setFormError("");
                }}
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
                      <Text className="ml-2 flex-1 text-xs text-gray-700" numberOfLines={1}>
                        {f.name}
                      </Text>
                      <Pressable
                        onPress={() => setFiles((p) => p.filter((_, idx) => idx !== i))}
                        hitSlop={10}
                      >
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

      <Modal
        visible={violationTarget !== null}
        animationType="slide"
        onRequestClose={() => setViolationTarget(null)}
      >
        <SafeAreaView className="flex-1 bg-gray-50" edges={["top"]}>
          <View className="flex-row items-center border-b border-gray-200 bg-white px-4 py-3">
            <Pressable onPress={() => setViolationTarget(null)} hitSlop={12} className="pr-3">
              <Ionicons name="close" size={22} color="#374151" />
            </Pressable>
            <View className="flex-1">
              <Text className="text-base font-semibold text-gray-900">Report a violation</Text>
              <Text className="text-xs text-gray-500">{violationTarget?.stallName}</Text>
            </View>
          </View>

          <ScrollView
            className="flex-1"
            contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
            keyboardShouldPersistTaps="handled"
          >
            <Card className="p-4">
              <Text className="mb-2 text-sm font-medium text-gray-700">Category</Text>
              <View className="flex-row flex-wrap gap-2">
                {CATEGORIES.map((c) => {
                  const isActive = violationCategory === c;
                  return (
                    <Pressable
                      key={c}
                      onPress={() => setViolationCategory(c)}
                      className={`rounded-full px-3 py-2 ${isActive ? "bg-amber-500" : "bg-gray-100"}`}
                    >
                      <Text className={`text-xs font-bold ${isActive ? "text-white" : "text-gray-600"}`}>
                        {c}
                      </Text>
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
                value={violationDescription}
                onChangeText={(v) => {
                  setViolationDescription(v);
                  setViolationError("");
                }}
                editable={!violationSubmitting}
                multiline
                textAlignVertical="top"
              />
            </Card>

            <Card className="mt-4 p-4">
              <Text className="mb-1 text-sm font-medium text-gray-700">Photo evidence</Text>
              <Text className="mb-3 text-xs leading-5 text-gray-500">
                Photograph what you saw — the strongest kind of evidence.
              </Text>

              {violationEvidence.length > 0 ? (
                <View className="mb-3 gap-2">
                  {violationEvidence.map((e, i) => (
                    <View key={i} className="flex-row items-center rounded-xl bg-gray-50 px-3 py-2.5">
                      <Ionicons name="image-outline" size={16} color="#f59e0b" />
                      <Text className="ml-2 flex-1 text-xs text-gray-700" numberOfLines={1}>
                        {e.name}
                      </Text>
                      <Pressable
                        onPress={() => setViolationEvidence((p) => p.filter((_, idx) => idx !== i))}
                        hitSlop={10}
                      >
                        <Ionicons name="close-circle" size={16} color="#9ca3af" />
                      </Pressable>
                    </View>
                  ))}
                </View>
              ) : null}

              <View className="flex-row gap-2">
                <Pressable
                  onPress={captureViolationPhoto}
                  disabled={violationSubmitting}
                  className="flex-1 flex-row items-center justify-center rounded-xl border border-gray-200 bg-white py-3"
                >
                  <Ionicons name="camera-outline" size={18} color="#374151" />
                  <Text className="ml-2 text-xs font-semibold text-gray-700">Take photo</Text>
                </Pressable>
                <Pressable
                  onPress={pickViolationFile}
                  disabled={violationSubmitting}
                  className="flex-1 flex-row items-center justify-center rounded-xl border border-gray-200 bg-white py-3"
                >
                  <Ionicons name="folder-outline" size={18} color="#374151" />
                  <Text className="ml-2 text-xs font-semibold text-gray-700">Choose file</Text>
                </Pressable>
              </View>
            </Card>

            {violationError ? (
              <View className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                <Text className="text-sm leading-5 text-red-700">{violationError}</Text>
              </View>
            ) : null}

            <Pressable
              onPress={submitViolationReport}
              disabled={violationSubmitting}
              className={`mt-6 items-center rounded-xl py-4 ${violationSubmitting ? "bg-red-500/50" : "bg-red-500"}`}
            >
              {violationSubmitting ? (
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
