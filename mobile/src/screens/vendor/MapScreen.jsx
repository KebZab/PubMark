import { useCallback, useMemo, useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";
import { useApiData } from "../../hooks/useApiData";
import { getApplications, getStallReservations, getStalls } from "../../services/api";
import { ErrorState, LoadingState } from "../../components/ui";
import StallMap from "../../components/StallMap";

const FLOORS = ["1", "2"];

export default function MapScreen({ navigation }) {
  const { user } = useAuth();
  const stallsQuery = useApiData(getStalls);
  const appsQuery = useApiData(getApplications);
  // GET /applications only returns this vendor's own rows, so it can't say
  // whether some other stall is taken — occupied-stalls fills that gap with
  // no personal data attached. Without it, every stall approved for someone
  // else looked "Available" here even though it wasn't.
  const reservationsQuery = useApiData(getStallReservations);

  // The tab navigator keeps this screen mounted when you leave it, so
  // submitting an application and coming back doesn't remount it — its data
  // would otherwise stay exactly as it was before you applied. Refetch every
  // time the tab gains focus, catching that plus any admin decision made
  // while you were away.
  useFocusEffect(
    useCallback(() => {
      appsQuery.refetch();
      reservationsQuery.refetch();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );
  const [floor, setFloor] = useState("1");
  const [selectedId, setSelectedId] = useState(null);
  // Same "Select Multiple" flow as the web vendor map: toggle it on, tap
  // several stalls, then apply to all of them in one go.
  const [multiSelectMode, setMultiSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());

  const allStalls = stallsQuery.data?.stalls ?? [];
  const applications = appsQuery.data?.applications ?? [];
  const occupiedStallIds = useMemo(
    () => new Set(reservationsQuery.data?.approved ?? []),
    [reservationsQuery.data],
  );
  const pendingStallIds = useMemo(
    () => new Set(reservationsQuery.data?.pending ?? []),
    [reservationsQuery.data],
  );

  const stalls = useMemo(() => allStalls.filter((s) => s.floor === floor), [allStalls, floor]);

  // Colour each stall the way the web vendor map does: your own approved
  // stall, your pending application, someone else's approved/pending
  // application, or available. A stall someone else applied for reads as
  // "pending" for every vendor, not just for whoever applied first — it
  // still accepts more applications until admin decides.
  const styleInputs = useMemo(() => {
    const map = {};
    for (const stall of allStalls) {
      const mine = applications
        .filter((a) => a.stallId === stall.id && a.status !== "rejected" && a.userId === user?.id)
        .sort((a, b) => new Date(b.dateApplied).getTime() - new Date(a.dateApplied).getTime())[0];
      const occupied = occupiedStallIds.has(stall.id);
      map[stall.id] = {
        userAppStatus: mine ? mine.status : null,
        occupied,
        pending: !occupied && pendingStallIds.has(stall.id),
      };
    }
    return map;
  }, [allStalls, applications, occupiedStallIds, pendingStallIds, user]);

  const counts = useMemo(
    () => ({
      1: allStalls.filter((s) => s.floor === "1").length,
      2: allStalls.filter((s) => s.floor === "2").length,
    }),
    [allStalls],
  );

  const selected = stalls.find((s) => s.id === selectedId) ?? null;
  const selectedStyle = selected ? (styleInputs[selected.id] ?? {}) : {};
  const loading = stallsQuery.loading || appsQuery.loading;
  const error = stallsQuery.error ?? appsQuery.error;

  function goToApplyForm(targetStalls) {
    navigation.navigate("ApplyForStall", {
      // Always an array, one entry or several — one form shape for both.
      stalls: targetStalls.map((s) => ({
        id: s.id,
        name: s.stall_name,
        businessType: s.business_type,
      })),
    });
  }

  function handleSelectStall(id) {
    if (!multiSelectMode) {
      setSelectedId((prev) => (prev === id ? null : id));
      return;
    }
    const input = styleInputs[id] ?? {};
    // Blocks the same stalls the single-select detail sheet blocks: taken by
    // someone else, or already applied for by this vendor. A stall someone
    // else merely has *pending* stays selectable — it still accepts more
    // applications until admin decides.
    if (input.occupied || input.userAppStatus) {
      Alert.alert("Not available", "That stall can't be added to your selection.");
      return;
    }
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleMultiSelect() {
    setMultiSelectMode((prev) => !prev);
    setSelectedIds(new Set());
    setSelectedId(null);
  }

  function applyToSelection() {
    const targets = stalls.filter((s) => selectedIds.has(s.id));
    if (targets.length === 0) return;
    goToApplyForm(targets);
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={["top"]}>
      {/* Floor switcher — same 1F / 2F control as the web map */}
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
              className={`flex-row items-center gap-1.5 rounded-full px-3 py-1.5 ${active ? "bg-primary" : "bg-gray-100"}`}
            >
              <Text className={`text-xs font-semibold ${active ? "text-white" : "text-gray-600"}`}>{f}F</Text>
              <Text className={`text-[10px] ${active ? "text-primary-light" : "text-gray-400"}`}>
                {counts[f]}
              </Text>
            </Pressable>
          );
        })}
        <Pressable
          onPress={toggleMultiSelect}
          className={`ml-auto flex-row items-center gap-1.5 rounded-full border px-3 py-1.5 ${
            multiSelectMode ? "border-primary bg-primary-surface" : "border-gray-200 bg-white"
          }`}
        >
          <Ionicons
            name="checkbox-outline"
            size={14}
            color={multiSelectMode ? "#0d9488" : "#4b5563"}
          />
          <Text
            className={`text-xs font-semibold ${multiSelectMode ? "text-primary-darker" : "text-gray-600"}`}
          >
            {multiSelectMode ? "Cancel" : "Select Multiple"}
          </Text>
        </Pressable>
      </View>

      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} />
      ) : stalls.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-sm font-semibold text-gray-700">No stalls on {floor}F</Text>
          <Text className="mt-1.5 text-center text-xs leading-5 text-gray-400">
            Try the other floor, or check back once the market office has mapped this one.
          </Text>
        </View>
      ) : (
        <StallMap
          stalls={stalls}
          selectedId={selectedId}
          selectedIds={selectedIds}
          multiSelectMode={multiSelectMode}
          onSelect={handleSelectStall}
          styleInputs={styleInputs}
        />
      )}

      {/* Legend — same states as the web vendor map. Amber covers both "your
          application is pending" and "someone else's is" — the map can't
          tell those apart at a glance, only the detail sheet spells out which. */}
      <View className="flex-row flex-wrap gap-x-4 gap-y-1 border-t border-gray-200 bg-white px-4 py-2.5">
        <Legend color="#14B8A6" label="Available" />
        <Legend color="#f59e0b" label="Pending" />
        <Legend color="#6366f1" label="Yours" />
        <Legend color="#ef4444" label="Occupied" />
      </View>

      {/* Multi-select action bar */}
      {multiSelectMode && selectedIds.size > 0 ? (
        <View className="absolute inset-x-3 bottom-24 flex-row items-center gap-2.5 rounded-2xl border border-gray-200 bg-white p-3 shadow-lg">
          <View className="rounded-xl bg-primary px-3 py-2">
            <Text className="text-xs font-semibold text-white">{selectedIds.size} selected</Text>
          </View>
          <Pressable
            onPress={applyToSelection}
            className="flex-1 flex-row items-center justify-center rounded-xl bg-primary py-2.5"
          >
            <Text className="text-sm font-semibold text-white">
              Apply to {selectedIds.size} Stall{selectedIds.size === 1 ? "" : "s"}
            </Text>
            <Ionicons name="chevron-forward" size={16} color="#ffffff" />
          </Pressable>
        </View>
      ) : null}

      {/* Selected stall detail sheet (single-select only) */}
      {!multiSelectMode && selected ? (
        <View className="absolute inset-x-3 bottom-24 rounded-2xl border border-gray-200 bg-white p-4 shadow-lg">
          <View className="flex-row items-start justify-between">
            <View className="flex-1 pr-3">
              <Text className="text-base font-semibold text-gray-900">{selected.stall_name}</Text>
              <Text className="mt-0.5 text-xs text-gray-500">
                Section {selected.section} · {selected.floor}F
                {selected.floor_area ? ` · ${selected.floor_area}` : ""}
              </Text>
            </View>
            <Pressable onPress={() => setSelectedId(null)} hitSlop={10} className="px-2">
              <Text className="text-xs font-medium text-gray-400">Close</Text>
            </Pressable>
          </View>

          <View className="mt-3 border-t border-gray-100 pt-3">
            <DetailRow label="Business type" value={selected.business_type} />
            {selected.notes ? <DetailRow label="Notes" value={selected.notes} /> : null}
          </View>

          {selectedStyle.userAppStatus === "approved" ? (
            <Note tone="indigo" text="This is your stall." />
          ) : selectedStyle.userAppStatus === "pending" ? (
            <Note tone="amber" text="Your application for this stall is awaiting review." />
          ) : selectedStyle.occupied ? (
            <Note tone="red" text="This stall is currently taken by another vendor." />
          ) : (
            <>
              {selectedStyle.pending ? (
                <Note tone="amber" text="Another vendor has applied — admin hasn't decided yet. You can still apply." />
              ) : null}
              <Pressable
                onPress={() => goToApplyForm([selected])}
                className="mt-3 items-center rounded-xl bg-primary py-3.5"
              >
                <Text className="text-sm font-semibold text-white">Apply for this stall</Text>
              </Pressable>
            </>
          )}
        </View>
      ) : null}
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

function Note({ tone, text }) {
  const styles = {
    teal: "bg-primary-surface text-primary-darker",
    amber: "bg-amber-50 text-amber-800",
    indigo: "bg-indigo-50 text-indigo-800",
    red: "bg-red-50 text-red-700",
  }[tone];
  const [bg, fg] = styles.split(" ");
  return (
    <View className={`mt-3 rounded-xl px-3 py-2.5 ${bg}`}>
      <Text className={`text-xs leading-5 ${fg}`}>{text}</Text>
    </View>
  );
}

function DetailRow({ label, value }) {
  return (
    <View className="flex-row justify-between py-1">
      <Text className="text-xs text-gray-400">{label}</Text>
      <Text className="flex-1 text-right text-xs font-medium capitalize text-gray-700">{value}</Text>
    </View>
  );
}
