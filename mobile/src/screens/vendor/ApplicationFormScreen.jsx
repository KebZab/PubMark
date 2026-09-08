import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
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
import { createApplication } from "../../services/api";
import { Card } from "../../components/ui";

// Kept identical to web's list (src/app/pages/ApplicationForm.jsx) — real
// stalls carry exactly these ten values, so the prefill below only lands on
// a matching chip when this list actually matches the web app's.
const BUSINESS_TYPES = [
  "Food & Beverage",
  "Retail",
  "Services",
  "Hardware",
  "Pharmacy",
  "Electronics",
  "General",
  "Vegetables",
  "Meat & Seafood",
  "Fruits",
];
const TERM_OPTIONS = [
  { value: "6", label: "6 Months" },
  { value: "12", label: "1 Year" },
  { value: "24", label: "2 Years" },
  { value: "36", label: "3 Years" },
];

/** Adds whole months to a YYYY-MM-DD date, clamping to the end of short months. */
function addMonths(dateStr, months) {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return null;
  const day = d.getDate();
  const target = new Date(d.getFullYear(), d.getMonth() + months, 1);
  // e.g. Jan 31 + 1 month should land on Feb 28/29, not spill into March.
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  target.setDate(Math.min(day, lastDay));
  const pad = (n) => String(n).padStart(2, "0");
  return `${target.getFullYear()}-${pad(target.getMonth() + 1)}-${pad(target.getDate())}`;
}

function todayISO() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function makeStallEntry(stall) {
  return {
    businessName: "",
    // Pre-selected from the stall's own business type, exactly like the web
    // form — a starting guess, not a lock. Still freely changeable below.
    businessType: stall.businessType || "",
    applicantAddress: "",
    startDate: todayISO(),
    termMonths: "12",
  };
}

