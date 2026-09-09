import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Modal,
  RefreshControl,
  ScrollView,
  Text,
  View,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";
import { useApplications } from "../../hooks/useApplications";
import { createTerminationRequest } from "../../services/api";
import { Card, ErrorState, LoadingState, StatusPill, formatDate } from "../../components/ui";
import { getApplicationDisplayStatus } from "../../utils/permitDeadline";

function InfoRow({ label, value }) {
  return (
    <View className="rounded-xl bg-gray-100 px-4 py-3">
      <Text className="text-[10px] font-medium uppercase tracking-wide text-gray-400">{label}</Text>
      <Text className="mt-1 text-sm font-semibold text-gray-900">{value}</Text>
    </View>
  );
}

export default function HomeScreen({ navigation }) {
  const { user, signOut } = useAuth();
  const { data, loading, error, refetch } = useApplications();
  const [showDropdown, setShowDropdown] = useState(false);
  const [dropdownMounted, setDropdownMounted] = useState(false);
  const dropdownAnim = useRef(new Animated.Value(0)).current;
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [terminateConfirm, setTerminateConfirm] = useState(false);
  const [terminating, setTerminating] = useState(false);
  const [terminateError, setTerminateError] = useState("");

  // Drives the dropdown's open/close animation on the native UI thread
  // (useNativeDriver) rather than snapping instantly -- kept mounted a beat
  // longer on close so the fade/scale-out is visible before it unmounts.
  useEffect(() => {
    if (showDropdown) {
      setDropdownMounted(true);
      Animated.timing(dropdownAnim, {
        toValue: 1,
        duration: 160,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(dropdownAnim, {
        toValue: 0,
        duration: 120,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) setDropdownMounted(false);
      });
    }
  }, [showDropdown, dropdownAnim]);

  const closeProfileModal = () => {
    setShowProfileModal(false);
    setTerminateConfirm(false);
    setTerminateError("");
  };

  const handleTerminateAccount = async () => {
    setTerminating(true);
    setTerminateError("");
    try {
      await createTerminationRequest({ type: "account", reason: "User-initiated account termination request" });
      closeProfileModal();
      Alert.alert("Request submitted", "Your account termination request has been sent to the admin for review.");
    } catch (e) {
      setTerminateError(e instanceof Error ? e.message : "Could not submit the request.");
    } finally {
      setTerminating(false);
    }
  };

  // Kept mounted while you're on another tab, so this stays stale until a
  // manual pull-to-refresh unless refetched on every return to this tab.
  // The cleanup (fires on blur, i.e. switching to another tab) also closes
  // the profile dropdown -- without it, this screen stays mounted with
  // showDropdown still true, so it's sitting there already open the moment
  // you tab back in.
  useFocusEffect(
    useCallback(() => {
      refetch();
      return () => setShowDropdown(false);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  // The /applications endpoint returns every application; a vendor should only
  // ever see their own, so filter client-side by the logged-in user's id.
  const mine = useMemo(() => {
    if (!data?.applications || !user) return [];
    return data.applications.filter((a) => a.userId === user.id);
  }, [data, user]);

  const stats = useMemo(
    () => ({
      total: mine.length,
      pending: mine.filter((a) => a.status === "pending").length,
      approved: mine.filter((a) => a.status === "approved").length,
      rejected: mine.filter((a) => a.status === "rejected").length,
    }),
    [mine],
  );

  const recent = useMemo(
    () =>
      [...mine]
        .sort((a, b) => new Date(b.dateApplied).getTime() - new Date(a.dateApplied).getTime())
        .slice(0, 5),
    [mine],
  );

  const firstName = user?.name?.split(" ")[0] ?? "";
  const permitUploads = mine.filter(
    (app) => getApplicationDisplayStatus(app) === "approved" && !app.permitFileName,
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={["top"]}>
      {/* Top header — mirrors the web dashboard's "Welcome back" bar (minus
          the notification bell, which mobile doesn't have a feed for). The
          dropdown below is absolutely positioned so it floats over the
          content underneath, the same way it does on web, instead of
          pushing the page content down when it opens. Elevation on this
          outer View is raised only while open, so it paints above the
          ScrollView sibling on Android too. */}
      <View
        className="border-b border-gray-200 bg-white px-4 py-3"
        style={{ zIndex: dropdownMounted ? 20 : 0, elevation: dropdownMounted ? 20 : 0 }}
      >
        <View className="relative self-start">
          <Pressable onPress={() => setShowDropdown((v) => !v)} className="flex-row items-center gap-2.5">
            <View className="h-10 w-10 items-center justify-center rounded-xl bg-primary">
              <Ionicons name="person" size={20} color="#ffffff" />
            </View>
            <View>
              <Text className="text-xs leading-none text-gray-500">Welcome back</Text>
              <View className="mt-0.5 flex-row items-center gap-1">
                <Text className="text-sm font-bold leading-none text-gray-900">{user?.name ?? "..."}</Text>
                <Ionicons name={showDropdown ? "chevron-up" : "chevron-down"} size={14} color="#9ca3af" />
              </View>
            </View>
          </Pressable>

          {dropdownMounted ? (
            <Animated.View
              pointerEvents={showDropdown ? "auto" : "none"}
              style={{
                position: "absolute",
                top: "100%",
                left: 0,
                marginTop: 8,
                width: 208,
                elevation: 6,
                backgroundColor: "#ffffff",
                borderRadius: 16,
                borderWidth: 1,
                borderColor: "#f3f4f6",
                paddingVertical: 8,
                overflow: "hidden",
                shadowColor: "#000000",
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.12,
                shadowRadius: 16,
                opacity: dropdownAnim,
                transform: [
                  { scale: dropdownAnim.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1] }) },
                  { translateY: dropdownAnim.interpolate({ inputRange: [0, 1], outputRange: [-6, 0] }) },
                ],
              }}
            >
              <View className="border-b border-gray-100 px-4 py-2.5">
                <Text className="text-xs font-semibold text-gray-900">{user?.name ?? ""}</Text>
                <Text className="mt-0.5 text-[11px] text-gray-400">{user?.email ?? ""}</Text>
              </View>
              <Pressable
                onPress={() => {
                  setShowDropdown(false);
                  setShowProfileModal(true);
                }}
                className="flex-row items-center gap-3 px-4 py-2.5"
              >
                <View className="h-7 w-7 items-center justify-center rounded-lg bg-primary-surface">
                  <Ionicons name="settings-outline" size={14} color="#0d9488" />
                </View>
                <Text className="text-sm text-gray-700">Profile Settings</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  setShowDropdown(false);
                  signOut();
                }}
                className="flex-row items-center gap-3 px-4 py-2.5"
              >
                <View className="h-7 w-7 items-center justify-center rounded-lg bg-red-50">
                  <Ionicons name="log-out-outline" size={14} color="#ef4444" />
                </View>
                <Text className="text-sm text-red-600">Log Out</Text>
              </Pressable>
            </Animated.View>
          ) : null}
        </View>
      </View>

      {/* Full-screen invisible tap-to-dismiss layer -- sits above the
          ScrollView (elevation 0) but below the header (elevation 20, only
          while the dropdown is open), so tapping anywhere outside the
          dropdown closes it without blocking taps on the header itself. */}
      {dropdownMounted ? (
        <Pressable
          onPress={() => setShowDropdown(false)}
          style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, zIndex: 10, elevation: 10 }}
        />
      ) : null}

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} tintColor="#14B8A6" />}
      >
        {/* Hero — mirrors the web dashboard's teal gradient banner */}
        <View className="mx-4 mt-4 overflow-hidden rounded-2xl bg-primary-dark p-5">
          <Text className="text-xs font-medium text-primary-light">PubMark — Smart Public Market</Text>
          <Text className="mt-2 text-lg font-bold leading-snug text-white">Good day, {firstName}! 👋</Text>
          <Text className="mt-1 text-xs text-primary-light">Here's a summary of your stall activity.</Text>
        </View>

        {loading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState message={error} />
        ) : (
          <>
            {/* Stats row — same four counts as web */}
            <View className="mt-4 flex-row gap-2 px-4">
              {[
                { label: "Total", value: stats.total, color: "text-gray-900" },
                { label: "Pending", value: stats.pending, color: "text-amber-500" },
                { label: "Approved", value: stats.approved, color: "text-emerald-500" },
                { label: "Rejected", value: stats.rejected, color: "text-red-500" },
              ].map((s) => (
                <Card key={s.label} className="flex-1 items-center py-3">
                  <Text className={`text-lg font-bold ${s.color}`}>{s.value}</Text>
                  <Text className="mt-0.5 text-[10px] text-gray-500">{s.label}</Text>
                </Card>
              ))}
            </View>

            {permitUploads.length > 0 ? (
              <Pressable
                onPress={() => navigation.navigate("Applications")}
                className="mx-4 mt-4 flex-row items-center rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3"
              >
                <View className="h-8 w-8 items-center justify-center rounded-xl bg-amber-100">
                  <Ionicons name="cloud-upload-outline" size={17} color="#d97706" />
                </View>
                <View className="ml-3 flex-1">
                  <Text className="text-xs font-semibold text-amber-900">
                    Action required — upload permit
                  </Text>
                  <Text className="mt-0.5 text-[10px] text-amber-700">
                    {permitUploads.length === 1
                      ? "Your approved stall needs a business permit on file."
                      : `${permitUploads.length} approved stalls need a business permit on file.`}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#f59e0b" />
              </Pressable>
            ) : null}

            <View className="mt-6 px-4">
              <Text className="mb-3 text-sm font-semibold text-gray-800">Recent Applications</Text>

              {recent.length === 0 ? (
                <Card className="items-center px-5 py-10">
                  <Text className="text-sm font-semibold text-gray-700">No applications yet</Text>
                  <Text className="mt-1.5 text-center text-xs leading-5 text-gray-400">
                    Browse the Map tab to find a stall and apply.
                  </Text>
                </Card>
              ) : (
                <View className="gap-3">
                  {recent.map((app) => (
                    <Pressable
                      key={app.id}
                      onPress={() => navigation.navigate("ApplicationDetail", { application: app })}
                    >
                    <Card className="p-4">
                      <View className="flex-row items-start justify-between">
                        <View className="flex-1 pr-3">
                          <Text className="text-sm font-semibold text-gray-900" numberOfLines={1}>
                            {app.stallName ?? "Stall"}
                          </Text>
                          <Text className="mt-0.5 text-xs text-gray-500" numberOfLines={1}>
                            {app.businessName} · {app.businessType}
                          </Text>
                        </View>
                        <StatusPill status={getApplicationDisplayStatus(app)} />
                      </View>
                      <Text className="mt-3 text-[11px] text-gray-400">
                        Applied {formatDate(app.dateApplied)}
                      </Text>
                    </Card>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>

      <Modal visible={showProfileModal} animationType="slide" onRequestClose={closeProfileModal}>
        <SafeAreaView className="flex-1 bg-gray-50" edges={["top"]}>
          <View className="flex-row items-center gap-3 border-b border-gray-200 bg-white px-5 py-4">
            <View className="h-11 w-11 items-center justify-center rounded-xl bg-primary">
              <Ionicons name="person" size={20} color="#ffffff" />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-bold text-gray-900">{user?.name}</Text>
              <Text className="text-xs text-gray-400">{user?.email}</Text>
            </View>
            <Pressable onPress={closeProfileModal} hitSlop={10} className="h-8 w-8 items-center justify-center rounded-full bg-gray-100">
              <Ionicons name="close" size={16} color="#4b5563" />
            </Pressable>
          </View>

          <ScrollView className="flex-1" contentContainerStyle={{ padding: 20 }}>
            <Text className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">Account Info</Text>
            <View className="gap-3">
              <InfoRow label="Full Name" value={user?.name} />
              <InfoRow label="Email Address" value={user?.email} />
              <InfoRow label="Role" value="Vendor" />
            </View>

            {/* Danger zone — a compact, expandable row rather than a
                standalone hero card, matching this app's existing list-row
                conventions (e.g. the dropdown above) instead of a generic
                icon-heading-paragraph-button block. */}
            <View className="mt-8">
              <Text className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Account Termination</Text>
              <View className="overflow-hidden rounded-2xl border border-red-100 bg-white">
                {!terminateConfirm ? (
                  <Pressable
                    onPress={() => setTerminateConfirm(true)}
                    className="flex-row items-center gap-3 px-4 py-4 active:bg-red-50"
                  >
                    <View className="h-9 w-9 items-center justify-center rounded-full bg-red-50">
                      <Ionicons name="close-circle-outline" size={18} color="#ef4444" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-sm font-semibold text-gray-900">Terminate Account</Text>
                      <Text className="mt-0.5 text-xs text-gray-500">
                        Request to permanently close your PubMark account
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color="#d1d5db" />
                  </Pressable>
                ) : (
                  <View className="px-4 py-4">
                    <View className="flex-row items-start gap-2.5 rounded-xl bg-red-50 p-3">
                      <Ionicons name="warning" size={16} color="#ef4444" style={{ marginTop: 1 }} />
                      <Text className="flex-1 text-xs leading-5 text-red-700">
                        This submits a request to close your account. An admin will review it before
                        it takes effect.
                      </Text>
                    </View>
                    {terminateError ? (
                      <Text className="mt-2 text-xs text-red-600">{terminateError}</Text>
                    ) : null}
                    <View className="mt-3 flex-row gap-2">
                      <Pressable
                        onPress={() => {
                          setTerminateConfirm(false);
                          setTerminateError("");
                        }}
                        disabled={terminating}
                        className="flex-1 items-center rounded-xl border border-gray-200 py-2.5"
                      >
                        <Text className="text-xs font-medium text-gray-600">Cancel</Text>
                      </Pressable>
                      <Pressable
                        onPress={handleTerminateAccount}
                        disabled={terminating}
                        className={`flex-1 items-center rounded-xl py-2.5 ${terminating ? "bg-red-300" : "bg-red-500"}`}
                      >
                        {terminating ? (
                          <ActivityIndicator color="#ffffff" size="small" />
                        ) : (
                          <Text className="text-xs font-semibold text-white">Confirm Request</Text>
                        )}
                      </Pressable>
                    </View>
                  </View>
                )}
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
