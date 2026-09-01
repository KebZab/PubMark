import { useState } from "react";
import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { readAssetForUpload, DOCUMENT_PICKER_TYPES } from "../../services/fileUpload";
import { createTransfer, updateApplicationPermit } from "../../services/api";
import { Card, StatusPill, formatDate } from "../../components/ui";

export default function ApplicationDetailScreen({ route, navigation }) {
  const initial = route.params.application;
  const [app, setApp] = useState(initial);
  const [busy, setBusy] = useState(false);

  const [transferOpen, setTransferOpen] = useState(false);
  const [transferEmail, setTransferEmail] = useState("");
  const [transferError, setTransferError] = useState("");
  const [transferSending, setTransferSending] = useState(false);

  // A stall can only be handed on once it's actually yours.
  const canTransfer = app.status === "approved";
  const permitMissing = !app.permitFileName;

  const attachPermit = async (file) => {
    setBusy(true);
    try {
      const { application } = await updateApplicationPermit(app.id, file);
      setApp(application);
      Alert.alert("Permit submitted", "Your business permit has been attached to this application.");
    } catch (e) {
      Alert.alert("Upload failed", e instanceof Error ? e.message : "Could not attach the permit.");
    } finally {
      setBusy(false);
    }
  };

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Camera access needed", "Allow camera access to photograph your permit.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.7, base64: true });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      try {
        await attachPermit(await readAssetForUpload({
          ...asset,
          name: asset.fileName ?? `permit-${Date.now()}.jpg`,
          mimeType: asset.mimeType ?? "image/jpeg",
        }));
      } catch (e) {
        Alert.alert("Cannot attach file", e.message);
      }
    }
  };

  const pickFile = async () => {
    // copyToCacheDirectory copies the pick into app cache, giving a readable
    // file:// uri. Without it Android hands back a content:// uri the file
    // reader cannot open.
    const result = await DocumentPicker.getDocumentAsync({
      type: DOCUMENT_PICKER_TYPES,
      copyToCacheDirectory: true,
    });
    if (!result.canceled && result.assets?.[0]) {
      try {
        await attachPermit(await readAssetForUpload(result.assets[0]));
      } catch (e) {
        Alert.alert("Cannot attach file", e.message);
      }
    }
  };

  const sendTransfer = async () => {
    const email = transferEmail.trim().toLowerCase();
    if (!email) {
      setTransferError("Enter the recipient's email address.");
      return;
    }
    setTransferError("");
    setTransferSending(true);
    try {
      const { transfer } = await createTransfer({
        stallId: app.stallId,
        toUserEmail: email,
        originalApplicationId: app.id,
      });
      setTransferOpen(false);
      setTransferEmail("");
      Alert.alert("Offer sent", `${transfer.toUserName} can now accept or decline this stall.`);
    } catch (e) {
      setTransferError(e instanceof Error ? e.message : "Could not send the offer.");
    } finally {
      setTransferSending(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={["top"]}>
      <View className="flex-row items-center border-b border-gray-200 bg-white px-4 py-3">
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} className="pr-3">
          <Ionicons name="chevron-back" size={22} color="#374151" />
        </Pressable>
        <View className="flex-1">
          <Text className="text-base font-semibold text-gray-900" numberOfLines={1}>
            {app.stallName ?? "Application"}
          </Text>
          <Text className="text-xs text-gray-500">{app.businessName}</Text>
        </View>
        <StatusPill status={app.status} />
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <Card className="p-4">
          <Text className="mb-3 text-sm font-semibold text-gray-800">Application</Text>
          <Row label="Business" value={app.businessName} />
          <Row label="Type" value={app.businessType} />
          <Row label="Stall" value={app.stallName ?? "—"} />
          <Row label="Section" value={app.stallSection ?? "—"} />
          <Row label="Floor area" value={app.floorArea ?? "—"} />
          <Row label="Address" value={app.applicantAddress ?? "—"} />
          <Row label="Submitted" value={formatDate(app.dateApplied)} />
        </Card>

        <Card className="mt-4 p-4">
          <Text className="mb-3 text-sm font-semibold text-gray-800">Contract</Text>
          <Row label="Starts" value={formatDate(app.contractStart)} />
          <Row label="Ends" value={formatDate(app.contractEnd)} />
          <Row label="Term" value={`${app.contractTermMonths} months`} />
        </Card>

        <Card className="mt-4 p-4">
          <Text className="mb-1 text-sm font-semibold text-gray-800">Business permit</Text>

          {app.permitFileName ? (
            <View className="mt-2 flex-row items-center rounded-xl border border-gray-200 bg-gray-50 px-3 py-3">
              <Ionicons name="checkmark-circle" size={18} color="#10b981" />
              <Text className="ml-2 flex-1 text-xs text-gray-700" numberOfLines={1}>
                {app.permitFileName}
              </Text>
            </View>
          ) : (
            <>
              <Text className="mb-3 text-xs leading-5 text-gray-500">
                No permit submitted yet.
                {app.permitDeadlineAt
                  ? ` Deadline: ${formatDate(app.permitDeadlineAt)}.`
                  : " You can add it any time."}
              </Text>
              {busy ? (
                <View className="items-center py-3">
                  <ActivityIndicator color="#14B8A6" />
                </View>
              ) : (
                <View className="flex-row gap-2">
                  <Pressable
                    onPress={takePhoto}
                    className="flex-1 flex-row items-center justify-center rounded-xl border border-gray-200 bg-white py-3"
                  >
                    <Ionicons name="camera-outline" size={18} color="#374151" />
                    <Text className="ml-2 text-xs font-semibold text-gray-700">Take photo</Text>
                  </Pressable>
                  <Pressable
                    onPress={pickFile}
                    className="flex-1 flex-row items-center justify-center rounded-xl border border-gray-200 bg-white py-3"
                  >
                    <Ionicons name="folder-outline" size={18} color="#374151" />
                    <Text className="ml-2 text-xs font-semibold text-gray-700">Choose file</Text>
                  </Pressable>
                </View>
              )}
            </>
          )}
        </Card>

        {app.notes ? (
          <Card className="mt-4 p-4">
            <Text className="mb-2 text-sm font-semibold text-gray-800">Your notes</Text>
            <Text className="text-xs leading-5 text-gray-600">{app.notes}</Text>
          </Card>
        ) : null}

        {app.adminRemarks ? (
          <Card className="mt-4 p-4">
            <Text className="mb-2 text-sm font-semibold text-gray-800">Admin remarks</Text>
            <Text className="text-xs leading-5 text-gray-600">{app.adminRemarks}</Text>
          </Card>
        ) : null}

        {canTransfer ? (
          <>
            <Pressable
              onPress={() => setTransferOpen(true)}
              className="mt-6 flex-row items-center justify-center rounded-xl border border-primary bg-white py-3.5"
            >
              <Ionicons name="swap-horizontal-outline" size={18} color="#0d9488" />
              <Text className="ml-2 text-sm font-semibold text-primary-darker">Transfer this stall</Text>
            </Pressable>
            <Text className="mt-2 text-center text-xs leading-5 text-gray-400">
              Hand this stall to another vendor. They'll get an offer to accept or decline.
            </Text>
          </>
        ) : null}
      </ScrollView>

      <Modal
        visible={transferOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setTransferOpen(false)}
      >
        <View className="flex-1 justify-center bg-black/50 px-6">
          <View className="rounded-2xl bg-white p-5">
            <Text className="text-base font-semibold text-gray-900">Transfer {app.stallName}</Text>
            <Text className="mt-1 text-xs leading-5 text-gray-500">
              Enter the email of the vendor who should receive this stall. They must already have a PubMark
              account.
            </Text>

            <TextInput
              className="mt-4 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-base text-gray-900"
              placeholder="vendor@example.com"
              placeholderTextColor="#9ca3af"
              value={transferEmail}
              onChangeText={(v) => {
                setTransferEmail(v);
                setTransferError("");
              }}
              autoCapitalize="none"
              keyboardType="email-address"
              editable={!transferSending}
            />

            {transferError ? (
              <Text className="mt-2 text-xs leading-5 text-red-600">{transferError}</Text>
            ) : null}

            <View className="mt-5 flex-row gap-2">
              <Pressable
                onPress={() => {
                  setTransferOpen(false);
                  setTransferError("");
                }}
                disabled={transferSending}
                className="flex-1 items-center rounded-xl bg-gray-100 py-3"
              >
                <Text className="text-sm font-semibold text-gray-700">Cancel</Text>
              </Pressable>
              <Pressable
                onPress={sendTransfer}
                disabled={transferSending}
                className={`flex-1 items-center rounded-xl py-3 ${transferSending ? "bg-primary/50" : "bg-primary"}`}
              >
                {transferSending ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text className="text-sm font-semibold text-white">Send offer</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function Row({ label, value }) {
  return (
    <View className="flex-row justify-between py-1.5">
      <Text className="text-xs text-gray-400">{label}</Text>
      <Text className="flex-1 text-right text-xs font-medium text-gray-700">{value}</Text>
    </View>
  );
}
