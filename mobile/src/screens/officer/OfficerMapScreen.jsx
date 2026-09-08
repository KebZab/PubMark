import { useMemo, useState } from "react";
import { ActivityIndicator, Alert, Image, Modal, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { useApiData } from "../../hooks/useApiData";
import { useStalls } from "../../hooks/useStalls";
import { useApplications } from "../../hooks/useApplications";
import { useMapFacilities } from "../../hooks/useMapFacilities";
import { getViolations, createViolation } from "../../services/api";
import { readAssetForUpload, formatFileSize, DOCUMENT_PICKER_TYPES } from "../../services/fileUpload";
import { Card, ErrorState, LoadingState, OfficerHeader, buttonShadow, iosShadow } from "../../components/ui";
import StallMap from "../../components/StallMap";
import ImageViewerModal from "../../components/ImageViewerModal";

const FLOORS = ["1", "2"];

// Same eight categories the web officer dashboard and the Violations tab offer.
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

// Every active (non-rejected) application on a stall, oldest first.
function getActiveApps(stallId, applications) {
  return applications
    .filter((a) => a.stallId === stallId && a.status !== "rejected")
    .sort((a, b) => new Date(a.dateApplied).getTime() - new Date(b.dateApplied).getTime());
}

// The one application that represents the stall's current state: the
// approved tenant if there is one, otherwise whoever applied first.
function getActiveApp(stallId, applications) {
  const active = getActiveApps(stallId, applications);
  return active.find((a) => a.status === "approved") ?? active[0] ?? null;
}

// Matches web's OfficerMapView.jsx and the vendor map: red for an approved
// tenant, amber for a pending application, teal for vacant. Previously this
// screen coloured by violation status instead, which meant it never agreed
// with any other map in the app on what "pending" or "occupied" meant here.
// GET /applications is unscoped for officers (only vendors get filtered to
// their own rows), so this can read every application directly with no
// separate occupied-stalls lookup.
//
// Also mirrors web by letting an officer report a violation right from the
// map, stall already picked — previously that only existed on the separate
// Violations tab, which meant re-picking a stall you'd just tapped here.
export default function OfficerMapScreen() {
  const stallsQuery = useStalls();
  const applicationsQuery = useApplications();
  const violationsQuery = useApiData(getViolations);
  const facilitiesQuery = useMapFacilities();
  const [floor, setFloor] = useState("1");
  const [selectedId, setSelectedId] = useState(null);
  const [viewer, setViewer] = useState(null);

  const [reportStall, setReportStall] = useState(null);
  const [category, setCategory] = useState("Health Violation");
  const [description, setDescription] = useState("");
  const [evidence, setEvidence] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const allStalls = stallsQuery.data?.stalls ?? [];
  const applications = applicationsQuery.data?.applications ?? [];
  const violations = violationsQuery.data?.violations ?? [];

  const stalls = useMemo(() => allStalls.filter((s) => s.floor === floor), [allStalls, floor]);
  const facilities = useMemo(() => (facilitiesQuery.data?.facilities ?? []).filter((item) => item.floor === floor || item.connectedFloors?.includes(floor)), [facilitiesQuery.data, floor]);

  // Still useful to an officer even though it no longer drives the map
  // colour — shown as a supplementary note when a stall is selected.
  const openViolationsByStall = useMemo(() => {
    const map = {};
    for (const v of violations) {
      if (v.status === "open") map[v.stallId] = (map[v.stallId] ?? 0) + 1;
    }
    return map;
  }, [violations]);

  const styleInputs = useMemo(() => {
    const map = {};
    for (const stall of allStalls) {
      const app = getActiveApp(stall.id, applications);
      const occupied = app?.status === "approved";
      map[stall.id] = { occupied, pending: !occupied && app?.status === "pending" };
    }
    return map;
  }, [allStalls, applications]);

  const counts = useMemo(
    () => ({
      1: allStalls.filter((s) => s.floor === "1").length,
      2: allStalls.filter((s) => s.floor === "2").length,
    }),
    [allStalls],
  );

  const occupiedCount = allStalls.filter((s) => styleInputs[s.id]?.occupied).length;
  const pendingCount = allStalls.filter((s) => styleInputs[s.id]?.pending).length;

  const selected = stalls.find((s) => s.id === selectedId) ?? null;
  const selectedApp = selected ? getActiveApp(selected.id, applications) : null;
  const selectedOpenViolations = selected ? (openViolationsByStall[selected.id] ?? 0) : 0;
  const loading = stallsQuery.loading || applicationsQuery.loading;
  const error = stallsQuery.error ?? applicationsQuery.error;

  // base64 so the real photo is stored, not just its name. quality 0.7 keeps
  // a phone camera shot comfortably under the 5 MB limit.
  const capturePhoto = async () => {
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
        setEvidence((prev) => [...prev, { ...file, size: formatFileSize(file.size) }]);
      } catch (e) {
        Alert.alert("Cannot attach photo", e.message);
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
      } catch (e) {
        Alert.alert("Cannot attach file", e.message);
      }
    }
  };

  const openReport = (stall) => {
    setReportStall(stall);
    setCategory("Health Violation");
    setDescription("");
    setEvidence([]);
    setFormError("");
  };

  const submitReport = async () => {
    if (!description.trim()) {
      setFormError("Describe what you observed.");
      return;
    }
    setFormError("");
    setSubmitting(true);
    try {
      await createViolation({
        stallId: reportStall.id,
        category,
        description: description.trim(),
        // Whole object, so the photo contents reach the server.
        evidence,
      });
      setReportStall(null);
      await violationsQuery.refetch();
      Alert.alert("Violation reported", "It now appears in the Violations tab.");
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Could not report the violation.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={["top"]}>
      <OfficerHeader
        title="Stall Map"
        subtitle={`${occupiedCount} occupied · ${pendingCount} pending`}
      />

      <View className="flex-row items-center gap-2 border-b border-gray-200 bg-white px-4 py-3">
        {FLOORS.map((f) => {
          const active = floor === f;
          return (
            <Pressable
              key={f}
              onPress={() => {
                setFloor(f);
                setSelectedId(null);
              }}
              className={`flex-row items-center gap-1.5 rounded-full px-3 py-1.5 ${active ? "bg-amber-500" : "bg-gray-100"}`}
            >
              <Text className={`text-xs font-semibold ${active ? "text-white" : "text-gray-600"}`}>{f}F</Text>
              <Text className={`text-[10px] ${active ? "text-amber-100" : "text-gray-400"}`}>
                {counts[f]}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} />
      ) : stalls.length === 0 && facilities.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-sm font-semibold text-gray-700">No stalls on {floor}F</Text>
          <Text className="mt-1.5 text-center text-xs leading-5 text-gray-400">Try the other floor.</Text>
        </View>
      ) : (
        <StallMap
          stalls={stalls}
          facilities={facilities}
          selectedId={selectedId}
          onSelect={setSelectedId}
          styleInputs={styleInputs}
        />
      )}

      <View className="flex-row gap-4 border-t border-gray-200 bg-white px-4 py-2.5">
        <Legend color="#14B8A6" label="Vacant" />
        <Legend color="#f59e0b" label="Pending" />
        <Legend color="#ef4444" label="Occupied" />
      </View>

      {selected ? (
        <View
          className="absolute inset-x-3 bottom-24 rounded-2xl border border-gray-200 bg-white p-4"
          style={iosShadow("#0f172a", { offsetY: 8, opacity: 0.18, radius: 20 })}
        >
          <View className="flex-row items-start justify-between">
            <View className="flex-1 pr-3">
              <Text className="text-base font-semibold text-gray-900">{selected.stall_name}</Text>
              <Text className="mt-0.5 text-xs text-gray-500">
                Section {selected.section} · {selected.floor}F · {selected.business_type}
              </Text>
            </View>
            <Pressable onPress={() => setSelectedId(null)} hitSlop={10} className="px-2">
              <Text className="text-xs font-medium text-gray-400">Close</Text>
            </Pressable>
          </View>

          {selected.images?.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-3 -mx-1">
              {selected.images
                .filter((img) => img.url)
                .map((img, i, gallery) => (
                  <Pressable key={img.id} onPress={() => setViewer({ images: gallery, index: i })}>
                    <Image
                      source={{ uri: img.url }}
                      className="ml-1 h-20 w-20 rounded-xl bg-gray-100"
                      resizeMode="cover"
                    />
                  </Pressable>
                ))}
            </ScrollView>
          ) : null}

          {selectedApp ? (
            <View className="mt-3 rounded-xl bg-gray-50 px-3 py-2.5">
              <Text className="text-xs font-semibold text-gray-800">{selectedApp.businessName}</Text>
              <Text className="mt-0.5 text-[11px] text-gray-500">
                {selectedApp.applicantName} ·{" "}
                {selectedApp.status === "approved" ? "Occupied" : "Pending application"}
              </Text>
            </View>
          ) : (
            <View className="mt-3 rounded-xl bg-primary-surface px-3 py-2.5">
              <Text className="text-xs text-primary-darker">Vacant — no current occupant.</Text>
            </View>
          )}

          {selectedApp?.status === "approved" ? (
            <View
              className={`mt-2 rounded-xl px-3 py-2.5 ${selectedOpenViolations > 0 ? "bg-red-50" : "bg-emerald-50"}`}
            >
              <Text
                className={`text-xs leading-5 ${selectedOpenViolations > 0 ? "text-red-800" : "text-emerald-800"}`}
              >
                {selectedOpenViolations > 0
                  ? `${selectedOpenViolations} open violation${selectedOpenViolations > 1 ? "s" : ""} on this stall.`
                  : "No open violations on this stall."}
              </Text>
            </View>
          ) : null}

          {selectedApp?.status === "approved" ? (
            <Pressable
              onPress={() => openReport(selected)}
              style={buttonShadow("#f59e0b")}
              className="mt-2 flex-row items-center justify-center rounded-xl bg-amber-500 py-3"
            >
              <Ionicons name="alert-circle-outline" size={16} color="#ffffff" />
              <Text className="ml-1.5 text-sm font-semibold text-white">Report Violation</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      {/* Report modal — same fields as the Violations tab's report form, but
          the stall is already fixed to the one just tapped on the map. */}
      <Modal visible={reportStall !== null} animationType="slide" onRequestClose={() => setReportStall(null)}>
        <SafeAreaView className="flex-1 bg-gray-50" edges={["top"]}>
          <View className="flex-row items-center border-b border-gray-200 bg-white px-4 py-3">
            <Pressable onPress={() => setReportStall(null)} hitSlop={12} className="pr-3">
              <Ionicons name="close" size={22} color="#374151" />
            </Pressable>
            <View className="flex-1">
              <Text className="text-base font-semibold text-gray-900">Report a violation</Text>
              <Text className="text-xs text-gray-500">{reportStall?.stall_name}</Text>
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
        </SafeAreaView>
      </Modal>

      <ImageViewerModal
        images={viewer?.images ?? []}
        startIndex={viewer?.index ?? 0}
        onClose={() => setViewer(null)}
      />
    </SafeAreaView>
  );
}

function Legend({ color, label }) {
  return (
    <View className="flex-row items-center gap-1.5">
      <View style={{ backgroundColor: color }} className="h-2.5 w-2.5 rounded-full" />
      <Text className="text-[11px] text-gray-500">{label}</Text>
    </View>
  );
}
