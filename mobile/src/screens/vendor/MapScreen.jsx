import { useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../context/AuthContext";
import { useApiData } from "../../hooks/useApiData";
import { getApplications, getStalls } from "../../services/api";
import { ErrorState, LoadingState } from "../../components/ui";
import StallMap from "../../components/StallMap";

const FLOORS = ["1", "2"];

export default function MapScreen({ navigation }) {
  const { user } = useAuth();
  const stallsQuery = useApiData(getStalls);
  const appsQuery = useApiData(getApplications);
  const [floor, setFloor] = useState("1");
  const [selectedId, setSelectedId] = useState(null);

  const allStalls = stallsQuery.data?.stalls ?? [];
  const applications = appsQuery.data?.applications ?? [];

  const stalls = useMemo(() => allStalls.filter((s) => s.floor === floor), [allStalls, floor]);

  // Colour each stall the way the web vendor map does: your own approved stall,
  // your pending application, someone else's stall, or available.
  const styleInputs = useMemo(() => {
    const map = {};
    for (const stall of allStalls) {
      const onThisStall = applications.filter((a) => a.stallId === stall.id && a.status !== "rejected");
      const mine = onThisStall
        .filter((a) => a.userId === user?.id)
        .sort((a, b) => new Date(b.dateApplied).getTime() - new Date(a.dateApplied).getTime())[0];
      map[stall.id] = {
        userAppStatus: mine ? mine.status : null,
        occupied: onThisStall.some((a) => a.status === "approved"),
      };
    }
    return map;
  }, [allStalls, applications, user]);

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
        <Text className="ml-auto text-[11px] text-gray-400">{stalls.length} on this floor</Text>
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
          onSelect={setSelectedId}
          styleInputs={styleInputs}
        />
      )}

      {/* Legend — same four states as the web vendor map */}
      <View className="flex-row flex-wrap gap-x-4 gap-y-1 border-t border-gray-200 bg-white px-4 py-2.5">
        <Legend color="#14B8A6" label="Available" />
        <Legend color="#f59e0b" label="Your pending" />
        <Legend color="#6366f1" label="Yours" />
        <Legend color="#9ca3af" label="Occupied" />
      </View>

      {/* Selected stall detail sheet */}
      {selected ? (
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
            <Note tone="gray" text="This stall is currently taken by another vendor." />
          ) : (
            <Pressable
              onPress={() =>
                navigation.navigate("ApplyForStall", {
                  stallId: selected.id,
                  stallName: selected.stall_name,
                })
              }
              className="mt-3 items-center rounded-xl bg-primary py-3.5"
            >
              <Text className="text-sm font-semibold text-white">Apply for this stall</Text>
            </Pressable>
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
    gray: "bg-gray-100 text-gray-600",
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