export default function ApplicationFormScreen({ route, navigation, pendingApplication }) {
  // Always an array — one stall or several, from the map's single tap or its
  // "Select Multiple" mode. Each stall gets its own business name/type,
  // address and contract dates, since a vendor applying to several stalls at
  // once may be opening different businesses in each. The permit and notes
  // stay a single shared section below — one document, one note, attached to
  // every application in the batch.
  const { stalls: targetStalls } = route.params;
  const isMulti = targetStalls.length > 1;

  // Consumed — clear the pending-selection ref so a stale value can't get
  // re-navigated to later. No-op when this screen was reached from the
  // vendor's own map while already signed in (pendingApplication is only
  // ever passed on the guest-signed-in redirect path).
  useEffect(() => {
    if (pendingApplication) pendingApplication.current = null;
  }, [pendingApplication]);

  const [entries, setEntries] = useState(() => targetStalls.map(makeStallEntry));
  const [notes, setNotes] = useState("");
  const [permit, setPermit] = useState(null);
  const [additional, setAdditional] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  function updateEntry(index, patch) {
    setEntries((prev) => prev.map((entry, i) => (i === index ? { ...entry, ...patch } : entry)));
    setError("");
  }

  const contractEnds = useMemo(
    () => entries.map((entry) => addMonths(entry.startDate, parseInt(entry.termMonths, 10))),
    [entries],
  );
  const canSubmit = entries.every(
    (entry, i) => entry.businessName.trim() && entry.businessType && entry.startDate && contractEnds[i],
  );

  // Camera first — photographing a paper permit is the common case on a phone.
  const takePhoto = async (setter) => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Camera access needed", "Allow camera access to photograph your permit.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.7, base64: true });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      try {
        setter(await readAssetForUpload({
          ...asset,
          name: asset.fileName ?? `permit-${Date.now()}.jpg`,
          mimeType: asset.mimeType ?? "image/jpeg",
        }));
      } catch (e) {
        Alert.alert("Cannot attach file", e.message);
      }
    }
  };

  const pickFile = async (setter) => {
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
        setter(await readAssetForUpload(result.assets[0]));
      } catch (e) {
        Alert.alert("Cannot attach file", e.message);
      }
    }
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setError("");
    setSubmitting(true);
    try {
      // One application per stall, each with its own business details but
      // the same permit/notes attached. allSettled so one stall failing
      // (e.g. someone just got approved on it) doesn't lose the others.
      const results = await Promise.allSettled(
        targetStalls.map((stall, i) => {
          const entry = entries[i];
          return createApplication({
            stallId: stall.id,
            businessName: entry.businessName.trim(),
            businessType: entry.businessType,
            contractStart: entry.startDate,
            contractTermMonths: entry.termMonths,
            contractEnd: contractEnds[i],
            // Whole file objects: the server uploads them and returns links.
            permit: permit ?? null,
            additionalFile: additional ?? null,
            notes: notes.trim(),
            applicantAddress: entry.applicantAddress.trim() || undefined,
          });
        }),
      );

      const succeeded = results.filter((r) => r.status === "fulfilled");
      const failed = results.length - succeeded.length;

      if (succeeded.length === 0) {
        setError("Failed to submit any applications. Please try again.");
        setSubmitting(false);
        return;
      }

      const message =
        results.length === 1
          ? `Your application for ${targetStalls[0].name} is now awaiting admin review.`
          : `${succeeded.length} of ${results.length} applications submitted successfully${
              failed > 0 ? ` (${failed} failed)` : ""
            }.`;

      Alert.alert("Application submitted", message, [
        {
          text: "OK",
          onPress: () => {
            if (succeeded.length === 1) {
              navigation.replace("ApplicationDetail", { application: succeeded[0].value.application });
            } else {
              navigation.navigate("Tabs", { screen: "Applications" });
            }
          },
        },
      ]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not submit the application.");
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={["top"]}>
      <View className="flex-row items-center border-b border-gray-200 bg-white px-4 py-3">
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} className="pr-3">
          <Ionicons name="chevron-back" size={22} color="#374151" />
        </Pressable>
        <View className="flex-1">
          <Text className="text-base font-semibold text-gray-900">
            {isMulti ? `Apply for ${targetStalls.length} stalls` : "Apply for a stall"}
          </Text>
          <Text className="text-xs text-gray-500" numberOfLines={1}>
            {isMulti ? targetStalls.map((s) => s.name).join(", ") : targetStalls[0]?.name}
          </Text>
        </View>
      </View>

      {isMulti ? (
        <View className="border-b border-gray-200 bg-primary-surface px-4 py-2.5">
          <Text className="text-xs leading-5 text-primary-darker">
            Fill in business details for each stall below. The permit and notes near the bottom are
            shared and go on every application.
          </Text>
        </View>
      ) : null}

      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
        >
          {targetStalls.map((stall, i) => {
            const entry = entries[i];
            return (
              <Card key={stall.id} className={i > 0 ? "mt-4 p-4" : "p-4"}>
                {isMulti ? (
                  <View className="mb-3 flex-row items-center gap-1.5 border-b border-gray-100 pb-3">
                    <Ionicons name="storefront-outline" size={15} color="#0d9488" />
                    <Text className="text-sm font-bold text-primary-darker">{stall.name}</Text>
                  </View>
                ) : null}

                <Label text="Business name" required />
                <TextInput
                  className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-base text-gray-900"
                  placeholder="e.g. Dela Cruz Sari-Sari"
                  placeholderTextColor="#9ca3af"
                  value={entry.businessName}
                  onChangeText={(v) => updateEntry(i, { businessName: v })}
                  editable={!submitting}
                />

                <View className="mt-4">
                  <Label text="Business type" required />
                  {stall.businessType ? (
                    <Text className="mb-2 -mt-1 text-xs text-gray-400">
                      Suggested from this stall's listing — tap another to change it.
                    </Text>
                  ) : null}
                  <View className="flex-row flex-wrap gap-2">
                    {BUSINESS_TYPES.map((t) => {
                      const active = entry.businessType === t;
                      return (
                        <Pressable
                          key={t}
                          onPress={() => updateEntry(i, { businessType: t })}
                          disabled={submitting}
                          className={`rounded-full px-3 py-2 ${active ? "bg-primary" : "bg-gray-100"}`}
                        >
                          <Text className={`text-xs font-semibold ${active ? "text-white" : "text-gray-600"}`}>
                            {t}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                <View className="mt-4">
                  <Label text="Address" />
                  <TextInput
                    className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-base text-gray-900"
                    placeholder="Leave blank to use your profile address"
                    placeholderTextColor="#9ca3af"
                    value={entry.applicantAddress}
                    onChangeText={(v) => updateEntry(i, { applicantAddress: v })}
                    editable={!submitting}
                  />
                </View>

                <View className="mt-4">
                  <Label text="Contract start (YYYY-MM-DD)" required />
                  <TextInput
                    className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-base text-gray-900"
                    placeholder="2026-01-01"
                    placeholderTextColor="#9ca3af"
                    value={entry.startDate}
                    onChangeText={(v) => updateEntry(i, { startDate: v })}
                    editable={!submitting}
                    autoCapitalize="none"
                  />
                </View>

                <View className="mt-4">
                  <Label text="Contract term" required />
                  <View className="flex-row flex-wrap gap-2">
                    {TERM_OPTIONS.map((opt) => {
                      const active = entry.termMonths === opt.value;
                      return (
                        <Pressable
                          key={opt.value}
                          onPress={() => updateEntry(i, { termMonths: opt.value })}
                          disabled={submitting}
                          className={`rounded-full px-3 py-2 ${active ? "bg-primary" : "bg-gray-100"}`}
                        >
                          <Text className={`text-xs font-semibold ${active ? "text-white" : "text-gray-600"}`}>
                            {opt.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                <View className="mt-4 rounded-xl bg-primary-surface px-3 py-2.5">
                  <Text className="text-xs text-primary-darker">
                    {contractEnds[i]
                      ? `Contract ends ${contractEnds[i]}`
                      : "Enter a valid start date to see the end date."}
                  </Text>
                </View>
              </Card>
            );
          })}

          {/* Shared across every application in this batch — one permit, one
              set of notes, not repeated per stall. */}
          <Card className="mt-4 p-4">
            <Text className="mb-1 text-sm font-semibold text-gray-800">Business permit</Text>
            <Text className="mb-3 text-xs leading-5 text-gray-500">
              {isMulti
                ? "Optional now — attached to every application above. An admin can set a deadline to submit it later."
                : "Optional now — an admin can set a deadline to submit it later."}
            </Text>
            <FilePickerRow
              file={permit}
              disabled={submitting}
              onCamera={() => takePhoto(setPermit)}
              onBrowse={() => pickFile(setPermit)}
              onClear={() => setPermit(null)}
            />

            <Text className="mb-1 mt-5 text-sm font-semibold text-gray-800">Additional document</Text>
            <FilePickerRow
              file={additional}
              disabled={submitting}
              onCamera={() => takePhoto(setAdditional)}
              onBrowse={() => pickFile(setAdditional)}
              onClear={() => setAdditional(null)}
            />
          </Card>

          <Card className="mt-4 p-4">
            <Label text="Notes" />
            {isMulti ? (
              <Text className="mb-2 -mt-1 text-xs text-gray-400">Shared across every application above.</Text>
            ) : null}
            <TextInput
              className="min-h-[90px] rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-base text-gray-900"
              placeholder="Anything the admin should know"
              placeholderTextColor="#9ca3af"
              value={notes}
              onChangeText={setNotes}
              editable={!submitting}
              multiline
              textAlignVertical="top"
            />
          </Card>

          {error ? (
            <View className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
              <Text className="text-sm leading-5 text-red-700">{error}</Text>
            </View>
          ) : null}

          <Pressable
            onPress={handleSubmit}
            disabled={!canSubmit || submitting}
            className={`mt-6 flex-row items-center justify-center rounded-xl py-4 ${
              !canSubmit || submitting ? "bg-primary/50" : "bg-primary"
            }`}
          >
            {submitting ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text className="text-base font-semibold text-white">
                {isMulti ? `Submit ${targetStalls.length} applications` : "Submit application"}
              </Text>
            )}
          </Pressable>

          {!canSubmit ? (
            <Text className="mt-2 text-center text-xs text-gray-400">
              {isMulti
                ? "Fill in business name, type, and a valid start date for every stall above."
                : "Fill in business name, type, and a valid start date."}
            </Text>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Label({ text, required }) {
  return (
    <Text className="mb-2 text-sm font-medium text-gray-700">
      {text}
      {required ? <Text className="text-status-rejected"> *</Text> : null}
    </Text>
  );
}

function FilePickerRow({ file, disabled, onCamera, onBrowse, onClear }) {
  if (file) {
    return (
      <View className="flex-row items-center rounded-xl border border-gray-200 bg-gray-50 px-3 py-3">
        <Ionicons name="document-attach-outline" size={18} color="#14B8A6" />
        <Text className="ml-2 flex-1 text-xs text-gray-700" numberOfLines={1}>
          {file.name}
        </Text>
        <Pressable onPress={onClear} disabled={disabled} hitSlop={10}>
          <Ionicons name="close-circle" size={18} color="#9ca3af" />
        </Pressable>
      </View>
    );
  }

  return (
    <View className="flex-row gap-2">
      <Pressable
        onPress={onCamera}
        disabled={disabled}
        className="flex-1 flex-row items-center justify-center rounded-xl border border-gray-200 bg-white py-3"
      >
        <Ionicons name="camera-outline" size={18} color="#374151" />
        <Text className="ml-2 text-xs font-semibold text-gray-700">Take photo</Text>
      </Pressable>
      <Pressable
        onPress={onBrowse}
        disabled={disabled}
        className="flex-1 flex-row items-center justify-center rounded-xl border border-gray-200 bg-white py-3"
      >
        <Ionicons name="folder-outline" size={18} color="#374151" />
        <Text className="ml-2 text-xs font-semibold text-gray-700">Choose file</Text>
      </Pressable>
    </View>
  );
}
