import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
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
import { useStalls } from "../../hooks/useStalls";
import { useApplications } from "../../hooks/useApplications";
import { createViolation, getViolations } from "../../services/api";
import { Attachments, Card, EmptyState, ErrorState, LoadingState, OfficerHeader, buttonShadow, formatDate } from "../../components/ui";

// Same eight categories the web officer dashboard offers.
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

const STATUS_STYLE = {
  open: { bg: "bg-red-100", text: "text-red-700", label: "Pending Action" },
  reviewed: { bg: "bg-amber-100", text: "text-amber-700", label: "Reviewing" },
  resolved: { bg: "bg-green-100", text: "text-green-700", label: "Resolved" },
  dismissed: { bg: "bg-gray-100", text: "text-gray-600", label: "Dismissed" },
};

// The one application that represents a stall's current state: the approved
// tenant, if there is one. GET /applications is unscoped for officers, so
// this can read every application directly with no extra endpoint.
function getActiveApp(stallId, applications) {
  return applications
    .filter((a) => a.stallId === stallId && a.status !== "rejected")
    .sort((a, b) => new Date(a.dateApplied).getTime() - new Date(b.dateApplied).getTime())
    .find((a) => a.status === "approved") ?? null;
}

export default function ViolationsScreen() {
  const { data, loading, error, refetch } = useApiData(getViolations);
  const stallsQuery = useStalls();
  const applicationsQuery = useApplications();
  const [filter, setFilter] = useState("all");
  const [expandedId, setExpandedId] = useState(null);

  const [reportOpen, setReportOpen] = useState(false);
  const [stallId, setStallId] = useState("");
  const [stallSearch, setStallSearch] = useState("");
  const STALL_PAGE_SIZE = 5;
  const [stallPage, setStallPage] = useState(1);
  const [category, setCategory] = useState("Health Violation");
  const [description, setDescription] = useState("");
  const [evidence, setEvidence] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const violations = data?.violations ?? [];
  const allStalls = stallsQuery.data?.stalls ?? [];
  const applications = applicationsQuery.data?.applications ?? [];

  // A violation only makes sense against a stall that's actually occupied —
  // vacant and pending-only stalls have no tenant to report.
  const stalls = useMemo(
    () => allStalls.filter((s) => getActiveApp(s.id, applications)?.status === "approved"),
    [allStalls, applications],
  );

  // Rendering every stall as its own row got noticeably laggy once the
  // market had a lot of them — filter first, then only render one page at a
  // time, same Prev/Next-by-page pattern as the web admin tables.
  const filteredStalls = useMemo(() => {
    const q = stallSearch.trim().toLowerCase();
    if (!q) return stalls;
    return stalls.filter((s) => s.stall_name.toLowerCase().includes(q));
  }, [stalls, stallSearch]);
  const stallTotalPages = Math.max(1, Math.ceil(filteredStalls.length / STALL_PAGE_SIZE));
  // Clamped rather than reset elsewhere — a shrinking search result can
  // leave `stallPage` past the new last page without this.
  const clampedStallPage = Math.min(stallPage, stallTotalPages);
  const stallPageFrom = filteredStalls.length === 0 ? 0 : (clampedStallPage - 1) * STALL_PAGE_SIZE + 1;
  const stallPageTo = Math.min(clampedStallPage * STALL_PAGE_SIZE, filteredStalls.length);
  const visibleStalls = filteredStalls.slice((clampedStallPage - 1) * STALL_PAGE_SIZE, clampedStallPage * STALL_PAGE_SIZE);

  const shown = useMemo(
    () => (filter === "all" ? violations : violations.filter((v) => v.status === filter)),
    [violations, filter],
  );

  const openCount = violations.filter((v) => v.status === "open").length;

  const capturePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Camera access needed", "Allow camera access to photograph evidence.");
      return;
    }
    // base64 so the real photo is stored, not just its name. quality 0.7 keeps
    // a phone camera shot comfortably under the 5 MB limit.
    const result = await ImagePicker.launchCameraAsync({ quality: 0.7, base64: true });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      try {
        const file = await readAssetForUpload({
          ...asset,
          name: asset.fileName ?? `evidence-${Date.now()}.jpg`,
          mimeType: asset.mimeType ?? "image/jpeg",
        });
        setEvidence((prev) => [...prev, { ...file, size: formatFileSize(file.size) }]);
      } catch (error) {
        Alert.alert("Cannot attach photo", error.message);
      }
    }
  };

  const pickFile = async () => {
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
        setEvidence((prev) => [...prev, { ...file, size: formatFileSize(file.size) }]);
      } catch (error) {
        Alert.alert("Cannot attach file", error.message);
      }
    }
  };

  const resetForm = () => {
    setStallId("");
    setStallSearch("");
    setStallPage(1);
    setCategory("Health Violation");
    setDescription("");
    setEvidence([]);
    setFormError("");
  };

  const submitReport = async () => {
    if (!stallId) {
      setFormError("Choose which stall this concerns.");
      return;
    }
    if (!description.trim()) {
      setFormError("Describe what you observed.");
      return;
    }
    setFormError("");
    setSubmitting(true);
    try {
      await createViolation({
        stallId,
        category,
        description: description.trim(),
        // Whole object, so the photo contents reach the server.
        evidence,
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

      <View className="border-b border-gray-200 bg-white pb-3 pt-3">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}
        >
          {["all", "open", "reviewed", "resolved", "dismissed"].map((f) => {
            const active = filter === f;
            const label =
              f === "open" ? "Pending Action" : f === "reviewed" ? "Reviewing" : f === "all" ? "All" : f;
            return (
              <Pressable
                key={f}
                onPress={() => setFilter(f)}
                className={`rounded-full px-3 py-1.5 ${active ? "bg-amber-500" : "bg-gray-100"}`}
              >
                <Text
                  className={`text-xs font-semibold capitalize ${active ? "text-white" : "text-gray-600"}`}
                >
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
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
              const expanded = expandedId === v.id;
              return (
                <Card key={v.id} className="p-4">
                  <Pressable
                    onPress={() => setExpandedId((id) => (id === v.id ? null : v.id))}
                    className="flex-row items-start justify-between"
                  >
                    <View className="flex-1 pr-3">
                      <Text className="text-sm font-semibold text-gray-900">{v.stallName ?? "Stall"}</Text>
                      <Text className="mt-0.5 text-xs text-gray-500">{v.category}</Text>
                    </View>
                    <View className="flex-row items-center gap-2">
                      <View className={`self-start rounded-full px-2.5 py-1 ${s.bg}`}>
                        <Text className={`text-[10px] font-semibold ${s.text}`}>{s.label}</Text>
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
                      <Text className="mt-3 text-xs leading-5 text-gray-600">{v.description}</Text>

                      <Attachments files={v.evidence} />

                      <Text className="mt-3 text-[11px] text-gray-400">
                        {v.officerName ? `By ${v.officerName} · ` : ""}
                        {formatDate(v.createdAt)}
                        {v.resolvedAt ? ` · closed ${formatDate(v.resolvedAt)}` : ""}
                      </Text>
                    </>
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
            <Pressable
              onPress={() => {
                setReportOpen(false);
                resetForm();
              }}
              hitSlop={12}
              className="pr-3"
            >
              <Ionicons name="close" size={22} color="#374151" />
            </Pressable>
            <Text className="flex-1 text-base font-semibold text-gray-900">Report a violation</Text>
          </View>

          <KeyboardAvoidingView
            className="flex-1"
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={20}
          >
          <ScrollView
            className="flex-1"
            contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
            keyboardShouldPersistTaps="handled"
          >
            <Card className="p-4">
              <Text className="mb-2 text-sm font-medium text-gray-700">
                Stall <Text className="text-red-500">*</Text>
              </Text>
              {stalls.length === 0 ? (
                <Text className="text-xs text-gray-400">
                  No occupied stalls to report on — only stalls with an approved tenant can be reported.
                </Text>
              ) : (
                <>
                  <View className="mb-2 flex-row items-center rounded-xl border border-gray-200 bg-gray-50 px-3">
                    <Ionicons name="search-outline" size={14} color="#9ca3af" />
                    <TextInput
                      className="ml-2 flex-1 py-2.5 text-xs text-gray-800"
                      placeholder="Search stall name"
                      placeholderTextColor="#9ca3af"
                      value={stallSearch}
                      onChangeText={(v) => {
                        setStallSearch(v);
                        setStallPage(1);
                      }}
                    />
                    {stallSearch ? (
                      <Pressable onPress={() => setStallSearch("")} hitSlop={8}>
                        <Ionicons name="close-circle" size={14} color="#9ca3af" />
                      </Pressable>
                    ) : null}
                  </View>

                  {filteredStalls.length === 0 ? (
                    <Text className="text-xs text-gray-400">No stalls match "{stallSearch}".</Text>
                  ) : (
                    <View className="gap-2">
                      {visibleStalls.map((s) => {
                        const active = stallId === s.id;
                        return (
                          <Pressable
                            key={s.id}
                            onPress={() => {
                              setStallId(s.id);
                              setFormError("");
                            }}
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

                  {filteredStalls.length > 0 ? (
                    <View className="mt-3 flex-row items-center justify-between border-t border-gray-100 pt-3">
                      <Text className="text-[11px] text-gray-400">
                        {`Showing ${stallPageFrom}–${stallPageTo} of ${filteredStalls.length}`}
                      </Text>
                      <View className="flex-row items-center gap-2">
                        <Pressable
                          onPress={() => setStallPage((p) => Math.max(1, p - 1))}
                          disabled={clampedStallPage <= 1}
                          className={`flex-row items-center gap-0.5 rounded-lg border border-gray-200 px-2.5 py-1.5 ${
                            clampedStallPage <= 1 ? "opacity-40" : ""
                          }`}
                        >
                          <Ionicons name="chevron-back" size={12} color="#374151" />
                          <Text className="text-[11px] font-medium text-gray-700">Prev</Text>
                        </Pressable>
                        <Text className="text-[11px] text-gray-400">
                          Page {clampedStallPage} of {stallTotalPages}
                        </Text>
                        <Pressable
                          onPress={() => setStallPage((p) => Math.min(stallTotalPages, p + 1))}
                          disabled={clampedStallPage >= stallTotalPages}
                          className={`flex-row items-center gap-0.5 rounded-lg border border-gray-200 px-2.5 py-1.5 ${
                            clampedStallPage >= stallTotalPages ? "opacity-40" : ""
                          }`}
                        >
                          <Text className="text-[11px] font-medium text-gray-700">Next</Text>
                          <Ionicons name="chevron-forward" size={12} color="#374151" />
                        </Pressable>
                      </View>
                    </View>
                  ) : null}
                </>
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
                      <Text className={`text-xs font-semibold ${active ? "text-white" : "text-gray-600"}`}>
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
                value={description}
                onChangeText={(v) => {
                  setDescription(v);
                  setFormError("");
                }}
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
                      <Text className="ml-2 flex-1 text-xs text-gray-700" numberOfLines={1}>
                        {e.name}
                      </Text>
                      <Pressable
                        onPress={() => setEvidence((p) => p.filter((_, idx) => idx !== i))}
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
                  onPress={capturePhoto}
                  disabled={submitting}
                  className="flex-1 flex-row items-center justify-center rounded-xl border border-gray-200 bg-white py-3"
                >
                  <Ionicons name="camera-outline" size={18} color="#374151" />
                  <Text className="ml-2 text-xs font-semibold text-gray-700">Take photo</Text>
                </Pressable>
                <Pressable
                  onPress={pickFile}
                  disabled={submitting}
                  className="flex-1 flex-row items-center justify-center rounded-xl border border-gray-200 bg-white py-3"
                >
                  <Ionicons name="folder-outline" size={18} color="#374151" />
                  <Text className="ml-2 text-xs font-semibold text-gray-700">Choose file</Text>
                </Pressable>
              </View>
            </Card>

            {formError ? (
              <View className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                <Text className="text-sm leading-5 text-red-700">{formError}</Text>
              </View>
            ) : null}

            <Pressable
              onPress={submitReport}
              disabled={submitting}
              style={buttonShadow("#f59e0b")}
              className={`mt-6 items-center rounded-xl py-4 ${submitting ? "bg-amber-500/50" : "bg-amber-500"}`}
            >
              {submitting ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text className="text-base font-semibold text-white">Submit report</Text>
              )}
            </Pressable>
          </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
