import { useMemo, useState } from "react";
import { Image, Modal, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { useApiData } from "../hooks/useApiData";
import { getStalls, getStallReservations } from "../services/api";
import StallMap from "../components/StallMap";
import ImageViewerModal from "../components/ImageViewerModal";
import { LoadingState } from "../components/ui";

// Both endpoints are public. Never fetch applications or applicant profiles here.
async function getGuestMapData() {
  const [stalls, reservations] = await Promise.all([getStalls(), getStallReservations()]);
  return { stalls: stalls.stalls, ...reservations };
}

function Action({ children, onPress, primary = false, icon }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} className={`min-h-11 flex-row items-center justify-center gap-1 rounded-xl border px-3 py-2 ${primary ? "border-primary bg-primary" : "border-primary bg-white"}`}>
      {icon ? <Ionicons name={icon} size={16} color={primary ? "white" : "#0d9488"} /> : null}
      <Text className={`text-xs font-semibold ${primary ? "text-white" : "text-primary-dark"}`}>{children}</Text>
    </Pressable>
  );
}

export default function GuestMapScreen({ navigation, pendingApplication }) {
  const query = useApiData(getGuestMapData);
  const [floor, setFloor] = useState("1");
  const [selectedId, setSelectedId] = useState(null);
  const [multi, setMulti] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [notice, setNotice] = useState("");
  const [applicationTargets, setApplicationTargets] = useState(null);
  const [viewer, setViewer] = useState(null);
  const allStalls = query.data?.stalls ?? [];
  const stalls = useMemo(() => allStalls.filter((s) => s.floor === floor), [allStalls, floor]);
  const styleInputs = useMemo(() => {
    const occupied = new Set(query.data?.approved ?? []);
    const pending = new Set(query.data?.pending ?? []);
    return Object.fromEntries((query.data?.stalls ?? []).map((s) => [s.id, {
      occupied: occupied.has(s.id), pending: !occupied.has(s.id) && pending.has(s.id), occupiedColor: "#9ca3af",
    }]));
  }, [query.data]);
  const selected = stalls.find((s) => s.id === selectedId);
  const status = selected ? styleInputs[selected.id] : {};
  const targets = allStalls.filter((s) => selectedIds.has(s.id) && !styleInputs[s.id]?.occupied);

  function select(id) {
    setNotice("");
    if (!multi) { setSelectedId((prev) => prev === id ? null : id); return; }
    if (styleInputs[id]?.occupied) { setNotice("That stall is occupied and cannot be selected."); return; }
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function authenticate(screen, chosen = null) {
    pendingApplication.current = chosen?.map((s) => ({ id: s.id, name: s.stall_name, businessType: s.business_type })) ?? null;
    setApplicationTargets(null);
    navigation.navigate(screen);
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="dark" />
      <View className="flex-row flex-wrap items-center justify-between gap-2 border-b border-gray-200 px-3 py-2">
        <View className="flex-row items-center gap-2">
          <View className="h-8 w-8 items-center justify-center rounded-xl bg-primary"><Ionicons name="location-outline" size={18} color="white" /></View>
          <View><Text className="text-sm font-bold text-gray-900">PubMark</Text><Text className="text-[10px] text-gray-400">Browse Available Stalls</Text></View>
        </View>
        <View className="flex-row gap-2">
          <Action icon="log-in-outline" onPress={() => authenticate("Login")}>Log In</Action>
          <Action icon="person-add-outline" primary onPress={() => authenticate("Register")}>Register</Action>
        </View>
      </View>

      <View className="flex-row flex-wrap items-center gap-2 bg-gray-50 px-3 py-2">
        {["1", "2"].map((f) => <Action key={f} primary={floor === f} onPress={() => { setFloor(f); setSelectedId(null); setNotice(""); }}>{f}F {allStalls.filter((s) => s.floor === f).length}</Action>)}
        <Action icon="checkbox-outline" primary={multi} onPress={() => { setMulti(!multi); setSelectedIds(new Set()); setSelectedId(null); setNotice(""); }}>{multi ? "Cancel" : "Select Multiple"}</Action>
        {!query.loading && !query.error ? <View className="flex-row flex-wrap gap-3">
          <Count label="Vacant" color="#14B8A6" count={stalls.filter((s) => !styleInputs[s.id].occupied && !styleInputs[s.id].pending).length} />
          <Count label="Pending" color="#f59e0b" count={stalls.filter((s) => styleInputs[s.id].pending).length} />
          <Count label="Occupied" color="#9ca3af" count={stalls.filter((s) => styleInputs[s.id].occupied).length} />
        </View> : null}
      </View>

      {query.loading ? <LoadingState /> : query.error ? (
        <View className="flex-1 justify-center gap-4 px-6"><Text accessibilityRole="alert" className="text-center text-sm text-red-700">{query.error}</Text><Action onPress={query.refetch}>Retry</Action></View>
      ) : (
        <View className="flex-1">
          <StallMap stalls={stalls} selectedId={selectedId} selectedIds={selectedIds} multiSelectMode={multi} onSelect={select} styleInputs={styleInputs} showEmptyMap />
          {!stalls.length ? <View pointerEvents="none" className="absolute inset-x-6 top-6 rounded-2xl bg-white p-5"><Text className="text-center text-sm font-semibold text-gray-700">No stalls on {floor}F</Text><Text className="mt-1 text-center text-xs text-gray-500">Try the other floor or check back later.</Text></View> : null}
        </View>
      )}
      {notice ? <Text accessibilityRole="alert" className="bg-amber-50 px-4 py-2 text-xs text-amber-800">{notice}</Text> : null}
      {multi && targets.length > 0 && !query.error ? <View className="border-t border-gray-200 p-3"><Action primary onPress={() => setApplicationTargets(targets)}>Apply to {targets.length} Stall{targets.length === 1 ? "" : "s"}</Action></View> : null}

      {!multi && selected && !query.error ? (
        <ScrollView style={{ maxHeight: "45%" }} contentContainerStyle={{ padding: 16 }} className="border-t border-gray-200 bg-white">
          <View className="flex-row items-start justify-between gap-2">
            <View className="flex-1"><Text className="text-base font-bold text-gray-900">{selected.stall_name}</Text><Text className="mt-1 text-xs text-gray-500">Section {selected.section} · {floor}F{selected.floor_area ? ` · ${selected.floor_area}` : ""}</Text></View>
            <Pressable accessibilityRole="button" accessibilityLabel="Close stall details" onPress={() => setSelectedId(null)} className="h-11 w-11 items-center justify-center"><Ionicons name="close" size={20} color="#6b7280" /></Pressable>
          </View>
          <Text className="mb-2 text-sm font-semibold" style={{ color: status.occupied ? "#6b7280" : status.pending ? "#b45309" : "#0d9488" }}>{status.occupied ? "Occupied" : status.pending ? "Application pending" : "Available"}</Text>
          <ScrollView horizontal className="mb-3">
            {(selected.images ?? []).filter((img) => img.url).map((img, index, gallery) => <Pressable key={img.id ?? index} accessibilityRole="button" accessibilityLabel={`View stall photo ${index + 1}`} onPress={() => setViewer({ images: gallery, index })}><Image source={{ uri: img.url }} className="mr-2 h-20 w-20 rounded-xl" /></Pressable>)}
          </ScrollView>
          <Text className="mb-3 text-sm text-gray-600">{status.occupied ? "This stall is currently occupied." : status.pending ? "Someone has applied. You can still apply until the admin decides." : `${selected.business_type || "General"} · Open for applications`}</Text>
          {!status.occupied ? <Action primary onPress={() => setApplicationTargets([selected])}>Apply for This Stall</Action> : null}
        </ScrollView>
      ) : null}

      <Modal visible={!!applicationTargets} transparent animationType="fade" onRequestClose={() => setApplicationTargets(null)}>
        <SafeAreaView className="flex-1 justify-center bg-black/40 px-6">
          <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}>
            <View className="gap-3 rounded-2xl bg-white p-6">
              <Text className="text-center text-lg font-bold text-gray-900">Account Required</Text>
              <Text className="mb-2 text-center text-sm leading-5 text-gray-500">You need an account to apply for {applicationTargets?.length > 1 ? `these ${applicationTargets.length} stalls` : "a stall"}. Create an account or log in to continue.</Text>
              <Action primary onPress={() => authenticate("Register", applicationTargets)}>Create Account</Action>
              <Action onPress={() => authenticate("Login", applicationTargets)}>Log In</Action>
              <Action onPress={() => setApplicationTargets(null)}>Cancel</Action>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
      <ImageViewerModal images={viewer?.images ?? []} startIndex={viewer?.index ?? 0} onClose={() => setViewer(null)} />
    </SafeAreaView>
  );
}

function Count({ count, label, color }) {
  return <View className="flex-row items-center gap-1 py-1"><View className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} /><Text className="text-xs text-gray-600">{count} {label}</Text></View>;
}
