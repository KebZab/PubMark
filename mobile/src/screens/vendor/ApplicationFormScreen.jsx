import { useMemo, useState } from "react";
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
import { createApplication } from "../../services/api";
import { Card } from "../../components/ui";

// Same options the web form offers.
const BUSINESS_TYPES = ["General", "Food", "Electronics", "Clothing", "Hardware", "Services", "Other"];
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

export default function ApplicationFormScreen({ route, navigation }) {
  const { stallId, stallName } = route.params;

  const [businessName, setBusinessName] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [applicantAddress, setApplicantAddress] = useState("");
  const [startDate, setStartDate] = useState(todayISO());
  const [termMonths, setTermMonths] = useState("12");
  const [notes, setNotes] = useState("");
  const [permit, setPermit] = useState(null);
  const [additional, setAdditional] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const contractEnd = useMemo(() => addMonths(startDate, parseInt(termMonths, 10)), [startDate, termMonths]);
  const canSubmit = Boolean(businessName.trim() && businessType && startDate && contractEnd);

  // Camera first — photographing a paper permit is the common case on a phone.
  const takePhoto = async (setter) => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Camera access needed", "Allow camera access to photograph your permit.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setter({ name: asset.fileName ?? `permit-${Date.now()}.jpg` });
    }
  };

  const pickFile = async (setter) => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ["application/pdf", "image/*"],
      copyToCacheDirectory: false,
    });
    if (!result.canceled && result.assets?.[0]) {
      setter({ name: result.assets[0].name });
    }
  };

  const handleSubmit = async () => {
    if (!canSubmit || !contractEnd) return;
    setError("");
    setSubmitting(true);
    try {
      await createApplication({
        stallId,
        businessName: businessName.trim(),
        businessType,
        contractStart: startDate,
        contractTermMonths: termMonths,
        contractEnd,
        permitPath: permit?.name ?? null,
        additionalFilePath: additional?.name ?? null,
        notes: notes.trim(),
        applicantAddress: applicantAddress.trim() || undefined,
      });
      Alert.alert(
        "Application submitted",
        `Your application for ${stallName} is now awaiting admin review.`,
        [{ text: "OK", onPress: () => navigation.goBack() }],
      );
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
          <Text className="text-base font-semibold text-gray-900">Apply for a stall</Text>
          <Text className="text-xs text-gray-500">{stallName}</Text>
        </View>
      </View>

      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
        >
          <Card className="p-4">
            <Label text="Business name" required />
            <TextInput
              className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-base text-gray-900"
              placeholder="e.g. Dela Cruz Sari-Sari"
              placeholderTextColor="#9ca3af"
              value={businessName}
              onChangeText={(v) => {
                setBusinessName(v);
                setError("");
              }}
              editable={!submitting}
            />

            <View className="mt-4">
              <Label text="Business type" required />
              <View className="flex-row flex-wrap gap-2">
                {BUSINESS_TYPES.map((t) => {
                  const active = businessType === t;
                  return (
                    <Pressable
                      key={t}
                      onPress={() => setBusinessType(t)}
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
                value={applicantAddress}
                onChangeText={setApplicantAddress}
                editable={!submitting}
              />
            </View>
          </Card>

          <Card className="mt-4 p-4">
            <Label text="Contract start (YYYY-MM-DD)" required />
            <TextInput
              className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-base text-gray-900"
              placeholder="2026-01-01"
              placeholderTextColor="#9ca3af"
              value={startDate}
              onChangeText={(v) => {
                setStartDate(v);
                setError("");
              }}
              editable={!submitting}
              autoCapitalize="none"
            />

            <View className="mt-4">
              <Label text="Contract term" required />
              <View className="flex-row flex-wrap gap-2">
                {TERM_OPTIONS.map((opt) => {
                  const active = termMonths === opt.value;
                  return (
                    <Pressable
                      key={opt.value}
                      onPress={() => setTermMonths(opt.value)}
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
                {contractEnd
                  ? `Contract ends ${contractEnd}`
                  : "Enter a valid start date to see the end date."}
              </Text>
            </View>
          </Card>

          <Card className="mt-4 p-4">
            <Text className="mb-1 text-sm font-semibold text-gray-800">Business permit</Text>
            <Text className="mb-3 text-xs leading-5 text-gray-500">
              Optional now — an admin can set a deadline to submit it later.
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
              <Text className="text-base font-semibold text-white">Submit application</Text>
            )}
          </Pressable>

          {!canSubmit ? (
            <Text className="mt-2 text-center text-xs text-gray-400">
              Fill in business name, type, and a valid start date.
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
