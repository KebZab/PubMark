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
import { readAssetForUpload, DOCUMENT_PICKER_TYPES } from "../../services/fileUpload";
import { useApiData } from "../../hooks/useApiData";
import { useStalls } from "../../hooks/useStalls";
import { useApplications } from "../../hooks/useApplications";
import { createReceipt, getReceipts } from "../../services/api";
import { Card, EmptyState, ErrorState, LoadingState, OfficerHeader, buttonShadow, formatDate } from "../../components/ui";

const STATUS_STYLE = {
  pending: { bg: "bg-amber-100", text: "text-amber-700", label: "Pending" },
  verified: { bg: "bg-emerald-100", text: "text-emerald-700", label: "Verified" },
  rejected: { bg: "bg-red-100", text: "text-red-700", label: "Rejected" },
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

function todayISO() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export default function ReceiptsScreen() {
  const { data, loading, error, refetch } = useApiData(getReceipts);
  const stallsQuery = useStalls();
  const applicationsQuery = useApplications();

  const [expandedId, setExpandedId] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [stallId, setStallId] = useState("");
  const [stallSearch, setStallSearch] = useState("");
  const STALL_PAGE_SIZE = 5;
  const [stallPage, setStallPage] = useState(1);
  const [amount, setAmount] = useState("");
  const [receiptDate, setReceiptDate] = useState(todayISO());
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const receipts = data?.receipts ?? [];
  const allStalls = stallsQuery.data?.stalls ?? [];
  const applications = applicationsQuery.data?.applications ?? [];

  // A payment can only be for an actual tenant — vacant and pending-only
  // stalls have no one to have collected from.
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

  const pendingCount = useMemo(() => receipts.filter((r) => r.status === "pending").length, [receipts]);

  const reset = () => {
    setStallId("");
    setStallSearch("");
    setStallPage(1);
    setAmount("");
    setReceiptDate(todayISO());
    setNotes("");
    setFile(null);
    setFormError("");
  };

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Camera access needed", "Allow camera access to photograph the receipt.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.7, base64: true });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      try {
        setFile(await readAssetForUpload({
          ...asset,
          name: asset.fileName ?? `receipt-${Date.now()}.jpg`,
          mimeType: asset.mimeType ?? "image/jpeg",
        }));
        setFormError("");
      } catch (e) {
        setFormError(e.message);
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
        setFile(await readAssetForUpload(result.assets[0]));
        setFormError("");
      } catch (e) {
        setFormError(e.message);
      }
    }
  };

  const submit = async () => {
    if (!stallId) {
      setFormError("Choose which stall this payment is for.");
      return;
    }
    if (!file) {
      setFormError("Attach the receipt — photo or file.");
      return;
    }
    setFormError("");
    setSubmitting(true);
    try {
      await createReceipt({
        stallId,
        amount: amount.trim() || null,
        receiptDate,
        notes: notes.trim(),
        file, // includes base64, so the receipt image is actually stored
      });
      setFormOpen(false);
      reset();
      await refetch();
      Alert.alert("Receipt recorded", "It's now awaiting admin verification.");
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Could not record the receipt.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={["top"]}>
      <OfficerHeader
        title="Receipts"
        subtitle={`${pendingCount} awaiting verification · ${receipts.length} total`}
        right={
          <Pressable
            onPress={() => setFormOpen(true)}
            className="flex-row items-center rounded-xl bg-amber-500 px-3 py-2.5"
          >
            <Ionicons name="add" size={16} color="#ffffff" />
            <Text className="ml-1 text-xs font-semibold text-white">Record</Text>
          </Pressable>
        }
      />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} tintColor="#f59e0b" />}
      >
        {loading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState message={error} />
        ) : receipts.length === 0 ? (
          <EmptyState title="No receipts yet" note="Tap Record to log a payment you collected." />
        ) : (
          <View className="gap-3 px-4 pt-4">
            {receipts.map((r) => {
              const s = STATUS_STYLE[r.status] ?? STATUS_STYLE.pending;
              const expanded = expandedId === r.id;
              return (
                <Card key={r.id} className="p-4">
                  <Pressable
                    onPress={() => setExpandedId((id) => (id === r.id ? null : r.id))}
                    className="flex-row items-start justify-between"
                  >
                    <View className="flex-1 pr-3">
                      <Text className="text-sm font-semibold text-gray-900">{r.stallName ?? "Stall"}</Text>
                      <Text className="mt-0.5 text-xs text-gray-500">{r.vendorName}</Text>
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
                      <View className="mt-3 border-t border-gray-100 pt-3">
                        <Row label="Amount" value={r.amount !== null ? `₱${r.amount.toFixed(2)}` : "—"} />
                        <Row label="Date" value={formatDate(r.receiptDate)} />
                        <Row label="File" value={r.fileName} />
                        <Row label="Recorded by" value={r.submittedByName} />
                      </View>

                      {r.notes ? <Text className="mt-3 text-xs leading-5 text-gray-600">{r.notes}</Text> : null}

                      {r.remarks ? (
                        <View className="mt-3 rounded-xl bg-gray-50 px-3 py-2.5">
                          <Text className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                            Admin remarks
                          </Text>
                          <Text className="mt-1 text-xs leading-5 text-gray-600">{r.remarks}</Text>
                        </View>
                      ) : null}
                    </>
                  ) : null}
                </Card>
              );
            })}
          </View>
        )}
      </ScrollView>

      <Modal visible={formOpen} animationType="slide" onRequestClose={() => setFormOpen(false)}>
        <SafeAreaView className="flex-1 bg-gray-50" edges={["top"]}>
          <View className="flex-row items-center border-b border-gray-200 bg-white px-4 py-3">
            <Pressable
              onPress={() => {
                setFormOpen(false);
                reset();
              }}
              hitSlop={12}
              className="pr-3"
            >
              <Ionicons name="close" size={22} color="#374151" />
            </Pressable>
            <Text className="flex-1 text-base font-semibold text-gray-900">Record a receipt</Text>
          </View>

          <ScrollView
            className="flex-1"
            contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
            keyboardShouldPersistTaps="handled"
          >
            <Card className="p-4">
              <Text className="mb-2 text-sm font-medium text-gray-700">
                Stall <Text className="text-red-500">*</Text>
              </Text>
              <Text className="mb-3 text-xs leading-5 text-gray-500">
                Only stalls with an approved vendor can take a payment.
              </Text>
              {stalls.length === 0 ? (
                <Text className="text-xs text-gray-400">
                  No occupied stalls to record a payment for — only stalls with an approved tenant can take one.
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
              <Text className="mb-2 text-sm font-medium text-gray-700">Amount</Text>
              <TextInput
                className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-base text-gray-900"
                placeholder="e.g. 1500"
                placeholderTextColor="#9ca3af"
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
                editable={!submitting}
              />

              <Text className="mb-2 mt-4 text-sm font-medium text-gray-700">Receipt date (YYYY-MM-DD)</Text>
              <TextInput
                className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-base text-gray-900"
                placeholder="2026-01-01"
                placeholderTextColor="#9ca3af"
                value={receiptDate}
                onChangeText={setReceiptDate}
                autoCapitalize="none"
                editable={!submitting}
              />
            </Card>

            <Card className="mt-4 p-4">
              <Text className="mb-1 text-sm font-medium text-gray-700">
                Receipt <Text className="text-red-500">*</Text>
              </Text>
              <Text className="mb-3 text-xs leading-5 text-gray-500">
                The file's name is recorded for the admin's reference.
              </Text>

              {file ? (
                <View className="flex-row items-center rounded-xl border border-gray-200 bg-gray-50 px-3 py-3">
                  <Ionicons name="receipt-outline" size={18} color="#f59e0b" />
                  <Text className="ml-2 flex-1 text-xs text-gray-700" numberOfLines={1}>
                    {file.name}
                  </Text>
                  <Pressable onPress={() => setFile(null)} hitSlop={10}>
                    <Ionicons name="close-circle" size={18} color="#9ca3af" />
                  </Pressable>
                </View>
              ) : (
                <View className="flex-row gap-2">
                  <Pressable
                    onPress={takePhoto}
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
              )}
            </Card>

            <Card className="mt-4 p-4">
              <Text className="mb-2 text-sm font-medium text-gray-700">Notes</Text>
              <TextInput
                className="min-h-[80px] rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-base text-gray-900"
                placeholder="Optional"
                placeholderTextColor="#9ca3af"
                value={notes}
                onChangeText={setNotes}
                editable={!submitting}
                multiline
                textAlignVertical="top"
              />
            </Card>

            {formError ? (
              <View className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                <Text className="text-sm leading-5 text-red-700">{formError}</Text>
              </View>
            ) : null}

            <Pressable
              onPress={submit}
              disabled={submitting}
              style={buttonShadow("#f59e0b")}
              className={`mt-6 items-center rounded-xl py-4 ${submitting ? "bg-amber-500/50" : "bg-amber-500"}`}
            >
              {submitting ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text className="text-base font-semibold text-white">Record receipt</Text>
              )}
            </Pressable>
          </ScrollView>
        </SafeAreaView>
      </Modal>
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
