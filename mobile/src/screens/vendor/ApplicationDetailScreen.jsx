import { useCallback, useState } from "react";
import { ActivityIndicator, Alert, Linking, Modal, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { readAssetForUpload, DOCUMENT_PICKER_TYPES, formatFileSize } from "../../services/fileUpload";
import { createReceipt, createTransfer, getApplications, getContractRenewals, getReceipts, requestContractRenewal, updateApplicationPermit } from "../../services/api";
import { Card, StatusPill, formatDate } from "../../components/ui";
import {
  formatPermitDeadline,
  getApplicationDisplayStatus,
  getContractEndStatus,
  getRenewalDeadline,
  parsePermitDeadlineMeta,
} from "../../utils/permitDeadline";

const STATUS_CONFIG = {
  pending: {
    icon: "time-outline",
    title: "Pending Review",
    description: "Your application is being reviewed by the admin.",
    box: "border-amber-200 bg-amber-50",
    iconBox: "bg-amber-100",
    iconColor: "#d97706",
  },
  approved: {
    icon: "checkmark-circle-outline",
    title: "Approved",
    description: "Your application has been approved. Coordinate with admin for next steps.",
    box: "border-emerald-200 bg-emerald-50",
    iconBox: "bg-emerald-100",
    iconColor: "#059669",
  },
  rejected: {
    icon: "close-circle-outline",
    title: "Rejected",
    description: "Your application was not approved. See admin remarks below.",
    box: "border-red-200 bg-red-50",
    iconBox: "bg-red-100",
    iconColor: "#dc2626",
  },
  terminated: {
    icon: "close-circle-outline",
    title: "Terminated",
    description: "This application is no longer active.",
    box: "border-slate-200 bg-slate-50",
    iconBox: "bg-slate-200",
    iconColor: "#475569",
  },
};

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function ApplicationDetailScreen({ route, navigation }) {
  const initial = route.params.application;
  const [app, setApp] = useState(initial);
  const [busy, setBusy] = useState(false);

  const [transferOpen, setTransferOpen] = useState(false);
  const [transferEmail, setTransferEmail] = useState("");
  const [transferError, setTransferError] = useState("");
  const [transferSending, setTransferSending] = useState(false);
  const [receipts, setReceipts] = useState([]);
  const [receiptsLoading, setReceiptsLoading] = useState(true);
  const [receiptsError, setReceiptsError] = useState("");
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [receiptFile, setReceiptFile] = useState(null);
  const [receiptAmount, setReceiptAmount] = useState("");
  const [receiptDate, setReceiptDate] = useState(todayISO());
  const [receiptNotes, setReceiptNotes] = useState("");
  const [receiptError, setReceiptError] = useState("");
  const [receiptSending, setReceiptSending] = useState(false);
  const [renewal, setRenewal] = useState(null);
  const [requestingRenewal, setRequestingRenewal] = useState(false);

  const displayStatus = getApplicationDisplayStatus(app);
  const permitMeta = parsePermitDeadlineMeta(app.adminRemarks);
  const permitDeadlineAt = permitMeta.permitDeadlineAt ?? app.permitDeadlineAt;
  const statusConfig = STATUS_CONFIG[displayStatus] ?? STATUS_CONFIG.pending;
  const contractStatus = getContractEndStatus(app.contractEnd);

  // A stall can only be handed on once it's actually yours and still active.
  const canTransfer = displayStatus === "approved";
  // Preserve the web flow for pending/admin-rejected applications while
  // preventing a missed-deadline termination from accepting late documents.
  const canUploadPermit = !app.permitFileName && displayStatus !== "terminated";

  // Route params are only a snapshot. Refreshing on focus keeps status,
  // deadlines and newly uploaded files in sync with the web/admin app.
  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        if (active) {
          setReceiptsLoading(true);
          setReceiptsError("");
        }
        try {
          const [applicationsResult, receiptsResult, renewalsResult] = await Promise.all([
            getApplications(),
            getReceipts(),
            getContractRenewals(),
          ]);
          const latest = applicationsResult.applications?.find((item) => item.id === initial.id);
          if (active && latest) setApp(latest);
          if (active) {
            setReceipts((receiptsResult.receipts ?? []).filter((receipt) => receipt.stallId === initial.stallId));
            setRenewal((renewalsResult.renewals ?? []).find((item) => item.applicationId === initial.id) || null);
            setReceiptsLoading(false);
          }
        } catch (error) {
          // Keep the last usable snapshot; pull-to-refresh happens on the list.
          if (active) {
            setReceiptsLoading(false);
            setReceiptsError(error instanceof Error ? error.message : "Could not load receipts.");
          }
        }
      })();
      return () => {
        active = false;
      };
    }, [initial.id]),
  );

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

  const setPickedReceipt = async (asset) => {
    try {
      setReceiptFile(await readAssetForUpload(asset));
      setReceiptError("");
    } catch (e) {
      setReceiptError(e instanceof Error ? e.message : "Could not read that receipt file.");
    }
  };

  const takeReceiptPhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Camera access needed", "Allow camera access to photograph the receipt.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.7, base64: true });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      await setPickedReceipt({
        ...asset,
        name: asset.fileName ?? `receipt-${Date.now()}.jpg`,
        mimeType: asset.mimeType ?? "image/jpeg",
      });
    }
  };

  const pickReceiptFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: DOCUMENT_PICKER_TYPES,
      copyToCacheDirectory: false,
    });
    if (!result.canceled && result.assets?.[0]) await setPickedReceipt(result.assets[0]);
  };

  const submitReceipt = async () => {
    if (!receiptFile) {
      setReceiptError("Attach the treasurer-issued receipt first.");
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(receiptDate) || Number.isNaN(new Date(`${receiptDate}T00:00:00`).getTime())) {
      setReceiptError("Enter the receipt date as YYYY-MM-DD.");
      return;
    }
    const amount = receiptAmount.trim() ? Number(receiptAmount) : null;
    if (amount !== null && (!Number.isFinite(amount) || amount < 0)) {
      setReceiptError("Enter a valid amount, or leave it blank.");
      return;
    }
    setReceiptSending(true);
    setReceiptError("");
    try {
      const result = await createReceipt({
        stallId: app.stallId,
        amount,
        receiptDate,
        notes: receiptNotes.trim(),
        file: receiptFile,
      });
      setReceipts((current) => [result.receipt, ...current]);
      setReceiptOpen(false);
      setReceiptFile(null);
      setReceiptAmount("");
      setReceiptDate(todayISO());
      setReceiptNotes("");
      Alert.alert("Receipt submitted", "Your receipt is now awaiting admin verification.");
    } catch (e) {
      setReceiptError(e instanceof Error ? e.message : "Could not submit the receipt.");
    } finally {
      setReceiptSending(false);
    }
  };

  const submitRenewal = async () => {
    setRequestingRenewal(true);
    try {
      const result = await requestContractRenewal(app.id, app.contractTermMonths);
      setRenewal(result.renewal);
      Alert.alert("Renewal requested", "Your request is awaiting admin review.");
    } catch (e) { Alert.alert("Could not request renewal", e instanceof Error ? e.message : "Please try again."); }
    finally { setRequestingRenewal(false); }
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
        <StatusPill status={displayStatus} />
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <View className={`mb-4 flex-row items-center rounded-2xl border p-4 ${statusConfig.box}`}>
          <View className={`h-10 w-10 items-center justify-center rounded-xl ${statusConfig.iconBox}`}>
            <Ionicons name={statusConfig.icon} size={21} color={statusConfig.iconColor} />
          </View>
          <View className="ml-3 flex-1">
            <Text className="text-sm font-semibold text-gray-900">{statusConfig.title}</Text>
            <Text className="mt-0.5 text-xs leading-5 text-gray-600">{statusConfig.description}</Text>
          </View>
        </View>

        {displayStatus === "approved" && !app.permitFileName && permitDeadlineAt ? (
          <View className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <Text className="text-sm font-semibold text-amber-900">Business permit deadline</Text>
            <Text className="mt-1 text-xs leading-5 text-amber-700">
              Submit your business permit on or before {formatPermitDeadline(permitDeadlineAt)} to keep
              this approved application active.
            </Text>
            {permitMeta.permitDeadlineUpdatedAt ? (
              <Text className="mt-2 text-[10px] font-medium text-amber-800">
                Deadline updated {formatPermitDeadline(permitMeta.permitDeadlineUpdatedAt)}
              </Text>
            ) : null}
          </View>
        ) : null}

        {displayStatus === "approved" && contractStatus.urgency !== "none" ? (
          <View
            className={`mb-4 rounded-2xl border p-4 ${contractStatus.urgency === "notice" ? "border-amber-200 bg-amber-50" : "border-red-200 bg-red-50"}`}
          >
            <Text
              className={`text-sm font-semibold ${contractStatus.urgency === "notice" ? "text-amber-900" : "text-red-900"}`}
            >
              {contractStatus.urgency === "expired" ? "Contract term has ended" : "Contract ending soon"}
            </Text>
            <Text
              className={`mt-1 text-xs leading-5 ${contractStatus.urgency === "notice" ? "text-amber-700" : "text-red-700"}`}
            >
              {contractStatus.urgency === "expired"
                ? `Your contract ended ${formatDate(app.contractEnd)}. Request renewal by ${formatDate(getRenewalDeadline(app))}.`
                : `Your contract ends in ${contractStatus.daysRemaining} day${contractStatus.daysRemaining === 1 ? "" : "s"}, on ${formatDate(app.contractEnd)}.`}
            </Text>
            {renewal?.status === "pending" ? (
              <Text className="mt-2 text-xs font-semibold text-blue-700">Renewal pending admin review.</Text>
            ) : renewal?.status === "rejected" ? (
              <Text className="mt-2 text-xs font-semibold text-red-700">Renewal rejected{renewal.remarks ? `: ${renewal.remarks}` : "."}</Text>
            ) : (
              <Pressable onPress={submitRenewal} disabled={requestingRenewal} className="mt-3 items-center rounded-xl bg-primary py-3">
                {requestingRenewal ? <ActivityIndicator color="#fff" /> : <Text className="text-xs font-semibold text-white">Request {app.contractTermMonths}-month renewal</Text>}
              </Pressable>
            )}
          </View>
        ) : null}

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
            <Pressable
              onPress={() => (app.permitUrl ? Linking.openURL(app.permitUrl) : null)}
              disabled={!app.permitUrl}
              className="mt-2 flex-row items-center rounded-xl border border-gray-200 bg-gray-50 px-3 py-3"
            >
              <Ionicons name="checkmark-circle" size={18} color="#10b981" />
              <View className="ml-2 flex-1">
                <Text className="text-xs font-semibold text-gray-700" numberOfLines={1}>
                  {app.permitFileName}
                </Text>
                <Text className="mt-0.5 text-[10px] text-gray-400">
                  Business Permit{app.permitUrl ? " · Tap to open" : ""}
                </Text>
              </View>
              <View className="rounded-full bg-emerald-100 px-2 py-1">
                <Text className="text-[10px] font-semibold text-emerald-700">Uploaded</Text>
              </View>
            </Pressable>
          ) : canUploadPermit ? (
            <>
              <Text className="mb-3 text-xs leading-5 text-gray-500">
                No permit submitted yet.
                {permitDeadlineAt
                  ? ` Deadline: ${formatPermitDeadline(permitDeadlineAt)}.`
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
          ) : (
            <View className="mt-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-3">
              <Text className="text-xs leading-5 text-gray-500">
                No permit was submitted. This application is no longer active, so documents can no
                longer be added.
              </Text>
            </View>
          )}
        </Card>

        {displayStatus === "approved" ? (
          <Card className="mt-4 p-4">
            <View className="mb-3 flex-row items-center justify-between">
              <View className="flex-row items-center">
                <Ionicons name="receipt-outline" size={18} color="#0d9488" />
                <Text className="ml-2 text-sm font-semibold text-gray-800">Payment receipts</Text>
              </View>
              <View className="rounded-full bg-amber-100 px-2 py-1">
                <Text className="text-[10px] font-semibold text-amber-700">
                  {receipts.filter((receipt) => receipt.status === "pending").length} pending
                </Text>
              </View>
            </View>

            {receiptsLoading ? (
              <ActivityIndicator color="#14B8A6" />
            ) : receiptsError ? (
              <Text className="mb-3 text-xs leading-5 text-red-600">Could not load receipts: {receiptsError}</Text>
            ) : receipts.length === 0 ? (
              <Text className="mb-3 text-xs leading-5 text-gray-400">No receipts submitted for this stall yet.</Text>
            ) : (
              <View className="mb-3 gap-2">
                {receipts.map((receipt) => (
                  <Pressable
                    key={receipt.id}
                    onPress={() => (receipt.fileUrl ? Linking.openURL(receipt.fileUrl) : null)}
                    disabled={!receipt.fileUrl}
                    className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-3"
                  >
                    <View className="flex-row items-start">
                      <View className="h-9 w-9 items-center justify-center rounded-lg bg-teal-50">
                        <Ionicons name="receipt-outline" size={17} color="#0d9488" />
                      </View>
                      <View className="ml-3 flex-1">
                        <Text className="text-xs font-semibold text-gray-800">
                          {receipt.amount !== null ? `₱${Number(receipt.amount).toLocaleString()}` : receipt.fileName}
                        </Text>
                        <Text className="mt-0.5 text-[10px] text-gray-500">
                          {formatDate(receipt.receiptDate)}{receipt.submittedByRole === "officer" ? " · Submitted by officer" : ""}
                        </Text>
                        {receipt.remarks ? <Text className="mt-1 text-[10px] text-gray-500">Admin: {receipt.remarks}</Text> : null}
                        {!receipt.fileUrl ? <Text className="mt-1 text-[10px] italic text-gray-400">File unavailable</Text> : null}
                      </View>
                      <View className={`rounded-full px-2 py-1 ${
                        receipt.status === "verified" ? "bg-emerald-100" : receipt.status === "rejected" ? "bg-red-100" : "bg-amber-100"
                      }`}>
                        <Text className={`text-[10px] font-semibold capitalize ${
                          receipt.status === "verified" ? "text-emerald-700" : receipt.status === "rejected" ? "text-red-700" : "text-amber-700"
                        }`}>{receipt.status}</Text>
                      </View>
                    </View>
                  </Pressable>
                ))}
              </View>
            )}

            <Pressable
              onPress={() => {
                setReceiptError("");
                setReceiptOpen(true);
              }}
              className="flex-row items-center justify-center rounded-xl bg-primary py-3"
            >
              <Ionicons name="cloud-upload-outline" size={18} color="#ffffff" />
              <Text className="ml-2 text-sm font-semibold text-white">Submit treasurer-issued receipt</Text>
            </Pressable>
          </Card>
        ) : null}

        {app.notes ? (
          <Card className="mt-4 p-4">
            <Text className="mb-2 text-sm font-semibold text-gray-800">Your notes</Text>
            <Text className="text-xs leading-5 text-gray-600">{app.notes}</Text>
          </Card>
        ) : null}

        {permitMeta.visibleRemarks ? (
          <Card className="mt-4 p-4">
            <Text className="mb-2 text-sm font-semibold text-gray-800">Admin remarks</Text>
            <Text className="text-xs leading-5 text-gray-600">{permitMeta.visibleRemarks}</Text>
          </Card>
        ) : (
          <Card className="mt-4 p-4">
            <Text className="mb-2 text-sm font-semibold text-gray-800">Admin remarks</Text>
            <Text className="text-center text-xs italic leading-5 text-gray-400">
              {displayStatus === "pending" ? "No remarks yet — under review." : "No remarks provided."}
            </Text>
          </Card>
        )}

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
        visible={receiptOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setReceiptOpen(false)}
      >
        <View className="flex-1 justify-center bg-black/50 px-5">
          <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "center", paddingVertical: 24 }}>
            <View className="rounded-2xl bg-white p-5">
              <View className="flex-row items-start justify-between">
                <View className="flex-1 pr-4">
                  <Text className="text-base font-semibold text-gray-900">Submit payment receipt</Text>
                  <Text className="mt-1 text-xs leading-5 text-gray-500">Upload the receipt issued by the treasurer for {app.stallName}.</Text>
                </View>
                <Pressable onPress={() => setReceiptOpen(false)} hitSlop={12} disabled={receiptSending}>
                  <Ionicons name="close" size={22} color="#6b7280" />
                </Pressable>
              </View>

              <Text className="mb-2 mt-4 text-xs font-semibold text-gray-700">Receipt file *</Text>
              {receiptFile ? (
                <View className="flex-row items-center rounded-xl border border-teal-200 bg-teal-50 px-3 py-3">
                  <Ionicons name="document-attach-outline" size={18} color="#0d9488" />
                  <View className="ml-2 flex-1">
                    <Text className="text-xs font-semibold text-gray-700" numberOfLines={1}>{receiptFile.name}</Text>
                    <Text className="text-[10px] text-gray-400">{formatFileSize(receiptFile.size)}</Text>
                  </View>
                  <Pressable onPress={() => setReceiptFile(null)} hitSlop={10}>
                    <Ionicons name="close-circle" size={18} color="#6b7280" />
                  </Pressable>
                </View>
              ) : (
                <View className="flex-row gap-2">
                  <Pressable onPress={takeReceiptPhoto} className="flex-1 flex-row items-center justify-center rounded-xl border border-gray-200 py-3">
                    <Ionicons name="camera-outline" size={18} color="#374151" />
                    <Text className="ml-2 text-xs font-semibold text-gray-700">Take photo</Text>
                  </Pressable>
                  <Pressable onPress={pickReceiptFile} className="flex-1 flex-row items-center justify-center rounded-xl border border-gray-200 py-3">
                    <Ionicons name="folder-outline" size={18} color="#374151" />
                    <Text className="ml-2 text-xs font-semibold text-gray-700">Choose file</Text>
                  </Pressable>
                </View>
              )}

              <Text className="mb-2 mt-4 text-xs font-semibold text-gray-700">Amount (optional)</Text>
              <TextInput
                value={receiptAmount}
                onChangeText={setReceiptAmount}
                keyboardType="decimal-pad"
                placeholder="0.00"
                placeholderTextColor="#9ca3af"
                editable={!receiptSending}
                className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-base text-gray-900"
              />
              <Text className="mb-2 mt-4 text-xs font-semibold text-gray-700">Receipt date (YYYY-MM-DD)</Text>
              <TextInput
                value={receiptDate}
                onChangeText={setReceiptDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#9ca3af"
                editable={!receiptSending}
                className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-base text-gray-900"
              />
              <Text className="mb-2 mt-4 text-xs font-semibold text-gray-700">Notes (optional)</Text>
              <TextInput
                value={receiptNotes}
                onChangeText={setReceiptNotes}
                placeholder="Add a reference number or note"
                placeholderTextColor="#9ca3af"
                editable={!receiptSending}
                multiline
                className="min-h-20 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900"
              />
              {receiptError ? <Text className="mt-3 text-xs leading-5 text-red-600">{receiptError}</Text> : null}

              <View className="mt-5 flex-row gap-2">
                <Pressable onPress={() => setReceiptOpen(false)} disabled={receiptSending} className="flex-1 items-center rounded-xl bg-gray-100 py-3">
                  <Text className="text-sm font-semibold text-gray-700">Cancel</Text>
                </Pressable>
                <Pressable onPress={submitReceipt} disabled={receiptSending} className={`flex-1 items-center rounded-xl py-3 ${receiptSending ? "bg-primary/50" : "bg-primary"}`}>
                  {receiptSending ? <ActivityIndicator color="#ffffff" /> : <Text className="text-sm font-semibold text-white">Submit receipt</Text>}
                </Pressable>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>

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
