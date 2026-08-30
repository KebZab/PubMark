import { useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useApiData } from "../../hooks/useApiData";
import { getStalls, getViolations } from "../../services/api";
import { ErrorState, LoadingState, OfficerHeader } from "../../components/ui";
import StallMap from "../../components/StallMap";
import type { StallStyleInput } from "../../components/StallMap";
import type { Stall } from "../../services/types";

const FLOORS = ["1", "2"] as const;

// Officers care about a different thing than vendors do: which stalls have
// open violations. Reusing the same map component, but the "occupied" flag is
// repurposed to mean "has an open violation" so problem stalls stand out.
export default function OfficerMapScreen() {
  const stallsQuery = useApiData(getStalls);
  const violationsQuery = useApiData(getViolations);
  const [floor, setFloor] = useState<(typeof FLOORS)[number]>("1");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const allStalls = stallsQuery.data?.stalls ?? [];
  const violations = violationsQuery.data?.violations ?? [];

  const stalls = useMemo<Stall[]>(() => allStalls.filter((s) => s.floor === floor), [allStalls, floor]);

  const openByStall = useMemo(() => {
    const map: Record<string, number> = {};
    for (const v of violations) {
      if (v.status === "open") map[v.stallId] = (map[v.stallId] ?? 0) + 1;
    }
    return map;
  }, [violations]);

  const styleInputs = useMemo<Record<string, StallStyleInput>>(() => {
    const map: Record<string, StallStyleInput> = {};
    for (const s of allStalls) {
      // Grey (the "occupied" style) marks stalls with open violations.
      map[s.id] = { occupied: (openByStall[s.id] ?? 0) > 0 };
    }
    return map;
  }, [allStalls, openByStall]);

  const counts = useMemo(
    () => ({
      1: allStalls.filter((s) => s.floor === "1").length,
      2: allStalls.filter((s) => s.floor === "2").length,
    }),
    [allStalls]
  );

  const selected = stalls.find((s) => s.id === selectedId) ?? null;
  const selectedOpen = selected ? openByStall[selected.id] ?? 0 : 0;
  const loading = stallsQuery.loading || violationsQuery.loading;
  const error = stallsQuery.error ?? violationsQuery.error;

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={["top"]}>
      <OfficerHeader title="Stall Map" subtitle={`${Object.keys(openByStall).length} stall(s) with open violations`} />

      <View className="flex-row items-center gap-2 border-b border-gray-200 bg-white px-4 py-3">
        {FLOORS.map((f) => {
          const active = floor === f;
          return (
            <Pressable
              key={f}
              onPress={() => { setFloor(f); setSelectedId(null); }}
              className={`flex-row items-center gap-1.5 rounded-full px-3 py-1.5 ${active ? "bg-amber-500" : "bg-gray-100"}`}
            >
              <Text className={`text-xs font-semibold ${active ? "text-white" : "text-gray-600"}`}>{f}F</Text>
              <Text className={`text-[10px] ${active ? "text-amber-100" : "text-gray-400"}`}>{counts[f]}</Text>
            </Pressable>
          );
        })}
        <Text className="ml-auto text-[11px] text-gray-400">
          {Object.keys(openByStall).length} with open violations
        </Text>
      </View>

      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} />
      ) : stalls.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-sm font-semibold text-gray-700">No stalls on {floor}F</Text>
          <Text className="mt-1.5 text-center text-xs leading-5 text-gray-400">
            Try the other floor.
          </Text>
        </View>
      ) : (
        <StallMap stalls={stalls} selectedId={selectedId} onSelect={setSelectedId} styleInputs={styleInputs} />
      )}

      <View className="flex-row gap-4 border-t border-gray-200 bg-white px-4 py-2.5">
        <Legend color="#14B8A6" label="No open violations" />
        <Legend color="#9ca3af" label="Has open violations" />
      </View>

      {selected ? (
        <View className="absolute inset-x-3 bottom-24 rounded-2xl border border-gray-200 bg-white p-4 shadow-lg">
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

          <View
            className={`mt-3 rounded-xl px-3 py-2.5 ${selectedOpen > 0 ? "bg-red-50" : "bg-emerald-50"}`}
          >
            <Text className={`text-xs leading-5 ${selectedOpen > 0 ? "text-red-800" : "text-emerald-800"}`}>
              {selectedOpen > 0
                ? `${selectedOpen} open violation${selectedOpen > 1 ? "s" : ""} on this stall. See the Violations tab.`
                : "No open violations on this stall."}
            </Text>
          </View>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <View className="flex-row items-center gap-1.5">
      <View style={{ backgroundColor: color }} className="h-2.5 w-2.5 rounded-full" />
      <Text className="text-[11px] text-gray-500">{label}</Text>
    </View>
  );
}
