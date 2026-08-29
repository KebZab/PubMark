import { Pressable, ScrollView, Text, View } from "react-native";
import type { Stall } from "../services/types";
import type { StallStyleInput } from "./StallMap";

// The native version renders Leaflet inside a WebView. In a plain browser we're
// already in a web page, so rather than nest one, the web build shows the same
// stalls as a tappable list with matching status colors.

function labelFor(input: StallStyleInput) {
  if (input.userAppStatus === "approved") return { text: "Yours", dot: "#6366f1" };
  if (input.userAppStatus === "pending") return { text: "Pending", dot: "#f59e0b" };
  if (input.occupied) return { text: "Occupied", dot: "#9ca3af" };
  return { text: "Available", dot: "#14B8A6" };
}

export default function StallMap({
  stalls,
  selectedId,
  onSelect,
  styleInputs = {},
}: {
  stalls: Stall[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  styleInputs?: Record<string, StallStyleInput>;
}) {
  return (
    <View className="flex-1">
      <View className="border-b border-amber-200 bg-amber-50 px-4 py-2.5">
        <Text className="text-[11px] leading-4 text-amber-800">
          The map renders on a phone — showing a stall list here instead.
        </Text>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, gap: 10 }}>
        {stalls.map((stall) => {
          const l = labelFor(styleInputs[stall.id] ?? {});
          const selected = stall.id === selectedId;
          return (
            <Pressable
              key={stall.id}
              onPress={() => onSelect(stall.id)}
              className={`flex-row items-center rounded-2xl border bg-white p-4 ${
                selected ? "border-blue-500" : "border-gray-200"
              }`}
            >
              <View style={{ backgroundColor: l.dot }} className="mr-3 h-2.5 w-2.5 rounded-full" />
              <View className="flex-1">
                <Text className="text-sm font-semibold text-gray-900">{stall.stall_name}</Text>
                <Text className="mt-0.5 text-xs text-gray-500">
                  Section {stall.section} · {stall.business_type}
                </Text>
              </View>
              <Text className="text-[10px] font-semibold" style={{ color: l.dot }}>
                {l.text}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}
